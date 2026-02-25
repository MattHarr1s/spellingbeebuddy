import { useState, useCallback } from "react";

const PREFIX = "sbb_seen_";

export function useFirstVisit(key) {
  const storageKey = PREFIX + key;
  const [seen, setSeen] = useState(() => {
    try { return localStorage.getItem(storageKey) === "1"; }
    catch { return false; }
  });
  const markSeen = useCallback(() => {
    setSeen(true);
    try { localStorage.setItem(storageKey, "1"); } catch {}
  }, [storageKey]);
  return [seen, markSeen];
}

export function hasBeenOnboarded() {
  try { return localStorage.getItem(PREFIX + "onboarded") === "1"; }
  catch { return false; }
}

export function markOnboarded() {
  try { localStorage.setItem(PREFIX + "onboarded", "1"); } catch {}
}
