(() => {
  const header = document.querySelector('[data-blended-header]');
  if (!header) return;
  const body = document.body;
  const wordmark = header.querySelector('.wordmark');
  const journey = document.querySelector('[data-header-surface="journey"]');
  const selector = '[data-header-surface]';
  let surfaces = [];
  let frame;
  let height;
  let inkPoint;
  let current;

  function paint() {
    if (surfaces.some(section => !section.isConnected)) surfaces = [...document.querySelectorAll(selector)];
    const bar = header.getBoundingClientRect();
    const region = surfaces.find(section => {
      const { top, bottom } = section.getBoundingClientRect();
      return top <= bar.bottom + 1 && bottom > bar.bottom + 1;
    }) || journey || body;
    const bounds = region.getBoundingClientRect();
    const kind = region.dataset.headerSurface;
    const pseudo = kind === 'about' || kind === 'journey';

    if (current?.region !== region || current.height !== bounds.height) {
      const style = getComputedStyle(region, pseudo ? '::before' : null);
      const tint = style.getPropertyValue('--header-colour').trim();
      const top = pseudo ? parseFloat(style.top) : kind === 'opening' ? -height : 0;
      const fade = kind === 'journey' ? -parseFloat(style.bottom)
        : kind === 'about' ? parseFloat(getComputedStyle(region).paddingBottom) : 0;
      const length = bounds.height - top + (kind === 'journey' ? fade : 0);
      const mirrored = !tint && style.backgroundImage.includes('gradient(') && !style.backgroundImage.includes('url(');
      const ground = pseudo ? (kind === 'journey' ? style.backgroundColor : '')
        : tint || (style.backgroundColor === 'rgba(0, 0, 0, 0)' ? '' : style.backgroundColor);

      header.style.setProperty('--header-ground', ground);
      header.style.setProperty('--header-wash-image', mirrored ? style.backgroundImage : 'none');
      header.style.setProperty('--header-wash-color', kind === 'about' ? style.backgroundColor : 'transparent');
      header.style.setProperty('--header-wash-mask', kind === 'about' ? style.maskImage : 'none');
      header.style.setProperty('--header-wash-height', mirrored ? `${length}px` : '0px');
      current = { region, height: bounds.height, length, top, fade, mirrored, offset: undefined };
    }

    const offset = Math.max(0, Math.min(current.length, bar.top - bounds.top - current.top));
    if (current.mirrored && current.offset !== offset) {
      header.style.setProperty('--header-wash-offset', `${-offset}px`);
      current.offset = offset;
    }
    const darkUntil = current.length - current.fade * .5;
    header.toggleAttribute('data-header-dark', kind === 'dark' || (kind === 'about' && offset + inkPoint < darkUntil));
  }

  function measure() {
    const bar = header.getBoundingClientRect();
    height = bar.height;
    const name = wordmark?.getBoundingClientRect();
    inkPoint = name ? name.top + name.height / 2 - bar.top : height / 2;
    body.style.setProperty('--blended-header-height', `${height}px`);
    surfaces = [...document.querySelectorAll(selector)];
    current = undefined;
    paint();
  }

  function schedule() {
    if (frame !== undefined) return;
    frame = requestAnimationFrame(() => {
      frame = undefined;
      paint();
    });
  }

  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', measure);
  addEventListener('pageshow', measure);
  if ('ResizeObserver' in window) {
    const geometry = new ResizeObserver(measure);
    geometry.observe(header);
    geometry.observe(document.querySelector('main'));
  }
  measure();
})();
