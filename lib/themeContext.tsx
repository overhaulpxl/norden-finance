'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface AccentPreset {
  id: string;
  name: string;
  hex: string;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { id: 'yellow', name: 'Norden Yellow (Default)', hex: '#FFE066' },
  { id: 'mint', name: 'Sage Mint', hex: '#86efac' },
  { id: 'sky', name: 'Nordic Sky Blue', hex: '#93c5fd' },
  { id: 'lavender', name: 'Lavender Purple', hex: '#d8b4fe' },
  { id: 'coral', name: 'Soft Coral', hex: '#fca5a5' },
  { id: 'mono', name: 'Minimalist Mono', hex: '#e5e7eb' },
];

export function getContrastColor(hexColor: string): '#000000' | '#ffffff' {
  if (!hexColor || !hexColor.startsWith('#')) return '#000000';
  const cleanHex = hexColor.replace('#', '');
  let r = 0;
  let g = 0;
  let b = 0;
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16) || 0;
    g = parseInt(cleanHex[1] + cleanHex[1], 16) || 0;
    b = parseInt(cleanHex[2] + cleanHex[2], 16) || 0;
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16) || 0;
    g = parseInt(cleanHex.substring(2, 4), 16) || 0;
    b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  }
  // Standard perceived brightness formula (YIQ)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? '#000000' : '#ffffff';
}

interface ThemeContextValue {
  accentColor: string;
  setAccentColor: (color: string) => void;
  resetAccentColor: () => void;
  accentTextColor: '#000000' | '#ffffff';
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  presets: AccentPreset[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const DEFAULT_ACCENT = '#FFE066';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [accentColor, setAccentState] = useState<string>(() => {
    if (typeof window === 'undefined') return DEFAULT_ACCENT;
    try {
      const stored = localStorage.getItem('norden_theme_accent');
      if (stored && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(stored)) {
        return stored;
      }
    } catch {
      // ignore
    }
    return DEFAULT_ACCENT;
  });

  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'light';
    try {
      const stored = localStorage.getItem('norden_theme_mode') as ThemeMode;
      if (stored === 'dark' || stored === 'light' || stored === 'system') {
        return stored;
      }
    } catch {
      // ignore
    }
    return 'light';
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const stored = localStorage.getItem('norden_theme_mode') as ThemeMode;
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return stored === 'dark' || (stored === 'system' && prefersDark);
    } catch {
      return false;
    }
  });

  // Apply accent color & contrast to document root
  const applyAccent = useCallback((color: string) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.style.setProperty('--theme-accent', color);
    const textColor = getContrastColor(color);
    root.style.setProperty('--theme-accent-text', textColor);
  }, []);

  // Apply dark mode class to document root
  const applyDarkClass = useCallback((dark: boolean) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  // Sync to document on mount
  useEffect(() => {
    applyAccent(accentColor);
    applyDarkClass(isDark);
  }, [accentColor, isDark, applyAccent, applyDarkClass]);

  // System dark mode listener
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (themeMode === 'system') {
        setIsDark(e.matches);
        applyDarkClass(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode, applyDarkClass]);

  const setAccentColor = useCallback((color: string) => {
    setAccentState(color);
    applyAccent(color);
    try {
      localStorage.setItem('norden_theme_accent', color);
    } catch {
      // ignore
    }
  }, [applyAccent]);

  const resetAccentColor = useCallback(() => {
    setAccentColor(DEFAULT_ACCENT);
  }, [setAccentColor]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      localStorage.setItem('norden_theme_mode', mode);
    } catch {
      // ignore
    }

    let dark = false;
    if (mode === 'dark') {
      dark = true;
    } else if (mode === 'system') {
      dark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    setIsDark(dark);
    applyDarkClass(dark);
  }, [applyDarkClass]);

  const accentTextColor = useMemo(() => getContrastColor(accentColor), [accentColor]);

  const value = useMemo<ThemeContextValue>(() => ({
    accentColor,
    setAccentColor,
    resetAccentColor,
    accentTextColor,
    themeMode,
    setThemeMode,
    isDark,
    presets: ACCENT_PRESETS,
  }), [accentColor, setAccentColor, resetAccentColor, accentTextColor, themeMode, setThemeMode, isDark]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      accentColor: DEFAULT_ACCENT,
      setAccentColor: () => {},
      resetAccentColor: () => {},
      accentTextColor: '#000000' as const,
      themeMode: 'light' as ThemeMode,
      setThemeMode: () => {},
      isDark: false,
      presets: ACCENT_PRESETS,
    };
  }
  return context;
}
