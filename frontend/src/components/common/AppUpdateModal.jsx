import React, { useEffect, useState } from 'react';
import { App as CapApp } from '@capacitor/app';
import api from '../../api/axiosInstance';
import { CURRENT_APP_VERSION, CURRENT_BUILD_NUMBER } from '../../config/appVersion';
import { isNative } from '../../native/capacitorBridge';
import { getDeviceOS } from '../../utils/deviceDetect';

/**
 * Compares installed vs remote version.
 * Returns TRUE if and only if the remote version is strictly newer than installed.
 */
function isVersionOutdated(currVer, currBuild, remoteVer, remoteBuild) {
  const cBuild = Number(currBuild) || 0;
  const rBuild = Number(remoteBuild) || 0;

  // 1. If build numbers exist and remote is strictly greater -> Outdated
  if (rBuild > 0 && cBuild > 0) {
    if (rBuild > cBuild) return true;
    if (rBuild < cBuild) return false;
  }

  // 2. Semantic version comparison (e.g., '1.2.0' vs '1.1.0')
  const currParts = String(currVer || '1.0.0').split('.').map(p => parseInt(p, 10) || 0);
  const remoteParts = String(remoteVer || '1.0.0').split('.').map(p => parseInt(p, 10) || 0);

  for (let i = 0; i < Math.max(currParts.length, remoteParts.length); i++) {
    const c = currParts[i] || 0;
    const r = remoteParts[i] || 0;
    if (r > c) return true;  // Remote is newer -> Update needed
    if (r < c) return false; // Local is newer -> No update needed
  }

  return false; // Exactly equal -> No update needed
}

export default function AppUpdateModal() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // ⚠️ Only run update checks inside the installed native mobile app APK
    if (!isNative) return;

    const checkVersion = async () => {
      try {
        let installedVer = CURRENT_APP_VERSION;
        let installedBuild = CURRENT_BUILD_NUMBER;

        // Query real native Android package metadata if available
        try {
          const info = await CapApp.getInfo();
          if (info?.version) installedVer = info.version;
          if (info?.build) installedBuild = parseInt(info.build, 10) || installedBuild;
        } catch (e) {
          // Fallback to JS config constants
        }

        const res = await api.get('/app-version');
        const data = res.data?.data;
        if (!data) return;

        const remoteBuild   = Number(data.buildNumber) || 0;
        const remoteVersion = data.latestVersion || '1.1.0';

        // Check if user's installed app is strictly outdated
        const outdated = isVersionOutdated(installedVer, installedBuild, remoteVersion, remoteBuild);

        // Check if user dismissed prompt in this session
        const dismissed = sessionStorage.getItem('tuniverse_update_dismissed');

        if (outdated && (!dismissed || data.forceUpdate)) {
          setUpdateInfo({
            ...data,
            installedVersion: installedVer,
          });
          setIsOpen(true);
        }
      } catch (err) {
        // Silently skip update check if offline or network error
        console.warn('Update check error:', err);
      }
    };

    // Run check 1.5s after app launch
    const timer = setTimeout(checkVersion, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!isOpen || !updateInfo) return null;

  const deviceOS = getDeviceOS();
  const isIOSDevice = deviceOS === 'ios';

  const handleUpdate = () => {
    setDownloading(true);

    if (isIOSDevice) {
      const iosUrl = updateInfo.iosUrl || 'https://tunistudy.up.railway.app';
      window.location.href = iosUrl;
    } else {
      // Direct APK download from production server
      const downloadUrl = 'https://tunistudy.up.railway.app/downloads/tuniverse-app.apk';
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', 'tuniverse-app.apk');
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        window.location.href = downloadUrl;
      }, 300);
    }

    setTimeout(() => {
      setDownloading(false);
      if (!updateInfo.forceUpdate) {
        setIsOpen(false);
      }
    }, 2500);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('tuniverse_update_dismissed', 'true');
    setIsOpen(false);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      boxSizing: 'border-box',
    }}>
      <div className="card glass animate-scale-up" style={{
        width: '100%',
        maxWidth: '440px',
        background: 'var(--bg-surface, #111)',
        border: '1px solid var(--red-border, rgba(225,29,72,0.3))',
        borderRadius: 'var(--r-lg, 16px)',
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '16px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px var(--red-glow, rgba(225,29,72,0.2))',
      }}>
        
        {/* Animated Update Icon */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'var(--red-subtle, rgba(225,29,72,0.1))',
          border: '1px solid var(--red-border, rgba(225,29,72,0.3))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px var(--red-glow, rgba(225,29,72,0.3))',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--red, #e11d48)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>

        {/* Title & Version Comparison */}
        <div>
          <div style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--red, #e11d48)',
            marginBottom: '4px',
          }}>
            Update Available
          </div>
          <h2 style={{
            margin: 0,
            fontSize: '1.45rem',
            fontWeight: 800,
            color: 'var(--text-primary, #f0f0f0)',
            fontFamily: 'var(--font-display, inherit)',
          }}>
            TuniVerse {updateInfo.latestVersion}
          </h2>
          <div style={{
            fontSize: '0.78rem',
            color: 'var(--text-secondary, #a0a0a0)',
            marginTop: '4px',
          }}>
            Installed: v{updateInfo.installedVersion || CURRENT_APP_VERSION} → Latest: v{updateInfo.latestVersion}
          </div>
        </div>

        {/* Release Notes */}
        {updateInfo.releaseNotes && (
          <div style={{
            width: '100%',
            background: 'var(--bg-elevated, #181818)',
            border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
            borderRadius: 'var(--r-md, 10px)',
            padding: '12px 16px',
            textAlign: 'left',
            boxSizing: 'border-box',
          }}>
            <div style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              color: 'var(--text-primary, #f0f0f0)',
              marginBottom: '6px',
            }}>
              What's New:
            </div>
            {Array.isArray(updateInfo.releaseNotes) ? (
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.76rem', color: 'var(--text-secondary, #a0a0a0)', lineHeight: 1.5 }}>
                {updateInfo.releaseNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary, #a0a0a0)', lineHeight: 1.4 }}>
                {updateInfo.releaseNotes}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
          <button
            onClick={handleUpdate}
            disabled={downloading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '13px 20px',
              fontSize: '0.92rem',
              fontWeight: 700,
              justifyContent: 'center',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
          >
            {downloading ? (
              <>
                <span className="animate-spin">⟳</span>
                {isIOSDevice ? 'Opening Safari...' : 'Downloading Update...'}
              </>
            ) : isIOSDevice ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Update on iPhone / iPad
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download & Update Now
              </>
            )}
          </button>

          {!updateInfo.forceUpdate && (
            <button
              onClick={handleDismiss}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary, #a0a0a0)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '6px',
                transition: 'color var(--t-fast)',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary, #fff)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary, #a0a0a0)'}
            >
              Remind Me Later
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
