/**
 * Debug script to test OCR system components
 * Run this in the browser console to diagnose issues
 */

async function debugOcrSystem() {
  console.log('🔍 Starting OCR System Debug...');
  
  try {
    // Test 1: Check if ocrServiceWrapper is available
    console.log('1. Testing ocrServiceWrapper availability...');
    if (typeof window.ocrServiceWrapper !== 'undefined') {
      console.log('✅ ocrServiceWrapper is available');
    } else {
      console.error('❌ ocrServiceWrapper is not available on window');
      return;
    }
    
    // Test 2: Try to initialize
    console.log('2. Testing initialization...');
    await window.ocrServiceWrapper.initialize();
    console.log('✅ Initialization successful');
    
    // Test 3: Health check
    console.log('3. Testing health status...');
    const health = await window.ocrServiceWrapper.getHealthStatus();
    console.log('✅ Health check:', health);
    
    // Test 4: Test analytics
    console.log('4. Testing analytics...');
    const analytics = window.ocrServiceWrapper.getAnalytics();
    console.log('✅ Analytics:', analytics);
    
    // Test 5: Test strategy recommendation
    console.log('5. Testing strategy recommendation...');
    const strategy = await window.ocrServiceWrapper.getRecommendedStrategy();
    console.log('✅ Recommended strategy:', strategy);
    
    console.log('🎉 All OCR system tests passed!');
    return { health, analytics, strategy };
    
  } catch (error) {
    console.error('❌ OCR System Debug failed:', error);
    throw error;
  }
}

// Test environment variables
function testEnvironment() {
  console.log('🌍 Environment Variables:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('REACT_APP_GOOGLE_VISION_API_KEY:', process.env.REACT_APP_GOOGLE_VISION_API_KEY ? 'SET' : 'NOT SET');
  console.log('REACT_APP_MAX_GOOGLE_VISION_REQUESTS:', process.env.REACT_APP_MAX_GOOGLE_VISION_REQUESTS);
}

// Make functions available in browser console
if (typeof window !== 'undefined') {
  window.debugOcrSystem = debugOcrSystem;
  window.testEnvironment = testEnvironment;
}

console.log('🔧 Debug functions loaded. Run:');
console.log('- debugOcrSystem() to test OCR system');
console.log('- testEnvironment() to check environment variables');