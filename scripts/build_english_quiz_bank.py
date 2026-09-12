#!/usr/bin/env python3
"""Build the interactive English question bank from existing Hugo posts.

The source posts remain the canonical copy. This script converts their stable
heading structure into JSON for the browser app and fails loudly when a source
file no longer matches the expected format.
"""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Iterable


FRONT_MATTER_RE = re.compile(r"\A---\s*\n(.*?)\n---\s*\n", re.DOTALL)
QUESTION_HEADING_RE = re.compile(r"^(?P<marks>#{3,4})\s+問(?P<number>\d+)(?:[：:]\s*(?P<label>.*))?\s*$")
OPTION_RE = re.compile(r"^\s*[-*]\s+\(([A-D])\)\s*(.+?)\s*$")
CORRECT_RE = re.compile(r"正解\s*[：:]?\s*\(?([A-D])\)?", re.IGNORECASE)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--content-dir", default="content/posts")
    parser.add_argument("--output", default="static/data/english-question-bank.json")
    parser.add_argument("--pretty", action="store_true")
    return parser.parse_args()


def front_matter_value(front_matter: str, key: str) -> str:
    match = re.search(rf'^\s*{re.escape(key)}\s*:\s*["\']?(.*?)["\']?\s*$', front_matter, re.MULTILINE)
    return match.group(1).strip() if match else ""


def clean_lines(lines: Iterable[str], *, strip_quotes: bool = False) -> str:
    cleaned: list[str] = []
    for raw in lines:
        line = raw.rstrip()
        if line.strip() == "---":
            continue
        if strip_quotes:
            line = re.sub(r"^\s*>\s?", "", line)
        cleaned.append(line)

    while cleaned and not cleaned[0].strip():
        cleaned.pop(0)
    while cleaned and not cleaned[-1].strip():
        cleaned.pop()
    return "\n".join(cleaned)


def find_heading(lines: list[str], pattern: str, start: int = 0) -> int:
    regex = re.compile(pattern)
    for index in range(start, len(lines)):
        if regex.match(lines[index]):
            return index
    return -1


def numbered_blocks(lines: list[str], heading_level: int) -> dict[int, dict[str, object]]:
    blocks: dict[int, dict[str, object]] = {}
    positions: list[tuple[int, re.Match[str]]] = []
    marks = "#" * heading_level

    for index, line in enumerate(lines):
        match = QUESTION_HEADING_RE.match(line)
        if match and match.group("marks") == marks:
            positions.append((index, match))

    for position_index, (start, match) in enumerate(positions):
        end = len(lines)
        for candidate in range(start + 1, len(lines)):
            if re.match(rf"^{re.escape(marks)}\s+", lines[candidate]):
                end = candidate
                break
        number = int(match.group("number"))
        blocks[number] = {
            "label": (match.group("label") or "").strip(),
            "lines": lines[start + 1 : end],
        }
    return blocks


def parse_options(lines: list[str]) -> tuple[str, list[dict[str, str]]]:
    prompt_lines: list[str] = []
    options: list[dict[str, str]] = []
    for line in lines:
        match = OPTION_RE.match(line)
        if match:
            options.append({"label": match.group(1), "text": match.group(2).strip()})
        else:
            prompt_lines.append(line)
    return clean_lines(prompt_lines, strip_quotes=True), options


def parse_notes(lines: list[str]) -> list[dict[str, str]]:
    notes: list[dict[str, str]] = []
    for line in lines:
        match = re.match(r"^\s*[-*]\s+(?:\*\*)?(.+?)(?:\*\*)?\s*[：:]\s*(.+?)\s*$", line)
        if match:
            notes.append({"term": match.group(1).strip(" *`"), "definition": match.group(2).strip()})
    return notes


def classify(path: Path) -> tuple[str, str]:
    name = path.name
    if "-vocabulary-" in name:
        return "Vocabulary", "A2–B1"
    if "-advanced-" in name:
        return "Advanced Reading", "B2–C1"
    if "-academic-" in name:
        return "Academic Reading", "B2"
    if "-standard-" in name:
        return "Standard Reading", "B1–B2"
    return "Foundation Reading", "A2–B1"


