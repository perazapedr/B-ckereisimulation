// BäckerMat – 60fps 2.5D-Charakter-Engine (Atmen, Blinzeln, Blickverfolgung, Audio-Lip-Sync, Mimik)

const AVATAR_RIG_PROFILES = {
  bergmann: {
    archetype: 'classic',
    skinLight: '#f3d2b3',
    skinMid: '#d9ad87',
    skinShadow: '#b4835e',
    lipColor: '#9c5243',
    eyeColor: '#4a6b82',
    hairMain: '#9ca3af',
    hairShadow: '#6b7280',
    clothMain: '#292524',
    clothDark: '#1c1917',
    clothAccent: '#78350f',
    glasses: 'round',
    hat: 'flatcap',
    mustache: true,
    shirtCollar: '#dbeafe',
    hairStyle: 'short_senior',
    handsMode: 'rest'
  },
  sarah: {
    archetype: 'classic',
    skinLight: '#f7cbb0',
    skinMid: '#e0a27f',
    skinShadow: '#bc7b59',
    lipColor: '#b94e48',
    eyeColor: '#3f6212',
    hairMain: '#5c3317',
    hairShadow: '#3b1f0c',
    clothMain: '#c2410c',
    clothDark: '#9a3412',
    clothAccent: '#fed7aa',
    glasses: 'none',
    hairStyle: 'ponytail',
    handsMode: 'open'
  },
  demir: {
    archetype: 'classic',
    skinLight: '#eabfa0',
    skinMid: '#cc9672',
    skinShadow: '#a36e4c',
    lipColor: '#a64d47',
    eyeColor: '#3e2723',
    hairMain: '#27272a',
    hairShadow: '#18181b',
    clothMain: '#065f46',
    clothDark: '#064e3b',
    clothAccent: '#fbbf24',
    glasses: 'none',
    hairStyle: 'hijab',
    hijabColor: '#047857',
    hijabShadow: '#064e3b',
    handsMode: 'rest'
  },
  tim: {
    archetype: 'classic',
    skinLight: '#fae0cb',
    skinMid: '#e7b999',
    skinShadow: '#c48f6c',
    lipColor: '#b56357',
    eyeColor: '#2563eb',
    hairMain: '#451a03',
    hairShadow: '#290f02',
    clothMain: '#1e3a8a',
    clothDark: '#172554',
    clothAccent: '#93c5fd',
    glasses: 'none',
    hairStyle: 'tousled',
    handsMode: 'casual'
  },
  lukas: {
    archetype: 'undecided',
    skinLight: '#f5d4bc',
    skinMid: '#dfa986',
    skinShadow: '#ba815e',
    lipColor: '#a86055',
    eyeColor: '#4b6b5c',
    hairMain: '#6e472b',
    hairShadow: '#462b18',
    clothMain: '#0f766e',
    clothDark: '#115e59',
    clothAccent: '#99f6e4',
    glasses: 'none',
    stubble: true,
    hairStyle: 'wavy_short',
    handsMode: 'chin_think'
  },
  hannelore: {
    archetype: 'undecided',
    skinLight: '#fae0cf',
    skinMid: '#e6bda6',
    skinShadow: '#c29279',
    lipColor: '#b85c63',
    eyeColor: '#5b7c99',
    hairMain: '#e5e7eb',
    hairShadow: '#cbd5e1',
    clothMain: '#6b21a8',
    clothDark: '#581c87',
    clothAccent: '#f3e8ff',
    glasses: 'round_gold',
    hairStyle: 'bun',
    handsMode: 'clasp'
  },
  maja: {
    archetype: 'undecided',
    skinLight: '#f9d7c2',
    skinMid: '#e5ae8f',
    skinShadow: '#be8364',
    lipColor: '#ba535b',
    eyeColor: '#5c4033',
    hairMain: '#3b0764',
    hairShadow: '#24043d',
    clothMain: '#be185d',
    clothDark: '#9d174d',
    clothAccent: '#fbcfe8',
    glasses: 'none',
    hairStyle: 'long_shoulder',
    handsMode: 'casual'
  },
  krawczyk: {
    archetype: 'difficult',
    skinLight: '#f0ccb3',
    skinMid: '#d5a484',
    skinShadow: '#ae7957',
    lipColor: '#9b5a52',
    eyeColor: '#475569',
    hairMain: '#64748b',
    hairShadow: '#334155',
    clothMain: '#0f172a',
    clothDark: '#020617',
    clothAccent: '#991b1b',
    shirtCollar: '#f1f5f9',
    tieColor: '#881337',
    glasses: 'rect',
    hairStyle: 'side_part',
    handsMode: 'impatient'
  },
  meissner: {
    archetype: 'difficult',
    skinLight: '#f5d2bc',
    skinMid: '#dfa888',
    skinShadow: '#b87f5f',
    lipColor: '#a6444b',
    eyeColor: '#3b5266',
    hairMain: '#7c2d12',
    hairShadow: '#431407',
    clothMain: '#3f3f46',
    clothDark: '#27272a',
    clothAccent: '#fef3c7',
    shirtCollar: '#fefce8',
    earrings: true,
    glasses: 'none',
    hairStyle: 'bob',
    handsMode: 'folded'
  }
};

