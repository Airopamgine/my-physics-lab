"""Learning routes keep full source coverage while excluding elementary quizzes."""
import collections
import hashlib
import json
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from vocabulary_study import classify


class VocabularyStudyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.bank = json.loads((ROOT / "static/data/toefl-vocabulary-bank.json").read_text())
        cls.entries = {e["term"]: e for e in cls.bank["entries"]}

    def test_elementary_forms_and_notation_are_reference_only(self):
        for word in ("the", "good", "go", "went", "going", "better", "children", "houses", "books", "one", "red", "easy", "they", "can't", "a", "b", "m", "john", "by noon", "come with us"):
            if word in self.entries:
                with self.subTest(word=word):
                    e = self.entries[word]
                    self.assertFalse(e["learning"]["eligible"])
                    self.assertEqual(e["learning"]["level"], "reference")
                    self.assertTrue(e["sources"])
        self.assertTrue(self.entries["be related to"]["learning"]["eligible"])
        self.assertTrue(self.entries["cell"]["learning"]["eligible"])
        self.assertTrue(self.entries["force"]["learning"]["eligible"])

    def test_reviewed_tier_and_subject_examples(self):
        cases = [("accommodation", "practical", "general"), ("analysis", "academic", "academic"),
                 ("hypothesis", "academic", "academic"), ("phototropism", "advanced", "life"),
                 ("photosynthesis", "advanced", "life"), ("tectonic", "advanced", "earth"),
                 ("transistor", "advanced", "physical"), ("conduction band", "advanced", "physical"),
                 ("antigen-presenting cell", "advanced", "life"), ("carbon fixation", "advanced", "life")]
        for word, level, subject in cases:
            with self.subTest(word=word):
                e = self.entries[word]["learning"]
                self.assertEqual(e["level"], level)
                self.assertIn(subject, e["subjects"])
        self.assertIn("学習目安", self.bank["study"]["note"])

    def test_every_entry_has_a_valid_route_and_balanced_counts(self):
        levels = {l["id"] for l in self.bank["study"]["levels"]}
        subjects = {s["id"] for s in self.bank["study"]["subjects"]}
        counts = collections.Counter()
        for e in self.bank["entries"]:
            c = e["learning"]
            self.assertIn(c["level"], levels)
            self.assertTrue(c["subjects"])
            self.assertLessEqual(set(c["subjects"]), subjects)
            self.assertEqual(c["eligible"], not c["reason"])
            self.assertEqual(c["eligible"], c["level"] != "reference")
            counts[c["level"]] += 1
        for level in self.bank["study"]["levels"]:
            self.assertEqual(counts[level["id"]], level["entries"])
        for subject in self.bank["study"]["subjects"]:
            self.assertEqual(subject["entries"], sum(e["learning"]["eligible"] and subject["id"] in e["learning"]["subjects"] for e in self.bank["entries"]))
        active = [e for e in self.bank["entries"] if e["learning"]["eligible"]]
        stats = self.bank["stats"]
        self.assertEqual(stats["quizDictionaryCards"], sum(len(e["dictionary"]) for e in active))
        self.assertEqual(stats["excludedCards"] + stats["quizCards"], sum(len(e["quizGlosses"]) + len(e["dictionary"]) for e in self.bank["entries"]))
        self.assertEqual(stats["contextOnly"], sum(not e["quizGlosses"] and not e["dictionary"] for e in self.bank["entries"]))

    def test_word_length_and_frequency_do_not_define_difficulty(self):
        e = dict(self.entries["analysis"])
        e["frequency"] = 99999999
        topics = json.loads((ROOT / "data/toefl-vocabulary/wordnet-study-topics.json").read_text())["senseTopics"]
        baseline = classify(self.entries["analysis"], self.bank["senses"], topics)
        self.assertEqual(classify(e, self.bank["senses"], topics), baseline)

    def test_subjects_are_attached_to_individual_meanings(self):
        e = self.entries["accommodation"]
        self.assertTrue(all(g["subjects"] == ["general"] for g in e["quizGlosses"]))
        eye = next(d for d in e["dictionary"] if "eye" in self.bank["senses"][d["sense"]]["definition"])
        self.assertIn("life", self.bank["senseSubjects"][eye["sense"]])
        for sid, subjects in self.bank["senseSubjects"].items():
            self.assertTrue(subjects)
            self.assertLessEqual(set(subjects), {s["id"] for s in self.bank["study"]["subjects"]})

    def test_dictionary_topic_derivative_uses_exact_frozen_senses(self):
        mapping = json.loads((ROOT / "data/toefl-vocabulary/wordnet-study-topics.json").read_text())
        lexicon = json.loads((ROOT / "data/toefl-vocabulary/wordnet-lexicon.json").read_text())
        self.assertEqual(mapping["source"]["senseFingerprint"], hashlib.sha256(json.dumps(lexicon["senses"], sort_keys=True, ensure_ascii=False).encode()).hexdigest())
        self.assertLessEqual(mapping["senseTopics"].keys(), lexicon["senses"].keys())
        for sid, topics in mapping["senseTopics"].items():
            self.assertTrue(topics)
            self.assertLessEqual(set(topics), {s["id"] for s in self.bank["study"]["subjects"]})


if __name__ == "__main__":
    unittest.main()
