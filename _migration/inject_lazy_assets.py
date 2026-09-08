#!/usr/bin/env python3
"""Add the lazy-asset activator to every real page.

Same shape and the same skip rules as inject_attribution.py: redirect stubs are
gone before a script could run, and a file that already carries the tag is left
alone, so this is safe to re-run after a re-capture.

The tag goes immediately after the attribution script so the two site-owned
scripts stay together at the end of <head>.
"""
import os

ROOT = os.path.dirname(os.path.abspath(__file__)) + "/.."
TAG = '<script src="/assets/coastal-lazy-assets.js" defer></script>'
AFTER = '<script src="/assets/coastal-attribution.js" defer></script>'
SKIP_DIRS = {".git", "wp-content", "wp-includes", "_migration", "assets"}


def main():
    added = skipped = stubs = 0
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in filenames:
            if not name.endswith(".html"):
                continue
            path = os.path.join(dirpath, name)
            try:
                html = open(path, encoding="utf-8", errors="ignore").read()
            except OSError:
                continue
            if "coastal-lazy-assets.js" in html:
                skipped += 1
                continue
            # Redirect stubs and the 404 handler manage themselves.
            if 'http-equiv="refresh"' in html:
                stubs += 1
                continue
            if AFTER in html:
                html = html.replace(AFTER, AFTER + "\n  " + TAG, 1)
            elif "</head>" in html:
                html = html.replace("</head>", "  " + TAG + "\n</head>", 1)
            else:
                skipped += 1
                continue
            open(path, "w", encoding="utf-8").write(html)
            added += 1
    print("lazy-asset activator injected: %d added, %d already had it or unsuitable, "
          "%d redirect stubs skipped" % (added, skipped, stubs))


if __name__ == "__main__":
    main()
