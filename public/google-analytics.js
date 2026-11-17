(() => {
  const { ga4Id, analyticsOrigin } = document.currentScript.dataset;
  if (location.origin !== analyticsOrigin || location.hash === '#edit' ||
      navigator.globalPrivacyControl || navigator.doNotTrack === '1') return;

  const preferences = document.querySelector('.analytics-preferences');
  if (!preferences) return;
  const buttons = [...preferences.querySelectorAll('[data-ga4-choice]')];
  const storageKey = 'portfolio-google-analytics';
  const disableTracking = `ga-disable-${ga4Id}`;
  const consent = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };
  let started = false;

  function start() {
    window[disableTracking] = false;
    if (started) {
      window.gtag('consent', 'update', { ...consent, analytics_storage: 'granted' });
      return;
    }

    started = true;
    window.dataLayer ||= [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', { ...consent, analytics_storage: 'granted' });
    window.gtag('js', new Date());
    window.gtag('config', ga4Id, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_domain: 'none',
    });

    const tag = document.createElement('script');
    tag.async = true;
    tag.src = `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`;
    document.head.append(tag);
  }

  function applyChoice(choice) {
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.ga4Choice === choice));
    if (choice === 'granted') {
      start();
    } else if (started) {
      window[disableTracking] = true;
      window.gtag('consent', 'update', { ...consent, analytics_storage: 'denied' });
    }
  }

  try {
    applyChoice(localStorage.getItem(storageKey) === 'granted' ? 'granted' : 'denied');
  } catch {
    applyChoice('denied');
  }
  for (const button of buttons) {
    button.addEventListener('click', () => {
      const choice = button.dataset.ga4Choice;
      try { localStorage.setItem(storageKey, choice); } catch { /* The choice still applies to this page. */ }
      applyChoice(choice);
      if (choice === 'denied') {
        for (const name of ['_ga', `_ga_${ga4Id.slice(2)}`]) {
          document.cookie = `${name}=; Max-Age=0; Path=/; Secure`;
        }
      }
    });
  }
  preferences.hidden = false;
})();
