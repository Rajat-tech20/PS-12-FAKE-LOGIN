/**
 * Extension Popup Logic: popup.js
 * Interfaces with background worker to display real-time safety status and similarity metrics.
 */

document.addEventListener('DOMContentLoaded', () => {
  const statusSection = document.getElementById('statusSection');
  const shieldIcon = document.getElementById('shieldIcon');
  const statusText = document.getElementById('statusText');
  const statusDomain = document.getElementById('statusDomain');

  const lblDomain = document.getElementById('lblDomain');
  const badgeDomain = document.getElementById('badgeDomain');
  const badgeScore = document.getElementById('badgeScore');
  const badgePass = document.getElementById('badgePass');
  const btnToggleOverlay = document.getElementById('btnToggleOverlay');

  /**
   * Updates Popup UI with scan result payload
   */
  function renderScanData(data) {
    if (!data || !data.riskAssessment) {
      statusText.innerText = "No Login Page";
      statusDomain.innerText = "Navigate to a college portal or open demo.";
      return;
    }

    const risk = data.riskAssessment;
    const sim = risk.similarityResult || {};
    const domain = risk.domainResult || {};

    // 1. Domain & Text
    statusDomain.innerText = domain.hostname || "unknown-domain.com";

    // 2. Risk Level Styling
    if (risk.level === 'SAFE') {
      statusSection.className = "status-section safe";
      shieldIcon.className = "shield-icon safe-shield";
      statusText.innerText = "Authentic Portal";

      lblDomain.innerText = "Official Domain";
      badgeDomain.innerText = "VERIFIED ✅";
      badgeDomain.style.background = "rgba(16, 185, 129, 0.15)";
      badgeDomain.style.color = "#10b981";

      if (btnToggleOverlay) btnToggleOverlay.style.display = "none";
    } else if (risk.level === 'DANGEROUS') {
      statusSection.className = "status-section danger";
      shieldIcon.className = "shield-icon danger-shield";
      statusText.innerText = "Phishing Threat Detected";

      lblDomain.innerText = "Spoof Domain";
      badgeDomain.innerText = "UNAUTHORIZED ❌";
      badgeDomain.style.background = "rgba(239, 68, 68, 0.15)";
      badgeDomain.style.color = "#ef4444";

      if (btnToggleOverlay) btnToggleOverlay.style.display = "block";
    } else if (risk.level === 'SUSPICIOUS') {
      statusSection.className = "status-section warn";
      shieldIcon.className = "shield-icon warn-shield";
      statusText.innerText = "Suspicious Lookalike";

      lblDomain.innerText = "Unverified Domain";
      badgeDomain.innerText = "CAUTION ⚠️";
      badgeDomain.style.background = "rgba(245, 158, 11, 0.15)";
      badgeDomain.style.color = "#f59e0b";

      if (btnToggleOverlay) btnToggleOverlay.style.display = "block";
    } else {
      statusSection.className = "status-section";
      shieldIcon.className = "shield-icon safe-shield";
      statusText.innerText = "Unrelated Page";

      lblDomain.innerText = "Standard Domain";
      badgeDomain.innerText = "OK";
      badgeDomain.style.background = "rgba(148, 163, 184, 0.15)";
      badgeDomain.style.color = "#94a3b8";

      if (btnToggleOverlay) btnToggleOverlay.style.display = "none";
    }

    // 3. Metrics
    const matchScore = risk.similarityScore ?? sim.finalScore ?? 0;
    badgeScore.innerText = `${matchScore}% MATCH`;

    if (data.features && data.features.hasPasswordField) {
      badgePass.innerText = "DETECTED";
      badgePass.style.background = "rgba(245, 158, 11, 0.15)";
      badgePass.style.color = "#f59e0b";
    } else {
      badgePass.innerText = "NONE";
      badgePass.style.background = "rgba(148, 163, 184, 0.15)";
      badgePass.style.color = "#94a3b8";
    }
  }

  /**
   * Requests scan from active tab
   */
  function fetchActiveTabScan() {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "RE_SCAN" }, (response) => {
            if (response) {
              renderScanData(response);
            } else {
              chrome.runtime.sendMessage({ action: "GET_LATEST_SCAN" }, renderScanData);
            }
          });
        }
      });
    }
  }

  // Initial load
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage({ action: "GET_LATEST_SCAN" }, (res) => {
      if (res) renderScanData(res);
      else fetchActiveTabScan();
    });
  }

  // Toggle Overlay button
  if (btnToggleOverlay) {
    btnToggleOverlay.addEventListener('click', () => {
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0] && tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "SHOW_OVERLAY" });
          }
        });
      }
    });
  }
});
