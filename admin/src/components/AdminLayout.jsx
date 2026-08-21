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

  useEffect(() => {
    document.documentElement.setAttribute('data-mode', mode);
  }, [mode]);

  const toggleMode = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    localStorage.setItem('admin-theme-mode', next);
  };

  const handleLogout = async () => { await logout(); navigate('/'); };

  return (
    <div className="admin-layout" style={{ position: 'relative' }}>
      {/* Animated Background Laser / Grid Lines moving Right to Left */}
      <div className="animated-bg-wrapper" aria-hidden="true">
        <div className="bg-grid-mesh" />
        <div className="laser-beam vertical beam-1" />
        <div className="laser-beam vertical beam-2" />
        <div className="laser-line-h h-line-1" />
        <div className="laser-line-h h-line-2" />
      </div>

      {/* Sidebar */}
      <aside className="sidebar" style={{ zIndex: 100 }}>
        <div className="sidebar-brand">
          <div className="sidebar-logo">TA</div>
          <div>
            <div className="sidebar-title">TuniAdmin</div>
            <div className="sidebar-subtitle">Control Panel</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {NAV.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
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
