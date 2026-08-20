import React, { useEffect, useState } from 'react';
import api from '../api/axiosInstance';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, usersRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/users?limit=5'),
        ]);
        
        const sData = statsRes.data.data;
        setStats({
          users: sData.users?.total || 0,
          universities: sData.listings?.universities || 0,
          jobs: sData.listings?.jobs || 0,
          stages: sData.listings?.stages || 0,
        });
        setRecentUsers(usersRes.data.data.users || []);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setStats({ users: 0, universities: 0, jobs: 0, stages: 0 });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const STAT_CARDS = [
    { label: 'Total Users',        value: stats?.users,        icon: '👥', color: '#6366f1' },
    { label: 'Universities',        value: stats?.universities,  icon: '🏛️', color: '#059669' },
    { label: 'Job Listings',        value: stats?.jobs,          icon: '💼', color: '#2563eb' },
    { label: 'Internship Listings', value: stats?.stages,        icon: '📋', color: '#d97706' },
  ];

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1>Overview</h1>
          <p style={{ fontSize: '0.85rem', marginTop: '2px' }}>Platform-wide metrics at a glance</p>
        </div>
        <span style={{ fontSize: '0.78rem', color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px' }}>
          🟢 System operational
        </span>
      </div>

      {/* Stats */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
          {[1,2,3,4].map(i => <div key={i} className="stat-card" style={{ height: '100px', background: '#f1f5f9' }} />)}
        </div>
      ) : (
        <div className="stats-grid">
          {STAT_CARDS.map(s => (
            <div key={s.label} className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="stat-label">{s.label}</div>
                <span style={{ fontSize: '1.2rem' }}>{s.icon}</span>
              </div>
              <div className="stat-value" style={{ color: s.color }}>{s.value ?? '—'}</div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">
          <h3>Quick Actions</h3>
        </div>
        <div className="card-body" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link to="/users" className="btn btn-secondary">👥 Manage Users</Link>
          <Link to="/recruiters" className="btn btn-secondary">🏢 Recruiter Requests</Link>
          <Link to="/universities" className="btn btn-secondary">🏛️ Universities</Link>
          <Link to="/listings" className="btn btn-secondary">💼 Job & Stage Listings</Link>
        </div>
      </div>

      {/* Recent Users */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">
          <h3>Recent Registrations</h3>
          <Link to="/users" className="btn btn-secondary btn-sm">View All</Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Role</th><th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>No users yet</td></tr>
              ) : recentUsers.map(u => (
                <tr key={u._id}>
                  <td style={{ fontWeight: 500 }}>{u.name}</td>
                  <td style={{ color: '#64748b' }}>{u.email}</td>
                  <td><span className={`badge badge-${u.role === 'student' ? 'blue' : u.role === 'citizen' ? 'green' : 'gray'}`}>{u.role}</span></td>
                  <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
