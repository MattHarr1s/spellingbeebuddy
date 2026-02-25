import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { ALL_WORDS } from "./data/words.js";
import { useProgress } from "./hooks/useProgress.js";
import { useFavorites } from "./hooks/useFavorites.js";
import { useDarkMode, DARK_THEME, LIGHT_THEME } from "./hooks/useDarkMode.js";
import { useKeyboard } from "./hooks/useKeyboard.js";
import { useLocale } from "./hooks/useLocale.js";
import { useAudio, VOICES } from "./hooks/useAudio.js";
import { useFirstVisit, hasBeenOnboarded, markOnboarded } from "./hooks/useFirstVisit.js";

// ─── Category Configuration ─────────────────────────────────────────────────
const CATEGORIES = {
  "Silent H": {
    color: "#e74c3c",
    icon: "🤫",
    description: "Words with silent 'h' — easy to forget!",
    filter: w => /h/i.test(w.word) && !/ch/i.test(w.word),
  },
  "Accents & Tildes": {
    color: "#3498db",
    icon: "🎯",
    description: "Words where the accent mark changes everything",
    filter: w => /[áéíóú]/i.test(w.word),
  },
  "Double Letters": {
    color: "#2ecc71",
    icon: "✌️",
    description: "Words with cc, rr, ll, nn — don't miss the double!",
    filter: w => /cc|rr|ll|nn/i.test(w.word),
  },
  "B vs V": {
    color: "#9b59b6",
    icon: "🔀",
    description: "B and V sound the same — know which to use!",
    filter: w => /b/i.test(w.word) && /v/i.test(w.word),
  },
  "Diéresis (ü)": {
    color: "#f39c12",
    icon: "ü",
    description: "Words with güe/güi where the ü is required",
    filter: w => /ü/i.test(w.word),
  },
  "Tricky Combos": {
    color: "#1abc9c",
    icon: "🧩",
    description: "X, SC, PS, GN, and other unusual letter clusters",
    filter: w => /x|gn|ps|sc|pt|mn|bs|ns[ct]/i.test(w.word),
  },
  "Z Words": {
    color: "#e67e22",
    icon: "⚡",
    description: "Words with Z — often confused with S",
    filter: w => /z/i.test(w.word),
  },
  "S Words": {
    color: "#16a085",
    icon: "🐍",
    description: "Tricky S words — S, C, or Z?",
    filter: w => /s[ceiou]|[aeiou]s|^s/i.test(w.word) && /[czs]ión|[czs]i[oó]n|ce|ci|se|si/i.test(w.word),
  },
  "V Words": {
    color: "#8e44ad",
    icon: "✅",
    description: "Words with V — don't swap for B!",
    filter: w => /v/i.test(w.word),
  },
  "B Words": {
    color: "#c0392b",
    icon: "🅱️",
    description: "Words with B — don't swap for V!",
    filter: w => /b/i.test(w.word),
  },
  "H Words": {
    color: "#d35400",
    icon: "🔇",
    description: "Words with H — it's always silent in Spanish!",
    filter: w => /h/i.test(w.word),
  },
  "C Words": {
    color: "#2980b9",
    icon: "©️",
    description: "C before E/I sounds like S — tricky spelling!",
    filter: w => /c[ei]/i.test(w.word) || /cc/i.test(w.word),
  },
  "LL Words": {
    color: "#27ae60",
    icon: "🦜",
    description: "Words with LL — don't confuse with Y!",
    filter: w => /ll/i.test(w.word),
  },
  "Y Words": {
    color: "#f1c40f",
    icon: "🌟",
    description: "Words with Y — don't confuse with LL!",
    filter: w => /y/i.test(w.word),
  },
};

// Pre-compute category word lists
const categoryWords = {};
Object.entries(CATEGORIES).forEach(([name, cat]) => {
  categoryWords[name] = ALL_WORDS.filter(cat.filter);
});

// ─── Utilities ──────────────────────────────────────────────────────────────
const stripAccents = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateMisspellings(word) {
  const results = [];
  const noAccent = word.normalize("NFD").replace(/[\u0301\u0308]/g, "").normalize("NFC");
  if (noAccent !== word) results.push(noAccent);
  if (word.includes("b")) results.push(word.replace(/b/, "v"));
  if (word.includes("v")) results.push(word.replace(/v/, "b"));
  if (word.includes("h") && !word.startsWith("ch")) results.push(word.replace(/h/, ""));
  if (word.includes("rr")) results.push(word.replace("rr", "r"));
  if (word.includes("ll")) results.push(word.replace("ll", "l"));
  if (word.includes("cc")) results.push(word.replace("cc", "c"));
  if (word.includes("ü")) results.push(word.replace("ü", "u"));
  if (word.includes("z")) results.push(word.replace(/z/, "s"));
  if (/c[ei]/.test(word)) results.push(word.replace(/c(?=[ei])/, "s"));
  if (word.includes("y") && !word.startsWith("y")) results.push(word.replace("y", "ll"));
  if (word.includes("ll")) results.push(word.replace("ll", "y"));
  if (word.includes("ñ")) results.push(word.replace("ñ", "n"));
  if (!word.includes("á") && word.includes("a")) results.push(word.replace(/a(?!$)/, "á"));
  if (!word.includes("é") && word.includes("e")) results.push(word.replace(/e/, "é"));
  return [...new Set(results)].filter(r => r !== word).slice(0, 6);
}

// ─── Voice Spelling Recognition ─────────────────────────────────────────────
const HAS_SPEECH = typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

const LETTER_MULTI = {
  "a con acento": "á", "a con tilde": "á", "a acento": "á",
  "e con acento": "é", "e con tilde": "é", "e acento": "é",
  "i con acento": "í", "i con tilde": "í", "i acento": "í",
  "o con acento": "ó", "o con tilde": "ó", "o acento": "ó",
  "u con acento": "ú", "u con tilde": "ú", "u acento": "ú",
  "u con diéresis": "ü", "u con crema": "ü", "u diéresis": "ü",
  "be grande": "b", "be larga": "b", "b grande": "b",
  "ve corta": "v", "ve chica": "v", "uve corta": "v", "v chica": "v",
  "doble erre": "rr", "doble r": "rr", "doble ere": "rr",
  "doble ele": "ll", "doble l": "ll",
  "doble ve": "w", "doble uve": "w", "doble u": "w",
  "i griega": "y",
};
const LETTER_SINGLE = {
  "a": "a", "be": "b", "ce": "c", "de": "d", "e": "e",
  "efe": "f", "ge": "g", "hache": "h", "ache": "h", "i": "i",
  "jota": "j", "ka": "k", "ele": "l", "eme": "m", "ene": "n",
  "eñe": "ñ", "o": "o", "pe": "p", "cu": "q", "erre": "r",
  "ere": "r", "ese": "s", "te": "t", "u": "u", "uve": "v",
  "ve": "v", "equis": "x", "ye": "y", "zeta": "z", "seta": "z",
};
const BV_NAMES = new Set(["be", "ve", "uve"]);
const MULTI_KEYS = Object.keys(LETTER_MULTI).sort((a, b) => b.length - a.length);

function matchLetterName(text) {
  const t = text.toLowerCase().trim();
  // Multi-word exact
  for (const name of MULTI_KEYS) {
    if (t === name || t.startsWith(name + " ") || t.endsWith(" " + name)) {
      return { letter: LETTER_MULTI[name], raw: name, ambiguous: null };
    }
  }
  // Single-word exact
  if (LETTER_SINGLE[t]) {
    return { letter: LETTER_SINGLE[t], raw: t, ambiguous: BV_NAMES.has(t) ? ["b", "v"] : null };
  }
  // Contains match for multi-word
  for (const name of MULTI_KEYS) {
    if (t.includes(name)) return { letter: LETTER_MULTI[name], raw: name, ambiguous: null };
  }
  // Contains match for single-word (3+ char names to avoid false positives)
  for (const [name, letter] of Object.entries(LETTER_SINGLE)) {
    if (name.length >= 3 && t.includes(name)) {
      return { letter, raw: name, ambiguous: BV_NAMES.has(name) ? ["b", "v"] : null };
    }
  }
  // Single char fallback
  if (t.length === 1 && /[a-záéíóúüñ]/.test(t)) return { letter: t, raw: t, ambiguous: null };
  return null;
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => { const r = new Array(n + 1); r[0] = i; return r; });
  for (let j = 1; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

function compareSpelling(attempt, target) {
  const a = attempt.trim().toLowerCase(), t = target.toLowerCase();
  if (a === t) return { exact: true, accentClose: false, similarity: 1 };
  const aN = stripAccents(a), tN = stripAccents(t);
  if (aN === tN) return { exact: false, accentClose: true, similarity: 0.95 };
  const dist = levenshtein(aN, tN);
  const maxLen = Math.max(aN.length, tN.length);
  const similarity = maxLen > 0 ? Math.round((1 - dist / maxLen) * 100) / 100 : 0;
  return { exact: false, accentClose: false, similarity };
}

// ─── Error Classification & Diff Utilities ──────────────────────────────────
function classifyErrors(attempt, correct) {
  const a = attempt.trim().toLowerCase(), c = correct.toLowerCase();
  if (a === c) return { types: [], details: [] };
  const types = [], details = [];
  const aN = stripAccents(a), cN = stripAccents(c);
  // Accent error: base letters match but accents differ
  if (aN === cN && a !== c) { types.push("accent"); details.push("Check accent marks"); }
  // B/V swap
  if (aN !== cN && aN.replace(/[bv]/g, "x") === cN.replace(/[bv]/g, "x")) { types.push("bv"); details.push("B and V swap"); }
  // Missing H
  if (aN !== cN && aN.replace(/h/g, "") === cN.replace(/h/g, "")) { types.push("h"); details.push("Missing or extra H"); }
  // Double letter missed
  const doubles = ["cc", "rr", "ll", "nn"];
  for (const d of doubles) {
    if (c.includes(d) && !a.includes(d) && a.includes(d[0])) { types.push("double"); details.push(`Double ${d} missed`); break; }
    if (a.includes(d) && !c.includes(d)) { types.push("double"); details.push(`Extra double ${d}`); break; }
  }
  // Missing diéresis
  if (c.includes("ü") && !a.includes("ü") && a.includes("u")) { types.push("dieresis"); details.push("Missing ü"); }
  // Z/S confusion
  if (aN !== cN && aN.replace(/[zs]/g, "x") === cN.replace(/[zs]/g, "x")) { types.push("zs"); details.push("Z/S confusion"); }
  // C/S confusion
  if (aN !== cN && aN.replace(/[cs]/g, "x") === cN.replace(/[cs]/g, "x")) { types.push("cs"); details.push("C/S confusion"); }
  // Y/LL confusion
  if (aN !== cN && aN.replace(/ll|y/g, "x") === cN.replace(/ll|y/g, "x")) { types.push("yll"); details.push("Y/LL confusion"); }
  // Missing tilde
  if (c.includes("ñ") && !a.includes("ñ") && a.includes("n")) { types.push("tilde"); details.push("Missing ñ"); }
  // Generic fallback
  if (types.length === 0) { types.push("other"); details.push("Spelling error"); }
  return { types, details };
}

function computeCharDiff(attempt, correct) {
  const a = attempt.trim().toLowerCase(), c = correct.toLowerCase();
  // LCS-based alignment
  const m = a.length, n = c.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === c[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  // Backtrack to produce alignment
  const result = [];
  let i = m, j = n;
  const temp = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === c[j - 1]) {
      temp.push({ char: c[j - 1], expected: c[j - 1], status: "correct" });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      temp.push({ char: c[j - 1], expected: c[j - 1], status: "missing" });
      j--;
    } else {
      temp.push({ char: a[i - 1], expected: "", status: "extra" });
      i--;
    }
  }
  temp.reverse();
  // Merge: mark wrong chars (attempt char differs from expected)
  for (const item of temp) {
    if (item.status === "correct") result.push(item);
    else if (item.status === "missing") result.push({ char: item.char, expected: item.char, status: "missing" });
    else result.push({ char: item.char, expected: "", status: "extra" });
  }
  return result;
}

function useVoiceSpelling() {
  const [listening, setListening] = useState(false);
  const [lastHeard, setLastHeard] = useState(null);
  const [ambiguity, setAmbiguity] = useState(null);
  const recRef = useRef(null);
  const callbackRef = useRef(null);
  const listeningRef = useRef(false);

  useEffect(() => { return () => { if (recRef.current) { recRef.current.onend = null; recRef.current.stop(); recRef.current = null; } }; }, []);

  const start = useCallback((onLetter) => {
    if (!HAS_SPEECH) return;
    callbackRef.current = onLetter;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "es-MX";
    rec.continuous = true;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0].transcript.trim();
          const match = matchLetterName(transcript);
          setLastHeard({ transcript, match });
          if (match) {
            if (match.ambiguous) setAmbiguity(match.ambiguous);
            else callbackRef.current?.(match.letter);
          }
        }
      }
    };
    rec.onerror = (e) => { if (e.error !== "no-speech" && e.error !== "aborted") console.warn("Speech error:", e.error); };
    rec.onend = () => { if (listeningRef.current && recRef.current) try { recRef.current.start(); } catch {} };
    try { rec.start(); recRef.current = rec; listeningRef.current = true; setListening(true); } catch {}
  }, []);

  const stop = useCallback(() => {
    listeningRef.current = false;
    if (recRef.current) { recRef.current.onend = null; recRef.current.stop(); recRef.current = null; }
    setListening(false); setLastHeard(null); setAmbiguity(null);
  }, []);

  const resolveAmbiguity = useCallback((letter) => { callbackRef.current?.(letter); setAmbiguity(null); }, []);
  const toggle = useCallback((onLetter) => { if (listening) stop(); else start(onLetter); }, [listening, start, stop]);

  return { listening, lastHeard, ambiguity, resolveAmbiguity, toggle, stop, supported: HAS_SPEECH };
}

// ─── Shared Components ──────────────────────────────────────────────────────
function SpeedControl({ speed, setSpeed, t, compact, s }) {
  const labels = s ? s.speedLabels : { 0.4: "Very Slow", 0.6: "Slow", 0.8: "Normal", 1.0: "Fast", 1.2: "Faster" };
  const closest = Object.keys(labels).reduce((a, b) => Math.abs(b - speed) < Math.abs(a - speed) ? b : a);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: compact ? 4 : 8, padding: compact ? "4px 8px" : "6px 12px", background: t.surface, borderRadius: 10, border: `1px solid ${t.border}` }}>
      <span style={{ fontSize: compact ? 12 : 14 }}>🐢</span>
      <input type="range" min="0.3" max="1.3" step="0.05" value={speed}
        onChange={e => setSpeed(parseFloat(e.target.value))}
        style={{ width: compact ? 60 : 80, accentColor: "#e67e22" }} />
      <span style={{ fontSize: compact ? 12 : 14 }}>🐇</span>
      {!compact && <span style={{ fontSize: 12, color: t.textMuted, minWidth: 50, textAlign: "center" }}>{labels[closest] || speed.toFixed(1) + "x"}</span>}
    </div>
  );
}

