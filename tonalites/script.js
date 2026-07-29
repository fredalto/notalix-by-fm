const SHARP_ORDER = ['Fa♯','Do♯','Sol♯','Ré♯','La♯','Mi♯','Si♯'];
const FLAT_ORDER = ['Si♭','Mi♭','La♭','Ré♭','Sol♭','Do♭','Fa♭'];
const KEYS = [
  {n:0,type:'none',key:'Do Majeur',minor:'La mineur'},
  {n:1,type:'sharp',key:'Sol Majeur',minor:'Mi mineur'},
  {n:2,type:'sharp',key:'Ré Majeur',minor:'Si mineur'},
  {n:3,type:'sharp',key:'La Majeur',minor:'Fa♯ mineur'},
  {n:4,type:'sharp',key:'Mi Majeur',minor:'Do♯ mineur'},
  {n:5,type:'sharp',key:'Si Majeur',minor:'Sol♯ mineur'},
  {n:6,type:'sharp',key:'Fa♯ Majeur',minor:'Ré♯ mineur'},
  {n:7,type:'sharp',key:'Do♯ Majeur',minor:'La♯ mineur'},
  {n:1,type:'flat',key:'Fa Majeur',minor:'Ré mineur'},
  {n:2,type:'flat',key:'Si♭ Majeur',minor:'Sol mineur'},
  {n:3,type:'flat',key:'Mi♭ Majeur',minor:'Do mineur'},
  {n:4,type:'flat',key:'La♭ Majeur',minor:'Fa mineur'},
  {n:5,type:'flat',key:'Ré♭ Majeur',minor:'Si♭ mineur'},
  {n:6,type:'flat',key:'Sol♭ Majeur',minor:'Mi♭ mineur'},
  {n:7,type:'flat',key:'Do♭ Majeur',minor:'La♭ mineur'}
];
let state={mode:'mixed',pool:[],i:0,total:0,score:0,current:null,reverse:false,challenge:false,sequence:[],answered:false,autoTimer:null};
function $(id){return document.getElementById(id)}
function go(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('show'));$(id).classList.add('show'); if(id==='tuto') setTutorial('memory')}
function setTutorial(kind){
 ['Sharp','Flat','Memory','Plus'].forEach(k=>$('tab'+k).classList.remove('selected'));
 const box=$('tutorialContent');
 if(kind==='memory'){
   $('tabMemory').classList.add('selected');
   box.innerHTML=`<div class="tutorial-card"><h3>À savoir par cœur</h3>
   <div class="exception-box"><strong>Exceptions à connaître absolument</strong><br><span>Do Majeur</span> : rien à la clé<br><span>Fa Majeur</span> : 1 bémol à la clé</div>
   <div class="memo-grid"><div class="memo"><strong>Ordre des dièses</strong><br>${SHARP_ORDER.join(' → ')}</div><div class="memo"><strong>Ordre des bémols</strong><br>${FLAT_ORDER.join(' → ')}</div></div>
   <p class="mini-note">Commence par mémoriser ces 4 choses. Ensuite les méthodes deviennent beaucoup plus simples.</p>
   <div class="quick-actions"><button onclick="setTutorial('sharp')">Comprendre les dièses</button><button onclick="setTutorial('flat')">Comprendre les bémols</button></div></div>`;
 }
 if(kind==='sharp'){
   $('tabSharp').classList.add('selected');
   box.innerHTML=`<div class="tutorial-card"><h3>Armure avec des dièses ♯</h3>${staffSvg({type:'sharp',n:3})}<p class="rule">Dernier dièse + ½ ton diatonique = tonalité majeure.</p><div class="example"><strong>Exemple :</strong><br>Il y a Fa♯, Do♯, Sol♯.<br>Le dernier dièse est <strong>Sol♯</strong>.<br>Sol♯ + ½ ton = <strong>La</strong>.<br>Donc : <strong>La Majeur</strong>.</div><button onclick="startTraining('sharps')">Je m’entraîne avec les dièses</button></div>`;
 }
 if(kind==='flat'){
   $('tabFlat').classList.add('selected');
   box.innerHTML=`<div class="tutorial-card"><h3>Armure avec des bémols ♭</h3>${staffSvg({type:'flat',n:4})}<p class="rule">Avant-dernier bémol = tonalité majeure.</p><div class="example"><strong>Exemple :</strong><br>Il y a Si♭, Mi♭, La♭, Ré♭.<br>L’avant-dernier bémol est <strong>La♭</strong>.<br>Donc : <strong>La♭ Majeur</strong>.<br><br>⚠ Exception : <strong>1 bémol = Fa Majeur</strong>.</div><button onclick="startTraining('flats')">Je m’entraîne avec les bémols</button></div>`;
 }
 if(kind==='plus'){
   $('tabPlus').classList.add('selected');
   box.innerHTML=`<div class="tutorial-card"><h3>En plus</h3><div class="memo plus-memo"><strong>Relatives mineures</strong><br>Majeur − 3ce mineure = mineur relatif.<br>Exemple : Do Majeur → La mineur.</div>${recapTable()}</div>`;
 }
}
function startTraining(mode){state={mode,pool:getPool(mode),i:0,total:8,score:0,reverse:false,challenge:false,sequence:[],answered:false,autoTimer:null};state.sequence=buildQuestionSequence(state.pool,state.total,mode);go('game');$('gameTitle').textContent='Entraînement';nextQuestion()}
function startChallenge(){state={mode:'mixed',pool:getPool('mixed'),i:0,total:10,score:0,reverse:false,challenge:true,sequence:[],answered:false,autoTimer:null};state.sequence=buildQuestionSequence(state.pool,state.total,'mixed');go('game');$('gameTitle').textContent='Défi 10 questions';nextQuestion()}
function startReverse(){state={mode:'reverse',pool:getPool('mixed'),i:0,total:8,score:0,reverse:true,challenge:false,sequence:[],answered:false,autoTimer:null};state.sequence=buildQuestionSequence(state.pool,state.total,'mixed');go('game');$('gameTitle').textContent='Tonalité → armure';nextQuestion()}
function getPool(mode){if(mode==='sharps')return KEYS.filter(k=>k.type==='sharp'); if(mode==='flats')return KEYS.filter(k=>k.type==='flat'); return KEYS.slice();}
function nextQuestion(){
 clearTimeout(state.autoTimer);
 state.answered=false;
 if(state.i>=state.sequence.length)return showResults();
 $('feedback').innerHTML='';
 $('nextBtn').classList.add('hidden');
 $('answers').innerHTML='';
 state.current=state.sequence[state.i];
 state.i++;
 $('progress').textContent=`${state.i}/${state.total} — score ${state.score}`;
 renderQuestion(state.current);
}
function renderQuestion(k){ if(state.reverse){$('questionType').textContent='Trouver l’armure'; $('staffBox').innerHTML=''; $('questionText').textContent=`Quelle armure pour ${k.key} ?`; const opts=makeOptions(k,'armure'); opts.forEach(o=>addAnswer(o.label, o.correct, explainReverse(k))); return;}
 $('questionType').textContent = k.type==='sharp'?'Armure en dièses':k.type==='flat'?'Armure en bémols':'Aucune altération'; $('staffBox').innerHTML=staffSvg(k); $('questionText').textContent='Quelle est la tonalité majeure ?'; makeOptions(k,'key').forEach(o=>addAnswer(o.label,o.correct,explainKey(k)));}
