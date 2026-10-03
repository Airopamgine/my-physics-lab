"""Source-image audit manifests for the October 3 verified bulk migration.

These lists pin the original headwords, order, visible prefixes and passage
boundaries independently of the authoring generator. They are clean editorial
audit data, not OCR or private source files.
"""
import importlib.util
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

VOCABULARY = {
    (29, 'literature'): 'allusion;antagonist;fiction;flashback;foreshadowing;genre;literary device;metaphor;narrative structure;narrator;oxymoron;personification;poetry;prose;protagonist;rhetorical device;satire;setting;soliloquy;theme',
    (29, 'linguistics'): 'bilingualism;compound word;consonant;dialect;discourse;grammar;jargon;language acquisition;native speaker;second language;slang;spoken language;vowel;written language',
    (29, 'philosophy'): 'deduction;determinism;fallacy;free will;human nature;idealism;induction;metaphysics;moral relativism;objectivity;skepticism;utilitarianism',
    (32, 'fine-arts'): 'abstract art;aesthetics;avant-garde;canvas;curator;gallery;landscape;mural;perspective;pigment;portrait;saturation;sculpture;still life;vanishing point;watercolor',
    (32, 'film'): 'blockbuster;box office;camera angle;cinematography;director;documentary;film festival;soundtrack;special effects;visual effects',
    (33, 'music'): 'chamber music;chord;composer;concerto;conductor;harmony;melody;orchestra;performer;rhythm;symphony;time signature',
    (33, 'architecture'): 'arch;balcony;ceiling;column;concrete;demolition;insulation;monument;skyscraper;terrace;urban planning;ventilation',
    (36, 'economics'): 'adverse selection;bankruptcy;bond market;budget deficit;commodity;comparative advantage;consumption;deflation;demand;exchange rate;expenditure;fiscal policy;free trade;gross domestic product;gross national income;human capital;income inequality;inflation;interest rate;labor market;marginal cost;marginal utility;market failure;monetary policy;monopoly;opportunity cost;poverty line;recession;revenue;speculation;stock market;sunk cost;supply;tariff;taxation;unemployment rate',
    (37, 'archaeology'): 'agriculture;artifact;ceramics;pastoralism;pottery;prehistory;radiocarbon dating;trade route',
    (37, 'psychology'): 'anxiety disorder;attachment theory;behavior pattern;bystander effect;cognition;cognitive dissonance;confirmation bias;conformity;consciousness;defense mechanism;depression;disposition;egocentrism;emotional stability;extroversion;introversion;mood disorder;motivation;obedience;perception;personality test;psychotherapy;punishment;rationalization;repression;self-esteem;sensation;stereotype;temperament;theory of mind',
    (37, 'sociology'): 'alienation;ascribed status;assimilation;civil society;collective behavior;counterculture;cultural capital;discrimination;gender role;governance;hierarchy;minority group;peer group;social mobility;social norm;social status;socialization;socioeconomic status',
    (40, 'astronomy'): 'asteroid;astronomical unit;big bang theory;celestial body;constellation;dark matter;equator;exoplanet;extraterrestrial;giant star;light year;lunar eclipse;meteorite;nebula;observatory;revolution;rotation;solar system;supernova;terrestrial planet',
    (40, 'chemistry'): 'acid;atom;base;boiling point;carbohydrate;catalyst;compound;distillation;element;fatty acid;freezing point;melting point;molecule;oxidation;solution;solvent',
    (41, 'physics'): 'acceleration;amplitude;convection;electric charge;frequency;friction;gravity;inertia;kinetic energy;magnetic field;momentum;nuclear reaction;oscillation;potential energy;pressure;radioactivity;reflection;refraction;resistance;temperature;voltage;wave length',
    (41, 'geology'): 'continental crust;continental drift;deposition;erosion;fault line;glacier;mineral;plate boundary;plate tectonics;seismic wave;tectonic plate;weathering',
    (41, 'meteorology'): 'air pressure;blizzard;climatology;condensation;evaporation;hail;humidity;jet stream;precipitation;weather front',
    (44, 'biology'): 'appendage;cellular;chromosome;convergent evolution;embryo;enzyme;evolution;fertilization;gene expression;genetic engineering;genetic modification;heredity;infection;metamorphosis;microorganism;mutation;natural selection;nucleus;organism;pathogen;photosynthesis;pollination;regeneration;stem cell',
    (44, 'environmental-science'): 'acid rain;atmosphere;carbon cycle;carbon footprint;climate change;deforestation;ecological footprint;greenhouse gas;hazardous waste;natural resource;ozone layer;pollution;renewable energy;sustainability',
    (45, 'ecology'): 'apex predator;biodiversity;camouflage;carnivore;decomposer;ecological niche;ecosystem;endemic species;food web;greenhouse effect;habitat;herbivore;homing instinct;indicator species;invasive species;keystone species;mimicry;mutualism;nocturnal animal;omnivore;parasitism;predator;scavenging;species diversity',
    (45, 'physiology'): 'absorption;antibody;cardiovascular system;circadian;circulatory;digestive;homeostasis;hormonal balance;immune system;immunity;inflammation;metabolism;nervous system;neuron;receptor;respiration;respiratory system;skeletal',
    (45, 'paleontology'): 'fossil;mass extinction;preserved remains;trace fossil',
}

