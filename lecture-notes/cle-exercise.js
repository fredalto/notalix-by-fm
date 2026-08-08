(function(){
  "use strict";
  window.LDNResultPanel.render(document.getElementById("key-result"), "key");
  const params=new URLSearchParams(location.search), challengeId=params.get("defi"), legacyClef=params.get("cle"), requestedClefs=(params.get("cles")||legacyClef||"").split(",").filter(Boolean), stageNumber=Math.max(1,Math.min(5,Number(params.get("etape"))||1));
  const NOTE_NAMES={C:"Do",D:"Ré",E:"Mi",F:"Fa",G:"Sol",A:"La",B:"Si"}, ORDER=["Do","Ré","Mi","Fa","Sol","La","Si"];
  const card=document.querySelector(".key-card"), title=document.getElementById("key-title"), purpose=document.getElementById("key-purpose"), quiz=document.getElementById("key-quiz"), reminder=document.getElementById("key-reminder"), result=document.getElementById("key-result"), noteTarget=document.getElementById("key-note"), answers=document.getElementById("key-answers"), badge=document.getElementById("clef-badge"), feedback=document.getElementById("key-feedback"), progress=document.getElementById("key-progress"), scoreText=document.getElementById("key-score");
  const challengeHud=document.getElementById("challenge-hud"), roundText=document.getElementById("challenge-round"), steps=document.getElementById("challenge-steps"), timeText=document.getElementById("challenge-time"), timeFill=document.getElementById("challenge-time-fill"), heartsText=document.getElementById("challenge-hearts"), recoveryText=document.getElementById("challenge-recovery");
  let pool=[],sequence=[],current=0,score=0,total=10,waiting=false,isChallenge=Boolean(challengeId),challenge=null,roundIndex=0,roundCorrect=0,lives=3,timeLeft=0,timerId=null,recoveryStreak=0,bestStreak=0,scoreSent=false;
  const shuffle=a=>a.slice().sort(()=>Math.random()-.5);
  function sameNote(a,b){return a&&b&&a.written===b.written&&a.clef===b.clef;}
  function balanced(values,count){const out=[];while(out.length<count){let round=shuffle(values);if(out.length&&round.length>1&&sameNote(round[0],out.at(-1)))[round[0],round[1]]=[round[1],round[0]];out.push(...round);}return out.slice(0,count);}
  function notesForRound(round){return round.clefs.flatMap(id=>window.LDN_CLEFS[id].stages[round.stage].notes);}
  function stageForRound(round){
    const stages=round.clefs.map(id=>window.LDN_CLEFS[id].stages[round.stage]);
    const groups={};
    stages.forEach(stage=>Object.entries(stage.groups||{}).forEach(([name,notes])=>{groups[name]=(groups[name]||[]).concat(notes);}));
    return {mode:stages[0]?.mode||"all",notes:stages.flatMap(stage=>stage.notes),groups};
  }
  function patterned(stage,count){
    const patterns={
      "landmark-adjacent":["landmarks","adjacent"],
      "adjacent-thirds":["adjacent","thirds"],
      "landmark-adjacent-thirds":["landmarks","adjacent","thirds"]
    };
    const pattern=patterns[stage.mode];
    if(!pattern)return balanced(stage.notes,count);
    const queues={};
    const nextFrom=name=>{
      const values=stage.groups?.[name]||[];
      if(!values.length)return null;
      if(!queues[name]?.length)queues[name]=shuffle(values);
      let candidate=queues[name].shift();
      return candidate;
    };
    const out=[];
    for(let index=0;index<count;index++){
      const name=pattern[index%pattern.length];
      let candidate=nextFrom(name);
      if(!candidate)candidate=balanced(stage.notes,1)[0];
      if(sameNote(candidate,out.at(-1))){const alternatives=(stage.groups?.[name]||stage.notes).filter(item=>!sameNote(item,candidate));candidate=shuffle(alternatives)[0]||candidate;}
      out.push(candidate);
    }
    return out;
  }
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
    const configs=requestedClefs.map(id=>window.LDN_CLEFS[id]).filter(Boolean); if(!configs.length){location.href="index.html?mode=cle";return;}
    const stages=configs.map(config=>config.stages[stageNumber-1]).filter(Boolean);
    const groups={};stages.forEach(stage=>Object.entries(stage.groups||{}).forEach(([name,notes])=>{groups[name]=(groups[name]||[]).concat(notes);}));
    const stage={mode:stages[0].mode,notes:stages.flatMap(item=>item.notes),groups};
    title.textContent=`${configs.map(config=>config.label).join(" + ")} · ${stages[0].title}`;
    purpose.textContent="Lis d’abord à partir de tes notes repères, puis élargis progressivement sans recompter les lignes.";
    pool=stage.notes; total=[10,10,12,14,18][stageNumber-1]; sequence=patterned(stage,total); renderAnswers(); scoreText.textContent=`Score : 0 / ${total}`; showReminder(configs);
  }
  function showReminder(configs){
    document.getElementById("reminder-title").textContent=stageNumber===1?"Tes notes repères":stageNumber===4?"Je consolide mes acquis":stageNumber===5?"Les dernières notes à découvrir":"Repères et nouvelles notes";
    const holder=document.getElementById("reminder-staff");holder.replaceChildren();holder.className="open-strings-list key-reminder-list";
    configs.forEach(config=>{
      const stage=config.stages[stageNumber-1];
      const landmarks=config.landmarks;
      const landmarkCodes=new Set(landmarks.map(note=>note.written));
      const discoveries=stage.focus.filter(note=>!landmarkCodes.has(note.written));
      const panel=document.createElement("article"),heading=document.createElement("h4");
      panel.className="key-reminder-card";heading.textContent=config.label;panel.appendChild(heading);holder.appendChild(panel);
      const appendGroup=(groupTitle,notes,kind)=>{
        if(!notes.length)return;
        const group=document.createElement("section"),groupHeading=document.createElement("strong"),notesGrid=document.createElement("div");
        group.className=`reminder-note-group ${kind}`;groupHeading.textContent=groupTitle;notesGrid.className="key-reminder-notes";
        group.append(groupHeading,notesGrid);panel.appendChild(group);
        notes.forEach(note=>{
          const item=document.createElement("div"),notation=document.createElement("div"),chip=document.createElement("span");
          item.className=`key-reminder-note ${kind}`;notation.className="key-reminder-notation";chip.className=`key-note-chip ${kind}`;
          chip.innerHTML=`<b>${NOTE_NAMES[note.written[0]]}</b>${kind==="new"?"<small>nouvelle</small>":""}`;
          item.append(notation,chip);notesGrid.appendChild(item);
          window.LDNNoteRenderer.renderNote(notation,{note:note.written,clef:note.clef,adaptive:false,height:132,fixedStaveY:30,width:124,staveWidth:100,centerStave:true,lineSpacing:13,noteScale:.9});
        });
      };
      appendGroup("Notes repères",landmarks,"landmark");
      appendGroup("Nouvelles notes",discoveries,"new");
    });
    reminder.hidden=false;
  }
  function renderAnswers(){
    answers.replaceChildren(); const available=new Set(pool.map(n=>NOTE_NAMES[n.written[0]]));
    ORDER.filter(n=>available.has(n)).forEach(name=>{const b=document.createElement("button");b.textContent=name;b.onclick=()=>answer(name);answers.appendChild(b);});
  }
  function startRound(index){
    clearInterval(timerId); roundIndex=index; roundCorrect=0; current=0; waiting=false; const round=challenge.rounds[roundIndex],roundStage=stageForRound(round); pool=roundStage.notes; sequence=patterned(roundStage,Math.max(round.target*3,24)); timeLeft=round.time; feedback.textContent=""; updateChallengeHud(); render(); startTimer();
  }
  function startTimer(){
    clearInterval(timerId); timerId=setInterval(()=>{if(waiting)return; timeLeft--; updateChallengeHud(); if(timeLeft<=0)loseHeart("⏱ Temps écoulé : un cœur perdu",true);},1000);
  }
  function render(){
    if(current>=sequence.length)sequence.push(...balanced(pool,24)); const n=sequence[current],config=window.LDN_CLEFS[n.clef]; badge.textContent=config.label;
    window.LDNNoteRenderer.renderNote(noteTarget,{note:n.written,clef:n.clef,adaptive:false,height:isChallenge?235:205,fixedStaveY:isChallenge?44:38,width:isChallenge?190:150,staveWidth:isChallenge?150:112,centerStave:true,lineSpacing:isChallenge?20:18,noteScale:isChallenge?1.08:1});
    feedback.textContent=""; waiting=false; answers.querySelectorAll("button").forEach(b=>b.disabled=false);
  }
  function answer(name){
    if(waiting)return; waiting=true; answers.querySelectorAll("button").forEach(b=>b.disabled=true); const n=sequence[current],correct=NOTE_NAMES[n.written[0]];
    if(name===correct){
      score++; recoveryStreak++; bestStreak=Math.max(bestStreak,recoveryStreak); feedback.textContent=`✓ ${correct}`; feedback.style.color="green";
      window.LDNAudio?.playWrittenNote?.(n.written)?.catch(()=>{});
      if(isChallenge){roundCorrect++; if(recoveryStreak>=5){recoveryStreak=0;if(lives<3){lives++;pulseHearts();feedback.textContent=`✓ ${correct} · ❤️ cœur récupéré !`;}}}
    }else{
      recoveryStreak=0; feedback.textContent=`✗ C’était ${correct}`; feedback.style.color="red"; window.LDNAudio?.playDuck?.().catch(()=>{}); if(isChallenge){loseHeart("",false);if(lives<=0)return;}
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
    clearInterval(timerId); quiz.hidden=true;
    window.LDNResultPanel.show(result,{title:success?"Bravo !":"Défi interrompu",score:isChallenge?`${score} bonnes réponses`:`${score} / ${total}`,text:reason||undefined,homeHref:isChallenge?"index.html?mode=defi":"index.html?mode=cle",homeLabel:isChallenge?"Choisir un autre défi":"Choisir une autre clé"});
    if(matchMedia("(max-width: 700px)").matches)requestAnimationFrame(()=>result.scrollIntoView({behavior:"smooth",block:"start"}));
  }
  function sendResult(){
    if(scoreSent)return;const first=document.getElementById("key-prenom").value.trim(),last=document.getElementById("key-nom").value.trim(),fm=document.getElementById("key-prof-fm").value,instrumentTeacher=document.getElementById("key-prof-instrument").value,confirmation=document.getElementById("key-send-confirmation"),button=document.getElementById("key-send-button"),loading=document.getElementById("key-loading-message");
    if(!first||!last||(fm==="Aucun"&&instrumentTeacher==="Aucun")){confirmation.className="send-confirmation error";confirmation.textContent="Indique ton prénom, ton nom et au moins un professeur.";return;}
    if(!window.LDN_ENDPOINT){confirmation.className="send-confirmation error";confirmation.textContent="L’envoi n’est pas configuré.";return;}
    const data=new URLSearchParams();data.append("prenom",first);data.append("nom",last);data.append("exercice","Lecture de notes");data.append("type",isChallenge?`defi_${challengeId}`:`cles_${requestedClefs.join("-")}_etape${stageNumber}`);data.append("score",`${Math.round(score/total*100)}%`);data.append("prof_fm",fm);data.append("prof_instrument",instrumentTeacher);
    button.disabled=true;button.textContent="Envoi en cours…";loading.hidden=false;confirmation.textContent="";
    fetch(window.LDN_ENDPOINT,{method:"POST",mode:"no-cors",body:data}).then(()=>{scoreSent=true;loading.hidden=true;button.textContent="Résultat envoyé";confirmation.className="send-confirmation success";confirmation.textContent="✓ Résultat envoyé au fichier de suivi.";}).catch(()=>{loading.hidden=true;button.disabled=false;button.textContent="Réessayer";confirmation.className="send-confirmation error";confirmation.textContent="L’envoi n’a pas abouti.";});
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
  document.getElementById("start-key").onclick=()=>{reminder.hidden=true;quiz.hidden=false;render();if(matchMedia("(max-width: 700px)").matches)requestAnimationFrame(()=>quiz.scrollIntoView({behavior:"smooth",block:"start"}));}; document.getElementById("key-restart").onclick=()=>location.reload();document.getElementById("key-send-button").onclick=sendResult; setup();
}());
