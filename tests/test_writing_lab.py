"""Source and publishing invariants for the selected Writing exercises."""
import collections
import json
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
BANK = json.loads((ROOT / "static/data/toefl-writing-bank.json").read_text())
EXERCISES = BANK["exercises"]


class WritingLabTests(unittest.TestCase):
    def test_selection_has_all_three_tasks_and_unique_source_refs(self):
        self.assertEqual(collections.Counter(q["type"] for q in EXERCISES),
                         {"sentence": 10, "email": 10, "discussion": 10})
        self.assertEqual(len({q["id"] for q in EXERCISES}), 30)
        refs = [ref for q in EXERCISES for ref in q["sourceRefs"]]
        self.assertEqual(len(refs), len(set(refs)))
        for q in EXERCISES:
            with self.subTest(q=q["id"]):
                self.assertEqual(q["source"]["file"], "TOEFL-writing.pdf")
                self.assertTrue(all(1 <= p <= 139 for p in q["source"]["pages"]))
                self.assertTrue(q["sourceRefs"])
                self.assertTrue(q["answerBasis"])
                self.assertTrue(q["explanation"])
                self.assertTrue(q["phrases"])

    def test_sentence_keys_match_visually_checked_sample_answers(self):
        expected = [
            "The new employees wanted to know if they would be able to access the system.",
            "A museum launched one last month that displays lots of fascinating artifacts.",
            "Have you talked to your professor about the delay?",
            "I am looking for a position that better fits my long-term goals.",
            "She said the dishes are being prepared now.",
            "Would you like me to email you the file?",
            "Someone stole mine while it was parked in front of the store.",
            "They just learned what needs to be done.",
            "My team is working on a plan to increase revenue over the next quarter.",
            "I was using some reference books that cannot be checked out.",
        ]
        sentences = [q for q in EXERCISES if q["type"] == "sentence"]
        for q, answer in zip(sentences, expected):
            with self.subTest(q=q["id"]):
                self.assertEqual(q["modelAnswer"], answer)
                self.assertEqual(q["source"]["answerPages"], [16])
                for solution in q["solutions"]:
                    self.assertEqual(len(solution), len(set(solution)))
                    self.assertTrue(all(0 <= n < len(q["tiles"]) for n in solution))
                    frame = "".join(q["frame"])
                    self.assertEqual([int(n) for n in re.findall(r"\{(\d+)\}", frame)], list(range(len(solution))))
                    completed = re.sub(r"\{(\d+)\}", lambda m: q["tiles"][solution[int(m[1])]], frame)
                    self.assertEqual(completed[0].upper() + completed[1:], answer)

    def test_discussion_posts_and_models_preserve_source_participants(self):
        expected_names = [("Derek", "Anika"), ("Omar", "Sarah"), ("Chen", "Samuel"),
                          ("Lena", "Mark"), ("Omar", "Jenna"), ("Leo", "Tanya"),
                          ("Jason", "Chloe"), ("Kai", "Sophia"), ("Rajiv", "Erika"), ("Sarah", "Leo")]
        for q, names in zip([q for q in EXERCISES if q["type"] == "discussion"], expected_names):
            with self.subTest(q=q["id"]):
                self.assertEqual(tuple(post["name"] for post in q["posts"]), names)
                self.assertEqual(q["minutes"], 10)
                self.assertGreaterEqual(len(re.findall(r"[A-Za-z0-9]+(?:['’\-][A-Za-z0-9]+)*", q["modelAnswer"])), 100)
                self.assertIn("英語要約", q["answerBasis"])
                self.assertIn("唯一の正解ではありません", q["answerBasis"])
                self.assertTrue(any(name in q["modelAnswer"] for name in names))

    def test_email_models_cover_easily_missed_task_conditions(self):
        emails = {q["id"]: q for q in EXERCISES if q["type"] == "email"}
        for q in emails.values():
            self.assertEqual(q["minutes"], 7)
            self.assertGreaterEqual(len(q["requirements"]), 3)
            self.assertIn("編集", q["answerBasis"])
            self.assertRegex(q["modelAnswer"], r"^(Dear|Hi) ")
        self.assertIn("$500", emails["writing-email-test1"]["modelAnswer"])
        self.assertIn("Financial Aid", emails["writing-email-test1"]["to"])
        self.assertIn("原本", emails["writing-email-test1"]["editorNote"])
        self.assertIn("Wednesday", emails["writing-email-test2"]["modelAnswer"])
        self.assertIn("Thursday", emails["writing-email-test2"]["modelAnswer"])
        self.assertIn("documentation", emails["writing-email-test3"]["modelAnswer"])
        self.assertIn("refund", emails["writing-email-test7"]["modelAnswer"])
        self.assertIn("replacement", emails["writing-email-test7"]["modelAnswer"])
        self.assertIn("PF98765", emails["writing-email-test7"]["modelAnswer"])
        for name in ["Maria", "Dave", "Susan"]:
            self.assertIn(name, emails["writing-email-test8"]["modelAnswer"])

    def test_public_bank_excludes_private_working_material(self):
        text = json.dumps(BANK, ensure_ascii=False)
        for forbidden in ["/workspace/", "file_000", "libfile_", "writing-text.txt", "handwritten", "data:image/", "base64"]:
            self.assertNotIn(forbidden, text)
        self.assertIn("非公開", BANK["sourcePolicy"])
        self.assertIn("架空", BANK["sourcePolicy"])


if __name__ == "__main__":
    unittest.main()
