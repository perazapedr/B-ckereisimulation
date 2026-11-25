// BäckerMat – SoundEffects, WebAudio, <audio>-WAV Fallback, Gemini TTS, STT & Live API

/* =========================================================================
   4. WEB AUDIO SYNTHESIZER (THEKEN- & SCHNEIDEMASCHINEN-SOUNDS)
   ========================================================================= */

class SoundEffects {
  constructor() { this.ctx = null; }
  init() {
    if (!this.ctx || this.ctx.state === 'closed') {
      if (state.ttsAudioCtx && state.ttsAudioCtx.state !== 'closed') {
        this.ctx = state.ttsAudioCtx;
      } else {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContextClass();
        state.ttsAudioCtx = this.ctx;
      }
    }
    if (this.ctx.state === 'suspended') { this.ctx.resume().catch(() => {}); }
  }
  playChime() {
    try {
      this.init();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1240, now + 0.11);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(now); osc.stop(now + 0.43);
    } catch (e) {}
  }
  playSlicer() {
    try {
      this.init();
      const now = this.ctx.currentTime;
      for (let i = 0; i < 4; i++) {
        const t = now + (i * 0.065);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320 - (i * 30), t);
        osc.frequency.linearRampToValueAtTime(85, t + 0.045);
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(t); osc.stop(t + 0.055);
      }
    } catch (e) {}
  }
  playMicTone(start = true) {
    try {
      this.init();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(start ? 620 : 420, now);
      osc.frequency.exponentialRampToValueAtTime(start ? 880 : 320, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(now); osc.stop(now + 0.16);
    } catch (e) {}
  }
  playSuccess() {
    try {
      this.init();
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const now = this.ctx.currentTime + (idx * 0.085);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(now); osc.stop(now + 0.31);
      });
    } catch (e) {}
  }
}
const sounds = new SoundEffects();


/* =========================================================================
   6. RAUSCHFREIE GEMINI-TTS WIEDERGABE ÜBER WEB AUDIO API (AudioContext)
   ========================================================================= */

/**
 * Bereinigt den Text vor der TTS-Übergabe von Markdown, Sternchen-Aktionen,
 * Regieklammern oder Sprecher-Präfixen, damit das TTS-Modell
 * ausschließlich den reinen gesprochenen Kundensatz vorliest.
 */
function sanitizeSpokenText(rawText) {
  if (!rawText) return '';
  return String(rawText)
    .replace(/\*[^*]+\*/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[*_#`~>]/g, '')
    .replace(/^(Herr Bergmann|Sarah|Frau Demir|Tim|Lukas|Oma Hannelore|Hannelore|Maja|Herr Dr\. Krawczyk|Dr\. Krawczyk|Frau Meißner|Kunde|Kundin)\s*:\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Stellt sicher, dass der TTS-Prompt sauber mit Satzzeichen endet,
 * damit das Modell das Satzende sauber abschließt und kein Endrauschen erzeugt.
 */
function formatTextForGeminiTts(cleanText) {
  const trimmed = (cleanText || '').trim();
  if (!trimmed) return '';
  return /[.!?…]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

/**
 * Entsperrt AudioContext & SpeechSynthesis synchron im Benutzer-Klick/Enter-Kontext,
 * damit spätere asynchrone KI-Antworten nicht von der Browser-Autoplay-Sperre stummgeschaltet werden.
 */
function unlockAudioOnUserGesture() {
  try {
    if (!state.ttsAudioCtx || state.ttsAudioCtx.state === 'closed') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        state.ttsAudioCtx = new AudioContextClass();
      }
    }
    if (state.ttsAudioCtx && state.ttsAudioCtx.state === 'suspended') {
      state.ttsAudioCtx.resume().catch(() => {});
    }
    if (state.ttsAudioCtx && !state._audioWarmedUp) {
      const ctx = state.ttsAudioCtx;
      if (typeof ctx.createBuffer === 'function' && typeof ctx.createBufferSource === 'function') {
        const silentBuf = ctx.createBuffer(1, 1, 24000);
        const warmSrc = ctx.createBufferSource();
        warmSrc.buffer = silentBuf;
        warmSrc.connect(ctx.destination);
        warmSrc.start(0);
        state._audioWarmedUp = true;
      }
    }
  } catch (e) {}

  try {
    if ('speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  } catch (e) {}
}

/**
 * Stellt einen entsperrten Web Audio API AudioContext bereit.
 */
async function getTtsAudioContext() {
  if (!state.ttsAudioCtx || state.ttsAudioCtx.state === 'closed') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    state.ttsAudioCtx = new AudioContextClass();
  }
  if (state.ttsAudioCtx.state === 'suspended') {
    await Promise.race([
      state.ttsAudioCtx.resume().catch(() => {}),
      new Promise(resolve => setTimeout(resolve, 250))
    ]);
  }
  return state.ttsAudioCtx;
}

/**
 * Dekodiert einen Base64-String (auch URL-safe / mit Zeilenumbrüchen) sicher in Bytes.
 */
function base64ToUint8Array(base64Str) {
  let normalized = String(base64Str || '')
    .replace(/[\s\r\n]+/g, '')
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const padMod = normalized.length % 4;
  if (padMod > 0) {
    normalized += '='.repeat(4 - padMod);
  }
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function concatUint8Arrays(chunks) {
  if (chunks.length === 1) return chunks[0];
  const totalLen = chunks.reduce((sum, c) => sum + c.length, 0);
  const merged = new Uint8Array(totalLen);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
}

/**
 * Entfernt DC-Offset, schneidet führendes/nachlaufendes Vocoder-Rauschen (Hiss/Static)
 * adaptiv hinter dem letzten gesprochenen Wort ab und wendet saubere Cosine-Fades an.
 */
function cleanAndTrimFloat32SpeechSamples(rawSamples, sampleRate, options = {}) {
  const {
    trimLeading = true,
    fadeInMs = 12,
    trimTrailing = true,
    fadeOutMs = 85
  } = options;
  const totalSamples = rawSamples.length;
  if (totalSamples <= 0) {
    throw new Error('Leerer Audiostrom empfangen.');
  }

  // 1. DC-Offset entfernen (verhindert Gleichspannungs-Knacken und verfälschte RMS-Werte)
  let sum = 0;
  for (let i = 0; i < totalSamples; i++) {
    sum += rawSamples[i];
  }
  const dcMean = sum / totalSamples;
  const samples = new Float32Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    const centered = rawSamples[i] - dcMean;
    samples[i] = Math.max(-1.0, Math.min(1.0, centered));
  }

  const frameLen = Math.max(1, Math.floor(sampleRate * 0.010)); // 10 ms Fenster
  const numFrames = Math.floor(totalSamples / frameLen);

  let startSample = 0;
  let activeEndSample = totalSamples;

  if (numFrames >= 10 && (trimLeading || trimTrailing)) {
    const rms = new Float32Array(numFrames);
    const zcr = new Float32Array(numFrames);
    const activeRmsValues = [];

    for (let f = 0; f < numFrames; f++) {
      const base = f * frameLen;
      let sq = 0;
      let zc = 0;
      let prev = samples[base];
      for (let j = 0; j < frameLen; j++) {
        const v = samples[base + j];
        sq += v * v;
        if (j > 0 && ((v >= 0 && prev < 0) || (v < 0 && prev >= 0))) {
          zc++;
        }
        prev = v;
      }
      const frameRms = Math.sqrt(sq / frameLen);
      rms[f] = frameRms;
      zcr[f] = frameLen > 1 ? zc / (frameLen - 1) : 0;
      if (frameRms > 0.004) {
        activeRmsValues.push(frameRms);
      }
    }

    if (activeRmsValues.length > 0) {
      activeRmsValues.sort((a, b) => a - b);
      const p85 = activeRmsValues[Math.floor(activeRmsValues.length * 0.85)];
      const voicedThresh = Math.max(0.014, Math.min(0.045, p85 * 0.14));
      const tailThresh = Math.max(0.008, Math.min(0.025, p85 * 0.08));
      const quietFloor = Math.max(0.003, tailThresh * 0.45);

      // Grundrauschen am Clip-Ende erkennen (z. B. weißes oder rosa Vocoder-Rauschen in den letzten 120 ms)
      let endHissRms = 0;
      if (trimTrailing && numFrames > 40) {
        const tailHiss = [];
        for (let f = numFrames - 12; f < numFrames; f++) {
          if (rms[f] < p85 * 0.25) {
            tailHiss.push(rms[f]);
          }
        }
        if (tailHiss.length >= 9) {
          tailHiss.sort((a, b) => a - b);
          endHissRms = tailHiss[Math.floor(tailHiss.length / 2)];
        }
      }

      const effectiveTailThresh = Math.max(tailThresh, endHissRms * 1.40);

      // Führende Stille / Startrauschen bis 25 ms vor Sprachbeginn trimmen
      if (trimLeading) {
        let firstActiveFrame = -1;
        for (let f = 0; f < numFrames; f++) {
          if (rms[f] >= tailThresh) {
            firstActiveFrame = f;
            break;
          }
        }
        if (firstActiveFrame > 3) {
          startSample = Math.max(0, firstActiveFrame * frameLen - Math.floor(sampleRate * 0.060));
        }
      }

      // Letzten stimmhaften Sprach-Frame finden (ignoriert reines Hochfrequenz-Rauschen)
      if (trimTrailing) {
        let lastVoicedFrame = -1;
        for (let f = numFrames - 1; f >= 0; f--) {
          if (rms[f] >= voicedThresh && zcr[f] < 0.42) {
            lastVoicedFrame = f;
            break;
          }
        }
        if (lastVoicedFrame === -1) {
          for (let f = numFrames - 1; f >= 0; f--) {
            if (rms[f] >= tailThresh) {
              lastVoicedFrame = f;
              break;
            }
          }
        }

        if (lastVoicedFrame !== -1) {
          // Nach dem letzten stimmhaften Frame noch bis zu 240 ms auf ausklingende Konsonanten (-s, -sch, -t) prüfen
          let endFrame = lastVoicedFrame;
          let quietStreak = 0;
          const maxLookahead = Math.min(numFrames - 1, lastVoicedFrame + 24);
          for (let f = lastVoicedFrame + 1; f <= maxLookahead; f++) {
            if (rms[f] >= effectiveTailThresh) {
              endFrame = f;
              quietStreak = 0;
            } else if (rms[f] < quietFloor) {
              quietStreak++;
              if (quietStreak >= 5) break;
            } else {
              quietStreak++;
              if (quietStreak >= 8) break;
            }
          }

          // 80 ms sanfte Ausklingreserve behalten, aber späte Rauschspitzen am Stream-Ende abschneiden
          const padSamples = Math.floor(sampleRate * 0.080);
          const hardTrimEnd = Math.max(
            startSample + Math.floor(sampleRate * 0.050),
            totalSamples - Math.floor(sampleRate * 0.010)
          );
          activeEndSample = Math.min(hardTrimEnd, (endFrame + 1) * frameLen + padSamples);
        }
      }
    }
  }

  const activeSamples = Math.max(1, activeEndSample - startSample);
  const cleaned = samples.subarray(startSample, startSample + activeSamples);

  // 2. Sanfter Cosine-Fade-In
  if (fadeInMs > 0) {
    const fadeInSamples = Math.min(Math.floor(sampleRate * (fadeInMs / 1000)), Math.floor(activeSamples / 2));
    for (let i = 0; i < fadeInSamples; i++) {
      cleaned[i] *= 0.5 * (1 - Math.cos(Math.PI * (i / fadeInSamples)));
    }
  }

  // 3. Sanfter Cosine-Fade-Out bis exakt 0.0 (kein Nachrauschen)
  if (fadeOutMs > 0) {
    const fadeOutSamples = Math.min(Math.floor(sampleRate * (fadeOutMs / 1000)), Math.floor(activeSamples / 2));
    const fadeOutStart = activeSamples - fadeOutSamples;
    for (let k = 0; k < fadeOutSamples; k++) {
      cleaned[fadeOutStart + k] *= 0.5 * (1 + Math.cos(Math.PI * (k / fadeOutSamples)));
    }
    cleaned[activeSamples - 1] = 0.0;
  }

  return cleaned;
}

/**
 * Dekodiert Gemini-TTS-Audiodaten (16-Bit PCM oder Containerformat wie WAV/MP3)
 * in ein sauberes, von Endrauschen befreites AudioBuffer-Objekt.
 */
async function decodeGeminiAudioToCleanAudioBuffer(audioCtx, audioChunksBase64, mimeType = 'audio/L16;rate=24000') {
  const byteChunks = audioChunksBase64.map(base64ToUint8Array);
  const bytes = concatUint8Arrays(byteChunks);

  if (bytes.length === 0) {
    throw new Error('Leerer Audiostrom empfangen.');
  }

  const isRiffWav = bytes.length >= 4 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
  const isContainerFormat = isRiffWav || /audio\/(wav|wave|x-wav|mp3|mpeg|ogg|webm|aac|flac|mp4)/i.test(mimeType);

  if (isContainerFormat) {
    const decoded = await audioCtx.decodeAudioData(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    const cleanedBuffer = audioCtx.createBuffer(decoded.numberOfChannels, decoded.length, decoded.sampleRate);
    let minCleanLen = decoded.length;
    const cleanedChannels = [];
    for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
      const chCleaned = cleanAndTrimFloat32SpeechSamples(decoded.getChannelData(ch), decoded.sampleRate);
      cleanedChannels.push(chCleaned);
      minCleanLen = Math.min(minCleanLen, chCleaned.length);
    }
    const finalBuf = audioCtx.createBuffer(decoded.numberOfChannels, minCleanLen, decoded.sampleRate);
    for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
      finalBuf.getChannelData(ch).set(cleanedChannels[ch].subarray(0, minCleanLen));
    }
    return finalBuf;
  }

  // Raw 16-Bit PCM
  const rateMatch = mimeType.match(/rate=(\d+)/i);
  const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
  const channelsMatch = mimeType.match(/channels=(\d+)/i);
  const numChannels = channelsMatch ? Math.max(1, parseInt(channelsMatch[1], 10)) : 1;
  const littleEndian = !/endianness\s*=\s*big/i.test(mimeType);

  const bytesPerFrame = 2 * numChannels;
  const validBytes = bytes.length - (bytes.length % bytesPerFrame);
  const totalFrames = validBytes / bytesPerFrame;

  if (totalFrames <= 0) {
    throw new Error('Leerer PCM-Audiostrom empfangen.');
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, validBytes);
  const monoSamples = new Float32Array(totalFrames);

  for (let i = 0; i < totalFrames; i++) {
    if (numChannels === 1) {
      monoSamples[i] = view.getInt16(i * 2, littleEndian) / 32768.0;
    } else {
      let acc = 0;
      for (let ch = 0; ch < numChannels; ch++) {
        acc += view.getInt16((i * numChannels + ch) * 2, littleEndian) / 32768.0;
      }
      monoSamples[i] = acc / numChannels;
    }
  }

  const cleanedMono = cleanAndTrimFloat32SpeechSamples(monoSamples, sampleRate);
  const audioBuffer = audioCtx.createBuffer(1, cleanedMono.length, sampleRate);
  audioBuffer.getChannelData(0).set(cleanedMono);
  return audioBuffer;
}

/**
 * Trennt aktive Web-Audio-Nodes sauber, um Knacken oder Restrauschen auszuschließen.
 */
function cleanupActiveAudioNodes() {
  const streamSources = state.activeStreamingSources || [];
  state.activeStreamingSources = [];
  for (const s of streamSources) {
    try {
      s.onended = null;
      s.stop();
    } catch (e) {}
    try {
      s.disconnect();
    } catch (e) {}
  }
  const nodes = state.activeAudioNodes || [];
  state.activeAudioNodes = [];
  for (const node of nodes) {
    try {
      node.disconnect();
    } catch (e) {}
  }
  state.activeSourceNode = null;
  state.activeGainNode = null;
  state.activeAnalyserNode = null;
  cleanupActiveHtmlAudio();
}

function cleanupActiveHtmlAudio() {
  if (state.activeHtmlAudio) {
    try {
      state.activeHtmlAudio.onended = null;
      state.activeHtmlAudio.onerror = null;
      state.activeHtmlAudio.pause();
      state.activeHtmlAudio.src = '';
    } catch (e) {}
    state.activeHtmlAudio = null;
  }
  if (state.activeHtmlAudioUrl) {
    try { URL.revokeObjectURL(state.activeHtmlAudioUrl); } catch (e) {}
    state.activeHtmlAudioUrl = null;
  }
}

/**
 * Stoppt laufende KI-Sprachausgabe & laufende TTS-Netzwerkanfragen sauber.
 */
function stopCustomerAudio() {
  state.ttsRequestSeq++;
  state.isAiSpeaking = false;
  cleanupActiveHtmlAudio();

  if (state.handsFreeResumeTimerId) {
    clearTimeout(state.handsFreeResumeTimerId);
    state.handsFreeResumeTimerId = null;
  }

  if (state.browserFallbackTimerId) {
    clearTimeout(state.browserFallbackTimerId);
    state.browserFallbackTimerId = null;
  }

  if (state.browserStartWatchdogId) {
    clearTimeout(state.browserStartWatchdogId);
    state.browserStartWatchdogId = null;
  }
  state.activeUtterance = null;

  if (state.activePrefetchController) {
    try { state.activePrefetchController.abort(); } catch (e) {}
    state.activePrefetchController = null;
  }

  if (state.activeTtsAbortController) {
    try {
      state.activeTtsAbortController.abort();
    } catch (e) {}
    state.activeTtsAbortController = null;
  }

  if (state.activeSourceNode) {
    const src = state.activeSourceNode;
    const gain = state.activeGainNode;
    const ctx = state.ttsAudioCtx;
    const extraSources = (state.activeStreamingSources || []).filter(s => s !== src);
    state.activeStreamingSources = [];
    for (const extra of extraSources) {
      try { extra.onended = null; extra.stop(); } catch (e) {}
      try { extra.disconnect(); } catch (e) {}
    }
    try {
      src.onended = null;
      if (gain && ctx && ctx.state === 'running') {
        const now = ctx.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), now);
        gain.gain.linearRampToValueAtTime(0.0, now + 0.025);
        src.stop(now + 0.03);
        setTimeout(() => {
          if (state.activeSourceNode !== src) {
            try { src.disconnect(); } catch (e) {}
            try { gain.disconnect(); } catch (e) {}
          }
        }, 60);
      } else {
        src.stop();
        cleanupActiveAudioNodes();
      }
    } catch (e) {
      cleanupActiveAudioNodes();
    }
    state.activeSourceNode = null;
    state.activeGainNode = null;
  } else {
    cleanupActiveAudioNodes();
  }

  if ('speechSynthesis' in window) {
    try {
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
        state.lastSpeechCancelAt = Date.now();
      }
    } catch (e) {}
  }

  setAvatarSpeakingVisuals(false);
  resetMessagePlayButtons();
}

