#!/usr/bin/env python3
"""Index every published English field; no OCR, held answers, or learner drafts.

The index deliberately keeps surface forms. Dictionary senses are possibilities,
not an automatically inferred answer to the source question. Quizzes test a
standalone meaning; source excerpts are optional examples after answering.
"""
from __future__ import annotations

import hashlib
import html
import json
import re
import unicodedata
from collections import defaultdict
from pathlib import Path

WORD = re.compile(r"[A-Za-zÀ-ÖØ-öø-ÿĀ-ž]+(?:['-][A-Za-zÀ-ÖØ-öø-ÿĀ-ž]+)*")
JAPANESE = re.compile(r"[\u3040-\u30ff\u3400-\u9fff]")
FIELD_LABELS = {"passage": "本文", "prompt": "設問", "options": "選択肢", "answer": "解説",
                "context": "状況・問い", "requirements": "条件", "modelAnswer": "モデル答案",
                "explanation": "解説", "phrases": "重要表現", "posts": "学生の投稿",
                "tiles": "並べ替え語句", "frame": "文の固定部分", "choices": "選択肢",
                "subject": "件名", "to": "宛先", "professor": "教授", "notes": "語注",
                "items": "学習ガイド", "title": "見出し", "audioText": "音声スクリプト",
                "instruction": "指示", "answerWords": "完成文", "vocabulary": "語注"}


def clean(text: str) -> str:
    text = unicodedata.normalize("NFKC", html.unescape(str(text)))
    text = text.translate(str.maketrans({"’": "'", "‘": "'", "‐": "-", "‑": "-", "–": "-"}))
    text = re.sub(r"https?://\S+|[\w.+-]+@[\w.-]+\.[A-Za-z]+", " ", text)
    text = re.sub(r"<[^>]+>|\{\d+\}|\*|`", "", text)
    return re.sub(r"\s+", " ", text).strip()


def key(text: str) -> str:
    return clean(text).lower().strip(" .!?;:,…")


def quiz_glosses(glosses: list) -> list:
    # An editor definition supersedes contextual translations such as
    # "them = それらの惑星の周囲に". Preserve the original note in the notebook,
    # but do not turn its missing surrounding context into a word question.
    preferred = [g for g in glosses if g["kind"] == "editor"] or glosses
    output = []
    for g in preferred:
        match = JAPANESE.search(g["text"])
        if not match:
            continue
        # Japanese definitions can contain Latin variables (AとB) or a
        # contraction's expanded form (we are の短縮形). Split an editorial
        # English sentence only at its actual sentence boundary, never at the
        # first Japanese character in a mixed-language explanation.
        boundary = g["text"].rfind(". ", 0, match.start()) if g["kind"] == "editor" else -1
        start = boundary + 2 if boundary >= 0 else 0
        english = g["text"][:start].strip()
        japanese = g["text"][start:].strip()
        output.append({**g, "text": japanese, "english": english})
    return output


def words(text: str):
    for match in WORD.finditer(text):
        # A remaining partial cloze is not an English word. Its complete answer
        # is indexed separately, and reviewed neighboring gaps are restored below.
        if match.end() < len(text) and text[match.end()] == "_":
            continue
        yield match


def strings(value):
    if isinstance(value, str):
        yield value
    elif isinstance(value, list):
        for item in value:
            yield from strings(item)
    elif isinstance(value, dict):
        for name in ("text", "name", "term", "definition"):
            if name in value:
                yield from strings(value[name])


def restored(text: str, questions: list) -> str:
    for q in questions:
        answers = q.get("acceptedAnswers", [])
        if len(answers) < 2:
            continue
        full, suffix = answers[-1], answers[0]
        if full.endswith(suffix) and len(full) > len(suffix):
            prefix = full[:-len(suffix)]
            text = re.sub(rf"(?<![A-Za-z]){re.escape(prefix)}_+(?![A-Za-z_])", full, text,
                          flags=re.IGNORECASE)
    return text


def quick_exercises(repo: Path) -> list:
    # The literal, first-party quick-practice array also contains Listening.
    # Parse only its data literal; never execute site JavaScript in the builder.
    raw = (repo / "static/js/toefl.js").read_text()
    literal = raw.split("const QUESTIONS = ", 1)[1].split("\n  ];", 1)[0] + "\n  ]"
    literal = re.sub(r"(?m)(^\s*|[{,]\s*)([A-Za-z][A-Za-z0-9]*):", r'\1"\2":', literal)
    return json.loads(literal)


