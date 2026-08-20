import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useInstitutionStore } from '../../store/institutionStore';
import toast from 'react-hot-toast';

export const InstitutionLogin = () => {
  const { login, loading, error } = useInstitutionStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    const res = await login(email.trim(), password);
    if (res.success) {
      toast.success(`Welcome, ${res.institution.name}!`);
      navigate('/institution/dashboard');
    } else {
      toast.error(res.error || 'Login failed');
    }
  };

  return (
    <div className="page flex-center" style={{ padding: '32px 20px', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'var(--red)', boxShadow: '0 0 24px var(--red-glow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: '1.4rem',
            margin: '0 auto 16px auto'
          }}>
            🏛️
          </div>
          <div className="section-label" style={{ justifyContent: 'center' }}>Portal Access</div>
          <h2 style={{ fontSize: '1.8rem', margin: '6px 0' }}>Institution Sign In</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            For Universities, Schools, and Hiring Companies
          </p>
        </div>

        {/* Card */}
        <div className="card glass" style={{ padding: '36px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="form-group">
              <label className="form-label">Official Institution Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="contact@esprit.tn or hr@company.com" 
                required 
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="Your password" 
                required 
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div style={{
                padding: '12px 16px', borderRadius: 'var(--r-md)',
                background: 'rgba(225,29,72,0.08)', border: '1px solid var(--red-border)',
                color: 'var(--red-bright)', fontSize: '0.85rem'
              }}>
                ⚠️ {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', justifyContent: 'center', fontSize: '1rem', marginTop: '4px' }}
            >
              {loading ? '⏳ Authenticating...' : 'Sign In to Dashboard →'}
            </button>
          </form>

          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--glass-border)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Need to register your university or company?{' '}
              <Link to="/institution/register" style={{ fontWeight: 700, color: 'var(--red)' }}>
                Register here
              </Link>
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '8px' }}>
              Are you a student or individual citizen? <Link to="/login" style={{ color: 'var(--text-secondary)' }}>Standard Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstitutionLogin;
