import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { onRequestPost, onRequestPut } from '../functions/api/now.js';
import { onRequestGet } from '../functions/index.js';
import { renderNowContent } from '../scripts/now.mjs';

const schema = await readFile(new URL('../scripts/now-schema.sql', import.meta.url), 'utf8');
const origin = 'https://portfolio.example';
const editorCode = 'test-only-code-for-now-page';

test('Now requires the shared code and rejects stale writes without replacing newer text', async () => {
  const database = new DatabaseSync(':memory:');
  try {
    database.exec(schema);
    database.exec(await readFile(new URL('../scripts/novel-subscriptions.sql', import.meta.url), 'utf8'));
    const env = {
      NOW_EDITOR_CODE: editorCode,
      NOW_DB: {
        prepare(sql) {
          const statement = database.prepare(sql);
          return {
            first: async () => statement.get(),
            bind: (...args) => ({ first: async () => statement.get(...args), run: async () => ({ meta: statement.run(...args) }) }),
          };
        },
      },
    };
    function put({ code = editorCode, from = origin, revision = 0, text = 'School update.' } = {}) {
      const request = new Request(origin + '/api/now', {
        method: 'PUT',
        headers: { Origin: from, Authorization: `Bearer ${code}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, revision }),
      });
      return onRequestPut({ request, env });
    }

    assert.equal((await put({ code: 'wrong-code' })).status, 401);
    assert.equal((await put({ from: 'https://other.example' })).status, 403);
    assert.equal((await put({ text: '  ' })).status, 400);
    assert.equal(database.prepare('SELECT COUNT(*) AS count FROM now_page').get().count, 0);
    assert.equal((await put()).status, 200);

    const newText = 'Writing update.\n\n<treat this as text>';
    const saved = await put({ revision: 1, text: newText });
    assert.equal(saved.status, 200);
    assert.deepEqual((await saved.json()).paragraphs, ['Writing update.', '<treat this as text>']);
    assert.equal((await put({ revision: 1, text: 'Stale update.' })).status, 409);

    function tool(command, { code, cookie, from = origin } = {}) {
      const headers = { Origin: from, 'Content-Type': 'application/json' };
      if (code) headers.Authorization = 'Bearer ' + code;
      if (cookie) headers.Cookie = cookie;
      const request = new Request(origin + '/api/now', { method: 'POST', headers, body: JSON.stringify({ command }) });
      return onRequestPost({ request, env });
    }

    assert.equal((await tool('novel signups')).status, 401);
    assert.equal((await tool('now status', { code: editorCode })).status, 401);
    assert.equal((await tool('unlock', { code: 'invalid-publishing-code-000' })).status, 401);
    assert.equal((await tool('unlock', { code: editorCode, from: 'https://other.example' })).status, 403);
    const login = await tool('unlock', { code: editorCode });
    assert.equal(login.status, 200);
    assert.equal(login.headers.get('Cache-Control'), 'no-store');
    assert.ok((await login.json()).expiresAt > Date.now());
    const cookieHeader = login.headers.get('Set-Cookie');
    assert.match(cookieHeader, /^__Host-portfolio-tools=.+; Path=\/; Max-Age=1800; HttpOnly; Secure; SameSite=Strict$/);
    const cookie = cookieHeader.split(';')[0];
    const tampered = cookie.slice(0, -1) + (cookie.endsWith('1') ? '0' : '1');
    assert.equal((await tool('novel signups', { cookie: tampered })).status, 401);
    assert.equal((await tool('now status', { cookie: cookie.replace(/=\d+/, '=1000000000') })).status, 401);

    const live = await tool('now status', { cookie });
    assert.equal(live.status, 200);
    assert.equal((await live.json()).revision, 2);
    const insert = database.prepare('INSERT INTO novel_subscribers (id, email, unsubscribe_token, consent_version, notified_at) VALUES (?, ?, ?, ?, ?)');
    insert.run('a', 'pending@example.test', 'a-token', 'novel-release-v1', null);
    insert.run('b', 'confirmed@example.test', 'b-token', 'novel-release-confirmed-v1', null);
    insert.run('c', 'notified@example.test', 'c-token', 'novel-release-confirmed-v1', '2026-11-19');
    assert.deepEqual(await (await tool('novel signups', { cookie })).json(), { pending: 1, confirmed: 2, notified: 1 });
    assert.equal((await tool('unknown command', { cookie })).status, 400);
    assert.match((await tool('lock', { cookie })).headers.get('Set-Cookie'), /^__Host-portfolio-tools=; Path=\/; Max-Age=0;/);

    const request = new Request(origin + '/', { headers: { 'If-None-Match': 'old-asset-tag' } });
    const html = renderNowContent({ date: '2026-11-17', text: 'Static fallback.' });
    const page = await onRequestGet({
      request,
      env,
      next: async nextRequest => {
        assert.equal(nextRequest.headers.get('If-None-Match'), null);
        return new Response(html, { headers: { 'Content-Type': 'text/html', ETag: 'old-asset-tag' } });
      },
    });
    assert.equal(page.headers.get('Cache-Control'), 'no-store');
    assert.equal(page.headers.get('ETag'), null);
    const rendered = await page.text();
    assert.match(rendered, /data-now-revision="2"/);
    assert.match(rendered, /&lt;treat this as text&gt;/);
    assert.doesNotMatch(rendered, /Static fallback|Stale update/);
  } finally {
    database.close();
  }
});
