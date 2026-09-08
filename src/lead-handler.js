/**
 * Lead intake for coastaldemolitions.com.
 *
 * Ported from the Cloudflare Worker (Coastal media repo, commit acaec8f9,
 * `lead-form-worker/src/worker.js`) to a Vercel Function. The logic below is
 * deliberately unchanged from the Worker: it is hard-won and every branch is
 * covered by test.mjs. The only differences from the Worker are noted inline
 * and are all about the host platform, never about behaviour:
 *
 *   1. `env` is passed in rather than handed to us by the runtime, so this file
 *      stays a pure function of (request, env) and the tests can drive it
 *      directly. `api/lead.js` is the thin Vercel adapter that supplies
 *      `process.env`.
 *   2. Visitor country comes from `x-vercel-ip-country` on Vercel; the Worker
 *      read `cf-ipcountry`. Both are read, so this behaves identically wherever
 *      it runs and the ported tests keep passing.
 *
 * Why any of this exists: the site is static, so the contact form needs
 * somewhere to POST. This replaces FormSubmit, which 500s on the form's
 * bracket-named WPForms fields and — worse — sends from formsubmit.co with no
 * SPF/DKIM alignment to our domain, so Gmail filed every notification as spam.
 * Mail goes out through Resend from a verified coastaldemolitions.com
 * SUBDOMAIN, which is what keeps it out of the spam folder.
 */

const FIELDS = ['Name', 'Phone', 'Email', 'Seeking quote for', 'Message'];
const REQUIRED = ['Name', 'Phone', 'Email'];

/* Click ids and campaign tags the site's attribution script attaches to the form.
 * gclid is the one that matters: it is what an offline conversion import needs to
 * tell Google Ads that this lead became a job, and which keyword paid for it. */
const ATTRIBUTION = [
  'gclid', 'gbraid', 'wbraid', 'msclkid', 'fbclid',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'landing_page', 'attribution_referrer', 'attribution_first_seen', 'page_href',
];

export default {
  async fetch(request, env) {
    if (request.method === 'GET') {
      // Nothing to serve here; send stray visitors to the site.
      return Response.redirect(env.SITE_ORIGIN, 302);
    }
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    let form;
    try {
      // formData() handles both urlencoded and multipart, so it does not
      // matter which enctype the form ends up carrying.
      form = await request.formData();
    } catch {
      return problem(env, 'We could not read that submission.');
    }

    // Honeypot: a real person never fills a hidden field. Accept and drop, so
    // the bot sees success and does not retry.
    if ((form.get('_honey') || '').trim() !== '') {
      return seeOther(thankYouUrl(env, form));
    }

    const values = {};
    for (const name of FIELDS) values[name] = (form.get(name) || '').trim();

    const attribution = {};
    for (const name of ATTRIBUTION) {
      const v = (form.get(name) || '').trim();
      if (v) attribution[name] = v;
    }

    const missing = REQUIRED.filter((name) => !values[name]);
    if (missing.length) {
      return problem(env, `Please fill in: ${missing.join(', ')}.`);
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.Email)) {
      return problem(env, 'That email address does not look right.');
    }

    const sourcePage = (form.get('page_url') || '').trim() || '/contact-us/';
    const recipients = [env.LEAD_TO_EMAIL];
    // A second recipient means an outage on one mailbox never costs a lead.
    if (env.LEAD_BACKUP_EMAIL) recipients.push(env.LEAD_BACKUP_EMAIL);

    /* Persist before notifying. An email that fails is a lead nobody ever sees;
     * a board row that exists can be worked from even if every notification
     * bounces. The two run in parallel because the visitor is waiting, but the
     * result of both decides what we tell them. */
    const [stored, sent] = await Promise.all([
      storeInMonday(env, values, attribution, sourcePage),
      sendViaResend(env, {
        recipients,
        replyTo: values.Email,
        subject: `Website enquiry — ${values.Name}${
          values['Seeking quote for'] ? ` — ${values['Seeking quote for']}` : ''
        }`,
        html: buildHtml(values, sourcePage, request, attribution),
        text: buildText(values, sourcePage, attribution),
      }),
    ]);

    if (!stored.ok) {
      console.error('monday_failed', stored.status, stored.body, JSON.stringify({ ...values, ...attribution }));
    }
    if (!sent.ok) {
      console.error('resend_failed', sent.status, sent.body, JSON.stringify({ ...values, ...attribution }));
    }

    if (!stored.ok && !sent.ok) {
      // Both durable paths are down. Never pretend this worked: the visitor is
      // told to phone, and the full enquiry is in the log so it can be recovered.
      console.error('lead_unrecorded', JSON.stringify({ ...values, ...attribution }));
      return problem(
        env,
        'Sorry — we could not send that just now. Please call us on 0438 277 589 and we will pick it up straight away.',
        502
      );
    }

    return seeOther(thankYouUrl(env, form));
  },
};

