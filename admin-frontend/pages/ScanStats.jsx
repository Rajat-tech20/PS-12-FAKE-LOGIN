import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ScanStats() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from("scan_events")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);
        if (!error) setEvents(data || []);
      } catch (e) {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const counts = { safe: 0, suspicious: 0, dangerous: 0, slightly_similar: 0 };
  events.forEach((e) => {
    const lvl = (e.risk_level || "").toLowerCase();
    if (counts[lvl] !== undefined) counts[lvl]++;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 className="m3-display-large">Threat Telemetry & Scan Stats</h1>
        <p className="m3-body-medium" style={{ marginTop: 4 }}>
          Real-time browser extension scan evaluations and threat detection metrics
        </p>
      </div>

      {/* Material 3 Telemetry Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
        <div className="m3-card-elevated" style={{ textAlign: "center" }}>
          <span className="m3-label-medium">Total Evaluated Pages</span>
          <h2 className="m3-display-large" style={{ marginTop: 8, color: "var(--md-sys-color-primary)" }}>{events.length}</h2>
          <span className="m3-chip" style={{ marginTop: 8 }}>Extension Scans</span>
        </div>

        <div className="m3-card-elevated" style={{ textAlign: "center" }}>
          <span className="m3-label-medium">Dangerous Clones</span>
          <h2 className="m3-display-large" style={{ marginTop: 8, color: "var(--md-sys-color-error)" }}>{counts.dangerous}</h2>
          <span className="m3-chip m3-chip-danger" style={{ marginTop: 8 }}>Phishing Threat Blocked</span>
        </div>

        <div className="m3-card-elevated" style={{ textAlign: "center" }}>
          <span className="m3-label-medium">Suspicious Lookalikes</span>
          <h2 className="m3-display-large" style={{ marginTop: 8, color: "var(--md-sys-color-warning)" }}>{counts.suspicious}</h2>
          <span className="m3-chip m3-chip-warning" style={{ marginTop: 8 }}>Warning Modal Injected</span>
        </div>

        <div className="m3-card-elevated" style={{ textAlign: "center" }}>
          <span className="m3-label-medium">Verified Official</span>
          <h2 className="m3-display-large" style={{ marginTop: 8, color: "var(--md-sys-color-success)" }}>{counts.safe}</h2>
          <span className="m3-chip m3-chip-safe" style={{ marginTop: 8 }}>Authentic Domain Match</span>
        </div>
      </div>

      {/* M3 Table Container */}
      <div className="m3-table-container">
        {loading ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 36, color: "var(--md-sys-color-primary)" }}>sync</span>
            <p className="m3-body-medium" style={{ marginTop: 12 }}>Loading scan telemetry stream...</p>
          </div>
        ) : events.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, color: "var(--md-sys-color-on-surface-variant)" }}>radar</span>
            <p className="m3-title-medium" style={{ marginTop: 12 }}>No Live Scan Events Yet</p>
            <p className="m3-body-medium" style={{ marginTop: 4 }}>Browser extension evaluations will stream here automatically.</p>
          </div>
        ) : (
          <table className="m3-table">
            <thead>
              <tr>
                <th>Scanned Hostname / URL</th>
                <th>Similarity Score</th>
                <th>Risk Classification</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => {
                const riskLvl = (e.risk_level || "").toUpperCase();
                return (
                  <tr key={e.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--md-sys-color-secondary)" }}>language</span>
                        <span style={{ fontFamily: "Roboto Mono", fontSize: 13, fontWeight: 500 }}>{e.detected_domain || e.url}</span>
                      </div>
                    </td>
                    <td>
                      <span className="m3-chip" style={{ fontWeight: 700, fontFamily: "Roboto Mono" }}>
                        {e.similarity_score !== undefined ? `${e.similarity_score}%` : "N/A"}
                      </span>
                    </td>
                    <td>
                      {riskLvl === "SAFE" ? (
                        <span className="m3-chip m3-chip-safe">SAFE</span>
                      ) : riskLvl === "DANGEROUS" || riskLvl === "DANGER" ? (
                        <span className="m3-chip m3-chip-danger">DANGEROUS PHISHING</span>
                      ) : (
                        <span className="m3-chip m3-chip-warning">{riskLvl || "SUSPICIOUS"}</span>
                      )}
                    </td>
                    <td style={{ color: "var(--md-sys-color-on-surface-variant)", fontSize: 13 }}>
                      {new Date(e.created_at).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
