export interface CameraDevice {
  deviceId: string;
  label: string;
  kind: 'videoinput';
}

export interface CameraConstraints {
  width?: number | { ideal?: number; max?: number; min?: number };
  height?: number | { ideal?: number; max?: number; min?: number };
  deviceId?: string;
  facingMode?: 'user' | 'environment';
  frameRate?: number | { ideal?: number; max?: number; min?: number };
}

export interface CaptureOptions {
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
  quality?: number; // 0-1 for JPEG/WebP
  maxWidth?: number;
  maxHeight?: number;
}

export interface CameraError {
  name: string;
  message: string;
  code?: string;
}

export class CameraService {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;

  async getAvailableDevices(): Promise<CameraDevice[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
          kind: device.kind as 'videoinput'
        }));
    } catch (error) {
      throw this.handleCameraError(error);
    }
  }

  async requestCameraAccess(constraints: CameraConstraints = {}): Promise<MediaStream> {
    try {
      // Mobile-optimized constraints with fallback
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Detect iOS specifically for Safari compatibility
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isSafari = /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent);
      
      console.log('Browser detection:', { isMobile, isIOS, isAndroid, isSafari, userAgent: navigator.userAgent });
      
      const defaultConstraints = {
        video: {
          // More conservative constraints for mobile browsers
          width: isMobile ? 
            (isIOS ? { ideal: 1280, max: 1920 } : { ideal: 1280, max: 1920 }) : 
            { ideal: 1920, max: 2560 },
          height: isMobile ? 
            (isIOS ? { ideal: 720, max: 1080 } : { ideal: 720, max: 1080 }) : 
            { ideal: 1080, max: 1440 },
          facingMode: constraints.facingMode || (isMobile ? 'environment' : 'user'),
          // iOS Safari needs specific settings
          ...(isIOS && {
            frameRate: { ideal: 30, max: 30 }
          }),
          // Android Chrome specific optimizations
          ...(isAndroid && {
            aspectRatio: { ideal: 16/9 }
          }),
          ...(constraints.width && { width: constraints.width }),
          ...(constraints.height && { height: constraints.height }),
          ...(constraints.frameRate && { frameRate: constraints.frameRate }),
          ...(constraints.deviceId && { deviceId: { exact: constraints.deviceId } })
        },
        audio: false
      };

      try {
        this.stream = await navigator.mediaDevices.getUserMedia(defaultConstraints);
        return this.stream;
      } catch (constraintError) {
        console.warn('Advanced constraints failed, trying fallbacks:', constraintError);
        
        // Multiple fallback attempts for mobile compatibility
        const fallbackAttempts = [
          // Fallback 1: Simple facingMode only
          {
            video: {
              facingMode: constraints.facingMode || (isMobile ? 'environment' : 'user')
            },
            audio: false
          },
          // Fallback 2: Try user camera (front camera) - often more reliable on mobile
          {
            video: { facingMode: 'user' },
            audio: false
          },
          // Fallback 3: Just basic video (no constraints)  
          {
            video: true,
            audio: false
          },
          // Fallback 4: Very basic constraints for Safari
          ...(isSafari ? [{
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 }
            },
            audio: false
          }] : [])
        ];

        for (let i = 0; i < fallbackAttempts.length; i++) {
          try {
            console.log(`Trying fallback ${i + 1}:`, fallbackAttempts[i]);
            this.stream = await navigator.mediaDevices.getUserMedia(fallbackAttempts[i]);
            console.log(`Fallback ${i + 1} successful!`);
            return this.stream;
          } catch (fallbackError) {
            console.warn(`Fallback ${i + 1} failed:`, fallbackError);
            if (i === fallbackAttempts.length - 1) {
              throw fallbackError; // Throw the last error if all fallbacks fail
            }
          }
        }
        
        // This should never be reached, but TypeScript needs it
        throw new Error('All camera access attempts failed');
      }
    } catch (error) {
      throw this.handleCameraError(error);
    }
  }

  async startCamera(videoElement: HTMLVideoElement, constraints?: CameraConstraints): Promise<void> {
    try {
      this.video = videoElement;
      this.stream = await this.requestCameraAccess(constraints);
      
      videoElement.srcObject = this.stream;
      videoElement.play();
    } catch (error) {
      throw this.handleCameraError(error);
    }
  }

  async switchCamera(deviceId: string): Promise<void> {
    if (!this.video) {
      throw new Error('No video element initialized');
    }

    try {
      this.stopCamera();
      await this.startCamera(this.video, { deviceId });
    } catch (error) {
      throw this.handleCameraError(error);
    }
  }

  captureImage(options: CaptureOptions = {}): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.video || !this.stream) {
        reject(new Error('Camera not initialized'));
        return;
      }

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Use actual video dimensions or apply size constraints
      let { videoWidth: width, videoHeight: height } = this.video;
      
      // Apply max dimensions if specified
      if (options.maxWidth && width > options.maxWidth) {
        height = (height * options.maxWidth) / width;
        width = options.maxWidth;
      }
      if (options.maxHeight && height > options.maxHeight) {
        width = (width * options.maxHeight) / height;
        height = options.maxHeight;
      }

      canvas.width = width;
      canvas.height = height;
      
      // High-quality rendering settings
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      
      context.drawImage(this.video, 0, 0, width, height);
      
      // Use specified format and quality or defaults optimized for OCR
      const format = options.format || 'image/jpeg';
      const quality = options.quality ?? (format === 'image/png' ? undefined : 0.95);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to capture image'));
        }
      }, format, quality);
    });
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.video) {
      this.video.srcObject = null;
    }
  }

  isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  private handleCameraError(error: any): CameraError {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return {
        name: 'PermissionDenied',
        message: 'Camera access denied. Please allow camera permissions.',
        code: error.name
      };
    }
    
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      return {
        name: 'NoCamera',
        message: 'No camera found. Please connect a camera device.',
        code: error.name
      };
    }
    
    if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      return {
        name: 'CameraInUse',
        message: 'Camera is already in use by another application.',
        code: error.name
      };
    }
    
    if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
      return {
        name: 'UnsupportedConstraints',
        message: 'Camera constraints not supported.',
        code: error.name
      };
    }
    
    return {
      name: 'CameraError',
      message: error.message || 'An unknown camera error occurred.',
      code: error.name
    };
  }
}

export const cameraService = new CameraService();