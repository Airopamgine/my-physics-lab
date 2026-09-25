# TOEFL Reading: complete source migration

Latest owner instruction supersedes the old original-question generator: put
Task 1/2/3 on the NORMAL `/toefl/` page, convert ALL existing English questions to
TOEFL formats, and make EVERY exercise in all six supplied PDFs answerable there.
Continue bounded batches on the existing four-hour ChatGPT schedule to save
credits. Do not substitute unrelated original questions or create another task.

Owner's later request prioritizes finishing the remaining existing-post material
in larger verified batches before resuming the PDF rotation. The old 10–20-answer
alternation limit is waived for this legacy-completion phase only. Preserve every
source question and passage, review the English choices and answer key, and never
mark the legacy corpus complete until all 1,040 source references are covered.
After legacy completion, resume the PDF review, including blocked original pages.

Normal: https://airopamgine.github.io/my-physics-lab/toefl/
Same catalog / updates: https://airopamgine.github.io/my-physics-lab/toefl/reading/
Unconverted originals: https://airopamgine.github.io/my-physics-lab/toefl/archive/

## Sources and private working files

`scripts/reading-source-index.json` inventories ALL 410 PDF pages and their public
review coverage and source references. Private OCR packet paths and source-file
hashes are deliberately excluded. Include overview/diagnostic, actual tests,
Task 1, Task 2, Task 3 and vocabulary, including examples and short drills.
The ignored local `scripts/reading-source-text/*.json.gz.b64` cache, if present, contains
unverified OCR, ten pages per packet. These files are NOT on GitHub and must
NEVER be uploaded there. Use the original private attachments from the task
context when the cache is unavailable; regenerate locally with the preparation
script. A local cache can disappear, so do not assume durable availability.
Read only the necessary available private packet and decode one page with:
`python3 scripts/prepare_reading_sources.py --packet PATH --page N`.
Use original uploaded PDFs to render uncertain pages when available. Never
publish raw OCR: labels, blank lengths, letters and line breaks may be corrupted.
If critical text cannot be recovered confidently, record the unresolved page/item
and continue elsewhere. Do not silently omit it or invent a reconstruction.
The owner reattached all six original PDFs on September 25, 2026. If they cannot
be accessed in a later ephemeral workspace, use the existing reviewed coverage,
report that blocker once, and request the exact missing attachments. Do not
retry unavailable source access repeatedly. No raw PDF/OCR belongs in a PR.

The supplied files reference answer pages around printed pages 402–502 that were
NOT supplied. `answerKeyAvailable` is false. Derive a learning answer only when
text/grammar/options uniquely support it; preserve the visible note that the
publisher's key has not been checked. Otherwise leave it pending and request the
relevant key pages. Once supplied, audit previously inferred answers too.

Existing `content/posts/english-*.md` contains 112 sets / 1040 source questions.
`static/data/english-question-bank.json` is generated from them. Six existing
quick Reading exercises (8 graded answers) are already mapped to the three tasks
through `data/toefl-quick-reading.json`. Old feed question IDs are also preserved.

## Each scheduled run

1. Fetch current main, this guide, the source index and migration file listing.
   Check unfinished `agent/reading-*` PRs and finish a valid pending batch first.
   Skip already converted SOURCE REFERENCES, not just matching titles.
2. Advance a bounded batch of about 10–20 graded answers, preserving passage/set
   integrity. Alternate existing-post conversion with PDF work; rotate all six
   PDF sources. Store `lastSource` and any `blockedItems` in the source index.
   Begin at the earliest unreviewed page. Covers/instructions count as reviewed
   only after confirming they have no exercise. Do not reread the entire corpus.
3. PDF work preserves the original passage, exercise, options and order while
   correcting demonstrable OCR corruption. Task 1 uses missing-letter inputs;
   Task 2 covers everyday documents; Task 3 covers academic reading, including
   contextual vocabulary and insertion questions. Insertion questions must show
   the sentence and four explicit A–D locations. Each blank gets its own source
   ref. Every vocabulary-list headword needs a contextual completion/meaning item.
   Keep every Task 2 question attached to its source document: full test passages
   normally have two or three questions, while early one-question drills remain
   one-question drills. Never reduce a multi-question block to its main-purpose
   question. For Task 1 passages with multiple blanks, collect every response in
   that passage before revealing any correct answer; do not leak later answers.
4. For existing posts retain ALL learning targets. Convert Japanese translation,
   explanation and essay prompts into English reading questions with four English
   choices and one defensible correct answer, or suitable missing-letter tasks.
   Do not merely change labels or drop difficult questions. Long passages can be
   divided, but preserve source-ref coverage. Keep original articles available.
5. Save `data/toefl-migration/<id>.json`. Update `reviewedPages` only for completely
   checked PDF pages and put every source ref in `pageItems[page]`; confirmed
   non-exercise pages have empty lists. Unresolved pages stay pending. Never call
   page count a question count, or claim an unknown question total.
6. Run `python3 scripts/build_english_quiz_bank.py`,
   `python3 -m unittest discover -s tests -p 'test_*.py'`, and a Hugo build.
   Fix failures; never weaken validation. Generated static banks are ignored.
   Ordinary runs modify only conversion JSON and the source index, not frontend,
   passwords or unrelated subjects. Browser grading uses no AI API or API key.
7. Commit to `agent/reading-migrate-*`, open a focused PR, review diff/mergeability,
   satisfy required checks, and merge with expected head SHA. The owner authorized
   publishing these exercises. Confirm Pages deployment, then report the normal
   page URL, new answers and coverage concisely. Respect access and approval rules.
8. Continue until all legacy refs and all PDF page items are covered. On completion,
   audit coverage, pause this automation and report completion. If every remaining
   source is blocked, report exact missing files/pages and pause instead of paying
   for repeated empty checks. Never claim all done because raw OCR was cached.

## JSON format

Complete examples: `pdf-task1-p010-011`, `pdf-task2-p008`, `pdf-task3-p008`, and
`legacy-balanced-diet` in `data/toefl-migration`.
Set: id (filename stem), title, date (ISO with timezone), level, task (1/2/3),
sourceLabel, optional verificationNote/sourceUrl, passages (key to English text),
questions (ordered). Never reorder a published set or reuse an ID for new content.
Question: passageId, English prompt, Japanese answer with evidence/distractor
explanations, and unique sourceRefs: `legacy:<original-question-id>` or
`pdf:<source-id>:p<PDF-page>:q<exercise-number-or-headword>`; append `-gap1` etc.
Use zero-padded PDF page numbers, e.g. p008, and retain printed-page/exercise labels
for the learner. Task 1 adds word/prefix and a matching prefix+underscore blank in
the passage. It accepts the missing suffix or full word, normalized for case,
outer spaces and NFKC. Tasks 2/3 add four {label: A–D, text: ...} options and correct
(one letter). No free-response self-rating belongs in the converted catalog.

These are three task TYPES within Reading, not three separate exam sections.
Do not present this practice as an official test, adaptive simulator or score.
