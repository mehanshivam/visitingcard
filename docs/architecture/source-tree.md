# Source Tree Structure

This document outlines the complete directory structure and organization principles for the Visiting Card project.

## Root Directory Structure

```
visitingcard/
├── .bmad-core/              # BMad agent configurations and templates
├── .claude/                 # Claude Code configuration
├── build/                   # Production build output (generated)
├── docs/                    # All project documentation
├── node_modules/            # NPM dependencies (generated)
├── public/                  # Static assets served directly
├── src/                     # Source code (main application)
├── .eslintrc.js            # ESLint configuration
├── .gitignore              # Git ignore patterns
├── .prettierrc             # Prettier formatting rules
├── jest.config.js          # Jest testing configuration
├── localhost.pem           # Local HTTPS certificate
├── localhost-key.pem       # Local HTTPS private key
├── package.json            # Project dependencies and scripts
├── package-lock.json       # Locked dependency versions
├── postcss.config.js       # PostCSS configuration
├── README.md               # Project overview and setup
├── tailwind.config.js      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript compiler configuration
```

## Documentation Structure (`docs/`)

```
docs/
├── architecture/           # Technical architecture documentation
│   ├── 1-executive-summary.md
│   ├── 2-system-overview.md
│   ├── 3-detailed-component-architecture.md
│   ├── 4-data-architecture.md
│   ├── 5-api-architecture.md
│   ├── 6-security-architecture.md
│   ├── 7-performance-architecture.md
│   ├── 8-deployment-architecture.md
│   ├── 9-monitoring-observability.md
│   ├── 10-future-architecture-considerations.md
│   ├── coding-standards.md  # Development guidelines (for dev agents)
│   ├── source-tree.md      # This file (for dev agents)
│   ├── tech-stack.md       # Technology choices (for dev agents)
│   ├── document-metadata.md
│   └── index.md
├── prd/                    # Product requirements documentation
│   ├── 1-goals-and-background-context.md
│   ├── 2-requirements.md
│   ├── 3-ui-goals.md
│   ├── 4-technical-assumptions.md
│   ├── 5-epic-list.md
│   ├── 6-detailed-epic-breakdown-web-prototype-focus.md
│   ├── 7-web-prototype-implementation-plan.md
│   ├── 8-future-phases-post-prototype.md
│   └── index.md
└── stories/                # User stories and workflows
    └── 1.1.camera-access.md
```

## Source Code Structure (`src/`)

```
src/
├── components/             # Reusable UI components
│   ├── Camera/            # Camera-related components
│   │   ├── Camera.tsx     # Main camera component
│   │   ├── QualityFeedback.tsx  # Image quality feedback UI
│   │   ├── __tests__/     # Component-specific tests
│   │   │   ├── Camera.test.tsx
│   │   │   └── QualityFeedback.test.tsx
│   │   └── index.ts       # Barrel export
│   └── ErrorBoundary/     # Error boundary component
│       ├── ErrorBoundary.tsx
│       ├── __tests__/
│       │   └── ErrorBoundary.test.tsx
│       └── index.ts
├── hooks/                 # Custom React hooks
│   ├── useCamera.ts       # Camera access and management hook
│   └── __tests__/
│       └── useCamera.test.ts
├── services/              # Business logic and external APIs
│   ├── cameraService.ts   # Camera API interactions
│   ├── imageQualityService.ts  # Image quality assessment
│   └── __tests__/
│       ├── cameraService.test.ts
│       └── imageQualityService.test.ts
├── stores/                # Zustand state management stores
│   └── (future store files)
├── utils/                 # Pure utility functions
│   ├── deviceDetection.ts # Device capability detection
│   ├── performanceOptimization.ts  # Performance utilities
│   └── __tests__/
│       ├── deviceDetection.test.ts
│       └── performanceOptimization.test.ts
├── __tests__/             # Integration and app-level tests
│   ├── browserCompatibility.test.tsx
│   └── integration.test.tsx
├── App.tsx                # Root application component
├── index.css              # Global styles and Tailwind imports
├── index.tsx              # Application entry point
└── setupTests.ts          # Jest testing setup
```

## Public Assets (`public/`)

```
public/
├── index.html             # Main HTML template
├── manifest.json          # PWA manifest (future)
├── favicon.ico           # Site favicon
└── robots.txt            # Search engine instructions
```

## Directory Organization Principles

### 1. Feature-Based Organization
Components are grouped by domain/feature rather than technical type:
- ✅ `components/Camera/` contains all camera-related UI
- ✅ Co-located tests with implementation
- ✅ Barrel exports for clean imports

