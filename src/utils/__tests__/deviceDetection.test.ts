/**
 * @jest-environment jsdom
 */

import { 
  isMobileDevice, 
  isIOS, 
  isAndroid, 
  isTouchDevice, 
  getViewportDimensions, 
  getMobileOptimizedConstraints 
} from '../deviceDetection';

// Mock navigator.userAgent
const mockUserAgent = (userAgent: string) => {
  Object.defineProperty(navigator, 'userAgent', {
    writable: true,
    value: userAgent
  });
};

// Mock navigator.maxTouchPoints
const mockMaxTouchPoints = (value: number) => {
  Object.defineProperty(navigator, 'maxTouchPoints', {
    writable: true,
    value: value
  });
};

// Mock window dimensions
const mockWindowDimensions = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    value: width
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    value: height
  });
  
  Object.defineProperty(document.documentElement, 'clientWidth', {
    writable: true,
    value: width
  });
  Object.defineProperty(document.documentElement, 'clientHeight', {
    writable: true,
    value: height
  });
};

describe('deviceDetection utilities', () => {
  const originalUserAgent = navigator.userAgent;
  const originalMaxTouchPoints = navigator.maxTouchPoints;
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  afterEach(() => {
    // Restore original values
    mockUserAgent(originalUserAgent);
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      value: originalMaxTouchPoints
    });
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: originalInnerWidth
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      value: originalInnerHeight
    });
  });

  describe('isMobileDevice', () => {
    it('should detect Android devices', () => {
      mockUserAgent('Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36');
      expect(isMobileDevice()).toBe(true);
    });

    it('should detect iPhone devices', () => {
      mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15');
      expect(isMobileDevice()).toBe(true);
    });

    it('should detect iPad devices', () => {
      mockUserAgent('Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15');
      expect(isMobileDevice()).toBe(true);
    });

    it('should not detect desktop browsers as mobile', () => {
      mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      expect(isMobileDevice()).toBe(false);
    });

    it('should detect BlackBerry devices', () => {
      mockUserAgent('Mozilla/5.0 (BlackBerry; U; BlackBerry 9900; en) AppleWebKit/534.11+');
      expect(isMobileDevice()).toBe(true);
    });
  });

  describe('isIOS', () => {
    it('should detect iPhone', () => {
      mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15');
      expect(isIOS()).toBe(true);
    });

    it('should detect iPad', () => {
      mockUserAgent('Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15');
      expect(isIOS()).toBe(true);
    });

    it('should detect iPod', () => {
      mockUserAgent('Mozilla/5.0 (iPod touch; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15');
      expect(isIOS()).toBe(true);
    });

    it('should not detect Android as iOS', () => {
      mockUserAgent('Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36');
      expect(isIOS()).toBe(false);
    });
  });

  describe('isAndroid', () => {
    it('should detect Android devices', () => {
      mockUserAgent('Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36');
      expect(isAndroid()).toBe(true);
    });

    it('should not detect iOS as Android', () => {
      mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15');
      expect(isAndroid()).toBe(false);
    });
  });

  describe('isTouchDevice', () => {
    const originalOntouchstart = (window as any).ontouchstart;
    
    afterEach(() => {
      // Restore original state
      if (originalOntouchstart !== undefined) {
        (window as any).ontouchstart = originalOntouchstart;
      } else {
        delete (window as any).ontouchstart;
      }
    });

    it('should detect touch device with ontouchstart', () => {
      // Mock ontouchstart property exists
      mockMaxTouchPoints(0);
      (window as any).ontouchstart = {};
      
      expect(isTouchDevice()).toBe(true);
    });

    it('should detect touch device with maxTouchPoints', () => {
      // Remove ontouchstart property
      delete (window as any).ontouchstart;
      mockMaxTouchPoints(5);
      expect(isTouchDevice()).toBe(true);
    });

    it('should not detect non-touch device', () => {
      // Remove ontouchstart property
      delete (window as any).ontouchstart;
      mockMaxTouchPoints(0);
      expect(isTouchDevice()).toBe(false);
    });
  });

  describe('getViewportDimensions', () => {
    it('should return correct viewport dimensions', () => {
      mockWindowDimensions(1024, 768);
      
      const dimensions = getViewportDimensions();
      expect(dimensions).toEqual({ width: 1024, height: 768 });
    });

    it('should handle edge case with zero dimensions', () => {
      mockWindowDimensions(0, 0);
      
      const dimensions = getViewportDimensions();
      expect(dimensions).toEqual({ width: 0, height: 0 });
    });
  });

  describe('getMobileOptimizedConstraints', () => {
    it('should return desktop constraints for non-mobile devices', () => {
      mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      const constraints = getMobileOptimizedConstraints();
      expect(constraints).toEqual({
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      });
    });

    it('should return small mobile constraints for narrow viewports', () => {
      mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15');
      mockWindowDimensions(375, 667);
      
      const constraints = getMobileOptimizedConstraints();
      expect(constraints).toEqual({
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 }
      });
    });

    it('should return tablet constraints for wider mobile viewports', () => {
      mockUserAgent('Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15');
      mockWindowDimensions(1024, 768);
      
      const constraints = getMobileOptimizedConstraints();
      expect(constraints).toEqual({
        width: { ideal: 1600, max: 1920 },
        height: { ideal: 900, max: 1080 }
      });
    });
  });
});