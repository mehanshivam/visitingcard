# 9. Monitoring & Observability

## 9.1 Application Monitoring

```typescript
// Custom metrics collection
import { createPrometheusMetrics } from './metrics';

const metrics = createPrometheusMetrics();

class OCRService {
  async processImage(imageBuffer: Buffer): Promise<OCRResult> {
    const timer = metrics.ocrProcessingTime.startTimer();
    
    try {
      const result = await this.performOCR(imageBuffer);
      
      metrics.ocrSuccessCount.inc();
      metrics.ocrAccuracy.observe(result.confidence);
      
      return result;
    } catch (error) {
      metrics.ocrErrorCount.inc();
      throw error;
    } finally {
      timer();
    }
  }
}

// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      externalAPIs: await checkExternalAPIs()
    }
  };
  
  res.json(health);
});
```

## 9.2 Key Metrics Dashboard

```yaml
Technical Metrics:
  - API response times (p50, p95, p99)
  - Error rates by endpoint
  - OCR accuracy and processing time
  - Database query performance
  - Cache hit rates
  - External API latency

Business Metrics:
  - Daily/monthly active users
  - Scan completion rates
  - Contact enrichment success rates
  - Feature adoption metrics
  - User retention cohorts

Alerts:
  - Error rate > 5%
  - Response time > 2s
  - OCR accuracy < 80%
  - Database connections > 80%
  - External API failures
```
