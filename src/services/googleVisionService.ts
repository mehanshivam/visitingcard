import { ContactData } from './ocrService';
import jsrsasign from 'jsrsasign';

export interface GoogleVisionConfig {
  apiKey?: string;
  serviceAccountPath?: string;
  endpoint?: string;
  maxRequests?: number;
  retryAttempts?: number;
}

interface ServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain: string;
}

export interface GoogleVisionResponse {
  textAnnotations?: Array<{
    description: string;
    boundingPoly: {
      vertices: Array<{ x: number; y: number }>;
    };
  }>;
  error?: {
    code: number;
    message: string;
  };
}

class GoogleVisionService {
  private config: GoogleVisionConfig;
  private requestCount = 0;
  private startTime = Date.now();
  private serviceAccountCredentials?: ServiceAccountCredentials;
  private accessToken?: string;
  private tokenExpiry?: number;

  constructor(config: GoogleVisionConfig = {}) {
    this.config = {
      endpoint: 'https://vision.googleapis.com/v1/images:annotate',
      maxRequests: 1000, // Monthly limit for cost control
      retryAttempts: 2,
      ...config
    };
  }

  private async initializeServiceAccount(): Promise<void> {
    if (this.serviceAccountCredentials) {
      return;
    }

    try {
      // Fetch service account credentials from public directory
      const response = await fetch('/google-cloud-service-account.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch service account: ${response.status} ${response.statusText}`);
      }
      
      this.serviceAccountCredentials = await response.json();
      console.log('✅ Service account credentials loaded');
    } catch (error) {
      console.warn('⚠️ Failed to load service account:', error);
      throw error;
    }
  }

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid cached token
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    if (!this.serviceAccountCredentials) {
      throw new Error('Service account credentials not loaded');
    }

