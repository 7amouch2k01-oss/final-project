import React, { useEffect, useState } from 'react';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

export default function Listings() {
  const [activeTab, setActiveTab] = useState('job'); // 'job' or 'stage'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    title: '',
    company: '',
    description: '',
    location: 'Tunis',
    type: 'on-site',
    contractType: 'CDI',
    experienceLevel: 'junior',
    domain: 'Software Engineering',
    duration: '3-6 Months',
    tags: '',
  });

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/listings?type=${activeTab}`);
      setItems(res.data.data.data || []);
    } catch (err) {
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [activeTab]);

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to remove this ${activeTab}?`)) return;
    try {
      await api.delete(`/admin/listings/${activeTab}/${id}`);
      toast.success(`${activeTab === 'job' ? 'Job' : 'Stage'} listing removed`);
      setItems(prev => prev.filter(i => i._id !== id));
    } catch (err) {
      toast.error('Failed to delete listing');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title || !form.company || !form.description) {
      toast.error('Title, company, and description are required');
      return;
    }
    setCreating(true);
    try {
      if (activeTab === 'job') {
        await api.post('/jobs', {
          title: form.title,
          company: form.company,
          description: form.description,
          location: form.location,
          type: form.type,
          contractType: form.contractType,
          experienceLevel: form.experienceLevel,
          tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        });
      } else {
        await api.post('/stages', {
          title: form.title,
          company: form.company,
          description: form.description,
          location: form.location,
          type: form.type,
          domain: form.domain,
          duration: form.duration,
        });
      }
      toast.success(`${activeTab === 'job' ? 'Job' : 'Stage'} published successfully!`);
      setShowAddModal(false);
      setForm({
        title: '',
        company: '',
        description: '',
        location: 'Tunis',
        type: 'on-site',
        contractType: 'CDI',
        experienceLevel: 'junior',
        domain: 'Software Engineering',
        duration: '3-6 Months',
        tags: '',
      });
      fetchListings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create listing');
    } finally {
      setCreating(false);
    }
  };

  const filtered = items.filter(i =>
    i.title?.toLowerCase().includes(search.toLowerCase()) ||
    i.company?.toLowerCase().includes(search.toLowerCase()) ||
    i.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Jobs & Internships Directory</h1>
          <p className="page-subtitle">Inspect, moderate, and manage official jobs and student stage opportunities across Tunisia</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)} 
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span>➕</span> + Add {activeTab === 'job' ? 'Job' : 'Stage'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('job')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: `1px solid ${activeTab === 'job' ? 'var(--accent)' : 'var(--border)'}`,
            background: activeTab === 'job' ? 'rgba(225, 29, 72, 0.12)' : 'var(--surface)',
            color: activeTab === 'job' ? 'var(--accent)' : 'var(--text-sec)',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          💼 Official Jobs ({activeTab === 'job' ? items.length : '...'})
        </button>
        <button
          onClick={() => setActiveTab('stage')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: `1px solid ${activeTab === 'stage' ? 'var(--accent)' : 'var(--border)'}`,
            background: activeTab === 'stage' ? 'rgba(225, 29, 72, 0.12)' : 'var(--surface)',
            color: activeTab === 'stage' ? 'var(--accent)' : 'var(--text-sec)',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          🎓 Internships & Stages ({activeTab === 'stage' ? items.length : '...'})
        </button>
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px 20px' }}>
        <input 
          type="text" 
          placeholder={`Search ${activeTab === 'job' ? 'jobs' : 'stages'} by title, company, or city...`}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--border)', padding: '10px 16px', borderRadius: '8px', color: 'var(--text)' }}
        />
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-sec)' }}>Loading {activeTab} listings...</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-sec)' }}>
          <span style={{ fontSize: '3rem' }}>💼</span>
          <h3 style={{ marginTop: '12px' }}>No {activeTab === 'job' ? 'Jobs' : 'Stages'} Found</h3>
          <p style={{ fontSize: '0.85rem' }}>Create listings or run database seeding to populate the directory.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filtered.map(item => (
            <div key={item._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', background: 'var(--surface-raised)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                    🏢 {item.company}
                  </span>
                  <h3 style={{ fontSize: '1.15rem', margin: '6px 0 2px' }}>{item.title}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-sec)', margin: 0 }}>📍 {item.location} • {item.type}</p>
                </div>
                <button 
                  onClick={() => handleDelete(item._id)} 
                  className="btn btn-ghost btn-sm" 
                  style={{ color: 'var(--red)' }}
                  title="Delete listing"
                >
                  🗑️
                </button>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-sec)', margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {item.description}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '12px', fontSize: '0.78rem', color: 'var(--text-sec)' }}>
                <span>{activeTab === 'job' ? `💼 ${item.contractType} (${item.experienceLevel})` : `⏱️ ${item.duration}`}</span>
                <span>Posted by: {item.recruiterId?.name || 'Recruiter'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Listing Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: '580px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Publish {activeTab === 'job' ? 'Job Opening' : 'Stage Internship'}</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-sec)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Title / Role *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Full Stack Developer"
                    value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', color: 'var(--text)', marginTop: '4px' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Company Name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Vermeg, Instadeep, BIAT"
                    value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}
                    style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', color: 'var(--text)', marginTop: '4px' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Detailed Description *</label>
                <textarea 
                  rows="4"
                  placeholder="Describe the job duties, tech stack, requirements, compensation..."
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', color: 'var(--text)', marginTop: '4px' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Location (City)</label>
                  <input 
                    type="text" 
                    value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                    style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', color: 'var(--text)', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Work Mode</label>
                  <select 
                    value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                    style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', color: 'var(--text)', marginTop: '4px' }}
                  >
                    <option value="on-site">On-Site</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                {activeTab === 'job' ? (
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Contract</label>
                    <select 
                      value={form.contractType} onChange={e => setForm({ ...form, contractType: e.target.value })}
                      style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', color: 'var(--text)', marginTop: '4px' }}
                    >
                      <option value="CDI">CDI</option>
                      <option value="CDD">CDD</option>
                      <option value="freelance">Freelance</option>
                      <option value="part-time">Part-Time</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Duration</label>
                    <input 
                      type="text" 
                      value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })}
                      placeholder="e.g. 4-6 Months"
                      style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', color: 'var(--text)', marginTop: '4px' }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" disabled={creating} className="btn btn-primary">
                  {creating ? 'Saving...' : `Publish ${activeTab === 'job' ? 'Job' : 'Stage'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