def corpus(repo: Path, reading: dict, legacy: dict, writing: dict) -> tuple[list, list]:
    documents, glosses = [], []
    by_id = {}

    def add(doc, fields):
        doc["fields"] = {name: [clean(s) for s in strings(value) if clean(s)]
                         for name, value in fields.items()}
        doc["fields"] = {name: texts for name, texts in doc["fields"].items() if texts}
        by_id[doc["id"]] = len(documents)
        documents.append(doc)
        return len(documents) - 1

    def gloss(term, definition, source):
        term = key(term)
        term = re.sub(r"\s*….*$", "", term).strip()
        if term and WORD.search(term) and len(term) <= 100 and JAPANESE.search(definition):
            glosses.append((term, clean(definition), source))

    for group in reading["sets"]:
        for q in group["questions"]:
            explanation = q.get("answer", "")
            if q.get("acceptedAnswers"):
                # Missing-letter answer fragments are scoring notation, not
                # standalone vocabulary (e.g. abitant -> inhabitant).
                explanation = re.sub(r"(?i)(?:正解[：:]\s*)?[A-Za-z]+\s*→\s*", "", explanation)
            fields = {"passage": restored(q.get("passage") or group.get("passage", ""), group["questions"]),
                      "prompt": restored(q["prompt"], [q]), "options": q["options"],
                      "answer": explanation}
            if q.get("acceptedAnswers"):
                fields["answerWords"] = q["acceptedAnswers"][-1]
            n = add({"id": q["id"], "title": f"{group['title']} · Q{q['number']}",
                     "engine": "reading", "groupId": group["id"], "category": group["collection"],
                     "sourceRefs": q.get("sourceRefs", []), "sourceUrl": group.get("sourceUrl", "")}, fields)
            # Only explicit Japanese gloss notation; never infer a translation
            # from the correct choice or from semantic similarity.
            if q.get("acceptedAnswers"):
                term = q["acceptedAnswers"][-1]
                answer = clean(q.get("answer", ""))
                patterns = [rf"{re.escape(term)}[（(]([^）)]+)[）)]",
                            r"学習語[^。]*。「([^」]+)」",
                            rf"{re.escape(term)}\s*は「([^」]+)」"]
                for pattern in patterns:
                    match = re.search(pattern, answer, flags=re.IGNORECASE)
                    if match:
                        gloss(term, match[1], n)
                        break

    # Original posts' notes and unconverted wording are additional checked fields.
    # They are not added to the Reading migration question count.
    for group in legacy["sets"]:
        n = add({"id": "notes:" + group["id"], "title": group["title"] + " · 元教材・語注",
                 "engine": "reference", "groupId": group["id"], "category": "元教材・語注",
                 "sourceRefs": ["legacy:" + q["id"] for q in group["questions"]],
                 "sourceUrl": group["sourceUrl"]},
                {"passage": group["passage"], "notes": group["notes"],
                 "prompt": [q["prompt"] for q in group["questions"]],
                 "options": [q["options"] for q in group["questions"]],
                 "answer": [q["answer"] for q in group["questions"]]})
        for note in group["notes"]:
            gloss(note["term"], note["definition"], n)

    writing_fields = ("title", "prompt", "context", "requirements", "modelAnswer", "explanation",
                      "phrases", "posts", "tiles", "frame", "choices", "subject", "to", "professor")
    for q in writing["exercises"]:
        fields = {field: q.get(field, []) for field in writing_fields}
        if q.get("posts"):
            # A student's name needs the associated post as context, rather
            # than an isolated three-letter name with no learnable prompt.
            fields["posts"] = [f"{post['name']}: {post['text']}" for post in q["posts"]]
        n = add({"id": q["id"], "title": q["title"], "engine": "writing", "groupId": q["collection"],
                 "category": "Writing", "sourceRefs": q["sourceRefs"], "sourceUrl": ""},
                fields)
        for phrase in q.get("phrases", []):
            if " — " in phrase:
                term, definition = phrase.split(" — ", 1)
                gloss(term, definition, n)
    for guide in writing["guides"]:
        add({"id": "guide:" + guide["id"], "title": guide["title"], "engine": "reference",
             "groupId": guide["id"], "category": "Writing", "sourceRefs": [], "sourceUrl": ""},
            {"title": guide["title"], "items": guide["items"]})
    for q in quick_exercises(repo):
        q = dict(q)
        for name in ("passage", "prompt"):
            text = q.get(name, "")
            for j, gap in enumerate(q.get("gaps", [])):
                prefix = gap["word"][:-len(gap["answer"])]
                text = re.sub(re.escape(prefix) + re.escape(f"{{{{{j}}}}}"), gap["word"], text)
            q[name] = text
        n = add({"id": "quick:" + q["id"], "title": q["task"], "engine": "quick", "groupId": q["id"],
                 "category": q["section"], "sourceRefs": [], "sourceUrl": ""},
                {name: q.get(name, []) for name in ("passage", "prompt", "options", "instruction", "audioText",
                                                  "explanation", "explanationJa", "answerWords", "tiles")})
        doc = documents[n]
        for term, ja, en in q.get("vocabulary", []):
            gloss(term, ja, n)
            doc["fields"].setdefault("vocabulary", []).append(clean(f"{term} — {en} {ja}"))
    return documents, glosses


