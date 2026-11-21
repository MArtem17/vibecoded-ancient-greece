/* global window, localStorage, location, document */
(function () {
  var STORAGE_KEY = "gr_deck_lang";
  var THEME_KEY = "gr_deck_theme";
  var match = /[?&]lang=(ru|en)\b/.exec(location.search);
  var stored = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch (e) {}

  var lang = (match && match[1]) || stored || "ru";
  if (lang !== "ru" && lang !== "en") lang = "ru";

  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch (e2) {}

  var themeMatch = /[?&]theme=(light|dark)\b/.exec(location.search);
  var storedTheme = null;
  try {
    storedTheme = localStorage.getItem(THEME_KEY);
  } catch (e3) {}
  var theme = (themeMatch && themeMatch[1]) || storedTheme || "light";
  if (theme !== "light" && theme !== "dark") theme = "light";
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e4) {}

  function applyTheme(nextTheme) {
    try {
      document.documentElement.setAttribute("data-theme", nextTheme);
    } catch (e) {}
  }
  applyTheme(theme);

  var UI_EN = {
    deckTitle: "Ancient Greece",
    deckSub: "OBRAZOVARIUM · GREECE",
    tabMap: "Map",
    tabGallery: "Gallery",
    tabQuest: "Quest",
    passed: "passed",
    gears: "gears",
    chapters: "chapters",
    galleryIntro:
      "Deck iconostasis — all 25 cards. Tap a card to zoom and flip. Green border — task passed, gold — studied.",
    questIntro:
      "Story with Sandra and Roborik. In each chapter: dialogue, a card quiz, then a minigame. Open the card for hints — the card task in Play is separate.",
    modalHint: "tap the card — flip",
    modalPlay: "Take the task →",
    modalPrev: "Previous card",
    modalNext: "Next card",
    backToMap: "← Back to map",
    mapFloatHint: "← scroll map · drag cards · tap to open",
    btnGallery: "View all cards",
    btnQuest: "Start adventure",
    mapTitle: "Map of Ancient Greece",
    mapHeroDesktop:
      "Dots mark places on the map. Card previews sit on the sides — tap a dot or card to open.",
    mapHeroHint: "Scroll the map. Drag card previews — lines follow. Tap to open.",
    footer: "Sandra's Notes · GR deck · \"Seven Gears of Hellas\"",
    act: "Act",
    gearWord: "gear",
    tryTask: "Try the task!",
    tryTaskBelow: "use the button below",
    tryAgain: "Play again",
    yes: "YES ✓",
    no: "✗ NO",
    ynHint: "← no · yes →",
    gearFound: "⚙ Gear found:",
    great: "Great!",
    gotIt: "Got it",
    flipToFace: "tap — front side",
    flipHotspot: "hover a number to learn more · tap the card to flip",
    flipCard: "tap — flip the card",
    hsOverlayBack: "tap outside the hint or on the backdrop — back to the task",
    nextChapter: "Next chapter →",
    toQuest: "To quest →",
    nextCard: "Next card →",
    loading: "Loading...",
    taskLabel: "Task",
    resultLabel: "Result",
    correct: "Correct!",
    back: "← Back",
    hsClose: "move away to close · tap to dismiss",
    hsCloseHint: "tap — close hint",
    chapterLocked: "Chapter locked",
    chapterLockedHint: "Complete the previous quest chapter first.",
    toChapterList: "To chapter list",
    chapterDone: "Chapter complete!",
    pointMarked: "Point {n} marked on the tablet.",
    nextChapterLink: "Next chapter →",
    toQuestLink: "To quest",
    openCard: "📖 Open card",
    chapterNotFound: "Chapter not found.",
    questTitle: "Quest",
    retry: "Try again",
    yesBtn: "Yes",
    noBtn: "No",
    rebuild: "Build again",
    orderHint: "Tap items one by one — your order appears above (1, 2, 3…).",
    orderChosen: "Your order",
    quizSourceHint: "Answers are in the dialogue and Sandra's notes above — or on the back of the card.",
    quizFailSource: "Hint: reread the chat and Sandra's notes, or open the card 📖.",
    quizRecapTitle: "Dialogue and Sandra's notes",
    runMechanism: "Run the mechanism",
    minigame: "Minigame",
    unknownGame: "Unknown game type",
    mgLevelEasy: "Level 1 — Easy",
    mgLevelHard: "Level 2 — Hard",
    mgOfferHard: "Beat the easy level! Try the hard one?",
    mgPlayHard: "Play hard",
    mgSkipHard: "Skip",
    mgContinue: "Continue",
    mgProgress: "Caught: {n} / {goal}",
    mgRhythm: "Hits: {n} / {goal}",
    mgDrag: "Placed: {n} / {goal}",
    mgAim: "Hits: {n} / {goal}",
    mgEclipse: "Moon {moon} · Date {date}",
    mgEclipseMoon: "Moon ring",
    mgEclipseDate: "Date arrow",
    mgEclipseSun: "Sun",
    mgEclipseDateHidden: "???",
    mgEclipseDateShow: "Eclipse!",
    mgTap: "Run!",
    mgTimeLeft: "Time: {n} s",
    mgHardTimeNote: "Complete the goal before time runs out.",
    mgWinEasy: "Level complete!",
    mgWinHard: "Hard level complete!",
    mgFail: "Not quite — try again.",
    quizTitle: "Card quiz",
    quizProgress: "Question {n} of {total}",
    quizNext: "Next →",
    quizDone: "Quiz passed! Time for the minigame.",
    notQuite: "Not quite.",
    phraseFill: "Fill in the missing words:",
    tapCardHint: "Tap the numbered spot on the illustration.",
    dlgNext: "Next →",
    dlgToTask: "To the task →",
    dlgToTaskDone: "To the task ✓",
    dlgTapHint: "Tap the scene for the next line",
    dlgTapSkip: "Tap the scene to show the full line",
    gearContinue: "Continue →",
    dlgTranscriptTitle: "Full dialogue",
    sceneLabel: "Location",
    correctPrefix: "Correct! ",
    notQuite: "Not quite. ",
    tryAgainPrefix: "Try again. ",
    yesShort: "YES",
    noShort: "NO",
    langRu: "RU",
    langEn: "EN",
    settings: "Settings",
    settingsLang: "Language",
    settingsTheme: "Theme",
    settingsAudio: "Voiceover",
    audioOn: "On",
    audioOff: "Off",
    themeLight: "Light",
    themeDark: "Dark",
    close: "Close",
    authDeckTitle: "Ancient Greece",
    authLoginSub: "OBRAZOVARIUM · personal account",
    authTabLogin: "Sign in",
    authTabRegister: "Register",
    authLabelName: "Name",
    authLabelPass: "Password",
    authSubmitLogin: "Sign in",
    authSubmitRegister: "Create account",
    authHint: "Card and quest progress is saved separately for each player on this device.",
    authErr_name_short: "Name must be at least 2 characters.",
    authErr_pass_short: "Password must be at least 3 characters.",
    authErr_exists: "This name is already taken.",
    authErr_invalid: "Wrong name or password.",
    authErr_unknown: "Something went wrong. Try again.",
    cabinetPageTitle: "Account · Ancient Greece",
    cabinetTitle: "Personal account",
    cabinetSub: "Your deck progress",
    cabinetGuestName: "Guest",
    cabinetProgressSection: "Progress",
    cabinetReset: "Reset all progress",
    cabinetResetConfirm: "Reset all card and quest progress? This cannot be undone.",
    cabinetToApp: "Back to app",
    cabinetBack: "← To map",
    cabinetStatCards: "cards passed",
    cabinetStatQuest: "quest chapters",
    cabinetStatGears: "gears found",
    cabinetStatStudied: "cards opened",
    headerCabinet: "Account",
    questSuperBanner: "Super mode: all chapters are open",
    wsTitle: "Celestial Workshop",
    wsIntro:
      "The tablet is alive — my astronomer's workshop is open for you. Three readings, just like the ancient Greeks did.",
    wsIntroRoborik: "I'll watch the gears — you turn the sky!",
    wsDuration: "About 3–5 minutes · 3 dial readings",
    wsStart: "Enter the workshop",
    wsTaskProgress: "Reading {n} of {total}",
    wsHint1:
      "First reading: a solar eclipse. Line up the Moon with the Sun and point the arrow at the eclipse mark ◎.",
    wsHint2:
      "Second reading: full moon. The Moon is opposite the Sun — turn it to the bottom. The arrow goes to the 🌕 mark.",
    wsHint3:
      "Third reading: the Olympic cycle. Set the Moon to the side mark and the arrow to the temple 🏛 — a four-year turn of the dial.",
    wsPraise1: "Exactly! The eclipse date matches the mechanism.",
    wsPraise2: "Beautiful — a full moon on the bronze dial.",
    wsPraise3: "The Olympiad cycle! Greeks counted time in four-year steps.",
    wsReadout1: "Apr 6, 648 BCE",
    wsReadout2: "Full moon",
    wsReadout3: "Olympiad · year IV",
    wsCheck: "Read the dial",
    wsFail: "Not yet — check the Moon and the arrow.",
    wsMarkLabel: "mark",
    wsSandra: "Sandra",
    wsRoborik: "Roborik",
    wsDoneTitle: "Hellas studied!",
    wsDoneSandra: "You read the sky like an ancient astronomer. Mathematics, not magic.",
    wsDoneRoborik: "The workshop is yours forever — come back anytime!",
    wsDoneNote: "Bonus complete. The investigation and the workshop are finished.",
    wsReplay: "Play again",
    wsLockedTitle: "Workshop locked",
    wsLockedHint: "Complete chapter 25 and collect all 7 gears first.",
    wsBonusTeaser:
      "Sandra: «The mechanism still hums — want to try the celestial workshop? Three sky readings, like a real astronomer.»",
    wsBonusBtn: "Celestial Workshop →",
    wsBonusDone: "Workshop complete ✓",
  };

  var UI_RU = {
    deckTitle: "Древняя Греция",
    deckSub: "ОБРАЗОВАРИУМ · ГРЕЦИЯ",
    tabMap: "Карта",
    tabGallery: "Галерея",
    tabQuest: "Квест",
    passed: "пройдено",
    gears: "шестерён",
    chapters: "глав",
    galleryIntro:
      "Иконостас колоды — все 25 карточек. Нажми на карточку: увеличение и переворот. Зелёная рамка — задание пройдено, золотая — изучена.",
    questIntro:
      "Сюжет с Сандрой и Робобориком. В каждой главе: диалог, квиз по карточке, затем мини-игра. Карточку можно открыть как подсказку — задание в «Пройти» отдельное.",
    modalHint: "нажми на карточку — переверни",
    modalPlay: "Пройти задание →",
    modalPrev: "Предыдущая карточка",
    modalNext: "Следующая карточка",
    backToMap: "← На карту",
    mapFloatHint: "← листай карту · перетаскивай карточки · нажми — открыть",
    btnGallery: "Посмотреть все карточки",
    btnQuest: "Начать приключение",
    mapTitle: "Карта Древней Греции",
    mapHeroDesktop:
      "На карте — точки мест. Превью карточек по краям экрана. Нажми точку или карточку.",
    mapHeroHint: "Листай карту. Перетаскивай превью — линии двигаются. Нажми — открыть.",
    footer: "Записки Сандры · учебная колода · «Семь шестерён Эллады»",
    act: "Акт",
    gearWord: "шестерня",
    tryTask: "Попробуй задание!",
    tryTaskBelow: "внизу кнопка «Попробуй задание!»",
    tryAgain: "Сыграть снова",
    yes: "ДА ✓",
    no: "✗ НЕТ",
    ynHint: "← нет · да →",
    gearFound: "⚙ Найдена шестерня:",
    great: "Отлично!",
    gotIt: "Понятно",
    flipToFace: "нажми — лицевая сторона",
    flipHotspot: "наведи на цифру — узнай подробнее · нажми на карточку — переверни",
    flipCard: "нажми — переверни карточку",
    hsOverlayBack: "нажми вне подсказки или на затемнение — вернуться к заданию",
    nextChapter: "Следующая глава →",
    toQuest: "К квесту →",
    nextCard: "Следующая карта →",
    loading: "Загрузка...",
    taskLabel: "Задание",
    resultLabel: "Результат",
    correct: "Правильно!",
    back: "← Назад",
    hsClose: "отведи указатель — закроется · нажми — закрыть",
    hsCloseHint: "нажми — закрыть подсказку",
    chapterLocked: "Глава закрыта",
    chapterLockedHint: "Сначала пройди предыдущую главу квеста.",
    toChapterList: "К списку глав",
    chapterDone: "Глава пройдена!",
    pointMarked: "Точка {n} отмечена на табличке.",
    nextChapterLink: "Следующая глава →",
    toQuestLink: "К квесту",
    openCard: "📖 Открыть карточку",
    chapterNotFound: "Глава не найдена.",
    questTitle: "Квест",
    retry: "Попробовать снова",
    yesBtn: "Да",
    noBtn: "Нет",
    rebuild: "Собрать заново",
    orderHint: "Нажимай пункты по одному — сверху появится твой порядок (1, 2, 3…).",
    orderChosen: "Твой порядок",
    quizSourceHint: "Ответы есть в диалоге и записях Сандры выше — или на обороте карточки 📖.",
    quizFailSource: "Подсказка: перечитай диалог и записи Сандры выше или открой карточку.",
    quizRecapTitle: "Диалог и записи Сандры",
    runMechanism: "Запустить механизм",
    minigame: "Мини-игра",
    unknownGame: "Неизвестный тип игры",
    mgLevelEasy: "Уровень 1 — простой",
    mgLevelHard: "Уровень 2 — сложный",
    mgOfferHard: "Простой уровень пройден! Попробовать сложный?",
    mgPlayHard: "Играть",
    mgSkipHard: "Пропустить",
    mgContinue: "Дальше",
    mgProgress: "Поймано: {n} / {goal}",
    mgRhythm: "Попаданий: {n} / {goal}",
    mgDrag: "Собрано: {n} / {goal}",
    mgAim: "Попаданий: {n} / {goal}",
    mgEclipse: "Луна {moon} · Дата {date}",
    mgEclipseMoon: "кольцо Луны",
    mgEclipseDate: "стрелка даты",
    mgEclipseSun: "Солнце",
    mgEclipseDateHidden: "···",
    mgEclipseDateShow: "Затмение!",
    mgTap: "Бежать!",
    mgTimeLeft: "Время: {n} с",
    mgHardTimeNote: "Нужно успеть до конца отсчёта.",
    mgWinEasy: "Уровень пройден!",
    mgWinHard: "Сложный уровень пройден!",
    mgFail: "Не получилось — попробуй ещё раз.",
    quizTitle: "Квиз по карточке",
    quizProgress: "Вопрос {n} из {total}",
    quizNext: "Далее →",
    quizDone: "Квиз пройден! Впереди мини-игра.",
    notQuite: "Не совсем так.",
    phraseFill: "Вставь пропущенные слова:",
    tapCardHint: "Нажми на нужный номер на иллюстрации карточки.",
    dlgNext: "Далее →",
    dlgToTask: "К заданию →",
    dlgToTaskDone: "К заданию ✓",
    dlgTapHint: "Нажми на сцену — следующая реплика",
    dlgTapSkip: "Нажми на сцену — показать всю реплику",
    gearContinue: "Продолжить →",
    dlgTranscriptTitle: "Полный диалог",
    sceneLabel: "Место",
    correctPrefix: "Верно! ",
    notQuite: "Не совсем. ",
    tryAgainPrefix: "Попробуй ещё раз. ",
    yesShort: "ДА",
    noShort: "НЕТ",
    langRu: "RU",
    langEn: "EN",
    settings: "Настройки",
    settingsLang: "Язык",
    settingsTheme: "Тема",
    settingsAudio: "Озвучка",
    audioOn: "Вкл",
    audioOff: "Выкл",
    themeLight: "Светлая",
    themeDark: "Тёмная",
    close: "Закрыть",
    authDeckTitle: "Древняя Греция",
    authLoginSub: "ОБРАЗОВАРИУМ · личный кабинет",
    authTabLogin: "Вход",
    authTabRegister: "Регистрация",
    authLabelName: "Имя",
    authLabelPass: "Пароль",
    authSubmitLogin: "Войти",
    authSubmitRegister: "Создать аккаунт",
    authHint: "Прогресс карточек и квеста сохраняется отдельно для каждого игрока на этом устройстве.",
    authErr_name_short: "Имя — минимум 2 символа.",
    authErr_pass_short: "Пароль — минимум 3 символа.",
    authErr_exists: "Такое имя уже занято.",
    authErr_invalid: "Неверное имя или пароль.",
    authErr_unknown: "Ошибка. Попробуйте ещё раз.",
    cabinetPageTitle: "Личный кабинет · Древняя Греция",
    cabinetTitle: "Личный кабинет",
    cabinetSub: "Ваш прогресс в колоде",
    cabinetGuestName: "Гость",
    cabinetProgressSection: "Прогресс",
    cabinetReset: "Сбросить все прохождения",
    cabinetResetConfirm: "Сбросить весь прогресс карточек и квеста? Отменить будет нельзя.",
    cabinetToApp: "Вернуться в приложение",
    cabinetBack: "← На карту",
    cabinetStatCards: "карточек пройдено",
    cabinetStatQuest: "глав квеста",
    cabinetStatGears: "шестерён",
    cabinetStatStudied: "карточек открыто",
    headerCabinet: "Кабинет",
    questSuperBanner: "Супер-режим: все главы открыты",
    wsTitle: "Небесная мастерская",
    wsIntro:
      "Табличка жива — моя мастерская астронома открыта для тебя. Три считывания диска, как это делали древние греки.",
    wsIntroRoborik: "Я прослежу за шестернями — а ты крути небо!",
    wsDuration: "Около 3–5 минут · 3 считывания диска",
    wsStart: "Войти в мастерскую",
    wsTaskProgress: "Считывание {n} из {total}",
    wsHint1:
      "Первое считывание: солнечное затмение. Совмести Луну с Солнцем и наведи стрелку на метку затмения ◎.",
    wsHint2:
      "Второе считывание: полнолуние. Луна противоположна Солнцу — поверни её вниз. Стрелка — на метку 🌕.",
    wsHint3:
      "Третье считывание: олимпийский цикл. Поставь Луну на боковую метку, стрелку — на храм 🏛: четырёхлетний виток диска.",
    wsPraise1: "Точно! Дата затмения совпала с механизмом.",
    wsPraise2: "Красиво — полнолуние на бронзовом диске.",
    wsPraise3: "Цикл олимпиад! Греки считали время четырёхлетними шагами.",
    wsReadout1: "6 апр. 648 до н. э.",
    wsReadout2: "Полнолуние",
    wsReadout3: "Олимпиада · 4-й год",
    wsCheck: "Считать диск",
    wsFail: "Пока не совпало — проверь Луну и стрелку.",
    wsMarkLabel: "метка",
    wsSandra: "Сандра",
    wsRoborik: "Робоборик",
    wsDoneTitle: "Эллада изучена!",
    wsDoneSandra: "Ты читаешь небо, как древний астроном. Математика, не магия.",
    wsDoneRoborik: "Мастерская теперь твоя — заходи ещё!",
    wsDoneNote: "Бонус пройден. Расследование и мастерская завершены.",
    wsReplay: "Сыграть снова",
    wsLockedTitle: "Мастерская закрыта",
    wsLockedHint: "Сначала пройди главу 25 и собери все 7 шестерён.",
    wsBonusTeaser:
      "Сандра: «Механизм ещё гудит — хочешь попробовать небесную мастерскую? Три считывания неба, как у настоящего астронома».",
    wsBonusBtn: "Небесная мастерская →",
    wsBonusDone: "Мастерская пройдена ✓",
  };

  window.GR_Locale = {
    lang: lang,
    theme: theme,
    ASSET_VERSION: "20260710-modal-fix2",
    funLabel: lang === "en" ? "Fun fact:" : "Интересно:",
    factFallback: lang === "en" ? "Fact" : "Факт",
    speakers:
      lang === "en"
        ? { sandra: "Sandra", roborik: "Roboborik" }
        : { sandra: "Сандра", roborik: "Робоборик" },
    ui: lang === "en" ? UI_EN : UI_RU,

    get: function () {
      return this.lang;
    },

    isEn: function () {
      return this.lang === "en";
    },

    t: function (key, vars) {
      var text = (this.ui && this.ui[key]) || key;
      if (vars) {
        Object.keys(vars).forEach(function (k) {
          text = text.replace("{" + k + "}", vars[k]);
        });
      }
      return text;
    },

    dataSuffix: function () {
      return this.lang === "en" ? ".en" : "";
    },

    webBase: function () {
      return this.lang === "en" ? "assets/web/en" : "assets/web";
    },

    printBase: function () {
      return this.lang === "en" ? "assets/print/en" : "assets/print";
    },

    spaceAsset: function () {
      return this.lang === "en" ? "assets/space/en/main.webp" : "assets/space/main.webp";
    },

    cardAsset: function (code, side) {
      var suffix = side === "back" ? "_back" : "";
      return this.webBase() + "/" + code + suffix + ".webp?v=" + this.ASSET_VERSION;
    },

    cardAssetRu: function (code, side) {
      var suffix = side === "back" ? "_back" : "";
      return "assets/web/" + code + suffix + ".webp?v=" + this.ASSET_VERSION;
    },

    setCardImg: function (img, code, side) {
      if (!img || !code) return;
      var primary = this.cardAsset(code, side);
      var fallback = this.lang === "en" ? this.cardAssetRu(code, side) : null;
      img.onerror = function () {
        if (fallback && img.getAttribute("data-locale-fallback") !== "1") {
          img.setAttribute("data-locale-fallback", "1");
          img.src = fallback;
          return;
        }
        img.onerror = null;
      };
      img.removeAttribute("data-locale-fallback");
      img.src = primary;
    },

    cardsBack: function () {
      return window.GR_CARDS_BACK || [];
    },

    cardsList: function () {
      return window.GR_CARDS || [];
    },

    withLang: function (url) {
      if (this.lang !== "en") return url;
      return url + (url.indexOf("?") >= 0 ? "&" : "?") + "lang=en";
    },

    set: function (next) {
      if (next !== "ru" && next !== "en") return;
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch (e) {}
      var u = new URL(location.href);
      if (next === "ru") u.searchParams.delete("lang");
      else u.searchParams.set("lang", next);
      location.href = u.toString();
    },

    setTheme: function (nextTheme) {
      if (nextTheme !== "light" && nextTheme !== "dark") return;
      try {
        localStorage.setItem(THEME_KEY, nextTheme);
      } catch (e) {}
      this.theme = nextTheme;
      applyTheme(nextTheme);
    },
  };
})();
