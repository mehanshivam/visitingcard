// Performance optimization utilities for mobile devices

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const preloadVideo = (videoElement: HTMLVideoElement): Promise<void> => {
  return new Promise((resolve) => {
    const handleCanPlay = () => {
      videoElement.removeEventListener('canplay', handleCanPlay);
      resolve();
    };
    
    if (videoElement.readyState >= 3) {
      resolve();
    } else {
      videoElement.addEventListener('canplay', handleCanPlay);
    }
  });
};

export const optimizeVideoForMobile = (videoElement: HTMLVideoElement): void => {
  // Optimize video attributes for mobile performance
  videoElement.setAttribute('webkit-playsinline', 'true');
  videoElement.setAttribute('x-webkit-airplay', 'allow');
  
  // Reduce memory usage on mobile
  videoElement.setAttribute('preload', 'metadata');
  
  // Enable hardware acceleration if available
  if ('requestVideoFrameCallback' in videoElement) {
    videoElement.style.willChange = 'transform';
  }
};

export const cleanupVideoResources = (videoElement: HTMLVideoElement): void => {
  if (videoElement.srcObject) {
    const stream = videoElement.srcObject as MediaStream;
    stream.getTracks().forEach(track => track.stop());
    videoElement.srcObject = null;
  }
  
  // Clear any pending frame callbacks
  videoElement.style.willChange = 'auto';
};

export const getOptimalVideoConstraints = () => {
  const isLowPowerMode = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
  const connection = (navigator as any).connection;
  const isSlowConnection = connection && 
    (connection.effectiveType === 'slow-2g' || 
     connection.effectiveType === '2g' ||
     connection.effectiveType === '3g');
  
  if (isLowPowerMode || isSlowConnection) {
    return {
      width: { ideal: 1280, max: 1600 },
      height: { ideal: 720, max: 900 },
      frameRate: { ideal: 24, max: 30 }
    };
  }
  
  return {
    width: { ideal: 1600, max: 1920 },
    height: { ideal: 900, max: 1080 },
    frameRate: { ideal: 30 }
  };
};