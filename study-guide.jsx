import { useState, useEffect, useCallback, useRef } from "react";

const CATEGORIES = {
  "Silent H": {
    color: "#e74c3c",
    description: "Words with silent 'h' — easy to forget!",
    words: [
      { word: "aherrumbrar", def: "to rust, to make rusty", tip: "a-H-errumbrar — the H is silent but required" },
      { word: "ahumado", def: "smoked (food)", tip: "a-H-umado — from 'humo' (smoke)" },
      { word: "anhidrosis", def: "absence of sweating", tip: "an-H-idrosis — medical term, Greek root" },
      { word: "deshuesar", def: "to debone", tip: "des-H-uesar — from 'hueso' (bone)" },
      { word: "enhorabuena", def: "congratulations", tip: "en-H-ora-buena — compound: en + hora + buena" },
      { word: "exhalación", def: "exhalation", tip: "ex-H-alación — the H after ex- is tricky" },
      { word: "exhortación", def: "exhortation", tip: "ex-H-ortación — don't forget the H!" },
      { word: "haraganería", def: "laziness", tip: "H-araganería — starts with silent H" },
      { word: "hebdómada", def: "a period of seven days", tip: "H-ebdómada — rare word, silent H + accent" },
      { word: "hecatombe", def: "hecatomb, disaster", tip: "H-ecatombe — Greek origin, silent H" },
      { word: "hechiceresco", def: "relating to sorcery", tip: "H-echiceresco — from hechicero" },
      { word: "hediondo", def: "foul-smelling", tip: "H-ediondo — silent H, means stinky" },
      { word: "hegemonía", def: "hegemony", tip: "H-egemonía — accent on the í" },
      { word: "horchata", def: "a traditional drink", tip: "H-orchata — the H is silent" },
      { word: "husillero", def: "relating to spindles", tip: "H-usillero — silent H + double L" },
      { word: "inhábil", def: "incompetent, unskilled", tip: "in-H-ábil — H between prefix and root" },
      { word: "inhalador", def: "inhaler", tip: "in-H-alador — medical device, don't drop the H" },
    ]
  },
  "Accents & Tildes": {
    color: "#3498db",
    description: "Words where the accent mark changes everything",
    words: [
      { word: "acápite", def: "paragraph, section", tip: "Esdrújula — accent on the antepenultimate 'á'" },
      { word: "anatomopatológico", def: "anatomopathological", tip: "Very long word — accent on 'ló'" },
      { word: "báculo", def: "staff, walking stick", tip: "Esdrújula — BÁ-cu-lo" },
      { word: "capicúa", def: "palindrome number", tip: "Accent on the ú — ca-pi-CÚ-a" },
      { word: "decrépito", def: "decrepit", tip: "Esdrújula — DE-cré-pi-to, accent on é" },
      { word: "energúmeno", def: "a furious person", tip: "Accent on ú — e-ner-GÚ-me-no" },
      { word: "esquizofrénico", def: "schizophrenic", tip: "Esdrújula — accent on 'fré'" },
      { word: "factótum", def: "factotum, jack of all trades", tip: "Accent on second ó — fac-TÓ-tum" },
      { word: "hipervitaminosis", def: "excess vitamins", tip: "No accent! Grave ending in S" },
      { word: "lapislázuli", def: "lapis lazuli", tip: "Esdrújula — accent on 'lá'" },
      { word: "nomenclátor", def: "nomenclator, catalog", tip: "Accent on 'á' — no-men-CLÁ-tor" },
      { word: "oxímoron", def: "oxymoron", tip: "Accent on í — o-XÍ-mo-ron" },
      { word: "pretérito", def: "past tense", tip: "Esdrújula — pre-TÉ-ri-to" },
      { word: "retruécano", def: "play on words", tip: "Esdrújula — re-TRUÉ-ca-no" },
      { word: "samurái", def: "samurai", tip: "Accent on final í — sa-mu-RÁI" },
    ]
  },
  "Double Letters": {
    color: "#2ecc71",
    description: "Words with cc, rr, ll, nn — don't miss the double!",
    words: [
      { word: "abyección", def: "abjection", tip: "ab-yec-CIÓN — double C before ción" },
      { word: "acción", def: "action", tip: "ac-CIÓN — CC before ción" },
      { word: "acollarar", def: "to collar, to yoke", tip: "a-co-LLA-rar — double L" },
      { word: "bajorrelieve", def: "bas-relief", tip: "bajo-RRE-lieve — double R after compound" },
      { word: "barrabasada", def: "reckless act", tip: "ba-RRA-basada — double R" },
      { word: "calefacción", def: "heating", tip: "calefac-CIÓN — double C" },
      { word: "derranchadamente", def: "in a disorderly way", tip: "de-RRAN-chadamente — double R" },
      { word: "enfurruñarse", def: "to sulk", tip: "enfu-RRU-ñarse — double R + ñ" },
      { word: "frangollo", def: "a type of mush/porridge", tip: "frango-LLO — double L" },
      { word: "innovación", def: "innovation", tip: "i-NNO-vación — double N" },
      { word: "redacción", def: "editing, writing", tip: "redac-CIÓN — double C" },
      { word: "succión", def: "suction", tip: "suc-CIÓN — double C" },
      { word: "verborrea", def: "verbal diarrhea", tip: "verbo-RREA — double R" },
    ]
  },
  "B vs V": {
    color: "#9b59b6",
    description: "B and V sound the same in Spanish — know which to use!",
    words: [
      { word: "avaricia", def: "greed", tip: "a-VA-ricia — V not B" },
      { word: "avioneta", def: "small airplane", tip: "a-VIO-neta — from avión, uses V" },
      { word: "benévolo", def: "benevolent", tip: "BE-né-VO-lo — B then V" },
      { word: "bienaventuranza", def: "bliss, beatitude", tip: "B-iena-V-enturanza — B then V" },
      { word: "balbucear", def: "to babble", tip: "BAL-BU-cear — both are B" },
      { word: "embotellado", def: "bottled", tip: "em-BO-tellado — B after M" },
      { word: "invulnerable", def: "invulnerable", tip: "in-VUL-nerable — V after N" },
      { word: "sublevación", def: "uprising", tip: "su-BLE-VA-ción — B then V" },
      { word: "vehemencia", def: "vehemence", tip: "VE-hemencia — starts with V + silent H" },
      { word: "vitriolo", def: "vitriol", tip: "VI-triolo — V at start" },
      { word: "víveres", def: "provisions, supplies", tip: "VÍ-VE-res — V twice!" },
    ]
  },
  "Diéresis (ü)": {
    color: "#f39c12",
    description: "Words with güe/güi where the ü must be pronounced and written",
    words: [
      { word: "lengüeta", def: "tongue (of shoe), reed", tip: "len-GÜE-ta — ü in güe" },
      { word: "lingüística", def: "linguistics", tip: "lin-GÜÍ-stica — ü in güí" },
      { word: "monolingüe", def: "monolingual", tip: "monolin-GÜE — ü at the end" },
      { word: "pingüino", def: "penguin", tip: "pin-GÜI-no — ü in güi" },
      { word: "piragüista", def: "canoeist", tip: "pira-GÜI-sta — ü in güi" },
      { word: "ungüento", def: "ointment", tip: "un-GÜEN-to — ü in güe" },
      { word: "zarigüeya", def: "opossum", tip: "zari-GÜE-ya — ü in güe" },
    ]
  },
  "Tricky Combinations": {
    color: "#1abc9c",
    description: "X, SC, PS, GN, and other unusual letter combos",
    words: [
      { word: "auscultación", def: "auscultation", tip: "AUS-CUL-tación — sc + lt cluster" },
      { word: "descalcificación", def: "decalcification", tip: "des-cal-ci-fi-ca-CIÓN — many syllables!" },
      { word: "electrostático", def: "electrostatic", tip: "electro-STÁT-ico — st cluster" },
      { word: "fosforescente", def: "phosphorescent", tip: "fos-fo-res-CEN-te — sc cluster" },
      { word: "gastroduodenal", def: "gastroduodenal", tip: "gastro-duo-de-NAL — compound medical term" },
      { word: "sulfhídrico", def: "hydrosulfuric", tip: "sulf-HÍ-drico — lfh cluster" },
      { word: "acantocéfalos", def: "acanthocephalans", tip: "a-can-to-CÉ-fa-los — scientific term" },
      { word: "pectiniforme", def: "comb-shaped", tip: "pec-ti-ni-FOR-me — Latin root" },
      { word: "partenogénesis", def: "parthenogenesis", tip: "par-te-no-GÉ-ne-sis — Greek roots" },
      { word: "tiquismiquis", def: "fussy, picky person", tip: "ti-quis-MI-quis — repeating pattern" },
      { word: "extracomunitario", def: "from outside the EU", tip: "extra-co-mu-ni-TA-rio — long compound" },
      { word: "xerográfico", def: "xerographic", tip: "xe-ro-GRÁ-fi-co — starts with X" },
    ]
  }
};