function SpeakButton({ word, speak, speed, label, t, s }) {
  const [animating, setAnimating] = useState(false);
  const handleClick = () => { setAnimating(true); speak(word, speed); setTimeout(() => setAnimating(false), 800); };
  return (
    <button onClick={handleClick}
      style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${t.border}`, background: animating ? (t.bg === DARK_THEME.bg ? "#1e3a5f" : "#eff6ff") : t.surface, color: t.text, cursor: "pointer", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 4, transition: "all 0.2s" }}
      title={s ? s.listen : "Listen"}>🔊 {label || (s ? s.listen : "Listen")}</button>
  );
}

function FavButton({ word, isFavorite, toggleFavorite, s }) {
  const fav = isFavorite(word);
  return (
    <button onClick={(e) => { e.stopPropagation(); toggleFavorite(word); }}
      aria-label={fav ? (s ? s.removeFromFavorites : "Remove from favorites") : (s ? s.addToFavorites : "Add to favorites")}
      aria-pressed={fav}
      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: "8px", minWidth: 36, minHeight: 36, opacity: fav ? 1 : 0.4, transition: "opacity 0.2s", filter: fav ? "none" : "grayscale(1)", display: "flex", alignItems: "center", justifyContent: "center" }}
      title={fav ? (s ? s.removeFromFavorites : "Remove from favorites") : (s ? s.addToFavorites : "Add to favorites")}>⭐</button>
  );
}

function VoiceMicButton({ voice, onLetter, disabled, t, s }) {
  if (!voice.supported) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <button onClick={() => { if (!disabled) voice.toggle(onLetter); }}
        disabled={disabled}
        style={{ width: 44, height: 44, borderRadius: "50%", border: voice.listening ? "2px solid #ef4444" : `2px solid ${t.border}`, background: voice.listening ? (t.bg === DARK_THEME.bg ? "#451a1a" : "#fef2f2") : t.surface, color: voice.listening ? "#ef4444" : t.textMuted, cursor: disabled ? "default" : "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, opacity: disabled ? 0.4 : 1, transition: "all 0.2s", boxShadow: voice.listening ? "0 0 0 4px rgba(239,68,68,0.2)" : "none", flexShrink: 0 }}
        title={voice.listening ? (s ? s.stopVoice : "Stop voice input") : (s ? s.spellByVoice : "Spell by voice")}>
        {voice.listening ? "⏹" : "🎙"}
      </button>
      {voice.listening && voice.lastHeard && (
        <p style={{ fontSize: 11, color: t.textMuted, textAlign: "center", maxWidth: 160 }}>
          "{voice.lastHeard.transcript}" {voice.lastHeard.match ? `→ ${voice.lastHeard.match.letter}` : "→ ?"}
        </p>
      )}
      {voice.ambiguity && (
        <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "4px 10px", background: "#fef3c7", borderRadius: 10 }}>
          <span style={{ fontSize: 12, color: "#92400e" }}>{s ? s.which : "Which?"}</span>
          {voice.ambiguity.map(l => (
            <button key={l} onClick={() => voice.resolveAmbiguity(l)}
              style={{ padding: "3px 12px", borderRadius: 8, border: "1px solid #f59e0b", background: "white", cursor: "pointer", fontSize: 15, fontWeight: 700, fontFamily: "Georgia, serif" }}>{l}</button>
          ))}
        </div>
      )}
    </div>
  );
}

const KOFI_URL = "https://ko-fi.com/espellnol";

function SupportBanner({ t, compact, s }) {
  return (
    <div style={{ textAlign: "center", padding: compact ? "12px 8px" : "16px 12px", marginTop: compact ? 12 : 20, borderRadius: 12, border: `1px solid ${t.border}`, background: t.surface }}>
      {!compact && <p style={{ fontSize: 13, color: t.textMuted, marginBottom: 8 }}>{s ? s.enjoyingApp : "Enjoying this app? Help keep it free!"}</p>}
      <a href={KOFI_URL} target="_blank" rel="noopener noreferrer"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 10, border: "none", background: "#FF5E5B", color: "white", cursor: "pointer", fontSize: 14, fontWeight: 600, textDecoration: "none", transition: "opacity 0.2s" }}
        onMouseEnter={e => e.currentTarget.style.opacity = "0.85"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
        ☕ {s ? s.supportKofi : "Support on Ko-fi"}
      </a>
    </div>
  );
}

function AdSlot({ t, s }) {
  return (
    <div style={{ textAlign: "center", padding: "16px 12px", marginTop: 16, borderRadius: 12, border: `1px dashed ${t.border}`, background: t.surface, minHeight: 90 }}>
      {/* Google AdSense ad unit goes here. Replace this placeholder with your ad code:
          <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXXXXX" data-ad-slot="XXXXXXX" data-ad-format="auto" data-full-width-responsive="true"></ins>
          <script>(adsbygoogle = window.adsbygoogle || []).push({});</script> */}
      <p style={{ fontSize: 12, color: t.textMuted }}>{s ? s.adSpace : "Ad space"}</p>
    </div>
  );
}

function AccentToolbar({ onChar, inputRef, t }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 10 }}>
      {["á", "é", "í", "ó", "ú", "ü", "ñ"].map(char => (
        <button key={char} onClick={() => { onChar(char); inputRef.current?.focus(); }}
          aria-label={`Insert ${char}`}
          style={{ width: 44, height: 44, borderRadius: 8, border: `1px solid ${t.border}`, background: t.surface, color: t.text, fontSize: 18, cursor: "pointer", fontFamily: "Georgia, serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0 }}>{char}</button>
      ))}
    </div>
  );
}

// ─── Error Feedback Components ───────────────────────────────────────────────
const ERROR_TYPE_COLORS = {
  accent: "#3498db", bv: "#9b59b6", h: "#e74c3c", double: "#2ecc71",
  dieresis: "#f39c12", zs: "#e67e22", cs: "#16a085", yll: "#27ae60",
  tilde: "#c0392b", other: "#95a5a6",
};
const ERROR_TYPE_KEYS = {
  accent: "errorAccent", bv: "errorBV", h: "errorH", double: "errorDouble",
  dieresis: "errorDieresis", zs: "errorZS", cs: "errorCS", yll: "errorYLL",
  tilde: "errorTilde", other: "errorOther",
};

function SpellingDiff({ attempt, correct, t }) {
  const diff = computeCharDiff(attempt, correct);
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap", marginBottom: 8 }}>
      {diff.map((d, i) => (
        <span key={i} style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 28, height: 34, borderRadius: 6, fontSize: 18, fontFamily: "Georgia, serif", fontWeight: 600,
          background: d.status === "correct" ? (t.bg === DARK_THEME.bg ? "#064e3b" : "#d1fae5")
            : d.status === "missing" ? (t.bg === DARK_THEME.bg ? "#1e3a5f" : "#dbeafe")
            : (t.bg === DARK_THEME.bg ? "#7f1d1d" : "#fee2e2"),
          color: d.status === "correct" ? "#059669" : d.status === "missing" ? "#3b82f6" : "#dc2626",
          border: d.status === "correct" ? "1px solid #10b981" : d.status === "missing" ? "1px solid #3b82f6" : "1px solid #ef4444",
          textDecoration: d.status === "extra" ? "line-through" : "none",
        }}>
          {d.char}
        </span>
      ))}
    </div>
  );
}

function ErrorTypeBadges({ errorTypes, s, compact }) {
  if (!errorTypes || errorTypes.length === 0) return null;
  const unique = [...new Set(errorTypes)];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center", marginTop: compact ? 4 : 8 }}>
      {unique.map(type => (
        <span key={type} style={{
          padding: compact ? "2px 8px" : "3px 10px", borderRadius: 12,
          fontSize: compact ? 11 : 12, fontWeight: 600,
          background: (ERROR_TYPE_COLORS[type] || "#95a5a6") + "20",
          color: ERROR_TYPE_COLORS[type] || "#95a5a6",
          border: `1px solid ${(ERROR_TYPE_COLORS[type] || "#95a5a6")}40`,
        }}>
          {s[ERROR_TYPE_KEYS[type]] || type}
        </span>
      ))}
    </div>
  );
}

function ErrorFeedback({ attempt, correct, errorTypes, t, s }) {
  return (
    <div style={{ marginTop: 8 }}>
      <p style={{ fontSize: 12, color: t.textMuted, marginBottom: 4 }}>{s.yourAnswer}:</p>
      <SpellingDiff attempt={attempt} correct={correct} t={t} />
      <p style={{ fontSize: 12, color: t.textMuted, marginBottom: 2 }}>{s.correctSpelling}:</p>
      <p style={{ fontSize: 22, fontWeight: 700, fontFamily: "Georgia, serif", color: "#059669", marginBottom: 6 }}>{correct}</p>
      <ErrorTypeBadges errorTypes={errorTypes} s={s} />
    </div>
  );
}

function DefinitionDisplay({ word, t, s }) {
  const [lang, setLang] = useState("en");
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 6 }}>
        <button onClick={() => setLang("en")}
          style={{ padding: "3px 10px", borderRadius: 12, border: lang === "en" ? "2px solid #3498db" : `1px solid ${t.border}`, background: lang === "en" ? (t.bg === DARK_THEME.bg ? "#1e3a5f" : "#eff6ff") : t.surface, color: t.text, fontSize: 12, cursor: "pointer", fontWeight: lang === "en" ? 600 : 400 }}>{s ? s.english : "English"}</button>
        <button onClick={() => setLang("es")}
          style={{ padding: "3px 10px", borderRadius: 12, border: lang === "es" ? "2px solid #e67e22" : `1px solid ${t.border}`, background: lang === "es" ? (t.bg === DARK_THEME.bg ? "#3d2a14" : "#fff7ed") : t.surface, color: t.text, fontSize: 12, cursor: "pointer", fontWeight: lang === "es" ? 600 : 400 }}>{s ? s.spanish : "Español"}</button>
      </div>
      <p style={{ color: t.textMuted, fontSize: 15, fontStyle: "italic" }}>
        {lang === "en" ? word.en : (word.es || word.en)}
      </p>
    </div>
  );
}

function DarkModeToggle({ isDark, toggleDark, s }) {
  return (
    <button onClick={toggleDark}
      aria-label={isDark ? (s ? s.switchToLight : "Switch to light mode") : (s ? s.switchToDark : "Switch to dark mode")}
      style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", padding: "10px", minWidth: 44, minHeight: 44, borderRadius: 8, transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center" }}
      title={isDark ? (s ? s.switchToLight : "Switch to light mode") : (s ? s.switchToDark : "Switch to dark mode")}>{isDark ? "☀️" : "🌙"}</button>
  );
}

function LocaleToggle({ locale, toggleLocale }) {
  return (
    <button onClick={toggleLocale}
      aria-label={locale === "en" ? "Cambiar a español" : "Switch to English"}
      style={{ background: "none", border: "none", fontSize: 14, cursor: "pointer", padding: "10px", minWidth: 44, minHeight: 44, borderRadius: 8, transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center" }}
      title={locale === "en" ? "Cambiar a español" : "Switch to English"}>
      {locale === "es" ? "🇺🇸 EN" : "🇲🇽 ES"}
    </button>
  );
}

function VoiceSelector({ voiceId, setVoiceId, t, s }) {
  const current = VOICES.find(v => v.id === voiceId) || VOICES[0];
  const genderIcon = current.gender === "female" ? "♀" : current.gender === "male" ? "♂" : "⚥";
  const cycle = () => {
    const idx = VOICES.findIndex(v => v.id === voiceId);
    setVoiceId(VOICES[(idx + 1) % VOICES.length].id);
  };
  return (
    <button onClick={cycle} title={s ? s.voiceLabel : "Voice"}
      style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "4px 8px", background: t.surface, borderRadius: 10, border: `1px solid ${t.border}`, color: t.text, cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" }}>
      <span>🎙</span>
      <span style={{ fontWeight: 600 }}>{current.label}</span>
      <span style={{ color: t.textMuted, fontSize: 10 }}>{genderIcon}</span>
    </button>
  );
}

function ModeTopBar({ onBack, backLabel, speed, setSpeed, isDark, toggleDark, locale, toggleLocale, t, s, voiceId, setVoiceId }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 6 }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: t.textMuted, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap", padding: "4px 0", flexShrink: 0 }}>← {backLabel || (s ? s.back : "Back")}</button>
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        <SpeedControl speed={speed} setSpeed={setSpeed} t={t} compact s={s} />
        {voiceId && setVoiceId && <VoiceSelector voiceId={voiceId} setVoiceId={setVoiceId} t={t} s={s} />}
        {locale && toggleLocale && <LocaleToggle locale={locale} toggleLocale={toggleLocale} />}
        <DarkModeToggle isDark={isDark} toggleDark={toggleDark} s={s} />
      </div>
    </div>
  );
}

// ─── Contextual Hint (First-Use Tooltip) ─────────────────────────────────────
function ContextualHint({ hintKey, message, position = "below", t, children }) {
  const [seen, markSeen] = useFirstVisit(hintKey);
  const [visible, setVisible] = useState(!seen);
  const [coords, setCoords] = useState(null);
  const targetRef = useRef(null);
  const prefersReducedMotion = useRef(typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    if (!visible || seen) return;
    const el = targetRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
    const timer = setTimeout(() => { setVisible(false); markSeen(); }, 8000);
    return () => clearTimeout(timer);
  }, [visible, seen, markSeen]);

  const dismiss = () => { setVisible(false); markSeen(); };

  return (
    <div ref={targetRef} style={{ position: "relative" }}>
      {children}
      {visible && !seen && coords && (
        <div onClick={dismiss} style={{
          position: "fixed", top: position === "above" ? "auto" : coords.top, bottom: position === "above" ? (window.innerHeight - coords.top + 60) : "auto",
          left: Math.max(12, Math.min(coords.left - 140, window.innerWidth - 292)),
          width: 280, padding: "12px 16px", borderRadius: 12, background: t.bg === "#0f172a" ? "#1e293b" : "#1e293b", color: "white",
          fontSize: 13, lineHeight: 1.5, boxShadow: "0 8px 32px rgba(0,0,0,0.3)", zIndex: 9999,
          animation: prefersReducedMotion.current ? "none" : "hintFadeIn 0.2s ease-out",
          cursor: "pointer",
        }}>
          <span>{message}</span>
          <span style={{ display: "block", fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Tap to dismiss</span>
        </div>
      )}
    </div>
  );
}

// ─── Welcome Screen (First Visit) ───────────────────────────────────────────
function WelcomeScreen({ onStart, onExplore, t, isDark, s }) {
  return (
    <div style={{ maxWidth: 440, margin: "0 auto", textAlign: "center", padding: "60px 20px" }}>
      <p style={{ fontSize: 64, marginBottom: 16 }}>🐝</p>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: t.text, marginBottom: 8 }}>{s.welcomeTitle}</h1>
      <p style={{ fontSize: 16, color: t.textMuted, marginBottom: 36, lineHeight: 1.6 }}>{s.welcomeSubtitle}</p>
      <button onClick={onStart}
        style={{ width: "100%", padding: "18px 24px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #e67e22, #f39c12)", color: "white", cursor: "pointer", fontSize: 18, fontWeight: 700, boxShadow: "0 4px 20px rgba(230,126,34,0.35)", marginBottom: 14 }}>
        🎧 {s.welcomeStart}
      </button>
      <button onClick={onExplore}
        style={{ width: "100%", padding: "14px 24px", borderRadius: 14, border: `1px solid ${t.border}`, background: t.surface, color: t.textMuted, cursor: "pointer", fontSize: 15 }}>
        {s.welcomeExplore} →
      </button>
    </div>
  );
}

// ─── Welcome Back Prompt (Return Visitors with SRS Due) ──────────────────────
function WelcomeBackPrompt({ dueCount, onStartReview, onSkip, t, isDark, s }) {
  if (dueCount <= 0) return null;
  return (
    <div style={{ padding: "14px 18px", borderRadius: 12, border: "2px solid #10b981", background: isDark ? "#064e3b" : "#ecfdf5", marginBottom: 20, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 160 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{s.welcomeBackTitle(dueCount)}</p>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onStartReview}
          style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: "#10b981", color: "white", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>{s.welcomeBackStart}</button>
        <button onClick={onSkip}
          style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${t.border}`, background: t.surface, color: t.textMuted, cursor: "pointer", fontSize: 13 }}>{s.welcomeBackSkip}</button>
      </div>
    </div>
  );
}

