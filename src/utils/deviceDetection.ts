export const isMobileDevice = (): boolean => {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export const isAndroid = (): boolean => {
  return /Android/.test(navigator.userAgent);
};

export const isTouchDevice = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export const getViewportDimensions = () => {
  return {
    width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
    height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
  };
};

export const getMobileOptimizedConstraints = () => {
  const viewport = getViewportDimensions();
  const isMobile = isMobileDevice();
  
  if (!isMobile) {
    return {
      width: { ideal: 1920 },
      height: { ideal: 1080 }
    };
  }
  
  // Mobile optimizations
  if (viewport.width < 768) {
    // Small mobile screens
    return {
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 }
    };
  } else {
    // Larger mobile screens (tablets)
    return {
      width: { ideal: 1600, max: 1920 },
      height: { ideal: 900, max: 1080 }
    };
  }
};