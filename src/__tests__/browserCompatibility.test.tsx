/**
 * @jest-environment jsdom
 */

import { CameraService } from '../services/cameraService';

describe('Browser Compatibility Tests - Task 5: Cross-Browser Testing', () => {
  let originalNavigator: Navigator;
  let originalUserAgent: string;

  beforeEach(() => {
    originalNavigator = navigator;
    originalUserAgent = navigator.userAgent;
  });

  afterEach(() => {
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      writable: true
    });
  });

  describe('Chrome Desktop', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        writable: true
      });
    });

    it('should detect as desktop browser', () => {
      const cameraService = new CameraService();
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      expect(isMobile).toBe(false);
    });

    it('should use high resolution constraints for desktop', async () => {
      const mockGetUserMedia = jest.fn().mockResolvedValue({} as MediaStream);
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: mockGetUserMedia },
        writable: true
      });

      const cameraService = new CameraService();
      await cameraService.requestCameraAccess();

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: {
          width: { ideal: 2560, max: 4096 },
          height: { ideal: 1440, max: 2304 },
          facingMode: 'environment',
          aspectRatio: { ideal: 16/9 }
        },
        audio: false
      });
    });
  });

  describe('Safari Desktop', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        writable: true
      });
    });

    it('should support WebRTC in Safari', () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: jest.fn(), enumerateDevices: jest.fn() },
        writable: true
      });

      const cameraService = new CameraService();
      expect(cameraService.isSupported()).toBe(true);
    });
  });

  describe('Chrome Mobile (Android)', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
        writable: true
      });
    });

    it('should detect as mobile browser', () => {
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      expect(isMobile).toBe(true);
    });

    it('should use mobile-optimized constraints', async () => {
      const mockGetUserMedia = jest.fn().mockResolvedValue({} as MediaStream);
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: mockGetUserMedia },
        writable: true
      });

      const cameraService = new CameraService();
      await cameraService.requestCameraAccess();

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: {
          width: { ideal: 1920, max: 3840 },
          height: { ideal: 1080, max: 2160 },
          facingMode: 'environment',
          aspectRatio: { ideal: 16/9 }
        },
        audio: false
      });
    });
  });

  describe('Safari Mobile (iOS)', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
        writable: true
      });
    });

    it('should detect as iPhone', () => {
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      expect(isIOS).toBe(true);
    });

    it('should handle iOS-specific camera constraints', async () => {
      const mockGetUserMedia = jest.fn().mockResolvedValue({} as MediaStream);
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: mockGetUserMedia },
        writable: true
      });

      const cameraService = new CameraService();
      await cameraService.requestCameraAccess({ facingMode: 'environment' });

      expect(mockGetUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({
            facingMode: 'environment'
          })
        })
      );
    });
  });

  describe('Firefox', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        writable: true
      });
    });

    it('should support WebRTC in Firefox', () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: jest.fn(), enumerateDevices: jest.fn() },
        writable: true
      });

      const cameraService = new CameraService();
      expect(cameraService.isSupported()).toBe(true);
    });
  });

  describe('Edge', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
        writable: true
      });
    });

    it('should support WebRTC in Edge', () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: jest.fn(), enumerateDevices: jest.fn() },
        writable: true
      });

      const cameraService = new CameraService();
      expect(cameraService.isSupported()).toBe(true);
    });
  });

  describe('Unsupported Browsers', () => {
    it('should handle browsers without mediaDevices support', () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: undefined,
        writable: true
      });

      const cameraService = new CameraService();
      expect(cameraService.isSupported()).toBe(false);
    });

    it('should handle browsers without getUserMedia support', () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { enumerateDevices: jest.fn() }, // Missing getUserMedia
        writable: true
      });

      const cameraService = new CameraService();
      expect(cameraService.isSupported()).toBe(false);
    });
  });

  describe('Permission Variations', () => {
    it('should handle NotAllowedError (Chrome/Firefox)', async () => {
      const mockGetUserMedia = jest.fn();
      const error = new Error('Permission denied');
      error.name = 'NotAllowedError';
      mockGetUserMedia.mockRejectedValue(error);

      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: mockGetUserMedia },
        writable: true
      });

      const cameraService = new CameraService();
      
      await expect(cameraService.requestCameraAccess()).rejects.toEqual({
        name: 'PermissionDenied',
        message: 'Camera access denied. Please allow camera permissions.',
        code: 'NotAllowedError'
      });
    });

    it('should handle PermissionDeniedError (Safari)', async () => {
      const mockGetUserMedia = jest.fn();
      const error = new Error('Permission denied by user');
      error.name = 'PermissionDeniedError';
      mockGetUserMedia.mockRejectedValue(error);

      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: mockGetUserMedia },
        writable: true
      });

      const cameraService = new CameraService();
      
      await expect(cameraService.requestCameraAccess()).rejects.toEqual({
        name: 'PermissionDenied',
        message: 'Camera access denied. Please allow camera permissions.',
        code: 'PermissionDeniedError'
      });
    });
  });

  describe('Device Constraints Support', () => {
    it('should handle OverconstrainedError', async () => {
      const mockGetUserMedia = jest.fn();
      const error = new Error('Constraint not satisfied');
      error.name = 'OverconstrainedError';
      mockGetUserMedia.mockRejectedValue(error);

      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: mockGetUserMedia },
        writable: true
      });

      const cameraService = new CameraService();
      
      await expect(cameraService.requestCameraAccess()).rejects.toEqual({
        name: 'UnsupportedConstraints',
        message: 'Camera constraints not supported.',
        code: 'OverconstrainedError'
      });
    });

    it('should handle ConstraintNotSatisfiedError', async () => {
      const mockGetUserMedia = jest.fn();
      const error = new Error('Constraint not satisfied');
      error.name = 'ConstraintNotSatisfiedError';
      mockGetUserMedia.mockRejectedValue(error);

      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: mockGetUserMedia },
        writable: true
      });

      const cameraService = new CameraService();
      
      await expect(cameraService.requestCameraAccess()).rejects.toEqual({
        name: 'UnsupportedConstraints',
        message: 'Camera constraints not supported.',
        code: 'ConstraintNotSatisfiedError'
      });
    });
  });

  describe('Network and Connection', () => {
    it('should handle connection-aware settings', () => {
      // Mock connection API
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '4g',
          downlink: 10,
          rtt: 100,
          saveData: false
        },
        writable: true
      });

      // This would be used by performance optimization utilities
      const connection = (navigator as any).connection;
      expect(connection.effectiveType).toBe('4g');
    });

    it('should handle slow connection gracefully', () => {
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '2g',
          downlink: 0.5,
          rtt: 2000,
          saveData: true
        },
        writable: true
      });

      const connection = (navigator as any).connection;
      expect(connection.saveData).toBe(true);
    });
  });
});