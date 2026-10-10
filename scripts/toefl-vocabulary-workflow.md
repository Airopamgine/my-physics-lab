# TOEFL vocabulary notebook and complete field inventory

Normal page: https://airopamgine.github.io/my-physics-lab/toefl/#vocabulary-lab

The owner requested a notebook and exhaustive vocabulary quiz covering the
existing learning material. Keep vocabulary attached to the published exercises;
do not replace unresolved Reading work with generated questions. Vocabulary
knowledge helps reading, but does not establish grammar, inference or an official
TOEFL score. No claim that passing every card guarantees passing every exercise.

## Source inventory and future additions

`build_english_quiz_bank.py` builds the Reading bank and vocabulary index on each
deployment. `build_toefl_vocabulary.py` reads the generated Reading catalog,
original English posts, Writing bank and the normal quick-practice data literal.
It indexes published passages, prompts, every option, explanations, notes,
completed gaps, Writing conditions, tiles, frame, posts, model answers and guides,
and the quick Listening scripts. Material and editor glosses retain separate
labels. No private PDF, scan, raw OCR or personal answer is read by the builder.

Each document retains exercise IDs and sourceRefs, its engine and every term
index. Each vocabulary entry retains every document reference in the inverse
direction. Representative quotes keep exact target offsets. Surface forms,
hyphenated words, contractions and explicit multiword glosses remain searchable;
missing-letter scoring fragments are replaced with the complete word.
Meaning card IDs use the glossary definition hash or a WordNet synset ID.
Retired `vocab:<surface>|context` records remain archived in the same progress
database. Do not replace stable IDs or discard earlier progress casually.

After adding a daily Writing batch, rebuild the index and run its tests as well
as the Writing workflow checks. New terms lacking a definition remain visibly
unconfirmed meanings and are not quizzes; never silently fabricate a translation
or count a spelling answer as meaning knowledge. Reading image-check status comes from the existing
migration metadata and is carried through without claiming a new source audit.

## Meaning sources

Japanese glosses come from explicit reviewed material and
`data/toefl-vocabulary/editor-glossary.json`. Check every editorial supplement
for sense, part of speech, grammar and reasonable English/Japanese support.

English definitions are an offline WordNet 3.0 subset. Dictionary senses are
possibilities, not automatic disambiguation of a source sentence. Inflections
link to dictionary-attested base forms. The frozen subset is built from the
official distribution with:

```sh
python3 scripts/import_vocabulary_wordnet.py /path/to/WordNet-3.0
python3 scripts/build_toefl_vocabulary.py
```

Obtain the original distribution from `https://wordnetcode.princeton.edu/3.0/`.
The subset and deployed bank preserve the full required copyright/license text;
`static/data/wordnet-license.txt` also supplies a standalone copy. Regenerate the
subset when new material adds dictionary-attested words. Deployment itself is
offline. Do not copy an unlicensed dictionary or present a dictionary definition
as the publisher's answer.

## Quiz and private progress

The default is a self-contained **English word → meaning** four-choice quiz,
ten questions per round. Prefer Japanese meanings where available; use English
definitions otherwise. Separate Japanese-only and English-only modes remain.
Tap to grade immediately; reveal unknown words without counting them correct.
Round results list mistakes and allow retrying only those cards. Standard batches
contain distinct surface forms; individual-word practice can check its several
meanings. Choices reshuffle between runs and retain a saved seed on resume.
Four-choice cards exclude shared synsets, shared base lemmas, identical and
overlapping glosses and every other dictionary-attested meaning of the target.
Match the part of speech for English distractors. Meanings of phrases can use
word-based distractors; all questions must have four distinct choices.

Source-form spelling quizzes ended on 2026-10-10 after the owner reported needing
to look at the source text. No playable question depends on a separate Reading
passage or source-link lookup. Examples appear only after answering and are
optional. Retired context cards retain their records/history, but do not count
as meaning progress and cannot resume. A source-specific material gloss is kept
in the notebook but superseded by the editor's general definition in quizzes.
Split bilingual editorial explanations only at English sentence boundaries;
preserve mixed Japanese strings such as `AとB` and `we are の短縮形` intact.

The pronunciation button uses the browser's English speech synthesis on an
explicit user click. A missing API or playback error is visible; the quiz still
works. Voice availability and pronunciation quality need a real device check.

Correct, wrong and revealed states are distinct. A correct answer confirms a
card; a correct review on a different Europe/Warsaw calendar date establishes
practice mastery. Failed/revealed cards return to review. This is a study signal,
not a test score. Unseen and failed cards take priority, then due reviews.

The existing successful-auth boundary is preserved. The large bank loads only
after unlock and an explicit vocabulary request. Notebook details and long
source lists render in chunks. IndexedDB stores vocabulary state independently
of Reading/Writing; localStorage is a fallback with a visible failure notice.
Notes are plain text, limited to 3,000 characters. History keeps the latest 500
events, while all card records are retained. JSON export/import transfers user
state only and checks stable IDs; invalid imports leave current state intact.
Save selected answers by stable vocabulary ID, not a changing corpus array
position. Store the last round's mistakes as well as the current session.

## Verification and publication

Use the existing Reading/Writing workflows, build all banks, and run:

```sh
python3 -m unittest discover -s tests -p 'test_*.py'
hugo --gc --minify --destination /tmp/toefl-site
NODE_PATH=/path/to/qa/node_modules TOEFL_HTML=/tmp/toefl-site/toefl/index.html node tests/verify_vocabulary_dom.cjs
```

DOM dependencies: `jsdom@26.1.0` and `fake-indexeddb@6.0.1`. The test renders every
playable meaning card with source-opening APIs absent. It checks four unique
choices, correct/wrong/reveal/retry, distinct-day reviews, interruption, timer,
saved choice ID/seed, pronunciation fallback, notes, filters, references, malformed state,
export/import, IndexedDB with a complete-corpus record exceeding 5 MB, quota
failures and retry. The independent Python field inventory detects omissions
and checks both directions of source coverage, definitions and license.

Run all Writing and Reading DOM checks for shared layout changes and the daily
menu in Europe/Warsaw, UTC and Asia/Tokyo. `TOEFL checks` does this on related PRs.
If the usual authenticated browser session is unavailable, record desktop/mobile
visual inspection as unverified. Never modify or bypass authentication for QA.
Review the diff, satisfy checks, merge only the reviewed head SHA, confirm Pages
deployment, and compare delivered JSON, JS, CSS and bank-version HTML references.

The supplied Reading/Writing migration counts remain separate from vocabulary
card counts and original Writing counts. Vocabulary publication does not finish
the held Reading question or its pending original-image checks.
