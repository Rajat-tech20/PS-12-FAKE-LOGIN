# Routes to add to your existing App.jsx

Don't restructure your existing app — just add these routes and this one wrapper
at your app's root alongside whatever router setup already exists.

```jsx
import { AuthProvider } from "./admin-frontend/context/AuthContext";
import ProtectedRoute from "./admin-frontend/components/ProtectedRoute";
import Login from "./admin-frontend/pages/Login";
import DashboardHome from "./admin-frontend/pages/DashboardHome";
import FingerprintList from "./admin-frontend/pages/FingerprintList";
import FingerprintPublish from "./admin-frontend/pages/FingerprintPublish";
import AuditLog from "./admin-frontend/pages/AuditLog";
import ScanStats from "./admin-frontend/pages/ScanStats";
import ManageColleges from "./admin-frontend/pages/ManageColleges";
import ManageAdmins from "./admin-frontend/pages/ManageAdmins";

// Wrap your whole app (or just the /admin subtree) in <AuthProvider>:
// <AuthProvider> ... existing app ... </AuthProvider>

// Add these <Route> entries inside your existing <Routes>:
<Route path="/admin/login" element={<Login />} />
<Route path="/admin/dashboard" element={<ProtectedRoute><DashboardHome /></ProtectedRoute>} />
<Route path="/admin/fingerprints" element={<ProtectedRoute><FingerprintList /></ProtectedRoute>} />
<Route path="/admin/fingerprints/new" element={<ProtectedRoute><FingerprintPublish /></ProtectedRoute>} />
<Route path="/admin/fingerprints/:id/edit" element={<ProtectedRoute><FingerprintPublish /></ProtectedRoute>} />
<Route path="/admin/audit-log" element={<ProtectedRoute><AuditLog /></ProtectedRoute>} />
<Route path="/admin/scan-stats" element={<ProtectedRoute><ScanStats /></ProtectedRoute>} />
<Route path="/admin/colleges" element={<ProtectedRoute requireSuperAdmin><ManageColleges /></ProtectedRoute>} />
<Route path="/admin/admins" element={<ProtectedRoute requireSuperAdmin><ManageAdmins /></ProtectedRoute>} />
```

## Env vars needed (.env, not committed)
```
VITE_SUPABASE_URL=https://qkckeocbjtpzfwjonuvm.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key-here
```

## Install dependency
```
npm install @supabase/supabase-js react-router-dom
```
