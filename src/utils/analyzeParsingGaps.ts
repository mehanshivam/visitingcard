/**
 * Parsing Gap Analysis Tool for Story 2.1
 * Analyzes current OCR service performance against test dataset
 */

import { ocrService, ContactData, OCRResult } from '../services/ocrService';
import { fieldParsingTestData, identifyParsingGaps, TestCase } from './fieldParsingTestData';

export interface TestResult {
  testId: string;
  testName: string;
  expected: TestCase['expected'];
  actual: Partial<ContactData>;
  confidence: ContactData['fieldConfidences'];
  passed: boolean;
  fieldAccuracies: {
    email?: boolean;
    phone?: boolean; 
    name?: boolean;
    company?: boolean;
    title?: boolean;
    website?: boolean;
  };
  challenge: string;
  errors?: string[];
}

export interface AccuracyMetrics {
  email: { correct: number; total: number; accuracy: number };
  phone: { correct: number; total: number; accuracy: number };
  name: { correct: number; total: number; accuracy: number };
  company: { correct: number; total: number; accuracy: number };
  title: { correct: number; total: number; accuracy: number };
  website: { correct: number; total: number; accuracy: number };
  overall: { correct: number; total: number; accuracy: number };
}

export interface GapAnalysisReport {
  currentAccuracy: AccuracyMetrics;
  targetAccuracy: {
    email: number; // 85%
    phone: number; // 80% 
    name: number;  // 75%
    company: number; // 70%
  };
  gaps: Array<{
    field: string;
    currentAccuracy: number;
    targetAccuracy: number;
    gap: number;
    priority: 'critical' | 'high' | 'medium' | 'low';
    recommendations: string[];
  }>;
  commonFailurePatterns: Array<{
    pattern: string;
    frequency: number;
    affectedFields: string[];
    examples: string[];
  }>;
  testResults: TestResult[];
}

