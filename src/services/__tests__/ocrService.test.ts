import { ocrService, ContactData } from '../ocrService';

// Mock Tesseract.js
jest.mock('tesseract.js', () => ({
  createWorker: jest.fn(() => Promise.resolve({
    setParameters: jest.fn(() => Promise.resolve()),
    recognize: jest.fn(() => Promise.resolve({
      data: {
        text: 'John Smith\nSoftware Engineer\nAcme Corporation\n+1 (555) 123-4567\njohn.smith@acme.com\nwww.acme.com',
        confidence: 85.5
      }
    })),
    terminate: jest.fn(() => Promise.resolve())
  }))
}));

describe('OCRService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await ocrService.terminate();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await expect(ocrService.initialize()).resolves.not.toThrow();
    });

    it('should not reinitialize if already initialized', async () => {
      await ocrService.initialize();
      await ocrService.initialize(); // Should not throw
      expect(true).toBe(true); // Test passes if no exception
    });
  });

  describe('image processing', () => {
    const mockBlob = new Blob(['test'], { type: 'image/jpeg' });

    it('should process image and extract contact data', async () => {
      const result: ContactData = await ocrService.processImage(mockBlob);

      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('company');
      expect(result).toHaveProperty('phone');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('website');
      expect(result).toHaveProperty('raw_text');
      expect(result).toHaveProperty('confidence');

      expect(result.confidence).toBe(85.5);
      expect(result.raw_text).toContain('John Smith');
    });

    it('should handle OCR processing errors', async () => {
      const mockWorker = {
        setParameters: jest.fn(() => Promise.resolve()),
        recognize: jest.fn(() => Promise.reject(new Error('OCR failed'))),
        terminate: jest.fn(() => Promise.resolve())
      };

      const { createWorker } = require('tesseract.js');
      createWorker.mockResolvedValueOnce(mockWorker);

      await expect(ocrService.processImage(mockBlob)).rejects.toThrow('OCR processing failed');
    });
  });

  describe('contact data parsing', () => {
    const mockBlob = new Blob(['test'], { type: 'image/jpeg' });

    it('should parse email addresses correctly', async () => {
      const mockWorker = {
        setParameters: jest.fn(() => Promise.resolve()),
        recognize: jest.fn(() => Promise.resolve({
          data: {
            text: 'Contact: john.doe@example.com',
            confidence: 90
          }
        })),
        terminate: jest.fn(() => Promise.resolve())
      };

      const { createWorker } = require('tesseract.js');
      createWorker.mockResolvedValueOnce(mockWorker);

      const result = await ocrService.processImage(mockBlob);
      expect(result.email).toBe('john.doe@example.com');
    });

    it('should parse phone numbers correctly', async () => {
      const mockWorker = {
        setParameters: jest.fn(() => Promise.resolve()),
        recognize: jest.fn(() => Promise.resolve({
          data: {
            text: 'Phone: (555) 123-4567',
            confidence: 90
          }
        })),
        terminate: jest.fn(() => Promise.resolve())
      };

      const { createWorker } = require('tesseract.js');
      createWorker.mockResolvedValueOnce(mockWorker);

      const result = await ocrService.processImage(mockBlob);
      expect(result.phone).toBe('(555) 123-4567');
    });

    it('should derive website from email domain', async () => {
      const mockWorker = {
        setParameters: jest.fn(() => Promise.resolve()),
        recognize: jest.fn(() => Promise.resolve({
          data: {
            text: 'john@company.com',
            confidence: 90
          }
        })),
        terminate: jest.fn(() => Promise.resolve())
      };

      const { createWorker } = require('tesseract.js');
      createWorker.mockResolvedValueOnce(mockWorker);

      const result = await ocrService.processImage(mockBlob);
      expect(result.website).toBe('www.company.com');
    });
  });

  describe('confidence assessment', () => {
    it('should correctly identify high confidence results', () => {
      expect(ocrService.isHighConfidence(70)).toBe(true);
      expect(ocrService.isHighConfidence(85)).toBe(true);
    });

    it('should correctly identify low confidence results', () => {
      expect(ocrService.isHighConfidence(50)).toBe(false);
      expect(ocrService.isHighConfidence(59)).toBe(false);
    });

    it('should return correct confidence threshold', () => {
      expect(ocrService.getConfidenceThreshold()).toBe(60);
    });
  });

  describe('structured field detection', () => {
    const mockBlob = new Blob(['test'], { type: 'image/jpeg' });

    it('should provide confidence scores for detected fields', async () => {
      const mockWorker = {
        setParameters: jest.fn(() => Promise.resolve()),
        recognize: jest.fn(() => Promise.resolve({
          data: {
            text: 'John Smith\nSenior Software Engineer\nTech Solutions LLC\n(555) 123-4567\njohn.smith@techsolutions.com',
            confidence: 90,
            words: []
          }
        })),
        terminate: jest.fn(() => Promise.resolve())
      };

      const { createWorker } = require('tesseract.js');
      createWorker.mockResolvedValueOnce(mockWorker);

      const result = await ocrService.processImage(mockBlob);
      
      expect(result.fieldConfidences).toBeDefined();
      expect(result.fieldConfidences?.email).toBeGreaterThan(90);
      expect(result.fieldConfidences?.phone).toBeGreaterThan(75);
      expect(result.name).toBe('John Smith');
      expect(result.title).toBe('Senior Software Engineer');
      expect(result.company).toBe('Tech Solutions LLC');
    });

    it('should prevent cross-contamination between fields', async () => {
      const mockWorker = {
        setParameters: jest.fn(() => Promise.resolve()),
        recognize: jest.fn(() => Promise.resolve({
          data: {
            text: 'CEO John Smith\nAcme Corporation CEO\n(555) 123-4567\njohn@acme.com',
            confidence: 85,
            words: []
          }
        })),
        terminate: jest.fn(() => Promise.resolve())
      };

      const { createWorker } = require('tesseract.js');
      createWorker.mockResolvedValueOnce(mockWorker);

      const result = await ocrService.processImage(mockBlob);
      
      // Should not assign CEO title to name field
      expect(result.name).not.toContain('CEO');
      // Should detect CEO as title
      expect(result.title).toContain('CEO');
      // Company should not be same as name
      expect(result.company).not.toBe(result.name);
    });

    it('should handle business card with mixed up fields correctly', async () => {
      const mockWorker = {
        setParameters: jest.fn(() => Promise.resolve()),
        recognize: jest.fn(() => Promise.resolve({
          data: {
            text: 'Marketing Director\nSarah Johnson\nGlobal Marketing Inc\n+1-555-987-6543\nsarah.johnson@globalmarketing.com',
            confidence: 88,
            words: []
          }
        })),
        terminate: jest.fn(() => Promise.resolve())
      };

      const { createWorker } = require('tesseract.js');
      createWorker.mockResolvedValueOnce(mockWorker);

      const result = await ocrService.processImage(mockBlob);
      
      expect(result.name).toBe('Sarah Johnson');
      expect(result.title).toBe('Marketing Director');
      expect(result.company).toBe('Global Marketing Inc');
      expect(result.email).toBe('sarah.johnson@globalmarketing.com');
    });
  });

  describe('cleanup', () => {
    it('should terminate worker properly', async () => {
      await ocrService.initialize();
      await expect(ocrService.terminate()).resolves.not.toThrow();
    });

    it('should handle termination when worker is null', async () => {
      await expect(ocrService.terminate()).resolves.not.toThrow();
    });
  });
});