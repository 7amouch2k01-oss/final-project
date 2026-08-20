import React, { useEffect, useState } from 'react';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

export const Jobs = () => {
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [submittingApp, setSubmittingApp] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/jobs?search=${search}`);
      setJobs(res.data.data.jobs);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setSubmittingApp(true);
    try {
      await api.post('/applications', {
        targetId: selectedJob._id,
        targetType: 'Job',
        targetModel: 'Job',
        coverLetter
      });
      toast.success('Application submitted successfully!');
      setSelectedJob(null);
      setCoverLetter('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Application failed');
    } finally {
      setSubmittingApp(false);
    }
  };

  const handleSaveJob = async (jobId) => {
    try {
      await api.post(`/users/me/saved-jobs/${jobId}`);
      toast.success('Job saved!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save job');
    }
  };

  return (
    <div className="page container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2>Career Board (Jobs)</h2>
          <p>Find full-time, part-time or remote opportunities tailored for you</p>
        </div>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            placeholder="Search jobs..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '240px' }}
          />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
      </div>

      {loading ? (
        <div className="flex-center" style={{ minHeight: '200px' }}>
          <div className="animate-spin" style={{ fontSize: '2rem' }}>⟳</div>
        </div>
      ) : (
        <div className="grid-auto">
          {jobs.length === 0 ? (
            <p>No jobs found.</p>
          ) : (
            jobs.map(j => (
              <div key={j._id} className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {j.companyLogo ? (
                      <img src={j.companyLogo} alt="Logo" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '48px', height: '48px', background: 'var(--grey-200)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>💼</div>
                    )}
                    <div>
                      <h3 style={{ fontSize: '1.15rem' }}>{j.title}</h3>
                      <p style={{ fontSize: '0.8rem' }}>🏢 {j.company} | 📍 {j.location || 'Remote'}</p>
                    </div>
                  </div>
                  <button onClick={() => handleSaveJob(j._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}>❤️</button>
                </div>
                <p style={{ fontSize: '0.9rem' }}>{j.description}</p>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <div>⏱️ <strong>Contract:</strong> {j.contractType} | 📈 {j.experienceLevel}</div>
                  <div style={{ marginTop: '4px' }}>💵 <strong>Salary:</strong> {j.salary?.isHidden ? 'Competitive' : `${j.salary?.min} - ${j.salary?.max} ${j.salary?.currency}/${j.salary?.period}`}</div>
                </div>
                <button onClick={() => setSelectedJob(j)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}>Apply Now</button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Apply Modal */}
      {selectedJob && (
        <div className="modal-backdrop animate-fade-in">
          <div className="modal">
            <h3 style={{ marginBottom: '16px' }}>Apply to {selectedJob.company} ({selectedJob.title})</h3>
            <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Cover Letter</label>
                <textarea 
                  rows="6" 
                  placeholder="Explain why you're a great fit for this position..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setSelectedJob(null)} className="btn btn-ghost">Cancel</button>
                <button type="submit" disabled={submittingApp} className="btn btn-primary">
                  {submittingApp ? 'Submitting...' : 'Submit Application'}
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
