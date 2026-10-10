#!/usr/bin/env python3
"""Derive study topics from the licensed, unmodified WordNet 3.0 distribution.

No definitions are replaced. Only lexicographer categories, topic-domain links
and noun hypernyms are used, with reviewed topic anchors. Deployment is offline.
"""
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def derive(root, lexicon):
    names = {n: name for n, name, _ in (line.split() for line in (root / "dict/lexnames").read_text().splitlines())}
    nodes = {}
    inputs = {}
    for pos in ("noun", "verb", "adj", "adv"):
        path = root / "dict" / ("data." + pos)
        inputs[path.name] = hashlib.sha256(path.read_bytes()).hexdigest()
        for line in path.read_text().splitlines():
            if line.startswith(" ") or "|" not in line:
                continue
            fields = line.split("|", 1)[0].split()
            p = "a" if fields[2] == "s" else fields[2]
            count = int(fields[3], 16)
            lemmas = [fields[4 + i * 2].lower().replace("_", " ") for i in range(count)]
            start = 4 + count * 2
            pointers = [fields[start + 1 + i * 4:start + 5 + i * 4] for i in range(int(fields[start]))]
            nodes[p + ":" + fields[0]] = {"file": names[fields[1]], "lemmas": lemmas,
                "parents": [target_pos + ":" + offset for symbol, offset, target_pos, _ in pointers if symbol in ("@", "@i", ";c")]}
    anchors = {
        "life": {"biology", "botany", "zoology", "ecology", "genetics", "medicine", "physiology", "microbiology", "biochemistry"},
        "earth": {"geology", "meteorology", "oceanography", "geography", "climatology", "mineralogy", "paleontology"},
        "physical": {"physics", "chemistry", "astronomy", "mathematics", "engineering", "electronics", "computer science", "technology"},
        "society": {"sociology", "economics", "history", "politics", "anthropology", "archaeology", "business", "commerce", "psychology", "law"},
        "arts": {"art", "music", "literature", "painting", "architecture", "sculpture", "drama", "linguistics"}}
    memo = {}

    def topics(sid, path=None):
        if sid in memo:
            return memo[sid]
        path = path or set()
        if sid not in nodes or sid in path:
            return set()
        n = nodes[sid]
        found = {topic for topic, terms in anchors.items() if terms.intersection(n["lemmas"])}
        # Broad lexicographer groups are reliable for organisms and anatomy.
        if n["file"] in ("noun.animal", "noun.plant", "noun.body"):
            found.add("life")
        if n["file"] == "verb.weather":
            found.add("earth")
        if n["file"] in ("noun.cognition", "verb.cognition"):
            found.add("academic")
        for parent in n["parents"]:
            found.update(topics(parent, path | {sid}))
        memo[sid] = found
        return found

    needed = lexicon["senses"]
    output = {sid: sorted(topics(sid)) for sid in sorted(needed) if topics(sid)}
    return {"source": {"name": "WordNet 3.0 study-topic mapping", "url": "https://wordnet.princeton.edu/documentation/lexnames5wn",
                       "inputSha256": inputs, "senseFingerprint": hashlib.sha256(json.dumps(needed, sort_keys=True, ensure_ascii=False).encode()).hexdigest(),
                       "note": "編集した分野アンカーとWordNetの語義分類・上位語・領域を参照した学習用分類。文脈の語義を断定しません。"},
            "senseTopics": output}


if __name__ == "__main__":
    lexicon = json.loads((ROOT / "data/toefl-vocabulary/wordnet-lexicon.json").read_text())
    payload = derive(Path(sys.argv[1]), lexicon)
    (ROOT / "data/toefl-vocabulary/wordnet-study-topics.json").write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(f"Derived study topics for {len(payload['senseTopics'])} dictionary senses")
