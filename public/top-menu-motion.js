const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

for (const menu of document.querySelectorAll('.site-header .nav, .novel-header .novel-index')) {
  const highlight = document.createElement('span');
  highlight.className = 'top-menu-highlight';
  highlight.setAttribute('aria-hidden', 'true');
  menu.prepend(highlight);

  let hovered;
  let position;
  let destination;
  let velocity = [0, 0, 0, 0];
  let frame = 0;
  let previousTime;

  function paint() {
    const [left, top, width, height] = position;
    const stretch = Math.min(.31, Math.abs(velocity[0]) / 1800);
    highlight.style.width = `${width}px`;
    highlight.style.height = `${height}px`;
    highlight.style.transform = `translate3d(${left}px, ${top}px, 0) scale(${1 + stretch}, ${1 - stretch * .56})`;
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    velocity.fill(0);
  }

  function advance(time) {
    const seconds = Math.min(.032, Math.max(0, (time - previousTime) / 1000));
    previousTime = time;
    position = position.map((value, axis) => {
      velocity[axis] += ((destination[axis] - value) * 280 - velocity[axis] * 23) * seconds;
      return value + velocity[axis] * seconds;
    });
    if (position.every((value, axis) => Math.abs(destination[axis] - value) < .25 && Math.abs(velocity[axis]) < 4)) {
      position = destination;
      stop();
    } else {
      frame = requestAnimationFrame(advance);
    }
    paint();
  }

  function retarget(instant = false) {
    menu.toggleAttribute('data-menu-motion', !reducedMotion.matches);
    const target = hovered || menu.querySelector('a:focus-visible') || menu.querySelector('a[aria-current]');
    const bounds = target?.getBoundingClientRect();
    if (reducedMotion.matches || target?.matches('.nav-contact') || !bounds?.width) {
      delete highlight.dataset.visible;
      stop();
      position = undefined;
      return;
    }

    const box = menu.getBoundingClientRect();
    destination = [bounds.left - box.left - menu.clientLeft, bounds.top - box.top - menu.clientTop, bounds.width, bounds.height];
    if (!position || instant) {
      stop();
      position = destination;
      paint();
      highlight.dataset.visible = '';
    } else if (!frame && position.some((value, axis) => value !== destination[axis])) {
      previousTime = performance.now();
      frame = requestAnimationFrame(advance);
    }
  }

  menu.addEventListener('pointerover', event => {
    const link = event.target.closest('a');
    if (event.pointerType === 'touch' || !link || link === hovered) return;
    hovered = link;
    retarget();
  });
  menu.addEventListener('pointerleave', () => {
    hovered = undefined;
    retarget();
  });
  menu.addEventListener('focusin', () => retarget());
  menu.addEventListener('focusout', () => queueMicrotask(() => retarget()));

  const currentPage = new MutationObserver(() => retarget());
  currentPage.observe(menu, { subtree: true, attributes: true, attributeFilter: ['aria-current'] });
  const resize = () => retarget(true);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(menu);
  window.addEventListener('resize', resize);
  window.addEventListener('pageshow', () => {
    hovered = undefined;
    resize();
  });
  reducedMotion.addEventListener('change', resize);
  document.fonts.ready.then(resize);
  resize();
}
