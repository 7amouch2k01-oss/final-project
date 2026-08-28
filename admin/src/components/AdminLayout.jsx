import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminStore } from '../store/adminStore';

const NAV = [
  { label: 'Overview',          path: '/dashboard',    icon: '📊' },
  { label: 'Users',             path: '/users',        icon: '👥' },
  { label: 'Institutions',      path: '/institutions', icon: '🏛️' },
  { label: 'Recruiter Requests',path: '/recruiters',   icon: '🏢' },
  { label: 'Universities',      path: '/universities', icon: '🎓' },
  { label: 'Jobs & Stages',     path: '/listings',     icon: '💼' },
  { label: 'Settings',          path: '/settings',     icon: '⚙️' },
];

export default function AdminLayout({ children }) {
  const { admin, logout } = useAdminStore();
  const navigate = useNavigate();
  const [mode, setMode] = useState(() => localStorage.getItem('admin-theme-mode') || 'dark');
  const [pendingCounts, setPendingCounts] = useState({ institutions: 0, recruiters: 0 });

  useEffect(() => {
    document.documentElement.setAttribute('data-mode', mode);
  }, [mode]);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const [instRes, recruitRes] = await Promise.all([
          api.get('/admin/institutions?status=pending'),
          api.get('/admin/recruit-requests'),
        ]);
        setPendingCounts({
          institutions: instRes.data.data?.institutions?.length || 0,
          recruiters: recruitRes.data.data?.requests?.length || 0,
        });
      } catch (e) {}
    };
    fetchBadges();
    const interval = setInterval(fetchBadges, 15000);
    return () => clearInterval(interval);
  }, []);

  const toggleMode = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    localStorage.setItem('admin-theme-mode', next);
  };

  const handleLogout = async () => { await logout(); navigate('/'); };

  return (
    <div className="admin-layout" style={{ position: 'relative' }}>
      {/* Clean Static Ambient Grid */}
      <div className="animated-bg-wrapper" aria-hidden="true">
        <div className="bg-grid-mesh" />
      </div>

      {/* Sidebar */}
      <aside className="sidebar" style={{ zIndex: 100 }}>
        <div className="sidebar-brand">
          <div className="sidebar-logo" style={{ overflow: 'hidden', padding: '4px' }}>
            <svg width="24" height="24" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 52 Q50 38 82 52" stroke="white" strokeWidth="9" fill="none" strokeLinecap="round"/>
              <rect x="44.5" y="48" width="11" height="28" rx="3" fill="white"/>
              <polygon points="50,18 41,38 59,38" fill="white"/>
            </svg>
          </div>
          <div>
            <div className="sidebar-title">TuniVerse</div>
            <div className="sidebar-subtitle">Control Centre</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {NAV.map(item => {
            const badgeCount = item.path === '/institutions' 
              ? pendingCounts.institutions 
              : item.path === '/recruiters' 
              ? (pendingCounts.recruiters + pendingCounts.institutions) 
              : 0;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="icon">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {badgeCount > 0 && (
                  <span style={{ 
                    background: '#ef4444', 
                    color: '#fff', 
                    fontSize: '0.68rem', 
                    padding: '1px 6px', 
                    borderRadius: '10px', 
                    fontWeight: 800,
                    boxShadow: '0 0 8px rgba(239,68,68,0.5)' 
                  }}>
                    {badgeCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          {/* Admin info */}
          <div style={{ padding: '10px', background: 'var(--accent-light)', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '8px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)' }}>{admin?.name || 'Admin User'}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-sec)', marginTop: '2px' }}>{admin?.email}</div>
            <div style={{ marginTop: '6px' }}><span style={{ fontSize: '0.65rem', background: 'var(--accent)', color: '#fff', padding: '2px 8px', borderRadius: '20px', fontWeight: 700 }}>ADMIN</span></div>
          </div>
          <button className="nav-link" onClick={handleLogout} style={{ color: 'var(--red)', width: '100%' }}>
            <span className="icon">🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content" style={{ position: 'relative', zIndex: 1 }}>
        {/* Topbar */}
        <header className="topbar">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-sec)' }}>
            TuniAdmin — <span style={{ color: 'var(--text)', fontWeight: 600 }}>Secure Control Panel</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Mode toggle */}
            <button
              onClick={toggleMode}
              title={mode === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              style={{
                width: '36px', height: '36px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                cursor: 'pointer',
                fontSize: '1rem',
                color: 'var(--text)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              {mode === 'dark' ? '☀️' : '🌙'}
            </button>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-sec)', background: 'var(--surface-raised)', border: '1px solid var(--border)', padding: '4px 12px', borderRadius: '20px' }}>
              🔐 Port 5174
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1 }}>{children}</main>
      </div>
    </div>
  );
}