// ─── Study Mode (Flashcards) ────────────────────────────────────────────────
function StudyMode({ words, category, catColor, onBack, speed, setSpeed, speak, t, isDark, toggleDark, isFavorite, toggleFavorite, s, locale, toggleLocale, voiceId, setVoiceId, prefetch }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTip, setShowTip] = useState(false);
  const [showDef, setShowDef] = useState(false);
  const [showWord, setShowWord] = useState(true);
  const [flipping, setFlipping] = useState(false);
  const [autoReveal, setAutoReveal] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef(null);
  const word = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;
  const DELAY_OPTIONS = [0, 15, 30, 60, 90, 120];

  const toggleWord = useCallback(() => {
    setFlipping(true);
    setTimeout(() => { setShowWord(prev => !prev); setTimeout(() => setFlipping(false), 300); }, 300);
  }, []);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoReveal > 0 && !showWord) {
      setCountdown(autoReveal);
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setFlipping(true);
            setTimeout(() => { setShowWord(true); setTimeout(() => setFlipping(false), 300); }, 300);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else { setCountdown(0); }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [autoReveal, showWord, currentIndex]);

  const resetCard = () => { setShowTip(false); setShowDef(false); setShowWord(true); setFlipping(false); setCountdown(0); };

  // Keyboard shortcuts
  const shortcuts = useMemo(() => ({
    ArrowLeft: () => { if (currentIndex > 0) { setCurrentIndex(i => i - 1); resetCard(); } },
    ArrowRight: () => { if (currentIndex < words.length - 1) { setCurrentIndex(i => i + 1); resetCard(); } },
    " ": () => speak(word?.word, speed),
    Enter: () => toggleWord(),
    Escape: () => onBack(),
  }), [currentIndex, words.length, word, speed, speak, toggleWord, onBack]);
  useKeyboard(shortcuts);

  if (!word) return <p style={{ color: t.text }}>{s ? s.noWordsInCategory : "No words in this category."}</p>;
  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <ModeTopBar onBack={onBack} backLabel={s ? s.categories : "Categories"} speed={speed} setSpeed={setSpeed} isDark={isDark} toggleDark={toggleDark} locale={locale} toggleLocale={toggleLocale} t={t} s={s} voiceId={voiceId} setVoiceId={setVoiceId} />
      <div style={{ background: t.border, borderRadius: 8, height: 6, marginBottom: 24 }}>
        <div style={{ background: catColor || "#3498db", height: 6, borderRadius: 8, width: `${progress}%`, transition: "width 0.3s" }} />
      </div>
      <p style={{ color: t.textMuted, fontSize: 14, textAlign: "center", marginBottom: 8 }}>{s ? s.nOfM(currentIndex + 1, words.length) : `${currentIndex + 1} of ${words.length}`}</p>

      <div style={{ perspective: 800, marginBottom: 16 }}>
        <div style={{
          background: t.card, borderRadius: 16, padding: "24px 20px", boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.3)" : "0 4px 24px rgba(0,0,0,0.08)", textAlign: "center", minHeight: 240, display: "flex", flexDirection: "column", justifyContent: "center",
          transform: flipping ? "rotateY(90deg)" : "rotateY(0deg)", transition: "transform 0.3s ease-in-out", transformStyle: "preserve-3d",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: catColor || "#888", fontWeight: 600 }}>{s && s.cat[category] ? s.cat[category] : category}</p>
            <FavButton word={word.word} isFavorite={isFavorite} toggleFavorite={toggleFavorite} s={s} />
          </div>

          {showWord ? (
            <h2 style={{ fontSize: "clamp(24px, 7vw, 36px)", fontWeight: 700, color: t.text, marginBottom: 12, fontFamily: "Georgia, serif", wordBreak: "break-word" }}>{word.word}</h2>
          ) : (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 36, marginBottom: 4 }}>🔒</p>
              <p style={{ fontSize: 13, color: t.textMuted }}>{s ? s.spellingHidden : "Spelling hidden — listen and try to remember!"}</p>
              {countdown > 0 && <p style={{ fontSize: 13, color: catColor || "#3498db", fontWeight: 600, marginTop: 6 }}>{s ? s.revealingIn(countdown) : `Revealing in ${countdown}s`}</p>}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 16 }}>
            <SpeakButton word={word.word} speak={speak} speed={speed} label={s ? s.listen : "Listen"} t={t} s={s} />
            <button onClick={toggleWord} style={{ padding: "6px 10px", borderRadius: 20, border: `1px solid ${t.border}`, background: showWord ? t.surface : "#fef3c7", color: showWord ? t.text : "#374151", cursor: "pointer", fontSize: 12 }}>👁 {showWord ? (s ? s.hideSpelling : "Hide Spelling") : (s ? s.showSpelling : "Show Spelling")}</button>
            <button onClick={() => setShowDef(!showDef)} style={{ padding: "6px 10px", borderRadius: 20, border: `1px solid ${t.border}`, background: showDef ? (isDark ? "#1e3a5f" : "#f0f9ff") : t.surface, color: t.text, cursor: "pointer", fontSize: 12 }}>{showDef ? (s ? s.hideDefinition : "Hide Definition") : (s ? s.showDefinition : "Show Definition")}</button>
            <button onClick={() => setShowTip(!showTip)} style={{ padding: "6px 10px", borderRadius: 20, border: `1px solid ${t.border}`, background: showTip ? "#fef3c7" : t.surface, color: showTip ? "#374151" : t.text, cursor: "pointer", fontSize: 12 }}>{showTip ? (s ? s.hideTip : "Hide Tip") : (s ? s.showTip : "Show Tip")}</button>
          </div>
          {showDef && <DefinitionDisplay word={word} t={t} s={s} />}
          {showTip && <p style={{ color: "#92400e", fontSize: 14, background: "#fef3c7", padding: "10px 16px", borderRadius: 8, marginTop: 8 }}>💡 {word.tip}</p>}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 16 }}>
        <span style={{ fontSize: 11, color: t.textMuted, flexShrink: 0 }}>⏱</span>
        {DELAY_OPTIONS.map(sec => (
          <button key={sec} onClick={() => setAutoReveal(sec)}
            style={{ padding: "3px 8px", borderRadius: 12, border: autoReveal === sec ? `2px solid ${catColor || "#3498db"}` : `1px solid ${t.border}`, background: autoReveal === sec ? (catColor || "#3498db") + "18" : t.surface, color: autoReveal === sec ? catColor || "#3498db" : t.textMuted, cursor: "pointer", fontSize: 11, fontWeight: autoReveal === sec ? 600 : 400 }}>
            {sec === 0 ? (s ? s.off : "Off") : `${sec}s`}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <button onClick={() => { setCurrentIndex(Math.max(0, currentIndex - 1)); resetCard(); }} disabled={currentIndex === 0}
          style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: `1px solid ${t.border}`, background: t.surface, color: t.text, cursor: currentIndex === 0 ? "default" : "pointer", opacity: currentIndex === 0 ? 0.4 : 1, fontSize: 15 }}>{s ? s.previous : "← Previous"}</button>
        <button onClick={() => { setCurrentIndex(Math.min(words.length - 1, currentIndex + 1)); resetCard(); }} disabled={currentIndex === words.length - 1}
          style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "none", background: catColor || "#3498db", color: "white", cursor: currentIndex === words.length - 1 ? "default" : "pointer", opacity: currentIndex === words.length - 1 ? 0.4 : 1, fontSize: 15, fontWeight: 600 }}>{s ? s.next : "Next →"}</button>
      </div>
      <p style={{ textAlign: "center", color: t.textMuted, fontSize: 12, marginTop: 12 }}>{s ? s.keyboardShortcuts : "← → navigate · Space listen · Enter flip · Esc back"}</p>
    </div>
  );
}

