import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export const Register = () => {
  const { register, loading } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(searchParams.get('role') === 'citizen' ? 'citizen' : 'student');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Password strength checks — must match backend validator exactly
  const pwChecks = {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number:    /[0-9]/.test(password),
  };
  const pwStrong = pwChecks.length && pwChecks.uppercase && pwChecks.number;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Full name is required.'); return; }
    if (!email.trim()) { setError('Email address is required.'); return; }
    if (!pwStrong) {
      setError('Password must be at least 8 characters, include one uppercase letter and one number.');
      return;
    }
    const res = await register(name.trim(), email.trim(), password, role);
    if (res.success) {
      toast.success('Welcome! Your account has been created.');
      navigate('/dashboard');
    } else {
      setError(res.error || 'Registration failed. Please try again.');
    }
  };

  const isStudent = role === 'student';

  return (
    <div className="page flex-center" style={{ padding: '16px', background: 'var(--bg-base)', minHeight: '100vh' }}>
      <div 
        className="card"
        style={{
          width: '100%', maxWidth: '920px',
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '0', borderRadius: 'var(--r-xl)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--glass-border)',
        }}
      >

        {/* ── Left Panel: Role Selector ───────────────────────────────────────── */}
        <div style={{
          padding: 'clamp(24px, 5vw, 48px) clamp(20px, 4vw, 40px)',
          background: 'var(--bg-elevated)',
          borderRight: '1px solid var(--glass-border)',
          display: 'flex', flexDirection: 'column', gap: '24px',
        }}>
          <div>
            <div className="section-label" style={{ marginBottom: '16px' }}>Choose your path</div>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '8px' }}>
              Welcome to<br />
              <span style={{ color: 'var(--red)' }}>TuniVerse</span>
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {isStudent
                ? 'Academic Hub: For students applying to Tunisian universities and internships.'
                : 'Career Centre: For professionals seeking jobs or posting career opportunities.'}
            </p>
          </div>

          {/* Role Toggle */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { 
                id: 'student', 
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                ), 
                label: 'Student', 
                sub: 'Academic Hub' 
              },
              { 
                id: 'citizen', 
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                ), 
                label: 'Professional', 
                sub: 'Career Centre' 
              },
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                className="icon-btn-logo"
                style={{
                  padding: '18px 14px', borderRadius: 'var(--r-lg)', cursor: 'pointer',
                  border: `2px solid ${role === r.id ? 'var(--red)' : 'var(--glass-border)'}`,
                  background: role === r.id ? 'var(--red-subtle)' : 'var(--bg-raised)',
                  transition: 'all var(--t-base)', textAlign: 'left',
                  boxShadow: role === r.id ? '0 0 16px var(--red-glow)' : 'none',
                  color: role === r.id ? 'var(--red)' : 'var(--text-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ color: role === r.id ? 'var(--red)' : 'var(--text-primary)', marginBottom: '4px' }}>
                  {r.icon}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: role === r.id ? 'var(--red)' : 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{r.label}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.sub}</div>
              </button>
            ))}
          </div>

          {/* Feature list */}
          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '14px' }}>What you get</div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(isStudent
                ? ['Apply to universities online', 'Find & apply for internships', 'Track all applications', 'Graduate → Unlock Career Centre']
                : ['Browse & apply to job listings', 'Request recruiter permissions', 'Post jobs (admin approved)', 'Premium placement & inquiries']
              ).map(f => (
                <li key={f} style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', alignItems: 'center' }}>
                  <span style={{ color: 'var(--red)', fontWeight: 700, flexShrink: 0 }}>✓</span> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Right Panel: Form ───────────────────────────────────────────────── */}
        <div style={{
          padding: 'clamp(24px, 5vw, 48px) clamp(20px, 4vw, 40px)',
          background: 'var(--bg-surface)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '24px',
        }}>
          <div>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '6px' }}>Create your account</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Free forever. No credit card required.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Full Name */}
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Slim Ben Salah"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                placeholder="Create a strong password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              {/* Live strength checklist */}
              {password.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '8px' }}>
                  {[
                    { ok: pwChecks.length,    label: 'At least 8 characters' },
                    { ok: pwChecks.uppercase, label: 'One uppercase letter (A–Z)' },
                    { ok: pwChecks.number,    label: 'One number (0–9)' },
                  ].map(c => (
                    <div key={c.label} style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.78rem' }}>
                      <span style={{ color: c.ok ? '#34d399' : 'var(--grey-400)', fontWeight: 700, lineHeight: 1 }}>
                        {c.ok ? '✓' : '○'}
                      </span>
                      <span style={{ color: c.ok ? 'var(--text-secondary)' : 'var(--text-dim)' }}>{c.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: '12px 16px', borderRadius: 'var(--r-md)',
                background: 'rgba(225,29,72,0.08)', border: '1px solid var(--red-border)',
                color: 'var(--red-bright)', fontSize: '0.85rem', display: 'flex', gap: '8px', alignItems: 'flex-start',
              }}>
                ⚠️ <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ justifyContent: 'center', width: '100%', padding: '14px', marginTop: '4px', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? '⏳ Creating account…' : `Create ${isStudent ? 'Student' : 'Citizen'} Account`}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ fontWeight: 700, color: 'var(--red)' }}>Log in</Link>
          </p>
          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            By registering, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>

      {/* Mobile: stack vertically */}
      <style>{`
        @media (max-width: 700px) {
          div[style*="grid-template-columns: minmax(0,1fr) minmax(0,1fr)"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Register;
