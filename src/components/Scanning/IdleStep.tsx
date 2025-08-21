import React from 'react';
import { useScanWorkflow } from '../../hooks/useScanWorkflow';

export const IdleStep: React.FC = () => {
  const { startScanning, getStepTitle, getStepDescription } = useScanWorkflow();

  return (
    <div className="text-center py-12">
      {/* Icon */}
      <div className="mb-8">
        <div className="w-24 h-24 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      </div>

      {/* Title and Description */}
      <h2 className="text-3xl font-bold text-white mb-4">
        {getStepTitle('idle')}
      </h2>
      <p className="text-blue-200 text-lg mb-8 max-w-md mx-auto">
        {getStepDescription('idle')}
      </p>

      {/* Features List */}
      <div className="grid md:grid-cols-3 gap-6 mb-8 max-w-3xl mx-auto">
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="text-2xl mb-2">📸</div>
          <h3 className="text-white font-semibold mb-2">Instant Capture</h3>
          <p className="text-blue-200 text-sm">
            High-quality image capture with automatic quality detection
          </p>
        </div>
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="text-2xl mb-2">🔍</div>
          <h3 className="text-white font-semibold mb-2">Smart Extraction</h3>
          <p className="text-blue-200 text-sm">
            AI-powered text recognition and contact field mapping
          </p>
        </div>
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="text-2xl mb-2">📱</div>
          <h3 className="text-white font-semibold mb-2">Mobile Ready</h3>
          <p className="text-blue-200 text-sm">
            Works seamlessly on desktop and mobile devices
          </p>
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={startScanning}
        className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/50"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-5-10v20" />
        </svg>
        Start Scanning
      </button>

      {/* Tips */}
      <div className="mt-8 bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-4 max-w-md mx-auto">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-yellow-300 font-medium text-sm">Quick Tip</h4>
            <p className="text-yellow-200 text-sm mt-1">
              For best results, ensure good lighting and hold the card steady during capture
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};