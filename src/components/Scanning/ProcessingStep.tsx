import React from 'react';
import { useScanWorkflow } from '../../hooks/useScanWorkflow';

export const ProcessingStep: React.FC = () => {
  const { 
    capturedImage, 
    isProcessing, 
    getStepTitle, 
    getStepDescription,
    resetWorkflow
  } = useScanWorkflow();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          {getStepTitle('processing')}
        </h2>
        <p className="text-blue-200">
          {getStepDescription('processing')}
        </p>
      </div>

      {/* Processing Animation */}
      <div className="text-center py-8">
        <div className="relative inline-block">
          {/* Spinning Ring */}
          <div className="w-24 h-24 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          
          {/* Inner Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-xl font-semibold text-white mb-2">
            {isProcessing ? 'Processing Image...' : 'Processing Complete'}
          </h3>
          <p className="text-blue-200">
            {isProcessing ? 'Extracting text and contact information' : 'Text extraction finished'}
          </p>
        </div>
      </div>

      {/* Captured Image Preview */}
      {capturedImage && (
        <div className="bg-black/20 rounded-xl p-4 border border-white/10">
          <h4 className="text-white font-medium mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Captured Image
          </h4>
          <img
            src={URL.createObjectURL(capturedImage)}
            alt="Captured business card"
            className="w-full max-w-md mx-auto rounded-lg shadow-lg"
          />
        </div>
      )}

      {/* Processing Steps */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <h4 className="text-white font-medium mb-3">Processing Steps:</h4>
        <div className="space-y-2">
          <ProcessingStepItem 
            completed={true} 
            text="Image quality validation" 
          />
          <ProcessingStepItem 
            completed={true} 
            text="Text detection and extraction" 
            isActive={isProcessing}
          />
          <ProcessingStepItem 
            completed={!isProcessing} 
            text="Contact field identification" 
            isActive={isProcessing}
          />
          <ProcessingStepItem 
            completed={!isProcessing} 
            text="Data formatting and validation" 
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4">
        <button
          onClick={resetWorkflow}
          className="flex items-center px-4 py-2 text-white/80 hover:text-white transition-colors"
          disabled={isProcessing}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Start Over
        </button>

        <div className="text-white/60 text-sm">
          {isProcessing ? 'Please wait...' : 'Processing complete'}
        </div>
      </div>
    </div>
  );
};

interface ProcessingStepItemProps {
  completed: boolean;
  text: string;
  isActive?: boolean;
}

const ProcessingStepItem: React.FC<ProcessingStepItemProps> = ({ 
  completed, 
  text, 
  isActive = false 
}) => {
  return (
    <div className="flex items-center space-x-3">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
        completed 
          ? 'bg-green-500' 
          : isActive 
            ? 'bg-blue-500 animate-pulse' 
            : 'bg-white/20'
      }`}>
        {completed ? (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : isActive ? (
          <div className="w-2 h-2 bg-white rounded-full"></div>
        ) : (
          <div className="w-2 h-2 bg-white/40 rounded-full"></div>
        )}
      </div>
      <span className={`text-sm ${
        completed 
          ? 'text-green-300' 
          : isActive 
            ? 'text-blue-300' 
            : 'text-white/60'
      }`}>
        {text}
      </span>
    </div>
  );
};