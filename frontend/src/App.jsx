import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { useInstitutionStore } from './store/institutionStore';
import { ThemeProvider } from './contexts/ThemeContext';
import { initNativeFeatures } from './native/capacitorBridge';
import Layout from './components/layout/Layout';
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Dashboard from './pages/Dashboard';
import Universities from './pages/student/Universities';
import Stages from './pages/student/Stages';
import Jobs from './pages/citizen/Jobs';
import UserProfile from './pages/UserProfile';
import RecruiterHub from './pages/citizen/RecruiterHub';
import ProStudentHub from './pages/student/ProStudentHub';
import PartTimeJobs from './pages/student/PartTimeJobs';
import AppUpdateModal from './components/common/AppUpdateModal';

// Institution Portal Pages
import InstitutionRegister from './pages/institution/InstitutionRegister';
import InstitutionLogin from './pages/institution/InstitutionLogin';
import InstitutionDashboard from './pages/institution/InstitutionDashboard';

// Protected Route Wrapper — only for authenticated users
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuthStore();

  if (loading) {
    return <div className="page flex-center">🌀 Loading session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Guest Route Wrapper — redirects logged-in users to /dashboard
const GuestRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuthStore();

  if (loading) {
    return <div className="page flex-center">🌀 Loading session...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Institution Protected Guard
const InstitutionRoute = ({ children }) => {
  const { isAuthenticated } = useInstitutionStore();
  if (!isAuthenticated) {
    return <Navigate to="/institution/login" replace />;
  }
  return children;
};

// Recruiter Hub Guard
const RecruiterRoute = ({ children }) => {
  const { user } = useAuthStore();
  if (user?.role === 'citizen' && user.recruitRights?.status === 'approved') {
    return children;
  }
  return <Navigate to="/dashboard" replace />;
};

function App() {
  const { checkAuth } = useAuthStore();
  const { fetchProfile } = useInstitutionStore();

  useEffect(() => {
    initNativeFeatures();
    checkAuth();
    if (localStorage.getItem('institutionToken')) {
      fetchProfile();
    }
  }, []);

  return (
    <ThemeProvider>
      <Router>
        <Layout>
          <Routes>
            {/* Guest-only routes */}
            <Route path="/"         element={<GuestRoute><LandingPage /></GuestRoute>} />
            <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
            <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
            <Route path="/reset-password/:token" element={<GuestRoute><ResetPassword /></GuestRoute>} />

            {/* Institution Portal Routes */}
            <Route path="/institution/register" element={<InstitutionRegister />} />
            <Route path="/institution/login"    element={<InstitutionLogin />} />
            <Route path="/institution/dashboard" element={
              <InstitutionRoute>
                <InstitutionDashboard />
              </InstitutionRoute>
            } />

            {/* Protected user routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/student/pro" element={
              <ProtectedRoute>
                <ProStudentHub />
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } />

            <Route path="/universities" element={
              <ProtectedRoute>
                <Universities />
              </ProtectedRoute>
            } />

            <Route path="/stages" element={
              <ProtectedRoute>
                <Stages />
              </ProtectedRoute>
            } />

            <Route path="/student/part-time-jobs" element={
              <ProtectedRoute allowedRoles={['student', 'admin']}>
                <PartTimeJobs />
              </ProtectedRoute>
            } />

            {/* Citizen only */}
            <Route path="/jobs" element={
              <ProtectedRoute allowedRoles={['citizen', 'admin']}>
                <Jobs />
              </ProtectedRoute>
            } />

            {/* Approved Recruiter only */}
            <Route path="/recruiter" element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <RecruiterRoute>
                  <RecruiterHub />
                </RecruiterRoute>
              </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
        <AppUpdateModal />
        <Toaster position="bottom-right" />
      </Router>
    </ThemeProvider>
  );
}

export default App;
