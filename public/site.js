import { revealPanel } from './disclosure-motion.js';

document.documentElement.classList.add('js');
const button = document.querySelector('.menu');
const navigation = document.querySelector('.header-nav');
if (button && navigation) {
  const mobile = matchMedia('(max-width: 880px)');
  const expanded = () => button.getAttribute('aria-expanded') === 'true';
  function setMenu(open, instant = false) {
    button.setAttribute('aria-expanded', String(open));
    revealPanel(navigation, open || !mobile.matches, instant);
  }
  function close() {
    if (expanded()) setMenu(false);
  }
  button.hidden = false;
  setMenu(false, true);
  button.addEventListener('click', () => setMenu(!expanded()));
  navigation.addEventListener('focusin', () => {
    if (navigation.dataset.revealMotion === 'opening') setMenu(true, true);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && expanded()) {
      close();
      button.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) close();
  });
  document.addEventListener('focusin', event => {
    if (!event.target.closest('.site-header')) close();
  });
  mobile.addEventListener('change', () => setMenu(false, true));
}
document.querySelector('[data-year]').textContent = new Date().getFullYear();

function prepareScrollReveals() {
  if (!matchMedia('(prefers-reduced-motion: no-preference)').matches ||
      !('IntersectionObserver' in window)) return;

  const sections = document.querySelectorAll([
    '[data-reveal]', '.featured-project', '.home-writing figure',
    '.project-index > .project-entry', '.article-section', '.article-nav',
  ].join(', '));
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.remove('reveal-pending');
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -5% 0px' });

  for (const section of sections) {
    if (section.getBoundingClientRect().top < window.innerHeight || section.matches(':target')) continue;
    section.classList.add('scroll-reveal', 'reveal-pending');
    observer.observe(section);
  }
}

prepareScrollReveals();

for (const link of document.querySelectorAll('.media-link')) {
  const canTrack = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  let frame = 0;
  link.addEventListener('pointermove', event => {
    if (!canTrack.matches || event.pointerType === 'touch') return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const bounds = link.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
      const y = Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height));
      link.style.setProperty('--light-x', `${x * 100}%`);
      link.style.setProperty('--light-y', `${y * 100}%`);
      link.style.setProperty('--image-x', `${(0.5 - x) * 12}px`);
      link.style.setProperty('--image-y', `${(0.5 - y) * 10}px`);
    });
  }, { passive: true });
  function resetImagePosition() {
    cancelAnimationFrame(frame);
    for (const property of ['--light-x', '--light-y', '--image-x', '--image-y']) {
      link.style.removeProperty(property);
    }
  }
  link.addEventListener('pointerleave', resetImagePosition);
  link.addEventListener('pointercancel', resetImagePosition);
}
