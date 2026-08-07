/**
 * Supabase Service Module: supabaseService.js
 * REST API client wrapper for syncing reference fingerprints from Supabase cloud database
 * and streaming real-time threat telemetry logs (scan_events).
 */

class SupabaseService {
  /**
   * Helper to resolve active configuration
   */
  static getConfig() {
    if (typeof SUPABASE_CONFIG !== 'undefined') return SUPABASE_CONFIG;
    if (typeof window !== 'undefined' && window.SUPABASE_CONFIG) return window.SUPABASE_CONFIG;
    if (typeof globalThis !== 'undefined' && globalThis.SUPABASE_CONFIG) return globalThis.SUPABASE_CONFIG;
    return null;
  }

  /**
   * Verifies if Supabase project URL and key are configured
   */
  static isConfigured() {
    const config = this.getConfig();
    if (!config || !config.url || !config.anonKey) return false;
    if (config.url.includes('your-project-id') || config.anonKey.includes('your-anon-key')) return false;
    return true;
  }

  /**
   * Normalizes raw database fingerprint row to adhere STRICTLY to REQUIRED KEYS:
   * form_fingerprint: passwordFieldCount, emailFieldCount, inputCount, buttonTexts
   * dom_fingerprint: inputTypes, formAction, formMethod
   * visual_fingerprint: layoutType, dominantColors, logoAltText, headingText
   */
  static normalizeFingerprintRow(row) {
    if (!row) return null;

    const rawForm = row.form_fingerprint || {};
    const rawDom = row.dom_fingerprint || {};
    const rawVis = row.visual_fingerprint || {};

    const formFingerprint = {
      passwordFieldCount: rawForm.passwordFieldCount ?? rawForm.password_fields_detected ?? 1,
      emailFieldCount: rawForm.emailFieldCount ?? 0,
      inputCount: rawForm.inputCount ?? rawForm.inputs_count ?? 3,
      buttonTexts: Array.isArray(rawForm.buttonTexts) ? rawForm.buttonTexts : (Array.isArray(rawForm.button_texts) ? rawForm.button_texts : [])
    };

    const domFingerprint = {
      inputTypes: Array.isArray(rawDom.inputTypes) ? rawDom.inputTypes : ["text", "password", "submit"],
      formAction: rawDom.formAction || "",
      formMethod: (rawDom.formMethod || "POST").toUpperCase()
    };

    const visualFingerprint = {
      layoutType: rawVis.layoutType || "centered-login-card",
      dominantColors: Array.isArray(rawVis.dominantColors) ? rawVis.dominantColors : (rawVis.primary_color ? [rawVis.primary_color] : []),
      logoAltText: rawVis.logoAltText || "",
      headingText: rawVis.headingText || ""
    };

    return {
      id: row.id,
      collegeId: row.college_id,
      portalType: row.portal_type || 'erp',
      portalId: `${(row.college_name || 'college').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${row.portal_type || 'erp'}`,
      portalName: `${row.college_name} (${(row.portal_type || 'ERP').toUpperCase()})`,
      collegeName: row.college_name,
      officialDomains: Array.isArray(row.official_domains) ? row.official_domains : [],
      pageTitle: row.page_title || '',
      brandKeywords: Array.isArray(row.brand_keywords) ? row.brand_keywords : [],
      formFingerprint,
      domFingerprint,
      visualFingerprint
    };
  }

