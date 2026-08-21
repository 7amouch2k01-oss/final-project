import React, { useEffect, useState } from 'react';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

export const Universities = () => {
  const { user } = useAuthStore();
  const [unis, setUnis] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUni, setSelectedUni] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [submittingApp, setSubmittingApp] = useState(false);

  const fetchUnis = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/universities?search=${search}`);
      setUnis(res.data.data.universities);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load universities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnis();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUnis();
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
        targetId: selectedUni._id,
        targetType: 'University',   // used to look up the listing model
        targetModel: 'University',  // required by Application schema refPath
        coverLetter
      });
      toast.success('Application submitted successfully!');
      setSelectedUni(null);
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
          <h2>University Directory</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Explore top higher education opportunities in Tunisia</p>
        </div>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            placeholder="Search universities..." 
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
          {unis.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No universities found.</p>
          ) : (
            unis.map(u => (
              <div key={u._id} className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {u.logo ? (
                    <img 
                      src={u.logo} 
                      alt={u.name || 'Logo'} 
                      style={{ width: '48px', height: '48px', borderRadius: 'var(--r-md)', objectFit: 'cover' }} 
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
                    display: u.logo ? 'none' : 'flex', 
                    alignItems: 'center', justifyContent: 'center', 
                    fontWeight: 600, fontSize: '1.2rem', color: 'var(--text-primary)' 
                  }}>
                    🎓
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem' }}>{u.name}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>📍 {u.city}, {u.country}</p>
                  </div>
                </div>
                <p style={{ fontSize: '0.9rem', lineBreak: 'anywhere' }}>{u.description}</p>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <div>📚 <strong>Fields:</strong> {u.fields.join(', ')}</div>
                  <div style={{ marginTop: '4px' }}>💰 <strong>Tuition:</strong> {u.tuitionFee?.amount} {u.tuitionFee?.currency}/{u.tuitionFee?.period}</div>
                </div>
                <button onClick={() => setSelectedUni(u)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}>Apply Now</button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Apply Modal */}
      {selectedUni && (
        <div className="modal-backdrop animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal" style={{ width: '90%', maxWidth: '500px', padding: '32px', background: '#111', border: '1px solid var(--glass-border)', borderRadius: 'var(--r-md)' }}>
            <h3 style={{ marginBottom: '16px' }}>Apply to {selectedUni.name}</h3>
            <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Cover Letter / Statement of Purpose</label>
                <textarea 
                  rows="6" 
                  placeholder="Explain why you want to enroll in this course..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setSelectedUni(null)} className="btn btn-ghost">Cancel</button>
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
export default Universities;
