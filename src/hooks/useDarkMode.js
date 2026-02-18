import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'sbb_dark';

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) return JSON.parse(stored);
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches || false;
    } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(isDark)); } catch {}
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleDark = useCallback(() => setIsDark(prev => !prev), []);

  return { isDark, toggleDark };
}

// Dark theme color palette
export const DARK_THEME = {
  bg: '#0f172a',
  surface: '#1e293b',
  card: '#334155',
  text: '#f1f5f9',
  textMuted: '#94a3b8',
  border: '#475569',
  accent: '#f59e0b',
};

export const LIGHT_THEME = {
  bg: '#f8fafc',
  surface: '#ffffff',
  card: '#ffffff',
  text: '#1a1a2e',
  textMuted: '#6b7280',
  border: '#e5e7eb',
  accent: '#f59e0b',
};
