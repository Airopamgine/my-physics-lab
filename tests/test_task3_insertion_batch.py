import json
import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "toefl-migration" / "pdf-task3-p074-083.json"
INDEX = ROOT / "scripts" / "reading-source-index.json"


class Task3InsertionBatchTests(unittest.TestCase):
    def test_twenty_questions_match_the_source_order_and_answers(self):
        item = json.loads(SOURCE.read_text(encoding="utf-8"))
        refs = [
            *[f"pdf:task3:p075:q{i}" for i in range(11, 16)],
            *[f"pdf:task3:p077:q{i}" for i in range(16, 21)],
            "pdf:task3:p079:qexample-insertion",
            "pdf:task3:p080:qpractice01",
            "pdf:task3:p080:qpractice02",
            "pdf:task3:p081:qpractice03",
            "pdf:task3:p081:qpractice04",
            *[f"pdf:task3:p083:q{i:02d}" for i in range(1, 6)],
        ]
        questions = item["questions"]
        self.assertEqual(len(questions), 20)
        self.assertEqual([q["sourceRefs"][0] for q in questions], refs)
        self.assertEqual([q["correct"] for q in questions], list("CBDCCCBBDBBCBDBCBBAC"))
        self.assertTrue(all(len(q["options"]) == 4 for q in questions))
        self.assertTrue(all(q["answer"].startswith("正解：") for q in questions))
        self.assertTrue(all(q["passageId"] in item["passages"] for q in questions))

    def test_pages_74_through_83_are_reviewed_and_indexed(self):
        index = json.loads(INDEX.read_text(encoding="utf-8"))
        source = next(s for s in index["sources"] if s["id"] == "task3")
        self.assertEqual(source["reviewedPages"], list(range(1, 84)))
        indexed = [
            ref
            for page in range(74, 84)
            for ref in source["pageItems"][str(page)]
        ]
        item = json.loads(SOURCE.read_text(encoding="utf-8"))
        self.assertEqual(indexed, [q["sourceRefs"][0] for q in item["questions"]])
        blocker = next(b for b in index["blockedItems"] if b["source"] == "task3")
        self.assertEqual(blocker["pages"], list(range(84, 155)))


if __name__ == "__main__":
    unittest.main()
