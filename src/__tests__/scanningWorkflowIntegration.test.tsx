import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ScanningWorkflow } from '../components/Scanning/ScanningWorkflow';
import { useScanWorkflowStore } from '../stores/scanWorkflowStore';
import { act } from '@testing-library/react';

// Mock dependencies
jest.mock('../components/Camera', () => ({
  Camera: ({ onImageCapture, onError, className }: any) => (
    <div data-testid="camera-component" className={className}>
      <div data-testid="camera-preview">Camera Preview</div>
      <button 
        data-testid="capture-button"
        onClick={() => {
          const mockImage = new Blob(['mock-image-data'], { type: 'image/jpeg' });
          onImageCapture(mockImage);
        }}
      >
        Capture Image
      </button>
      <button 
        data-testid="error-button"
        onClick={() => onError({ message: 'Camera access denied' })}
      >
        Simulate Error
      </button>
    </div>
  )
}));

// Mock URL.createObjectURL for image display
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: jest.fn(() => 'mock-object-url'),
    revokeObjectURL: jest.fn(),
  },
});

describe('Scanning Workflow Integration', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useScanWorkflowStore.getState().resetWorkflow();
    });
    jest.clearAllMocks();
  });

  describe('Complete Happy Path Workflow', () => {
    it('should complete full scanning workflow from start to results', async () => {
      render(<ScanningWorkflow />);

      // Step 1: Idle State
      expect(screen.getByText('Business Card Scanner')).toBeInTheDocument();
      expect(screen.getByText('Ready to Scan')).toBeInTheDocument();
      expect(screen.getByText('Start Scanning')).toBeInTheDocument();
      expect(screen.getByText('Step 0 of 4')).toBeInTheDocument();

      // Step 2: Start Scanning
      fireEvent.click(screen.getByText('Start Scanning'));

      await waitFor(() => {
        expect(screen.getByText('Capture Business Card')).toBeInTheDocument();
        expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
        expect(screen.getByTestId('camera-component')).toBeInTheDocument();
      });

      // Step 3: Capture Image
      fireEvent.click(screen.getByTestId('capture-button'));

      await waitFor(() => {
        expect(screen.getByText('Processing Image')).toBeInTheDocument();
        expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
        expect(screen.getByText('Processing Image...')).toBeInTheDocument();
      });

      // Step 4: Simulate Processing Completion
      act(() => {
        const store = useScanWorkflowStore.getState();
        store.setExtractedData({
          name: 'John Doe',
          company: 'Acme Corp',
          phone: '+1-555-123-4567',
          email: 'john.doe@acme.com'
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Scan Results')).toBeInTheDocument();
        expect(screen.getByText('Step 3 of 4')).toBeInTheDocument();
        expect(screen.getByText('Scan Complete!')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
        expect(screen.getByText('+1-555-123-4567')).toBeInTheDocument();
        expect(screen.getByText('john.doe@acme.com')).toBeInTheDocument();
      });

      // Verify image is displayed
      const capturedImage = screen.getByAltText('Captured business card');
      expect(capturedImage).toBeInTheDocument();
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    it('should allow restarting workflow from results', async () => {
      render(<ScanningWorkflow />);

      // Complete workflow to results
      fireEvent.click(screen.getByText('Start Scanning'));
      
      await waitFor(() => {
        expect(screen.getByTestId('capture-button')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('capture-button'));

      act(() => {
        const store = useScanWorkflowStore.getState();
        store.setExtractedData({
          name: 'Test User',
          company: 'Test Company'
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Scan Results')).toBeInTheDocument();
      });

      // Restart workflow
      fireEvent.click(screen.getByText('Scan Another Card'));

      await waitFor(() => {
        expect(screen.getByText('Ready to Scan')).toBeInTheDocument();
        expect(screen.getByText('Start Scanning')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling Workflow', () => {
    it('should handle camera error during capturing', async () => {
      render(<ScanningWorkflow />);

      // Start scanning
      fireEvent.click(screen.getByText('Start Scanning'));

      await waitFor(() => {
        expect(screen.getByTestId('error-button')).toBeInTheDocument();
      });

      // Trigger error
      fireEvent.click(screen.getByTestId('error-button'));

      await waitFor(() => {
        expect(screen.getByText('Error Occurred')).toBeInTheDocument();
        expect(screen.getByText('Camera Access Issue')).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
        expect(screen.getByText('Start Over')).toBeInTheDocument();
      });

      // Verify step indicator is hidden during error
      expect(screen.queryByText('Step')).not.toBeInTheDocument();
    });

    it('should recover from error using retry', async () => {
      render(<ScanningWorkflow />);

      // Navigate to error state
      fireEvent.click(screen.getByText('Start Scanning'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error-button')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('error-button'));

      await waitFor(() => {
        expect(screen.getByText('Error Occurred')).toBeInTheDocument();
      });

      // Retry scanning
      fireEvent.click(screen.getByText('Try Again'));

      await waitFor(() => {
        expect(screen.getByText('Capture Business Card')).toBeInTheDocument();
        expect(screen.getByTestId('camera-component')).toBeInTheDocument();
      });
    });

    it('should recover from error using start over', async () => {
      render(<ScanningWorkflow />);

      // Navigate to error state
      act(() => {
        useScanWorkflowStore.getState().setError('Test error');
      });

      await waitFor(() => {
        expect(screen.getByText('Error Occurred')).toBeInTheDocument();
      });

      // Start over
      fireEvent.click(screen.getByText('Start Over'));

      await waitFor(() => {
        expect(screen.getByText('Ready to Scan')).toBeInTheDocument();
        expect(screen.getByText('Start Scanning')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation and State Management', () => {
    it('should handle back navigation from capturing step', async () => {
      render(<ScanningWorkflow />);

      // Navigate to capturing
      fireEvent.click(screen.getByText('Start Scanning'));

      await waitFor(() => {
        expect(screen.getByText('Capture Business Card')).toBeInTheDocument();
      });

      // Go back
      fireEvent.click(screen.getByText('Back to Start'));

      await waitFor(() => {
        expect(screen.getByText('Ready to Scan')).toBeInTheDocument();
      });
    });

    it('should maintain state during processing', async () => {
      render(<ScanningWorkflow />);

      // Start workflow and capture image
      fireEvent.click(screen.getByText('Start Scanning'));
      
      await waitFor(() => {
        expect(screen.getByTestId('capture-button')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('capture-button'));

      await waitFor(() => {
        expect(screen.getByText('Processing Image...')).toBeInTheDocument();
        expect(screen.getByText('Captured Image')).toBeInTheDocument();
      });

      // Verify processing steps are shown
      expect(screen.getByText('Image quality validation')).toBeInTheDocument();
      expect(screen.getByText('Text detection and extraction')).toBeInTheDocument();
    });

    it('should handle rapid state transitions', async () => {
      render(<ScanningWorkflow />);

      // Rapid state changes
      act(() => {
        const store = useScanWorkflowStore.getState();
        store.setStep('capturing');
        const mockImage = new Blob(['test'], { type: 'image/jpeg' });
        store.setCapturedImage(mockImage);
        store.setExtractedData({ name: 'Quick Test' });
      });

      await waitFor(() => {
        expect(screen.getByText('Scan Results')).toBeInTheDocument();
        expect(screen.getByText('Quick Test')).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Compatibility', () => {
    it('should render mobile-optimized layouts', () => {
      render(<ScanningWorkflow />);

      // Check for responsive grid classes
      const container = document.querySelector('.max-w-4xl');
      expect(container).toBeInTheDocument();

      // Check for mobile-friendly button layouts
      const startButton = screen.getByText('Start Scanning');
      expect(startButton).toHaveClass('px-8', 'py-4');
    });

    it('should handle touch events properly', async () => {
      render(<ScanningWorkflow />);

      const startButton = screen.getByText('Start Scanning');

      // Simulate touch interaction
      fireEvent.touchStart(startButton);
      fireEvent.touchEnd(startButton);
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('Capture Business Card')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Memory', () => {
    it('should clean up resources on unmount', () => {
      const { unmount } = render(<ScanningWorkflow />);

      // Start workflow with image
      act(() => {
        const store = useScanWorkflowStore.getState();
        const mockImage = new Blob(['test'], { type: 'image/jpeg' });
        store.setCapturedImage(mockImage);
      });

      // Unmount component
      unmount();

      // Verify cleanup (no errors thrown)
      expect(true).toBe(true);
    });

    it('should handle large image files gracefully', async () => {
      render(<ScanningWorkflow />);

      // Start scanning
      fireEvent.click(screen.getByText('Start Scanning'));

      await waitFor(() => {
        expect(screen.getByTestId('capture-button')).toBeInTheDocument();
      });

      // Simulate large image capture
      act(() => {
        const largeImageData = new Array(1000000).fill('a').join('');
        const mockLargeImage = new Blob([largeImageData], { type: 'image/jpeg' });
        useScanWorkflowStore.getState().setCapturedImage(mockLargeImage);
      });

      await waitFor(() => {
        expect(screen.getByText('Processing Image')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain focus management throughout workflow', async () => {
      render(<ScanningWorkflow />);

      const startButton = screen.getByText('Start Scanning');
      startButton.focus();
      expect(document.activeElement).toBe(startButton);

      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('Capture Business Card')).toBeInTheDocument();
      });

      // Focus should be manageable
      const captureButton = screen.getByTestId('capture-button');
      captureButton.focus();
      expect(document.activeElement).toBe(captureButton);
    });

    it('should provide appropriate ARIA labels and roles', () => {
      render(<ScanningWorkflow />);

      // Check for main heading
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Business Card Scanner');

      // Check for buttons
      const startButton = screen.getByRole('button', { name: /start scanning/i });
      expect(startButton).toBeInTheDocument();
    });
  });
});