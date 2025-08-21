import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps }) => {
  const steps = [
    { number: 1, title: 'Start', icon: '🎯' },
    { number: 2, title: 'Capture', icon: '📸' },
    { number: 3, title: 'Process', icon: '⚙️' },
    { number: 4, title: 'Results', icon: '📄' },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center">
              {/* Step Circle */}
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                  currentStep >= step.number
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'bg-white/20 text-white/60 border-2 border-white/30'
                }`}
              >
                {currentStep > step.number ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span>{step.icon}</span>
                )}
              </div>
              
              {/* Step Label */}
              <div className="mt-2 text-center">
                <p
                  className={`text-sm font-medium transition-colors duration-300 ${
                    currentStep >= step.number ? 'text-white' : 'text-white/60'
                  }`}
                >
                  {step.title}
                </p>
              </div>
            </div>

            {/* Connection Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-px mx-4 mt-[-20px]">
                <div
                  className={`h-full transition-all duration-500 ${
                    currentStep > step.number
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600'
                      : 'bg-white/30'
                  }`}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      
      {/* Progress Percentage */}
      <div className="mt-4">
        <div className="bg-white/20 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out"
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          />
        </div>
        <p className="text-center text-white/80 text-sm mt-2">
          Step {currentStep} of {totalSteps}
        </p>
      </div>
    </div>
  );
};