import React, { useState } from 'react';
import { getDeviceOS } from '../../utils/deviceDetect';

const APK_URL        = '/downloads/tuniverse-app.apk';
const IOS_SAFARI_URL = 'https://tunistudy.up.railway.app';
const TESTFLIGHT_URL = null; // Set when TestFlight is ready

/* ─── iOS Installation Guide Modal ─────────────────────────────────────────── */
function IOSInstallModal({ onClose }) {
  const steps = [
    {
      num: '01',
      title: 'Open in Safari',
      desc: 'TuniVerse works as a native app via Safari. Open this page in Safari on your iPhone or iPad.',
    },
    {
      num: '02',
      title: 'Tap Share',
      desc: 'At the bottom of Safari, tap the Share button — the box with an upward arrow.',
    },
    {
      num: '03',
      title: 'Add to Home Screen',
      desc: 'Scroll the share sheet and tap "Add to Home Screen", then tap Add to confirm.',
    },
    {
      num: '04',
      title: 'Launch TuniVerse',
      desc: 'Your TuniVerse icon appears on your home screen. Tap it anytime for a full native experience.',
    },
  ];

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', boxSizing: 'border-box',
      }}
    >
      <div style={{
        width: '100%', maxWidth: '480px',
        background: 'var(--bg-surface, #111)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 30px 80px rgba(0,0,0,0.9)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>

        {/* Header */}
        <div style={{
          padding: '28px 28px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
              background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="var(--text-primary, #f0f0f0)">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted, #666)', marginBottom: '3px' }}>
                iOS Installation
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary, #f0f0f0)' }}>
                Install on iPhone & iPad
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '50%', width: '34px', height: '34px',
              cursor: 'pointer', color: 'var(--text-secondary, #a0a0a0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Steps */}
        <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: '0' }}>
          {steps.map((step, idx) => (
            <div key={idx} style={{
              display: 'flex', gap: '16px',
              paddingBottom: idx < steps.length - 1 ? '0' : '0',
              position: 'relative',
            }}>
              {/* Timeline connector */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: idx === 0 ? 'var(--red, #e11d48)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${idx === 0 ? 'var(--red, #e11d48)' : 'rgba(255,255,255,0.1)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 800,
                  color: idx === 0 ? '#fff' : 'var(--text-muted, #666)',
                  letterSpacing: '0.02em',
                }}>
                  {step.num}
                </div>
                {idx < steps.length - 1 && (
                  <div style={{
                    width: '1px', flex: 1, minHeight: '24px',
                    background: 'linear-gradient(to bottom, rgba(225,29,72,0.3), rgba(255,255,255,0.06))',
                    margin: '4px 0',
                  }} />
                )}
              </div>
              {/* Content */}
              <div style={{ paddingBottom: idx < steps.length - 1 ? '20px' : '0', paddingTop: '6px' }}>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary, #f0f0f0)', marginBottom: '4px' }}>
                  {step.title}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #a0a0a0)', lineHeight: 1.55 }}>
                  {step.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ padding: '16px 28px 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {TESTFLIGHT_URL ? (
            <a href={TESTFLIGHT_URL} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '14px 20px', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem',
                background: 'var(--red, #e11d48)', color: '#fff',
                border: 'none', cursor: 'pointer', textDecoration: 'none',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Download via TestFlight
            </a>
          ) : (
            <a href={IOS_SAFARI_URL} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '14px 20px', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem',
                background: 'var(--red, #e11d48)', color: '#fff',
                border: 'none', cursor: 'pointer', textDecoration: 'none',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Open TuniVerse in Safari
            </a>
          )}
          <button onClick={onClose}
            style={{
              background: 'transparent', border: 'none',
              color: 'var(--text-muted, #666)', fontSize: '0.78rem',
              fontWeight: 600, cursor: 'pointer', padding: '6px',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary, #a0a0a0)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted, #666)'}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Export: OS-Aware Download Buttons ────────────────────────────────── */
export default function AppDownloadButtons({ size = 'md', showBothOnDesktop = true }) {
  const [showIOSModal, setShowIOSModal] = useState(false);
  const os = getDeviceOS();

  const pad   = size === 'lg' ? '14px 22px' : '11px 18px';
  const fs    = size === 'lg' ? '0.92rem'   : '0.84rem';
  const icoSz = size === 'lg' ? 20           : 17;

  const AndroidBtn = () => (
    <a
      href={APK_URL}
      download="tuniverse-app.apk"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '10px',
        padding: pad, fontSize: fs, fontWeight: 700,
        borderRadius: '12px', textDecoration: 'none',
        background: 'var(--red, #e11d48)', color: '#fff',
        border: '1px solid rgba(225,29,72,0.5)',
        boxShadow: '0 4px 20px rgba(225,29,72,0.25)',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(225,29,72,0.35)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 20px rgba(225,29,72,0.25)'; }}
    >
      {/* Download arrow icon */}
      <svg width={icoSz} height={icoSz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      <span>Download for Android</span>
      <span style={{
        fontSize: '0.65rem', fontWeight: 800, opacity: 0.75,
        background: 'rgba(0,0,0,0.2)', padding: '2px 6px',
        borderRadius: '5px', letterSpacing: '0.04em',
      }}>APK</span>
    </a>
  );

  const IOSBtn = () => (
    <button
      onClick={() => setShowIOSModal(true)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '10px',
        padding: pad, fontSize: fs, fontWeight: 700,
        borderRadius: '12px', cursor: 'pointer',
        background: 'transparent', color: 'var(--text-primary, #f0f0f0)',
        border: '1px solid rgba(255,255,255,0.15)',
        transition: 'background 0.15s, border-color 0.15s, transform 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = ''; }}
    >
      <svg width={icoSz} height={icoSz} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
      <span>Download for iOS</span>
      <span style={{
        fontSize: '0.65rem', fontWeight: 800, opacity: 0.6,
        background: 'rgba(255,255,255,0.08)', padding: '2px 6px',
        borderRadius: '5px', letterSpacing: '0.04em',
      }}>iPhone / iPad</span>
    </button>
  );

  return (
    <>
      {showIOSModal && <IOSInstallModal onClose={() => setShowIOSModal(false)} />}

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        {os === 'ios'     && <IOSBtn />}
        {os === 'android' && <AndroidBtn />}
        {os === 'desktop' && showBothOnDesktop && (
          <>
            <AndroidBtn />
            <IOSBtn />
          </>
        )}
      </div>

      {/* Subtle auto-detected label */}
      <div style={{
        marginTop: '10px', fontSize: '0.71rem',
        color: 'var(--text-muted, #555)',
        display: 'flex', alignItems: 'center', gap: '5px',
      }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        {os === 'ios'     && 'iPhone / iPad detected'}
        {os === 'android' && 'Android device detected'}
        {os === 'desktop' && 'Available for Android & iOS'}
      </div>
    </>
  );
}
