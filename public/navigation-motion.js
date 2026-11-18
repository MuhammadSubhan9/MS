(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const key = 'portfolio-route-transition';
  const prefetched = new Set();
  let selected = null;
  let line = null;
  let active = false;
  let interactionHeld = false;
  let fallbackAnimation;
  let sequence = 0;
  const assigned = new Set();

  function readPending() {
    try {
      const value = JSON.parse(sessionStorage.getItem(key));
      return value && value.to === location.href && Date.now() - value.at < 15000 ? value : null;
    } catch { return null; }
  }
  if (readPending() && !reduce.matches) {
    root.classList.add('page-transitioning');
    if (!('onpagereveal' in window)) root.classList.add('route-fallback-waiting');
  }

  function routeLink(event) {
    const link = event.target.closest?.('a[href]');
    if (!link || link.download || link.hasAttribute('download') || link.target && link.target !== '_self') return;
    const to = new URL(link.href);
    if (to.origin !== location.origin || to.pathname === location.pathname && to.search === location.search ||
        !/^\/(?:about\/|contact\/|writing\/|work\/(?:[a-z0-9-]+\/)?)?$/.test(to.pathname) || to.hash === '#edit') return;
    return link;
  }

  function visible(element) {
    if (!element) return false;
    const box = element.getBoundingClientRect();
    return box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < innerHeight;
  }

  function kind(from, to) {
    if (from.pathname === '/writing/' || to.pathname === '/writing/') return 'book';
    if (to.pathname === '/contact/') return 'contact';
    if ([from.pathname, to.pathname].every(path => path === '/' || path === '/about/')) return 'author';
    if (/^\/work\/[^/]+\/$/.test(from.pathname) || /^\/work\/[^/]+\/$/.test(to.pathname)) return 'event';
    return 'line';
  }

  function sharedElement(type, from, to, incoming) {
    if (type === 'book') return document.querySelector('.shelf-book img, .home-writing-novel figure img');
    if (type === 'contact-card') return incoming ? document.querySelector('.contact-feature') : selected;
    if (type === 'contact') {
      if (incoming) return document.querySelector('.contact-form-panel');
      return selected?.matches('.button-link') ? selected : null;
    }
    if (type === 'author') {
      const heading = document.querySelector('#home-title, .about-hero h1');
      return visible(heading) ? heading : document.querySelector('.wordmark span');
    }
    if (type === 'event') {
      const path = /^\/work\/[^/]+\/$/.test(to.pathname) ? to.pathname : from.pathname;
      const entry = [...document.querySelectorAll('[data-motion-route]')].find(item => item.dataset.motionRoute === path);
      return entry?.querySelector('.work-event-mark img');
    }
    return null;
  }

  function removeLine() { line?.remove(); line = null; }
  function makeLine() {
    const frame = document.querySelector('.header-inner, .novel-header-inner');
    const viewport = document.documentElement.clientWidth;
    const width = Math.min(frame?.getBoundingClientRect().width || viewport - 40, viewport - 32);
    const element = document.createElement('div');
    element.className = 'route-line';
    element.setAttribute('aria-hidden', 'true');
    element.style.setProperty('--line-target-x', (viewport - width) / 2 + 'px');
    element.style.setProperty('--line-target-width', width + 'px');
    return element;
  }
  function beginLine(link) {
    removeLine();
    const box = link.getBoundingClientRect();
    const width = Math.max(20, box.width - 20);
    line = makeLine();
    line.className = 'route-line route-line-pending';
    line.style.setProperty('--line-x', box.left + (box.width - width) / 2 + 'px');
    line.style.setProperty('--line-y', Math.min(box.bottom - 2, innerHeight - 2) + 'px');
    line.style.setProperty('--line-width', width + 'px');
    document.body.append(line);
  }

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = routeLink(event);
    if (!link || reduce.matches) return;
    selected = link;
    beginLine(link);
    try { sessionStorage.setItem(key, JSON.stringify({ from: location.href, to: link.href, kind: kind(new URL(location.href), new URL(link.href)), shared: false, at: Date.now() })); } catch { /* Navigation works without storage. */ }
  });

  function prefetch(event) {
    if (navigator.connection?.saveData) return;
    const link = routeLink(event);
    if (!link || prefetched.has(link.href) || prefetched.size >= 5) return;
    prefetched.add(link.href);
    const resource = document.createElement('link');
    resource.rel = 'prefetch';
    resource.href = link.href;
    resource.as = 'document';
    document.head.append(resource);
  }
  document.addEventListener('pointerover', prefetch, { passive: true });
  document.addEventListener('focusin', prefetch);

  function prepare(transition, from, to, incoming, pending) {
    const revision = ++sequence;
    for (const previous of assigned) previous.style.removeProperty('view-transition-name');
    assigned.clear();
    let type = pending?.kind || kind(from, to);
    if (!incoming && type === 'contact' && selected?.matches('.nav-contact')) type = 'contact-card';
    root.dataset.routeMotion = type;
    const headerBottom = document.querySelector('.site-header, .novel-header')?.getBoundingClientRect().bottom || 0;
    root.style.setProperty('--route-start', Math.max(0, headerBottom) + 'px');
    root.classList.add('page-transitioning');
    const element = sharedElement(type, from, to, incoming);
    // A travelling cover must arrive in the visible shelf, including on phones.
    if (incoming && type === 'book' && element && !to.hash) {
      const box = element.getBoundingClientRect();
      scrollTo({ top: Math.max(0, scrollY + box.top - (innerHeight - box.height) / 2), behavior: 'instant' });
    }
    if (incoming && type === 'contact' && pending?.shared && element && !to.hash &&
        element.getBoundingClientRect().top > innerHeight * .6) {
      scrollTo({ top: scrollY + element.getBoundingClientRect().top - Math.max(0, headerBottom) - 24, behavior: 'instant' });
    }
    const reveal = element?.closest('.scroll-reveal');
    if (reveal) {
      reveal.classList.remove('reveal-pending');
      reveal.classList.add('route-shared-settled');
    }
    const shared = visible(element) && (!incoming || pending?.shared || type === 'book');
    const name = { book: 'route-book', author: 'route-author', contact: 'route-contact', 'contact-card': 'route-card', event: 'route-event' }[type];
    if (shared && name) {
      element.style.viewTransitionName = name;
      assigned.add(element);
    }
    removeLine();
    if (type === 'line') {
      line = makeLine();
      line.style.viewTransitionName = 'route-line';
      line.style.top = Math.max(0, headerBottom) + 'px';
      document.body.append(line);
    }
    if (incoming) {
      document.body.inert = true;
      interactionHeld = true;
    }
    function clean() {
      if (revision !== sequence) return;
      for (const previous of assigned) previous.style.removeProperty('view-transition-name');
      assigned.clear();
      removeLine();
      delete root.dataset.routeMotion;
      if (interactionHeld) document.body.inert = false;
      interactionHeld = false;
      active = false;
    }
    active = true;
    transition.ready.catch(() => {});
    transition.finished.then(clean, clean);
    return { kind: type, shared: !!shared };
  }

  addEventListener('pageswap', event => {
    if (!event.activation?.entry) return;
    const from = new URL(location.href);
    const to = new URL(event.activation.entry.url);
    if (from.origin !== to.origin) return;
    let details = { kind: kind(from, to), shared: false };
    if (event.viewTransition && !reduce.matches && !document.querySelector('dialog[open]')) {
      details = prepare(event.viewTransition, from, to, false);
    } else {
      event.viewTransition?.ready.catch(() => {});
      event.viewTransition?.skipTransition();
    }
    try { sessionStorage.setItem(key, JSON.stringify({ ...details, from: from.href, to: to.href, at: Date.now() })); } catch { /* Navigation works without storage. */ }
  });

  function fallback() {
    if (reduce.matches || !readPending()) return;
    root.classList.add('page-transitioning');
    root.classList.add('route-fallback-waiting');
    document.body.inert = true;
    interactionHeld = true;
    removeLine();
    line = makeLine();
    document.body.append(line);
    fallbackAnimation = line.animate([{ translate: '0 0' }, { translate: '0 ' + innerHeight + 'px' }], { duration: 240, easing: 'ease-out' });
    function finishFallback() {
      removeLine();
      root.classList.remove('route-fallback-waiting');
      document.body.inert = false;
      interactionHeld = false;
      fallbackAnimation = null;
    }
    fallbackAnimation.finished.then(finishFallback, finishFallback);
  }
  addEventListener('pagereveal', event => {
    const pending = readPending();
    if (!event.viewTransition || reduce.matches || root.classList.contains('intro-playing')) {
      event.viewTransition?.ready.catch(() => {});
      event.viewTransition?.skipTransition();
      fallback();
    } else {
      const from = pending?.from || window.navigation?.activation?.from?.url;
      if (from) prepare(event.viewTransition, new URL(from), new URL(location.href), true, pending);
    }
    try { sessionStorage.removeItem(key); } catch { /* Storage is optional. */ }
  });
  addEventListener('pageshow', () => {
    if (!('onpagereveal' in window)) {
      fallback();
      try { sessionStorage.removeItem(key); } catch { /* Storage is optional. */ }
    }
    if (!active && line?.classList.contains('route-line-pending')) removeLine();
    selected = null;
  });
  reduce.addEventListener('change', () => {
    if (reduce.matches) {
      fallbackAnimation?.finish();
      removeLine();
    }
  });
})();
