// Run after the Python bank build and Hugo build.
// NODE_PATH=<jsdom install>/node_modules TOEFL_HTML=<build>/toefl/index.html node tests/verify_toefl_dom.cjs
const fs = require('fs');
const assert = require('assert');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.env.TOEFL_HTML, 'utf8');
const bank = JSON.parse(fs.readFileSync(process.env.TOEFL_BANK || 'static/data/toefl-task-bank.json', 'utf8'));
const app = fs.readFileSync(process.env.TOEFL_APP || 'static/js/english-library.js', 'utf8');
const storageKey = 'mastersPhysicsLab.englishLibraryProgress.v1';
const compact = (value) => String(value).replace(/(^|\n)\s*[-*]\s+/g, '').replace(/[\s*`•]/g, '');

async function boot(saved = null, fetchFails = false) {
  const dom = new JSDOM(html, { url: 'https://airopamgine.github.io/my-physics-lab/toefl/',
    runScripts: 'outside-only', pretendToBeVisual: true });
  dom.window.HTMLElement.prototype.scrollIntoView = function () {};
  dom.window.fetch = async () => fetchFails ? { ok: false } : { ok: true, json: async () => bank };
  if (saved) dom.window.localStorage.setItem(storageKey, saved);
  // Simulate the documented successful-auth event only in this isolated DOM fixture.
  // No authentication, credentials, or production security settings are changed.
  dom.window.eval(app);
  dom.window.document.dispatchEvent(new dom.window.Event('toefl:unlocked'));
  await new Promise(resolve => dom.window.setTimeout(resolve, 0));
  return dom;
}

function search(window, id) {
  const input = window.document.getElementById('library-search');
  input.value = id;
  input.dispatchEvent(new window.Event('input'));
}

async function runAll(mode) {
  const dom = await boot();
  const { window } = dom;
  const d = window.document;
  let visited = 0, groups = 0;
  assert(d.getElementById('library-totals').textContent.includes(bank.questionCount.toLocaleString()));
  for (let task = 1; task <= 3; task++) {
    const count = bank.sets.filter(s => s.collection === `Task ${task}`).reduce((n,s) => n+s.questions.length, 0);
    assert.strictEqual(d.getElementById(`reading-task-${task}-count`).textContent, `${count}問 · 自動採点`);
  }
  assert(d.getElementById('reading-migration-progress').textContent.includes('1問'));
  assert(d.getElementById('reading-migration-progress').textContent.includes('71ページ'));
  let gapGroup = [];
  for (const set of bank.sets) {
    search(window, set.id);
    const start = d.querySelector(`[data-library-start="${set.id}"]`);
    assert(start, `Missing card: ${set.id}`);
    start.click();
    for (let i = 0; i < set.questions.length; i++) {
      const q = set.questions[i];
      assert.strictEqual(d.getElementById('library-set-title').textContent, set.title);
      assert(d.getElementById('library-question-content').textContent.includes(set.verificationNote || ''));
      assert(compact(d.getElementById('library-question-content').textContent).includes(compact(q.prompt)), q.id);
      assert(compact(d.getElementById('library-question-content').textContent).includes(compact(q.passage)), `Passage missing: ${q.id}`);
      assert(d.getElementById('library-feedback').hidden, `Premature feedback: ${q.id}`);
      assert(d.getElementById('library-check').disabled, `Empty answer accepted: ${q.id}`);
      if (q.acceptedAnswers) {
        const input = d.getElementById('library-gap-input');
        const full = q.acceptedAnswers.at(-1).toUpperCase().replace(/[A-Z]/g, ch => String.fromCharCode(ch.charCodeAt(0) + 0xfee0));
        input.value = mode === 'wrong' ? '__definitely_not_an_answer__' : mode === 'full' ? `  ${full}  ` : q.acceptedAnswers[0];
        input.dispatchEvent(new window.Event('input'));
        gapGroup.push(q);
      } else {
        assert.strictEqual(d.querySelectorAll('[data-library-option]').length, 4);
        const chosen = mode === 'wrong' ? q.options.find(o => o.label !== q.correct).label : q.correct;
        for (const o of q.options) {
          assert(compact(d.querySelector(`[data-library-option="${o.label}"]`).textContent).includes(compact(o.text)), `Choice missing: ${q.id}`);
        }
        d.querySelector(`[data-library-option="${chosen}"]`).click();
        assert.strictEqual(d.querySelector(`[data-library-option="${chosen}"]`).getAttribute('aria-pressed'), 'true');
      }
      d.getElementById('library-check').click();
      const saved = JSON.parse(window.localStorage.getItem(storageKey));
      assert.strictEqual(saved.answers[q.id].result, mode === 'wrong' ? 'incorrect' : 'correct', q.id);
      const next = set.questions[i + 1];
      const defer = q.acceptedAnswers && next?.acceptedAnswers && next.passage === q.passage;
      if (defer) {
        assert(d.getElementById('library-feedback').hidden, `Later blank answer leaked: ${q.id}`);
        continue;
      }
      const feedback = d.getElementById('library-feedback');
      assert(!feedback.hidden, `Feedback missing: ${q.id}`);
      assert(feedback.classList.contains(mode === 'wrong' ? 'is-wrong' : 'is-correct'), `Wrong grading style: ${q.id}`);
      for (const reviewed of q.acceptedAnswers ? gapGroup : [q]) {
        assert(compact(feedback.textContent).includes(compact(reviewed.answer)), `Explanation missing: ${reviewed.id}`);
      }
      if (q.acceptedAnswers) { groups++; gapGroup = []; }
      else {
        assert(d.querySelector(`[data-library-option="${q.correct}"]`).classList.contains('is-correct'));
        assert([...d.querySelectorAll('[data-library-option]')].every(o => o.disabled));
      }
      d.getElementById('library-next').click();
    }
    assert(!d.getElementById('library-complete').hidden, `No completion: ${set.id}`);
    const mastered = mode === 'wrong' ? 0 : set.questions.length;
    assert(d.getElementById('library-complete-score').textContent.includes(`${mastered} / ${set.questions.length}`));
    visited += set.questions.length;
    if (visited % 250 < set.questions.length) console.log(JSON.stringify({ mode, visited }));
  }
  assert.strictEqual(visited, bank.questionCount);
  const saved = window.localStorage.getItem(storageKey);
  assert.strictEqual(Object.keys(JSON.parse(saved).answers).length, bank.questionCount);
  dom.window.close();
  return { saved, result: { mode, questions: visited, groupedPassages: groups } };
}

async function verifyControls(saved) {
  const dom = await boot(saved);
  const { window } = dom, d = window.document;
  assert.strictEqual(d.getElementById('library-attempted').textContent, `${bank.questionCount}/${bank.questionCount}`);
  assert.strictEqual(d.getElementById('library-review-count').textContent, String(bank.questionCount));
  search(window, 'no-such-reading-set-xyz');
  assert.strictEqual(d.querySelectorAll('[data-library-start]').length, 0);
  assert(d.getElementById('library-status').textContent.includes('一致する教材がありません'));
  for (const task of ['Task 1','Task 2','Task 3']) {
    d.querySelector(`[data-reading-task="${task}"]`).click();
    assert.strictEqual(d.getElementById('library-collection').value, task);
    assert.strictEqual(d.getElementById('library-search').value, '');
    const ids = [...d.querySelectorAll('[data-library-start]')].map(b => b.dataset.libraryStart);
    assert(ids.every(id => bank.sets.find(s => s.id === id).collection === task));
  }
  const set = bank.sets.find(s => s.collection === 'Task 3');
  search(window, set.id);
  d.querySelector(`[data-library-review="${set.id}"]`).click();
  assert.strictEqual(d.getElementById('library-question-count').textContent, `Question 1 of ${set.questions.length}`);
  d.getElementById('library-exit').click();
  assert(d.getElementById('library-runner').hidden);
  d.getElementById('library-search').value = '';
  d.getElementById('library-search').dispatchEvent(new window.Event('input'));
  const before = d.querySelectorAll('[data-library-start]').length;
  d.getElementById('library-more').click();
  assert(d.querySelectorAll('[data-library-start]').length > before);
  dom.window.close();
  const broken = await boot('{invalid json');
  assert.strictEqual(broken.window.document.getElementById('library-attempted').textContent, `0/${bank.questionCount}`);
  broken.window.close();
}

(async () => {
  const suffix = await runAll('suffix');
  const full = await runAll('full');
  const wrong = await runAll('wrong');
  await verifyControls(wrong.saved);
  console.log(JSON.stringify({ passed: true, sets: bank.setCount, questions: bank.questionCount,
    passes: [suffix.result, full.result, wrong.result], explanations: 'all',
    storageReload: true, review: true, filters: true, pagination: true, corruptStorageRecovery: true }));
})().catch(error => { console.error(error); process.exitCode = 1; });
