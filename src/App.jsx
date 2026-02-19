import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { ALL_WORDS } from "./data/words.js";
import { useProgress } from "./hooks/useProgress.js";
import { useFavorites } from "./hooks/useFavorites.js";
import { useDarkMode, DARK_THEME, LIGHT_THEME } from "./hooks/useDarkMode.js";
import { useKeyboard } from "./hooks/useKeyboard.js";

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

// ─── Voice Hook ─────────────────────────────────────────────────────────────
function useSpanishVoice() {
  const [voice, setVoice] = useState(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    function pickVoice() {
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.lang === "es-MX")
        || voices.find(v => v.lang === "es-ES")
        || voices.find(v => v.lang.startsWith("es"));
      setVoice(preferred || null);
      setReady(true);
    }
    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);
  const speak = useCallback((text, rateOverride) => {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "es-MX";
    if (voice) utt.voice = voice;
    utt.rate = rateOverride !== undefined ? rateOverride : 0.8;
    utt.pitch = 1;
    window.speechSynthesis.speak(utt);
  }, [voice]);
  return { speak, ready };
}

// ─── Shared Components ──────────────────────────────────────────────────────
function SpeedControl({ speed, setSpeed, t, compact }) {
  const labels = { 0.4: "Very Slow", 0.6: "Slow", 0.8: "Normal", 1.0: "Fast", 1.2: "Faster" };
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

function SpeakButton({ word, speak, speed, label, t }) {
  const [animating, setAnimating] = useState(false);
  const handleClick = () => { setAnimating(true); speak(word, speed); setTimeout(() => setAnimating(false), 800); };
  return (
    <button onClick={handleClick}
      style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${t.border}`, background: animating ? (t.bg === DARK_THEME.bg ? "#1e3a5f" : "#eff6ff") : t.surface, color: t.text, cursor: "pointer", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 4, transition: "all 0.2s" }}
      title="Listen to the word">🔊 {label || "Listen"}</button>
  );
}

function FavButton({ word, isFavorite, toggleFavorite }) {
  const fav = isFavorite(word);
  return (
    <button onClick={(e) => { e.stopPropagation(); toggleFavorite(word); }}
      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: "2px 4px", opacity: fav ? 1 : 0.4, transition: "opacity 0.2s", filter: fav ? "none" : "grayscale(1)" }}
      title={fav ? "Remove from favorites" : "Add to favorites"}>⭐</button>
  );
}

function VoiceMicButton({ voice, onLetter, disabled, t }) {
  if (!voice.supported) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <button onClick={() => { if (!disabled) voice.toggle(onLetter); }}
        disabled={disabled}
        style={{ width: 44, height: 44, borderRadius: "50%", border: voice.listening ? "2px solid #ef4444" : `2px solid ${t.border}`, background: voice.listening ? (t.bg === DARK_THEME.bg ? "#451a1a" : "#fef2f2") : t.surface, color: voice.listening ? "#ef4444" : t.textMuted, cursor: disabled ? "default" : "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, opacity: disabled ? 0.4 : 1, transition: "all 0.2s", boxShadow: voice.listening ? "0 0 0 4px rgba(239,68,68,0.2)" : "none", flexShrink: 0 }}
        title={voice.listening ? "Stop voice input" : "Spell by voice"}>
        {voice.listening ? "⏹" : "🎙"}
      </button>
      {voice.listening && voice.lastHeard && (
        <p style={{ fontSize: 11, color: t.textMuted, textAlign: "center", maxWidth: 160 }}>
          "{voice.lastHeard.transcript}" {voice.lastHeard.match ? `→ ${voice.lastHeard.match.letter}` : "→ ?"}
        </p>
      )}
      {voice.ambiguity && (
        <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "4px 10px", background: "#fef3c7", borderRadius: 10 }}>
          <span style={{ fontSize: 12, color: "#92400e" }}>Which?</span>
          {voice.ambiguity.map(l => (
            <button key={l} onClick={() => voice.resolveAmbiguity(l)}
              style={{ padding: "3px 12px", borderRadius: 8, border: "1px solid #f59e0b", background: "white", cursor: "pointer", fontSize: 15, fontWeight: 700, fontFamily: "Georgia, serif" }}>{l}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function AccentToolbar({ onChar, inputRef, t }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 10 }}>
      {["á", "é", "í", "ó", "ú", "ü", "ñ"].map(char => (
        <button key={char} onClick={() => { onChar(char); inputRef.current?.focus(); }}
          style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${t.border}`, background: t.surface, color: t.text, fontSize: 17, cursor: "pointer", fontFamily: "Georgia, serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0 }}>{char}</button>
      ))}
    </div>
  );
}

