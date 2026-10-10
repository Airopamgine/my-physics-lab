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

## Self-contained word app revision — 2026-10-10

The owner reported that some quizzes required consulting the source text and
asked for a vocabulary-app style experience entirely within the app. The normal
page now opens directly to ten-question meaning practice: an English word or
expression, four meaning choices, immediate grading on a tap, an optional
pronunciation button, answer explanations, a round result and mistake-only retry.
Japanese meanings take priority in recommended practice; English definitions are
used otherwise. Source examples are collapsed, optional, and available only
after answering. The spelling/input form and playable context mode were removed.

All 13,742 indexed forms/expressions and their full source associations remain.
There are 60,511 playable meaning questions: 3,325 Japanese and 57,186 English.
This removes the 13,617 source-form reproduction questions and 42 contextual
material-gloss questions superseded by standalone editor explanations, and adds
54 reviewed bilingual common-word explanations (273 editor entries total).
The 1,418 entries without a meaning stay visible as awaiting definitions, with
no manufactured quiz or meaning-success credit. Original source notes remain
available in the notebook. The 3,651 Reading and 275 Writing exercises are unchanged.

Every playable card is checked for its target, four distinct choices, exclusion
of synonyms/other attested meanings and no material-opening dependency. The DOM
suite exercises immediate correct/wrong/reveal, no double grading, ten distinct
words per standard round, mistake-only retry, saved choice IDs and shuffle seed,
timers, notes, filters, history, export/import, pronunciation API/error fallbacks,
and complete-corpus IndexedDB saving above 5 MB. Old context records and history
remain exportable; their unfinished sessions are retired with a visible notice.
The bilingual extraction tests preserve Latin letters inside Japanese text and
expanded forms such as `we are の短縮形` rather than removing the useful meaning.

The full 123 Python tests, Hugo build, 60,511-question vocabulary DOM, 275-exercise
Writing DOM, 3,651-question Reading DOM and three-timezone daily-menu tests pass.
Source migration totals, the held Phototropism question, the 71 original-image
rechecks and the publisher answer-page absence are unchanged.
Authenticated desktop/mobile layout and real-device speech playback remain
unverified; the ordinary browser has the existing study login. Authentication
has not been changed or bypassed. The generated bank still loads on demand.

## Level/subject learning and elementary exclusions — 2026-10-10

The notebook and quiz now share practical/general, academic/discussion and
specialist/advanced study tiers, plus seven semantic subject filters. These are
editorial learning routes, explicitly not official CEFR/TOEFL ratings. The word's
common use determines its tier; individual dictionary meanings and Japanese
glosses have their own subjects. For example, lodging and eye-focus meanings of
accommodation are separated. Recommended practice falls back to a matching
English meaning when the available Japanese meaning belongs to another subject.
Technical compounds such as conduction band, carbon fixation and
antigen-presenting cell retain specialist routes. Frequency and word length
alone do not determine tier.

Reviewed elementary lemmas, their attested inflections, contractions and a small
list of transparent everyday expressions are reference-only. This includes
the/good/go/went/books/children, classroom/information/vocabulary and by noon.
There are 1,490 such indexed items and 88 notation/common-name items. Their IDs,
definitions, source references, notes, stars and past answers remain. The default
notebook hides reference-only items; selecting that tier opens the notebook and
provides an explicit reason instead of a quiz button. Neither targets nor
distractors can be reference-only. Useful phrases with basic components, such
as be related to, and technical targets such as cell and force are preserved.

The full inventory is still 13,742 forms/expressions in 4,057 documents and
28,514 checked text fields. Source fingerprints and every original definition,
context offset, document/sourceRef, ID and inverse association were compared to
the previous published bank and are unchanged. There are now 45,609 playable
meaning cards: 2,984 Japanese and 42,625 English, covering 10,774 entries. The
14,902 excluded meaning cards remain archived. The 1,418 entries without a
meaning explanation are counted independently and are not newly fabricated.
Reading remains 3,651 questions; Writing remains 275 exercises. No private
source files or learner answers are included in this change.

Level, subject, search, source and state filters combine for standard batches,
notebook quiz buttons and source progress. Counts distinguish vocabulary entries
from meaning cards. The level/subject preferences are saved in the existing
version-1 progress schema with backward-compatible defaults. Meaning choices
prefer eligible peers from the same tier/subject and keep every previous synonym,
other-sense and part-of-speech safeguard. Old-policy interrupted sets are retired
because their choice pool changed; past records/history are preserved. New sets
retain a policy identifier, stable choice IDs and shuffle seed across resume.

The WordNet topic derivative is reproducible from the unchanged official 3.0
distribution. It preserves immutable synset identities, uses reviewed topic
anchors, lexicographer categories and domain/hypernym links, fingerprints its
inputs and the exact frozen dictionary senses, and is read offline in deployment.
The original dictionary definitions and license are unchanged.

The 129 Python tests and Hugo build pass. Full Reading (3,651), Writing (275)
DOM and three-timezone daily-menu checks pass. The full 45,609-card vocabulary
DOM audit passes: all level/subject intersections constrain notebook and quiz,
every target/distractor is eligible, the reference-only tier cannot start cards,
and settings, wrong/reveal/retry, notes/stars, timers, stable choice IDs,
legacy/basic history, full-corpus IndexedDB and export/import remain intact.
The ordinary browser again displays the
study-password gate, so authenticated desktop/mobile layout and device speech
remain unverified. Authentication was neither changed nor bypassed.
