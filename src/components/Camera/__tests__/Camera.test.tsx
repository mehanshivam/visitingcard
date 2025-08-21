/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Camera } from '../Camera';
import * as useCameraModule from '../../../hooks/useCamera';
import * as deviceDetectionModule from '../../../utils/deviceDetection';

// Mock the useCamera hook
const mockUseCameraReturn = {
  state: {
    isSupported: true,
    isLoading: false,
    isActive: false,
    error: null,
    devices: [
      { deviceId: 'device1', label: 'Camera 1', kind: 'videoinput' as const },
      { deviceId: 'device2', label: 'Camera 2', kind: 'videoinput' as const }
    ],
    selectedDevice: { deviceId: 'device1', label: 'Camera 1', kind: 'videoinput' as const },
    capturedImage: null
  },
  actions: {
    startCamera: jest.fn(),
    stopCamera: jest.fn(),
    switchCamera: jest.fn(),
    captureImage: jest.fn(),
    retake: jest.fn(),
    getDevices: jest.fn(),
    setVideoRef: jest.fn()
  }
};

const mockUseCamera = jest.spyOn(useCameraModule, 'useCamera');

// Mock device detection utilities
const mockIsMobileDevice = jest.spyOn(deviceDetectionModule, 'isMobileDevice');
const mockIsIOS = jest.spyOn(deviceDetectionModule, 'isIOS');
const mockIsTouchDevice = jest.spyOn(deviceDetectionModule, 'isTouchDevice');

// Mock URL.createObjectURL
const mockCreateObjectURL = jest.fn(() => 'mock-blob-url');
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: mockCreateObjectURL
});

