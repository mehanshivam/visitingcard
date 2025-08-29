import { useCallback } from 'react';
import { useScanWorkflowStore, ScanWorkflowStep } from '../stores/scanWorkflowStore';
import { ocrServiceWrapper } from '../services/ocrServiceWrapper';

export const useScanWorkflow = () => {
  const {
    currentStep,
    capturedImage,
    extractedData,
    error,
    isProcessing,
    setStep,
    setCapturedImage,
    setExtractedData,
    setError,
    setProcessing,
    resetWorkflow,
    nextStep,
    previousStep,
  } = useScanWorkflowStore();

  const startScanning = useCallback(() => {
    setStep('capturing');
  }, [setStep]);

  const handleImageCapture = useCallback(async (image: Blob) => {
    setCapturedImage(image);
    setProcessing(true);
    setStep('processing');
    
    try {
      // Process image with hybrid OCR service
      const result = await ocrServiceWrapper.processImage(image);
      const { data: contactData, stats } = result;
      
      // Check confidence threshold (60% minimum as configured)
      if (stats.confidence < 60) {
        throw new Error(`Low OCR confidence: ${stats.confidence.toFixed(1)}%. Please try with a clearer image.`);
      }
      
      // Log processing stats for monitoring
      console.log(`📊 Processing stats:`, {
        processor: stats.processor,
        time: stats.processingTime,
        confidence: stats.confidence,
        fallback: stats.fallbackUsed,
        cost: stats.costEstimate
      });
      
      // Set extracted data (already in correct format from ocrServiceWrapper)
      setExtractedData({
        name: contactData.name || 'Unknown',
        title: contactData.title || undefined,
        company: contactData.company || 'Unknown', 
        phone: contactData.phone || 'Not found',
        email: contactData.email || 'Not found',
        website: contactData.website || 'Not found',
        address: contactData.address || undefined,
      });
      
      setStep('results');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OCR processing failed';
      setError(errorMessage);
      setStep('error');
    } finally {
      setProcessing(false);
    }
  }, [setCapturedImage, setExtractedData, setProcessing, setStep, setError]);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, [setError]);

  const retryScanning = useCallback(() => {
    setError(null);
    setStep('capturing');
  }, [setError, setStep]);

  const canGoNext = useCallback((): boolean => {
    switch (currentStep) {
      case 'idle':
        return true;
      case 'capturing':
        return capturedImage !== null;
      case 'processing':
        return !isProcessing && extractedData !== null;
      case 'results':
        return false;
      default:
        return false;
    }
  }, [currentStep, capturedImage, isProcessing, extractedData]);

  const canGoPrevious = useCallback((): boolean => {
    return currentStep !== 'idle' && currentStep !== 'error';
  }, [currentStep]);

  const getStepTitle = useCallback((step: ScanWorkflowStep): string => {
    switch (step) {
      case 'idle':
        return 'Ready to Scan';
      case 'capturing':
        return 'Capture Business Card';
      case 'processing':
        return 'Processing Image';
      case 'results':
        return 'Scan Results';
      case 'error':
        return 'Error Occurred';
      default:
        return 'Unknown Step';
    }
  }, []);

  const getStepDescription = useCallback((step: ScanWorkflowStep): string => {
    switch (step) {
      case 'idle':
        return 'Click start to begin scanning a business card';
      case 'capturing':
        return 'Position the business card in the frame and capture';
      case 'processing':
        return 'Extracting text from your business card image';
      case 'results':
        return 'Review and edit the extracted information';
      case 'error':
        return 'Something went wrong during the scanning process';
      default:
        return '';
    }
  }, []);

  const getStepNumber = useCallback((step: ScanWorkflowStep): number => {
    const stepNumbers = {
      idle: 0,
      capturing: 1,
      processing: 2,
      results: 3,
      error: -1,
    };
    return stepNumbers[step];
  }, []);

  const getTotalSteps = useCallback((): number => {
    return 4; // idle, capturing, processing, results
  }, []);

  return {
    // State
    currentStep,
    capturedImage,
    extractedData,
    error,
    isProcessing,
    
    // Actions
    startScanning,
    handleImageCapture,
    handleError,
    retryScanning,
    resetWorkflow,
    nextStep,
    previousStep,
    
    // Utilities
    canGoNext,
    canGoPrevious,
    getStepTitle,
    getStepDescription,
    getStepNumber,
    getTotalSteps,
  };
};