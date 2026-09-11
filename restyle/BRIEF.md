# Restyle brief — Coastal Demolitions site, option L ("Photo band")

**Goal.** Make the live site look like the quote/tax-invoice pair Dan signed off (option L):
navy band with a diagonal cut, Poppins display / Open Sans body / IBM Plex Mono figures,
cream and navy, one terracotta accent, no rounded corners, ruled tables, wordmark only.
Preview only. Nothing is deployed. Never push. Never touch `vercel.json`, `api/`, `robots.txt`,
`sitemap*.xml`, or anything under `wp-content/`.

**Reference documents** (open them, they are the style guide):
- `../Coastal media/.claude/worktrees/coastal-site-restyle-197cba/design-system/Coastal-Brand-Guide-v2.html` — Brand Guide v2 (10 Sep 2026), built from the same quote/invoice; its rules (wordmark only, status colours fixed: sage=verified, amber=provisional, terracotta=action; kickers Poppins 600 11–12px 12% tracking) apply here.
- `../Coastal media/.claude/worktrees/coastal-site-restyle-197cba/quote-invoice/pdf/Quote_Q05347.pdf`
- `../Coastal media/.claude/worktrees/coastal-site-restyle-197cba/quote-invoice/pdf/TaxInvoice_05347.pdf`
- The CSS that produced them: `quote-invoice/src/gen_L.py` lines 62–211 (same repo).
- Tokens already translated for the web: `restyle/tokens.css`. **Use the variables. No new hex.**

**Option-L vocabulary to reuse on screen**
- *Band*: solid `--navy` band across the top, bottom edge cut on a diagonal
  `clip-path:polygon(0 0,100% 0,100% calc(100% - 28px),0 100%)`; wordmark (white) at left,
  a quiet Poppins 500 strap in `--bg300` at right ("What you see is what you get").
- *Bar*: solid navy footer with white contact line (phone · email · web) and small SVG line icons,
  page number replaced by the ABN/entity line in `--bg300`.
- *Cover panel*: navy panel with a diagonal top edge over a photograph
  (`polygon(0 14mm,100% 0,100% 100%,0 100%)`) — this is the hero and page-banner treatment.
- *Micro label*: Poppins 600, 12px, `.12em` tracking, uppercase, `--ink2` (`--bg300` on navy).
- *Ruled table*: `.5pt`→1px `--line` borders, header cells `--cream050` with micro-label type in navy.
- *Section heading*: h2 with a 1px `--line` rule above it and 24px of air; the navy
  *grand-total rule* is kept for under a page title (guide, project, blog band).
- *Card notch*: `clip-path:polygon(0 0,100% 0,100% 100%,16px 100%,0 calc(100% - 16px))` with a 1px `--line` border.
- *Due / action*: `--terra`, Poppins 600. **One terracotta action per view.**
- Photos sit full-bleed with `object-fit:cover`; text on navy is `--white` / `--bg100` / `--bg300`.
- Headings: Poppins 600, `letter-spacing:-0.01em`, `line-height:1.15`; one scale everywhere —
  h1 `clamp(34px,4.5vw,56px)`, h2 `clamp(26px,2.6vw,34px)`, h3 22px, h4 18px.
- Body: Open Sans 400, 16–17px, line-height 1.55, colour `--ink`; muted `--ink2`.
- Figures (phone numbers, prices, licence numbers, dates): `--mono`, `font-variant-numeric:tabular-nums lining-nums`.
- Buttons: one family — Poppins 600 13px uppercase .12em, padding 14px 26px, 44px tall.
  Stamp (navy) · outlined (navy on light / white on navy) · action (terracotta).
- Section rhythm: 80px desktop / 48px phone between sections; no empty bands; no more than
  120px between the last content and the footer.

**Mechanics**
- Every page already loads `/restyle/site.css` last (see `restyle/inject.py`). `site.css` loads
  one partial per page type: base, chrome, home, services, articles, forms — in that order, so a
  later partial wins a tie. Shared things live in `base.css`; a partial only holds what is
  particular to its pages. Do not edit `tokens.css` or any `.html`. If markup genuinely must
  change, write the exact request into `restyle/NEEDS-MARKUP.md` (append, one bullet, file:line)
  and style around it.
- The markup is a frozen static export of a page-builder site. Specificity in its own
  stylesheets is high and there is per-page CSS under `wp-content/uploads/…/css/` addressing
  blocks by data-id: `.elementor-<page> .elementor-element.elementor-element-<id>`. Match it
  with equally specific selectors, or anchor shared rules on `main#main` (an id out-ranks any
  class chain); use `!important` only where a value is written inline in the markup or the
  original itself uses it.
- Prefer structural selectors that hold across pages (`.elementor-widget-button .elementor-button`,
  `.elementor-widget-heading .elementor-heading-title`, `header#header`, `footer#footer`,
  a section `:has(h1)`) over per-id ones. Per-id is fine when a page-type template (all service
  pages share one) needs it — check it holds on 2–3 pages of the type.
- Fonts: the original Montserrat / Lexend Deca / Roboto come from `--alpha-*` and `--e-global-*`
  variables; re-pointing those variables on `html`/`:root` in `base.css` is the cheapest win.
- Don't hide content. Don't change copy. Don't change URLs. Keep all three breakpoints working
  (≤767 phone, 768–1024 tablet, >1024 desktop).
- Keep every text/background pair ≥ 4.5:1. `--bg300` on navy is for micro labels and small
  straps, not body text, and only reaches 3.6:1 on `--navy600` (use `--bg100` there). `--ink3`
  on `--cream050` passes; `--ink3` on `--cream` and `--bg` (#658398) on cream do not.

**Preview and screenshots**
- Server: `http://127.0.0.1:8810/` serves the repo root (python http.server; directories serve
  `index.html`). If it is not up: `python3 -m http.server 8810 --bind 127.0.0.1 --directory <repo>`
  in the background.
- Screenshot: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --no-sandbox --user-data-dir=/tmp/cd-shots --hide-scrollbars --virtual-time-budget=6000 --window-size=1440,3200 --screenshot=/tmp/x.png http://127.0.0.1:8810/<path>/`
  then Read the PNG. Iterate until it looks like the quote. A fresh `--user-data-dir` avoids a
  stuck instance; if Chrome hangs, kill any leftover `--headless=new` processes first.
- Phone: Chrome clamps `--window-size=375` to 500px, so check phone layouts at a true 375
  viewport (a browser pane at the mobile preset, or the page inside a 375px `<iframe>`).
- The page uses lazy loading and JS; `--virtual-time-budget=5000` helps images land.

**Done means:** the partial is written, every page listed for it was screenshotted at desktop and
phone, the text is readable and nothing overlaps or is hidden, and the final message lists
the pages checked, what changed, and anything that could not be solved in CSS.
