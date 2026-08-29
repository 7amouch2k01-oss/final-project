import React, { useState } from 'react';
import { getDeviceOS } from '../../utils/deviceDetect';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AppDownloadButtons — Smart OS-Aware Download Button Component
 *
 * Automatically detects whether the visitor is on iOS, Android, or Desktop
 * and renders the correct download action:
 *   - iOS  → Shows iOS Install Guide modal (Safari Add to Home Screen + TestFlight)
 *   - Android  → Direct APK download
 *   - Desktop  → Shows both options side-by-side
 * ═══════════════════════════════════════════════════════════════════════════
 */

const APK_URL = '/downloads/tuniverse-app.apk';
const IOS_GUIDE_URL = 'https://tunistudy.up.railway.app';   // Safari "Add to Home Screen" target
const TESTFLIGHT_URL = null;                                 // Set to TestFlight link when available

function IOSInstallModal({ onClose }) {
  const steps = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
        </svg>
      ),
      title: 'Open in Safari',
      desc: 'Open TuniVerse in Safari on your iPhone or iPad — it will not work in Chrome or Firefox for this step.',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
      ),
      title: 'Tap the Share Button',
      desc: 'At the bottom of Safari, tap the Share icon (the box with an arrow pointing up).',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
      ),
      title: 'Add to Home Screen',
      desc: 'Scroll down in the Share menu and tap "Add to Home Screen". Give it the name TuniVerse and tap Add.',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      ),
      title: 'Launch like a Native App',
      desc: 'The TuniVerse icon will appear on your iPhone home screen. Tap it anytime to open the full app experience.',
    },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.88)',
      backdropFilter: 'blur(18px)',
      WebkitBackdropFilter: 'blur(18px)',
      zIndex: 99998,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', boxSizing: 'border-box',
    }}>
      <div style={{
        width: '100%', maxWidth: '440px',
        background: 'var(--bg-surface, #111)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 'var(--r-lg, 16px)',
        padding: '28px 24px',
        display: 'flex', flexDirection: 'column', gap: '20px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.9)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--red, #e11d48)', marginBottom: '4px' }}>
              iOS Installation
            </div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary, #f0f0f0)' }}>
              Install on iPhone / iPad
            </h2>
          </div>
          <button onClick={onClose} style={{
            background: 'var(--bg-elevated, #1a1a1a)',
            border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
            borderRadius: '50%', width: '36px', height: '36px',
            cursor: 'pointer', color: 'var(--text-secondary, #a0a0a0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Apple Logo Badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'var(--bg-elevated, #1a1a1a)',
          border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
          borderRadius: 'var(--r-md, 10px)', padding: '12px 16px',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="var(--text-primary, #f0f0f0)">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary, #f0f0f0)' }}>TuniVerse for iPhone & iPad</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #a0a0a0)' }}>iOS Progressive Web App (PWA)</div>
          </div>
        </div>

        {/* Step-by-step guide */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {steps.map((step, idx) => (
            <div key={idx} style={{
              display: 'flex', alignItems: 'flex-start', gap: '14px',
              padding: '14px', borderRadius: 'var(--r-md, 10px)',
              background: 'var(--bg-elevated, #1a1a1a)',
              border: '1px solid var(--glass-border, rgba(255,255,255,0.06))',
            }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                background: 'rgba(225,29,72,0.12)', border: '1px solid rgba(225,29,72,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--red, #e11d48)',
              }}>
                {step.icon}
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary, #f0f0f0)', marginBottom: '4px' }}>
                  Step {idx + 1}: {step.title}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary, #a0a0a0)', lineHeight: 1.5 }}>
                  {step.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {TESTFLIGHT_URL ? (
            <a
              href={TESTFLIGHT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px', padding: '13px 20px', fontWeight: 700, textDecoration: 'none', boxSizing: 'border-box' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              Download via TestFlight
            </a>
          ) : (
            <a
              href={IOS_GUIDE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px', padding: '13px 20px', fontWeight: 700, textDecoration: 'none', boxSizing: 'border-box' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Open TuniVerse in Safari
            </a>
          )}
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary, #a0a0a0)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', padding: '6px' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppDownloadButtons({ size = 'md', showBothOnDesktop = true }) {
  const [showIOSModal, setShowIOSModal] = useState(false);
  const os = getDeviceOS();

  const btnPadding = size === 'lg' ? '14px 24px' : '11px 18px';
  const btnFontSize = size === 'lg' ? '0.95rem' : '0.85rem';
  const iconSize = size === 'lg' ? 22 : 18;

  const AndroidBtn = () => (
    <a
      href={APK_URL}
      download="tuniverse-app.apk"
      className="btn btn-primary"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '10px',
        padding: btnPadding, fontSize: btnFontSize, fontWeight: 700,
        textDecoration: 'none',
      }}
    >
      {/* Android Robot SVG */}
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      <span>Download for Android</span>
      <span style={{
        fontSize: '0.68rem', fontWeight: 800, background: 'rgba(255,255,255,0.15)',
        padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.04em',
      }}>APK</span>
    </a>
  );

  const IOSBtn = () => (
    <button
      onClick={() => setShowIOSModal(true)}
      className="btn btn-primary"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '10px',
        padding: btnPadding, fontSize: btnFontSize, fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      {/* Apple Logo SVG */}
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
      <span>Download for iOS</span>
      <span style={{
        fontSize: '0.68rem', fontWeight: 800, background: 'rgba(255,255,255,0.15)',
        padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.04em',
      }}>iPhone / iPad</span>
    </button>
  );

  return (
    <>
      {/* Render iOS Install Guide Modal */}
      {showIOSModal && <IOSInstallModal onClose={() => setShowIOSModal(false)} />}

      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Auto-detected OS: Show only the matching button, or both on desktop */}
        {os === 'ios' && <IOSBtn />}
        {os === 'android' && <AndroidBtn />}
        {os === 'desktop' && showBothOnDesktop && (
          <>
            <AndroidBtn />
            <IOSBtn />
          </>
        )}
      </div>

      {/* OS Detected Label */}
      <div style={{
        marginTop: '10px', fontSize: '0.73rem',
        color: 'var(--text-muted, #666)',
        display: 'flex', alignItems: 'center', gap: '6px',
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        {os === 'ios' && 'iPhone / iPad detected — iOS version shown'}
        {os === 'android' && 'Android device detected — APK download shown'}
        {os === 'desktop' && 'Desktop detected — both platforms shown'}
      </div>
    </>
  );
}