def snippet(text: str, term: str):
    if " " not in term:
        match = next((m for m in words(text) if key(m[0]) == term), None)
    else:
        match = re.search(rf"(?<![A-Za-zÀ-ÖØ-öø-ÿĀ-ž']){re.escape(term)}(?![A-Za-zÀ-ÖØ-öø-ÿĀ-ž'])", text, re.IGNORECASE)
    if not match:
        return None
    # Sentence-sized quote, retaining the exact target substring and offsets.
    start = max(0, match.start() - 180)
    end = min(len(text), match.end() + 220)
    boundaries = list(re.finditer(r"[.!?。]\s+", text[start:match.start()]))
    if boundaries:
        start += boundaries[-1].end()
    boundary = re.search(r"[.!?。](?:\s|$)", text[match.end():end])
    if boundary:
        end = match.end() + boundary.start() + 1
    quote = text[start:end]
    return {"text": quote, "start": match.start() - start, "end": match.end() - start}


def build(repo: Path, reading=None, legacy=None, writing=None, output=None) -> dict:
    def read(path):
        return json.loads((repo / path).read_text())
    reading = reading or read("static/data/toefl-task-bank.json")
    legacy = legacy or read("static/data/english-question-bank.json")
    writing = writing or read("static/data/toefl-writing-bank.json")
    lexicon = read("data/toefl-vocabulary/wordnet-lexicon.json")
    supplemental = read("data/toefl-vocabulary/editor-glossary.json")
    documents, glossary = corpus(repo, reading, legacy, writing)
    entries = {}
    contexts = defaultdict(list)

    def entry(term):
        if term not in entries:
            entries[term] = {"id": "vocab:" + term, "term": term, "sources": set(),
                             "frequency": 0, "glosses": [], "dictionary": lexicon["words"].get(term, []),
                             "contexts": []}
        return entries[term]

    field_count = 0
    for n, doc in enumerate(documents):
        targets = set()
        for field, texts in doc["fields"].items():
            for text in texts:
                field_count += 1
                for match in words(text):
                    term = key(match[0])
                    row = entry(term)
                    row["sources"].add(n)
                    row["frequency"] += 1
                    targets.add(term)
                # Keep one representative context per document and form, not
                # a million duplicated passages. All source associations remain.
                for term in {key(m[0]) for m in words(text)}:
                    if len(contexts[term]) >= 4:
                        continue
                    quote = snippet(text, term)
                    if quote and len(quote["text"]) >= len(term) + 5:
                        quality = sum(ch.isascii() and ch.isalpha() for ch in quote["text"]) / max(1, len(quote["text"]))
                        candidate = {**quote, "source": n, "field": field, "quality": quality}
                        if not any(c["source"] == n for c in contexts[term]):
                            contexts[term].append(candidate)
        doc["terms"] = targets

    for term, definition, source in glossary:
        row = entry(term)
        row["sources"].add(source)
        documents[source]["terms"].add(term)
        row["frequency"] = max(1, row["frequency"])
        if not any(g["text"] == definition for g in row["glosses"]):
            row["glosses"].append({"id": hashlib.sha256(definition.encode()).hexdigest()[:12],
                                    "text": definition, "source": source, "kind": "material"})
        if not contexts[term]:
            for field, texts in documents[source]["fields"].items():
                for text in texts:
                    quote = snippet(text, term)
                    if quote and len(quote["text"]) > len(term) + 5:
                        contexts[term].append({**quote, "source": source, "field": field, "quality": 0})
                        break
                if contexts[term]:
                    break

    for term, definition in supplemental.items():
        if term in entries:
            entries[term]["glosses"].append({"id": hashlib.sha256(definition.encode()).hexdigest()[:12],
                                            "text": definition, "source": None, "kind": "editor"})
    result = []
    for term, row in sorted(entries.items()):
        row["sources"] = sorted(row["sources"])
        row["contexts"] = [{k: v for k, v in c.items() if k != "quality"}
                           for c in sorted(contexts[term], key=lambda c: -c["quality"])[:2]]
        row["quizGlosses"] = quiz_glosses(row["glosses"])
        # Definitions are stored once. Entries refer to immutable WordNet synset IDs.
        result.append(row)
    indices = {e["term"]: i for i, e in enumerate(result)}
    for doc in documents:
        doc["terms"] = sorted(indices[term] for term in doc["terms"])
        doc["fields"] = sorted(doc["fields"])
    dictionary_ids = {s["sense"] for e in result for s in e["dictionary"]}
    definitions = {sid: lexicon["senses"][sid] for sid in sorted(dictionary_ids)}
    fingerprints = {"reading": hashlib.sha256(json.dumps(reading, ensure_ascii=False, sort_keys=True).encode()).hexdigest(),
                    "writing": hashlib.sha256(json.dumps(writing, ensure_ascii=False, sort_keys=True).encode()).hexdigest(),
                    "legacy": hashlib.sha256(json.dumps(legacy, ensure_ascii=False, sort_keys=True).encode()).hexdigest()}
    stats = {"readingQuestions": reading["questionCount"], "writingExercises": len(writing["exercises"]),
             "documents": len(documents), "textFields": field_count, "entries": len(result),
             "wordForms": sum(" " not in e["term"] for e in result),
             "phrases": sum(" " in e["term"] for e in result),
             "glossaryEntries": sum(bool(e["glosses"]) for e in result),
             "dictionaryEntries": sum(bool(e["dictionary"]) for e in result),
             "contextEntries": sum(bool(e["contexts"]) for e in result),
             "contextOnly": sum(not e["dictionary"] and not e["glosses"] for e in result),
             "glossaryCards": sum(len(e["glosses"]) for e in result),
             "dictionaryCards": sum(len(e["dictionary"]) for e in result),
             "quizGlossaryCards": sum(len(e["quizGlosses"]) for e in result),
             "quizEntries": sum(bool(e["quizGlosses"] or e["dictionary"]) for e in result)}
    stats["quizCards"] = stats["quizGlossaryCards"] + stats["dictionaryCards"]
    pending_pages = reading.get("migration", {}).get("sourceImageChecksPendingPages", 0)
    pending_note = f"Reading原本画像の再照合待ち{pending_pages}ページは、語彙索引でも未照合のままです。" if pending_pages else ""
    payload = {"schemaVersion": 1, "stats": stats, "fingerprints": fingerprints,
               "fieldLabels": FIELD_LABELS, "documents": documents, "entries": result,
               "senses": definitions, "dictionarySource": lexicon["source"],
               "quizPolicy": "standalone-word-to-meaning-v2",
               "coverageNote": "公開済み教材の英語本文・設問・全選択肢・解説・語注、Writingの条件・投稿・語句・モデル・ガイド、通常の音声スクリプトを索引化。未公開の保留問は含みません。" + pending_note + "クイズは英単語・表現から意味を選ぶ4択。教材の本文を参照する必要はありません。意味未登録の語は単語帳に残し、出題待ちとして明示します。"}
    validate(payload)
    output = output or repo / "static/data/toefl-vocabulary-bank.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(f"Built vocabulary: {stats['entries']} forms/phrases; {stats['quizCards']} standalone quizzes ({stats['quizGlossaryCards']} Japanese / {stats['dictionaryCards']} English); {stats['readingQuestions']} Reading / {stats['writingExercises']} Writing")
    return payload


def validate(bank):
    assert len({e["id"] for e in bank["entries"]}) == len(bank["entries"])
    for i, row in enumerate(bank["entries"]):
        assert row["sources"] and row["term"]
        for n in row["sources"]:
            assert i in bank["documents"][n]["terms"], (row["id"], n)
        for c in row["contexts"]:
            assert key(c["text"][c["start"]:c["end"]]) == row["term"], row["id"]
        for s in row["dictionary"]:
            assert s["sense"] in bank["senses"] and s["lemma"]
    for doc in bank["documents"]:
        assert doc["terms"], doc["id"]


if __name__ == "__main__":
    build(Path(__file__).resolve().parent.parent)
