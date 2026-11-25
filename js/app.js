// BäckerMat – State, Theken-UI, Avatar-Lebendigkeit, Chat, KI-Auswertung & Init

/* =========================================================================
   3. APPLICATION STATE & SCHICHT-/VARIANTEN-HELFER
   ========================================================================= */

const storedKey = localStorage.getItem('GEMINI_API_KEY') || localStorage.getItem('BAECKERMAT_GEMINI_KEY') || '';
function resolveInitialSilenceTimeoutMs() {
  try {
    const raw = Number(localStorage.getItem('GEMINI_SILENCE_TIMEOUT_MS'));
    if (raw === 600 || raw === 1000 || raw === 1400) return raw;
  } catch (e) {}
  return DEFAULT_SILENCE_TIMEOUT_MS;
}

function resolveInitialDifficultyMode() {
  try {
    const saved = localStorage.getItem('BAECKERMAT_DIFFICULTY');
    if (saved === 'practice' || saved === 'standard' || saved === 'master') return saved;
  } catch (e) {}
  return 'standard';
}

function pickRandomVariantIndex(scenario) {
  const variants = Array.isArray(scenario?.variants) ? scenario.variants : [];
  return variants.length > 0 ? Math.floor(Math.random() * variants.length) : 0;
}

function shuffleArray(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildShiftQueue(showAll = false) {
  if (showAll) {
    return CUSTOMER_SCENARIOS.map((sc, scenarioIndex) => ({
      scenarioIndex,
      variantIndex: pickRandomVariantIndex(sc)
    }));
  }

  const byArchetype = (type) => shuffleArray(
    CUSTOMER_SCENARIOS
      .map((sc, idx) => ({ sc, idx }))
      .filter(item => item.sc.archetype === type)
  );

  const classics = byArchetype('classic');
  const undecideds = byArchetype('undecided');
  const difficults = byArchetype('difficult');

  // Abwechslungsreiche 5er-Schicht: mindestens 1 Klassiker, 2 Unentschlossene, 2 Schwierige (oder 1+2+2)
  const picked = [
    classics[0],
    undecideds[0],
    difficults[0],
    undecideds[1],
    difficults[1] || classics[1]
  ].filter(Boolean);

  return shuffleArray(picked).map(({ sc, idx }) => ({
    scenarioIndex: idx,
    variantIndex: pickRandomVariantIndex(sc)
  }));
}

function resolveScenarioWithVariant(entry) {
  const safeEntry = entry || { scenarioIndex: 0, variantIndex: 0 };
  const base = CUSTOMER_SCENARIOS[safeEntry.scenarioIndex] || CUSTOMER_SCENARIOS[0];
  const variants = Array.isArray(base.variants) ? base.variants : [];
  const variant = variants[safeEntry.variantIndex] || variants[0] || {};
  const mergedOffline = {
    ...(base.offlineResponses || {}),
    ...(variant.variantOffline || {})
  };
  return {
    ...base,
    variantIndex: safeEntry.variantIndex || 0,
    variantLabel: variant.variantLabel || '',
    hiddenNeeds: variant.hiddenNeeds || base.hiddenNeeds || '',
    desiredPortions: variant.desiredPortions || base.desiredPortions || ['500g'],
    desiredCut: typeof variant.desiredCut === 'boolean' ? variant.desiredCut : Boolean(base.desiredCut),
    idealBreadId: variant.idealBreadId || base.idealBreadId,
    alternativeBreadId: variant.alternativeBreadId !== undefined ? variant.alternativeBreadId : (base.alternativeBreadId || null),
    trapBreadIds: variant.trapBreadIds || base.trapBreadIds || [],
    scienceEvaluation: variant.scienceEvaluation || base.scienceEvaluation || '',
    offlineResponses: mergedOffline
  };
}

function getQueueCustomers() {
  return (state.activeQueue || []).map(resolveScenarioWithVariant);
}

function getCurrentCustomer() {
  const queue = state.activeQueue || [];
  const entry = queue[state.currentCustomerIndex] || queue[0] || { scenarioIndex: 0, variantIndex: 0 };
  return resolveScenarioWithVariant(entry);
}

function formatSecondsDe(ms) {
  return (Math.max(100, ms) / 1000).toFixed(1).replace('.', ',') + 's';
}

function loadStoredModelArray(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(m => typeof m === 'string' && m.length > 0) : [];
  } catch (e) {
    return [];
  }
}

function applyOneTimeSpeedProfileMigration() {
  try {
    if (!localStorage.getItem('GEMINI_PERF_PROFILE_V2')) {
      const savedChat = localStorage.getItem('GEMINI_CHAT_MODEL');
      if (!savedChat || DEPRECATED_CHAT_MODELS.has(savedChat) || savedChat === 'gemini-3.8-flash') {
        localStorage.setItem('GEMINI_CHAT_MODEL', 'gemini-3.8-flash-lite');
      }
      localStorage.setItem('GEMINI_PERF_PROFILE_V2', '1');
    }
    if (!localStorage.getItem('GEMINI_VOICE_FIDELITY_V3')) {
      const savedTts = localStorage.getItem('GEMINI_TTS_MODEL');
      if (!savedTts || savedTts === 'gemini-3.8-flash-lite-tts' || savedTts === 'gemini-2.5-flash-preview-tts') {
        localStorage.setItem('GEMINI_TTS_MODEL', 'gemini-3.8-flash-tts');
      }
      localStorage.setItem('GEMINI_VOICE_FIDELITY_V3', '1');
    }
  } catch (e) {}
}
applyOneTimeSpeedProfileMigration();

function resolveInitialChatModel() {
  const saved = localStorage.getItem('GEMINI_CHAT_MODEL');
  if (!saved || DEPRECATED_CHAT_MODELS.has(saved)) {
    try {
      if (saved) localStorage.setItem('GEMINI_CHAT_MODEL', 'gemini-3.8-flash-lite');
    } catch (e) {}
    return 'gemini-3.8-flash-lite';
  }
  return saved;
}

let state = {
  currentCustomerIndex: 0,
  difficultyMode: resolveInitialDifficultyMode(),
  showAllCustomersInQueue: false,
  activeQueue: buildShiftQueue(false),
  evaluationSeq: 0,
  activeEvaluationAbortController: null,
  conversationStarted: false,
  handsFreeActive: false,       // Steuert den automatischen Freisprech-Kreislauf
  voiceOutputEnabled: true,     // Steuert die Sprachausgabe
  selectedBreadId: null,
  selectedPortion: '1000g',
  isSliced: false,
  score: 0,
  servedCustomersCount: 0,
  servedCustomerIds: new Set(),
  streak: 0,
  chatHistory: [],
  apiKey: storedKey,
  preferredModel: resolveInitialChatModel(),
  fastestEvalModel: null,
  ttsModel: localStorage.getItem('GEMINI_TTS_MODEL') || 'gemini-3.8-flash-tts',
  lockedConversationTtsModel: null,
  discoveredChatModels: loadStoredModelArray('GEMINI_DISCOVERED_CHAT_MODELS'),
  discoveredTtsModels: loadStoredModelArray('GEMINI_DISCOVERED_TTS_MODELS'),
  discoveredLiveModels: loadStoredModelArray('GEMINI_DISCOVERED_LIVE_MODELS'),
  modelsDiscoveredThisSession: false,
  ttsModelCooldowns: {},
  unavailableChatModels: new Set(),
  unavailableTtsModels: new Set(),
  unavailableLiveModels: new Set(),
  modelsWithoutThinking: new Set(),
  modelsWithoutTtsStream: new Set(),
  modelsWithoutSpeechMeta: new Set(),
  modelsWithoutLanguageCode: new Set(),
  liveModelsWithoutLanguageCode: new Set(),
  failedBrowserVoiceNames: new Set(),
  liveModeEnabled: localStorage.getItem('GEMINI_LIVE_MODE') !== 'false',
  liveUnavailableForSession: false,
  liveSession: null,
  silenceTimeoutMs: resolveInitialSilenceTimeoutMs(),
  ttsAudioCache: new Map(),
  ttsRequestSeq: 0,
  activeTtsAbortController: null,
  handsFreeResumeTimerId: null,
  isGenerating: false,
  isAiSpeaking: false,
  isListening: false,
  currentFilter: 'all',
  lastCustomerMessage: '',
  lastEvaluationSpokenText: '',
  activePlayingMessageId: null,
  // Web Audio API Nodes & <audio>-Fallback für rauschfreie TTS-Wiedergabe
  ttsAudioCtx: null,
  activeSourceNode: null,
  activeGainNode: null,
  activeAnalyserNode: null,
  activeAudioNodes: [],
  activeHtmlAudio: null,
  activeHtmlAudioUrl: null,
  _audioWarmedUp: false,
  _firstStreamPlayed: false,
  customerAngerCount: 0,
  pendingWalkoutReaction: null,
  preferHtmlAudioPlayback: (() => {
    try {
      return localStorage.getItem('baeckermat_prefer_html_audio') === '1';
    } catch (e) {
      return false;
    }
  })(),
  lastSpeechCancelAt: 0,
  activeUtterance: null,
  browserFallbackTimerId: null,
  browserStartWatchdogId: null,
  // Speech-to-Text Puffer & 1,0s Stille-Timer
  committedTranscriptBuffer: '',
  finalTranscriptBuffer: '',
  interimTranscriptBuffer: '',
  lastRecognizedTranscript: '',
  silenceTimerId: null,
  silenceCountdownRafId: null,
  silenceDeadline: 0,
  speechSessionSeq: 0,
  speechRecognitionStarted: false,
  speechStartWatchdogId: null,
  speechRestartTimerId: null,
  speechNetworkRetries: 0
};


/* =========================================================================
   5. AMBIENT FLOUR PARTICLES CANVAS (#flour-canvas)
   ========================================================================= */

function initFlourCanvas() {
  const canvas = document.getElementById('flour-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  for (let i = 0; i < 42; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.1 + 0.6,
      speedY: Math.random() * 0.35 + 0.12,
      speedX: (Math.random() - 0.5) * 0.22,
      opacity: Math.random() * 0.4 + 0.15
    });
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#fffdf7';
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.globalAlpha = p.opacity;
      ctx.fill();

      p.y -= p.speedY;
      p.x += p.speedX;
      if (p.y < -10) { p.y = height + 10; p.x = Math.random() * width; }
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(animate);
  }
  animate();
}


/* =========================================================================
   9. KUNDEN-WARTESCHLANGE, SCHICHT-GENERATOR & SCHWIERIGKEIT
   ========================================================================= */

function updateDifficultyButtonsUI() {
  const mapping = {
    practice: 'diffBtnPractice',
    standard: 'diffBtnStandard',
    master: 'diffBtnMaster'
  };
  Object.entries(mapping).forEach(([mode, id]) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    const active = state.difficultyMode === mode;
    btn.className = active
      ? 'diff-btn py-1 px-1.5 rounded-lg font-bold bg-amber-500 text-stone-950 transition-colors cursor-pointer'
      : 'diff-btn py-1 px-1.5 rounded-lg font-semibold text-stone-300 hover:text-stone-100 transition-colors cursor-pointer';
  });
}

function setDifficultyMode(mode) {
  if (mode !== 'practice' && mode !== 'standard' && mode !== 'master') return;
  state.difficultyMode = mode;
  try { localStorage.setItem('BAECKERMAT_DIFFICULTY', mode); } catch (e) {}
  sounds.playChime();
  updateDifficultyButtonsUI();
  renderQuickQuestionChips();
  const labels = {
    practice: 'Übungsmodus: Hilfreiche Rückfragen aktiv',
    standard: 'Standardmodus: Offene Einstiegsfragen, verdeckter Bedarf',
    master: 'Meisterprüfung: Freie Beratung ohne Vorgaben'
  };
  showToast(labels[mode]);
}

function shuffleNewShift() {
  state.activeQueue = buildShiftQueue(state.showAllCustomersInQueue);
  state.servedCustomerIds = new Set();
  state.servedCustomersCount = 0;
  sounds.playChime();
  updateScoreboard();
  loadCustomer(0);
  showToast('Neue Kunden-Schicht mit frischen Tageswünschen gemischt!');
}

function toggleShiftViewMode() {
  state.showAllCustomersInQueue = !state.showAllCustomersInQueue;
  state.activeQueue = buildShiftQueue(state.showAllCustomersInQueue);
  state.servedCustomerIds = new Set();
  state.servedCustomersCount = 0;
  sounds.playChime();
  updateScoreboard();
  loadCustomer(0);
  showToast(state.showAllCustomersInQueue ? 'Alle 9 Kunden-Avatare geladen' : '5er-Schicht (gemischt) aktiv');
}

function renderCustomerQueue() {
  const container = document.getElementById('customerQueueList');
  if (!container) return;
  container.innerHTML = '';

  const queueCustomers = getQueueCustomers();
  const countLabel = document.getElementById('queueCountLabel');
  const toggleBtn = document.getElementById('shiftViewToggleBtn');
  if (countLabel) {
    countLabel.textContent = state.showAllCustomersInQueue ? `Alle ${queueCustomers.length}` : `${queueCustomers.length}er-Schicht`;
  }
  if (toggleBtn) {
    toggleBtn.textContent = state.showAllCustomersInQueue ? '5er-Schicht' : `Alle (${CUSTOMER_SCENARIOS.length})`;
  }

  queueCustomers.forEach((cust, idx) => {
    const isActive = idx === state.currentCustomerIndex;
    const isServed = state.servedCustomerIds.has(cust.id);
    const archMeta = ARCHETYPE_META[cust.archetype] || ARCHETYPE_META.classic;
    const shortName = cust.name.replace(/\s*\(\d+\)\s*$/, '');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', String(isActive));
    btn.title = `${cust.name} (${archMeta.label})`;
    btn.className = `min-h-[34px] px-2.5 py-1 rounded-full text-left transition-all flex items-center gap-1.5 shrink-0 cursor-pointer text-[11px] ${
      isActive
        ? 'bg-amber-500/20 border border-amber-400/60 text-amber-100 font-semibold shadow-sm'
        : 'bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-stone-300'
    }`;

    btn.onclick = () => {
      if (idx !== state.currentCustomerIndex) {
        sounds.playChime();
        loadCustomer(idx);
      }
    };

    btn.innerHTML = `
      <span class="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9.5px] font-bold shrink-0 ${
        isActive ? 'bg-amber-400 text-stone-950' : 'bg-stone-800 text-stone-300'
      }">${idx + 1}</span>
      <span class="truncate max-w-[120px]">${shortName}</span>
      <span class="text-[10px] shrink-0 ${isServed ? 'text-emerald-400' : 'text-stone-500'}" aria-hidden="true">${isServed ? '✓' : ''}</span>
    `;

    container.appendChild(btn);
  });
}