function DefinitionDisplay({ word, t }) {
  const [lang, setLang] = useState("en");
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 6 }}>
        <button onClick={() => setLang("en")}
          style={{ padding: "3px 10px", borderRadius: 12, border: lang === "en" ? "2px solid #3498db" : `1px solid ${t.border}`, background: lang === "en" ? (t.bg === DARK_THEME.bg ? "#1e3a5f" : "#eff6ff") : t.surface, color: t.text, fontSize: 12, cursor: "pointer", fontWeight: lang === "en" ? 600 : 400 }}>English</button>
        <button onClick={() => setLang("es")}
          style={{ padding: "3px 10px", borderRadius: 12, border: lang === "es" ? "2px solid #e67e22" : `1px solid ${t.border}`, background: lang === "es" ? (t.bg === DARK_THEME.bg ? "#3d2a14" : "#fff7ed") : t.surface, color: t.text, fontSize: 12, cursor: "pointer", fontWeight: lang === "es" ? 600 : 400 }}>Español</button>
      </div>
      <p style={{ color: t.textMuted, fontSize: 15, fontStyle: "italic" }}>
        {lang === "en" ? word.en : (word.es || word.en)}
      </p>
    </div>
  );
}

function DarkModeToggle({ isDark, toggleDark }) {
  return (
    <button onClick={toggleDark}
      style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", padding: "4px 8px", borderRadius: 8, transition: "all 0.2s" }}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}>{isDark ? "☀️" : "🌙"}</button>
  );
}

function ModeTopBar({ onBack, backLabel, speed, setSpeed, isDark, toggleDark, t }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 6 }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: t.textMuted, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap", padding: "4px 0", flexShrink: 0 }}>← {backLabel || "Back"}</button>
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        <SpeedControl speed={speed} setSpeed={setSpeed} t={t} compact />
        <DarkModeToggle isDark={isDark} toggleDark={toggleDark} />
      </div>
    </div>
  );
}

// ─── Study Mode (Flashcards) ────────────────────────────────────────────────
function StudyMode({ words, category, catColor, onBack, speed, setSpeed, speak, t, isDark, toggleDark, isFavorite, toggleFavorite }) {
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

  if (!word) return <p style={{ color: t.text }}>No words in this category.</p>;
  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <ModeTopBar onBack={onBack} backLabel="Categories" speed={speed} setSpeed={setSpeed} isDark={isDark} toggleDark={toggleDark} t={t} />
      <div style={{ background: t.border, borderRadius: 8, height: 6, marginBottom: 24 }}>
        <div style={{ background: catColor || "#3498db", height: 6, borderRadius: 8, width: `${progress}%`, transition: "width 0.3s" }} />
      </div>
      <p style={{ color: t.textMuted, fontSize: 14, textAlign: "center", marginBottom: 8 }}>{currentIndex + 1} of {words.length}</p>

      <div style={{ perspective: 800, marginBottom: 16 }}>
        <div style={{
          background: t.card, borderRadius: 16, padding: "24px 20px", boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.3)" : "0 4px 24px rgba(0,0,0,0.08)", textAlign: "center", minHeight: 240, display: "flex", flexDirection: "column", justifyContent: "center",
          transform: flipping ? "rotateY(90deg)" : "rotateY(0deg)", transition: "transform 0.3s ease-in-out", transformStyle: "preserve-3d",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: catColor || "#888", fontWeight: 600 }}>{category}</p>
            <FavButton word={word.word} isFavorite={isFavorite} toggleFavorite={toggleFavorite} />
          </div>

          {showWord ? (
            <h2 style={{ fontSize: "clamp(24px, 7vw, 36px)", fontWeight: 700, color: t.text, marginBottom: 12, fontFamily: "Georgia, serif", wordBreak: "break-word" }}>{word.word}</h2>
          ) : (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 36, marginBottom: 4 }}>🔒</p>
              <p style={{ fontSize: 13, color: t.textMuted }}>Spelling hidden — listen and try to remember!</p>
              {countdown > 0 && <p style={{ fontSize: 13, color: catColor || "#3498db", fontWeight: 600, marginTop: 6 }}>Revealing in {countdown}s</p>}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 16 }}>
            <SpeakButton word={word.word} speak={speak} speed={speed} label="Listen" t={t} />
            <button onClick={toggleWord} style={{ padding: "6px 10px", borderRadius: 20, border: `1px solid ${t.border}`, background: showWord ? t.surface : "#fef3c7", color: showWord ? t.text : "#374151", cursor: "pointer", fontSize: 12 }}>{showWord ? "👁 Hide" : "👁 Show"} Spelling</button>
            <button onClick={() => setShowDef(!showDef)} style={{ padding: "6px 10px", borderRadius: 20, border: `1px solid ${t.border}`, background: showDef ? (isDark ? "#1e3a5f" : "#f0f9ff") : t.surface, color: t.text, cursor: "pointer", fontSize: 12 }}>{showDef ? "Hide" : "Show"} Definition</button>
            <button onClick={() => setShowTip(!showTip)} style={{ padding: "6px 10px", borderRadius: 20, border: `1px solid ${t.border}`, background: showTip ? "#fef3c7" : t.surface, color: showTip ? "#374151" : t.text, cursor: "pointer", fontSize: 12 }}>{showTip ? "Hide" : "Show"} Tip</button>
          </div>
          {showDef && <DefinitionDisplay word={word} t={t} />}
          {showTip && <p style={{ color: "#92400e", fontSize: 14, background: "#fef3c7", padding: "10px 16px", borderRadius: 8, marginTop: 8 }}>💡 {word.tip}</p>}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 16 }}>
        <span style={{ fontSize: 11, color: t.textMuted, flexShrink: 0 }}>⏱</span>
        {DELAY_OPTIONS.map(sec => (
          <button key={sec} onClick={() => setAutoReveal(sec)}
            style={{ padding: "3px 8px", borderRadius: 12, border: autoReveal === sec ? `2px solid ${catColor || "#3498db"}` : `1px solid ${t.border}`, background: autoReveal === sec ? (catColor || "#3498db") + "18" : t.surface, color: autoReveal === sec ? catColor || "#3498db" : t.textMuted, cursor: "pointer", fontSize: 11, fontWeight: autoReveal === sec ? 600 : 400 }}>
            {sec === 0 ? "Off" : `${sec}s`}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <button onClick={() => { setCurrentIndex(Math.max(0, currentIndex - 1)); resetCard(); }} disabled={currentIndex === 0}
          style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: `1px solid ${t.border}`, background: t.surface, color: t.text, cursor: currentIndex === 0 ? "default" : "pointer", opacity: currentIndex === 0 ? 0.4 : 1, fontSize: 15 }}>← Previous</button>
        <button onClick={() => { setCurrentIndex(Math.min(words.length - 1, currentIndex + 1)); resetCard(); }} disabled={currentIndex === words.length - 1}
          style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "none", background: catColor || "#3498db", color: "white", cursor: currentIndex === words.length - 1 ? "default" : "pointer", opacity: currentIndex === words.length - 1 ? 0.4 : 1, fontSize: 15, fontWeight: 600 }}>Next →</button>
      </div>
      <p style={{ textAlign: "center", color: t.textMuted, fontSize: 12, marginTop: 12 }}>← → navigate · Space listen · Enter flip · Esc back</p>
    </div>
  );
}

