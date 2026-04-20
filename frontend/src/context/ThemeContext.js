import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { themes } from '../theme';

const ThemeContext = createContext();

const STORAGE_KEY = 'optima_theme_id';

export const ThemeProvider = ({ children }) => {
  const [themeId, setThemeIdState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && themes[saved]) return saved;
    } catch (_) {}
    return 'midnight-royal';
  });

  const theme = themes[themeId];

  const setThemeId = useCallback((id) => {
    if (!themes[id]) return;
    setThemeIdState(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch (_) {}
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme.isDark ? 'daylight-clean' : 'midnight-royal';
    setThemeId(next);
  }, [theme.isDark, setThemeId]);

  const value = useMemo(() => ({
    theme,
    themeId,
    themes,
    setThemeId,
    toggleTheme,
    isDark: theme.isDark,
  }), [theme, themeId, setThemeId, toggleTheme]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme.isDark) {
      root.classList.remove('light');
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
      document.body.style.backgroundColor = '#070B14'; /* Prevents white flash on dark mode reload */
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.style.colorScheme = 'light';
      document.body.style.backgroundColor = '#f8fafc'; /* Ensures body background is light */
    }
  }, [theme.isDark]);

  return (
    <ThemeContext.Provider value={value}>
      <div className={theme.isDark ? 'dark' : 'light'} style={{ minHeight: '100vh' }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
