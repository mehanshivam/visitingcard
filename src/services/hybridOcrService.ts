import { ocrService, ContactData } from './ocrService';
import { GoogleVisionService } from './googleVisionService';

export interface ProcessingStrategy {
  primary: 'google-vision' | 'tesseract';
  fallback: 'tesseract' | 'google-vision' | 'none';
  reason: string;
}

export interface ProcessingResult extends ContactData {
  processor: 'google-vision' | 'tesseract';
  processingTime: number;
  strategy: ProcessingStrategy;
  fallbackUsed?: boolean;
  error?: string;
}

export interface HybridOcrConfig {
  googleVisionApiKey?: string;
  maxGoogleVisionRequests?: number;
  forceOfflineMode?: boolean;
  enableAnalytics?: boolean;
  networkTimeout?: number;
}

class HybridOcrService {
  private googleVisionService: GoogleVisionService;
  private config: HybridOcrConfig;
  private analytics: {
    googleVisionCount: number;
    tesseractCount: number;
    errors: Array<{ timestamp: number; processor: string; error: string }>;
    processingTimes: Array<{ timestamp: number; processor: string; time: number }>;
  } = {
    googleVisionCount: 0,
    tesseractCount: 0,
    errors: [],
    processingTimes: []
  };

  constructor(config: HybridOcrConfig = {}) {
    this.config = {
      maxGoogleVisionRequests: 1000,
      forceOfflineMode: false,
      enableAnalytics: true,
      networkTimeout: 10000, // 10 seconds
      ...config
    };

    this.googleVisionService = new GoogleVisionService({
      apiKey: this.config.googleVisionApiKey,
      maxRequests: this.config.maxGoogleVisionRequests
    });
  }

  async processImage(imageData: string | File | Blob | HTMLCanvasElement): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    // Determine processing strategy
    const strategy = await this.determineStrategy();
    
    console.log(`🤖 Using ${strategy.primary} processor (${strategy.reason})`);
    
