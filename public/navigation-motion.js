(() => {
  const documentRoot = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const detailPath = /^\/(work|writing)\/[^/]+\/$/;

  function trackTransition(transition, from, to) {
    if (reducedMotion.matches) {
      transition.skipTransition();
      return;
    }
    if (!from || !to || from.origin !== location.origin || to.origin !== location.origin) return;

    const enteringDetail = detailPath.test(to.pathname) && !detailPath.test(from.pathname);
    const leavingDetail = detailPath.test(from.pathname) && !detailPath.test(to.pathname);
    documentRoot.dataset.pageMotion = enteringDetail ? 'forward' : leavingDetail ? 'back' : 'across';

    const detail = enteringDetail ? to.pathname : from.pathname;
    const overview = enteringDetail ? from.pathname : to.pathname;
    const relatedOverview = overview === '/' || detail.startsWith(overview);
    const entry = (enteringDetail || leavingDetail) && relatedOverview
      ? Array.from(document.querySelectorAll('[data-motion-route]'))
          .find(item => item.dataset.motionRoute === detail)
      : null;

    const matched = [];
    if (entry) {
      for (const [selector, name] of [['.media-window', 'portfolio-media'], ['h1, h2, h3', 'portfolio-title']]) {
        const element = entry.querySelector(selector);
        if (!element) continue;
        const position = element.getBoundingClientRect();
        if (position.bottom <= 0 || position.top >= innerHeight) continue;
        element.style.viewTransitionName = name;
        matched.push(element);
      }
    }

    function clearTransition() {
      delete documentRoot.dataset.pageMotion;
      for (const element of matched) element.style.removeProperty('view-transition-name');
    }
    transition.ready.catch(() => {});
    transition.finished.then(clearTransition, clearTransition);
  }

  addEventListener('pageswap', event => {
    if (!event.viewTransition || !event.activation?.entry) return;
    trackTransition(event.viewTransition, new URL(location.href), new URL(event.activation.entry.url));
  });

  addEventListener('pagereveal', event => {
    if (!event.viewTransition) return;
    if (reducedMotion.matches || documentRoot.classList.contains('intro-playing')) {
      event.viewTransition.ready.catch(() => {});
      event.viewTransition.skipTransition();
      return;
    }
    documentRoot.classList.add('page-transitioning');
    const activation = window.navigation?.activation;
    if (activation?.from && activation.entry) {
      trackTransition(event.viewTransition, new URL(activation.from.url), new URL(activation.entry.url));
    }
  });
})();
