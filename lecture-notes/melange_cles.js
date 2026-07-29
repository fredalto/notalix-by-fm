/* ===== URL Apps Script (même que tes autres écrans) ===== */
var APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzY_NRau0v-nltjlhA8e0U5JysyTpqdK8StMIgDXmxWwnQk8Y_iXc4EAHWoEn_3LZT8aw/exec";

/* ===== RANGES & REPÈRES (reprend exactement tes définitions) ===== */
var SOL_RANGE = ["F3","G3","A3","B3","C4","D4","E4","F4","G4","A4","B4","C5","D5","E5","F5","G5","A5","B5","C6","D6","E6"];
var SOL_REPERES = { "G4":1, "C4":1, "C5":1, "A5":1 };

var FA_RANGE = ["C2","D2","E2","F2","G2","A2","B2","C3","D3","E3","F3","G3","A3","B3","C4","D4","E4"];
var FA_REPERES = { "F3":1, "C4":1, "E2":1, "B2":1 };

var UT3_RANGE = ["A2","B2","C3","D3","E3","F3","G3","A3","B3","C4","D4","E4","F4","G4","A4","B4"];
var UT3_REPERES = { "C4":1, "G4":1, "C3":1, "F3":1 };

var UT4_RANGE = ["B2","C3","D3","E3","F3","G3","A3","B3","C4","D4","E4","F4","G4","A4"];
var UT4_REPERES = { "C4":1, "F4":1, "D3":1, "G3":1 };

var DIRS = { sol:"Images/sol", fa:"Images/fa", ut3:"Images/ut3", ut4:"Images/ut4" };

/* ===== MAPPINGS ===== */
var LETTER2NAME = { C:"Do", D:"Ré", E:"Mi", F:"Fa", G:"Sol", A:"La", B:"Si" };
var NAMES = ["Do","Ré","Mi","Fa","Sol","La","Si"];

/* ===== ÉTAT ===== */
var running=false, qIndex=0, qTotal=0, good=0, bad=0;
var currentCode="", currentClef="", lastImg="";

/* ===== DOM ===== */
var startBtn = document.getElementById("start-quiz");
var resetBtn = document.getElementById("reset-quiz");
var quizSection = document.getElementById("quiz-section");
var noteImage = document.getElementById("note-image");
var gameContainer = document.getElementById("game-container");
var feedback = document.getElementById("feedback");
var progressBar = document.getElementById("progress-bar");
var scoreDisplay = document.getElementById("score-display");

/* ===== AUDIO (facultatif, si tu as /sounds) ===== */
function playNoteIfExists(code){
  try{ new Audio("sounds/"+code+".mp3").play().catch(function(){}); }catch(e){}
}
function playDuck(){
  try{ new Audio("sounds/duck.mp3").play().catch(function(){}); }catch(e){}
}

/* ===== UI ===== */
function updateHUD(){
  scoreDisplay.innerHTML = "Score : <b>"+good+"</b> / "+qIndex;
  var pct = qTotal ? Math.floor(100 * (qIndex/qTotal)) : 0;
  progressBar.style.width = (qTotal ? pct : 0) + "%";
}
function setFeedback(msg, ok){
  feedback.className = feedback.className.replace(/\bcorrect\b|\bincorrect\b/g,'').trim();
  if(!msg){ feedback.textContent=""; return; }
  feedback.textContent = msg;
  feedback.className += ok ? " correct" : " incorrect";
}

/* ===== OUTILS ===== */
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function poolFrom(range, reperes){
  // on prend toute l’étendue (tu peux limiter si tu préfères repères+voisins)
  return range.slice();
}

/* ===== RENDU BOUTONS ===== */
(function renderButtons(){
  gameContainer.innerHTML = "";
  NAMES.forEach(function(nom){
    var b=document.createElement("button");
    b.className="button";
    b.textContent=nom;
    b.onclick=function(){ onAnswer(nom); };
    gameContainer.appendChild(b);
  });
})();

/* ===== GÉNÉRATION QUESTION ===== */
function getSelectedKeys(){
  var boxes = document.querySelectorAll('.clef:checked');
  var keys = [];
  for (var i=0;i<boxes.length;i++) keys.push(boxes[i].value);
  if (keys.length===0) keys = ["sol","fa"]; // valeur sûre
  return keys;
}

function showQuestion(){
  var sel = getSelectedKeys();
  currentClef = pick(sel); // tirage équilibré parmi la sélection
  var cfg =
    currentClef==="sol" ? {dir:DIRS.sol, RANGE:SOL_RANGE, REPERES:SOL_REPERES} :
    currentClef==="fa"  ? {dir:DIRS.fa,  RANGE:FA_RANGE,  REPERES:FA_REPERES } :
    currentClef==="ut3" ? {dir:DIRS.ut3, RANGE:UT3_RANGE, REPERES:UT3_REPERES} :
                          {dir:DIRS.ut4, RANGE:UT4_RANGE, REPERES:UT4_REPERES};

  var pool = poolFrom(cfg.RANGE, cfg.REPERES);
  currentCode = pick(pool);

  var src = cfg.dir + "/" + currentCode + ".png";
  if(src===lastImg){ return showQuestion(); } // évite doublon strict
  lastImg = src;

  noteImage.onerror = function(){ showQuestion(); };
  noteImage.src = src;
  setFeedback("", true);
}

/* ===== RÉPONSES ===== */
function onAnswer(nom){
  if(!running || !currentCode) return;
  qIndex++;
  var expected = LETTER2NAME[currentCode[0]];

  if(nom===expected){
    good++; playNoteIfExists(currentCode);
    setFeedback("✅ Correct", true);
  }else{
    bad++; playDuck();
    setFeedback("❌ Attendu : "+expected, false);
  }

  updateHUD();

  if(qIndex >= qTotal){
    // fin de session
    running=false;
    startBtn.disabled=false; resetBtn.disabled=false;
    document.getElementById("send-score").style.display="block";
    return;
  }
  setTimeout(showQuestion, 250);
}

/* ===== CONTRÔLES ===== */
startBtn.onclick=function(){
  if(running) return;
  qTotal = Math.max(1, Math.min(200, parseInt(document.getElementById("nbQuestions").value,10) || 20));
  running=true; qIndex=0; good=0; bad=0; lastImg="";
  quizSection.style.display="block";
  startBtn.disabled=true; resetBtn.disabled=false;
  updateHUD(); showQuestion();
};

resetBtn.onclick=function(){
  running=false; qIndex=0; good=0; bad=0; lastImg="";
  quizSection.style.display="none";
  startBtn.disabled=false; resetBtn.disabled=true;
  updateHUD(); setFeedback("", true); noteImage.src="";
};

/* ===== ENVOI SCORE (optionnel) ===== */
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


/* ===== Raccourcis clavier (comme tes défis) ===== */
document.addEventListener('keydown', function(ev){
  if(!running) return;
  var t = (ev.target && ev.target.tagName || '').toLowerCase();
  if (t==='input' || t==='select' || t==='textarea') return;

  var k = ev.key ? ev.key.toLowerCase() : '';
  var map = {c:'Do', d:'Ré', e:'Mi', f:'Fa', g:'Sol', a:'La', b:'Si'};
  var nom = map[k];
  if(!nom) return;

  var btns = gameContainer.querySelectorAll('button');
  for (var i=0;i<btns.length;i++){
    if (btns[i].textContent === nom){ btns[i].click(); break; }
  }
});

