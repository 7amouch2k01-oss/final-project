import React, { useEffect, useState } from 'react';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

export const Stages = () => {
  const { user } = useAuthStore();
  const [stages, setStages] = useState([]);
  const [appliedStageIds, setAppliedStageIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [submittingApp, setSubmittingApp] = useState(false);

  const fetchStagesAndApps = async () => {
    setLoading(true);
    try {
      const [res, myAppsRes] = await Promise.all([
        api.get(`/stages?search=${search}`),
        api.get('/applications/mine').catch(() => ({ data: { data: { applications: [] } } }))
      ]);
      setStages(res.data.data.stages || []);
      const applied = new Set((myAppsRes.data.data.applications || []).map(a => a.targetId?._id || a.targetId));
      setAppliedStageIds(applied);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load internships');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStagesAndApps();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStagesAndApps();
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to apply');
      return;
    }
    if (appliedStageIds.has(selectedStage._id)) {
      toast.error('You have already applied to this internship');
      return;
    }
    setSubmittingApp(true);
    try {
      const formData = new FormData();
      formData.append('targetId', selectedStage._id);
      formData.append('targetType', 'Stage');
      formData.append('targetModel', 'Stage');
      formData.append('coverLetter', coverLetter);
      if (docFile) {
        formData.append('documents', docFile);
      } else if (user.cvUrl) {
        formData.append('cvUrl', user.cvUrl);
      }

      await api.post('/applications', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Internship application submitted successfully! 💼');
      setAppliedStageIds(prev => new Set([...prev, selectedStage._id]));
      setSelectedStage(null);
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
          <div className="section-label">Internship Hub</div>
          <h2 style={{ fontSize: '2rem', marginTop: '6px' }}>Internship Board (Stages)</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Find university-mandated (PFE, PFA, ouvrier) or summer internships to build your industry experience</p>
        </div>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            placeholder="Search internships, skills, company..." 
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
          <span style={{ marginLeft: '12px', color: 'var(--text-secondary)' }}>Loading internships...</span>
        </div>
      ) : (
        <div className="grid-auto">
          {stages.length === 0 ? (
            <div className="card flex-center" style={{ padding: '48px', gridColumn: '1 / -1', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '2.5rem' }}>💼</span>
              <h3>No internships found</h3>
              <p style={{ color: 'var(--text-muted)' }}>Try adjusting your search criteria.</p>
            </div>
          ) : (
            stages.map(s => {
              const isApplied = appliedStageIds.has(s._id);
              return (
                <div key={s._id} className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    {s.companyLogo ? (
                      <img 
                        src={s.companyLogo} 
                        alt={s.company || 'Logo'} 
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
                      display: s.companyLogo ? 'none' : 'flex', 
                      alignItems: 'center', justifyContent: 'center', 
                      fontWeight: 700, fontSize: '1.4rem', color: 'var(--text-primary)' 
                    }}>
                      💼
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: '1.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>🏢 {s.company} | 📍 {s.location || 'Remote'}</p>
                    </div>
                  </div>
                  
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {s.description}
                  </p>
                  
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--r-md)', border: '1px solid var(--glass-border)' }}>
                    <div>⌛ <strong>Duration:</strong> {s.duration} | 🏷️ {s.domain}</div>
                    <div style={{ marginTop: '4px' }}>💵 <strong>Stipend:</strong> {s.stipend?.isPaid ? `${s.stipend.amount} ${s.stipend.currency}/mo` : 'Unpaid internship'}</div>
                  </div>

                  <button 
                    onClick={() => setSelectedStage(s)} 
                    disabled={isApplied}
                    className={`btn ${isApplied ? 'btn-secondary' : 'btn-primary'}`} 
                    style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}
                  >
                    {isApplied ? '✓ Application Submitted' : 'Apply for Stage →'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Apply Modal */}
      {selectedStage && (
        <div className="modal-backdrop animate-fade-in">
          <div className="modal" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <div className="section-label" style={{ fontSize: '0.65rem' }}>Stage Application</div>
                <h3 style={{ fontSize: '1.35rem', marginTop: '4px' }}>Apply to {selectedStage.company}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{selectedStage.title}</p>
              </div>
              <button 
                onClick={() => setSelectedStage(null)} 
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
                  placeholder="Introduce yourself, your academic institution, your technical skills, and why you are interested in this internship..."
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
                <button type="button" onClick={() => setSelectedStage(null)} className="btn btn-ghost">
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
export default Stages;
