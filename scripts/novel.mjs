import { copySectionButton, escape, headerAssets, icon, image, paragraphs, safeLink } from './components.mjs';
import { commandAssets, commandPalette } from './commands.mjs';
import { clarityTag, googleAnalytics } from './analytics.mjs';
import excerpt from '../content/eleventh-rehearsal.json' with { type: 'json' };
import { portfolioAssets, sectionLinkDialog } from './portfolio-features.mjs';

const slug = 'the-eleventh-rehearsal';
export const novelPath = '/writing/';
export const oldNovelPath = `/writing/${slug}/`;

export function findNovel(writing) {
  const [book] = writing;
  return writing.length === 1 && book.slug === slug && book.image ? book : null;
}

function excerptParagraphs(paragraphs) {
  return paragraphs.map(paragraph => {
    if (typeof paragraph === 'string') return `<p>${escape(paragraph).replace(/\*([^*]+)\*/g, '<em>$1</em>')}</p>`;
    const className = {
      subject: 'leaf-subject', email: 'leaf-email', record: 'leaf-record',
    }[paragraph.kind];
    return `<p class="${className}">${escape(paragraph.text)}</p>`;
  }).join('');
}

function reader(book, author) {
  const pages = excerpt.pages.map((page, index) => `
    <section class="reader-leaf manuscript-leaf" data-leaf="${index + 1}" aria-label="Page ${index + 1}">
      <div class="leaf-heading">${index === 0
        ? `<p class="leaf-kicker">${escape(excerpt.part)}</p><h3>${escape(excerpt.chapter)}</h3>`
        : `<p class="leaf-running-title" aria-hidden="true">${escape(book.title)}</p>`}</div>
      <div class="leaf-copy">${excerptParagraphs(page)}</div>
      <p class="leaf-number" aria-hidden="true">${index + 1}</p>
    </section>`).join('');

  return `
    <div class="book-reader" data-reader>
      <div class="reader-spread" data-spread>
        <div class="reader-leaf title-leaf" data-leaf="0" aria-hidden="true">
          <span class="imprint-stamp" aria-hidden="true">XI</span>
          <p>${escape(book.title)}</p>
          <span>${escape(author)}</span>
        </div>
        ${pages}
        <div class="reader-leaf end-leaf" data-leaf="${excerpt.pages.length + 1}">
          <span class="title-leaf-rule"></span>
          <p>End of excerpt</p>
          <span>The novel is in progress.</span>
        </div>
      </div>
      <div class="reader-controls" role="group" aria-label="Excerpt pages" hidden>
        <button type="button" data-page-step="-1">${icon('arrow-left')} Previous</button>
        <p role="status" aria-atomic="true" data-page-status></p>
        <button type="button" data-page-step="1">Next ${icon('arrow-right')}</button>
      </div>
    </div>`;
}

