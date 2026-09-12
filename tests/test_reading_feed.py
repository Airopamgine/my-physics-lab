"""No third-party dependencies; run with unittest discovery."""
import copy
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("bank_builder", ROOT / "scripts/build_english_quiz_bank.py")
BUILDER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BUILDER)


class ReadingFeedTests(unittest.TestCase):
    def setUp(self):
        self.sample = json.loads((ROOT / "data/toefl-reading/reading-20260912-2348.json").read_text())

    def build(self, sample):
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            (directory / f'{sample["id"]}.json').write_text(json.dumps(sample))
            return BUILDER.build_reading_feed(directory, directory / "compiled" / "bank.json")

    def test_all_ten_are_auto_graded(self):
        bank = self.build(self.sample)
        self.assertEqual((bank["setCount"], bank["questionCount"], bank["autoGradedCount"], bank["selfCheckCount"]), (1, 10, 10, 0))
        questions = bank["sets"][0]["questions"]
        self.assertEqual(questions[0]["acceptedAnswers"], ["ord", "record"])
        self.assertEqual(questions[1]["acceptedAnswers"], ["re", "compare"])
        self.assertEqual(questions[2]["acceptedAnswers"], ["tain", "maintain"])
        self.assertEqual(len({q["id"] for q in questions}), 10)
        self.assertTrue(all(q["passage"] and q["answer"] for q in questions))

    def test_incorrect_gap_length_rejected(self):
        self.sample["passages"]["words"] = self.sample["passages"]["words"].replace("rec___", "rec__")
        with self.assertRaises(ValueError):
            self.build(self.sample)

    def test_wrong_prefix_rejected(self):
        self.sample["questions"][0]["prefix"] = "wrong"
        with self.assertRaises(ValueError):
            self.build(self.sample)

    def test_too_long_gap_rejected(self):
        self.sample["passages"]["words"] = self.sample["passages"]["words"].replace("rec___", "rec____")
        with self.assertRaises(ValueError):
            self.build(self.sample)

    def test_missing_question_rejected(self):
        self.sample["questions"].pop()
        with self.assertRaises(ValueError):
            self.build(self.sample)

    def test_duplicate_choice_rejected(self):
        self.sample["questions"][3]["options"][0]["text"] = self.sample["questions"][3]["options"][1]["text"]
        with self.assertRaises(ValueError):
            self.build(self.sample)

    def test_invalid_answer_rejected(self):
        for wrong in ("E", "AB", ""):
            with self.subTest(wrong=wrong):
                self.sample["questions"][3]["correct"] = wrong
                with self.assertRaises(ValueError):
                    self.build(self.sample)

    def test_empty_explanation_rejected(self):
        self.sample["questions"][3]["answer"] = " "
        with self.assertRaises(ValueError):
            self.build(self.sample)

    def test_missing_timezone_rejected(self):
        self.sample["date"] = "2026-09-12T23:48:00"
        with self.assertRaises(ValueError):
            self.build(self.sample)

    def test_newest_first_and_preserved_old_ids(self):
        newer = copy.deepcopy(self.sample)
        newer.update(id="reading-20260913-0000", date="2026-09-13T00:00:00+09:00")
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            for sample in (self.sample, newer):
                (directory / f'{sample["id"]}.json').write_text(json.dumps(sample))
            bank = BUILDER.build_reading_feed(directory, directory / "compiled" / "bank.json")
            self.assertEqual(bank["questionCount"], 20)
            self.assertEqual(bank["sets"][0]["id"], newer["id"])
            self.assertEqual(bank["sets"][1]["questions"][0]["id"], "reading-20260912-2348-q1")


if __name__ == "__main__":
    unittest.main()
