(() => {
  "use strict";
  const root = document.getElementById("vocabulary-lab");
  if (!root) return;
  const KEY = "mastersPhysicsLab.vocabularyLab.v1", PAGE = 40;
  const el = name => document.getElementById(`vocabulary-${name}`);
  const node = (tag, text = "", cls = "") => { const n = document.createElement(tag); n.textContent = text; if (cls) n.className = cls; return n; };
  const normalize = s => String(s).normalize("NFKC").replace(/[‘’]/g, "'").replace(/[‐‑–]/g, "-").trim().replace(/\s+/g, " ").toLowerCase();
  const day = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Warsaw" }).format(new Date(Date.now()));
  const number = n => n.toLocaleString();
  const fresh = () => ({ schemaVersion: 1, updatedAt: 0, records: {}, notes: {}, stars: {}, history: [], session: null, lastRound: null });
  let bank = null, state = fresh(), unlocked = false, loading = false, page = 0, sourcePage = 0, selectedSource = null;
  let cards = [], byCard = new Map(), byEntry = new Map(), searchIndex = [], filtered = [], selectedChoice = null;
  let activeStart = null, storageFailed = false, view = "quiz", retiredSession = false;
  let database = null;

  function saveNotice() {
    el("save-status").textContent = storageFailed ? "ブラウザに保存できませんでした。今の記録を「学習記録を書き出す」で退避してください。画面上では続けられます。" : "このブラウザに学習記録・自分のメモ・中断したクイズを保存しています。外部へは送信しません。";
  }
  function saveLocal() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); storageFailed = false; }
    catch (_) { storageFailed = true; }
    saveNotice();
  }
  function save() {
    state.updatedAt = Math.max(state.updatedAt + 1, Date.now());
    if (!database) { saveLocal(); return; }
    try {
      // IndexedDB has room for the complete corpus and archived card history. Transactions are
      // ordered and clone the snapshot on put, including before pagehide.
      const tx = database.transaction("progress", "readwrite");
      tx.objectStore("progress").put(state, KEY);
      tx.oncomplete = () => { storageFailed = false; saveNotice(); };
      tx.onabort = () => { database = null; storageFailed = true; saveLocal(); };
      saveNotice();
    } catch (_) { database = null; storageFailed = true; saveLocal(); }
  }
  async function openDatabase() {
    if (!window.indexedDB) return null;
    return new Promise(resolve => {
      let request;
      try { request = window.indexedDB.open("mastersPhysicsLab.vocabularyLab", 1); }
      catch (_) { resolve(null); return; }
      request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains("progress")) request.result.createObjectStore("progress"); };
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
      request.onsuccess = () => { const db = request.result; db.onversionchange = () => { db.close(); if (database === db) database = null; }; resolve(db); };
    });
  }
  function safeState(raw) {
    if (!raw || raw.schemaVersion !== 1 || typeof raw.records !== "object" || !raw.records || Array.isArray(raw.records)) throw new Error("Invalid progress");
    const output = fresh();
    output.updatedAt = Number.isFinite(raw.updatedAt) && raw.updatedAt >= 0 ? raw.updatedAt : 0;
    for (const [id, r] of Object.entries(raw.records)) {
      if (!byCard.has(id) || !r || typeof r !== "object") continue;
      const int = (name, max) => Number.isInteger(r[name]) && r[name] >= 0 ? Math.min(max, r[name]) : 0;
      const timestamp = name => Number.isFinite(r[name]) && r[name] >= 0 ? r[name] : 0;
      output.records[id] = { attempts: int("attempts", 1000000), correct: int("correct", 1000000), wrong: int("wrong", 1000000),
        streak: int("streak", 8), last: timestamp("last"), due: timestamp("due"), result: ["correct", "incorrect", "revealed"].includes(r.result) ? r.result : "incorrect",
        lastCorrectDay: /^\d{4}-\d{2}-\d{2}$/.test(r.lastCorrectDay) ? r.lastCorrectDay : "" };
    }
    for (const [id, text] of Object.entries(raw.notes || {})) if (byEntry.has(id) && typeof text === "string") output.notes[id] = text.slice(0, 3000);
    for (const [id, value] of Object.entries(raw.stars || {})) if (byEntry.has(id) && value === true) output.stars[id] = true;
    output.history = (Array.isArray(raw.history) ? raw.history : []).filter(h => h && byCard.has(h.id) && ["correct", "incorrect", "revealed"].includes(h.result) && Number.isFinite(h.at)).slice(-500)
      .map(h => ({ id: h.id, result: h.result, at: h.at }));
    const s = raw.session;
    if (s && Array.isArray(s.ids) && s.ids.length && s.ids.length <= 50 && new Set(s.ids).size === s.ids.length && s.ids.every(id => byCard.has(id) && !byCard.get(id).archived) && Number.isInteger(s.index) && s.index >= 0 && s.index < s.ids.length) {
      output.session = { ids: [...s.ids], index: s.index, elapsed: Number.isFinite(s.elapsed) && s.elapsed >= 0 ? Math.min(s.elapsed, 86400000) : 0,
        selection: typeof s.selection === "string" && byEntry.has(s.selection) ? s.selection : null,
        seed: Number.isInteger(s.seed) && s.seed >= 0 && s.seed <= 0xffffffff ? s.seed : 0,
        checked: s.checked === true, result: ["correct", "incorrect", "revealed"].includes(s.result) ? s.result : "revealed" };
    }
    const r = raw.lastRound;
    if (r && Array.isArray(r.ids) && r.ids.length && r.ids.length <= 50 && new Set(r.ids).size === r.ids.length && r.ids.every(id => byCard.has(id) && !byCard.get(id).archived) && Array.isArray(r.wrong)) {
      output.lastRound = { ids: [...r.ids], wrong: [...new Set(r.wrong.filter(id => r.ids.includes(id)))] };
    }
    return output;
  }
  async function restore() {
    try {
      database = await openDatabase();
      const stored = database ? await new Promise(resolve => {
        const request = database.transaction("progress", "readonly").objectStore("progress").get(KEY);
        request.onsuccess = () => resolve(request.result); request.onerror = () => { database = null; resolve(null); };
      }) : null;
      let local = null;
      try { const text = localStorage.getItem(KEY); if (text) local = JSON.parse(text); } catch (error) { if (!stored) throw error; }
      // An IndexedDB failure may have written a newer local fallback. Never
      // silently restore the older primary snapshot in that case.
      const raw = !stored || local && (local.updatedAt || 0) > (stored.updatedAt || 0) ? local : stored;
      if (raw) {
        state = safeState(raw);
        retiredSession = Boolean(raw.session?.ids?.some(id => byCard.get(id)?.archived));
        if (retiredSession) { save(); el("status").textContent = "本文再現クイズは終了しました。以前の正誤・メモは保持し、新しい意味4択で再開できます。"; }
      }
    }
    catch (_) { state = fresh(); el("status").textContent = "保存済み語彙記録を読み込めなかったため、新しく始めます。Reading・Writingの記録はそのままです。"; }
  }
  function buildCards() {
    cards = []; byCard.clear(); byEntry.clear();
    bank.entries.forEach((e, index) => {
      const list = [];
      const add = (mode, suffix, data, archived = false) => { const c = { id: `${e.id}|${suffix}`, entry: index, mode, archived, ...data }; if (!archived) { cards.push(c); list.push(c); } byCard.set(c.id, c); };
      if (e.contexts.length) add("context", "context", {}, true);
      for (const g of e.glosses) {
        const approved = e.quizGlosses.find(q => q.id === g.id);
        add("glossary", `g:${g.id}`, { gloss: approved || g }, !approved);
      }
      for (const d of e.dictionary) add("dictionary", `d:${d.sense}`, { sense: d.sense, lemma: d.lemma });
      byEntry.set(e.id, { e, index, cards: list });
      searchIndex[index] = normalize([e.term, ...e.glosses.map(g => g.text), ...e.dictionary.map(d => bank.senses[d.sense].definition)].join(" "));
    });
  }
  const record = c => state.records[c.id];
  const confirmed = c => record(c)?.result === "correct";
  const mastered = c => confirmed(c) && record(c).streak >= 2;
  const hasWrong = e => byEntry.get(e.id).cards.some(c => record(c) && !confirmed(c));
  const known = e => byEntry.get(e.id).cards.length > 0 && byEntry.get(e.id).cards.every(confirmed);
  function stats() {
    const total = bank.stats;
    const meaning = cards;
    el("stats").replaceChildren();
    for (const [value, caption, detail] of [
      [number(total.entries), "収録した語形・表現", `${number(total.wordForms)}語形・${number(total.phrases)}表現`],
      [number(meaning.length), "本文なしで解ける意味4択", `日本語 ${number(total.quizGlossaryCards)}問・英英 ${number(total.dictionaryCards)}問`],
      [`${number(meaning.filter(confirmed).length)} / ${number(meaning.length)}`, "意味を確認", `別日の復習で定着: ${number(meaning.filter(mastered).length)}問`],
      [number(total.readingQuestions + total.writingExercises), "対応するReading・Writing", `Reading ${number(total.readingQuestions)}問・Writing ${number(total.writingExercises)}演習`]
    ]) {
      const tile = node("div", "", "vocabulary-stat"); tile.append(node("strong", value), node("span", caption), node("small", detail)); el("stats").append(tile);
    }
    el("coverage-note").textContent = bank.coverageNote + ` 教材内の${number(total.textFields)}テキスト欄を照合。日本語の説明がある${number(total.glossaryEntries)}項目、英英説明がある${number(total.dictionaryEntries)}項目、意味の説明がない${number(total.contextOnly)}項目。`;
  }
  function matches(e, i) {
    const scope = el("scope").value, filter = el("filter").value;
    if (selectedSource !== null && !bank.documents[selectedSource].terms.includes(i)) return false;
    if (scope !== "all" && !e.sources.some(n => bank.documents[n].category === scope)) return false;
    if (normalize(el("search").value) && !searchIndex[i].includes(normalize(el("search").value))) return false;
    if (filter === "unseen" && known(e)) return false;
    if (filter === "review" && !hasWrong(e)) return false;
    if (filter === "due" && !byEntry.get(e.id).cards.some(c => record(c) && record(c).due <= Date.now())) return false;
    if (filter === "known" && !known(e)) return false;
    if (filter === "star" && !state.stars[e.id]) return false;
    if (filter === "contextOnly" && byEntry.get(e.id).cards.length) return false;
    return true;
  }
  function filterEntries() {
    filtered = bank.entries.map((e, i) => i).filter(i => matches(bank.entries[i], i));
    // Frequency helps prioritize; a tie has a stable alphabetical order.
    const query = normalize(el("search").value);
    filtered.sort((a, b) => Number(bank.entries[b].term === query) - Number(bank.entries[a].term === query) || bank.entries[b].frequency - bank.entries[a].frequency || bank.entries[a].term.localeCompare(bank.entries[b].term));
    page = Math.min(page, Math.max(0, Math.ceil(filtered.length / PAGE) - 1));
    el("selection").textContent = selectedSource === null ? `現在の範囲: ${number(filtered.length)}語・表現` : `教材: ${bank.documents[selectedSource].title} · ${number(filtered.length)}語・表現`;
    el("clear-source").hidden = selectedSource === null;
  }
  function marked(c) {
    const p = node("blockquote", "", "vocabulary-example");
    p.append(document.createTextNode(c.text.slice(0, c.start)), node("mark", c.text.slice(c.start, c.end)), document.createTextNode(c.text.slice(c.end)));
    return p;
  }
  function sourceButton(n) {
    const doc = bank.documents[n], button = node("button", `${doc.category} · ${doc.title}`, "toefl-button toefl-button--ghost");
    button.type = "button"; button.dataset.vocabularySource = n; return button;
  }
  function openMaterial(n) {
    const doc = bank.documents[n]; let opened = false;
    if (doc.engine === "reading") opened = window.ToeflReadingLab?.startSelection(doc.groupId, [doc.id], { vocabulary: true });
    else if (doc.engine === "writing") opened = window.ToeflWritingLab?.startSelection([doc.id], { vocabulary: true });
    else if (doc.sourceUrl && doc.sourceUrl.startsWith("/posts/")) { const a = node("a"); a.href = `${root.dataset.basePath || "/my-physics-lab/"}${doc.sourceUrl.slice(1)}`; a.target = "_blank"; a.rel = "noopener noreferrer"; document.body.append(a); a.click(); a.remove(); opened = true; }
    if (!opened) el("status").textContent = "この資料は通常演習またはガイドにあります。Reading・Writing教材は読み込み完了後に開けます。";
  }
  function detail(e, index) {
    const body = node("div");
    const glossList = node("ul");
    for (const g of e.glosses) {
      const li = node("li", g.text); li.append(node("small", g.kind === "editor" ? "編集補足" : `教材語注 · ${bank.documents[g.source].title}`)); glossList.append(li);
    }
    if (e.glosses.length) body.append(node("h4", "日本語の語注"), glossList);
    if (e.dictionary.length) {
      const dictionary = node("details"), list = node("ul"); dictionary.append(node("summary", `英英辞書の語義候補 · ${e.dictionary.length}件`), node("p", bank.dictionarySource.note, "vocabulary-meta"));
      for (const d of e.dictionary) { const s = bank.senses[d.sense]; list.append(node("li", `${({ n: "noun", v: "verb", a: "adjective", r: "adverb" })[s.pos]} · ${d.lemma}: ${s.definition}`)); }
      dictionary.append(list); body.append(dictionary);
    }
    if (!byEntry.get(e.id).cards.length) body.append(node("p", "意味未登録・出題待ち。固有名詞・略語なども索引に残しています。意味のクイズを作れる定義が確定してから出題します。"));
    for (const c of e.contexts) { body.append(marked(c), node("small", `${bank.documents[c.source].title} · ${bank.fieldLabels[c.field] || c.field}`)); }
    const actions = node("div", "", "toefl-actions");
    for (const [mode, caption] of [["glossary", "日本語の意味をクイズ"], ["dictionary", "英語の定義をクイズ"]]) {
      if (!byEntry.get(e.id).cards.some(c => c.mode === mode)) continue;
      const b = node("button", caption, "toefl-button toefl-button--secondary"); b.type = "button"; b.dataset.vocabularyEntryQuiz = index; b.dataset.mode = mode; actions.append(b);
    }
    const star = node("button", state.stars[e.id] ? "★ お気に入り解除" : "☆ お気に入り", "toefl-button toefl-button--ghost"); star.type = "button"; star.dataset.vocabularyStar = index; star.setAttribute("aria-pressed", Boolean(state.stars[e.id])); actions.append(star); body.append(actions);
    const label = node("label", "自分のメモ"), memo = node("textarea"); memo.maxLength = 3000; memo.value = state.notes[e.id] || ""; memo.dataset.vocabularyMemo = index; label.append(memo); body.append(label);
    const sources = node("details"); sources.append(node("summary", `出現教材・問題 ${number(e.sources.length)}件（全件）`));
    // Render references in chunks when expanded; common words have thousands.
    let count = 0;
    const container = node("div", "", "vocabulary-sources"), more = node("button", "次の20出典", "toefl-button toefl-button--secondary"); more.type = "button";
    const add = () => { for (const n of e.sources.slice(count, count + 20)) container.append(sourceButton(n)); count += 20; more.hidden = count >= e.sources.length; };
    sources.addEventListener("toggle", () => { if (sources.open && !count) add(); }); more.addEventListener("click", add); sources.append(container, more); body.append(sources);
    return body;
  }
  function renderBook() {
    const list = el("list"); list.replaceChildren();
    el("book-total").textContent = `${number(filtered.length)}語・表現 · 語形違いも残しています。開くと意味・用例・メモ・出典を表示します。`;
    for (const i of filtered.slice(page * PAGE, (page + 1) * PAGE)) {
      const e = bank.entries[i], card = node("details", "", "vocabulary-entry"), summary = node("summary"); summary.append(node("strong", e.term));
      const listCards = byEntry.get(e.id).cards;
      summary.append(node("small", `${e.quizGlosses.length ? "日本語語注あり" : e.dictionary.length ? "英英説明あり" : "意味未登録・出題待ち"} · ${number(e.sources.length)}出典 · 確認 ${listCards.filter(confirmed).length}/${listCards.length}${state.stars[e.id] ? " · ★" : ""}`));
      card.append(summary); let filled = false;
      card.addEventListener("toggle", () => { if (card.open && !filled) { card.append(detail(e, i)); filled = true; } }); list.append(card);
    }
    el("page").textContent = `${filtered.length ? page + 1 : 0} / ${Math.ceil(filtered.length / PAGE)}`;
    el("prev-page").disabled = page === 0; el("next-page").disabled = (page + 1) * PAGE >= filtered.length;
  }
  function renderHistory() {
    const list = el("history"); list.replaceChildren();
    for (const h of state.history.slice(-30).reverse()) {
      const c = byCard.get(h.id); list.append(node("li", `${new Date(h.at).toLocaleString()} · ${bank.entries[c.entry].term} · ${({ glossary: "語注", dictionary: "英英", context: "文脈" })[c.mode]} · ${({ correct: "正解", incorrect: "誤答", revealed: "答えを見た" })[h.result]}`));
    }
    el("resume").hidden = !state.session;
  }
  function renderCoverage() {
    const query = normalize(el("source-search").value), scope = el("scope").value;
    const docs = bank.documents.map((d, n) => ({ d, n })).filter(({ d }) => (scope === "all" || d.category === scope) && (!query || normalize(d.title + " " + d.id + " " + d.sourceRefs.join(" ")).includes(query)));
    el("source-list").replaceChildren();
    el("source-total").textContent = `${number(docs.length)}教材・問題 · ページ ${docs.length ? sourcePage + 1 : 0}`;
    for (const { d, n } of docs.slice(sourcePage * 20, (sourcePage + 1) * 20)) {
      const row = node("article", "", "vocabulary-source-row"); row.append(node("h4", d.title), node("small", `${d.category} · ${d.id} · ${d.sourceRefs.join(" / ")}`, "vocabulary-meta"));
      const meaning = d.terms.flatMap(i => byEntry.get(bank.entries[i].id).cards);
      const missing = d.terms.filter(i => !byEntry.get(bank.entries[i].id).cards.length).length;
      row.append(node("p", `${number(d.terms.length)}語・表現 · 意味 ${number(meaning.filter(confirmed).length)}/${number(meaning.length)}問 · 意味未登録・出題待ち ${number(missing)}項目`));
      const progress = node("progress"); progress.max = Math.max(1, meaning.length); progress.value = meaning.filter(confirmed).length; progress.setAttribute("aria-label", "意味の確認率"); row.append(progress);
      const action = sourceButton(n); action.textContent = "この教材の全語彙を確認"; row.append(action);
      const open = node("button", "教材を開く", "toefl-button toefl-button--ghost"); open.type = "button"; open.dataset.vocabularyMaterial = n; row.append(open); el("source-list").append(row);
    }
    el("source-more").disabled = (sourcePage + 1) * 20 >= docs.length;
  }
  function pause() {
    if (activeStart !== null && state.session) state.session.elapsed += Math.max(0, Date.now() - activeStart);
    activeStart = null;
  }
  function setView(name) {
    pause();
    view = name;
    for (const v of ["book", "quiz", "coverage"]) { el(v).hidden = name !== v; root.querySelector(`[data-vocabulary-view="${v}"]`).setAttribute("aria-pressed", name === v); }
    if (name !== "quiz") { pause(); save(); }
    if (name === "book") renderBook();
    if (name === "coverage") renderCoverage();
    if (name === "quiz" && !el("runner").hidden && state.session) activeStart = Date.now();
  }
  function render() { filterEntries(); stats(); renderHistory(); if (view === "book") renderBook(); if (view === "coverage") renderCoverage(); queueInfo(); renderRound(); }
  function inMode(c, mode) {
    return mode === "learn" ? c.mode === "glossary" || !bank.entries[c.entry].quizGlosses.length : c.mode === mode;
  }
  function queueInfo() {
    const mode = el("mode").value, indices = new Set(filtered), list = cards.filter(c => inMode(c, mode) && indices.has(c.entry));
    el("queue-info").textContent = `${number(new Set(list.map(c => c.entry)).size)}語・表現が対象 · 意味4択 ${number(list.length)}問 · 確認済み ${number(list.filter(confirmed).length)}問。誤答・未確認を優先し、1回に同じ語は出ません。`;
    el("start").disabled = !list.length;
    el("start").textContent = `${el("batch").value}問を始める`;
    el("continue").textContent = `次の${el("batch").value}問へ`;
  }
  const hash = text => { let h = 2166136261; for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
  const answerText = c => c.mode === "glossary" ? c.gloss.text : bank.senses[c.sense].definition;
  function optionText(c, index) {
    if (index === c.entry) return answerText(c);
    const e = bank.entries[index];
    if (c.mode === "glossary") return e.quizGlosses[0]?.text || "";
    const definition = e.dictionary.find(d => bank.senses[d.sense].pos === bank.senses[c.sense].pos);
    return definition ? bank.senses[definition.sense].definition : "";
  }
  function choices(c) {
    const target = bank.entries[c.entry], targetSenses = new Set(target.dictionary.map(d => d.sense)), lemmas = new Set(target.dictionary.map(d => d.lemma));
    const glosses = new Set(target.quizGlosses.map(g => normalize(g.text))), seen = new Set([normalize(answerText(c))]);
    const candidates = [];
    const seed = state.session?.seed || 0;
    let start = hash(`${c.id}|${seed}`) % bank.entries.length;
    // Step one visits every entry even if the corpus length has common factors.
    // Corpus snapshots can grow on daily Writing publication.
    for (let k = 0; k < bank.entries.length && candidates.length < 3; k++) {
      const index = (start + k) % bank.entries.length, e = bank.entries[index];
      if (index === c.entry) continue;
      if (e.dictionary.some(d => targetSenses.has(d.sense) || lemmas.has(d.lemma)) || e.quizGlosses.some(g => glosses.has(normalize(g.text)))) continue;
      const text = normalize(optionText(c, index));
      if (!text || seen.has(text)) continue;
      if (normalize(answerText(c)).includes(e.term) || text.includes(target.term)) continue;
      if (target.dictionary.some(d => normalize(bank.senses[d.sense].definition) === text)) continue;
      // Function-word editorial notes sometimes have overlapping short glosses;
      // compare their complete explanations too, not just one output option.
      if (c.mode === "glossary" && target.quizGlosses.some(g => normalize(g.text).includes(text) || text.includes(normalize(g.text)))) continue;
      seen.add(text);
      candidates.push(index);
    }
    const all = [c.entry, ...candidates];
    all.sort((a, b) => hash(`${c.id}|${seed}|${bank.entries[a].id}`) - hash(`${c.id}|${seed}|${bank.entries[b].id}`));
    return all;
  }
  function current() { return state.session ? byCard.get(state.session.ids[state.session.index]) : null; }
  function renderTimer() {
    if (!state.session) return;
    const seconds = Math.floor((state.session.elapsed + (activeStart === null ? 0 : Math.max(0, Date.now() - activeStart))) / 1000);
    el("timer").textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  }
  function renderCard() {
    const c = current(); if (!c) return;
    const e = bank.entries[c.entry], s = state.session;
    el("runner").hidden = false; el("feedback").hidden = true; el("explanation").hidden = true; el("explanation").replaceChildren();
    el("round").hidden = true;
    el("question-count").textContent = `${s.index + 1} / ${s.ids.length}問`;
    el("run-progress").max = s.ids.length; el("run-progress").value = s.index + Number(s.checked);
    el("question-type").textContent = c.mode === "glossary" ? "Word → Japanese meaning · 日本語の意味" : "Word → English definition · 英語の定義";
    selectedChoice = s.selection; el("choices").replaceChildren();
    el("question").textContent = e.term; el("question").lang = "en";
    el("audio-status").textContent = "";
    el("speak").disabled = !("speechSynthesis" in window && "SpeechSynthesisUtterance" in window);
    if (el("speak").disabled) el("audio-status").textContent = "このブラウザは発音再生に対応していません。意味の練習は続けられます。";
    el("hint").textContent = c.mode === "glossary" ? "この語・表現の意味を選んでください。タップすると答えと解説を表示します。" : `${({ n: "noun · 名詞", v: "verb · 動詞", a: "adjective · 形容詞", r: "adverb · 副詞" })[bank.senses[c.sense].pos]}の意味として正しい定義を選んでください。`;
    for (const index of choices(c)) {
      const b = node("button", optionText(c, index), "vocabulary-choice"); b.type = "button"; b.dataset.vocabularyChoice = index; b.lang = c.mode === "glossary" ? "ja" : "en";
      b.setAttribute("aria-pressed", s.selection === bank.entries[index].id); b.disabled = s.checked;
      if (s.checked) { if (index === c.entry) b.dataset.result = "correct"; else if (s.selection === bank.entries[index].id) b.dataset.result = "incorrect"; }
      el("choices").append(b);
    }
    el("reveal").disabled = s.checked; el("next").disabled = !s.checked;
    if (s.checked) feedback(c, s.result);
    renderTimer(); (s.checked ? el("feedback") : el("question")).focus();
  }
  function start(ids) {
    if (!unlocked || !bank || !ids.length || ids.some(id => !byCard.has(id) || byCard.get(id).archived)) return false;
    pause(); state.lastRound = null; state.session = { ids: [...new Set(ids)].slice(0, 50), index: 0, elapsed: 0, selection: null, seed: Math.floor(Math.random() * 0x100000000), checked: false, result: "revealed" };
    setView("quiz"); activeStart = Date.now(); renderCard(); save(); el("resume").hidden = false; el("runner").scrollIntoView({ behavior: "smooth", block: "start" }); return true;
  }
  function startBatch() {
    filterEntries(); const allowed = new Set(filtered), mode = el("mode").value;
    const priority = c => !record(c) ? 1 : !confirmed(c) ? 0 : record(c).due <= Date.now() ? 2 : 3;
    const list = cards.filter(c => inMode(c, mode) && allowed.has(c.entry));
    list.sort((a, b) => priority(a) - priority(b) || (priority(a) === 3 ? record(a).due - record(b).due : 0) || bank.entries[b.entry].frequency - bank.entries[a.entry].frequency || a.id.localeCompare(b.id));
    const seen = new Set(), batch = [];
    for (const c of list) { if (!seen.has(c.entry)) { seen.add(c.entry); batch.push(c.id); } if (batch.length >= Number(el("batch").value)) break; }
    start(batch);
  }
  function feedback(c, result) {
    const e = bank.entries[c.entry]; el("feedback").hidden = false; el("feedback").dataset.result = result;
    el("feedback").textContent = `${result === "correct" ? "✓ 正解" : result === "incorrect" ? "もう一度覚えよう" : "答えを確認・要復習"} · ${e.term}`;
    el("explanation").hidden = false; el("explanation").replaceChildren();
    el("explanation").append(node("p", answerText(c), "vocabulary-answer-meaning"));
    if (c.mode === "glossary") {
      if (c.gloss.english) el("explanation").append(node("p", c.gloss.english));
      el("explanation").append(node("p", "Say the word aloud, then recall its meaning without looking. Try using it in one short sentence. 声に出してから、答えを隠して意味を思い出しましょう。短い例文を一つ作ると使い方も確認できます。"));
    }
    if (c.mode === "dictionary") {
      el("explanation").append(node("p", `Base form: ${c.lemma} · ${({ n: "noun · 名詞", v: "verb · 動詞", a: "adjective · 形容詞", r: "adverb · 副詞" })[bank.senses[c.sense].pos]}`));
      if (e.quizGlosses.length) el("explanation").append(node("p", `日本語の語注（別の語義を含む場合あり）: ${e.quizGlosses.map(g => g.text).join(" / ")}`));
      el("explanation").append(node("p", "Learn this dictionary meaning as one possible sense of the word. It need not be the meaning in every example. 語義（sense）は一つの意味・用法です。例文では品詞と文脈も確認しましょう。"), node("p", bank.dictionarySource.note, "vocabulary-meta"));
    }
    if (e.contexts[0]) { const examples = node("details"); examples.append(node("summary", "用例を見る（任意）"), marked(e.contexts[0])); el("explanation").append(examples); }
    const open = node("button", "この語を単語帳で見る", "toefl-button toefl-button--secondary"); open.type = "button"; open.dataset.vocabularyLookup = c.entry; el("explanation").append(open);
  }
  function grade(reveal = false) {
    const c = current(), s = state.session; if (!c || !s || s.checked) return;
    const e = bank.entries[c.entry];
    if (!reveal && (selectedChoice === null || !choices(c).some(index => bank.entries[index].id === selectedChoice))) return;
    const result = reveal ? "revealed" : selectedChoice === e.id ? "correct" : "incorrect";
    const old = record(c) || { attempts: 0, correct: 0, wrong: 0, streak: 0, lastCorrectDay: "" }, correct = result === "correct";
    const streak = correct ? old.lastCorrectDay === day() ? Math.max(1, old.streak) : Math.min(8, old.streak + 1) : 0;
    state.records[c.id] = { attempts: old.attempts + 1, correct: old.correct + Number(correct), wrong: old.wrong + Number(!correct),
      result, streak, lastCorrectDay: correct ? day() : old.lastCorrectDay, last: Date.now(), due: Date.now() + (correct ? [0, 1, 3, 7, 14, 30, 60, 90, 120][streak] : 0) * 86400000 };
    state.history.push({ id: c.id, result, at: Date.now() }); state.history = state.history.slice(-500);
    s.checked = true; s.result = result; s.selection = selectedChoice;
    save(); renderCard();
  }
  function next() {
    const s = state.session; if (!s || !s.checked) return;
    if (s.index + 1 < s.ids.length) { s.index++; s.checked = false; s.selection = null; renderCard(); save(); }
    else { pause(); state.lastRound = { ids: [...s.ids], wrong: s.ids.filter(id => state.records[id]?.result !== "correct") }; state.session = null; el("runner").hidden = true; render(); save(); }
  }
  function renderRound() {
    const r = state.lastRound; el("round").hidden = !r || !el("runner").hidden;
    if (!r) return;
    el("round-title").textContent = `${r.ids.length}問、お疲れさまでした · 正解 ${r.ids.length - r.wrong.length} / ${r.ids.length}`;
    el("round-words").replaceChildren();
    for (const id of r.wrong) { const c = byCard.get(id); el("round-words").append(node("li", `${bank.entries[c.entry].term} — ${answerText(c)}`)); }
    if (!r.wrong.length) el("round-words").append(node("li", "すべて正解！次の単語へ進むか、別の日にもう一度復習しましょう。"));
    el("retry").hidden = !r.wrong.length;
  }
  function speak() {
    const c = current(); if (!c || el("speak").disabled) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new window.SpeechSynthesisUtterance(bank.entries[c.entry].term); utterance.lang = "en-US"; utterance.rate = 0.85;
      const voice = window.speechSynthesis.getVoices().find(v => /^en[-_]/i.test(v.lang)); if (voice) utterance.voice = voice;
      utterance.onerror = () => { el("audio-status").textContent = "発音を再生できませんでした。端末の英語音声・音量設定を確認してください。"; };
      window.speechSynthesis.speak(utterance); el("audio-status").textContent = "端末の英語音声で再生します。";
    } catch (_) { el("audio-status").textContent = "発音を再生できませんでした。意味の練習は続けられます。"; }
  }
  function validatePayload(p) {
    if (!p || p.schemaVersion !== 1 || p.quizPolicy !== "standalone-word-to-meaning-v2" || !Array.isArray(p.entries) || !p.entries.length || !Array.isArray(p.documents) || !p.senses || !p.stats) throw new Error("Invalid bank");
    const ids = new Set();
    for (const e of p.entries) {
      if (typeof e.id !== "string" || ids.has(e.id) || typeof e.term !== "string" || !e.term || !Array.isArray(e.sources) || !Array.isArray(e.contexts) || !Array.isArray(e.glosses) || !Array.isArray(e.quizGlosses) || !Array.isArray(e.dictionary)) throw new Error("Invalid entry"); ids.add(e.id);
      if (e.sources.some(n => !Number.isInteger(n) || !p.documents[n])) throw new Error("Invalid source");
      if (e.contexts.some(c => typeof c.text !== "string" || !Number.isInteger(c.start) || !Number.isInteger(c.end) || c.start < 0 || c.end <= c.start || normalize(c.text.slice(c.start, c.end)) !== normalize(e.term) || !p.documents[c.source])) throw new Error("Invalid context");
      if (e.dictionary.some(d => !p.senses[d.sense] || typeof p.senses[d.sense].definition !== "string")) throw new Error("Invalid sense");
      if (e.glosses.some(g => typeof g.text !== "string" || typeof g.id !== "string" || g.kind === "material" && !p.documents[g.source])) throw new Error("Invalid gloss");
      if (e.quizGlosses.some(g => typeof g.text !== "string" || !g.text || typeof g.english !== "string" || !e.glosses.some(old => old.id === g.id))) throw new Error("Invalid quiz gloss");
    }
  }
  async function load() {
    if (!unlocked || bank || loading) return;
    loading = true; el("load").disabled = true; el("status").textContent = "全教材の語彙索引を読み込んでいます。初回は少し時間がかかります…";
    try {
      const response = await fetch(root.dataset.bankUrl); if (!response.ok) throw new Error("Vocabulary unavailable"); const payload = await response.json(); validatePayload(payload);
      bank = payload; buildCards(); await restore(); el("content").hidden = false; el("load").hidden = true;
      if (!retiredSession && !el("status").textContent.includes("読み込めなかった")) el("status").textContent = `${number(bank.stats.quizCards)}問の意味4択を読み込みました。本文を開かず、この画面だけで学べます。`;
      render();
    } catch (error) { console.warn("Vocabulary could not load", error); bank = null; el("status").textContent = "単語帳を読み込めませんでした。通信を確認して、再試行してください。"; el("load").disabled = false; el("load").textContent = "読み込みを再試行"; }
    finally { loading = false; }
  }
  el("load").addEventListener("click", load);
  document.addEventListener("toefl:unlocked", () => { unlocked = true; el("load").disabled = false; el("status").textContent = "「単語クイズを開く」から始められます。初回の読み込みは少し時間がかかります。"; if (location.hash === "#vocabulary-lab") load(); });
  window.addEventListener("hashchange", () => { if (location.hash === "#vocabulary-lab") load(); });
  for (const name of ["search", "scope", "filter"]) el(name).addEventListener(name === "search" ? "input" : "change", () => { if (!bank) return; page = 0; sourcePage = 0; render(); });
  el("mode").addEventListener("change", queueInfo); el("batch").addEventListener("change", queueInfo); el("start").addEventListener("click", startBatch);
  el("continue").addEventListener("click", startBatch); el("retry").addEventListener("click", () => { if (state.lastRound?.wrong.length) start(state.lastRound.wrong); });
  el("speak").addEventListener("click", speak);
  el("resume").addEventListener("click", () => { if (!state.session) return; setView("quiz"); activeStart = Date.now(); renderCard(); });
  el("reveal").addEventListener("click", () => grade(true)); el("next").addEventListener("click", next);
  el("close").addEventListener("click", () => { pause(); el("runner").hidden = true; save(); render(); });
  el("prev-page").addEventListener("click", () => { page--; renderBook(); }); el("next-page").addEventListener("click", () => { page++; renderBook(); });
  el("source-search").addEventListener("input", () => { sourcePage = 0; renderCoverage(); }); el("source-more").addEventListener("click", () => { sourcePage++; renderCoverage(); });
  el("clear-source").addEventListener("click", () => { selectedSource = null; page = 0; render(); });
  root.addEventListener("input", event => { const target = event.target.closest("[data-vocabulary-memo]"); if (target) { const e = bank.entries[Number(target.dataset.vocabularyMemo)]; state.notes[e.id] = target.value.slice(0, 3000); save(); } });
  root.addEventListener("click", event => {
    if (!bank) return;
    const b = event.target.closest("button"); if (!b) return;
    if (b.dataset.vocabularyView) setView(b.dataset.vocabularyView);
    if (b.dataset.vocabularyChoice !== undefined && state.session && !state.session.checked) { const index = Number(b.dataset.vocabularyChoice); if (choices(current()).includes(index)) { selectedChoice = bank.entries[index].id; state.session.selection = selectedChoice; grade(); } }
    if (b.dataset.vocabularyEntryQuiz !== undefined) { const e = bank.entries[Number(b.dataset.vocabularyEntryQuiz)]; start(byEntry.get(e.id).cards.filter(c => c.mode === b.dataset.mode).map(c => c.id)); }
    if (b.dataset.vocabularyStar !== undefined) { const e = bank.entries[Number(b.dataset.vocabularyStar)]; state.stars[e.id] = !state.stars[e.id]; b.textContent = state.stars[e.id] ? "★ お気に入り解除" : "☆ お気に入り"; b.setAttribute("aria-pressed", state.stars[e.id]); save(); }
    if (b.dataset.vocabularyLookup !== undefined) { pause(); selectedSource = null; el("search").value = bank.entries[Number(b.dataset.vocabularyLookup)].term; el("filter").value = "all"; el("scope").value = "all"; page = 0; filterEntries(); setView("book"); el("book").scrollIntoView({ behavior: "smooth" }); }
    if (b.dataset.vocabularySource !== undefined) { selectedSource = Number(b.dataset.vocabularySource); el("scope").value = "all"; el("search").value = ""; el("filter").value = "all"; page = 0; filterEntries(); setView("book"); el("book").scrollIntoView({ behavior: "smooth" }); }
    if (b.dataset.vocabularyMaterial !== undefined) openMaterial(Number(b.dataset.vocabularyMaterial));
  });
  el("export").addEventListener("click", () => { pause(); save(); const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: "application/json;charset=utf-8" })), a = node("a"); a.href = url; a.download = `toefl-vocabulary-${day()}.json`; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); if (!el("runner").hidden && view === "quiz") activeStart = Date.now(); });
  el("import").addEventListener("change", async () => {
    const file = el("import").files[0]; if (!file) return;
    try { if (file.size > 60000000) throw new Error("File too large"); const imported = safeState(JSON.parse(await file.text())); pause(); state = imported; el("runner").hidden = true; save(); render(); el("status").textContent = "語彙記録を読み込みました。Reading・Writingの記録はそのままです。"; }
    catch (_) { el("status").textContent = "このファイルは語彙の学習記録として読み込めませんでした。今の記録は保持しています。"; } el("import").value = "";
  });
  el("reset").addEventListener("click", () => { el("reset-confirm").hidden = false; }); el("reset-no").addEventListener("click", () => { el("reset-confirm").hidden = true; });
  el("reset-yes").addEventListener("click", () => { pause(); state = fresh(); el("runner").hidden = true; el("reset-confirm").hidden = true; save(); render(); });
  window.addEventListener("pagehide", () => { if (bank) { pause(); save(); } });
  window.ToeflVocabularyLab = Object.freeze({ getBank: () => bank, getCards: () => cards.map(c => ({ ...c })),
    startCards: ids => start(ids), getProgress: () => JSON.parse(JSON.stringify(state)) });
  setInterval(renderTimer, 1000);
})();
