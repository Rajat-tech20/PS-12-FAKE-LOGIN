/**
 * Content Script: extractFeatures.js
 * Scans active web page for login forms, extracts DOM, form, text, and visual features,
 * and sends payload to background service worker for similarity scoring and domain verification.
 */

(function () {
  // Prevent duplicate execution
  if (window.__campusAuthGuardLoaded) return;
  window.__campusAuthGuardLoaded = true;

  /**
   * Main Feature Extractor
   */
  function extractPageFeatures() {
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    const hasPasswordField = passwordInputs.length > 0;

    // Locate primary form or container surrounding password input
    let formContainer = null;
    if (hasPasswordField) {
      formContainer = passwordInputs[0].closest('form') || passwordInputs[0].closest('div') || document.body;
    } else {
      formContainer = document.querySelector('form') || document.body;
    }

    // A. URL & Domain Features
    const currentUrl = window.location.href;
    const currentDomain = window.location.hostname;

    // B. Form Features
    const allInputs = formContainer.querySelectorAll('input');
    const inputTypes = Array.from(allInputs).map(i => (i.type || 'text').toLowerCase());
    
    const passwordFieldCount = inputTypes.filter(t => t === 'password').length;
    const emailOrTextFieldCount = inputTypes.filter(t => t === 'text' || t === 'email').length;
    
    // Extract Submit & Button Texts
    const buttons = formContainer.querySelectorAll('button, input[type="submit"], input[type="button"], .btn');
    const buttonTexts = Array.from(buttons).map(b => (b.innerText || b.value || '').trim()).filter(Boolean);

    // Extract Placeholders
    const placeholders = Array.from(allInputs).map(i => i.placeholder || '').filter(Boolean);

    const primaryForm = formContainer.tagName === 'FORM' ? formContainer : formContainer.querySelector('form');
    const formAction = primaryForm ? primaryForm.getAttribute('action') || '' : '';
    const formMethod = primaryForm ? (primaryForm.getAttribute('method') || 'POST').toUpperCase() : 'POST';

    // C. DOM Structure Features
    const tagSequence = [];
    if (formContainer) {
      const children = formContainer.querySelectorAll('*');
      children.forEach(el => {
        if (tagSequence.length < 20) {
          tagSequence.push(el.tagName.toLowerCase());
        }
      });
    }

    const logoImg = formContainer.querySelector('img[src*="logo" i], img[alt*="logo" i], img[id*="logo" i], img');
    const hasLogo = !!logoImg;
    const logoAltText = logoImg ? (logoImg.alt || logoImg.src || '').trim() : '';

    const forgotLink = formContainer.querySelector('a[href*="forgot" i], a[href*="reset" i]');
    const hasForgotPasswordLink = !!forgotLink || Array.from(formContainer.querySelectorAll('a')).some(a => (a.innerText || '').toLowerCase().includes('forgot'));

    // D. Text & Brand Features
    const pageTitle = document.title || '';
    const headings = formContainer.querySelectorAll('h1, h2, h3, h4, .title, .heading');
    const headingText = Array.from(headings).map(h => (h.innerText || '').trim()).join(' ');

    const bodyText = (formContainer.innerText || '').substring(0, 1500).replace(/\s+/g, ' ');

    // E. Visual & CSS Style Features
    const dominantColors = [];
    try {
      const bodyStyle = window.getComputedStyle(document.body);
      const containerStyle = formContainer ? window.getComputedStyle(formContainer) : null;
      const btnStyle = buttons.length > 0 ? window.getComputedStyle(buttons[0]) : null;

      if (bodyStyle.backgroundColor) dominantColors.push(rgbToHex(bodyStyle.backgroundColor));
      if (containerStyle && containerStyle.backgroundColor) dominantColors.push(rgbToHex(containerStyle.backgroundColor));
      if (btnStyle && btnStyle.backgroundColor) dominantColors.push(rgbToHex(btnStyle.backgroundColor));
    } catch (e) {
      // CSS calculation fallback
    }

    return {
      url: currentUrl,
      domain: currentDomain,
      hasPasswordField,
      formFeatures: {
        passwordFieldCount,
        emailOrTextFieldCount,
        inputCount: allInputs.length,
        buttonTexts,
        placeholders,
        formAction,
        formMethod
      },
      domFeatures: {
        tagSequence,
        inputTypes,
        formCount: document.querySelectorAll('form').length,
        hasLogo,
        hasForgotPasswordLink
      },
      textFeatures: {
        pageTitle,
        headingText,
        visibleText: `${pageTitle} ${headingText} ${bodyText}`
      },
      visualFeatures: {
        dominantColors: Array.from(new Set(dominantColors.filter(Boolean))),
        logoAltText,
        headingText
      }
    };
  }

  /**
   * Helper: Converts RGB string to Hex
   */
  function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return '#ffffff';
    const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return '#ffffff';
    return "#" + ("0" + parseInt(match[1], 10).toString(16)).slice(-2) +
                 ("0" + parseInt(match[2], 10).toString(16)).slice(-2) +
                 ("0" + parseInt(match[3], 10).toString(16)).slice(-2);
  }

  /**
   * Triggers Scan and Communicates with Extension Background
   */
  function initScan() {
    const extractedFeatures = extractPageFeatures();

    // Send payload to background script (or handle directly if injected in page)
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage(
        { action: "SCAN_PAGE", payload: extractedFeatures },
        (response) => {
          if (chrome.runtime.lastError) return;
          if (response && response.riskAssessment) {
            handleScanResult(response.riskAssessment, response.officialDomain);
          }
        }
      );
    } else if (window.CampusAuthGuardScanner) {
      // Direct window integration for hackathon test launcher demo
      const result = window.CampusAuthGuardScanner.scanExtractedFeatures(extractedFeatures);
      handleScanResult(result.riskAssessment, result.officialDomain);
    }
  }

  /**
   * Displays Warning Overlay on Suspicious / Dangerous Pages
   */
  function handleScanResult(risk, officialDomain) {
    if (!risk) return;

    if (risk.shouldWarn) {
      // Inject Red Warning Overlay on Phishing / Suspicious pages
      if (window.CampusWarningOverlay) {
        window.CampusWarningOverlay.show(risk, officialDomain);
      }
    } else if (risk.level === 'SAFE') {
      // Inject Automatic Green Safety Toast on Official Sites
      if (window.CampusWarningOverlay && window.CampusWarningOverlay.showSafeNotification) {
        window.CampusWarningOverlay.showSafeNotification(risk.title || 'Official College Portal Verified', officialDomain);
      }
    }
  }

  // Run initial scan on load
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initScan, 300);
  } else {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initScan, 300));
  }

  // MutationObserver for dynamic login form / modal rendering
  let scanDebounceTimer = null;
  const observer = new MutationObserver(() => {
    if (document.querySelector('input[type="password"]') || document.querySelector('form')) {
      clearTimeout(scanDebounceTimer);
      scanDebounceTimer = setTimeout(initScan, 600);
    }
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  // Listen for messages from popup.js
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'RE_SCAN') {
        const features = extractPageFeatures();
        if (chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({ action: "SCAN_PAGE", payload: features }, (response) => {
            sendResponse(response);
          });
          return true; // Async response
        }
      } else if (request.action === 'SHOW_OVERLAY') {
        const features = extractPageFeatures();
        if (chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({ action: "SCAN_PAGE", payload: features }, (response) => {
            if (response && response.riskAssessment) {
              handleScanResult(response.riskAssessment, response.officialDomain);
            }
          });
        }
      }
    });
  }

  // Expose global extractor for manual trigger / testing
  window.CampusAuthGuardExtractor = {
    extractPageFeatures,
    initScan
  };
})();
