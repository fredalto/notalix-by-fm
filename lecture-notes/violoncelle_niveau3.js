// Niveau 3 : cordes à vide, premier doigt et repères naturels voisins
// Alternance stricte par paires : [0 -> (1 ou 2)] puis [0 (autre corde) -> (1 ou 2)], etc.
// 20 questions = 10 paires
const STRINGS = [
  { // Do
    idx: 3, name: "Do",
    open:  { nom:"Do",  image:"Images/fa/C2.png", fingering:"0", s:3 },
    f1:    { nom:"Ré",  image:"Images/fa/D2.png", fingering:"1", s:3 },
    f2:    { nom:"Mi", image:"Images/fa/E2.png", fingering:"3", s:3 }
  },
  { // Sol
    idx: 0, name: "Sol",
    open:  { nom:"Sol", image:"Images/fa/G2.png", fingering:"0", s:0 },
    f1:    { nom:"La",  image:"Images/fa/A2.png", fingering:"1", s:0 },
    f2:    { nom:"Si",  image:"Images/fa/B2.png", fingering:"3", s:0 }
  },
  { // Ré
    idx: 1, name: "Ré",
    open:  { nom:"Ré",  image:"Images/fa/D3.png", fingering:"0", s:1 },
    f1:    { nom:"Mi",  image:"Images/fa/E3.png", fingering:"1", s:1 },
    f2:    { nom:"Fa",  image:"Images/fa/F3.png", fingering:"2", s:1 }
  },
  { // La
    idx: 2, name: "La",
    open:  { nom:"La",  image:"Images/fa/A3.png", fingering:"0", s:2 },
    f1:    { nom:"Si",  image:"Images/fa/B3.png", fingering:"1", s:2 },
    f2:    { nom:"Do",  image:"Images/fa/C4.png", fingering:"2", s:2 }
  },
];

const labels = ['Do','Ré','Mi','Fa','Sol','La','Si'];

let score = 0;
let totalQuestions = 20; // 10 paires
let currentQuestion = 0;
let currentCorrectAnswer = "";
let quizNotes = [];        // séquence finale
let isWaiting = false;
let showFingering = false;

const startButton    = document.getElementById("start-quiz");
const quizSection    = document.getElementById("quiz-section");
const noteImage      = document.getElementById("note-image");
const gameContainer  = document.getElementById("game-container");
const feedback       = document.getElementById("feedback");
const progressBar    = document.getElementById("progress-bar");
const scoreDisplay   = document.getElementById("score-display");
const endButtons     = document.getElementById("end-buttons");
const fingeringBadge = document.getElementById("fingering-badge");
const toggleFingering= document.getElementById("toggle-fingering");

startButton.addEventListener("click", startQuiz);
if (toggleFingering) {
  toggleFingering.addEventListener("change", () => {
    showFingering = !!toggleFingering.checked;
    if (quizSection.style.display !== "none") {
      const n = quizNotes[currentQuestion];
      updateFingeringBadge(n);
    }
  });
}

function startQuiz() {
  startButton.style.display = "none";
  document.getElementById("note-reference").style.display = "none";
  quizSection.style.display = "block";

  score = 0;
  currentQuestion = 0;
  isWaiting = false;

  // 1) Construire l'ordre des 10 "cordes à vide" (10 opens) :
  // - Au moins 2 fois CHAQUE corde à vide
  // - Jamais la même corde deux fois de suite
  const openOrder = buildOpenOrder(10);

  // 2) Pour chaque open, ajouter la paire [open, finger(1 ou 2) de la même corde]
  quizNotes = [];
  for (const sIdx of openOrder) {
    const S = STRINGS[sIdx];
    quizNotes.push(S.open);                 // 0
    quizNotes.push(Math.random() < 0.5 ? S.f1 : S.f2); // 1 ou 2
  }

  loadNextQuestion();
}