function makeOptions(k,kind){
  const correctLabel = kind==='key' ? k.key : armureLabel(k);
  const labels=[correctLabel];
  const addFrom=(arr, mapper)=>{
    const shuffled=shuffle(arr.slice());
    for(const item of shuffled){
      const label=mapper(item);
      if(!labels.includes(label))labels.push(label);
      if(labels.length>=4)break;
    }
  };
  if(kind==='key'){
    if(state.mode==='sharps'){
      addFrom(KEYS.filter(x=>x.type==='sharp' && x.key!==k.key), x=>x.key);
      if(labels.length<4 && Math.random()<.45) addFrom(KEYS.filter(x=>x.type==='none' || x.type==='flat'), x=>x.key);
      addFrom(KEYS.filter(x=>x.key!==k.key), x=>x.key);
    }else if(state.mode==='flats'){
      addFrom(KEYS.filter(x=>x.type==='flat' && x.key!==k.key), x=>x.key);
      if(labels.length<4 && Math.random()<.45) addFrom(KEYS.filter(x=>x.type==='none' || x.type==='sharp'), x=>x.key);
      addFrom(KEYS.filter(x=>x.key!==k.key), x=>x.key);
    }else{
      addFrom(KEYS.filter(x=>x.key!==k.key), x=>x.key);
    }
  }else{
    addFrom(KEYS.filter(x=>x.type===k.type && armureLabel(x)!==correctLabel), armureLabel);
    addFrom(KEYS.filter(x=>armureLabel(x)!==correctLabel), armureLabel);
  }
  return shuffle(labels.slice(0,4)).map(label=>({label,correct:label===correctLabel}));
}
function addAnswer(label,correct,explanation){const b=document.createElement('button');b.textContent=label;b.onclick=()=>answer(b,correct,explanation);$('answers').appendChild(b)}
function answer(btn,correct,explanation){
 if(state.answered)return;
 state.answered=true;
 document.querySelectorAll('#answers button').forEach(b=>b.disabled=true);
 if(correct){
   state.score++;
   btn.classList.add('good');
   $('feedback').innerHTML=`<span class="ok">✅ Bravo !</span><br>${explanation}`;
 }else{
   btn.classList.add('wrong');
   $('feedback').innerHTML=`<div class="feedback-help"><span class="ko">❌ Presque...</span><br>${explanation}<br><small>On la reverra plus tard si possible, sans ajouter de question.</small></div>`;
   document.querySelectorAll('#answers button').forEach(b=>{if(b.textContent===(state.reverse?armureLabel(state.current):state.current.key))b.classList.add('good')});
   scheduleRetry(state.current);
 }
 $('progress').textContent=`${state.i}/${state.total} — score ${state.score}`;
 state.autoTimer=setTimeout(nextQuestion, correct ? 1100 : 2700);
}
function explainKey(k){ if(k.type==='none') return 'Do Majeur : il n’y a rien à la clé.'; if(k.type==='sharp'){const last=SHARP_ORDER[k.n-1]; return `Avec les dièses : dernier dièse = ${last}. On ajoute ½ ton : ${k.key}.`;} if(k.n===1)return 'Avec 1 bémol, c’est l’exception : Fa Majeur.'; return `Avec les bémols : l’avant-dernier bémol donne la tonalité : ${k.key}.`;}
function explainReverse(k){ if(k.type==='none')return 'Do Majeur : rien à la clé.'; if(k.type==='sharp')return `${k.key} : on descend d’½ ton et on récite l’ordre des dièses jusqu’à ${SHARP_ORDER[k.n-1]}.`; if(k.n===1)return 'Fa Majeur : 1 bémol à la clé.'; return `${k.key} : on récite l’ordre des bémols jusqu’à la note de la tonalité, puis on ajoute un bémol.`;}
function armureLabel(k){if(k.type==='none')return 'Rien à la clé';return `${k.n} ${k.type==='sharp'?'dièse'+(k.n>1?'s':''):'bémol'+(k.n>1?'s':'')}`}
function showResults(){go('results');$('scoreBig').textContent=`${state.score}/${state.total}`; const p=state.score/state.total; $('scoreText').textContent=p>=.9?'Excellent : les tonalités sont très solides !':p>=.7?'Très bien : encore quelques réflexes à automatiser.':p>=.5?'C’est en route : refais un tuto puis un entraînement.':'On reprend tranquillement : dièses puis bémols séparément.'}
function armureImageFile(k){
 if(k.type==='none') return 'images-gammes/0.svg';
 return `images-gammes/${k.n}-${k.type==='sharp'?'sharp':'flat'}.svg`;
}
function staffSvg(k){
 const label=armureLabel(k);
 return `<div class="staff-image-box" role="img" aria-label="${label}"><div class="staff-image-row"><img class="clef-img" src="images-gammes/clesol.svg" alt="clé de sol"><img class="armure-img" src="${armureImageFile(k)}" alt="${label}"></div></div>`;
}
function keyId(k){return `${k.type}-${k.n}-${k.key}`;}
function easyPoolForMode(pool,mode){
 return pool.filter(k=>{
   if(k.n>3)return false;
   if(mode==='sharps')return k.type==='sharp';
   if(mode==='flats')return k.type==='flat';
   return true;
 });
}
function pickQuestion(candidates,seq,used){
 const last=seq.length?keyId(seq[seq.length-1]):null;
 let available=candidates.filter(k=>!used.has(keyId(k)) && keyId(k)!==last);
 if(!available.length) available=candidates.filter(k=>keyId(k)!==last);
 if(!available.length) available=candidates.slice();
 const choice=random(available);
 used.add(keyId(choice));
 return choice;
}
function buildQuestionSequence(pool,total,mode){
 // En mode mélange / tonalité → armure : équilibre dièses / bémols.
 // Sur 8 questions : 4 dièses + 4 bémols. Sur 10 : 5 + 5.
 if(mode==='mixed') return buildBalancedMixedSequence(total);

 const seq=[];
 const used=new Set();
 const easy=easyPoolForMode(pool,mode);
 for(let i=0;i<total;i++){
   const candidates=(i<3 && easy.length)?easy:pool;
   seq.push(pickQuestion(candidates,seq,used));
 }
 return seq;
}
function buildBalancedMixedSequence(total){
 const seq=[];
 const used=new Set();
 const counts={sharp:0,flat:0};
 const target={sharp:Math.ceil(total/2),flat:Math.floor(total/2)};
 if(Math.random()<.5){ target.sharp=Math.floor(total/2); target.flat=Math.ceil(total/2); }

 for(let i=0;i<total;i++){
   const possibleTypes=['sharp','flat'].filter(t=>counts[t]<target[t]);
   let wantedType;

   // On privilégie l'équilibre au fil de l'exercice, sans tomber dans une mécanique trop prévisible.
   if(possibleTypes.length===1){
     wantedType=possibleTypes[0];
   }else if(counts.sharp<counts.flat){
     wantedType='sharp';
   }else if(counts.flat<counts.sharp){
     wantedType='flat';
   }else{
     wantedType=Math.random()<.5?'sharp':'flat';
   }

   const typePool=KEYS.filter(k=>k.type===wantedType);
   const easyTypePool=typePool.filter(k=>k.n<=3);
   const candidates=(i<3 && easyTypePool.length)?easyTypePool:typePool;
   const choice=pickQuestion(candidates,seq,used);
   seq.push(choice);
   counts[choice.type]++;
 }
 return seq;
}
function scheduleRetry(k){
 const retryId=keyId(k);
 // On garde toujours le même nombre de questions : on remplace une question future.
 if(state.i>=state.sequence.length-1)return;
 if(state.sequence.slice(state.i+1).some(q=>keyId(q)===retryId))return;
 let possible=[];
 for(let pos=state.i+1; pos<state.sequence.length; pos++){
   const prev = pos>0 ? keyId(state.sequence[pos-1]) : null;
   const next = pos<state.sequence.length-1 ? keyId(state.sequence[pos+1]) : null;
   const sameFamily = (state.mode==='mixed' || state.reverse) ? state.sequence[pos].type===k.type : true;
   if(sameFamily && prev!==retryId && next!==retryId) possible.push(pos);
 }
 if(!possible.length)return;
 const replaceAt=random(possible);
 state.sequence[replaceAt]=k;
}
function recapTable(){
 const sharps=KEYS.filter(k=>k.type==='none'||k.type==='sharp');
 const flats=KEYS.filter(k=>k.type==='flat');
 const rows=arr=>arr.map(k=>`<tr><td class="armure-cell">${staffSvg(k)}</td><td>${k.key}</td><td>${k.minor}</td></tr>`).join('');
 return `<h3 class="table-title">Tableau récapitulatif</h3><p class="mini-note">Armure en clé de sol, tonalité majeure et relative mineure.</p><h4>Armures avec dièses</h4><table class="table recap-table"><tr><th>Armure</th><th>Majeur</th><th>Mineur relatif</th></tr>${rows(sharps)}</table><h4>Armures avec bémols</h4><table class="table recap-table"><tr><th>Armure</th><th>Majeur</th><th>Mineur relatif</th></tr>${rows(flats)}</table>`;
}
function random(arr){return arr[Math.floor(Math.random()*arr.length)]} function shuffle(a){return a.sort(()=>Math.random()-0.5)}
setTutorial('memory');