    try {
      let result: ContactData;
      let processor: 'google-vision' | 'tesseract';
      let fallbackUsed = false;

      // Try primary strategy
      if (strategy.primary === 'google-vision') {
        try {
          // Convert HTMLCanvasElement to Blob if needed for Google Vision API
          const processableImage = imageData instanceof HTMLCanvasElement 
            ? await this.canvasToBlob(imageData)
            : imageData;
          result = await this.googleVisionService.processImage(processableImage);
          processor = 'google-vision';
          this.analytics.googleVisionCount++;
        } catch (error) {
          console.warn(`⚠️ Google Vision API failed: ${error}. Falling back to Tesseract.js`);
          
          if (strategy.fallback === 'tesseract') {
            result = await ocrService.processImage(imageData);
            processor = 'tesseract';
            fallbackUsed = true;
            this.analytics.tesseractCount++;
            
            // Log the error for monitoring
            this.logError('google-vision', error as Error);
          } else {
            throw error;
          }
        }
      } else {
        // Primary is Tesseract.js
        result = await ocrService.processImage(imageData);
        processor = 'tesseract';
        this.analytics.tesseractCount++;
      }

      const processingTime = Date.now() - startTime;
      
      // Log analytics if enabled
      if (this.config.enableAnalytics) {
        this.logProcessingTime(processor, processingTime);
      }

      console.log(`✅ Processing completed with ${processor} in ${processingTime}ms${fallbackUsed ? ' (fallback)' : ''}`);

      return {
        ...result,
        processor,
        processingTime,
        strategy,
        fallbackUsed
      };

    } catch (error) {
      console.error('❌ All OCR processing strategies failed:', error);
      
      // Log error
      this.logError(strategy.primary, error as Error);
      
      const processingTime = Date.now() - startTime;
      
      // Return empty result with error info
      return {
        raw_text: '',
        confidence: 0,
        processor: strategy.primary,
        processingTime,
        strategy,
        error: (error as Error).message,
        fieldConfidences: {}
      };
    }
  }

  private async canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      }, 'image/jpeg', 0.9);
    });
  }

  private async determineStrategy(): Promise<ProcessingStrategy> {
    // Force offline mode check
    if (this.config.forceOfflineMode) {
      return {
        primary: 'tesseract',
        fallback: 'none',
        reason: 'Force offline mode enabled'
      };
    }

    // Check if Google Vision API is configured (either API key or service account)
    const hasServiceAccount = await this.checkServiceAccountAvailable();
    if (!this.config.googleVisionApiKey && !hasServiceAccount) {
      return {
        primary: 'tesseract',
        fallback: 'none',
        reason: 'Google Vision API not configured (no API key or service account)'
      };
    }

    // Check network connectivity
    const isOnline = await this.checkNetworkConnectivity();
    if (!isOnline) {
      return {
        primary: 'tesseract',
        fallback: 'none',
        reason: 'Network connectivity unavailable'
      };
    }

    // Check usage limits
    const usageStats = this.googleVisionService.getUsageStats();
    if (usageStats.remainingRequests <= 0) {
      return {
        primary: 'tesseract',
        fallback: 'none',
        reason: 'Google Vision API monthly limit reached'
      };
    }

    // Default: Use Google Vision API with Tesseract.js fallback
    return {
      primary: 'google-vision',
      fallback: 'tesseract',
      reason: 'Optimal accuracy and speed'
    };
  }

  private async checkServiceAccountAvailable(): Promise<boolean> {
    try {
      const response = await fetch('/google-cloud-service-account.json', { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async checkNetworkConnectivity(): Promise<boolean> {
    if (!navigator.onLine) {
      return false;
    }

    try {
      // Quick connectivity test with timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config.networkTimeout!);

      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store'
      });

      clearTimeout(timeout);
      return response.ok;
    } catch (error) {
      console.log('🔌 Network connectivity check failed, using offline mode');
      return false;
    }
  }

  private logError(processor: string, error: Error): void {
    if (!this.config.enableAnalytics) return;

    this.analytics.errors.push({
      timestamp: Date.now(),
      processor,
      error: error.message
    });

    // Keep only last 50 errors to prevent memory bloat
    if (this.analytics.errors.length > 50) {
      this.analytics.errors = this.analytics.errors.slice(-50);
    }
  }

  private logProcessingTime(processor: string, time: number): void {
    if (!this.config.enableAnalytics) return;

    this.analytics.processingTimes.push({
      timestamp: Date.now(),
      processor,
      time
    });

    // Keep only last 100 processing times
    if (this.analytics.processingTimes.length > 100) {
      this.analytics.processingTimes = this.analytics.processingTimes.slice(-100);
    }
  }

  // Public methods for monitoring and analytics

  getAnalytics() {
    const googleVisionStats = this.googleVisionService.getUsageStats();
    
    return {
      usage: {
        googleVision: {
          count: this.analytics.googleVisionCount,
          remaining: googleVisionStats.remainingRequests,
          costEstimate: googleVisionStats.costEstimate
        },
        tesseract: {
          count: this.analytics.tesseractCount
        }
      },
      performance: {
        averageGoogleVisionTime: this.calculateAverageTime('google-vision'),
        averageTesseractTime: this.calculateAverageTime('tesseract'),
        recentErrors: this.analytics.errors.slice(-10)
      },
      recommendations: this.generateRecommendations()
    };
  }

  private calculateAverageTime(processor: string): number {
    const times = this.analytics.processingTimes
      .filter(entry => entry.processor === processor)
      .map(entry => entry.time);
    
    if (times.length === 0) return 0;
    return Math.round(times.reduce((sum, time) => sum + time, 0) / times.length);
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const analytics = this.getAnalytics();

    // Performance recommendations
    if (analytics.performance.averageTesseractTime > 15000) {
      recommendations.push('Consider optimizing Tesseract.js configuration for better mobile performance');
    }

    if (analytics.performance.averageGoogleVisionTime > 5000) {
      recommendations.push('Google Vision API response times are high, check network connectivity');
    }

    // Usage recommendations
    if (analytics.usage.googleVision.costEstimate > 10) {
      recommendations.push(`Monthly Google Vision API cost estimate: $${analytics.usage.googleVision.costEstimate.toFixed(2)}. Consider usage optimization.`);
    }

    // Error recommendations
    const recentErrorCount = analytics.performance.recentErrors.length;
    if (recentErrorCount > 5) {
      recommendations.push(`High error rate detected (${recentErrorCount} recent errors). Check API configuration and network connectivity.`);
    }

    return recommendations;
  }

  // Configuration methods

  setGoogleVisionApiKey(apiKey: string) {
    this.config.googleVisionApiKey = apiKey;
    this.googleVisionService = new GoogleVisionService({
      apiKey: apiKey,
      maxRequests: this.config.maxGoogleVisionRequests
    });
  }

  setGoogleVisionConfig(config: { serviceAccountPath?: string; apiKey?: string; maxRequests?: number }) {
    if (config.serviceAccountPath) {
      this.googleVisionService = new GoogleVisionService({
        serviceAccountPath: config.serviceAccountPath,
        maxRequests: config.maxRequests || this.config.maxGoogleVisionRequests
      });
    } else if (config.apiKey) {
      this.setGoogleVisionApiKey(config.apiKey);
    }
  }

  setOfflineMode(enabled: boolean) {
    this.config.forceOfflineMode = enabled;
    console.log(`🔧 Offline mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  resetUsageCounters() {
    this.analytics.googleVisionCount = 0;
    this.analytics.tesseractCount = 0;
    this.analytics.errors = [];
    this.analytics.processingTimes = [];
    this.googleVisionService.resetUsageCount();
  }

  // Health check method
  async healthCheck(): Promise<{
    googleVision: { available: boolean; reason?: string };
    tesseract: { available: boolean; reason?: string };
    network: { connected: boolean };
  }> {
    const network = await this.checkNetworkConnectivity();
    
    let googleVisionAvailable = false;
    let googleVisionReason = '';
    
    const hasServiceAccount = await this.checkServiceAccountAvailable();
    if (!this.config.googleVisionApiKey && !hasServiceAccount) {
      googleVisionReason = 'No API key or service account configured';
    } else if (!network) {
      googleVisionReason = 'Network unavailable';
    } else {
      const stats = this.googleVisionService.getUsageStats();
      if (stats.remainingRequests <= 0) {
        googleVisionReason = 'Monthly limit reached';
      } else {
        googleVisionAvailable = true;
      }
    }
    
    return {
      googleVision: { 
        available: googleVisionAvailable, 
        reason: googleVisionReason || undefined 
      },
      tesseract: { 
        available: true // Tesseract.js is always available offline
      },
      network: { 
        connected: network 
      }
    };
  }
}

// Export singleton instance
export const hybridOcrService = new HybridOcrService();
export { HybridOcrService };
export default hybridOcrService;