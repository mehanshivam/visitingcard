import { act, renderHook } from '@testing-library/react';
import { useScanWorkflowStore, ScanWorkflowStep } from '../scanWorkflowStore';

describe('ScanWorkflowStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useScanWorkflowStore.getState().resetWorkflow();
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useScanWorkflowStore());
      
      expect(result.current.currentStep).toBe('idle');
      expect(result.current.capturedImage).toBeNull();
      expect(result.current.extractedData).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isProcessing).toBe(false);
    });
  });

  describe('Step Management', () => {
    it('should set step correctly', () => {
      const { result } = renderHook(() => useScanWorkflowStore());
      
      act(() => {
        result.current.setStep('capturing');
      });
      
      expect(result.current.currentStep).toBe('capturing');
      expect(result.current.error).toBeNull();
    });

    it('should navigate to next step', () => {
      const { result } = renderHook(() => useScanWorkflowStore());
      
      act(() => {
        result.current.nextStep();
      });
      
      expect(result.current.currentStep).toBe('capturing');
    });

    it('should navigate to previous step', () => {
      const { result } = renderHook(() => useScanWorkflowStore());
      
      act(() => {
        result.current.setStep('capturing');
        result.current.previousStep();
      });
      
      expect(result.current.currentStep).toBe('idle');
    });

    it('should not go beyond first step when going previous', () => {
      const { result } = renderHook(() => useScanWorkflowStore());
      
      act(() => {
        result.current.previousStep();
      });
      
      expect(result.current.currentStep).toBe('idle');
    });

    it('should not go beyond last step when going next', () => {
      const { result } = renderHook(() => useScanWorkflowStore());
      
      act(() => {
        result.current.setStep('results');
        result.current.nextStep();
      });
      
      expect(result.current.currentStep).toBe('results');
    });
  });

  describe('Image Handling', () => {
    it('should set captured image and transition to processing', () => {
      const { result } = renderHook(() => useScanWorkflowStore());
      const mockImage = new Blob(['test'], { type: 'image/jpeg' });
      
      act(() => {
        result.current.setCapturedImage(mockImage);
      });
      
      expect(result.current.capturedImage).toBe(mockImage);
      expect(result.current.currentStep).toBe('processing');
      expect(result.current.isProcessing).toBe(true);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Data Extraction', () => {
    it('should set extracted data and transition to results', () => {
      const { result } = renderHook(() => useScanWorkflowStore());
      const mockData = { name: 'John Doe', email: 'john@example.com' };
      
      act(() => {
        result.current.setExtractedData(mockData);
      });
      
      expect(result.current.extractedData).toEqual(mockData);
      expect(result.current.currentStep).toBe('results');
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should set error and transition to error state', () => {
      const { result } = renderHook(() => useScanWorkflowStore());
      const errorMessage = 'Camera access denied';
      
      act(() => {
        result.current.setError(errorMessage);
      });
      
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.currentStep).toBe('error');
      expect(result.current.isProcessing).toBe(false);
    });

    it('should clear error when set to null', () => {
      const { result } = renderHook(() => useScanWorkflowStore());
      
      act(() => {
        result.current.setError('Some error');
        result.current.setError(null);
      });
      
      expect(result.current.error).toBeNull();
      expect(result.current.currentStep).toBe('error'); // Step doesn't change when clearing error
    });
  });

  describe('Processing State', () => {
    it('should set processing state', () => {
      const { result } = renderHook(() => useScanWorkflowStore());
      
      act(() => {
        result.current.setProcessing(true);
      });
      
      expect(result.current.isProcessing).toBe(true);
      
      act(() => {
        result.current.setProcessing(false);
      });
      
      expect(result.current.isProcessing).toBe(false);
    });
  });

  describe('Workflow Reset', () => {
    it('should reset all state to initial values', () => {
      const { result } = renderHook(() => useScanWorkflowStore());
      const mockImage = new Blob(['test'], { type: 'image/jpeg' });
      
      // Set up some state
      act(() => {
        result.current.setCapturedImage(mockImage);
        result.current.setExtractedData({ name: 'Test' });
        result.current.setError('Test error');
      });
      
      // Reset workflow
      act(() => {
        result.current.resetWorkflow();
      });
      
      expect(result.current.currentStep).toBe('idle');
      expect(result.current.capturedImage).toBeNull();
      expect(result.current.extractedData).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isProcessing).toBe(false);
    });
  });

  describe('Complex Workflow Scenarios', () => {
    it('should handle complete scanning workflow', () => {
      const { result } = renderHook(() => useScanWorkflowStore());
      const mockImage = new Blob(['test'], { type: 'image/jpeg' });
      const mockData = { name: 'John Doe', company: 'Test Corp' };
      
      // Start capturing
      act(() => {
        result.current.setStep('capturing');
      });
      expect(result.current.currentStep).toBe('capturing');
      
      // Capture image
      act(() => {
        result.current.setCapturedImage(mockImage);
      });
      expect(result.current.currentStep).toBe('processing');
      expect(result.current.isProcessing).toBe(true);
      
      // Complete processing
      act(() => {
        result.current.setExtractedData(mockData);
      });
      expect(result.current.currentStep).toBe('results');
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.extractedData).toEqual(mockData);
    });

    it('should handle error during processing', () => {
      const { result } = renderHook(() => useScanWorkflowStore());
      const mockImage = new Blob(['test'], { type: 'image/jpeg' });
      
      // Start processing
      act(() => {
        result.current.setCapturedImage(mockImage);
      });
      expect(result.current.isProcessing).toBe(true);
      
      // Error occurs
      act(() => {
        result.current.setError('Processing failed');
      });
      expect(result.current.currentStep).toBe('error');
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.error).toBe('Processing failed');
    });
  });
});