import assert from 'node:assert/strict';
import { once } from 'node:events';
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
    if (event.method === 'Runtime.exceptionThrown') errors.push(event.params.exceptionDetails.text);
  });
  await chrome.call('Runtime.enable');
  await chrome.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  for (const route of ['/', '/about/', '/journey/', '/work/', '/writing/', '/contact/']) {
    await chrome.navigate(origin + route, 320);
    assert.equal(await chrome.evaluate('document.documentElement.scrollWidth <= innerWidth'), true, route);
  }
  await chrome.call('Browser.setDownloadBehavior', { behavior: 'deny', eventsEnabled: true });
  let downloads = 0;
  chrome.listeners.push(event => { if (event.method === 'Browser.downloadWillBegin') downloads++; });
  await chrome.evaluate("document.querySelector('.contact-save').focus()");
  await chrome.key('Enter', 'Enter', 13);
  assert.equal(await chrome.evaluate("document.querySelector('.contact-card-dialog').open"), true);
  assert.equal(downloads, 0);
  assert.equal(await chrome.evaluate('document.activeElement.id'), 'contact-card-note');
  await chrome.evaluate("const create=URL.createObjectURL;URL.createObjectURL=function(blob){window.savedContact=blob.text();return create.call(this,blob)};const n=document.querySelector('#contact-card-note');n.value='Met in Riyadh; follow up';n.dispatchEvent(new Event('input'));document.querySelector('.contact-card-actions button').click()");
  await waitFor(() => chrome.evaluate('!!window.savedContact'), 'contact card with note');
  assert.match(await chrome.evaluate('window.savedContact'), /NOTE:Met in Riyadh\\; follow up/);
  await waitFor(() => chrome.evaluate("!document.querySelector('.contact-card-dialog').open"), 'closing contact card dialog');
  assert.equal(await chrome.evaluate('document.activeElement.className'), 'contact-save');
  await chrome.evaluate("document.querySelector('.contact-save').click()");
  await chrome.evaluate("window.originalFetch=window.fetch;window.fetch=()=>Promise.reject(new TypeError('offline'));document.querySelector('.contact-card-actions button').click()");
  await waitFor(() => chrome.evaluate("document.querySelector('.contact-card-status').textContent.includes('Please try again')"), 'contact-card retry message');
  assert.equal(await chrome.evaluate("document.querySelector('#contact-card-note').value"), 'Met in Riyadh; follow up');
  assert.equal(await chrome.evaluate("document.querySelector('.contact-card-actions button').disabled"), false);
  await chrome.evaluate('window.fetch=window.originalFetch');
  await chrome.evaluate("document.querySelector('.contact-card-plain').click()");
  await waitFor(() => chrome.evaluate("!document.querySelector('.contact-card-dialog').open"), 'saving a plain contact card');
  await chrome.evaluate("document.querySelector('.contact-save').click()");
  await chrome.key('Escape', 'Escape', 27);
  await waitFor(() => chrome.evaluate("!document.querySelector('.contact-card-dialog').open"), 'cancelling contact card');
  await chrome.evaluate("const style=document.createElement('style');style.textContent='*{letter-spacing:.12em!important;word-spacing:.16em!important}';document.head.append(style)");
  assert.equal(await chrome.evaluate("const a=document.querySelector('.contact-address');a.scrollWidth<=a.clientWidth+1"), true);
  await chrome.navigate(origin + '/#edit', 390);
  await waitFor(() => chrome.evaluate("document.querySelector('.now-editor').open"), 'editor opening');
  await chrome.evaluate("const t=document.querySelector('#now-editor-text');t.value='Browser test draft';t.dispatchEvent(new Event('input'))");
  await chrome.navigate(origin + '/about/', 390);
  await chrome.navigate(origin + '/#edit', 390);
  assert.equal(await chrome.evaluate("document.querySelector('#now-editor-text').value"), 'Browser test draft');
  await chrome.key('Escape','Escape',27);
  await waitFor(() => chrome.evaluate("location.hash==='#now'"), 'focus return after closing the editor');
  await chrome.navigate(origin + '/writing/', 390);
  await chrome.evaluate("document.querySelector('[data-open-reader]').click()");
  const page = () => chrome.evaluate("document.querySelector('[data-page-status]').textContent");
  const initial = await page();
  await chrome.key('ArrowRight','ArrowRight',39);
  await waitFor(async () => (await page()) !== initial, 'keyboard page turn');
  await chrome.key('Escape','Escape',27);
  await waitFor(() => chrome.evaluate("!!document.querySelector('[data-inline-reader] [data-reader]')"), 'closing the reader');

  await chrome.navigate(origin + '/work/#evidence', 390);
  await chrome.evaluate("document.querySelector('[data-evidence-filter=aviation]').click()");
  assert.equal(await chrome.evaluate("document.querySelector('[data-evidence-node=black-hat-mea]').closest('li').hidden"), true);
  assert.equal(await chrome.evaluate("document.querySelector('[data-evidence-node=global-airports-forum]').getAttribute('aria-current')"), 'true');
  await chrome.evaluate("document.querySelector('[data-evidence-node=course-aircraft-design]').click()");
  assert.equal(await chrome.evaluate("document.querySelector('[data-evidence-selection] h3').textContent"), 'Introduction to Aircraft Design');
  await chrome.evaluate("document.querySelector('[data-evidence-selection] a').click()");
  await waitFor(() => chrome.evaluate("location.hash === '#course-aircraft-design' && document.querySelector('#course-aircraft-design details')?.open"), 'opening course details from the map');
  assert.equal(await chrome.evaluate("!!document.querySelector('#course-aircraft-design a.entry-certificate[href^=\"https://\"]')"), true);
  await chrome.evaluate(`
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true, value: { writeText: async value => { window.sectionShared = value; } },
    });
    document.querySelector('[data-copy-section=course-aircraft-design]').click();
  `);
  await waitFor(() => chrome.evaluate("document.querySelector('[data-copy-section=course-aircraft-design] [data-section-copy-label]').textContent === 'Copied'"), 'copy confirmation');
  assert.equal(await chrome.evaluate('window.sectionShared'), origin + '/about/#course-aircraft-design');
  await chrome.evaluate(`
    navigator.clipboard.writeText = async () => { throw new Error('Clipboard blocked'); };
    document.querySelector('[data-copy-section=course-aircraft-design]').click();
  `);
  await waitFor(() => chrome.evaluate("document.querySelector('.section-link-dialog').open"), 'manual section link');
  assert.equal(await chrome.evaluate("document.querySelector('#section-link-url').value"), origin + '/about/#course-aircraft-design');
  await chrome.key('Escape', 'Escape', 27);

  await chrome.navigate(origin + '/about/#capabilities', 390);
  await chrome.evaluate("document.querySelectorAll('.capability > summary')[1].click()");
  assert.equal(await chrome.evaluate("document.querySelectorAll('.capability[open] .capability-matrix > div').length >= 3"), true);
  await chrome.navigate(origin + '/about/#igcses', 390);
  await chrome.evaluate("document.querySelector('#igcses .glossary-term').click()");
  assert.match(await chrome.evaluate("document.querySelector('#glossary-definition').textContent"), /International General Certificate/);
  await chrome.key('Escape', 'Escape', 27);
  assert.equal(await chrome.evaluate("document.querySelector('#glossary-definition').hidden"), true);

  await chrome.navigate(origin + '/journey/#milestone-igcses', 390);
  assert.equal(await chrome.evaluate("document.querySelector('#milestone-igcses details').open"), true);
  assert.equal(await chrome.evaluate("!!document.querySelector('#looking-ahead')"), true);
  await chrome.evaluate("document.querySelector('#milestone-igcses a[href=\"#milestone-black-hat-mea\"]').click()");
  await waitFor(() => chrome.evaluate("location.hash === '#milestone-black-hat-mea' && document.querySelector('#milestone-black-hat-mea details').open"), 'older milestone');
  assert.equal(await chrome.evaluate("document.querySelector('#milestone-igcses details').open"), false);
  await chrome.evaluate("document.querySelector('#milestone-igcses summary').click(); document.querySelector('#milestone-igcses a[href=\"#milestone-black-hat-mea\"]').click()");
  assert.equal(await chrome.evaluate("document.querySelector('#milestone-black-hat-mea details').open"), true);

  await chrome.evaluate("localStorage.setItem('portfolio-seen-update','older-release')");
  await chrome.navigate(origin + '/', 390);
  assert.equal(await chrome.evaluate("document.querySelector('[data-site-update]').hasAttribute('data-new-release')"), true);
  await chrome.evaluate("document.querySelector('[data-dismiss-site-update]').click()");
  await chrome.navigate(origin + '/?return=1', 390);
  assert.equal(await chrome.evaluate("document.querySelector('[data-site-update]').hasAttribute('data-new-release')"), false);
  await chrome.evaluate("document.querySelector('footer a[href=\"#site-updates\"]').click()");
  await waitFor(() => chrome.evaluate("document.querySelector('#site-updates details').open"), 'latest updates still available after dismissal');

  await chrome.navigate(origin + '/contact/', 390);
  await chrome.evaluate(`
    const contact = document.querySelector('.contact-form');
    contact.elements.message.value = 'Keep this draft.';
    contact.elements.reason.value = 'Student opportunities';
    contact.elements.reason.dispatchEvent(new Event('change'));
  `);
  assert.match(await chrome.evaluate("document.querySelector('#contact-message').placeholder"), /organisation.*deadline/);
  assert.equal(await chrome.evaluate("document.querySelector('#contact-message').value"), 'Keep this draft.');
  await chrome.evaluate("document.querySelector('.contact-form').reset()");
  assert.equal(await chrome.evaluate("document.querySelector('#contact-message').placeholder"), '');

  assert.deepEqual(errors, []);
  console.log('Browser checks passed for mobile layout, the contact form and card, draft recovery, the reader, evidence, credentials, sharing, glossary, Journey and site updates.');
} finally {
  try { await chrome?.close(); } finally { server.closeAllConnections(); server.close(); }
}
