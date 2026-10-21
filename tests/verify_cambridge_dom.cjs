// Real runners in an isolated DOM fixture. Production authentication is unchanged.
const fs=require('fs'),assert=require('assert'),{JSDOM}=require('jsdom');
// Legacy grading-kernel fixture; production full-set flow is covered by verify_set_practice.cjs.
const html = fs.readFileSync(process.env.TOEFL_HTML, 'utf8').replace(/data-grading(?:=set|="set")/, 'data-grading=legacy');
const read=name=>JSON.parse(fs.readFileSync(`static/data/${name}.json`,'utf8'));
const banks={cambridge:read('cambridge-bank'),reading:read('toefl-task-bank'),writing:read('toefl-writing-bank'),plan:read('toefl-daily-plan')};
const originals=read('toefl-writing-originals');
const KEY='mastersPhysicsLab.cambridgeLab.v1',COACH='mastersPhysicsLab.englishCoach.v1',DAILY='mastersPhysicsLab.dailyStudy.v1';
const tick=()=>new Promise(r=>setTimeout(r,0));
async function boot(saved={},options={}){
 const dom=new JSDOM(html,{url:'https://airopamgine.github.io/my-physics-lab/toefl/',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,d=w.document,intervals=[];let now=new Date(2026,9,19,12).getTime(),fail=options.fail,spoken;
 w.Date.now=()=>now;w.HTMLElement.prototype.scrollIntoView=()=>{};w.setInterval=(fn,ms)=>{intervals.push({fn,ms});return intervals.length;};
 w.fetch=async url=>({ok:!(fail&&String(url).includes('cambridge-bank')),json:async()=>JSON.parse(JSON.stringify(String(url).includes('cambridge-bank')?banks.cambridge:String(url).includes('writing-originals')?originals:String(url).includes('writing-bank')?banks.writing:String(url).includes('daily-plan')?banks.plan:banks.reading))});
 w.URL.createObjectURL=()=> 'blob:fixture';w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){};
 w.speechSynthesis={getVoices:()=>[],addEventListener:()=>{},cancel:()=>{},speak:u=>{spoken=u;u.onend();}};w.SpeechSynthesisUtterance=function(text){this.text=text;};
 for(const[k,v]of Object.entries(saved))w.localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v));
 if(options.quota)w.Storage.prototype.setItem=()=>{throw new Error('Quota');};
 for(const name of['chatgpt-bridge','english-library','english-coach','cambridge-lab','writing-lab','daily-study'])w.eval(fs.readFileSync(`static/js/${name}.js`,'utf8'));
 assert(!d.getElementById('cambridge-catalog').children.length,'Bank loaded before unlock');
 d.dispatchEvent(new w.CustomEvent('toefl:unlocked'));for(let i=0;i<12;i++)await tick();
 const snapshot=()=>Object.fromEntries(Object.keys(w.localStorage).map(k=>[k,w.localStorage.getItem(k)]));
 return{dom,w,d,snapshot,get spoken(){return spoken;},advance(date){now=date;w.dispatchEvent(new w.Event('focus'));for(const x of intervals)if(x.ms===60000)x.fn();},async retry(){fail=false;d.getElementById('cambridge-retry').click();for(let i=0;i<12;i++)await tick();}};
}
function submit(t,q,answer){
 if(q.options){const r=t.d.querySelector(`input[name=cambridge-answer][value="${answer}"]`);assert(r);r.checked=true;r.dispatchEvent(new t.w.Event('change'));}
 else{const input=t.d.getElementById('cambridge-answer');input.value=answer;input.dispatchEvent(new t.w.Event('input'));}
 t.d.getElementById('cambridge-form').dispatchEvent(new t.w.Event('submit',{bubbles:true,cancelable:true}));
 assert(!t.d.getElementById('cambridge-feedback').hidden);
}
(async()=>{
 const t=await boot();assert.strictEqual(t.d.querySelectorAll('#cambridge-catalog article').length,banks.cambridge.sets.length);
 const date=t.w.EnglishCoach.day(),daily=()=>JSON.parse(t.w.localStorage.getItem(DAILY)).days[t.w.EnglishCoach.day()];
 assert.strictEqual(daily().steps.length,10);assert(t.d.getElementById('daily-next').textContent.includes('Part 2'));
 const frozen=JSON.stringify(daily().steps.map(s=>s.ids));
 let tasks=0;
 for(const s of banks.cambridge.sets){
  assert(t.w.CambridgeLab.startSelection(s.id,s.questions.map(q=>q.id)));
  assert.strictEqual(t.d.getElementById('cambridge-passage').textContent,s.passage);
  for(const q of s.questions){
   if(s.part==='writing'){
    assert(!t.d.getElementById('cambridge-question').textContent.includes(q.model));submit(t,q,'My original draft with <script>alert(1)</script> as plain text.');
    assert(t.d.getElementById('cambridge-next').disabled);assert(!t.d.querySelector('#cambridge-feedback script'));
    for(const input of t.d.querySelectorAll('[data-cambridge-check]')){input.checked=true;input.dispatchEvent(new t.w.Event('change',{bubbles:true}));}
    assert(!t.d.getElementById('cambridge-next').disabled);
   }else{
    for(const answer of q.answers)assert(t.w.CambridgeLab.grade(q,answer).correct,`${q.id}: ${answer}`);
    submit(t,q,q.answers[0]);assert(t.d.getElementById('cambridge-feedback').textContent.startsWith('Correct'),q.id);
   }
   assert(t.d.getElementById('cambridge-feedback').textContent.includes(q.explanation));t.d.getElementById('cambridge-next').click();tasks++;
  }
  assert(t.d.getElementById('cambridge-runner').hidden);
 }
 assert.strictEqual(tasks,banks.cambridge.sets.reduce((n,s)=>n+s.questions.length,0));assert.strictEqual(JSON.stringify(daily().steps.map(s=>s.ids)),frozen,'Same-day menu changed after answers');
 // Full-set practice must actually report answer+review events to the daily route.
 t.d.querySelector('[data-daily-start="8"]').click();const primary=banks.cambridge.sets.find(s=>s.id===daily().steps[8].setId);
 for(const q of primary.questions){submit(t,q,q.answers[0]);t.d.getElementById('cambridge-next').click();}
 assert(daily().steps[8].complete,'Cambridge daily work never completed');
 // First attempt survives retries, and weak topics are selected in tomorrow's plan.
 const target=banks.cambridge.sets.find(s=>s.id==='cb-cloze-workshop'),q=target.questions[6];
 t.w.CambridgeLab.startSelection(target.id,[q.id]);submit(t,q,'wrong');t.d.getElementById('cambridge-next').click();
 // Use a separate date, because all-correct audit runs above already recorded today's first answer.
 t.advance(new Date(2026,9,20,12).getTime());
 t.w.CambridgeLab.startSelection(target.id,[q.id]);submit(t,q,'wrong');t.d.getElementById('cambridge-next').click();
 t.w.CambridgeLab.startSelection(target.id,[q.id]);submit(t,q,'did');t.d.getElementById('cambridge-next').click();
 const row=JSON.parse(t.w.localStorage.getItem(COACH)).rows.find(r=>r.date==='2026-10-20'&&r.id===q.id);
 assert.strictEqual(row.first,'incorrect');assert.strictEqual(row.last,'correct');assert.strictEqual(t.w.CambridgeLab.getProgress().records[q.id].due,'2026-10-21');
 t.advance(new Date(2026,9,21,12).getTime());assert(t.w.EnglishCoach.yesterday().tags.inversion);assert(t.d.getElementById('coach-report').textContent.includes('Inversion'));
 assert(banks.cambridge.sets.find(s=>s.id===daily().steps[8].setId).questions.some(q=>q.tags.includes('inversion')),'Yesterday\'s weak area was not selected');
 // A reload restores partial drafts and a paused daily queue without regrading them.
 t.d.querySelector('[data-daily-start="8"]').click();const field=t.d.getElementById('cambridge-answer');field.value='partial draft';field.dispatchEvent(new t.w.Event('input'));t.d.getElementById('cambridge-close').click();
 const saved=t.snapshot(),again=await boot(saved);again.advance(new Date(2026,9,21,12).getTime());again.d.querySelector('[data-daily-start="8"]').click();assert.strictEqual(again.d.getElementById('cambridge-answer').value,'partial draft');again.dom.window.close();
 // Word-limit and contraction boundaries; error text must not invent partial marks.
 const transform=banks.cambridge.sets.find(s=>s.part==='4').questions[0];assert(t.w.CambridgeLab.grade(transform,"would rather you didn't").correct);assert(!t.w.CambridgeLab.grade(transform,'would rather you do not').correct);
 assert.strictEqual(t.w.CambridgeLab.transformWords("would rather you didn't"),5);assert(!t.w.CambridgeLab.grade(transform,'I would rather you did not').correct);
 // Synthetic audio is opt-in, the sentence starts hidden, and showing it never counts as a score.
 assert(t.d.getElementById('repeat-text').hidden);t.d.getElementById('repeat-play').click();assert(t.spoken.text);t.d.getElementById('repeat-reveal').click();assert(!t.d.getElementById('repeat-text').hidden);t.d.getElementById('repeat-next').click();assert(t.d.getElementById('repeat-text').hidden);
 // A damaged report cannot overwrite existing answer records; import merges missing IDs only.
 assert.throws(()=>t.w.CambridgeLab.validateProgress({version:1,records:{x:{answer:1}},plans:{},exposure:{}}));
 const before=t.w.CambridgeLab.getProgress();t.w.CambridgeLab.importProgress({...before,records:{[q.id]:{...before.records[q.id],answer:'overwritten'}}});assert.strictEqual(t.w.CambridgeLab.getProgress().records[q.id].answer,before.records[q.id].answer);
 const network=await boot({}, {fail:true});assert(!network.d.getElementById('cambridge-retry').hidden);assert.strictEqual(JSON.parse(network.w.localStorage.getItem(DAILY)).days[date].steps.length,8);await network.retry();assert.strictEqual(JSON.parse(network.w.localStorage.getItem(DAILY)).days[date].steps.length,10);network.dom.window.close();
 const quota=await boot({}, {quota:true});assert(quota.d.getElementById('cambridge-status').textContent.includes('保存できません'));quota.dom.window.close();
 const corrupted=await boot({[KEY]:'broken'});assert(corrupted.d.getElementById('cambridge-status').textContent.includes('読み込めませんでした'));corrupted.dom.window.close();
 // Older daily snapshots are imported with an honest saved-result label.
 const legacy=t.snapshot(),snapshot=JSON.parse(legacy[DAILY]);snapshot.days['2026-10-18']={...snapshot.days[date],date:'2026-10-18'};snapshot.days['2026-10-18'].steps[0].attempts={[snapshot.days[date].steps[0].ids[0]]:'incorrect'};legacy[DAILY]=snapshot;delete legacy[COACH];
 const migrated=await boot(legacy);assert(migrated.d.getElementById('coach-report').textContent.includes('Earlier daily snapshots'));migrated.dom.window.close();
 t.dom.window.close();console.log(JSON.stringify({result:'passed',tasks,timezone:process.env.TZ,checks:'all parts, accepted variants, writing self-review, first attempts, next-day repair, 10-step integration, draft resume, offline recovery, quota, legacy migration, synthetic audio'}));
})().catch(e=>{console.error(e);process.exit(1);});
