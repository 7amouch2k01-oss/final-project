import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../api/axiosInstance';
import io from 'socket.io-client';

export const Navbar = () => {
  const { user, logout } = useAuthStore();
  const { brandName, updateThemeByRole, mode, toggleMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    if (user) updateThemeByRole(user.role);
    else updateThemeByRole('student');
  }, [user]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchNotifs = async () => {
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data.data.notifications || []);
        setUnread(res.data.data.unreadCount || 0);
      } catch {}
    };
    fetchNotifs();

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
    socket.emit('join', user._id);
    if (user.role === 'admin') socket.emit('join:admin');
    socket.on('notification:new', (n) => {
      setNotifications(prev => [n, ...prev]);
      setUnread(prev => prev + 1);
    });
    return () => socket.disconnect();
  }, [user]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = async () => { await logout(); navigate('/'); };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setUnread(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

  const isActive = (path) => location.pathname === path;

  const NavLink = ({ to, children }) => (
    <Link
      to={to}
      style={{
        fontSize: '0.85rem',
        fontWeight: 500,
        fontFamily: 'var(--font-display)',
        color: isActive(to) ? 'var(--text-primary)' : 'var(--text-secondary)',
        padding: '6px 14px',
        borderRadius: 'var(--r-md)',
        background: isActive(to) ? 'var(--red-subtle)' : 'transparent',
        borderBottom: isActive(to) ? '2px solid var(--red)' : '2px solid transparent',
        transition: 'all var(--t-fast)',
        letterSpacing: '0.01em',
        position: 'relative',
      }}
      onMouseEnter={e => {
        if (!isActive(to)) {
          e.currentTarget.style.color = 'var(--text-primary)';
          e.currentTarget.style.background = 'var(--glass-bg)';
        }
      }}
      onMouseLeave={e => {
        if (!isActive(to)) {
          e.currentTarget.style.color = 'var(--text-secondary)';
          e.currentTarget.style.background = 'transparent';
        }
      }}
    >
      {children}
    </Link>
  );

  const brandLabel = brandName === 'TuniStudy' ? 'TS' : brandName === 'TuniJob' ? 'TJ' : 'TA';

  return (
    <>
      <nav style={{
        background: scrolled
          ? 'var(--glass-bg-2)'
          : 'var(--glass-bg)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderBottom: '1px solid var(--glass-border)',
        boxShadow: scrolled ? 'var(--shadow-md)' : 'none',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        padding: '0 24px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'background var(--t-base), box-shadow var(--t-base), border-color var(--t-base)',
      }}>
        {/* Left: Logo + Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Link 
            to={
              location.pathname.startsWith('/institution') || localStorage.getItem('institutionToken')
                ? '/institution/dashboard'
                : user
                ? '/dashboard'
                : '/'
            } 
            style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}
          >
            <div style={{
              width: '34px', height: '34px',
              borderRadius: '9px',
              background: 'var(--red)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: '0.85rem',
              fontFamily: 'var(--font-display)',
              flexShrink: 0,
              boxShadow: '0 0 14px var(--red-glow)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'box-shadow var(--t-base), transform var(--t-fast)',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 0 28px var(--red-glow)';
                e.currentTarget.style.transform = 'scale(1.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '0 0 14px var(--red-glow)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {brandLabel}
            </div>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '1.05rem',
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
            }}>
              {brandName}
            </span>
          </Link>

          {user && (
            <div className="hide-mobile" style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/universities">Universities</NavLink>
              <NavLink to="/stages">Internships</NavLink>
              {user.role !== 'student' && <NavLink to="/jobs">Jobs</NavLink>}
              {user.role === 'citizen' && user.recruitRights?.status === 'approved' && (
                <NavLink to="/recruiter">Recruiter Hub</NavLink>
              )}
            </div>
          )}
        </div>

        {/* Right: Theme Toggle + Auth + Notifs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          
          {/* Admin Panel Quick Link for Admins */}
          {user?.role === 'admin' && (
            <a
              href="/admin"
              className="btn btn-secondary btn-sm hide-mobile"
              style={{
                borderColor: 'var(--red-border)',
                background: 'var(--red-subtle)',
                color: 'var(--red-bright)',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              🛡️ Admin Panel
            </a>
          )}

          {/* Light / Dark Mode Logo Button (B&W to Red on Hover) */}
          <button
            onClick={toggleMode}
            className="icon-btn-logo"
            title={mode === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle Theme"
            style={{
              width: '40px', height: '40px',
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(14px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all var(--t-fast)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {mode === 'dark' ? (
              // Sun icon for switching to light mode
              <svg 
                className="btn-svg-logo"
                width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              // Moon icon for switching to dark mode
              <svg 
                className="btn-svg-logo"
                width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>

          {user ? (
            <>
              {/* Notification Bell Logo Button (B&W to Red on Hover) */}
              <div ref={notifRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  aria-label="Notifications"
                  className="icon-btn-logo"
                  style={{
                    width: '40px', height: '40px',
                    borderRadius: 'var(--r-md)',
                    border: notifOpen ? '1px solid var(--red-border)' : '1px solid var(--glass-border)',
                    background: notifOpen ? 'var(--red-subtle)' : 'var(--glass-bg)',
                    backdropFilter: 'blur(14px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all var(--t-fast)',
                  }}
                >
                  <svg 
                    className="btn-svg-logo"
                    width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                  {unread > 0 && (
                    <span style={{
                      position: 'absolute', top: '-4px', right: '-4px',
                      background: 'var(--red)', color: '#fff',
                      fontSize: '0.62rem', fontWeight: 800,
                      width: '18px', height: '18px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '2px solid var(--bg-surface)',
                      boxShadow: '0 0 8px var(--red-glow)',
                      animation: 'pulse-red 2s ease infinite',
                    }}>{unread > 9 ? '9+' : unread}</span>
                  )}
                </button>

                {notifOpen && (
                  <div style={{
                    position: 'absolute', right: 0, top: '48px',
                    width: '360px',
                    maxWidth: 'calc(100vw - 32px)',
                    background: 'var(--bg-surface)',
                    backdropFilter: 'blur(28px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--r-xl)',
                    boxShadow: 'var(--shadow-xl)',
                    overflow: 'hidden',
                    zIndex: 1001,
                    animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) both',
                  }}>
                    <div style={{
                      padding: '16px 20px',
                      borderBottom: '1px solid var(--glass-border)',
                      background: 'var(--bg-elevated)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.92rem', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                          Notifications
                        </span>
                        {unread > 0 && (
                          <span className="badge badge-accent" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                            {unread} new
                          </span>
                        )}
                      </div>
                      {unread > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: 'var(--red)', 
                            fontSize: '0.76rem', 
                            cursor: 'pointer', 
                            fontWeight: 700,
                            padding: '4px 8px',
                            borderRadius: 'var(--r-sm)',
                            transition: 'background var(--t-fast)'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--red-subtle)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                          <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>🔕</div>
                          No notifications yet
                        </div>
                      ) : notifications.map(n => (
                        <div key={n._id} style={{
                          padding: '14px 20px',
                          borderBottom: '1px solid var(--glass-border)',
                          background: n.isRead ? 'transparent' : 'var(--red-subtle)',
                          transition: 'background var(--t-fast)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '3px',
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                          onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'transparent' : 'var(--red-subtle)'}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-primary)' }}>{n.title}</span>
                            {!n.isRead && (
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--red)', flexShrink: 0, marginTop: '5px' }} />
                            )}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{n.message}</div>
                          {n.createdAt && (
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar */}
              <Link
                to="/profile"
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  textDecoration: 'none', padding: '6px 12px',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass-bg)',
                  backdropFilter: 'blur(12px)',
                  transition: 'all var(--t-fast)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--red-border)';
                  e.currentTarget.style.background = 'var(--red-subtle)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--glass-border)';
                  e.currentTarget.style.background = 'var(--glass-bg)';
                }}
              >
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name || 'User'} 
                    style={{
                      width: '26px', height: '26px', borderRadius: '50%',
                      objectFit: 'cover', flexShrink: 0,
                      border: '1px solid var(--glass-border)',
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div style={{
                  width: '26px', height: '26px', borderRadius: '50%',
                  background: 'var(--red)',
                  display: user.avatar ? 'none' : 'flex', 
                  alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 800, fontSize: '0.72rem',
                  flexShrink: 0,
                  boxShadow: '0 0 8px var(--red-glow)',
                }}>
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="hide-mobile" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                  {user.name?.split(' ')[0]}
                </span>
              </Link>

              <button onClick={handleLogout} className="btn btn-secondary btn-sm">Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/institution/login" className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--glass-border)', fontSize: '0.8rem' }}>
                Institution Portal
              </Link>
              <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            className="hide-desktop"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              width: '38px', height: '38px',
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px',
              cursor: 'pointer',
            }}
          >
            {[0,1,2].map(i => (
              <span key={i} style={{
                display: 'block', width: '18px', height: '1.5px',
                background: 'var(--text-secondary)',
                borderRadius: '2px',
                transition: 'all 0.25s ease',
                transformOrigin: 'center',
                transform: mobileOpen
                  ? i === 0 ? 'rotate(45deg) translate(4.5px, 4.5px)'
                  : i === 1 ? 'scaleX(0) opacity(0)'
                  : 'rotate(-45deg) translate(4.5px, -4.5px)'
                  : 'none',
                opacity: mobileOpen && i === 1 ? 0 : 1,
              }} />
            ))}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && user && (
        <div className="hide-desktop" style={{
          position: 'fixed', inset: 0, top: '64px',
          background: 'var(--bg-surface)',
          backdropFilter: 'blur(24px)',
          zIndex: 999,
          padding: '32px 24px',
          display: 'flex', flexDirection: 'column', gap: '8px',
          animation: 'fadeIn 0.2s ease',
        }}>
          {[
            { to: '/dashboard', label: 'Dashboard' },
            { to: '/universities', label: 'Universities' },
            { to: '/stages', label: 'Internships' },
            ...(user.role !== 'student' ? [{ to: '/jobs', label: 'Jobs' }] : []),
            ...(user.role === 'citizen' && user.recruitRights?.status === 'approved'
              ? [{ to: '/recruiter', label: 'Recruiter Hub' }] : []),
          ].map(({ to, label }) => (
            <Link
              key={to} to={to}
              style={{
                padding: '14px 18px', fontSize: '1.05rem', fontWeight: 600,
                fontFamily: 'var(--font-display)',
                color: isActive(to) ? 'var(--red)' : 'var(--text-secondary)',
                borderRadius: 'var(--r-lg)',
                background: isActive(to) ? 'var(--red-subtle)' : 'transparent',
                border: `1px solid ${isActive(to) ? 'var(--red-border)' : 'transparent'}`,
                transition: 'all var(--t-fast)',
              }}
            >
              {label}
            </Link>
          ))}
          <div style={{ marginTop: '16px', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
            <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
