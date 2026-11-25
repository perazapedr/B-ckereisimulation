// BäckerMat – Brotsorten, Kunden-Szenarien, Stimmen & Modell-Konstanten

/* =========================================================================
   1. SORTIMENTSDATENBANK (11 HANDWERKSBROTE IN DER AUSLAGE)
   ========================================================================= */

const BREAD_CATEGORIES = [
  { id: 'all', label: 'Alle' },
  { id: 'sourdough', label: 'Roggen & Sauerteig' },
  { id: 'spelt', label: 'Dinkel & Urgetreide' },
  { id: 'wheat', label: 'Weizen & Mediterran' },
  { id: 'protein', label: 'Körner & Vital' }
];

const BREAD_DATABASE = [
  {
    id: 'reines_roggen',
    name: 'Reines Roggenbrot',
    category: 'sourdough',
    grainRatio: '100% Roggen (Type 1150)',
    doughMethod: '3-stufiger Natursauerteig (ohne Hefe)',
    shelfLife: '8–10 Tage saftig',
    traits: 'Hefefrei • Kräftig • Lange Frischhaltung',
    allergens: 'Roggen (Gluten)',
    description: 'Kräftig-aromatischer Roggenlaib ganz ohne zugesetzte Bäckerhefe. Die natürliche Milchsäure hält die Krume die ganze Woche saftig.',
    svgColor: '#78350f',
    tag: '100% Sauerteig'
  },
  {
    id: 'paderborner_landbrot',
    name: 'Paderborner Landbrot',
    category: 'sourdough',
    grainRatio: '70% Roggen / 30% Weizen',
    doughMethod: 'Milder Sauerteig, im Kasten gebacken',
    shelfLife: '5–6 Tage saftig',
    traits: 'Milde Säure • Weiche Krume • Keine Kerne',
    allergens: 'Roggen, Weizen (Gluten)',
    description: 'Bekömmliches Kastenbrot mit dünner, weicher Rinde und gleichmäßiger Krume ohne harte Kerne – ideal zum dünnen Schneiden und für die ganze Familie.',
    svgColor: '#854d0e',
    tag: 'Weiche Krume'
  },
  {
    id: 'kuerbiskern_vollkorn',
    name: 'Kürbiskern-Vollkornbrot',
    category: 'sourdough',
    grainRatio: '85% Roggenvollkorn / 15% Weizen',
    doughMethod: 'Sauerteig + Kürbiskern-Brühstück',
    shelfLife: '7–9 Tage saftig',
    traits: 'Rustikale Kruste • Ganze Kerne • Sehr satt',
    allergens: 'Roggen, Weizen (Gluten), Kürbiskerne',
    description: 'Herzhaft-rustikales Vollkornbrot mit gerösteten Kürbiskernen und dicker Kruste. Extrem sättigend und über eine Woche aromatisch-frisch.',
    svgColor: '#5c3412',
    tag: 'Vollkorn-Kernig'
  },
  {
    id: 'ur_dinkel_kruste',
    name: 'Ur-Dinkel-Kruste',
    category: 'spelt',
    grainRatio: '100% Oberkulmer Rotkorn',
    doughMethod: '24 Std. kalte Langzeitführung',
    shelfLife: '5–6 Tage mild-nussig',
    traits: 'Weizenfrei • FODMAP-arm • Magenmild',
    allergens: 'Dinkel (Gluten)',
    description: 'Reiner, unverkreuzter Ur-Dinkel ohne Weizenanteil. Durch 24 Stunden kalte Teigruhe besonders mild, FODMAP-reduziert und magenfreundlich.',
    svgColor: '#b45309',
    tag: '24h Teigruhe'
  },
  {
    id: 'walnuss_landbrot',
    name: 'Walnuss-Landbrot',
    category: 'spelt',
    grainRatio: '80% Dinkel / 20% Emmer',
    doughMethod: 'Langzeit-Vorteig + geröstete Walnüsse',
    shelfLife: '4–5 Tage aromatisch',
    traits: 'Fein-nussig • Zu Käse & Wein • Schalenfrüchte',
    allergens: 'Dinkel, Emmer (Gluten), Walnüsse',
    description: 'Aromatisches Genießerbrot mit ganzen, gerösteten Walnusskernen und feiner Honignote – der perfekte Begleiter zu Käseplatte und Rotwein.',
    svgColor: '#92400e',
    tag: 'Käse & Wein'
  },
  {
    id: 'buttermilch_kruste',
    name: 'Buttermilch-Kruste',
    category: 'wheat',
    grainRatio: '60% Weizen / 40% Roggen',
    doughMethod: 'Weizen-Vorteig + frische Buttermilch',
    shelfLife: '4–5 Tage zart',
    traits: 'Samtig-weich • Für süße Beläge • Enthält Milch',
    allergens: 'Weizen, Roggen (Gluten), Milch/Laktose',
    description: 'Besonders zarte, wattig-milde Krume mit ganz dünner Rinde dank echter Buttermilch. Harmoniert wunderbar mit Marmelade und Honig, sehr leicht zu kauen.',
    svgColor: '#c27829',
    tag: 'Samtig & Mild'
  },
  {
    id: 'baguette_tradition',
    name: 'Baguette de Tradition',
    category: 'wheat',
    grainRatio: '100% Französisches T65',
    doughMethod: 'Poolish-Vorteig & schonende Gare',
    shelfLife: 'Ofenfrisch am Kauftag (250g)',
    traits: 'Splitternde Kruste • Große Poren • Zum Dippen',
    allergens: 'Weizen (Gluten)',
    description: 'Hauchdünne, splitternde Kruste und große, unregelmäßige Luftlöcher in der Krume – ideal zum Dippen und Abreißen beim Grillen.',
    svgColor: '#d97706',
    tag: 'Wilde Porung'
  },
  {
    id: 'ciabatta_olive',
    name: 'Ciabatta Olive & Rosmarin',
    category: 'wheat',
    grainRatio: '100% Weizen (T550) & Olivenöl',
    doughMethod: 'Hohe Hydration (TA 178) & Biga-Vorteig',
    shelfLife: '1–2 Tage locker',
    traits: 'Oliven & Kräuter • Vegan • Ohne Nüsse',
    allergens: 'Weizen (Gluten)',
    description: 'Mediterranes Weißbrot mit nativem Olivenöl, schwarzen Oliven und frischem Rosmarin – saftig-grobporig für Antipasti, Weinabende oder Gäste mit Nussallergie.',
    svgColor: '#a16207',
    tag: 'Mediterran'
  },
  {
    id: 'krusten_mischbrot',
    name: 'Krusten-Mischbrot 70/30',
    category: 'wheat',
    grainRatio: '70% Weizen / 30% Roggen',
    doughMethod: 'Sauerteig + Bäckerhefe kombiniert',
    shelfLife: '3–4 Tage',
    traits: 'Krosser Ausbund • Lockere Krume • Allrounder',
    allergens: 'Weizen, Roggen (Gluten)',
    description: 'Herzhafter Alltags-Klassiker mit krossem Ausbund und lockerer Krume für süße und herzhafte Beläge.',
    svgColor: '#9a5b13',
    tag: 'Alltags-Klassiker'
  },
  {
    id: 'kraftkorn_protein',
    name: 'Kraftkorn-Proteinbrot',
    category: 'protein',
    grainRatio: 'Weizen-/Sojaprotein & Ölsaaten',
    doughMethod: 'Quellstück mit Chia, Leinsamen & Sesam',
    shelfLife: '3–4 Tage saftig',
    traits: '>22% Eiweiß • <8% KH • Kerne & Saaten',
    allergens: 'Weizen, Soja, Sesam',
    description: 'Über 22 % pflanzliches Eiweiß und unter 8 % Kohlenhydrate. Vollgepackt mit gerösteten Sonnenblumenkernen, Leinsamen und Chia.',
    svgColor: '#6b3e14',
    tag: 'High-Protein'
  },
  {
    id: 'hafer_vital',
    name: 'Hafer-Vitalbrot',
    category: 'protein',
    grainRatio: '65% Weizen / 35% Vollkorn-Hafer',
    doughMethod: 'Haferflocken-Brühstück & Honig-Vorteig',
    shelfLife: '5 Tage saftig',
    traits: 'Beta-Glucan • Ohne harte Kerne • Laktosefrei',
    allergens: 'Weizen, Hafer (Gluten)',
    description: 'Saftiges Vollkorn-Haferbrot ohne harte Kerne – liefert langanhaltende komplexe Kohlenhydrate und Ballaststoffe für Ausdauer und Alltag.',
    svgColor: '#a86424',
    tag: 'Hafer-Energie'
  }
];