/**
 * Wird exakt dann aufgerufen, wenn die Kundenstimme fertig gesprochen hat.
 * Aktiviert im aktiven Freisprech-Modus automatisch das Mikrofon des Azubis!
 */
function onCustomerSpeechFinished(triggerHandsFreeNextTurn = true) {
  state.isAiSpeaking = false;
  state.activeUtterance = null;
  cleanupActiveAudioNodes();
  setAvatarSpeakingVisuals(false);
  resetMessagePlayButtons();

  const customer = getCurrentCustomer();
  const profile = customerVoiceProfiles[customer.id] || customerVoiceProfiles.bergmann;

  if (state.pendingWalkoutReaction) {
    const walkoutText = state.pendingWalkoutReaction;
    state.pendingWalkoutReaction = null;
    if (typeof triggerCustomerWalkoutEvaluation === 'function') {
      triggerCustomerWalkoutEvaluation(walkoutText);
    }
    return;
  }

  // Prüfen, ob ein Modal offen ist (z. B. Auswertungs-Modal)
  const evalOpen = !document.getElementById('evaluationModal').classList.contains('hidden');
  const settingsOpen = !document.getElementById('settingsModal').classList.contains('hidden');

  if (triggerHandsFreeNextTurn && state.handsFreeActive && !evalOpen && !settingsOpen && !state.isGenerating) {
    if (state.handsFreeResumeTimerId) {
      clearTimeout(state.handsFreeResumeTimerId);
    }
    // Kurze Hardware-Pause (140ms), damit Audio-Ausgang vor Mikrofon-Aktivierung sauber schließt
    state.handsFreeResumeTimerId = setTimeout(() => {
      state.handsFreeResumeTimerId = null;
      const evalStillClosed = document.getElementById('evaluationModal').classList.contains('hidden');
      const settingsStillClosed = document.getElementById('settingsModal').classList.contains('hidden');
      if (state.handsFreeActive && !state.isAiSpeaking && !state.isGenerating && evalStillClosed && settingsStillClosed) {
        if (state.liveSession && !state.liveSession.closedManually) {
          if (state.liveSession.setupComplete) {
            enableLiveListeningUi(state.liveSession);
          } else {
            state.liveSession.pendingStartListening = true;
          }
        } else {
          startContinuousListening();
        }
      }
    }, 140);
  } else {
    updateTurnStatusUI(
      state.handsFreeActive ? 'paused' : 'idle',
      state.handsFreeActive ? 'Freisprech-Dialog pausiert' : `Bereit (${profile.voiceName})`
    );
  }
}

/**
 * Wählt die bestmögliche deutsche Browser-Stimme (für Offline-Modus / Notfall-Fallback).
 * Bevorzugt verlässliche lokale Systemstimmen (z. B. macOS Anna/Helena/Markus) und
 * meidet fehleranfällige macOS-Novelty-/Siri-Stimmen sowie entfernte Cloud-Stimmen.
 */
function selectBestGermanBrowserVoice() {
  if (!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices() || [];
  const germanVoices = voices.filter(v =>
    v.lang &&
    v.lang.toLowerCase().startsWith('de') &&
    !state.failedBrowserVoiceNames?.has(v.name)
  );
  if (germanVoices.length === 0) return null;

  const noveltyOrSiri = /(eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley|jester|siri|albert|bad news|bahh|bells|boing|bubbles|cellos|good news|organ|superstar|trinoids|whisper|wobble|zarvox)/i;

  const scoreVoice = (v) => {
    const name = (v.name || '').toLowerCase();
    let score = 0;
    if (v.localService) score += 60;
    if (v.lang.toLowerCase() === 'de-de') score += 15;
    if (v.default) score += 12;
    if (noveltyOrSiri.test(name)) score -= 80;
    if (name.includes('anna') || name.includes('petra') || name.includes('helena') || name.includes('markus') || name.includes('yannick') || name.includes('katrin') || name.includes('stefan') || name.includes('martin') || name.includes('vicki')) {
      score += 45;
    }
    if (name.includes('enhanced') || name.includes('premium') || name.includes('natural')) score += 20;
    if (name.includes('google deutsch')) score += 5;
    return score;
  };

  germanVoices.sort((a, b) => scoreVoice(b) - scoreVoice(a));
  return germanVoices[0];
}

/**
 * Notfall-Fallback auf die beste verfügbare deutsche Browser-Stimme,
 * falls kein API-Key hinterlegt ist oder alle Gemini-TTS-Modelle unerreichbar sind.
 * Vermeidet synchrones cancel()+speak() (bekannter macOS/Chrome-Bug, der Ton stumm schaltet).
 */
function speakWithCleanBrowserFallback(cleanText, triggerHandsFreeNextTurn = true, requestId = state.ttsRequestSeq) {
  if (requestId !== state.ttsRequestSeq) return;

  if (!state.voiceOutputEnabled || !('speechSynthesis' in window)) {
    if (!('speechSynthesis' in window)) {
      showChatNotice('error', 'Dieser Browser unterstützt keine lokale Sprachausgabe. Bitte Google Gemini API-Key hinterlegen.');
    }
    onCustomerSpeechFinished(triggerHandsFreeNextTurn);
    return;
  }

  if (state.browserFallbackTimerId) {
    clearTimeout(state.browserFallbackTimerId);
    state.browserFallbackTimerId = null;
  }
  if (state.browserStartWatchdogId) {
    clearTimeout(state.browserStartWatchdogId);
    state.browserStartWatchdogId = null;
  }

  let finished = false;
  let started = false;
  let retriedWithoutVoice = false;
  let chosenVoiceName = null;
  let lastSpeechErr = '';

  const finishOnce = () => {
    if (finished || requestId !== state.ttsRequestSeq) return;
    finished = true;
    clearTimeout(safetyTimer);
    if (state.browserStartWatchdogId) {
      clearTimeout(state.browserStartWatchdogId);
      state.browserStartWatchdogId = null;
    }
    state.activeUtterance = null;
    if (!started) {
      const reason = lastSpeechErr ? ` (${lastSpeechErr})` : ' (Browser-Sprachdienst hat nicht geantwortet)';
      showChatNotice('error', `Browser-Sprachausgabe blieb stumm${reason}. Prüfe macOS System-Ton / Chrome Tab-Stummschaltung, klicke „🔔 Ton-Test“ oder hinterlege oben rechts einen Gemini API-Key.`);
    }
    onCustomerSpeechFinished(triggerHandsFreeNextTurn);
  };

  // Schutz gegen bekannten Chrome-speechSynthesis-Hänger bei fehlendem onend
  const estimatedMs = Math.max(4500, Math.min(25000, cleanText.length * 115 + 3200));
  const safetyTimer = setTimeout(finishOnce, estimatedMs);

  const dispatchUtterance = (useSelectedVoice) => {
    if (finished || requestId !== state.ttsRequestSeq) return;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'de-DE';
    utterance.rate = 0.98;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    chosenVoiceName = null;
    if (useSelectedVoice) {
      const bestVoice = selectBestGermanBrowserVoice();
      if (bestVoice) {
        utterance.voice = bestVoice;
        chosenVoiceName = bestVoice.name;
      }
    }

    state.activeUtterance = utterance;

    utterance.onstart = () => {
      if (requestId !== state.ttsRequestSeq) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
        return;
      }
      started = true;
      if (state.browserStartWatchdogId) {
        clearTimeout(state.browserStartWatchdogId);
        state.browserStartWatchdogId = null;
      }
      state.isAiSpeaking = true;
      setAvatarSpeakingVisuals(true);
      updateTurnStatusUI('speaking', `Kunde spricht (${chosenVoiceName || 'System-Stimme'})…`);
    };

    utterance.onend = finishOnce;
    utterance.onerror = (ev) => {
      lastSpeechErr = ev?.error || 'unknown';
      if (chosenVoiceName) state.failedBrowserVoiceNames?.add(chosenVoiceName);
      if (!started && useSelectedVoice && !retriedWithoutVoice && requestId === state.ttsRequestSeq) {
        retriedWithoutVoice = true;
        dispatchUtterance(false);
        return;
      }
      finishOnce();
    };

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      lastSpeechErr = e?.message || 'speak-exception';
      finishOnce();
      return;
    }

    // Start-Watchdog: Falls ausgewählte Stimme stumm bleibt -> auf OS-Standardstimme wechseln
    if (useSelectedVoice && chosenVoiceName && !retriedWithoutVoice) {
      state.browserStartWatchdogId = setTimeout(() => {
        state.browserStartWatchdogId = null;
        if (!started && !finished && requestId === state.ttsRequestSeq && !window.speechSynthesis.speaking) {
          state.failedBrowserVoiceNames?.add(chosenVoiceName);
          retriedWithoutVoice = true;
          try {
            if (window.speechSynthesis.pending || window.speechSynthesis.speaking) {
              window.speechSynthesis.cancel();
            }
          } catch (e) {}
          setTimeout(() => dispatchUtterance(false), 70);
        }
      }, 900);
    }
  };

  const needsCancelDelay =
    window.speechSynthesis.speaking ||
    window.speechSynthesis.pending ||
    (Date.now() - (state.lastSpeechCancelAt || 0) < 120);

  if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
    try {
      window.speechSynthesis.cancel();
      state.lastSpeechCancelAt = Date.now();
    } catch (e) {}
  }

  updateTurnStatusUI('loading', 'Browser-Stimme startet…');

  if (needsCancelDelay) {
    state.browserFallbackTimerId = setTimeout(() => {
      state.browserFallbackTimerId = null;
      dispatchUtterance(true);
    }, 90);
  } else {
    dispatchUtterance(true);
  }
}

/**
 * Hilfsfunktion für abbrechbares Warten bei Retries/Backoff.
 */
function sleepWithAbort(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    let timer = null;
    const onAbort = () => {
      if (timer !== null) clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
    timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
  });
}

/**
 * Erstellt die priorisierte Liste verfügbarer Gemini-TTS-Modelle
 * (gesperrtes Gesprächsmodell -> gewähltes Modell -> erkannte API-TTS-Modelle -> bekannte Fallbacks).
 */
function getTtsCandidateModels() {
  const merged = [
    state.lockedConversationTtsModel,
    state.ttsModel || 'gemini-3.8-flash-tts',
    ...(state.discoveredTtsModels || []),
    ...FALLBACK_TTS_MODELS
  ];
  const unique = [];
  for (const m of merged) {
    if (m && !unique.includes(m) && !state.unavailableTtsModels.has(m)) {
      unique.push(m);
    }
  }
  const now = Date.now();
  const ready = unique.filter(m => (state.ttsModelCooldowns[m] || 0) <= now);
  const cooling = unique
    .filter(m => (state.ttsModelCooldowns[m] || 0) > now)
    .sort((a, b) => (state.ttsModelCooldowns[a] || 0) - (state.ttsModelCooldowns[b] || 0));
  return [...ready, ...cooling];
}

function buildGeminiTtsRequestBody(modelName, ttsText, voiceName, voiceDirective = null) {
  const styleDirective = voiceDirective || Object.values(customerVoiceProfiles).find(p => p.voiceName === voiceName)?.voiceDirective;
  const part = { text: ttsText };
  if (styleDirective && !state.modelsWithoutSpeechMeta?.has(modelName)) {
    part.speechMetadata = { style: styleDirective };
  }
  const speechConfig = {
    voiceConfig: {
      prebuiltVoiceConfig: { voiceName }
    }
  };
  if (!state.modelsWithoutLanguageCode?.has(modelName)) {
    speechConfig.languageCode = 'de-DE';
  }
  return {
    contents: [{
      role: 'user',
      parts: [part]
    }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig
    }
  };
}

/**
 * Parst SSE- oder JSON-Audio-Payloads und liefert Audio-Chunks sofort beim Eintreffen.
 */
async function requestSingleGeminiTts(modelName, ttsText, voiceName, outerSignal, onStreamChunk = null, voiceDirective = null) {
  if (outerSignal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const tryStreamEndpoint = !state.modelsWithoutTtsStream.has(modelName);
  const endpoints = tryStreamEndpoint
    ? [
        { mode: 'stream', url: `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse&key=${state.apiKey}` },
        { mode: 'unary', url: `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${state.apiKey}` }
      ]
    : [
        { mode: 'unary', url: `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${state.apiKey}` }
      ];

  for (let epIdx = 0; epIdx < endpoints.length; epIdx++) {
    const { mode, url } = endpoints[epIdx];
    const reqController = new AbortController();
    const onOuterAbort = () => reqController.abort();
    outerSignal?.addEventListener('abort', onOuterAbort, { once: true });
    const timeoutId = setTimeout(() => reqController.abort(), 15000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: reqController.signal,
        body: JSON.stringify(buildGeminiTtsRequestBody(modelName, ttsText, voiceName, voiceDirective))
      });

      if (!response.ok) {
        const rawErr = await response.text();
        let data = null;
        try { data = rawErr ? JSON.parse(rawErr) : null; } catch (e) {}
        const msg = data?.error?.message || `HTTP ${response.status} bei TTS-Anfrage`;
        const lowerMsg = msg.toLowerCase();

        // Falls speechMetadata oder languageCode von einem Modell nicht unterstützt wird -> sauber ohne warten wiederholen
        if (response.status === 400 && (lowerMsg.includes('speechmetadata') || lowerMsg.includes('speech_metadata') || lowerMsg.includes('languagecode') || lowerMsg.includes('language_code') || lowerMsg.includes('unknown name') || lowerMsg.includes('cannot find field'))) {
          let strippedSomething = false;
          if ((lowerMsg.includes('language') || lowerMsg.includes('unknown name') || lowerMsg.includes('cannot find field')) && !state.modelsWithoutLanguageCode?.has(modelName)) {
            state.modelsWithoutLanguageCode?.add(modelName);
            strippedSomething = true;
          }
          if (!state.modelsWithoutSpeechMeta?.has(modelName)) {
            state.modelsWithoutSpeechMeta?.add(modelName);
            strippedSomething = true;
          }
          if (strippedSomething) {
            epIdx--;
            continue;
          }
        }

        // Falls streamGenerateContent für dieses Modell nicht unterstützt wird -> sofort unary testen
        if (mode === 'stream' && epIdx === 0 && (response.status === 400 || response.status === 404) && (lowerMsg.includes('stream') || lowerMsg.includes('not supported') || lowerMsg.includes('not found'))) {
          state.modelsWithoutTtsStream.add(modelName);
          continue;
        }

        const err = new Error(msg);
        err.status = response.status;
        err.apiStatus = data?.error?.status || '';
        const retryAfter = response.headers.get('retry-after');
        if (retryAfter) {
          const sec = Number(retryAfter);
          if (!Number.isNaN(sec) && sec > 0) {
            err.retryAfterMs = Math.min(10000, sec * 1000);
          }
        }
        throw err;
      }

      const collectedChunks = [];
      let detectedMime = 'audio/L16;rate=24000';
      let lastFinishReason = '';
      let lastBlockReason = '';

      const processPayloadObject = (obj) => {
        if (!obj) return;
        const candidate = obj?.candidates?.[0];
        const isFinalCandidate = Boolean(candidate?.finishReason);
        if (candidate?.finishReason) lastFinishReason = candidate.finishReason;
        if (obj?.promptFeedback?.blockReason) lastBlockReason = obj.promptFeedback.blockReason;
        const parts = candidate?.content?.parts || [];
        for (let partIdx = 0; partIdx < parts.length; partIdx++) {
          const part = parts[partIdx];
          if (part?.inlineData?.data) {
            if (part.inlineData.mimeType) detectedMime = part.inlineData.mimeType;
            collectedChunks.push(part.inlineData.data);
            const isFinalPart = isFinalCandidate && partIdx === parts.length - 1;
            onStreamChunk?.(part.inlineData.data, detectedMime, isFinalPart);
          }
        }
      };

      // 1. Live SSE Stream (schnellste TTFA: Audio-Chunks kommen schon während der Generierung)
      if (response.body && typeof response.body.getReader === 'function') {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let sawSsePrefix = false;

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() || '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            sawSsePrefix = true;
            const jsonStr = trimmed.slice(5).trim();
            if (!jsonStr || jsonStr === '[DONE]') continue;
            try { processPayloadObject(JSON.parse(jsonStr)); } catch (e) {}
          }
        }
        if (buffer.trim()) {
          const rem = buffer.trim();
          if (rem.startsWith('data:')) {
            sawSsePrefix = true;
            const jsonStr = rem.slice(5).trim();
            if (jsonStr && jsonStr !== '[DONE]') {
              try { processPayloadObject(JSON.parse(jsonStr)); } catch (e) {}
            }
          } else if (!sawSsePrefix) {
            try { processPayloadObject(JSON.parse(rem)); } catch (e) {}
          }
        }
      } else {
        // 2. Fallback ohne ReadableStream (z. B. Tests)
        const rawBody = await response.text();
        if (rawBody.includes('\ndata:') || rawBody.trim().startsWith('data:')) {
          for (const line of rawBody.split(/\r?\n/)) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const jsonStr = trimmed.slice(5).trim();
            if (!jsonStr || jsonStr === '[DONE]') continue;
            try { processPayloadObject(JSON.parse(jsonStr)); } catch (e) {}
          }
        } else {
          let data = null;
          try {
            data = rawBody ? JSON.parse(rawBody) : null;
          } catch (parseErr) {
            const err = new Error(`Ungültige Serverantwort (HTTP ${response.status})`);
            err.status = response.status;
            throw err;
          }
          processPayloadObject(data);
        }
      }

      if (collectedChunks.length === 0) {
        const finishReason = lastFinishReason || lastBlockReason || 'EMPTY';
        const err = new Error(`Keine Audiodaten von Gemini TTS erhalten (${finishReason}).`);
        err.isEmptyAudio = true;
        err.finishReason = finishReason;
        throw err;
      }

      return {
        audioChunksBase64: collectedChunks,
        mimeType: detectedMime,
        modelUsed: modelName
      };
    } catch (err) {
      if (err.name === 'AbortError' && !outerSignal?.aborted) {
        const timeoutErr = new Error('Zeitüberschreitung bei TTS-Anfrage (15s)');
        timeoutErr.isTimeout = true;
        throw timeoutErr;
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
      outerSignal?.removeEventListener('abort', onOuterAbort);
    }
  }
}

/**
 * Lädt Gemini-TTS-Audio mit automatischen Retries, Backoff und Modell-Fallback
 * über alle verfügbaren Gemini-TTS-Modelle, damit nie grundlos auf die Roboterstimme gewechselt wird.
 */
