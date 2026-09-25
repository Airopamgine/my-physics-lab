import importlib.util
import json
import re
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

    def test_pdf_task1_page14_preserves_all_twenty_test_blanks(self):
        bank = self.build()
        item = next(s for s in bank['sets'] if s['id'] == 'pdf-task1-p014')
        expected = [
            ('ays', 'plays'), ('le', 'role'), ('e', 'the'), ('f', 'of'),
            ('ries', 'memories'), ('zation', 'organization'),
            ('iences', 'experiences'), ('omes', 'becomes'),
            ('ing', 'during'), ('at', 'that'), ('f', 'of'),
            ('eristic', 'characteristic'), ('s', 'is'), ('ible', 'possible'),
            ('ee', 'see'), ('th', 'with'), ('es', 'eyes'),
            ('tead', 'instead'), ('ut', 'out'), ('tions', 'locations')]
        self.assertEqual(item['collection'], 'Task 1')
        self.assertEqual([q['acceptedAnswers'] for q in item['questions']],
                         [list(pair) for pair in expected])
        refs = [f'pdf:task1:p014:q{i:02d}-gap1' for i in range(1, 21)]
        self.assertEqual([q['sourceRefs'][0] for q in item['questions']], refs)
        self.assertEqual(len({q['passage'] for q in item['questions']}), 2)
        self.assertTrue(all(q['correct'] is None and q['options'] == []
                            for q in item['questions']))

        index = json.loads((ROOT / 'scripts/reading-source-index.json').read_text())
        source = next(s for s in index['sources'] if s['id'] == 'task1')
        self.assertEqual(source['reviewedPages'][:14], list(range(1, 15)))
        self.assertEqual(source['pageItems']['14'], refs)
        self.assertTrue(all(source['pageItems'][str(page)] == []
                            for page in range(3, 10)))

    def test_pdf_task1_page15_preserves_test_blanks_twenty_one_through_forty(self):
        bank = self.build()
        item = next(s for s in bank['sets'] if s['id'] == 'pdf-task1-p015')
        expected = [
            ('easing', 'increasing'), ('n', 'on'), ('cles', 'vehicles'),
            ('kes', 'makes'), ('eets', 'streets'), ('lting', 'resulting'),
            ('ays', 'delays'), ('dents', 'accidents'), ('ding', 'building'),
            ('ads', 'roads'), ('rm', 'form'), ('nd', 'wind'), ('s', 'is'),
            ('ugh', 'enough'), ('sport', 'transport'), ('icles', 'particles'),
            ('ulate', 'accumulate'), ('acles', 'obstacles'), ('ape', 'shape'),
            ('mined', 'determined')]
        self.assertEqual(item['collection'], 'Task 1')
        self.assertEqual([q['acceptedAnswers'] for q in item['questions']],
                         [list(pair) for pair in expected])
        refs = [f'pdf:task1:p015:q{i:02d}-gap1' for i in range(21, 41)]
        self.assertEqual([q['sourceRefs'][0] for q in item['questions']], refs)
        self.assertEqual(len({q['passage'] for q in item['questions']}), 2)
        self.assertTrue(all(q['correct'] is None and q['options'] == []
                            for q in item['questions']))

        index = json.loads((ROOT / 'scripts/reading-source-index.json').read_text())
        source = next(s for s in index['sources'] if s['id'] == 'task1')
        self.assertEqual(source['reviewedPages'], list(range(1, 16)))
        self.assertEqual(source['pageItems']['15'], refs)

    def test_pdf_task3_detail_questions_preserve_all_fifteen_answers(self):
        bank = self.build()
        item = next(s for s in bank['sets'] if s['id'] == 'pdf-task3-p019-025')
        self.assertEqual(item['collection'], 'Task 3')
        self.assertEqual([q['correct'] for q in item['questions']],
                         list('BDCBCBCBCCBDCAA'))
        refs = (["pdf:task3:p019:qexample-detail"] +
                [f'pdf:task3:p020:q{i:02d}' for i in range(1, 3)] +
                [f'pdf:task3:p021:q{i:02d}' for i in range(3, 5)] +
                [f'pdf:task3:p023:q{i:02d}' for i in range(1, 6)] +
                [f'pdf:task3:p025:q{i:02d}' for i in range(6, 11)])
        self.assertEqual([q['sourceRefs'][0] for q in item['questions']], refs)
        self.assertEqual(len({q['passage'] for q in item['questions']}), 7)
        index = json.loads((ROOT / 'scripts/reading-source-index.json').read_text())
        reading = next(s for s in index['sources'] if s['id'] == 'reading')
        task3 = next(s for s in index['sources'] if s['id'] == 'task3')
        self.assertEqual(reading['reviewedPages'], list(range(1, 39)))
        self.assertEqual(task3['reviewedPages'][:25], list(range(1, 26)))
        self.assertEqual([ref for page in task3['pageItems'] for ref in task3['pageItems'][page]
                          if 18 <= int(page) <= 25], refs)

    def test_pdf_task3_detail_test_preserves_questions_eleven_through_twenty(self):
        bank = self.build()
        item = next(s for s in bank['sets'] if s['id'] == 'pdf-task3-p026-029')
        refs = ([f'pdf:task3:p027:q{i:02d}' for i in range(11, 16)] +
                [f'pdf:task3:p029:q{i:02d}' for i in range(16, 21)])
        self.assertEqual(item['collection'], 'Task 3')
        self.assertEqual(len(item['questions']), 10)
        self.assertEqual([q['sourceRefs'][0] for q in item['questions']], refs)
        self.assertEqual([q['correct'] for q in item['questions']],
                         list('BCCBDCCCBC'))
        self.assertEqual(len({q['passage'] for q in item['questions']}), 2)
        self.assertTrue(all(len(q['passage'].split('\n\n')) == 3
                            for q in item['questions']))
        self.assertTrue(all(len(q['options']) == 4 for q in item['questions']))

        index = json.loads((ROOT / 'scripts/reading-source-index.json').read_text())
        source = next(s for s in index['sources'] if s['id'] == 'task3')
        self.assertEqual(source['reviewedPages'], list(range(1, 30)))
        self.assertEqual(source['pageItems']['26'], [])
        self.assertEqual(source['pageItems']['27'], refs[:5])
        self.assertEqual(source['pageItems']['28'], [])
        self.assertEqual(source['pageItems']['29'], refs[5:])

    def test_reading_diagnostic_preserves_all_twenty_answers(self):
        bank = self.build()
        sets = {item['id']: item for item in bank['sets']}
        task1 = sets['pdf-reading-diagnostic-task1-p032']
        task2 = sets['pdf-reading-diagnostic-task2-p033-035']
        task3 = sets['pdf-reading-diagnostic-task3-p036-037']

        self.assertEqual([task1['collection'], task2['collection'], task3['collection']],
                         ['Task 1', 'Task 2', 'Task 3'])
        expected_words = [
            ('pes', 'types'), ('oss', 'across'), ('ions', 'regions'),
            ('rences', 'differences'), ('nmental', 'environmental'),
            ('ese', 'These'), ('n', 'in'), ('uence', 'influence'),
            ('ation', 'vegetation'), ('ch', 'each')]
        self.assertEqual([q['acceptedAnswers'] for q in task1['questions']],
                         [list(pair) for pair in expected_words])
        self.assertEqual([q['correct'] for q in task2['questions']], list('CBACD'))
        self.assertEqual([q['correct'] for q in task3['questions']], list('CBDCA'))

        expected_refs = [f'pdf:reading:p032:q{i:02d}-gap1' for i in range(1, 11)]
        expected_refs += [f'pdf:reading:p033:q{i}' for i in range(11, 13)]
        expected_refs += [f'pdf:reading:p035:q{i}' for i in range(13, 16)]
        expected_refs += [f'pdf:reading:p037:q{i}' for i in range(16, 21)]
        actual_refs = [q['sourceRefs'][0]
                       for item in (task1, task2, task3) for q in item['questions']]
        self.assertEqual(actual_refs, expected_refs)

        index = json.loads((ROOT / 'scripts/reading-source-index.json').read_text())
        source = next(s for s in index['sources'] if s['id'] == 'reading')
        self.assertEqual(source['reviewedPages'], list(range(1, 39)))
        indexed_refs = [ref for page in source['pageItems'].values() for ref in page]
        self.assertEqual(indexed_refs, expected_refs)
        self.assertTrue(all(source['pageItems'][str(page)] == []
                            for page in list(range(24, 32)) + [34, 36, 38]))

    def test_vocabulary_day01_all_sixty_headwords_complete_page2(self):
        bank = self.build()
        part3 = next(s for s in bank['sets']
                     if s['id'] == 'pdf-vocabulary-day01-part3')
        part3_expected = [
            ('arch', 'research'), ('bed', 'riverbed'), ('ling', 'sibling'),
            ('tion', 'solution'), ('taneous', 'spontaneous'),
            ('ture', 'structure'), ('pass', 'surpass'),
            ('logical', 'technological'), ('eat', 'threat'),
            ('parent', 'transparent'), ('tectable', 'undetectable'),
            ('verse', 'universe'), ('age', 'usage'), ('able', 'viable'),
            ('rior', 'warrior')]
        self.assertEqual([q['acceptedAnswers'] for q in part3['questions']],
                         [list(pair) for pair in part3_expected])

        correction = next(s for s in bank['sets']
                          if s['id'] == 'pdf-vocabulary-day01-correction')
        correction_expected = [
            ('uine', 'genuine'), ('ernment', 'government'),
            ('itat', 'habitat'), ('erd', 'herd'),
            ('minated', 'illuminated')]
        self.assertEqual([q['acceptedAnswers'] for q in correction['questions']],
                         [list(pair) for pair in correction_expected])

        words = [
            'absorb', 'ambience', 'ash', 'barrier', 'blooming', 'brilliance',
            'cave', 'cognition', 'component', 'conservation', 'creative', 'crude',
            'deity', 'departure', 'diet', 'drawback', 'dynamic', 'efficiently',
            'engaging', 'erasure', 'esteem', 'fabric', 'fertile', 'foster',
            'function', 'genuine', 'government', 'habitat', 'herd', 'illuminated',
            'implementation', 'indicator', 'informed', 'installment',
            'interruption', 'invader', 'landform', 'lavish', 'likewise', 'massive',
            'mitigation', 'offspring', 'pattern', 'policy', 'proximity', 'research',
            'riverbed', 'sibling', 'solution', 'spontaneous', 'structure', 'surpass',
            'technological', 'threat', 'transparent', 'undetectable', 'universe',
            'usage', 'viable', 'warrior']
        refs = [f'pdf:vocabulary:p002:q{word}' for word in words]
        index = json.loads((ROOT / 'scripts/reading-source-index.json').read_text())
        source = next(s for s in index['sources'] if s['id'] == 'vocabulary')
        self.assertIn(2, source['reviewedPages'])
        self.assertEqual(source['pageItems']['2'], refs)

    def test_vocabulary_day04_part1_preserves_first_fifteen_headwords(self):
        bank = self.build()
        item = next(s for s in bank['sets']
                    if s['id'] == 'pdf-vocabulary-day04-part1')
        words = [
            'adapt', 'architectural', 'authentic', 'bias', 'boredom',
            'capture', 'challenge', 'community', 'conclusion', 'cornerstone',
            'criticism', 'cultural', 'demise', 'devastating', 'distinct']
        self.assertEqual([q['sourceRefs'][0] for q in item['questions']],
                         [f'pdf:vocabulary:p005:q{word}' for word in words])
        suffixes = [
            'apt', 'itectural', 'thentic', 'as', 'edom', 'ture', 'lenge',
            'unity', 'lusion', 'stone', 'icism', 'tural', 'ise', 'tating',
            'tinct']
        self.assertEqual([q['acceptedAnswers'] for q in item['questions']],
                         [[suffix, word] for suffix, word in zip(suffixes, words)])
        self.assertTrue(all(q['correct'] is None and q['options'] == []
                            for q in item['questions']))
        index = json.loads((ROOT / 'scripts/reading-source-index.json').read_text())
        source = next(s for s in index['sources'] if s['id'] == 'vocabulary')
        self.assertNotIn(5, source['reviewedPages'])
        self.assertNotIn('5', source['pageItems'])

    def test_vocabulary_day04_part2_preserves_headwords_sixteen_through_thirty(self):
        bank = self.build()
        item = next(s for s in bank['sets']
                    if s['id'] == 'pdf-vocabulary-day04-part2')
        words = [
            'drastically', 'economy', 'elongate', 'environment', 'escalate',
            'evolution', 'faint', 'fluctuation', 'fragile', 'gap', 'giant',
            'groupthink', 'health', 'humidity', 'imminent']
        self.assertEqual([q['sourceRefs'][0] for q in item['questions']],
                         [f'pdf:vocabulary:p005:q{word}' for word in words])
        suffixes = [
            'stically', 'nomy', 'ngate', 'ronment', 'alate', 'lution',
            'int', 'tuation', 'gile', 'ap', 'ant', 'think', 'lth', 'idity',
            'inent']
        self.assertEqual([q['acceptedAnswers'] for q in item['questions']],
                         [[suffix, word] for suffix, word in zip(suffixes, words)])
        self.assertTrue(all(q['correct'] is None and q['options'] == []
                            for q in item['questions']))
        index = json.loads((ROOT / 'scripts/reading-source-index.json').read_text())
        source = next(s for s in index['sources'] if s['id'] == 'vocabulary')
        self.assertNotIn(5, source['reviewedPages'])
        self.assertNotIn('5', source['pageItems'])

    def test_vocabulary_day02_all_sixty_headwords_complete_page3(self):
        bank = self.build()
        part1 = next(s for s in bank['sets']
                     if s['id'] == 'pdf-vocabulary-day02-part1')
        part1_expected = [
            ('ndant', 'abundant'), ('lysis', 'analysis'), ('ire', 'attire'),
            ('avior', 'behavior'), ('ond', 'bond'), ('den', 'burden'),
            ('ity', 'cavity'), ('erent', 'coherent'), ('press', 'compress'),
            ('mporary', 'contemporary'), ('ture', 'creature'), ('ust', 'crust'),
            ('berate', 'deliberate'), ('cent', 'descent'),
            ('repancy', 'discrepancy')]
        self.assertEqual([q['acceptedAnswers'] for q in part1['questions']],
                         [list(pair) for pair in part1_expected])

        part2 = next(s for s in bank['sets']
                     if s['id'] == 'pdf-vocabulary-day02-part2')
        part2_expected = [
            ('play', 'downplay'), ('thly', 'earthly'),
            ('orate', 'elaborate'), ('ure', 'ensure'),
            ('atic', 'erratic'), ('dence', 'evidence'),
            ('ial', 'facial'), ('mable', 'flammable'), ('oul', 'foul'),
            ('mental', 'fundamental'), ('graphy', 'geography'),
            ('breaking', 'groundbreaking'), ('sh', 'harsh'),
            ('ind', 'hind'), ('usion', 'illusion')]
        self.assertEqual([q['acceptedAnswers'] for q in part2['questions']],
                         [list(pair) for pair in part2_expected])

        part3 = next(s for s in bank['sets']
                     if s['id'] == 'pdf-vocabulary-day02-part3')
        part3_expected = [
            ('ractical', 'impractical'), ('fference', 'indifference'),
            ('nuity', 'ingenuity'), ('late', 'insulate'),
            ('lerance', 'intolerance'), ('stment', 'investment'),
            ('locked', 'landlocked'), ('out', 'layout'),
            ('ation', 'location'), ('anical', 'mechanical'),
            ('rately', 'moderately'), ('que', 'opaque'),
            ('ormer', 'performer'), ('serve', 'preserve'),
            ('uest', 'quest')]
        self.assertEqual([q['acceptedAnswers'] for q in part3['questions']],
                         [list(pair) for pair in part3_expected])

        part4 = next(s for s in bank['sets']
                     if s['id'] == 'pdf-vocabulary-day02-part4')
        part4_expected = [
            ('lience', 'resilience'), ('al', 'rural'),
            ('ficantly', 'significantly'), ('sticated', 'sophisticated'),
            ('em', 'stem'), ('tandard', 'substandard'),
            ('vival', 'survival'), ('onic', 'tectonic'),
            ('rive', 'thrive'), ('portation', 'transportation'),
            ('ven', 'uneven'), ('ficial', 'unofficial'),
            ('ination', 'vaccination'), ('tim', 'victim'),
            ('ther', 'weather')]
        self.assertEqual([q['acceptedAnswers'] for q in part4['questions']],
                         [list(pair) for pair in part4_expected])

        refs1 = [f'pdf:vocabulary:p003:q{word}'
                 for _, word in part1_expected]
        refs2 = [f'pdf:vocabulary:p003:q{word}'
                 for _, word in part2_expected]
        refs3 = [f'pdf:vocabulary:p003:q{word}'
                 for _, word in part3_expected]
        refs4 = [f'pdf:vocabulary:p003:q{word}'
                 for _, word in part4_expected]
        self.assertEqual([q['sourceRefs'] for q in part1['questions']],
                         [[ref] for ref in refs1])
        self.assertEqual([q['sourceRefs'] for q in part2['questions']],
                         [[ref] for ref in refs2])
        self.assertEqual([q['sourceRefs'] for q in part3['questions']],
                         [[ref] for ref in refs3])
        self.assertEqual([q['sourceRefs'] for q in part4['questions']],
                         [[ref] for ref in refs4])
        index = json.loads((ROOT / 'scripts/reading-source-index.json').read_text())
        source = next(s for s in index['sources'] if s['id'] == 'vocabulary')
        self.assertIn(3, source['reviewedPages'])
        self.assertEqual(source['pageItems']['3'], refs1 + refs2 + refs3 + refs4)

    def test_vocabulary_day03_all_sixty_headwords_complete_page4(self):
        bank = self.build()
        part1 = next(s for s in bank['sets']
                     if s['id'] == 'pdf-vocabulary-day03-part1')
        expected1 = [
            ('ess', 'access'), ('pe', 'ape'), ('ience', 'audience'),
            ('ficial', 'beneficial'), ('ost', 'boost'),
            ('geon', 'burgeon'), ('tury', 'century'),
            ('unication', 'communication'), ('tration', 'concentration'),
            ('ribution', 'contribution'), ('sis', 'crisis'), ('ue', 'cue'),
            ('icate', 'delicate'), ('truct', 'destruct'),
            ('parity', 'disparity')]
        self.assertEqual([q['acceptedAnswers'] for q in part1['questions']],
                         [list(pair) for pair in expected1])

        part2 = next(s for s in bank['sets']
                     if s['id'] == 'pdf-vocabulary-day03-part2')
        expected2 = [
            ('stream', 'downstream'), ('logical', 'ecological'),
            ('vated', 'elevated'), ('tainer', 'entertainer'),
            ('ption', 'eruption'), ('voke', 'evoke'),
            ('tor', 'factor'), ('law', 'flaw'),
            ('ation', 'foundation'), ('gus', 'fungus'),
            ('ture', 'gesture'), ('work', 'groundwork'),
            ('ard', 'hazard'), ('spot', 'hotspot'),
            ('ging', 'imaging')]
        self.assertEqual([q['acceptedAnswers'] for q in part2['questions']],
                         [list(pair) for pair in expected2])

        part3 = next(s for s in bank['sets']
                     if s['id'] == 'pdf-vocabulary-day03-part3')
        expected3 = [
            ('ession', 'impression'), ('pensable', 'indispensable'),
            ('ustice', 'injustice'), ('tact', 'intact'),
            ('cate', 'intricate'), ('land', 'island'),
            ('scape', 'landscape'), ('gue', 'league'),
            ('ical', 'logical'), ('tal', 'mental'),
            ('tiple', 'multiple'), ('tion', 'option'),
            ('iod', 'period'), ('bility', 'probability'),
            ('idly', 'rapidly')]
        self.assertEqual([q['acceptedAnswers'] for q in part3['questions']],
                         [list(pair) for pair in expected3])

        part4 = next(s for s in bank['sets']
                     if s['id'] == 'pdf-vocabulary-day03-part4')
        expected4 = [
            ('ource', 'resource'), ('ope', 'scope'), ('ew', 'skew'),
            ('rce', 'source'), ('nch', 'stench'),
            ('ficial', 'superficial'), ('ath', 'swath'),
            ('tative', 'tentative'), ('erate', 'tolerate'),
            ('iad', 'triad'), ('pected', 'unexpected'),
            ('alistic', 'unrealistic'), ('uely', 'vaguely'),
            ('ual', 'visual'), ('ght', 'weight')]
        self.assertEqual([q['acceptedAnswers'] for q in part4['questions']],
                         [list(pair) for pair in expected4])

        refs1 = [f'pdf:vocabulary:p004:q{word}' for _, word in expected1]
        refs2 = [f'pdf:vocabulary:p004:q{word}' for _, word in expected2]
        refs3 = [f'pdf:vocabulary:p004:q{word}' for _, word in expected3]
        refs4 = [f'pdf:vocabulary:p004:q{word}' for _, word in expected4]
        self.assertEqual([q['sourceRefs'] for q in part1['questions']],
                         [[ref] for ref in refs1])
        self.assertEqual([q['sourceRefs'] for q in part2['questions']],
                         [[ref] for ref in refs2])
        self.assertEqual([q['sourceRefs'] for q in part3['questions']],
                         [[ref] for ref in refs3])
        self.assertEqual([q['sourceRefs'] for q in part4['questions']],
                         [[ref] for ref in refs4])
        self.assertTrue(all(q['correct'] is None and q['options'] == []
                            for item in (part1, part2, part3, part4)
                            for q in item['questions']))

        index = json.loads((ROOT / 'scripts/reading-source-index.json').read_text())
        source = next(s for s in index['sources'] if s['id'] == 'vocabulary')
        self.assertIn(4, source['reviewedPages'])
        self.assertEqual(source['pageItems']['4'],
                         refs1 + refs2 + refs3 + refs4)

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

    def test_vehicle_safety_and_ammonia_preserve_all_source_targets(self):
        bank = self.build()
        cases = [
            ('legacy-automated-vehicle-safety',
             'english-reading-standard-ai-safety-21', 'CBDCCBDAC'),
            ('legacy-ammonia-equilibrium-systems',
             'english-reading-standard-ammonia-equilibrium-systems-33',
             'BCBCADBAC')]
        for set_id, source_id, keys in cases:
            with self.subTest(set_id=set_id):
                item = next(s for s in bank['sets'] if s['id'] == set_id)
                self.assertEqual(len(item['questions']), 9)
                self.assertEqual([q['sourceRefs'] for q in item['questions']],
                                 [[f'legacy:{source_id}-q{i}']
                                  for i in range(1, 10)])
                self.assertEqual([q['correct'] for q in item['questions']],
                                 list(keys))
                original = (ROOT / 'content/posts' / f'{source_id}.md').read_text()
                section = original.split('## 問題：')[1].split('### 語注')[0]
                passage = '\n'.join(
                    line[2:] if line.startswith('> ') else line[1:]
                    for line in section.splitlines() if line.startswith('>')).strip()
                self.assertTrue(all(q['passage'] == passage
                                    for q in item['questions']))

    def test_art_and_hospitality_preserve_all_source_targets(self):
        bank = self.build()
        cases = [
            ('legacy-art-object-relationship',
             'english-reading-standard-art-05', 'ACBDBCADB'),
            ('legacy-hospitality-belonging',
             'english-reading-standard-belonging-hospitality-28',
             'BDAACCBDA')]
        for set_id, source_id, keys in cases:
            with self.subTest(set_id=set_id):
                item = next(s for s in bank['sets'] if s['id'] == set_id)
                self.assertEqual(len(item['questions']), 9)
                self.assertEqual([q['sourceRefs'] for q in item['questions']],
                                 [[f'legacy:{source_id}-q{i}']
                                  for i in range(1, 10)])
                self.assertEqual([q['correct'] for q in item['questions']],
                                 list(keys))
                original = (ROOT / 'content/posts' / f'{source_id}.md').read_text()
                section = original.split('## 問題：')[1].split('### 語注')[0]
                passage = '\n'.join(
                    line[2:] if line.startswith('> ') else line[1:]
                    for line in section.splitlines() if line.startswith('>')).strip()
                self.assertTrue(all(q['passage'] == passage
                                    for q in item['questions']))

    def test_classified_documents_and_collectibles_preserve_all_source_targets(self):
        bank = self.build()
        cases = [
            ('legacy-classified-history-restraint',
             'english-reading-standard-classified-history-restraint-27',
             'CBDACBADB'),
            ('legacy-collectibles-food-waste',
             'english-reading-standard-collectibles-food-waste-24',
             'CADABBCDA')]
        for set_id, source_id, keys in cases:
            with self.subTest(set_id=set_id):
                item = next(s for s in bank['sets'] if s['id'] == set_id)
                self.assertEqual(len(item['questions']), 9)
                self.assertEqual([q['sourceRefs'] for q in item['questions']],
                                 [[f'legacy:{source_id}-q{i}']
                                  for i in range(1, 10)])
                self.assertEqual([q['correct'] for q in item['questions']],
                                 list(keys))
                original = (ROOT / 'content/posts' / f'{source_id}.md').read_text()
                section = original.split('## 問題：')[1].split('### 語注')[0]
                passage = '\n'.join(
                    line[2:] if line.startswith('> ') else line[1:]
                    for line in section.splitlines() if line.startswith('>')).strip()
                self.assertTrue(all(q['passage'] == passage
                                    for q in item['questions']))
                self.assertTrue(all(len(q['options']) == 4
                                    for q in item['questions']))

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
        self.assertEqual(source['reviewedPages'], list(range(1, 25)))
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
        self.assertEqual(source['pageItems']['15'],
                         ['pdf:actual:p015:q21', 'pdf:actual:p015:q22'])
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
        self.assertFalse(any(item['source'] == 'actual' for item in index['blockedItems']))

    def test_recovered_actual_email_and_email_test_cover_every_source_question(self):
        bank = self.build()
        sets = {item['id']: item for item in bank['sets']}
        recovered = sets['pdf-actual-test2-module1-task2-water']
        email = sets['pdf-task2-p069-075']
        self.assertEqual([q['sourceRefs'][0] for q in recovered['questions']],
                         ['pdf:actual:p015:q21', 'pdf:actual:p015:q22'])
        self.assertEqual([q['correct'] for q in recovered['questions']], ['D', 'A'])
        expected = ['pdf:task2:p069:qexample1', 'pdf:task2:p069:qexample2']
        expected += [f'pdf:task2:p{page:03d}:q{i:02d}'
                     for page, start, end in ((70, 1, 2), (71, 3, 4), (72, 5, 6),
                                              (73, 7, 9), (74, 10, 12), (75, 13, 15))
                     for i in range(start, end + 1)]
        self.assertEqual([q['sourceRefs'][0] for q in email['questions']], expected)
        self.assertEqual([q['correct'] for q in email['questions']], list('ACACBDABABADBAABA'))
        self.assertEqual(len({q['passage'] for q in email['questions']}), 7)
        self.assertGreaterEqual(bank['migration']['pdfReviewedPages'], 142)
        self.assertGreaterEqual(bank['migration']['pdfPublished'], 486)
        index = json.loads((ROOT / 'scripts/reading-source-index.json').read_text())
        self.assertNotIn('scripts/reading-source-text/', json.dumps(index))
        self.assertTrue(all('packets' not in s and 'sha256' not in s
                            for s in index['sources']))

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

    def test_task2_fact_questions_preserve_pages_27_through_35(self):
        bank = self.build()
        item = next(s for s in bank['sets'] if s['id'] == 'pdf-task2-p027-035')
        expected_refs = [
            'pdf:task2:p027:qexample-fact',
            'pdf:task2:p028:q01', 'pdf:task2:p028:q02',
            'pdf:task2:p029:q03', 'pdf:task2:p029:q04',
            'pdf:task2:p030:q01', 'pdf:task2:p030:q02',
            'pdf:task2:p031:q03', 'pdf:task2:p031:q04',
            'pdf:task2:p032:q05', 'pdf:task2:p032:q06',
            'pdf:task2:p033:q07', 'pdf:task2:p033:q08', 'pdf:task2:p033:q09',
            'pdf:task2:p034:q10', 'pdf:task2:p034:q11', 'pdf:task2:p034:q12',
            'pdf:task2:p035:q13', 'pdf:task2:p035:q14', 'pdf:task2:p035:q15']
        self.assertEqual(len(item['questions']), 20)
        self.assertEqual([q['sourceRefs'][0] for q in item['questions']], expected_refs)
        self.assertEqual([q['correct'] for q in item['questions']],
                         list('CBADCDDCBDBDCBBCCADC'))
        self.assertEqual(len({q['passage'] for q in item['questions']}), 11)
        self.assertTrue(all(len(q['options']) == 4 for q in item['questions']))

        index = json.loads((ROOT / 'scripts/reading-source-index.json').read_text())
        source = next(s for s in index['sources'] if s['id'] == 'task2')
        self.assertEqual(source['reviewedPages'][:35], list(range(1, 36)))
        self.assertEqual(source['pageItems']['26'], [])
        for page in range(27, 36):
            page_refs = [ref for ref in expected_refs if f':p{page:03d}:' in ref]
            self.assertEqual(source['pageItems'][str(page)], page_refs)

    def test_task2_vocabulary_questions_preserve_pages_37_through_45(self):
        bank = self.build()
        item = next(s for s in bank['sets'] if s['id'] == 'pdf-task2-p037-045')
        expected_refs = [
            'pdf:task2:p037:qexample-vocabulary',
            'pdf:task2:p038:q01', 'pdf:task2:p038:q02',
            'pdf:task2:p039:q03', 'pdf:task2:p039:q04',
            'pdf:task2:p040:q01', 'pdf:task2:p040:q02',
            'pdf:task2:p041:q03', 'pdf:task2:p041:q04',
            'pdf:task2:p042:q05', 'pdf:task2:p042:q06',
            'pdf:task2:p043:q07', 'pdf:task2:p043:q08', 'pdf:task2:p043:q09',
            'pdf:task2:p044:q10', 'pdf:task2:p044:q11', 'pdf:task2:p044:q12',
            'pdf:task2:p045:q13', 'pdf:task2:p045:q14', 'pdf:task2:p045:q15']
        self.assertEqual(len(item['questions']), 20)
        self.assertEqual([q['sourceRefs'][0] for q in item['questions']], expected_refs)
        self.assertEqual([q['correct'] for q in item['questions']],
                         list('BBCDDCACABBACCCDBCAD'))
        self.assertEqual(len({q['passage'] for q in item['questions']}), 11)
        self.assertTrue(all(len(q['options']) == 4 for q in item['questions']))

        index = json.loads((ROOT / 'scripts/reading-source-index.json').read_text())
        source = next(s for s in index['sources'] if s['id'] == 'task2')
        self.assertEqual(source['reviewedPages'][:45], list(range(1, 46)))
        self.assertEqual(source['pageItems']['36'], [])
        for page in range(37, 46):
            page_refs = [ref for ref in expected_refs if f':p{page:03d}:' in ref]
            self.assertEqual(source['pageItems'][str(page)], page_refs)

    def test_task2_inference_questions_preserve_pages_46_through_53(self):
        bank = self.build()
        item = next(s for s in bank['sets'] if s['id'] == 'pdf-task2-p046-053')
        expected_refs = [
            'pdf:task2:p047:qexample-inference',
            'pdf:task2:p048:q01', 'pdf:task2:p048:q02',
            'pdf:task2:p049:q03', 'pdf:task2:p049:q04',
            'pdf:task2:p050:q01', 'pdf:task2:p050:q02',
            'pdf:task2:p051:q03', 'pdf:task2:p051:q04',
            'pdf:task2:p052:q05', 'pdf:task2:p052:q06',
            'pdf:task2:p053:q07', 'pdf:task2:p053:q08', 'pdf:task2:p053:q09']
        self.assertEqual(len(item['questions']), 14)
        self.assertEqual([q['sourceRefs'][0] for q in item['questions']], expected_refs)
        self.assertEqual([q['correct'] for q in item['questions']],
                         list('ABBDCCDACDBDDC'))
        self.assertEqual(len({q['passage'] for q in item['questions']}), 9)
        self.assertTrue(all(len(q['options']) == 4 for q in item['questions']))

        index = json.loads((ROOT / 'scripts/reading-source-index.json').read_text())
        source = next(s for s in index['sources'] if s['id'] == 'task2')
        self.assertEqual(source['reviewedPages'][:53], list(range(1, 54)))
        self.assertEqual(source['pageItems']['46'], [])
        for page in range(47, 54):
            page_refs = [ref for ref in expected_refs if f':p{page:03d}:' in ref]
            self.assertEqual(source['pageItems'][str(page)], page_refs)

    def test_task2_inference_and_intention_questions_preserve_pages_54_through_59(self):
        bank = self.build()
        item = next(s for s in bank['sets'] if s['id'] == 'pdf-task2-p054-059')
        expected_refs = [
            'pdf:task2:p054:q10', 'pdf:task2:p054:q11', 'pdf:task2:p054:q12',
            'pdf:task2:p055:q13', 'pdf:task2:p055:q14', 'pdf:task2:p055:q15',
            'pdf:task2:p057:qexample-intention',
            'pdf:task2:p058:q01', 'pdf:task2:p058:q02',
            'pdf:task2:p059:q03', 'pdf:task2:p059:q04']
        self.assertEqual(len(item['questions']), 11)
        self.assertEqual([q['sourceRefs'][0] for q in item['questions']], expected_refs)
        self.assertEqual([q['correct'] for q in item['questions']], list('DABBBCDCBDA'))
        self.assertEqual(len({q['passage'] for q in item['questions']}), 7)
        self.assertTrue(all(len(q['options']) == 4 for q in item['questions']))

        index = json.loads((ROOT / 'scripts/reading-source-index.json').read_text())
        source = next(s for s in index['sources'] if s['id'] == 'task2')
        self.assertEqual(source['reviewedPages'][:59], list(range(1, 60)))
        self.assertEqual(source['pageItems']['56'], [])
        for page in (54, 55, 57, 58, 59):
            page_refs = [ref for ref in expected_refs if f':p{page:03d}:' in ref]
            self.assertEqual(source['pageItems'][str(page)], page_refs)

    def test_task2_intention_test_preserves_pages_60_through_65(self):
        bank = self.build()
        item = next(s for s in bank['sets'] if s['id'] == 'pdf-task2-p060-065')
        expected_refs = [
            'pdf:task2:p060:q01', 'pdf:task2:p060:q02',
            'pdf:task2:p061:q03', 'pdf:task2:p061:q04',
            'pdf:task2:p062:q05', 'pdf:task2:p062:q06',
            'pdf:task2:p063:q07', 'pdf:task2:p063:q08', 'pdf:task2:p063:q09',
            'pdf:task2:p064:q10', 'pdf:task2:p064:q11', 'pdf:task2:p064:q12',
            'pdf:task2:p065:q13', 'pdf:task2:p065:q14', 'pdf:task2:p065:q15']
        self.assertEqual(len(item['questions']), 15)
        self.assertEqual([q['sourceRefs'][0] for q in item['questions']], expected_refs)
        self.assertEqual([q['correct'] for q in item['questions']],
                         list('DAACDADACCDBCAA'))
        self.assertEqual(len({q['passage'] for q in item['questions']}), 6)
        self.assertTrue(all(len(q['options']) == 4 for q in item['questions']))

        index = json.loads((ROOT / 'scripts/reading-source-index.json').read_text())
        source = next(s for s in index['sources'] if s['id'] == 'task2')
        self.assertEqual(source['reviewedPages'][:75], list(range(1, 76)))
        for page in range(60, 66):
            page_refs = [ref for ref in expected_refs if f':p{page:03d}:' in ref]
            self.assertEqual(source['pageItems'][str(page)], page_refs)

    def test_task2_text_message_chains_preserve_all_fourteen_answers(self):
        bank = self.build()
        item = next(s for s in bank['sets'] if s['id'] == 'pdf-task2-p076-082')
        expected_refs = [
            'pdf:task2:p077:qexample1', 'pdf:task2:p077:qexample2',
            'pdf:task2:p078:q01', 'pdf:task2:p078:q02',
            'pdf:task2:p079:q03', 'pdf:task2:p079:q04',
            'pdf:task2:p080:q05', 'pdf:task2:p080:q06',
            'pdf:task2:p081:q07', 'pdf:task2:p081:q08',
            'pdf:task2:p081:q09', 'pdf:task2:p082:q10',
            'pdf:task2:p082:q11', 'pdf:task2:p082:q12']
        self.assertEqual(len(item['questions']), 14)
        self.assertEqual([q['sourceRefs'][0] for q in item['questions']], expected_refs)
        self.assertEqual([q['correct'] for q in item['questions']],
                         list('BADBCDACCCBBDC'))
        self.assertEqual(len({q['passage'] for q in item['questions']}), 6)
        self.assertTrue(all(len(q['options']) == 4 for q in item['questions']))

        index = json.loads((ROOT / 'scripts/reading-source-index.json').read_text())
        source = next(s for s in index['sources'] if s['id'] == 'task2')
        self.assertEqual(source['reviewedPages'], list(range(1, 83)))
        self.assertEqual(source['pageItems']['76'], [])
        for page in range(77, 83):
            page_refs = [ref for ref in expected_refs if f':p{page:03d}:' in ref]
            self.assertEqual(source['pageItems'][str(page)], page_refs)

    def test_unesco_and_everyday_ai_preserve_passages_and_all_targets(self):
        bank = self.build()
        cases = [
            ('legacy-unesco-cooperation-limits',
             'english-reading-advanced-unesco-cooperation-limits-11', 'BAACBCDAB'),
            ('legacy-everyday-ai-decisions',
             'english-reading-everyday-ai-05', 'ABCDBDACB')]
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

    def test_learning_and_journaling_sets_preserve_passages_and_all_targets(self):
        bank = self.build()
        cases = [
            ('legacy-technology-learning-choice',
             'english-reading-learning-02', 'BABDCCABD'),
            ('legacy-journaling-medium-attention',
             'english-reading-reflection-01', 'BABCDCDAB')]
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

    def test_ai_creativity_and_robots_preserve_passages_and_all_targets(self):
        bank = self.build()
        cases = [
            ('legacy-ai-creativity-contributions',
             'english-reading-standard-ai-creativity-02', 'ABCDBCACB'),
            ('legacy-robots-human-cooperation',
             'english-reading-robots-06', 'ABACABCDA')]
        for set_id, source_id, keys in cases:
            with self.subTest(set_id=set_id):
                item = next(s for s in bank['sets'] if s['id'] == set_id)
                self.assertEqual(len(item['questions']), 9)
                self.assertEqual([q['sourceRefs'] for q in item['questions']],
                                 [[f'legacy:{source_id}-q{i}']
                                  for i in range(1, 10)])
                self.assertEqual([q['correct'] for q in item['questions']],
                                 list(keys))
                original = (ROOT / 'content/posts' / f'{source_id}.md').read_text()
                section = original.split('## 問題：')[1].split('### 語注')[0]
                passage = '\n'.join(line[2:] if line.startswith('> ') else line[1:]
                                    for line in section.splitlines()
                                    if line.startswith('>')).strip()
                self.assertTrue(all(q['passage'] == passage
                                    for q in item['questions']))
                self.assertTrue(all(len(q['options']) == 4
                                    for q in item['questions']))

    def test_comets_and_cultural_context_preserve_passages_and_all_targets(self):
        bank = self.build()
        cases = [
            ('legacy-comet-structure-evidence',
             'english-reading-standard-comet-evidence-29', 'BCAADDCBA'),
            ('legacy-cultural-context-human-rights',
             'english-reading-standard-cultural-context-rights-11',
             'CADBCBADC')]
        for set_id, source_id, keys in cases:
            with self.subTest(set_id=set_id):
                item = next(s for s in bank['sets'] if s['id'] == set_id)
                self.assertEqual(len(item['questions']), 9)
                self.assertEqual([q['sourceRefs'] for q in item['questions']],
                                 [[f'legacy:{source_id}-q{i}']
                                  for i in range(1, 10)])
                self.assertEqual([q['correct'] for q in item['questions']],
                                 list(keys))
                original = (ROOT / 'content/posts' / f'{source_id}.md').read_text()
                section = original.split('## 問題：')[1].split('### 語注')[0]
                passage = '\n'.join(line[2:] if line.startswith('> ') else line[1:]
                                    for line in section.splitlines()
                                    if line.startswith('>')).strip()
                self.assertTrue(all(q['passage'] == passage
                                    for q in item['questions']))
                self.assertTrue(all(len(q['options']) == 4
                                    for q in item['questions']))

    def test_earthquake_and_fashion_preserve_passages_and_all_targets(self):
        bank = self.build()
        cases = [
            ('legacy-earthquake-risk-layers',
             'english-reading-standard-earthquake-risk-layers-35',
             'BACADBCAD'),
            ('legacy-fashion-hidden-costs',
             'english-reading-standard-fashion-03', 'ACBDCCABD')]
        for set_id, source_id, keys in cases:
            with self.subTest(set_id=set_id):
                item = next(s for s in bank['sets'] if s['id'] == set_id)
                self.assertEqual(len(item['questions']), 9)
                self.assertEqual([q['sourceRefs'] for q in item['questions']],
                                 [[f'legacy:{source_id}-q{i}']
                                  for i in range(1, 10)])
                self.assertEqual([q['correct'] for q in item['questions']],
                                 list(keys))
                original = (ROOT / 'content/posts' / f'{source_id}.md').read_text()
                section = original.split('## 問題：')[1].split('### 語注')[0]
                passage = '\n'.join(line[2:] if line.startswith('> ') else line[1:]
                                    for line in section.splitlines()
                                    if line.startswith('>')).strip()
                self.assertTrue(all(q['passage'] == passage
                                    for q in item['questions']))
                self.assertTrue(all(len(q['options']) == 4
                                    for q in item['questions']))

    def test_higher_education_and_inca_preserve_passages_and_all_targets(self):
        bank = self.build()
        cases = [
            ('legacy-higher-education-design',
             'english-reading-standard-higher-education-design-17',
             'BCDBABCAD'),
            ('legacy-inca-networks',
             'english-reading-standard-inca-networks-13', 'CBDACBDAC')]
        for set_id, source_id, keys in cases:
            with self.subTest(set_id=set_id):
                item = next(s for s in bank['sets'] if s['id'] == set_id)
                self.assertEqual(len(item['questions']), 9)
                self.assertEqual([q['sourceRefs'] for q in item['questions']],
                                 [[f'legacy:{source_id}-q{i}']
                                  for i in range(1, 10)])
                self.assertEqual([q['correct'] for q in item['questions']],
                                 list(keys))
                original = (ROOT / 'content/posts' / f'{source_id}.md').read_text()
                section = original.split('## 問題：')[1].split('### 語注')[0]
                passage = '\n'.join(line[2:] if line.startswith('> ') else line[1:]
                                    for line in section.splitlines()
                                    if line.startswith('>')).strip()
                self.assertTrue(all(q['passage'] == passage
                                    for q in item['questions']))
                self.assertTrue(all(len(q['options']) == 4
                                    for q in item['questions']))

    def test_japan_growth_and_logarithms_preserve_passages_and_all_targets(self):
        bank = self.build()
        cases = [
            ('legacy-japan-high-growth',
             'english-reading-standard-japan-high-growth-19',
             'BCADBBCAD'),
            ('legacy-logarithms-calculation',
             'english-reading-standard-logarithms-calculation-14',
             'BDACBCDAB')]
        for set_id, source_id, keys in cases:
            with self.subTest(set_id=set_id):
                item = next(s for s in bank['sets'] if s['id'] == set_id)
                self.assertEqual(len(item['questions']), 9)
                self.assertEqual([q['sourceRefs'] for q in item['questions']],
                                 [[f'legacy:{source_id}-q{i}']
                                  for i in range(1, 10)])
                self.assertEqual([q['correct'] for q in item['questions']],
                                 list(keys))
                original = (ROOT / 'content/posts' / f'{source_id}.md').read_text()
                section = original.split('## 問題：')[1].split('### 語注')[0]
                passage = '\n'.join(line[2:] if line.startswith('> ') else line[1:]
                                    for line in section.splitlines()
                                    if line.startswith('>')).strip()
                self.assertTrue(all(q['passage'] == passage
                                    for q in item['questions']))
                self.assertTrue(all(len(q['options']) == 4
                                    for q in item['questions']))

    def test_vocabulary_and_two_readings_preserve_all_source_targets(self):
        bank = self.build()
        converted = {item['id']: item for item in bank['sets']}
        vocabulary = [
            ('legacy-vocabulary-context-verbs-001-025',
             'english-vocabulary-context-verbs-001-025', range(1, 26)),
            ('legacy-vocabulary-adjectives-context-026-050',
             'english-vocabulary-adjectives-context-026-050', range(26, 51)),
        ]
        originals = {item['id']: item for item in self.legacy['sets']}
        for set_id, source_id, numbers in vocabulary:
            with self.subTest(set_id=set_id):
                item = converted[set_id]
                source = originals[source_id]
                self.assertEqual(len(item['questions']), 25)
                self.assertEqual([q['sourceRefs'] for q in item['questions']],
                                 [[f'legacy:{source_id}-q{n}'] for n in numbers])
                for source_q, converted_q in zip(source['questions'], item['questions']):
                    word = next(option['text'] for option in source_q['options']
                                if option['label'] == source_q['correct'])
                    self.assertIn(word, converted_q['acceptedAnswers'])
                    self.assertEqual(re.sub(r'[A-Za-z]+_+', '(　　　)',
                                            converted_q['passage']), source_q['prompt'])
                    self.assertTrue(all(option['text'] in converted_q['answer']
                                        for option in source_q['options']))
        for set_id, source_id, keys in [
            ('legacy-mimicry-observer', 'english-reading-standard-mimicry-04',
             'ABCADBCAD'),
            ('legacy-nasca-evidence', 'english-reading-standard-nasca-evidence-12',
             'BACDBCADB'),
        ]:
            with self.subTest(set_id=set_id):
                item = converted[set_id]
                self.assertEqual(len(item['questions']), 9)
                self.assertEqual([q['sourceRefs'] for q in item['questions']],
                                 [[f'legacy:{source_id}-q{i}'] for i in range(1, 10)])
                self.assertEqual([q['correct'] for q in item['questions']], list(keys))
                self.assertTrue(all(q['passage'] == originals[source_id]['passage']
                                    and len(q['options']) == 4 for q in item['questions']))

    def test_six_more_legacy_readings_preserve_passages_and_all_targets(self):
        bank = self.build()
        converted = {item['id']: item for item in bank['sets']}
        originals = {item['id']: item for item in self.legacy['sets']}
        cases = [
            ('legacy-public-power-documents',
             'english-reading-standard-public-power-06', 'BCADBACDB'),
            ('legacy-radio-panic-evidence',
             'english-reading-standard-radio-evidence-10', 'ABCDBACDB'),
            ('legacy-sale-origin-evidence',
             'english-reading-standard-sale-narratives-08', 'BACDBACDB'),
            ('legacy-secondary-school-comparison',
             'english-reading-standard-secondary-systems-16', 'CABDCABDC'),
            ('legacy-nuclear-accident-layers',
             'english-reading-standard-nuclear-accident-layers-26', 'BACADCBAD'),
            ('legacy-pollution-causal-chains',
             'english-reading-standard-pollution-evidence-20', 'CABDCBADC'),
        ]
        for set_id, source_id, keys in cases:
            with self.subTest(set_id=set_id):
                questions = converted[set_id]['questions']
                self.assertEqual(len(questions), 9)
                self.assertEqual([q['sourceRefs'] for q in questions],
                                 [[f'legacy:{source_id}-q{i}'] for i in range(1, 10)])
                self.assertEqual([q['correct'] for q in questions], list(keys))
                self.assertTrue(all(q['passage'] == originals[source_id]['passage']
                                    and len(q['options']) == 4 for q in questions))

    def test_six_science_and_transport_readings_preserve_all_targets(self):
        bank = self.build()
        converted = {item['id']: item for item in bank['sets']}
        originals = {item['id']: item for item in self.legacy['sets']}
        cases = [
            ('legacy-gps-relativity-clocks',
             'english-reading-standard-relativity-gps-clocks-31', 'BCADBCADB'),
            ('legacy-semiconductor-quantum-control',
             'english-reading-standard-semiconductor-quantum-control-30', 'BACDBCADB'),
            ('legacy-superconducting-maglev-system',
             'english-reading-standard-superconducting-maglev-15', 'CADBCBADC'),
            ('legacy-symbiosis-context-outcomes',
             'english-reading-standard-symbiosis-context-outcomes-34', 'BACDBACDB'),
            ('legacy-cyclone-names-risk',
             'english-reading-standard-tropical-cyclones-07', 'CBADBCADB'),
            ('legacy-future-transport-systems',
             'english-reading-transportation-04', 'ABCDACBDA'),
        ]
        for set_id, source_id, keys in cases:
            with self.subTest(set_id=set_id):
                questions = converted[set_id]['questions']
                self.assertEqual(len(questions), 9)
                self.assertEqual([q['sourceRefs'] for q in questions],
                                 [[f'legacy:{source_id}-q{i}'] for i in range(1, 10)])
                self.assertEqual([q['correct'] for q in questions], list(keys))
                self.assertTrue(all(q['passage'] == originals[source_id]['passage']
                                    and len(q['options']) == 4 for q in questions))

    def test_final_seven_legacy_readings_complete_source_coverage(self):
        bank = self.build()
        converted = {item['id']: item for item in bank['sets']}
        originals = {item['id']: item for item in self.legacy['sets']}
        cases = [
            ('legacy-social-media-conditions',
             'english-reading-standard-social-media-01', 'ABCDACBDA'),
            ('legacy-space-race-systems',
             'english-reading-standard-space-race-09', 'BCADBCADB'),
            ('legacy-tokyo-tower-memory',
             'english-reading-standard-tokyo-tower-memory-32', 'BACDBACDB'),
            ('legacy-transition-audit-evidence',
             'english-reading-standard-transition-evidence-25', 'CABADCBDA'),
            ('legacy-animation-transnational-reception',
             'english-reading-standard-transnational-animation-23', 'CBADBCADB'),
            ('legacy-trends-influence-evidence',
             'english-reading-standard-trends-social-evidence-22', 'BCABDACDB'),
            ('legacy-western-rome-process',
             'english-reading-standard-western-rome-18', 'CABDCBADC'),
        ]
        for set_id, source_id, keys in cases:
            with self.subTest(set_id=set_id):
                questions = converted[set_id]['questions']
                self.assertEqual(len(questions), 9)
                self.assertEqual([q['sourceRefs'] for q in questions],
                                 [[f'legacy:{source_id}-q{i}'] for i in range(1, 10)])
                self.assertEqual([q['correct'] for q in questions], list(keys))
                self.assertTrue(all(q['passage'] == originals[source_id]['passage']
                                    and len(q['options']) == 4 for q in questions))

        original_refs = {f"legacy:{q['id']}" for s in self.legacy['sets']
                         for q in s['questions']}
        converted_refs = [ref for s in converted.values() for q in s['questions']
                          for ref in q.get('sourceRefs', []) if ref.startswith('legacy:')]
        self.assertEqual(len(original_refs), 1040)
        self.assertEqual(set(converted_refs), original_refs)
        self.assertEqual(len(converted_refs), len(original_refs))

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
            reviewed=source['reviewedPages']
            self.assertEqual(len(reviewed),len(set(reviewed)))
            self.assertTrue(all(1 <= page <= source['pageCount'] for page in reviewed))
            self.assertEqual({int(page) for page in source['pageItems']},set(reviewed))
            total += source['pageCount']
        self.assertEqual(total,410)


if __name__=='__main__': unittest.main()
