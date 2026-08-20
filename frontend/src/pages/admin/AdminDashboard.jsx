import React, { useEffect, useState } from 'react';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsRes, reqRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/recruit-requests')
      ]);
      setStats(statsRes.data.data);
      setRequests(reqRes.data.data.requests);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id) => {
    try {
      await api.patch(`/admin/recruit-requests/${id}/approve`);
      toast.success('Recruit rights approved!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Please enter rejection reason:');
    if (reason === null) return; // cancelled
    try {
      await api.patch(`/admin/recruit-requests/${id}/reject`, { reason });
      toast.success('Recruit rights request rejected');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed');
    }
  };

  if (loading) {
    return (
      <div className="page flex-center">
        <div className="animate-spin" style={{ fontSize: '2rem' }}>🌀</div>
      </div>
    );
  }

  return (
    <div className="page container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>TuniAdmin Panel 🛡️</h2>
        <p>Manage users, listings, pending recruiter approvals, and system stats.</p>
      </div>

      {/* Overview Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div className="glass" style={{ padding: '20px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Users</div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.users.total}</div>
          </div>
          <div className="glass" style={{ padding: '20px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Students</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#6c63ff' }}>{stats.users.students}</div>
          </div>
          <div className="glass" style={{ padding: '20px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Citizens</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>{stats.users.citizens}</div>
          </div>
          <div className="glass" style={{ padding: '20px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Universities / Jobs / Stages</div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>
              {stats.listings.universities} / {stats.listings.jobs} / {stats.listings.stages}
            </div>
          </div>
        </div>
      )}

      {/* Recruiter Requests Table */}
      <div>
        <h3 style={{ marginBottom: '16px' }}>Pending Recruiter Approvals</h3>
        <div className="glass" style={{ overflowX: 'auto', padding: '16px' }}>
          {requests.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '24px' }}>No pending requests</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px' }}>Applicant</th>
                  <th style={{ padding: '12px' }}>Email</th>
                  <th style={{ padding: '12px' }}>Company info</th>
                  <th style={{ padding: '12px' }}>Requested At</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{r.name}</td>
                    <td style={{ padding: '12px' }}>{r.email}</td>
                    <td style={{ padding: '12px' }}>
                      {r.company?.name ? `${r.company.name} (${r.company.location || 'N/A'})` : 'No company specified'}
                    </td>
                    <td style={{ padding: '12px' }}>{new Date(r.recruitRights.requestedAt).toLocaleDateString()}</td>
                    <td style={{ padding: '12px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleApprove(r._id)} className="btn btn-primary btn-sm" style={{ background: '#10b981' }}>Approve</button>
                      <button onClick={() => handleReject(r._id)} className="btn btn-danger btn-sm">Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;
