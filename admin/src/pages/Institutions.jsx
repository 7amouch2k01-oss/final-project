import React, { useEffect, useState } from 'react';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

export default function Institutions() {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/institutions?status=${filter}`);
      setInstitutions(res.data.data.institutions || []);
    } catch (err) {
      toast.error('Failed to load institutions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

  const handleAction = async (id, action) => {
    try {
      let reason = '';
      if (action === 'reject') {
        reason = prompt('Enter rejection reason (optional):') || '';
      }
      await api.patch(`/admin/institutions/${id}/${action}`, { reason });
      toast.success(`Institution ${action}d successfully.`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    }
  };

  const STATUS_CLASS = { pending: 'yellow', approved: 'green', rejected: 'red' };

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>Institutions & Organizations</h1>
          <p style={{ fontSize: '0.85rem' }}>Approve, review, or manage registered Universities, Schools, and Hiring Companies</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
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
          <button className="btn btn-secondary btn-sm" onClick={load}>↻ Refresh</button>
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Organization</th>
                <th>Type</th>
                <th>Email</th>
                <th>Location</th>
                <th>Website / Phone</th>
                <th>Status</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>Loading…</td></tr>
              ) : institutions.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>No institutions found in this filter</td></tr>
              ) : institutions.map(inst => (
                <tr key={inst._id}>
                  <td style={{ fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{inst.type === 'university' ? '🏛️' : inst.type === 'school' ? '🏫' : '🏢'}</span>
                      <span>{inst.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-gray" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                      {inst.type}
                    </span>
                  </td>
                  <td style={{ color: '#64748b' }}>{inst.email}</td>
                  <td>{inst.location || 'Tunisia'}</td>
                  <td style={{ fontSize: '0.8rem' }}>
                    {inst.website ? <a href={inst.website} target="_blank" rel="noreferrer" style={{ color: 'var(--red)' }}>Visit ↗</a> : '—'}
                    {inst.phone ? ` • ${inst.phone}` : ''}
                  </td>
                  <td>
                    <span className={`badge badge-${STATUS_CLASS[inst.status] || 'gray'}`}>
                      {inst.status}
                    </span>
                  </td>
                  <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                    {new Date(inst.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {inst.status !== 'approved' && (
                        <button className="btn btn-sm btn-success" onClick={() => handleAction(inst._id, 'approve')}>
                          ✓ Approve
                        </button>
                      )}
                      {inst.status !== 'rejected' && (
                        <button className="btn btn-sm btn-danger" onClick={() => handleAction(inst._id, 'reject')}>
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
    </div>
  );
}
