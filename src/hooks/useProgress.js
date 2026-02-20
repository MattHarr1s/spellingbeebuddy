import { useState, useCallback } from 'react';

const STORAGE_KEY = 'sbb_progress';
const STREAK_KEY = 'sbb_streak';

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}

function saveProgress(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function loadStreak() {
  try { return JSON.parse(localStorage.getItem(STREAK_KEY)) || { dates: [] }; }
  catch { return { dates: [] }; }
}

function saveStreak(data) {
  try { localStorage.setItem(STREAK_KEY, JSON.stringify(data)); } catch {}
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function calcStreaks(dates) {
  if (!dates.length) return { currentStreak: 0, longestStreak: 0 };
  const sorted = [...new Set(dates)].sort().reverse();
  const today = todayStr();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // Current streak: consecutive days ending today or yesterday
  let currentStreak = 0;
  if (sorted[0] === today || sorted[0] === yesterday) {
    currentStreak = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1] + 'T00:00:00');
      const curr = new Date(sorted[i] + 'T00:00:00');
      const diff = (prev - curr) / 86400000;
      if (diff === 1) currentStreak++;
      else break;
    }
  }

  // Longest streak
  let longestStreak = 1;
  let run = 1;
  const asc = [...sorted].reverse();
  for (let i = 1; i < asc.length; i++) {
    const prev = new Date(asc[i - 1] + 'T00:00:00');
    const curr = new Date(asc[i] + 'T00:00:00');
    const diff = (curr - prev) / 86400000;
    if (diff === 1) { run++; longestStreak = Math.max(longestStreak, run); }
    else run = 1;
  }
  longestStreak = Math.max(longestStreak, run);
  if (dates.length === 0) longestStreak = 0;

  return { currentStreak, longestStreak };
}

export function useProgress() {
  const [progress, setProgress] = useState(loadProgress);
  const [streak, setStreak] = useState(loadStreak);

  const recordStudyDay = useCallback(() => {
    setStreak(prev => {
      const today = todayStr();
      if (prev.dates.includes(today)) return prev;
      const updated = { dates: [...prev.dates, today] };
      saveStreak(updated);
      return updated;
    });
  }, []);

  // SRS intervals in days for Leitner boxes 0-4
  const SRS_INTERVALS = [1, 2, 4, 8, 16];

  const recordResult = useCallback((word, correct) => {
    setProgress(prev => {
      const entry = prev[word] || { correct: 0, wrong: 0, lastSeen: 0, srsBox: 0, nextReview: 0, interval: 1 };
      const currentBox = entry.srsBox || 0;
      const newBox = correct ? Math.min(currentBox + 1, 4) : 0;
      const newInterval = SRS_INTERVALS[newBox];
      const updated = {
        ...prev,
        [word]: {
          correct: entry.correct + (correct ? 1 : 0),
          wrong: entry.wrong + (correct ? 0 : 1),
          lastSeen: Date.now(),
          srsBox: newBox,
          nextReview: Date.now() + newInterval * 86400000,
          interval: newInterval,
        }
      };
      saveProgress(updated);
      return updated;
    });
    recordStudyDay();
  }, [recordStudyDay]);

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

  const getOverallStats = useCallback(() => {
    const entries = Object.values(progress);
    const totalPracticed = entries.filter(e => (e.correct + e.wrong) > 0).length;
    const totalMastered = entries.filter(e => {
      const total = e.correct + e.wrong;
      const accuracy = total > 0 ? (e.correct / total) * 100 : 0;
      return e.correct >= 3 && accuracy >= 80;
    }).length;
    let totalCorrect = 0, totalAttempts = 0;
    entries.forEach(e => { totalCorrect += e.correct; totalAttempts += e.correct + e.wrong; });
    const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
    return { totalPracticed, totalMastered, totalAttempts, totalCorrect, overallAccuracy };
  }, [progress]);

  const getStreakStats = useCallback(() => {
    const { currentStreak, longestStreak } = calcStreaks(streak.dates);
    return { currentStreak, longestStreak, totalDays: new Set(streak.dates).size, studyDates: streak.dates };
  }, [streak]);

  const getRecentWords = useCallback(() => {
    return Object.entries(progress)
      .filter(([, e]) => e.lastSeen > 0)
      .sort(([, a], [, b]) => b.lastSeen - a.lastSeen)
      .slice(0, 10)
      .map(([word, e]) => ({ word, correct: e.correct, wrong: e.wrong, lastSeen: e.lastSeen }));
  }, [progress]);

  const getWordsForReview = useCallback(() => {
    const now = Date.now();
    return Object.entries(progress)
      .filter(([, e]) => e.nextReview && e.nextReview <= now && (e.correct + e.wrong) > 0)
      .sort(([, a], [, b]) => (a.nextReview || 0) - (b.nextReview || 0))
      .map(([word]) => word);
  }, [progress]);

  const getDueCount = useCallback(() => {
    const now = Date.now();
    return Object.entries(progress)
      .filter(([, e]) => e.nextReview && e.nextReview <= now && (e.correct + e.wrong) > 0)
      .length;
  }, [progress]);

  const getSrsStats = useCallback(() => {
    const now = Date.now();
    const entries = Object.entries(progress).filter(([, e]) => (e.correct + e.wrong) > 0);
    const dueCount = entries.filter(([, e]) => e.nextReview && e.nextReview <= now).length;
    const boxCounts = [0, 0, 0, 0, 0];
    entries.forEach(([, e]) => {
      const box = e.srsBox || 0;
      if (box >= 0 && box <= 4) boxCounts[box]++;
    });
    return { dueCount, totalEnrolled: entries.length, boxCounts };
  }, [progress]);

  const resetProgress = useCallback(() => {
    setProgress({});
    saveProgress({});
    setStreak({ dates: [] });
    saveStreak({ dates: [] });
  }, []);

  return { progress, recordResult, getWordStats, getCategoryStats, getMasteredCount, getOverallStats, getStreakStats, getRecentWords, getWordsForReview, getDueCount, getSrsStats, resetProgress };
}
