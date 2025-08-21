/**
 * @jest-environment jsdom
 */

import { CameraService } from '../cameraService';

// Mock MediaDevices API
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
const mockVideoElement = {
  play: jest.fn(),
  srcObject: null,
  videoWidth: 1920,
  videoHeight: 1080
} as unknown as HTMLVideoElement;

// Mock MediaStream
const mockTrack = {
  stop: jest.fn()
};

const mockStream = {
  getTracks: jest.fn().mockReturnValue([mockTrack])
} as unknown as MediaStream;

describe('CameraService', () => {
  let cameraService: CameraService;

  beforeEach(() => {
    cameraService = new CameraService();
    jest.clearAllMocks();
    mockGetUserMedia.mockClear();
    mockEnumerateDevices.mockClear();
  });

  describe('isSupported', () => {
    it('should return true when MediaDevices API is available', () => {
      expect(cameraService.isSupported()).toBe(true);
    });

    it('should return false when MediaDevices API is not available', () => {
      const originalMediaDevices = navigator.mediaDevices;
      Object.defineProperty(navigator, 'mediaDevices', {
        writable: true,
        value: undefined
      });
      
      const service = new CameraService();
      expect(service.isSupported()).toBe(false);
      
      Object.defineProperty(navigator, 'mediaDevices', {
        writable: true,
        value: originalMediaDevices
      });
    });
  });

  describe('getAvailableDevices', () => {
    it('should return list of video input devices', async () => {
      const mockDevices = [
        { deviceId: 'device1', label: 'Camera 1', kind: 'videoinput' },
        { deviceId: 'device2', label: 'Camera 2', kind: 'videoinput' },
        { deviceId: 'device3', label: 'Microphone', kind: 'audioinput' }
      ];

      mockEnumerateDevices.mockResolvedValue(mockDevices);

      const result = await cameraService.getAvailableDevices();

      expect(mockEnumerateDevices).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        deviceId: 'device1',
        label: 'Camera 1',
        kind: 'videoinput'
      });
      expect(result[1]).toEqual({
        deviceId: 'device2',
        label: 'Camera 2',
        kind: 'videoinput'
      });
    });

    it('should handle devices with empty labels', async () => {
      const mockDevices = [
        { deviceId: 'device123456789', label: '', kind: 'videoinput' }
      ];

      mockEnumerateDevices.mockResolvedValue(mockDevices);

      const result = await cameraService.getAvailableDevices();

      expect(result[0].label).toBe('Camera device12');
    });

    it('should throw CameraError when enumerateDevices fails', async () => {
      const mockError = new Error('Device enumeration failed');
      mockEnumerateDevices.mockRejectedValue(mockError);

      await expect(cameraService.getAvailableDevices()).rejects.toEqual({
        name: 'CameraError',
        message: 'Device enumeration failed',
        code: 'Error'
      });
    });
  });

  describe('requestCameraAccess', () => {
    it('should request camera access with default constraints', async () => {
      mockGetUserMedia.mockResolvedValue(mockStream);

      const result = await cameraService.requestCameraAccess();

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: {
          width: { ideal: 2560, max: 4096 },
          height: { ideal: 1440, max: 2304 },
          facingMode: 'environment',
          aspectRatio: { ideal: 16/9 }
        },
        audio: false
      });
      expect(result).toBe(mockStream);
    });

    it('should request camera access with custom constraints', async () => {
      mockGetUserMedia.mockResolvedValue(mockStream);

      await cameraService.requestCameraAccess({
        deviceId: 'device1',
        facingMode: 'user'
      });

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: {
          width: { ideal: 2560, max: 4096 },
          height: { ideal: 1440, max: 2304 },
          facingMode: 'user',
          aspectRatio: { ideal: 16/9 },
          deviceId: { exact: 'device1' }
        },
        audio: false
      });
    });

    it('should handle permission denied error', async () => {
      const mockError = new Error('Permission denied');
      mockError.name = 'NotAllowedError';
      mockGetUserMedia.mockRejectedValue(mockError);

      await expect(cameraService.requestCameraAccess()).rejects.toEqual({
        name: 'PermissionDenied',
        message: 'Camera access denied. Please allow camera permissions.',
        code: 'NotAllowedError'
      });
    });

    it('should handle no camera found error', async () => {
      const mockError = new Error('No camera found');
      mockError.name = 'NotFoundError';
      mockGetUserMedia.mockRejectedValue(mockError);

      await expect(cameraService.requestCameraAccess()).rejects.toEqual({
        name: 'NoCamera',
        message: 'No camera found. Please connect a camera device.',
        code: 'NotFoundError'
      });
    });

    it('should handle camera in use error', async () => {
      const mockError = new Error('Camera in use');
      mockError.name = 'NotReadableError';
      mockGetUserMedia.mockRejectedValue(mockError);

      await expect(cameraService.requestCameraAccess()).rejects.toEqual({
        name: 'CameraInUse',
        message: 'Camera is already in use by another application.',
        code: 'NotReadableError'
      });
    });
  });

  describe('startCamera', () => {
    it('should start camera and set video source', async () => {
      mockGetUserMedia.mockResolvedValue(mockStream);

      await cameraService.startCamera(mockVideoElement);

      expect(mockGetUserMedia).toHaveBeenCalled();
      expect(mockVideoElement.srcObject).toBe(mockStream);
      expect(mockVideoElement.play).toHaveBeenCalled();
    });
  });

  describe('stopCamera', () => {
    it('should stop all tracks and clear video source', async () => {
      mockGetUserMedia.mockResolvedValue(mockStream);
      await cameraService.startCamera(mockVideoElement);

      cameraService.stopCamera();

      expect(mockTrack.stop).toHaveBeenCalled();
      expect(mockVideoElement.srcObject).toBe(null);
    });
  });

  describe('captureImage', () => {
    let mockCanvas: HTMLCanvasElement;
    let mockContext: CanvasRenderingContext2D;

    beforeEach(() => {
      mockContext = {
        drawImage: jest.fn()
      } as unknown as CanvasRenderingContext2D;

      mockCanvas = {
        getContext: jest.fn().mockReturnValue(mockContext),
        toBlob: jest.fn(),
        width: 0,
        height: 0
      } as unknown as HTMLCanvasElement;

      jest.spyOn(document, 'createElement').mockReturnValue(mockCanvas);
    });

    it('should capture image successfully', async () => {
      mockGetUserMedia.mockResolvedValue(mockStream);
      await cameraService.startCamera(mockVideoElement);

      const mockBlob = new Blob(['test'], { type: 'image/jpeg' });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((callback) => {
        callback(mockBlob);
      });

      const result = await cameraService.captureImage();

      expect(document.createElement).toHaveBeenCalledWith('canvas');
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
      expect(mockContext.drawImage).toHaveBeenCalledWith(
        mockVideoElement, 0, 0, 1920, 1080
      );
      expect(result).toBe(mockBlob);
    });

    it('should throw error when camera not initialized', async () => {
      await expect(cameraService.captureImage()).rejects.toThrow('Camera not initialized');
    });

    it('should throw error when canvas context not available', async () => {
      mockGetUserMedia.mockResolvedValue(mockStream);
      await cameraService.startCamera(mockVideoElement);

      (mockCanvas.getContext as jest.Mock).mockReturnValue(null);

      await expect(cameraService.captureImage()).rejects.toThrow('Could not get canvas context');
    });

    it('should throw error when blob creation fails', async () => {
      mockGetUserMedia.mockResolvedValue(mockStream);
      await cameraService.startCamera(mockVideoElement);

      (mockCanvas.toBlob as jest.Mock).mockImplementation((callback) => {
        callback(null);
      });

      await expect(cameraService.captureImage()).rejects.toThrow('Failed to capture image');
    });
  });
});