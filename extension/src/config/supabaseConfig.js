/**
 * Supabase Configuration: supabaseConfig.js
 * Configures Supabase REST API URL and Anon Key for dynamic fingerprint syncing
 * and real-time phishing threat telemetry logging.
 */

const SUPABASE_CONFIG = {
  // Replace with your Supabase Project URL (e.g. 'https://xyz.supabase.co')
  url: typeof process !== 'undefined' && process.env && process.env.SUPABASE_URL 
    ? process.env.SUPABASE_URL 
    : "https://qkckeocbjtpzfwjonuvm.supabase.co",

  // Replace with your Supabase Anon (Public) Key
  anonKey: typeof process !== 'undefined' && process.env && process.env.SUPABASE_ANON_KEY 
    ? process.env.SUPABASE_ANON_KEY 
    : "your-anon-key-here",

  // Table Names mapped to production schema
  tables: {
    colleges: 'colleges',
    fingerprints: 'fingerprints',
    scanEvents: 'scan_events'
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SUPABASE_CONFIG;
} else if (typeof window !== 'undefined') {
  window.SUPABASE_CONFIG = SUPABASE_CONFIG;
}
