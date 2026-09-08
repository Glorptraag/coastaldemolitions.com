/**
 * Vercel Function adapter for the lead form.  Route: POST /api/lead
 *
 * Vercel Functions support the `fetch` Web Standard export — the exact same
 * shape a Cloudflare Worker uses — so this adapter does only one thing the
 * Worker runtime used to do for us: hand the handler its environment.
 *
 *   Worker:  export default { fetch(request, env) }   // env injected by runtime
 *   Vercel:  export default { fetch(request) }        // env from process.env
 *
 * Keeping the logic in ../src/lead-handler.js as a pure (request, env) function
 * is what lets all 17 ported tests drive it directly, with no Vercel runtime
 * and no network.
 *
 * Deploying this INSIDE the site repo means the form posts same-origin to
 * https://coastaldemolitions.com/api/lead — no CORS, no second Vercel project,
 * and the `_next` open-redirect guard is trivially satisfied.
 */

import handler from '../src/lead-handler.js';

// Node.js runtime. The handler is plain Web-standard fetch/Request/Response,
// so it also runs unchanged on the Edge runtime if that is ever preferred.
export const config = { maxDuration: 15 };

export default {
  fetch(request) {
    return handler.fetch(request, process.env);
  },
};