function buildMouthInnerMarkup(spec, openness = 0, smile = 0) {
  const clampedOpen = Math.max(0, Math.min(1, openness));
  const curve = smile * 4.5;
  if (clampedOpen < 0.08) {
    const cy = 121 + curve;
    return `
      <path d="M97 120 Q110 ${cy.toFixed(1)} 123 120" stroke="${spec.lipColor}" stroke-width="2.7" stroke-linecap="round" fill="none"/>
      <path d="M102 ${(123.5 + curve * 0.4).toFixed(1)} Q110 ${(125 + curve * 0.4).toFixed(1)} 118 ${(123.5 + curve * 0.4).toFixed(1)}" stroke="${spec.skinShadow}" stroke-width="1" stroke-linecap="round" opacity="0.55" fill="none"/>
    `;
  }
  const halfH = 1.8 + clampedOpen * 7.8;
  const halfW = 11.5 - clampedOpen * 2.2;
  const xL = (110 - halfW).toFixed(1);
  const xR = (110 + halfW).toFixed(1);
  const topY = (120.5 - halfH * 0.35).toFixed(1);
  const botY = (121.5 + halfH * 1.05).toFixed(1);
  return `
    <path d="M${xL} 120.5 Q110 ${topY} ${xR} 120.5 Q110 ${botY} ${xL} 120.5 Z" fill="#4f1612" stroke="${spec.lipColor}" stroke-width="1.9" stroke-linejoin="round"/>
    <path d="M${(110 - halfW * 0.68).toFixed(1)} 120.2 Q110 ${(119.2 - halfH * 0.2).toFixed(1)} ${(110 + halfW * 0.68).toFixed(1)} 120.2" stroke="#fff7ed" stroke-width="1.8" stroke-linecap="round"/>
    ${clampedOpen > 0.35 ? `<ellipse cx="110" cy="${(121 + halfH * 0.55).toFixed(1)}" rx="${(halfW * 0.45).toFixed(1)}" ry="${(halfH * 0.25).toFixed(1)}" fill="#c9655c" opacity="0.72"/>` : ''}
  `;
}

