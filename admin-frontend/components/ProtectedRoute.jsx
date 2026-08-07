import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, requireSuperAdmin = false }) {
  const { session, profile, loading } = useAuth();

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (!session) return <Navigate to="/admin/login" replace />;
  if (requireSuperAdmin && profile?.role !== "super_admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}
