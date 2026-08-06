/**
 * Extension Popup Logic: popup.js
 * Interfaces with background worker to display real-time safety status and similarity metrics.
 */

document.addEventListener('DOMContentLoaded', () => {
  const statusCard = document.getElementById('statusCard');
  const statusBadge = document.getElementById('statusBadge');
  const scorePill = document.getElementById('scorePill');
  const statusTitle = document.getElementById('statusTitle');
  const statusDesc = document.getElementById('statusDesc');
  const activeDomain = document.getElementById('activeDomain');
  const officialDomain = document.getElementById('officialDomain');

  const barForm = document.getElementById('barForm');
  const barDom = document.getElementById('barDom');
  const barText = document.getElementById('barText');
  const barVisual = document.getElementById('barVisual');

  const valForm = document.getElementById('valForm');
  const valDom = document.getElementById('valDom');
  const valText = document.getElementById('valText');
  const valVisual = document.getElementById('valVisual');

  const portalSelect = document.getElementById('portalSelect');
  const btnRescan = document.getElementById('btnRescan');

  /**
   * Updates Popup UI with scan result payload
   */
  function renderScanData(data) {
    if (!data || !data.riskAssessment) {
      statusTitle.innerText = "No Login Page Detected";
      statusDesc.innerText = "Navigate to a college login portal or open demo test page.";
      return;
    }

    const risk = data.riskAssessment;
    const sim = risk.similarityResult || {};
    const domain = risk.domainResult || {};

    // 1. Badge & Header
    statusBadge.innerText = risk.badgeText || "OK";
    scorePill.innerText = `${risk.similarityScore || 0}% Match`;
    statusTitle.innerText = risk.title || "Page Status";
    statusDesc.innerText = risk.description || "";

    // Card Theme
    statusCard.className = "status-card";
    if (risk.level === 'SAFE') statusCard.classList.add('safe');
    else if (risk.level === 'DANGEROUS') statusCard.classList.add('danger');
    else if (risk.level === 'SUSPICIOUS') statusCard.classList.add('warn');

    // 2. Domains
    activeDomain.innerText = domain.hostname || "--";
    officialDomain.innerText = data.officialDomain || "erp.college.edu";

    // 3. Metric Bars
    const fScore = sim.formScore ?? 0;
    const dScore = sim.domScore ?? 0;
    const tScore = sim.textScore ?? 0;
    const vScore = sim.visualScore ?? 0;

    barForm.style.width = `${fScore}%`;
    barDom.style.width = `${dScore}%`;
    barText.style.width = `${tScore}%`;
    barVisual.style.width = `${vScore}%`;

    valForm.innerText = `${fScore}%`;
    valDom.innerText = `${dScore}%`;
    valText.innerText = `${tScore}%`;
    valVisual.innerText = `${vScore}%`;
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
              // Fallback to latest stored scan
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

  // Event Listeners
  if (btnRescan) {
    btnRescan.addEventListener('click', fetchActiveTabScan);
  }
});
