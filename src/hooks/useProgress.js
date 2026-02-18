import { useState, useCallback } from 'react';

const STORAGE_KEY = 'sbb_progress';

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}

function saveProgress(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

export function useProgress() {
  const [progress, setProgress] = useState(loadProgress);

  const recordResult = useCallback((word, correct) => {
    setProgress(prev => {
      const entry = prev[word] || { correct: 0, wrong: 0, lastSeen: 0 };
      const updated = {
        ...prev,
        [word]: {
          correct: entry.correct + (correct ? 1 : 0),
          wrong: entry.wrong + (correct ? 0 : 1),
          lastSeen: Date.now(),
        }
      };
      saveProgress(updated);
      return updated;
    });
  }, []);

  const getWordStats = useCallback((word) => {
    const entry = progress[word];
    if (!entry) return { correct: 0, wrong: 0, total: 0, accuracy: 0, mastered: false };
    const total = entry.correct + entry.wrong;
    const accuracy = total > 0 ? Math.round((entry.correct / total) * 100) : 0;
    const mastered = entry.correct >= 3 && accuracy >= 80;
    return { ...entry, total, accuracy, mastered };
  }, [progress]);

  const getCategoryStats = useCallback((categoryWords) => {
    let mastered = 0;
    let practiced = 0;
    categoryWords.forEach(w => {
      const stats = getWordStats(w.word);
      if (stats.total > 0) practiced++;
      if (stats.mastered) mastered++;
    });
    return { mastered, practiced, total: categoryWords.length, percent: categoryWords.length > 0 ? Math.round((mastered / categoryWords.length) * 100) : 0 };
  }, [getWordStats]);

  const getMasteredCount = useCallback(() => {
    return Object.values(progress).filter(e => {
      const total = e.correct + e.wrong;
      const accuracy = total > 0 ? (e.correct / total) * 100 : 0;
      return e.correct >= 3 && accuracy >= 80;
    }).length;
  }, [progress]);

  const resetProgress = useCallback(() => {
    setProgress({});
    saveProgress({});
  }, []);

  return { progress, recordResult, getWordStats, getCategoryStats, getMasteredCount, resetProgress };
}
