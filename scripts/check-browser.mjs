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
      assert.equal(await chrome.evaluate("document.querySelector('#site-updates, footer [href=\"#site-updates\"]')"), null);
      assert.equal(await chrome.evaluate("!!document.querySelector('.home-work-list img[src=\"/images/coburn-palo-speaking.jpg\"]')"), true);
    }
    if (route === '/about/') {
      assert.deepEqual(await chrome.evaluate("Array.from(document.querySelectorAll('.language-group-learning dt'), node => node.textContent)"), ['German', 'Latin']);
      assert.match(await chrome.evaluate("document.querySelector('.language-group-learning .language-score').textContent"), /10/);
      assert.match(await chrome.evaluate("document.querySelector('.language-group-spoken .language-score').textContent"), /130/);
    }
  }
  await chrome.navigate(origin + '/work/unesco-ai-forum/', 390);
  assert.equal(await chrome.evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  assert.equal(await chrome.evaluate("!!document.querySelector('.experience-opening-with-photo > figure img') && !!document.querySelector('.experience-identity .work-event-mark img')"), true);
  await chrome.navigate(origin + '/contact/', 320);
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
  await chrome.call('Page.navigate', { url: origin + '/#edit' });
  await waitFor(() => chrome.evaluate("location.search === '?owner=1' && document.querySelector('.now-editor')?.open").catch(() => false), 'legacy editor link opens the isolated document');
  await waitFor(() => chrome.evaluate("document.querySelector('.now-editor').open"), 'editor opening');
  await chrome.evaluate("const t=document.querySelector('#now-editor-text');t.value='Browser test draft';t.dispatchEvent(new Event('input'))");
  await chrome.navigate(origin + '/about/', 390);
  await chrome.navigate(origin + '/?owner=1#edit', 390);
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

  for (const [width, columns] of [[1440, 3], [800, 2]]) {
    await chrome.navigate(origin + '/about/?columns=' + columns + '#courses', width);
    assert.equal(await chrome.evaluate("document.querySelectorAll('#courses .course-column').length"), columns);
    const position = await chrome.evaluate(`(() => {
      const summary = document.querySelector('#course-sales-fundamentals summary');
      summary.scrollIntoView({ block: 'center', behavior: 'instant' });
      const box = summary.getBoundingClientRect();
      const groups = document.querySelectorAll('#courses .course-column');
      return {
        x: box.left + box.width / 2, y: box.top + box.height / 2,
        same: groups[0].lastElementChild.getBoundingClientRect().top + scrollY,
        neighbour: groups[1].lastElementChild.getBoundingClientRect().top + scrollY,
      };
    })()`);
    for (const type of ['mousePressed', 'mouseReleased']) {
      await chrome.call('Input.dispatchMouseEvent', { type, x: position.x, y: position.y, button: 'left', clickCount: 1 });
    }
    assert.equal(await chrome.evaluate("document.querySelector('#course-sales-fundamentals details').open"), true);
    const [same, neighbour] = await chrome.evaluate("[...document.querySelectorAll('#courses .course-column')].map(group => group.lastElementChild.getBoundingClientRect().top + scrollY)");
    assert.ok(same > position.same, 'the expanded course moves its own column');
    assert.equal(neighbour, position.neighbour, 'the neighbouring column stays in place');
  }
  await chrome.navigate(origin + '/about/#education', 390);
  assert.deepEqual(await chrome.evaluate("[...document.querySelectorAll('.education-school .entry')].map(item => item.id)"), ['igcses', 'international-a-levels']);
  assert.equal(await chrome.evaluate("document.querySelector('.education-school > h3').textContent"), 'Al-Rowad International Schools');

  await chrome.navigate(origin + '/work/#evidence', 390);
  await chrome.evaluate("document.querySelector('[data-evidence-node=\"work:money2020-middle-east\"]').focus()");
  await chrome.key('Enter', 'Enter', 13);
  assert.deepEqual(await chrome.evaluate("[...document.querySelectorAll('[data-evidence-branch][data-evidence-topic-match]')].map(node => node.dataset.evidenceBranch)"), ['technology', 'business']);
  assert.equal(await chrome.evaluate("document.querySelector('[data-evidence-node=\"work:unesco-ai-forum\"]').hasAttribute('data-evidence-related')"), true);
  assert.equal(await chrome.evaluate("document.querySelector('[data-evidence-node=\"work:global-airports-forum\"]').hasAttribute('data-evidence-related')"), false);
  assert.match(await chrome.evaluate("document.querySelector('[data-evidence-selection] .eyebrow').textContent"), /Business \/ Technology/);
  await chrome.evaluate("document.querySelector('[data-evidence-filter=aviation]').click()");
  assert.equal(await chrome.evaluate("document.querySelector('[data-evidence-node=\"work:black-hat-mea\"]').closest('li').hidden"), true);
  assert.equal(await chrome.evaluate("document.querySelector('[data-evidence-node=\"work:global-airports-forum\"]').getAttribute('aria-current')"), 'true');
  await chrome.evaluate("document.querySelector('[data-evidence-node=\"course:course-aircraft-design\"]').click()");
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
  assert.equal(await chrome.evaluate("document.querySelector('.capability .capability-example > a').getAttribute('href')"), '/work/lead-influence-workshop/');
  assert.match(await chrome.evaluate("document.querySelector('.capability p').textContent"), /workshop simulations/);
  const previewPoint = await chrome.evaluate(`(() => {
    const button = document.querySelector('#course-business-finance .entry-preview');
    button.scrollIntoView({ block: 'center', behavior: 'instant' });
    const box = button.getBoundingClientRect();
    return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  })()`);
  await chrome.call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [previewPoint] });
  await chrome.call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await waitFor(() => chrome.evaluate("document.querySelector('.certificate-dialog').open && document.querySelector('.certificate-dialog img').naturalWidth === 920"), 'first tap opens the original certificate excerpt');
  assert.equal(await chrome.evaluate("document.querySelector('.certificate-dialog-content a').getAttribute('href')"), 'https://alison.com/verify/640283d4a4');
  await chrome.key('Escape', 'Escape', 27);
  await waitFor(() => chrome.evaluate("!document.querySelector('.certificate-dialog').open"), 'closing the certificate preview');
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
  await waitFor(() => chrome.evaluate("document.querySelector('[data-calendar-display-year]').textContent === '2026' && document.querySelector('[data-calendar-display-month]').textContent.startsWith('Sep')"), 'Journey scroll updates the year and month');
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
  await chrome.evaluate(`(() => {
    const form = document.querySelector('.contact-form');
    for (const [name, value] of Object.entries({ name: 'Reader', email: 'reader@example.test', subject: 'Hello', message: 'First version' })) {
      form.elements[name].value = value;
    }
    window.fetch = () => new Promise(resolve => { window.finishContact = () => resolve(Response.json({ ok: true })); });
    form.requestSubmit();
    form.elements.message.value = 'Second version';
    window.finishContact();
  })()`);
  await waitFor(() => chrome.evaluate("document.querySelector('.contact-form-status').dataset.state === 'edited'"), 'separate confirmation for an edited message');
  assert.equal(await chrome.evaluate("document.querySelector('#contact-message').value"), 'Second version');
  assert.equal(await chrome.evaluate("document.querySelector('.contact-send').hidden"), false);

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
  await chrome.navigate(origin + '/?owner=1#edit', 390);
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
  await chrome.evaluate("window.fetch = async () => { throw new Error('offline') }");
  await command('lock tools');
  await waitFor(() => chrome.evaluate("document.querySelector('[aria-labelledby=command-title] .command-feedback').textContent.includes('Try again')"), 'failed lock remains visible');
  assert.equal(await paletteOpen(), true);
  await chrome.evaluate("window.fetch = async () => Response.json({ locked: true })");
  await chrome.key('Enter', 'Enter', 13);
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

  await chrome.navigate(origin + '/?owner=1&publish-preview=1#edit', 390);
  await chrome.evaluate(`
    const nowDialog = document.querySelector('.now-editor');
    window.fetch = async () => Response.json({
      date: '2026-11-26', dateLabel: '26 November 2026', revision: 3,
      paragraphs: ['A new first line. More detail follows.', 'Another paragraph.'],
      preview: 'A new first line.',
    });
    nowDialog.querySelector('#now-editor-text').value = 'A new first line. More detail follows.';
    nowDialog.querySelector('#now-editor-code').value = 'browser-test-code-only';
    nowDialog.querySelector('form').requestSubmit();
  `);
  await waitFor(() => chrome.evaluate("document.querySelector('[data-now-preview]').textContent === 'A new first line.'"), 'published Now note refreshes the homepage intro');

  assert.deepEqual(errors, []);
  console.log('Browser checks passed for mobile layout, the contact form and card, draft recovery, the reader, evidence, credentials, sharing, glossary, Journey and owner commands.');
} finally {
  try { await chrome?.close(); } finally { server.closeAllConnections(); server.close(); }
}
