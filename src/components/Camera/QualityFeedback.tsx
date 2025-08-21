import React from 'react';
import { QualityAssessment } from '../../services/imageQualityService';

interface QualityFeedbackProps {
  assessment: QualityAssessment | null;
  isAnalyzing: boolean;
  className?: string;
  onDismiss?: () => void;
}

export const QualityFeedback: React.FC<QualityFeedbackProps> = ({
  assessment,
  isAnalyzing,
  className = '',
  onDismiss
}) => {
  if (isAnalyzing) {
    return (
      <div className={`quality-feedback analyzing ${className}`}>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" data-testid="loading-spinner"></div>
            <span className="text-sm text-blue-700">Analyzing image quality...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!assessment) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-700 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return '✅';
    if (score >= 60) return '⚠️';
    return '❌';
  };

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-gray-600';
    }
  };

  return (
    <div className={`quality-feedback ${className}`}>
      <div className={`rounded-lg p-3 border ${getScoreColor(assessment.score)} relative`}>
        {/* Close button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute top-1 right-1 text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label="Close quality feedback"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
        {/* Overall Score */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getScoreIcon(assessment.score)}</span>
            <span className="font-medium">Image Quality: {assessment.score}/100</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-xs">OCR Ready:</span>
            <span className={`text-xs font-bold ${assessment.isGoodForOCR ? 'text-green-600' : 'text-red-600'}`}>
              {assessment.isGoodForOCR ? '✓' : '✗'}
            </span>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
          <div className="flex justify-between">
            <span>Sharpness:</span>
            <span className="font-medium">{Math.round(assessment.metrics.sharpness)}/100</span>
          </div>
          <div className="flex justify-between">
            <span>Contrast:</span>
            <span className="font-medium">{Math.round(assessment.metrics.contrast)}/100</span>
          </div>
          <div className="flex justify-between">
            <span>Brightness:</span>
            <span className="font-medium">{Math.round(assessment.metrics.brightness)}/100</span>
          </div>
          <div className="flex justify-between">
            <span>Resolution:</span>
            <span className="font-medium">{assessment.metrics.resolution.megapixels.toFixed(1)}MP</span>
          </div>
        </div>

        {/* Issues */}
        {assessment.issues.length > 0 && (
          <div className="mb-2">
            <div className="text-xs font-medium mb-1">Issues:</div>
            <div className="space-y-1">
              {assessment.issues.slice(0, 2).map((issue, index) => (
                <div key={index} className="flex items-start space-x-1 text-xs">
                  <span className={getSeverityColor(issue.severity)}>•</span>
                  <span className="text-gray-700">{issue.message}</span>
                </div>
              ))}
              {assessment.issues.length > 2 && (
                <div className="text-xs text-gray-500">
                  +{assessment.issues.length - 2} more issues
                </div>
              )}
            </div>
          </div>
        )}

        {/* Top Recommendation */}
        {assessment.recommendations.length > 0 && assessment.score < 80 && (
          <div className="text-xs">
            <span className="font-medium">💡 Tip: </span>
            <span className="text-gray-700">{assessment.recommendations[0]}</span>
          </div>
        )}
      </div>
    </div>
  );
};