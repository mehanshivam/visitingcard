import { ImageQualityService } from '../imageQualityService';

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

// Mock canvas element
const mockCanvas = {
  getContext: jest.fn(() => mockContext),
  toBlob: jest.fn((callback) => {
    const mockBlob = new Blob(['mock'], { type: 'image/jpeg' });
    callback(mockBlob);
  }),
  width: 0,
  height: 0
} as any;

// Mock document.createElement
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

describe('ImageQualityService', () => {
  let service: ImageQualityService;

  beforeEach(() => {
    service = new ImageQualityService();
    jest.clearAllMocks();
  });

  describe('analyzeImage', () => {
    it('should analyze image and return quality assessment', async () => {
      const mockBlob = new Blob(['mock image'], { type: 'image/jpeg' });
      
      // Mock Image loading
      const mockImage = {
        width: 1920,
        height: 1080,
        onload: null as any,
        onerror: null as any,
        src: ''
      };
      
      global.Image = jest.fn(() => mockImage) as any;
      
      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);

      const assessment = await service.analyzeImage(mockBlob);

      expect(assessment).toBeDefined();
      expect(assessment.score).toBeGreaterThanOrEqual(0);
      expect(assessment.score).toBeLessThanOrEqual(100);
      expect(assessment.metrics).toBeDefined();
      expect(assessment.metrics.resolution.width).toBe(1920);
      expect(assessment.metrics.resolution.height).toBe(1080);
      expect(assessment.metrics.resolution.megapixels).toBeCloseTo(2.07);
      expect(assessment.isGoodForOCR).toBeDefined();
      expect(Array.isArray(assessment.issues)).toBe(true);
      expect(Array.isArray(assessment.recommendations)).toBe(true);
    });

    it('should handle image loading errors', async () => {
      const mockBlob = new Blob(['mock image'], { type: 'image/jpeg' });
      
      const mockImage = {
        width: 0,
        height: 0,
        onload: null as any,
        onerror: null as any,
        src: ''
      };
      
      global.Image = jest.fn(() => mockImage) as any;
      
      setTimeout(() => {
        if (mockImage.onerror) mockImage.onerror();
      }, 0);

      await expect(service.analyzeImage(mockBlob)).rejects.toThrow();
    });
  });

  describe('quality metrics calculation', () => {
    it('should identify low sharpness issues', async () => {
      const mockBlob = new Blob(['mock image'], { type: 'image/jpeg' });
      
      // Mock low-contrast/blurry image data
      mockContext.getImageData.mockReturnValue({
        data: new Uint8ClampedArray(1920 * 1080 * 4).fill(100), // Low contrast
        width: 1920,
        height: 1080
      });

      const mockImage = {
        width: 1920,
        height: 1080,
        onload: null as any,
        onerror: null as any,
        src: ''
      };
      
      global.Image = jest.fn(() => mockImage) as any;
      
      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);

      const assessment = await service.analyzeImage(mockBlob);
      
      expect(assessment.metrics.sharpness).toBeLessThan(50);
      expect(assessment.issues.some(issue => issue.type === 'blur')).toBe(true);
    });

    it('should identify brightness issues', async () => {
      const mockBlob = new Blob(['mock image'], { type: 'image/jpeg' });
      
      // Mock very dark image
      mockContext.getImageData.mockReturnValue({
        data: new Uint8ClampedArray(1920 * 1080 * 4).fill(20), // Very dark
        width: 1920,
        height: 1080
      });

      const mockImage = {
        width: 1920,
        height: 1080,
        onload: null as any,
        onerror: null as any,
        src: ''
      };
      
      global.Image = jest.fn(() => mockImage) as any;
      
      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);

      const assessment = await service.analyzeImage(mockBlob);
      
      expect(assessment.metrics.brightness).toBeLessThan(35);
      expect(assessment.issues.some(issue => issue.type === 'dark')).toBe(true);
    });

    it('should identify low resolution issues', async () => {
      const mockBlob = new Blob(['mock image'], { type: 'image/jpeg' });
      
      const mockImage = {
        width: 640,  // Low resolution
        height: 480,
        onload: null as any,
        onerror: null as any,
        src: ''
      };
      
      global.Image = jest.fn(() => mockImage) as any;
      
      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);

      const assessment = await service.analyzeImage(mockBlob);
      
      expect(assessment.metrics.resolution.megapixels).toBeLessThan(1.0);
      expect(assessment.issues.some(issue => issue.type === 'low_resolution')).toBe(true);
    });

    it('should assess OCR readiness correctly', async () => {
      const mockBlob = new Blob(['mock image'], { type: 'image/jpeg' });
      
      // Mock high-quality image data
      mockContext.getImageData.mockReturnValue({
        data: new Uint8ClampedArray(1920 * 1080 * 4).map((_, i) => {
          // Create alternating pattern for good contrast/sharpness
          return i % 4 === 3 ? 255 : (Math.floor(i / 4) % 2) * 255;
        }),
        width: 1920,
        height: 1080
      });

      const mockImage = {
        width: 1920,
        height: 1080,
        onload: null as any,
        onerror: null as any,
        src: ''
      };
      
      global.Image = jest.fn(() => mockImage) as any;
      
      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);

      const assessment = await service.analyzeImage(mockBlob);
      
      expect(assessment.isGoodForOCR).toBe(true);
      expect(assessment.score).toBeGreaterThan(70);
    });
  });

  describe('recommendations', () => {
    it('should provide relevant recommendations for identified issues', async () => {
      const mockBlob = new Blob(['mock image'], { type: 'image/jpeg' });
      
      // Mock problematic image
      mockContext.getImageData.mockReturnValue({
        data: new Uint8ClampedArray(640 * 480 * 4).fill(50), // Dark, low contrast
        width: 640,
        height: 480
      });

      const mockImage = {
        width: 640,
        height: 480,
        onload: null as any,
        onerror: null as any,
        src: ''
      };
      
      global.Image = jest.fn(() => mockImage) as any;
      
      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);

      const assessment = await service.analyzeImage(mockBlob);
      
      expect(assessment.recommendations.length).toBeGreaterThan(0);
      expect(assessment.recommendations.some(rec => 
        rec.includes('lighting') || rec.includes('resolution') || rec.includes('focus')
      )).toBe(true);
    });
  });
});