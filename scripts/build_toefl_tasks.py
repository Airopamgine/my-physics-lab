"""Compile verified task sets and source-level migration coverage."""
import copy
import json
import re
from datetime import datetime
from pathlib import Path

TASK_NAMES = {1: "Complete the Words", 2: "Read in Daily Life", 3: "Read an Academic Passage"}


def build_task_catalog(repo: Path, legacy_bank: dict, feed: dict) -> dict:
    catalog = []
    seen_ids, covered_refs = set(), set()
    source_index = json.loads((repo / "scripts/reading-source-index.json").read_text())
    sources = {s["id"]: s for s in source_index["sources"]}
    pdf_count = 0
    for path in sorted((repo / "data/toefl-migration").glob("*.json")):
        source = json.loads(path.read_text())
        if source["id"] != path.stem or source["task"] not in TASK_NAMES:
            raise ValueError(f"{path}: invalid set ID/task")
        if not source["questions"] or not source["title"].strip():
            raise ValueError(f"{path}: empty set")
        if datetime.fromisoformat(source["date"]).utcoffset() is None:
            raise ValueError(f"{path}: date needs timezone")
        questions = []
        for i, q in enumerate(source["questions"], 1):
            prompt, explanation = q["prompt"], q["answer"]
            passage = source["passages"][q["passageId"]]
            if not all(v.strip() for v in (prompt, explanation, passage)):
                raise ValueError(f"{path}: question {i} missing text")
            if re.search(r"[ぁ-んァ-ヶ一-龥]", prompt):
                raise ValueError(f"{path}: TOEFL question prompts must be in English")
            refs = q["sourceRefs"]
            if not refs or len(set(refs)) != len(refs):
                raise ValueError(f"{path}: question {i} needs unique source references")
            for ref in refs:
                if ref in covered_refs:
                    raise ValueError(f"{path}: source already converted: {ref}")
                if ref.startswith("legacy:"):
                    raise ValueError(f"{path}: existing English-source conversions are excluded from TOEFL")
                match = re.fullmatch(r"pdf:([a-z0-9-]+):p(\d+):q([a-zA-Z0-9-]+)", ref)
                if not match or match[1] not in sources or not 1 <= int(match[2]) <= sources[match[1]]["pageCount"]:
                    raise ValueError(f"{path}: invalid PDF reference {ref}")
                covered_refs.add(ref)
            question = {"id": f'{source["id"]}-q{i}', "number": i,
                        "label": TASK_NAMES[source["task"]], "prompt": prompt,
                        "passage": passage, "answer": explanation, "options": [],
                        "correct": None, "sourceRefs": refs}
            if source["task"] == 1:
                word, prefix = q["word"], q["prefix"]
                if not re.fullmatch(r"[A-Za-z]+", word) or not re.fullmatch(r"[A-Za-z]+", prefix) or not word.lower().startswith(prefix.lower()) or len(prefix) >= len(word):
                    raise ValueError(f"{path}: invalid completion")
                blank = prefix + "_" * (len(word) - len(prefix))
                if not re.search(rf"(?<![A-Za-z]){re.escape(blank)}(?!_)", passage):
                    raise ValueError(f"{path}: blank length/spelling mismatch")
                question["acceptedAnswers"] = [word[len(prefix):], word]
            else:
                options = q["options"]
                if len(options) != 4 or set(o["label"] for o in options) != set("ABCD"):
                    raise ValueError(f"{path}: four A-D options required")
                if len({o["text"].strip() for o in options}) != 4 or any(not o["text"].strip() for o in options):
                    raise ValueError(f"{path}: duplicate or empty options")
                if any(re.search(r"[ぁ-んァ-ヶ一-龥]", o["text"]) for o in options) or q["correct"] not in ("A", "B", "C", "D"):
                    raise ValueError(f"{path}: English choices and a valid answer required")
                question.update(options=options, correct=q["correct"])
            if question["id"] in seen_ids:
                raise ValueError(f"{path}: duplicate question ID")
            seen_ids.add(question["id"])
            pdf_count += any(ref.startswith("pdf:") for ref in refs)
            questions.append(question)
        catalog.append({"id": source["id"], "title": source["title"], "date": source["date"],
                        "collection": f'Task {source["task"]}', "level": source["level"],
                        "sourceLabel": source["sourceLabel"], "verificationNote": source.get("verificationNote", ""),
                        "sourceUrl": source.get("sourceUrl", ""), "passage": "", "notes": [], "questions": questions})
    # Preserve every already-published feed question and its progress ID; vocabulary
    # in an academic passage is part of Task 3, not a fourth Reading task.
    for original in feed["sets"]:
        for task in (1, 2, 3):
            selected = []
            for q in original["questions"]:
                q_task = 1 if q.get("acceptedAnswers") else 2 if q["label"] == TASK_NAMES[2] else 3
                if q_task == task:
                    if q["id"] in seen_ids:
                        raise ValueError("Duplicate feed question ID")
                    seen_ids.add(q["id"])
                    selected.append(copy.deepcopy(q))
            if selected:
                item = copy.deepcopy(original)
                item.update(id=f'{original["id"]}-task-{task}', collection=f"Task {task}",
                            sourceLabel="これまでの定期演習", questions=selected)
                catalog.append(item)
    quick_count = 0
    for original in json.loads((repo / "data/toefl-quick-reading.json").read_text()):
        task = next(k for k, v in TASK_NAMES.items() if v == original["task"])
        questions = []
        if original["kind"] == "complete":
            passage = original["passage"]
            for i, gap in enumerate(original["gaps"]):
                passage = passage.replace("{{"+str(i)+"}}", "_" * len(gap["answer"]))
            for i, gap in enumerate(original["gaps"]):
                prefix = gap["word"][:-len(gap["answer"])]
                questions.append({"id": f'{original["id"]}-gap-{i+1}', "number": i+1,
                                  "label": original["task"], "prompt": f'Complete {prefix}{"_"*len(gap["answer"])}.',
                                  "passage": passage, "acceptedAnswers": [gap["answer"],gap["word"]],
                                  "answer": f'正解：{gap["answer"]} → {gap["word"]}。'+original["explanationJa"],
                                  "options": [], "correct": None})
        else:
            questions.append({"id": original["id"], "number": 1, "label": original["task"],
                              "prompt": original["prompt"], "passage": original["passage"],
                              "options": [{"label":chr(65+i),"text":text} for i,text in enumerate(original["options"])],
                              "correct": chr(65+original["answer"]),
                              "answer": original["explanationJa"] + "\n\n" + original["explanation"]})
        for q in questions:
            if q["id"] in seen_ids:
                raise ValueError("Duplicate quick-practice question")
            seen_ids.add(q["id"])
        quick_count += len(questions)
        catalog.append({"id":"quick-"+original["id"],"title":original.get("prompt",original["task"]),
                        "collection":f"Task {task}","date":"2026-09-12T00:00:00+09:00","level":"B1–B2",
                        "sourceLabel":"これまでの通常演習","sourceUrl":"","passage":"","notes":[],"questions":questions})
    pdf_complete = all(len(s["reviewedPages"]) == s["pageCount"] for s in sources.values())
    migration = {"scope": "pdf-only",
                 "pdfPageTotal": sum(s["pageCount"] for s in sources.values()),
                 "pdfReviewedPages": sum(len(s["reviewedPages"]) for s in sources.values()),
                 "pdfPublished": pdf_count, "pdfTotalQuestions": pdf_count if pdf_complete else None,
                 "quickAlreadyFormatted": quick_count,
                 "answerKeysMissing": any(not s["answerKeyAvailable"] for s in sources.values()),
                 "complete": pdf_complete}
    for s in sources.values():
        if len(s["reviewedPages"]) != len(set(s["reviewedPages"])) or any(p < 1 or p > s["pageCount"] for p in s["reviewedPages"]):
            raise ValueError("Invalid reviewed page coverage")
        for page in s["reviewedPages"]:
            refs = s.get("pageItems", {}).get(str(page))
            if refs is None or len(refs) != len(set(refs)) or any(ref not in covered_refs for ref in refs):
                raise ValueError(f"Reviewed page {s['id']}:{page} lacks complete source-item coverage")
            actual = {ref for ref in covered_refs if ref.startswith(f"pdf:{s['id']}:p{page:03}:")}
            if set(refs) != actual:
                raise ValueError("Reviewed page item list does not match published source references")
    catalog.sort(key=lambda s: datetime.fromisoformat(s["date"]), reverse=True)
    count = sum(len(s["questions"]) for s in catalog)
    payload = {"schemaVersion": 1, "setCount": len(catalog), "questionCount": count,
               "autoGradedCount": count, "selfCheckCount": 0, "migration": migration, "sets": catalog}
    output = repo / "static/data/toefl-task-bank.json"
    output.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(f"Built task catalog: {len(catalog)} sets / {count} questions; PDF {pdf_count}")
    return payload
