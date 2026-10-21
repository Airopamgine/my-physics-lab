"""Content contracts that prevent broken or misleading original exam practice."""
import json
from pathlib import Path
import re
import unittest

BANK = json.loads(Path("static/data/cambridge-bank.json").read_text())


class CambridgeBankTests(unittest.TestCase):
    def test_all_parts_and_stable_original_sources(self):
        self.assertEqual({s["part"] for s in BANK["sets"]}, set("1234567") | {"writing"})
        ids = []
        for s in BANK["sets"]:
            self.assertEqual(s["source"]["kind"], "original")
            self.assertRegex(s["source"]["date"], r"^\d{4}-\d{2}-\d{2}$")
            self.assertGreater(s["minutes"], 0)
            for q in s["questions"]:
                ids.append(q["id"])
                self.assertTrue(q["tags"])
                self.assertRegex(q["explanation"], r"[\u3040-\u30ff\u4e00-\u9fff]")
        self.assertEqual(len(ids), len(set(ids)))

    def test_gaps_options_and_answer_keys_are_complete(self):
        for s in BANK["sets"]:
            if s["part"] in "1236":
                gaps = [int(n) for n in re.findall(r"\((\d+)\) ____", s["passage"])]
                self.assertEqual(gaps, list(range(1, len(s["questions"]) + 1)), s["id"])
            for q in s["questions"]:
                if "options" in q:
                    labels = [o["label"] for o in q["options"]]
                    self.assertEqual(len(labels), len(set(labels)))
                    self.assertTrue(set(q["answers"]) <= set(labels), q["id"])
                    self.assertTrue(all(o["text"].strip() for o in q["options"]))
                elif s["part"] in {"2", "3"}:
                    self.assertTrue(all(len(a.split()) == 1 for a in q["answers"]), q["id"])
            if s["part"] == "6":
                answers = [q["answers"][0] for q in s["questions"]]
                self.assertEqual(len(answers), len(set(answers)))
                self.assertEqual(len(s["questions"][0]["options"]), len(answers) + 1)

    def test_transformation_limits_include_contractions(self):
        for s in BANK["sets"]:
            if s["part"] != "4":
                continue
            for q in s["questions"]:
                self.assertEqual(q["stem"].count("____"), 1)
                for answer in q["answers"]:
                    expanded = re.sub(r"(n't|'re|'ve|'ll|'d|'m|'s)\b", " xx", answer)
                    self.assertTrue(2 <= len(expanded.split()) <= 5, (q["id"], answer))
                    self.assertIn(q["keyword"].lower(), answer.lower().split())
                    self.assertNotIn("____", q["stem"].replace("____", answer))

    def test_writing_models_and_repeat_training(self):
        for s in BANK["sets"]:
            if s["part"] == "writing":
                for q in s["questions"]:
                    count = len(re.findall(r"[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*", q["model"]))
                    self.assertTrue(140 <= count <= 190, (s["id"], count))
                    self.assertEqual(len(q["checklist"]), 3)
        self.assertEqual(len(BANK["repeat"]), 7)
        for q in BANK["repeat"]:
            self.assertTrue(q["ja"] and q["note"])
            self.assertTrue(8 <= len(q["en"].split()) <= 18)


if __name__ == "__main__":
    unittest.main()
