import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import CompleteProfileModal from '../../components/common/CompleteProfileModal';

export const CitizenDashboard = () => {
  const { user, requestRecruitRights } = useAuthStore();
  const [jobs, setJobs] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingRights, setSubmittingRights] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobRes, appRes] = await Promise.all([
          api.get('/jobs?limit=3'),
          api.get('/applications/mine')
        ]);
        setJobs(jobRes.data.data.jobs);
        setApps(appRes.data.data.applications);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRequestRights = async () => {
    setSubmittingRights(true);
    const res = await requestRecruitRights();
    setSubmittingRights(false);
    if (res.success) {
      toast.success('Recruit rights requested! Awaiting admin approval.');
    } else {
      toast.error(res.error || 'Failed to request rights');
    }
  };

  // Calculate profile completion percentage
  const calculateProfileScore = () => {
    let score = 25; // base
    if (user?.name) score += 15;
    if (user?.bio) score += 20;
    if (user?.skills?.length > 0) score += 15;
    if (user?.experience?.length > 0) score += 15;
    if (user?.company?.name || user?.cvUrl) score += 10;
    return Math.min(100, score);
  };

  const profileScore = calculateProfileScore();

  if (loading) {
    return (
      <div className="page flex-center">
        <div className="animate-spin" style={{ fontSize: '2rem' }}>⟳</div>
      </div>
    );
  }

  return (
    <div className="page container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Hero Welcome banner */}
      <div className="glass" style={{ padding: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <div className="section-label">Citizen & Professional Portal</div>
          <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>TuniJob Dashboard 👋</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Search remote & office jobs or recruit top Tunisian candidates.</p>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setIsProfileModalOpen(true)} 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>📝</span> Complete Profile
          </button>

          {user.recruitRights?.status === 'none' && (
            <button onClick={handleRequestRights} disabled={submittingRights} className="btn btn-secondary">
              📢 Enable Recruiter Mode
            </button>
          )}
          {user.recruitRights?.status === 'pending' && (
            <span className="badge badge-warning" style={{ padding: '8px 16px' }}>⏳ Recruiter Rights Pending Admin Approval</span>
          )}
          {user.recruitRights?.status === 'approved' && (
            <Link to="/recruiter" className="btn btn-secondary">
              💼 Go to Recruiter Hub
            </Link>
          )}
          {user.recruitRights?.status === 'rejected' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <span className="badge badge-danger">❌ Request Rejected</span>
              <button onClick={handleRequestRights} className="btn btn-ghost btn-sm">Request Again</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }} className="dashboard-grid">
        {/* Left column: latest jobs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Latest Job Openings</h3>
            <Link to="/jobs" style={{ fontSize: '0.9rem', fontWeight: 600 }}>Explore all jobs →</Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {jobs.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No job listings found.</p> : jobs.map(j => (
              <div key={j._id} className="glass" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  {j.companyLogo ? (
                    <img 
                      src={j.companyLogo} 
                      alt="Company Logo" 
                      style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div style={{ 
                    width: '48px', height: '48px', 
                    background: 'var(--bg-elevated)', 
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--r-md)', 
                    display: j.companyLogo ? 'none' : 'flex', 
                    alignItems: 'center', justifyContent: 'center', 
                    fontWeight: 600, fontSize: '1.2rem', color: 'var(--text-primary)' 
                  }}>
                    {j.company ? j.company[0].toUpperCase() : '💼'}
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--text-primary)' }}>{j.title}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>🏢 {j.company} | 📍 {j.location} | 💼 {j.contractType} | {j.experienceLevel}</p>
                  </div>
                </div>
                <Link to={`/jobs/${j._id}`} className="btn btn-ghost btn-sm">View Job</Link>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Profile strength & applications */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Profile Strength Widget */}
          <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0 }}>Profile Strength</h4>
              <span className="badge badge-accent">{profileScore}%</span>
            </div>

            <div style={{ width: '100%', height: '6px', background: 'var(--grey-200)', borderRadius: 'var(--r-full)', overflow: 'hidden' }}>
              <div style={{ width: `${profileScore}%`, height: '100%', background: 'linear-gradient(90deg, var(--red), var(--red-hover))', transition: 'width 0.4s ease' }} />
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
              {profileScore < 100 
                ? 'Complete your profile with your experience, resume link, and skills to stand out to employers.' 
                : '🎉 Excellent! Your candidate profile is 100% complete.'}
            </p>

            <button 
              onClick={() => setIsProfileModalOpen(true)} 
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {profileScore < 100 ? '⚙️ Complete Missing Info' : '✏️ Edit Profile'}
            </button>
          </div>

          {/* Applications list */}
          <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3>Job Applications</h3>
            {apps.length === 0 ? (
              <p style={{ fontSize: '0.9rem', textAlign: 'center', color: 'var(--text-muted)' }}>No job applications submitted yet.</p>
            ) : (
              apps.map(a => (
                <div key={a._id} style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.targetId?.title || a.targetId?.name || 'Job / Stage Listing'}</div>
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
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{a.targetType || a.targetModel}</span>
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
export default CitizenDashboard;