/**
 * monday's phone column rejects anything that is not bare digits. It returned
 * ColumnValueException for "0400 000 000" — which is exactly how an Australian
 * writes a mobile — and because create_item is a single mutation, the rejected
 * phone took the whole lead row down with it. The stubbed tests never caught
 * this: the stub accepted any payload.
 *
 * Normalise to E.164 digits, and return null for anything that cannot be
 * confidently normalised. Dropping one field is far better than losing the row.
 */
function mondayPhone(raw) {
  if (!raw) return null;
  let d = String(raw).replace(/[^0-9+]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  if (d.startsWith('0')) d = '61' + d.slice(1);                 // 0400... -> 61400...
  else if (!d.startsWith('61') && d.length <= 9) d = '61' + d;  // bare 400...
  if (d.length < 10 || d.length > 15) return null;
  return { phone: d, countryShortName: 'AU' };
}

/**
 * Write the lead to the monday board before anyone is notified.
 *
 * The board is the queue somebody actually works from, so a row there is the
 * lead surviving. Configured off — MONDAY_BOARD_ID unset — it reports ok:false
 * with a reason, which keeps the "both paths failed" test honest rather than
 * silently counting a disabled integration as a success.
 *
 * Column ids verified against board 5031082195 ("Email Lead Register") on
 * 8 Sep 2026: email_mm6v66h0 Email, phone_mm6vxajq Phone,
 * long_text_mm6v76k5 Message, text_mm6v9srm Lead Source,
 * date_mm6vmvvn Date Submitted.
 */
async function storeInMonday(env, values, attribution, sourcePage) {
  if (!env.MONDAY_BOARD_ID || !env.MONDAY_API_TOKEN) {
    return { ok: false, status: 0, body: 'monday not configured' };
  }

  const columns = {};
  const set = (id, value) => { if (id && value) columns[id] = value; };

  set(env.MONDAY_COL_EMAIL, values.Email ? { email: values.Email, text: values.Email } : null);
  set(env.MONDAY_COL_PHONE, mondayPhone(values.Phone));
  set(env.MONDAY_COL_MESSAGE, values.Message);
  set(env.MONDAY_COL_SOURCE, attributionLine(attribution) || 'website (no click id)');
  if (env.MONDAY_COL_DATE) {
    columns[env.MONDAY_COL_DATE] = { date: new Date().toISOString().slice(0, 10) };
  }

  const query = `mutation ($board: ID!, $name: String!, $vals: JSON!) {
    create_item (board_id: $board, item_name: $name, column_values: $vals,
                 create_labels_if_missing: true) { id }
  }`;
  const variables = {
    board: String(env.MONDAY_BOARD_ID),
    name: values.Name || 'Website enquiry',
    vals: JSON.stringify(columns),
  };

  let response;
  try {
    response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        Authorization: env.MONDAY_API_TOKEN,
        'Content-Type': 'application/json',
        'API-Version': '2024-10',
      },
      body: JSON.stringify({ query, variables }),
    });
  } catch (err) {
    return { ok: false, status: 0, body: String(err) };
  }

  const body = await response.text();
  // monday answers 200 with an "errors" array on a bad mutation, so the status
  // code alone is not enough to call this a success.
  if (!response.ok || body.includes('"errors"')) {
    return { ok: false, status: response.status, body };
  }
  return { ok: true, status: response.status, body };
}

