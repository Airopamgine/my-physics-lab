// Isolated DOM fixture. Never changes production auth or credentials.
// NODE_PATH=<jsdom>/node_modules TOEFL_HTML=<build>/toefl/index.html node tests/verify_vocabulary_dom.cjs
const fs = require('fs'), assert = require('assert');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.env.TOEFL_HTML, 'utf8');
const bank = JSON.parse(fs.readFileSync('static/data/toefl-vocabulary-bank.json', 'utf8'));
const app = fs.readFileSync('static/js/vocabulary-lab.js', 'utf8');
const KEY = 'mastersPhysicsLab.vocabularyLab.v1', OLD = 'mastersPhysicsLab.englishLibraryProgress.v1';
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
async function boot(saved, opts = {}) {
  const dom = new JSDOM(html, { url: 'https://airopamgine.github.io/my-physics-lab/toefl/', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window, d = w.document; let fetches = 0, now = 1791558000000;
  const timers = []; w.Date.now = () => now; w.setInterval = cb => { timers.push(cb); return timers.length; };
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.localStorage.setItem(OLD, 'keep-reading'); w.localStorage.setItem('mastersPhysicsLab.writingLab.v1', 'keep-writing');
  if (saved !== undefined) w.localStorage.setItem(KEY, typeof saved === 'string' ? saved : JSON.stringify(saved));
  if (opts.storageFails) w.Storage.prototype.setItem = () => { throw new Error('Quota'); };
  if (opts.indexedDB) w.indexedDB = opts.indexedDB;
  w.fetch = async () => { fetches++; return opts.fetchFails ? { ok: false } : { ok: true, json: async () => opts.payload || bank }; };
  w.eval(app);
  assert.strictEqual(fetches, 0); d.getElementById('vocabulary-load').click(); assert.strictEqual(fetches, 0, 'Fetched before authentication');
  // Documented successful-auth event only in this isolated fixture.
  d.dispatchEvent(new w.Event('toefl:unlocked')); assert.strictEqual(fetches, 0, 'Dictionary should load lazily');
  d.getElementById('vocabulary-load').click();
  for (let i = 0; i < 100; i++) { await tick(); if (!d.getElementById('vocabulary-content').hidden || !d.getElementById('vocabulary-load').disabled) break; }
  return { dom, w, d, api: w.ToeflVocabularyLab, advance: ms => { now += ms; timers.forEach(cb => cb()); }, fetches: () => fetches };
}
const el = (t, id) => t.d.getElementById('vocabulary-' + id);
const click = (t, id) => el(t, id).click();
function input(t, id, value) { el(t, id).value = value; el(t, id).dispatchEvent(new t.w.Event('input')); }
function choose(t, c, wrong = false) { const b = [...el(t, 'choices').children].find(b => (Number(b.dataset.vocabularyChoice) === c.entry) !== wrong); assert(b); b.click(); }
function check(t) { el(t, 'answer-form').dispatchEvent(new t.w.Event('submit', { bubbles: true, cancelable: true })); }
function openDetails(t, selector) { const d = t.d.querySelector(selector); assert(d); d.open = true; d.dispatchEvent(new t.w.Event('toggle')); return d; }

(async () => {
  const t = await boot(); const all = t.api.getCards();
  assert.strictEqual(t.api.getBank().entries.length, bank.entries.length);
  assert.strictEqual(t.fetches(), 1); assert.strictEqual(el(t, 'content').hidden, false);
  assert.strictEqual(all.length, bank.stats.glossaryCards + bank.stats.dictionaryCards + bank.stats.contextEntries);
  assert(el(t, 'coverage-note').textContent.includes('意味の説明がない'));
  assert(t.d.querySelector('[href="#vocabulary-lab"]'));
  // Render every context and every meaning card. No growing progress fixture;
  // grading/state transitions are exercised independently below.
  let visited = 0;
  for (const c of all) {
    assert(t.api.startCards([c.id]), c.id);
    const e = bank.entries[c.entry];
    assert(el(t, 'check').disabled, c.id); assert(el(t, 'explanation').hidden);
    if (c.mode === 'context') {
      assert.strictEqual(el(t, 'question').textContent, c.context.text.slice(0, c.context.start) + '［　　］' + c.context.text.slice(c.context.end));
      assert(el(t, 'hint').textContent.includes(bank.documents[c.context.source].title));
    } else {
      assert.strictEqual(el(t, 'question').textContent, c.mode === 'glossary' ? c.gloss.text : bank.senses[c.sense].definition);
      const choices = [...el(t, 'choices').children];
      assert.strictEqual(choices.length, 4, c.id);
      assert.strictEqual(new Set(choices.map(b => b.textContent)).size, 4, c.id);
      assert(choices.some(b => Number(b.dataset.vocabularyChoice) === c.entry && b.textContent === e.term));
      const targetSenses = new Set(e.dictionary.map(d => d.sense));
      for (const b of choices) if (Number(b.dataset.vocabularyChoice) !== c.entry) {
        assert(!bank.entries[Number(b.dataset.vocabularyChoice)].dictionary.some(d => targetSenses.has(d.sense)), `Synonym distractor: ${c.id}`);
      }
    }
    if (++visited % 10000 === 0) console.log(`Vocabulary DOM ${visited}/${all.length}`);
  }
  console.log(`Every vocabulary card rendered: ${visited}`);

  const context = all.find(c => bank.entries[c.entry].term === 'absorb' && c.mode === 'context');
  t.api.startCards([context.id]); input(t, 'answer', 'wrong'); check(t);
  assert.strictEqual(el(t, 'feedback').dataset.result, 'incorrect');
  assert.strictEqual(t.api.getProgress().records[context.id].streak, 0);
  const attempts = t.api.getProgress().records[context.id].attempts; check(t);
  assert.strictEqual(t.api.getProgress().records[context.id].attempts, attempts, 'Double grading');
  t.api.startCards([context.id]); input(t, 'answer', ' ＡＢＳＯＲＢ '); check(t);
  assert.strictEqual(el(t, 'feedback').dataset.result, 'correct');
  assert.strictEqual(t.api.getProgress().records[context.id].streak, 1);
  t.api.startCards([context.id]); input(t, 'answer', 'absorb'); check(t);
  assert.strictEqual(t.api.getProgress().records[context.id].streak, 1, 'Same-day repetition counted as long-term mastery');
  t.advance(86400000); t.api.startCards([context.id]); input(t, 'answer', 'absorb'); check(t);
  assert.strictEqual(t.api.getProgress().records[context.id].streak, 2);
  for (const mode of ['glossary', 'dictionary']) {
    const c = all.find(c => bank.entries[c.entry].term === 'absorb' && c.mode === mode);
    t.api.startCards([c.id]); choose(t, c, true); check(t); assert.strictEqual(el(t, 'feedback').dataset.result, 'incorrect');
    t.api.startCards([c.id]); choose(t, c); check(t); assert.strictEqual(el(t, 'feedback').dataset.result, 'correct');
    assert(el(t, 'explanation').textContent.includes('absorb'));
  }
  t.api.startCards([context.id]); click(t, 'reveal');
  assert.strictEqual(el(t, 'feedback').dataset.result, 'revealed'); assert.strictEqual(t.api.getProgress().records[context.id].streak, 0);
  t.api.startCards([context.id]); input(t, 'answer', 'abs'); t.advance(65000); click(t, 'close');
  const saved = JSON.parse(t.w.localStorage.getItem(KEY));
  assert.strictEqual(saved.session.draft, 'abs'); assert(saved.session.elapsed >= 65000);
  const restored = await boot(saved); click(restored, 'resume');
  assert.strictEqual(el(restored, 'answer').value, 'abs'); assert(el(restored, 'timer').textContent.startsWith('1:'));
  assert(el(restored, 'feedback').hidden);
  input(restored, 'answer', 'absorb'); check(restored); click(restored, 'next'); assert.strictEqual(restored.api.getProgress().session, null);
  restored.d.querySelector('[data-vocabulary-view="book"]').click(); input(restored, 'search', 'absorb');
  assert(el(restored, 'list').textContent.includes('absorb'));
  const detail = openDetails(restored, '#vocabulary-list .vocabulary-entry');
  assert(detail.textContent.includes('日本語の語注'));
  const memo = detail.querySelector('[data-vocabulary-memo]'); memo.value = '<script>my note</script>'; memo.dispatchEvent(new restored.w.Event('input', { bubbles: true }));
  detail.querySelector('[data-vocabulary-star]').click(); assert(restored.api.getProgress().stars[bank.entries[Number(memo.dataset.vocabularyMemo)].id]);
  assert.strictEqual(detail.querySelectorAll('script').length, 0, 'Notes interpreted as HTML');
  input(restored, 'search', '吸収'); assert(el(restored, 'list').textContent.length);
  const scope = el(restored, 'scope'); scope.value = 'Writing'; scope.dispatchEvent(new restored.w.Event('change'));
  input(restored, 'search', 'zzzz-no-term'); assert.strictEqual(el(restored, 'list').children.length, 0);
  input(restored, 'search', ''); scope.value = 'all'; scope.dispatchEvent(new restored.w.Event('change'));
  restored.d.querySelector('[data-vocabulary-view="coverage"]').click();
  input(restored, 'source-search', 'writing-original-20261009'); assert(el(restored, 'source-list').children.length);
  const source = el(restored, 'source-list').querySelector('[data-vocabulary-source]'); assert(source); source.click();
  assert(el(restored, 'selection').textContent.includes('教材:')); assert.strictEqual(el(restored, 'clear-source').hidden, false);
  click(restored, 'clear-source'); assert.strictEqual(el(restored, 'clear-source').hidden, true);
  // Export carries the actual saved state, never the underlying lesson bank.
  let exported, downloaded; restored.w.URL.createObjectURL = blob => { exported = blob; return 'blob:vocabulary-export'; };
  restored.w.URL.revokeObjectURL = () => {};
  restored.w.HTMLAnchorElement.prototype.click = function () { downloaded = { href: this.href, name: this.download }; };
  click(restored, 'export'); assert(exported); assert.strictEqual(downloaded.href, 'blob:vocabulary-export');
  assert(/^toefl-vocabulary-\d{4}-\d{2}-\d{2}\.json$/.test(downloaded.name));
  const exportedText = await new Promise((resolve, reject) => { const reader = new restored.w.FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsText(exported); });
  const exportedState = JSON.parse(exportedText);
  assert.deepStrictEqual(exportedState, JSON.parse(JSON.stringify(restored.api.getProgress()))); assert(!exportedState.entries, 'Export contains lesson content');
  click(restored, 'reset'); assert.strictEqual(el(restored, 'reset-confirm').hidden, false); click(restored, 'reset-no');
  assert(restored.api.getProgress().history.length); click(restored, 'reset'); click(restored, 'reset-yes');
  assert.strictEqual(Object.keys(restored.api.getProgress().records).length, 0);
  assert.strictEqual(restored.w.localStorage.getItem(OLD), 'keep-reading'); assert.strictEqual(restored.w.localStorage.getItem('mastersPhysicsLab.writingLab.v1'), 'keep-writing');
  const bad = await boot('broken-json'); assert(bad.api.getBank()); assert(el(bad, 'status').textContent.includes('読み込めなかった'));
  const failed = await boot(undefined, { fetchFails: true }); assert.strictEqual(failed.api.getBank(), null); assert(el(failed, 'status').textContent.includes('再試行'));
  const invalid = await boot(undefined, { payload: { schemaVersion: 1, entries: [] } }); assert.strictEqual(invalid.api.getBank(), null);
  const quota = await boot(undefined, { storageFails: true }); quota.api.startCards([context.id]); input(quota, 'answer', 'absorb'); check(quota);
  assert.strictEqual(el(quota, 'feedback').dataset.result, 'correct'); assert(el(quota, 'save-status').textContent.includes('保存できません'));
  // Actual IndexedDB transactions, including a history exceeding localStorage's
  // typical quota. The fallback above remains independently covered.
  const { IDBFactory } = require('fake-indexeddb'); const idb = new IDBFactory();
  const dbFixture = await boot(undefined, { indexedDB: idb, storageFails: true });
  dbFixture.api.startCards([context.id]); input(dbFixture, 'answer', 'absorb'); check(dbFixture);
  for (let i = 0; i < 10; i++) await tick();
  const dbReload = await boot(undefined, { indexedDB: idb, storageFails: true });
  assert.strictEqual(dbReload.api.getProgress().records[context.id].result, 'correct');
  assert(!el(dbFixture, 'save-status').textContent.includes('保存できません'));
  const fullProgress = { schemaVersion: 1, records: {}, notes: {}, stars: {}, history: [], session: null };
  for (const c of all) fullProgress.records[c.id] = { attempts: 1, correct: 1, wrong: 0, streak: 1, result: 'correct', last: 1791558000000, due: 1791644400000, lastCorrectDay: '2026-10-09' };
  const fullText = JSON.stringify(fullProgress); assert(fullText.length > 5000000);
  Object.defineProperty(el(dbFixture, 'import'), 'files', { value: [{ size: fullText.length, text: async () => fullText }] });
  el(dbFixture, 'import').dispatchEvent(new dbFixture.w.Event('change'));
  for (let i = 0; i < 15; i++) await tick();
  assert.strictEqual(Object.keys(dbFixture.api.getProgress().records).length, all.length);
  const dbFullReload = await boot(undefined, { indexedDB: idb, storageFails: true });
  assert.strictEqual(Object.keys(dbFullReload.api.getProgress().records).length, all.length, 'Complete-corpus history lost');
  Object.defineProperty(el(restored, 'import'), 'files', { value: [{ size: 3, text: async () => 'bad' }] });
  el(restored, 'import').dispatchEvent(new restored.w.Event('change')); await tick();
  assert(el(restored, 'status').textContent.includes('保持しています'));
  for (const fixture of [t, restored, bad, failed, invalid, quota, dbFixture, dbReload, dbFullReload]) fixture.dom.window.close();
  console.log(`PASS: ${visited} cards; wrong/correct/reveal, normalization, distinct-day review, draft/history/timer, notes/search/source coverage, auth, malformed state, quota, retry, and prior progress preservation`);
})().catch(error => { console.error(error); process.exit(1); });
