import { briefPassage, evidenceFor, looksPrivate, matchPortfolio, searchLimit, searchQuestion, streamLines, words } from './search-core.js';

const dialog = document.querySelector('.search-dialog');
const page = document.querySelector('.portfolio-search');
const dialogInput = dialog.querySelector('[data-search-input]');
const panel = dialog.querySelector('[data-search-suggestions]');
const localKey = 'portfolio-recent-searches';
const handoffKey = 'portfolio-search-handoff';
const mac = /Mac|iPhone|iPad/.test(navigator.userAgentData?.platform || navigator.platform);
const compact = matchMedia('(max-width: 700px)');
let source, sourcePromise, nowPromise, availability;
let returnFocus;
let currentRequest;
let resultsRevision = 0;
let browsing = true;
const answers = new Map();

const el = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
};

function loadIndex() {
  return sourcePromise ||= fetch('/search-index.json', { signal: AbortSignal.timeout(7000) })
    .then(response => {
      if (!response.ok) throw new Error('Search index unavailable');
      return response.json();
    }).then(index => (source = index)).catch(() => { sourcePromise = undefined; });
}

function loadNow() {
  const record = source?.records.find(item => item.id === 'now');
  if (!record) return;
  return nowPromise ||= fetch('/api/search-now', { signal: AbortSignal.timeout(3500) }).then(async response => {
    if (response.status === 404) return;
    const note = response.ok ? await response.json() : { passages: [] };
    if (note.revision || !response.ok) record.passages = note.passages;
  }).catch(() => {});
}

function readRecents() {
  try {
    const saved = JSON.parse(localStorage.getItem(localKey));
    return Array.isArray(saved) ? saved.filter(value => typeof value === 'string' && value.length <= searchLimit && !looksPrivate(value)).slice(0, 5) : [];
  } catch { return []; }
}

function remember(value) {
  if (looksPrivate(value)) return;
  try { localStorage.setItem(localKey, JSON.stringify([value, ...readRecents().filter(item => item.toLowerCase() !== value.toLowerCase())].slice(0, 5))); }
  catch { /* Search is usable with storage disabled. */ }
}

function marks(id) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'site-icon');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('aria-hidden', 'true');
  const ref = document.createElementNS(ns, 'use');
  ref.setAttribute('href', '/icons/phosphor-regular.svg#' + id);
  svg.append(ref);
  return svg;
}

function recordLink(record, summary = false, query = '') {
  const link = el('a');
  link.href = record.href;
  const copy = el('span');
  copy.append(el('strong', record.title));
  if (summary) {
    const terms = words(query);
    const snippet = record.passages.find(passage => terms.some(term => words(passage).includes(term))) || record.passages[0];
    if (snippet) copy.append(el('small', briefPassage(snippet, 155)));
  }
  link.append(copy, el('span', record.kind, 'search-result-kind'), marks('arrow-right'));
  return link;
}

function queryButton(question, icon = 'arrow-up-right') {
  const button = el('button', question);
  button.type = 'button';
  button.dataset.searchQuery = question;
  button.append(marks(icon));
  return button;
}

function list(items, className = 'search-list') {
  const ul = el('ul', '', className);
  for (const item of items) {
    const li = el('li');
    li.append(item);
    ul.append(li);
  }
  return ul;
}

function quickGroup(title, items) {
  if (!items.length) return;
  const group = el('section');
  group.append(el('h3', title, 'search-small-heading'), list(items));
  panel.append(group);
  return group;
}

function drawQuick() {
  if (!dialog.open) return;
  const query = dialogInput.value.trim();
  const records = source?.records || [];
  const primary = records.filter(record => record.kind === 'Page');
  panel.replaceChildren();
  if (query) {
    const found = matchPortfolio(records, query).slice(0, 5);
    if (found.length) quickGroup('Matching pages and sections', found.map(({ record }) => recordLink(record)));
    quickGroup(found.length ? 'Search' : 'No instant matches', [queryButton(query, 'magnifying-glass')]);
    return;
  }
  const recents = readRecents();
  const recentGroup = quickGroup('Recent searches', recents.map(value => queryButton(value, 'clock')));
  if (recentGroup) {
    const clear = el('button', 'Clear history', 'search-history-clear');
    clear.type = 'button';
    clear.addEventListener('click', () => {
      try { localStorage.removeItem(localKey); } catch { /* Storage is optional. */ }
      drawQuick();
      dialogInput.focus();
    });
    recentGroup.firstElementChild.append(clear);
  }
  quickGroup('Suggested questions', (source?.prompts || []).slice(0, 3).map(([question]) => queryButton(question)));
  quickGroup('Go to', primary.filter(record => record.id !== 'home').slice(0, 4).map(record => recordLink(record)));
  if (!source) panel.append(el('p', 'Loading the portfolio index…', 'search-status'));
}

