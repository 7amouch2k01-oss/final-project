import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axiosInstance';
import { Link } from 'react-router-dom';
import CompleteProfileModal from '../../components/common/CompleteProfileModal';
import toast from 'react-hot-toast';

export const StudentDashboard = () => {
  const { user } = useAuthStore();
  const [unis, setUnis] = useState([]);
  const [stages, setStages] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [uploadingDocAppId, setUploadingDocAppId] = useState(null);

  const fetchData = async () => {
    try {
      const [uniRes, stageRes, appRes] = await Promise.all([
        api.get('/universities?limit=4'),
        api.get('/stages?limit=4'),
        api.get('/applications/mine')
      ]);
      setUnis(uniRes.data.data.universities || []);
      setStages(stageRes.data.data.stages || []);
      setApps(appRes.data.data.applications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate profile completion percentage (Flexible post-bac path: 100% reached with Bac + CV + Core Info)
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

  if (loading) {
    return (
      <div className="page flex-center">
        <div className="animate-spin" style={{ fontSize: '1.8rem', color: 'var(--red)' }}>⟳</div>
        <div style={{ marginLeft: '12px', color: 'var(--text-secondary)' }}>Loading Dashboard...</div>
      </div>
    );
  }

  // Collect active messages / interview bookings across applications
  const activeCommunications = apps.filter(a => a.messages && a.messages.length > 0);

  return (
    <div className="page container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '60px' }}>
      
      {/* Header Banner */}
      <div className="card glass" style={{ padding: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <div className="section-label">Student Workspace</div>
          <h2 style={{ fontSize: '1.8rem', margin: '4px 0 6px', fontWeight: 800 }}>Welcome, {user.name}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
            Track your higher education applications, view interview schedules, and discover accredited programmes.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link 
            to="/student/pro"
            className="btn btn-secondary"
            style={{ fontSize: '0.86rem', padding: '9px 16px' }}
          >
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

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }} className="dashboard-grid">
        {/* Left column: Direct Communications & Listings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Active Communications & Interview Hub */}
          {activeCommunications.length > 0 && (
            <div className="card glass" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid var(--red-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 700, color: 'var(--red)' }}>
                  Interviews & Institution Messages ({activeCommunications.length})
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeCommunications.map(app => (
                  <div key={app._id} style={{ padding: '14px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <strong style={{ fontSize: '0.92rem' }}>{app.targetId?.name || app.targetId?.title || 'Listing'}</strong>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                          Status: <strong style={{ textTransform: 'capitalize' }}>{app.status?.replace('_', ' ')}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Messages thread */}
                    {app.messages.map((m, idx) => (
                      <div key={idx} style={{ padding: '10px', background: 'var(--bg-surface)', borderRadius: '6px', fontSize: '0.82rem', marginTop: '4px' }}>
                        <div style={{ fontWeight: 600, color: m.sender === 'institution' ? 'var(--red)' : '#10b981', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{m.senderName || m.sender}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(m.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p style={{ margin: '4px 0 6px', color: 'var(--text-secondary)' }}>{m.message}</p>

                        {/* If Meeting Booking */}
                        {m.type === 'meeting_booking' && m.meetingDetails && (
                          <div style={{ padding: '8px 12px', background: 'rgba(96, 165, 250, 0.1)', border: '1px solid rgba(96, 165, 250, 0.3)', borderRadius: '6px', marginTop: '6px' }}>
                            <div style={{ fontWeight: 600, color: '#60a5fa' }}>Scheduled Interview</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                              Date: <strong>{new Date(m.meetingDetails.date).toLocaleDateString()}</strong> at <strong>{m.meetingDetails.time}</strong>
                            </div>
                            {m.meetingDetails.link && (
                              <a href={m.meetingDetails.link} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ marginTop: '6px', fontSize: '0.76rem', display: 'inline-block' }}>
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
                                <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', fontSize: '0.76rem' }}>
                                  {uploadingDocAppId === app._id ? 'Uploading...' : 'Upload & Submit Missing Document'}
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
                      {u.logo ? (
                        <img className="logo-bw" src={u.logo} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
                      ) : (
                        <div className="logo-badge" style={{ width: '100%', height: '100%', fontSize: '0.8rem' }}>{u.name?.substring(0, 2).toUpperCase()}</div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: '0.94rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 700 }}>{u.name}</h4>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>📍 {u.city}, {u.country}</span>
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
                      {s.companyLogo ? (
                        <img className="logo-bw" src={s.companyLogo} alt={s.company} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
                      ) : (
                        <div className="logo-badge" style={{ width: '100%', height: '100%', fontSize: '0.8rem' }}>{s.company?.substring(0, 2).toUpperCase()}</div>
                      )}
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

        {/* Right column: Profile Strength & Applications Tracker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Profile Strength Card */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Profile Strength</h4>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: profileScore === 100 ? '#10b981' : 'var(--red)' }}>
                {profileScore}%
              </span>
            </div>

            <div style={{ width: '100%', height: '6px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-full)', overflow: 'hidden' }}>
              <div style={{ width: `${profileScore}%`, height: '100%', background: profileScore === 100 ? '#10b981' : 'var(--red)', transition: 'width 0.4s ease' }} />
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
              {profileScore < 100 
                ? 'Complete your Baccalaureate proof, CV, and skills to reach 100% and boost your acceptance rate.' 
                : 'Your profile is 100% verified and active!'}
            </p>

            <button 
              onClick={() => setIsProfileModalOpen(true)} 
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem' }}
            >
              {profileScore < 100 ? 'Complete Profile (100%)' : 'Update Profile'}
            </button>
          </div>

          {/* Applications status tracker */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>My Applications ({apps.length})</h4>
            {apps.length === 0 ? (
              <p style={{ fontSize: '0.82rem', textAlign: 'center', color: 'var(--text-muted)', margin: '12px 0' }}>No applications submitted yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {apps.map(a => (
                  <div key={a._id} style={{ padding: '10px', background: 'var(--bg-elevated)', borderRadius: '6px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>{a.targetId?.name || a.targetId?.title || 'Listing'}</div>
                      <button
                        onClick={async () => {
                          if (window.confirm('Withdraw this application?')) {
                            try {
                              await api.delete(`/applications/${a._id}`);
                              setApps(apps.filter(appItem => appItem._id !== a._id));
                              toast.success('Application removed');
                            } catch (err) {
                              toast.error('Failed to remove application');
                            }
                          }
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        ✕
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{a.targetModel}</span>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 'var(--r-full)',
                        textTransform: 'uppercase',
                        background: a.status === 'accepted' ? 'rgba(52, 211, 153, 0.15)' : a.status === 'rejected' ? 'rgba(225, 29, 72, 0.15)' : a.status === 'under_review' ? 'rgba(96, 165, 250, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                        color: a.status === 'accepted' ? '#10b981' : a.status === 'rejected' ? 'var(--red)' : a.status === 'under_review' ? '#60a5fa' : '#fbbf24',
                      }}>
                        {a.status?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
