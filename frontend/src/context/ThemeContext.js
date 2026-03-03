import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext();

const themes = {
  crimson: {
    id: 'crimson',
    name: 'Crimson',
    navbarGradient: 'from-red-600 via-rose-600 to-red-700',
    headerGradient: 'from-gray-700 via-gray-800 to-gray-900',
    sidebarGradient: 'from-slate-900 via-gray-900 to-zinc-900',
    surfaceGradient: 'from-gray-100 via-gray-50 to-white',
    primaryGradient: 'from-red-500 to-rose-600',
    avatarGradient: 'from-red-500 to-rose-600',
  },
  indigo: {
    id: 'indigo',
    name: 'Indigo',
    navbarGradient: 'from-blue-600 via-purple-600 to-indigo-700',
    headerGradient: 'from-blue-500 via-purple-500 to-indigo-600',
    sidebarGradient: 'from-slate-900 via-blue-900 to-indigo-900',
    surfaceGradient: 'from-blue-50 via-indigo-50 to-purple-50',
    primaryGradient: 'from-blue-600 to-purple-600',
    avatarGradient: 'from-blue-500 to-purple-600',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald',
    navbarGradient: 'from-emerald-600 via-teal-600 to-green-700',
    headerGradient: 'from-emerald-500 via-teal-500 to-green-600',
    sidebarGradient: 'from-slate-900 via-emerald-900 to-teal-900',
    surfaceGradient: 'from-emerald-50 via-teal-50 to-green-50',
    primaryGradient: 'from-emerald-600 to-teal-600',
    avatarGradient: 'from-emerald-500 to-teal-600',
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    navbarGradient: 'from-cyan-600 via-sky-600 to-blue-700',
    headerGradient: 'from-cyan-500 via-sky-500 to-blue-600',
    sidebarGradient: 'from-slate-900 via-blue-900 to-cyan-900',
    surfaceGradient: 'from-cyan-50 via-sky-50 to-blue-50',
    primaryGradient: 'from-cyan-600 to-sky-600',
    avatarGradient: 'from-cyan-500 to-sky-600',
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    navbarGradient: 'from-orange-600 via-pink-600 to-rose-700',
    headerGradient: 'from-orange-500 via-pink-500 to-rose-600',
    sidebarGradient: 'from-slate-900 via-rose-900 to-pink-900',
    surfaceGradient: 'from-orange-50 via-pink-50 to-rose-50',
    primaryGradient: 'from-orange-600 to-pink-600',
    avatarGradient: 'from-orange-500 to-pink-600',
  },
  amber: {
    id: 'amber',
    name: 'Amber',
    navbarGradient: 'from-amber-600 via-orange-600 to-yellow-700',
    headerGradient: 'from-amber-500 via-orange-500 to-yellow-600',
    sidebarGradient: 'from-slate-900 via-amber-900 to-yellow-900',
    surfaceGradient: 'from-amber-50 via-orange-50 to-yellow-50',
    primaryGradient: 'from-amber-600 to-orange-600',
    avatarGradient: 'from-amber-500 to-orange-600',
  },
  slate: {
    id: 'slate',
    name: 'Slate',
    navbarGradient: 'from-slate-700 via-gray-700 to-zinc-800',
    headerGradient: 'from-slate-600 via-gray-600 to-zinc-700',
    sidebarGradient: 'from-slate-900 via-gray-900 to-zinc-900',
    surfaceGradient: 'from-slate-100 via-gray-100 to-zinc-100',
    primaryGradient: 'from-slate-600 to-gray-600',
    avatarGradient: 'from-slate-500 to-gray-600',
  },
};

export const ThemeProvider = ({ children }) => {
  const [themeId, setThemeId] = useState(() => {
    const saved = localStorage.getItem('hr_theme');
    return saved && themes[saved] ? saved : 'crimson';
  });

  useEffect(() => {
    localStorage.setItem('hr_theme', themeId);
  }, [themeId]);

  const theme = useMemo(() => {
    const selected = themes[themeId] || themes.crimson;
    // Keep gray base for sidebar and surfaces while allowing accent changes elsewhere
    return {
      ...selected,
      sidebarGradient: themes.slate.sidebarGradient,
      surfaceGradient: themes.crimson.surfaceGradient,
    };
  }, [themeId]);

  const value = useMemo(() => ({ themeId, setThemeId, theme, themes }), [themeId, theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
