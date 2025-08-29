/**
 * Test Dataset for Enhanced Field Parsing Algorithms (Story 2.1)
 * Comprehensive business card samples to test parsing accuracy and identify gaps
 */

export interface TestCase {
  id: string;
  name: string;
  rawText: string;
  expected: {
    name?: string;
    title?: string;
    company?: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
      full?: string;
    };
  };
  parseChallenge: string; // What makes this test case difficult
  confidenceTargets: {
    email?: number;
    phone?: number;
    name?: number;
    company?: number;
    title?: number;
    website?: number;
    address?: number;
  };
}

export const fieldParsingTestData: TestCase[] = [
  // === EMAIL DETECTION CHALLENGES ===
  {
    id: 'email-01',
    name: 'Standard email format',
    rawText: 'John Smith\nSenior Developer\nTech Corp\njohn.smith@techcorp.com\n(555) 123-4567',
    expected: {
      name: 'John Smith',
      title: 'Senior Developer', 
      company: 'Tech Corp',
      phone: '(555) 123-4567',
      email: 'john.smith@techcorp.com',
      website: 'www.techcorp.com'
    },
    parseChallenge: 'Standard case - should achieve high accuracy',
    confidenceTargets: { email: 95, phone: 85, name: 80, company: 75 }
  },
  {
    id: 'email-02', 
    name: 'International domain email',
    rawText: 'Sarah Johnson\nMarketing Director\nGlobal Solutions Ltd\nsarah.johnson@globalsolutions.co.uk\n+44 20 7946 0958',
    expected: {
      name: 'Sarah Johnson',
      title: 'Marketing Director',
      company: 'Global Solutions Ltd', 
      email: 'sarah.johnson@globalsolutions.co.uk',
      phone: '+44 20 7946 0958',
      website: 'www.globalsolutions.co.uk'
    },
    parseChallenge: 'International domain and phone format',
    confidenceTargets: { email: 90, phone: 80, name: 75, company: 80 }
  },
  {
    id: 'email-03',
    name: 'Short domain email',
    rawText: 'Mike Chen\nCEO\nAI Corp\nmike@ai.co\n650-555-0123',
    expected: {
      name: 'Mike Chen',
      title: 'CEO',
      company: 'AI Corp',
      email: 'mike@ai.co',
      phone: '650-555-0123', 
      website: 'www.ai.co'
    },
    parseChallenge: 'Very short domain (.co)',
    confidenceTargets: { email: 88, phone: 85, name: 80, company: 75 }
  },
  {
    id: 'email-04',
    name: 'Multiple emails on card',
    rawText: 'Lisa Rodriguez\nBusiness Development\nTech Solutions Inc\nlisa.rodriguez@techsolutions.com\nlrodriguez@personal.net\n(408) 555-7890',
    expected: {
      name: 'Lisa Rodriguez',
      title: 'Business Development', 
      company: 'Tech Solutions Inc',
      email: 'lisa.rodriguez@techsolutions.com', // Should pick business email
      phone: '(408) 555-7890',
      website: 'www.techsolutions.com'
    },
    parseChallenge: 'Multiple emails - should prioritize business email',
    confidenceTargets: { email: 85, phone: 85, name: 80, company: 80 }
  },

  // === PHONE NUMBER DETECTION CHALLENGES ===
  {
    id: 'phone-01',
    name: 'International phone format',
    rawText: 'David Kim\nSoftware Architect\nInnovate LLC\ndavid.kim@innovate.com\n+1 (415) 555-0199',
    expected: {
      name: 'David Kim',
      title: 'Software Architect',
      company: 'Innovate LLC',
      email: 'david.kim@innovate.com',
      phone: '+1 (415) 555-0199',
      website: 'www.innovate.com'
    },
    parseChallenge: 'International format with country code',
    confidenceTargets: { email: 95, phone: 90, name: 80, company: 85 }
  },
  {
    id: 'phone-02', 
    name: 'Extension number',
    rawText: 'Jennifer Wu\nProject Manager\nGlobal Enterprises\njennifer.wu@globalent.com\n(212) 555-0156 ext. 401',
    expected: {
      name: 'Jennifer Wu',
      title: 'Project Manager',
      company: 'Global Enterprises',
      email: 'jennifer.wu@globalent.com',
      phone: '(212) 555-0156 ext. 401',
      website: 'www.globalent.com'
    },
    parseChallenge: 'Phone with extension',
    confidenceTargets: { email: 95, phone: 85, name: 80, company: 75 }
  },
  {
    id: 'phone-03',
    name: 'Dot-separated phone',
    rawText: 'Robert Martinez\nCTO\nStartup Ventures\nrobert@startup.ventures\n555.123.4567',
    expected: {
      name: 'Robert Martinez',
      title: 'CTO', 
      company: 'Startup Ventures',
      email: 'robert@startup.ventures',
      phone: '555.123.4567',
      website: 'www.startup.ventures'
    },
    parseChallenge: 'Dot-separated phone format',
    confidenceTargets: { email: 90, phone: 80, name: 80, company: 75 }
  },

  // === NAME DETECTION CHALLENGES ===
  {
    id: 'name-01',
    name: 'Name with middle initial',
    rawText: 'Amanda J. Foster\nSenior Analyst\nData Insights Corp\namanda.foster@datainsights.com\n(503) 555-0189',
    expected: {
      name: 'Amanda J. Foster',
      title: 'Senior Analyst',
      company: 'Data Insights Corp',
      email: 'amanda.foster@datainsights.com', 
      phone: '(503) 555-0189',
      website: 'www.datainsights.com'
    },
    parseChallenge: 'Name with middle initial',
    confidenceTargets: { email: 95, phone: 85, name: 85, company: 80 }
  },
  {
    id: 'name-02',
    name: 'Hyphenated last name',
    rawText: 'Maria Santos-Johnson\nHR Director\nPeople Solutions LLC\nmaria.santos-johnson@peoplesolutions.com\n(619) 555-0176',
    expected: {
      name: 'Maria Santos-Johnson',
      title: 'HR Director',
      company: 'People Solutions LLC',
      email: 'maria.santos-johnson@peoplesolutions.com',
      phone: '(619) 555-0176',
      website: 'www.peoplesolutions.com'
    },
    parseChallenge: 'Hyphenated last name',
    confidenceTargets: { email: 90, phone: 85, name: 80, company: 85 }
  },
  {
    id: 'name-03', 
    name: 'Name mixed with title',
    rawText: 'CEO Thomas Wilson\nTech Innovations Inc\nthomas.wilson@techinnovations.com\n(702) 555-0143',
    expected: {
      name: 'Thomas Wilson',
      title: 'CEO',
      company: 'Tech Innovations Inc',
      email: 'thomas.wilson@techinnovations.com',
      phone: '(702) 555-0143',
      website: 'www.techinnovations.com'
    },
    parseChallenge: 'Title prefix mixed with name',
    confidenceTargets: { email: 95, phone: 85, name: 70, company: 80 }
  },

  // === COMPANY DETECTION CHALLENGES ===  
  {
    id: 'company-01',
    name: 'Company with business suffix',
    rawText: 'Kevin Chang\nLead Developer\nQuantum Computing Solutions LLC\nkevin.chang@quantumcs.com\n(408) 555-0167',
    expected: {
      name: 'Kevin Chang',
      title: 'Lead Developer',
      company: 'Quantum Computing Solutions LLC',
      email: 'kevin.chang@quantumcs.com',
      phone: '(408) 555-0167',
      website: 'www.quantumcs.com'
    },
    parseChallenge: 'Long company name with LLC suffix',
    confidenceTargets: { email: 95, phone: 85, name: 80, company: 90 }
  },
  {
    id: 'company-02',
    name: 'Company without suffix',
    rawText: 'Elena Vasquez\nCreative Director\nBright Ideas\nelena@brightideas.design\n(303) 555-0154',
    expected: {
      name: 'Elena Vasquez',
      title: 'Creative Director', 
      company: 'Bright Ideas',
      email: 'elena@brightideas.design',
      phone: '(303) 555-0154',
      website: 'www.brightideas.design'
    },
    parseChallenge: 'Company name without business suffix',
    confidenceTargets: { email: 90, phone: 85, name: 80, company: 65 }
  },
  {
    id: 'company-03',
    name: 'Company vs department confusion',
    rawText: 'James Taylor\nSales Manager\nSales Department\nGlobal Corp Inc\njames.taylor@globalcorp.com\n(214) 555-0132',
    expected: {
      name: 'James Taylor',
      title: 'Sales Manager',
      company: 'Global Corp Inc', // Should pick actual company, not department
      email: 'james.taylor@globalcorp.com',
      phone: '(214) 555-0132',
      website: 'www.globalcorp.com'
    },
    parseChallenge: 'Department vs company name confusion',
    confidenceTargets: { email: 95, phone: 85, name: 80, company: 75 }
  },

  // === MIXED PARSING CHALLENGES ===
  {
    id: 'mixed-01',
    name: 'Scrambled field order',
    rawText: 'VP Engineering\nRachel Green\ncloud@nexttech.io\nNext Technology Corp\n+1-650-555-0198',
    expected: {
      name: 'Rachel Green',
      title: 'VP Engineering',
      company: 'Next Technology Corp',
      email: 'cloud@nexttech.io',
      phone: '+1-650-555-0198',
      website: 'www.nexttech.io'
    },
    parseChallenge: 'Fields in non-standard order',
    confidenceTargets: { email: 90, phone: 85, name: 75, company: 80 }
  },
  {
    id: 'mixed-02',
    name: 'OCR artifacts and noise',
    rawText: 'Dr. Susan Miller\nChief Medical 0fficer\nHealthTech Solutions lnc\ns.miller@healthtech.c0m\n(415) 555-Ol87',
    expected: {
      name: 'Susan Miller', // Should remove Dr. title prefix
      title: 'Chief Medical Officer', // Should fix OCR error 0->O
      company: 'HealthTech Solutions Inc', // Should fix OCR error l->I  
      email: 's.miller@healthtech.com', // Should fix OCR error 0->o
      phone: '(415) 555-0187', // Should fix OCR error Ol->01
      website: 'www.healthtech.com'
    },
    parseChallenge: 'OCR errors and title prefixes',
    confidenceTargets: { email: 80, phone: 75, name: 70, company: 75 }
  },
  {
    id: 'mixed-03',
    name: 'Minimal information card',
    rawText: 'Alex Johnson\nalex@consulting.pro\n555-0123',
    expected: {
      name: 'Alex Johnson',
      email: 'alex@consulting.pro',
      phone: '555-0123',
      website: 'www.consulting.pro'
    },
    parseChallenge: 'Missing company and title information',
    confidenceTargets: { email: 95, phone: 80, name: 85 }
  },
  {
    id: 'mixed-04',
    name: 'Non-standard formatting',
    rawText: 'NICOLE ANDERSON | MARKETING SPECIALIST\nBRAND SOLUTIONS GROUP LLC\nNICOLE.ANDERSON@BRANDSOLUTIONS.COM\n(310) 555-0165',
    expected: {
      name: 'Nicole Anderson', // Should handle caps and clean formatting
      title: 'Marketing Specialist',
      company: 'Brand Solutions Group LLC', 
      email: 'nicole.anderson@brandsolutions.com',
      phone: '(310) 555-0165',
      website: 'www.brandsolutions.com'
    },
    parseChallenge: 'All caps text with pipe separator',
    confidenceTargets: { email: 90, phone: 85, name: 75, company: 85 }
  }
];