function openSearch(trigger) {
  if (dialog.open || document.querySelector('dialog[open]') || typeof dialog.showModal !== 'function') return;
  returnFocus = trigger instanceof HTMLElement ? trigger : document.activeElement;
  dialogInput.value = '';
  updateClear(dialogInput);
  dialog.showModal();
  dialogInput.focus({ preventScroll: true });
  drawQuick();
  loadIndex().then(() => {
    if (!source && dialog.open) panel.replaceChildren(el('p', 'The search index is unavailable. Open the search page to browse the portfolio.', 'search-status'));
    else drawQuick();
  });
}

function submitQuick(raw) {
  const query = raw.trim();
  if (!query || query.length > searchLimit) return;
  if (page) {
    dialog.close();
    runSearch(query);
    return;
  }
  try {
    sessionStorage.setItem(handoffKey, JSON.stringify({ query, time: Date.now() }));
    location.assign('/search/');
  } catch {
    const results = matchPortfolio(source?.records || [], query).slice(0, 7);
    panel.replaceChildren();
    quickGroup('Search results', results.map(({ record }) => recordLink(record)));
    if (!results.length) panel.append(el('p', 'No matching pages. Try a shorter search.', 'search-status'));
    remember(query);
  }
}

function updateClear(input) {
  input.form.querySelector('[data-search-clear]').hidden = !input.value;
}

for (const link of document.querySelectorAll('[data-search-open]')) {
  if (typeof dialog.showModal === 'function') {
    link.setAttribute('aria-haspopup', 'dialog');
    link.setAttribute('aria-controls', dialog.id);
  }
  link.addEventListener('click', event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey ||
        typeof dialog.showModal !== 'function') return;
    event.preventDefault();
    openSearch(link);
  });
}
for (const key of document.querySelectorAll('[data-search-shortcut]')) key.textContent = mac ? '⌘ K' : 'Ctrl K';

document.addEventListener('keydown', event => {
  if (event.defaultPrevented || event.repeat || event.isComposing || event.altKey || event.shiftKey ||
      event.ctrlKey === event.metaKey || (event.code !== 'KeyK' && event.key.toLowerCase() !== 'k')) return;
  if (dialog.open) {
    event.preventDefault();
    dialog.close();
    return;
  }
  if (document.querySelector('dialog[open]') || event.target.closest?.('input:not([data-search-input]), textarea, select, [contenteditable]')) return;
  if (typeof dialog.showModal !== 'function') return;
  event.preventDefault();
  openSearch();
});

dialog.querySelector('[data-search-close]').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});
dialog.addEventListener('close', () => returnFocus?.focus?.({ preventScroll: true }));
dialog.addEventListener('keydown', event => {
  if (!['ArrowDown', 'ArrowUp'].includes(event.key) || event.altKey || event.ctrlKey || event.metaKey) return;
  const targets = [...panel.querySelectorAll('li > :is(a,button)')];
  const index = targets.indexOf(document.activeElement);
  if (!targets.length || index < 0 && document.activeElement !== dialogInput) return;
  event.preventDefault();
  if (event.key === 'ArrowDown') (targets[index + 1] || dialogInput).focus();
  else (index < 0 ? targets.at(-1) : targets[index - 1] || dialogInput).focus();
});

for (const form of document.querySelectorAll('[data-search-form]')) {
  const input = form.querySelector('input');
  const isQuick = dialog.contains(form);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (isQuick) submitQuick(input.value);
    else runSearch(input.value);
  });
  form.querySelector('[data-search-clear]').addEventListener('click', () => {
    input.value = '';
    input.dispatchEvent(new Event('input'));
    if (!isQuick) resetPage();
    input.focus();
  });
  input.addEventListener('input', () => {
    updateClear(input);
    if (isQuick) drawQuick();
    else if (find('status')?.textContent.endsWith('…')) {
      currentRequest?.abort();
      currentRequest = undefined;
      resultsRevision++;
      setStatus('');
    }
  });
}

