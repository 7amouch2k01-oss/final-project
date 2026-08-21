import React, { useEffect, useState } from 'react';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

export const Jobs = () => {
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [submittingApp, setSubmittingApp] = useState(false);

  const fetchJobsAndUserData = async () => {
    setLoading(true);
    try {
      const [res, myAppsRes] = await Promise.all([
        api.get(`/jobs?search=${search}`),
        api.get('/applications/mine').catch(() => ({ data: { data: { applications: [] } } }))
      ]);
      setJobs(res.data.data.jobs || []);
      const applied = new Set((myAppsRes.data.data.applications || []).map(a => a.targetId?._id || a.targetId));
      setAppliedJobIds(applied);
      if (user?.savedJobs) {
        setSavedJobIds(new Set(user.savedJobs.map(j => (typeof j === 'object' ? j._id : j))));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobsAndUserData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobsAndUserData();
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to apply');
      return;
    }
    if (appliedJobIds.has(selectedJob._id)) {
      toast.error('You have already applied to this job');
      return;
    }
    setSubmittingApp(true);
    try {
      const formData = new FormData();
      formData.append('targetId', selectedJob._id);
      formData.append('targetType', 'Job');
      formData.append('targetModel', 'Job');
      formData.append('coverLetter', coverLetter);
      if (docFile) {
        formData.append('documents', docFile);
      } else if (user.cvUrl) {
        formData.append('cvUrl', user.cvUrl);
      }

      await api.post('/applications', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Job application submitted successfully! 💼');
      setAppliedJobIds(prev => new Set([...prev, selectedJob._id]));
      setSelectedJob(null);
      setCoverLetter('');
      setDocFile(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Application submission failed');
    } finally {
      setSubmittingApp(false);
    }
  };

  const handleSaveJob = async (jobId) => {
    try {
      await api.post(`/users/me/saved-jobs/${jobId}`);
      setSavedJobIds(prev => {
        const next = new Set(prev);
        if (next.has(jobId)) next.delete(jobId);
        else next.add(jobId);
        return next;
      });
      toast.success(savedJobIds.has(jobId) ? 'Job removed from saved' : 'Job saved to favorites! ❤️');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update saved job');
    }
  };

  return (
    <div className="page container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="section-label">TuniJob Opportunities</div>
          <h2 style={{ fontSize: '2rem', marginTop: '6px' }}>Career Board (Jobs)</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Find full-time, part-time, CDI, CDD, or remote positions tailored for Tunisian professionals</p>
        </div>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            placeholder="Search job title, skills, company..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '260px' }}
          />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
      </div>

      {loading ? (
        <div className="flex-center" style={{ minHeight: '260px' }}>
          <div className="animate-spin" style={{ fontSize: '2rem', color: 'var(--red)' }}>⟳</div>
          <span style={{ marginLeft: '12px', color: 'var(--text-secondary)' }}>Loading career opportunities...</span>
        </div>
      ) : (
        <div className="grid-auto">
          {jobs.length === 0 ? (
            <div className="card flex-center" style={{ padding: '48px', gridColumn: '1 / -1', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '2.5rem' }}>💼</span>
              <h3>No jobs found</h3>
              <p style={{ color: 'var(--text-muted)' }}>Try searching with different keywords.</p>
            </div>
          ) : (
            jobs.map(j => {
              const isApplied = appliedJobIds.has(j._id);
              const isSaved = savedJobIds.has(j._id);
              return (
                <div key={j._id} className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flex: 1, minWidth: 0 }}>
                      {j.companyLogo ? (
                        <img 
                          src={j.companyLogo} 
                          alt={j.company || 'Logo'} 
                          style={{ width: '52px', height: '52px', borderRadius: 'var(--r-md)', objectFit: 'cover', border: '1px solid var(--glass-border)' }} 
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div style={{ 
                        width: '52px', height: '52px', 
                        background: 'var(--bg-elevated)', 
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--r-md)', 
                        display: j.companyLogo ? 'none' : 'flex', 
                        alignItems: 'center', justifyContent: 'center', 
                        fontWeight: 700, fontSize: '1.4rem', color: 'var(--text-primary)' 
                      }}>
                        {j.company ? j.company[0].toUpperCase() : '💼'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontSize: '1.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.title}</h3>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>🏢 {j.company} | 📍 {j.location || 'Remote'}</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleSaveJob(j._id)} 
                      style={{ 
                        background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.35rem', 
                        opacity: isSaved ? 1 : 0.45, transition: 'transform var(--t-fast), opacity var(--t-fast)' 
                      }}
                      title={isSaved ? 'Remove from saved' : 'Save job'}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      {isSaved ? '❤️' : '🤍'}
                    </button>
                  </div>
                  
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {j.description}
                  </p>
                  
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--r-md)', border: '1px solid var(--glass-border)' }}>
                    <div>⏱️ <strong>Contract:</strong> {j.contractType} | 📈 {j.experienceLevel} | 🌐 {j.type}</div>
                    <div style={{ marginTop: '4px' }}>
                      💵 <strong>Salary:</strong> {j.salary?.isHidden ? 'Competitive / Disclosed on interview' : `${j.salary?.min} - ${j.salary?.max} ${j.salary?.currency}/${j.salary?.period}`}
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedJob(j)} 
                    disabled={isApplied}
                    className={`btn ${isApplied ? 'btn-secondary' : 'btn-primary'}`} 
                    style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}
                  >
                    {isApplied ? '✓ Application Submitted' : 'Apply for Job →'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Apply Modal */}
      {selectedJob && (
        <div className="modal-backdrop animate-fade-in">
          <div className="modal" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <div className="section-label" style={{ fontSize: '0.65rem' }}>Job Application</div>
                <h3 style={{ fontSize: '1.35rem', marginTop: '4px' }}>Apply to {selectedJob.company}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{selectedJob.title} ({selectedJob.contractType})</p>
              </div>
              <button 
                onClick={() => setSelectedJob(null)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="form-group">
                <label className="form-label">Cover Letter / Pitch</label>
                <textarea 
                  rows="5" 
                  placeholder="Explain why your experience and skills make you an ideal match for this role..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  required
                />
              </div>

              {/* Document / CV Attachment */}
              <div className="form-group">
                <label className="form-label">Attach CV / Resume (Optional)</label>
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx,image/*" 
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                  style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                />
                {user?.cvUrl && !docFile && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    📎 Your profile CV will be attached automatically if no file is selected.
                  </span>
                )}
                {docFile && (
                  <span style={{ fontSize: '0.78rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    ✓ Selected: {docFile.name} ({(docFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setSelectedJob(null)} className="btn btn-ghost">
                  Cancel
                </button>
                <button type="submit" disabled={submittingApp} className="btn btn-primary">
                  {submittingApp ? 'Submitting...' : 'Submit Application 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Jobs;
