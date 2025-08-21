import { create } from 'zustand';

export type ScanWorkflowStep = 'idle' | 'capturing' | 'processing' | 'results' | 'error';

export interface ExtractedContactData {
  name?: string;
  title?: string;        // Job title/designation
  company?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: {           // Address components
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    full?: string;      // Complete address string
  };
}

export interface ScanWorkflowState {
  currentStep: ScanWorkflowStep;
  capturedImage: Blob | null;
  extractedData: ExtractedContactData | null;
  error: string | null;
  isProcessing: boolean;
}

export interface ScanWorkflowActions {
  setStep: (step: ScanWorkflowStep) => void;
  setCapturedImage: (image: Blob) => void;
  setExtractedData: (data: ExtractedContactData) => void;
  setError: (error: string | null) => void;
  setProcessing: (processing: boolean) => void;
  resetWorkflow: () => void;
  nextStep: () => void;
  previousStep: () => void;
}

export type ScanWorkflowStore = ScanWorkflowState & ScanWorkflowActions;

const initialState: ScanWorkflowState = {
  currentStep: 'idle',
  capturedImage: null,
  extractedData: null,
  error: null,
  isProcessing: false,
};

const stepOrder: ScanWorkflowStep[] = ['idle', 'capturing', 'processing', 'results'];

export const useScanWorkflowStore = create<ScanWorkflowStore>((set, get) => ({
  ...initialState,

  setStep: (step: ScanWorkflowStep) => {
    set({ currentStep: step, error: null });
  },

  setCapturedImage: (image: Blob) => {
    set({ 
      capturedImage: image,
      currentStep: 'processing',
      isProcessing: true,
      error: null 
    });
  },

  setExtractedData: (data: ExtractedContactData) => {
    set({ 
      extractedData: data,
      currentStep: 'results',
      isProcessing: false,
      error: null 
    });
  },

  setError: (error: string | null) => {
    set({ 
      error,
      currentStep: error ? 'error' : get().currentStep,
      isProcessing: false 
    });
  },

  setProcessing: (processing: boolean) => {
    set({ isProcessing: processing });
  },

  resetWorkflow: () => {
    set({ ...initialState });
  },

  nextStep: () => {
    const { currentStep } = get();
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex >= 0 && currentIndex < stepOrder.length - 1) {
      set({ currentStep: stepOrder[currentIndex + 1], error: null });
    }
  },

  previousStep: () => {
    const { currentStep } = get();
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      set({ currentStep: stepOrder[currentIndex - 1], error: null });
    }
  },
}));