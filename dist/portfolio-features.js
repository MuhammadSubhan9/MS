import { disclosureTiming, revealPanel } from './disclosure-motion.js';

(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const courses = document.querySelector('#courses .section-content');
  if (courses) {
    const cards = [...courses.children];
    const compact = matchMedia('(max-width: 560px)');
    const tablet = matchMedia('(max-width: 900px)');
    let columnsShown;

    function arrangeCourses() {
      const count = compact.matches ? 1 : tablet.matches ? 2 : 3;
      if (count === columnsShown) return;
      columnsShown = count;
      const focused = courses.contains(document.activeElement) ? document.activeElement : null;
      if (count === 1) {
        courses.replaceChildren(...cards);
      } else {
        const columns = Array.from({ length: count }, () => {
          const column = document.createElement('div');
          column.className = 'course-column';
          return column;
        });
        cards.forEach((card, index) => columns[index % count].append(card));
        courses.replaceChildren(...columns);
      }
      focused?.focus({ preventScroll: true });
    }

    arrangeCourses();
    compact.addEventListener('change', arrangeCourses);
    tablet.addEventListener('change', arrangeCourses);
  }

  const certificateDialog = document.querySelector('.certificate-dialog');
  if (typeof certificateDialog?.showModal === 'function') {
    const preview = certificateDialog.querySelector('.certificate-dialog-content');
    for (const button of document.querySelectorAll('.entry-preview')) {
      const template = button.nextElementSibling;
      button.hidden = false;
      button.addEventListener('click', () => {
        preview.replaceChildren(template.content.cloneNode(true));
        certificateDialog.showModal();
      });
    }
  }

  const evidence = document.querySelector('#evidence');
  if (evidence) {
    const filters = evidence.querySelector('[data-evidence-filters]');
    const filterButtons = [...filters.querySelectorAll('[data-evidence-filter]')];
    const nodes = [...evidence.querySelectorAll('[data-evidence-node]')];
    const nodeTopics = new Map(nodes.map(node => [node, node.dataset.evidenceTopics.split(' ')]));
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
      const connectedTopics = new Set(nodeTopics.get(node));
      for (const branch of branches) {
        branch.toggleAttribute('data-evidence-topic-match', connectedTopics.has(branch.dataset.evidenceBranch));
      }
      for (const button of filterButtons) {
        button.toggleAttribute('data-evidence-topic-match', connectedTopics.has(button.dataset.evidenceFilter));
      }
      for (const other of nodes) {
        other.toggleAttribute('data-evidence-related', other !== node && nodeTopics.get(other).some(topic => connectedTopics.has(topic)));
      }
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
          node.parentElement.hidden = topic !== 'all' && !nodeTopics.get(node).includes(topic);
        }
        for (const branch of branches) branch.hidden = !branch.querySelector('li:not([hidden])');
        if (selected.parentElement.hidden) select(nodes.find(node => !node.parentElement.hidden));
      });
    }

    select(nodes[0]);
    filters.hidden = false;
  }

  const featuredEvent = document.querySelector('[data-feature-spread]');
  const featuredToggle = featuredEvent?.querySelector('.project-action');
  if (featuredToggle) featuredToggle.dataset.eventToggle = featuredEvent.dataset.featureSpread;
  let activeEvent;
  for (const toggle of document.querySelectorAll('[data-event-toggle]')) {
    const spread = document.getElementById(toggle.dataset.eventToggle);
    const label = toggle.querySelector('[data-event-toggle-label]') ?? toggle.querySelector('.link-label');
    if (!spread || !label) continue;
    const closedLabel = label.textContent;
    toggle.setAttribute('role', 'button');
    toggle.setAttribute('aria-controls', spread.id);
    toggle.setAttribute('aria-expanded', 'false');

    function setOpen(open, instant = false) {
      if (!open && spread.contains(document.activeElement)) toggle.focus({ preventScroll: true });
      toggle.setAttribute('aria-expanded', String(open));
      label.textContent = open ? 'Close summary' : closedLabel;
      // Reserve the full row before animating its artwork so the read-more link is immediately reachable.
      revealPanel(spread, open, instant || open);
    }
    toggle.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      event.preventDefault();
      if (activeEvent === setOpen) {
        setOpen(false);
        activeEvent = undefined;
        return;
      }
      const top = toggle.getBoundingClientRect().top;
      activeEvent?.(false, true);
      setOpen(true);
      activeEvent = setOpen;
      const shift = toggle.getBoundingClientRect().top - top;
      if (shift) window.scrollBy({ top: shift, behavior: 'instant' });
    });
    toggle.addEventListener('keydown', event => {
      if (event.key !== ' ') return;
      event.preventDefault();
      if (!event.repeat) toggle.click();
    });
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
    function clearCopyState() {
      delete button.dataset.copyState;
      label.textContent = 'Copy link';
    }
    button.hidden = false;
    button.addEventListener('click', async () => {
      if (pending) return;
      pending = true;
      clearTimeout(reset);
      clearCopyState();
      announcer.textContent = '';
      const url = new URL(location.href);
      url.search = '';
      url.hash = button.dataset.copySection;
      try {
        await navigator.clipboard.writeText(url.href);
        label.textContent = 'Copied';
        button.dataset.copyState = 'copied';
        announcer.textContent = 'Section link copied.';
        reset = setTimeout(clearCopyState, 2400);
      } catch {
        copyAddress.value = url.href;
        if (!copyDialog.open) copyDialog.showModal();
        copyAddress.focus();
        copyAddress.select();
      } finally {
        pending = false;
      }
    });
  }

  const moving = new Map();

  function settle(card, panel, open) {
    const motion = moving.get(card);
    moving.delete(card);
    card.open = open;
    motion?.animation.cancel();
    panel.inert = false;
    delete card.dataset.disclosureState;
  }

  for (const card of document.querySelectorAll('.entry-details, .journey-card')) {
    const summary = card.firstElementChild;
    const panel = summary.nextElementSibling;
    summary.addEventListener('click', event => {
      if (event.defaultPrevented || reducedMotion.matches || typeof panel.animate !== 'function') return;
      event.preventDefault();

      const previous = moving.get(card);
      const open = !(previous?.open ?? card.open);
      const start = card.open ? panel.getBoundingClientRect().height : 0;
      previous?.animation.cancel();
      if (open) card.open = true;
      const fullHeight = panel.getBoundingClientRect().height;
      const end = open ? fullHeight : 0;
      if (Math.abs(end - start) < 1) {
        settle(card, panel, open);
        return;
      }

      if (!open && panel.contains(document.activeElement)) summary.focus({ preventScroll: true });
      panel.inert = !open;
      card.dataset.disclosureState = open ? 'opening' : 'closing';
      const animation = panel.animate([{ height: start + 'px' }, { height: end + 'px' }],
        disclosureTiming(open, Math.abs(end - start), fullHeight));
      moving.set(card, { animation, open, panel });
      animation.finished.then(() => {
        if (moving.get(card)?.animation === animation) settle(card, panel, open);
      }, () => {});
    });
  }

  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      for (const [card, { panel, open }] of moving) settle(card, panel, open);
    }
  });

  let highlighted;
  let clearHighlight;
  function showSharedSection() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (!target?.hasAttribute('data-share-section')) return;
    const disclosure = target.querySelector('[data-open-for-section-link]');
    const motion = moving.get(disclosure);
    if (disclosure?.closest('[data-share-section]') === target && (!disclosure.open || motion)) {
      if (motion) settle(disclosure, motion.panel, true);
      else disclosure.open = true;
      target.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
    clearTimeout(clearHighlight);
    highlighted?.removeAttribute('data-section-arrival');
    highlighted = target;
    target.setAttribute('data-section-arrival', '');
    clearHighlight = setTimeout(() => target.removeAttribute('data-section-arrival'), 1900);
  }
  addEventListener('hashchange', showSharedSection);
  showSharedSection();

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
})();