def parse_post(path: Path) -> dict[str, object]:
    source = path.read_text(encoding="utf-8")
    front_match = FRONT_MATTER_RE.match(source)
    if not front_match:
        raise ValueError(f"{path}: missing YAML front matter")

    front_matter = front_match.group(1)
    title = front_matter_value(front_matter, "title")
    date = front_matter_value(front_matter, "date")
    lines = source[front_match.end() :].splitlines()
    collection, level = classify(path)
    is_vocabulary = collection == "Vocabulary"

    answer_start = find_heading(lines, r"^##\s+解答と詳しい解説\s*$")
    if answer_start < 0:
        raise ValueError(f"{path}: missing answer section")

    if is_vocabulary:
        question_start = find_heading(lines, r"^##\s+問題\s*$")
        if question_start < 0:
            raise ValueError(f"{path}: missing vocabulary question section")
        question_lines = lines[question_start + 1 : answer_start]
        question_blocks = numbered_blocks(question_lines, 3)
        passage = ""
        notes: list[dict[str, str]] = []
    else:
        problem_start = find_heading(lines, r"^##\s+問題[：:].+$")
        notes_start = find_heading(lines, r"^###\s+語注\s*$", max(problem_start, 0))
        question_start = find_heading(lines, r"^###\s+設問\s*$", max(notes_start, 0))
        if min(problem_start, notes_start, question_start) < 0:
            raise ValueError(f"{path}: missing passage, notes, or question section")
        passage = clean_lines(lines[problem_start + 1 : notes_start], strip_quotes=True)
        notes = parse_notes(lines[notes_start + 1 : question_start])
        question_lines = lines[question_start + 1 : answer_start]
        question_blocks = numbered_blocks(question_lines, 4)

    answer_blocks = numbered_blocks(lines[answer_start + 1 :], 3)
    expected_questions = 25 if is_vocabulary else 9
    if len(question_blocks) != expected_questions:
        raise ValueError(f"{path}: expected {expected_questions} questions, found {len(question_blocks)}")

    questions: list[dict[str, object]] = []
    for number in sorted(question_blocks):
        question_block = question_blocks[number]
        answer_block = answer_blocks.get(number)
        if not answer_block:
            raise ValueError(f"{path}: question {number} has no answer block")

        prompt, options = parse_options(question_block["lines"])
        if options and not prompt:
            label = question_block["label"] or "内容"
            prompt = f"{label}について、本文と最もよく一致する選択肢を選びなさい。"
        answer_markdown = clean_lines(answer_block["lines"], strip_quotes=True)
        answer_search_text = f'{answer_block["label"]}\n{answer_markdown}'
        correct_match = CORRECT_RE.search(answer_search_text)
        correct_label = correct_match.group(1).upper() if correct_match else None

        if options and not correct_label:
            raise ValueError(f"{path}: multiple-choice question {number} has no detectable answer")
        if correct_label and correct_label not in {option["label"] for option in options}:
            raise ValueError(f"{path}: answer {correct_label} missing from question {number} options")

        questions.append(
            {
                "id": f"{path.stem}-q{number}",
                "number": number,
                "label": question_block["label"] or f"Question {number}",
                "prompt": prompt,
                "options": options,
                "correct": correct_label,
                "answerTitle": answer_block["label"],
                "answer": answer_markdown,
            }
        )

    return {
        "id": path.stem,
        "title": title,
        "date": date,
        "collection": collection,
        "level": level,
        "passage": passage,
        "notes": notes,
        "sourceUrl": f"/posts/{path.stem}/",
        "questions": questions,
    }


