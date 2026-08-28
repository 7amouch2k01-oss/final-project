import React, { useEffect, useState } from 'react';
import api from '../api/axiosInstance';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [pendingInstitutions, setPendingInstitutions] = useState([]);
  const [pendingRecruiters, setPendingRecruiters] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, instRes, recruitRes] = await Promise.allSettled([
        api.get('/admin/stats'),
        api.get('/admin/users?limit=5'),
        api.get('/admin/institutions?status=pending'),
        api.get('/admin/recruit-requests'),
      ]);
      
      if (statsRes.status === 'fulfilled') {
        const sData = statsRes.value.data.data;
        setStats({
          users: sData.users?.total || 0,
          institutions: sData.institutions?.total || 0,
          pendingInstitutions: sData.institutions?.pending || 0,
          universities: sData.listings?.universities || 0,
          jobs: sData.listings?.jobs || 0,
          stages: sData.listings?.stages || 0,
          applications: sData.applications?.total || 0,
          pendingRecruitRequests: sData.pendingRecruitRequests || 0,
        });
      } else {
        console.error('Stats error:', statsRes.reason);
      }

      if (usersRes.status === 'fulfilled') {
        setRecentUsers(usersRes.value.data.data.users || []);
      }
      if (instRes.status === 'fulfilled') {
        setPendingInstitutions(instRes.value.data.data.institutions || []);
      }
      if (recruitRes.status === 'fulfilled') {
        setPendingRecruiters(recruitRes.value.data.data.requests || []);
      }

      // If all failed, show toast
      if (statsRes.status === 'rejected' && usersRes.status === 'rejected') {
        const errMsg = statsRes.reason?.response?.data?.message || 'Failed to load latest live data from database';
        toast.error(errMsg);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      toast.error('Failed to load latest live data from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleApproveInstitution = async (id, name) => {
    setActionLoading(true);
    try {
      await api.patch(`/admin/institutions/${id}/approve`);
      toast.success(`🎉 Approved "${name}" successfully!`);
      loadDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectInstitution = async (id, name) => {
    const reason = prompt(`Enter rejection reason for "${name}" (optional):`) || '';
    setActionLoading(true);
    try {
      await api.patch(`/admin/institutions/${id}/reject`, { reason });
      toast.success(`Rejected "${name}"`);
      loadDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveRecruiter = async (id, name) => {
    setActionLoading(true);
    try {
      await api.patch(`/admin/recruit-requests/${id}/approve`);
      toast.success(`🎉 Approved recruiter rights for ${name}!`);
      loadDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRecruiter = async (id, name) => {
    const reason = prompt(`Enter rejection reason for ${name} (optional):`) || '';
    setActionLoading(true);
    try {
      await api.patch(`/admin/recruit-requests/${id}/reject`, { reason });
      toast.success(`Rejected recruiter rights for ${name}`);
      loadDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  const totalPending = (pendingInstitutions.length || 0) + (pendingRecruiters.length || 0);

  const STAT_CARDS = [
    { 
      label: 'Total Registered Users', 
      value: stats?.users, 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ), 
      color: '#6366f1' 
    },
    { 
      label: 'Institutions & Companies', 
      value: stats?.institutions, 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
          <path d="M9 22v-4h6v4" />
          <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
        </svg>
      ), 
      color: '#059669' 
    },
    { 
      label: 'Pending Approvals', 
      value: totalPending, 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ), 
      color: totalPending > 0 ? '#ef4444' : '#10b981', 
      badge: totalPending > 0 ? 'ACTION NEEDED' : 'CLEAR' 
    },
    { 
      label: 'Live Course & Univ Listings', 
      value: stats?.universities, 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      ), 
      color: '#3b82f6' 
    },
    { 
      label: 'Live Corporate Jobs', 
      value: stats?.jobs, 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ), 
      color: '#8b5cf6' 
    },
    { 
      label: 'Internship Listings (Stages)', 
      value: stats?.stages, 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        </svg>
      ), 
      color: '#d97706' 
    },
  ];

  return (
    <div className="page fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1>TuniAdmin Control Center</h1>
          <p style={{ fontSize: '0.85rem', marginTop: '2px', color: 'var(--text-sec)' }}>
            Live real-time operational database & review queue
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="btn btn-secondary btn-sm" onClick={loadDashboardData} disabled={loading || actionLoading}>
            ↻ Refresh Live Data
          </button>
          <span style={{ fontSize: '0.78rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '4px 12px', borderRadius: '20px', fontWeight: 600 }}>
            ● Live Atlas MongoDB Connected
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      {loading && !stats ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="stat-card" style={{ height: '110px', background: 'var(--surface-raised)' }} />)}
        </div>
      ) : (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {STAT_CARDS.map(s => (
            <div key={s.label} className="stat-card" style={{ border: s.badge === 'ACTION NEEDED' ? '1px solid rgba(239,68,68,0.4)' : undefined }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="stat-label">{s.label}</div>
                <span style={{ fontSize: '1.3rem' }}>{s.icon}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '8px' }}>
                <div className="stat-value" style={{ color: s.color, fontSize: '1.8rem', fontWeight: 800 }}>{s.value ?? '0'}</div>
                {s.badge && (
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: s.badge === 'ACTION NEEDED' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: s.badge === 'ACTION NEEDED' ? '#ef4444' : '#10b981' }}>
                    {s.badge}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ACTION REQUIRED: PENDING REVIEWS QUEUE ──────────────────────── */}
      <div className="card" style={{ border: totalPending > 0 ? '1px solid rgba(225, 29, 72, 0.35)' : '1px solid var(--border)' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Pending Review & Approval Queue</h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-sec)' }}>
                Organizations, universities, companies, and recruiter candidates awaiting admin verification
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to="/institutions" className="btn btn-secondary btn-sm">All Institutions ({stats?.institutions || 0})</Link>
            <Link to="/recruiters" className="btn btn-secondary btn-sm">Recruiter Portal</Link>
          </div>
        </div>

        {/* Pending Organizations Table */}
        <div style={{ padding: '0 20px 20px' }}>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text)', margin: '14px 0 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🏛️</span> Registered Organizations & Companies Awaiting Approval ({pendingInstitutions.length})
          </h4>
          
          {pendingInstitutions.length === 0 ? (
            <div style={{ padding: '16px', background: 'var(--surface-raised)', borderRadius: '8px', border: '1px dashed var(--border)', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              ✓ No pending organization registrations. All organizations are approved!
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Organization Name</th>
                    <th>Type</th>
                    <th>Email</th>
                    <th>Location / City</th>
                    <th>Website</th>
                    <th>Submitted</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingInstitutions.map(inst => (
                    <tr key={inst._id}>
                      <td style={{ fontWeight: 600, color: 'var(--text)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{inst.type === 'university' ? '🎓' : inst.type === 'school' ? '🏫' : '🏢'}</span>
                          <span>{inst.name}</span>
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
                          <a href={inst.website} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontSize: '0.82rem' }}>
                            {inst.website.replace('https://', '').replace('http://', '').slice(0, 22)} ↗
                          </a>
                        ) : '—'}
                      </td>
                      <td style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                        {new Date(inst.createdAt).toLocaleDateString()} {new Date(inst.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            className="btn btn-sm btn-success" 
                            disabled={actionLoading}
                            onClick={() => handleApproveInstitution(inst._id, inst.name)}
                          >
                            ✓ Approve
                          </button>
                          <button 
                            className="btn btn-sm btn-danger" 
                            disabled={actionLoading}
                            onClick={() => handleRejectInstitution(inst._id, inst.name)}
                          >
                            ✗ Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pending Individual Citizen Recruiter Rights */}
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text)', margin: '20px 0 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>👤</span> Individual Citizen Recruiter Rights Requests ({pendingRecruiters.length})
          </h4>

          {pendingRecruiters.length === 0 ? (
            <div style={{ padding: '16px', background: 'var(--surface-raised)', borderRadius: '8px', border: '1px dashed var(--border)', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              ✓ No pending individual recruiter requests.
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Applicant Name</th>
                    <th>Email</th>
                    <th>Company / Affiliation</th>
                    <th>Submitted</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRecruiters.map(r => (
                    <tr key={r._id}>
                      <td style={{ fontWeight: 600, color: 'var(--text)' }}>{r.name}</td>
                      <td style={{ color: '#64748b' }}>{r.email}</td>
                      <td>{r.company?.name || '—'}</td>
                      <td style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                        {r.recruitRights?.requestedAt ? new Date(r.recruitRights.requestedAt).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            className="btn btn-sm btn-success" 
                            disabled={actionLoading}
                            onClick={() => handleApproveRecruiter(r._id, r.name)}
                          >
                            ✓ Approve
                          </button>
                          <button 
                            className="btn btn-sm btn-danger" 
                            disabled={actionLoading}
                            onClick={() => handleRejectRecruiter(r._id, r.name)}
                          >
                            ✗ Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>

      {/* Recent Users Table */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Recent Platform Users</h3>
          <Link to="/users" className="btn btn-secondary btn-sm">Manage All Users ({stats?.users || 0}) →</Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User Name</th>
                <th>Email Address</th>
                <th>Account Role</th>
                <th>Registration Date</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>No users found</td></tr>
              ) : recentUsers.map(u => (
                <tr key={u._id}>
                  <td style={{ fontWeight: 500, color: 'var(--text)' }}>{u.name}</td>
                  <td style={{ color: '#64748b' }}>{u.email}</td>
                  <td>
                    <span className={`badge badge-${u.role === 'student' ? 'blue' : u.role === 'citizen' ? 'green' : 'red'}`} style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                      {u.role}
                    </span>
                  </td>
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
