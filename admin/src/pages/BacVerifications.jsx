import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

export default function BacVerifications() {
  const [filter, setFilter] = useState('under_review'); // 'under_review', 'verified', 'rejected', 'all'
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [counts, setCounts] = useState({ underReview: 0, verified: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [studentToReject, setStudentToReject] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/bac-verifications?status=${filter}&search=${encodeURIComponent(search)}`);
      setStudents(res.data.data.students || []);
      if (res.data.data.counts) {
        setCounts(res.data.data.counts);
      }
    } catch (err) {
      console.error('Failed to load Baccalaureate verification queue:', err);
      toast.error('Failed to load Baccalaureate queue');
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

  // Approve student Baccalaureate
  const handleApprove = async (student) => {
    if (!window.confirm(`Are you sure you want to officially VERIFY and mark the Baccalaureate proof for "${student.name}" as AUTHENTIC?`)) {
      return;
    }
    setActionLoading(true);
    try {
      await api.patch(`/admin/bac-verifications/${student._id}/approve`);
      toast.success(`Baccalaureate for "${student.name}" verified successfully!`);
      if (selectedStudent?._id === student._id) {
        setSelectedStudent(null);
      }
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Reject Modal
  const openRejectModal = (student) => {
    setStudentToReject(student);
    setRejectReason('The uploaded document is blurry or does not match an official Tunisian Baccalaureate diploma/transcript.');
    setRejectModalOpen(true);
  };

  // Confirm Rejection
  const handleConfirmReject = async () => {
    if (!studentToReject) return;
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for the rejection');
      return;
    }
    setActionLoading(true);
    try {
      await api.patch(`/admin/bac-verifications/${studentToReject._id}/reject`, { reason: rejectReason });
      toast.success(`Baccalaureate for "${studentToReject.name}" marked as rejected.`);
      setRejectModalOpen(false);
      setStudentToReject(null);
      if (selectedStudent?._id === studentToReject._id) {
        setSelectedStudent(null);
      }
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return <span className="badge badge-success">✓ Verified Authentic</span>;
      case 'rejected':
        return <span className="badge badge-danger">✕ Rejected</span>;
      case 'under_review':
      default:
        return <span className="badge badge-warning" style={{ animation: 'pulse 2s infinite' }}>⏳ Under Review (24h SLA)</span>;
    }
  };

  return (
    <div className="page fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <div className="section-label" style={{ marginBottom: '6px' }}>Legal Document Review</div>
          <h1 style={{ fontSize: '1.75rem', margin: 0, fontWeight: 800 }}>Tunisian Baccalaureate Verification</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-sec)', marginTop: '2px' }}>
            Inspect student diploma proofs, verify official Ministry of Education seals, and confirm authentic academic credentials
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={loadData} disabled={loading || actionLoading}>
            ↻ Refresh Queue
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'under_review', label: `Pending Review (${counts.underReview})`, badge: counts.underReview > 0 },
            { id: 'verified', label: `Verified (${counts.verified})` },
            { id: 'rejected', label: `Rejected (${counts.rejected})` },
            { id: 'all', label: `All Dossiers (${counts.total})` },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: filter === t.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: filter === t.id ? 'var(--accent-light)' : 'var(--bg-elevated)',
                color: filter === t.id ? 'var(--accent)' : 'var(--text-sec)',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
            >
              {t.label}
              {t.badge && (
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
              )}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Search student name, school, section..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '260px', padding: '8px 12px', fontSize: '0.82rem', borderRadius: '6px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
        </form>
      </div>

      {/* Main Table / Queue */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-sec)' }}>
            <div className="animate-spin" style={{ fontSize: '1.8rem', color: 'var(--accent)', marginBottom: '8px' }}>⟳</div>
            Loading Baccalaureate verification queue...
          </div>
        ) : students.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-sec)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🎓</div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>No Baccalaureate records in this queue</div>
            <p style={{ fontSize: '0.82rem', marginTop: '4px' }}>
              {filter === 'under_review' ? 'All student Baccalaureate proofs have been verified and processed!' : 'No matching records found for this filter.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', color: 'var(--text-sec)', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '14px 18px' }}>Student Candidate</th>
                  <th style={{ padding: '14px 18px' }}>High School (Lycée)</th>
                  <th style={{ padding: '14px 18px' }}>Section & Year</th>
                  <th style={{ padding: '14px 18px' }}>Score / Grade</th>
                  <th style={{ padding: '14px 18px' }}>AI Match Confidence</th>
                  <th style={{ padding: '14px 18px' }}>Status</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => {
                  const bac = s.baccalaureate || {};
                  const isUnderReview = bac.verificationStatus === 'under_review';
                  return (
                    <tr 
                      key={s._id} 
                      style={{ 
                        borderBottom: '1px solid var(--border)', 
                        background: isUnderReview ? 'rgba(239, 68, 68, 0.02)' : 'transparent',
                        transition: 'background 0.15s ease' 
                      }}
                    >
                      {/* Candidate */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: 'var(--accent)', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: '0.9rem', flexShrink: 0
                          }}>
                            {s.name?.[0]?.toUpperCase() || 'S'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.name}</div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-sec)' }}>{s.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* School */}
                      <td style={{ padding: '14px 18px', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {bac.school || '—'}
                      </td>

                      {/* Section & Year */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{bac.section || '—'}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-sec)' }}>Session {bac.year || '—'}</div>
                      </td>

                      {/* Grade */}
                      <td style={{ padding: '14px 18px', color: 'var(--accent)', fontWeight: 700 }}>
                        {bac.grade || 'Passed'}
                      </td>

                      {/* AI Confidence */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '45px', height: '6px', borderRadius: '4px', background: 'var(--border)', overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${bac.verificationConfidence || 50}%`,
                              height: '100%',
                              background: (bac.verificationConfidence || 0) >= 75 ? '#10b981' : '#f59e0b',
                            }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: (bac.verificationConfidence || 0) >= 75 ? '#10b981' : '#f59e0b' }}>
                            {bac.verificationConfidence ? `${bac.verificationConfidence}%` : 'Pending'}
                          </span>
                        </div>
                        {bac.extractedData?.detectedKeywords?.length > 0 && (
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-sec)', marginTop: '2px' }}>
                            Matched: {bac.extractedData.detectedKeywords.slice(0, 2).join(', ')}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 18px' }}>
                        {getStatusBadge(bac.verificationStatus)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          {bac.proofDocUrl && (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '5px 10px', fontSize: '0.76rem' }}
                              onClick={() => setSelectedStudent(s)}
                            >
                              🔍 Inspect Document
                            </button>
                          )}

                          {isUnderReview && (
                            <>
                              <button
                                className="btn btn-primary btn-sm"
                                style={{ padding: '5px 10px', fontSize: '0.76rem', background: '#10b981', borderColor: '#059669' }}
                                onClick={() => handleApprove(s)}
                                disabled={actionLoading}
                                title="Verify and accept document"
                              >
                                ✓ Approve
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '5px 10px', fontSize: '0.76rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                                onClick={() => openRejectModal(s)}
                                disabled={actionLoading}
                                title="Reject document"
                              >
                                ✕ Reject
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
        )}
      </div>

      {/* ── Document Inspection Modal ── */}
      {selectedStudent && typeof document !== 'undefined' && createPortal(
        <div 
          className="admin-modal-overlay"
          onClick={() => setSelectedStudent(null)}
        >
          <div 
            className="card admin-modal-dialog"
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '980px', maxHeight: '90vh', padding: '24px', gap: '16px' }}
          >
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                  Baccalaureate Dossier: {selectedStudent.name}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-sec)', margin: '2px 0 0' }}>
                  {selectedStudent.email} · {selectedStudent.baccalaureate?.school} ({selectedStudent.baccalaureate?.section})
                </p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                style={{ 
                  background: 'var(--surface-raised)', border: '1px solid var(--border)', 
                  color: 'var(--text-sec)', width: '34px', height: '34px', borderRadius: '8px', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.2rem', cursor: 'pointer', transition: 'all 0.15s ease' 
                }}
              >
                ✕
              </button>
            </div>

            {/* Document Preview + Metadata Details Split */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '20px', flex: 1, minHeight: '380px', overflowY: 'auto' }}>
              
              {/* Left: Document Embed / Viewer */}
              <div style={{ background: 'var(--bg-elevated)', borderRadius: '10px', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '8px 14px', background: 'var(--surface-raised)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-sec)' }}>OFFICIAL ATTACHED PROOF</span>
                  <a
                    href={selectedStudent.baccalaureate?.proofDocUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                  >
                    Open in Full Window ↗
                  </a>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '360px', background: '#0a0a0a', padding: '12px' }}>
                  {selectedStudent.baccalaureate?.proofDocUrl?.endsWith('.pdf') ? (
                    <iframe
                      src={selectedStudent.baccalaureate.proofDocUrl}
                      title="Baccalaureate Certificate Preview"
                      style={{ width: '100%', height: '100%', minHeight: '380px', border: 'none', borderRadius: '6px' }}
                    />
                  ) : (
                    <img
                      src={selectedStudent.baccalaureate?.proofDocUrl}
                      alt="Baccalaureate Proof Document"
                      style={{ maxWidth: '100%', maxHeight: '420px', objectFit: 'contain', borderRadius: '6px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                    />
                  )}
                </div>
              </div>

              {/* Right: Inspection Checklist & AI Analysis */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Status Box */}
                <div style={{ padding: '14px', background: 'var(--surface-raised)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-sec)', textTransform: 'uppercase' }}>Current Status</div>
                  <div style={{ marginTop: '4px' }}>{getStatusBadge(selectedStudent.baccalaureate?.verificationStatus)}</div>
                  {selectedStudent.baccalaureate?.verificationNotes && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-sec)', marginTop: '6px', lineHeight: 1.4 }}>
                      {selectedStudent.baccalaureate.verificationNotes}
                    </p>
                  )}
                </div>

                {/* Extracted Details */}
                <div style={{ padding: '14px', background: 'var(--surface-raised)', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                    Candidate Declared Details
                  </div>
                  <div><strong>High School:</strong> {selectedStudent.baccalaureate?.school || '—'}</div>
                  <div><strong>Bac Section:</strong> {selectedStudent.baccalaureate?.section || '—'}</div>
                  <div><strong>Session Year:</strong> {selectedStudent.baccalaureate?.year || '—'}</div>
                  <div><strong>Grade / Mention:</strong> {selectedStudent.baccalaureate?.grade || '—'}</div>
                  <div><strong>Uploaded Date:</strong> {selectedStudent.baccalaureate?.submittedAt ? new Date(selectedStudent.baccalaureate.submittedAt).toLocaleDateString('en-GB') : '—'}</div>
                </div>

                {/* Hallmark Checklist */}
                <div style={{ padding: '14px', background: 'var(--surface-raised)', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text)' }}>Tunisian Legal Checklist</div>
                  <div>✓ Check for <strong>"الجمهورية التونسية / République Tunisienne"</strong></div>
                  <div>✓ Check for <strong>"وزارة التربية / Ministère de l'Éducation"</strong></div>
                  <div>✓ Check for Official Session & Seal</div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '10px' }}>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, background: '#10b981', borderColor: '#059669' }}
                    onClick={() => handleApprove(selectedStudent)}
                    disabled={actionLoading}
                  >
                    ✓ Confirm Authentic & Verify
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                    onClick={() => openRejectModal(selectedStudent)}
                    disabled={actionLoading}
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Reject Reason Prompt Modal ── */}
      {rejectModalOpen && studentToReject && typeof document !== 'undefined' && createPortal(
        <div 
          className="admin-modal-overlay"
          onClick={() => setRejectModalOpen(false)}
        >
          <div 
            className="card admin-modal-dialog"
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '480px', padding: '24px', gap: '16px' }}
          >
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#ef4444' }}>
              Reject Baccalaureate Proof
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-sec)', margin: 0 }}>
              Explain why the document for <strong>{studentToReject.name}</strong> was rejected. This message will be sent directly to the student so they can upload the correct proof.
            </p>

            <textarea
              rows={4}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. The document is unreadable / Missing official Ministry stamp / Wrong certificate"
              style={{
                width: '100%', padding: '10px', borderRadius: '6px',
                background: 'var(--surface-raised)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: '0.84rem'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setRejectModalOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary btn-sm"
                style={{ background: '#ef4444', borderColor: '#dc2626' }}
                onClick={handleConfirmReject}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