async function fetchGeminiTtsWithResilience(ttsText, voiceName, signal, onRetryStatus, onStreamChunk = null, voiceDirective = null) {
  let candidates = getTtsCandidateModels();

  // Nicht blockierend vor der ersten Antwort: Falls nötig nur still im Hintergrund laden
  if (!state.modelsDiscoveredThisSession && state.apiKey) {
    discoverAvailableGeminiModels(state.apiKey, 4000).catch(() => {});
  }

  let lastError = null;
  let discoveredOnError = false;

  for (let mIdx = 0; mIdx < candidates.length; mIdx++) {
    const modelName = candidates[mIdx];
    const isLockedPrimary = Boolean(state.lockedConversationTtsModel && mIdx === 0 && modelName === state.lockedConversationTtsModel);
    const maxAttempts = isLockedPrimary ? 3 : (candidates.length > 1 ? 2 : 3);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

      let streamedInAttempt = false;
      try {
        const result = await requestSingleGeminiTts(modelName, ttsText, voiceName, signal, (chunkB64, mimeType, isFinalChunk) => {
          streamedInAttempt = true;
          onStreamChunk?.(chunkB64, mimeType, isFinalChunk);
        }, voiceDirective);
        if (result?.modelUsed && !signal?.aborted) {
          state.lockedConversationTtsModel = result.modelUsed;
          delete state.ttsModelCooldowns[result.modelUsed];
        }
        return result;
      } catch (err) {
        if (err.name === 'AbortError' || signal.aborted) throw err;
        lastError = err;

        // Falls bereits Live-Chunks abgespielt wurden, nicht nochmal dasselbe Segment von vorn beginnen
        if (streamedInAttempt) throw err;

        const msg = String(err.message || '').toLowerCase();
        // Ungültiger API-Key -> sofort abbrechen
        if (err.status === 401 || err.status === 403 || msg.includes('api key not valid') || msg.includes('permission_denied')) {
          err.isFatalAuth = true;
          throw err;
        }

        // Modell existiert nicht oder unterstützt kein AUDIO -> dauerhaft für Session überspringen
        if (err.status === 404 || (err.status === 400 && (msg.includes('not found') || msg.includes('not supported') || msg.includes('modality')))) {
          state.unavailableTtsModels.add(modelName);
          if (!discoveredOnError && !state.modelsDiscoveredThisSession) {
            discoveredOnError = true;
            try {
              await discoverAvailableGeminiModels(state.apiKey, 4000);
              const refreshed = getTtsCandidateModels();
              for (const rm of refreshed) {
                if (!candidates.includes(rm)) candidates.push(rm);
              }
            } catch (e) {}
          }
          break; // Direkt zum nächsten TTS-Modell
        }

        // Rate-Limit (429): Bei Fallback-Kandidaten oder langer Wartezeit sofort zum nächsten Modell wechseln
        const isRateLimit = err.status === 429 || err.apiStatus === 'RESOURCE_EXHAUSTED';
        if (isRateLimit) {
          const hasFallbackCandidate = mIdx < candidates.length - 1;
          if (hasFallbackCandidate && (!isLockedPrimary || (err.retryAfterMs && err.retryAfterMs > 2500))) {
            state.ttsModelCooldowns[modelName] = Date.now() + Math.max(20000, err.retryAfterMs || 0);
            break;
          }
          if (attempt < maxAttempts - 1) {
            onRetryStatus?.();
            const rateDelayMs = Math.min(err.retryAfterMs || (attempt === 0 ? 350 : 800), 2500);
            await sleepWithAbort(rateDelayMs, signal);
            continue;
          }
          state.ttsModelCooldowns[modelName] = Date.now() + 20000;
          break;
        }

        // Bei SAFETY bringt Retry meist nichts -> nächstes Modell/Ende
        if (err.finishReason === 'SAFETY' || err.finishReason === 'PROHIBITED_CONTENT') {
          break;
        }

        if (err.isTimeout && !isLockedPrimary && mIdx < candidates.length - 1) {
          break;
        }

        const isRetryable = err.status >= 500 || err.isEmptyAudio || err.isTimeout || !err.status;
        if (!isRetryable || attempt >= maxAttempts - 1) {
          break;
        }

        onRetryStatus?.();
        const delayMs = err.retryAfterMs || (420 * Math.pow(2, attempt) + Math.floor(Math.random() * 150));
        await sleepWithAbort(delayMs, signal);
      }
    }
  }

  throw lastError || new Error('Gemini TTS konnte keine Audiodaten erzeugen.');
}

/**
 * Erstellt einen Streaming-Audio-Player mit Studio-Filterkette (60Hz–11.4kHz) & Lookahead-1
 * Endrauschen-Trimming, sodass TTS-Chunks sauber gepuffert und natürlich klingen.
 */
function createProgressivePcmPlayer(audioCtx, voiceName, options = {}) {
  const {
    messageId = null,
    triggerHandsFreeNextTurn = true,
    requestId = state.ttsRequestSeq,
    onPlaybackEnd = null,
    continuousStream = false
  } = options;
  const canFilterStream = typeof audioCtx.createBiquadFilter === 'function' && typeof audioCtx.createGain === 'function';
  let hpFilter = null;
  let lpFilter = null;
  let gainNode = null;
  let pipelineReady = false;
  let abortedContainer = false;
  let oddCarryByte = null;
  let detectedSampleRate = 24000;
  let detectedChannels = 1;
  let littleEndian = true;
  let playedAny = false;
  let chunkCount = 0;
  let firstBuffer = null;
  let nextPlayTime = 0;
  let lastSource = null;
  let lastSourceEnded = false;
  let finalScheduled = false;
  let endedHandled = false;
  let audioEndWatchdog = null;
  let clockWatchdog = null;
  let startClock = 0;
  let peakAmplitude = 0;
  let totalDurationSec = 0;
  const isColdStartStream = !state._firstStreamPlayed;
  const targetPrebufferSec = isColdStartStream ? 0.16 : (continuousStream ? 0.06 : 0);
  let prebufferStarted = targetPrebufferSec <= 0;
  let pendingStartSlices = [];
  let pendingStartDuration = 0;
  let prebufferFlushTimer = null;

  const ensureChain = () => {
    if (pipelineReady || !canFilterStream) return;
    hpFilter = audioCtx.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.value = 60;
    hpFilter.Q.value = 0.707;

    lpFilter = audioCtx.createBiquadFilter();
    lpFilter.type = 'lowpass';
    lpFilter.frequency.value = 11400;
    lpFilter.Q.value = 0.707;

    gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(1.0, audioCtx.currentTime);

    hpFilter.connect(lpFilter);
    lpFilter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    let analyser = null;
    try {
      analyser = typeof audioCtx.createAnalyser === 'function' ? audioCtx.createAnalyser() : null;
      if (analyser) {
        analyser.fftSize = 256;
        gainNode.connect(analyser);
        state.activeAnalyserNode = analyser;
      }
    } catch (e) {
      analyser = null;
    }
    state.activeAudioNodes = analyser ? [hpFilter, lpFilter, gainNode, analyser] : [hpFilter, lpFilter, gainNode];
    state.activeGainNode = gainNode;
    state.activeStreamingSources = [];
    pipelineReady = true;
  };

  const bytesToMonoFloat32 = (bytes) => {
    const bytesPerFrame = 2 * detectedChannels;
    const validBytes = bytes.length - (bytes.length % bytesPerFrame);
    const totalFrames = validBytes / bytesPerFrame;
    if (totalFrames <= 0) return null;
    const view = new DataView(bytes.buffer, bytes.byteOffset, validBytes);
    const mono = new Float32Array(totalFrames);
    for (let i = 0; i < totalFrames; i++) {
      if (detectedChannels === 1) {
        mono[i] = Math.max(-1.0, Math.min(1.0, view.getInt16(i * 2, littleEndian) / 32768.0));
      } else {
        let acc = 0;
        for (let ch = 0; ch < detectedChannels; ch++) {
          acc += view.getInt16((i * detectedChannels + ch) * 2, littleEndian) / 32768.0;
        }
        mono[i] = Math.max(-1.0, Math.min(1.0, acc / detectedChannels));
      }
    }
    return mono;
  };

  const finishAudioPlayback = () => {
    if (endedHandled) return;
    endedHandled = true;
    if (audioEndWatchdog !== null) {
      clearTimeout(audioEndWatchdog);
      audioEndWatchdog = null;
    }
    if (clockWatchdog !== null) {
      clearTimeout(clockWatchdog);
      clockWatchdog = null;
    }
    if (prebufferFlushTimer !== null) {
      clearTimeout(prebufferFlushTimer);
      prebufferFlushTimer = null;
    }
    if (requestId === state.ttsRequestSeq) {
      if (typeof onPlaybackEnd === 'function') {
        onPlaybackEnd(nextPlayTime);
      } else {
        onCustomerSpeechFinished(triggerHandsFreeNextTurn);
      }
    }
  };

  const armCompletionOnLastSource = () => {
    const remainingMs = Math.max(400, Math.ceil((nextPlayTime - audioCtx.currentTime) * 1000) + 1800);
    audioEndWatchdog = setTimeout(finishAudioPlayback, remainingMs);
    if (lastSource) {
      lastSource.onended = finishAudioPlayback;
    }
  };

  const scheduleSlice = (samplesFloat32, isFinalSlice = false) => {
    if (!samplesFloat32 || samplesFloat32.length === 0 || requestId !== state.ttsRequestSeq) return;
    ensureChain();
    if (!pipelineReady) return;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    const buf = audioCtx.createBuffer(1, samplesFloat32.length, detectedSampleRate);
    buf.getChannelData(0).set(samplesFloat32);

    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.connect(hpFilter);

    const now = audioCtx.currentTime;
    if (!playedAny) {
      startClock = now;
      nextPlayTime = now + (isColdStartStream ? 0.15 : 0.08);
      state._firstStreamPlayed = true;
      gainNode.gain.setValueAtTime(1.0, now);
      beginVoicePlaybackUi(voiceName, messageId);
      if (!continuousStream && canUseHtmlAudioPlayback() && clockWatchdog === null) {
        clockWatchdog = setTimeout(() => {
          clockWatchdog = null;
          if (endedHandled || requestId !== state.ttsRequestSeq) return;
          if (audioCtx.currentTime - startClock < 0.02) {
            setPreferHtmlAudioPlayback(true);
          }
        }, 240);
      }
    } else if (nextPlayTime < now + 0.012) {
      nextPlayTime = now + 0.028;
    }

    const startAt = nextPlayTime;
    nextPlayTime = startAt + buf.duration;
    totalDurationSec += buf.duration;
    for (let i = 0; i < samplesFloat32.length; i += 4) {
      const absVal = Math.abs(samplesFloat32[i]);
      if (absVal > peakAmplitude) peakAmplitude = absVal;
    }
    state.activeSourceNode = src;
    state.activeStreamingSources.push(src);
    lastSource = src;
    lastSourceEnded = false;
    playedAny = true;
    chunkCount++;
    if (chunkCount === 1) firstBuffer = buf;

    if (isFinalSlice) {
      finalScheduled = true;
      armCompletionOnLastSource();
    } else {
      src.onended = () => {
        if (lastSource === src) lastSourceEnded = true;
      };
    }
    src.start(startAt);
  };

  const flushPrebufferedSlices = (isFinalCall = false) => {
    if (prebufferFlushTimer !== null) {
      clearTimeout(prebufferFlushTimer);
      prebufferFlushTimer = null;
    }
    prebufferStarted = true;
    if (pendingStartSlices.length === 0) return;
    let mergedLen = 0;
    for (const sl of pendingStartSlices) mergedLen += sl.length;
    const merged = new Float32Array(mergedLen);
    let offset = 0;
    for (const sl of pendingStartSlices) {
      merged.set(sl, offset);
      offset += sl.length;
    }
    pendingStartSlices = [];
    pendingStartDuration = 0;
    const fadeSamples = Math.min(Math.floor(detectedSampleRate * 0.012), merged.length);
    for (let i = 0; i < fadeSamples; i++) {
      merged[i] *= i / Math.max(1, fadeSamples);
    }
    scheduleSlice(merged, Boolean(isFinalCall));
  };

  return {
    get isContainerFallback() { return abortedContainer; },
    get hasStartedPlayback() { return playedAny; },
    get peakAmplitude() { return peakAmplitude; },
    get totalDurationSec() { return totalDurationSec; },
    getSinglePlayedBuffer() { return chunkCount === 1 ? firstBuffer : null; },
    pushChunk(b64, mimeType, isFinalChunk = false) {
      if (abortedContainer || !canFilterStream || requestId !== state.ttsRequestSeq) return;
      let raw = base64ToUint8Array(b64);
      if (!raw || raw.length === 0) return;
      const isRiff = raw.length >= 4 && raw[0] === 0x52 && raw[1] === 0x49 && raw[2] === 0x46 && raw[3] === 0x46;
      if (isRiff || /audio\/(wav|wave|x-wav|mp3|mpeg|ogg|webm|aac|flac|mp4)/i.test(mimeType || '')) {
        abortedContainer = true;
        return;
      }
      const rateMatch = (mimeType || '').match(/rate=(\d+)/i);
      if (rateMatch) detectedSampleRate = parseInt(rateMatch[1], 10);
      const chMatch = (mimeType || '').match(/channels=(\d+)/i);
      if (chMatch) detectedChannels = Math.max(1, parseInt(chMatch[1], 10));
      littleEndian = !/endianness\s*=\s*big/i.test(mimeType || '');

      if (oddCarryByte !== null) {
        const combined = new Uint8Array(1 + raw.length);
        combined[0] = oddCarryByte;
        combined.set(raw, 1);
        raw = combined;
        oddCarryByte = null;
      }
      const frameBytes = 2 * detectedChannels;
      const rem = raw.length % frameBytes;
      if (rem > 0) {
        oddCarryByte = raw[raw.length - 1];
        raw = raw.subarray(0, raw.length - rem);
      }
      if (raw.length === 0) return;

      const mono = bytesToMonoFloat32(raw);
      if (!mono) return;

      const isFirst = !playedAny;
      const shouldTrimStart = isFirst && !continuousStream;
      const prepared = (isFirst || isFinalChunk)
        ? cleanAndTrimFloat32SpeechSamples(mono, detectedSampleRate, {
            trimLeading: shouldTrimStart,
            fadeInMs: isFirst ? 6 : 0,
            trimTrailing: Boolean(isFinalChunk),
            fadeOutMs: isFinalChunk ? 85 : 0
          })
        : mono;

      if (!prebufferStarted) {
        pendingStartSlices.push(prepared);
        pendingStartDuration += prepared.length / detectedSampleRate;
        if (isFinalChunk || pendingStartDuration >= targetPrebufferSec) {
          flushPrebufferedSlices(Boolean(isFinalChunk));
        } else if (prebufferFlushTimer === null) {
          prebufferFlushTimer = setTimeout(() => {
            prebufferFlushTimer = null;
            if (!endedHandled && requestId === state.ttsRequestSeq && !prebufferStarted) {
              flushPrebufferedSlices(false);
            }
          }, 180);
        }
        return;
      }

      scheduleSlice(prepared, Boolean(isFinalChunk));
    },
    finish() {
      if (!prebufferStarted && pendingStartSlices.length > 0 && !abortedContainer && requestId === state.ttsRequestSeq) {
        flushPrebufferedSlices(false);
      }
      if (abortedContainer || !playedAny || requestId !== state.ttsRequestSeq) return false;
      if (finalScheduled) return true;
      finalScheduled = true;
      if (gainNode) {
        try {
          const fadeStart = Math.max(audioCtx.currentTime, nextPlayTime - 0.035);
          gainNode.gain.setValueAtTime(1.0, fadeStart);
          gainNode.gain.linearRampToValueAtTime(0.0, Math.max(audioCtx.currentTime + 0.005, nextPlayTime));
        } catch (e) {}
      }
      if (lastSourceEnded) {
        finishAudioPlayback();
      } else {
        armCompletionOnLastSource();
      }
      return true;
    }
  };
}

function beginVoicePlaybackUi(voiceName, messageId = null) {
  setAvatarSpeakingVisuals(true);
  updateTurnStatusUI('speaking', `Kunde spricht (${voiceName})…`);
  if (messageId) {
    const msgBtn = document.getElementById(messageId);
    if (msgBtn) {
      msgBtn.innerHTML = '<span>⏹</span><span>Stopp</span>';
      msgBtn.classList.add('bg-amber-500/30', 'border-amber-400');
    }
  }
}

function encodeMonoFloat32ToWavBlob(samples, sampleRate = 24000) {
  const len = samples.length;
  const buffer = new ArrayBuffer(44 + len * 2);
  const view = new DataView(buffer);
  const writeAscii = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + len * 2, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(36, 'data');
  view.setUint32(40, len * 2, true);
  for (let i = 0; i < len; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, clamped < 0 ? Math.round(clamped * 32768) : Math.round(clamped * 32767), true);
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

function audioBufferToWavBlob(audioBuffer) {
  const chCount = audioBuffer.numberOfChannels || 1;
  const len = audioBuffer.length;
  if (chCount === 1) {
    return encodeMonoFloat32ToWavBlob(audioBuffer.getChannelData(0), audioBuffer.sampleRate || 24000);
  }
  const mono = new Float32Array(len);
  for (let ch = 0; ch < chCount; ch++) {
    const chData = audioBuffer.getChannelData(ch);
    for (let i = 0; i < len; i++) mono[i] += chData[i] / chCount;
  }
  return encodeMonoFloat32ToWavBlob(mono, audioBuffer.sampleRate || 24000);
}

function canUseHtmlAudioPlayback() {
  return typeof Blob !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function' && typeof Audio === 'function';
}

function setPreferHtmlAudioPlayback(enabled) {
  state.preferHtmlAudioPlayback = Boolean(enabled);
  try {
    localStorage.setItem('baeckermat_prefer_html_audio', state.preferHtmlAudioPlayback ? '1' : '0');
  } catch (e) {}
}

function playAudioBufferViaHtmlAudio(audioBuffer, voiceName, options = {}) {
  const { messageId = null, triggerHandsFreeNextTurn = true, requestId = state.ttsRequestSeq } = options;
  if (requestId !== state.ttsRequestSeq || !canUseHtmlAudioPlayback()) return false;

  cleanupActiveHtmlAudio();
  const wavBlob = audioBufferToWavBlob(audioBuffer);
  const url = URL.createObjectURL(wavBlob);
  const audioEl = new Audio(url);
  audioEl.volume = 1.0;

  state.activeHtmlAudio = audioEl;
  state.activeHtmlAudioUrl = url;
  beginVoicePlaybackUi(voiceName, messageId);

  let endedHandled = false;
  let audioEndWatchdog = null;
  const finishHtmlPlayback = (hadError = false) => {
    if (endedHandled) return;
    endedHandled = true;
    if (audioEndWatchdog !== null) {
      clearTimeout(audioEndWatchdog);
      audioEndWatchdog = null;
    }
    const isCurrent = state.activeHtmlAudio === audioEl && requestId === state.ttsRequestSeq;
    cleanupActiveHtmlAudio();
    if (isCurrent) {
      if (hadError) {
        showChatNotice('error', 'Audio-Ausgabe wurde blockiert. Bitte Chrome Tab-Ton und macOS Lautstärke prüfen.');
      }
      onCustomerSpeechFinished(triggerHandsFreeNextTurn);
    }
  };

  audioEndWatchdog = setTimeout(() => finishHtmlPlayback(false), Math.max(1500, Math.ceil((audioBuffer.duration || 0) * 1000) + 2000));
  audioEl.onended = () => finishHtmlPlayback(false);
  audioEl.onerror = () => finishHtmlPlayback(true);
  const playPromise = audioEl.play();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => finishHtmlPlayback(true));
  }
  return true;
}

