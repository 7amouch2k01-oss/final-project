import React, { useEffect, useState } from 'react';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

export default function Recruiters() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/recruit-requests');
      setRequests(res.data.data.requests || []);
    } catch (err) {
      toast.error('Failed to load recruiter requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAction = async (id, action) => {
    try {
      let reason = '';
      if (action === 'reject') {
        reason = prompt('Enter rejection reason (optional):') || '';
      }
      await api.patch(`/admin/recruit-requests/${id}/${action}`, { reason });
      toast.success(`Request ${action}d successfully.`);
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
          <h1>Recruiter Requests</h1>
          <p style={{ fontSize: '0.85rem' }}>Approve or reject citizens who want to post job listings</p>
        </div>
        <button className="btn btn-secondary" onClick={load}>↻ Refresh</button>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Email</th>
                <th>Company</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>Loading…</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>No pending requests</td></tr>
              ) : requests.map(r => (
                <tr key={r._id}>
                  <td style={{ fontWeight: 500 }}>{r.name}</td>
                  <td style={{ color: '#64748b' }}>{r.email}</td>
                  <td>{r.company?.name || '—'}</td>
                  <td style={{ maxWidth: '200px' }}>
                    <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: '0.85rem', color: '#64748b' }}>
                      {r.recruitRights?.reason || '—'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${STATUS_CLASS[r.recruitRights?.status] || 'gray'}`}>
                      {r.recruitRights?.status}
                    </span>
                  </td>
                  <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                    {r.recruitRights?.requestedAt ? new Date(r.recruitRights.requestedAt).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    {r.recruitRights?.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-sm btn-success" onClick={() => handleAction(r._id, 'approve')}>✓ Approve</button>
                        <button className="btn btn-sm btn-danger"  onClick={() => handleAction(r._id, 'reject')}>✗ Reject</button>
                      </div>
                    )}
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
