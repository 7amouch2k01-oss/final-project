import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const STEPS = [
  { icon: '📝', title: 'Create Account', desc: 'Pick your path — Student or Citizen' },
  { icon: '🔍', title: 'Browse Listings', desc: 'Explore universities, internships, jobs' },
  { icon: '📤', title: 'Apply Online', desc: 'Submit directly, no office visits' },
  { icon: '✅', title: 'Get Accepted', desc: 'Track status in real time' },
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
            Apply to universities & jobs<br />
            <span className="gradient-text">without leaving your home.</span>
          </h1>

          <p style={{ fontSize: '1.2rem', maxWidth: '620px', color: 'var(--text-secondary)' }}>
            TuniStudy connects students with top Tunisian universities. TuniJob connects graduates and recruiters for remote and office careers.
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
            
            {/* TuniStudy Portal Card */}
            <div 
              className="card card-3d grid-lines" 
              style={{ padding: '48px', display: 'flex', flexDirection: 'column', gap: '24px' }}
            >

              <div style={{ 
                width: '56px', height: '56px', borderRadius: '16px', 
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem',
                boxShadow: 'var(--shadow-sm)'
              }}>🎓</div>
              
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--red)', marginBottom: '8px' }}>
                  For Students
                </div>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800 }}>TuniStudy</h3>
                <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>
                  Browse accredited university programs, upload your documents, and apply entirely online. No in-person visits required.
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

            {/* TuniJob Portal Card */}
            <div 
              className="card card-3d grid-lines" 
              style={{ padding: '48px', display: 'flex', flexDirection: 'column', gap: '24px' }}
            >

              <div style={{ 
                width: '56px', height: '56px', borderRadius: '16px', 
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem',
                boxShadow: 'var(--shadow-sm)'
              }}>💼</div>

              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--red)', marginBottom: '8px' }}>
                  For Citizens
                </div>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800 }}>TuniJob</h3>
                <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>
                  Find remote, hybrid, or office jobs in Tunisia. Recruiters can post listings and review candidate profiles under a quick admin approval.
                </p>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                {['Browse remote-first job listings', 'Apply with your digital CV', 'Post jobs as an approved recruiter', 'Premium placement with Stripe checkout'].map(f => (
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
