import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axiosInstance';
import { Link } from 'react-router-dom';
import CompleteProfileModal, { BrandLogo } from '../../components/common/CompleteProfileModal';
import toast from 'react-hot-toast';

export const StudentDashboard = () => {
  const { user } = useAuthStore();
  const [unis, setUnis] = useState([]);
  const [stages, setStages] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appFilter, setAppFilter] = useState('all'); // 'all', 'pending', 'under_review', 'accepted', 'rejected'
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [uploadingDocAppId, setUploadingDocAppId] = useState(null);
  const [followData, setFollowData] = useState({ followers: [], following: [], followersCount: 0, followingCount: 0 });

  const fetchData = async () => {
    try {
      const [uniRes, stageRes, appRes, followRes] = await Promise.all([
        api.get('/universities?limit=4'),
        api.get('/stages?limit=4'),
        api.get('/applications/mine'),
        api.get('/community/follow-data').catch(() => ({ data: { data: { followers: [], following: [] } } })),
      ]);
      setUnis(uniRes.data.data.universities || []);
      setStages(stageRes.data.data.stages || []);
      setApps(appRes.data.data.applications || []);
      setFollowData(followRes.data.data || { followers: [], following: [] });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate profile completion percentage
  const calculateProfileScore = () => {
    if (user?.isProfileComplete) return 100;
    let score = 20;
    if (user?.name) score += 15;
    if (user?.bio) score += 15;
    if (user?.skills?.length > 0) score += 15;
    if (user?.baccalaureate?.school && user?.baccalaureate?.proofDocUrl) score += 20;
    if (user?.cvUrl) score += 15;
    return Math.min(100, score);
  };

  const profileScore = calculateProfileScore();

  // Upload missing document in response to an institution request
  const handleUploadMissingFile = async (e, appId) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingDocAppId(appId);
    try {
      await api.post(`/applications/${appId}/missing-doc`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Requested document uploaded and submitted to admissions team!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploadingDocAppId(null);
    }
  };

  const handleWithdraw = async (appId) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) return;
    try {
      await api.delete(`/applications/${appId}`);
      setApps(prev => prev.filter(a => a._id !== appId));
      toast.success('Application withdrawn successfully');
    } catch {
      toast.error('Failed to withdraw application');
    }
  };

  if (loading) {
    return (
      <div className="page flex-center">
        <div className="animate-spin" style={{ fontSize: '1.8rem', color: 'var(--red)' }}>⟳</div>
        <div style={{ marginLeft: '12px', color: 'var(--text-secondary)' }}>Loading Dashboard...</div>
      </div>
    );
  }

  // Application Stats
  const totalApps = apps.length;
  const pendingApps = apps.filter(a => a.status === 'pending').length;
  const underReviewApps = apps.filter(a => a.status === 'under_review').length;
  const acceptedApps = apps.filter(a => a.status === 'accepted').length;
  const rejectedApps = apps.filter(a => a.status === 'rejected').length;

  const filteredApps = apps.filter(a => {
    if (appFilter === 'all') return true;
    return a.status === appFilter;
  });

  const activeCommunications = apps.filter(a => a.messages && a.messages.length > 0);

  return (
    <div className="page container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
      
      {/* Header Banner */}
      <div className="card glass" style={{ padding: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <div className="section-label">Student Workspace</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.8rem', margin: '4px 0 6px', fontWeight: 800 }}>Welcome, {user?.name}</h2>
            {(
              user?.subscription?.plan === 'pro' || 
              user?.subscription?.plan === 'premium' || 
              (user?.subscription?.trialExpiresAt && new Date(user.subscription.trialExpiresAt) > new Date())
            ) && (
              <span 
                className="icon-btn-logo"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: 'var(--r-full)',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--glass-border)',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  boxShadow: 'var(--shadow-xs)',
                  cursor: 'default',
                }}
                title="Active Pro Student Membership"
              >
                <svg 
                  className="btn-svg-logo" 
                  width="14" 
                  height="14" 
                  viewBox="0 0 24 24" 
                  fill="currentColor" 
                  stroke="none"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                PRO
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
            Manage your higher education & internship applications, interview bookings, and profile verification.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link 
            to="/student/pro"
            className="btn btn-secondary"
            style={{ fontSize: '0.86rem', padding: '9px 16px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px' }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            Pro Student Hub
          </Link>
          <button 
            onClick={() => setIsProfileModalOpen(true)} 
            className="btn btn-primary"
            style={{ fontSize: '0.86rem', padding: '9px 16px' }}
          >
            {profileScore < 100 ? 'Complete Profile (100%)' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* ── Applications Quick Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        <div className="card glass" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="logo-container" style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg className="btn-svg-logo" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>Total Applied</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalApps}</div>
          </div>
        </div>

        <div className="card glass" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="logo-container" style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg className="btn-svg-logo" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>Pending</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{pendingApps}</div>
          </div>
        </div>

        <div className="card glass" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="logo-container" style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg className="btn-svg-logo" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>Under Review</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{underReviewApps}</div>
          </div>
        </div>

        <div className="card glass" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="logo-container" style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg className="btn-svg-logo" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>Accepted</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{acceptedApps}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '24px' }} className="dashboard-grid">
        
        {/* ── Left Column: Applications Manager & Listings ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Main Applications Management Card */}
          <div className="card glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 800 }}>My Application Submissions</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                  Track admissions status, messages, and uploaded documents
                </p>
              </div>

              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-elevated)', padding: '4px', borderRadius: 'var(--r-md)', border: '1px solid var(--glass-border)', overflowX: 'auto' }}>
                {[
                  { id: 'all', label: `All (${totalApps})` },
                  { id: 'pending', label: `Pending (${pendingApps})` },
                  { id: 'under_review', label: `Reviewing (${underReviewApps})` },
                  { id: 'accepted', label: `Accepted (${acceptedApps})` },
                  { id: 'rejected', label: `Rejected (${rejectedApps})` },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setAppFilter(tab.id)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 'var(--r-sm)',
                      border: 'none',
                      fontSize: '0.75rem',
                      fontWeight: appFilter === tab.id ? 700 : 500,
                      background: appFilter === tab.id ? 'var(--red)' : 'transparent',
                      color: appFilter === tab.id ? '#ffffff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all var(--t-fast)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Applications List */}
            {filteredApps.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', border: '1px dashed var(--glass-border)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📂</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.92rem' }}>No applications found</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {appFilter === 'all' 
                    ? 'Explore universities and internship stages below to start applying!' 
                    : `No applications with status "${appFilter.replace('_', ' ')}".`}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {filteredApps.map(a => {
                  const targetTitle = a.targetId?.name || a.targetId?.title || 'Listing';
                  const targetSubtitle = a.targetId?.city ? `${a.targetId.city}, ${a.targetId.country || 'Tunisia'}` : a.targetId?.company || '';
                  const hasMessages = a.messages && a.messages.length > 0;

                  return (
                    <div 
                      key={a._id}
                      className="card glass"
                      style={{
                        padding: '18px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        border: a.status === 'accepted' ? '1px solid rgba(16, 185, 129, 0.4)' : undefined,
                        background: a.status === 'accepted' ? 'rgba(16, 185, 129, 0.03)' : undefined,
                      }}
                    >
                      {/* Status Announcement Banner if Accepted */}
                      {a.status === 'accepted' && (
                        <div style={{ padding: '8px 14px', borderRadius: 'var(--r-sm)', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '0.82rem', fontWeight: 700 }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          Congratulations! Your application has been officially accepted.
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <div className="logo-container" style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                            <BrandLogo 
                              logoUrl={a.targetId?.logo || a.targetId?.companyLogo} 
                              name={targetTitle} 
                              company={a.targetId?.company || ''} 
                            />
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {targetTitle}
                              </h4>
                              <span className="badge badge-accent" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>
                                {a.targetModel || 'Listing'}
                              </span>
                            </div>
                            {targetSubtitle && (
                              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                                {targetSubtitle}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Status & Withdraw */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: 'var(--r-full)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            background: a.status === 'accepted' ? 'rgba(52, 211, 153, 0.15)' : a.status === 'rejected' ? 'rgba(225, 29, 72, 0.15)' : a.status === 'under_review' ? 'rgba(96, 165, 250, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                            color: a.status === 'accepted' ? '#10b981' : a.status === 'rejected' ? 'var(--red)' : a.status === 'under_review' ? '#60a5fa' : '#fbbf24',
                            border: `1px solid ${a.status === 'accepted' ? 'rgba(52, 211, 153, 0.3)' : a.status === 'rejected' ? 'rgba(225, 29, 72, 0.3)' : a.status === 'under_review' ? 'rgba(96, 165, 250, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`
                          }}>
                            ● {a.status?.replace('_', ' ')}
                          </span>

                          <button
                            onClick={() => handleWithdraw(a._id)}
                            title="Withdraw Application"
                            style={{
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--glass-border)',
                              borderRadius: 'var(--r-sm)',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '4px 8px',
                              fontSize: '0.78rem',
                              transition: 'all var(--t-fast)'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'var(--red-border)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                          >
                            Withdraw ✕
                          </button>
                        </div>
                      </div>

                      {/* Application Metadata & Messages Preview */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '10px', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        <div>
                          Submitted: {new Date(a.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        {hasMessages && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--red-bright)', fontWeight: 600 }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--red)' }} />
                            {a.messages.length} update{a.messages.length > 1 ? 's' : ''} from admissions
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Featured Universities */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>Featured Universities</h3>
              <Link to="/universities" style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--red)' }}>Browse all →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
              {unis.map(u => (
                <div key={u._id} className="card glass" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div className="logo-container" style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--glass-border)' }}>
                      <BrandLogo logoUrl={u.logo} name={u.name} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: '0.94rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 700 }}>{u.name}</h4>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{u.city}, {u.country}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                    {u.description}
                  </p>
                  <Link to="/universities" className="btn btn-secondary btn-sm" style={{ marginTop: 'auto', justifyContent: 'center', fontSize: '0.78rem' }}>
                    View & Apply
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Internships */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>Internship Opportunities (Stages)</h3>
              <Link to="/stages" style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--red)' }}>Browse all →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
              {stages.map(s => (
                <div key={s._id} className="card glass" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div className="logo-container" style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--glass-border)' }}>
                      <BrandLogo logoUrl={s.companyLogo} name={s.title} company={s.company} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: '0.94rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 700 }}>{s.title}</h4>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>🏢 {s.company} · {s.location || 'Remote'}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                    {s.description}
                  </p>
                  <Link to="/stages" className="btn btn-secondary btn-sm" style={{ marginTop: 'auto', justifyContent: 'center', fontSize: '0.78rem' }}>
                    View & Apply
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Column: Profile Strength & Active Communications ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Profile Strength Card */}
          <div className="card glass" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700 }}>Profile Strength</h4>
              <span style={{ fontSize: '0.92rem', fontWeight: 800, color: profileScore === 100 ? '#10b981' : 'var(--red)' }}>
                {profileScore}%
              </span>
            </div>

            <div style={{ width: '100%', height: '8px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-full)', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
              <div style={{ width: `${profileScore}%`, height: '100%', background: profileScore === 100 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, var(--red), var(--red-hover))', transition: 'width 0.4s ease' }} />
            </div>

            {/* Baccalaureate Status Badge */}
            {user?.baccalaureate?.verificationStatus && (
              <div style={{
                padding: '8px 12px',
                borderRadius: 'var(--r-sm)',
                fontSize: '0.74rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: user.baccalaureate.verificationStatus === 'verified' 
                  ? 'rgba(16, 185, 129, 0.1)' 
                  : user.baccalaureate.verificationStatus === 'rejected'
                  ? 'rgba(239, 68, 68, 0.1)'
                  : 'rgba(245, 158, 11, 0.1)',
                color: user.baccalaureate.verificationStatus === 'verified' 
                  ? '#10b981' 
                  : user.baccalaureate.verificationStatus === 'rejected'
                  ? '#ef4444' 
                  : '#f59e0b',
                border: user.baccalaureate.verificationStatus === 'verified'
                  ? '1px solid rgba(16, 185, 129, 0.2)'
                  : user.baccalaureate.verificationStatus === 'rejected'
                  ? '1px solid rgba(239, 68, 68, 0.2)'
                  : '1px solid rgba(245, 158, 11, 0.2)',
              }}>
                <span>
                  {user.baccalaureate.verificationStatus === 'verified' && '✓ Baccalaureate Verified'}
                  {user.baccalaureate.verificationStatus === 'under_review' && '⏳ Bac Proof: Under Review (< 24h)'}
                  {user.baccalaureate.verificationStatus === 'rejected' && '⚠️ Bac Proof: Action Needed'}
                  {user.baccalaureate.verificationStatus === 'unsubmitted' && 'Bac Proof: Not Uploaded'}
                </span>
                <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                  {user.baccalaureate.section || 'Student'}
                </span>
              </div>
            )}

            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              {profileScore < 100 
                ? 'Complete your Baccalaureate proof, CV, and skills to reach 100% and boost your acceptance rate.' 
                : 'Your profile is 100% verified and active!'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={() => setIsProfileModalOpen(true)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Complete My Profile
              </button>
            </div>
          </div>

          {/* Student Professional Network Card */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1rem' }}>👥</span>
                <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700 }}>Academic & Career Network</h4>
              </div>
              <Link to="/profile" style={{ fontSize: '0.75rem', color: 'var(--red)', fontWeight: 600, textDecoration: 'none' }}>
                Manage ↗
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--r-md)', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--red-bright)' }}>{followData.followers?.length || 0}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Followers</div>
              </div>
              <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--r-md)', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{followData.following?.length || 0}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Following</div>
              </div>
            </div>

            {followData.following?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>Recent Connections:</span>
                {followData.following.slice(0, 3).map(f => (
                  <div key={f._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.65rem', fontWeight: 800, overflow: 'hidden', flexShrink: 0 }}>
                      {f.avatar ? <img src={f.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (f.name?.[0]?.toUpperCase() || 'U')}
                    </div>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>{f.name}</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: 'auto', textTransform: 'capitalize' }}>{f.role}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Communications & Interview Hub */}
          {activeCommunications.length > 0 && (
            <div className="card glass" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid var(--red-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 700, color: 'var(--red)' }}>
                  Interviews & Messages ({activeCommunications.length})
                </h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeCommunications.map(app => (
                  <div key={app._id} style={{ padding: '14px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <strong style={{ fontSize: '0.88rem' }}>{app.targetId?.name || app.targetId?.title || 'Listing'}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Status: <strong style={{ textTransform: 'capitalize' }}>{app.status?.replace('_', ' ')}</strong>
                      </div>
                    </div>

                    {/* Messages thread */}
                    {app.messages.map((m, idx) => (
                      <div key={idx} style={{ padding: '10px', background: 'var(--bg-surface)', borderRadius: '6px', fontSize: '0.8rem', marginTop: '4px' }}>
                        <div style={{ fontWeight: 600, color: m.sender === 'institution' ? 'var(--red)' : '#10b981', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{m.senderName || m.sender}</span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{new Date(m.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p style={{ margin: '4px 0 6px', color: 'var(--text-secondary)' }}>{m.message}</p>

                        {/* If Meeting Booking */}
                        {m.type === 'meeting_booking' && m.meetingDetails && (
                          <div style={{ padding: '8px 12px', background: 'rgba(96, 165, 250, 0.1)', border: '1px solid rgba(96, 165, 250, 0.3)', borderRadius: '6px', marginTop: '6px' }}>
                            <div style={{ fontWeight: 600, color: '#60a5fa' }}>Scheduled Interview</div>
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                              Date: <strong>{new Date(m.meetingDetails.date).toLocaleDateString()}</strong> at <strong>{m.meetingDetails.time}</strong>
                            </div>
                            {m.meetingDetails.link && (
                              <a href={m.meetingDetails.link} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ marginTop: '6px', fontSize: '0.74rem', display: 'inline-block' }}>
                                Join Meeting Link ↗
                              </a>
                            )}
                          </div>
                        )}

                        {/* If Missing Document Request */}
                        {m.type === 'file_request' && (
                          <div style={{ padding: '8px 12px', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '6px', marginTop: '6px' }}>
                            <div style={{ fontWeight: 600, color: '#fbbf24' }}>
                              Requested Document: {m.missingDocType}
                            </div>
                            {m.uploadedDocUrl ? (
                              <div style={{ fontSize: '0.76rem', color: '#10b981', marginTop: '4px' }}>
                                ✓ Document uploaded and delivered
                              </div>
                            ) : (
                              <div style={{ marginTop: '8px' }}>
                                <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', fontSize: '0.74rem' }}>
                                  {uploadingDocAppId === app._id ? 'Uploading...' : 'Upload & Submit'}
                                  <input 
                                    type="file" 
                                    accept=".pdf,image/*,.doc,.docx" 
                                    onChange={e => handleUploadMissingFile(e, app._id)} 
                                    style={{ display: 'none' }} 
                                    disabled={uploadingDocAppId === app._id}
                                  />
                                </label>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <CompleteProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => { setIsProfileModalOpen(false); fetchData(); }} 
      />
    </div>
  );
};

export default StudentDashboard;
