import React, { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import StudentDashboard from './student/StudentDashboard';
import CitizenDashboard from './citizen/CitizenDashboard';

export const Dashboard = () => {
  const { user } = useAuthStore();

  // If user is admin, redirect directly to the dedicated admin panel
  useEffect(() => {
    if (user?.role === 'admin') {
      const targetUrl = window.location.port === '5173' ? 'http://localhost:5174/admin/dashboard' : '/admin/dashboard';
      window.location.href = targetUrl;
    }
  }, [user]);

  if (!user) {
    return <div className="page flex-center"><p>Loading session…</p></div>;
  }

  // Admin redirect fallback notice
  if (user.role === 'admin') {
    const adminUrl = window.location.port === '5173' ? 'http://localhost:5174/admin/dashboard' : '/admin/dashboard';
    return (
      <div className="page flex-center" style={{ flexDirection: 'column', gap: '20px', textAlign: 'center', minHeight: '60vh' }}>
        <div style={{ fontSize: '3rem' }}>🔐</div>
        <h2>Admin Panel Access</h2>
        <p style={{ maxWidth: '440px', color: 'var(--text-secondary)' }}>
          Redirecting you to the secure TuniAdmin Control Panel...
        </p>
        <a
          href={adminUrl}
          className="btn btn-primary"
          style={{ textDecoration: 'none' }}
        >
          Open Admin Control Panel →
        </a>
      </div>
    );
  }

  if (user.role === 'citizen') return <CitizenDashboard />;

  return <StudentDashboard />;
};

export default Dashboard;
