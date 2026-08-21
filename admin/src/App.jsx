import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAdminStore } from './store/adminStore';
import AdminLogin from './pages/AdminLogin';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Recruiters from './pages/Recruiters';
import Institutions from './pages/Institutions';
import Universities from './pages/Universities';
import Listings from './pages/Listings';
import Settings from './pages/Settings';
import './styles/admin.css';

// Guard: Only authenticated admins can see protected routes
function ProtectedRoute({ children }) {
  const { admin, initialized } = useAdminStore();
  if (!initialized) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b' }}>Verifying session…</div>;
  if (!admin) return <Navigate to="/" replace />;
  return <AdminLayout>{children}</AdminLayout>;
}

function PublicRoute({ children }) {
  const { admin, initialized } = useAdminStore();
  if (!initialized) return null;
  if (admin) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const { initialize } = useAdminStore();

  useEffect(() => { initialize(); }, []);

  return (
    <BrowserRouter basename="/admin">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        {/* Public: Login */}
        <Route path="/" element={<PublicRoute><AdminLogin /></PublicRoute>} />

        {/* Protected: All admin pages */}
        <Route path="/dashboard"    element={<ProtectedRoute><Dashboard    /></ProtectedRoute>} />
        <Route path="/users"        element={<ProtectedRoute><Users        /></ProtectedRoute>} />
        <Route path="/institutions" element={<ProtectedRoute><Institutions /></ProtectedRoute>} />
        <Route path="/recruiters"   element={<ProtectedRoute><Recruiters   /></ProtectedRoute>} />
        <Route path="/universities" element={<ProtectedRoute><Universities /></ProtectedRoute>} />
        <Route path="/listings"     element={<ProtectedRoute><Listings     /></ProtectedRoute>} />
        <Route path="/settings"     element={<ProtectedRoute><Settings     /></ProtectedRoute>} />

        {/* Catch-all: send unknown routes to dashboard if authed, else to login */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// Simple placeholder for pages not yet built
function PlaceholderPage({ title, icon }) {
  return (
    <div className="page fade-in">
      <div style={{ textAlign: 'center', padding: '64px 24px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>{icon}</div>
        <h2 style={{ marginBottom: '8px' }}>{title}</h2>
        <p>This section is coming soon.</p>
      </div>
    </div>
  );
}