document.addEventListener('click', event => {
  const button = event.target.closest('[data-search-query]');
  if (!button) return;
  if (dialog.contains(button)) submitQuick(button.dataset.searchQuery);
  else if (page?.contains(button)) {
    if (event.detail === 0) find('input').focus({ preventScroll: true });
    runSearch(button.dataset.searchQuery);
  }
});

const find = name => page?.querySelector('[data-search-' + name + ']');
const setStatus = value => { find('status').textContent = value; };

function showQuestions(prompts, related = false) {
  find('topic-title').textContent = related ? 'Explore further' : 'Suggested questions';
  const nodes = list(prompts.map(([question]) => queryButton(question)));
  find('questions').replaceChildren(...nodes.children);
}

function renderResults(records, heading, query = '') {
  find('results-title').textContent = heading;
  const nodes = list(records.map(record => recordLink(record, true, query)));
  find('results').replaceChildren(...nodes.children);
}

function layoutForWidth() {
  for (const input of document.querySelectorAll('[data-search-input]')) {
    input.placeholder = compact.matches ? 'Search the portfolio…' : 'Search my profile, projects and interests…';
  }
  const layout = page?.querySelector('.search-layout');
  if (!layout) return;
  const first = layout.querySelector(compact.matches && browsing ? '.search-aside' : '.search-main');
  if (layout.firstElementChild === first) return;
  const focused = first.contains(document.activeElement) ? document.activeElement : null;
  layout.prepend(first);
  focused?.focus({ preventScroll: true });
}
compact.addEventListener('change', layoutForWidth);
layoutForWidth();

function resetPage(showBrowse = true) {
  resultsRevision++;
  browsing = showBrowse;
  layoutForWidth();
  currentRequest?.abort();
  currentRequest = undefined;
  find('answer').hidden = true;
  find('passages').replaceChildren();
  find('gemini').hidden = true;
  setStatus('');
  if (source) {
    renderResults(source.records.filter(record => record.kind === 'Page'), 'Explore the portfolio');
    showQuestions(source.prompts);
  }
}

function appendPassage(record, text) {
  const passage = el('div', '', 'search-passage');
  const heading = el('h3');
  const link = el('a', record.title);
  link.href = record.href;
  heading.append(link);
  passage.append(heading, el('blockquote', text));
  find('passages').append(passage);
}

function renderAnswer(evidence) {
  find('passages').replaceChildren();
  find('gemini').hidden = true;
  find('answer').hidden = !evidence.length;
  if (evidence.length && evidence.every(({ record }) => record.kind === 'Education')) {
    const qualifications = new Intl.ListFormat('en-GB').format(evidence.map(({ record }) => record.title));
    find('passages').append(el('p', `${source.name}’s education includes ${qualifications}.`, 'search-answer-lead'));
  }
  for (const { record, passages } of evidence) {
    appendPassage(record, passages.slice(0, evidence.length < 3 ? 2 : 1).map(value => briefPassage(value, 360)).join('\n\n'));
  }
}

async function canUseGemini() {
  return availability ||= fetch('/api/search', { signal: AbortSignal.timeout(3500) })
    .then(response => response.ok ? response.json() : null)
    .then(payload => payload?.available === true).catch(() => false);
}