# prefix/full word pairs are transcribed from the source images, including case.
PASSAGES = {
    (30, 'renaissance', 1): 'e/era charac/characterized ren/renewed i/in cul/culture sta/started flour/flourishing a/art sci/science li/like',
    (30, 'hieroglyphs', 11): 'sym/symbols repr/represent conc/concepts sou/sounds im/image rese/resembles e/ear mea/meaning lis/listen corre/corresponds',
    (31, 'language-acquisition', 21): 'aro/around wo/world sim/similar sta/stages o/of spec/specific th/they lear/learning fi/first prog/progress',
    (31, 'folklore', 31): 'i/is fr/from gener/generation ano/another spo/spoken Th/These te/teach les/lessons exp/explain phen/phenomena',
    (34, 'jazz', 1): 'uni/unique w/was fr/from crea/creative o/of tradi/traditions powe/powerful b/by ba/based th/their',
    (34, 'cubism', 11): 'subj/subjects bro/broken rearr/rearranged abst/abstract th/that empha/emphasized perspe/perspectives ar/argue th/these capt/captured',
    (35, 'theater', 21): 'fi/film c/can reco/recorded proj/projected rel/relies t/the liv/living bet/between act/actors audi/audience',
    (35, 'brutalism', 31): 'struc/structures so/solid impo/imposing th/they bo/bold a/and exp/exposed su/such conc/concrete archit/architects',
    (38, 'social-norms', 1): 'gu/guide beha/behavior mem/members soci/societies main/maintain wit/within gr/group inst/instance i/is com/common',
    (38, 'cognitive-dissonance', 11): 'inher/inherently alig/alignment th/their a/and Discr/Discrepancy wh/what beli/believes h/how beh/behaves ab/about',
    (39, 'bronze-age', 21): 'innov/innovation stro/stronger wh/which on/only agric/agriculture constr/construction al/also war/warfare com/complex sys/systems',
    (39, 'economic-decisions', 31): 'incr/increase comp/companies ass/assess co/cost exp/expense prod/producing addit/additional o/of Simi/Similarly gover/government',
    (42, 'geysers', 1): 'requ/requires parti/particular config/configuration he/heat abun/abundant a/and tig/tightly under/underground th/that pres/pressure',
    (42, 'nuclear-waste', 11): 'mate/material gene/generated i/in cou/course prod/producing po/power invo/involves reac/reactions em/emit amo/amounts',
    (43, 'hail', 21): 'fo/form str/strong wi/winds wa/water hi/high extr/extremely reg/regions clo/clouds fre/freeze gr/grow',
    (43, 'neutron-stars', 31): 'gi/giant hea/heavier t/the exh/exhaust fu/fuel co/core Wh/What i/is sph/sphere den/densely',
    (46, 'bacteria', 1): 'sim/simple la/lack struc/structures i/in adva/advanced Th/They rap/rapidly all/allows t/to qui/quickly',
    (46, 'genetic-modification', 11): 'al/alter thr/through pro/process a/as modifi/modification techn/techniques poss/possible introd/introduction desi/desirable in/into',
    (47, 'owls', 21): 'hu/hunt a/at us/using excep/exceptional abil/abilities loc/locate tar/target o/of pred/predators sile/silently',
    (47, 'fight-or-flight', 31): 'mech/mechanism wi/with dist/distress aler/alerting ner/nervous wh/which secr/secretes chem/chemical in/into blood/bloodstream',
}

