import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../store/adminStore';

export default function AdminLogin() {
  const { login, loading } = useAdminStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('All fields are required.'); return; }
    const res = await login(email, password);
    if (res.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(res.error || 'Login failed.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '400px',
        background: 'rgba(225, 29, 72, 0.12)', filter: 'blur(120px)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: '420px',
        background: 'rgba(17,17,17,0.85)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '20px',
        padding: '44px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 8px 24px rgba(0,0,0,0.6)',
        animation: 'fadeUp 0.5s ease both',
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: '#e11d48',
            boxShadow: '0 0 28px rgba(225,29,72,0.4)',
            margin: '0 auto 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', fontWeight: 800, color: '#fff',
            fontFamily: "'Space Grotesk', sans-serif",
          }}>TA</div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.03em', fontFamily: "'Space Grotesk', sans-serif" }}>
            TuniAdmin
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#606060', margin: 0 }}>
            Secure Control Panel — Authorized Access Only
          </p>

          {/* Warning notice */}
          <div style={{
            marginTop: '18px', padding: '11px 14px',
            background: 'rgba(225,29,72,0.07)',
            border: '1px solid rgba(225,29,72,0.2)',
            borderRadius: '10px', fontSize: '0.78rem',
            color: '#f87171', display: 'flex', alignItems: 'flex-start', gap: '8px', textAlign: 'left',
          }}>
            <span>🔐</span>
            <span>This area is restricted to administrators only. Unauthorized access attempts are logged.</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.03em', color: '#c0c0c0' }}>
              Admin Email
            </label>
            <input
              type="email"
              placeholder="admin@tunistudy.tn"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="username"
              style={{
                width: '100%', padding: '11px 16px',
                fontFamily: 'inherit', fontSize: '0.875rem',
                color: '#fff', background: '#1a1a1a',
                border: '1px solid #2a2a2a', borderRadius: '10px',
                outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              }}
              onFocus={e => { e.target.style.borderColor = '#e11d48'; e.target.style.boxShadow = '0 0 0 3px rgba(225,29,72,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = '#2a2a2a'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.03em', color: '#c0c0c0' }}>
              Password
            </label>
            <input
              type="password"
              placeholder="Your admin password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              style={{
                width: '100%', padding: '11px 16px',
                fontFamily: 'inherit', fontSize: '0.875rem',
                color: '#fff', background: '#1a1a1a',
                border: '1px solid #2a2a2a', borderRadius: '10px',
                outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              }}
              onFocus={e => { e.target.style.borderColor = '#e11d48'; e.target.style.boxShadow = '0 0 0 3px rgba(225,29,72,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = '#2a2a2a'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {error && (
            <div style={{
              padding: '11px 16px', borderRadius: '10px',
              background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.25)',
              color: '#ff2251', fontSize: '0.85rem',
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '13px',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '0.9rem', fontWeight: 700,
              color: '#fff',
              background: loading ? '#7f1d33' : '#e11d48',
              border: '1px solid #9f0f2e',
              borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 12px rgba(225,29,72,0.35)',
              transition: 'all 0.2s ease',
              marginTop: '4px',
              opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={e => { if (!loading) { e.target.style.background = '#ff2251'; e.target.style.boxShadow = '0 4px 24px rgba(225,29,72,0.5)'; }}}
            onMouseLeave={e => { e.target.style.background = loading ? '#7f1d33' : '#e11d48'; e.target.style.boxShadow = '0 2px 12px rgba(225,29,72,0.35)'; }}
          >
            {loading ? '⏳ Authenticating…' : '🔒 Sign In to Control Panel'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#404040', marginTop: '24px', lineHeight: 1.6 }}>
          This panel is not linked to the public website.<br />All sessions are monitored and logged.
        </p>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        input::placeholder { color: #404040; }
      `}</style>
    </div>
  );
}
