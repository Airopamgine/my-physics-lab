(() => {
  "use strict";
  const root=document.getElementById("cambridge-lab");if(!root)return;
  const KEY="mastersPhysicsLab.cambridgeLab.v1",el=id=>document.getElementById(`cambridge-${id}`);
  const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
  const normal=text=>String(text).toLowerCase().replace(/[’‘]/g,"'").replace(/[.!?]+$/g,"").replace(/\s+/g," ").trim();
  const day=()=>window.EnglishCoach.day(), shift=(d,n)=>window.EnglishCoach.shift(d,n);
  const words=text=>(text.match(/[a-z0-9]+(?:['’-][a-z0-9]+)*/gi)||[]).length;
  // Cambridge counts contractions as their expanded words, except cannot (one word).
  const transformWords=text=>words(normal(text).replace(/\b(can't|won't|shan't)\b/g,"can not").replace(/\b(\w+)(n't|'re|'ve|'ll|'d|'m|'s)\b/g,"$1 xx"));
  const hash=s=>[...s].reduce((h,c)=>Math.imul(h^c.charCodeAt(0),16777619)>>>0,2166136261);
  let bank,loading=false,unlocked=false,session=null,repeat=0,heard=false,storageWarning="";
  let state={version:1,records:{},plans:{},exposure:{},repeats:{},session:null};
  const qIndex=new Map();
  const validDate=d=>typeof d==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d+"T12:00Z"))&&new Date(d+"T12:00Z").toISOString().slice(0,10)===d;
  const object=x=>x&&typeof x==="object"&&!Array.isArray(x);
  function validateProgress(s){
    if(!object(s)||s.version!==1||!object(s.records)||!object(s.plans)||!object(s.exposure)||Object.keys(s.records).length>20000)throw new Error("Invalid Cambridge record");
    for(const [id,r]of Object.entries(s.records))if(!/^[\w:.-]{1,180}$/.test(id)||!object(r)||typeof r.answer!=="string"||r.answer.length>20000||!["","correct","incorrect","submitted"].includes(r.result)||!Number.isInteger(r.streak)||r.streak<0||r.streak>5||(r.date&&!validDate(r.date))||(r.due&&!validDate(r.due)))throw new Error("Invalid answer record");
    return s;
  }
  function restore(){
    try{const raw=localStorage.getItem(KEY);if(!raw)return;const s=validateProgress(JSON.parse(raw));
      for(const[id,r]of Object.entries(s.records))if(qIndex.has(id))state.records[id]=cleanRecord(r);
      for(const[date,p]of Object.entries(s.plans))if(validDate(date)&&object(p)&&[p.primary,p.extra].every(id=>bank.sets.some(s=>s.id===id)))state.plans[date]={primary:p.primary,extra:p.extra};
      for(const[id,n]of Object.entries(s.exposure))if(bank.sets.some(s=>s.id===id)&&Number.isInteger(n)&&n>=0)state.exposure[id]=n;
      for(const q of bank.repeat)if(validDate(s.repeats?.[q.en]))state.repeats[q.en]=s.repeats[q.en];
      if(object(s.session)&&bank.sets.some(q=>q.id===s.session.setId)&&Number.isInteger(s.session.index)&&s.session.index>=0&&s.session.index<bank.sets.find(q=>q.id===s.session.setId).questions.length){session={setId:s.session.setId,index:s.session.index,context:cleanContext(s.session.context)};}
    }catch(_){storageWarning="保存記録を読み込めませんでした。既存のTOEFL記録は保持されています。reportから取り込むこともできます。";}
  }
  const cleanContext=c=>object(c)&&validDate(c.dailyDate)&&Number.isInteger(c.dailySlot)&&c.dailySlot>=0&&c.dailySlot<20?{dailyDate:c.dailyDate,dailySlot:c.dailySlot}:{};
  const cleanRecord=r=>({answer:r.answer,result:r.result,checked:r.checked===true,reviewed:r.reviewed===true,date:r.date||"",due:r.due||"",streak:r.streak,lastReviewed:validDate(r.lastReviewed)?r.lastReviewed:""});
  function save(){
    state.session=session;
    try{localStorage.setItem(KEY,JSON.stringify(state));storageWarning="";}catch(_){storageWarning="保存できません。Learning reportをダウンロードして記録を残してください。";}
    el("save-status").textContent=storageWarning||"Saved in this browser · 解答・下書きを保存しました";
    if(storageWarning)el("status").textContent=storageWarning;
  }
  const record=q=>state.records[q.id]||={answer:"",result:"",checked:false,reviewed:false,date:"",due:"",streak:0,lastReviewed:""};
  function choose(part,date){
    const weights=window.EnglishCoach.yesterday(date).tags;
    const score=s=>s.questions.reduce((n,q)=>n+(q.tags||[]).reduce((a,t)=>a+(weights[t]||0),0),0)/s.questions.length;
    const due=s=>Math.max(0,...s.questions.map(q=>{const r=state.records[q.id];return r?.due&&r.due<=date?(r.streak===0?2:1):0;}));
    const pool=bank.sets.filter(s=>String(s.part)===String(part));
    pool.sort((a,b)=>due(b)-due(a)||score(b)-score(a)||(state.exposure[a.id]||0)-(state.exposure[b.id]||0)||hash(`${date}:${a.id}`)-hash(`${date}:${b.id}`));
    const chosen=pool[0];if(!chosen)throw new Error(`Missing Cambridge part ${part}`);state.exposure[chosen.id]=(state.exposure[chosen.id]||0)+1;return chosen;
  }
  function daily(date){
    if(!bank)return [];
    if(!state.plans[date]){
      const rotation=["4","5","3","6","4","7","1"],part=rotation[(new Date(date+"T12:00Z").getUTCDay()+6)%7];
      state.plans[date]={primary:choose("2",date).id,extra:choose(part,date).id};save();
    }
    return Object.values(state.plans[date]).map(id=>{const s=bank.sets.find(q=>q.id===id);return {engine:"cambridge",setId:id,ids:s.questions.map(q=>q.id),title:`Cambridge Part ${s.part} · ${s.title}`,detail:`${s.questions.length}問 · ${s.skill} · 前日の誤答分野と復習予定を優先`,minutes:s.minutes};});
  }
  function catalog(){
    const box=el("catalog");box.replaceChildren();if(!bank||window.EnglishPracticeHub)return;
    for(const s of bank.sets.filter(s=>el("filter").value==="all"||String(s.part)===el("filter").value)){
      const card=node("article"),done=s.questions.filter(q=>state.records[q.id]?.reviewed).length;
      card.append(node("small",s.part==="writing"?"Writing · 140–190 words":`Reading & Use of English · Part ${s.part}`),node("h3",s.title),node("p",s.skill),node("small",`${s.questions.length} task(s) · about ${s.minutes} min · ${done} reviewed`));
      const button=node("button",session?.setId===s.id?"Continue →":"Start practice →");button.type="button";button.className="toefl-button toefl-button--secondary";button.dataset.cambridgeSet=s.id;
      button.addEventListener("click",()=>startSelection(s.id,s.questions.map(q=>q.id),{},session?.setId===s.id));card.append(button);box.append(card);
    }
  }
  function startSelection(setId,ids,context={},resume=false){
    const s=bank?.sets.find(s=>s.id===setId);if(!s||!Array.isArray(ids)||!ids.length||ids.some(id=>!s.questions.some(q=>q.id===id)))return false;
    if(document.getElementById("toefl-app")?.dataset.grading==="set"){
      if(!window.EnglishSetPractice){el("status").textContent="全問提出用の画面を読み込めません。ページを再読み込みしてください。";return false;}
      return openSet(s,ids,context);
    }
    if(session?.setId===setId&&ids.includes(s.questions[session.index]?.id)&&context.dailyDate&&session.context.dailyDate===context.dailyDate&&session.context.dailySlot===context.dailySlot)resume=true;
    if(!resume){
      // Whole source sets remain visible; only the requested unreviewed queue is resumed.
      session={setId,index:s.questions.findIndex(q=>q.id===ids[0]),context:cleanContext(context)};
      for(const q of s.questions.filter(q=>ids.includes(q.id))){const r=record(q);r.checked=false;r.reviewed=false;r.result="";if(s.part!=="writing")r.answer="";}
    }
    window.ToeflWritingLab?.pauseTimer();save();renderQuestion();catalog();el("runner").hidden=false;el("runner").scrollIntoView({behavior:"smooth",block:"start"});el("set-title").focus({preventScroll:true});return true;
  }
  function openSet(s,ids,context){
    const selected=s.questions.filter(q=>ids.includes(q.id));session=null;window.ToeflWritingLab?.pauseTimer();
    return window.EnglishSetPractice.open({engine:"cambridge",host:el("runner"),id:s.id,title:`${s.part==="writing"?"Writing":`Cambridge Part ${s.part}`} · ${s.title}`,instruction:s.instruction,minutes:s.minutes,context,
      initialAnswers:Object.fromEntries(selected.filter(q=>s.part==="writing"||!state.records[q.id]?.checked).map(q=>[q.id,state.records[q.id]?.answer||""])),
      questions:selected.map(q=>({id:q.id,kind:s.part==="writing"?"essay":q.options?"choice":"text",prompt:[q.prompt,q.stem].filter(Boolean).join("\n"),passage:s.passage,
        hint:[q.keyword?`Key word: ${q.keyword} · Use 2–5 words, including this word unchanged.`:"",q.base?`Base word: ${q.base}`:""].filter(Boolean).join("\n"),options:q.options,checks:s.part==="writing"?q.checklist:[],
        grade:answer=>{const g=s.part==="writing"?null:grade(q,answer);return{result:g===null?"submitted":g.correct?"correct":"incorrect",model:q.model||q.answers.join(" / "),explanation:[g?.reason,q.explanation].filter(Boolean)};}})),
      onSubmit:(results,run)=>{for(const item of results){const q=selected.find(q=>q.id===item.id),r=record(q);r.answer=item.answer;r.result=item.result;r.checked=true;r.reviewed=false;r.date=run.date;
        window.EnglishCoach.record({engine:"cambridge",id:q.id,result:item.result,date:run.date,tags:q.tags,title:s.title,answer:item.answer});
        document.dispatchEvent(new CustomEvent("toefl:cambridge-answer",{detail:{id:q.id,result:item.result,context}}));}save();catalog();},
      onReview:(results,run)=>{for(const item of results){const r=record(selected.find(q=>q.id===item.id));r.reviewed=true;
        if(item.result!=="submitted"){const first=window.EnglishCoach.yesterday(shift(run.date,1)).missed.some(x=>x.engine==="cambridge"&&x.id===item.id),wrong=item.result==="incorrect"||first;
          r.streak=wrong?0:r.lastReviewed===run.date?Math.max(1,r.streak):Math.min(5,r.streak+1);r.due=shift(run.date,wrong?1:[1,1,3,7,14,30][r.streak]);r.lastReviewed=run.date;}
        document.dispatchEvent(new CustomEvent("toefl:cambridge-reviewed",{detail:{id:item.id,result:item.result==="submitted"?"self-reviewed":item.result,context}}));}save();catalog();},
      tutor:(id,result)=>{const q=selected.find(q=>q.id===id);return{setTitle:s.title,section:"Cambridge B2 First",task:`Part ${s.part}`,instruction:s.instruction,context:s.passage,question:[q.prompt,q.stem].filter(Boolean).join("\n"),options:q.options?.map(o=>`${o.label}. ${o.text}`),userAnswer:result.answer,modelAnswer:result.model,explanation:q.explanation};},
      onClose:done=>{el("status").textContent=done?"Set reviewed · 全問の解説を確認しました。":"Draft saved · 全問提出前の解答を保存しました。";catalog();document.getElementById("daily-next")?.focus({preventScroll:true});}
    });
  }
  function renderQuestion(){
    if(!session)return;
    const s=bank.sets.find(s=>s.id===session.setId),q=s.questions[session.index],r=record(q);
    el("set-title").textContent=`${s.part==="writing"?"Writing":`Part ${s.part}`} · ${s.title}`;el("instruction").textContent=s.instruction;
    el("position").textContent=`${session.index+1} / ${s.questions.length} · ${s.skill}`;
    el("passage").textContent=s.passage||"";el("passage").hidden=!s.passage;
    const question=el("question");question.replaceChildren();question.append(node("h4",q.prompt));
    if(q.keyword)question.append(node("p",`Key word: ${q.keyword} · Keep it unchanged. Use 2–5 words in the gap; contractions count as expanded words.`));
    if(q.stem)question.append(node("p",q.stem));if(q.base)question.append(node("p",`Base word: ${q.base}`));
    const input=el("input");input.replaceChildren();
    if(q.options){
      for(const option of q.options){const label=node("label"),radio=node("input");label.className="cambridge-choice";radio.type="radio";radio.name="cambridge-answer";radio.value=option.label;radio.checked=r.answer===option.label;radio.disabled=r.checked;
        radio.addEventListener("change",()=>{r.answer=radio.value;save();});label.append(radio,node("span",`${option.label}. ${option.text}`));input.append(label);}
    }else{
      const label=node("label",s.part==="writing"?"Your draft · Write before opening the model":"Your answer · Enter only the missing word(s)");label.htmlFor="cambridge-answer";label.className="cambridge-answer-label";
      const field=node(s.part==="writing"?"textarea":"input");field.id="cambridge-answer";if(s.part!=="writing")field.type="text";else field.rows=9;field.maxLength=s.part==="writing"?20000:160;field.autocomplete="off";field.spellcheck=s.part==="writing";field.value=r.answer;field.disabled=r.checked;
      field.addEventListener("input",()=>{r.answer=field.value;save();if(s.part==="writing")el("position").textContent=`${words(r.answer)} words · target 140–190 · word count does not assess quality`;});label.append(field);input.append(label);
    }
    el("check").hidden=r.checked;el("check").textContent=s.part==="writing"?"Submit draft & self-review":"Check answer";el("feedback").hidden=!r.checked;el("next").hidden=!r.checked;
    if(r.checked)feedback(s,q,r);else el("feedback").replaceChildren();
    el("save-status").textContent=storageWarning||"Drafts stay in this browser · 下書きは自動保存されます";
  }
  function grade(q,text){
    const answer=normal(text);
    if(q.keyword&&(transformWords(answer)<2||transformWords(answer)>5||!answer.split(" ").includes(q.keyword.toLowerCase())))return {correct:false,reason:"Keep the key word unchanged and use 2–5 words in the gap. 語数と指定語を確認してください。"};
    return {correct:q.answers.some(a=>normal(a)===answer),reason:""};
  }
  function feedback(s,q,r){
    const box=el("feedback");box.replaceChildren();
    if(s.part==="writing"){
      box.append(node("strong","Draft submitted · Now compare and revise"),node("p",`Your draft: ${words(r.answer)} words. This is not a score.`));
      const model=node("details"),summary=node("summary","One possible model · 解答例を開く");model.append(summary,node("p",q.model));box.append(model,node("p",q.explanation));
      for(const [i,text]of q.checklist.entries()){
        const label=node("label"),check=node("input");label.className="cambridge-choice";check.type="checkbox";check.dataset.cambridgeCheck=i;label.append(check,node("span",text));box.append(label);
      }
      el("next").disabled=true;box.addEventListener("change",()=>{el("next").disabled=box.querySelectorAll("[data-cambridge-check]:checked").length!==q.checklist.length;});
    }else{
      const g=grade(q,r.answer);box.append(node("strong",r.result==="correct"?"Correct · Now explain why":"Needs repair · Compare the meaning and structure"),node("p",`Your answer: ${r.answer}`),node("p",`Accepted answer${q.answers.length>1?"s":""}: ${q.answers.join(" / ")}`));
      if(g.reason)box.append(node("p",g.reason));box.append(node("p",q.explanation));el("next").disabled=false;
    }
    const bridge=node("div");box.append(bridge);window.ToeflChatGPTBridge?.mount(bridge,{setTitle:s.title,section:"Cambridge B2 First",task:`Part ${s.part}`,instruction:s.instruction,context:s.passage,question:[q.prompt,q.stem].filter(Boolean).join("\n"),options:q.options?.map(o=>`${o.label}. ${o.text}`),userAnswer:r.answer,modelAnswer:q.model||q.answers.join(" / "),explanation:q.explanation});
    el("next").textContent=session.index===s.questions.length-1?"Review & finish set ✓":"Review & next →";
  }
  el("form").addEventListener("submit",event=>{
    event.preventDefault();if(!session)return;const s=bank.sets.find(s=>s.id===session.setId),q=s.questions[session.index],r=record(q);if(r.checked)return;
    if(!r.answer.trim()){el("save-status").textContent="Enter your answer first · 先に解答してください";return;}
    const date=session.context.dailyDate||day();r.result=s.part==="writing"?"submitted":grade(q,r.answer).correct?"correct":"incorrect";r.checked=true;r.date=date;r.reviewed=false;
    window.EnglishCoach.record({engine:"cambridge",id:q.id,result:r.result,date,tags:q.tags,title:s.title,answer:r.answer});
    document.dispatchEvent(new CustomEvent("toefl:cambridge-answer",{detail:{id:q.id,result:r.result,context:session.context}}));save();renderQuestion();
  });
  el("next").addEventListener("click",()=>{
    if(!session||el("next").disabled)return;const s=bank.sets.find(s=>s.id===session.setId),q=s.questions[session.index],r=record(q);if(!r.checked)return;
    const date=session.context.dailyDate||day();r.reviewed=true;
    const first=window.EnglishCoach.yesterday(shift(date,1)).missed.some(x=>x.engine==="cambridge"&&x.id===q.id);
    if(r.result!=="submitted"){
      const wrong=r.result==="incorrect"||first;r.streak=wrong?0:r.lastReviewed===date?Math.max(1,r.streak):Math.min(5,r.streak+1);r.due=shift(date,wrong?1:[1,1,3,7,14,30][r.streak]);r.lastReviewed=date;
    }
    document.dispatchEvent(new CustomEvent("toefl:cambridge-reviewed",{detail:{id:q.id,result:r.result==="submitted"?"self-reviewed":r.result,context:session.context}}));
    if(++session.index>=s.questions.length){session=null;save();el("runner").hidden=true;catalog();el("status").textContent="Set reviewed. Use one corrected expression in a new sentence. 復習完了。覚えた表現を自分の文で使いましょう。";document.getElementById("daily-next")?.focus({preventScroll:true});}
    else{save();renderQuestion();el("set-title").focus({preventScroll:true});}
  });
  el("close").addEventListener("click",()=>{save();el("runner").hidden=true;catalog();});el("filter").addEventListener("change",catalog);
  function importProgress(data){validateProgress(data);for(const[id,r]of Object.entries(data.records))if(qIndex.has(id)&&!state.records[id])state.records[id]=cleanRecord(r);for(const q of bank.repeat)if(validDate(data.repeats?.[q.en])&&!state.repeats[q.en])state.repeats[q.en]=data.repeats[q.en];save();catalog();}
  function voices(){
    const select=document.getElementById("repeat-voice"),value=select.value;select.replaceChildren();const options=window.speechSynthesis?.getVoices().filter(v=>/^en[-_]/i.test(v.lang))||[];
    options.sort((a,b)=>Number(b.lang==="en-GB")-Number(a.lang==="en-GB"));for(const v of options){const o=node("option",`${v.name} · ${v.lang}`);o.value=v.voiceURI;select.append(o);}if(!options.length){const o=node("option","Default English voice");o.value="";select.append(o);}if([...select.options].some(o=>o.value===value))select.value=value;
  }
  function repeatView(){if(!bank)return;document.getElementById("repeat-status").textContent=`Sentence ${repeat+1} / ${bank.repeat.length} · Listen → repeat aloud → reveal`;document.getElementById("repeat-text").hidden=true;heard=false;}
  document.getElementById("repeat-play").addEventListener("click",()=>{
    if(!bank)return;const status=document.getElementById("repeat-status");if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){status.textContent="音声合成を利用できません。別のブラウザの音声設定、または公式音声教材を使ってください。";return;}
    document.getElementById("repeat-text").hidden=true;window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(bank.repeat[repeat].en);utterance.lang="en-GB";
    utterance.voice=window.speechSynthesis.getVoices().find(v=>v.voiceURI===document.getElementById("repeat-voice").value)||null;
    utterance.onend=()=>{heard=true;status.textContent="Repeat aloud now, then reveal and compare. 声に出してから英文と比べましょう。";};utterance.onerror=()=>{status.textContent="音声を再生できませんでした。English voiceを選び直すか、公式音声教材を使ってください。";};window.speechSynthesis.speak(utterance);
  });
  document.getElementById("repeat-reveal").addEventListener("click",()=>{if(!bank)return;const q=bank.repeat[repeat],box=document.getElementById("repeat-text");box.textContent=`${q.en}\n${q.ja}\n${q.note}`;box.hidden=false;if(!heard)document.getElementById("repeat-status").textContent="Text shown · 次は音声だけを聞いてから繰り返しましょう。";});
  const chooseRepeat=()=>{const list=bank.repeat.map((q,i)=>({i,date:state.repeats[q.en]||""}));list.sort((a,b)=>a.date.localeCompare(b.date)||a.i-b.i);repeat=list[0].i;};
  document.getElementById("repeat-next").addEventListener("click",()=>{if(!bank)return;window.speechSynthesis?.cancel();if(heard&&!document.getElementById("repeat-text").hidden){state.repeats[bank.repeat[repeat].en]=day();save();chooseRepeat();}else repeat=(repeat+1)%bank.repeat.length;repeatView();});
  async function load(){
    if(!unlocked||loading||bank)return;loading=true;
    try{const response=await fetch(root.dataset.bankUrl,{cache:"no-cache"});if(!response.ok)throw new Error("Network");const payload=await response.json();
      if(payload.schemaVersion!==1||!Array.isArray(payload.sets)||!payload.sets.length||!payload.repeat?.length)throw new Error("Invalid bank");bank=payload;for(const s of bank.sets)for(const q of s.questions)qIndex.set(q.id,q);restore();catalog();voices();repeatView();
      el("status").textContent=storageWarning||`${bank.sets.length} original sets · ${qIndex.size} tasks · reviewed ${bank.updatedAt}`;el("retry").hidden=true;document.dispatchEvent(new CustomEvent("toefl:cambridge-ready"));
    }catch(_){bank=null;el("status").textContent="Cambridge教材を読み込めません。Retry loadingを押してください。既存のTOEFL教材は使えます。";el("retry").hidden=false;document.dispatchEvent(new CustomEvent("toefl:cambridge-unavailable"));}
    finally{loading=false;}
  }
  el("retry").addEventListener("click",load);document.addEventListener("toefl:unlocked",()=>{unlocked=true;load();});window.speechSynthesis?.addEventListener("voiceschanged",voices);
  window.addEventListener("pagehide",()=>{window.speechSynthesis?.cancel();if(bank)save();});
  window.CambridgeLab=Object.freeze({getBank:()=>bank,getProgress:()=>JSON.parse(JSON.stringify({...state,session})),validateProgress,importProgress,startSelection,daily,grade,transformWords,
    startRepeat:()=>{if(!bank)return false;chooseRepeat();repeatView();document.getElementById("repeat-lab").open=true;return true;}});
})();
