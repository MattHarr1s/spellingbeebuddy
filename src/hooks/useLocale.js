import { useState, useEffect, useCallback } from 'react';
import { STRINGS } from '../i18n.js';

const STORAGE_KEY = 'sbb_locale';

export function useLocale() {
  const [locale, setLocale] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && STRINGS[stored]) return stored;
      const nav = navigator.language || '';
      return nav.startsWith('es') ? 'es' : 'en';
    } catch { return 'en'; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, locale); } catch {}
  }, [locale]);

  const toggleLocale = useCallback(() =>
    setLocale(prev => prev === 'en' ? 'es' : 'en'), []);

  const s = STRINGS[locale];

  return { locale, toggleLocale, s };
}