// ─── Quiz Mode (Multiple Choice) ────────────────────────────────────────────
function QuizMode({ onBack, speed, setSpeed, speak, t, isDark, toggleDark, recordResult, isFavorite, toggleFavorite, wordPool, s, locale, toggleLocale, voiceId, setVoiceId, prefetch }) {
  const pool = wordPool || ALL_WORDS;
  const QUIZ_SIZE = Math.min(15, pool.length);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [missed, setMissed] = useState([]);
  const [retryMissed, setRetryMissed] = useState(false);

  function buildQuiz(pool_) {
    const shuffled = shuffleArray(pool_);
    return shuffled.slice(0, Math.min(15, pool_.length)).map(w => {
      const misspellings = generateMisspellings(w.word);
      while (misspellings.length < 3) {
        const swaps = [w.word.split("").reverse().join(""), w.word.slice(0, -1), w.word + "s"];
        for (const s of swaps) { if (s !== w.word && !misspellings.includes(s)) { misspellings.push(s); break; } }
        if (misspellings.length < 3) misspellings.push(w.word.slice(1));
      }
      return { ...w, options: shuffleArray([w.word, ...misspellings.slice(0, 3)]), correct: w.word };
    });
  }

  useEffect(() => { setQuestions(buildQuiz(pool)); }, []);
  if (questions.length === 0) return <p style={{ textAlign: "center", padding: 40, color: t.text }}>{s ? s.loadingQuiz : "Loading quiz..."}</p>;

  if (finished) {
    const total = questions.length;
    const pct = Math.round((score / total) * 100);
    return (
      <div style={{ maxWidth: 500, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{pct >= 80 ? "🏆" : pct >= 60 ? "👍" : "📚"}</div>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: t.text }}>{s ? s.nCorrect(score, total) : `${score} / ${total} Correct`}</h2>
        <p style={{ color: t.textMuted, fontSize: 16, marginBottom: 24 }}>{pct >= 80 ? (s ? s.excellentReady : "¡Excelente! You're ready to compete!") : pct >= 60 ? (s ? s.goodJob : "¡Bien hecho! Keep practicing.") : (s ? s.keepStudying : "Keep studying — you'll get there!")}</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => { setFinished(false); setCurrentQ(0); setScore(0); setSelected(null); setMissed([]); setQuestions(buildQuiz(pool)); }}
            style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: "#3498db", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>{s ? s.tryAgain : "Try Again"}</button>
          {missed.length > 0 && (
            <button onClick={() => { setFinished(false); setCurrentQ(0); setScore(0); setSelected(null); setRetryMissed(true); setQuestions(buildQuiz(missed)); setMissed([]); }}
              style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: "#e67e22", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>{s ? s.practiceMissed(missed.length) : `Practice ${missed.length} Missed`}</button>
          )}
          <button onClick={onBack} style={{ padding: "12px 24px", borderRadius: 10, border: `1px solid ${t.border}`, background: t.surface, color: t.text, cursor: "pointer", fontSize: 15 }}>{s ? s.backToMenu : "Back to Menu"}</button>
        </div>
        <SupportBanner t={t} compact s={s} />
        <AdSlot t={t} s={s} />
      </div>
    );
  }

  const q = questions[currentQ];
  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <ModeTopBar onBack={onBack} speed={speed} setSpeed={setSpeed} isDark={isDark} toggleDark={toggleDark} locale={locale} toggleLocale={toggleLocale} t={t} s={s} voiceId={voiceId} setVoiceId={setVoiceId} />
      <div style={{ background: t.border, borderRadius: 8, height: 6, marginBottom: 24 }}>
        <div style={{ background: "#3498db", height: 6, borderRadius: 8, width: `${((currentQ + 1) / questions.length) * 100}%`, transition: "width 0.3s" }} />
      </div>
      <p style={{ color: t.textMuted, textAlign: "center", marginBottom: 8, fontSize: 14 }}>{s ? s.questionNOfM(currentQ + 1, questions.length) : `Question ${currentQ + 1} of ${questions.length}`}{retryMissed ? ` ${s ? s.missedWordsLabel : "(missed words)"}` : ""}</p>
      <div style={{ background: t.card, borderRadius: 16, padding: "22px 18px", boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.3)" : "0 4px 24px rgba(0,0,0,0.08)", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
          <p style={{ fontSize: 15, color: t.text }}>{s ? s.whichCorrectSpelling : "Which is the correct spelling?"}</p>
          <SpeakButton word={q.correct} speak={speak} speed={speed} label="" t={t} s={s} />
          <FavButton word={q.correct} isFavorite={isFavorite} toggleFavorite={toggleFavorite} s={s} />
        </div>
        <div style={{ marginBottom: 16 }}><DefinitionDisplay word={q} t={t} s={s} /></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {q.options.map((opt, i) => {
            let bg = t.surface, border = `1px solid ${t.border}`;
            if (selected !== null) {
              if (opt === q.correct) { bg = isDark ? "#064e3b" : "#d1fae5"; border = "2px solid #10b981"; }
              else if (opt === selected && opt !== q.correct) { bg = isDark ? "#7f1d1d" : "#fee2e2"; border = "2px solid #ef4444"; }
            }
            return (
              <button key={i} onClick={() => {
                if (selected !== null) return;
                setSelected(opt);
                const correct = opt === q.correct;
                if (correct) setScore(s => s + 1);
                else {
                  const errors = classifyErrors(opt, q.correct);
                  setMissed(prev => [...prev, { ...q, selectedOption: opt, errorTypes: errors.types }]);
                }
                recordResult(q.word, correct);
              }}
                style={{ padding: "14px 20px", borderRadius: 10, border, background: bg, color: t.text, cursor: selected !== null ? "default" : "pointer", fontSize: 18, fontFamily: "Georgia, serif", textAlign: "center", transition: "all 0.2s" }}>{opt}</button>
            );
          })}
        </div>
        {selected !== null && (
          <div style={{ marginTop: 16 }}>
            <p style={{ color: selected === q.correct ? "#059669" : "#dc2626", fontWeight: 600, marginBottom: 4 }}>{selected === q.correct ? (s ? s.correctExclaim : "✓ ¡Correcto!") : (s ? s.incorrectAnswer(q.correct) : `✗ Correct: ${q.correct}`)}</p>
            {selected !== q.correct && <ErrorTypeBadges errorTypes={classifyErrors(selected, q.correct).types} s={s} compact />}
            <p style={{ fontSize: 13, color: "#92400e", background: "#fef3c7", padding: "8px 12px", borderRadius: 8, marginTop: 6 }}>💡 {q.tip}</p>
            <button onClick={() => { if (currentQ + 1 >= questions.length) setFinished(true); else { setCurrentQ(currentQ + 1); setSelected(null); } }}
              style={{ marginTop: 14, padding: "10px 28px", borderRadius: 10, border: "none", background: "#3498db", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>{currentQ + 1 >= questions.length ? (s ? s.seeResults : "See Results") : (s ? s.next : "Next →")}</button>
          </div>
        )}
      </div>
      <p style={{ textAlign: "center", color: t.textMuted, marginTop: 16, fontSize: 14 }}>{s ? s.score : "Score"}: {score}/{currentQ + (selected !== null ? 1 : 0)}</p>
    </div>
  );
}

// ─── Spell Mode (Type with Hints) ───────────────────────────────────────────
function SpellMode({ onBack, speed, setSpeed, speak, t, isDark, toggleDark, recordResult, isFavorite, toggleFavorite, wordPool, s, locale, toggleLocale, voiceId, setVoiceId, prefetch }) {
  const pool = wordPool || ALL_WORDS;
  const ROUND_SIZE = Math.min(15, pool.length);
  const [words] = useState(() => shuffleArray(pool).slice(0, ROUND_SIZE));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [missed, setMissed] = useState([]);
  const inputRef = useRef(null);
  const voice = useVoiceSpelling();
  const word = words[currentIndex];
  const handleVoiceLetter = useCallback((letter) => { setInput(prev => prev + letter); }, []);

  const checkAnswer = useCallback(() => {
    if (!input.trim()) return;
    const cmp = compareSpelling(input, word.word);
    const correct = cmp.exact || cmp.accentClose;
    if (correct) setScore(s => s + 1);
    else {
      const errors = classifyErrors(input, word.word);
      setMissed(prev => [...prev, { ...word, attempt: input, errorTypes: errors.types }]);
    }
    setResult({ correct, answer: word.word, accentClose: cmp.accentClose, similarity: cmp.similarity, errorTypes: !correct && !(cmp.exact || cmp.accentClose) ? classifyErrors(input, word.word).types : [] });
    recordResult(word.word, correct);
    voice.stop();
  }, [input, word, recordResult, voice]);

  if (finished) {
    const pct = Math.round((score / ROUND_SIZE) * 100);
    return (
      <div style={{ maxWidth: 500, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{pct >= 80 ? "🎯" : pct >= 60 ? "💪" : "📖"}</div>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: t.text }}>{s ? s.nCorrect(score, ROUND_SIZE) : `${score} / ${ROUND_SIZE}`}</h2>
        <p style={{ color: t.textMuted, marginBottom: 24 }}>{pct >= 80 ? (s ? s.incredibleSpelling : "¡Increíble! Your spelling is on point!") : (s ? s.keepPracticingAccents : "Keep practicing those accents and special characters!")}</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {missed.length > 0 && (
            <button onClick={() => { onBack("spell-missed", missed); }}
              style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: "#e67e22", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>{s ? s.practiceMissed(missed.length) : `Practice ${missed.length} Missed`}</button>
          )}
          <button onClick={onBack} style={{ padding: "12px 24px", borderRadius: 10, border: `1px solid ${t.border}`, background: t.surface, color: t.text, cursor: "pointer", fontSize: 15 }}>{s ? s.backToMenu : "Back to Menu"}</button>
        </div>
        <SupportBanner t={t} compact s={s} />
        <AdSlot t={t} s={s} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <ModeTopBar onBack={onBack} speed={speed} setSpeed={setSpeed} isDark={isDark} toggleDark={toggleDark} locale={locale} toggleLocale={toggleLocale} t={t} s={s} voiceId={voiceId} setVoiceId={setVoiceId} />
      <div style={{ background: t.border, borderRadius: 8, height: 6, marginBottom: 24 }}>
        <div style={{ background: "#9b59b6", height: 6, borderRadius: 8, width: `${((currentIndex + 1) / ROUND_SIZE) * 100}%`, transition: "width 0.3s" }} />
      </div>
      <div style={{ background: t.card, borderRadius: 16, padding: "22px 18px", boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.3)" : "0 4px 24px rgba(0,0,0,0.08)", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 4, marginBottom: 4 }}>
          <p style={{ fontSize: 13, color: t.textMuted }}>{s ? s.wordNOfM(currentIndex + 1, ROUND_SIZE) : `Word ${currentIndex + 1} of ${ROUND_SIZE}`}</p>
          <FavButton word={word.word} isFavorite={isFavorite} toggleFavorite={toggleFavorite} s={s} />
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <SpeakButton word={word.word} speak={speak} speed={speed} label={s ? s.listen : "Listen"} t={t} s={s} />
        </div>
        <div style={{ marginBottom: 8 }}><DefinitionDisplay word={word} t={t} s={s} /></div>
        <p style={{ fontSize: 13, color: t.textMuted, marginBottom: 16 }}>💡 {word.tip}</p>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") checkAnswer(); }}
            placeholder={s ? s.typeOrMic : "Type or use mic to spell..."} disabled={result !== null}
            style={{ flex: 1, padding: "12px 14px", fontSize: 19, borderRadius: 10, border: `2px solid ${t.border}`, textAlign: "center", fontFamily: "Georgia, serif", boxSizing: "border-box", outline: "none", background: t.surface, color: t.text }} autoFocus />
          <VoiceMicButton voice={voice} onLetter={handleVoiceLetter} disabled={result !== null} t={t} s={s} />
        </div>
        {result === null && <AccentToolbar onChar={c => setInput(prev => prev + c)} inputRef={inputRef} t={t} />}
        {result === null ? (
          <button onClick={checkAnswer} style={{ marginTop: 16, padding: "12px 32px", borderRadius: 10, border: "none", background: "#9b59b6", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>{s ? s.check : "Check ✓"}</button>
        ) : (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: result.correct ? "#059669" : "#dc2626" }}>{result.correct ? (result.accentClose ? (s ? s.correctLettersAccents : "✓ Correct letters! Accents need work.") : (s ? s.perfecto : "✓ ¡Perfecto!")) : result.similarity >= 0.8 ? (s ? s.almost(Math.round(result.similarity * 100)) : `Almost! (${Math.round(result.similarity * 100)}% match)`) : (s ? s.incorrectAnswer(result.answer) : `✗ Correct: ${result.answer}`)}</p>
            {!result.correct && <ErrorFeedback attempt={input} correct={result.answer} errorTypes={result.errorTypes} t={t} s={s} />}
            <button onClick={() => { if (currentIndex + 1 >= ROUND_SIZE) setFinished(true); else { setCurrentIndex(currentIndex + 1); setInput(""); setResult(null); } }}
              style={{ marginTop: 12, padding: "10px 28px", borderRadius: 10, border: "none", background: "#9b59b6", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>{currentIndex + 1 >= ROUND_SIZE ? (s ? s.seeResults : "See Results") : (s ? s.next : "Next →")}</button>
          </div>
        )}
      </div>
      <p style={{ textAlign: "center", color: t.textMuted, marginTop: 16, fontSize: 14 }}>{s ? s.score : "Score"}: {score}</p>
    </div>
  );
}

// ─── Listen Mode (Competition Style) ────────────────────────────────────────
function ListenMode({ onBack, speed, setSpeed, speak, speakDef, ready, t, isDark, toggleDark, recordResult, isFavorite, toggleFavorite, wordPool, s, locale, toggleLocale, voiceId, setVoiceId, prefetch }) {
  const pool = wordPool || ALL_WORDS;
  const ROUND_SIZE = Math.min(15, pool.length);
  const [words] = useState(() => shuffleArray(pool).slice(0, ROUND_SIZE));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showDef, setShowDef] = useState(false);
  const [hasListened, setHasListened] = useState(false);
  const [defLang, setDefLang] = useState("en");
  const [missed, setMissed] = useState([]);
  const inputRef = useRef(null);
  const voice = useVoiceSpelling();
  const word = words[currentIndex];
  const handleVoiceLetter = useCallback((letter) => { setInput(prev => prev + letter); }, []);

  // Prefetch upcoming words
  useEffect(() => {
    if (prefetch) prefetch(words.slice(currentIndex, currentIndex + 5));
  }, [currentIndex, prefetch, words]);

  useEffect(() => {
    if (ready && !result) {
      const timer = setTimeout(() => { speak(word.word, speed); setHasListened(true); }, 400);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, ready]);

  const handleListen = () => { speak(word.word, speed); setHasListened(true); setTimeout(() => inputRef.current?.focus(), 100); };
  const handleListenSlow = () => { speak(word.word, Math.max(0.3, speed * 0.5)); setHasListened(true); };
  const handleDefinition = () => { setShowDef(true); speakDef(word.word, defLang, speed); };
  const handleSentence = () => { speakDef(word.word, defLang, speed); };

  const checkAnswer = useCallback(() => {
    if (!input.trim()) return;
    const cmp = compareSpelling(input, word.word);
    const correct = cmp.exact || cmp.accentClose;
    if (correct) setScore(s => s + 1);
    else {
      const errors = classifyErrors(input, word.word);
      setMissed(prev => [...prev, { ...word, attempt: input, errorTypes: errors.types }]);
    }
    setResult({ correct, answer: word.word, accentClose: cmp.accentClose, similarity: cmp.similarity, errorTypes: !correct && !(cmp.exact || cmp.accentClose) ? classifyErrors(input, word.word).types : [] });
    recordResult(word.word, correct);
    voice.stop();
  }, [input, word, recordResult, voice]);

  const nextWord = () => {
    if (currentIndex + 1 >= ROUND_SIZE) { setFinished(true); }
    else { setCurrentIndex(currentIndex + 1); setInput(""); setResult(null); setShowDef(false); setHasListened(false); voice.stop(); }
  };

  if (finished) {
    const pct = Math.round((score / ROUND_SIZE) * 100);
    return (
      <div style={{ maxWidth: 500, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{pct >= 90 ? "🏆" : pct >= 70 ? "🎯" : pct >= 50 ? "💪" : "📖"}</div>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: t.text }}>{s ? s.nCorrect(score, ROUND_SIZE) : `${score} / ${ROUND_SIZE}`}</h2>
        <p style={{ color: t.textMuted, fontSize: 16, marginBottom: 24 }}>
          {pct >= 90 ? (s ? s.championEar : "¡Campeón/a! You nailed it by ear alone!") : pct >= 70 ? (s ? s.strongListening : "¡Muy bien! Strong listening skills!") : pct >= 50 ? (s ? s.goodEffort : "Good effort — the tricky ones take practice.") : (s ? s.toughMode : "This mode is tough! Review the categories and try again.")}
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => { setFinished(false); setCurrentIndex(0); setScore(0); setResult(null); setInput(""); setShowDef(false); setHasListened(false); setMissed([]); }}
            style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: "#e67e22", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>{s ? s.tryAgain : "Try Again"}</button>
          {missed.length > 0 && (
            <button onClick={() => { onBack("listen-missed", missed); }}
              style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: "#9b59b6", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>{s ? s.practiceMissed(missed.length) : `Practice ${missed.length} Missed`}</button>
          )}
          <button onClick={onBack} style={{ padding: "12px 24px", borderRadius: 10, border: `1px solid ${t.border}`, background: t.surface, color: t.text, cursor: "pointer", fontSize: 15 }}>{s ? s.backToMenu : "Back to Menu"}</button>
        </div>
        <SupportBanner t={t} compact s={s} />
        <AdSlot t={t} s={s} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <ModeTopBar onBack={onBack} speed={speed} setSpeed={setSpeed} isDark={isDark} toggleDark={toggleDark} locale={locale} toggleLocale={toggleLocale} t={t} s={s} voiceId={voiceId} setVoiceId={setVoiceId} />
      <div style={{ background: t.border, borderRadius: 8, height: 6, marginBottom: 24 }}>
        <div style={{ background: "#e67e22", height: 6, borderRadius: 8, width: `${((currentIndex + 1) / ROUND_SIZE) * 100}%`, transition: "width 0.3s" }} />
      </div>
      <div style={{ background: t.card, borderRadius: 16, padding: "22px 18px", boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.3)" : "0 4px 24px rgba(0,0,0,0.08)", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 4, marginBottom: 2 }}>
          <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: "#e67e22", fontWeight: 700 }}>🎧 {s ? s.listenAndSpell : "Listen & Spell"}</p>
          <FavButton word={word.word} isFavorite={isFavorite} toggleFavorite={toggleFavorite} s={s} />
        </div>
        <p style={{ fontSize: 13, color: t.textMuted, marginBottom: 12 }}>{s ? s.wordNOfM(currentIndex + 1, ROUND_SIZE) : `Word ${currentIndex + 1} of ${ROUND_SIZE}`}</p>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <button onClick={handleListen}
            style={{ width: 80, height: 80, borderRadius: "50%", border: "none", background: hasListened ? "#e67e22" : "#f59e0b", color: "white", fontSize: 32, cursor: "pointer", boxShadow: "0 4px 20px rgba(230,126,34,0.35)", transition: "all 0.3s", display: "flex", alignItems: "center", justifyContent: "center" }}
            title="Listen to the word">🔊</button>
        </div>

        <p style={{ fontSize: 11, color: t.textMuted, marginBottom: 6 }}>{s ? s.justLikeRealBee : "Just like the real bee — you can ask for:"}</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
          <button onClick={handleListen} style={{ padding: "7px 6px", borderRadius: 20, border: `1px solid ${t.border}`, background: t.surface, color: t.text, cursor: "pointer", fontSize: 12 }}>🔁 {s ? s.repeat : "Repeat"}</button>
          <button onClick={handleListenSlow} style={{ padding: "7px 6px", borderRadius: 20, border: `1px solid ${t.border}`, background: t.surface, color: t.text, cursor: "pointer", fontSize: 12 }}>🐢 {s ? s.slow : "Slow"}</button>
          <button onClick={handleDefinition} style={{ padding: "7px 6px", borderRadius: 20, border: `1px solid ${t.border}`, background: showDef ? (isDark ? "#1e3a5f" : "#f0f9ff") : t.surface, color: t.text, cursor: "pointer", fontSize: 12 }}>📖 {s ? s.def : "Def"}</button>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <button onClick={handleSentence} style={{ padding: "7px 14px", borderRadius: 20, border: `1px solid ${t.border}`, background: t.surface, color: t.text, cursor: "pointer", fontSize: 12 }}>💬 {s ? s.useInContext : "Use in context"}</button>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 12 }}>
          <button onClick={() => setDefLang("en")} style={{ padding: "2px 8px", borderRadius: 10, border: defLang === "en" ? "2px solid #3498db" : `1px solid ${t.border}`, background: defLang === "en" ? (isDark ? "#1e3a5f" : "#eff6ff") : t.surface, color: t.text, fontSize: 11, cursor: "pointer" }}>EN</button>
          <button onClick={() => setDefLang("es")} style={{ padding: "2px 8px", borderRadius: 10, border: defLang === "es" ? "2px solid #e67e22" : `1px solid ${t.border}`, background: defLang === "es" ? (isDark ? "#3d2a14" : "#fff7ed") : t.surface, color: t.text, fontSize: 11, cursor: "pointer" }}>ES</button>
        </div>

        {showDef && !result && (
          <p style={{ fontSize: 15, color: t.text, fontStyle: "italic", marginBottom: 12, background: isDark ? "#1e3a5f" : "#f0f9ff", padding: "8px 14px", borderRadius: 8 }}>
            {defLang === "es" ? (word.es || word.en) : word.en}
          </p>
        )}

        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") checkAnswer(); }}
            placeholder={hasListened ? (s ? s.typeOrMic : "Type or use mic to spell...") : (s ? s.pressListenFirst : "Press 🔊 first")} disabled={result !== null}
            style={{ flex: 1, padding: "12px 14px", fontSize: 20, borderRadius: 10, border: result === null ? "2px solid #f59e0b" : result.correct ? "2px solid #10b981" : "2px solid #ef4444", textAlign: "center", fontFamily: "Georgia, serif", boxSizing: "border-box", outline: "none", background: result === null ? t.surface : result.correct ? (isDark ? "#064e3b" : "#d1fae5") : (isDark ? "#7f1d1d" : "#fee2e2"), color: t.text }} autoFocus />
          <VoiceMicButton voice={voice} onLetter={handleVoiceLetter} disabled={result !== null} t={t} s={s} />
        </div>

        {result === null && <AccentToolbar onChar={c => setInput(prev => prev + c)} inputRef={inputRef} t={t} />}

        {result === null ? (
          <button onClick={checkAnswer} style={{ marginTop: 16, padding: "12px 32px", borderRadius: 10, border: "none", background: "#e67e22", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>{s ? s.check : "Check ✓"}</button>
        ) : (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: result.correct ? "#059669" : "#dc2626", marginBottom: 4 }}>{result.correct ? (result.accentClose ? (s ? s.rightLettersCheckAccents : "✓ Right letters! Check accents.") : (s ? s.correctExclaim : "✓ ¡Correcto!")) : result.similarity >= 0.8 ? (s ? s.almost(Math.round(result.similarity * 100)) : `Almost! (${Math.round(result.similarity * 100)}% match)`) : (s ? s.incorrect : "✗ Incorrect")}</p>
            {!result.correct ? <ErrorFeedback attempt={input} correct={result.answer} errorTypes={result.errorTypes} t={t} s={s} /> : <p style={{ fontSize: 26, fontWeight: 700, fontFamily: "Georgia, serif", color: t.text, marginBottom: 4 }}>{result.answer}</p>}
            <p style={{ fontSize: 13, color: "#92400e", background: "#fef3c7", padding: "8px 12px", borderRadius: 8, marginTop: 8 }}>💡 {word.tip}</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 10 }}>
              <SpeakButton word={word.word} speak={speak} speed={speed} label={s ? s.hearIt : "Hear it"} t={t} s={s} />
            </div>
            <button onClick={nextWord} style={{ marginTop: 12, padding: "10px 28px", borderRadius: 10, border: "none", background: "#e67e22", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>{currentIndex + 1 >= ROUND_SIZE ? (s ? s.seeResults : "See Results") : (s ? s.next : "Next →")}</button>
          </div>
        )}
      </div>
      <p style={{ textAlign: "center", color: t.textMuted, marginTop: 16, fontSize: 14 }}>{s ? s.score : "Score"}: {score}</p>
    </div>
  );
}

// ─── Search Component ───────────────────────────────────────────────────────
function SearchBar({ value, onChange, t, s }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder={`🔍 ${s ? s.searchWordsPlaceholder : "Search words..."}`}
        style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${t.border}`, fontSize: 15, outline: "none", boxSizing: "border-box", background: t.surface, color: t.text }} />
    </div>
  );
}

// ─── Word List Browser ──────────────────────────────────────────────────────
const ALL_LETTERS = [...new Set(ALL_WORDS.map(w => w.word[0].toUpperCase()))].sort((a, b) => a.localeCompare(b, "es"));
const CAT_ENTRIES = Object.entries(CATEGORIES);

function WordListMode({ onBack, speed, setSpeed, speak, t, isDark, toggleDark, isFavorite, toggleFavorite, getWordStats, onStudyWords, s, locale, toggleLocale, voiceId, setVoiceId }) {
  const [search, setSearch] = useState("");
  const [activeLetter, setActiveLetter] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [quickFilter, setQuickFilter] = useState(null);

  const filtered = useMemo(() => {
    let words = ALL_WORDS;
    if (search.length >= 1) {
      const q = stripAccents(search);
      words = words.filter(w =>
        stripAccents(w.word).includes(q) ||
        stripAccents(w.en).includes(q) ||
        (w.es && stripAccents(w.es).includes(q))
      );
    }
    if (activeLetter) words = words.filter(w => stripAccents(w.word[0]).toUpperCase() === stripAccents(activeLetter).toUpperCase());
    if (activeCategory) {
      const fn = CATEGORIES[activeCategory]?.filter;
      if (fn) words = words.filter(fn);
    }
    if (quickFilter === "favorites") words = words.filter(w => isFavorite(w.word));
    else if (quickFilter === "mastered") words = words.filter(w => getWordStats(w.word).mastered);
    else if (quickFilter === "not-practiced") words = words.filter(w => getWordStats(w.word).total === 0);
    return words;
  }, [search, activeLetter, activeCategory, quickFilter, isFavorite, getWordStats]);

  const handleWordClick = (w) => {
    const reordered = [w, ...filtered.filter(fw => fw.word !== w.word)];
    onStudyWords(reordered);
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <ModeTopBar onBack={onBack} backLabel={s ? s.menu : "Menu"} speed={speed} setSpeed={setSpeed} isDark={isDark} toggleDark={toggleDark} locale={locale} toggleLocale={toggleLocale} t={t} s={s} voiceId={voiceId} setVoiceId={setVoiceId} />
      <h2 style={{ fontSize: 20, fontWeight: 700, color: t.text, marginBottom: 12, textAlign: "center" }}>📖 {s ? s.wordListTitle : "Word List"}</h2>

      {/* Search */}
      <input type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder={`🔍 ${s ? s.searchWordsDefsPlaceholder : "Search words, definitions..."}`}
        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${t.border}`, fontSize: 14, outline: "none", boxSizing: "border-box", background: t.surface, color: t.text, marginBottom: 10 }} />

      {/* Letter Strip */}
      <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 6, marginBottom: 10, WebkitOverflowScrolling: "touch" }}>
        {ALL_LETTERS.map(l => (
          <button key={l} onClick={() => setActiveLetter(activeLetter === l ? null : l)}
            style={{ width: 32, height: 32, borderRadius: "50%", border: activeLetter === l ? "2px solid #3498db" : `1px solid ${t.border}`, background: activeLetter === l ? "#3498db" : t.surface, color: activeLetter === l ? "white" : t.text, cursor: "pointer", fontSize: 13, fontWeight: 600, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
            {l}
          </button>
        ))}
      </div>

      {/* Category Chips */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6, marginBottom: 10, WebkitOverflowScrolling: "touch" }}>
        {CAT_ENTRIES.map(([name, data]) => (
          <button key={name} onClick={() => setActiveCategory(activeCategory === name ? null : name)}
            style={{ padding: "5px 10px", borderRadius: 16, border: activeCategory === name ? `2px solid ${data.color}` : `1px solid ${t.border}`, background: activeCategory === name ? data.color + "20" : t.surface, color: activeCategory === name ? data.color : t.textMuted, cursor: "pointer", fontSize: 12, whiteSpace: "nowrap", flexShrink: 0, fontWeight: activeCategory === name ? 600 : 400 }}>
            {data.icon} {s && s.cat[name] ? s.cat[name] : name}
          </button>
        ))}
      </div>

      {/* Quick Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {[{ key: "favorites", label: `⭐ ${s ? s.favoritesFilter : "Favorites"}`, color: "#f59e0b" }, { key: "mastered", label: `✅ ${s ? s.masteredFilter : "Mastered"}`, color: "#10b981" }, { key: "not-practiced", label: `🆕 ${s ? s.notPracticedFilter : "Not practiced"}`, color: "#6366f1" }].map(f => (
          <button key={f.key} onClick={() => setQuickFilter(quickFilter === f.key ? null : f.key)}
            style={{ padding: "5px 10px", borderRadius: 16, border: quickFilter === f.key ? `2px solid ${f.color}` : `1px solid ${t.border}`, background: quickFilter === f.key ? f.color + "20" : t.surface, color: quickFilter === f.key ? f.color : t.textMuted, cursor: "pointer", fontSize: 12, fontWeight: quickFilter === f.key ? 600 : 400 }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <p style={{ fontSize: 13, color: t.textMuted, marginBottom: 8 }}>{s ? s.showingNOfM(filtered.length, ALL_WORDS.length) : `Showing ${filtered.length} of ${ALL_WORDS.length} words`}</p>

      {/* Word List */}
      {filtered.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", borderRadius: 12, border: `1px solid ${t.border}`, background: t.card, maxHeight: "60vh", overflowY: "auto" }}>
          {filtered.map((w, i) => {
            const stats = getWordStats(w.word);
            const dotColor = stats.mastered ? "#10b981" : stats.total > 0 ? "#f59e0b" : t.border;
            return (
              <button key={w.word} onClick={() => handleWordClick(w)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "none", border: "none", borderBottom: i < filtered.length - 1 ? `1px solid ${t.border}` : "none", cursor: "pointer", textAlign: "left", width: "100%" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0 }} title={stats.mastered ? (s ? s.mastered : "Mastered") : stats.total > 0 ? (s ? s.practiced : "Practiced") : (s ? s.notPracticed : "Not practiced")} />
                <span style={{ fontWeight: 600, color: t.text, fontSize: 15, fontFamily: "Georgia, serif", flexShrink: 0 }}>{w.word}</span>
                <span style={{ color: t.textMuted, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{w.en}</span>
                <FavButton word={w.word} isFavorite={isFavorite} toggleFavorite={toggleFavorite} s={s} />
              </button>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "40px 20px", color: t.textMuted }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>🔍</p>
          <p style={{ fontSize: 15 }}>{s ? s.noWordsMatchFilters : "No words match your filters"}</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>{s ? s.tryAdjusting : "Try adjusting your search or removing filters"}</p>
        </div>
      )}
    </div>
  );
}

// ─── Progress Dashboard ─────────────────────────────────────────────────────
function ProgressDashboard({ onBack, getOverallStats, getStreakStats, getCategoryStats, getRecentWords, resetProgress, onStartPractice, t, isDark, toggleDark, s, locale, toggleLocale, speed, setSpeed, voiceId, setVoiceId }) {
  const overall = getOverallStats();
  const streakStats = getStreakStats();
  const recentWords = getRecentWords();
  const hasProgress = overall.totalPracticed > 0;

  const handleReset = () => {
    if (window.confirm(s.resetConfirm)) resetProgress();
  };

  // 30-day heatmap data
  const heatmapDays = [];
  const dateSet = new Set(streakStats.studyDates);
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const ds = d.toISOString().slice(0, 10);
    heatmapDays.push({ date: ds, active: dateSet.has(ds), label: d.getDate() });
  }

  const statBox = (label, value, color) => (
    <div style={{ flex: "1 1 45%", padding: "16px 12px", borderRadius: 12, background: t.card, border: `1px solid ${t.border}`, textAlign: "center" }}>
      <p style={{ fontSize: 28, fontWeight: 700, color, marginBottom: 2 }}>{value}</p>
      <p style={{ fontSize: 12, color: t.textMuted, fontWeight: 500 }}>{label}</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <ModeTopBar onBack={onBack} speed={speed} setSpeed={setSpeed} isDark={isDark} toggleDark={toggleDark} locale={locale} toggleLocale={toggleLocale} t={t} s={s} voiceId={voiceId} setVoiceId={setVoiceId} />

      <h2 style={{ fontSize: 22, fontWeight: 700, color: t.text, marginBottom: 20, textAlign: "center" }}>📊 {s.progressDashboard}</h2>

      {!hasProgress ? (
        <div style={{ textAlign: "center", padding: "48px 20px" }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>📚</p>
          <p style={{ fontSize: 18, fontWeight: 600, color: t.text, marginBottom: 8 }}>{s.noProgressYet}</p>
          <p style={{ fontSize: 14, color: t.textMuted, marginBottom: 24 }}>{s.startPracticingPrompt}</p>
          <button onClick={onStartPractice} style={{ padding: "12px 32px", borderRadius: 10, border: "none", background: "#e67e22", color: "white", cursor: "pointer", fontSize: 16, fontWeight: 600 }}>🎧 {s.startPracticing}</button>
        </div>
      ) : (
        <>
          {/* Overall Stats Grid */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
            {statBox(s.wordsPracticed, overall.totalPracticed, "#6366f1")}
            {statBox(s.wordsMastered, overall.totalMastered, "#10b981")}
            {statBox(s.totalAttempts, overall.totalAttempts, "#3498db")}
            {statBox(s.overallAccuracy, `${overall.overallAccuracy}%`, overall.overallAccuracy >= 80 ? "#10b981" : overall.overallAccuracy >= 50 ? "#f59e0b" : "#ef4444")}
          </div>

          {/* Streak Card */}
          <div style={{ padding: "18px", borderRadius: 12, background: t.card, border: `1px solid ${t.border}`, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: t.text, marginBottom: 14 }}>🔥 {s.studyStreak}</h3>
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1, textAlign: "center" }}>
                <p style={{ fontSize: 24, fontWeight: 700, color: streakStats.currentStreak > 0 ? "#f59e0b" : t.textMuted }}>{streakStats.currentStreak} {streakStats.currentStreak > 0 ? "🔥" : ""}</p>
                <p style={{ fontSize: 12, color: t.textMuted }}>{s.currentStreak}</p>
              </div>
              <div style={{ flex: 1, textAlign: "center" }}>
                <p style={{ fontSize: 24, fontWeight: 700, color: "#6366f1" }}>{streakStats.longestStreak}</p>
                <p style={{ fontSize: 12, color: t.textMuted }}>{s.longestStreak}</p>
              </div>
              <div style={{ flex: 1, textAlign: "center" }}>
                <p style={{ fontSize: 24, fontWeight: 700, color: "#3498db" }}>{streakStats.totalDays}</p>
                <p style={{ fontSize: 12, color: t.textMuted }}>{s.daysStudied}</p>
              </div>
            </div>
            {/* 30-day heatmap */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 3 }}>
              {heatmapDays.map(d => (
                <div key={d.date} title={d.date} style={{
                  aspectRatio: "1", borderRadius: 3, background: d.active ? "#10b981" : (isDark ? "#333" : "#e5e7eb"),
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: d.active ? "white" : t.textMuted,
                }}>{d.label}</div>
              ))}
            </div>
          </div>

          {/* Category Progress */}
          <div style={{ padding: "18px", borderRadius: 12, background: t.card, border: `1px solid ${t.border}`, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: t.text, marginBottom: 14 }}>📚 {s.categoryProgress}</h3>
            {Object.entries(CATEGORIES)
              .map(([name, data]) => ({ name, data, stats: getCategoryStats(categoryWords[name] || []) }))
              .sort((a, b) => b.stats.percent - a.stats.percent)
              .map(({ name, data, stats }) => (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 16, width: 24, textAlign: "center", flexShrink: 0 }}>{data.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.cat[name] || name}</span>
                      <span style={{ fontSize: 11, color: t.textMuted, flexShrink: 0, marginLeft: 8 }}>{stats.mastered}/{stats.total}</span>
                    </div>
                    <div style={{ background: isDark ? "#333" : "#e5e7eb", borderRadius: 4, height: 6 }}>
                      <div style={{ background: data.color, height: 6, borderRadius: 4, width: `${stats.percent}%`, transition: "width 0.5s" }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: stats.percent >= 80 ? "#10b981" : stats.percent > 0 ? data.color : t.textMuted, width: 36, textAlign: "right", flexShrink: 0 }}>{stats.percent}%</span>
                </div>
              ))}
          </div>

          {/* Recent Activity */}
          {recentWords.length > 0 && (
            <div style={{ padding: "18px", borderRadius: 12, background: t.card, border: `1px solid ${t.border}`, marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: t.text, marginBottom: 14 }}>🕐 {s.recentActivity}</h3>
              {recentWords.map(w => {
                const total = w.correct + w.wrong;
                const lastCorrect = w.correct > w.wrong;
                return (
                  <div key={w.word} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${t.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>{lastCorrect ? "✓" : "✗"}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: t.text, fontFamily: "Georgia, serif" }}>{w.word}</span>
                    </div>
                    <span style={{ fontSize: 12, color: t.textMuted }}>{w.correct}/{total}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Reset */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <button onClick={handleReset} style={{ padding: "10px 24px", borderRadius: 8, border: `1px solid ${isDark ? "#555" : "#ddd"}`, background: "none", color: "#ef4444", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>{s.resetProgress}</button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Countdown Timer ─────────────────────────────────────────────────────────
const NSSB_DATE = new Date("2026-07-10T09:00:00-06:00"); // July 10, 2026, 9 AM MDT
const NSSB_URL = "https://nationalspanishspellingbee.com/";

function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, targetDate - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setTimeLeft(Math.max(0, targetDate - Date.now())), 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  const days = Math.floor(timeLeft / 86400000);
  const hours = Math.floor((timeLeft % 86400000) / 3600000);
  const mins = Math.floor((timeLeft % 3600000) / 60000);
  const secs = Math.floor((timeLeft % 60000) / 1000);
  return { days, hours, mins, secs, isPast: timeLeft === 0 };
}

function CountdownBanner({ t, isDark, s }) {
  const { days, hours, mins, secs, isPast } = useCountdown(NSSB_DATE);
  if (isPast) return (
    <div style={{ textAlign: "center", padding: "12px 16px", borderRadius: 12, background: "linear-gradient(135deg, #10b981, #059669)", color: "white", marginBottom: 20 }}>
      <p style={{ fontSize: 14, fontWeight: 600 }}>🎉 {s.countdownPast}</p>
    </div>
  );
  const box = (value, label) => (
    <div style={{ textAlign: "center", flex: 1 }}>
      <p style={{ fontSize: 24, fontWeight: 800, color: "#e67e22", fontVariantNumeric: "tabular-nums" }}>{String(value).padStart(2, "0")}</p>
      <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: t.textMuted, fontWeight: 600 }}>{label}</p>
    </div>
  );
  return (
    <a href={NSSB_URL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block", marginBottom: 20 }}>
      <div style={{ padding: "14px 16px", borderRadius: 12, border: `1px solid ${t.border}`, background: t.card, textAlign: "center", cursor: "pointer", transition: "box-shadow 0.2s" }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = isDark ? "0 2px 12px rgba(0,0,0,0.2)" : "0 2px 12px rgba(0,0,0,0.08)"} onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
        <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: "#e67e22", fontWeight: 700, marginBottom: 8 }}>{s.countdown}</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
          {box(days, s.countdownDays)}
          <span style={{ fontSize: 20, color: t.textMuted, alignSelf: "flex-start", marginTop: 2 }}>:</span>
          {box(hours, s.countdownHours)}
          <span style={{ fontSize: 20, color: t.textMuted, alignSelf: "flex-start", marginTop: 2 }}>:</span>
          {box(mins, s.countdownMins)}
          <span style={{ fontSize: 20, color: t.textMuted, alignSelf: "flex-start", marginTop: 2 }}>:</span>
          {box(secs, s.countdownSecs)}
        </div>
        <p style={{ fontSize: 12, color: t.textMuted, marginTop: 6 }}>{s.nssbEvent2026}</p>
      </div>
    </a>
  );
}

// ─── About Page ──────────────────────────────────────────────────────────────
function AboutPage({ onBack, t, isDark, toggleDark, s, locale, toggleLocale, speed, setSpeed, voiceId, setVoiceId }) {
  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <ModeTopBar onBack={onBack} backLabel={s.menu} speed={speed} setSpeed={setSpeed} isDark={isDark} toggleDark={toggleDark} locale={locale} toggleLocale={toggleLocale} t={t} s={s} voiceId={voiceId} setVoiceId={setVoiceId} />

      {/* About eSpellñol */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <p style={{ fontSize: 48, marginBottom: 8 }}>🐝</p>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: t.text, marginBottom: 4 }}>{s.aboutEspellnol}</h2>
      </div>

      <div style={{ padding: "20px", borderRadius: 12, background: t.card, border: `1px solid ${t.border}`, marginBottom: 20 }}>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: t.text, marginBottom: 14 }}>{s.aboutStory}</p>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: t.text, marginBottom: 14 }}>{s.aboutMission}</p>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: t.textMuted, fontStyle: "italic" }}>{s.aboutFree}</p>
      </div>

      {/* NSSB Info */}
      <div style={{ padding: "20px", borderRadius: 12, background: t.card, border: `1px solid ${t.border}`, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "#e67e2218", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 20 }}>🏆</div>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: t.text }}>{s.nssbFull}</h3>
            <p style={{ fontSize: 12, color: "#e67e22", fontWeight: 600 }}>{s.nssbAcronym} · {s.nssbEligibility}</p>
          </div>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: t.text, marginBottom: 12 }}>{s.nssbAbout}</p>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: t.text, marginBottom: 12 }}>{s.nssbHistory}</p>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: t.text, marginBottom: 12 }}>{s.nssbHost}</p>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: t.textMuted, fontStyle: "italic", marginBottom: 16 }}>{s.nssbMission}</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <a href={NSSB_URL} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 20px", borderRadius: 10, border: "none", background: "#e67e22", color: "white", fontSize: 14, fontWeight: 600, textDecoration: "none", cursor: "pointer", transition: "opacity 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.85"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            🌐 {s.nssbWebsite} — nationalspanishspellingbee.com
          </a>
          <a href="https://nmabe.org/national-spanish-bee" target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 20px", borderRadius: 10, border: `1px solid ${t.border}`, background: t.surface, color: t.text, fontSize: 13, textDecoration: "none", cursor: "pointer" }}>
            📚 ABE-NM — nmabe.org
          </a>
          <a href="https://www.youtube.com/playlist?list=PL-YRV1hOor0Wsk7r1ziDBdEl0pnLuz5Kh" target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 20px", borderRadius: 10, border: `1px solid ${t.border}`, background: t.surface, color: t.text, fontSize: 13, textDecoration: "none", cursor: "pointer" }}>
            🎬 NSSB Competition Videos — YouTube
          </a>
        </div>
      </div>

      {/* Countdown */}
      <CountdownBanner t={t} isDark={isDark} s={s} />

      <p style={{ textAlign: "center", color: t.textMuted, fontSize: 13, marginTop: 12 }}>❤️ {s.madeWithLove}</p>
    </div>
  );
}

