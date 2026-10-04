# Daily study menu

The owner requested a balanced daily menu so that choosing what to practise is
easy and the routine develops skills needed for B2. The normal `/toefl/` page
now leads with eight steps and a single next-step button. It reuses the reviewed
Reading/Writing banks; it does not create replacement Reading material, change
source coverage, or count a menu selection as a new exercise.

| Daily step | Practice | Completion record |
| --- | --- | --- |
| Word completion | About eight answers; vocabulary and complete passages alternate | Submit answers, then advance after reviewing explanations |
| Everyday reading | About three source questions | Submit and review |
| Academic reading | About five source questions, with the original passage and question order | Submit and review |
| Sentence/grammar | Three sentence tasks and one grammar task | Grade, review, then advance through the guided queue |
| Extended writing | Email and discussion alternate daily | Submit the current draft, complete every self-check, and mark it reviewed |
| Listening | A British Council B2 recording and comprehension tasks in a separate tab | Learner confirms listening, answer comparison and replay, with a note |
| Speaking | Explain a discussion position, respond to a different view and ask a follow-up | Learner confirms actual speech, reasons/examples and response, with a note |
| Review | Due answers with mistakes prioritised; otherwise recall and use three words from today's completed Task 1 | Existing grading/review, or explicit vocabulary self-check |

The estimated total is normally around an hour. Whole completion passages can
contain ten blanks; they are never cut to fit an exact quota. A long academic
group receives a longer estimate. Menu progress counts checked/reviewed work,
including errors; it is not an accuracy score, Writing score or CEFR assessment.
Essays, speaking and external listening are explicitly self-reviewed.

The focus cycles through main ideas, evidence, cause/effect, comparison,
inference, responding to viewpoints, summarising and transferring skills.
The default reading route moves from foundation to bridging practice after
14 complete study days and B2 practice after 28 complete days. These are
curriculum stages, not a measured proficiency upgrade. Time passing without
study does not advance the route. An explicit B2 practice preference takes
effect the following day. The weekly reflection records five separate skills,
including real interaction; actual conversation and unfamiliar tasks are
recommended for checking whether the skills transfer beyond a familiar menu.

The Council of Europe's CEFR self-assessment grid and 2020 Companion Volume
were consulted for skill coverage. The app uses editorial practice instructions,
not copied descriptors or a promise that completing a fixed number of days
certifies B2:

- https://www.coe.int/en/web/common-european-framework-reference-languages/table-2-cefr-3.3-common-reference-levels-self-assessment-grid
- https://rm.coe.int/cefr-companion-volume-with-new-descriptors-2020/16809ea0d4
- https://learnenglish.britishcouncil.org/free-resources/listening/b2

The British Council catalogue and its twelve linked lesson pages are public
references. Recordings, transcripts and answer keys are used on the provider's
own site; none are republished. Links have a B2 catalogue fallback and are
marked as external. The app does not fetch external learner results or treat
opening a link as completing the listening activity.

## Selection and persistence

Selections favour the least-exposed eligible sets and items. Reading 1 rotates
vocabulary/passages, Reading 2 covers everyday document sets, Reading 3 uses
the current practice level, and Writing types remain balanced independently of
their different bank sizes. Full passages, source IDs, question order, listed
solutions/alternatives and editorial-source notices remain intact. New original
Writing IDs automatically enter the eligible pool, while a saved day's menu
stays fixed after a bank update.

The local-calendar date determines the menu. Selections, partial completion,
self-check notes, a speech timer and weekly reflection are stored under
`mastersPhysicsLab.dailyStudy.v1`. Existing Reading/Writing storage keys remain
unchanged. A late answer retains the date of its launched session rather than
completing the new day's work. Same-day retries cannot inflate spaced-review
intervals. Review candidates use 1, 3, 7, 14 and 30 days; incorrect answers reset
to one day, and excess candidates roll over when only one review slot is used.
Corrupt records and unavailable storage have visible recovery/download paths.
The download contains learner records and menu IDs, not the private source PDFs.

Reading and Writing expose small guided-selection interfaces and report actual
answer/review events. Daily completion requires a new answer or submission
within a menu-launched session; reopening an old saved result is insufficient.
The guided Writing queue also survives a reload. Starting another menu skill
pauses the Writing timer while retaining drafts and submitted versions.
All bank/menu loading remains behind the existing successful-auth event.

## Verification

`tests/verify_daily_study.cjs` exercises a full day using the real Reading and
Writing runners, including a wrong answer, all source gap groups, the mixed
Writing queue, fresh essay submission and self-checks, external-link confirmation,
spoken-practice timer, notes, reflection and download. It also checks sixty days
of rotation, stable reloads, complete-stage progression, next-day mistakes,
same-day review intervals, late sessions, date rollover/DST, invalid records,
unavailable items and network/quota failures. The test runs in an isolated DOM
fixture and never modifies production authentication.

All 113 Python tests and the Hugo build passed. The daily integration suite
passed in Europe/Warsaw, Asia/Tokyo and America/Los_Angeles, including sixty
calendar days in each timezone. It covered all 24 eligible everyday-reading
sets, all 156 sentence exercises and all 12 recordings before repeats. Partial
Writing sessions and new-bank eligibility were also checked. The full Writing
DOM suite passed for all 215 exercises, and the Reading DOM suite passed for all
3,651 answers in missing-letter, full-word and wrong-answer modes, with all
explanations and source passage groups. All twelve external lesson pages
returned HTTP 200 and exposed an audio player. Built HTML has unique IDs,
connected form labels and the existing protected-app boundary; the daily menu
appears only on the normal page.

Validation commands:

```sh
python3 -m unittest discover -s tests -p 'test_*.py'
python3 scripts/build_english_quiz_bank.py
hugo build --gc --minify --destination /tmp/toefl-daily-build
NODE_PATH=<jsdom>/node_modules TOEFL_HTML=/tmp/toefl-daily-build/toefl/index.html TZ=Europe/Warsaw node tests/verify_daily_study.cjs
NODE_PATH=<jsdom>/node_modules TOEFL_HTML=/tmp/toefl-daily-build/toefl/index.html TZ=Asia/Tokyo node tests/verify_daily_study.cjs
NODE_PATH=<jsdom>/node_modules TOEFL_HTML=/tmp/toefl-daily-build/toefl/index.html TZ=America/Los_Angeles node tests/verify_daily_study.cjs
NODE_PATH=<jsdom>/node_modules TOEFL_HTML=/tmp/toefl-daily-build/toefl/index.html node tests/verify_writing_dom.cjs
NODE_PATH=<jsdom>/node_modules TOEFL_HTML=/tmp/toefl-daily-build/toefl/index.html node tests/verify_toefl_dom.cjs
```

The normal live page was opened and shows the existing study-password entrance.
No authenticated session is available. Therefore desktop/mobile visual inspection
after login remains pending; complete DOM/behavior checks and responsive CSS
do not substitute for that inspection. Authentication was not changed or bypassed.
The existing Reading source-image/key blockers remain recorded in the Reading
workflow; this menu does not resolve them or alter source migration totals.
