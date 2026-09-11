# What still needs markup

CSS can restyle but cannot add, move or delete content. One bullet per change, with the
file and line to touch. Plain names throughout; the anchors are the markup's own data-ids.

## Header band and footer bar (every page)
- Header band, right side: the option-L strap "What you see is what you get" (Poppins 500,
  `--bg300`) has no element to hang on. Add a text block or `<span class="band-strap">` in the
  nav column (`elementor-element-e1c2330`) before the menu; chrome.css will style `.band-strap`.
- Header band: there is no call-to-action button in the desktop header; `elementor-element-c0085d0`
  is an empty HTML block. chrome.css uses the phone menu item (`li.menu-item-9002 > a`) as the
  outlined phone stamp. If Dan wants "Get a quote" as the header action, add a button block after
  the menu in column `e1c2330`.
- Footer bar: the bottom row (`elementor-element-4fe9974`) is empty. The option-L bar needs the
  entity line there: "Grunt Plant & Haulage Pty Ltd T/A Coastal Demolitions & Asbestos Removal ·
  ABN 72 650 242 158 · © 2026". chrome.css already draws the 1px `--navy600` rule on that row and
  styles any text inside it at 12px `--bg300`; wrap the ABN in `<span class="num">` for Plex Mono.
- Header/footer wordmark `<img>` (`wp-image-10975`, `width="482" height="209"`; the phone copy
  carries inline `style="padding-top:43.36%"`): chrome.css swaps the src to the white wordmark
  with `content:url()` and neutralises the padding with `!important`. Cleaner: point the img's
  `data-lazy` at `/restyle/img/logo-wordmark-white.png`, set `width="501" height="168"`, and drop
  the inline padding.
- Footer social icons carry an inline `<style>` (`.elementor-social-icon{background:#fff!important}`);
  chrome.css out-stamps it. Drop the inline style when the footer is next touched.

## Page banner (services, locations, about, contact, projects)
- Every banner (e.g. `services/demolition/index.html` section `023614a`,
  `brisbane-demolitions/index.html` section `642f041`, `contact-us/index.html` section `1c83244`,
  `projects/index.html` section `3462a715`) has only the `<h1>`; there is no eyebrow element, so
  base.css §13 draws it with `h1::before{content:…}` ("Services" / "Service areas" / "About us" /
  "Reviews" / "Contact" / "Projects" / "Project" by page). Generated text is invisible to assistive
  tech; if the eyebrow should be real, add `<p class="page-subtitle">Services</p>` before the H1
  in each banner column and drop the `::before` rules (base.css §13, services.css §2, forms.css §2,
  articles.css §3–4).
- `services/asbestos-removal/index.html` section `cce806c` (and the other `cce806c` / `6349c27` /
  `d81f768` banners) carries an animated "scroll" mouse cue as an HTML block
  (`<div class="container_mouse">`). It has no place on the navy band, so base.css hides it
  (`display:none`); remove the block if the preview is approved.
- `27-avanti-street-mermaid-beach/index.html` hero section `48d699e` has no `<h1>` (the other six
  project pages carry the address there), so it keeps a plain photo band and its intro heading
  `1df64e7` (an `<h2>`) is styled as the page title. Add the address as an `<h1>` heading block in
  the hero column and it joins the shared banner automatically.

## Home page
- `index.html:617-631` hero column `4af482b` carries only the H1 (`26649e0`), the reviews badge
  (`35e8187`) and the button (`8cab99f`). The option-L cover also has a Poppins 500 `--bg300` job
  line and a `--bg100` tag line under the title; there is no element for either, so home.css uses
  the badge as the second line. To match the quote cover add a text block (or
  `<p class="job">…</p><p class="tag">What you see is what you get</p>`) between `26649e0` and
  `35e8187`; home.css will pick up `.job` / `.tag` inside `4af482b`.
- `index.html:928-971` section `6900294` (navy "Exceptional Mitigation…" band) only has content
  inside inner section `9a7b600`, which is hidden on tablet and phone; its twin `6172686`
  (`index.html:901-927`) is hidden on desktop. Below 1024px `6900294` was an empty 120px navy
  band whose stretched container also ran 15px past the phone viewport (pre-existing). home.css
  zeroes its padding ≤1024 and pins the container, but the section is dead weight there — cleaner
  to move the hidden-* classes onto `6900294` itself and drop them from `9a7b600`.
