document.documentElement.classList.add('js');
const button = document.querySelector('.menu');
const navigation = document.querySelector('.header-nav');
if (button && navigation) {
  const mobile = matchMedia('(max-width: 880px)');
  const expanded = () => button.getAttribute('aria-expanded') === 'true';
  function setMenu(open) {
    button.setAttribute('aria-expanded', String(open));
    navigation.hidden = !open && mobile.matches;
    navigation.inert = navigation.hidden;
  }
  function close() {
    if (expanded()) setMenu(false);
  }
  button.hidden = false;
  setMenu(false);
  button.addEventListener('click', () => setMenu(!expanded()));
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
  mobile.addEventListener('change', () => setMenu(false));
}
document.querySelector('[data-year]').textContent = new Date().getFullYear();

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