function getMoodBrowMarkup(spec, mood) {
  if (mood === 'skeptical') {
    return `<path class="rig-brow-l" d="M82 77 L102 82" stroke="${spec.hairShadow}" stroke-width="3" stroke-linecap="round" fill="none"/><path class="rig-brow-r" d="M138 77 L118 82" stroke="${spec.hairShadow}" stroke-width="3" stroke-linecap="round" fill="none"/>`;
  }
  if (mood === 'unsure') {
    return `<path class="rig-brow-l" d="M82 79 Q92 73.5 102 78" stroke="${spec.hairShadow}" stroke-width="2.6" stroke-linecap="round" fill="none"/><path class="rig-brow-r" d="M118 76 Q128 80.5 138 77" stroke="${spec.hairShadow}" stroke-width="2.6" stroke-linecap="round" fill="none"/>`;
  }
  if (mood === 'warm' || mood === 'happy') {
    return `<path class="rig-brow-l" d="M82 76.5 Q92 71.5 102 76.5" stroke="${spec.hairShadow}" stroke-width="2.6" stroke-linecap="round" fill="none"/><path class="rig-brow-r" d="M118 76.5 Q128 71.5 138 76.5" stroke="${spec.hairShadow}" stroke-width="2.6" stroke-linecap="round" fill="none"/>`;
  }
  return `<path class="rig-brow-l" d="M82 78 Q92 73.5 102 78" stroke="${spec.hairShadow}" stroke-width="2.6" stroke-linecap="round" fill="none"/><path class="rig-brow-r" d="M118 78 Q128 73.5 138 78" stroke="${spec.hairShadow}" stroke-width="2.6" stroke-linecap="round" fill="none"/>`;
}

