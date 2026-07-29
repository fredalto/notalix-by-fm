/* ===== URL Apps Script (comme dans ton ZIP) ===== */
var APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzY_NRau0v-nltjlhA8e0U5JysyTpqdK8StMIgDXmxWwnQk8Y_iXc4EAHWoEn_3LZT8aw/exec";

/* ===== RÈGLES DÉFI ===== */
var LEVELS = {
  1: { time: 60, maxLives: 3, target: 10, hintRepere: true },
  2: { time: 60, maxLives: 3, target: 10, hintRepere: true },
  3: { time: 50, maxLives: 3, target: 10, hintRepere: true },
  4: { time: 45, maxLives: 3, target: 20, hintRepere: true },
  5: { time: 40, maxLives: 3, target: 20, hintRepere: false }
};

/* ===== DONNÉES (pile comme UT4_niveau5.js) ===== */
var RANGE = [
    "B2", 
    "C3", "D3", "E3", "F3", "G3", "A3", "B3",
    "C4", "D4", "E4", "F4", "G4", "A4"
];
// Repères d’intro
var REPERES = { "C4":1, "F4":1, "D3":1, "G3":1 };

// Mappings
var LETTER2NAME = { C:"Do", D:"Ré", E:"Mi", F:"Fa", G:"Sol", A:"La", B:"Si" };

/* ===== ÉTAT ===== */
var level=1, lives=LEVELS[1].maxLives, timeLeft=LEVELS[1].time;
var correct=0, totalAsked=0, streak=0, streakMax=0, score=0;
var totalTarget=0, totalCorrect=0;
var timerId=null, currentCode=null, lastImg="";
var gameActive = false;   // ← nouveau : jeu en cours ?
var canAnswer = false; // autorise ou non les réponses pour le niveau en cours

var elLevelTitle = document.getElementById('level-title');
var elLevelSteps = document.getElementById('level-steps');
var elTimeXXL    = document.getElementById('time-xxl');
var elTimeBar    = document.getElementById('timebar-fill');
var elLivesHUD   = document.getElementById('lives-hearts');

/* ===== DOM ===== */
var startButton   = document.getElementById("start-quiz");
var quizSection   = document.getElementById("quiz-section");
var noteImage     = document.getElementById("note-image");
var gameContainer = document.getElementById("game-container");
var feedback      = document.getElementById("feedback");
var progressBar   = document.getElementById("progress-bar");
var scoreDisplay  = document.getElementById("score-display");
var endButtons    = document.getElementById("end-buttons");
var sendScore     = document.getElementById("send-score");

/* ===== AUDIO ===== */
function playNoteIfExists(code){
  try {
    var a = new Audio("sounds/" + code + ".mp3");
    a.play()["catch"](function(){});
  } catch(e){}
}
function playDuck(){
  try {
    var a = new Audio("sounds/duck.mp3");
    a.play()["catch"](function(){});
  } catch(e){}
}

/* ===== UTILS ===== */
function idxOf(a,v){ for(var i=0;i<a.length;i++){ if(a[i]===v) return i; } return -1; }
function neighbors(code){
  var i = idxOf(RANGE, code), out=[];
  if (i>0) out.push(RANGE[i-1]);
  if (i<RANGE.length-1) out.push(RANGE[i+1]);
  return out;
}
function thirds(code){
  var i = idxOf(RANGE, code), out=[];
  if (i-2>=0) out.push(RANGE[i-2]);
  if (i+2<RANGE.length) out.push(RANGE[i+2]);
  return out;
}
function uniq(arr){ var m={},o=[],i; for(i=0;i<arr.length;i++){ if(!m[arr[i]]){ m[arr[i]]=1; o.push(arr[i]); } } return o; }

/* ===== POOLS ===== */
function poolN1(){
  var out=[], i;
  for(i=0;i<RANGE.length;i++) if(REPERES[RANGE[i]]) out.push(RANGE[i]);
  return out;
}
function poolN2(){
  var base=poolN1(), c=[], i,j,ns;
  for(i=0;i<base.length;i++){
    c.push(base[i]);
    ns = neighbors(base[i]);
    for(j=0;j<ns.length;j++) c.push(ns[j]);
  }
  return uniq(c);
}
function poolN3(){
  var base=poolN2(), c=base.slice(0), i,j,th,rep=poolN1();
  for(i=0;i<rep.length;i++){
    th = thirds(rep[i]);
    for(j=0;j<th.length;j++) if(idxOf(c, th[j])<0) c.push(th[j]);
  }
  return c;
}
function poolN4(){ return RANGE.slice(0); }
function poolN5(){ return RANGE.slice(0); }
function poolFor(n){ if(n===1)return poolN1(); if(n===2)return poolN2(); if(n===3)return poolN3(); if(n===4)return poolN4(); return poolN5(); }

