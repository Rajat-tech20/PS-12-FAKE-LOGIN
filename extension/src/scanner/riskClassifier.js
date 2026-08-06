/**
 * Risk Classifier Module
 * Combines domain verification with similarity score metrics to categorize security risk.
 */

class RiskClassifier {
  /**
   * Classifies page risk based on domain verification and similarity metrics.
   * @param {Object} domainResult - Output from DomainChecker
   * @param {Object} similarityResult - Output from SimilarityEngine
   * @param {boolean} hasPasswordField - Whether page contains password input
   * @returns {Object} Complete classification assessment
   */
  static classifyRisk(domainResult = {}, similarityResult = {}, hasPasswordField = false) {
    const score = similarityResult.finalScore || 0;
    const isOfficial = domainResult.isOfficial || false;
    const isSpoof = domainResult.isSpoof || false;

    // Rule 1: Official Domain Match -> SAFE
    if (isOfficial) {
      return {
        level: "SAFE",
        category: "OFFICIAL",
        title: "Official College Portal",
        badgeText: "SAFE",
        badgeColor: "#10b981",
        description: `This page is hosted on an official domain (${domainResult.matchedOfficialDomain || domainResult.hostname}).`,
        recommendation: "Safe to proceed with credential login.",
        similarityScore: score,
        shouldWarn: false
      };
    }

    // Rule 2: High Similarity (>= 75%) OR Subdomain Spoofing -> DANGEROUS / PHISHING
    if (score >= 75 || isSpoof) {
      return {
        level: "DANGEROUS",
        category: "PHISHING_CLONE",
        title: "⚠️ High-Risk Cloned Login Page Detected",
        badgeText: "UNSAFE",
        badgeColor: "#ef4444",
        description: `This webpage is ${score}% visually and structurally identical to the official college portal, but it is hosted on an unofficial domain (${domainResult.hostname}).`,
        recommendation: "DO NOT enter your password or credentials here. This is likely a phishing attack targeting college students.",
        similarityScore: score,
        shouldWarn: true,
        reason: isSpoof ? domainResult.reason : `High similarity (${score}%) on non-official domain '${domainResult.hostname}'`
      };
    }

    // Rule 3: Moderate Similarity (45% - 69%) -> SUSPICIOUS
    if (score >= 45 && hasPasswordField) {
      return {
        level: "SUSPICIOUS",
        category: "SUSPICIOUS_LOOKALIKE",
        title: "⚡ Suspicious Lookalike Page",
        badgeText: "UNSAFE",
        badgeColor: "#f59e0b",
        description: `This webpage shares structural or brand similarities (${score}%) with your college portal, but the domain (${domainResult.hostname}) is not verified.`,
        recommendation: "Exercise extreme caution before entering credentials.",
        similarityScore: score,
        shouldWarn: true,
        reason: `Moderate similarity (${score}%) on unverified domain '${domainResult.hostname}'`
      };
    }

    // Rule 4: Low Similarity (< 45%) -> UNRELATED
    return {
      level: "UNRELATED",
      category: "NEUTRAL",
      title: "Unrelated Login Page",
      badgeText: "",
      badgeColor: "#6b7280",
      description: "This webpage does not resemble your college's login portals.",
      recommendation: "Standard web page.",
      similarityScore: score,
      shouldWarn: false
    };
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = RiskClassifier;
}