    try {
      // Create JWT assertion using jsrsasign
      const now = Math.floor(Date.now() / 1000);
      const jwtHeader = {
        alg: 'RS256',
        typ: 'JWT'
      };
      
      const jwtPayload = {
        iss: this.serviceAccountCredentials.client_email,
        scope: 'https://www.googleapis.com/auth/cloud-platform',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600, // 1 hour
      };

      const assertion = jsrsasign.KJUR.jws.JWS.sign('RS256', jwtHeader, jwtPayload, this.serviceAccountCredentials.private_key);

      // Exchange JWT for access token
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get access token: ${response.status} ${errorText}`);
      }

      const tokenData = await response.json();
      this.accessToken = tokenData.access_token;
      this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000) - 60000; // Expire 1 minute early

      console.log('✅ Access token obtained successfully');
      return this.accessToken!;
    } catch (error) {
      console.error('❌ Failed to get access token:', error);
      throw error;
    }
  }

  async processImage(imageData: string | Blob | File): Promise<ContactData> {
    try {
      // Try to initialize service account first
      try {
        await this.initializeServiceAccount();
      } catch (error) {
        console.log('Service account not available, will try API key if configured');
      }

      // Check authentication
      if (!this.config.apiKey && !this.serviceAccountCredentials) {
        throw new Error('Google Vision API authentication not configured (need API key or service account)');
      }

      // Check request limits
      if (this.requestCount >= this.config.maxRequests!) {
        throw new Error('Monthly Google Vision API limit reached');
      }

      console.log('🌥️ Processing with Google Vision API...');
      const startTime = Date.now();

      // Convert image to base64 if needed
      const base64Image = await this.convertToBase64(imageData);
      
      // Make API request
      const response = await this.callVisionAPI(base64Image);
      
      const processingTime = Date.now() - startTime;
      console.log(`✅ Google Vision API completed in ${processingTime}ms`);
      
      // Track usage
      this.requestCount++;
      
      // Parse response to ContactData format
      return this.parseVisionResponse(response, processingTime);
      
    } catch (error) {
      console.error('❌ Google Vision API error:', error);
      throw error;
    }
  }

  private async convertToBase64(imageData: string | Blob | File): Promise<string> {
    if (typeof imageData === 'string') {
      // Already base64 or data URL
      if (imageData.startsWith('data:')) {
        return imageData.split(',')[1];
      }
      return imageData;
    }

    // Convert Blob/File to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:image/...;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageData);
    });
  }

  private async callVisionAPI(base64Image: string): Promise<GoogleVisionResponse> {
    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image
          },
          features: [
            {
              type: 'TEXT_DETECTION', // Using TEXT_DETECTION as recommended by expert
              maxResults: 1
            }
          ],
          imageContext: {
            languageHints: ['en'] // Business cards are primarily English
          }
        }
      ]
    };

    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    let url = this.config.endpoint!;

    // Use service account authentication if available, otherwise fall back to API key
    if (this.serviceAccountCredentials) {
      try {
        const accessToken = await this.getAccessToken();
        headers['Authorization'] = `Bearer ${accessToken}`;
        console.log('🔐 Using service account authentication');
      } catch (error) {
        console.warn('⚠️ Service account auth failed, falling back to API key:', error);
        if (this.config.apiKey) {
          url = `${url}?key=${this.config.apiKey}`;
          console.log('🔑 Using API key authentication (fallback)');
        } else {
          throw new Error('Both service account and API key authentication failed');
        }
      }
    } else if (this.config.apiKey) {
      url = `${url}?key=${this.config.apiKey}`;
      console.log('🔑 Using API key authentication');
    } else {
      throw new Error('No authentication method available');
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Google Vision API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
    }

    const result = await response.json();
    return result.responses[0];
  }

  private parseVisionResponse(response: GoogleVisionResponse, processingTime: number): ContactData {
    const contactData: ContactData = {
      raw_text: '',
      confidence: 95, // Google Vision API typically has high confidence
      fieldConfidences: {}
    };

    if (response.error) {
      throw new Error(`Vision API error: ${response.error.message}`);
    }

    if (!response.textAnnotations || response.textAnnotations.length === 0) {
      console.warn('⚠️ No text detected by Google Vision API');
      return contactData;
    }

    // First annotation contains all detected text
    const fullText = response.textAnnotations[0].description;
    contactData.raw_text = fullText;

    console.log('📝 Google Vision API detected text:', fullText.substring(0, 200) + '...');

    // Use smart field extraction (reuse existing logic)
    this.extractFieldsFromText(contactData, fullText);

    // Add processing metadata
    (contactData as any).processingTime = processingTime;
    (contactData as any).processor = 'google-vision-api';

    return contactData;
  }

  private extractFieldsFromText(contactData: ContactData, text: string): void {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // High-confidence email detection
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const emailMatch = text.match(emailRegex);
    if (emailMatch) {
      contactData.email = emailMatch[0];
      contactData.fieldConfidences!.email = 98; // Very high confidence for pattern match
      console.log(`📧 Email detected: ${emailMatch[0]} (confidence: 98%)`);
      
      // Derive website from email domain
      const domain = emailMatch[0].split('@')[1];
      contactData.website = `www.${domain}`;
      contactData.fieldConfidences!.website = 95;
    }

    // High-confidence phone detection  
    const phonePatterns = [
      /\+?1?[-\.\s]?\(?([0-9]{3})\)?[-\.\s]?([0-9]{3})[-\.\s]?([0-9]{4})/,
      /\(?([0-9]{3})\)?[-\.\s]?([0-9]{3})[-\.\s]?([0-9]{4})/,
      /([0-9]{3})[-.]([0-9]{3})[-.]([0-9]{4})/
    ];
    
    for (const pattern of phonePatterns) {
      const phoneMatch = text.match(pattern);
      if (phoneMatch) {
        contactData.phone = phoneMatch[0].trim();
        contactData.fieldConfidences!.phone = 95;
        console.log(`📞 Phone detected: ${phoneMatch[0]} (confidence: 95%)`);
        break;
      }
    }

    // Enhanced name detection using Google Vision's structured data
    this.detectNameFromStructuredText(contactData, lines);
    
    // Enhanced company detection
    this.detectCompanyFromStructuredText(contactData, lines);
    
    // Job title detection
    this.detectTitleFromStructuredText(contactData, lines);
    
    // Address detection (reuse existing logic)
    const addressData = this.extractAddress(lines);
    if (addressData) {
      contactData.address = addressData;
      contactData.fieldConfidences!.address = 90;
    }
  }

  private detectNameFromStructuredText(contactData: ContactData, lines: string[]): void {
    // Strategy: Look for text that appears larger/prominent (names are typically largest on business cards)
    const businessKeywords = ['llc', 'inc', 'corp', 'company', 'solutions', 'group', 'enterprises', 'ltd', 'limited'];
    const titleKeywords = ['ceo', 'cto', 'cfo', 'president', 'vp', 'director', 'manager', 'senior', 'lead'];
    
    // If we have email, try to derive name from email
    if (contactData.email) {
      const emailPrefix = contactData.email.split('@')[0];
      if (emailPrefix.includes('.')) {
        const parts = emailPrefix.split('.');
        if (parts.length === 2) {
          const firstName = parts[0];
          const lastName = parts[1];
          if (/^[a-zA-Z]{2,15}$/.test(firstName) && /^[a-zA-Z]{2,15}$/.test(lastName)) {
            const potentialName = `${firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()} ${lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase()}`;
            contactData.name = potentialName;
            contactData.fieldConfidences!.name = 85;
            console.log(`👤 Name derived from email: ${potentialName} (confidence: 85%)`);
            return;
          }
        }
      }
    }
    
    // Look through lines for name-like text
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      const hasTitle = titleKeywords.some(keyword => lowerLine.includes(keyword));
      const hasBusiness = businessKeywords.some(keyword => lowerLine.includes(keyword));
      
      if (!line.includes('@') && 
          !line.match(/[0-9]{3}/) && 
          !hasTitle &&
          !hasBusiness &&
          line.length > 2 && 
          line.length < 50 &&
          /^[A-Za-z\s\-\.]+$/.test(line)) {
        
        // Check if it looks like a proper name
        if (/^[A-Z][a-z]+ [A-Z][a-z]+/.test(line) || 
            (line.split(' ').length >= 2 && line.split(' ').length <= 4)) {
          contactData.name = line;
          contactData.fieldConfidences!.name = 90;
          console.log(`👤 Name detected: ${line} (confidence: 90%)`);
          break;
        }
      }
    }
  }

  private detectCompanyFromStructuredText(contactData: ContactData, lines: string[]): void {
    const businessKeywords = ['llc', 'inc', 'corp', 'company', 'solutions', 'group', 'enterprises', 'ltd', 'limited'];
    const titleKeywords = ['ceo', 'cto', 'cfo', 'president', 'vp', 'director', 'manager'];
    
    // Priority 1: Look for business keywords
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      const hasBusinessKeyword = businessKeywords.some(keyword => lowerLine.includes(keyword));
      const hasTitle = titleKeywords.some(keyword => lowerLine.includes(keyword));
      
      if (hasBusinessKeyword && 
          line !== contactData.name && 
          !line.includes('@') && 
          !line.match(/[0-9]{3}/) &&
          !hasTitle) {
        contactData.company = line;
        contactData.fieldConfidences!.company = 95;
        console.log(`🏢 Company detected (business keyword): ${line} (confidence: 95%)`);
        return;
      }
    }
    
    // Priority 2: Look for longer business-like lines
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      const hasTitle = titleKeywords.some(keyword => lowerLine.includes(keyword));
      
      if (line !== contactData.name && 
          !line.includes('@') && 
          !line.match(/[0-9]{3}/) &&
          !hasTitle &&
          line.length > 5 && 
          line.length < 60) {
        contactData.company = line;
        contactData.fieldConfidences!.company = 75;
        console.log(`🏢 Company detected (fallback): ${line} (confidence: 75%)`);
        break;
      }
    }
  }

  private detectTitleFromStructuredText(contactData: ContactData, lines: string[]): void {
    const titleKeywords = [
      'ceo', 'cto', 'cfo', 'president', 'vice president', 'vp', 'director', 
      'manager', 'senior', 'lead', 'head', 'chief', 'principal', 'associate',
      'coordinator', 'specialist', 'analyst', 'consultant', 'engineer',
      'developer', 'designer', 'architect', 'supervisor', 'executive'
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
          line.length < 40) {
        contactData.title = line;
        contactData.fieldConfidences!.title = 90;
        console.log(`💼 Title detected: ${line} (confidence: 90%)`);
        break;
      }
    }
  }

  private extractAddress(lines: string[]): ContactData['address'] | null {
    // Reuse existing address extraction logic
    const zipPattern = /\b\d{5}(-\d{4})?\b/;
    const streetPatterns = [
      /\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|way|place|pl|court|ct)\b/i,
      /\d+\s+[\w\s]+\b/
    ];

    let address: ContactData['address'] = {};
    let addressLines: string[] = [];

    // Look for ZIP code first
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

  getUsageStats() {
    const uptime = Date.now() - this.startTime;
    return {
      requestCount: this.requestCount,
      maxRequests: this.config.maxRequests,
      remainingRequests: this.config.maxRequests! - this.requestCount,
      uptime: uptime,
      costEstimate: this.requestCount * 0.003 // $3 per 1000 requests
    };
  }

  resetUsageCount() {
    this.requestCount = 0;
    this.startTime = Date.now();
  }
}

export { GoogleVisionService };
export default GoogleVisionService;