function renderCharacterRig(container, customer) {
  const customerId = customer?.id || 'bergmann';
  const spec = AVATAR_RIG_PROFILES[customerId] || AVATAR_RIG_PROFILES.bergmann;
  const uid = `rig_${customerId}`;

  let backHair = '';
  let frontHair = '';
  if (spec.hairStyle === 'ponytail') {
    backHair = `<path d="M138 66 C164 62, 168 96, 152 116 C144 102, 146 82, 134 76 Z" fill="${spec.hairShadow}"/><circle cx="144" cy="68" r="8" fill="#ea580c"/>`;
    frontHair = `<path d="M68 88 C68 42, 152 42, 152 88 C144 65, 118 60, 108 62 C90 64, 74 72, 68 88 Z" fill="url(#${uid}_hair)"/><path d="M72 68 Q110 56 148 68" stroke="#ea580c" stroke-width="5.5" stroke-linecap="round" fill="none"/>`;
  } else if (spec.hairStyle === 'hijab') {
    backHair = `<path d="M62 84 C62 34, 158 34, 158 84 L166 174 C146 186, 74 186, 54 174 Z" fill="${spec.hijabShadow}"/>`;
    frontHair = `<path d="M64 88 C64 38, 156 38, 156 88 C156 122, 148 156, 146 172 C122 182, 98 182, 74 172 C72 156, 64 122, 64 88 Z" fill="none" stroke="${spec.hijabColor}" stroke-width="11"/><path d="M74 68 Q110 55 146 68" stroke="${spec.clothAccent}" stroke-width="2.2" fill="none" opacity="0.85"/>`;
  } else if (spec.hairStyle === 'tousled') {
    frontHair = `<path d="M68 84 C66 42, 154 40, 152 84 C146 66, 132 60, 114 63 C98 58, 84 62, 68 84 Z" fill="url(#${uid}_hair)"/><path d="M84 56 C96 44, 120 42, 134 52" stroke="${spec.hairMain}" stroke-width="7" stroke-linecap="round" fill="none"/>`;
  } else if (spec.hairStyle === 'wavy_short') {
    frontHair = `<path d="M68 86 C68 42, 152 42, 152 86 C144 64, 124 60, 108 64 C90 66, 76 72, 68 86 Z" fill="url(#${uid}_hair)"/>`;
  } else if (spec.hairStyle === 'bun') {
    backHair = `<circle cx="110" cy="40" r="17" fill="${spec.hairShadow}"/><circle cx="110" cy="38" r="14" fill="url(#${uid}_hair)"/>`;
    frontHair = `<path d="M69 86 C69 44, 151 44, 151 86 C138 66, 120 62, 110 66 C100 62, 82 66, 69 86 Z" fill="url(#${uid}_hair)"/>`;
  } else if (spec.hairStyle === 'long_shoulder') {
    backHair = `<path d="M64 80 C62 36, 158 36, 156 80 L162 158 C142 162, 78 162, 58 158 Z" fill="${spec.hairShadow}"/>`;
    frontHair = `<path d="M68 82 C72 42, 148 42, 152 82 C136 62, 92 60, 68 82 Z" fill="url(#${uid}_hair)"/>`;
  } else if (spec.hairStyle === 'side_part') {
    frontHair = `<path d="M69 80 C70 43, 150 43, 151 80 C139 60, 92 58, 69 80 Z" fill="url(#${uid}_hair)"/><path d="M88 55 Q116 49 140 60" stroke="#cbd5e1" stroke-width="1.8" opacity="0.55" fill="none"/>`;
  } else if (spec.hairStyle === 'bob') {
    backHair = `<path d="M62 84 C62 36, 158 36, 158 84 L160 132 C148 138, 134 134, 132 126 L88 126 C86 134, 72 138, 60 132 Z" fill="${spec.hairShadow}"/>`;
    frontHair = `<path d="M66 86 C68 42, 152 42, 154 86 C138 62, 96 58, 66 86 Z" fill="url(#${uid}_hair)"/>`;
  } else {
    frontHair = `<path d="M68 82 C72 44, 148 44, 152 82 C136 66, 84 66, 68 82 Z" fill="url(#${uid}_hair)"/>`;
  }

  const hatSvg = spec.hat === 'flatcap'
    ? `<path d="M64 68 C68 38, 152 38, 156 68 Z" fill="#44403c" stroke="#292524" stroke-width="1.5"/>
       <path d="M60 68 Q110 62 162 65 Q138 74 60 68 Z" fill="#57534e"/>`
    : '';

  let glassesSvg = '';
  if (spec.glasses === 'round' || spec.glasses === 'round_gold') {
    const frameCol = spec.glasses === 'round_gold' ? '#d97706' : '#292524';
    glassesSvg = `
      <g>
        <circle cx="93" cy="91" r="11.5" stroke="${frameCol}" stroke-width="2.1" fill="rgba(255,255,255,0.09)"/>
        <circle cx="127" cy="91" r="11.5" stroke="${frameCol}" stroke-width="2.1" fill="rgba(255,255,255,0.09)"/>
        <line x1="104.5" y1="91" x2="115.5" y2="91" stroke="${frameCol}" stroke-width="2"/>
        <path d="M87 86 L94 84" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round" opacity="0.45"/>
        <path d="M121 86 L128 84" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round" opacity="0.45"/>
      </g>`;
  } else if (spec.glasses === 'rect') {
    glassesSvg = `
      <g>
        <rect x="81" y="84" width="23" height="14" rx="3" stroke="#0f172a" stroke-width="2.3" fill="rgba(255,255,255,0.1)"/>
        <rect x="116" y="84" width="23" height="14" rx="3" stroke="#0f172a" stroke-width="2.3" fill="rgba(255,255,255,0.1)"/>
        <line x1="104" y1="90" x2="116" y2="90" stroke="#0f172a" stroke-width="2.2"/>
        <path d="M84 87 L91 86" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round" opacity="0.45"/>
      </g>`;
  }

  const initialMood = spec.archetype === 'difficult' ? 'skeptical' : (spec.archetype === 'undecided' ? 'unsure' : 'neutral');
  const initialSmile = initialMood === 'skeptical' ? -0.45 : (initialMood === 'unsure' ? -0.1 : 0.75);

  let handsSvg = '';
  if (spec.handsMode === 'chin_think') {
    handsSvg = `
      <g class="rig-hands">
        <ellipse cx="64" cy="212" rx="14" ry="8" fill="${spec.skinMid}"/>
        <path d="M134 214 Q138 186 124 148" stroke="${spec.clothMain}" stroke-width="16" stroke-linecap="round" fill="none"/>
        <circle cx="122" cy="144" r="9.5" fill="${spec.skinLight}"/>
      </g>`;
  } else {
    handsSvg = `
      <g class="rig-hands">
        <ellipse cx="70" cy="214" rx="14" ry="7.2" fill="${spec.skinMid}" stroke="${spec.skinShadow}" stroke-width="0.9"/>
        <ellipse cx="150" cy="214" rx="14" ry="7.2" fill="${spec.skinMid}" stroke="${spec.skinShadow}" stroke-width="0.9"/>
      </g>`;
  }

  const collarSvg = spec.tieColor
    ? `<path d="M94 146 L110 184 L126 146 Z" fill="${spec.shirtCollar || '#f8fafc'}"/><path d="M107 154 L110 186 L113 154 Z" fill="${spec.tieColor}"/>`
    : spec.shirtCollar
      ? `<path d="M92 146 L110 176 L128 146 Z" fill="${spec.shirtCollar}"/>`
      : `<path d="M92 148 Q110 165 128 148" stroke="${spec.clothAccent}" stroke-width="3" fill="none" opacity="0.85"/>`;

  const svgMarkup = `
    <svg class="avatar-rig-svg w-full h-full overflow-visible" viewBox="0 0 220 220" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="${uid}_skin" cx="44%" cy="34%" r="65%">
          <stop offset="0%" stop-color="${spec.skinLight}"/>
          <stop offset="65%" stop-color="${spec.skinMid}"/>
          <stop offset="100%" stop-color="${spec.skinShadow}"/>
        </radialGradient>
        <linearGradient id="${uid}_hair" x1="68" y1="40" x2="152" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="${spec.hairMain}"/>
          <stop offset="100%" stop-color="${spec.hairShadow}"/>
        </linearGradient>
        <linearGradient id="${uid}_cloth" x1="36" y1="146" x2="184" y2="220" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="${spec.clothMain}"/>
          <stop offset="100%" stop-color="${spec.clothDark}"/>
        </linearGradient>
      </defs>

      <ellipse cx="110" cy="216" rx="76" ry="7" fill="rgba(0,0,0,0.55)"/>

      <g class="rig-body avatar-torso">
        <path d="M36 220 C38 168, 68 146, 110 146 C152 146, 182 168, 184 220 Z" fill="url(#${uid}_cloth)"/>
        <path d="M52 220 C58 178, 74 160, 92 152" stroke="rgba(255,255,255,0.12)" stroke-width="2" fill="none"/>
        <path d="M168 220 C162 178, 146 160, 128 152" stroke="rgba(0,0,0,0.28)" stroke-width="2.5" fill="none"/>
        ${collarSvg}
      </g>

      <g class="rig-neck">
        <rect x="97" y="128" width="26" height="28" rx="10" fill="${spec.skinShadow}"/>
        <path d="M97 134 Q110 148 123 134" fill="rgba(0,0,0,0.22)"/>
      </g>

      ${handsSvg}

      <g class="rig-head avatar-head">
        ${backHair}
        <ellipse cx="67" cy="96" rx="6.5" ry="11" fill="${spec.skinShadow}"/>
        <ellipse cx="153" cy="96" rx="6.5" ry="11" fill="${spec.skinShadow}"/>
        ${spec.earrings ? '<circle cx="66" cy="107" r="3" stroke="#fbbf24" stroke-width="1.6" fill="none"/><circle cx="154" cy="107" r="3" stroke="#fbbf24" stroke-width="1.6" fill="none"/>' : ''}

        <path d="M68 88 C68 50, 152 50, 152 88 C152 118, 134 140, 110 140 C86 140, 68 118, 68 88 Z" fill="url(#${uid}_skin)"/>
        <ellipse cx="83" cy="106" rx="9" ry="5" fill="#ea580c" opacity="0.11"/>
        <ellipse cx="137" cy="106" rx="9" ry="5" fill="#ea580c" opacity="0.11"/>
        ${spec.stubble ? '<path d="M74 110 C78 130, 96 138, 110 138 C124 138, 142 130, 146 110" fill="rgba(41,37,36,0.12)"/>' : ''}

        <path d="M110 88 L107.5 106 Q110 109.5 113.5 106" stroke="${spec.skinShadow}" stroke-width="2" stroke-linecap="round" fill="none"/>

        <g class="rig-brows">${getMoodBrowMarkup(spec, initialMood)}</g>

        <g class="rig-eyes avatar-eyes">
          <ellipse cx="93" cy="91" rx="8.2" ry="5.6" fill="#fffaf5"/>
          <g class="rig-pupil-l">
            <circle cx="93" cy="91" r="4.2" fill="${spec.eyeColor}"/>
            <circle cx="93" cy="91" r="2.2" fill="#111827"/>
            <circle cx="94.6" cy="89.4" r="1.2" fill="#ffffff"/>
          </g>
          <path d="M84.5 90 Q93 84.5 101.5 90" stroke="#292524" stroke-width="1.6" fill="none" stroke-linecap="round"/>
          <path class="rig-lid-l" d="M84.5 85 H101.5 V97 H84.5 Z" fill="${spec.skinMid}" style="transform-origin: 93px 85px;"/>

          <ellipse cx="127" cy="91" rx="8.2" ry="5.6" fill="#fffaf5"/>
          <g class="rig-pupil-r">
            <circle cx="127" cy="91" r="4.2" fill="${spec.eyeColor}"/>
            <circle cx="127" cy="91" r="2.2" fill="#111827"/>
            <circle cx="128.6" cy="89.4" r="1.2" fill="#ffffff"/>
          </g>
          <path d="M118.5 90 Q127 84.5 135.5 90" stroke="#292524" stroke-width="1.6" fill="none" stroke-linecap="round"/>
          <path class="rig-lid-r" d="M118.5 85 H135.5 V97 H118.5 Z" fill="${spec.skinMid}" style="transform-origin: 127px 85px;"/>
        </g>

        ${spec.mustache ? '<path d="M90 114 Q110 107 130 114 Q120 119 110 116 Q100 119 90 114 Z" fill="#d1d5db"/>' : ''}

        <g id="avatarMouth" class="rig-mouth" data-customer-id="${customerId}" style="transform-origin: 110px 121px;">
          ${buildMouthInnerMarkup(spec, 0, initialSmile)}
        </g>

        ${frontHair}
        ${hatSvg}
        ${glassesSvg}
      </g>
    </svg>
  `;

  if (container) {
    container.innerHTML = svgMarkup;
    container.setAttribute('data-archetype', spec.archetype || 'classic');
  }
  return svgMarkup;
}

