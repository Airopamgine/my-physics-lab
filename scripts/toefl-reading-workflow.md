# TOEFL Reading: PDF source migration

The owner has narrowed this project to the six supplied PDF books. Existing
English posts must remain available in their original library/archive, but their
TOEFL-converted copies must not appear on the normal `/toefl/` page. Do not add
or restore `legacy-*.json` migration sets.

Normal: https://airopamgine.github.io/my-physics-lab/toefl/
Same catalog / updates: https://airopamgine.github.io/my-physics-lab/toefl/reading/
Original English library: https://airopamgine.github.io/my-physics-lab/toefl/archive/

## Sources and private working files

`scripts/reading-source-index.json` inventories all 410 PDF pages and their
private OCR packet path hints, checksums, and coverage. The six sources are the
overview/diagnostic book, Actual Tests, Task 1, Task 2, Task 3, and Vocabulary.
Include examples and short drills as well as numbered exercises.

The ignored local `scripts/reading-source-text/*.json.gz.b64` cache contains
unverified OCR in ten-page packets. These files are not on GitHub and must never
be uploaded. Use the private PDF attachments when the cache is unavailable and
regenerate locally only when needed. Read the minimum necessary packet/page:

`python3 scripts/prepare_reading_sources.py --packet PATH --page N`

Use rendered source pages to resolve OCR uncertainty. Never publish a PDF or raw
OCR. If text, blank length, option, or answer is uncertain, record the item under
`blockedItems` and continue elsewhere instead of inventing a reconstruction.

The supplied books refer to answer pages around printed pages 402–502 that were
not supplied, so `answerKeyAvailable` remains false. Derive an editorial answer
only when the passage, grammar, and options support one answer uniquely. Keep the
visible note that the publisher's key has not been checked. If official answer
pages are supplied later, audit inferred answers against them.

## Each scheduled run

1. Fetch current main, this guide, the source index, and the migration file list.
   Check unfinished `agent/reading-*` PRs and finish a valid pending PDF batch
   first. Reject any `legacy:` source reference.
2. Advance about 10–20 graded PDF answers while preserving passage/set integrity.
   Rotate the six PDF sources and begin at the earliest relevant unreviewed page.
   Covers and instruction pages count as reviewed only after confirming they
   contain no exercise. Store `lastSource` and unresolved items in the index.
3. Preserve original passage, exercise, options, and order while correcting only
   demonstrable OCR corruption. Task 1 uses missing-letter inputs; Task 2 covers
   everyday documents; Task 3 covers academic reading, including vocabulary and
   insertion questions. Insertion items must show the sentence and four explicit
   A–D locations. Each blank and vocabulary headword receives a unique source ref.
4. Save `data/toefl-migration/pdf-<id>.json`. Update `reviewedPages` only for
   completely checked pages and list every source ref in `pageItems[page]`.
   Confirmed non-exercise pages have empty lists; unresolved pages remain pending.
   Never count pages as questions or claim an unknown total.
5. Run `python3 scripts/build_english_quiz_bank.py`,
   `python3 -m unittest discover -s tests -p 'test_*.py'`, and a Hugo build.
   Fix failures without weakening validation. Ordinary runs modify only PDF
   conversion JSON and the source index. Browser grading uses no AI API or key.
6. Commit to `agent/reading-migrate-*`, open a focused PR, review its diff and
   mergeability, satisfy checks, merge with the expected head SHA, and confirm
   Pages deployment. The owner has authorized publishing these exercises.
7. Continue until every PDF page/item is accounted for. Then audit coverage,
   disable the recurring task, and report completion. If every remaining item is
   permanently blocked, state the exact missing files/pages and disable it.

## JSON format

Examples: `pdf-task1-p010-011`, `pdf-task2-p008`, and `pdf-task3-p008`.
Each set has id, title, timezone-aware date, level, task (1/2/3), sourceLabel,
optional verificationNote, passages, and ordered questions. Never reorder a
published set or reuse an ID for different material.

Each question has passageId, an English prompt, a Japanese explanation with
textual evidence and distractor analysis, and unique refs of the form
`pdf:<source-id>:p<zero-padded-page>:q<exercise-or-headword>`. Task 1 also has
word and prefix and must show the matching prefix-plus-underscore blank. It accepts
the missing suffix or full word after normalization. Tasks 2/3 have four distinct
English A–D options and one correct label. No free-response self-rating belongs in
this catalog.

These are three Reading task types, not three separate exam sections. Do not
present the practice as official, adaptive, or an official score.
