/**
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useCamera } from '../useCamera';

// Mock the camera service
const mockCameraService = {
  isSupported: jest.fn(),
  getAvailableDevices: jest.fn(),
  startCamera: jest.fn(),
  stopCamera: jest.fn(),
  switchCamera: jest.fn(),
  captureImage: jest.fn()
};

jest.mock('../../services/cameraService', () => ({
  cameraService: mockCameraService,
  CameraService: jest.fn().mockImplementation(() => mockCameraService)
}));

const mockDevices = [
  { deviceId: 'device1', label: 'Camera 1', kind: 'videoinput' as const },
  { deviceId: 'device2', label: 'Camera 2', kind: 'videoinput' as const }
];

describe('useCamera', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCameraService.isSupported.mockReturnValue(true);
    mockCameraService.getAvailableDevices.mockResolvedValue(mockDevices);
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useCamera());
    const [state] = result.current;

    expect(state).toEqual({
      isSupported: true,
      isLoading: false,
      isActive: false,
      error: null,
      devices: [],
      selectedDevice: null,
      capturedImage: null
    });
  });

  it('should load devices on mount when supported', async () => {
    const { result } = renderHook(() => useCamera());

    await waitFor(() => {
      expect(mockCameraService.getAvailableDevices).toHaveBeenCalled();
    });

    const [state] = result.current;
    expect(state.devices).toEqual(mockDevices);
    expect(state.selectedDevice).toEqual(mockDevices[0]);
  });

  it('should not load devices when not supported', () => {
    mockCameraService.isSupported.mockReturnValue(false);
    renderHook(() => useCamera());

    expect(mockCameraService.getAvailableDevices).not.toHaveBeenCalled();
  });

  it('should handle device loading error', async () => {
    const mockError = {
      name: 'PermissionDenied',
      message: 'Camera access denied'
    };
    mockCameraService.getAvailableDevices.mockRejectedValue(mockError);

    const { result } = renderHook(() => useCamera());

    await waitFor(() => {
      expect(result.current[0].error).toEqual(mockError);
    });

    const [state] = result.current;
    expect(state.isLoading).toBe(false);
  });

  it('should start camera successfully', async () => {
    const { result } = renderHook(() => useCamera());
    
    await waitFor(() => {
      expect(mockCameraService.getAvailableDevices).toHaveBeenCalled();
    });

    const mockVideoElement = document.createElement('video');
    const [, actions] = result.current;

    // Access setVideoRef from the actions
    (actions as any).setVideoRef(mockVideoElement);

    await act(async () => {
      await actions.startCamera();
    });

    const [state] = result.current;
    expect(mockCameraService.startCamera).toHaveBeenCalledWith(mockVideoElement, undefined);
    expect(state.isActive).toBe(true);
    expect(state.error).toBe(null);
    expect(state.capturedImage).toBe(null);
  });

  it('should handle start camera error', async () => {
    const mockError = {
      name: 'PermissionDenied',
      message: 'Camera access denied'
    };
    mockCameraService.startCamera.mockRejectedValue(mockError);

    const { result } = renderHook(() => useCamera());
    
    await waitFor(() => {
      expect(mockCameraService.getAvailableDevices).toHaveBeenCalled();
    });

    const mockVideoElement = document.createElement('video');
    const [, actions] = result.current;

    (actions as any).setVideoRef(mockVideoElement);

    await act(async () => {
      await actions.startCamera();
    });

    const [state] = result.current;
    expect(state.error).toEqual(mockError);
    expect(state.isLoading).toBe(false);
    expect(state.isActive).toBe(false);
  });

  it('should stop camera', async () => {
    const { result } = renderHook(() => useCamera());
    
    await waitFor(() => {
      expect(mockCameraService.getAvailableDevices).toHaveBeenCalled();
    });

    const [, actions] = result.current;

    act(() => {
      actions.stopCamera();
    });

    const [state] = result.current;
    expect(mockCameraService.stopCamera).toHaveBeenCalled();
    expect(state.isActive).toBe(false);
    expect(state.capturedImage).toBe(null);
  });

  it('should switch camera successfully', async () => {
    const { result } = renderHook(() => useCamera());
    
    await waitFor(() => {
      expect(mockCameraService.getAvailableDevices).toHaveBeenCalled();
    });

    const [, actions] = result.current;

    await act(async () => {
      await actions.switchCamera('device2');
    });

    const [state] = result.current;
    expect(mockCameraService.switchCamera).toHaveBeenCalledWith('device2');
    expect(state.selectedDevice).toEqual(mockDevices[1]);
    expect(state.error).toBe(null);
  });

  it('should handle switch camera error', async () => {
    const mockError = {
      name: 'CameraError',
      message: 'Switch failed'
    };
    mockCameraService.switchCamera.mockRejectedValue(mockError);

    const { result } = renderHook(() => useCamera());
    
    await waitFor(() => {
      expect(mockCameraService.getAvailableDevices).toHaveBeenCalled();
    });

    const [, actions] = result.current;

    await act(async () => {
      await actions.switchCamera('device2');
    });

    const [state] = result.current;
    expect(state.error).toEqual(mockError);
    expect(state.isLoading).toBe(false);
  });

  it('should capture image successfully', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/jpeg' });
    mockCameraService.captureImage.mockResolvedValue(mockBlob);

    const { result } = renderHook(() => useCamera());
    
    await waitFor(() => {
      expect(mockCameraService.getAvailableDevices).toHaveBeenCalled();
    });

    const [, actions] = result.current;

    await act(async () => {
      await actions.captureImage();
    });

    const [state] = result.current;
    expect(mockCameraService.captureImage).toHaveBeenCalled();
    expect(mockCameraService.stopCamera).toHaveBeenCalled();
    expect(state.capturedImage).toBe(mockBlob);
    expect(state.isActive).toBe(false);
    expect(state.error).toBe(null);
  });

  it('should handle capture image error', async () => {
    const mockError = {
      name: 'CameraError',
      message: 'Capture failed'
    };
    mockCameraService.captureImage.mockRejectedValue(mockError);

    const { result } = renderHook(() => useCamera());
    
    await waitFor(() => {
      expect(mockCameraService.getAvailableDevices).toHaveBeenCalled();
    });

    const [, actions] = result.current;

    await act(async () => {
      await actions.captureImage();
    });

    const [state] = result.current;
    expect(state.error).toEqual(mockError);
    expect(state.isLoading).toBe(false);
  });

  it('should retake image', async () => {
    // First capture an image
    const mockBlob = new Blob(['test'], { type: 'image/jpeg' });
    mockCameraService.captureImage.mockResolvedValue(mockBlob);

    const { result } = renderHook(() => useCamera());
    
    await waitFor(() => {
      expect(mockCameraService.getAvailableDevices).toHaveBeenCalled();
    });

    const [, actions] = result.current;

    await act(async () => {
      await actions.captureImage();
    });

    // Then retake
    act(() => {
      actions.retake();
    });

    const [state] = result.current;
    expect(state.capturedImage).toBe(null);
    expect(state.error).toBe(null);
  });

  it('should handle unsupported browser for start camera', async () => {
    mockCameraService.isSupported.mockReturnValue(false);

    const { result } = renderHook(() => useCamera());
    const [, actions] = result.current;

    await act(async () => {
      await actions.startCamera();
    });

    const [state] = result.current;
    expect(state.error).toEqual({
      name: 'UnsupportedBrowser',
      message: 'Camera not supported in this browser'
    });
    expect(mockCameraService.startCamera).not.toHaveBeenCalled();
  });
});