  /**
   * Fetches published college reference fingerprints from Supabase REST API
   * Implements 6-hour chrome.storage.local caching with stale-fallback.
   * RLS policy 'fingerprints_public_read_published' enforces is_published = true.
   * @returns {Promise<Array>} List of normalized college fingerprint objects
   */
  static async fetchRemoteFingerprints() {
    const CACHE_KEY = 'fingerprints_cache';
    const TS_KEY = 'fingerprints_cache_ts';
    const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 Hours

    // Helper: Read chrome.storage.local cache
    const getCached = () => new Promise(resolve => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get([CACHE_KEY, TS_KEY], res => {
          if (res && res[CACHE_KEY] && res[TS_KEY]) {
            resolve({ data: res[CACHE_KEY], age: Date.now() - res[TS_KEY] });
          } else {
            resolve(null);
          }
        });
      } else {
        resolve(null);
      }
    });

    // Helper: Save to chrome.storage.local cache
    const setCache = (data) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ [CACHE_KEY]: data, [TS_KEY]: Date.now() });
      }
    };

    const cache = await getCached();
    if (cache && cache.age < CACHE_TTL_MS) {
      // Re-fetch in background silently to keep cache updated
      this.performNetworkFetch().then(fresh => {
        if (fresh && fresh.length > 0) setCache(fresh);
      }).catch(() => {});
      return cache.data;
    }

    if (!this.isConfigured()) {
      return cache ? cache.data : [];
    }

    try {
      const fresh = await this.performNetworkFetch();
      if (fresh && fresh.length > 0) {
        setCache(fresh);
        return fresh;
      }
      return cache ? cache.data : [];
    } catch (error) {
      console.warn('[SupabaseService] Network error fetching remote fingerprints, falling back to cache:', error.message);
      return cache ? cache.data : [];
    }
  }

  /**
   * Performs direct PostgREST network GET request
   */
  static async performNetworkFetch() {
    const config = this.getConfig();
    if (!config || !config.url || !config.anonKey) return [];

    const endpoint = `${config.url.replace(/\/$/, '')}/rest/v1/${config.tables.fingerprints}?select=*&is_published=eq.true`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn(`[SupabaseService] Remote fetch HTTP ${response.status}: ${response.statusText}`);
      return [];
    }

    const rows = await response.json();
    if (!Array.isArray(rows)) return [];

    return rows.map(row => this.normalizeFingerprintRow(row))
               .filter(fp => fp && fp.officialDomains && fp.officialDomains.length > 0);
  }

  /**
   * Logs scan event to scan_events table (insert-only, fire-and-forget)
   * Payload columns: fingerprint_id, detected_domain, similarity_score, risk_level, form_score, dom_score, text_score, visual_score
   * @param {Object} threatData 
   * @returns {Promise<boolean>} Success status
   */
  static async logThreatEvent(threatData = {}) {
    if (!this.isConfigured()) return false;

    const config = this.getConfig();
    const endpoint = `${config.url.replace(/\/$/, '')}/rest/v1/${config.tables.scanEvents}`;

    // Normalize risk_level string to lowercase ('safe', 'suspicious', 'dangerous', 'slightly_similar')
    const rawLevel = (threatData.riskLevel || 'dangerous').toLowerCase();
    const validLevels = ['safe', 'suspicious', 'dangerous', 'slightly_similar'];
    const validLevel = validLevels.includes(rawLevel) ? rawLevel : 'dangerous';

    const payload = {
      fingerprint_id: threatData.fingerprintId || null,
      detected_domain: threatData.domain || threatData.hostname || 'unknown-domain.com',
      similarity_score: Math.round(threatData.similarityScore || 0),
      risk_level: validLevel,
      form_score: Math.round(threatData.formScore || 0),
      dom_score: Math.round(threatData.domScore || 0),
      text_score: Math.round(threatData.textScore || 0),
      visual_score: Math.round(threatData.visualScore || 0)
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'apikey': config.anonKey,
          'Authorization': `Bearer ${config.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.warn(`[SupabaseService] scan_events POST failed (HTTP ${response.status}): ${response.statusText}`);
      }

      return response.ok;
    } catch (error) {
      console.warn('[SupabaseService] Failed to log scan_event telemetry:', error.message);
      return false;
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SupabaseService;
} else if (typeof window !== 'undefined') {
  window.SupabaseService = SupabaseService;
}
