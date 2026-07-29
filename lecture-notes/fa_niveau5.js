

const noteToNom = {
"C2": "Do", "D2": "Ré", "E2": "Mi", "F2": "Fa", "G2": "Sol", "A2": "La", "B2": "Si",
"C3": "Do", "D3": "Ré", "E3": "Mi", "F3": "Fa", "G3": "Sol", "A3": "La", "B3": "Si",
"C4": "Do", "D4": "Ré", "E4": "Mi"
};

const reponses = ["Do", "Ré", "Mi", "Fa", "Sol", "La", "Si"];

let score = 0, total = 20, current = 0, quizNotes = [], correct = "", scoreEnvoye = false;


const startBtn = document.getElementById("start-quiz");
const quiz = document.getElementById("quiz-section");
const noteImg = document.getElementById("note-image");
const container = document.getElementById("game-container");
const feedback = document.getElementById("feedback");
const progressBar = document.getElementById("progress-bar");
const scoreDisplay = document.getElementById("score-display");
const finalMessage = document.getElementById("final-message");
const endButtons = document.getElementById("end-buttons");

startBtn.onclick = () => {
  const intro = document.getElementById("note-reference");
  if (intro) intro.classList.add("hidden");
  startBtn.classList.add("hidden");
  quiz.classList.remove("hidden");
  score = 0;
  current = 0;
  quizNotes = generateSequence();
  nextNote();
};

