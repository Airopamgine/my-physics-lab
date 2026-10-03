# Reading source migration audit — 2026-10-03

The normal page is https://airopamgine.github.io/my-physics-lab/toefl/.
This audit does **not** declare the entire migration or publisher-key validation complete.

## Coverage

- Existing material: all 1,040 original question references are converted, without duplicates.
- PDF material: 2,593 answers are published; 409 of 410 pages have complete text/item coverage.
- Catalog: 305 sets / 3,651 auto-graded answers, including the 18 previously formatted answers.
- This batch: 114 Task 3 answers in 23 original passages. All passage paragraphs, four choices,
  source question order and insertion positions are retained, with corrected obvious OCR errors.
- All six PDFs have been read through their last available page. Non-exercise covers, topic
  background and blank pages are explicitly inventoried rather than counted as questions.

## Unresolved original item

`pdf:task3:p089:q17` (printed page 289, Phototropism) asks for an EXCEPT choice, but all four
available choices have support in the passage: increased energy production, optimized crop
layouts, maximized sunlight absorption and redistribution of plant hormones.
No answer is guessed. This reference stays in the inventory but is not in the published bank.
The builder rejects any attempt to publish it while the blocker remains.
Needed: a readable image of PDF page 89 and the publisher's answer/explanation on printed page 481.

## Verification limits

- Original PDF downloads currently fail with a temporary HTTP 502 error. Text was accessible,
  but source-image rechecks for Task 3 PDF pages 84–154 remain pending (71 pages).
- The publisher's answer/explanation pages have not been provided. The new sections refer to
  printed answer pages 481, 483, 486, 489, 492 and 495. Published answers are evidence-based
  editorial answers, not verified publisher answers. All six `answerKeyAvailable` flags stay false.
- The live browser reached and visually inspected the normal page's study-password entrance.
  No credentials were entered or authentication bypassed. Authenticated desktop/mobile visual
  checks remain pending; the DOM fixture checks below are not a substitute for visual screenshots.
- The completion flag stays false while the original item or image rechecks are unresolved.
  Existing automated work must not invent replacement questions or claim completion.

## Passed checks

- `python3 scripts/build_english_quiz_bank.py`: all source references, option labels and blank lengths valid.
- `python3 -m unittest discover -s tests -p 'test_*.py'`: 103 tests passed.
- Hugo production build: 155 pages, no build error.
- `tests/verify_toefl_dom.cjs`, against the built normal-page HTML and actual application script:
  all 3,651 answers in correct-suffix, correct-full-word and incorrect modes (10,953 submissions).
  Checked all passages, prompts, choices and explanation rendering; disabled empty submissions;
  correct/wrong feedback; final scores; 1,714 Task 1 passage groups per pass without premature
  feedback; uppercase/full-width/outer-space normalization; saved-progress restoration; review
  queues; search/no-results; Task 1/2/3 filters; pagination; corrupt-storage recovery.
- No answer-label mismatch, duplicate question ID or duplicate source reference was found.
- No private PDF, unformatted OCR, private cache path, attachment ID or source-file hash is included.

The system checks prove the grading/rendering logic for the published bank; they do not establish
the correctness of an unavailable publisher answer key or the appearance of an authenticated browser.
