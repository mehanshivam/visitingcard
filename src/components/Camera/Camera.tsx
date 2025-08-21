import React, { useRef, useEffect, useState } from 'react';
import { useCamera } from '../../hooks/useCamera';
import { CameraError } from '../../services/cameraService';
import { isMobileDevice, isTouchDevice } from '../../utils/deviceDetection';
import { imageQualityService, QualityAssessment } from '../../services/imageQualityService';
import { QualityFeedback } from './QualityFeedback';

export interface CameraProps {
  onImageCapture?: (imageBlob: Blob) => void;
  onError?: (error: CameraError) => void;
  className?: string;
}

export const Camera: React.FC<CameraProps> = ({
  onImageCapture,
  onError,
  className = ''
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, actions] = useCamera();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [qualityAssessment, setQualityAssessment] = useState<QualityAssessment | null>(null);
  const [isAnalyzingQuality, setIsAnalyzingQuality] = useState(false);
  const [showQualityFeedback, setShowQualityFeedback] = useState(true);
  const isMobile = isMobileDevice();
  const isTouch = isTouchDevice();

  useEffect(() => {
    if (videoRef.current) {
      actions.setVideoRef(videoRef.current);
    }
  }, [actions]);

  useEffect(() => {
    if (state.error && onError) {
      onError(state.error);
    }
  }, [state.error, onError]);

  // Track if we've already processed this captured image to avoid duplicates
  const [processedImage, setProcessedImage] = useState<Blob | null>(null);

  useEffect(() => {
    if (state.capturedImage && state.capturedImage !== processedImage) {
      // Analyze image quality when a new image is captured
      analyzeImageQuality(state.capturedImage);
      
      if (onImageCapture) {
        onImageCapture(state.capturedImage);
      }
      setProcessedImage(state.capturedImage);
    }
  }, [state.capturedImage, onImageCapture, processedImage]);

  const analyzeImageQuality = async (imageBlob: Blob) => {
    try {
      setIsAnalyzingQuality(true);
      const assessment = await imageQualityService.analyzeImage(imageBlob);
      setQualityAssessment(assessment);
    } catch (error) {
      console.error('Failed to analyze image quality:', error);
      setQualityAssessment(null);
    } finally {
      setIsAnalyzingQuality(false);
    }
  };

  const handleStartCamera = async () => {
    await actions.startCamera();
  };

  const handleStopCamera = () => {
    actions.stopCamera();
  };

  const handleSwitchCamera = async (deviceId: string) => {
    await actions.switchCamera(deviceId);
  };

  const handleCaptureImage = async () => {
    await actions.captureImage();
  };

  const handleRetake = () => {
    actions.retake();
    setIsFullscreen(false);
    setProcessedImage(null); // Clear processed image tracking
    setQualityAssessment(null); // Clear quality assessment
    setIsAnalyzingQuality(false);
    setShowQualityFeedback(true); // Reset quality feedback for next capture
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Handle mobile-specific touch interactions
  const handleTouchCapture = () => {
    if (isTouch && state.isActive && !state.isLoading) {
      handleCaptureImage();
    }
  };

  if (!state.isSupported) {
    const isHTTPS = window.location.protocol === 'https:';
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const needsHTTPS = isMobile && !isHTTPS && !isLocalhost;
    
    return (
      <div className={`camera-unsupported ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Camera not available
              </h3>
              <div className="mt-1 text-sm text-red-700">
                {needsHTTPS ? (
                  <div>
                    <p className="font-medium">Mobile cameras require HTTPS</p>
                    <p className="mt-1">Try accessing via:</p>
                    <ul className="mt-1 ml-4 list-disc">
                      <li>https://{window.location.host}</li>
                      <li>Or use the computer's IP address</li>
                    </ul>
                  </div>
                ) : (
                  <div>
                    <p>Camera access not supported in this browser.</p>
                    <p className="mt-1 font-medium">Recommended browsers:</p>
                    <ul className="mt-1 ml-4 list-disc">
                      <li>Desktop: Chrome, Safari, Firefox</li>
                      <li>Mobile: Chrome, Safari (iOS)</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state.capturedImage) {
    return (
      <div className={`camera-preview ${className} ${isMobile ? 'mobile-preview' : ''}`}>
        <div className="relative">
          <img
            src={URL.createObjectURL(state.capturedImage)}
            alt="Captured business card"
            className={`w-full h-auto rounded-lg shadow-md ${isMobile ? 'max-h-96' : ''}`}
          />
          {/* Mobile-specific zoom hint */}
          {isMobile && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              Pinch to zoom
            </div>
          )}

          {/* Quality Assessment Overlay - Only show when enabled and not blocking UI */}
          {showQualityFeedback && (qualityAssessment || isAnalyzingQuality) && (
            <div className="absolute top-2 left-2 right-2">
              <QualityFeedback 
                assessment={qualityAssessment}
                isAnalyzing={isAnalyzingQuality}
                className="shadow-lg"
                onDismiss={() => setShowQualityFeedback(false)}
              />
            </div>
          )}
          <div className={`mt-4 flex gap-3 ${isMobile ? 'flex-col sm:flex-row' : ''} justify-center`}>
            <button
              onClick={handleRetake}
              className={`${isMobile ? 'py-3 text-lg' : 'py-2'} px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors ${isTouch ? 'touch-action-manipulation' : ''}`}
            >
              Retake
            </button>
            <button
              onClick={() => state.capturedImage && onImageCapture?.(state.capturedImage)}
              className={`${isMobile ? 'py-3 text-lg' : 'py-2'} px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${isTouch ? 'touch-action-manipulation' : ''}`}
            >
              Use Image
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`camera-container ${className} ${isMobile ? 'mobile-camera' : ''}`}>
      <div className={`relative bg-black rounded-lg overflow-hidden ${isFullscreen && isMobile ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
        <video
          ref={videoRef}
          className={`w-full ${isFullscreen && isMobile ? 'h-full object-cover' : 'h-auto'}`}
          autoPlay
          playsInline
          muted
          onClick={isTouch ? handleTouchCapture : undefined}
          style={{
            ...(isMobile && {
              maxHeight: isFullscreen ? '100vh' : '70vh',
            })
          }}
        />
        
        {/* Mobile fullscreen toggle */}
        {isMobile && state.isActive && (
          <button
            onClick={toggleFullscreen}
            className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isFullscreen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              )}
            </svg>
          </button>
        )}
        
        {/* Touch capture hint for mobile */}
        {isMobile && state.isActive && !state.error && !state.isLoading && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white text-sm px-3 py-2 rounded-full">
            Tap screen to capture
          </div>
        )}
        
        {state.error && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4 max-w-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-red-800">
                    {state.error.name}
                  </h3>
                  <p className="mt-1 text-sm text-red-700">
                    {state.error.message}
                  </p>
                  
                  {/* Contextual help based on error type */}
                  <div className="mt-3 text-xs text-red-600">
                    {state.error.name === 'PermissionDenied' && (
                      <div>
                        <p className="font-medium">💡 How to fix:</p>
                        <ul className="mt-1 ml-3 list-disc space-y-1">
                          <li>Click the camera icon in your browser's address bar</li>
                          <li>Select "Allow" for camera access</li>
                          <li>Refresh the page and try again</li>
                        </ul>
                      </div>
                    )}
                    {state.error.name === 'NoCamera' && (
                      <div>
                        <p className="font-medium">💡 Possible solutions:</p>
                        <ul className="mt-1 ml-3 list-disc space-y-1">
                          <li>Connect a camera device</li>
                          <li>Check if camera is working in other apps</li>
                          <li>Try using a different browser</li>
                        </ul>
                      </div>
                    )}
                    {state.error.name === 'CameraInUse' && (
                      <div>
                        <p className="font-medium">💡 Try this:</p>
                        <ul className="mt-1 ml-3 list-disc space-y-1">
                          <li>Close other applications using the camera</li>
                          <li>Close other browser tabs with camera access</li>
                          <li>Restart your browser</li>
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => {
                        actions.retake();
                        handleStartCamera();
                      }}
                      className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 transition-colors"
                    >
                      Reload Page
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {state.isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-white">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <span>Loading camera...</span>
            </div>
          </div>
        )}
      </div>

      <div className={`mt-4 space-y-3 ${isFullscreen && isMobile ? 'hidden' : ''}`}>
        {/* Device Selection */}
        {state.devices.length > 1 && (
          <div className={`flex items-center space-x-2 ${isMobile ? 'flex-col space-y-2 space-x-0' : ''}`}>
            <label className={`text-sm font-medium text-gray-700 ${isMobile ? 'self-start' : ''}`}>Camera:</label>
            <select
              value={state.selectedDevice?.deviceId || ''}
              onChange={(e) => handleSwitchCamera(e.target.value)}
              disabled={state.isLoading || state.isActive}
              className={`${isMobile ? 'w-full py-3 text-lg' : 'flex-1 py-1'} px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isTouch ? 'touch-action-manipulation' : ''}`}
            >
              {state.devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Control Buttons */}
        <div className={`flex gap-3 ${isMobile ? 'flex-col' : ''} justify-center`}>
          {!state.isActive ? (
            <button
              onClick={handleStartCamera}
              disabled={state.isLoading || !state.devices.length}
              className={`${isMobile ? 'py-4 text-lg' : 'py-3'} px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${isTouch ? 'touch-action-manipulation' : ''}`}
            >
              {state.isLoading ? 'Starting...' : 'Start Camera'}
            </button>
          ) : (
            <>
              <button
                onClick={handleCaptureImage}
                disabled={state.isLoading}
                className={`${isMobile ? 'py-4 text-lg' : 'py-3'} px-6 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${isTouch ? 'touch-action-manipulation' : ''}`}
              >
                {state.isLoading ? 'Capturing...' : 'Capture'}
              </button>
              <button
                onClick={handleStopCamera}
                disabled={state.isLoading}
                className={`${isMobile ? 'py-4 text-lg' : 'py-3'} px-6 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${isTouch ? 'touch-action-manipulation' : ''}`}
              >
                Stop Camera
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Mobile fullscreen controls overlay */}
      {isFullscreen && isMobile && state.isActive && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-4">
          <button
            onClick={handleCaptureImage}
            disabled={state.isLoading}
            className="p-4 bg-green-600 text-white rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-action-manipulation shadow-lg"
            aria-label="Capture image"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={handleStopCamera}
            disabled={state.isLoading}
            className="p-4 bg-gray-600 text-white rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-action-manipulation shadow-lg"
            aria-label="Stop camera"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};