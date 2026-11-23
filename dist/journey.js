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
    const revealLine = innerHeight * .92;
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

  timeline.addEventListener('toggle', scheduleTimelineUpdate, true);
  reducedMotion.addEventListener('change', setTimelineMotion);
  addEventListener('hashchange', scheduleTimelineUpdate);
})();
