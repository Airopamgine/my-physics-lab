(() => {
  "use strict";
  const root=document.getElementById("practice-hub");if(!root)return;
  const el=id=>document.getElementById(`practice-${id}`);
  const node=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
  const official="https://www.cambridgeenglish.org/exams-and-tests/qualifications/first/preparation/";
  const type=(id,title,detail,engine,extra={})=>({id,title,detail,engine,...extra});
  const skill=(id,title,detail,types)=>({id,title,detail,types});
  const exams=[
    {id:"toefl",title:"TOEFL",detail:"Academic and everyday English · 学術と日常の4技能",skills:[
      skill("reading","Reading","Read words, everyday texts and academic passages · 読む",[
        type("c-test","Complete the Words · C-test","Fill the missing letters in a whole text · 文章の文字補充","reading",{collection:"Task 1"}),
        type("daily-life","Read in Daily Life · 日常","Emails, notices and everyday documents · メール・掲示・日常文書","reading",{collection:"Task 2"}),
        type("academic","Read an Academic Passage","Ideas, evidence and inference · 学術文の要点・根拠・推論","reading",{collection:"Task 3"})]),
      skill("listening","Listening","Hear the message and connect the meaning · 聞く",[
        type("response","Listen and Choose a Response","Short response practice with a synthetic voice · 音声合成による短い応答練習","quick"),
        type("recordings","Real recordings · 実際の録音","Today's B2 listening and comprehension practice · 今日の録音・内容理解","daily",{work:"listening"})]),
      skill("writing","Writing","Build sentences and develop your response · 書く",[
        type("sentence","Build a Sentence","Put the phrases in order · 語句を並べて文を完成","writing",{task:"sentence"}),
        type("email","Write an Email","Make your purpose clear · 依頼・お礼・日程調整","writing",{task:"email"}),
        type("discussion","Academic Discussion","Support an opinion with reasons and examples · 理由と具体例","writing",{task:"discussion"}),
        type("grammar","Grammar & response","Supplementary grammar practice · 補助の文法演習","writing",{task:"grammar"})]),
      skill("speaking","Speaking","Repeat, explain and respond aloud · 話す",[
        type("repeat","Listen & Repeat","Hear, repeat and compare · 聞く → 再現 → 確認","repeat"),
        type("discussion","Opinion & response","Today's 60-second speaking practice · 意見・理由・応答の練習","daily",{work:"speaking"})])]},
    {id:"cambridge",title:"Cambridge B2 First",detail:"Reading & Use of English, listening, writing and speaking · ケンブリッジ英検対策",skills:[
      skill("reading","Reading & Use of English","Vocabulary, grammar and reading · 語彙・文法・読解",[
        type("part1","Part 1 · Multiple-choice cloze","Choose words that fit the context · 文脈に合う語を選ぶ","cambridge",{part:"1"}),
        type("part2","Part 2 · Open cloze","Supply the missing function word · 空所に1語補充","cambridge",{part:"2"}),
        type("part3","Part 3 · Word formation","Change the word to fit its role · 語形成・品詞の変換","cambridge",{part:"3"}),
        type("part4","Part 4 · Key word transformations","Express the same meaning in 2–5 words · 指定語で同じ意味に書き換え","cambridge",{part:"4"}),
        type("part5","Part 5 · Multiple choice","Find meaning, attitude and evidence · 意味・態度・根拠","cambridge",{part:"5"}),
        type("part6","Part 6 · Gapped text","Connect the ideas across sentences · 文と文のつながり","cambridge",{part:"6"}),
        type("part7","Part 7 · Multiple matching","Match ideas expressed in different words · 言い換えと対応づけ","cambridge",{part:"7"})]),
      skill("listening","Listening","Recorded speech and paraphrases · 音声と言い換え",[
        type("official-audio","Official listening samples","Use the official recordings and answer keys · 公式の録音・解答","resource",{url:official})]),
      skill("writing","Writing","Plan, write, compare and revise · 構成・執筆・見直し",[
        type("essay","Essay · エッセイ","Cover the notes and add your own idea · 指定の論点と自分の意見","cambridge",{part:"writing",form:"essay"}),
        type("review","Review · レビュー","Describe, evaluate and recommend · 描写・評価・推薦","cambridge",{part:"writing",form:"review"})]),
      skill("speaking","Speaking","Interaction and extended responses · やり取りと説明",[
        type("official-video","Official speaking samples","Observe the task and practise with a partner · 公式動画とペア練習","resource",{url:official})])]}];
  const panels=[...document.querySelectorAll("[data-practice-panel]")];
  let current="practice",active=null,launchRoute=null,selection=null,failed=new Set();
  const routeFor=(exam,skill,type)=>["practice",exam?.id,skill?.id,type?.id].filter(Boolean).join("/");
  const aliases={"daily-study":"today","english-coach":"progress","vocabulary-lab":"vocabulary","cambridge-lab":"practice/cambridge","writing-lab":"practice/toefl/writing","english-library":"practice/toefl/reading","repeat-lab":"practice/toefl/speaking/repeat"};
  function readRoute(){
    const raw=location.hash.slice(1);return aliases[raw]||raw||`practice${root.dataset.startRoute?"/"+root.dataset.startRoute:""}`;
  }
  function resolve(route){
    const [top,examId,skillId,typeId,...rest]=route.split("/");
    if(top!=="practice"||rest.length)return {};
    const exam=exams.find(e=>e.id===examId),skill=exam?.skills.find(s=>s.id===skillId),type=skill?.types.find(t=>t.id===typeId);
    if(examId&&!exam||skillId&&!skill||typeId&&!type)return {};
    return{exam,skill,type,valid:true};
  }
  function show(...names){for(const panel of panels)panel.hidden=!names.includes(panel.dataset.practicePanel);}
  function pause(){for(const engine of ["reading","writing","cambridge","quick","vocabulary"])window.EnglishSetPractice?.pause(engine);window.ToeflWritingLab?.pauseTimer();window.ToeflDailyStudy?.pause();window.speechSynthesis?.cancel();}
  function navigate(route){if(location.hash==="#"+route)render();else location.hash=route;}
  function breadcrumb(title,path){
    const box=el("breadcrumbs");if(box.children.length)box.append(node("span","/"));
    const n=node(path?"a":"span",title);if(path)n.href="#"+path;else n.setAttribute("aria-current","page");box.append(n);
  }
  function card(item,path,index,meta){
    const a=node("a",undefined,"practice-card");a.href="#"+path;a.dataset.practiceChoice=item.id;
    a.append(node("span",String(index+1).padStart(2,"0"),"practice-card__number"),node("strong",item.title),node("span",item.detail));
    if(meta)a.append(node("small",meta));return a;
  }
  function bankFor(engine){return engine==="reading"?window.ToeflReadingLab?.getBank():engine==="writing"?window.ToeflWritingLab?.getBank():engine==="cambridge"||engine==="repeat"?window.CambridgeLab?.getBank():engine==="quick"?window.ToeflQuickLab?.getQuestions():null;}
  function units(t){
    const bank=bankFor(t.engine);if(!bank)return null;
    if(t.engine==="reading"){
      const result=[];
      for(const set of bank.sets.filter(s=>s.collection===t.collection)){
        // A text is the unit of practice: retain every gap and its related questions.
        const groups=new Map();for(const q of set.questions){const key=q.passage??set.passage??set.id;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(q.id);}
        for(const ids of groups.values())result.push({id:set.id,ids,date:set.date||"",tags:[]});
      }return result;
    }
    if(t.engine==="cambridge")return bank.sets.filter(s=>String(s.part)===t.part&&(!t.form||s.skill.toLowerCase().startsWith(t.form))).map(s=>({id:s.id,ids:s.questions.map(q=>q.id),tags:s.questions.flatMap(q=>q.tags||[]),date:s.source?.date||""}));
    if(t.engine==="writing")return bank.exercises.filter(q=>q.type===t.task).map(q=>({id:q.id,ids:[q.id],date:q.source.date||"",tags:[]}));
    if(t.engine==="quick")return bank.filter(q=>q.section==="Listening").map(q=>({id:q.id,ids:[q.id],date:"",tags:[]}));
    return [];
  }
  function progress(engine){return engine==="reading"?window.ToeflReadingLab?.getProgress().answers||{}:engine==="writing"?window.ToeflWritingLab?.getProgress()||{}:engine==="cambridge"?window.CambridgeLab?.getProgress().records||{}:window.ToeflQuickLab?.getProgress()||{};}
  function answered(r,engine){if(!r)return false;if(engine==="writing")return Boolean(r.checked||r.rating||r.history?.length);if(engine==="cambridge")return Boolean(r.checked&&r.result);if(engine==="quick")return typeof r.correct==="boolean";return Boolean(r.result);}
  function wrong(r,engine){if(!r)return false;if(engine==="quick")return r.correct===false;return ["incorrect","review"].includes(r.result);}
  function isWrong(id,engine,records){
    const r=records[id];if(engine!=="writing")return wrong(r,engine);
    if(!r)return false;if(r.rating)return r.rating==="review";
    if(!r.checked)return false;const q=bankFor(engine).exercises.find(q=>q.id===id);
    if(q.type==="grammar")return r.choice!==q.correctIndex;
    return q.type==="sentence"&&!q.solutions.some(s=>s.length===r.selections.length&&s.every((i,j)=>q.tiles[i]===q.tiles[r.selections[j]]));
  }
  const hasAnswer=value=>Array.isArray(value)?value.some(v=>typeof v==="number"||typeof v==="string"&&v.trim()):typeof value==="string"&&Boolean(value.trim());
  function pending(t,list){
    const allIds=new Set(list.flatMap(u=>u.ids));
    for(const draft of (window.EnglishSetPractice?.getDrafts(t.engine)||[]).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0))){
      try{
        const [id,ids,context]=JSON.parse(draft.signature);
        if(!Array.isArray(ids)||!ids.length||!context||context.dailyDate||ids.some(q=>!allIds.has(q))||!draft.submitted&&!Object.values(draft.answers).some(hasAnswer))continue;
        if(["reading","cambridge"].includes(t.engine)&&!list.some(u=>u.id===id&&JSON.stringify(u.ids)===JSON.stringify(ids)))continue;
        if(t.engine==="writing"&&id!==ids.join(":"))continue;
        if(t.engine==="quick"&&id!=="quick-Listening-normal")continue;
        return{id,ids,context,resume:true,submitted:draft.submitted};
      }catch(_){}
    }return null;
  }
  function choose(t,reviewOnly=false){
    const list=units(t);if(!list)return null;
    const records=progress(t.engine);
    if(!reviewOnly){const draft=pending(t,list);if(draft)return draft;}
    const candidates=list.filter(u=>!reviewOnly||u.ids.some(id=>isWrong(id,t.engine,records)));
    const unseen=u=>u.ids.filter(id=>!answered(records[id],t.engine)).length;
    const mistakes=u=>u.ids.filter(id=>isWrong(id,t.engine,records)).length;
    const last=u=>Math.max(0,...u.ids.map(id=>Date.parse(records[id]?.attemptedAt||records[id]?.date||records[id]?.history?.at(-1)?.at||"")||0));
    const weights=window.EnglishCoach?.yesterday(window.EnglishCoach.day()).tags||{};
    const relevance=u=>(u.tags||[]).reduce((n,tag)=>n+(weights[tag]||0),0);
    candidates.sort((a,b)=>Number(unseen(b)>0)-Number(unseen(a)>0)||Number(unseen(b)===b.ids.length)-Number(unseen(a)===a.ids.length)||
      (unseen(a)||unseen(b)?relevance(b)-relevance(a):mistakes(b)-mistakes(a)||last(a)-last(b))||a.id.localeCompare(b.id)||a.ids[0].localeCompare(b.ids[0]));
    if(!candidates.length)return null;
    if(["writing","quick"].includes(t.engine)){
      const fresh=candidates.filter(u=>unseen(u)>0),pool=reviewOnly?candidates:fresh.length?fresh:candidates;
      const ids=pool.slice(0,t.engine==="quick"?5:["sentence","grammar"].includes(t.task)?5:1).flatMap(u=>u.ids);
      return{id:t.engine==="quick"?"quick-Listening-normal":ids.join(":"),ids};
    }return candidates[0];
  }
  function counts(t){
    const list=units(t);if(!list)return null;const records=progress(t.engine),ids=[...new Set(list.flatMap(u=>u.ids))];
    return{total:ids.length,unanswered:ids.filter(id=>!answered(records[id],t.engine)).length,review:ids.filter(id=>isWrong(id,t.engine,records)).length};
  }
  function summary(t){if(t.engine==="daily")return"Today's guided activity · 今日の練習";if(t.engine==="resource")return"Official samples ↗ · 公式教材";if(t.engine==="repeat")return"Listen → repeat → compare · 聞く・再現・確認";const c=counts(t);return c?`${c.unanswered} unanswered · 未回答 / ${c.total} tasks`:"";}
  function selectionView(t){
    el("selection").hidden=false;el("selection-title").textContent=t.title;el("status").textContent="";el("review").hidden=true;el("reload").hidden=true;el("start").disabled=false;
    const engine=t.engine==="repeat"?"cambridge":t.engine;
    if(["reading","writing","cambridge","quick"].includes(t.engine)){
      const c=counts(t);selection=choose(t);
      if(!c){el("counts").textContent="Loading practice · 教材を読み込み中…";el("start").disabled=true;el("selection-note").textContent="学習記録と教材を確認しています。";el("reload").hidden=false;el("status").textContent=failed.has(engine)?"Could not load this practice. 再読み込みを押してください。他の技能も練習できます。":"";return;}
      el("counts").textContent=`${c.unanswered} unanswered · 未回答 / ${c.total} tasks · ${c.review} to review · 要復習`;
      el("start").disabled=!selection;el("review").hidden=!c.review;
      el("start").textContent=selection?.resume?selection.submitted?"Continue review · 解説の確認を再開":"Resume saved set · 途中のセットを再開":c.unanswered?"Start next set · 次の未回答セットへ":"Practise again · 復習する";
      el("selection-note").textContent=selection?.resume?"Your saved answers are ready. 保存した答案から続けます。":c.unanswered?"We'll choose the next unanswered set for this question type. 問題は自動で選び、同じ本文の設問をまとめて出します。":"You've attempted every available task in this category. 間違いと以前の答案を優先して復習します。";
      if(!selection)el("status").textContent="No practice is available in this category yet · この形式の教材は準備中です。";
    }else if(t.engine==="repeat"){
      const bank=bankFor(t.engine),done=window.CambridgeLab?.getProgress().repeats||{};
      el("counts").textContent=bank?`${bank.repeat.filter(q=>!done[q.en]).length} not yet practised · 未練習 / ${bank.repeat.length} sentences`:"Loading sentences…";
      el("selection-note").textContent="Listen once, repeat aloud, then reveal and compare. 聞いて再現した後に英文を表示し、Next sentenceで練習を記録します。音声合成を使い、発音は自己確認です。";
      el("start").textContent="Start Listen & Repeat";el("start").disabled=!bank;el("reload").hidden=Boolean(bank);
    }else{
      el("counts").textContent=t.engine==="resource"?"Official external material · 公式の外部教材":"Today's guided practice · 今日の練習";
      el("selection-note").textContent=t.engine==="resource"?"Open the official preparation page for sample papers, recordings, keys and speaking videos. 公式ページで該当の技能を選んで練習します。外部での解答はこのサイトでは自動記録されません。":"A guided activity opens with today's topic and a checklist. 今日の教材・話題で練習し、内容を自分で確認して記録します。試験の全形式を再現したものではありません。";
      el("start").textContent=t.engine==="resource"?"Open official practice ↗":"Start today's practice · 今日の練習へ";
    }
  }
  function render(){
    current=readRoute();if(!["today","progress","vocabulary","review"].includes(current)&&!resolve(current).valid)current="practice";
    for(const panel of panels)panel.classList.remove("practice-engine","practice-daily-active");
    show();root.hidden=current!=="practice"&&!current.startsWith("practice/");el("active-bar").hidden=true;
    document.querySelectorAll("[data-study-tab]").forEach(a=>{if(a.dataset.studyTab===current.split("/")[0])a.setAttribute("aria-current","page");else a.removeAttribute("aria-current");});
    if(root.hidden){show(current);document.dispatchEvent(new CustomEvent("toefl:view-changed",{detail:{view:current}}));return;}
    const {exam,skill,type}=resolve(current);const choices=el("choices");choices.replaceChildren();el("breadcrumbs").replaceChildren();
    breadcrumb("Practice",exam?"practice":null);if(exam)breadcrumb(exam.title,skill?routeFor(exam):null);if(skill)breadcrumb(skill.title,type?routeFor(exam,skill):null);if(type)breadcrumb(type.title);
    el("title").textContent=type?.title||skill?.title||exam?.title||"What would you like to practise?";
    el("eyebrow").textContent=type?`${exam.title} · ${skill.title}`:skill?"Choose a question type · 問題形式":exam?"Choose a skill · 技能":"Choose an exam · 試験";
    el("description").textContent=type?.detail||skill?.detail||exam?.detail||"Choose an exam, then a skill and question type. 試験 → 技能 → 問題形式の順に選びます。";
    el("selection").hidden=true;choices.className="practice-choices";
    if(type)selectionView(type);
    else if(skill){choices.classList.add("practice-choices--types");skill.types.forEach((t,i)=>choices.append(card(t,routeFor(exam,skill,t),i,summary(t))));}
    else if(exam){choices.classList.add("practice-choices--skills");exam.skills.forEach((s,i)=>choices.append(card(s,routeFor(exam,s),i,`${s.types.length} question types · 問題形式`)));}
    else exams.forEach((e,i)=>choices.append(card(e,routeFor(e),i,"4 skills · 4技能")));
  }
  function opened(engine,context={}){
    const route=launchRoute||context.practiceRoute||(context.dailyDate?"today":current);active={engine,route};launchRoute=null;
    root.hidden=true;show(engine);const panel=panels.find(p=>p.dataset.practicePanel===engine);if(engine==="today")panel?.classList.add("practice-daily-active");else if(engine!=="vocabulary")panel?.classList.add("practice-engine");
    const info=resolve(route);el("active-label").textContent=info.type?`${info.exam.title} / ${info.skill.title} / ${info.type.title}`:route==="today"?"Today's learning route · 今日の学習":"Practice · 練習中";
    el("back").href="#"+route;el("active-bar").hidden=false;
  }
  function launch(review=false){
    const {type}=resolve(current);if(!type)return;const choice=review?choose(type,true):choose(type);launchRoute=current;
    const context=choice?.context||{practiceRoute:current};let started=false;
    if(type.engine==="reading"&&choice)started=window.ToeflReadingLab.startSelection(choice.id,choice.ids,context);
    else if(type.engine==="cambridge"&&choice)started=window.CambridgeLab.startSelection(choice.id,choice.ids,context);
    else if(type.engine==="writing"&&choice)started=window.ToeflWritingLab.startSelection(choice.ids,context);
    else if(type.engine==="quick"&&choice)started=window.ToeflQuickLab.startSelection("Listening",choice.ids,context);
    else if(type.engine==="repeat"&&window.CambridgeLab?.startRepeat()){opened("repeat",context);document.getElementById("repeat-lab").scrollIntoView({behavior:"smooth",block:"start"});started=true;}
    else if(type.engine==="daily")started=window.ToeflDailyStudy?.startSkill(type.work);
    else if(type.engine==="resource"){window.open(type.url,"_blank","noopener,noreferrer");started=true;launchRoute=null;el("status").textContent="Opened the official preparation page · 公式の準備ページを別タブで開きました。";}
    if(!started){launchRoute=null;el("status").textContent="Practice is still loading. 再読み込みを押すか、少し待ってもう一度お試しください。";el("reload").hidden=false;}
  }
  el("start").addEventListener("click",()=>launch());el("review").addEventListener("click",()=>launch(true));
  el("reload").addEventListener("click",()=>{const {type}=resolve(current);const engine=type?.engine==="repeat"?"cambridge":type?.engine;document.getElementById(engine==="reading"?"library-refresh":engine==="cambridge"?"cambridge-retry":engine==="writing"?"writing-retry":"daily-retry")?.click();el("status").textContent="Reloading practice · 教材を再読み込みしています…";});
  el("back").addEventListener("click",event=>{event.preventDefault();pause();const route=active?.route||"practice";active=null;if(readRoute()===route)render();else navigate(route);el("title")?.focus({preventScroll:true});});
  document.querySelectorAll("[data-study-tab]").forEach(link=>link.addEventListener("click",event=>{if(active&&readRoute()===link.hash.slice(1)){event.preventDefault();pause();active=null;render();}}));
  document.addEventListener("toefl:set-opened",event=>opened(event.detail.engine,event.detail.context));
  document.addEventListener("toefl:set-closed",event=>{if(active?.engine!==event.detail.engine)return;const route=active.route;active=null;if(readRoute()===route)render();else navigate(route);if(route.startsWith("practice"))el("start").focus({preventScroll:true});});
  document.addEventListener("toefl:daily-work-opened",()=>{opened("today",{});});
  document.addEventListener("toefl:daily-work-closed",()=>{const route=active?.route||"today";active=null;if(readRoute()===route)render();else navigate(route);});
  for(const engine of ["reading","writing","cambridge"]){
    document.addEventListener(`toefl:${engine}-ready`,()=>{failed.delete(engine);if(!active)render();});
    document.addEventListener(`toefl:${engine}-unavailable`,()=>{failed.add(engine);if(!active)render();});
  }
  document.addEventListener("toefl:unlocked",()=>{if(!active)render();});
  window.addEventListener("hashchange",()=>{pause();active=null;render();});
  window.EnglishPracticeHub=Object.freeze({exams,navigate,openPanel:(engine,returnTo="review")=>opened(engine,{practiceRoute:returnTo}),choose:(route,review=false)=>{const {type}=resolve(route);return type?choose(type,review):null;}});
  render();
})();
