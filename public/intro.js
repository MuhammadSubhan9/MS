(() => {
  const intro = document.querySelector('.opening');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const navigation = performance.getEntriesByType('navigation')[0];
  const storageKey = 'subhan-intro-seen';
  const openingDuration = 2950;
  if (document.documentElement.classList.contains('page-transitioning')) return;
  if (!intro?.showModal || reducedMotion.matches || location.hash || navigation?.type === 'back_forward') return;

  try {
    if (sessionStorage.getItem(storageKey) === '1') return;
    sessionStorage.setItem(storageKey, '1');
  } catch {
    return;
  }

  const root = document.documentElement;
  const skip = intro.querySelector('.opening-skip');
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
    if (intro.classList.contains('leaving')) {
      if (focusContent) enterPortfolio();
      return;
    }
    const exitDuration = focusContent ? 180 : 470;
    clearTimeout(hold);
    intro.style.setProperty('--opening-exit', exitDuration + 'ms');
    root.classList.replace('intro-playing', 'intro-leaving');
    intro.classList.add('leaving');
    cleanup = setTimeout(focusContent ? enterPortfolio : closeIntro, exitDuration);
  }

  function enterPortfolio() {
    closeIntro();
    document.querySelector('#main')?.focus({ preventScroll: true });
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
  intro.style.setProperty('--opening-duration', openingDuration + 'ms');
  root.classList.add('intro-playing');
  scrollTo({ top: 0, behavior: 'instant' });
  intro.showModal();
  hold = setTimeout(dismiss, openingDuration);
})();
