(() => {
  const intro = document.querySelector('.opening');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const navigation = performance.getEntriesByType('navigation')[0];
  const storageKey = 'subhan-intro-seen';
  if (!intro?.showModal || reducedMotion.matches || location.hash || navigation?.type === 'back_forward') return;

  try {
    if (sessionStorage.getItem(storageKey) === '1') return;
    sessionStorage.setItem(storageKey, '1');
  } catch {
    return;
  }

  const root = document.documentElement;
  const skip = intro.querySelector('button');
  let hold;
  let cleanup;

  function closeIntro() {
    clearTimeout(hold);
    clearTimeout(cleanup);
    root.classList.remove('intro-playing', 'intro-leaving');
    intro.close();
    intro.classList.remove('leaving');
    reducedMotion.removeEventListener('change', onMotionChange);
    removeEventListener('pagehide', closeIntro);
  }

  function dismiss(focusContent = false) {
    if (intro.classList.contains('leaving')) return;
    clearTimeout(hold);
    root.classList.replace('intro-playing', 'intro-leaving');
    intro.classList.add('leaving');
    cleanup = setTimeout(() => {
      closeIntro();
      if (focusContent) document.querySelector('main').focus({ preventScroll: true });
    }, 1150);
  }

  function onMotionChange(event) {
    if (event.matches) closeIntro();
  }

  skip.addEventListener('click', () => dismiss(true));
  intro.addEventListener('cancel', event => {
    event.preventDefault();
    dismiss(true);
  });
  reducedMotion.addEventListener('change', onMotionChange);
  addEventListener('pagehide', closeIntro);
  root.classList.add('intro-playing');
  scrollTo({ top: 0, behavior: 'instant' });
  intro.showModal();
  hold = setTimeout(dismiss, 3500);
})();