/**
 * Spielt einen bereinigten AudioBuffer über Studio-Filter (60Hz–11.4kHz) & Gain-Hüllkurve ab.
 */
function playCleanAudioBuffer(audioCtx, audioBuffer, voiceName, options = {}) {
  const { messageId = null, triggerHandsFreeNextTurn = true, requestId = state.ttsRequestSeq } = options;
  if (requestId !== state.ttsRequestSeq) return;

  if (state.preferHtmlAudioPlayback && canUseHtmlAudioPlayback()) {
    playAudioBufferViaHtmlAudio(audioBuffer, voiceName, options);
    return;
  }

  const sourceNode = audioCtx.createBufferSource();
  sourceNode.buffer = audioBuffer;

  // Studio-Hochpass (60 Hz gegen Sub-Bass/DC) & transparenter Tiefpass (11,4 kHz für natürliche Konsonanten ohne Zischen)
  const hpFilter = audioCtx.createBiquadFilter();
  hpFilter.type = 'highpass';
  hpFilter.frequency.value = 60;
  hpFilter.Q.value = 0.707;

  const lpFilter = audioCtx.createBiquadFilter();
  lpFilter.type = 'lowpass';
  lpFilter.frequency.value = 11400;
  lpFilter.Q.value = 0.707;

  const gainNode = audioCtx.createGain();
  const now = audioCtx.currentTime;
  const duration = audioBuffer.duration;
  const endTime = now + duration;

  gainNode.gain.setValueAtTime(1.0, now);
  if (duration > 0.06) {
    gainNode.gain.setValueAtTime(1.0, Math.max(now, endTime - 0.030));
    gainNode.gain.linearRampToValueAtTime(0.0, Math.max(now + 0.01, endTime - 0.002));
  }

  sourceNode.connect(hpFilter);
  hpFilter.connect(lpFilter);
  lpFilter.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  let analyser = null;
  try {
    analyser = typeof audioCtx.createAnalyser === 'function' ? audioCtx.createAnalyser() : null;
    if (analyser) {
      analyser.fftSize = 256;
      gainNode.connect(analyser);
      state.activeAnalyserNode = analyser;
    }
  } catch (e) {
    analyser = null;
  }
  state.activeAudioNodes = analyser
    ? [sourceNode, hpFilter, lpFilter, gainNode, analyser]
    : [sourceNode, hpFilter, lpFilter, gainNode];

  state.activeSourceNode = sourceNode;
  state.activeGainNode = gainNode;

  beginVoicePlaybackUi(voiceName, messageId);

  let endedHandled = false;
  let audioEndWatchdog = null;
  let clockWatchdog = null;
  const disconnectNodes = () => {
    try { sourceNode.disconnect(); } catch (e) {}
    try { hpFilter.disconnect(); } catch (e) {}
    try { lpFilter.disconnect(); } catch (e) {}
    try { gainNode.disconnect(); } catch (e) {}
    if (analyser) {
      try { analyser.disconnect(); } catch (e) {}
      if (state.activeAnalyserNode === analyser) state.activeAnalyserNode = null;
    }
  };
  const finishAudioPlayback = () => {
    if (endedHandled) return;
    endedHandled = true;
    if (audioEndWatchdog !== null) {
      clearTimeout(audioEndWatchdog);
      audioEndWatchdog = null;
    }
    if (clockWatchdog !== null) {
      clearTimeout(clockWatchdog);
      clockWatchdog = null;
    }
    if (state.activeSourceNode === sourceNode && requestId === state.ttsRequestSeq) {
      onCustomerSpeechFinished(triggerHandsFreeNextTurn);
    } else {
      disconnectNodes();
    }
  };

  // Erkennt eingefrorene AudioContext-Hardware-Uhr unter macOS Chrome & wechselt automatisch auf <audio>-WAV
  if ((duration || 0) > 0.45 && canUseHtmlAudioPlayback()) {
    clockWatchdog = setTimeout(() => {
      clockWatchdog = null;
      if (endedHandled || requestId !== state.ttsRequestSeq || state.activeSourceNode !== sourceNode) return;
      if (audioCtx.currentTime - now < 0.02) {
        endedHandled = true;
        if (audioEndWatchdog !== null) {
          clearTimeout(audioEndWatchdog);
          audioEndWatchdog = null;
        }
        console.warn('AudioContext Hardware-Uhr steht still – wechsle automatisch auf HTMLAudioElement-WAV.');
        try { sourceNode.onended = null; sourceNode.stop(); } catch (e) {}
        disconnectNodes();
        state.activeSourceNode = null;
        state.activeGainNode = null;
        state.activeAudioNodes = [];
        setPreferHtmlAudioPlayback(true);
        if (state.ttsAudioCtx === audioCtx) {
          try { audioCtx.close?.().catch(() => {}); } catch (e) {}
          state.ttsAudioCtx = null;
        }
        playAudioBufferViaHtmlAudio(audioBuffer, voiceName, options);
      }
    }, 220);
  }

  // Sicherheits-Watchdog, falls onended im Browser durch Audio-Suspend ausbleibt
  audioEndWatchdog = setTimeout(() => {
    finishAudioPlayback();
  }, Math.max(1200, Math.ceil((duration || 0) * 1000) + 1800));

  sourceNode.onended = finishAudioPlayback;

  sourceNode.start(now);
}

function putTtsAudioCache(cacheKey, entry) {
  if (state.ttsAudioCache.size >= 40) {
    const oldestKey = state.ttsAudioCache.keys().next().value;
    if (oldestKey !== undefined) state.ttsAudioCache.delete(oldestKey);
  }
  state.ttsAudioCache.set(cacheKey, entry);
}

/**
 * Hauptfunktion für die Sprachausgabe über Gemini TTS + Web Audio API.
 */
async function resolveAudioBufferForText(audioCtx, cleanText, voiceName, signal, onRetryStatus, prefetchedPromise = null) {
  const cacheKey = `${voiceName}::${cleanText}`;
  const cached = state.ttsAudioCache.get(cacheKey);
  if (cached && cached.audioBuffer && cached.ctx === audioCtx) {
    return { audioBuffer: cached.audioBuffer, modelUsed: cached.modelUsed };
  }

  let ttsResult = null;
  if (prefetchedPromise) {
    const prefRes = await prefetchedPromise;
    if (prefRes && !prefRes.__prefetchError) {
      ttsResult = prefRes;
    }
  }
  if (!ttsResult) {
    ttsResult = await fetchGeminiTtsWithResilience(
      formatTextForGeminiTts(cleanText),
      voiceName,
      signal,
      onRetryStatus
    );
  }

  const audioBuffer = await decodeGeminiAudioToCleanAudioBuffer(
    audioCtx,
    ttsResult.audioChunksBase64,
    ttsResult.mimeType
  );
  putTtsAudioCache(cacheKey, { ctx: audioCtx, audioBuffer, modelUsed: ttsResult.modelUsed });
  return { audioBuffer, modelUsed: ttsResult.modelUsed };
}

function getAudioBufferPeak(audioBuffer) {
  if (!audioBuffer || typeof audioBuffer.getChannelData !== 'function') return 1;
  let peak = 0;
  const chCount = audioBuffer.numberOfChannels || 1;
  for (let ch = 0; ch < chCount; ch++) {
    const data = audioBuffer.getChannelData(ch);
    for (let i = 0; i < data.length; i += 4) {
      const v = Math.abs(data[i]);
      if (v > peak) peak = v;
    }
  }
  return peak;
}

function showTtsDiagnosticBanner({ modelUsed, mimeType = '', durationSec = 0, peakRatio = 0, audioCtx = null, fromCache = false }) {
  const peakPct = Math.round((peakRatio || 0) * 100);
  const webAudioInfo = audioCtx ? `${audioCtx.state}/${audioCtx.sampleRate || '?'}Hz` : 'aus';
  const outputMode = state.preferHtmlAudioPlayback ? '<audio>-WAV' : 'WebAudio';
  const sourceLabel = fromCache ? 'aus Cache' : (mimeType || 'aktiv');
  showChatNotice(
    'info',
    `✓ Gemini TTS Audio ${fromCache ? 'aus Cache' : 'aktiv'} (${modelUsed}, ${sourceLabel}, ${(durationSec || 0).toFixed(1)}s, Pegel ${peakPct}%, ${outputMode}, WebAudio=${webAudioInfo}). Falls Stille: Buttons direkt hier testen oder Chrome-Tab/macOS-Ausgang prüfen.`,
    [
      { label: '🔊 Per <audio>-WAV testen', onClick: () => runHtmlAudioSelfTest() },
      { label: '🗣️ macOS Browser-Stimme', onClick: () => runAudioSelfTest({ forceBrowser: true }) }
    ]
  );
}

/**
 * Hauptfunktion für die Sprachausgabe über Gemini TTS + Web Audio API
 * (inkl. Echtzeit-Chunk-Streaming & parallelem Satz-1/Satz-2-Pipelining).
 */
async function speakWithGeminiTTS(rawText, customerId, options = {}) {
  const {
    messageId = null,
    triggerHandsFreeNextTurn = true,
    _skipLiveFallback = false,
    diagnosticBanner = false
  } = options;
  const cleanText = sanitizeSpokenText(rawText);
  if (!cleanText) {
    if (triggerHandsFreeNextTurn) onCustomerSpeechFinished(true);
    return;
  }

  // Laufende Sprachaufnahme & Wiedergabe sauber beenden, damit sich die KI nicht selbst hört
  stopListening(false);
  stopCustomerAudio();

  if (!state.voiceOutputEnabled) {
    onCustomerSpeechFinished(triggerHandsFreeNextTurn);
    return;
  }

  const requestId = ++state.ttsRequestSeq;
  const profile = customerVoiceProfiles[customerId] || customerVoiceProfiles.bergmann;

  if (!state.apiKey) {
    updateTurnStatusUI('idle', 'Offline-Modus (Browser-Stimme)');
    speakWithCleanBrowserFallback(cleanText, triggerHandsFreeNextTurn, requestId);
    return;
  }

  const abortController = new AbortController();
  state.activeTtsAbortController = abortController;

  if (messageId) {
    state.activePlayingMessageId = messageId;
    const msgBtn = document.getElementById(messageId);
    if (msgBtn) msgBtn.innerHTML = '<span>⏳</span><span>Lädt…</span>';
  }

  state.isAiSpeaking = true;
  updateTurnStatusUI('loading', `Kunde spricht gleich (${profile.voiceName})…`);

  const cacheKey = `${customerId}::${profile.voiceName}::${cleanText}`;

  try {
    // 1. Schneller Cache-Check ohne AudioContext-Wartezeit
    const cachedEntry = state.ttsAudioCache.get(cacheKey);
    if (cachedEntry && cachedEntry.audioBuffer) {
      const audioCtx = await getTtsAudioContext();
      if (requestId !== state.ttsRequestSeq || abortController.signal.aborted) return;
      if (audioCtx.state === 'suspended') {
        if (state.activeTtsAbortController === abortController) state.activeTtsAbortController = null;
        showToast('Audio war blockiert – nutze Browser-Stimme (bitte Seite einmal anklicken).');
        speakWithCleanBrowserFallback(cleanText, triggerHandsFreeNextTurn, requestId);
        return;
      }
      if (cachedEntry.ctx === audioCtx || (state.preferHtmlAudioPlayback && canUseHtmlAudioPlayback())) {
        if (state.activeTtsAbortController === abortController) state.activeTtsAbortController = null;
        if (diagnosticBanner) {
          showTtsDiagnosticBanner({
            modelUsed: cachedEntry.modelUsed,
            durationSec: cachedEntry.audioBuffer.duration,
            peakRatio: getAudioBufferPeak(cachedEntry.audioBuffer),
            audioCtx,
            fromCache: true
          });
        }
        playCleanAudioBuffer(audioCtx, cachedEntry.audioBuffer, profile.voiceName, {
          messageId,
          triggerHandsFreeNextTurn,
          requestId
        });
        return;
      }
    }

    // 2. Einheitliches Streaming-TTS (bei Diagnose oder <audio>-Fallback sauber gepuffert über playCleanAudioBuffer)
    const audioCtx = await getTtsAudioContext();
    if (requestId !== state.ttsRequestSeq || abortController.signal.aborted) return;
    if (audioCtx.state === 'suspended') {
      if (state.activeTtsAbortController === abortController) state.activeTtsAbortController = null;
      showToast('Audio war blockiert – nutze Browser-Stimme (bitte Seite einmal anklicken).');
      speakWithCleanBrowserFallback(cleanText, triggerHandsFreeNextTurn, requestId);
      return;
    }

    const useProgressiveStream = !state.preferHtmlAudioPlayback && !diagnosticBanner;
    const streamingPlayer = useProgressiveStream
      ? createProgressivePcmPlayer(audioCtx, profile.voiceName, {
          messageId,
          triggerHandsFreeNextTurn,
          requestId
        })
      : null;

    const ttsResult = await fetchGeminiTtsWithResilience(
      formatTextForGeminiTts(cleanText),
      profile.voiceName,
      abortController.signal,
      () => {
        if (requestId === state.ttsRequestSeq) {
          updateTurnStatusUI('loading', `Stimme wird geladen (${profile.voiceName})…`);
        }
      },
      streamingPlayer
        ? (chunkB64, mimeType, isFinalChunk) => {
            streamingPlayer.pushChunk(chunkB64, mimeType, isFinalChunk);
          }
        : null,
      profile.voiceDirective
    );

    if (requestId !== state.ttsRequestSeq || abortController.signal.aborted) return;
    if (!state.isAiSpeaking && !(streamingPlayer && streamingPlayer.hasStartedPlayback)) return;

    if (streamingPlayer && !streamingPlayer.isContainerFallback && streamingPlayer.finish()) {
      if (state.activeTtsAbortController === abortController) state.activeTtsAbortController = null;
      const streamPeak = streamingPlayer.peakAmplitude;
      const streamDur = streamingPlayer.totalDurationSec;
      if (streamPeak < 0.001) {
        showChatNotice('error', `Gemini TTS (${ttsResult.modelUsed}) lieferte stummes PCM (Pegel 0%). Wechsle auf Browser-Stimme.`);
        speakWithCleanBrowserFallback(cleanText, triggerHandsFreeNextTurn, requestId);
        return;
      }
      if (diagnosticBanner) {
        showTtsDiagnosticBanner({
          modelUsed: ttsResult.modelUsed,
          mimeType: ttsResult.mimeType,
          durationSec: streamDur,
          peakRatio: streamPeak,
          audioCtx
        });
      }
      // Kompletten Clip im Cache sichern (ohne erneutes Dekodieren bei 1-Chunk-Stream)
      const singleBuf = streamingPlayer.getSinglePlayedBuffer();
      if (singleBuf) {
        putTtsAudioCache(cacheKey, { ctx: audioCtx, audioBuffer: singleBuf, modelUsed: ttsResult.modelUsed });
      } else {
        try {
          const fullBuf = await decodeGeminiAudioToCleanAudioBuffer(audioCtx, ttsResult.audioChunksBase64, ttsResult.mimeType);
          putTtsAudioCache(cacheKey, { ctx: audioCtx, audioBuffer: fullBuf, modelUsed: ttsResult.modelUsed });
        } catch (e) {}
      }
      return;
    }

    // 3. Vollständiges Dekodieren & Abspielen (bei Unary-Antwort, Diagnose oder Container-Format)
    const audioBuffer = await decodeGeminiAudioToCleanAudioBuffer(
      audioCtx,
      ttsResult.audioChunksBase64,
      ttsResult.mimeType
    );

    if (requestId !== state.ttsRequestSeq || abortController.signal.aborted || !state.isAiSpeaking) return;

    const peak = getAudioBufferPeak(audioBuffer);
    if (peak < 0.001) {
      showChatNotice('error', `Gemini TTS (${ttsResult.modelUsed}) lieferte stumme Audiodaten. Wechsle auf Browser-Stimme.`);
      speakWithCleanBrowserFallback(cleanText, triggerHandsFreeNextTurn, requestId);
      return;
    }
    if (diagnosticBanner) {
      showTtsDiagnosticBanner({
        modelUsed: ttsResult.modelUsed,
        mimeType: ttsResult.mimeType,
        durationSec: audioBuffer.duration,
        peakRatio: peak,
        audioCtx
      });
    }

    putTtsAudioCache(cacheKey, { ctx: audioCtx, audioBuffer, modelUsed: ttsResult.modelUsed });

    if (state.activeTtsAbortController === abortController) state.activeTtsAbortController = null;

    if (audioCtx.state === 'suspended') {
      await Promise.race([
        audioCtx.resume().catch(() => {}),
        new Promise(resolve => setTimeout(resolve, 250))
      ]);
    }
    if (requestId !== state.ttsRequestSeq || abortController.signal.aborted) return;
    if (audioCtx.state === 'suspended') {
      showToast('Audio war blockiert – nutze Browser-Stimme.');
      speakWithCleanBrowserFallback(cleanText, triggerHandsFreeNextTurn, requestId);
      return;
    }

    playCleanAudioBuffer(audioCtx, audioBuffer, profile.voiceName, {
      messageId,
      triggerHandsFreeNextTurn,
      requestId
    });

  } catch (err) {
    if (state.activeTtsAbortController === abortController) {
      state.activeTtsAbortController = null;
    }
    if (err?.name === 'AbortError' || requestId !== state.ttsRequestSeq || abortController.signal.aborted) {
      return;
    }
    if (!err?.isFatalAuth && !_skipLiveFallback && isLiveModeActive() && state.apiKey) {
      console.warn('HTTP-TTS fehlgeschlagen – nutze Gemini Live-Stimme statt Computerstimme:', err);
      state.isAiSpeaking = false;
      const liveSess = await connectAndStartLiveSession({
        startListeningAfterGreeting: triggerHandsFreeNextTurn,
        suppressMicCapture: !triggerHandsFreeNextTurn,
        closeAfterTurnComplete: !triggerHandsFreeNextTurn,
        initialGreetingFallbackText: cleanText,
        initialPendingText: `Sprich jetzt auf Deutsch wortwörtlich und ohne Zusätze genau diesen Satz: "${cleanText}"`,
        _httpAlreadyFailed: true
      });
      if (liveSess) return;
    }
    console.warn('Gemini TTS Fehler nach Retries/Fallback – nutze Browser-Fallback:', err);
    const reasonPrefix = err?.isFatalAuth
      ? 'API-Key ungültig/abgelehnt'
      : `TTS-API momentan nicht erreichbar (${err.message})`;
    showChatNotice('error', `${reasonPrefix} – Nutze vorübergehend Browser-Stimme.`);
    speakWithCleanBrowserFallback(cleanText, triggerHandsFreeNextTurn, requestId);
  }
}

