(function(){
  "use strict";
  const params=new URLSearchParams(location.search), challengeId=params.get("defi"), clefId=params.get("cle"), stageNumber=Math.max(1,Math.min(3,Number(params.get("etape"))||1));
  const NOTE_NAMES={C:"Do",D:"Ré",E:"Mi",F:"Fa",G:"Sol",A:"La",B:"Si"}, ORDER=["Do","Ré","Mi","Fa","Sol","La","Si"];
  const card=document.querySelector(".key-card"), title=document.getElementById("key-title"), purpose=document.getElementById("key-purpose"), quiz=document.getElementById("key-quiz"), reminder=document.getElementById("key-reminder"), result=document.getElementById("key-result"), noteTarget=document.getElementById("key-note"), answers=document.getElementById("key-answers"), badge=document.getElementById("clef-badge"), feedback=document.getElementById("key-feedback"), progress=document.getElementById("key-progress"), scoreText=document.getElementById("key-score");
  const challengeHud=document.getElementById("challenge-hud"), roundText=document.getElementById("challenge-round"), steps=document.getElementById("challenge-steps"), timeText=document.getElementById("challenge-time"), timeFill=document.getElementById("challenge-time-fill"), heartsText=document.getElementById("challenge-hearts"), recoveryText=document.getElementById("challenge-recovery");
  let pool=[],sequence=[],current=0,score=0,total=10,waiting=false,isChallenge=Boolean(challengeId),challenge=null,roundIndex=0,roundCorrect=0,lives=3,timeLeft=0,timerId=null,recoveryStreak=0,bestStreak=0,scoreSent=false;
  const shuffle=a=>a.slice().sort(()=>Math.random()-.5);
  function sameNote(a,b){return a&&b&&a.written===b.written&&a.clef===b.clef;}
  function balanced(values,count){const out=[];while(out.length<count){let round=shuffle(values);if(out.length&&round.length>1&&sameNote(round[0],out.at(-1)))[round[0],round[1]]=[round[1],round[0]];out.push(...round);}return out.slice(0,count);}
  function notesForRound(round){return round.clefs.flatMap(id=>window.LDN_CLEFS[id].stages[round.stage].notes);}
  function setup(){
    if(isChallenge){
      challenge=window.LDN_CYCLES[challengeId];
      if(!challenge){location.href="index.html?mode=defi";return;}
      card.classList.add("challenge"); title.textContent=challenge.label;
      purpose.textContent="Un jeu progressif : réussis chaque manche avant de passer à la suivante. Une erreur coûte un cœur.";
      pool=challenge.rounds.flatMap(notesForRound); total=challenge.rounds.reduce((sum,round)=>sum+round.target,0);
      const home=document.querySelector(".home-link"),resultHome=document.querySelector("#key-result a"); home.href="index.html?mode=defi";home.textContent="← Retour aux défis";resultHome.href="index.html?mode=defi";resultHome.textContent="Retour aux défis";
      renderAnswers(); quiz.hidden=false; challengeHud.hidden=false; lives=3; startRound(0); return;
    }
    const config=window.LDN_CLEFS[clefId]; if(!config){location.href="index.html?mode=cle";return;}
    const stage=config.stages[stageNumber-1]; title.textContent=`${config.label} · ${stage.title}`;
    purpose.textContent="Pourquoi la travailler ? Pour repérer immédiatement la hauteur des notes, lire plus vite et changer de registre sans recompter les lignes.";
    pool=stage.notes; total=[10,12,16][stageNumber-1]; sequence=balanced(pool,total); renderAnswers(); scoreText.textContent=`Score : 0 / ${total}`; showReminder(config,stage);
  }
  function showReminder(config,stage){
    const previous=stageNumber>1?new Set(config.stages[stageNumber-2].notes.map(n=>n.written)):new Set();
    const shown=stageNumber===1?stage.notes:stage.notes.filter(n=>!previous.has(n.written));
    if(!shown.length){quiz.hidden=false;render();return;}
    document.getElementById("reminder-title").textContent=stageNumber===1?"Les notes repères":"Les nouvelles notes";
    const holder=document.getElementById("reminder-staff"),notation=document.createElement("div"),labels=document.createElement("div"); notation.className="open-strings-staff";labels.className="open-strings-labels";
    shown.forEach((n,i)=>{const s=document.createElement("span"),r=shown.length===1?.5:i/(shown.length-1);s.textContent=NOTE_NAMES[n.written[0]];s.style.left=`${30+48*r}%`;labels.appendChild(s);});
    holder.replaceChildren(notation,labels); window.LDNNoteRenderer.renderNotes(notation,{notes:shown.map(n=>n.written),clef:shown[0].clef,width:560,minHeight:175,lineSpacing:18,noteScale:1}); reminder.hidden=false;
  }
  function renderAnswers(){
    answers.replaceChildren(); const available=new Set(pool.map(n=>NOTE_NAMES[n.written[0]]));
    ORDER.filter(n=>available.has(n)).forEach(name=>{const b=document.createElement("button");b.textContent=name;b.onclick=()=>answer(name);answers.appendChild(b);});
  }
  function startRound(index){
    clearInterval(timerId); roundIndex=index; roundCorrect=0; current=0; waiting=false; const round=challenge.rounds[roundIndex]; pool=notesForRound(round); sequence=balanced(pool,Math.max(round.target*3,24)); timeLeft=round.time; feedback.textContent=""; updateChallengeHud(); render(); startTimer();
  }
  function startTimer(){
    clearInterval(timerId); timerId=setInterval(()=>{if(waiting)return; timeLeft--; updateChallengeHud(); if(timeLeft<=0)loseHeart("⏱ Temps écoulé : un cœur perdu",true);},1000);
  }
  function render(){
    if(current>=sequence.length)sequence.push(...balanced(pool,24)); const n=sequence[current],config=window.LDN_CLEFS[n.clef]; badge.textContent=config.label;
    window.LDNNoteRenderer.renderNote(noteTarget,{note:n.written,clef:n.clef,rangeNotes:pool.filter(x=>x.clef===n.clef).map(x=>x.written),adaptive:true,compact:true,minHeight:170,width:150,staveWidth:112,centerStave:true,staveOffsetY:15,lineSpacing:22,noteScale:1});
    feedback.textContent=""; waiting=false; answers.querySelectorAll("button").forEach(b=>b.disabled=false);
  }
  function answer(name){
    if(waiting)return; waiting=true; answers.querySelectorAll("button").forEach(b=>b.disabled=true); const n=sequence[current],correct=NOTE_NAMES[n.written[0]];
    if(name===correct){
      score++; recoveryStreak++; bestStreak=Math.max(bestStreak,recoveryStreak); feedback.textContent=`✓ ${correct}`; feedback.style.color="green";
      if(isChallenge){roundCorrect++; if(recoveryStreak>=5){recoveryStreak=0;if(lives<3){lives++;pulseHearts();feedback.textContent=`✓ ${correct} · ❤️ cœur récupéré !`;}}}
    }else{
      recoveryStreak=0; feedback.textContent=`✗ C’était ${correct}`; feedback.style.color="red"; if(isChallenge){loseHeart("",false);if(lives<=0)return;}
    }
    current++; if(isChallenge){updateChallengeHud();if(roundCorrect>=challenge.rounds[roundIndex].target){clearInterval(timerId);setTimeout(clearRound,850);return;}}
    else{scoreText.textContent=`Score : ${score} / ${total}`;progress.style.width=`${(current/total)*100}%`;if(current>=total){setTimeout(()=>finish(true),900);return;}}
    setTimeout(render,750);
  }
  function loseHeart(message,resetTimer){
    lives=Math.max(0,lives-1); recoveryStreak=0;pulseHearts();if(message){feedback.textContent=message;feedback.style.color="red";} updateChallengeHud();
    if(lives<=0){clearInterval(timerId);setTimeout(()=>finish(false,"Tu n’as plus de cœur."),650);return;}
    if(resetTimer){timeLeft=challenge.rounds[roundIndex].time;waiting=true;setTimeout(render,850);}
  }
  function clearRound(){
    const recovered=lives<3;if(recovered){lives++;pulseHearts();}const last=roundIndex>=challenge.rounds.length-1; feedback.textContent=last?"🏆 Défi terminé !":`🎉 Manche réussie${recovered?" · ❤️ cœur récupéré":""}`;feedback.style.color="green";updateChallengeHud();
    if(last){setTimeout(()=>finish(true),950);}else{setTimeout(()=>startRound(roundIndex+1),950);}
  }
  function updateChallengeHud(){
    if(!isChallenge)return; const round=challenge.rounds[roundIndex]; roundText.textContent=`Manche ${roundIndex+1}/${challenge.rounds.length} · ${round.title}`;timeText.textContent=`${timeLeft}s`;const timeRatio=Math.max(0,timeLeft/round.time),timeState=timeRatio<=.2?"danger":timeRatio<=.45?"warn":"";timeFill.style.width=`${timeRatio*100}%`;timeFill.className=timeState;timeText.closest(".challenge-clock")?.classList.toggle("warn",timeState==="warn");timeText.closest(".challenge-clock")?.classList.toggle("danger",timeState==="danger");heartsText.textContent="❤️".repeat(lives)+"♡".repeat(3-lives);recoveryText.textContent=`${roundCorrect}/${round.target} · ${recoveryStreak}/5 avant le prochain cœur`;
    steps.replaceChildren(...challenge.rounds.map((_,i)=>{const dot=document.createElement("i");if(i<roundIndex)dot.className="done";else if(i===roundIndex)dot.className="current";return dot;})); progress.style.width=`${(roundCorrect/round.target)*100}%`;scoreText.textContent=`Score total : ${score} / ${total} · Meilleure série : ${bestStreak}`;
  }
  function pulseHearts(){heartsText.classList.remove("pop");requestAnimationFrame(()=>heartsText.classList.add("pop"));}
  function finish(success=true,reason=""){
    clearInterval(timerId); quiz.hidden=true; result.hidden=false; document.getElementById("key-result-title").textContent=success?"Bravo !":"Défi interrompu";
    document.getElementById("key-result-score").textContent=isChallenge?`${score} bonnes réponses`:`${score} / ${total}`;
    document.getElementById("key-result-text").textContent=isChallenge?(reason||`${challenge.label} terminé.`):`${score} bonne${score>1?"s":""} réponse${score>1?"s":""} sur ${total}.`;
    const home=document.getElementById("key-result-home");home.href=isChallenge?"index.html?mode=defi":"index.html?mode=cle";home.textContent=isChallenge?"Choisir un autre défi":"Choisir une autre clé";
  }
  function sendResult(){
    if(scoreSent)return;const first=document.getElementById("key-prenom").value.trim(),last=document.getElementById("key-nom").value.trim(),fm=document.getElementById("key-prof-fm").value,instrumentTeacher=document.getElementById("key-prof-instrument").value,confirmation=document.getElementById("key-send-confirmation"),button=document.getElementById("key-send-button");
    if(!first||!last||fm==="Aucun"){confirmation.className="send-confirmation error";confirmation.textContent="Indique ton prénom, ton nom et ton professeur de FM.";return;}
    if(!window.LDN_ENDPOINT){confirmation.className="send-confirmation error";confirmation.textContent="L’envoi n’est pas configuré.";return;}
    const data=new URLSearchParams();data.append("prenom",first);data.append("nom",last);data.append("exercice","Lecture de notes");data.append("type",isChallenge?`defi_${challengeId}`:`cle_${clefId}_etape${stageNumber}`);data.append("score",`${Math.round(score/total*100)}%`);data.append("prof_fm",fm);data.append("prof_instrument",instrumentTeacher);
    button.disabled=true;button.textContent="Envoi en cours…";confirmation.textContent="";
    fetch(window.LDN_ENDPOINT,{method:"POST",mode:"no-cors",body:data}).then(()=>{scoreSent=true;button.textContent="Résultat envoyé";confirmation.className="send-confirmation success";confirmation.textContent="✓ Résultat envoyé au fichier de suivi.";}).catch(()=>{button.disabled=false;button.textContent="Réessayer";confirmation.className="send-confirmation error";confirmation.textContent="L’envoi n’a pas abouti.";});
  }
  document.addEventListener("keydown",event=>{
    if(event.defaultPrevented||event.repeat||event.ctrlKey||event.altKey||event.metaKey)return;
    const tag=event.target?.tagName?.toLowerCase();
    if(["input","select","textarea","button"].includes(tag)||event.target?.isContentEditable)return;
    if(document.querySelector("dialog[open]")||quiz.hidden||!result.hidden||waiting)return;
    const map={c:"Do",d:"Ré",e:"Mi",f:"Fa",g:"Sol",a:"La",b:"Si"},name=map[event.key?.toLowerCase()];
    const button=[...answers.querySelectorAll("button")].find(candidate=>candidate.textContent.trim()===name);
    if(!button||button.disabled)return;event.preventDefault();button.click();
  });
  document.getElementById("start-key").onclick=()=>{reminder.hidden=true;quiz.hidden=false;render();}; document.getElementById("key-restart").onclick=()=>location.reload();document.getElementById("key-send-button").onclick=sendResult; setup();
}());
