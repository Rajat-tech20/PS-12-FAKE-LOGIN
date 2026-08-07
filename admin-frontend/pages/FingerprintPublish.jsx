import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { fetchFingerprintById, saveFingerprint } from "../lib/fingerprintStore";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

function extractJsonBlock(raw) {
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return raw;
  return raw.slice(first, last + 1);
}

export default function FingerprintPublish() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [pasted, setPasted] = useState("");
  const [portalType, setPortalType] = useState("erp");
  const [collegeName, setCollegeName] = useState("St. Vincent Pallotti College of Engineering and Technology");
  const [officialDomains, setOfficialDomains] = useState("stvincentngp.edu.in, erp.stvincentngp.edu.in");
  const [brandKeywords, setBrandKeywords] = useState("St. Vincent Pallotti, ERP Portal");
  const [pageTitleOverride, setPageTitleOverride] = useState("");
  const [currentVersion, setCurrentVersion] = useState(1);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadExisting() {
      if (!id) return;
      try {
        const data = await fetchFingerprintById(id);
        if (!data) return;
        setPortalType(data.portal_type || "erp");
        setCollegeName(data.college_name || "");
        setOfficialDomains((data.official_domains || []).join(", "));
        setBrandKeywords((data.brand_keywords || []).join(", "));
        setPageTitleOverride(data.page_title || "");
        setCurrentVersion(data.version || 1);
        setPasted(JSON.stringify({
          formFingerprint: data.form_fingerprint || {},
          domFingerprint: data.dom_fingerprint || {},
          visualFingerprint: data.visual_fingerprint || {},
        }, null, 2));
      } catch (e) {
        setError(e.message);
      }
    }
    if (isEditing) loadExisting();
  }, [id, isEditing]);

  async function getValidCollegeId() {
    if (profile?.college_id && profile.college_id.length > 20) {
      return profile.college_id;
    }
    try {
      const { data } = await supabase.from("colleges").select("id").limit(1);
      if (data && data.length > 0) return data[0].id;
    } catch (e) {}
    return "00000000-0000-0000-0000-000000000001";
  }

  async function buildPayload() {
    let extracted = { formFingerprint: {}, domFingerprint: {}, visualFingerprint: {} };
    if (pasted.trim()) {
      try {
        extracted = JSON.parse(extractJsonBlock(pasted));
      } catch {
        throw new Error("Pasted data isn't valid JSON — check for stray text around the { } block.");
      }
    }

    const collegeId = await getValidCollegeId();

    const payload = {
      portal_type: portalType,
      college_name: collegeName || "St. Vincent Pallotti College of Engineering and Technology",
      official_domains: officialDomains.split(",").map((s) => s.trim()).filter(Boolean),
      page_title: pageTitleOverride || extracted.pageTitleDetected || "Authentication Portal",
      brand_keywords: brandKeywords.split(",").map((s) => s.trim()).filter(Boolean),
      form_fingerprint: extracted.formFingerprint || {},
      dom_fingerprint: extracted.domFingerprint || {},
      visual_fingerprint: extracted.visualFingerprint || {},
    };

    if (collegeId) {
      payload.college_id = collegeId;
    }

    return payload;
  }

  async function handleSave(publish) {
    setError("");
    setSaving(true);
    try {
      const payload = await buildPayload();
      payload.is_published = publish;
      payload.version = isEditing ? currentVersion + 1 : 1;

      await saveFingerprint(payload, isEditing ? id : null);
      navigate("/admin/fingerprints");
    } catch (err) {
      setError(err.message || "Error saving fingerprint");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 840 }}>
      <div style={{ display: "flex", alignItems: "center", justifyBetween: "space-between" }}>
        <div>
          <h1 className="m3-display-large">{isEditing ? "Edit Portal Fingerprint" : "Publish New Reference Fingerprint"}</h1>
          <p className="m3-body-medium" style={{ marginTop: 4 }}>
            Configure baseline signatures for genuine college login pages
          </p>
        </div>
      </div>

      <div className="m3-card" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* JSON Extractor Input */}
        <div className="m3-input-field">
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--md-sys-color-primary)" }}>code</span>
            Paste Generator Payload JSON
          </label>
          <textarea
            rows={7}
            className="m3-input"
            style={{ fontFamily: "Roboto Mono", fontSize: 13 }}
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            placeholder="Paste extracted JSON payload from fingerprint-generator tool..."
          />
        </div>

        {/* Metadata Inputs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="m3-input-field">
            <label>Target College / Organization Name</label>
            <input className="m3-input" value={collegeName} onChange={(e) => setCollegeName(e.target.value)} />
          </div>

          <div className="m3-input-field">
            <label>Portal Type Category</label>
            <select className="m3-input" value={portalType} onChange={(e) => setPortalType(e.target.value)}>
              <option value="erp">ERP Portal</option>
              <option value="webmail">Webmail Portal</option>
              <option value="scholarship">Scholarship Portal</option>
              <option value="library">Library Services</option>
              <option value="exam">Examination Portal</option>
            </select>
          </div>
        </div>

        <div className="m3-input-field">
          <label>Official Legitimate Domains (comma separated)</label>
          <input className="m3-input" value={officialDomains} onChange={(e) => setOfficialDomains(e.target.value)} placeholder="e.g. stvincentngp.edu.in, erp.stvincentngp.edu.in" />
        </div>

        <div className="m3-input-field">
          <label>Brand Keywords (comma separated)</label>
          <input className="m3-input" value={brandKeywords} onChange={(e) => setBrandKeywords(e.target.value)} placeholder="e.g. St. Vincent Pallotti, Student Login" />
        </div>

        <div className="m3-input-field">
          <label>Page Title (optional override)</label>
          <input className="m3-input" value={pageTitleOverride} onChange={(e) => setPageTitleOverride(e.target.value)} placeholder="e.g. CAS ERP Student Login" />
        </div>

        {error && (
          <div className="m3-chip m3-chip-danger" style={{ padding: 12 }}>
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button disabled={saving} onClick={() => handleSave(false)} className="m3-btn m3-btn-tonal">
            <span className="material-symbols-outlined">save</span>
            Save Draft
          </button>
          <button disabled={saving} onClick={() => handleSave(true)} className="m3-btn m3-btn-filled">
            <span className="material-symbols-outlined">publish</span>
            Publish Fingerprint
          </button>
          <Link to="/admin/fingerprints" className="m3-btn m3-btn-outlined" style={{ marginLeft: "auto" }}>
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
