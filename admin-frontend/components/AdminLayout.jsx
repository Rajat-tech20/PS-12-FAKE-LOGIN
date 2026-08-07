import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminLayout({ children }) {
  const { profile, isSuperAdmin, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { label: "Dashboard", icon: "dashboard", path: "/admin/dashboard" },
    { label: "Fingerprints", icon: "fingerprint", path: "/admin/fingerprints" },
    { label: "Add Fingerprint", icon: "post_add", path: "/admin/fingerprints/new" },
    { label: "Audit Log", icon: "history", path: "/admin/audit-log" },
    { label: "Scan Telemetry", icon: "analytics", path: "/admin/scan-stats" },
  ];

  if (isSuperAdmin) {
    navItems.push(
      { label: "Colleges", icon: "domain", path: "/admin/colleges" },
      { label: "Admins", icon: "manage_accounts", path: "/admin/admins" }
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--md-sys-color-background)" }}>
      {/* Material 3 Permanent Navigation Drawer */}
      <aside
        style={{
          width: 280,
          backgroundColor: "var(--md-sys-color-surface-container-low)",
          borderRight: "1px solid var(--md-sys-color-outline-variant)",
          display: "flex",
          flexDirection: "column",
          padding: "24px 16px",
          position: "sticky",
          top: 0,
          height: "100vh",
          boxSizing: "border-box"
        }}
      >
        {/* Brand Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 12px 24px 12px" }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "var(--md-shape-corner-m)",
              backgroundColor: "var(--md-sys-color-primary-container)",
              color: "var(--md-sys-color-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--md-elevation-1)"
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 26 }}>verified_user</span>
          </div>
          <div>
            <h2 className="m3-title-medium" style={{ fontSize: 17, letterSpacing: "-0.01em", color: "#f3f4f6" }}>
              CampusAuth<span style={{ color: "var(--md-sys-color-primary)" }}>Guard</span>
            </h2>
            <span style={{ fontSize: 11, color: "var(--md-sys-color-on-surface-variant)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Admin Portal
            </span>
          </div>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid var(--md-sys-color-outline-variant)", margin: "0 0 16px 0" }} />

        {/* Navigation Items */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px 18px",
                  borderRadius: "var(--md-shape-corner-full)",
                  backgroundColor: isActive ? "var(--md-sys-color-primary-container)" : "transparent",
                  color: isActive ? "var(--md-sys-color-on-primary-container)" : "var(--md-sys-color-on-surface-variant)",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 14,
                  textDecoration: "none",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
              >
                <span className="material-symbols-outlined" style={{ color: isActive ? "var(--md-sys-color-primary)" : "inherit" }}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Quick Info Footer */}
        <div
          style={{
            padding: 16,
            borderRadius: "var(--md-shape-corner-l)",
            backgroundColor: "var(--md-sys-color-surface-container)",
            border: "1px solid var(--md-sys-color-outline-variant)",
            display: "flex",
            flexDirection: "column",
            gap: 8
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                backgroundColor: "var(--md-sys-color-secondary-container)",
                color: "var(--md-sys-color-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 14
              }}
            >
              {profile?.email?.[0]?.toUpperCase() || "A"}
            </div>
            <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#f3f4f6", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {profile?.email || "Admin User"}
              </p>
              <span className="m3-chip" style={{ fontSize: 10, padding: "2px 8px", marginTop: 2 }}>
                {profile?.role || "Admin"}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content & Top App Bar Container */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top App Bar */}
        <header
          style={{
            height: 72,
            backgroundColor: "var(--md-sys-color-surface-container-low)",
            borderBottom: "1px solid var(--md-sys-color-outline-variant)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 32px",
            position: "sticky",
            top: 0,
            zIndex: 10
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="m3-chip m3-chip-safe">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>verified</span>
              Live Protection Active
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button className="m3-btn m3-btn-outlined" onClick={logout}>
              <span className="material-symbols-outlined">logout</span>
              Logout
            </button>
          </div>
        </header>

        {/* Dynamic Page View Area */}
        <main style={{ flex: 1, padding: 32 }}>{children}</main>
      </div>
    </div>
  );
}
