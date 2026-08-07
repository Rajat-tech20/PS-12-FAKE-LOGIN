import { supabase } from "./supabaseClient";

const LOCAL_STORAGE_KEY = "campus_auth_fingerprints";

// Default initial baseline fingerprints for presentation / evaluation demo
const DEFAULT_FINGERPRINTS = [
  {
    id: "fp-st-vincent-erp-001",
    portal_type: "erp",
    college_name: "St. Vincent Pallotti College of Engineering and Technology",
    official_domains: ["stvincentngp.edu.in", "erp.stvincentngp.edu.in", "localhost", "127.0.0.1"],
    page_title: "log-CAS_ERP",
    brand_keywords: ["St. Vincent Pallotti", "Student Login", "ERP Portal", "College Administration System"],
    form_fingerprint: { passwordFieldCount: 1, inputCount: 14, buttonTexts: ["Login", "Reset"] },
    dom_fingerprint: { inputTypes: ["hidden", "text", "password", "submit"], formAction: "./login.aspx" },
    visual_fingerprint: { layoutType: "centered-login-card", dominantColors: ["#ffffff"], headingText: "College Administration System" },
    is_published: true,
    version: 1,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "fp-abc-college-erp-002",
    portal_type: "erp",
    college_name: "ABC College of Technology",
    official_domains: ["college.edu", "erp.college.edu"],
    page_title: "ABC College ERP Login - Student & Staff Portal",
    brand_keywords: ["ABC College", "College of Technology", "Student Login", "ERP Portal"],
    form_fingerprint: { passwordFieldCount: 1, inputCount: 3, buttonTexts: ["Sign In to ERP"] },
    dom_fingerprint: { tagSequence: ["div", "h2", "form", "input", "input", "button"], hasLogo: true },
    visual_fingerprint: { dominantColors: ["#003366", "#ffffff"], headingText: "ABC College ERP Portal" },
    is_published: true,
    version: 1,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "fp-abc-college-webmail-003",
    portal_type: "webmail",
    college_name: "ABC College of Technology",
    official_domains: ["webmail.college.edu"],
    page_title: "ABC College Student Webmail Sign In",
    brand_keywords: ["ABC College", "Webmail", "Student Email"],
    form_fingerprint: { passwordFieldCount: 1, inputCount: 2, buttonTexts: ["Log In"] },
    dom_fingerprint: { inputTypes: ["email", "password", "submit"] },
    visual_fingerprint: { dominantColors: ["#1e293b", "#ffffff"] },
    is_published: false,
    version: 1,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Helper: Read local storage list
function getLocalFingerprints() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_FINGERPRINTS));
      return DEFAULT_FINGERPRINTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_FINGERPRINTS;
  }
}

// Helper: Save local storage list
function saveLocalFingerprints(list) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {}
}

/**
 * Loads fingerprints from Supabase and merges with local storage persistence.
 */
export async function fetchAllFingerprints(collegeId = null, isSuperAdmin = true) {
  let remoteRows = [];
  try {
    let query = supabase.from("fingerprints").select("*").order("updated_at", { ascending: false });
    if (!isSuperAdmin && collegeId) {
      query = query.eq("college_id", collegeId);
    }
    const { data, error } = await query;
    if (!error && Array.isArray(data) && data.length > 0) {
      remoteRows = data;
    }
  } catch (e) {}

  const localRows = getLocalFingerprints();

  // Merge remote and local rows cleanly (local overrides by ID or appends)
  const map = new Map();
  remoteRows.forEach(r => map.set(r.id, r));
  localRows.forEach(l => map.set(l.id, l));

  return Array.from(map.values()).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
}

/**
 * Fetches a single fingerprint by ID
 */
export async function fetchFingerprintById(id) {
  const all = await fetchAllFingerprints();
  return all.find(f => String(f.id) === String(id)) || null;
}

/**
 * Saves a new or updated fingerprint to both Supabase and localStorage.
 */
export async function saveFingerprint(payload, existingId = null) {
  const now = new Date().toISOString();
  const id = existingId || payload.id || `fp-custom-${Date.now()}`;

  const fullRecord = {
    ...payload,
    id,
    updated_at: now,
    created_at: payload.created_at || now,
  };

  // 1. Try Supabase Sync
  try {
    if (existingId) {
      await supabase.from("fingerprints").update(payload).eq("id", existingId);
    } else {
      await supabase.from("fingerprints").insert(payload);
    }
  } catch (e) {
    console.warn("Supabase sync fallback to local store:", e.message);
  }

  // 2. Persist to Local Storage
  const localList = getLocalFingerprints();
  const idx = localList.findIndex(f => String(f.id) === String(id));
  if (idx >= 0) {
    localList[idx] = { ...localList[idx], ...fullRecord };
  } else {
    localList.unshift(fullRecord);
  }
  saveLocalFingerprints(localList);

  return fullRecord;
}

/**
 * Toggles is_published status for a fingerprint across Supabase & localStorage.
 */
export async function toggleFingerprintPublish(row) {
  const newPublishedState = !row.is_published;
  const now = new Date().toISOString();

  // 1. Try Supabase Update
  try {
    await supabase
      .from("fingerprints")
      .update({ is_published: newPublishedState, updated_at: now })
      .eq("id", row.id);
  } catch (e) {
    console.warn("Supabase publish toggle fallback to local store:", e.message);
  }

  // 2. Update Local Storage
  const localList = getLocalFingerprints();
  const idx = localList.findIndex(f => String(f.id) === String(row.id));
  if (idx >= 0) {
    localList[idx].is_published = newPublishedState;
    localList[idx].updated_at = now;
    saveLocalFingerprints(localList);
  }

  return { ...row, is_published: newPublishedState, updated_at: now };
}
