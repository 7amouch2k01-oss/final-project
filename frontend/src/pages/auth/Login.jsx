import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export const Login = () => {
  const { login, loading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    const res = await login(email, password);
    if (res.success) {
      if (res.user?.role === 'admin') {
        const token = localStorage.getItem('accessToken');
        if (token) localStorage.setItem('admin_access_token', token);
      }
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else {
      setError(res.error || 'Invalid email or password.');
    }
  };

  return (
    <div className="page flex-center" style={{ padding: '24px', background: 'var(--bg-base)', minHeight: '100vh' }}>
      <div style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '0' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'var(--red)', boxShadow: '0 0 24px var(--red-glow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: '1rem',
            fontFamily: 'var(--font-display)', margin: '0 auto 16px auto'
          }}>TN</div>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '6px' }}>Welcome back</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Sign in to TuniStudy / TuniJob</p>
        </div>

        {/* Form Card */}
        <div className="card" style={{ padding: '36px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: '0.78rem', color: 'var(--red)', fontWeight: 600 }}>Forgot password?</Link>
              </div>
              <input
                type="password"
                placeholder="Your password"
                value={password} onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div style={{
                padding: '12px 16px', borderRadius: 'var(--r-md)',
                background: 'rgba(225,29,72,0.08)', border: '1px solid var(--red-border)',
                color: 'var(--red-bright)', fontSize: '0.85rem',
              }}>⚠️ {error}</div>
            )}

            <button
              type="submit" disabled={loading}
              className="btn btn-primary"
              style={{ justifyContent: 'center', width: '100%', padding: '13px', marginTop: '4px', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? '⏳ Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '20px' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ fontWeight: 700, color: 'var(--red)' }}>Create one free</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
