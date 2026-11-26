(() => {
  const { clarityProject, analyticsOrigin } = document.currentScript.dataset;
  if (location.origin !== analyticsOrigin || ['#edit', '#preview-now'].includes(location.hash) ||
      (location.pathname === '/' && new URLSearchParams(location.search).get('owner') === '1') ||
      navigator.globalPrivacyControl || navigator.doNotTrack === '1' || window.clarity) return;

  function clarity() {
    (clarity.q ||= []).push(arguments);
  }

  window.clarity = clarity;
  clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' });
  const tag = document.createElement('script');
  tag.async = true;
  tag.src = `https://www.clarity.ms/tag/${clarityProject}`;
  document.head.append(tag);
})();