function loadCustomer(index) {
  cancelActiveEvaluation();
  stopListening(true);
  stopLiveSession(true);
  stopCustomerAudio();
  state.liveUnavailableForSession = false;
  state.lockedConversationTtsModel = null;

  const queueLen = (state.activeQueue || []).length || 1;
  state.currentCustomerIndex = Math.max(0, Math.min(index, queueLen - 1));
  state.conversationStarted = false;
  state.handsFreeActive = false;
  state.customerAngerCount = 0;
  state.pendingWalkoutReaction = null;
  state.chatHistory = [];
  state.lastCustomerMessage = '';

  const customer = getCurrentCustomer();
  const profile = customerVoiceProfiles[customer.id] || customerVoiceProfiles.bergmann;
  const archMeta = ARCHETYPE_META[customer.archetype] || ARCHETYPE_META.classic;

  document.getElementById('customerName').textContent = customer.name;
  document.getElementById('customerTag').textContent = customer.tag;
  const archBadge = document.getElementById('customerArchetypeBadge');
  if (archBadge) {
    archBadge.textContent = archMeta.label;
    archBadge.className = `text-[10px] font-bold px-2 py-0.5 rounded-full border ${archMeta.badgeClass}`;
  }
  document.getElementById('customerSubtext').textContent = customer.counterObservation;
  const avatarContainer = document.getElementById('customerAvatarContainer');
  avatarContainer.setAttribute('data-archetype', customer.archetype || 'classic');
  if (typeof window !== 'undefined' && window.AvatarEngine && typeof window.AvatarEngine.mount === 'function') {
    window.AvatarEngine.mount(avatarContainer, customer);
  } else {
    avatarContainer.innerHTML = customer.avatarSvg;
  }
  document.getElementById('voiceProfilePill').textContent = `Stimme: ${profile.voiceName}`;

  updateHandsFreeButtonUI();
  updateDifficultyButtonsUI();
  updateTurnStatusUI('idle', 'Bereit für Freisprech-Dialog');
  renderCustomerQueue();
  renderQuickQuestionChips();
  renderWaitingCounterCard();
  updateScoreboard();

  if (!state.apiKey) {
    showChatNotice('info', 'Offline-Übungsmodus aktiv: Hinterlege oben rechts (⚙️) deinen Gemini API-Key für Studio-Stimmen, dynamische Persönlichkeiten und echte KI-Empathie-Auswertung.');
  } else {
    hideChatNotice();
  }
}

function resetCurrentCustomer() {
  loadCustomer(state.currentCustomerIndex);
  showToast('Kunde wurde an den Tresen zurückgesetzt.');
}

function renderWaitingCounterCard() {
  const chatContainer = document.getElementById('chatHistory');
  const customer = getCurrentCustomer();
  const profile = customerVoiceProfiles[customer.id] || customerVoiceProfiles.bergmann;

  chatContainer.innerHTML = `
    <div class="h-full flex flex-col items-center justify-center text-center p-5 rounded-2xl bg-stone-950/70 border border-white/10">
      <div class="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-400/35 flex items-center justify-center text-amber-400 text-xl mb-3">
        🎙️
      </div>
      <h3 class="font-serif text-base font-bold text-amber-100 mb-1">${customer.name} wartet an der Theke</h3>
      <p class="text-xs text-stone-300 max-w-xs leading-relaxed mb-4">
        Klicken Sie auf <strong class="text-amber-300">„Kundengespräch starten“</strong>. Finden Sie durch empathisches Nachfragen heraus, was der Kunde wirklich braucht (Stimme: <span class="font-mono text-amber-200">${profile.voiceName}</span>).
      </p>
      <button
        type="button"
        onclick="toggleHandsFreeConversation()"
        class="min-h-[46px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-stone-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
      >
        <span>🎙️</span>
        <span>Kundengespräch starten</span>
      </button>
    </div>
  `;
}

/* =========================================================================
   10. CHAT-VERLAUF & MULTI-TURN DIALOGLOGIK
   ========================================================================= */

function renderQuickQuestionChips() {
  const customer = getCurrentCustomer();
  const panel = document.getElementById('quickQuestionsPanel');
  const masterHint = document.getElementById('masterModeHint');
  const headerLabel = document.getElementById('quickQuestionsHeaderLabel');
  const questionsContainer = document.getElementById('quickQuestionsContainer');
  if (!questionsContainer) return;
  questionsContainer.innerHTML = '';

  if (state.difficultyMode === 'master') {
    panel?.classList.add('hidden');
    masterHint?.classList.remove('hidden');
    return;
  }

  panel?.classList.remove('hidden');
  masterHint?.classList.add('hidden');

  const items = state.difficultyMode === 'practice'
    ? (customer.quickQuestionsPractice || []).map(q => ({ text: q.text, response: q.response }))
    : STANDARD_DISCOVERY_QUESTIONS.map(text => ({ text, response: null }));

  if (headerLabel) {
    headerLabel.textContent = state.difficultyMode === 'practice'
      ? 'Hilfreiche Verkäufer-Rückfragen (Übung):'
      : 'Offene Gesprächseinstiege (Standard):';
  }

  items.forEach(q => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'min-h-[32px] text-[11px] px-3 py-1 rounded-full bg-white/[0.04] hover:bg-amber-500/15 border border-white/[0.08] hover:border-amber-400/45 text-stone-300 hover:text-amber-100 text-left transition-all active:scale-95 cursor-pointer';
    chip.textContent = q.text;
    chip.onclick = () => askQuickQuestion(q.text, q.response);
    questionsContainer.appendChild(chip);
  });
}

function showChatNotice(type, message, actions = []) {
  const banner = document.getElementById('chatNoticeBanner');
  if (!banner) return;
  banner.classList.remove('hidden');
  if (type === 'error') {
    banner.className = 'mb-2.5 px-3 py-2 rounded-xl text-[11px] leading-snug border bg-red-950/60 border-red-500/40 text-red-200 block shrink-0';
  } else {
    banner.className = 'mb-2.5 px-3 py-2 rounded-xl text-[11px] leading-snug border bg-amber-950/45 border-amber-500/35 text-amber-200 block shrink-0';
  }
  if (!Array.isArray(actions) || actions.length === 0) {
    banner.textContent = message;
    return;
  }
  banner.innerHTML = '';
  const textSpan = document.createElement('span');
  textSpan.textContent = message;
  banner.appendChild(textSpan);
  const btnRow = document.createElement('div');
  btnRow.className = 'flex flex-wrap gap-1.5 mt-1.5';
  for (const act of actions) {
    if (!act || !act.label || typeof act.onClick !== 'function') continue;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'px-2 py-0.5 rounded-lg bg-stone-900/80 hover:bg-stone-800 border border-white/15 text-[10px] font-semibold text-amber-100 cursor-pointer transition-colors';
    btn.textContent = act.label;
    btn.onclick = () => act.onClick();
    btnRow.appendChild(btn);
  }
  if (btnRow.children.length > 0) banner.appendChild(btnRow);
}

function hideChatNotice() {
  const banner = document.getElementById('chatNoticeBanner');
  if (banner) banner.classList.add('hidden');
}