// Test performance analysis utilities
export interface ParsingGap {
  fieldType: 'email' | 'phone' | 'name' | 'company' | 'title' | 'website';
  issue: string;
  testCases: string[]; // IDs of affected test cases
  expectedAccuracy: number;
  priority: 'high' | 'medium' | 'low';
}

export const identifyParsingGaps = (testResults: any[]): ParsingGap[] => {
  const gaps: ParsingGap[] = [];
  
  // Analyze email detection gaps
  const emailFailures = testResults.filter(r => !r.actual.email || r.actual.email !== r.expected.email);
  if (emailFailures.length > 0) {
    gaps.push({
      fieldType: 'email',
      issue: 'International domains and OCR artifacts affecting email detection',
      testCases: emailFailures.map(f => f.testId),
      expectedAccuracy: 85,
      priority: 'high'
    });
  }
  
  // Analyze phone detection gaps  
  const phoneFailures = testResults.filter(r => !r.actual.phone || r.actual.phone !== r.expected.phone);
  if (phoneFailures.length > 0) {
    gaps.push({
      fieldType: 'phone',
      issue: 'International formats and extensions not properly handled',
      testCases: phoneFailures.map(f => f.testId),
      expectedAccuracy: 80,
      priority: 'high' 
    });
  }
  
  // Analyze name detection gaps
  const nameFailures = testResults.filter(r => !r.actual.name || r.actual.name !== r.expected.name);
  if (nameFailures.length > 0) {
    gaps.push({
      fieldType: 'name',
      issue: 'Title prefixes and mixed formatting affecting name extraction',
      testCases: nameFailures.map(f => f.testId),
      expectedAccuracy: 75,
      priority: 'high'
    });
  }
  
  // Analyze company detection gaps
  const companyFailures = testResults.filter(r => !r.actual.company || r.actual.company !== r.expected.company);
  if (companyFailures.length > 0) {
    gaps.push({
      fieldType: 'company', 
      issue: 'Department vs company confusion and missing business keywords',
      testCases: companyFailures.map(f => f.testId),
      expectedAccuracy: 70,
      priority: 'medium'
    });
  }
  
  return gaps;
};

// Export test runner utility
export const runFieldParsingTests = async (ocrService: any) => {
  const results = [];
  
  for (const testCase of fieldParsingTestData) {
    try {
      // Mock the OCR result to test parsing logic
      const ocrResult = {
        text: testCase.rawText,
        confidence: 85,
        words: [] // Could be enhanced with mock word data
      };
      
      // Process using the parseContactDataBasic method
      const actual = ocrService.parseContactDataBasic ? 
        ocrService.parseContactDataBasic(ocrResult) : 
        await ocrService.processImage(testCase.rawText);
        
      const result = {
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
        passed: JSON.stringify(actual) === JSON.stringify(testCase.expected),
        challenge: testCase.parseChallenge
      };
      
      results.push(result);
      
    } catch (error) {
      results.push({
        testId: testCase.id,
        testName: testCase.name,
        error: error instanceof Error ? error.message : String(error),
        passed: false
      });
    }
  }
  
  return results;
};