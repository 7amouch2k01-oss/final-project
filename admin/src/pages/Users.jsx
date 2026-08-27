import React, { useEffect, useState } from 'react';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

/* ─── helpers ─────────────────────────────────────────── */
function recruiterBadgeStyle(status) {
  const base = {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: '999px',
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.03em',
  };
  switch (status) {
    case 'approved':
      return { ...base, background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' };
    case 'pending':
      return { ...base, background: 'rgba(234,179,8,0.15)', color: '#facc15', border: '1px solid rgba(234,179,8,0.3)' };
    case 'rejected':
      return { ...base, background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' };
    default:
      return { ...base, background: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.3)' };
  }
}

function RecruiterBadge({ user }) {
  const status = user.recruitRights?.status;
  const label = status
    ? status.charAt(0).toUpperCase() + status.slice(1)
    : 'None';
  return <span style={recruiterBadgeStyle(status)}>{label}</span>;
}

/* ─── component ───────────────────────────────────────── */
export default function Users() {
  const [users, setUsers]                     = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [search, setSearch]                   = useState('');
  const [roleFilter, setRoleFilter]           = useState('');
  const [recruiterFilter, setRecruiterFilter] = useState('');
  const [actionLoading, setActionLoading]     = useState(null);

  /* ── load ── */
  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)          params.search        = search;
      if (roleFilter)      params.role          = roleFilter;
      if (recruiterFilter) params.recruitRights = recruiterFilter;
      const res = await api.get('/admin/users', { params });
      setUsers(res.data.data.users || []);
    } catch {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, roleFilter, recruiterFilter]);

  /* ── ban / unban ── */
  const handleToggleBan = async (id, isActive) => {
    try {
      if (isActive) {
        await api.patch(`/admin/users/${id}/ban`);
        toast.success('User banned.');
      } else {
        await api.patch(`/admin/users/${id}/unban`);
        toast.success('User unbanned.');
      }
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    }
  };

  /* ── approve / reject recruit request ── */
  const handleRecruit = async (id, action) => {
    setActionLoading(`${id}-${action}`);
    try {
      if (action === 'approve') {
        await api.patch(`/admin/recruit-requests/${id}/approve`);
        toast.success('Recruiter rights approved.');
      } else {
        await api.patch(`/admin/recruit-requests/${id}/reject`, { reason: 'Rejected by admin' });
        toast.success('Recruiter rights rejected.');
      }
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    } finally {
      setActionLoading(null);
    }
  };

  /* ─── render ─────────────────────────────────────────── */
  return (
    <div className="page fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p style={{ fontSize: '0.85rem' }}>View, ban/unban users and manage recruiter rights</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="input"
            style={{ maxWidth: '280px' }}
            placeholder="🔍 Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <select
            className="input"
            style={{ maxWidth: '160px' }}
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="citizen">Citizen</option>
            <option value="admin">Admin</option>
          </select>

          <select
            className="input"
            style={{ maxWidth: '200px' }}
            value={recruiterFilter}
            onChange={e => setRecruiterFilter(e.target.value)}
          >
            <option value="">Recruiter Rights: All</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="none">None</option>
          </select>

          <button className="btn btn-secondary" onClick={load}>↻ Refresh</button>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Recruiter Rights</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                    Loading…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                    No users found
                  </td>
                </tr>
              ) : users.map(u => {
                const recruitStatus = u.recruitRights?.status;
                const isPending     = u.role === 'citizen' && recruitStatus === 'pending';

                return (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                    <td style={{ color: '#64748b' }}>{u.email}</td>
                    <td>
                      <span className={`badge badge-${u.role === 'student' ? 'blue' : u.role === 'citizen' ? 'green' : 'gray'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <RecruiterBadge user={u} />
                    </td>
                    <td>
                      <span className={`badge badge-${u.isActive ? 'green' : 'red'}`}>
                        {u.isActive ? 'Active' : 'Banned'}
                      </span>
                    </td>
                    <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {u.role !== 'admin' && (
                          <button
                            className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`}
                            onClick={() => handleToggleBan(u._id, u.isActive)}
                          >
                            {u.isActive ? 'Ban' : 'Unban'}
                          </button>
                        )}

                        {isPending && (
                          <>
                            <button
                              className="btn btn-sm"
                              style={{
                                background: 'rgba(34,197,94,0.15)',
                                color: '#4ade80',
                                border: '1px solid rgba(34,197,94,0.3)',
                                padding: '3px 10px',
                                fontSize: '0.75rem',
                                borderRadius: '6px',
                                cursor: actionLoading ? 'not-allowed' : 'pointer',
                                opacity: actionLoading === `${u._id}-approve` ? 0.6 : 1,
                              }}
                              disabled={!!actionLoading}
                              onClick={() => handleRecruit(u._id, 'approve')}
                            >
                              {actionLoading === `${u._id}-approve` ? '…' : '✓ Approve'}
                            </button>

                            <button
                              className="btn btn-sm"
                              style={{
                                background: 'rgba(239,68,68,0.15)',
                                color: '#f87171',
                                border: '1px solid rgba(239,68,68,0.3)',
                                padding: '3px 10px',
                                fontSize: '0.75rem',
                                borderRadius: '6px',
                                cursor: actionLoading ? 'not-allowed' : 'pointer',
                                opacity: actionLoading === `${u._id}-reject` ? 0.6 : 1,
                              }}
                              disabled={!!actionLoading}
                              onClick={() => handleRecruit(u._id, 'reject')}
                            >
                              {actionLoading === `${u._id}-reject` ? '…' : '✕ Reject'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
