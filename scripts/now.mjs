import { escape, formatDate, icon, paragraphs } from './components.mjs';

export const nowLimit = 4000;
export const nowStart = '<!-- now:content -->';
export const nowEnd = '<!-- /now:content -->';
export const nowPreviewStart = '<!-- now:preview -->';
export const nowPreviewEnd = '<!-- /now:preview -->';

export function nowParagraphs(text) {
  return text.trim().replaceAll('\r\n', '\n').split(/\n[^\S\n]*\n/).map(part => part.trim()).filter(Boolean);
}

export function nowPreview(text) {
  const paragraph = nowParagraphs(text)[0]?.replace(/\s+/g, ' ') ?? '';
  const first = new Intl.Segmenter('en-GB', { granularity: 'sentence' })
    .segment(paragraph).containing(0)?.segment.trim() ?? '';
  const characters = Array.from(first);
  if (characters.length <= 122) return first;
  const excerpt = characters.slice(0, 121).join('');
  const boundary = excerpt.lastIndexOf(' ');
  return (boundary > 0 ? excerpt.slice(0, boundary) : excerpt) + '…';
}

export function renderNowPreview({ text }) {
  return `${nowPreviewStart}<p class="home-now-note"><a href="#now">
    <span class="home-now-note-label">Now</span>
    <span data-now-preview>${escape(nowPreview(text))}</span>
    ${icon('arrow-down', 'arrow-down')}
  </a></p>${nowPreviewEnd}`;
}

export function renderNowContent({ date, text, revision = 0 }) {
  return `${nowStart}
    <section class="home-section home-now" id="now" aria-labelledby="now-title" tabindex="-1" data-now-revision="${escape(revision)}" data-header-surface>
      <div class="container now-panel">
        <header class="now-heading">
          <h2 id="now-title">Now</h2>
          <p class="meta">${icon('clock')} Last updated <time datetime="${escape(date)}">${escape(formatDate(date))}</time></p>
        </header>
        <div class="reading now-copy">${paragraphs(nowParagraphs(text))}</div>
      </div>
    </section>
    ${nowEnd}`;
}

export function parseNow(content) {
  const [date, ...lines] = content.trim().split(/\r?\n/);
  const text = lines.join('\n').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !text.length || text.length > nowLimit) {
    throw new Error(`Start content/now.txt with a YYYY-MM-DD date and up to ${nowLimit} characters of text.`);
  }
  return { date, text };
}

export function nowSection(note) {
  return `${renderNowContent(note)}
    <dialog class="command-palette now-editor" aria-labelledby="now-editor-title" data-clarity-mask="true">
      <form class="command-form" data-now-form>
        <div class="command-heading">
          <h2 id="now-editor-title">Edit Now</h2>
          <button type="button" data-close-editor>Close</button>
        </div>
        <label for="now-editor-text">What are you doing now?</label>
        <textarea id="now-editor-text" rows="8" maxlength="${nowLimit}" aria-describedby="now-editor-help" required autofocus></textarea>
        <p class="command-feedback" id="now-editor-help">Separate paragraphs with a blank line.</p>
        <div class="now-draft-preview now-copy" hidden></div>
        <label for="now-editor-code">Publishing code</label>
        <input id="now-editor-code" type="password" maxlength="128" autocomplete="off" required>
        <button class="command-submit" type="submit">Publish update</button>
        <button class="command-unlock" type="button">Unlock Ctrl+K</button>
        <p class="command-feedback" role="status" data-editor-status></p>
      </form>
    </dialog>`;
}
