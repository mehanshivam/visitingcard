# 5. API Architecture

## 5.1 RESTful API Design

### Core Endpoints
```typescript
// Authentication
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
DELETE /api/v1/auth/logout

// Scanning & OCR
POST   /api/v1/scan/upload          // Upload image for processing
GET    /api/v1/scan/jobs/{jobId}    // Get scan job status
POST   /api/v1/scan/enhance/{jobId} // Trigger enrichment

// Contact Management
GET    /api/v1/contacts             // List contacts with pagination/filters
POST   /api/v1/contacts             // Create new contact
GET    /api/v1/contacts/{id}        // Get specific contact
PUT    /api/v1/contacts/{id}        // Update contact
DELETE /api/v1/contacts/{id}        // Delete contact
GET    /api/v1/contacts/search      // Advanced search

// Data Export
POST   /api/v1/export/csv           // Export to CSV
POST   /api/v1/export/vcf           // Export to vCard
POST   /api/v1/export/sync          // Sync to phone contacts

// Enrichment Services (Internal)
GET    /api/v1/enrich/company/{domain}
GET    /api/v1/enrich/linkedin/{query}
GET    /api/v1/enrich/website/{url}
```

## 5.2 Data Models

### Core TypeScript Interfaces
```typescript
interface Contact {
  id: string;
  userId: string;
  
  // Basic Information
  firstName?: string;
  lastName?: string;
  fullName: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  
  // Enriched Data
  companyInfo: CompanyInfo;
  linkedinProfile: LinkedInProfile;
  socialProfiles: SocialProfile[];
  
  // Metadata
  source: 'scan' | 'manual' | 'import';
  tags: string[];
  notes?: string;
  lastContactDate?: string;
  relationshipScore: number;
  
  // Audit
  createdAt: string;
  updatedAt: string;
}

interface CompanyInfo {
  name?: string;
  domain?: string;
  website?: string;
  description?: string;
  industry?: string;
  size?: string;
  location?: string;
  linkedinUrl?: string;
  logoUrl?: string;
}

interface ScanJob {
  id: string;
  userId: string;
  status: 'processing' | 'completed' | 'failed' | 'enriching';
  imageUrl: string;
  
  ocrResults: {
    localOCR: OCRResult;
    cloudOCR?: OCRResult;
    finalResult: ParsedContact;
    confidence: number;
  };
  
  enrichmentStatus: {
    company: 'pending' | 'completed' | 'failed';
    linkedin: 'pending' | 'completed' | 'failed';
    lastUpdated: string;
  };
  
  contactId?: string;
  createdAt: string;
  completedAt?: string;
}

interface OCRResult {
  rawText: string;
  confidence: number;
  boundingBoxes: BoundingBox[];
  extractedFields: ExtractedFields;
}

interface ExtractedFields {
  names: string[];
  emails: string[];
  phones: string[];
  companies: string[];
  titles: string[];
  websites: string[];
}
```
