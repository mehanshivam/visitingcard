export interface ImageQualityMetrics {
  sharpness: number; // 0-100 (higher = sharper)
  brightness: number; // 0-100 (50 = ideal)
  contrast: number; // 0-100 (higher = better contrast)
  resolution: {
    width: number;
    height: number;
    megapixels: number;
  };
  fileSize: number; // in bytes
  aspectRatio: number;
}

export interface QualityAssessment {
  score: number; // Overall quality score 0-100
  metrics: ImageQualityMetrics;
  issues: QualityIssue[];
  recommendations: string[];
  isGoodForOCR: boolean;
}

export interface QualityIssue {
  type: 'blur' | 'dark' | 'bright' | 'low_contrast' | 'low_resolution' | 'aspect_ratio';
  severity: 'low' | 'medium' | 'high';
  message: string;
}

export class ImageQualityService {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get canvas context for image quality analysis');
    }
    this.ctx = context;
  }

  async analyzeImage(imageBlob: Blob): Promise<QualityAssessment> {
    const image = await this.loadImage(imageBlob);
    const metrics = await this.calculateMetrics(image, imageBlob);
    const issues = this.identifyIssues(metrics);
    const score = this.calculateOverallScore(metrics, issues);
    const recommendations = this.generateRecommendations(issues);
    const isGoodForOCR = this.assessOCRReadiness(metrics, issues);

    return {
      score,
      metrics,
      issues,
      recommendations,
      isGoodForOCR
    };
  }

  private async loadImage(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(blob);
    });
  }

  private async calculateMetrics(image: HTMLImageElement, blob: Blob): Promise<ImageQualityMetrics> {
    // Set up canvas with image dimensions
    this.canvas.width = image.width;
    this.canvas.height = image.height;
    this.ctx.drawImage(image, 0, 0);

    const imageData = this.ctx.getImageData(0, 0, image.width, image.height);
    
    return {
      sharpness: this.calculateSharpness(imageData),
      brightness: this.calculateBrightness(imageData),
      contrast: this.calculateContrast(imageData),
      resolution: {
        width: image.width,
        height: image.height,
        megapixels: (image.width * image.height) / 1000000
      },
      fileSize: blob.size,
      aspectRatio: image.width / image.height
    };
  }

  private calculateSharpness(imageData: ImageData): number {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Convert to grayscale and calculate Sobel edge detection
    const gray = new Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = i / 4;
      gray[pixelIndex] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    let sobelSum = 0;
    let validPixels = 0;

    // Apply Sobel operator (simplified)
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        
        // Horizontal gradient (Gx)
        const gx = -gray[idx - width - 1] - 2 * gray[idx - 1] - gray[idx + width - 1] +
                    gray[idx - width + 1] + 2 * gray[idx + 1] + gray[idx + width + 1];
        
        // Vertical gradient (Gy)  
        const gy = -gray[idx - width - 1] - 2 * gray[idx - width] - gray[idx - width + 1] +
                    gray[idx + width - 1] + 2 * gray[idx + width] + gray[idx + width + 1];
        
        // Gradient magnitude
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        sobelSum += magnitude;
        validPixels++;
      }
    }

    const averageGradient = sobelSum / validPixels;
    // Normalize to 0-100 scale (typical values are 0-50 for average gradient)
    return Math.min(100, (averageGradient / 50) * 100);
  }

  private calculateBrightness(imageData: ImageData): number {
    const data = imageData.data;
    let sum = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      // Calculate luminance
      sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    
    const averageBrightness = sum / (data.length / 4);
    return (averageBrightness / 255) * 100;
  }

  private calculateContrast(imageData: ImageData): number {
    const data = imageData.data;
    const luminances: number[] = [];
    
    // Calculate luminance for each pixel
    for (let i = 0; i < data.length; i += 4) {
      const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      luminances.push(luminance);
    }
    
    // Calculate standard deviation of luminance (contrast measure)
    const mean = luminances.reduce((sum, l) => sum + l, 0) / luminances.length;
    const variance = luminances.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / luminances.length;
    const stdDev = Math.sqrt(variance);
    
    // Normalize to 0-100 scale (typical std dev is 0-80)
    return Math.min(100, (stdDev / 80) * 100);
  }

  private identifyIssues(metrics: ImageQualityMetrics): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check sharpness
    if (metrics.sharpness < 30) {
      issues.push({
        type: 'blur',
        severity: 'high',
        message: 'Image is too blurry for accurate text recognition'
      });
    } else if (metrics.sharpness < 50) {
      issues.push({
        type: 'blur',
        severity: 'medium',
        message: 'Image could be sharper for better text recognition'
      });
    }

    // Check brightness
    if (metrics.brightness < 20) {
      issues.push({
        type: 'dark',
        severity: 'high',
        message: 'Image is too dark - increase lighting or exposure'
      });
    } else if (metrics.brightness < 35) {
      issues.push({
        type: 'dark',
        severity: 'medium',
        message: 'Image is somewhat dark - consider better lighting'
      });
    } else if (metrics.brightness > 80) {
      issues.push({
        type: 'bright',
        severity: 'high',
        message: 'Image is overexposed - reduce lighting or exposure'
      });
    } else if (metrics.brightness > 65) {
      issues.push({
        type: 'bright',
        severity: 'medium',
        message: 'Image is quite bright - may cause text to wash out'
      });
    }

    // Check contrast
    if (metrics.contrast < 15) {
      issues.push({
        type: 'low_contrast',
        severity: 'high',
        message: 'Poor contrast makes text hard to distinguish'
      });
    } else if (metrics.contrast < 25) {
      issues.push({
        type: 'low_contrast',
        severity: 'medium',
        message: 'Low contrast may affect text recognition'
      });
    }

    // Check resolution
    if (metrics.resolution.megapixels < 1.0) {
      issues.push({
        type: 'low_resolution',
        severity: 'high',
        message: 'Resolution too low for reliable text recognition'
      });
    } else if (metrics.resolution.megapixels < 2.0) {
      issues.push({
        type: 'low_resolution',
        severity: 'medium',
        message: 'Higher resolution would improve text recognition'
      });
    }

    // Check aspect ratio (business cards are typically 1.6:1 to 2:1)
    if (metrics.aspectRatio < 1.2 || metrics.aspectRatio > 2.5) {
      issues.push({
        type: 'aspect_ratio',
        severity: 'low',
        message: 'Unusual aspect ratio - ensure the full business card is captured'
      });
    }

    return issues;
  }

  private calculateOverallScore(metrics: ImageQualityMetrics, issues: QualityIssue[]): number {
    let score = 100;
    
    // Deduct points for issues
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'high':
          score -= 25;
          break;
        case 'medium':
          score -= 15;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });

    // Bonus for good metrics
    if (metrics.sharpness > 70) score += 5;
    if (metrics.contrast > 40) score += 5;
    if (metrics.brightness >= 40 && metrics.brightness <= 60) score += 5;
    if (metrics.resolution.megapixels > 3) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  private generateRecommendations(issues: QualityIssue[]): string[] {
    const recommendations: string[] = [];
    const issueTypes = new Set(issues.map(issue => issue.type));

    if (issueTypes.has('blur')) {
      recommendations.push('Hold the camera steady and ensure the business card is in focus');
      recommendations.push('Move closer to the business card or use autofocus');
    }

    if (issueTypes.has('dark')) {
      recommendations.push('Improve lighting - use natural light or add more light sources');
      recommendations.push('Avoid shadows falling on the business card');
    }

    if (issueTypes.has('bright')) {
      recommendations.push('Reduce harsh lighting or move away from direct light sources');
      recommendations.push('Avoid flash if it creates glare on the card');
    }

    if (issueTypes.has('low_contrast')) {
      recommendations.push('Place the business card on a contrasting background');
      recommendations.push('Ensure even lighting to improve text contrast');
    }

    if (issueTypes.has('low_resolution')) {
      recommendations.push('Move closer to capture more detail');
      recommendations.push('Use a higher resolution camera setting if available');
    }

    if (issueTypes.has('aspect_ratio')) {
      recommendations.push('Frame the entire business card within the camera view');
      recommendations.push('Hold the camera parallel to the business card surface');
    }

    // General recommendations if no specific issues
    if (recommendations.length === 0) {
      recommendations.push('Image quality is good for text recognition');
      recommendations.push('Consider retaking if any text appears unclear');
    }

    return recommendations;
  }

  private assessOCRReadiness(metrics: ImageQualityMetrics, issues: QualityIssue[]): boolean {
    // Must meet minimum requirements for OCR
    const hasHighSeverityIssues = issues.some(issue => issue.severity === 'high');
    const hasGoodSharpness = metrics.sharpness > 30;
    const hasGoodContrast = metrics.contrast > 15;
    const hasAdequateResolution = metrics.resolution.megapixels > 1.0;
    const hasReasonableBrightness = metrics.brightness > 20 && metrics.brightness < 80;

    return !hasHighSeverityIssues && 
           hasGoodSharpness && 
           hasGoodContrast && 
           hasAdequateResolution && 
           hasReasonableBrightness;
  }
}

let _imageQualityService: ImageQualityService | null = null;

export const imageQualityService = {
  get instance(): ImageQualityService {
    if (!_imageQualityService) {
      _imageQualityService = new ImageQualityService();
    }
    return _imageQualityService;
  },
  
  analyzeImage: (imageBlob: Blob) => imageQualityService.instance.analyzeImage(imageBlob)
};