/* =========================================================================
   7. FREISPRECH-MIKROFON (continuous = true) & 1,0-SEKUNDEN-STILLE-TIMER
   ========================================================================= */

let speechRecognitionInstance = null;
const SILENCE_TIMEOUT_MS = DEFAULT_SILENCE_TIMEOUT_MS; // Standard: 600ms bis zum automatischen Absenden

function getSilenceTimeoutMs() {
  return state.silenceTimeoutMs || DEFAULT_SILENCE_TIMEOUT_MS;
}

function getSpeechRecognitionConstructor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function getCombinedSpokenText() {
  return `${state.finalTranscriptBuffer} ${state.interimTranscriptBuffer}`
    .replace(/\s+/g, ' ')
    .trim();
}

function clearSpeechControlTimers() {
  if (state.speechStartWatchdogId) {
    clearTimeout(state.speechStartWatchdogId);
    state.speechStartWatchdogId = null;
  }
  if (state.speechRestartTimerId) {
    clearTimeout(state.speechRestartTimerId);
    state.speechRestartTimerId = null;
  }
}

function detachRecognitionInstance(instance, useAbort = true) {
  if (!instance) return;
  try {
    instance.onstart = null;
    instance.onaudiostart = null;
    instance.onsoundstart = null;
    instance.onspeechstart = null;
    instance.onspeechend = null;
    instance.onresult = null;
    instance.onerror = null;
    instance.onend = null;
  } catch (e) {}
  try {
    if (useAbort && typeof instance.abort === 'function') {
      instance.abort();
    } else if (typeof instance.stop === 'function') {
      instance.stop();
    }
  } catch (e) {}
}

function updateSilenceSendNowButton(text) {
  const sendNowBtn = document.getElementById('silenceSendNowBtn');
  if (!sendNowBtn) return;
  if (text && text.length > 0) {
    sendNowBtn.classList.remove('hidden');
  } else {
    sendNowBtn.classList.add('hidden');
  }
}

function initSpeechRecognition() {
  if (!getSpeechRecognitionConstructor()) {
    const micBtn = document.getElementById('micButton');
    if (micBtn) {
      micBtn.title = 'Spracherkennung wird in diesem Browser nicht unterstützt (bitte Chrome/Edge nutzen).';
      micBtn.classList.add('opacity-50');
    }
  }
}

function failAndStopListening(userMessage, disableHandsFree = false) {
  if (disableHandsFree) {
    state.handsFreeActive = false;
    updateHandsFreeButtonUI();
  }
  stopListening(true);
  updateTurnStatusUI('idle', 'Mikrofon gestoppt');
  if (userMessage) {
    showChatNotice('error', userMessage);
    showToast(userMessage);
  }
}

/**
 * Erstellt bei jedem Start/Neustart eine frische SpeechRecognition-Instanz mit Session-Token,
 * damit veraltete Instanzen (Safari/Chrome InvalidStateError) den Zustand nie blockieren.
 */
function launchFreshRecognitionSession(isWatchdogRetry = false) {
  const SpeechRecognition = getSpeechRecognitionConstructor();
  if (!SpeechRecognition || !state.isListening) return;

  clearSpeechControlTimers();

  if (speechRecognitionInstance) {
    detachRecognitionInstance(speechRecognitionInstance, true);
    speechRecognitionInstance = null;
  }

  const sessionId = ++state.speechSessionSeq;
  state.speechRecognitionStarted = false;

  const recognition = new SpeechRecognition();
  recognition.lang = 'de-DE';
  recognition.continuous = true;     // Kein vorzeitiger Abbruch bei kurzen Atempausen
  recognition.interimResults = true; // Live-Zwischenergebnisse
  try { recognition.maxAlternatives = 1; } catch (e) {}
  speechRecognitionInstance = recognition;

  const handleStartOnly = () => {
    if (sessionId !== state.speechSessionSeq || !state.isListening) return;
    state.speechRecognitionStarted = true;
    clearTimeout(state.speechStartWatchdogId);
    state.speechStartWatchdogId = null;
    setListeningVisuals(true);
    const currentText = getCombinedSpokenText();
    const statusLabel = document.getElementById('silenceStatusLabel');
    if (!currentText) {
      updateTurnStatusUI('listening', '🎙️ Mikrofon aktiv – sprich einfach los…');
      if (statusLabel) statusLabel.textContent = '🎙️ Mikrofon aktiv – sprich einfach los…';
    }
  };

  const handleAudioCaptureReady = () => {
    if (sessionId !== state.speechSessionSeq || !state.isListening) return;
    state.speechRecognitionStarted = true;
    clearTimeout(state.speechStartWatchdogId);
    state.speechStartWatchdogId = null;
    setListeningVisuals(true);
    const currentText = getCombinedSpokenText();
    const statusLabel = document.getElementById('silenceStatusLabel');
    if (!currentText) {
      updateTurnStatusUI('listening', '🎙️ Mikrofon aktiv – sprich einfach los…');
      if (statusLabel) statusLabel.textContent = '🎙️ Mikrofon aktiv – sprich einfach los…';
    }
  };

  recognition.onstart = handleStartOnly;
  recognition.onaudiostart = handleAudioCaptureReady;

  recognition.onsoundstart = () => {
    if (sessionId !== state.speechSessionSeq || !state.isListening) return;
    state.speechRecognitionStarted = true;
    if (state.speechStartWatchdogId) {
      clearTimeout(state.speechStartWatchdogId);
      state.speechStartWatchdogId = null;
    }
    const statusLabel = document.getElementById('silenceStatusLabel');
    if (!getCombinedSpokenText() && statusLabel) {
      statusLabel.textContent = '🗣️ Geräusch/Sprache erkannt…';
    }
  };

  recognition.onspeechstart = () => {
    if (sessionId !== state.speechSessionSeq || !state.isListening) return;
    state.speechRecognitionStarted = true;
    if (state.speechStartWatchdogId) {
      clearTimeout(state.speechStartWatchdogId);
      state.speechStartWatchdogId = null;
    }
    const statusLabel = document.getElementById('silenceStatusLabel');
    if (!getCombinedSpokenText() && statusLabel) {
      statusLabel.textContent = '🗣️ Sprache wird erkannt…';
    }
  };

  recognition.onspeechend = () => {
    if (sessionId !== state.speechSessionSeq || !state.isListening) return;
    const combinedText = getCombinedSpokenText();
    if (combinedText.length > 0 && !state.silenceTimerId) {
      resetSilenceCountdown();
    }
  };

  recognition.onresult = (event) => {
    if (sessionId !== state.speechSessionSeq || !state.isListening) return;
    state.speechRecognitionStarted = true;
    state.speechNetworkRetries = 0;
    if (state.speechStartWatchdogId) {
      clearTimeout(state.speechStartWatchdogId);
      state.speechStartWatchdogId = null;
    }

    // Immer vollständig über event.results[0..length-1] dieser Instanz lesen -> verhindert Safari/Chrome-Duplikate
    let sessionFinal = '';
    let sessionInterim = '';
    for (let i = 0; i < event.results.length; i++) {
      const resItem = event.results[i];
      const transcriptChunk = resItem && resItem[0] ? String(resItem[0].transcript || '') : '';
      if (!transcriptChunk) continue;
      if (resItem.isFinal) {
        sessionFinal += ' ' + transcriptChunk;
      } else {
        sessionInterim += ' ' + transcriptChunk;
      }
    }

    sessionFinal = sessionFinal.replace(/\s+/g, ' ').trim();
    sessionInterim = sessionInterim.replace(/\s+/g, ' ').trim();

    const mergedFinal = `${state.committedTranscriptBuffer} ${sessionFinal}`.replace(/\s+/g, ' ').trim();
    // Nur aktualisieren, wenn diese Session wirklich Text liefert oder finalen Text hat;
    // leere Interim-Events löschen keine bereits gesprochenen Worte.
    if (mergedFinal || sessionInterim) {
      state.finalTranscriptBuffer = mergedFinal;
      state.interimTranscriptBuffer = sessionInterim;
    }

    const combinedText = getCombinedSpokenText();
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
      chatInput.value = combinedText;
      if (typeof chatInput.scrollWidth === 'number') {
        chatInput.scrollLeft = chatInput.scrollWidth;
      }
    }
    updateSilenceSendNowButton(combinedText);

    // Nur zurücksetzen, wenn sich der erkannte Text wirklich geändert hat oder noch kein Timer läuft!
    // Verhindert Endlos-Resets durch identische Browser-Wiederholungen bei Hintergrundrauschen.
    let latestChunkFinal = false;
    if (event.results.length > 0) {
      latestChunkFinal = Boolean(event.results[event.results.length - 1]?.isFinal);
    }
    const sentenceEnded = latestChunkFinal && combinedText.length >= 6 && /[.!?…]$/.test(combinedText);
    const fastDelayMs = sentenceEnded ? Math.min(getSilenceTimeoutMs(), 280) : getSilenceTimeoutMs();

    if (combinedText.length > 0 && (combinedText !== state.lastRecognizedTranscript || !state.silenceTimerId)) {
      state.lastRecognizedTranscript = combinedText;
      resetSilenceCountdown(fastDelayMs);
    }
  };

  recognition.onerror = (e) => {
    if (sessionId !== state.speechSessionSeq || !state.isListening) return;
    const errCode = e && e.error ? e.error : 'unknown';

    if (errCode === 'aborted') {
      return;
    }

    if (errCode === 'no-speech') {
      // Wenn bereits Text vorliegt und Stille eintritt, Countdown sicherstellen
      const combinedText = getCombinedSpokenText();
      if (combinedText.length > 0 && !state.silenceTimerId) {
        resetSilenceCountdown();
      }
      return;
    }

    console.warn('SpeechRecognition Fehler:', errCode);

    if (errCode === 'not-allowed' || errCode === 'service-not-allowed') {
      const fileHint = window.location.protocol === 'file:'
        ? ' (Tipp: Öffne die Datei über http://localhost statt file://)'
        : '';
      failAndStopListening(`Mikrofon oder Spracherkennung blockiert (${errCode}). Bitte Zugriff im Browser erlauben${fileHint}.`, true);
      return;
    }

    if (errCode === 'audio-capture') {
      failAndStopListening('Kein Mikrofon-Signal (audio-capture). Bitte prüfen, ob ein Mikrofon angeschlossen und im System freigegeben ist.', true);
      return;
    }

    if (errCode === 'language-not-supported') {
      failAndStopListening('Deutsche Spracherkennung (de-DE) wird von diesem Browser nicht unterstützt.', true);
      return;
    }

    if (errCode === 'network') {
      state.speechNetworkRetries++;
      if (state.speechNetworkRetries > 2) {
        failAndStopListening('Browser-Spracherkennung meldet Netzwerkfehler. Bitte Google Chrome mit Internet nutzen oder Text eintippen.', false);
      }
    }
  };

  recognition.onend = () => {
    if (sessionId !== state.speechSessionSeq) return;
    if (state.speechStartWatchdogId) {
      clearTimeout(state.speechStartWatchdogId);
      state.speechStartWatchdogId = null;
    }
    if (speechRecognitionInstance === recognition) {
      speechRecognitionInstance = null;
    }

    if (state.isListening && !state.isAiSpeaking && !state.isGenerating) {
      // Bisherige (auch noch nicht als isFinal markierte) Worte sichern, damit ein Neustart nichts löscht!
      const buffered = getCombinedSpokenText();
      if (buffered) {
        state.committedTranscriptBuffer = buffered;
        state.finalTranscriptBuffer = buffered;
        state.interimTranscriptBuffer = '';
        if (!state.silenceTimerId) {
          resetSilenceCountdown();
        }
      }

      const delayMs = state.speechNetworkRetries > 0 ? (350 * state.speechNetworkRetries) : 100;
      state.speechRestartTimerId = setTimeout(() => {
        state.speechRestartTimerId = null;
        if (sessionId === state.speechSessionSeq && state.isListening && !state.isAiSpeaking && !state.isGenerating) {
          launchFreshRecognitionSession(false);
        }
      }, delayMs);
    } else {
      setListeningVisuals(false);
    }
  };

  // Falls Browser-STT komplett stumm hängt (kein onaudiostart/onresult innerhalb 3,2s) -> sauber 1x neu starten oder melden
  state.speechStartWatchdogId = setTimeout(() => {
    state.speechStartWatchdogId = null;
    if (sessionId !== state.speechSessionSeq || !state.isListening || state.speechRecognitionStarted) return;
    if (!isWatchdogRetry) {
      launchFreshRecognitionSession(true);
    } else {
      const isEmbeddedFrame = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
      const envHint = isEmbeddedFrame
        ? ' Du nutzt eine eingebettete Inline-Vorschau – dort blockiert der Editor/Browser oft das Mikrofon. Bitte öffne http://localhost in Google Chrome direkt.'
        : (window.location.protocol === 'file:'
            ? ' Bitte starte die App über http://localhost (z. B. python3 -m http.server).'
            : ' Bitte Mikrofon-Berechtigung in Chrome & macOS (Systemeinstellungen → Datenschutz → Mikrofon) prüfen.');
      failAndStopListening(`Mikrofon liefert kein Sprachsignal.${envHint}`, true);
    }
  }, 3200);

  try {
    recognition.start();
  } catch (err) {
    clearTimeout(state.speechStartWatchdogId);
    state.speechStartWatchdogId = null;
    if (err && err.name === 'InvalidStateError' && !isWatchdogRetry) {
      state.speechRestartTimerId = setTimeout(() => {
        state.speechRestartTimerId = null;
        if (sessionId === state.speechSessionSeq && state.isListening) {
          launchFreshRecognitionSession(true);
        }
      }, 150);
    } else {
      failAndStopListening(`Spracherkennung konnte nicht gestartet werden (${err?.message || 'Unbekannter Fehler'}).`, true);
    }
  }
}

/**
 * Startet die kontinuierliche Spracheingabe des Azubis.
 */
function startContinuousListening() {
  const isEmbeddedFrame = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
  if (!getSpeechRecognitionConstructor()) {
    const msg = isEmbeddedFrame
      ? 'Inline-Vorschau unterstützt keine Spracherkennung. Bitte http://localhost direkt in Google Chrome öffnen!'
      : 'Spracherkennung wird von diesem Browser nicht unterstützt (bitte Google Chrome oder Edge nutzen).';
    showChatNotice('error', msg);
    showToast(msg);
    return;
  }
  if (isEmbeddedFrame) {
    showChatNotice('info', 'Hinweis: In einer eingebetteten Inline-Vorschau wird das Mikrofon oft blockiert. Falls keine Sprache erkannt wird, öffne http://localhost direkt in einem Chrome-Tab.');
  }

  stopCustomerAudio();
  clearSilenceTimers();
  clearSpeechControlTimers();

  state.isListening = true;
  state.committedTranscriptBuffer = '';
  state.finalTranscriptBuffer = '';
  state.interimTranscriptBuffer = '';
  state.lastRecognizedTranscript = '';
  state.speechNetworkRetries = 0;

  const chatInput = document.getElementById('chatInput');
  if (chatInput) chatInput.value = '';
  updateSilenceSendNowButton('');

  setListeningVisuals(true);
  updateTurnStatusUI('listening', '🎙️ Mikrofon wird aktiviert…');

  const panel = document.getElementById('silenceCountdownPanel');
  const statusLabel = document.getElementById('silenceStatusLabel');
  const secLabel = document.getElementById('silenceSecondsLabel');
  const bar = document.getElementById('silenceProgressBar');

  if (panel) panel.classList.remove('hidden');
  if (statusLabel) statusLabel.textContent = '🎙️ Mikrofon wird aktiviert…';
  if (secLabel) secLabel.textContent = formatSecondsDe(getSilenceTimeoutMs());
  if (bar) bar.style.width = '100%';

  launchFreshRecognitionSession(false);
}

/**
 * Setzt den Stille-Timer & die visuelle Fortschrittsanzeige zurück.
 */
function resetSilenceCountdown(overrideDelayMs = null) {
  clearSilenceTimers();

  const totalDelayMs = Math.max(150, overrideDelayMs || getSilenceTimeoutMs());
  state.silenceDeadline = performance.now() + totalDelayMs;

  const panel = document.getElementById('silenceCountdownPanel');
  const statusLabel = document.getElementById('silenceStatusLabel');
  const secLabel = document.getElementById('silenceSecondsLabel');
  const bar = document.getElementById('silenceProgressBar');

  if (panel) panel.classList.remove('hidden');
  if (statusLabel) statusLabel.textContent = `Sendet automatisch in ${formatSecondsDe(totalDelayMs)} Stille…`;

  function updateProgressFrame(now) {
    if (!state.isListening) return;
    const remainingMs = Math.max(0, state.silenceDeadline - now);
    const ratio = remainingMs / totalDelayMs;
    const formattedSeconds = (remainingMs / 1000).toFixed(1).replace('.', ',') + 's';

    if (secLabel) secLabel.textContent = formattedSeconds;
    if (bar) bar.style.width = `${ratio * 100}%`;

    if (remainingMs > 0) {
      state.silenceCountdownRafId = requestAnimationFrame(updateProgressFrame);
    }
  }

  state.silenceCountdownRafId = requestAnimationFrame(updateProgressFrame);

  state.silenceTimerId = setTimeout(() => {
    finalizeAndSendSpokenInput();
  }, totalDelayMs);
}

function clearSilenceTimers() {
  if (state.silenceTimerId) {
    clearTimeout(state.silenceTimerId);
    state.silenceTimerId = null;
  }
  if (state.silenceCountdownRafId) {
    cancelAnimationFrame(state.silenceCountdownRafId);
    state.silenceCountdownRafId = null;
  }
}

/**
 * Beendet das Zuhören und sendet den gesamten eingesprochenen Satz ab.
 */
function finalizeAndSendSpokenInput() {
  const chatInput = document.getElementById('chatInput');
  const spokenText = (
    getCombinedSpokenText() ||
    (chatInput ? chatInput.value.trim() : '')
  ).trim();

  stopListening(true);

  if (!spokenText) return;

  if (chatInput) chatInput.value = '';
  submitApprenticeMessage(spokenText);
}

/**
 * Stoppt die Spracherkennung sauber.
 */
