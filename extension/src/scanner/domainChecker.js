/**
 * Domain Checker Module
 * Verifies if a given page URL belongs to an official college domain or is a spoofed lookalike.
 */

class DomainChecker {
  /**
   * Normalizes a hostname by stripping port numbers and trailing dots.
   * @param {string} rawUrl 
   * @returns {string} normalized hostname
   */
  static getHostname(rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      return parsed.hostname.toLowerCase().trim();
    } catch (e) {
      return rawUrl.toLowerCase().trim();
    }
  }

  /**
   * Evaluates whether a current URL is hosted on an official domain.
   * @param {string} currentUrl - Active page URL
   * @param {string[]} officialDomains - Array of trusted domain strings (e.g., ["college.edu", "erp.college.edu"])
   * @returns {Object} Domain verification result
   */
  static checkDomain(currentUrl, officialDomains = []) {
    const hostname = this.getHostname(currentUrl);

    if (!hostname) {
      return {
        isOfficial: false,
        hostname: "unknown",
        reason: "Invalid URL format"
      };
    }

    // Handle localhost and 127.0.0.1 for local dev/testing
    if ((hostname === "localhost" || hostname === "127.0.0.1") && officialDomains.includes(hostname)) {
      return {
        isOfficial: true,
        hostname,
        matchedOfficialDomain: hostname,
        reason: "Local development test environment match"
      };
    }

    // Check exact match or valid subdomain match
    for (const official of officialDomains) {
      const cleanOfficial = this.getHostname(official);

      // 1. Exact domain match (e.g., "erp.college.edu" === "erp.college.edu")
      if (hostname === cleanOfficial) {
        return {
          isOfficial: true,
          hostname,
          matchedOfficialDomain: cleanOfficial,
          reason: "Exact domain match"
        };
      }

      // 2. Legitimate subdomain match (e.g., "portal.erp.college.edu" ends with ".college.edu")
      if (hostname.endsWith("." + cleanOfficial)) {
        return {
          isOfficial: true,
          hostname,
          matchedOfficialDomain: cleanOfficial,
          reason: "Subdomain of official domain"
        };
      }
    }

    // Detect Subdomain Spoofing Attack
    // Example: "college.edu.phishing-site.com"
    // Here "college.edu" appears in the hostname, but the domain ENDS with ".phishing-site.com".
    let spoofDetected = false;
    let spoofTarget = "";

    for (const official of officialDomains) {
      const cleanOfficial = this.getHostname(official);
      if (hostname.includes(cleanOfficial) && !hostname.endsWith(cleanOfficial) && !hostname.endsWith("." + cleanOfficial)) {
        spoofDetected = true;
        spoofTarget = cleanOfficial;
        break;
      }
    }

    if (spoofDetected) {
      return {
        isOfficial: false,
        hostname,
        isSpoof: true,
        spoofTarget,
        reason: `Subdomain spoofing detected! Contains '${spoofTarget}' inside non-official domain '${hostname}'.`
      };
    }

    return {
      isOfficial: false,
      hostname,
      isSpoof: false,
      reason: "Domain is not in official trust list"
    };
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = DomainChecker;
}
