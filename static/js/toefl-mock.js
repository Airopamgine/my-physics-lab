(() => {
  "use strict";
  const root=document.getElementById("mock-lab");if(!root)return;
  const KEY="mastersPhysicsLab.toeflMock.v1",el=id=>document.getElementById(`mock-${id}`);
  const copy=value=>JSON.parse(JSON.stringify(value)),object=value=>value&&typeof value==="object"&&!Array.isArray(value);
  const node=(tag,value,cls)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;if(cls)n.className=cls;return n;};
  const normalize=value=>String(value).normalize("NFKC").trim().replace(/\s+/g," ").toLowerCase();
  const words=value=>(String(value).match(/[A-Za-z0-9]+(?:['’\-][A-Za-z0-9]+)*/g)||[]).length;
  const definitions=[
    {id:"reading-1",engine:"reading",title:"Reading · Module 1",seconds:1260,count:30},
    {id:"reading-2",engine:"reading",title:"Reading · Module 2",seconds:540,count:20},
    {id:"sentence",engine:"writing",title:"Build a Sentence · 10 items",seconds:360,count:10},
    {id:"email",engine:"writing",title:"Write an Email",seconds:420,count:1},
    {id:"discussion",engine:"writing",title:"Academic Discussion",seconds:600,count:1}
  ];
  const parts=mode=>definitions.filter(d=>mode==="combined"||d.engine===mode);
  let unlocked=false,run=null,sequence=0,storageWarning="",setupOnly=false,rendered="",confirmAction=null,reviewStage=0,reviewPage=0,lastSave=0;
  let wallBase=Date.now(),monoBase=performance.now();
  const now=()=>Math.floor(Math.max(Date.now(),wallBase+performance.now()-monoBase));
  const dateAt=at=>{const d=new Date(at);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;};
  const active=()=>unlocked&&run?.status==="active";
  const items=()=>run?.stages.flatMap(s=>s.pages.flatMap(p=>p.questions))||[];
  const blank=q=>q.kind==="sentence"?[]:"";
  const complete=(q,a)=>q.kind==="sentence"?Array.isArray(a)&&a.length===q.slots:q.kind==="choice"?q.options.some(o=>o.label===a):typeof a==="string"&&Boolean(a.trim());
  function shape(q,a){
    if(q.kind==="sentence")return Array.isArray(a)&&a.length<=q.slots&&new Set(a).size===a.length&&a.every(i=>Number.isInteger(i)&&i>=0&&i<q.tiles.length);
    return typeof a==="string"&&a.length<=(q.kind==="essay"?20000:200)&&(q.kind!=="choice"||a===""||q.options.some(o=>o.label===a));
  }
  function response(q,a){
    if(q.kind==="sentence"){const text=q.frame.replace(/\{(\d+)\}/g,(_,i)=>q.tiles[a[Number(i)]]||"___");return text.charAt(0).toUpperCase()+text.slice(1);}
    if(q.kind==="choice"){const option=q.options.find(o=>o.label===a);return option?`${option.label}. ${option.text}`:"";}
    return a;
  }
  function assess(q){
    const a=run.answers[q.id],empty=Array.isArray(a)?!a.length:!a.trim();
    const correct=q.kind==="choice"?a===q.correct:q.kind==="text"?q.accepted.some(v=>normalize(v)===normalize(a)):q.kind==="sentence"?q.solutions.some(s=>s.length===a.length&&s.every((v,i)=>q.tiles[v]===q.tiles[a[i]])):false;
    return{id:q.id,engine:q.engine,answer:copy(a),answerText:empty?"":response(q,a),result:q.kind==="essay"?(empty?"unanswered":"submitted"):(correct?"correct":"incorrect"),blank:empty,complete:complete(q,a)};
  }
  function save(){
    if(!unlocked)return;if(active())run.seenAt=now();
    try{localStorage.setItem(KEY,JSON.stringify({version:1,sequence,run}));storageWarning="";lastSave=now();}
    catch(_){storageWarning="Cannot save this mock in your browser. Download your responses before closing this page. 保存できません。ページを閉じる前に答案を退避してください。";}
    el("status").textContent=storageWarning||(active()?"Auto-saved · 自動保存中。時計は一時停止できません。":"");el("draft-export").hidden=!active()||!storageWarning;
  }
  function validQuestion(q){
    if(!object(q)||typeof q.id!=="string"||q.id.length>250||!["reading","writing"].includes(q.engine)||!["text","choice","sentence","essay"].includes(q.kind))return false;
    if(!["title","type","prompt","passage","hint","model","source"].every(k=>typeof q[k]==="string"&&q[k].length<60000)||!Array.isArray(q.explanation)||q.explanation.some(x=>typeof x!=="string"))return false;
    if(q.kind==="choice")return Array.isArray(q.options)&&q.options.length>=2&&q.options.length<=10&&q.options.every(o=>typeof o.label==="string"&&typeof o.text==="string")&&q.options.some(o=>o.label===q.correct);
    if(q.kind==="text")return Array.isArray(q.accepted)&&q.accepted.length>0&&q.accepted.every(x=>typeof x==="string");
    if(q.kind==="sentence")return typeof q.frame==="string"&&Array.isArray(q.tiles)&&q.tiles.every(t=>typeof t==="string")&&Number.isInteger(q.slots)&&q.slots>0&&q.slots<=30&&Array.isArray(q.solutions)&&q.solutions.length>0&&q.solutions.every(s=>Array.isArray(s)&&s.length===q.slots&&s.every(i=>Number.isInteger(i)&&i>=0&&i<q.tiles.length));
    return true;
  }
  function restore(){
    try{
      const raw=JSON.parse(localStorage.getItem(KEY)||"null");if(!raw)return;
      if(raw.version!==1||!Number.isSafeInteger(raw.sequence)||raw.sequence<0)throw new Error();sequence=raw.sequence;
      const r=raw.run;if(!r)return;
      if(!object(r)||!["reading","writing","combined"].includes(r.mode)||!["active","completed"].includes(r.status)||typeof r.id!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(r.date)||!Number.isFinite(r.startedAt)||!Number.isFinite(r.seenAt)||!object(r.answers)||!Array.isArray(r.stages))throw new Error();
      const defs=parts(r.mode),ids=new Set();if(r.stages.length!==defs.length||!Number.isInteger(r.index)||r.index<0||r.index>defs.length||r.status==="active"&&r.index>=defs.length||r.status==="completed"&&(r.index!==defs.length||!Number.isFinite(r.endedAt)))throw new Error();
      for(const[s,i]of r.stages.map((s,i)=>[s,i])){
        const d=defs[i];if(!object(s)||s.id!==d.id||s.seconds!==d.seconds||!Array.isArray(s.pages)||!s.pages.length||s.pages.length>20)throw new Error();
        let count=0;for(const p of s.pages){if(!object(p)||typeof p.passage!=="string"||!Array.isArray(p.questions)||!p.questions.length||p.questions.length>10)throw new Error();for(const q of p.questions){if(!validQuestion(q)||q.engine!==d.engine||ids.has(q.id)||!shape(q,r.answers[q.id]))throw new Error();ids.add(q.id);count++;}}
        if(count!==d.count)throw new Error();if(i<=r.index&&i<defs.length&&(!Number.isFinite(s.startedAt)||s.deadline!==s.startedAt+s.seconds*1000))throw new Error();
        if(i<r.index&&!Number.isFinite(s.endedAt))throw new Error();
      }
      if(!Number.isInteger(r.page)||r.page<0||r.status==="active"&&r.page>=r.stages[r.index].pages.length)throw new Error();
      run=r;wallBase=Math.max(Date.now(),r.seenAt);monoBase=performance.now();
    }catch(_){run=null;storageWarning="The saved mock could not be read. Your normal practice records remain available. 模試の保存記録を読み込めませんでした。通常の学習記録は残っています。";}
  }
  const hash=value=>[...value].reduce((n,c)=>Math.imul(n^c.charCodeAt(0),16777619)>>>0,2166136261);
  function readingPools(){
    const bank=window.ToeflReadingLab?.getBank();if(!bank)return null;const pools={cloze:[],daily2:[],daily3:[],academic:[]};
    for(const set of bank.sets){const grouped=new Map();for(const q of set.questions){const passage=q.passage??set.passage??"";if(!grouped.has(passage))grouped.set(passage,[]);grouped.get(passage).push(q);}
      for(const[passage,qs]of grouped){let pool;if(set.collection==="Task 1"&&qs.length===10&&qs.every(q=>q.acceptedAnswers?.length))pool="cloze";
        else if(set.collection==="Task 2"&&[2,3].includes(qs.length)&&qs.every(q=>q.options.length&&q.correct))pool=`daily${qs.length}`;
        else if(set.collection==="Task 3"&&qs.length===5&&qs.every(q=>q.options.length&&q.correct))pool="academic";
        if(!pool)continue;
        const type={cloze:"Complete the Words",daily2:"Read in Daily Life",daily3:"Read in Daily Life",academic:"Read an Academic Passage"}[pool];
        pools[pool].push({key:qs[0].id,passage,questions:qs.map(q=>({id:q.id,engine:"reading",kind:q.options.length?"choice":"text",type,title:set.title,prompt:q.prompt,passage,hint:"",options:q.options,correct:q.correct,accepted:q.acceptedAnswers||[],model:q.answer,source:set.sourceLabel||set.title,explanation:[set.verificationNote,...(set.notes||[]).map(n=>typeof n==="string"?n:`${n.term} — ${n.definition}`)].filter(Boolean)}))});
      }
    }return pools;
  }
  function build(mode){
    const seed=`${now()}:${sequence+1}`,defs=parts(mode),stages=[];
    if(mode!=="writing"){
      const pools=readingPools(),records=window.ToeflReadingLab.getProgress().answers,used=new Set(),texts=new Set();
      const choose=name=>{const pool=pools[name].filter(p=>!used.has(p.key)&&!texts.has(normalize(p.passage)));pool.sort((a,b)=>a.questions.filter(q=>records[q.id]?.result).length-b.questions.filter(q=>records[q.id]?.result).length||hash(seed+a.key)-hash(seed+b.key));if(!pool.length)throw new Error("Reading source pool unavailable");const p=pool[0];used.add(p.key);texts.add(normalize(p.passage));return copy(p);};
      const first=[choose("cloze"),choose("cloze"),choose("daily2"),choose("daily3"),choose("academic")],second=[choose("cloze"),choose("daily2"),choose("daily3"),choose("academic")];
      stages.push({...definitions[0],pages:first},{...definitions[1],pages:second});
    }
    if(mode!=="reading"){
      const bank=window.ToeflWritingLab.getBank(),records=window.ToeflWritingLab.getProgress();
      const choose=(type,n)=>{const pool=bank.exercises.filter(q=>q.type===type);const done=q=>{const r=records[q.id];return r?.checked||r?.history?.length||r?.rating?2:r?.answer?.trim()||r?.selections?.length?1:0;};pool.sort((a,b)=>done(a)-done(b)||hash(seed+a.id)-hash(seed+b.id));if(pool.length<n)throw new Error("Writing source pool unavailable");return pool.slice(0,n).map(q=>{
        const source=q.source.kind==="original"?`Original Writing · ${q.source.date}`:`${q.source.file} PDF ${q.source.pages.join("・")}ページ`;
        const passage=q.type==="sentence"?q.prompt:[q.to?`To: ${q.to}\nSubject: ${q.subject}`:q.professor,q.context,...(q.posts||[]).map(p=>`${p.name}: ${p.text}`)].filter(Boolean).join("\n\n");
        return{passage,questions:[{id:q.id,engine:"writing",kind:q.type==="sentence"?"sentence":"essay",type:{sentence:"Build a Sentence",email:"Write an Email",discussion:"Academic Discussion"}[q.type],title:q.title,prompt:q.type==="sentence"?"Arrange the phrases to complete the sentence.":"Write your response.",passage,hint:(q.requirements||[]).join("\n"),tiles:q.tiles||[],frame:q.frame?.join("")||"",slots:q.solutions?.[0].length||0,solutions:q.solutions||[],model:q.modelAnswer,source,explanation:[q.answerBasis,...q.explanation,...q.phrases].filter(Boolean)}]};
      });};
      stages.push({...definitions[2],pages:choose("sentence",10)},{...definitions[3],pages:choose("email",1)},{...definitions[4],pages:choose("discussion",1)});
    }
    if(stages.some((s,i)=>s.id!==defs[i].id||s.pages.reduce((n,p)=>n+p.questions.length,0)!==defs[i].count))throw new Error("Incomplete mock form");
    const at=now();return{id:`mock-${at}-${sequence+1}`,mode,date:dateAt(at),startedAt:at,seenAt:at,status:"active",index:0,page:0,stages:stages.map((s,i)=>({...s,startedAt:i===0?at:null,deadline:i===0?at+s.seconds*1000:null,endedAt:null})),answers:Object.fromEntries(stages.flatMap(s=>s.pages.flatMap(p=>p.questions)).map(q=>[q.id,blank(q)])),committed:false};
  }
  function publish(){
    if(!run||run.status!=="completed"||run.committed)return;
    const rows=items().map(assess),meta={at:run.endedAt,context:{mockId:run.id,dailyDate:run.date}};
    for(const engine of ["reading","writing"]){const results=rows.filter(r=>r.engine===engine&&!r.blank);if(!results.length)continue;const lab=engine==="reading"?window.ToeflReadingLab:window.ToeflWritingLab;if(!lab?.getBank()||typeof lab.recordMockResults!=="function")return;}
    for(const engine of ["reading","writing"]){const results=rows.filter(r=>r.engine===engine&&!r.blank);if(!results.length)continue;const lab=engine==="reading"?window.ToeflReadingLab:window.ToeflWritingLab;lab.recordMockResults(results,meta);
      document.dispatchEvent(new CustomEvent("toefl:set-submitted",{detail:{engine,setId:run.id,title:"TOEFL timed mock",date:run.date,at:run.endedAt,results}}));
    }run.committed=true;save();
  }
  function transition(reason,at){
    const s=run.stages[run.index];s.endedAt=at;s.reason=reason;run.index++;run.page=0;confirmAction=null;el("confirm").hidden=true;
    if(run.index===run.stages.length){run.status="completed";run.endedAt=at;run.endReason=reason;save();publish();document.dispatchEvent(new CustomEvent("toefl:mock-state-changed"));}
    else{const next=run.stages[run.index];next.startedAt=at;next.deadline=at+next.seconds*1000;save();}
    rendered="";
  }
  function sync(){
    if(!active())return false;let changed=false;const at=now();
    while(active()&&at>=run.stages[run.index].deadline){transition("timeout",run.stages[run.index].deadline);changed=true;}
    if(changed){el("notice").textContent="Time expired. Responses locked; moved to the next part. 時間切れで答案を確定し、次のパートへ進みました。";draw(true);}return changed;
  }
  function start(mode){
    if(!unlocked||active())return;try{const next=build(mode);run=next;sequence++;setupOnly=false;rendered="";confirmAction=null;el("notice").textContent="The clock is running. 一時停止はできません。";save();document.dispatchEvent(new CustomEvent("toefl:mock-state-changed"));draw(true);}catch(_){el("status").textContent="A full form could not be assembled. 教材の読み込みを確認し、再読み込みしてください。";el("reload").hidden=false;}
  }
  function edit(q,value,index){
    if(sync()||!active()||run.index!==index||!shape(q,value))return false;run.answers[q.id]=copy(value);save();updateClock();return true;
  }
  function questionPage(target,stageIndex,pageIndex,review){
    const page=run.stages[stageIndex].pages[pageIndex],group=node("div",undefined,"set-practice set-question-group set-question-group--passage"),source=node("section",undefined,"set-passage-pane"),answers=node("section",undefined,"set-questions");
    source.tabIndex=0;source.setAttribute("role","region");source.setAttribute("aria-label","Question and source · 問題・本文");answers.tabIndex=0;answers.setAttribute("role","region");answers.setAttribute("aria-label","Responses · 解答");
    source.append(node("h4",page.questions[0].type,"set-pane-title"),node("p",page.passage,"set-passage"));if(page.questions.length===1&&page.questions[0].hint)source.append(node("p",page.questions[0].hint,"mock-response"));
    for(const [qi,q]of page.questions.entries()){
      const a=node("article",undefined,"set-question");a.dataset.mockQuestion=q.id;a.append(node("h4",`${qi+1}. ${q.prompt}`));
      if(review){const result=assess(q),label=result.blank?"Unanswered · 未回答":result.result==="correct"?"Correct · 正解":result.result==="submitted"?"Submitted · 作文（要添削）":"Needs review · 要復習",badge=node("p",label,"mock-outcome");badge.dataset.result=result.result;a.append(badge,node("h4","Your response · 自分の解答"),node("p",result.answerText||"No response · 解答なし","mock-response"),node("h4","Accepted / model answer · 正解・解答例","mock-model"),node("p",q.model,"mock-response"));for(const text of q.explanation)a.append(node("p",text,"mock-response"));a.append(node("small",q.source));}
      else if(q.kind==="choice"){
        const field=node("fieldset");field.append(node("legend","Choose one answer"));for(const o of q.options){const label=node("label",undefined,"set-choice"),input=node("input");input.type="radio";input.name=`mock-${q.id}`;input.value=o.label;input.checked=run.answers[q.id]===o.label;input.addEventListener("change",()=>edit(q,input.value,stageIndex));label.append(input,node("span",`${o.label}. ${o.text}`));field.append(label);}a.append(field);
      }else if(q.kind==="sentence"){
        const chosen=node("div",undefined,"set-tiles"),tiles=node("div",undefined,"set-tiles");
        const drawTiles=()=>{chosen.replaceChildren(node("p",response(q,run.answers[q.id])));tiles.replaceChildren();for(const[i,t]of run.answers[q.id].entries()){const b=node("button",`${q.tiles[t]} ×`);b.type="button";b.dataset.mockRemove=String(i);b.addEventListener("click",()=>{const next=[...run.answers[q.id]];next.splice(i,1);if(edit(q,next,stageIndex))drawTiles();});chosen.append(b);}q.tiles.forEach((text,i)=>{const b=node("button",text);b.type="button";b.dataset.mockTile=String(i);b.disabled=run.answers[q.id].includes(i)||run.answers[q.id].length===q.slots;b.addEventListener("click",()=>{if(edit(q,[...run.answers[q.id],i],stageIndex))drawTiles();});tiles.append(b);});};drawTiles();a.append(chosen,tiles);
      }else{
        const label=node("label",q.kind==="essay"?"Your response · あなたの解答":"Missing letters · 欠けた文字","set-field"),input=node(q.kind==="essay"?"textarea":"input");if(q.kind!=="essay")input.type="text";else input.rows=12;input.value=run.answers[q.id];input.maxLength=q.kind==="essay"?20000:200;input.spellcheck=false;input.autocomplete="off";input.setAttribute("autocorrect","off");input.setAttribute("autocapitalize","off");input.dataset.mockAnswer=q.id;
        const count=node("p",`${words(input.value)} words`,"mock-word-count");input.addEventListener("input",()=>{if(edit(q,input.value,stageIndex)&&q.kind==="essay")count.textContent=`${words(input.value)} words`;});label.append(input);a.append(label);if(q.kind==="essay")a.append(count);
      }answers.append(a);
    }group.append(source,answers);target.replaceChildren(group);
  }
  function updateClock(){
    if(!active())return;const s=run.stages[run.index],seconds=Math.max(0,Math.ceil((s.deadline-now())/1000));el("time").textContent=`${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`;el("time").dataset.urgent=String(seconds<=60);
    const qs=s.pages.flatMap(p=>p.questions);el("answered").textContent=`${qs.filter(q=>complete(q,run.answers[q.id])).length} / ${qs.length} answered in this part · このパートの解答数`;
  }
  function drawReview(){
    const s=run.stages[reviewStage];reviewPage=Math.min(reviewPage,s.pages.length-1);questionPage(el("review-page"),reviewStage,reviewPage,true);el("review-position").textContent=`${reviewPage+1} / ${s.pages.length}`;el("review-previous").disabled=reviewPage===0;el("review-next").disabled=reviewPage===s.pages.length-1;
  }
  function draw(focus=false){
    if(!unlocked)return;
    el("setup").hidden=active()||Boolean(run&&run.status==="completed"&&!setupOnly);el("workspace").hidden=!active();el("results").hidden=!run||run.status!=="completed"||setupOnly;
    const readyReading=Boolean(window.ToeflReadingLab?.getBank()),readyWriting=Boolean(window.ToeflWritingLab?.getBank());for(const b of root.querySelectorAll("[data-mock-mode]"))b.disabled=active()||!(b.dataset.mockMode==="reading"?readyReading:b.dataset.mockMode==="writing"?readyWriting:readyReading&&readyWriting);
    el("reload").hidden=readyReading&&readyWriting;
    if(!run||setupOnly){if(!storageWarning)el("status").textContent=readyReading&&readyWriting?"Choose a section to start its clock. 開始した時点から計時します。":"Loading Reading / Writing sources · 教材を読み込み中…";else el("status").textContent=storageWarning;return;}
    const signature=`${run.id}:${run.status}:${run.index}:${run.page}`;
    if(active()){
      const s=run.stages[run.index];el("stage-position").textContent=`Part ${run.index+1} / ${run.stages.length}`;el("stage-title").textContent=s.title;el("page-position").textContent=`Page ${run.page+1} / ${s.pages.length}`;el("previous").disabled=run.page===0;el("next").textContent=run.page===s.pages.length-1?"Submit this part · このパートを確定":"Next page · 次のページ →";
      if(signature!==rendered)questionPage(el("page"),run.index,run.page,false);updateClock();if(focus)el("stage-title").focus({preventScroll:true});
    }else if(signature!==rendered){
      const summary=el("summary");summary.replaceChildren(node("p",`${run.date} · ${run.mode} · ${run.endReason==="ended"?"Ended early · 途中終了":"Completed · 終了"}`));
      const reading=items().filter(q=>q.engine==="reading").map(assess);if(reading.length){const total=node("article",undefined,"mock-summary-card");total.append(node("h4","Reading total · Reading合計"),node("p",`${reading.filter(r=>r.result==="correct").length} / ${reading.length} correct · 演習の正答数`));summary.append(total);}
      for(const s of run.stages){const rows=s.pages.flatMap(p=>p.questions).map(assess),objective=rows.filter(r=>r.result!=="submitted"&&r.result!=="unanswered"),card=node("article",undefined,"mock-summary-card");card.append(node("h4",s.title),node("p",objective.length?`${objective.filter(r=>r.result==="correct").length} / ${rows.length} correct · 演習の正答数`:`${rows[0].blank?"No response · 未回答":`${words(rows[0].answerText)} words · 要添削`}`),node("p",`${rows.filter(r=>!r.complete).length} unanswered / incomplete · 未回答・未完了 · ${Math.round(Math.min(s.seconds,Math.max(0,(s.endedAt-s.startedAt)/1000)))} seconds used`));summary.append(card);}
      const select=el("review-stage");select.replaceChildren();run.stages.forEach((s,i)=>select.append(new Option(s.title,String(i))));reviewStage=0;reviewPage=0;select.value="0";drawReview();if(focus)el("results-title").focus({preventScroll:true});
    }rendered=signature;
  }
  function confirm(kind){
    if(sync()||!active())return;confirmAction={kind,index:run.index};const s=run.stages[run.index],missing=s.pages.flatMap(p=>p.questions).filter(q=>!complete(q,run.answers[q.id])).length;
    el("confirm-text").textContent=kind==="end"?"End the whole test now? Remaining unanswered items receive no credit. You cannot reopen this attempt. 模試を中断して確定します。未回答はそのままで、やり直すことはできません。":`${missing} unanswered / incomplete in this part. Submit and lock it now? Unused time does not carry over. このパートを確定すると戻れません。残り時間の持ち越しはありません。`;
    el("confirm-yes").textContent=kind==="end"?"End and review · 中断して確定":"Submit and continue · 確定して進む";el("confirm").hidden=false;el("confirm-no").focus();
  }
  function exportText(){
    if(!run)return;const content=items().map(q=>`${q.title}\n${q.type}\nSource: ${q.source}\n\nYour response:\n${Array.isArray(run.answers[q.id])&&!run.answers[q.id].length?"":response(q,run.answers[q.id])}\n\nNotes:\n`).join(`\n${"-".repeat(40)}\n\n`);
    const url=URL.createObjectURL(new Blob([content],{type:"text/plain;charset=utf-8"})),a=node("a");a.href=url;a.download=`toefl-mock-${run.mode}-${run.date}.txt`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  root.querySelectorAll("[data-mock-mode]").forEach(b=>b.addEventListener("click",()=>start(b.dataset.mockMode)));
  el("previous").addEventListener("click",()=>{if(sync()||!active())return;if(run.page){run.page--;confirmAction=null;el("confirm").hidden=true;save();draw(true);}});
  el("next").addEventListener("click",()=>{if(sync()||!active())return;if(run.page<run.stages[run.index].pages.length-1){run.page++;confirmAction=null;el("confirm").hidden=true;save();draw(true);}else confirm("advance");});
  el("end").addEventListener("click",()=>confirm("end"));el("confirm-no").addEventListener("click",()=>{confirmAction=null;el("confirm").hidden=true;});
  el("confirm-yes").addEventListener("click",()=>{const action=confirmAction;if(sync()||!active()||!action||action.index!==run.index)return;if(action.kind==="end"){const at=now();while(active())transition("ended",at);}else transition("submitted",now());draw(true);});
  el("review-stage").addEventListener("change",()=>{reviewStage=Number(el("review-stage").value);reviewPage=0;drawReview();});
  el("review-previous").addEventListener("click",()=>{if(reviewPage){reviewPage--;drawReview();}});el("review-next").addEventListener("click",()=>{if(reviewPage<run.stages[reviewStage].pages.length-1){reviewPage++;drawReview();}});
  el("export").addEventListener("click",exportText);el("draft-export").addEventListener("click",exportText);el("new").addEventListener("click",()=>{setupOnly=true;rendered="";draw();});
  el("reload").addEventListener("click",()=>{for(const id of ["library-refresh","writing-retry"])document.getElementById(id)?.click();});
  document.addEventListener("toefl:unlocked",()=>{unlocked=true;restore();const wasActive=active();sync();publish();if(wasActive)window.EnglishPracticeHub?.navigate("mock");draw();});
  document.addEventListener("toefl:view-changed",e=>{if(e.detail?.view==="mock"){sync();draw();}});
  for(const engine of ["reading","writing"])document.addEventListener(`toefl:${engine}-ready`,()=>{publish();draw();});
  for(const event of ["focus","pageshow"])window.addEventListener(event,()=>{sync();draw();});document.addEventListener("visibilitychange",()=>{sync();draw();});
  window.addEventListener("pagehide",()=>{sync();save();});
  setInterval(()=>{if(!active())return;sync();updateClock();if(now()-lastSave>=10000)save();},250);
  document.addEventListener("toefl:mock-state-changed",()=>{window.EnglishPracticeHub?.navigate("mock");});
  window.ToeflMockLab=Object.freeze({isRunning:()=>Boolean(active()),showNavigationNotice:()=>{el("notice").textContent="Finish or end this mock before opening another study tab. 模試を終了してから他の学習タブを開いてください。";},getState:()=>run?copy(run):null});
})();
