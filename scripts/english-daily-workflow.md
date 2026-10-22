# English Practice Lab — ongoing updates

Page: https://airopamgine.github.io/my-physics-lab/toefl/

## Category navigation (owner request, 2026-10-22)

The main page and the existing `/toefl/reading/` entry use `practice-hub.js`:
exam → skill → question type → automatically selected practice. The learner
chooses broad categories, never individual questions from a large catalog.
TOEFL Reading includes Complete the Words / C-test, Daily Life and Academic;
Cambridge Reading & Use of English exposes Parts 1–7. Keep Listening, Writing,
Speaking, Today, Vocabulary and Progress accessible through the same navigation.
Official external samples remain clearly labelled; synthetic speech and daily
speaking activities are training, not a full simulation of every exam format.

For manual category practice, resume saved work first, then favour unanswered
tasks. Group Reading by its complete source text with all associated questions,
and do not truncate cloze passages. Sentence and supplementary grammar practice
use five-item queues. Once every task has been attempted, favour mistakes and
older work. Explicit mistake review remains available; daily weakness selection
retains its existing scheduling. Show no detailed catalogs in the guided UI.
Preserve existing progress keys and source IDs; the shared runner also archives
unfinished sets so switching categories and crossing midnight retain drafts.

Run `tests/verify_practice_hub.cjs` against built HTML alongside the existing
runner checks. It covers navigation, unseen priority, coherent passage groups,
multiple drafts, next-day resumption, grading, old links and loading recovery.

## Current grading rule (owner request, 2026-10-21)

All answers in the selected set or daily queue must be completed before grading.
The shared `set-practice.js` form saves editable drafts and enables Submit set
only after every response is present. No per-item results, correct keys, models,
tutor answers or new graded history are revealed while answering. Submission
grades the entire set; a separate Finish review action records reviewed work.
This applies to Cambridge, Reading, daily Writing queues, Quick Practice and
Vocabulary rounds. Free writing remains self-reviewed without an invented score.
Keep this behavior in future additions, including reload/close/resume and error
recovery. Do not restore instant per-question feedback. The old runner fixtures
remain explicit legacy grading-kernel tests; `verify_set_practice.cjs` exercises
the production full-set UI and must run alongside them.

## Current practice layout (owner requests, 2026-10-21 and 2026-10-22)

Keep the passage/task on the left and the answer fields on the right on wide
screens. The shared renderer groups each passage with its matching questions.
Both columns share a bounded height and scroll independently: the left passage
and the right questions/answers each need their own overflow area. Set the grid
row and both panes to allow shrinking (`min-height: 0`); the right column must
not expand the entire page. Both scrolling regions support keyboard focus.
Short tasks pair their prompt and answer on the same row, with bounded answer
areas when a response contains many choices or tiles.
Essay instructions and source posts belong in the left pane, without repeating
the full source above the writing field. On small screens, stack the pair and
limit both panes' heights so long text cannot bury the answer fields.
Preserve the full-set submission rule, editable drafts and all source content.

The owner requested ongoing TOEFL and Cambridge B2 First preparation,
balanced development of all four skills, easier navigation, and daily repair
based on the previous day's answers. Publication through this existing GitHub
Pages repository is authorized. Retain its hosting, audience, password entrance,
published source IDs, existing learner-storage keys and source notices.

## Start each run

Read this guide, the Writing/Reading workflows, the current Cambridge and Writing
banks, and any unfinished related PR. Finish a valid overlapping PR first.
Use the current Europe/Warsaw date for original-content provenance, as established
in the Writing workflow. Do not backfill missed dates or duplicate an existing
batch. The UI uses the learner's local date for study sessions, so original-bank
publication dates and session dates need not be identical on another continent.

## Original content

Continue all 12 daily TOEFL Writing originals: ten sentence tasks, one email,
one discussion. Append only to `static/data/toefl-writing-originals.json`.
Keep `static/data/toefl-writing-bank.json` byte-for-byte unchanged: it is the
already-published source bank, not a destination for new work. The browser and
`scripts/writing_bank.py` combine both feeds without republishing a new source
copy. Follow `toefl-writing-workflow.md`, retain the supplied-source
inventory, and keep original counts separate. Finish any partial batch.

Also add a coherent ten-gap Cambridge Part 2 training set and a six-question
Part 4 transformation set for the current date, at most once. Ten gaps are a
training extension: the official Part 2 has eight. Use stable IDs such as
`cb-20261022-cloze-01` and `cb-20261022-transform-01`; each set has
`source: {kind: original, date: YYYY-MM-DD}`. Keep the current schema, declare
skills/tags and realistic time estimates, and update `updatedAt`.

