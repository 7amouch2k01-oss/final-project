import React, { useEffect, useState } from 'react';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

export const RecruiterHub = () => {
  const [activeTab, setActiveTab] = useState('listings'); // 'listings', 'post', 'applicants'
  const [postType, setPostType] = useState('Job'); // 'Job', 'Stage', 'University'
  const [myListings, setMyListings] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('remote'); // remote, hybrid, on-site
  const [contractType, setContractType] = useState('CDI');
  const [experienceLevel, setExperienceLevel] = useState('junior');
  const [domain, setDomain] = useState('');
  const [duration, setDuration] = useState('');
  const [country, setCountry] = useState('Tunisia');
  const [city, setCity] = useState('');

  const fetchMyData = async () => {
    setLoading(true);
    try {
      // Fetch all listing types the citizen/recruiter has posted
      const [jobRes, stageRes] = await Promise.allSettled([
        api.get('/jobs/mine'),
        api.get('/stages/mine'),
      ]);

      const jobs = jobRes.status === 'fulfilled' ? (jobRes.value.data.data.jobs || []).map(j => ({ ...j, _type: 'Job' })) : [];
      const stages = stageRes.status === 'fulfilled' ? (stageRes.value.data.data.stages || []).map(s => ({ ...s, _type: 'Stage' })) : [];
      
      const combined = [...jobs, ...stages].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setMyListings(combined);

      // Fetch applicants for the first listing (if any)
      if (combined.length > 0) {
        try {
          const firstId = combined[0]._id;
          const appRes = await api.get(`/applications/listing/${firstId}`);
          setApplicants(appRes.data.data.applicants || []);
        } catch {
          setApplicants([]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyData();
  }, []);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    try {
      if (postType === 'Job') {
        await api.post('/jobs', { title, company, description, location, type, contractType, experienceLevel });
      } else if (postType === 'Stage') {
        await api.post('/stages', { title, company, description, location, type, domain, duration });
      } else if (postType === 'University') {
        await api.post('/universities', { name: title, country, city, description, fields: [domain] });
      }
      toast.success(`${postType} posted successfully!`);
      setActiveTab('listings');
      fetchMyData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post listing');
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await api.patch(`/applications/${appId}/status`, { status: newStatus });
      toast.success('Applicant status updated!');
      fetchMyData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="page container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2>Recruiter Hub</h2>
        <p>Post openings, edit existing listings and review candidate applications</p>
      </div>

      {/* Tabs selector */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
        {[
          { id: 'listings', label: 'My Listings' },
          { id: 'post', label: 'Create Listing' },
          { id: 'applicants', label: 'Applicant Inbox' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)} 
            style={{ 
              background: activeTab === tab.id ? 'var(--red-subtle)' : 'transparent', 
              border: `1px solid ${activeTab === tab.id ? 'var(--red-border)' : 'transparent'}`, 
              borderRadius: 'var(--r-md)',
              padding: '8px 18px', 
              color: activeTab === tab.id ? 'var(--red)' : 'var(--text-secondary)', 
              fontFamily: 'var(--font-display)',
              fontWeight: 600, 
              cursor: 'pointer',
              transition: 'all var(--t-fast)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex-center" style={{ minHeight: '200px' }}>
          <div className="animate-spin" style={{ fontSize: '1.5rem', marginRight: '10px' }}>🌀</div>
          Loading recruiter portal...
        </div>
      ) : (
        <>
          {activeTab === 'listings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {myListings.length === 0 ? (
                <div className="glass" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  You haven't posted any listings yet. Click "Create Listing" above to get started!
                </div>
              ) : (
                myListings.map(l => (
                  <div key={l._id} className="glass" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4>{l.title}</h4>
                      <p style={{ fontSize: '0.85rem' }}>🏢 {l.company} | {l.location} | Views: {l.views || 0}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button onClick={() => { setActiveTab('applicants'); }} className="btn btn-secondary btn-sm">Applicants</button>
                      <button 
                        onClick={async () => {
                          if (window.confirm(`Delete listing "${l.title}"?`)) {
                            try {
                              // Route to the correct endpoint based on listing type
                              const endpoint = l._type === 'Stage' ? `/stages/${l._id}` : `/jobs/${l._id}`;
                              await api.delete(endpoint);
                              setMyListings(myListings.filter(item => item._id !== l._id));
                              toast.success('Listing deleted successfully');
                            } catch (err) {
                              const msg = err.response?.data?.message || 'Failed to delete listing';
                              toast.error(msg);
                            }
                          }
                        }} 
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--red)' }}
                        title="Delete listing"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'post' && (
            <form onSubmit={handlePostSubmit} className="glass" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
              <div className="form-group">
                <label className="form-label">Listing Type</label>
                <select value={postType} onChange={e => setPostType(e.target.value)}>
                  <option value="Job">Job Opening (Career Centre)</option>
                  <option value="Stage">Internship / PFE (Academic & Career)</option>
                  <option value="University">University Course (Academic Hub)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{postType === 'University' ? 'University Name' : 'Listing Title'}</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>

              {postType !== 'University' && (
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input type="text" value={company} onChange={e => setCompany(e.target.value)} required />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea rows="5" value={description} onChange={e => setDescription(e.target.value)} required />
              </div>

              {postType === 'Job' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input type="text" value={location} onChange={e => setLocation(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Job Type</label>
                    <select value={type} onChange={e => setType(e.target.value)}>
                      <option value="remote">Remote-first</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="on-site">On-site</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contract Type</label>
                    <select value={contractType} onChange={e => setContractType(e.target.value)}>
                      <option value="CDI">CDI</option>
                      <option value="CDD">CDD</option>
                      <option value="freelance">Freelance</option>
                    </select>
                  </div>
                </>
              )}

              {postType === 'Stage' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Domain / Field</label>
                    <input type="text" value={domain} onChange={e => setDomain(e.target.value)} placeholder="e.g. Software Development" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration</label>
                    <input type="text" value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 3 months" required />
                  </div>
                </>
              )}

              {postType === 'University' && (
                <>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input type="text" value={city} onChange={e => setCity(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Main Academic Field</label>
                    <input type="text" value={domain} onChange={e => setDomain(e.target.value)} placeholder="e.g. Computer Science" required />
                  </div>
                </>
              )}

              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Post Listing</button>
            </form>
          )}

          {activeTab === 'applicants' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {applicants.length === 0 ? (
                <div className="glass" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No applicants for your listings yet.
                </div>
              ) : (
                applicants.map(a => (
                  <div key={a._id} className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ color: 'var(--text-primary)' }}>{a.applicantId?.name || 'Applicant'}</h4>
                      <span className={`status-${a.status}`}>{a.status.replace('_', ' ')}</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      <strong>Cover Letter:</strong> {a.coverLetter}
                    </p>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                      <button onClick={() => handleStatusChange(a._id, 'accepted')} className="btn btn-secondary btn-sm" style={{ borderColor: 'rgba(16,185,129,0.3)', color: '#34d399' }}>Accept</button>
                      <button onClick={() => handleStatusChange(a._id, 'rejected')} className="btn btn-danger btn-sm">Reject</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
export default RecruiterHub;