// ─── Quiz Mode (Multiple Choice) ────────────────────────────────────────────
function QuizMode({ onBack, speed, setSpeed, speak, t, isDark, toggleDark, recordResult, isFavorite, toggleFavorite, wordPool }) {
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
  if (questions.length === 0) return <p style={{ textAlign: "center", padding: 40, color: t.text }}>Loading quiz...</p>;

  if (finished) {
    const total = questions.length;
    const pct = Math.round((score / total) * 100);
    return (
      <div style={{ maxWidth: 500, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{pct >= 80 ? "🏆" : pct >= 60 ? "👍" : "📚"}</div>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: t.text }}>{score} / {total} Correct</h2>
        <p style={{ color: t.textMuted, fontSize: 16, marginBottom: 24 }}>{pct >= 80 ? "¡Excelente! You're ready to compete!" : pct >= 60 ? "¡Bien hecho! Keep practicing." : "Keep studying — you'll get there!"}</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => { setFinished(false); setCurrentQ(0); setScore(0); setSelected(null); setMissed([]); setQuestions(buildQuiz(pool)); }}
            style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: "#3498db", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>Try Again</button>
          {missed.length > 0 && (
            <button onClick={() => { setFinished(false); setCurrentQ(0); setScore(0); setSelected(null); setRetryMissed(true); setQuestions(buildQuiz(missed)); setMissed([]); }}
              style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: "#e67e22", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>Practice {missed.length} Missed</button>
          )}
          <button onClick={onBack} style={{ padding: "12px 24px", borderRadius: 10, border: `1px solid ${t.border}`, background: t.surface, color: t.text, cursor: "pointer", fontSize: 15 }}>Back to Menu</button>
        </div>
      </div>
    );
  }

  const q = questions[currentQ];
  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <ModeTopBar onBack={onBack} speed={speed} setSpeed={setSpeed} isDark={isDark} toggleDark={toggleDark} t={t} />
      <div style={{ background: t.border, borderRadius: 8, height: 6, marginBottom: 24 }}>
        <div style={{ background: "#3498db", height: 6, borderRadius: 8, width: `${((currentQ + 1) / questions.length) * 100}%`, transition: "width 0.3s" }} />
      </div>
      <p style={{ color: t.textMuted, textAlign: "center", marginBottom: 8, fontSize: 14 }}>Question {currentQ + 1} of {questions.length}{retryMissed ? " (missed words)" : ""}</p>
      <div style={{ background: t.card, borderRadius: 16, padding: "22px 18px", boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.3)" : "0 4px 24px rgba(0,0,0,0.08)", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
          <p style={{ fontSize: 15, color: t.text }}>Which is the correct spelling?</p>
          <SpeakButton word={q.correct} speak={speak} speed={speed} label="" t={t} />
          <FavButton word={q.correct} isFavorite={isFavorite} toggleFavorite={toggleFavorite} />
        </div>
        <div style={{ marginBottom: 16 }}><DefinitionDisplay word={q} t={t} /></div>
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
                else setMissed(prev => [...prev, q]);
                recordResult(q.word, correct);
              }}
                style={{ padding: "14px 20px", borderRadius: 10, border, background: bg, color: t.text, cursor: selected !== null ? "default" : "pointer", fontSize: 18, fontFamily: "Georgia, serif", textAlign: "center", transition: "all 0.2s" }}>{opt}</button>
            );
          })}
        </div>
        {selected !== null && (
          <div style={{ marginTop: 16 }}>
            <p style={{ color: selected === q.correct ? "#059669" : "#dc2626", fontWeight: 600, marginBottom: 4 }}>{selected === q.correct ? "✓ ¡Correcto!" : `✗ Correct: ${q.correct}`}</p>
            <p style={{ fontSize: 13, color: "#92400e", background: "#fef3c7", padding: "8px 12px", borderRadius: 8 }}>💡 {q.tip}</p>
            <button onClick={() => { if (currentQ + 1 >= questions.length) setFinished(true); else { setCurrentQ(currentQ + 1); setSelected(null); } }}
              style={{ marginTop: 14, padding: "10px 28px", borderRadius: 10, border: "none", background: "#3498db", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>{currentQ + 1 >= questions.length ? "See Results" : "Next →"}</button>
          </div>
        )}
      </div>
      <p style={{ textAlign: "center", color: t.textMuted, marginTop: 16, fontSize: 14 }}>Score: {score}/{currentQ + (selected !== null ? 1 : 0)}</p>
    </div>
  );
}

