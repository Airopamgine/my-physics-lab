"""Reviewed learning tiers and reproducible semantic study filters.

These are editorial study routes, not official CEFR/TOEFL difficulty ratings.
Keep inventory, dictionary senses and stable card IDs even when excluding a quiz.
"""
import re

LEVELS = [
    {"id": "practical", "label": "実用・一般", "description": "基礎語を除いた日常・大学生活の語彙"},
    {"id": "academic", "label": "学術・論説", "description": "説明・比較・主張・研究で使う語彙と表現"},
    {"id": "advanced", "label": "専門・発展", "description": "科学・技術などの専門概念、発展語彙"},
    {"id": "reference", "label": "出題対象外（参照用）", "description": "基本語、記号・人名、意味未登録の索引"}]
SUBJECTS = [
    {"id": "general", "label": "日常・大学生活"},
    {"id": "academic", "label": "学術・研究表現"},
    {"id": "life", "label": "生命科学・医療"},
    {"id": "earth", "label": "地球・環境"},
    {"id": "physical", "label": "物理・化学・工学・情報"},
    {"id": "society", "label": "社会・経済・歴史"},
    {"id": "arts", "label": "芸術・文化・言語"}]

# Deliberately curated elementary lemmas, not the most frequent corpus words.
# Academic core words such as evidence/analysis and technical polysemous words
# such as cell/charge/force/current/mass/energy remain study targets.
BASIC = frozenset("""
a an the i me my mine myself we us our ours ourselves you your yours yourself yourselves
he him his himself she her hers herself it its itself they them their theirs themselves
this that these those who whom whose what which when where why how there here
and or but so if because than then as of to in on at by for from with without into onto
off out up down over under above below behind beside between among before after during
until since through across around about against along near inside outside away back
all any some no none not each every both either neither other another such enough
be am is are was were been being have has had having do does did doing done
will would shall should can could may might must need dare ought yes yeah no okay ok
one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen
sixteen seventeen eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety
hundred thousand million billion first second third fourth fifth sixth seventh eighth ninth tenth
once twice zero number few many much more most less least several little lot lots
big small large long short tall high low old young new good bad better best worse worst
great nice fine beautiful pretty ugly easy hard difficult simple happy sad angry tired busy
hot warm cool cold wet dry clean dirty cheap expensive fast slow quick early late soon
right left straight true false sure real ready full empty open closed same different
red blue green yellow black white pink purple brown gray grey orange color colour dark bright
day week month year today yesterday tomorrow morning afternoon evening night noon midnight
monday tuesday wednesday thursday friday saturday sunday january february march april may june
july august september october november december spring summer autumn fall winter
man woman boy girl child baby person people friend family mother father parent brother sister
son daughter husband wife grandmother grandfather aunt uncle cousin student teacher doctor
home house room bed bedroom bathroom kitchen door window wall floor roof garden yard
desk table chair sofa clock watch bag box bottle cup glass plate fork spoon knife key
book pen pencil paper letter picture photo photograph newspaper phone telephone computer
school class lesson homework test exam question answer name age address language english
car bus train bike bicycle boat ship plane airplane street road city town village country
shop store market restaurant cafe bank hotel station airport park hospital library office
food meal breakfast lunch dinner bread rice meat fish chicken egg milk water juice tea coffee
fruit apple banana grape lemon cake sugar salt soup sandwich salad vegetable potato tomato
eat drink cook buy sell pay cost money dollar pound price shopping clothes shirt dress coat
hat shoe sock skirt jacket sweater pocket umbrella hair eye ear nose mouth tooth teeth
head face hand arm leg foot feet finger heart body stomach neck shoulder skin
animal dog cat bird horse cow pig sheep goat rabbit duck hen rat mouse fly snake lion
tree flower grass leaf leaves sky sun moon star rain snow wind cloud weather sea river lake
mountain hill beach island forest farm field fire air earth world land ground stone rock
walk run go come get take give put make let keep see look watch hear listen feel touch
say tell speak talk ask reply read write learn study teach know think believe understand
want like love hate enjoy help thank meet visit live die sit stand sleep wake lie stay
start begin finish end stop leave arrive wait move travel drive ride swim dance sing play
use try work call send receive bring carry hold find lose forget remember show turn change
wash cut draw paint wear rain snow grow build break close add count spell plan check
win buy choose spend save return happen pass join borrow lend follow fill pick smile laugh
hope wish worry hurt repair clean climb jump kick throw catch push pull invite
able free kind funny hungry thirsty sick ill healthy careful sorry welcome important interesting
possible impossible usual normal special main wrong lucky poor rich strong weak soft loud quiet
well very too also again almost always usually often sometimes never ever already still just
only even really quite probably maybe perhaps together alone suddenly slowly quickly easily
something anything nothing everything someone anyone everyone nobody somewhere anywhere everywhere
hello hi goodbye bye please thanks mr mrs ms miss sir madam yours sincerely dear
complete missing letter enter word sentence correct incorrect wrong select choose option
clear helpful useful public private place part thing example practice exercise group list
last next middle date minute hour time month year weekday weekend birthday holiday
match repeat again lesson level finish game sport football soccer tennis music movie film
life human history art health area person personal women men children died dead death
while whether within nor vocabulary information meaning adjective adverb noun verb grammar
passage paragraph text title heading written spoken learning reading writing listening spelling
classroom notebook textbook timetable blackboard chalk toothbrush toothpaste towel soap fridge
television tv radio camera cellphone online internet website email e-mail password username
""".split())
CONTRACTIONS = frozenset("""
i'm i've i'll i'd you're you've you'll you'd he's he'd he'll she's she'd she'll it's it'd it'll
we're we've we'll we'd they're they've they'll they'd that's there's here's who's what's let's
isn't aren't wasn't weren't don't doesn't didn't haven't hasn't hadn't won't wouldn't can't
couldn't shouldn't mustn't needn't ain't cannot
""".split())
BASIC_PHRASES = frozenset({"a lot of fun", "a while ago", "at the moment", "before noon", "by next june", "by noon",
    "call someone", "check my plans", "come with us", "close to", "good morning", "good afternoon",
    "good evening", "thank you", "how are you", "see you", "wake up", "get up", "go home", "go to school",
    "take a bus", "have lunch", "have dinner", "have breakfast"})
