# TOEFL Writing: supplied source and daily originals

Normal page: https://airopamgine.github.io/my-physics-lab/toefl/

The owner asked to complete the Writing section, then add original exercises
every day, preserving answer/explanation accuracy and checking display and
behavior. `writing-source-index.json` inventories all 139 supplied PDF pages
and 215 unique source exercises. `writing-lab-audit.md` records source review,
deduplication, editorial repairs, tests and the remaining live-login limitation.
Original Writing work is separate from the unfinished Reading source audit in
`toefl-reading-workflow.md`; never replace a blocked Reading item with a new one.

## Read first

Fetch current main, this guide, `writing-source-index.json`,
`static/data/toefl-writing-bank.json`, the Reading workflow/index, and unfinished
related PRs. Finish a valid pending PR before preparing overlapping work.
Retain all published IDs, source references and user-progress keys.

The supplied Writing source is complete only when its source index has no
remaining exercises and every original source reference is accounted for.
Source exercise totals exclude originals. Do not reintroduce the duplicate
Practice Test 6 sentence or invent a task on blank PDF page 116.

## One original batch per day

Starting on October 5, 2026, use the user's Europe/Warsaw calendar date.
The existing recurring task can check more than once a day; add at most one
daily batch. A complete daily batch is **12 original exercises**:

- 10 Build a Sentence exercises, varied in topic, grammar and phrase order;
- 1 Write an Email task with exactly three concrete requirements;
- 1 Academic Discussion task with a clear professor question and two distinct
  student viewpoints.

Before adding anything, check main and unfinished PRs for that date's
`original:writing:YYYY-MM-DD:` source references. Skip completed batches and
finish any partial batch without duplicating its items. If a run is missed,
add the current day's batch; do not invent backdated publication history.

Use stable IDs such as `writing-original-YYYYMMDD-s01`,
`writing-original-YYYYMMDD-email` and
`writing-original-YYYYMMDD-discussion`. Each original exercise has:

```json
{
  "collection": "Original · YYYY-MM-DD",
  "sourceRefs": ["original:writing:YYYY-MM-DD:sentence:01"],
  "source": {"kind": "original", "date": "YYYY-MM-DD"},
  "answerBasis": "Original practice exercise; answer and explanation reviewed editorially."
}
```

Email and discussion references use `email:01` and `discussion:01`.
Never label originals as PDF-derived or official exam questions. Do not change
the source-completion index to increase source counts for original additions.
Keep `schemaVersion` compatible with the client and update the bank's date.
No API keys or paid inference calls are needed in the user's app.

## Quality requirements

Sentence exercises use the existing frame/tiles/solutions schema. Each solution
uses each chosen tile once, fills every frame slot and forms a grammatical,
natural answer to the dialogue prompt. Include every defensible alternative
order; reject an exercise if its intended key is ambiguous. Extra tiles must
not turn a listed correct answer into a misleading omission. Validate the
assembled model answer, capitalization, punctuation, tense and pronoun referents.
Explain the key grammar and why an attractive wrong order fails.

Email tasks use a 7-minute practice timer and one plausible model addressing
all three requirements with the appropriate recipient, tone, purpose and
closing. Clearly mark optional fictional additions. Discussion tasks use a
10-minute timer, at least 100 words in the model, a reasoned position, explicit
engagement with the two views and a concrete example or new contribution.
Models are examples, not unique correct answers; no word-count-based score.

Write explanations with approximately 60% English reasoning and 40% Japanese
support. Add Japanese glosses and brief explanations for difficult vocabulary.
Review every key, alternative, model and explanation before publication.
Ensure topical variety and no near-duplicate content in recent batches.

## Verification and authorized publication

Run the full Python suite, Reading bank builder and Hugo build. Run
`tests/verify_writing_dom.cjs` against built normal-page HTML so every new
sentence key/alternative, essay review and saving path is exercised.
Run the Reading DOM suite for frontend or shared-bridge changes, or if a
Reading change justifies it; avoid repeating unrelated verification after a
data-only daily batch has passed. Never weaken tests to accept invalid content.

The public app uses the existing study login. If an authorized authenticated
session is available, inspect both desktop and mobile layouts and exercise
selection, grading, explanations, saving and timers. Otherwise retain the
explicit live-visual-check limitation and use the isolated DOM fixture.
Never bypass, remove or change authentication to obtain a screenshot.

Review the exact diff and ensure no private PDF, scans, raw OCR, learner answers,
private paths or source hashes are included. Commit to a focused
`agent/writing-*` branch, open a PR, meet required checks, and merge with an
expected head SHA. Publication is already authorized. Confirm Pages build and
deployment, then compare the delivered bank and client assets with the reviewed
versions at the normal page URL.

Report concisely in Japanese: normal page link, new Writing count, total/source
completion, Reading progress if it changed, and any material verification limit.
When Reading completes or becomes permanently source-blocked, close its
migration phase and report exact missing material once. Continue the expressly
requested daily original Writing batches; do not pause that ongoing request
merely because the supplied-source migration finished.