DAYS = {
    (7, 6): 'altitude array balance blizzard breathing casual climate complex consciousness craft crucial debunk dense diagnosis divine dweller education engage era establishment excessive feat fossil framework genius glow habitable heightened identify impediment indelible information inspiration interpersonal intuitive laden lava lifestyle marine mission occasional outrage plate profoundly region ritualistic shift solid spectator strikingly suppress task theory transitional underwater unique unwritten vast vulnerable yeast',
    (8, 7): 'accept adjustment allocation appointment artisan auditorium beautiful booth broken certificate chorus code compatibility confidential conversation correspondence dental discount drill enhancement exchange exploration facility furnished guest heating inconvenience inquiry invitation late link maximum mindful objective opportunity packet pastry photography post preparation procedure quarter recommendation reliability renowned resident seat server shuttle smock speaker station subscription tenant torrential unavailable upper vendor volume wastewater',
    (9, 8): 'accommodation admission announce appreciate assistance authorization beverage bottle cabin charge citywide collaborative completion confirmation cooking coworker department discussion due entrepreneur excitement extension fascinating gala guideline honor indoor inspection involvement launch list maybe modification offer order painter patron picnic poster presentation program question reference remark report restriction secure serving sight smooth spot stay substitution textile tourism understanding upscale vessel voluntary webinar',
}


