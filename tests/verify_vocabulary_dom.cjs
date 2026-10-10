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
  const w = dom.window, d = w.document; let fetches = 0, now = 1791558000000, spoken = null;
  const timers = []; w.Date.now = () => now; w.setInterval = cb => { timers.push(cb); return timers.length; };
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.localStorage.setItem(OLD, 'keep-reading'); w.localStorage.setItem('mastersPhysicsLab.writingLab.v1', 'keep-writing');
  if (saved !== undefined) w.localStorage.setItem(KEY, typeof saved === 'string' ? saved : JSON.stringify(saved));
  if (opts.storageFails) w.Storage.prototype.setItem = () => { throw new Error('Quota'); };
  if (opts.indexedDB) w.indexedDB = opts.indexedDB;
  if (opts.speech) {
    w.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
    w.speechSynthesis = { cancel() {}, getVoices: () => [{ lang: 'en-US' }], speak(u) { spoken = u; } };
  }
  // No material-opening API exists in this fixture. All quizzes must still work.
  w.fetch = async () => { fetches++; return opts.fetchFails ? { ok: false } : { ok: true, json: async () => opts.payload || bank }; };
  w.eval(app);
  assert.strictEqual(fetches, 0); d.getElementById('vocabulary-load').click(); assert.strictEqual(fetches, 0, 'Fetched before authentication');
  // Successful-auth event only in this isolated fixture.
  d.dispatchEvent(new w.Event('toefl:unlocked')); assert.strictEqual(fetches, 0, 'Dictionary should load lazily');
  d.getElementById('vocabulary-load').click();
  for (let i = 0; i < 100; i++) { await tick(); if (!d.getElementById('vocabulary-content').hidden || !d.getElementById('vocabulary-load').disabled) break; }
  return { dom, w, d, api: w.ToeflVocabularyLab, advance: ms => { now += ms; timers.forEach(cb => cb()); }, fetches: () => fetches, spoken: () => spoken };
}
const el = (t, id) => t.d.getElementById('vocabulary-' + id);
const click = (t, id) => el(t, id).click();
function input(t, id, value) { el(t, id).value = value; el(t, id).dispatchEvent(new t.w.Event('input')); }
function choose(t, c, wrong = false) { const b = [...el(t, 'choices').children].find(b => (Number(b.dataset.vocabularyChoice) === c.entry) !== wrong); assert(b); b.click(); }
function openDetails(t, selector) { const d = t.d.querySelector(selector); assert(d); d.open = true; d.dispatchEvent(new t.w.Event('toggle')); return d; }
const answer = c => c.mode === 'glossary' ? c.gloss.text : bank.senses[c.sense].definition;