async function runSearch(raw) {
  const query = raw.trim().replace(/\s+/g, ' ');
  if (query.length < 2 || query.length > searchLimit) {
    setStatus('Enter a search between 2 and ' + searchLimit + ' characters.');
    find('input').focus();
    return;
  }
  resetPage(false);
  const revision = resultsRevision;
  find('input').value = query;
  updateClear(find('input'));
  remember(query);
  setStatus('Searching the portfolio…');
  const index = await loadIndex();
  if (resultsRevision !== revision) return;
  if (!index) {
    setStatus('The search index could not load. Try again shortly.');
    return;
  }
  if (index.records.some(record => record.id === 'now') && words(query).some(term => ['now', 'currently', 'working', 'current', 'study'].includes(term))) await loadNow();
  if (resultsRevision !== revision) return;
  const matches = matchPortfolio(index.records, query);
  const results = matches.slice(0, 8).map(({ record }) => record);
  const question = searchQuestion(query);
  const evidence = question ? evidenceFor(matches, query) : [];
  renderResults(results, question && evidence.length ? 'Related results' : 'Search results', query);
  renderAnswer(evidence);
  const topics = new Set(results.slice(0, 4).flatMap(record => [record.id, ...record.topics]));
  const followups = index.prompts.filter(([prompt]) => prompt.toLowerCase() !== query.toLowerCase())
    .sort((a, b) => Number(topics.has(b[1])) - Number(topics.has(a[1])));
  const related = results.find(record => ['Event', 'Experience', 'Course'].includes(record.kind));
  if (related) {
    const topicQuestion = related.kind === 'Course' ? 'What did he study in ' : 'What did he learn from ';
    const prompt = topicQuestion + related.title + '?';
    if (prompt.toLowerCase() !== query.toLowerCase() && prompt.length <= searchLimit) followups.unshift([prompt]);
  }
  showQuestions(followups.slice(0, 4), Boolean(results.length));
  if (!results.length || question && !evidence.length) {
    setStatus(question ? 'The portfolio doesn’t have enough information to answer that question.' : 'No matching pages. Try a shorter search or a different keyword.');
    return;
  }
  setStatus(results.length + (results.length === 1 ? ' matching result' : ' matching results'));
  if (!question || looksPrivate(query) || !await canUseGemini() || resultsRevision !== revision) return;
  find('privacy').hidden = false;
  const recordMap = new Map(index.records.map(record => [record.id, record]));
  const renderGemini = ({ recordId, text }) => {
    const record = recordMap.get(recordId);
    if (record && typeof text === 'string' && text.length <= 500) appendPassage(record, text);
  };
  if (answers.has(query)) {
    find('passages').replaceChildren();
    for (const row of answers.get(query)) renderGemini(row);
    find('gemini').hidden = false;
    return;
  }
  const request = new AbortController();
  currentRequest = request;
  setStatus('Finding the most relevant passages…');
  const rows = [];
  let finished = false;
  try {
    const response = await fetch('/api/search', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }),
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(15000)]),
    });
    if (response.status === 429) {
      if (resultsRevision === revision) setStatus('Gemini has reached its limit. The portfolio results are still available.');
      return;
    }
    if (!response.ok || !response.body) throw new Error('Gemini unavailable');
    for await (const line of streamLines(response.body, 32 * 1024)) {
      if (resultsRevision !== revision) return;
      const message = JSON.parse(line);
      if (message.error) throw new Error('Gemini unavailable');
      if (message.passage) {
        if (!rows.length) {
          find('passages').replaceChildren();
          find('gemini').hidden = false;
        }
        rows.push(message.passage);
        renderGemini(message.passage);
      }
      if (message.done) finished = true;
    }
    if (!finished) throw new Error('Gemini unavailable');
    if (rows.length) {
      if (answers.size >= 12) answers.delete(answers.keys().next().value);
      answers.set(query, rows);
      setStatus('Answer ready. ' + results.length + ' related results.');
    } else {
      find('answer').hidden = true;
      setStatus('The portfolio doesn’t have enough information to answer that question. Related pages are below.');
    }
  } catch {
    if (resultsRevision !== revision) return;
    renderAnswer(evidence);
    setStatus('Gemini is unavailable. The answer below uses the portfolio’s own pages.');
  } finally {
    if (currentRequest === request) currentRequest = undefined;
  }
}

if (page) {
  // A query stays out of the URL, referrers and analytics page titles.
  let query;
  try {
    const pending = JSON.parse(sessionStorage.getItem(handoffKey));
    sessionStorage.removeItem(handoffKey);
    if (pending && Date.now() - pending.time < 10000 && typeof pending.query === 'string') query = pending.query;
  } catch { /* Leave the initial navigation and suggestions available. */ }
  if (query) runSearch(query);
  else loadIndex();
  canUseGemini().then(enabled => { find('privacy').hidden = !enabled; });
}
