# 3. Detailed Component Architecture

## 3.1 Frontend Architecture

### Progressive Web App (Current Phase)
```typescript
src/
├── components/           # Reusable UI components
│   ├── Camera/          # Camera interface and controls
│   ├── ContactCard/     # Contact display components
│   ├── Scanner/         # OCR processing UI
│   └── Common/          # Shared components
├── services/            # API and business logic
│   ├── cameraService.ts # Camera API wrapper
│   ├── ocrService.ts    # Local OCR processing
│   ├── apiService.ts    # Backend API calls
│   └── storageService.ts# Local storage management
├── stores/              # State management
│   ├── contactStore.ts  # Contact data state
│   ├── scanStore.ts     # Scanning workflow state
│   └── appStore.ts      # Global app state
├── utils/               # Helper functions
│   ├── imageProcessing.ts
│   ├── dataValidation.ts
│   └── formatters.ts
└── hooks/               # Custom React hooks
    ├── useCamera.ts
    ├── useOCR.ts
    └── useContacts.ts
```

### Key Frontend Technologies
- **React 18:** Component framework with Concurrent features
- **TypeScript:** Type safety and developer experience
- **Zustand:** Lightweight state management
- **React Query:** Server state management and caching
- **Tailwind CSS:** Utility-first styling
- **Workbox:** Service worker for offline functionality

## 3.2 Backend Services Architecture

### API Gateway
```yaml
Responsibilities:
  - Authentication & authorization (JWT)
  - Rate limiting and throttling
  - Request validation and sanitization
  - Load balancing to services
  - API versioning and documentation

Technology Stack:
  - Node.js + Express + TypeScript
  - JWT authentication
  - Rate limiting with Redis
  - OpenAPI/Swagger documentation
```

### OCR Service
```yaml
Responsibilities:
  - Image preprocessing and optimization
  - Local OCR with Tesseract.js (backup)
  - Cloud OCR with Google Vision API
  - Text parsing and field extraction
  - Confidence scoring and validation

Processing Pipeline:
  1. Image upload and validation
  2. Image preprocessing (rotation, contrast)
  3. OCR processing (local + cloud)
  4. Text parsing and field mapping
  5. Confidence scoring
  6. Result storage and caching

Technology Stack:
  - Node.js + Express + TypeScript
  - Sharp for image processing
  - Tesseract.js for local OCR
  - Google Vision API for cloud OCR
  - Bull queue for async processing
```

### Enrichment Service
```yaml
Responsibilities:
  - Company data enrichment
  - LinkedIn profile discovery
  - Website analysis and summarization
  - Social media profile matching
  - Data validation and scoring

Enhancement Pipeline:
  1. Company domain extraction
  2. Website discovery and analysis
  3. LinkedIn company/person search
  4. Social profile matching
  5. Data validation and confidence scoring
  6. Result aggregation and storage

Technology Stack:
  - Node.js + Express + TypeScript
  - Clearbit API for company data
  - LinkedIn API for profile data
  - Puppeteer for web scraping
  - OpenAI API for content analysis
```

### Contact Service
```yaml
Responsibilities:
  - Contact CRUD operations
  - Search and filtering
  - Data validation and deduplication
  - Relationship tracking
  - Export preparation

Features:
  - Full-text search with PostgreSQL
  - Fuzzy matching for deduplication
  - Tagging and categorization
  - Activity tracking
  - Bulk operations

Technology Stack:
  - Node.js + Express + TypeScript
  - PostgreSQL with full-text search
  - Redis for caching
  - Elasticsearch for advanced search (future)
```
