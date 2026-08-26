import React, { useEffect, useState } from 'react';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

export default function Recruiters() {
  const [activeTab, setActiveTab] = useState('institutions'); // 'institutions' or 'citizens'
  const [institutions, setInstitutions] = useState([]);
  const [citizenRequests, setCitizenRequests] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [instRes, recruitRes] = await Promise.allSettled([
        api.get(`/admin/institutions?status=${filter}&search=${search}`),
        api.get('/admin/recruit-requests'),
      ]);
      
      if (instRes.status === 'fulfilled') {
        setInstitutions(instRes.value.data.data.institutions || []);
      }
      if (recruitRes.status === 'fulfilled') {
        setCitizenRequests(recruitRes.value.data.data.requests || []);
      }
    } catch (err) {
      console.error('Failed to load recruiter data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  // Approve / Reject Institution
  const handleInstitutionAction = async (id, action, name) => {
    let reason = '';
    if (action === 'reject') {
      reason = prompt(`Enter rejection reason for "${name}" (optional):`) || '';
    }
    setActionLoading(true);
    try {
      await api.patch(`/admin/institutions/${id}/${action}`, { reason });
      toast.success(`Institution "${name}" ${action}d successfully!`);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Approve / Reject Citizen Recruiter Request
  const handleCitizenAction = async (id, action, name) => {
    let reason = '';
    if (action === 'reject') {
      reason = prompt(`Enter rejection reason for ${name} (optional):`) || '';
    }
    setActionLoading(true);
    try {
      await api.patch(`/admin/recruit-requests/${id}/${action}`, { reason });
      toast.success(`Recruiter rights for ${name} ${action}d successfully!`);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const STATUS_CLASS = { pending: 'yellow', approved: 'green', rejected: 'red' };
  const pendingInstCount = institutions.filter(i => i.status === 'pending').length;
  const pendingCitizenCount = citizenRequests.filter(r => r.recruitRights?.status === 'pending').length;

  return (
    <div className="page fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1>Recruiter & Organization Verification</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-sec)', marginTop: '2px' }}>
            Review, verify, and grant recruiter privileges to registered organizations, universities, companies, and professional citizens
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={loadData} disabled={loading || actionLoading}>
            ↻ Refresh Live Queue
          </button>
        </div>
      </div>

      {/* Primary Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('institutions')}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            border: `1px solid ${activeTab === 'institutions' ? 'var(--accent)' : 'transparent'}`,
            background: activeTab === 'institutions' ? 'var(--accent-light)' : 'transparent',
            color: activeTab === 'institutions' ? 'var(--accent)' : 'var(--text-sec)',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.9rem',
          }}
        >
          <span>🏛️ Organizations & Companies ({institutions.length})</span>
          {pendingInstCount > 0 && (
            <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.7rem', padding: '1px 7px', borderRadius: '12px', fontWeight: 800 }}>
              {pendingInstCount} PENDING
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('citizens')}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            border: `1px solid ${activeTab === 'citizens' ? 'var(--accent)' : 'transparent'}`,
            background: activeTab === 'citizens' ? 'var(--accent-light)' : 'transparent',
            color: activeTab === 'citizens' ? 'var(--accent)' : 'var(--text-sec)',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.9rem',
          }}
        >
          <span>👤 Individual Citizen Candidates ({citizenRequests.length})</span>
          {pendingCitizenCount > 0 && (
            <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.7rem', padding: '1px 7px', borderRadius: '12px', fontWeight: 800 }}>
              {pendingCitizenCount} PENDING
            </span>
          )}
        </button>
      </div>

      {/* Controls: Search & Status Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: 1, maxWidth: '380px' }}>
          <input
            type="text"
            placeholder="Search by name, email, city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }}
          />
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
        </form>

        <div style={{ display: 'flex', gap: '6px' }}>
          {['all', 'pending', 'approved', 'rejected'].map(s => (
            <button
              key={s}
              className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(s)}
              style={{ textTransform: 'capitalize' }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB 1: INSTITUTIONS & ORGANIZATIONS ─────────────────────── */}
      {activeTab === 'institutions' && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Organization Name</th>
                  <th>Type</th>
                  <th>Official Email</th>
                  <th>Location</th>
                  <th>Website / Details</th>
                  <th>Status</th>
                  <th>Registration Date</th>
                  <th>Admin Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>Loading live institutions from database…</td></tr>
                ) : institutions.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>No organizations found matching "{filter}".</td></tr>
                ) : institutions.map(inst => (
                  <tr key={inst._id}>
                    <td style={{ fontWeight: 600, color: 'var(--text)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.2rem' }}>{inst.type === 'university' ? '🎓' : inst.type === 'school' ? '🏫' : '🏢'}</span>
                        <div>
                          <div>{inst.name}</div>
                          {inst.phone && <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>📞 {inst.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-blue" style={{ textTransform: 'uppercase', fontSize: '0.68rem' }}>
                        {inst.type}
                      </span>
                    </td>
                    <td style={{ color: '#64748b' }}>{inst.email}</td>
                    <td>{inst.location || 'Tunisia'}</td>
                    <td>
                      {inst.website ? (
                        <a href={inst.website} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontSize: '0.82rem', fontWeight: 600 }}>
                          {inst.website.replace('https://', '').replace('http://', '').slice(0, 24)} ↗
                        </a>
                      ) : '—'}
                    </td>
                    <td>
                      <span className={`badge badge-${STATUS_CLASS[inst.status] || 'gray'}`} style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                        {inst.status}
                      </span>
                    </td>
                    <td style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                      {new Date(inst.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {inst.status !== 'approved' && (
                          <button
                            className="btn btn-sm btn-success"
                            disabled={actionLoading}
                            onClick={() => handleInstitutionAction(inst._id, 'approve', inst.name)}
                          >
                            ✓ Approve
                          </button>
                        )}
                        {inst.status !== 'rejected' && (
                          <button
                            className="btn btn-sm btn-danger"
                            disabled={actionLoading}
                            onClick={() => handleInstitutionAction(inst._id, 'reject', inst.name)}
                          >
                            ✗ Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: CITIZEN RECRUITER REQUESTS ───────────────────────── */}
      {activeTab === 'citizens' && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Applicant Name</th>
                  <th>Email</th>
                  <th>Company / Brand</th>
                  <th>Reason / Pitch</th>
                  <th>Status</th>
                  <th>Requested At</th>
                  <th>Admin Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>Loading requests…</td></tr>
                ) : citizenRequests.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>No citizen recruiter requests in database.</td></tr>
                ) : citizenRequests.map(r => (
                  <tr key={r._id}>
                    <td style={{ fontWeight: 600, color: 'var(--text)' }}>{r.name}</td>
                    <td style={{ color: '#64748b' }}>{r.email}</td>
                    <td>{r.company?.name || '—'}</td>
                    <td style={{ maxWidth: '240px' }}>
                      <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: '0.82rem', color: '#64748b' }}>
                        {r.recruitRights?.reason || 'Standard recruiter access request'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${STATUS_CLASS[r.recruitRights?.status] || 'gray'}`} style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                        {r.recruitRights?.status}
                      </span>
                    </td>
                    <td style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                      {r.recruitRights?.requestedAt ? new Date(r.recruitRights.requestedAt).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      {r.recruitRights?.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-sm btn-success"
                            disabled={actionLoading}
                            onClick={() => handleCitizenAction(r._id, 'approve', r.name)}
                          >
                            ✓ Approve
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            disabled={actionLoading}
                            onClick={() => handleCitizenAction(r._id, 'reject', r.name)}
                          >
                            ✗ Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                          Reviewed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