SYMBOLS = frozenset("abcdefghijklmnopqrstuvwxyz abc abcd etc eg ie e.g i.e fig q qa qr pdf url www html txt jpeg png mp pm am".split())
NAMES = frozenset("anna ben dana dan emma liam mia noah olivia lucas luca sofia leo ava max maya nora zoe ella ethan alex alexa alice bob carol david jane john kate linda mary mike paul peter sarah tom william james sophia emily jack jill rachel sara jason jessica michael robert susan elizabeth daniel oliver angela ryan laura chris jonathan amanda lauren emily eric helen henry julia lily lisa louis lucy marcus matthew natalie nicole oscar patrick sam samantha simon steven victoria taylor thomas aaron adam adrian amy brian charlotte charlie claire clark dylan edward eva fiona george grace hannah harry ian isabella jenny joseph julian kevin kim leah mason natalia nathan nick nina owen rose sebastian tim victor".split())

ACADEMIC = frozenset("""
abstract abstraction acknowledge acquire acquisition adapt adaptation adequate adjacent advocate
allocate allocation alternative analogous analogy analyze analyse analysis analytic analytical
anticipate apparent approach approximate approximation arbitrary argument assert assess assessment
assume assumption attribute authority available availability aware benefit bias capacity causal
cause characteristic clarify coherent cohesion compensate complement complex complexity component
comprehensive comprise conceive concept conceptual conclude conclusion conduct confer confirm
consequence consequently consistent constitute constrain constraint construct construction consult
context contextual contrast contribute contribution controversy conventional converge correlate
correlation criterion criteria crucial cumulative data debate deduce deduction define definition
demonstrate derive despite detect determine differentiate diminish discrete discriminate distinguish
distribute distribution diverse diversity dominant dynamic emphasis emphasize empirical enable
encounter enhance ensure entity equivalent establish estimate evaluate evaluation evidence evident
exceed exclude exhibit expand explicit exposure extract factor feature phenomenon phenomena
finite flexible fluctuate focus formulate framework function fundamental furthermore generate
hypothesis hypothesize identify illustrate imply implicit implication indicate indicator infer
inference inhibit initial insight integrate interaction interpret interpretation interval intrinsic
investigate investigation involve issue justify justification labor labour legal legitimate likely
maintain major mechanism method methodology minimize monitor nevertheless nonetheless notion
objective obtain occur occurrence outcome overall parameter participate perceive perception
perspective plausible potential precede precise precision predict prediction predominant preliminary
presume previous principle priority process proportion propose proposal prospect qualitative
quantitative relevant relevance require requirement research resource restrict retain reveal
revise revision significant significance similar similarity simulate simulation specific specify
stable stability statistic statistical strategy structure subsequent sufficient summarize summary
sustain systematic technique temporary tentative theory theoretical thesis thereby therefore
transformation trend underlying undertake uniform unique valid validity vary variable variation
whereas widespread yield reinforce facilitate indicate implication respective simultaneous
feasible inferential controversial inherent longitudinal longitudinally contradict contradictory
albeit thereby hence albeit likewise conversely consequently predominantly comparatively
system environmental community population condition development economic political production
effect result claim explanation pattern mechanism temperature technology organization government
society culture material energy pressure power state source information institution researcher
however moreover comparison contrast proportion relationship identify predict record describe
""".split())
ADVANCED = frozenset("""
aberration abiotic ablation accretion allelopathy allele alluvial anaerobic anatomy anthropogenic
aquifer archaeologist archaeology archaeometry asteroid autotroph auxin biodiversity biome
biochemistry biofilm biosphere biotechnology bryophyte calcification capillary cataclysmic catalyst
antigen chemosynthetic conduction fixation
catalytic chromatography chlorophyll chloroplast cognition cognitive conifer convection crystallize
cytoplasm dendrochronology denitrification desalinization desalination dielectric diffusion dinosaur
dormancy echolocation ecosystem electromagnetism electromagnetic electron electrolyte embryonic
enzyme epigenetic epigenetics erosion estuary eutrophication evaporation exothermic fault-line
fermentation fertilization fossilization fractal fossil geothermal genotype glacier glaciation
glycogen gravitropism heritable hormone hydrology hydrothermal hypha hypothesis igneous isotope
keystone kinetic laminate lithosphere magnetism mammalian metamorphic metabolism meteorite
mitochondrion mitochondria mitosis molecular molecule morphology mutation mycorrhiza neuron
neurotransmitter nitrogen nodulation nutrient oligotrophic osmosis osmotic paleontology peatland
permafrost phloem photoperiod phototropism photosynthesis photosynthetic phylogeny phytoplankton
plankton plate-tectonics pollination polymer polysaccharide precipitation prokaryote quantum
quartz radioactive radiation recalibrate recombinant respiration rhizosphere salinity sediment
sedimentation seismic semiconductor speciation stratigraphy subduction superconductivity symbiosis
tectonic tectonics thermodynamics thermoregulation transpiration transistor trophic tropism
tundra ultraviolet upwelling vascular viscosity volcanic volcanism xylem zooplankton
""".split()) - {"hypothesis", "cognition", "cognitive"}