const allWords = Object.entries(CATEGORIES).flatMap(([cat, data]) =>
  data.words.map(w => ({ ...w, category: cat, color: data.color }))
);

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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
  const speak = useCallback((text, rate = 0.8) => {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "es-MX";
    if (voice) utt.voice = voice;
    utt.rate = rate;
    utt.pitch = 1;
    window.speechSynthesis.speak(utt);
  }, [voice]);
  return { speak, ready };
}

function SpeakButton({ word, speak, label }) {
  const [animating, setAnimating] = useState(false);
  const handleClick = () => { setAnimating(true); speak(word); setTimeout(() => setAnimating(false), 800); };
  return (
    <button onClick={handleClick}
      style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid #d1d5db", background: animating ? "#eff6ff" : "white", color: "#374151", cursor: "pointer", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 4, transition: "all 0.2s" }}
      title="Listen to the word">🔊 {label || "Listen"}</button>
  );
}

function StudyMode({ words, category, onBack }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTip, setShowTip] = useState(false);
  const [showDef, setShowDef] = useState(false);
  const { speak } = useSpanishVoice();
  const word = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;
  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 14, marginBottom: 16 }}>← Back to categories</button>
      <div style={{ background: "#f3f4f6", borderRadius: 8, height: 6, marginBottom: 24 }}>
        <div style={{ background: CATEGORIES[category]?.color || "#3498db", height: 6, borderRadius: 8, width: `${progress}%`, transition: "width 0.3s" }} />
      </div>
      <p style={{ color: "#6b7280", fontSize: 14, textAlign: "center", marginBottom: 8 }}>{currentIndex + 1} of {words.length}</p>
      <div style={{ background: "white", borderRadius: 16, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", textAlign: "center", minHeight: 280, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <p style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: CATEGORIES[category]?.color || "#888", marginBottom: 8, fontWeight: 600 }}>{word.category}</p>
        <h2 style={{ fontSize: 36, fontWeight: 700, color: "#1a1a2e", marginBottom: 12, fontFamily: "Georgia, serif" }}>{word.word}</h2>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20, flexWrap: "wrap" }}>
          <SpeakButton word={word.word} speak={speak} label="Listen" />
          <button onClick={() => setShowDef(!showDef)} style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid #d1d5db", background: showDef ? "#f0f9ff" : "white", color: "#374151", cursor: "pointer", fontSize: 13 }}>{showDef ? "Hide" : "Show"} Definition</button>
          <button onClick={() => setShowTip(!showTip)} style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid #d1d5db", background: showTip ? "#fef3c7" : "white", color: "#374151", cursor: "pointer", fontSize: 13 }}>{showTip ? "Hide" : "Show"} Spelling Tip</button>
        </div>
        {showDef && <p style={{ color: "#4b5563", fontSize: 16, marginBottom: 8, fontStyle: "italic" }}>{word.def}</p>}
        {showTip && <p style={{ color: "#92400e", fontSize: 14, background: "#fef3c7", padding: "10px 16px", borderRadius: 8, marginTop: 4 }}>💡 {word.tip}</p>}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, gap: 12 }}>
        <button onClick={() => { setCurrentIndex(Math.max(0, currentIndex - 1)); setShowTip(false); setShowDef(false); }} disabled={currentIndex === 0} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "1px solid #d1d5db", background: "white", cursor: currentIndex === 0 ? "default" : "pointer", opacity: currentIndex === 0 ? 0.4 : 1, fontSize: 15 }}>← Previous</button>
        <button onClick={() => { setCurrentIndex(Math.min(words.length - 1, currentIndex + 1)); setShowTip(false); setShowDef(false); }} disabled={currentIndex === words.length - 1} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "none", background: CATEGORIES[category]?.color || "#3498db", color: "white", cursor: currentIndex === words.length - 1 ? "default" : "pointer", opacity: currentIndex === words.length - 1 ? 0.4 : 1, fontSize: 15, fontWeight: 600 }}>Next →</button>
      </div>
    </div>
  );
}

