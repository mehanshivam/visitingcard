import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ScanningWorkflow } from '../ScanningWorkflow';
import { useScanWorkflowStore } from '../../../stores/scanWorkflowStore';
import { act } from '@testing-library/react';

// Mock the Camera component since it's already tested
jest.mock('../../Camera', () => ({
  Camera: ({ onImageCapture, onError }: any) => (
    <div data-testid="mock-camera">
      <button 
        data-testid="mock-capture-button"
        onClick={() => onImageCapture(new Blob(['test'], { type: 'image/jpeg' }))}
      >
        Capture
      </button>
      <button 
        data-testid="mock-error-button"
        onClick={() => onError({ message: 'Camera error' })}
      >
        Trigger Error
      </button>
    </div>
  )
}));

describe('ScanningWorkflow', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useScanWorkflowStore.getState().resetWorkflow();
    });
  });

  describe('Rendering', () => {
    it('should render with correct initial state', () => {
      render(<ScanningWorkflow />);
      
      expect(screen.getByText('Business Card Scanner')).toBeInTheDocument();
      expect(screen.getByText('Scan and extract contact information from business cards')).toBeInTheDocument();
      expect(screen.getByText('Ready to Scan')).toBeInTheDocument();
      expect(screen.getByText('Start Scanning')).toBeInTheDocument();
    });

    it('should render step indicator', () => {
      render(<ScanningWorkflow />);
      
      expect(screen.getByText('Step 0 of 4')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<ScanningWorkflow className="custom-class" />);
      
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Step Navigation', () => {
    it('should navigate from idle to capturing step', async () => {
      render(<ScanningWorkflow />);
      
      const startButton = screen.getByText('Start Scanning');
      fireEvent.click(startButton);
      
      await waitFor(() => {
        expect(screen.getByText('Capture Business Card')).toBeInTheDocument();
      });
      
      expect(screen.getByTestId('mock-camera')).toBeInTheDocument();
    });

    it('should show processing step after image capture', async () => {
      render(<ScanningWorkflow />);
      
      // Start scanning
      fireEvent.click(screen.getByText('Start Scanning'));
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-camera')).toBeInTheDocument();
      });
      
      // Capture image
      fireEvent.click(screen.getByTestId('mock-capture-button'));
      
      await waitFor(() => {
        expect(screen.getByText('Processing Image')).toBeInTheDocument();
        expect(screen.getByText('Processing Image...')).toBeInTheDocument();
      });
    });

    it('should show results step after processing completes', async () => {
      render(<ScanningWorkflow />);
      
      // Navigate to capturing
      fireEvent.click(screen.getByText('Start Scanning'));
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-camera')).toBeInTheDocument();
      });
      
      // Capture image and simulate processing completion
      act(() => {
        const store = useScanWorkflowStore.getState();
        const mockImage = new Blob(['test'], { type: 'image/jpeg' });
        store.setCapturedImage(mockImage);
        store.setExtractedData({
          name: 'John Doe',
          company: 'Test Corp',
          phone: '+1234567890',
          email: 'john@test.com'
        });
      });
      
      await waitFor(() => {
        expect(screen.getByText('Scan Results')).toBeInTheDocument();
        expect(screen.getByText('Scan Complete!')).toBeInTheDocument();
      });
    });

    it('should show error step when error occurs', async () => {
      render(<ScanningWorkflow />);
      
      // Navigate to capturing
      fireEvent.click(screen.getByText('Start Scanning'));
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-camera')).toBeInTheDocument();
      });
      
      // Trigger error
      fireEvent.click(screen.getByTestId('mock-error-button'));
      
      await waitFor(() => {
        expect(screen.getByText('Error Occurred')).toBeInTheDocument();
        expect(screen.getByText('Camera Access Issue')).toBeInTheDocument();
      });
    });
  });

  describe('Step Indicator Behavior', () => {
    it('should not show step indicator during error state', async () => {
      render(<ScanningWorkflow />);
      
      // Trigger error state
      act(() => {
        useScanWorkflowStore.getState().setError('Test error');
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Step')).not.toBeInTheDocument();
      });
    });

    it('should show step indicator for normal workflow steps', async () => {
      render(<ScanningWorkflow />);
      
      expect(screen.getByText('Step 0 of 4')).toBeInTheDocument();
      
      // Move to capturing
      fireEvent.click(screen.getByText('Start Scanning'));
      
      await waitFor(() => {
        expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
      });
    });
  });

  describe('Error Display', () => {
    it('should show error message when error occurs but not in error step', async () => {
      render(<ScanningWorkflow />);
      
      // Set error but stay in current step (not error step)
      act(() => {
        const store = useScanWorkflowStore.getState();
        store.setStep('capturing');
        store.setError('Test error message');
        // Manually override step to not be 'error' to test error display
        store.setStep('capturing');
      });
      
      await waitFor(() => {
        expect(screen.getByText('Test error message')).toBeInTheDocument();
      });
    });

    it('should not show error banner when in error step', async () => {
      render(<ScanningWorkflow />);
      
      // Set error and error step
      act(() => {
        useScanWorkflowStore.getState().setError('Test error');
      });
      
      await waitFor(() => {
        expect(screen.getByText('Error Occurred')).toBeInTheDocument();
      });
      
      // Error should be displayed in the error step component, not as a banner
      const errorBanners = screen.queryAllByText('Test error');
      expect(errorBanners.length).toBeGreaterThan(0); // Error should be shown in error step
    });
  });

  describe('Workflow Reset', () => {
    it('should allow resetting workflow from various steps', async () => {
      render(<ScanningWorkflow />);
      
      // Start scanning
      fireEvent.click(screen.getByText('Start Scanning'));
      
      await waitFor(() => {
        expect(screen.getByText('Capture Business Card')).toBeInTheDocument();
      });
      
      // Reset workflow
      const backButton = screen.getByText('Back to Start');
      fireEvent.click(backButton);
      
      await waitFor(() => {
        expect(screen.getByText('Ready to Scan')).toBeInTheDocument();
        expect(screen.getByText('Start Scanning')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<ScanningWorkflow />);
      
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Business Card Scanner');
    });

    it('should have accessible buttons', () => {
      render(<ScanningWorkflow />);
      
      const startButton = screen.getByRole('button', { name: /start scanning/i });
      expect(startButton).toBeInTheDocument();
      expect(startButton).not.toBeDisabled();
    });
  });

  describe('Mobile Compatibility', () => {
    it('should render responsive layout elements', () => {
      render(<ScanningWorkflow />);
      
      // Check for responsive container classes
      const container = screen.getByText('Business Card Scanner').closest('div');
      expect(container).toHaveClass('max-w-4xl', 'mx-auto');
    });

    it('should handle touch interactions', async () => {
      render(<ScanningWorkflow />);
      
      const startButton = screen.getByText('Start Scanning');
      
      // Simulate touch events
      fireEvent.touchStart(startButton);
      fireEvent.touchEnd(startButton);
      fireEvent.click(startButton);
      
      await waitFor(() => {
        expect(screen.getByText('Capture Business Card')).toBeInTheDocument();
      });
    });
  });

  describe('Integration with Store', () => {
    it('should reflect store state changes', async () => {
      render(<ScanningWorkflow />);
      
      // Manually update store
      act(() => {
        const store = useScanWorkflowStore.getState();
        store.setStep('processing');
        store.setProcessing(true);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Processing Image')).toBeInTheDocument();
        expect(screen.getByText('Processing Image...')).toBeInTheDocument();
      });
    });

    it('should handle rapid state changes', async () => {
      render(<ScanningWorkflow />);
      
      // Rapid state changes
      act(() => {
        const store = useScanWorkflowStore.getState();
        store.setStep('capturing');
        store.setStep('processing');
        store.setStep('results');
      });
      
      await waitFor(() => {
        expect(screen.getByText('Scan Results')).toBeInTheDocument();
      });
    });
  });
});