const AvatarEngine = (() => {
  const engineState = {
    container: null,
    customerId: 'bergmann',
    archetype: 'classic',
    mood: 'neutral',
    isSpeaking: false,
    isListening: false,
    targetGazeX: 0,
    targetGazeY: 0,
    curGazeX: 0,
    curGazeY: 0,
    curMouthOpen: 0,
    blinkProgress: 0,
    nextBlinkAt: 0,
    doubleBlinkPending: false,
    nextIdleGlanceAt: 0,
    rafId: null,
    lastMouthStepAt: 0,
    analyserBuf: null
  };

  function isReducedMotion() {
    return typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function applyMouthAndMood(openness) {
    const mouth = document.getElementById('avatarMouth');
    const spec = AVATAR_RIG_PROFILES[engineState.customerId] || AVATAR_RIG_PROFILES.bergmann;
    const smileMap = { skeptical: -0.5, unsure: -0.1, neutral: 0.55, warm: 0.9, happy: 1.1 };
    const smile = smileMap[engineState.mood] ?? 0.55;
    if (mouth) {
      mouth.innerHTML = buildMouthInnerMarkup(spec, openness, smile);
    }
  }

  function applyBrows() {
    const container = engineState.container || document.getElementById('customerAvatarContainer');
    const brows = container && typeof container.querySelector === 'function' ? container.querySelector('.rig-brows') : null;
    if (brows) {
      const spec = AVATAR_RIG_PROFILES[engineState.customerId] || AVATAR_RIG_PROFILES.bergmann;
      brows.innerHTML = getMoodBrowMarkup(spec, engineState.mood);
    }
  }

  function tick(nowMs) {
    const container = engineState.container || document.getElementById('customerAvatarContainer');
    if (!container || typeof container.querySelector !== 'function') {
      engineState.rafId = null;
      return;
    }

    const t = nowMs * 0.001;
    const body = container.querySelector('.rig-body');
    const head = container.querySelector('.rig-head');
    const pupilL = container.querySelector('.rig-pupil-l');
    const pupilR = container.querySelector('.rig-pupil-r');
    const lidL = container.querySelector('.rig-lid-l');
    const lidR = container.querySelector('.rig-lid-r');

    // 1. Organisches Atmen
    const breath = Math.sin(t * 1.55);
    if (body?.style) {
      body.style.transform = `translateY(${(breath * -1.8).toFixed(2)}px) scaleY(${(1 + breath * 0.012).toFixed(4)})`;
    }

    // 2. Blickziel bei unentschlossenen Kunden / Idle-Blickwechsel
    if (!engineState.isSpeaking && !engineState.isListening && nowMs > engineState.nextIdleGlanceAt) {
      engineState.nextIdleGlanceAt = nowMs + 2200 + Math.random() * 2400;
      if (engineState.archetype === 'undecided') {
        const pts = [[0, 1.8], [-2.0, 1.2], [2.0, 1.2], [0, 0]];
        const pick = pts[Math.floor(Math.random() * pts.length)];
        engineState.targetGazeX = pick[0];
        engineState.targetGazeY = pick[1];
      } else {
        const pts = [[0, 0], [0, 0], [0, 1.4], [-1.3, 0], [1.3, 0]];
        const pick = pts[Math.floor(Math.random() * pts.length)];
        engineState.targetGazeX = pick[0];
        engineState.targetGazeY = pick[1];
      }
    }

    engineState.curGazeX += (engineState.targetGazeX - engineState.curGazeX) * 0.12;
    engineState.curGazeY += (engineState.targetGazeY - engineState.curGazeY) * 0.12;
    const gx = engineState.curGazeX.toFixed(2);
    const gy = engineState.curGazeY.toFixed(2);
    if (pupilL?.style) pupilL.style.transform = `translate(${gx}px, ${gy}px)`;
    if (pupilR?.style) pupilR.style.transform = `translate(${gx}px, ${gy}px)`;

    // 3. Kopfbewegung nach Zustand + Blickrichtung
    let headRot = Math.sin(t * 0.9) * 1.5 + engineState.curGazeX * 0.9;
    let headY = Math.sin(t * 1.55 - 0.5) * -1.3 + engineState.curGazeY * 1.3;
    if (engineState.isSpeaking) {
      headRot += Math.sin(t * 6.2) * 1.8;
      headY += Math.sin(t * 8.4) * 1.4;
    } else if (engineState.isListening) {
      headY += Math.max(0, Math.sin(t * 2.1)) * 2.4;
    } else if (engineState.archetype === 'difficult') {
      headRot = Math.sin(t * 1.4) * 1.2 - 0.8;
    }
    if (head?.style) {
      head.style.transform = `translateY(${headY.toFixed(2)}px) rotate(${headRot.toFixed(2)}deg)`;
    }

    // 4. Natürliches Blinzeln
    if (engineState.nextBlinkAt === 0) engineState.nextBlinkAt = nowMs + 2400;
    let lidScale = 0;
    if (nowMs >= engineState.nextBlinkAt) {
      const elapsed = nowMs - engineState.nextBlinkAt;
      if (elapsed < 140) {
        lidScale = Math.sin((elapsed / 140) * Math.PI);
      } else if (engineState.doubleBlinkPending) {
        engineState.doubleBlinkPending = false;
        engineState.nextBlinkAt = nowMs + 130;
      } else {
        engineState.doubleBlinkPending = Math.random() < 0.18;
        engineState.nextBlinkAt = nowMs + 2600 + Math.random() * 2900;
      }
    }
    if (lidL?.style) lidL.style.transform = `scaleY(${lidScale.toFixed(2)})`;
    if (lidR?.style) lidR.style.transform = `scaleY(${lidScale.toFixed(2)})`;

    // 5. Audio-reaktives / harmonisches Sprechen (Lip-Sync)
    let targetOpen = 0;
    if (engineState.isSpeaking) {
      const analyser = typeof state !== 'undefined' ? state.activeAnalyserNode : null;
      if (analyser && typeof analyser.getByteTimeDomainData === 'function') {
        if (!engineState.analyserBuf || engineState.analyserBuf.length !== analyser.fftSize) {
          engineState.analyserBuf = new Uint8Array(analyser.fftSize);
        }
        analyser.getByteTimeDomainData(engineState.analyserBuf);
        let sumSq = 0;
        for (let i = 0; i < engineState.analyserBuf.length; i += 2) {
          const norm = (engineState.analyserBuf[i] - 128) / 128;
          sumSq += norm * norm;
        }
        const rms = Math.sqrt(sumSq / (engineState.analyserBuf.length / 2));
        targetOpen = Math.min(1, rms * 4.4);
      } else {
        targetOpen = Math.max(0.08, Math.min(0.95, 0.45 + 0.35 * Math.sin(t * 17.5) + 0.2 * Math.sin(t * 27.3)));
      }
    }
    engineState.curMouthOpen += (targetOpen - engineState.curMouthOpen) * 0.42;
    if (nowMs - engineState.lastMouthStepAt >= 55) {
      engineState.lastMouthStepAt = nowMs;
      applyMouthAndMood(engineState.isSpeaking ? engineState.curMouthOpen : 0);
    }

    if (typeof requestAnimationFrame === 'function' && !isReducedMotion()) {
      engineState.rafId = requestAnimationFrame(tick);
    }
  }

  function ensureLoopStarted() {
    if (isReducedMotion()) return;
    // Nicht in gemockten Test-Umgebungen starten, in denen requestAnimationFrame nur eine Dummy-Zahl zurückgibt
    const hasRealBrowserRaf = typeof window !== 'undefined'
      && typeof window.requestAnimationFrame === 'function'
      && String(window.requestAnimationFrame).includes('[native code]');
    if (!hasRealBrowserRaf || engineState.rafId !== null) return;
    engineState.rafId = window.requestAnimationFrame(tick);
  }

  return {
    mount(container, customer) {
      if (!container) return;
      engineState.container = container;
      engineState.customerId = customer?.id || 'bergmann';
      engineState.archetype = customer?.archetype || 'classic';
      engineState.mood = engineState.archetype === 'difficult'
        ? 'skeptical'
        : (engineState.archetype === 'undecided' ? 'unsure' : 'neutral');
      engineState.isSpeaking = false;
      engineState.isListening = false;
      engineState.targetGazeX = 0;
      engineState.targetGazeY = 0;
      engineState.nextBlinkAt = 0;
      engineState.nextIdleGlanceAt = 0;
      renderCharacterRig(container, customer);
      ensureLoopStarted();
    },
    setSpeaking(speaking) {
      engineState.isSpeaking = Boolean(speaking);
      const container = engineState.container || document.getElementById('customerAvatarContainer');
      if (speaking) {
        container?.classList?.add('avatar-speaking');
        engineState.targetGazeX = 0;
        engineState.targetGazeY = 0;
        ensureLoopStarted();
      } else {
        container?.classList?.remove('avatar-speaking');
        applyMouthAndMood(0);
      }
    },
    setListening(listening) {
      engineState.isListening = Boolean(listening);
      const container = engineState.container || document.getElementById('customerAvatarContainer');
      if (listening) {
        container?.classList?.add('avatar-listening');
        engineState.targetGazeX = 0;
        engineState.targetGazeY = 0;
      } else {
        container?.classList?.remove('avatar-listening');
      }
    },
    lookAt(nx = 0, ny = 0) {
      engineState.targetGazeX = Math.max(-2.6, Math.min(2.6, nx * 2.4));
      engineState.targetGazeY = Math.max(-1.6, Math.min(2.6, ny * 2.4));
    },
    lookAtBread(colNormalized = 0) {
      engineState.targetGazeX = Math.max(-2.2, Math.min(2.2, colNormalized * 2.0));
      engineState.targetGazeY = 2.2;
    },
    setMood(mood) {
      engineState.mood = mood || 'neutral';
      applyBrows();
      if (!engineState.isSpeaking) {
        applyMouthAndMood(0);
      }
    }
  };
})();

if (typeof window !== 'undefined') {
  window.AvatarEngine = AvatarEngine;
}