TOPIC_CUES = {
    "life": r"\b(?:biolog\w*|ecolog\w*|genetic\w*|organism\w*|cellular|photosynth\w*|chemosynth\w*|carbon fixation|antigen\w*|phototrop\w*|hormone\w*|biodivers\w*|ecosystem\w*|neur\w*|botan\w*|zoolog\w*|medical|anatom\w*|physiolog\w*|microb\w*|pathogen\w*|enzyme\w*|metaboli\w*|pollinat\w*|embry\w*|chromosom\w*)\b",
    "earth": r"\b(?:geolog\w*|tectonic\w*|sediment\w*|meteorolog\w*|climat\w*|volcan\w*|glacia\w*|aquifer\w*|geotherm\w*|oceanograph\w*|seismic|permafrost|lithosphere|hydrolog\w*|erosion|fossil\w*|earthquake\w*|mineral\w*)\b",
    "physical": r"\b(?:physics|physicist\w*|chemical|chemistry|electron\w*|electrical|electromagnet\w*|quantum|semiconductor\w*|transistor\w*|engineering|algorithm\w*|computer science|computation\w*|thermodynam\w*|mathematic\w*|astronom\w*|isotope\w*|molecular|molecule\w*|polymer\w*|cataly\w*|convection)\b",
    "society": r"\b(?:sociolog\w*|economic\w*|anthropolog\w*|archaeolog\w*|political|politics|historian\w*|civilization\w*|legislat\w*|governance|democracy|inflation|monetary|fiscal|commerce|constitutional|psycholog\w*)\b",
    "arts": r"\b(?:linguistic\w*|literature|literary|poetry|poet\w*|painting|sculpt\w*|musical|composer\w*|symphon\w*|architectur\w*|theatr\w*|rhetoric\w*|phon\w*|syntactic|syntax)\b"}
