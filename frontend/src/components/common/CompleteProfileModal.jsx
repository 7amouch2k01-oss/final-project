import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

export const CompleteProfileModal = ({ isOpen, onClose }) => {
  const { user, setUser } = useAuthStore();
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
  const [bacSection, setBacSection] = useState(bac.section || 'Sciences de l\'Informatique');
  const [bacGrade, setBacGrade] = useState(bac.grade || '');
  const [bacProofDocUrl, setBacProofDocUrl] = useState(bac.proofDocUrl || '');

  // ── Flexible Post-Baccalaureate / Higher Education ────────────
  // Options: 'university', 'formation', 'other', 'none'
  const firstEdu = user?.education?.[0] || {};
  const initialPath = user?.postBacPath || (firstEdu.school ? 'university' : user?.formationDetails?.instituteName ? 'formation' : 'none');
  const [postBacChoice, setPostBacChoice] = useState(initialPath);

  // 1. University details
  const [eduSchool, setEduSchool] = useState(firstEdu.school || '');
  const [eduDegree, setEduDegree] = useState(firstEdu.degree || '');
  const [eduField, setEduField] = useState(firstEdu.field || '');
  const [eduIsCurrent, setEduIsCurrent] = useState(firstEdu.isCurrent !== undefined ? firstEdu.isCurrent : true);
  const [eduGradCertUrl, setEduGradCertUrl] = useState(firstEdu.graduationCertUrl || '');

  // 2. Formation Professionnelle details
  const formation = user?.formationDetails || {};
  const [formationInstitute, setFormationInstitute] = useState(formation.instituteName || '');
  const [formationProgram, setFormationProgram] = useState(formation.programName || '');
  const [formationCertUrl, setFormationCertUrl] = useState(formation.certUrl || '');

  // 3. Other details
  const other = user?.otherDetails || {};
  const [otherDescription, setOtherDescription] = useState(other.description || '');
  const [otherDocUrl, setOtherDocUrl] = useState(other.proofDocUrl || '');

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

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', type === 'bac' ? 'bac_proofs' : type === 'grad' ? 'graduation_certs' : type === 'formation' ? 'formation_certs' : 'documents');

    setUploadingDoc(true);
    try {
      const res = await api.post('/users/upload-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data.data.url;

      if (type === 'bac') {
        setBacProofDocUrl(url);
        toast.success('Baccalaureate proof document uploaded successfully.');
      } else if (type === 'grad') {
        setEduGradCertUrl(url);
        toast.success('Graduation certificate uploaded.');
      } else if (type === 'formation') {
        setFormationCertUrl(url);
        toast.success('Formation certificate uploaded.');
      } else if (type === 'other') {
        setOtherDocUrl(url);
        toast.success('Supporting document uploaded.');
      } else if (type === 'cv') {
        setCvUrl(url);
        toast.success('CV / Resume document uploaded.');
      } else if (type === 'exp') {
        setExpCertUrl(url);
        toast.success('Experience proof certificate uploaded.');
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

    if (isStudent) {
      if (!bacSchool.trim() || !bacYear || !bacSection || !bacProofDocUrl) {
        toast.error('Baccalaureate details and official proof document upload are required.');
        setActiveTab('baccalaureate');
        return;
      }
      if (postBacChoice === 'university' && !eduIsCurrent && !eduGradCertUrl) {
        toast.error('If your higher study is completed, please upload your graduation certificate.');
        setActiveTab('education');
        return;
      }
    }

    if (!cvUrl.trim()) {
      toast.error('Please upload your CV / Resume document to complete your profile.');
      setActiveTab('general');
      return;
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
        isProfileComplete: true,
        postBacPath: postBacChoice,
        baccalaureate: {
          school: bacSchool,
          year: Number(bacYear),
          section: bacSection,
          grade: bacGrade,
          proofDocUrl: bacProofDocUrl,
          isVerified: !!bacProofDocUrl,
        },
        education: postBacChoice === 'university' && eduSchool.trim() ? [{
          school: eduSchool,
          degree: eduDegree,
          field: eduField,
          isCurrent: eduIsCurrent,
          graduationCertUrl: eduIsCurrent ? '' : eduGradCertUrl,
        }] : [],
        formationDetails: postBacChoice === 'formation' ? {
          instituteName: formationInstitute,
          programName: formationProgram,
          certUrl: formationCertUrl,
        } : {},
        otherDetails: postBacChoice === 'other' ? {
          description: otherDescription,
          proofDocUrl: otherDocUrl,
        } : {},
        experience: expCompany.trim() ? [{
          company: expCompany,
          title: expTitle,
          description: expDesc,
          certUrl: expCertUrl,
        }] : [],
      };

      const res = await api.patch('/users', updateData);
      setUser(res.data.data.user);
      toast.success('Profile completed to 100% and verified!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div 
        className="modal" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '720px', maxHeight: '92vh', overflowY: 'auto', padding: '32px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
          <div>
            <div className="section-label">Verified Profile Hub</div>
            <h3 style={{ fontSize: '1.4rem', margin: '4px 0 0', fontWeight: 700 }}>
              {isStudent ? 'Student & Academic Verification' : 'Professional Profile Verification'}
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              {isStudent 
                ? 'Upload your Baccalaureate proof and choose your academic or vocational path to reach 100%.'
                : 'Complete your credentials and CV to unlock full dashboard privileges.'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.4rem', cursor: 'pointer' }}
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
              1. Baccalaureate (Required)
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
            {isStudent ? '2. Post-Bac Path (Flexible)' : 'Education & Training'}
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
            {isStudent ? '3. Personal Info & CV' : 'Personal Info & CV'}
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
              Work Experience
            </button>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* ════ TAB 1: BACCALAUREATE (REQUIRED FOR STUDENTS) ════ */}
          {activeTab === 'baccalaureate' && isStudent && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '14px 18px', background: 'var(--red-subtle)', border: '1px solid var(--red-border)', borderRadius: 'var(--r-md)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--red)' }}>Tunisian Baccalaureate Verification</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Please supply your high school graduation details and upload your diploma or grade transcript copy.
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
                      <span style={{ color: '#10b981', fontWeight: 700 }}>[Document Attached]</span>
                      <a href={bacProofDocUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--red)', fontWeight: 600 }}>View File</a>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                      Upload your Bac Diploma, Relevé de Notes, or Attestation de Réussite
                    </div>
                  )}

                  <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', marginTop: '6px' }}>
                    {uploadingDoc ? 'Uploading...' : bacProofDocUrl ? 'Replace File' : 'Upload Document (PDF/JPG)'}
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

          {/* ════ TAB 2: FLEXIBLE POST-BAC PATH ════ */}
          {activeTab === 'education' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ padding: '14px 18px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px' }}>
                  What are you currently doing after the Baccalaureate?
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                  You do not need to attend university to complete your profile. Select your exact track below to reach 100%.
                </p>
              </div>

              {/* Radio Selector for Post-Bac Track */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                {[
                  { id: 'university', label: 'University / Faculty', desc: 'Higher education degree' },
                  { id: 'formation', label: 'Formation / Training', desc: 'Vocational institute / BTP / BTS' },
                  { id: 'other', label: 'Other Activities', desc: 'Certifications / Freelance' },
                  { id: 'none', label: 'None / Self-study', desc: 'Direct career search' },
                ].map(opt => (
                  <div
                    key={opt.id}
                    onClick={() => setPostBacChoice(opt.id)}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--r-md)',
                      background: postBacChoice === opt.id ? 'var(--red-subtle)' : 'var(--bg-elevated)',
                      border: `1px solid ${postBacChoice === opt.id ? 'var(--red-border)' : 'var(--glass-border)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="radio" 
                        name="postBacChoice" 
                        checked={postBacChoice === opt.id} 
                        onChange={() => setPostBacChoice(opt.id)}
                        style={{ accentColor: 'var(--red)' }}
                      />
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: postBacChoice === opt.id ? 'var(--red)' : 'var(--text-primary)' }}>
                        {opt.label}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '6px 0 0 20px' }}>
                      {opt.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* Path 1: University */}
              {postBacChoice === 'university' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', border: '1px solid var(--glass-border)' }}>
                  <div className="form-group">
                    <label className="form-label">University / Faculty Name *</label>
                    <input 
                      type="text" 
                      value={eduSchool} 
                      onChange={e => setEduSchool(e.target.value)} 
                      placeholder="e.g. INSAT, ESPRIT, Faculté des Sciences de Tunis, TBS..."
                      required
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
                      <label className="form-label">Field of Study</label>
                      <input 
                        type="text" 
                        value={eduField} 
                        onChange={e => setEduField(e.target.value)} 
                        placeholder="e.g. Computer Science, Finance, Marketing"
                      />
                    </div>
                  </div>

                  <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: 'var(--r-md)', border: '1px solid var(--glass-border)' }}>
                    <label className="form-label" style={{ marginBottom: '8px' }}>Study Status</label>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <input 
                          type="radio" 
                          name="studyStatus" 
                          checked={eduIsCurrent} 
                          onChange={() => setEduIsCurrent(true)}
                          style={{ accentColor: 'var(--red)' }}
                        />
                        Ongoing Studies
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <input 
                          type="radio" 
                          name="studyStatus" 
                          checked={!eduIsCurrent} 
                          onChange={() => setEduIsCurrent(false)}
                          style={{ accentColor: 'var(--red)' }}
                        />
                        Graduated / Completed
                      </label>
                    </div>
                  </div>

                  {!eduIsCurrent && (
                    <div className="form-group">
                      <label className="form-label">Graduation Certificate Proof *</label>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                          {uploadingDoc ? 'Uploading...' : eduGradCertUrl ? 'Replace Certificate' : 'Upload Graduation Proof'}
                          <input type="file" accept=".pdf,image/*" onChange={e => handleFileUpload(e, 'grad')} style={{ display: 'none' }} />
                        </label>
                        {eduGradCertUrl && <span style={{ fontSize: '0.8rem', color: '#10b981' }}>Certificate Attached</span>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Path 2: Formation Professionnelle */}
              {postBacChoice === 'formation' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', border: '1px solid var(--glass-border)' }}>
                  <div className="form-group">
                    <label className="form-label">Training Center / Institute (Centre de Formation) *</label>
                    <input 
                      type="text" 
                      value={formationInstitute} 
                      onChange={e => setFormationInstitute(e.target.value)} 
                      placeholder="e.g. GoMyCode, CSFIA Ariana, ATFP Sousse..."
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Program / Speciality *</label>
                    <input 
                      type="text" 
                      value={formationProgram} 
                      onChange={e => setFormationProgram(e.target.value)} 
                      placeholder="e.g. Full-Stack Web Development, Data Analytics, Design..."
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Formation Certificate / Proof (Optional)</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                        {uploadingDoc ? 'Uploading...' : formationCertUrl ? 'Replace Certificate' : 'Upload Formation Document'}
                        <input type="file" accept=".pdf,image/*" onChange={e => handleFileUpload(e, 'formation')} style={{ display: 'none' }} />
                      </label>
                      {formationCertUrl && <span style={{ fontSize: '0.8rem', color: '#10b981' }}>Document Attached</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* Path 3: Other */}
              {postBacChoice === 'other' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', border: '1px solid var(--glass-border)' }}>
                  <div className="form-group">
                    <label className="form-label">Describe what you are currently doing / learning</label>
                    <textarea 
                      rows="3" 
                      value={otherDescription} 
                      onChange={e => setOtherDescription(e.target.value)} 
                      placeholder="e.g. Self-studying programming and UI design, participating in online certifications..."
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Attach Supporting Document (Optional)</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                        {uploadingDoc ? 'Uploading...' : otherDocUrl ? 'Replace Document' : 'Upload File'}
                        <input type="file" accept=".pdf,image/*" onChange={e => handleFileUpload(e, 'other')} style={{ display: 'none' }} />
                      </label>
                      {otherDocUrl && <span style={{ fontSize: '0.8rem', color: '#10b981' }}>File Attached</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* Path 4: None */}
              {postBacChoice === 'none' && (
                <div style={{ padding: '16px', background: 'rgba(52, 211, 153, 0.05)', borderRadius: 'var(--r-md)', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#10b981' }}>
                    Profile will be completed to 100%
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                    No higher education degree is required. Once your Baccalaureate certificate, CV, and core skills are saved in step 3, your profile verification will reach 100%.
                  </p>
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
                <label className="form-label">Bio / Profile Summary</label>
                <textarea 
                  rows="3" 
                  value={bio} 
                  onChange={e => setBio(e.target.value)} 
                  placeholder="A short summary about your background, ambitions, and focus areas..." 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Key Skills (comma separated) *</label>
                  <input 
                    type="text" 
                    value={skills} 
                    onChange={e => setSkills(e.target.value)} 
                    placeholder="e.g. React, Node.js, UI/UX, Python" 
                    required
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

              {/* CV File Upload (Required for 100%) */}
              <div className="form-group">
                <label className="form-label">Curriculum Vitae (CV / Resume Document) *</label>
                <div style={{
                  padding: '16px',
                  border: '2px dashed var(--glass-border-hover)',
                  borderRadius: 'var(--r-md)',
                  background: cvUrl ? 'rgba(52, 211, 153, 0.05)' : 'var(--bg-elevated)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div>
                    {cvUrl ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.88rem' }}>Profile CV Attached</span>
                        <a href={cvUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', color: 'var(--red)', fontWeight: 600 }}>[View File]</a>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                        Upload your CV (PDF or Word) to auto-attach on all future applications.
                      </div>
                    )}
                  </div>
                  <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                    {uploadingDoc ? 'Uploading...' : cvUrl ? 'Replace CV' : 'Upload CV File'}
                    <input 
                      type="file" 
                      accept=".pdf,image/png,image/jpeg,.doc,.docx" 
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

              <div className="form-group">
                <label className="form-label">Work Certificate / Attestation de Travail (Optional)</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                    {uploadingDoc ? 'Uploading...' : expCertUrl ? 'Replace Certificate' : 'Upload Proof'}
                    <input type="file" accept=".pdf,image/*" onChange={e => handleFileUpload(e, 'exp')} style={{ display: 'none' }} />
                  </label>
                  {expCertUrl && <span style={{ fontSize: '0.8rem', color: '#10b981' }}>Certificate Attached</span>}
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
              {loading ? 'Saving Profile...' : 'Save & Complete Profile (100%)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfileModal;

/**
 * Universal SVG Vector and Brand Logos for Tunisian Institutions & Companies
 * Guarantees 100% reliable rendering without broken external CDN hotlinks.
 */
export const getInstitutionLogoSvg = (nameOrTitle = '', company = '') => {
  const query = `${nameOrTitle} ${company}`.toLowerCase();

  // 1. ESPRIT
  if (query.includes('esprit')) {
    return (
      <svg viewBox="0 0 100 100" width="100%" height="100%" fill="currentColor">
        <path d="M20 20 H80 V32 H34 V44 H70 V56 H34 V68 H80 V80 H20 Z" />
      </svg>
    );
  }

  // 2. INSAT / Carthage
  if (query.includes('insat') || query.includes('carthage')) {
    return (
      <svg viewBox="0 0 24 24" width="65%" height="65%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    );
  }

  // 3. ENIT / ENIS / ENSI / Public Engineering
  if (query.includes('enit') || query.includes('enis') || query.includes('ensi') || query.includes('polytechnique')) {
    return (
      <svg viewBox="0 0 24 24" width="65%" height="65%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    );
  }

  // 4. SMU / MSB / Mediterranean School of Business
  if (query.includes('msb') || query.includes('smu') || query.includes('mediterranean school')) {
    return (
      <svg viewBox="0 0 24 24" width="65%" height="65%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12l2 2 4-4" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </svg>
    );
  }

  // 5. TEK-UP / Sesame / Technology Universities
  if (query.includes('tek-up') || query.includes('tekup') || query.includes('sesame')) {
    return (
      <svg viewBox="0 0 24 24" width="65%" height="65%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    );
  }

  // 6. InstaDeep (AI, Deep Learning)
  if (query.includes('instadeep') || query.includes('ai research') || query.includes('deep learning')) {
    return (
      <svg viewBox="0 0 24 24" width="65%" height="65%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <rect x="9" y="9" width="6" height="6" />
        <line x1="9" y1="1" x2="9" y2="4" />
        <line x1="15" y1="1" x2="15" y2="4" />
        <line x1="9" y1="20" x2="9" y2="23" />
        <line x1="15" y1="20" x2="15" y2="23" />
        <line x1="20" y1="9" x2="23" y2="9" />
        <line x1="20" y1="14" x2="23" y2="14" />
        <line x1="1" y1="9" x2="4" y2="9" />
        <line x1="1" y1="14" x2="4" y2="14" />
      </svg>
    );
  }

  // 7. Vermeg (Fintech, Banking Solutions)
  if (query.includes('vermeg') || query.includes('fintech')) {
    return (
      <svg viewBox="0 0 100 100" width="80%" height="80%" fill="currentColor">
        <path d="M15 25 L45 80 L55 80 L85 25 L70 25 L50 63 L30 25 Z" />
      </svg>
    );
  }

  // 8. Orange / Orange Digital Center
  if (query.includes('orange')) {
    return (
      <svg viewBox="0 0 100 100" width="80%" height="80%" fill="currentColor">
        <rect x="10" y="10" width="80" height="80" rx="10" />
        <rect x="25" y="55" width="50" height="16" fill="rgba(255,255,255,0.9)" />
      </svg>
    );
  }

  // 9. BIAT / Banks / Financial
  if (query.includes('biat') || query.includes('bank') || query.includes('finance')) {
    return (
      <svg viewBox="0 0 24 24" width="65%" height="65%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="21" x2="21" y2="21" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <polyline points="5 6 12 3 19 6" />
        <line x1="4" y1="10" x2="4" y2="21" />
        <line x1="20" y1="10" x2="20" y2="21" />
        <line x1="8" y1="14" x2="8" y2="17" />
        <line x1="12" y1="14" x2="12" y2="17" />
        <line x1="16" y1="14" x2="16" y2="17" />
      </svg>
    );
  }

  // 10. Satoripop (Design, Flutter, Mobile)
  if (query.includes('satoripop') || query.includes('flutter') || query.includes('mobile')) {
    return (
      <svg viewBox="0 0 24 24" width="65%" height="65%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    );
  }

  // 11. Telnet Group (Aerospace, Embedded, IoT)
  if (query.includes('telnet') || query.includes('embedded') || query.includes('iot')) {
    return (
      <svg viewBox="0 0 24 24" width="65%" height="65%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="2" />
        <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
      </svg>
    );
  }

  return null;
};

/**
 * Smart Logo Component: Renders real image if provided, or brand vector SVG fallback
 */
export const BrandLogo = ({ logoUrl, name = '', company = '', className = '', style = {} }) => {
  const [imageError, setImageError] = React.useState(false);
  const brandSvg = getInstitutionLogoSvg(name, company);
  const initials = (name || company || 'TN').substring(0, 2).toUpperCase();

  if (logoUrl && !imageError) {
    return (
      <img
        className={className || 'logo-bw'}
        src={logoUrl}
        alt={name || company}
        onError={() => setImageError(true)}
        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px', ...style }}
      />
    );
  }

  if (brandSvg) {
    return (
      <div 
        className={className || 'btn-svg-logo'} 
        style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'currentColor', ...style }}
      >
        {brandSvg}
      </div>
    );
  }

  return (
    <div 
      className="logo-badge" 
      style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.82rem', ...style }}
    >
      {initials}
    </div>
  );
};