(async () => {
  const t = await boot(); const all = t.api.getCards();
  assert.strictEqual(t.api.getBank().entries.length, bank.entries.length);
  assert.strictEqual(t.fetches(), 1); assert.strictEqual(el(t, 'content').hidden, false);
  assert.strictEqual(el(t, 'quiz').hidden, false); assert.strictEqual(el(t, 'book').hidden, true);
  assert.strictEqual(el(t, 'batch').value, '10'); assert.strictEqual(el(t, 'mode').value, 'learn');
  assert.strictEqual(all.length, bank.stats.quizCards);
  assert.strictEqual(all.filter(c => c.mode === 'glossary').length, bank.stats.quizGlossaryCards);
  assert(!all.some(c => c.mode === 'context' || c.archived));
  assert(!t.api.startCards(['vocab:absorb|context']), 'Retired source-reproduction quiz still playable');
  assert(!el(t, 'mode').querySelector('[value="context"]'));
  assert(!t.d.getElementById('vocabulary-answer-form'));
  assert(el(t, 'coverage-note').textContent.includes('意味の説明がない'));
  assert(t.d.querySelector('[href="#vocabulary-lab"]'));
  // Render every standalone meaning card with source-opening APIs absent.
  // Avoid a growing O(n^2) saved progress fixture; grade transitions below.
  let visited = 0;
  for (const c of all) {
    assert(t.api.startCards([c.id]), c.id);
    const e = bank.entries[c.entry];
    assert(el(t, 'explanation').hidden); assert(el(t, 'feedback').hidden); assert(el(t, 'next').disabled);
    assert.strictEqual(el(t, 'question').textContent, e.term);
    assert(!el(t, 'hint').textContent.includes('教材に書かれた'), c.id);
    assert.strictEqual(el(t, 'runner').querySelectorAll('a,[data-vocabulary-source],[data-vocabulary-material]').length, 0, c.id);
    const choices = [...el(t, 'choices').children];
    assert.strictEqual(choices.length, 4, c.id);
    assert.strictEqual(new Set(choices.map(b => b.textContent)).size, 4, c.id);
    assert(choices.some(b => Number(b.dataset.vocabularyChoice) === c.entry && b.textContent === answer(c)), c.id);
    assert(choices.every(b => !b.disabled && b.getAttribute('aria-pressed') === 'false'));
    const targetSenses = new Set(e.dictionary.map(d => d.sense));
    const targetLemmas = new Set(e.dictionary.map(d => d.lemma));
    for (const b of choices) if (Number(b.dataset.vocabularyChoice) !== c.entry) {
      const distractor = bank.entries[Number(b.dataset.vocabularyChoice)];
      assert(!distractor.dictionary.some(d => targetSenses.has(d.sense) || targetLemmas.has(d.lemma)), `Synonym/inflection distractor: ${c.id}`);
      assert(!e.dictionary.some(d => bank.senses[d.sense].definition === b.textContent), `Another attested meaning was marked wrong: ${c.id}`);
      if (c.mode === 'glossary') assert(!e.quizGlosses.some(g => g.text === b.textContent));
    }
    if (++visited % 10000 === 0) console.log(`Vocabulary DOM ${visited}/${all.length}`);
  }
  console.log(`Every standalone vocabulary question rendered: ${visited}`);

  const meaning = all.find(c => bank.entries[c.entry].term === 'absorb' && c.mode === 'glossary');
  t.api.startCards([meaning.id]); const emptyBefore = JSON.stringify(t.api.getProgress().records); click(t, 'next');
  assert.strictEqual(JSON.stringify(t.api.getProgress().records), emptyBefore, 'Empty answer was graded');
  choose(t, meaning, true); assert.strictEqual(el(t, 'feedback').dataset.result, 'incorrect', 'Tap did not grade immediately');
  assert.strictEqual(t.api.getProgress().records[meaning.id].streak, 0);
  const attempts = t.api.getProgress().records[meaning.id].attempts; choose(t, meaning);
  assert.strictEqual(t.api.getProgress().records[meaning.id].attempts, attempts, 'Double grading');
  assert.strictEqual(el(t, 'choices').querySelectorAll('[data-result="correct"]').length, 1);
  assert.strictEqual(el(t, 'choices').querySelectorAll('[data-result="incorrect"]').length, 1);
  assert.strictEqual(el(t, 'runner').querySelectorAll('a,[data-vocabulary-source],[data-vocabulary-material]').length, 0);
  for (const mode of ['glossary', 'dictionary']) {
    const c = all.find(c => bank.entries[c.entry].term === 'absorb' && c.mode === mode);
    t.api.startCards([c.id]); choose(t, c, true); assert.strictEqual(el(t, 'feedback').dataset.result, 'incorrect');
    t.api.startCards([c.id]); choose(t, c); assert.strictEqual(el(t, 'feedback').dataset.result, 'correct');
    assert(el(t, 'explanation').textContent.includes(answer(c)));
    assert(el(t, 'explanation').querySelector('details'), 'Optional example missing');
    assert.strictEqual(el(t, 'explanation').querySelector('details').open, false);
  }
  t.api.startCards([meaning.id]); choose(t, meaning); assert.strictEqual(t.api.getProgress().records[meaning.id].streak, 1);
  t.advance(86400000); t.api.startCards([meaning.id]); choose(t, meaning);
  assert.strictEqual(t.api.getProgress().records[meaning.id].streak, 2, 'Distinct-day review did not count');
  t.api.startCards([meaning.id]); choose(t, meaning); assert.strictEqual(t.api.getProgress().records[meaning.id].streak, 2, 'Same-day repetition inflated mastery');
  t.api.startCards([meaning.id]); click(t, 'reveal');
  assert.strictEqual(el(t, 'feedback').dataset.result, 'revealed'); assert.strictEqual(t.api.getProgress().records[meaning.id].streak, 0);

  t.api.startCards([meaning.id]); t.advance(30000); t.d.querySelector('[data-vocabulary-view="quiz"]').click(); t.advance(35000); click(t, 'close');
  const saved = JSON.parse(t.w.localStorage.getItem(KEY)); assert(saved.session.elapsed >= 65000); assert.strictEqual(saved.session.checked, false);
  const savedOptions = [...el(t, 'choices').children].map(b => b.textContent);
  const restored = await boot(saved); click(restored, 'resume');
  assert(el(restored, 'timer').textContent.startsWith('1:')); assert(el(restored, 'feedback').hidden);
  assert.strictEqual(restored.api.getProgress().session.seed, saved.session.seed);
  assert.deepStrictEqual([...el(restored, 'choices').children].map(b => b.textContent), savedOptions, 'Choices changed while resuming the same session');
  choose(restored, meaning); click(restored, 'close');
  const checkedReload = await boot(JSON.parse(restored.w.localStorage.getItem(KEY))); click(checkedReload, 'resume');
  assert.strictEqual(el(checkedReload, 'feedback').dataset.result, 'correct');
  assert.strictEqual(checkedReload.api.getProgress().session.selection, bank.entries[meaning.entry].id, 'Choice saved as unstable corpus index');
  assert.strictEqual(el(checkedReload, 'choices').querySelector('[aria-pressed="true"]').textContent, answer(meaning));
  click(restored, 'resume'); click(restored, 'next'); assert.strictEqual(restored.api.getProgress().session, null);
  assert.strictEqual(el(restored, 'round').hidden, false); assert(el(restored, 'retry').hidden);

  // A round lists all mistakes and restarts only those cards.
  const second = all.find(c => c.entry !== meaning.entry && c.mode === 'glossary');
  restored.api.startCards([meaning.id, second.id]); choose(restored, meaning, true); click(restored, 'next'); click(restored, 'reveal'); click(restored, 'next');
  assert.strictEqual(el(restored, 'round-words').children.length, 2); assert(!el(restored, 'retry').hidden);
  click(restored, 'retry'); assert.deepStrictEqual(Array.from(restored.api.getProgress().session.ids), [meaning.id, second.id]);
  click(restored, 'close'); el(restored, 'mode').value = 'learn'; click(restored, 'start');
  const batch = restored.api.getProgress().session.ids.map(id => all.find(c => c.id === id));
  assert.strictEqual(batch.length, 10); assert.strictEqual(new Set(batch.map(c => c.entry)).size, 10);
  assert(batch.every(c => c.mode === 'glossary' || !bank.entries[c.entry].quizGlosses.length), 'Recommended mode ignored Japanese meaning');
  click(restored, 'close');

  restored.d.querySelector('[data-vocabulary-view="book"]').click(); input(restored, 'search', 'absorb');
  assert(el(restored, 'list').textContent.includes('absorb'));
  const detail = openDetails(restored, '#vocabulary-list .vocabulary-entry'); assert(detail.textContent.includes('日本語の語注'));
  assert(!detail.querySelector('[data-mode="context"]'));
  const memo = detail.querySelector('[data-vocabulary-memo]'); memo.value = '<script>my note</script>'; memo.dispatchEvent(new restored.w.Event('input', { bubbles: true }));
  detail.querySelector('[data-vocabulary-star]').click(); assert(restored.api.getProgress().stars[bank.entries[Number(memo.dataset.vocabularyMemo)].id]);
  assert.strictEqual(detail.querySelectorAll('script').length, 0, 'Notes interpreted as HTML');
  input(restored, 'search', '吸収'); assert(el(restored, 'list').textContent.length);
  const scope = el(restored, 'scope'); scope.value = 'Writing'; scope.dispatchEvent(new restored.w.Event('change'));
  input(restored, 'search', 'zzzz-no-term'); assert.strictEqual(el(restored, 'list').children.length, 0);
  input(restored, 'search', ''); scope.value = 'all'; scope.dispatchEvent(new restored.w.Event('change'));
  el(restored, 'filter').value = 'contextOnly'; el(restored, 'filter').dispatchEvent(new restored.w.Event('change'));
  assert(el(restored, 'list').textContent.includes('出題待ち')); assert(el(restored, 'start').disabled);
  el(restored, 'filter').value = 'all'; el(restored, 'filter').dispatchEvent(new restored.w.Event('change'));
  restored.d.querySelector('[data-vocabulary-view="coverage"]').click();
  const originalDate = bank.documents.find(d => d.id.startsWith('writing-original-')).id.split('-').slice(0, 3).join('-');
  input(restored, 'source-search', originalDate); assert(el(restored, 'source-list').children.length);
  const source = el(restored, 'source-list').querySelector('[data-vocabulary-source]'); assert(source); source.click();
  assert(el(restored, 'selection').textContent.includes('教材:')); assert.strictEqual(el(restored, 'clear-source').hidden, false);
  click(restored, 'clear-source'); assert.strictEqual(el(restored, 'clear-source').hidden, true);

  // Retired context records, source-specific gloss history, notes and favourites
  // remain stored/exportable. No old source-reproduction session can resume.
  const retiredId = 'vocab:absorb|context';
  const legacy = { schemaVersion: 1, records: { [retiredId]: { attempts: 3, correct: 2, wrong: 1, streak: 1, result: 'correct', last: 1791558000000, due: 1791644400000, lastCorrectDay: '2026-10-09' } }, notes: { 'vocab:absorb': 'my private note' }, stars: { 'vocab:absorb': true }, history: [{ id: retiredId, result: 'correct', at: 1791558000000 }], session: { ids: [retiredId], index: 0, draft: 'abs', selection: null, elapsed: 65000, checked: false } };
  const migrated = await boot(legacy);
  assert.strictEqual(migrated.api.getProgress().records[retiredId].attempts, 3);
  assert.strictEqual(migrated.api.getProgress().notes['vocab:absorb'], 'my private note'); assert(migrated.api.getProgress().stars['vocab:absorb']);
  assert.strictEqual(migrated.api.getProgress().history.length, 1); assert.strictEqual(migrated.api.getProgress().session, null);
  assert(el(migrated, 'status').textContent.includes('以前の正誤・メモは保持')); assert(el(migrated, 'resume').hidden);
  assert(!el(migrated, 'stats').textContent.includes('1 /'), 'Archived spelling counted as meaning success');

  const speech = await boot(undefined, { speech: true }); speech.api.startCards([meaning.id]); click(speech, 'speak');
  assert.strictEqual(speech.spoken().text, 'absorb'); assert.strictEqual(speech.spoken().lang, 'en-US');
  speech.spoken().onerror(); assert(el(speech, 'audio-status').textContent.includes('再生できません'));
  assert(el(t, 'speak').disabled, 'Unsupported speech API should be handled visibly');
  assert.strictEqual(t.fetches(), 1, 'Quiz requested outside lesson text');

  let exported, downloaded; restored.w.URL.createObjectURL = blob => { exported = blob; return 'blob:vocabulary-export'; }; restored.w.URL.revokeObjectURL = () => {};
  restored.w.HTMLAnchorElement.prototype.click = function () { downloaded = { href: this.href, name: this.download }; };
  click(restored, 'export'); assert(exported); assert.strictEqual(downloaded.href, 'blob:vocabulary-export');
  assert(/^toefl-vocabulary-\d{4}-\d{2}-\d{2}\.json$/.test(downloaded.name));
  const exportedText = await new Promise((resolve, reject) => { const reader = new restored.w.FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsText(exported); });
  assert.deepStrictEqual(JSON.parse(exportedText), JSON.parse(JSON.stringify(restored.api.getProgress())));
  click(restored, 'reset'); assert.strictEqual(el(restored, 'reset-confirm').hidden, false); click(restored, 'reset-no'); assert(restored.api.getProgress().history.length);
  click(restored, 'reset'); click(restored, 'reset-yes'); assert.strictEqual(Object.keys(restored.api.getProgress().records).length, 0);
  assert.strictEqual(restored.w.localStorage.getItem(OLD), 'keep-reading'); assert.strictEqual(restored.w.localStorage.getItem('mastersPhysicsLab.writingLab.v1'), 'keep-writing');
  const bad = await boot('broken-json'); assert(bad.api.getBank()); assert(el(bad, 'status').textContent.includes('読み込めなかった'));
  const failed = await boot(undefined, { fetchFails: true }); assert.strictEqual(failed.api.getBank(), null); assert(el(failed, 'status').textContent.includes('再試行'));
  const invalid = await boot(undefined, { payload: { schemaVersion: 1, entries: [] } }); assert.strictEqual(invalid.api.getBank(), null);
  const quota = await boot(undefined, { storageFails: true }); quota.api.startCards([meaning.id]); choose(quota, meaning);
  assert.strictEqual(el(quota, 'feedback').dataset.result, 'correct'); assert(el(quota, 'save-status').textContent.includes('保存できません'));
  const { IDBFactory } = require('fake-indexeddb'); const idb = new IDBFactory();
  const dbFixture = await boot(undefined, { indexedDB: idb, storageFails: true }); dbFixture.api.startCards([meaning.id]); choose(dbFixture, meaning);
  for (let i = 0; i < 10; i++) await tick();
  const dbReload = await boot(undefined, { indexedDB: idb, storageFails: true }); assert.strictEqual(dbReload.api.getProgress().records[meaning.id].result, 'correct');
  assert(!el(dbFixture, 'save-status').textContent.includes('保存できません'));
  const fullProgress = { schemaVersion: 1, records: { [retiredId]: legacy.records[retiredId] }, notes: {}, stars: {}, history: [], session: null };
  for (const c of all) fullProgress.records[c.id] = { attempts: 1, correct: 1, wrong: 0, streak: 1, result: 'correct', last: 1791558000000, due: 1791644400000, lastCorrectDay: '2026-10-09' };
  const fullText = JSON.stringify(fullProgress); assert(fullText.length > 5000000);
  Object.defineProperty(el(dbFixture, 'import'), 'files', { value: [{ size: fullText.length, text: async () => fullText }] }); el(dbFixture, 'import').dispatchEvent(new dbFixture.w.Event('change'));
  for (let i = 0; i < 15; i++) await tick();
  assert.strictEqual(Object.keys(dbFixture.api.getProgress().records).length, all.length + 1);
  const dbFullReload = await boot(undefined, { indexedDB: idb, storageFails: true }); assert.strictEqual(Object.keys(dbFullReload.api.getProgress().records).length, all.length + 1, 'Complete-corpus history lost');
  assert.strictEqual(dbFullReload.api.getProgress().records[retiredId].attempts, 3);
  Object.defineProperty(el(restored, 'import'), 'files', { value: [{ size: 3, text: async () => 'bad' }] }); el(restored, 'import').dispatchEvent(new restored.w.Event('change')); await tick();
  assert(el(restored, 'status').textContent.includes('保持しています'));
  for (const fixture of [t, restored, checkedReload, migrated, speech, bad, failed, invalid, quota, dbFixture, dbReload, dbFullReload]) fixture.dom.window.close();
  console.log(`PASS: ${visited} standalone meaning questions; instant grading, wrong/reveal/retry, no material dependency, pronunciation fallback, distinct-day review, resume/history/timer, stable choice IDs, notebook/source coverage, auth, full IndexedDB, legacy preservation and export/import`);
})().catch(error => { console.error(error); process.exit(1); });
