#!/usr/bin/env python3
"""Inject the restyle stylesheet into every page of the frozen clone. Idempotent.

Adds, immediately before </head>:
  <link rel="stylesheet" id="coastal-restyle-css" href="/restyle/site.css">
so it is the last stylesheet and wins the cascade. Also swaps the retired wave-and-house
logo (Coastal-Demo-Logo-For-Shorts-...png) for the wordmark (brand era is wordmark only).

Run from the repo root:  python3 restyle/inject.py [--dry-run]
"""
import re, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
TAG = '<link rel="stylesheet" id="coastal-restyle-css" href="/restyle/site.css">'
OLD_LOGO = re.compile(r'/wp-content/uploads/2021/07/Coastal-Demo-Logo-For-Shorts[^"\']*\.png')
NEW_LOGO = '/restyle/img/logo-wordmark-navy.png'
dry = '--dry-run' in sys.argv
n_link = n_logo = 0
for p in sorted(ROOT.rglob('*.html')):
    if any(part in ('.git', 'node_modules', '_migration', 'restyle') for part in p.parts): continue
    s = p.read_text(encoding='utf-8', errors='surrogateescape'); o = s
    if TAG not in s and '</head>' in s:
        s = s.replace('</head>', TAG + '\n</head>', 1); n_link += 1
    s, k = OLD_LOGO.subn(NEW_LOGO, s); n_logo += k
    if s != o and not dry: p.write_text(s, encoding='utf-8', errors='surrogateescape')
print(f'link injected into {n_link} files; logo refs swapped: {n_logo}{" (dry run)" if dry else ""}')
