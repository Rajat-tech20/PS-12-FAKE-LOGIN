/**
 * Background Service Worker: background.js
 * Manages multi-portal reference fingerprints, listens for content script scan events,
 * runs multi-fingerprint scoring pipeline, and updates Chrome extension badges.
 */

// Import Scanner Modules
try {
  importScripts(
    '../scanner/domainChecker.js',
    '../scanner/similarityEngine.js',
    '../scanner/riskClassifier.js'
  );
} catch (e) {
  // ESM / Bundler fallback
}

// 1. St. Vincent Pallotti College Reference Fingerprint
const ST_VINCENT_FINGERPRINT = {
  portalId: "st-vincent-erp",
  portalName: "College Administration System (CAS ERP)",
  collegeName: "St. Vincent Pallotti College of Engineering and Technology",
  officialDomains: ["stvincentngp.edu.in", "erp.stvincentngp.edu.in", "localhost", "127.0.0.1"],
  pageTitle: "log-CAS_ERP",
  brandKeywords: ["St. Vincent Pallotti", "Student Login", "ERP Portal", "Student Portal", "College Administration System"],
  formFingerprint: {
    passwordFieldCount: 1,
    emailFieldCount: 0,
    inputCount: 14,
    buttonTexts: ["Login", "Reset"],
    placeholders: ["Username", "Password"]
  },
  domFingerprint: {
    inputTypes: ["hidden", "text", "password", "submit"],
    formAction: "./login.aspx",
    formMethod: "POST"
  },
  visualFingerprint: {
    layoutType: "centered-login-card",
    dominantColors: ["#ffffff"],
    logoAltText: "",
    headingText: "College Administration System"
  }
};

// 2. ABC College Reference Fingerprint
const ABC_COLLEGE_FINGERPRINT = {
  portalId: "abc-college-erp",
  portalName: "ABC College ERP Portal",
  collegeName: "ABC College of Technology",
  officialDomains: ["college.edu", "erp.college.edu"],
  pageTitle: "ABC College ERP Login - Student & Staff Portal",
  brandKeywords: ["ABC College", "College of Technology", "Student Login", "ERP Portal", "Roll Number", "Sign In to ERP"],
  formFingerprint: {
    passwordFieldCount: 1,
    emailOrTextFieldCount: 1,
    inputCount: 3,
    buttonTexts: ["Sign In to ERP"],
    placeholders: ["Enter Roll No / Email", "Enter Password"]
  },
  domFingerprint: {
    tagSequence: ["div", "h2", "form", "input", "input", "button"],
    inputTypes: ["text", "password", "submit"],
    hasLogo: true,
    hasForgotPasswordLink: true
  },
  visualFingerprint: {
    dominantColors: ["#003366", "#ffffff", "#f4f6f9"],
    logoAltText: "ABC College Logo",
    headingText: "ABC College ERP Portal"
  }
};

let knownFingerprints = [ST_VINCENT_FINGERPRINT, ABC_COLLEGE_FINGERPRINT];

// Load fingerprint JSONs dynamically from extension package
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
  const loadFp = (file) => {
    fetch(chrome.runtime.getURL(`fingerprints/${file}`))
      .then(res => res.json())
      .then(fp => {
        if (fp && fp.officialDomains) {
          const idx = knownFingerprints.findIndex(f => f.portalId === fp.portalId || f.portalName === fp.portalName);
          if (idx >= 0) knownFingerprints[idx] = fp;
          else knownFingerprints.push(fp);
        }
      })
      .catch(() => {});
  };

  loadFp('fingerprint.json');
  loadFp('abc-college-erp.json');
}

/**
 * Message Handler from Content Script & Popup
 */
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'SCAN_PAGE') {
      const pageFeatures = request.payload || {};
      const scanOutput = processScan(pageFeatures);

      // Update Extension Badge
      if (sender.tab && sender.tab.id) {
        updateBadge(sender.tab.id, scanOutput.riskAssessment);
      }

      // Store latest scan in extension storage
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({
          latestScan: {
            ...scanOutput,
            timestamp: new Date().toISOString()
          }
        });
      }

      sendResponse(scanOutput);
    } else if (request.action === 'GET_LATEST_SCAN') {
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['latestScan'], (res) => {
          sendResponse(res.latestScan || null);
        });
        return true; // Async response
      }
    } else if (request.action === 'SET_PORTAL_FINGERPRINT') {
      if (request.fingerprint) {
        knownFingerprints.unshift(request.fingerprint);
        sendResponse({ status: 'success' });
      }
    }
  });
}

/**
 * Multi-Fingerprint Processing Pipeline
 * Evaluates active page against ALL registered college fingerprints and finds highest risk / match
 */
function processScan(features) {
  let bestScanResult = null;
  let highestScore = -1;

  for (const fp of knownFingerprints) {
    const domainRes = DomainChecker.checkDomain(features.url, fp.officialDomains);
    const similarityRes = SimilarityEngine.calculateSimilarity(features, fp);
    const riskRes = RiskClassifier.classifyRisk(domainRes, similarityRes, features.hasPasswordField);

    riskRes.similarityResult = similarityRes;
    riskRes.domainResult = domainRes;

    // Weight score: official domain or high-risk clone gets priority evaluation
    let effectiveRank = similarityRes.finalScore;
    if (domainRes.isOfficial) effectiveRank += 200;
    else if (riskRes.shouldWarn) effectiveRank += 100;

    if (effectiveRank > highestScore) {
      highestScore = effectiveRank;
      bestScanResult = {
        riskAssessment: riskRes,
        officialDomain: fp.officialDomains[0] || "erp.college.edu",
        portalName: fp.portalName || fp.collegeName || "College ERP Portal",
        features
      };
    }
  }

  return bestScanResult || {
    riskAssessment: { level: 'UNRELATED', category: 'NEUTRAL', similarityScore: 0, shouldWarn: false },
    officialDomain: "stvincentngp.edu.in",
    portalName: "College Portal",
    features
  };
}

/**
 * Helper: Updates Browser Badge Text and Background Color
 */
function updateBadge(tabId, risk) {
  if (!chrome.action) return;

  const text = risk.badgeText !== undefined ? risk.badgeText : (risk.level === 'SAFE' ? 'SAFE' : risk.shouldWarn ? 'UNSAFE' : '');
  const color = risk.badgeColor || (risk.level === 'SAFE' ? '#10b981' : '#ef4444');

  chrome.action.setBadgeText({ tabId, text });
  chrome.action.setBadgeBackgroundColor({ tabId, color });
}

// Expose scanner globally for unit testing / Node environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    processScan,
    knownFingerprints
  };
}
