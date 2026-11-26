import { action, escape, headerAssets, icon, image, pageIcons, safeLink, toggleIcon } from './components.mjs';
import { renderNovelPage } from './novel.mjs';
import { commandAssets, commandPalette } from './commands.mjs';
import { clarityTag, googleAnalytics } from './analytics.mjs';
import { journeyAssets, portfolioAssets, sectionLinkDialog } from './portfolio-features.mjs';
import { searchAssets, searchDialog, searchLink } from './search-content.mjs';

function welcome(data) {
  const nameLines = data.name.trim().split(/\s+(?=\S+$)/);
  const portrait = data.aboutPortrait || data.portrait;
  return `<dialog class="opening" aria-labelledby="opening-name" aria-describedby="opening-caption">
    <div class="opening-sheet">
      <div class="opening-top">
        <p class="opening-label">Personal portfolio</p>
        <button class="opening-skip" type="button" autofocus>Skip intro ${icon('arrow-right')}</button>
      </div>
      <div class="opening-spread${portrait ? ' opening-with-portrait' : ''}">
        <div class="opening-copy">
          <h2 class="opening-name" id="opening-name">${nameLines.map(line => `<span><span>${escape(line)}</span></span>`).join(' ')}</h2>
          <p class="opening-caption" id="opening-caption">A Level studies, experiences beyond the classroom, and fiction.</p>
        </div>
        ${portrait ? `<div class="opening-portrait" aria-hidden="true">${image(portrait, { sizes: '(max-width: 700px) 90vw, 480px' })}</div>` : ''}
      </div>
      <div class="opening-bottom">
        <p>Riyadh, Saudi Arabia</p>
        <div class="opening-track" aria-hidden="true"></div>
      </div>
    </div>
  </dialog>`;
}

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
  const portfolioFeatures = about || journey || /^(?:\/work\/|\/writing\/.+)/.test(page.path);
  const links = navigation.map(item => {
    const active = page.path === item.path || item.path !== '/' && page.path.startsWith(item.path);
    const isContact = item.path === '/contact/';
    const label = item.path === '/writing/' ? 'Writing' : item.label;
    const mark = pageIcons[item.path] ? icon(pageIcons[item.path]) : '';
    return `<a${isContact ? ' class="nav-contact"' : ''} href="${item.path}"${active ? ' aria-current="page"' : ''}>${mark}${escape(label)}</a>`;
  }).join('');
  const footerPages = navigation.filter(item => item.path !== '/' && item.path !== '/contact/');
  const footerContact = navigation.some(item => item.path === '/contact/');
  const footerNow = data.now ? `<a class="footer-link icon-label" href="/#now">${icon('clock')}Now</a>` : '';
  const google = googleAnalytics(data, origin, ready);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#F2EDE3">
  <title>${escape(title)}</title>
  <meta name="description" content="${escape(page.description)}">
  <meta name="robots" content="${ready && !missing ? (page.noindex ? 'noindex,follow' : 'index,follow') : 'noindex,nofollow'}">
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
  <link rel="stylesheet" href="/icons.css">
  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="/navigation-motion.css">
  <script src="/navigation-motion.js" blocking="render"></script>
  ${portfolioFeatures ? portfolioAssets : ''}
  ${journey ? journeyAssets : ''}
  ${home ? '<link rel="stylesheet" href="/intro.css">\n  <script src="/intro.js" defer blocking="render"></script>' : ''}
  ${contact ? '<link rel="stylesheet" href="/contact.css">\n  <script src="/contact.js" defer></script>\n  <script src="/contact-card.js" type="module"></script>' : ''}
  ${data.now ? commandAssets : ''}
  ${searchAssets}
  ${home && data.now ? '<script src="/now-editor.js" defer></script>' : ''}
  <script src="/site.js" defer></script>
  ${headerAssets}
  ${clarityTag(data, origin, ready)}
  ${google.head}
</head>
<body${contact ? ' class="contact-document"' : journey ? ' class="journey-document"' : ''}>
  ${home ? welcome(data) : ''}
  <a class="skip" href="#main">Skip to content</a>
  ${preview ? '<aside class="preview-notice" aria-label="Development preview">Private design preview · Sample content for layout review</aside>' : ''}
  <header class="site-header" data-blended-header>
    <div class="container header-inner">
      <a class="wordmark" href="/"><span>${escape(data.name)}</span></a>
      <div class="header-search-tools">${searchLink(false, page.path === '/search/')}${navigation.length > 1 ? `<button class="menu" aria-controls="navigation" aria-expanded="false" hidden>Menu${toggleIcon('list', 'x')}</button>` : ''}</div>
      ${navigation.length > 1 ? `<nav class="nav" id="navigation" aria-label="Primary">${links}</nav>` : ''}
    </div>
  </header>
  <main class="${home ? 'home-page' : about ? 'about-main' : journey ? 'journey-main' : 'container'}" id="main" tabindex="-1">${page.body}</main>
  <footer class="site-footer"><div class="container footer-inner">
    <div class="footer-identity">
      <a class="footer-name" href="/">${escape(data.name)}</a>
      <small>© <span data-year>${new Date().getFullYear()}</span></small>
      ${google.notice}
    </div>
    ${footerPages.length || footerContact || footerNow ? `<nav class="footer-nav" aria-label="Footer">
      ${footerPages.map(item => `<a class="footer-link icon-label" href="${item.path}">${pageIcons[item.path] ? icon(pageIcons[item.path]) : ''}${item.path === '/writing/' ? 'Writing' : escape(item.label)}</a>`).join('')}
      ${footerNow}
      ${footerContact ? action('/contact/', 'Get in touch', 'button-link footer-contact', '', 'envelope-simple') : ''}
    </nav>` : ''}
  </div></footer>
  ${portfolioFeatures ? sectionLinkDialog : ''}
  ${data.now ? commandPalette : ''}
  ${searchDialog}
</body>
</html>`;
}
