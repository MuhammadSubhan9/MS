(() => {
  const header = document.querySelector('.journey-document .site-header');
  const hero = document.querySelector('.journey-hero');
  const wordmark = header?.querySelector('.wordmark');
  if (!hero || !wordmark) return;

  let headerHeight;
  let washHeight;
  let inkPoint;
  let paperPoint;
  let lastOffset;
  let frame;

  function paintHeader() {
    const offset = Math.min(washHeight, Math.max(0,
      header.getBoundingClientRect().top + headerHeight - hero.getBoundingClientRect().top));
    if (offset === lastOffset) return;
    header.style.setProperty('--journey-wash-offset', `${-offset}px`);
    header.toggleAttribute('data-paper-ink', offset + inkPoint >= paperPoint);
    lastOffset = offset;
  }

  function measureWash() {
    const bounds = header.getBoundingClientRect();
    const name = wordmark.getBoundingClientRect();
    headerHeight = bounds.height;
    inkPoint = name.top + name.height / 2 - bounds.top;
    document.body.style.setProperty('--journey-header-height', `${headerHeight}px`);
    const wash = getComputedStyle(hero, '::before');
    const fade = -parseFloat(wash.bottom) - parseFloat(wash.paddingBottom);
    washHeight = headerHeight + hero.getBoundingClientRect().height + fade;
    paperPoint = washHeight - fade * .65;
    header.style.setProperty('--journey-wash-height', `${washHeight}px`);
    lastOffset = undefined;
    paintHeader();
  }

  addEventListener('scroll', () => {
    if (frame === undefined) {
      frame = requestAnimationFrame(() => {
        frame = undefined;
        paintHeader();
      });
    }
  }, { passive: true });
  addEventListener('resize', measureWash);
  addEventListener('pageshow', measureWash);
  if ('ResizeObserver' in window) {
    const geometry = new ResizeObserver(measureWash);
    geometry.observe(header);
    geometry.observe(hero);
  }
  measureWash();
})();

(() => {
  const timeline = document.querySelector('[data-journey-timeline]');
  if (!timeline) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const rail = timeline.querySelector('.journey-rail');
  const end = timeline.querySelector('.journey-end');
  const points = [...timeline.querySelectorAll('.journey-point')];
  let reached = 0;
  let frame;

  function updateTimeline() {
    frame = undefined;
    const revealLine = innerHeight * .84;
    const bounds = rail.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (revealLine - bounds.top) / bounds.height));
    timeline.style.setProperty('--journey-progress', progress.toFixed(4));
    if (progress === 1) end.setAttribute('data-reached', '');

    while (reached < points.length) {
      const point = points[reached];
      const position = point.getBoundingClientRect();
      if (position.top + position.height / 2 > revealLine) break;
      point.parentElement.setAttribute('data-reached', '');
      reached += 1;
    }
  }

  function scheduleTimelineUpdate() {
    if (!reducedMotion.matches && frame === undefined) frame = requestAnimationFrame(updateTimeline);
  }

  function setTimelineMotion() {
    const enabled = !reducedMotion.matches;
    timeline.toggleAttribute('data-journey-motion', enabled);
    if (enabled) {
      scheduleTimelineUpdate();
    } else {
      cancelAnimationFrame(frame);
      frame = undefined;
      timeline.style.removeProperty('--journey-progress');
    }
  }

  addEventListener('scroll', scheduleTimelineUpdate, { passive: true });
  addEventListener('resize', scheduleTimelineUpdate);
  addEventListener('pageshow', scheduleTimelineUpdate);
  if ('ResizeObserver' in window) new ResizeObserver(scheduleTimelineUpdate).observe(timeline);
  setTimelineMotion();

  const moving = new Map();

  function settle(card, panel, open) {
    const motion = moving.get(card);
    moving.delete(card);
    card.open = open;
    motion?.animation.cancel();
    panel.inert = false;
    delete card.dataset.journeyState;
    scheduleTimelineUpdate();
  }

  for (const card of timeline.querySelectorAll('.journey-card')) {
    const summary = card.querySelector('summary');
    const panel = card.querySelector('.journey-panel');
    summary.addEventListener('click', event => {
      if (event.defaultPrevented || reducedMotion.matches || !panel.animate) return;
      event.preventDefault();

      const previous = moving.get(card);
      const open = !(previous?.open ?? card.open);
      const start = card.open ? panel.getBoundingClientRect().height : 0;
      previous?.animation.cancel();
      if (open) card.open = true;
      const end = open ? panel.getBoundingClientRect().height : 0;
      if (Math.abs(end - start) < 1) {
        settle(card, panel, open);
        return;
      }

      if (!open && panel.contains(document.activeElement)) summary.focus({ preventScroll: true });
      panel.inert = !open;
      card.dataset.journeyState = open ? 'opening' : 'closing';
      const animation = panel.animate([{ height: start + 'px' }, { height: end + 'px' }], {
        duration: open ? 560 : 385,
        easing: open ? 'cubic-bezier(.23,.74,.2,1)' : 'cubic-bezier(.32,0,.25,1)',
        fill: 'both',
      });
      moving.set(card, { animation, open, panel });
      animation.finished.then(() => {
        if (moving.get(card)?.animation === animation) settle(card, panel, open);
      }, () => {});
    });
  }

  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      for (const [card, { panel, open }] of moving) settle(card, panel, open);
    }
    setTimelineMotion();
  });
  addEventListener('hashchange', () => {
    for (const [card, { panel }] of moving) {
      if ('#' + card.parentElement.id === location.hash) settle(card, panel, true);
    }
    scheduleTimelineUpdate();
  });
})();
