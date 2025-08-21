/**
 * @jest-environment jsdom
 */

import {
  debounce,
  throttle,
  preloadVideo,
  optimizeVideoForMobile,
  cleanupVideoResources,
  getOptimalVideoConstraints
} from '../performanceOptimization';

// Mock navigator properties
const mockNavigator = (properties: Partial<Navigator>) => {
  Object.keys(properties).forEach(key => {
    Object.defineProperty(navigator, key, {
      writable: true,
      value: properties[key as keyof Navigator]
    });
  });
};

describe('performanceOptimization utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('debounce', () => {
    it('should delay function execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('test');
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledWith('test');
    });

    it('should cancel previous calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('first');
      debouncedFn('second');
      
      jest.advanceTimersByTime(100);
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('second');
    });
  });

  describe('throttle', () => {
    it('should limit function calls', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn('first');
      throttledFn('second');
      throttledFn('third');

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('first');

      jest.advanceTimersByTime(100);
      
      throttledFn('fourth');
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenCalledWith('fourth');
    });
  });

  describe('preloadVideo', () => {
    let mockVideo: HTMLVideoElement;

    beforeEach(() => {
      mockVideo = document.createElement('video');
    });

    it('should resolve immediately if video is ready', async () => {
      Object.defineProperty(mockVideo, 'readyState', {
        writable: true,
        value: 4
      });

      const result = await preloadVideo(mockVideo);
      expect(result).toBeUndefined();
    });

    it('should wait for canplay event', async () => {
      Object.defineProperty(mockVideo, 'readyState', {
        writable: true,
        value: 1
      });

      const preloadPromise = preloadVideo(mockVideo);
      
      // Simulate canplay event
      const event = new Event('canplay');
      mockVideo.dispatchEvent(event);

      const result = await preloadPromise;
      expect(result).toBeUndefined();
    });
  });

  describe('optimizeVideoForMobile', () => {
    let mockVideo: HTMLVideoElement;

    beforeEach(() => {
      mockVideo = document.createElement('video');
      mockVideo.setAttribute = jest.fn();
    });

    it('should set mobile optimization attributes', () => {
      optimizeVideoForMobile(mockVideo);

      expect(mockVideo.setAttribute).toHaveBeenCalledWith('webkit-playsinline', 'true');
      expect(mockVideo.setAttribute).toHaveBeenCalledWith('x-webkit-airplay', 'allow');
      expect(mockVideo.setAttribute).toHaveBeenCalledWith('preload', 'metadata');
    });

    it('should enable hardware acceleration when supported', () => {
      // Mock requestVideoFrameCallback support
      (mockVideo as any).requestVideoFrameCallback = jest.fn();
      
      optimizeVideoForMobile(mockVideo);
      
      expect(mockVideo.style.willChange).toBe('transform');
    });
  });

  describe('cleanupVideoResources', () => {
    let mockVideo: HTMLVideoElement;
    let mockTrack: MediaStreamTrack;
    let mockStream: MediaStream;

    beforeEach(() => {
      mockVideo = document.createElement('video');
      mockTrack = {
        stop: jest.fn()
      } as unknown as MediaStreamTrack;
      mockStream = {
        getTracks: jest.fn().mockReturnValue([mockTrack])
      } as unknown as MediaStream;
    });

    it('should stop all tracks and clear srcObject', () => {
      mockVideo.srcObject = mockStream;

      cleanupVideoResources(mockVideo);

      expect(mockTrack.stop).toHaveBeenCalled();
      expect(mockVideo.srcObject).toBeNull();
      expect(mockVideo.style.willChange).toBe('auto');
    });

    it('should handle video without srcObject', () => {
      mockVideo.srcObject = null;

      expect(() => cleanupVideoResources(mockVideo)).not.toThrow();
      expect(mockVideo.style.willChange).toBe('auto');
    });
  });

  describe('getOptimalVideoConstraints', () => {
    const originalHardwareConcurrency = navigator.hardwareConcurrency;
    
    afterEach(() => {
      // Restore original values
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        writable: true,
        value: originalHardwareConcurrency
      });
      delete (navigator as any).connection;
    });

    it('should return high quality constraints for powerful devices', () => {
      mockNavigator({
        hardwareConcurrency: 8
      });

      const constraints = getOptimalVideoConstraints();
      
      expect(constraints).toEqual({
        width: { ideal: 1600, max: 1920 },
        height: { ideal: 900, max: 1080 },
        frameRate: { ideal: 30 }
      });
    });

    it('should return optimized constraints for low power devices', () => {
      mockNavigator({
        hardwareConcurrency: 2
      });

      const constraints = getOptimalVideoConstraints();
      
      expect(constraints).toEqual({
        width: { ideal: 1280, max: 1600 },
        height: { ideal: 720, max: 900 },
        frameRate: { ideal: 24, max: 30 }
      });
    });

    it('should return optimized constraints for slow connections', () => {
      mockNavigator({
        hardwareConcurrency: 8
      });
      
      // Mock navigator.connection separately
      (navigator as any).connection = {
        effectiveType: '2g'
      };

      const constraints = getOptimalVideoConstraints();
      
      expect(constraints).toEqual({
        width: { ideal: 1280, max: 1600 },
        height: { ideal: 720, max: 900 },
        frameRate: { ideal: 24, max: 30 }
      });
      
      // Cleanup
      delete (navigator as any).connection;
    });

    it('should handle missing navigator properties gracefully', () => {
      const constraints = getOptimalVideoConstraints();
      
      expect(constraints).toEqual({
        width: { ideal: 1600, max: 1920 },
        height: { ideal: 900, max: 1080 },
        frameRate: { ideal: 30 }
      });
    });
  });
});