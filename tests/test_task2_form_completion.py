import json
import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]


class Task2FormCompletionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.item = json.loads(
            (ROOT / 'data/toefl-migration/pdf-task2-p116-124.json').read_text()
        )
        cls.index = json.loads(
            (ROOT / 'scripts/reading-source-index.json').read_text()
        )
        cls.source = next(s for s in cls.index['sources'] if s['id'] == 'task2')

    def test_preserves_all_form_questions_and_answers(self):
        expected_refs = [
            'pdf:task2:p117:qexample1', 'pdf:task2:p117:qexample2',
            'pdf:task2:p118:q01', 'pdf:task2:p118:q02',
            'pdf:task2:p119:q03', 'pdf:task2:p119:q04',
            'pdf:task2:p120:q05', 'pdf:task2:p120:q06',
            'pdf:task2:p121:q07', 'pdf:task2:p121:q08', 'pdf:task2:p121:q09',
            'pdf:task2:p122:q10', 'pdf:task2:p122:q11', 'pdf:task2:p122:q12',
            'pdf:task2:p123:q13', 'pdf:task2:p123:q14', 'pdf:task2:p123:q15',
        ]
        questions = self.item['questions']
        self.assertEqual([q['sourceRefs'][0] for q in questions], expected_refs)
        self.assertEqual([q['correct'] for q in questions], list('DCBBCBDCBDBCB BCCB'.replace(' ', '')))
        for question in questions:
            self.assertEqual([o['label'] for o in question['options']], list('ABCD'))
            self.assertIn(question['correct'], 'ABCD')
            self.assertIn('正解：', question['answer'])
            self.assertIn(question['passageId'], self.item['passages'])

    def test_task2_source_is_complete_and_unblocked(self):
        self.assertEqual(self.source['reviewedPages'], list(range(1, 125)))
        refs = [q['sourceRefs'][0] for q in self.item['questions']]
        indexed = [
            ref
            for page in range(116, 125)
            for ref in self.source['pageItems'][str(page)]
        ]
        self.assertEqual(indexed, refs)
        blockers = {b['source']: b for b in self.index['blockedItems']}
        self.assertNotIn('task2', blockers)
        self.assertEqual(self.source['pageItems']['116'], [])
        self.assertEqual(self.source['pageItems']['124'], [])


if __name__ == '__main__':
    unittest.main()
