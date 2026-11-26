import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { createPages } from '../scripts/pages.mjs';
import { makeSearchIndex } from '../scripts/search-content.mjs';
import { evidenceFor, matchPortfolio } from '../public/search-core.js';
import { onRequestGet, onRequestPost } from '../functions/api/search.js';
import { onRequestGet as searchNow } from '../functions/api/search-now.js';

const data = JSON.parse(await readFile(new URL('../content/site.json', import.meta.url)));
data.now = await readFile(new URL('../content/now.txt', import.meta.url), 'utf8');
const index = makeSearchIndex(data, createPages(data));
const origin = 'https://portfolio.example';
const schema = await readFile(new URL('../scripts/novel-subscriptions.sql', import.meta.url), 'utf8');

test('search uses real portfolio records and produces evidence across subjects', () => {
  for (const [query, id] of [
    ['introduction to business finance', 'course-course-business-finance'],
    ['UNESCO AI forum', 'experience-unesco-ai-forum'],
    ['German', 'languages'],
    ['career ambitions', 'direction'],
    ['what is he currently working on?', 'now'],
  ]) assert.equal(matchPortfolio(index.records, query)[0]?.record.id, id, query);
  const mixed = 'What are his education and career ambitions?';
  const evidence = evidenceFor(matchPortfolio(index.records, mixed), mixed);
  assert.ok(evidence.some(({ record }) => record.kind === 'Education'));
  assert.ok(evidence.some(({ record }) => record.kind === 'Ambitions'));
  assert.deepEqual(matchPortfolio(index.records, 'How do I bake sourdough?'), []);
  assert.ok(index.records.every(record => record.href.startsWith('/') && !record.href.startsWith('//')));
  assert.doesNotMatch(JSON.stringify(index), /silentforms|NOW_EDITOR_CODE|\.vcf|wa\.me/);
});

test('live Now search returns published public passages and reports failed reads', async () => {
  const result = await searchNow({
    env: { NOW_DB: { prepare: () => ({ first: async () => ({ revision: 3, text: 'New entry.\n\nSecond paragraph.' }) }) } },
  });
  assert.deepEqual(await result.json(), { revision: 3, passages: ['New entry.', 'Second paragraph.'] });
  assert.equal((await searchNow({ env: { NOW_DB: { prepare() { throw new Error('D1'); } } } })).status, 503);
});

test('Gemini is off publicly and streams only server-verified passages in configured mode', async t => {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  db.exec(schema);
  const env = {
    GEMINI_API_KEY: 'test-only',
    NOVEL_SIGNUP_SECRET: 'test-rate-limit-key',
    PORTFOLIO_GEMINI_MODE: 'eligible-adult-deployment',
    ASSETS: { fetch: async () => Response.json(index) },
    NOW_DB: {
      prepare(sql) {
        const statement = db.prepare(sql);
        return {
          first: async () => null,
          bind: (...args) => ({ first: async () => statement.get(...args), run: async () => statement.run(...args) }),
        };
      },
    },
  };
  const context = (query, { country = 'SA', from = origin, ip = '192.0.2.1' } = {}) => {
    const request = new Request(origin + '/api/search', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: from, 'CF-Connecting-IP': ip },
      body: JSON.stringify({ query }),
    });
    Object.defineProperty(request, 'cf', { value: { country } });
    return { env, request };
  };
  const query = 'What is his educational background?';
  assert.deepEqual(await onRequestGet({ ...context(query), env: {} }).json(), { available: false });
  assert.equal((await onRequestPost(context(query, { country: 'GB' }))).status, 503);
  assert.equal((await onRequestPost(context(query, { from: 'https://other.example' }))).status, 403);
  assert.equal((await onRequestPost(context('x'.repeat(241)))).status, 400);
  assert.equal((await onRequestPost(context('Does he know reader@example.test?'))).status, 400);
  assert.equal((await onRequestPost(context('How do I bake sourdough?'))).status, 422);
  let calls = 0;
  let providerCase = 'success';
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls++;
    assert.match(url, /^https:\/\/generativelanguage\.googleapis\.com\//);
    assert.equal(options.headers['x-goog-api-key'], 'test-only');
    assert.equal(JSON.parse(options.body).generationConfig.maxOutputTokens, 180);
    if (providerCase === 'quota') return new Response(null, { status: 429 });
    if (providerCase === 'network') throw new TypeError('offline');
    const chunks = providerCase === 'invalid' ? ['["p99"]'] : ['["p', '0",', '"p1"]'];
    return new Response(chunks.map(text => 'data: ' + JSON.stringify({
      candidates: [{ content: { parts: [{ text }] } }],
    }) + '\n\n').join(''));
  });
  const response = await onRequestPost(context(query));
  assert.equal(response.status, 200);
  const events = (await response.text()).trim().split('\n').map(JSON.parse);
  assert.equal(events.length, 3);
  assert.ok(events[0].passage.recordId.startsWith('education-'));
  assert.equal(events.at(-1).answered, true);
  providerCase = 'network';
  assert.equal((await onRequestPost(context(query))).status, 503);
  providerCase = 'invalid';
  assert.doesNotMatch(await (await onRequestPost(context(query))).text(), /"passage"/);
  for (let i = 0; i < 3; i++) await (await onRequestPost(context(query))).text();
  assert.equal((await onRequestPost(context(query))).status, 429);
  assert.equal(calls, 6);
  const day = Math.floor(Date.now() / 86400000);
  db.prepare('UPDATE novel_signup_limits SET count = 60 WHERE key = ?').run('portfolio-search-day:' + day);
  assert.equal((await onRequestPost(context(query, { ip: '192.0.2.99' }))).status, 429);
  assert.equal(calls, 6);
  db.prepare('UPDATE novel_signup_limits SET count = 45 WHERE key = ?').run('portfolio-search-day:' + day);
  providerCase = 'quota';
  const exhausted = await onRequestPost(context(query, { ip: '192.0.2.99' }));
  assert.equal(exhausted.status, 429);
  assert.equal(exhausted.headers.get('Retry-After'), '60');
  assert.equal((await onRequestPost(context(query, { ip: '192.0.2.98' }))).status, 429);
  assert.equal(calls, 7);
});
