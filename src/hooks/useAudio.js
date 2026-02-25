import { useState, useCallback, useEffect, useRef } from "react";
import { ALL_WORDS } from "../data/words.js";

// ─── Voice Definitions ──────────────────────────────────────────────────────

export const VOICES = [
  { id: "dalia",  label: "Dalia",  gender: "female", region: "MX" },
  { id: "jorge",  label: "Jorge",  gender: "male",   region: "MX" },
  { id: "paloma", label: "Paloma", gender: "female", region: "US" },
  { id: "alonso", label: "Alonso", gender: "male",   region: "US" },
  { id: "random", label: "Random", gender: "mixed",  region: "mixed" },
];

const REAL_VOICES = VOICES.filter(v => v.id !== "random");

// Build a Set of all known words (lowercase) for fast lookup
const WORD_SET = new Set(ALL_WORDS.map(w => w.word.toLowerCase()));

// ─── Web Speech API fallback ────────────────────────────────────────────────

function useWebSpeech() {
  const voiceRef = useRef(null);
  const readyRef = useRef(false);

  useEffect(() => {
    function pickVoice() {
      const voices = window.speechSynthesis.getVoices();
      voiceRef.current = voices.find(v => v.lang === "es-MX")
        || voices.find(v => v.lang === "es-ES")
        || voices.find(v => v.lang.startsWith("es"))
        || null;
      readyRef.current = true;
    }
    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const speakWeb = useCallback((text, rate) => {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "es-MX";
    if (voiceRef.current) utt.voice = voiceRef.current;
    utt.rate = rate !== undefined ? rate : 0.8;
    utt.pitch = 1;
    window.speechSynthesis.speak(utt);
  }, []);

  return { speakWeb, readyRef };
}

// ─── Audio cache ────────────────────────────────────────────────────────────

const audioCache = new Map(); // "voiceId:word" → Audio element

function getAudioKey(voiceId, word) {
  return `${voiceId}:${word}`;
}

function getOrCreateAudio(voiceId, word, subDir) {
  const path = subDir
    ? `/audio/${voiceId}/${subDir}/${encodeURIComponent(word)}.mp3`
    : `/audio/${voiceId}/${encodeURIComponent(word)}.mp3`;
  const key = `${voiceId}:${subDir || "word"}:${word}`;
  if (audioCache.has(key)) return audioCache.get(key);
  const audio = new Audio(path);
  audio.preload = "auto";
  audioCache.set(key, audio);
  return audio;
}

// ─── Pick random voice (rotates per call) ───────────────────────────────────

let randomIndex = Math.floor(Math.random() * REAL_VOICES.length);

function pickRandomVoice() {
  const voice = REAL_VOICES[randomIndex % REAL_VOICES.length];
  randomIndex++;
  return voice.id;
}

// ─── Main hook ──────────────────────────────────────────────────────────────

export function useAudio() {
  const [voiceId, setVoiceIdState] = useState(() => {
    try { return localStorage.getItem("sbb_voice") || "dalia"; } catch { return "dalia"; }
  });
  const [ready, setReady] = useState(true);

  const { speakWeb, readyRef } = useWebSpeech();

  // Persist voice choice
  const setVoiceId = useCallback((id) => {
    setVoiceIdState(id);
    try { localStorage.setItem("sbb_voice", id); } catch {}
  }, []);

  // Currently playing audio element (for stopping)
  const currentAudioRef = useRef(null);

  const speak = useCallback((text, rateOverride) => {
    // Stop any current playback
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    window.speechSynthesis.cancel();

    const word = text.toLowerCase();
    const rate = rateOverride !== undefined ? rateOverride : 0.8;

    // If the text is a known word, play from pre-generated MP3
    if (WORD_SET.has(word)) {
      const effectiveVoice = voiceId === "random" ? pickRandomVoice() : voiceId;
      const audio = getOrCreateAudio(effectiveVoice, word);

      audio.playbackRate = rate;
      audio.currentTime = 0;
      currentAudioRef.current = audio;

      audio.play().catch(() => {
        // MP3 failed to load — fall back to Web Speech API
        currentAudioRef.current = null;
        speakWeb(text, rate);
      });
    } else {
      // Definitions, sentences, or unknown text → Web Speech API
      speakWeb(text, rate);
    }
  }, [voiceId, speakWeb]);

  // Speak a definition using pre-generated audio, keyed by word + language
  const speakDef = useCallback((wordKey, lang, rateOverride) => {
    // Stop any current playback
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    window.speechSynthesis.cancel();

    const word = wordKey.toLowerCase();
    const rate = rateOverride !== undefined ? rateOverride : 0.8;
    const subDir = `def-${lang === "es" ? "es" : "en"}`;

    if (WORD_SET.has(word)) {
      const effectiveVoice = voiceId === "random" ? pickRandomVoice() : voiceId;
      const audio = getOrCreateAudio(effectiveVoice, word, subDir);

      audio.playbackRate = rate;
      audio.currentTime = 0;
      currentAudioRef.current = audio;

      audio.play().catch(() => {
        // MP3 failed to load — fall back to Web Speech API
        currentAudioRef.current = null;
        speakWeb(wordKey, rate);
      });
    } else {
      speakWeb(wordKey, rate);
    }
  }, [voiceId, speakWeb]);

  // Prefetch upcoming words into the audio cache
  const prefetch = useCallback((wordArray) => {
    if (!wordArray || !wordArray.length) return;
    const effectiveVoice = voiceId === "random" ? null : voiceId;

    for (const w of wordArray) {
      const word = (typeof w === "string" ? w : w.word).toLowerCase();
      if (!WORD_SET.has(word)) continue;

      if (effectiveVoice) {
        getOrCreateAudio(effectiveVoice, word);
      } else {
        // Random mode: prefetch all voices for this word
        for (const v of REAL_VOICES) {
          getOrCreateAudio(v.id, word);
        }
      }
    }
  }, [voiceId]);

  return {
    speak,
    speakDef,
    ready,
    voiceId,
    setVoiceId,
    voices: VOICES,
    prefetch,
  };
}
