(() => {
  "use strict";
  const PREFIX = "mastersPhysicsLab.setAnswers.v1:", engines = new Map();
  const DRAFT_PREFIX = "mastersPhysicsLab.setDrafts.v1:";
  const clone = value => JSON.parse(JSON.stringify(value));
  const node = (tag, text, className) => { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (className) n.className = className; return n; };
  const today = () => { const d = new Date(Date.now()); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
  const required = () => document.getElementById("toefl-app")?.dataset.grading === "set";
  function available(status) {
    if (!required()) return false;
    if (!window.EnglishSetPractice && status) status.textContent = "全問提出用の画面を読み込めません。ページを再読み込みしてください。";
    return true;
  }
  function shape(q, value, complete = false) {
    if (q.kind === "choice") return typeof value === "string" && q.options.some(o => o.label === value);
    if (q.kind === "sentence") return Array.isArray(value) && value.length <= q.slots && (!complete || value.length === q.slots) &&
      new Set(value).size === value.length && value.every(i => Number.isInteger(i) && i >= 0 && i < q.tiles.length);
    if (q.kind === "compound") return Array.isArray(value) && value.length === q.fields.length && value.every(v => typeof v === "string" && v.length <= 200 && (!complete || v.trim()));
    return typeof value === "string" && value.length <= (q.kind === "essay" || q.kind === "self" ? 20000 : 200) && (!complete || Boolean(value.trim()));
  }
  const empty = q => q.kind === "sentence" ? [] : q.kind === "compound" ? q.fields.map(() => "") : "";
  function getDrafts(engine) {
    const found=new Map();
    try {
      const archived=JSON.parse(localStorage.getItem(DRAFT_PREFIX+engine)||"[]");
      for(const draft of Array.isArray(archived)?archived:[])if(draft?.version===1&&typeof draft.signature==="string"&&draft.answers&&!draft.reviewed)found.set(draft.signature,draft);
    }catch(_){}
    try {
      const latest=JSON.parse(localStorage.getItem(PREFIX+engine)||"null");
      if(latest?.version===1&&typeof latest.signature==="string"&&latest.answers){if(latest.reviewed)found.delete(latest.signature);else found.set(latest.signature,latest);}
    }catch(_){}
    return [...found.values()];
  }
  function matchesDraft(saved, id, ids, context, date) {
    try {
      const signature=JSON.parse(saved.signature);
      return Array.isArray(signature)&&signature[0]===id&&JSON.stringify(signature[1])===JSON.stringify(ids)&&JSON.stringify(signature[2])===JSON.stringify(context)&&
        (!context.dailyDate||signature[3]===date);
    }catch(_){return false;}
  }
  function open(options) {
    const { engine, host, questions } = options;
    if (!host || !questions?.length || new Set(questions.map(q => q.id)).size !== questions.length) return false;
    for (const run of engines.values()) run.pause();
    if (engines.get(engine)?.host !== host) engines.get(engine)?.hide();
    const date = options.context?.dailyDate || today(), context = options.context || {};
    const signature = JSON.stringify([options.id, questions.map(q => q.id), context, date]);
    let data = { version:1, signature, answers:{}, submitted:false, reviewed:false, checks:{}, ratings:{}, date,
      remaining:Math.max(0, Number(options.minutes || 0) * 60), deadline:null }, warning = "";
    try {
      const saved = getDrafts(engine).find(draft=>matchesDraft(draft,options.id,questions.map(q=>q.id),context,date));
      if (saved) {
        if (saved.version !== 1 || typeof saved.signature !== "string" || !saved.answers || typeof saved.answers !== "object") throw new Error("Invalid set draft");
        if (!saved.reviewed) {
          for (const q of questions) if (Object.hasOwn(saved.answers,q.id) && shape(q,saved.answers[q.id])) data.answers[q.id] = clone(saved.answers[q.id]);
          data.submitted = saved.submitted === true && questions.every(q => shape(q,data.answers[q.id],true));
          if (saved.checks && typeof saved.checks === "object") for (const q of questions) if (Array.isArray(saved.checks[q.id])) data.checks[q.id] = saved.checks[q.id].filter(i => Number.isInteger(i) && i>=0 && i<(q.checks?.length || 0));
          if (saved.ratings && typeof saved.ratings === "object") for (const q of questions) if (["mastered","review"].includes(saved.ratings[q.id])) data.ratings[q.id]=saved.ratings[q.id];
          if (Number.isFinite(saved.remaining)) data.remaining = Math.max(0, Math.min(data.remaining, saved.remaining));
          if (Number.isFinite(saved.deadline) && saved.deadline <= Date.now() + data.remaining * 1000) data.deadline=saved.deadline;
        }
      }
    } catch (_) { warning = "保存されたセットの下書きを読み込めませんでした。採点済みの学習記録は保持されています。"; }
    for (const q of questions) if (!Object.hasOwn(data.answers,q.id)) data.answers[q.id] = shape(q,options.initialAnswers?.[q.id]) ? clone(options.initialAnswers[q.id]) : empty(q);
    // Keep legacy controls disconnected from the visible answering flow, without
    // changing their IDs or the existing learner-history formats.
    let legacy = [...host.children].find(n => n.hasAttribute("data-set-legacy"));
    if (!legacy) { legacy=node("div"); legacy.dataset.setLegacy=""; for(const child of [...host.childNodes]) legacy.append(child); host.append(legacy); }
    legacy.hidden=true;
    for(const child of [...host.children]) if(child!==legacy) child.remove();
    const panel=node("section",undefined,"set-practice");panel.dataset.setEngine=engine;
    const title=node("h3",options.title);title.tabIndex=-1;title.id=`${engine}-set-title`;
    const heading=node("div",undefined,"set-heading"),close=node("button","Save & close · 保存して閉じる","toefl-button toefl-button--ghost");close.type="button";close.dataset.setClose="";
    heading.append(title,close);panel.append(heading,node("p",options.instruction||"Answer every question, revise any response, then submit the complete set."),node("p","全問を解答するまで正誤・正答・解説は表示しません。提出前はどの解答も変更できます。"));
    const status=node("p",undefined,"set-status");status.setAttribute("role","status");status.dataset.setStatus="";panel.append(status);
    const timer=node("div",undefined,"set-timer");panel.append(timer);
    const form=node("form"),list=node("div");list.className="set-question-groups";form.append(list);
    const submit=node("button","Submit set · 全問まとめて採点","toefl-button toefl-button--primary");submit.type="submit";submit.dataset.setSubmit="";
    const review=node("section",undefined,"set-review");review.hidden=true;review.dataset.setReview="";
    const finish=node("button","Finish review · 解説を確認して完了","toefl-button toefl-button--primary");finish.type="button";finish.dataset.setFinish="";
    form.append(submit);panel.append(form,review);host.append(panel);host.hidden=false;host.setAttribute("aria-labelledby",title.id);
    const fields=new Map(), feedbackNodes=new Map();let submittedResults=null;
    const save=()=>{try {
      const drafts=getDrafts(engine).filter(draft=>!matchesDraft(draft,options.id,questions.map(q=>q.id),context,date));
      data.updatedAt=Date.now();if(!data.reviewed)drafts.push(data);
      localStorage.setItem(DRAFT_PREFIX+engine,JSON.stringify(drafts.sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)).slice(0,40)));
      localStorage.setItem(PREFIX+engine,JSON.stringify(data));warning="";
    }catch(_){warning="このブラウザに下書きを保存できません。下の答案ダウンロードで記録を残してください。";}update();};
    const complete=()=>questions.every(q=>shape(q,data.answers[q.id],true));
    function update(){
      const count=questions.filter(q=>shape(q,data.answers[q.id],true)).length;
      status.textContent=warning || (data.submitted ? `${questions.length} / ${questions.length} submitted · 全問提出済み。下の結果と解説を確認してください。` : `${count} / ${questions.length} answered · 解答済み。途中保存中／採点前です。`);
      submit.disabled=data.submitted||!complete();submit.hidden=data.submitted;
      finish.disabled=questions.some(q=>(q.checks||[]).some((_,i)=>!data.checks[q.id]?.includes(i)) || q.kind==="self"&&!data.ratings[q.id]);
    }
    function edit(q,value){if(data.submitted)return;data.answers[q.id]=value;save();options.onDraft?.(q.id,clone(value));}
    let currentGroup=null;
    for(const [index,q]of questions.entries()){
      // Keep each source beside its own questions. Consecutive questions may
      // share a passage; a new source always starts a new, independent pair.
      const passageText=q.passage||"";
      if(!currentGroup || currentGroup.text!==passageText || q.kind==="essay" || currentGroup.essay){
        const group=node("section",undefined,`set-question-group${passageText?" set-question-group--passage":" set-question-group--short"}`);
        const questionList=node("div",undefined,"set-questions");
        currentGroup={text:passageText,questions:questionList,essay:q.kind==="essay"};
        if(passageText){
          const source=node("section",undefined,"set-passage-pane"),sourceTitle=node("h4","Passage & task · 本文・課題","set-pane-title");
          sourceTitle.id=`${engine}-set-source-${index}`;source.setAttribute("aria-labelledby",sourceTitle.id);source.tabIndex=0;
          const passage=node("div",passageText,"set-passage");passage.dataset.setPassage="";
          const answerTitle=node("h4","Questions & answers · 設問・解答","set-pane-title");answerTitle.id=`${engine}-set-answers-${index}`;
          questionList.tabIndex=0;questionList.setAttribute("role","region");questionList.setAttribute("aria-labelledby",answerTitle.id);
          source.append(sourceTitle,passage);questionList.append(answerTitle);group.append(source);
          currentGroup.source=source;currentGroup.passage=passage;
        }
        group.append(questionList);list.append(group);
      }
      const article=node("article",undefined,"set-question");article.dataset.setQuestion=q.id;
      const problem=node("div",undefined,"set-question-context");
      const labelId=`${engine}-set-question-${index}`;const prompt=node("h4",`${index+1}. ${q.prompt}`);prompt.id=labelId;problem.append(prompt);article.setAttribute("aria-labelledby",labelId);
      if(!passageText){problem.tabIndex=0;problem.setAttribute("role","region");problem.setAttribute("aria-labelledby",labelId);}
      if(q.hint)problem.append(node("p",q.hint,"set-note"));
      if(q.audio){const play=node("button","Listen · 音声を聞く","toefl-button toefl-button--secondary");play.type="button";play.addEventListener("click",()=>{
        if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){status.textContent="音声合成を利用できません。音声対応のブラウザで試してください。";return;}
        window.speechSynthesis.cancel();const speech=new SpeechSynthesisUtterance(q.audio);speech.lang="en-US";window.speechSynthesis.speak(speech);
      });problem.append(play,node("p","Synthetic voice · ブラウザの音声合成。文字起こしは全問提出後に表示します。","set-note"));}
      const input=node("div",undefined,"set-answer-input");input.dataset.setInput=q.id;input.setAttribute("role","group");input.setAttribute("aria-labelledby",labelId);fields.set(q.id,input);
      if(q.kind==="choice"){
        const group=node("fieldset"),legend=node("legend","Choose one answer · 1つ選んでください");group.append(legend);
        for(const [oi,option] of q.options.entries()){const label=node("label",undefined,"set-choice"),radio=node("input");radio.type="radio";radio.name=`${engine}-${q.id}`;radio.value=option.label;radio.checked=data.answers[q.id]===option.label;radio.disabled=data.submitted;
          radio.addEventListener("change",()=>edit(q,radio.value));label.append(radio,node("span",`${/^[A-Z]$/.test(option.label)?option.label:String.fromCharCode(65+oi)}. ${option.text}`));group.append(label);}input.append(group);
      }else if(q.kind==="sentence"){
        const chosen=node("div",undefined,"set-tiles"),tiles=node("div",undefined,"set-tiles");chosen.setAttribute("aria-label","Selected phrases · 選んだ語句");
        const draw=()=>{chosen.replaceChildren();tiles.replaceChildren();const value=data.answers[q.id];chosen.append(node("p",(q.frame||"{answer}").replace(/\{\d+\}/g,(m)=>q.tiles[value[Number(m.slice(1,-1))]]||"____").replace("{answer}",value.map(i=>q.tiles[i]).join(" "))));
          value.forEach((tile,i)=>{const b=node("button",`${q.tiles[tile]} ×`);b.type="button";b.disabled=data.submitted;b.dataset.setRemove=String(i);b.addEventListener("click",()=>{const next=[...value];next.splice(i,1);edit(q,next);draw();});chosen.append(b);});
          q.tiles.forEach((text,i)=>{const b=node("button",text);b.type="button";b.dataset.setTile=String(i);b.disabled=data.submitted||value.includes(i)||value.length>=q.slots;b.addEventListener("click",()=>{edit(q,[...value,i]);draw();});tiles.append(b);});};draw();input.append(chosen,tiles);
      }else if(q.kind==="compound"){
        q.fields.forEach((text,i)=>{const label=node("label",text,"set-field"),field=node("input");field.type="text";field.value=data.answers[q.id][i];field.maxLength=200;field.autocomplete="off";field.spellcheck=false;field.disabled=data.submitted;field.dataset.setField=String(i);field.addEventListener("input",()=>{const a=[...data.answers[q.id]];a[i]=field.value;edit(q,a);});label.append(field);input.append(label);});
      }else{
        const label=node("label",q.kind==="essay"||q.kind==="self"?"Your response · あなたの解答":"Your answer · あなたの解答","set-field");
        const field=node(q.kind==="essay"||q.kind==="self"?"textarea":"input");if(field.tagName==="INPUT")field.type="text";else field.rows=q.kind==="essay"?10:5;
        field.value=data.answers[q.id];field.maxLength=q.kind==="essay"||q.kind==="self"?20000:200;field.autocomplete="off";field.spellcheck=false;field.disabled=data.submitted;
        field.addEventListener("input",()=>edit(q,field.value));label.append(field);input.append(label);
      }
      if(q.kind==="essay"&&currentGroup.source){
        currentGroup.source.insertBefore(problem,currentGroup.passage);
        article.append(node("h4",`${index+1}. Your response · あなたの解答`));
      }else article.append(problem);
      article.append(input);currentGroup.questions.append(article);
    }
    function results(){return questions.map(q=>({id:q.id,answer:clone(data.answers[q.id]),...q.grade(clone(data.answers[q.id]))}));}
    function showReview(){
      submittedResults=results();review.replaceChildren();review.hidden=false;
      const scored=submittedResults.filter(r=>["correct","incorrect"].includes(r.result));
      review.append(node("h3",scored.length?`${scored.filter(r=>r.result==="correct").length} / ${scored.length} correct · 採点結果`:"Submitted · 全問の解答を提出しました"));
      review.append(node("p","Results reflect this completed set. Writing and self-review are not automatic exam scores. 作文・自己確認は公式得点へ換算しません。"));
      for(const [index,q]of questions.entries()){
        const result=submittedResults[index],item=node("article",undefined,"set-result");item.dataset.setResult=q.id;item.dataset.result=result.result;
        item.append(node("h4",`${index+1}. ${q.prompt} · ${result.result==="correct"?"✓ Correct":result.result==="incorrect"?"Needs review · 要復習":"Self-review · 自己確認"}`));
        item.append(node("p",`Your answer: ${result.answerText ?? (Array.isArray(result.answer)?result.answer.join(" / "):result.answer)}`));
        if(result.model)item.append(node("p",`Accepted / model answer: ${result.model}`));
        for(const text of Array.isArray(result.explanation)?result.explanation:[result.explanation])if(text)item.append(node("p",text));
        if(q.audio)item.append(node("p",`Transcript: ${q.audio}`));
        for(const[i,text]of(q.checks||[]).entries()){const label=node("label",undefined,"set-choice"),box=node("input");box.type="checkbox";box.dataset.setCheck=`${q.id}:${i}`;box.checked=data.checks[q.id]?.includes(i)||false;box.addEventListener("change",()=>{const prior=data.checks[q.id]||[];data.checks[q.id]=box.checked?[...new Set([...prior,i])]:prior.filter(n=>n!==i);save();});label.append(box,node("span",text));item.append(label);}
        if(q.kind==="self")for(const[value,text]of[["mastered","I understood it · 理解できた"],["review","Needs more practice · 要復習"]]){const label=node("label",undefined,"set-choice"),radio=node("input");radio.type="radio";radio.name=`self-${engine}-${q.id}`;radio.value=value;radio.checked=data.ratings[q.id]===value;radio.addEventListener("change",()=>{data.ratings[q.id]=value;save();});label.append(radio,node("span",text));item.append(label);}
        if(options.tutor){const bridge=node("div");item.append(bridge);window.ToeflChatGPTBridge?.mount(bridge,options.tutor(q.id,result));}
        feedbackNodes.set(q.id,item);review.append(item);
      }
      review.append(finish);update();
    }
    form.addEventListener("submit",event=>{
      event.preventDefault();if(data.submitted||!complete()){update();return;}
      const frozen=results();pause();data.submitted=true;for(const group of fields.values())group.querySelectorAll("input,textarea,button").forEach(n=>n.disabled=true);
      // No grading callbacks, statistics or tutor answer keys run until this point.
      options.onSubmit(frozen,{date,context});save();showReview();review.scrollIntoView({behavior:"smooth",block:"start"});
    });
    const closed=done=>document.dispatchEvent(new CustomEvent("toefl:set-closed",{detail:{engine,id:options.id,context,done}}));
    finish.addEventListener("click",()=>{if(!data.submitted||data.reviewed||finish.disabled)return;data.reviewed=true;save();options.onReview?.(submittedResults.map(r=>({...r,result:data.ratings[r.id]||r.result})),{date,context});host.hidden=true;options.onClose?.(true);closed(true);});
    function pause(){if(data.deadline!==null){data.remaining=Math.max(0,Math.ceil((data.deadline-Date.now())/1000));data.deadline=null;save();}}
    const hide=()=>{pause();host.hidden=true;};
    close.addEventListener("click",()=>{hide();options.onClose?.(false);closed(false);});
    const download=node("button","Download answers · 答案を保存","toefl-button toefl-button--secondary");download.type="button";download.addEventListener("click",()=>{
      const url=URL.createObjectURL(new Blob([JSON.stringify({format:"english-set-answers",engine,id:options.id,...data},null,2)],{type:"application/json"}));const a=node("a");a.href=url;a.download=`${engine}-answers-${date}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    });panel.append(download);
    let interval=null;
    if(options.minutes){const output=node("output"),toggle=node("button","Start timer · 時間を計る","toefl-button toefl-button--secondary");toggle.type="button";toggle.disabled=data.submitted;timer.append(output,toggle);
      const tick=()=>{const seconds=data.deadline===null?data.remaining:Math.max(0,Math.ceil((data.deadline-Date.now())/1000));output.textContent=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,"0")}`;toggle.textContent=data.deadline===null?"Start timer · 時間を計る":"Pause timer · 一時停止";toggle.disabled=data.submitted;if(!seconds&&data.deadline!==null){data.deadline=null;data.remaining=0;save();status.textContent="時間になりました。答案は保存されています。自分で全問を提出するまで採点しません。";}};
      toggle.addEventListener("click",()=>{if(data.deadline!==null)pause();else{if(!data.remaining)data.remaining=Number(options.minutes)*60;data.deadline=Date.now()+data.remaining*1000;save();}tick();});interval=setInterval(tick,500);tick();
    }
    const previous=engines.get(engine);if(previous?.interval!==null)clearInterval(previous?.interval);
    engines.set(engine,{host,pause,hide,interval,getState:()=>clone(data)});
    if(data.submitted)showReview();save();document.dispatchEvent(new CustomEvent("toefl:set-opened",{detail:{engine,id:options.id,context}}));host.scrollIntoView({behavior:"smooth",block:"start"});title.focus({preventScroll:true});return true;
  }
  window.addEventListener("pagehide",()=>{for(const r of engines.values())r.pause();});
  window.EnglishSetPractice=Object.freeze({open,required,available,getDrafts,active:engine=>engines.has(engine)&&!engines.get(engine).host.hidden,pause:engine=>engines.get(engine)?.pause(),getState:engine=>engines.get(engine)?.getState()});
})();
