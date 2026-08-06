/**
 * Node.js Automated Test Runner for CampusAuthGuard
 * Evaluates similarity scoring engine and domain verification logic against test vectors.
 */

const DomainChecker = require('../extension/src/scanner/domainChecker.js');
const SimilarityEngine = require('../extension/src/scanner/similarityEngine.js');
const RiskClassifier = require('../extension/src/scanner/riskClassifier.js');

const officialFingerprint = {
  portalId: "st-vincent-erp",
  collegeName: "St. Vincent Pallotti College of Engineering and Technology",
  officialDomains: ["stvincentngp.edu.in", "erp.stvincentngp.edu.in", "localhost", "127.0.0.1"],
  pageTitle: "log-CAS_ERP",
  brandKeywords: ["St. Vincent Pallotti", "Student Login", "ERP Portal", "Student Portal", "College Administration System"],
  formFingerprint: { passwordFieldCount: 1, emailFieldCount: 0, inputCount: 14, buttonTexts: ["Login", "Reset"] },
  domFingerprint: { inputTypes: ["hidden", "text", "password", "submit"], formAction: "./login.aspx", formMethod: "POST" },
  visualFingerprint: { dominantColors: ["#ffffff"], headingText: "College Administration System" }
};

const testVectors = [
  {
    name: "1. Official ERP Portal Login",
    url: "https://erp.stvincentngp.edu.in/login.aspx",
    expectedLevel: "SAFE",
    features: {
      hasPasswordField: true,
      formFeatures: { passwordFieldCount: 1, emailFieldCount: 0, inputCount: 14, buttonTexts: ["Login", "Reset"] },
      domFeatures: { inputTypes: ["hidden", "text", "password", "submit"], formAction: "./login.aspx", formMethod: "POST" },
      textFeatures: { pageTitle: "log-CAS_ERP", visibleText: "St. Vincent Pallotti College Administration System Username Password Login Reset" },
      visualFeatures: { dominantColors: ["#ffffff"], headingText: "College Administration System" }
    }
  },
  {
    name: "2. Exact Cloned Phishing Page",
    url: "https://stvincentngp-erp-login.netlify.app/login.aspx",
    expectedLevel: "DANGEROUS",
    features: {
      hasPasswordField: true,
      formFeatures: { passwordFieldCount: 1, emailFieldCount: 0, inputCount: 14, buttonTexts: ["Login", "Reset"] },
      domFeatures: { inputTypes: ["hidden", "text", "password", "submit"], formAction: "./login.aspx", formMethod: "POST" },
      textFeatures: { pageTitle: "log-CAS_ERP", visibleText: "St. Vincent Pallotti College Administration System Username Password Login Reset" },
      visualFeatures: { dominantColors: ["#ffffff"], headingText: "College Administration System" }
    }
  },
  {
    name: "3. Subdomain Spoofing Attack",
    url: "https://erp.stvincentngp.edu.in.phishing-server.com/login.aspx",
    expectedLevel: "DANGEROUS",
    features: {
      hasPasswordField: true,
      formFeatures: { passwordFieldCount: 1, emailFieldCount: 0, inputCount: 14, buttonTexts: ["Login", "Reset"] },
      domFeatures: { inputTypes: ["hidden", "text", "password", "submit"], formAction: "./login.aspx", formMethod: "POST" },
      textFeatures: { pageTitle: "log-CAS_ERP", visibleText: "St. Vincent Pallotti College Administration System Username Password Login Reset" },
      visualFeatures: { dominantColors: ["#ffffff"], headingText: "College Administration System" }
    }
  },
  {
    name: "4. Modified Lookalike Page",
    url: "https://student-portal-auth.com/login",
    expectedLevel: "SUSPICIOUS",
    features: {
      hasPasswordField: true,
      formFeatures: { passwordFieldCount: 1, emailFieldCount: 0, inputCount: 14, buttonTexts: ["Login"] },
      domFeatures: { inputTypes: ["text", "password", "submit"] },
      textFeatures: { pageTitle: "Student Login Portal", visibleText: "St. Vincent Pallotti Student Access Portal Roll No Password Login" },
      visualFeatures: { dominantColors: ["#0f172a"], headingText: "Student Login" }
    }
  },
  {
    name: "5. Generic Unrelated Login Page",
    url: "https://cloud-sync.io/login",
    expectedLevel: "UNRELATED",
    features: {
      hasPasswordField: true,
      formFeatures: { passwordFieldCount: 1, emailFieldCount: 0, inputCount: 2, buttonTexts: ["Access Cloud"] },
      domFeatures: { inputTypes: ["text", "password"] },
      textFeatures: { pageTitle: "CloudSync App Login", visibleText: "CloudSync Dashboard Account Email CloudSync Key Access Cloud" },
      visualFeatures: { dominantColors: ["#111827"], headingText: "CloudSync Dashboard" }
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