export function novelContent(book, author) {
  return `
    <section class="novel-hero" aria-labelledby="novel-title" data-header-surface="dark">
      <div class="novel-hero-copy">
        <p class="novel-label">A psychological thriller</p>
        <h1 id="novel-title"><span>The Eleventh</span> <em>Rehearsal</em></h1>
        <p class="novel-byline">By ${escape(author)}</p>
        <p class="novel-hook">${escape(book.description)}</p>
        <div class="novel-hero-actions">
          <a class="novel-button" href="#excerpt" data-open-reader>Open the book ${icon('book-open-text')}</a>
          <a class="novel-text-link" href="#release-updates">Release updates ${icon('arrow-down')}</a>
        </div>
      </div>
      <div class="novel-shelf">
        <div class="shelf-world">
          <img class="shelf-image" src="/images/rehearsal-library-1536.webp"
            srcset="/images/rehearsal-library-960.webp 960w, /images/rehearsal-library-1536.webp 1536w"
            sizes="(max-width: 780px) 960px, 100vw" width="1536" height="1024"
            alt="" decoding="async" fetchpriority="high">
          <div class="shelf-light" aria-hidden="true"></div>
          <div class="shelf-slot">
            <a class="shelf-book" href="#excerpt" data-open-reader aria-label="Open the cover of ${escape(book.title)}">
              <div class="shelf-book-object">
                ${image(book.image, { eager: true, sizes: '(max-width: 780px) 190px, 310px' })}
                <span class="shelf-book-spine" aria-hidden="true">The Eleventh Rehearsal</span>
                <span class="shelf-book-fore-edge" aria-hidden="true"></span>
                <span class="shelf-book-bottom" aria-hidden="true"></span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>

    <section class="novel-synopsis" id="synopsis" aria-labelledby="synopsis-title" tabindex="-1" data-share-section data-header-surface="dark">
      <div class="synopsis-still">
        <img src="/images/rehearsal-conservatory-1280.webp"
          srcset="/images/rehearsal-conservatory-768.webp 768w, /images/rehearsal-conservatory-1280.webp 1280w"
          sizes="100vw" width="1280" height="853" alt="" loading="lazy" decoding="async">
      </div>
      <div class="novel-wrap synopsis-inner">
        <div class="synopsis-title">
          <p class="novel-label">Synopsis</p>
          <h2 id="synopsis-title">What did he hear?<br><em>What was he taught to say?</em></h2>
        </div>
        <div class="synopsis-copy">
          ${paragraphs(book.synopsis || book.body)}
          <div class="novel-waveform" aria-hidden="true" hidden>
            <canvas width="680" height="118" data-waveform></canvas>
          </div>
          <div class="novel-section-actions">
            <a class="novel-text-link" href="#excerpt" data-open-reader>Start reading ${icon('book-open-text')}</a>
            ${copySectionButton('synopsis', 'the synopsis')}
          </div>
        </div>
      </div>
    </section>

    <section class="novel-excerpt" id="excerpt" aria-labelledby="excerpt-title" tabindex="-1" data-share-section data-header-surface="dark">
      <div class="novel-wrap excerpt-wrap">
        <header class="excerpt-heading">
          <div>
            <p class="novel-label">Excerpt</p>
            <h2 id="excerpt-title">The opening pages</h2>
          </div>
          <div class="excerpt-details">
            <p class="excerpt-chapter">Chapter one <span aria-hidden="true">/</span> <em>${escape(excerpt.chapter)}</em></p>
            ${copySectionButton('excerpt', 'the opening pages')}
          </div>
        </header>
        <div data-inline-reader>${reader(book, author)}</div>
      </div>
    </section>
    <section class="novel-release" id="release-updates" aria-labelledby="release-title" tabindex="-1" data-header-surface="dark">
      <div class="novel-wrap release-layout">
        <div class="release-copy">
          <p class="novel-label">The release announcement</p>
          <h2 id="release-title">The next chapter,<br><em>in your inbox.</em></h2>
          <p>I’m still writing <cite>The Eleventh Rehearsal</cite>. Leave your email and I’ll let you know when it’s released.</p>
        </div>
        <form class="novel-release-form" action="/api/novel/subscribe" method="post" data-clarity-mask="true">
          <label for="release-email">Email address</label>
          <input id="release-email" name="email" type="email" autocomplete="email" maxlength="254" placeholder="you@example.com" required>
          <div class="release-honey" aria-hidden="true">
            <label for="release-website">Website</label>
            <input id="release-website" name="website" type="text" tabindex="-1" autocomplete="off">
          </div>
          <label class="release-consent"><input name="consent" type="checkbox" value="yes" required>
            <span>Email me to confirm my address and let me know when <cite>The Eleventh Rehearsal</cite> is released.</span>
          </label>
          <button class="novel-button" type="submit">Notify me ${icon('bell-simple')}</button>
          <p class="release-status" role="status" aria-atomic="true">${icon('check')}<span data-release-message></span></p>
          <details class="release-privacy">
            <summary>${icon('caret-down', 'disclosure-caret')}About this signup</summary>
            <p>Your email is stored on Cloudflare for this announcement. Only readers who confirm by email will receive it. The list will be deleted within 30 days after release. You can unsubscribe through the link in the release email, or <a href="mailto:ms@ahmadbaqa.com">contact me</a> to remove your address sooner.</p>
          </details>
        </form>
      </div>
    </section>
    <dialog class="novel-reader-dialog" aria-label="The Eleventh Rehearsal excerpt">
      <div class="reader-dialog-inner">
        <div class="reader-top">
          <button type="button" data-close-reader>${icon('arrow-left')} Back to the novel</button>
          <p>${escape(excerpt.chapter)}</p>
        </div>
        <div data-dialog-reader></div>
      </div>
    </dialog>`;
}

