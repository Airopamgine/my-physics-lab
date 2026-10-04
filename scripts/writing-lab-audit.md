# Writing Lab: selected exercises and verification

The normal `/toefl/` page now includes 30 selected exercises from the supplied
`TOEFL-writing.pdf` (139 PDF pages). This is an enriched Writing section, not a
claim that every exercise in the booklet has been migrated.

| Task | Selection | Source PDF pages | Answers |
| --- | --- | --- | --- |
| Build a Sentence | Diagnostic questions 1–10 | 10–11 | Printed Sample Answers, PDF 16 |
| Write an Email | Diagnostic; Practice Tests 1–9 | 12, 31, 46, 57, 70, 79, 88, 97, 106, 115 | Editorial models with task-specific Japanese explanations |
| Academic Discussion | Diagnostic; Tests 1–8 and 10 | 14–15, 33–34, 48–49, 59–60, 72–73, 81–82, 90–91, 99–100, 108–109, 124–125 | Editorial models, not unique correct answers |

Source prompts, task conditions, sentence phrases, source keys, and discussion
participants were checked against the private page images. Student posts are
faithful English summaries and visibly labeled as summaries. The source's
financial-aid email has an inconsistent recipient line; the exercise follows
the Financial Aid Office named in its situation, with an explicit editorial
note. The group-meeting prompt's final bullet is cut off after “counter-”;
the task condition is transparently rendered as voting on the proposed times
or suggesting an alternative. Names, identifiers, and optional details in
model emails are fictional.
No handwritten student answers, scans, source PDF, or unformatted OCR are
published. The public bank contains curated exercise data and page references.

Free-response review uses task-specific checklists, an editorial model and
explanation, a snapshot of the submitted response, and manual review status.
Word count and checked boxes never produce a score. The optional ChatGPT link
copies a revision request only when clicked; it does not automatically submit
answers. It requests explanation of task fulfillment and language use, and
labels any explicitly requested rubric estimate unofficial.

Drafts, notes, the last five submitted versions, self-checks and optional 7/10
minute timers use a Writing-specific browser-storage key. Existing Reading
progress and authentication are unchanged. Timers use absolute deadlines,
survive reloads, pause when changing exercises, and retain text when expired.
If storage is unavailable, the page warns and offers a plain-text download.

Validation commands:

```sh
python3 -m unittest discover -s tests -p 'test_*.py'
python3 scripts/build_english_quiz_bank.py
hugo build --gc --minify --destination /tmp/toefl-writing-build
NODE_PATH=<jsdom>/node_modules TOEFL_HTML=/tmp/toefl-writing-build/toefl/index.html node tests/verify_writing_dom.cjs
NODE_PATH=<jsdom>/node_modules TOEFL_HTML=/tmp/toefl-writing-build/toefl/index.html node tests/verify_toefl_dom.cjs
```

DOM checks run against a separate fixture that simulates the app's documented
successful-auth event. They never alter or bypass production authentication.
They exercise every selected Writing model and sentence key, wrong answers,
word counting, draft/notes/revision persistence, timer pause/reload/expiry,
manual status, source display, plain-text rendering, download, search/filter,
and storage/network failure recovery. Source/content tests run in Pages CI.

The public page requires the existing study password. The current browser has
no authenticated study session, so live interaction after login remains a
separate check. The isolated local fixture cannot be opened by this cloud
browser's URL policy; no production authentication or browser protection was
changed to work around that restriction. DOM validation verifies all task
content and interactions, but does not substitute for a live screenshot check.
