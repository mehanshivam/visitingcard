import React from 'react';
import { useScanWorkflow } from '../../hooks/useScanWorkflow';
import { Camera } from '../Camera';

export const CapturingStep: React.FC = () => {
  const { 
    handleImageCapture, 
    handleError, 
    resetWorkflow,
    getStepTitle,
    getStepDescription
  } = useScanWorkflow();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          {getStepTitle('capturing')}
        </h2>
        <p className="text-blue-200">
          {getStepDescription('capturing')}
        </p>
      </div>

      {/* Camera Interface */}
      <div className="bg-black/20 rounded-xl p-4 border border-white/10">
        <Camera 
          onImageCapture={handleImageCapture}
          onError={(error) => handleError(error.message)}
          className="w-full"
        />
      </div>

      {/* Instructions */}
      <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
        <h3 className="text-blue-300 font-semibold mb-2 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Capture Tips
        </h3>
        <ul className="text-blue-200 text-sm space-y-1">
          <li>• Ensure the business card fills most of the frame</li>
          <li>• Make sure all text is clearly readable</li>
          <li>• Avoid shadows and reflections</li>
          <li>• Hold the camera steady when capturing</li>
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4">
        <button
          onClick={resetWorkflow}
          className="flex items-center px-4 py-2 text-white/80 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Start
        </button>

        <div className="text-white/60 text-sm">
          Position card and capture when ready
        </div>
      </div>
    </div>
  );
};