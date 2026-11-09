#!/usr/bin/env python3
"""Export Edu Focus schedule JSON from a BNTU PDF (text layer) or bundled TypeScript."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

try:
    from pypdf import PdfReader
except ImportError as exc:  # pragma: no cover
    print("Install pypdf: python3 -m pip install pypdf", file=sys.stderr)
    raise SystemExit(1) from exc


def extract_pdf_text(path: Path) -> str:
    reader = PdfReader(str(path))
    chunks: list[str] = []
    for page in reader.pages:
        chunks.append(page.extract_text() or "")
    return "\n".join(chunks).strip()


def export_bundled(_group_id: str) -> dict:
    raise SystemExit(
        "Use in-app Profile → Расписание → Экспорт JSON, or maintain src/features/schedule/data/schedule-*.ts in the repo."
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Build schedule JSON for Edu Focus import")
    parser.add_argument("--group", default="11701126", help="Group id, e.g. 11701126")
    parser.add_argument("--pdf", type=Path, help="Path to BNTU PDF")
    parser.add_argument("--from-bundled", action="store_true", help="Export current bundled TS data")
    parser.add_argument("-o", "--output", type=Path, help="Write JSON file instead of stdout")
    args = parser.parse_args()

    if args.from_bundled:
        payload = export_bundled(args.group)
    elif args.pdf:
        text = extract_pdf_text(args.pdf)
        if len(text.replace(" ", "")) < 120:
            raise SystemExit(
                "PDF looks like a scan (no text). Re-type schedule into JSON manually or OCR first."
            )
        payload = {
            "groupId": args.group,
            "period": "",
            "title": "",
            "weekIMonday": "2026-10-12",
            "sourceKind": "import",
            "sourceLabel": args.pdf.name,
            "lessons": [],
            "note": "Text extracted, but auto-parse is not implemented in this script yet. Use --from-bundled or paste lessons JSON.",
            "extractedTextPreview": text[:2000],
        }
    else:
        parser.error("Use --pdf path or --from-bundled")

    output = json.dumps(payload, ensure_ascii=False, indent=2)
    if args.output:
        args.output.write_text(output, encoding="utf-8")
        print(f"Wrote {args.output}")
    else:
        print(output)


if __name__ == "__main__":
    main()
