import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function FingerprintList() {
  const { profile, isSuperAdmin } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadFingerprints() {
    setLoading(true);
    try {
      let query = supabase.from("fingerprints").select("*").order("updated_at", { ascending: false });
      if (!isSuperAdmin && profile?.college_id) query = query.eq("college_id", profile.college_id);

      const { data, error } = await query;
      if (error) setError(error.message);
      else setRows(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (profile) loadFingerprints();
  }, [profile]);

  async function togglePublish(row) {
    const { error } = await supabase
      .from("fingerprints")
      .update({ is_published: !row.is_published })
      .eq("id", row.id);
    if (error) setError(error.message);
    else loadFingerprints();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 className="m3-display-large">Official Reference Fingerprints</h1>
          <p className="m3-body-medium" style={{ marginTop: 4 }}>
            Baseline structural & visual signatures used for real-time similarity scanning
          </p>
        </div>
        <Link to="/admin/fingerprints/new" className="m3-btn m3-btn-filled">
          <span className="material-symbols-outlined">add</span>
          New Fingerprint
        </Link>
      </div>

      {error && (
        <div className="m3-chip m3-chip-danger" style={{ width: "100%", padding: "12px 16px" }}>
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      )}

      {/* M3 Table Container */}
      <div className="m3-table-container">
        {loading ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 36, color: "var(--md-sys-color-primary)" }}>sync</span>
            <p className="m3-body-medium" style={{ marginTop: 12 }}>Loading fingerprints database...</p>
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, color: "var(--md-sys-color-on-surface-variant)" }}>fingerprint_off</span>
            <p className="m3-title-medium" style={{ marginTop: 12 }}>No Fingerprints Published Yet</p>
            <p className="m3-body-medium" style={{ marginTop: 4 }}>Create a new portal fingerprint to activate extension scanning protection.</p>
          </div>
        ) : (
          <table className="m3-table">
            <thead>
              <tr>
                <th>Portal Name / Type</th>
                <th>Target College</th>
                <th>Status</th>
                <th>Version</th>
                <th>Last Modified</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="material-symbols-outlined" style={{ color: "var(--md-sys-color-primary)" }}>lan</span>
                      <span style={{ fontWeight: 600 }}>{row.portal_type || "ERP Portal"}</span>
                    </div>
                  </td>
                  <td>{row.college_name || "St. Vincent Pallotti College"}</td>
                  <td>
                    {row.is_published ? (
                      <span className="m3-chip m3-chip-safe">
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
                        Published
                      </span>
                    ) : (
                      <span className="m3-chip m3-chip-warning">
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>
                        Draft
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="m3-chip" style={{ fontFamily: "Roboto Mono", fontSize: 11 }}>v{row.version || 1}</span>
                  </td>
                  <td style={{ color: "var(--md-sys-color-on-surface-variant)", fontSize: 13 }}>
                    {new Date(row.updated_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Link to={`/admin/fingerprints/${row.id}/edit`} className="m3-btn m3-btn-outlined" style={{ padding: "6px 14px", fontSize: 12 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                        Edit
                      </Link>
                      <button onClick={() => togglePublish(row)} className="m3-btn m3-btn-tonal" style={{ padding: "6px 14px", fontSize: 12 }}>
                        {row.is_published ? "Unpublish" : "Publish"}
                      </button>
                      <Link to={`/admin/audit-log?fingerprint_id=${row.id}`} className="m3-btn m3-btn-outlined" style={{ padding: "6px 14px", fontSize: 12 }}>
                        Audit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
