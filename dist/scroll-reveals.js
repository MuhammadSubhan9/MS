const motion = matchMedia('(prefers-reduced-motion: no-preference)');
const groups = document.querySelectorAll([
  '[data-reveal]', '.featured-project', '.home-writing figure', '.now-panel > *',
  '.about-records .share-heading', '.work-section .share-heading', '.journey-history-heading',
  '.project-index > .project-entry', '.article-section', '.article-nav',
  '.synopsis-title', '.synopsis-copy', '.excerpt-heading',
].join(', '));

if (motion.matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.remove('reveal-pending');
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -8% 0px' });

  for (const group of groups) {
    if (group.getBoundingClientRect().top < innerHeight || group.matches(':target, :focus-within') || group.querySelector(':target')) continue;
    group.classList.add('scroll-reveal', 'reveal-pending');
    const parts = group.querySelectorAll(`
      :scope > :is(h2, h3, p, .reading),
      :scope > :is(.feature-copy, .share-heading) > :is(h2, h3, p),
      :scope.excerpt-heading > div > :is(h2, p)
    `);
    let order = 0;
    for (const part of parts) {
      if (part.querySelector('a[href], button, summary, input, select, textarea')) continue;
      part.classList.add('reveal-part');
      part.style.setProperty('--reveal-delay', `${Math.min(order++, 4) * 65}ms`);
    }
    observer.observe(group);
  }

  motion.addEventListener('change', () => {
    observer.disconnect();
    for (const group of groups) group.classList.remove('reveal-pending');
  }, { once: true });
}

const stage = document.querySelector('.experience-stage');
const track = stage?.querySelector('.experience-track');
if (track?.children.length > 1 && CSS.supports('overflow', 'clip')) {
  const sticky = stage.querySelector('.experience-sticky');
  const viewport = stage.querySelector('.experience-window');
  const header = document.querySelector('.site-header');
  const desktop = matchMedia('(min-width: 1100px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)');
  const coarsePointer = matchMedia('(pointer: coarse)');
  let travel = 0;
  let pinTop = 0;
  let offset = 0;
  let frame = 0;

  function render() {
    cancelAnimationFrame(frame);
    frame = 0;
    if (!travel) return;
    const next = Math.min(travel, Math.max(0, pinTop - stage.getBoundingClientRect().top));
    if (next === offset) return;
    offset = next;
    track.style.translate = `${-offset}px 0`;
  }

  function measure() {
    const wide = desktop.matches && !coarsePointer.matches;
    stage.toggleAttribute('data-pinned', wide);
    travel = 0;
    if (wide) {
      const spareHeight = innerHeight - header.offsetHeight - sticky.offsetHeight;
      if (spareHeight >= 48) {
        pinTop = header.offsetHeight + Math.max(24, Math.round(spareHeight * .35));
        travel = Math.max(0, track.scrollWidth - viewport.clientWidth);
      }
    }

    if (travel > 0) {
      stage.style.setProperty('--experience-travel', `${travel}px`);
      stage.style.setProperty('--experience-top', `${pinTop}px`);
      render();
    } else {
      stage.removeAttribute('data-pinned');
      stage.style.removeProperty('--experience-travel');
      stage.style.removeProperty('--experience-top');
      track.style.removeProperty('translate');
      offset = 0;
    }
  }

  addEventListener('scroll', () => {
    if (travel && !frame) frame = requestAnimationFrame(render);
  }, { passive: true });
  addEventListener('resize', measure);
  addEventListener('pageshow', measure);
  desktop.addEventListener('change', measure);
  coarsePointer.addEventListener('change', measure);
  document.fonts.ready.then(measure);
  viewport.addEventListener('focusin', event => {
    if (!travel || !event.target.matches(':focus-visible')) return;
    // A scroll and focus change can arrive before the next animation frame.
    render();
    const target = event.target.getBoundingClientRect();
    const windowBox = viewport.getBoundingClientRect();
    if (target.left >= windowBox.left && target.right <= windowBox.right) return;
    const panel = [...track.children].find(child => child.contains(event.target));
    const start = scrollY + stage.getBoundingClientRect().top - pinTop;
    scrollTo({ top: start + Math.min(panel.offsetLeft, travel), behavior: 'instant' });
    render();
  });
  measure();
}
