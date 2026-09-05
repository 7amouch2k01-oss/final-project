import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import CompleteProfileModal, { BrandLogo } from '../../components/common/CompleteProfileModal';
import { useAuthStore } from '../../store/authStore';

export const Universities = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [unis, setUnis] = useState([]);
  const [appliedUniIds, setAppliedUniIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUni, setSelectedUni] = useState(null);
  const [selectedProg, setSelectedProg] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [submittingApp, setSubmittingApp] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [profileWarning, setProfileWarning] = useState('');
  const [isCompleteProfileModalOpen, setIsCompleteProfileModalOpen] = useState(false);

  const fetchUnisAndApps = async () => {
    setLoading(true);
    try {
      const [res, myAppsRes] = await Promise.all([
        api.get(`/universities?search=${encodeURIComponent(search)}`),
        api.get('/applications/mine').catch(() => ({ data: { data: { applications: [] } } }))
      ]);
      setUnis(res.data.data.universities || []);
      const applied = new Set((myAppsRes.data.data.applications || []).map(a => a.targetId?._id || a.targetId));
      setAppliedUniIds(applied);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load universities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnisAndApps();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUnisAndApps();
  };

  const openApplyModal = (uni) => {
    setSelectedUni(uni);
    // Auto-select first program if available
    if (uni.programmes && uni.programmes.length > 0) {
      setSelectedProg(uni.programmes[0].name);
    } else {
      setSelectedProg('');
    }
  };

  const triggerShake = (warningMessage) => {
    setProfileWarning(warningMessage);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 650);
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to submit your application');
      return;
    }
    // Profile completion gate — must have name + CV + bio + baccalaureate
    const isStudent = user.role === 'student';
    const hasBac = user.baccalaureate?.school && user.baccalaureate?.proofDocUrl;

    if (!user.name || !user.name.trim() || !user.cvUrl || !user.cvUrl.trim() || !user.bio || !user.bio.trim() || (isStudent && !hasBac)) {
      triggerShake('You must complete your profile credentials and upload required documents before applying to universities.');
      toast.error('Profile incomplete: Please complete your profile to 100% first.', { duration: 4000 });
      return;
    }
    if (appliedUniIds.has(selectedUni._id)) {
      toast.error('You have already applied to this university');
      return;
    }
    setSubmittingApp(true);
    try {
      const payload = {
        targetId: selectedUni._id,
        targetType: 'University',
        targetModel: 'University',
        selectedProgramme: selectedProg,
        coverLetter: coverLetter,
        cvUrl: user.cvUrl || '',
      };

      await api.post('/applications', payload);

      toast.success('Application submitted successfully!');
      setAppliedUniIds(prev => new Set([...prev, selectedUni._id]));
      setSelectedUni(null);
      setCoverLetter('');
      setSelectedProg('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Application submission failed');
    } finally {
      setSubmittingApp(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="page container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="section-label">Academic Portal</div>
          <h2 style={{ fontSize: '1.85rem', marginTop: '4px', fontWeight: 800 }}>University & Institute Directory</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '4px 0 0' }}>
            Explore accredited Tunisian universities, higher education faculties, and specialized programmes.
          </p>
        </div>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="Search universities, programmes..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '280px', padding: '10px 14px', borderRadius: 'var(--r-md)' }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '10px 18px' }}>Search</button>
        </form>
      </div>

      {loading ? (
        <div className="flex-center" style={{ minHeight: '260px' }}>
          <div className="animate-spin" style={{ fontSize: '1.8rem', color: 'var(--red)' }}>⟳</div>
          <span style={{ marginLeft: '12px', color: 'var(--text-secondary)' }}>Loading directory...</span>
        </div>
      ) : (
        /* 4 Cards Per Row Grid */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '20px',
        }}>
          {unis.length === 0 ? (
            <div className="card flex-center" style={{ padding: '48px', gridColumn: '1 / -1', flexDirection: 'column', gap: '10px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                [0]
              </div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>No universities found</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Try adjusting your search criteria.</p>
            </div>
          ) : (
            unis.map(u => {
              const isApplied = appliedUniIds.has(u._id);
              const startDate = formatDate(u.applicationStartDate || u.createdAt);
              const endDate = formatDate(u.applicationEndDate || u.applicationDeadline);

              return (
                <div 
                  key={u._id} 
                  className="card" 
                  style={{ 
                    padding: '20px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '14px',
                    borderRadius: 'var(--r-lg)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--glass-border)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Top: Logo & Name */}
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div className="logo-container" style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: 'var(--r-md)',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--glass-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0,
                      transition: 'all var(--t-base)',
                    }}>
                      <BrandLogo logoUrl={u.logo} name={u.name} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ 
                        fontSize: '1.02rem', 
                        margin: 0, 
                        fontWeight: 700,
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        color: 'var(--text-primary)'
                      }}>
                        {u.name}
                      </h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                        {u.city}, {u.country}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p style={{ 
                    fontSize: '0.82rem', 
                    color: 'var(--text-secondary)', 
                    display: '-webkit-box', 
                    WebkitLineClamp: 2, 
                    WebkitBoxOrient: 'vertical', 
                    overflow: 'hidden',
                    lineHeight: 1.5,
                    margin: 0,
                  }}>
                    {u.description}
                  </p>

                  {/* Available Programmes / Fields Badges */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Programmes & Tracks
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {u.programmes && u.programmes.length > 0 ? (
                        u.programmes.slice(0, 3).map((p, idx) => (
                          <span 
                            key={idx}
                            style={{
                              fontSize: '0.72rem',
                              padding: '2px 8px',
                              borderRadius: 'var(--r-full)',
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--glass-border)',
                              color: 'var(--text-secondary)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {p.name}
                          </span>
                        ))
                      ) : u.fields && u.fields.length > 0 ? (
                        u.fields.slice(0, 3).map((f, idx) => (
                          <span 
                            key={idx}
                            style={{
                              fontSize: '0.72rem',
                              padding: '2px 8px',
                              borderRadius: 'var(--r-full)',
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--glass-border)',
                              color: 'var(--text-secondary)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {f}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>General Higher Education</span>
                      )}
                    </div>
                  </div>

                  {/* Application Window Date Badge */}
                  <div style={{ 
                    marginTop: 'auto',
                    padding: '8px 10px', 
                    background: 'var(--bg-elevated)', 
                    borderRadius: '8px', 
                    border: '1px solid var(--glass-border)',
                    fontSize: '0.74rem',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>Window:</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {startDate ? `${startDate} → ${endDate || 'Open'}` : 'Rolling Admissions'}
                    </span>
                  </div>

                  {/* Apply Button */}
                  <button 
                    onClick={() => openApplyModal(u)} 
                    disabled={isApplied}
                    className={`btn ${isApplied ? 'btn-secondary' : 'btn-primary'}`} 
                    style={{ width: '100%', justifyContent: 'center', padding: '9px 12px', fontSize: '0.84rem' }}
                  >
                    {isApplied ? 'Application Submitted' : 'Apply for Programme'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Simplified Apply Modal (No CV upload required, auto-attached from profile) */}
      {selectedUni && (
        <div className="modal-backdrop animate-fade-in" onClick={() => { setSelectedUni(null); setProfileWarning(''); }}>
          <div 
            className={`modal ${isShaking ? 'animate-modal-shake' : ''}`} 
            onClick={e => e.stopPropagation()} 
            style={{ maxWidth: '520px', padding: '28px', transition: 'border-color 0.3s, box-shadow 0.3s' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '14px' }}>
              <div>
                <div className="section-label" style={{ fontSize: '0.65rem' }}>Direct Course Application</div>
                <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0', fontWeight: 700 }}>{selectedUni.name}</h3>
              </div>
              <button 
                onClick={() => { setSelectedUni(null); setProfileWarning(''); }} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.3rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Incomplete Profile Warning Alert Banner with Direct Action */}
            {profileWarning && (
              <div style={{
                padding: '12px 14px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: 'var(--r-md)',
                marginBottom: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.1rem' }}>⚠️</span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#ef4444' }}>
                    Profile Completion Required
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  {profileWarning}
                </p>
                <button
                  type="button"
                  onClick={() => setIsCompleteProfileModalOpen(true)}
                  className="btn btn-primary btn-sm"
                  style={{ alignSelf: 'flex-start', marginTop: '4px', fontSize: '0.78rem', padding: '6px 14px' }}
                >
                  Complete Profile (100%) Now →
                </button>
              </div>
            )}

            <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Select Programme if multiple are offered */}
              {selectedUni.programmes && selectedUni.programmes.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Select Programme / Speciality *</label>
                  <select
                    value={selectedProg}
                    onChange={(e) => setSelectedProg(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--r-md)',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem'
                    }}
                  >
                    {selectedUni.programmes.map((p, idx) => (
                      <option key={idx} value={p.name}>
                        {p.name} {p.degree ? `(${p.degree})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Pitch Note / Statement */}
              <div className="form-group">
                <label className="form-label">Application Note / Qualifications</label>
                <textarea 
                  rows="4" 
                  placeholder="Write details or key achievements that will help the admissions committee review your application..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  style={{ fontSize: '0.86rem' }}
                />
              </div>

              {/* Auto Profile CV Indicator */}
              <div style={{
                padding: '12px 14px',
                background: 'rgba(52, 211, 153, 0.06)',
                border: '1px solid rgba(52, 211, 153, 0.25)',
                borderRadius: 'var(--r-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
              }}>
                <span style={{ color: '#10b981', fontWeight: 600 }}>
                  Profile CV Attached Automatically
                </span>
                {user?.cvUrl && (
                  <a href={user.cvUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--red)', fontWeight: 600 }}>
                    [View CV]
                  </a>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => { setSelectedUni(null); setProfileWarning(''); }} className="btn btn-ghost">
                  Cancel
                </button>
                <button type="submit" disabled={submittingApp} className="btn btn-primary">
                  {submittingApp ? 'Submitting...' : 'Confirm Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Completion Modal */}
      <CompleteProfileModal
        isOpen={isCompleteProfileModalOpen}
        onClose={() => {
          setIsCompleteProfileModalOpen(false);
          setProfileWarning('');
        }}
      />
    </div>
  );
};

export default Universities;
