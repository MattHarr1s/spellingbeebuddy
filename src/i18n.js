// ─── Bilingual UI Strings (EN / ES-MX) ─────────────────────────────────────
export const STRINGS = {
  en: {
    // App header
    appTitle: "eSpellñol",
    appSubtitle: "Spanish Spelling Bee — 2026 NSSB Study Guide",
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

    // Voice selector
    voiceLabel: "Voice",
    voiceFemale: "F",
    voiceMale: "M",
    voiceMixed: "Mix",
    voiceRandom: "Random",

    // Dark mode
    switchToLight: "Switch to light mode",
    switchToDark: "Switch to dark mode",

    // Support
    enjoyingApp: "Enjoying this app? Help keep it free!",
    supportKofi: "Support on Ko-fi",
    adSpace: "Ad space",

    // Footer
    footerEvent: "eSpellñol • National Spanish Spelling Bee — July 10-11, 2026",
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

    // Dashboard
    progressDashboard: "Progress Dashboard",
    overallProgress: "Overall Progress",
    wordsPracticed: "Practiced",
    wordsMastered: "Mastered",
    totalAttempts: "Attempts",
    overallAccuracy: "Accuracy",
    studyStreak: "Study Streak",
    currentStreak: "Current",
    longestStreak: "Longest",
    daysStudied: "Days Studied",
    days: "days",
    day: "day",
    categoryProgress: "Category Progress",
    recentActivity: "Recent Activity",
    noProgressYet: "No progress yet!",
    startPracticingPrompt: "Start practicing to see your stats here.",
    resetProgress: "Reset Progress",
    resetConfirm: "Reset all progress and streak data? This cannot be undone.",
    todayPracticed: "today",
    correct: "correct",
    wrong: "wrong",
    startPracticing: "Start Practicing",

    // Error feedback (Phase 1)
    errorAccent: "Accent error",
    errorBV: "B/V mix-up",
    errorH: "Missing H",
    errorDouble: "Double letter missed",
    errorDieresis: "Missing diéresis (ü)",
    errorZS: "Z/S confusion",
    errorCS: "C/S confusion",
    errorYLL: "Y/LL confusion",
    errorTilde: "Missing tilde (ñ)",
    errorOther: "Spelling error",
    yourAnswer: "Your answer",
    correctSpelling: "Correct spelling",
    errorPattern: "Error pattern",

    // Smart Review / SRS (Phase 2)
    smartReview: "Smart Review",
    smartReviewDesc: "Review words using spaced repetition",
    wordsForReview: (n) => `${n} word${n !== 1 ? "s" : ""} due for review`,
    noWordsDue: "No words due for review right now!",
    boxPromoted: "Promoted! Next review later",
    boxReset: "Reset — you'll see this again soon",
    reviewComplete: "Review Complete!",
    wordsPromoted: (n) => `${n} promoted`,
    wordsReset: (n) => `${n} reset`,
    nextReviewIn: (d) => `Next review in ${d} day${d !== 1 ? "s" : ""}`,
    srsBox: "Box",

    // Smart Practice / Test-Study-Test (Phase 3)
    smartPractice: "Smart Practice",
    smartPracticeDesc: "Test → Study → Retest until mastered",
    diagnosticQuiz: "Diagnostic Quiz",
    studyMissedWords: "Study Missed Words",
    retestPhase: "Retest",
    allWordsMastered: "All words mastered!",
    continueToStudy: "Study Missed Words",
    continueToRetest: "Retest Missed Words",
    exitPractice: "Exit Practice",
    roundN: (n) => `Round ${n}`,
    errorsByType: "Errors by Type",
    completedInRounds: (n) => `Mastered in ${n} round${n !== 1 ? "s" : ""}!`,
    startDiagnostic: "Start Diagnostic",
    selectCategory: "Select a category (optional)",
    allCategories: "All Categories",
    wordsToReview: (n) => `${n} to review`,

    // About page
    about: "About",
    aboutEspellnol: "About eSpellñol",
    aboutStory: "eSpellñol was born from a simple wish — to help my 11-year-old son prepare for a qualifying Spanish Spelling Bee at his school. When I searched for study tools, I found very little that was interactive, engaging, or built around the official word list. So I built one.",
    aboutMission: "My hope is that eSpellñol helps other students and families preparing for local, regional, and national Spanish spelling bees. Whether your child is a native speaker sharpening their orthography or a Spanish learner building confidence, this app is for them.",
    aboutFree: "eSpellñol is free, has no ads (yet!), and works offline. It's a labor of love for the bilingual education community.",
    madeWithLove: "Made with love for the bilingual education community",

    // NSSB Info
    nssbFull: "National Spanish Spelling Bee",
    nssbAcronym: "NSSB",
    nssbAbout: "The National Spanish Spelling Bee (NSSB) is an annual competition where students in grades 4–8 showcase their mastery of Spanish orthography. Students who place at a state or regional qualifying bee earn the chance to compete at the national level.",
    nssbHistory: "Founded in 2011, the NSSB has grown from a regional event into a nationwide celebration of bilingual achievement, drawing competitors from states across the country including Texas, New Mexico, California, New Jersey, Georgia, Oregon, and more.",
    nssbHost: "The NSSB is hosted by the Association for Bilingual Education of New Mexico (ABE-NM) at the National Hispanic Cultural Center in Albuquerque, NM.",
    nssbMission: "The competition fosters self-confidence, cultural exchange, and academic excellence — celebrating language, learning, and community.",
    nssbEligibility: "Grades 4–8 · Must qualify at a state or regional bee",
    nssbWebsite: "Official Website",
    nssbLearnMore: "Learn more about NSSB",
    nssbEvent2026: "15th Annual NSSB — July 10–11, 2026",

    // Countdown
    countdown: "Countdown to NSSB 2026",
    countdownDays: "days",
    countdownHours: "hrs",
    countdownMins: "min",
    countdownSecs: "sec",
    countdownPast: "The 2026 NSSB has begun!",
  },

  es: {
    // App header
    appTitle: "eSpellñol",
    appSubtitle: "Concurso de Deletreo — Guía de estudio NSSB 2026",
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

    // Voice selector
    voiceLabel: "Voz",
    voiceFemale: "F",
    voiceMale: "M",
    voiceMixed: "Var",
    voiceRandom: "Aleatorio",

    // Dark mode
    switchToLight: "Cambiar a modo claro",
    switchToDark: "Cambiar a modo oscuro",

    // Support
    enjoyingApp: "¿Te gusta esta app? ¡Ayúdanos a mantenerla gratis!",
    supportKofi: "Apoyar en Ko-fi",
    adSpace: "Espacio publicitario",

    // Footer
    footerEvent: "eSpellñol • National Spanish Spelling Bee — 10-11 de julio, 2026",
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

    // Dashboard
    progressDashboard: "Panel de progreso",
    overallProgress: "Progreso general",
    wordsPracticed: "Practicadas",
    wordsMastered: "Dominadas",
    totalAttempts: "Intentos",
    overallAccuracy: "Precisión",
    studyStreak: "Racha de estudio",
    currentStreak: "Actual",
    longestStreak: "Más larga",
    daysStudied: "Días estudiados",
    days: "días",
    day: "día",
    categoryProgress: "Progreso por categoría",
    recentActivity: "Actividad reciente",
    noProgressYet: "¡Aún no hay progreso!",
    startPracticingPrompt: "Empieza a practicar para ver tus estadísticas aquí.",
    resetProgress: "Reiniciar progreso",
    resetConfirm: "¿Reiniciar todo el progreso y racha? Esto no se puede deshacer.",
    todayPracticed: "hoy",
    correct: "correcta",
    wrong: "incorrecta",
    startPracticing: "Empezar a practicar",

    // Error feedback (Phase 1)
    errorAccent: "Error de acento",
    errorBV: "Confusión B/V",
    errorH: "H omitida",
    errorDouble: "Letra doble omitida",
    errorDieresis: "Diéresis (ü) omitida",
    errorZS: "Confusión Z/S",
    errorCS: "Confusión C/S",
    errorYLL: "Confusión Y/LL",
    errorTilde: "Tilde (ñ) omitida",
    errorOther: "Error de ortografía",
    yourAnswer: "Tu respuesta",
    correctSpelling: "Ortografía correcta",
    errorPattern: "Patrón de error",

    // Smart Review / SRS (Phase 2)
    smartReview: "Repaso inteligente",
    smartReviewDesc: "Repasa palabras con repetición espaciada",
    wordsForReview: (n) => `${n} palabra${n !== 1 ? "s" : ""} para repasar`,
    noWordsDue: "¡No hay palabras para repasar ahora!",
    boxPromoted: "¡Promovida! Próximo repaso después",
    boxReset: "Reiniciada — la verás de nuevo pronto",
    reviewComplete: "¡Repaso completado!",
    wordsPromoted: (n) => `${n} promovida${n !== 1 ? "s" : ""}`,
    wordsReset: (n) => `${n} reiniciada${n !== 1 ? "s" : ""}`,
    nextReviewIn: (d) => `Próximo repaso en ${d} día${d !== 1 ? "s" : ""}`,
    srsBox: "Caja",

    // Smart Practice / Test-Study-Test (Phase 3)
    smartPractice: "Práctica inteligente",
    smartPracticeDesc: "Prueba → Estudia → Reprueba hasta dominar",
    diagnosticQuiz: "Quiz diagnóstico",
    studyMissedWords: "Estudiar palabras falladas",
    retestPhase: "Reprueba",
    allWordsMastered: "¡Todas las palabras dominadas!",
    continueToStudy: "Estudiar palabras falladas",
    continueToRetest: "Reprobar palabras falladas",
    exitPractice: "Salir de la práctica",
    roundN: (n) => `Ronda ${n}`,
    errorsByType: "Errores por tipo",
    completedInRounds: (n) => `¡Dominado en ${n} ronda${n !== 1 ? "s" : ""}!`,
    startDiagnostic: "Comenzar diagnóstico",
    selectCategory: "Selecciona una categoría (opcional)",
    allCategories: "Todas las categorías",
    wordsToReview: (n) => `${n} para repasar`,

    // About page
    about: "Acerca de",
    aboutEspellnol: "Acerca de eSpellñol",
    aboutStory: "eSpellñol nació de un deseo sencillo — ayudar a mi hijo de 11 años a prepararse para un concurso de deletreo en español en su escuela. Cuando busqué herramientas de estudio, encontré muy poco que fuera interactivo, atractivo o basado en la lista oficial de palabras. Así que construí una.",
    aboutMission: "Mi esperanza es que eSpellñol ayude a otros estudiantes y familias que se preparan para concursos de deletreo en español a nivel local, regional y nacional. Ya sea que tu hijo/a sea hispanohablante nativo perfeccionando su ortografía o un estudiante de español ganando confianza, esta app es para ellos.",
    aboutFree: "eSpellñol es gratis, no tiene anuncios (¡aún!) y funciona sin conexión. Es un trabajo hecho con cariño para la comunidad de educación bilingüe.",
    madeWithLove: "Hecho con cariño para la comunidad de educación bilingüe",

    // NSSB Info
    nssbFull: "National Spanish Spelling Bee",
    nssbAcronym: "NSSB",
    nssbAbout: "El National Spanish Spelling Bee (NSSB) es una competencia anual donde estudiantes de grados 4–8 demuestran su dominio de la ortografía española. Los estudiantes que se colocan en un concurso estatal o regional ganan la oportunidad de competir a nivel nacional.",
    nssbHistory: "Fundado en 2011, el NSSB ha crecido de un evento regional a una celebración nacional del logro bilingüe, atrayendo competidores de estados como Texas, Nuevo México, California, Nueva Jersey, Georgia, Oregón y más.",
    nssbHost: "El NSSB es organizado por la Asociación para la Educación Bilingüe de Nuevo México (ABE-NM) en el Centro Nacional de Cultura Hispana en Albuquerque, NM.",
    nssbMission: "La competencia fomenta la autoconfianza, el intercambio cultural y la excelencia académica — celebrando el idioma, el aprendizaje y la comunidad.",
    nssbEligibility: "Grados 4–8 · Debe calificar en un concurso estatal o regional",
    nssbWebsite: "Sitio web oficial",
    nssbLearnMore: "Más información sobre el NSSB",
    nssbEvent2026: "15° NSSB Anual — 10–11 de julio, 2026",

    // Countdown
    countdown: "Cuenta regresiva para el NSSB 2026",
    countdownDays: "días",
    countdownHours: "hrs",
    countdownMins: "min",
    countdownSecs: "seg",
    countdownPast: "¡El NSSB 2026 ha comenzado!",
  },
};
