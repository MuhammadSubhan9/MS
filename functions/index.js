import { logStorageFailure } from '../scripts/storage-errors.mjs';
import { nowEnd, nowStart, nowPreviewEnd, nowPreviewStart, renderNowContent, renderNowPreview } from '../scripts/now.mjs';

function replaceNowMarkup(html, start, end, replacement) {
  const from = html.indexOf(start);
  const to = html.indexOf(end, from + start.length);
  return from >= 0 && to > from
    ? html.slice(0, from) + replacement + html.slice(to + end.length)
    : html;
}

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
  const content = unavailable
    ? '<section id="now" class="home-section container"><h2>Now</h2><p>The latest update is temporarily unavailable.</p></section>'
    : renderNowContent(current);
  const body = replaceNowMarkup(
    replaceNowMarkup(html, nowStart, nowEnd, content),
    nowPreviewStart, nowPreviewEnd, unavailable ? '' : renderNowPreview(current),
  );
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
