import React from 'react';
import { useScanWorkflow } from '../../hooks/useScanWorkflow';

export const ErrorStep: React.FC = () => {
  const { 
    error, 
    resetWorkflow, 
    retryScanning,
    getStepTitle,
    getStepDescription
  } = useScanWorkflow();

  const getErrorDetails = (errorMessage: string) => {
    // Parse common error types and provide helpful solutions
    if (errorMessage.toLowerCase().includes('camera')) {
      return {
        icon: '📷',
        title: 'Camera Access Issue',
        suggestions: [
          'Check that your browser has camera permissions',
          'Make sure no other application is using the camera',
          'Try refreshing the page and allowing camera access',
          'Ensure your device has a working camera'
        ]
      };
    } else if (errorMessage.toLowerCase().includes('confidence') || errorMessage.toLowerCase().includes('ocr')) {
      return {
        icon: '📄',
        title: 'OCR Processing Issue',
        suggestions: [
          'Ensure the business card is well-lit and clearly visible',
          'Hold the camera steady and avoid blurry images',
          'Try positioning the card flat and straight',
          'Use a dark background to improve text contrast',
          'Make sure the text is not too small or faded'
        ]
      };
    } else if (errorMessage.toLowerCase().includes('processing')) {
      return {
        icon: '⚙️',
        title: 'Processing Error',
        suggestions: [
          'Try capturing a clearer image',
          'Ensure the business card text is readable',
          'Check your internet connection',
          'Try scanning again with better lighting'
        ]
      };
    } else {
      return {
        icon: '❌',
        title: 'Unexpected Error',
        suggestions: [
          'Try refreshing the page',
          'Check your internet connection',
          'Clear your browser cache',
          'Try again in a few moments'
        ]
      };
    }
  };

  const errorDetails = getErrorDetails(error || '');

  return (
    <div className="space-y-6 text-center py-8">
      {/* Error Icon */}
      <div className="mb-6">
        <div className="w-24 h-24 mx-auto bg-red-500/20 rounded-full flex items-center justify-center border-2 border-red-400/30">
          <div className="text-4xl">{errorDetails.icon}</div>
        </div>
      </div>

      {/* Error Title */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">
          {getStepTitle('error')}
        </h2>
        <h3 className="text-xl text-red-300 mb-4">
          {errorDetails.title}
        </h3>
        <p className="text-red-200">
          {getStepDescription('error')}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-4 max-w-md mx-auto">
          <h4 className="text-red-300 font-medium mb-2">Error Details:</h4>
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Troubleshooting */}
      <div className="bg-white/5 rounded-lg p-6 max-w-lg mx-auto border border-white/10">
        <h4 className="text-white font-semibold mb-4 flex items-center justify-center">
          <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Troubleshooting Steps
        </h4>
        <ul className="text-left text-white/80 text-sm space-y-2">
          {errorDetails.suggestions.map((suggestion, index) => (
            <li key={index} className="flex items-start">
              <span className="text-blue-400 mr-2 mt-0.5">•</span>
              {suggestion}
            </li>
          ))}
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 max-w-md mx-auto pt-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={retryScanning}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
          
          <button
            onClick={resetWorkflow}
            className="flex-1 px-6 py-3 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Start Over
          </button>
        </div>
        
        {/* Manual Entry Fallback */}
        {errorDetails.title === 'OCR Processing Issue' && (
          <button
            onClick={() => {
              // For now, we'll simulate manual entry by providing empty data
              // In a full implementation, this would open a manual entry form
              alert('Manual entry form would open here - this is a prototype feature');
            }}
            className="w-full px-6 py-3 bg-green-500/20 border border-green-400/30 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Enter Information Manually
          </button>
        )}
      </div>

      {/* Help Contact */}
      <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-4 max-w-md mx-auto">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-left">
            <h4 className="text-yellow-300 font-medium text-sm">Need Help?</h4>
            <p className="text-yellow-200 text-sm mt-1">
              If the problem persists, try using a different browser or device
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};