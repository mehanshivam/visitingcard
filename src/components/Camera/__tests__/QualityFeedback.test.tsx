import React from 'react';
import { render, screen } from '@testing-library/react';
import { QualityFeedback } from '../QualityFeedback';
import { QualityAssessment } from '../../../services/imageQualityService';

const mockHighQualityAssessment: QualityAssessment = {
  score: 85,
  metrics: {
    sharpness: 75,
    brightness: 55,
    contrast: 65,
    resolution: {
      width: 1920,
      height: 1080,
      megapixels: 2.07
    },
    fileSize: 500000,
    aspectRatio: 1.78
  },
  issues: [],
  recommendations: ['Image quality is good for text recognition'],
  isGoodForOCR: true
};

const mockLowQualityAssessment: QualityAssessment = {
  score: 45,
  metrics: {
    sharpness: 25,
    brightness: 15,
    contrast: 10,
    resolution: {
      width: 640,
      height: 480,
      megapixels: 0.31
    },
    fileSize: 150000,
    aspectRatio: 1.33
  },
  issues: [
    {
      type: 'blur',
      severity: 'high',
      message: 'Image is too blurry for accurate text recognition'
    },
    {
      type: 'dark',
      severity: 'high',
      message: 'Image is too dark - increase lighting or exposure'
    },
    {
      type: 'low_resolution',
      severity: 'medium',
      message: 'Higher resolution would improve text recognition'
    }
  ],
  recommendations: [
    'Hold the camera steady and ensure the business card is in focus',
    'Improve lighting - use natural light or add more light sources',
    'Move closer to capture more detail'
  ],
  isGoodForOCR: false
};

describe('QualityFeedback', () => {
  it('should render analyzing state', () => {
    render(<QualityFeedback assessment={null} isAnalyzing={true} />);
    
    expect(screen.getByText('Analyzing image quality...')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument(); // Loading spinner
  });

  it('should not render when no assessment and not analyzing', () => {
    const { container } = render(<QualityFeedback assessment={null} isAnalyzing={false} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('should render high quality assessment correctly', () => {
    render(<QualityFeedback assessment={mockHighQualityAssessment} isAnalyzing={false} />);
    
    expect(screen.getByText('Image Quality: 85/100')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument(); // OCR ready indicator
    expect(screen.getByText('75/100')).toBeInTheDocument(); // Sharpness
    expect(screen.getByText('65/100')).toBeInTheDocument(); // Contrast  
    expect(screen.getByText('55/100')).toBeInTheDocument(); // Brightness
    expect(screen.getByText('2.1MP')).toBeInTheDocument(); // Resolution
  });

  it('should render low quality assessment with issues', () => {
    render(<QualityFeedback assessment={mockLowQualityAssessment} isAnalyzing={false} />);
    
    expect(screen.getByText('Image Quality: 45/100')).toBeInTheDocument();
    expect(screen.getByText('✗')).toBeInTheDocument(); // OCR not ready
    
    // Should show issues
    expect(screen.getByText('Issues:')).toBeInTheDocument();
    expect(screen.getByText('Image is too blurry for accurate text recognition')).toBeInTheDocument();
    expect(screen.getByText('Image is too dark - increase lighting or exposure')).toBeInTheDocument();
    
    // Should show recommendation
    expect(screen.getByText('💡 Tip:')).toBeInTheDocument();
    expect(screen.getByText('Hold the camera steady and ensure the business card is in focus')).toBeInTheDocument();
  });

  it('should limit displayed issues to 2 and show count for more', () => {
    render(<QualityFeedback assessment={mockLowQualityAssessment} isAnalyzing={false} />);
    
    // Should show first 2 issues
    expect(screen.getByText('Image is too blurry for accurate text recognition')).toBeInTheDocument();
    expect(screen.getByText('Image is too dark - increase lighting or exposure')).toBeInTheDocument();
    
    // Should show count for remaining issues
    expect(screen.getByText('+1 more issues')).toBeInTheDocument();
  });

  it('should not show recommendation tip for high quality images', () => {
    render(<QualityFeedback assessment={mockHighQualityAssessment} isAnalyzing={false} />);
    
    expect(screen.queryByText('💡 Tip:')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <QualityFeedback 
        assessment={mockHighQualityAssessment} 
        isAnalyzing={false} 
        className="custom-class"
      />
    );
    
    expect(container.firstChild).toHaveClass('quality-feedback');
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should use correct color scheme based on score', () => {
    const { rerender } = render(
      <QualityFeedback assessment={mockHighQualityAssessment} isAnalyzing={false} />
    );
    
    // High score should have green styling
    expect(screen.getByText('Image Quality: 85/100').closest('.rounded-lg')).toHaveClass('text-green-700', 'bg-green-50', 'border-green-200');
    
    // Test medium score
    const mediumQualityAssessment = { ...mockHighQualityAssessment, score: 65 };
    rerender(<QualityFeedback assessment={mediumQualityAssessment} isAnalyzing={false} />);
    
    expect(screen.getByText('Image Quality: 65/100').closest('.rounded-lg')).toHaveClass('text-yellow-700', 'bg-yellow-50', 'border-yellow-200');
    
    // Test low score
    rerender(<QualityFeedback assessment={mockLowQualityAssessment} isAnalyzing={false} />);
    
    expect(screen.getByText('Image Quality: 45/100').closest('.rounded-lg')).toHaveClass('text-red-700', 'bg-red-50', 'border-red-200');
  });
});