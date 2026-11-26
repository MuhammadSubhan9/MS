// Pages applies _headers only to static responses.
export async function onRequest({ next, request }) {
  const response = await next();
  const headers = new Headers(response.headers);
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Content-Security-Policy', "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; script-src 'self' https://*.clarity.ms https://*.googletagmanager.com https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.clarity.ms https://c.bing.com https://*.google-analytics.com https://*.googletagmanager.com; connect-src 'self' https://silentforms.com https://*.clarity.ms https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://cloudflareinsights.com; form-action 'self' https://silentforms.com");
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Strict-Transport-Security', 'max-age=31536000');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (!headers.has('Referrer-Policy')) headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  const url = new URL(request.url);
  const privateEditor = url.pathname === '/' && url.searchParams.get('owner') === '1';
  if (privateEditor || url.pathname.startsWith('/api/')) {
    const scripts = privateEditor ? "'self'" : "'none'";
    headers.set('Content-Security-Policy', `default-src 'none'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; script-src ${scripts}; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'; form-action 'self'`);
    headers.set('Cache-Control', 'no-store');
    headers.set('Referrer-Policy', 'no-referrer');
    headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
