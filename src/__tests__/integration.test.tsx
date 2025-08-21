/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Camera } from '../components/Camera';
import { CameraError } from '../services/cameraService';

// Mock navigator.mediaDevices
const mockGetUserMedia = jest.fn();
const mockEnumerateDevices = jest.fn();

Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: mockGetUserMedia,
    enumerateDevices: mockEnumerateDevices
  }
});

// Mock HTMLVideoElement
const mockPlay = jest.fn();
Object.defineProperty(HTMLVideoElement.prototype, 'play', {
  writable: true,
  value: mockPlay
});

// Mock canvas context
const mockContext = {
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'high',
  drawImage: jest.fn(),
  getImageData: jest.fn(() => ({
    data: new Uint8ClampedArray(1920 * 1080 * 4).fill(128),
    width: 1920,
    height: 1080
  }))
} as any;

const mockCanvas = {
  getContext: jest.fn(() => mockContext),
  toBlob: jest.fn((callback) => {
    const mockBlob = new Blob(['mock image'], { type: 'image/jpeg' });
    callback(mockBlob);
  }),
  width: 0,
  height: 0
} as any;

const originalCreateElement = document.createElement;
document.createElement = jest.fn((tagName: string) => {
  if (tagName === 'canvas') {
    return mockCanvas;
  }
  return originalCreateElement.call(document, tagName);
}) as any;

// Mock URL APIs
global.URL = {
  createObjectURL: jest.fn(() => 'mock-url'),
  revokeObjectURL: jest.fn()
} as any;

