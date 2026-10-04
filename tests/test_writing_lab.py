"""Source coverage, independently checked keys, and public-data invariants."""
import collections
import json
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
BANK = json.loads((ROOT / "static/data/toefl-writing-bank.json").read_text())
EXERCISES = BANK["exercises"]
SOURCE = [q for q in EXERCISES if q["source"].get("file") == "TOEFL-writing.pdf"]
INDEX = json.loads((ROOT / "scripts/writing-source-index.json").read_text())
BY_ID = {q["id"]: q for q in EXERCISES}


class WritingLabTests(unittest.TestCase):
    def test_all_source_tasks_and_unique_source_refs(self):
        self.assertEqual(collections.Counter(q["type"] for q in SOURCE),
                         {"sentence": 156, "grammar": 30, "email": 15, "discussion": 14})
        self.assertEqual(len(BY_ID), len(EXERCISES))
        self.assertEqual(len(SOURCE), 215)
        refs = [ref for q in EXERCISES for ref in q["sourceRefs"]]
        self.assertEqual(len(refs), len(set(refs)))
        for q in EXERCISES:
            with self.subTest(q=q["id"]):
                if q["source"].get("kind") == "original":
                    self.assertRegex(q["source"]["date"], r"^\d{4}-\d{2}-\d{2}$")
                    self.assertTrue(all(ref.startswith("original:writing:") for ref in q["sourceRefs"]))
                else:
                    self.assertEqual(q["source"]["file"], "TOEFL-writing.pdf")
                    self.assertTrue(all(1 <= p <= 139 for p in q["source"]["pages"]))
                for field in ("sourceRefs", "answerBasis", "explanation", "phrases"):
                    self.assertTrue(q[field])

    def test_every_original_daily_batch_is_complete(self):
        originals = [q for q in EXERCISES if q["source"].get("kind") == "original"]
        by_date = collections.defaultdict(list)
        for q in originals:
            by_date[q["source"]["date"]].append(q)
        for date, items in by_date.items():
            with self.subTest(date=date):
                self.assertEqual(collections.Counter(q["type"] for q in items),
                                 {"sentence": 10, "email": 1, "discussion": 1})
                expected_refs = {
                    *(f"original:writing:{date}:sentence:{n:02d}" for n in range(1, 11)),
                    f"original:writing:{date}:email:01",
                    f"original:writing:{date}:discussion:01",
                }
                self.assertEqual({ref for q in items for ref in q["sourceRefs"]}, expected_refs)

    def test_diagnostic_sentence_keys_match_printed_answers(self):
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
        for i, answer in enumerate(expected, 1):
            q = BY_ID[f"writing-diagnostic-s{i}"]
            self.assertEqual(q["modelAnswer"], answer)
            self.assertEqual(q["source"]["answerPages"], [16])
        self.assertEqual(BY_ID["writing-example-s1"]["source"]["answerPages"], [5])
        self.assertEqual(BY_ID["writing-relative-example"]["source"]["answerPages"], [40])

    def test_every_sentence_slot_and_alternative_is_well_formed(self):
        for q in EXERCISES:
            if q["type"] != "sentence":
                continue
            with self.subTest(q=q["id"]):
                frame = "".join(q["frame"])
                slots = [int(n) for n in re.findall(r"\{(\d+)\}", frame)]
                self.assertEqual(slots, list(range(len(q["solutions"][0]))))
                for solution in q["solutions"]:
                    self.assertEqual(len(solution), len(slots))
                    self.assertEqual(len(set(solution)), len(solution))
                    self.assertTrue(all(type(n) is int and 0 <= n < len(q["tiles"]) for n in solution))
                completed = re.sub(r"\{(\d+)\}", lambda m: q["tiles"][q["solutions"][0][int(m[1])]], frame)
                self.assertEqual(completed[0].upper() + completed[1:], q["modelAnswer"])
                self.assertNotRegex(q["modelAnswer"], r"[.!?] [a-z]")
                self.assertGreaterEqual(len(q["explanation"]), 2)

    def test_mcq_keys_and_all_grammar_learning_targets(self):
        grammar = [q for q in SOURCE if q["type"] == "grammar"]
        self.assertEqual(len([q for q in grammar if q["id"].startswith("writing-response-match-")]), 10)
        for prefix, keys in [
            ("writing-tense-q", [1, 1, 2, 3, 2]),
            ("writing-relative-classify-", [1, 0, 0, 1, 0]),
            ("writing-voice-passive-", [0, 1, 2, 3, 0]),
            ("writing-voice-analyze-", [2, 0, 3, 1, 0]),
        ]:
            self.assertEqual([BY_ID[f"{prefix}{i}"]["correctIndex"] for i in range(1, 6)], keys)
        for q in grammar:
            self.assertEqual(len(q["choices"]), 4)
            self.assertEqual(len(set(q["choices"])), 4)
            self.assertEqual(q["modelAnswer"], q["choices"][q["correctIndex"]])
            self.assertIn("編集", q["answerBasis"])

    def test_page_inventory_and_deduplication_match_bank(self):
        self.assertEqual(INDEX["totalPages"], 139)
        self.assertEqual(INDEX["textReviewedPages"], list(range(1, 140)))
        self.assertEqual([p["page"] for p in INDEX["pages"]], list(range(1, 140)))
        self.assertEqual(INDEX["remainingExercises"], [])
        self.assertEqual(INDEX["uniqueExercises"], len(SOURCE))
        self.assertEqual(INDEX["sourceExerciseOccurrences"], 216)
        indexed = {q["id"]: q for q in INDEX["exercises"]}
        self.assertEqual(set(indexed), {q["id"] for q in SOURCE})
        for q in SOURCE:
            self.assertEqual(indexed[q["id"]]["sourceRefs"], q["sourceRefs"])
            self.assertEqual(indexed[q["id"]]["pages"], q["source"]["pages"])
        self.assertEqual(len(INDEX["printedAnswerMatchedIds"]), 12)
        self.assertEqual(INDEX["pages"][115]["kind"], "blank")
        self.assertEqual(INDEX["pages"][115]["exerciseIds"], [])
        self.assertNotIn("writing-discussion-test9", indexed)
        self.assertEqual(BY_ID["writing-test6-s4"]["source"]["pages"], [84, 85])
        self.assertEqual(len(BY_ID["writing-test6-s4"]["sourceRefs"]), 2)
        self.assertNotIn("writing-test6-s5", indexed)
        for n in range(1, 11):
            items = [q for q in SOURCE if q["collection"] == f"Practice Test {n}" and q["type"] == "sentence"]
            self.assertEqual(len(items), 9 if n == 6 else 10)

    def test_editorial_repairs_preserve_the_targets(self):
        for name, phrase in [
            ("writing-test2-s4", "have agreed to it"),
            ("writing-test7-s4", "will probably not be attending"),
            ("writing-additionalA-s4", "that the project will be delayed"),
            ("writing-additionalB-s4", "that the revised strategy will improve"),
        ]:
            self.assertIn(phrase, BY_ID[name]["modelAnswer"])
            self.assertTrue(BY_ID[name]["editorNote"])
        self.assertEqual(len(BY_ID["writing-activity1-s2"]["solutions"]), 2)
        self.assertEqual(len(BY_ID["writing-activity1-s2"]["solutions"][0]), 2)
        self.assertTrue(BY_ID["writing-activity1-s2"]["editorNote"])
        self.assertTrue(BY_ID["writing-response-match-8"]["editorNote"])
        self.assertEqual(len(BY_ID["writing-test2-s4"]["solutions"][0]), 7)

    def test_original_discussion_participants_are_preserved(self):
        ids = ["diagnostic", "test1", "test2", "test3", "test4", "test5", "test6", "test7", "test8", "test10"]
        expected = [("Derek", "Anika"), ("Omar", "Sarah"), ("Chen", "Samuel"),
                    ("Lena", "Mark"), ("Omar", "Jenna"), ("Leo", "Tanya"),
                    ("Jason", "Chloe"), ("Kai", "Sophia"), ("Rajiv", "Erika"), ("Sarah", "Leo")]
        for id, names in zip(ids, expected):
            q = BY_ID[f"writing-discussion-{id}"]
            self.assertEqual(tuple(p["name"] for p in q["posts"]), names)
            self.assertTrue(any(name in q["modelAnswer"] for name in names))
        for id, names in [("extra1", ["Mia", "Javier"]), ("extra2", ["Hannah", "Ivan"]), ("extra3", ["Leo", "Maria"])]:
            q = BY_ID[f"writing-discussion-{id}"]
            self.assertEqual([p["name"] for p in q["posts"]], names)
            self.assertTrue(all(name in q["modelAnswer"] for name in names))

    def test_all_essay_models_and_easily_missed_conditions(self):
        for q in EXERCISES:
            if q["type"] in ("email", "discussion"):
                self.assertGreaterEqual(len(q["requirements"]), 3)
                self.assertTrue(q["context"])
                self.assertIn("編集", q["answerBasis"])
                self.assertEqual(q["minutes"], 7 if q["type"] == "email" else 10)
            if q["type"] == "email":
                self.assertRegex(q["modelAnswer"], r"^(Dear|Hi) ")
            if q["type"] == "discussion":
                self.assertEqual(q["targetWords"], 100)
                self.assertEqual(len(q["posts"]), 2)
                self.assertGreaterEqual(len(re.findall(r"[A-Za-z0-9]+(?:['’\-][A-Za-z0-9]+)*", q["modelAnswer"])), 100)
        expected = {
            "writing-email-test1": ["$500", "$2,500", "$2,000", "attached"],
            "writing-email-test2": ["Wednesday", "Thursday"],
            "writing-email-test3": ["documentation"],
            "writing-email-test7": ["refund", "replacement", "PF98765"],
            "writing-email-test8": ["Maria", "Dave", "Susan"],
            "writing-email-example": ["Sunshine Poetry Magazine", "two", "status"],
            "writing-email-test10": ["Liam", "Chloe", "Jenna", "Friday, March 22nd", "Thursday"],
            "writing-email-extra1": ["Jared", "Priya", "Hannah", "Monday, April 8th", "Friday"],
            "writing-email-extra2": ["Marcus", "Elena", "Tori", "Thursday, November 3rd", "next Tuesday", "10:00 a.m.", "1:00 p.m."],
            "writing-email-extra3": ["Olivia", "Ben", "Carla", "Wednesday, January 17th", "next week"],
        }
        for id, terms in expected.items():
            for term in terms:
                self.assertIn(term, BY_ID[id]["modelAnswer"])

    def test_reference_guides_cover_grammar_and_rubrics(self):
        guides = {g["id"]: g for g in BANK["guides"]}
        self.assertEqual(set(guides), {"word-classes", "constituents", "determiners", "relative-clauses",
                                      "voice", "tenses", "email", "discussion", "rubric"})
        self.assertEqual(guides["rubric"]["pages"], [138, 139])
        self.assertEqual(len([line for line in guides["rubric"]["items"] if re.match(r"^[0-5]:", line)]), 6)

    def test_public_data_excludes_private_working_material(self):
        text = json.dumps([BANK, INDEX], ensure_ascii=False)
        for forbidden in ["/workspace/", "file_000", "libfile_", "writing-text.txt", "data:image/", "base64"]:
            self.assertNotIn(forbidden, text)
        self.assertIn("非公開", BANK["sourcePolicy"])
        self.assertIn("架空", BANK["sourcePolicy"])


if __name__ == "__main__":
    unittest.main()
