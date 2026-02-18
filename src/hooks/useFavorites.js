import { useState, useCallback } from 'react';

const STORAGE_KEY = 'sbb_favorites';

function loadFavorites() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)) || []); }
  catch { return new Set(); }
}

function saveFavorites(set) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...set])); } catch {}
}

export function useFavorites() {
  const [favorites, setFavorites] = useState(loadFavorites);

  const toggleFavorite = useCallback((word) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(word)) next.delete(word);
      else next.add(word);
      saveFavorites(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback((word) => favorites.has(word), [favorites]);

  const clearFavorites = useCallback(() => {
    setFavorites(new Set());
    saveFavorites(new Set());
  }, []);

  return { favorites, toggleFavorite, isFavorite, clearFavorites };
}