describe('Camera Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCamera.mockReturnValue([mockUseCameraReturn.state, mockUseCameraReturn.actions as any]);
    mockIsMobileDevice.mockReturnValue(false);
    mockIsIOS.mockReturnValue(false);
    mockIsTouchDevice.mockReturnValue(false);
  });

  describe('Unsupported Browser', () => {
    it('should render unsupported message when camera is not supported', () => {
      mockUseCamera.mockReturnValue([
        { ...mockUseCameraReturn.state, isSupported: false },
        mockUseCameraReturn.actions as any
      ]);

      render(<Camera />);

      expect(screen.getByText('Camera not supported')).toBeInTheDocument();
      expect(screen.getByText(/Your browser doesn't support camera access/)).toBeInTheDocument();
    });
  });

  describe('Initial State', () => {
    it('should render start camera button when camera is inactive', () => {
      render(<Camera />);

      expect(screen.getByRole('button', { name: 'Start Camera' })).toBeInTheDocument();
      expect(screen.getByDisplayValue('Camera 1')).toBeInTheDocument();
    });

    it('should show device selection when multiple devices available', () => {
      render(<Camera />);

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(screen.getByText('Camera:')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Camera 1')).toBeInTheDocument();
    });

    it('should not show device selection when only one device available', () => {
      mockUseCamera.mockReturnValue([
        { 
          ...mockUseCameraReturn.state, 
          devices: [mockUseCameraReturn.state.devices[0]],
          selectedDevice: mockUseCameraReturn.state.devices[0]
        },
        mockUseCameraReturn.actions as any
      ]);

      render(<Camera />);

      expect(screen.queryByText('Camera:')).not.toBeInTheDocument();
    });

    it('should disable start button when no devices available', () => {
      mockUseCamera.mockReturnValue([
        { 
          ...mockUseCameraReturn.state, 
          devices: [],
          selectedDevice: null
        },
        mockUseCameraReturn.actions as any
      ]);

      render(<Camera />);

      expect(screen.getByRole('button', { name: 'Start Camera' })).toBeDisabled();
    });
  });

  describe('Camera Controls', () => {
    it('should call startCamera when start button is clicked', async () => {
      render(<Camera />);

      fireEvent.click(screen.getByRole('button', { name: 'Start Camera' }));

      expect(mockUseCameraReturn.actions.startCamera).toHaveBeenCalled();
    });

    it('should call switchCamera when device selection changes', async () => {
      render(<Camera />);

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'device2' } });

      expect(mockUseCameraReturn.actions.switchCamera).toHaveBeenCalledWith('device2');
    });

    it('should show capture and stop buttons when camera is active', () => {
      mockUseCamera.mockReturnValue([
        { ...mockUseCameraReturn.state, isActive: true },
        mockUseCameraReturn.actions as any
      ]);

      render(<Camera />);

      expect(screen.getByRole('button', { name: 'Capture' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Stop Camera' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Start Camera' })).not.toBeInTheDocument();
    });

    it('should call captureImage when capture button is clicked', () => {
      mockUseCamera.mockReturnValue([
        { ...mockUseCameraReturn.state, isActive: true },
        mockUseCameraReturn.actions as any
      ]);

      render(<Camera />);

      fireEvent.click(screen.getByRole('button', { name: 'Capture' }));

      expect(mockUseCameraReturn.actions.captureImage).toHaveBeenCalled();
    });

    it('should call stopCamera when stop button is clicked', () => {
      mockUseCamera.mockReturnValue([
        { ...mockUseCameraReturn.state, isActive: true },
        mockUseCameraReturn.actions as any
      ]);

      render(<Camera />);

      fireEvent.click(screen.getByRole('button', { name: 'Stop Camera' }));

      expect(mockUseCameraReturn.actions.stopCamera).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should show loading indicator when camera is loading', () => {
      mockUseCamera.mockReturnValue([
        { ...mockUseCameraReturn.state, isLoading: true },
        mockUseCameraReturn.actions as any
      ]);

      render(<Camera />);

      expect(screen.getByText('Loading camera...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Starting...' })).toBeDisabled();
    });

    it('should show capturing state when capturing image', () => {
      mockUseCamera.mockReturnValue([
        { ...mockUseCameraReturn.state, isActive: true, isLoading: true },
        mockUseCameraReturn.actions as any
      ]);

      render(<Camera />);

      expect(screen.getByRole('button', { name: 'Capturing...' })).toBeDisabled();
    });

    it('should disable device selection when camera is active or loading', () => {
      mockUseCamera.mockReturnValue([
        { ...mockUseCameraReturn.state, isActive: true },
        mockUseCameraReturn.actions as any
      ]);

      render(<Camera />);

      expect(screen.getByRole('combobox')).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display error overlay when error occurs', () => {
      const mockError = {
        name: 'PermissionDenied',
        message: 'Camera access denied'
      };

      mockUseCamera.mockReturnValue([
        { ...mockUseCameraReturn.state, error: mockError },
        mockUseCameraReturn.actions as any
      ]);

      render(<Camera />);

      expect(screen.getByText('PermissionDenied')).toBeInTheDocument();
      expect(screen.getByText('Camera access denied')).toBeInTheDocument();
    });

    it('should call onError callback when error occurs', () => {
      const onError = jest.fn();
      const mockError = {
        name: 'PermissionDenied',
        message: 'Camera access denied'
      };

      mockUseCamera.mockReturnValue([
        { ...mockUseCameraReturn.state, error: mockError },
        mockUseCameraReturn.actions as any
      ]);

      render(<Camera onError={onError} />);

      expect(onError).toHaveBeenCalledWith(mockError);
    });
  });

  describe('Image Preview', () => {
    const mockBlob = new Blob(['test'], { type: 'image/jpeg' });

    it('should show image preview when image is captured', () => {
      mockUseCamera.mockReturnValue([
        { ...mockUseCameraReturn.state, capturedImage: mockBlob },
        mockUseCameraReturn.actions as any
      ]);

      render(<Camera />);

      expect(screen.getByAltText('Captured business card')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Retake' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Use Image' })).toBeInTheDocument();
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
    });

    it('should call retake when retake button is clicked', () => {
      mockUseCamera.mockReturnValue([
        { ...mockUseCameraReturn.state, capturedImage: mockBlob },
        mockUseCameraReturn.actions as any
      ]);

      render(<Camera />);

      fireEvent.click(screen.getByRole('button', { name: 'Retake' }));

      expect(mockUseCameraReturn.actions.retake).toHaveBeenCalled();
    });

    it('should call onImageCapture when Use Image button is clicked', () => {
      const onImageCapture = jest.fn();

      mockUseCamera.mockReturnValue([
        { ...mockUseCameraReturn.state, capturedImage: mockBlob },
        mockUseCameraReturn.actions as any
      ]);

      render(<Camera onImageCapture={onImageCapture} />);

      fireEvent.click(screen.getByRole('button', { name: 'Use Image' }));

      expect(onImageCapture).toHaveBeenCalledWith(mockBlob);
    });

    it('should call onImageCapture callback when image is captured', () => {
      const onImageCapture = jest.fn();

      // First render without captured image
      const { rerender } = render(<Camera onImageCapture={onImageCapture} />);

      // Then rerender with captured image
      mockUseCamera.mockReturnValue([
        { ...mockUseCameraReturn.state, capturedImage: mockBlob },
        mockUseCameraReturn.actions as any
      ]);

      rerender(<Camera onImageCapture={onImageCapture} />);

      expect(onImageCapture).toHaveBeenCalledWith(mockBlob);
    });
  });

  describe('Video Element', () => {
    it('should render video element with correct attributes', () => {
      const { container } = render(<Camera />);

      const video = container.querySelector('video') as HTMLVideoElement;
      expect(video).toBeInTheDocument();
      expect(video.autoplay).toBe(true);
      expect(video.playsInline).toBe(true);
      expect(video.muted).toBe(true);
    });

    it('should set video ref on mount', () => {
      render(<Camera />);

      expect(mockUseCameraReturn.actions.setVideoRef).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<Camera />);

      expect(screen.getByRole('button', { name: 'Start Camera' })).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should handle keyboard navigation', () => {
      render(<Camera />);

      const startButton = screen.getByRole('button', { name: 'Start Camera' });
      expect(startButton).not.toHaveFocus();
      
      startButton.focus();
      expect(startButton).toHaveFocus();
    });
  });

  describe('Custom Props', () => {
    it('should apply custom className', () => {
      const { container } = render(<Camera className="custom-camera" />);

      expect(container.firstChild).toHaveClass('custom-camera');
    });

    it('should handle all callback props', () => {
      const onImageCapture = jest.fn();
      const onError = jest.fn();

      render(<Camera onImageCapture={onImageCapture} onError={onError} />);

      // Component should render without errors
      expect(screen.getByRole('button', { name: 'Start Camera' })).toBeInTheDocument();
    });
  });

  describe('Mobile Features', () => {
    beforeEach(() => {
      mockIsMobileDevice.mockReturnValue(true);
      mockIsTouchDevice.mockReturnValue(true);
    });

    it('should apply mobile-specific styling', () => {
      const { container } = render(<Camera />);

      expect(container.firstChild).toHaveClass('mobile-camera');
      expect(screen.getByRole('button', { name: 'Start Camera' })).toHaveClass('py-4', 'text-lg');
    });

    it('should show fullscreen toggle when camera is active on mobile', () => {
      mockUseCamera.mockReturnValue([
        { ...mockUseCameraReturn.state, isActive: true },
        mockUseCameraReturn.actions as any
      ]);

      render(<Camera />);

      expect(screen.getByLabelText('Enter fullscreen')).toBeInTheDocument();
    });

    it('should show touch capture hint when camera is active on mobile', () => {
      mockUseCamera.mockReturnValue([
        { ...mockUseCameraReturn.state, isActive: true },
        mockUseCameraReturn.actions as any
      ]);

      render(<Camera />);

      expect(screen.getByText('Tap screen to capture')).toBeInTheDocument();
    });

    it('should handle video tap to capture on touch devices', () => {
      mockUseCamera.mockReturnValue([
        { ...mockUseCameraReturn.state, isActive: true },
        mockUseCameraReturn.actions as any
      ]);

      const { container } = render(<Camera />);
      const video = container.querySelector('video');

      fireEvent.click(video!);

      expect(mockUseCameraReturn.actions.captureImage).toHaveBeenCalled();
    });

    it('should show mobile-specific buttons layout', () => {
      render(<Camera />);

      const controlsDiv = screen.getByRole('button', { name: 'Start Camera' }).parentElement;
      expect(controlsDiv).toHaveClass('flex-col');
    });

    it('should show device selection in mobile layout', () => {
      render(<Camera />);

      const deviceDiv = screen.getByText('Camera:').parentElement;
      expect(deviceDiv).toHaveClass('flex-col', 'space-y-2', 'space-x-0');
    });

    it('should apply touch-action-manipulation for touch devices', () => {
      render(<Camera />);

      expect(screen.getByRole('button', { name: 'Start Camera' })).toHaveClass('touch-action-manipulation');
    });
  });

  describe('Image Preview Mobile Features', () => {
    const mockBlob = new Blob(['test'], { type: 'image/jpeg' });

    beforeEach(() => {
      mockIsMobileDevice.mockReturnValue(true);
      mockUseCamera.mockReturnValue([
        { ...mockUseCameraReturn.state, capturedImage: mockBlob },
        mockUseCameraReturn.actions as any
      ]);
    });

    it('should show mobile preview styling', () => {
      const { container } = render(<Camera />);

      expect(container.firstChild).toHaveClass('mobile-preview');
    });

    it('should show pinch to zoom hint on mobile', () => {
      render(<Camera />);

      expect(screen.getByText('Pinch to zoom')).toBeInTheDocument();
    });

    it('should apply mobile button styling in preview', () => {
      render(<Camera />);

      expect(screen.getByRole('button', { name: 'Retake' })).toHaveClass('py-3', 'text-lg');
      expect(screen.getByRole('button', { name: 'Use Image' })).toHaveClass('py-3', 'text-lg');
    });

    it('should use mobile button layout in preview', () => {
      render(<Camera />);

      const buttonsDiv = screen.getByRole('button', { name: 'Retake' }).parentElement;
      expect(buttonsDiv).toHaveClass('flex-col', 'sm:flex-row');
    });
  });

  describe('Fullscreen Mode', () => {
    beforeEach(() => {
      mockIsMobileDevice.mockReturnValue(true);
      mockUseCamera.mockReturnValue([
        { ...mockUseCameraReturn.state, isActive: true },
        mockUseCameraReturn.actions as any
      ]);
    });

    it('should toggle fullscreen mode', () => {
      const { container } = render(<Camera />);

      const fullscreenToggle = screen.getByLabelText('Enter fullscreen');
      fireEvent.click(fullscreenToggle);

      // Should show fullscreen video styling
      const videoContainer = container.querySelector('.relative.bg-black');
      expect(videoContainer).toHaveClass('fixed', 'inset-0', 'z-50', 'rounded-none');
    });

    it('should show fullscreen controls overlay', () => {
      const { rerender } = render(<Camera />);

      const fullscreenToggle = screen.getByLabelText('Enter fullscreen');
      fireEvent.click(fullscreenToggle);

      // Force re-render to apply state change
      rerender(<Camera />);

      expect(screen.getByLabelText('Capture image')).toBeInTheDocument();
      expect(screen.getByLabelText('Stop camera')).toBeInTheDocument();
    });

    it('should hide regular controls in fullscreen', () => {
      const { container, rerender } = render(<Camera />);

      const fullscreenToggle = screen.getByLabelText('Enter fullscreen');
      fireEvent.click(fullscreenToggle);

      rerender(<Camera />);

      // Regular controls should be hidden
      const controlsDiv = container.querySelector('.mt-4.space-y-3');
      expect(controlsDiv).toHaveClass('hidden');
    });
  });
});