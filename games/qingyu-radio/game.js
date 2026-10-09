(function () {
  "use strict";

  var STORY = window.STORY;
  var SIM = window.WeatherSimulator;
  var Town = window.TownRenderer;
  var Poster = window.SharePoster;
  if (!STORY || !SIM || !Town || !Poster) return;

  var AUDIO_ROOT = "assets/audio/";
  var AUDIO_MANIFEST = {
    music: {
      title: "bgm-title.mp3",
      spring: "bgm-spring.mp3",
      summer: "bgm-summer.mp3",
      winter: "bgm-winter.mp3",
      letter707: "bgm-letter707.mp3",
      ending: "bgm-ending.mp3"
    },
    letters: {
      "1-1": "letter-1-1.mp3", "1-2": "letter-1-2.mp3", "1-3": "letter-1-3.mp3",
      "2-1": "letter-2-1.mp3", "2-2": "letter-2-2.mp3", "2-3": "letter-2-3.mp3",
      "3-1": "letter-3-1.mp3", "3-2": "letter-3-2.mp3", "3-3": "letter-3-3.mp3"
    },
    intros: { 0: "intro-ch1.mp3", 1: "intro-ch2.mp3", 2: "intro-ch3.mp3" },
    success: {
      "1-1": "success-1-1.mp3", "1-2": "success-1-2.mp3", "1-3": "success-1-3.mp3",
      "2-1": "success-2-1.mp3", "2-2": "success-2-2.mp3", "2-3": "success-2-3.mp3",
      "3-1": "success-3-1.mp3", "3-2": "success-3-2.mp3"
    },
    booth: { note: "booth-note.mp3", notebook: "booth-notebook.mp3" },
    outros: { 0: "outro-ch1.mp3", 1: "outro-ch2.mp3" },
    slots: {
      "明天": "slot-mingtian.mp3", "上午": "slot-shangwu.mp3", "中午": "slot-zhongwu.mp3",
      "下午": "slot-xiawu.mp3", "傍晚": "slot-bangwan.mp3", "夜里": "slot-yeli.mp3",
      "天黑后": "slot-tianheihou.mp3", "开场时": "slot-kaichangshi.mp3", "白天": "slot-baitian.mp3",
      "深夜": "slot-shenye.mp3", "凌晨": "slot-lingchen.mp3", "清晨": "slot-qingchen.mp3"
    },
    weather: {
      sun: "wx-sun.mp3", rain: "wx-rain.mp3", wind: "wx-wind.mp3",
      snow: "wx-snow.mp3", thunder: "wx-thunder.mp3", fog: "wx-fog.mp3"
    },
    ending: {
      0: "end-narr-0.mp3",
      1: "end-narr-1.mp3",
      2: "end-narr-2.mp3",
      3: "end-narr-3.mp3",
      4: "end-narr-4.mp3",
      5: "end-narr-5.mp3",
      7: "end-narr-7.mp3",
      8: "end-narr-8.mp3",
      10: "end-host-1.mp3",
      12: "end-narr-12.mp3",
      13: "end-mom-1.mp3",
      14: "end-mom-2.mp3",
      15: "end-mom-3.mp3",
      17: "end-narr-17.mp3",
      20: "end-host-2.mp3"
    },
    hostOpen: "host-open.mp3",
    hostClose: "host-close.mp3",
    jingle: null
  };
  var OPTIONAL_ENDING_VOICE = { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 7: true, 8: true, 12: true, 17: true };

  var LEVELS = [];
  var LEVEL_CHAPTER = {};
  STORY.chapters.forEach(function (chapter, chapterIndex) {
    chapter.nights.forEach(function (night) {
      LEVEL_CHAPTER[night.id] = chapterIndex;
      LEVELS.push(night);
    });
  });

  function firstScriptMatch(text, pattern) {
    var match = String(text || "").match(pattern);
    return match ? match[1] : "";
  }

  var iceShopNight = LEVELS.filter(function (night) { return night.id === "2-1"; })[0] || {};
  var iceShopStep = iceShopNight.step || {};
  var iceShopVisualLabels = {
    barrelEmpty: firstScriptMatch(iceShopNight.letter && iceShopNight.letter.text, /现在是([^，。！？\s])的/),
    barrelWater: firstScriptMatch(iceShopStep.rain, /雨([^，。！？\s])落进/),
    barrelIce: firstScriptMatch(iceShopStep.thunder_hail, /夹着([^，。！？\s])雹/),
    shopClosed: firstScriptMatch(iceShopStep.sun_morning, /还(没开门)/)
  };

  var SAVE_KEY = "sunrain-radio-v1";
  var reducedMotion = Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var qaFastValue = window.__QA_FAST__;
  var qaFast = Boolean(qaFastValue);
  var saveData = loadSave();
  var currentIndex = 0;
  var currentNight = null;
  var currentChapter = null;
  var schedule = [];
  var targetSlot = 0;
  var hintCount = 0;
  var failureCount = 0;
  var hintLockedShown = false;
  var guideStep = "";
  var endingPhase = "idle";
  var endingLineIndex = -1;
  var endingLineHoldMs = 0;
  var chapterIntroToken = 0;
  var chapterIntroTimer = 0;
  var chapterIntroActive = false;
  var chapterIntroSkipped = false;
  var chapterIntroDuration = 0;
  var chapterIntroAudioFile = "";
  var typewriters = new WeakMap();
  var narrations = new WeakMap();
  var feedbackTypeToken = 0;
  var modalTypeToken = 0;
  var modalCeremonial = false;
  var playing = false;
  var broadcasting = false;
  var advancing = false;
  var playToken = 0;
  var focusTimer = 0;
  var viewState = null;
  var modalCallback = null;
  var modalVoiceFile = "";
  var previousFocus = null;
  var shareReturnScreen = null;
  var shareWeather = [];
  var shareResult = null;
  var shareBusy = false;
  var letterReadComplete = false;
  var cardTooltipOwner = null;
  var cardTooltipMode = "";
  var finalePhotoMatches = {};
  var finalePhotoViewerIndex = 0;
  var finalePhotoViewerPreviousFocus = null;

  var elements = {
    title: document.querySelector("title"),
    app: document.getElementById("app"),
    townStage: document.getElementById("town-stage"),
    townSvg: document.getElementById("town"),
    townCanvas: document.getElementById("town-fx"),
    brand: document.getElementById("brand"),
    brandTitle: document.getElementById("brand-title"),
    brandFrequency: document.getElementById("brand-frequency"),
    brandStatus: document.getElementById("brand-status"),
    soundToggle: document.getElementById("sound-toggle"),
    audioSettings: document.getElementById("audio-settings"),
    musicToggle: document.getElementById("music-toggle"),
    musicLabel: document.getElementById("music-label"),
    musicState: document.getElementById("music-state"),
    musicVolume: document.getElementById("music-volume"),
    voiceToggle: document.getElementById("voice-toggle"),
    voiceLabel: document.getElementById("voice-label"),
    voiceState: document.getElementById("voice-state"),
    voiceVolume: document.getElementById("voice-volume"),
    titleScreen: document.getElementById("title-screen"),
    titleFrequency: document.getElementById("title-frequency"),
    gameTitle: document.getElementById("game-title"),
    gameSubtitle: document.getElementById("game-subtitle"),
    titleLines: document.getElementById("title-lines"),
    titleActions: document.getElementById("title-actions"),
    chapterScreen: document.getElementById("chapter-screen"),
    chapterTitle: document.getElementById("chapter-title"),
    chapterSubtitle: document.getElementById("chapter-subtitle"),
    chapterLines: document.getElementById("chapter-lines"),
    chapterContinue: document.getElementById("chapter-continue"),
    gameScreen: document.getElementById("game-screen"),
    chapterChip: document.getElementById("chapter-chip"),
    nightTitle: document.getElementById("night-title"),
    progressDots: document.getElementById("progress-dots"),
    sceneDescription: document.getElementById("scene-description"),
    letterCard: document.getElementById("letter-card"),
    letterToggle: document.getElementById("letter-toggle"),
    letterFrom: document.getElementById("letter-from"),
    letterText: document.getElementById("letter-text"),
    finaleClues: document.getElementById("finale-clues"),
    finaleGoal: document.getElementById("finale-goal"),
    finalePhotos: document.getElementById("finale-photos"),
    finalePhotoViewer: document.getElementById("finale-photo-viewer"),
    finalePhotoViewerBackdrop: document.getElementById("finale-photo-viewer-backdrop"),
    finalePhotoViewerGoal: document.getElementById("finale-photo-viewer-goal"),
    finalePhotoViewerCard: document.getElementById("finale-photo-viewer-card"),
    finalePhotoViewerPrev: document.getElementById("finale-photo-viewer-prev"),
    finalePhotoViewerNext: document.getElementById("finale-photo-viewer-next"),
    finalePhotoViewerClose: document.getElementById("finale-photo-viewer-close"),
    drawerButton: document.getElementById("drawer-button"),
    drawerLabel: document.getElementById("drawer-label"),
    clueDrawer: document.getElementById("clue-drawer"),
    boothItems: document.getElementById("booth-items"),
    radioButton: document.getElementById("radio-button"),
    radioDisplay: document.getElementById("radio-display"),
    weatherCards: document.getElementById("weather-cards"),
    weatherCardTooltip: document.getElementById("weather-card-tooltip"),
    timeline: document.getElementById("timeline"),
    hintButton: document.getElementById("hint-button"),
    hintLabel: document.getElementById("hint-label"),
    clearButton: document.getElementById("clear-button"),
    clearLabel: document.getElementById("clear-label"),
    broadcastButton: document.getElementById("broadcast-button"),
    broadcastLabel: document.getElementById("broadcast-label"),
    broadcastStatus: document.getElementById("broadcast-status"),
    hintPanel: document.getElementById("hint-panel"),
    feedbackPanel: document.getElementById("feedback-panel"),
    feedbackLines: document.getElementById("feedback-lines"),
    feedbackAction: document.getElementById("feedback-action"),
    guideTip: document.getElementById("guide-tip"),
    endingScreen: document.getElementById("ending-screen"),
    endingLines: document.getElementById("ending-lines"),
    credits: document.getElementById("credits"),
    endingShare: document.getElementById("ending-share"),
    endingRestart: document.getElementById("ending-restart"),
    shareScreen: document.getElementById("share-screen"),
    shareClose: document.getElementById("share-close"),
    shareTitle: document.getElementById("share-title"),
    shareName: document.getElementById("share-name"),
    shareChoose: document.getElementById("share-choose"),
    shareCards: document.getElementById("share-cards"),
    shareSequence: document.getElementById("share-sequence"),
    shareGenerate: document.getElementById("share-generate"),
    shareStatus: document.getElementById("share-status"),
    posterWrap: document.getElementById("poster-wrap"),
    posterPreview: document.getElementById("poster-preview"),
    posterSave: document.getElementById("poster-save"),
    posterAgain: document.getElementById("poster-again"),
    modal: document.getElementById("modal"),
    modalBackdrop: document.getElementById("modal-backdrop"),
    modalPaper: document.querySelector(".modal-paper"),
    modalClose: document.getElementById("modal-close"),
    modalVisual: document.getElementById("modal-visual"),
    modalTitle: document.getElementById("modal-title"),
    modalText: document.getElementById("modal-text"),
    modalContinue: document.getElementById("modal-continue")
  };

  var town = new Town({
    root: elements.townStage,
    svg: elements.townSvg,
    canvas: elements.townCanvas,
    completed: saveData.completed,
    labels: {
      townName: STORY.ui.town_name,
      stationName: STORY.ui.station_name,
      iceShop: STORY.ui.ice_shop,
      open: STORY.ui.open,
      barrelEmpty: iceShopVisualLabels.barrelEmpty,
      barrelWater: iceShopVisualLabels.barrelWater,
      barrelIce: iceShopVisualLabels.barrelIce,
      shopClosed: iceShopVisualLabels.shopClosed,
      room707: STORY.ui.room_707,
      radioStation: STORY.meta.title,
      radioFrequency: extractFrequency(),
      bedsideCard: extractEndingBedsideCard(),
      badgeName: STORY.ending.lines.filter(function (line) { return line.indexOf("主持人：") === 0; })[0] || ""
    }
  });
  var audio = new AudioEngine({
    musicEnabled: saveData.musicEnabled,
    voiceEnabled: saveData.voiceEnabled,
    musicVolume: saveData.musicVolume,
    voiceVolume: saveData.voiceVolume
  });
  document.addEventListener("pointerdown", function () { audio.unlock(); }, { capture: true, once: true });
  document.addEventListener("keydown", function () { audio.unlock(); }, { capture: true, once: true });
  var screens = [elements.titleScreen, elements.chapterScreen, elements.gameScreen, elements.endingScreen, elements.shareScreen];

  function loadSave() {
    try {
      var raw = window.localStorage.getItem(SAVE_KEY);
      var parsed = raw ? JSON.parse(raw) : {};
      var legacyEnabled = !Boolean(parsed.muted);
      return {
        completed: Math.max(0, Math.min(LEVELS.length, Math.floor(Number(parsed.completed) || 0))),
        musicEnabled: typeof parsed.musicEnabled === "boolean" ? parsed.musicEnabled : legacyEnabled,
        voiceEnabled: typeof parsed.voiceEnabled === "boolean" ? parsed.voiceEnabled : legacyEnabled,
        musicVolume: normalizeAudioVolume(parsed.musicVolume, .5),
        voiceVolume: normalizeAudioVolume(parsed.voiceVolume, 1),
        pendingOutro: parsed.pendingOutro === 0 || parsed.pendingOutro === 1 ? parsed.pendingOutro : null
      };
    } catch (_) {
      return { completed: 0, musicEnabled: true, voiceEnabled: true, musicVolume: .5, voiceVolume: 1, pendingOutro: null };
    }
  }

  function normalizeAudioVolume(value, fallback) {
    var number = Number(value);
    if (!isFinite(number)) number = Number(fallback);
    if (number > 1) number /= 100;
    return Math.max(0, Math.min(1, number));
  }

  function persistSave() {
    try { window.localStorage.setItem(SAVE_KEY, JSON.stringify(saveData)); }
    catch (_) { return; }
  }

  function clearSave() {
    var musicEnabled = saveData.musicEnabled;
    var voiceEnabled = saveData.voiceEnabled;
    var musicVolume = saveData.musicVolume;
    var voiceVolume = saveData.voiceVolume;
    saveData = {
      completed: 0,
      musicEnabled: musicEnabled,
      voiceEnabled: voiceEnabled,
      musicVolume: musicVolume,
      voiceVolume: voiceVolume,
      pendingOutro: null
    };
    try { window.localStorage.removeItem(SAVE_KEY); }
    catch (_) { /* Storage may be unavailable on file://. */ }
    persistSave();
    town.allLit = false;
    town.setCompleted(0);
  }

  function extractFrequency() {
    var radioItem = STORY.chapters[0].booth.filter(function (item) { return item.id === "radio"; })[0];
    var match = radioItem && radioItem.text.match(/FM\s*[0-9.]+/);
    return match ? match[0] : "";
  }

  function extractEndingBedsideCard() {
    var line = STORY.ending.lines[5] || "";
    var separator = line.indexOf("：");
    var label = separator >= 0 ? line.slice(separator + 1) : "";
    return label.replace(/[。．.]$/, "").replace(/\u3000+/g, " ").trim() || STORY.ui.room_707;
  }

  function makeButton(text, className, handler) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = text;
    button.addEventListener("click", handler);
    return button;
  }

  function paragraph(text) {
    var item = document.createElement("p");
    item.textContent = text;
    return item;
  }

  function stopTypewriter(element, reveal) {
    var state = typewriters.get(element);
    if (!state) return false;
    if (state.timer) window.clearTimeout(state.timer);
    if (reveal) element.textContent = state.text;
    state.finish(Boolean(reveal));
    return true;
  }

  function typeText(element, text, interval, onComplete) {
    stopTypewriter(element, false);
    var characters = Array.from(String(text || ""));
    var delayPerCharacter = qaFast ? 1 : Math.max(1, Number(interval) || 35);
    var index = 0;
    var settled = false;
    var resolvePromise;
    element.textContent = "";
    element.classList.add("is-typing");
    var state = {
      text: characters.join(""),
      timer: 0,
      promise: new Promise(function (resolve) { resolvePromise = resolve; }),
      finish: function (completed) {
        if (settled) return;
        settled = true;
        element.classList.remove("is-typing");
        typewriters.delete(element);
        resolvePromise(completed);
        if (completed && typeof onComplete === "function") onComplete();
      }
    };
    typewriters.set(element, state);
    if (!characters.length) {
      state.finish(true);
      return state;
    }
    function tick() {
      if (settled) return;
      index += 1;
      element.textContent = characters.slice(0, index).join("");
      if (index >= characters.length) { state.finish(true); return; }
      state.timer = window.setTimeout(tick, delayPerCharacter);
    }
    state.timer = window.setTimeout(tick, delayPerCharacter);
    return state;
  }

  function skipTypewriter(element) { return stopTypewriter(element, true); }

  function narrationInterval(text, duration, fallback) {
    var count = Math.max(1, Array.from(String(text || "")).length);
    var seconds = Number(duration);
    if (!isFinite(seconds) || seconds <= 0) return fallback;
    return Math.max(18, seconds * 940 / count);
  }

  function abortNarration(element, reveal, fadeSeconds) {
    var state = narrations.get(element);
    if (!state) {
      stopTypewriter(element, Boolean(reveal));
      return false;
    }
    state.cancelled = true;
    if (state.timer) window.clearTimeout(state.timer);
    narrations.delete(element);
    stopTypewriter(element, false);
    if (reveal) element.textContent = state.text;
    audio.stopVoice(fadeSeconds || 0);
    return true;
  }

  function skipNarration(element, fadeSeconds) {
    var state = narrations.get(element);
    if (!state) {
      audio.stopVoice(fadeSeconds || 0);
      return skipTypewriter(element);
    }
    if (state.timer) window.clearTimeout(state.timer);
    audio.stopVoice(fadeSeconds || 0);
    if (state.started) return skipTypewriter(element);
    element.textContent = state.text;
    state.complete();
    return true;
  }

  function narrateText(element, text, file, fallbackInterval, onComplete) {
    abortNarration(element, false, 0);
    var state = {
      text: String(text || ""),
      started: false,
      completed: false,
      cancelled: false,
      timer: 0,
      complete: null
    };
    narrations.set(element, state);
    state.complete = function () {
      if (state.completed || state.cancelled) return;
      state.completed = true;
      if (state.timer) window.clearTimeout(state.timer);
      if (narrations.get(element) === state) narrations.delete(element);
      if (typeof onComplete === "function") onComplete();
    };
    function startWriter(interval) {
      if (state.started || state.completed || state.cancelled || narrations.get(element) !== state) return;
      state.started = true;
      typeText(element, state.text, interval, state.complete);
    }
    if (!file || !audio.voiceEnabled) {
      startWriter(fallbackInterval);
      return state;
    }
    if (qaFast) {
      audio.playVoiceFile(file, { id: file });
      startWriter(fallbackInterval);
      return state;
    }
    state.timer = window.setTimeout(function () {
      if (state.started || state.completed || state.cancelled || narrations.get(element) !== state) return;
      audio.stopVoice(0);
      startWriter(fallbackInterval);
    }, 1800);
    audio.playVoiceFile(file, {
      id: file,
      onStart: function (duration) {
        if (state.timer) window.clearTimeout(state.timer);
        startWriter(narrationInterval(state.text, duration, fallbackInterval));
      }
    }).then(function () {
      if (state.timer) window.clearTimeout(state.timer);
      if (!state.started && !state.completed && !state.cancelled && narrations.get(element) === state) startWriter(fallbackInterval);
    });
    return state;
  }

  function playOptionalVoice(file, options) {
    var settings = Object.assign({}, options || {}, { silentFailure: true });
    return audio.playVoiceFile(file, settings);
  }

  function clearChapterIntroTimer() {
    if (!chapterIntroTimer) return;
    window.clearTimeout(chapterIntroTimer);
    chapterIntroTimer = 0;
  }

  function showAllChapterIntroLines() {
    Array.prototype.forEach.call(elements.chapterLines.children, function (line) {
      line.style.animation = "none";
      line.style.opacity = "1";
      line.style.transform = "none";
    });
  }

  function animateChapterIntroLines(duration) {
    if (!chapterIntroActive || chapterIntroSkipped || elements.chapterScreen.hidden) return;
    var lines = Array.prototype.slice.call(elements.chapterLines.children);
    var seconds = Math.max(1.8, Number(duration) || 2.4);
    chapterIntroDuration = seconds;
    if (qaFast || reducedMotion) {
      showAllChapterIntroLines();
      return;
    }
    var weights = lines.map(function (line) { return Math.max(1, Array.from(line.textContent || "").length); });
    var totalWeight = weights.reduce(function (sum, weight) { return sum + weight; }, 0) || lines.length || 1;
    var elapsedWeight = 0;
    var fade = Math.min(.9, Math.max(.45, seconds * .075));
    lines.forEach(function (line, index) {
      var lineDelay = Math.max(0, (seconds - fade) * elapsedWeight / totalWeight);
      line.style.opacity = "0";
      line.style.transform = "translateY(10px)";
      line.style.animation = "none";
      void line.offsetWidth;
      line.style.animation = "chapterLine " + fade.toFixed(3) + "s ease " + lineDelay.toFixed(3) + "s forwards";
      elapsedWeight += weights[index];
    });
  }

  function skipChapterIntroNarration() {
    if (elements.chapterScreen.hidden) return false;
    chapterIntroToken += 1;
    clearChapterIntroTimer();
    chapterIntroActive = false;
    chapterIntroSkipped = true;
    showAllChapterIntroLines();
    audio.stopVoice(.15);
    audio.noteEvent("intro-skip", chapterIntroAudioFile);
    elements.chapterContinue.disabled = false;
    return true;
  }

  function startChapterIntroNarration(chapterIndex) {
    var token = ++chapterIntroToken;
    var file = AUDIO_MANIFEST.intros[chapterIndex];
    var cueId = "intro:ch" + (chapterIndex + 1);
    var fallbackDuration = Math.max(2.4, currentChapter.intro.reduce(function (sum, line) {
      return sum + Array.from(line || "").length;
    }, 0) * .1);
    chapterIntroActive = true;
    chapterIntroSkipped = false;
    chapterIntroDuration = 0;
    chapterIntroAudioFile = file || "";
    clearChapterIntroTimer();
    Array.prototype.forEach.call(elements.chapterLines.children, function (line) {
      line.style.animation = "none";
      line.style.opacity = "0";
      line.style.transform = "translateY(10px)";
    });
    if (qaFast) {
      showAllChapterIntroLines();
      playOptionalVoice(file, { id: cueId });
      return;
    }
    if (!audio.voiceEnabled || !file) {
      animateChapterIntroLines(fallbackDuration);
      return;
    }
    var animationStarted = false;
    function startAnimation(duration) {
      if (token !== chapterIntroToken || chapterIntroSkipped || elements.chapterScreen.hidden) return;
      if (animationStarted) return;
      animationStarted = true;
      clearChapterIntroTimer();
      animateChapterIntroLines(duration || fallbackDuration);
    }
    chapterIntroTimer = window.setTimeout(function () { startAnimation(fallbackDuration); }, 900);
    playOptionalVoice(file, {
      id: cueId,
      onStart: function (duration) { startAnimation(duration); }
    }).then(function (result) {
      if (token !== chapterIntroToken || chapterIntroSkipped || elements.chapterScreen.hidden) return;
      if (!animationStarted) startAnimation(fallbackDuration);
      if (result.ok) showAllChapterIntroLines();
    });
  }

  function setEndingPhase(phase) {
    endingPhase = phase || "idle";
    elements.app.dataset.endingPhase = endingPhase;
    elements.endingScreen.dataset.endingPhase = endingPhase;
  }

  function closeAudioSettings() {
    elements.audioSettings.hidden = true;
    elements.soundToggle.classList.remove("is-open");
    elements.soundToggle.setAttribute("aria-expanded", "false");
  }

  function updateAudioSettings() {
    var musicOn = Boolean(audio.musicEnabled);
    var voiceOn = Boolean(audio.voiceEnabled);
    var musicVolume = Math.round(audio.musicVolume * 100);
    var voiceVolume = Math.round(audio.voiceVolume * 100);
    elements.musicToggle.classList.toggle("is-enabled", musicOn);
    elements.musicToggle.setAttribute("aria-pressed", String(musicOn));
    elements.musicState.textContent = musicOn ? STORY.ui.audio_on : STORY.ui.audio_off;
    elements.musicVolume.value = String(musicVolume);
    elements.musicVolume.style.setProperty("--volume-fill", musicVolume + "%");
    elements.voiceToggle.classList.toggle("is-enabled", voiceOn);
    elements.voiceToggle.setAttribute("aria-pressed", String(voiceOn));
    elements.voiceState.textContent = voiceOn ? STORY.ui.audio_on : STORY.ui.audio_off;
    elements.voiceVolume.value = String(voiceVolume);
    elements.voiceVolume.style.setProperty("--volume-fill", voiceVolume + "%");
    elements.soundToggle.classList.toggle("is-muted", !musicOn && !voiceOn);
  }

  function showScreen(screen) {
    if (screen !== elements.gameScreen) closeFinalePhotoViewer(false);
    closeAudioSettings();
    screens.forEach(function (item) {
      if (item === screen) {
        item.hidden = false;
        window.requestAnimationFrame(function () { item.classList.add("is-active"); });
      } else {
        item.classList.remove("is-active");
        item.hidden = true;
      }
    });
    elements.app.classList.toggle("is-title-view", screen === elements.titleScreen);
    elements.brand.hidden = screen === elements.shareScreen;
    if (screen === elements.titleScreen) town.startDrift();
    else town.stopDrift();
  }

  function initializeTitle() {
    var frequency = extractFrequency();
    setEndingPhase("idle");
    endingLineIndex = -1;
    clearGuide();
    elements.title.textContent = STORY.meta.title;
    elements.brandTitle.textContent = STORY.meta.title;
    elements.brandFrequency.textContent = frequency;
    elements.brandStatus.textContent = STORY.ui.on_air;
    elements.gameTitle.textContent = STORY.meta.title;
    elements.gameSubtitle.textContent = STORY.meta.subtitle;
    elements.titleFrequency.textContent = frequency;
    elements.radioDisplay.textContent = frequency;
    elements.titleLines.replaceChildren();
    STORY.title_screen.lines.forEach(function (line) { elements.titleLines.appendChild(paragraph(line)); });

    elements.drawerLabel.textContent = STORY.ui.clues;
    elements.hintLabel.textContent = STORY.ui.hint;
    elements.clearLabel.textContent = STORY.ui.reorder;
    elements.clearButton.setAttribute("aria-label", STORY.ui.reorder);
    elements.broadcastStatus.textContent = STORY.ui.on_air;
    elements.shareStatus.textContent = STORY.ui.on_air;
    elements.musicLabel.textContent = STORY.ui.music;
    elements.voiceLabel.textContent = STORY.ui.voice;
    elements.musicToggle.setAttribute("aria-label", STORY.ui.music);
    elements.voiceToggle.setAttribute("aria-label", STORY.ui.voice);
    elements.soundToggle.setAttribute("aria-label", STORY.ui.audio_settings);

    elements.titleActions.replaceChildren();
    var hasProgress = saveData.completed > 0 || saveData.pendingOutro !== null;
    if (!hasProgress) {
      elements.titleActions.appendChild(makeButton(STORY.title_screen.start, "text-button", function () {
        audio.resumeWithStatic();
        beginAt(0, true);
      }));
    } else {
      elements.titleActions.appendChild(makeButton(STORY.title_screen.continue, "text-button", continueSavedGame));
      elements.titleActions.appendChild(makeButton(STORY.title_screen.restart, "text-button", function () {
        clearSave();
        audio.resumeWithStatic();
        beginAt(0, true);
      }));
    }
    if (saveData.completed >= LEVELS.length) {
      elements.titleActions.appendChild(makeButton(STORY.share.button, "text-button", function () { openShare(elements.titleScreen); }));
    }

    town.hospital = false;
    town.allLit = saveData.completed >= LEVELS.length;
    town.setCompleted(saveData.completed);
    town.setSeason("spring");
    audio.setMusicCue("title");
    town.setFogPhase(.18);
    town.overview(true);
    updateAudioSettings();
    showScreen(elements.titleScreen);
  }

  function continueSavedGame() {
    audio.resumeWithStatic();
    if (saveData.pendingOutro !== null) {
      var outroChapterIndex = saveData.pendingOutro;
      var nextSavedIndex = saveData.completed;
      var savedOutro = STORY.chapters[outroChapterIndex].outro_letter;
      currentIndex = nextSavedIndex;
      showModal(savedOutro.from, savedOutro.text, function () {
        saveData.pendingOutro = null;
        persistSave();
        beginAt(nextSavedIndex, true);
      }, { outro: true, kind: "outro", audioFile: AUDIO_MANIFEST.outros[outroChapterIndex] });
      return;
    }
    if (saveData.completed >= LEVELS.length) playEnding();
    else beginAt(saveData.completed, true);
  }

  function beginAt(index, showIntro) {
    playToken += 1;
    if (focusTimer) { window.clearTimeout(focusTimer); focusTimer = 0; }
    currentIndex = Math.max(0, Math.min(LEVELS.length - 1, index));
    if (showIntro) showChapterIntro(LEVEL_CHAPTER[LEVELS[currentIndex].id]);
    else loadLevel(currentIndex);
  }

  function isMobileLayout() {
    return Boolean(window.matchMedia && window.matchMedia("(max-width: 820px)").matches);
  }

  function finalePhotoSnow(count, seed, top, bottom, opacity) {
    var markup = "";
    for (var index = 0; index < count; index += 1) {
      var x = 7 + ((index * 37 + seed * 19) % 166);
      var y = top + ((index * 23 + seed * 11) % Math.max(1, bottom - top));
      var radius = 1 + ((index + seed) % 4) * .38;
      markup += '<circle cx="' + x + '" cy="' + y + '" r="' + radius.toFixed(2) + '" fill="#fff" opacity="' + opacity + '"/>';
    }
    return markup;
  }

  function finalePhotoSceneMarkup(image) {
    var snow;
    if (image === "night_snow") {
      snow = finalePhotoSnow(34, 2, 5, 104, .84);
      return '<svg class="finale-photo-scene" data-scene="night_snow" viewBox="0 0 180 112" preserveAspectRatio="none" aria-hidden="true">' +
        '<rect width="180" height="112" fill="#1d2945"/><circle cx="143" cy="21" r="12" fill="#f8e7b7" opacity=".88"/>' +
        '<path d="M0 72L37 43l27 21 31-30 39 34 25-23 21 18v49H0Z" fill="#40536b"/>' +
        '<path d="M0 83q32-13 65 0t68 0t47-1v30H0Z" fill="#dce9ea" opacity=".92"/>' + snow +
        '<path d="M13 8h77v93H13Z" fill="#352b2a"/><path d="M20 15h63v65H20Z" fill="#273652" stroke="#d5c2a2" stroke-width="3"/>' +
        '<path d="M51.5 15v65M20 47.5h63" stroke="#d5c2a2" stroke-width="3"/>' +
        '<path d="M13 83h78v18H13Z" fill="#725039"/><path d="M24 90h46l9 10H17Z" fill="#916b4c"/>' +
        '<ellipse cx="124" cy="94" rx="27" ry="7" fill="#151a25" opacity=".36"/><path d="M114 92h24l-3 8h-18Z" fill="#856047"/>' +
        '<path d="M126 91V65" stroke="#76533c" stroke-width="3"/><path d="M115 67h22l-4-17h-14Z" fill="#f2c879" stroke="#9b7047" stroke-width="2"/>' +
        '<circle cx="126" cy="68" r="29" fill="#ffd887" opacity=".18"/></svg>';
    }
    if (image === "dawn_snow") {
      snow = finalePhotoSnow(18, 5, 4, 68, .72);
      return '<svg class="finale-photo-scene" data-scene="dawn_snow" viewBox="0 0 180 112" preserveAspectRatio="none" aria-hidden="true">' +
        '<rect width="180" height="112" fill="#8c8595"/><path d="M0 0h180v59Q91 42 0 61Z" fill="#c9a5a0"/>' +
        '<circle cx="150" cy="20" r="16" fill="#ffe2ac" opacity=".42"/>' + snow +
        '<path d="M0 65q31-11 58 0t53-1t69 1v47H0Z" fill="#edf3ef"/>' +
        '<path d="M0 75h180v37H0Z" fill="#5e514d"/><path d="M0 72q22-8 43 0t44 0t47 0t46 0v14H0Z" fill="#f9faf6"/>' +
        '<path d="M15 7h71v67H15Z" fill="none" stroke="#efe5d2" stroke-width="5"/><path d="M50.5 8v65M16 40h69" stroke="#efe5d2" stroke-width="3"/>' +
        '<g transform="translate(124 78)"><ellipse cy="28" rx="29" ry="7" fill="#1b2028" opacity=".3"/>' +
        '<circle cy="-22" r="11" fill="#d8b49a"/><path d="M-10-25q10-14 21 0v7H-10Z" fill="#dbe0de"/>' +
        '<path d="M-16-8q16-14 32 0l10 42h-52Z" fill="#6f7e86"/><ellipse cx="-3" cy="4" rx="14" ry="10" transform="rotate(-15 -3 4)" fill="#ead6bd"/>' +
        '<circle cx="-9" cy="0" r="5" fill="#d6ad91"/><path d="M-15 7q12 8 25 1" fill="none" stroke="#d3c3aa" stroke-width="5" stroke-linecap="round"/></g></svg>';
    }
    snow = finalePhotoSnow(12, 8, 31, 97, .48);
    return '<svg class="finale-photo-scene" data-scene="morning_sun" viewBox="0 0 180 112" preserveAspectRatio="none" aria-hidden="true">' +
      '<rect width="180" height="112" fill="#9bc4d4"/><circle cx="145" cy="21" r="16" fill="#fff0a8"/>' +
      '<g stroke="#fff2b8" stroke-width="2" opacity=".76"><path d="M145 0v8M145 34v10M123 21h-10M167 21h13M130 6l-7-7M160 6l8-7M130 36l-8 8M160 36l8 8"/></g>' +
      '<path d="M0 69L34 44l24 20 35-29 38 33 26-19 23 17v46H0Z" fill="#9bb6bd"/>' +
      '<path d="M0 76q32-15 62 0t62-1t56 1v36H0Z" fill="#f5f7ed"/>' + snow +
      '<path d="M0 96l58-23 42 14 45-21 35 12v34H0Z" fill="#dce8e4" opacity=".88"/>' +
      '<g transform="translate(78 77)"><ellipse cy="31" rx="33" ry="7" fill="#6f7f80" opacity=".25"/><circle cy="-19" r="10" fill="#d6ad91"/>' +
      '<path d="M-9-23q9-13 20 0v5H-9Z" fill="#4c3d36"/><path d="M-15-5q15-13 30 0l12 38h-54Z" fill="#a6655d"/>' +
      '<ellipse cx="7" cy="5" rx="14" ry="10" transform="rotate(18 7 5)" fill="#f1dfbf"/><circle cx="12" cy="1" r="5" fill="#d7af92"/>' +
      '<path d="M-8 3q17 11 29 7" fill="none" stroke="#e5cba8" stroke-width="5" stroke-linecap="round"/></g></svg>';
  }

  function setFinalePhotoFlipped(button, flipped) {
    if (!button) return;
    var photo = button._finalePhoto;
    var isFlipped = Boolean(flipped);
    button.classList.toggle("is-flipped", isFlipped);
    button.dataset.flipped = String(isFlipped);
    button.setAttribute("aria-pressed", String(isFlipped));
    if (photo) button.setAttribute("aria-label", isFlipped ? photo.back : photo.caption);
    if (button.classList.contains("is-viewer-photo")) elements.finalePhotoViewer.dataset.flipped = String(isFlipped);
  }

  function createFinalePhotoButton(photo, index, viewer) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "finale-photo" + (viewer ? " is-viewer-photo" : "");
    button.dataset.photoId = photo.id;
    button.dataset.photoIndex = String(index);
    button.dataset.image = photo.image;
    button.dataset.photoImage = photo.image;
    button._finalePhoto = photo;
    if (viewer) button.setAttribute("aria-describedby", elements.finalePhotoViewerGoal.id);
    else {
      button.setAttribute("aria-controls", elements.finalePhotoViewer.id);
      button.setAttribute("aria-expanded", "false");
    }

    var inner = document.createElement("span");
    inner.className = "finale-photo-inner";
    var front = document.createElement("span");
    front.className = "finale-photo-face finale-photo-front";
    front.setAttribute("aria-hidden", "true");
    var scene = document.createElement("span");
    scene.className = "finale-photo-image";
    scene.innerHTML = finalePhotoSceneMarkup(photo.image);
    var caption = document.createElement("span");
    caption.className = "finale-photo-caption";
    caption.textContent = photo.caption;
    var seal = document.createElement("span");
    seal.className = "finale-photo-match-seal";
    seal.setAttribute("aria-hidden", "true");
    seal.innerHTML = '<svg viewBox="0 0 28 28"><circle cx="14" cy="14" r="11"/><path d="M8 14l4 4 8-9"/></svg>';
    front.appendChild(scene);
    front.appendChild(caption);
    front.appendChild(seal);

    var back = document.createElement("span");
    back.className = "finale-photo-face finale-photo-back";
    back.setAttribute("aria-hidden", "true");
    var backCopy = document.createElement("span");
    backCopy.className = "finale-photo-back-copy";
    backCopy.textContent = photo.back;
    back.appendChild(backCopy);
    inner.appendChild(front);
    inner.appendChild(back);
    button.appendChild(inner);
    setFinalePhotoFlipped(button, false);
    button.addEventListener("click", function () {
      if (!viewer && isMobileLayout()) {
        openFinalePhotoViewer(index);
        return;
      }
      setFinalePhotoFlipped(button, !button.classList.contains("is-flipped"));
    });
    return button;
  }

  function finalePhotosForCurrentNight() {
    return currentNight && Array.isArray(currentNight.photos) ? currentNight.photos : [];
  }

  function syncFinalePhotoDom() {
    var photos = finalePhotosForCurrentNight();
    var matchedCount = photos.filter(function (photo) { return Boolean(finalePhotoMatches[photo.id]); }).length;
    var complete = Boolean(photos.length && matchedCount === photos.length);
    elements.finaleClues.dataset.matchedCount = String(matchedCount);
    elements.finaleClues.dataset.photoCount = String(photos.length);
    elements.finaleClues.dataset.complete = String(complete);
    elements.finalePhotos.dataset.matchedCount = String(matchedCount);
    elements.finalePhotos.dataset.litCount = String(matchedCount);
    elements.finalePhotos.dataset.allMatched = String(complete);
    elements.finalePhotos.dataset.complete = String(complete);
    elements.finalePhotos.classList.toggle("is-complete", complete);
    elements.gameScreen.dataset.photoMatches = matchedCount + "/" + photos.length;
    Array.prototype.forEach.call(elements.gameScreen.querySelectorAll(".finale-photo[data-photo-id]"), function (button) {
      var matched = Boolean(finalePhotoMatches[button.dataset.photoId]);
      button.classList.toggle("is-matched", matched);
      button.classList.toggle("is-lit", matched);
      button.dataset.matched = String(matched);
      button.dataset.lit = String(matched);
      button.setAttribute("aria-current", String(matched));
      var wrap = button.closest(".finale-photo-wrap");
      if (wrap) {
        wrap.classList.toggle("is-matched", matched);
        wrap.classList.toggle("is-lit", matched);
        wrap.dataset.matched = String(matched);
        wrap.dataset.lit = String(matched);
      }
    });
    if (!elements.finalePhotoViewer.hidden) {
      var active = photos[finalePhotoViewerIndex];
      elements.finalePhotoViewer.dataset.matched = String(Boolean(active && finalePhotoMatches[active.id]));
      elements.finalePhotoViewer.dataset.allMatched = String(complete);
    }
  }

  function resetFinalePhotos() {
    finalePhotoMatches = {};
    finalePhotosForCurrentNight().forEach(function (photo) { finalePhotoMatches[photo.id] = false; });
    elements.finalePhotos.removeAttribute("data-current-slot");
    elements.finalePhotos.removeAttribute("data-current-card");
    elements.finalePhotos.removeAttribute("data-fog-clear");
    syncFinalePhotoDom();
  }

  function markFinalePhotoForStep(slotIndex, cardId, stepState) {
    var photos = finalePhotosForCurrentNight();
    if (!photos.length || currentNight.id !== "3-3") return;
    elements.finalePhotos.dataset.currentSlot = String(slotIndex);
    elements.finalePhotos.dataset.currentCard = cardId;
    if (stepState && Object.prototype.hasOwnProperty.call(stepState, "fog")) elements.finalePhotos.dataset.fogClear = String(stepState.fog === false);
    var photoIndex = slotIndex - 1;
    var expected = ["snow", "snow", "sun"];
    var canSeeWeather = !stepState || stepState.fog === false;
    if (canSeeWeather && photoIndex >= 0 && photoIndex < photos.length && cardId === expected[photoIndex]) {
      finalePhotoMatches[photos[photoIndex].id] = true;
    }
    syncFinalePhotoDom();
  }

  function renderFinalePhotoViewer(index) {
    var photos = finalePhotosForCurrentNight();
    if (!photos.length) return;
    finalePhotoViewerIndex = (Number(index) + photos.length) % photos.length;
    var photo = photos[finalePhotoViewerIndex];
    elements.finalePhotoViewerCard.replaceChildren(createFinalePhotoButton(photo, finalePhotoViewerIndex, true));
    elements.finalePhotoViewer.dataset.photoId = photo.id;
    elements.finalePhotoViewer.dataset.photoIndex = String(finalePhotoViewerIndex);
    elements.finalePhotoViewer.dataset.image = photo.image;
    elements.finalePhotoViewer.dataset.flipped = "false";
    var previous = photos[(finalePhotoViewerIndex - 1 + photos.length) % photos.length];
    var next = photos[(finalePhotoViewerIndex + 1) % photos.length];
    elements.finalePhotoViewerPrev.hidden = photos.length < 2;
    elements.finalePhotoViewerNext.hidden = photos.length < 2;
    elements.finalePhotoViewerPrev.setAttribute("aria-label", previous.caption);
    elements.finalePhotoViewerNext.setAttribute("aria-label", next.caption);
    Array.prototype.forEach.call(elements.finalePhotos.querySelectorAll(".finale-photo"), function (button) {
      button.setAttribute("aria-expanded", String(Number(button.dataset.photoIndex) === finalePhotoViewerIndex));
    });
    syncFinalePhotoDom();
  }

  function openFinalePhotoViewer(index) {
    if (!isMobileLayout() || !finalePhotosForCurrentNight().length) return;
    finalePhotoViewerPreviousFocus = document.activeElement;
    renderFinalePhotoViewer(index);
    elements.finalePhotoViewer.hidden = false;
    elements.app.classList.add("is-photo-viewer-open");
    elements.gameScreen.classList.add("is-photo-viewer-open");
    window.requestAnimationFrame(function () {
      var card = elements.finalePhotoViewerCard.querySelector(".finale-photo");
      if (card) card.focus();
    });
  }

  function closeFinalePhotoViewer(restoreFocus) {
    if (!elements.finalePhotoViewer || elements.finalePhotoViewer.hidden) return;
    elements.finalePhotoViewer.hidden = true;
    elements.finalePhotoViewerCard.replaceChildren();
    elements.app.classList.remove("is-photo-viewer-open");
    elements.gameScreen.classList.remove("is-photo-viewer-open");
    Array.prototype.forEach.call(elements.finalePhotos.querySelectorAll(".finale-photo"), function (button) {
      button.setAttribute("aria-expanded", "false");
    });
    if (restoreFocus !== false && finalePhotoViewerPreviousFocus && typeof finalePhotoViewerPreviousFocus.focus === "function") finalePhotoViewerPreviousFocus.focus();
    finalePhotoViewerPreviousFocus = null;
  }

  function switchFinalePhotoViewer(direction) {
    var photos = finalePhotosForCurrentNight();
    if (!photos.length) return;
    renderFinalePhotoViewer(finalePhotoViewerIndex + direction);
    var card = elements.finalePhotoViewerCard.querySelector(".finale-photo");
    if (card) card.focus();
  }

  function renderFinaleClues() {
    closeFinalePhotoViewer(false);
    elements.finalePhotos.replaceChildren();
    var photos = finalePhotosForCurrentNight();
    var hasFinaleClues = Boolean(currentNight && currentNight.goal && photos.length);
    elements.finaleClues.hidden = !hasFinaleClues;
    elements.gameScreen.classList.toggle("has-finale-clues", hasFinaleClues);
    elements.gameScreen.dataset.hasPhotos = String(hasFinaleClues);
    if (!hasFinaleClues) {
      elements.finaleGoal.textContent = "";
      elements.finaleGoal.removeAttribute("data-level");
      elements.finalePhotoViewerGoal.textContent = "";
      finalePhotoMatches = {};
      return;
    }
    elements.finaleGoal.textContent = currentNight.goal;
    elements.finaleGoal.dataset.level = currentNight.id;
    elements.finalePhotoViewerGoal.textContent = currentNight.goal;
    elements.finalePhotos.setAttribute("aria-label", currentNight.goal);
    elements.finalePhotoViewerClose.setAttribute("aria-label", STORY.title_screen.continue);
    elements.finalePhotoViewerBackdrop.setAttribute("aria-label", STORY.title_screen.continue);
    photos.forEach(function (photo, index) {
      finalePhotoMatches[photo.id] = false;
      var wrap = document.createElement("div");
      wrap.className = "finale-photo-wrap";
      wrap.setAttribute("role", "listitem");
      wrap.dataset.photoId = photo.id;
      wrap.dataset.photoIndex = String(index);
      wrap.appendChild(createFinalePhotoButton(photo, index, false));
      elements.finalePhotos.appendChild(wrap);
    });
    syncFinalePhotoDom();
  }

  function guideTargetFor(step) {
    if (step === "read") return isMobileLayout() ? elements.letterToggle : elements.letterCard;
    if (step === "schedule") return elements.weatherCards;
    if (step === "broadcast") return elements.broadcastButton;
    return null;
  }

  function clearGuide() {
    [elements.letterCard, elements.letterToggle, elements.weatherCards, elements.broadcastButton].forEach(function (node) {
      node.classList.remove("is-guide-target");
    });
    guideStep = "";
    elements.gameScreen.removeAttribute("data-guide-step");
    elements.guideTip.hidden = true;
    elements.guideTip.textContent = "";
    elements.guideTip.removeAttribute("data-anchor");
  }

  function setGuideStep(step) {
    clearGuide();
    if (!currentNight || currentNight.id !== "1-1" || saveData.completed > 0 || !step) return;
    var copyByStep = {
      read: STORY.ui.guide_read,
      schedule: STORY.ui.guide_schedule,
      broadcast: STORY.ui.guide_broadcast
    };
    var target = guideTargetFor(step);
    if (!target || !copyByStep[step]) return;
    guideStep = step;
    elements.gameScreen.dataset.guideStep = step;
    elements.guideTip.dataset.anchor = step;
    elements.guideTip.textContent = copyByStep[step];
    elements.guideTip.hidden = false;
    target.classList.add("is-guide-target");
  }

  function finishLetterReading() {
    if (!currentNight) return;
    if (!skipNarration(elements.letterText, .15)) elements.letterText.textContent = currentNight.letter.text;
    letterReadComplete = true;
    if (guideStep === "read") {
      if (isMobileLayout()) elements.letterCard.classList.remove("is-open");
      setGuideStep("schedule");
    }
  }

  function startLetterTypewriter() {
    if (!currentNight) return;
    if (letterReadComplete) {
      elements.letterText.textContent = currentNight.letter.text;
      return;
    }
    if (narrations.has(elements.letterText)) return;
    audio.paper();
    narrateText(elements.letterText, currentNight.letter.text, AUDIO_MANIFEST.letters[currentNight.id], 35, function () {
      letterReadComplete = true;
      if (guideStep !== "read") return;
      if (isMobileLayout()) elements.letterCard.classList.remove("is-open");
      setGuideStep("schedule");
    });
  }

  function showChapterIntro(chapterIndex) {
    advancing = false;
    if (focusTimer) { window.clearTimeout(focusTimer); focusTimer = 0; }
    chapterIntroToken += 1;
    clearChapterIntroTimer();
    chapterIntroActive = false;
    chapterIntroSkipped = false;
    chapterIntroDuration = 0;
    chapterIntroAudioFile = "";
    currentChapter = STORY.chapters[chapterIndex];
    elements.chapterScreen.dataset.chapter = String(chapterIndex + 1);
    var chapterSeason = chapterIndex === 1 ? "summer" : chapterIndex === 2 ? "winter" : "spring";
    audio.stopVoice(.08);
    audio.setMusicCue(chapterSeason);
    elements.chapterTitle.textContent = currentChapter.title;
    elements.chapterSubtitle.textContent = currentChapter.subtitle;
    elements.chapterLines.replaceChildren();
    currentChapter.intro.forEach(function (line) { elements.chapterLines.appendChild(paragraph(line)); });
    elements.chapterContinue.textContent = STORY.title_screen.continue;
    elements.chapterContinue.disabled = true;
    elements.chapterContinue.onclick = function (event) {
      if (event) event.stopPropagation();
      if (advancing) return;
      advancing = true;
      elements.chapterContinue.disabled = true;
      skipChapterIntroNarration();
      window.setTimeout(function () {
        audio.radioStatic(.35);
        loadLevel(currentIndex);
      }, qaFast ? 0 : 170);
    };
    var introNight = LEVELS[currentIndex];
    var introIndex = currentIndex;
    town.allLit = false;
    town.setCompleted(saveData.completed);
    town.overview(false);
    showScreen(elements.chapterScreen);
    startChapterIntroNarration(chapterIndex);
    town.transitionSeason(chapterSeason, {
      duration: 2500,
      reducedMotion: reducedMotion || qaFast
    }).then(function () {
      if (currentIndex === introIndex && !elements.chapterScreen.hidden) elements.chapterContinue.disabled = false;
    });
  }

  function loadLevel(index) {
    playToken += 1;
    chapterIntroToken += 1;
    clearChapterIntroTimer();
    chapterIntroActive = false;
    if (focusTimer) { window.clearTimeout(focusTimer); focusTimer = 0; }
    playing = false;
    broadcasting = false;
    advancing = false;
    currentIndex = index;
    currentNight = LEVELS[index];
    var chapterIndex = LEVEL_CHAPTER[currentNight.id];
    currentChapter = STORY.chapters[chapterIndex];
    elements.gameScreen.dataset.chapter = String(chapterIndex + 1);
    elements.gameScreen.dataset.level = currentNight.id;
    audio.stopVoice(.08);
    audio.setMusicCue(chapterIndex === 1 ? "summer" : chapterIndex === 2 ? "winter" : "spring");
    schedule = new Array(currentNight.slots.length).fill(null);
    targetSlot = 0;
    hintCount = 0;
    failureCount = 0;
    hintLockedShown = false;
    viewState = SIM.getInitialState(currentNight.id);
    letterReadComplete = false;

    elements.chapterChip.textContent = currentChapter.title;
    elements.nightTitle.textContent = currentNight.title;
    elements.sceneDescription.textContent = currentNight.scene_desc;
    elements.sceneDescription.hidden = false;
    elements.letterFrom.textContent = currentNight.letter.from;
    abortNarration(elements.letterText, false, 0);
    elements.letterText.textContent = "";
    elements.letterCard.classList.remove("is-open");
    elements.letterToggle.hidden = false;
    elements.letterToggle.setAttribute("aria-label", currentNight.letter.from);
    elements.clearLabel.textContent = STORY.ui.reorder;
    elements.broadcastLabel.textContent = STORY.share.generate;
    elements.feedbackPanel.hidden = true;
    elements.feedbackPanel.classList.remove("is-success", "is-failure");
    elements.feedbackAction.hidden = true;
    elements.feedbackAction.disabled = false;
    elements.hintPanel.hidden = true;
    elements.hintPanel.replaceChildren();
    elements.hintButton.disabled = false;
    elements.hintButton.setAttribute("aria-label", currentNight.hints[0]);
    elements.clearButton.disabled = false;
    closeDrawer();

    renderProgress();
    renderBoothItems(chapterIndex);
    renderWeatherCards();
    renderTimeline();
    renderFinaleClues();
    updateBroadcastState();
    town.allLit = false;
    town.setCompleted(saveData.completed);
    town.setLevel(currentNight.id, viewState, { focus: false });
    town.overview(true);
    showScreen(elements.gameScreen);
    clearGuide();
    if (currentNight.id === "1-1" && saveData.completed === 0) {
      window.setTimeout(function () {
        if (currentNight && currentNight.id === "1-1" && !elements.gameScreen.hidden && !guideStep) setGuideStep("read");
      }, qaFast ? 15 : 680);
    }
    if (!isMobileLayout()) startLetterTypewriter();
    var focusLevelId = currentNight.id;
    focusTimer = window.setTimeout(function () {
      focusTimer = 0;
      if (!currentNight || currentNight.id !== focusLevelId || elements.gameScreen.hidden) return;
      town.focus(focusLevelId);
    }, 800);
    audio.radioStatic(.22);
  }

  function renderProgress() {
    elements.progressDots.replaceChildren();
    LEVELS.forEach(function (_night, index) {
      var dot = document.createElement("i");
      if (index < saveData.completed) dot.classList.add("is-done");
      if (index === currentIndex) dot.classList.add("is-current");
      elements.progressDots.appendChild(dot);
    });
  }

  function availableBoothItems(chapterIndex) {
    var items = [];
    for (var index = 0; index <= chapterIndex; index += 1) items = items.concat(STORY.chapters[index].booth);
    return items;
  }

  function renderBoothItems(chapterIndex) {
    elements.boothItems.replaceChildren();
    var items = availableBoothItems(chapterIndex);
    elements.clueDrawer.dataset.boothIds = items.map(function (item) { return item.id; }).join(",");
    items.forEach(function (item) {
      var button = makeButton(item.name, "booth-item", function () {
        closeDrawer();
        showModal(item.name, item.text, null, { kind: item.id, audioFile: AUDIO_MANIFEST.booth[item.id] });
      });
      button.dataset.boothId = item.id;
      button.dataset.hasVoice = String(Boolean(AUDIO_MANIFEST.booth[item.id]));
      elements.boothItems.appendChild(button);
    });
    elements.drawerButton.setAttribute("aria-label", STORY.ui.clues);
  }

  function toggleDrawer() {
    var opening = elements.clueDrawer.hidden;
    if (opening && isMobileLayout() && elements.letterCard.classList.contains("is-open")) {
      elements.letterCard.classList.remove("is-open");
      finishLetterReading();
    }
    elements.clueDrawer.hidden = !opening;
    elements.drawerButton.setAttribute("aria-expanded", String(opening));
    elements.gameScreen.classList.toggle("is-drawer-open", opening);
  }

  function closeDrawer() {
    elements.clueDrawer.hidden = true;
    elements.drawerButton.setAttribute("aria-expanded", "false");
    elements.gameScreen.classList.remove("is-drawer-open");
  }

  function clueVisualMarkup(kind) {
    if (kind === "photo") {
      return '<svg viewBox="0 0 560 300" aria-hidden="true"><defs><linearGradient id="photoFade" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#5f4936"/><stop offset="1" stop-color="#1f1b1b"/></linearGradient><filter id="photoSoft"><feGaussianBlur stdDeviation="1.2"/></filter></defs><rect width="560" height="300" rx="4" fill="url(#photoFade)"/><rect x="15" y="15" width="530" height="270" fill="none" stroke="#d7bd8a" stroke-opacity=".42" stroke-width="3"/><path d="M52 228H510M80 228V110h174v118M92 120h150M116 146v48M147 146v48M178 146v48M209 146v48" fill="none" stroke="#cfb988" stroke-opacity=".48" stroke-width="6"/><path d="M356 217c-8-45-5-86 27-104 34 4 45 42 38 104z" fill="#11141a" opacity=".88"/><circle cx="385" cy="92" r="25" fill="#17161a"/><path d="M356 152q31-29 63 0" fill="none" stroke="#d1aa83" stroke-width="13" stroke-linecap="round" opacity=".55"/><ellipse cx="378" cy="158" rx="30" ry="23" fill="#dcc39d" opacity=".76"/><circle cx="377" cy="149" r="12" fill="#29262a"/><path d="M285 102v116M263 102h45M286 132q-42 8-48 42" fill="none" stroke="#c6ad81" stroke-width="7" stroke-linecap="round"/><circle cx="286" cy="90" r="15" fill="#312a25" stroke="#c6ad81" stroke-width="4"/><g opacity=".2" filter="url(#photoSoft)"><circle cx="120" cy="70" r="50" fill="#fff1c8"/><circle cx="465" cy="235" r="38" fill="#fff1c8"/></g></svg>';
    }
    if (kind === "badge") {
      return '<svg viewBox="0 0 420 160" aria-hidden="true"><path d="M170 0q40 54 80 0" fill="none" stroke="#6f4b35" stroke-width="9"/><path d="M174 0l20 47M246 0l-20 47" stroke="#9c7050" stroke-width="5"/><rect x="107" y="42" width="206" height="106" rx="8" fill="#e4d4b8" stroke="#8c6b4c" stroke-width="4"/><circle cx="151" cy="91" r="23" fill="#bba888"/><path d="M190 78h86M190 101h67M126 130h160" stroke="#8e7a5e" stroke-width="5" stroke-linecap="round" opacity=".52"/><path d="M208 48q17 25 4 96" stroke="#7890a2" stroke-width="20" opacity=".21"/></svg>';
    }
    if (kind === "calendar") {
      return '<svg viewBox="0 0 420 190" aria-hidden="true"><rect x="92" y="27" width="236" height="148" rx="3" fill="#efe1c8" stroke="#8d6b4d" stroke-width="4"/><path d="M92 66h236M137 31V13M283 31V13" stroke="#70523e" stroke-width="8" stroke-linecap="round"/><g fill="#927d63" opacity=".55"><circle cx="132" cy="93" r="6"/><circle cx="171" cy="93" r="6"/><circle cx="210" cy="93" r="6"/><circle cx="249" cy="93" r="6"/><circle cx="288" cy="93" r="6"/><circle cx="132" cy="129" r="6"/><circle cx="171" cy="129" r="6"/><circle cx="210" cy="129" r="6"/><circle cx="249" cy="129" r="6"/><circle cx="288" cy="129" r="6"/></g><circle cx="249" cy="129" r="19" fill="none" stroke="#bd5546" stroke-width="5"/></svg>';
    }
    return "";
  }

  function showModal(title, text, onClose, options) {
    options = options || {};
    modalCallback = typeof onClose === "function" ? onClose : null;
    modalCeremonial = Boolean(options.outro);
    modalVoiceFile = !modalCeremonial && options.audioFile ? options.audioFile : "";
    previousFocus = document.activeElement;
    modalTypeToken += 1;
    var token = modalTypeToken;
    ["is-outro", "is-photo", "is-badge", "is-calendar"].forEach(function (name) { elements.modal.classList.remove(name); });
    if (modalCeremonial) elements.modal.classList.add("is-outro");
    if (options.kind === "photo") elements.modal.classList.add("is-photo");
    if (options.kind === "badge") elements.modal.classList.add("is-badge");
    if (options.kind === "calendar") elements.modal.classList.add("is-calendar");
    elements.modalTitle.textContent = title;
    elements.modalText.textContent = modalCeremonial ? "" : text;
    var visual = clueVisualMarkup(options.kind);
    elements.modalVisual.innerHTML = visual;
    elements.modalVisual.hidden = !visual;
    elements.modalContinue.textContent = STORY.title_screen.continue;
    elements.modalContinue.hidden = true;
    elements.modalClose.hidden = modalCeremonial;
    elements.modalClose.setAttribute("aria-label", title);
    elements.modalBackdrop.setAttribute("aria-label", title);
    elements.modalPaper.dataset.kind = options.kind || (modalCeremonial ? "outro" : "paper");
    screens.forEach(function (screen) { screen.inert = true; });
    closeAudioSettings();
    elements.soundToggle.inert = true;
    elements.audioSettings.inert = true;
    elements.modal.hidden = false;
    audio.paper();
    if (!modalCeremonial) {
      if (modalVoiceFile) playOptionalVoice(modalVoiceFile, { id: "booth:" + (options.kind || "paper") });
      window.requestAnimationFrame(function () { elements.modalClose.focus(); });
      return;
    }
    audio.stopVoice(.08);
    audio.setMusicCue("letter707");
    elements.modalPaper.tabIndex = -1;
    window.requestAnimationFrame(function () { elements.modalPaper.focus(); });
    narrateText(elements.modalText, text, options.audioFile, 35, async function () {
      await delay(2000);
      if (token !== modalTypeToken || elements.modal.hidden || !modalCeremonial) return;
      elements.modalContinue.hidden = false;
      elements.modalContinue.focus();
    });
  }

  function closeModal(force) {
    if (elements.modal.hidden || (modalCeremonial && force !== true)) return;
    modalTypeToken += 1;
    abortNarration(elements.modalText, false, .12);
    audio.stopVoice(modalVoiceFile ? .15 : .12);
    elements.modal.hidden = true;
    elements.modalContinue.hidden = true;
    elements.modalClose.hidden = false;
    elements.modal.classList.remove("is-outro", "is-photo", "is-badge", "is-calendar");
    screens.forEach(function (screen) { screen.inert = false; });
    elements.soundToggle.inert = false;
    elements.audioSettings.inert = false;
    modalCeremonial = false;
    modalVoiceFile = "";
    var callback = modalCallback;
    modalCallback = null;
    if (callback) callback();
    else if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
    previousFocus = null;
  }

  function cardMarkup(cardId) {
    return '<span class="weather-icon"><svg viewBox="0 0 42 42" aria-hidden="true">' + Town.ICON[cardId] + '</svg></span>' +
      '<span class="weather-name"></span><span class="weather-desc"></span>';
  }

  function positionCardTooltip(button) {
    if (!button || !elements.weatherCardTooltip || elements.weatherCardTooltip.hidden) return;
    elements.gameScreen.classList.remove("card-tooltip-over-utilities");
    var cardRect = button.getBoundingClientRect();
    var tooltip = elements.weatherCardTooltip;
    var margin = 12;
    var gap = 15;
    var tooltipWidth = tooltip.offsetWidth;
    var tooltipHeight = tooltip.offsetHeight;
    var consolePanel = elements.weatherCards.closest(".console-panel");
    var consoleRect = consolePanel ? consolePanel.getBoundingClientRect() : null;
    var left = cardRect.left + cardRect.width / 2 - tooltipWidth / 2;
    left = Math.max(margin, Math.min(window.innerWidth - tooltipWidth - margin, left));
    var anchorTop = consoleRect ? Math.min(cardRect.top, consoleRect.top) : cardRect.top;
    var top = anchorTop - tooltipHeight - gap;
    if (top < margin) top = Math.min(window.innerHeight - tooltipHeight - margin, cardRect.bottom + gap);
    var arrowLeft = Math.max(18, Math.min(tooltipWidth - 18, cardRect.left + cardRect.width / 2 - left));
    tooltip.style.left = Math.round(left) + "px";
    tooltip.style.top = Math.round(top) + "px";
    tooltip.style.setProperty("--tooltip-arrow-x", Math.round(arrowLeft) + "px");
    var renderedRect = tooltip.getBoundingClientRect();
    if (consoleRect && renderedRect.bottom > consoleRect.top - 8) {
      top -= renderedRect.bottom - (consoleRect.top - 8);
      tooltip.style.top = Math.round(top) + "px";
      renderedRect = tooltip.getBoundingClientRect();
    }
    var utilitiesOverlap = [elements.radioButton, elements.hintButton].some(function (element) {
      if (!element || getComputedStyle(element).display === "none" || getComputedStyle(element).visibility === "hidden") return false;
      var rect = element.getBoundingClientRect();
      return Math.min(renderedRect.right, rect.right) - Math.max(renderedRect.left, rect.left) > .5 &&
        Math.min(renderedRect.bottom, rect.bottom) - Math.max(renderedRect.top, rect.top) > .5;
    });
    elements.gameScreen.classList.toggle("card-tooltip-over-utilities", utilitiesOverlap);
  }

  function showCardTooltip(button, description, mode) {
    if (!button || !elements.weatherCardTooltip || !description) return;
    if (isMobileLayout() && elements.letterCard.classList.contains("is-open")) {
      elements.letterCard.classList.remove("is-open");
      finishLetterReading();
    }
    if (cardTooltipOwner && cardTooltipOwner !== button) cardTooltipOwner.removeAttribute("aria-describedby");
    cardTooltipOwner = button;
    cardTooltipMode = mode || "hover";
    elements.weatherCardTooltip.textContent = description;
    elements.weatherCardTooltip.hidden = false;
    elements.gameScreen.classList.add("has-card-tooltip");
    button.setAttribute("aria-describedby", elements.weatherCardTooltip.id);
    positionCardTooltip(button);
  }

  function hideCardTooltip(owner, force) {
    if (!elements.weatherCardTooltip || elements.weatherCardTooltip.hidden) return;
    if (!force && owner && owner !== cardTooltipOwner) return;
    if (cardTooltipOwner) cardTooltipOwner.removeAttribute("aria-describedby");
    cardTooltipOwner = null;
    cardTooltipMode = "";
    elements.weatherCardTooltip.hidden = true;
    elements.weatherCardTooltip.style.removeProperty("left");
    elements.weatherCardTooltip.style.removeProperty("top");
    elements.weatherCardTooltip.style.removeProperty("--tooltip-arrow-x");
    elements.gameScreen.classList.remove("has-card-tooltip");
    elements.gameScreen.classList.remove("card-tooltip-over-utilities");
  }

  function bindCardDescription(button, cardData) {
    var holdTimer = 0;
    var holdStartX = 0;
    var holdStartY = 0;
    var holdPointerId = null;
    var hoverCapable = !window.matchMedia || window.matchMedia("(hover: hover)").matches;

    function clearHoldTimer() {
      if (holdTimer) window.clearTimeout(holdTimer);
      holdTimer = 0;
      holdPointerId = null;
    }

    if (hoverCapable) {
      button.addEventListener("mouseenter", function () { showCardTooltip(button, cardData.desc, "hover"); });
      button.addEventListener("mouseleave", function () {
        if (cardTooltipMode === "hover") hideCardTooltip(button, false);
      });
    }
    button.addEventListener("focus", function () {
      window.requestAnimationFrame(function () {
        if (document.activeElement === button && button.matches(":focus-visible")) showCardTooltip(button, cardData.desc, "focus");
      });
    });
    button.addEventListener("blur", function () {
      if (cardTooltipMode === "focus") hideCardTooltip(button, false);
    });
    button.addEventListener("pointerdown", function (event) {
      if (event.pointerType !== "touch" && event.pointerType !== "pen") return;
      if (cardTooltipOwner === button && cardTooltipMode === "longpress") {
        button.dataset.suppressCardClickUntil = String(Date.now() + 700);
        hideCardTooltip(button, true);
        return;
      }
      clearHoldTimer();
      holdPointerId = event.pointerId;
      holdStartX = event.clientX;
      holdStartY = event.clientY;
      holdTimer = window.setTimeout(function () {
        holdTimer = 0;
        button.dataset.suppressCardClickUntil = String(Date.now() + 700);
        showCardTooltip(button, cardData.desc, "longpress");
        if (navigator.vibrate) {
          try { navigator.vibrate(18); } catch (_) { /* Vibration may be unavailable. */ }
        }
      }, 480);
    });
    button.addEventListener("pointermove", function (event) {
      if (!holdTimer || event.pointerId !== holdPointerId) return;
      if (Math.abs(event.clientX - holdStartX) > 10 || Math.abs(event.clientY - holdStartY) > 10) clearHoldTimer();
    });
    button.addEventListener("pointerup", clearHoldTimer);
    button.addEventListener("pointercancel", function () {
      clearHoldTimer();
      if (cardTooltipMode === "longpress") hideCardTooltip(button, false);
    });
    button.addEventListener("contextmenu", function (event) {
      event.preventDefault();
    });
  }

  function renderWeatherCards() {
    hideCardTooltip(null, true);
    elements.weatherCards.replaceChildren();
    currentNight.cards.forEach(function (cardId) {
      var cardData = STORY.cards[cardId];
      var button = document.createElement("button");
      button.type = "button";
      button.className = "weather-card";
      button.draggable = true;
      button.dataset.card = cardId;
      button.innerHTML = cardMarkup(cardId);
      button.querySelector(".weather-name").textContent = cardData.name;
      button.querySelector(".weather-desc").textContent = cardData.desc;
      button.setAttribute("aria-label", cardData.name + "，" + cardData.desc);
      bindCardDescription(button, cardData);
      button.addEventListener("click", function (event) {
        if (Date.now() < Number(button.dataset.suppressCardClickUntil || 0)) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        hideCardTooltip(button, true);
        placeCard(cardId);
      });
      button.addEventListener("dragstart", function (event) {
        if (playing) { event.preventDefault(); return; }
        event.dataTransfer.setData("text/plain", cardId);
        event.dataTransfer.effectAllowed = "copy";
      });
      elements.weatherCards.appendChild(button);
    });
  }

  function renderTimeline() {
    elements.timeline.replaceChildren();
    elements.timeline.style.setProperty("--slot-count", String(currentNight.slots.length));
    currentNight.slots.forEach(function (slotName, index) {
      var button = document.createElement("button");
      var cardId = schedule[index];
      button.type = "button";
      button.className = "time-slot" + (cardId ? " is-filled" : "") + (targetSlot === index ? " is-target" : "");
      button.dataset.index = String(index);
      button.innerHTML = '<span class="slot-order"></span><span class="slot-copy"><span class="slot-name"></span><span class="slot-card-name"></span></span><span class="slot-symbol"></span>';
      button.querySelector(".slot-order").textContent = slotName.slice(0, 1);
      button.querySelector(".slot-name").textContent = slotName;
      button.querySelector(".slot-card-name").textContent = cardId ? STORY.cards[cardId].name : "";
      button.setAttribute("aria-label", slotName + (cardId ? "，" + STORY.cards[cardId].name : ""));
      button.addEventListener("click", function () {
        if (playing) return;
        targetSlot = index;
        if (schedule[index]) schedule[index] = null;
        renderTimeline();
        updateBroadcastState();
      });
      button.addEventListener("dragover", function (event) { if (!playing) event.preventDefault(); });
      button.addEventListener("drop", function (event) {
        event.preventDefault();
        var dragged = event.dataTransfer.getData("text/plain");
        if (!playing && currentNight.cards.indexOf(dragged) !== -1) { targetSlot = index; placeCard(dragged); }
      });
      elements.timeline.appendChild(button);
    });
  }

  function placeCard(cardId) {
    if (playing) return;
    var index = targetSlot;
    if (index < 0 || index >= schedule.length) index = schedule.indexOf(null);
    if (index === -1) index = 0;
    schedule[index] = cardId;
    var nextEmpty = schedule.indexOf(null, index + 1);
    if (nextEmpty === -1) nextEmpty = schedule.indexOf(null);
    targetSlot = nextEmpty === -1 ? index : nextEmpty;
    renderTimeline();
    updateBroadcastState();
    if (guideStep === "schedule") setGuideStep("broadcast");
  }

  function updateBroadcastState() {
    var complete = !schedule.some(function (card) { return !card; });
    var ready = !playing && complete;
    elements.broadcastButton.disabled = !ready;
    elements.broadcastButton.classList.toggle("is-ready", ready);
    elements.broadcastButton.classList.toggle("is-playing", broadcasting);
    elements.broadcastButton.setAttribute("aria-label", broadcasting ? STORY.ui.on_air : STORY.share.generate);
    elements.clearButton.disabled = playing;
    elements.hintButton.disabled = playing || hintCount >= currentNight.hints.length;
    elements.radioButton.disabled = playing;
    elements.drawerButton.disabled = playing;
    elements.letterToggle.disabled = playing;
    Array.prototype.forEach.call(elements.boothItems.children, function (button) { button.disabled = playing; });
    Array.prototype.forEach.call(elements.weatherCards.children, function (button) { button.disabled = playing; });
    Array.prototype.forEach.call(elements.timeline.children, function (button) { button.disabled = playing; });
  }

  function resetAttempt() {
    playToken += 1;
    playing = false;
    broadcasting = false;
    schedule = new Array(currentNight.slots.length).fill(null);
    targetSlot = 0;
    viewState = SIM.getInitialState(currentNight.id);
    town.stopWeather();
    town.setState(currentNight.id, viewState);
    town.focus(currentNight.id);
    resetFinalePhotos();
    elements.sceneDescription.hidden = false;
    elements.feedbackPanel.hidden = true;
    elements.feedbackPanel.classList.remove("is-success", "is-failure");
    elements.feedbackAction.hidden = true;
    renderTimeline();
    renderHints();
    updateBroadcastState();
  }

  function renderHints() {
    elements.hintPanel.replaceChildren();
    currentNight.hints.slice(0, hintCount).forEach(function (hint) { elements.hintPanel.appendChild(paragraph(hint)); });
    if (hintLockedShown && failureCount < 2) {
      var locked = paragraph(STORY.ui.hint_locked);
      locked.classList.add("hint-locked");
      elements.hintPanel.appendChild(locked);
    }
    elements.hintPanel.hidden = hintCount === 0 && !hintLockedShown;
  }

  function revealHint() {
    if (playing || hintCount >= currentNight.hints.length) return;
    if (isMobileLayout() && elements.letterCard.classList.contains("is-open")) {
      elements.letterCard.classList.remove("is-open");
      finishLetterReading();
    }
    if (hintCount === currentNight.hints.length - 1 && failureCount < 2) {
      hintLockedShown = true;
      renderHints();
      audio.paper();
      return;
    }
    hintCount += 1;
    hintLockedShown = false;
    renderHints();
    audio.paper();
    elements.hintButton.disabled = hintCount >= currentNight.hints.length;
  }

  function showFeedback(lines, mode) {
    feedbackTypeToken += 1;
    var token = feedbackTypeToken;
    Array.prototype.forEach.call(elements.feedbackLines.children, function (node) { stopTypewriter(node, false); });
    elements.sceneDescription.hidden = true;
    elements.feedbackLines.replaceChildren();
    var validLines = lines.filter(function (line) { return typeof line === "string" && line.length; });
    var nodes = validLines.map(function () {
      var node = paragraph("");
      elements.feedbackLines.appendChild(node);
      return node;
    });
    elements.feedbackPanel.hidden = false;
    elements.feedbackPanel.classList.toggle("is-success", mode === "success");
    elements.feedbackPanel.classList.toggle("is-failure", mode === "failure");
    (async function () {
      for (var index = 0; index < nodes.length; index += 1) {
        if (token !== feedbackTypeToken) return;
        var writer = typeText(nodes[index], validLines[index], 28);
        await writer.promise;
      }
    })();
    if (mode === "success") {
      elements.townStage.classList.remove("town-success-moment");
      void elements.townStage.offsetWidth;
      elements.townStage.classList.add("town-success-moment");
      window.setTimeout(function () { elements.townStage.classList.remove("town-success-moment"); }, qaFast ? 80 : 2500);
    }
  }

  function eventLines(step) {
    var lines = [];
    step.events.forEach(function (eventKey) {
      lines.push(Object.prototype.hasOwnProperty.call(currentNight.step, eventKey) ? currentNight.step[eventKey] : STORY.cards[step.card].generic);
    });
    if (!lines.length) lines.push(STORY.cards[step.card].generic);
    return lines;
  }

  function finalEventLines(events) {
    return events.map(function (eventKey) { return currentNight.step[eventKey] || ""; }).filter(Boolean);
  }

  function delay(milliseconds) {
    var duration = qaFast ? Math.min(24, milliseconds) : milliseconds;
    return new Promise(function (resolve) { window.setTimeout(resolve, duration); });
  }

  function weatherDuration() {
    if (typeof qaFastValue === "number" && isFinite(qaFastValue)) return Math.max(30, qaFastValue);
    if (qaFast) return 38;
    return reducedMotion ? 320 : 2500;
  }

  function finaleWeatherDuration() {
    return qaFast ? weatherDuration() : 3000;
  }

  async function playJingleWithFallback() {
    var result = await audio.playJingle();
    if (qaFast) return;
    if (result.ok || !audio.canPlayEffects()) return;
    audio.noteFallback("sfx-jingle:synth", "synth");
    audio.stationIdent();
    await delay(2000);
  }

  async function playBroadcastVoice(token) {
    if (!audio.voiceEnabled) return;
    audio.duckMusic(true, .3);
    try {
      await audio.playVoiceFile(AUDIO_MANIFEST.hostOpen, { id: "host-open", manageDuck: false });
      if (token !== playToken || !audio.voiceEnabled) return;
      for (var index = 0; index < schedule.length; index += 1) {
        var slotName = currentNight.slots[index];
        await audio.playVoiceFile(AUDIO_MANIFEST.slots[slotName], { id: "slot:" + slotName, manageDuck: false });
        if (token !== playToken || !audio.voiceEnabled) return;
        await delay(250);
        await audio.playVoiceFile(AUDIO_MANIFEST.weather[schedule[index]], { id: "weather:" + schedule[index], manageDuck: false });
        if (token !== playToken || !audio.voiceEnabled) return;
        if (index < schedule.length - 1) await delay(250);
      }
      await audio.playVoiceFile(AUDIO_MANIFEST.hostClose, { id: "host-close", manageDuck: false });
    } finally {
      audio.duckMusic(false, .8);
    }
  }

  async function runBroadcast() {
    if (playing || schedule.some(function (card) { return !card; })) return;
    closeFinalePhotoViewer(false);
    resetFinalePhotos();
    var token = ++playToken;
    var result = SIM.simulateLevel(currentNight.id, schedule.slice());
    var isFinaleSuccess = currentNight.id === "3-3" && result.success;
    if (isFinaleSuccess) audio.setMusicCue("ending", 3);
    playing = true;
    broadcasting = true;
    elements.feedbackAction.hidden = true;
    elements.hintPanel.hidden = true;
    elements.sceneDescription.hidden = true;
    elements.letterCard.classList.remove("is-open");
    finishLetterReading();
    clearGuide();
    closeDrawer();
    updateBroadcastState();
    await playJingleWithFallback();
    if (token !== playToken) return;
    await playBroadcastVoice(token);
    if (token !== playToken) return;

    for (var index = 0; index < result.steps.length; index += 1) {
      if (token !== playToken) return;
      var step = result.steps[index];
      if (isFinaleSuccess) {
        setEndingPhase(["dusk-wind", "midnight-snow", "dawn-snow", "sunrise"][index] || "sunrise");
      }
      markPlayingSlot(step.index);
      markFinalePhotoForStep(step.index, step.card, step.state);
      viewState = Object.assign({}, step.state, {
        __failKey: step.failKey,
        __lastCard: step.card,
        __event: step.events[0] || "",
        __stepIndex: step.index
      });
      showFeedback(eventLines(step), null);
      var slotDuration = isFinaleSuccess ? finaleWeatherDuration() : weatherDuration();
      audio.weather(step.card, slotDuration);
      if (isFinaleSuccess) {
        await town.playFinalePhase(["dusk-wind", "night-snow", "dawn-snow", "morning-sun"][index], {
          duration: slotDuration,
          reducedMotion: reducedMotion || qaFast
        });
      } else {
        await town.playWeather(step.card, viewState, {
          levelId: currentNight.id,
          duration: slotDuration,
          reducedMotion: reducedMotion || qaFast
        });
      }
    }
    audio.stopWeather(.12);

    broadcasting = false;
    updateBroadcastState();

    if (result.finalEvents.length) {
      viewState = Object.assign({}, result.state, { __lastCard: schedule[schedule.length - 1] });
      town.setState(currentNight.id, viewState);
      showFeedback(finalEventLines(result.finalEvents), null);
      await delay(reducedMotion ? 120 : 900);
    }

    if (token !== playToken) return;
    clearPlayingSlots();
    viewState = Object.assign({}, result.state, { __failKey: result.failKey });
    town.setState(currentNight.id, viewState);

    if (result.success) {
      saveData.completed = Math.max(saveData.completed, currentIndex + 1);
      var completedChapterIndex = LEVEL_CHAPTER[currentNight.id];
      var isChapterBoundary = currentChapter.outro_letter && currentIndex < LEVELS.length - 1 && LEVEL_CHAPTER[LEVELS[currentIndex + 1].id] !== completedChapterIndex;
      if (isChapterBoundary) saveData.pendingOutro = completedChapterIndex;
      persistSave();
      town.markCompleted(currentNight.id);
      town.overview(false);
      renderProgress();
      audio.success();
      if (currentNight.success) {
        showFeedback([currentNight.success], "success");
        playOptionalVoice(AUDIO_MANIFEST.success[currentNight.id], { id: "success:" + currentNight.id });
        elements.feedbackAction.textContent = STORY.title_screen.continue;
        elements.feedbackAction.hidden = false;
        elements.feedbackAction.onclick = nextLevel;
      } else {
        await delay(reducedMotion ? 180 : 1300);
        playEnding();
      }
    } else {
      failureCount += 1;
      if (failureCount >= 2) hintLockedShown = false;
      audio.failure();
      showFeedback([currentNight.fail[result.failKey]], "failure");
      elements.feedbackAction.textContent = STORY.title_screen.restart;
      elements.feedbackAction.hidden = false;
      elements.feedbackAction.onclick = resetAttempt;
    }
  }

  function markPlayingSlot(index) {
    Array.prototype.forEach.call(elements.timeline.children, function (slot, slotIndex) {
      slot.classList.toggle("is-playing", slotIndex === index);
    });
  }

  function clearPlayingSlots() {
    Array.prototype.forEach.call(elements.timeline.children, function (slot) { slot.classList.remove("is-playing"); });
  }

  function nextLevel() {
    if (advancing) return;
    advancing = true;
    elements.feedbackAction.disabled = true;
    if (currentIndex >= LEVELS.length - 1) { playEnding(); return; }
    var oldChapterIndex = LEVEL_CHAPTER[currentNight.id];
    var nextIndex = currentIndex + 1;
    var nextChapterIndex = LEVEL_CHAPTER[LEVELS[nextIndex].id];
    currentIndex = nextIndex;
    if (nextChapterIndex !== oldChapterIndex) {
      var outgoing = STORY.chapters[oldChapterIndex].outro_letter;
      if (outgoing) {
        showModal(outgoing.from, outgoing.text, function () {
          saveData.pendingOutro = null;
          persistSave();
          showChapterIntro(nextChapterIndex);
        }, { outro: true, kind: "outro", audioFile: AUDIO_MANIFEST.outros[oldChapterIndex] });
      } else showChapterIntro(nextChapterIndex);
    } else loadLevel(currentIndex);
  }

  async function playEnding() {
    var token = ++playToken;
    playing = false;
    broadcasting = false;
    clearGuide();
    audio.stopVoice(.1);
    audio.setMusicCue("ending", 2.2);
    saveData.completed = LEVELS.length;
    saveData.pendingOutro = null;
    persistSave();
    town.allLit = true;
    town.setCompleted(LEVELS.length);
    town.setFinalePhase("morning-sun", { focus: false, instant: true });
    town.overview(false);
    showScreen(elements.endingScreen);
    elements.endingScreen.classList.remove("is-credits", "is-share-ready");
    elements.endingLines.hidden = false;
    elements.endingLines.replaceChildren();
    elements.credits.hidden = true;
    elements.credits.classList.remove("is-rolling");
    elements.endingShare.hidden = true;
    elements.endingRestart.hidden = true;
    endingLineIndex = -1;
    endingLineHoldMs = 0;
    setEndingPhase("sunrise");

    for (var index = 0; index < STORY.ending.lines.length; index += 1) {
      if (token !== playToken) return;
      var line = STORY.ending.lines[index];
      if (index === 13) {
        setEndingPhase("xiaoxue-pause");
        await delay(2000);
        if (token !== playToken) return;
        town.setHospitalMotherTurned(true);
      }
      if (index === 2) {
        setEndingPhase("hospital-transition");
        audio.endingSolo();
        var hospitalStartState = { badgeClear: false, motherTurned: false, lampOn: false, radioOn: false, cardClear: false };
        if (qaFast) town.showEndingRoom({ instant: true, state: hospitalStartState });
        else town.transitionToHospital({ duration: 3600, reducedMotion: reducedMotion, state: hospitalStartState });
      } else if (index === 3) {
        setEndingPhase("hospital");
        town.setHospitalState({ lampOn: true });
      } else if (index === 4) {
        setEndingPhase("hospital-radio");
        town.setHospitalState({ radioOn: true });
      } else if (index === 5) {
        setEndingPhase("patient-card");
        town.setHospitalState({ cardClear: true });
      } else if (index === 7) {
        setEndingPhase("hospital-reality");
      } else if (index === 8) {
        setEndingPhase("memory-explained");
      }
      if (index === 17) {
        setEndingPhase("badge-reveal");
        town.setHospitalBadgeClear(true);
      }
      if (index === 18) {
        setEndingPhase("name-reveal");
      }
      if (index === STORY.ending.lines.length - 1) setEndingPhase("final-line");
      endingLineIndex = index;
      var endingLine = paragraph(line);
      if (index === STORY.ending.lines.length - 1) endingLine.classList.add("is-final-line");
      elements.endingLines.replaceChildren(endingLine);
      var endingAudio = AUDIO_MANIFEST.ending[index];
      var originalHold = index === STORY.ending.lines.length - 1 ? 4000 : line ? 2200 : 1000;
      var targetHold = originalHold;
      var lineStartedAt = performance.now();
      if (endingAudio && audio.voiceEnabled) {
        var spoken = await audio.playVoiceFile(endingAudio, {
          id: "ending:" + endingAudio,
          silentFailure: Boolean(OPTIONAL_ENDING_VOICE[index])
        });
        if (spoken.ok) targetHold = Math.max(originalHold, spoken.duration * 1000 + 800);
      }
      endingLineHoldMs = Math.round(targetHold);
      audio.noteEvent("ending-hold", String(index), String(endingLineHoldMs));
      await delay(Math.max(0, targetHold - (performance.now() - lineStartedAt)));
    }

    if (token !== playToken) return;
    endingLineIndex = -1;
    setEndingPhase("credits");
    elements.endingLines.hidden = true;
    elements.endingScreen.classList.add("is-credits");
    elements.credits.hidden = false;
    elements.credits.replaceChildren();
    var heading = document.createElement("h2");
    heading.textContent = STORY.meta.title;
    elements.credits.appendChild(heading);
    STORY.meta.credits.forEach(function (credit, creditIndex) {
      var item = paragraph(credit);
      if (creditIndex === 0) item.classList.add("producer-credit");
      elements.credits.appendChild(item);
    });
    elements.credits.classList.add("is-rolling");
    await delay(10000);
    if (token !== playToken) return;
    setEndingPhase("share-ready");
    elements.endingScreen.classList.add("is-share-ready");
    elements.endingShare.textContent = STORY.share.button;
    elements.endingShare.hidden = false;
    elements.endingRestart.textContent = STORY.title_screen.restart;
    elements.endingRestart.hidden = false;
  }

  function setupShareCopy() {
    elements.shareTitle.textContent = STORY.share.title;
    elements.shareName.placeholder = STORY.share.name_placeholder;
    elements.shareName.setAttribute("aria-label", STORY.share.name_placeholder);
    elements.shareChoose.textContent = STORY.share.choose;
    elements.shareGenerate.querySelector("span").textContent = STORY.share.generate;
    elements.shareStatus.textContent = STORY.ui.on_air;
    elements.posterSave.textContent = STORY.share.save;
    elements.posterAgain.textContent = STORY.share.again;
    elements.shareClose.setAttribute("aria-label", STORY.title_screen.continue);
    elements.posterPreview.alt = STORY.share.title;
  }

  function openShare(returnScreen) {
    shareReturnScreen = returnScreen || elements.titleScreen;
    shareWeather = [];
    shareResult = null;
    shareBusy = false;
    elements.shareName.value = "";
    elements.posterWrap.hidden = true;
    elements.posterPreview.removeAttribute("src");
    elements.shareScreen.classList.remove("has-poster");
    town.hospital = false;
    town.allLit = true;
    town.setCompleted(LEVELS.length);
    town.setLevel("3-3", Town.SUCCESS_STATE["3-3"], { focus: false });
    town.setSeason("spring");
    town.overview(true);
    renderShareCards();
    updateShareState();
    showScreen(elements.shareScreen);
    window.requestAnimationFrame(function () { elements.shareName.focus(); });
  }

  function closeShare() {
    playToken += 1;
    town.stopWeather();
    if (shareReturnScreen === elements.endingScreen) {
      town.showEndingRoom();
      showScreen(elements.endingScreen);
    } else initializeTitle();
  }

  function renderShareCards() {
    elements.shareCards.replaceChildren();
    Object.keys(STORY.cards).forEach(function (cardId) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "weather-card";
      button.dataset.card = cardId;
      button.innerHTML = cardMarkup(cardId);
      button.querySelector(".weather-name").textContent = STORY.cards[cardId].name;
      button.querySelector(".weather-desc").textContent = STORY.cards[cardId].desc;
      button.setAttribute("aria-label", STORY.cards[cardId].name + "，" + STORY.cards[cardId].desc);
      button.addEventListener("click", function () {
        if (shareBusy) return;
        shareWeather = Poster.toggleWeather(shareWeather, cardId);
        updateShareState();
      });
      elements.shareCards.appendChild(button);
    });
  }

  function updateShareState() {
    Array.prototype.forEach.call(elements.shareCards.children, function (button) {
      var index = shareWeather.indexOf(button.dataset.card);
      button.classList.toggle("is-selected", index >= 0);
      button.dataset.order = index >= 0 ? String(index + 1) : "";
      button.disabled = shareBusy || (shareWeather.length >= 3 && index < 0);
    });
    elements.shareSequence.replaceChildren();
    shareWeather.forEach(function (cardId, index) {
      var button = makeButton(STORY.cards[cardId].name, "", function () {
        if (shareBusy) return;
        shareWeather = Poster.removeWeather(shareWeather, index);
        updateShareState();
      });
      elements.shareSequence.appendChild(button);
    });
    var checked = Poster.validate({ name: elements.shareName.value, weathers: shareWeather, cards: STORY.cards });
    var ready = !shareBusy && checked.ok;
    elements.shareGenerate.disabled = !ready;
    elements.shareGenerate.classList.toggle("is-ready", ready);
    elements.shareGenerate.classList.toggle("is-playing", shareBusy);
  }

  async function generateSharePoster() {
    if (shareBusy) return;
    var checked = Poster.validate({ name: elements.shareName.value, weathers: shareWeather, cards: STORY.cards });
    if (!checked.ok) return;
    shareBusy = true;
    updateShareState();
    await playJingleWithFallback();
    town.overview(false);
    for (var index = 0; index < checked.weathers.length; index += 1) {
      var slotDuration = weatherDuration();
      audio.weather(checked.weathers[index], slotDuration);
      await town.playWeather(checked.weathers[index], null, {
        duration: slotDuration,
        reducedMotion: reducedMotion || qaFast
      });
    }
    audio.stopWeather(.12);
    try {
      shareResult = await Poster.generate({
        share: STORY.share,
        cards: STORY.cards,
        name: checked.name,
        weathers: checked.weathers,
        townSvg: town.svg
      });
      elements.posterPreview.src = shareResult.dataUrl;
      elements.posterWrap.hidden = false;
      elements.shareScreen.classList.add("has-poster");
    } finally {
      shareBusy = false;
      updateShareState();
    }
  }

  function resetSharePoster() {
    shareResult = null;
    shareWeather = [];
    elements.shareName.value = "";
    elements.posterWrap.hidden = true;
    elements.posterPreview.removeAttribute("src");
    elements.shareScreen.classList.remove("has-poster");
    updateShareState();
    elements.shareName.focus();
  }

  function downloadSharePoster() {
    if (!shareResult) return;
    Poster.downloadPNG(shareResult, STORY.meta.title + "-" + shareResult.name + ".png");
  }

  function AudioEngine(options) {
    options = options || {};
    this.musicEnabled = options.musicEnabled !== false;
    this.voiceEnabled = options.voiceEnabled !== false;
    this.musicVolume = normalizeAudioVolume(options.musicVolume, .5);
    this.voiceVolume = normalizeAudioVolume(options.voiceVolume, 1);
    this.context = null;
    this.masterGain = null;
    this.musicBus = null;
    this.effectsBus = null;
    this.reverb = null;
    this.reverbReturn = null;
    this.volume = .35;
    this.unlocked = false;
    this.requestedCue = null;
    this.musicCue = null;
    this.musicDucked = false;
    this.musicDuckFactor = 1;
    this.musicTrack = null;
    this.weatherVoice = null;
    this.musicSerial = 0;
    this.musicMediaToken = 0;
    this.musicPending = false;
    this.activeMusicDeck = -1;
    this.voiceSerial = 0;
    this.voicePending = null;
    this.activeVoiceCue = null;
    this.lastVoiceCue = null;
    this.lastFallbackCue = null;
    this.failedMedia = {};
    this.audioEvents = [];
    this.fallbackIds = [];
    this.musicDecks = [new Audio(), new Audio()];
    this.musicDecks.forEach(function (deck) {
      deck.preload = "auto";
      deck.playsInline = true;
      deck.volume = 0;
      deck.__baseVolume = 0;
      deck.__fadeToken = 0;
      deck.__cue = null;
    });
    this.voiceElement = new Audio();
    this.voiceElement.preload = "metadata";
    this.voiceElement.playsInline = true;
    this.voiceElement.__baseVolume = .92;
    this.voiceElement.volume = this.voiceElement.__baseVolume * this.voiceVolume;
    this.voiceElement.__fadeToken = 0;
  }
  AudioEngine.prototype.noteEvent = function (type, id, reason) {
    var item = { type: type, id: id || "" };
    if (reason) item.reason = reason;
    this.audioEvents.push(item);
    if (this.audioEvents.length > 300) this.audioEvents.splice(0, this.audioEvents.length - 300);
  };
  AudioEngine.prototype.noteFallback = function (id, reason) {
    this.lastFallbackCue = id || "";
    this.fallbackIds.push(this.lastFallbackCue);
    if (this.fallbackIds.length > 100) this.fallbackIds.splice(0, this.fallbackIds.length - 100);
    this.noteEvent("fallback", id, reason);
  };
  AudioEngine.prototype.voiceFallback = function (id, reason) {
    this.noteEvent("synth-voice", id, reason);
    if (this.voiceEnabled && this.canPlayEffects()) this.radioStatic(.14);
  };
  AudioEngine.prototype.canPlayEffects = function () {
    return Boolean(this.musicEnabled || this.voiceEnabled);
  };
  AudioEngine.prototype.unlock = function () {
    if (qaFast || !this.canPlayEffects()) return null;
    this.unlocked = true;
    if (!this.context) {
      var Context = window.AudioContext || window.webkitAudioContext;
      if (Context) {
        try { this.context = new Context(); }
        catch (_) { this.context = null; }
        if (this.context) this.buildGraph();
      }
    }
    if (this.context && this.context.state === "suspended") {
      var resumed = this.context.resume();
      if (resumed && typeof resumed.catch === "function") resumed.catch(function () { /* A later gesture retries. */ });
    }
    if (this.musicEnabled && this.requestedCue && !this.musicPending && this.musicCue !== this.requestedCue) {
      this.playRecordedMusic(this.requestedCue, 2);
    }
    return this.context;
  };
  AudioEngine.prototype.ensure = AudioEngine.prototype.unlock;
  AudioEngine.prototype.buildGraph = function () {
    var context = this.context;
    this.masterGain = context.createGain();
    this.musicBus = context.createGain();
    this.effectsBus = context.createGain();
    this.reverb = context.createConvolver();
    this.reverbReturn = context.createGain();
    var limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -12;
    limiter.knee.value = 18;
    limiter.ratio.value = 5;
    limiter.attack.value = .008;
    limiter.release.value = .22;

    this.musicBus.gain.value = .72 * this.musicVolume * this.musicDuckFactor;
    this.effectsBus.gain.value = .43;
    this.reverbReturn.gain.value = .2;
    this.masterGain.gain.setValueAtTime(.0001, context.currentTime);
    this.masterGain.gain.exponentialRampToValueAtTime(this.volume, context.currentTime + .32);

    var impulseLength = Math.floor(context.sampleRate * 2.8);
    var impulse = context.createBuffer(2, impulseLength, context.sampleRate);
    for (var channel = 0; channel < impulse.numberOfChannels; channel += 1) {
      var data = impulse.getChannelData(channel);
      for (var index = 0; index < impulseLength; index += 1) {
        var decay = Math.pow(1 - index / impulseLength, 2.7);
        data[index] = (Math.random() * 2 - 1) * decay;
      }
    }
    this.reverb.buffer = impulse;
    this.musicBus.connect(this.masterGain);
    this.effectsBus.connect(this.masterGain);
    this.reverb.connect(this.reverbReturn).connect(this.musicBus);
    this.masterGain.connect(limiter).connect(context.destination);
  };
  AudioEngine.prototype.rampMediaVolume = function (element, target, seconds, onComplete) {
    if (!element) return;
    element.__fadeToken = (element.__fadeToken || 0) + 1;
    var token = element.__fadeToken;
    var startValue = Math.max(0, Math.min(1, Number(element.volume) || 0));
    var endValue = Math.max(0, Math.min(1, Number(target) || 0));
    var duration = Math.max(0, Number(seconds) || 0) * 1000;
    if (!duration || reducedMotion) {
      element.volume = endValue;
      if (typeof onComplete === "function") onComplete();
      return;
    }
    var startAt = performance.now();
    function step(now) {
      if (element.__fadeToken !== token) return;
      var progress = Math.max(0, Math.min(1, (now - startAt) / duration));
      element.volume = Math.max(0, Math.min(1, startValue + (endValue - startValue) * progress));
      if (progress < 1) window.requestAnimationFrame(step);
      else if (typeof onComplete === "function") onComplete();
    }
    window.requestAnimationFrame(step);
  };
  AudioEngine.prototype.baseMusicVolume = function (cue) {
    if (cue === "winter" || cue === "letter707") return .22;
    if (cue === "ending") return .28;
    if (cue === "summer") return .25;
    return .26;
  };
  AudioEngine.prototype.setMusicVolume = function (volume) {
    this.musicVolume = normalizeAudioVolume(volume, .5);
    this.noteEvent("music-volume", String(Math.round(this.musicVolume * 100)));
    var self = this;
    this.musicDecks.forEach(function (deck, index) {
      if (index !== self.activeMusicDeck || deck.paused || !deck.__baseVolume) return;
      self.rampMediaVolume(deck, deck.__baseVolume * self.musicVolume * self.musicDuckFactor, .08);
    });
    if (this.context && this.musicBus) {
      var now = this.context.currentTime;
      this.musicBus.gain.cancelScheduledValues(now);
      this.musicBus.gain.setValueAtTime(Math.max(.0001, this.musicBus.gain.value), now);
      this.musicBus.gain.exponentialRampToValueAtTime(Math.max(.0001, .72 * this.musicVolume * this.musicDuckFactor), now + .08);
    }
  };
  AudioEngine.prototype.setVoiceVolume = function (volume) {
    this.voiceVolume = normalizeAudioVolume(volume, 1);
    this.noteEvent("voice-volume", String(Math.round(this.voiceVolume * 100)));
    var element = this.voiceElement;
    var target = (Number(element.__baseVolume) || .92) * this.voiceVolume;
    element.volume = target;
  };
  AudioEngine.prototype.setMusicEnabled = function (enabled) {
    this.musicEnabled = Boolean(enabled);
    this.noteEvent("music-toggle", this.musicEnabled ? "on" : "off");
    if (!this.musicEnabled) {
      this.musicMediaToken += 1;
      this.musicPending = false;
      this.stopRecordedMusic(.18);
      this.stopSyntheticMusic(.18);
      return;
    }
    this.unlock();
    if (this.unlocked && this.requestedCue && !this.musicPending && this.musicCue !== this.requestedCue) this.playRecordedMusic(this.requestedCue, .45);
  };
  AudioEngine.prototype.setVoiceEnabled = function (enabled) {
    this.voiceEnabled = Boolean(enabled);
    this.noteEvent("voice-toggle", this.voiceEnabled ? "on" : "off");
    if (!this.voiceEnabled) this.stopVoice(.15);
    else this.unlock();
  };
  AudioEngine.prototype.setMusicCue = function (cue, fadeSeconds) {
    if (!Object.prototype.hasOwnProperty.call(AUDIO_MANIFEST.music, cue)) cue = "spring";
    this.requestedCue = cue;
    this.noteEvent("music-request", cue);
    if (!this.musicEnabled || qaFast || !this.unlocked) return;
    if (this.musicCue === cue && ((this.activeMusicDeck >= 0 && !this.musicDecks[this.activeMusicDeck].paused) || (this.musicTrack && this.musicTrack.active))) return;
    this.playRecordedMusic(cue, fadeSeconds);
  };
  AudioEngine.prototype.setSeason = function (season) {
    this.setMusicCue(season, 2);
  };
  AudioEngine.prototype.playRecordedMusic = function (cue, fadeSeconds) {
    var self = this;
    var filename = AUDIO_MANIFEST.music[cue];
    if (!this.musicEnabled || !filename || qaFast || !this.unlocked) return;
    if (this.failedMedia[filename]) {
      this.startSyntheticFallback(cue, fadeSeconds, "known-missing");
      return;
    }
    var token = ++this.musicMediaToken;
    var oldIndex = this.activeMusicDeck;
    var nextIndex = oldIndex === 0 ? 1 : 0;
    var nextDeck = this.musicDecks[nextIndex];
    var oldDeck = oldIndex >= 0 ? this.musicDecks[oldIndex] : null;
    var fade = Math.max(.05, Number(fadeSeconds) || 2);
    var settled = false;
    var timeout = 0;
    this.musicPending = true;
    nextDeck.__fadeToken += 1;
    nextDeck.pause();
    nextDeck.volume = 0;
    nextDeck.loop = cue === "title" || cue === "spring" || cue === "summer" || cue === "winter";
    nextDeck.__baseVolume = this.baseMusicVolume(cue);
    nextDeck.__cue = cue;
    nextDeck.__mediaToken = token;

    function cleanup() {
      if (timeout) window.clearTimeout(timeout);
      if (nextDeck.__mediaToken !== token) return;
      nextDeck.onplaying = null;
      nextDeck.onerror = null;
    }
    function fail(reason, permanent) {
      if (settled || token !== self.musicMediaToken || nextDeck.__mediaToken !== token) return;
      settled = true;
      cleanup();
      nextDeck.pause();
      self.musicPending = false;
      if (permanent) self.failedMedia[filename] = true;
      self.noteFallback(filename, reason || "media-error");
      self.startSyntheticFallback(cue, fade, reason || "media-error");
    }
    function started() {
      if (settled || token !== self.musicMediaToken || nextDeck.__mediaToken !== token) {
        if (nextDeck.__mediaToken === token) nextDeck.pause();
        return;
      }
      if (self.requestedCue !== cue || !self.musicEnabled) {
        settled = true;
        cleanup();
        nextDeck.pause();
        self.musicPending = false;
        return;
      }
      settled = true;
      cleanup();
      self.musicPending = false;
      self.activeMusicDeck = nextIndex;
      self.musicCue = cue;
      self.noteEvent("music-start", cue);
      self.rampMediaVolume(nextDeck, nextDeck.__baseVolume * self.musicVolume * self.musicDuckFactor, fade);
      if (oldDeck && oldDeck !== nextDeck) {
        self.rampMediaVolume(oldDeck, 0, fade, function () {
          if (self.activeMusicDeck !== oldIndex) oldDeck.pause();
        });
      }
      self.stopSyntheticMusic(fade);
    }
    nextDeck.onplaying = started;
    nextDeck.onerror = function () { fail("media-error", true); };
    try {
      nextDeck.src = AUDIO_ROOT + filename;
      nextDeck.load();
      var playback = nextDeck.play();
      if (playback && typeof playback.catch === "function") {
        playback.catch(function (error) {
          fail(error && error.name ? error.name : "play-rejected", false);
        });
      }
    } catch (error) {
      fail(error && error.name ? error.name : "play-exception", false);
    }
    if (!settled) timeout = window.setTimeout(function () { fail("load-timeout", false); }, 6000);
  };
  AudioEngine.prototype.stopRecordedMusic = function (fadeSeconds) {
    var self = this;
    this.activeMusicDeck = -1;
    this.musicCue = null;
    this.musicDecks.forEach(function (deck) {
      self.rampMediaVolume(deck, 0, fadeSeconds, function () { deck.pause(); });
    });
  };
  AudioEngine.prototype.stopSyntheticMusic = function (fadeSeconds) {
    var track = this.musicTrack;
    if (!track || !this.context) return;
    var now = this.context.currentTime;
    var fade = Math.max(.03, Number(fadeSeconds) || .15);
    track.active = false;
    if (track.timer) window.clearInterval(track.timer);
    track.gain.gain.cancelScheduledValues(now);
    track.gain.gain.setValueAtTime(Math.max(.0001, track.gain.gain.value), now);
    track.gain.gain.exponentialRampToValueAtTime(.0001, now + fade);
    this.musicTrack = null;
    window.setTimeout(function () {
      try { track.gain.disconnect(); }
      catch (_) { /* Already disconnected. */ }
    }, Math.ceil((fade + .1) * 1000));
  };
  AudioEngine.prototype.startSyntheticFallback = function (cue, fadeSeconds, reason) {
    var season = cue === "summer" ? "summer" : cue === "winter" || cue === "letter707" || cue === "ending" ? "winter" : "spring";
    this.noteEvent("synth-music", season, reason);
    this.stopRecordedMusic(fadeSeconds || .2);
    this.musicCue = cue;
    if (this.musicEnabled && this.context) this.transitionMusic(season, fadeSeconds);
  };
  AudioEngine.prototype.duckMusic = function (ducked, seconds) {
    this.musicDucked = Boolean(ducked);
    this.musicDuckFactor = this.musicDucked ? .3 : 1;
    this.noteEvent("duck", this.musicDucked ? "on" : "off");
    var fade = Math.max(.01, Number(seconds) || (this.musicDucked ? .3 : .8));
    var self = this;
    this.musicDecks.forEach(function (deck) {
      if (deck.paused || !deck.__baseVolume) return;
      self.rampMediaVolume(deck, deck.__baseVolume * self.musicVolume * self.musicDuckFactor, fade);
    });
    if (this.context && this.musicBus) {
      var now = this.context.currentTime;
      this.musicBus.gain.cancelScheduledValues(now);
      this.musicBus.gain.setValueAtTime(Math.max(.0001, this.musicBus.gain.value), now);
      this.musicBus.gain.exponentialRampToValueAtTime(Math.max(.0001, .72 * this.musicVolume * this.musicDuckFactor), now + fade);
    }
  };
  AudioEngine.prototype.playVoiceFile = function (filename, options) {
    options = options || {};
    var self = this;
    var cueId = options.id || filename || "";
    var silentFailure = Boolean(options.silentFailure);
    this.lastVoiceCue = cueId;
    this.noteEvent("voice-request", cueId);
    if (qaFast) return Promise.resolve({ ok: false, reason: "qa-fast", duration: 0, id: cueId });
    if ((!this.voiceEnabled && !options.allowWhenVoiceOff) || !filename) {
      var unavailableReason = this.voiceEnabled ? "missing-file" : "disabled";
      this.noteEvent("voice-skip", cueId, unavailableReason);
      if (this.voiceEnabled) {
        if (silentFailure) this.noteEvent("voice-silent", cueId, unavailableReason);
        else {
          this.noteFallback(filename || cueId, unavailableReason);
          this.voiceFallback(cueId, unavailableReason);
        }
      }
      return Promise.resolve({ ok: false, reason: unavailableReason, duration: 0, id: cueId });
    }
    if (this.failedMedia[filename]) {
      this.noteEvent("voice-skip", cueId, "known-missing");
      if (silentFailure) this.noteEvent("voice-silent", cueId, "known-missing");
      else {
        this.noteFallback(filename, "known-missing");
        this.voiceFallback(cueId, "known-missing");
      }
      return Promise.resolve({ ok: false, reason: "known-missing", duration: 0, id: cueId });
    }
    this.unlock();
    this.stopVoice(0);
    var token = ++this.voiceSerial;
    var element = this.voiceElement;
    var manageDuck = options.manageDuck !== false;
    var started = false;
    var settled = false;
    var startTimer = 0;
    var endTimer = 0;
    var duration = 0;
    element.__fadeToken += 1;
    element.pause();
    element.__baseVolume = typeof options.volume === "number" ? options.volume : .92;
    element.volume = element.__baseVolume * this.voiceVolume;
    this.activeVoiceCue = cueId;
    if (manageDuck) this.duckMusic(true, .3);

    return new Promise(function (resolve) {
      function cleanup() {
        if (startTimer) window.clearTimeout(startTimer);
        if (endTimer) window.clearTimeout(endTimer);
        if (!self.voicePending || self.voicePending.token !== token) return;
        element.onplaying = null;
        element.onended = null;
        element.onerror = null;
        self.voicePending = null;
        self.activeVoiceCue = null;
      }
      function finish(ok, reason, permanent) {
        if (settled) return;
        settled = true;
        if (!ok) element.pause();
        cleanup();
        if (permanent) self.failedMedia[filename] = true;
        if (!ok && reason !== "cancelled") {
          if (silentFailure) self.noteEvent("voice-silent", cueId, reason || "media-error");
          else {
            self.noteFallback(filename, reason || "media-error");
            self.voiceFallback(cueId, reason || "media-error");
          }
        }
        self.noteEvent(ok ? "voice-end" : "voice-stop", cueId, reason);
        if (manageDuck) self.duckMusic(false, .8);
        resolve({ ok: ok, reason: reason || "", duration: duration, id: cueId });
      }
      self.voicePending = {
        token: token,
        cancel: function (fadeSeconds) {
          var fade = Math.max(0, Number(fadeSeconds) || 0);
          if (!fade || element.paused) {
            element.pause();
            finish(false, "cancelled", false);
            return;
          }
          self.rampMediaVolume(element, 0, fade, function () {
            element.pause();
            finish(false, "cancelled", false);
          });
        }
      };
      element.onplaying = function () {
        if (token !== self.voiceSerial || settled) return;
        started = true;
        if (startTimer) window.clearTimeout(startTimer);
        duration = isFinite(element.duration) ? Number(element.duration) : 0;
        self.noteEvent("voice-start", cueId);
        if (typeof options.onStart === "function") options.onStart(duration);
        endTimer = window.setTimeout(function () { finish(false, "playback-timeout", false); }, Math.max(8000, (duration + 3) * 1000));
      };
      element.onended = function () { finish(true, "ended", false); };
      element.onerror = function () { finish(false, "media-error", true); };
      try {
        element.src = AUDIO_ROOT + filename;
        element.load();
        var playback = element.play();
        if (playback && typeof playback.catch === "function") {
          playback.catch(function (error) { finish(false, error && error.name ? error.name : "play-rejected", false); });
        }
      } catch (error) {
        finish(false, error && error.name ? error.name : "play-exception", false);
      }
      if (!settled) {
        startTimer = window.setTimeout(function () {
          if (!started) finish(false, "load-timeout", false);
        }, 5000);
      }
    });
  };
  AudioEngine.prototype.stopVoice = function (fadeSeconds) {
    if (this.voicePending && typeof this.voicePending.cancel === "function") {
      this.voicePending.cancel(fadeSeconds);
      return;
    }
    if (!this.voiceElement.paused) this.voiceElement.pause();
    this.activeVoiceCue = null;
  };
  AudioEngine.prototype.playJingle = function () {
    if (!this.canPlayEffects()) {
      this.noteEvent("voice-skip", "sfx-jingle", "disabled");
      return Promise.resolve({ ok: false, reason: "disabled", duration: 0, id: "sfx-jingle" });
    }
    if (!AUDIO_MANIFEST.jingle) {
      this.noteEvent("voice-request", "sfx-jingle");
      this.noteEvent("voice-skip", "sfx-jingle", "not-generated");
      return Promise.resolve({ ok: false, reason: "not-generated", duration: 0, id: "sfx-jingle" });
    }
    return this.playVoiceFile(AUDIO_MANIFEST.jingle, {
      id: "sfx-jingle",
      allowWhenVoiceOff: true,
      manageDuck: false,
      volume: .39
    });
  };
  AudioEngine.prototype.resumeWithStatic = function () {
    this.unlock();
    if (!this.canPlayEffects()) return;
    this.radioStatic(.25);
  };
  AudioEngine.prototype.transitionMusic = function (season, fadeSeconds) {
    var context = this.context;
    if (!context || !this.musicEnabled) return;
    if (this.musicTrack && this.musicTrack.season === season && this.musicTrack.active) return;
    var oldTrack = this.musicTrack;
    var nextTrack = this.createMusicTrack(season);
    var now = context.currentTime;
    var fade = Math.max(.05, Number(fadeSeconds) || 2);
    var target = season === "winter" ? .48 : season === "summer" ? .56 : .62;
    nextTrack.gain.gain.setValueAtTime(.0001, now);
    nextTrack.gain.gain.exponentialRampToValueAtTime(target, now + fade);
    this.musicTrack = nextTrack;

    if (!oldTrack) return;
    oldTrack.active = false;
    if (oldTrack.timer) window.clearInterval(oldTrack.timer);
    oldTrack.gain.gain.cancelScheduledValues(now);
    oldTrack.gain.gain.setValueAtTime(Math.max(.0001, oldTrack.gain.gain.value), now);
    oldTrack.gain.gain.exponentialRampToValueAtTime(.0001, now + fade);
    window.setTimeout(function () {
      try { oldTrack.gain.disconnect(); }
      catch (_) { /* Already disconnected. */ }
    }, Math.ceil((fade + .15) * 1000));
  };
  AudioEngine.prototype.createMusicTrack = function (season) {
    var context = this.context;
    var self = this;
    var track = {
      id: ++this.musicSerial,
      season: season,
      active: true,
      gain: context.createGain(),
      send: context.createGain(),
      timer: 0,
      loopDuration: season === "winter" ? 10 : season === "summer" ? 8 : 9.6,
      nextStart: context.currentTime + .06
    };
    track.send.gain.value = season === "winter" ? .58 : season === "spring" ? .28 : .18;
    track.gain.connect(this.musicBus);
    track.gain.connect(track.send).connect(this.reverb);

    function fillQueue() {
      if (!track.active) return;
      while (track.nextStart < context.currentTime + 1.25) {
        self.scheduleMusicLoop(track, track.nextStart);
        track.nextStart += track.loopDuration;
      }
    }
    fillQueue();
    track.timer = window.setInterval(fillQueue, 700);
    return track;
  };
  AudioEngine.prototype.schedulePiano = function (track, frequency, start, duration, volume) {
    var context = this.context;
    var envelope = context.createGain();
    var fundamental = context.createOscillator();
    var overtone = context.createOscillator();
    var end = start + duration;
    fundamental.type = "sine";
    overtone.type = "triangle";
    fundamental.frequency.setValueAtTime(frequency, start);
    overtone.frequency.setValueAtTime(frequency * 2.01, start);
    overtone.detune.value = -4;
    envelope.gain.setValueAtTime(.0001, start);
    envelope.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), start + .025);
    envelope.gain.exponentialRampToValueAtTime(Math.max(.0001, volume * .3), start + Math.min(.32, duration * .34));
    envelope.gain.exponentialRampToValueAtTime(.0001, end);
    fundamental.connect(envelope);
    var overtoneGain = context.createGain();
    overtoneGain.gain.value = .16;
    overtone.connect(overtoneGain).connect(envelope);
    envelope.connect(track.gain);
    fundamental.start(start);
    overtone.start(start);
    fundamental.stop(end + .04);
    overtone.stop(end + .04);
  };
  AudioEngine.prototype.schedulePercussion = function (track, start, volume) {
    var context = this.context;
    var length = Math.max(1, Math.floor(context.sampleRate * .055));
    var buffer = context.createBuffer(1, length, context.sampleRate);
    var data = buffer.getChannelData(0);
    for (var index = 0; index < length; index += 1) data[index] = (Math.random() * 2 - 1) * (1 - index / length);
    var source = context.createBufferSource();
    var filter = context.createBiquadFilter();
    var gain = context.createGain();
    source.buffer = buffer;
    filter.type = "highpass";
    filter.frequency.value = 2100;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(.0001, start + .052);
    source.connect(filter).connect(gain).connect(track.gain);
    source.start(start);
    source.stop(start + .06);
  };
  AudioEngine.prototype.scheduleMusicLoop = function (track, start) {
    var self = this;
    if (track.season === "spring") {
      var springChords = [
        [0, [261.63, 329.63, 392]],
        [2.4, [220, 261.63, 329.63]],
        [4.8, [174.61, 220, 261.63]],
        [7.2, [196, 246.94, 392]]
      ];
      springChords.forEach(function (chord) {
        chord[1].forEach(function (note, noteIndex) { self.schedulePiano(track, note, start + chord[0] + noteIndex * .065, 1.75, .082); });
      });
      return;
    }
    if (track.season === "summer") {
      var summerNotes = [261.63, 329.63, 392, 523.25, 440, 392, 329.63, 392];
      summerNotes.forEach(function (note, index) {
        self.schedulePiano(track, note, start + index, .78, index === 3 ? .095 : .073);
        self.schedulePercussion(track, start + index + .01, index % 2 ? .025 : .04);
      });
      return;
    }
    var winterNotes = [220, 329.63, 261.63, 164.81];
    winterNotes.forEach(function (note, index) { self.schedulePiano(track, note, start + index * 2.5, 2.25, index === 3 ? .075 : .063); });
  };
  AudioEngine.prototype.createEffectVoice = function (duration, peak, trackWeather, fadeIn, fadeOut) {
    var context = this.unlock();
    if (!context) return null;
    var now = context.currentTime;
    var total = Math.max(.08, Number(duration) || .3);
    var attack = Math.min(total * .35, Math.max(.015, Number(fadeIn) || .06));
    var release = Math.min(total * .42, Math.max(.03, Number(fadeOut) || .12));
    var voice = { group: context.createGain(), nodes: [], ended: false, duration: total };
    voice.group.gain.setValueAtTime(.0001, now);
    voice.group.gain.exponentialRampToValueAtTime(Math.max(.0002, peak || 1), now + attack);
    voice.group.gain.setValueAtTime(Math.max(.0002, peak || 1), Math.max(now + attack, now + total - release));
    voice.group.gain.exponentialRampToValueAtTime(.0001, now + total);
    voice.group.connect(this.effectsBus);
    if (trackWeather) this.weatherVoice = voice;
    var self = this;
    window.setTimeout(function () { self.cleanupEffectVoice(voice); }, Math.ceil((total + .12) * 1000));
    return voice;
  };
  AudioEngine.prototype.cleanupEffectVoice = function (voice) {
    if (!voice || voice.ended) return;
    voice.ended = true;
    if (this.weatherVoice === voice) this.weatherVoice = null;
    try { voice.group.disconnect(); }
    catch (_) { /* Already disconnected. */ }
  };
  AudioEngine.prototype.stopWeather = function (fadeSeconds) {
    var voice = this.weatherVoice;
    if (!voice || !this.context || voice.ended) return;
    this.weatherVoice = null;
    var now = this.context.currentTime;
    var fade = Math.max(.03, Number(fadeSeconds) || .12);
    voice.group.gain.cancelScheduledValues(now);
    voice.group.gain.setValueAtTime(Math.max(.0001, voice.group.gain.value), now);
    voice.group.gain.exponentialRampToValueAtTime(.0001, now + fade);
    voice.nodes.forEach(function (node) {
      if (typeof node.stop !== "function") return;
      try { node.stop(now + fade + .025); }
      catch (_) { /* The source may already have stopped. */ }
    });
    var self = this;
    window.setTimeout(function () { self.cleanupEffectVoice(voice); }, Math.ceil((fade + .08) * 1000));
  };
  AudioEngine.prototype.rawNoise = function (voice, start, duration, volume, filterType, startFrequency, endFrequency) {
    if (!voice || !this.context) return;
    var context = this.context;
    var length = Math.max(1, Math.floor(context.sampleRate * duration));
    var buffer = context.createBuffer(1, length, context.sampleRate);
    var data = buffer.getChannelData(0);
    for (var index = 0; index < length; index += 1) data[index] = Math.random() * 2 - 1;
    var source = context.createBufferSource();
    var filter = context.createBiquadFilter();
    var gain = context.createGain();
    source.buffer = buffer;
    filter.type = filterType || "lowpass";
    filter.frequency.setValueAtTime(startFrequency || 900, start);
    if (endFrequency) filter.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
    filter.Q.value = filterType === "bandpass" ? .8 : .25;
    gain.gain.value = Math.max(.0001, volume || .04);
    source.connect(filter).connect(gain).connect(voice.group);
    source.start(start);
    source.stop(start + duration + .025);
    voice.nodes.push(source);
  };
  AudioEngine.prototype.rawTone = function (voice, frequency, start, duration, volume, type, endFrequency) {
    if (!voice || !this.context) return;
    var context = this.context;
    var oscillator = context.createOscillator();
    var gain = context.createGain();
    var end = start + duration;
    oscillator.type = type || "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), end);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume || .03), start + Math.min(.055, duration * .22));
    gain.gain.exponentialRampToValueAtTime(.0001, end);
    oscillator.connect(gain).connect(voice.group);
    oscillator.start(start);
    oscillator.stop(end + .025);
    voice.nodes.push(oscillator);
  };
  AudioEngine.prototype.rawPiano = function (voice, frequency, start, duration, volume) {
    this.rawTone(voice, frequency, start, duration, volume, "sine");
    this.rawTone(voice, frequency * 2.01, start, duration * .72, volume * .16, "triangle");
  };
  AudioEngine.prototype.noise = function (duration, volume, filterType, frequency) {
    var context = this.unlock();
    if (!context) return;
    var total = Math.max(.08, Number(duration) || .3);
    var voice = this.createEffectVoice(total, 1, false, .025, .09);
    this.rawNoise(voice, context.currentTime, total, volume, filterType, frequency);
  };
  AudioEngine.prototype.tone = function (frequency, duration, volume, type, delayTime) {
    var context = this.unlock();
    if (!context) return;
    var delayValue = Math.max(0, Number(delayTime) || 0);
    var total = delayValue + Math.max(.08, Number(duration) || .3);
    var voice = this.createEffectVoice(total, 1, false, .02, .08);
    this.rawTone(voice, frequency, context.currentTime + delayValue, duration, volume, type);
  };
  AudioEngine.prototype.radioStatic = function (duration) {
    var context = this.unlock();
    if (!context) return;
    var total = Math.max(.12, Number(duration) || .3);
    var voice = this.createEffectVoice(total, .75, false, .018, .08);
    this.rawNoise(voice, context.currentTime, total, .055, "bandpass", 1850, 1350);
  };
  AudioEngine.prototype.paper = function () {
    var context = this.unlock();
    if (!context) return;
    var voice = this.createEffectVoice(.24, .42, false, .012, .11);
    this.rawNoise(voice, context.currentTime, .22, .038, "highpass", 2300, 4100);
    this.rawNoise(voice, context.currentTime + .035, .13, .018, "bandpass", 1250, 2200);
  };
  AudioEngine.prototype.stationIdent = function () {
    var context = this.unlock();
    if (!context) return;
    this.stopWeather(.06);
    var voice = this.createEffectVoice(2, .92, false, .025, .25);
    var start = context.currentTime;
    this.rawNoise(voice, start, 2, .027, "bandpass", 1900, 1250);
    this.rawPiano(voice, 523.25, start + .16, .62, .105);
    this.rawPiano(voice, 659.25, start + .57, .65, .11);
    this.rawPiano(voice, 783.99, start + .99, .78, .12);
  };
  AudioEngine.prototype.weather = function (card, durationMs) {
    var context = this.unlock();
    if (!context) return;
    this.stopWeather(.07);
    var duration = Math.max(.45, (Number(durationMs) || 2500) / 1000);
    var voice = this.createEffectVoice(duration, .94, true, .16, .3);
    var start = context.currentTime;
    if (card === "rain") {
      this.rawNoise(voice, start, duration, .115, "lowpass", 3600, 2100);
      for (var drop = .1; drop < duration - .08; drop += .16 + Math.random() * .24) {
        this.rawTone(voice, 1350 + Math.random() * 1500, start + drop, .045 + Math.random() * .045, .021, "sine", 760);
      }
    } else if (card === "wind") {
      this.rawNoise(voice, start, duration, .14, "bandpass", 330, 980);
      this.rawNoise(voice, start + duration * .2, duration * .72, .05, "lowpass", 760, 290);
    } else if (card === "thunder") {
      this.rawNoise(voice, start, duration, .22, "lowpass", 330, 95);
      this.rawTone(voice, 62, start + .035, Math.min(duration * .78, 1.65), .16, "sawtooth", 35);
      this.rawTone(voice, 48, start + Math.min(.42, duration * .18), Math.min(duration * .62, 1.4), .085, "sine", 29);
    } else if (card === "snow") {
      this.rawNoise(voice, start, duration, .018, "highpass", 4200, 6500);
      var snowNotes = [1174.66, 1318.51, 1567.98, 1046.5, 1760];
      for (var snowIndex = 0; snowIndex < snowNotes.length; snowIndex += 1) {
        var snowAt = start + .08 + snowIndex * Math.max(.035, (duration - .22) / snowNotes.length);
        this.rawTone(voice, snowNotes[snowIndex], snowAt, .36, .018, "sine");
      }
    } else if (card === "sun") {
      var chordDuration = Math.max(.35, Math.min(1.9, duration - .08));
      [261.63, 329.63, 392, 523.25].forEach(function (note, noteIndex) {
        this.rawPiano(voice, note, start + .055 + noteIndex * .045, chordDuration, noteIndex === 3 ? .052 : .065);
      }, this);
    } else if (card === "fog") {
      this.rawNoise(voice, start, duration, .033, "lowpass", 340, 210);
      this.rawTone(voice, 110, start, duration, .046, "sine", 104);
      this.rawTone(voice, 164.81, start + .08, Math.max(.3, duration - .08), .026, "sine", 155.56);
    }
  };
  AudioEngine.prototype.success = function () {
    var context = this.unlock();
    if (!context) return;
    this.stopWeather(.08);
    var voice = this.createEffectVoice(2, .92, false, .025, .3);
    var notes = [523.25, 659.25, 783.99, 1046.5];
    var starts = [0, .24, .5, .82];
    for (var index = 0; index < notes.length; index += 1) this.rawPiano(voice, notes[index], context.currentTime + starts[index], .92, index === 3 ? .112 : .092);
  };
  AudioEngine.prototype.failure = function () {
    var context = this.unlock();
    if (!context) return;
    this.stopWeather(.08);
    var voice = this.createEffectVoice(1.45, .78, false, .025, .28);
    this.rawPiano(voice, 392, context.currentTime + .06, .88, .075);
    this.rawPiano(voice, 329.63, context.currentTime + .42, .92, .068);
  };
  AudioEngine.prototype.endingSolo = function () {
    if (this.musicCue === "ending" && this.activeMusicDeck >= 0) return;
    var context = this.unlock();
    if (!context) return;
    var track = this.musicTrack;
    var now = context.currentTime;
    if (track) {
      track.active = false;
      if (track.timer) window.clearInterval(track.timer);
      track.gain.gain.cancelScheduledValues(now);
      track.gain.gain.setValueAtTime(Math.max(.0001, track.gain.gain.value), now);
      track.gain.gain.exponentialRampToValueAtTime(.0001, now + 2);
      window.setTimeout(function () {
        try { track.gain.disconnect(); }
        catch (_) { /* Already disconnected. */ }
      }, 2200);
      this.musicTrack = null;
    }
    var voice = this.createEffectVoice(4.2, .62, false, .35, 1.6);
    this.rawPiano(voice, 220, now + 1.25, 2.65, .07);
  };

  elements.soundToggle.addEventListener("click", function (event) {
    event.stopPropagation();
    var opening = elements.audioSettings.hidden;
    elements.audioSettings.hidden = !opening;
    elements.soundToggle.classList.toggle("is-open", opening);
    elements.soundToggle.setAttribute("aria-expanded", String(opening));
    if (opening) elements.musicToggle.focus();
  });
  elements.audioSettings.addEventListener("click", function (event) { event.stopPropagation(); });
  elements.musicToggle.addEventListener("click", function () {
    saveData.musicEnabled = !saveData.musicEnabled;
    audio.setMusicEnabled(saveData.musicEnabled);
    persistSave();
    updateAudioSettings();
  });
  elements.voiceToggle.addEventListener("click", function () {
    saveData.voiceEnabled = !saveData.voiceEnabled;
    audio.setVoiceEnabled(saveData.voiceEnabled);
    persistSave();
    updateAudioSettings();
  });
  elements.musicVolume.addEventListener("input", function () {
    saveData.musicVolume = normalizeAudioVolume(Number(elements.musicVolume.value) / 100, .5);
    audio.setMusicVolume(saveData.musicVolume);
    persistSave();
    updateAudioSettings();
  });
  elements.voiceVolume.addEventListener("input", function () {
    saveData.voiceVolume = normalizeAudioVolume(Number(elements.voiceVolume.value) / 100, 1);
    audio.setVoiceVolume(saveData.voiceVolume);
    persistSave();
    updateAudioSettings();
  });
  document.addEventListener("pointerdown", function (event) {
    if (!elements.audioSettings.hidden && !elements.audioSettings.contains(event.target) && event.target !== elements.soundToggle) closeAudioSettings();
    if (cardTooltipOwner && !cardTooltipOwner.contains(event.target)) hideCardTooltip(null, true);
  });
  window.addEventListener("resize", function () {
    if (cardTooltipOwner) positionCardTooltip(cardTooltipOwner);
    if (!elements.finalePhotoViewer.hidden && !isMobileLayout()) closeFinalePhotoViewer(false);
  });
  window.addEventListener("scroll", function () { hideCardTooltip(null, true); }, true);
  elements.radioButton.addEventListener("click", function () {
    var radioItem = STORY.chapters[0].booth.filter(function (item) { return item.id === "radio"; })[0];
    audio.radioStatic(.5);
    showModal(radioItem.name, radioItem.text, null, { kind: radioItem.id });
  });
  elements.drawerButton.addEventListener("click", toggleDrawer);
  elements.chapterScreen.addEventListener("click", function (event) {
    if (event.target.closest("#chapter-continue")) return;
    skipChapterIntroNarration();
  });
  elements.letterToggle.addEventListener("click", function () {
    var opening = !elements.letterCard.classList.contains("is-open");
    if (opening) {
      closeDrawer();
      hideCardTooltip(null, true);
    }
    elements.letterCard.classList.toggle("is-open", opening);
    if (opening) startLetterTypewriter();
    else finishLetterReading();
  });
  elements.letterCard.addEventListener("click", finishLetterReading);
  elements.letterCard.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") finishLetterReading();
  });
  elements.finalePhotoViewerBackdrop.addEventListener("click", function () { closeFinalePhotoViewer(true); });
  elements.finalePhotoViewerClose.addEventListener("click", function () { closeFinalePhotoViewer(true); });
  elements.finalePhotoViewerPrev.addEventListener("click", function () { switchFinalePhotoViewer(-1); });
  elements.finalePhotoViewerNext.addEventListener("click", function () { switchFinalePhotoViewer(1); });
  elements.modalPaper.addEventListener("click", function (event) {
    if (event.target.closest("button")) return;
    if (modalCeremonial) skipNarration(elements.modalText, .15);
  });
  elements.modalBackdrop.addEventListener("click", function () { closeModal(false); });
  elements.modalClose.addEventListener("click", function () { closeModal(false); });
  elements.modalContinue.addEventListener("click", function () { closeModal(true); });
  elements.hintButton.addEventListener("click", revealHint);
  elements.clearButton.addEventListener("click", resetAttempt);
  elements.broadcastButton.addEventListener("click", runBroadcast);
  elements.endingShare.addEventListener("click", function () { openShare(elements.endingScreen); });
  elements.endingRestart.addEventListener("click", function () {
    playToken += 1;
    clearSave();
    beginAt(0, true);
  });
  elements.shareClose.addEventListener("click", closeShare);
  elements.shareName.addEventListener("input", function () {
    var points = Array.from(elements.shareName.value);
    if (points.length > 8) elements.shareName.value = points.slice(0, 8).join("");
    updateShareState();
  });
  elements.shareGenerate.addEventListener("click", generateSharePoster);
  elements.posterSave.addEventListener("click", downloadSharePoster);
  elements.posterAgain.addEventListener("click", resetSharePoster);
  window.addEventListener("keydown", function (event) {
    if (!elements.finalePhotoViewer.hidden) {
      if (event.key === "Escape") closeFinalePhotoViewer(true);
      else if (event.key === "ArrowLeft") switchFinalePhotoViewer(-1);
      else if (event.key === "ArrowRight") switchFinalePhotoViewer(1);
      else return;
      event.preventDefault();
      return;
    }
    if (event.key !== "Escape") return;
    if (cardTooltipOwner) hideCardTooltip(null, true);
    else if (!elements.audioSettings.hidden) closeAudioSettings();
    else if (!elements.modal.hidden) closeModal(false);
    else if (!elements.shareScreen.hidden) closeShare();
    else { closeDrawer(); elements.letterCard.classList.remove("is-open"); }
  });

  var radioItem = STORY.chapters[0].booth.filter(function (item) { return item.id === "radio"; })[0];
  elements.soundToggle.setAttribute("aria-label", STORY.ui.audio_settings);
  elements.radioButton.setAttribute("aria-label", radioItem.name);
  setupShareCopy();
  initializeTitle();

  window.__SUNRAIN_DEBUG__ = {
    get levelId() { return currentNight && currentNight.id; },
    get schedule() { return schedule.slice(); },
    get completed() { return saveData.completed; },
    get playing() { return playing; },
    get guideStep() { return guideStep; },
    get failureCount() { return failureCount; },
    get hintCount() { return hintCount; },
    get endingPhase() { return endingPhase; },
    get endingLineIndex() { return endingLineIndex; },
    get endingLineHoldMs() { return endingLineHoldMs; },
    get chapterIntroActive() { return chapterIntroActive; },
    get chapterIntroSkipped() { return chapterIntroSkipped; },
    get chapterIntroDuration() { return chapterIntroDuration; },
    get chapterIntroAudioFile() { return chapterIntroAudioFile; },
    get modalVoiceFile() { return modalVoiceFile; },
    get musicCue() { return audio.musicCue || audio.requestedCue; },
    get musicEnabled() { return audio.musicEnabled; },
    get voiceEnabled() { return audio.voiceEnabled; },
    get musicVolume() { return audio.musicVolume; },
    get voiceVolume() { return audio.voiceVolume; },
    get finalePhotoMatches() { return Object.assign({}, finalePhotoMatches); },
    get finalePhotosComplete() {
      var photos = finalePhotosForCurrentNight();
      return Boolean(photos.length && photos.every(function (photo) { return finalePhotoMatches[photo.id]; }));
    },
    get finalePhotoViewerIndex() { return finalePhotoViewerIndex; },
    markFinalePhotoForStep: markFinalePhotoForStep,
    resetFinalePhotos: resetFinalePhotos,
    get voicePlaying() { return Boolean(audio.voicePending); },
    get activeVoiceCue() { return audio.activeVoiceCue; },
    get lastVoiceCue() { return audio.lastVoiceCue; },
    get musicDucked() { return audio.musicDucked; },
    get musicDuckFactor() { return audio.musicDuckFactor; },
    get audioEvents() { return audio.audioEvents.slice(); },
    get fallbackCount() { return audio.fallbackIds.length; },
    get fallbackIds() { return audio.fallbackIds.slice(); },
    get lastFallbackCue() { return audio.lastFallbackCue; },
    town: town
  };
})();
