import { logStorageFailure } from '../../../scripts/storage-errors.mjs';
import {
  allowSubscription, normalizedEmail, readSubscriptionBody, subscriptionResponse,
} from '../../../scripts/subscriptions.mjs';

const success = 'Request saved. Before release, you will be asked by email to confirm your address.';

export async function onRequestPost({ request, env }) {
  const reply = options => subscriptionResponse(request, options);
  if (request.headers.get('Origin') !== new URL(request.url).origin) {
    return reply({ status: 403, error: true, message: 'Please sign up from the novel page.' });
  }
  if (!env.NOW_DB || !env.NOVEL_SIGNUP_SECRET) {
    return reply({ status: 503, error: true, message: 'The release list is temporarily unavailable. Please try again later.' });
  }
  const body = await readSubscriptionBody(request);
  if (body.error) return reply({ status: body.status, error: true, message: body.error });
  if (body.fields.website) return reply({ message: success });
  const email = normalizedEmail(body.fields.email);
  if (!email || !['yes', true].includes(body.fields.consent)) {
    return reply({ status: 400, error: true, message: 'Enter a valid email address and agree to receive the release announcement.' });
  }
  try {
    const retryAfter = await allowSubscription(request, env);
    if (retryAfter) {
      return reply({ status: 429, retryAfter, error: true, message: 'Too many signups. Please try again later.' });
    }
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
    await env.NOW_DB.prepare(`
      INSERT INTO novel_subscribers (id, email, unsubscribe_token, consent_version)
      VALUES (?, ?, ?, 'novel-release-v1')
      ON CONFLICT(email) DO NOTHING
    `).bind(crypto.randomUUID(), email, token).run();
    return reply({ message: success });
  } catch (error) {
    if (String(error).includes('novel_daily_limit')) {
      return reply({ status: 429, retryAfter: 86400 - Math.floor(Date.now() / 1000) % 86400, error: true, message: 'Please try again tomorrow.' });
    }
    logStorageFailure('Novel signup storage failed', error, request);
    return reply({ status: 503, error: true, message: 'Your signup could not be confirmed. Please try again.' });
  }
}

export function onRequestGet() {
  return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST', 'Cache-Control': 'no-store' } });
}