### 2. Separation of Concerns
Clear boundaries between different types of code:
- **Components**: Pure UI logic, presentation
- **Hooks**: Reusable stateful logic  
- **Services**: Business logic, API calls, side effects
- **Utils**: Pure functions, no side effects
- **Stores**: Global state management

### 3. Test Co-location
Tests live alongside the code they test:
```
components/Camera/
├── Camera.tsx
├── __tests__/
│   └── Camera.test.tsx
└── index.ts
```

### 4. Barrel Exports
Each component directory exports through `index.ts`:
```typescript
// components/Camera/index.ts
export { Camera } from './Camera';
export type { CameraProps } from './Camera';
```

## File Naming Conventions

### Components
- **PascalCase** for component files: `Camera.tsx`, `QualityFeedback.tsx`
- **PascalCase** for component directories: `Camera/`, `ErrorBoundary/`

### Hooks
- **camelCase** with `use` prefix: `useCamera.ts`, `useImageQuality.ts`

### Services
- **camelCase** with descriptive names: `cameraService.ts`, `imageQualityService.ts`

### Utils
- **camelCase** descriptive names: `deviceDetection.ts`, `performanceOptimization.ts`

### Tests
- **Match source file name** with `.test.` suffix: `Camera.test.tsx`, `useCamera.test.ts`

### Configuration Files
- **Lowercase** with standard extensions: `.eslintrc.js`, `jest.config.js`

## Import Path Conventions

### Absolute Imports (Future Enhancement)
Configure TypeScript/webpack for cleaner imports:
```typescript
// Instead of: import { Camera } from '../../../components/Camera'
// Use: import { Camera } from '@/components/Camera'
```

### Import Order (Enforced by ESLint)
1. **React imports**: `import React from 'react'`
2. **Third-party libraries**: `import { create } from 'zustand'`
3. **Internal imports**: `import { useCamera } from '../../hooks/useCamera'`
4. **Relative imports**: `import { QualityFeedback } from './QualityFeedback'`

## Code Organization Best Practices

### 1. Single Responsibility
Each file has one clear purpose:
- Components handle UI rendering
- Services handle business logic  
- Utils provide pure helper functions

### 2. Dependency Direction
Dependencies flow inward toward the domain:
```
Components → Hooks → Services → Utils
     ↓         ↓         ↓        ↓
    UI    → State → Business → Pure
```

### 3. Test Structure
Tests mirror the source structure:
- Unit tests co-located with source
- Integration tests in `src/__tests__/`
- Test utilities in shared location

### 4. Documentation Co-location
Keep documentation close to code:
- Component README files when complex
- Inline JSDoc for functions
- Architecture docs in `docs/`

## Future Expansion Guidelines

### Adding New Features
1. **Create feature directory** under `components/`
2. **Add corresponding service** if needed
3. **Create custom hooks** for stateful logic
4. **Add tests** alongside implementation
5. **Update barrel exports**

### Scaling Considerations
- **Atomic Design**: Consider atoms/molecules/organisms structure
- **Module Federation**: For micro-frontend architecture
- **Shared Libraries**: Extract common components
- **Monorepo Structure**: When multiple apps share code

### Refactoring Guidelines
- **Keep tests passing** during restructuring
- **Update import paths** systematically
- **Maintain barrel exports** for clean APIs
- **Document breaking changes**

## Build Output Structure (`build/`)

```
build/                     # Generated during npm run build
├── static/
│   ├── css/              # Compiled CSS with hashes
│   ├── js/               # Compiled JavaScript with hashes
│   └── media/            # Optimized images and fonts
├── index.html            # Minified HTML with asset references
├── manifest.json         # PWA manifest
└── service-worker.js     # Service worker (if PWA enabled)
```

## Configuration Files Explained

### Core Configuration
- **`package.json`**: Dependencies, scripts, project metadata
- **`tsconfig.json`**: TypeScript compiler settings
- **`.eslintrc.js`**: Code linting rules
- **`.prettierrc`**: Code formatting rules

### Build Tools
- **`postcss.config.js`**: PostCSS plugins (Tailwind, Autoprefixer)
- **`tailwind.config.js`**: Tailwind CSS customization
- **`jest.config.js`**: Test runner configuration

### Development
- **`.gitignore`**: Files to exclude from version control
- **`localhost.pem`**: HTTPS certificate for local development

## Environment-Specific Files

### Development
- **`src/setupTests.ts`**: Jest test environment setup
- **HTTPS certificates**: For camera API access

### Production
- **`build/`**: Optimized production assets
- **Environment variables**: Runtime configuration

---

This source tree structure promotes maintainability, scalability, and developer productivity while following React and TypeScript best practices.