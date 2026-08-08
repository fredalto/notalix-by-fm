(function () {
  "use strict";
  window.LDNResultPanel.render(document.getElementById("result"), "instrument");
  const NOTE_NAMES = { C:"Do", D:"Ré", E:"Mi", F:"Fa", G:"Sol", A:"La", B:"Si" };
  const PITCHES = ["C","Csharp","D","Dsharp","E","F","Fsharp","G","Gsharp","A","Asharp","B"];
  const params = new URLSearchParams(location.search);
  const id = params.get("instrument") || "flute";
  const levelNumber = Math.max(1, Math.min(4, Number(params.get("niveau")) || 1));
  let timbre = params.get("timbre") === "piano" ? "piano" : "instrument";
  const instrument = window.LDN_INSTRUMENTS[id];
  if (!instrument) { location.href = "index.html"; return; }
  const level = instrument.levels[levelNumber - 1];
  const total = [10, 10, 12, 16][levelNumber - 1];
  let current = 0;
  let score = 0;
  let sequence = [];
  let isWaiting = false;
  let scoreSent = false;
  const feedbackDelay = 1500;
  const TRANSPOSITIONS = {
    clarinette:"Une seconde majeure plus bas (un ton) · Do écrit → Si♭ entendu",
    trompette:"Une seconde majeure plus bas (un ton) · Do écrit → Si♭ entendu",
    saxophone:"Une sixte majeure plus bas · Do écrit → Mi♭ entendu",
    cor:"Une quinte juste plus bas · Do écrit → Fa entendu",
    guitare:"Une octave plus bas · Do écrit → Do entendu à l’octave inférieure",
    contrebasse:"Une octave plus bas · Do écrit → Do entendu à l’octave inférieure",
    guitare_actuelle:"Une octave plus bas · Do écrit → Do entendu à l’octave inférieure",
    contrebasse_basse:"Une octave plus bas · Do écrit → Do entendu à l’octave inférieure",
    basse_electrique:"Une octave plus bas · Do écrit → Do entendu à l’octave inférieure"
  };
  const STRING_LAYOUTS = {
    violon:["Sol","Ré","La","Mi"],
    alto:["Do","Sol","Ré","La"],
    violoncelle:["Do","Sol","Ré","La"],
    contrebasse:["Mi","La","Ré","Sol"],
    guitare:["6e","5e","4e","3e","2e","1re"],
    violoncelle_baroque:["Do","Sol","Ré","La"],
    violon_traditionnel:["Sol","Ré","La","Mi"],
    guitare_actuelle:["6e","5e","4e","3e","2e","1re"],
    contrebasse_basse:["Mi","La","Ré","Sol"],
    basse_electrique:["4e","3e","2e","1re"]
  };

  const title = document.getElementById("instrument-title");
  const pedagogy = document.getElementById("pedagogy");
  const soundSummary = document.getElementById("sound-summary");
  const noteTarget = document.getElementById("generated-note");
  const hint = document.getElementById("hint");
  const answers = document.getElementById("answers");
  const feedback = document.getElementById("feedback");
  const progress = document.getElementById("progress-bar");
  const scoreText = document.getElementById("score");
  const fingeringMode = document.getElementById("fingering-mode");
  const fingeringNotice = document.getElementById("fingering-notice");
  const fingeringChoices = [...document.querySelectorAll('input[name="fingering-display"]')];
  const loadingView = document.getElementById("sound-loading");
  const loadingBar = document.getElementById("sound-loading-bar");
  const openStringsIntro = document.getElementById("open-strings-intro");
  const openStringsList = document.getElementById("open-strings-list");
  const startStringLevel = document.getElementById("start-string-level");
  const liveSoundButtons = [...document.querySelectorAll('[data-live-timbre]')];
  const liveInstrumentSound = document.getElementById("live-instrument-sound");

  function midi(code) {
    const match = /^([A-G])(sharp|flat|#|b)?(-?\d+)$/.exec(code);
    let pitch = {C:0,D:2,E:4,F:5,G:7,A:9,B:11}[match[1]];
    if (match[2] === "sharp" || match[2] === "#") pitch++;
    if (match[2] === "flat" || match[2] === "b") pitch--;
    return (Number(match[3]) + 1) * 12 + pitch;
  }
  function fromMidi(value) {
    const octave = Math.floor(value / 12) - 1;
    return PITCHES[(value % 12 + 12) % 12] + octave;
  }
  function buildSequence() {
    const pool = level.notes;
    const shuffled = values => values.slice().sort(() => Math.random() - .5);
    const balanced = (values, count) => {
      const result = [];
      while (result.length < count) {
        let round = shuffled(values);
        if (result.length && round.length > 1 && round[0].written === result.at(-1).written) {
          [round[0], round[1]] = [round[1], round[0]];
        }
        result.push(...round);
      }
      return result.slice(0, count);
    };
    if (levelNumber === 1) {
      sequence = balanced(pool, total);
      return;
    }

    const keyboardIds = new Set(["piano", "orgue", "accordeon", "clavecin"]);
    if (keyboardIds.has(id)) {
      sequence = balanced(pool, total);
      return;
    }
    const isStringInstrument = instrument.fingeringKind === "strings";
    const anchors = isStringInstrument ? instrument.levels[0].notes : instrument.levels[levelNumber - 2].notes;
    const anchorCodes = new Set(anchors.map(note => note.written));
    const learnedNotes = pool.filter(note => !anchorCodes.has(note.written));
    if (!learnedNotes.length) {
      sequence = balanced(pool, total);
      return;
    }
    const targets = balanced(learnedNotes, Math.floor(total / 2));
    const fallbackAnchors = balanced(anchors, targets.length);
    const positionKey = note => {
      const text = instrument.fingerings?.[note.written] || note.hint || "";
      return /Corde de (Do|Sol|Ré|La|Mi)/i.exec(text)?.[1]
        || /([1-6](?:e|re)) corde/i.exec(text)?.[1]
        || "";
    };
    sequence = [];
    targets.forEach((target, index) => {
      const key = isStringInstrument ? positionKey(target) : "";
      const relatedAnchor = key ? anchors.find(anchor => positionKey(anchor) === key) : null;
      sequence.push(relatedAnchor || fallbackAnchors[index], target);
    });
  }
  function renderAnswers() {
    // Dans le parcours Instrument, l'ordre suit le registre réellement écrit :
    // de la note la plus grave à la plus aiguë, octaves comprises.
    const lowestPitchByName = new Map();
    level.notes.forEach(note => {
      const name = NOTE_NAMES[note.written[0]];
      const pitch = midi(note.written);
      if (!name || !Number.isFinite(pitch)) return;
      if (!lowestPitchByName.has(name) || pitch < lowestPitchByName.get(name)) {
        lowestPitchByName.set(name, pitch);
      }
    });
    const names = [...lowestPitchByName.entries()]
      .sort((left, right) => left[1] - right[1])
      .map(([name]) => name);
    answers.replaceChildren();
    names.forEach(name => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = name;
      button.addEventListener("click", () => answer(name));
      answers.appendChild(button);
    });
  }
  function fingeringDisplay() {
    return fingeringChoices.find(choice => choice.checked)?.value || "off";
  }
  function hasFingeringHelp() {
    return !instrument.fingeringHelpDisabled && Boolean(instrument.fingerings || instrument.fingeringKind);
  }
  function naturalName(code) {
    return NOTE_NAMES[code[0]] || code[0];
  }
  function ownEntry(table, key) {
    if (!table || !Object.prototype.hasOwnProperty.call(table, key)) return { found:false, value:null };
    const value = table[key];
    return value === null || value === "" || typeof value === "undefined"
      ? { found:false, value:null }
      : { found:true, value };
  }
  function exactEntry(note, writtenTable, midiTable) {
    const written = ownEntry(writtenTable, note.written);
    if (written.found) return { ...written, source:"written-note" };
    const noteMidi = midi(note.written);
    const midiEntry = Number.isFinite(noteMidi) ? ownEntry(midiTable, String(noteMidi)) : { found:false, value:null };
    return midiEntry.found ? { ...midiEntry, source:"midi" } : { found:false, value:null, source:"" };
  }
  function generatedFingering(note) {
    const kind = instrument.fingeringKind;
    const pitch = note.written[0];
    const noteName = naturalName(note.written);
    if (kind === "keyboard") return { status:"available", value:`Touche ${noteName} · ${note.clef === "fa" ? "registre grave" : "registre médium / aigu"}`, source:"generated" };
    if (kind === "flute") {
      const exact = exactEntry(note, instrument.fingeringPatterns, instrument.fingeringPatternsByMidi);
      if (!exact.found) return { status:"missing", value:null, source:"" };
      return {
        status:"available",
        value:{ kind:"flute", controls:exact.value, label:`${noteName} écrit · doigté de base` },
        source:exact.source
      };
    }
    if (kind === "oboe") {
      const exact = exactEntry(note, instrument.fingeringPatterns, instrument.fingeringPatternsByMidi);
      if (!exact.found) return { status:"missing", value:null, source:"" };
      return {
        status:"available",
        value:{ kind:"oboe", controls:exact.value, label:`${noteName} écrit · doigté standard du hautbois` },
        source:exact.source
      };
    }
    if (kind === "clarinet") {
      const exact = exactEntry(note, instrument.fingeringPatterns, instrument.fingeringPatternsByMidi);
      if (!exact.found) return { status:"missing", value:null, source:"" };
      return {
        status:"available",
        value:{ kind:"clarinet", controls:exact.value, label:`${noteName} écrit · doigté standard Boehm` },
        source:exact.source
      };
    }
    if (kind === "woodwind" || kind === "recorder") {
      const exact = exactEntry(note, instrument.fingeringPatterns, instrument.fingeringPatternsByMidi);
      const legacy = instrument.allowLegacyPitchClassFingerings
        ? ownEntry(instrument.fingeringPatterns, pitch)
        : { found:false, value:null };
      const pattern = exact.found ? exact : legacy;
      if (!pattern.found) return { status:"missing", value:null, source:"" };
      return {
        status:"available",
        value:{ kind, keys:pattern.value, count:instrument.fingeringKeyCount, label:instrument.fingeringDiagramLabel || `${noteName} écrit · clés principales`, octave:note.written.slice(1) },
        source:exact.found ? exact.source : "legacy-pitch-class"
      };
    }
    if (!instrument.allowLegacyPitchClassFingerings) return { status:"missing", value:null, source:"" };
    if (kind === "tuba") {
      const valves = {C:[],D:[1,3],E:[1,2],F:[1],G:[],A:[1,2],B:[2]}[pitch] || [];
      return { status:"available", value:{ kind:"valves", keys:valves, label:`${noteName} · ${valves.length ? `pistons ${valves.join(" et ")}` : "pistons ouverts"}` }, source:"legacy-pitch-class" };
    }
    if (kind === "trombone") {
      const position = {C:6,D:4,E:2,F:1,G:4,A:2,B:7}[pitch];
      return position
        ? { status:"available", value:`${noteName} · ${position}${position === 1 ? "re" : "e"} position`, source:"legacy-pitch-class" }
        : { status:"missing", value:null, source:"" };
    }
    if (kind === "trumpet" || kind === "horn") {
      const valves = {C:[],D:[1,3],E:[1,2],F:[1],G:[],A:[1,2],B:[2]}[pitch] || [];
      const noun = kind === "horn" ? "palette" : "piston";
      const open = kind === "horn" ? "palettes libres" : "pistons ouverts";
      return { status:"available", value:valves.length ? `${noun}${valves.length > 1 ? "s" : ""} ${valves.join(" et ")}` : open, source:"legacy-pitch-class" };
    }
    return { status:"missing", value:null, source:"" };
  }
  function resolveFingering(note) {
    if (instrument.fingeringHelpDisabled) return { status:"disabled", value:null, source:"intentional" };
    const exact = exactEntry(note, instrument.fingerings, instrument.fingeringsByMidi);
    if (exact.found) return { status:"available", value:exact.value, source:exact.source };
    if (note.hint) return { status:"available", value:note.hint, source:"note" };
    const generated = generatedFingering(note);
    if (generated.status === "available") return generated;
    return hasFingeringHelp()
      ? { status:"missing", value:null, source:"" }
      : { status:"disabled", value:null, source:"intentional" };
  }
  function fingeringMarkup(value) {
    if (!value) return "";
    if (typeof value === "object" && value.kind === "flute") {
      const controls = value.controls || {};
      const key = (name, shortLabel, fullLabel, extraClass = "") => `<i class="flute-key ${extraClass}${controls[name] ? " active" : ""}" title="${fullLabel}"><span>${shortLabel}</span></i>`;
      return `<span class="flute-fingering" role="img" aria-label="${value.label}">
        <span class="flute-hand flute-hand-left" aria-label="Main gauche">
          <b>MG</b>
          ${key("leftThumb","P","Pouce gauche","flute-thumb")}
          ${key("leftIndex","1","Index gauche")}
          ${key("leftMiddle","2","Majeur gauche")}
          ${key("leftRing","3","Annulaire gauche")}
        </span>
        <span class="flute-tube" aria-hidden="true"></span>
        <span class="flute-hand flute-hand-right" aria-label="Main droite">
          <b>MD</b>
          ${key("rightIndex","1","Index droit")}
          ${key("rightMiddle","2","Majeur droit")}
          ${key("rightRing","3","Annulaire droit")}
          ${key("rightPinkyEb","M♭","Auriculaire droit, clé de mi bémol","flute-pinky")}
        </span>
        <span class="flute-foot" aria-label="Patte d'ut">
          ${key("footCSharp","Do♯","Clé de do dièse grave","flute-foot-key")}
          ${key("footC","Do","Clé de do grave","flute-foot-key")}
        </span>
      </span><span class="flute-fingering-label">${value.label}</span>`;
    }
    if (typeof value === "object" && value.kind === "oboe") {
      const controls = value.controls || {};
      const holeState = name => controls[name] === "half"
        ? " half"
        : controls[name] === "closed" || controls[name] === true
          ? " closed"
          : " open";
      const hole = (name, shortLabel, fullLabel) => `<i class="oboe-hole${holeState(name)}" title="${fullLabel}"><span>${shortLabel}</span></i>`;
      const key = (name, shortLabel, fullLabel, extraClass = "") => `<i class="oboe-key ${extraClass}${controls[name] ? " active" : ""}" title="${fullLabel}"><span>${shortLabel}</span></i>`;
      const states = [
        `index gauche ${controls.leftIndex === "half" ? "demi-trou" : controls.leftIndex === "closed" || controls.leftIndex === true ? "fermé" : "ouvert"}`,
        ...[["leftMiddle","majeur gauche"],["leftRing","annulaire gauche"],["rightIndex","index droit"],["rightMiddle","majeur droit"],["rightRing","annulaire droit"],["rightF","clé de fa"],["leftPinkyB","clé de si grave"],["rightPinkyC","clé de do grave"],["octave1","première clé d’octave"]]
          .filter(([name]) => controls[name]).map(([, label]) => `${label} fermé`)
      ].join(", ");
      return `<span class="oboe-fingering" role="img" aria-label="${value.label}. ${states}">
        <span class="oboe-octave" aria-hidden="true">${key("octave1","O1","Première clé d’octave","oboe-octave-key")}</span>
        <span class="oboe-hand oboe-hand-left" aria-hidden="true"><b>MG</b>
          ${hole("leftIndex","1","Index gauche")}
          ${hole("leftMiddle","2","Majeur gauche")}
          ${hole("leftRing","3","Annulaire gauche")}
          ${key("leftPinkyB","Si","Clé de si grave","oboe-pinky")}
        </span>
        <span class="oboe-joint" aria-hidden="true"></span>
        <span class="oboe-hand oboe-hand-right" aria-hidden="true"><b>MD</b>
          ${hole("rightIndex","1","Index droit")}
          ${hole("rightMiddle","2","Majeur droit")}
          ${hole("rightRing","3","Annulaire droit")}
          ${key("rightF","Fa","Clé de fa","oboe-f-key")}
          ${key("rightPinkyC","Do","Clé de do grave","oboe-pinky")}
        </span>
      </span><span class="oboe-fingering-label">${value.label}</span>`;
    }
    if (typeof value === "object" && value.kind === "clarinet") {
      const controls = value.controls || {};
      const hole = (name, shortLabel, fullLabel, extraClass = "") => `<i class="clarinet-control clarinet-hole ${extraClass}${controls[name] ? " closed" : " open"}" title="${fullLabel}"><span>${shortLabel}</span></i>`;
      const key = (name, shortLabel, fullLabel, extraClass = "") => `<i class="clarinet-control clarinet-key ${extraClass}${controls[name] ? " active" : " inactive"}" title="${fullLabel}"><span>${shortLabel}</span></i>`;
      const holeState = (name, label) => `${label} ${controls[name] ? "fermé" : "ouvert"}`;
      const keyState = (name, label) => `${label} ${controls[name] ? "activée" : "inactive"}`;
      const states = [
        holeState("leftThumb", "trou de pouce gauche"),
        keyState("registerKey", "clé de registre"),
        holeState("leftIndex", "index gauche"),
        holeState("leftMiddle", "majeur gauche"),
        holeState("leftRing", "annulaire gauche"),
        holeState("rightIndex", "index droit"),
        holeState("rightMiddle", "majeur droit"),
        holeState("rightRing", "annulaire droit"),
        keyState("leftAKey", "clé de la"),
        keyState("leftPinkyFC", "clé d'auriculaire gauche fa/do"),
        keyState("rightPinkyEB", "clé d'auriculaire droit mi/si")
      ].join(", ");
      return `<span class="clarinet-fingering" role="img" aria-label="${value.label}. ${states}">
        <span class="clarinet-rear" aria-hidden="true"><b>Arrière</b>
          ${key("registerKey","R","Clé de registre","clarinet-register")}
          ${hole("leftThumb","P","Trou du pouce gauche","clarinet-thumb")}
        </span>
        <span class="clarinet-body" aria-hidden="true">
          <span class="clarinet-mouthpiece"></span>
          <span class="clarinet-hand clarinet-hand-left"><b>MG</b>
            ${key("leftAKey","La","Clé de la","clarinet-a-key")}
            ${hole("leftIndex","1","Index gauche")}
            ${hole("leftMiddle","2","Majeur gauche")}
            ${hole("leftRing","3","Annulaire gauche")}
            ${key("leftPinkyFC","Fa/Do","Clé d'auriculaire gauche fa/do","clarinet-pinky")}
          </span>
          <span class="clarinet-joint"></span>
          <span class="clarinet-hand clarinet-hand-right"><b>MD</b>
            ${hole("rightIndex","1","Index droit")}
            ${hole("rightMiddle","2","Majeur droit")}
            ${hole("rightRing","3","Annulaire droit")}
            ${key("rightPinkyEB","Mi/Si","Clé d'auriculaire droit mi/si","clarinet-pinky")}
          </span>
          <span class="clarinet-bell"></span>
        </span>
      </span><span class="clarinet-fingering-label">${value.label}</span>`;
    }
    if (typeof value === "object" && (value.kind === "woodwind" || value.kind === "recorder")) {
      const count = value.count || (value.kind === "recorder" ? 8 : 6);
      const start = value.kind === "recorder" ? 0 : 1;
      return `<span class="fingering-visual woodwind ${value.kind}" aria-hidden="true">${Array.from({length:count}, (_,i) => i + start).map(number => `<i class="woodwind-key${value.keys.includes(number) ? " active" : ""}"></i>`).join("")}</span><span>${value.label}</span>`;
    }
    if (typeof value === "object" && value.kind === "valves") {
      return `<span class="fingering-visual trumpet" aria-hidden="true">${[1,2,3].map(number => `<i class="fingering-piston${value.keys.includes(number) ? " active" : ""}"></i>`).join("")}</span><span>${value.label}</span>`;
    }
    if (STRING_LAYOUTS[id]) {
      const strings = STRING_LAYOUTS[id];
      const bowedString = /Corde de (Do|Sol|Ré|La|Mi)/i.exec(value)?.[1];
      const guitarString = /((?:[1-6])(?:e|re)) corde/i.exec(value)?.[1];
      const stringName = guitarString || bowedString;
      const finger = /doigt (\d)/i.exec(value)?.[1];
      const fret = /case (\d+)/i.exec(value)?.[1];
      const marker = fret || finger || "0";
      const label = fret
        ? `${stringName} corde — case ${fret}`
        : guitarString
          ? `${stringName} corde — à vide`
          : `${stringName} — ${finger ? `doigt ${finger}` : "corde à vide"}`;
      return `<span class="fingering-visual strings" style="--string-count:${strings.length}" aria-hidden="true">${strings.map(name => `<i class="fingering-string${name === stringName ? " active" : ""}" data-finger="${name === stringName ? marker : ""}"></i>`).join("")}</span><span>${label}</span>`;
    }
    if (id === "cor") {
      const open = /libres/i.test(value);
      const active = open ? [] : (value.match(/[123]/g) || []);
      return `<span class="fingering-visual horn" aria-hidden="true">${[1,2,3].map(number => `<i class="horn-lever${active.includes(String(number)) ? " active" : ""}">${number}</i>`).join("")}</span><span>${open ? "Palettes libres" : value}</span>`;
    }
    if (id === "trompette") {
      const open = /ouverts/i.test(value);
      const active = open ? [] : (value.match(/[123]/g) || []);
      return `<span class="fingering-visual trumpet" aria-hidden="true">${[1,2,3].map(number => `<i class="fingering-piston${active.includes(String(number)) ? " active" : ""}"></i>`).join("")}</span><span>${open ? "Pistons ouverts" : value}</span>`;
    }
    return `<span>${value}</span>`;
  }
  function showFingering(note, visible) {
    const resolved = resolveFingering(note);
    if (resolved.status === "disabled") {
      hint.replaceChildren();
      hint.hidden = true;
      return;
    }
    const value = resolved.status === "available" ? resolved.value : "Doigté non disponible";
    hint.innerHTML = fingeringMarkup(value);
    hint.hidden = !visible;
  }
  function renderCurrent() {
    const note = sequence[current];
    window.LDNNoteRenderer.renderNote(noteTarget, {
      note:note.written,
      clef:note.clef,
      rangeNotes:level.notes.filter(levelNote => levelNote.clef === note.clef).map(levelNote => levelNote.written),
      label:window.LDNNoteRenderer.clefLabels[note.clef] || note.clef,
      adaptive:true,
      compact:true,
      minHeight:170,
      width:150,
      staveWidth:112,
      centerStave:true,
      staveOffsetY:15,
      lineSpacing:22,
      noteScale:1
    });
    showFingering(note, fingeringDisplay() === "always");
    feedback.textContent = "";
    isWaiting = false;
    answers.querySelectorAll("button").forEach(button => { button.disabled = false; });
  }
  async function answer(name) {
    if (current >= total || isWaiting) return;
    isWaiting = true;
    answers.querySelectorAll("button").forEach(button => { button.disabled = true; });
    const note = sequence[current];
    if (name === NOTE_NAMES[note.written[0]]) {
      score++;
      feedback.textContent = `✓ ${NOTE_NAMES[note.written[0]]}`;
      feedback.style.color = "green";
      window.LDNAudio.playNote(note, id, timbre).catch(() => {});
    } else {
      feedback.textContent = `✗ C’était ${NOTE_NAMES[note.written[0]]}`;
      feedback.style.color = "red";
      window.LDNAudio.playDuck().catch(() => {});
    }
    showFingering(note, fingeringDisplay() !== "off");
    current++;
    scoreText.textContent = `Score : ${score} / ${total}`;
    progress.style.width = `${current / total * 100}%`;
    if (current < total) setTimeout(renderCurrent, feedbackDelay); else setTimeout(finish, feedbackDelay);
  }
  function finish() {
    document.getElementById("quiz").hidden = true;
    const resultPanel = document.getElementById("result");
    fingeringMode.hidden = true;
    window.LDNResultPanel.show(resultPanel,{title:score >= 8 ? "Bravo !" : "Encore un effort !",score:`${score} / ${total}`,homeHref:"index.html?mode=instrument",homeLabel:"Choisir un autre exercice"});
    if (matchMedia("(max-width: 700px)").matches) requestAnimationFrame(() => resultPanel.scrollIntoView({ behavior:"smooth", block:"start" }));
  }
  function sendScore() {
    if (scoreSent) return;
    const firstName = document.getElementById("prenom").value.trim();
    const lastName = document.getElementById("nom").value.trim();
    const fmTeacher = document.getElementById("prof_fm").value;
    const instrumentTeacher = document.getElementById("prof_instrument").value;
    const confirmation = document.getElementById("confirmation");
    const loading = document.getElementById("loading-message");
    const button = document.getElementById("send-score-button");
    const fmSelected = fmTeacher && fmTeacher !== "Aucun";
    const instrumentSelected = instrumentTeacher && instrumentTeacher !== "Aucun";

    if (!firstName || !lastName || (!fmSelected && !instrumentSelected)) {
      confirmation.className = "send-confirmation error";
      confirmation.textContent = "Indique ton prénom, ton nom et au moins un professeur.";
      return;
    }
    if (!window.LDN_ENDPOINT || window.LDN_ENDPOINT.includes("PASTE_YOUR_EXEC_URL_HERE")) {
      confirmation.className = "send-confirmation error";
      confirmation.textContent = "L’envoi n’est pas configuré.";
      return;
    }

    const data = new URLSearchParams();
    data.append("prenom", firstName);
    data.append("nom", lastName);
    data.append("exercice", "Lecture de notes");
    data.append("type", `instrument_${id}_niveau${levelNumber}`);
    data.append("score", `${Math.round(score / total * 100)}%`);
    data.append("prof_fm", fmSelected ? fmTeacher : "Aucun");
    data.append("prof_instrument", instrumentSelected ? instrumentTeacher : "Aucun");

    loading.hidden = false;
    confirmation.textContent = "";
    fetch(window.LDN_ENDPOINT, { method:"POST", mode:"no-cors", body:data })
      .then(() => {
        scoreSent = true;
        loading.hidden = true;
        confirmation.style.color = "green";
        confirmation.className = "send-confirmation success";
        confirmation.textContent = "✓ Résultat envoyé au fichier de suivi.";
        button.disabled = true;
        button.textContent = "Résultat envoyé";
      })
      .catch(() => {
        loading.hidden = true;
        confirmation.className = "send-confirmation error";
        confirmation.textContent = "L’envoi n’a pas abouti.";
      });
  }
  function restart() {
    current=0; score=0; isWaiting=false; scoreSent=false; buildSequence();
    document.getElementById("result").hidden=true;
    document.getElementById("quiz").hidden=false;
    fingeringMode.hidden = !hasFingeringHelp();
    scoreText.textContent=`Score : 0 / ${total}`;
    progress.style.width="0";
    document.getElementById("confirmation").textContent="";
    document.getElementById("send-score").open=false;
    document.getElementById("loading-message").hidden=true;
    const sendButton=document.getElementById("send-score-button");
    sendButton.disabled=false;
    sendButton.textContent="Envoyer mon résultat";
    renderCurrent();
  }

  function showOpenStringsReminder() {
    const strings = STRING_LAYOUTS[id];
    const previousNotes = levelNumber > 1
      ? new Set(instrument.levels[levelNumber - 2].notes.map(note => note.written))
      : new Set();
    const reminderNotes = levelNumber === 1
      ? (strings ? level.notes.slice(0, strings.length) : level.notes)
      : level.notes.filter(note => !previousNotes.has(note.written));
    if (!reminderNotes.length) return false;
    const reminderTitle = openStringsIntro.querySelector("h3");
    reminderTitle.textContent = levelNumber === 1
      ? (strings ? "Rappelle-toi les cordes à vide" : "Notes travaillées dans ce niveau")
      : `Nouvelles notes · ${level.title}`;
    openStringsList.className = "open-strings-list combined-staff";
    const notesByClef = reminderNotes.reduce((groups, note) => {
      (groups[note.clef] ||= []).push(note);
      return groups;
    }, {});
    const staffGroups = Object.entries(notesByClef).map(([clef, notes]) => {
      const group = document.createElement("div");
      group.className = "reminder-staff-group";
      if (Object.keys(notesByClef).length > 1) {
        const clefLabel = document.createElement("p");
        clefLabel.className = "reminder-clef-label";
        clefLabel.textContent = window.LDNNoteRenderer.clefLabels[clef] || clef;
        group.appendChild(clefLabel);
      }
      const notation = document.createElement("div");
      notation.className = "open-strings-staff";
      const labels = document.createElement("div");
      labels.className = "open-strings-labels";
      const noteNames = notes.map(note => naturalName(note.written));
      noteNames.forEach((name, index) => {
        const label = document.createElement("span");
        label.textContent = name;
        const ratio = noteNames.length === 1 ? .5 : index / (noteNames.length - 1);
        label.style.left = `${30 + (78 - 30) * ratio}%`;
        labels.appendChild(label);
      });
      group.append(notation, labels);
      window.LDNNoteRenderer.renderNotes(notation, {
        notes:notes.map(note => note.written),
        clef,
        label:levelNumber === 1 ? `Notes du niveau : ${noteNames.join(", ")}` : `Nouvelles notes : ${noteNames.join(", ")}`,
        width:560,
        minHeight:175,
        lineSpacing:18,
        noteScale:1
      });
      return group;
    });
    openStringsList.replaceChildren(...staffGroups);
    openStringsIntro.hidden = false;
    document.body.classList.add("instrument-intro-active");
    return true;
  }

  function updateSoundSummary() {
    soundSummary.textContent = timbre === "piano"
      ? "Piano en ut · la hauteur entendue correspond à la note écrite"
      : (TRANSPOSITIONS[id] || "");
    soundSummary.hidden = !soundSummary.textContent;
    liveSoundButtons.forEach(button => {
      const selected = button.dataset.liveTimbre === timbre;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
  }

  async function setLiveTimbre(nextTimbre) {
    if (instrument.forcePiano || nextTimbre === timbre) return;
    timbre = nextTimbre;
    const url = new URL(location.href);
    url.searchParams.set("timbre", timbre);
    history.replaceState(null, "", url);
    updateSoundSummary();
    try { await window.LDNAudio.preloadForLevel(id, level, timbre); } catch (_) {}
  }

  document.title = `${instrument.label} — Niveau ${levelNumber}`;
  title.textContent = `${instrument.label} — Niveau ${levelNumber} : ${level.title}`;
  pedagogy.textContent = level.pedagogy;
  liveInstrumentSound.textContent = instrument.label;
  liveInstrumentSound.hidden = Boolean(instrument.forcePiano);
  if (instrument.forcePiano) timbre = "piano";
  updateSoundSummary();
  liveSoundButtons.forEach(button => button.addEventListener("click", () => setLiveTimbre(button.dataset.liveTimbre)));
  startStringLevel.addEventListener("click", () => {
    openStringsIntro.hidden = true;
    document.body.classList.remove("instrument-intro-active");
    const quizPanel = document.getElementById("quiz");
    quizPanel.hidden = false;
    renderCurrent();
    if (matchMedia("(max-width: 700px)").matches) requestAnimationFrame(() => quizPanel.scrollIntoView({ behavior:"smooth", block:"start" }));
  });
  fingeringMode.hidden = !hasFingeringHelp();
  fingeringNotice.textContent = instrument.fingeringNotice || "";
  fingeringNotice.hidden = !instrument.fingeringNotice;
  scoreText.textContent = `Score : 0 / ${total}`;
  fingeringChoices.forEach(choice => choice.addEventListener("change", () => {
    const note = isWaiting ? sequence[Math.max(0, current - 1)] : sequence[current];
    showFingering(note, fingeringDisplay() === "always" || (isWaiting && fingeringDisplay() === "after"));
  }));
  document.getElementById("restart").addEventListener("click", restart);
  document.getElementById("send-score-button").addEventListener("click", sendScore);
  document.addEventListener("keydown", event => {
    if (event.defaultPrevented || event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
    const tag = event.target?.tagName?.toLowerCase();
    if (["input", "select", "textarea", "button"].includes(tag) || event.target?.isContentEditable) return;
    if (document.querySelector("dialog[open]") || quiz.hidden || !result.hidden || isWaiting) return;
    const map = { c:"Do", d:"Ré", e:"Mi", f:"Fa", g:"Sol", a:"La", b:"Si" };
    const note = map[event.key?.toLowerCase()];
    const button = [...answers.querySelectorAll("button")].find(candidate => candidate.textContent.trim() === note);
    if (!button || button.disabled) return;
    event.preventDefault();
    button.click();
  });
  async function initialize() {
    buildSequence();
    renderAnswers();
    const hasReminder = showOpenStringsReminder();
    if (hasReminder) {
      loadingView.hidden = true;
      if (matchMedia("(max-width: 700px)").matches) requestAnimationFrame(() => openStringsIntro.scrollIntoView({ behavior:"smooth", block:"start" }));
    }
    try {
      await window.LDNAudio.preloadForLevel(id, level, timbre, ratio => {
        loadingBar.style.width = `${Math.round(ratio * 100)}%`;
      });
    } catch (error) {
      console.warn("Préchargement audio incomplet", error);
    }
    loadingBar.style.width = "100%";
    loadingView.hidden = true;
    if (!hasReminder) {
      document.body.classList.remove("instrument-intro-active");
      document.getElementById("quiz").hidden = false;
      renderCurrent();
    }
  }
  initialize();
}());
