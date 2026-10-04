(() => {
  "use strict";
  const root = document.getElementById("daily-study");
  if (!root) return;
  const KEY = "mastersPhysicsLab.dailyStudy.v1";
  const el = id => document.getElementById(`daily-${id}`);
  const node = (tag, text, className) => {
    const n = document.createElement(tag);
    if (text !== undefined) n.textContent = text;
    if (className) n.className = className;
    return n;
  };
  const object = value => value && typeof value === "object" && !Array.isArray(value);
  const validDate = date => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(Date.parse(`${date}T12:00:00Z`)) && new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) === date;
  const ordinal = date => Date.parse(`${date}T12:00:00Z`) / 86400000;
  const shift = (date, days) => new Date(Date.parse(`${date}T12:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
  const localDate = () => {
    const d = new Date(Date.now());
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const hash = text => [...text].reduce((n, c) => Math.imul(n ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);
  const remaining = step => step.ids.filter(id => !step.reviewed.includes(id));
  let config, reading, writing, currentDate, activeWork = null, loading = false, unlocked = false;
  let storageFailed = false, recoveryNotice = "";
  let state = { version: 1, level: "path", days: {}, exposure: {}, spaced: {}, reflections: {} };
  const rIndex = new Map(), wIndex = new Map();

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); storageFailed = false; }
    catch (_) { storageFailed = true; }
    notice();
  }
  function notice() {
    el("status").textContent = storageFailed ? "記録をブラウザに保存できません。下のダウンロードで学習記録を残してください。" :
      recoveryNotice || "今日の選択と完了状況をこのブラウザに保存しています。解答後は解説を確認して次へ進んでください。";
  }
  function restore() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const value = JSON.parse(raw);
      if (!object(value) || value.version !== 1 || !object(value.days) || !object(value.exposure) ||
        !object(value.spaced) || !object(value.reflections)) throw new Error("Invalid daily record");
      state.level = value.level === "b2" ? "b2" : "path";
      for (const [key, n] of Object.entries(value.exposure)) {
        if (Number.isSafeInteger(n) && n >= 0 && key.length < 200) state.exposure[key] = n;
      }
      for (const [key, row] of Object.entries(value.spaced)) {
        if ((key.startsWith("r:") || key.startsWith("w:")) && object(row) && validDate(row.due) &&
          Number.isInteger(row.streak) && row.streak >= 0 && row.streak <= 5) {
          state.spaced[key] = { due: row.due, streak: row.streak, wrong: row.wrong === true,
            lastReviewed: validDate(row.lastReviewed) ? row.lastReviewed : null };
        }
      }
      for (const [date, day] of Object.entries(value.days)) {
        if (!validDate(date) || !object(day) || !Array.isArray(day.steps) || day.steps.length !== 8 ||
          day.steps.some((step, i) => !object(step) || step.slot !== i || !Array.isArray(step.ids) ||
            step.ids.length > 40 || step.ids.some(id => typeof id !== "string") ||
            !["reading", "writing", "listening", "speaking", "recall"].includes(step.engine))) continue;
        const copy = {
          date, phase: config.phases.some(p => p.id === day.phase) ? day.phase : config.phases[0].id,
          week: Number.isInteger(day.week) && day.week >= 0 ? day.week : 0,
          steps: day.steps.map(step => ({
            slot: step.slot, engine: step.engine, ids: [...step.ids], setId: String(step.setId || ""),
            title: String(step.title || "").slice(0, 200), detail: String(step.detail || "").slice(0, 500),
            minutes: Number.isFinite(step.minutes) ? Math.max(1, Math.min(30, step.minutes)) : 5,
            reviewed: Array.isArray(step.reviewed) ? step.reviewed.filter(id => step.ids.includes(id)) : [],
            attempts: Object.fromEntries(Object.entries(object(step.attempts) ? step.attempts : {})
              .filter(([id, result]) => step.ids.includes(id) && ["correct", "incorrect", "submitted", "self-reviewed"].includes(result))),
            complete: step.complete === true, opened: step.opened === true,
            notes: typeof step.notes === "string" ? step.notes.slice(0, 5000) : "",
            checks: Array.isArray(step.checks) ? step.checks.filter(n => Number.isInteger(n) && n >= 0 && n < 8) : [],
            timer: Number.isFinite(step.timer) ? Math.max(0, Math.min(120, step.timer)) : 60,
            deadline: Number.isFinite(step.deadline) ? Math.min(step.deadline, Date.now() + 120000) : null
          }))
        };
        // Derive automatic completion from checked and reviewed answers.
        for (const step of copy.steps.filter(s => ["reading", "writing"].includes(s.engine))) {
          step.complete = step.ids.length > 0 && step.ids.every(id => step.attempts[id] && step.reviewed.includes(id));
        }
        state.days[date] = copy;
      }
      for (const [date, row] of Object.entries(value.reflections)) {
        if (!validDate(date) || !object(row)) continue;
        state.reflections[date] = {
          ratings: Object.fromEntries(config.canDo.map(item => [item.id,
            ["support", "independent", "transfer"].includes(row.ratings?.[item.id]) ? row.ratings[item.id] : ""])),
          evidence: typeof row.evidence === "string" ? row.evidence.slice(0, 5000) : ""
        };
      }
    } catch (_) { recoveryNotice = "メニューの保存記録を読み込めませんでした。Reading・Writingの記録はそのままに、新しいメニューで始められます。"; }
  }

  const use = key => { state.exposure[key] = (state.exposure[key] || 0) + 1; };
  function ordered(list, key, seed) {
    return [...list].sort((a, b) => (state.exposure[key(a)] || 0) - (state.exposure[key(b)] || 0) ||
      hash(`${seed}:${key(a)}`) - hash(`${seed}:${key(b)}`) || key(a).localeCompare(key(b)));
  }
  function groups(set) {
    const out = [], byPassage = new Map();
    for (const q of set.questions) {
      const passage = q.passage ?? set.passage;
      if (byPassage.has(passage)) byPassage.get(passage).qs.push(q);
      else { const group = { passage, qs: [q] }; byPassage.set(passage, group); out.push(group); }
    }
    return out;
  }
  function chooseReading(task, phase, date) {
    const vocabularyDay = Math.floor(ordinal(date)) % 2 === 0;
    const isVocabulary = g => g.qs.every(q => q.sourceRefs?.some(ref => ref.startsWith("pdf:vocabulary:")));
    const allowedGroup = g => task !== "Task 1" || (vocabularyDay ? isVocabulary(g) : !isVocabulary(g));
    let sets = reading.sets.filter(s => s.collection === task && phase.levels.includes(s.level) && groups(s).some(allowedGroup));
    if (!sets.length) sets = reading.sets.filter(s => s.collection === task && s.level !== "B2–C1" && groups(s).some(allowedGroup));
    if (!sets.length) sets = reading.sets.filter(s => s.collection === task);
    const set = ordered(sets, s => `set:${s.id}`, date)[0];
    if (!set) throw new Error(`Missing ${task}`);
    let pool = groups(set).filter(allowedGroup);
    if (!pool.length) pool = groups(set);
    const target = task === "Task 1" ? 8 : task === "Task 2" ? 3 : 5;
    const selected = [];
    for (const group of ordered(pool, g => `r:${g.qs[0].id}`, date)) {
      if (selected.length && selected.length + group.qs.length > 10) continue;
      selected.push(...group.qs);
      if (selected.length >= target) break;
    }
    const wanted = new Set(selected.map(q => q.id));
    const ids = set.questions.filter(q => wanted.has(q.id)).map(q => q.id);
    use(`set:${set.id}`); ids.forEach(id => use(`r:${id}`));
    return { engine: "reading", setId: set.id, ids,
      title: task === "Task 1" ? "語彙・文字補充" : task === "Task 2" ? "日常のReading" : "学術のReading",
      detail: `${task} · ${set.level} · ${ids.length}問\n${set.title}`,
      minutes: task === "Task 1" ? 8 : task === "Task 2" ? 5 : Math.max(10, Math.ceil(ids.length * 1.4)) };
  }
  function chooseWriting(type, count, seed) {
    const qs = ordered(writing.exercises.filter(q => q.type === type), q => `w:${q.id}`, seed).slice(0, count);
    if (qs.length !== count) throw new Error(`Missing Writing ${type}`);
    qs.forEach(q => use(`w:${q.id}`));
    return qs.map(q => q.id);
  }
  function reviewPlan(date, exclude) {
    const candidates = [];
    for (const [key, row] of Object.entries(state.spaced)) {
      const id = key.slice(2);
      if (row.due > date || exclude.has(id)) continue;
      if ((key.startsWith("r:") ? rIndex : wIndex).has(id)) candidates.push({ key, id, ...row });
    }
    for (const [id, row] of Object.entries(window.ToeflReadingLab.getProgress().answers || {})) {
      if (row.result === "incorrect" && rIndex.has(id) && !state.spaced[`r:${id}`] && !exclude.has(id)) {
        candidates.push({ key: `r:${id}`, id, due: String(row.attemptedAt || date).slice(0, 10), wrong: true });
      }
    }
    for (const [id, row] of Object.entries(window.ToeflWritingLab.getProgress())) {
      const q = wIndex.get(id);
      if (!q || state.spaced[`w:${id}`] || exclude.has(id)) continue;
      const wrong = row.rating === "review" || (row.checked && (q.type === "grammar" ? row.choice !== q.correctIndex : q.type === "sentence" &&
        !q.solutions.some(solution => solution.length === row.selections.length && solution.every((n, slot) => q.tiles[n] === q.tiles[row.selections[slot]]))));
      if (wrong) candidates.push({ key: `w:${id}`, id, due: date, wrong: true });
    }
    candidates.sort((a, b) => Number(b.wrong) - Number(a.wrong) || a.due.localeCompare(b.due) ||
      hash(`${date}:${a.id}`) - hash(`${date}:${b.id}`));
    for (const candidate of candidates) {
      if (candidate.key.startsWith("r:")) {
        const { set, q } = rIndex.get(candidate.id);
        const ids = q.acceptedAnswers ? groups(set).find(g => g.qs.some(item => item.id === q.id)).qs.map(item => item.id) : [q.id];
        if (ids.some(id => exclude.has(id))) continue;
        return { engine: "reading", ids, setId: set.id, title: "復習 · 間隔をあけて思い出す",
          detail: `${candidate.wrong ? "間違いを優先" : "復習予定の問題"} · ${ids.length}問\n${set.title}`, minutes: ids.length > 5 ? 8 : 5 };
      }
      const q = wIndex.get(candidate.id);
      return { engine: "writing", ids: [q.id], title: "復習 · Writingを見直す", detail: q.title, minutes: q.minutes || 5 };
    }
    return { engine: "recall", ids: [], title: "復習 · 3語を自分の文で使う",
      detail: "今日のTask 1から3語を選び、解説を隠して意味を思い出し、例文を作ります。", minutes: 5 };
  }
  function completedDays(date) {
    return Object.values(state.days).filter(day => day.date < date && day.steps.every(s => s.complete)).length;
  }
  function buildDay(date) {
    const days = completedDays(date);
    const phase = state.level === "b2" ? config.phases.at(-1) : config.phases.filter(p => p.afterDays <= days).at(-1);
    const steps = ["Task 1", "Task 2", "Task 3"].map(task => chooseReading(task, phase, date));
    const sentences = chooseWriting("sentence", 3, date), grammar = chooseWriting("grammar", 1, date);
    steps.push({ engine: "writing", ids: [...sentences, ...grammar], title: "文の組み立て・文法", detail: "Build a Sentence 3問 ＋ Grammar 1問 · 正答・別解・解説を確認", minutes: 5 });
    const essayType = Math.floor(ordinal(date)) % 2 === 0 ? "email" : "discussion";
    const essay = wIndex.get(chooseWriting(essayType, 1, date)[0]);
    steps.push({ engine: "writing", ids: [essay.id], title: essayType === "email" ? "Write an Email" : "Academic Discussion", detail: `${essay.title} · 書く → 解答例と比較 → 修正`, minutes: essay.minutes });
    const audio = ordered(config.listening, q => `listen:${q.id}`, date)[0]; use(`listen:${audio.id}`);
    steps.push({ engine: "listening", ids: [audio.id], title: "Listening · 実際の録音", detail: `${audio.title}\n${audio.genre} · British Council B2（別タブ）`, minutes: 12 });
    const discussion = essayType === "discussion" ? essay : wIndex.get(chooseWriting("discussion", 1, `${date}:speaking`)[0]);
    steps.push({ engine: "speaking", ids: [discussion.id], title: "Speaking · 意見と応答", detail: `${discussion.title}\n60秒で説明 → 60秒で別の意見に応答`, minutes: 5 });
    steps.push(reviewPlan(date, new Set(steps.flatMap(step => step.ids))));
    steps.forEach((step, slot) => Object.assign(step, { slot, reviewed: [], attempts: {}, complete: false, opened: false,
      notes: "", checks: [], timer: 60, deadline: null }));
    return { date, phase: phase.id, week: Math.floor(days / 7), steps };
  }
  function ready() {
    if (!config || !reading || !writing) return;
    const date = localDate();
    if (date !== currentDate || !state.days[date]) {
      pauseWork(); activeWork = null; el("workspace").hidden = true;
      currentDate = date;
      if (!state.days[date]) { state.days[date] = buildDay(date); save(); }
      renderReflection();
    }
    render();
  }
  function render() {
    const day = state.days[currentDate];
    if (!day) return;
    const phase = config.phases.find(p => p.id === day.phase), focus = config.focus[day.week % config.focus.length];
    el("content").hidden = false; el("retry").hidden = true;
    el("date").textContent = `${currentDate} · 端末の現地日付 · 学習${day.week + 1}週目`;
    el("phase").textContent = phase.title;
    el("focus-title").textContent = focus.title;
    el("focus-en").textContent = focus.en; el("focus-ja").textContent = focus.ja;
    const done = day.steps.filter(s => s.complete).length;
    el("total").textContent = `${done} / 8 完了`;
    const total = day.steps.reduce((n, s) => n + s.minutes, 0), left = day.steps.filter(s => !s.complete).reduce((n, s) => n + s.minutes, 0);
    el("time").textContent = `約${total}分 · 残り約${left}分`;
    const next = day.steps.find(s => !s.complete);
    el("next").disabled = !next;
    el("next").textContent = next ? `${done ? "続き" : "今日の学習"}を始める → ${next.title}` : "今日の全8項目を完了しました";
    el("level").value = state.level;
    const cards = el("cards"); cards.replaceChildren();
    for (const step of day.steps) {
      const li = node("li", undefined, `daily-card${step.complete ? " is-done" : ""}`); li.dataset.dailySlot = step.slot;
      li.append(node("h3", step.title), node("small", `目安 ${step.minutes}分`), node("p", step.detail));
      const n = step.reviewed.length, incorrect = Object.values(step.attempts).filter(value => value === "incorrect").length;
      const status = node("p", step.complete ? `✓ ${["listening", "speaking", "recall"].includes(step.engine) ? "自己確認済み" : "解答・解説確認済み"}${incorrect ? ` · ${incorrect}問を要復習に記録` : ""}` : n ? `${n} / ${step.ids.length}問を確認済み` : "未完了", "daily-card-status");
      li.append(status);
      const button = node("button", step.complete ? "もう一度練習" : "始める", "toefl-button toefl-button--secondary");
      button.type = "button"; button.dataset.dailyStart = step.slot;
      button.disabled = step.engine === "recall" && !day.steps[0].complete;
      if (button.disabled) li.append(node("small", "Task 1を確認すると始められます"));
      li.append(button); cards.append(li);
    }
    renderWeek(); notice();
  }
  function renderWeek() {
    const row = el("week-days"); row.replaceChildren();
    const totals = { Reading: 0, Writing: 0, Listening: 0, Speaking: 0, Review: 0 };
    for (let i = 6; i >= 0; i--) {
      const date = shift(currentDate, -i), day = state.days[date];
      const done = day ? day.steps.filter(s => s.complete).length : 0;
      const n = node("div", date.slice(5), "daily-day");
      n.append(node("strong", done === 8 ? "✓" : `${done}/8`)); row.append(n);
      if (!day) continue;
      if (day.steps.slice(0, 3).every(s => s.complete)) totals.Reading++;
      if (day.steps.slice(3, 5).every(s => s.complete)) totals.Writing++;
      if (day.steps[5].complete) totals.Listening++;
      if (day.steps[6].complete) totals.Speaking++;
      if (day.steps[7].complete) totals.Review++;
    }
    el("coverage").textContent = Object.entries(totals).map(([skill, n]) => `${skill} ${n}/7日`).join(" · ");
  }
  function start(slot) {
    ready();
    const step = state.days[currentDate].steps[slot];
    if (!step) return;
    pauseWork(); el("workspace").hidden = true; activeWork = null;
    const context = { dailyDate: currentDate, dailySlot: slot };
    if (step.engine !== "writing") window.ToeflWritingLab.pauseTimer();
    if (step.engine === "reading") {
      const ids = step.complete ? step.ids : remaining(step);
      if (!window.ToeflReadingLab.startSelection(step.setId, ids, context)) el("status").textContent = "このReading教材を開けませんでした。教材一覧から再読み込みしてください。";
    } else if (step.engine === "writing") {
      const ids = step.complete ? step.ids : remaining(step);
      if (!window.ToeflWritingLab.startSelection(ids, context)) el("status").textContent = "このWriting教材を開けませんでした。教材一覧から再読み込みしてください。";
    } else {
      if (step.engine === "recall" && !state.days[currentDate].steps[0].complete) return;
      activeWork = context; renderWork(step);
      el("workspace").hidden = false;
      el("workspace").scrollIntoView({ behavior: "smooth", block: "start" });
      el("work-title").focus({ preventScroll: true });
    }
  }
  function checkField(step, label, index, body, update) {
    const wrap = node("label", undefined, "daily-check"), input = node("input"); input.type = "checkbox";
    input.checked = step.checks.includes(index); input.dataset.dailyCheck = index;
    input.addEventListener("change", () => {
      step.checks = input.checked ? [...new Set([...step.checks, index])] : step.checks.filter(n => n !== index);
      save(); update();
    });
    wrap.append(input, node("span", label)); body.append(wrap);
  }
  function renderWork(step) {
    el("work-title").textContent = step.title;
    const body = el("work-body"); body.replaceChildren();
    const finish = node("button", "練習と自己確認を終えて完了", "toefl-button toefl-button--primary"); finish.type = "button"; finish.id = "daily-work-finish";
    const needed = step.engine === "listening" ? 3 : step.engine === "speaking" ? 3 : 2;
    const update = () => { finish.disabled = !step.notes.trim() || Array.from({ length: needed }, (_, i) => i).some(i => !step.checks.includes(i)) || (step.engine === "listening" && !step.opened); };
    if (step.engine === "listening") {
      const q = config.listening.find(item => item.id === step.ids[0]);
      body.append(node("p", "Listen for the main message first, then listen again for details. Try the comprehension tasks before opening the transcript. Check the answers there, then return and explain one correction in your own words."));
      body.append(node("p", "まず音声だけで要点をつかみ、2回目で細部を確認。comprehension（内容の理解）の問題を解いてからtranscript（音声の文字起こし）と解答を確認します。難しい場合は準備語彙と本文を使い、最後に本文なしでもう一度聞きましょう。"));
      const link = node("a", `${q.title} · 録音と確認問題を開く ↗`, "toefl-button toefl-button--secondary");
      link.href = config.listeningBase + q.id; link.target = "_blank"; link.rel = "noopener noreferrer"; link.id = "daily-audio-link";
      link.addEventListener("click", () => { step.opened = true; save(); update(); }); body.append(link);
      const fallback = node("a", "リンクや音声が使えないときはB2一覧から別の録音を選ぶ ↗");
      fallback.href = config.listeningFallback; fallback.target = "_blank"; fallback.rel = "noopener noreferrer";
      fallback.addEventListener("click", () => { step.opened = true; save(); update(); });
      body.append(node("p", "音声と採点は外部教材のページで確認します。ここでの完了は自分で確認した学習の記録です。", "daily-note"), fallback);
      ["本文を隠して実際の録音を聞いた", "確認問題を解き、外部教材の解答と比べた", "聞き取れなかった箇所を確認してもう一度聞いた"].forEach((text, i) => checkField(step, text, i, body, update));
    } else if (step.engine === "speaking") {
      const q = wIndex.get(step.ids[0]);
      body.append(node("p", q.context, "daily-post"));
      for (const post of q.posts || []) body.append(node("p", `${post.name} · ${post.text}`, "daily-post"));
      body.append(node("p", "Prepare three keywords, then speak for 60 seconds: give your position, a reason, and an example. Next, respond to a different viewpoint for 60 seconds without reading a script. Finish by asking a follow-up question."));
      body.append(node("p", "キーワード3つだけ準備し、立場・理由・具体例を60秒で説明。次は別の立場への応答を60秒で話します。viewpoint（見方・立場）を認めてから自分の考えを足し、follow-up question（追加質問）も作りましょう。発話の正誤は自己確認です。"));
      const timer = node("output", undefined, "daily-timer"); timer.id = "daily-speaking-timer"; timer.setAttribute("aria-label", "発話の残り時間");
      const toggle = node("button", undefined, "toefl-button toefl-button--secondary"); toggle.type = "button"; toggle.id = "daily-timer-toggle";
      toggle.addEventListener("click", () => {
        if (step.deadline !== null) { step.timer = Math.max(0, Math.ceil((step.deadline - Date.now()) / 1000)); step.deadline = null; }
        else { if (step.timer <= 0) step.timer = 60; step.deadline = Date.now() + step.timer * 1000; }
        save(); renderTimer();
      });
      const reset = node("button", "次の60秒", "toefl-button toefl-button--ghost"); reset.type = "button";
      reset.addEventListener("click", () => { step.deadline = null; step.timer = 60; save(); renderTimer(); });
      body.append(timer, toggle, reset);
      ["実際に声に出して話した（台本の読み上げだけで終えていない）", "理由と具体例を添え、分かりにくい所を言い直した", "別の意見に応答し、相手への追加質問も声に出した"].forEach((text, i) => checkField(step, text, i, body, update));
    } else {
      const ids = state.days[currentDate].steps[0].ids;
      const words = [...new Set(ids.map(id => rIndex.get(id)?.q.acceptedAnswers?.at(-1)).filter(Boolean))].slice(0, 3);
      body.append(node("p", `Today's words: ${words.join(" / ")}`));
      body.append(node("p", "Recall each meaning before opening the earlier explanation. Write one new sentence for each word, check the meaning and grammar, and revise any sentence that does not fit. Say the revised sentences aloud."));
      body.append(node("p", "recall（見ずに思い出す）→自分の例文→解説と比較→言い直し。3語それぞれの意味が状況に合うか確認し、修正した文を声に出しましょう。例文は自己確認で、自動採点はしません。"));
      ["意味を思い出してから各語の解説を確認した", "自分の例文を3つ作り、意味と文法を見直して声に出した"].forEach((text, i) => checkField(step, text, i, body, update));
    }
    const label = node("label", "要点・根拠／自分の例文／言い直したい点を記録", "daily-field"); label.htmlFor = "daily-work-notes";
    const notes = node("textarea"); notes.id = "daily-work-notes"; notes.rows = 4; notes.maxLength = 5000; notes.value = step.notes;
    notes.addEventListener("input", () => { step.notes = notes.value.slice(0, 5000); save(); update(); });
    label.append(notes); body.append(label, finish);
    finish.addEventListener("click", () => {
      if (finish.disabled) return;
      step.complete = true; pauseWork(); save(); render(); el("workspace").hidden = true; activeWork = null;
      root.scrollIntoView({ behavior: "smooth", block: "start" }); el("next").focus({ preventScroll: true });
    });
    update(); renderTimer();
  }
  function renderTimer() {
    if (!activeWork) return;
    const step = state.days[activeWork.dailyDate]?.steps[activeWork.dailySlot];
    if (!step || step.engine !== "speaking") return;
    const seconds = step.deadline === null ? step.timer : Math.max(0, Math.ceil((step.deadline - Date.now()) / 1000));
    const output = el("speaking-timer"), toggle = el("timer-toggle");
    if (!output || !toggle) return;
    output.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
    toggle.textContent = step.deadline !== null ? "一時停止" : seconds === 0 ? "もう60秒話す" : "60秒の発話を始める";
    if (step.deadline !== null && seconds === 0) { step.deadline = null; step.timer = 0; save(); }
  }
  function pauseWork() {
    if (!activeWork) return;
    const step = state.days[activeWork.dailyDate]?.steps[activeWork.dailySlot];
    if (step?.deadline !== null && step?.deadline !== undefined) {
      step.timer = Math.max(0, Math.ceil((step.deadline - Date.now()) / 1000)); step.deadline = null; save();
    }
  }
  function schedule(engine, id, result, date) {
    const key = `${engine === "reading" ? "r" : "w"}:${id}`;
    const old = state.spaced[key];
    const wrong = result === "incorrect";
    const streak = wrong ? 0 : old?.lastReviewed === date ? Math.max(1, old.streak) : Math.min(5, (old?.streak || 0) + 1);
    state.spaced[key] = { streak, wrong, lastReviewed: date, due: shift(date, wrong ? 1 : [1, 1, 3, 7, 14, 30][streak]) };
  }
  function progressEvent(event, reviewed = false) {
    const { id, result, context } = event.detail || {};
    if (!context || !validDate(context.dailyDate) || !Number.isInteger(context.dailySlot)) return;
    const day = state.days[context.dailyDate], step = day?.steps[context.dailySlot];
    if (!step || !step.ids.includes(id) || !["reading", "writing"].includes(step.engine)) return;
    if (!reviewed) {
      if (!["correct", "incorrect", "submitted"].includes(result)) return;
      step.attempts[id] = result;
      if (!step.complete) step.reviewed = step.reviewed.filter(item => item !== id);
    } else {
      if (!step.attempts[id]) return; // Old saved results do not complete today's work.
      if (result === "self-reviewed" && step.attempts[id] !== "submitted") return;
      if (!["correct", "incorrect", "self-reviewed"].includes(result)) return;
      step.attempts[id] = result;
      if (!step.reviewed.includes(id)) step.reviewed.push(id);
      schedule(step.engine, id, result, context.dailyDate);
      step.complete = step.ids.every(item => step.reviewed.includes(item));
    }
    save(); if (context.dailyDate === currentDate) render();
  }
  function weekKey(date) {
    const day = new Date(`${date}T12:00:00Z`).getUTCDay();
    return shift(date, -(day + 6) % 7);
  }
  function renderReflection() {
    const row = state.reflections[weekKey(currentDate)] || { ratings: {}, evidence: "" };
    const container = el("can-do"); container.replaceChildren();
    for (const goal of config.canDo) {
      const label = node("label", goal.text, "daily-field"), select = node("select"); select.dataset.dailyGoal = goal.id;
      for (const [value, text] of [["", "まだ確認していない"], ["support", "手助けがあればできる"], ["independent", "一人でできた"], ["transfer", "初めての題材でもできた"]]) {
        const option = node("option", text); option.value = value; select.append(option);
      }
      select.value = row.ratings[goal.id] || ""; label.append(select); container.append(label);
    }
    el("evidence").value = row.evidence;
    el("reflection-status").textContent = row.evidence ? `${weekKey(currentDate)}の週の振り返りを保存しています。` : "初回の状態、または今週の具体例を残しましょう。";
  }
  async function load() {
    if (!unlocked || loading) return;
    loading = true;
    try {
      if (!config) {
        const response = await fetch(root.dataset.planUrl);
        if (!response.ok) throw new Error("Plan unavailable");
        const payload = await response.json();
        if (payload.schemaVersion !== 1 || !payload.phases?.length || !payload.focus?.length || !payload.listening?.length ||
          payload.listeningBase !== "https://learnenglish.britishcouncil.org/free-resources/listening/b2/") throw new Error("Invalid plan");
        config = payload; restore();
      }
      reading = window.ToeflReadingLab?.getBank(); writing = window.ToeflWritingLab?.getBank();
      if (!reading || !writing) { el("status").textContent = "ReadingとWritingの教材を読み込んでいます…"; el("retry").hidden = false; return; }
      rIndex.clear(); wIndex.clear();
      for (const set of reading.sets) for (const q of set.questions) rIndex.set(q.id, { q, set });
      for (const q of writing.exercises) wIndex.set(q.id, q);
      const savedDay = state.days[localDate()];
      if (savedDay && savedDay.steps.some(step => step.engine === "reading" ? !step.ids.length || step.ids.some(id => rIndex.get(id)?.set.id !== step.setId) :
        ["writing", "speaking"].includes(step.engine) ? !step.ids.length || step.ids.some(id => !wIndex.has(id)) :
        step.engine === "listening" ? !config.listening.some(item => item.id === step.ids[0]) : false)) {
        delete state.days[localDate()];
        recoveryNotice = "保存済みメニューに利用できない教材があったため、今日のメニューを組み直しました。教材ごとの学習記録は残っています。";
      }
      ready();
    } catch (error) {
      console.warn("Daily menu could not load", error);
      el("status").textContent = "日替わりメニューを読み込めませんでした。通信を確認して再読み込みしてください。教材一覧からの練習も使えます。";
      el("retry").hidden = false;
    } finally { loading = false; }
  }
  el("next").addEventListener("click", () => {
    ready(); const step = state.days[currentDate]?.steps.find(s => !s.complete); if (step) start(step.slot);
  });
  el("cards").addEventListener("click", event => { const button = event.target.closest("[data-daily-start]"); if (button) start(Number(button.dataset.dailyStart)); });
  el("level").addEventListener("change", () => { state.level = el("level").value === "b2" ? "b2" : "path"; save(); el("status").textContent = "難易度の希望を保存しました。今日の教材はそのまま、翌日のメニューから反映します。"; });
  el("work-close").addEventListener("click", () => { pauseWork(); activeWork = null; el("workspace").hidden = true; root.scrollIntoView({ behavior: "smooth" }); });
  el("save-reflection").addEventListener("click", () => {
    const ratings = Object.fromEntries([...root.querySelectorAll("[data-daily-goal]")].map(select => [select.dataset.dailyGoal, select.value]));
    state.reflections[weekKey(currentDate)] = { ratings, evidence: el("evidence").value.slice(0, 5000) }; save();
    el("reflection-status").textContent = storageFailed ? "保存できませんでした。学習記録をダウンロードしてください。" : "技能ごとの振り返りを保存しました。次は初めての題材でも試しましょう。";
  });
  el("export").addEventListener("click", () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: "application/json;charset=utf-8" }));
    const link = node("a"); link.href = url; link.download = `daily-study-${currentDate}.json`;
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  el("retry").addEventListener("click", load);
  document.addEventListener("toefl:unlocked", () => { unlocked = true; load(); });
  for (const name of ["reading", "writing"]) {
    document.addEventListener(`toefl:${name}-ready`, load);
    document.addEventListener(`toefl:${name}-answer`, progressEvent);
    document.addEventListener(`toefl:${name}-reviewed`, event => progressEvent(event, true));
  }
  document.addEventListener("toefl:writing-submitted", progressEvent);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { ready(); renderTimer(); } });
  window.addEventListener("focus", () => { ready(); renderTimer(); });
  window.addEventListener("pagehide", () => { if (config && currentDate) save(); });
  setInterval(() => { if (config && reading && writing) ready(); }, 60000);
  setInterval(renderTimer, 500);
})();
