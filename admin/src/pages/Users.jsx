import React, { useEffect, useState } from 'react';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await api.get('/admin/users', { params });
      setUsers(res.data.data.users || []);
    } catch (err) {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search, roleFilter]);

  const handleToggleBan = async (id, isActive) => {
    try {
      if (isActive) {
        // User is currently active, so ban them
        await api.patch(`/admin/users/${id}/ban`);
        toast.success('User banned.');
      } else {
        // User is currently banned, so unban them
        await api.patch(`/admin/users/${id}/unban`);
        toast.success('User unbanned.');
      }
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    }
  };

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p style={{ fontSize: '0.85rem' }}>View, ban, or unban platform users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            className="input" style={{ maxWidth: '280px' }}
            placeholder="🔍 Search by name or email…"
            value={search} onChange={e => setSearch(e.target.value)}
          />
          <select className="input" style={{ maxWidth: '160px' }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="citizen">Citizen</option>
            <option value="admin">Admin</option>
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
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>Loading…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>No users found</td></tr>
              ) : users.map(u => (
                <tr key={u._id}>
                  <td style={{ fontWeight: 500 }}>{u.name}</td>
                  <td style={{ color: '#64748b' }}>{u.email}</td>
                  <td><span className={`badge badge-${u.role === 'student' ? 'blue' : u.role === 'citizen' ? 'green' : 'gray'}`}>{u.role}</span></td>
                  <td>
                    <span className={`badge badge-${u.isActive ? 'green' : 'red'}`}>
                      {u.isActive ? 'Active' : 'Banned'}
                    </span>
                  </td>
                  <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {u.role !== 'admin' && (
                        <button
                          className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`}
                          onClick={() => handleToggleBan(u._id, u.isActive)}
                        >
                          {u.isActive ? 'Ban' : 'Unban'}
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
