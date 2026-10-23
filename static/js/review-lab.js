(() => {
  "use strict";
  const root=document.getElementById("review-lab");if(!root)return;
  const KEY="mastersPhysicsLab.reviewAnswers.v1",PREFIX="mastersPhysicsLab.",PAGE=20;
  const el=id=>document.getElementById(`review-${id}`);
  const object=x=>x&&typeof x==="object"&&!Array.isArray(x);
  const text=x=>typeof x==="string"?x:"";
  const copy=x=>JSON.parse(JSON.stringify(x));
  const node=(tag,value,cls)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;if(cls)n.className=cls;return n;};
  const read=key=>{try{return JSON.parse(localStorage.getItem(PREFIX+key)||"null");}catch(_){return null;}};
  const stamp=x=>Number.isFinite(x)?x:Date.parse(x)||0;
  const validDate=x=>typeof x==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x));
  const isResult=r=>["correct","incorrect","submitted","mastered","review","self-reviewed","revealed"].includes(r);
  const engines=["reading","writing","cambridge","quick"];
  const key=(engine,id)=>`${engine}|${id}`;
  const resultLabel=r=>({correct:"Correct · 正解",incorrect:"Needs review · 誤答",review:"Needs review · 要復習",mastered:"Understood · 自己確認済み",submitted:"Submitted · 作文・記述", "self-reviewed":"Self-reviewed · 自己確認済み",revealed:"Answer revealed · 解答を確認"}[r]||"Saved · 記録あり");
  const skillLabel=s=>({reading:"Reading",writing:"Writing",listening:"Listening",speaking:"Speaking",vocabulary:"Vocabulary"}[s]||"Other · その他");
  const examLabel=s=>({toefl:"TOEFL",cambridge:"Cambridge B2 First",vocabulary:"Vocabulary"}[s]||s);
  let unlocked=false,ledger={},items=[],selected=null,page=0,archive=null,archiveTried=false,vocabularyRaw=null,vocabularyTried=false;
  let busy=false,again=false,warning="",loadWarning="";
  let initialWriting={},initialCambridge={};
  const index=new Map();let vocabularyBank=null,vocabularyEntries=new Map();
  function restore(){
    const saved=read("reviewAnswers.v1");if(!saved)return;
    if(saved.version!==1||!object(saved.records)){warning="復習用の記録を読み込めません。教材側に残る記録を表示します。";return;}
    for(const[k,r]of Object.entries(saved.records))if(object(r)&&engines.includes(r.engine)&&typeof r.id==="string"&&r.id.length<300&&k===key(r.engine,r.id)&&isResult(r.result)){
      const answer=typeof r.answer==="string"?r.answer.slice(0,20000):Array.isArray(r.answer)&&r.answer.length<=100?r.answer.filter(v=>typeof v==="string"||Number.isInteger(v)):null;
      ledger[k]={engine:r.engine,id:r.id,result:r.result,answer,answerText:text(r.answerText).slice(0,20000),date:validDate(r.date)?r.date:"",at:stamp(r.at),title:text(r.title).slice(0,500),hadMistake:r.hadMistake===true||r.result==="incorrect",captured:r.captured===true};
    }
  }
  function capture(event){
    if(!unlocked)return;const d=event.detail||{};restore();
    if(engines.includes(d.engine)&&Array.isArray(d.results)){
      for(const row of d.results){if(typeof row.id!=="string"||!isResult(row.result))continue;const k=key(d.engine,row.id),old=ledger[k];
        ledger[k]={engine:d.engine,id:row.id,result:event.type==="toefl:set-reviewed"&&row.result==="submitted"?"self-reviewed":row.result,answer:copy(row.answer??null),answerText:text(row.answerText),date:d.date,at:d.at,title:d.title,hadMistake:old?.hadMistake===true||row.result==="incorrect",captured:true};
      }
      try{localStorage.setItem(KEY,JSON.stringify({version:1,records:ledger}));warning="";}catch(_){warning="新しい復習用の記録を保存できません。教材側の記録は引き続き表示します。";}
    }
    if(!root.hidden)refresh();
  }
  function add(engine,id,data){index.set(key(engine,id),{engine,id,...data});}
  function buildIndex(){
    index.clear();
    for(const bank of [window.ToeflReadingLab?.getBank(),archive])for(const s of bank?.sets||[])for(const q of s.questions){
      if(index.has(key("reading",q.id)))continue;
      const kind={"Task 1":"C-test · Complete the Words","Task 2":"Daily Life · 日常文","Task 3":"Academic Passage · 学術文"}[s.collection]||`Archive · ${s.collection}`;
      add("reading",q.id,{exam:"toefl",skill:"reading",type:kind,title:s.title,prompt:[q.label,q.prompt].filter(Boolean).join(" · "),passage:q.passage??s.passage??"",options:q.options||[],model:q.answer,
        explanation:[s.verificationNote,...(s.notes||[]).map(n=>typeof n==="string"?n:`${n.term} — ${n.definition}`)].filter(Boolean),set:s,question:q});
    }
    for(const q of window.ToeflWritingLab?.getBank()?.exercises||[]){const names={sentence:"Build a Sentence",grammar:"Grammar & response",email:"Write an Email",discussion:"Academic Discussion"};
      add("writing",q.id,{exam:"toefl",skill:"writing",type:names[q.type],title:q.title,prompt:[q.prompt,q.frame?.join("").replace(/\{\d+\}/g,"____"),...(q.requirements||[])].filter(Boolean).join("\n"),
        passage:[q.professor,q.to?`To: ${q.to}\nSubject: ${q.subject}`:"",q.context,...(q.posts||[]).map(p=>`${p.name}: ${p.text}`)].filter(Boolean).join("\n\n"),options:q.choices?.map((t,i)=>({label:String(i),text:t}))||[],model:q.modelAnswer,explanation:[q.editorNote,...q.explanation,...q.phrases].filter(Boolean),question:q});
    }
    for(const s of window.CambridgeLab?.getBank()?.sets||[])for(const q of s.questions)add("cambridge",q.id,{exam:"cambridge",skill:s.part==="writing"?"writing":"reading",type:s.part==="writing"?s.skill.split(" · ")[0]:`Part ${s.part}`,title:s.title,
      prompt:[q.prompt,q.stem,q.keyword?`Key word: ${q.keyword}`:"",q.base?`Base word: ${q.base}`:""].filter(Boolean).join("\n"),passage:s.passage||"",options:q.options||[],model:q.model||q.answers?.join(" / "),explanation:[q.explanation],set:s,question:q});
    for(const q of window.ToeflQuickLab?.getQuestions()||[])add("quick",q.id,{exam:"toefl",skill:q.section.toLowerCase(),type:q.task,title:q.task,prompt:q.prompt||q.instruction,passage:(q.passage||"").replace(/\{\{(\d+)\}\}/g,(_,i)=>`[${Number(i)+1}] ____`),audio:q.audioText||"",
      options:q.options?.map((t,i)=>({label:String(i),text:t}))||[],model:q.gaps?q.gaps.map(g=>`${g.answer} → ${g.word}`).join(" / "):q.answerWords?.join(" ")||q.options?.[q.answer],explanation:[q.explanation,q.explanationJa,...q.vocabulary.map(v=>v.join(" — "))],question:q});
    const vb=window.ToeflVocabularyLab?.getBank();if(vb&&vb!==vocabularyBank){vocabularyBank=vb;vocabularyEntries=new Map(vb.entries.map(e=>[e.id,e]));}
  }
  function vocabDescription(id,r){
    const bank=window.ToeflVocabularyLab?.getBank(),c=window.ToeflVocabularyLab?.getCard?.(id),e=c&&bank?.entries[c.entry];
    const definition=entry=>{if(!entry)return"";if(c.mode==="glossary")return(entry.id===e.id?c.gloss:entry.quizGlosses?.[0])?.text||entry.quizGlosses?.[0]?.text||"";return entry.dictionary?.map(d=>bank.senses[d.sense]?.definition).find(Boolean)||"";};
    const model=e?(c.mode==="glossary"?c.gloss.text:c.mode==="dictionary"?bank.senses[c.sense]?.definition:e.quizGlosses.map(g=>g.text).join(" / ")):"";
    return{engine:"vocabulary",id,exam:"vocabulary",skill:"vocabulary",type:c?.mode==="glossary"?"Japanese meaning · 日本語の意味":c?.mode==="dictionary"?"English definition · 英語の定義":"Earlier vocabulary · 過去の語彙",title:e?.term||id.split("|")[0].replace(/^vocab:/,""),prompt:e?.term||id,passage:e?.contexts[0]?.text||"",model,
      explanation:e?[...(c.mode==="dictionary"?[`Base form: ${c.lemma} · ${bank.senses[c.sense]?.pos}`]:[c?.gloss?.english]),...e.quizGlosses.map(g=>g.text)].filter(Boolean):[],answerText:text(r.answerText)||(r.answer?definition(vocabularyEntries.get(r.answer)):""),canRetry:Boolean(c&&!c.archived),card:c};
  }
  function answerText(entry,value){
    if(value===null||value===undefined)return"";
    const q=entry?.question;
    if(entry?.engine==="writing"&&q?.type==="sentence"&&Array.isArray(value))return q.frame.join("").replace(/\{(\d+)\}/g,(_,i)=>q.tiles[value[Number(i)]]||"____");
    if(entry?.engine==="quick"&&q?.kind==="sentence"&&Array.isArray(value))return value.map(i=>(q.overrideTiles||q.tiles)[i]).join(" ");
    const option=entry?.options?.find(o=>o.label===String(value));if(option)return`${/^[A-Z]$/.test(option.label)?option.label:String.fromCharCode(65+entry.options.indexOf(option))}. ${option.text}`;
    return Array.isArray(value)?value.join(" / "):String(value);
  }
  function collect(){
    buildIndex();const found=new Map();
    const put=(engine,id,r)=>{if(!isResult(r.result))return;const k=key(engine,id),old=found.get(k),meta=index.get(k)||{engine,id,exam:engine==="cambridge"?"cambridge":"toefl",skill:engine==="writing"?"writing":"reading",type:"Saved question · 保存済み",title:r.title||id,prompt:id,model:"",explanation:[]};
      found.set(k,{...meta,...r,title:meta.question?meta.title:r.title||meta.title,key:k,at:stamp(r.at||r.date),hadMistake:old?.hadMistake===true||r.hadMistake===true||["incorrect","review"].includes(r.result),answerText:r.answerText||answerText(meta,r.answer)});};
    const rows=window.EnglishCoach?.getRows?.()||read("englishCoach.v1")?.rows||[];
    for(const r of [...rows].sort((a,b)=>stamp(a.date)-stamp(b.date)))if(engines.includes(r.engine)&&typeof r.id==="string")put(r.engine,r.id,{result:r.last||r.first,answer:r.first===r.last?r.answer:null,date:r.date,title:r.title,hadMistake:r.first==="incorrect",note:r.first!==r.last?"A retry changed the result; the original ledger does not retain that retry's exact response. 再解答後の解答文はこの古い記録には残っていません。":""});
    const reading=window.ToeflReadingLab?.getProgress().answers||read("englishLibraryProgress.v1")?.answers||{};
    for(const[id,r]of Object.entries(reading))if(object(r)&&isResult(r.result))put("reading",id,{result:r.result,answer:r.submitted??null,at:stamp(r.attemptedAt)});
    const writing={...initialWriting,...(read("writingLab.v1")?.records||{}),...(window.ToeflWritingLab?.getProgress()||{})};
    for(const[id,r]of Object.entries(writing)){if(!object(r))continue;const q=index.get(key("writing",id))?.question,essay=q&&["email","discussion"].includes(q.type),last=r.history?.at(-1);
      if(essay&&(last||r.rating))put("writing",id,{result:r.rating==="review"?"review":r.rating==="done"?"self-reviewed":"submitted",answer:last?.text??null,at:stamp(last?.at)});
      else if(r.checked&&q){const correct=q.type==="grammar"?r.choice===q.correctIndex:q.solutions.some(s=>s.length===r.selections.length&&s.every((i,j)=>q.tiles[i]===q.tiles[r.selections[j]]));put("writing",id,{result:r.rating==="review"?"review":correct?"correct":"incorrect",answer:q.type==="grammar"?String(r.choice):r.selections});}
      else if(!q&&(r.checked||r.rating||last))put("writing",id,{result:r.rating==="review"?"review":"submitted",answer:last?.text||r.answer||null,at:stamp(last?.at)});
    }
    const rawCambridge=read("cambridgeLab.v1")||{},liveCambridge=window.CambridgeLab?.getProgress()||{},cambridge={...initialCambridge,...rawCambridge,...liveCambridge,records:{...initialCambridge.records,...rawCambridge.records,...liveCambridge.records},repeats:{...initialCambridge.repeats,...rawCambridge.repeats,...liveCambridge.repeats}};
    for(const[id,r]of Object.entries(cambridge.records||{}))if(r?.checked&&isResult(r.result))put("cambridge",id,{result:r.result==="submitted"&&r.reviewed?"self-reviewed":r.result,answer:r.answer,date:r.date});
    const quick=window.ToeflQuickLab?.getProgress()||read("toeflProgress.v1")?.attempts||{};
    for(const[id,r]of Object.entries(quick))if(typeof r?.correct==="boolean")put("quick",id,{result:r.correct?"correct":"incorrect",answer:r.submitted??null,at:stamp(r.attemptedAt)});
    // A submitted-but-not-yet-reviewed set can contain self-assessed responses
    // absent from old per-engine records. Never include an unsubmitted draft.
    for(const engine of engines){const s=read(`setAnswers.v1:${engine}`);if(s?.submitted!==true||!object(s.answers))continue;for(const[id,answer]of Object.entries(s.answers))if(!found.has(key(engine,id))&&(typeof answer==="string"&&answer.trim()||Array.isArray(answer)&&answer.length))put(engine,id,{result:"submitted",answer,date:s.date});}
    for(const r of Object.values(ledger)){const prior=found.get(key(r.engine,r.id));if(prior&&(!r.captured||prior.at>r.at&&prior.answerText)){prior.hadMistake||=r.hadMistake;continue;}put(r.engine,r.id,{...r,hadMistake:prior?.hadMistake||r.hadMistake,note:""});}
    const vp=window.ToeflVocabularyLab?.getBank()?window.ToeflVocabularyLab.getProgress():null;
    const vocab={...(vocabularyRaw?.records||{}),...(vp?.records||{})};
    for(const[id,r]of Object.entries(vocab))if(object(r)&&r.attempts>0&&isResult(r.result)){const desc=vocabDescription(id,r);found.set(key("vocabulary",id),{...desc,key:key("vocabulary",id),result:r.result,answer:r.answer||null,answerText:desc.answerText,at:stamp(r.last),hadMistake:r.wrong>0});}
    const repeats=cambridge.repeats||{};
    for(const[en,date]of Object.entries(repeats))if(validDate(date)){const q=window.CambridgeLab?.getBank()?.repeat.find(q=>q.en===en);found.set(key("repeat",en),{key:key("repeat",en),engine:"repeat",id:en,exam:"toefl",skill:"speaking",type:"Listen & Repeat",title:en,prompt:en,passage:q?.ja||"",model:en,explanation:[q?.note].filter(Boolean),result:"self-reviewed",answer:null,note:"Spoken responses were self-checked; no recording was saved. 発話は自己確認で、録音は保存していません。",date,at:stamp(date)});}
    const daily=window.ToeflDailyStudy?.getPlan()?window.ToeflDailyStudy.getProgress():read("dailyStudy.v1");
    for(const[date,day]of Object.entries(daily?.days||{}))if(validDate(date))for(const step of day.steps||[])if(step.complete===true&&["listening","speaking"].includes(step.engine)){
      const id=`${date}:${step.slot}`,q=step.engine==="speaking"?index.get(key("writing",step.ids?.[0]))?.question:null,plan=window.ToeflDailyStudy?.getPlan(),audio=plan?.listening.find(q=>q.id===step.ids?.[0]);
      found.set(key("daily",id),{key:key("daily",id),engine:"daily",id,exam:"toefl",skill:step.engine,type:step.engine==="listening"?"Real recordings · 録音の練習":"Opinion & response",title:step.title,prompt:step.detail,passage:q?.context||audio?.title||"",model:"",explanation:["Self-checked practice; this is not an automatically graded answer. 自分で内容を確認した練習記録です。"],result:"self-reviewed",answer:step.notes,answerText:step.notes,date,at:stamp(date),slot:step.slot,url:audio?plan.listeningBase+audio.id:null});
    }
    items=[...found.values()].sort((a,b)=>b.at-a.at||a.key.localeCompare(b.key));
  }
  function options(select,values,label){const value=select.value;select.replaceChildren(new Option(label,"all"));for(const[v,t]of values)select.append(new Option(t,v));if([...select.options].some(o=>o.value===value))select.value=value;}
  function filterOptions(){
    const exam=el("exam").value,area=items.filter(r=>exam==="all"||r.exam===exam);
    options(el("skill"),[...new Set(area.map(r=>r.skill))].sort().map(v=>[v,skillLabel(v)]),"All skills · すべて");
    const skill=el("skill").value,types=[...new Set(area.filter(r=>skill==="all"||r.skill===skill).map(r=>r.type))].sort();options(el("type"),types.map(v=>[v,v]),"All types · すべて");
  }
  function filtered(){const query=el("search").value.normalize("NFKC").toLowerCase().trim(),exam=el("exam").value,skill=el("skill").value,type=el("type").value,result=el("result").value;
    return items.filter(r=>(exam==="all"||r.exam===exam)&&(skill==="all"||r.skill===skill)&&(type==="all"||r.type===type)&&(result==="all"||result==="correct"&&r.result==="correct"||result==="review"&&["incorrect","review"].includes(r.result)||result==="mistakes"&&r.hadMistake||result==="self"&&!["correct","incorrect","review"].includes(r.result))&&(!query||[r.title,r.prompt,r.passage,r.answerText,r.id].map(text).join(" ").normalize("NFKC").toLowerCase().includes(query)));}
  const dateLabel=r=>validDate(r.date)?r.date:r.at?new Date(r.at).toLocaleDateString():"Date not saved · 日付記録なし";
  const clip=(value,n)=>text(value).length>n?text(value).slice(0,n)+"…":text(value);
  function list(){
    filterOptions();const rows=filtered(),pages=Math.max(1,Math.ceil(rows.length/PAGE));page=Math.min(page,pages-1);
    el("count").textContent=`${rows.length} matching / ${items.length} saved answered questions · 解答済み（正解・誤答・自己確認を含む）`;
    const list=el("list");list.replaceChildren();
    for(const r of rows.slice(page*PAGE,(page+1)*PAGE)){const card=node("article",undefined,"review-item");card.dataset.reviewItem=r.key;const top=node("div",undefined,"review-item__top"),badge=node("span",resultLabel(r.result),"review-badge");badge.dataset.result=r.result;
      top.append(badge,node("span",dateLabel(r)));const button=node("button","View response & explanation · 解答と解説を見る","toefl-button toefl-button--secondary");button.type="button";button.dataset.reviewOpen=r.key;button.addEventListener("click",()=>open(r.key));
      card.append(top,node("p",`${examLabel(r.exam)} · ${skillLabel(r.skill)} · ${r.type}`,"review-meta"),node("h3",r.title),node("p",clip(r.prompt,180),"review-preview"),node("p",r.answerText?`Your response: ${clip(r.answerText,180)}`:"Response text not saved · 解答文の記録なし","review-preview"),button);list.append(card);
    }
    if(!rows.length)list.append(node("p",items.length?"No matching answered questions. 検索や絞り込みを変更してください。":"Your submitted questions will appear here. このブラウザで解答を提出すると、正解・誤答の両方がここに表示されます。"));
    el("pagination").hidden=rows.length<=PAGE;el("previous").disabled=page===0;el("next").disabled=page===pages-1;el("page").textContent=`${page+1} / ${pages} · ${rows.length?page*PAGE+1:0}–${Math.min((page+1)*PAGE,rows.length)}`;
  }
  function paragraphs(parent,title,content){parent.append(node("h4",title));for(const s of Array.isArray(content)?content:[content])if(s)parent.append(node("p",s,"review-text"));}
  function open(id,focus=true){const r=items.find(r=>r.key===id);if(!r)return;selected=id;el("browser").hidden=true;el("detail").hidden=false;el("question-title").textContent=r.title;el("question-meta").textContent=`${examLabel(r.exam)} · ${skillLabel(r.skill)} · ${r.type} · ${dateLabel(r)} · ${resultLabel(r.result)}`;
    const left=el("source"),right=el("answer");left.replaceChildren();right.replaceChildren();paragraphs(left,"Question & source · 問題・本文",[r.passage,r.prompt]);if(r.options?.length)paragraphs(left,"Options · 選択肢",r.options.map((o,i)=>`${/^[A-Z]$/.test(o.label)?o.label:String.fromCharCode(65+i)}. ${o.text}`));if(r.audio)paragraphs(left,"Transcript · 音声の文字起こし",r.audio);
    if(r.url){const a=node("a","Open the recording · 録音を開く ↗");a.href=r.url;a.target="_blank";a.rel="noopener noreferrer";left.append(a);}
    paragraphs(right,"Your saved response · 保存された解答",r.answerText||"The earlier record contains no response text. 古い記録には解答文が保存されていません。");
    if(r.model)paragraphs(right,"Accepted / model answer · 正解・解答例",r.model);else if(!r.explanation?.length)paragraphs(right,"Source unavailable · 教材を取得できません","The saved result remains available. 教材が見つからないため、保存された結果のみ表示しています。");
    if(r.explanation?.length)paragraphs(right,"Explanation · 解説",r.explanation);if(r.note)paragraphs(right,"About this record · 記録について",r.note);
    const can=r.engine==="reading"?Boolean(window.ToeflReadingLab?.getBank()?.sets.some(s=>s.id===r.set?.id)):r.engine==="writing"||r.engine==="quick"?Boolean(r.question):r.engine==="cambridge"?Boolean(r.set):r.engine==="vocabulary"?r.canRetry:r.engine==="repeat"?Boolean(window.CambridgeLab?.getBank()):r.engine==="daily"?Boolean(window.ToeflDailyStudy?.getPlan()):false;
    el("retry").disabled=!can;el("detail-status").textContent="Viewing saved work does not change your scores. 閲覧だけでは成績や未回答数は変わりません。";
    if(focus){el("detail").scrollIntoView({behavior:"smooth",block:"start"});el("question-title").focus({preventScroll:true});}
  }
  function retry(){const r=items.find(r=>r.key===selected);if(!r)return;const context={practiceRoute:"review"};let started=false;
    if(r.engine==="reading"){const passage=r.question.passage??r.set.passage;const ids=r.set.questions.filter(q=>(q.passage??r.set.passage)===passage).map(q=>q.id);started=window.ToeflReadingLab.startSelection(r.set.id,ids,context);}
    else if(r.engine==="writing")started=window.ToeflWritingLab.startSelection([r.id],context);
    else if(r.engine==="cambridge")started=window.CambridgeLab.startSelection(r.set.id,r.set.questions.map(q=>q.id),context);
    else if(r.engine==="quick")started=window.ToeflQuickLab.startSelection(r.question.section,[r.id],context);
    else if(r.engine==="vocabulary")started=window.ToeflVocabularyLab.startCards([r.id]);
    else if(r.engine==="repeat"){started=window.CambridgeLab.startRepeat(r.id);if(started)window.EnglishPracticeHub.openPanel("repeat","review");}
    else if(r.engine==="daily")started=window.ToeflDailyStudy.openCompleted(r.date,r.slot);
    if(!started)el("detail-status").textContent="This practice could not be reopened. 教材の読み込み状態を確認し、一覧を更新してください。";
  }
  async function refresh(){
    if(!unlocked||root.hidden)return;if(busy){again=true;return;}busy=true;el("refresh").disabled=true;
    try{
      collect();
      if(!archiveTried&&items.some(r=>r.engine==="reading"&&!r.question)){
        archiveTried=true;loadWarning="";try{const response=await fetch(root.dataset.archiveUrl,{cache:"no-cache"});if(!response.ok)throw new Error();const data=await response.json();if(data.schemaVersion!==1||!Array.isArray(data.sets))throw new Error();archive=data;}catch(_){loadWarning="一部の古い教材を取得できませんでした。解答済みの記録は一覧に残しています。";}
      }
      if(!vocabularyTried&&window.ToeflVocabularyLab?.peekProgress){vocabularyTried=true;vocabularyRaw=await window.ToeflVocabularyLab.peekProgress();if(Object.keys(vocabularyRaw?.records||{}).length&&!window.ToeflVocabularyLab.getBank())await window.ToeflVocabularyLab.loadForReview();}
      collect();let migrated=false;for(const r of items)if(engines.includes(r.engine)&&!ledger[r.key]?.captured){const record={engine:r.engine,id:r.id,result:r.result,answer:r.answer??null,answerText:r.answerText,date:r.date||"",at:r.at,title:r.title,hadMistake:r.hadMistake===true,captured:false};if(JSON.stringify(record)!==JSON.stringify(ledger[r.key])){ledger[r.key]=record;migrated=true;}}
      if(migrated)try{localStorage.setItem(KEY,JSON.stringify({version:1,records:ledger}));}catch(_){warning="古い復習記録の追加保存ができません。この画面では引き続き確認できます。";}
      list();if(selected&&items.some(r=>r.key===selected))open(selected,false);
      el("status").textContent=[warning,loadWarning].filter(Boolean).join(" ")||"All saved answered questions · 正解・誤答・作文・自己確認をまとめて表示します。";
    }catch(_){el("status").textContent="一部の記録を読み込めませんでした。元の学習記録は変更していません。更新を押してもう一度確認してください。";}
    finally{busy=false;el("refresh").disabled=false;if(again){again=false;refresh();}}
  }
  function close(){const previous=selected;selected=null;el("detail").hidden=true;el("browser").hidden=false;list();[...el("list").querySelectorAll("[data-review-open]")].find(b=>b.dataset.reviewOpen===previous)?.focus({preventScroll:true});}
  el("close").addEventListener("click",close);el("retry").addEventListener("click",retry);
  el("refresh").addEventListener("click",()=>{archiveTried=false;vocabularyTried=false;for(const[engine,id]of[["reading","library-refresh"],["writing","writing-retry"],["cambridge","cambridge-retry"]])if(engine==="reading"?!window.ToeflReadingLab?.getBank():engine==="writing"?!window.ToeflWritingLab?.getBank():!window.CambridgeLab?.getBank())document.getElementById(id)?.click();refresh();});
  for(const name of ["exam","skill","type","result","search"])el(name).addEventListener(name==="search"?"input":"change",()=>{if(name==="exam"){el("skill").value="all";el("type").value="all";}if(name==="skill")el("type").value="all";page=0;list();});
  el("previous").addEventListener("click",()=>{page=Math.max(0,page-1);list();el("count").scrollIntoView({block:"start"});});el("next").addEventListener("click",()=>{page++;list();el("count").scrollIntoView({block:"start"});});
  document.addEventListener("toefl:unlocked",()=>{unlocked=true;initialWriting=read("writingLab.v1")?.records||{};initialCambridge=read("cambridgeLab.v1")||{};restore();refresh();});
  document.addEventListener("toefl:view-changed",event=>{if(event.detail?.view==="review")refresh();});
  for(const event of ["toefl:set-submitted","toefl:set-reviewed"])document.addEventListener(event,capture);
  for(const event of ["reading","writing","cambridge","vocabulary"])document.addEventListener(`toefl:${event}-ready`,()=>{if(!root.hidden)refresh();});
  window.addEventListener("storage",event=>{if(event.key===KEY)restore();if(!root.hidden)refresh();});
  window.EnglishReviewLab=Object.freeze({refresh,getItems:()=>items.map(({question,set,card,...r})=>({...r})),open});
  if(!root.hidden)refresh();
})();
