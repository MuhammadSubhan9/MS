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
  for (const [route, shareButtons] of Object.entries({ '/': 0, '/about/': 1, '/journey/': 1, '/work/': 2, '/writing/': 1, '/contact/': 0 })) {
    await chrome.navigate(origin + route, 320);
    assert.equal(await chrome.evaluate('document.documentElement.scrollWidth <= innerWidth'), true, route);
    assert.equal(await chrome.evaluate("document.querySelectorAll('[data-copy-section]').length"), shareButtons, route);
    if (route === '/') {
      assert.deepEqual(await chrome.evaluate(`Array.from(document.querySelectorAll('.home-contact-links a'), link => [
        link.textContent.trim(), link.getAttribute('href'), link.classList.contains('button-link'),
      ])`), [['Contact me', '/contact/', true]]);
      assert.equal(await chrome.evaluate("document.querySelector('#site-updates summary').getBoundingClientRect().height > 0"), true);
    }
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
  await chrome.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await chrome.evaluate(`
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true, value: { writeText: async value => { window.sectionShared = value; } },
    });
    document.querySelector('[data-copy-section=courses]').click();
  `);
  await waitFor(() => chrome.evaluate("document.querySelector('[data-copy-section=courses][data-copy-state=copied] [data-section-copy-label]')?.textContent === 'Copied'"), 'copy confirmation');
  assert.equal(await chrome.evaluate("getComputedStyle(document.querySelector('[data-copy-section=courses] .section-copy-check')).animationName"), 'section-copy-check-in');
  assert.equal(await chrome.evaluate('window.sectionShared'), origin + '/about/#courses');
  await chrome.evaluate(`
    navigator.clipboard.writeText = async () => { throw new Error('Clipboard blocked'); };
    document.querySelector('[data-copy-section=courses]').click();
  `);
  await waitFor(() => chrome.evaluate("document.querySelector('.section-link-dialog').open"), 'manual section link');
  assert.equal(await chrome.evaluate("document.querySelector('#section-link-url').value"), origin + '/about/#courses');
  await chrome.key('Escape', 'Escape', 27);

  await chrome.evaluate("document.querySelector('#course-crew-management summary').focus()");
  await chrome.key('Enter', 'Enter', 13);
  const courseMotion = await chrome.evaluate(`
    (() => {
      const details = document.querySelector('#course-crew-management details');
      const panel = details.querySelector('.entry-detail-panel');
      const [sizing] = panel.getAnimations();
      sizing.pause();
      sizing.currentTime = 150;
      return { state: details.dataset.disclosureState, height: panel.getBoundingClientRect().height, fullHeight: panel.scrollHeight };
    })()
  `);
  assert.equal(courseMotion.state, 'opening');
  assert.ok(courseMotion.height > 0 && courseMotion.height < courseMotion.fullHeight);
  await chrome.key('Enter', 'Enter', 13);
  await waitFor(() => chrome.evaluate("!document.querySelector('#course-crew-management details').open"), 'reversing the course animation');
  await chrome.evaluate("document.querySelector('#course-crew-management summary').click()");
  await waitFor(() => chrome.evaluate("document.querySelector('#course-crew-management details[open]:not([data-disclosure-state])') !== null"), 'course settles open');
  await chrome.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });

  await chrome.navigate(origin + '/about/#capabilities', 390);
  assert.doesNotMatch(await chrome.evaluate("document.querySelector('#capabilities').textContent"), /web development/i);
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
  assert.equal(await chrome.evaluate("document.querySelector('.journey-milestone').id"), 'milestone-course-crew-management');
  assert.equal(await chrome.evaluate("document.querySelector('.journey-milestone:last-child').id"), 'milestone-unesco-ai-forum');
  assert.equal(await chrome.evaluate("document.querySelector('#milestone-unesco-ai-forum .journey-mark img').getAttribute('src')"), '/images/event-unesco-ai-forum.webp');

  await chrome.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await chrome.navigate(origin + '/journey/', 390);
  await waitFor(() => chrome.evaluate("document.querySelector('[data-journey-timeline]').style.getPropertyValue('--journey-progress') !== ''"), 'timeline rail');
  assert.equal(await chrome.evaluate("document.querySelector('#milestone-unesco-ai-forum').hasAttribute('data-reached')"), false);
  await chrome.evaluate("document.querySelector('#milestone-unesco-ai-forum').scrollIntoView({ block: 'center', behavior: 'instant' })");
  await waitFor(() => chrome.evaluate("document.querySelector('#milestone-unesco-ai-forum').hasAttribute('data-reached')"), 'newer milestone revealed by scrolling');
  assert.ok(await chrome.evaluate("Number(document.querySelector('[data-journey-timeline]').style.getPropertyValue('--journey-progress')) > .75"));
  assert.equal(await chrome.evaluate("getComputedStyle(document.querySelector('.site-header'), '::after').animationName"), 'none');
  const motion = await chrome.evaluate(`
    (() => {
      const card = document.querySelector('#milestone-unesco-ai-forum details');
      card.querySelector('summary').click();
      const panel = card.querySelector('.journey-panel');
      const [sizing] = panel.getAnimations();
      sizing.pause();
      sizing.currentTime = 190;
      return {
        state: card.dataset.disclosureState,
        height: panel.getBoundingClientRect().height,
        logoAnimation: getComputedStyle(card.querySelector('.journey-mark')).animationName,
      };
    })()
  `);
  assert.equal(motion.state, 'opening');
  assert.ok(motion.height > 0);
  assert.equal(motion.logoAnimation, 'journey-mark-enter');
  await chrome.evaluate("document.querySelector('#milestone-unesco-ai-forum summary').click()");
  await waitFor(() => chrome.evaluate("!document.querySelector('#milestone-unesco-ai-forum details').open"), 'reversing the milestone animation');
  await chrome.evaluate("document.querySelector('.journey-end').scrollIntoView({ block: 'center', behavior: 'instant' })");
  await waitFor(() => chrome.evaluate("document.querySelector('.journey-end').hasAttribute('data-reached')"), 'timeline endpoint illuminated');
  assert.equal(await chrome.evaluate("Math.abs(document.querySelector('.journey-rail').getBoundingClientRect().bottom - document.querySelector('.journey-end').getBoundingClientRect().top) < 1"), true);
  await chrome.evaluate("document.querySelector('.journey-end-link').click()");
  await waitFor(() => chrome.evaluate("location.hash === '#in-progress'"), 'endpoint links to current work');
  await chrome.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });

  await chrome.evaluate("localStorage.setItem('portfolio-seen-update','older-release')");
  await chrome.navigate(origin + '/', 390);
  assert.equal(await chrome.evaluate("document.querySelector('[data-site-update]').hasAttribute('data-new-release')"), true);
  await chrome.evaluate("document.querySelector('[data-dismiss-site-update]').click()");
  await chrome.navigate(origin + '/about/', 390);
  await chrome.navigate(origin + '/?return=1', 390);
  assert.equal(await chrome.evaluate("document.querySelector('[data-site-update]').hasAttribute('data-new-release')"), false);
  assert.equal(await chrome.evaluate("document.querySelector('#site-updates summary').getBoundingClientRect().height > 0"), true);
  assert.equal(await chrome.evaluate("document.querySelector('#site-updates details').open"), false);
  await chrome.evaluate("document.querySelector('footer a[href=\"#site-updates\"]').click()");
  await waitFor(() => chrome.evaluate("document.querySelector('#site-updates details').open"), 'latest updates still available after dismissal');
  await chrome.navigate(origin + '/?direct=1#site-updates', 390);
  assert.equal(await chrome.evaluate("document.querySelector('#site-updates details').open"), true);

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

  const commandShortcut = () => chrome.key('k', 'KeyK', 75, 2);
  const paletteOpen = () => chrome.evaluate("document.querySelector('[aria-labelledby=command-title]').open");
  async function command(value) {
    await commandShortcut();
    assert.equal(await paletteOpen(), true);
    await chrome.evaluate('document.querySelector("#command-input").value = ' + JSON.stringify(value));
    await chrome.key('Enter', 'Enter', 13);
  }

  await commandShortcut();
  assert.equal(await paletteOpen(), false);
  await chrome.navigate(origin + '/#edit', 390);
  await chrome.evaluate("document.querySelector('#now-editor-code').value = 'browser-test-code-only-1234'");
  await chrome.evaluate(`
    window.fetch = async (_url, options) => {
      if (JSON.parse(options.body).command !== 'unlock') throw new Error('Unexpected request');
      return Response.json({ expiresAt: Date.now() + 30000 });
    };
    document.querySelector('.command-unlock').click();
  `);
  await waitFor(() => chrome.evaluate("document.querySelector('[data-editor-status]').textContent.includes('unlocked')"), 'owner unlock');
  assert.equal(await chrome.evaluate("document.querySelector('#now-editor-code').value"), '');
  assert.ok(await chrome.evaluate("Number(localStorage.getItem('portfolio-tools-expires')) > Date.now()"));
  await chrome.evaluate("sessionStorage.removeItem('portfolio-tools-expires')");
  await chrome.key('Escape', 'Escape', 27);
  await waitFor(() => chrome.evaluate("location.hash === '#now'"), 'closing editor after unlock');
  await chrome.navigate(origin + '/writing/', 390);
  await command('preview now');
  await waitFor(() => chrome.evaluate("document.querySelector('.now-editor[data-preview]')?.open"), 'private draft preview');
  assert.match(await chrome.evaluate("document.querySelector('.now-draft-preview').textContent"), /Browser test draft/);
  await chrome.key('Escape', 'Escape', 27);
  await waitFor(() => chrome.evaluate("location.hash === '#now'"), 'closing draft preview');
  await chrome.evaluate("window.fetch = async () => Response.json({ pending: 2, confirmed: 1, notified: 0 })");
  await command('novel signups');
  await waitFor(() => chrome.evaluate("document.querySelector('[aria-labelledby=command-title] .command-feedback').textContent.includes('2 awaiting confirmation')"), 'novel signup totals');
  await chrome.key('Escape', 'Escape', 27);
  await waitFor(async () => !await paletteOpen(), 'closing owner commands');
  await command('lock tools');
  await waitFor(async () => !await paletteOpen(), 'locking owner commands');
  assert.equal(await chrome.evaluate("Number(localStorage.getItem('portfolio-tools-expires'))"), 0);
  await commandShortcut();
  assert.equal(await paletteOpen(), false);
  await chrome.evaluate("localStorage.setItem('portfolio-tools-expires', String(Date.now() + 30000))");
  await commandShortcut();
  assert.equal(await paletteOpen(), true);
  await chrome.key('Escape', 'Escape', 27);
  await chrome.evaluate("localStorage.setItem('portfolio-tools-expires', String(Date.now() - 1000))");
  await commandShortcut();
  await waitFor(() => chrome.evaluate("location.hash === '#edit' && document.querySelector('.now-editor')?.open"), 'returning to the unlock prompt after expiry');

  assert.deepEqual(errors, []);
  console.log('Browser checks passed for mobile layout, the contact form and card, draft recovery, the reader, evidence, credentials, sharing, glossary, Journey, site updates and owner commands.');
} finally {
  try { await chrome?.close(); } finally { server.closeAllConnections(); server.close(); }
}
