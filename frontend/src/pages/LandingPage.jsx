import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import AppDownloadButtons from '../components/common/AppDownloadButtons';


const STEPS = [
  { 
    icon: (
      <svg className="btn-svg-logo" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ), 
    title: 'Create Account', 
    desc: 'Pick your path — Student or Citizen' 
  },
  { 
    icon: (
      <svg className="btn-svg-logo" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ), 
    title: 'Browse Listings', 
    desc: 'Explore universities, internships, jobs' 
  },
  { 
    icon: (
      <svg className="btn-svg-logo" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ), 
    title: 'Apply Online', 
    desc: 'Submit directly, no office visits' 
  },
  { 
    icon: (
      <svg className="btn-svg-logo" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ), 
    title: 'Get Accepted', 
    desc: 'Track status in real time' 
  },
];

const STATS = [
  { value: '200+', label: 'Universities' },
  { value: '1,500+', label: 'Job Listings' },
  { value: '400+', label: 'Internships' },
  { value: '12,000+', label: 'Users' },
];

export const LandingPage = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <div style={{ background: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}>
      {/* Background Glows */}
      <div style={{
        position: 'absolute', top: '10%', left: '15%', width: '400px', height: '400px',
        background: 'var(--red-glow)', filter: 'blur(150px)', borderRadius: '50%',
        pointerEvents: 'none', zIndex: 0
      }} />
      <div style={{
        position: 'absolute', bottom: '20%', right: '10%', width: '500px', height: '500px',
        background: 'rgba(255, 255, 255, 0.03)', filter: 'blur(130px)', borderRadius: '50%',
        pointerEvents: 'none', zIndex: 0
      }} />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section style={{ padding: '100px 24px 80px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px', alignItems: 'center' }} className="animate-fade-up">
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <span className="badge badge-accent">🇹🇳 Built for Tunisia</span>
            <span className="badge">✦ Free to join</span>
          </div>

          <h1 style={{ lineHeight: 1.05 }}>
            Your gateway to universities,<br />
            <span className="gradient-text">internships & careers in Tunisia.</span>
          </h1>

          <p style={{ fontSize: '1.2rem', maxWidth: '620px', color: 'var(--text-secondary)' }}>
            TuniVerse is Tunisia's all-in-one digital platform. Students apply to top universities and internships. Professionals find jobs and career opportunities — all online.
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '12px' }}>
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg">
                Open Dashboard <span style={{ marginLeft: '4px' }}>→</span>
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">Create Free Account</Link>
                <Link to="/login" className="btn btn-secondary btn-lg">Log In</Link>
              </>
            )}
            <a 
              href="/downloads/tuniverse-app.apk" 
              download="tuniverse-app.apk"
              className="btn btn-secondary btn-lg"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid rgba(225, 29, 72, 0.4)',
                background: 'rgba(225, 29, 72, 0.06)'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--red-bright)' }}>
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                <line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
              <span>Download Android APK</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────── */}
      <section style={{ 
        borderTop: '1px solid var(--glass-border)', 
        borderBottom: '1px solid var(--glass-border)', 
        background: 'var(--bg-surface)',
        position: 'relative',
        zIndex: 1
      }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', padding: '0' }}>
          {STATS.map((s, i) => (
            <div 
              key={i} 
              className="crosshair grid-lines"
              style={{ 
                padding: '36px 24px', 
                textAlign: 'center', 
                borderRight: '1px solid var(--glass-border)',
                borderBottom: '1px solid var(--glass-border)',
                transition: 'background var(--t-base)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              
              <div style={{ 
                fontSize: '2.25rem', 
                fontWeight: 800, 
                fontFamily: 'var(--font-display)', 
                color: '#fff', 
                letterSpacing: '-0.04em' 
              }}>{s.value}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Two Portals ──────────────────────────────────────── */}
      <section style={{ padding: '100px 24px', position: 'relative', zIndex: 1 }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '64px' }} className="animate-fade-up">
            <div className="section-label">Two Portals, One Platform</div>
            <h2 style={{ marginTop: '16px' }}>Built for every stage of your career</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '32px' }}>
            
            {/* TuniVerse Academic Hub Card */}
            <div 
              className="card card-3d grid-lines" 
              style={{ padding: '48px', display: 'flex', flexDirection: 'column', gap: '24px' }}
            >

              <div 
                className="logo-container"
                style={{ 
                  width: '56px', height: '56px', borderRadius: '16px', 
                  background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <svg 
                  className="btn-svg-logo" 
                  width="26" 
                  height="26" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
              
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--red)', marginBottom: '8px' }}>
                  Students & Higher Education
                </div>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Academic Hub</h3>
                <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>
                  Browse accredited university programs, upload your academic documents, and apply entirely online. No in-person visits required.
                </p>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                {['Explore 200+ university courses', 'Upload CV and transcripts digitally', 'Apply for internships (stages)', 'Real-time application tracking'].map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <span style={{ 
                      width: '20px', height: '20px', borderRadius: '50%', 
                      background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      fontSize: '0.7rem', color: 'var(--red)', flexShrink: 0 
                    }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              
              <Link to="/register?role=student" className="btn btn-primary" style={{ justifyContent: 'center', marginTop: 'auto' }}>
                Start Academic Journey →
              </Link>
            </div>

            {/* TuniVerse Career Centre Card */}
            <div 
              className="card card-3d grid-lines" 
              style={{ padding: '48px', display: 'flex', flexDirection: 'column', gap: '24px' }}
            >

              <div 
                className="logo-container"
                style={{ 
                  width: '56px', height: '56px', borderRadius: '16px', 
                  background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <svg 
                  className="btn-svg-logo" 
                  width="26" 
                  height="26" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--red)', marginBottom: '8px' }}>
                  Professionals & Recruiters
                </div>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Career Centre</h3>
                <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>
                  Find remote, hybrid, or office jobs in Tunisia. Recruiters can post listings and review candidate profiles with verified credentials.
                </p>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                {['Browse remote-first job listings', 'Apply with your digital CV', 'Post jobs as an approved recruiter', 'Direct inquiries and candidate pipeline'].map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <span style={{ 
                      width: '20px', height: '20px', borderRadius: '50%', 
                      background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      fontSize: '0.7rem', color: 'var(--red)', flexShrink: 0 
                    }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link to="/register?role=citizen" className="btn btn-secondary" style={{ justifyContent: 'center', marginTop: 'auto' }}>
                Start Career Journey →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────── */}
      <section style={{ 
        padding: '100px 24px', 
        background: 'var(--bg-surface)', 
        borderTop: '1px solid var(--glass-border)',
        borderBottom: '1px solid var(--glass-border)',
        position: 'relative',
        zIndex: 1
      }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div className="section-label">Simple Process</div>
            <h2 style={{ marginTop: '16px' }}>Applying is as easy as 1 → 2 → 3 → 4</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
            {STEPS.map((step, i) => (
              <div 
                key={i} 
                className="card crosshair"
                style={{ 
                  textAlign: 'center', 
                  padding: '40px 24px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '16px', 
                  alignItems: 'center' 
                }}
              >

                <div style={{ 
                  width: '56px', height: '56px', borderRadius: '14px', 
                  background: 'var(--bg-raised)', border: '1px solid var(--glass-border)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontSize: '1.5rem', boxShadow: 'var(--shadow-sm)' 
                }}>{step.icon}</div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--red)', letterSpacing: '0.08em' }}>STEP {i + 1}</div>
                <h4 style={{ fontSize: '1.15rem', color: 'var(--text-primary)' }}>{step.title}</h4>
                <p style={{ fontSize: '0.85rem', margin: 0, color: 'var(--text-secondary)' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Android Mobile App Showcase ─────────────────────── */}
      <section style={{ 
        padding: '80px 24px', 
        position: 'relative', 
        zIndex: 1,
        borderBottom: '1px solid var(--glass-border)'
      }}>
        <div className="container">
          <div 
            className="card card-3d" 
            style={{ 
              padding: '48px 36px', 
              background: 'linear-gradient(135deg, rgba(225, 29, 72, 0.08) 0%, rgba(20, 20, 25, 0.95) 100%)',
              border: '1px solid rgba(225, 29, 72, 0.3)',
              borderRadius: 'var(--r-xl)',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '36px'
            }}
          >
            <div style={{ flex: '1 1 450px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-accent">📱 Native Mobile Experience</span>
                <span className="badge">Android & iOS</span>
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>
                Take TuniVerse wherever you go.
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>
                Get instant push alerts for application updates, scan and upload your Baccalaureate proof directly with your camera, and book video interviews on the go.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '6px' }}>
                {[
                  'Instant push notifications',
                  '1-tap document scan & upload',
                  'Video interview launcher',
                  'Offline profile caching'
                ].map((feat, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--red-bright)', fontWeight: 800 }}>✓</span>
                    {feat}
                  </div>
                ))}
              </div>

              {/* ── Smart OS-Aware Download Buttons ───────────────── */}
              <div style={{ marginTop: '12px' }}>
                <AppDownloadButtons size="lg" showBothOnDesktop={true} />
              </div>
            </div>


            {/* Mobile Visual Mockup Card */}
            <div style={{ 
              flex: '0 0 260px', 
              margin: '0 auto',
              background: 'var(--bg-raised)', 
              border: '2px solid var(--glass-border)', 
              borderRadius: '32px', 
              padding: '20px 16px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <div style={{ width: '48px', height: '4px', background: 'var(--text-muted)', borderRadius: '4px', margin: '0 auto' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--red)' }}>TuniVerse</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>100%</span>
              </div>
              <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', padding: '16px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>Application Accepted!</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>ESPRIT University accepted your file.</div>
                <span className="badge badge-success" style={{ alignSelf: 'flex-start', fontSize: '0.65rem' }}>Ready to Enroll</span>
              </div>
              <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', padding: '16px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>Interview Invitation</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>InstaDeep booked a meeting.</div>
                <span className="badge badge-accent" style={{ alignSelf: 'flex-start', fontSize: '0.65rem' }}>Join Google Meet</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section style={{ padding: '120px 24px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }} className="animate-fade-up">
          <h2>Ready to get started?</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>Join thousands of Tunisian students and professionals who manage their entire academic and career journey online.</p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' }}>
            <Link to="/register" className="btn btn-primary btn-lg">Create Free Account</Link>
            <Link to="/login" className="btn btn-secondary btn-lg">I Already Have an Account</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
