import React, { useEffect, useState } from 'react';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { BrandLogo } from '../../components/common/CompleteProfileModal';

// ─── Small helpers ──────────────────────────────────────────────────────────────

const formatDate = (d) => {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const daysLeft = (endDate) => {
  if (!endDate) return null;
  const diff = Math.ceil((new Date(endDate) - Date.now()) / 86400000);
  return diff > 0 ? diff : 0;
};

const Chip = ({ children, color }) => (
  <span style={{
    fontSize: '0.7rem',
    padding: '2px 9px',
    borderRadius: 'var(--r-full)',
    background: color ? `${color}1a` : 'var(--bg-elevated)',
    border: `1px solid ${color ? `${color}44` : 'var(--glass-border)'}`,
    color: color || 'var(--text-secondary)',
    fontWeight: 600,
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap',
  }}>
    {children}
  </span>
);

const StatusBadge = ({ status }) => {
  const map = {
    pending:      { label: 'Pending',      color: '#fbbf24' },
    under_review: { label: 'Under Review', color: '#60a5fa' },
    accepted:     { label: 'Accepted',     color: '#34d399' },
    rejected:     { label: 'Rejected',     color: '#f87171' },
  };
  const s = map[status] || { label: status, color: 'var(--text-muted)' };
  return (
    <span style={{
      display: 'inline-block',
      fontSize: '0.72rem',
      padding: '3px 10px',
      borderRadius: 'var(--r-full)',
      background: `${s.color}18`,
      border: `1px solid ${s.color}44`,
      color: s.color,
      fontWeight: 700,
    }}>
      {s.label}
    </span>
  );
};

const typeColor = { remote: '#60a5fa', 'on-site': '#a78bfa', hybrid: '#f59e0b' };
const typeLabel = { remote: 'Remote', 'on-site': 'On-site', hybrid: 'Hybrid' };

// ─── Main Component ─────────────────────────────────────────────────────────────

export const PartTimeJobs = () => {
  const { user } = useAuthStore();

  // Data state
  const [jobs, setJobs]           = useState([]);
  const [myApps, setMyApps]       = useState([]);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);

  // Filters
  const [search, setSearch]       = useState('');
  const [filterType, setFilterType]         = useState('');
  const [filterLevel, setFilterLevel]       = useState('');

  // Active tab
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'applications'

  // Selected job (detail modal)
  const [selectedJob, setSelectedJob]     = useState(null);
  const [showApply, setShowApply]         = useState(false);
  const [coverLetter, setCoverLetter]     = useState('');
  const [submitting, setSubmitting]       = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)      params.set('search', search);
      if (filterType)  params.set('type', filterType);
      if (filterLevel) params.set('experienceLevel', filterLevel);

      const [jobsRes, appsRes] = await Promise.all([
        api.get(`/jobs/part-time?${params.toString()}`),
        api.get('/applications/mine').catch(() => ({ data: { data: { applications: [] } } })),
      ]);

      const fetchedJobs = jobsRes.data.data.jobs || [];
      const fetchedApps = appsRes.data.data.applications || [];

      setJobs(fetchedJobs);
      setTotal(jobsRes.data.data.total || fetchedJobs.length);
      setMyApps(fetchedApps.filter(a => a.targetModel === 'Job'));

      const ids = new Set(
        fetchedApps
          .filter(a => a.targetModel === 'Job')
          .map(a => a.targetId?._id || a.targetId)
      );
      setAppliedIds(ids);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load part-time jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleSearch = (e) => { e.preventDefault(); fetchData(); };

  const openDetail = (job) => {
    setSelectedJob(job);
    setShowApply(false);
    setCoverLetter('');
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please log in to apply'); return; }
    if (appliedIds.has(selectedJob._id)) { toast.error('You already applied to this position'); return; }
    setSubmitting(true);
    try {
      await api.post('/applications', {
        targetId:          selectedJob._id,
        targetType:        'Job',
        targetModel:       'Job',
        selectedProgramme: '',
        coverLetter,
        cvUrl:             user.cvUrl || '',
      });
      toast.success('Application submitted successfully!');
      setAppliedIds(prev => new Set([...prev, selectedJob._id]));
      setSelectedJob(null);
      setCoverLetter('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Application failed');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────────

  return (
    <div className="page container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '60px' }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="section-label">Academic Hub — Student Jobs</div>
          <h2 style={{ fontSize: '1.85rem', marginTop: '4px', fontWeight: 800, margin: '4px 0 0' }}>
            Part-Time Jobs
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '6px 0 0' }}>
            Browse flexible part-time opportunities compatible with your studies. Apply with your profile CV in one click.
          </p>
        </div>

        {/* Stat pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 16px',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--r-full)',
          backdropFilter: 'blur(12px)',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          whiteSpace: 'nowrap',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </svg>
          <strong style={{ color: 'var(--text-primary)' }}>{total}</strong> positions available
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--glass-border)' }}>
        {['browse', 'applications'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--red)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: activeTab === tab ? 700 : 500,
              fontSize: '0.88rem',
              padding: '10px 20px',
              cursor: 'pointer',
              transition: 'all var(--t-fast)',
              marginBottom: '-1px',
              textTransform: 'capitalize',
            }}
          >
            {tab === 'applications' ? `My Applications (${myApps.length})` : 'Browse Jobs'}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          TAB: BROWSE
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'browse' && (
        <>
          {/* ── Search + Filters ── */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search by title, company, skill..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: '1 1 260px', minWidth: '200px', padding: '10px 14px', borderRadius: 'var(--r-md)' }}
            />

            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              style={{ padding: '10px 12px', borderRadius: 'var(--r-md)', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', color: 'var(--text)', minWidth: '140px', fontSize: '0.86rem' }}
            >
              <option value="">All Work Types</option>
              <option value="remote">Remote</option>
              <option value="on-site">On-site</option>
              <option value="hybrid">Hybrid</option>
            </select>

            <select
              value={filterLevel}
              onChange={e => setFilterLevel(e.target.value)}
              style={{ padding: '10px 12px', borderRadius: 'var(--r-md)', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', color: 'var(--text)', minWidth: '150px', fontSize: '0.86rem' }}
            >
              <option value="">Any Experience</option>
              <option value="any">Any Level</option>
              <option value="junior">Junior</option>
              <option value="mid">Mid-Level</option>
              <option value="senior">Senior</option>
            </select>

            <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}>
              Search
            </button>

            {(search || filterType || filterLevel) && (
              <button
                type="button"
                onClick={() => { setSearch(''); setFilterType(''); setFilterLevel(''); setTimeout(fetchData, 0); }}
                className="btn btn-ghost"
                style={{ padding: '10px 14px', fontSize: '0.82rem' }}
              >
                Clear
              </button>
            )}
          </form>

          {/* ── Job Cards Grid ── */}
          {loading ? (
            <div className="flex-center" style={{ minHeight: '260px', gap: '12px' }}>
              <div className="animate-spin" style={{ fontSize: '1.8rem', color: 'var(--red)' }}>⟳</div>
              <span style={{ color: 'var(--text-secondary)' }}>Loading opportunities...</span>
            </div>
          ) : jobs.length === 0 ? (
            <div className="card flex-center" style={{ padding: '56px', flexDirection: 'column', gap: '12px', textAlign: 'center' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              </div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>No part-time jobs found</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                Try adjusting your search or filters. New listings are added regularly.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '18px',
            }}>
              {jobs.map(job => {
                const isApplied = appliedIds.has(job._id);
                const left = daysLeft(job.applicationEndDate || job.deadline);
                const isUrgent = left !== null && left <= 5;
                const salary = !job.salary?.isHidden && job.salary?.min
                  ? `${job.salary.min}${job.salary.max ? '–' + job.salary.max : '+'} ${job.salary.currency}/${job.salary.period}`
                  : null;

                return (
                  <div
                    key={job._id}
                    className="card"
                    style={{
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      borderRadius: 'var(--r-lg)',
                      background: 'var(--bg-surface)',
                      border: isApplied ? '1px solid var(--red-border)' : '1px solid var(--glass-border)',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                    onClick={() => openDetail(job)}
                  >
                    {/* Applied badge */}
                    {isApplied && (
                      <div style={{
                        position: 'absolute', top: '12px', right: '12px',
                        background: 'var(--red-subtle)', border: '1px solid var(--red-border)',
                        borderRadius: 'var(--r-full)', padding: '2px 8px',
                        fontSize: '0.68rem', fontWeight: 700, color: 'var(--red)',
                      }}>Applied</div>
                    )}

                    {/* Logo + Company */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: 'var(--r-md)',
                        background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', flexShrink: 0,
                      }}>
                        <BrandLogo logoUrl={job.companyLogo} name={job.title} company={job.company} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ fontSize: '1rem', margin: 0, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                          {job.title}
                        </h4>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                          {job.company} · {job.location || 'Flexible'}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <p style={{
                      fontSize: '0.82rem', color: 'var(--text-secondary)',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      overflow: 'hidden', lineHeight: 1.5, margin: 0,
                    }}>
                      {job.description}
                    </p>

                    {/* Chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      <Chip color={typeColor[job.type]}>{typeLabel[job.type] || job.type}</Chip>
                      <Chip>{job.experienceLevel}</Chip>
                      {job.tags?.slice(0, 2).map((t, i) => <Chip key={i}>{t}</Chip>)}
                    </div>

                    {/* Salary + Deadline */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                      {salary ? (
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#34d399' }}>{salary}</span>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Salary on request</span>
                      )}
                      {left !== null && (
                        <span style={{
                          fontSize: '0.72rem', fontWeight: 700,
                          color: isUrgent ? '#f87171' : 'var(--text-muted)',
                        }}>
                          {left === 0 ? 'Closes today' : `${left}d left`}
                        </span>
                      )}
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={e => { e.stopPropagation(); openDetail(job); setShowApply(true); }}
                      disabled={isApplied}
                      className={`btn ${isApplied ? 'btn-secondary' : 'btn-primary'}`}
                      style={{ width: '100%', justifyContent: 'center', padding: '9px 12px', fontSize: '0.84rem' }}
                    >
                      {isApplied ? 'Applied' : 'Quick Apply'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB: MY APPLICATIONS
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'applications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {myApps.length === 0 ? (
            <div className="card flex-center" style={{ padding: '56px', flexDirection: 'column', gap: '12px', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
              </div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>No applications yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                Browse part-time jobs and submit your first application!
              </p>
              <button className="btn btn-primary" onClick={() => setActiveTab('browse')} style={{ marginTop: '8px', padding: '9px 20px' }}>
                Browse Jobs
              </button>
            </div>
          ) : (
            myApps.map(app => {
              const job = app.targetId;
              return (
                <div key={app._id} className="card" style={{
                  padding: '18px 20px', display: 'flex', alignItems: 'center',
                  gap: '16px', flexWrap: 'wrap', justifyContent: 'space-between',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--r-lg)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: 'var(--r-md)', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {job?.companyLogo
                        ? <img src={job.companyLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        : <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>{(job?.company || 'J')[0]}</span>
                      }
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {job?.title || 'Part-Time Position'}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {job?.company || '—'} · Applied {formatDate(app.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    {job?.type && <Chip color={typeColor[job.type]}>{typeLabel[job.type]}</Chip>}
                    <StatusBadge status={app.status} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          JOB DETAIL / APPLY MODAL
      ════════════════════════════════════════════════════════════════════════ */}
      {selectedJob && (
        <div className="modal-backdrop animate-fade-in" onClick={() => { setSelectedJob(null); setShowApply(false); }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: showApply ? '520px' : '680px', padding: '0', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ padding: '24px 28px 18px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: 'var(--r-md)', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  <BrandLogo logoUrl={selectedJob.companyLogo} name={selectedJob.title} company={selectedJob.company} />
                </div>
                <div>
                  <div className="section-label" style={{ fontSize: '0.65rem' }}>Part-Time Opportunity</div>
                  <h3 style={{ fontSize: '1.2rem', margin: '2px 0 0', fontWeight: 800 }}>{selectedJob.title}</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                    {selectedJob.company} · {selectedJob.location || 'Flexible'}
                  </p>
                </div>
              </div>
              <button onClick={() => { setSelectedJob(null); setShowApply(false); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>

            {/* Content */}
            <div style={{ padding: '20px 28px 24px', maxHeight: '70vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Chips row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                <Chip color={typeColor[selectedJob.type]}>{typeLabel[selectedJob.type] || selectedJob.type}</Chip>
                <Chip>Part-time contract</Chip>
                <Chip>{selectedJob.experienceLevel} level</Chip>
                {selectedJob.tags?.map((t, i) => <Chip key={i}>{t}</Chip>)}
              </div>

              {/* Salary */}
              {!selectedJob.salary?.isHidden && selectedJob.salary?.min && (
                <div style={{ padding: '12px 16px', background: 'rgba(52, 211, 153, 0.06)', border: '1px solid rgba(52, 211, 153, 0.25)', borderRadius: 'var(--r-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Monthly Compensation</span>
                  <span style={{ fontWeight: 800, color: '#34d399', fontSize: '1rem' }}>
                    {selectedJob.salary.min}{selectedJob.salary.max ? `–${selectedJob.salary.max}` : '+'} {selectedJob.salary.currency}
                  </span>
                </div>
              )}

              {!showApply ? (
                <>
                  {/* Description */}
                  {selectedJob.description && (
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '8px' }}>About the Role</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>
                        {selectedJob.description}
                      </p>
                    </div>
                  )}

                  {/* Responsibilities */}
                  {selectedJob.responsibilities?.length > 0 && (
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '8px' }}>Responsibilities</p>
                      <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {selectedJob.responsibilities.map((r, i) => (
                          <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Requirements */}
                  {selectedJob.requirements?.length > 0 && (
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '8px' }}>Requirements</p>
                      <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {selectedJob.requirements.map((r, i) => (
                          <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Application window */}
                  {(selectedJob.applicationStartDate || selectedJob.applicationEndDate) && (
                    <div style={{ padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <span>Application Window</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {formatDate(selectedJob.applicationStartDate)} → {formatDate(selectedJob.applicationEndDate) || 'Open'}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                    <button onClick={() => { setSelectedJob(null); }} className="btn btn-ghost" style={{ flex: 1 }}>Close</button>
                    <button
                      onClick={() => setShowApply(true)}
                      disabled={appliedIds.has(selectedJob._id)}
                      className={`btn ${appliedIds.has(selectedJob._id) ? 'btn-secondary' : 'btn-primary'}`}
                      style={{ flex: 2, justifyContent: 'center' }}
                    >
                      {appliedIds.has(selectedJob._id) ? 'Already Applied' : 'Apply Now'}
                    </button>
                  </div>
                </>
              ) : (
                /* ── Apply Form ── */
                <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Cover Note <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                    <textarea
                      rows={5}
                      placeholder="Introduce yourself, highlight your availability and why this role fits your studies..."
                      value={coverLetter}
                      onChange={e => setCoverLetter(e.target.value)}
                      style={{ fontSize: '0.86rem', resize: 'vertical' }}
                    />
                  </div>

                  {/* Auto CV */}
                  <div style={{
                    padding: '12px 14px',
                    background: 'rgba(52, 211, 153, 0.06)',
                    border: '1px solid rgba(52, 211, 153, 0.25)',
                    borderRadius: 'var(--r-md)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: '0.8rem',
                  }}>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>Profile CV attached automatically</span>
                    {user?.cvUrl && (
                      <a href={user.cvUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--red)', fontWeight: 600 }}>
                        View CV
                      </a>
                    )}
                  </div>

                  {!user?.cvUrl && (
                    <p style={{ fontSize: '0.78rem', color: '#fbbf24', margin: 0 }}>
                      ⚠ No CV found on your profile. Upload one in your profile settings to strengthen your application.
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                    <button type="button" onClick={() => setShowApply(false)} className="btn btn-ghost" style={{ flex: 1 }}>Back</button>
                    <button type="submit" disabled={submitting} className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                      {submitting ? 'Submitting...' : 'Confirm & Submit'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartTimeJobs;
