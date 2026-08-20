import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('student'); // 'student', 'citizen', 'admin'
  const [brandName, setBrandName] = useState('TuniStudy');
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('app-color-mode') || 'dark';
  });

  const updateThemeByRole = (role) => {
    if (role === 'admin') {
      setTheme('admin');
      setBrandName('TuniAdmin');
    } else if (role === 'citizen') {
      setTheme('citizen');
      setBrandName('TuniJob');
    } else {
      setTheme('student');
      setBrandName('TuniStudy');
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
    <ThemeContext.Provider value={{ theme, brandName, mode, toggleMode, setMode, updateThemeByRole, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export default ThemeContext;
