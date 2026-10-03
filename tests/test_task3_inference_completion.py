import json
import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "toefl-migration" / "pdf-task3-p064-073.json"
INDEX = ROOT / "scripts" / "reading-source-index.json"


class Task3InferenceCompletionTests(unittest.TestCase):
    def test_twenty_source_questions_and_answers_are_preserved(self):
        item = json.loads(SOURCE.read_text(encoding="utf-8"))
        refs = [
            *[f"pdf:task3:p065:q{i}" for i in range(16, 21)],
            "pdf:task3:p067:qexample-inference",
            "pdf:task3:p068:qpractice01",
            "pdf:task3:p068:qpractice02",
            "pdf:task3:p069:qpractice03",
            "pdf:task3:p069:qpractice04",
            *[f"pdf:task3:p071:q{i:02d}" for i in range(1, 6)],
            *[f"pdf:task3:p073:q{i:02d}" for i in range(6, 11)],
        ]
        questions = item["questions"]
        self.assertEqual(len(questions), 20)
        self.assertEqual([q["sourceRefs"][0] for q in questions], refs)
        self.assertEqual([q["correct"] for q in questions], list("BBCCBBDDADBBCBDBDACB"))
        self.assertTrue(all(len(q["options"]) == 4 for q in questions))
        self.assertTrue(all(q["answer"].startswith("正解：") for q in questions))
        self.assertTrue(all(q["passageId"] in item["passages"] for q in questions))

    def test_pages_64_through_73_are_reviewed_and_indexed(self):
        index = json.loads(INDEX.read_text(encoding="utf-8"))
        source = next(s for s in index["sources"] if s["id"] == "task3")
        self.assertEqual(source["reviewedPages"], [p for p in range(1, 155) if p != 89])
        indexed = [
            ref
            for page in range(64, 74)
            for ref in source["pageItems"][str(page)]
        ]
        item = json.loads(SOURCE.read_text(encoding="utf-8"))
        self.assertEqual(indexed, [q["sourceRefs"][0] for q in item["questions"]])
        blocker = next(b for b in index["blockedItems"] if b["source"] == "task3")
        self.assertEqual(blocker["pages"], [89])
        self.assertEqual(index["lastSource"], "task3")


if __name__ == "__main__":
    unittest.main()
