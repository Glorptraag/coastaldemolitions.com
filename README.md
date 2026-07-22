# coastaldemolitions.com — static site

Full static clone of the Coastal Demolitions website, migrated off managed
WordPress (WP Engine) and hosted free on **GitHub Pages**.

## What this is

- All 91 pages (home, services, projects, 47 blog posts, location landing
  pages) captured from the live WordPress site on 23 Jul 2026.
- Every image, video, stylesheet, script and font the site serves —
  including lazy-loaded images and Google Fonts, which are now self-hosted
  (`/wp-content/fonts/`). Zero runtime dependency on WP Engine or Google's
  font CDN.
- Yoast sitemaps, robots.txt, RSS feed snapshot, canonical/OG tags and
  JSON-LD schema preserved for SEO.
- The full WordPress content export (pages/posts/media JSON via REST API)
  and all 371 original full-resolution media files are attached to the
  **wordpress-backup** GitHub Release on this repo.

## What changed vs WordPress

| Thing | Before | Now |
|---|---|---|
| Hosting | WP Engine (~$100/mo) | GitHub Pages ($0) |
| Contact / quote form | WPForms (PHP) | Same form UI, posts to [FormSubmit](https://formsubmit.co) → admin@coastaldemolitions.com, then redirects to `/contact-us-ty/` |
| reCAPTCHA | v3, verified by WordPress | Removed (no server to verify); honeypot field added |
| Google Fonts | fonts.googleapis.com | Self-hosted in `/wp-content/fonts/` |
| Blog/admin | wp-admin | Static — edit HTML here, or rebuild pages from the content JSON in the backup release |

Still working unchanged: Trustindex Google-reviews widget, Call Now Button,
Google Tag Manager, Facebook pixel, Bing/Google ads tags (all third-party JS).

## ⚠️ One-time setup after deploy

1. **FormSubmit activation** — the first submission to the contact form
   emails admin@coastaldemolitions.com an activation link. Click it once and
   all later submissions flow normally. Test the form after DNS cutover.

## DNS cutover (when ready to leave WP Engine)

At your DNS provider (Cloudflare):

1. Replace the site `A`/`CNAME` records for `coastaldemolitions.com` with
   GitHub Pages' A records:
   `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   (and `AAAA`: `2606:50c0:8000::153`, `2606:50c0:8001::153`,
   `2606:50c0:8002::153`, `2606:50c0:8003::153`)
2. Point `www` → `glorptraag.github.io` (CNAME).
3. In this repo: Settings → Pages → confirm custom domain
   `coastaldemolitions.com` shows verified, then tick **Enforce HTTPS**
   (available once the certificate provisions, usually < 1 hour).
4. If Cloudflare proxying (orange cloud) is on, set SSL mode to **Full** —
   or just set the records to DNS-only.
5. Confirm the site loads on the domain, then cancel WP Engine.
   Before cancelling, download a final full backup ZIP from the WP Engine
   portal (database + PHP) for the archive.

## Deploys

Push to `main` → GitHub Pages redeploys automatically (~1 min).
