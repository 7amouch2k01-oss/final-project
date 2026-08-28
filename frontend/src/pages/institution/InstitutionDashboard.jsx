import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useInstitutionStore } from '../../store/institutionStore';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

export const InstitutionDashboard = () => {
  const { 
    institution, 
    stats, 
    applicants, 
    listings,
    fetchProfile, 
    fetchApplicants, 
    fetchListings,
    updateApplicantStatus,
    createListing,
    deleteListing,
    logout,
  } = useInstitutionStore();

  const { mode, toggleMode } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('applicants'); // 'applicants', 'listings', 'ended', 'post'
  const [applicantFilter, setApplicantFilter] = useState('all');
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  // Communication Modals State
  const [activeModal, setActiveModal] = useState(null); // 'missing_doc' | 'meeting' | null
  const [missingDocName, setMissingDocName] = useState('');
  const [missingDocInstructions, setMissingDocInstructions] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  // New Listing Form state
  const isSchoolOrUni = institution?.type === 'university' || institution?.type === 'school';
  const [postType, setPostType] = useState(isSchoolOrUni ? 'university' : 'job');
  const [listingForm, setListingForm] = useState({
    title: '',
    description: '',
    fields: '',
    programmes: '',
    requirements: '',
    location: institution?.location || '',
    applicationStartDate: new Date().toISOString().split('T')[0],
    applicationEndDate: '',
    type: 'on-site',
    contractType: 'CDI',
    experienceLevel: 'junior',
    duration: '3-6 months',
    domain: 'Software Engineering',
  });
  const [creatingListing, setCreatingListing] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchApplicants(applicantFilter);
    fetchListings();
  }, [applicantFilter]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // When clicking an applicant to view, automatically mark as under_review
  const handleSelectApplicant = async (app) => {
    setSelectedApplicant(app);
    if (app.status === 'pending') {
      try {
        await api.post(`/applications/${app._id}/review`);
        app.status = 'under_review';
        setSelectedApplicant({ ...app });
        fetchApplicants(applicantFilter);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    setUpdatingId(appId);
    const res = await updateApplicantStatus(appId, newStatus, noteText);
    setUpdatingId(null);
    if (res.success) {
      toast.success(`Applicant marked as ${newStatus}`);
      if (selectedApplicant?._id === appId) {
        setSelectedApplicant({ ...selectedApplicant, status: newStatus, recruiterNote: noteText });
      }
      setNoteText('');
      fetchApplicants(applicantFilter);
    } else {
      toast.error(res.error || 'Failed to update status');
    }
  };

  // Send Missing Document Request
  const handleSendMissingDocRequest = async (e) => {
    e.preventDefault();
    if (!selectedApplicant || !missingDocName.trim()) return;
    setSendingMsg(true);
    try {
      await api.post(`/applications/${selectedApplicant._id}/messages`, {
        senderRole: 'institution',
        type: 'file_request',
        missingDocType: missingDocName.trim(),
        message: `Please upload your missing document: ${missingDocName.trim()}. ${missingDocInstructions.trim() ? `Instructions: ${missingDocInstructions.trim()}` : ''}`,
      });
      toast.success('Document request sent to candidate!');
      setActiveModal(null);
      setMissingDocName('');
      setMissingDocInstructions('');
      fetchApplicants(applicantFilter);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send document request');
    } finally {
      setSendingMsg(false);
    }
  };

  // Book / Schedule Meeting
  const handleBookMeeting = async (e) => {
    e.preventDefault();
    if (!selectedApplicant || !meetingDate || !meetingTime) return;
    setSendingMsg(true);
    try {
      await api.post(`/applications/${selectedApplicant._id}/messages`, {
        senderRole: 'institution',
        type: 'meeting_booking',
        message: `Interview / Meeting scheduled for ${meetingDate} at ${meetingTime}. Link: ${meetingLink || 'To be shared directly'}. ${meetingNotes ? `Notes: ${meetingNotes}` : ''}`,
        meetingDetails: {
          date: new Date(meetingDate),
          time: meetingTime,
          link: meetingLink,
          notes: meetingNotes,
        },
      });
      toast.success('Interview scheduled and sent to candidate!');
      setActiveModal(null);
      setMeetingDate('');
      setMeetingTime('');
      setMeetingLink('');
      setMeetingNotes('');
      fetchApplicants(applicantFilter);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule meeting');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleCreateListingSubmit = async (e) => {
    e.preventDefault();
    setCreatingListing(true);

    const progsArray = listingForm.programmes
      .split(',')
      .map(p => p.trim())
      .filter(Boolean)
      .map(name => ({ name }));

    let data = {
      description: listingForm.description,
      requirements: listingForm.requirements.split(',').map(r => r.trim()).filter(Boolean),
      applicationStartDate: listingForm.applicationStartDate ? new Date(listingForm.applicationStartDate) : new Date(),
      applicationEndDate: listingForm.applicationEndDate ? new Date(listingForm.applicationEndDate) : null,
      programmes: progsArray,
    };

    if (postType === 'university') {
      data = {
        ...data,
        name: listingForm.title || institution.name,
        city: listingForm.location || institution?.location || 'Tunis',
        country: institution?.country || 'Tunisia',
        fields: listingForm.fields.split(',').map(f => f.trim()).filter(Boolean),
      };
    } else if (postType === 'stage') {
      data = {
        ...data,
        title: listingForm.title,
        domain: listingForm.domain,
        location: listingForm.location,
        type: listingForm.type,
        duration: listingForm.duration,
      };
    } else {
      data = {
        ...data,
        title: listingForm.title,
        location: listingForm.location,
        type: listingForm.type,
        contractType: listingForm.contractType,
        experienceLevel: listingForm.experienceLevel,
        tags: listingForm.fields.split(',').map(f => f.trim()).filter(Boolean),
      };
    }

    const res = await createListing(postType, data);
    setCreatingListing(false);

    if (res.success) {
      toast.success('Opportunity published successfully!');
      setActiveTab('listings');
      setListingForm({
        title: '',
        description: '',
        fields: '',
        programmes: '',
        requirements: '',
        location: institution?.location || '',
        applicationStartDate: new Date().toISOString().split('T')[0],
        applicationEndDate: '',
        type: 'on-site',
        contractType: 'CDI',
        experienceLevel: 'junior',
        duration: '3-6 months',
        domain: 'Software Engineering',
      });
      fetchListings();
    } else {
      toast.error(res.error || 'Failed to create listing');
    }
  };

  if (!institution) {
    return (
      <div className="page flex-center">
        <div className="animate-spin" style={{ fontSize: '1.8rem', color: 'var(--red)' }}>⟳</div>
        <div style={{ marginLeft: '12px', color: 'var(--text-secondary)' }}>Loading Institution Workspace...</div>
      </div>
    );
  }

  const endedListings = listings?.endedListings || { universities: [], stages: [], jobs: [] };

  return (
    <div className="page container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '60px' }}>
      
      {/* ── Top Institution Header Banner ────────────────────────────── */}
      <div className="card glass" style={{ padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '12px',
            background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 800,
            overflow: 'hidden'
          }}>
            {institution.logo ? (
              <img src={institution.logo} alt={institution.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
            ) : (
              institution.name?.substring(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="section-label" style={{ marginBottom: 0 }}>
                {institution.type.toUpperCase()} PORTAL
              </div>
              <span style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#10b981', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '1px 8px', borderRadius: 'var(--r-full)', fontSize: '0.7rem', fontWeight: 700 }}>
                VERIFIED & ACTIVE
              </span>
            </div>
            <h2 style={{ fontSize: '1.6rem', margin: '4px 0 2px', fontWeight: 800 }}>{institution.name}</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
              {institution.location || 'Tunisia'} · {institution.email} · {institution.website || 'Official Organization'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Light / Dark Mode Button (B&W to Red on Hover) */}
          <button
            onClick={toggleMode}
            className="icon-btn-logo"
            title={mode === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle Theme"
            style={{
              width: '40px', height: '40px',
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(14px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all var(--t-fast)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {mode === 'dark' ? (
              <svg 
                className="btn-svg-logo"
                width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg 
                className="btn-svg-logo"
                width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>

          {/* Notification Bell Button (B&W to Red on Hover) */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              aria-label="Notifications"
              className="icon-btn-logo"
              style={{
                width: '40px', height: '40px',
                borderRadius: 'var(--r-md)',
                border: notifOpen ? '1px solid var(--red-border)' : '1px solid var(--glass-border)',
                background: notifOpen ? 'var(--red-subtle)' : 'var(--glass-bg)',
                backdropFilter: 'blur(14px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all var(--t-fast)',
              }}
            >
              <svg 
                className="btn-svg-logo"
                width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {(stats?.stats?.pendingApps || 0) > 0 && (
                <span style={{
                  position: 'absolute', top: '-4px', right: '-4px',
                  background: 'var(--red)', color: '#fff',
                  fontSize: '0.62rem', fontWeight: 800,
                  width: '18px', height: '18px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid var(--bg-surface)',
                  boxShadow: '0 0 8px var(--red-glow)',
                  animation: 'pulse-red 2s ease infinite',
                }}>{stats?.stats?.pendingApps}</span>
              )}
            </button>

            {notifOpen && (
              <div 
                className="card animate-fade-down"
                style={{
                  position: 'absolute',
                  top: '48px',
                  right: 0,
                  width: '320px',
                  zIndex: 2000,
                  padding: '16px',
                  boxShadow: 'var(--shadow-xl)',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--r-lg)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Institution Alerts</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stats?.stats?.pendingApps || 0} pending</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                  {(stats?.stats?.pendingApps || 0) > 0 ? (
                    <div style={{ padding: '8px', background: 'var(--red-subtle)', borderRadius: 'var(--r-md)', border: '1px solid var(--red-border)', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                      ⚠️ You have <strong>{stats?.stats?.pendingApps}</strong> candidate applications waiting for your review.
                    </div>
                  ) : (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      ✓ All applications reviewed and up to date!
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => setActiveTab('post')} 
            className="btn btn-primary"
            style={{ padding: '9px 16px', fontSize: '0.86rem' }}
          >
            Post New Opportunity
          </button>
          <button onClick={logout} className="btn btn-ghost" style={{ padding: '9px 14px', fontSize: '0.86rem' }}>
            Logout
          </button>
        </div>
      </div>

      {/* ── Key Performance Metrics ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        {[
          { label: 'Total Applicants', value: stats?.stats?.totalApps || applicants.length, color: 'var(--text-primary)' },
          { label: 'Pending Review', value: stats?.stats?.pendingApps || 0, color: '#fbbf24' },
          { label: 'Under Review', value: stats?.stats?.underReviewApps || 0, color: '#60a5fa' },
          { label: 'Accepted Candidates', value: stats?.stats?.acceptedApps || 0, color: '#10b981' },
          { label: 'Live Active Listings', value: stats?.stats?.totalListings || 0, color: 'var(--red)' },
        ].map(m => (
          <div key={m.label} className="card glass" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: m.color, fontFamily: 'var(--font-display)' }}>
              {m.value}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* ── Dashboard Navigation Tabs ────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px', flexWrap: 'wrap' }}>
        {[
          { id: 'applicants', label: `Candidates & Applicants (${applicants.length})` },
          { id: 'listings', label: `Active Opportunities` },
          { id: 'ended', label: `Ended / Expired Posts` },
          { id: 'post', label: `Publish New Opportunity` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--r-md)',
              border: `1px solid ${activeTab === tab.id ? 'var(--red-border)' : 'transparent'}`,
              background: activeTab === tab.id ? 'var(--red-subtle)' : 'transparent',
              color: activeTab === tab.id ? 'var(--red)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              transition: 'all var(--t-fast)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ════ TAB 1: APPLICANTS & PROOF VERIFICATION INBOX ════ */}
      {activeTab === 'applicants' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Filter Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['all', 'pending', 'under_review', 'accepted', 'rejected'].map(status => (
                <button
                  key={status}
                  onClick={() => setApplicantFilter(status)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 'var(--r-full)',
                    border: `1px solid ${applicantFilter === status ? 'var(--red)' : 'var(--glass-border)'}`,
                    background: applicantFilter === status ? 'var(--red)' : 'var(--bg-elevated)',
                    color: applicantFilter === status ? '#fff' : 'var(--text-secondary)',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Click any candidate to open dossier, auto-mark Under Review, and chat / schedule meetings.
            </div>
          </div>

          {/* Applicants Table / List */}
          {applicants.length === 0 ? (
            <div className="card glass flex-center" style={{ padding: '60px 20px', flexDirection: 'column', gap: '10px', textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>No Candidates in this Filter</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', fontSize: '0.85rem' }}>
                When students or professionals apply to your listings, their verified dossiers and profiles will appear right here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: selectedApplicant ? '1fr 1.3fr' : '1fr', gap: '20px' }}>
              
              {/* Left Column: Candidates List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {applicants.map(app => {
                  const candidate = app.applicantId || {};
                  const bac = candidate.baccalaureate || {};
                  const isSelected = selectedApplicant?._id === app._id;

                  return (
                    <div 
                      key={app._id}
                      onClick={() => handleSelectApplicant(app)}
                      className="card glass hover-card"
                      style={{
                        padding: '16px 18px',
                        cursor: 'pointer',
                        border: `1px solid ${isSelected ? 'var(--red)' : 'var(--glass-border)'}`,
                        background: isSelected ? 'var(--red-subtle)' : 'var(--bg-surface)',
                        transition: 'all var(--t-fast)',
                        borderRadius: 'var(--r-md)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                            {candidate.name || 'Anonymous Candidate'}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            Target: <strong>{app.targetModel}</strong> {app.selectedProgramme ? `· ${app.selectedProgramme}` : ''}
                          </div>
                        </div>

                        {/* Status badge */}
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: 'var(--r-full)',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: app.status === 'accepted' ? 'rgba(52, 211, 153, 0.15)' : app.status === 'rejected' ? 'rgba(225, 29, 72, 0.15)' : app.status === 'under_review' ? 'rgba(96, 165, 250, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                          color: app.status === 'accepted' ? '#10b981' : app.status === 'rejected' ? 'var(--red)' : app.status === 'under_review' ? '#60a5fa' : '#fbbf24',
                          border: '1px solid var(--glass-border)',
                        }}>
                          {app.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Candidate quick metrics */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                        {bac.school && (
                          <span style={{ fontSize: '0.72rem', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: '4px' }}>
                            Bac {bac.section || ''} ({bac.year || ''})
                          </span>
                        )}
                        {candidate.postBacPath && (
                          <span style={{ fontSize: '0.72rem', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: '4px', textTransform: 'capitalize' }}>
                            Path: {candidate.postBacPath}
                          </span>
                        )}
                        {candidate.cvUrl && (
                          <span style={{ fontSize: '0.72rem', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '2px 6px', borderRadius: '4px' }}>
                            Profile CV Attached
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Detailed Candidate Inspection & Communication Drawer */}
              {selectedApplicant && (
                <div className="card glass animate-scale-in" style={{ padding: '24px', position: 'sticky', top: '90px', height: 'fit-content', maxHeight: '84vh', overflowY: 'auto' }}>
                  
                  {/* Top Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Dossier #{selectedApplicant._id.slice(-6)}
                    </div>
                    <button 
                      onClick={() => setSelectedApplicant(null)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Candidate Details */}
                  {(() => {
                    const c = selectedApplicant.applicantId || {};
                    const bac = c.baccalaureate || {};

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Header info */}
                        <div>
                          <h3 style={{ fontSize: '1.3rem', margin: '0 0 2px', fontWeight: 700 }}>{c.name}</h3>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{c.email}</div>
                          {c.bio && <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '6px', fontStyle: 'italic' }}>"{c.bio}"</p>}
                        </div>

                        {/* Selected Program / Track */}
                        {selectedApplicant.selectedProgramme && (
                          <div style={{ padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--glass-border)', fontSize: '0.84rem' }}>
                            <strong>Selected Programme:</strong> {selectedApplicant.selectedProgramme}
                          </div>
                        )}

                        {/* Verified Baccalaureate Dossier */}
                        <div style={{ padding: '14px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--red)' }}>
                              Official Baccalaureate Record
                            </div>
                            <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700 }}>VERIFIED</span>
                          </div>

                          {bac.school ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.82rem' }}>
                              <div><strong>High School:</strong> {bac.school}</div>
                              <div><strong>Year & Section:</strong> {bac.year} — {bac.section}</div>
                              {bac.grade && <div><strong>Score / Mention:</strong> {bac.grade}</div>}
                              
                              {bac.proofDocUrl && (
                                <div style={{ marginTop: '6px' }}>
                                  <a 
                                    href={bac.proofDocUrl} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="btn btn-secondary btn-sm"
                                    style={{ fontSize: '0.76rem', padding: '4px 10px' }}
                                  >
                                    Inspect Baccalaureate Proof Document ↗
                                  </a>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No Baccalaureate proof entered.</div>
                          )}
                        </div>

                        {/* Post-Bac Education / Formation */}
                        <div style={{ padding: '14px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '6px' }}>
                            Post-Baccalaureate Education & Path
                          </div>
                          {c.education && c.education.length > 0 ? (
                            c.education.map((edu, idx) => (
                              <div key={idx} style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <div><strong>{edu.school}</strong> · {edu.degree}</div>
                                <div style={{ color: 'var(--text-secondary)' }}>Major: {edu.field}</div>
                                <div style={{ fontSize: '0.74rem', color: edu.isCurrent ? '#10b981' : 'var(--text-muted)' }}>
                                  Status: {edu.isCurrent ? 'Ongoing Studies' : 'Completed / Graduated'}
                                </div>
                              </div>
                            ))
                          ) : c.formationDetails?.instituteName ? (
                            <div style={{ fontSize: '0.82rem' }}>
                              <div><strong>{c.formationDetails.instituteName}</strong></div>
                              <div style={{ color: 'var(--text-secondary)' }}>Program: {c.formationDetails.programName}</div>
                            </div>
                          ) : (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Self-taught / Direct career search</div>
                          )}
                        </div>

                        {/* Skills & Attached CV */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Candidate CV & Profile Skills</div>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {c.skills && c.skills.length > 0 ? (
                              c.skills.map((s, idx) => (
                                <span key={idx} style={{ fontSize: '0.72rem', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: '4px' }}>
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No skills listed</span>
                            )}
                          </div>
                          {(selectedApplicant.documents?.[0] || c.cvUrl) && (
                            <div style={{ marginTop: '4px' }}>
                              <a href={selectedApplicant.documents?.[0] || c.cvUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ fontSize: '0.78rem' }}>
                                View Attached Candidate CV ↗
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Cover Note */}
                        {selectedApplicant.coverLetter && (
                          <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: '8px', fontSize: '0.82rem' }}>
                            <div style={{ fontWeight: 700, marginBottom: '2px' }}>Candidate Application Note:</div>
                            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{selectedApplicant.coverLetter}</p>
                          </div>
                        )}

                        {/* Direct Interactive Communication Section */}
                        <div style={{ padding: '14px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                            Direct Communication & Interview Hub
                          </div>

                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => setActiveModal('missing_doc')}
                              className="btn btn-secondary btn-sm"
                              style={{ flex: 1, fontSize: '0.76rem', justifyContent: 'center' }}
                            >
                              Request Missing File
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveModal('meeting')}
                              className="btn btn-secondary btn-sm"
                              style={{ flex: 1, fontSize: '0.76rem', justifyContent: 'center' }}
                            >
                              Book Interview / Meeting
                            </button>
                          </div>

                          {/* Message Thread History if any */}
                          {selectedApplicant.messages && selectedApplicant.messages.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                              {selectedApplicant.messages.map((m, idx) => (
                                <div key={idx} style={{ padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-elevated)', fontSize: '0.78rem' }}>
                                  <div style={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', color: m.sender === 'institution' ? 'var(--red)' : '#10b981' }}>
                                    <span>{m.senderName || m.sender}</span>
                                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{new Date(m.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <div style={{ marginTop: '2px', color: 'var(--text-secondary)' }}>{m.message}</div>
                                  {m.uploadedDocUrl && (
                                    <a href={m.uploadedDocUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', color: '#60a5fa', display: 'block', marginTop: '4px' }}>
                                      [View Uploaded Document ↗]
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Internal Note Input */}
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>Internal Admission Note (optional)</label>
                          <input 
                            type="text"
                            value={noteText}
                            onChange={e => setNoteText(e.target.value)}
                            placeholder="Add evaluation score or private notes..."
                            style={{ fontSize: '0.82rem', padding: '8px 12px' }}
                          />
                        </div>

                        {/* Action Buttons: Accept / Decline */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }}>
                          <button
                            type="button"
                            disabled={updatingId === selectedApplicant._id}
                            onClick={() => handleStatusChange(selectedApplicant._id, 'accepted')}
                            className="btn btn-sm"
                            style={{ background: '#10b981', color: '#fff', justifyContent: 'center' }}
                          >
                            Accept Application
                          </button>

                          <button
                            type="button"
                            disabled={updatingId === selectedApplicant._id}
                            onClick={() => handleStatusChange(selectedApplicant._id, 'rejected')}
                            className="btn btn-sm"
                            style={{ background: 'var(--red)', color: '#fff', justifyContent: 'center' }}
                          >
                            Decline Application
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ════ TAB 2: ACTIVE OPPORTUNITIES ════ */}
      {activeTab === 'listings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Active Published Opportunities</h3>
            <button onClick={() => setActiveTab('post')} className="btn btn-primary btn-sm">
              Post Opportunity
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {/* Universities */}
            {listings.universities?.map(u => (
              <div key={u._id} className="card glass" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className="section-label" style={{ fontSize: '0.65rem' }}>University Course</span>
                  <button onClick={() => deleteListing('university', u._id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--red)', padding: '2px 6px', fontSize: '0.74rem' }}>
                    Archive
                  </button>
                </div>
                <h4 style={{ fontSize: '1.05rem', margin: '4px 0', fontWeight: 700 }}>{u.name}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{u.description?.slice(0, 100)}...</p>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: 'auto' }}>
                  {u.programmes?.map((p, i) => (
                    <span key={i} style={{ fontSize: '0.7rem', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: '4px' }}>
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {/* Stages */}
            {listings.stages?.map(s => (
              <div key={s._id} className="card glass" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className="section-label" style={{ fontSize: '0.65rem' }}>Internship / Stage</span>
                  <button onClick={() => deleteListing('stage', s._id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--red)', padding: '2px 6px', fontSize: '0.74rem' }}>
                    Archive
                  </button>
                </div>
                <h4 style={{ fontSize: '1.05rem', margin: '4px 0', fontWeight: 700 }}>{s.title}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{s.description?.slice(0, 100)}...</p>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 'auto' }}>
                  {s.duration} · {s.location} ({s.type})
                </div>
              </div>
            ))}

            {/* Jobs */}
            {listings.jobs?.map(j => (
              <div key={j._id} className="card glass" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className="section-label" style={{ fontSize: '0.65rem' }}>Job Vacancy</span>
                  <button onClick={() => deleteListing('job', j._id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--red)', padding: '2px 6px', fontSize: '0.74rem' }}>
                    Archive
                  </button>
                </div>
                <h4 style={{ fontSize: '1.05rem', margin: '4px 0', fontWeight: 700 }}>{j.title}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{j.description?.slice(0, 100)}...</p>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 'auto' }}>
                  {j.contractType} · {j.location} ({j.type})
                </div>
              </div>
            ))}

            {(!listings.universities?.length && !listings.stages?.length && !listings.jobs?.length) && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No active listings published yet. Click "Post Opportunity" to publish.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════ TAB 3: ENDED / EXPIRED POSTS ════ */}
      {activeTab === 'ended' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Ended & Expired Posts Archive</h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Posts automatically move here after their application end date expires.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {endedListings.universities?.map(u => (
              <div key={u._id} className="card glass" style={{ padding: '18px', opacity: 0.75 }}>
                <span className="section-label" style={{ fontSize: '0.65rem' }}>Ended University Course</span>
                <h4 style={{ fontSize: '1rem', margin: '6px 0', fontWeight: 700 }}>{u.name}</h4>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Ended on: {new Date(u.applicationEndDate || u.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}

            {endedListings.stages?.map(s => (
              <div key={s._id} className="card glass" style={{ padding: '18px', opacity: 0.75 }}>
                <span className="section-label" style={{ fontSize: '0.65rem' }}>Ended Stage</span>
                <h4 style={{ fontSize: '1rem', margin: '6px 0', fontWeight: 700 }}>{s.title}</h4>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Ended on: {new Date(s.applicationEndDate || s.deadline || s.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}

            {endedListings.jobs?.map(j => (
              <div key={j._id} className="card glass" style={{ padding: '18px', opacity: 0.75 }}>
                <span className="section-label" style={{ fontSize: '0.65rem' }}>Ended Job</span>
                <h4 style={{ fontSize: '1rem', margin: '6px 0', fontWeight: 700 }}>{j.title}</h4>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Ended on: {new Date(j.applicationEndDate || j.deadline || j.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}

            {(!endedListings.universities?.length && !endedListings.stages?.length && !endedListings.jobs?.length) && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No ended or expired posts in your archive.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════ TAB 4: CREATE / POST NEW OPPORTUNITY ════ */}
      {activeTab === 'post' && (
        <div className="card glass" style={{ padding: '28px', maxWidth: '720px', margin: '0 auto', width: '100%' }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '4px', fontWeight: 700 }}>Publish Opportunity</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginBottom: '20px' }}>
            Publish new university courses, stages, or job opportunities with application start/end dates.
          </p>

          <form onSubmit={handleCreateListingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Type selector */}
            <div className="form-group">
              <label className="form-label">Opportunity Type *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {[
                  { id: 'university', label: 'University Course', desc: 'Higher education' },
                  { id: 'stage', label: 'Internship / Stage', desc: 'PFE, PFA, Summer' },
                  { id: 'job', label: 'Job Opening', desc: 'CDI, CDD, Remote' },
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setPostType(t.id)}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--r-md)',
                      border: `1px solid ${postType === t.id ? 'var(--red)' : 'var(--glass-border)'}`,
                      background: postType === t.id ? 'var(--red-subtle)' : 'var(--bg-elevated)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all var(--t-fast)'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.84rem', color: postType === t.id ? 'var(--red)' : 'var(--text-primary)' }}>
                      {t.label}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Title / Name */}
            <div className="form-group">
              <label className="form-label">
                {postType === 'university' ? 'University / Faculty Title *' : 'Listing Title / Role *'}
              </label>
              <input 
                type="text"
                value={listingForm.title}
                onChange={e => setListingForm({ ...listingForm, title: e.target.value })}
                placeholder={postType === 'university' ? institution.name : 'e.g. Full Stack Developer Intern (PFE)'}
                required
              />
            </div>

            {/* Multiple Specific Programmes */}
            <div className="form-group">
              <label className="form-label">Specific Programmes / Tracks (comma separated)</label>
              <input 
                type="text"
                value={listingForm.programmes}
                onChange={e => setListingForm({ ...listingForm, programmes: e.target.value })}
                placeholder="e.g. Master AI & Data, Licence Software Engineering, Cyber Security"
              />
            </div>

            {/* Application Date Range */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Application Start Date</label>
                <input 
                  type="date"
                  value={listingForm.applicationStartDate}
                  onChange={e => setListingForm({ ...listingForm, applicationStartDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Application End Date (Deadline)</label>
                <input 
                  type="date"
                  value={listingForm.applicationEndDate}
                  onChange={e => setListingForm({ ...listingForm, applicationEndDate: e.target.value })}
                />
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Description & Overview *</label>
              <textarea 
                rows="4"
                value={listingForm.description}
                onChange={e => setListingForm({ ...listingForm, description: e.target.value })}
                placeholder="Detail the curriculum, prerequisites, responsibilities, or learning outcomes..."
                required
              />
            </div>

            {/* Requirements */}
            <div className="form-group">
              <label className="form-label">Requirements / Prerequisites (comma separated)</label>
              <input 
                type="text"
                value={listingForm.requirements}
                onChange={e => setListingForm({ ...listingForm, requirements: e.target.value })}
                placeholder="e.g. Baccalaureate Math/Sciences, React.js, Good English"
              />
            </div>

            {/* Type Specific Fields */}
            {postType === 'stage' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Domain</label>
                  <input 
                    type="text"
                    value={listingForm.domain}
                    onChange={e => setListingForm({ ...listingForm, domain: e.target.value })}
                    placeholder="e.g. Software Engineering"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Duration</label>
                  <input 
                    type="text"
                    value={listingForm.duration}
                    onChange={e => setListingForm({ ...listingForm, duration: e.target.value })}
                    placeholder="e.g. 4-6 months"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Work Mode</label>
                  <select 
                    value={listingForm.type}
                    onChange={e => setListingForm({ ...listingForm, type: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--r-md)', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                  >
                    <option value="on-site">On-Site</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="remote">Remote</option>
                  </select>
                </div>
              </div>
            )}

            {postType === 'job' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Contract Type</label>
                  <select 
                    value={listingForm.contractType}
                    onChange={e => setListingForm({ ...listingForm, contractType: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--r-md)', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                  >
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="freelance">Freelance</option>
                    <option value="part-time">Part-Time</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Experience</label>
                  <select 
                    value={listingForm.experienceLevel}
                    onChange={e => setListingForm({ ...listingForm, experienceLevel: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--r-md)', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                  >
                    <option value="junior">Junior (0-2 yrs)</option>
                    <option value="mid">Mid-Level (2-5 yrs)</option>
                    <option value="senior">Senior (5+ yrs)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Work Mode</label>
                  <select 
                    value={listingForm.type}
                    onChange={e => setListingForm({ ...listingForm, type: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--r-md)', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                  >
                    <option value="on-site">On-Site</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="remote">Remote</option>
                  </select>
                </div>
              </div>
            )}

            <button type="submit" disabled={creatingListing} className="btn btn-primary" style={{ marginTop: '8px' }}>
              {creatingListing ? 'Publishing...' : 'Publish Listing'}
            </button>
          </form>
        </div>
      )}

      {/* ── Modal 1: Request Missing File Modal ──────────────────────── */}
      {activeModal === 'missing_doc' && selectedApplicant && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setActiveModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', padding: '26px' }}>
            <h3 style={{ fontSize: '1.2rem', margin: '0 0 6px', fontWeight: 700 }}>Request Missing Document</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Candidate will be notified to upload this specific file from their dashboard.
            </p>

            <form onSubmit={handleSendMissingDocRequest} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Document Name / Type *</label>
                <input 
                  type="text" 
                  value={missingDocName} 
                  onChange={e => setMissingDocName(e.target.value)} 
                  placeholder="e.g. Certified Transcript, Identity Proof, Portfolio"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Instructions for Candidate (optional)</label>
                <textarea 
                  rows="3" 
                  value={missingDocInstructions} 
                  onChange={e => setMissingDocInstructions(e.target.value)} 
                  placeholder="e.g. Please provide a stamped PDF copy of your 2nd year transcript."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setActiveModal(null)} className="btn btn-ghost">Cancel</button>
                <button type="submit" disabled={sendingMsg} className="btn btn-primary">
                  {sendingMsg ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 2: Book / Schedule Interview Modal ─────────────────── */}
      {activeModal === 'meeting' && selectedApplicant && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setActiveModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', padding: '26px' }}>
            <h3 style={{ fontSize: '1.2rem', margin: '0 0 6px', fontWeight: 700 }}>Book Interview / Meeting</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Schedule a technical or admission interview with {selectedApplicant.applicantId?.name}.
            </p>

            <form onSubmit={handleBookMeeting} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Interview Date *</label>
                  <input 
                    type="date" 
                    value={meetingDate} 
                    onChange={e => setMeetingDate(e.target.value)} 
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Time (e.g. 14:30) *</label>
                  <input 
                    type="time" 
                    value={meetingTime} 
                    onChange={e => setMeetingTime(e.target.value)} 
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Meeting URL (Google Meet / Teams / Zoom)</label>
                <input 
                  type="url" 
                  value={meetingLink} 
                  onChange={e => setMeetingLink(e.target.value)} 
                  placeholder="https://meet.google.com/xyz-abc-def"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes & Agenda</label>
                <textarea 
                  rows="3" 
                  value={meetingNotes} 
                  onChange={e => setMeetingNotes(e.target.value)} 
                  placeholder="e.g. Technical evaluation (React & Architecture) + Project discussion."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setActiveModal(null)} className="btn btn-ghost">Cancel</button>
                <button type="submit" disabled={sendingMsg} className="btn btn-primary">
                  {sendingMsg ? 'Scheduling...' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default InstitutionDashboard;
