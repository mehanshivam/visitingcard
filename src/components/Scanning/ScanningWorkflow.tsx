import React from 'react';
import { useScanWorkflow } from '../../hooks/useScanWorkflow';
import { StepIndicator } from './StepIndicator';
import { IdleStep } from './IdleStep';
import { CapturingStep } from './CapturingStep';
import { ProcessingStep } from './ProcessingStep';
import { ResultsStep } from './ResultsStep';
import { ErrorStep } from './ErrorStep';

interface ScanningWorkflowProps {
  className?: string;
}

export const ScanningWorkflow: React.FC<ScanningWorkflowProps> = ({ className = '' }) => {
  const {
    currentStep,
    error,
    getStepNumber,
    getTotalSteps,
  } = useScanWorkflow();

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'idle':
        return <IdleStep />;
      case 'capturing':
        return <CapturingStep />;
      case 'processing':
        return <ProcessingStep />;
      case 'results':
        return <ResultsStep />;
      case 'error':
        return <ErrorStep />;
      default:
        return <IdleStep />;
    }
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-block p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">
          Business Card Scanner
        </h1>
        <p className="text-blue-200 text-lg">
          Scan and extract contact information from business cards
        </p>
      </div>

      {/* Step Indicator */}
      {currentStep !== 'error' && (
        <div className="mb-8">
          <StepIndicator 
            currentStep={getStepNumber(currentStep)}
            totalSteps={getTotalSteps()}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-6">
        {renderCurrentStep()}
      </div>

      {/* Error Display */}
      {error && currentStep !== 'error' && (
        <div className="mt-4 bg-red-50/90 backdrop-blur border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};