function createMessageBubbleElements(sender, text) {
  const chatContainer = document.getElementById('chatHistory');
  const customer = getCurrentCustomer();

  const msgDiv = document.createElement('div');
  msgDiv.className = `flex flex-col ${sender === 'customer' ? 'items-start' : 'items-end'}`;

  const bubble = document.createElement('div');
  bubble.className = `max-w-[90%] rounded-2xl px-3.5 py-2.5 leading-relaxed text-xs shadow-sm ${
    sender === 'customer'
      ? 'bg-stone-800/95 text-stone-100 border border-white/10 rounded-tl-sm'
      : 'bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 font-semibold rounded-tr-sm'
  }`;
  bubble.textContent = text;

  const metaRow = document.createElement('div');
  metaRow.className = 'flex items-center gap-2 mt-1 px-1';

  const senderLabel = document.createElement('span');
  senderLabel.className = 'text-[10px] text-stone-400';
  senderLabel.textContent = sender === 'customer' ? customer.name : 'Azubi (Sie)';
  metaRow.appendChild(senderLabel);

  let playBtn = null;
  if (sender === 'customer') {
    const msgBtnId = `msg-play-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.id = msgBtnId;
    playBtn.className = 'msg-play-btn px-2 py-0.5 rounded-md bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-[10px] text-amber-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer';
    playBtn.innerHTML = '<span>🔊</span><span>Anhören</span>';
    playBtn.title = 'Diese Aussage erneut anhören';
    playBtn.onclick = () => {
      unlockAudioOnUserGesture();
      const spokenText = bubble.textContent || text;
      if (state.activePlayingMessageId === msgBtnId) {
        stopCustomerAudio();
        updateTurnStatusUI('idle', 'Wiedergabe gestoppt');
      } else {
        speakWithGeminiTTS(spokenText, customer.id, {
          messageId: msgBtnId,
          triggerHandsFreeNextTurn: state.handsFreeActive
        });
      }
    };
    metaRow.appendChild(playBtn);
  }

  msgDiv.appendChild(bubble);
  msgDiv.appendChild(metaRow);
  chatContainer.appendChild(msgDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  return { msgDiv, bubble, playBtn };
}

function appendChatMessage(sender, text) {
  state.chatHistory.push({ role: sender, text: text });
  return createMessageBubbleElements(sender, text);
}

function ensureConversationStartedBeforeReply(activateHandsFree = false) {
  if (!state.conversationStarted) {
    const customer = getCurrentCustomer();
    state.conversationStarted = true;
    if (activateHandsFree) state.handsFreeActive = true;
    state.chatHistory = [];
    document.getElementById('customerSubtext').textContent = customer.counterObservation;
    document.getElementById('chatHistory').innerHTML = '';
    updateHandsFreeButtonUI();
    appendChatMessage('customer', customer.initialGreeting);
    state.lastCustomerMessage = customer.initialGreeting;
  }
}

function askQuickQuestion(question, prebakedAnswer) {
  if (state.isGenerating) return;
  unlockAudioOnUserGesture();
  if (!state.liveSession) stopListening(true);
  ensureConversationStartedBeforeReply(false);

  const customer = getCurrentCustomer();
  appendChatMessage('apprentice', question);

  if (state.apiKey) {
    if (state.liveSession && sendLiveTextTurn(question)) return;
    requestGeminiResponse(question);
  } else if (prebakedAnswer) {
    appendChatMessage('customer', prebakedAnswer);
    state.lastCustomerMessage = prebakedAnswer;
    speakWithGeminiTTS(prebakedAnswer, customer.id, { triggerHandsFreeNextTurn: state.handsFreeActive });
  } else {
    generateOfflineResponse(question);
  }
}

function handleUserChatSubmit(e) {
  if (e) e.preventDefault();
  unlockAudioOnUserGesture();
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text || state.isGenerating) return;

  if (!state.liveSession) stopListening(true);
  input.value = '';
  submitApprenticeMessage(text);
}

function submitApprenticeMessage(text) {
  ensureConversationStartedBeforeReply(false);
  appendChatMessage('apprentice', text);

  if (typeof window !== 'undefined' && window.AvatarEngine && /(bitte|gerne|guten tag|mahlzeit|empfehle|verstehe|schauen wir|ruhe|natürlich|danke)/i.test(text || '')) {
    window.AvatarEngine.setMood('warm');
  }

  if (state.apiKey) {
    if (state.liveSession && sendLiveTextTurn(text)) return;
    requestGeminiResponse(text);
  } else {
    generateOfflineResponse(text);
  }
}

function showTypingIndicator(show) {
  const el = document.getElementById('chatTypingIndicator');
  if (!el) return;
  if (show) {
    el.classList.remove('hidden');
    el.classList.add('flex');
  } else {
    el.classList.add('hidden');
    el.classList.remove('flex');
  }
  const chatContainer = document.getElementById('chatHistory');
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function generateOfflineResponse(userPrompt) {
  showTypingIndicator(false);
  const customer = getCurrentCustomer();
  const lower = userPrompt.toLowerCase();
  const off = customer.offlineResponses || {};

  let reply = off.default || 'Können Sie mir da etwas Konkretes empfehlen?';
  let triggerWalkout = false;

  const isExtremeInsult = /(verpiss|hau ab|schnauze|fresse|arsch|idiot|blöd|dumm|halt die klappe|leck mich|raus hier|verzieh dich)/i.test(lower);
  const isMildRude = /(egal|pech|nerv|selber schuld|unverschämt|kauf halt|mir doch egal|keine lust)/i.test(lower);

  if (isExtremeInsult || isMildRude) {
    state.customerAngerCount = (state.customerAngerCount || 0) + (isExtremeInsult ? 2 : 1);
    window.AvatarEngine?.setMood('skeptical');
    if (state.customerAngerCount >= 2) {
      triggerWalkout = true;
      reply = customer.archetype === 'difficult'
        ? 'So lasse ich sicher nicht mit mir reden! Ich will hier kein Brot mehr und gehe zur Konkurrenz.'
        : 'Das wird mir jetzt wirklich zu unfreundlich. Ich möchte hier kein Brot mehr kaufen – auf Wiedersehen!';
    } else {
      reply = customer.archetype === 'difficult'
        ? 'Wie reden Sie denn bitte mit einem Kunden?! So sicher nicht – bleiben Sie mal sachlich!'
        : 'Entschuldigung, aber in dem Ton müssen Sie nun wirklich nicht mit mir sprechen.';
    }
  } else if (/(allerg|unverträglich|nuss|walnuss|laktose|milch|meiden|tabu)/.test(lower) && off.allergie) {
    reply = off.allergie;
  } else if (/(preis|teuer|euro|geld|backmischung|qualität|handwerk|rohstoff)/.test(lower) && off.preis) {
    reply = off.preis;
  } else if (/(anlass|abend|gäste|belag|essen|marmelade|käse|wein|frühstück|wg|training|sport|grill)/.test(lower) && off.anlass) {
    reply = off.anlass;
  } else if (/(hefe|sauerteig|backhefe)/.test(lower) && off.hefe) {
    reply = off.hefe;
  } else if (/(kruste|krume|weich|hart|zähne|zart|kern|geschmack|mild|kräftig|saaten)/.test(lower) && (off.kruste || off.geschmack)) {
    reply = off.kruste || off.geschmack;
  } else if (/(halt|frisch|woche|saftig)/.test(lower) && off.haltbar) {
    reply = off.haltbar;
  } else if (/(schnitt|schneid|scheib|am stück)/.test(lower) && off.schneiden) {
    reply = off.schneiden;
  } else if (/(eiweiß|protein|sport|training|kohlenhydrat)/.test(lower) && (off.eiweiss || off.anlass)) {
    reply = off.eiweiss || off.anlass;
  } else if (/(weizen|dinkel|magen|bläh|bauch)/.test(lower) && (off.weizen || off.dinkel || off.allergie)) {
    reply = off.weizen || off.dinkel || off.allergie;
  } else if (/(menge|gramm|groß|halb|leib|stange|ganz|personen|leute|haushalt)/.test(lower) && off.menge) {
    reply = off.menge;
  } else if (/(versteh|zeit|eil|kein problem|gerne|ruhig|schau|empfehl|erklär)/.test(lower) && (off.empathie || off.anlass || off.geschmack)) {
    reply = off.empathie ? `${off.empathie} ${off.anlass || off.geschmack || ''}`.trim() : (off.anlass || off.geschmack || off.default);
  }

  appendChatMessage('customer', reply);
  state.lastCustomerMessage = reply;
  if (triggerWalkout) {
    state.pendingWalkoutReaction = reply;
    state.handsFreeActive = false;
    updateHandsFreeButtonUI();
    speakWithGeminiTTS(reply, customer.id, { triggerHandsFreeNextTurn: false });
  } else {
    speakWithGeminiTTS(reply, customer.id, { triggerHandsFreeNextTurn: state.handsFreeActive });
  }
}

async function fetchWithRetry(url, options, maxRetries = 2) {
  let lastErr = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      if ((res.status === 429 || res.status >= 500) && attempt < maxRetries) {
        const retryAfter = Number(res.headers.get('retry-after'));
        const waitMs = (!Number.isNaN(retryAfter) && retryAfter > 0)
          ? Math.min(5000, retryAfter * 1000)
          : (450 * Math.pow(2, attempt));
        await new Promise(resolve => setTimeout(resolve, waitMs));
        continue;
      }
      return res;
    } catch (err) {
      clearTimeout(timeoutId);
      lastErr = err;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 450 * Math.pow(2, attempt)));
        continue;
      }
      throw lastErr;
    }
  }
  throw lastErr || new Error('Netzwerkfehler bei API-Anfrage');
}

function getChatCandidateModels() {
  const merged = [
    state.preferredModel || 'gemini-3.8-flash-lite',
    ...(state.discoveredChatModels || []),
    ...FALLBACK_CHAT_MODELS
  ];
  const unique = [];
  for (const m of merged) {
    if (m && !unique.includes(m) && !DEPRECATED_CHAT_MODELS.has(m) && !state.unavailableChatModels.has(m)) {
      unique.push(m);
    }
  }
  return unique.length > 0 ? unique : [...FALLBACK_CHAT_MODELS];
}

function extractNonThoughtText(data) {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts
    .filter(p => !p.thought && typeof p.text === 'string')
    .map(p => p.text)
    .join('');
}

async function streamOrReadChatResponse(response, onTextDelta) {
  // 1. Live SSE Stream (schnellste Darstellung im Chat)
  if (response.body && typeof response.body.getReader === 'function') {
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullText = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const jsonStr = trimmed.slice(5).trim();
        if (!jsonStr || jsonStr === '[DONE]') continue;
        try {
          const chunkData = JSON.parse(jsonStr);
          const delta = extractNonThoughtText(chunkData);
          if (delta) {
            fullText += delta;
            onTextDelta?.(fullText);
          }
        } catch (e) {}
      }
    }
    if (buffer.trim().startsWith('data:')) {
      const jsonStr = buffer.trim().slice(5).trim();
      if (jsonStr && jsonStr !== '[DONE]') {
        try {
          const chunkData = JSON.parse(jsonStr);
          const delta = extractNonThoughtText(chunkData);
          if (delta) {
            fullText += delta;
            onTextDelta?.(fullText);
          }
        } catch (e) {}
      }
    }
    return fullText.trim();
  }

  // 2. Fallback für Umgebungen ohne ReadableStream (z. B. Tests)
  if (typeof response.text === 'function') {
    const raw = await response.text();
    if (raw.includes('\ndata:') || raw.trim().startsWith('data:')) {
      let fullText = '';
      for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const jsonStr = trimmed.slice(5).trim();
        if (!jsonStr || jsonStr === '[DONE]') continue;
        try {
          fullText += extractNonThoughtText(JSON.parse(jsonStr));
        } catch (e) {}
      }
      if (fullText) {
        onTextDelta?.(fullText);
        return fullText.trim();
      }
    }
    const parsed = JSON.parse(raw);
    const text = extractNonThoughtText(parsed).trim();
    if (text) onTextDelta?.(text);
    return text;
  }

  const data = await response.json();
  const text = extractNonThoughtText(data).trim();
  if (text) onTextDelta?.(text);
  return text;
}

async function requestGeminiResponse(userPrompt) {
  state.isGenerating = true;
  showTypingIndicator(true);
  updateTurnStatusUI('loading', 'Kunde überlegt…');
  const customer = getCurrentCustomer();
  const profile = customerVoiceProfiles[customer.id] || customerVoiceProfiles.bergmann;

  const systemInstructionText = buildCustomerPersonaPrompt(customer, profile, false);

  const recentTurns = state.chatHistory.slice(-8).map(item => ({
    role: item.role === 'customer' ? 'model' : 'user',
    parts: [{ text: item.text }]
  }));

  const candidates = getChatCandidateModels();
  let streamBubbleObj = null;
  let lastError = null;
  let lastFailedModel = candidates[0];

  try {
    for (const model of candidates) {
      lastFailedModel = model;
      let thinkingLevelToTry = null;
      if (/gemini-3|gemini-4/i.test(model) && !state.modelsWithoutThinking.has(model)) {
        thinkingLevelToTry = model.includes('lite') ? 'minimal' : 'low';
      }

      for (let configAttempt = 0; configAttempt < 2; configAttempt++) {
        const generationConfig = {
          temperature: 0.75,
          maxOutputTokens: 150
        };
        if (thinkingLevelToTry) {
          generationConfig.thinkingConfig = { thinkingLevel: thinkingLevelToTry };
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${state.apiKey}`;
        const response = await fetchWithRetry(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: recentTurns,
            systemInstruction: { parts: [{ text: systemInstructionText }] },
            generationConfig
          })
        }, 1);

        if (!response.ok) {
          let errMsg = `HTTP ${response.status}`;
          try {
            const rawErr = typeof response.text === 'function' ? await response.text() : JSON.stringify(await response.json());
            const parsedErr = JSON.parse(rawErr);
            errMsg = parsedErr?.error?.message || errMsg;
          } catch (e) {}

          const lowerMsg = errMsg.toLowerCase();
          // Falls thinkingConfig / minimal vom Modell nicht unterstützt wird, sofort ohne thinkingConfig wiederholen
          if (response.status === 400 && thinkingLevelToTry && lowerMsg.includes('thinking')) {
            state.modelsWithoutThinking.add(model);
            thinkingLevelToTry = null;
            continue;
          }

          const err = new Error(errMsg);
          err.status = response.status;
          lastError = err;

          const isUnavailableModel =
            response.status === 404 ||
            (response.status === 400 && (
              lowerMsg.includes('no longer available') ||
              lowerMsg.includes('not found') ||
              lowerMsg.includes('not supported') ||
              lowerMsg.includes('deprecated')
            ));

          if (isUnavailableModel) {
            state.unavailableChatModels.add(model);
            break; // Direkt zum nächsten gültigen Chat-Modell wechseln
          }

          if (response.status === 429 || response.status >= 500) {
            break; // Nächstes Chat-Modell versuchen
          }

          throw err;
        }

        const chatContainer = document.getElementById('chatHistory');
        const generatedText = await streamOrReadChatResponse(response, (partialText) => {
          const preview = sanitizeSpokenText(partialText) || partialText.trim();
          if (!preview) return;
          if (!streamBubbleObj) {
            showTypingIndicator(false);
            streamBubbleObj = createMessageBubbleElements('customer', preview);
          } else {
            streamBubbleObj.bubble.textContent = preview;
            chatContainer.scrollTop = chatContainer.scrollHeight;
          }
        });

        if (!generatedText) {
          if (streamBubbleObj) {
            streamBubbleObj.msgDiv.remove();
            streamBubbleObj = null;
          }
          lastError = new Error('Leere Antwort vom Dialog-Modell erhalten.');
          break;
        }

        // Falls das Standardmodell veraltet war, direkt auf das funktionierende Modell migrieren
        if (model !== state.preferredModel && state.unavailableChatModels.has(state.preferredModel)) {
          state.preferredModel = model;
          try { localStorage.setItem('GEMINI_CHAT_MODEL', model); } catch (e) {}
        }

        showTypingIndicator(false);
        state.isGenerating = false;
        hideChatNotice();

        const cleanSpokenReply = sanitizeSpokenText(generatedText) || generatedText.trim();
        if (streamBubbleObj) {
          streamBubbleObj.bubble.textContent = cleanSpokenReply;
          state.chatHistory.push({ role: 'customer', text: cleanSpokenReply });
          chatContainer.scrollTop = chatContainer.scrollHeight;
        } else {
          appendChatMessage('customer', cleanSpokenReply);
        }
        state.lastCustomerMessage = cleanSpokenReply;

        const isWalkout = detectCustomerWalkout(generatedText, cleanSpokenReply);
        if (isWalkout) {
          state.pendingWalkoutReaction = cleanSpokenReply;
          state.handsFreeActive = false;
          updateHandsFreeButtonUI();
          window.AvatarEngine?.setMood('skeptical');
        }

        speakWithGeminiTTS(cleanSpokenReply, customer.id, {
          triggerHandsFreeNextTurn: isWalkout ? false : state.handsFreeActive
        });
        return;
      }
    }

    throw lastError || new Error('Kein verfügbares Dialog-Modell erreichbar.');

  } catch (err) {
    if (streamBubbleObj) {
      streamBubbleObj.msgDiv.remove();
    }
    console.warn('Gemini Chat Fehler:', err);
    showTypingIndicator(false);
    state.isGenerating = false;
    showChatNotice('error', `Dialog-API Fehler (${lastFailedModel}): ${err.message}. Nutze lokale Ersatzantwort.`);
    generateOfflineResponse(userPrompt);
  } finally {
    state.isGenerating = false;
    showTypingIndicator(false);
  }
}

/* =========================================================================
   11. BROTAUSLAGE (3D-TILT + SPECULAR GLARE + DYNAMISCHE FILTER)
   ========================================================================= */

function renderBreadCategoryFilters() {
  const container = document.getElementById('breadCategoryFilters');
  if (!container) return;
  container.innerHTML = '';

  BREAD_CATEGORIES.forEach(cat => {
    const count = cat.id === 'all'
      ? BREAD_DATABASE.length
      : BREAD_DATABASE.filter(b => b.category === cat.id).length;
    const isActive = state.currentFilter === cat.id;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', String(isActive));
    btn.className = `filter-btn min-h-[30px] px-3 py-1 rounded-full transition-all cursor-pointer shrink-0 text-[11px] ${
      isActive
        ? 'bg-amber-400 text-stone-950 font-bold shadow-sm'
        : 'bg-white/[0.04] hover:bg-white/[0.09] text-stone-300 font-medium border border-white/[0.07]'
    }`;
    btn.textContent = `${cat.label} (${count})`;
    btn.onclick = () => setBreadFilter(cat.id);
    container.appendChild(btn);
  });
}

