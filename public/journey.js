(() => {
  const timeline = document.querySelector('[data-journey-timeline]');
  if (!timeline) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const points = [...timeline.querySelectorAll('.journey-point')];
  let reached = 0;
  let frame;

  function updateTimeline() {
    frame = undefined;
    const revealLine = innerHeight * .84;
    const bounds = timeline.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (revealLine - bounds.top) / bounds.height));
    timeline.style.setProperty('--journey-progress', progress.toFixed(4));

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
