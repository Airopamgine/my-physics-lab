"""Cache OCR text privately. PDFs and raw OCR must never be committed.

Prepare: python3 scripts/prepare_reading_sources.py /path/to/upload
Read one cached page: python3 scripts/prepare_reading_sources.py --packet PATH --page 8
The text is unverified OCR. It is NEVER automatically added to the quiz bank.
"""
import argparse
import base64
import gzip
import json
import subprocess
from pathlib import Path

FILES = {"reading": "TOEFL-reading.pdf", "actual": "TOEFL-reading_actual.pdf",
         "task1": "TOEFL-reading_task1.pdf", "task2": "TOEFL-reading_task2.pdf",
         "task3": "TOEFL-reading_task3.pdf", "vocabulary": "TOEFL-rearing_単語.pdf"}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("upload", nargs="?")
    parser.add_argument("--packet")
    parser.add_argument("--page", type=int)
    parser.add_argument("--cache-dir", help="Private working directory; never publish its contents")
    args = parser.parse_args()
    if args.packet:
        data = json.loads(gzip.decompress(base64.b64decode(Path(args.packet).read_text())))
        for page in data["pages"]:
            if args.page is None or page["number"] == args.page:
                print(f'PDF page {page["number"]}\n{page["text"]}')
        return
    repo = Path(__file__).resolve().parents[1]
    destination = Path(args.cache_dir) if args.cache_dir else repo / "scripts/reading-source-text"
    destination.mkdir(parents=True, exist_ok=True)
    sources = []
    for source_id, filename in FILES.items():
        path = Path(args.upload) / filename
        text = subprocess.check_output(["pdftotext", "-layout", str(path), "-"]).decode()
        pages = text.split("\f")
        if not pages[-1].strip():
            pages.pop()
        for offset in range(0, len(pages), 10):
            name = f"{source_id}-p{offset+1:03}-p{min(offset+10,len(pages)):03}.json.gz.b64"
            payload = {"source": filename, "status": "unverified-ocr",
                       "pages": [{"number": i+1, "text": pages[i]} for i in range(offset,min(offset+10,len(pages)))]}
            encoded = base64.b64encode(gzip.compress(json.dumps(payload, ensure_ascii=False).encode(), mtime=0)).decode() + "\n"
            (destination / name).write_text(encoded)
        sources.append({"id": source_id, "file": filename, "pageCount": len(pages),
                        "answerKeyAvailable": False, "reviewedPages": []})
    index = {"schemaVersion": 1, "sources": sources,
             "note": "Public review progress only. Private PDF hashes and OCR cache paths are excluded. Exact question totals require review. Answer pages referenced by the books were not supplied."}
    # This command is an initial cache operation. Never overwrite progress later.
    index_path = repo / "scripts/reading-source-index.json"
    if index_path.exists():
        print("Private cache refreshed; existing source index and review progress preserved")
        return
    index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n")
    print(f"Cached {sum(s['pageCount'] for s in sources)} pages from {len(sources)} PDFs")


if __name__ == "__main__":
    main()
