import { logStorageFailure } from '../../../scripts/storage-errors.mjs';
import { limitAction, readSubscriptionBody, subscriptionPage } from '../../../scripts/subscriptions.mjs';

const headers = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
};

export function onRequestGet({ request }) {
  const token = new URL(request.url).searchParams.get('token');
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
    return new Response(subscriptionPage('Invalid unsubscribe link', 'Use the unsubscribe link in your release email.'), { status: 400, headers });
  }
  const form = `<form method="post" action="/api/novel/unsubscribe">
    <input type="hidden" name="token" value="${token}">
    <button class="novel-button" type="submit">Unsubscribe</button>
  </form>`;
  return new Response(subscriptionPage('Leave the release list?', 'Confirm below to cancel your release announcement.', form), { headers });
}

export async function onRequestPost({ request, env }) {
  const json = request.headers.get('Accept')?.includes('application/json');
  const reply = (message, status = 200) => json
    ? Response.json({ ok: status === 200, message }, { status, headers: { 'Cache-Control': 'no-store' } })
    : new Response(subscriptionPage(status === 200 ? 'Unsubscribed' : 'Please try again', message), { status, headers });
  if (request.headers.get('Origin') !== new URL(request.url).origin) {
    return reply('Please open the unsubscribe link in your browser.', 403);
  }
  if (!env.NOW_DB) return reply('Unsubscribing is temporarily unavailable. Please try again later.', 503);
  const body = await readSubscriptionBody(request);
  if (body.error) return reply(body.error, body.status);
  const token = body.fields.token;
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return reply('Use the unsubscribe link in your release email.', 400);
  try {
    if (await limitAction(request, env, 'unsubscribe', 60)) return reply('Please try again later.', 429);
    await env.NOW_DB.prepare('DELETE FROM novel_subscribers WHERE unsubscribe_token = ?').bind(token).run();
    return reply('You will not receive the novel’s release announcement.');
  } catch (error) {
    logStorageFailure('Novel unsubscribe storage failed', error, request);
    return reply('Unsubscribing could not be confirmed. Please try again.', 503);
  }
}
