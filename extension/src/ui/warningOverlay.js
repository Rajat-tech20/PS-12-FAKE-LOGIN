/**
 * Security Toast & Overlay Injector Module
 * Renders automatic floating toasts for safe sites (green) and unsafe phishing sites (red).
 */

(function () {
  class WarningOverlay {
    /**
     * Renders warning overlay UI on current page (Optional full-screen modal).
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
      const existing = document.getElementById('cag-toast-root');
      if (existing) existing.remove();

      const toast = document.createElement('div');
      toast.id = 'cag-toast-root';
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
     * Renders automatic floating red unsafe toast when visiting fake/cloned site.
     */
    static showUnsafeNotification(title = "Unsafe Phishing Threat Detected", hostname = "", similarityScore = 90) {
      const existing = document.getElementById('cag-toast-root');
      if (existing) existing.remove();

      const toast = document.createElement('div');
      toast.id = 'cag-toast-root';
      toast.className = 'cag-unsafe-toast';

      const domainName = hostname || window.location.hostname;

      toast.innerHTML = `
        <div class="cag-unsafe-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ef4444" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <div>
          <div class="cag-unsafe-title">🚨 ${title}</div>
          <div class="cag-unsafe-subtitle">Unverified Clone (${domainName} - ${similarityScore}% Match)</div>
        </div>
      `;

      document.body.appendChild(toast);

      // Auto dismiss after 5 seconds
      setTimeout(() => {
        if (toast && toast.parentNode) {
          toast.style.animation = "cagFadeOut 0.4s ease forwards";
          setTimeout(() => toast.remove(), 400);
        }
      }, 5000);
    }

    /**
     * Removes warning overlay and toasts from page.
     */
    static remove() {
      const existing = document.getElementById('cag-overlay-root');
      if (existing) existing.remove();
      const existingToast = document.getElementById('cag-toast-root');
      if (existingToast) existingToast.remove();
    }
  }

  window.CampusWarningOverlay = WarningOverlay;
})();
