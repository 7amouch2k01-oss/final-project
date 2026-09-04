import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password requirements
  const pwChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const pwStrong = pwChecks.length && pwChecks.uppercase && pwChecks.number;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid or missing password reset token.');
      return;
    }

    if (!pwStrong) {
      setError('Password must be at least 8 characters, include at least one uppercase letter and one number.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post(`/auth/reset-password/${token}`, { password });
      if (res.data?.success) {
        const { accessToken, user } = res.data.data;
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
        }
        if (user && setUser) {
          setUser(user);
        }
        toast.success('Password updated successfully! Welcome back.');
        navigate('/dashboard');
      } else {
        setError(res.data?.message || 'Password reset failed.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'The reset link is invalid or has expired. Please request a new one.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page flex-center" style={{ padding: '16px', background: 'var(--bg-base)', minHeight: '100vh' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: 'var(--r-xl)',
            background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', margin: '0 auto 16px auto',
            overflow: 'hidden',
          }}>
            <svg width="34" height="34" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 52 Q50 38 82 52" stroke="white" strokeWidth="9" fill="none" strokeLinecap="round"/>
              <rect x="44.5" y="48" width="11" height="28" rx="3" fill="white"/>
              <polygon points="50,18 41,38 59,38" fill="white"/>
            </svg>
          </div>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '6px' }}>Set New Password</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Enter your new secure password below
          </p>
        </div>

        {/* Form Card */}
        <div className="card" style={{ padding: 'clamp(20px, 5vw, 36px)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            {/* Password Criteria Checklist */}
            <div style={{
              padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)',
              border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '6px',
            }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>PASSWORD CRITERIA:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: pwChecks.length ? '#10B981' : 'var(--text-muted)' }}>
                <span>{pwChecks.length ? '✓' : '○'}</span> At least 8 characters
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: pwChecks.uppercase ? '#10B981' : 'var(--text-muted)' }}>
                <span>{pwChecks.uppercase ? '✓' : '○'}</span> At least one uppercase letter (A-Z)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: pwChecks.number ? '#10B981' : 'var(--text-muted)' }}>
                <span>{pwChecks.number ? '✓' : '○'}</span> At least one number (0-9)
              </div>
            </div>

            {error && (
              <div style={{
                padding: '12px 16px', borderRadius: 'var(--r-md)',
                background: 'rgba(225,29,72,0.08)', border: '1px solid var(--red-border)',
                color: 'var(--red-bright)', fontSize: '0.85rem',
              }}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ justifyContent: 'center', width: '100%', padding: '13px', marginTop: '4px', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Updating Password...' : 'Save & Log In'}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '20px' }}>
          Back to{' '}
          <Link to="/login" style={{ fontWeight: 700, color: 'var(--red)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
