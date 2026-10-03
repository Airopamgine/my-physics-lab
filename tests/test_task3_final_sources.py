import importlib.util
import json
import re
import shutil
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = {
    'pdf-task3-p084-089': ([(85, 6, 10), (87, 11, 15), (89, 16, 20)],
                          'ACAACADCBBCCAC', [3, 3, 3]),
    'pdf-task3-p096-103': ([(97, 1, 5), (99, 6, 10), (101, 11, 15), (103, 16, 20)],
                          'BDADCCBBDCDABCABBACD', [3, 3, 4, 3]),
    'pdf-task3-p108-115': ([(109, 1, 5), (111, 6, 10), (113, 11, 15), (115, 16, 20)],
                          'BBABACADAABBBACCBACD', [3, 2, 3, 3]),
    'pdf-task3-p120-127': ([(121, 1, 5), (123, 6, 10), (125, 11, 15), (127, 16, 20)],
                          'BDBCBBCABBCCBBCBBACD', [3, 3, 3, 3]),
    'pdf-task3-p132-139': ([(133, 1, 5), (135, 6, 10), (137, 11, 15), (139, 16, 20)],
                          'DBCBCCACBCBBCADCDBDC', [3, 3, 3, 3]),
    'pdf-task3-p146-153': ([(147, 1, 5), (149, 6, 10), (151, 11, 15), (153, 16, 20)],
                          'BBDCBCACDCCCABDBCCAD', [3, 2, 3, 4]),
}
PENDING = 'pdf:task3:p089:q17'


class Task3FinalSourcesTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.index = json.loads((ROOT / 'scripts/reading-source-index.json').read_text())
        cls.source = next(s for s in cls.index['sources'] if s['id'] == 'task3')
        cls.bank = json.loads((ROOT / 'static/data/toefl-task-bank.json').read_text())

    def test_all_114_unambiguous_items_keep_order_options_and_paragraphs(self):
        count = 0
        for set_id, (pages, answers, paragraphs) in MANIFEST.items():
            with self.subTest(set_id=set_id):
                item = json.loads((ROOT / f'data/toefl-migration/{set_id}.json').read_text())
                refs = [f'pdf:task3:p{p:03d}:q{n:02d}'
                        for p, first, last in pages for n in range(first, last + 1)
                        if f'pdf:task3:p{p:03d}:q{n:02d}' != PENDING]
                self.assertEqual([q['sourceRefs'][0] for q in item['questions']], refs)
                self.assertEqual(''.join(q['correct'] for q in item['questions']), answers)
                self.assertEqual([len(p.split('\n\n')) - 1 for p in item['passages'].values()], paragraphs)
                self.assertIn('未提供', item['verificationNote'])
                self.assertIn('画像照合は未完了', item['verificationNote'])
                for q in item['questions']:
                    self.assertEqual([o['label'] for o in q['options']], list('ABCD'))
                    self.assertEqual(len({o['text'] for o in q['options']}), 4)
                    self.assertTrue(q['answer'].startswith(f"正解：{q['correct']}。"))
                    self.assertGreater(len(q['answer']), 45)
                    self.assertIn(q['passageId'], item['passages'])
                    if 'best fit?' in q['prompt']:
                        self.assertEqual(re.findall(r'\[[1-4]\]', item['passages'][q['passageId']]),
                                         ['[1]', '[2]', '[3]', '[4]'])
                count += len(item['questions'])
        self.assertEqual(count, 114)

    def test_pending_question_is_in_inventory_but_never_in_published_catalog(self):
        refs = {r for s in self.bank['sets'] for q in s['questions'] for r in q.get('sourceRefs', [])}
        self.assertNotIn(PENDING, refs)
        self.assertIn(PENDING, self.source['pageItems']['89'])
        blocker = next(b for b in self.index['blockedItems'] if b['source'] == 'task3')
        self.assertEqual(blocker['sourceRefs'], [PENDING])
        self.assertIn('all four', blocker['reason'])
        self.assertIn('481', blocker['needs'])

    def test_all_pages_read_but_one_page_and_image_checks_remain_unresolved(self):
        self.assertEqual(self.source['textReadPages'], list(range(1, 155)))
        self.assertEqual(self.source['reviewedPages'], [p for p in range(1, 155) if p != 89])
        self.assertEqual(self.source['imageReviewPendingPages'], list(range(84, 155)))
        m = self.bank['migration']
        self.assertEqual(m['legacyConverted'], m['legacyTotal'])
        self.assertEqual(m['pdfReviewedPages'], 409)
        self.assertEqual(m['pdfPublished'], 2593)
        self.assertEqual(m['pdfPendingQuestions'], 1)
        self.assertEqual(m['sourceImageChecksPendingPages'], 71)
        self.assertTrue(m['answerKeysMissing'])
        self.assertFalse(m['complete'])
        self.assertEqual(self.bank['questionCount'], 3651)

    def test_each_reviewed_page_has_exact_published_reference_coverage(self):
        refs = {r for s in self.bank['sets'] for q in s['questions'] for r in q.get('sourceRefs', [])}
        for s in self.index['sources']:
            for p in s['reviewedPages']:
                with self.subTest(source=s['id'], page=p):
                    actual = {r for r in refs if r.startswith(f"pdf:{s['id']}:p{p:03d}:")}
                    self.assertEqual(set(s['pageItems'][str(p)]), actual)

    def test_builder_rejects_an_ambiguous_question_even_if_it_has_a_valid_answer_letter(self):
        spec = importlib.util.spec_from_file_location('final_builder', ROOT / 'scripts/build_toefl_tasks.py')
        builder = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(builder)
        with tempfile.TemporaryDirectory() as directory:
            repo = Path(directory)
            shutil.copytree(ROOT / 'data/toefl-migration', repo / 'data/toefl-migration')
            (repo / 'scripts').mkdir()
            shutil.copy(ROOT / 'scripts/reading-source-index.json', repo / 'scripts/reading-source-index.json')
            path = repo / 'data/toefl-migration/pdf-task3-p084-089.json'
            item = json.loads(path.read_text())
            item['questions'][0]['sourceRefs'] = [PENDING]
            path.write_text(json.dumps(item))
            legacy = json.loads((ROOT / 'static/data/english-question-bank.json').read_text())
            feed = json.loads((ROOT / 'static/data/toefl-reading-bank.json').read_text())
            with self.assertRaisesRegex(ValueError, 'unresolved source item must not be published'):
                builder.build_task_catalog(repo, legacy, feed)


if __name__ == '__main__':
    unittest.main()