Maintain broader practice through the week: vocabulary/collocations (Part 1),
word formation (3), attitude/inference/evidence (5), cohesion (6), paraphrase and
matching (7), and original writing tasks. Add a reviewed set in one of these
areas when coverage or repeated topics justify it. Preserve real-recording links,
listening processing practice and spoken interaction; do not turn the site into
only grammar drills. Supply a reasoned English explanation with Japanese support
(roughly 60/40), difficult-word glosses, evidence and useful contrasts for wrong
options. Mark short training texts honestly; do not call them full mock tests.

Part 2 answers must fit the entire text; accept defensible alternatives. Part 3
requires the right meaning and part of speech. Part 4 preserves meaning, uses the
unchanged key word and has two to five words with contractions expanded for word
counting. Accept natural alternative orders/forms. Full-answer checking is
editorial practice, not official partial credit. Writing models are examples;
Cambridge models should be 140–190 words, while TOEFL discussion models follow
their own requirements. Never derive an official score or CEFR level from a
word count, completion count or self-check.

Avoid republishing private PDFs, scans, raw OCR or learner responses. Do not
replace blocked Reading migration with new originals. Existing source-image/key
blockers remain governed by `toefl-reading-workflow.md`; do not repeat an already
reported missing-source notice without new information.

## What yesterday's analysis can and cannot use

`english-coach.js` observes Reading/Writing/Cambridge answers in the browser.
It retains the first objective result for each item/date; later retries update
the latest result without erasing the first error. Older daily snapshots are
imported as **saved results**, not retroactively labelled first attempts.
Cambridge selection prioritises due items and yesterday's error tags while
retaining full passages. The daily route stays fixed after the date is selected.
Correct items have spaced review at 1/3/7/14/30 days; an error resets to one day.

This is browser-local analysis. A scheduled GitHub editor has **no access** to
the browser's localStorage, actual recordings, essays or external listening
results. Do not claim to have inspected yesterday's private answers. If the
owner explicitly supplies an English learning report, analyse it privately and
create new exercises for its weak patterns. Do not commit the report or personal
answers. Without a report, maintain balanced new content while the browser
handles the individual daily repair. Export/import migrates Cambridge answers,
drafts and the analysis ledger; existing TOEFL exports remain separate.

Storage keys: `mastersPhysicsLab.cambridgeLab.v1` and
`mastersPhysicsLab.englishCoach.v1`. The pre-existing dailyStudy, Reading, Writing
and Vocabulary keys are unchanged. Loading stays behind `toefl:unlocked`.
Cambridge failure must leave the original TOEFL route available and recover on
retry. No API token or paid model call belongs in this public frontend.

## Verification and publication

Run the bank builder, full Python suite and Hugo build. Check all new accepted
answers and explanations editorially, including transformations in their full
stems. Use the isolated DOM fixtures (the existing CI installs jsdom):

```sh
python3 scripts/build_english_quiz_bank.py
python3 -m unittest discover -s tests -p 'test_*.py'
hugo --gc --minify --destination /tmp/english-build
TOEFL_HTML=/tmp/english-build/toefl/index.html node tests/verify_writing_dom.cjs
TOEFL_HTML=/tmp/english-build/toefl/index.html node tests/verify_cambridge_dom.cjs
TOEFL_HTML=/tmp/english-build/toefl/index.html node tests/verify_daily_study.cjs
```

Set NODE_PATH to the installed jsdom directory. For frontend/shared changes,
also run full Reading/Vocabulary DOM checks and the daily/Cambridge suites in
Europe/Warsaw, UTC and Asia/Tokyo. Keep the Cambridge audit task count dynamic
as content grows. The fixture's submitted text and authentication event exist
only in isolated tests, not in production records. Use an already authorized
live session for desktop/mobile visual checks when available; do not bypass or
change production authentication for a screenshot. State any verification limit.

Review the diff, create a focused `agent/english-*` branch and PR, pass checks,
and merge using the expected head SHA. Confirm Pages deployment and delivered
assets match the reviewed version. Report the page URL, actual additions and
material limits concisely. Do not repeatedly report empty updates. Continue the
ongoing original-content work even if the older Reading migration phase closes.

## Initial update, 2026-10-21

- 11 Cambridge sets: 70 Reading/Use of English answers and two writing tasks.
- Seven original sentences for opt-in browser-synthesised Listen & Repeat.
- Twelve new TOEFL Writing originals; prior originals are retained.
- Ten-step daily route alternates exam work with listening and speech.
- Navigation, yesterday report, dated first attempts, source-snapshot migration,
  spaced review and Cambridge/report export/import are implemented.
- Full-answer practice does not estimate official scores or certify B2.
