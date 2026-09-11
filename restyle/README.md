# restyle/ — the option-L look for coastaldemolitions.com

**What this is.** A CSS-only layer that makes the frozen static export of the site look like
the quote / tax-invoice pair Dan signed off (option L, "Photo band"): navy band with a
diagonal cut, Poppins display / Open Sans body / IBM Plex Mono figures, cream and navy, one
terracotta action per page, no rounded corners, ruled tables, wordmark only. Nothing in the
HTML changes; every page loads `/restyle/site.css` last and it wins the cascade.

Preview only. Never push. Never touch `vercel.json`, `api/`, `robots.txt`, `sitemap*.xml`
or anything under `wp-content/`.

```
restyle/
├── site.css          loads tokens.css then the six partials, in this order
├── tokens.css        the palette, type and geometry variables — the ONLY place a hex lives
├── parts/
│   ├── base.css      the shared system: heading scale, micro label, links, button family,
│   │                 lists, tables, quote, captions, card shell, page banner, reviews embed
│   ├── chrome.css    header band, desktop nav, mobile menu, footer bar, call-now bar, cookie bar
│   ├── home.css      the home page
│   ├── services.css  service, location, about, testimonials and capability pages
│   ├── articles.css  guide articles, blog band + post cards, projects hub, project pages
│   └── forms.css     enquiry form, contact page, thank-you page, 404
├── fonts/  img/      Poppins, Open Sans, Plex Mono; the white and navy wordmarks
├── inject.py         adds the <link> to every page and swaps the retired logo (idempotent)
├── BRIEF.md          the design brief the partials were written to
└── NEEDS-MARKUP.md   what CSS cannot reach — one bullet per markup change, with file:line
```

## The page anatomy

Selectors have to match the class names the export already carries, so anchors below are
given as the markup's own `data-id` (`.elementor-element-<id>`) or class. Every human-facing
name is the plain one.

| Part | Plain name | Pages | Anchor selector | Owner |
|---|---|---|---|---|
| Header band | navy band, diagonal bottom cut, white wordmark, nav, outlined phone stamp | every page | `header#header` · desktop `.elementor-element-d2ba379` · phone `.elementor-element-bd0b44f` | chrome.css |
| Mobile menu | full-screen navy panel, 24px Poppins links, 44px rows | every page ≤1199px | `header#header .flyout-menu-container` | chrome.css |
| Footer bar | navy, wordmark, link column, contact list, outlined "Get in touch", socials, bottom rule | every page | `footer#footer` · `.elementor-element-47e8c2a0` · bottom row `.elementor-element-4fe9974` | chrome.css |
| Call-now bar | fixed navy bar on phones | phones | `#callnowbutton` | chrome.css |
| Hero (cover) | photo, then a navy panel with a diagonal top edge, H1, reviews badge, terracotta "Get a quote" | home | `body.home .elementor-element-2095093` | home.css |
| Page banner | photo, navy panel with the same diagonal top edge, micro-label eyebrow, white H1 left on the 1200px column | services, locations, about, testimonials, contact, thank-you, projects hub, six project pages | `main#main .elementor-top-section:has(h1.elementor-heading-title)` on the page ids listed in base.css §13 | base.css (eyebrow words per page type: services / forms / articles) |
| Blog band | navy band under the header with the eyebrow, page title and search | blog, category, date, author archives | `.elementor-element-28ec687` | articles.css |
| Intro | section heading (rule above) + lead paragraph | home, services | home `.elementor-element-ddac4b3`; services: first light section | home.css / services.css |
| Section heading | h2 26–34px, 1px line rule above, 24px of air | every page | `main#main … h2` (base.css §3) | base.css |
| Micro label | Poppins 600 12px .12em uppercase, ink2 on light / bg300 on navy | eyebrows, dates, categories, captions, table heads, form labels | `.micro` and the list in base.css §4 | base.css |
| Service cards | photo, eyebrow, 20px title, 15px body, navy "Learn more" stamp, notched shell | home, testimonials | `.service-card` | base.css §10/§12 (layout), home.css (section) |
| Feature cards | team / service cards on service pages, notched shell | services, about | `.image-box`, `.elementor-icon-box-wrapper` | services.css §7 |
| Post cards | photo, date · category, title, excerpt, "Read more" | blog + archives | `main#main article.post` | articles.css §2 |
| Related-post cards | the 2-up slider under a guide, skinned as cards | guides | `.alpha-posts-grid .alpha-tb-item` | articles.css §1 |
| Thank-you card | the contact block as a notched card | thank-you | `.elementor-element-7948902` | forms.css §3 |
| Navy CTA band | navy band, white type, outlined buttons | home, services | home `.elementor-element-6900294` / `6172686`; services: the D list in services.css | home.css / services.css §8 |
| Reviews | the Google reviews embed, squared, ruled header strip | home, testimonials, about | `.ti-widget` | base.css §14 |
| FAQ accordion | ruled rows with a + / − sign | services | `.elementor-toggle`, `.elementor-accordion` | services.css §6 |
| Guide article | featured photo, meta micro label, title block (navy rule below), 68ch column | guides | `body.single-post .elementor-element-dfc2f5f` | articles.css §1 |
| Project collage | full-bleed grid of navy-captioned tiles | projects hub | `body.page-id-8784 .image-box` | articles.css §3 |
| Photo gallery | square tiles, 8px gaps | project pages | `ul.image-gallery` | articles.css §4 |
| Contact block | eyebrow + section heading, label \| value contact table, ruled map | contact, thank-you | `.elementor-element-5856944`, `.elementor-element-400884d`, `.elementor-element-d92b662` | forms.css §2 |
| Enquiry form | micro-label field labels, 1px line fields, terracotta submit | contact, thank-you | `.wpforms-form` | forms.css §1 |
| 404 | band, mono "404", navy stamp, footer bar | 404.html | `body:has(> main > h1 + #rescue)` | forms.css §4 |
| Buttons | stamp (navy) · outlined (navy on light / white on navy) · action (terracotta, one per page) | every page | `.elementor-button`, `.btn`, `.wpforms-submit`, `.is-secondary`, `.is-primary` | base.css §7 |
| Lists · tables · quote · captions | 6px navy square marker · ruled table with cream050 head row · 3px navy quote on cream050 · micro-label captions | every page | base.css §9 | base.css |

