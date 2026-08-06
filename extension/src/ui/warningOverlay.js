/**
 * Security Overlay Injector Module
 * Displays an interactive red glassmorphic security warning on dangerous pages,
 * AND an automatic floating green safety toast when visiting official college portals.
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

      const safeRedirectUrl = officialDomain.startsWith('http') ? officialDomain : `https://${officialDomain}`;

      backdrop.innerHTML = `
        <div class="cag-warning-card">
          <div class="cag-icon-container">
            <svg viewBox="0 0 24 24">
              <path d="M12 2L1 21h22L12 2zm1 14h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
          </div>

          <h2 class="cag-warning-title">Security Warning!</h2>

          <div class="cag-warning-message">
            ${risk.description || 'You are visiting an unverified domain that looks visually identical to your official college portal.'}
          </div>

          <div class="cag-domain-box">
            <div class="cag-domain-row">
              <span class="cag-domain-label">Current Hostname (UNTRUSTED):</span>
              <span class="cag-domain-value bad">${window.location.hostname}</span>
            </div>
            <div class="cag-domain-row">
              <span class="cag-domain-label">Official College Portal:</span>
              <span class="cag-domain-value good">${officialDomain}</span>
            </div>
            <div class="cag-domain-row" style="margin-top: 4px;">
              <span class="cag-domain-label">Similarity Match Score:</span>
              <span class="cag-domain-value bad">${risk.similarityScore || 90}% CLONE MATCH</span>
            </div>
          </div>

          <div class="cag-warning-actions">
            <a href="${safeRedirectUrl}" class="cag-btn-primary" id="cag-redirect-btn">
              🚀 Take Me to Official Portal
            </a>
            <button class="cag-btn-secondary" id="cag-override-btn">
              Proceed Anyway (I Understand Risk)
            </button>
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
    }

    /**
     * Renders automatic floating green safety toast when visiting official site.
     */
    static showSafeNotification(title = "Official Portal Verified", officialDomain = "") {
      const existing = document.getElementById('cag-safe-toast-root');
      if (existing) existing.remove();

      const toast = document.createElement('div');
      toast.id = 'cag-safe-toast-root';
      toast.className = 'cag-safe-toast';

      const domainName = officialDomain || window.location.hostname;

      toast.innerHTML = `
        <div class="cag-safe-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
        <div>
          <div class="cag-safe-title">Official Portal Verified</div>
          <div class="cag-safe-subtitle">Authentic College Portal (${domainName})</div>
        </div>
      `;

      document.body.appendChild(toast);

      // Auto dismiss after 4 seconds
      setTimeout(() => {
        if (toast && toast.parentNode) {
          toast.style.animation = "cagFadeOut 0.4s ease forwards";
          setTimeout(() => toast.remove(), 400);
        }
      }, 4000);
    }

    /**
     * Removes warning overlay UI from page.
     */
    static remove() {
      const existing = document.getElementById('cag-overlay-root');
      if (existing) {
        existing.remove();
      }
      const existingToast = document.getElementById('cag-safe-toast-root');
      if (existingToast) {
        existingToast.remove();
      }
    }
  }

  window.CampusWarningOverlay = WarningOverlay;
})();