/* ===== UI ===== */
function hearts(max, val){
  var s="", i; for(i=0;i<val;i++) s+="❤️"; for(i=0;i<max-val;i++) s+="♡"; return s;
}
function setFeedback(text, ok){
  feedback.className = feedback.className.replace(/\bcorrect\b|\bincorrect\b/g,'').trim();
  if(text){ feedback.textContent=text; feedback.className += ok?' correct':' incorrect'; }
  else { feedback.textContent=''; }
}
function updateHUD(){
  var cfg = LEVELS[level], t = cfg.target;
  // titre dynamique
  elLevelTitle.innerHTML = 'Défi Ut4 — Niveau <b>N'+level+'</b> (Objectif '+t+')';
  // stepper
  renderSteps(level);
  // chrono + barre + coeurs
  renderTimer(timeLeft, cfg.time);
  renderLivesHUD();

  // ton affichage existant (on le garde, mais plus concis)
  var serie = (streak > 1) ? ' • Série 🔥 x' + streak : '';
  scoreDisplay.innerHTML =
    'Score niveau <b>'+correct+'</b> / '+t + serie;
  progressBar.style.width = Math.min(100,(correct/t)*100) + '%';
}

/* ===== QUESTIONS (avec TES images) ===== */
function pick(pool){
  var cand, tries=0, path;
  do {
    cand = pool[Math.floor(Math.random()*pool.length)];
    path = "Images/ut4/" + cand + ".png";
    tries++;
  } while (path === lastImg && tries < 50);
  lastImg = path;
  return cand;
}
function showQuestion(){
  var pool = poolFor(level);
  currentCode = pick(pool);

  // encadrement des repères si actif
  var isRep = LEVELS[level].hintRepere && !!REPERES[currentCode];
  noteImage.className = isRep ? "repere" : "";

  // affiche l'image
  noteImage.onerror = function(){
    // si un fichier manque, on essaie une autre note du même pool
    showQuestion();
  };
  noteImage.src = "Images/ut4/" + currentCode + ".png";
}

/* ===== TIMER ===== */
function startTimer(){
  if (timerId) clearInterval(timerId);
  timerId = setInterval(function(){
    timeLeft--;
    if (timeLeft <= 0) { failLevel("Temps écoulé"); return; }
    updateHUD();
  }, 1000);
}

/* ===== NIVEAUX ===== */
function startLevel(n){
  level = n;
  var cfg = LEVELS[level];
  timeLeft = cfg.time;
  lives = (level===1) ? cfg.maxLives : Math.min(lives, cfg.maxLives);
  correct = 0;
  canAnswer = true;
  setFeedback("", true);
  updateHUD();

  totalTarget += cfg.target;
  showQuestion();
  startTimer();
}
function levelCleared(){
  if (timerId) clearInterval(timerId);
  var target = LEVELS[level].target;
  totalCorrect += Math.min(correct, target); // ne dépasse jamais l’objectif du niveau


  // +1 vie, bornée au max du niveau suivant (si existe)
  var next=level+1, cap = LEVELS[next] ? LEVELS[next].maxLives : LEVELS[level].maxLives;
  lives = Math.min(lives+1, cap);
  popHearts();
renderLivesHUD();


  setFeedback("🎉 Niveau N"+level+" réussi !", true);
  setTimeout(function(){
    if (level >= 5) endChallenge(true);
    else startLevel(level+1);
  }, 900);
}
function failLevel(reason){
  canAnswer = false;
  if (timerId) clearInterval(timerId);
  var target = LEVELS[level].target;
totalCorrect += Math.min(correct, target); // ne dépasse jamais l’objectif du niveau

  endChallenge(false, reason);
}

/* ===== DÉFI — DÉMARRAGE/FIN ===== */
function startDefi(){
  startButton.style.display = "none";
  document.getElementById("note-reference").style.display = "none";
  quizSection.style.display = "block";

  level=1; lives=LEVELS[1].maxLives; timeLeft=LEVELS[1].time;
  correct=0; totalAsked=0; streak=0; streakMax=0; score=0;
  totalTarget=0; totalCorrect=0; currentCode=null; lastImg="";
gameActive = true;

  startLevel(1);
}
function endChallenge(success, reason){
gameActive = false;
canAnswer = false;

  gameActive = false;
  quizSection.style.display = "none";
  endButtons.style.display = "block";
  sendScore.style.display = "block";

  // --- calcul propre ---
var pct = totalTarget ? Math.round(Math.min(1, totalCorrect / totalTarget) * 100) : 0;
var note20 = Math.round((pct / 100) * 20);

var titre = success
  ? "Défi terminé !"
  : ("Défi interrompu (N" + level + " — " + (reason || "échec") + ")");

// --- rendu UI ---
var recap = document.createElement('div');
recap.style.fontSize = "20px";
recap.style.marginBottom = "10px";
recap.innerHTML =
  '<div style="font-size:32px; font-weight:800; margin-bottom:6px;">' +
    'Score ⭐ <b>' + Math.round(score) + '</b>' +
  '</div>' +
  '<div>Réussite : <b>' + totalCorrect + '</b> / ' + totalTarget + ' (' + pct + '%)</div>' +
  '<div>Note : <b>' + note20 + ' / 20</b></div>' +
  '<div>Meilleure série de bonnes réponses 🔥 : <b>' + streakMax + '</b></div>' +
  '<div style="margin-top:6px; color:#555;"><i>' + titre + '</i></div>';

endButtons.insertBefore(recap, endButtons.firstChild);

// stock pour l’envoi (on garde les mêmes champs utilisés plus bas)
window.__defiFinal = {
  pourcentage: pct,
  score20: note20,
  scoreArcade: Math.round(score)
};

// (optionnel) désactiver les boutons de réponse à l'écran final
var btns = gameContainer.querySelectorAll('button');
for (var i=0;i<btns.length;i++){ btns[i].disabled = true; }
} 



