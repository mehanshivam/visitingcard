# Visiting Card

A modern web application for creating digital visiting cards with camera integration and real-time image quality assessment.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Modern browser with camera support

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd visitingcard

# Install dependencies
npm install

# Start development server
npm start
```

The application will open at `http://localhost:3000`

### HTTPS Development
For camera access, run with HTTPS:

```bash
npm run start:https
```

Accessible at `https://localhost:3001` (SSL certificates included)

## 📱 Features

- **Camera Integration**: Access device cameras with real-time preview
- **Quality Assessment**: AI-powered image quality feedback  
- **Responsive Design**: Works on desktop and mobile devices
- **Error Handling**: Graceful fallbacks for unsupported browsers
- **Performance Optimized**: Efficient video stream handling

## 🏗️ Architecture

Built with modern React patterns and TypeScript:

- **React 18** with hooks and concurrent features
- **TypeScript** for type safety and better developer experience
- **Zustand** for lightweight state management
- **Tailwind CSS** for rapid, consistent styling
- **Jest + Testing Library** for comprehensive testing

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   └── Camera/         # Camera-related components
├── hooks/              # Custom React hooks
├── services/           # Business logic and APIs
├── stores/             # Zustand state stores
├── utils/              # Pure utility functions
└── __tests__/          # Integration tests
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm start                # Start dev server
npm run start:https      # Start with HTTPS (for camera access)

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix linting issues
npm run typecheck        # Type checking

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode

# Production
npm run build            # Create production build
```

### Code Standards

This project follows strict coding standards:

- **TypeScript strict mode** enabled
- **ESLint + Prettier** for consistent formatting
- **Conventional commits** for git messages
- **Test co-location** with source files

See [Coding Standards](docs/architecture/coding-standards.md) for detailed guidelines.

## 🧪 Testing

Comprehensive test coverage using:

- **Jest** for test runner and mocking
- **React Testing Library** for component testing
- **Integration tests** for user workflows

```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode for development
```

## 📋 Browser Support

- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

**Camera API Requirements:**
- Secure context (HTTPS) required
- User permission for camera access
- WebRTC support for media streams

## 🔒 Security

- No hardcoded secrets or API keys
- Camera permissions handled securely
- Input validation for all user data
- CSP headers for production deployments

## 📚 Documentation

- [Architecture Overview](docs/architecture/index.md)
- [Tech Stack Decisions](docs/architecture/tech-stack.md)
- [Coding Standards](docs/architecture/coding-standards.md)
- [Product Requirements](docs/prd/index.md)

## 🚦 Getting Help

### Common Issues

**Camera not working?**
- Ensure HTTPS is enabled (`npm run start:https`)
- Check browser permissions for camera access
- Try different browsers (Chrome recommended)

**Build errors?**
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version (16+ required)

**Type errors?**
- Run type checking: `npm run typecheck`
- Ensure all dependencies are installed

### Development Workflow

1. **Feature Development**
   - Create feature branch: `git checkout -b feature/your-feature`
   - Follow coding standards in `docs/architecture/coding-standards.md`
   - Add tests for new functionality
   - Run linting: `npm run lint`

2. **Testing**
   - Write tests alongside implementation
   - Ensure all tests pass: `npm test`
   - Check coverage with Jest reports

3. **Code Review**
   - All code must pass linting and type checking
   - Tests must have good coverage
   - Follow conventional commit messages

## 🔄 Deployment

### Production Build

```bash
npm run build
```

Creates optimized bundle in `build/` directory.

### Environment Variables

The app uses Create React App's environment variable system:

```bash
# .env.local (not committed)
REACT_APP_API_URL=https://your-api.com
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Follow the coding standards and add tests
4. Commit your changes: `git commit -m 'feat: add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Related

- [System Architecture](docs/architecture/index.md) - Technical architecture details
- [Product Requirements](docs/prd/index.md) - Product specifications and goals
- [User Stories](docs/stories/) - Detailed user interaction flows

---

Built with ❤️ using React, TypeScript, and modern web standards.