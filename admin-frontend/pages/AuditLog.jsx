import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AuditLog() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from("fingerprint_audit_log")
          .select("*")
          .order("changed_at", { ascending: false });
        if (!error) setRows(data || []);
      } catch (e) {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 className="m3-display-large">Fingerprint Audit Log</h1>
        <p className="m3-body-medium" style={{ marginTop: 4 }}>
          Immutable record of all fingerprint modifications, publications, and administrative actions
        </p>
      </div>

      <div className="m3-table-container">
        {loading ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 36, color: "var(--md-sys-color-primary)" }}>sync</span>
            <p className="m3-body-medium" style={{ marginTop: 12 }}>Loading audit trail...</p>
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, color: "var(--md-sys-color-on-surface-variant)" }}>history_toggle_off</span>
            <p className="m3-title-medium" style={{ marginTop: 12 }}>No Audit History Logged Yet</p>
            <p className="m3-body-medium" style={{ marginTop: 4 }}>Changes to reference fingerprints will automatically register here.</p>
          </div>
        ) : (
          <table className="m3-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Changed By</th>
                <th>Payload Diff</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <React.Fragment key={row.id}>
                  <tr>
                    <td style={{ color: "var(--md-sys-color-on-surface-variant)", fontSize: 13 }}>
                      {new Date(row.changed_at).toLocaleString()}
                    </td>
                    <td>
                      <span className="m3-chip m3-chip-safe" style={{ textTransform: "uppercase" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>track_changes</span>
                        {row.action || "UPDATE"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--md-sys-color-primary)" }}>account_circle</span>
                        <span>{row.changed_by || "System Admin"}</span>
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                        className="m3-btn m3-btn-outlined"
                        style={{ padding: "6px 14px", fontSize: 12 }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                          {expandedId === row.id ? "expand_less" : "code"}
                        </span>
                        {expandedId === row.id ? "Hide Diff" : "View JSON Diff"}
                      </button>
                    </td>
                  </tr>
                  {expandedId === row.id && (
                    <tr>
                      <td colSpan={4} style={{ backgroundColor: "var(--md-sys-color-surface-container-lowest)", padding: 20 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                          <div>
                            <span className="m3-label-medium" style={{ color: "var(--md-sys-color-error)", display: "block", marginBottom: 8 }}>
                              Previous State Payload
                            </span>
                            <pre
                              style={{
                                backgroundColor: "#111827",
                                border: "1px solid rgba(248, 113, 113, 0.3)",
                                borderRadius: "var(--md-shape-corner-m)",
                                padding: 16,
                                color: "#fca5a5",
                                fontSize: 12,
                                fontFamily: "Roboto Mono",
                                overflowX: "auto",
                                maxHeight: 260
                              }}
                            >
                              {JSON.stringify(row.old_data || {}, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <span className="m3-label-medium" style={{ color: "var(--md-sys-color-success)", display: "block", marginBottom: 8 }}>
                              Updated State Payload
                            </span>
                            <pre
                              style={{
                                backgroundColor: "#111827",
                                border: "1px solid rgba(52, 211, 153, 0.3)",
                                borderRadius: "var(--md-shape-corner-m)",
                                padding: 16,
                                color: "#6ee7b7",
                                fontSize: 12,
                                fontFamily: "Roboto Mono",
                                overflowX: "auto",
                                maxHeight: 260
                              }}
                            >
                              {JSON.stringify(row.new_data || {}, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
