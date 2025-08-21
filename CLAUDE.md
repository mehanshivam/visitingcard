# Claude Code Development Configuration

This file contains important configuration and context for Claude Code development sessions.

## Development Server Configuration

**CRITICAL: This application REQUIRES HTTPS for camera functionality**
**IMPORTANT: This application runs on PORT 3001, NOT the default 3000**

### Start Commands:
- `npm run start:https` - **PRIMARY** - HTTPS development server on **https://localhost:3001** (REQUIRED for camera)
- `npm start` - HTTP fallback on **http://localhost:3001** (camera won't work)

### Port Configuration:
- Default port is set to **3001** in both:
  - `.env` file (`PORT=3001`)
  - `package.json` scripts (`PORT=3001 react-scripts start`)

### Why Port 3001?
This project uses port 3001 to avoid conflicts with other React applications that typically use port 3000.

## Testing Commands

- `npm test -- --watchAll=false` - Run all tests once
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript checks
- `npm run build` - Production build

## Project Structure

### Current Implementation Status:
- ✅ **Epic 1 Complete**: Basic Web Camera Scanning with Tesseract.js OCR
  - Story 1.1: Camera Access ✅
  - Story 1.2: Basic Scanning Workflow ✅ 
  - Story 1.3: Tesseract OCR Integration ✅

### Key Technologies:
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **State Management**: Zustand
- **OCR**: Tesseract.js v6.0.1
- **Testing**: Jest + React Testing Library
- **Camera**: WebRTC API

### Camera Access Requirements:
- **HTTPS MANDATORY** for camera access (browser security policy)
- **ALWAYS use `npm run start:https`** for any camera testing
- **Mobile testing REQUIRES HTTPS** - HTTP will fail silently
- SSL certificates: `localhost.pem` and `localhost-key.pem`
- Accept SSL warnings in browser for localhost development

## Important Notes for Claude Code Sessions:

1. **ALWAYS use `npm run start:https` for testing** - HTTP will break camera functionality
2. **Always use port 3001** when starting the development server  
3. **ASK USER about camera/mobile requirements** before choosing HTTP vs HTTPS
4. **Epic 2 is next**: OCR Processing & Data Extraction enhancements
5. **174 of 218 tests passing** - some camera permission failures in test environment are expected

## Claude Code Best Practices:
- **Before starting servers**: Ask user about camera testing requirements
- **Before making assumptions**: Confirm critical functionality needs (HTTPS, mobile, etc.)
- **When testing camera features**: Always use HTTPS and verify mobile compatibility

## Common Issues & Solutions:

### Port Conflicts:
- If port 3001 is in use, check for other running React apps
- Kill existing processes: `lsof -ti:3001 | xargs kill -9`

### Camera Access:
- Must use HTTPS for camera access (`npm run start:https`)
- Browser may cache camera permissions - clear if needed

### OCR Performance:
- Tesseract.js requires good image quality for accuracy
- 60% confidence threshold configured for quality control