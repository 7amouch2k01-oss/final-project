import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      if (res.data?.success) {
        setSubmitted(true);
        toast.success('Reset link prepared successfully!');
      } else {
        setError(res.data?.message || 'Unable to process request.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please check your connection.';
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
          <h2 style={{ fontSize: '1.6rem', marginBottom: '6px' }}>Reset your password</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Enter your email to receive a secure password recovery link
          </p>
        </div>

        {/* Form Card */}
        <div className="card" style={{ padding: 'clamp(20px, 5vw, 36px)' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.8rem', margin: '0 auto',
              }}>
                ✓
              </div>
              <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>Check your inbox</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                If an account with <strong style={{ color: 'var(--text-primary)' }}>{email}</strong> exists, we have dispatched a password reset link.
              </p>
              <div style={{
                padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)',
                fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'left',
              }}>
                💡 <strong>Tip:</strong> The reset link is valid for 1 hour. Please check your spam/junk folder if you don't see it within a few minutes.
              </div>
              <Link to="/login" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
                Return to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="form-group">
                <label className="form-label">Account Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. your-email@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
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
                {loading ? 'Sending link...' : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>

        {/* Footer link */}
        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '20px' }}>
          Remembered your password?{' '}
          <Link to="/login" style={{ fontWeight: 700, color: 'var(--red)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