function stopListening(clearBuffers = true) {
  state.isListening = false;
  state.speechSessionSeq++;
  state.speechRecognitionStarted = false;
  clearSilenceTimers();
  clearSpeechControlTimers();

  if (clearBuffers) {
    state.committedTranscriptBuffer = '';
    state.finalTranscriptBuffer = '';
    state.interimTranscriptBuffer = '';
    state.lastRecognizedTranscript = '';
    updateSilenceSendNowButton('');
  }

  if (speechRecognitionInstance) {
    const oldInstance = speechRecognitionInstance;
    speechRecognitionInstance = null;
    detachRecognitionInstance(oldInstance, true);
  }

  setListeningVisuals(false);
}

function setListeningVisuals(listening) {
  const micBtn = document.getElementById('micButton');
  const pulse = document.getElementById('micListeningPulse');
  const avatarListenWaves = document.getElementById('avatarListeningWaves');
  const avatarBox = document.getElementById('customerAvatarContainer');
  const panel = document.getElementById('silenceCountdownPanel');

  if (listening) {
    micBtn?.classList.add('border-emerald-400', 'bg-emerald-500/20', 'text-emerald-300');
    pulse?.classList.remove('hidden');
    avatarListenWaves?.classList.remove('hidden');
    avatarBox?.classList.add('avatar-listening');
    panel?.classList.remove('hidden');
  } else {
    micBtn?.classList.remove('border-emerald-400', 'bg-emerald-500/20', 'text-emerald-300');
    pulse?.classList.add('hidden');
    avatarListenWaves?.classList.add('hidden');
    avatarBox?.classList.remove('avatar-listening');
    panel?.classList.add('hidden');
  }
  window.AvatarEngine?.setListening(Boolean(listening));
}

function toggleManualMicrophone() {
  unlockAudioOnUserGesture();
  if (state.isListening) {
    // Falls bereits Text eingesprochen wurde, direkt absenden; sonst pausieren
    const chatInput = document.getElementById('chatInput');
    const currentText = getCombinedSpokenText() || (chatInput ? chatInput.value.trim() : '');
    if (currentText) {
      finalizeAndSendSpokenInput();
    } else {
      if (state.liveSession) {
        stopLiveSession(true);
        state.isListening = false;
      } else {
        stopListening(true);
      }
      updateTurnStatusUI('idle', 'Mikrofon gestoppt');
    }
  } else {
    ensureConversationStartedBeforeReply(false);
    if (isLiveModeActive()) {
      state.handsFreeActive = true;
      updateHandsFreeButtonUI();
      connectAndStartLiveSession({ startListeningAfterGreeting: true });
    } else {
      startContinuousListening();
    }
  }
}

window.addEventListener('keydown', (e) => {
  if (e.altKey && (e.key === 'm' || e.key === 'M')) {
    e.preventDefault();
    toggleManualMicrophone();
  }
});

/* =========================================================================
   7B. GEMINI LIVE API (BidiGenerateContent WEBSOCKET AUDIO-TO-AUDIO <0,8s)
   ========================================================================= */

function updateAutoSendBadgeUI() {
  const badge = document.getElementById('autoSendBadge');
  if (!badge) return;
  if (state.liveSession && state.liveSession.setupComplete) {
    badge.textContent = 'Echtzeit-Live (<0,8s)';
    badge.className = 'text-[10px] font-mono text-emerald-300 font-semibold';
  } else {
    badge.textContent = `${formatSecondsDe(getSilenceTimeoutMs())} Auto-Senden`;
    badge.className = 'text-[10px] font-mono text-stone-400';
  }
}

function getLiveCandidateModels() {
  const merged = [
    ...(state.discoveredLiveModels || []),
    ...FALLBACK_LIVE_MODELS
  ];
  const unique = [];
  for (const m of merged) {
    if (m && !unique.includes(m) && !state.unavailableLiveModels.has(m)) {
      unique.push(m);
    }
  }
  // gemini-3.8-live immer zuerst bevorzugen, falls vorhanden
  unique.sort((a, b) => {
    const aScore = a.includes('3.8-live') ? 0 : (a.includes('live') ? 1 : 2);
    const bScore = b.includes('3.8-live') ? 0 : (b.includes('live') ? 1 : 2);
    return aScore - bScore;
  });
  return unique;
}

function isLiveModeActive() {
  return Boolean(
    state.apiKey &&
    state.liveModeEnabled &&
    !state.preferHtmlAudioPlayback &&
    typeof WebSocket === 'function' &&
    !state.liveUnavailableForSession &&
    getLiveCandidateModels().length > 0
  );
}

function uint8ToBase64(bytes) {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const sub = bytes.subarray(i, i + chunkSize);
    let seg = '';
    for (let j = 0; j < sub.length; j++) seg += String.fromCharCode(sub[j]);
    binary += seg;
  }
  if (typeof btoa === 'function') return btoa(binary);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += chars[b1 >> 2] + chars[((b1 & 3) << 4) | (b2 >> 4)] +
      (i + 1 < bytes.length ? chars[((b2 & 15) << 2) | (b3 >> 6)] : '=') +
      (i + 2 < bytes.length ? chars[b3 & 63] : '=');
  }
  return out;
}

function downsampleFloat32ToInt16Pcm(float32Samples, inputSampleRate, targetRate = 16000) {
  if (!float32Samples || float32Samples.length === 0) return new Uint8Array(0);
  let monoFloat = float32Samples;
  if (inputSampleRate && inputSampleRate !== targetRate) {
    const ratio = inputSampleRate / targetRate;
    const newLength = Math.max(1, Math.floor(float32Samples.length / ratio));
    monoFloat = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      const srcIdx = i * ratio;
      const idx0 = Math.floor(srcIdx);
      const idx1 = Math.min(float32Samples.length - 1, idx0 + 1);
      const frac = srcIdx - idx0;
      monoFloat[i] = float32Samples[idx0] * (1 - frac) + float32Samples[idx1] * frac;
    }
  }
  const pcmBytes = new Uint8Array(monoFloat.length * 2);
  const view = new DataView(pcmBytes.buffer);
  for (let i = 0; i < monoFloat.length; i++) {
    const clamped = Math.max(-1, Math.min(1, monoFloat[i]));
    const val = clamped < 0 ? Math.round(clamped * 32768) : Math.round(clamped * 32767);
    view.setInt16(i * 2, val, true);
  }
  return pcmBytes;
}

function stopLiveMicCapture(session) {
  if (!session) return;
  session.micStreamingActive = false;
  if (session.micLivenessTimerId) {
    clearTimeout(session.micLivenessTimerId);
    session.micLivenessTimerId = null;
  }
  if (session.workletNode) {
    try {
      if (session.workletNode.port) session.workletNode.port.onmessage = null;
      session.workletNode.disconnect();
    } catch (e) {}
    session.workletNode = null;
  }
  if (session.processorNode) {
    try { session.processorNode.onaudioprocess = null; session.processorNode.disconnect(); } catch (e) {}
    session.processorNode = null;
  }
  if (session.micGainNode) {
    try { session.micGainNode.disconnect(); } catch (e) {}
    session.micGainNode = null;
  }
  if (session.micSourceNode) {
    try { session.micSourceNode.disconnect(); } catch (e) {}
    session.micSourceNode = null;
  }
  if (session.micStream) {
    try { session.micStream.getTracks().forEach(t => { try { t.stop(); } catch (e) {} }); } catch (e) {}
    session.micStream = null;
  }
  const levelFill = document.getElementById('micLevelFill');
  if (levelFill) levelFill.style.width = '0%';
}

function flushLiveApprenticeTurn(session) {
  if (!session || !session.liveApprenticeText) return;
  const clean = session.liveApprenticeText.replace(/\s+/g, ' ').trim();
  session.liveApprenticeText = '';
  session.liveApprenticeBubble = null;
  if (clean) {
    state.chatHistory.push({ role: 'apprentice', text: clean });
  }
}

function flushLiveCustomerTurn(session) {
  if (!session) return;
  const clean = sanitizeSpokenText(session.liveCustomerText) || session.liveCustomerText.replace(/\s+/g, ' ').trim();
  session.liveCustomerText = '';
  if (session.liveCustomerBubble) {
    if (clean) session.liveCustomerBubble.bubble.textContent = clean;
    session.liveCustomerBubble = null;
  }
  if (clean) {
    state.chatHistory.push({ role: 'customer', text: clean });
    state.lastCustomerMessage = clean;
  }
}

function finishLiveTurnUi(session) {
  if (!session || state.liveSession !== session) return;
  state.isGenerating = false;
  showTypingIndicator(false);
  if (!session.isAudioPlaying) {
    session.muteMicUntilMs = Math.max(session.muteMicUntilMs || 0, Date.now() + 220);
    state.isAiSpeaking = false;
    setAvatarSpeakingVisuals(false);
    resetMessagePlayButtons();
    if (session.closeAfterTurnComplete) {
      stopLiveSession(true);
      return;
    }
    if (session.pendingWalkoutReaction) {
      const walkoutText = session.pendingWalkoutReaction;
      session.pendingWalkoutReaction = null;
      stopLiveSession(true);
      if (typeof triggerCustomerWalkoutEvaluation === 'function') {
        triggerCustomerWalkoutEvaluation(walkoutText);
      }
      return;
    }
    if (session.pendingStartListening && !session.micStreamingActive && state.handsFreeActive) {
      enableLiveListeningUi(session);
    } else if (session.micStreamingActive && state.handsFreeActive) {
      updateTurnStatusUI('listening', '⚡ Echtzeit-Live aktiv – sprich einfach los…');
    }
  }
}

function stopLiveOutputPlayback(session) {
  if (!session) return;
  session.audioPlayer = null;
  session.liveAudioChunks = [];
  session.isAudioPlaying = false;
  session.muteMicUntilMs = Math.max(session.muteMicUntilMs || 0, Date.now() + 220);
  state.isAiSpeaking = false;
  state.ttsRequestSeq++;
  stopCustomerAudio();
}

function stopLiveSession(resetUi = true) {
  const session = state.liveSession;
  if (!session) return;
  state.liveSession = null;
  session.closedManually = true;
  if (session.setupTimerId) {
    clearTimeout(session.setupTimerId);
    session.setupTimerId = null;
  }
  if (session.closingFallbackTimerId) {
    clearTimeout(session.closingFallbackTimerId);
    session.closingFallbackTimerId = null;
  }
  stopLiveMicCapture(session);
  flushLiveApprenticeTurn(session);
  flushLiveCustomerTurn(session);
  if (session.ws) {
    try {
      session.ws.onopen = null;
      session.ws.onmessage = null;
      session.ws.onerror = null;
      session.ws.onclose = null;
      if (session.ws.readyState === 0 || session.ws.readyState === 1) {
        session.ws.close(1000, 'Session ended');
      }
    } catch (e) {}
    session.ws = null;
  }
  if (resetUi) {
    setListeningVisuals(false);
    updateAutoSendBadgeUI();
  }
}

function mergeTranscriptDelta(existing, chunk) {
  if (!chunk) return existing;
  if (!existing) return chunk;
  // Einige APIs senden inkrementelle Deltas, manche bereits erweiterte Prefixe
  if (chunk.startsWith(existing) && chunk.length > existing.length) return chunk;
  return existing + chunk;
}

