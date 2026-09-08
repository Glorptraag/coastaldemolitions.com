/**
 * Exercises the Worker handler against a stubbed Resend, so the branches that
 * matter can be checked without deploying or sending real mail.
 *
 *   node test.mjs
 */
import worker from './src/lead-handler.js';

const ENV = {
  SITE_ORIGIN: 'https://coastaldemolitions.com',
  LEAD_FROM_EMAIL: 'Coastal Demolitions website <enquiries@send.coastaldemolitions.com>',
  LEAD_TO_EMAIL: 'admin@coastaldemolitions.com',
  LEAD_BACKUP_EMAIL: 'backup@example.com',
  RESEND_API_KEY: 'test-key',
};

let sent = [];
let resendStatus = 200;
let mondayItems = [];
let mondayMode = 'ok'; // 'ok' | 'graphql_error' | 'http_error'
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  if (String(url).startsWith('https://api.resend.com')) {
    sent.push(JSON.parse(init.body));
    return resendStatus === 200
      ? new Response('{"id":"stub"}', { status: 200 })
      : new Response('{"message":"nope"}', { status: resendStatus });
  }
  if (String(url).startsWith('https://api.monday.com')) {
    mondayItems.push(JSON.parse(init.body));
    if (mondayMode === 'http_error') return new Response('nope', { status: 500 });
    // monday answers 200 with an errors array on a bad mutation.
    if (mondayMode === 'graphql_error') {
      return new Response('{"errors":[{"message":"bad column"}]}', { status: 200 });
    }
    return new Response('{"data":{"create_item":{"id":"1"}}}', { status: 200 });
  }
  return realFetch(url, init);
};

const MONDAY_ENV = {
  ...ENV,
  MONDAY_API_TOKEN: 'test-monday-token',
  MONDAY_BOARD_ID: '5031082195',
  MONDAY_COL_EMAIL: 'email_mm6v66h0',
  MONDAY_COL_PHONE: 'phone_mm6vxajq',
  MONDAY_COL_MESSAGE: 'long_text_mm6v76k5',
  MONDAY_COL_SOURCE: 'text_mm6v9srm',
  MONDAY_COL_DATE: 'date_mm6vmvvn',
};

const FULL = {
  _next: 'https://coastaldemolitions.com/contact-us-ty/',
  _subject: 'New enquiry from coastaldemolitions.com',
  _template: 'table',
  _captcha: 'false',
  _honey: '',
  Name: 'Jane Roberts',
  Phone: '0400 000 000',
  Email: 'jane@example.com',
  'Seeking quote for': 'Residential Demolition',
  Message: 'Knockdown rebuild at Burleigh, need a quote.',
  page_title: 'Contact Us',
  page_url: '/contact-us/',
  page_id: '194',
};

function post(fields, { multipart = false } = {}) {
  const body = new (multipart ? FormData : URLSearchParams)();
  for (const [k, v] of Object.entries(fields)) body.append(k, v);
  return new Request('https://worker.example/', { method: 'POST', body });
}

