import React, { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import StudentDashboard from './student/StudentDashboard';
import CitizenDashboard from './citizen/CitizenDashboard';

export const Dashboard = () => {
  const { user, logout } = useAuthStore();

  // Admin accounts must use the isolated admin panel — NOT this app
  useEffect(() => {
    if (user?.role === 'admin') {
      logout(); // clear their session from the public app
    }
  }, [user]);

  if (!user) {
    return <div className="page flex-center"><p>Loading session…</p></div>;
  }

  // Admin: show a redirect notice instead of any dashboard
  if (user.role === 'admin') {
    return (
      <div className="page flex-center" style={{ flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem' }}>🔐</div>
        <h2>Admin Panel Access</h2>
        <p style={{ maxWidth: '400px' }}>
          Admin accounts are managed in a separate, secure control panel.
          You have been signed out of this app.
        </p>
        <a
          href="http://localhost:5174"
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
