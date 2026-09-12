(() => {
  "use strict";

  const QUESTIONS = [
    {
      id: "r-complete-1",
      section: "Reading",
      task: "Complete the Words",
      kind: "complete",
      instruction: "Type only the missing letters in each word.",
      passage: "Coastal wetlands can abs{{0}} part of a storm's energy. Their dense vegetation also sl{{1}} the movement of water, which may reduce flooding farther inland.",
      gaps: [
        { answer: "orb", word: "absorb" },
        { answer: "ows", word: "slows" }
      ],
      explanation: "Both completions must fit the spelling and the meaning: wetlands absorb energy, and vegetation slows water.",
      explanationJa: "absorb は「吸収する」、slow はここでは動詞で「遅くする」。文法だけでなく、前後の意味にも合う文字を補います。",
      vocabulary: [
        ["wetland", "湿地", "water covers the soil for part or all of the year"],
        ["dense", "密集した", "closely packed together"]
      ]
    },
    {
      id: "r-complete-2",
      section: "Reading",
      task: "Complete the Words",
      kind: "complete",
      instruction: "Type only the missing letters in each word.",
      passage: "A scientific model does not need to rep{{0}} every detail of a system. Instead, it should cap{{1}} the features that are most relevant to the question being studied.",
      gaps: [
        { answer: "resent", word: "represent" },
        { answer: "ture", word: "capture" }
      ],
      explanation: "A model represents a system and captures its relevant features. Both missing verbs use the base form after “to” and “should.”",
      explanationJa: "represent は「表現する」、capture はここでは「重要な特徴を捉える」。to represent と should capture のように、to と助動詞 should の後には動詞の原形を置きます。",
      vocabulary: [
        ["relevant", "関連する・重要な", "directly connected to the question"],
        ["feature", "特徴・要素", "an important part or characteristic"]
      ]
    },
    {
      id: "r-daily-1",
      section: "Reading",
      task: "Read in Daily Life",
      kind: "choice",
      instruction: "Read the notice and choose the best answer.",
      passage: "SCIENCE LIBRARY NOTICE\nThe second-floor study area will close at 6:00 p.m. on Thursday for electrical maintenance. The first floor will remain open until the usual closing time. Reserved books can still be collected at the main desk.",
      prompt: "What should a student do if they want to study after 6:00 p.m. on Thursday?",
      options: [
        "Use the first-floor study area",
        "Collect a reserved book on Friday",
        "Ask the main desk to delay maintenance",
        "Enter the second floor through another door"
      ],
      answer: 0,
      explanation: "Only the second floor closes early. The notice says the first floor remains open until the normal time.",
      explanationJa: "閉まるのは second-floor study area だけです。remain open（開いたままである）が正答の直接的な根拠です。",
      vocabulary: [
        ["maintenance", "保守・点検", "work done to keep equipment functioning"],
        ["remain", "〜のままである", "continue in the same state"]
      ]
    },
    {
      id: "r-daily-2",
      section: "Reading",
      task: "Read in Daily Life",
      kind: "choice",
      instruction: "Read the message and choose the best answer.",
      passage: "Hi Elena,\nI attached the revised poster. I made the title larger, as you suggested, but I left the graph unchanged because Professor Ito has not approved the new data yet. Could you check the references before our meeting at three?\n—Marcus",
      prompt: "Why did Marcus leave the graph unchanged?",
      options: [
        "The meeting was moved to another time.",
        "The new data has not been approved.",
        "Elena asked him to enlarge the graph.",
        "The reference list was already correct."
      ],
      answer: 1,
      explanation: "Marcus directly connects his decision to Professor Ito not having approved the new data yet.",
      explanationJa: "because 以下が理由です。has not approved ... yet は「まだ承認していない」という現在完了の表現です。",
      vocabulary: [
        ["revised", "修正された", "changed in order to improve something"],
        ["reference", "参考文献", "a source cited in academic work"]
      ]
    },
    {
      id: "r-academic-1",
      section: "Reading",
      task: "Read an Academic Passage",
      kind: "choice",
      instruction: "Read the passage and choose the best answer.",
      passage: "When fluid moves along a solid surface, friction slows the fluid closest to that surface. A thin region called the boundary layer therefore develops. Outside this layer, the fluid may move almost as if the surface were absent. Although the boundary layer is often very thin, its behavior strongly affects drag, heat transfer, and whether the flow remains smooth or becomes turbulent.",
      prompt: "Why does the author mention that the boundary layer is often very thin?",
      options: [
        "To argue that it can usually be ignored",
        "To contrast its small size with its large effects",
        "To explain why all fluid flow becomes turbulent",
        "To show that friction occurs outside the layer"
      ],
      answer: 1,
      explanation: "“Although” signals a contrast: the region is thin, yet it strongly affects several important properties.",
      explanationJa: "Although（〜にもかかわらず）が対比の合図です。「薄い領域」なのに drag などへの影響は大きい、という構造です。",
      vocabulary: [
        ["boundary layer", "境界層", "the thin flow region next to a surface"],
        ["drag", "抗力", "a force that resists motion through a fluid"],
        ["turbulent", "乱流の", "having irregular, mixed fluid motion"]
      ]
    },
    {
      id: "r-academic-2",
      section: "Reading",
      task: "Read an Academic Passage",
      kind: "choice",
      instruction: "Read the passage and choose the best answer.",
      passage: "Large volcanic eruptions can inject sulfur-rich gases into the stratosphere. There, the gases form tiny particles that reflect some incoming sunlight. Surface temperatures may consequently fall for a limited period. The effect is temporary because the particles gradually settle out of the atmosphere, but it can still alter rainfall patterns and growing seasons in the years immediately following an eruption.",
      prompt: "According to the passage, why is the cooling effect temporary?",
      options: [
        "Volcanoes stop producing heat after an eruption.",
        "Sunlight eventually passes through sulfur-rich gases.",
        "The reflective particles gradually leave the atmosphere.",
        "Rainfall removes all gases from the stratosphere immediately."
      ],
      answer: 2,
      explanation: "The passage explicitly says that the particles gradually settle out of the atmosphere.",
      explanationJa: "temporary の理由は because 以下に明示されています。settle out は「沈降して取り除かれる」という意味です。",
      vocabulary: [
        ["stratosphere", "成層圏", "the atmospheric layer above the troposphere"],
        ["consequently", "その結果", "as a result"],
        ["alter", "変える", "change, often in a noticeable way"]
      ]
    },
    {
      id: "l-response-1",
      section: "Listening",
      task: "Listen and Choose a Response",
      kind: "listening",
      instruction: "Listen to the sentence and choose the most natural response.",
      audioText: "Could you send me the revised outline by noon?",
      options: [
        "Sure, I'll finish the last section this morning.",
        "The outline of the building is difficult to see.",
        "No, lunch begins at twelve thirty.",
        "I revised my course schedule last semester."
      ],
      answer: 0,
      explanation: "The speaker is making a polite request with “Could you…?” The first option accepts the request and addresses the deadline.",
      explanationJa: "Could you ...? は能力ではなく丁寧な依頼です。by noon は「正午までに」で、期限内に終えると応じる A が自然です。",
      vocabulary: [
        ["outline", "概要・構成案", "a plan showing the main points"],
        ["by noon", "正午までに", "no later than noon"]
      ]
    },
    {
      id: "l-response-2",
      section: "Listening",
      task: "Listen and Choose a Response",
      kind: "listening",
      instruction: "Listen to the sentence and choose the most natural response.",
      audioText: "Wasn't the astronomy lecture moved to Room two-oh-four?",
      options: [
        "Yes, the notice was posted yesterday.",
        "No, astronomy studies objects in space.",
        "The room has about two hundred seats.",
        "I moved the telescope very carefully."
      ],
      answer: 0,
      explanation: "The speaker is checking information about a room change. The first response confirms that information with relevant evidence.",
      explanationJa: "否定疑問文 Wasn't ...? で「204号室に変更されたよね」と確認しています。posted はここでは「掲示された」です。",
      vocabulary: [
        ["lecture", "講義", "an educational talk for a class"],
        ["post a notice", "お知らせを掲示する", "make an announcement publicly visible"]
      ]
    },
    {
      id: "w-sentence-1",
      section: "Writing",
      task: "Build a Sentence",
      kind: "sentence",
      instruction: "Select the words in the correct order. Select a placed word to remove it.",
      passage: "Student: What did your technician say about the laboratory results?\nResearcher: ______",
      tiles: ["ready", "said", "would", "tomorrow", "they", "be", "The technician"],
      answerWords: ["The technician", "said", "they", "would", "be", "ready", "tomorrow"],
      explanation: "Reported speech uses “said” followed by a clause. “Would” expresses the future from the viewpoint of a past statement.",
      explanationJa: "reported speech（間接話法）の文です。過去の said を基準に、未来の will が would へ時制変化しています。",
      vocabulary: [
        ["available", "利用可能な・入手できる", "ready to be used or obtained"],
        ["reported speech", "間接話法", "reporting someone's words without quoting them exactly"]
      ]
    },
    {
      id: "w-sentence-2",
      section: "Writing",
      task: "Build a Sentence",
      kind: "sentence",
      instruction: "Select the words in the correct order. Select a placed word to remove it.",
      passage: "Advisor: Why did Maya register for the seminar?\nStudent: ______",
      tiles: ["Because", "topic", "her", "to", "research", "was", "the seminar", "related"],
      answerWords: ["Because", "the seminar", "was", "related", "to", "her", "research", "topic"],
      explanation: "The natural answer is “Because the seminar was related to her research topic.” “Be related to” is a fixed expression.",
      explanationJa: "自然な完成文は Because the seminar was related to her research topic. です。be related to は「〜に関連している」という定型表現です。",
      vocabulary: [
        ["seminar", "少人数の演習・セミナー", "a class based on discussion of a topic"],
        ["be related to", "〜に関連している", "have a connection with something"]
      ]
    }
  ];

  const STORAGE_KEY = "mastersPhysicsLab.toeflProgress.v1";
  const letters = ["A", "B", "C", "D"];
  const elements = {
    filters: document.getElementById("section-filters"),
    start: document.getElementById("start-button"),
    review: document.getElementById("review-button"),
    description: document.getElementById("set-description"),
    attempted: document.getElementById("attempted-stat"),
    accuracy: document.getElementById("accuracy-stat"),
    streak: document.getElementById("streak-stat"),
    reset: document.getElementById("reset-progress"),
    workspace: document.getElementById("practice-workspace"),
    completion: document.getElementById("completion-screen"),
    questionSection: document.getElementById("question-section"),
    questionTask: document.getElementById("question-task"),
    questionCount: document.getElementById("question-count"),
    progressBar: document.getElementById("progress-bar"),
    instruction: document.getElementById("question-instruction"),
    content: document.getElementById("question-content"),
    feedback: document.getElementById("question-feedback"),
    check: document.getElementById("check-button"),
    next: document.getElementById("next-button"),
    exit: document.getElementById("exit-button"),
    restart: document.getElementById("restart-button"),
    completionReview: document.getElementById("completion-review-button"),
    completionTitle: document.getElementById("completion-title"),
    completionScore: document.getElementById("completion-score"),
    completionMessage: document.getElementById("completion-message")
  };

  let selectedSection = "All";
  let queue = [];
  let currentIndex = 0;
  let currentSelection = null;
  let builtWords = [];
  let sessionCorrect = 0;
  let progress = loadProgress();

  function loadProgress() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
      if (saved && typeof saved === "object") {
        return {
          attempts: saved.attempts || {},
          currentStreak: Number(saved.currentStreak) || 0,
          bestStreak: Number(saved.bestStreak) || 0
        };
      }
    } catch (error) {
      console.warn("Could not load TOEFL progress", error);
    }
    return { attempts: {}, currentStreak: 0, bestStreak: 0 };
  }

  function saveProgress() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.warn("Could not save TOEFL progress", error);
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalize(value) {
    return String(value)
      .trim()
      .toLowerCase()
      .replace(/[.,!?;:]/g, "")
      .replace(/\s+/g, " ");
  }

  function getFilteredQuestions() {
    if (selectedSection === "All") return [...QUESTIONS];
    return QUESTIONS.filter((question) => question.section === selectedSection);
  }

  function updateDashboard() {
    const attempts = Object.values(progress.attempts);
    const correct = attempts.filter((attempt) => attempt.correct).length;
    const mistakes = attempts.filter((attempt) => !attempt.correct).length;
    const filteredCount = getFilteredQuestions().length;

    elements.attempted.textContent = `${attempts.length}/${QUESTIONS.length}`;
    elements.accuracy.textContent = attempts.length ? `${Math.round((correct / attempts.length) * 100)}%` : "—";
    elements.streak.textContent = String(progress.bestStreak);
    elements.review.disabled = mistakes === 0;
    elements.completionReview.disabled = mistakes === 0;
    elements.description.textContent = `${filteredCount} original question${filteredCount === 1 ? "" : "s"} · about ${Math.max(4, Math.ceil(filteredCount * 1.2))} minutes`;
  }

  function selectSection(section) {
    selectedSection = section;
    document.querySelectorAll(".toefl-filter").forEach((button) => {
      const active = button.dataset.section === section;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    updateDashboard();
  }

  function startSet(mode = "normal") {
    const base = mode === "mistakes"
      ? QUESTIONS.filter((question) => progress.attempts[question.id] && !progress.attempts[question.id].correct)
      : getFilteredQuestions();

    if (!base.length) return;
    queue = [...base];
    currentIndex = 0;
    sessionCorrect = 0;
    elements.completion.hidden = true;
    elements.workspace.hidden = false;
    renderQuestion();
    elements.workspace.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderQuestion() {
    const question = queue[currentIndex];
    currentSelection = null;
    builtWords = [];
    window.speechSynthesis?.cancel();

    elements.questionSection.textContent = question.section;
    elements.questionTask.textContent = question.task;
    elements.questionCount.textContent = `Question ${currentIndex + 1} of ${queue.length}`;
    elements.progressBar.style.width = `${((currentIndex + 1) / queue.length) * 100}%`;
    elements.instruction.textContent = question.instruction;
    elements.feedback.hidden = true;
    elements.feedback.className = "toefl-feedback";
    elements.feedback.replaceChildren();
    elements.check.hidden = false;
    elements.check.disabled = true;
    elements.next.hidden = true;
    elements.next.textContent = currentIndex === queue.length - 1 ? "See results" : "Next question";

    if (question.kind === "complete") renderComplete(question);
    if (question.kind === "choice") renderChoice(question);
    if (question.kind === "listening") renderListening(question);
    if (question.kind === "sentence") renderSentence(question);
  }

  function renderComplete(question) {
    const passage = document.createElement("p");
    passage.className = "toefl-passage";
    const parts = question.passage.split(/(\{\{\d+\}\})/g);

    parts.forEach((part) => {
      const match = part.match(/^\{\{(\d+)\}\}$/);
      if (!match) {
        passage.append(document.createTextNode(part));
        return;
      }

      const index = Number(match[1]);
      const input = document.createElement("input");
      input.className = "toefl-gap";
      input.type = "text";
      input.autocomplete = "off";
      input.spellcheck = false;
      input.maxLength = Math.max(question.gaps[index].answer.length + 2, 3);
      input.dataset.gap = String(index);
      input.setAttribute("aria-label", `Missing letters for ${question.gaps[index].word}`);
      input.addEventListener("input", updateCheckAvailability);
      passage.append(input);
    });

    elements.content.replaceChildren(passage);
    elements.content.querySelector("input")?.focus();
  }

  function choiceMarkup(question) {
    const answers = question.options.map((option, index) => `
      <button class="toefl-answer" type="button" data-option="${index}" aria-pressed="false">
        <span class="toefl-option-letter">${letters[index]}</span>
        <span>${escapeHtml(option)}</span>
      </button>`).join("");

    return `
      ${question.passage ? `<div class="toefl-passage">${escapeHtml(question.passage).replaceAll("\n", "<br>")}</div>` : ""}
      ${question.prompt ? `<p class="toefl-prompt">${escapeHtml(question.prompt)}</p>` : ""}
      <div class="toefl-answers" role="group" aria-label="Answer choices">${answers}</div>`;
  }

  function bindChoiceButtons() {
    elements.content.querySelectorAll(".toefl-answer").forEach((button) => {
      button.addEventListener("click", () => {
        currentSelection = Number(button.dataset.option);
        elements.content.querySelectorAll(".toefl-answer").forEach((candidate) => {
          const selected = candidate === button;
          candidate.classList.toggle("is-selected", selected);
          candidate.setAttribute("aria-pressed", String(selected));
        });
        updateCheckAvailability();
      });
    });
  }

  function renderChoice(question) {
    elements.content.innerHTML = choiceMarkup(question);
    bindChoiceButtons();
  }

  function renderListening(question) {
    elements.content.innerHTML = `
      <div class="toefl-audio-row">
        <button class="toefl-audio-button" id="play-audio" type="button" aria-label="Play sentence">▶</button>
        <div class="toefl-audio-copy">
          <strong>Play the sentence</strong>
          <small>Browser voice · replay allowed</small>
        </div>
      </div>
      <p class="toefl-transcript" id="audio-status" hidden></p>
      <div class="toefl-answers" role="group" aria-label="Answer choices">
        ${question.options.map((option, index) => `
          <button class="toefl-answer" type="button" data-option="${index}" aria-pressed="false">
            <span class="toefl-option-letter">${letters[index]}</span>
            <span>${escapeHtml(option)}</span>
          </button>`).join("")}
      </div>`;

    bindChoiceButtons();
    document.getElementById("play-audio").addEventListener("click", () => playSentence(question.audioText));
  }

  function playSentence(text) {
    const status = document.getElementById("audio-status");
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      status.hidden = false;
      status.textContent = `Audio is unavailable in this browser. Transcript: “${text}”`;
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onerror = () => {
      status.hidden = false;
      status.textContent = `Audio could not play. Transcript: “${text}”`;
    };
    window.speechSynthesis.speak(utterance);
  }

  function renderSentence(question) {
    const tiles = question.overrideTiles || question.tiles;
    elements.content.innerHTML = `
      <div class="toefl-dialogue">${escapeHtml(question.passage).replaceAll("\n", "<br>")}</div>
      <div class="toefl-builder" id="sentence-builder" aria-label="Your sentence">
        <span class="toefl-builder__placeholder">Build your sentence here</span>
      </div>
      <div class="toefl-word-bank" id="word-bank" aria-label="Available words">
        ${tiles.map((word, index) => `<button class="toefl-word-chip" type="button" data-tile="${index}">${escapeHtml(word)}</button>`).join("")}
      </div>
      <div class="toefl-builder-controls"><button id="clear-sentence" type="button">Clear sentence</button></div>`;

    document.querySelectorAll("#word-bank .toefl-word-chip").forEach((button) => {
      button.addEventListener("click", () => addWord(Number(button.dataset.tile), tiles));
    });
    document.getElementById("clear-sentence").addEventListener("click", () => {
      builtWords = [];
      syncSentenceBuilder(tiles);
    });
  }

  function addWord(index, tiles) {
    if (builtWords.includes(index)) return;
    builtWords.push(index);
    syncSentenceBuilder(tiles);
  }

  function syncSentenceBuilder(tiles) {
    const builder = document.getElementById("sentence-builder");
    const bankButtons = document.querySelectorAll("#word-bank .toefl-word-chip");
    builder.replaceChildren();

    if (!builtWords.length) {
      const placeholder = document.createElement("span");
      placeholder.className = "toefl-builder__placeholder";
      placeholder.textContent = "Build your sentence here";
      builder.append(placeholder);
    } else {
      builtWords.forEach((tileIndex) => {
        const button = document.createElement("button");
        button.className = "toefl-word-chip";
        button.type = "button";
        button.textContent = tiles[tileIndex];
        button.setAttribute("aria-label", `Remove ${tiles[tileIndex]}`);
        button.addEventListener("click", () => {
          builtWords = builtWords.filter((value) => value !== tileIndex);
          syncSentenceBuilder(tiles);
        });
        builder.append(button);
      });
    }

    bankButtons.forEach((button) => {
      button.disabled = builtWords.includes(Number(button.dataset.tile));
    });
    updateCheckAvailability();
  }

  function updateCheckAvailability() {
    const question = queue[currentIndex];
    if (!question) return;
    if (question.kind === "complete") {
      const inputs = [...elements.content.querySelectorAll(".toefl-gap")];
      elements.check.disabled = !inputs.length || inputs.some((input) => !input.value.trim());
      return;
    }
    if (question.kind === "sentence") {
      elements.check.disabled = builtWords.length !== (question.overrideTiles || question.tiles).length;
      return;
    }
    elements.check.disabled = currentSelection === null;
  }

  function evaluateCurrent() {
    const question = queue[currentIndex];
    let correct = false;
    let submitted = "";

    if (question.kind === "complete") {
      const inputs = [...elements.content.querySelectorAll(".toefl-gap")];
      const results = inputs.map((input, index) => normalize(input.value) === normalize(question.gaps[index].answer));
      correct = results.every(Boolean);
      submitted = inputs.map((input) => input.value.trim()).join(" | ");
      inputs.forEach((input, index) => {
        input.disabled = true;
        input.classList.add(results[index] ? "is-correct" : "is-wrong");
      });
    } else if (question.kind === "sentence") {
      const tiles = question.overrideTiles || question.tiles;
      const submittedWords = builtWords.map((index) => tiles[index]);
      const accepted = question.acceptedAnswerWords || question.answerWords;
      correct = normalize(submittedWords.join(" ")) === normalize(accepted.join(" "));
      submitted = submittedWords.join(" ");
      elements.content.querySelectorAll("button").forEach((button) => { button.disabled = true; });
    } else {
      correct = currentSelection === question.answer;
      submitted = question.options[currentSelection];
      elements.content.querySelectorAll(".toefl-answer").forEach((button) => {
        const option = Number(button.dataset.option);
        button.disabled = true;
        if (option === question.answer) button.classList.add("is-correct");
        if (option === currentSelection && !correct) button.classList.add("is-wrong");
      });
    }

    recordAttempt(question.id, correct, submitted);
    if (correct) sessionCorrect += 1;
    showFeedback(question, correct, submitted);
    elements.check.hidden = true;
    elements.next.hidden = false;
    elements.next.focus();
  }

  function recordAttempt(questionId, correct, submitted) {
    progress.attempts[questionId] = {
      correct,
      submitted,
      attemptedAt: new Date().toISOString()
    };

    if (correct) {
      progress.currentStreak += 1;
      progress.bestStreak = Math.max(progress.bestStreak, progress.currentStreak);
    } else {
      progress.currentStreak = 0;
    }

    saveProgress();
    updateDashboard();
  }

  function correctAnswerText(question) {
    if (question.kind === "complete") return question.gaps.map((gap) => gap.word).join(", ");
    if (question.kind === "sentence") return (question.acceptedAnswerWords || question.answerWords).join(" ") + ".";
    return question.options[question.answer];
  }

  function tutorDetails(question, submitted) {
    const context = question.kind === "listening"
      ? `Audio transcript: ${question.audioText}`
      : String(question.passage || "").replace(/\{\{\d+\}\}/g, "___");
    const options = question.options?.map((option, index) => `${letters[index]}. ${option}`) || [];

    return {
      source: "Master's Physics Lab — TOEFL Quick Practice",
      section: question.section,
      task: question.task,
      instruction: question.instruction,
      context,
      question: question.prompt || question.instruction,
      options,
      userAnswer: submitted,
      modelAnswer: correctAnswerText(question),
      explanation: `${question.explanation}\n${question.explanationJa}`
    };
  }

  function showFeedback(question, correct, submitted) {
    const vocabulary = question.vocabulary.map(([word, japanese, definition]) => `
      <span><strong>${escapeHtml(word)}</strong> — ${escapeHtml(japanese)}：${escapeHtml(definition)}</span>`).join("");
    const transcript = question.kind === "listening"
      ? `<p class="toefl-explanation-ja"><strong>Transcript:</strong> “${escapeHtml(question.audioText)}”</p>`
      : "";

    elements.feedback.className = `toefl-feedback ${correct ? "is-correct" : "is-wrong"}`;
    elements.feedback.innerHTML = `
      <h3>${correct ? "✓ Correct" : "✕ Not quite"}</h3>
      <p class="toefl-feedback__answer">Answer: ${escapeHtml(correctAnswerText(question))}</p>
      <p>${escapeHtml(question.explanation)}</p>
      <p class="toefl-explanation-ja">${escapeHtml(question.explanationJa)}</p>
      ${transcript}
      <div class="toefl-vocab" aria-label="Vocabulary notes">${vocabulary}</div>`;
    window.ToeflChatGPTBridge?.mount(elements.feedback, tutorDetails(question, submitted));
    elements.feedback.hidden = false;
  }

  function nextQuestion() {
    if (currentIndex < queue.length - 1) {
      currentIndex += 1;
      renderQuestion();
      elements.workspace.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    showCompletion();
  }

  function showCompletion() {
    const missed = queue.length - sessionCorrect;
    const percent = Math.round((sessionCorrect / queue.length) * 100);
    elements.workspace.hidden = true;
    elements.completion.hidden = false;
    elements.completionTitle.textContent = percent >= 80 ? "Strong finish." : percent >= 60 ? "Good progress." : "Keep building.";
    elements.completionScore.textContent = `${sessionCorrect} / ${queue.length} correct · ${percent}%`;
    elements.completionMessage.textContent = missed
      ? `${missed} question${missed === 1 ? "" : "s"} can be practised again from Review mistakes.`
      : "You cleared this set without a mistake.";
    updateDashboard();
    elements.completion.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  elements.filters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-section]");
    if (button) selectSection(button.dataset.section);
  });
  elements.start.addEventListener("click", () => startSet("normal"));
  elements.review.addEventListener("click", () => startSet("mistakes"));
  elements.check.addEventListener("click", evaluateCurrent);
  elements.next.addEventListener("click", nextQuestion);
  elements.exit.addEventListener("click", () => {
    window.speechSynthesis?.cancel();
    elements.workspace.hidden = true;
  });
  elements.restart.addEventListener("click", () => startSet("normal"));
  elements.completionReview.addEventListener("click", () => startSet("mistakes"));
  elements.reset.addEventListener("click", () => {
    if (!window.confirm("Reset all TOEFL Practice Lab progress saved in this browser?")) return;
    progress = { attempts: {}, currentStreak: 0, bestStreak: 0 };
    saveProgress();
    updateDashboard();
  });

  selectSection("All");
})();
