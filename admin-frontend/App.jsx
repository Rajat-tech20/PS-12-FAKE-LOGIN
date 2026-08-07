import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";
import Login from "./pages/Login";
import DashboardHome from "./pages/DashboardHome";
import FingerprintList from "./pages/FingerprintList";
import FingerprintPublish from "./pages/FingerprintPublish";
import AuditLog from "./pages/AuditLog";
import ScanStats from "./pages/ScanStats";
import ManageColleges from "./pages/ManageColleges";
import ManageAdmins from "./pages/ManageAdmins";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

          {/* Admin Portal Authentication */}
          <Route path="/admin/login" element={<Login />} />

          {/* Protected Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <DashboardHome />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/fingerprints"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <FingerprintList />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/fingerprints/new"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <FingerprintPublish />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/fingerprints/:id/edit"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <FingerprintPublish />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit-log"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <AuditLog />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/scan-stats"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <ScanStats />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Super Admin Restricted Routes */}
          <Route
            path="/admin/colleges"
            element={
              <ProtectedRoute requireSuperAdmin>
                <AdminLayout>
                  <ManageColleges />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/admins"
            element={
              <ProtectedRoute requireSuperAdmin>
                <AdminLayout>
                  <ManageAdmins />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