/** One-line "gclid=… utm_source=…" summary, for the board and the email. */
function attributionLine(attribution) {
  return Object.keys(attribution)
    .filter((k) => !['landing_page', 'attribution_referrer', 'attribution_first_seen', 'page_href'].includes(k))
    .map((k) => `${k}=${attribution[k]}`)
    .join(' ');
}

async function sendViaResend(env, { recipients, replyTo, subject, html, text }) {
  let response;
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.LEAD_FROM_EMAIL,
        to: recipients,
        reply_to: replyTo,
        subject,
        html,
        text,
      }),
    });
  } catch (err) {
    return { ok: false, status: 0, body: String(err) };
  }
  if (!response.ok) {
    return { ok: false, status: response.status, body: await response.text() };
  }
  return { ok: true };
}

function buildHtml(values, sourcePage, request, attribution = {}) {
  const rows = FIELDS.filter((name) => values[name])
    .map(
      (name) =>
        `<tr><th align="left" style="padding:6px 12px 6px 0;vertical-align:top;white-space:nowrap">${escapeHtml(
          name
        )}</th><td style="padding:6px 0">${escapeHtml(values[name]).replace(
          /\n/g,
          '<br>'
        )}</td></tr>`
    )
    .join('');
  // Vercel sets x-vercel-ip-country; the Worker had cf-ipcountry. Read both so
  // behaviour is identical on either platform.
  const country =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    'unknown';
  const attrLine = attributionLine(attribution);
  const attrHtml = attrLine
    ? `<p style="margin:14px 0 0;font-size:12px;color:#666">Ad click: ${escapeHtml(attrLine)}</p>`
    : '<p style="margin:14px 0 0;font-size:12px;color:#666">No ad click id &mdash; organic, direct or referral.</p>';
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;color:#111">
<p style="margin:0 0 14px">New enquiry from the website.</p>
<table cellpadding="0" cellspacing="0">${rows}</table>
${attrHtml}
<p style="margin:18px 0 0;font-size:12px;color:#666">Page: ${escapeHtml(
    sourcePage
  )} &middot; Country: ${escapeHtml(country)} &middot; Reply goes straight back to the enquirer.</p>
</div>`;
}

function buildText(values, sourcePage, attribution = {}) {
  const lines = FIELDS.filter((name) => values[name]).map(
    (name) => `${name}: ${values[name]}`
  );
  lines.push('', `Page: ${sourcePage}`);
  const attrLine = attributionLine(attribution);
  lines.push(`Ad click: ${attrLine || 'none (organic, direct or referral)'}`);
  return `New enquiry from the website.\n\n${lines.join('\n')}\n`;
}

/**
 * Keep the redirect on our own origin — otherwise anyone could POST here with
 * their own _next and use the form as an open redirect.
 */
function thankYouUrl(env, form) {
  const fallback = `${env.SITE_ORIGIN}/contact-us-ty/`;
  const next = form.get('_next');
  if (!next) return fallback;
  try {
    const url = new URL(next, env.SITE_ORIGIN);
    return url.origin === new URL(env.SITE_ORIGIN).origin ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

function seeOther(location) {
  // 303 so the browser follows with GET and a refresh cannot resubmit.
  return new Response(null, { status: 303, headers: { Location: location } });
}

function problem(env, message, status = 400) {
  const html = `<!doctype html><meta charset="utf-8"><title>Enquiry not sent</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:34rem;margin:12vh auto;padding:0 1.25rem;color:#111">
<h1 style="font-size:1.35rem;margin:0 0 .6rem">We could not send that</h1>
<p style="margin:0 0 1.2rem;line-height:1.5">${escapeHtml(message)}</p>
<p style="margin:0"><a href="${env.SITE_ORIGIN}/contact-us/">Back to the contact form</a></p>
</div>`;
  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}