function renderArtisanBreadSvg(bread) {
  const id = bread?.id || '';
  const crust = bread?.svgColor || '#92400e';
  const uid = `b_${id.replace(/[^a-z0-9]/gi, '')}`;

  const shapes = {
    reines_roggen: `
      <ellipse cx="60" cy="46" rx="44" ry="20" fill="url(#${uid}_grad)"/>
      <path d="M22 44 C30 22, 90 22, 98 44 C98 58, 82 64, 60 64 C38 64, 22 58, 22 44 Z" fill="url(#${uid}_grad)"/>
      <path d="M28 38 Q48 26 78 36 M36 50 Q58 36 86 48 M46 29 L52 54" stroke="#fef3c7" stroke-width="1.6" stroke-linecap="round" opacity="0.72"/>
      <ellipse cx="48" cy="31" rx="16" ry="5" fill="#fef3c7" opacity="0.22"/>
    `,
    paderborner_landbrot: `
      <path d="M18 36 L26 24 L96 24 L102 36 L100 60 L20 60 Z" fill="url(#${uid}_grad)"/>
      <path d="M24 26 Q60 19 94 26 L98 35 Q60 30 22 35 Z" fill="#451a03" opacity="0.88"/>
      <path d="M35 28 L42 33 M56 27 L63 33 M77 28 L84 33" stroke="#d97706" stroke-width="1.8" stroke-linecap="round" opacity="0.85"/>
      <path d="M20 40 L100 40" stroke="#78350f" stroke-width="1.4" opacity="0.5"/>
    `,
    kuerbiskern_vollkorn: `
      <path d="M16 46 C18 24, 38 17, 60 17 C82 17, 102 24, 104 46 C104 58, 88 63, 60 63 C32 63, 16 58, 16 46 Z" fill="url(#${uid}_grad)"/>
      <g fill="#4d7c0f" stroke="#ecfccb" stroke-width="0.6">
        <ellipse cx="38" cy="32" rx="4" ry="2.1" transform="rotate(-18 38 32)"/>
        <ellipse cx="52" cy="26" rx="4.2" ry="2.1" transform="rotate(14 52 26)"/>
        <ellipse cx="67" cy="27" rx="4" ry="2" transform="rotate(-12 67 27)"/>
        <ellipse cx="81" cy="33" rx="4.2" ry="2.1" transform="rotate(22 81 33)"/>
        <ellipse cx="46" cy="40" rx="4.1" ry="2.1" transform="rotate(8 46 40)"/>
        <ellipse cx="62" cy="37" rx="4" ry="2.1" transform="rotate(-24 62 37)"/>
        <ellipse cx="75" cy="43" rx="4.2" ry="2" transform="rotate(11 75 43)"/>
      </g>
    `,
    ur_dinkel_kruste: `
      <path d="M15 47 C16 25, 36 18, 60 18 C84 18, 104 25, 105 47 C105 58, 88 63, 60 63 C32 63, 15 58, 15 47 Z" fill="url(#${uid}_grad)"/>
      <path d="M32 30 Q60 22 89 44" stroke="#fef3c7" stroke-width="4.2" stroke-linecap="round" opacity="0.88"/>
      <path d="M34 31 Q60 24 87 44" stroke="#78350f" stroke-width="1.6" stroke-linecap="round"/>
      <ellipse cx="72" cy="28" rx="14" ry="4" fill="#fef3c7" opacity="0.24" transform="rotate(12 72 28)"/>
    `,
    walnuss_landbrot: `
      <path d="M20 46 C20 22, 40 16, 60 16 C80 16, 100 22, 100 46 C100 59, 84 64, 60 64 C36 64, 20 59, 20 46 Z" fill="url(#${uid}_grad)"/>
      <path d="M38 25 L82 47 M82 25 L38 47" stroke="#fef3c7" stroke-width="1.8" stroke-linecap="round" opacity="0.72"/>
      <g fill="#78350f" stroke="#fde68a" stroke-width="0.7">
        <circle cx="44" cy="36" r="3.4"/><circle cx="75" cy="37" r="3.4"/><circle cx="60" cy="27" r="3.2"/>
      </g>
    `,
    buttermilch_kruste: `
      <path d="M18 46 C19 23, 38 17, 60 17 C82 17, 101 23, 102 46 C102 58, 86 63, 60 63 C34 63, 18 58, 18 46 Z" fill="url(#${uid}_grad)"/>
      <path d="M40 28 C48 22, 72 22, 80 28" stroke="#fef3c7" stroke-width="2" stroke-linecap="round" opacity="0.55"/>
      <path d="M44 33 L76 47 M76 33 L44 47" stroke="#fde68a" stroke-width="2" stroke-linecap="round" opacity="0.8"/>
    `,
    baguette_tradition: `
      <g transform="rotate(-10 60 42)">
        <rect x="10" y="29" width="100" height="24" rx="12" fill="url(#${uid}_grad)"/>
        <path d="M24 33 L34 45 M40 32 L50 45 M56 32 L66 45 M72 32 L82 45 M88 33 L96 44" stroke="#fef3c7" stroke-width="2.6" stroke-linecap="round" opacity="0.9"/>
        <path d="M16 36 Q60 28 104 36" stroke="#fde68a" stroke-width="1.2" opacity="0.45"/>
      </g>
    `,
    ciabatta_olive: `
      <path d="M14 45 C14 31, 28 26, 60 26 C92 26, 106 31, 106 45 C106 56, 92 60, 60 60 C28 60, 14 56, 14 45 Z" fill="url(#${uid}_grad)"/>
      <ellipse cx="60" cy="36" rx="34" ry="8" fill="#fef3c7" opacity="0.28"/>
      <circle cx="38" cy="38" r="3" fill="#1c1917" stroke="#84cc16" stroke-width="1.1"/>
      <circle cx="62" cy="34" r="3" fill="#1c1917" stroke="#84cc16" stroke-width="1.1"/>
      <circle cx="82" cy="40" r="3" fill="#1c1917" stroke="#84cc16" stroke-width="1.1"/>
      <path d="M47 39 L53 33 M70 43 L76 36" stroke="#4d7c0f" stroke-width="1.8" stroke-linecap="round"/>
    `,
    krusten_mischbrot: `
      <path d="M16 46 C17 24, 37 17, 60 17 C83 17, 103 24, 104 46 C104 58, 87 63, 60 63 C33 63, 16 58, 16 46 Z" fill="url(#${uid}_grad)"/>
      <path d="M36 27 L52 49 M52 24 L68 49 M68 27 L84 48 M82 26 L42 47" stroke="#fef3c7" stroke-width="2" stroke-linecap="round" opacity="0.78"/>
    `,
    kraftkorn_protein: `
      <rect x="20" y="25" width="80" height="35" rx="9" fill="url(#${uid}_grad)"/>
      <path d="M22 31 Q60 20 98 31" fill="#29170a"/>
      <g fill="#fde68a" opacity="0.88">
        <circle cx="32" cy="33" r="1.4"/><circle cx="42" cy="29" r="1.5"/><circle cx="54" cy="32" r="1.4"/>
        <circle cx="66" cy="28" r="1.5"/><circle cx="78" cy="32" r="1.4"/><circle cx="88" cy="34" r="1.3"/>
        <ellipse cx="48" cy="39" rx="2.8" ry="1.4" fill="#65a30d"/>
        <ellipse cx="71" cy="38" rx="2.8" ry="1.4" fill="#65a30d"/>
      </g>
    `,
    hafer_vital: `
      <path d="M17 46 C18 24, 38 17, 60 17 C82 17, 102 24, 103 46 C103 58, 86 63, 60 63 C34 63, 17 58, 17 46 Z" fill="url(#${uid}_grad)"/>
      <g fill="#fef3c7" opacity="0.9">
        <ellipse cx="36" cy="32" rx="4" ry="2" transform="rotate(-22 36 32)"/>
        <ellipse cx="48" cy="26" rx="4.2" ry="2.2" transform="rotate(15 48 26)"/>
        <ellipse cx="62" cy="25" rx="4.2" ry="2" transform="rotate(-8 62 25)"/>
        <ellipse cx="76" cy="29" rx="4" ry="2.2" transform="rotate(24 76 29)"/>
        <ellipse cx="56" cy="35" rx="4.2" ry="2" transform="rotate(12 56 35)"/>
        <ellipse cx="70" cy="38" rx="3.8" ry="2" transform="rotate(-18 70 38)"/>
      </g>
    `
  };

  const innerShape = shapes[id] || shapes.krusten_mischbrot;
  return `
    <svg class="w-24 h-14 overflow-visible drop-shadow-[0_6px_8px_rgba(0,0,0,0.65)]" viewBox="0 0 120 78" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="${uid}_grad" x1="20" y1="16" x2="90" y2="66" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.32"/>
          <stop offset="35%" stop-color="${crust}"/>
          <stop offset="100%" stop-color="#291508"/>
        </linearGradient>
      </defs>
      <path d="M40 13c-2-4 2-7 0-10" stroke="#fcd34d" stroke-width="1.8" stroke-linecap="round" opacity="0.38" class="animate-steam-1"/>
      <path d="M74 12c-2-4 2-7 0-10" stroke="#fbbf24" stroke-width="1.8" stroke-linecap="round" opacity="0.32" class="animate-steam-2"/>
      <ellipse cx="60" cy="66" rx="43" ry="6.5" fill="rgba(0,0,0,0.52)"/>
      ${innerShape}
    </svg>
  `;
}

