import { escape, image, paragraphs, safeLink } from './components.mjs';
import { commandAssets, commandPalette } from './commands.mjs';
import { clarityTag, googleAnalytics } from './analytics.mjs';
import excerpt from '../content/eleventh-rehearsal.json' with { type: 'json' };

const slug = 'the-eleventh-rehearsal';
export const novelPath = '/writing/';
export const oldNovelPath = `/writing/${slug}/`;

export function findNovel(writing) {
  const [book] = writing;
  return writing.length === 1 && book.slug === slug && book.image ? book : null;
}

function excerptParagraphs(paragraphs) {
  return paragraphs.map(paragraph => {
    if (typeof paragraph === 'string') return `<p>${escape(paragraph)}</p>`;
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
          <span class="title-leaf-rule"></span>
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
        <button type="button" data-page-step="-1"><span aria-hidden="true">←</span> Previous</button>
        <p role="status" aria-atomic="true" data-page-status></p>
        <button type="button" data-page-step="1">Next <span aria-hidden="true">→</span></button>
      </div>
    </div>`;
}

export function novelContent(book, author) {
  return `
    <section class="novel-hero" aria-labelledby="novel-title">
      <div class="novel-hero-copy">
        <p class="novel-label">A psychological thriller</p>
        <h1 id="novel-title"><span>The Eleventh</span> <em>Rehearsal</em></h1>
        <p class="novel-byline">By ${escape(author)}</p>
        <p class="novel-hook">${escape(book.description)}</p>
        <div class="novel-hero-actions">
          <a class="novel-button" href="#excerpt" data-open-reader>Open the book <span aria-hidden="true">↗</span></a>
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

    <section class="novel-synopsis" id="synopsis" aria-labelledby="synopsis-title" tabindex="-1">
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
          <a class="novel-text-link" href="#excerpt" data-open-reader>Start reading <span aria-hidden="true">↗</span></a>
        </div>
      </div>
    </section>

    <section class="novel-excerpt" id="excerpt" aria-labelledby="excerpt-title" tabindex="-1">
      <div class="novel-wrap excerpt-wrap">
        <header class="excerpt-heading">
          <p class="novel-label">An excerpt</p>
          <h2 id="excerpt-title">The opening pages</h2>
          <p class="excerpt-chapter">Chapter one <span aria-hidden="true">/</span> ${escape(excerpt.chapter)}</p>
        </header>
        <div data-inline-reader>${reader(book, author)}</div>
      </div>
    </section>
    <dialog class="novel-reader-dialog" aria-label="The Eleventh Rehearsal excerpt">
      <div class="reader-dialog-inner">
        <div class="reader-top">
          <button type="button" data-close-reader><span aria-hidden="true">←</span> Back to the novel</button>
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
  ${origin ? `<link rel="canonical" href="${escape(origin + page.path)}"><meta property="og:image" content="${escape(origin)}${cover}">` : ''}
  <link rel="icon" href="/favicon.svg?v=2" type="image/svg+xml">
  <link rel="preload" href="/fonts/welcome-editorial.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/novel.css">
  <script src="/novel.js" defer blocking="render"></script>
  ${data.now ? commandAssets : ''}
  ${clarityTag(data, origin, ready)}
  ${google.head}
</head>
<body class="novel-page">
  <a class="novel-skip" href="#main">Skip to content</a>
  <header class="novel-header">
    <div class="novel-header-inner">
      <a class="novel-back" href="/"><span aria-hidden="true">←</span> Portfolio</a>
      <span class="novel-imprint" aria-hidden="true">XI</span>
      <nav aria-label="The novel">
        <a href="#synopsis">Synopsis</a>
        <a href="#excerpt">Excerpt</a>
      </nav>
    </div>
  </header>
  <main id="main" tabindex="-1" class="novel-main">${page.body}</main>
  <footer class="novel-footer novel-wrap">
    <div><p>${escape(page.label)}</p><span>A novel in progress by ${escape(data.name)}</span>${google.controls}</div>
    <a class="novel-text-link" href="/">Back to the portfolio <span aria-hidden="true">↗</span></a>
  </footer>
  ${data.now ? commandPalette : ''}
</body>
</html>`;
}
