/**
 * Warning Overlay Injector Module
 * Displays an interactive red glassmorphic security warning on suspicious/cloned login pages.
 */

(function () {
  class WarningOverlay {
    /**
     * Renders warning overlay UI on current page.
     * @param {Object} risk - Risk object from RiskClassifier
     * @param {string} officialDomain - Target official domain
     */
    static show(risk = {}, officialDomain = "erp.college.edu") {
      // Remove any existing overlay
      this.remove();

      // Lock password input fields
      const passwordFields = document.querySelectorAll('input[type="password"]');
      passwordFields.forEach(input => input.classList.add('cag-locked-input'));

      // Create Backdrop Container
      const backdrop = document.createElement('div');
      backdrop.id = 'cag-overlay-root';
      backdrop.className = 'cag-overlay-backdrop';

      const isDangerous = risk.level === 'DANGEROUS';
      const badgeClass = isDangerous ? 'cag-badge' : 'cag-badge suspicious';
      const badgeLabel = isDangerous ? `${risk.similarityScore || 90}% CLONE MATCH` : `${risk.similarityScore || 60}% SUSPICIOUS`;

      const safeRedirectUrl = officialDomain.startsWith('http') ? officialDomain : `https://${officialDomain}`;

      backdrop.innerHTML = `
        <div class="cag-warning-card">
          <div class="cag-card-header">
            <div class="cag-header-title">
              <svg viewBox="0 0 24 24">
                <path d="M12 2L1 21h22L12 2zm1 14h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
              </svg>
              <span>${risk.title || 'Security Alert'}</span>
            </div>
            <span class="${badgeClass}">${badgeLabel}</span>
          </div>

          <div class="cag-description">
            ${risk.description || 'This webpage appears to be a suspicious lookalike targeting college credentials.'}
          </div>

          <div class="cag-domain-box">
            <div class="cag-domain-row">
              <span class="cag-domain-label">Current Website (UNOFFICIAL):</span>
              <span class="cag-domain-value bad">${window.location.hostname}</span>
            </div>
            <div class="cag-domain-row">
              <span class="cag-domain-label">Official College Portal:</span>
              <span class="cag-domain-value good">${officialDomain}</span>
            </div>
          </div>

          <div class="cag-actions">
            <a href="${safeRedirectUrl}" class="cag-btn-primary" id="cag-redirect-btn">
              <span>🚀 Go to Official College Portal</span>
            </a>
            <button class="cag-btn-secondary" id="cag-override-btn">
              ⚠️ Proceed Anyway (I understand the risk)
            </button>
          </div>

          <span class="cag-details-toggle" id="cag-toggle-details">
            🔍 Show Similarity Score Breakdown
          </span>

          <div class="cag-details-body" id="cag-details-content">
            <div class="cag-score-grid">
              <div class="cag-score-item">Form Similarity: <strong>${risk.similarityResult?.formScore ?? 95}%</strong></div>
              <div class="cag-score-item">DOM Structure: <strong>${risk.similarityResult?.domScore ?? 80}%</strong></div>
              <div class="cag-score-item">Brand Text Match: <strong>${risk.similarityResult?.textScore ?? 90}%</strong></div>
              <div class="cag-score-item">Visual Style: <strong>${risk.similarityResult?.visualScore ?? 85}%</strong></div>
            </div>
            <div style="margin-top: 8px; color: #94a3b8;">
              Weighted Score: ${risk.similarityScore || 0}% | Domain Verified: NO ❌
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(backdrop);

      // Event Listeners
      const overrideBtn = document.getElementById('cag-override-btn');
      if (overrideBtn) {
        overrideBtn.addEventListener('click', () => {
          passwordFields.forEach(input => input.classList.remove('cag-locked-input'));
          this.remove();
        });
      }

      const toggleDetails = document.getElementById('cag-toggle-details');
      const detailsContent = document.getElementById('cag-details-content');
      if (toggleDetails && detailsContent) {
        toggleDetails.addEventListener('click', () => {
          detailsContent.classList.toggle('show');
          toggleDetails.innerText = detailsContent.classList.contains('show')
            ? '▲ Hide Similarity Score Breakdown'
            : '🔍 Show Similarity Score Breakdown';
        });
      }
    }

    /**
     * Removes warning overlay UI from page.
     */
    static remove() {
      const existing = document.getElementById('cag-overlay-root');
      if (existing) {
        existing.remove();
      }
    }
  }

  window.CampusWarningOverlay = WarningOverlay;
})();
