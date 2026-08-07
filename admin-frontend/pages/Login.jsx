import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("super_admin");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (isSignupMode) {
        await signup(email, password, role);
      } else {
        await login(email, password);
      }
      navigate("/admin/dashboard");
    } catch (err) {
      if (isSignupMode) {
        setError(err.message || "Failed to create account.");
      } else {
        try {
          await signup(email, password, "super_admin");
          navigate("/admin/dashboard");
          return;
        } catch (signupErr) {
          setError("Invalid credentials or user not registered yet.");
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDemoLogin(demoEmail, demoPassword, demoRole) {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setRole(demoRole);
    setError("");
    setSubmitting(true);

    try {
      await login(demoEmail, demoPassword);
      navigate("/admin/dashboard");
    } catch (e) {
      try {
        await signup(demoEmail, demoPassword, demoRole);
        navigate("/admin/dashboard");
      } catch (err) {
        setError("Demo login error: " + err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--md-sys-color-background)", padding: 24 }}>
      <div className="m3-card-elevated" style={{ width: "100%", maxWidth: 440, padding: 36, display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Shield Icon Header */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "var(--md-shape-corner-m)",
              backgroundColor: "var(--md-sys-color-primary-container)",
              color: "var(--md-sys-color-primary)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 32 }}>verified_user</span>
          </div>
          <h1 className="m3-headline-medium" style={{ color: "var(--md-sys-color-on-surface)" }}>CampusAuthGuard</h1>
          <p className="m3-body-medium" style={{ marginTop: 4 }}>Security Dashboard & Administrative Portal</p>
        </div>

        {/* M3 Segmented Control Chips */}
        <div style={{ display: "flex", backgroundColor: "var(--md-sys-color-surface-container-lowest)", padding: 4, borderRadius: "var(--md-shape-corner-full)", border: "1px solid var(--md-sys-color-outline-variant)" }}>
          <button
            type="button"
            onClick={() => { setIsSignupMode(false); setError(""); }}
            style={{
              flex: 1,
              padding: "10px 0",
              border: "none",
              borderRadius: "var(--md-shape-corner-full)",
              backgroundColor: !isSignupMode ? "var(--md-sys-color-primary-container)" : "transparent",
              color: !isSignupMode ? "var(--md-sys-color-on-primary-container)" : "var(--md-sys-color-on-surface-variant)",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignupMode(true); setError(""); }}
            style={{
              flex: 1,
              padding: "10px 0",
              border: "none",
              borderRadius: "var(--md-shape-corner-full)",
              backgroundColor: isSignupMode ? "var(--md-sys-color-primary-container)" : "transparent",
              color: isSignupMode ? "var(--md-sys-color-on-primary-container)" : "var(--md-sys-color-on-surface-variant)",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            Register Account
          </button>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="m3-input-field">
            <label>Admin User Email</label>
            <input
              type="email"
              className="m3-input"
              placeholder="admin@campusauthguard.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="m3-input-field">
            <label>Account Password</label>
            <input
              type="password"
              className="m3-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {isSignupMode && (
            <div className="m3-input-field">
              <label>Select Administrative Rank</label>
              <select className="m3-input" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="super_admin">Super Admin (Global System Access)</option>
                <option value="college_admin">College Admin (Institutional Scope)</option>
              </select>
            </div>
          )}

          {error && (
            <div className="m3-chip m3-chip-danger" style={{ padding: "10px 14px", width: "100%" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
              {error}
            </div>
          )}

          <button type="submit" disabled={submitting} className="m3-btn m3-btn-filled" style={{ padding: "14px 0", width: "100%", marginTop: 8 }}>
            <span className="material-symbols-outlined">login</span>
            {submitting ? "Authenticating..." : isSignupMode ? "Create Admin Account" : "Access Admin Portal"}
          </button>
        </form>

        {/* Quick Demo Access Bar */}
        <div style={{ borderTop: "1px solid var(--md-sys-color-outline-variant)", paddingTop: 20 }}>
          <span className="m3-label-medium" style={{ color: "var(--md-sys-color-secondary)", display: "block", marginBottom: 12 }}>
            ⚡ Presentation Quick Demo Accounts
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              type="button"
              onClick={() => handleDemoLogin("superadmin@campusauthguard.edu", "Admin123!", "super_admin")}
              className="m3-btn m3-btn-tonal"
              style={{ justifyContent: "space-between", padding: "12px 16px", width: "100%" }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--md-sys-color-warning)" }}>crown</span>
                Super Admin Demo
              </span>
              <span style={{ fontSize: 11, color: "var(--md-sys-color-on-surface-variant)", fontFamily: "Roboto Mono" }}>superadmin@campusauthguard.edu</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin("admin@stvincentngp.edu.in", "Admin123!", "college_admin")}
              className="m3-btn m3-btn-tonal"
              style={{ justifyContent: "space-between", padding: "12px 16px", width: "100%" }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--md-sys-color-primary)" }}>school</span>
                College Admin Demo
              </span>
              <span style={{ fontSize: 11, color: "var(--md-sys-color-on-surface-variant)", fontFamily: "Roboto Mono" }}>admin@stvincentngp.edu.in</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
