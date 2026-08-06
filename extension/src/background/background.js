/**
 * Background Service Worker: background.js
 * Manages official fingerprints, listens for content script scan events, runs scoring pipeline,
 * and updates Chrome extension badges and storage.
 */

// Import Scanner Modules if running in ES Module or background context
try {
  importScripts(
    '../scanner/domainChecker.js',
    '../scanner/similarityEngine.js',
    '../scanner/riskClassifier.js'
  );
} catch (e) {
  // ESM / Bundler fallback
}

// Default Official Fingerprint Fallback
const DEFAULT_FINGERPRINT = {
  portalId: "abc-college-erp",
  portalName: "ABC College ERP Portal",
  officialDomains: ["college.edu", "erp.college.edu", "mail.college.edu", "localhost", "127.0.0.1"],
  pageTitle: "ABC College ERP Login - Student & Staff Portal",
  brandKeywords: ["ABC College", "College of Technology", "Student Login", "ERP Portal", "Roll Number", "Sign In"],
  formFingerprint: {
    passwordFieldCount: 1,
    emailOrTextFieldCount: 1,
    inputCount: 3,
    buttonTexts: ["Login", "Sign In to ERP"],
    placeholders: ["Enter Roll No / Email", "Enter Password"]
  },
  domFingerprint: {
    tagSequence: ["div", "img", "h2", "form", "input", "input", "button"],
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

let currentFingerprint = DEFAULT_FINGERPRINT;

// Load fingerprint.json from extension storage on startup
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
  try {
    fetch(chrome.runtime.getURL('fingerprints/fingerprint.json'))
      .then(res => res.json())
      .then(fp => {
        if (fp && fp.officialDomains) {
          currentFingerprint = fp;
          console.log("Loaded default college fingerprint:", fp.collegeName || fp.portalName);
        }
      })
      .catch(() => {});
  } catch (e) {}
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
        currentFingerprint = request.fingerprint;
        sendResponse({ status: 'success' });
      }
    }
  });
}

/**
 * Core Processing Pipeline
 */
function processScan(features) {
  const domainRes = DomainChecker.checkDomain(features.url, currentFingerprint.officialDomains);
  const similarityRes = SimilarityEngine.calculateSimilarity(features, currentFingerprint);
  const riskRes = RiskClassifier.classifyRisk(domainRes, similarityRes, features.hasPasswordField);

  // Attach full similarity breakdown to risk object
  riskRes.similarityResult = similarityRes;
  riskRes.domainResult = domainRes;

  return {
    riskAssessment: riskRes,
    officialDomain: currentFingerprint.officialDomains[0] || "erp.college.edu",
    portalName: currentFingerprint.portalName || "ABC College ERP",
    features
  };
}

/**
 * Helper: Updates Browser Badge Text and Background Color
 */
function updateBadge(tabId, risk) {
  if (!chrome.action) return;

  const text = risk.badgeText || 'OK';
  const color = risk.badgeColor || '#10b981';

  chrome.action.setBadgeText({ tabId, text });
  chrome.action.setBadgeBackgroundColor({ tabId, color });
}

// Expose scanner globally for unit testing / Node environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    processScan,
    DEFAULT_FINGERPRINT
  };
}
