import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { onRequest } from '../functions/_middleware.js';
import { onRequestGet, onRequestHead } from '../functions/index.js';
import { renderNowContent } from '../scripts/now.mjs';

test('static pages and dynamic pages use the same browser protection policy', async () => {
  const rules = await readFile(new URL('../public/_headers', import.meta.url), 'utf8');
  const response = await onRequest({ next: () => Response.json({ ok: true }) });
  assert.equal(response.headers.get('Content-Security-Policy'), rules.match(/Content-Security-Policy: (.+)/)[1]);
  assert.equal(response.headers.get('X-Frame-Options'), 'DENY');
  assert.deepEqual(await response.json(), { ok: true });
});

test('a failed live read leaves the homepage usable and never presents stale copy as current', async () => {
  const request = new Request('https://example.test/');
  const html = renderNowContent({ date: '2026-11-17', text: 'Original snapshot' });
  const next = () => new Response(html, { headers: { 'Content-Type': 'text/html', ETag: 'old' } });
  const env = { NOW_DB: { prepare() { throw new Error('D1_ERROR'); } } };
  const get = await onRequestGet({ request, next, env });
  const head = await onRequestHead({ request: new Request(request, {method:'HEAD'}), next, env });
  const result = await get.text();
  assert.match(result, /temporarily unavailable/);
  assert.doesNotMatch(result, /Original snapshot/);
  assert.equal(get.headers.get('cache-control'), head.headers.get('cache-control'));
  assert.equal(await head.text(), '');
});