function renderBreadDisplay() {
  const grid = document.getElementById('breadGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const filteredBreads = state.currentFilter === 'all'
    ? BREAD_DATABASE
    : BREAD_DATABASE.filter(b => b.category === state.currentFilter);

  filteredBreads.forEach((bread, idx) => {
    const isSelected = state.selectedBreadId === bread.id;
    const card = document.createElement('div');
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-pressed', String(isSelected));
    card.className = `group bread-card-tilt flex flex-col justify-between min-h-fit cursor-pointer p-2.5 rounded-2xl transition-all duration-200 select-none focus:outline-none focus:ring-2 focus:ring-amber-400 ${
      isSelected
        ? 'bg-gradient-to-b from-amber-500/20 via-amber-950/60 to-stone-900/95 border border-amber-400 shadow-lg shadow-amber-500/20'
        : 'bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-amber-400/45 shadow-sm'
    }`;
    card.title = `${bread.name} (${bread.grainRatio}) – ${bread.doughMethod} · ${bread.shelfLife} · Allergene: ${bread.allergens}`;

    card.onclick = () => selectBread(bread.id);
    card.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectBread(bread.id);
      }
    };

    const colNormalized = (idx % 3) - 1; // -1 links, 0 mitte, +1 rechts
    card.addEventListener('mouseenter', () => {
      if (typeof window !== 'undefined' && window.AvatarEngine) {
        window.AvatarEngine.lookAtBread(colNormalized);
      }
    });

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;
      card.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015, 1.015, 1.015)`;

      const glare = card.querySelector('.card-glare');
      if (glare) {
        const pctX = (x / rect.width) * 100;
        const pctY = (y / rect.height) * 100;
        glare.style.background = `radial-gradient(circle at ${pctX}% ${pctY}%, rgba(251, 191, 36, 0.22), transparent 65%)`;
      }
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(700px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      if (typeof window !== 'undefined' && window.AvatarEngine) {
        window.AvatarEngine.lookAt(0, 0);
      }
    });

    card.innerHTML = `
      <div class="card-glare"></div>

      <div class="tilt-inner wicker-basket-tray relative flex items-center justify-center rounded-xl border border-amber-500/15 group-hover:border-amber-400/35 py-2.5 px-2 mb-2.5">
        <div class="parchment-sheet" aria-hidden="true"></div>
        <span class="absolute top-1.5 right-1.5 w-4 h-4 rounded-full border z-10 ${isSelected ? 'border-amber-400 bg-amber-400 text-stone-950' : 'border-white/15 bg-stone-950/80 text-transparent'} flex items-center justify-center text-[10px] font-bold transition-all">✓</span>
        <div class="relative z-10">${renderArtisanBreadSvg(bread)}</div>
      </div>

      <div class="tilt-inner min-w-0 px-0.5">
        <h4 class="font-serif font-bold text-xs text-stone-100 leading-snug mb-0.5">${bread.name}</h4>
        <div class="text-[10px] text-amber-300/90 font-mono truncate">${bread.grainRatio}</div>
      </div>

      <div class="tilt-inner slate-tag flex items-center justify-between gap-1.5 mt-2 px-2 py-1 rounded-lg text-[9.5px] text-stone-300">
        <span class="truncate text-stone-200 font-medium">${bread.tag}</span>
        <span class="shrink-0 text-stone-400" title="Allergene: ${bread.allergens}">⚠️ ${bread.allergens.split(',')[0]}</span>
      </div>
    `;

    grid.appendChild(card);
  });
}

function setBreadFilter(category) {
  state.currentFilter = category;
  sounds.playChime();
  renderBreadCategoryFilters();
  renderBreadDisplay();
}

function selectBread(breadId) {
  state.selectedBreadId = breadId;
  sounds.playChime();
  renderBreadDisplay();
  updatePortionAndSummaryDisplay();
}

/* =========================================================================
   12. PORTIONIERUNG (1000g / 500g / 250g) & SCHNEIDEMASCHINE
   ========================================================================= */

function setPortion(portion) {
  state.selectedPortion = portion;
  sounds.playChime();
  document.querySelectorAll('.portion-btn').forEach(btn => {
    btn.classList.remove('bg-amber-500', 'text-stone-950', 'font-bold', 'border-amber-300');
    btn.classList.add('bg-stone-800/90', 'text-stone-200', 'border-white/10');
  });

  const activeBtn = document.getElementById(`portion${portion}`);
  if (activeBtn) {
    activeBtn.classList.add('bg-amber-500', 'text-stone-950', 'font-bold', 'border-amber-300');
    activeBtn.classList.remove('bg-stone-800/90', 'text-stone-200', 'border-white/10');
  }
  updatePortionAndSummaryDisplay();
}

function setSliced(sliced) {
  state.isSliced = sliced;
  const cutWhole = document.getElementById('cutWhole');
  const cutSliced = document.getElementById('cutSliced');
  const machineIcon = document.getElementById('slicerMachineIcon');

  if (sliced) {
    sounds.playSlicer();
    cutSliced.classList.add('bg-amber-500', 'text-stone-950', 'font-bold', 'border-amber-300', 'animate-slice');
    cutSliced.classList.remove('bg-stone-800/90', 'text-stone-200', 'border-white/10');
    cutWhole.classList.remove('bg-amber-500', 'text-stone-950', 'font-bold', 'border-amber-300');
    cutWhole.classList.add('bg-stone-800/90', 'text-stone-200', 'border-white/10');
    machineIcon?.classList.add('animate-slice');
    setTimeout(() => {
      cutSliced.classList.remove('animate-slice');
      machineIcon?.classList.remove('animate-slice');
    }, 400);
  } else {
    sounds.playChime();
    cutWhole.classList.add('bg-amber-500', 'text-stone-950', 'font-bold', 'border-amber-300');
    cutWhole.classList.remove('bg-stone-800/90', 'text-stone-200', 'border-white/10');
    cutSliced.classList.remove('bg-amber-500', 'text-stone-950', 'font-bold', 'border-amber-300');
    cutSliced.classList.add('bg-stone-800/90', 'text-stone-200', 'border-white/10');
  }
  updatePortionAndSummaryDisplay();
}

function updatePortionAndSummaryDisplay() {
  const summaryText = document.getElementById('summaryText');
  const selectedBreadNameSmall = document.getElementById('selectedBreadNameSmall');
  const selectionDot = document.getElementById('selectionDot');
  const serveButton = document.getElementById('serveButton');
  const detailTitle = document.getElementById('selectedBreadDetailTitle');
  const detailDesc = document.getElementById('selectedBreadDetailDesc');
  const detailMeta = document.getElementById('selectedBreadDetailMeta');
  const detailPreview = document.getElementById('selectedBreadPreview');

  if (!state.selectedBreadId) {
    summaryText.textContent = 'Bitte zuerst ein Brot aus der Vitrine wählen';
    selectedBreadNameSmall.textContent = 'Kein Brot gewählt';
    selectionDot.className = 'w-2 h-2 rounded-full bg-stone-600';
    serveButton.disabled = true;
    if (detailTitle) detailTitle.textContent = 'Noch kein Brot aus der Auslage gewählt';
    if (detailDesc) detailDesc.textContent = 'Klicken Sie oben auf einen Brotkorb, um Teigführung, Frische, Merkmale & Allergene im Detail zu sehen.';
    if (detailMeta) detailMeta.textContent = '';
    if (detailPreview) detailPreview.innerHTML = '<span class="text-stone-500 text-xs">🥖</span>';
    return;
  }

  serveButton.disabled = false;
  const bread = BREAD_DATABASE.find(b => b.id === state.selectedBreadId);
  selectedBreadNameSmall.textContent = bread.name;
  selectionDot.className = 'w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400';

  if (detailTitle) detailTitle.textContent = `${bread.name} · ${bread.grainRatio}`;
  if (detailDesc) detailDesc.textContent = bread.description;
  if (detailMeta) detailMeta.textContent = `${bread.doughMethod} · Frische: ${bread.shelfLife} · ${bread.traits} · ⚠️ ${bread.allergens}`;
  if (detailPreview) detailPreview.innerHTML = renderArtisanBreadSvg(bread);
  if (typeof window !== 'undefined' && window.AvatarEngine) {
    window.AvatarEngine.lookAt(0, 0.45);
  }

  const cutLabel = state.isSliced ? 'geschnitten' : 'am Stück';
  summaryText.textContent = `${bread.name} • ${state.selectedPortion} • ${cutLabel}`;
}

/* =========================================================================
   13. GESELLENPRÜFUNGS- & KI-EMPATHIE-AUSWERTUNG (MEISTER-CHECK)
   ========================================================================= */

function cancelActiveEvaluation() {
  state.evaluationSeq += 1;
  if (state.activeEvaluationAbortController) {
    try { state.activeEvaluationAbortController.abort(); } catch (e) {}
    state.activeEvaluationAbortController = null;
  }
}

function clampScore(val, min, max) {
  const n = Math.round(Number(val));
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function evaluateTechnicalDelivery(customer, chosenBread) {
  const idealBread = BREAD_DATABASE.find(b => b.id === customer.idealBreadId);
  const isTrap = Array.isArray(customer.trapBreadIds) && customer.trapBreadIds.includes(chosenBread.id);

  let breadScore = 3;
  let breadVerdict = 'Unpassend (+3 ★)';
  if (chosenBread.id === customer.idealBreadId) {
    breadScore = 25;
    breadVerdict = 'Ideal (+25 ★)';
  } else if (chosenBread.id === customer.alternativeBreadId) {
    breadScore = 12;
    breadVerdict = 'Alternative (+12 ★)';
  } else if (isTrap) {
    breadScore = 0;
    breadVerdict = 'Fehlgriff (+0 ★)';
  }

  const portionMatch = customer.desiredPortions.includes(state.selectedPortion);
  const portionScore = portionMatch ? 15 : 3;
  const portionVerdict = portionMatch ? `${state.selectedPortion} (+15 ★)` : `Falsch (+3 ★)`;

  const cutMatch = state.isSliced === customer.desiredCut;
  const cutScore = cutMatch ? 10 : 0;
  const cutVerdict = cutMatch ? 'Exakt (+10 ★)' : 'Falsch (+0 ★)';

  return {
    breadScore,
    breadVerdict,
    portionScore,
    portionVerdict,
    cutScore,
    cutVerdict,
    isTrap,
    idealBreadName: idealBread ? idealBread.name : customer.idealBreadId,
    technicalTotal: breadScore + portionScore + cutScore
  };
}

function parseEvaluationJson(rawText) {
  if (!rawText) return null;
  const cleaned = rawText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch (err) {}
    }
  }
  return null;
}

function detectCustomerWalkout(rawText, cleanText = '') {
  const raw = String(rawText || '');
  const clean = String(cleanText || '');
  if (/\[ABBRUCH\]/i.test(raw)) return true;
  return /(kein brot mehr|kaufe? (hier )?nicht(s)? mehr|geh(e)? (jetzt )?(woanders|wieder)|anderen bäcker|such(e)? mir einen anderen|verlasse? den laden|ohne brot|behalt(en)? sie ihr brot|das reicht mir.*(geh|woanders|nicht mehr)|ich gehe jetzt)/i.test(clean);
}

function evaluateDialogueOfflineHeuristic(customer, chosenBread, techResult, walkoutReaction = '') {
  const apprenticeMsgs = state.chatHistory
    .filter(m => m.role === 'apprentice')
    .map(m => m.text.trim())
    .filter(Boolean);
  const isAborted = Boolean(techResult?.abortedByCustomer);

  if (apprenticeMsgs.length === 0) {
    const silentClosing = customer.archetype === 'difficult'
      ? 'Wortlos ein Brot hinlegen? Das nenne ich nicht gerade kundenfreundliche Beratung!'
      : 'Oh, Sie haben gar nichts gefragt… ich hoffe, das passt trotzdem ungefähr.';
    return {
      source: 'no_dialogue',
      empathyScore: 0,
      deescalationScore: 0,
      needsAnalysisScore: 0,
      expertiseScore: 0,
      sympathyVerdict: 'Kein Gespräch geführt',
      strengths: ['Auswahl an der Theke wurde direkt übergeben.'],
      weaknesses: [
        'Keine Begrüßung und kein Beratungsgespräch vor der Übergabe geführt.',
        'Weder Anlass, Verträglichkeiten, Krume/Kruste noch gewünschte Menge/Schnitt erfragt.'
      ],
      improvementTip: 'Begrüßen Sie den Kunden freundlich und stellen Sie mindestens 2–3 gezielte Fragen zu Anlass, Verträglichkeit, Menge und Schnitt.',
      closingReaction: silentClosing
    };
  }

  const combined = apprenticeMsgs.join(' ').toLowerCase();
  const questionCount = (combined.match(/\?/g) || []).length;

  // 1. Empathie & Sympathie (0–15)
  const empathyHits = [
    'guten tag', 'hallo', 'mahlzeit', 'willkommen', 'gerne', 'sehr gern',
    'verstehe', 'verständlich', 'kein problem', 'natürlich', 'schauen wir',
    'helfe', 'empfehle', 'bitte', 'danke', 'tut mir leid', 'ruhe', 'ihnen'
  ].filter(w => combined.includes(w)).length;
  const rudeHits = [
    'egal', 'pech', 'nerv', 'selber schuld', 'halt die', 'blöd', 'dumm',
    'unverschämt', 'beeil', 'kauf halt', 'keine zeit', 'mir doch',
    'verpiss', 'hau ab', 'schnauze', 'fresse', 'arsch', 'idiot', 'klappe'
  ].filter(w => combined.includes(w)).length;

  let empathyScore = Math.min(15, 4 + empathyHits * 2 + (apprenticeMsgs.length >= 2 ? 2 : 0) - rudeHits * 6);
  empathyScore = clampScore(isAborted ? Math.min(2, empathyScore) : empathyScore, 0, 15);

  // 2. Deeskalation & Souveränität (0–10)
  let deescalationScore = customer.archetype === 'difficult'
    ? clampScore(3 + empathyHits * 1.5 + (apprenticeMsgs.length >= 2 ? 2 : 0) - rudeHits * 5, 0, 10)
    : clampScore(5 + Math.min(3, empathyHits) + (apprenticeMsgs.length >= 2 ? 2 : 0) - rudeHits * 5, 0, 10);
  if (isAborted) {
    deescalationScore = clampScore(Math.min(1, deescalationScore), 0, 10);
  }

  // 3. Bedarfsanalyse & Fragetechnik (0–15)
  const topicDefinitions = [
    { label: 'Anlass/Belag', rx: /(anlass|abend|essen|belag|käse|wein|grill|frühstück|sport|gäste|für wen)/ },
    { label: 'Allergien/Verträglichkeit', rx: /(allerg|unverträglich|nuss|walnuss|laktose|milch|hefe|weizen|bläh|magen|zähne|hart)/ },
    { label: 'Kruste/Krume/Geschmack', rx: /(geschmack|mild|kräftig|kruste|krume|weich|kern|saaten)/ },
    { label: 'Menge/Portion', rx: /(menge|gramm|groß|halb|ganz|personen|leute|haushalt|allein)/ },
    { label: 'Schnittart', rx: /(schnitt|schneid|scheib|am stück)/ }
  ];
  const coveredLabels = topicDefinitions.filter(t => t.rx.test(combined)).map(t => t.label);
  const missingLabels = topicDefinitions.filter(t => !t.rx.test(combined)).map(t => t.label);
  const coveredTopics = coveredLabels.length;

  const needsAnalysisScore = clampScore(
    Math.min(15, coveredTopics * 2.5 + Math.min(3, questionCount) * 1.2 + (apprenticeMsgs.length >= 3 ? 1.5 : 0)),
    0,
    15
  );

  // 4. Fachberatung & Verständlichkeit (0–10)
  const fachKeywords = [
    'sauerteig', 'teigführung', 'langzeit', 'frisch', 'saftig', 'mild', 'bekömmlich',
    'krume', 'kruste', 'protein', 'eiweiß', 'dinkel', 'roggen', 'hafer', 'ohne hefe', 'ohne weizen'
  ].filter(w => combined.includes(w));
  const expertiseScore = clampScore(2 + fachKeywords.length * 2 + (!isAborted && techResult.breadScore >= 12 ? 2 : 0), 0, 10);

  const dialogueSum = empathyScore + deescalationScore + needsAnalysisScore + expertiseScore;
  let sympathyVerdict = 'Freundlich & ordentlich';
  if (isAborted) sympathyVerdict = 'Kunde verärgert vergrault';
  else if (rudeHits > 0) sympathyVerdict = 'Schroff / Unfreundlich';
  else if (dialogueSum >= 40) sympathyVerdict = customer.archetype === 'difficult' ? 'Skeptiker souverän überzeugt' : 'Herzlich & einfühlsam';
  else if (dialogueSum < 22) sympathyVerdict = 'Zu knapp & distanziert';

  const strengths = [];
  if (empathyScore >= 10 && rudeHits === 0 && !isAborted) {
    strengths.push('Freundlicher, respektvoller Umgangston am Tresen.');
  }
  if (coveredLabels.length > 0) {
    strengths.push(`Gezielt nach ${coveredLabels.slice(0, 3).join(', ')} gefragt.`);
  }
  if (fachKeywords.length >= 1) {
    strengths.push(`Fachbegriffe sinnvoll eingebracht (${fachKeywords.slice(0, 3).join(', ')}).`);
  }
  if (!isAborted && techResult.breadScore >= 25) {
    strengths.push(`Mit ${chosenBread.name} das optimale Brot passend zum Bedarf gewählt.`);
  }
  if (strengths.length === 0) {
    strengths.push('Gespräch mit dem Kunden an der Theke begonnen.');
  }

  const weaknesses = [];
  if (isAborted) {
    weaknesses.push('Der Kunde wurde durch den Tonfall so verärgert, dass er den Kauf vor der Übergabe abgebrochen hat.');
  } else if (rudeHits > 0) {
    weaknesses.push('Ungeduldige oder unfreundliche Formulierungen haben Vertrauen gekostet.');
  }
  if (missingLabels.length > 0) {
    weaknesses.push(`Nicht erfragt: ${missingLabels.slice(0, 3).join(', ')}.`);
  }
  if (fachKeywords.length === 0) {
    weaknesses.push('Kaum fachliche Begründung (z. B. Teigführung, Kruste/Krume, Verträglichkeit) genannt.');
  }
  if (!isAborted && chosenBread) {
    if (techResult.isTrap) {
      weaknesses.push(`Fehlgriff: ${chosenBread.name} widerspricht dem Bedarf/Allergien (optimal: ${techResult.idealBreadName}).`);
    } else if (techResult.breadScore < 25) {
      weaknesses.push(`Brotwahl (${chosenBread.name}) war nicht optimal – besser gepasst hätte ${techResult.idealBreadName}.`);
    }
    if (techResult.portionScore < 15) {
      weaknesses.push(`Portion (${state.selectedPortion}) passte nicht zum Wunsch (${customer.desiredPortions.join(' oder ')}).`);
    }
    if (techResult.cutScore < 10) {
      weaknesses.push(`Schnittart nicht getroffen (gewünscht: ${customer.desiredCut ? 'geschnitten' : 'am Stück'}).`);
    }
  }
  if (weaknesses.length === 0) {
    weaknesses.push('Keine wesentlichen Schwächen – nur noch kleine Genusstipps ergänzbar.');
  }

  let improvementTip = '';
  if (isAborted || rudeHits > 0) {
    improvementTip = 'Auch unter Stress oder bei schwierigen Kunden ruhig, respektvoll und lösungsorientiert bleiben – niemals patzig reagieren.';
  } else if (missingLabels.length >= 2) {
    improvementTip = `Vor dem Griff ins Regal konkret nach ${missingLabels.slice(0, 3).join(' und ')} fragen, damit das Brot punktgenau passt.`;
  } else if (fachKeywords.length < 2) {
    improvementTip = 'Begründen Sie Ihre Empfehlung kurz mit einem Back-Argument (z. B. Langzeitführung, mildes Aroma, leichte Bekömmlichkeit).';
  } else {
    improvementTip = 'Sehr rundes Gespräch! Für die Bestnote zusätzlich einen kurzen Lagerungs- oder Genusshinweis geben.';
  }

  const overallScore = techResult.technicalTotal + dialogueSum;
  let closingReaction = '';
  if (isAborted) {
    closingReaction = walkoutReaction || 'Ich kaufe hier kein Brot mehr – auf Wiedersehen!';
  } else if (rudeHits > 0) {
    closingReaction = 'Mit diesem Tonfall vergraulen Sie die Kundschaft – hier kaufe ich so schnell nicht mehr ein.';
  } else if (overallScore >= 80) {
    closingReaction = customer.archetype === 'difficult'
      ? 'Hut ab, Sie bleiben ruhig und verstehen Ihr Handwerk. Das nehme ich gerne mit!'
      : 'Ganz herzlichen Dank für die einfühlsame Beratung! Genau so habe ich es mir gewünscht.';
  } else if (techResult.isTrap) {
    closingReaction = `Moment mal, mit dem ${chosenBread.name} habe ich wegen meiner Verträglichkeit oder Wünsche ein echtes Problem!`;
  } else if (overallScore >= 55) {
    closingReaction = 'Vielen Dank für Ihre Mühe, das passt schon ganz gut – beim nächsten Mal gerne noch etwas genauer nachfragen.';
  } else {
    closingReaction = 'Hmm, leider trifft das weder richtig meinen Bedarf noch fühlte ich mich gut beraten.';
  }

  return {
    source: 'heuristic',
    empathyScore,
    deescalationScore,
    needsAnalysisScore,
    expertiseScore,
    sympathyVerdict,
    strengths: strengths.slice(0, 3),
    weaknesses: weaknesses.slice(0, 3),
    improvementTip,
    closingReaction
  };
}

async function evaluateDialogueWithGemini(customer, chosenBread, techResult, signal, walkoutReaction = '') {
  const transcript = state.chatHistory
    .slice(-8)
    .map(m => `${m.role === 'customer' ? customer.name : 'Azubi'}: ${m.text}`)
    .join('\n');
  const archMeta = ARCHETYPE_META[customer.archetype] || ARCHETYPE_META.classic;
  const cutChosenText = state.isSliced ? 'geschnitten' : 'am Stück';
  const cutDesiredText = customer.desiredCut ? 'geschnitten' : 'am Stück';
  const isAborted = Boolean(techResult?.abortedByCustomer);

  const deliveryBlock = isAborted
    ? `- Status: GESPRÄCHSABBRUCH DURCH KUNDE – der Kunde hat verärgert abgebrochen und will kein Brot mehr kaufen ("${walkoutReaction || 'Abbruch'}").`
    : `- Gewähltes Brot: ${chosenBread.name} (${techResult.breadVerdict})
- Gewählte Portion: ${state.selectedPortion} (${techResult.portionVerdict})
- Gewählter Schnitt: ${cutChosenText} (${techResult.cutVerdict})
- Allergie-/Bedarfsfalle ausgelöst: ${techResult.isTrap ? 'JA (kritischer Fehlgriff!)' : 'Nein'}`;

  const evalPrompt = `Bewerte als Bäckermeister-Prüfer dieses Thekengespräch als valides JSON.

Kunde: ${customer.name} (${customer.tag}, ${archMeta.label})
Bedarf: ${customer.hiddenNeeds} | Optimal: ${techResult.idealBreadName}, ${customer.desiredPortions.join('/')}, ${cutDesiredText}
Ergebnis:
${deliveryBlock}

Verlauf:
${transcript}

Regeln:
- empathyScore (0-15, ${isAborted ? 'bei Abbruch max 0-3' : 'Unhöflichkeit max 0-4'}), deescalationScore (0-10, ${isAborted ? 'bei Abbruch max 0-2' : 'Souveränität'}), needsAnalysisScore (0-15), expertiseScore (0-10).
- sympathyVerdict (2-5 Wörter).
- strengths: 2-3 konkrete Punkte (je max 15 Wörter) zu echten Fragen/Aussagen.
- weaknesses: 2-3 konkrete Punkte (je max 16 Wörter) zu Lücken, Tonfall oder Übergabe.
- improvementTip: 1-2 konkrete Coaching-Sätze.
- closingReaction: ${isAborted ? '1 kurzer verärgerter Abschiedssatz.' : `1-2 gesprochene Sätze von ${customer.name} (ohne Sternchen/Markdown).`}`;

  const responseSchema = {
    type: 'OBJECT',
    properties: {
      empathyScore: { type: 'INTEGER' },
      deescalationScore: { type: 'INTEGER' },
      needsAnalysisScore: { type: 'INTEGER' },
      expertiseScore: { type: 'INTEGER' },
      sympathyVerdict: { type: 'STRING' },
      strengths: { type: 'ARRAY', items: { type: 'STRING' } },
      weaknesses: { type: 'ARRAY', items: { type: 'STRING' } },
      improvementTip: { type: 'STRING' },
      closingReaction: { type: 'STRING' }
    },
    required: [
      'empathyScore',
      'deescalationScore',
      'needsAnalysisScore',
      'expertiseScore',
      'sympathyVerdict',
      'strengths',
      'weaknesses',
      'improvementTip',
      'closingReaction'
    ]
  };

  const baseCandidates = getChatCandidateModels();
  const discoveredLites = (state.discoveredChatModels || []).filter(m => m && m.includes('lite') && !DEPRECATED_CHAT_MODELS.has(m));
  const rawOrdered = [
    ...(state.fastestEvalModel ? [state.fastestEvalModel] : []),
    ...discoveredLites,
    ...baseCandidates.filter(m => m.includes('lite')),
    ...baseCandidates.filter(m => !m.includes('lite'))
  ];
  const candidates = rawOrdered.filter((m, idx) =>
    m &&
    rawOrdered.indexOf(m) === idx &&
    !state.unavailableChatModels.has(m)
  );

  const runSingleEvalModel = async (model, outerSignal) => {
    let thinkingConfigToTry = null;
    if (!state.modelsWithoutThinking.has(model)) {
      if (/gemini-2\.5/i.test(model)) {
        thinkingConfigToTry = { thinkingBudget: 0 };
      } else if (/gemini-3|gemini-4/i.test(model)) {
        thinkingConfigToTry = { thinkingLevel: 'minimal' };
      }
    }
    let useSchema = true;

    for (let attempt = 0; attempt < 3; attempt++) {
      if (outerSignal?.aborted) throw new DOMException('Aborted', 'AbortError');
      const generationConfig = {
        temperature: 0.2,
        maxOutputTokens: 380,
        responseMimeType: 'application/json'
      };
      if (useSchema) {
        generationConfig.responseSchema = responseSchema;
      }
      if (thinkingConfigToTry) {
        generationConfig.thinkingConfig = thinkingConfigToTry;
      }

      const reqController = new AbortController();
      const onOuterAbort = () => reqController.abort();
      outerSignal?.addEventListener('abort', onOuterAbort, { once: true });
      const timeoutId = setTimeout(() => reqController.abort(), 3800);

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${state.apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: reqController.signal,
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: evalPrompt }] }],
            generationConfig
          })
        });

        if (!response.ok) {
          let errMsg = `HTTP ${response.status}`;
          try {
            const errObj = await response.json();
            errMsg = errObj?.error?.message || errMsg;
          } catch (e) {}
          const lowerMsg = errMsg.toLowerCase();

          if (response.status === 400 && thinkingConfigToTry && lowerMsg.includes('thinking')) {
            state.modelsWithoutThinking.add(model);
            thinkingConfigToTry = null;
            continue;
          }
          if (response.status === 400 && useSchema && (lowerMsg.includes('schema') || lowerMsg.includes('response_schema'))) {
            useSchema = false;
            continue;
          }
          if (response.status === 404 || (response.status === 400 && (lowerMsg.includes('not found') || lowerMsg.includes('not supported') || lowerMsg.includes('deprecated')))) {
            state.unavailableChatModels.add(model);
            break;
          }
          break;
        }

        const data = await response.json();
        const rawText = extractNonThoughtText(data);
        const parsed = parseEvaluationJson(rawText);
        if (!parsed) break;

        state.fastestEvalModel = model;
        return {
          source: 'gemini',
          empathyScore: clampScore(parsed.empathyScore, 0, isAborted ? 3 : 15),
          deescalationScore: clampScore(parsed.deescalationScore, 0, isAborted ? 2 : 10),
          needsAnalysisScore: clampScore(parsed.needsAnalysisScore, 0, 15),
          expertiseScore: clampScore(parsed.expertiseScore, 0, 10),
          sympathyVerdict: String(parsed.sympathyVerdict || (isAborted ? 'Kunde verärgert vergrault' : 'KI-Bewertung erstellt')).slice(0, 60),
          strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0
            ? parsed.strengths.slice(0, 3).map(s => String(s))
            : ['Gespräch aktiv geführt.'],
          weaknesses: Array.isArray(parsed.weaknesses) && parsed.weaknesses.length > 0
            ? parsed.weaknesses.slice(0, 3).map(s => String(s))
            : [isAborted ? 'Kunde hat wegen Verärgerung den Kauf abgebrochen.' : 'Keine wesentlichen Schwächen erkannt.'],
          improvementTip: String(parsed.improvementTip || 'Weiterhin gezielt nach Anlass und Allergien fragen.'),
          closingReaction: sanitizeSpokenText(String(parsed.closingReaction || walkoutReaction || 'Vielen Dank für die Beratung!'))
        };
      } catch (err) {
        if (outerSignal?.aborted) throw err;
        break;
      } finally {
        clearTimeout(timeoutId);
        outerSignal?.removeEventListener('abort', onOuterAbort);
      }
    }

    throw new Error(`Eval fehlgeschlagen (${model})`);
  };

  let seqStartIndex = 0;
  if (!state.fastestEvalModel && candidates.length >= 2 && typeof Promise.any === 'function') {
    const raceController = new AbortController();
    const onSignalAbort = () => raceController.abort();
    signal?.addEventListener('abort', onSignalAbort, { once: true });
    try {
      const winner = await Promise.any(candidates.slice(0, 2).map(m => runSingleEvalModel(m, raceController.signal)));
      raceController.abort();
      return winner;
    } catch (e) {
      if (signal?.aborted) throw e;
      seqStartIndex = 2;
    } finally {
      signal?.removeEventListener('abort', onSignalAbort);
    }
  }

  for (let i = seqStartIndex; i < candidates.length; i++) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    try {
      return await runSingleEvalModel(candidates[i], signal);
    } catch (e) {
      if (signal?.aborted) throw e;
    }
  }

  throw new Error('KI-Auswertung nicht erreichbar');
}

async function triggerCustomerWalkoutEvaluation(walkoutReaction = '') {
  const modal = document.getElementById('evaluationModal');
  if (modal && !modal.classList.contains('hidden')) return;

  state.pendingWalkoutReaction = null;
  state.handsFreeActive = false;
  stopListening(true);
  stopLiveSession(true);
  stopCustomerAudio();
  updateHandsFreeButtonUI();

  cancelActiveEvaluation();
  const evalSeq = state.evaluationSeq;
  const abortController = new AbortController();
  state.activeEvaluationAbortController = abortController;

  const customer = getCurrentCustomer();
  const idealBread = BREAD_DATABASE.find(b => b.id === customer.idealBreadId);
  const techResult = {
    abortedByCustomer: true,
    walkoutReaction,
    breadScore: 0,
    breadVerdict: 'Abbruch (0 ★)',
    portionScore: 0,
    portionVerdict: 'Kein Kauf (0 ★)',
    cutScore: 0,
    cutVerdict: 'Kein Kauf (0 ★)',
    isTrap: false,
    idealBreadName: idealBread ? idealBread.name : customer.idealBreadId,
    technicalTotal: 0
  };

  showEvaluationModalPending(customer, null, techResult);

  let evalResult = null;
  try {
    if (!state.apiKey) {
      evalResult = evaluateDialogueOfflineHeuristic(customer, null, techResult, walkoutReaction);
    } else {
      evalResult = await evaluateDialogueWithGemini(customer, null, techResult, abortController.signal, walkoutReaction);
    }
  } catch (err) {
    if (abortController.signal.aborted || evalSeq !== state.evaluationSeq) return;
    console.warn('Nutze Offline-Heuristik für Abbruch-Bewertung:', err);
    evalResult = evaluateDialogueOfflineHeuristic(customer, null, techResult, walkoutReaction);
  }

  if (abortController.signal.aborted || evalSeq !== state.evaluationSeq) return;
  if (state.activeEvaluationAbortController === abortController) {
    state.activeEvaluationAbortController = null;
  }

  applyEvaluationResultToModal(customer, null, techResult, evalResult);
}

async function submitOrderToCustomer() {
  if (!state.selectedBreadId) return;
  unlockAudioOnUserGesture();

  // Freisprech-Modus pausieren & etwaige Live-Transkripte vollständig in chatHistory sichern
  state.handsFreeActive = false;
  stopListening(true);
  const activeLive = state.liveSession;
  if (activeLive && !activeLive.closedManually && activeLive.ws && activeLive.ws.readyState === 1) {
    stopLiveMicCapture(activeLive);
    flushLiveApprenticeTurn(activeLive);
    flushLiveCustomerTurn(activeLive);
    activeLive.pendingStartListening = false;
    activeLive.pendingTextTurn = null;
    stopLiveOutputPlayback(activeLive);
  } else {
    stopLiveSession(true);
    stopCustomerAudio();
  }
  updateHandsFreeButtonUI();

  cancelActiveEvaluation();
  const evalSeq = state.evaluationSeq;
  const abortController = new AbortController();
  state.activeEvaluationAbortController = abortController;

  const customer = getCurrentCustomer();
  const chosenBread = BREAD_DATABASE.find(b => b.id === state.selectedBreadId);
  const techResult = evaluateTechnicalDelivery(customer, chosenBread);

  showEvaluationModalPending(customer, chosenBread, techResult);

  const apprenticeTurns = state.chatHistory.filter(m => m.role === 'apprentice').length;
  let evalResult = null;
  try {
    if (apprenticeTurns === 0 || !state.apiKey) {
      evalResult = evaluateDialogueOfflineHeuristic(customer, chosenBread, techResult);
    } else {
      evalResult = await evaluateDialogueWithGemini(customer, chosenBread, techResult, abortController.signal);
    }
  } catch (err) {
    if (abortController.signal.aborted || evalSeq !== state.evaluationSeq) return;
    console.warn('Nutze Offline-Heuristik für Gesprächsbewertung:', err);
    evalResult = evaluateDialogueOfflineHeuristic(customer, chosenBread, techResult);
  }

  if (abortController.signal.aborted || evalSeq !== state.evaluationSeq) return;
  if (state.activeEvaluationAbortController === abortController) {
    state.activeEvaluationAbortController = null;
  }

  applyEvaluationResultToModal(customer, chosenBread, techResult, evalResult);
}

function showEvaluationModalPending(customer, chosenBread, techResult) {
  const modal = document.getElementById('evaluationModal');
  const isAborted = Boolean(techResult?.abortedByCustomer);
  document.getElementById('evalBreadGrade').textContent = techResult.breadVerdict;
  document.getElementById('evalPortionGrade').textContent = techResult.portionVerdict;
  document.getElementById('evalCutGrade').textContent = techResult.cutVerdict;
  document.getElementById('evalTotalScore').textContent = `${techResult.technicalTotal} + … ★`;

  document.getElementById('evalTitle').textContent = isAborted
    ? `${customer.name} hat das Gespräch abgebrochen!`
    : `${customer.name} prüft Ihre Beratung…`;
  const pill = document.getElementById('evalSympathyPill');
  if (pill) {
    pill.textContent = isAborted ? 'Abbruch – Analyse läuft…' : 'Analyse läuft…';
    pill.className = isAborted
      ? 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-200 border border-rose-400/35'
      : 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-200 border border-amber-400/30';
  }
  document.getElementById('evalCustomerFace').textContent = isAborted ? '😡' : '🤔';
  document.getElementById('evalCustomerFeedback').textContent = isAborted && techResult.walkoutReaction
    ? `„${techResult.walkoutReaction}“`
    : '„Moment, ich schaue mir das Brot und unser Gespräch kurz an…“';
  state.lastEvaluationSpokenText = isAborted ? (techResult.walkoutReaction || '') : '';

  const replayBtn = document.getElementById('evalReplayAudioBtn');
  if (replayBtn) replayBtn.disabled = !isAborted;

  document.getElementById('evalAiLoadingBox').classList.remove('hidden');
  document.getElementById('evalAiMetricsContent').classList.add('hidden');
  document.getElementById('evalAiSourceBadge').textContent = state.apiKey ? '⏳ Gemini KI analysiert…' : '⏳ Werte Gespräch aus…';

  let scienceText = customer.scienceEvaluation;
  if (isAborted) {
    scienceText = `Gesprächsabbruch: ${customer.name} wollte wegen Verärgerung kein Brot mehr kaufen. — Fachauflösung: ${customer.scienceEvaluation}`;
  } else if (chosenBread && chosenBread.id !== customer.idealBreadId) {
    scienceText += ` — Ihre Übergabe: ${chosenBread.name} (${chosenBread.traits}; Allergene: ${chosenBread.allergens}).`;
  }
  document.getElementById('evalScienceExplanation').textContent = scienceText;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function setEvalCriterionBar(scoreId, barId, value, max) {
  const scoreEl = document.getElementById(scoreId);
  const barEl = document.getElementById(barId);
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  if (scoreEl) scoreEl.textContent = `${value} / ${max} ★`;
  if (barEl) barEl.style.width = `${pct}%`;
}

function applyEvaluationResultToModal(customer, chosenBread, techResult, evalResult) {
  const isAborted = Boolean(techResult?.abortedByCustomer);
  const dialogueTotal =
    evalResult.empathyScore +
    evalResult.deescalationScore +
    evalResult.needsAnalysisScore +
    evalResult.expertiseScore;
  const totalEarned = techResult.technicalTotal + dialogueTotal;

  state.score += totalEarned;
  state.servedCustomerIds.add(customer.id);
  state.servedCustomersCount = state.servedCustomerIds.size;

  if (!isAborted && totalEarned >= 75) {
    state.streak += 1;
    sounds.playSuccess();
  } else {
    state.streak = 0;
    sounds.playChime();
  }
  updateScoreboard();
  renderCustomerQueue();

  document.getElementById('evalTotalScore').textContent = `${totalEarned} / 100 ★`;

  const sourceBadge = document.getElementById('evalAiSourceBadge');
  if (sourceBadge) {
    sourceBadge.textContent = evalResult.source === 'gemini'
      ? '✦ Gemini KI-Analyse'
      : (evalResult.source === 'no_dialogue' ? '⚠️ Ohne Gespräch übergeben' : '⚙ Offline-Heuristik (ohne API-Key)');
  }

  document.getElementById('evalAiLoadingBox').classList.add('hidden');
  document.getElementById('evalAiMetricsContent').classList.remove('hidden');

  setEvalCriterionBar('evalEmpathyScore', 'evalEmpathyBar', evalResult.empathyScore, 15);
  setEvalCriterionBar('evalDeescalationScore', 'evalDeescalationBar', evalResult.deescalationScore, 10);
  setEvalCriterionBar('evalNeedsScore', 'evalNeedsBar', evalResult.needsAnalysisScore, 15);
  setEvalCriterionBar('evalExpertiseScore', 'evalExpertiseBar', evalResult.expertiseScore, 10);

  const strengthsList = document.getElementById('evalStrengthsList');
  if (strengthsList) {
    strengthsList.innerHTML = '';
    (evalResult.strengths || []).forEach(s => {
      const li = document.createElement('li');
      li.textContent = `• ${s}`;
      strengthsList.appendChild(li);
    });
  }
  const weaknessesList = document.getElementById('evalWeaknessesList');
  if (weaknessesList) {
    weaknessesList.innerHTML = '';
    (evalResult.weaknesses || []).forEach(w => {
      const li = document.createElement('li');
      li.textContent = `• ${w}`;
      weaknessesList.appendChild(li);
    });
  }
  document.getElementById('evalCoachingTip').textContent = evalResult.improvementTip;

  const sympathyPill = document.getElementById('evalSympathyPill');
  if (sympathyPill) {
    sympathyPill.textContent = evalResult.sympathyVerdict;
    sympathyPill.className = (!isAborted && evalResult.empathyScore >= 10)
      ? 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/35'
      : ((!isAborted && evalResult.empathyScore >= 6)
        ? 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/35'
        : 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-200 border border-rose-400/35');
  }

  const evalTitle = document.getElementById('evalTitle');
  const evalFace = document.getElementById('evalCustomerFace');
  if (isAborted) {
    evalTitle.textContent = 'Gesprächsabbruch – Kunde verärgert! 😡';
    evalFace.textContent = '😡';
  } else if (totalEarned >= 85) {
    evalTitle.textContent = 'Meisterhafte Beratung & Empathie! 🏆';
    evalFace.textContent = '🤩';
  } else if (totalEarned >= 60) {
    evalTitle.textContent = 'Solide Beratungsleistung 👍';
    evalFace.textContent = '😊';
  } else {
    evalTitle.textContent = 'Beratungs- & Dialogpotenzial ⚠️';
    evalFace.textContent = evalResult.empathyScore <= 4 ? '😠' : '😕';
  }

  const spokenClosing = isAborted
    ? (techResult.walkoutReaction || evalResult.closingReaction || 'Ich kaufe hier kein Brot mehr!')
    : (evalResult.closingReaction || 'Vielen Dank!');
  document.getElementById('evalCustomerFeedback').textContent = `„${spokenClosing}“`;
  state.lastEvaluationSpokenText = spokenClosing;

  const replayBtn = document.getElementById('evalReplayAudioBtn');
  if (replayBtn) replayBtn.disabled = false;

  // Abschlussreaktion abspielen (bei Abbruch hat der Kunde den Satz soeben schon gesprochen)
  if (!isAborted) {
    speakEvaluationClosingSpeech(spokenClosing, customer.id);
  }
}

async function speakEvaluationClosingSpeech(rawText, customerId) {
  const cleanText = sanitizeSpokenText(rawText);
  if (!cleanText || !state.voiceOutputEnabled) return;

  const profile = customerVoiceProfiles[customerId] || customerVoiceProfiles.bergmann;
  const cacheKey = `${customerId}::${profile.voiceName}::${cleanText}`;

  // 1. Bereits gecachte Abschlussreaktion (z. B. beim erneuten Klick auf „Anhören“) direkt abspielen
  if (state.ttsAudioCache.get(cacheKey)?.audioBuffer) {
    return speakWithGeminiTTS(cleanText, customerId, { triggerHandsFreeNextTurn: false });
  }

  // 2. Falls Live-WebSocket noch verbunden ist, genau dieselbe Live-Stimme sprechen lassen
  const session = state.liveSession;
  if (state.apiKey && session && !session.closedManually && session.setupComplete && session.ws && session.ws.readyState === 1) {
    stopLiveMicCapture(session);
    stopLiveOutputPlayback(session);
    session.pendingStartListening = false;
    session.suppressNextTurnTranscript = true;
    session.pendingReplayText = cleanText;
    session.closeAfterTurnComplete = true;
    session.liveAudioChunks = [];
    session.liveCustomerText = '';
    session.liveCustomerBubble = null;
    const sent = sendLiveTextTurn(`Sprich jetzt zum Abschied an der Theke genau diesen deutschen Satz wortwörtlich und ohne Zusätze: "${cleanText}"`);
    if (sent) {
      session.closingFallbackTimerId = setTimeout(() => {
        session.closingFallbackTimerId = null;
        if (state.liveSession === session && !session.isAudioPlaying && (!session.liveAudioChunks || session.liveAudioChunks.length === 0)) {
          stopLiveSession(true);
          speakWithGeminiTTS(cleanText, customerId, { triggerHandsFreeNextTurn: false, _skipLiveFallback: true });
        }
      }, 3000);
      return;
    }
  }

  // 3. Sonst saubere TTS-Ausgabe (inkl. Live-WebSocket-Fallback vor Computerstimme)
  if (session) stopLiveSession(true);
  return speakWithGeminiTTS(cleanText, customerId, { triggerHandsFreeNextTurn: false });
}

function playEvaluationReactionAudio() {
  unlockAudioOnUserGesture();
  const customer = getCurrentCustomer();
  if (state.lastEvaluationSpokenText) {
    speakEvaluationClosingSpeech(state.lastEvaluationSpokenText, customer.id);
  }
}

function closeEvaluationModal() {
  cancelActiveEvaluation();
  stopLiveSession(true);
  stopCustomerAudio();
  const modal = document.getElementById('evaluationModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function nextCustomerInQueue() {
  closeEvaluationModal();
  const queueLen = (state.activeQueue || []).length || 1;
  const nextIndex = (state.currentCustomerIndex + 1) % queueLen;
  loadCustomer(nextIndex);
  sounds.playChime();
}

function updateScoreboard() {
  const totalInShift = (state.activeQueue || []).length || CUSTOMER_SCENARIOS.length;
  document.getElementById('scoreDisplay').textContent = state.score;
  document.getElementById('servedCountDisplay').textContent = `${state.servedCustomersCount} / ${totalInShift}`;
  document.getElementById('streakBadge').textContent = `Serie: ${state.streak}`;
}

/* =========================================================================
   14. EINSTELLUNGSMODAL, 5s TIMEOUT VERBINDUNGSTEST & MODELL-DISCOVERY
   ========================================================================= */

function renderSettingsVoiceOverview() {
  const list = document.getElementById('settingsVoiceOverviewList');
  if (!list) return;
  list.innerHTML = '';
  CUSTOMER_SCENARIOS.forEach(cust => {
    const profile = customerVoiceProfiles[cust.id] || customerVoiceProfiles.bergmann;
    const arch = ARCHETYPE_META[cust.archetype] || ARCHETYPE_META.classic;
    const li = document.createElement('li');
    li.className = 'truncate';
    li.innerHTML = `• ${cust.name}: <span class="font-mono text-amber-200">${profile.voiceName}</span> <span class="text-stone-400">(${arch.label})</span>`;
    list.appendChild(li);
  });
}

function openSettingsModal() {
  state.handsFreeActive = false;
  stopListening(true);
  stopLiveSession(true);
  stopCustomerAudio();
  updateHandsFreeButtonUI();
  renderSettingsVoiceOverview();

  document.getElementById('apiKeyInput').value = state.apiKey;
  const liveCheckbox = document.getElementById('liveModeCheckbox');
  if (liveCheckbox) liveCheckbox.checked = Boolean(state.liveModeEnabled);
  const silenceSelect = document.getElementById('silenceTimeoutSelect');
  if (silenceSelect) silenceSelect.value = String(getSilenceTimeoutMs());
  const chatSelect = document.getElementById('chatModelSelect');
  const ttsSelect = document.getElementById('ttsModelSelect');
  if (state.discoveredChatModels && state.discoveredChatModels.length > 0) {
    state.discoveredChatModels.forEach(m => {
      if (!DEPRECATED_CHAT_MODELS.has(m) && ![...chatSelect.options].some(o => o.value === m)) {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        chatSelect.appendChild(opt);
      }
    });
  }
  if (state.preferredModel && ![...chatSelect.options].some(o => o.value === state.preferredModel)) {
    const opt = document.createElement('option');
    opt.value = state.preferredModel;
    opt.textContent = state.preferredModel;
    chatSelect.appendChild(opt);
  }
  if ([...chatSelect.options].some(o => o.value === state.preferredModel)) {
    chatSelect.value = state.preferredModel;
  }

  if (state.discoveredTtsModels && state.discoveredTtsModels.length > 0) {
    state.discoveredTtsModels.forEach(m => {
      if (![...ttsSelect.options].some(o => o.value === m)) {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        ttsSelect.appendChild(opt);
      }
    });
  }
  if (state.ttsModel && ![...ttsSelect.options].some(o => o.value === state.ttsModel)) {
    const opt = document.createElement('option');
    opt.value = state.ttsModel;
    opt.textContent = state.ttsModel;
    ttsSelect.appendChild(opt);
  }
  if ([...ttsSelect.options].some(o => o.value === state.ttsModel)) {
    ttsSelect.value = state.ttsModel;
  }
  const modal = document.getElementById('settingsModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeSettingsModal() {
  const modal = document.getElementById('settingsModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function toggleApiKeyVisibility() {
  const input = document.getElementById('apiKeyInput');
  input.type = input.type === 'password' ? 'text' : 'password';
}

function clearApiKey() {
  state.apiKey = '';
  state.lockedConversationTtsModel = null;
  state.discoveredChatModels = [];
  state.discoveredTtsModels = [];
  state.discoveredLiveModels = [];
  state.modelsDiscoveredThisSession = false;
  state.liveUnavailableForSession = false;
  state.ttsModelCooldowns = {};
  state.unavailableChatModels.clear();
  state.unavailableTtsModels.clear();
  state.unavailableLiveModels.clear();
  localStorage.removeItem('GEMINI_API_KEY');
  localStorage.removeItem('BAECKERMAT_GEMINI_KEY');
  localStorage.removeItem('GEMINI_DISCOVERED_CHAT_MODELS');
  localStorage.removeItem('GEMINI_DISCOVERED_TTS_MODELS');
  localStorage.removeItem('GEMINI_DISCOVERED_LIVE_MODELS');
  document.getElementById('apiKeyInput').value = '';
  updateApiStatusBadge(false, 'Kein API-Key');
  const box = document.getElementById('apiTestResult');
  box.className = 'p-3 rounded-xl text-[11px] bg-stone-800 border border-white/10 text-stone-200 block';
  box.textContent = 'API-Key entfernt. Die Anwendung läuft im Offline-Übungsmodus.';
}

/**
 * Ermittelt alle mit diesem API-Key verfügbaren Dialog- und TTS-Modelle.
 */
async function discoverAvailableGeminiModels(apiKey, timeoutMs = 5000) {
  if (!apiKey) return { chatModels: [], ttsModels: [] };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || `HTTP ${response.status}: API-Key abgelehnt`);
    }

    const rawModels = data.models || [];
    const allModels = rawModels.filter(m =>
      m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')
    );

    const chatModels = allModels
      .filter(m => !m.name.includes('-tts') && !m.name.includes('image') && !m.name.includes('lyria'))
      .map(m => m.name.replace('models/', ''))
      .filter(m => !DEPRECATED_CHAT_MODELS.has(m));

    const ttsModels = allModels
      .filter(m => m.name.includes('-tts'))
      .map(m => m.name.replace('models/', ''));

    const liveModels = rawModels
      .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('bidiGenerateContent'))
      .map(m => m.name.replace('models/', ''));

    state.discoveredChatModels = chatModels;
    state.discoveredTtsModels = ttsModels;
    state.discoveredLiveModels = liveModels;
    state.modelsDiscoveredThisSession = true;
    try {
      localStorage.setItem('GEMINI_DISCOVERED_CHAT_MODELS', JSON.stringify(chatModels));
      localStorage.setItem('GEMINI_DISCOVERED_TTS_MODELS', JSON.stringify(ttsModels));
      localStorage.setItem('GEMINI_DISCOVERED_LIVE_MODELS', JSON.stringify(liveModels));
    } catch (e) {}

    // Falls das aktuell gewählte Chat-Modell veraltet oder nicht verfügbar ist, auf schnellstes Modell migrieren
    if (chatModels.length > 0 && (!chatModels.includes(state.preferredModel) || DEPRECATED_CHAT_MODELS.has(state.preferredModel))) {
      const preferredChat =
        chatModels.find(m => m === 'gemini-3.8-flash-lite') ||
        chatModels.find(m => m === 'gemini-3.8-flash') ||
        chatModels.find(m => m === 'gemini-flash-latest') ||
        chatModels[0];
      state.preferredModel = preferredChat;
      try { localStorage.setItem('GEMINI_CHAT_MODEL', preferredChat); } catch (e) {}
    }

    // Falls das aktuell gewählte TTS-Modell gar nicht auf dem Key existiert, auf ein gültiges umschalten
    if (ttsModels.length > 0 && !ttsModels.includes(state.ttsModel)) {
      const preferredFallback =
        ttsModels.find(m => m === 'gemini-3.8-flash-lite-tts') ||
        ttsModels.find(m => m === 'gemini-3.8-flash-tts') ||
        ttsModels.find(m => m === 'gemini-3.1-flash-tts-preview') ||
        ttsModels.find(m => m === 'gemini-2.5-flash-preview-tts') ||
        ttsModels[0];
      state.ttsModel = preferredFallback;
      try { localStorage.setItem('GEMINI_TTS_MODEL', preferredFallback); } catch (e) {}
      updateApiStatusBadge(true, preferredFallback);
    }

    return { chatModels, ttsModels, liveModels };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function testApiKeyAndFetchModels() {
  const key = document.getElementById('apiKeyInput').value.trim();
  const resultBox = document.getElementById('apiTestResult');
  const spinner = document.getElementById('testSpinner');
  const btn = document.getElementById('btnTestApi');

  if (!key) {
    resultBox.className = 'p-3 rounded-xl text-[11px] bg-red-950/70 border border-red-500/40 text-red-200 block';
    resultBox.textContent = 'Bitte gib zuerst einen gültigen Google Gemini API-Key ein.';
    return;
  }

  spinner.classList.remove('hidden');
  btn.disabled = true;
  resultBox.className = 'hidden';

  try {
    const { chatModels, ttsModels, liveModels } = await discoverAvailableGeminiModels(key, 5000);

    const chatSelect = document.getElementById('chatModelSelect');
    if (chatModels.length > 0) {
      const previousChat = chatSelect.value || state.preferredModel;
      chatSelect.innerHTML = '';
      chatModels.forEach(cleanName => {
        const opt = document.createElement('option');
        opt.value = cleanName;
        opt.textContent = cleanName === 'gemini-3.8-flash-lite'
          ? `${cleanName} (Ultraschnell – Empfohlen)`
          : (cleanName === 'gemini-3.8-flash' ? `${cleanName} (Ausführlicher)` : cleanName);
        chatSelect.appendChild(opt);
      });
      if (chatModels.includes(previousChat) && !DEPRECATED_CHAT_MODELS.has(previousChat)) {
        chatSelect.value = previousChat;
      } else if (chatModels.includes('gemini-3.8-flash-lite')) {
        chatSelect.value = 'gemini-3.8-flash-lite';
      } else if (chatModels.includes('gemini-3.8-flash')) {
        chatSelect.value = 'gemini-3.8-flash';
      } else if (chatModels.includes('gemini-flash-latest')) {
        chatSelect.value = 'gemini-flash-latest';
      }
    }

    const ttsSelect = document.getElementById('ttsModelSelect');
    if (ttsModels.length > 0) {
      const previousTts = ttsSelect.value || state.ttsModel;
      ttsSelect.innerHTML = '';
      ttsModels.forEach(cleanName => {
        const opt = document.createElement('option');
        opt.value = cleanName;
        opt.textContent = cleanName === 'gemini-3.8-flash-lite-tts'
          ? `${cleanName} (Schnellster Dialog)`
          : (cleanName === 'gemini-3.8-flash-tts' ? `${cleanName} (Studio-Ausdruck)` : cleanName);
        ttsSelect.appendChild(opt);
      });
      if (ttsModels.includes(previousTts)) {
        ttsSelect.value = previousTts;
      } else if (ttsModels.includes('gemini-3.8-flash-tts')) {
        ttsSelect.value = 'gemini-3.8-flash-tts';
      } else if (ttsModels.includes('gemini-3.8-flash-lite-tts')) {
        ttsSelect.value = 'gemini-3.8-flash-lite-tts';
      } else if (ttsModels.includes('gemini-3.1-flash-tts-preview')) {
        ttsSelect.value = 'gemini-3.1-flash-tts-preview';
      }
    }

    resultBox.className = 'p-3 rounded-xl text-[11px] bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 block';
    resultBox.textContent = `✓ Verbindung erfolgreich! ${chatModels.length} Dialog-, ${ttsModels.length} TTS- und ${liveModels.length} Live-Modelle geladen.`;

  } catch (err) {
    resultBox.className = 'p-3 rounded-xl text-[11px] bg-red-950/70 border border-red-500/40 text-red-200 block';
    resultBox.textContent = `Verbindungsfehler: ${err.name === 'AbortError' ? 'Zeitüberschreitung nach 5 Sekunden' : err.message}`;
  } finally {
    spinner.classList.add('hidden');
    btn.disabled = false;
  }
}

function saveSettingsAndClose() {
  const key = document.getElementById('apiKeyInput').value.trim();
  const chatModel = document.getElementById('chatModelSelect').value;
  const ttsModel = document.getElementById('ttsModelSelect').value;
  const liveCheckbox = document.getElementById('liveModeCheckbox');
  const silenceSelect = document.getElementById('silenceTimeoutSelect');

  const keyChanged = key !== state.apiKey;
  const ttsModelChanged = ttsModel !== state.ttsModel;
  state.apiKey = key;
  state.preferredModel = chatModel;
  state.ttsModel = ttsModel;
  state.lockedConversationTtsModel = null;
  state.liveModeEnabled = liveCheckbox ? liveCheckbox.checked : true;
  const nextSilence = silenceSelect ? Number(silenceSelect.value) : DEFAULT_SILENCE_TIMEOUT_MS;
  state.silenceTimeoutMs = (nextSilence === 600 || nextSilence === 1000 || nextSilence === 1400) ? nextSilence : DEFAULT_SILENCE_TIMEOUT_MS;
  state.liveUnavailableForSession = false;
  state.ttsModelCooldowns = {};
  state.unavailableChatModels.clear();
  state.unavailableTtsModels.clear();
  state.unavailableLiveModels.clear();
  try {
    localStorage.setItem('GEMINI_LIVE_MODE', String(state.liveModeEnabled));
    localStorage.setItem('GEMINI_SILENCE_TIMEOUT_MS', String(state.silenceTimeoutMs));
  } catch (e) {}
  updateAutoSendBadgeUI();
  if (keyChanged || ttsModelChanged) {
    if (keyChanged) state.modelsDiscoveredThisSession = false;
    state.ttsAudioCache.clear();
  }

  if (key) {
    localStorage.setItem('GEMINI_API_KEY', key);
    localStorage.setItem('GEMINI_CHAT_MODEL', chatModel);
    localStorage.setItem('GEMINI_TTS_MODEL', ttsModel);
    updateApiStatusBadge(true, `${ttsModel}`);
    hideChatNotice();
    showToast(`API-Key & ${ttsModel} gespeichert! Klicke auf „Kundengespräch starten“.`);
    if (!state.modelsDiscoveredThisSession) {
      discoverAvailableGeminiModels(key, 5000).catch(() => {});
    }
  } else {
    localStorage.removeItem('GEMINI_API_KEY');
    localStorage.removeItem('GEMINI_DISCOVERED_CHAT_MODELS');
    localStorage.removeItem('GEMINI_DISCOVERED_TTS_MODELS');
    localStorage.removeItem('GEMINI_DISCOVERED_LIVE_MODELS');
    state.discoveredChatModels = [];
    state.discoveredTtsModels = [];
    state.discoveredLiveModels = [];
    updateApiStatusBadge(false, 'Kein API-Key');
  }

  closeSettingsModal();
}

function updateApiStatusBadge(connected, modelInfo) {
  const statusIndicator = document.getElementById('statusIndicator');
  const statusLabel = document.getElementById('statusLabel');
  const modelLabel = document.getElementById('modelLabel');

  if (connected) {
    statusIndicator.innerHTML = `
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
      <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
    `;
    statusLabel.textContent = 'Gemini KI + TTS Aktiv';
    statusLabel.className = 'font-semibold text-emerald-400 text-[11px]';
    modelLabel.textContent = modelInfo;
  } else {
    statusIndicator.innerHTML = `
      <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
    `;
    statusLabel.textContent = 'Offline-Übungsmodus';
    statusLabel.className = 'font-semibold text-stone-200 text-[11px]';
    modelLabel.textContent = 'Kein API-Key';
  }
}

function showToast(message) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'px-4 py-2.5 rounded-xl bg-stone-900/95 border border-amber-400/40 text-stone-100 text-xs shadow-xl backdrop-blur-md transition-all duration-300 flex items-center gap-2';
  toast.innerHTML = `<span class="text-amber-400">✦</span> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

/* =========================================================================
   15. INITIALISIERUNG
   ========================================================================= */

function initScrollRevealAnimations() {
  if (typeof IntersectionObserver !== 'function' || typeof document.querySelectorAll !== 'function') return;
  const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  const panels = document.querySelectorAll('.reveal-panel');
  if (!panels || panels.length === 0) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('reveal-pending');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05 });

  panels.forEach((panel, idx) => {
    panel.style.transitionDelay = `${Math.min(idx * 55, 240)}ms`;
    panel.classList.add('reveal-pending');
    observer.observe(panel);
  });
}

