import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axiosInstance';
import { Link } from 'react-router-dom';
import CompleteProfileModal from '../../components/common/CompleteProfileModal';

export const StudentDashboard = () => {
  const { user } = useAuthStore();
  const [unis, setUnis] = useState([]);
  const [stages, setStages] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [uniRes, stageRes, appRes] = await Promise.all([
          api.get('/universities?limit=3'),
          api.get('/stages?limit=3'),
          api.get('/applications/mine')
        ]);
        setUnis(uniRes.data.data.universities);
        setStages(stageRes.data.data.stages);
        setApps(appRes.data.data.applications);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculate profile completion percentage
  const calculateProfileScore = () => {
    let score = 25; // base for email + account
    if (user?.name) score += 15;
    if (user?.bio) score += 20;
    if (user?.skills?.length > 0) score += 15;
    if (user?.education?.length > 0 || user?.experience?.length > 0) score += 15;
    if (user?.cvUrl) score += 10;
    return Math.min(100, score);
  };

  const profileScore = calculateProfileScore();

  if (loading) {
    return (
      <div className="page flex-center">
        <div className="animate-spin" style={{ fontSize: '2rem', color: 'var(--text-muted)' }}>⟳</div>
        <div style={{ marginLeft: '12px', color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="page container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Hero Welcome banner */}
      <div className="glass" style={{ padding: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <div className="section-label">Student & Applicant Portal</div>
          <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>Welcome, {user.name} 👋</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Find your dream university course or seek internship (stage) opportunities right here.</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link 
            to="/student/pro"
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--red-border)', color: 'var(--red-bright)' }}
          >
            <span>⭐</span> Pro Student Hub
          </Link>
          <button 
            onClick={() => setIsProfileModalOpen(true)} 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>📝</span> Complete Profile
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }} className="dashboard-grid">
        {/* Left column: listings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Featured Universities */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Featured Universities</h3>
              <Link to="/universities" style={{ fontSize: '0.9rem', fontWeight: 600 }}>Browse all →</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {unis.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No universities listed yet.</p> : unis.map(u => (
                <div key={u._id} className="glass" style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                  {u.logo ? <img src={u.logo} alt="Logo" style={{ width: '48px', height: '48px', borderRadius: 'var(--r-md)', objectFit: 'cover' }} /> : <div style={{ width: '48px', height: '48px', background: 'var(--grey-200)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>🎓</div>}
                  <div style={{ flex: 1 }}>
                    <h4 style={{ color: 'var(--text-primary)' }}>{u.name}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📍 {u.city}, {u.country} | Tuition: {u.tuitionFee?.amount} {u.tuitionFee?.currency}/{u.tuitionFee?.period}</p>
                  </div>
                  <Link to={`/universities/${u._id}`} className="btn btn-ghost btn-sm">Details</Link>
                </div>
              ))}
            </div>
          </div>

          {/* Internships */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Latest Internship Listings (Stages)</h3>
              <Link to="/stages" style={{ fontSize: '0.9rem', fontWeight: 600 }}>Browse all →</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {stages.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No internships listed yet.</p> : stages.map(s => (
                <div key={s._id} className="glass" style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                  {s.companyLogo ? <img src={s.companyLogo} alt="Logo" style={{ width: '48px', height: '48px', borderRadius: 'var(--r-md)', objectFit: 'cover' }} /> : <div style={{ width: '48px', height: '48px', background: 'var(--grey-200)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>💼</div>}
                  <div style={{ flex: 1 }}>
                    <h4 style={{ color: 'var(--text-primary)' }}>{s.title}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>🏢 {s.company} | 📍 {s.location || 'Remote'} | ⏱️ {s.duration}</p>
                  </div>
                  <Link to={`/stages/${s._id}`} className="btn btn-ghost btn-sm">Details</Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Profile status & Applications */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Profile Completion Widget */}
          <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0 }}>Profile Strength</h4>
              <span className="badge badge-accent">{profileScore}%</span>
            </div>

            {/* Progress bar */}
            <div style={{ width: '100%', height: '6px', background: 'var(--grey-200)', borderRadius: 'var(--r-full)', overflow: 'hidden' }}>
              <div style={{ width: `${profileScore}%`, height: '100%', background: 'linear-gradient(90deg, var(--red), var(--red-hover))', transition: 'width 0.4s ease' }} />
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
              {profileScore < 100 
                ? 'Complete your profile with education, skills, and CV to boost your application acceptance rate.' 
                : '🎉 Excellent! Your profile is 100% complete.'}
            </p>

            <button 
              onClick={() => setIsProfileModalOpen(true)} 
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {profileScore < 100 ? '⚙️ Complete Missing Info' : '✏️ Edit Profile'}
            </button>
          </div>

          {/* Applications status */}
          <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3>Your Applications</h3>
            {apps.length === 0 ? (
              <p style={{ fontSize: '0.9rem', textAlign: 'center', color: 'var(--text-muted)' }}>No applications submitted yet.</p>
            ) : (
              apps.map(a => (
                <div key={a._id} style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.targetId?.name || a.targetId?.title || 'Listing'}</div>
                    <button
                      onClick={async () => {
                        if (window.confirm('Withdraw and remove this application?')) {
                          try {
                            await api.delete(`/applications/${a._id}`);
                            setApps(apps.filter(appItem => appItem._id !== a._id));
                            toast.success('Application removed successfully');
                          } catch (err) {
                            toast.error('Failed to remove application');
                          }
                        }
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}
                      title="Withdraw application"
                    >
                      🗑️
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{a.targetType || a.targetModel}</span>
                    <span className={`status-${a.status}`}>
                      {a.status?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Complete Profile Modal */}
      <CompleteProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </div>
  );
};
export default StudentDashboard;