export function renderNovelPage({ data, page, origin, ready }) {
  const title = `${page.label} · ${data.name}`;
  const cover = safeLink(page.cover);
  const google = googleAnalytics(data, origin, ready);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#110f0c">
  <title>${escape(title)}</title>
  <meta name="description" content="${escape(page.description)}">
  <meta name="robots" content="${ready ? 'index,follow' : 'noindex,nofollow'}">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(page.description)}">
  <meta property="og:type" content="book">
  <meta name="twitter:card" content="summary_large_image">
  ${origin ? `<meta property="og:url" content="${escape(origin + page.path)}">` : ''}
  ${origin ? `<link rel="canonical" href="${escape(origin + page.path)}"><meta property="og:image" content="${escape(origin)}${cover}">` : ''}
  <link rel="icon" href="/favicon.svg?v=5" type="image/svg+xml">
  <link rel="preload" href="/fonts/welcome-editorial.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/icons.css">
  <link rel="stylesheet" href="/novel.css">
  <link rel="stylesheet" href="/navigation-motion.css">
  <script src="/navigation-motion.js" blocking="render"></script>
  ${portfolioAssets}
  <script src="/novel.js" defer blocking="render"></script>
  ${headerAssets}
  <script src="/novel-subscription.js" defer></script>
  ${data.now ? commandAssets : ''}
  ${clarityTag(data, origin, ready)}
  ${google.head}
</head>
<body class="novel-page">
  <a class="novel-skip" href="#main">Skip to content</a>
  <header class="novel-header" data-blended-header>
    <div class="novel-header-inner novel-wrap">
      <a class="novel-back" href="/"><span class="novel-back-arrow" aria-hidden="true">${icon('arrow-left')}</span> Portfolio</a>
      <a class="novel-imprint" href="#main" aria-label="${escape(page.label)}, back to top">
        <span class="imprint-stamp" aria-hidden="true">XI</span>
        <span class="novel-imprint-name">${escape(page.label)}</span>
      </a>
      <nav class="novel-index" aria-label="Novel sections">
        <a href="#synopsis">${icon('text-align-left')}Synopsis</a>
        <a href="#excerpt">${icon('book-open-text')}Excerpt</a>
        <a href="#release-updates">${icon('bell-simple')}Release updates</a>
      </nav>
    </div>
  </header>
  <main id="main" tabindex="-1" class="novel-main">${page.body}</main>
  <footer class="novel-footer novel-wrap">
    <div class="novel-colophon">
      <span class="imprint-stamp" aria-hidden="true">XI</span>
      <div>
        <p>${escape(page.label)}</p>
        <span>A novel in progress by ${escape(data.name)}</span>
        ${google.notice}
      </div>
    </div>
    <div class="novel-footer-links">
      <a class="novel-text-link" href="#main">Back to top ${icon('arrow-up')}</a>
      <a class="novel-text-link" href="/">Portfolio ${icon('arrow-up-right')}</a>
    </div>
  </footer>
  ${sectionLinkDialog}
  ${data.now ? commandPalette : ''}
</body>
</html>`;
}