// ─── Smart Review Mode (Spaced Repetition) ──────────────────────────────────
function SmartReviewMode({ onBack, speed, setSpeed, speak, ready, t, isDark, toggleDark, recordResult, isFavorite, toggleFavorite, dueWords, s, locale, toggleLocale, voiceId, setVoiceId, prefetch }) {
  const ROUND_SIZE = dueWords.length;
  const [words] = useState(() => dueWords);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [finished, setFinished] = useState(false);
  const [promoted, setPromoted] = useState(0);
  const [resetCount, setResetCount] = useState(0);
  const [hasListened, setHasListened] = useState(false);
  const inputRef = useRef(null);
  const voice = useVoiceSpelling();
  const word = words[currentIndex];
  const handleVoiceLetter = useCallback((letter) => { setInput(prev => prev + letter); }, []);

  // Prefetch upcoming words
  useEffect(() => {
    if (prefetch) prefetch(words.slice(currentIndex, currentIndex + 5));
  }, [currentIndex, prefetch, words]);

  useEffect(() => {
    if (ready && !result && word) {
      const timer = setTimeout(() => { speak(word.word, speed); setHasListened(true); }, 400);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, ready]);

  const checkAnswer = useCallback(() => {
    if (!input.trim()) return;
    const cmp = compareSpelling(input, word.word);
    const correct = cmp.exact || cmp.accentClose;
    if (correct) setPromoted(p => p + 1);
    else setResetCount(r => r + 1);
    const errorTypes = !correct ? classifyErrors(input, word.word).types : [];
    setResult({ correct, answer: word.word, accentClose: cmp.accentClose, similarity: cmp.similarity, errorTypes });
    recordResult(word.word, correct);
    voice.stop();
  }, [input, word, recordResult, voice]);

  const nextWord = () => {
    if (currentIndex + 1 >= ROUND_SIZE) setFinished(true);
    else { setCurrentIndex(currentIndex + 1); setInput(""); setResult(null); setHasListened(false); voice.stop(); }
  };

  if (!word || ROUND_SIZE === 0) return (
    <div style={{ maxWidth: 500, margin: "0 auto", textAlign: "center", padding: "48px 20px" }}>
      <p style={{ fontSize: 48, marginBottom: 12 }}>🎉</p>
      <p style={{ fontSize: 18, fontWeight: 600, color: t.text, marginBottom: 8 }}>{s.noWordsDue}</p>
      <button onClick={onBack} style={{ padding: "12px 24px", borderRadius: 10, border: `1px solid ${t.border}`, background: t.surface, color: t.text, cursor: "pointer", fontSize: 15 }}>{s.backToMenu}</button>
    </div>
  );

  if (finished) {
    return (
      <div style={{ maxWidth: 500, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: t.text }}>{s.reviewComplete}</h2>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 24 }}>
          <div style={{ padding: "12px 20px", borderRadius: 12, background: isDark ? "#064e3b" : "#d1fae5", border: "1px solid #10b981" }}>
            <p style={{ fontSize: 24, fontWeight: 700, color: "#059669" }}>⬆ {promoted}</p>
            <p style={{ fontSize: 12, color: "#059669" }}>{s.wordsPromoted(promoted)}</p>
          </div>
          {resetCount > 0 && (
            <div style={{ padding: "12px 20px", borderRadius: 12, background: isDark ? "#7f1d1d" : "#fee2e2", border: "1px solid #ef4444" }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: "#dc2626" }}>⬇ {resetCount}</p>
              <p style={{ fontSize: 12, color: "#dc2626" }}>{s.wordsReset(resetCount)}</p>
            </div>
          )}
        </div>
        <button onClick={onBack} style={{ padding: "12px 24px", borderRadius: 10, border: `1px solid ${t.border}`, background: t.surface, color: t.text, cursor: "pointer", fontSize: 15 }}>{s.backToMenu}</button>
        <SupportBanner t={t} compact s={s} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <ModeTopBar onBack={onBack} backLabel={s.menu} speed={speed} setSpeed={setSpeed} isDark={isDark} toggleDark={toggleDark} locale={locale} toggleLocale={toggleLocale} t={t} s={s} voiceId={voiceId} setVoiceId={setVoiceId} />
      <div style={{ background: t.border, borderRadius: 8, height: 6, marginBottom: 24 }}>
        <div style={{ background: "#10b981", height: 6, borderRadius: 8, width: `${((currentIndex + 1) / ROUND_SIZE) * 100}%`, transition: "width 0.3s" }} />
      </div>
      <div style={{ background: t.card, borderRadius: 16, padding: "22px 18px", boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.3)" : "0 4px 24px rgba(0,0,0,0.08)", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 4, marginBottom: 2 }}>
          <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: "#10b981", fontWeight: 700 }}>🧠 {s.smartReview}</p>
          <FavButton word={word.word} isFavorite={isFavorite} toggleFavorite={toggleFavorite} s={s} />
        </div>
        <p style={{ fontSize: 13, color: t.textMuted, marginBottom: 12 }}>{s.wordNOfM(currentIndex + 1, ROUND_SIZE)}</p>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <button onClick={() => { speak(word.word, speed); setHasListened(true); }}
            style={{ width: 80, height: 80, borderRadius: "50%", border: "none", background: hasListened ? "#10b981" : "#34d399", color: "white", fontSize: 32, cursor: "pointer", boxShadow: "0 4px 20px rgba(16,185,129,0.35)", transition: "all 0.3s", display: "flex", alignItems: "center", justifyContent: "center" }}>🔊</button>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") checkAnswer(); }}
            placeholder={hasListened ? (s.typeOrMic) : (s.pressListenFirst)} disabled={result !== null}
            style={{ flex: 1, padding: "12px 14px", fontSize: 20, borderRadius: 10, border: result === null ? "2px solid #34d399" : result.correct ? "2px solid #10b981" : "2px solid #ef4444", textAlign: "center", fontFamily: "Georgia, serif", boxSizing: "border-box", outline: "none", background: result === null ? t.surface : result.correct ? (isDark ? "#064e3b" : "#d1fae5") : (isDark ? "#7f1d1d" : "#fee2e2"), color: t.text }} autoFocus />
          <VoiceMicButton voice={voice} onLetter={handleVoiceLetter} disabled={result !== null} t={t} s={s} />
        </div>

        {result === null && <AccentToolbar onChar={c => setInput(prev => prev + c)} inputRef={inputRef} t={t} />}

        {result === null ? (
          <button onClick={checkAnswer} style={{ marginTop: 16, padding: "12px 32px", borderRadius: 10, border: "none", background: "#10b981", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>{s.check}</button>
        ) : (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: result.correct ? "#059669" : "#dc2626", marginBottom: 4 }}>
              {result.correct ? (s.correctExclaim) : (s.incorrect)}
            </p>
            <p style={{ fontSize: 13, fontWeight: 600, color: result.correct ? "#059669" : "#dc2626", padding: "4px 12px", borderRadius: 8, background: result.correct ? (isDark ? "#064e3b" : "#ecfdf5") : (isDark ? "#7f1d1d" : "#fef2f2"), display: "inline-block", marginBottom: 8 }}>
              {result.correct ? `⬆ ${s.boxPromoted}` : `⬇ ${s.boxReset}`}
            </p>
            {!result.correct && <ErrorFeedback attempt={input} correct={result.answer} errorTypes={result.errorTypes} t={t} s={s} />}
            {result.correct && <p style={{ fontSize: 26, fontWeight: 700, fontFamily: "Georgia, serif", color: t.text, marginBottom: 4 }}>{result.answer}</p>}
            <button onClick={nextWord} style={{ marginTop: 12, padding: "10px 28px", borderRadius: 10, border: "none", background: "#10b981", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>{currentIndex + 1 >= ROUND_SIZE ? (s.seeResults) : (s.next)}</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Smart Practice Mode (Test-Study-Test Cycle) ────────────────────────────
function SmartPracticeMode({ onBack, speed, setSpeed, speak, ready, t, isDark, toggleDark, recordResult, isFavorite, toggleFavorite, s, locale, toggleLocale, wordPool, voiceId, setVoiceId, prefetch }) {
  const [phase, setPhase] = useState("setup"); // setup | test | results | study | retest
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [testWords, setTestWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [missed, setMissed] = useState([]); // { ...word, attempt, errorTypes }
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [hasListened, setHasListened] = useState(false);
  const inputRef = useRef(null);
  const voice = useVoiceSpelling();
  const word = testWords[currentIndex];
  const handleVoiceLetter = useCallback((letter) => { setInput(prev => prev + letter); }, []);

  // Prefetch upcoming test words
  useEffect(() => {
    if (prefetch && testWords.length) prefetch(testWords.slice(currentIndex, currentIndex + 5));
  }, [currentIndex, prefetch, testWords]);

  const startTest = (pool) => {
    const words = shuffleArray(pool).slice(0, Math.min(10, pool.length));
    setTestWords(words);
    setCurrentIndex(0);
    setInput("");
    setResult(null);
    setMissed([]);
    setScore(0);
    setHasListened(false);
    setPhase("test");
  };

  useEffect(() => {
    if ((phase === "test" || phase === "retest") && ready && !result && word) {
      const timer = setTimeout(() => { speak(word.word, speed); setHasListened(true); }, 400);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, ready, phase]);

  const checkAnswer = useCallback(() => {
    if (!input.trim() || !word) return;
    const cmp = compareSpelling(input, word.word);
    const correct = cmp.exact || cmp.accentClose;
    if (correct) setScore(s => s + 1);
    else {
      const errors = classifyErrors(input, word.word);
      setMissed(prev => [...prev, { ...word, attempt: input, errorTypes: errors.types }]);
    }
    const errorTypes = !correct ? classifyErrors(input, word.word).types : [];
    setResult({ correct, answer: word.word, accentClose: cmp.accentClose, similarity: cmp.similarity, errorTypes });
    recordResult(word.word, correct);
    voice.stop();
  }, [input, word, recordResult, voice]);

  const nextWord = () => {
    if (currentIndex + 1 >= testWords.length) {
      setPhase("results");
    } else {
      setCurrentIndex(currentIndex + 1);
      setInput("");
      setResult(null);
      setHasListened(false);
      voice.stop();
    }
  };

  // SETUP phase
  if (phase === "setup") {
    const catEntries = Object.entries(CATEGORIES);
    return (
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <ModeTopBar onBack={onBack} backLabel={s.menu} speed={speed} setSpeed={setSpeed} isDark={isDark} toggleDark={toggleDark} locale={locale} toggleLocale={toggleLocale} t={t} s={s} voiceId={voiceId} setVoiceId={setVoiceId} />
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <p style={{ fontSize: 40, marginBottom: 8 }}>🧪</p>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: t.text, marginBottom: 4 }}>{s.smartPractice}</h2>
          <p style={{ fontSize: 14, color: t.textMuted }}>{s.smartPracticeDesc}</p>
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 8 }}>{s.selectCategory}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
          <button onClick={() => { setSelectedCategory(null); startTest(wordPool || ALL_WORDS); }}
            style={{ padding: "14px 18px", borderRadius: 10, border: selectedCategory === null ? "2px solid #10b981" : `1px solid ${t.border}`, background: t.card, color: t.text, cursor: "pointer", fontSize: 15, fontWeight: 600, textAlign: "left" }}>
            🌐 {s.allCategories} <span style={{ color: t.textMuted, fontWeight: 400, fontSize: 13 }}>({(wordPool || ALL_WORDS).length})</span>
          </button>
          {catEntries.map(([name, data]) => {
            const words = categoryWords[name] || [];
            if (words.length === 0) return null;
            return (
              <button key={name} onClick={() => { setSelectedCategory(name); startTest(words); }}
                style={{ padding: "12px 18px", borderRadius: 10, border: `1px solid ${t.border}`, background: t.card, color: t.text, cursor: "pointer", fontSize: 14, textAlign: "left" }}>
                {data.icon} {s.cat[name] || name} <span style={{ color: t.textMuted, fontSize: 12 }}>({words.length})</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // RESULTS phase
  if (phase === "results") {
    // Group errors by type
    const errorGroups = {};
    missed.forEach(m => {
      (m.errorTypes || ["other"]).forEach(type => {
        if (!errorGroups[type]) errorGroups[type] = [];
        if (!errorGroups[type].find(w => w.word === m.word)) errorGroups[type].push(m);
      });
    });
    const allCorrect = missed.length === 0;

    return (
      <div style={{ maxWidth: 500, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{allCorrect ? "🎉" : "📊"}</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, color: t.text }}>
          {allCorrect ? s.allWordsMastered : s.nCorrect(score, testWords.length)}
        </h2>
        {round > 1 && <p style={{ fontSize: 14, color: "#10b981", fontWeight: 600, marginBottom: 4 }}>{s.roundN(round)}</p>}
        {allCorrect && round > 1 && <p style={{ fontSize: 16, color: "#059669", fontWeight: 600, marginBottom: 16 }}>{s.completedInRounds(round)}</p>}

        {!allCorrect && Object.keys(errorGroups).length > 0 && (
          <div style={{ textAlign: "left", marginTop: 16, marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: t.text, marginBottom: 10 }}>{s.errorsByType}</h3>
            {Object.entries(errorGroups).map(([type, words]) => (
              <div key={type} style={{ marginBottom: 10, padding: "10px 14px", borderRadius: 10, background: t.card, border: `1px solid ${t.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600, background: (ERROR_TYPE_COLORS[type] || "#95a5a6") + "20", color: ERROR_TYPE_COLORS[type] || "#95a5a6" }}>
                    {s[ERROR_TYPE_KEYS[type]] || type}
                  </span>
                  <span style={{ fontSize: 12, color: t.textMuted }}>{words.length} word{words.length !== 1 ? "s" : ""}</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {words.map(w => (
                    <span key={w.word} style={{ padding: "3px 8px", borderRadius: 6, fontSize: 13, fontFamily: "Georgia, serif", background: t.surface, border: `1px solid ${t.border}`, color: t.text }}>{w.word}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {!allCorrect && (
            <button onClick={() => {
              setPhase("study");
            }}
              style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: "#10b981", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>{s.continueToStudy}</button>
          )}
          <button onClick={onBack} style={{ padding: "12px 24px", borderRadius: 10, border: `1px solid ${t.border}`, background: t.surface, color: t.text, cursor: "pointer", fontSize: 15 }}>{allCorrect ? s.backToMenu : s.exitPractice}</button>
        </div>
        {allCorrect && <SupportBanner t={t} compact s={s} />}
      </div>
    );
  }

  // STUDY phase — reuse StudyMode with missed words
  if (phase === "study") {
    const missedWordObjs = missed.map(m => ({ word: m.word, en: m.en, es: m.es, tip: m.tip }));
    return (
      <StudyMode
        words={missedWordObjs}
        category={s.studyMissedWords}
        catColor="#10b981"
        onBack={() => {
          // Move to retest phase
          const retestWords = missed.map(m => ({ word: m.word, en: m.en, es: m.es, tip: m.tip }));
          setTestWords(shuffleArray(retestWords));
          setCurrentIndex(0);
          setInput("");
          setResult(null);
          setMissed([]);
          setScore(0);
          setRound(r => r + 1);
          setHasListened(false);
          setPhase("retest");
        }}
        speed={speed} setSpeed={setSpeed} speak={speak} t={t} isDark={isDark} toggleDark={toggleDark}
        isFavorite={isFavorite} toggleFavorite={toggleFavorite} s={s} locale={locale} toggleLocale={toggleLocale}
      />
    );
  }

  // TEST / RETEST phase
  if (!word) return null;
  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <ModeTopBar onBack={onBack} backLabel={s.menu} speed={speed} setSpeed={setSpeed} isDark={isDark} toggleDark={toggleDark} locale={locale} toggleLocale={toggleLocale} t={t} s={s} voiceId={voiceId} setVoiceId={setVoiceId} />
      <div style={{ background: t.border, borderRadius: 8, height: 6, marginBottom: 24 }}>
        <div style={{ background: "#10b981", height: 6, borderRadius: 8, width: `${((currentIndex + 1) / testWords.length) * 100}%`, transition: "width 0.3s" }} />
      </div>
      <div style={{ background: t.card, borderRadius: 16, padding: "22px 18px", boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.3)" : "0 4px 24px rgba(0,0,0,0.08)", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 4, marginBottom: 2 }}>
          <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: "#10b981", fontWeight: 700 }}>
            🧪 {phase === "retest" ? s.retestPhase : s.diagnosticQuiz} {round > 1 ? `· ${s.roundN(round)}` : ""}
          </p>
          <FavButton word={word.word} isFavorite={isFavorite} toggleFavorite={toggleFavorite} s={s} />
        </div>
        <p style={{ fontSize: 13, color: t.textMuted, marginBottom: 12 }}>{s.wordNOfM(currentIndex + 1, testWords.length)}</p>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <button onClick={() => { speak(word.word, speed); setHasListened(true); }}
            style={{ width: 80, height: 80, borderRadius: "50%", border: "none", background: hasListened ? "#10b981" : "#34d399", color: "white", fontSize: 32, cursor: "pointer", boxShadow: "0 4px 20px rgba(16,185,129,0.35)", transition: "all 0.3s", display: "flex", alignItems: "center", justifyContent: "center" }}>🔊</button>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") checkAnswer(); }}
            placeholder={hasListened ? s.typeOrMic : s.pressListenFirst} disabled={result !== null}
            style={{ flex: 1, padding: "12px 14px", fontSize: 20, borderRadius: 10, border: result === null ? "2px solid #34d399" : result.correct ? "2px solid #10b981" : "2px solid #ef4444", textAlign: "center", fontFamily: "Georgia, serif", boxSizing: "border-box", outline: "none", background: result === null ? t.surface : result.correct ? (isDark ? "#064e3b" : "#d1fae5") : (isDark ? "#7f1d1d" : "#fee2e2"), color: t.text }} autoFocus />
          <VoiceMicButton voice={voice} onLetter={handleVoiceLetter} disabled={result !== null} t={t} s={s} />
        </div>

        {result === null && <AccentToolbar onChar={c => setInput(prev => prev + c)} inputRef={inputRef} t={t} />}

        {result === null ? (
          <button onClick={checkAnswer} style={{ marginTop: 16, padding: "12px 32px", borderRadius: 10, border: "none", background: "#10b981", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>{s.check}</button>
        ) : (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: result.correct ? "#059669" : "#dc2626", marginBottom: 4 }}>
              {result.correct ? (result.accentClose ? s.rightLettersCheckAccents : s.correctExclaim) : result.similarity >= 0.8 ? s.almost(Math.round(result.similarity * 100)) : s.incorrect}
            </p>
            {!result.correct ? <ErrorFeedback attempt={input} correct={result.answer} errorTypes={result.errorTypes} t={t} s={s} /> : <p style={{ fontSize: 26, fontWeight: 700, fontFamily: "Georgia, serif", color: t.text, marginBottom: 4 }}>{result.answer}</p>}
            <button onClick={nextWord} style={{ marginTop: 12, padding: "10px 28px", borderRadius: 10, border: "none", background: "#10b981", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>{currentIndex + 1 >= testWords.length ? s.seeResults : s.next}</button>
          </div>
        )}
      </div>
      <p style={{ textAlign: "center", color: t.textMuted, marginTop: 16, fontSize: 14 }}>{s.score}: {score}</p>
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [mode, setMode] = useState("menu");
  const [studyCategory, setStudyCategory] = useState(null);
  const [customWordPool, setCustomWordPool] = useState(null);
  const [modeKey, setModeKey] = useState(0);
  const [speed, setSpeed] = useState(() => {
    try { return parseFloat(localStorage.getItem("sbb_speed")) || 0.8; } catch { return 0.8; }
  });
  const [search, setSearch] = useState("");
  const { speak, speakDef, ready, voiceId, setVoiceId, prefetch } = useAudio();
  const { isDark, toggleDark } = useDarkMode();
  const { locale, toggleLocale, s } = useLocale();
  const { progress, recordResult, getWordStats, getCategoryStats, getMasteredCount, getOverallStats, getStreakStats, getRecentWords, getWordsForReview, getDueCount, getSrsStats, resetProgress } = useProgress();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const t = isDark ? DARK_THEME : LIGHT_THEME;

  useEffect(() => {
    try { localStorage.setItem("sbb_speed", speed.toString()); } catch {}
  }, [speed]);

  const [searchStudyWords, setSearchStudyWords] = useState(null);
  const [wordlistStudyWords, setWordlistStudyWords] = useState(null);

  const filteredWords = useMemo(() => {
    if (!search || search.length < 2) return [];
    const q = search.toLowerCase();
    return ALL_WORDS.filter(w =>
      w.word.toLowerCase().includes(q) ||
      w.en.toLowerCase().includes(q) ||
      (w.es && w.es.toLowerCase().includes(q))
    );
  }, [search]);

  const filteredCategories = useMemo(() => {
    if (!search) return Object.entries(CATEGORIES);
    const q = search.toLowerCase();
    return Object.entries(CATEGORIES).filter(([name]) => {
      if (name.toLowerCase().includes(q)) return true;
      return categoryWords[name]?.some(w => w.word.toLowerCase().includes(q));
    });
  }, [search]);

  const masteredCount = getMasteredCount();
  const favWords = useMemo(() => ALL_WORDS.filter(w => favorites.has(w.word)), [favorites]);

  const goBack = useCallback((retryMode, missedWords) => {
    if (retryMode === "spell-missed" && missedWords?.length) {
      setCustomWordPool(missedWords);
      setModeKey(k => k + 1);
      setMode("spell");
      return;
    }
    if (retryMode === "listen-missed" && missedWords?.length) {
      setCustomWordPool(missedWords);
      setModeKey(k => k + 1);
      setMode("listen");
      return;
    }
    setMode("menu");
    setStudyCategory(null);
    setCustomWordPool(null);
  }, []);

  const startCategoryMode = (modeName, catName) => {
    setCustomWordPool(categoryWords[catName] || []);
    setModeKey(k => k + 1);
    setMode(modeName);
  };

  const sharedProps = { speed, setSpeed, speak, speakDef, t, isDark, toggleDark, recordResult, isFavorite, toggleFavorite, s, locale, toggleLocale, voiceId, setVoiceId, prefetch };

  const wrapper = (children) => (
    <div style={{ minHeight: "100vh", background: t.bg, padding: "24px 16px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", transition: "background 0.3s" }}>
      {children}
    </div>
  );

  if (mode === "study" && studyCategory) {
    const cat = CATEGORIES[studyCategory];
    const words = categoryWords[studyCategory] || [];
    return wrapper(
      <StudyMode words={words} category={studyCategory} catColor={cat?.color} onBack={() => goBack()} {...sharedProps} />
    );
  }
  if (mode === "study-favorites") {
    return wrapper(
      <StudyMode words={favWords} category={s ? s.favorites : "Favorites"} catColor="#f59e0b" onBack={() => goBack()} {...sharedProps} />
    );
  }
  if (mode === "study-search" && searchStudyWords) {
    return wrapper(
      <StudyMode words={searchStudyWords} category={s ? s.searchResults : "Search Results"} catColor="#6366f1" onBack={() => { goBack(); }} {...sharedProps} />
    );
  }
  if (mode === "wordlist") {
    return wrapper(
      <WordListMode onBack={() => goBack()} speed={speed} setSpeed={setSpeed} speak={speak} t={t} isDark={isDark} toggleDark={toggleDark} isFavorite={isFavorite} toggleFavorite={toggleFavorite} getWordStats={getWordStats} onStudyWords={(words) => { setWordlistStudyWords(words); setMode("study-wordlist"); }} s={s} locale={locale} toggleLocale={toggleLocale} voiceId={voiceId} setVoiceId={setVoiceId} />
    );
  }
  if (mode === "study-wordlist" && wordlistStudyWords) {
    return wrapper(
      <StudyMode words={wordlistStudyWords} category={s ? s.wordList : "Word List"} catColor="#6366f1" onBack={() => setMode("wordlist")} {...sharedProps} />
    );
  }
  if (mode === "dashboard") return wrapper(
    <ProgressDashboard onBack={goBack} getOverallStats={getOverallStats} getStreakStats={getStreakStats} getCategoryStats={getCategoryStats} getRecentWords={getRecentWords} resetProgress={resetProgress} onStartPractice={() => { setCustomWordPool(null); setModeKey(k => k + 1); setMode("listen"); }} t={t} isDark={isDark} toggleDark={toggleDark} s={s} locale={locale} toggleLocale={toggleLocale} speed={speed} setSpeed={setSpeed} voiceId={voiceId} setVoiceId={setVoiceId} />
  );
  if (mode === "quiz") return wrapper(<QuizMode key={modeKey} onBack={goBack} wordPool={customWordPool} {...sharedProps} />);
  if (mode === "spell") return wrapper(<SpellMode key={modeKey} onBack={goBack} wordPool={customWordPool} {...sharedProps} />);
  if (mode === "listen") return wrapper(<ListenMode key={modeKey} onBack={goBack} wordPool={customWordPool} ready={ready} {...sharedProps} />);
  if (mode === "smart-review") {
    const dueWordStrings = getWordsForReview();
    const dueWordObjs = dueWordStrings.map(w => ALL_WORDS.find(aw => aw.word === w)).filter(Boolean);
    return wrapper(<SmartReviewMode key={modeKey} onBack={goBack} dueWords={dueWordObjs} ready={ready} {...sharedProps} />);
  }
  if (mode === "smart-practice") return wrapper(<SmartPracticeMode key={modeKey} onBack={goBack} wordPool={customWordPool} ready={ready} {...sharedProps} />);
  if (mode === "about") return wrapper(<AboutPage onBack={goBack} t={t} isDark={isDark} toggleDark={toggleDark} s={s} locale={locale} toggleLocale={toggleLocale} speed={speed} setSpeed={setSpeed} voiceId={voiceId} setVoiceId={setVoiceId} />);

  // Phase 1: First-visit welcome screen
  if (!hasBeenOnboarded() && masteredCount === 0 && getOverallStats().totalPracticed === 0) {
    return wrapper(
      <WelcomeScreen
        t={t} isDark={isDark} s={s}
        onStart={() => { markOnboarded(); setCustomWordPool(null); setModeKey(k => k + 1); setMode("listen"); }}
        onExplore={() => { markOnboarded(); }}
      />
    );
  }

  const dueCount = getDueCount();

  return wrapper(
    <main style={{ maxWidth: 600, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 2, marginBottom: -20 }}>
        <LocaleToggle locale={locale} toggleLocale={toggleLocale} />
        <DarkModeToggle isDark={isDark} toggleDark={toggleDark} s={s} />
      </div>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <p style={{ fontSize: 40, marginBottom: 4 }}>🐝</p>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: t.text, marginBottom: 4 }}>{s.appTitle}</h1>
        <p style={{ fontSize: 15, color: t.textMuted }}>{s.appSubtitle}</p>
        <p style={{ fontSize: 13, color: t.textMuted, marginTop: 4 }}>{s.wordsAndMastered(ALL_WORDS.length, masteredCount)}</p>
        {masteredCount > 0 && (
          <div role="progressbar" aria-valuenow={masteredCount} aria-valuemin={0} aria-valuemax={ALL_WORDS.length} aria-label={s.wordsAndMastered(ALL_WORDS.length, masteredCount)} style={{ background: t.border, borderRadius: 8, height: 6, maxWidth: 200, margin: "8px auto 0" }}>
            <div style={{ background: "#10b981", height: 6, borderRadius: 8, width: `${Math.round((masteredCount / ALL_WORDS.length) * 100)}%`, transition: "width 0.5s" }} />
          </div>
        )}
      </div>

      {/* Phase 4: Welcome-back prompt for return visitors */}
      <WelcomeBackPrompt dueCount={dueCount} t={t} isDark={isDark} s={s}
        onStartReview={() => { setModeKey(k => k + 1); setMode("smart-review"); }}
        onSkip={() => {}} />

      {/* Countdown to NSSB */}
      <CountdownBanner t={t} isDark={isDark} s={s} />

      {/* Dashboard Button */}
      {getOverallStats().totalPracticed > 0 && (
        <button onClick={() => setMode("dashboard")}
          style={{ width: "100%", padding: "14px 18px", borderRadius: 12, border: `1px solid ${t.border}`, background: t.surface, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 14, marginBottom: 20, transition: "box-shadow 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = isDark ? "0 2px 12px rgba(0,0,0,0.2)" : "0 2px 12px rgba(0,0,0,0.08)"} onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "#6366f118", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 20 }}>📊</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 600, color: t.text, fontSize: 15, marginBottom: 2 }}>{s.progressDashboard}</p>
            <p style={{ color: t.textMuted, fontSize: 13 }}>
              {(() => { const os = getOverallStats(); const ss = getStreakStats(); return `${os.totalPracticed} ${s.wordsPracticed.toLowerCase()} · ${os.totalMastered} ${s.wordsMastered.toLowerCase()}${ss.currentStreak > 0 ? ` · ${ss.currentStreak} ${ss.currentStreak === 1 ? s.day : s.days}` : ""}`; })()}
            </p>
          </div>
          <span style={{ color: "#6366f1", fontSize: 14, flexShrink: 0 }}>→</span>
        </button>
      )}

      {/* Competition Practice */}
      <h2 style={{ fontSize: 16, fontWeight: 600, color: t.text, marginBottom: 4 }}>{s.competitionPractice}</h2>
      <p style={{ fontSize: 13, color: t.textMuted, marginBottom: 10 }}>{s.competitionPracticeDesc}</p>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <button onClick={() => { setCustomWordPool(null); setModeKey(k => k + 1); setMode("listen"); }}
          style={{ flex: "1 1 100%", padding: "18px 16px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #e67e22, #f39c12)", color: "white", cursor: "pointer", fontSize: 16, fontWeight: 700, boxShadow: "0 4px 16px rgba(230,126,34,0.3)", textAlign: "center", position: "relative" }}>
          🎧 {s.listenSpellTitle}
          <span style={{ display: "block", fontSize: 12, fontWeight: 400, opacity: 0.9, marginTop: 2 }}>{s.listenSpellDesc}</span>
          <span style={{ position: "absolute", top: 8, right: 10, background: "rgba(255,255,255,0.25)", color: "white", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8 }}>{s.recommended}</span>
        </button>
        <button onClick={() => { setCustomWordPool(null); setModeKey(k => k + 1); setMode("smart-practice"); }}
          style={{ flex: "1 1 100%", padding: "14px 16px", borderRadius: 12, border: "2px solid #10b981", background: isDark ? "#064e3b" : "#ecfdf5", color: t.text, cursor: "pointer", fontSize: 15, fontWeight: 600, textAlign: "center" }}>
          🧪 {s.smartPractice}
          <span style={{ display: "block", fontSize: 12, fontWeight: 400, color: "#059669", marginTop: 2 }}>{s.smartPracticeDesc}</span>
        </button>
      </div>

      {/* Smart Review (SRS) — with contextual hint */}
      {dueCount > 0 && (
        <ContextualHint hintKey="smart-review" message={s.hintSmartReview} t={t}>
          <button onClick={() => { setModeKey(k => k + 1); setMode("smart-review"); }}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: 12, border: "2px solid #10b981", background: isDark ? "#064e3b" : "#ecfdf5", cursor: "pointer", textAlign: "left", width: "100%", marginBottom: 20, transition: "box-shadow 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(16,185,129,0.2)"} onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "#10b98118", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 20 }}>🧠</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, color: t.text, fontSize: 15, marginBottom: 2 }}>{s.smartReview}</p>
              <p style={{ color: "#059669", fontSize: 13 }}>{s.wordsForReview(dueCount)}</p>
            </div>
            <span style={{ background: "#10b981", color: "white", padding: "4px 10px", borderRadius: 12, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{dueCount}</span>
          </button>
        </ContextualHint>
      )}

      {/* Study & Review */}
      <h2 style={{ fontSize: 16, fontWeight: 600, color: t.text, marginBottom: 10 }}>{s.studyAndReview}</h2>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <button onClick={() => { setCustomWordPool(null); setModeKey(k => k + 1); setMode("quiz"); }}
          style={{ flex: "1 1 140px", padding: "14px 12px", borderRadius: 12, border: "none", background: "#3498db", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600, textAlign: "center" }}>
          🎯 {s.multipleChoice}
          <span style={{ display: "block", fontSize: 11, fontWeight: 400, opacity: 0.9, marginTop: 2 }}>{s.multipleChoiceDesc}</span>
        </button>
        <button onClick={() => { setCustomWordPool(null); setModeKey(k => k + 1); setMode("spell"); }}
          style={{ flex: "1 1 140px", padding: "14px 12px", borderRadius: 12, border: "none", background: "#9b59b6", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600, textAlign: "center" }}>
          ⌨️ {s.typeWithHints}
          <span style={{ display: "block", fontSize: 11, fontWeight: 400, opacity: 0.9, marginTop: 2 }}>{s.typeWithHintsDesc}</span>
        </button>
      </div>

      {/* Favorites Section — with contextual hint */}
      {favWords.length > 0 && (
        <ContextualHint hintKey="favorites" message={s.hintFavorites} t={t}>
          <button onClick={() => setMode("study-favorites")}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: 12, border: `2px solid #f59e0b`, background: isDark ? "#3d2a14" : "#fffbeb", cursor: "pointer", textAlign: "left", width: "100%", marginBottom: 20, transition: "box-shadow 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(245,158,11,0.2)"} onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "#f59e0b18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 20 }}>⭐</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, color: t.text, fontSize: 15, marginBottom: 2 }}>{s.yourStarredWords}</p>
              <p style={{ color: t.textMuted, fontSize: 13 }}>{s.practiceBookmarked}</p>
            </div>
            <span style={{ color: "#f59e0b", fontSize: 13, flexShrink: 0, fontWeight: 600 }}>{s.nWords(favWords.length)}</span>
          </button>
        </ContextualHint>
      )}

      {/* Tools */}
      <h2 style={{ fontSize: 16, fontWeight: 600, color: t.text, marginBottom: 10 }}>{s.tools}</h2>
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        <button onClick={() => setMode("wordlist")}
          style={{ flex: "1 1 140px", padding: "14px 16px", borderRadius: 12, border: `1px solid ${t.border}`, background: t.surface, color: t.text, cursor: "pointer", fontSize: 15, fontWeight: 600, textAlign: "center" }}>
          📖 {s.wordListTitle}
          <span style={{ display: "block", fontSize: 12, fontWeight: 400, color: t.textMuted, marginTop: 2 }}>{s.wordListDesc(ALL_WORDS.length)}</span>
        </button>
        {getOverallStats().totalPracticed === 0 && (
          <button onClick={() => setMode("dashboard")}
            style={{ flex: "1 1 140px", padding: "14px 16px", borderRadius: 12, border: `1px solid ${t.border}`, background: t.surface, color: t.text, cursor: "pointer", fontSize: 15, fontWeight: 600, textAlign: "center" }}>
            📊 {s.progressDashboard}
          </button>
        )}
      </div>

      {/* Search */}
      <SearchBar value={search} onChange={setSearch} t={t} s={s} />

      {/* Word Search Results */}
      {search.length >= 2 && (
        <div style={{ marginBottom: 20 }}>
          {filteredWords.length > 0 ? (
            <>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 8 }}>🔍 {s.nWordsFound(filteredWords.length)}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 320, overflowY: "auto", borderRadius: 12, border: `1px solid ${t.border}`, background: t.card }}>
                {filteredWords.slice(0, 100).map((w, i) => (
                  <button key={w.word} onClick={() => {
                    const reordered = [w, ...filteredWords.filter(fw => fw.word !== w.word)];
                    setSearchStudyWords(reordered);
                    setMode("study-search");
                  }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "none", border: "none", borderBottom: i < filteredWords.slice(0, 100).length - 1 ? `1px solid ${t.border}` : "none", cursor: "pointer", textAlign: "left", width: "100%" }}>
                    <span style={{ fontWeight: 600, color: t.text, fontSize: 15, fontFamily: "Georgia, serif", minWidth: 0, flexShrink: 0 }}>{w.word}</span>
                    <span style={{ color: t.textMuted, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{w.en}</span>
                    <span style={{ color: "#6366f1", fontSize: 12, flexShrink: 0 }}>→</span>
                  </button>
                ))}
              </div>
              {filteredWords.length > 100 && <p style={{ fontSize: 12, color: t.textMuted, marginTop: 6, textAlign: "center" }}>{s.showingFirstN(100, filteredWords.length)}</p>}
            </>
          ) : (
            <p style={{ fontSize: 13, color: t.textMuted, textAlign: "center" }}>{s.noWordsMatch(search)}</p>
          )}
        </div>
      )}

      {/* Study by Category — collapsible */}
      <CategorySection filteredCategories={filteredCategories} categoryWords={categoryWords} getCategoryStats={getCategoryStats}
        setStudyCategory={setStudyCategory} setMode={setMode} startCategoryMode={startCategoryMode}
        setCustomWordPool={setCustomWordPool} setModeKey={setModeKey}
        t={t} isDark={isDark} s={s} />

      {/* Support & Ads */}
      <SupportBanner t={t} s={s} />
      <AdSlot t={t} s={s} />

      {/* About & Footer */}
      <div style={{ textAlign: "center", marginTop: 20, paddingBottom: 20 }}>
        <button onClick={() => setMode("about")}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#e67e22", fontSize: 13, fontWeight: 600, marginBottom: 10, padding: "6px 12px" }}>
          ℹ️ {s.aboutEspellnol}
        </button>
        <p style={{ color: t.textMuted, fontSize: 12 }}>{s.footerEvent}</p>
        <p style={{ color: t.textMuted, fontSize: 12 }}>{s.footerLocation}</p>
      </div>
    </main>
  );
}

// ─── Collapsible Category Section ────────────────────────────────────────────
function CategorySection({ filteredCategories, categoryWords, getCategoryStats, setStudyCategory, setMode, startCategoryMode, setCustomWordPool, setModeKey, t, isDark, s }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ marginBottom: 20 }}>
      <button onClick={() => setExpanded(!expanded)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "12px 0", background: "none", border: "none", cursor: "pointer" }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: t.text, margin: 0 }}>{s.studyByCategory} ({filteredCategories.length})</h2>
        <span style={{ fontSize: 13, color: t.textMuted, transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
      </button>
      {expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
          {filteredCategories.map(([name, data]) => {
            const words = categoryWords[name] || [];
            const stats = getCategoryStats(words);
            return (
              <div key={name} style={{ borderRadius: 12, border: `1px solid ${t.border}`, background: t.card, overflow: "hidden", transition: "box-shadow 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = isDark ? "0 2px 12px rgba(0,0,0,0.2)" : "0 2px 12px rgba(0,0,0,0.08)"} onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                <button onClick={() => { setStudyCategory(name); setMode("study"); }}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: "none", border: "none", cursor: "pointer", textAlign: "left", width: "100%" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: data.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 20 }}>
                    {data.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, color: t.text, fontSize: 15, marginBottom: 2 }}>{s.cat[name] || name}</p>
                    <p style={{ color: t.textMuted, fontSize: 13 }}>{s.catDesc[name] || data.description}</p>
                    {stats.percent > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                        <div role="progressbar" aria-valuenow={stats.percent} aria-valuemin={0} aria-valuemax={100} style={{ background: t.border, borderRadius: 4, height: 4, flex: 1, maxWidth: 80 }}>
                          <div style={{ background: "#10b981", height: 4, borderRadius: 4, width: `${stats.percent}%`, transition: "width 0.5s" }} />
                        </div>
                        <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>{stats.percent}%</span>
                      </div>
                    )}
                  </div>
                  <span style={{ color: t.textMuted, fontSize: 13, flexShrink: 0 }}>{s.nWords(words.length)}</span>
                </button>
                <div style={{ display: "flex", gap: 6, padding: "0 18px 12px", marginTop: -4, flexWrap: "wrap" }}>
                  <button onClick={() => startCategoryMode("quiz", name)}
                    style={{ padding: "6px 14px", borderRadius: 14, border: `1px solid ${t.border}`, background: t.surface, color: "#3498db", cursor: "pointer", fontSize: 12, fontWeight: 600, minHeight: 32 }}>🎯 {s.quiz}</button>
                  <button onClick={() => startCategoryMode("spell", name)}
                    style={{ padding: "6px 14px", borderRadius: 14, border: `1px solid ${t.border}`, background: t.surface, color: "#9b59b6", cursor: "pointer", fontSize: 12, fontWeight: 600, minHeight: 32 }}>⌨️ {s.spell}</button>
                  <button onClick={() => startCategoryMode("listen", name)}
                    style={{ padding: "6px 14px", borderRadius: 14, border: `1px solid ${t.border}`, background: t.surface, color: "#e67e22", cursor: "pointer", fontSize: 12, fontWeight: 600, minHeight: 32 }}>🎧 {s.listen}</button>
                  <button onClick={() => { setCustomWordPool(categoryWords[name] || []); setModeKey(k => k + 1); setMode("smart-practice"); }}
                    style={{ padding: "6px 14px", borderRadius: 14, border: `1px solid #10b981`, background: isDark ? "#064e3b" : "#ecfdf5", color: "#10b981", cursor: "pointer", fontSize: 12, fontWeight: 600, minHeight: 32 }}>🧪 {s.smartPractice}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