/* =========================================================================
   2. KUNDEN-STIMMPROFILE, ARCHETYPEN & 9 FACHSCHUL-SZENARIEN
   ========================================================================= */

const ARCHETYPE_META = {
  classic: {
    label: 'Klassik',
    badgeClass: 'bg-stone-800 text-stone-200 border-white/10',
    promptBehavior: 'Du bist ein freundlicher, aber nicht voreiliger Kunde. Verrate deine genauen Anforderungen (Unverträglichkeiten, Haushaltsgröße, Schnittwunsch) NICHT alle auf einmal, sondern antworte erst konkret auf das, was der Verkäufer wirklich fragt.'
  },
  undecided: {
    label: 'Unentschlossen',
    badgeClass: 'bg-sky-950/80 text-sky-200 border-sky-400/35',
    promptBehavior: 'Du weißt selbst anfangs NICHT genau, welches Brot du willst. Antworte zunächst vage oder zögerlich ("Ach, ich bin mir gar nicht sicher…"), bis der Verkäufer dich empathisch durch konkrete Fragen (Anlass, Gäste/Haushalt, Geschmack, Zähne/Verträglichkeit, Allergien) schrittweise hinführt.'
  },
  difficult: {
    label: 'Schwierig / Kritisch',
    badgeClass: 'bg-rose-950/80 text-rose-200 border-rose-400/40',
    promptBehavior: 'Du wirkst anfangs merklich unsympathisch: ungeduldig, herablassend oder misstrauisch. Wenn der Verkäufer genervt, patzig, unsicher oder ausweichend reagiert, bleibe schroff und gib keine Details preis. Wenn der Verkäufer jedoch ruhig, empathisch, respektvoll und fachlich souverän bleibt, entspannst du dich schrittweise und nennst deinen tatsächlichen Bedarf.'
  }
};

const STANDARD_DISCOVERY_QUESTIONS = [
  'Für welchen Anlass oder Belag suchen Sie denn ein Brot?',
  'Mögen Sie es lieber mild-saftig oder kräftig mit krosser Kruste?',
  'Gibt es Unverträglichkeiten, Allergien oder Dinge, die Sie meiden?',
  'Für wie viele Personen ist es – und darf ich es schneiden?'
];

const customerVoiceProfiles = {
  bergmann: {
    voiceName: 'Charon',
    voiceDirective: 'Deutsch, ruhiger älterer Stammkunde (Ende 60), bodenständig, warm und höflich an der Bäckertheke, gleichmäßiges ruhiges Sprechtempo.'
  },
  sarah: {
    voiceName: 'Aoede',
    voiceDirective: 'Deutsch, freundliche junge Sportlerin (Ende 20), lebendig, klar artikuliert und natürlich-herzlich.'
  },
  demir: {
    voiceName: 'Kore',
    voiceDirective: 'Deutsch, herzliche Familienmutter (Anfang 40), ruhig, höflich, leicht besorgt wegen Verträglichkeit.'
  },
  tim: {
    voiceName: 'Puck',
    voiceDirective: 'Deutsch, lockerer Student (Anfang 20), entspannt, umgangssprachlich-freundlich.'
  },
  lukas: {
    voiceName: 'Orus',
    voiceDirective: 'Deutsch, leicht verlegener und unentschlossener Mann (Anfang 30), zögert gelegentlich ("ähm", "hm"), freundlich suchend.'
  },
  hannelore: {
    voiceName: 'Leda',
    voiceDirective: 'Deutsch, liebe ältere Dame (Mitte 70), sanfte, leicht unsichere und dankbare Stimme, ruhiges Sprechtempo.'
  },
  maja: {
    voiceName: 'Zephyr',
    voiceDirective: 'Deutsch, gestresste junge Studentin (Anfang 20), leicht überfordert beim Blick auf den Einkaufszettel, schnelles natürliches Tempo.'
  },
  krawczyk: {
    voiceName: 'Fenrir',
    voiceDirective: 'Deutsch, ungeduldiger, schroffer und leicht herablassender Mann (Mitte 50) unter Zeitdruck, bestimmter, trockener Tonfall.'
  },
  meissner: {
    voiceName: 'Kore',
    voiceDirective: 'Deutsch, kühle, skeptische und kritische Kundin (Ende 40), scharfer prüfender Unterton, anfangs abweisend, später sachlich-respektvoll.'
  }
};

