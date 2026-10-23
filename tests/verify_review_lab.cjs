// Browser-local review journeys. Fixtures never change production authentication.
const fs=require('fs'),assert=require('assert'),{JSDOM}=require('jsdom'),{IDBFactory}=require('fake-indexeddb');
const html=fs.readFileSync(process.env.TOEFL_HTML,'utf8'),P='mastersPhysicsLab.';
const read=name=>JSON.parse(fs.readFileSync(`static/data/${name}.json`,'utf8'));
const banks={reading:read('toefl-task-bank'),base:read('toefl-writing-bank'),extra:read('toefl-writing-originals'),cambridge:read('cambridge-bank'),plan:read('toefl-daily-plan'),archive:read('english-question-bank')};
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
const scripts=['set-practice','english-library','english-coach','cambridge-lab','toefl','writing-lab','vocabulary-lab','daily-study','practice-hub','review-lab'];
async function settle(t){for(let i=0;i<100;i++){await tick();if(i>15&&!t.d.getElementById('review-refresh').disabled)break;}assert(!t.d.getElementById('review-refresh').disabled,'Review never finished loading');assert(!t.d.getElementById('review-status').textContent.includes('一部の記録を読み込めませんでした'),t.d.getElementById('review-status').textContent);}
async function boot(saved={},opts={}){
 const dom=new JSDOM(html,{url:'https://airopamgine.github.io/my-physics-lab/toefl/'+(opts.hash??'#review'),runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,d=w.document,requests=[],errors=[];
 for(const css of ['practice-hub','review-lab']){const s=d.createElement('style');s.textContent=fs.readFileSync(`static/css/${css}.css`,'utf8');d.head.append(s);}
 w.Date.now=()=>new Date(2026,9,23,12).getTime();w.setInterval=()=>1;w.clearInterval=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
 w.speechSynthesis={getVoices:()=>[],addEventListener:()=>{},cancel:()=>{},speak:u=>u.onend?.()};w.SpeechSynthesisUtterance=function(text){this.text=text;};
 w.addEventListener('error',event=>errors.push(event.error||event.message));if(opts.idb)w.indexedDB=opts.idb;
 w.fetch=async url=>{const name=String(url),key=name.includes('vocabulary-bank')?'vocabulary':name.includes('english-question-bank')?'archive':name.includes('cambridge-bank')?'cambridge':name.includes('writing-originals')?'extra':name.includes('writing-bank')?'base':name.includes('daily-plan')?'plan':'reading';requests.push(key);return{ok:key!==opts.fail,json:async()=>key==='vocabulary'?opts.vocabulary:JSON.parse(JSON.stringify(banks[key]))};};
 for(const[k,v]of Object.entries(saved))w.localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v));
 for(const file of scripts)w.eval(fs.readFileSync(`static/js/${file}.js`,'utf8'));
 assert.strictEqual(requests.length,0,'Review fetched a protected bank before unlocking');
 assert.strictEqual(d.querySelectorAll('[data-review-open]').length,0,'Private answers rendered before unlocking');
 d.getElementById('toefl-app').hidden=false;d.getElementById('toefl-access-gate').hidden=true;d.dispatchEvent(new w.CustomEvent('toefl:unlocked'));
 const t={dom,w,d,requests,errors,items:()=>w.EnglishReviewLab.getItems(),snapshot:()=>Object.fromEntries(Object.keys(w.localStorage).map(k=>[k,w.localStorage.getItem(k)])),async route(path){w.location.hash=path;await settle(t);},async refresh(){await w.EnglishReviewLab.refresh();await settle(t);},close(){dom.window.close();}};
 await settle(t);assert.deepStrictEqual(errors,[]);return t;
}
const el=(t,id)=>t.d.getElementById('review-'+id);
function select(t,id,value){el(t,id).value=value;el(t,id).dispatchEvent(new t.w.Event(id==='search'?'input':'change'));}
function open(t,engine,id){t.w.EnglishReviewLab.open(`${engine}|${id}`);assert(!el(t,'detail').hidden);}
function close(t){el(t,'close').click();assert(!el(t,'browser').hidden);}
function visible(t,n){for(;n&&n.nodeType===1;n=n.parentElement)assert.notStrictEqual(t.w.getComputedStyle(n).display,'none','A review control is hidden by its ancestor');}
const panel=(t,engine)=>t.d.querySelector(`[data-set-engine="${engine}"]`);
function fill(t,engine,id,value){const q=[...panel(t,engine).querySelectorAll('[data-set-question]')].find(n=>n.dataset.setQuestion===id),input=q.querySelector('input[type=text],textarea');assert(input);input.value=value;input.dispatchEvent(new t.w.Event('input'));}
function submit(t,engine){panel(t,engine).querySelector('form').dispatchEvent(new t.w.Event('submit',{bubbles:true,cancelable:true}));}
function finish(t,engine){for(const c of panel(t,engine).querySelectorAll('input[type=checkbox]'))if(!c.checked)c.click();panel(t,engine).querySelector('[data-set-finish]').click();}
function writingRecord(extra={}){return{answer:'',notes:'',selections:[],choice:null,checked:false,rating:'',checks:[],history:[],remaining:600,deadline:null,...extra};}
function cambridgeRecord(extra={}){return{answer:'',result:'',checked:false,reviewed:false,date:'',due:'',streak:0,lastReviewed:'',...extra};}
async function storeVocabulary(idb,value){const db=await new Promise((resolve,reject)=>{const r=idb.open('mastersPhysicsLab.vocabularyLab',1);r.onupgradeneeded=()=>r.result.createObjectStore('progress');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});await new Promise((resolve,reject)=>{const tx=db.transaction('progress','readwrite');tx.objectStore('progress').put(value,P+'vocabularyLab.v1');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});db.close();}
(async()=>{
 const empty=await boot();assert.strictEqual(empty.items().length,0);assert(!empty.requests.includes('vocabulary'),'Empty history eagerly loaded the large dictionary');assert(!empty.requests.includes('archive'));
 const quickQuestions=JSON.parse(JSON.stringify(empty.w.ToeflQuickLab.getQuestions()));empty.close();
 const qs=banks.reading.sets.flatMap(s=>s.questions).slice(0,63),old=banks.archive.sets.flatMap(s=>s.questions).find(q=>!banks.reading.sets.some(s=>s.questions.some(x=>x.id===q.id)));
 assert(old,'Fixture needs a genuine older reading source');
 const writing=[...banks.base.exercises,...banks.extra.exercises],sentence=writing.find(q=>q.type==='sentence'),grammar=writing.find(q=>q.type==='grammar'),email=writing.find(q=>q.type==='email'),discussion=writing.find(q=>q.type==='discussion'),draft=writing.filter(q=>q.type==='email')[1];
 const camSet=banks.cambridge.sets.find(s=>String(s.part)==='2'),camQ=camSet.questions[0],camDraft=camSet.questions[1];
 const answered=Object.fromEntries(qs.map((q,i)=>[q.id,{result:i%3?'correct':'incorrect',submitted:q.options?.[0]?.label||'saved reading response',attemptedAt:new Date(1792660000000-i*60000).toISOString()}]));
 answered[old.id]={result:'correct',submitted:old.options?.[0]?.label||'saved archive response'};answered['missing-reading-source']={result:'incorrect'};
 const malicious='<img src=x onerror="window.reviewInjected=true"> saved essay';
 const historicalSteps=Array.from({length:8},(_,slot)=>({slot,engine:slot===5?'listening':slot===6?'speaking':'recall',ids:slot===5?[banks.plan.listening[0].id]:slot===6?[discussion.id]:[],title:`Earlier activity ${slot}`,detail:`Practice source ${slot}`,minutes:5,reviewed:[],attempts:{},complete:[5,6].includes(slot),opened:true,notes:slot===5?'The recording contrasted two methods.':'My opinion with one concrete example.',checks:[0,1,2],timer:60,deadline:null}));
 const saved={
  [P+'englishLibraryProgress.v1']:{answers:answered},
  [P+'writingLab.v1']:{version:1,records:{[sentence.id]:writingRecord({checked:true,selections:sentence.solutions[0]}),[grammar.id]:writingRecord({checked:true,choice:grammar.correctIndex}),[email.id]:writingRecord({answer:'UNSUBMITTED_EDIT_MUST_NOT_APPEAR',history:[{text:malicious,at:'2026-10-21T12:00:00Z'}]}),[discussion.id]:writingRecord({answer:'An independently reviewed opinion.',rating:'done',history:[{text:'An independently reviewed opinion.',at:'2026-10-21T12:10:00Z'}]}),[draft.id]:writingRecord({answer:'NEVER_SUBMITTED_DRAFT'}),'retired-writing':writingRecord({answer:'Earlier submitted writing.',checked:true})}},
  [P+'cambridgeLab.v1']:{version:1,records:{[camQ.id]:cambridgeRecord({answer:camQ.answers[0],result:'correct',checked:true,date:'2026-10-21'}),[camDraft.id]:cambridgeRecord({answer:'UNSUBMITTED_CAMBRIDGE'})},plans:{},exposure:{},repeats:{[banks.cambridge.repeat[0].en]:'2026-10-21'}},
  [P+'toeflProgress.v1']:{attempts:Object.fromEntries(quickQuestions.map(q=>[q.id,{correct:true,submitted:q.options?.[q.answer]||'Older quick response',attemptedAt:'2026-10-20T12:00:00Z'}]))},
  [P+'englishCoach.v1']:{version:1,rows:[{date:'2026-10-20',engine:'reading',id:qs[1].id,first:'incorrect',last:'correct',answer:'original wrong response',title:'Recovered topic',tags:[],basis:'first'}]},
  [P+'dailyStudy.v1']:{version:1,level:'path',days:{'2026-10-20':{date:'2026-10-20',phase:'foundation',week:0,steps:historicalSteps}},exposure:{},spaced:{},reflections:{}},
  [P+'setAnswers.v1:quick']:{submitted:false,answers:{'fake-unsubmitted':'do not include'}}
 };
 const t=await boot(saved),all=t.items(),expected=qs.length+2+5+1+quickQuestions.length+1+2;
 assert.strictEqual(all.length,expected,'Some saved questions were lost or a draft was included');
 assert(!all.some(r=>[draft.id,camDraft.id,'fake-unsubmitted'].includes(r.id)),'Unsubmitted work leaked into Review');assert(t.requests.includes('archive'));assert(!t.requests.includes('vocabulary'));
 assert(all.some(r=>r.result==='correct')&&all.some(r=>r.result==='incorrect'));
 assert.strictEqual(all.find(r=>r.id===sentence.id).result,'correct','Legacy sentence result was overwritten while its bank loaded');assert.strictEqual(all.find(r=>r.id===grammar.id).result,'correct');
 assert(all.some(r=>r.engine==='quick'&&r.skill==='reading')&&all.some(r=>r.engine==='quick'&&r.skill==='writing')&&all.some(r=>r.engine==='quick'&&r.skill==='listening'));
 assert(all.find(r=>r.id===qs[1].id).hadMistake,'An earlier mistake vanished after a correct retry');
 visible(t,el(t,'exam'));assert(t.d.querySelector('[data-study-tab=review]').hasAttribute('aria-current'));
 // Pagination reaches every saved item, including records beyond prior UI caps.
 const seen=new Set();do{for(const c of el(t,'list').children)if(c.dataset.reviewItem)seen.add(c.dataset.reviewItem);if(el(t,'next').disabled)break;el(t,'next').click();}while(true);
 assert.strictEqual(seen.size,expected);select(t,'result','correct');assert([...el(t,'list').querySelectorAll('[data-result]')].every(n=>n.dataset.result==='correct'));
 select(t,'result','mistakes');select(t,'search',qs[1].id);assert(el(t,'list').querySelector(`[data-review-item="reading|${qs[1].id}"]`),'Past-mistake filter excluded a corrected question');select(t,'result','all');select(t,'search','');
 select(t,'exam','cambridge');assert.strictEqual(el(t,'list').querySelectorAll('[data-review-item]').length,1);select(t,'exam','toefl');select(t,'skill','writing');assert([...el(t,'type').options].some(o=>o.text==='Write an Email'));select(t,'type','Write an Email');assert.strictEqual(el(t,'list').querySelectorAll('[data-review-item]').length,1);
 select(t,'exam','all');select(t,'search','NEVER_SUBMITTED_DRAFT');assert.strictEqual(el(t,'list').querySelectorAll('[data-review-item]').length,0);select(t,'search','');
 const before=t.snapshot();open(t,'writing',email.id);assert(el(t,'answer').textContent.includes(malicious));assert(!el(t,'answer').querySelector('img'));assert(!t.w.reviewInjected);assert(!el(t,'answer').textContent.includes('UNSUBMITTED_EDIT'));assert(el(t,'answer').textContent.includes(email.modelAnswer));assert(el(t,'answer').textContent.includes(email.explanation[0]));visible(t,el(t,'answer'));close(t);
 open(t,'reading',old.id);assert(el(t,'source').textContent.includes(old.prompt));assert(!el(t,'answer').textContent.includes('[object Object]'));close(t);
 open(t,'reading','missing-reading-source');assert(el(t,'retry').disabled);assert(el(t,'answer').textContent.includes('解答文が保存されていません'));assert(el(t,'question-meta').textContent.includes('日付記録なし'));close(t);
 open(t,'repeat',banks.cambridge.repeat[0].en);assert(el(t,'answer').textContent.includes('no recording was saved'));close(t);
 for(const[k,value]of Object.entries(before))assert.strictEqual(t.w.localStorage.getItem(k),value,`Viewing history changed ${k}`);
 // A retake reopens its whole source set, submits once complete, then returns.
 open(t,'cambridge',camQ.id);el(t,'retry').click();assert.strictEqual(Object.keys(t.w.EnglishSetPractice.getState('cambridge').answers).length,camSet.questions.length);visible(t,panel(t,'cambridge'));submit(t,'cambridge');assert.strictEqual(Object.keys(t.w.CambridgeLab.getProgress().records).filter(id=>t.w.CambridgeLab.getProgress().records[id].checked).length,1,'Incomplete retake graded new responses');
 for(const q of camSet.questions)fill(t,'cambridge',q.id,q.answers[0]);submit(t,'cambridge');assert(!panel(t,'cambridge').querySelector('[data-set-finish]').disabled);finish(t,'cambridge');await settle(t);assert(!t.d.getElementById('review-lab').hidden);assert(!el(t,'detail').hidden);assert.strictEqual(t.items().filter(r=>r.engine==='cambridge').length,camSet.questions.length);
 assert(el(t,'answer').textContent.includes(camQ.answers[0]));close(t);
 // New submissions join Review only after the complete-set submit guard.
 await t.route('practice/toefl/writing/email');const choice=t.w.EnglishPracticeHub.choose('practice/toefl/writing/email');assert(!t.items().some(r=>r.engine==='writing'&&r.id===choice.ids[0]));t.d.getElementById('practice-start').click();fill(t,'writing',choice.ids[0],'A newly submitted response with an explanation.');submit(t,'writing');finish(t,'writing');await t.route('review');assert(t.items().some(r=>r.id===choice.ids[0]&&r.answerText.includes('newly submitted')));
 open(t,'daily','2026-10-20:5');el(t,'retry').click();visible(t,t.d.getElementById('daily-workspace'));assert(t.d.getElementById('daily-work-title').textContent.includes('Earlier activity 5'));t.d.getElementById('daily-work-close').click();await settle(t);assert(!t.d.getElementById('review-lab').hidden);
 const snapshot=t.snapshot(),keys=Array.from(t.items(),r=>r.key).sort();t.close();
 const reload=await boot(snapshot);assert.deepStrictEqual(Array.from(reload.items(),r=>r.key).sort(),keys,'Reload lost submitted or older questions');assert(reload.items().some(r=>r.id==='retired-writing'));assert.deepStrictEqual(reload.errors,[]);reload.close();
 // IndexedDB-only vocabulary history must load without visiting Vocabulary.
 const vb=read('toefl-vocabulary-bank');vb.entries=vb.entries.filter(e=>e.learning.eligible).slice(0,400);
 const cards=vb.entries.flatMap(e=>[...e.quizGlosses.map(g=>`${e.id}|g:${g.id}`),...e.dictionary.map(d=>`${e.id}|d:${d.sense}`)]).slice(0,620);assert(cards.length>500);
 const retired=vb.entries.find(e=>e.contexts.length),retiredId=`${retired.id}|context`,unknown='removed-word|g:old',idb=new IDBFactory();
 const vr={attempts:2,correct:1,wrong:1,streak:1,last:1792660000000,due:1792746400000,result:'correct',lastCorrectDay:'2026-10-22',answer:vb.entries[0].id,answerText:'Exact saved vocabulary choice'};
 const progress={schemaVersion:1,updatedAt:1792660000000,records:Object.fromEntries([...cards,retiredId,unknown].map(id=>[id,{...vr}])),notes:{},stars:{},history:[{id:cards.at(-1),result:'correct',at:1792660000000}],session:null,preferences:{level:'all',subject:'all'}};await storeVocabulary(idb,progress);
 const v=await boot({}, {idb,vocabulary:vb});assert(v.requests.includes('vocabulary'));assert.strictEqual(v.items().filter(r=>r.engine==='vocabulary').length,cards.length+2,'Vocabulary history was capped at the recent-history limit');assert.strictEqual(v.w.localStorage.getItem(P+'vocabularyLab.v1'),null,'IDB-only history was copied into localStorage');
 select(v,'exam','vocabulary');open(v,'vocabulary',cards[0]);assert(el(v,'answer').textContent.includes('Exact saved vocabulary choice'));assert(!el(v,'retry').disabled);close(v);open(v,'vocabulary',retiredId);assert(el(v,'retry').disabled);close(v);open(v,'vocabulary',unknown);assert(el(v,'retry').disabled);close(v);
 // Preserve retired IDs through the native save/reload cycle as well.
 v.w.dispatchEvent(new v.w.Event('pagehide'));for(let i=0;i<15;i++)await tick();v.close();const vReload=await boot({}, {idb,vocabulary:vb});assert(vReload.items().some(r=>r.id===unknown),'Saving the current bank erased a previous vocabulary ID');assert.strictEqual(vReload.w.ToeflVocabularyLab.getProgress().records[cards[0]].answerText,vr.answerText);vReload.close();
 const broken=await boot({[P+'reviewAnswers.v1']:'{broken',[P+'englishLibraryProgress.v1']:{answers:{'still-saved':{result:'correct'}}}},{fail:'archive'});assert(broken.items().some(r=>r.id==='still-saved'));assert(el(broken,'status').textContent.includes('一覧に残'));broken.close();
 console.log(JSON.stringify({passed:true,timezone:process.env.TZ,checks:'all engines, correct and mistaken answers, drafts excluded, pagination, search/filters, source and explanation, escaped responses, read-only viewing, full-set retakes, return to Review, new submission, reload, legacy sources, IDB-only vocabulary beyond 500 records, retired IDs and unavailable sources'}));
})().catch(error=>{console.error(error);process.exit(1);});
