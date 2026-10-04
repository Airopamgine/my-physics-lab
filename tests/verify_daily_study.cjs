// Isolated DOM fixture; no production credentials or authentication are changed.
// NODE_PATH=<jsdom>/node_modules TOEFL_HTML=<Hugo build>/toefl/index.html node tests/verify_daily_study.cjs
const fs = require('fs');
const assert = require('assert');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.env.TOEFL_HTML, 'utf8');
const reading = JSON.parse(fs.readFileSync('static/data/toefl-task-bank.json', 'utf8'));
const writing = JSON.parse(fs.readFileSync('static/data/toefl-writing-bank.json', 'utf8'));
const plan = JSON.parse(fs.readFileSync('static/data/toefl-daily-plan.json', 'utf8'));
const scripts = ['english-library', 'writing-lab', 'daily-study'].map(name => fs.readFileSync(`static/js/${name}.js`, 'utf8'));
const KEY = 'mastersPhysicsLab.dailyStudy.v1';
const RKEY = 'mastersPhysicsLab.englishLibraryProgress.v1', WKEY = 'mastersPhysicsLab.writingLab.v1';
const rIndex = new Map(reading.sets.flatMap(set => set.questions.map(q => [q.id, { q, set }])));
const wIndex = new Map(writing.exercises.map(q => [q.id, q]));
const localDate = time => { const d = new Date(time); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

async function boot(saved = {}, options = {}) {
  const dom = new JSDOM(html, { url: 'https://airopamgine.github.io/my-physics-lab/toefl/', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window, d = w.document, intervals = [];
  let now = options.now ?? new Date(2026, 9, 4, 12).getTime(), requests = 0, fail = options.fail;
  w.Date.now = () => now;
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.setInterval = (callback, ms) => { intervals.push({ callback, ms }); return intervals.length; };
  w.fetch = async url => {
    requests++;
    const data = String(url).includes('daily-plan') ? plan : String(url).includes('writing-bank') ? (options.bank || writing) : reading;
    return { ok: !(fail && String(url).includes('daily-plan')), json: async () => data };
  };
  Object.entries(saved).forEach(([key, data]) => w.localStorage.setItem(key, typeof data === 'string' ? data : JSON.stringify(data)));
  if (options.storageFails) w.Storage.prototype.setItem = () => { throw new Error('Quota'); };
  d.addEventListener('click', event => { if (event.target.closest('a')) event.preventDefault(); });
  let download = null;
  w.URL.createObjectURL = blob => { download = blob; return 'blob:isolated-test'; };
  w.URL.revokeObjectURL = () => {};
  scripts.forEach(script => w.eval(script));
  assert.strictEqual(requests, 0, 'Fetched protected data before unlock');
  assert.strictEqual(d.querySelectorAll('[data-daily-start]').length, 0);
  // The documented unlock event is simulated only inside this test fixture.
  d.dispatchEvent(new w.Event('toefl:unlocked')); await tick(); await tick();
  return {
    dom, w, d, now: () => now, requests: () => requests,
    saved: () => JSON.parse(w.localStorage.getItem(KEY)),
    day: () => JSON.parse(w.localStorage.getItem(KEY)).days[localDate(now)],
    allSaved: () => Object.fromEntries(Array.from({ length: w.localStorage.length }, (_, i) => w.localStorage.key(i)).map(key => [key, w.localStorage.getItem(key)])),
    advance: time => { now = time; intervals.forEach(({ callback }) => callback()); },
    retry: async () => { fail = false; d.getElementById('daily-retry').click(); await tick(); },
    download: () => download
  };
}
function click(t, id) { t.d.getElementById(id).click(); }
function input(t, id, text) { const field = t.d.getElementById(id); field.value = text; field.dispatchEvent(new t.w.Event('input')); }
function start(t, slot) { t.d.querySelector(`[data-daily-start="${slot}"]`).click(); }
function event(t, name, detail) { t.d.dispatchEvent(new t.w.CustomEvent(name, { detail })); }
function completeReading(t, slot, wrongId) {
  const step = t.day().steps[slot]; start(t, slot);
  for (const id of step.ids) {
    const { q } = rIndex.get(id);
    if (q.acceptedAnswers) input(t, 'library-gap-input', id === wrongId ? 'not_the_answer' : q.acceptedAnswers[0]);
    else t.d.querySelector(`[data-library-option="${id === wrongId ? q.options.find(o => o.label !== q.correct).label : q.correct}"]`).click();
    click(t, 'library-check');
    if (!t.d.getElementById('library-next').hidden) click(t, 'library-next');
  }
  assert(t.day().steps[slot].complete, `Reading slot ${slot} did not complete`);
}
function completeObjective(t, slot) {
  const step = t.day().steps[slot]; start(t, slot);
  for (const id of step.ids) {
    const q = wIndex.get(id);
    if (q.type === 'sentence') {
      click(t, 'writing-clear');
      q.solutions[0].forEach(index => t.d.querySelector(`[data-writing-tile="${index}"]`).click());
    } else t.d.querySelector(`[data-writing-choice="${q.correctIndex}"]`).click();
    click(t, 'writing-check');
    assert.strictEqual(t.d.getElementById('writing-feedback').dataset.result, 'correct');
    click(t, 'writing-next');
  }
  assert(t.day().steps[slot].complete);
}
function completeWork(t, slot) {
  start(t, slot);
  const step = t.day().steps[slot];
  if (step.engine === 'listening') click(t, 'daily-audio-link');
  [...t.d.querySelectorAll('[data-daily-check]')].forEach(check => check.click());
  input(t, 'daily-work-notes', 'I explained the main point and checked the evidence. 次に試すことを記録。');
  click(t, 'daily-work-finish'); assert(t.day().steps[slot].complete);
}
function checkMenu(t) {
  const day = t.day(); assert.strictEqual(day.steps.length, 8);
  assert.strictEqual(t.d.querySelectorAll('[data-daily-start]').length, 8);
  const ids = day.steps.slice(0, 6).flatMap(step => step.ids);
  assert.strictEqual(new Set(ids).size, ids.length, 'New-work steps repeat an exercise');
  for (let slot = 0; slot < 3; slot++) {
    const step = day.steps[slot], set = reading.sets.find(s => s.id === step.setId);
    assert.strictEqual(set.collection, `Task ${slot + 1}`);
    const phase = plan.phases.find(p => p.id === day.phase);
    if (slot === 2) assert(phase.levels.includes(set.level), `${day.phase}: wrong academic level`);
    const all = set.questions.filter(q => step.ids.includes(q.id));
    assert.deepStrictEqual(all.map(q => q.id), step.ids, 'Source question order changed');
    assert(all.length > 0);
    for (const q of all.filter(q => q.acceptedAnswers)) {
      const siblings = set.questions.filter(other => other.acceptedAnswers && (q.passage ?? set.passage) === (other.passage ?? set.passage));
      assert(siblings.every(other => step.ids.includes(other.id)), 'Truncated completion passage');
    }
  }
  assert.strictEqual(day.steps[3].ids.filter(id => wIndex.get(id).type === 'sentence').length, 3);
  assert.strictEqual(day.steps[3].ids.filter(id => wIndex.get(id).type === 'grammar').length, 1);
  assert(['email', 'discussion'].includes(wIndex.get(day.steps[4].ids[0]).type));
  assert.strictEqual(wIndex.get(day.steps[6].ids[0]).type, 'discussion');
  assert(t.d.getElementById('daily-focus-en').textContent.length > 30);
  assert(t.d.getElementById('daily-focus-ja').textContent.includes('（'));
}

(async () => {
  const t = await boot({ [RKEY]: { answers: { 'retain-my-history': { result: 'correct', attemptedAt: '2026-10-01T10:00:00Z' } } } });
  checkMenu(t);
  const day = t.day(), date = day.date, wrongId = day.steps[0].ids[0];
  assert.strictEqual(t.requests(), 3);
  assert(t.d.getElementById('daily-study').compareDocumentPosition(t.d.getElementById('writing-lab')) & t.w.Node.DOCUMENT_POSITION_FOLLOWING);
  assert(t.d.querySelector('[data-daily-start="7"]').disabled, 'Recall should follow checked vocabulary');
  const reload = await boot(t.allSaved());
  assert.deepStrictEqual(reload.day().steps.map(s => s.ids), day.steps.map(s => s.ids), 'Reload shuffled today'); reload.dom.window.close();

  completeReading(t, 0, wrongId); completeReading(t, 1); completeReading(t, 2);
  assert(t.d.getElementById('daily-total').textContent.startsWith('3 / 8'));
  assert.strictEqual(t.saved().spaced[`r:${wrongId}`].wrong, true);
  assert.strictEqual(t.saved().spaced[`r:${wrongId}`].due, localDate(new Date(2026, 9, 5, 12).getTime()));
  completeObjective(t, 3);
  start(t, 4); click(t, 'writing-mark-done');
  assert(!t.day().steps[4].complete, 'Unsubmitted essay completed');
  const essay = wIndex.get(day.steps[4].ids[0]);
  input(t, 'writing-answer', essay.modelAnswer); click(t, 'writing-finish');
  assert(!t.day().steps[4].complete, 'Submission without review completed');
  input(t, 'writing-answer', `${essay.modelAnswer}\nA new revision.`); click(t, 'writing-mark-done');
  assert(!t.day().steps[4].complete, 'Stale submitted version completed');
  click(t, 'writing-finish');
  t.d.querySelectorAll('[data-writing-selfcheck]').forEach(check => check.click());
  click(t, 'writing-mark-done'); assert(t.day().steps[4].complete);
  start(t, 5);
  assert(t.d.getElementById('daily-work-finish').disabled);
  assert(t.d.getElementById('daily-audio-link').href.startsWith(plan.listeningBase));
  assert.strictEqual(t.d.getElementById('daily-audio-link').rel, 'noopener noreferrer');
  input(t, 'daily-work-notes', '<img src=x onerror=alert(1)> is stored as plain text.');
  t.d.querySelectorAll('[data-daily-check]').forEach(check => check.click());
  assert(t.d.getElementById('daily-work-finish').disabled, 'External recording was not opened');
  click(t, 'daily-audio-link'); click(t, 'daily-work-finish');
  start(t, 5); assert.strictEqual(t.d.querySelectorAll('#daily-work-body img').length, 0);
  assert(t.d.getElementById('daily-work-notes').value.includes('<img'));
  click(t, 'daily-work-close');
  start(t, 6); click(t, 'daily-timer-toggle'); t.advance(t.now() + 20000);
  assert.strictEqual(t.d.getElementById('daily-speaking-timer').textContent, '0:40');
  const timed = await boot(t.allSaved(), { now: t.now() + 10000 }); start(timed, 6);
  assert.strictEqual(timed.d.getElementById('daily-speaking-timer').textContent, '0:30');
  timed.advance(timed.now() + 35000);
  assert.strictEqual(timed.d.getElementById('daily-speaking-timer').textContent, '0:00'); timed.dom.window.close();
  completeWork(t, 6); completeWork(t, 7);
  assert(t.day().steps.every(s => s.complete)); assert(t.d.getElementById('daily-next').disabled);
  assert(t.d.getElementById('daily-coverage').textContent.includes('Listening 1/7日'));
  for (const select of t.d.querySelectorAll('[data-daily-goal]')) select.value = 'independent';
  input(t, 'daily-evidence', 'I gave a reason and a concrete example without a script.'); click(t, 'daily-save-reflection');
  click(t, 'daily-export'); assert(t.download().size > 100);
  assert(JSON.parse(t.w.localStorage.getItem(RKEY)).answers['retain-my-history']);
  const completed = await boot(t.allSaved(), { now: t.now() });
  assert(completed.day().steps.every(s => s.complete)); assert(completed.d.getElementById('daily-evidence').value.includes('without a script'));
  const before = completed.saved().spaced[`r:${day.steps[1].ids[0]}`].streak;
  completeReading(completed, 1);
  assert.strictEqual(completed.saved().spaced[`r:${day.steps[1].ids[0]}`].streak, before, 'Same-day retry inflated spacing');
  completed.advance(new Date(2026, 9, 5, 12).getTime()); checkMenu(completed);
  assert.strictEqual(completed.day().steps[7].engine, 'reading');
  assert(completed.day().steps[7].ids.includes(wrongId), 'Wrong answer not selected for next-day review');
  assert(!completed.day().steps[0].complete);
  // Late answers belong to the session's old date, never to the new day's menu.
  event(completed, 'toefl:reading-reviewed', { id: wrongId, result: 'correct', context: { dailyDate: date, dailySlot: 0 } });
  assert(!completed.day().steps[0].complete);
  completed.dom.window.close();

  const partial = await boot(); start(partial, 3);
  const partialDay = partial.day(), first = wIndex.get(partialDay.steps[3].ids[0]);
  first.solutions[0].forEach(index => partial.d.querySelector(`[data-writing-tile="${index}"]`).click());
  click(partial, 'writing-check'); click(partial, 'writing-next');
  const resumed = await boot(partial.allSaved());
  assert.strictEqual(resumed.d.getElementById('writing-exercise-title').textContent, wIndex.get(partialDay.steps[3].ids[1]).title);
  for (const id of partialDay.steps[3].ids.slice(1)) {
    const q = wIndex.get(id);
    if (q.type === 'sentence') q.solutions[0].forEach(index => resumed.d.querySelector(`[data-writing-tile="${index}"]`).click());
    else resumed.d.querySelector(`[data-writing-choice="${q.correctIndex}"]`).click();
    click(resumed, 'writing-check'); click(resumed, 'writing-next');
  }
  assert(resumed.day().steps[3].complete, 'Reload lost the guided queue or menu progress');
  const syntheticOriginal = { ...writing.exercises.find(q => q.type === 'sentence'), id: 'writing-original-fixture-s01',
    source: { kind: 'original', date: '2026-10-05' }, sourceRefs: ['original:writing:2026-10-05:sentence:fixture'] };
  const updatedSaved = partial.allSaved(), previousExposure = JSON.parse(updatedSaved[KEY]);
  // A fresh item must be eligible ahead of already-exposed items; it does not
  // jump ahead of every other unseen item simply because the bank was updated.
  writing.exercises.filter(q => q.type === 'sentence').forEach(q => { previousExposure.exposure[`w:${q.id}`] = 1; });
  updatedSaved[KEY] = previousExposure;
  const updatedBank = await boot(updatedSaved, { bank: { ...writing, exercises: [...writing.exercises, syntheticOriginal] } });
  assert.deepStrictEqual(updatedBank.day().steps.map(s => s.ids), partialDay.steps.map(s => s.ids), 'Bank update shuffled today');
  updatedBank.advance(new Date(2026, 9, 5, 12).getTime());
  assert(updatedBank.day().steps[3].ids.includes(syntheticOriginal.id), 'New original did not enter next-day selection');
  for (const fixture of [partial, resumed, updatedBank]) fixture.dom.window.close();

  // Calendar rotation, topic coverage, stable same-day choices and mixed writing types.
  const rotation = await boot();
  const audio = new Set(), essays = [], task2Sets = new Set(), sentences = new Set(), family = [];
  for (let i = 0; i < 60; i++) {
    rotation.advance(new Date(2026, 9, 4 + i, 12).getTime()); checkMenu(rotation);
    const menu = rotation.day();
    if (i < plan.listening.length) audio.add(menu.steps[5].ids[0]);
    essays.push(wIndex.get(menu.steps[4].ids[0]).type);
    task2Sets.add(menu.steps[1].setId);
    menu.steps[3].ids.filter(id => wIndex.get(id).type === 'sentence').forEach(id => sentences.add(id));
    family.push(rIndex.get(menu.steps[0].ids[0]).q.sourceRefs?.some(ref => ref.startsWith('pdf:vocabulary:')) || false);
    const ids = JSON.stringify(menu.steps.map(s => s.ids)); rotation.advance(rotation.now() + 1000);
    assert.strictEqual(JSON.stringify(rotation.day().steps.map(s => s.ids)), ids);
    if (i > 0) { assert.notStrictEqual(essays[i], essays[i - 1]); assert.notStrictEqual(family[i], family[i - 1]); }
  }
  assert.strictEqual(audio.size, plan.listening.length, 'Audio repeats before rotation finishes');
  assert.strictEqual(task2Sets.size, Math.min(60, reading.sets.filter(s => s.collection === 'Task 2' && plan.phases[0].levels.includes(s.level)).length), 'Daily documents are biased toward a few sets');
  assert.strictEqual(sentences.size, Math.min(60 * 3, writing.exercises.filter(q => q.type === 'sentence').length), 'Sentence rotation repeated exercises too early');
  assert.strictEqual(rotation.day().phase, 'foundation', 'Calendar alone upgraded the learner');
  rotation.dom.window.close();

  // The learning stage advances with completed daily work, not elapsed calendar days.
  const stageSaved = t.allSaved(), snapshot = JSON.parse(stageSaved[KEY]);
  snapshot.days = {};
  for (let i = 0; i < 28; i++) {
    const priorDate = localDate(new Date(2026, 8, 1 + i, 12).getTime());
    snapshot.days[priorDate] = { ...JSON.parse(JSON.stringify(t.day())), date: priorDate };
  }
  stageSaved[KEY] = snapshot;
  const advanced = await boot(stageSaved); checkMenu(advanced); assert.strictEqual(advanced.day().phase, 'b2'); advanced.dom.window.close();
  const preference = await boot(); const frozen = JSON.stringify(preference.day());
  preference.d.getElementById('daily-level').value = 'b2'; preference.d.getElementById('daily-level').dispatchEvent(new preference.w.Event('change'));
  assert.strictEqual(JSON.stringify(preference.day()), frozen);
  preference.advance(new Date(2026, 9, 5, 12).getTime()); assert.strictEqual(preference.day().phase, 'b2'); preference.dom.window.close();

  const bad = await boot({ [KEY]: '{invalid', [RKEY]: { answers: { preserve: { result: 'correct' } } } });
  checkMenu(bad); assert(bad.d.getElementById('daily-status').textContent.includes('読み込めませんでした'));
  assert(JSON.parse(bad.w.localStorage.getItem(RKEY)).answers.preserve); bad.dom.window.close();
  const damaged = t.allSaved(), damage = JSON.parse(damaged[KEY]); damage.days[date].steps[0].ids = ['removed-id']; damaged[KEY] = damage;
  const recovered = await boot(damaged); checkMenu(recovered); assert(recovered.d.getElementById('daily-status').textContent.includes('組み直しました')); recovered.dom.window.close();
  const quota = await boot({}, { storageFails: true }); assert(quota.d.getElementById('daily-status').textContent.includes('保存できません')); quota.dom.window.close();
  const network = await boot({}, { fail: true }); assert(!network.d.getElementById('daily-retry').hidden); await network.retry(); checkMenu(network); network.dom.window.close();

  // Protect against UTC and local-midnight mistakes, including DST calendar shifts.
  const midnight = await boot({}, { now: new Date(2026, 9, 24, 23, 59).getTime() });
  const old = midnight.day().date; midnight.advance(new Date(2026, 9, 25, 0, 1).getTime());
  assert.notStrictEqual(midnight.day().date, old); assert.strictEqual(midnight.day().date, localDate(midnight.now())); midnight.dom.window.close();
  t.dom.window.close();
  console.log(JSON.stringify({ result: 'passed', timezone: process.env.TZ || 'system', dailySteps: 8, rotationDays: 60,
    audioLessons: audio.size, dailyDocumentSets: task2Sets.size, uniqueSentences: sentences.size,
    checks: 'real grading, grouping, fresh submissions, review spacing, restore, timer, links, plain text, reflection, download, failures, rollover' }));
})().catch(error => { console.error(error); process.exit(1); });
