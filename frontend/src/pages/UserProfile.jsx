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
      toast.success('Profile updated successfully!');
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

  return (
    <div className="page container animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '32px' }} className="dashboard-grid">
      <div>
        <div className="section-label">Account Settings</div>
        <h2 style={{ marginBottom: '24px' }}>Edit & Complete Profile</h2>
        
        <form onSubmit={handleSubmit} className="glass" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* General */}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          
          <div className="form-group">
            <label className="form-label">Bio / Career Summary</label>
            <textarea rows="4" value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell universities, employers or applicants about yourself..." />
          </div>

          <div className="form-group">
            <label className="form-label">Skills (comma separated)</label>
            <input type="text" value={skills} onChange={e => setSkills(e.target.value)} placeholder="React, Node.js, Python, Marketing..." />
          </div>

          <div className="form-group">
            <label className="form-label">Languages (comma separated)</label>
            <input type="text" value={languages} onChange={e => setLanguages(e.target.value)} placeholder="Arabic, French, English..." />
          </div>

          <div className="form-group">
            <label className="form-label">CV / Portfolio Link</label>
            <input type="url" value={cvUrl} onChange={e => setCvUrl(e.target.value)} placeholder="https://drive.google.com/your-cv" />
          </div>

          {/* Education */}
          <div className="divider" />
          <h3>🎓 Education History</h3>
          <div className="form-group">
            <label className="form-label">University / Institution</label>
            <input type="text" value={school} onChange={e => setSchool(e.target.value)} placeholder="e.g. INSAT, ESPRIT, ENIT" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Degree</label>
              <input type="text" value={degree} onChange={e => setDegree(e.target.value)} placeholder="e.g. Engineering Diploma, Master" />
            </div>
            <div className="form-group">
              <label className="form-label">Field</label>
              <input type="text" value={field} onChange={e => setField(e.target.value)} placeholder="e.g. Computer Science" />
            </div>
          </div>

          {/* Experience */}
          <div className="divider" />
          <h3>💼 Work / Internship Experience</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Company</label>
              <input type="text" value={expCompany} onChange={e => setExpCompany(e.target.value)} placeholder="e.g. Vermeg, Freelance" />
            </div>
            <div className="form-group">
              <label className="form-label">Job Title</label>
              <input type="text" value={expTitle} onChange={e => setExpTitle(e.target.value)} placeholder="e.g. Software Engineer" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea rows="3" value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder="Highlight your main tasks and achievements..." />
          </div>

          {/* Recruiter / Company */}
          {(user?.role === 'citizen' || user?.recruitRights?.status === 'approved') && (
            <>
              <div className="divider" />
              <h3>🏢 Company & Recruiter Profile</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. TechCorp Tunisia" />
                </div>
                <div className="form-group">
                  <label className="form-label">Company Location</label>
                  <input type="text" value={companyLocation} onChange={e => setCompanyLocation(e.target.value)} placeholder="e.g. Tunis, Sousse" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Company Website</label>
                <input type="url" value={companyWebsite} onChange={e => setCompanyWebsite(e.target.value)} placeholder="https://techcorp.tn" />
              </div>
              <div className="form-group">
                <label className="form-label">Company Description</label>
                <textarea rows="3" value={companyDesc} onChange={e => setCompanyDesc(e.target.value)} placeholder="About the company and hiring culture..." />
              </div>
            </>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '12px' }}>
            {loading ? '⏳ Saving...' : '💾 Save Profile Changes'}
          </button>
        </form>
      </div>

      {/* Sidebar cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h3>Account Overview</h3>
        <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Email Address</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user?.email}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Portal Role</div>
            <div style={{ textTransform: 'capitalize', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.role}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Recruiter Status</div>
            <span className={`status-${user?.recruitRights?.status || 'none'}`} style={{ marginTop: '4px' }}>
              {user?.recruitRights?.status?.toUpperCase() || 'NONE'}
            </span>
          </div>

          {user?.role === 'student' && (
            <div style={{ marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--glass-border)' }}>
              <button onClick={handleGraduate} className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                🎓 I Have Graduated
              </button>
            </div>
          )}

          {user?.role === 'citizen' && user?.recruitRights?.status !== 'approved' && (
            <div style={{ marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--glass-border)' }}>
              <button onClick={handleRequestRecruit} className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                📢 Request Recruiter Rights
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default UserProfile;
