import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

export const CompleteProfileModal = ({ isOpen, onClose }) => {
  const { user, setUser, graduate } = useAuthStore();
  const isStudent = user?.role === 'student';

  const [activeTab, setActiveTab] = useState(isStudent ? 'baccalaureate' : 'general');
  const [loading, setLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // ── Core / General Info ──────────────────────────────────────
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [skills, setSkills] = useState(user?.skills?.join(', ') || '');
  const [languages, setLanguages] = useState(user?.languages?.join(', ') || '');
  const [cvUrl, setCvUrl] = useState(user?.cvUrl || '');

  // ── Baccalaureate (Mandatory for Student) ─────────────────────
  const bac = user?.baccalaureate || {};
  const [bacSchool, setBacSchool] = useState(bac.school || '');
  const [bacYear, setBacYear] = useState(bac.year || new Date().getFullYear());
  const [bacSection, setBacSection] = useState(bac.section || 'Informatique');
  const [bacGrade, setBacGrade] = useState(bac.grade || '');
  const [bacProofDocUrl, setBacProofDocUrl] = useState(bac.proofDocUrl || '');

  // ── Education (Current or Past Studies) ────────────────────────
  const firstEdu = user?.education?.[0] || {};
  const [hasHigherEdu, setHasHigherEdu] = useState(!!firstEdu.school || false);
  const [eduSchool, setEduSchool] = useState(firstEdu.school || '');
  const [eduDegree, setEduDegree] = useState(firstEdu.degree || '');
  const [eduField, setEduField] = useState(firstEdu.field || '');
  const [eduIsCurrent, setEduIsCurrent] = useState(firstEdu.isCurrent !== undefined ? firstEdu.isCurrent : true);
  const [eduGradCertUrl, setEduGradCertUrl] = useState(firstEdu.graduationCertUrl || '');

  // ── Experience (for Citizen / Job seeker) ──────────────────────
  const firstExp = user?.experience?.[0] || {};
  const [expCompany, setExpCompany] = useState(firstExp.company || '');
  const [expTitle, setExpTitle] = useState(firstExp.title || '');
  const [expDesc, setExpDesc] = useState(firstExp.description || '');
  const [expCertUrl, setExpCertUrl] = useState(firstExp.certUrl || '');

  if (!isOpen) return null;

  // ── Generic File Uploader ────────────────────────────────────
  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', type === 'bac' ? 'bac_proofs' : type === 'grad' ? 'graduation_certs' : 'documents');

    setUploadingDoc(true);
    try {
      const res = await api.post('/users/upload-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data.data.url;

      if (type === 'bac') {
        setBacProofDocUrl(url);
        toast.success('Baccalaureate proof document uploaded! 📄');
      } else if (type === 'grad') {
        setEduGradCertUrl(url);
        toast.success('Graduation certificate uploaded! 🎓');
      } else if (type === 'cv') {
        setCvUrl(url);
        toast.success('CV / Resume document uploaded! 💼');
      } else if (type === 'exp') {
        setExpCertUrl(url);
        toast.success('Experience proof certificate uploaded! 📜');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'File upload failed');
    } finally {
      setUploadingDoc(false);
    }
  };

  // ── Submit Profile ───────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Verification check for student
    if (isStudent) {
      if (!bacSchool.trim() || !bacYear || !bacSection || !bacProofDocUrl) {
        toast.error('⚠️ For students, Baccalaureate details and proof document upload are strictly mandatory.');
        setActiveTab('baccalaureate');
        return;
      }
      if (hasHigherEdu && !eduIsCurrent && !eduGradCertUrl) {
        toast.error('⚠️ If your higher study is completed, you must upload your graduation certificate.');
        setActiveTab('education');
        return;
      }
    }

    setLoading(true);
    try {
      const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
      const languagesArray = languages.split(',').map(l => l.trim()).filter(Boolean);

      const updateData = {
        name,
        bio,
        skills: skillsArray,
        languages: languagesArray,
        cvUrl,
        baccalaureate: {
          school: bacSchool,
          year: Number(bacYear),
          section: bacSection,
          grade: bacGrade,
          proofDocUrl: bacProofDocUrl,
        },
        education: hasHigherEdu && eduSchool.trim() ? [{
          school: eduSchool,
          degree: eduDegree,
          field: eduField,
          isCurrent: eduIsCurrent,
          graduationCertUrl: eduIsCurrent ? '' : eduGradCertUrl,
        }] : [],
        experience: expCompany.trim() ? [{
          company: expCompany,
          title: expTitle,
          description: expDesc,
          certUrl: expCertUrl,
        }] : [],
      };

      const res = await api.patch('/users', updateData);
      setUser(res.data.data.user);
      toast.success('Profile and documents saved successfully! 🎉');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal animate-scale-in" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '720px', maxHeight: '92vh', overflowY: 'auto', padding: '32px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
          <div>
            <div className="section-label">Verified Profile Hub</div>
            <h3 style={{ fontSize: '1.45rem', margin: 0 }}>
              {isStudent ? '🎓 Student & Baccalaureate Verification' : '💼 Professional & Citizen Profile'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              {isStudent 
                ? 'Tunisian Baccalaureate proof is required to apply for universities & internships.'
                : 'Complete your background and credentials to apply for top jobs.'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {isStudent && (
            <button
              type="button"
              onClick={() => setActiveTab('baccalaureate')}
              style={{
                background: activeTab === 'baccalaureate' ? 'var(--red-subtle)' : 'var(--bg-elevated)',
                border: `1px solid ${activeTab === 'baccalaureate' ? 'var(--red-border)' : 'var(--glass-border)'}`,
                color: activeTab === 'baccalaureate' ? 'var(--red)' : 'var(--text-secondary)',
                borderRadius: 'var(--r-md)',
                padding: '8px 14px',
                fontSize: '0.84rem',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              📜 1. Baccalaureate (Mandatory)
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('education')}
            style={{
              background: activeTab === 'education' ? 'var(--red-subtle)' : 'var(--bg-elevated)',
              border: `1px solid ${activeTab === 'education' ? 'var(--red-border)' : 'var(--glass-border)'}`,
              color: activeTab === 'education' ? 'var(--red)' : 'var(--text-secondary)',
              borderRadius: 'var(--r-md)',
              padding: '8px 14px',
              fontSize: '0.84rem',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🏛️ {isStudent ? '2. University / Higher Studies' : '🎓 Higher Education'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('general')}
            style={{
              background: activeTab === 'general' ? 'var(--red-subtle)' : 'var(--bg-elevated)',
              border: `1px solid ${activeTab === 'general' ? 'var(--red-border)' : 'var(--glass-border)'}`,
              color: activeTab === 'general' ? 'var(--red)' : 'var(--text-secondary)',
              borderRadius: 'var(--r-md)',
              padding: '8px 14px',
              fontSize: '0.84rem',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            👤 {isStudent ? '3. Personal & CV' : '👤 Personal Info & CV'}
          </button>

          {!isStudent && (
            <button
              type="button"
              onClick={() => setActiveTab('experience')}
              style={{
                background: activeTab === 'experience' ? 'var(--red-subtle)' : 'var(--bg-elevated)',
                border: `1px solid ${activeTab === 'experience' ? 'var(--red-border)' : 'var(--glass-border)'}`,
                color: activeTab === 'experience' ? 'var(--red)' : 'var(--text-secondary)',
                borderRadius: 'var(--r-md)',
                padding: '8px 14px',
                fontSize: '0.84rem',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              💼 Work Experience & Certs
            </button>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* ════ TAB 1: BACCALAUREATE (MANDATORY FOR STUDENTS) ════ */}
          {activeTab === 'baccalaureate' && isStudent && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '14px 18px', background: 'var(--red-subtle)', border: '1px solid var(--red-border)', borderRadius: 'var(--r-md)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '1.5rem' }}>🛡️</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--red-bright)' }}>Baccalaureate Gatekeeper</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    To ensure trust on TuniStudy, students must have graduated with a Tunisian Baccalaureate. You must upload your official diploma or grade transcript proof.
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">High School (Lycée) Name *</label>
                  <input 
                    type="text" 
                    value={bacSchool} 
                    onChange={e => setBacSchool(e.target.value)} 
                    placeholder="e.g. Lycée Pilote Bourguiba Tunis"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Graduation Year (Bac Year) *</label>
                  <input 
                    type="number" 
                    min="1990" 
                    max={new Date().getFullYear()} 
                    value={bacYear} 
                    onChange={e => setBacYear(e.target.value)} 
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Baccalaureate Section / Branch *</label>
                  <select 
                    value={bacSection} 
                    onChange={e => setBacSection(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: 'var(--r-md)', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                  >
                    <option value="Mathématiques">Mathématiques (Math)</option>
                    <option value="Sciences Expérimentales">Sciences Expérimentales (Sciences)</option>
                    <option value="Sciences de l'Informatique">Sciences de l'Informatique (Info)</option>
                    <option value="Sciences Techniques">Sciences Techniques (Technique)</option>
                    <option value="Economie et Gestion">Economie et Gestion (Eco-Gestion)</option>
                    <option value="Lettres">Lettres</option>
                    <option value="Sport">Sport</option>
                    <option value="Autre / International">Autre / International (Bac Français / IB)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Average Score / Mention</label>
                  <input 
                    type="text" 
                    value={bacGrade} 
                    onChange={e => setBacGrade(e.target.value)} 
                    placeholder="e.g. 15.42 (Bien) / Très Bien"
                  />
                </div>
              </div>

              {/* Bac Proof Upload */}
              <div className="form-group">
                <label className="form-label">Official Baccalaureate Proof Document (PDF or Photo) *</label>
                <div style={{
                  padding: '20px',
                  border: '2px dashed var(--glass-border-hover)',
                  borderRadius: 'var(--r-md)',
                  background: bacProofDocUrl ? 'rgba(52, 211, 153, 0.05)' : 'var(--bg-elevated)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                  textAlign: 'center'
                }}>
                  {bacProofDocUrl ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: '#34d399', fontSize: '1.4rem' }}>✓</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#34d399' }}>Baccalaureate Document Attached</div>
                        <a href={bacProofDocUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', color: 'var(--red)' }}>View Attached File ↗</a>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: '1.8rem' }}>📄</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Upload your Bac Diploma, Relevé de Notes, or Attestation de Réussite
                      </div>
                    </>
                  )}

                  <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', marginTop: '6px' }}>
                    {uploadingDoc ? '⏳ Uploading...' : bacProofDocUrl ? '🔄 Replace File' : '📤 Upload Document (PDF/JPG)'}
                    <input 
                      type="file" 
                      accept=".pdf,image/png,image/jpeg,image/webp" 
                      onChange={e => handleFileUpload(e, 'bac')} 
                      style={{ display: 'none' }} 
                      disabled={uploadingDoc}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ════ TAB 2: HIGHER EDUCATION & ONGOING STUDIES ════ */}
          {activeTab === 'education' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', border: '1px solid var(--glass-border)' }}>
                <input 
                  type="checkbox" 
                  id="hasHigherEdu" 
                  checked={hasHigherEdu} 
                  onChange={e => setHasHigherEdu(e.target.checked)} 
                  style={{ width: '18px', height: '18px', accentColor: 'var(--red)' }}
                />
                <label htmlFor="hasHigherEdu" style={{ fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
                  {isStudent ? 'Are you currently studying or enrolled in a University / Institute?' : 'Add Higher Education Degree / Studies'}
                </label>
              </div>

              {hasHigherEdu && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', border: '1px solid var(--glass-border)' }}>
                  <div className="form-group">
                    <label className="form-label">University / School / Institute Name *</label>
                    <input 
                      type="text" 
                      value={eduSchool} 
                      onChange={e => setEduSchool(e.target.value)} 
                      placeholder="e.g. INSAT, ESPRIT, Faculté de Médecine de Tunis, TBS..."
                      required={hasHigherEdu}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="form-group">
                      <label className="form-label">Degree / Level</label>
                      <input 
                        type="text" 
                        value={eduDegree} 
                        onChange={e => setEduDegree(e.target.value)} 
                        placeholder="e.g. Licence 2ème année, Cycle Ingénieur, Master"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Field of Study / Major</label>
                      <input 
                        type="text" 
                        value={eduField} 
                        onChange={e => setEduField(e.target.value)} 
                        placeholder="e.g. Computer Science, Finance, Marketing"
                      />
                    </div>
                  </div>

                  {/* Study Status Radio: Ongoing vs Finished */}
                  <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: 'var(--r-md)', border: '1px solid var(--glass-border)' }}>
                    <label className="form-label" style={{ marginBottom: '8px' }}>Study Status</label>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem' }}>
                        <input 
                          type="radio" 
                          name="studyStatus" 
                          checked={eduIsCurrent} 
                          onChange={() => setEduIsCurrent(true)}
                          style={{ accentColor: 'var(--red)' }}
                        />
                        🟢 Ongoing (Current Academic Year)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem' }}>
                        <input 
                          type="radio" 
                          name="studyStatus" 
                          checked={!eduIsCurrent} 
                          onChange={() => setEduIsCurrent(false)}
                          style={{ accentColor: 'var(--red)' }}
                        />
                        🎓 Completed / Graduated
                      </label>
                    </div>
                  </div>

                  {/* If Finished → Mandatory Graduation File Upload */}
                  {!eduIsCurrent && (
                    <div className="form-group" style={{ marginTop: '8px' }}>
                      <label className="form-label" style={{ color: 'var(--red-bright)' }}>
                        Official Graduation Certificate / Diploma Proof *
                      </label>
                      <div style={{
                        padding: '16px',
                        border: '2px dashed var(--red-border)',
                        borderRadius: 'var(--r-md)',
                        background: 'var(--red-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        textAlign: 'center'
                      }}>
                        {eduGradCertUrl ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: '#34d399', fontSize: '1.2rem' }}>✓</span>
                            <span style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 600 }}>Graduation Certificate Attached</span>
                            <a href={eduGradCertUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', color: 'var(--red)' }}>[View ↗]</a>
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            Upload your official Degree / Attestation de Réussite (PDF or Image)
                          </div>
                        )}

                        <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                          {uploadingDoc ? '⏳ Uploading...' : eduGradCertUrl ? '🔄 Replace Certificate' : '📤 Upload Graduation Proof'}
                          <input 
                            type="file" 
                            accept=".pdf,image/png,image/jpeg,image/webp" 
                            onChange={e => handleFileUpload(e, 'grad')} 
                            style={{ display: 'none' }} 
                            disabled={uploadingDoc}
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ════ TAB 3: PERSONAL INFO & CV ════ */}
          {activeTab === 'general' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="e.g. Slim Ben Salah"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bio / Profile Headline</label>
                <textarea 
                  rows="3" 
                  value={bio} 
                  onChange={e => setBio(e.target.value)} 
                  placeholder="A short summary about your background, ambitions, and focus areas..." 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Key Skills (comma separated)</label>
                  <input 
                    type="text" 
                    value={skills} 
                    onChange={e => setSkills(e.target.value)} 
                    placeholder="e.g. JavaScript, Python, UI/UX, Accounting" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Languages (comma separated)</label>
                  <input 
                    type="text" 
                    value={languages} 
                    onChange={e => setLanguages(e.target.value)} 
                    placeholder="e.g. Arabic, French, English" 
                  />
                </div>
              </div>

              {/* CV File Upload */}
              <div className="form-group">
                <label className="form-label">Curriculum Vitae (CV / Resume Document)</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    value={cvUrl} 
                    onChange={e => setCvUrl(e.target.value)} 
                    placeholder="Paste URL or upload file directly →" 
                    style={{ flex: 1 }}
                  />
                  <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {uploadingDoc ? '⏳ Uploading...' : '📄 Upload CV File'}
                    <input 
                      type="file" 
                      accept=".pdf,image/png,image/jpeg" 
                      onChange={e => handleFileUpload(e, 'cv')} 
                      style={{ display: 'none' }} 
                      disabled={uploadingDoc}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ════ TAB 4: EXPERIENCE (CITIZEN ONLY) ════ */}
          {activeTab === 'experience' && !isStudent && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Recent Company / Employer</label>
                <input 
                  type="text" 
                  value={expCompany} 
                  onChange={e => setExpCompany(e.target.value)} 
                  placeholder="e.g. Telnet, Vermeg, Ooredoo" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Job Title / Position</label>
                <input 
                  type="text" 
                  value={expTitle} 
                  onChange={e => setExpTitle(e.target.value)} 
                  placeholder="e.g. Senior Software Engineer" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Work Summary / Responsibilities</label>
                <textarea 
                  rows="3" 
                  value={expDesc} 
                  onChange={e => setExpDesc(e.target.value)} 
                  placeholder="Key contributions, projects delivered, tools used..." 
                />
              </div>

              {/* Work cert upload */}
              <div className="form-group">
                <label className="form-label">Work Certificate / Attestation de Travail (Optional)</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    value={expCertUrl} 
                    onChange={e => setExpCertUrl(e.target.value)} 
                    placeholder="Certificate URL or upload file →" 
                    style={{ flex: 1 }}
                  />
                  <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {uploadingDoc ? '⏳ Uploading...' : '📜 Upload Proof'}
                    <input 
                      type="file" 
                      accept=".pdf,image/png,image/jpeg" 
                      onChange={e => handleFileUpload(e, 'exp')} 
                      style={{ display: 'none' }} 
                      disabled={uploadingDoc}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={loading || uploadingDoc} className="btn btn-primary">
              {loading ? '⏳ Verifying & Saving...' : '💾 Save & Verify Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfileModal;
