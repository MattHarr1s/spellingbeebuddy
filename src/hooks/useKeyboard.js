import { useEffect } from 'react';

export function useKeyboard(shortcutMap, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e) => {
      // Don't capture if user is typing in an input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const fn = shortcutMap[e.key];
      if (fn) {
        e.preventDefault();
        fn(e);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcutMap, enabled]);
}
