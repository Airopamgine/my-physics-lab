// User journeys through category selection, unanswered work, saved drafts and review.
const fs=require('fs'),assert=require('assert'),{JSDOM}=require('jsdom');
const html=fs.readFileSync(process.env.TOEFL_HTML,'utf8');
const read=name=>JSON.parse(fs.readFileSync(`static/data/${name}.json`,'utf8'));
const banks={reading:read('toefl-task-bank'),cambridge:read('cambridge-bank'),base:read('toefl-writing-bank'),extra:read('toefl-writing-originals'),plan:read('toefl-daily-plan')};
const scripts=['set-practice','english-library','english-coach','cambridge-lab','toefl','writing-lab','daily-study','vocabulary-lab','practice-hub','review-lab'];
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
async function boot(saved={},opts={}){
 const dom=new JSDOM(html,{url:`https://airopamgine.github.io/my-physics-lab/toefl/${opts.hash||''}`,runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,d=w.document;
 let fail=opts.fail;let requests=0;const errors=[];
 const style=d.createElement('style');style.textContent=fs.readFileSync('static/css/practice-hub.css','utf8');d.head.append(style);
 w.Date.now=()=>opts.now??new Date(2026,9,22,12).getTime();w.setInterval=()=>1;w.clearInterval=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
 w.matchMedia=()=>({matches:opts.reducedMotion===true});w.addEventListener('error',event=>{errors.push(event.message);event.preventDefault();});
 w.speechSynthesis={getVoices:()=>[],addEventListener:()=>{},cancel:()=>{},speak:u=>u.onend?.()};w.SpeechSynthesisUtterance=function(text){this.text=text;};
 w.fetch=async url=>{requests++;const name=String(url);const key=name.includes('cambridge-bank')?'cambridge':name.includes('writing-originals')?'extra':name.includes('writing-bank')?'base':name.includes('daily-plan')?'plan':'reading';return{ok:fail!==key,json:async()=>JSON.parse(JSON.stringify(banks[key]))};};
 for(const[k,v]of Object.entries(saved))w.localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v));
 // The production inline footer binds clicks before deferred app scripts run.
 // Execute that exact built code, rather than a simplified theme substitute.
 const theme=[...d.querySelectorAll('script:not([src])')].filter(s=>s.textContent.includes('scrollIntoView')&&s.textContent.includes('pushState'));
 assert.strictEqual(theme.length,1,'The built page must include its real theme anchor handler');w.eval(theme[0].textContent);
 for(const file of scripts)w.eval(fs.readFileSync(`static/js/${file}.js`,'utf8'));
 assert.strictEqual(requests,0,'Banks loaded before unlocking');d.getElementById('toefl-app').hidden=false;d.getElementById('toefl-access-gate').hidden=true;
 d.dispatchEvent(new w.CustomEvent('toefl:unlocked'));for(let i=0;i<14;i++)await tick();
 return{w,d,dom,errors,snapshot:()=>Object.fromEntries(Object.keys(w.localStorage).map(k=>[k,w.localStorage.getItem(k)])),recover:()=>{fail=null;},async route(path){w.location.hash=path;await tick();await tick();},close:()=>dom.window.close()};
}
const panel=(t,engine)=>t.d.querySelector(`[data-set-engine="${engine}"]`);
const state=(t,engine)=>t.w.EnglishSetPractice.getState(engine);
function put(t,engine,id,text){const p=panel(t,engine);const q=[...p.querySelectorAll('[data-set-question]')].find(q=>q.dataset.setQuestion===id),field=q.querySelector('input[type=text],textarea');assert(field);field.value=text;field.dispatchEvent(new t.w.Event('input'));}
function submit(t,engine){panel(t,engine).querySelector('form').dispatchEvent(new t.w.Event('submit',{cancelable:true,bubbles:true}));}
function finish(t,engine){const p=panel(t,engine);for(const check of p.querySelectorAll('input[type=checkbox]'))if(!check.checked)check.click();p.querySelector('[data-set-finish]').click();}
function savedClose(t,engine){panel(t,engine).querySelector('[data-set-close]').click();}
const shown=t=>[...t.d.querySelectorAll('[data-practice-panel]')].filter(p=>!p.hidden).map(p=>p.dataset.practicePanel);
function visible(t,element){for(let n=element;n&&n.nodeType===1;n=n.parentElement)assert.notStrictEqual(t.w.getComputedStyle(n).display,'none',`${element.id||element.className} is hidden by ${n.id||n.className}`);}
(async()=>{
 const t=await boot({}, {hash:'#practice'});
 assert.strictEqual(t.d.querySelectorAll('[data-practice-choice]').length,2,'Landing should show two exams');assert.deepStrictEqual(shown(t),[]);
 t.d.querySelector('[data-practice-choice=toefl]').click();await tick();await tick();assert.strictEqual(t.d.querySelectorAll('[data-practice-choice]').length,4);
 t.d.querySelector('[data-practice-choice=reading]').click();await tick();await tick();assert.strictEqual(t.d.querySelectorAll('[data-practice-choice]').length,3);
 // Reproduce the reported failure: static tab links clicked from Reading.
 for(const name of ['review','today','vocabulary','progress','practice']){
  const link=t.d.querySelector(`[data-study-tab=${name}]`);link.click();for(let i=0;i<6;i++)await tick();
  assert.strictEqual(t.w.location.hash,'#'+name,`Clicking ${name} was intercepted by the theme`);assert.deepStrictEqual(shown(t),name==='practice'?[]:[name]);assert.strictEqual(link.getAttribute('aria-current'),'page');
  if(name==='practice')visible(t,t.d.getElementById('practice-choices'));
  else visible(t,t.d.querySelector(`[data-practice-panel=${name}]`));
  if(name==='review')assert(t.d.getElementById('review-count').textContent.includes('saved answered questions'));
  if(name==='vocabulary')assert(!t.d.getElementById('vocabulary-load').disabled);
 }
 t.w.history.back();for(let i=0;i<8;i++)await tick();assert.deepStrictEqual(shown(t),['progress']);t.w.history.forward();for(let i=0;i<8;i++)await tick();assert(!t.d.getElementById('practice-hub').hidden);
 for(const exam of ['cambridge','toefl']){t.d.querySelector(`.toefl-hero a[href="#practice/${exam}"]`).click();await tick();await tick();assert.strictEqual(t.w.location.hash,`#practice/${exam}`);assert.strictEqual(t.d.querySelectorAll('[data-practice-choice]').length,4);}
 t.d.querySelector('[data-study-tab=progress]').dispatchEvent(new t.w.MouseEvent('click',{bubbles:true,cancelable:true,detail:0}));await tick();await tick();assert.deepStrictEqual(shown(t),['progress'],'Keyboard activation did not open Progress');
 t.d.querySelector('#english-coach a[href="#daily-study"]').click();await tick();await tick();assert.deepStrictEqual(shown(t),['today'],'Legacy Today link failed');
 const modified=new t.w.MouseEvent('click',{bubbles:true,cancelable:true,ctrlKey:true}),location=t.w.location.hash;t.d.querySelector('[data-study-tab=review]').dispatchEvent(modified);assert(!modified.defaultPrevented,'Modified clicks must retain native link behavior');assert.strictEqual(t.w.location.hash,location);
 // jsdom schedules the native link action even for a modified click; drain it
 // before the next journey starts. Browser new-tab behavior stays native.
 for(let i=0;i<6;i++)await tick();
 assert.deepStrictEqual(t.errors,[],'Actual link clicks raised a theme or app error');
 assert(!t.d.querySelector('[data-library-start],[data-writing-start],[data-cambridge-set]'),'A detailed question catalog remains in the guided UI');
 // Every implemented objective/writing category has a valid, coherent selection.
 for(const exam of t.w.EnglishPracticeHub.exams)for(const skill of exam.skills)for(const type of skill.types){
  const route=`practice/${exam.id}/${skill.id}/${type.id}`;await t.route(route);
  if(['reading','writing','cambridge','quick'].includes(type.engine)){
   const choice=t.w.EnglishPracticeHub.choose(route);assert(choice?.ids.length,route);assert(!t.d.getElementById('practice-start').disabled,route);
   if(type.engine==='reading'){
    const set=banks.reading.sets.find(s=>s.id===choice.id),selected=set.questions.filter(q=>choice.ids.includes(q.id));
    const texts=new Set(selected.map(q=>q.passage??set.passage??set.id));assert.strictEqual(texts.size,1,'Reading set spans multiple texts');
    const all=set.questions.filter(q=>texts.has(q.passage??set.passage??set.id));assert.deepStrictEqual([...choice.ids],all.map(q=>q.id),'Text lost associated questions');
   }
  }
 }
 // Submission records answers once; next practice favours unseen work over errors.
 const route='practice/cambridge/reading/part2';await t.route(route);const first=t.w.EnglishPracticeHub.choose(route);t.d.getElementById('practice-start').click();assert.deepStrictEqual(shown(t),['cambridge']);
 assert(t.d.getElementById('practice-hub').hidden);assert(panel(t,'cambridge').querySelector('[data-set-submit]').disabled);
 const set=banks.cambridge.sets.find(s=>s.id===first.id);
 visible(t,panel(t,'cambridge'));visible(t,panel(t,'cambridge').querySelector('input'));
 for(const[i,q]of set.questions.entries())put(t,'cambridge',q.id,i?'unused':'incomplete');
 assert(!panel(t,'cambridge').querySelector('[data-set-result]'),'Early grading');submit(t,'cambridge');finish(t,'cambridge');
 assert.deepStrictEqual(shown(t),[]);assert(!t.d.getElementById('practice-hub').hidden);
 const second=t.w.EnglishPracticeHub.choose(route);assert.notStrictEqual(second.id,first.id,'Answered set was selected ahead of unseen work');
 const review=t.w.EnglishPracticeHub.choose(route,true);assert.strictEqual(review.id,first.id,'Mistake review lost the previous set');
 // Keep separate unfinished sets from two parts and restore either one.
 t.d.getElementById('practice-start').click();const secondQ=banks.cambridge.sets.find(s=>s.id===second.id).questions[0];put(t,'cambridge',secondQ.id,'my saved answer');savedClose(t,'cambridge');
 await t.route('practice/cambridge/reading/part4');const transform=t.w.EnglishPracticeHub.choose('practice/cambridge/reading/part4');t.d.getElementById('practice-start').click();put(t,'cambridge',transform.ids[0],'saved transformation');savedClose(t,'cambridge');
 await t.route(route);assert(t.d.getElementById('practice-start').textContent.includes('Resume'));t.d.getElementById('practice-start').click();assert.strictEqual(state(t,'cambridge').answers[secondQ.id],'my saved answer');savedClose(t,'cambridge');
 // A new day still resumes the same manual set; grading history is retained.
 const snapshot=t.snapshot(),reload=await boot(snapshot,{hash:'#'+route,now:new Date(2026,9,23,12).getTime()});assert(reload.d.getElementById('practice-start').textContent.includes('Resume'));
 reload.d.getElementById('practice-start').click();assert.strictEqual(state(reload,'cambridge').answers[secondQ.id],'my saved answer');assert.strictEqual(reload.w.CambridgeLab.getProgress().records[first.ids[0]].result,'incorrect');savedClose(reload,'cambridge');
 await reload.route('practice/cambridge/reading/part4');reload.d.getElementById('practice-start').click();assert.strictEqual(state(reload,'cambridge').answers[transform.ids[0]],'saved transformation');savedClose(reload,'cambridge');reload.close();
 // Closing by navigation preserves a draft and does not score it.
 t.d.getElementById('practice-start').click();const before=Object.keys(t.w.CambridgeLab.getProgress().records).length;t.d.getElementById('practice-back').click();assert.strictEqual(Object.keys(t.w.CambridgeLab.getProgress().records).length,before);assert(!t.d.getElementById('practice-hub').hidden);
 await t.route('practice/toefl/writing/sentence');t.d.getElementById('practice-start').click();assert.deepStrictEqual(shown(t),['writing']);assert.strictEqual(Object.keys(state(t,'writing').answers).length,5);t.d.getElementById('practice-back').click();
 await t.route('practice/toefl/listening/response');t.d.getElementById('practice-start').click();assert.deepStrictEqual(shown(t),['quick']);assert.strictEqual(Object.keys(state(t,'quick').answers).length,2);t.d.getElementById('practice-back').click();
 await t.route('practice/toefl/speaking/repeat');t.d.getElementById('practice-start').click();assert.deepStrictEqual(shown(t),['repeat']);t.d.getElementById('repeat-play').click();t.d.getElementById('repeat-reveal').click();t.d.getElementById('repeat-next').click();assert.strictEqual(Object.keys(t.w.CambridgeLab.getProgress().repeats).length,1);t.d.getElementById('practice-back').click();
 await t.route('practice/toefl/listening/recordings');t.d.getElementById('practice-start').click();assert.deepStrictEqual(shown(t),['today']);assert(!t.d.getElementById('daily-workspace').hidden);visible(t,t.d.getElementById('daily-workspace'));assert(t.d.getElementById('daily-study').classList.contains('practice-daily-active'));t.d.getElementById('practice-back').click();
 await t.route('today');assert.deepStrictEqual(shown(t),['today']);assert(!t.d.getElementById('daily-study').classList.contains('practice-daily-active'));
 t.d.querySelector('[data-daily-start="8"]').click();assert.deepStrictEqual(shown(t),['cambridge']);t.d.querySelector('[data-study-tab=today]').click();assert.deepStrictEqual(shown(t),['today'],'Clicking the active Today tab did not return to the menu');
 await t.route('vocabulary');assert.deepStrictEqual(shown(t),['vocabulary']);await t.route('progress');assert.deepStrictEqual(shown(t),['progress']);
 await t.route('writing-lab');assert.strictEqual(t.d.querySelectorAll('[data-practice-choice]').length,4,'Legacy deep link did not route to Writing');
 await t.route('practice/not-an-exam');assert.strictEqual(t.d.querySelectorAll('[data-practice-choice]').length,2,'Invalid route did not recover');
 const failed=await boot({}, {hash:'#practice/cambridge/reading/part2',fail:'cambridge'});assert(failed.d.getElementById('practice-start').disabled);assert(!failed.d.getElementById('practice-reload').hidden);failed.recover();failed.d.getElementById('practice-reload').click();for(let i=0;i<12;i++)await tick();assert(!failed.d.getElementById('practice-start').disabled);failed.close();
 assert.deepStrictEqual(t.errors,[]);t.close();console.log(JSON.stringify({passed:true,timezone:process.env.TZ,checks:'real theme plus tab/hero/legacy link clicks, keyboard, browser back/forward, modified links, exam/skill/type navigation, no detailed catalogs, all categories, coherent passage groups, unanswered priority, review, two archived drafts, cross-day reload, preserved results, batch grading, five-task writing, listening, repeat, daily route, old links, loading recovery'}));
})().catch(error=>{console.error(error);process.exit(1);});
