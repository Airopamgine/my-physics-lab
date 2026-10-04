(() => {
  "use strict";
  const root = document.getElementById("writing-lab");
  if (!root) return;
  const KEY = "mastersPhysicsLab.writingLab.v1";
  const TYPES = { sentence: "Build a Sentence", email: "Write an Email", discussion: "Academic Discussion", grammar: "Grammar & response" };
  const isObjective = q => q.type === "sentence" || q.type === "grammar";
  const isEssay = q => q.type === "email" || q.type === "discussion";
  const sourceLabel = q => q.source.kind === "original" ? `Original Writing · ${q.source.date}` : `${q.source.file} PDF ${q.source.pages.join("・")}ページ`;
  const el = id => document.getElementById(`writing-${id}`);
  const node = (tag, text, className) => {
    const item = document.createElement(tag);
    if (text !== undefined) item.textContent = text;
    if (className) item.className = className;
    return item;
  };
  const words = text => (text.match(/[A-Za-z0-9]+(?:['’\-][A-Za-z0-9]+)*/g) || []).length;
  const isObject = value => value && typeof value === "object" && !Array.isArray(value);
  const clean = (value, limit) => typeof value === "string" ? value.slice(0, limit) : "";
  let bank, active, loading = false, unlocked = false, storageFailed = false, storageNotice = "";
  let guidedSession = null;
  const searchText = new Map();
  let state = { version: 1, task: "sentence", lastId: "", records: Object.create(null) };

  function record(q) {
    return state.records[q.id] ||= { answer: "", notes: "", selections: [], choice: null, checked: false,
      rating: "", checks: [], history: [], remaining: (q.minutes || 0) * 60, deadline: null, expired: false };
  }
  function result(q, r) {
    if (!r.checked) return "";
    if (q.type === "grammar") return r.choice === q.correctIndex ? "correct" : "incorrect";
    return q.solutions.some(solution => solution.length === r.selections.length &&
      solution.every((index, slot) => q.tiles[index] === q.tiles[r.selections[slot]])) ? "correct" : "incorrect";
  }
  function save() {
    state.guided = guidedSession;
    try { localStorage.setItem(KEY, JSON.stringify(state)); storageFailed = false; }
    catch (_) { storageFailed = true; }
    el("save-status").textContent = storageFailed ? "保存できません。答案をダウンロードしてください。" : "このブラウザ内に保存しました";
    if (storageFailed) el("status").textContent = "このブラウザに学習記録を保存できません。作文は答案をダウンロードして残してください。";
  }
  function restore() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!isObject(saved) || saved.version !== 1 || !isObject(saved.records)) throw new Error("Invalid saved data");
      if (Object.hasOwn(TYPES, saved.task)) state.task = saved.task;
      state.lastId = bank.exercises.some(q => q.id === saved.lastId) ? saved.lastId : "";
      for (const q of bank.exercises) {
        const previous = saved.records[q.id];
        if (!isObject(previous)) continue;
        const r = record(q);
        r.answer = clean(previous.answer, 20000);
        r.notes = clean(previous.notes, 5000);
        r.rating = ["review", "done"].includes(previous.rating) ? previous.rating : "";
        r.checks = Array.isArray(previous.checks) ? previous.checks.filter(n => Number.isInteger(n) && n >= 0 && n < 12) : [];
        r.history = Array.isArray(previous.history) ? previous.history.filter(h => isObject(h) && typeof h.text === "string")
          .slice(-5).map(h => ({ text: clean(h.text, 20000), at: clean(h.at, 40) })) : [];
        if (q.type === "sentence") {
          r.selections = Array.isArray(previous.selections) ? [...new Set(previous.selections.filter(n =>
            Number.isInteger(n) && n >= 0 && n < q.tiles.length))].slice(0, q.solutions[0].length) : [];
          r.checked = previous.checked === true && r.selections.length === q.solutions[0].length;
        } else if (q.type === "grammar") {
          r.choice = Number.isInteger(previous.choice) && previous.choice >= 0 && previous.choice < q.choices.length ? previous.choice : null;
          r.checked = previous.checked === true && r.choice !== null;
        } else {
          const duration = q.minutes * 60;
          r.remaining = Number.isFinite(previous.remaining) ? Math.max(0, Math.min(duration, previous.remaining)) : duration;
          r.deadline = Number.isFinite(previous.deadline) && previous.deadline <= Date.now() + duration * 1000 ? previous.deadline : null;
          r.expired = previous.expired === true;
        }
      }
      const session = saved.guided;
      if (isObject(session) && Array.isArray(session.ids) && session.ids.length > 0 && session.ids.length <= 40 &&
        session.ids.every(id => bank.exercises.some(q => q.id === id)) && session.ids.includes(state.lastId) &&
        isObject(session.context) && /^\d{4}-\d{2}-\d{2}$/.test(session.context.dailyDate) &&
        Number.isInteger(session.context.dailySlot) && session.context.dailySlot >= 0 && session.context.dailySlot < 8) {
        guidedSession = { ids: [...session.ids], context: { dailyDate: session.context.dailyDate, dailySlot: session.context.dailySlot } };
      }
    } catch (_) { storageNotice = "保存済みデータを読み込めませんでした。新しい下書きで練習できます。"; }
  }
  function status(q) {
    const r = state.records[q.id];
    if (!r) return "未着手";
    if (r.rating) return r.rating === "done" ? "確認済み" : "要復習";
    if (isObjective(q) && r.checked) return result(q, r) === "correct" ? "正解" : "要復習";
    if (r.history.length) return "見直し中";
    return r.answer.trim() || r.notes.trim() || r.selections.length || r.choice !== null ? "下書きあり" : "未着手";
  }
  function renderCatalog() {
    if (!bank) return;
    for (const button of root.querySelectorAll("[data-writing-task]")) {
      button.disabled = false;
      button.setAttribute("aria-pressed", String(button.dataset.writingTask === state.task));
    }
    const counts = Object.keys(TYPES).map(type => bank.exercises.filter(q => q.type === type).length);
    Object.keys(TYPES).forEach((type, i) => { el(`${type}-count`).textContent = `${counts[i]}演習`; });
    el("total").textContent = `${bank.exercises.length}演習 · 3 tasks + grammar`;
    const correct = bank.exercises.filter(q => q.type === "sentence" && state.records[q.id] && result(q, state.records[q.id]) === "correct").length;
    const grammarCorrect = bank.exercises.filter(q => q.type === "grammar" && state.records[q.id] && result(q, state.records[q.id]) === "correct").length;
    const reviewed = bank.exercises.filter(q => isEssay(q) && state.records[q.id]?.rating === "done").length;
    el("progress").textContent = `並べ替え正解 ${correct}/${counts[0]} · 文法正解 ${grammarCorrect}/${counts[3]} · 作文確認済み ${reviewed}/${counts[1] + counts[2]}`;
    el("catalog").hidden = Boolean(active);
    if (active) return;
    const query = el("search").value.toLowerCase().trim();
    const filter = el("filter").value;
    const list = bank.exercises.filter(q => {
      const s = status(q);
      return q.type === state.task && searchText.get(q.id).includes(query) &&
        (filter === "all" || (filter === "draft" && ["下書きあり", "見直し中"].includes(s)) ||
        (filter === "review" && s === "要復習") || (filter === "done" && ["確認済み", "正解"].includes(s)));
    });
    el("catalog").replaceChildren();
    for (const q of list) {
      const card = node("article", undefined, "writing-exercise-card");
      const label = node("div");
      label.append(node("strong", q.title), node("p", `${q.collection} · ${status(q)}`));
      const button = node("button", status(q) === "未着手" ? "練習する" : "再開する", "toefl-button toefl-button--secondary");
      button.type = "button";
      button.dataset.writingStart = q.id;
      button.setAttribute("aria-label", `${q.title}を${button.textContent}`);
      button.addEventListener("click", () => open(q));
      card.append(label, button);
      el("catalog").append(card);
    }
    el("status").textContent = storageFailed ? "このブラウザに学習記録を保存できません。作文は答案をダウンロードして残してください。" :
      storageNotice || (list.length ? `${TYPES[state.task]} · ${list.length}演習` : "条件に合う教材がありません。");
    el("catalog").hidden = Boolean(active);
  }
  function list(items, parent) {
    const ul = node("ul");
    for (const text of items) ul.append(node("li", text));
    parent.append(ul);
  }
  function renderPrompt(q) {
    const prompt = el("prompt");
    prompt.replaceChildren();
    if (isObjective(q)) {
      prompt.append(node("h4", q.type === "grammar" ? "Question" : "Sentence task"), node("p", q.prompt));
      prompt.lastChild.lang = "en";
      prompt.append(node("p", q.type === "grammar" ? "文法・文脈と設問条件を満たす選択肢を一つ選んでください。" : "設問に合う文を組み立ててください。"));
    } else {
      if (q.type === "email") prompt.append(node("h4", "Situation"));
      else prompt.append(node("h4", q.professor));
      prompt.append(node("p", q.context));
      prompt.lastChild.lang = "en";
      if (q.type === "email") prompt.append(node("p", `To: ${q.to}\nSubject: ${q.subject}`));
      if (q.posts) {
        prompt.append(node("h4", "Student posts · 英語要約"));
        for (const post of q.posts) {
          const section = node("div", undefined, "writing-post");
          section.lang = "en";
          section.append(node("strong", post.name), node("p", post.text));
          prompt.append(section);
        }
      }
      prompt.append(node("h4", "Include in your response"));
      list(q.requirements, prompt);
    }
    if (q.editorNote) prompt.append(node("p", `校訂・出典の補足：${q.editorNote}`, "writing-editor-note"));
  }
  function renderGrammar() {
    const q = active, r = record(q), tiles = el("tiles");
    el("frame").replaceChildren(); tiles.replaceChildren();
    q.choices.forEach((text, i) => {
      const label = node("label", undefined, "writing-choice");
      const input = node("input");
      input.type = "radio"; input.name = "writing-choice"; input.value = i;
      input.dataset.writingChoice = i; input.checked = r.choice === i;
      input.addEventListener("change", () => {
        r.choice = i; resetObjective(r);
        el("tiles").querySelector(`input[data-writing-choice="${i}"]`).focus();
      });
      label.append(input, node("span", `${String.fromCharCode(65 + i)}. ${text}`)); tiles.append(label);
    });
    el("check").disabled = r.choice === null;
  }
  function renderSentence() {
    const q = active, r = record(q);
    const frame = el("frame"), tiles = el("tiles");
    frame.replaceChildren(); tiles.replaceChildren();
    for (const chunk of q.frame) {
      const parts = chunk.split(/(\{\d+\})/);
      for (const part of parts) {
        const slot = /^\{(\d+)\}$/.exec(part);
        if (!slot) { frame.append(document.createTextNode(part)); continue; }
        const i = Number(slot[1]);
        const value = r.selections[i];
        const button = node("button", value === undefined ? `${i + 1} ___` : q.tiles[value], "writing-slot");
        button.type = "button"; button.dataset.writingSlot = i; button.disabled = value === undefined;
        button.setAttribute("aria-label", value === undefined ? `空欄${i + 1}` : `空欄${i + 1}の ${q.tiles[value]} を戻す`);
        button.addEventListener("click", () => { r.selections.splice(i, 1); resetObjective(r); });
        frame.append(button);
      }
    }
    q.tiles.forEach((text, i) => {
      const button = node("button", text, "writing-tile");
      button.type = "button"; button.dataset.writingTile = i;
      button.disabled = r.selections.includes(i) || r.selections.length === q.solutions[0].length;
      button.addEventListener("click", () => { r.selections.push(i); resetObjective(r); });
      tiles.append(button);
    });
    el("check").disabled = r.selections.length !== q.solutions[0].length;
  }
  function resetObjective(r) {
    r.checked = false; r.rating = "";
    el("feedback").hidden = true; el("review").hidden = true;
    if (active.type === "sentence") renderSentence(); else renderGrammar();
    save(); renderCatalog();
  }
  function pause(q) {
    if (!q || !isEssay(q)) return;
    const r = record(q);
    if (r.deadline !== null) {
      r.remaining = Math.max(0, Math.ceil((r.deadline - Date.now()) / 1000));
      r.deadline = null; r.expired = r.remaining === 0;
    }
  }
  function timer() {
    if (!active || !isEssay(active)) return;
    const r = record(active);
    if (r.deadline !== null) {
      r.remaining = Math.max(0, Math.ceil((r.deadline - Date.now()) / 1000));
      if (r.remaining === 0) {
        r.deadline = null; r.expired = true; save();
        el("feedback").hidden = false; el("feedback").dataset.result = "saved";
        el("feedback").textContent = "時間になりました。答案は保存されています。続きを書くか、保存して見直してください。";
      }
    }
    const remaining = Math.ceil(r.remaining);
    el("time").textContent = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
    el("timer-state").textContent = r.deadline !== null ? "時間を計っています" : r.expired ? "時間終了 · 答案は残ります" : r.remaining < active.minutes * 60 ? "一時停止中" : "時間制限なしで練習中";
    el("timer-toggle").textContent = r.deadline !== null ? "一時停止" : r.expired ? "もう一度計る" : "時間を計って開始";
  }
  function editor() {
    const count = words(el("answer").value);
    el("word-count").textContent = `${count} words${active.type === "discussion" ? " · 目安 100語以上" : ""}`;
    el("finish").disabled = !el("answer").value.trim();
    el("export").disabled = !el("answer").value.trim() && !el("notes").value.trim();
  }
  function assembled(q, r) {
    const text = q.frame.join("").replace(/\{(\d+)\}/g, (_, i) => q.tiles[r.selections[Number(i)]] || "___");
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
  function renderReview() {
    const q = active, r = record(q);
    const visible = isObjective(q) ? r.checked : r.history.length > 0;
    el("review").hidden = !visible;
    if (!visible) return;
    el("model-title").textContent = isObjective(q) ? "正答・解答の根拠" : "解答例（編集作成）";
    el("model-note").textContent = q.answerBasis;
    el("model").textContent = q.modelAnswer;
    const explanation = el("explanation"); explanation.replaceChildren();
    list(q.explanation, explanation);
    if (q.type === "sentence" && q.solutions.length > 1) {
      const alternatives = [...new Set(q.solutions.slice(1).map(selections => assembled(q, { selections })))];
      explanation.append(node("h4", "認められる別解"));
      list(alternatives, explanation);
    }
    explanation.append(node("h4", "使える表現")); list(q.phrases, explanation);
    const selfcheck = el("selfcheck"); selfcheck.replaceChildren();
    el("submission").hidden = isObjective(q);
    if (isEssay(q)) {
      selfcheck.append(node("h4", "自己点検 · 自分で確認してチェック"));
      const checks = [...q.requirements, q.type === "email" ? "相手に合う挨拶・丁寧な依頼・結びになっている" : "主張を支える理由と具体例があり、既存意見に自分の内容を加えている",
        "文のつながり、動詞の形、綴りを確認した"];
      const group = node("div", undefined, "writing-selfchecks");
      checks.forEach((text, i) => {
        const label = node("label"), input = node("input");
        input.type = "checkbox"; input.checked = r.checks.includes(i); input.dataset.writingSelfcheck = i;
        input.addEventListener("change", () => { r.checks = [...group.querySelectorAll("input:checked")].map(item => Number(item.dataset.writingSelfcheck)); save(); });
        label.append(input, node("span", text)); group.append(label);
      });
      selfcheck.append(group);
      const previous = r.history.at(-1);
      el("submitted-answer").textContent = `${previous.at ? `保存日時: ${new Date(previous.at).toLocaleString("ja-JP")}\n\n` : ""}${previous.text}`;
    }
    const siblings = guidedSession ? guidedSession.ids.map(id => bank.exercises.find(item => item.id === id)) : bank.exercises.filter(item => item.type === q.type);
    el("next").textContent = siblings.at(-1).id === q.id ? "一覧に戻る" : "次の教材へ →";
  }
  function feedback() {
    const r = record(active);
    el("feedback").hidden = isObjective(active) ? !r.checked : !r.history.length;
    if (el("feedback").hidden) return;
    const value = isObjective(active) ? result(active, r) : "saved";
    el("feedback").dataset.result = value;
    el("feedback").textContent = value === "correct" ? "正解です。文法と解答の理由を確認しましょう。" : value === "incorrect" ? "解答を見直しましょう。正答と根拠を確認できます。" : "答案を保存しました。解答例と比較して書き直してください。自由作文の点数や正誤は自動判定しません。";
  }
  function open(q, focus = true, guided = false) {
    if (!guided) guidedSession = null;
    if (active && active.id !== q.id) pause(active);
    active = q; state.lastId = q.id; state.task = q.type;
    el("runner").hidden = false;
    el("exercise-type").textContent = TYPES[q.type];
    el("exercise-title").textContent = q.title;
    el("source").textContent = `${q.collection} · ${sourceLabel(q)} · ${q.answerBasis}${guidedSession?.context?.dailyDate ? ` · ${guidedSession.context.dailyDate}のメニュー` : ""}`;
    renderPrompt(q);
    el("sentence-panel").hidden = !isObjective(q);
    el("essay-panel").hidden = !isEssay(q);
    el("frame").hidden = q.type !== "sentence";
    el("tiles").classList.toggle("writing-choices", q.type === "grammar");
    el("tiles").setAttribute("aria-label", q.type === "grammar" ? "選択肢" : "選べる語句");
    el("objective-help").textContent = q.type === "grammar" ? "答えを一つ選び、採点してください。選び直すと採点結果をリセットします。" : "語句を選ぶと空欄に入ります。入れた語句を押すと戻せます。使わない語句がある問題もあります。";
    el("clear").textContent = q.type === "grammar" ? "選択を解除" : "語句を戻す";
    const r = record(q);
    if (q.type === "sentence") renderSentence();
    else if (q.type === "grammar") renderGrammar();
    else { el("answer").value = r.answer; el("notes").value = r.notes; editor(); timer(); }
    feedback(); renderReview(); renderCatalog(); save();
    el("tutor").replaceChildren();
    window.ToeflChatGPTBridge?.mount(el("tutor"), () => ({
      writingReview: isEssay(q), source: sourceLabel(q),
      section: "Writing", task: TYPES[q.type], setTitle: q.title,
      context: [q.context || q.prompt, ...(q.posts || []).map(post => `${post.name} (summary): ${post.text}`)].join("\n\n"),
      instruction: q.type === "sentence" ? "Complete the sentence using the supplied phrases." : q.type === "grammar" ? "Choose the one option that satisfies the grammar and task conditions." : q.requirements.join("\n"),
      question: q.type === "sentence" ? q.frame.join("") : q.type === "grammar" ? q.prompt : q.type === "email" ? `To: ${q.to}; Subject: ${q.subject}` : q.professor,
      options: q.tiles || q.choices, userAnswer: q.type === "sentence" ? assembled(q, record(q)) : q.type === "grammar" ? q.choices[record(q).choice] || "" : el("answer").value,
      modelAnswer: el("review").hidden ? "" : q.modelAnswer,
      explanation: el("review").hidden ? "" : q.explanation.join("\n")
    }));
    if (focus) { el("runner").scrollIntoView({ behavior: "smooth", block: "start" }); el("exercise-title").focus({ preventScroll: true }); }
  }
  function close() {
    pause(active); active = null; guidedSession = null; state.lastId = ""; save();
    el("runner").hidden = true; renderCatalog();
  }
  async function load() {
    if (loading || bank || !unlocked) return;
    loading = true; el("retry").hidden = true;
    try {
      const response = await fetch(root.dataset.bankUrl);
      if (!response.ok) throw new Error("Could not load Writing bank");
      const data = await response.json();
      if (data.schemaVersion !== 1 || !Array.isArray(data.exercises) || !data.exercises.length ||
        data.exercises.some(q => !q.id || !Object.hasOwn(TYPES, q.type) || !q.source || !Array.isArray(q.explanation))) throw new Error("Invalid Writing bank");
      bank = data;
      bank.exercises.forEach(q => searchText.set(q.id, JSON.stringify(q).toLowerCase()));
      restore(); renderCatalog();
      if (state.lastId) open(bank.exercises.find(q => q.id === state.lastId), false, Boolean(guidedSession));
      document.dispatchEvent(new CustomEvent("toefl:writing-ready"));
    } catch (_) { el("status").textContent = "Writing教材を読み込めませんでした。再試行してください。"; el("retry").hidden = false; }
    finally { loading = false; }
  }
  root.querySelectorAll("[data-writing-task]").forEach(button => button.addEventListener("click", () => {
    close(); state.task = button.dataset.writingTask; save(); renderCatalog();
  }));
  ["search", "filter"].forEach(id => el(id).addEventListener(id === "search" ? "input" : "change", () => { if (active) close(); renderCatalog(); }));
  el("close").addEventListener("click", close);
  el("clear").addEventListener("click", () => { if (!active) return; const r = record(active); r.selections = []; r.choice = null; resetObjective(r); });
  el("check").addEventListener("click", () => {
    if (!active || !isObjective(active) || el("check").disabled) return;
    const r = record(active); r.checked = true; save(); feedback(); renderReview(); renderCatalog();
    document.dispatchEvent(new CustomEvent("toefl:writing-answer", {
      detail: { id: active.id, result: result(active, r), context: guidedSession?.context }
    }));
  });
  ["answer", "notes"].forEach(id => el(id).addEventListener("input", () => {
    if (!active || !isEssay(active)) return;
    const r = record(active); r.answer = el("answer").value.slice(0, 20000); r.notes = el("notes").value.slice(0, 5000);
    r.rating = ""; r.checks = [];
    root.querySelectorAll("[data-writing-selfcheck]").forEach(input => { input.checked = false; });
    editor(); save(); renderCatalog();
  }));
  el("answer").maxLength = 20000; el("notes").maxLength = 5000;
  el("finish").addEventListener("click", () => {
    if (!active || !isEssay(active) || !el("answer").value.trim()) return;
    const r = record(active); pause(active);
    r.history.push({ text: r.answer, at: new Date().toISOString() }); r.history = r.history.slice(-5);
    r.rating = ""; r.checks = []; save(); timer(); feedback(); renderReview(); renderCatalog();
    document.dispatchEvent(new CustomEvent("toefl:writing-submitted", {
      detail: { id: active.id, result: "submitted", context: guidedSession?.context }
    }));
    el("review").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  el("timer-toggle").addEventListener("click", () => {
    if (!active || !isEssay(active)) return;
    const r = record(active);
    if (r.deadline !== null) pause(active);
    else {
      if (r.expired || r.remaining <= 0) r.remaining = active.minutes * 60;
      r.deadline = Date.now() + r.remaining * 1000; r.expired = false;
    }
    save(); timer();
  });
  el("export").addEventListener("click", () => {
    if (!active || !isEssay(active)) return;
    const text = `${active.title}\n${TYPES[active.type]}\nSource: ${sourceLabel(active)}\n\nYour response:\n${el("answer").value}\n\nNotes:\n${el("notes").value}\n`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const link = node("a"); link.href = url; link.download = `${active.id}.txt`;
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  ["review", "done"].forEach(rating => el(`mark-${rating}`).addEventListener("click", () => {
    if (!active) return;
    const r = record(active);
    if (guidedSession && isEssay(active) && rating === "done" &&
      (r.history.at(-1)?.text !== r.answer || Array.from({ length: active.requirements.length + 2 }, (_, i) => i).some(i => !r.checks.includes(i)))) {
      el("feedback").hidden = false;
      el("feedback").textContent = "今日のメニューを完了するには、最新の答案を提出し、自己点検の全項目を確認してください。下書きと提出履歴は保存しています。";
      return;
    }
    r.rating = rating; save(); renderCatalog();
    el("feedback").hidden = false;
    el("feedback").textContent = rating === "done" ? "確認済みとして記録しました。" : "要復習として記録しました。";
    if (isEssay(active) && rating === "done" && r.history.at(-1)?.text === r.answer && r.answer.trim()) {
      document.dispatchEvent(new CustomEvent("toefl:writing-reviewed", {
        detail: { id: active.id, result: "self-reviewed", context: guidedSession?.context }
      }));
    }
  }));
  el("next").addEventListener("click", () => {
    if (!active) return;
    if (isObjective(active) && record(active).checked) {
      document.dispatchEvent(new CustomEvent("toefl:writing-reviewed", {
        detail: { id: active.id, result: result(active, record(active)), context: guidedSession?.context }
      }));
    }
    const list = guidedSession ? guidedSession.ids.map(id => bank.exercises.find(q => q.id === id)) : bank.exercises.filter(q => q.type === active.type);
    const index = list.findIndex(q => q.id === active.id);
    if (index + 1 < list.length) open(list[index + 1], true, Boolean(guidedSession)); else close();
  });
  el("retry").addEventListener("click", load);
  document.addEventListener("toefl:unlocked", () => { unlocked = true; load(); });
  window.ToeflWritingLab = Object.freeze({
    getBank: () => bank,
    getProgress: () => state.records,
    pauseTimer: () => { pause(active); if (bank) { save(); timer(); } },
    startSelection: (ids, context) => {
      if (!bank || !ids.length || ids.some(id => !bank.exercises.some(q => q.id === id))) return false;
      guidedSession = { ids: [...ids], context };
      open(bank.exercises.find(q => q.id === ids[0]), true, true);
      return true;
    }
  });
  setInterval(timer, 500);
})();