export const analyzeCurrentParsingGaps = async (): Promise<GapAnalysisReport> => {
  console.log('🔍 Starting parsing gap analysis...');
  
  const testResults: TestResult[] = [];
  const accuracyMetrics: AccuracyMetrics = {
    email: { correct: 0, total: 0, accuracy: 0 },
    phone: { correct: 0, total: 0, accuracy: 0 },
    name: { correct: 0, total: 0, accuracy: 0 },
    company: { correct: 0, total: 0, accuracy: 0 },
    title: { correct: 0, total: 0, accuracy: 0 },
    website: { correct: 0, total: 0, accuracy: 0 },
    overall: { correct: 0, total: 0, accuracy: 0 }
  };

  // Test each case against current parsing logic
  for (const testCase of fieldParsingTestData) {
    console.log(`Testing: ${testCase.name}`);
    
    try {
      // Create mock OCR result to test parsing directly
      const mockOcrResult: OCRResult = {
        text: testCase.rawText,
        confidence: 85,
        words: [] // Basic test without word-level data
      };
      
      // Use the basic parsing method to analyze current performance
      const actual = (ocrService as any).parseContactDataBasic(mockOcrResult);
      
      // Calculate field-level accuracy
      const fieldAccuracies = {
        email: testCase.expected.email ? (actual.email === testCase.expected.email) : true,
        phone: testCase.expected.phone ? (actual.phone === testCase.expected.phone) : true,
        name: testCase.expected.name ? (actual.name === testCase.expected.name) : true,
        company: testCase.expected.company ? (actual.company === testCase.expected.company) : true,
        title: testCase.expected.title ? (actual.title === testCase.expected.title) : true,
        website: testCase.expected.website ? (actual.website === testCase.expected.website) : true
      };
      
      // Update accuracy metrics
      Object.keys(fieldAccuracies).forEach(field => {
        const fieldKey = field as keyof typeof fieldAccuracies;
        const expectedValue = testCase.expected[fieldKey];
        
        if (expectedValue !== undefined) {
          accuracyMetrics[fieldKey].total++;
          if (fieldAccuracies[fieldKey]) {
            accuracyMetrics[fieldKey].correct++;
          }
        }
      });
      
      const overallPassed = Object.values(fieldAccuracies).every(acc => acc === true);
      accuracyMetrics.overall.total++;
      if (overallPassed) {
        accuracyMetrics.overall.correct++;
      }
      
      const result: TestResult = {
        testId: testCase.id,
        testName: testCase.name,
        expected: testCase.expected,
        actual: {
          name: actual.name,
          title: actual.title,
          company: actual.company,
          phone: actual.phone,
          email: actual.email,
          website: actual.website
        },
        confidence: actual.fieldConfidences || {},
        passed: overallPassed,
        fieldAccuracies,
        challenge: testCase.parseChallenge,
        errors: []
      };
      
      // Identify specific errors
      Object.keys(fieldAccuracies).forEach(field => {
        const fieldKey = field as keyof typeof fieldAccuracies;
        if (!fieldAccuracies[fieldKey] && testCase.expected[fieldKey]) {
          result.errors!.push(`${field}: expected "${testCase.expected[fieldKey]}", got "${actual[fieldKey] || 'undefined'}"`);
        }
      });
      
      testResults.push(result);
      
    } catch (error) {
      console.error(`Test ${testCase.id} failed:`, error);
      testResults.push({
        testId: testCase.id,
        testName: testCase.name,
        expected: testCase.expected,
        actual: {},
        confidence: {},
        passed: false,
        fieldAccuracies: {},
        challenge: testCase.parseChallenge,
        errors: [`Test execution failed: ${error instanceof Error ? error.message : String(error)}`]
      });
    }
  }
  
  // Calculate final accuracy percentages
  Object.keys(accuracyMetrics).forEach(field => {
    const fieldKey = field as keyof AccuracyMetrics;
    const metric = accuracyMetrics[fieldKey];
    if (metric.total > 0) {
      metric.accuracy = Math.round((metric.correct / metric.total) * 100);
    }
  });
  
  // Identify gaps against targets
  const targetAccuracy = {
    email: 85,
    phone: 80,
    name: 75,
    company: 70
  };
  
  const gaps = Object.keys(targetAccuracy).map(field => {
    const fieldKey = field as keyof typeof targetAccuracy;
    const current = accuracyMetrics[fieldKey].accuracy;
    const target = targetAccuracy[fieldKey];
    const gap = target - current;
    
    let priority: 'critical' | 'high' | 'medium' | 'low' = 'low';
    if (gap >= 20) priority = 'critical';
    else if (gap >= 10) priority = 'high';
    else if (gap >= 5) priority = 'medium';
    
    return {
      field,
      currentAccuracy: current,
      targetAccuracy: target,
      gap,
      priority,
      recommendations: getFieldRecommendations(field, gap, testResults)
    };
  }).sort((a, b) => b.gap - a.gap);
  
  // Identify common failure patterns
  const commonFailurePatterns = identifyCommonFailures(testResults);
  
  const report: GapAnalysisReport = {
    currentAccuracy: accuracyMetrics,
    targetAccuracy,
    gaps,
    commonFailurePatterns,
    testResults
  };
  
  console.log('✅ Parsing gap analysis completed');
  return report;
};

const getFieldRecommendations = (field: string, gap: number, testResults: TestResult[]): string[] => {
  const recommendations: string[] = [];
  const fieldFailures = testResults.filter(r => !r.fieldAccuracies[field as keyof TestResult['fieldAccuracies']]);
  
  switch (field) {
    case 'email':
      if (gap > 0) {
        recommendations.push('Improve international domain pattern matching (.co.uk, .com.au, etc.)');
        recommendations.push('Add OCR error correction for email addresses (0->o, l->1)');
        if (fieldFailures.some(f => f.testId.includes('multiple'))) {
          recommendations.push('Implement business email prioritization over personal emails');
        }
      }
      break;
      
    case 'phone':
      if (gap > 0) {
        recommendations.push('Add international phone format support (+country codes)');
        recommendations.push('Handle extension numbers (ext., x, #)');
        recommendations.push('Improve OCR digit correction (O->0, I->1, S->5)');
        recommendations.push('Support various separators (dots, spaces, dashes)');
      }
      break;
      
    case 'name':
      if (gap > 0) {
        recommendations.push('Filter out title prefixes (Dr., Mr., CEO, etc.) from names');
        recommendations.push('Handle hyphenated and multi-part names better');
        recommendations.push('Improve name vs company disambiguation');
        recommendations.push('Add fuzzy matching for OCR errors in names');
      }
      break;
      
    case 'company':
      if (gap > 0) {
        recommendations.push('Distinguish between company names and department names');
        recommendations.push('Improve detection of companies without business suffixes');
        recommendations.push('Handle company names with special formatting');
        recommendations.push('Add business entity keyword dictionary expansion');
      }
      break;
  }
  
  return recommendations;
};