const CUSTOMER_SCENARIOS = [
  {
    id: 'bergmann',
    name: 'Herr Bergmann (68)',
    tag: 'Rentner • Stammkunde',
    archetype: 'classic',
    counterObservation: 'Schaut prüfend in die Brotauslage und räuspert sich freundlich.',
    avatarImg: 'assets/avatars/bergmann.jpg',
    avatarSvg: `
          <svg class="avatar-stage-svg w-full h-full text-amber-200" viewBox="0 0 100 100" fill="none" aria-hidden="true">
            <g class="avatar-torso">
              <path d="M16 100 C16 70, 33 63, 50 63 C67 63, 84 70, 84 100 Z" fill="#292524"/>
              <path d="M50 63 L50 100" stroke="#78350f" stroke-width="2.2"/>
              <path d="M42 63 L50 73 L58 63" stroke="#57534e" stroke-width="1.5" fill="none"/>
            </g>
            <g class="avatar-head">
              <circle cx="50" cy="40" r="22" fill="#d4b996"/>
              <path d="M26 32 C30 18, 70 18, 74 32 Z" fill="#44403c"/>
              <path d="M24 32 C40 32, 60 32, 78 30" stroke="#78716c" stroke-width="4" stroke-linecap="round"/>
              <g class="avatar-eyes">
                <circle cx="43" cy="39" r="1.9" fill="#292524"/>
                <circle cx="57" cy="39" r="1.9" fill="#292524"/>
              </g>
              <circle cx="43" cy="39" r="6" stroke="#292524" stroke-width="2" fill="rgba(255,255,255,0.08)"/>
              <circle cx="57" cy="39" r="6" stroke="#292524" stroke-width="2" fill="rgba(255,255,255,0.08)"/>
              <line x1="49" y1="39" x2="51" y2="39" stroke="#292524" stroke-width="2"/>
              <path d="M40 50 Q50 46 60 50 Q50 54 40 50" fill="#a8a29e"/>
              <ellipse id="avatarMouth" cx="50" cy="56" rx="4.4" ry="2.1" fill="#78350f" style="transform-origin: 50px 56px;"/>
            </g>
          </svg>
        `,
    initialGreeting: 'Mahlzeit! Ich bräuchte mal wieder ein richtig ordentliches Brot für zu Hause. Was können Sie mir heute empfehlen?',
    variants: [
      {
        variantLabel: 'Enkel zu Besuch (Großer Laib)',
        hiddenNeeds: 'Verträgt keinerlei Bäckerhefe (reiner Natursauerteig nötig), will kräftigen Roggengeschmack mit langer Frischhaltung für die ganze Woche. Die Familie kommt am Wochenende, daher 1000g und UNBEDINGT am Stück.',
        desiredPortions: ['1000g'],
        desiredCut: false,
        idealBreadId: 'reines_roggen',
        alternativeBreadId: 'kuerbiskern_vollkorn',
        trapBreadIds: ['krusten_mischbrot', 'buttermilch_kruste', 'baguette_tradition'],
        scienceEvaluation: 'Herr Bergmann verträgt keine Bäckerhefe und benötigt das Reine Roggenbrot (1000g, Am Stück). Im 3-stufigen Natursauerteig inaktiviert die Milchsäure Amylasen und sorgt durch Roggen-Pentosane für 8–10 Tage saftige Frische; am Stück bleibt die Verdunstung minimal.',
        variantOffline: {
          menge: 'Meine Kinder kommen am Wochenende vorbei – nehmen wir einen ganzen Laib mit tausend Gramm.',
          anlass: 'Fürs Abendbrot und wenn am Wochenende die Familie zu Besuch ist – es muss die ganze Woche frisch bleiben.'
        }
      },
      {
        variantLabel: 'Allein zu Hause (Halber Laib)',
        hiddenNeeds: 'Verträgt keinerlei Bäckerhefe (nur 100 % Natursauerteig ohne Hefe), kräftiger Geschmack, lange Frischhaltung. Seine Frau ist diese Woche verreist, daher reicht ihm 500g, aber UNBEDINGT am Stück.',
        desiredPortions: ['500g'],
        desiredCut: false,
        idealBreadId: 'reines_roggen',
        alternativeBreadId: 'kuerbiskern_vollkorn',
        trapBreadIds: ['krusten_mischbrot', 'buttermilch_kruste', 'baguette_tradition'],
        scienceEvaluation: 'Diesmal ist Herr Bergmann allein zu Hause und braucht daher das Reine Roggenbrot in 500g, Am Stück. Ohne Bäckerhefe bleibt die Krume bekömmlich und dank Sauerteigsäuerung über eine Woche saftig – im Ganzen trocknet der halbe Laib nicht aus.',
        variantOffline: {
          menge: 'Meine Frau ist verreist, da bin ich allein – ein halbes Brot mit fünfhundert Gramm reicht mir völlig.',
          anlass: 'Für meine zwei Abendstullen allein – Hauptsache es bleibt bis Freitag saftig.'
        }
      }
    ],
    quickQuestionsPractice: [
      { text: 'Wie vertragen Sie Bäckerhefe?', response: 'Gar nicht gut! Sobald normale Backhefe drin ist, liegt es mir schwer im Magen. Nur reiner Sauerteig bekommt mir.' },
      { text: 'Für wie viele Personen ist das Brot?', response: null },
      { text: 'Soll ich es Ihnen aufschneiden?', response: 'Um Himmels willen, nein! Geschnitten wird mir das zu schnell trocken. Unbedingt im Ganzen.' }
    ],
    offlineResponses: {
      hefe: 'Bloß keine Bäckerhefe! Die vertrag ich gar nicht – es muss ein reines Natursauerteig-Brot sein.',
      geschmack: 'Gerne richtig kräftig und herzhaft nach Roggen, kein blasses Weißbrot.',
      haltbar: 'Es sollte mindestens eine Woche lang schön saftig bleiben.',
      schneiden: 'Bitte auf keinen Fall schneiden! Am Stück hält es sich viel besser frisch.',
      allergie: 'Nur bei Backhefe muss ich passen, sonst hab ich keine Allergien.',
      default: 'Na ja, es sollte halt ein kräftiges Brot sein, das lange frisch bleibt und mir gut im Magen liegt.'
    }
  },
  {
    id: 'sarah',
    name: 'Sarah (27)',
    tag: 'Sportlerin',
    archetype: 'classic',
    counterObservation: 'Trägt Sportkleidung und studiert aufmerksam die Nährwert-Kärtchen.',
    avatarImg: 'assets/avatars/sarah.jpg',
    avatarSvg: `
          <svg class="avatar-stage-svg w-full h-full" viewBox="0 0 100 100" fill="none" aria-hidden="true">
            <g class="avatar-torso">
              <path d="M20 100 C20 70, 36 63, 50 63 C64 63, 80 70, 80 100 Z" fill="#c2410c"/>
              <path d="M42 63 Q50 71 58 63" stroke="#fed7aa" stroke-width="1.8" fill="none"/>
            </g>
            <g class="avatar-head">
              <circle cx="71" cy="30" r="7.5" fill="#92400e"/>
              <circle cx="50" cy="40" r="21" fill="#e0a98b"/>
              <path d="M29 38 C29 20, 71 20, 71 38 C71 42, 65 52, 65 52 C65 38, 35 38, 29 38 Z" fill="#78350f"/>
              <path d="M32 31 Q50 27 68 31" stroke="#ea580c" stroke-width="4" stroke-linecap="round"/>
              <g class="avatar-eyes">
                <circle cx="43" cy="39" r="2.2" fill="#292524"/>
                <circle cx="57" cy="39" r="2.2" fill="#292524"/>
              </g>
              <ellipse id="avatarMouth" cx="50" cy="51" rx="4.4" ry="2.1" fill="#9a3412" style="transform-origin: 50px 51px;"/>
            </g>
          </svg>
        `,
    initialGreeting: 'Hi! Ich komme gerade direkt vom Training und suche ein passendes Brot für meinen Ernährungsplan. Was könnt ihr mir empfehlen?',
    variants: [
      {
        variantLabel: 'Krafttraining & Low-Carb-Fokus',
        hiddenNeeds: 'Macht Kraftsport und sucht maximal viel pflanzliches Eiweiß (>20%) bei sehr wenig Kohlenhydraten (<10%), liebt Chia und Leinsamen. Lebt allein: 500g, direkt geschnitten zum Abwiegen der Scheiben.',
        desiredPortions: ['500g'],
        desiredCut: true,
        idealBreadId: 'kraftkorn_protein',
        alternativeBreadId: 'hafer_vital',
        trapBreadIds: ['baguette_tradition', 'buttermilch_kruste'],
        scienceEvaluation: 'Nach dem Krafttraining in der Low-Carb-Phase ist das Kraftkorn-Proteinbrot (500g, Geschnitten) ideal: >22 % pflanzliches Protein, <8 % Kohlenhydrate und Omega-3-Fettsäuren aus Chia und Leinsamen. Geschnittene Scheiben erleichtern das exakte Abwiegen.',
        variantOffline: {
          anlass: 'Ich mach grad Kraftsport und achte streng auf wenig Kohlenhydrate, dafür richtig viel Eiweiß und Saaten.',
          allergie: 'Keine Allergien – im Gegenteil, je mehr Chia, Leinsamen und Kerne, desto besser!',
          geschmack: 'Schön körnig mit vielen Saaten und richtig hohem Eiweißanteil.'
        }
      },
      {
        variantLabel: 'Halbmarathon-Vorbereitung (Komplexe Energie)',
        hiddenNeeds: 'Trainiert für einen Halbmarathon (Ausdauer!) und braucht diesmal KEIN Low-Carb, sondern komplexe Hafer-Ballaststoffe (Beta-Glucan) für langanhaltende Energie – aber ohne harte Kerne, weil die vor dem Lauf schwer im Magen liegen. 500g, geschnitten.',
        desiredPortions: ['500g'],
        desiredCut: true,
        idealBreadId: 'hafer_vital',
        alternativeBreadId: 'paderborner_landbrot',
        trapBreadIds: ['kraftkorn_protein', 'kuerbiskern_vollkorn'],
        scienceEvaluation: 'Für die Ausdauervorbereitung (Halbmarathon) braucht Sarah komplexe Kohlenhydrate und Beta-Glucane statt Low-Carb: Das Hafer-Vitalbrot (500g, Geschnitten) liefert gleichmäßige Energie ohne harte Kerne, die vor dem Laufen im Magen drücken würden.',
        variantOffline: {
          anlass: 'Ich bereite mich auf einen Halbmarathon vor – also kein Low-Carb, sondern gute komplexe Hafer-Kohlenhydrate ohne harte Kerne.',
          allergie: 'Harte Körner wie Kürbiskerne liegen mir vor dem Laufen schwer im Magen.',
          geschmack: 'Saftig, mild-vollwertig mit Hafer, aber bitte ohne harte Kerne.'
        }
      }
    ],
    quickQuestionsPractice: [
      { text: 'Trainierst du eher Kraft/Low-Carb oder Ausdauer?', response: null },
      { text: 'Welche Menge passt für dich?', response: 'Ein halbes Brot mit fünfhundert Gramm reicht mir perfekt.' },
      { text: 'Soll ich es direkt schneiden?', response: 'Ja bitte, direkt geschnitten! Dann kann ich morgens direkt zugreifen.' }
    ],
    offlineResponses: {
      menge: 'Fünfhundert Gramm reichen mir, sonst wird es allein zu viel.',
      schneiden: 'Sehr gerne direkt geschnitten, das spart morgens Zeit.',
      eiweiss: null,
      default: 'Mir kommt es total auf meine Trainingsziele an – frag mich gern, wie ich gerade trainiere!'
    }
  },
  {
    id: 'demir',
    name: 'Frau Demir (42)',
    tag: 'Empfindlicher Magen',
    archetype: 'classic',
    counterObservation: 'Wirkt etwas zurückhaltend und liest sorgfältig die Zutatenkarten.',
    avatarImg: 'assets/avatars/demir.jpg',
    avatarSvg: `
          <svg class="avatar-stage-svg w-full h-full" viewBox="0 0 100 100" fill="none" aria-hidden="true">
            <g class="avatar-torso">
              <path d="M20 100 C22 72, 34 62, 50 62 C66 62, 78 72, 80 100 Z" fill="#065f46"/>
            </g>
            <g class="avatar-head">
              <path d="M27 42 C27 16, 73 16, 73 42 C73 64, 76 80, 76 80 L24 80 C24 80, 27 64, 27 42 Z" fill="#047857"/>
              <circle cx="50" cy="41" r="19" fill="#c6906f"/>
              <path d="M32 33 Q50 28 68 33" stroke="#fbbf24" stroke-width="2" fill="none"/>
              <g class="avatar-eyes">
                <circle cx="43" cy="40" r="2.1" fill="#292524"/>
                <circle cx="57" cy="40" r="2.1" fill="#292524"/>
              </g>
              <ellipse id="avatarMouth" cx="50" cy="51" rx="4.4" ry="2.1" fill="#78350f" style="transform-origin: 50px 51px;"/>
            </g>
          </svg>
        `,
    initialGreeting: 'Guten Tag! Sagen Sie mal, ich bekomme nach normalem Brot leider oft Bauchdrücken und Blähungen. Welches Brot wäre denn besonders bekömmlich?',
    variants: [
      {
        variantLabel: 'Weizensensitiv (Familienportion 500g/1000g)',
        hiddenNeeds: 'Verträgt überhaupt keinen Weizen (FODMAP-Empfindlichkeit/Blähungen), möchte reinen Ur-Dinkel aus langer Teigführung, geschnitten (500g oder 1000g).',
        desiredPortions: ['500g', '1000g'],
        desiredCut: true,
        idealBreadId: 'ur_dinkel_kruste',
        alternativeBreadId: 'reines_roggen',
        trapBreadIds: ['krusten_mischbrot', 'buttermilch_kruste', 'baguette_tradition'],
        scienceEvaluation: 'Bei Nicht-Zöliakie-Weizensensitivität bauen teigeigene Enzyme während der 24-stündigen kalten Langzeitführung der Ur-Dinkel-Kruste (100 % Oberkulmer Rotkorn ohne Weizen) blähende FODMAPs um bis zu 90 % ab.',
        variantOffline: {
          allergie: 'Bitte auf keinen Fall Weizen – auch kein Mischbrot mit Weizenanteil!',
          menge: 'Fünfhundert Gramm wären ideal, tausend Gramm gehen für die Familie aber auch.'
        }
      },
      {
        variantLabel: 'Weizen- & Laktoseempfindlich (500g)',
        hiddenNeeds: 'Verträgt weder Weizen noch Milchprodukte/Laktose (darf also auf keinen Fall Buttermilch-Kruste bekommen!), sucht mildes weizenfreies Brot aus langer Teigführung, 500g, geschnitten.',
        desiredPortions: ['500g'],
        desiredCut: true,
        idealBreadId: 'ur_dinkel_kruste',
        alternativeBreadId: 'reines_roggen',
        trapBreadIds: ['buttermilch_kruste', 'krusten_mischbrot', 'paderborner_landbrot'],
        scienceEvaluation: 'Frau Demir verträgt weder Weizen noch Laktose: Die Buttermilch-Kruste wäre hier ein klarer Beratungsfehler. Die Ur-Dinkel-Kruste (500g, Geschnitten) ist laktose- und weizenfrei sowie durch 24h Teigruhe maximal bekömmlich.',
        variantOffline: {
          allergie: 'Ich vertrage weder Weizen noch Milchprodukte wie Buttermilch – bitte nur reinen Dinkel ohne Zusatz!',
          menge: 'Ein halbes Brot mit fünfhundert Gramm ist diesmal genau richtig für mich.'
        }
      }
    ],
    quickQuestionsPractice: [
      { text: 'Welche Zutaten lösen bei Ihnen Beschwerden aus?', response: null },
      { text: 'Welche Menge darf es sein?', response: null },
      { text: 'Soll ich es Ihnen direkt schneiden?', response: 'Ja, sehr gerne geschnitten, das ist im Alltag viel praktischer.' }
    ],
    offlineResponses: {
      weizen: 'Weizen vertrag ich leider gar nicht – davon bekomme ich sofort Blähungen.',
      dinkel: 'Reiner, unverkreuzter Dinkel mit langer Teigruhe tut meinem Magen richtig gut.',
      geschmack: 'Am liebsten mild-nussig und nicht zu schwer säuerlich.',
      schneiden: 'Bitte geschnitten, dann kann ich mir einzelne Scheiben abnehmen.',
      default: 'Wichtig ist mir vor allem, was genau im Teig steckt und wie lange er gereift ist.'
    }
  },
  {
    id: 'tim',
    name: 'Tim (22)',
    tag: 'Student • Abendrunde',
    archetype: 'classic',
    counterObservation: 'Schaut gut gelaunt aufs Handy und vergleicht eine Einkaufsliste.',
    avatarImg: 'assets/avatars/tim.jpg',
    avatarSvg: `
          <svg class="avatar-stage-svg w-full h-full" viewBox="0 0 100 100" fill="none" aria-hidden="true">
            <g class="avatar-torso">
              <path d="M19 100 C19 70, 36 63, 50 63 C64 63, 81 70, 81 100 Z" fill="#1e3a8a"/>
              <path d="M43 63 L50 72 L57 63" stroke="#93c5fd" stroke-width="1.6" fill="none"/>
            </g>
            <g class="avatar-head">
              <circle cx="50" cy="40" r="21" fill="#f5d0b5"/>
              <path d="M30 35 C30 18, 70 18, 70 35 C75 25, 60 15, 45 18 C35 20, 25 28, 30 35 Z" fill="#451a03"/>
              <g class="avatar-eyes">
                <circle cx="43" cy="40" r="2.1" fill="#292524"/>
                <circle cx="57" cy="40" r="2.1" fill="#292524"/>
              </g>
              <ellipse id="avatarMouth" cx="50" cy="52" rx="4.4" ry="2.1" fill="#78350f" style="transform-origin: 50px 52px;"/>
            </g>
          </svg>
        `,
    initialGreeting: 'Hey, moin! Wir treffen uns heute Abend mit ein paar Leuten und ich soll noch gutes Brot besorgen. Was passt denn da?',
    variants: [
      {
        variantLabel: 'Klassischer Grillabend mit Dips',
        hiddenNeeds: 'Grillabend mit Kräuterbutter & Soßen: braucht splitternde, knusprige Kruste mit großen Luftlöchern zum Abreißen. Auf keinen Fall schneiden! 250g oder 500g.',
        desiredPortions: ['250g', '500g'],
        desiredCut: false,
        idealBreadId: 'baguette_tradition',
        alternativeBreadId: 'ciabatta_olive',
        trapBreadIds: ['paderborner_landbrot', 'reines_roggen'],
        scienceEvaluation: 'Für den Grillabend passt das Baguette de Tradition (250g/500g, Am Stück). Hohe Teigausbeute (TA ~170) und Poolish-Vorteig erzeugen große Poren für Dips sowie eine rösche Kruste zum Abreißen.',
        variantOffline: {
          anlass: 'Wir grillen im Park mit Kräuterbutter und Soßen – es muss richtig krachen beim Abreißen!',
          geschmack: 'Klassisch französisch-knusprig, ohne Oliven oder Kräuter drin.',
          menge: 'So eine zweihundertfünfzig-Gramm-Stange oder fünfhundert Gramm passen super.'
        }
      },
      {
        variantLabel: 'Mediterraner Tapas- & Weinabend',
        hiddenNeeds: 'Machen heute Abend italienische Antipasti mit Olivenöl, Pesto und Wein – wünscht sich ausdrücklich was Mediterranes mit Oliven/Kräutern zum Eintunken, 500g (oder 250g), ungeschnitten zum Abreißen.',
        desiredPortions: ['500g', '250g'],
        desiredCut: false,
        idealBreadId: 'ciabatta_olive',
        alternativeBreadId: 'baguette_tradition',
        trapBreadIds: ['reines_roggen', 'paderborner_landbrot', 'kraftkorn_protein'],
        scienceEvaluation: 'Zum Antipasti- und Weinabend trifft das Ciabatta Olive & Rosmarin (500g, Am Stück) genau den Wunsch: Durch Biga-Vorteig und hohe Hydration entstehen saftige, großporige Scheiben/Stücke voller mediterraner Aromen.',
        variantOffline: {
          anlass: 'Wir machen Antipasti, Olivenöl und Wein – also gerne was schön Mediterranes mit Kräutern oder Oliven!',
          geschmack: 'Mediterran mit Oliven und Rosmarin, schön saftig-locker zum Eintunken.',
          menge: 'Fünfhundert Gramm wären für uns alle ideal, zweihundertfünfzig gehen zur Not auch.'
        }
      }
    ],
    quickQuestionsPractice: [
      { text: 'Was gibt es heute Abend denn dazu zu essen?', response: null },
      { text: 'Soll ich es schon vorschneiden?', response: 'Nee, bloß nicht schneiden! Am Stück zum Abreißen schmeckt es viel geiler.' },
      { text: 'Wie viele Leute seid ihr ungefähr?', response: null }
    ],
    offlineResponses: {
      schneiden: 'Auf keinen Fall schneiden! Ungeschnitten zum Abreißen bleibt es außen schön kross.',
      allergie: 'Alle essen alles, keine Allergien bei uns.',
      default: 'Es ist für heute Abend mit Freunden – frag mich gern, was es genau zu essen gibt!'
    }
  },
  {
    id: 'lukas',
    name: 'Lukas (31)',
    tag: 'Unentschlossen • Abendgäste',
    archetype: 'undecided',
    counterObservation: 'Steht unschlüssig vor dem Brotregal, wiegt den Kopf hin und her und wirkt ratlos.',
    avatarImg: 'assets/avatars/lukas.jpg',
    avatarSvg: `
          <svg class="avatar-stage-svg w-full h-full" viewBox="0 0 100 100" fill="none" aria-hidden="true">
            <g class="avatar-torso">
              <path d="M18 100 C18 71, 35 63, 50 63 C65 63, 82 71, 82 100 Z" fill="#0f766e"/>
              <path d="M44 63 Q50 70 56 63" stroke="#99f6e4" stroke-width="1.5" fill="none"/>
            </g>
            <g class="avatar-head">
              <circle cx="50" cy="40" r="21" fill="#e8be9e"/>
              <path d="M29 36 C30 19, 70 19, 71 36 C68 27, 56 24, 48 26 C38 28, 32 30, 29 36 Z" fill="#573822"/>
              <path d="M38 33 Q43 30 47 33" stroke="#292524" stroke-width="2" stroke-linecap="round"/>
              <path d="M53 31 Q58 34 62 32" stroke="#292524" stroke-width="2" stroke-linecap="round"/>
              <g class="avatar-eyes">
                <circle cx="43" cy="40" r="2.2" fill="#292524"/>
                <circle cx="57" cy="40" r="2.2" fill="#292524"/>
              </g>
              <path d="M45 52 Q50 50 55 53" stroke="#78350f" stroke-width="2" stroke-linecap="round"/>
              <ellipse id="avatarMouth" cx="50" cy="53" rx="3.8" ry="1.8" fill="#78350f" style="transform-origin: 50px 53px;"/>
            </g>
          </svg>
        `,
    initialGreeting: 'Ähm, hallo… ich weiß ehrlich gesagt gar nicht so genau, was ich nehmen soll. Irgendwas Besonderes für heute Abend halt. Können Sie mir da weiterhelfen?',
    variants: [
      {
        variantLabel: 'Käseplatte & Rotwein (Keine Allergien)',
        hiddenNeeds: 'Hat spontan 3 Freunde zu Käseplatte und Rotwein eingeladen, weiß aber selbst noch nicht, was passt. Erst durch gezielte Rückfragen nennt er Käse & Wein (keine Allergien) -> Walnuss-Landbrot passt perfekt dazu! 500g, Am Stück (zum gemeinsamen Aufschneiden am Tisch).',
        desiredPortions: ['500g'],
        desiredCut: false,
        idealBreadId: 'walnuss_landbrot',
        alternativeBreadId: 'baguette_tradition',
        trapBreadIds: ['kraftkorn_protein', 'buttermilch_kruste'],
        scienceEvaluation: 'Lukas wusste anfangs selbst nicht, wonach er sucht – erst durch aktives Nachfragen nach Anlass (Käse & Rotwein) und Allergien lässt sich das Walnuss-Landbrot (500g, Am Stück) empfehlen: Geröstete Walnüsse und Dinkel-Emmer-Aroma harmonieren ideal mit reifem Käse.',
        variantOffline: {
          anlass: 'Ach ja, stimmt: Ich hab spontan drei Freunde zu einer Käseplatte mit Rotwein eingeladen.',
          allergie: 'Nee, Allergien hat zum Glück niemand – Nüsse oder sowas fänden alle sogar richtig spannend!',
          geschmack: 'Darf gern was Fein-Aromatisches sein, das zu kräftigem Käse passt.'
        }
      },
      {
        variantLabel: 'Dinner mit Gast (Nussallergie!)',
        hiddenNeeds: 'Lädt Gäste zu italienischer Vorspeise & Wein ein. Weiß nicht welches Brot passt, aber bei Nachfrage nach Allergien fällt ihm ein: Eine Freundin hat eine SCHWERE NUSSALLERGIE! Daher darf er keinesfalls Walnussbrot bekommen -> Ciabatta Olive & Rosmarin, 500g, Am Stück.',
        desiredPortions: ['500g'],
        desiredCut: false,
        idealBreadId: 'ciabatta_olive',
        alternativeBreadId: 'baguette_tradition',
        trapBreadIds: ['walnuss_landbrot', 'kraftkorn_protein'],
        scienceEvaluation: 'Achtung Allergie-Falle! Wer bei einem unentschlossenen Abendessen-Gast pauschal zum Walnuss-Landbrot rät, ohne nach Allergien zu fragen, riskiert eine schwere Reaktion. Das Ciabatta Olive & Rosmarin (500g, Am Stück) ist garantiert nussfrei und passt perfekt zum Abendessen.',
        variantOffline: {
          anlass: 'Wir machen ein gemütliches Abendessen mit Antipasti, Öl und Wein zu viert.',
          allergie: 'Oh, gut dass Sie fragen! Eine Freundin hat eine starke Nussallergie – bitte bloß nichts mit Nüssen!',
          geschmack: 'Eher mediterran-locker ohne Nüsse oder harte Kerne.'
        }
      }
    ],
    quickQuestionsPractice: [
      { text: 'Was steht denn heute Abend bei Ihnen auf dem Tisch?', response: null },
      { text: 'Hat jemand von Ihren Gästen Allergien oder Unverträglichkeiten?', response: null },
      { text: 'Für wie viele Personen ist es und soll ich schneiden?', response: 'Wir sind zu viert, also so fünfhundert Gramm. Am Stück sieht auf dem Holzbrett schöner aus!' }
    ],
    offlineResponses: {
      menge: 'Wir sind zu viert für einen Abend – fünfhundert Gramm müssten gut passen.',
      schneiden: 'Lieber am Stück, dann sieht es auf dem Brett beim Essen schöner aus.',
      default: 'Hm, ehrlich gesagt hab ich gar keinen Plan… fragen Sie mich ruhig aus, was wir heute Abend vorhaben!'
    }
  },
  {
    id: 'hannelore',
    name: 'Oma Hannelore (76)',
    tag: 'Überfordert • Empfindliche Zähne',
    archetype: 'undecided',
    counterObservation: 'Kneift leicht die Augen zusammen, um die Schilder zu lesen, und lächelt zaghaft.',
    avatarImg: 'assets/avatars/hannelore.jpg',
    avatarSvg: `
          <svg class="avatar-stage-svg w-full h-full" viewBox="0 0 100 100" fill="none" aria-hidden="true">
            <g class="avatar-torso">
              <path d="M20 100 C20 71, 36 63, 50 63 C64 63, 80 71, 80 100 Z" fill="#6b21a8"/>
              <path d="M41 64 Q50 71 59 64" stroke="#e9d5ff" stroke-width="2" fill="none"/>
            </g>
            <g class="avatar-head">
              <circle cx="50" cy="21" r="10" fill="#d6d3d1"/>
              <circle cx="50" cy="42" r="21" fill="#f2d2bd"/>
              <path d="M29 40 C29 22, 71 22, 71 40 C62 32, 38 32, 29 40 Z" fill="#e7e5e4"/>
              <g class="avatar-eyes">
                <circle cx="43" cy="41" r="1.8" fill="#292524"/>
                <circle cx="57" cy="41" r="1.8" fill="#292524"/>
              </g>
              <circle cx="43" cy="41" r="5.5" stroke="#57534e" stroke-width="1.6" fill="rgba(255,255,255,0.08)"/>
              <circle cx="57" cy="41" r="5.5" stroke="#57534e" stroke-width="1.6" fill="rgba(255,255,255,0.08)"/>
              <line x1="48.5" y1="41" x2="51.5" y2="41" stroke="#57534e" stroke-width="1.6"/>
              <ellipse id="avatarMouth" cx="50" cy="53" rx="4" ry="1.8" fill="#9a3412" style="transform-origin: 50px 53px;"/>
            </g>
          </svg>
        `,
    initialGreeting: 'Ach, guten Tag… ich weiß heute gar nicht recht, was ich nehmen soll. Die vielen Schilder verwirren mich – welches war denn nochmal das schön weiche?',
    variants: [
      {
        variantLabel: 'Süßes Frühstück (Buttermilch-Kruste)',
        hiddenNeeds: 'Vergisst oft den Namen ihres Lieblingsbrots. Hat empfindliche Zähne (keine harten Körner, keine harte Kruste!), isst morgens gern Erdbeermarmelade oder Honig auf weichen Scheiben, lebt allein (250g oder 500g), unbedingt geschnitten.',
        desiredPortions: ['250g', '500g'],
        desiredCut: true,
        idealBreadId: 'buttermilch_kruste',
        alternativeBreadId: 'paderborner_landbrot',
        trapBreadIds: ['kuerbiskern_vollkorn', 'baguette_tradition', 'kraftkorn_protein', 'walnuss_landbrot'],
        scienceEvaluation: 'Oma Hannelore braucht eine geduldige, einfühlsame Führung ohne Fachjargon: Die Buttermilch-Kruste (250g/500g, Geschnitten) bietet durch Milchfett und -zucker eine samtig-weiche Krume sowie hauchdünne Rinde – perfekt für empfindliche Zähne und süßen Belag.',
        variantOffline: {
          anlass: 'Ich esse morgens immer so gern eine Scheibe mit Erdbeermarmelade oder Honig zum Kaffee.',
          geschmack: 'Ganz zart und mild soll es sein – meine Zähne mögen keine harten Kerne oder krosse Krusten mehr.',
          allergie: 'Ich vertrag alles, nur auf harte Kerne oder Nüsse kann ich mit meinen Zähnen nicht beißen.'
        }
      },
      {
        variantLabel: 'Mildes Abendbrot ohne Kerne (Paderborner)',
        hiddenNeeds: 'Unsicher vor der Theke, empfindliche Zähne (bloß keine Körner oder harte Kruste!), isst abends gern Leberwurst und milden Käse, verträgt zurzeit keine Buttermilch/Milch gut -> Paderborner Landbrot im Kasten, 500g (oder 250g), geschnitten.',
        desiredPortions: ['500g', '250g'],
        desiredCut: true,
        idealBreadId: 'paderborner_landbrot',
        alternativeBreadId: 'hafer_vital',
        trapBreadIds: ['kuerbiskern_vollkorn', 'buttermilch_kruste', 'baguette_tradition'],
        scienceEvaluation: 'Da Frau Hannelore herzhaftes Abendbrot ohne harte Kerne isst und Milchprodukte aktuell meidet, ist das Paderborner Landbrot (500g, Geschnitten) als mildes Kastenbrot mit weicher Kruste die ideale, zahnschonende Wahl.',
        variantOffline: {
          anlass: 'Ich esse abends meist herzhaft mit mildem Käse oder Streichwurst – schön weich für die Zähne.',
          allergie: 'Milch und Buttermilch vertrag ich im Alter leider nicht mehr so gut, und keine harten Kerne bitte.',
          geschmack: 'Ein mildes, saftiges Kastenbrot ohne harte Kruste und ohne Körner.'
        }
      }
    ],
    quickQuestionsPractice: [
      { text: 'Wie mögen Sie denn Kruste und Krume – lieber schön weich?', response: null },
      { text: 'Was essen Sie am liebsten auf dem Brot?', response: null },
      { text: 'Soll ich eine kleine Portion direkt schneiden?', response: 'Ach, das wäre so lieb von Ihnen! Zweihundertfünfzig oder fünfhundert Gramm, schön dünn geschnitten.' }
    ],
    offlineResponses: {
      menge: 'Ach, ich bin allein – zweihundertfünfzig oder fünfhundert Gramm reichen mir völlig.',
      schneiden: 'Ja bitte unbedingt schneiden, meine Hände haben nicht mehr so viel Kraft.',
      kruste: 'Bloß keine harte Kruste und keine Körner – meine Zähne machen da nicht mehr mit.',
      default: 'Ach wissen Sie, ich bin da heute ganz unschlüssig… fragen Sie mich gern, was mir schmeckt und bekommt.'
    }
  },
  {
    id: 'maja',
    name: 'Maja (21)',
    tag: 'Verwirrt • WG-Einkauf',
    archetype: 'undecided',
    counterObservation: 'Hält einen zerknitterten Einkaufszettel in der Hand und seufzt leicht überfordert.',
    avatarImg: 'assets/avatars/maja.jpg',
    avatarSvg: `
          <svg class="avatar-stage-svg w-full h-full" viewBox="0 0 100 100" fill="none" aria-hidden="true">
            <g class="avatar-torso">
              <path d="M19 100 C19 71, 36 63, 50 63 C64 63, 81 71, 81 100 Z" fill="#be185d"/>
            </g>
            <g class="avatar-head">
              <path d="M26 42 C26 18, 74 18, 74 42 L77 68 L23 68 Z" fill="#3b0764"/>
              <circle cx="50" cy="41" r="19.5" fill="#f1c5a8"/>
              <path d="M31 36 C36 25, 64 25, 69 36 C60 30, 40 30, 31 36 Z" fill="#3b0764"/>
              <g class="avatar-eyes">
                <circle cx="43" cy="40" r="2.1" fill="#292524"/>
                <circle cx="57" cy="40" r="2.1" fill="#292524"/>
              </g>
              <path d="M38 35 L46 37" stroke="#292524" stroke-width="1.6"/>
              <path d="M62 35 L54 37" stroke="#292524" stroke-width="1.6"/>
              <ellipse id="avatarMouth" cx="50" cy="52" rx="4" ry="1.8" fill="#9a3412" style="transform-origin: 50px 52px;"/>
            </g>
          </svg>
        `,
    initialGreeting: 'Hey, ähm… ich soll für unsere WG Brot holen, aber im Chat schreibt irgendwie jeder was anderes. Ich hab null Plan – was nimmt man denn da?',
    variants: [
      {
        variantLabel: '4er-WG (Keine Nüsse, keine Laktose, keine Kerne)',
        hiddenNeeds: 'Kauft für 4 Leute ein (braucht 1000g, geschnitten für schnelles Frühstück). Auf dem Zettel stehen Ausschlüsse: Ein Mitbewohner hat Nussallergie, eine ist laktoseintolerant, ein anderer hasst harte Körner, soll aber 5 Tage saftig bleiben -> Paderborner Landbrot (Ideal) oder Krusten-Mischbrot.',
        desiredPortions: ['1000g'],
        desiredCut: true,
        idealBreadId: 'paderborner_landbrot',
        alternativeBreadId: 'krusten_mischbrot',
        trapBreadIds: ['walnuss_landbrot', 'buttermilch_kruste', 'kuerbiskern_vollkorn'],
        scienceEvaluation: 'Bei widersprüchlichen WG-Wünschen gilt das Ausschlussprinzip: Keine Nüsse (kein Walnussbrot), keine Milch (keine Buttermilch-Kruste), keine harten Kerne, 5–6 Tage Frischhaltung in 1000g, Geschnitten – genau dafür ist das Paderborner Landbrot optimal.',
        variantOffline: {
          allergie: 'Oh warte, ich les ab: Keine Nüsse wegen Lukas, keine Milch/Laktose wegen Mia, und bitte keine harten Körner!',
          anlass: 'Wir sind eine Vierer-WG – es soll für alle morgens schnell zum Toasten und Belegen taugen und bis Freitag halten.'
        }
      },
      {
        variantLabel: 'Sportliche WG (Hafer, laktose- & nussfrei)',
        hiddenNeeds: 'WG will etwas Vollwertig-Saftiges ohne harte Kerne, ohne Walnüsse und ohne Laktose, schön saftig für 5 Tage, 1000g, geschnitten -> Hafer-Vitalbrot (Ideal) oder Paderborner Landbrot.',
        desiredPortions: ['1000g'],
        desiredCut: true,
        idealBreadId: 'hafer_vital',
        alternativeBreadId: 'paderborner_landbrot',
        trapBreadIds: ['walnuss_landbrot', 'buttermilch_kruste', 'kuerbiskern_vollkorn'],
        scienceEvaluation: 'Für die aktive, laktose- und nussfreie WG ohne harte Kerne liefert das Hafer-Vitalbrot (1000g, Geschnitten) durch das Haferflocken-Brühstück 5 Tage Saftigkeit und viele Ballaststoffe für alle Geschmäcker.',
        variantOffline: {
          allergie: 'Keine Nüsse und keine Milchprodukte bitte – und meine Mitbewohner wollen was Vollwertig-Saftiges mit Hafer ohne harte Kerne!',
          anlass: 'Vierer-WG-Frühstück und Uni-Stullen – soll schön saftig und nahrhaft sein.'
        }
      },
      {
        variantLabel: 'WG-Brunch (Krosse Kruste für süß & herzhaft)',
        hiddenNeeds: 'WG-Brunch am Wochenende ohne Allergien: Alle wollen ein klassisches, herzhaft-lockeres Brot mit krosser Kruste, das sowohl zu Marmelade als auch zu Käse/Aufschnitt passt, 1000g, geschnitten -> Krusten-Mischbrot 70/30.',
        desiredPortions: ['1000g'],
        desiredCut: true,
        idealBreadId: 'krusten_mischbrot',
        alternativeBreadId: 'paderborner_landbrot',
        trapBreadIds: ['kraftkorn_protein', 'reines_roggen'],
        scienceEvaluation: 'Für den gemischten WG-Brunch mit süßen und herzhaften Belägen trifft das Krusten-Mischbrot 70/30 (1000g, Geschnitten) die Mitte: 70 % Weizen sorgen für lockere Krume (ideal für Marmelade/Honig), 30 % Roggen und Sauerteig geben herzhafte Tiefe und krossen Ausbund.',
        variantOffline: {
          allergie: 'Diesmal hat niemand Allergien – Hauptsache krosse Kruste, innen schön locker für Marmelade und Käse!',
          anlass: 'Großer WG-Brunch am Wochenende, wo manche süß mit Nutella und manche herzhaft essen.',
          geschmack: 'Ein klassisches Mischbrot mit schöner krosser Kruste und lockerer Krume.'
        }
      }
    ],
    quickQuestionsPractice: [
      { text: 'Was steht denn genau auf deinem WG-Zettel – gibt es Tabus?', response: null },
      { text: 'Wie viele Leute seid ihr in der WG?', response: 'Wir sind zu viert – also ein ganzer Laib mit tausend Gramm geht locker weg.' },
      { text: 'Soll ich das Brot direkt schneiden?', response: 'Ja, unbedingt geschnitten! Sonst säbelt bei uns morgens jeder schief dran rum.' }
    ],
    offlineResponses: {
      menge: 'Wir sind zu viert und essen viel Brot – tausend Gramm sollten es schon sein.',
      schneiden: 'Unbedingt geschnitten, sonst gibt es Chaos am Morgen.',
      geschmack: 'Möglichst massentauglich und saftig, ohne harte Körner.',
      default: 'Puh, hier auf dem Zettel steht alles durcheinander… frag mich am besten gezielt nach Allergien oder worauf alle stehen!'
    }
  },
  {
    id: 'krawczyk',
    name: 'Herr Dr. Krawczyk (54)',
    tag: 'Ungeduldig • Kritisch',
    archetype: 'difficult',
    counterObservation: 'Tippt ungeduldig mit dem Autoschlüssel auf die Theke und blickt demonstrativ auf die Uhr.',
    avatarImg: 'assets/avatars/krawczyk.jpg',
    avatarSvg: `
          <svg class="avatar-stage-svg w-full h-full" viewBox="0 0 100 100" fill="none" aria-hidden="true">
            <g class="avatar-torso">
              <path d="M16 100 C16 70, 33 63, 50 63 C67 63, 84 70, 84 100 Z" fill="#0f172a"/>
              <path d="M44 63 L50 78 L56 63 Z" fill="#e2e8f0"/>
              <path d="M50 67 L50 78" stroke="#991b1b" stroke-width="2.4"/>
            </g>
            <g class="avatar-head">
              <circle cx="50" cy="40" r="21" fill="#dfbaa0"/>
              <path d="M29 33 C32 20, 68 20, 71 33 C65 27, 35 27, 29 33 Z" fill="#334155"/>
              <path d="M36 33 L46 36" stroke="#1e293b" stroke-width="2.4" stroke-linecap="round"/>
              <path d="M64 33 L54 36" stroke="#1e293b" stroke-width="2.4" stroke-linecap="round"/>
              <g class="avatar-eyes">
                <circle cx="42.5" cy="40.5" r="1.8" fill="#0f172a"/>
                <circle cx="57.5" cy="40.5" r="1.8" fill="#0f172a"/>
              </g>
              <rect x="37" y="37" width="11" height="7" rx="1.5" stroke="#0f172a" stroke-width="1.8" fill="rgba(255,255,255,0.08)"/>
              <rect x="52" y="37" width="11" height="7" rx="1.5" stroke="#0f172a" stroke-width="1.8" fill="rgba(255,255,255,0.08)"/>
              <line x1="48" y1="40" x2="52" y2="40" stroke="#0f172a" stroke-width="1.8"/>
              <path d="M42 54 Q50 51 58 54" stroke="#78350f" stroke-width="2" stroke-linecap="round"/>
              <ellipse id="avatarMouth" cx="50" cy="54" rx="4.2" ry="1.8" fill="#78350f" style="transform-origin: 50px 54px;"/>
            </g>
          </svg>
        `,
    initialGreeting: 'Guten Tag. Machen Sie bitte zügig, ich stehe im Parkverbot. Und drehen Sie mir keinen aufgebackenen Supermarkt-Kram an – was taugt hier überhaupt?',
    variants: [
      {
        variantLabel: 'Purist (100% Natursauerteig ohne Hefe)',
        hiddenNeeds: 'Testet das Fachwissen und die Nerven des Azubis. Wenn man ruhig, höflich und souverän bleibt, gibt er zu: Er sucht ein echtes, handwerklich kompromissloses Brot ohne jede Hefe-Abkürzung, das mindestens eine Woche frisch bleibt. 500g, Am Stück ("Maschinenschnitt ruiniert die Kruste").',
        desiredPortions: ['500g'],
        desiredCut: false,
        idealBreadId: 'reines_roggen',
        alternativeBreadId: 'kuerbiskern_vollkorn',
        trapBreadIds: ['krusten_mischbrot', 'buttermilch_kruste', 'baguette_tradition'],
        scienceEvaluation: 'Bei schwierigen Kunden wie Dr. Krawczyk zählen Empathie für den Zeitdruck und fachliche Souveränität: Ein 3-stufig geführtes Reines Roggenbrot ohne Bäckerhefe (500g, Am Stück) beweist echtes Handwerk und hält über 8 Tage saftig.',
        variantOffline: {
          hefe: 'Immerhin fragen Sie nach: Keine Bäckerhefe, keine Abkürzungen – reiner dreistufiger Natursauerteig muss es sein.',
          geschmack: 'Kräftig, ehrlich, mindestens eine Woche saftig – kein weiches Mischbrot.',
          anlass: 'Ich hab keine Lust, alle zwei Tage zum Bäcker zu rennen – es muss Qualität mit langer Frischhaltung sein.'
        }
      },
      {
        variantLabel: 'Vollkorn-Kenner mit Kürbiskernen',
        hiddenNeeds: 'Wirkt erst schroff und ungeduldig; öffnet sich bei ruhiger Deeskalation. Will ein kräftiges Roggenvollkornbrot mit richtigem Biss und gerösteten Kürbiskernen, lange frisch, 500g, Am Stück.',
        desiredPortions: ['500g'],
        desiredCut: false,
        idealBreadId: 'kuerbiskern_vollkorn',
        alternativeBreadId: 'reines_roggen',
        trapBreadIds: ['buttermilch_kruste', 'baguette_tradition', 'krusten_mischbrot'],
        scienceEvaluation: 'Nach ruhiger Deeskalation offenbart Dr. Krawczyk seinen Wunsch nach charaktervollem Vollkorn-Handwerk: Das Kürbiskern-Vollkornbrot (500g, Am Stück) überzeugt durch das Kürbiskern-Brühstück mit intensiver Röstaromatik und 7–9 Tagen Frischhaltung.',
        variantOffline: {
          geschmack: 'Es darf ruhig was richtig Kräftiges und Herzhaftes sein – mit ordentlichem Biss und gern ein paar gerösteten Kernen.',
          anlass: 'Für abends zu kräftigem Schinken – muss lange frisch und herzhaft sein.',
          hefe: 'Sauerteig und echtes Vollkorn-Brühstück – Hauptsache kein fluffiges Weißmehl.'
        }
      }
    ],
    quickQuestionsPractice: [
      { text: 'Ich verstehe den Zeitdruck – mögen Sie es eher klassisch oder kernig?', response: null },
      { text: 'Welche Größe darf ich Ihnen einpacken?', response: 'Fünfhundert Gramm reichen, ich verschwende kein Brot.' },
      { text: 'Am Stück oder geschnitten?', response: 'Natürlich am Stück! Ihre Schneidemaschine macht doch bloß die Krume trocken.' }
    ],
    offlineResponses: {
      menge: 'Fünfhundert Gramm, ich bin nicht oft zu Hause.',
      schneiden: 'Auf keinen Fall geschnitten – echte Kruste bleibt am Stück!',
      empathie: 'Hm, na gut, Sie bleiben wenigstens ruhig. Hören Sie zu:',
      default: 'Reden Sie nicht um den heißen Brei – erklären Sie mir kurz und fachlich, welches Handwerksbrot hier wirklich Substanz hat!'
    }
  },
  {
    id: 'meissner',
    name: 'Frau Meißner (49)',
    tag: 'Skeptisch • Preiskritisch',
    archetype: 'difficult',
    counterObservation: 'Mustert die Preisschilder mit verschränkten Armen und hochgezogener Augenbraue.',
    avatarImg: 'assets/avatars/meissner.jpg',
    avatarSvg: `
          <svg class="avatar-stage-svg w-full h-full" viewBox="0 0 100 100" fill="none" aria-hidden="true">
            <g class="avatar-torso">
              <path d="M19 100 C19 71, 35 63, 50 63 C65 63, 81 71, 81 100 Z" fill="#3f3f46"/>
              <path d="M43 64 L50 72 L57 64" stroke="#d4d4d8" stroke-width="1.6" fill="none"/>
            </g>
            <g class="avatar-head">
              <circle cx="50" cy="40" r="21" fill="#ecc4aa"/>
              <path d="M26 39 C26 17, 74 17, 74 39 C70 28, 30 28, 26 39 Z" fill="#7c2d12"/>
              <path d="M36 33 L46 35" stroke="#292524" stroke-width="2" stroke-linecap="round"/>
              <path d="M64 33 L54 35" stroke="#292524" stroke-width="2" stroke-linecap="round"/>
              <g class="avatar-eyes">
                <circle cx="43" cy="39" r="2.1" fill="#292524"/>
                <circle cx="57" cy="39" r="2.1" fill="#292524"/>
              </g>
              <path d="M43 53 Q50 50 57 53" stroke="#78350f" stroke-width="2" stroke-linecap="round"/>
              <ellipse id="avatarMouth" cx="50" cy="53" rx="4" ry="1.7" fill="#9a3412" style="transform-origin: 50px 53px;"/>
            </g>
          </svg>
        `,
    initialGreeting: 'Na ja… fast sechs Euro für einen halben Laib? Sagen Sie mir mal ehrlich: Da steckt doch bestimmt auch bloß eine fertige Backmischung drin, oder?',
    variants: [
      {
        variantLabel: 'Qualitätsbeweis durch 24h Ur-Dinkel',
        hiddenNeeds: 'Anfangs kühl, misstrauisch und preiskritisch. Wenn der Azubi Verständnis zeigt ("Ich verstehe, dass Sie genau wissen wollen, wofür Sie zahlen") und echte Langzeitführung erklärt, verrät sie: Sie will reines Urgetreide ohne Weizen und ohne Zusatzstoffe, 500g, geschnitten.',
        desiredPortions: ['500g'],
        desiredCut: true,
        idealBreadId: 'ur_dinkel_kruste',
        alternativeBreadId: 'reines_roggen',
        trapBreadIds: ['krusten_mischbrot', 'buttermilch_kruste'],
        scienceEvaluation: 'Frau Meißner testet Wertschätzung und Transparenz: Wer ihre Preisskepsis ernst nimmt und die 24-stündige kalte Langzeitführung von 100 % Oberkulmer Rotkorn erklärt, beweist echten Handwerkswert statt Backmischung (Ur-Dinkel-Kruste, 500g, Geschnitten).',
        variantOffline: {
          preis: 'Okay, 24 Stunden kalte Führung ohne Weizen und Zusatzstoffe ist tatsächlich ein Argument…',
          weizen: 'Wenn ich schon so viel zahle, dann bitte reines Urgetreide ohne Weizen-Streckung!',
          schneiden: 'Bitte geschnitten – für fünfhundert Gramm zahle ich dann auch, wenn die Qualität stimmt.'
        }
      },
      {
        variantLabel: 'Besonderes Genießerbrot (Walnuss-Emmer)',
        hiddenNeeds: 'Erst abweisend wegen des Preises; taut auf, wenn man echte Rohstoffe (Emmer + geröstete Walnüsse) sympathisch erklärt. Will am Ende ein besonderes Genießerbrot für Besuch (500g, Am Stück).',
        desiredPortions: ['500g'],
        desiredCut: false,
        idealBreadId: 'walnuss_landbrot',
        alternativeBreadId: 'ur_dinkel_kruste',
        trapBreadIds: ['krusten_mischbrot', 'paderborner_landbrot'],
        scienceEvaluation: 'Durch empathisches Eingehen auf ihre Kritik und Transparenz über teure Rohstoffe (Urgetreide Emmer und echte geröstete Walnüsse) verwandelt sich Skepsis in Wertschätzung – Walnuss-Landbrot (500g, Am Stück).',
        variantOffline: {
          preis: 'Gut, echte geröstete Walnüsse und Urgetreide Emmer kosten natürlich ihr Geld, das seh ich ein.',
          anlass: 'Ich hab am Wochenende anspruchsvollen Besuch – da darf es dann auch was Besonderes mit Charakter sein.',
          schneiden: 'Dann lassen Sie es für den Besuch bitte am Stück.'
        }
      }
    ],
    quickQuestionsPractice: [
      { text: 'Ich verstehe Ihre Frage – darf ich kurz erklären, wie wir backen?', response: null },
      { text: 'Worauf legen Sie bei den Zutaten besonders Wert?', response: null },
      { text: 'Welche Größe und Schnittart passt für Sie?', response: null }
    ],
    offlineResponses: {
      menge: 'Fünfhundert Gramm reichen erst mal zum Probieren.',
      default: 'Überzeugen Sie mich ruhig mit echten Fakten statt Verkäufersprüchen – warum lohnt sich Ihr Brot?'
    }
  }
];


const DEPRECATED_CHAT_MODELS = new Set([
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
]);
const FALLBACK_CHAT_MODELS = [
  'gemini-3.8-flash-lite',
  'gemini-3.8-flash',
  'gemini-flash-latest'
];
const FALLBACK_TTS_MODELS = [
  'gemini-3.8-flash-tts',
  'gemini-3.8-flash-lite-tts',
  'gemini-3.1-flash-tts-preview',
  'gemini-2.5-flash-preview-tts'
];
const FALLBACK_LIVE_MODELS = [
  'gemini-3.8-live',
  'gemini-2.5-flash-native-audio-preview-12-2025',
  'gemini-2.5-flash-native-audio-preview-09-2025'
];
const DEFAULT_SILENCE_TIMEOUT_MS = 600;