describe('Camera Integration Tests - Task 5: Testing and Error Handling', () => {
  const mockStream = {
    getTracks: jest.fn(() => [{ stop: jest.fn() }])
  } as unknown as MediaStream;

  const mockDevices = [
    { deviceId: 'camera1', label: 'Front Camera', kind: 'videoinput' },
    { deviceId: 'camera2', label: 'Back Camera', kind: 'videoinput' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserMedia.mockResolvedValue(mockStream);
    mockEnumerateDevices.mockResolvedValue(mockDevices);
    mockPlay.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Complete Camera Workflow', () => {
    it('should complete full workflow: enumerate → start → capture → retake', async () => {
      const onImageCapture = jest.fn();
      const onError = jest.fn();

      render(
        <Camera
          onImageCapture={onImageCapture}
          onError={onError}
          className="test-camera"
        />
      );

      // Wait for device enumeration
      await waitFor(() => {
        expect(mockEnumerateDevices).toHaveBeenCalled();
      });

      // Start camera
      const startButton = screen.getByText('Start Camera');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
        expect(screen.getByText('Capture')).toBeInTheDocument();
      });

      // Capture image
      const captureButton = screen.getByText('Capture');
      fireEvent.click(captureButton);

      await waitFor(() => {
        expect(onImageCapture).toHaveBeenCalledWith(expect.any(Blob));
        expect(screen.getByText('Retake')).toBeInTheDocument();
      });

      // Retake
      const retakeButton = screen.getByText('Retake');
      fireEvent.click(retakeButton);

      await waitFor(() => {
        expect(screen.getByText('Start Camera')).toBeInTheDocument();
      });

      expect(onError).not.toHaveBeenCalled();
    });

    it('should handle camera permission denied gracefully', async () => {
      const onError = jest.fn();
      
      const permissionError = new Error('Permission denied');
      permissionError.name = 'NotAllowedError';
      mockGetUserMedia.mockRejectedValue(permissionError);

      render(<Camera onError={onError} />);

      const startButton = screen.getByText('Start Camera');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith({
          name: 'PermissionDenied',
          message: 'Camera access denied. Please allow camera permissions.',
          code: 'NotAllowedError'
        });
      });

      // Check that error is displayed
      expect(screen.getByText('PermissionDenied')).toBeInTheDocument();
      expect(screen.getByText('Camera access denied. Please allow camera permissions.')).toBeInTheDocument();
    });

    it('should handle no camera available error', async () => {
      const onError = jest.fn();
      
      const noDeviceError = new Error('No camera found');
      noDeviceError.name = 'NotFoundError';
      mockGetUserMedia.mockRejectedValue(noDeviceError);

      render(<Camera onError={onError} />);

      const startButton = screen.getByText('Start Camera');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith({
          name: 'NoCamera',
          message: 'No camera found. Please connect a camera device.',
          code: 'NotFoundError'
        });
      });
    });

    it('should handle camera in use error', async () => {
      const onError = jest.fn();
      
      const inUseError = new Error('Camera in use');
      inUseError.name = 'NotReadableError';
      mockGetUserMedia.mockRejectedValue(inUseError);

      render(<Camera onError={onError} />);

      const startButton = screen.getByText('Start Camera');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith({
          name: 'CameraInUse',
          message: 'Camera is already in use by another application.',
          code: 'NotReadableError'
        });
      });
    });
  });

  describe('Device Selection and Switching', () => {
    it('should handle multiple cameras and device switching', async () => {
      render(<Camera />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      expect(screen.getByDisplayValue('Front Camera')).toBeInTheDocument();

      // Switch to back camera
      await userEvent.selectOptions(select, 'camera2');

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledWith(
          expect.objectContaining({
            video: expect.objectContaining({
              deviceId: { exact: 'camera2' }
            })
          })
        );
      });
    });

    it('should handle device enumeration errors', async () => {
      const enumerationError = new Error('Device enumeration failed');
      mockEnumerateDevices.mockRejectedValue(enumerationError);

      const onError = jest.fn();
      render(<Camera onError={onError} />);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith({
          name: 'CameraError',
          message: 'Device enumeration failed',
          code: 'Error'
        });
      });
    });
  });

  describe('Image Capture Edge Cases', () => {
    it('should handle canvas context creation failure', async () => {
      mockCanvas.getContext.mockReturnValue(null);

      render(<Camera />);

      // Start camera
      const startButton = screen.getByText('Start Camera');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('Capture')).toBeInTheDocument();
      });

      // Try to capture
      const captureButton = screen.getByText('Capture');
      fireEvent.click(captureButton);

      await waitFor(() => {
        expect(screen.getByText('CameraError')).toBeInTheDocument();
        expect(screen.getByText('Could not get canvas context')).toBeInTheDocument();
      });
    });

    it('should handle blob creation failure', async () => {
      mockCanvas.toBlob.mockImplementation((callback: BlobCallback) => {
        callback(null);
      });

      render(<Camera />);

      // Start and capture
      fireEvent.click(screen.getByText('Start Camera'));

      await waitFor(() => {
        fireEvent.click(screen.getByText('Capture'));
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to capture image')).toBeInTheDocument();
      });
    });
  });

  describe('Mobile-Specific Behavior', () => {
    it('should detect mobile and apply appropriate constraints', async () => {
      // Mock mobile user agent
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
      });

      render(<Camera />);

      fireEvent.click(screen.getByText('Start Camera'));

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledWith(
          expect.objectContaining({
            video: expect.objectContaining({
              width: { ideal: 1920, max: 3840 },
              height: { ideal: 1080, max: 2160 }
            })
          })
        );
      });
    });

    it('should handle touch capture on mobile', async () => {
      // Mock touch device
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
      });

      const onImageCapture = jest.fn();
      render(<Camera onImageCapture={onImageCapture} />);

      // Start camera
      fireEvent.click(screen.getByText('Start Camera'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /capture/i })).toBeInTheDocument();
      });

      // Should show touch hint
      expect(screen.getByText('Tap screen to capture')).toBeInTheDocument();
    });
  });

  describe('Quality Assessment Integration', () => {
    it('should analyze image quality after capture', async () => {
      const onImageCapture = jest.fn();
      render(<Camera onImageCapture={onImageCapture} />);

      // Complete capture workflow
      fireEvent.click(screen.getByText('Start Camera'));

      await waitFor(() => {
        fireEvent.click(screen.getByText('Capture'));
      });

      await waitFor(() => {
        // Should show quality analysis
        expect(screen.getByText(/Image Quality:/)).toBeInTheDocument();
      });

      await waitFor(() => {
        // Should complete analysis and show results
        expect(screen.queryByText('Analyzing image quality...')).not.toBeInTheDocument();
      });
    });

    it('should handle quality analysis errors gracefully', async () => {
      // Mock image loading failure
      global.Image = jest.fn(() => {
        const img = {
          onload: null as any,
          onerror: null as any,
          src: ''
        };
        setTimeout(() => {
          if (img.onerror) img.onerror(new Event('error'));
        }, 0);
        return img;
      }) as any;

      render(<Camera />);

      fireEvent.click(screen.getByText('Start Camera'));
      await waitFor(() => {
        fireEvent.click(screen.getByText('Capture'));
      });

      // Should not crash and should complete capture
      await waitFor(() => {
        expect(screen.getByText('Retake')).toBeInTheDocument();
      });
    });
  });

  describe('Browser Compatibility', () => {
    it('should handle unsupported browser gracefully', () => {
      // Remove mediaDevices support
      Object.defineProperty(navigator, 'mediaDevices', {
        writable: true,
        value: undefined
      });

      render(<Camera />);

      expect(screen.getByText('Camera not supported')).toBeInTheDocument();
      expect(screen.getByText("Your browser doesn't support camera access. Please try a different browser.")).toBeInTheDocument();
    });

    it('should show appropriate error for constraint not supported', async () => {
      const constraintError = new Error('Constraint not supported');
      constraintError.name = 'OverconstrainedError';
      mockGetUserMedia.mockRejectedValue(constraintError);

      const onError = jest.fn();
      render(<Camera onError={onError} />);

      fireEvent.click(screen.getByText('Start Camera'));

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith({
          name: 'UnsupportedConstraints',
          message: 'Camera constraints not supported.',
          code: 'OverconstrainedError'
        });
      });
    });
  });

  describe('Performance and Memory Management', () => {
    it('should properly clean up resources on unmount', async () => {
      const { unmount } = render(<Camera />);

      fireEvent.click(screen.getByText('Start Camera'));

      await waitFor(() => {
        expect(screen.getByText('Stop Camera')).toBeInTheDocument();
      });

      // Unmount component
      unmount();

      // Should have stopped tracks
      expect(mockStream.getTracks()[0].stop).toHaveBeenCalled();
    });

    it('should handle rapid start/stop cycles', async () => {
      render(<Camera />);

      // Rapid start/stop
      for (let i = 0; i < 3; i++) {
        fireEvent.click(screen.getByText('Start Camera'));
        
        await waitFor(() => {
          expect(screen.getByText('Stop Camera')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Stop Camera'));

        await waitFor(() => {
          expect(screen.getByText('Start Camera')).toBeInTheDocument();
        });
      }

      // Should not crash or leak resources
      expect(mockGetUserMedia).toHaveBeenCalledTimes(3);
    });
  });
});