const identifyCommonFailures = (testResults: TestResult[]): Array<{
  pattern: string;
  frequency: number;
  affectedFields: string[];
  examples: string[];
}> => {
  const patterns: Map<string, {
    count: number;
    fields: Set<string>;
    examples: Set<string>;
  }> = new Map();
  
  testResults.forEach(result => {
    if (!result.passed && result.errors) {
      result.errors.forEach(error => {
        // Extract pattern from error
        let pattern = '';
        if (error.includes('OCR error') || error.includes('0->') || error.includes('l->')) {
          pattern = 'OCR character misrecognition';
        } else if (error.includes('title') || error.includes('CEO') || error.includes('Dr.')) {
          pattern = 'Title prefix confusion';
        } else if (error.includes('international') || error.includes('+')) {
          pattern = 'International format handling';
        } else if (error.includes('extension') || error.includes('ext')) {
          pattern = 'Phone extension parsing';
        } else if (error.includes('department') || error.includes('vs')) {
          pattern = 'Department vs company confusion';
        } else {
          pattern = 'General parsing failure';
        }
        
        if (!patterns.has(pattern)) {
          patterns.set(pattern, {
            count: 0,
            fields: new Set(),
            examples: new Set()
          });
        }
        
        const data = patterns.get(pattern)!;
        data.count++;
        
        // Extract field from error
        const field = error.split(':')[0];
        data.fields.add(field);
        data.examples.add(`${result.testName}: ${error}`);
      });
    }
  });
  
  return Array.from(patterns.entries())
    .map(([pattern, data]) => ({
      pattern,
      frequency: data.count,
      affectedFields: Array.from(data.fields),
      examples: Array.from(data.examples).slice(0, 3) // Top 3 examples
    }))
    .sort((a, b) => b.frequency - a.frequency);
};

// Export utility for browser console testing
export const runParsingGapAnalysis = async () => {
  try {
    const report = await analyzeCurrentParsingGaps();
    
    console.log('\n📊 PARSING GAP ANALYSIS REPORT');
    console.log('==============================');
    
    console.log('\n🎯 CURRENT ACCURACY:');
    Object.keys(report.currentAccuracy).forEach(field => {
      if (field !== 'overall') {
        const metric = report.currentAccuracy[field as keyof AccuracyMetrics];
        console.log(`  ${field}: ${metric.accuracy}% (${metric.correct}/${metric.total})`);
      }
    });
    console.log(`  OVERALL: ${report.currentAccuracy.overall.accuracy}% (${report.currentAccuracy.overall.correct}/${report.currentAccuracy.overall.total})`);
    
    console.log('\n🎯 GAPS TO TARGET:');
    report.gaps.forEach(gap => {
      console.log(`  ${gap.field.toUpperCase()}: ${gap.currentAccuracy}% → ${gap.targetAccuracy}% (gap: ${gap.gap}%, priority: ${gap.priority})`);
      gap.recommendations.forEach(rec => {
        console.log(`    • ${rec}`);
      });
    });
    
    console.log('\n🔍 COMMON FAILURE PATTERNS:');
    report.commonFailurePatterns.forEach(pattern => {
      console.log(`  ${pattern.pattern} (${pattern.frequency} occurrences)`);
      console.log(`    Fields: ${pattern.affectedFields.join(', ')}`);
      pattern.examples.forEach(ex => console.log(`    - ${ex}`));
    });
    
    return report;
  } catch (error) {
    console.error('Gap analysis failed:', error);
    throw error;
  }
};

// Auto-export for browser testing
if (typeof window !== 'undefined') {
  (window as any).runParsingGapAnalysis = runParsingGapAnalysis;
}