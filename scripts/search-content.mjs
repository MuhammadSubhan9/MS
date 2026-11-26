import { escape, icon } from './components.mjs';
import { nowParagraphs, parseNow } from './now.mjs';

export const searchAssets = '<link rel="stylesheet" href="/search.css">\n  <script src="/search.js" type="module"></script>';

const prompts = [
  ['What is his educational background?', 'education'],
  ['What are his career ambitions?', 'direction'],
  ['What experiences has he written about?', 'experience'],
  ['What are his main interests?', 'interests'],
  ['What skills has he developed?', 'skills'],
  ['What is he currently working on?', 'now'],
];

export function makeSearchIndex(data, pages) {
  const records = [];
  const byPath = new Map(pages.map(page => [page.path, page]));
  const add = (id, title, href, kind, topics, ...text) => {
    const [path, hash] = href.split('#');
    if (!byPath.has(path) || hash && !byPath.get(path).body.includes(`id="${hash}"`)) return;
    const passages = text.flat().filter(value => typeof value === 'string' && value.trim()).map(value => value.trim());
    records.push({ id, title, href, kind, topics, passages });
  };
  for (const [id, path, aliases] of [
    ['home', '/', ['profile', 'bio']],
    ['about', '/about/', ['biography', 'profile']],
    ['journey', '/journey/', ['timeline', 'milestones']],
    ['work', '/work/', ['projects', 'events', 'experience', 'experiences', 'written']],
    ['writing', '/writing/', ['writing', 'fiction', 'novel']],
    ['contact', '/contact/', ['contact', 'email', 'linkedin']],
  ]) {
    const page = byPath.get(path);
    if (page) add(id, page.label, path, 'Page', aliases, page.description);
  }
  for (const item of data.education) {
    add('education-' + item.id, item.title, '/about/#' + item.id, 'Education', ['education', 'school', 'background', 'study', 'studies', 'subjects'],
      [item.institution, item.date, item.status].filter(Boolean).join(' · '), item.subjects?.join(', '), item.description);
  }
  add('direction', 'Looking ahead', '/journey/#looking-ahead', 'Ambitions', ['career', 'future', 'ambitions', 'ambition', 'law'], data.futureDirection);
  add('interests', 'Interests', '/about/#interests', 'Profile', ['interests', 'interest', 'hobbies'], data.interests);
  add('languages', 'Languages', '/about/#languages', 'Profile', ['languages', 'language'], (data.languages || []).map(language =>
    [language.name, language.description, Number.isInteger(language.duolingoScore) ? `Duolingo score ${language.duolingoScore}` : ''].filter(Boolean).join(' · ')));
  for (const item of data.capabilities || []) {
    add('skill-' + records.length, item.title, '/about/#capabilities', 'Capability', ['skills', 'capabilities', 'skills developed'],
      item.summary || item.application);
  }
  for (const item of data.courses || []) {
    add('course-' + item.id, item.title, '/about/#' + item.id, 'Course', ['courses', 'certificate', 'credential', ...(item.evidence?.topics || [])],
      item.institution, item.details);
  }
  for (const item of data.projects) {
    const href = '/work/' + item.slug + '/';
    add('experience-' + item.slug, item.title, byPath.has(href) ? href : '/work/', item.kind === 'event' ? 'Event' : 'Experience',
      ['experience', 'experiences', 'projects', 'written', ...(item.evidence?.topics || [])],
      item.description, item.body || [], (item.sections || []).flatMap(section => section.paragraphs || []));
  }
  for (const item of data.writing) {
    const path = '/writing/' + item.slug + '/';
    add('writing-' + item.slug, item.title, byPath.has(path) && !byPath.get(path).redirect ? path : '/writing/', 'Writing',
      ['writing', 'fiction', 'novel'], item.description, data.writingPractice, item.synopsis || item.body || []);
  }
  if (data.now && byPath.get('/')?.body.includes('id="now"')) {
    add('now', 'Now', '/#now', 'Current work', ['now', 'currently', 'working', 'current work'], nowParagraphs(parseNow(data.now).text));
  }
  return { name: data.name, records, prompts: prompts.filter(([, topic]) => records.some(record => record.id === topic || record.topics.includes(topic))) };
}

export function searchPage(index) {
  return `<div class="portfolio-search" data-clarity-mask="true">
    <header class="search-intro">
      <h1>Search the portfolio</h1>
      <p class="lead">Explore ${escape(index.name)}’s education, experiences and interests. Search by topic or ask a question.</p>
    </header>
    ${searchForm('page')}
    <p class="search-status" role="status" data-search-status></p>
    <div class="search-layout">
      <div class="search-main">
        <section data-search-answer hidden class="search-answer" aria-labelledby="search-answer-heading">
          <div class="search-answer-heading"><h2 id="search-answer-heading">Answer</h2><span data-search-gemini hidden>Powered by Gemini</span></div>
          <div data-search-passages></div>
        </section>
        <section aria-labelledby="search-results-heading" class="search-results">
          <h2 id="search-results-heading" data-search-results-title>Explore the portfolio</h2>
          <ul class="search-list" data-search-results>${index.records.filter(record => record.kind === 'Page').map(record => `
            <li><a href="${escape(record.href)}"><span><strong>${escape(record.title)}</strong><small>${escape(record.passages[0])}</small></span>${icon('arrow-right')}</a></li>
          `).join('')}</ul>
        </section>
      </div>
      <aside class="search-aside" aria-labelledby="search-topics-heading">
        <h2 id="search-topics-heading" data-search-topic-title>Suggested questions</h2>
        <ul class="search-list search-questions" data-search-questions>${index.prompts.map(([question]) => `
          <li><button type="button" data-search-query="${escape(question)}">${escape(question)}${icon('arrow-up-right')}</button></li>
        `).join('')}</ul>
        <p class="search-privacy" data-search-privacy hidden>Questions answered by Gemini are sent to Google. Leave out private information.</p>
      </aside>
    </div>
  </div>`;
}

function searchForm(id) {
  return `<form class="search-form" action="/search/" role="search" data-search-form>
    <label class="search-label" for="portfolio-search-${id}">Search the portfolio</label>
    <div class="search-field">
      ${icon('magnifying-glass')}
      <input id="portfolio-search-${id}" type="search" placeholder="Search my profile, projects and interests…" maxlength="240" autocomplete="off" enterkeyhint="search" data-search-input>
      <button class="search-clear" type="button" data-search-clear aria-label="Clear search" hidden>${icon('x')}</button>
      <button class="search-submit" type="submit">Search ${icon('arrow-right')}</button>
    </div>
  </form>`;
}

export const searchDialog = `<dialog class="search-dialog" id="portfolio-search-overlay" aria-labelledby="search-dialog-title" data-clarity-mask="true">
  <div class="search-dialog-top"><h2 id="search-dialog-title">Search the portfolio</h2><button class="search-close" type="button" data-search-close aria-label="Close search">${icon('x')}</button></div>
  ${searchForm('dialog')}
  <div data-search-suggestions class="search-dialog-content"></div>
  <div class="search-dialog-foot"><span>Use ↑ ↓ to move and Enter to select</span><a href="/search/">Open search page ${icon('arrow-up-right')}</a></div>
</dialog>`;

export function searchLink(full = false, current = false) {
  return `<a class="search-launch${full ? ' search-launch-full' : ''}" href="/search/"${current ? ' aria-current="page"' : ''} data-search-open aria-label="Search the portfolio">${icon('magnifying-glass')}${full ? '<span>Search my profile, projects and interests…</span><kbd data-search-shortcut>Ctrl K</kbd>' : ''}</a>`;
}
