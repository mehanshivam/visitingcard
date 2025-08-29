import React, { useEffect } from 'react';
import { ScanningWorkflow } from './components/Scanning';
import { ErrorBoundary } from './components/ErrorBoundary';
import './utils/testOcrSystem'; // Load OCR test utilities for browser console

// Debug: Test basic OCR system availability
console.log('🔧 App.tsx loaded - checking OCR system...');

// Simple debug function
const debugBasicSystem = async () => {
  try {
    console.log('🔍 Testing basic imports...');
    const { ocrServiceWrapper } = await import('./services/ocrServiceWrapper');
    console.log('✅ ocrServiceWrapper imported successfully');
    
    const health = await ocrServiceWrapper.getHealthStatus();
    console.log('✅ Health check completed:', health);
    
    // Make available globally for browser console testing
    (window as any).ocrServiceWrapper = ocrServiceWrapper;
    console.log('✅ ocrServiceWrapper available on window object');
    
  } catch (error) {
    console.error('❌ Basic system test failed:', error);
  }
};

// Run debug test
debugBasicSystem();

function App() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <ErrorBoundary onError={(error, errorInfo) => {
        console.error('Application error:', error, errorInfo);
      }}>
        <ScanningWorkflow />
      </ErrorBoundary>
    </div>
  );
}

export default App;