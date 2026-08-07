import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function DashboardHome() {
  const { profile, isSuperAdmin } = useAuth();
  const [stats, setStats] = useState({ published: 0, draft: 0, scans7d: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        let fpQuery = supabase.from("fingerprints").select("is_published");
        if (!isSuperAdmin && profile?.college_id) fpQuery = fpQuery.eq("college_id", profile.college_id);
        const { data: fps } = await fpQuery;

        const published = fps?.filter((f) => f.is_published).length || 0;
        const draft = fps?.filter((f) => !f.is_published).length || 0;

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { count: scans7d } = await supabase
          .from("scan_events")
          .select("*", { count: "exact", head: true })
          .gte("created_at", sevenDaysAgo);

        setStats({ published, draft, scans7d: scans7d || 0 });
      } catch (e) {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    if (profile) loadStats();
  }, [profile, isSuperAdmin]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Header Headline */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 className="m3-display-large" style={{ color: "var(--md-sys-color-on-surface)" }}>
            Welcome back, {profile?.email?.split('@')[0]} 👋
          </h1>
          <p className="m3-body-medium" style={{ marginTop: 6 }}>
            CampusAuthGuard Real-Time Anti-Phishing Security Monitoring Overview
          </p>
        </div>

        <Link to="/admin/fingerprints/new" className="m3-btn m3-btn-filled">
          <span className="material-symbols-outlined">add</span>
          Publish New Fingerprint
        </Link>
      </div>

      {/* Material 3 Stat Cards Grid */}
      {loading ? (
        <div className="m3-card" style={{ textAlign: "center", padding: 48 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 36, color: "var(--md-sys-color-primary)" }}>sync</span>
          <p className="m3-body-medium" style={{ marginTop: 12 }}>Fetching live security metrics...</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {/* Card 1: Published Fingerprints */}
          <div className="m3-card-elevated" style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "var(--md-shape-corner-m)",
                backgroundColor: "var(--md-sys-color-success-container)",
                color: "var(--md-sys-color-success)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 30 }}>verified</span>
            </div>
            <div>
              <span className="m3-label-medium">Active Fingerprints</span>
              <h2 className="m3-display-large" style={{ marginTop: 4, color: "#f3f4f6" }}>{stats.published}</h2>
              <span className="m3-chip m3-chip-safe" style={{ marginTop: 6, fontSize: 11 }}>
                Live Monitored Portals
              </span>
            </div>
          </div>

          {/* Card 2: Draft Fingerprints */}
          <div className="m3-card-elevated" style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "var(--md-shape-corner-m)",
                backgroundColor: "var(--md-sys-color-warning-container)",
                color: "var(--md-sys-color-warning)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 30 }}>edit_note</span>
            </div>
            <div>
              <span className="m3-label-medium">Pending Drafts</span>
              <h2 className="m3-display-large" style={{ marginTop: 4, color: "#f3f4f6" }}>{stats.draft}</h2>
              <span className="m3-chip m3-chip-warning" style={{ marginTop: 6, fontSize: 11 }}>
                Awaiting Verification
              </span>
            </div>
          </div>

          {/* Card 3: 7-Day Scan Events */}
          <div className="m3-card-elevated" style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "var(--md-shape-corner-m)",
                backgroundColor: "var(--md-sys-color-primary-container)",
                color: "var(--md-sys-color-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 30 }}>monitoring</span>
            </div>
            <div>
              <span className="m3-label-medium">7-Day Telemetry Scans</span>
              <h2 className="m3-display-large" style={{ marginTop: 4, color: "#f3f4f6" }}>{stats.scans7d}</h2>
              <span className="m3-chip" style={{ marginTop: 6, fontSize: 11, backgroundColor: "var(--md-sys-color-primary-container)", color: "var(--md-sys-color-on-primary-container)" }}>
                Extension Evaluations
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Navigation Grid */}
      <div className="m3-card">
        <h3 className="m3-title-medium" style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <span className="material-symbols-outlined" style={{ color: "var(--md-sys-color-primary)" }}>bolt</span>
          Quick Security Management Actions
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          <Link to="/admin/fingerprints" className="m3-btn m3-btn-tonal" style={{ justifyContent: "flex-start", padding: "16px 20px" }}>
            <span className="material-symbols-outlined">fingerprint</span>
            Browse Fingerprints
          </Link>
          <Link to="/admin/audit-log" className="m3-btn m3-btn-tonal" style={{ justifyContent: "flex-start", padding: "16px 20px" }}>
            <span className="material-symbols-outlined">history</span>
            System Audit Log
          </Link>
          <Link to="/admin/scan-stats" className="m3-btn m3-btn-tonal" style={{ justifyContent: "flex-start", padding: "16px 20px" }}>
            <span className="material-symbols-outlined">analytics</span>
            Threat Telemetry Stats
          </Link>
        </div>
      </div>
    </div>
  );
}
