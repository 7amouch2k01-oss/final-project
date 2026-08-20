import React, { useEffect, useState } from 'react';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

export const Stages = () => {
  const { user } = useAuthStore();
  const [stages, setStages] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [submittingApp, setSubmittingApp] = useState(false);

  const fetchStages = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/stages?search=${search}`);
      setStages(res.data.data.stages);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load stages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStages();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStages();
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to apply');
      return;
    }
    setSubmittingApp(true);
    try {
      await api.post('/applications', {
        targetId: selectedStage._id,
        targetType: 'Stage',
        targetModel: 'Stage',
        coverLetter
      });
      toast.success('Application submitted successfully!');
      setSelectedStage(null);
      setCoverLetter('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Application failed');
    } finally {
      setSubmittingApp(false);
    }
  };

  return (
    <div className="page container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2>Internship Board (Stages)</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Find university-mandated or summer internships to build your skill set</p>
        </div>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            placeholder="Search internships..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '240px' }}
          />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
      </div>

      {loading ? (
        <div className="flex-center" style={{ minHeight: '200px' }}>
          <div className="animate-spin" style={{ fontSize: '2rem', color: 'var(--text-muted)' }}>⟳</div>
          <span style={{ marginLeft: '12px', color: 'var(--text-muted)' }}>Loading...</span>
        </div>
      ) : (
        <div className="grid-auto">
          {stages.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No internships found.</p>
          ) : (
            stages.map(s => (
              <div key={s._id} className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {s.companyLogo ? <img src={s.companyLogo} alt="Logo" style={{ width: '48px', height: '48px', borderRadius: 'var(--r-md)', objectFit: 'cover' }} /> : <div style={{ width: '48px', height: '48px', background: 'var(--grey-200)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>💼</div>}
                  <div>
                    <h3 style={{ fontSize: '1.15rem' }}>{s.title}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>🏢 {s.company} | 📍 {s.location || 'Remote'}</p>
                  </div>
                </div>
                <p style={{ fontSize: '0.9rem' }}>{s.description}</p>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <div>⌛ <strong>Duration:</strong> {s.duration}</div>
                  <div style={{ marginTop: '4px' }}>💵 <strong>Stipend:</strong> {s.stipend?.isPaid ? `${s.stipend.amount} ${s.stipend.currency}/mo` : 'Unpaid'}</div>
                </div>
                <button onClick={() => setSelectedStage(s)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}>Apply Now</button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Apply Modal */}
      {selectedStage && (
        <div className="modal-backdrop animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal" style={{ width: '90%', maxWidth: '500px', padding: '32px', background: '#111', border: '1px solid var(--glass-border)', borderRadius: 'var(--r-md)' }}>
            <h3 style={{ marginBottom: '16px' }}>Apply to {selectedStage.company} ({selectedStage.title})</h3>
            <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Cover Letter</label>
                <textarea 
                  rows="6" 
                  placeholder="Explain why you're a great fit for this internship..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setSelectedStage(null)} className="btn btn-ghost">Cancel</button>
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
export default Stages;
