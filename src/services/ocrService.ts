import { createWorker, Worker } from 'tesseract.js';
import EmailParser from './parsers/emailParser';
import PhoneParser from './parsers/phoneParser';
import NameParser from './parsers/nameParser';
import CompanyParser from './parsers/companyParser';

export interface OCRResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }>;
}

export interface LayoutAnalysis {
  topLines: Array<{text: string, bbox: any, score: number}>;      // Lines in top 1/3 of card
  middleLines: Array<{text: string, bbox: any, score: number}>;   // Lines in middle 1/3  
  bottomLines: Array<{text: string, bbox: any, score: number}>;   // Lines in bottom 1/3
  largestText: Array<{text: string, bbox: any, size: number}>;    // Biggest text (likely names)
  allLines: Array<{text: string, bbox: any, position: string}>;   // All text with position data
  cardHeight: number;
  cardWidth: number;
}

export interface FieldCandidate {
  text: string;
  confidence: number;
  source: 'pattern' | 'layout' | 'context';
  priority: number;
  reasons: string[];
}

export interface ContactData {
  name?: string;
  title?: string;        // Job title/designation
  company?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: {           // Address components
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    full?: string;      // Complete address string
  };
  raw_text: string;
  confidence: number;
  fieldConfidences?: {   // Individual field confidence scores
    name?: number;
    title?: number;
    company?: number;
    phone?: number;
    email?: number;
    website?: number;
    address?: number;
  };
}

class OCRService {
  private worker: Worker | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Mobile-optimized worker creation
      this.worker = await createWorker('eng');
      
