import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useInstitutionStore } from '../../store/institutionStore';
import toast from 'react-hot-toast';

export const InstitutionRegister = () => {
  const { register, loading, error } = useInstitutionStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    type: 'university', // 'university', 'school', 'company'
    email: '',
    password: '',
    confirmPassword: '',
    location: '',
    country: 'Tunisia',
    website: '',
    phone: '',
    description: '',
  });

  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    const res = await register({
      name: formData.name.trim(),
      type: formData.type,
      email: formData.email.trim(),
      password: formData.password,
      location: formData.location.trim(),
      country: formData.country,
      website: formData.website.trim(),
      phone: formData.phone.trim(),
      description: formData.description.trim(),
    });

    if (res.success) {
      setSubmittedSuccess(true);
      toast.success('Registration request submitted! Awaiting admin approval.');
    } else {
      toast.error(res.error || 'Failed to submit registration');
    }
  };

  if (submittedSuccess) {
    return (
      <div className="page flex-center" style={{ padding: '32px', minHeight: '80vh' }}>
        <div className="card glass animate-scale-in" style={{ maxWidth: '540px', padding: '40px', textAlign: 'center' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--bg-elevated)', border: '2px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: 'var(--text-primary)' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div className="section-label" style={{ justifyContent: 'center' }}>Registration Received</div>
          <h2 style={{ fontSize: '1.8rem', margin: '10px 0' }}>Under Admin Review</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.7, marginBottom: '24px' }}>
            Thank you for registering <strong>{formData.name}</strong> on TuniVerse. 
            Our platform administrators are reviewing your official organization credentials. You will be approved shortly.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link to="/institution/login" className="btn btn-primary">
              Go to Institution Login
            </Link>
            <Link to="/" className="btn btn-ghost">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page flex-center" style={{ padding: '32px 20px', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <div style={{ width: '100%', maxWidth: '780px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="section-label" style={{ justifyContent: 'center' }}>Organization Onboarding</div>
          <h2 style={{ fontSize: '2rem', margin: '8px 0' }}>Register Your Institution</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Join universities, schools, and companies connecting with top Tunisian candidates.
          </p>
        </div>

        {/* Form Card */}
        <div className="card glass" style={{ padding: '36px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Institution Type Selector */}
            <div>
              <label className="form-label">Organization Type *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[
                  { id: 'university', icon: '🏛️', label: 'University', sub: 'Higher Education' },
                  { id: 'school', icon: '🏫', label: 'School / Institute', sub: 'Programs & Courses' },
                  { id: 'company', icon: '🏢', label: 'Company / Business', sub: 'Hiring & Stages' },
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: t.id })}
                    style={{
                      padding: '16px 12px',
                      borderRadius: 'var(--r-lg)',
                      border: `2px solid ${formData.type === t.id ? 'var(--red)' : 'var(--glass-border)'}`,
                      background: formData.type === t.id ? 'var(--red-subtle)' : 'var(--bg-elevated)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all var(--t-fast)',
                      boxShadow: formData.type === t.id ? '0 0 16px var(--red-glow)' : 'none',
                    }}
                  >
                    <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{t.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: formData.type === t.id ? 'var(--red)' : 'var(--text-primary)' }}>{t.label}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Organization / Company Name *</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  placeholder="e.g. ESPRIT, Université de Tunis, Vermeg" 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Official Work / Admin Email *</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  placeholder="admissions@esprit.tn or hr@vermeg.com" 
                  required 
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input 
                  type="password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  placeholder="At least 8 characters" 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password *</label>
                <input 
                  type="password" 
                  name="confirmPassword" 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                  placeholder="Re-enter password" 
                  required 
                />
              </div>
            </div>

            {/* Location & Website */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">City / Headquarters</label>
                <input 
                  type="text" 
                  name="location" 
                  value={formData.location} 
                  onChange={handleChange} 
                  placeholder="e.g. Ariana, Tunis, Sousse" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Official Website</label>
                <input 
                  type="url" 
                  name="website" 
                  value={formData.website} 
                  onChange={handleChange} 
                  placeholder="https://institution.tn" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input 
                  type="tel" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  placeholder="+216 71 000 000" 
                />
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">About the Organization / Overview</label>
              <textarea 
                rows="3" 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                placeholder="Briefly describe your institution, programs offered, hiring domains, or accreditations..." 
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
              style={{ width: '100%', padding: '14px', justifyContent: 'center', fontSize: '1rem', marginTop: '6px' }}
            >
              {loading ? 'Submitting Application...' : 'Submit Registration (Requires Admin Approval)'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '24px' }}>
            Already approved?{' '}
            <Link to="/institution/login" style={{ fontWeight: 700, color: 'var(--red)' }}>
              Sign in to Institution Portal →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default InstitutionRegister;
