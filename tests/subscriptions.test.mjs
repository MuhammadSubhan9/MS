import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { onRequestPost as subscribe } from '../functions/api/novel/subscribe.js';
import { onRequestGet as unsubscribePage, onRequestPost as unsubscribe } from '../functions/api/novel/unsubscribe.js';
import { normalizedEmail } from '../scripts/subscriptions.mjs';

const schema = await readFile(new URL('../scripts/novel-subscriptions.sql', import.meta.url), 'utf8');
const origin = 'https://portfolio.example';

function setup() {
  const database = new DatabaseSync(':memory:');
  database.exec(schema);
  const env = {
    NOVEL_SIGNUP_SECRET: 'test-only-subscription-key',
    NOW_DB: {
      prepare(sql) {
        const statement = database.prepare(sql);
        return {
          bind: (...args) => ({
            run: async () => ({ meta: statement.run(...args) }),
            first: async () => statement.get(...args) ?? null,
          }),
        };
      },
    },
  };
  function request(path, fields, { from = origin, ip = '192.0.2.1', json = true } = {}) {
    return new Request(origin + path, {
      method: 'POST',
      headers: {
        Origin: from, 'CF-Connecting-IP': ip,
        'Content-Type': json ? 'application/json' : 'application/x-www-form-urlencoded',
        Accept: json ? 'application/json' : 'text/html',
      },
      body: json ? JSON.stringify(fields) : new URLSearchParams(fields).toString(),
    });
  }
  const signup = (fields, options) => subscribe({ request: request('/api/novel/subscribe', fields, options), env });
  return { database, env, request, signup };
}

test('subscription validation, consent, bot field and case-insensitive deduplication', async () => {
  const { database, signup } = setup();
  try {
    assert.equal(normalizedEmail(' Name+book@Example.COM '), 'name+book@example.com');
    for (const email of ['<script>@example.com', 'a..b@example.com', 'a@localhost', 'a@-bad.example', 'a\r\n@example.com']) {
      assert.equal(normalizedEmail(email), '');
    }
    assert.equal((await signup({ email: 'reader@example.com', consent: 'yes' }, { from: 'https://elsewhere.example' })).status, 403);
    assert.equal((await signup({ email: 'reader@example.com' })).status, 400);
    assert.equal((await signup({ email: 'reader@example.com', consent: 'yes', website: 'bot' })).status, 200);
    assert.equal(database.prepare('SELECT COUNT(*) AS count FROM novel_subscribers').get().count, 0);
    const first = await signup({ email: 'Reader@Example.com', consent: 'yes' });
    const second = await signup({ email: 'reader@example.com', consent: 'yes' });
    assert.deepEqual(await first.json(), await second.json());
    const row = database.prepare('SELECT * FROM novel_subscribers').get();
    assert.equal(row.email, 'reader@example.com');
    assert.equal(database.prepare("SELECT count FROM novel_signup_limits WHERE key LIKE 'daily:%'").get().count, 1);
    assert.equal(row.consent_version, 'novel-release-v1');
    assert.match(row.unsubscribe_token, /^[a-f0-9]{64}$/);
    assert.equal(database.prepare('SELECT COUNT(*) AS count FROM novel_subscribers').get().count, 1);
    assert.equal(database.prepare('SELECT COUNT(*) AS count FROM novel_release_recipients').get().count, 0);
    database.prepare("UPDATE novel_subscribers SET consent_version = 'novel-release-confirmed-v1' WHERE id = ?").run(row.id);
    assert.equal(database.prepare('SELECT email FROM novel_release_recipients').get().email, row.email);
    const native = await signup({ email: 'native@example.com', consent: 'yes' }, { json: false });
    assert.equal(native.status, 200);
    assert.ok((await native.text()).includes('Release signup received'));
  } finally { database.close(); }
});

test('subscription limits are enforced without storing plaintext IPs', async () => {
  const { database, signup } = setup();
  try {
    for (let i = 0; i < 5; i++) {
      assert.equal((await signup({ email: `reader${i}@example.com`, consent: 'yes' })).status, 200);
    }
    const rejected = await signup({ email: 'sixth@example.com', consent: 'yes' });
    assert.equal(rejected.status, 429);
    assert.ok(rejected.headers.get('Retry-After'));
    assert.equal(database.prepare('SELECT COUNT(*) AS count FROM novel_subscribers').get().count, 5);
    assert.equal(database.prepare('SELECT key FROM novel_signup_limits WHERE key LIKE ?').get('%192.0.2.1%'), undefined);
    const day = Math.floor(Date.now() / 86400000);
    database.prepare('UPDATE novel_signup_limits SET count = 200 WHERE key = ?').run(`daily:${day}`);
    assert.equal((await signup({ email: 'limited@example.com', consent: 'yes' }, { ip: '192.0.2.9' })).status, 429);
  } finally { database.close(); }
});

test('unsubscribe link requires deliberate confirmation and removes the saved address', async () => {
  const { database, env, request, signup } = setup();
  try {
    await signup({ email: 'reader@example.com', consent: 'yes' });
    const { unsubscribe_token: token } = database.prepare('SELECT unsubscribe_token FROM novel_subscribers').get();
    const page = unsubscribePage({ request: new Request(origin + '/api/novel/unsubscribe?token=' + token) });
    assert.equal(page.status, 200);
    assert.equal(page.headers.get('Referrer-Policy'), 'no-referrer');
    assert.ok((await page.text()).includes('type="submit">Unsubscribe'));
    assert.equal(database.prepare('SELECT COUNT(*) AS count FROM novel_subscribers').get().count, 1);
    const ignored = await unsubscribe({ env, request: request('/api/novel/unsubscribe', { token }, { from: 'https://elsewhere.example' }) });
    assert.equal(ignored.status, 403);
    const malformed = await unsubscribe({ env, request: request('/api/novel/unsubscribe', { token: [token] }) });
    assert.equal(malformed.status, 400);
    const removed = await unsubscribe({ env, request: request('/api/novel/unsubscribe', { token }) });
    assert.equal(removed.status, 200);
    assert.equal(database.prepare('SELECT COUNT(*) AS count FROM novel_subscribers').get().count, 0);
    assert.equal((await unsubscribe({ env, request: request('/api/novel/unsubscribe', { token }) })).status, 200);
  } finally { database.close(); }
});

test('oversized streamed signup and malformed JSON fail before writing', async () => {
  const { database, env } = setup();
  try {
    const streamed = new Request(origin + '/api/novel/subscribe', {
      method: 'POST', duplex: 'half',
      headers: { Origin: origin, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: new ReadableStream({ start(controller) {
        controller.enqueue(new TextEncoder().encode('a'.repeat(4097)));
        controller.close();
      } }),
    });
    assert.equal((await subscribe({ request: streamed, env })).status, 413);
    const invalid = new Request(origin + '/api/novel/subscribe', {
      method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: '{',
    });
    assert.equal((await subscribe({ request: invalid, env })).status, 400);
    assert.equal(database.prepare('SELECT COUNT(*) AS count FROM novel_subscribers').get().count, 0);
  } finally { database.close(); }
});
