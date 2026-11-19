import { logStorageFailure } from '../../scripts/storage-errors.mjs';
import { limitAction, readSubscriptionBody } from '../../scripts/subscriptions.mjs';
import { formatDate } from '../../scripts/components.mjs';
import { nowLimit, nowParagraphs } from '../../scripts/now.mjs';

const encoder = new TextEncoder();
const toolCookie = '__Host-portfolio-tools';
const toolSessionSeconds = 30 * 60;

function json(payload, status = 200) {
  return Response.json(payload, { status, headers: { 'Cache-Control': 'no-store' } });
}

async function validCode(request, expected) {
  const supplied = request.headers.get('Authorization')?.match(/^Bearer ([!-~]{24,128})$/)?.[1];
  if (!supplied) return false;
  const hashes = await Promise.all([supplied, expected].map(value => crypto.subtle.digest('SHA-256', encoder.encode(value))));
  const [left, right] = hashes.map(hash => new Uint8Array(hash));
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left[i] ^ right[i];
  return difference === 0;
}

function sessionCookie(value, maxAge) {
  return toolCookie + '=' + value + '; Path=/; Max-Age=' + maxAge + '; HttpOnly; Secure; SameSite=Strict';
}

async function sessionKey(code) {
  return crypto.subtle.importKey('raw', encoder.encode(code), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function createToolSession(code) {
  const expires = Math.floor(Date.now() / 1000) + toolSessionSeconds;
  const content = expires + '.' + crypto.randomUUID();
  const signature = await crypto.subtle.sign('HMAC', await sessionKey(code), encoder.encode(toolCookie + ':' + content));
  const hex = Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, '0')).join('');
  return { expiresAt: expires * 1000, cookie: sessionCookie(content + '.' + hex, toolSessionSeconds) };
}

async function hasToolSession(request, code) {
  const cookie = request.headers.get('Cookie')?.split(';').map(part => part.trim())
    .find(part => part.startsWith(toolCookie + '='));
  const match = cookie?.slice(toolCookie.length + 1).match(/^(\d{10})\.([a-f0-9-]{36})\.([a-f0-9]{64})$/);
  if (!match || Number(match[1]) <= Date.now() / 1000) return false;
  const [, expires, nonce, hex] = match;
  const signature = Uint8Array.from(hex.match(/../g), byte => Number.parseInt(byte, 16));
  return crypto.subtle.verify('HMAC', await sessionKey(code), signature, encoder.encode(toolCookie + ':' + expires + '.' + nonce));
}

export async function onRequestPost({ request, env }) {
  if (request.headers.get('Origin') !== new URL(request.url).origin) {
    return json({ error: 'Open the tools from your portfolio.' }, 403);
  }
  const body = await readSubscriptionBody(request, 1024);
  if (body.error) return json({ error: 'Invalid command request.' }, body.status);
  const command = body.fields.command;
  if (command === 'lock') {
    const response = json({ locked: true });
    response.headers.set('Set-Cookie', sessionCookie('', 0));
    return response;
  }
  const code = env.NOW_EDITOR_CODE;
  if (!env.NOW_DB || !/^[!-~]{24,128}$/.test(code ?? '')) {
    return json({ error: 'The owner tools are unavailable.' }, 503);
  }
  try {
    if (command === 'unlock') {
      const retry = await limitAction(request, env, 'tools-unlock', 12);
      if (retry) {
        const response = json({ error: 'Too many attempts. Try again later.' }, 429);
        response.headers.set('Retry-After', String(retry));
        return response;
      }
      if (!await validCode(request, code)) return json({ error: 'That publishing code did not match.' }, 401);
      const session = await createToolSession(code);
      const response = json({ expiresAt: session.expiresAt });
      response.headers.set('Set-Cookie', session.cookie);
      return response;
    }
    if (!await hasToolSession(request, code)) return json({ error: 'Unlock Ctrl+K again in the Now editor.' }, 401);
    if (command === 'now status') {
      const latest = await env.NOW_DB.prepare('SELECT revision, date FROM now_page WHERE id = 1').first();
      return json(latest ? { revision: latest.revision, date: formatDate(latest.date) } : { revision: 0 });
    }
    if (command === 'novel signups') {
      const totals = await env.NOW_DB.prepare(
        "SELECT COUNT(*) AS total, COUNT(CASE WHEN consent_version = 'novel-release-confirmed-v1' THEN 1 END) AS confirmed, COUNT(notified_at) AS notified FROM novel_subscribers",
      ).first();
      return json({ pending: totals.total - totals.confirmed, confirmed: totals.confirmed, notified: totals.notified });
    }
    return json({ error: 'No command found.' }, 400);
  } catch (error) {
    logStorageFailure('Owner tools unavailable', error, request);
    return json({ error: 'The owner tools are unavailable. Try again in a moment.' }, 503);
  }
}

function riyadhDate() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Riyadh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type).value).join('-');
}

export async function onRequestPut({ request, env }) {
  if (request.headers.get('Origin') !== new URL(request.url).origin) {
    return json({ error: 'Publish from your portfolio to continue.' }, 403);
  }
  if (!env.NOW_DB || !/^[!-~]{24,128}$/.test(env.NOW_EDITOR_CODE ?? '')) {
    return json({ error: 'Publishing has not been set up yet. Your draft is still here.' }, 503);
  }
  try {
    const retry = await limitAction(request, env, 'publish', 30);
    if (retry) return Response.json({ error: 'Too many attempts. Try again later.' }, {
      status: 429, headers: { 'Cache-Control': 'no-store', 'Retry-After': String(retry) },
    });
  } catch (error) {
    logStorageFailure('Publishing attempt limiter unavailable', error, request);
    return json({ error: 'Publishing is unavailable. Your draft is still here.' }, 503);
  }
  if (!await validCode(request, env.NOW_EDITOR_CODE)) {
    return json({ error: 'That publishing code did not match.' }, 401);
  }
  const body = await readSubscriptionBody(request, 32 * 1024);
  if (body.error) return json({ error: 'Send a valid update within the size limit.' }, body.status);
  const payload = body.fields;
  const text = typeof payload?.text === 'string' ? payload.text.trim() : '';
  const revision = payload?.revision;
  if (!text || text.length > nowLimit || !Number.isSafeInteger(revision) || revision < 0 || revision >= Number.MAX_SAFE_INTEGER) {
    return json({ error: `Write an update of up to ${nowLimit} characters.` }, 400);
  }
  const date = riyadhDate();
  try {
    const result = revision === 0
      ? await env.NOW_DB.prepare('INSERT INTO now_page (id, revision, date, text) VALUES (1, 1, ?, ?) ON CONFLICT(id) DO NOTHING').bind(date, text).run()
      : await env.NOW_DB.prepare('UPDATE now_page SET revision = ?, date = ?, text = ? WHERE id = 1 AND revision = ?').bind(revision + 1, date, text, revision).run();
    if (result.meta.changes !== 1) {
      return json({ error: 'A newer update is live. Copy your draft, reload the page, then try again.' }, 409);
    }
    return json({ date, dateLabel: formatDate(date), paragraphs: nowParagraphs(text), revision: revision + 1 });
  } catch (error) {
    logStorageFailure('Now database write failed', error, request);
    return json({ error: 'Publishing is unavailable. Your draft is still here.' }, 503);
  }
}
