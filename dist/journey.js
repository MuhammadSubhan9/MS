(() => {
  const timeline = document.querySelector('[data-journey-timeline]');
  if (!timeline) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const rail = timeline.querySelector('.journey-rail');
  const end = timeline.querySelector('.journey-end');
  const points = [...timeline.querySelectorAll('.journey-point')];
  const calendar = document.querySelector('[data-journey-calendar]');
  const yearLabel = calendar?.querySelector('[data-calendar-display-year]');
  const monthLabel = calendar?.querySelector('[data-calendar-display-month]');
  const dateMarkers = [...timeline.querySelectorAll('[data-calendar-year], [data-calendar-month]')];
  const firstYear = yearLabel?.textContent;
  const formatMonth = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' });
  const months = Array.from({ length: 12 }, (_, month) => formatMonth.format(Date.UTC(2000, month, 1)));
  let currentYear;
  let currentMonth;
  let reached = 0;
  let frame;

  function updateCalendar() {
    if (!calendar) return;
    const readingLine = innerHeight * .46;
    let year = firstYear;
    let month = 0;
    for (const marker of dateMarkers) {
      if (marker.getBoundingClientRect().top > readingLine) break;
      if (marker.dataset.calendarYear) {
        year = marker.dataset.calendarYear;
        month = 0;
      } else {
        month = Number(marker.dataset.calendarMonth);
      }
    }
    if (year === currentYear && month === currentMonth) return;
    currentYear = year;
    currentMonth = month;
    yearLabel.textContent = year;
    monthLabel.textContent = months[month - 1] ?? '';
    calendar.style.setProperty('--calendar-position', `${Math.max(0, (month - .5) / 12) * 100}%`);
    calendar.toggleAttribute('data-calendar-dated', month > 0);
  }

  function updateTimeline() {
    frame = undefined;
    updateCalendar();
    if (reducedMotion.matches) return;
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
    if (frame === undefined) frame = requestAnimationFrame(updateTimeline);
  }

  function setTimelineMotion() {
    const enabled = !reducedMotion.matches;
    timeline.toggleAttribute('data-journey-motion', enabled);
    if (!enabled) {
      timeline.style.removeProperty('--journey-progress');
    }
    scheduleTimelineUpdate();
  }

  addEventListener('scroll', scheduleTimelineUpdate, { passive: true });
  addEventListener('resize', scheduleTimelineUpdate);
  addEventListener('pageshow', scheduleTimelineUpdate);
  if ('ResizeObserver' in window) new ResizeObserver(scheduleTimelineUpdate).observe(timeline);
  if (calendar) calendar.hidden = false;
  setTimelineMotion();

  timeline.addEventListener('toggle', scheduleTimelineUpdate, true);
  reducedMotion.addEventListener('change', setTimelineMotion);
  addEventListener('hashchange', scheduleTimelineUpdate);
})();
