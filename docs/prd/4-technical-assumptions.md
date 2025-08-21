# 4. Technical Assumptions

## Platform & Technology Stack

**Phase 0: Desktop/Mobile Web Prototype**
- TA001: Web-based prototype using desktop camera + mobile web access via wifi/IP
- TA002: **Tesseract.js for OCR** - free, local, easy prototype setup
- TA003: Simple HTML/JavaScript with WebRTC camera access
- TA004: Test on both desktop camera and mobile web browser
- TA005: **Upgrade to Google Vision API** in Phase 1 for better accuracy

**Primary Platform (Future Phases):**
- TA006: iOS-first development (faster iteration, higher-value early adopters)
- TA007: iOS 14+ minimum support for optimal camera and ML capabilities  
- TA008: Android V1.1 - delayed for focused development approach
- TA009: Single mobile app repository with modular architecture

**Core Technology Decisions:**
- TA010: React Native OR Swift (iOS-first approach for quality scanning experience)
- TA011: Google Vision API OR Apple Vision Framework for OCR engine
- TA012: Node.js/Express backend with cloud functions for data enrichment APIs
- TA013: SQLite local storage with cloud backup (Firebase/Supabase)

## Architecture & Integration Assumptions

**Service Architecture:**
- TA014: Local-first design with offline OCR capability
- TA015: Cloud enrichment services for company data and LinkedIn profiles
- TA016: Asynchronous processing - scan immediately, enrich in background
- TA017: Modular architecture (scanning, enrichment, contacts modules)

**Third-Party Integration:**
- TA018: Clearbit API for company intelligence and data enrichment
- TA019: LinkedIn API access for profile discovery (subject to API availability)
- TA020: Native phone contacts API for seamless export functionality
- TA021: Web scraping services as backup for data enrichment

## Performance & Security Assumptions

**Performance Targets:**
- TA022: Scan-to-contact completion under 45 seconds including enrichment
- TA023: Offline OCR processing for poor connectivity scenarios
- TA024: Local database for instant contact access and search

**Security & Compliance:**
- TA025: Local data encryption for all stored contact information
- TA026: GDPR compliance for data enrichment and storage practices
- TA027: Secure API key management for third-party services
- TA028: No sensitive data transmitted without encryption

**Development & Deployment:**
- TA029: Single repository with clear separation of concerns
- TA030: Prototype → MVP → Production deployment pipeline
- TA031: Comprehensive testing on diverse business card formats
- TA032: Beta testing program with target user segments