def build_reading_feed(source_dir: Path, output_path: Path) -> dict:
    """Validate small, original reading batches and compile the browser bank."""
    sets = []
    seen_ids = set()
    for path in sorted(source_dir.glob("*.json")):
        item = json.loads(path.read_text(encoding="utf-8"))
        set_id = item["id"]
        if set_id != path.stem or not re.fullmatch(r"reading-\d{8}-\d{4}", set_id):
            raise ValueError(f"{path}: id must match reading-YYYYMMDD-HHMM filename")
        if set_id in seen_ids:
            raise ValueError(f"{path}: duplicate id")
        seen_ids.add(set_id)
        date = datetime.fromisoformat(item["date"])
        if date.utcoffset() is None:
            raise ValueError(f"{path}: date needs timezone")
        if not item["title"].strip() or item["level"] not in ("B1–B2", "B2", "B2–C1"):
            raise ValueError(f"{path}: missing title or invalid level")
        if len(item["questions"]) != 10:
            raise ValueError(f"{path}: expected exactly 10 questions")
        questions = []
        type_counts = {"words": 0, "daily": 0, "academic": 0, "vocabulary": 0}
        for number, q in enumerate(item["questions"], 1):
            category = q["category"]
            if category not in type_counts:
                raise ValueError(f"{path}: unsupported category {category}")
            type_counts[category] += 1
            passage = item["passages"][q["passageId"]]
            if not all(isinstance(v, str) and v.strip() for v in (passage, q["prompt"], q["answer"])):
                raise ValueError(f"{path}: question {number} needs passage, prompt and explanation")
            question = {
                "id": f"{set_id}-q{number}", "number": number,
                "label": {"words": "Complete the Words", "daily": "Read in Daily Life",
                          "academic": "Read an Academic Passage", "vocabulary": "Vocabulary in Context"}[category],
                "prompt": q["prompt"], "passage": passage, "answer": q["answer"],
                "options": [], "correct": None,
            }
            if category == "words":
                word, prefix = q["word"], q["prefix"]
                if not re.fullmatch(r"[a-z]+", word) or not re.fullmatch(r"[a-z]+", prefix) or not word.startswith(prefix) or len(prefix) >= len(word):
                    raise ValueError(f"{path}: invalid word/prefix in question {number}")
                blank = prefix + "_" * (len(word) - len(prefix))
                pattern = rf"(?<![A-Za-z]){re.escape(blank)}(?!_)"
                if not re.search(pattern, passage) or not re.search(pattern, q["prompt"]):
                    raise ValueError(f"{path}: missing or incorrectly sized blank in question {number}")
                question["acceptedAnswers"] = [word[len(prefix):], word]
            else:
                options = q["options"]
                if len(options) != 4 or {o["label"] for o in options} != set("ABCD"):
                    raise ValueError(f"{path}: expected four A-D options in question {number}")
                texts = [o["text"].strip() for o in options]
                if not all(texts) or len(set(texts)) != 4 or q["correct"] not in "ABCD" or len(q["correct"]) != 1:
                    raise ValueError(f"{path}: invalid answer/options in question {number}")
                question.update(options=options, correct=q["correct"])
            questions.append(question)
        if type_counts != {"words": 3, "daily": 3, "academic": 3, "vocabulary": 1}:
            raise ValueError(f"{path}: expected words/daily/academic/vocabulary counts 3/3/3/1")
        sets.append({"id": set_id, "title": item["title"], "date": date.isoformat(),
                     "level": item["level"], "collection": "Reading Practice",
                     "passage": "", "notes": [], "sourceUrl": "", "questions": questions})
    if not sets:
        raise ValueError(f"No reading batches found in {source_dir}")
    sets.sort(key=lambda item: datetime.fromisoformat(item["date"]), reverse=True)
    payload = {"schemaVersion": 1, "setCount": len(sets), "questionCount": len(sets) * 10,
               "autoGradedCount": len(sets) * 10, "selfCheckCount": 0, "sets": sets}
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Built Reading feed: {len(sets)} sets / {len(sets) * 10} auto-graded questions")
    return payload


def main() -> None:
    args = parse_args()
    content_dir = Path(args.content_dir)
    output_path = Path(args.output)
    paths = sorted(content_dir.glob("english-*.md"))
    if not paths:
        raise SystemExit(f"No English source posts found in {content_dir}")

    sets = [parse_post(path) for path in paths]
    question_count = sum(len(item["questions"]) for item in sets)
    auto_graded_count = sum(
        1 for item in sets for question in item["questions"] if question["options"]
    )
    payload = {
        "schemaVersion": 1,
        "setCount": len(sets),
        "questionCount": question_count,
        "autoGradedCount": auto_graded_count,
        "selfCheckCount": question_count - auto_graded_count,
        "sets": sets,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    if args.pretty:
        encoded = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    else:
        encoded = json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n"
    output_path.write_text(encoded, encoding="utf-8")
    print(
        f"Built {len(sets)} sets / {question_count} questions "
        f"({auto_graded_count} auto-graded, {question_count - auto_graded_count} self-check)"
    )
    repo_root = Path(__file__).resolve().parent.parent
    build_reading_feed(repo_root / "data/toefl-reading", repo_root / "static/data/toefl-reading-bank.json")


if __name__ == "__main__":
    main()
