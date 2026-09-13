import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('task_builder', ROOT/'scripts/build_toefl_tasks.py')
BUILDER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BUILDER)


class TaskCatalogTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.repo = Path(self.temp.name)
        shutil.copytree(ROOT/'data/toefl-migration', self.repo/'data/toefl-migration')
        shutil.copy(ROOT/'data/toefl-quick-reading.json', self.repo/'data/toefl-quick-reading.json')
        (self.repo/'scripts').mkdir()
        shutil.copy(ROOT/'scripts/reading-source-index.json', self.repo/'scripts/reading-source-index.json')
        (self.repo/'static/data').mkdir(parents=True)
        self.legacy = json.loads((ROOT/'static/data/english-question-bank.json').read_text())
        self.feed = json.loads((ROOT/'static/data/toefl-reading-bank.json').read_text())

    def tearDown(self):
        self.temp.cleanup()

    def build(self):
        return BUILDER.build_task_catalog(self.repo,self.legacy,self.feed)

    def change(self, filename, fn):
        path=self.repo/filename
        data=json.loads(path.read_text())
        fn(data)
        path.write_text(json.dumps(data))

    def test_all_three_tasks_are_auto_graded_and_coverage_is_honest(self):
        bank=self.build()
        self.assertEqual(set(s['collection'] for s in bank['sets']),{'Task 1','Task 2','Task 3'})
        self.assertEqual(bank['selfCheckCount'],0)
        self.assertGreaterEqual(bank['migration']['legacyTotal'],1040)
        self.assertGreaterEqual(bank['migration']['legacyConverted'],9)
        self.assertEqual(bank['migration']['pdfPageTotal'],410)
        if bank['migration']['pdfReviewedPages'] < bank['migration']['pdfPageTotal']:
            self.assertIsNone(bank['migration']['pdfTotalQuestions'])
            self.assertFalse(bank['migration']['complete'])
        self.assertGreaterEqual(bank['migration']['pdfPublished'],19)
        questions=[q for s in bank['sets'] for q in s['questions']]
        self.assertEqual(len({q['id'] for q in questions}),len(questions))
        self.assertTrue(all(q.get('acceptedAnswers') or q['options'] for q in questions))

    def test_existing_feed_progress_ids_are_preserved(self):
        original={q['id'] for s in self.feed['sets'] for q in s['questions']}
        current={q['id'] for s in self.build()['sets'] for q in s['questions']}
        self.assertTrue(original <= current)

    def test_complete_balanced_diet_source_coverage(self):
        bank=self.build()
        converted=next(s for s in bank['sets'] if s['id']=='legacy-balanced-diet')
        self.assertEqual({ref for q in converted['questions'] for ref in q['sourceRefs']},
                         {f'legacy:english-reading-balanced-diet-03-q{i}' for i in range(1,10)})

    def test_complete_alpine_ecosystems_source_coverage(self):
        bank=self.build()
        converted=next(s for s in bank['sets'] if s['id']=='legacy-alpine-ecosystems')
        self.assertEqual({ref for q in converted['questions'] for ref in q['sourceRefs']},
                         {f'legacy:english-reading-academic-alpine-ecosystems-evidence-01-q{i}' for i in range(1,10)})
        self.assertEqual(len(converted['questions']),9)

    def test_complete_arthropod_source_and_passage_preserved(self):
        bank = self.build()
        converted = next(s for s in bank['sets'] if s['id'] == 'legacy-arthropod-molting')
        source_id = 'english-reading-academic-arthropod-molting-control-07'
        self.assertEqual(len(converted['questions']), 9)
        self.assertEqual([q['sourceRefs'] for q in converted['questions']],
                         [[f'legacy:{source_id}-q{i}'] for i in range(1, 10)])
        original = (ROOT / 'content/posts' / f'{source_id}.md').read_text()
        section = original.split('## 問題：')[1].split('### 語注')[0]
        passage = '\n'.join(line[2:] if line.startswith('> ') else line[1:]
                            for line in section.splitlines() if line.startswith('>')).strip()
        self.assertTrue(all(q['passage'] == passage for q in converted['questions']))
        self.assertEqual([q['correct'] for q in converted['questions']], list('BACDBACDB'))

    def test_pdf_task1_page12_all_fifteen_blanks(self):
        bank = self.build()
        item = next(s for s in bank['sets'] if s['id'] == 'pdf-task1-p012')
        self.assertEqual(item['collection'], 'Task 1')
        expected = [
            ('lenge', 'challenge'), ('ario', 'scenario'), ('ther', 'whether'),
            ('ike', 'Unlike'), ('ich', 'which'), ('ssion', 'succession'),
            ('gical', 'geological'), ('ay', 'away'), ('mous', 'enormous'),
            ('used', 'focused'), ('ses', 'gases'), ('se', 'pose'),
            ('rship', 'leadership'), ('ke', 'make'), ('sk', 'risk')]
        self.assertEqual([q['acceptedAnswers'] for q in item['questions']],
                         [list(pair) for pair in expected])
        refs = [[f'pdf:task1:p012:q{ex}-gap{gap}']
                for ex in range(11, 16) for gap in range(1, 4)]
        self.assertEqual([q['sourceRefs'] for q in item['questions']], refs)
        self.assertEqual(len({q['passage'] for q in item['questions']}), 5)
        self.assertTrue(all(q['correct'] is None and q['options'] == []
                            for q in item['questions']))

    def test_duplicate_source_reference_rejected(self):
        self.change('data/toefl-migration/legacy-balanced-diet.json',lambda d:d['questions'][1].update(sourceRefs=d['questions'][0]['sourceRefs']))
        with self.assertRaises(ValueError): self.build()

    def test_unknown_legacy_question_rejected(self):
        self.change('data/toefl-migration/legacy-balanced-diet.json',lambda d:d['questions'][0].update(sourceRefs=['legacy:missing']))
        with self.assertRaises(ValueError): self.build()

    def test_japanese_free_response_cannot_be_mislabeled_as_converted(self):
        self.change('data/toefl-migration/legacy-balanced-diet.json',lambda d:d['questions'][0].update(prompt='日本語で説明しなさい'))
        with self.assertRaises(ValueError): self.build()

    def test_invalid_correct_label_rejected(self):
        self.change('data/toefl-migration/pdf-task2-p008.json',lambda d:d['questions'][0].update(correct='E'))
        with self.assertRaises(ValueError): self.build()

    def test_falsely_reviewed_page_rejected(self):
        self.change('scripts/reading-source-index.json',lambda d:d['sources'][0]['reviewedPages'].append(1))
        with self.assertRaises(ValueError): self.build()

    def test_source_inventory_covers_every_page_exactly_once(self):
        index=json.loads((ROOT/'scripts/reading-source-index.json').read_text())
        total=0
        for source in index['sources']:
            pages=[]
            for packet in source['packets']:
                # Private OCR is deliberately absent from the public checkout.
                self.assertTrue(packet['path'].startswith('scripts/reading-source-text/'))
                self.assertLessEqual(packet['firstPage'],packet['lastPage'])
                pages.extend(range(packet['firstPage'],packet['lastPage']+1))
            self.assertEqual(pages,list(range(1,source['pageCount']+1)))
            total += len(pages)
        self.assertEqual(total,410)


if __name__=='__main__': unittest.main()