- `index.html:988-991` the pull quote ("Professional, reliable and prompt…") is an
  `<h3 class="elementor-heading-title">` inside section `159a95c`. It is styled as the ruled quote
  row, but it is a testimonial, not a heading: wrap it as `<blockquote>` (or `<p>`) with a
  `<cite>` so the outline is not a fake H3 and the reviewer can be credited.
- `index.html:1012-1014` reviews embed `20b56fae` renders the third-party slider layout
  (`data-layout-id="14"`) from cdn.trustindex.io, whose sheet rounds and colours the cards with
  `!important` at (0,5,0). base.css §14 out-specifies it (`.ti-widget[data-layout-id] …`), which is
  brittle: if the embed's layout or class names change the squaring silently drops. A markup-free
  hardening is to switch the embed to its "no-style/inherit" preset in the Trustindex admin.

## Service, location and about pages
- `services/asbestos-removal/index.html` section `e0dc431` and `about-us/index.html` sections
  `a0e0f8a` / `9bd1e60` put body paragraphs inside a heading block
  (`<p class="title elementor-heading-title">…<br><br><b>1. Initial Consultation</b>…`).
  services.css restyles `p.title` as body copy, but the numbered process steps are one paragraph
  with `<br><br>` breaks; they should be an `<ol>` (or separate `<p>`s) in a text block so the
  square-marker list styling applies.
- `asbestos-removal-brisbane/index.html` (and the other 2025 location pages) write link colour
  inline — `<a style="color: #0000ff;">` and `<span style="color: #0000ff;">` around links — and
  `services/earthworks/index.html` section `d465785` writes `<p style="text-align: center;">`.
  base.css / services.css override both with `!important` (inline values); strip the inline
  styles when the markup is next touched.
- The same section data-id means different things on different pages (`e0dc431` is the navy
  process band on `services/asbestos-removal/` but a light grey band on `brisbane-demolitions/`),
  so the navy-band text rules in services.css are enumerated per page-id + section (36 pairs,
  generated from the per-page stylesheets). Any new page that reuses an id on a dark background
  needs adding to that list — or, cleaner, give dark sections a shared class (`on-navy`, which
  base.css already understands).
- Every guide carries an inline `<style>` forcing the old blue on article links
  (`.blog-article-content a{color:#27276f!important}`); base.css out-stamps it. Drop the inline
  style block from the guide template.
- `capability-statement/index.html` (page 11219) is a single hand-written HTML block with its own
  inline stylesheet (108 `!important` declarations, Montserrat / Roboto, a blue accent).
  services.css §9 out-stamps the type, colours, contrast and buttons, but the page still carries
  three "urgency" devices (a strip, a tag in the hero, a tag in the closing band) that the brief's
  one-action rule reduces to outlined labels — a copy decision, not CSS. Its blue-bordered round
  leader photos (`.cap-leader-photo`, `border-radius:50%`) are squared by CSS.

- `about-us/index.html` team cards (section `a6ab160`, image boxes `c219c0c` and siblings): every card
  links to `https://d-themes.com/wordpress/udesign/main/services/` — the page-builder demo site, not
  a Coastal page. Point them at the right service pages or drop the `<a>`.
- `brisbane-demolitions/index.html` section `c597490` (and the same block on
  `asbestos-removal-brisbane/`) is a navy band holding only the third-party reviews embed; while
  the embed is loading (or blocked) it is an empty 190px navy band. CSS cannot tell an unloaded
  embed from a loaded one, so either move the embed into a light section or accept the band.
- `brisbane-demolitions/index.html` and `asbestos-removal-brisbane/index.html` section `c3f4373` is a
  section with one empty column and no blocks; base.css collapses it, but it should be deleted.

## Contact pages and the enquiry form
- `contact-us/index.html` contact list (`.elementor-element-400884d`, the
  `<ul class="elementor-icon-list-items">` near `13/48 Hutchinson St`) — the invoice reference
  block also carries ABN 72 650 242 158, the trading entity and office hours; there are no such
  items in the markup, so the label | value table stops at Phone / Email / Office. Add `<li>`
  rows for ABN and Hours (CSS labels them from the `:has()` rules in forms.css; a generic row gets
  the "Office" label, so a new row needs a distinguishing class or href).
