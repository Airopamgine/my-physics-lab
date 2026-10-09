# Vocabulary notebook audit — 2026-10-09

Normal page: https://airopamgine.github.io/my-physics-lab/toefl/

## Corpus and meaning coverage

The current index covers 3,651 published Reading questions, 275 Writing
exercises, original post notes, Writing guides and quick Reading/Listening data.
There are 4,057 source documents and 28,514 nonempty text fields. The independent
field inventory checks each question, every choice, model, condition, tile and
post, and all inverse references. Completed cloze words are indexed; suffix-only
scoring fragments are excluded. Source banks are fingerprinted in the output.

The initial notebook contains 13,742 entries: 13,120 surface forms and 622
multiword expressions. There are 3,313 material/editor meaning cards, 57,186
individual English dictionary-sense cards and 13,617 context cards (74,116 total).
The dictionary comes from the official WordNet 3.0 distribution, using exact
index offsets and attested morphological lookup. Full copyright/license text is
retained in the subset, deployed data and standalone license file. All 219
editor supplements were reviewed for grammar, spelling and sense; they are
labelled as editor additions, separate from the source glosses.

There are 1,418 entries without a meaning explanation, including proper names,
abbreviations and dictionary-missing compounds. They stay visible under a
dedicated filter and in each material's coverage row. Context success alone
does not establish meaning coverage. Dictionary candidate senses are explicitly
separate from a contextual interpretation; no all-exercises or score guarantee.

The unresolved `pdf:task3:p089:q17` remains unpublished and unindexed. The
71 original-image rechecks for Task 3 PDF pages 84–154 remain pending. Published
text on those pages is indexed with that limitation retained, not newly verified.
The publisher answer-page absence remains displayed by the Reading app.
No Reading/Writing exercises were added or modified for this feature. October
9's daily Writing batch already has all 12 sourceRefs on main and was not repeated.

## Behavior review

- The normal page links to the notebook, with task, meaning/state and source
  filters, exact-word-first search, plain-text notes and favourites.
- Source lists retain every occurrence association; question links use the
  existing Reading/Writing selection interfaces. All 74,116 cards render their
  complete question, valid target, four unique choices where applicable and
  explanation. Shared dictionary synsets are excluded from distractors.
- Answers accept case and fullwidth normalization. Empty answers and double
  submissions cannot increment progress. Wrong/revealed answers reset the
  practice streak; same-day repetition does not create long-term mastery.
- Timer, interrupted input, selected choice, history and reviews persist.
  IndexedDB supports complete-corpus history beyond typical localStorage quota.
  Export transfers actual progress JSON; import checks stable IDs and preserves
  current progress if invalid. Vocabulary reset preserves Reading/Writing keys.
- Loading is lazy behind the existing unlock event. Malformed banks, failed
  requests, damaged state and storage quota failures have visible recovery text.
  The isolated fixture does not alter production authentication or credentials.

## Verification and limits

Hugo v0.154.5, the full Python suite, full Reading DOM (3,651 questions), full
Writing DOM (275 exercises), full vocabulary DOM (74,116 cards) and the daily
menu checks pass. The PR workflow repeats these checks, including daily menus
in Europe/Warsaw, UTC and Asia/Tokyo. The layout uses the normal page's existing
styles with responsive vocabulary rules at 800/480 px.

The available normal browser shows the existing login gate. Authenticated
desktop/mobile visual inspection of the learning interface is **unverified**.
DOM fixtures are functional checks and do not establish real-browser layout
quality. Authentication was not changed or bypassed. The generated bank is
about 17.3 MB before HTTP compression and loads on demand; mobile download speed
and live layout still need checking in an ordinary authenticated session.

No private source PDF, raw OCR, scan or personal written answer is included in
the public diff. Vocabulary progress remains in the user's browser and is not
sent to GitHub or a scoring service.
