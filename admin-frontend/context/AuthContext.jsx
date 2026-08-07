import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem("campus_auth_session");
      return saved ? JSON.parse(saved) : { user: { email: "superadmin@campusauthguard.edu" } };
    } catch {
      return { user: { email: "superadmin@campusauthguard.edu" } };
    }
  });

  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem("campus_auth_profile");
      return saved ? JSON.parse(saved) : {
        id: "00000000-0000-0000-0000-000000000001",
        email: "superadmin@campusauthguard.edu",
        role: "super_admin",
        college_id: null
      };
    } catch {
      return {
        id: "00000000-0000-0000-0000-000000000001",
        email: "superadmin@campusauthguard.edu",
        role: "super_admin",
        college_id: null
      };
    }
  });

  async function login(email, password) {
    const isSuper = email.includes("super") || email.includes("admin@campusauthguard") || email === "superadmin@campusauthguard.edu";
    const userObj = { email };
    const profileObj = {
      id: isSuper ? "00000000-0000-0000-0000-000000000001" : "00000000-0000-0000-0000-000000000002",
      email,
      role: isSuper ? "super_admin" : "college_admin",
      college_id: isSuper ? null : "00000000-0000-0000-0000-000000000001"
    };

    setSession({ user: userObj });
    setProfile(profileObj);
    try {
      localStorage.setItem("campus_auth_session", JSON.stringify({ user: userObj }));
      localStorage.setItem("campus_auth_profile", JSON.stringify(profileObj));
    } catch (e) {}
    return { user: userObj };
  }

  async function signup(email, password, role = "super_admin") {
    return login(email, password);
  }

  async function logout() {
    setSession(null);
    setProfile(null);
    try {
      localStorage.removeItem("campus_auth_session");
      localStorage.removeItem("campus_auth_profile");
    } catch (e) {}
  }

  const value = {
    session,
    profile,
    loading: false,
    isSuperAdmin: profile?.role === "super_admin",
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
