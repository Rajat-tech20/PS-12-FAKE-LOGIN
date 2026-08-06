/**
 * Similarity Engine Module
 * Multi-feature weighted scoring algorithm comparing extracted page features against official fingerprint.
 */

class SimilarityEngine {
  /**
   * Calculates overall composite similarity score (0 to 100).
   * @param {Object} currentFeatures - Features extracted from active page
   * @param {Object} officialFingerprint - Official baseline fingerprint
   * @returns {Object} Detailed score breakdown and final composite percentage
   */
  static calculateSimilarity(currentFeatures = {}, officialFingerprint = {}) {
    if (!currentFeatures || !officialFingerprint) {
      return { finalScore: 0, formScore: 0, domScore: 0, textScore: 0, visualScore: 0 };
    }

    const formScore = this.calcFormSimilarity(
      currentFeatures.formFeatures || {},
      officialFingerprint.formFingerprint || {}
    );

    const domScore = this.calcDomSimilarity(
      currentFeatures.domFeatures || {},
      officialFingerprint.domFingerprint || {}
    );

    const textScore = this.calcTextSimilarity(
      currentFeatures.textFeatures || {},
      officialFingerprint.brandKeywords || [],
      officialFingerprint.pageTitle || ""
    );

    const visualScore = this.calcVisualSimilarity(
      currentFeatures.visualFeatures || {},
      officialFingerprint.visualFingerprint || {}
    );

    // Weighted Formula:
    // Final = (Form * 0.35) + (DOM * 0.25) + (Text * 0.25) + (Visual * 0.15)
    const finalScore = Math.round(
      formScore * 0.35 +
      domScore * 0.25 +
      textScore * 0.25 +
      visualScore * 0.15
    );

    return {
      finalScore: Math.min(100, Math.max(0, finalScore)),
      formScore: Math.round(formScore),
      domScore: Math.round(domScore),
      textScore: Math.round(textScore),
      visualScore: Math.round(visualScore),
      weights: { form: 0.35, dom: 0.25, text: 0.25, visual: 0.15 }
    };
  }

  /**
   * Form Similarity Calculation (Weight: 35%)
   */
  static calcFormSimilarity(currForm = {}, offForm = {}) {
    let score = 0;
    let factors = 0;

    // 1. Password field count match
    const currPass = currForm.passwordFieldCount || 0;
    const offPass = offForm.passwordFieldCount || 0;
    if (currPass === offPass && offPass > 0) score += 100;
    else if (currPass > 0 && offPass > 0) score += 60;
    factors++;

    // 2. Input field total count similarity
    const currInputs = currForm.inputCount || 0;
    const offInputs = offForm.inputCount || 0;
    if (offInputs > 0) {
      const diff = Math.abs(currInputs - offInputs);
      const inputSim = Math.max(0, 100 - diff * 25);
      score += inputSim;
    } else {
      score += 50;
    }
    factors++;

    // 3. Button Text Overlap
    const currButtons = (currForm.buttonTexts || []).map(b => b.toLowerCase().trim());
    const offButtons = (offForm.buttonTexts || []).map(b => b.toLowerCase().trim());
    if (offButtons.length > 0) {
      let buttonMatch = 0;
      for (const btn of currButtons) {
        if (offButtons.some(ob => btn.includes(ob) || ob.includes(btn))) {
          buttonMatch = 100;
          break;
        }
      }
      score += buttonMatch;
    } else {
      score += 50;
    }
    factors++;

    // 4. Placeholders Overlap
    const currPlaceholders = (currForm.placeholders || []).map(p => p.toLowerCase());
    const offPlaceholders = (offForm.placeholders || []).map(p => p.toLowerCase());
    if (offPlaceholders.length > 0 && currPlaceholders.length > 0) {
      let placeholderMatches = 0;
      for (const cp of currPlaceholders) {
        if (offPlaceholders.some(op => cp.includes(op) || op.includes(cp))) {
          placeholderMatches += 1;
        }
      }
      const pScore = Math.min(100, (placeholderMatches / offPlaceholders.length) * 100);
      score += pScore;
      factors++;
    }

    return score / factors;
  }