function QuizMode({ onBack }) {
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const { speak } = useSpanishVoice();
  const QUIZ_SIZE = 10;
  function generateMisspellings(word) {
    const results = [];
    const noAccent = word.normalize("NFD").replace(/[\u0301]/g, "").normalize("NFC");
    if (noAccent !== word) results.push(noAccent);
    if (word.includes("b")) results.push(word.replace(/b/, "v"));
    else if (word.includes("v")) results.push(word.replace(/v/, "b"));
    if (word.includes("h")) results.push(word.replace(/h/, ""));
    if (word.includes("rr")) results.push(word.replace("rr", "r"));
    else if (word.includes("ll")) results.push(word.replace("ll", "l"));
    else if (word.includes("cc")) results.push(word.replace("cc", "c"));
    if (!word.includes("á") && word.includes("a")) results.push(word.replace("a", "á"));
    if (word.includes("ü")) results.push(word.replace("ü", "u"));
    if (word.includes("c") && !word.includes("ch")) results.push(word.replace(/c(?=[ei])/, "s"));
    if (word.includes("z")) results.push(word.replace("z", "s"));
    return [...new Set(results)].filter(r => r !== word);
  }
  function buildQuiz() {
    const shuffled = shuffleArray(allWords);
    return shuffled.slice(0, QUIZ_SIZE).map(w => {
      const misspellings = generateMisspellings(w.word);
      const options = shuffleArray([w.word, ...misspellings.slice(0, 3)]);
      return { ...w, options, correct: w.word };
    });
  }
  useEffect(() => { setQuestions(buildQuiz()); }, []);
  if (questions.length === 0) return <p>Loading...</p>;
  if (finished) {
    const pct = Math.round((score / QUIZ_SIZE) * 100);
    return (
      <div style={{ maxWidth: 500, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{pct >= 80 ? "🏆" : pct >= 60 ? "👍" : "📚"}</div>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{score} / {QUIZ_SIZE} Correct</h2>
        <p style={{ color: "#6b7280", fontSize: 16, marginBottom: 24 }}>{pct >= 80 ? "¡Excelente! You're ready to compete!" : pct >= 60 ? "¡Bien hecho! Keep practicing." : "Keep studying — you'll get there!"}</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => { setFinished(false); setCurrentQ(0); setScore(0); setSelected(null); setQuestions(buildQuiz()); }} style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: "#3498db", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>Try Again</button>
          <button onClick={onBack} style={{ padding: "12px 24px", borderRadius: 10, border: "1px solid #d1d5db", background: "white", cursor: "pointer", fontSize: 15 }}>Back to Menu</button>
        </div>
      </div>
    );
  }
  const q = questions[currentQ];
  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 14, marginBottom: 16 }}>← Back to menu</button>
      <div style={{ background: "#f3f4f6", borderRadius: 8, height: 6, marginBottom: 24 }}><div style={{ background: "#3498db", height: 6, borderRadius: 8, width: `${((currentQ + 1) / QUIZ_SIZE) * 100}%`, transition: "width 0.3s" }} /></div>
      <p style={{ color: "#6b7280", textAlign: "center", marginBottom: 4, fontSize: 14 }}>Question {currentQ + 1} of {QUIZ_SIZE}</p>
      <p style={{ textAlign: "center", fontSize: 13, color: q.color, marginBottom: 16 }}>{q.category}</p>
      <div style={{ background: "white", borderRadius: 16, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, alignItems: "center", marginBottom: 4 }}>
          <p style={{ fontSize: 16, color: "#374151" }}>Which is the correct spelling?</p>
          <SpeakButton word={q.correct} speak={speak} label="" />
        </div>
        <p style={{ fontSize: 14, color: "#6b7280", fontStyle: "italic", marginBottom: 20 }}>Meaning: {q.def}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {q.options.map((opt, i) => {
            let bg = "white", border = "1px solid #d1d5db";
            if (selected !== null) {
              if (opt === q.correct) { bg = "#d1fae5"; border = "2px solid #10b981"; }
              else if (opt === selected && opt !== q.correct) { bg = "#fee2e2"; border = "2px solid #ef4444"; }
            }
            return (<button key={i} onClick={() => { if (selected !== null) return; setSelected(opt); if (opt === q.correct) setScore(s => s + 1); }} style={{ padding: "14px 20px", borderRadius: 10, border, background: bg, color: "#1a1a2e", cursor: selected !== null ? "default" : "pointer", fontSize: 18, fontFamily: "Georgia, serif", textAlign: "center", transition: "all 0.2s" }}>{opt}</button>);
          })}
        </div>
        {selected !== null && (
          <div style={{ marginTop: 16 }}>
            <p style={{ color: selected === q.correct ? "#059669" : "#dc2626", fontWeight: 600, marginBottom: 4 }}>{selected === q.correct ? "✓ ¡Correcto!" : `✗ Correct: ${q.correct}`}</p>
            <p style={{ fontSize: 13, color: "#92400e", background: "#fef3c7", padding: "8px 12px", borderRadius: 8 }}>💡 {q.tip}</p>
            <button onClick={() => { if (currentQ + 1 >= QUIZ_SIZE) setFinished(true); else { setCurrentQ(currentQ + 1); setSelected(null); } }} style={{ marginTop: 14, padding: "10px 28px", borderRadius: 10, border: "none", background: "#3498db", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>{currentQ + 1 >= QUIZ_SIZE ? "See Results" : "Next →"}</button>
          </div>
        )}
      </div>
      <p style={{ textAlign: "center", color: "#6b7280", marginTop: 16, fontSize: 14 }}>Score: {score}/{currentQ + (selected !== null ? 1 : 0)}</p>
    </div>
  );
}

