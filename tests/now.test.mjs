import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { onRequestPut } from '../functions/api/now.js';
import { onRequestGet } from '../functions/now/index.js';
import { renderNowContent } from '../scripts/now.mjs';

const schema = await readFile(new URL('../scripts/now-schema.sql', import.meta.url), 'utf8');
const origin = 'https://portfolio.example';
const editorCode = 'test-only-code-for-now-page';

test('Now requires the shared code and rejects stale writes without replacing newer text', async () => {
  const database = new DatabaseSync(':memory:');
  try {
    database.exec(schema);
    const env = {
      NOW_EDITOR_CODE: editorCode,
      NOW_DB: {
        prepare(sql) {
          const statement = database.prepare(sql);
          return {
            first: async () => statement.get(),
            bind: (...args) => ({ run: async () => ({ meta: statement.run(...args) }) }),
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

    const request = new Request(origin + '/now/', { headers: { 'If-None-Match': 'old-asset-tag' } });
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
