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
  const selectionLabel = calendar?.querySelector('[data-calendar-selection]');
  const scrubber = calendar?.querySelector('.journey-scrubber');
  const firstYear = yearLabel?.textContent;
  const header = document.querySelector('.site-header');
  const mobileCalendar = matchMedia('(max-width: 760px)');
  const formatMonth = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' });
  const months = Array.from({ length: 12 }, (_, month) => formatMonth.format(Date.UTC(2000, month, 1)));
  const milestones = [...timeline.querySelectorAll('.journey-milestone')].map(marker => ({
    marker, year: marker.dataset.milestoneYear || firstYear,
    month: months[Number(marker.dataset.calendarMonth) - 1] || '',
    title: marker.querySelector('.journey-title').textContent,
  }));
  let selectedIndex = -1;
  let pointer;
  let landing;
  let landingTimer;
  let calendarHeight;
  let reached = 0;
  let frame;

  function readingLine() {
    const chrome = header.offsetHeight + (mobileCalendar.matches ? calendar.offsetHeight : 0);
    return Math.max(innerHeight * .46, chrome + 16);
  }

  function showMilestone(index) {
    if (index === selectedIndex) return;
    selectedIndex = index;
    const { month, year, title } = milestones[index];
    yearLabel.textContent = year;
    monthLabel.textContent = month;
    selectionLabel.textContent = title;
    scrubber.value = index;
    scrubber.setAttribute('aria-valuetext', [month, year, '–', title].filter(Boolean).join(' '));
    calendar.style.setProperty('--calendar-position', `${index / Math.max(1, milestones.length - 1) * 100}%`);
  }

  function stopLanding() {
    clearTimeout(landingTimer);
    landing = undefined;
  }

  function updateCalendar() {
    if (!scrubber || pointer !== undefined) return;
    if (landing !== undefined) {
      if (Math.abs(scrollY - landing) > 2) return;
      stopLanding();
    }
    const line = readingLine();
    const index = milestones.findLastIndex(({ marker }) => marker.getBoundingClientRect().top <= line);
    showMilestone(Math.max(0, index));
  }

  function landOnMilestone() {
    const index = Number(scrubber.value);
    showMilestone(index);
    const line = readingLine();
    const desired = scrollY + milestones[index].marker.getBoundingClientRect().top - line + 2;
    const limit = document.documentElement.scrollHeight - innerHeight;
    const target = Math.max(0, Math.min(limit, desired));
    if (target === landing) return;
    stopLanding();
    landing = target;
    const behavior = reducedMotion.matches || Math.abs(target - scrollY) > innerHeight * 2.4 ? 'instant' : 'smooth';
    scrollTo({ top: target, behavior });
    landingTimer = setTimeout(() => {
      stopLanding();
      scheduleTimelineUpdate();
    }, 850);
  }

  function previewPointer(event) {
    const bounds = scrubber.getBoundingClientRect();
    const trackInset = 10;
    const fraction = Math.max(0, Math.min(1, (event.clientX - bounds.left - trackInset) / Math.max(1, bounds.width - trackInset * 2)));
    showMilestone(Math.round(fraction * (milestones.length - 1)));
  }

  function updateTimeline() {
    frame = undefined;
    if (calendar && calendar.offsetHeight !== calendarHeight) {
      calendarHeight = calendar.offsetHeight;
      timeline.style.setProperty('--journey-calendar-height', `${calendarHeight}px`);
    }
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
  if ('ResizeObserver' in window) {
    const geometry = new ResizeObserver(scheduleTimelineUpdate);
    geometry.observe(timeline);
    if (calendar) geometry.observe(calendar);
  }
  if (scrubber) {
    calendar.hidden = false;
    showMilestone(0);
    scrubber.addEventListener('pointerdown', event => {
      if (event.button !== 0 || pointer !== undefined) return;
      event.preventDefault();
      if (landing !== undefined) scrollTo({ top: scrollY, behavior: 'instant' });
      stopLanding();
      pointer = event.pointerId;
      scrubber.focus({ preventScroll: true });
      scrubber.setPointerCapture(pointer);
      previewPointer(event);
    });
    scrubber.addEventListener('pointermove', event => {
      if (event.pointerId === pointer) previewPointer(event);
    });
    scrubber.addEventListener('input', () => showMilestone(Number(scrubber.value)));
    scrubber.addEventListener('change', () => {
      if (pointer === undefined) landOnMilestone();
    });
    addEventListener('pointerup', event => {
      if (event.pointerId !== pointer) return;
      previewPointer(event);
      pointer = undefined;
      landOnMilestone();
    });
    addEventListener('pointercancel', event => {
      if (event.pointerId !== pointer) return;
      pointer = undefined;
      scheduleTimelineUpdate();
    });
    addEventListener('wheel', stopLanding, { passive: true });
    addEventListener('blur', () => {
      pointer = undefined;
      stopLanding();
      scheduleTimelineUpdate();
    });
  }
  setTimelineMotion();

  timeline.addEventListener('toggle', scheduleTimelineUpdate, true);
  reducedMotion.addEventListener('change', setTimelineMotion);
  addEventListener('hashchange', scheduleTimelineUpdate);
})();
