import assert from 'node:assert/strict';
import { once } from 'node:events';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { browser, waitFor } from './browser-client.mjs';
import { createSiteServer } from './server.mjs';

const server = createSiteServer(resolve('dist')).listen(0, '127.0.0.1');
await once(server, 'listening');
const origin = 'http://127.0.0.1:' + server.address().port;
let chrome;
try {
  chrome = await browser();
  const errors = [];
  chrome.listeners.push(event => {
    if (event.method === 'Runtime.exceptionThrown') errors.push(event.params.exceptionDetails.exception?.description || event.params.exceptionDetails.text);
  });
  await chrome.call('Page.enable');
  await chrome.call('Runtime.enable');
  await chrome.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await chrome.call('Page.addScriptToEvaluateOnNewDocument', { source: `
    const originalFetch = window.fetch.bind(window);
    window.searchCalls = 0;
    window.fetch = async (url, options) => {
      if (url === '/api/search') {
        if (options?.method !== 'POST') return Response.json({ available: true });
        window.searchCalls++;
        if (window.searchMock === 'quota') return new Response(null, { status: 429 });
        if (window.searchMock === 'offline') throw new TypeError('offline');
        if (window.searchMock === 'stream') return new Response(
          JSON.stringify({ passage: { recordId: 'education-igcses', text: 'Verified excerpt.' } }) + '\\n' +
          JSON.stringify({ done: true, answered: true }) + '\\n');
        return Response.json({ available: false }, { status: 503 });
      }
      if (url === '/api/search-now') return Response.json({ revision: 2, passages: ['Latest live Now entry.'] });
      return originalFetch(url, options);
    };
  ` });
  const evaluate = expression => chrome.evaluate(expression);
  const open = () => evaluate("document.querySelector('.search-dialog').open");
  const setQuery = query => evaluate(`(() => {
    const input = document.querySelector('.portfolio-search input');
    input.value = ${JSON.stringify(query)};
    input.dispatchEvent(new Event('input'));
    input.form.requestSubmit();
  })()`);
  async function status(text) {
    try {
      await waitFor(() => evaluate(`document.querySelector('[data-search-status]').textContent.includes(${JSON.stringify(text)})`), text);
    } catch (error) {
      throw new Error(error.message + '. Actual: ' + await evaluate("document.querySelector('[data-search-status]').textContent") +
        '. Mock calls: ' + await evaluate('window.searchCalls') + '. Browser errors: ' + errors.join(', '));
    }
  }
  const noOverflow = () => evaluate('document.documentElement.scrollWidth <= innerWidth');

  await chrome.navigate(origin + '/', 1280);
  assert.equal(await evaluate('window.searchCalls'), 0);
  await chrome.key('k', 'KeyK', 75, 2);
  assert.equal(await open(), true);
  await waitFor(() => evaluate("document.querySelector('[data-search-suggestions] button') !== null"), 'quick suggestions');
  await chrome.key('ArrowDown', 'ArrowDown', 40);
  assert.match(await evaluate('document.activeElement.textContent'), /educational background/);
  await chrome.key('Enter', 'Enter', 13);
  await waitFor(() => evaluate("location.pathname === '/search/' && document.querySelector('.search-passage')").catch(() => false), 'query handoff');
  assert.equal(await evaluate('location.search + location.hash'), '');
  assert.match(await evaluate("document.querySelector('[data-search-answer]').textContent"), /education includes.*Levels/s);
  assert.equal(await evaluate("document.querySelector('.search-passage a').getAttribute('href').startsWith('/about/#')"), true);
  assert.equal(await noOverflow(), true);
  if (process.env.PORTFOLIO_SEARCH_CAPTURE) {
    const image = await chrome.call('Page.captureScreenshot', { format: 'png' });
    await writeFile(process.env.PORTFOLIO_SEARCH_CAPTURE, Buffer.from(image.data, 'base64'));
  }
  await evaluate("window.searchMock = 'quota'");
  await setQuery('What are his career ambitions?');
  await status('reached its limit');
  assert.match(await evaluate("document.querySelector('.search-passage').textContent"), /Looking ahead/);
  await evaluate("window.searchMock = 'offline'");
  await setQuery('What is he currently working on?');
  await status('Gemini is unavailable');
  assert.match(await evaluate("document.querySelector('[data-search-answer]').textContent"), /Latest live Now entry/);
  await evaluate("window.searchMock = 'stream'");
  await setQuery('What is his educational background?');
  await status('Answer ready');
  assert.match(await evaluate("document.querySelector('[data-search-answer]').textContent"), /Verified excerpt/);
  assert.equal(await evaluate("document.querySelector('[data-search-gemini]').hidden"), false);
  const calls = await evaluate('window.searchCalls');
  await setQuery('How do I bake sourdough?');
  await status('doesn’t have enough information');
  await setQuery('x'.repeat(241));
  await status('Enter a search');
  assert.equal(await evaluate('window.searchCalls'), calls);
  await setQuery('German');
  await status('matching result');
  assert.match(await evaluate("document.querySelector('[data-search-results] li').textContent"), /Languages/);
  assert.equal(await evaluate('window.searchCalls'), calls);
  await chrome.key('k', 'KeyK', 75, 4);
  assert.equal(await open(), true);
  await waitFor(() => evaluate("document.querySelector('[data-search-suggestions]').textContent.includes('Recent searches')"), 'local search history');
  await evaluate("document.querySelector('.search-history-clear').click()");
  assert.equal(await evaluate("localStorage.getItem('portfolio-recent-searches')"), null);
  await chrome.key('Escape', 'Escape', 27);
  assert.equal(await open(), false);

  for (const width of [320, 390, 768, 880, 900]) {
    for (const path of ['/search/', '/writing/']) {
      await chrome.navigate(origin + path, width);
      assert.equal(await noOverflow(), true, path + ' at ' + width);
    }
  }
  await chrome.navigate(origin + '/about/', 390);
  await chrome.call('Emulation.setTouchEmulationEnabled', { enabled: true });
  const point = await evaluate(`(() => {
    const rect = document.querySelector('.header-search-tools [data-search-open]').getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  })()`);
  await chrome.call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
  await chrome.call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await waitFor(open, 'first tap opens mobile search');
  assert.equal(await evaluate('document.activeElement.id'), 'portfolio-search-dialog');
  assert.equal(await evaluate("document.querySelector('.search-dialog').scrollWidth <= innerWidth"), true);
  assert.deepEqual(errors, []);
  console.log('Search browser checks passed for keyboard and touch, history, answers, streaming, quota and network fallback, and five responsive widths.');
} finally {
  if (chrome) await chrome.close();
  await new Promise(resolve => server.close(resolve));
}
