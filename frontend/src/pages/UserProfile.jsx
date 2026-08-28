import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

export const UserProfile = () => {
  const { user, setUser, graduate, requestRecruitRights } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [skills, setSkills] = useState(user?.skills?.join(', ') || '');
  const [languages, setLanguages] = useState(user?.languages?.join(', ') || '');
  const [cvUrl, setCvUrl] = useState(user?.cvUrl || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Education
  const firstEdu = user?.education?.[0] || {};
  const [school, setSchool] = useState(firstEdu.school || '');
  const [degree, setDegree] = useState(firstEdu.degree || '');
  const [field, setField] = useState(firstEdu.field || '');

  // Experience
  const firstExp = user?.experience?.[0] || {};
  const [expCompany, setExpCompany] = useState(firstExp.company || '');
  const [expTitle, setExpTitle] = useState(firstExp.title || '');
  const [expDesc, setExpDesc] = useState(firstExp.description || '');

  // Company
  const [companyName, setCompanyName] = useState(user?.company?.name || '');
  const [companyDesc, setCompanyDesc] = useState(user?.company?.description || '');
  const [companyWebsite, setCompanyWebsite] = useState(user?.company?.website || '');
  const [companyLocation, setCompanyLocation] = useState(user?.company?.location || '');

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // 'general', 'education', 'experience', 'company'

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar file size must be under 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setUploadingAvatar(true);
    try {
      const res = await api.patch('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newAvatar = res.data.data.avatar;
      setAvatar(newAvatar);
      if (user) {
        setUser({ ...user, avatar: newAvatar });
      }
      toast.success('Profile photo updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload profile photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
      const languagesArray = languages.split(',').map(l => l.trim()).filter(Boolean);
      const updateData = {
        name,
        bio,
        skills: skillsArray,
        languages: languagesArray,
        cvUrl,
        education: school ? [{ school, degree, field }] : [],
        experience: expCompany ? [{ company: expCompany, title: expTitle, description: expDesc }] : [],
        company: {
          name: companyName,
          description: companyDesc,
          website: companyWebsite,
          location: companyLocation
        }
      };
      
      const res = await api.patch('/users', updateData);
      setUser(res.data.data.user);
      toast.success('Profile updated successfully! ✨');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleGraduate = async () => {
    if (window.confirm('🎓 Are you sure you graduated? This will upgrade your account to Citizen.')) {
      const res = await graduate();
      if (res.success) {
        toast.success('Congratulations! You are now a Citizen.');
      } else {
        toast.error(res.error || 'Upgrade failed');
      }
    }
  };

  const handleRequestRecruit = async () => {
    const res = await requestRecruitRights();
    if (res.success) {
      toast.success('Recruiter rights requested! Awaiting admin approval.');
    } else {
      toast.error(res.error || 'Failed to request rights');
    }
  };

  // Profile completeness calculation
  const calculateCompleteness = () => {
    let score = 0;
    if (name) score += 20;
    if (bio) score += 20;
    if (skills) score += 20;
    if (avatar) score += 15;
    if (cvUrl) score += 15;
    if (school || expCompany) score += 10;
    return Math.min(100, score);
  };

  const completeness = calculateCompleteness();

  return (
    <div className="page container animate-fade-in" style={{ paddingBottom: '60px' }}>
      
      {/* ── Top Hero Profile Banner ── */}
      <div 
        className="card glass" 
        style={{ 
          padding: '36px', 
          marginBottom: '28px',
          display: 'flex', 
          flexWrap: 'wrap', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: '24px',
          position: 'relative',
          background: 'linear-gradient(135deg, var(--glass-bg), var(--bg-surface))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          {/* Avatar with Camera Overlay */}
          <div style={{ position: 'relative' }}>
            <div 
              style={{ 
                width: '96px', 
                height: '96px', 
                borderRadius: '50%', 
                overflow: 'hidden', 
                border: '3px solid var(--red-border)', 
                boxShadow: '0 0 24px var(--red-glow)',
                background: 'var(--bg-elevated)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              {avatar ? (
                <img 
                  src={avatar} 
                  alt={name || 'Profile'} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                style={{ 
                  width: '100%', height: '100%',
                  background: 'linear-gradient(135deg, var(--red), var(--red-deep))', 
                  display: avatar ? 'none' : 'flex', 
                  alignItems: 'center', justifyContent: 'center', 
                  color: '#fff', fontWeight: 800, fontSize: '2.2rem', 
                  fontFamily: 'var(--font-display)',
                }}
              >
                {name?.[0]?.toUpperCase() || user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
            </div>

            {/* Quick Upload Icon */}
            <label 
              style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--red)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: uploadingAvatar ? 'wait' : 'pointer',
                boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
                border: '2px solid var(--bg-surface)',
                transition: 'transform var(--t-fast)',
                fontSize: '0.85rem',
              }}
              title="Change profile photo"
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {uploadingAvatar ? '⏳' : '📷'}
              <input 
                type="file" 
                accept="image/jpeg,image/png,image/webp" 
                onChange={handleAvatarChange} 
                disabled={uploadingAvatar}
                style={{ display: 'none' }} 
              />
            </label>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.75rem', margin: 0, fontWeight: 800 }}>{name || user?.name || 'User Profile'}</h1>
              
              {/* Role Badge */}
              <span className={`badge badge-${user?.role === 'citizen' ? 'success' : 'accent'}`} style={{ textTransform: 'uppercase' }}>
                {user?.role === 'citizen' ? '💼 Citizen' : user?.role === 'admin' ? '🛡️ Admin' : '🎓 Student'}
              </span>

              {/* Student Pro Star Badge (Black & White to Red on Hover) */}
              {(user?.role === 'student' || !user?.role) && (
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

              {user?.recruitRights?.status === 'approved' && (
                <span className="badge badge-success">✓ Verified Recruiter</span>
              )}
            </div>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {user?.email} · Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Profile Strength Progress Bar */}
        <div style={{ minWidth: '220px', flex: '0 1 260px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Profile Strength</span>
            <span style={{ color: completeness === 100 ? '#10b981' : 'var(--red)' }}>{completeness}%</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-full)', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
            <div 
              style={{ 
                width: `${completeness}%`, 
                height: '100%', 
                background: completeness === 100 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, var(--red), var(--red-hover))', 
                borderRadius: 'var(--r-full)',
                transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: completeness === 100 ? '0 0 10px #10b981' : '0 0 10px var(--red-glow)',
              }} 
            />
          </div>
        </div>
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '28px' }} className="dashboard-grid">
        
        {/* Left Column: Profile Form with Navigation Tabs */}
        <div>
          {/* Navigation Pills */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
            {[
              { id: 'general', label: '👤 General Info' },
              { id: 'education', label: '🎓 Education' },
              { id: 'experience', label: '💼 Experience' },
              ...((user?.role === 'citizen' || user?.recruitRights?.status === 'approved') ? [{ id: 'company', label: '🏢 Recruiter / Org' }] : [])
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '9px 18px',
                  borderRadius: 'var(--r-full)',
                  border: activeTab === tab.id ? '1px solid var(--red-border)' : '1px solid var(--glass-border)',
                  background: activeTab === tab.id ? 'var(--red-subtle)' : 'var(--glass-bg)',
                  color: activeTab === tab.id ? 'var(--red-bright)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all var(--t-fast)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="card glass" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
            
            {/* General Tab */}
            {activeTab === 'general' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }} className="animate-fade-in">
                <h3 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 700, borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                  Basic Information
                </h3>

                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="e.g. Yassine Trabelsi"
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Bio & Career Objective</label>
                  <textarea 
                    rows="4" 
                    value={bio} 
                    onChange={e => setBio(e.target.value)} 
                    placeholder="Tell universities, employers or applicants about your skills, ambitions, and experience..." 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Core Skills (comma separated)</label>
                    <input 
                      type="text" 
                      value={skills} 
                      onChange={e => setSkills(e.target.value)} 
                      placeholder="React, Python, SQL, Project Management..." 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Languages (comma separated)</label>
                    <input 
                      type="text" 
                      value={languages} 
                      onChange={e => setLanguages(e.target.value)} 
                      placeholder="Arabic, French, English, German..." 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Digital CV / Portfolio URL</label>
                  <input 
                    type="url" 
                    value={cvUrl} 
                    onChange={e => setCvUrl(e.target.value)} 
                    placeholder="https://drive.google.com/your-cv.pdf or LinkedIn" 
                  />
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    📎 This CV will be automatically attached when you apply for Universities, Stages, or Jobs!
                  </span>
                </div>
              </div>
            )}

            {/* Education Tab */}
            {activeTab === 'education' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }} className="animate-fade-in">
                <h3 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 700, borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                  🎓 Academic History & Studies
                </h3>

                <div className="form-group">
                  <label className="form-label">University / School Name</label>
                  <input 
                    type="text" 
                    value={school} 
                    onChange={e => setSchool(e.target.value)} 
                    placeholder="e.g. INSAT, ESPRIT, Faculté des Sciences de Tunis" 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Degree Level</label>
                    <input 
                      type="text" 
                      value={degree} 
                      onChange={e => setDegree(e.target.value)} 
                      placeholder="e.g. Engineering Diploma, Master, Licence" 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Specialization / Field</label>
                    <input 
                      type="text" 
                      value={field} 
                      onChange={e => setField(e.target.value)} 
                      placeholder="e.g. Software Engineering, AI, Finance" 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Experience Tab */}
            {activeTab === 'experience' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }} className="animate-fade-in">
                <h3 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 700, borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                  💼 Work, Projects & Internship Experience
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Company / Organization</label>
                    <input 
                      type="text" 
                      value={expCompany} 
                      onChange={e => setExpCompany(e.target.value)} 
                      placeholder="e.g. Vermeg, InstaDeep, Freelance" 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Job Title / Role</label>
                    <input 
                      type="text" 
                      value={expTitle} 
                      onChange={e => setExpTitle(e.target.value)} 
                      placeholder="e.g. Full Stack Developer, PFE Intern" 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Key Responsibilities & Achievements</label>
                  <textarea 
                    rows="4" 
                    value={expDesc} 
                    onChange={e => setExpDesc(e.target.value)} 
                    placeholder="Describe the projects built, tech stack utilized, or impact achieved..." 
                  />
                </div>
              </div>
            )}

            {/* Recruiter / Organization Tab */}
            {activeTab === 'company' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }} className="animate-fade-in">
                <h3 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 700, borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                  🏢 Recruiter & Organization Profile
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Company / Entity Name</label>
                    <input 
                      type="text" 
                      value={companyName} 
                      onChange={e => setCompanyName(e.target.value)} 
                      placeholder="e.g. Digital Waves Tunisia" 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location / Governorate</label>
                    <input 
                      type="text" 
                      value={companyLocation} 
                      onChange={e => setCompanyLocation(e.target.value)} 
                      placeholder="e.g. Les Berges du Lac, Tunis" 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Official Website</label>
                  <input 
                    type="url" 
                    value={companyWebsite} 
                    onChange={e => setCompanyWebsite(e.target.value)} 
                    placeholder="https://company.tn" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Company Culture & Hiring Scope</label>
                  <textarea 
                    rows="3" 
                    value={companyDesc} 
                    onChange={e => setCompanyDesc(e.target.value)} 
                    placeholder="Introduce your company, work benefits, and talent needs..." 
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
              <button 
                type="submit" 
                disabled={loading} 
                className="btn btn-primary btn-lg"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                {loading ? '⏳ Saving...' : '💾 Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Account Status & Actions Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Account Status Card */}
          <div className="card glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 700 }}>Account Details</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email Address</span>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', marginTop: '2px' }}>{user?.email}</div>
              </div>

              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Portal Role</span>
                <div style={{ textTransform: 'capitalize', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem', marginTop: '2px' }}>
                  {user?.role} Mode
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Recruiter Status</span>
                <div style={{ marginTop: '4px' }}>
                  <span className={`status-${user?.recruitRights?.status || 'none'}`}>
                    {user?.recruitRights?.status?.toUpperCase() || 'NOT REQUESTED'}
                  </span>
                </div>
              </div>
            </div>

            {/* Graduation Trigger */}
            {user?.role === 'student' && (
              <div style={{ marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  Completed your studies? Upgrade your account to unlock citizen job boards & community gigs!
                </div>
                <button 
                  onClick={handleGraduate} 
                  className="btn btn-secondary" 
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  🎓 I Have Graduated
                </button>
              </div>
            )}

            {/* Recruiter Request Trigger */}
            {user?.role === 'admin' ? (
              <div style={{ marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>👑</span> Full Recruiter & Administrative Privileges Granted
                </div>
              </div>
            ) : user?.role === 'citizen' && user?.recruitRights?.status !== 'approved' ? (
              <div style={{ marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  Want to post job listings & hire candidates on TuniVerse Career Centre?
                </div>
                <button 
                  onClick={handleRequestRecruit} 
                  className="btn btn-secondary" 
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  📢 Request Recruiter Rights
                </button>
              </div>
            ) : null}
          </div>

          {/* Quick Info Tip */}
          <div className="card glass" style={{ padding: '20px', background: 'var(--red-subtle)', borderColor: 'var(--red-border)' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.2rem' }}>💡</span>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Pro Tip:</strong> Keeping your skills, languages, and digital CV link up to date increases your matching score by up to <strong style={{ color: 'var(--red-bright)' }}>3.5x</strong> with partner recruiters.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
export default UserProfile;

