(function () {
  "use strict";
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
    return Boolean(instrument.fingerings || instrument.fingeringKind);
  }
  function naturalName(code) {
    return NOTE_NAMES[code[0]] || code[0];
  }
  function generatedFingering(note) {
    const kind = instrument.fingeringKind;
    const pitch = note.written[0];
    const noteName = naturalName(note.written);
    if (kind === "keyboard") return `Touche ${noteName} · ${note.clef === "fa" ? "registre grave" : "registre médium / aigu"}`;
    if (kind === "woodwind" || kind === "recorder") {
      const keys = instrument.fingeringPatterns?.[note.written] ?? instrument.fingeringPatterns?.[pitch] ?? [];
      return { kind, keys, count:instrument.fingeringKeyCount, label:instrument.fingeringDiagramLabel || `${noteName} écrit · clés principales`, octave:note.written.slice(1) };
    }
    if (kind === "tuba") {
      const valves = {C:[],D:[1,3],E:[1,2],F:[1],G:[],A:[1,2],B:[2]}[pitch] || [];
      return { kind:"valves", keys:valves, label:`${noteName} · ${valves.length ? `pistons ${valves.join(" et ")}` : "pistons ouverts"}` };
    }
    if (kind === "trombone") {
      const position = {C:6,D:4,E:2,F:1,G:4,A:2,B:7}[pitch];
      return position ? `${noteName} · ${position}${position === 1 ? "re" : "e"} position` : "";
    }
    if (kind === "trumpet" || kind === "horn") {
      const valves = {C:[],D:[1,3],E:[1,2],F:[1],G:[],A:[1,2],B:[2]}[pitch] || [];
      const noun = kind === "horn" ? "palette" : "piston";
      const open = kind === "horn" ? "palettes libres" : "pistons ouverts";
      return valves.length ? `${noun}${valves.length > 1 ? "s" : ""} ${valves.join(" et ")}` : open;
    }
    return "";
  }
  function fingeringMarkup(value) {
    if (!value) return "";
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
    const value = (instrument.fingerings && instrument.fingerings[note.written]) || generatedFingering(note) || note.hint;
    hint.innerHTML = fingeringMarkup(value);
    hint.hidden = !visible || !value;
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
    document.getElementById("result").hidden = false;
    fingeringMode.hidden = true;
    document.getElementById("result-title").textContent = score >= 8 ? "Bravo !" : "Encore un effort !";
    document.getElementById("result-text").textContent = `${score} bonne${score > 1 ? "s" : ""} réponse${score > 1 ? "s" : ""} sur ${total}.`;
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
      confirmation.style.color = "red";
      confirmation.textContent = "Merci de renseigner Prénom, Nom, et au moins un professeur (FM ou instrument).";
      return;
    }
    if (!window.LDN_ENDPOINT || window.LDN_ENDPOINT.includes("PASTE_YOUR_EXEC_URL_HERE")) {
      confirmation.style.color = "red";
      confirmation.textContent = "❌ URL d’envoi non configurée (config.js).";
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
        confirmation.textContent = "✅ Score envoyé avec succès !";
        button.disabled = true;
        button.textContent = "Score déjà envoyé";
      })
      .catch(() => {
        loading.hidden = true;
        confirmation.style.color = "red";
        confirmation.textContent = "❌ Une erreur est survenue pendant l’envoi.";
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
    document.getElementById("loading-message").hidden=true;
    const sendButton=document.getElementById("send-score-button");
    sendButton.disabled=false;
    sendButton.textContent="Envoyer";
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
    document.getElementById("quiz").hidden = false;
    renderCurrent();
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
    if (hasReminder) loadingView.hidden = true;
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
