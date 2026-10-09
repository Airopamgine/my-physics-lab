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
Stable card IDs use `vocab:<surface>|context`, the glossary definition hash or a
WordNet synset ID. Do not replace those IDs or the progress database casually.

After adding a daily Writing batch, rebuild the index and run its tests as well
as the Writing workflow checks. New terms lacking a definition remain visibly
unconfirmed meanings; never silently fabricate a translation or count a spelling
answer as meaning knowledge. Reading image-check status comes from the existing
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

The three modes are Japanese material/editor gloss, individual English dictionary
sense, and exact source-form spelling. Four-choice meaning cards exclude shared
synsets, shared base lemmas and identical glosses. Context cards explicitly ask
for the printed form; another natural completion is not a semantic error.

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

## Verification and publication

Use the existing Reading/Writing workflows, build all banks, and run:

```sh
python3 -m unittest discover -s tests -p 'test_*.py'
hugo --gc --minify --destination /tmp/toefl-site
NODE_PATH=/path/to/qa/node_modules TOEFL_HTML=/tmp/toefl-site/toefl/index.html node tests/verify_vocabulary_dom.cjs
```

DOM dependencies: `jsdom@26.1.0` and `fake-indexeddb@6.0.1`. The test renders every
meaning/context card and checks correct/wrong/reveal, normalization, distinct-day
reviews, interruption, timer, notes, filters, references, malformed state,
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
