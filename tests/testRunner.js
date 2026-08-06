/**
 * Node.js Automated Test Runner for CampusAuthGuard
 * Evaluates similarity scoring engine and domain verification logic against test vectors.
 */

const DomainChecker = require('../extension/src/scanner/domainChecker.js');
const SimilarityEngine = require('../extension/src/scanner/similarityEngine.js');
const RiskClassifier = require('../extension/src/scanner/riskClassifier.js');

const officialFingerprint = {
  portalId: "abc-college-erp",
  officialDomains: ["college.edu", "erp.college.edu", "localhost", "127.0.0.1"],
  pageTitle: "ABC College ERP Login - Student & Staff Portal",
  brandKeywords: ["ABC College", "College of Technology", "Student Login", "ERP Portal", "Roll Number"],
  formFingerprint: { passwordFieldCount: 1, emailOrTextFieldCount: 1, inputCount: 3, buttonTexts: ["Sign In to ERP"] },
  domFingerprint: { tagSequence: ["div", "h2", "form", "input", "input", "button"], inputTypes: ["text", "password", "submit"], hasLogo: true },
  visualFingerprint: { dominantColors: ["#003366", "#ffffff", "#f4f6f9"], headingText: "ABC College ERP Portal" }
};

const testVectors = [
  {
    name: "1. Official ERP Portal Login",
    url: "https://erp.college.edu/login",
    expectedLevel: "SAFE",
    features: {
      hasPasswordField: true,
      formFeatures: { passwordFieldCount: 1, emailOrTextFieldCount: 1, inputCount: 3, buttonTexts: ["Sign In to ERP"] },
      domFeatures: { tagSequence: ["div", "h2", "form", "input", "input", "button"], inputTypes: ["text", "password", "submit"], hasLogo: true },
      textFeatures: { pageTitle: "ABC College ERP Login - Student & Staff Portal", visibleText: "ABC College ERP Portal Roll Number Email Sign In to ERP" },
      visualFeatures: { dominantColors: ["#003366", "#ffffff", "#f4f6f9"], headingText: "ABC College ERP Portal" }
    }
  },
  {
    name: "2. Exact Cloned Phishing Page",
    url: "https://abc-college-login.netlify.app/login",
    expectedLevel: "DANGEROUS",
    features: {
      hasPasswordField: true,
      formFeatures: { passwordFieldCount: 1, emailOrTextFieldCount: 1, inputCount: 3, buttonTexts: ["Sign In to ERP"] },
      domFeatures: { tagSequence: ["div", "h2", "form", "input", "input", "button"], inputTypes: ["text", "password", "submit"], hasLogo: true },
      textFeatures: { pageTitle: "ABC College ERP Login - Student & Staff Portal", visibleText: "ABC College ERP Portal Roll Number Email Sign In to ERP" },
      visualFeatures: { dominantColors: ["#003366", "#ffffff", "#f4f6f9"], headingText: "ABC College ERP Portal" }
    }
  },
  {
    name: "3. Subdomain Spoofing Attack",
    url: "https://erp.college.edu.phishing-server.com/login",
    expectedLevel: "DANGEROUS",
    features: {
      hasPasswordField: true,
      formFeatures: { passwordFieldCount: 1, emailOrTextFieldCount: 1, inputCount: 3, buttonTexts: ["Sign In to ERP"] },
      domFeatures: { tagSequence: ["div", "h2", "form", "input", "input", "button"], inputTypes: ["text", "password", "submit"], hasLogo: true },
      textFeatures: { pageTitle: "ABC College ERP Login - Student & Staff Portal", visibleText: "ABC College ERP Portal Roll Number Email Sign In to ERP" },
      visualFeatures: { dominantColors: ["#003366", "#ffffff", "#f4f6f9"], headingText: "ABC College ERP Portal" }
    }
  },
  {
    name: "4. Modified Lookalike Page",
    url: "https://student-portal-auth.com/login",
    expectedLevel: "SUSPICIOUS",
    features: {
      hasPasswordField: true,
      formFeatures: { passwordFieldCount: 1, emailOrTextFieldCount: 1, inputCount: 3, buttonTexts: ["Sign In"] },
      domFeatures: { tagSequence: ["div", "h2", "form", "input", "input", "button"], inputTypes: ["text", "password", "submit"], hasLogo: false },
      textFeatures: { pageTitle: "Student Login Portal - Tech Campus", visibleText: "ABC College Student Access Portal Roll No Email Sign In" },
      visualFeatures: { dominantColors: ["#0f172a", "#1e293b"], headingText: "Student Login" }
    }
  },
  {
    name: "5. Generic Unrelated Login Page",
    url: "https://cloud-sync.io/login",
    expectedLevel: "UNRELATED",
    features: {
      hasPasswordField: true,
      formFeatures: { passwordFieldCount: 1, emailOrTextFieldCount: 1, inputCount: 2, buttonTexts: ["Access Cloud"] },
      domFeatures: { tagSequence: ["div", "h3", "form", "input", "input", "button"], inputTypes: ["text", "password"], hasLogo: false },
      textFeatures: { pageTitle: "CloudSync App Login", visibleText: "CloudSync Dashboard Account Email CloudSync Key Access Cloud" },
      visualFeatures: { dominantColors: ["#111827", "#1f2937"], headingText: "CloudSync Dashboard" }
    }
  }
];

function runTests() {
  console.log("=================================================");
  console.log("   CampusAuthGuard Scanner Evaluation Test Suite");
  console.log("=================================================\n");

  let passedCount = 0;

  testVectors.forEach((tv, idx) => {
    const domainRes = DomainChecker.checkDomain(tv.url, officialFingerprint.officialDomains);
    const simRes = SimilarityEngine.calculateSimilarity(tv.features, officialFingerprint);
    const riskRes = RiskClassifier.classifyRisk(domainRes, simRes, tv.features.hasPasswordField);

    const isMatch = riskRes.level === tv.expectedLevel;
    if (isMatch) passedCount++;

    console.log(`[TEST ${idx + 1}] ${tv.name}`);
    console.log(`  - Target URL:       ${tv.url}`);
    console.log(`  - Domain Official:  ${domainRes.isOfficial} (${domainRes.reason})`);
    console.log(`  - Form Similarity:  ${simRes.formScore}%`);
    console.log(`  - DOM Similarity:   ${simRes.domScore}%`);
    console.log(`  - Text Similarity:  ${simRes.textScore}%`);
    console.log(`  - Visual Similarity: ${simRes.visualScore}%`);
    console.log(`  - Composite Score:  ${simRes.finalScore}%`);
    console.log(`  - Classified Risk:  ${riskRes.level} (Expected: ${tv.expectedLevel})`);
    console.log(`  - Evaluation:       ${isMatch ? 'PASSED ✅' : 'FAILED ❌'}\n`);
  });

  console.log("=================================================");
  console.log(` SUMMARY: ${passedCount}/${testVectors.length} Test Cases Passed (${Math.round((passedCount/testVectors.length)*100)}% Accuracy)`);
  console.log("=================================================");
}

runTests();
