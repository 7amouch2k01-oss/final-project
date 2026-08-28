import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

// ─── Portal sub-brand names ──────────────────────────────────────────────────
// TuniVerse is the master brand.
// Each portal has a professional sub-brand name shown in the navbar label.
const BRAND_NAMES = {
  student: 'TuniVerse',         // navbar tagline handled by subtitle
  citizen: 'TuniVerse',
  admin:   'TuniVerse',
};

// Subtitle shown next to logo on smaller labels / page titles
export const PORTAL_LABELS = {
  student: 'Academic Hub',
  citizen: 'Career Centre',
  admin:   'Control Centre',
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('student'); // 'student', 'citizen', 'admin'
  const [brandName, setBrandName] = useState('TuniVerse');
  const [portalLabel, setPortalLabel] = useState('Academic Hub');
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('app-color-mode') || 'dark';
  });

  const updateThemeByRole = (role) => {
    if (role === 'admin') {
      setTheme('admin');
      setBrandName('TuniVerse');
      setPortalLabel('Control Centre');
      document.title = 'TuniVerse Control Centre — Admin Panel';
    } else if (role === 'citizen') {
      setTheme('citizen');
      setBrandName('TuniVerse');
      setPortalLabel('Career Centre');
      document.title = 'TuniVerse Career Centre — Jobs & Opportunities';
    } else {
      setTheme('student');
      setBrandName('TuniVerse');
      setPortalLabel('Academic Hub');
      document.title = 'TuniVerse Academic Hub — Universities & Internships';
    }
  };

  const toggleMode = () => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('app-color-mode', next);
      return next;
    });
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-mode', mode);
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ theme, brandName, portalLabel, mode, toggleMode, setMode, updateThemeByRole, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export default ThemeContext;