function initChatPanelResizer() {
  const chatCard = document.getElementById('chatPanelCard');
  const handle = document.getElementById('chatResizeHandle');
  if (!chatCard || !handle) return;

  const MIN_HEIGHT = 290;
  const MAX_HEIGHT = 800;
  const DEFAULT_HEIGHT = 430;
  const STORAGE_KEY = 'baeckermat_chat_height';

  const applyHeight = (px, persist = false) => {
    const clamped = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, Math.round(px)));
    if (chatCard.style) chatCard.style.height = `${clamped}px`;
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, String(clamped)); } catch (e) {}
    }
    return clamped;
  };

  try {
    const saved = Number(localStorage.getItem(STORAGE_KEY));
    if (Number.isFinite(saved) && saved >= MIN_HEIGHT && saved <= MAX_HEIGHT) {
      applyHeight(saved, false);
    } else {
      applyHeight(DEFAULT_HEIGHT, false);
    }
  } catch (e) {
    applyHeight(DEFAULT_HEIGHT, false);
  }

  let dragging = false;
  let startY = 0;
  let startHeight = DEFAULT_HEIGHT;
  let lastHeight = DEFAULT_HEIGHT;

  const onPointerMove = (ev) => {
    if (!dragging) return;
    lastHeight = applyHeight(startHeight + (ev.clientY - startY), false);
  };

  const stopDragging = () => {
    if (!dragging) return;
    dragging = false;
    applyHeight(lastHeight, true);
    if (document.body?.style) document.body.style.userSelect = '';
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', stopDragging);
    window.removeEventListener('pointercancel', stopDragging);
  };

  handle.addEventListener('pointerdown', (ev) => {
    if (typeof ev.button === 'number' && ev.button !== 0) return;
    dragging = true;
    startY = ev.clientY;
    const rectH = chatCard.getBoundingClientRect ? chatCard.getBoundingClientRect().height : DEFAULT_HEIGHT;
    startHeight = Number.parseFloat(chatCard.style?.height) || rectH || DEFAULT_HEIGHT;
    lastHeight = startHeight;
    try { handle.setPointerCapture?.(ev.pointerId); } catch (e) {}
    if (document.body?.style) document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', stopDragging);
    window.addEventListener('pointercancel', stopDragging);
    ev.preventDefault?.();
  });

  handle.addEventListener('dblclick', () => {
    applyHeight(DEFAULT_HEIGHT, true);
  });
}

window.onload = function () {
  initFlourCanvas();
  initScrollRevealAnimations();
  initChatPanelResizer();
  initSpeechRecognition();
  renderBreadCategoryFilters();
  renderBreadDisplay();
  renderSettingsVoiceOverview();
  updatePortionAndSummaryDisplay();
  updateAutoSendBadgeUI();

  // Browser-Stimmen für eventuellen Offline-Modus frühzeitig vorladen
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    } catch (e) {}
  }

  if (state.apiKey) {
    updateApiStatusBadge(true, state.ttsModel);
    discoverAvailableGeminiModels(state.apiKey, 5000).catch(() => {});
  } else {
    updateApiStatusBadge(false, 'Kein API-Key');
  }

  loadCustomer(0);
};