function buildOpenOrder(pairsCount){
  // Base : 2 occurrences de chaque corde (garantit la couverture) -> 8 opens
  const base = [0,0,1,1,2,2,3,3];

  // +2 opens supplémentaires au hasard pour atteindre 10 (en évitant de favoriser une seule corde)
  for (let i=0;i<2;i++){
    const r = Math.floor(Math.random()*4);
    base.push(r);
  }

  // Mélange puis répare pour éviter deux mêmes cordes consécutives
  let arr = base.sort(()=>Math.random()-0.5);

  // Réparation locale si adjacence même corde
  for (let i=1;i<arr.length;i++){
    if (arr[i] === arr[i-1]){
      // chercher une position j pour swap (différente des voisins)
      let j=i+1;
      while (j<arr.length && (arr[j]===arr[i] || (j>0 && arr[j]===arr[j-1]) )) j++;
      if (j<arr.length){
        [arr[i], arr[j]] = [arr[j], arr[i]];
      } else {
        // fallback : swap avec un index précédent compatible
        for (let k=0;k<i-1;k++){
          if (arr[k]!==arr[i] && (k===0 || arr[k]!==arr[k-1]) && arr[k]!==arr[i-1]){
            [arr[i], arr[k]] = [arr[k], arr[i]];
            break;
          }
        }
      }
    }
  }

  // Si malgré tout il reste un doublon immédiat (très rare), on re-mélange et on répare (sécurité)
  let attempts=0;
  while (hasConsecutiveEquals(arr) && attempts<10){
    arr = arr.sort(()=>Math.random()-0.5);
    for (let i=1;i<arr.length;i++){
      if (arr[i]===arr[i-1]){
        for (let k=0;k<arr.length;k++){
          if (k!==i && k!==i-1 && arr[k]!==arr[i-1] && (k===0 || arr[k]!==arr[k-1])){
            [arr[i],arr[k]]=[arr[k],arr[i]];
            break;
          }
        }
      }
    }
    attempts++;
  }

  return arr.slice(0, pairsCount);
}

function hasConsecutiveEquals(a){
  for (let i=1;i<a.length;i++) if (a[i]===a[i-1]) return true;
  return false;
}

function loadNextQuestion() {
  if (currentQuestion >= totalQuestions) {
    showFinalScore();
    return;
  }

  const n = quizNotes[currentQuestion];
  currentCorrectAnswer = n.nom;

  noteImage.src = n.image;
  noteImage.alt = n.nom;

  updateFingeringBadge(n);

  gameContainer.innerHTML = "";
  feedback.textContent = "";

  labels.forEach((label) => {
    const button = document.createElement("button");
    button.textContent = label;
    button.className = "button";
    button.addEventListener("click", () => checkAnswer(label));
    gameContainer.appendChild(button);
  });

  updateScoreDisplay();
}

function updateFingeringBadge(note) {
  if (!fingeringBadge) return;
  if (showFingering) {
    fingeringBadge.textContent = note?.fingering ?? "";
    fingeringBadge.style.display = "inline-flex";
  } else {
    fingeringBadge.style.display = "none";
  }
}

function playSound(filename) { new Audio(`sounds/${filename}`).play(); }

function checkAnswer(selected) {
  if (isWaiting || currentQuestion >= totalQuestions) return;
  isWaiting = true;

  if (selected === currentCorrectAnswer) {
    score++;
    feedback.textContent = "Bonne réponse !";
    feedback.className = "correct";
    const noteFile = noteImage.src.split("/").pop().replace(".png", ".mp3");
    playSound(noteFile);
  } else {
    feedback.textContent = `Incorrect ! C'était "${currentCorrectAnswer}".`;
    feedback.className = "incorrect";
    playSound("duck.mp3");
  }

  currentQuestion++;
  updateProgress();

  const allButtons = gameContainer.querySelectorAll("button");
  allButtons.forEach(btn => btn.disabled = true);

  setTimeout(() => { isWaiting = false; loadNextQuestion(); }, 1000);
}

function updateProgress() {
  progressBar.style.width = (currentQuestion / totalQuestions) * 100 + "%";
}

function updateScoreDisplay() {
  scoreDisplay.innerHTML = `
    <div style="font-size: 28px; font-weight: bold;">
      Score : ${score} / ${totalQuestions}
    </div>
  `;
}

