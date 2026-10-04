# Writing Lab: complete supplied-source migration and verification

The normal `/toefl/` page contains **215 unique exercises** from the supplied
139-page `TOEFL-writing.pdf`, an increase of 185 from the previous selection of
30. All 139 pages were inventoried from private text; 103 exercise, answer and
reference pages were checked against private page images. See
`writing-source-index.json` for item-level coverage and image-check page numbers.

| Type | Unique exercises | Review |
| --- | ---: | --- |
| Build a Sentence | 156 | Every listed solution and natural alternative checked; original phrase groups retained, with visible notes for source repairs |
| Grammar supplements | 30 | Response matching, relative clauses, tense, active/passive classification and transformation; four-choice automatic grading |
| Write an Email | 15 | Task-specific editorial models and explanations; all source task requirements retained |
| Academic Discussion | 14 | Both source viewpoints retained as labeled English summaries; editorial models of at least 100 words |
| Reference guides | 9 | Word classes, sentence constituents, determiners, relative clauses, voice, tenses, email, discussion, and the printed 0–5 writing rubric |

There are 216 source exercise occurrences and 215 unique exercises: Practice
Test 6 sentence questions 4 and 5 are identical and share one exercise with both
source references. PDF page 116 is blank; no Discussion task is printed for
Practice Test 9. These gaps are recorded without inventing missing source tasks.
No source exercises remain in `remainingExercises`.

The Diagnostic's 10 sentence answers and two worked sentence examples match
printed answers (12 exercises in total). Other objective answers are editorial,
derived from grammar, dialogue and the original phrase groups. Email and
Discussion models are editorial examples, not unique correct answers or
publisher-scored responses. Private handwritten learner answers are never used
as answer keys. Source defects such as missing phrases, inconsistent pronouns,
wrong verb forms and copied task bullets are corrected only where the intended
learning target is defensible, with an `editorNote` displayed to the learner.
The source index records all such notes.

Discussion author names follow the printed posts; unnamed posts remain
Student 1 / Student 2. Source posts are explicitly labeled English summaries.
Optional people, dates and other additions in model emails are fictional practice
details. Explanations give English reasoning with Japanese support and glossary
phrases; the optional ChatGPT revision request asks for approximately 60% English
and 40% Japanese and Japanese glosses for difficult vocabulary.

Only curated exercise data, models, guides and page references are published.
No source PDF, scans, private paths, file IDs, source hashes, unformatted OCR or
handwritten answers belong in the public repository.

## Grading, review and persistence

Sentence grading accepts the listed natural alternatives. Repeated identical
tiles can be selected in either physical order. Grammar exercises use a single
defensible choice and explicitly distinguish it from the three distractors.
Every listed alternative is visible in the answer review.

Free-response tasks use task-specific checklists, an editorial model and
explanation, a snapshot of the submitted response, and manual review status.
Word count and checked boxes never produce a score. The optional ChatGPT link
copies a revision request only when clicked; it never sends drafts automatically.
Any explicitly requested rubric estimate is labeled unofficial.

Drafts, notes, the last five submitted versions, self-checks and optional 7/10
minute timers use a Writing-specific browser-storage key. Timers use absolute
deadlines, survive reloads, pause when changing exercises and retain text when
expired. Storage failure offers a plain-text download. Catalog search, type
filters and completed-item filters work for all four exercise types. Daily
original exercises have separate provenance and cannot count toward PDF coverage.

## Validation on October 4, 2026

- All 113 Python tests passed, including 10 Writing content and coverage tests.
- The Reading bank builder and Hugo build succeeded.
- The Writing DOM suite verified all 215 exercises: all 156 sentence keys,
  all listed alternatives and wrong-answer paths; all 30 grammar keys and every
  wrong choice; and all 29 essay models, review checklists and saved submissions.
- The Writing DOM suite also checked guides, source/editorial notes, original
  provenance, drafts/notes/revisions, invalid saved choices, timer
  pause/reload/expiry, download, filtering, safe plain-text rendering,
  storage/network failures and the optional ChatGPT bridge.
- The Reading DOM suite verified all 3,651 questions in suffix, full-word and
  wrong-answer modes, all explanations, grouped passages, review/pagination,
  storage restoration and corrupt-data recovery. Existing Reading progress
  remains intact.

Validation commands:

```sh
python3 -m unittest discover -s tests -p 'test_*.py'
python3 scripts/build_english_quiz_bank.py
hugo build --gc --minify --destination /tmp/toefl-writing-build
NODE_PATH=<jsdom>/node_modules TOEFL_HTML=/tmp/toefl-writing-build/toefl/index.html node tests/verify_writing_dom.cjs
NODE_PATH=<jsdom>/node_modules TOEFL_HTML=/tmp/toefl-writing-build/toefl/index.html node tests/verify_toefl_dom.cjs
```

DOM checks use a separate fixture simulating the documented successful-auth
event. They never change or bypass production authentication. Content tests
also run in Pages CI. Responsive CSS provides two task columns, a stacked
workspace on smaller screens, keyboard focus and wrapping for long content.

The public page requires the existing study password. The current browser has
no authenticated study session, so **live visual and interaction verification
after login remains pending**. Its URL policy also prevents opening the isolated
local fixture. No authentication or browser protection was changed to work around
that restriction. The complete DOM checks validate content and behavior, but do
not replace an authenticated desktop/mobile screenshot review.

## Reading verification still pending

Reading remains at 3,651 published answers (1,040 legacy and 2,593 PDF answers,
plus the existing quick exercises). The original-image rechecks of Task 3 PDF
pages 84–154 (71 pages) and the unresolved Phototropism EXCEPT item
`pdf:task3:p089:q17` are separate from Writing completion. The latter requires
original PDF page 89 (printed page 289) and publisher answer/explanation page 481.
Temporary source-download HTTP 502 failures are not proof of a permanent missing
source. Publisher answer pages referenced by the Reading material remain
unprovided; inferred keys must retain their visible editorial status.
