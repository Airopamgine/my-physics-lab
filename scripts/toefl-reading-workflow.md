# Reading practice publication

Destination: https://airopamgine.github.io/my-physics-lab/toefl/reading/

The owner requested small batches on a four-hour schedule to conserve AI credits.
The schedule is managed by ChatGPT Scheduled Tasks, not by the browser or this file.
The browser grades every new question locally with stored answers; no AI API, key,
server, or automatic ChatGPT submission is needed. Keep the existing password gate
and the previous English archive. The gate is a casual client-side entrance, not
confidential storage. Never commit a password, source PDF, page image, or private data.

## One run

1. Fetch current `main`, this file, and the file listing of `data/toefl-reading`.
   Work only on this Reading feed. Leave other topics and paused tasks untouched.
2. Identify the current Japan-time four-hour slot (00, 04, 08, 12, 16, or 20).
   Use `reading-YYYYMMDD-HHMM` as the ID and filename. If this slot is already on
   main, report its link and stop. Check open `agent/reading-*` PRs for an unfinished
   run before creating another. Do not generate catch-up batches for missed slots.
3. Read the latest one or two batches to avoid repeating passages and vocabulary.
   Create exactly ONE new original 10-question set at B1–B2 or B2. Rotate campus,
   everyday, humanities, arts, social-science and non-specialist science contexts.
   Use the format lessons from the supplied Reading PDFs: incomplete words,
   everyday reading, academic reading, and vocabulary in context. Original English
   passages and explanations are required; do not copy or translate book passages
   wholesale or publish the uploaded PDFs, scans, download links, or source keys.
   This is targeted practice, not a full official/adaptive test or official score.
4. Save only `data/toefl-reading/<id>.json` using the schema below. Date is ISO 8601
   with `+09:00`. Published questions must have exactly one defensible answer.
   Audit the answer and every distractor yourself; the source OCR/keys are not
   authoritative. Use fictional everyday scenarios to avoid personal data. Do not
   turn uncertain technical or changing real-world claims into reading facts.
5. Validate with `python3 scripts/build_english_quiz_bank.py` and
   `python3 -m unittest discover -s tests -p 'test_reading_feed.py'`.
   Run a Hugo build when available. If any validation fails, fix the new batch
   before publication. Do not weaken validation or change frontend code as part
   of an ordinary run. The generated bank is ignored and must not be committed.
6. Commit the single source file to an `agent/reading-<slot>` branch from current
   main, open a focused PR, check its diff and mergeability, and merge with the
   expected head SHA. Respect required checks and protected workflows. The owner
   authorized publishing these exercises. Confirm the Pages workflow result and
   report the page link, new/total question counts, and any failed deployment.
   Never claim publication based only on creating a branch or PR.

## Source schema

Use the existing first set as the complete working example. Fields:

- `id`, `title` (short Japanese topic title), `date`, `level`.
- `passages`: object of named plain-text English passages. Typically `words`
  (70–110 words, with three numbered-by-question target blanks), `daily`
  (80–150 words: email, notice, message chain, advertisement, etc.), and `academic`
  (170–230 words, titled, with two or three paragraphs).
- `questions`: ten entries in fixed order: 3 `words`, 3 `daily`, 3 `academic`,
  1 `vocabulary`. Each needs `category`, `passageId`, `prompt` (English), and `answer`
  (Japanese explanation plus useful English). Question IDs are generated from the
  set ID and array position; never reorder or replace a published set.
- For `words`, supply lowercase ASCII `prefix` and complete `word`; display
  `prefix` plus exactly one underscore per missing letter in the referenced passage
  and prompt. Choose an unambiguous word completion. The generated bank accepts the
  missing suffix OR whole word, case-insensitively, with NFKC and outer-space trim.
- For all other categories, supply four distinct `{label: "A"..."D", text: "..."}`
  options and `correct` (one label). Include main purpose/detail/inference or
  rhetorical purpose across the reading questions. The vocabulary item tests a
  word's meaning in one of the passages. Explanations must name the correct answer,
  cite its passage evidence and explain why each distractor fails.

Do not repeatedly reread all large PDFs or regenerate existing sets on each run.
The attached scans inform the task styles above, not an endless transcription job.
Scheduled generation uses credits; local grading does not call AI. Keep each run
bounded to one set and a concise publication report.
