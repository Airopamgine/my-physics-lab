// Isolated DOM fixture, never a production login bypass.
// NODE_PATH=<jsdom>/node_modules TOEFL_HTML=<Hugo build>/toefl/index.html node tests/verify_writing_dom.cjs
const fs = require('fs');
const assert = require('assert');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.env.TOEFL_HTML, 'utf8');
const bank = JSON.parse(fs.readFileSync('static/data/toefl-writing-bank.json', 'utf8'));
const app = fs.readFileSync('static/js/writing-lab.js', 'utf8');
const bridge = fs.readFileSync('static/js/chatgpt-bridge.js', 'utf8');
const KEY = 'mastersPhysicsLab.writingLab.v1';
const priorKey = 'mastersPhysicsLab.englishLibraryProgress.v1';
const sentences = bank.exercises.filter(q => q.type === 'sentence');
const grammar = bank.exercises.filter(q => q.type === 'grammar');
const essays = bank.exercises.filter(q => ['email', 'discussion'].includes(q.type));
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

async function boot(saved, config = {}) {
  const dom = new JSDOM(html, { url: 'https://airopamgine.github.io/my-physics-lab/toefl/', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window, d = w.document;
  w.HTMLElement.prototype.scrollIntoView = () => {};
  let requests = 0, now = config.now || 1800000000000;
  const timers = [];
  w.Date.now = () => now;
  w.setInterval = cb => { timers.push(cb); return timers.length; };
  w.fetch = async () => { requests++; return config.fetch ? config.fetch() : { ok: true, json: async () => bank }; };
  w.localStorage.setItem(priorKey, '{"answers":{"keep-me":true}}');
  if (saved !== undefined) w.localStorage.setItem(KEY, typeof saved === 'string' ? saved : JSON.stringify(saved));
  if (config.storageFails) w.Storage.prototype.setItem = () => { throw new Error('Quota'); };
  w.eval(bridge); w.eval(app);
  assert.strictEqual(requests, 0, 'Fetched protected exercises before unlock');
  assert.strictEqual(d.querySelectorAll('[data-writing-start]').length, 0);
  // Simulate the app's documented successful-auth event only in this fixture.
  d.dispatchEvent(new w.Event('toefl:unlocked'));
  await tick();
  return { dom, w, d, advance: seconds => { now += seconds * 1000; timers.forEach(cb => cb()); },
    saved: () => JSON.parse(w.localStorage.getItem(KEY)), requests: () => requests, now: () => now };
}
function type(t, id, value) { const el = t.d.getElementById(`writing-${id}`); el.value = value; el.dispatchEvent(new t.w.Event('input')); }
function click(t, id) { t.d.getElementById(`writing-${id}`).click(); }
function open(t, q) {
  t.d.querySelector(`[data-writing-task="${q.type}"]`).click();
  type(t, 'search', q.id);
  const button = t.d.querySelector(`[data-writing-start="${q.id}"]`);
  assert(button, `Missing exercise ${q.id}`); button.click();
}
function solve(t, q, wrong = false, solution = q.solutions[0]) {
  const order = [...solution];
  if (wrong) order.reverse();
  order.forEach(i => t.d.querySelector(`[data-writing-tile="${i}"]`).click());
  click(t, 'check');
}

(async () => {
  const t = await boot();
  assert(t.d.getElementById('writing-total').textContent.includes(`${bank.exercises.length}演習`));
  assert.strictEqual(t.d.querySelectorAll('.writing-reference').length, bank.guides.length);
  for (const q of bank.exercises) {
    open(t, q);
    assert.strictEqual(t.d.getElementById('writing-exercise-title').textContent, q.title);
    assert(t.d.getElementById('writing-prompt').textContent.includes(q.context || q.prompt));
    assert(t.d.getElementById('writing-review').hidden, `Premature model: ${q.id}`);
    if (q.editorNote) assert(t.d.getElementById('writing-prompt').textContent.includes(q.editorNote));
    if (q.type === 'sentence') {
      assert(t.d.getElementById('writing-check').disabled);
      solve(t, q, true);
      assert.strictEqual(t.d.getElementById('writing-feedback').dataset.result, 'incorrect', q.id);
      click(t, 'clear'); solve(t, q);
      assert.strictEqual(t.d.getElementById('writing-feedback').dataset.result, 'correct', q.id);
      // Removing a filled slot restores its tile and invalidates the previous result.
      t.d.querySelector('[data-writing-slot="0"]').click();
      assert(t.d.getElementById('writing-check').disabled);
      assert(t.d.getElementById('writing-review').hidden);
      click(t, 'clear'); solve(t, q);
      for (const solution of q.solutions.slice(1)) {
        click(t, 'clear'); solve(t, q, false, solution);
        assert.strictEqual(t.d.getElementById('writing-feedback').dataset.result, 'correct', `${q.id} alternative`);
      }
      const twins = q.solutions[0].find((index, slot) => q.solutions[0].some((other, at) => at > slot && q.tiles[index] === q.tiles[other]));
      if (twins !== undefined) {
        const equivalent = [...q.solutions[0]], positions = equivalent.map((index, slot) => q.tiles[index] === q.tiles[twins] ? slot : -1).filter(n => n >= 0);
        [equivalent[positions[0]], equivalent[positions[1]]] = [equivalent[positions[1]], equivalent[positions[0]]];
        click(t, 'clear'); solve(t, q, false, equivalent);
        assert.strictEqual(t.d.getElementById('writing-feedback').dataset.result, 'correct', `${q.id} duplicate tile identity`);
      }
    } else if (q.type === 'grammar') {
      assert(t.d.getElementById('writing-check').disabled);
      assert(t.d.getElementById('writing-essay-panel').hidden);
      assert(t.d.getElementById('writing-frame').hidden);
      q.choices.forEach((text, i) => assert(t.d.querySelector(`[data-writing-choice="${i}"]`).parentElement.textContent.includes(text)));
      for (let i = 0; i < q.choices.length; i++) {
        if (i === q.correctIndex) continue;
        t.d.querySelector(`[data-writing-choice="${i}"]`).click(); click(t, 'check');
        assert.strictEqual(t.d.getElementById('writing-feedback').dataset.result, 'incorrect', `${q.id} choice ${i}`);
      }
      t.d.querySelector(`[data-writing-choice="${q.correctIndex}"]`).click();
      assert(t.d.getElementById('writing-review').hidden); click(t, 'check');
      assert.strictEqual(t.d.getElementById('writing-feedback').dataset.result, 'correct', q.id);
      assert.strictEqual(t.saved().records[q.id].choice, q.correctIndex);
    } else {
      assert(t.d.getElementById('writing-finish').disabled);
      assert(t.d.getElementById('writing-export').disabled);
      (q.posts || []).forEach(post => assert(t.d.getElementById('writing-prompt').textContent.includes(post.name)));
      q.requirements.forEach(item => assert(t.d.getElementById('writing-prompt').textContent.includes(item)));
      type(t, 'answer', "I don't want off-task behavior. My revised response.");
      type(t, 'notes', '日本語の構成メモは語数に含めない');
      assert(t.d.getElementById('writing-word-count').textContent.startsWith('8 words'));
      assert.strictEqual(t.saved().records[q.id].answer, t.d.getElementById('writing-answer').value);
      click(t, 'finish');
      assert.strictEqual(t.d.getElementById('writing-feedback').dataset.result, 'saved');
      assert(!t.d.getElementById('writing-feedback').textContent.includes('点 /'));
      assert(t.d.getElementById('writing-model-note').textContent.includes('編集'));
      t.d.querySelector('[data-writing-selfcheck="0"]').click();
      assert(t.saved().records[q.id].checks.includes(0));
      click(t, 'mark-done');
      assert.strictEqual(t.saved().records[q.id].rating, 'done');
      type(t, 'answer', q.modelAnswer);
      assert.strictEqual(t.saved().records[q.id].rating, '');
      assert.strictEqual(t.d.querySelector('[data-writing-selfcheck="0"]').checked, false);
      assert(t.d.getElementById('writing-submitted-answer').textContent.includes('My revised response.'));
      click(t, 'finish');
      assert.strictEqual(t.saved().records[q.id].history.length, 2);
      click(t, 'mark-done');
      const prompt = t.w.ToeflChatGPTBridge.buildPrompt({ writingReview: true, userAnswer: q.modelAnswer, instruction: q.requirements.join('\n') });
      assert(prompt.includes('unofficial estimate'));
      assert(prompt.includes('task fulfillment'));
      assert(prompt.includes(q.modelAnswer));
    }
    assert(!t.d.getElementById('writing-review').hidden, q.id);
    assert.strictEqual(t.d.getElementById('writing-model').textContent, q.modelAnswer);
    q.explanation.forEach(text => assert(t.d.getElementById('writing-explanation').textContent.includes(text)));
    q.phrases.forEach(text => assert(t.d.getElementById('writing-explanation').textContent.includes(text)));
    assert.strictEqual(t.w.localStorage.getItem(priorKey), '{"answers":{"keep-me":true}}');
  }
  assert(t.d.getElementById('writing-progress').textContent.includes(`${sentences.length}/${sentences.length}`));
  assert(t.d.getElementById('writing-progress').textContent.includes(`${grammar.length}/${grammar.length}`));
  assert(t.d.getElementById('writing-progress').textContent.includes(`${essays.length}/${essays.length}`));
  const snapshot = t.saved();
  const reload = await boot(snapshot);
  assert(!reload.d.getElementById('writing-runner').hidden);
  assert.strictEqual(reload.d.getElementById('writing-answer').value, bank.exercises.at(-1).modelAnswer);
  click(reload, 'close'); type(reload, 'search', '');
  reload.d.getElementById('writing-filter').value = 'done';
  reload.d.getElementById('writing-filter').dispatchEvent(new reload.w.Event('change'));
  assert.strictEqual(reload.d.querySelectorAll('[data-writing-start]').length, bank.exercises.filter(q => q.type === bank.exercises.at(-1).type).length);
  reload.d.querySelector('[data-writing-task="grammar"]').click();
  assert.strictEqual(reload.d.querySelectorAll('[data-writing-start]').length, grammar.length);
  reload.d.querySelector('[data-writing-task="sentence"]').click();
  assert.strictEqual(reload.d.querySelectorAll('[data-writing-start]').length, sentences.length);
  t.dom.window.close(); reload.dom.window.close();

  const mcq = grammar[0];
  const restoredChoice = await boot({ version: 1, task: 'grammar', lastId: mcq.id, records: { [mcq.id]: { choice: mcq.correctIndex, checked: true } } });
  assert.strictEqual(restoredChoice.d.getElementById('writing-feedback').dataset.result, 'correct');
  assert.strictEqual(restoredChoice.d.querySelector('input[name="writing-choice"]:checked').value, String(mcq.correctIndex));
  restoredChoice.dom.window.close();
  const invalidChoice = await boot({ version: 1, task: 'grammar', lastId: mcq.id, records: { [mcq.id]: { choice: 99, checked: true } } });
  assert(invalidChoice.d.getElementById('writing-check').disabled);
  assert(invalidChoice.d.getElementById('writing-review').hidden);
  invalidChoice.dom.window.close();
  const email = bank.exercises.find(q => q.type === 'email');
  const timer = await boot(); open(timer, email);
  type(timer, 'answer', 'The timer must never delete this draft.');
  click(timer, 'timer-toggle'); timer.advance(30);
  assert.strictEqual(timer.d.getElementById('writing-time').textContent, '06:30');
  click(timer, 'timer-toggle'); timer.advance(50);
  assert.strictEqual(timer.d.getElementById('writing-time').textContent, '06:30');
  click(timer, 'timer-toggle');
  const running = timer.saved();
  const resumed = await boot(running, { now: timer.now() }); resumed.advance(500);
  assert.strictEqual(resumed.d.getElementById('writing-time').textContent, '00:00');
  assert.strictEqual(resumed.d.getElementById('writing-answer').value, 'The timer must never delete this draft.');
  assert(resumed.d.getElementById('writing-feedback').textContent.includes('時間になりました'));
  click(resumed, 'timer-toggle');
  assert.strictEqual(resumed.d.getElementById('writing-time').textContent, '07:00');
  // HTML in an answer remains text in the comparison panel.
  type(resumed, 'answer', '<img src=x onerror="alert(1)"> Text only.'); click(resumed, 'finish');
  assert(!resumed.d.getElementById('writing-submission').querySelector('img'));
  assert(resumed.d.getElementById('writing-submitted-answer').textContent.includes('<img'));
  let blob, downloaded = false, filename;
  resumed.w.URL.createObjectURL = value => { blob = value; return 'blob:test'; };
  resumed.w.URL.revokeObjectURL = () => {};
  resumed.w.HTMLAnchorElement.prototype.click = function () { downloaded = true; filename = this.download; };
  click(resumed, 'export');
  assert(downloaded && blob.size > 0 && filename === `${email.id}.txt`);
  timer.dom.window.close(); resumed.dom.window.close();

  for (const corrupt of ['null', '[]', '{bad json', '{"version":1,"records":[]}']) {
    const broken = await boot(corrupt);
    assert.strictEqual(broken.d.querySelectorAll('[data-writing-start]').length, sentences.length);
    assert(broken.d.getElementById('writing-status').textContent.includes('保存済みデータ'));
    broken.dom.window.close();
  }
  const quota = await boot(undefined, { storageFails: true }); open(quota, email);
  type(quota, 'answer', 'A draft that can be downloaded.'); click(quota, 'finish');
  assert(quota.d.getElementById('writing-save-status').textContent.includes('保存できません'));
  assert(quota.d.getElementById('writing-status').textContent.includes('保存できません'));
  assert(!quota.d.getElementById('writing-review').hidden);
  quota.dom.window.close();
  let fail = true;
  const network = await boot(undefined, { fetch: () => ({ ok: !fail, json: async () => bank }) });
  assert(!network.d.getElementById('writing-retry').hidden);
  fail = false; click(network, 'retry'); await tick();
  assert.strictEqual(network.d.querySelectorAll('[data-writing-start]').length, sentences.length);
  assert.strictEqual(network.requests(), 2);
  network.dom.window.close();
  // Exercise the actual bridge factory and manual-copy fallback, without opening
  // an external window or sending an answer to ChatGPT.
  const copy = await boot(); open(copy, email);
  type(copy, 'answer', 'Please review this practice response.');
  const link = copy.d.querySelector('#writing-tutor .chatgpt-bridge__link');
  link.addEventListener('click', event => event.preventDefault());
  copy.w.console.error = () => {};
  copy.d.execCommand = () => false;
  link.click(); await tick();
  const manual = copy.d.querySelector('#writing-tutor textarea');
  assert(manual && manual.value.includes('Please review this practice response.'));
  email.requirements.forEach(text => assert(manual.value.includes(text)));
  assert(manual.value.includes('task fulfillment'));
  assert(!manual.value.includes(email.modelAnswer), 'Model leaked before submission');
  assert.strictEqual(link.getAttribute('href'), 'https://chatgpt.com/');
  const legacyPrompt = copy.w.ToeflChatGPTBridge.buildPrompt({ task: 'Reading', userAnswer: 'A' });
  assert(legacyPrompt.includes('For a multiple-choice answer'));
  copy.dom.window.close();
  // An original daily exercise keeps provenance separate from the PDF source.
  const original = { ...email, id: 'writing-original-fixture', collection: 'Original Writing', sourceRefs: ['original:writing:2099-01-01:email:1'], source: { kind: 'original', date: '2099-01-01' } };
  const originalBank = { ...bank, exercises: [...bank.exercises, original] };
  const daily = await boot(undefined, { fetch: () => ({ ok: true, json: async () => originalBank }) });
  open(daily, original);
  assert(daily.d.getElementById('writing-source').textContent.includes('Original Writing · 2099-01-01'));
  assert(!daily.d.getElementById('writing-source').textContent.includes('undefined'));
  daily.dom.window.close();
  console.log(`Writing DOM verified: all ${bank.exercises.length} exercises, ${sentences.length} sentence keys and all alternatives, ${grammar.length} MCQ keys and every wrong choice, ${essays.length} essay reviews, source notes, guides, original provenance, persistence, timers, export, filters, and recovery.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