function generateSequence() {
  const toutesLesNotes = [
"C2", "D2", "E2", "F2", "G2", "A2", "B2",
"C3", "D3", "E3", "F3", "G3", "A3", "B3",
"C4", "D4", "E4"
  ];

  const repereObligatoires = ["F3", "C4", "E2", "B2"];
  const notesUtilisees = {};
  const sequence = [];

  // D'abord on tire 16 notes aléatoires (hors repères)
  const autresNotes = toutesLesNotes.filter(n => !repereObligatoires.includes(n));
  while (sequence.length < 16) {
    const dernierCode = sequence[sequence.length - 1]?.code;

    const candidates = autresNotes.filter(n => {
      return (notesUtilisees[n] || 0) < 2 && n !== dernierCode;
    });

    if (candidates.length === 0) break;

    const note = candidates[Math.floor(Math.random() * candidates.length)];
    sequence.push({
      code: note,
      nom: noteToNom[note],
      img: note + ".png"
    });
    notesUtilisees[note] = (notesUtilisees[note] || 0) + 1;
  }

  // On ajoute les 4 repères (une fois chacun)
  repereObligatoires.forEach(code => {
    sequence.push({
      code,
      nom: noteToNom[code],
      img: code + ".png"
    });
  });

  // Mélanger le tout
  for (let i = sequence.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
  }

  // Éviter deux notes identiques consécutives
  for (let i = 1; i < sequence.length; i++) {
    if (sequence[i].code === sequence[i - 1].code) {
      // Chercher une position non consécutive pour swap
      for (let j = i + 1; j < sequence.length; j++) {
        if (sequence[j].code !== sequence[i - 1].code) {
          [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
          break;
        }
      }
    }
  }

  return sequence;
}



function nextNote() {
  if (current >= total) {
    finishQuiz();
    return;
  }

  const note = quizNotes[current];
  correct = note.nom;
  noteImg.src = "Images/fa/" + note.img;
  container.innerHTML = "";
  enableButtons();
  feedback.textContent = "";

  reponses.forEach(r => {
    const btn = document.createElement("button");
    btn.textContent = r;
    btn.className = "button";
    btn.onclick = () => check(r);
    container.appendChild(btn);
  });

  scoreDisplay.textContent = `Score : ${score} / ${total}`;
  progressBar.style.width = (current / total * 100) + "%";
}

function check(resp) {
  disableButtons();
  if (resp === correct) {
    score++;
    feedback.textContent = "Bonne réponse !";
    feedback.className = "correct";
    playSound(quizNotes[current].code + ".mp3");
  } else {
    feedback.textContent = `Incorrect ! C'était "${correct}"`;
    feedback.className = "incorrect";
    playSound("duck.mp3");
  }

  current++;
  setTimeout(() => {
    nextNote();
  }, 800);
}

function playSound(file) {
  const audio = new Audio("sounds/" + file);
  audio.play();
}

function resetSendScoreForm() {
  const prenom = document.getElementById("prenom");
  const nom = document.getElementById("nom");
  const prof = document.getElementById("prof");
  const confirmation = document.getElementById("confirmation");
  const loadingMessage = document.getElementById("loading-message");

  if (prenom) prenom.value = "";
  if (nom) nom.value = "";
  if (prof) prof.value = ""; // revient sur "Choisir un professeur"

  if (confirmation) {
    confirmation.textContent = "";
    confirmation.style.color = "";
  }

  if (loadingMessage) loadingMessage.classList.add("hidden");

  scoreEnvoye = false; // on réactive la possibilité d'envoyer
}

// Vider les champs quand la page (re)devient visible après un reload/navigation
window.addEventListener('pageshow', () => {
  resetSendScoreForm();
});

function finishQuiz() {
  // 1) Laisser visible la section quiz
  quiz.classList.remove("hidden");

  // 2) Cacher les éléments de jeu
  const noteDisplay = document.getElementById("note-display");
  const game = document.getElementById("game-container");
  const fb = document.getElementById("feedback");
  const prog = document.getElementById("progress-container");

  if (noteDisplay) noteDisplay.classList.add("hidden");
  if (game)        game.classList.add("hidden");
  if (fb)          fb.classList.add("hidden");
  if (prog)        prog.classList.add("hidden");

  // 3) Afficher le score
  scoreDisplay.classList.remove("hidden");
  const pct = Math.round((score / total) * 100);
  const btnN1 = document.getElementById("niveau-1");
  const btnN3 = document.getElementById("niveau-suivant");

 // -- Visibilité du bouton "Niveau 4" : visible seulement si pct < 25 %
if (btnN1) {
  btnN1.classList.add("hidden"); // Réinitialise
  if (pct < 25) {
    btnN1.textContent = "Niveau 4";
    btnN1.classList.remove("hidden");
  }
}

  // -- Visibilité du bouton "Défis" : visible seulement si pct ≥ 75 %
if (btnN3) {
  btnN3.classList.add("hidden");
  if (pct >= 75) {
    btnN3.textContent = "Défis";
    btnN3.classList.remove("hidden");
  }
}


  scoreDisplay.innerHTML = `
    <div style="font-size: 48px; font-weight: bold; margin-bottom: 10px;">
      🎯 ${score} / ${total}
    </div>
    <div style="font-size: 36px; color: #333;">
      ✅ ${pct} %
    </div>
  `;

  // 4) Message final
if (pct >= 75) {
  finalMessage.innerHTML = `
    <div style="color: green; font-size: 20px; margin-bottom: 10px;">
      🎉 Fantastique ! Tes yeux de lynx ont dompté la clé de sol ! 😎
    </div>
    <div style="font-size: 18px; color: #333; margin-bottom: 20px;">
      🚀 Tu es prêt·e à relever les défis ultimes !
    </div>`;
} else if (pct < 25) {
  finalMessage.innerHTML = `
    <div style="color: #f44336; font-size: 20px; margin-bottom: 10px;">
      🧱 Ce n’est pas grave ! Reprends les bases au niveau 4 pour mieux réussir. 💪
    </div>`;
} else if (pct < 50) {
  finalMessage.innerHTML = `
    <div style="font-size: 18px; color: #555; margin-bottom: 20px;">
      🌱 Tu progresses ! Recommence en prenant ton temps, tu vas y arriver. 🙂
    </div>`;
} else {
  finalMessage.innerHTML = `
    <div style="font-size: 18px; color: #333; margin-bottom: 20px;">
      💡 Pas mal ! Mais tu peux viser plus haut.
    </div>`;
}


  // 5) Afficher les boutons de fin et l’envoi du score
  endButtons.classList.remove("hidden");
  resetSendScoreForm();
  document.getElementById("send-score").classList.remove("hidden");

    // 6) Assurer l’état initial du bloc d’envoi
  const loadingMessage = document.getElementById("loading-message");
  const confirmation = document.getElementById("confirmation");
  if (loadingMessage) loadingMessage.classList.add("hidden"); // toujours caché à l’arrivée
  if (confirmation) confirmation.textContent = "";  
}



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


function disableButtons() {
  document.querySelectorAll('#game-container button').forEach(btn => btn.disabled = true);
}

function enableButtons() {
  document.querySelectorAll('#game-container button').forEach(btn => btn.disabled = false);
}

(function() {
  try {
    var btn = document.getElementById('btn-envoyer-score');
    if (btn && typeof envoyerScore === 'function') {
      btn.addEventListener('click', envoyerScore, { once: false });
    }
  } catch (e) {
    console.warn('Bind envoyerScore error:', e);
  }
})();

// === Preload images & sounds ===
(function preloadAssets() {
  // Images
  const images = [
"C2.png", "D2.png", "E2.png", "F2.png", "G2.png", "A2.png", "B2.png",
"C3.png", "D3.png", "E3.png", "F3.png", "G3.png", "A3.png", "B3.png",
"C4.png", "D4.png", "E4.png"
  ].map(n => "Images/fa/" + n);



  images.forEach(src => { const img = new Image(); img.src = src; });

  // Sons
  const sons = [
    "duck.mp3",
"C2.mp3", "D2.mp3", "E2.mp3", "F2.mp3", "G2.mp3", "A2.mp3", "B2.mp3",
"C3.mp3", "D3.mp3", "E3.mp3", "F3.mp3", "G3.mp3", "A3.mp3", "B3.mp3",
"C4.mp3", "D4.mp3", "E4.mp3"
  ].map(n => "sounds/" + n);

  sons.forEach(src => { const a = new Audio(); a.preload = "auto"; a.src = src; });
})();

function playSound(file) {
  const audio = new Audio("sounds/" + file);
  const p = audio.play();
  if (p && typeof p.catch === 'function') {
    p.catch(() => { /* on ignore si l’autoplay est bloqué */ });
  }
}

// === Keyboard shortcuts ===

const keyMap = {
  'c': 'Do', 'd': 'Ré', 'e': 'Mi', 'f': 'Fa', 'g': 'Sol', 'a': 'La', 'b': 'Si'
};

document.addEventListener('keydown', (ev) => {
  // ignorer si on tape dans un input/select
  const tag = (ev.target && ev.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'select' || tag === 'textarea') return;

  const note = keyMap[ev.key?.toLowerCase()];
  if (!note) return;

  // Clique “virtuellement” le bouton correspondant si visible
  const btn = [...document.querySelectorAll('#game-container button')]
    .find(b => b.textContent.trim().toLowerCase() === note.toLowerCase());
  if (btn && !btn.disabled) btn.click();
});