The one terracotta action per page: the hero "Get a quote" on the home page, the form submit
on the contact pages, "Get a quote" (the button that links to `/contact-us/`) on the project,
service, location and about pages, "Discuss your project" on the capability statement. A
`/contact-us/` button that sits inside a navy band is outlined white instead, so a page never
carries two. Service pages whose only such button is in a navy band carry none — that is
deliberate.

Two long selector prefixes in `services.css` and `base.css` §13 are written out in full
(the 27 service-type page ids, the 36 page + navy-section pairs, and the banner page list).
If you edit by hand, expand them from the lists in the file headers with a search-and-replace.

## Running the preview

```
cd <repo>
python3 -m http.server 8810 --bind 127.0.0.1 --directory .
open http://127.0.0.1:8810/
```

Desktop screenshot:

```
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu \
  --no-sandbox --user-data-dir=/tmp/cd-shots --hide-scrollbars --virtual-time-budget=6000 \
  --window-size=1440,3200 --screenshot=/tmp/x.png http://127.0.0.1:8810/services/demolition/
```

A phone screenshot needs a true 375px viewport: `--window-size=375` is clamped to 500px by
Chrome, so either use a browser pane at a mobile preset or wrap the page in a 375px-wide
`<iframe>` in a scratch HTML file and screenshot that. Check `document.documentElement.scrollWidth`
is 375.

## Re-injecting after pulling new HTML

`site.css` is linked from every page by `inject.py`. After a fresh export or a pull that
touches HTML:

```
python3 restyle/inject.py --dry-run   # counts what would change
python3 restyle/inject.py             # adds the <link> before </head>, swaps the retired logo
```

It is idempotent: pages that already carry the link are left alone.

## What still needs markup

CSS can restyle but cannot add, move or delete content. Everything that needs a markup
change — the footer's ABN / entity line, the banner eyebrows as real text, the blog cards'
"0 Like Post" noise, the header strap, the 404's wordmark for screen readers — is listed
one bullet per item with a file:line anchor in **NEEDS-MARKUP.md**.