async function handleLiveServerMessage(session, rawEventData) {
  if (session.closedManually || state.liveSession !== session) return;
  let rawText = '';
  if (typeof rawEventData === 'string') {
    rawText = rawEventData;
  } else if (typeof Blob !== 'undefined' && rawEventData instanceof Blob && typeof rawEventData.text === 'function') {
    rawText = await rawEventData.text();
  } else if (rawEventData && typeof TextDecoder === 'function') {
    rawText = new TextDecoder('utf-8').decode(rawEventData);
  }
  if (!rawText) return;

  let msg = null;
  try { msg = JSON.parse(rawText); } catch (e) { return; }

  if (msg.setupComplete !== undefined) {
    session.setupComplete = true;
    if (session.setupTimerId) {
      clearTimeout(session.setupTimerId);
      session.setupTimerId = null;
    }
    updateAutoSendBadgeUI();
    updateApiStatusBadge(true, `${session.model} (Live)`);
    const hasPendingText = Boolean(session.pendingTextTurn);
    if (session.pendingStartListening && !hasPendingText && !state.isAiSpeaking && state.handsFreeActive) {
      enableLiveListeningUi(session);
    }
    if (session.pendingTextTurn && session.ws && session.ws.readyState === 1) {
      const textToSend = session.pendingTextTurn;
      session.pendingTextTurn = null;
      sendLiveTextTurn(textToSend);
    }
    return;
  }

  const sc = msg.serverContent;
  if (!sc) return;
  session.receivedAnyContent = true;

  if (sc.interrupted) {
    stopLiveOutputPlayback(session);
    if (session.suppressNextTurnTranscript) {
      session.liveCustomerText = '';
      session.liveCustomerBubble = null;
      session.suppressNextTurnTranscript = false;
      session.pendingReplayText = '';
    } else {
      flushLiveCustomerTurn(session);
    }
    finishLiveTurnUi(session);
  }

  if (sc.inputTranscription && sc.inputTranscription.text) {
    session.liveApprenticeText = mergeTranscriptDelta(session.liveApprenticeText, sc.inputTranscription.text);
    const cleanIn = session.liveApprenticeText.replace(/\s+/g, ' ').trim();
    if (cleanIn) {
      if (!session.liveApprenticeBubble) {
        session.liveApprenticeBubble = createMessageBubbleElements('apprentice', cleanIn);
      } else {
        session.liveApprenticeBubble.bubble.textContent = cleanIn;
        const chatContainer = document.getElementById('chatHistory');
        if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  }

  if (sc.outputTranscription && sc.outputTranscription.text && !session.suppressNextTurnTranscript) {
    flushLiveApprenticeTurn(session);
    showTypingIndicator(false);
    session.liveCustomerText = mergeTranscriptDelta(session.liveCustomerText, sc.outputTranscription.text);
    const cleanOut = sanitizeSpokenText(session.liveCustomerText) || session.liveCustomerText.replace(/\s+/g, ' ').trim();
    if (cleanOut) {
      if (!session.liveCustomerBubble) {
        session.liveCustomerBubble = createMessageBubbleElements('customer', cleanOut);
      } else {
        session.liveCustomerBubble.bubble.textContent = cleanOut;
        const chatContainer = document.getElementById('chatHistory');
        if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
      }
      state.lastCustomerMessage = cleanOut;
    }
  }

  const parts = sc.modelTurn?.parts || [];
  for (const part of parts) {
    if (part?.inlineData?.data && state.voiceOutputEnabled) {
      if (session.closingFallbackTimerId) {
        clearTimeout(session.closingFallbackTimerId);
        session.closingFallbackTimerId = null;
      }
      flushLiveApprenticeTurn(session);
      showTypingIndicator(false);
      const chunkMime = part.inlineData.mimeType || 'audio/pcm;rate=24000';
      if (!session.liveAudioChunks) session.liveAudioChunks = [];
      session.liveAudioChunks.push(part.inlineData.data);
      session.liveAudioMime = chunkMime;
      if (!session.audioPlayer) {
        const audioCtx = await getTtsAudioContext();
        if (session.closedManually || state.liveSession !== session) return;
        const customer = getCurrentCustomer();
        const profile = customerVoiceProfiles[customer.id] || customerVoiceProfiles.bergmann;
        session.outputRequestSeq = ++state.ttsRequestSeq;
        session.isAudioPlaying = true;
        state.isAiSpeaking = true;
        session.bargeInLoudFrames = 0;
        session.audioPlayer = createProgressivePcmPlayer(audioCtx, profile.voiceName, {
          triggerHandsFreeNextTurn: false,
          continuousStream: true,
          requestId: session.outputRequestSeq,
          onPlaybackEnd: () => {
            session.isAudioPlaying = false;
            session.muteMicUntilMs = Date.now() + 220;
            finishLiveTurnUi(session);
          }
        });
      }
      session.audioPlayer.pushChunk(part.inlineData.data, chunkMime, false);
    } else if (part?.text && !part.thought && !sc.outputTranscription && !session.suppressNextTurnTranscript) {
      flushLiveApprenticeTurn(session);
      showTypingIndicator(false);
      session.liveCustomerText = mergeTranscriptDelta(session.liveCustomerText, part.text);
      const cleanOut = sanitizeSpokenText(session.liveCustomerText) || session.liveCustomerText.trim();
      if (cleanOut) {
        if (!session.liveCustomerBubble) {
          session.liveCustomerBubble = createMessageBubbleElements('customer', cleanOut);
        } else {
          session.liveCustomerBubble.bubble.textContent = cleanOut;
        }
        state.lastCustomerMessage = cleanOut;
      }
    }
  }

  if (sc.turnComplete) {
    flushLiveApprenticeTurn(session);
    const rawLiveText = session.suppressNextTurnTranscript ? '' : (session.liveCustomerText || '');
    const replayText = session.suppressNextTurnTranscript
      ? (session.pendingReplayText || state.lastCustomerMessage || '')
      : (sanitizeSpokenText(session.liveCustomerText) || session.liveCustomerText.replace(/\s+/g, ' ').trim());
    if (session.suppressNextTurnTranscript) {
      session.liveCustomerText = '';
      session.liveCustomerBubble = null;
      session.suppressNextTurnTranscript = false;
      session.pendingReplayText = '';
    } else {
      flushLiveCustomerTurn(session);
    }
    const isWalkoutTurn = !session.closeAfterTurnComplete && typeof detectCustomerWalkout === 'function' && detectCustomerWalkout(rawLiveText, replayText);
    if (isWalkoutTurn) {
      session.pendingWalkoutReaction = replayText;
      session.pendingStartListening = false;
      state.handsFreeActive = false;
      updateHandsFreeButtonUI();
      window.AvatarEngine?.setMood('skeptical');
    }
    const chunksToCache = session.liveAudioChunks && session.liveAudioChunks.length > 0 ? [...session.liveAudioChunks] : null;
    const mimeToCache = session.liveAudioMime || 'audio/pcm;rate=24000';
    session.liveAudioChunks = [];
    const cust = getCurrentCustomer();
    if (chunksToCache && replayText) {
      const prof = customerVoiceProfiles[cust.id] || customerVoiceProfiles.bergmann;
      const cleanCacheText = sanitizeSpokenText(replayText);
      if (cleanCacheText) {
        getTtsAudioContext().then(async (ctx) => {
          const buf = await decodeGeminiAudioToCleanAudioBuffer(ctx, chunksToCache, mimeToCache);
          putTtsAudioCache(`${cust.id}::${prof.voiceName}::${cleanCacheText}`, { ctx, audioBuffer: buf, modelUsed: session.model });
        }).catch(() => {});
      }
    }
    const activePlayer = session.audioPlayer;
    session.audioPlayer = null;
    if (activePlayer) {
      const started = activePlayer.finish();
      if (!started) {
        session.isAudioPlaying = false;
        finishLiveTurnUi(session);
      }
    } else {
      session.isAudioPlaying = false;
      const shouldSpeakFallback = Boolean(state.voiceOutputEnabled && replayText && !chunksToCache);
      if (shouldSpeakFallback) {
        state.isGenerating = false;
        showTypingIndicator(false);
        const walkoutForHttp = session.pendingWalkoutReaction || null;
        if (walkoutForHttp) {
          state.pendingWalkoutReaction = walkoutForHttp;
          session.pendingWalkoutReaction = null;
        }
        if (session.closeAfterTurnComplete || walkoutForHttp) stopLiveSession(true);
        speakWithGeminiTTS(replayText, cust.id, {
          triggerHandsFreeNextTurn: Boolean(state.handsFreeActive && !session.closeAfterTurnComplete && !walkoutForHttp),
          _skipLiveFallback: true
        });
      } else {
        finishLiveTurnUi(session);
      }
    }
  }
}

function enableLiveListeningUi(session) {
  if (!session || session.closedManually || state.liveSession !== session) return;
  session.micStreamingActive = true;
  session.pendingStartListening = false;
  state.isListening = true;
  setListeningVisuals(true);
  if (state.ttsAudioCtx && state.ttsAudioCtx.state === 'suspended') {
    state.ttsAudioCtx.resume().catch(() => {});
  }
  const panel = document.getElementById('silenceCountdownPanel');
  const statusLabel = document.getElementById('silenceStatusLabel');
  const secLabel = document.getElementById('silenceSecondsLabel');
  if (panel) panel.classList.add('hidden'); // Live-API nutzt Server-VAD statt clientseitigem 1s-Balken
  if (statusLabel) statusLabel.textContent = '⚡ Echtzeit-Live – sprich einfach los…';
  if (secLabel) secLabel.textContent = 'LIVE';
  updateTurnStatusUI('listening', '⚡ Echtzeit-Live aktiv – sprich einfach los…');

  // Prüfen, ob Capture-Processor grundsätzlich läuft (bei Stille liefert macOS NoiseSuppression legitime Null-Frames)
  if (session.micStream && !session.micLivenessTimerId && !session._micLivenessConfirmed) {
    const startFrames = session.micProcessedFrames || 0;
    session.micLivenessTimerId = setTimeout(() => {
      session.micLivenessTimerId = null;
      if (session.closedManually || state.liveSession !== session || !session.micStreamingActive) return;
      if ((session.micProcessedFrames || 0) === startFrames) {
        console.warn('Live-Mikrofon-Processor steht still – wechsle auf Browser-Spracherkennung.');
        fallbackFromLiveToHttp('Live-Mikrofon ohne Signal – wechsle auf Spracherkennung', true);
      } else {
        session._micLivenessConfirmed = true;
      }
    }, 1800);
  }
}

function handleCapturedPcmChunk(session, input, inputSampleRate) {
  session.micProcessedFrames = (session.micProcessedFrames || 0) + 1;
  if (!input || input.length === 0) return;

  let sq = 0;
  for (let i = 0; i < input.length; i++) sq += input[i] * input[i];
  const rms = Math.sqrt(sq / input.length);

  const nowMs = Date.now();
  if (nowMs - (session._lastLevelUiAt || 0) >= 65) {
    session._lastLevelUiAt = nowMs;
    const levelFill = document.getElementById('micLevelFill');
    if (levelFill) {
      const pct = Math.min(100, Math.round(rms * 900));
      levelFill.style.width = `${pct}%`;
    }
  }

  if (session.closedManually || !session.micStreamingActive || !session.setupComplete) return;
  if (!session.ws || session.ws.readyState !== 1) return;

  // Echo-Gate: Während die KI spricht (+ 220 ms Nachhall-Cooldown) kein Lautsprecher-Echo in den Live-Kontext speisen
  const inEchoWindow = session.isAudioPlaying || state.isAiSpeaking || (nowMs < (session.muteMicUntilMs || 0));
  if (inEchoWindow) {
    if (rms >= 0.085) {
      session.bargeInLoudFrames = (session.bargeInLoudFrames || 0) + 1;
    } else {
      session.bargeInLoudFrames = 0;
    }
    if (session.bargeInLoudFrames < 3) return;
  } else {
    session.bargeInLoudFrames = 0;
  }

  const pcmBytes = downsampleFloat32ToInt16Pcm(input, inputSampleRate || 48000, 16000);
  const b64 = uint8ToBase64(pcmBytes);
  try {
    session.ws.send(JSON.stringify({
      realtimeInput: {
        audio: {
          mimeType: 'audio/pcm;rate=16000',
          data: b64
        }
      }
    }));
  } catch (e) {}
}

async function ensureMicAudioWorkletRegistered(audioCtx) {
  if (audioCtx._micWorkletLoaded) return true;
  if (
    !audioCtx.audioWorklet ||
    typeof audioCtx.audioWorklet.addModule !== 'function' ||
    typeof AudioWorkletNode !== 'function' ||
    typeof Blob === 'undefined' ||
    typeof URL === 'undefined' ||
    typeof URL.createObjectURL !== 'function'
  ) {
    return false;
  }
  const workletCode = `
    class BaeckermatMicProcessor extends AudioWorkletProcessor {
      constructor() {
        super();
        this._buf = new Float32Array(2048);
        this._idx = 0;
      }
      process(inputs) {
        const ch = inputs[0] && inputs[0][0];
        if (!ch) return true;
        for (let i = 0; i < ch.length; i++) {
          this._buf[this._idx++] = ch[i];
          if (this._idx >= this._buf.length) {
            const out = this._buf.slice();
            this.port.postMessage(out, [out.buffer]);
            this._idx = 0;
          }
        }
        return true;
      }
    }
    registerProcessor('baeckermat-mic-capture', BaeckermatMicProcessor);
  `;
  const blobUrl = URL.createObjectURL(new Blob([workletCode], { type: 'application/javascript' }));
  try {
    await audioCtx.audioWorklet.addModule(blobUrl);
    audioCtx._micWorkletLoaded = true;
    return true;
  } catch (e) {
    return false;
  } finally {
    try { URL.revokeObjectURL?.(blobUrl); } catch (e) {}
  }
}

async function startLiveMicCapture(session) {
  if (session.micStream || session.closedManually) return true;
  if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
    return false;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1
      }
    });
    if (session.closedManually || state.liveSession !== session) {
      stream.getTracks().forEach(t => { try { t.stop(); } catch (e) {} });
      return false;
    }

    // Einziger geteilter AudioContext (bereits synchron beim Klick entsperrt -> Safari pausiert sonst zweite Instanz)
    const audioCtx = await getTtsAudioContext();
    if (session.closedManually || state.liveSession !== session) {
      stream.getTracks().forEach(t => { try { t.stop(); } catch (e) {} });
      return false;
    }

    const src = audioCtx.createMediaStreamSource(stream);
    const silentGain = audioCtx.createGain();
    silentGain.gain.value = 0.00001;

    const workletReady = await ensureMicAudioWorkletRegistered(audioCtx);
    if (workletReady && !session.closedManually && state.liveSession === session) {
      try {
        const workletNode = new AudioWorkletNode(audioCtx, 'baeckermat-mic-capture', {
          numberOfInputs: 1,
          numberOfOutputs: 1,
          channelCount: 1
        });
        workletNode.port.onmessage = (ev) => {
          handleCapturedPcmChunk(session, ev.data, audioCtx.sampleRate || 48000);
        };
        src.connect(workletNode);
        workletNode.connect(silentGain);
        silentGain.connect(audioCtx.destination);
        session.micStream = stream;
        session.micSourceNode = src;
        session.workletNode = workletNode;
        session.micGainNode = silentGain;
        return true;
      } catch (workletErr) {
        console.warn('AudioWorkletNode fehlgeschlagen, nutze ScriptProcessor:', workletErr);
      }
    }

    if (session.closedManually || state.liveSession !== session) {
      stream.getTracks().forEach(t => { try { t.stop(); } catch (e) {} });
      return false;
    }

    const processor = audioCtx.createScriptProcessor(2048, 1, 1);
    processor.onaudioprocess = (ev) => {
      handleCapturedPcmChunk(session, ev.inputBuffer?.getChannelData(0), audioCtx.sampleRate || 48000);
    };
    src.connect(processor);
    processor.connect(silentGain);
    silentGain.connect(audioCtx.destination);

    session.micStream = stream;
    session.micSourceNode = src;
    session.processorNode = processor;
    session.micGainNode = silentGain;
    return true;
  } catch (err) {
    console.warn('Live-Mikrofon-Capture fehlgeschlagen:', err);
    return false;
  }
}

function fallbackFromLiveToHttp(reason, triggerListeningNow = true) {
  const prevSession = state.liveSession;
  const hadGreetingFallback = (!prevSession?.receivedAnyContent && prevSession?.initialGreetingFallbackText)
    ? prevSession.initialGreetingFallbackText
    : ((prevSession?.closeAfterTurnComplete && prevSession?.pendingReplayText && !(prevSession?.liveAudioChunks?.length))
        ? prevSession.pendingReplayText
        : null);
  const hadPendingText = hadGreetingFallback ? null : (prevSession?.pendingTextTurn || null);
  const httpAlreadyFailed = Boolean(prevSession?._httpAlreadyFailed);
  stopLiveSession(true);
  state.liveUnavailableForSession = true;
  state.isListening = false;
  updateAutoSendBadgeUI();
  updateApiStatusBadge(Boolean(state.apiKey), state.ttsModel);
  if (reason && !httpAlreadyFailed) {
    showChatNotice('info', `${reason} – Wechsle automatisch auf schnellen Streaming-Modus.`);
  }
  if (hadGreetingFallback) {
    const customer = getCurrentCustomer();
    if (httpAlreadyFailed) {
      speakWithCleanBrowserFallback(hadGreetingFallback, state.handsFreeActive && triggerListeningNow, ++state.ttsRequestSeq);
    } else {
      speakWithGeminiTTS(hadGreetingFallback, customer.id, {
        triggerHandsFreeNextTurn: state.handsFreeActive && triggerListeningNow,
        _skipLiveFallback: true
      });
    }
  } else if (hadPendingText) {
    requestGeminiResponse(hadPendingText);
  } else if (triggerListeningNow && state.handsFreeActive && !state.isAiSpeaking && !state.isGenerating) {
    startContinuousListening();
  }
}

/**
 * Entfernt interne Lösungs-Brotnamen und "-> Idealbrot"-Hinweise aus hiddenNeeds,
 * damit das Sprachmodell keinen fertigen Brotnamen verrät, sondern nur durch die Blume andeutet.
 */
function sanitizeHiddenNeedsForCustomerPrompt(hiddenNeeds) {
  let text = String(hiddenNeeds || '')
    .replace(/\s*->\s*[^.!\n]*[.!]?/g, '.')
    .replace(/\(Ideal\)/gi, '');
  if (typeof BREAD_DATABASE !== 'undefined' && Array.isArray(BREAD_DATABASE)) {
    for (const bread of BREAD_DATABASE) {
      if (!bread?.name) continue;
      const escaped = bread.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      text = text.replace(new RegExp(escaped, 'gi'), 'ein passendes Brot');
    }
  }
  return text.replace(/\s+/g, ' ').replace(/\.\s*\./g, '.').trim();
}

/**
 * Erstellt den einheitlichen Rollenspiel-Prompt für HTTP-Dialog und Live-WebSocket.
 * Hält echte Bedürfnisse verdeckt und steuert Charaktertyp (Unentschlossen / Schwierig / Klassik).
 */
function buildCustomerPersonaPrompt(customer, profile, includeLiveHistory = false) {
  const archetypeMeta = ARCHETYPE_META[customer.archetype] || ARCHETYPE_META.classic;
  const diffRule = state.difficultyMode === 'master'
    ? 'Prüfungs-Modus: Sei sehr zurückhaltend und verrate immer nur winzige Andeutungen durch die Blume, wenn exakt danach gefragt wurde.'
    : (state.difficultyMode === 'practice'
      ? 'Übungs-Modus: Hilf bei echtem Nachhaken mit einem dezenten Hinweis durch die Blume (z. B. zu Alltag, Geschmack oder Verträglichkeit), nenne aber niemals explizit Brot- oder Sortennamen.'
      : 'Standard-Modus: Gib Hinweise ausschließlich Stück für Stück und nur durch die Blume auf gezielte Rückfragen.');

  const safeHiddenNeeds = sanitizeHiddenNeedsForCustomerPrompt(customer.hiddenNeeds);
  const historyBlock = includeLiveHistory
    ? `\nBisheriger Gesprächsverlauf:\n${state.chatHistory.slice(-8).map(t => `${t.role === 'customer' ? customer.name : 'Azubi'}: ${t.text}`).join('\n') || `${customer.name}: ${customer.initialGreeting}`}`
    : '';

  return `Du bist ${customer.name} (${customer.tag}) an einer deutschen Bäckertheke.
Charakter & Verhalten: ${archetypeMeta.promptBehavior}
${diffRule}
Dein geheimer Hintergrund (NIEMALS direkt oder als Wunschliste aufsagen!): ${safeHiddenNeeds}
Gewünschte Menge (nur auf Nachfrage nennen): ${customer.desiredPortions.join(' oder ')} | Gewünschter Schnitt (nur auf Nachfrage nennen): ${customer.desiredCut ? 'geschnitten' : 'am Stück'}.
Stimmprofil: ${profile.voiceDirective}${historyBlock}

Strenge Gesprächsregeln:
1. NUR DURCH DIE BLUME & MAXIMAL 1 KLEINER HINWEIS PRO ANTWORT: Nenne NIEMALS einen konkreten Brotnamen (kein „Roggenvollkornbrot mit Kürbiskernen“, „Ur-Dinkel“, „Walnussbrot“, „Paderborner“ o. ä.) und zähle NIEMALS mehrere Wünsche oder Zutaten als Einkaufsliste auf! Umschreibe Vorlieben nur indirekt über Alltag, Geschmack, Gefühl oder Situation (z. B. „Es sollte nicht gleich am nächsten Tag trocken sein“, „Etwas Kräftiges mit richtigem Biss wäre mir lieb“).
2. ERST AUF KONKRETE RÜCKFRAGE – BEI STREIT ODER PAUSCHALEN FRAGEN VERSCHLOSSEN BLEIBEN: Antworte inhaltlich nur zu genau dem einen Punkt, nach dem der Verkäufer gerade gefragt hat (z. B. nur Anlass ODER nur Verträglichkeit ODER nur Kruste ODER nur Menge/Schnitt). Wenn der Verkäufer diskutiert, pampig ist oder pauschal fragt, verrate KEINE Produktwünsche.
3. INDIREKTE TIPPS BEI UNPASSENDEM VORSCHLAG: Schlägt der Verkäufer etwas Unpassendes vor oder stockt das Gespräch, gib genau einen kurzen Wink durch die Blume („Das klingt mir etwas zu hell/weich…“ oder „Bei Nüssen muss meine Freundin leider passen“), ohne das richtige Brot zu benennen.
4. SPRACHE & KÜRZE: Antworte ausschließlich auf Hochdeutsch in 1–2 kurzen, natürlichen Alltagssätzen (max. 18–22 Wörter) ohne Sternchen, Klammern, Regieanweisungen oder Sprechernamen.
5. GESPRÄCHSABBRUCH: Wenn der Verkäufer dich wiederholt beleidigt, anpampt, genervt abwimmelt oder grob unhöflich behandelt, brich den Kauf verärgert ab (z. B. dass du hier kein Brot mehr kaufst und gehst) und beende deine Antwort exakt mit [ABBRUCH].`;
}