/* ===== RÉPONSES ===== */
var reponses = ["Do","Ré","Mi","Fa","Sol","La","Si"];
function renderButtons(){
  gameContainer.innerHTML = "";
  for (var i=0;i<reponses.length;i++){
    (function(nom){
      var btn = document.createElement("button");
      btn.className = "button";
      btn.appendChild(document.createTextNode(nom));
      btn.addEventListener("click", function(){ onAnswer(nom); });
      gameContainer.appendChild(btn);
    })(reponses[i]);
  }
}
renderButtons();

function formatTime(sec){
  var m = Math.floor(sec/60), s = sec%60;
  return (m<10?'0':'')+m+':'+(s<10?'0':'')+s;
}

function renderSteps(current){
  var total = 5, html='', i;
  for(i=1;i<=total;i++){
    var cls = 'step' + (i<current?' filled': (i===current?' current':'' ));
    html += '<span class="'+cls+'"></span>';
  }
  elLevelSteps.innerHTML = html;
}

function renderTimer(timeLeft, timeAlloc){
  elTimeXXL.textContent = formatTime(timeLeft);
  // pulse sous 10s
  if(timeLeft<=10){ if(elTimeXXL.className.indexOf('pulse')===-1){ elTimeXXL.className += ' pulse'; } }
  else{ elTimeXXL.className = elTimeXXL.className.replace(/\bpulse\b/g,'').trim(); }

  // barre
  var pct = Math.max(0, Math.min(100, (timeLeft/timeAlloc)*100));
  elTimeBar.style.width = pct + '%';
  // couleurs seuils
  var cls = elTimeBar.className.replace(/\bwarn\b|\bdanger\b/g,'').trim();
  if(timeLeft<=5) cls += (cls?' ':'') + 'danger';
  else if(timeLeft<=15) cls += (cls?' ':'') + 'warn';
  elTimeBar.className = cls;
}

function renderLivesHUD(){
  var max = LEVELS[level].maxLives, s='', i;
  for(i=0;i<lives;i++) s+='❤️';
  for(i=0;i<Math.max(0,max-lives);i++) s+='♡';
  elLivesHUD.textContent = s;
}

// petite anim “pop” quand on gagne une vie
function popHearts(){
  elLivesHUD.className = elLivesHUD.className.replace(/\bpop\b/g,'').trim();
  // force reflow
  void elLivesHUD.offsetWidth;
  elLivesHUD.className += (elLivesHUD.className?' ':'')+'pop';
}

function handleKey(ev){
  if (!gameActive || !canAnswer) return;  // ← ajoute canAnswer ici

  var t = (ev.target && ev.target.tagName || '').toLowerCase();
  if (t==='input' || t==='select' || t==='textarea') return;

  var k = ev.key ? ev.key.toLowerCase() : '';
  var map = {c:'Do', d:'Ré', e:'Mi', f:'Fa', g:'Sol', a:'La', b:'Si'};
  var nom = map[k];
  if (!nom) return;

  var btns = gameContainer.querySelectorAll('button');
  for (var i=0;i<btns.length;i++){
    if (btns[i].textContent === nom){ btns[i].click(); break; }
  }
}

document.addEventListener('keydown', handleKey);


function onAnswer(nom){
  if (!gameActive || !canAnswer || !currentCode) return;

  var expected = LETTER2NAME[currentCode.charAt(0)];
  totalAsked++;

  if (nom === expected){
    correct++;
    streak++;
    if (streak > streakMax) streakMax = streak;

    // score arcade avec bonus de série (+10% tous les 5)
    var bonus = 1 + Math.floor(streak / 5) * 0.1;
    score += bonus;

   setFeedback("✅ Correct !", true);
playNoteIfExists(currentCode);

// ➜ MAJ immédiate du HUD pour voir la barre passer à 100%
updateHUD();

if (correct >= LEVELS[level].target){
  canAnswer = false;          
  // (sécurité visuelle) force la barre à 100%
  progressBar.style.width = '100%';
  levelCleared();
  return;
}

showQuestion();

  } else {
    lives--; streak=0;
    setFeedback("❌ Mauvaise réponse (attendu : "+expected+")", false);
    playDuck();
    if (lives <= 0){ failLevel("Plus de vies"); return; }
    showQuestion();
  }
  updateHUD();
}

/* ===== ENVOI SCORE (comme tes niveaux) ===== */
var scoreEnvoye = false;
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


/* ===== GO ===== */
startButton.addEventListener("click", startDefi);

