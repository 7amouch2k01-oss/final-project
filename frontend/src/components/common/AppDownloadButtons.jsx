import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getDeviceOS } from '../../utils/deviceDetect';

const APK_URL        = '/downloads/tuniverse-app.apk';
const IOS_SAFARI_URL = 'https://tunistudy.up.railway.app';
const TESTFLIGHT_URL = null; // Set when TestFlight is ready

/* ─── iOS Installation Guide Modal (Rendered via React Portal onto document.body) ─── */
function IOSInstallModal({ onClose }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Prevent body scrolling while modal is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  if (!mounted) return null;

  const steps = [
    {
      num: '01',
      title: 'Open in Safari',
      desc: 'TuniVerse installs instantly as a native standalone app via Safari on iPhone & iPad.',
    },
    {
      num: '02',
      title: 'Tap the Share Button',
      desc: 'At the bottom toolbar of Safari, tap the Share icon (square with upward arrow).',
    },
    {
      num: '03',
      title: 'Select "Add to Home Screen"',
      desc: 'Scroll down the actions list and tap "Add to Home Screen", then tap "Add" on top right.',
    },
    {
      num: '04',
      title: 'Launch TuniVerse App',
      desc: 'The TuniVerse icon will appear on your home screen. Tap it anytime for full native performance.',
    },
  ];

  const modalContent = (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 999999,
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      <div 
        className="card glass animate-scale-up"
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'var(--bg-surface, #121216)',
          border: '1px solid var(--glass-border, rgba(255,255,255,0.12))',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.95), 0 0 30px rgba(225, 29, 72, 0.15)',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '24px 24px 18px',
          borderBottom: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'var(--bg-raised, #1c1c22)',
              border: '1px solid var(--glass-border, rgba(255,255,255,0.12))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary, #fff)',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--red, #e11d48)' }}>
                Apple iOS
              </div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary, #f0f0f0)' }}>
                Install on iPhone & iPad
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-raised, rgba(255,255,255,0.06))',
              border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              color: 'var(--text-secondary, #a0a0a0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Steps List */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {steps.map((step, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start',
                background: 'var(--bg-elevated, #17171d)',
                border: '1px solid var(--glass-border, rgba(255,255,255,0.06))',
                borderRadius: '14px',
                padding: '12px 14px',
              }}
            >
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: idx === 0 ? 'var(--red, #e11d48)' : 'rgba(255,255,255,0.08)',
                color: idx === 0 ? '#fff' : 'var(--text-secondary, #a0a0a0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.72rem',
                fontWeight: 800,
                flexShrink: 0,
              }}>
                {step.num}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary, #f0f0f0)', marginBottom: '3px' }}>
                  {step.title}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary, #999)', lineHeight: 1.45 }}>
                  {step.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Actions */}
        <div style={{ padding: '16px 24px 24px', borderTop: '1px solid var(--glass-border, rgba(255,255,255,0.08))', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {TESTFLIGHT_URL ? (
            <a
              href={TESTFLIGHT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', boxSizing: 'border-box' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Download via TestFlight
            </a>
          ) : (
            <a
              href={IOS_SAFARI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', boxSizing: 'border-box' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Open TuniVerse in Safari
            </a>
          )}
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary, #888)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

/* ─── Main Export: OS-Aware Download Buttons ────────────────────────────────── */
export default function AppDownloadButtons({ size = 'md', showBothOnDesktop = true, variant = 'default' }) {
  const [showIOSModal, setShowIOSModal] = useState(false);
  const os = getDeviceOS();

  const isHero = variant === 'hero';
  const pad   = size === 'lg' ? '12px 20px' : '10px 16px';
  const fs    = size === 'lg' ? '0.90rem'   : '0.82rem';
  const icoSz = size === 'lg' ? 20          : 17;

  const AndroidBtn = () => (
    <a
      href={APK_URL}
      download="tuniverse-app.apk"
      className={isHero ? 'btn btn-secondary' : 'btn btn-primary'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: pad,
        fontSize: fs,
        fontWeight: 700,
        borderRadius: '12px',
        textDecoration: 'none',
        border: isHero ? '1px solid rgba(225, 29, 72, 0.4)' : '1px solid rgba(225, 29, 72, 0.5)',
        background: isHero ? 'rgba(225, 29, 72, 0.08)' : 'var(--red, #e11d48)',
        color: isHero ? 'var(--text-primary, #f0f0f0)' : '#fff',
        boxShadow: isHero ? 'none' : '0 4px 20px rgba(225,29,72,0.25)',
        transition: 'transform 0.15s, background 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
    >
      <svg width={icoSz} height={icoSz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: isHero ? 'var(--red-bright, #ff3366)' : 'currentColor' }}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      <span>Android (.APK)</span>
    </a>
  );

  const IOSBtn = () => (
    <button
      onClick={() => setShowIOSModal(true)}
      className="btn btn-secondary"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: pad,
        fontSize: fs,
        fontWeight: 700,
        borderRadius: '12px',
        cursor: 'pointer',
        background: isHero ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
        color: 'var(--text-primary, #f0f0f0)',
        border: '1px solid var(--glass-border, rgba(255,255,255,0.15))',
        transition: 'background 0.15s, border-color 0.15s, transform 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.background = isHero ? 'rgba(255, 255, 255, 0.04)' : 'transparent'; }}
    >
      <svg width={icoSz} height={icoSz} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
      <span>iOS (iPhone / iPad)</span>
    </button>
  );

  return (
    <>
      {showIOSModal && <IOSInstallModal onClose={() => setShowIOSModal(false)} />}

      <div style={{ display: 'inline-flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        {os === 'ios'     && <IOSBtn />}
        {os === 'android' && <AndroidBtn />}
        {os === 'desktop' && showBothOnDesktop && (
          <>
            <AndroidBtn />
            <IOSBtn />
          </>
        )}
      </div>
    </>
  );
}
