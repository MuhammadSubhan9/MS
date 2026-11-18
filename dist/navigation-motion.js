(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const key = 'portfolio-route-transition';
  const prefetched = new Set();
  let selected = null;
  let interactionHeld = false;
  let sequence = 0;
  const assigned = new Set();

  function readPending() {
    try {
      const value = JSON.parse(sessionStorage.getItem(key));
      return value && value.to === location.href && Date.now() - value.at < 15000 ? value : null;
    } catch { return null; }
  }
  if (readPending() && !reduce.matches) root.classList.add('page-transitioning');

  function routeLink(event) {
    const link = event.target.closest?.('a[href]');
    if (!link || link.download || link.hasAttribute('download') || link.target && link.target !== '_self') return;
    const to = new URL(link.href);
    if (to.origin !== location.origin || to.pathname === location.pathname && to.search === location.search ||
        !/^\/(?:about\/|journey\/|contact\/|writing\/|work\/(?:[a-z0-9-]+\/)?)?$/.test(to.pathname) || to.hash === '#edit') return;
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
    if (/^\/work\/[^/]+\/$/.test(from.pathname) || /^\/work\/[^/]+\/$/.test(to.pathname)) return 'event';
    return 'fade';
  }

  function sharedElement(type, from, to, incoming) {
    if (type === 'book') return document.querySelector('.shelf-book img, .home-writing-novel figure img');
    if (type === 'contact-card') return incoming ? document.querySelector('.contact-feature') : selected;
    if (type === 'contact') {
      if (incoming) return document.querySelector('.contact-form-panel');
      return selected?.matches('.button-link') ? selected : null;
    }
    if (type === 'event') {
      const path = /^\/work\/[^/]+\/$/.test(to.pathname) ? to.pathname : from.pathname;
      const entry = [...document.querySelectorAll('[data-motion-route]')].find(item => item.dataset.motionRoute === path);
      return entry?.querySelector('.work-event-mark img');
    }
    return null;
  }

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = routeLink(event);
    if (!link || reduce.matches) return;
    selected = link;
    try { sessionStorage.setItem(key, JSON.stringify({ from: location.href, to: link.href, at: Date.now() })); } catch { /* Navigation works without storage. */ }
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
    let type = pending?.kind === 'contact-card' ? 'contact-card' : kind(from, to);
    if (!incoming && type === 'contact' && selected?.matches('.nav-contact')) type = 'contact-card';
    root.dataset.routeMotion = type;
    root.classList.add('page-transitioning');
    const element = sharedElement(type, from, to, incoming);
    // A travelling cover must arrive in the visible shelf, including on phones.
    if (incoming && type === 'book' && element && !to.hash) {
      const box = element.getBoundingClientRect();
      scrollTo({ top: Math.max(0, scrollY + box.top - (innerHeight - box.height) / 2), behavior: 'instant' });
    }
    if (incoming && type === 'contact' && pending?.shared && element && !to.hash &&
        element.getBoundingClientRect().top > innerHeight * .6) {
      const headerBottom = document.querySelector('.site-header')?.getBoundingClientRect().bottom || 0;
      scrollTo({ top: scrollY + element.getBoundingClientRect().top - Math.max(0, headerBottom) - 24, behavior: 'instant' });
    }
    const reveal = element?.closest('.scroll-reveal');
    if (reveal) {
      reveal.classList.remove('reveal-pending');
      reveal.classList.add('route-shared-settled');
    }
    const shared = visible(element) && (!incoming || pending?.shared || type === 'book');
    const name = { book: 'route-book', contact: 'route-contact', 'contact-card': 'route-card', event: 'route-event' }[type];
    if (shared && name) {
      element.style.viewTransitionName = name;
      assigned.add(element);
    }
    if (incoming) {
      document.body.inert = true;
      interactionHeld = true;
    }
    function clean() {
      if (revision !== sequence) return;
      for (const previous of assigned) previous.style.removeProperty('view-transition-name');
      assigned.clear();
      delete root.dataset.routeMotion;
      if (interactionHeld) document.body.inert = false;
      interactionHeld = false;
    }
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

  addEventListener('pagereveal', event => {
    const pending = readPending();
    if (!event.viewTransition || reduce.matches || root.classList.contains('intro-playing')) {
      event.viewTransition?.ready.catch(() => {});
      event.viewTransition?.skipTransition();
    } else {
      const from = pending?.from || window.navigation?.activation?.from?.url;
      if (from) prepare(event.viewTransition, new URL(from), new URL(location.href), true, pending);
    }
    try { sessionStorage.removeItem(key); } catch { /* Storage is optional. */ }
  });
  addEventListener('pageshow', () => {
    if (!('onpagereveal' in window)) {
      try { sessionStorage.removeItem(key); } catch { /* Storage is optional. */ }
    }
    selected = null;
  });
})();
