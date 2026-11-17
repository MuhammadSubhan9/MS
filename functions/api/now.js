import { formatDate } from '../../scripts/components.mjs';
import { nowLimit, nowParagraphs } from '../../scripts/now.mjs';

const encoder = new TextEncoder();

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
  if (!await validCode(request, env.NOW_EDITOR_CODE)) {
    return json({ error: 'That publishing code did not match.' }, 401);
  }
  const payload = await request.json().catch(() => null);
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
  } catch {
    return json({ error: 'Publishing is unavailable. Your draft is still here.' }, 503);
  }
}
