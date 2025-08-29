import { hybridOcrService, ProcessingResult } from './hybridOcrService';
import { ContactData } from './ocrService';
import { ExtractedContactData } from '../stores/scanWorkflowStore';

export interface ProcessingStats {
  processor: 'google-vision' | 'tesseract';
  processingTime: number;
  confidence: number;
  fallbackUsed: boolean;
  costEstimate: number;
}

class OcrServiceWrapper {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Initialize hybrid service with environment variables
    const apiKey = process.env.REACT_APP_GOOGLE_VISION_API_KEY;
    const serviceAccountPath = process.env.REACT_APP_GOOGLE_CLOUD_SERVICE_ACCOUNT_PATH;
    const maxRequests = parseInt(process.env.REACT_APP_MAX_GOOGLE_VISION_REQUESTS || '1000');
    const enableAnalytics = process.env.REACT_APP_ENABLE_ANALYTICS === 'true';

    // The service account is automatically loaded from the project directory
    // No additional configuration needed - the GoogleVisionService will try to load it
    console.log('🔐 Attempting to use Google Vision API with service account authentication');
    
    // Keep API key as fallback if provided
    if (apiKey) {
      hybridOcrService.setGoogleVisionApiKey(apiKey);
      console.log('🌥️ Google Vision API fallback configured with API key');
    }

    this.isInitialized = true;
    console.log('🤖 Hybrid OCR service initialized');
  }

  async processImage(imageData: string | File | HTMLCanvasElement | Blob): Promise<{
    data: ExtractedContactData;
    stats: ProcessingStats;
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('🔄 Starting hybrid OCR processing...');
      
      const result: ProcessingResult = await hybridOcrService.processImage(imageData);
      
      // Convert ContactData to ExtractedContactData (store format)
      const extractedData: ExtractedContactData = {
        name: result.name,
        title: result.title,
        company: result.company,
        phone: result.phone,
        email: result.email,
        website: result.website,
        address: result.address
      };

      // Calculate cost estimate
      const costEstimate = result.processor === 'google-vision' ? 0.003 : 0; // $3 per 1000 requests

      const stats: ProcessingStats = {
        processor: result.processor,
        processingTime: result.processingTime,
        confidence: result.confidence,
        fallbackUsed: result.fallbackUsed || false,
        costEstimate
      };

      console.log(`✅ Processing completed with ${result.processor} in ${result.processingTime}ms (confidence: ${result.confidence}%)`);
      
      if (result.fallbackUsed) {
        console.log('⚠️ Fallback to Tesseract.js was used');
      }

      return { data: extractedData, stats };

    } catch (error) {
      console.error('❌ OCR processing failed:', error);
      throw new Error(`OCR processing failed: ${error}`);
    }
  }

  // Analytics and monitoring methods
  getAnalytics() {
    return hybridOcrService.getAnalytics();
  }

  async getHealthStatus() {
    return hybridOcrService.healthCheck();
  }

  // Configuration methods
  setOfflineMode(enabled: boolean) {
    hybridOcrService.setOfflineMode(enabled);
  }

  resetUsageCounters() {
    hybridOcrService.resetUsageCounters();
  }

  // Get processing strategy without actually processing
  async getRecommendedStrategy(): Promise<string> {
    const health = await this.getHealthStatus();
    
    if (health.googleVision.available) {
      return 'google-vision-primary';
    } else if (!health.network.connected) {
      return 'offline-only';
    } else {
      return `tesseract-only (${health.googleVision.reason})`;
    }
  }

  // Usage and cost monitoring
  getUsageSummary(): {
    totalRequests: number;
    monthlyEstimate: number;
    recommendations: string[];
  } {
    const analytics = this.getAnalytics();
    const totalRequests = analytics.usage.googleVision.count + analytics.usage.tesseract.count;
    
    return {
      totalRequests,
      monthlyEstimate: analytics.usage.googleVision.costEstimate,
      recommendations: analytics.recommendations
    };
  }
}

// Export singleton instance
export const ocrServiceWrapper = new OcrServiceWrapper();
export default ocrServiceWrapper;