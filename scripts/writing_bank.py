"""Combine the unchanged published source bank with separately authored originals."""
import json
from pathlib import Path


def load_writing_bank(repo: Path) -> dict:
    bank = json.loads((repo / "static/data/toefl-writing-bank.json").read_text())
    path = repo / "static/data/toefl-writing-originals.json"
    if not path.exists():
        return bank
    originals = json.loads(path.read_text())
    if originals.get("schemaVersion") != 1 or not isinstance(originals.get("exercises"), list):
        raise ValueError("Invalid original Writing feed")
    ids = {q["id"] for q in bank["exercises"]}
    for q in originals["exercises"]:
        if q["source"].get("kind") != "original" or q["id"] in ids:
            raise ValueError("Original feed must contain unique original exercises only")
        if not all(ref.startswith("original:writing:") for ref in q["sourceRefs"]):
            raise ValueError("Invalid original source reference")
        ids.add(q["id"])
    bank["exercises"] += originals["exercises"]
    bank["updated"] = max(bank.get("updated", ""), originals.get("updated", ""))
    return bank
