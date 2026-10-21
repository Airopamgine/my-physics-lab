// Production grading mode: no result, model, tutor key or graded history until
// every answer in the selected set has been completed and explicitly submitted.
const fs=require('fs'),assert=require('assert'),{JSDOM}=require('jsdom');
const html=fs.readFileSync(process.env.TOEFL_HTML,'utf8');
const read=name=>JSON.parse(fs.readFileSync(`static/data/${name}.json`,'utf8'));
const banks={reading:read('toefl-task-bank'),cambridge:read('cambridge-bank'),base:read('toefl-writing-bank'),extra:read('toefl-writing-originals'),plan:read('toefl-daily-plan'),vocabulary:read('toefl-vocabulary-bank')};
const writing=[...banks.base.exercises,...banks.extra.exercises];
const CK='mastersPhysicsLab.englishCoach.v1',DK='mastersPhysicsLab.dailyStudy.v1';
const tick=()=>new Promise(r=>setTimeout(r,0));
async function boot(saved={},opts={}){
 const dom=new JSDOM(html,{url:'https://airopamgine.github.io/my-physics-lab/toefl/',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,d=w.document;let now=opts.now??new Date(2026,9,21,12).getTime(),fetches=0;
 w.Date.now=()=>now;w.setInterval=()=>1;w.clearInterval=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
 w.HTMLAnchorElement.prototype.click=function(){};w.URL.createObjectURL=()=> 'blob:fixture';w.URL.revokeObjectURL=()=>{};
 w.speechSynthesis={getVoices:()=>[],addEventListener:()=>{},cancel:()=>{},speak:u=>u.onend?.()};w.SpeechSynthesisUtterance=function(text){this.text=text;};
 w.fetch=async url=>{fetches++;const name=String(url);let data=name.includes('cambridge-bank')?banks.cambridge:name.includes('writing-originals')?banks.extra:name.includes('writing-bank')?banks.base:name.includes('daily-plan')?banks.plan:name.includes('vocabulary-bank')?banks.vocabulary:banks.reading;return{ok:true,json:async()=>JSON.parse(JSON.stringify(data))};};
 for(const[k,v]of Object.entries(saved))w.localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v));
 if(opts.quota)w.Storage.prototype.setItem=()=>{throw new Error('Quota');};
 const scripts=['chatgpt-bridge',...(opts.noBatch?[]:['set-practice']),'english-library','english-coach','cambridge-lab','toefl','writing-lab','daily-study','vocabulary-lab'];
 for(const file of scripts)w.eval(fs.readFileSync(`static/js/${file}.js`,'utf8'));
 assert.strictEqual(fetches,0,'Protected banks fetched before unlock');assert.strictEqual(d.getElementById('toefl-app').dataset.grading,'set');
 d.dispatchEvent(new w.CustomEvent('toefl:unlocked'));for(let i=0;i<12;i++)await tick();
 return{dom,w,d,snapshot:()=>Object.fromEntries(Object.keys(w.localStorage).map(k=>[k,w.localStorage.getItem(k)])),advance:date=>{now=date;},async vocabulary(){d.getElementById('vocabulary-load').click();for(let i=0;i<8;i++)await tick();}};
}
const panel=(t,engine)=>t.d.querySelector(`[data-set-engine="${engine}"]`);
const article=(t,engine,id)=>[...panel(t,engine).querySelectorAll('[data-set-question]')].find(n=>n.dataset.setQuestion===id);
function answer(t,engine,id,value){
 const a=article(t,engine,id);assert(a,`Missing question ${id}`);
 if(Array.isArray(value)){
  const compound=a.querySelectorAll('[data-set-field]');
  if(compound.length){value.forEach((text,i)=>{compound[i].value=text;compound[i].dispatchEvent(new t.w.Event('input'));});}
  else for(const i of value){const b=a.querySelector(`[data-set-tile="${i}"]`);assert(!b.disabled,`${id} tile ${i}`);b.click();}
 }else{
  const radios=[...a.querySelectorAll('input[type=radio]')];
  if(radios.length){const r=radios.find(r=>r.value===String(value));assert(r,`${id}: ${value}`);r.checked=true;r.dispatchEvent(new t.w.Event('change'));}
  else{const input=a.querySelector('textarea,input[type=text]');input.value=value;input.dispatchEvent(new t.w.Event('input'));}
 }
}
function ungraded(t,engine){const p=panel(t,engine);assert(p);assert(!p.querySelector('[data-set-result]'),'Result exposed before submission');assert(!p.querySelector('.chatgpt-bridge'),'Tutor key exposed before submission');assert(p.querySelector('[data-set-review]').hidden);}
function submit(t,engine){const p=panel(t,engine);assert(!p.querySelector('[data-set-submit]').disabled);p.querySelector('form').dispatchEvent(new t.w.Event('submit',{bubbles:true,cancelable:true}));assert(!p.querySelector('[data-set-review]').hidden);}
function finish(t,engine){const p=panel(t,engine);for(const c of p.querySelectorAll('[data-set-check]')){c.checked=true;c.dispatchEvent(new t.w.Event('change'));}for(const q of p.querySelectorAll('[data-set-result]')){const r=q.querySelector('input[type=radio][value=mastered]');if(r){r.checked=true;r.dispatchEvent(new t.w.Event('change'));}}const b=p.querySelector('[data-set-finish]');assert(!b.disabled);b.click();}
const coach=t=>JSON.parse(t.w.localStorage.getItem(CK)||'{"rows":[]}').rows;
(async()=>{
 const t=await boot();const s=banks.cambridge.sets.find(s=>s.part==='2'),ids=s.questions.map(q=>q.id);
 assert(t.w.CambridgeLab.startSelection(s.id,ids));ungraded(t,'cambridge');const before=coach(t).length;
 // A partial response is editable and resumable, and even a synthetic submit event cannot grade it.
 answer(t,'cambridge',ids[0],'wrong draft');ungraded(t,'cambridge');assert.strictEqual(coach(t).length,before);
 assert(panel(t,'cambridge').querySelector('[data-set-submit]').disabled);
 panel(t,'cambridge').querySelector('form').dispatchEvent(new t.w.Event('submit',{bubbles:true,cancelable:true}));ungraded(t,'cambridge');
 const saved=t.snapshot(),resumed=await boot(saved);resumed.w.CambridgeLab.startSelection(s.id,ids);assert.strictEqual(article(resumed,'cambridge',ids[0]).querySelector('input[type=text]').value,'wrong draft');ungraded(resumed,'cambridge');resumed.dom.window.close();
 answer(t,'cambridge',ids[0],s.questions[0].answers[0]);for(const q of s.questions.slice(1))answer(t,'cambridge',q.id,q.answers[0]);
 ungraded(t,'cambridge');assert.strictEqual(coach(t).length,before,'History updated before Submit set');submit(t,'cambridge');assert.strictEqual(coach(t).length,before+ids.length);assert([...panel(t,'cambridge').querySelectorAll('[data-set-result]')].every(n=>n.dataset.result==='correct'));assert(article(t,'cambridge',ids[0]).querySelector('input[type=text]').disabled);
 const after=t.snapshot(),reviewReload=await boot(after);reviewReload.w.CambridgeLab.startSelection(s.id,ids);assert(!panel(reviewReload,'cambridge').querySelector('[data-set-review]').hidden);assert.strictEqual(coach(reviewReload).length,coach(t).length,'Reload re-recorded results');reviewReload.dom.window.close();finish(t,'cambridge');
 let cambridgeCount=0;
 for(const set of banks.cambridge.sets){t.w.CambridgeLab.startSelection(set.id,set.questions.map(q=>q.id));for(const q of set.questions){answer(t,'cambridge',q.id,set.part==='writing'?'My original draft with <script>unsafe()</script> kept as plain text.':q.answers[0]);ungraded(t,'cambridge');}submit(t,'cambridge');assert.strictEqual(panel(t,'cambridge').querySelectorAll('[data-set-result]').length,set.questions.length);assert(!panel(t,'cambridge').querySelector('script'));if(set.part==='writing')assert(panel(t,'cambridge').querySelector('[data-set-finish]').disabled);finish(t,'cambridge');cambridgeCount+=set.questions.length;await tick();}
 let readingCount=0;
 for(const set of banks.reading.sets){t.w.ToeflReadingLab.startSelection(set.id,set.questions.map(q=>q.id));for(const q of set.questions)answer(t,'reading',q.id,q.options.length?q.correct:q.acceptedAnswers?.[0]||'My response');ungraded(t,'reading');submit(t,'reading');assert([...panel(t,'reading').querySelectorAll('[data-set-result]')].every(n=>n.dataset.result==='correct'||n.dataset.result==='submitted'),set.id);finish(t,'reading');readingCount+=set.questions.length;await tick();if(readingCount%500<set.questions.length)console.log('Full-set Reading checked:',readingCount);}
 let writingCount=0;
 for(const q of writing){t.w.ToeflWritingLab.startSelection([q.id],{});answer(t,'writing',q.id,q.type==='sentence'?q.solutions[0]:q.type==='grammar'?String(q.correctIndex):'A complete practice response written before opening the model.');ungraded(t,'writing');submit(t,'writing');assert(panel(t,'writing').textContent.includes(q.modelAnswer));if(['email','discussion'].includes(q.type))assert(panel(t,'writing').querySelector('[data-set-finish]').disabled);finish(t,'writing');writingCount++;await tick();}
 // The real daily route receives all answers at submission, then all review events.
 const today=t.w.EnglishCoach.day(),daily=()=>JSON.parse(t.w.localStorage.getItem(DK)).days[today];
 for(const slot of[8,0,3]){t.d.querySelector(`[data-daily-start="${slot}"]`).click();const step=daily().steps[slot];const e=step.engine;
  for(const id of step.ids){const q=e==='cambridge'?banks.cambridge.sets.flatMap(s=>s.questions).find(q=>q.id===id):e==='reading'?banks.reading.sets.flatMap(s=>s.questions).find(q=>q.id===id):writing.find(q=>q.id===id);
   answer(t,e,id,e==='cambridge'?q.answers[0]:e==='reading'?(q.options.length?q.correct:q.acceptedAnswers[0]):q.type==='sentence'?q.solutions[0]:String(q.correctIndex));assert(!daily().steps[slot].complete);}
  ungraded(t,e);submit(t,e);assert(!daily().steps[slot].complete,'Submission skipped explicit review');finish(t,e);assert(daily().steps[slot].complete,`Daily slot ${slot} did not complete`);
 }
 // A whole vocabulary round defers statistics and keeps choices stable on reload.
 await t.vocabulary();const cards=t.w.ToeflVocabularyLab.getCards().slice(0,10);assert(t.w.ToeflVocabularyLab.startCards(cards.map(c=>c.id)));
 const vb=t.w.ToeflVocabularyLab.getBank(),vh=t.w.ToeflVocabularyLab.getProgress().history.length;
 for(const c of cards){answer(t,'vocabulary',c.id,vb.entries[c.entry].id);ungraded(t,'vocabulary');assert.strictEqual(t.w.ToeflVocabularyLab.getProgress().history.length,vh);}
 submit(t,'vocabulary');assert.strictEqual(t.w.ToeflVocabularyLab.getProgress().history.length,vh+cards.length);finish(t,'vocabulary');
 // Quick practice also waits for every item, including all gaps within an item.
 t.d.getElementById('start-button').click();ungraded(t,'quick');const qp=panel(t,'quick');const qs=[...qp.querySelectorAll('[data-set-question]')];
 for(const a of qs){const id=a.dataset.setQuestion,rs=a.querySelectorAll('input[type=radio]'),cs=a.querySelectorAll('[data-set-field]');if(rs.length)answer(t,'quick',id,rs[0].value);else if(cs.length)answer(t,'quick',id,[...cs].map(()=> 'attempt'));else{const tiles=[...a.querySelectorAll('[data-set-tile]')].map(b=>Number(b.dataset.setTile));answer(t,'quick',id,tiles);}ungraded(t,'quick');}
 assert.strictEqual(t.d.getElementById('attempted-stat').textContent.split('/')[0],'0');submit(t,'quick');assert.strictEqual(Number(t.d.getElementById('attempted-stat').textContent.split('/')[0]),qs.length);finish(t,'quick');
 // Only submitted answers enter first-attempt history, and a later correct retry
 // must not erase the error used for tomorrow's repair.
 t.advance(new Date(2026,9,22,12).getTime());
 t.w.CambridgeLab.startSelection(s.id,ids);for(const [i,q]of s.questions.entries())answer(t,'cambridge',q.id,i===0?'incorrect':q.answers[0]);ungraded(t,'cambridge');
 assert(!coach(t).some(r=>r.date==='2026-10-22'));submit(t,'cambridge');assert.strictEqual(panel(t,'cambridge').querySelectorAll('[data-result=incorrect]').length,1);finish(t,'cambridge');
 t.w.CambridgeLab.startSelection(s.id,ids);for(const q of s.questions)answer(t,'cambridge',q.id,q.answers[0]);submit(t,'cambridge');finish(t,'cambridge');
 const first=coach(t).find(r=>r.date==='2026-10-22'&&r.id===ids[0]);assert.strictEqual(first.first,'incorrect');assert.strictEqual(first.last,'correct');assert.strictEqual(t.w.CambridgeLab.getProgress().records[ids[0]].due,'2026-10-23');
 const blocked=await boot({}, {noBatch:true});assert.strictEqual(blocked.w.CambridgeLab.startSelection(s.id,ids),false);assert(blocked.d.getElementById('cambridge-status').textContent.includes('再読み込み'));assert.strictEqual(coach(blocked).length,0);blocked.dom.window.close();
 const quota=await boot({}, {quota:true});quota.w.CambridgeLab.startSelection(s.id,ids);assert(panel(quota,'cambridge').textContent.includes('保存できません'));quota.dom.window.close();
 t.dom.window.close();console.log(JSON.stringify({passed:true,timezone:process.env.TZ,cambridge:cambridgeCount,reading:readingCount,writing:writingCount,vocabularyRound:cards.length,quick:qs.length,checks:'full-set grading, no premature answers/history, editable drafts, incomplete-submit guard, reload, frozen results, real daily review, missing script, quota'}));
})().catch(e=>{console.error(e);process.exit(1);});
