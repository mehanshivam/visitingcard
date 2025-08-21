# Coding Standards

This document defines the coding standards and conventions for the Visiting Card project. These standards ensure consistency, maintainability, and code quality across the codebase.

## Language Standards

### TypeScript
- **Strict Mode**: TypeScript strict mode is enabled (`strict: true` in tsconfig.json)
- **Type Definitions**: All function parameters, return types, and variables should have explicit types where inference is not clear
- **Interface Naming**: Use PascalCase for interfaces (e.g., `CameraProps`, `QualityAssessment`)
- **Type vs Interface**: Prefer `interface` for object shapes, `type` for unions, primitives, and computed types

```typescript
// ✅ Good
interface CameraProps {
  onImageCapture?: (imageBlob: Blob) => void;
  onError?: (error: CameraError) => void;
  className?: string;
}

// ✅ Good
type CameraState = 'idle' | 'capturing' | 'processing' | 'error';
```

### React Standards

#### Component Structure
- Use **functional components** with hooks
- Export components as named exports, not default exports
- Props interface should be defined above the component

```typescript
// ✅ Good
export interface CameraProps {
  onImageCapture?: (imageBlob: Blob) => void;
}

export const Camera: React.FC<CameraProps> = ({ onImageCapture }) => {
  // component logic
};
```

#### Hooks
- Custom hooks should start with `use` prefix
- Keep hooks in `/src/hooks/` directory
- Return arrays for multiple values, objects for named returns

```typescript
// ✅ Good - Array destructuring for related state
const [state, actions] = useCamera();

// ✅ Good - Object for complex returns  
const { isSupported, hasPermission, stream } = useCameraAccess();
```

## File Organization

### Directory Structure
```
src/
├── components/          # Reusable UI components
│   └── ComponentName/
│       ├── ComponentName.tsx
│       ├── __tests__/
│       │   └── ComponentName.test.tsx
│       └── index.ts
├── hooks/              # Custom React hooks
├── services/           # Business logic and external APIs
├── stores/            # State management (Zustand)
├── utils/             # Pure utility functions
└── __tests__/         # Integration tests
```

### File Naming
- **Components**: PascalCase (e.g., `Camera.tsx`, `QualityFeedback.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useCamera.ts`)
- **Services**: camelCase with `Service` suffix (e.g., `cameraService.ts`)
- **Utils**: camelCase descriptive names (e.g., `deviceDetection.ts`)
- **Tests**: Match source file name with `.test.` suffix

### Import/Export Conventions

#### Import Order
1. React imports
2. Third-party libraries  
3. Internal imports (hooks, services, utils)
4. Relative imports (components)

```typescript
// ✅ Good import order
import React, { useRef, useEffect, useState } from 'react';
import { useCamera } from '../../hooks/useCamera';
import { CameraError } from '../../services/cameraService';
import { isMobileDevice } from '../../utils/deviceDetection';
import { QualityFeedback } from './QualityFeedback';
```

#### Barrel Exports
- Use `index.ts` files to create clean import paths
- Export main component and related types

```typescript
// components/Camera/index.ts
export { Camera } from './Camera';
export type { CameraProps } from './Camera';
```

## Code Style

### Naming Conventions
- **Variables & Functions**: camelCase (`imageBlob`, `onImageCapture`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_FILE_SIZE`, `DEFAULT_QUALITY`)
- **Classes**: PascalCase (`CameraError`, `QualityAssessment`)
- **Enums**: PascalCase with descriptive values

```typescript
enum CameraStatus {
  Idle = 'idle',
  Capturing = 'capturing',
  Processing = 'processing',
  Error = 'error'
}
```

### Function Declarations
- Prefer arrow functions for components and inline functions
- Use regular function declarations for utility functions

```typescript
// ✅ Components
export const Camera: React.FC<CameraProps> = ({ onImageCapture }) => {
  // component logic
};

// ✅ Utilities
export function calculateImageQuality(image: HTMLImageElement): number {
  // utility logic
}
```

### Error Handling
- Use custom error classes that extend `Error`
- Provide meaningful error messages
- Handle errors at component boundaries with Error Boundaries

```typescript
export class CameraError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = false
  ) {
    super(message);
    this.name = 'CameraError';
  }
}
```

## State Management

### Zustand Store Structure
- Keep stores focused and domain-specific
- Use immer for complex state updates
- Export actions alongside state

```typescript
interface CameraStore {
  // State
  stream: MediaStream | null;
  isActive: boolean;
  error: CameraError | null;
  
  // Actions
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  clearError: () => void;
}
```

## Testing Standards

### Test Structure
- Co-locate tests with source files in `__tests__` directories
- Use descriptive test names that explain the expected behavior
- Group related tests with `describe` blocks

```typescript
describe('Camera Component', () => {
  describe('when camera access is granted', () => {
    it('should display video stream', () => {
      // test implementation
    });
  });

  describe('when camera access is denied', () => {
    it('should display error message', () => {
      // test implementation  
    });
  });
});
```

### Test Coverage
- Aim for 80%+ code coverage
- Focus on testing public APIs and user interactions
- Mock external dependencies (camera API, services)

## Performance Standards

### Code Splitting
- Lazy load components when appropriate using `React.lazy()`
- Use dynamic imports for large utilities

### Memoization
- Use `React.memo()` for components that receive stable props
- Use `useMemo()` and `useCallback()` judiciously, only when there's a clear performance benefit

### Bundle Size
- Monitor bundle size with each build
- Use tree shaking friendly imports

```typescript
// ✅ Good - Tree shakable
import { debounce } from 'lodash/debounce';

// ❌ Bad - Imports entire library
import _ from 'lodash';
```

## Security Standards

- **No hardcoded secrets** in source code
- **Input validation** for all user inputs
- **Permission handling** for camera and microphone access
- **CSP headers** for production deployments

## Accessibility (A11y)

- Use semantic HTML elements
- Provide `alt` text for images
- Ensure keyboard navigation works
- Use ARIA labels where appropriate
- Test with screen readers

```typescript
// ✅ Good accessibility
<button
  aria-label="Capture photo"
  onClick={handleCapture}
  disabled={!isReady}
>
  📸
</button>
```

## Documentation

### Code Comments
- Use JSDoc for functions and complex logic
- Avoid obvious comments
- Explain "why" not "what"

```typescript
/**
 * Assesses image quality based on sharpness, brightness, and contrast
 * @param image - HTML image element to analyze
 * @returns Quality score from 0-100 (higher is better)
 */
export function assessImageQuality(image: HTMLImageElement): number {
  // Complex quality assessment logic
}
```

### README Updates
- Keep component READMEs current
- Document breaking changes
- Include usage examples

## Linting and Formatting

### ESLint Rules
- Extend from `@typescript-eslint/recommended`
- Enable React hooks linting
- Enforce consistent import ordering

### Prettier Configuration
- 2-space indentation
- Single quotes
- Trailing commas
- Semicolons required

## Git Conventions

### Commit Messages
Follow conventional commits format:
```
type(scope): description

feat(camera): add image quality assessment
fix(ui): resolve camera permission dialog styling
docs(readme): update setup instructions
```

### Branch Naming
- `feature/description-of-feature`
- `fix/description-of-fix` 
- `refactor/description-of-refactor`

---

This document should be updated as the codebase evolves and new patterns emerge.