function SpellMode({ onBack }) {
  const [words] = useState(() => shuffleArray(allWords).slice(0, 10));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const { speak } = useSpanishVoice();
  const word = words[currentIndex];
  const checkAnswer = useCallback(() => {
    if (!input.trim()) return;
    const correct = input.trim() === word.word;
    if (correct) setScore(s => s + 1);
    setResult({ correct, answer: word.word });
  }, [input, word]);
  if (finished) {
    const pct = Math.round((score / 10) * 100);
    return (
      <div style={{ maxWidth: 500, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{pct >= 80 ? "🎯" : pct >= 60 ? "💪" : "📖"}</div>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{score} / 10</h2>
        <p style={{ color: "#6b7280", marginBottom: 24 }}>{pct >= 80 ? "¡Increíble! Your spelling is on point!" : "Keep practicing those accents and special characters!"}</p>
        <button onClick={onBack} style={{ padding: "12px 24px", borderRadius: 10, border: "1px solid #d1d5db", background: "white", cursor: "pointer", fontSize: 15 }}>Back to Menu</button>
      </div>
    );
  }
  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 14, marginBottom: 16 }}>← Back to menu</button>
      <div style={{ background: "#f3f4f6", borderRadius: 8, height: 6, marginBottom: 24 }}><div style={{ background: "#9b59b6", height: 6, borderRadius: 8, width: `${((currentIndex + 1) / 10) * 100}%`, transition: "width 0.3s" }} /></div>
      <div style={{ background: "white", borderRadius: 16, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", textAlign: "center" }}>
        <p style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: word.color, fontWeight: 600, marginBottom: 4 }}>{word.category}</p>
        <p style={{ fontSize: 14, marginBottom: 4, color: "#6b7280" }}>Word {currentIndex + 1} of 10</p>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}><SpeakButton word={word.word} speak={speak} label="Listen" /></div>
        <p style={{ fontSize: 16, color: "#374151", marginBottom: 4 }}><strong>Definition:</strong> {word.def}</p>
        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 20 }}>💡 {word.tip}</p>
        <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") checkAnswer(); }} placeholder="Type the word here..." disabled={result !== null} style={{ width: "100%", padding: "14px 16px", fontSize: 20, borderRadius: 10, border: "2px solid #d1d5db", textAlign: "center", fontFamily: "Georgia, serif", boxSizing: "border-box", outline: "none" }} autoFocus />
        {result === null ? (
          <button onClick={checkAnswer} style={{ marginTop: 16, padding: "12px 32px", borderRadius: 10, border: "none", background: "#9b59b6", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>Check ✓</button>
        ) : (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: result.correct ? "#059669" : "#dc2626" }}>{result.correct ? "✓ ¡Perfecto!" : `✗ Correct: ${result.answer}`}</p>
            {!result.correct && <p style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>You wrote: <span style={{ textDecoration: "line-through" }}>{input}</span></p>}
            <button onClick={() => { if (currentIndex + 1 >= 10) setFinished(true); else { setCurrentIndex(currentIndex + 1); setInput(""); setResult(null); } }} style={{ marginTop: 12, padding: "10px 28px", borderRadius: 10, border: "none", background: "#9b59b6", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>{currentIndex + 1 >= 10 ? "See Results" : "Next →"}</button>
          </div>
        )}
      </div>
      <p style={{ textAlign: "center", color: "#6b7280", marginTop: 16, fontSize: 14 }}>Score: {score}</p>
    </div>
  );
}

