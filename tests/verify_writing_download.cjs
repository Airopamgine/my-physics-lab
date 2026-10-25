// Exercise the visible full-set download, not just the hidden legacy exporter.
const fs=require('fs'),assert=require('assert'),{JSDOM}=require('jsdom');
const html=fs.readFileSync(process.env.TOEFL_HTML,'utf8'),KEY='mastersPhysicsLab.writingLab.v1';
const base=JSON.parse(fs.readFileSync('static/data/toefl-writing-bank.json','utf8')),extra=JSON.parse(fs.readFileSync('static/data/toefl-writing-originals.json','utf8'));
const questions=[...base.exercises,...extra.exercises],email=questions.find(q=>q.type==='email'),discussion=questions.find(q=>q.type==='discussion'),sentence=questions.find(q=>q.type==='sentence'),grammar=questions.find(q=>q.type==='grammar');
const tick=()=>new Promise(resolve=>setTimeout(resolve,0)),notes='Keep this note.\n日本語メモ: café — ✓';
const response='Dear coordinator,\n\nPlease keep "my exact words" & line breaks.\n<img src=x> is plain text. 日本語も保存。\n\nKind regards,\nLearner';
async function boot(opts={}){
 const dom=new JSDOM(opts.legacy?html.replace(/data-grading(?:=set|="set")/,'data-grading=legacy'):html,{url:'https://airopamgine.github.io/my-physics-lab/toefl/',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,d=w.document;
 let blob=null,filename='',fetches=0;w.HTMLElement.prototype.scrollIntoView=()=>{};w.setInterval=()=>1;w.clearInterval=()=>{};w.Date.now=()=>new Date(2026,9,25,12).getTime();
 w.URL.createObjectURL=value=>{blob=value;return'blob:writing-download';};w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){filename=this.download;};
 w.fetch=async url=>{fetches++;return{ok:true,json:async()=>JSON.parse(JSON.stringify(String(url).includes('originals')?extra:base))};};
 w.localStorage.setItem(KEY,JSON.stringify({version:1,records:{[email.id]:{answer:'An older draft',notes,history:[],checks:[],rating:''}}}));
 for(const[k,v]of Object.entries(opts.saved||{}))w.localStorage.setItem(k,v);
 if(opts.quota)w.Storage.prototype.setItem=()=>{throw new Error('Quota');};
 for(const file of ['set-practice','writing-lab'])w.eval(fs.readFileSync(`static/js/${file}.js`,'utf8'));
 assert.strictEqual(fetches,0,'Download support loaded a bank before unlock');d.dispatchEvent(new w.CustomEvent('toefl:unlocked'));for(let i=0;i<10;i++)await tick();assert(w.ToeflWritingLab.getBank());
 return{dom,w,d,open(ids,context={}){assert(w.ToeflWritingLab.startSelection(ids,context));},snapshot:()=>Object.fromEntries(Object.keys(w.localStorage).map(k=>[k,w.localStorage.getItem(k)])),async download(button){blob=null;filename='';button.click();assert(blob&&filename,'Download did not produce a file');const content=await new Promise((resolve,reject)=>{const r=new w.FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsText(blob,'UTF-8');});return{content,filename,type:blob.type};},close(){dom.window.close();}};
}
const panel=t=>t.d.querySelector('[data-set-engine=writing]');
const row=(t,id)=>[...panel(t).querySelectorAll('[data-set-question]')].find(n=>n.dataset.setQuestion===id);
function input(t,id,value){const field=row(t,id).querySelector('textarea,input[type=text]');field.value=value;field.dispatchEvent(new t.w.Event('input'));}
const state=t=>JSON.stringify(t.w.EnglishSetPractice.getState('writing'));
const download=t=>t.download(panel(t).querySelector('[data-set-download]'));
function ungraded(t){assert(panel(t).querySelector('[data-set-review]').hidden);assert(!panel(t).querySelector('[data-set-result]'));assert(!t.w.EnglishSetPractice.getState('writing').submitted);}
function submit(t){panel(t).querySelector('form').dispatchEvent(new t.w.Event('submit',{cancelable:true,bubbles:true}));assert(!panel(t).querySelector('[data-set-review]').hidden);}
(async()=>{
 // Compare the production file to an actual download from the previous UI.
 const old=await boot({legacy:true});old.open([email.id]);old.d.getElementById('writing-answer').value=response;old.d.getElementById('writing-answer').dispatchEvent(new old.w.Event('input'));const previous=await old.download(old.d.getElementById('writing-export'));assert.strictEqual(previous.filename,email.id+'.txt');assert.strictEqual(previous.type,'text/plain;charset=utf-8');old.close();
 const t=await boot();t.open([email.id]);input(t,email.id,response);assert(panel(t).querySelector('[data-set-download]').textContent.includes('.txt'));
 const before=state(t),storage=t.snapshot(),current=await download(t);assert.deepStrictEqual(current,previous,'Visible Writing download changed the original text contract');assert.strictEqual(state(t),before,'Downloading altered the draft');assert.deepStrictEqual(t.snapshot(),storage,'Downloading changed stored progress');ungraded(t);
 assert(current.content.startsWith(email.title+'\nWrite an Email\nSource: '));assert(current.content.includes('Your response:\n'+response));assert(current.content.endsWith('Notes:\n'+notes+'\n'));assert(!current.content.includes(email.modelAnswer),'A download revealed the model before submission');
 // The frozen submitted response remains downloadable without another grade.
 submit(t);const submitted=state(t),history=t.w.ToeflWritingLab.getProgress()[email.id].history.length;assert.deepStrictEqual(await download(t),previous);assert.strictEqual(state(t),submitted);assert.strictEqual(t.w.ToeflWritingLab.getProgress()[email.id].history.length,history);
 // Discussion uses the same text layout and its own stable question filename.
 t.open([discussion.id]);input(t,discussion.id,'My discussion response.\nA specific example follows.');const opinion=await download(t);assert.strictEqual(opinion.filename,discussion.id+'.txt');assert(opinion.content.includes('Academic Discussion\nSource: '));assert(opinion.content.includes('Your response:\nMy discussion response.\nA specific example follows.'));ungraded(t);
 // Partial queues export every selected task without grading or inventing an
 // answer for an unfinished task. Reload keeps the same current responses.
 const context={dailyDate:'2026-10-24',dailySlot:4};t.open([email.id,discussion.id],context);input(t,email.id,'A revised email draft.\nSecond line.');input(t,discussion.id,'');const partial=await download(t);assert.strictEqual(partial.filename,'writing-answers-2026-10-24.txt');assert(partial.content.indexOf(email.title)<partial.content.indexOf(discussion.title));assert(partial.content.includes('Your response:\nA revised email draft.\nSecond line.'));assert(partial.content.includes('Your response:\n\n\nNotes:\n'));assert(partial.content.includes(notes));ungraded(t);assert(panel(t).querySelector('[data-set-submit]').disabled);
 const saved=t.snapshot(),reload=await boot({saved});reload.open([email.id,discussion.id],context);assert.deepStrictEqual(await download(reload),partial,'A resumed set downloaded old native answers instead of current set drafts');ungraded(reload);reload.close();
 // Export the learner's assembled sentence/selected option as readable text.
 t.open([sentence.id]);for(const i of sentence.solutions[0])row(t,sentence.id).querySelector(`[data-set-tile="${i}"]`).click();const built=await download(t);assert.strictEqual(built.filename,sentence.id+'.txt');assert(built.content.includes('Your response:\n'+sentence.modelAnswer));ungraded(t);
 t.open([grammar.id]);const blank=await download(t);assert(blank.content.includes('Your response:\n\n\nNotes:\n'),'An unanswered choice was exported as option zero');const choice=row(t,grammar.id).querySelector('input[type=radio]');choice.checked=true;choice.dispatchEvent(new t.w.Event('change'));const chosen=await download(t);assert(chosen.content.includes('Your response:\n'+grammar.choices[Number(choice.value)]));ungraded(t);
 // Other engines retain their existing machine-readable set backup.
 const host=t.d.createElement('section');t.d.getElementById('toefl-app').append(host);let grades=0;t.w.EnglishSetPractice.open({engine:'quick',id:'download-fixture',title:'Other engine',host,questions:[{id:'other-response',kind:'text',prompt:'Write a phrase',grade:()=>{grades++;return{result:'correct'};}}],onSubmit:()=>{}});
 const other=host.querySelector('input[type=text]');other.value='Keep this JSON backup';other.dispatchEvent(new t.w.Event('input'));const backup=await t.download(host.querySelector('[data-set-download]'));assert(backup.filename.endsWith('.json'));assert.strictEqual(backup.type,'application/json');const payload=JSON.parse(backup.content);assert.strictEqual(payload.format,'english-set-answers');assert.strictEqual(payload.answers['other-response'],'Keep this JSON backup');assert.strictEqual(grades,0);t.close();
 // A text download still works when browser storage has no space left.
 const quota=await boot({quota:true});quota.open([email.id]);input(quota,email.id,'This response survives a storage failure.');assert(panel(quota).textContent.includes('保存できません'));const rescue=await download(quota);assert.strictEqual(rescue.filename,email.id+'.txt');assert(rescue.content.includes('This response survives a storage failure.'));ungraded(quota);quota.close();
 console.log(JSON.stringify({passed:true,timezone:process.env.TZ,checks:'visible Writing TXT equals previous exporter, UTF-8, exact answers and notes, drafts and submitted work, no grading/model leak, complete and partial queues, reload, readable sentence/choice responses, other-engine JSON backups, storage failure'}));
})().catch(error=>{console.error(error);process.exit(1);});
