import { act, renderHook } from '@testing-library/react';
import { useScanWorkflow } from '../useScanWorkflow';
import { useScanWorkflowStore } from '../../stores/scanWorkflowStore';

describe('useScanWorkflow', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useScanWorkflowStore.getState().resetWorkflow();
    });
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Initial State', () => {
    it('should provide initial state from store', () => {
      const { result } = renderHook(() => useScanWorkflow());
      
      expect(result.current.currentStep).toBe('idle');
      expect(result.current.capturedImage).toBeNull();
      expect(result.current.extractedData).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isProcessing).toBe(false);
    });
  });

  describe('Workflow Actions', () => {
    it('should start scanning', () => {
      const { result } = renderHook(() => useScanWorkflow());
      
      act(() => {
        result.current.startScanning();
      });
      
      expect(result.current.currentStep).toBe('capturing');
    });

    it('should handle image capture with processing simulation', () => {
      const { result } = renderHook(() => useScanWorkflow());
      const mockImage = new Blob(['test'], { type: 'image/jpeg' });
      
      act(() => {
        result.current.handleImageCapture(mockImage);
      });
      
      expect(result.current.capturedImage).toBe(mockImage);
      expect(result.current.currentStep).toBe('processing');
      expect(result.current.isProcessing).toBe(true);
      
      // Fast-forward the setTimeout
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      
      expect(result.current.currentStep).toBe('results');
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.extractedData).toEqual({
        name: 'Processing...',
        company: 'Processing...',
        phone: 'Processing...',
        email: 'Processing...',
      });
    });

    it('should handle errors', () => {
      const { result } = renderHook(() => useScanWorkflow());
      const errorMessage = 'Camera access denied';
      
      act(() => {
        result.current.handleError(errorMessage);
      });
      
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.currentStep).toBe('error');
    });

    it('should retry scanning after error', () => {
      const { result } = renderHook(() => useScanWorkflow());
      
      // Set error state
      act(() => {
        result.current.handleError('Some error');
      });
      expect(result.current.currentStep).toBe('error');
      
      // Retry scanning
      act(() => {
        result.current.retryScanning();
      });
      
      expect(result.current.error).toBeNull();
      expect(result.current.currentStep).toBe('capturing');
    });

    it('should reset workflow', () => {
      const { result } = renderHook(() => useScanWorkflow());
      const mockImage = new Blob(['test'], { type: 'image/jpeg' });
      
      // Set up some state
      act(() => {
        result.current.handleImageCapture(mockImage);
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

  describe('Navigation Utilities', () => {
    it('should determine if can go next based on current step', () => {
      const { result } = renderHook(() => useScanWorkflow());
      
      // Idle step - can always go next
      expect(result.current.canGoNext()).toBe(true);
      
      // Capturing step - can go next only if image captured
      act(() => {
        result.current.startScanning();
      });
      expect(result.current.canGoNext()).toBe(false);
      
      const mockImage = new Blob(['test'], { type: 'image/jpeg' });
      act(() => {
        result.current.handleImageCapture(mockImage);
      });
      expect(result.current.canGoNext()).toBe(false); // Still processing
      
      // Complete processing
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      
      // Now should be in results step where canGoNext is false
      expect(result.current.currentStep).toBe('results');
      expect(result.current.canGoNext()).toBe(false);
      
      // Results step - cannot go next
      expect(result.current.currentStep).toBe('results');
      expect(result.current.canGoNext()).toBe(false);
    });

    it('should determine if can go previous', () => {
      const { result } = renderHook(() => useScanWorkflow());
      
      // Idle step - cannot go previous
      expect(result.current.canGoPrevious()).toBe(false);
      
      // Capturing step - can go previous
      act(() => {
        result.current.startScanning();
      });
      expect(result.current.canGoPrevious()).toBe(true);
      
      // Error step - cannot go previous
      act(() => {
        result.current.handleError('Test error');
      });
      expect(result.current.canGoPrevious()).toBe(false);
    });
  });

  describe('Step Information Utilities', () => {
    it('should provide correct step titles', () => {
      const { result } = renderHook(() => useScanWorkflow());
      
      expect(result.current.getStepTitle('idle')).toBe('Ready to Scan');
      expect(result.current.getStepTitle('capturing')).toBe('Capture Business Card');
      expect(result.current.getStepTitle('processing')).toBe('Processing Image');
      expect(result.current.getStepTitle('results')).toBe('Scan Results');
      expect(result.current.getStepTitle('error')).toBe('Error Occurred');
    });

    it('should provide correct step descriptions', () => {
      const { result } = renderHook(() => useScanWorkflow());
      
      expect(result.current.getStepDescription('idle')).toBe('Click start to begin scanning a business card');
      expect(result.current.getStepDescription('capturing')).toBe('Position the business card in the frame and capture');
      expect(result.current.getStepDescription('processing')).toBe('Extracting text from your business card image');
      expect(result.current.getStepDescription('results')).toBe('Review and edit the extracted information');
      expect(result.current.getStepDescription('error')).toBe('Something went wrong during the scanning process');
    });

    it('should provide correct step numbers', () => {
      const { result } = renderHook(() => useScanWorkflow());
      
      expect(result.current.getStepNumber('idle')).toBe(0);
      expect(result.current.getStepNumber('capturing')).toBe(1);
      expect(result.current.getStepNumber('processing')).toBe(2);
      expect(result.current.getStepNumber('results')).toBe(3);
      expect(result.current.getStepNumber('error')).toBe(-1);
    });

    it('should provide total steps count', () => {
      const { result } = renderHook(() => useScanWorkflow());
      
      expect(result.current.getTotalSteps()).toBe(4);
    });
  });

  describe('Complete Workflow Integration', () => {
    it('should handle complete happy path workflow', () => {
      const { result } = renderHook(() => useScanWorkflow());
      const mockImage = new Blob(['test'], { type: 'image/jpeg' });
      
      // Start scanning
      act(() => {
        result.current.startScanning();
      });
      expect(result.current.currentStep).toBe('capturing');
      expect(result.current.getStepTitle(result.current.currentStep)).toBe('Capture Business Card');
      
      // Capture image
      act(() => {
        result.current.handleImageCapture(mockImage);
      });
      expect(result.current.currentStep).toBe('processing');
      expect(result.current.isProcessing).toBe(true);
      
      // Complete processing
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(result.current.currentStep).toBe('results');
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.extractedData).toBeDefined();
      
      // Check navigation abilities
      expect(result.current.canGoNext()).toBe(false);
      expect(result.current.canGoPrevious()).toBe(true);
    });

    it('should handle error workflow', () => {
      const { result } = renderHook(() => useScanWorkflow());
      
      // Start scanning
      act(() => {
        result.current.startScanning();
      });
      
      // Encounter error
      act(() => {
        result.current.handleError('Camera permission denied');
      });
      expect(result.current.currentStep).toBe('error');
      expect(result.current.error).toBe('Camera permission denied');
      expect(result.current.canGoPrevious()).toBe(false);
      
      // Retry scanning
      act(() => {
        result.current.retryScanning();
      });
      expect(result.current.currentStep).toBe('capturing');
      expect(result.current.error).toBeNull();
    });
  });
});