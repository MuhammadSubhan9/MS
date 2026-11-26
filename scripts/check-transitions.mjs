import assert from 'node:assert/strict';
import { once } from 'node:events';
import { resolve } from 'node:path';
import { writeFile, mkdir } from 'node:fs/promises';
import { setTimeout as pause } from 'node:timers/promises';
import { browser, waitFor } from './browser-client.mjs';
import { createSiteServer } from './server.mjs';

const server = createSiteServer(resolve('dist')).listen(0, '127.0.0.1');
await once(server, 'listening');
const origin = 'http://127.0.0.1:' + server.address().port;
const chrome = await browser();
const errors = [];
const results = [];
const capture = process.env.MOTION_CAPTURE_DIR;
try {
  await chrome.call('Page.enable');
  await chrome.call('Runtime.enable');
  chrome.listeners.push(event => {
    if (event.method === 'Runtime.exceptionThrown') errors.push(event.params.exceptionDetails.text);
    if (event.method === 'Log.entryAdded' && event.params.entry.level === 'error') errors.push(event.params.entry.text);
  });
  await chrome.call('Log.enable');
  await chrome.call('Page.addScriptToEvaluateOnNewDocument', { source: `
    addEventListener('pagereveal', event => {
      window.motionResult = { native: !!event.viewTransition };
      if (event.viewTransition) event.viewTransition.ready.then(() => {
        Object.assign(window.motionResult, {
          ready: true,
          kind: document.documentElement.dataset.routeMotion,
          names: [...document.querySelectorAll('[style]')].map(node => node.style.viewTransitionName || node.style.getPropertyValue('--route-panel-name')).filter(Boolean),
          rootCapture: getComputedStyle(document.documentElement).viewTransitionName,
          headerCapture: getComputedStyle(document.querySelector('.site-header, .novel-header')).viewTransitionName,
          inert: document.body.inert,
          hasLine: !!document.querySelector('.route-line'),
        });
      }).catch(error => { window.motionResult.error = String(error); });
    });
  ` });

  async function press(selector, touch = false) {
    const point = await chrome.evaluate(`(() => {
      const box = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();
      return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    })()`);
    if (touch) {
      await chrome.call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
      await chrome.call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      for (const type of ['mousePressed', 'mouseReleased']) {
        await chrome.call('Input.dispatchMouseEvent', { type, ...point, button: 'left', clickCount: 1 });
      }
    }
  }

  async function clickRoute(selector, path, type, shared, width) {
    if (selector.startsWith('.nav ')) {
      const menuClosed = await chrome.evaluate("const menu=document.querySelector('.menu');menu?.offsetWidth > 0 && menu.getAttribute('aria-expanded') !== 'true'");
      if (menuClosed) await press('.menu', width <= 390);
    }
    await chrome.evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',behavior:'instant'})`);
    await pause(100);
    await press(selector, width <= 390);
    await waitFor(() => chrome.evaluate(`location.pathname===${JSON.stringify(path)} && window.motionResult?.ready`), 'transition to ' + path);
    const result = await chrome.evaluate('window.motionResult');
    assert.equal(result.kind, type, path);
    assert.ok(!result.names.includes('route-author'), 'the name does not carry between pages');
    if (shared) assert.ok(result.names.includes(shared), path + ' shared element');
    assert.equal(result.inert, false, path + ' destination accepts input during handover');
    assert.equal(result.hasLine, false, 'destination has no navigation line');
    assert.equal(result.rootCapture, 'none', 'the old page cannot cover the destination links');
    assert.equal(result.headerCapture, 'none', 'navigation always displays the live links');
    if (capture && shared) {
      await mkdir(capture, { recursive: true });
      const shot = await chrome.call('Page.captureScreenshot', { format: 'png' });
      await writeFile(resolve(capture, type + '-' + width + '.png'), Buffer.from(shot.data, 'base64'));
    }
    if (type === 'contact' && shared) {
      await press('#contact-name', width === 390);
      assert.equal(await chrome.evaluate('document.activeElement.id'), 'contact-name', 'first press focuses the arriving form');
    }
    await waitFor(() => chrome.evaluate("!document.documentElement.dataset.routeMotion && !document.querySelector('.route-line')"), 'transition cleanup');
    assert.equal(await chrome.evaluate('document.body.inert'), false, 'interaction resumes');
    assert.equal(await chrome.evaluate('document.documentElement.scrollWidth <= innerWidth'), true, path);
    if (type === 'contact' && shared && width === 390) {
      assert.equal(await chrome.evaluate("document.querySelector('.contact-form-panel').getBoundingClientRect().top < innerHeight * .3"), true);
    }
    results.push({ path, width, type, shared: shared || null });
  }

  for (const width of [390, 1440]) {
    await chrome.navigate(origin + '/about/', width);
    await chrome.evaluate("sessionStorage.setItem('subhan-intro-seen','1')");
    await pause(550);
    await clickRoute('.nav a[href="/"]', '/', 'fade', null, width);
    await clickRoute('.text-actions a[href="/about/"]', '/about/', 'fade', null, width);
    await clickRoute('.nav a[href="/journey/"]', '/journey/', 'fade', null, width);
    await clickRoute('.nav a[href="/contact/"]', '/contact/', 'contact-card', 'route-card', width);
    await clickRoute('.nav a[href="/about/"]', '/about/', 'fade', null, width);
    await clickRoute('.footer-contact', '/contact/', 'contact', 'route-contact', width);
    await clickRoute('.footer-link[href="/work/"]', '/work/', 'fade', null, width);
    const eventCard = '[data-event-toggle="spread-money2020-middle-east"]';
    await chrome.evaluate(`document.querySelector(${JSON.stringify(eventCard)}).scrollIntoView({block:'center',behavior:'instant'})`);
    await press(eventCard, width <= 390);
    assert.equal(await chrome.evaluate("location.pathname"), '/work/', 'event opens on the same page');
    assert.equal(await chrome.evaluate("document.querySelector('#spread-money2020-middle-east').hidden"), false, 'first press opens the spread');
    if (width > 760) {
      assert.ok(await chrome.evaluate(`(() => {
        const spread = document.querySelector('#spread-money2020-middle-east');
        const row = spread.parentElement;
        const cards = [...row.querySelectorAll('.work-event')].map(card => card.getBoundingClientRect());
        return cards[0].top === cards[1].top && spread.getBoundingClientRect().top >= cards[1].bottom;
      })()`), 'desktop spread opens underneath both cards');
    }
    await clickRoute('#spread-money2020-middle-east .button-link', '/work/money2020-middle-east/', 'event', 'route-event', width);
    await chrome.evaluate('history.back()');
    await waitFor(() => chrome.evaluate("location.pathname==='/work/' && !document.documentElement.dataset.routeMotion"), 'Back to Work');
    await clickRoute('.wordmark', '/', 'fade', null, width);
    await clickRoute('.home-writing-layout .button-link', '/writing/', 'book', 'route-book', width);
    await clickRoute('.novel-back', '/', 'book', 'route-book', width);
  }

  for (const width of [320, 2144]) {
    await chrome.navigate(origin + '/about/', width);
    await clickRoute('.footer-link[href="/work/"]', '/work/', 'fade', null, width);
  }

  await chrome.navigate(origin + '/contact/', 390);
  await chrome.evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{}}});document.querySelector('[data-copy-email]').scrollIntoView({block:'center',behavior:'instant'})");
  await press('[data-copy-email]', true);
  await waitFor(() => chrome.evaluate("document.querySelector('[data-copy-email]').dataset.copyState==='copied'"), 'copy confirmation');
  await chrome.evaluate(`
    window.fetch = async () => Response.json({ ok: true });
    for (const [name,value] of Object.entries({name:'Browser check',email:'check@example.com',subject:'Motion check',message:'Local test'})) document.querySelector('.contact-form [name='+name+']').value=value;
    document.querySelector('.contact-send').scrollIntoView({block:'center'});
    document.querySelector('.contact-form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
  `);
  await waitFor(() => chrome.evaluate("document.querySelector('.contact-form-status').dataset.state==='sent'"), 'send confirmation');
  assert.equal(await chrome.evaluate("document.querySelector('.contact-form .contact-send').hidden"), true);
  assert.equal(await chrome.evaluate("document.querySelector('.contact-form .contact-send').getBoundingClientRect().height"), 0);
  await chrome.evaluate("const field=document.querySelector('#contact-message');field.value='Another message';field.dispatchEvent(new Event('input',{bubbles:true}))");
  assert.equal(await chrome.evaluate("document.querySelector('.contact-form .contact-send').hidden"), false);

  for (const width of [390, 1440]) {
    await chrome.navigate(origin + '/writing/', width);
    await chrome.evaluate("document.querySelector('.shelf-book').scrollIntoView({block:'center',behavior:'instant'})");
    await press('.shelf-book', width === 390);
    await waitFor(() => chrome.evaluate("document.querySelector('.novel-reader-dialog').open && !document.querySelector('[data-reader]').classList.contains('reader-opening')"), 'cover opening');
    const originalStatus = await chrome.evaluate("document.querySelector('[data-page-status]').textContent");
    const originalPages = await chrome.evaluate("[...document.querySelectorAll('[data-spread] > [data-leaf]')].filter(n=>!n.hidden).map(n=>n.dataset.leaf)");
    await press('[data-page-step="1"]', width === 390);
    await waitFor(() => chrome.evaluate("!!document.querySelector('.reader-turn.next')"), 'forward page turn');
    assert.equal(await chrome.evaluate("document.querySelector('[data-page-status]').textContent"), originalStatus, 'page number waits for the turn');
    assert.deepEqual(await chrome.evaluate("[...document.querySelectorAll('[data-spread] > [data-leaf]')].filter(n=>!n.hidden).map(n=>n.dataset.leaf)"), originalPages, 'destination text stays hidden during the turn');
    assert.equal(await chrome.evaluate("document.querySelector('[data-reader]').getAttribute('aria-busy')"), 'true');
    assert.equal(await chrome.evaluate("document.querySelector('.novel-reader-dialog').scrollWidth > innerWidth"), false, 'turning sheet stays inside the viewport');
    await waitFor(() => chrome.evaluate("!document.querySelector('.reader-turn')"), 'forward turn completion');
    assert.notEqual(await chrome.evaluate("document.querySelector('[data-page-status]').textContent"), originalStatus);
    await chrome.key('ArrowLeft', 'ArrowLeft', 37);
    await waitFor(() => chrome.evaluate("!!document.querySelector('.reader-turn.previous')"), 'reverse page turn');
    await chrome.key('Escape', 'Escape', 27);
    await waitFor(() => chrome.evaluate("!document.querySelector('.novel-reader-dialog').open && !document.querySelector('[data-moving-copy]') && !document.body.classList.contains('novel-scroll-locked')"), 'interrupted reader cleanup');
  }

  for (const width of [390, 1440]) {
    await chrome.navigate(origin + '/about/', width);
    await press('.wordmark', width === 390);
    await waitFor(() => chrome.evaluate("location.pathname==='/' && window.motionResult?.ready"), 'first rapid navigation');
    if (width === 390) {
      await press('.menu', true);
      assert.equal(await chrome.evaluate("document.querySelector('.menu').getAttribute('aria-expanded')"), 'true', 'one tap opens the arriving menu');
    }
    await press('.nav a[href="/about/"]', width === 390);
    await waitFor(() => chrome.evaluate("location.pathname==='/about/' && window.motionResult?.ready"), 'second rapid navigation');
    await waitFor(() => chrome.evaluate("!document.documentElement.dataset.routeMotion"), 'rapid navigation cleanup');
  }

  // Turning off the source opt-in exercises the ordinary-navigation fallback.
  await chrome.evaluate(`
    const style = document.createElement('style');
    style.textContent = '@view-transition { navigation: none; }';
    document.head.append(style);
    new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  `);
  await chrome.evaluate("document.querySelector('.footer-contact').click()");
  await waitFor(() => chrome.evaluate("location.pathname==='/contact/' && window.motionResult"), 'fallback navigation');
  assert.equal(await chrome.evaluate('window.motionResult.native'), false, 'source opted out of the view transition');
  assert.equal(await chrome.evaluate("document.body.inert || !!document.querySelector('.route-line')"), false);

  await chrome.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await chrome.navigate(origin + '/about/', 390);
  await chrome.evaluate("document.querySelector('.footer-contact').click()");
  await waitFor(() => chrome.evaluate("location.pathname==='/contact/' && document.readyState==='complete'"), 'reduced motion navigation');
  assert.equal(await chrome.evaluate("!!document.querySelector('.route-line')"), false);
  assert.deepEqual(errors, []);
  console.log('Passed ' + results.length + ' native page transitions at phone/desktop widths, Back and rapid navigation, copy/send responses, reader turns, interruption cleanup, fallback and reduced motion.');
} finally {
  try { await chrome.close(); } finally { server.closeAllConnections(); server.close(); }
}