async function connectAndStartLiveSession(options = {}) {
  const {
    startListeningAfterGreeting = true,
    initialPendingText = null,
    initialGreetingFallbackText = null,
    suppressMicCapture = false,
    closeAfterTurnComplete = false,
    _httpAlreadyFailed = false,
    modelIndex = 0
  } = options;
  const candidates = getLiveCandidateModels();
  if (modelIndex >= candidates.length || !isLiveModeActive()) {
    if (!_httpAlreadyFailed) {
      fallbackFromLiveToHttp('Kein Live-Audio-Modell erreichbar', startListeningAfterGreeting);
    }
    return null;
  }

  stopLiveSession(false);
  const liveModel = candidates[modelIndex];
  const customer = getCurrentCustomer();
  const profile = customerVoiceProfiles[customer.id] || customerVoiceProfiles.bergmann;

  const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${state.apiKey}`;
  const ws = new WebSocket(wsUrl);
  const session = {
    model: liveModel,
    ws,
    setupComplete: false,
    closedManually: false,
    receivedAnyContent: false,
    micStreamingActive: false,
    suppressMicCapture,
    closeAfterTurnComplete,
    _httpAlreadyFailed,
    pendingStartListening: startListeningAfterGreeting,
    pendingTextTurn: initialPendingText,
    initialGreetingFallbackText,
    suppressNextTurnTranscript: Boolean(initialGreetingFallbackText),
    pendingReplayText: initialGreetingFallbackText || '',
    micStream: null,
    micSourceNode: null,
    processorNode: null,
    micGainNode: null,
    liveApprenticeText: '',
    liveApprenticeBubble: null,
    liveCustomerText: '',
    liveCustomerBubble: null,
    liveAudioChunks: [],
    liveAudioMime: 'audio/pcm;rate=24000',
    audioPlayer: null,
    outputRequestSeq: 0,
    isAudioPlaying: false,
    muteMicUntilMs: 0,
    bargeInLoudFrames: 0,
    messageQueue: Promise.resolve(),
    setupTimerId: null,
    closingFallbackTimerId: null
  };
  state.liveSession = session;

  // Parallel zum Setup bereits Mikrofonzugriff öffnen (außer bei reinem Abschluss-/Ausgabesatz)
  const micPromise = suppressMicCapture ? Promise.resolve(true) : startLiveMicCapture(session);

  const retrySameLiveWithoutLang = () => connectAndStartLiveSession({
    startListeningAfterGreeting: session.pendingStartListening,
    initialPendingText: session.pendingTextTurn,
    initialGreetingFallbackText: session.initialGreetingFallbackText,
    suppressMicCapture: session.suppressMicCapture,
    closeAfterTurnComplete: session.closeAfterTurnComplete,
    _httpAlreadyFailed: session._httpAlreadyFailed,
    modelIndex
  });

  const retryNextLiveModel = () => connectAndStartLiveSession({
    startListeningAfterGreeting: session.pendingStartListening,
    initialPendingText: session.pendingTextTurn,
    initialGreetingFallbackText: session.initialGreetingFallbackText,
    suppressMicCapture: session.suppressMicCapture,
    closeAfterTurnComplete: session.closeAfterTurnComplete,
    _httpAlreadyFailed: session._httpAlreadyFailed,
    modelIndex: modelIndex + 1
  });

  session.setupTimerId = setTimeout(() => {
    if (!session.setupComplete && !session.closedManually && state.liveSession === session) {
      state.unavailableLiveModels.add(liveModel);
      if (modelIndex + 1 < candidates.length) {
        retryNextLiveModel();
      } else {
        fallbackFromLiveToHttp('Live-API Zeitüberschreitung', session.pendingStartListening);
      }
    }
  }, 2500);

  ws.onopen = async () => {
    if (session.closedManually || state.liveSession !== session) return;

    const liveSpeechConfig = {
      voiceConfig: {
        prebuiltVoiceConfig: { voiceName: profile.voiceName }
      }
    };
    if (!state.liveModelsWithoutLanguageCode?.has(liveModel)) {
      liveSpeechConfig.languageCode = 'de-DE';
    }

    const setupPayload = {
      setup: {
        model: `models/${liveModel}`,
        generationConfig: {
          responseModalities: state.voiceOutputEnabled ? ['AUDIO'] : ['TEXT'],
          speechConfig: liveSpeechConfig
        },
        systemInstruction: {
          parts: [{
            text: `${buildCustomerPersonaPrompt(customer, profile, true)}
Halte durchgehend exakt dieselbe deutsche Stimme, Stimmlage, Akzentfreiheit und Sprechweise wie zu Beginn des Gesprächs.`
          }]
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        realtimeInputConfig: {
          automaticActivityDetection: {
            disabled: false,
            silenceDurationMs: Math.min(800, getSilenceTimeoutMs())
          }
        }
      }
    };

    try {
      ws.send(JSON.stringify(setupPayload));
    } catch (e) {
      fallbackFromLiveToHttp('Live-Setup konnte nicht gesendet werden', session.pendingStartListening);
      return;
    }

    const micOk = await micPromise;
    if (!micOk && !session.pendingTextTurn && !session.closedManually && state.liveSession === session) {
      fallbackFromLiveToHttp('Live-Mikrofon nicht verfügbar', session.pendingStartListening);
    }
  };

  ws.onmessage = (event) => {
    session.messageQueue = (session.messageQueue || Promise.resolve())
      .then(() => handleLiveServerMessage(session, event.data))
      .catch((err) => console.warn('Live-Nachricht Verarbeitungsfehler:', err));
  };

  ws.onerror = () => {
    if (session.closedManually || state.liveSession !== session) return;
    if (!session.receivedAnyContent) {
      state.unavailableLiveModels.add(liveModel);
      if (modelIndex + 1 < candidates.length) {
        retryNextLiveModel();
      } else {
        fallbackFromLiveToHttp('Live-WebSocket nicht unterstützt', session.pendingStartListening);
      }
    } else if (session.closeAfterTurnComplete && session.pendingReplayText && (!session.liveAudioChunks || session.liveAudioChunks.length === 0)) {
      fallbackFromLiveToHttp('Live-Abschlussreaktion unterbrochen', false);
    }
  };

  ws.onclose = (ev) => {
    if (session.closedManually || state.liveSession !== session) return;
    const reasonLower = String(ev?.reason || '').toLowerCase();
    if (!session.receivedAnyContent && !state.liveModelsWithoutLanguageCode.has(liveModel) && (ev?.code === 1007 || reasonLower.includes('language') || reasonLower.includes('speech'))) {
      state.liveModelsWithoutLanguageCode.add(liveModel);
      retrySameLiveWithoutLang();
      return;
    }
    if (!session.receivedAnyContent && (ev?.code !== 1000)) {
      state.unavailableLiveModels.add(liveModel);
      if (modelIndex + 1 < candidates.length) {
        retryNextLiveModel();
        return;
      }
      fallbackFromLiveToHttp(`Live-Verbindung beendet (${ev?.code || 'Fehler'})`, session.pendingStartListening);
    } else if (session.closeAfterTurnComplete && session.pendingReplayText && (!session.liveAudioChunks || session.liveAudioChunks.length === 0)) {
      fallbackFromLiveToHttp('Live-Verbindung vor Abschlussreaktion beendet', false);
    } else {
      stopLiveSession(true);
    }
  };

  return session;
}

function sendLiveTextTurn(text) {
  const session = state.liveSession;
  if (!session || session.closedManually) return false;
  if (!session.setupComplete || !session.ws || session.ws.readyState !== 1) {
    session.pendingTextTurn = text;
    return true;
  }
  state.isGenerating = true;
  showTypingIndicator(true);
  updateTurnStatusUI('loading', 'Kunde antwortet live…');
  try {
    session.ws.send(JSON.stringify({
      clientContent: {
        turns: [{ role: 'user', parts: [{ text }] }],
        turnComplete: true
      }
    }));
    return true;
  } catch (e) {
    return false;
  }
}

/* =========================================================================
   8. UI-HELFER FÜR AVATAR, STATUS & FREISPRECH-HAUPTBUTTON
   ========================================================================= */

function updateTurnStatusUI(mode, labelText) {
  const statusText = document.getElementById('ttsStatusText');
  const eq = document.getElementById('audioEqualizer');
  const dot = document.getElementById('turnStatusDot');
  const box = document.getElementById('turnStatusBox');
  const levelWrap = document.getElementById('micLevelWrap');

  if (statusText) statusText.textContent = labelText;

  if (mode === 'listening') {
    levelWrap?.classList.remove('hidden');
    levelWrap?.classList.add('flex');
  } else {
    levelWrap?.classList.add('hidden');
    levelWrap?.classList.remove('flex');
  }

  if (mode === 'speaking') {
    eq?.classList.remove('hidden');
    eq?.classList.add('flex');
    dot?.classList.add('hidden');
    if (box) box.className = 'flex-1 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-amber-950/50 border border-amber-400/50 text-xs min-w-0 transition-colors';
  } else if (mode === 'listening') {
    eq?.classList.add('hidden');
    eq?.classList.remove('flex');
    dot?.classList.remove('hidden');
    if (dot) dot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0';
    if (box) box.className = 'flex-1 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-emerald-950/55 border border-emerald-400/55 text-xs min-w-0 transition-colors';
  } else if (mode === 'loading') {
    eq?.classList.add('hidden');
    eq?.classList.remove('flex');
    dot?.classList.remove('hidden');
    if (dot) dot.className = 'w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0';
    if (box) box.className = 'flex-1 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-stone-950/90 border border-amber-400/35 text-xs min-w-0 transition-colors';
  } else {
    eq?.classList.add('hidden');
    eq?.classList.remove('flex');
    dot?.classList.remove('hidden');
    if (dot) dot.className = 'w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0';
    if (box) box.className = 'flex-1 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-stone-950/90 border border-white/10 text-xs min-w-0 transition-colors';
  }
}

function setAvatarSpeakingVisuals(isSpeaking) {
  const wave = document.getElementById('avatarSoundWaves');
  const mouth = document.getElementById('avatarMouth');
  const avatarBox = document.getElementById('customerAvatarContainer');

  if (isSpeaking) {
    wave?.classList.remove('hidden');
    avatarBox?.classList.add('avatar-speaking', 'scale-[1.03]');
    if (!window.AvatarEngine) {
      mouth?.classList.add('animate-mouth-talk');
    } else {
      mouth?.classList.remove('animate-mouth-talk');
    }
  } else {
    wave?.classList.add('hidden');
    avatarBox?.classList.remove('avatar-speaking', 'scale-[1.03]');
    mouth?.classList.remove('animate-mouth-talk');
  }
  window.AvatarEngine?.setSpeaking(Boolean(isSpeaking));
}

function resetMessagePlayButtons() {
  state.activePlayingMessageId = null;
  document.querySelectorAll('.msg-play-btn').forEach(btn => {
    btn.innerHTML = '<span>🔊</span><span>Anhören</span>';
    btn.classList.remove('bg-amber-500/30', 'border-amber-400');
  });
}

function updateHandsFreeButtonUI() {
  const btn = document.getElementById('handsFreeMainBtn');
  const icon = document.getElementById('handsFreeMainIcon');
  const label = document.getElementById('handsFreeMainLabel');
  const presenceBadge = document.getElementById('counterPresenceBadge');
  const presenceDot = document.getElementById('counterPresenceDot');
  const presenceText = document.getElementById('counterPresenceText');
  const chatHeaderDot = document.getElementById('chatHeaderDot');

  if (state.handsFreeActive) {
    btn.className = 'min-h-[52px] w-full px-4 py-3 rounded-xl bg-gradient-to-r from-red-600/90 to-rose-700/90 hover:from-red-500 hover:to-rose-600 text-white font-extrabold text-xs sm:text-sm border border-red-400/40 shadow-lg shadow-red-950/40 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer';
    icon.textContent = '⏹';
    label.textContent = 'Gespräch pausieren';

    presenceBadge.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 border border-emerald-400/35 text-emerald-300';
    presenceDot.className = 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse';
    presenceText.textContent = 'Freisprech-Dialog aktiv';
    chatHeaderDot.className = 'inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse';
  } else {
    btn.className = 'min-h-[52px] w-full px-4 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-stone-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer';
    icon.textContent = '🎙️';
    label.textContent = state.conversationStarted ? 'Freisprech-Dialog fortsetzen' : 'Kundengespräch starten';

    presenceBadge.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 border border-amber-400/35 text-amber-300';
    presenceDot.className = 'w-2 h-2 rounded-full bg-amber-400';
    presenceText.textContent = state.conversationStarted ? 'Gespräch pausiert' : 'Wartet am Tresen';
    chatHeaderDot.className = 'inline-block w-2 h-2 rounded-full bg-amber-400';
  }
}

async function ensureMicrophonePermissionOnUserGesture() {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    let shouldPrompt = false;
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const perm = await navigator.permissions.query({ name: 'microphone' });
        shouldPrompt = perm.state === 'prompt';
      } catch (e) {
        shouldPrompt = false;
      }
    }
    if (shouldPrompt) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => {
        try { t.stop(); } catch (e) {}
      });
    }
  } catch (e) {
    // Berechtigung wird ggf. direkt über SpeechRecognition angefordert oder behandelt
  }
}

/**
 * Haupt-Button unter dem Avatar:
 * Startet den Freisprech-Dialog (Kundenbegrüßung -> automatisches Mikrofon)
 * oder pausiert ihn sauber.
 */
async function toggleHandsFreeConversation() {
  // AudioContext & SpeechSynthesis beim Benutzerklick synchron entsperren (damit User-Gesture für Audio & STT erhalten bleibt)
  unlockAudioOnUserGesture();

  if (state.handsFreeActive) {
    // Gespräch pausieren
    state.handsFreeActive = false;
    stopListening(true);
    stopLiveSession(true);
    stopCustomerAudio();
    updateHandsFreeButtonUI();
    updateTurnStatusUI('idle', 'Freisprech-Dialog pausiert');
    showToast('Freisprech-Dialog pausiert');
    return;
  }

  // Gespräch starten oder fortsetzen
  state.handsFreeActive = true;
  updateHandsFreeButtonUI();
  if (!isLiveModeActive()) {
    ensureMicrophonePermissionOnUserGesture();
  }

  const customer = getCurrentCustomer();

  if (!state.conversationStarted) {
    state.conversationStarted = true;
    state.chatHistory = [];
    document.getElementById('customerSubtext').textContent = customer.counterObservation;
    document.getElementById('chatHistory').innerHTML = '';
    updateHandsFreeButtonUI();

    appendChatMessage('customer', customer.initialGreeting);
    state.lastCustomerMessage = customer.initialGreeting;

    if (isLiveModeActive()) {
      // Begrüßung und alle Folgeturns laufen über exakt dieselbe Live-Stimme (kein Engine-Wechsel mitten im Gespräch)
      connectAndStartLiveSession({
        startListeningAfterGreeting: true,
        initialPendingText: `Sprich jetzt zur Begrüßung genau diesen deutschen Satz und bleibe in deiner Rolle: "${customer.initialGreeting}"`,
        initialGreetingFallbackText: customer.initialGreeting
      });
    } else {
      // Sprachausgabe synchron im Klick-Kontext starten (kein vorheriges await, damit Safari/Chrome Audio nicht blockieren)
      speakWithGeminiTTS(customer.initialGreeting, customer.id, { triggerHandsFreeNextTurn: true });
    }
  } else {
    // Fortsetzen: Direkt synchron im Klick-Kontext das Mikrofon aktivieren
    if (isLiveModeActive()) {
      connectAndStartLiveSession({ startListeningAfterGreeting: true });
    } else {
      startContinuousListening();
    }
  }
}

function replayLastCustomerUtterance() {
  unlockAudioOnUserGesture();
  const customer = getCurrentCustomer();
  const textToPlay = state.lastCustomerMessage || customer.initialGreeting;
  speakWithGeminiTTS(textToPlay, customer.id, { triggerHandsFreeNextTurn: state.handsFreeActive });
}

function toggleVoiceOutput() {
  state.voiceOutputEnabled = !state.voiceOutputEnabled;
  const btn = document.getElementById('voiceOutputToggleBtn');
  const icon = document.getElementById('voiceOutputIcon');
  const label = document.getElementById('voiceOutputLabel');

  btn.setAttribute('aria-pressed', String(state.voiceOutputEnabled));

  if (state.voiceOutputEnabled) {
    icon.textContent = '🔊';
    label.textContent = 'Kundenstimme: An';
    showToast('Kundenstimme aktiviert');
  } else {
    icon.textContent = '🔇';
    label.textContent = 'Kundenstimme: Aus';
    stopCustomerAudio();
    showToast('Kundenstimme stummgeschaltet');
  }
}

function runHtmlAudioSelfTest() {
  unlockAudioOnUserGesture();
  if (!state.voiceOutputEnabled) {
    toggleVoiceOutput();
  }
  setPreferHtmlAudioPlayback(true);
  stopCustomerAudio();

  const customer = getCurrentCustomer();
  const chimeUrl = (() => {
    if (!canUseHtmlAudioPlayback()) return null;
    const sr = 24000;
    const len = Math.floor(sr * 0.36);
    const samples = new Float32Array(len);
    const half = Math.floor(len / 2);
    for (let i = 0; i < len; i++) {
      const freq = i < half ? 523.25 : 659.25;
      const env = i < half ? (1 - i / half) : (1 - (i - half) / (len - half));
      samples[i] = 0.35 * env * Math.sin((2 * Math.PI * freq * i) / sr);
    }
    return URL.createObjectURL(encodeMonoFloat32ToWavBlob(samples, sr));
  })();

  showChatNotice(
    'info',
    '🔊 <audio>-WAV Modus aktiviert: Spiele WAV-Glockenton & Kundenstimme direkt über HTML5 <audio>…',
    [{ label: '🗣️ macOS Browser-Stimme', onClick: () => runAudioSelfTest({ forceBrowser: true }) }]
  );

  const triggerVoice = () => {
    if (state.apiKey) {
      speakWithGeminiTTS('Hallo! Der Theken-Ton über Gemini funktioniert.', customer.id, {
        triggerHandsFreeNextTurn: false,
        _skipLiveFallback: true,
        diagnosticBanner: true
      });
    } else {
      speakWithCleanBrowserFallback('Hallo! Die deutsche Sprachausgabe am Tresen funktioniert.', false, ++state.ttsRequestSeq);
    }
  };

  if (chimeUrl) {
    const audioEl = new Audio(chimeUrl);
    audioEl.volume = 1.0;
    state.activeHtmlAudio = audioEl;
    state.activeHtmlAudioUrl = chimeUrl;
    audioEl.onended = () => {
      cleanupActiveHtmlAudio();
      triggerVoice();
    };
    audioEl.onerror = () => {
      cleanupActiveHtmlAudio();
      triggerVoice();
    };
    const p = audioEl.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        cleanupActiveHtmlAudio();
        triggerVoice();
      });
    }
  } else {
    triggerVoice();
  }
}

function runAudioSelfTest(options = {}) {
  unlockAudioOnUserGesture();

  if (!state.voiceOutputEnabled) {
    toggleVoiceOutput();
  }

  // 1. Deutlich hörbaren Bestätigungston über Web Audio abspielen + Hardware-Uhr prüfen
  let webAudioState = 'nicht verfügbar';
  let checkedCtx = null;
  let startClock = 0;
  try {
    sounds.init();
    const ctx = sounds.ctx || state.ttsAudioCtx;
    if (ctx) {
      checkedCtx = ctx;
      webAudioState = ctx.state;
      startClock = ctx.currentTime;
      const now = startClock;
      [523.25, 659.25].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.14);
        gain.gain.setValueAtTime(0.25, now + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.14);
        osc.stop(now + idx * 0.14 + 0.26);
      });
    }
  } catch (e) {
    webAudioState = `Fehler (${e.message})`;
  }

  if (checkedCtx && canUseHtmlAudioPlayback()) {
    setTimeout(() => {
      if (checkedCtx.state === 'closed') return;
      const dt = checkedCtx.currentTime - startClock;
      if (dt < 0.02 && !state.preferHtmlAudioPlayback) {
        setPreferHtmlAudioPlayback(true);
        showToast('WebAudio-Uhr blockiert – schalte automatisch auf <audio>-WAV um.');
      }
    }, 220);
  }

  // 2. Kurze Stimmprobe abspielen und Diagnose anzeigen
  const customer = getCurrentCustomer();
  const forceBrowser = Boolean(options?.forceBrowser || (typeof window !== 'undefined' && window.event?.shiftKey));
  if (state.apiKey && !forceBrowser) {
    showChatNotice(
      'info',
      `⏳ Ton-Test: 1) Glockenton wird abgespielt (WebAudio=${webAudioState}). 2) Prüfe Gemini TTS (${state.ttsModel})…`,
      [
        { label: '🔊 Per <audio>-WAV testen', onClick: () => runHtmlAudioSelfTest() },
        { label: '🗣️ macOS Browser-Stimme', onClick: () => runAudioSelfTest({ forceBrowser: true }) }
      ]
    );
    speakWithGeminiTTS('Hallo! Der Theken-Ton über Gemini funktioniert.', customer.id, {
      triggerHandsFreeNextTurn: false,
      _skipLiveFallback: true,
      diagnosticBanner: true
    });
  } else {
    const voices = ('speechSynthesis' in window) ? (window.speechSynthesis.getVoices() || []) : [];
    const deCount = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('de')).length;
    const bestVoice = selectBestGermanBrowserVoice();
    showChatNotice(
      'info',
      `⏳ Ton-Test: 1) Glockenton (WebAudio=${webAudioState}). 2) Offline-Browserstimme (${deCount} deutsche Stimmen, gewählt: ${bestVoice ? bestVoice.name : 'Systemstandard'}). Falls du keinen Ton hörst, prüfe macOS Lautstärke, Ausgabegerät & Chrome Tab-Stummschaltung.`,
      [{ label: '🔊 Per <audio>-WAV testen', onClick: () => runHtmlAudioSelfTest() }]
    );
    speakWithCleanBrowserFallback('Hallo! Die deutsche Sprachausgabe am Tresen funktioniert.', false, ++state.ttsRequestSeq);
  }
  showToast(`Ton-Test läuft (WebAudio: ${webAudioState})`);
}

