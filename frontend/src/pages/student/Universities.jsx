import React, { useEffect, useState } from 'react';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

export const Universities = () => {
  const { user } = useAuthStore();
  const [unis, setUnis] = useState([]);
  const [appliedUniIds, setAppliedUniIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUni, setSelectedUni] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [submittingApp, setSubmittingApp] = useState(false);

  const fetchUnisAndApps = async () => {
    setLoading(true);
    try {
      const [res, myAppsRes] = await Promise.all([
        api.get(`/universities?search=${search}`),
        api.get('/applications/mine').catch(() => ({ data: { data: { applications: [] } } }))
      ]);
      setUnis(res.data.data.universities || []);
      const applied = new Set((myAppsRes.data.data.applications || []).map(a => a.targetId?._id || a.targetId));
      setAppliedUniIds(applied);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load universities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnisAndApps();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUnisAndApps();
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to apply');
      return;
    }
    if (appliedUniIds.has(selectedUni._id)) {
      toast.error('You have already applied to this university');
      return;
    }
    setSubmittingApp(true);
    try {
      const formData = new FormData();
      formData.append('targetId', selectedUni._id);
      formData.append('targetType', 'University');
      formData.append('targetModel', 'University');
      formData.append('coverLetter', coverLetter);
      if (docFile) {
        formData.append('documents', docFile);
      } else if (user.cvUrl) {
        formData.append('cvUrl', user.cvUrl);
      }

      await api.post('/applications', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Application submitted successfully! 🎓');
      setAppliedUniIds(prev => new Set([...prev, selectedUni._id]));
      setSelectedUni(null);
      setCoverLetter('');
      setDocFile(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Application submission failed');
    } finally {
      setSubmittingApp(false);
    }
  };

  return (
    <div className="page container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="section-label">TuniStudy Academy</div>
          <h2 style={{ fontSize: '2rem', marginTop: '6px' }}>University Directory</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Explore accredited higher education courses and programs across Tunisia</p>
        </div>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            placeholder="Search universities, fields..." 
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
          <span style={{ marginLeft: '12px', color: 'var(--text-secondary)' }}>Loading directory...</span>
        </div>
      ) : (
        <div className="grid-auto">
          {unis.length === 0 ? (
            <div className="card flex-center" style={{ padding: '48px', gridColumn: '1 / -1', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '2.5rem' }}>🏛️</span>
              <h3>No universities found</h3>
              <p style={{ color: 'var(--text-muted)' }}>Try adjusting your search keywords.</p>
            </div>
          ) : (
            unis.map(u => {
              const isApplied = appliedUniIds.has(u._id);
              return (
                <div key={u._id} className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    {u.logo ? (
                      <img 
                        src={u.logo} 
                        alt={u.name || 'Logo'} 
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
                      display: u.logo ? 'none' : 'flex', 
                      alignItems: 'center', justifyContent: 'center', 
                      fontWeight: 700, fontSize: '1.4rem', color: 'var(--text-primary)' 
                    }}>
                      🎓
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: '1.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>📍 {u.city}, {u.country}</p>
                    </div>
                  </div>
                  
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {u.description}
                  </p>
                  
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--r-md)', border: '1px solid var(--glass-border)' }}>
                    <div>📚 <strong>Fields:</strong> {u.fields?.slice(0, 3).join(', ')}{u.fields?.length > 3 ? '...' : ''}</div>
                    <div style={{ marginTop: '4px' }}>💰 <strong>Tuition:</strong> {u.tuitionFee?.amount} {u.tuitionFee?.currency}/{u.tuitionFee?.period}</div>
                  </div>

                  <button 
                    onClick={() => setSelectedUni(u)} 
                    disabled={isApplied}
                    className={`btn ${isApplied ? 'btn-secondary' : 'btn-primary'}`} 
                    style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}
                  >
                    {isApplied ? '✓ Application Submitted' : 'Apply Now →'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Apply Modal */}
      {selectedUni && (
        <div className="modal-backdrop animate-fade-in">
          <div className="modal" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <div className="section-label" style={{ fontSize: '0.65rem' }}>Course Application</div>
                <h3 style={{ fontSize: '1.35rem', marginTop: '4px' }}>Apply to {selectedUni.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedUni(null)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="form-group">
                <label className="form-label">Cover Letter / Statement of Purpose</label>
                <textarea 
                  rows="5" 
                  placeholder="Introduce yourself, your academic background, and why you are choosing this university..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  required
                />
              </div>

              {/* Document / CV Attachment */}
              <div className="form-group">
                <label className="form-label">Attach CV / Academic Document (Optional)</label>
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
                <button type="button" onClick={() => setSelectedUni(null)} className="btn btn-ghost">
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
export default Universities;
