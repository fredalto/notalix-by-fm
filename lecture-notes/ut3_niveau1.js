const notes = [
  { nom: "Do", image: "Images/ut3/C4.png" },
  { nom: "Sol", image: "Images/ut3/G4.png" },
  { nom: "Do", image: "Images/ut3/C3.png" },
  { nom: "Fa", image: "Images/ut3/F3.png" }
];

const labels = ["Do", "Fa", "Sol"];
let score = 0;
let totalQuestions = 10;
let currentQuestion = 0;
let currentCorrectAnswer = "";
let quizNotes = []; // Ce tableau contiendra les 10 notes du quiz
let lastNoteImage = "";
let isWaiting = false;

const startButton = document.getElementById("start-quiz");
const quizSection = document.getElementById("quiz-section");
const noteImage = document.getElementById("note-image");
const gameContainer = document.getElementById("game-container");
const feedback = document.getElementById("feedback");
const progressBar = document.getElementById("progress-bar");
const scoreDisplay = document.getElementById("score-display");
const endButtons = document.getElementById("end-buttons");

startButton.addEventListener("click", startQuiz);

function startQuiz() {
  startButton.style.display = "none";
  document.getElementById("note-reference").style.display = "none";
  quizSection.style.display = "block";
  score = 0;
  currentQuestion = 0;
  lastNoteImage = "";
  isWaiting = false;
    // Préparer les 10 notes : chaque note repère 2 fois + 2 aléatoires
  quizNotes = [];

  // Ajouter chaque note repère 2 fois
  notes.forEach(note => {
    quizNotes.push(note);
    quizNotes.push(note);
  });

  // Ajouter 2 notes aléatoires parmi les 4
  for (let i = 0; i < 2; i++) {
    const randomNote = notes[Math.floor(Math.random() * notes.length)];
    quizNotes.push(randomNote);
  }

  // Mélanger les 10 notes
function shuffleNoRepeats(array) {
  let shuffled;
  let attempt = 0;
  do {
    shuffled = array.slice().sort(() => Math.random() - 0.5);
    attempt++;
  } while (hasConsecutiveDuplicates(shuffled) && attempt < 100);
  return shuffled;
}

function hasConsecutiveDuplicates(array) {
  for (let i = 1; i < array.length; i++) {
    if (array[i].image === array[i - 1].image) return true;
  }
  return false;
}

quizNotes = shuffleNoRepeats(quizNotes);


  loadNextQuestion();
}

function loadNextQuestion() {
  if (currentQuestion >= totalQuestions) {
    showFinalScore();
    return;
  }

let currentNote = quizNotes[currentQuestion];



  currentCorrectAnswer = currentNote.nom;

  noteImage.src = currentNote.image;
  noteImage.alt = currentNote.nom;

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

function playSound(filename) {
  const audio = new Audio(`sounds/${filename}`);
  audio.play();
}

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

  setTimeout(() => {
    isWaiting = false;
    loadNextQuestion();
  }, 1000);
}

function updateProgress() {
  const percent = (currentQuestion / totalQuestions) * 100;
  progressBar.style.width = percent + "%";
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
        🎉 Félicitations ! Tu maîtrises les notes comme un chef d’orchestre ! 🥳
      </div>
      <div style="font-size: 18px; color: #333; margin-bottom: 20px;">
        🚀 Tu es prêt·e à passer au niveau suivant !
      </div>
    `;
  } else {
    html += `
      <div style="font-size: 18px; color: #333; margin-bottom: 20px;">
        🔁 Recommence le niveau pour renforcer ta rapidité et ta précision !
      </div>
    `;
  }

  scoreDisplay.innerHTML = html;
  scoreDisplay.style.display = "block";
  endButtons.parentNode.insertBefore(scoreDisplay, endButtons);

  if (percent >= 90 && !document.querySelector(".gold-button")) {
    const goldButton = document.createElement("button");
    goldButton.textContent = "Niveau 2";
    goldButton.className = "button gold-button";
    goldButton.onclick = () => {
      window.location.href = "ut3_niveau2.html";
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


