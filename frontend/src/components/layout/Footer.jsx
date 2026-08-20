import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export const Footer = () => {
  const { brandName } = useTheme();

  return (
    <footer style={{
      background: 'var(--bg-surface)',
      borderTop: '1px solid var(--glass-border)',
      padding: '40px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated grid lines in background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} <strong style={{ color: '#fff' }}>{brandName}</strong>. All rights reserved.
          </div>
          <span style={{ color: 'var(--glass-border)', fontSize: '0.9rem' }}>·</span>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Made with pride for <span style={{ color: 'var(--red)' }}>🇹🇳</span> Tunisians
          </div>
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          {['Privacy Policy', 'Terms of Service', 'Support Channel'].map(l => (
            <a
              key={l}
              href="#"
              style={{
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-display)',
                fontWeight: 500,
                transition: 'color var(--t-fast)',
              }}
              onMouseEnter={e => e.target.style.color = 'var(--red)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
            >
              {l}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
