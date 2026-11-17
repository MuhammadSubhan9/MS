import { logStorageFailure } from '../scripts/storage-errors.mjs';
import { nowEnd, nowStart, renderNowContent } from '../scripts/now.mjs';

export async function onRequestGet({ request, env, next }) {
  if (!env.NOW_DB) return next();

  let current;
  let unavailable = false;
  try {
    current = await env.NOW_DB.prepare('SELECT revision, date, text FROM now_page WHERE id = 1').first();
  } catch (error) {
    unavailable = true;
    logStorageFailure('Now database read failed', error, request);
  }
  if (!unavailable && !current) return next();

  // The underlying asset stays the same even when the published text changes.
  const requestHeaders = new Headers(request.headers);
  for (const name of ['If-None-Match', 'If-Modified-Since', 'Range', 'If-Range']) requestHeaders.delete(name);
  const response = await next(new Request(request, { headers: requestHeaders }));
  if (!response.ok || !response.headers.get('Content-Type')?.startsWith('text/html')) return response;
  const html = await response.text();
  const start = html.indexOf(nowStart);
  const end = html.indexOf(nowEnd, start + nowStart.length);
  const body = start >= 0 && end > start
    ? html.slice(0, start) + (unavailable ? '<section id="now" class="home-section container"><h2>Now</h2><p>The latest update is temporarily unavailable.</p></section>' : renderNowContent(current)) + html.slice(end + nowEnd.length)
    : html;
  const headers = new Headers(response.headers);
  for (const name of ['Content-Length', 'Content-Encoding', 'ETag', 'Last-Modified']) headers.delete(name);
  headers.set('Cache-Control', 'no-store');
  return new Response(body, { status: response.status, headers });
}

export async function onRequestHead({ request, env, next }) {
  const getRequest = new Request(request, { method: 'GET' });
  const response = await onRequestGet({ request: getRequest, env, next: (assetRequest = getRequest) => next(assetRequest) });
  await response.body?.cancel();
  return new Response(null, { status: response.status, headers: response.headers });
}
