// TASK 3 — server-side port of the client-side 404 rescuer.
//
// Deploy target in the SITE repo: api/rescue.js  (Vercel Node.js serverless function).
// Reached only via the catch-all rewrite in vercel-mixedcase-rescue.json, which on Vercel
// runs AFTER the filesystem check — so this is invoked only for requests that would 404.
//
// It is a faithful port of the logic already shipped in 404.html at commit a4ee593:
//   1. exact match ignoring case   -> the WP Engine mixed-case behaviour (/Services/Demolition/)
//   2. same trailing slug anywhere -> old dated permalinks (/2024/05/12/post-slug/)
//   3. decisive token overlap      -> near-miss slugs, high bar on purpose
// The difference is that here each hit is a REAL 301 with a Location header, so Google
// consolidates the signal instead of merely following a client-side location.replace().
//
// NOTE: this file is written by the SEO track as a drop-in for the Vercel track. It has NOT
// been executed or deployed. Test it on a preview deployment before cutover.

import fs from 'node:fs';
import path from 'node:path';
import URL_INDEX from '../src/url-index.js';

function index() { return URL_INDEX; }

function slugOf(p) {
  const parts = p.replace(/\/+$/, '').split('/');
  return parts[parts.length - 1] || '';
}

function tokens(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean);
}

function normalise(p) {
  let req = decodeURIComponent(p).toLowerCase();
  req = req.replace(/\/(amp|feed)\/?$/, '/')   // AMP and feed suffixes
           .replace(/\.(html?|php)$/, '/')     // /page.html, /page.php
           .replace(/\/{2,}/g, '/');           // doubled slashes
  if (!req.startsWith('/')) req = '/' + req;
  if (!/\/$/.test(req)) req += '/';
  return req;
}

// Rebuild the original query string, minus the `p` param the rewrite injected.
function query(req) {
  const u = new URL(req.url, 'https://coastaldemolitions.com');
  u.searchParams.delete('p');
  const q = u.searchParams.toString();
  return q ? '?' + q : '';
}

function resolve(rawPath) {
  const list = index();
  if (!list.length) return null;
  const want = normalise(rawPath);

  // 1. exact match ignoring case.
  // The no-op guard must compare against the ORIGINAL path, not the normalised one:
  // comparing against `want` made every successful case-match look like a request that
  // was already correct, so the rescuer returned null and the URL 404'd.
  for (const u of list) {
    if (u.toLowerCase() === want) return u === rawPath ? null : { to: u, how: 'case' };
  }

  // 2. same last slug somewhere else in the tree
  const want2 = slugOf(want);
  if (want2) {
    for (const u of list) {
      if (slugOf(u).toLowerCase() === want2) return { to: u, how: 'slug' };
    }
  }

  // 3. best token overlap, but only when decisive. A wrong guess is worse than an honest 404.
  const wt = tokens(want2);
  if (wt.length >= 2) {
    let best = null, bestScore = 0;
    for (const u of list) {
      const ct = tokens(slugOf(u));
      if (!ct.length) continue;
      let hit = 0;
      for (const w of wt) if (ct.indexOf(w) !== -1) hit++;
      const score = hit / Math.max(wt.length, ct.length);
      if (score > bestScore) { bestScore = score; best = u; }
    }
    if (best && bestScore >= 0.75) return { to: best, how: 'fuzzy' };
  }
  return null;
}

export default (req, res) => {
  const raw = '/' + String((req.query && req.query.p) || '').replace(/^\/+/, '');
  const hit = resolve(raw);

  if (hit) {
    res.setHeader('Location', hit.to + query(req));
    res.setHeader('x-rescue', hit.how);
    // Cache the 301 at the edge so repeat crawls do not re-invoke the function.
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=86400');
    res.statusCode = 301;
    return res.end();
  }

  // Honest 404. Serve the existing 404.html body if it made it into the bundle.
  let body = null;
  for (const p of ['404.html', '../404.html']) {
    try { body = fs.readFileSync(path.join(process.cwd(), p), 'utf8'); break; } catch (e) { /* next */ }
  }
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300');
  res.end(body || '<!doctype html><meta charset="utf-8"><title>Page not found &ndash; Coastal Demolitions</title>' +
    '<h1>404</h1><p>We can’t find that page.</p>' +
    '<p><a href="/">Back to Coastal Demolitions home</a> &middot; <a href="/services/">Our services</a> &middot; ' +
    '<a href="/contact-us/">Contact us</a></p><p><a href="tel:0438277589">Call 0438 277 589</a></p>');
};
