(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const evidence = document.querySelector('#evidence');
  if (evidence) {
    const filters = evidence.querySelector('[data-evidence-filters]');
    const filterButtons = [...filters.querySelectorAll('[data-evidence-filter]')];
    const nodes = [...evidence.querySelectorAll('[data-evidence-node]')];
    const branches = [...evidence.querySelectorAll('[data-evidence-branch]')];
    const panel = evidence.querySelector('[data-evidence-selection]');
    const records = new Map([...evidence.querySelectorAll('template[data-evidence-record]')]
      .map(template => [template.dataset.evidenceRecord, template]));
    const compact = matchMedia('(max-width: 760px)');
    let selected;

    function select(node) {
      if (node === selected) return;
      selected?.removeAttribute('aria-current');
      selected = node;
      selected.setAttribute('aria-current', 'true');
      panel.replaceChildren(records.get(node.dataset.evidenceNode).content.cloneNode(true));
    }

    for (const node of nodes) {
      node.addEventListener('click', event => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        select(node);
        if (event.detail === 0) {
          panel.focus();
        } else if (compact.matches && panel.getBoundingClientRect().top > innerHeight - 90) {
          panel.scrollIntoView({ block: 'nearest', behavior: reducedMotion.matches ? 'instant' : 'smooth' });
        }
      });
    }

    for (const button of filterButtons) {
      button.addEventListener('click', () => {
        const topic = button.dataset.evidenceFilter;
        for (const filter of filterButtons) filter.setAttribute('aria-pressed', String(filter === button));
        for (const node of nodes) {
          node.parentElement.hidden = topic !== 'all' && !node.dataset.evidenceTopics.split(' ').includes(topic);
        }
        for (const branch of branches) branch.hidden = !branch.querySelector('li:not([hidden])');
        if (selected.parentElement.hidden) select(nodes.find(node => !node.parentElement.hidden));
      });
    }

    select(nodes[0]);
    filters.hidden = false;
  }

  const copyDialog = document.querySelector('.section-link-dialog');
  const copyAddress = copyDialog?.querySelector('input');
  const announcer = document.createElement('p');
  announcer.className = 'section-copy-announcer';
  announcer.setAttribute('role', 'status');

  const copyButtons = document.querySelectorAll('[data-copy-section]');
  if (copyButtons.length) document.body.append(announcer);
  for (const button of copyButtons) {
    const label = button.querySelector('[data-section-copy-label]');
    let pending = false;
    let reset;
    button.hidden = false;
    button.addEventListener('click', async () => {
      if (pending) return;
      pending = true;
      clearTimeout(reset);
      announcer.textContent = '';
      const url = new URL(location.href);
      url.search = '';
      url.hash = button.dataset.copySection;
      try {
        await navigator.clipboard.writeText(url.href);
        label.textContent = 'Copied';
        announcer.textContent = 'Section link copied.';
        reset = setTimeout(() => { label.textContent = 'Copy link'; }, 2400);
      } catch {
        label.textContent = 'Copy link';
        copyAddress.value = url.href;
        if (!copyDialog.open) copyDialog.showModal();
        copyAddress.focus();
        copyAddress.select();
      } finally {
        pending = false;
      }
    });
  }

  let highlighted;
  let clearHighlight;
  function showSharedSection() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (!target?.hasAttribute('data-share-section')) return;
    const disclosure = target.querySelector('[data-open-for-section-link]');
    if (disclosure && !disclosure.open) {
      disclosure.open = true;
      // A different brief may have closed above this anchor.
      target.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
    clearTimeout(clearHighlight);
    highlighted?.removeAttribute('data-section-arrival');
    highlighted = target;
    target.setAttribute('data-section-arrival', '');
    clearHighlight = setTimeout(() => target.removeAttribute('data-section-arrival'), 1900);
  }
  if (copyButtons.length) {
    addEventListener('hashchange', showSharedSection);
    showSharedSection();
  }
  for (const link of document.querySelectorAll('.journey-step a')) {
    link.addEventListener('click', event => {
      if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && link.hash === location.hash) {
        showSharedSection();
      }
    });
  }

  const terms = document.querySelectorAll('abbr[data-glossary]');
  if (terms.length) {
    const definition = document.createElement('div');
    definition.id = 'glossary-definition';
    definition.className = 'glossary-definition';
    definition.setAttribute('role', 'status');
    definition.hidden = true;
    document.body.append(definition);
    let activeTerm;

    function closeDefinition() {
      if (!activeTerm) return;
      activeTerm.setAttribute('aria-expanded', 'false');
      activeTerm = null;
      definition.hidden = true;
    }

    for (const term of terms) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'glossary-term';
      button.textContent = term.textContent;
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-controls', definition.id);
      const description = term.title;
      term.replaceWith(button);
      button.addEventListener('click', () => {
        const wasOpen = activeTerm === button;
        closeDefinition();
        if (wasOpen) return;
        activeTerm = button;
        button.setAttribute('aria-expanded', 'true');
        definition.hidden = false;
        definition.textContent = description;
        const bounds = button.getBoundingClientRect();
        const { offsetWidth, offsetHeight } = definition;
        const viewportWidth = document.documentElement.clientWidth;
        const left = Math.max(12, Math.min(bounds.left, viewportWidth - offsetWidth - 12));
        const top = bounds.bottom + offsetHeight + 20 <= innerHeight
          ? bounds.bottom + 8 : Math.max(12, bounds.top - offsetHeight - 8);
        definition.style.left = left + 'px';
        definition.style.top = top + 'px';
      });
    }
    document.addEventListener('click', event => {
      if (activeTerm && !activeTerm.contains(event.target) && !definition.contains(event.target)) closeDefinition();
    });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeDefinition(); });
    addEventListener('scroll', closeDefinition, { passive: true });
    addEventListener('resize', closeDefinition);
  }

  const briefing = document.querySelector('[data-site-update]');
  if (briefing) {
    const key = 'portfolio-seen-update';
    const release = briefing.dataset.siteUpdate;
    const details = briefing.querySelector('details');
    const unread = briefing.querySelector('[data-site-update-unread]');
    const dismiss = briefing.querySelector('[data-dismiss-site-update]');
    function rememberRelease() {
      try { localStorage.setItem(key, release); } catch { /* The updates link still works. */ }
    }
    try {
      const seen = localStorage.getItem(key);
      if (!seen) rememberRelease();
      else if (seen !== release) {
        briefing.setAttribute('data-new-release', '');
        unread.hidden = false;
        dismiss.hidden = false;
      }
    } catch { /* Visitors can open the briefing from the footer. */ }

    function openFromLink() {
      if (location.hash === '#site-updates') details.open = true;
    }
    addEventListener('hashchange', openFromLink);
    openFromLink();
    document.querySelector('footer a[href="#site-updates"]').addEventListener('click', openFromLink);
    details.addEventListener('toggle', () => { if (details.open) rememberRelease(); });
    dismiss.addEventListener('click', () => {
      rememberRelease();
      details.open = false;
      unread.hidden = true;
      dismiss.hidden = true;
      briefing.removeAttribute('data-new-release');
      if (location.hash === '#site-updates') {
        const url = new URL(location.href);
        url.hash = '';
        history.replaceState(history.state, '', url);
      }
    });
  }
})();
