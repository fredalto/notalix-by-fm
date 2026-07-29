(function () {
  "use strict";
  const NOTE_NAMES = { C:"Do", D:"Ré", E:"Mi", F:"Fa", G:"Sol", A:"La", B:"Si" };
  const PITCHES = ["C","Csharp","D","Dsharp","E","F","Fsharp","G","Gsharp","A","Asharp","B"];
  const params = new URLSearchParams(location.search);
  const id = params.get("instrument") || "flute";
  const levelNumber = Math.max(1, Math.min(4, Number(params.get("niveau")) || 1));
  const timbre = params.get("timbre") === "piano" ? "piano" : "instrument";
  const instrument = window.LDN_INSTRUMENTS[id];
  if (!instrument) { location.href = "index.html"; return; }
  const level = instrument.levels[levelNumber - 1];
  const total = 10;
  let current = 0;
  let score = 0;
  let sequence = [];
  let isWaiting = false;
  let scoreSent = false;
  const feedbackDelay = 1500;

  const title = document.getElementById("instrument-title");
  const pedagogy = document.getElementById("pedagogy");
  const noteTarget = document.getElementById("generated-note");
  const hint = document.getElementById("hint");
  const answers = document.getElementById("answers");
  const feedback = document.getElementById("feedback");
  const progress = document.getElementById("progress-bar");
  const scoreText = document.getElementById("score");
  const fingeringMode = document.getElementById("fingering-mode");
  const fingeringToggle = document.getElementById("fingering-toggle");
  const loadingView = document.getElementById("sound-loading");
  const loadingBar = document.getElementById("sound-loading-bar");

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
    const base = pool.slice().sort(() => Math.random() - .5);
    sequence = [];
    while (sequence.length < total) sequence.push(...base.slice().sort(() => Math.random() - .5));
    sequence = sequence.slice(0, total);
    for (let i = 1; i < sequence.length; i++) {
      if (sequence[i].written === sequence[i-1].written) {
        const swap = sequence.findIndex((n, j) => j > i && n.written !== sequence[i-1].written);
        if (swap > i) [sequence[i], sequence[swap]] = [sequence[swap], sequence[i]];
      }
    }
  }
  function renderAnswers() {
    const names = [...new Set(level.notes.map(n => NOTE_NAMES[n.written[0]]))];
    answers.replaceChildren();
    names.forEach(name => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = name;
      button.addEventListener("click", () => answer(name));
      answers.appendChild(button);
    });
  }
  function renderCurrent() {
    const note = sequence[current];
    const octaveMatch = /(-?\d+)$/.exec(note.written);
    const octave = octaveMatch ? Number(octaveMatch[1]) : 4;
    const renderHeight = note.clef === "sol" && octave <= 3
      ? 165
      : note.clef === "fa" && octave <= 1
        ? 190
        : 135;
    noteTarget.style.height = `${Math.round(renderHeight * 1.5)}px`;
    window.LDNNoteRenderer.renderNote(noteTarget, { note:note.written, clef:note.clef, label:`Clé ${note.clef}`, height:renderHeight });
    const fingering = instrument.fingerings && instrument.fingerings[note.written];
    hint.textContent = fingering || "";
    hint.hidden = !fingeringToggle.checked || !fingering;
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
    fingeringMode.hidden = !instrument.fingerings;
    scoreText.textContent=`Score : 0 / ${total}`;
    progress.style.width="0";
    document.getElementById("confirmation").textContent="";
    document.getElementById("loading-message").hidden=true;
    const sendButton=document.getElementById("send-score-button");
    sendButton.disabled=false;
    sendButton.textContent="Envoyer";
    renderCurrent();
  }

  document.title = `${instrument.label} — Niveau ${levelNumber}`;
  title.textContent = `${instrument.label} — Niveau ${levelNumber} : ${level.title}`;
  pedagogy.textContent = level.pedagogy;
  fingeringMode.hidden = !instrument.fingerings;
  fingeringToggle.checked = localStorage.getItem(`ldn-fingering-${id}`) === "shown";
  fingeringToggle.addEventListener("change", () => {
    localStorage.setItem(`ldn-fingering-${id}`, fingeringToggle.checked ? "shown" : "hidden");
    renderCurrent();
  });
  document.getElementById("restart").addEventListener("click", restart);
  document.getElementById("send-score-button").addEventListener("click", sendScore);
  document.addEventListener("keydown", event => { const map={c:"Do",d:"Ré",e:"Mi",f:"Fa",g:"Sol",a:"La",b:"Si"}; if(map[event.key.toLowerCase()]) answer(map[event.key.toLowerCase()]); });
  async function initialize() {
    buildSequence();
    renderAnswers();
    try {
      await window.LDNAudio.preloadForLevel(id, level, timbre, ratio => {
        loadingBar.style.width = `${Math.round(ratio * 100)}%`;
      });
    } catch (error) {
      console.warn("Préchargement audio incomplet", error);
    }
    loadingBar.style.width = "100%";
    loadingView.hidden = true;
    document.getElementById("quiz").hidden = false;
    renderCurrent();
  }
  initialize();
}());
