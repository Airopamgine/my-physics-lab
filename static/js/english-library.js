(() => {
  "use strict";

  const root = document.getElementById("english-library");
  if (!root) return;

  const STORAGE_KEY = "mastersPhysicsLab.englishLibraryProgress.v1";
  const PAGE_SIZE = 18;
  const isReadingFeed = root.dataset.mode === "reading-feed";
  const isTaskCatalog = root.dataset.mode === "tasks";
  const normalizeAnswer = (value) => String(value).normalize("NFKC").trim().toLowerCase();
  const isAutoGraded = (question) => question.options.length > 0 || Array.isArray(question.acceptedAnswers);
  const COLLECTION_ORDER = [
    "Foundation Reading",
    "Standard Reading",
    "Academic Reading",
    "Advanced Reading",
    "Vocabulary"
  ];
  const elements = {
    totals: document.getElementById("library-totals"),
    progress: document.getElementById("library-progress"),
    attempted: document.getElementById("library-attempted"),
    mastered: document.getElementById("library-mastered"),
    reviewCount: document.getElementById("library-review-count"),
    controls: document.getElementById("library-controls"),
    search: document.getElementById("library-search"),
    collection: document.getElementById("library-collection"),
    level: document.getElementById("library-level"),
    status: document.getElementById("library-status"),
    grid: document.getElementById("library-grid"),
    more: document.getElementById("library-more"),
    runner: document.getElementById("library-runner"),
    questionCollection: document.getElementById("library-question-collection"),
    setTitle: document.getElementById("library-set-title"),
    questionCount: document.getElementById("library-question-count"),
    progressBar: document.getElementById("library-progress-bar"),
    questionLabel: document.getElementById("library-question-label"),
    questionContent: document.getElementById("library-question-content"),
    feedback: document.getElementById("library-feedback"),
    selfRating: document.getElementById("library-self-rating"),
    check: document.getElementById("library-check"),
    next: document.getElementById("library-next"),
    exit: document.getElementById("library-exit"),
    complete: document.getElementById("library-complete"),
    completeTitle: document.getElementById("library-complete-title"),
    completeScore: document.getElementById("library-complete-score"),
    completeMessage: document.getElementById("library-complete-message"),
    restart: document.getElementById("library-restart"),
    review: document.getElementById("library-review")
  };

  let bank = null;
  let hasLoaded = false;
  let visibleCount = PAGE_SIZE;
  let activeSet = null;
  let activeQueue = [];
  let currentIndex = 0;
  let selectedOption = null;
  let sessionMastered = 0;
  let progress = loadProgress();

  function loadProgress() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
      if (saved && typeof saved === "object" && saved.answers) return saved;
    } catch (error) {
      console.warn("Could not load English library progress", error);
    }
    return { answers: {} };
  }

  function saveProgress() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.warn("Could not save English library progress", error);
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function richText(value) {
    return escapeHtml(value)
      .replace(/`([^`\n]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
      .replace(/(^|\n)\s*[-*]\s+/g, "$1• ")
      .replace(/\n/g, "<br>");
  }

  function siteUrl(sourceUrl) {
    const base = (root.dataset.basePath || "/").replace(/\/$/, "");
    return `${base}/${String(sourceUrl).replace(/^\//, "")}`;
  }

  function isMastered(result) {
    return result === "correct" || result === "mastered";
  }

  function needsReview(result) {
    return result === "incorrect" || result === "review";
  }

  function setStats(set) {
    const attempts = set.questions
      .map((question) => progress.answers[question.id])
      .filter(Boolean);
    return {
      attempted: attempts.length,
      mastered: attempts.filter((attempt) => isMastered(attempt.result)).length,
      review: attempts.filter((attempt) => needsReview(attempt.result)).length
    };
  }

  function updateOverallProgress() {
    if (!bank) return;
    const knownIds = new Set(bank.sets.flatMap((set) => set.questions.map((question) => question.id)));
    const attempts = Object.entries(progress.answers)
      .filter(([id]) => knownIds.has(id))
      .map(([, attempt]) => attempt);
    elements.attempted.textContent = `${attempts.length}/${bank.questionCount}`;
    elements.mastered.textContent = String(attempts.filter((attempt) => isMastered(attempt.result)).length);
    elements.reviewCount.textContent = String(attempts.filter((attempt) => needsReview(attempt.result)).length);
  }

  function filteredSets() {
    if (!bank) return [];
    const query = elements.search.value.trim().toLocaleLowerCase("ja");
    const collection = elements.collection.value;
    const level = elements.level.value;
    return bank.sets
      .filter((set) => collection === "All" || set.collection === collection)
      .filter((set) => level === "All" || set.level === level)
      .filter((set) => {
        if (!query) return true;
        const searchable = `${set.title} ${set.collection} ${set.level} ${set.id}`.toLocaleLowerCase("ja");
        return searchable.includes(query);
      })
      .sort((a, b) => {
        if (isReadingFeed || isTaskCatalog) return Date.parse(b.date) - Date.parse(a.date);
        const collectionDifference = COLLECTION_ORDER.indexOf(a.collection) - COLLECTION_ORDER.indexOf(b.collection);
        if (collectionDifference) return collectionDifference;
        return a.title.localeCompare(b.title, "ja");
      });
  }

  function renderLibrary() {
    const sets = filteredSets();
    const shown = sets.slice(0, visibleCount);
    if (!sets.length) {
      elements.grid.replaceChildren();
      elements.status.hidden = false;
      elements.status.textContent = "条件に一致する教材がありません。Search または filter を変更してください。";
      elements.more.hidden = true;
      return;
    }

    elements.status.hidden = true;
    elements.grid.innerHTML = shown.map((set) => {
      const stats = setStats(set);
      const autoCount = set.questions.filter(isAutoGraded).length;
      const progressPercent = Math.round((stats.attempted / set.questions.length) * 100);
      return `
        <article class="english-set-card">
          <div class="english-set-card__meta">
            <span>${escapeHtml(set.collection)}</span>
            <span>${escapeHtml(set.level)}</span>
          </div>
          <h3>${escapeHtml(set.title)}</h3>
          ${isReadingFeed || isTaskCatalog ? `<p>${escapeHtml(new Date(set.date).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }))} JST</p>` : ""}
          ${set.sourceLabel ? `<p class="reading-source-label">${escapeHtml(set.sourceLabel)}</p>` : ""}
          <p>${set.questions.length} questions · ${autoCount} auto / ${set.questions.length - autoCount} self-check</p>
          <div class="english-set-card__progress" aria-label="${stats.attempted} of ${set.questions.length} attempted">
            <span style="width:${progressPercent}%"></span>
          </div>
          <p class="english-set-card__result">Mastered ${stats.mastered} · Review ${stats.review}</p>
          <div class="english-set-card__actions">
            <button class="toefl-button toefl-button--primary" type="button" data-library-start="${escapeHtml(set.id)}">Start set</button>
            ${stats.review ? `<button class="toefl-button toefl-button--secondary" type="button" data-library-review="${escapeHtml(set.id)}">Review ${stats.review}</button>` : ""}
            ${set.sourceUrl ? `<a href="${escapeHtml(siteUrl(set.sourceUrl))}">Full article</a>` : ""}
          </div>
        </article>`;
    }).join("");
    elements.more.hidden = shown.length >= sets.length;
    elements.more.textContent = `Show more (${sets.length - shown.length} remaining)`;
  }

  async function loadBank() {
    if (hasLoaded) return;
    hasLoaded = true;
    try {
      const response = await window.fetch(root.dataset.bankUrl, { cache: "no-cache" });
      if (!response.ok) throw new Error(`Question bank returned HTTP ${response.status}`);
      const payload = await response.json();
      if (payload.schemaVersion !== 1 || !Array.isArray(payload.sets)) {
        throw new Error("Unsupported question bank format");
      }
      bank = payload;
      if (isTaskCatalog) updateTaskCatalog();
      elements.totals.innerHTML = `
        <strong>${bank.setCount} sets</strong>
        <span>${bank.questionCount.toLocaleString()} questions</span>
        <small>${bank.autoGradedCount} auto-graded · ${bank.selfCheckCount} self-check</small>`;
      elements.progress.hidden = false;
      elements.controls.hidden = false;
      updateOverallProgress();
      renderLibrary();
    } catch (error) {
      console.error(error);
      hasLoaded = false;
      elements.status.hidden = false;
      elements.status.innerHTML = "Question bank を読み込めませんでした。ページを再読み込みしてください。";
    }
  }

  function updateTaskCatalog() {
    document.querySelectorAll("[data-reading-task]").forEach((button, index) => {
      const task = button.dataset.readingTask;
      const count = bank.sets.filter((set) => set.collection === task).reduce((sum, set) => sum + set.questions.length, 0);
      document.getElementById(`reading-task-${index + 1}-count`).textContent = `${count}問 · 自動採点`;
      button.disabled = false;
    });
    const progressPanel = document.getElementById("reading-migration-progress");
    if (progressPanel && bank.migration) {
      const m = bank.migration;
      progressPanel.innerHTML = `<p><strong>PDF教材：</strong>${m.pdfPublished}問を掲載済み · 全${m.pdfPageTotal}ページのうち${m.pdfReviewedPages}ページを照合済み</p>
        <p class="toefl-small-note">${m.pdfTotalQuestions === null ? "PDF全体の正確な設問数は照合中です。ページ数を問題数として数えていません。" : `PDFの全${m.pdfTotalQuestions}問を確認済みです。`}</p>`;
      const note = document.getElementById("reading-migration-note");
      if (note) note.textContent = (m.complete ? "PDF教材の全演習を移行しました。" : "PDF教材を順次、解答・自動採点できる形式へ移行しています。") + (m.answerKeysMissing ? "出版社の解答・解説ページは未収録のため、掲載する解答は本文・文法に照らして確認しています。" : "");
    }
  }

  function startSet(setId, reviewOnly = false) {
    if (!bank) return;
    const set = bank.sets.find((candidate) => candidate.id === setId);
    if (!set) return;
    const questions = reviewOnly
      ? set.questions.filter((question) => needsReview(progress.answers[question.id]?.result))
      : set.questions;
    if (!questions.length) return;

    activeSet = set;
    activeQueue = [...questions];
    currentIndex = 0;
    sessionMastered = 0;
    elements.complete.hidden = true;
    elements.runner.hidden = false;
    renderQuestion();
    elements.runner.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function contextMarkup(set) {
    if (!set.passage && !set.notes.length) return "";
    return `
      ${set.passage ? `
        <details class="library-passage" open>
          <summary>Reading passage</summary>
          <div class="library-rich-text">${richText(set.passage)}</div>
        </details>` : ""}
      ${set.notes.length ? `
        <details class="library-notes">
          <summary>語注 (${set.notes.length})</summary>
          <dl>${set.notes.map((note) => `<div><dt>${richText(note.term)}</dt><dd>${richText(note.definition)}</dd></div>`).join("")}</dl>
        </details>` : ""}`;
  }

  function renderQuestion() {
    const question = activeQueue[currentIndex];
    selectedOption = null;
    elements.questionCollection.textContent = `${activeSet.collection} · ${activeSet.level}`;
    elements.setTitle.textContent = activeSet.title;
    elements.questionCount.textContent = `Question ${currentIndex + 1} of ${activeQueue.length}`;
    elements.progressBar.style.width = `${((currentIndex + 1) / activeQueue.length) * 100}%`;
    elements.questionLabel.textContent = `問${question.number} · ${question.label}`;
    elements.feedback.hidden = true;
    elements.feedback.className = "toefl-feedback";
    elements.feedback.replaceChildren();
    elements.selfRating.hidden = true;
    elements.check.hidden = false;
    elements.check.disabled = true;
    elements.next.hidden = true;
    elements.next.textContent = currentIndex === activeQueue.length - 1 ? "See results" : "Next question";

    const prompt = `${activeSet.verificationNote ? `<p class="reading-source-label">${escapeHtml(activeSet.verificationNote)}</p>` : ""}<div class="library-question-prompt library-rich-text">${richText(question.prompt)}</div>`;
    if (question.options.length) {
      elements.check.textContent = "Check answer";
      elements.questionContent.innerHTML = `
        ${contextMarkup({ ...activeSet, passage: question.passage ?? activeSet.passage })}
        ${prompt}
        <div class="toefl-answers" role="group" aria-label="Answer choices">
          ${question.options.map((option) => `
            <button class="toefl-answer" type="button" data-library-option="${option.label}" aria-pressed="false">
              <span class="toefl-option-letter">${option.label}</span>
              <span>${richText(option.text)}</span>
            </button>`).join("")}
        </div>`;
      elements.questionContent.querySelectorAll("[data-library-option]").forEach((button) => {
        button.addEventListener("click", () => selectChoice(button));
      });
    } else if (question.acceptedAnswers) {
      elements.check.textContent = "Check answer";
      elements.questionContent.innerHTML = `
        ${contextMarkup({ ...activeSet, passage: question.passage ?? activeSet.passage })}
        ${prompt}
        <label class="library-written-answer" for="library-gap-input">
          <span>Your answer · 欠けた文字だけ入力（単語全体も可）</span>
          <textarea id="library-gap-input" rows="1" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Missing letters"></textarea>
        </label>`;
      const input = document.getElementById("library-gap-input");
      input.addEventListener("input", () => { elements.check.disabled = !input.value.trim(); });
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.isComposing) {
          event.preventDefault();
          if (!elements.check.disabled) evaluateAnswer();
        }
      });
    } else {
      elements.check.textContent = "Show model answer";
      elements.questionContent.innerHTML = `
        ${contextMarkup(activeSet)}
        ${prompt}
        <label class="library-written-answer" for="library-written-input">
          <span>Your answer</span>
          <textarea id="library-written-input" rows="7" placeholder="ここに解答を入力してください。日本語・英語どちらでも入力できます。"></textarea>
        </label>
        <p class="library-character-count" id="library-character-count">0 characters</p>`;
      const textarea = document.getElementById("library-written-input");
      textarea.addEventListener("input", () => {
        const length = textarea.value.trim().length;
        document.getElementById("library-character-count").textContent = `${length} character${length === 1 ? "" : "s"}`;
        elements.check.disabled = length === 0;
      });
    }
  }

  function selectChoice(button) {
    selectedOption = button.dataset.libraryOption;
    elements.questionContent.querySelectorAll("[data-library-option]").forEach((candidate) => {
      const selected = candidate === button;
      candidate.classList.toggle("is-selected", selected);
      candidate.setAttribute("aria-pressed", String(selected));
    });
    elements.check.disabled = false;
  }

  function recordAttempt(question, result, submitted) {
    progress.answers[question.id] = {
      result,
      submitted,
      attemptedAt: new Date().toISOString()
    };
    saveProgress();
    updateOverallProgress();
    renderLibrary();
  }

  function answerSourceLink() {
    if (!activeSet.sourceUrl) return "";
    return `<a class="library-source-link" href="${escapeHtml(siteUrl(activeSet.sourceUrl))}">全文・詳しい解説を元記事で開く →</a>`;
  }

  function optionAnswerText(question, label) {
    const option = question.options.find((candidate) => candidate.label === label);
    return option ? `${option.label}. ${option.text}` : label;
  }

  function tutorDetails(question, submitted) {
    return {
      source: "Master's Physics Lab — English Library",
      setTitle: activeSet.title,
      section: activeSet.collection,
      task: question.label,
      instruction: `Answer question ${question.number} in this ${activeSet.level} study set.`,
      context: question.passage ?? activeSet.passage,
      question: question.prompt,
      options: question.options.map((option) => `${option.label}. ${option.text}`),
      userAnswer: question.options.length ? optionAnswerText(question, submitted) : submitted,
      modelAnswer: question.answer,
      sourceUrl: activeSet.sourceUrl ? new URL(siteUrl(activeSet.sourceUrl), window.location.href).href : window.location.href
    };
  }

  function evaluateAnswer() {
    if (elements.check.disabled || elements.check.hidden) return;
    const question = activeQueue[currentIndex];
    if (question.acceptedAnswers) {
      const input = document.getElementById("library-gap-input");
      const submitted = input.value;
      const correct = question.acceptedAnswers.some((answer) => normalizeAnswer(answer) === normalizeAnswer(submitted));
      input.disabled = true;
      recordAttempt(question, correct ? "correct" : "incorrect", submitted);
      if (correct) sessionMastered += 1;
      elements.feedback.className = `toefl-feedback ${correct ? "is-correct" : "is-wrong"}`;
      elements.feedback.innerHTML = `<h3>${correct ? "✓ Correct" : "✕ Not quite"}</h3>
        <p>Your answer: ${escapeHtml(submitted)}</p>
        <div class="library-rich-text">${richText(question.answer)}</div>`;
      window.ToeflChatGPTBridge?.mount(elements.feedback, tutorDetails(question, submitted));
      elements.feedback.hidden = false;
      elements.check.hidden = true;
      elements.next.hidden = false;
      elements.next.focus();
      return;
    }
    if (question.options.length) {
      const correct = selectedOption === question.correct;
      elements.questionContent.querySelectorAll("[data-library-option]").forEach((button) => {
        button.disabled = true;
        if (button.dataset.libraryOption === question.correct) button.classList.add("is-correct");
        if (button.dataset.libraryOption === selectedOption && !correct) button.classList.add("is-wrong");
      });
      recordAttempt(question, correct ? "correct" : "incorrect", selectedOption);
      if (correct) sessionMastered += 1;
      elements.feedback.className = `toefl-feedback ${correct ? "is-correct" : "is-wrong"}`;
      elements.feedback.innerHTML = `
        <h3>${correct ? "✓ Correct" : "✕ Not quite"}</h3>
        <div class="library-rich-text">${richText(question.answer)}</div>
        ${answerSourceLink()}`;
      window.ToeflChatGPTBridge?.mount(elements.feedback, tutorDetails(question, selectedOption));
      elements.feedback.hidden = false;
      elements.check.hidden = true;
      elements.next.hidden = false;
      elements.next.focus();
      return;
    }

    const textarea = document.getElementById("library-written-input");
    textarea.disabled = true;
    elements.feedback.className = "toefl-feedback is-self-check";
    elements.feedback.innerHTML = `
      <h3>Compare with the model answer</h3>
      <p class="library-answer-label">Your answer</p>
      <div class="library-user-answer">${escapeHtml(textarea.value)}</div>
      <p class="library-answer-label">Model answer / 解答例</p>
      <div class="library-rich-text">${richText(question.answer)}</div>
      ${answerSourceLink()}`;
    window.ToeflChatGPTBridge?.mount(elements.feedback, tutorDetails(question, textarea.value));
    elements.feedback.hidden = false;
    elements.selfRating.hidden = false;
    elements.check.hidden = true;
    elements.selfRating.querySelector("[data-rating='mastered']")?.focus();
  }

  function rateSelfAnswer(rating) {
    const question = activeQueue[currentIndex];
    const textarea = document.getElementById("library-written-input");
    recordAttempt(question, rating, textarea?.value || "");
    if (rating === "mastered") sessionMastered += 1;
    elements.selfRating.hidden = true;
    elements.next.hidden = false;
    elements.next.focus();
  }

  function nextQuestion() {
    if (currentIndex < activeQueue.length - 1) {
      currentIndex += 1;
      renderQuestion();
      elements.runner.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    showCompletion();
  }

  function showCompletion() {
    const reviewCount = setStats(activeSet).review;
    const percent = Math.round((sessionMastered / activeQueue.length) * 100);
    elements.runner.hidden = true;
    elements.complete.hidden = false;
    elements.completeTitle.textContent = percent >= 80 ? "Strong finish." : percent >= 60 ? "Good progress." : "Keep building.";
    elements.completeScore.textContent = `${sessionMastered} / ${activeQueue.length} mastered this attempt · ${percent}%`;
    elements.completeMessage.textContent = reviewCount
      ? `${reviewCount} question${reviewCount === 1 ? "" : "s"} in this set are marked for review.`
      : "この教材に要復習の問題はありません。";
    elements.review.hidden = reviewCount === 0;
    elements.complete.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  elements.search.addEventListener("input", () => {
    visibleCount = PAGE_SIZE;
    renderLibrary();
  });
  elements.collection.addEventListener("change", () => {
    document.querySelectorAll("[data-reading-task]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.readingTask === elements.collection.value)));
    visibleCount = PAGE_SIZE;
    renderLibrary();
  });
  document.querySelectorAll("[data-reading-task]").forEach((button) => {
    button.addEventListener("click", () => {
      elements.collection.value = button.dataset.readingTask;
      elements.search.value = "";
      elements.level.value = "All";
      elements.runner.hidden = true;
      elements.complete.hidden = true;
      elements.collection.dispatchEvent(new Event("change"));
      root.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
  elements.level.addEventListener("change", () => {
    visibleCount = PAGE_SIZE;
    renderLibrary();
  });
  elements.more.addEventListener("click", () => {
    visibleCount += PAGE_SIZE;
    renderLibrary();
  });
  elements.grid.addEventListener("click", (event) => {
    const startButton = event.target.closest("[data-library-start]");
    const reviewButton = event.target.closest("[data-library-review]");
    if (startButton) startSet(startButton.dataset.libraryStart, false);
    if (reviewButton) startSet(reviewButton.dataset.libraryReview, true);
  });
  elements.check.addEventListener("click", evaluateAnswer);
  elements.next.addEventListener("click", nextQuestion);
  elements.exit.addEventListener("click", () => {
    elements.runner.hidden = true;
    root.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  elements.selfRating.addEventListener("click", (event) => {
    const button = event.target.closest("[data-rating]");
    if (button) rateSelfAnswer(button.dataset.rating);
  });
  elements.restart.addEventListener("click", () => startSet(activeSet.id, false));
  elements.review.addEventListener("click", () => startSet(activeSet.id, true));
  document.getElementById("library-refresh")?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    hasLoaded = false;
    await loadBank();
    button.disabled = false;
  });

  document.addEventListener("toefl:unlocked", loadBank);
})();
