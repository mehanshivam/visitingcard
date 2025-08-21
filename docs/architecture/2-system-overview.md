# 2. System Overview

## 2.1 High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        PWA[Progressive Web App]
        iOS[Native iOS App]
        Android[Native Android App]
    end
    
    subgraph "API Gateway"
        Gateway[Load Balancer + Auth]
    end
    
    subgraph "Core Services"
        OCR[OCR Service]
        Enrich[Enrichment Service]
        Contact[Contact Service]
        Export[Export Service]
    end
    
    subgraph "External APIs"
        Vision[Google Vision API]
        LinkedIn[LinkedIn API]
        Clearbit[Clearbit API]
    end
    
    subgraph "Data Layer"
        Postgres[(PostgreSQL)]
        Redis[(Redis Cache)]
        S3[(File Storage)]
    end
    
    PWA --> Gateway
    iOS --> Gateway
    Android --> Gateway
    
    Gateway --> OCR
    Gateway --> Enrich
    Gateway --> Contact
    Gateway --> Export
    
    OCR --> Vision
    Enrich --> LinkedIn
    Enrich --> Clearbit
    
    Contact --> Postgres
    Contact --> Redis
    OCR --> S3
```

## 2.2 Core Components

### Frontend Applications
- **Progressive Web App (Phase 0-1):** React + TypeScript for rapid prototyping
- **Native Mobile Apps (Phase 2+):** iOS (Swift/React Native) + Android for production

### Backend Services
- **API Gateway:** Authentication, rate limiting, request routing
- **OCR Service:** Image processing and text extraction
- **Enrichment Service:** Company and LinkedIn data enhancement
- **Contact Service:** Contact storage, search, and management
- **Export Service:** Data export and synchronization

### Data Storage
- **PostgreSQL:** Primary contact and user data storage
- **Redis:** Caching layer for performance
- **S3/Cloud Storage:** Image and file storage
