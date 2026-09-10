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
  (`polygon(0 14mm,100% 0,100% 100%,0 100%)`) — this is the hero treatment.
- *Micro label*: Poppins 600, 12px, `.12em` tracking, uppercase, `--ink2`.
- *Ruled table*: `.5pt`→1px `--line` borders, header cells `--cream050` with micro-label type in navy.
- *Grand total rule*: 1px `--navy` top border and Poppins 600 for the important row.
- *Card notch*: `clip-path:polygon(0 0,100% 0,100% 100%,16px 100%,0 calc(100% - 16px))` with a 1px `--line` border.
- *Due / action*: `--terra`, Poppins 600. **One terracotta action per view.**
- Photos sit full-bleed with `object-fit:cover`; text on navy is `--white` / `--bg100` / `--bg300`.
- Headings: Poppins 600, `letter-spacing:-0.01em`, `line-height:1.15`; H1 on the cover at 40pt → ~clamp(36px,5vw,64px).
- Body: Open Sans 400, 16–17px, line-height 1.55, colour `--ink`; muted `--ink2`.
- Figures (phone numbers, prices, licence numbers, dates): `--mono`, `font-variant-numeric:tabular-nums lining-nums`.

**Mechanics**
- Every page already loads `/restyle/site.css` last (see `restyle/inject.py`). `site.css` @imports one
  partial per owner. **Edit only your partial** in `restyle/parts/`. Do not edit `site.css`,
  `tokens.css`, or any `.html`. If markup genuinely must change, write the exact request into
  `restyle/NEEDS-MARKUP.md` (append, one bullet, file:line) and style around it.
- The markup is Elementor + u-design. Specificity is high and there is per-page CSS in
  `wp-content/uploads/elementor/css/post-*.css` using `.elementor-<id> .elementor-element.elementor-element-<hash>`.
  Match it with equally specific selectors or `body .elementor-widget-…` chains; use `!important`
  only where the theme itself uses it or sets the value inline.
- Prefer structural selectors that hold across pages (`.elementor-widget-button .elementor-button`,
  `.elementor-widget-heading .elementor-heading-title`, `header#header`, `footer#footer`,
  `.elementor-section` with `data-settings` backgrounds) over per-hash ones. Per-hash is fine when
  a page-type template (all service pages share a template) needs it — check it holds on 2–3 pages
  of the type.
- Fonts: the theme's Montserrat / Lexend Deca / Roboto come from `--alpha-*` and `--e-global-*`
  variables; overriding those variables on `html`/`:root` in `base.css` is the cheapest win.
- Don't hide content. Don't change copy. Don't change URLs. Keep all three responsive
  breakpoints working (Elementor: ≤767 phone, 768–1024 tablet, >1024 desktop).
- Keep every text/background pair ≥ 4.5:1. `--bg300` on navy is for decoration and small
  straps, not body text. `--ink3` on cream passes; `--bg` (#658398) on cream does not for text.

**Preview and screenshots**
- Server: `http://127.0.0.1:8810/` serves the repo root (python http.server; directories serve
  `index.html`). If it is not up: `python3 -m http.server 8810 --bind 127.0.0.1 --directory <repo>`
  in the background.
- Screenshot: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --window-size=1440,2400 --screenshot=/tmp/x.png http://127.0.0.1:8810/<path>/`
  and `--window-size=390,2400` for phone. Then Read the PNG. Iterate until it looks like the quote.
- The page uses lazy loading and JS; `--virtual-time-budget=5000` helps images land.

**Done means:** your partial is written, you screenshotted every page listed for you at desktop and
phone, checked the text is readable and nothing overlaps or is hidden, and your final message lists
the pages checked, what you changed, and anything you could not solve in CSS.