class VerifiedBulkSources(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        spec = importlib.util.spec_from_file_location('bulk_builder', ROOT/'scripts/build_toefl_tasks.py')
        builder = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(builder)
        cls.bank = builder.build_task_catalog(
            ROOT, json.loads((ROOT/'static/data/english-question-bank.json').read_text()),
            json.loads((ROOT/'static/data/toefl-reading-bank.json').read_text()))
        cls.sets = {s['id']: s for s in cls.bank['sets']}
        cls.index = json.loads((ROOT/'scripts/reading-source-index.json').read_text())
        cls.sources = {s['id']: s for s in cls.index['sources']}

    def test_all_352_topic_headwords_remain_in_original_order(self):
        total = 0
        for (page, topic), manifest in VOCABULARY.items():
            with self.subTest(page=page, topic=topic):
                item = self.sets[f'pdf-task1-p{page:03d}-{topic}']
                words = manifest.split(';')
                total += len(words)
                expected_refs = [f'pdf:task1:p{page:03d}:q' + re.sub(r'[^a-z0-9]+', '-', w) for w in words]
                self.assertEqual([q['sourceRefs'][0] for q in item['questions']], expected_refs)
                self.assertEqual(item['collection'], 'Task 1')
                self.assertIn('編集作成', item['verificationNote'])
                for q, headword in zip(item['questions'], words):
                    target = headword.split()[-1].split('-')[-1]
                    self.assertEqual(q['acceptedAnswers'][-1], target)
                    self.assertIn(f'学習語：{headword}。', q['answer'])
                    self.assertIn(q['sourceRefs'][0], self.sources['task1']['pageItems'][str(page)])
        self.assertEqual(total, 352)

    def test_all_200_original_test_blanks_keep_prefix_length_and_group(self):
        total = 0
        for (page, slug, first), manifest in PASSAGES.items():
            with self.subTest(page=page, slug=slug):
                item = self.sets[f'pdf-task1-p{page:03d}-{slug}']
                pairs = [pair.split('/') for pair in manifest.split()]
                self.assertEqual(len(item['questions']), 10)
                self.assertEqual([q['acceptedAnswers'] for q in item['questions']],
                                 [[word[len(prefix):], word] for prefix, word in pairs])
                refs = [f'pdf:task1:p{page:03d}:q{n:02d}-gap1' for n in range(first, first+10)]
                self.assertEqual([q['sourceRefs'][0] for q in item['questions']], refs)
                passage = item['questions'][0]['passage']
                self.assertEqual(len(set(q['passage'] for q in item['questions'])), 1)
                self.assertEqual(len(re.findall(r'[A-Za-z]+_+', passage)), 10)
                for prefix, word in pairs:
                    self.assertIn(prefix + '_'*(len(word)-len(prefix)), passage)
                self.assertIn('未提供', item['verificationNote'])
                self.assertIn('全10空欄', item['verificationNote'])
                total += len(pairs)
        self.assertEqual(total, 200)
        # Known source-sensitive spellings and unaltered surrounding sentences.
        hieroglyphs = self.sets['pdf-task1-p030-hieroglyphs']['questions']
        self.assertEqual(hieroglyphs[8]['acceptedAnswers'], ['ten', 'listen'])
        self.assertIn('j, d, and n', hieroglyphs[0]['passage'])
        self.assertTrue(hieroglyphs[0]['passage'].endswith('Greek letters.'))
        modified = self.sets['pdf-task1-p046-genetic-modification']['questions']
        self.assertEqual(modified[8]['acceptedAnswers'], ['rable', 'desirable'])
        self.assertIn('plants and animals to bacteria', modified[0]['passage'])

    def test_days_06_to_08_all_180_headwords_preserve_order_and_coverage(self):
        for (page, day), manifest in DAYS.items():
            with self.subTest(day=day):
                words = manifest.split()
                self.assertEqual(len(words), 60)
                items = [self.sets[f'pdf-vocabulary-day{day:02d}-part{part}'] for part in range(1, 5)]
                questions = [q for item in items for q in item['questions']]
                refs = [f'pdf:vocabulary:p{page:03d}:q{word}' for word in words]
                self.assertEqual([q['sourceRefs'][0] for q in questions], refs)
                self.assertEqual([q['acceptedAnswers'][-1] for q in questions], words)
                self.assertEqual(self.sources['vocabulary']['pageItems'][str(page)], refs)
                self.assertIn(page, self.sources['vocabulary']['reviewedPages'])
                self.assertTrue(all(q['options'] == [] and q['correct'] is None for q in questions))

    def test_task1_complete_but_unavailable_sources_and_keys_stay_pending(self):
        self.assertEqual(self.sources['task1']['reviewedPages'], list(range(1, 49)))
        self.assertEqual(self.sources['task1']['pageItems']['48'], [])
        self.assertTrue(all(not s['answerKeyAvailable'] for s in self.sources.values()))
        self.assertFalse(self.bank['migration']['complete'])
        self.assertIsNone(self.bank['migration']['pdfTotalQuestions'])
        blockers = {b['source']: b for b in self.index['blockedItems']}
        self.assertNotIn('task2', blockers)
        self.assertEqual(blockers['task3']['pages'], [89])
        self.assertEqual(self.sources['task2']['reviewedPages'], list(range(1, 125)))
        self.assertTrue(set(blockers['task3']['pages']).isdisjoint(self.sources['task3']['reviewedPages']))


if __name__ == '__main__':
    unittest.main()
