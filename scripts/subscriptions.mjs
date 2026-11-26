import { escape } from './components.mjs';

const maxBodyBytes = 4096;

export function subscriptionPage(title, copy, body = '') {
  return `<!doctype html><html lang="en"><head>
    <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer">
    <title>${escape(title)} · The Eleventh Rehearsal</title>
    <link rel="stylesheet" href="/novel.css">
    </head><body class="novel-page"><main class="novel-wrap release-result">
    <p class="novel-label">The Eleventh Rehearsal</p><h1>${escape(title)}</h1>
    <p>${escape(copy)}</p>${body}
    <a class="novel-text-link" href="/writing/#release-updates">Back to the novel</a>
    </main></body></html>`;
}

export function subscriptionResponse(request, { message, status = 200, error = false, retryAfter }) {
  const headers = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' };
  if (status === 429) headers['Retry-After'] = String(retryAfter);
  if (request.headers.get('Accept')?.includes('application/json')) {
    return Response.json(error ? { error: message } : { ok: true, message }, { status, headers });
  }
  if (!error) {
    return new Response(subscriptionPage('Release signup received', message), {
      status: 200, headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
  headers['Content-Type'] = 'text/html; charset=utf-8';
  return new Response(subscriptionPage('Please try again', message), { status, headers });
}

export async function readSubscriptionBody(request, limit = maxBodyBytes) {
  const type = request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase();
  if (!['application/json', 'application/x-www-form-urlencoded'].includes(type)) {
    return { error: 'Send the form using the email field.', status: 415 };
  }
  if (Number(request.headers.get('Content-Length')) > limit) {
    return { error: 'That signup is too large. Please try again.', status: 413 };
  }
  const reader = request.body?.getReader();
  if (!reader) return { error: 'Enter your email address.', status: 400 };
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > limit) {
        await reader.cancel();
        return { error: 'That signup is too large. Please try again.', status: 413 };
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    const fields = type === 'application/json' ? JSON.parse(text) : Object.fromEntries(new URLSearchParams(text));
    if (!fields || typeof fields !== 'object' || Array.isArray(fields)) throw new Error('Invalid signup');
    return { fields };
  } catch {
    return { error: 'Please check your signup and try again.', status: 400 };
  } finally {
    reader.releaseLock();
  }
}

export function normalizedEmail(value) {
  if (typeof value !== 'string') return '';
  const email = value.trim().toLowerCase();
  const parts = email.split('@');
  if (parts.length !== 2 || email.length > 254) return '';
  const [local, domain] = parts;
  if (!local || local.length > 64 || local.startsWith('.') || local.endsWith('.') || local.includes('..') ||
      !/^[a-z0-9.!#$%&'*+\/=?^_`{|}~-]+$/.test(local)) return '';
  const labels = domain.split('.');
  if (labels.length < 2 || labels.some(label => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) return '';
  return email;
}

export async function limitAction(request, env, action, limit, now = Math.floor(Date.now() / 1000)) {
  const hour = Math.floor(now / 3600);
  const secret = await crypto.subtle.importKey('raw', new TextEncoder().encode((env.NOVEL_SIGNUP_SECRET || env.NOW_EDITOR_CODE)), {
    name: 'HMAC', hash: 'SHA-256',
  }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', secret, new TextEncoder().encode(
    `${action}:${hour}:${request.headers.get('CF-Connecting-IP') || 'local'}`,
  ));
  const ipKey = Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, '0')).join('');
  const increment = (key, expires, limit) => env.NOW_DB.prepare(`
    INSERT INTO novel_signup_limits (key, expires_at) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET count = count + 1 WHERE count < ?
    RETURNING count
  `).bind(key, expires, limit).first();
  await env.NOW_DB.prepare('DELETE FROM novel_signup_limits WHERE expires_at <= ?').bind(now).run();
  const allowed = await increment(ipKey, (hour + 1) * 3600, limit);
  return allowed ? 0 : (hour + 1) * 3600 - now;
}

export async function allowSubscription(request, env) {
  const now = Math.floor(Date.now() / 1000);
  const day = Math.floor(now / 86400);
  const daily = await env.NOW_DB.prepare('SELECT count FROM novel_signup_limits WHERE key = ?').bind(`daily:${day}`).first();
  if (daily?.count >= 200) return (day + 1) * 86400 - now;
  return limitAction(request, env, 'subscribe', 5, now);
}