- `contact-us-ty/index.html` — the thank-you card has no "Back to home" link to style as the
  navy outlined button (the only link is the header wordmark). Add
  `<a class="btn is-secondary" href="/">Back to home</a>` after the `elementor-element-5856944`
  heading block.
- `contact-us-ty/index.html` repeats the full enquiry form (`.elementor-element-7f18ada`) under
  the thank-you card; it is kept and styled as "Another enquiry". If a second submit is not
  wanted on the thank-you page, remove the block rather than hiding it.
- `contact-us-ty/index.html` contact list says "58 Kortum Dr, Burleigh Heads QLD 4220" while
  `contact-us/index.html` says "13/48 Hutchinson St, Burleigh Heads QLD 4220" (the invoice
  address). Copy question, not CSS.
- `404.html` line 12 (`h1{font-size:3rem…}`) — the page has no `<img>` wordmark and no footer
  block; forms.css paints `/restyle/img/logo-wordmark-white.png` as a background on `body::before`
  (the band) and on `p.tel` (the footer bar), so both are invisible to assistive tech, and the
  footer bar has no link column or contact list to show. If the brand should be announced, add
  `<img src="/restyle/img/logo-wordmark-white.png" alt="Coastal Demolitions">` inside a `<header>`
  before `<main>`; for a full footer, add a `<footer>` with the same links as the real one.

## Guides, blog and projects
- `projects/index.html:634` (and the other seven tiles, e.g. `:645`): each tile caption is one
  string in `<p class="content">` ("1289 Gympie Road Aspley — Commercial Demolition"). The navy
  caption panel wants a `--bg300` micro label for suburb / type above the Poppins title; split it
  into `<small>Aspley · Commercial</small>` + the address (articles.css already styles
  `.image-box .title` / `.image-box-content small`).
- `asbestos-bathroom-removal-guide/index.html:704` (same block in all 46 guides): "Related Posts"
  is a 2-up slider (`data-slider-options … slidesPerView:2`, `slider-wrapper`). CSS can only skin
  the slides as cards; a static three-card grid needs the wrapper's `slider-wrapper` class and
  `data-slider-options` removed and `cols-lg-2` → `cols-lg-3`.
- `asbestos-bathroom-removal-guide/index.html:641` (guide meta line, all guides): the date,
  the "/" separator and the category are three `<h2>` heading blocks; they are styled as a micro
  label, but they are not headings. Make them `<p>` (or a `<div>`) so the outline is honest. The
  brief also wanted "author · date · reading time" on the guide; author and reading time need
  adding to the template (author exists on the archive cards, not on the single).
- `blog/index.html` title block (`.elementor-element-efb0bbd`): the eyebrow "Blog" is an `<h1>`
  and the page title "Recent News" (`bc77c8f`) an `<h2>`. They read the other way round; swap the
  tags (or make the eyebrow a `<p>`).
- `blog/index.html:658` (every card, and the archives): `.post-meta` carries `0 Like Post` (a `#`
  vote link) and `Comments Off`. They are muted to 14px `--ink2`; they should be deleted, they are
  page noise, not content.
- `1289-gympie-road-aspley-commercial-demolition/index.html:615-628` and
  `8-kingfisher-court-burleigh-heads-residential-demolition/index.html` (same blocks): these two
  case studies are HTML blocks with inline `<style>` (Montserrat, a terracotta strip, 4–8px radii,
  drop shadows) and inline `style="color:#444"` on paragraphs. articles.css out-cascades them by
  order and uses `!important` on the inline-styled paragraphs; the clean fix is to drop those
  `<style>` blocks and inline attributes once the site CSS owns the look.

## Verification notes, not markup
- `Chrome --headless=new --window-size=390,…` lays out at Chrome's 500px minimum window width
  and crops the PNG, so every "phone" screenshot taken that way is a 500px layout. Check phone
  layouts at a true 375 viewport (a browser pane at the mobile preset, or the page inside a 375px
  `<iframe>`) before trusting a cut-off edge.
- Micro labels are 12px and button labels 13px by design (the brief's kicker and stamp sizes);
  the "no text under 14px on a phone" check is applied to everything else.
