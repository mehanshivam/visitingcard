/**
 * OCR System Test Utilities
 * Used to verify the hybrid OCR system is working correctly
 */

import { ocrServiceWrapper } from '../services/ocrServiceWrapper';

export const testOcrSystemHealth = async () => {
  console.log('🔍 Testing OCR System Health...');
  
  try {
    // Initialize the system
    await ocrServiceWrapper.initialize();
    
    // Get health status
    const health = await ocrServiceWrapper.getHealthStatus();
    console.log('📊 System Health:', health);
    
    // Get analytics
    const analytics = ocrServiceWrapper.getAnalytics();
    console.log('📈 Analytics:', analytics);
    
    // Get recommended strategy
    const strategy = await ocrServiceWrapper.getRecommendedStrategy();
    console.log('🎯 Recommended Strategy:', strategy);
    
    // Get usage summary
    const usage = ocrServiceWrapper.getUsageSummary();
    console.log('💰 Usage Summary:', usage);
    
    console.log('✅ OCR System Health Check Complete');
    return { health, analytics, strategy, usage };
    
  } catch (error) {
    console.error('❌ OCR System Health Check Failed:', error);
    throw error;
  }
};

// Export for browser console testing
if (typeof window !== 'undefined') {
  (window as any).testOcrSystemHealth = testOcrSystemHealth;
  (window as any).ocrServiceWrapper = ocrServiceWrapper;
}