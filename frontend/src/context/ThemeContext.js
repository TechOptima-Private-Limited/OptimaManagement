import React, { createContext, useContext, useMemo } from 'react';
import theme from '../theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // We provide the theme object directly from theme.js
  // Multi-theme switching logic has been removed as per requirements.
  const value = useMemo(() => ({
    theme,
    themeId: theme.id,
    themes: { [theme.id]: theme }, // Keep for compatibility where themes object is referenced
    setThemeId: () => console.warn('setThemeId is deprecated. Update src/theme.js instead.')
  }), []);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
