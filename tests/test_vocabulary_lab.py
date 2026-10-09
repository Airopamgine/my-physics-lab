"""An independent field inventory detects silent omissions in the vocabulary bank."""
import collections
import hashlib
import json
from pathlib import Path
import re
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from build_toefl_vocabulary import clean, key, restored, words, quick_exercises

read = lambda path: json.loads((ROOT / path).read_text())


class VocabularyLabTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.bank = read("static/data/toefl-vocabulary-bank.json")
        cls.reading = read("static/data/toefl-task-bank.json")
        cls.writing = read("static/data/toefl-writing-bank.json")
        cls.legacy = read("static/data/english-question-bank.json")
        cls.entries = {e["term"]: e for e in cls.bank["entries"]}
        cls.docs = {d["id"]: d for d in cls.bank["documents"]}
        cls.indices = {e["term"]: i for i, e in enumerate(cls.bank["entries"])}

    def assert_indexed(self, doc_id, text):
        n = next(n for n, d in enumerate(self.bank["documents"]) if d["id"] == doc_id)
        for match in words(clean(text)):
            term = key(match[0])
            self.assertIn(term, self.entries, (doc_id, term))
            self.assertIn(n, self.entries[term]["sources"], (doc_id, term))
            self.assertIn(self.indices[term], self.docs[doc_id]["terms"], (doc_id, term))

    def test_every_reading_question_and_field(self):
        questions = [q for s in self.reading["sets"] for q in s["questions"]]
        self.assertEqual(len(questions), self.bank["stats"]["readingQuestions"])
        self.assertEqual({q["id"] for q in questions}, {d["id"] for d in self.bank["documents"] if d["engine"] == "reading"})
        for s in self.reading["sets"]:
            for q in s["questions"]:
                with self.subTest(q=q["id"]):
                    self.assert_indexed(q["id"], restored(q.get("passage") or s.get("passage", ""), s["questions"]))
                    self.assert_indexed(q["id"], restored(q["prompt"], [q]))
                    for option in q["options"]:
                        self.assert_indexed(q["id"], option["text"])
                    answer = q["answer"]
                    if q.get("acceptedAnswers"):
                        answer = re.sub(r"(?i)(?:正解[：:]\s*)?[A-Za-z]+\s*→\s*", "", answer)
                        self.assert_indexed(q["id"], q["acceptedAnswers"][-1])
                    self.assert_indexed(q["id"], answer)
                    self.assertEqual(self.docs[q["id"]]["sourceRefs"], q.get("sourceRefs", []))

    def test_every_writing_condition_tile_choice_post_model_and_guide(self):
        for q in self.writing["exercises"]:
            with self.subTest(q=q["id"]):
                for name in ("title", "prompt", "context", "subject", "to", "professor", "modelAnswer"):
                    self.assert_indexed(q["id"], q.get(name, ""))
                for name in ("requirements", "choices", "tiles", "frame", "explanation", "phrases"):
                    for value in q.get(name, []):
                        self.assert_indexed(q["id"], value)
                for post in q.get("posts", []):
                    self.assert_indexed(q["id"], post["name"])
                    self.assert_indexed(q["id"], post["text"])
                self.assertEqual(self.docs[q["id"]]["sourceRefs"], q["sourceRefs"])
        self.assertEqual(len(self.writing["exercises"]), self.bank["stats"]["writingExercises"])
        for guide in self.writing["guides"]:
            for item in guide["items"]:
                self.assert_indexed("guide:" + guide["id"], item)

    def test_glosses_and_original_notes_are_not_discarded(self):
        for group in self.legacy["sets"]:
            for note in group["notes"]:
                term = key(note["term"])
                self.assertTrue(any(g["text"] == clean(note["definition"]) for g in self.entries[term]["glosses"]), term)
        for q in self.writing["exercises"]:
            for phrase in q.get("phrases", []):
                if " — " not in phrase:
                    continue
                term, definition = phrase.split(" — ", 1)
                term = re.sub(r"\s*….*$", "", key(term)).strip()
                self.assertTrue(any(g["text"] == clean(definition) for g in self.entries[term]["glosses"]), term)

    def test_exact_context_offsets_and_bidirectional_coverage(self):
        for i, e in enumerate(self.bank["entries"]):
            with self.subTest(term=e["term"]):
                self.assertEqual(len(e["sources"]), len(set(e["sources"])))
                self.assertTrue(e["contexts"] or e["dictionary"] or e["glosses"], "An entry must have a learnable card")
                for c in e["contexts"]:
                    self.assertEqual(key(c["text"][c["start"]:c["end"]]), e["term"])
                for n in e["sources"]:
                    self.assertIn(i, self.bank["documents"][n]["terms"])
                self.assertEqual(len(e["dictionary"]), len({d["sense"] for d in e["dictionary"]}))
        for n, d in enumerate(self.bank["documents"]):
            for i in d["terms"]:
                self.assertIn(n, self.bank["entries"][i]["sources"])

    def test_scoring_fragments_not_words_and_quick_gaps_restored(self):
        for fragment in ("abitant", "ablishment", "orbent", "acent", "aclysmic", "cere"):
            self.assertNotIn(fragment, self.entries)
        for q in quick_exercises(ROOT):
            for gap in q.get("gaps", []):
                self.assert_indexed("quick:" + q["id"], gap["word"])
        for term in ("be related to", "reported speech", "by noon", "phototropism", "recalibrated"):
            self.assertIn(term, self.entries)

    def test_current_source_fingerprints_and_pending_exclusion(self):
        for name, payload in (("reading", self.reading), ("writing", self.writing), ("legacy", self.legacy)):
            self.assertEqual(self.bank["fingerprints"][name], hashlib.sha256(json.dumps(payload, ensure_ascii=False, sort_keys=True).encode()).hexdigest())
        index = read("scripts/reading-source-index.json")
        published = {ref for d in self.bank["documents"] for ref in d["sourceRefs"]}
        for item in index.get("blockedItems", []):
            for ref in item.get("sourceRefs", []):
                self.assertNotIn(ref, published, "An unresolved source question was indexed")
        pending = self.reading["migration"]["sourceImageChecksPendingPages"]
        if pending:
            self.assertIn(f"再照合待ち{pending}ページ", self.bank["coverageNote"])

    def test_dictionary_reproducible_subset_and_license(self):
        lexicon = read("data/toefl-vocabulary/wordnet-lexicon.json")
        self.assertEqual(self.bank["dictionarySource"], lexicon["source"])
        self.assertIn("Copyright 2006 by Princeton University", self.bank["dictionarySource"]["license"])
        self.assertEqual((ROOT / "static/data/wordnet-license.txt").read_text(), lexicon["source"]["license"])
        for entry in self.bank["entries"]:
            self.assertEqual(entry["dictionary"], lexicon["words"].get(entry["term"], []))
            for lookup in entry["dictionary"]:
                self.assertEqual(self.bank["senses"][lookup["sense"]], lexicon["senses"][lookup["sense"]])


if __name__ == "__main__":
    unittest.main()