TOPIC_PATTERNS = {name: re.compile(pattern, re.I) for name, pattern in TOPIC_CUES.items()}
ACADEMIC_PHRASE = re.compile(r"\b(?:in terms of|in contrast|in addition|as a result|on the other hand|be related to|account for|as opposed to|rather than|not only|even though|provided that|regardless of|lead to|result in|consistent with|associated with|due to|in response to|evidence|hypothesis|analysis|inference|discourse|reported speech|relative clause|conditional|present perfect)\b")
JAPANESE_TOPICS = {
    "life": re.compile(r"生物|細胞|遺伝|光合成|ホルモン|生態|酵素|神経|免疫|植物|動物|呼吸|受粉|走光性|抗原|症候群"),
    "earth": re.compile(r"地質|地殻|地震|堆積|火山|気候|氷河|帯水層|化石|侵食|海流|降水|鉱物|大気"),
    "physical": re.compile(r"物理|化学|電[子流圧気]|磁[場気]|量子|半導体|分子|原子|同位体|アルゴリズム|計算機|熱力学|伝導|放射線|被ばく"),
    "society": re.compile(r"経済|社会|歴史|政治|考古|文明|財政|貨幣|法律|市場|貿易|心理"),
    "arts": re.compile(r"芸術|絵画|彫刻|建築|音楽|文学|詩|言語学|音韻|統語"),
    "academic": re.compile(r"仮説|分析|推論|研究|根拠|比較|結論|概念|論証|主張|論説")}


def meaning_subjects(text, term="", known_topics=()):
    """Topics for this meaning, rather than every meaning of a polysemous word."""
    found = set(known_topics)
    complete = term + " " + text
    found.update(topic for topic, pattern in TOPIC_PATTERNS.items() if pattern.search(complete))
    found.update(topic for topic, pattern in JAPANESE_TOPICS.items() if pattern.search(text))
    if any(word in ACADEMIC for word in term.split()) or ACADEMIC_PHRASE.search(term):
        found.add("academic")
    return [s["id"] for s in SUBJECTS if s["id"] in (found or {"general"})]


def classify(row, senses, sense_topics):
    term = row["term"]
    lemmas = {term, *(d["lemma"] for d in row["dictionary"])}
    components = lemmas | {part for lemma in lemmas for part in re.split(r"[ -]+", lemma)}
    # Whole-phrase matching protects useful idioms containing elementary words.
    reason = ""
    if len(term) == 1 or term in SYMBOLS or term in NAMES:
        reason = "記号・人名・表記"
    elif term in BASIC_PHRASES or " " not in term and (lemmas.intersection(BASIC) or term in CONTRACTIONS):
        reason = "基本語・基本活用形"
    elif not row["quizGlosses"] and not row["dictionary"]:
        reason = "意味未登録"
    topics = set()
    for lookup in row["dictionary"]:
        topics.update(sense_topics.get(lookup["sense"], []))
    text = " ".join([term, *[senses[d["sense"]]["definition"] for d in row["dictionary"]], *[g["text"] for g in row["quizGlosses"]]])
    for topic, pattern in TOPIC_PATTERNS.items():
        if pattern.search(text):
            topics.add(topic)
    core_academic = bool(components.intersection(ACADEMIC) or ACADEMIC_PHRASE.search(term))
    if core_academic:
        topics.add("academic")
    if not topics:
        topics.add("general")
    # A rare technical secondary sense must not promote an ordinary word such
    # as accommodation (whose secondary meaning includes focusing the eye).
    primary = set(sense_topics.get(row["dictionary"][0]["sense"], [])) if row["dictionary"] else set()
    primary_text = " ".join([term, senses[row["dictionary"][0]["sense"]]["definition"] if row["dictionary"] else "", *[g["text"] for g in row["quizGlosses"]]])
    primary.update(topic for topic, pattern in TOPIC_PATTERNS.items() if pattern.search(primary_text))
    primary.update(topic for topic, pattern in JAPANESE_TOPICS.items() if pattern.search(primary_text))
    level = "practical"
    if "academic" in primary or core_academic:
        level = "academic"
    if components.intersection(ADVANCED) or primary.intersection({"life", "earth", "physical"}) and level != "academic":
        level = "advanced"
    if level == "practical" and not primary.intersection({"life", "earth", "physical", "society", "arts"}):
        topics.add("general")
    return {"level": "reference" if reason else level, "subjects": [s["id"] for s in SUBJECTS if s["id"] in topics],
            "eligible": not bool(reason), "reason": reason}