// ─── Spell Mode (Type with Hints) ───────────────────────────────────────────
function SpellMode({ onBack, speed, setSpeed, speak, t, isDark, toggleDark, recordResult, isFavorite, toggleFavorite, wordPool }) {
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
    else setMissed(prev => [...prev, word]);
    setResult({ correct, answer: word.word, accentClose: cmp.accentClose, similarity: cmp.similarity });
    recordResult(word.word, correct);
    voice.stop();
  }, [input, word, recordResult, voice]);

  if (finished) {
    const pct = Math.round((score / ROUND_SIZE) * 100);
    return (
      <div style={{ maxWidth: 500, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{pct >= 80 ? "🎯" : pct >= 60 ? "💪" : "📖"}</div>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: t.text }}>{score} / {ROUND_SIZE}</h2>
        <p style={{ color: t.textMuted, marginBottom: 24 }}>{pct >= 80 ? "¡Increíble! Your spelling is on point!" : "Keep practicing those accents and special characters!"}</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {missed.length > 0 && (
            <button onClick={() => { onBack("spell-missed", missed); }}
              style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: "#e67e22", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>Practice {missed.length} Missed</button>
          )}
          <button onClick={onBack} style={{ padding: "12px 24px", borderRadius: 10, border: `1px solid ${t.border}`, background: t.surface, color: t.text, cursor: "pointer", fontSize: 15 }}>Back to Menu</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <ModeTopBar onBack={onBack} speed={speed} setSpeed={setSpeed} isDark={isDark} toggleDark={toggleDark} t={t} />
      <div style={{ background: t.border, borderRadius: 8, height: 6, marginBottom: 24 }}>
        <div style={{ background: "#9b59b6", height: 6, borderRadius: 8, width: `${((currentIndex + 1) / ROUND_SIZE) * 100}%`, transition: "width 0.3s" }} />
      </div>
      <div style={{ background: t.card, borderRadius: 16, padding: "22px 18px", boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.3)" : "0 4px 24px rgba(0,0,0,0.08)", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 4, marginBottom: 4 }}>
          <p style={{ fontSize: 13, color: t.textMuted }}>Word {currentIndex + 1} of {ROUND_SIZE}</p>
          <FavButton word={word.word} isFavorite={isFavorite} toggleFavorite={toggleFavorite} />
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <SpeakButton word={word.word} speak={speak} speed={speed} label="Listen" t={t} />
        </div>
        <div style={{ marginBottom: 8 }}><DefinitionDisplay word={word} t={t} /></div>
        <p style={{ fontSize: 13, color: t.textMuted, marginBottom: 16 }}>💡 {word.tip}</p>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") checkAnswer(); }}
            placeholder="Type or use mic to spell..." disabled={result !== null}
            style={{ flex: 1, padding: "12px 14px", fontSize: 19, borderRadius: 10, border: `2px solid ${t.border}`, textAlign: "center", fontFamily: "Georgia, serif", boxSizing: "border-box", outline: "none", background: t.surface, color: t.text }} autoFocus />
          <VoiceMicButton voice={voice} onLetter={handleVoiceLetter} disabled={result !== null} t={t} />
        </div>
        {result === null && <AccentToolbar onChar={c => setInput(prev => prev + c)} inputRef={inputRef} t={t} />}
        {result === null ? (
          <button onClick={checkAnswer} style={{ marginTop: 16, padding: "12px 32px", borderRadius: 10, border: "none", background: "#9b59b6", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>Check ✓</button>
        ) : (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: result.correct ? "#059669" : "#dc2626" }}>{result.correct ? (result.accentClose ? "✓ Correct letters! Accents need work." : "✓ ¡Perfecto!") : result.similarity >= 0.8 ? `Almost! (${Math.round(result.similarity * 100)}% match)` : `✗ Correct: ${result.answer}`}</p>
            {!result.correct && <p style={{ fontSize: 14, color: t.textMuted, marginTop: 4 }}>You wrote: <span style={{ textDecoration: "line-through" }}>{input}</span></p>}
            <button onClick={() => { if (currentIndex + 1 >= ROUND_SIZE) setFinished(true); else { setCurrentIndex(currentIndex + 1); setInput(""); setResult(null); } }}
              style={{ marginTop: 12, padding: "10px 28px", borderRadius: 10, border: "none", background: "#9b59b6", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>{currentIndex + 1 >= ROUND_SIZE ? "See Results" : "Next →"}</button>
          </div>
        )}
      </div>
      <p style={{ textAlign: "center", color: t.textMuted, marginTop: 16, fontSize: 14 }}>Score: {score}</p>
    </div>
  );
}

// ─── Listen Mode (Competition Style) ────────────────────────────────────────
function ListenMode({ onBack, speed, setSpeed, speak, ready, t, isDark, toggleDark, recordResult, isFavorite, toggleFavorite, wordPool }) {
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

  useEffect(() => {
    if (ready && !result) {
      const timer = setTimeout(() => { speak(word.word, speed); setHasListened(true); }, 400);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, ready]);

  const handleListen = () => { speak(word.word, speed); setHasListened(true); setTimeout(() => inputRef.current?.focus(), 100); };
  const handleListenSlow = () => { speak(word.word, Math.max(0.3, speed * 0.5)); setHasListened(true); };
  const handleDefinition = () => { setShowDef(true); speak(defLang === "es" ? (word.es || word.en) : word.en, speed); };
  const handleSentence = () => { speak(`${word.word}. ${defLang === "es" ? (word.es || word.en) : word.en}. ${word.word}.`, speed); };

  const checkAnswer = useCallback(() => {
    if (!input.trim()) return;
    const cmp = compareSpelling(input, word.word);
    const correct = cmp.exact || cmp.accentClose;
    if (correct) setScore(s => s + 1);
    else setMissed(prev => [...prev, word]);
    setResult({ correct, answer: word.word, accentClose: cmp.accentClose, similarity: cmp.similarity });
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
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: t.text }}>{score} / {ROUND_SIZE}</h2>
        <p style={{ color: t.textMuted, fontSize: 16, marginBottom: 24 }}>
          {pct >= 90 ? "¡Campeón/a! You nailed it by ear alone!" : pct >= 70 ? "¡Muy bien! Strong listening skills!" : pct >= 50 ? "Good effort — the tricky ones take practice." : "This mode is tough! Review the categories and try again."}
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => { setFinished(false); setCurrentIndex(0); setScore(0); setResult(null); setInput(""); setShowDef(false); setHasListened(false); setMissed([]); }}
            style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: "#e67e22", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>Try Again</button>
          {missed.length > 0 && (
            <button onClick={() => { onBack("listen-missed", missed); }}
              style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: "#9b59b6", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>Practice {missed.length} Missed</button>
          )}
          <button onClick={onBack} style={{ padding: "12px 24px", borderRadius: 10, border: `1px solid ${t.border}`, background: t.surface, color: t.text, cursor: "pointer", fontSize: 15 }}>Back to Menu</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <ModeTopBar onBack={onBack} speed={speed} setSpeed={setSpeed} isDark={isDark} toggleDark={toggleDark} t={t} />
      <div style={{ background: t.border, borderRadius: 8, height: 6, marginBottom: 24 }}>
        <div style={{ background: "#e67e22", height: 6, borderRadius: 8, width: `${((currentIndex + 1) / ROUND_SIZE) * 100}%`, transition: "width 0.3s" }} />
      </div>
      <div style={{ background: t.card, borderRadius: 16, padding: "22px 18px", boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.3)" : "0 4px 24px rgba(0,0,0,0.08)", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 4, marginBottom: 2 }}>
          <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: "#e67e22", fontWeight: 700 }}>🎧 Listen & Spell</p>
          <FavButton word={word.word} isFavorite={isFavorite} toggleFavorite={toggleFavorite} />
        </div>
        <p style={{ fontSize: 13, color: t.textMuted, marginBottom: 12 }}>Word {currentIndex + 1} of {ROUND_SIZE}</p>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <button onClick={handleListen}
            style={{ width: 80, height: 80, borderRadius: "50%", border: "none", background: hasListened ? "#e67e22" : "#f59e0b", color: "white", fontSize: 32, cursor: "pointer", boxShadow: "0 4px 20px rgba(230,126,34,0.35)", transition: "all 0.3s", display: "flex", alignItems: "center", justifyContent: "center" }}
            title="Listen to the word">🔊</button>
        </div>

        <p style={{ fontSize: 11, color: t.textMuted, marginBottom: 6 }}>Just like the real bee — you can ask for:</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
          <button onClick={handleListen} style={{ padding: "7px 6px", borderRadius: 20, border: `1px solid ${t.border}`, background: t.surface, color: t.text, cursor: "pointer", fontSize: 12 }}>🔁 Repeat</button>
          <button onClick={handleListenSlow} style={{ padding: "7px 6px", borderRadius: 20, border: `1px solid ${t.border}`, background: t.surface, color: t.text, cursor: "pointer", fontSize: 12 }}>🐢 Slow</button>
          <button onClick={handleDefinition} style={{ padding: "7px 6px", borderRadius: 20, border: `1px solid ${t.border}`, background: showDef ? (isDark ? "#1e3a5f" : "#f0f9ff") : t.surface, color: t.text, cursor: "pointer", fontSize: 12 }}>📖 Def</button>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <button onClick={handleSentence} style={{ padding: "7px 14px", borderRadius: 20, border: `1px solid ${t.border}`, background: t.surface, color: t.text, cursor: "pointer", fontSize: 12 }}>💬 Use in context</button>
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
            placeholder={hasListened ? "Type or use mic to spell..." : "Press 🔊 first"} disabled={result !== null}
            style={{ flex: 1, padding: "12px 14px", fontSize: 20, borderRadius: 10, border: result === null ? "2px solid #f59e0b" : result.correct ? "2px solid #10b981" : "2px solid #ef4444", textAlign: "center", fontFamily: "Georgia, serif", boxSizing: "border-box", outline: "none", background: result === null ? t.surface : result.correct ? (isDark ? "#064e3b" : "#d1fae5") : (isDark ? "#7f1d1d" : "#fee2e2"), color: t.text }} autoFocus />
          <VoiceMicButton voice={voice} onLetter={handleVoiceLetter} disabled={result !== null} t={t} />
        </div>

        {result === null && <AccentToolbar onChar={c => setInput(prev => prev + c)} inputRef={inputRef} t={t} />}

        {result === null ? (
          <button onClick={checkAnswer} style={{ marginTop: 16, padding: "12px 32px", borderRadius: 10, border: "none", background: "#e67e22", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>Check ✓</button>
        ) : (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: result.correct ? "#059669" : "#dc2626", marginBottom: 4 }}>{result.correct ? (result.accentClose ? "✓ Right letters! Check accents." : "✓ ¡Correcto!") : result.similarity >= 0.8 ? `Almost! (${Math.round(result.similarity * 100)}% match)` : "✗ Incorrect"}</p>
            <p style={{ fontSize: 26, fontWeight: 700, fontFamily: "Georgia, serif", color: t.text, marginBottom: 4 }}>{result.answer}</p>
            {!result.correct && <p style={{ fontSize: 14, color: t.textMuted }}>You wrote: <span style={{ textDecoration: "line-through", color: "#ef4444" }}>{input}</span></p>}
            <p style={{ fontSize: 13, color: "#92400e", background: "#fef3c7", padding: "8px 12px", borderRadius: 8, marginTop: 8 }}>💡 {word.tip}</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 10 }}>
              <SpeakButton word={word.word} speak={speak} speed={speed} label="Hear it" t={t} />
            </div>
            <button onClick={nextWord} style={{ marginTop: 12, padding: "10px 28px", borderRadius: 10, border: "none", background: "#e67e22", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>{currentIndex + 1 >= ROUND_SIZE ? "See Results" : "Next →"}</button>
          </div>
        )}
      </div>
      <p style={{ textAlign: "center", color: t.textMuted, marginTop: 16, fontSize: 14 }}>Score: {score}</p>
    </div>
  );
}

// ─── Search Component ───────────────────────────────────────────────────────
function SearchBar({ value, onChange, t }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder="🔍 Search words..."
        style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${t.border}`, fontSize: 15, outline: "none", boxSizing: "border-box", background: t.surface, color: t.text }} />
    </div>
  );
}

// ─── Word List Browser ──────────────────────────────────────────────────────
const ALL_LETTERS = [...new Set(ALL_WORDS.map(w => w.word[0].toUpperCase()))].sort((a, b) => a.localeCompare(b, "es"));
const CAT_ENTRIES = Object.entries(CATEGORIES);
const stripAccents = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function WordListMode({ onBack, speed, setSpeed, speak, t, isDark, toggleDark, isFavorite, toggleFavorite, getWordStats, onStudyWords }) {
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
      <ModeTopBar onBack={onBack} backLabel="Menu" speed={speed} setSpeed={setSpeed} isDark={isDark} toggleDark={toggleDark} t={t} />
      <h2 style={{ fontSize: 20, fontWeight: 700, color: t.text, marginBottom: 12, textAlign: "center" }}>📖 Word List</h2>

      {/* Search */}
      <input type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="🔍 Search words, definitions..."
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
            {data.icon} {name}
          </button>
        ))}
      </div>

      {/* Quick Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {[{ key: "favorites", label: "⭐ Favorites", color: "#f59e0b" }, { key: "mastered", label: "✅ Mastered", color: "#10b981" }, { key: "not-practiced", label: "🆕 Not practiced", color: "#6366f1" }].map(f => (
          <button key={f.key} onClick={() => setQuickFilter(quickFilter === f.key ? null : f.key)}
            style={{ padding: "5px 10px", borderRadius: 16, border: quickFilter === f.key ? `2px solid ${f.color}` : `1px solid ${t.border}`, background: quickFilter === f.key ? f.color + "20" : t.surface, color: quickFilter === f.key ? f.color : t.textMuted, cursor: "pointer", fontSize: 12, fontWeight: quickFilter === f.key ? 600 : 400 }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <p style={{ fontSize: 13, color: t.textMuted, marginBottom: 8 }}>Showing {filtered.length} of {ALL_WORDS.length} words</p>

      {/* Word List */}
      {filtered.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", borderRadius: 12, border: `1px solid ${t.border}`, background: t.card, maxHeight: "60vh", overflowY: "auto" }}>
          {filtered.map((w, i) => {
            const stats = getWordStats(w.word);
            const dotColor = stats.mastered ? "#10b981" : stats.total > 0 ? "#f59e0b" : t.border;
            return (
              <button key={w.word} onClick={() => handleWordClick(w)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "none", border: "none", borderBottom: i < filtered.length - 1 ? `1px solid ${t.border}` : "none", cursor: "pointer", textAlign: "left", width: "100%" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0 }} title={stats.mastered ? "Mastered" : stats.total > 0 ? "Practiced" : "Not practiced"} />
                <span style={{ fontWeight: 600, color: t.text, fontSize: 15, fontFamily: "Georgia, serif", flexShrink: 0 }}>{w.word}</span>
                <span style={{ color: t.textMuted, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{w.en}</span>
                <FavButton word={w.word} isFavorite={isFavorite} toggleFavorite={toggleFavorite} />
              </button>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "40px 20px", color: t.textMuted }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>🔍</p>
          <p style={{ fontSize: 15 }}>No words match your filters</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Try adjusting your search or removing filters</p>
        </div>
      )}
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
  const { speak, ready } = useSpanishVoice();
  const { isDark, toggleDark } = useDarkMode();
  const { recordResult, getWordStats, getCategoryStats, getMasteredCount } = useProgress();
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

  const sharedProps = { speed, setSpeed, speak, t, isDark, toggleDark, recordResult, isFavorite, toggleFavorite };

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
      <StudyMode words={favWords} category="Favorites" catColor="#f59e0b" onBack={() => goBack()} {...sharedProps} />
    );
  }
  if (mode === "study-search" && searchStudyWords) {
    return wrapper(
      <StudyMode words={searchStudyWords} category="Search Results" catColor="#6366f1" onBack={() => { goBack(); }} {...sharedProps} />
    );
  }
  if (mode === "wordlist") {
    return wrapper(
      <WordListMode onBack={() => goBack()} speed={speed} setSpeed={setSpeed} speak={speak} t={t} isDark={isDark} toggleDark={toggleDark} isFavorite={isFavorite} toggleFavorite={toggleFavorite} getWordStats={getWordStats} onStudyWords={(words) => { setWordlistStudyWords(words); setMode("study-wordlist"); }} />
    );
  }
  if (mode === "study-wordlist" && wordlistStudyWords) {
    return wrapper(
      <StudyMode words={wordlistStudyWords} category="Word List" catColor="#6366f1" onBack={() => setMode("wordlist")} {...sharedProps} />
    );
  }
  if (mode === "quiz") return wrapper(<QuizMode key={modeKey} onBack={goBack} wordPool={customWordPool} {...sharedProps} />);
  if (mode === "spell") return wrapper(<SpellMode key={modeKey} onBack={goBack} wordPool={customWordPool} {...sharedProps} />);
  if (mode === "listen") return wrapper(<ListenMode key={modeKey} onBack={goBack} wordPool={customWordPool} ready={ready} {...sharedProps} />);

  return wrapper(
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: -20 }}>
        <DarkModeToggle isDark={isDark} toggleDark={toggleDark} />
      </div>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <p style={{ fontSize: 40, marginBottom: 4 }}>🐝</p>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: t.text, marginBottom: 4 }}>Spanish Spelling Bee</h1>
        <p style={{ fontSize: 15, color: t.textMuted }}>Study Guide — 2026 NSSB Word List</p>
        <p style={{ fontSize: 13, color: t.textMuted, marginTop: 4 }}>{ALL_WORDS.length} words · {masteredCount} mastered</p>
        {masteredCount > 0 && (
          <div style={{ background: t.border, borderRadius: 8, height: 6, maxWidth: 200, margin: "8px auto 0" }}>
            <div style={{ background: "#10b981", height: 6, borderRadius: 8, width: `${Math.round((masteredCount / ALL_WORDS.length) * 100)}%`, transition: "width 0.5s" }} />
          </div>
        )}
      </div>

      {/* Voice Speed Control */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
        <SpeedControl speed={speed} setSpeed={setSpeed} t={t} />
      </div>

      {/* Practice Modes */}
      <h2 style={{ fontSize: 16, fontWeight: 600, color: t.text, marginBottom: 10 }}>Practice Modes</h2>
      <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
        <button onClick={() => { setCustomWordPool(null); setModeKey(k => k + 1); setMode("listen"); }}
          style={{ flex: "1 1 100%", padding: "18px 16px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #e67e22, #f39c12)", color: "white", cursor: "pointer", fontSize: 16, fontWeight: 700, boxShadow: "0 4px 16px rgba(230,126,34,0.3)", textAlign: "center" }}>
          🎧 Listen & Spell — Competition Style
          <span style={{ display: "block", fontSize: 12, fontWeight: 400, opacity: 0.9, marginTop: 2 }}>Hear the word, ask for definition or repetition, then spell it</span>
        </button>
        <button onClick={() => { setCustomWordPool(null); setModeKey(k => k + 1); setMode("quiz"); }}
          style={{ flex: "1 1 140px", padding: "14px 12px", borderRadius: 12, border: "none", background: "#3498db", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>🎯 Multiple Choice</button>
        <button onClick={() => { setCustomWordPool(null); setModeKey(k => k + 1); setMode("spell"); }}
          style={{ flex: "1 1 140px", padding: "14px 12px", borderRadius: 12, border: "none", background: "#9b59b6", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>⌨️ Type with Hints</button>
        <button onClick={() => setMode("wordlist")}
          style={{ flex: "1 1 100%", padding: "14px 16px", borderRadius: 12, border: `1px solid ${t.border}`, background: t.surface, color: t.text, cursor: "pointer", fontSize: 15, fontWeight: 600, textAlign: "center" }}>
          📖 Word List
          <span style={{ display: "block", fontSize: 12, fontWeight: 400, color: t.textMuted, marginTop: 2 }}>Browse, filter, and search all {ALL_WORDS.length} words</span>
        </button>
      </div>

      {/* Favorites Section */}
      {favWords.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: t.text, marginBottom: 10 }}>⭐ Favorites</h2>
          <button onClick={() => setMode("study-favorites")}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: 12, border: `2px solid #f59e0b`, background: isDark ? "#3d2a14" : "#fffbeb", cursor: "pointer", textAlign: "left", width: "100%", marginBottom: 20, transition: "box-shadow 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(245,158,11,0.2)"} onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "#f59e0b18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 20 }}>⭐</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, color: t.text, fontSize: 15, marginBottom: 2 }}>Your Starred Words</p>
              <p style={{ color: t.textMuted, fontSize: 13 }}>Practice your bookmarked words</p>
            </div>
            <span style={{ color: "#f59e0b", fontSize: 13, flexShrink: 0, fontWeight: 600 }}>{favWords.length} words</span>
          </button>
        </>
      )}

      {/* Search */}
      <SearchBar value={search} onChange={setSearch} t={t} />

      {/* Word Search Results */}
      {search.length >= 2 && (
        <div style={{ marginBottom: 20 }}>
          {filteredWords.length > 0 ? (
            <>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 8 }}>🔍 {filteredWords.length} word{filteredWords.length !== 1 ? "s" : ""} found</h3>
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
              {filteredWords.length > 100 && <p style={{ fontSize: 12, color: t.textMuted, marginTop: 6, textAlign: "center" }}>Showing first 100 of {filteredWords.length} results</p>}
            </>
          ) : (
            <p style={{ fontSize: 13, color: t.textMuted, textAlign: "center" }}>No words match "{search}"</p>
          )}
        </div>
      )}

      {/* Study by Category */}
      <h2 style={{ fontSize: 16, fontWeight: 600, color: t.text, marginBottom: 10 }}>Study by Category</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
                  <p style={{ fontWeight: 600, color: t.text, fontSize: 15, marginBottom: 2 }}>{name}</p>
                  <p style={{ color: t.textMuted, fontSize: 13 }}>{data.description}</p>
                  {stats.percent > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <div style={{ background: t.border, borderRadius: 4, height: 4, flex: 1, maxWidth: 80 }}>
                        <div style={{ background: "#10b981", height: 4, borderRadius: 4, width: `${stats.percent}%`, transition: "width 0.5s" }} />
                      </div>
                      <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>{stats.percent}%</span>
                    </div>
                  )}
                </div>
                <span style={{ color: t.textMuted, fontSize: 13, flexShrink: 0 }}>{words.length} words</span>
              </button>
              <div style={{ display: "flex", gap: 6, padding: "0 18px 12px", marginTop: -4 }}>
                <button onClick={() => startCategoryMode("quiz", name)}
                  style={{ padding: "4px 12px", borderRadius: 14, border: `1px solid ${t.border}`, background: t.surface, color: "#3498db", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>🎯 Quiz</button>
                <button onClick={() => startCategoryMode("spell", name)}
                  style={{ padding: "4px 12px", borderRadius: 14, border: `1px solid ${t.border}`, background: t.surface, color: "#9b59b6", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>⌨️ Spell</button>
                <button onClick={() => startCategoryMode("listen", name)}
                  style={{ padding: "4px 12px", borderRadius: 14, border: `1px solid ${t.border}`, background: t.surface, color: "#e67e22", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>🎧 Listen</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: 32, paddingBottom: 20, color: t.textMuted, fontSize: 12 }}>
        <p>National Spanish Spelling Bee — July 10-11, 2026</p>
        <p>Albuquerque, NM • nationalspanishspellingbee.com</p>
      </div>
    </div>
  );
}
