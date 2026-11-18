import { action, escape, safeLink } from './components.mjs';
import { renderNovelPage } from './novel.mjs';
import { commandAssets, commandPalette } from './commands.mjs';
import { clarityTag, googleAnalytics } from './analytics.mjs';
import { journeyAssets, portfolioAssets, sectionLinkDialog } from './portfolio-features.mjs';

const welcome = `<dialog class="opening" aria-label="Welcome to Muhammad Subhan’s portfolio">
    <div class="opening-top"><span><img src="/favicon.svg?v=5" width="32" height="32" alt="">A developing perspective</span><button type="button" autofocus>Skip intro</button></div>
    <div class="opening-content">
      <p class="eyebrow">The story so far</p>
      <h2 class="opening-name"><span><i>Muhammad</i></span> <span><i>Subhan.</i></span></h2>
      <p class="opening-caption">A future in law.<br>Built one step at a time.</p>
    </div>
    <div class="opening-bottom"><span>Riyadh, Saudi Arabia</span><div class="opening-track" aria-hidden="true"></div><span>Personal portfolio / ${new Date().getFullYear()}</span></div>
  </dialog>`;

export function renderPage({ data, page, navigation, origin, ready, preview }) {
  if (page.layout === 'novel') return renderNovelPage({ data, page, origin, ready });
  if (page.redirect) {
    const destination = safeLink(page.redirect);
    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(page.label)}</title><meta name="robots" content="noindex">
<link rel="canonical" href="${escape(origin)}${destination}">
<meta http-equiv="refresh" content="0;url=${destination}"></head>
<body><p><a href="${destination}">Continue to ${escape(page.label)}</a></p></body></html>`;
  }
  const title = `${page.label} · ${data.name}`;
  const missing = page.path === '/404/';
  const home = page.path === '/';
  const about = page.path === '/about/';
  const journey = page.path === '/journey/';
  const contact = page.path === '/contact/';
  const siteUpdates = home && data.siteUpdate?.items?.length;
  const portfolioFeatures = siteUpdates || about || journey || /^(?:\/work\/|\/writing\/.+)/.test(page.path);
  const links = navigation.map(item => {
    const active = page.path === item.path || item.path !== '/' && page.path.startsWith(item.path);
    const isContact = item.path === '/contact/';
    const label = item.path === '/writing/' ? 'Writing' : item.label;
    return `<a${isContact ? ' class="nav-contact"' : ''} href="${item.path}"${active ? ' aria-current="page"' : ''}>${escape(label)}${isContact ? '<span class="arrow" aria-hidden="true"></span>' : ''}</a>`;
  }).join('');
  const footerPages = navigation.filter(item => item.path !== '/' && item.path !== '/contact/');
  const footerContact = navigation.some(item => item.path === '/contact/');
  const footerNow = data.now ? '<a class="footer-link" href="/#now">Now</a>' : '';
  const google = googleAnalytics(data, origin, ready);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#F2EDE3">
  <title>${escape(title)}</title>
  <meta name="description" content="${escape(page.description)}">
  <meta name="robots" content="${ready && !missing ? 'index,follow' : 'noindex,nofollow'}">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(page.description)}">
  <meta property="og:type" content="${page.type || 'website'}">
  <meta property="og:site_name" content="${escape(data.name)}">
  <meta name="twitter:card" content="${data.seo.image ? 'summary_large_image' : 'summary'}">
  ${origin && !missing ? `<link rel="canonical" href="${escape(origin + page.path)}"><meta property="og:url" content="${escape(origin + page.path)}">` : ''}
  ${data.seo.image ? `<meta property="og:image" content="${safeLink(data.seo.image)}">` : ''}
  <link rel="icon" href="/favicon.svg?v=5" type="image/svg+xml">
  <link rel="preload" href="/fonts/dm-serif-text.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/source-sans-3.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="/navigation-motion.css">
  <script src="/navigation-motion.js" blocking="render"></script>
  ${portfolioFeatures ? portfolioAssets : ''}
  ${journey ? journeyAssets : ''}
  ${home ? '<link rel="stylesheet" href="/intro.css">\n  <script src="/intro.js" defer blocking="render"></script>' : ''}
  ${contact ? '<link rel="stylesheet" href="/contact.css">\n  <script src="/contact.js" defer></script>\n  <script src="/contact-card.js" type="module"></script>' : ''}
  ${data.now ? commandAssets : ''}
  ${home && data.now ? '<script src="/now-editor.js" defer></script>' : ''}
  <script src="/site.js" defer></script>
  ${clarityTag(data, origin, ready)}
  ${google.head}
</head>
<body${contact ? ' class="contact-document"' : ''}>
  ${home ? welcome : ''}
  <a class="skip" href="#main">Skip to content</a>
  ${preview ? '<aside class="preview-notice" aria-label="Development preview">Private design preview · Sample content for layout review</aside>' : ''}
  <header class="site-header">
    <div class="container header-inner">
      <a class="wordmark" href="/"><span>${escape(data.name)}</span></a>
      ${navigation.length > 1 ? `<button class="menu" aria-controls="navigation" aria-expanded="false" hidden>Menu<span aria-hidden="true" class="menu-mark"></span></button><nav class="nav" id="navigation" aria-label="Primary">${links}</nav>` : ''}
    </div>
  </header>
  <main class="${home ? 'home-page' : about ? 'about-main' : 'container'}" id="main" tabindex="-1">${page.body}</main>
  <footer class="site-footer"><div class="container footer-inner">
    <div class="footer-identity">
      <a class="footer-name" href="/">${escape(data.name)}</a>
      <small>© <span data-year>${new Date().getFullYear()}</span></small>
      ${google.notice}
    </div>
    ${footerPages.length || footerContact || footerNow || siteUpdates ? `<nav class="footer-nav" aria-label="Footer">
      ${footerPages.map(item => `<a class="footer-link" href="${item.path}">${item.path === '/writing/' ? 'Writing' : escape(item.label)}</a>`).join('')}
      ${footerNow}
      ${siteUpdates ? '<a class="footer-link" href="#site-updates">Site updates</a>' : ''}
      ${footerContact ? action('/contact/', 'Get in touch', 'button-link footer-contact') : ''}
    </nav>` : ''}
  </div></footer>
  ${portfolioFeatures ? sectionLinkDialog : ''}
  ${data.now ? commandPalette : ''}
</body>
</html>`;
}
