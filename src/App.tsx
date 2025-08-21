import React from 'react';
import { ScanningWorkflow } from './components/Scanning';
import { ErrorBoundary } from './components/ErrorBoundary';

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