#!/usr/bin/env python3
"""Rebuild the licensed dictionary subset from an unmodified WordNet 3.0 dict.

Usage: python3 scripts/import_vocabulary_wordnet.py /path/to/WordNet-3.0
The deployment builder is offline and does not download a dictionary. Retain the
license on every distributed copy. Dictionary lookup is not sense disambiguation.
"""
import hashlib
import json
import re
import sys
from pathlib import Path
from build_toefl_vocabulary import corpus, key, words

RULES = {
    "noun": [("s", ""), ("ses", "s"), ("xes", "x"), ("zes", "z"), ("ches", "ch"), ("shes", "sh"), ("men", "man"), ("ies", "y")],
    "verb": [("s", ""), ("ies", "y"), ("es", "e"), ("es", ""), ("ed", "e"), ("ed", ""), ("ing", "e"), ("ing", "")],
    "adj": [("er", ""), ("est", ""), ("er", "e"), ("est", "e")], "adv": []}


def import_dictionary(repo, root):
    indices, exceptions, senses = {}, {}, {}
    for pos in RULES:
        indices[pos], exceptions[pos] = {}, {}
        for line in (root / "dict" / ("index." + pos)).read_text().splitlines():
            if line.startswith(" ") or not line:
                continue
            parts = line.split()
            count = int(parts[2]); start = 6 + int(parts[3])
            indices[pos][parts[0]] = [parts[1] + ":" + offset for offset in parts[start:start + count]]
        for line in (root / "dict" / (pos + ".exc")).read_text().splitlines():
            form, *lemmas = line.split(); exceptions[pos][form] = lemmas
        for line in (root / "dict" / ("data." + pos)).read_text().splitlines():
            if line.startswith(" ") or "|" not in line:
                continue
            data, gloss = line.split("|", 1); parts = data.split()
            p = "a" if parts[2] == "s" else parts[2]
            definition = re.split(r';\s*"', gloss.strip(), maxsplit=1)[0].strip()
            synonyms = [re.sub(r"\([a-z]+\)$", "", parts[4 + 2 * i]).replace("_", " ")
                        for i in range(int(parts[3], 16))]
            senses[p + ":" + parts[0]] = {"pos": p, "definition": definition, "synonyms": synonyms}
    read = lambda path: json.loads((repo / path).read_text())
    docs, glossary = corpus(repo, read("static/data/toefl-task-bank.json"),
                            read("static/data/english-question-bank.json"), read("static/data/toefl-writing-bank.json"))
    terms = {key(m[0]) for doc in docs for texts in doc["fields"].values() for text in texts for m in words(text)}
    terms.update(term for term, _, _ in glossary)
    lookup = {}
    for term in sorted(terms):
        form = term.replace(" ", "_")
        variants = [form, form.replace("-", "_")]
        rows, seen = [], set()
        for pos in RULES:
            for variant in variants:
                if variant in indices[pos]:
                    lemmas = [variant]
                else:
                    lemmas = exceptions[pos].get(variant, []) + [variant[:-len(suffix)] + ending
                             for suffix, ending in RULES[pos] if variant.endswith(suffix)]
                for lemma in dict.fromkeys(lemmas):
                    for sid in indices[pos].get(lemma, []):
                        if sid in seen:
                            continue
                        seen.add(sid); rows.append({"lemma": lemma.replace("_", " "), "sense": sid})
        if rows:
            lookup[term] = rows
    needed = {row["sense"] for rows in lookup.values() for row in rows}
    license_text = (root / "LICENSE").read_text()
    license_file = repo / "static/data/wordnet-license.txt"
    license_file.write_text(license_text)
    payload = {"source": {"name": "WordNet 3.0", "url": "https://wordnet.princeton.edu/",
                          "licenseUrl": "https://wordnet.princeton.edu/license-and-commercial-use",
                          "license": license_text,
                          "inputSha256": {"index." + pos: hashlib.sha256((root / "dict" / ("index." + pos)).read_bytes()).hexdigest() for pos in RULES},
                          "note": "一般辞書の語義候補です。教材での意味を自動判定したものではありません。活用形には辞書に確認できる基本形の説明を付けます。"},
               "words": lookup, "senses": {sid: senses[sid] for sid in sorted(needed)}}
    dest = repo / "data/toefl-vocabulary/wordnet-lexicon.json"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(f"WordNet subset: {len(lookup)}/{len(terms)} entries, {len(needed)} synsets")


if __name__ == "__main__":
    import_dictionary(Path(__file__).resolve().parent.parent, Path(sys.argv[1]))
