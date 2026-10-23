(() => {
  "use strict";
  const root = document.getElementById("english-coach");
  if (!root) return;
  const KEY = "mastersPhysicsLab.englishCoach.v1", rows = new Map();
  const el = id => document.getElementById(`coach-${id}`);
  const day = () => { const d = new Date(Date.now()); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
  const shift = (date,n) => new Date(Date.parse(`${date}T12:00:00Z`)+n*86400000).toISOString().slice(0,10);
  const validDate = x => typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x) && Number.isFinite(Date.parse(x+"T12:00Z")) && new Date(x+"T12:00Z").toISOString().slice(0,10) === x;
  const labels = {"prepositions":"Prepositions · 前置詞", "conditionals":"Conditions · 条件表現", "comparisons":"Comparisons · 比較", "pronouns":"Pronouns · 代名詞", "linkers":"Linkers · 論理のつながり", "verb-patterns":"Verb patterns · 動詞の型", "inversion":"Inversion · 倒置", "causative":"Causative · 使役", "word-formation":"Word formation · 語形成", "collocations":"Collocations · 語の自然な組合せ", "inference":"Inference · 推論", "evidence":"Evidence · 根拠", "cohesion":"Cohesion · 文同士の結束", "paraphrase":"Paraphrase · 言い換え", "sentence":"Sentence building · 語順", "grammar":"Grammar · 文法"};
  let warning = "", unlocked = false;
  const key = r => `${r.date}|${r.engine}|${r.id}`;
  function clean(r) {
    if (!r || !validDate(r.date) || !["reading","writing","cambridge"].includes(r.engine) || typeof r.id !== "string" || !/^[\w:.-]{1,180}$/.test(r.id) || !["correct","incorrect","submitted"].includes(r.first)) return null;
    return { date:r.date,engine:r.engine,id:r.id,first:r.first,last:["correct","incorrect","submitted"].includes(r.last)?r.last:r.first,
      tags:Array.isArray(r.tags)?r.tags.filter(t=>typeof t==="string"&&/^[a-z0-9-]{1,60}$/.test(t)).slice(0,8):[],
      answer:typeof r.answer==="string"?r.answer.slice(0,2000):"",title:typeof r.title==="string"?r.title.slice(0,200):r.id,basis:r.basis==="saved"?"saved":"first" };
  }
  function merge(incoming) {
    if (!Array.isArray(incoming) || incoming.length>50000) throw new Error("Invalid report");
    const checked=incoming.map(clean); if(checked.some(r=>!r)) throw new Error("Invalid record");
    for(const r of checked) if(!rows.has(key(r))) rows.set(key(r),r);
  }
  function save() {
    try { localStorage.setItem(KEY,JSON.stringify({version:1,rows:[...rows.values()]})); warning=""; }
    catch(_){ warning="記録を保存できません。ページを閉じる前にDownload learning reportを使ってください。"; }
    render();
  }
  function record(detail) {
    const r=clean({...detail,date:detail.date||day(),first:detail.result,last:detail.result}); if(!r)return;
    const prior=rows.get(key(r)); if(prior)prior.last=r.last; else rows.set(key(r),r);
    save(); document.dispatchEvent(new CustomEvent("english:progress"));
  }
  function yesterday(date=day()) {
    const dateKey=shift(date,-1), list=[...rows.values()].filter(r=>r.date===dateKey), objective=list.filter(r=>r.first!=="submitted");
    const missed=objective.filter(r=>r.first==="incorrect"), tags={};
    for(const r of missed)for(const t of r.tags)tags[t]=(tags[t]||0)+1;
    return {date:dateKey,total:objective.length,correct:objective.length-missed.length,missed,submitted:list.length-objective.length,tags};
  }
  function node(tag,text){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;}
  function render(){
    if(!unlocked)return;
    const report=yesterday(), box=el("report");box.replaceChildren();
    const hasSaved=report.missed.some(r=>r.basis==="saved")||[...rows.values()].some(r=>r.date===report.date&&r.basis==="saved");
    const a=node("article");a.append(node("h3",`Yesterday · ${report.date}`),node("p",report.total?`${report.correct} / ${report.total} correct ${hasSaved?"in saved records":"on first attempt"} · ${report.missed.length} to repair`:"No recorded answers yesterday. 昨日の解答記録はまだありません。"));
    if(hasSaved)a.append(node("small","Earlier daily snapshots show the saved result; first-attempt tracking starts with this update. 更新前の記録は保存時の結果です。"));
    if(report.submitted)a.append(node("p",`${report.submitted} writing submission(s) · self-review, no automatic quality score`));
    const b=node("article");b.append(node("h3","Today's repair · 今日の補強"));
    const tags=Object.entries(report.tags).sort((a,b)=>b[1]-a[1]).slice(0,3);
    b.append(node("p",tags.length?tags.map(([t,n])=>`${labels[t]||t} (${n})`).join(" / "):report.missed.length?"Revisit the missed source questions, then explain the evidence. 誤答の本文に戻り、根拠を説明しましょう。":"Start with open cloze and transformations; the route will adapt after your answers. Part 2・Part 4から始め、記録が増えたら優先順位を調整します。"));
    const c=node("article");c.append(node("h3","Use it beyond the test"),node("p","After a correction, make one new sentence and explain it aloud with because. 添削した表現を新しい状況で使い、理由まで話しましょう。"));
    box.append(a,b,c);el("status").textContent=warning||"Daily repair uses yesterday's first attempts in this browser. 前日の解答から復習を選び、今日のメニューは途中で入れ替えません。";
  }
  function observe(event,engine){
    if(!unlocked)return;
    const {id,result,context}=event.detail||{};if(!id)return;
    const bank=engine==="reading"?window.ToeflReadingLab?.getBank():window.ToeflWritingLab?.getBank();
    let q,set;if(engine==="reading"){set=bank?.sets.find(s=>s.questions.some(q=>q.id===id));q=set?.questions.find(q=>q.id===id);}else q=bank?.exercises.find(q=>q.id===id);
    if(!q)return;
    record({engine,id,result,date:validDate(context?.dailyDate)?context.dailyDate:day(),tags:q.tags||[engine==="reading"?"evidence":q.type],title:q.title||set?.title||id,
      answer:engine==="reading"?window.ToeflReadingLab.getProgress().answers[id]?.submitted:window.ToeflWritingLab.getProgress()[id]?.answer});
  }
  function migrateSnapshots(){
    // Historical daily snapshots have dates but no reliable first-attempt flag.
    if(!unlocked)return;
    try{const saved=JSON.parse(localStorage.getItem("mastersPhysicsLab.dailyStudy.v1")||"null");if(!objectDays(saved))return;
      for(const[date,d]of Object.entries(saved.days)){
        if(!validDate(date)||date>=day()||!Array.isArray(d?.steps))continue;
        for(const step of d.steps){if(!["reading","writing"].includes(step.engine))continue;
          const bank=step.engine==="reading"?window.ToeflReadingLab?.getBank():window.ToeflWritingLab?.getBank();if(!bank)continue;
          for(const[id,result]of Object.entries(step.attempts||{})){
            if(!["correct","incorrect","submitted"].includes(result))continue;
            const set=step.engine==="reading"?bank.sets.find(s=>s.questions.some(q=>q.id===id)):null;
            const q=step.engine==="reading"?set?.questions.find(q=>q.id===id):bank.exercises.find(q=>q.id===id);if(!q)continue;
            const r=clean({date,engine:step.engine,id,first:result,last:result,tags:q.tags||[step.engine==="reading"?"evidence":q.type],title:q.title||set?.title,basis:"saved"});
            if(r&&!rows.has(key(r)))rows.set(key(r),r);
          }
        }
      }save();
    }catch(_){/* Existing runner recovery owns damaged legacy data. */}
  }
  const objectDays=s=>s&&typeof s==="object"&&s.days&&typeof s.days==="object"&&!Array.isArray(s.days);
  for(const engine of ["reading","writing"])document.addEventListener(`toefl:${engine}-answer`,e=>observe(e,engine));
  document.addEventListener("toefl:writing-submitted",e=>observe(e,"writing"));
  for(const name of["reading","writing"])document.addEventListener(`toefl:${name}-ready`,migrateSnapshots);
  document.addEventListener("toefl:unlocked",()=>{
    unlocked=true;
    try{const raw=localStorage.getItem(KEY);if(raw){const data=JSON.parse(raw);if(data.version!==1)throw new Error();merge(data.rows);}}
    catch(_){warning="分析記録を読み込めませんでした。既存教材の解答は保持されています。保存済みのreportを読み込めます。";}
    render();
  });
  el("export").addEventListener("click",()=>{
    const data={format:"english-learning-report",version:1,exportedAt:new Date(Date.now()).toISOString(),rows:[...rows.values()],cambridge:window.CambridgeLab?.getProgress()||null};
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"})),a=node("a");a.href=url;a.download=`english-learning-${day()}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    el("file-status").textContent="Downloaded · 解答・下書きを含みます。共有前に内容を確認してください。";
  });
  el("import").addEventListener("change",async()=>{
    try{
      const file=el("import").files?.[0];if(!file)return;if(file.size>10*1024*1024)throw new Error("File too large");
      const data=JSON.parse(await file.text());if(data.format!=="english-learning-report"||data.version!==1)throw new Error("Wrong format");
      // Validate the entire report before changing either record store.
      if(!Array.isArray(data.rows)||data.rows.length>50000||data.rows.some(r=>!clean(r)))throw new Error("Invalid rows");
      if(data.cambridge)window.CambridgeLab.validateProgress(data.cambridge);
      merge(data.rows);if(data.cambridge)window.CambridgeLab.importProgress(data.cambridge);save();
      el("file-status").textContent=warning||"Imported · 既存の分析記録・解答・下書きを優先して不足分を取り込みました。明日のメニューから反映します。";
    }catch(_){el("file-status").textContent="読み込めませんでした。English learning reportのJSON形式とファイルサイズを確認してください。";}
    el("import").value="";
  });
  window.addEventListener("focus",render);
  window.EnglishCoach=Object.freeze({record,yesterday,label:t=>labels[t]||t,day,shift,getRows:()=>JSON.parse(JSON.stringify([...rows.values()]))});
})();
