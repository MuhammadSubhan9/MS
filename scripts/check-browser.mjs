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
  for (const route of ['/', '/about/', '/work/', '/writing/', '/contact/']) {
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
  assert.deepEqual(errors, []);
  console.log('Browser checks passed for five mobile pages, expanded text spacing, draft recovery, keyboard reader and runtime errors.');
} finally {
  try { await chrome?.close(); } finally { server.closeAllConnections(); server.close(); }
}
