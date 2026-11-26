(() => {
  const { ga4Id, analyticsOrigin } = document.currentScript.dataset;
  if (location.origin !== analyticsOrigin || ['#edit', '#preview-now'].includes(location.hash) ||
      (location.pathname === '/' && new URLSearchParams(location.search).get('owner') === '1') ||
      navigator.globalPrivacyControl || navigator.doNotTrack === '1') return;

  window[`ga-disable-${ga4Id}`] = false;
  window.dataLayer ||= [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
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
})();