  /**
   * DOM Structure Similarity Calculation (Weight: 25%)
   */
  static calcDomSimilarity(currDom = {}, offDom = {}) {
    let score = 0;
    let factors = 0;

    // 1. Tag sequence Jaccard overlap
    const currSeq = currDom.tagSequence || [];
    const offSeq = offDom.tagSequence || [];
    if (offSeq.length > 0 && currSeq.length > 0) {
      const setA = new Set(currSeq);
      const setB = new Set(offSeq);
      const intersection = [...setA].filter(x => setB.has(x)).length;
      const union = new Set([...setA, ...setB]).size;
      const jaccard = union > 0 ? (intersection / union) * 100 : 0;
      score += jaccard;
      factors++;
    }

    // 2. Input types signature match
    const currTypes = currDom.inputTypes || [];
    const offTypes = offDom.inputTypes || [];
    if (offTypes.length > 0) {
      const matches = currTypes.filter(t => offTypes.includes(t)).length;
      const typeScore = (matches / Math.max(1, offTypes.length)) * 100;
      score += typeScore;
      factors++;
    }

    // 3. Key element presence (Logo, Form count)
    let elemScore = 100;
    if (currDom.hasLogo !== offDom.hasLogo) elemScore -= 30;
    if (currDom.hasForgotPasswordLink !== offDom.hasForgotPasswordLink) elemScore -= 20;
    score += Math.max(0, elemScore);
    factors++;

    return score / factors;
  }

  /**
   * Text and Brand Similarity Calculation (Weight: 25%)
   */
  static calcTextSimilarity(currText = {}, brandKeywords = [], officialTitle = "") {
    let score = 0;
    let factors = 0;

    const pageText = (currText.visibleText || "").toLowerCase();
    const pageTitle = (currText.pageTitle || "").toLowerCase();

    // 1. Brand Keywords matching ratio
    if (brandKeywords.length > 0) {
      let matchedKw = 0;
      for (const kw of brandKeywords) {
        const cleanKw = kw.toLowerCase().trim();
        if (pageText.includes(cleanKw) || pageTitle.includes(cleanKw)) {
          matchedKw++;
        }
      }
      const kwScore = (matchedKw / brandKeywords.length) * 100;
      score += kwScore;
      factors++;
    }

    // 2. Page Title similarity
    if (officialTitle) {
      const cleanOffTitle = officialTitle.toLowerCase();
      let titleSim = 0;
      if (pageTitle === cleanOffTitle) {
        titleSim = 100;
      } else if (pageTitle.includes(cleanOffTitle) || cleanOffTitle.includes(pageTitle)) {
        titleSim = 85;
      } else {
        // Token intersection
        const tokensA = new Set(pageTitle.split(/\s+/).filter(t => t.length > 2));
        const tokensB = new Set(cleanOffTitle.split(/\s+/).filter(t => t.length > 2));
        const match = [...tokensA].filter(x => tokensB.has(x)).length;
        titleSim = tokensB.size > 0 ? (match / tokensB.size) * 100 : 0;
      }
      score += titleSim;
      factors++;
    }

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Visual and CSS Style Similarity Calculation (Weight: 15%)
   */
  static calcVisualSimilarity(currVis = {}, offVis = {}) {
    let score = 0;
    let factors = 0;

    // 1. Dominant Colors Overlap
    const currColors = (currVis.dominantColors || []).map(c => c.toLowerCase());
    const offColors = (offVis.dominantColors || []).map(c => c.toLowerCase());
    if (offColors.length > 0 && currColors.length > 0) {
      let colorMatches = 0;
      for (const oc of offColors) {
        if (currColors.some(cc => cc === oc || this.hexDistance(cc, oc) < 40)) {
          colorMatches++;
        }
      }
      const colorScore = (colorMatches / offColors.length) * 100;
      score += colorScore;
      factors++;
    }

    // 2. Logo Alt / Src match
    const currLogoAlt = (currVis.logoAltText || "").toLowerCase();
    const offLogoAlt = (offVis.logoAltText || "").toLowerCase();
    if (offLogoAlt && currLogoAlt) {
      if (currLogoAlt.includes(offLogoAlt) || offLogoAlt.includes(currLogoAlt)) {
        score += 100;
      } else {
        score += 30;
      }
      factors++;
    }

    // 3. Heading Text match
    const currHeading = (currVis.headingText || "").toLowerCase();
    const offHeading = (offVis.headingText || "").toLowerCase();
    if (offHeading && currHeading) {
      if (currHeading.includes(offHeading) || offHeading.includes(currHeading)) {
        score += 100;
      } else {
        score += 40;
      }
      factors++;
    }

    return factors > 0 ? score / factors : 50;
  }

  /**
   * Utility: Rough hex color similarity distance
   */
  static hexDistance(hex1, hex2) {
    if (!hex1 || !hex2 || hex1[0] !== '#' || hex2[0] !== '#') return 999;
    const r1 = parseInt(hex1.substring(1, 3), 16) || 0;
    const g1 = parseInt(hex1.substring(3, 5), 16) || 0;
    const b1 = parseInt(hex1.substring(5, 7), 16) || 0;

    const r2 = parseInt(hex2.substring(1, 3), 16) || 0;
    const g2 = parseInt(hex2.substring(3, 5), 16) || 0;
    const b2 = parseInt(hex2.substring(5, 7), 16) || 0;

    return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = SimilarityEngine;
}
