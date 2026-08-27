import React, { useEffect, useState } from 'react';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

export default function Universities() {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    name: '',
    country: 'Tunisia',
    city: 'Tunis',
    description: '',
    fields: '',
    requirements: '',
    tuitionFee: 0,
    website: '',
    email: '',
    phone: '',
    isFeatured: false,
  });

  const fetchUniversities = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/listings?type=university');
      setUniversities(res.data.data.data || []);
    } catch (err) {
      toast.error('Failed to load universities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUniversities();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this university listing?')) return;
    try {
      await api.delete(`/admin/listings/university/${id}`);
      toast.success('University listing removed');
      setUniversities(prev => prev.filter(u => u._id !== id));
    } catch (err) {
      toast.error('Failed to delete university');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.description) {
      toast.error('Name and description are required');
      return;
    }
    setCreating(true);
    try {
      await api.post('/universities', {
        name: form.name,
        country: form.country,
        city: form.city,
        description: form.description,
        fields: form.fields.split(',').map(f => f.trim()).filter(Boolean),
        requirements: form.requirements.split(',').map(r => r.trim()).filter(Boolean),
        tuitionFee: { amount: Number(form.tuitionFee) || 0, currency: 'TND', period: 'year' },
        website: form.website,
        email: form.email,
        phone: form.phone,
        isFeatured: form.isFeatured,
      });
      toast.success('University added successfully! 🏛️');
      setShowAddModal(false);
      setForm({
        name: '',
        country: 'Tunisia',
        city: 'Tunis',
        description: '',
        fields: '',
        requirements: '',
        tuitionFee: 0,
        website: '',
        email: '',
        phone: '',
        isFeatured: false,
      });
      fetchUniversities();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create university');
    } finally {
      setCreating(false);
    }
  };

  const filtered = universities.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.city?.toLowerCase().includes(search.toLowerCase()) ||
    u.fields?.some(f => f.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="page fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Universities & Higher Education</h1>
          <p className="page-subtitle">Manage university listings, public admissions, tuition fees, and academic programs</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)} 
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span>🏛️</span> + Add University
        </button>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px 20px' }}>
        <input 
          type="text" 
          placeholder="Search by university name, city, field of study..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--border)', padding: '10px 16px', borderRadius: '8px', color: 'var(--text)' }}
        />
      </div>

      {/* Universities Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-sec)' }}>Loading universities...</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-sec)' }}>
          <span style={{ fontSize: '3rem' }}>🏛️</span>
          <h3 style={{ marginTop: '12px' }}>No Universities Found</h3>
          <p style={{ fontSize: '0.85rem' }}>Add universities or run database seeding to populate the directory.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '22px' }}>
          {filtered.map(uni => (
            <div key={uni._id} className="card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
              
              {/* Header: Logo, Title & Delete */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flex: 1, minWidth: 0 }}>
                  <div className="logo-container" style={{
                    width: '48px', height: '48px',
                    borderRadius: '12px',
                    background: 'var(--surface-raised)',
                    border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', flexShrink: 0,
                    transition: 'all var(--t)'
                  }}>
                    {uni.logo ? (
                      <img 
                        className="logo-bw"
                        src={uni.logo} 
                        alt={uni.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }} 
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="logo-badge" style={{ width: '100%', height: '100%', fontSize: '0.85rem' }}>
                        {uni.name?.substring(0, 2).toUpperCase() || 'UN'}
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {uni.isFeatured && (
                      <span style={{ fontSize: '0.65rem', background: 'rgba(225, 29, 72, 0.15)', color: 'var(--accent)', border: '1px solid rgba(225, 29, 72, 0.3)', padding: '2px 8px', borderRadius: '12px', fontWeight: 800, letterSpacing: '0.04em', display: 'inline-block', marginBottom: '4px' }}>
                        ★ FEATURED
                      </span>
                    )}
                    <h3 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>
                      {uni.name}
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-sec)', margin: '2px 0 0' }}>
                      📍 {uni.city}, {uni.country}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => handleDelete(uni._id)} 
                  className="btn btn-ghost btn-sm" 
                  style={{
                    color: 'var(--text-muted)',
                    background: 'var(--surface-raised)',
                    border: '1px solid var(--border)',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all var(--t)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'var(--red)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                  title="Delete university"
                >
                  🗑️
                </button>
              </div>

              {/* Description */}
              <p style={{ fontSize: '0.82rem', color: 'var(--text-sec)', margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.55 }}>
                {uni.description}
              </p>

              {/* Fields Tags */}
              {uni.fields?.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {uni.fields.map((f, idx) => (
                    <span key={idx} style={{ fontSize: '0.72rem', background: 'var(--surface-raised)', border: '1px solid var(--border)', padding: '3px 8px', borderRadius: '6px', color: 'var(--text-sec)', fontWeight: 500 }}>
                      {f}
                    </span>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '14px', fontSize: '0.78rem', color: 'var(--text-sec)' }}>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                  💰 {uni.tuitionFee?.amount > 0 ? `${uni.tuitionFee.amount} TND/yr` : 'Public / Free'}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  📧 {uni.email || 'N/A'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add University Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: '580px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Add New University</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-sec)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>University Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. INSAT, ESPRIT, Faculté des Sciences de Tunis"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', color: 'var(--text)', marginTop: '4px' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>City / Governorate *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Tunis, Ariana, Sousse, Sfax"
                    value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
                    style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', color: 'var(--text)', marginTop: '4px' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Tuition (TND / Year)</label>
                  <input 
                    type="number" 
                    placeholder="0 for public universities"
                    value={form.tuitionFee} onChange={e => setForm({ ...form, tuitionFee: e.target.value })}
                    style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', color: 'var(--text)', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Fields of Study (comma-separated) *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Computer Science, AI, Mechanical Engineering, Medicine"
                  value={form.fields} onChange={e => setForm({ ...form, fields: e.target.value })}
                  style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', color: 'var(--text)', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Overview & Description *</label>
                <textarea 
                  rows="3"
                  placeholder="Details about degrees, accreditation, research labs, campus..."
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', color: 'var(--text)', marginTop: '4px' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Contact Email</label>
                  <input 
                    type="email" 
                    placeholder="contact@university.tn"
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', color: 'var(--text)', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Website URL</label>
                  <input 
                    type="url" 
                    placeholder="https://university.tn"
                    value={form.website} onChange={e => setForm({ ...form, website: e.target.value })}
                    style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', color: 'var(--text)', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" disabled={creating} className="btn btn-primary">
                  {creating ? 'Saving...' : 'Create University Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