      await this.worker.setParameters({
        tessedit_pageseg_mode: 6 as any, // Uniform block of text
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@.-()+ ',
        // Mobile optimizations
        tessedit_ocr_engine_mode: 1 as any, // Neural nets LSTM engine only
      });
      this.isInitialized = true;
      console.log('OCR initialized successfully');
    } catch (error) {
      console.error('OCR initialization failed:', error);
      throw new Error(`Failed to initialize OCR: ${error}`);
    }
  }

  async processImage(imageData: string | File | HTMLCanvasElement | Blob): Promise<ContactData> {
    if (!this.worker || !this.isInitialized) {
      await this.initialize();
    }

    if (!this.worker) {
      throw new Error('OCR worker not initialized');
    }

    try {
      console.log('Starting OCR processing...');
      
      // Add timeout for mobile devices
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('OCR timeout - processing took too long')), 30000);
      });
      
      const ocrPromise = this.worker.recognize(imageData);
      const { data } = await Promise.race([ocrPromise, timeoutPromise]) as any;
      
      console.log('OCR completed, text length:', data.text.length);
      console.log('OCR confidence:', data.confidence);
      
      const ocrResult: OCRResult = {
        text: data.text,
        confidence: data.confidence,
        words: (data as any).words?.map((word: any) => ({
          text: word.text,
          confidence: word.confidence,
          bbox: word.bbox
        })) || []
      };

      // Use hybrid smart layout analysis
      return this.parseContactDataWithLayout(ocrResult);
    } catch (error) {
      console.error('OCR processing error:', error);
      throw new Error(`OCR processing failed: ${error}`);
    }
  }

  private parseContactDataWithLayout(ocrResult: OCRResult): ContactData {
    const text = ocrResult.text;
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    console.log('🧠 Smart Layout Analysis starting...');
    
    try {
      // Step 1: Analyze visual layout using bounding boxes
      const layoutAnalysis = this.analyzeCardLayout(ocrResult);
      
      // Step 2: Use hybrid approach for field detection
      const contactData = this.detectFieldsWithLayout(layoutAnalysis, lines, text);
      
      console.log('🎯 Smart Layout Analysis completed');
      return contactData;
      
    } catch (error) {
      console.warn('Smart layout analysis failed, falling back to basic parsing:', error);
      return this.parseContactDataBasic(ocrResult);
    }
  }

  private analyzeCardLayout(ocrResult: OCRResult): LayoutAnalysis {
    const { words } = ocrResult;
    
    if (!words || words.length === 0) {
      throw new Error('No word data available for layout analysis');
    }

    // Calculate card dimensions from bounding boxes
    const allBboxes = words.map(w => w.bbox);
    const minX = Math.min(...allBboxes.map(b => b.x0));
    const maxX = Math.max(...allBboxes.map(b => b.x1));
    const minY = Math.min(...allBboxes.map(b => b.y0));
    const maxY = Math.max(...allBboxes.map(b => b.y1));
    
    const cardWidth = maxX - minX;
    const cardHeight = maxY - minY;
    
    console.log(`📏 Card dimensions: ${cardWidth}x${cardHeight}`);
    
    // Define vertical sections (thirds)
    const topThird = minY + (cardHeight / 3);
    const bottomThird = minY + (2 * cardHeight / 3);
    
    // Group words by position
    const topLines: Array<{text: string, bbox: any, score: number}> = [];
    const middleLines: Array<{text: string, bbox: any, score: number}> = [];
    const bottomLines: Array<{text: string, bbox: any, score: number}> = [];
    const allLines: Array<{text: string, bbox: any, position: string}> = [];
    
    // Calculate text sizes and group by position
    const largestText: Array<{text: string, bbox: any, size: number}> = [];
    
    words.forEach(word => {
      if (!word.text.trim()) return;
      
      const centerY = (word.bbox.y0 + word.bbox.y1) / 2;
      const textSize = word.bbox.y1 - word.bbox.y0;
      const score = word.confidence;
      
      // Position classification
      let position = 'middle';
      if (centerY <= topThird) {
        position = 'top';
        topLines.push({ text: word.text, bbox: word.bbox, score });
      } else if (centerY >= bottomThird) {
        position = 'bottom';
        bottomLines.push({ text: word.text, bbox: word.bbox, score });
      } else {
        middleLines.push({ text: word.text, bbox: word.bbox, score });
      }
      
      allLines.push({ text: word.text, bbox: word.bbox, position });
      largestText.push({ text: word.text, bbox: word.bbox, size: textSize });
    });
    
    // Sort by text size (largest first)
    largestText.sort((a, b) => b.size - a.size);
    
    console.log(`📊 Layout analysis: ${topLines.length} top, ${middleLines.length} middle, ${bottomLines.length} bottom`);
    
    return {
      topLines,
      middleLines, 
      bottomLines,
      largestText,
      allLines,
      cardHeight,
      cardWidth
    };
  }

  private cleanNameText(text: string): string {
    // Clean OCR artifacts and improve name quality
    let cleaned = text
      .replace(/[^A-Za-z\s]/g, '') // Remove non-letter characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Capitalize first letter of each word
    cleaned = cleaned.split(' ')
      .filter(word => word.length > 0)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    console.log(`🧹 Name cleaning: "${text}" → "${cleaned}"`);
    return cleaned;
  }

  private cleanCompanyText(text: string): string {
    // Clean OCR artifacts while preserving business name structure
    let cleaned = text
      .replace(/[^\w\s&.,'-]/g, '') // Keep business-friendly characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\b\d+\b/g, '') // Remove standalone numbers
      .replace(/\s+/g, ' ') // Clean up extra spaces after number removal
      .trim();
    
    // Basic capitalization for business names
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
    
    console.log(`🧹 Company cleaning: "${text}" → "${cleaned}"`);
    return cleaned;
  }

  private detectNameFromEmail(contactData: ContactData): void {
    if (!contactData.email) return;
    
    // Extract potential name from email prefix
    const emailPrefix = contactData.email.split('@')[0];
    
    // Common email patterns that might contain names
    let potentialName = '';
    
    // Pattern 1: firstname.lastname@domain.com
    if (emailPrefix.includes('.')) {
      const parts = emailPrefix.split('.');
      if (parts.length === 2) {
        const firstName = parts[0];
        const lastName = parts[1];
        // Only use if both parts look like names (letters only, reasonable length)
        if (/^[a-zA-Z]{2,15}$/.test(firstName) && /^[a-zA-Z]{2,15}$/.test(lastName)) {
          potentialName = `${firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()} ${lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase()}`;
        }
      }
    }
    // Pattern 2: firstnamelastname@domain.com or just firstname@domain.com
    else if (/^[a-zA-Z]{2,20}$/.test(emailPrefix)) {
      // If it's a reasonable length and all letters, treat as first name
      potentialName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1).toLowerCase();
    }
    
    if (potentialName) {
      contactData.name = potentialName;
      console.log(`👤 Name detected from email: ${potentialName} (from ${contactData.email})`);
    }
  }

  private detectFieldsWithLayout(layoutAnalysis: LayoutAnalysis, lines: string[], text: string): ContactData {
    const contactData: ContactData = {
      raw_text: text,
      confidence: 75, // Default confidence for layout analysis
      fieldConfidences: {}
    };
    
    console.log('🎯 Structured field detection starting...');
    
    // Step 1: Extract high-confidence fields first (email, phone)
    this.detectContactInfoWithStructure(contactData, text);
    
    // Step 2: Use structured detection with confidence scoring
    this.detectFieldsWithStructure(contactData, layoutAnalysis, lines);
    
    // Step 3: Cross-validate fields to prevent misclassification
    this.validateAndCleanFields(contactData);
    
    console.log('✅ Structured field detection completed');
    return contactData;
  }
  
  private detectNameWithLayout(contactData: ContactData, layout: LayoutAnalysis): void {
    // Only run if we don't already have a name (from email)
    if (contactData.name) {
      console.log(`👤 Name already detected: ${contactData.name}, skipping layout detection`);
      return;
    }
    
    // Names are typically in large text at the top or prominently displayed
    const candidates = layout.largestText.slice(0, 5); // Check more candidates
    const titleKeywords = ['ceo', 'cto', 'cfo', 'president', 'vp', 'director', 'manager', 'senior', 'lead'];
    const businessKeywords = ['llc', 'inc', 'corp', 'company', 'solutions', 'group', 'enterprises', 'ltd', 'limited', 'abhinav'];
    
    // Try to combine fragmented name parts from top section
    const topCandidates = layout.topLines
      .filter(item => {
        const text = item.text.trim().toLowerCase();
        const isBusinessName = businessKeywords.some(kw => text.includes(kw));
        const isCompanyName = text === contactData.company?.toLowerCase();
        
        return item.text.trim().length >= 1 && 
               !item.text.includes('@') && 
               !/\d{3}/.test(item.text) &&
               /^[A-Za-z\s]+$/.test(item.text) &&
               !isBusinessName &&
               !isCompanyName;
      })
      .sort((a, b) => a.bbox.x0 - b.bbox.x0); // Sort by horizontal position
    
    // Try to combine adjacent name fragments
    if (topCandidates.length >= 2) {
      let combinedName = '';
      for (let i = 0; i < Math.min(3, topCandidates.length); i++) {
        const fragment = topCandidates[i].text.trim();
        if (fragment.length >= 1) {
          combinedName += (combinedName ? ' ' : '') + fragment;
        }
      }
      
      // Clean and validate combined name
      const cleanedName = this.cleanNameText(combinedName);
      const lowerCleaned = cleanedName.toLowerCase();
      const isBusinessName = businessKeywords.some(kw => lowerCleaned.includes(kw));
      
      if (cleanedName.length >= 3 && 
          cleanedName.split(' ').length >= 2 && 
          !isBusinessName &&
          cleanedName !== contactData.company) {
        contactData.name = cleanedName;
        console.log(`👤 Name detected (combined fragments): ${cleanedName}`);
        return;
      }
    }
    
    // Fallback to individual candidates
    for (const candidate of candidates) {
      const text = candidate.text.trim();
      const lowerText = text.toLowerCase();
      
      // Skip if contains title keywords, emails, phones, or business terms
      const isBusinessName = businessKeywords.some(kw => lowerText.includes(kw));
      const isCompanyName = text === contactData.company;
      
      if (titleKeywords.some(kw => lowerText.includes(kw)) ||
          text.includes('@') ||
          /\d{3}/.test(text) ||
          text.length < 2 || text.length > 50 ||
          isBusinessName ||
          isCompanyName) {
        continue;
      }
      
      // Accept names with proper case patterns or reasonable text
      if (/^[A-Z][a-z]+ [A-Z][a-z]+/.test(text) || 
          (text.length >= 3 && /^[A-Za-z\s]+$/.test(text))) {
        const cleanedText = this.cleanNameText(text);
        if (cleanedText.length >= 3) {
          contactData.name = cleanedText;
          console.log(`👤 Name detected (layout): ${cleanedText}`);
          break;
        }
      }
    }
  }
  
  private detectTitleWithLayout(contactData: ContactData, layout: LayoutAnalysis): void {
    const titleKeywords = [
      'ceo', 'cto', 'cfo', 'president', 'vice president', 'vp', 'director', 
      'manager', 'senior', 'lead', 'head', 'chief', 'principal', 'associate',
      'coordinator', 'specialist', 'analyst', 'consultant', 'engineer',
      'developer', 'designer', 'architect', 'supervisor', 'executive'
    ];
    
    // Check all lines for title keywords, prioritizing middle section
    const allCandidates = [...layout.middleLines, ...layout.topLines, ...layout.bottomLines];
    
    for (const candidate of allCandidates) {
      const text = candidate.text.trim();
      const lowerText = text.toLowerCase();
      
      if (titleKeywords.some(kw => lowerText.includes(kw)) &&
          text !== contactData.name &&
          !text.includes('@') &&
          text.length > 2 && text.length < 40) {
        contactData.title = text;
        console.log(`💼 Title detected (layout): ${text}`);
        break;
      }
    }
  }
  
  private detectCompanyWithLayout(contactData: ContactData, layout: LayoutAnalysis): void {
    const businessKeywords = ['llc', 'inc', 'corp', 'company', 'solutions', 'group', 'enterprises', 'ltd', 'limited'];
    const titleKeywords = ['ceo', 'cto', 'cfo', 'president', 'vp', 'director', 'manager'];
    
    // Priority 1: Look for business keywords across all sections
    const allCandidates = [...layout.topLines, ...layout.middleLines, ...layout.bottomLines];
    
    for (const candidate of allCandidates) {
      const text = candidate.text.trim();
      const lowerText = text.toLowerCase();
      
      if (businessKeywords.some(kw => lowerText.includes(kw)) &&
          text !== contactData.name &&
          text !== contactData.title &&
          !text.includes('@') &&
          !titleKeywords.some(kw => lowerText.includes(kw))) {
        contactData.company = text;
        console.log(`🏢 Company detected (business keyword): ${text}`);
        return;
      }
    }
    
    // Priority 2: Try to combine company fragments from middle/top sections
    const companyCandidates = [...layout.topLines, ...layout.middleLines]
      .filter(item => {
        const text = item.text.trim();
        return text.length >= 2 && 
               text !== contactData.name &&
               !text.includes('@') && 
               !/\d{3}/.test(text) &&
               !titleKeywords.some(kw => text.toLowerCase().includes(kw));
      })
      .sort((a, b) => a.bbox.x0 - b.bbox.x0); // Sort by horizontal position
    
    // Try to combine company fragments
    if (companyCandidates.length >= 2) {
      let combinedCompany = '';
      for (let i = 0; i < Math.min(3, companyCandidates.length); i++) {
        const fragment = companyCandidates[i].text.trim();
        if (fragment.length >= 1) {
          combinedCompany += (combinedCompany ? ' ' : '') + fragment;
        }
      }
      
      // Clean and validate combined company
      const cleanedCompany = this.cleanCompanyText(combinedCompany);
      if (cleanedCompany.length >= 4 && cleanedCompany !== contactData.name) {
        contactData.company = cleanedCompany;
        console.log(`🏢 Company detected (combined fragments): ${cleanedCompany}`);
        return;
      }
    }
    
    // Priority 3: Look for prominent text that could be company name
    const prominentCandidates = layout.largestText.slice(0, 5);
    
    for (const candidate of prominentCandidates) {
      const text = candidate.text.trim();
      const lowerText = text.toLowerCase();
      
      if (text !== contactData.name &&
          text !== contactData.title &&
          !text.includes('@') &&
          !/\d{3}/.test(text) &&
          !titleKeywords.some(kw => lowerText.includes(kw)) &&
          text.length > 1 && text.length < 60) {
        contactData.company = text;
        console.log(`🏢 Company detected (prominent text): ${text}`);
        return;
      }
    }
  }
  
  private detectContactInfoWithLayout(contactData: ContactData, layout: LayoutAnalysis, text: string): void {
    // Email detection
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const emailMatch = text.match(emailRegex);
    if (emailMatch) {
      contactData.email = emailMatch[0];
      console.log(`📧 Email detected: ${emailMatch[0]}`);
      
      // Derive website from email domain
      const domain = emailMatch[0].split('@')[1];
      contactData.website = `www.${domain}`;
    }
    
    // Phone detection - prioritize bottom section where contact info usually appears
    const phonePatterns = [
      /\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/,
      /\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/,
      /([0-9]{3})[-.]([0-9]{3})[-.]([0-9]{4})/
    ];
    
    const contactCandidates = [...layout.bottomLines, ...layout.middleLines];
    
    for (const pattern of phonePatterns) {
      for (const candidate of contactCandidates) {
        const phoneMatch = candidate.text.match(pattern);
        if (phoneMatch) {
          contactData.phone = phoneMatch[0].trim();
          console.log(`📞 Phone detected: ${phoneMatch[0]}`);
          return;
        }
      }
    }
  }
  
  private detectAddressWithLayout(contactData: ContactData, lines: string[]): void {
    // Reuse existing address detection logic
    const addressData = this.extractAddress(lines);
    if (addressData) {
      contactData.address = addressData;
      console.log(`📍 Address detected: ${addressData.full || 'partial'}`);
    }
  }

  private parseContactDataBasic(ocrResult: OCRResult): ContactData {
    const text = ocrResult.text;
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    console.log('🚀 Enhanced parsing with enhanced parsers (basic mode)');
    
    const contactData: ContactData = {
      raw_text: text,
      confidence: ocrResult.confidence,
      fieldConfidences: {}
    };

    // Use enhanced email parser
    const emailResults = EmailParser.extractEmails(text);
    const primaryEmail = EmailParser.getPrimaryEmail(emailResults);
    
    if (primaryEmail) {
      contactData.email = primaryEmail.email;
      contactData.fieldConfidences!.email = primaryEmail.confidence;
      contactData.website = EmailParser.deriveWebsite(primaryEmail.email);
      contactData.fieldConfidences!.website = Math.max(80, primaryEmail.confidence - 10);
      console.log(`📧 Enhanced email detected: ${primaryEmail.email} (confidence: ${primaryEmail.confidence}%)`);
    }

    // Use enhanced phone parser
    const phoneResults = PhoneParser.extractPhones(text);
    const primaryPhone = PhoneParser.getPrimaryPhone(phoneResults);
    
    if (primaryPhone) {
      contactData.phone = primaryPhone.formatted;
      contactData.fieldConfidences!.phone = primaryPhone.confidence;
      console.log(`📞 Enhanced phone detected: ${primaryPhone.formatted} (confidence: ${primaryPhone.confidence}%)`);
    }

    // Use enhanced name parser
    const nameResult = NameParser.extractName(text);
    if (nameResult) {
      contactData.name = nameResult.name;
      contactData.fieldConfidences!.name = nameResult.confidence;
      
      // If a title was separated from the name, use it
      if (nameResult.title) {
        contactData.title = nameResult.title;
        contactData.fieldConfidences!.title = Math.max(70, nameResult.confidence - 10);
      }
      
      console.log(`👤 Enhanced name detected: ${nameResult.name} (confidence: ${nameResult.confidence}%)`);
      if (nameResult.title) {
        console.log(`💼 Title separated from name: ${nameResult.title}`);
      }
    }

    // Use enhanced company parser (exclude detected name and title to avoid confusion)
    const companyResult = CompanyParser.extractCompany(text, contactData.name, contactData.title);
    if (companyResult) {
      contactData.company = companyResult.company;
      contactData.fieldConfidences!.company = companyResult.confidence;
      console.log(`🏢 Enhanced company detected: ${companyResult.company} (confidence: ${companyResult.confidence}%)`);
    }

    // Fallback title detection if not already detected
    if (!contactData.title) {
      const titleKeywords = [
        'ceo', 'cto', 'cfo', 'president', 'vice president', 'vp', 'director', 
        'manager', 'senior', 'lead', 'head', 'chief', 'principal', 'associate',
        'coordinator', 'specialist', 'analyst', 'consultant', 'engineer',
        'developer', 'designer', 'architect', 'supervisor', 'executive',
        'marketing director', 'senior software engineer', 'software engineer'
      ];

      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        const hasTitle = titleKeywords.some(keyword => lowerLine.includes(keyword));
        
        if (hasTitle && 
            line !== contactData.name && 
            line !== contactData.company &&
            !line.includes('@') && 
            !line.match(/[0-9]{3}/) &&
            line.length > 2 && 
            line.length < 50) {
          contactData.title = line;
          contactData.fieldConfidences!.title = 75;
          console.log(`💼 Fallback title detected: ${line}`);
          break;
        }
      }
    }

    // Address detection
    const addressData = this.extractAddress(lines);
    if (addressData) {
      contactData.address = addressData;
      console.log(`Address detected: ${addressData.full || 'partial'}`);
    }

    return contactData;
  }

  private extractAddress(lines: string[]): ContactData['address'] | null {
    // Common address patterns
    const zipPattern = /\b\d{5}(-\d{4})?\b/;
    const streetPatterns = [
      /\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|way|place|pl|court|ct)\b/i,
      /\d+\s+[\w\s]+\b/
    ];

    let address: ContactData['address'] = {};
    let addressLines: string[] = [];

    // Look for ZIP code first (most reliable indicator)
    for (const line of lines) {
      const zipMatch = line.match(zipPattern);
      if (zipMatch) {
        address.zip = zipMatch[0];
        
        // Extract city and state from the same line
        const beforeZip = line.substring(0, line.indexOf(zipMatch[0])).trim();
        const stateMatch = beforeZip.match(/([A-Z]{2})\s*$/);
        if (stateMatch) {
          address.state = stateMatch[1];
          const cityPart = beforeZip.substring(0, beforeZip.lastIndexOf(stateMatch[1])).trim();
          if (cityPart.endsWith(',')) {
            address.city = cityPart.slice(0, -1).trim();
          } else {
            address.city = cityPart;
          }
        }
        addressLines.push(line);
        break;
      }
    }

    // Look for street address
    for (const line of lines) {
      if (addressLines.includes(line)) continue;
      
      for (const pattern of streetPatterns) {
        if (pattern.test(line)) {
          address.street = line;
          addressLines.push(line);
          break;
        }
      }
      if (address.street) break;
    }

    // If we found any address components, create full address
    if (address.street || address.city || address.zip) {
      const fullParts: string[] = [];
      if (address.street) fullParts.push(address.street);
      if (address.city) {
        let cityState = address.city;
        if (address.state) cityState += `, ${address.state}`;
        if (address.zip) cityState += ` ${address.zip}`;
        fullParts.push(cityState);
      }
      address.full = fullParts.join(', ');
      
      return address;
    }

    return null;
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }

  getConfidenceThreshold(): number {
    return 60; // Minimum confidence level for reliable OCR
  }

  isHighConfidence(confidence: number): boolean {
    return confidence >= this.getConfidenceThreshold();
  }

  // === NEW STRUCTURED FIELD DETECTION METHODS ===
  
  private detectContactInfoWithStructure(contactData: ContactData, text: string): void {
    console.log('🚀 Using enhanced parsers for field detection...');
    
    // Enhanced email detection using new EmailParser
    const emailResults = EmailParser.extractEmails(text);
    const primaryEmail = EmailParser.getPrimaryEmail(emailResults);
    
    if (primaryEmail) {
      contactData.email = primaryEmail.email;
      contactData.fieldConfidences!.email = primaryEmail.confidence;
      contactData.website = EmailParser.deriveWebsite(primaryEmail.email);
      contactData.fieldConfidences!.website = Math.max(80, primaryEmail.confidence - 10);
      console.log(`📧 Enhanced email detected: ${primaryEmail.email} (confidence: ${primaryEmail.confidence}%, primary: ${primaryEmail.isPrimary})`);
    }
    
    // Enhanced phone detection using new PhoneParser
    const phoneResults = PhoneParser.extractPhones(text);
    const primaryPhone = PhoneParser.getPrimaryPhone(phoneResults);
    
    if (primaryPhone) {
      contactData.phone = primaryPhone.formatted;
      contactData.fieldConfidences!.phone = primaryPhone.confidence;
      console.log(`📞 Enhanced phone detected: ${primaryPhone.formatted} (confidence: ${primaryPhone.confidence}%, type: ${primaryPhone.type})`);
    }
  }
  
  private detectFieldsWithStructure(contactData: ContactData, layout: LayoutAnalysis, lines: string[]): void {
    console.log('🔍 Running enhanced structured field detection...');
    
    // Use enhanced name parser
    const nameResult = NameParser.extractName(contactData.raw_text);
    if (nameResult) {
      contactData.name = nameResult.name;
      contactData.fieldConfidences!.name = nameResult.confidence;
      
      // If a title was separated from the name, use it
      if (nameResult.title) {
        contactData.title = nameResult.title;
        contactData.fieldConfidences!.title = Math.max(70, nameResult.confidence - 10);
      }
      
      console.log(`👤 Enhanced name detected: ${nameResult.name} (confidence: ${nameResult.confidence}%)`);
      if (nameResult.title) {
        console.log(`💼 Title separated from name: ${nameResult.title}`);
      }
    }
    
    // Use enhanced company parser (exclude detected name and title to avoid confusion)
    const companyResult = CompanyParser.extractCompany(contactData.raw_text, contactData.name, contactData.title);
    if (companyResult) {
      contactData.company = companyResult.company;
      contactData.fieldConfidences!.company = companyResult.confidence;
      console.log(`🏢 Enhanced company detected: ${companyResult.company} (confidence: ${companyResult.confidence}%, has suffix: ${companyResult.hasBusinessSuffix})`);
    }
    
    // If we don't have a title yet, try to detect one separately
    if (!contactData.title) {
      const titleCandidates = this.getTitleCandidates(layout);
      this.selectBestFieldCandidate(contactData, 'title', titleCandidates);
    }
    
    // Address detection with confidence
    const addressData = this.extractAddress(lines);
    if (addressData) {
      contactData.address = addressData;
      contactData.fieldConfidences!.address = this.calculateAddressConfidence(addressData);
      console.log(`📍 Address detected: ${addressData.full || 'partial'} (confidence: ${contactData.fieldConfidences!.address}%)`);
    }
  }
  
  private getNameCandidates(layout: LayoutAnalysis): FieldCandidate[] {
    const candidates: FieldCandidate[] = [];
    const businessKeywords = ['llc', 'inc', 'corp', 'company', 'solutions', 'group', 'enterprises', 'ltd', 'limited'];
    const titleKeywords = ['ceo', 'cto', 'cfo', 'president', 'vp', 'director', 'manager', 'senior', 'lead'];
    
    // Check largest text first (names often prominent)
    layout.largestText.slice(0, 3).forEach((item, index) => {
      const text = item.text.trim();
      const lowerText = text.toLowerCase();
      
      if (text.length >= 3 && text.length <= 50 &&
          /^[A-Za-z\s\-\.]+$/.test(text) &&
          !text.includes('@') &&
          !/\d{3}/.test(text) &&
          !businessKeywords.some(kw => lowerText.includes(kw)) &&
          !titleKeywords.some(kw => lowerText.includes(kw))) {
        
        let confidence = 60 - (index * 10); // Higher confidence for larger text
        let reasons = [`Large text (rank ${index + 1})`];
        
        // Boost confidence for name-like patterns
        if (/^[A-Z][a-z]+ [A-Z][a-z]+/.test(text)) {
          confidence += 20;
          reasons.push('Proper name pattern');
        }
        
        if (layout.topLines.some(line => line.text === text)) {
          confidence += 10;
          reasons.push('Located in top section');
        }
        
        candidates.push({
          text: this.cleanNameText(text),
          confidence: Math.min(confidence, 95),
          source: 'layout',
          priority: confidence,
          reasons
        });
      }
    });
    
    return candidates.sort((a, b) => b.priority - a.priority);
  }
  
  private getTitleCandidates(layout: LayoutAnalysis): FieldCandidate[] {
    const candidates: FieldCandidate[] = [];
    const titleKeywords = [
      'ceo', 'cto', 'cfo', 'president', 'vice president', 'vp', 'director', 
      'manager', 'senior', 'lead', 'head', 'chief', 'principal', 'associate',
      'coordinator', 'specialist', 'analyst', 'consultant', 'engineer',
      'developer', 'designer', 'architect', 'supervisor', 'executive'
    ];
    
    const allLines = [...layout.middleLines, ...layout.topLines, ...layout.bottomLines];
    
    allLines.forEach(item => {
      const text = item.text.trim();
      const lowerText = text.toLowerCase();
      
      const matchingKeywords = titleKeywords.filter(kw => lowerText.includes(kw));
      
      if (matchingKeywords.length > 0 &&
          text.length > 2 && text.length < 40 &&
          !text.includes('@') &&
          !/\d{3}/.test(text)) {
        
        let confidence = 70 + (matchingKeywords.length * 10);
        const reasons = [`Contains title keywords: ${matchingKeywords.join(', ')}`];
        
        // Boost for middle section (common title placement)
        if (layout.middleLines.includes(item)) {
          confidence += 15;
          reasons.push('Located in middle section');
        }
        
        candidates.push({
          text,
          confidence: Math.min(confidence, 95),
          source: 'pattern',
          priority: confidence,
          reasons
        });
      }
    });
    
    return candidates.sort((a, b) => b.priority - a.priority);
  }
  
  private getCompanyCandidates(layout: LayoutAnalysis): FieldCandidate[] {
    const candidates: FieldCandidate[] = [];
    const businessKeywords = ['llc', 'inc', 'corp', 'company', 'solutions', 'group', 'enterprises', 'ltd', 'limited'];
    const titleKeywords = ['ceo', 'cto', 'cfo', 'president', 'vp', 'director', 'manager'];
    
    const allLines = [...layout.topLines, ...layout.middleLines, ...layout.bottomLines];
    
    allLines.forEach(item => {
      const text = item.text.trim();
      const lowerText = text.toLowerCase();
      
      const matchingBusinessKeywords = businessKeywords.filter(kw => lowerText.includes(kw));
      
      if (text.length > 3 && text.length < 60 &&
          !text.includes('@') &&
          !/\d{3}/.test(text) &&
          !titleKeywords.some(kw => lowerText.includes(kw))) {
        
        let confidence = 50;
        const reasons = [];
        
        // High confidence for business keywords
        if (matchingBusinessKeywords.length > 0) {
          confidence = 85;
          reasons.push(`Contains business keywords: ${matchingBusinessKeywords.join(', ')}`);
        } else {
          // Medium confidence for company-like text
          reasons.push('Potential company name based on length and format');
        }
        
        // Boost for top/middle sections
        if (layout.topLines.includes(item) || layout.middleLines.includes(item)) {
          confidence += 10;
          reasons.push('Located in prominent section');
        }
        
        candidates.push({
          text: this.cleanCompanyText(text),
          confidence: Math.min(confidence, 95),
          source: matchingBusinessKeywords.length > 0 ? 'pattern' : 'layout',
          priority: confidence,
          reasons
        });
      }
    });
    
    return candidates.sort((a, b) => b.priority - a.priority);
  }
  
  private selectBestFieldCandidate(contactData: ContactData, fieldType: 'name' | 'title' | 'company', candidates: FieldCandidate[]): void {
    if (candidates.length === 0) return;
    
    // Filter candidates by minimum confidence threshold
    const validCandidates = candidates.filter(c => c.confidence >= 60);
    
    if (validCandidates.length === 0) {
      console.log(`⚠️  No high-confidence candidates for ${fieldType}`);
      return;
    }
    
    const bestCandidate = validCandidates[0];
    
    // Assign field value and confidence
    switch (fieldType) {
      case 'name':
        contactData.name = bestCandidate.text;
        contactData.fieldConfidences!.name = bestCandidate.confidence;
        break;
      case 'title':
        contactData.title = bestCandidate.text;
        contactData.fieldConfidences!.title = bestCandidate.confidence;
        break;
      case 'company':
        contactData.company = bestCandidate.text;
        contactData.fieldConfidences!.company = bestCandidate.confidence;
        break;
    }
    
    console.log(`✅ ${fieldType.toUpperCase()} detected: "${bestCandidate.text}" (confidence: ${bestCandidate.confidence}%, reasons: ${bestCandidate.reasons.join(', ')})`);
  }
  
  private validateAndCleanFields(contactData: ContactData): void {
    console.log('🔍 Cross-validating fields...');
    
    // Rule 1: Name should not contain title keywords
    if (contactData.name && contactData.title) {
      const titleKeywords = ['ceo', 'cto', 'cfo', 'president', 'vp', 'director', 'manager'];
      const nameLower = contactData.name.toLowerCase();
      
      if (titleKeywords.some(kw => nameLower.includes(kw))) {
        console.log(`⚠️  Name "${contactData.name}" contains title keywords, clearing name`);
        contactData.name = undefined;
        contactData.fieldConfidences!.name = 0;
      }
    }
    
    // Rule 2: Company should not be same as name
    if (contactData.name && contactData.company && 
        contactData.name.toLowerCase() === contactData.company.toLowerCase()) {
      console.log(`⚠️  Company "${contactData.company}" is same as name, clearing company`);
      contactData.company = undefined;
      contactData.fieldConfidences!.company = 0;
    }
    
    // Rule 3: Title should not contain business entity keywords
    if (contactData.title) {
      const businessKeywords = ['llc', 'inc', 'corp', 'company'];
      const titleLower = contactData.title.toLowerCase();
      
      if (businessKeywords.some(kw => titleLower.includes(kw))) {
        console.log(`⚠️  Title "${contactData.title}" contains business keywords, likely misclassified`);
        if (!contactData.company && contactData.fieldConfidences!.title! < 80) {
          contactData.company = contactData.title;
          contactData.fieldConfidences!.company = contactData.fieldConfidences!.title;
          contactData.title = undefined;
          contactData.fieldConfidences!.title = 0;
          console.log(`✅ Moved "${contactData.company}" from title to company`);
        }
      }
    }
    
    // Rule 4: Minimum confidence enforcement
    if (contactData.fieldConfidences!.name! < 50) {
      contactData.name = undefined;
    }
    if (contactData.fieldConfidences!.title! < 60) {
      contactData.title = undefined;
    }
    if (contactData.fieldConfidences!.company! < 50) {
      contactData.company = undefined;
    }
    
    console.log('✅ Field validation completed');
  }
  
  private calculateAddressConfidence(address: ContactData['address']): number {
    if (!address) return 0;
    
    let confidence = 0;
    if (address.street) confidence += 30;
    if (address.city) confidence += 25;
    if (address.state) confidence += 20;
    if (address.zip) confidence += 25;
    
    return Math.min(confidence, 95);
  }
}

// Export singleton instance
export const ocrService = new OCRService();
export default ocrService;