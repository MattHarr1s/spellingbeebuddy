// ─── Bilingual UI Strings (EN / ES-MX) ─────────────────────────────────────
export const STRINGS = {
  en: {
    // App header
    appTitle: "Spanish Spelling Bee",
    appSubtitle: "Study Guide — 2026 NSSB Word List",
    wordsAndMastered: (n, m) => `${n} words · ${m} mastered`,

    // Practice modes
    practiceModes: "Practice Modes",
    listenSpellTitle: "Listen & Spell — Competition Style",
    listenSpellDesc: "Hear the word, ask for definition or repetition, then spell it",
    multipleChoice: "Multiple Choice",
    typeWithHints: "Type with Hints",
    wordListTitle: "Word List",
    wordListDesc: (n) => `Browse, filter, and search all ${n} words`,

    // Category display names (keyed by internal English name)
    cat: {
      "Silent H": "Silent H",
      "Accents & Tildes": "Accents & Tildes",
      "Double Letters": "Double Letters",
      "B vs V": "B vs V",
      "Diéresis (ü)": "Diéresis (ü)",
      "Tricky Combos": "Tricky Combos",
      "Z Words": "Z Words",
      "S Words": "S Words",
      "V Words": "V Words",
      "B Words": "B Words",
      "H Words": "H Words",
      "C Words": "C Words",
      "LL Words": "LL Words",
      "Y Words": "Y Words",
    },
    catDesc: {
      "Silent H": "Words with silent 'h' — easy to forget!",
      "Accents & Tildes": "Words where the accent mark changes everything",
      "Double Letters": "Words with cc, rr, ll, nn — don't miss the double!",
      "B vs V": "B and V sound the same — know which to use!",
      "Diéresis (ü)": "Words with güe/güi where the ü is required",
      "Tricky Combos": "X, SC, PS, GN, and other unusual letter clusters",
      "Z Words": "Words with Z — often confused with S",
      "S Words": "Tricky S words — S, C, or Z?",
      "V Words": "Words with V — don't swap for B!",
      "B Words": "Words with B — don't swap for V!",
      "H Words": "Words with H — it's always silent in Spanish!",
      "C Words": "C before E/I sounds like S — tricky spelling!",
      "LL Words": "Words with LL — don't confuse with Y!",
      "Y Words": "Words with Y — don't confuse with LL!",
    },

    // Navigation
    back: "Back",
    categories: "Categories",
    menu: "Menu",

    // Speed labels
    speedLabels: { 0.4: "Very Slow", 0.6: "Slow", 0.8: "Normal", 1.0: "Fast", 1.2: "Faster" },

    // StudyMode
    nOfM: (n, m) => `${n} of ${m}`,
    spellingHidden: "Spelling hidden — listen and try to remember!",
    revealingIn: (n) => `Revealing in ${n}s`,
    hideSpelling: "Hide Spelling",
    showSpelling: "Show Spelling",
    hideDefinition: "Hide Definition",
    showDefinition: "Show Definition",
    hideTip: "Hide Tip",
    showTip: "Show Tip",
    listen: "Listen",
    previous: "← Previous",
    next: "Next →",
    noWordsInCategory: "No words in this category.",
    keyboardShortcuts: "← → navigate · Space listen · Enter flip · Esc back",
    off: "Off",

    // QuizMode
    loadingQuiz: "Loading quiz...",
    nCorrect: (s, t) => `${s} / ${t} Correct`,
    whichCorrectSpelling: "Which is the correct spelling?",
    correctExclaim: "✓ ¡Correcto!",
    incorrectAnswer: (w) => `✗ Correct: ${w}`,
    questionNOfM: (n, m) => `Question ${n} of ${m}`,
    missedWordsLabel: "(missed words)",
    seeResults: "See Results",
    tryAgain: "Try Again",
    practiceMissed: (n) => `Practice ${n} Missed`,
    backToMenu: "Back to Menu",
    score: "Score",

    // Result messages
    excellentReady: "¡Excelente! You're ready to compete!",
    goodJob: "¡Bien hecho! Keep practicing.",
    keepStudying: "Keep studying — you'll get there!",
    incredibleSpelling: "¡Increíble! Your spelling is on point!",
    keepPracticingAccents: "Keep practicing those accents and special characters!",
    championEar: "¡Campeón/a! You nailed it by ear alone!",
    strongListening: "¡Muy bien! Strong listening skills!",
    goodEffort: "Good effort — the tricky ones take practice.",
    toughMode: "This mode is tough! Review the categories and try again.",

    // SpellMode / ListenMode
    wordNOfM: (n, m) => `Word ${n} of ${m}`,
    typeOrMic: "Type or use mic to spell...",
    pressListenFirst: "Press 🔊 first",
    check: "Check ✓",
    perfecto: "✓ ¡Perfecto!",
    correctLettersAccents: "✓ Correct letters! Accents need work.",
    rightLettersCheckAccents: "✓ Right letters! Check accents.",
    almost: (pct) => `Almost! (${pct}% match)`,
    incorrect: "✗ Incorrect",
    youWrote: "You wrote",
    hearIt: "Hear it",

    // ListenMode specific
    listenAndSpell: "Listen & Spell",
    justLikeRealBee: "Just like the real bee — you can ask for:",
    repeat: "Repeat",
    slow: "Slow",
    def: "Def",
    useInContext: "Use in context",

    // Favorites
    favorites: "Favorites",
    yourStarredWords: "Your Starred Words",
    practiceBookmarked: "Practice your bookmarked words",
    removeFromFavorites: "Remove from favorites",
    addToFavorites: "Add to favorites",

    // Word List / Search
    searchWordsPlaceholder: "Search words...",
    searchWordsDefsPlaceholder: "Search words, definitions...",
    mastered: "Mastered",
    practiced: "Practiced",
    notPracticed: "Not practiced",
    showingNOfM: (n, m) => `Showing ${n} of ${m} words`,
    noWordsMatchFilters: "No words match your filters",
    tryAdjusting: "Try adjusting your search or removing filters",
    nWordsFound: (n) => `${n} word${n !== 1 ? "s" : ""} found`,
    noWordsMatch: (q) => `No words match "${q}"`,
    showingFirstN: (n, total) => `Showing first ${n} of ${total} results`,
    studyByCategory: "Study by Category",
    nWords: (n) => `${n} words`,

    // Quick filter labels
    favoritesFilter: "Favorites",
    masteredFilter: "Mastered",
    notPracticedFilter: "Not practiced",

    // Voice
    stopVoice: "Stop voice input",
    spellByVoice: "Spell by voice",
    which: "Which?",

    // Dark mode
    switchToLight: "Switch to light mode",
    switchToDark: "Switch to dark mode",

    // Support
    enjoyingApp: "Enjoying this app? Help keep it free!",
    supportKofi: "Support on Ko-fi",
    adSpace: "Ad space",

    // Footer
    footerEvent: "National Spanish Spelling Bee — July 10-11, 2026",
    footerLocation: "Albuquerque, NM • nationalspanishspellingbee.com",

    // Category practice buttons
    quiz: "Quiz",
    spell: "Spell",

    // Locale toggle
    english: "English",
    spanish: "Español",

    // Mode labels
    searchResults: "Search Results",
    wordList: "Word List",
  },

  es: {
    // App header
    appTitle: "Concurso de Deletreo",
    appSubtitle: "Guía de estudio — Lista de palabras NSSB 2026",
    wordsAndMastered: (n, m) => `${n} palabras · ${m} dominadas`,

    // Practice modes
    practiceModes: "Modos de práctica",
    listenSpellTitle: "Escucha y deletrea — Estilo competencia",
    listenSpellDesc: "Escucha la palabra, pide definición o repetición, y deletréala",
    multipleChoice: "Opción múltiple",
    typeWithHints: "Escribe con pistas",
    wordListTitle: "Lista de palabras",
    wordListDesc: (n) => `Explora, filtra y busca las ${n} palabras`,

    // Category display names
    cat: {
      "Silent H": "H muda",
      "Accents & Tildes": "Acentos y tildes",
      "Double Letters": "Letras dobles",
      "B vs V": "B contra V",
      "Diéresis (ü)": "Diéresis (ü)",
      "Tricky Combos": "Combinaciones difíciles",
      "Z Words": "Palabras con Z",
      "S Words": "Palabras con S",
      "V Words": "Palabras con V",
      "B Words": "Palabras con B",
      "H Words": "Palabras con H",
      "C Words": "Palabras con C",
      "LL Words": "Palabras con LL",
      "Y Words": "Palabras con Y",
    },
    catDesc: {
      "Silent H": "Palabras con 'h' muda — ¡fácil de olvidar!",
      "Accents & Tildes": "Palabras donde el acento lo cambia todo",
      "Double Letters": "Palabras con cc, rr, ll, nn — ¡no olvides la doble!",
      "B vs V": "B y V suenan igual — ¡hay que saber cuál usar!",
      "Diéresis (ü)": "Palabras con güe/güi donde se necesita la ü",
      "Tricky Combos": "X, SC, PS, GN y otros grupos de letras poco comunes",
      "Z Words": "Palabras con Z — a menudo confundida con S",
      "S Words": "Palabras con S difíciles — ¿S, C o Z?",
      "V Words": "Palabras con V — ¡no la cambies por B!",
      "B Words": "Palabras con B — ¡no la cambies por V!",
      "H Words": "Palabras con H — ¡siempre es muda en español!",
      "C Words": "C antes de E/I suena como S — ¡deletreo difícil!",
      "LL Words": "Palabras con LL — ¡no la confundas con Y!",
      "Y Words": "Palabras con Y — ¡no la confundas con LL!",
    },

    // Navigation
    back: "Atrás",
    categories: "Categorías",
    menu: "Menú",

    // Speed labels
    speedLabels: { 0.4: "Muy lento", 0.6: "Lento", 0.8: "Normal", 1.0: "Rápido", 1.2: "Más rápido" },

    // StudyMode
    nOfM: (n, m) => `${n} de ${m}`,
    spellingHidden: "Deletreo oculto — ¡escucha e intenta recordar!",
    revealingIn: (n) => `Se muestra en ${n}s`,
    hideSpelling: "Ocultar deletreo",
    showSpelling: "Mostrar deletreo",
    hideDefinition: "Ocultar definición",
    showDefinition: "Mostrar definición",
    hideTip: "Ocultar pista",
    showTip: "Mostrar pista",
    listen: "Escuchar",
    previous: "← Anterior",
    next: "Siguiente →",
    noWordsInCategory: "No hay palabras en esta categoría.",
    keyboardShortcuts: "← → navegar · Espacio escuchar · Enter voltear · Esc atrás",
    off: "No",

    // QuizMode
    loadingQuiz: "Cargando quiz...",
    nCorrect: (s, t) => `${s} / ${t} Correctas`,
    whichCorrectSpelling: "¿Cuál es el deletreo correcto?",
    correctExclaim: "✓ ¡Correcto!",
    incorrectAnswer: (w) => `✗ Correcto: ${w}`,
    questionNOfM: (n, m) => `Pregunta ${n} de ${m}`,
    missedWordsLabel: "(palabras falladas)",
    seeResults: "Ver resultados",
    tryAgain: "Intentar de nuevo",
    practiceMissed: (n) => `Practicar ${n} falladas`,
    backToMenu: "Volver al menú",
    score: "Puntuación",

    // Result messages
    excellentReady: "¡Excelente! ¡Estás listo/a para competir!",
    goodJob: "¡Bien hecho! Sigue practicando.",
    keepStudying: "¡Sigue estudiando — lo vas a lograr!",
    incredibleSpelling: "¡Increíble! ¡Tu deletreo es perfecto!",
    keepPracticingAccents: "¡Sigue practicando los acentos y caracteres especiales!",
    championEar: "¡Campeón/a! ¡Lo lograste solo de oído!",
    strongListening: "¡Muy bien! ¡Tienes buen oído!",
    goodEffort: "Buen esfuerzo — las difíciles requieren práctica.",
    toughMode: "¡Este modo es difícil! Repasa las categorías e inténtalo de nuevo.",

    // SpellMode / ListenMode
    wordNOfM: (n, m) => `Palabra ${n} de ${m}`,
    typeOrMic: "Escribe o usa el micrófono...",
    pressListenFirst: "Presiona 🔊 primero",
    check: "Verificar ✓",
    perfecto: "✓ ¡Perfecto!",
    correctLettersAccents: "✓ ¡Letras correctas! Revisa los acentos.",
    rightLettersCheckAccents: "✓ ¡Letras correctas! Revisa los acentos.",
    almost: (pct) => `¡Casi! (${pct}% de coincidencia)`,
    incorrect: "✗ Incorrecto",
    youWrote: "Escribiste",
    hearIt: "Escuchar",

    // ListenMode specific
    listenAndSpell: "Escucha y deletrea",
    justLikeRealBee: "Como en la competencia real — puedes pedir:",
    repeat: "Repetir",
    slow: "Lento",
    def: "Def",
    useInContext: "Usar en contexto",

    // Favorites
    favorites: "Favoritos",
    yourStarredWords: "Tus palabras favoritas",
    practiceBookmarked: "Practica tus palabras guardadas",
    removeFromFavorites: "Quitar de favoritos",
    addToFavorites: "Agregar a favoritos",

    // Word List / Search
    searchWordsPlaceholder: "Buscar palabras...",
    searchWordsDefsPlaceholder: "Buscar palabras, definiciones...",
    mastered: "Dominada",
    practiced: "Practicada",
    notPracticed: "Sin practicar",
    showingNOfM: (n, m) => `Mostrando ${n} de ${m} palabras`,
    noWordsMatchFilters: "Ninguna palabra coincide con tus filtros",
    tryAdjusting: "Intenta ajustar tu búsqueda o quitar filtros",
    nWordsFound: (n) => `${n} palabra${n !== 1 ? "s" : ""} encontrada${n !== 1 ? "s" : ""}`,
    noWordsMatch: (q) => `Ninguna palabra coincide con "${q}"`,
    showingFirstN: (n, total) => `Mostrando las primeras ${n} de ${total} resultados`,
    studyByCategory: "Estudiar por categoría",
    nWords: (n) => `${n} palabras`,

    // Quick filter labels
    favoritesFilter: "Favoritos",
    masteredFilter: "Dominadas",
    notPracticedFilter: "Sin practicar",

    // Voice
    stopVoice: "Detener entrada de voz",
    spellByVoice: "Deletrear por voz",
    which: "¿Cuál?",

    // Dark mode
    switchToLight: "Cambiar a modo claro",
    switchToDark: "Cambiar a modo oscuro",

    // Support
    enjoyingApp: "¿Te gusta esta app? ¡Ayúdanos a mantenerla gratis!",
    supportKofi: "Apoyar en Ko-fi",
    adSpace: "Espacio publicitario",

    // Footer
    footerEvent: "National Spanish Spelling Bee — 10-11 de julio, 2026",
    footerLocation: "Albuquerque, NM • nationalspanishspellingbee.com",

    // Category practice buttons
    quiz: "Quiz",
    spell: "Deletrear",

    // Locale toggle
    english: "English",
    spanish: "Español",

    // Mode labels
    searchResults: "Resultados de búsqueda",
    wordList: "Lista de palabras",
  },
};
