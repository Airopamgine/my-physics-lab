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

    def test_rivers_and_color_preserve_all_source_targets(self):
        bank = self.build()
        cases = [
            ('legacy-atmospheric-rivers', 'english-reading-academic-atmospheric-rivers-risk-benefit-24', 'CADCBDACB'),
            ('legacy-color-accessibility', 'english-reading-academic-color-context-accessibility-06', 'BCADBCADB')]
        for set_id, source_id, keys in cases:
            with self.subTest(set_id=set_id):
                item = next(s for s in bank['sets'] if s['id'] == set_id)
                self.assertEqual(len(item['questions']), 9)
                self.assertEqual([q['sourceRefs'] for q in item['questions']],
                                 [[f'legacy:{source_id}-q{i}'] for i in range(1, 10)])
                self.assertEqual([q['correct'] for q in item['questions']], list(keys))
                original = (ROOT / 'content/posts' / f'{source_id}.md').read_text()
                section = original.split('## 問題：')[1].split('### 語注')[0]
                passage = '\n'.join(line[2:] if line.startswith('> ') else line[1:]
                                    for line in section.splitlines() if line.startswith('>')).strip()
                self.assertTrue(all(q['passage'] == passage for q in item['questions']))

    def test_task2_daily_life_preserves_all_questions_through_page13(self):
        bank = self.build()
        item = next(s for s in bank['sets'] if s['id'] == 'pdf-task2-p009-013')
        refs = [f'pdf:task2:p{page:03d}:q{question:02d}'
                for page, question in [(9, 3), (9, 4), (10, 1), (10, 2),
                                       (11, 3), (11, 4), (12, 5), (12, 6),
                                       (13, 7), (13, 8), (13, 9)]]
        self.assertEqual([q['sourceRefs'] for q in item['questions']], [[ref] for ref in refs])
        self.assertEqual([q['correct'] for q in item['questions']], list('ABCDCAACBBC'))
        self.assertEqual(len({q['passage'] for q in item['questions']}), 6)
        index = json.loads((ROOT / 'scripts/reading-source-index.json').read_text())
        source = next(s for s in index['sources'] if s['id'] == 'task2')
        self.assertTrue({9, 10, 11, 12, 13}.issubset(source['reviewedPages']))
        self.assertEqual(source['pageItems']['13'], [
            'pdf:task2:p013:q07', 'pdf:task2:p013:q08', 'pdf:task2:p013:q09'])

    def test_task1_feedback_is_deferred_until_all_blanks_in_a_passage_are_submitted(self):
        script = (ROOT / 'static/js/english-library.js').read_text()
        self.assertIn('function sameGapPassage(left, right)', script)
        self.assertIn('Save and continue', script)
        self.assertIn('if (!isFinalGapInPassage())', script)
        self.assertIn('全空欄を提出したため、ここで正答をまとめて表示します', script)

    def test_cubism_and_deep_sea_preserve_passages_and_all_nine_targets(self):
        bank = self.build()
        cases = [
            ('legacy-cubism-classification', 'english-reading-academic-cubism-classification-evidence-05', 'BCADBCADB'),
            ('legacy-deep-sea-adaptation', 'english-reading-academic-deep-sea-adaptation-tradeoffs-02', 'BCADBDACB')]
        for set_id, source_id, keys in cases:
            with self.subTest(set_id=set_id):
                item = next(s for s in bank['sets'] if s['id'] == set_id)
                self.assertEqual(len(item['questions']), 9)
                self.assertEqual([q['sourceRefs'] for q in item['questions']],
                                 [[f'legacy:{source_id}-q{i}'] for i in range(1, 10)])
                self.assertEqual([q['correct'] for q in item['questions']], list(keys))
                original = (ROOT / 'content/posts' / f'{source_id}.md').read_text()
                section = original.split('## 問題：')[1].split('### 語注')[0]
                passage = '\n'.join(line[2:] if line.startswith('> ') else line[1:]
                                    for line in section.splitlines() if line.startswith('>')).strip()
                self.assertTrue(all(q['passage'] == passage for q in item['questions']))
                self.assertTrue(all(len(q['options']) == 4 for q in item['questions']))

    def test_pdf_task3_pages9_to13_preserve_twelve_answers_and_page_coverage(self):
        bank = self.build()
        item = next(s for s in bank['sets'] if s['id'] == 'pdf-task3-p009-013')
        refs = [
            'pdf:task3:p009:q03', 'pdf:task3:p009:q04',
            *[f'pdf:task3:p011:q{i:02d}' for i in range(1, 6)],
            *[f'pdf:task3:p013:q{i:02d}' for i in range(6, 11)]]
        self.assertEqual([q['sourceRefs'] for q in item['questions']], [[ref] for ref in refs])
        self.assertEqual([q['correct'] for q in item['questions']], list('BBCCCDCBCCAD'))
        self.assertEqual(len({q['passage'] for q in item['questions']}), 4)
        insertion = item['questions'][-1]
        self.assertIn('For instance, timing irregularities', insertion['prompt'])
        self.assertEqual([o['label'] for o in insertion['options']], list('ABCD'))
        self.assertTrue(all(o['text'].startswith(('Before', 'After')) for o in insertion['options']))
        index = json.loads((ROOT / 'scripts/reading-source-index.json').read_text())
        source = next(s for s in index['sources'] if s['id'] == 'task3')
        self.assertTrue({9, 10, 11, 12, 13}.issubset(source['reviewedPages']))
        self.assertEqual(source['pageItems']['10'], [])
        self.assertEqual(source['pageItems']['12'], [])

    def test_habitus_and_hotelling_preserve_passages_and_all_targets(self):
        bank = self.build()
        cases = [
            ('legacy-habitus-practice', 'english-reading-academic-habitus-disposition-practice-14', 'BCADBCADB'),
            ('legacy-hotelling-location', 'english-reading-academic-hotelling-location-competition-15', 'BBCCDBCAD')]
        for set_id, source_id, keys in cases:
            with self.subTest(set_id=set_id):
                item = next(s for s in bank['sets'] if s['id'] == set_id)
                self.assertEqual(len(item['questions']), 9)
                self.assertEqual([q['sourceRefs'] for q in item['questions']],
                                 [[f'legacy:{source_id}-q{i}'] for i in range(1, 10)])
                self.assertEqual([q['correct'] for q in item['questions']], list(keys))
                original = (ROOT / 'content/posts' / f'{source_id}.md').read_text()
                section = original.split('## 問題：')[1].split('### 語注')[0]
                passage = '\n'.join(line[2:] if line.startswith('> ') else line[1:]
                                    for line in section.splitlines() if line.startswith('>')).strip()
                self.assertTrue(all(q['passage'] == passage for q in item['questions']))
                self.assertTrue(all(len(q['options']) == 4 for q in item['questions']))

    def test_actual_tests_preserve_all_module_answers_and_pages(self):
        bank = self.build()
        task1 = next(s for s in bank['sets'] if s['id'] == 'pdf-actual-test1-module1-task1')
        task2 = next(s for s in bank['sets'] if s['id'] == 'pdf-actual-test1-module1-task2')
        task3 = next(s for s in bank['sets'] if s['id'] == 'pdf-actual-test1-module1-task3')
        module2_task1 = next(s for s in bank['sets'] if s['id'] == 'pdf-actual-test1-module2-task1')
        module2_task3 = next(s for s in bank['sets'] if s['id'] == 'pdf-actual-test1-module2-task3')
        test2_task1 = next(s for s in bank['sets'] if s['id'] == 'pdf-actual-test2-module1-task1')
        test2_task2 = next(s for s in bank['sets'] if s['id'] == 'pdf-actual-test2-module1-task2')
        test2_task3 = next(s for s in bank['sets'] if s['id'] == 'pdf-actual-test2-module1-task3')
        test2_module2_task1 = next(s for s in bank['sets'] if s['id'] == 'pdf-actual-test2-module2-task1')
        test2_module2_task3 = next(s for s in bank['sets'] if s['id'] == 'pdf-actual-test2-module2-task3')
        expected_words = [
            ('gue', 'plague'), ('nsible', 'responsible'), ('ly', 'only'),
            ('he', 'the'), ('rly', 'nearly'), ('ire', 'entire'),
            ('ut', 'but'), ('or', 'for'), ('ute', 'acute'),
            ('tages', 'shortages')]
        self.assertEqual([q['acceptedAnswers'] for q in task1['questions']],
                         [list(pair) for pair in expected_words])
        self.assertEqual([q['sourceRefs'] for q in task1['questions']],
                         [[f'pdf:actual:p003:q{i:02d}'] for i in range(1, 11)])
        self.assertEqual([q['correct'] for q in task2['questions']], list('DABDC'))
        self.assertEqual([q['sourceRefs'] for q in task2['questions']],
                         [[f'pdf:actual:p004:q{i:02d}'] for i in range(11, 13)] +
                         [[f'pdf:actual:p005:q{i:02d}'] for i in range(13, 16)])
        self.assertEqual([q['correct'] for q in task3['questions']], list('ACCDB'))
        self.assertEqual([q['sourceRefs'] for q in task3['questions']],
                         [[f'pdf:actual:p007:q{i:02d}'] for i in range(16, 21)])
        module2_words = [
            ('re', 'are'), ('or', 'for'), ('acles', 'tentacles'),
            ('ve', 'give'), ('cise', 'precise'), ('trol', 'control'),
            ('guishes', 'distinguishes'), ('om', 'from'), ('her', 'other'),
            ('an', 'can')]
        self.assertEqual([q['acceptedAnswers'] for q in module2_task1['questions']],
                         [list(pair) for pair in module2_words])
        self.assertEqual([q['sourceRefs'] for q in module2_task1['questions']],
                         [[f'pdf:actual:p009:q{i:02d}'] for i in range(1, 11)])
        self.assertEqual([q['correct'] for q in module2_task3['questions']], list('CABBD'))
        self.assertEqual([q['sourceRefs'] for q in module2_task3['questions']],
                         [[f'pdf:actual:p011:q{i:02d}'] for i in range(11, 16)])
        self.assertTrue(all(len(q['passage'].split('\n\n')) == 3
                            for q in module2_task3['questions']))
        test2_words = [
            ('is', 'This'), ('ich', 'which'), ('nized', 'organized'),
            ('nents', 'components'), ('s', 'as'), ('art', 'heart'),
            ('sels', 'vessels'), ('to', 'into'), ('th', 'both'),
            ('ical', 'critical'), ('en', 'When'), ('s', 'is'),
            ('ot', 'not'), ('age', 'engage'), ('cular', 'particular'),
            ('an', 'can'), ('tance', 'resistance'), ('nsify', 'intensify'),
            ('nation', 'inclination'), ('eir', 'their')]
        self.assertEqual([q['acceptedAnswers'] for q in test2_task1['questions']],
                         [list(pair) for pair in test2_words])
        self.assertEqual([q['sourceRefs'] for q in test2_task1['questions']],
                         [[f'pdf:actual:p013:q{i:02d}'] for i in range(1, 11)] +
                         [[f'pdf:actual:p014:q{i:02d}'] for i in range(11, 21)])
        passages = [q['passage'] for q in test2_task1['questions']]
        self.assertEqual(sorted(passages.count(p) for p in set(passages)), [10, 10])
        self.assertEqual([q['correct'] for q in test2_task2['questions']], list('BDABCC'))
        self.assertEqual([q['sourceRefs'] for q in test2_task2['questions']],
                         [[f'pdf:actual:p016:q{i:02d}'] for i in range(23, 26)] +
                         [[f'pdf:actual:p017:q{i:02d}'] for i in range(26, 29)])
        self.assertEqual([q['correct'] for q in test2_task3['questions']], list('BADCB'))
        self.assertEqual([q['sourceRefs'] for q in test2_task3['questions']],
                         [[f'pdf:actual:p019:q{i:02d}'] for i in range(29, 34)])
        self.assertTrue(all(len(q['passage'].split('\n\n')) == 3
                            for q in test2_task3['questions']))
        test2_module2_words = [
            ('trates', 'demonstrates'), ('ur', 'our'), ('et', 'diet'),
            ('els', 'levels'), ('en', 'even'), ('an', 'can'),
            ('uence', 'influence'), ('idual', 'individual'),
            ('essed', 'expressed'), ('ting', 'mutating')]
        self.assertEqual([q['acceptedAnswers'] for q in test2_module2_task1['questions']],
                         [list(pair) for pair in test2_module2_words])
        self.assertEqual([q['sourceRefs'] for q in test2_module2_task1['questions']],
                         [[f'pdf:actual:p021:q{i:02d}'] for i in range(1, 11)])
        self.assertEqual([q['correct'] for q in test2_module2_task3['questions']],
                         list('ABCBD'))
        self.assertEqual([q['sourceRefs'] for q in test2_module2_task3['questions']],
                         [[f'pdf:actual:p023:q{i:02d}'] for i in range(11, 16)])
        self.assertTrue(all(len(q['passage'].split('\n\n')) == 3
                            for q in test2_module2_task3['questions']))
        index = json.loads((ROOT / 'scripts/reading-source-index.json').read_text())
        source = next(s for s in index['sources'] if s['id'] == 'actual')
        self.assertEqual(source['reviewedPages'], list(range(1, 15)) + list(range(16, 25)))
        self.assertEqual(source['pageItems']['1'], [])
        self.assertEqual(source['pageItems']['2'], [])
        self.assertEqual(source['pageItems']['6'], [])
        self.assertEqual(source['pageItems']['8'], [])
        self.assertEqual(source['pageItems']['10'], [])
        self.assertEqual(source['pageItems']['12'], [])
        self.assertEqual(source['pageItems']['13'],
                         [f'pdf:actual:p013:q{i:02d}' for i in range(1, 11)])
        self.assertEqual(source['pageItems']['14'],
                         [f'pdf:actual:p014:q{i:02d}' for i in range(11, 21)])
        self.assertEqual(source['pageItems']['16'],
                         [f'pdf:actual:p016:q{i:02d}' for i in range(23, 26)])
        self.assertEqual(source['pageItems']['17'],
                         [f'pdf:actual:p017:q{i:02d}' for i in range(26, 29)])
        self.assertEqual(source['pageItems']['18'], [])
        self.assertEqual(source['pageItems']['19'],
                         [f'pdf:actual:p019:q{i:02d}' for i in range(29, 34)])
        self.assertEqual(source['pageItems']['20'], [])
        self.assertEqual(source['pageItems']['21'],
                         [f'pdf:actual:p021:q{i:02d}' for i in range(1, 11)])
        self.assertEqual(source['pageItems']['22'], [])
        self.assertEqual(source['pageItems']['23'],
                         [f'pdf:actual:p023:q{i:02d}' for i in range(11, 16)])
        self.assertEqual(source['pageItems']['24'], [])
        blocked = next(item for item in index['blockedItems']
                       if item['source'] == 'actual' and item['pages'] == [15])
        self.assertEqual(blocked['items'],
                         ['pdf:actual:p015:q21', 'pdf:actual:p015:q22'])

    def test_hyena_and_industrial_revolution_preserve_passages_and_all_targets(self):
        bank = self.build()
        cases = [
            ('legacy-hyena-rank', 'english-reading-academic-hyena-rank-social-support-13', 'BCADBCADB'),
            ('legacy-industrial-revolution', 'english-reading-academic-industrial-revolution-uneven-change-20', 'BCAADBCAD')]
        for set_id, source_id, keys in cases:
            with self.subTest(set_id=set_id):
                item = next(s for s in bank['sets'] if s['id'] == set_id)
                self.assertEqual(len(item['questions']), 9)
                self.assertEqual([q['sourceRefs'] for q in item['questions']],
                                 [[f'legacy:{source_id}-q{i}'] for i in range(1, 10)])
                self.assertEqual([q['correct'] for q in item['questions']], list(keys))
                original = (ROOT / 'content/posts' / f'{source_id}.md').read_text()
                section = original.split('## 問題：')[1].split('### 語注')[0]
                passage = '\n'.join(line[2:] if line.startswith('> ') else line[1:]
                                    for line in section.splitlines() if line.startswith('>')).strip()
                self.assertTrue(all(q['passage'] == passage for q in item['questions']))
                self.assertTrue(all(len(q['options']) == 4 for q in item['questions']))

    def test_supernova_and_tohoku_preserve_passages_and_all_targets(self):
        bank = self.build()
        cases = [
            ('legacy-supernova-pathways-elements',
             'english-reading-advanced-supernova-pathways-elements-29', 'BABBBCABA'),
            ('legacy-tohoku-disaster-risk-layers',
             'english-reading-advanced-tohoku-disaster-risk-layers-22', 'BAABCCBAD')]
        for set_id, source_id, keys in cases:
            with self.subTest(set_id=set_id):
                item = next(s for s in bank['sets'] if s['id'] == set_id)
                self.assertEqual(len(item['questions']), 9)
                self.assertEqual([q['sourceRefs'] for q in item['questions']],
                                 [[f'legacy:{source_id}-q{i}'] for i in range(1, 10)])
                self.assertEqual([q['correct'] for q in item['questions']], list(keys))
                original = (ROOT / 'content/posts' / f'{source_id}.md').read_text()
                section = original.split('## 問題：')[1].split('### 語注')[0]
                passage = '\n'.join(line[2:] if line.startswith('> ') else line[1:]
                                    for line in section.splitlines() if line.startswith('>')).strip()
                self.assertTrue(all(q['passage'] == passage for q in item['questions']))
                self.assertTrue(all(len(q['options']) == 4 for q in item['questions']))

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
