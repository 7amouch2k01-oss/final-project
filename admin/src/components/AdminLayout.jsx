import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminStore } from '../store/adminStore';

const NAV = [
  { 
    label: 'Overview',          
    path: '/dashboard',    
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ) 
  },
  { 
    label: 'Users',             
    path: '/users',        
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ) 
  },
  { 
    label: 'Institutions',      
    path: '/institutions', 
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
        <path d="M9 22v-4h6v4" />
        <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
      </svg>
    ) 
  },
  { 
    label: 'Recruiter Requests',
    path: '/recruiters',   
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <polyline points="17 11 19 13 23 9" />
      </svg>
    ) 
  },
  { 
    label: 'Baccalaureate Queue',
    path: '/bac-verifications',   
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ) 
  },
  { 
    label: 'Universities',      
    path: '/universities', 
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ) 
  },
  { 
    label: 'Jobs & Stages',     
    path: '/listings',     
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ) 
  },
  { 
    label: 'Settings',          
    path: '/settings',     
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ) 
  },
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
