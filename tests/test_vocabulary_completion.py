"""Audit the final vocabulary pages against their source-image headword lists.

Printed pages 397–399 were checked in the private originals. The final MEMO
page has no exercises. Clean headword manifests are public audit data; no raw
source images or OCR are included. Definitions were cross-checked where the
source gloss risks confusion, including NCI's tumor/inflammation/pancreas
entries, EPA's pesticide types, and Cambridge's systemic entry.
"""
import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

FINAL_DAYS = {
    18: 'administrative alleviate anatomy appliance aspiration autonomy blindly calibration catastrophic circuit coercion commence concrete contamination cosmetic covertly dairy deforestation deprecate disprove embryo epitaph exhaust fasting fission fraction furry goodwill hygiene implication instinctively invasive kaleidoscopic meditation millennium mobility negotiation nutrient paleontology pendulum personnel placement portrait predictably profound prosperity quota recognizable reminiscent reproduction safeguard sculpture sewer socioeconomic spiritually stunted systemic tribal unparalleled weaponry',
    19: 'accretion adolescence aggressive alliance apprehensive auxiliary callousness celestial circulation cognitive communal concurrently contemplation cosmology debris deformation desiccate discern dispute emission epoch existential fatigue fissure fracture fusion herder hoax hyperactive impressive inflammation insurmountable irregularity keystone lifespan mating megalithic modulate neural nutrition pancreas people perspiration phrase plagiarism postwar predictive progression protest radiation rectangular remoteness reservoir secrete sociopolitical spore sublime tantalizing topography trillion',
    20: 'accumulate adversity agriculture allot anecdote aquatic avian brewing census civic commute confront counteract decode degeneration deter discourse disruption emulate equator exonerate fleet fragility grocery hereditary horizontal improvisational irrigation kinship lime livelihood magnetism marginally matriarch memorable neurotransmitter obligation paradox percent pest physical potent prehistoric prolific provoke rainfall recycling renewable reshape rhythm salient sectional soliloquy spur subside taxing totem trustworthiness vandalism workforce',
}


class VocabularyCompletion(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        spec = importlib.util.spec_from_file_location('vocabulary_builder', ROOT/'scripts/build_toefl_tasks.py')
        builder = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(builder)
        cls.bank = builder.build_task_catalog(
            ROOT, json.loads((ROOT/'static/data/english-question-bank.json').read_text()),
            json.loads((ROOT/'static/data/toefl-reading-bank.json').read_text()))
        cls.sets = {s['id']: s for s in cls.bank['sets']}
        cls.index = json.loads((ROOT/'scripts/reading-source-index.json').read_text())
        cls.source = next(s for s in cls.index['sources'] if s['id'] == 'vocabulary')

    def test_final_180_original_headwords_and_order(self):
        for day, original in FINAL_DAYS.items():
            with self.subTest(day=day):
                words = original.split()
                self.assertEqual(len(words), 60)
                questions = [q for part in range(1, 5)
                             for q in self.sets[f'pdf-vocabulary-day{day:02d}-part{part}']['questions']]
                refs = [f'pdf:vocabulary:p{day+1:03d}:q{word}' for word in words]
                self.assertEqual([q['sourceRefs'][0] for q in questions], refs)
                self.assertEqual([q['acceptedAnswers'][-1] for q in questions], words)
                self.assertEqual(self.source['pageItems'][str(day+1)], refs)
                for q, word in zip(questions, words):
                    self.assertIn(f'学習語：{word}。', q['answer'])
                    self.assertEqual(q['options'], [])
                    self.assertIsNone(q['correct'])

    def test_all_twenty_days_complete_and_memo_has_no_exercise(self):
        refs = []
        for day in range(1, 21):
            questions = [q for s in self.bank['sets'] for q in s['questions']
                         if any(r.startswith(f'pdf:vocabulary:p{day+1:03d}:')
                                for r in q.get('sourceRefs', []))]
            self.assertEqual(len(questions), 60, f'Day {day:02d}')
            refs.extend(q['sourceRefs'][0] for q in questions)
        self.assertEqual(len(set(refs)), 1200)
        self.assertEqual(self.source['reviewedPages'], list(range(1, 23)))
        self.assertEqual(self.source['pageItems']['22'], [])
        self.assertFalse(self.source['answerKeyAvailable'])
        self.assertFalse(self.bank['migration']['complete'])

    def test_source_sensitive_glosses_keep_the_intended_word(self):
        questions = {q['acceptedAnswers'][-1]: q
                     for day in (13, 18, 19, 20) for part in range(1, 5)
                     for q in self.sets[f'pdf-vocabulary-day{day:02d}-part{part}']['questions']}
        self.assertIn('systematic', questions['systemic']['answer'])
        self.assertIn('仕組み全体', questions['systemic']['answer'])
        self.assertIn('膵臓', questions['pancreas']['answer'])
        self.assertIn('感染そのもの', questions['inflammation']['answer'])
        self.assertIn('悪性', questions['tumor']['answer'])
        self.assertIn('果実のライムではなく', questions['lime']['answer'])
        self.assertIn('動詞用法', questions['people']['answer'])


if __name__ == '__main__':
    unittest.main()
