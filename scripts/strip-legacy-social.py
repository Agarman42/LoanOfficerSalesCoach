#!/usr/bin/env python3
"""Remove legacy social modal code from app-bulk-src in index.html."""
import re
from pathlib import Path

path = Path(__file__).resolve().parents[1] / "index.html"
text = path.read_text(encoding="utf-8")

start_marker = '<script type="text/plain" id="app-bulk-src"'
end_marker = '</script>'
start = text.find(start_marker)
if start == -1:
    raise SystemExit("app-bulk-src not found")
content_start = text.find(">", start) + 1
content_end = text.find(end_marker, content_start)
bulk = text[content_start:content_end]

# Remove openExpandedSocialExamplesModal legacy function
bulk = re.sub(
    r"\n// Opens a richer, expanded modal.*?\n\};\n\n(?=// Social Strategy Search)",
    "\n",
    bulk,
    count=1,
    flags=re.DOTALL,
)

# Remove duplicate SOCIAL_PILLAR_CONTENT block inside IIFE
bulk = re.sub(
    r"\n  // =+\n  // SOCIAL MEDIA STRATEGY — RICH PREMIUM MODALS.*?"
    r"console\.log\('%c\[Social Strategy\] Rich pillar modals initialized.*?\n\n",
    "\n",
    bulk,
    count=1,
    flags=re.DOTALL,
)

new_text = text[:content_start] + bulk + text[content_end:]
path.write_text(new_text, encoding="utf-8")
print("Stripped legacy social blocks from app-bulk-src")