function showFinalScore() {
  quizSection.style.display = "none";
  endButtons.style.display = "block";

  const percent = Math.round((score / totalQuestions) * 100);
  let html = `
    <div style="font-size: 36px; font-weight: bold; margin-bottom: 10px;">
      Score final : ${score} / ${totalQuestions} (${percent}%)
    </div>
  `;

  if (percent >= 90) {
    html += `
      <div style="color: green; font-size: 20px; margin-bottom: 10px;">
        🎉 Excellent !
      </div>
      <div style="font-size: 18px; color: #333; margin-bottom: 20px;">
        🚀 Tu peux passer au niveau suivant !
      </div>
    `;
  } else {
    html += `
      <div style="font-size: 18px; color: #333; margin-bottom: 20px;">
        🔁 Recommence pour consolider.
      </div>
    `;
  }

  scoreDisplay.innerHTML = html;
  scoreDisplay.style.display = "block";
  endButtons.parentNode.insertBefore(scoreDisplay, endButtons);

  // 🔶 Bouton “Niveau 4” si réussite
  if (percent >= 90 && !document.querySelector(".gold-button")) {
    const goldButton = document.createElement("button");
    goldButton.textContent = "Niveau 4";
    goldButton.className = "button gold-button";
    goldButton.onclick = () => {
      window.location.href = "violoncelle_niveau4.html";
    };
    endButtons.insertBefore(goldButton, endButtons.firstChild);
  }

  document.getElementById("send-score").style.display = "block";
}

  
let scoreEnvoye = false;
function envoyerScore() {
  if (typeof scoreEnvoye !== "undefined" && scoreEnvoye) return;

  const prenom = document.getElementById("prenom").value.trim();
  const nom = document.getElementById("nom").value.trim();
  const profFm = (document.getElementById("prof_fm")?.value || "").trim();
  const profInstr = (document.getElementById("prof_instrument")?.value || "").trim();

  const pourcentage = Math.round((score / totalQuestions) * 100);
  const scoreAffiche = `${pourcentage}%`;

  const confirmation = document.getElementById("confirmation");
  const bouton = document.querySelector("#send-score button");
  const loadingMessage = document.getElementById("loading-message");

  const fmOk = profFm && profFm !== "Aucun";
  const instrOk = profInstr && profInstr !== "Aucun";

  if (!prenom || !nom || (!fmOk && !instrOk)) {
    confirmation.style.color = "red";
    confirmation.textContent = "Merci de renseigner Prénom, Nom, et au moins un professeur (FM ou instrument).";
    return;
  }

  if (!window.LDN_ENDPOINT || window.LDN_ENDPOINT === "PASTE_YOUR_EXEC_URL_HERE") {
    confirmation.style.color = "red";
    confirmation.textContent = "URL d’envoi non configurée (LDN_ENDPOINT).";
    return;
  }

  loadingMessage.style.display = "block";
  confirmation.textContent = "";

  // Type = nom de la page sans extension (ex: violon_niveau1)
  const type = (location.pathname.split("/").pop() || "").replace(".html", "") || "inconnu";

  const data = new URLSearchParams();
  data.append("prenom", prenom);
  data.append("nom", nom);
  data.append("exercice", "Lecture de notes");
  data.append("type", type);
  data.append("score", scoreAffiche);

  // routing uniquement
  data.append("prof_fm", fmOk ? profFm : "Aucun");
  data.append("prof_instrument", instrOk ? profInstr : "Aucun");

    // Envoi (mode no-cors : Apps Script ne renvoie pas les en-têtes CORS)
  if (!window.LDN_ENDPOINT || window.LDN_ENDPOINT.includes("PASTE_YOUR_EXEC_URL_HERE")) {
    loadingMessage.style.display = "none";
    confirmation.style.color = "red";
    confirmation.textContent = "❌ URL d'envoi non configurée (config.js).";
    return;
  }

  fetch(window.LDN_ENDPOINT, {
    method: "POST",
    mode: "no-cors",
    body: data
  })
    .then(() => {
      loadingMessage.style.display = "none";

      if (typeof scoreEnvoye !== "undefined") scoreEnvoye = true;
      confirmation.style.color = "green";
      confirmation.textContent = "✅ Score envoyé avec succès !";

      if (bouton) {
        bouton.disabled = true;
        bouton.textContent = "Score déjà envoyé";
        bouton.style.backgroundColor = "#ccc";
        bouton.style.color = "#666";
        bouton.style.border = "1px solid #999";
        bouton.style.cursor = "not-allowed";
      }
    })
    .catch(() => {
      loadingMessage.style.display = "none";
      confirmation.style.color = "red";
      confirmation.textContent = "❌ Une erreur est survenue pendant l'envoi.";
    });
}


const keyMap = { 'c':'Do','d':'Ré','e':'Mi','f':'Fa','g':'Sol','a':'La','b':'Si' };
document.addEventListener('keydown', (ev) => {
  const tag = (ev.target && ev.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'select' || tag === 'textarea') return;

  const note = keyMap[ev.key?.toLowerCase()];
  if (!note) return;

  const btn = [...document.querySelectorAll('#game-container button')]
    .find(b => b.textContent.trim().toLowerCase() === note.toLowerCase());
  if (btn && !btn.disabled) btn.click();
});
