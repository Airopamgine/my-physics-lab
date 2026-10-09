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
  const fresh = () => ({ schemaVersion: 1, updatedAt: 0, records: {}, notes: {}, stars: {}, history: [], session: null });
  let bank = null, state = fresh(), unlocked = false, loading = false, page = 0, sourcePage = 0, selectedSource = null;
  let cards = [], byCard = new Map(), byEntry = new Map(), searchIndex = [], filtered = [], selectedChoice = null;
  let activeStart = null, storageFailed = false, view = "book";
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
      // IndexedDB has room for the complete 70k+ card history. Transactions are
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
    if (s && Array.isArray(s.ids) && s.ids.length && s.ids.length <= 50 && new Set(s.ids).size === s.ids.length && s.ids.every(id => byCard.has(id)) && Number.isInteger(s.index) && s.index >= 0 && s.index < s.ids.length) {
      output.session = { ids: [...s.ids], index: s.index, elapsed: Number.isFinite(s.elapsed) && s.elapsed >= 0 ? Math.min(s.elapsed, 86400000) : 0,
        draft: typeof s.draft === "string" ? s.draft.slice(0, 300) : "", selection: Number.isInteger(s.selection) && s.selection >= 0 && s.selection < bank.entries.length ? s.selection : null,
        checked: s.checked === true, result: ["correct", "incorrect", "revealed"].includes(s.result) ? s.result : "revealed" };
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
      if (raw) state = safeState(raw);
    }
    catch (_) { state = fresh(); el("status").textContent = "保存済み語彙記録を読み込めなかったため、新しく始めます。Reading・Writingの記録はそのままです。"; }
  }
  function buildCards() {
    cards = []; byCard.clear(); byEntry.clear();
    bank.entries.forEach((e, index) => {
      const list = [];
      const add = (mode, suffix, data) => { const c = { id: `${e.id}|${suffix}`, entry: index, mode, ...data }; cards.push(c); list.push(c); byCard.set(c.id, c); };
      if (e.contexts.length) add("context", "context", { context: e.contexts[0] });
      for (const g of e.glosses) add("glossary", `g:${g.id}`, { gloss: g });
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
    const context = cards.filter(c => c.mode === "context"), meaning = cards.filter(c => c.mode !== "context");
    el("stats").replaceChildren();
    for (const [value, caption, detail] of [
      [number(total.entries), "収録した語形・表現", `${number(total.wordForms)}語形・${number(total.phrases)}表現`],
      [`${number(context.filter(confirmed).length)} / ${number(context.length)}`, "文脈・綴りを確認", `別日の復習で定着: ${number(context.filter(mastered).length)}枚`],
      [`${number(meaning.filter(confirmed).length)} / ${number(meaning.length)}`, "意味カードを確認", `別日の復習で定着: ${number(meaning.filter(mastered).length)}枚`],
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
    if (filter === "contextOnly" && (e.glosses.length || e.dictionary.length)) return false;
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
    if (!e.glosses.length && !e.dictionary.length) body.append(node("p", "固有名詞・略語・未収録語など。意味の説明は未登録です。教材の綴り・用例を確認できます。意味を知っていると判定しません。"));
    for (const c of e.contexts) { body.append(marked(c), node("small", `${bank.documents[c.source].title} · ${bank.fieldLabels[c.field] || c.field}`)); }
    const actions = node("div", "", "toefl-actions");
    for (const [mode, caption] of [["glossary", "語注をクイズ"], ["dictionary", "英英をクイズ"], ["context", "文脈をクイズ"]]) {
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
      summary.append(node("small", `${e.glosses.length ? "日本語語注あり" : e.dictionary.length ? "英英説明あり" : "文脈のみ"} · ${number(e.sources.length)}出典 · 確認 ${listCards.filter(confirmed).length}/${listCards.length}${state.stars[e.id] ? " · ★" : ""}`));
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
      const context = d.terms.flatMap(i => byEntry.get(bank.entries[i].id).cards.filter(c => c.mode === "context"));
      const meaning = d.terms.flatMap(i => byEntry.get(bank.entries[i].id).cards.filter(c => c.mode !== "context"));
      const missing = d.terms.filter(i => !bank.entries[i].dictionary.length && !bank.entries[i].glosses.length).length;
      row.append(node("p", `${number(d.terms.length)}語・表現 · 文脈 ${number(context.filter(confirmed).length)}/${number(context.length)}枚 · 意味 ${number(meaning.filter(confirmed).length)}/${number(meaning.length)}枚 · 意味の説明なし ${number(missing)}項目`));
      const progress = node("progress"); progress.max = Math.max(1, context.length); progress.value = context.filter(confirmed).length; progress.setAttribute("aria-label", "文脈・綴りの確認率"); row.append(progress);
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
    view = name;
    for (const v of ["book", "quiz", "coverage"]) { el(v).hidden = name !== v; root.querySelector(`[data-vocabulary-view="${v}"]`).setAttribute("aria-pressed", name === v); }
    if (name !== "quiz") { pause(); save(); }
    if (name === "book") renderBook();
    if (name === "coverage") renderCoverage();
    if (name === "quiz" && !el("runner").hidden && state.session) activeStart = Date.now();
  }
  function render() { filterEntries(); stats(); renderHistory(); if (view === "book") renderBook(); if (view === "coverage") renderCoverage(); queueInfo(); }
  function queueInfo() {
    const mode = el("mode").value, indices = new Set(filtered), list = cards.filter(c => c.mode === mode && indices.has(c.entry));
    el("queue-info").textContent = `${number(list.length)}枚が対象 · 確認済み ${number(list.filter(confirmed).length)}枚 · 未確認と復習を優先して、重複なく順に出題します。`;
    el("start").disabled = !list.length;
  }
  const hash = text => { let h = 2166136261; for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
  function choices(c) {
    const target = bank.entries[c.entry], targetSenses = new Set(target.dictionary.map(d => d.sense)), lemmas = new Set(target.dictionary.map(d => d.lemma));
    const glosses = new Set(target.glosses.map(g => normalize(g.text)));
    const candidates = [];
    let start = hash(c.id) % bank.entries.length;
    for (let k = 0; k < bank.entries.length && candidates.length < 3; k++) {
      const index = (start + k * (bank.entries.length % 37 === 0 ? 1 : 37)) % bank.entries.length, e = bank.entries[index];
      if (index === c.entry || candidates.includes(index) || !e.glosses.length && !e.dictionary.length || e.term.includes(" ") !== target.term.includes(" ")) continue;
      if (e.dictionary.some(d => targetSenses.has(d.sense) || lemmas.has(d.lemma)) || e.glosses.some(g => glosses.has(normalize(g.text)))) continue;
      const definition = c.mode === "glossary" ? c.gloss.text : bank.senses[c.sense].definition;
      // Exclude any candidate explicitly named by the definition or any target
      // appearing in the candidate's gloss; synonyms are never distractors.
      if (normalize(definition).includes(e.term) || e.glosses.some(g => normalize(g.text).includes(target.term))) continue;
      if (c.mode === "dictionary" && e.dictionary.some(d => bank.senses[d.sense].definition === definition)) continue;
      candidates.push(index);
    }
    const all = [c.entry, ...candidates];
    all.sort((a, b) => hash(c.id + bank.entries[a].id) - hash(c.id + bank.entries[b].id));
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
    el("question-count").textContent = `${s.index + 1} / ${s.ids.length}枚`;
    el("question-type").textContent = ({ glossary: "Meaning · 教材語注／編集補足", dictionary: "Meaning · 英英辞書の語義", context: "Source form · 教材の文脈と綴り" })[c.mode];
    selectedChoice = s.selection; el("choices").replaceChildren();
    el("answer").value = s.draft; el("answer").hidden = c.mode !== "context"; el("input-label").hidden = c.mode !== "context";
    if (c.mode === "context") {
      const quote = c.context; el("question").textContent = quote.text.slice(0, quote.start) + "［　　］" + quote.text.slice(quote.end);
      el("hint").textContent = `語頭: ${e.term[0]} · 掲載形の長さ: ${[...e.term].length}文字（空白・ハイフンも含む）。${bank.documents[quote.source].title} · ${bank.fieldLabels[quote.field] || quote.field}。教材に書かれた形を再現してください。`;
    } else {
      el("question").textContent = c.mode === "glossary" ? c.gloss.text : bank.senses[c.sense].definition;
      el("hint").textContent = c.mode === "glossary" ? (c.gloss.kind === "editor" ? "編集補足の説明をもつ掲載語・表現を選びます。" : `教材語注 · ${bank.documents[c.gloss.source].title}。この説明をもつ掲載語・表現を選びます。`) : `WordNet 3.0 · ${({ n: "名詞 noun", v: "動詞 verb", a: "形容詞 adjective", r: "副詞 adverb" })[bank.senses[c.sense].pos]}。この辞書語義をもつ掲載語を選びます。教材での意味を自動判定した問題ではありません。`;
      for (const index of choices(c)) { const b = node("button", bank.entries[index].term, "vocabulary-choice"); b.type = "button"; b.dataset.vocabularyChoice = index; b.setAttribute("aria-pressed", s.selection === index); b.disabled = s.checked; el("choices").append(b); }
    }
    el("answer").disabled = s.checked; el("check").disabled = s.checked || (c.mode === "context" ? !normalize(s.draft) : selectedChoice === null);
    el("reveal").disabled = s.checked; el("next").disabled = !s.checked;
    if (s.checked) feedback(c, s.result);
    renderTimer(); el("question").focus();
  }
  function start(ids) {
    if (!unlocked || !bank || !ids.length || ids.some(id => !byCard.has(id))) return false;
    pause(); state.session = { ids: [...new Set(ids)].slice(0, 50), index: 0, elapsed: 0, draft: "", selection: null, checked: false, result: "revealed" };
    setView("quiz"); activeStart = Date.now(); renderCard(); save(); el("resume").hidden = false; el("runner").scrollIntoView({ behavior: "smooth", block: "start" }); return true;
  }
  function startBatch() {
    filterEntries(); const allowed = new Set(filtered), mode = el("mode").value;
    const priority = c => !record(c) ? 1 : !confirmed(c) ? 0 : record(c).due <= Date.now() ? 2 : 3;
    const list = cards.filter(c => c.mode === mode && allowed.has(c.entry));
    list.sort((a, b) => priority(a) - priority(b) || (priority(a) === 3 ? record(a).due - record(b).due : 0) || bank.entries[b.entry].frequency - bank.entries[a.entry].frequency || a.id.localeCompare(b.id));
    start(list.slice(0, Number(el("batch").value)).map(c => c.id));
  }
  function feedback(c, result) {
    const e = bank.entries[c.entry]; el("feedback").hidden = false; el("feedback").dataset.result = result;
    el("feedback").textContent = `${result === "correct" ? "正解" : result === "incorrect" ? "要復習" : "答えを確認・要復習"} · 掲載語: ${e.term}${c.mode === "context" ? "。教材の語形・綴りの確認です。" : "。意味の確認カードです。"}`;
    el("explanation").hidden = false; el("explanation").replaceChildren();
    if (c.mode === "glossary") el("explanation").append(node("p", c.gloss.text));
    if (c.mode === "dictionary") {
      el("explanation").append(node("p", `${c.lemma}: ${bank.senses[c.sense].definition}`), node("p", bank.dictionarySource.note, "vocabulary-meta"));
      if (e.glosses.length) el("explanation").append(node("p", `教材語注: ${e.glosses.map(g => g.text).join(" / ")}`));
    }
    if (e.contexts[0]) { el("explanation").append(marked(e.contexts[0]), sourceButton(e.contexts[0].source)); }
    const open = node("button", "この語を単語帳で見る", "toefl-button toefl-button--secondary"); open.type = "button"; open.dataset.vocabularyLookup = c.entry; el("explanation").append(open);
  }
  function grade(reveal = false) {
    const c = current(), s = state.session; if (!c || !s || s.checked) return;
    const e = bank.entries[c.entry];
    if (!reveal && (c.mode === "context" ? !normalize(el("answer").value) : selectedChoice === null)) return;
    const result = reveal ? "revealed" : (c.mode === "context" ? normalize(el("answer").value) === normalize(e.term) : selectedChoice === c.entry) ? "correct" : "incorrect";
    const old = record(c) || { attempts: 0, correct: 0, wrong: 0, streak: 0, lastCorrectDay: "" }, correct = result === "correct";
    const streak = correct ? old.lastCorrectDay === day() ? Math.max(1, old.streak) : Math.min(8, old.streak + 1) : 0;
    state.records[c.id] = { attempts: old.attempts + 1, correct: old.correct + Number(correct), wrong: old.wrong + Number(!correct),
      result, streak, lastCorrectDay: correct ? day() : old.lastCorrectDay, last: Date.now(), due: Date.now() + (correct ? [0, 1, 3, 7, 14, 30, 60, 90, 120][streak] : 0) * 86400000 };
    state.history.push({ id: c.id, result, at: Date.now() }); state.history = state.history.slice(-500);
    s.checked = true; s.result = result; s.draft = el("answer").value; s.selection = selectedChoice;
    save(); renderCard();
  }
  function next() {
    const s = state.session; if (!s || !s.checked) return;
    if (s.index + 1 < s.ids.length) { s.index++; s.checked = false; s.draft = ""; s.selection = null; renderCard(); save(); }
    else { pause(); const correct = s.ids.filter(id => state.records[id]?.result === "correct").length; state.session = null; el("runner").hidden = true; render(); save(); el("queue-info").textContent = `今回の${s.ids.length}枚を確認しました。正解 ${correct}枚、要復習 ${s.ids.length - correct}枚。次は残りの未確認・復習カードへ進みます。`; }
  }
  function validatePayload(p) {
    if (!p || p.schemaVersion !== 1 || !Array.isArray(p.entries) || !p.entries.length || !Array.isArray(p.documents) || !p.senses || !p.stats) throw new Error("Invalid bank");
    const ids = new Set();
    for (const e of p.entries) {
      if (typeof e.id !== "string" || ids.has(e.id) || typeof e.term !== "string" || !e.term || !Array.isArray(e.sources) || !Array.isArray(e.contexts) || !Array.isArray(e.glosses) || !Array.isArray(e.dictionary)) throw new Error("Invalid entry"); ids.add(e.id);
      if (e.sources.some(n => !Number.isInteger(n) || !p.documents[n])) throw new Error("Invalid source");
      if (e.contexts.some(c => typeof c.text !== "string" || !Number.isInteger(c.start) || !Number.isInteger(c.end) || c.start < 0 || c.end <= c.start || normalize(c.text.slice(c.start, c.end)) !== normalize(e.term) || !p.documents[c.source])) throw new Error("Invalid context");
      if (e.dictionary.some(d => !p.senses[d.sense] || typeof p.senses[d.sense].definition !== "string")) throw new Error("Invalid sense");
      if (e.glosses.some(g => typeof g.text !== "string" || typeof g.id !== "string" || g.kind === "material" && !p.documents[g.source])) throw new Error("Invalid gloss");
    }
  }
  async function load() {
    if (!unlocked || bank || loading) return;
    loading = true; el("load").disabled = true; el("status").textContent = "全教材の語彙索引を読み込んでいます。初回は少し時間がかかります…";
    try {
      const response = await fetch(root.dataset.bankUrl); if (!response.ok) throw new Error("Vocabulary unavailable"); const payload = await response.json(); validatePayload(payload);
      bank = payload; buildCards(); await restore(); el("content").hidden = false; el("load").hidden = true;
      if (!el("status").textContent.includes("読み込めなかった")) el("status").textContent = `全教材の${number(bank.stats.entries)}語形・表現を読み込みました。新しい教材の公開時にも索引を作り直します。`;
      render();
    } catch (error) { console.warn("Vocabulary could not load", error); bank = null; el("status").textContent = "単語帳を読み込めませんでした。通信を確認して、再試行してください。"; el("load").disabled = false; el("load").textContent = "読み込みを再試行"; }
    finally { loading = false; }
  }
  el("load").addEventListener("click", load);
  document.addEventListener("toefl:unlocked", () => { unlocked = true; el("load").disabled = false; el("status").textContent = "「単語帳を開く」から始められます。全教材を索引化したため、初回の読み込みは少し時間がかかります。"; if (location.hash === "#vocabulary-lab") load(); });
  window.addEventListener("hashchange", () => { if (location.hash === "#vocabulary-lab") load(); });
  for (const name of ["search", "scope", "filter"]) el(name).addEventListener(name === "search" ? "input" : "change", () => { if (!bank) return; page = 0; sourcePage = 0; render(); });
  el("mode").addEventListener("change", queueInfo); el("start").addEventListener("click", startBatch);
  el("resume").addEventListener("click", () => { if (!state.session) return; setView("quiz"); activeStart = Date.now(); renderCard(); });
  el("answer-form").addEventListener("submit", event => { event.preventDefault(); grade(); });
  el("answer").addEventListener("input", () => { if (!state.session || state.session.checked) return; state.session.draft = el("answer").value.slice(0, 300); el("check").disabled = !normalize(el("answer").value); save(); });
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
    if (b.dataset.vocabularyChoice !== undefined && state.session && !state.session.checked) { selectedChoice = Number(b.dataset.vocabularyChoice); state.session.selection = selectedChoice; for (const choice of el("choices").children) choice.setAttribute("aria-pressed", Number(choice.dataset.vocabularyChoice) === selectedChoice); el("check").disabled = false; save(); }
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
