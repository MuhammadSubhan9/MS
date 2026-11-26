import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { onRequest } from '../functions/_middleware.js';
import { onRequestGet, onRequestHead } from '../functions/index.js';
import { renderNowContent, renderNowPreview } from '../scripts/now.mjs';

test('static pages and dynamic pages use the same browser protection policy', async () => {
  const rules = await readFile(new URL('../public/_headers', import.meta.url), 'utf8');
  const response = await onRequest({ request: new Request('https://example.test/'), next: () => Response.json({ ok: true }) });
  for (const [, name, value] of rules.split(/\r?\n\r?\n/, 1)[0].matchAll(/^  ([\w-]+): (.+)$/gm)) {
    assert.equal(response.headers.get(name), value);
  }
  assert.deepEqual(await response.json(), { ok: true });
});

test('editing and subscription responses exclude third-party scripts and referrers', async () => {
  for (const path of ['/?owner=1', '/api/now', '/api/novel/unsubscribe']) {
    const response = await onRequest({ request: new Request('https://example.test' + path), next: () => new Response() });
    assert.doesNotMatch(response.headers.get('Content-Security-Policy'), /https:/);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(response.headers.get('Referrer-Policy'), 'no-referrer');
  }
});

test('a failed live read leaves the homepage usable and never presents stale copy as current', async () => {
  const request = new Request('https://example.test/');
  const snapshot = { date: '2026-11-17', text: 'Original snapshot' };
  const html = renderNowPreview(snapshot) + renderNowContent(snapshot);
  const next = () => new Response(html, { headers: { 'Content-Type': 'text/html', ETag: 'old' } });
  const env = { NOW_DB: { prepare() { throw new Error('D1_ERROR'); } } };
  const get = await onRequestGet({ request, next, env });
  const head = await onRequestHead({ request: new Request(request, {method:'HEAD'}), next, env });
  const result = await get.text();
  assert.match(result, /temporarily unavailable/);
  assert.doesNotMatch(result, /Original snapshot/);
  assert.doesNotMatch(result, /data-now-preview/);
  assert.equal(get.headers.get('cache-control'), head.headers.get('cache-control'));
  assert.equal(await head.text(), '');
});
