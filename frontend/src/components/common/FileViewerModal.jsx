import React, { useState } from 'react';

/**
 * FileViewerModal
 * Full-screen / glassmorphism modal to view image and PDF attachments directly inside TuniVerse.
 * Features:
 * - Direct image rendering (with zoom in/out & reset controls)
 * - Embedded PDF iframe preview with open/download toolbar
 * - Direct download fallback button
 */
export const FileViewerModal = ({ isOpen, onClose, fileUrl, fileName = 'Attached Document' }) => {
  const [zoom, setZoom] = useState(1);
  const [imgError, setImgError] = useState(false);

  if (!isOpen || !fileUrl) return null;

  // Determine file type
  const cleanUrl = fileUrl.split('?')[0].toLowerCase();
  const isPdf = cleanUrl.endsWith('.pdf') || fileUrl.includes('/raw/upload/') || cleanUrl.includes('.pdf');
  const isImage = !isPdf && (
    cleanUrl.endsWith('.jpg') ||
    cleanUrl.endsWith('.jpeg') ||
    cleanUrl.endsWith('.png') ||
    cleanUrl.endsWith('.webp') ||
    cleanUrl.endsWith('.gif') ||
    cleanUrl.endsWith('.svg') ||
    fileUrl.includes('/image/upload/')
  );

  const handleZoomIn = (e) => {
    e.stopPropagation();
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = (e) => {
    e.stopPropagation();
    setZoom(1);
  };

  return (
    <div
      className="modal-backdrop animate-fade-in"
      onClick={onClose}
      style={{
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="modal animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '94vw',
          maxWidth: '960px',
          maxHeight: '90vh',
          height: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          background: 'var(--bg-surface)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--r-xl)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
      >
        {/* Header Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid var(--glass-border)',
            background: 'var(--bg-elevated)',
            flexShrink: 0,
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: isPdf ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                color: isPdf ? '#ef4444' : '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {isPdf ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              )}
            </div>

            <div style={{ minWidth: 0 }}>
              <h4
                style={{
                  margin: 0,
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {fileName}
              </h4>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {isPdf ? 'PDF Document Preview' : isImage ? 'Image Preview' : 'Document File'}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {/* Image Zoom Controls */}
            {isImage && !imgError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'var(--bg-surface)',
                  padding: '2px 6px',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--glass-border)',
                }}
              >
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                  title="Zoom Out"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                  title="Reset Zoom"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                  title="Zoom In"
                >
                  +
                </button>
              </div>
            )}

            {/* Open / Download in New Tab Fallback */}
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              download
              className="btn btn-secondary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.78rem',
                padding: '6px 12px',
              }}
              title="Open or Download original file"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Download</span>
            </a>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="icon-btn-logo"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                background: 'var(--bg-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-muted)',
              }}
              title="Close Preview (Esc)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            background: '#09090b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            padding: isImage ? '24px' : '0',
          }}
        >
          {isPdf ? (
            <iframe
              src={fileUrl.startsWith('http') ? `${fileUrl}#toolbar=1&navpanes=0` : fileUrl}
              title={fileName}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                background: '#fff',
              }}
            />
          ) : isImage && !imgError ? (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'auto',
              }}
            >
              <img
                src={fileUrl}
                alt={fileName}
                onError={() => setImgError(true)}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.15s ease-out',
                  borderRadius: 'var(--r-md)',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                }}
              />
            </div>
          ) : (
            /* Fallback preview for unrecognised files or images with errors */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                padding: '40px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div>
                <h4 style={{ margin: '0 0 6px', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                  {fileName}
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '420px' }}>
                  This file format can be viewed or downloaded directly.
                </p>
              </div>
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Open File in Full Window
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileViewerModal;