function ListenMode({ onBack }) {
  const [words] = useState(() => shuffleArray(allWords).slice(0, 10));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showDef, setShowDef] = useState(false);
  const [hasListened, setHasListened] = useState(false);
  const { speak, ready } = useSpanishVoice();
  const inputRef = useRef(null);
  const word = words[currentIndex];

  useEffect(() => {
    if (ready && !result) {
      const timer = setTimeout(() => { speak(word.word); setHasListened(true); }, 400);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, ready]);

  const handleListen = () => { speak(word.word); setHasListened(true); setTimeout(() => inputRef.current?.focus(), 100); };
  const handleListenSlow = () => { speak(word.word, 0.45); setHasListened(true); };
  const handleDefinition = () => { setShowDef(true); speak(word.def, 0.85); };
  const handleSentence = () => { speak(`${word.word}. ${word.def}. ${word.word}.`, 0.85); };

  const checkAnswer = useCallback(() => {
    if (!input.trim()) return;
    const correct = input.trim() === word.word;
    if (correct) setScore(s => s + 1);
    setResult({ correct, answer: word.word });
  }, [input, word]);

  const nextWord = () => {
    if (currentIndex + 1 >= 10) { setFinished(true); }
    else { setCurrentIndex(currentIndex + 1); setInput(""); setResult(null); setShowDef(false); setHasListened(false); }
  };

  if (finished) {
    const pct = Math.round((score / 10) * 100);
    return (
      <div style={{ maxWidth: 500, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{pct >= 90 ? "🏆" : pct >= 70 ? "🎯" : pct >= 50 ? "💪" : "📖"}</div>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{score} / 10</h2>
        <p style={{ color: "#6b7280", fontSize: 16, marginBottom: 24 }}>
          {pct >= 90 ? "¡Campeón/a! You nailed it by ear alone!" : pct >= 70 ? "¡Muy bien! Strong listening skills!" : pct >= 50 ? "Good effort — the tricky ones take practice." : "This mode is tough! Review the categories and try again."}
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => { setFinished(false); setCurrentIndex(0); setScore(0); setResult(null); setInput(""); setShowDef(false); setHasListened(false); }} style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: "#e67e22", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>Try Again</button>
          <button onClick={onBack} style={{ padding: "12px 24px", borderRadius: 10, border: "1px solid #d1d5db", background: "white", cursor: "pointer", fontSize: 15 }}>Back to Menu</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 14, marginBottom: 16 }}>← Back to menu</button>
      <div style={{ background: "#f3f4f6", borderRadius: 8, height: 6, marginBottom: 24 }}><div style={{ background: "#e67e22", height: 6, borderRadius: 8, width: `${((currentIndex + 1) / 10) * 100}%`, transition: "width 0.3s" }} /></div>

      <div style={{ background: "white", borderRadius: 16, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", textAlign: "center" }}>
        <p style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1.5, color: "#e67e22", fontWeight: 700, marginBottom: 4 }}>🎧 Listen & Spell</p>
        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 16 }}>Word {currentIndex + 1} of 10</p>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <button onClick={handleListen} style={{ width: 100, height: 100, borderRadius: "50%", border: "none", background: hasListened ? "#e67e22" : "#f59e0b", color: "white", fontSize: 40, cursor: "pointer", boxShadow: "0 4px 20px rgba(230,126,34,0.35)", transition: "all 0.3s", display: "flex", alignItems: "center", justifyContent: "center" }} title="Listen to the word">🔊</button>
        </div>

        <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>Just like the real bee — you can ask for:</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 16, flexWrap: "wrap" }}>
          <button onClick={handleListen} style={{ padding: "8px 14px", borderRadius: 20, border: "1px solid #d1d5db", background: "white", color: "#374151", cursor: "pointer", fontSize: 13 }}>🔁 Repeat</button>
          <button onClick={handleListenSlow} style={{ padding: "8px 14px", borderRadius: 20, border: "1px solid #d1d5db", background: "white", color: "#374151", cursor: "pointer", fontSize: 13 }}>🐢 Slow</button>
          <button onClick={handleDefinition} style={{ padding: "8px 14px", borderRadius: 20, border: "1px solid #d1d5db", background: showDef ? "#f0f9ff" : "white", color: "#374151", cursor: "pointer", fontSize: 13 }}>📖 Definition</button>
          <button onClick={handleSentence} style={{ padding: "8px 14px", borderRadius: 20, border: "1px solid #d1d5db", background: "white", color: "#374151", cursor: "pointer", fontSize: 13 }}>💬 In context</button>
        </div>

        {showDef && !result && <p style={{ fontSize: 15, color: "#374151", fontStyle: "italic", marginBottom: 12, background: "#f0f9ff", padding: "8px 14px", borderRadius: 8 }}>{word.def}</p>}

        <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") checkAnswer(); }} placeholder={hasListened ? "Spell the word..." : "Press 🔊 to listen first"} disabled={result !== null} style={{ width: "100%", padding: "14px 16px", fontSize: 22, borderRadius: 10, border: result === null ? "2px solid #f59e0b" : result.correct ? "2px solid #10b981" : "2px solid #ef4444", textAlign: "center", fontFamily: "Georgia, serif", boxSizing: "border-box", outline: "none", background: result === null ? "white" : result.correct ? "#d1fae5" : "#fee2e2" }} autoFocus />

        {result === null && (
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            {["á", "é", "í", "ó", "ú", "ü", "ñ"].map(char => (
              <button key={char} onClick={() => { setInput(prev => prev + char); inputRef.current?.focus(); }} style={{ width: 38, height: 38, borderRadius: 8, border: "1px solid #d1d5db", background: "#fafafa", fontSize: 18, cursor: "pointer", fontFamily: "Georgia, serif", display: "flex", alignItems: "center", justifyContent: "center" }}>{char}</button>
            ))}
          </div>
        )}

        {result === null ? (
          <button onClick={checkAnswer} style={{ marginTop: 16, padding: "12px 32px", borderRadius: 10, border: "none", background: "#e67e22", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>Check ✓</button>
        ) : (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: result.correct ? "#059669" : "#dc2626", marginBottom: 4 }}>{result.correct ? "✓ ¡Correcto!" : "✗ Incorrect"}</p>
            <p style={{ fontSize: 26, fontWeight: 700, fontFamily: "Georgia, serif", color: "#1a1a2e", marginBottom: 4 }}>{result.answer}</p>
            {!result.correct && <p style={{ fontSize: 14, color: "#6b7280" }}>You wrote: <span style={{ textDecoration: "line-through", color: "#ef4444" }}>{input}</span></p>}
            <p style={{ fontSize: 13, color: "#92400e", background: "#fef3c7", padding: "8px 12px", borderRadius: 8, marginTop: 8 }}>💡 {word.tip}</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 10 }}><SpeakButton word={word.word} speak={speak} label="Hear it" /></div>
            <button onClick={nextWord} style={{ marginTop: 12, padding: "10px 28px", borderRadius: 10, border: "none", background: "#e67e22", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>{currentIndex + 1 >= 10 ? "See Results" : "Next →"}</button>
          </div>
        )}
      </div>
      <p style={{ textAlign: "center", color: "#6b7280", marginTop: 16, fontSize: 14 }}>Score: {score}</p>
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState("menu");
  const [studyCategory, setStudyCategory] = useState(null);
  const wrapper = (children) => (<div style={{ minHeight: "100vh", background: "#f8fafc", padding: "24px 16px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>{children}</div>);

  if (mode === "study" && studyCategory) return wrapper(<StudyMode words={CATEGORIES[studyCategory].words} category={studyCategory} onBack={() => { setMode("menu"); setStudyCategory(null); }} />);
  if (mode === "quiz") return wrapper(<QuizMode onBack={() => setMode("menu")} />);
  if (mode === "spell") return wrapper(<SpellMode onBack={() => setMode("menu")} />);
  if (mode === "listen") return wrapper(<ListenMode onBack={() => setMode("menu")} />);

  return wrapper(
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <p style={{ fontSize: 32, marginBottom: 4 }}>🐝</p>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a1a2e", marginBottom: 4 }}>Spanish Spelling Bee</h1>
        <p style={{ fontSize: 15, color: "#6b7280" }}>Study Guide — 2026 NSSB Word List</p>
        <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>{allWords.length} difficult words across {Object.keys(CATEGORIES).length} categories</p>
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 600, color: "#374151", marginBottom: 10 }}>Practice Modes</h2>
      <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
        <button onClick={() => setMode("listen")} style={{ flex: "1 1 100%", padding: "18px 16px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #e67e22, #f39c12)", color: "white", cursor: "pointer", fontSize: 16, fontWeight: 700, boxShadow: "0 4px 16px rgba(230,126,34,0.3)", textAlign: "center" }}>
          🎧 Listen & Spell — Competition Style
          <span style={{ display: "block", fontSize: 12, fontWeight: 400, opacity: 0.9, marginTop: 2 }}>Hear the word, ask for definition or repetition, then spell it</span>
        </button>
        <button onClick={() => setMode("quiz")} style={{ flex: "1 1 140px", padding: "14px 12px", borderRadius: 12, border: "none", background: "#3498db", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>🎯 Multiple Choice</button>
        <button onClick={() => setMode("spell")} style={{ flex: "1 1 140px", padding: "14px 12px", borderRadius: 12, border: "none", background: "#9b59b6", color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>⌨️ Type with Hints</button>
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 600, color: "#374151", marginBottom: 10 }}>Study by Category</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {Object.entries(CATEGORIES).map(([name, data]) => (
          <button key={name} onClick={() => { setStudyCategory(name); setMode("study"); }}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: 12, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", textAlign: "left", transition: "box-shadow 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)"} onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: data.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><div style={{ width: 14, height: 14, borderRadius: "50%", background: data.color }} /></div>
            <div style={{ flex: 1 }}><p style={{ fontWeight: 600, color: "#1a1a2e", fontSize: 15, marginBottom: 2 }}>{name}</p><p style={{ color: "#6b7280", fontSize: 13 }}>{data.description}</p></div>
            <span style={{ color: "#9ca3af", fontSize: 13, flexShrink: 0 }}>{data.words.length} words</span>
          </button>
        ))}
      </div>
    </div>
  );
}