let failures = 0;
async function check(label, fn) {
  sent = [];
  resendStatus = 200;
  mondayItems = [];
  mondayMode = 'ok';
  try {
    await fn();
    console.log(`  pass  ${label}`);
  } catch (err) {
    failures++;
    console.log(`  FAIL  ${label}\n        ${err.message}`);
  }
}
const eq = (got, want, what) => {
  if (got !== want) throw new Error(`${what}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
};

console.log('lead-form-vercel');

await check('urlencoded submission sends and redirects to the thank-you page', async () => {
  const res = await worker.fetch(post(FULL), ENV);
  eq(res.status, 303, 'status');
  eq(res.headers.get('Location'), 'https://coastaldemolitions.com/contact-us-ty/', 'redirect');
  eq(sent.length, 1, 'emails sent');
  eq(sent[0].reply_to, 'jane@example.com', 'reply_to');
  eq(sent[0].to.length, 2, 'recipient count');
  if (!sent[0].subject.includes('Jane Roberts')) throw new Error('subject lacks the name');
  if (!sent[0].text.includes('Knockdown rebuild')) throw new Error('body lacks the message');
});

await check('multipart submission works identically', async () => {
  const res = await worker.fetch(post(FULL, { multipart: true }), ENV);
  eq(res.status, 303, 'status');
  eq(sent.length, 1, 'emails sent');
});

await check('bracket-named WPForms fields do not break it', async () => {
  const res = await worker.fetch(
    post({ ...FULL, 'wpforms[id]': '283', 'wpforms[submit]': 'wpforms-submit' }),
    ENV
  );
  eq(res.status, 303, 'status');
  eq(sent.length, 1, 'emails sent');
});

await check('honeypot hit is dropped but looks successful', async () => {
  const res = await worker.fetch(post({ ...FULL, _honey: 'i am a bot' }), ENV);
  eq(res.status, 303, 'status');
  eq(sent.length, 0, 'emails sent');
});

await check('missing required field is rejected, nothing sent', async () => {
  const res = await worker.fetch(post({ ...FULL, Phone: '' }), ENV);
  eq(res.status, 400, 'status');
  eq(sent.length, 0, 'emails sent');
});

await check('malformed email is rejected', async () => {
  const res = await worker.fetch(post({ ...FULL, Email: 'not-an-email' }), ENV);
  eq(res.status, 400, 'status');
  eq(sent.length, 0, 'emails sent');
});

await check('offsite _next cannot turn this into an open redirect', async () => {
  const res = await worker.fetch(post({ ...FULL, _next: 'https://evil.example/steal' }), ENV);
  eq(res.headers.get('Location'), 'https://coastaldemolitions.com/contact-us-ty/', 'redirect');
});

await check('Resend failure tells the visitor instead of losing the lead', async () => {
  resendStatus = 500;
  const res = await worker.fetch(post(FULL), ENV);
  eq(res.status, 502, 'status');
  const html = await res.text();
  if (!html.includes('0438 277 589')) throw new Error('no phone fallback shown');
});

await check('no backup address configured means a single recipient', async () => {
  const res = await worker.fetch(post(FULL), { ...ENV, LEAD_BACKUP_EMAIL: '' });
  eq(res.status, 303, 'status');
  eq(sent[0].to.length, 1, 'recipient count');
});

await check('HTML in a field is escaped, not injected', async () => {
  await worker.fetch(post({ ...FULL, Name: '<script>alert(1)</script>' }), ENV);
  if (sent[0].html.includes('<script>')) throw new Error('unescaped HTML reached the email');
});

/* ---- attribution and persistence ---------------------------------------- */

const WITH_GCLID = {
  ...FULL,
  gclid: 'Cj0KCQjw_TEST_CLICK_ID',
  utm_source: 'google',
  utm_medium: 'cpc',
  utm_campaign: 'demolition-gc',
  landing_page: '/services/demolition/?gclid=Cj0KCQjw_TEST_CLICK_ID',
};

await check('gclid and utm tags reach the notification email', async () => {
  await worker.fetch(post(WITH_GCLID), ENV);
  if (!sent[0].text.includes('gclid=Cj0KCQjw_TEST_CLICK_ID')) {
    throw new Error('gclid missing from the text body');
  }
  if (!sent[0].html.includes('utm_campaign=demolition-gc')) {
    throw new Error('campaign missing from the html body');
  }
});

await check('a lead with no click id says so rather than looking broken', async () => {
  await worker.fetch(post(FULL), ENV);
  if (!sent[0].text.includes('Ad click: none')) throw new Error('no organic marker');
});

await check('the lead is written to the monday board', async () => {
  const res = await worker.fetch(post(WITH_GCLID), MONDAY_ENV);
  eq(res.status, 303, 'status');
  eq(mondayItems.length, 1, 'monday calls');
  const vars = mondayItems[0].variables;
  eq(vars.board, '5031082195', 'board id');
  eq(vars.name, 'Jane Roberts', 'item name');
  const cols = JSON.parse(vars.vals);
  eq(cols.email_mm6v66h0.email, 'jane@example.com', 'email column');
  eq(cols.phone_mm6vxajq.phone, '0400 000 000', 'phone column');
  if (!cols.text_mm6v9srm.includes('gclid=Cj0KCQjw_TEST_CLICK_ID')) {
    throw new Error('gclid missing from the board row');
  }
});

await check('a monday outage does not lose the lead — the email still goes', async () => {
  mondayMode = 'http_error';
  const res = await worker.fetch(post(FULL), MONDAY_ENV);
  eq(res.status, 303, 'status');
  eq(sent.length, 1, 'email still sent');
});

await check('a monday GraphQL error counts as a failure, not a success', async () => {
  mondayMode = 'graphql_error';
  resendStatus = 500;
  const res = await worker.fetch(post(FULL), MONDAY_ENV);
  // monday answered 200 but with an errors array, and Resend is down, so this
  // lead is genuinely unrecorded and the visitor must be told.
  eq(res.status, 502, 'status');
});

await check('a Resend outage is survivable once the board row exists', async () => {
  resendStatus = 500;
  const res = await worker.fetch(post(FULL), MONDAY_ENV);
  eq(res.status, 303, 'status');
  eq(mondayItems.length, 1, 'lead persisted');
});

await check('both paths down is the only case the visitor is turned away', async () => {
  resendStatus = 500;
  mondayMode = 'http_error';
  const res = await worker.fetch(post(FULL), MONDAY_ENV);
  eq(res.status, 502, 'status');
  const html = await res.text();
  if (!html.includes('0438 277 589')) throw new Error('no phone fallback shown');
});


console.log(failures ? `\n${failures} failing` : '\nall passing');
process.exit(failures ? 1 : 0);
