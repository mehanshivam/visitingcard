import { useState, useEffect, useRef, useCallback } from 'react';
import { cameraService, CameraDevice, CameraError, CameraConstraints, CaptureOptions } from '../services/cameraService';
import { isMobileDevice } from '../utils/deviceDetection';
import { optimizeVideoForMobile, cleanupVideoResources, getOptimalVideoConstraints } from '../utils/performanceOptimization';

export interface UseCameraState {
  isSupported: boolean;
  isLoading: boolean;
  isActive: boolean;
  error: CameraError | null;
  devices: CameraDevice[];
  selectedDevice: CameraDevice | null;
  capturedImage: Blob | null;
}

export interface UseCameraActions {
  startCamera: (constraints?: CameraConstraints) => Promise<void>;
  stopCamera: () => void;
  switchCamera: (deviceId: string) => Promise<void>;
  captureImage: (options?: CaptureOptions) => Promise<void>;
  retake: () => void;
  getDevices: () => Promise<void>;
  setVideoRef: (element: HTMLVideoElement | null) => void;
}

export const useCamera = (): [UseCameraState, UseCameraActions] => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  const [state, setState] = useState<UseCameraState>({
    isSupported: cameraService.isSupported(),
    isLoading: false,
    isActive: false,
    error: null,
    devices: [],
    selectedDevice: null,
    capturedImage: null
  });

  const setError = useCallback((error: CameraError | null) => {
    setState((prev: UseCameraState) => ({ ...prev, error, isLoading: false }));
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    setState((prev: UseCameraState) => ({ ...prev, isLoading }));
  }, []);

  const getDevices = useCallback(async () => {
    try {
      setLoading(true);
      const devices = await cameraService.getAvailableDevices();
      setState((prev: UseCameraState) => ({ 
        ...prev, 
        devices, 
        selectedDevice: devices[0] || null,
        isLoading: false,
        error: null
      }));
    } catch (error) {
      setError(error as CameraError);
    }
  }, [setLoading, setError]);

  const startCamera = useCallback(async (constraints?: CameraConstraints) => {
    if (!videoRef.current || !state.isSupported) {
      setError({ name: 'UnsupportedBrowser', message: 'Camera not supported in this browser' });
      return;
    }

    try {
      setLoading(true);
      
      // Apply mobile optimizations
      const isMobile = isMobileDevice();
      const optimalConstraints = isMobile ? {
        ...constraints,
        ...getOptimalVideoConstraints()
      } : constraints;
      
      await cameraService.startCamera(videoRef.current, optimalConstraints);
      
      // Optimize video element for mobile
      if (isMobile) {
        optimizeVideoForMobile(videoRef.current);
      }
      
      setState((prev: UseCameraState) => ({ 
        ...prev, 
        isActive: true, 
        isLoading: false, 
        error: null,
        capturedImage: null
      }));
    } catch (error) {
      setError(error as CameraError);
    }
  }, [state.isSupported, setLoading, setError]);

  const stopCamera = useCallback(() => {
    cameraService.stopCamera();
    
    // Clean up video resources
    if (videoRef.current) {
      cleanupVideoResources(videoRef.current);
    }
    
    setState((prev: UseCameraState) => ({ 
      ...prev, 
      isActive: false, 
      capturedImage: null 
    }));
  }, []);

  const switchCamera = useCallback(async (deviceId: string) => {
    try {
      setLoading(true);
      await cameraService.switchCamera(deviceId);
      const selectedDevice = state.devices.find((device: CameraDevice) => device.deviceId === deviceId) || null;
      setState((prev: UseCameraState) => ({ 
        ...prev, 
        selectedDevice, 
        isLoading: false, 
        error: null 
      }));
    } catch (error) {
      setError(error as CameraError);
    }
  }, [state.devices, setLoading, setError]);

  const captureImage = useCallback(async (options: CaptureOptions = {}) => {
    try {
      setLoading(true);
      
      // Default to high-quality settings for business card scanning
      const captureOptions: CaptureOptions = {
        format: 'image/jpeg',
        quality: 0.95,
        ...options
      };
      
      const imageBlob = await cameraService.captureImage(captureOptions);
      setState((prev: UseCameraState) => ({ 
        ...prev, 
        capturedImage: imageBlob, 
        isActive: false,
        isLoading: false,
        error: null
      }));
      cameraService.stopCamera();
    } catch (error) {
      setError(error as CameraError);
    }
  }, [setLoading, setError]);

  const retake = useCallback(() => {
    setState((prev: UseCameraState) => ({ 
      ...prev, 
      capturedImage: null,
      error: null
    }));
  }, []);

  // Initialize devices on mount
  useEffect(() => {
    if (state.isSupported) {
      getDevices();
    }
  }, [state.isSupported, getDevices]);

  // Set video ref for the hook
  const setVideoRef = useCallback((element: HTMLVideoElement | null) => {
    videoRef.current = element;
  }, []);

  const actions: UseCameraActions = {
    startCamera,
    stopCamera,
    switchCamera,
    captureImage,
    retake,
    getDevices,
    setVideoRef
  };

  return [state, actions];
};