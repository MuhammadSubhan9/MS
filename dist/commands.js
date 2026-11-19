const palette = document.querySelector('#command-title')?.closest('dialog');

if (typeof palette?.showModal === 'function') {
  const form = palette.querySelector('form');
  const input = palette.querySelector('#command-input');
  const results = palette.querySelector('#command-results');
  const editor = palette.querySelector('[data-edit-command]');
  const feedback = palette.querySelector('.command-feedback');
  const selection = palette.querySelector('[data-command-selection]');
  const copyField = palette.querySelector('[data-command-copy]');
  function normalize(value) {
    return value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  }

  const entries = [...results.querySelectorAll('[data-command-entry]')].map(row => ({
    row,
    control: row.firstElementChild,
    title: normalize(row.querySelector('[data-command-label]').textContent),
    keywords: normalize(row.dataset.keywords),
  }));
  let visible = [];
  let selected = -1;

  function select(index, announce = false) {
    visible[selected]?.removeAttribute('data-command-selected');
    selected = index;
    const active = visible[index];
    active?.setAttribute('data-command-selected', '');
    if (announce && active) {
      active.scrollIntoView({ block: 'nearest' });
      selection.textContent = active.textContent.trim();
    }
  }

  function refresh() {
    select(-1);
    feedback.textContent = '';
    selection.textContent = '';
    copyField.hidden = true;
    const command = input.value.trim().toLowerCase().replace(/\s+/g, ' ');
    const editing = editor && (command === 'edit now' || command === 'clg upd');
    if (editor) editor.hidden = !editing;
    results.hidden = Boolean(editing);
    if (editing) {
      visible = [editor];
      select(0);
      return;
    }

    const query = normalize(input.value);
    const words = query.split(' ');
    const matches = entries.filter(({ title, keywords }) =>
      words.every(word => title.includes(word) || keywords.includes(word)));
    if (query) {
      const rank = ({ title, keywords }) => {
        if (title === query || keywords.split(' ').includes(query)) return 0;
        if (title.startsWith(query)) return 1;
        if (title.includes(query)) return 2;
        return 3;
      };
      matches.sort((left, right) => rank(left) - rank(right));
    }
    const shown = matches.slice(0, 8);
    results.replaceChildren(...shown.map(({ row }) => row));
    results.scrollTop = 0;
    visible = shown.map(({ control }) => control);
    if (query && visible.length) select(0);
    if (!visible.length) feedback.textContent = 'No matching commands.';
  }

  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.repeat || event.isComposing ||
        event.ctrlKey === event.metaKey || event.altKey || event.shiftKey ||
        event.key.toLowerCase() !== 'k') return;
    if (palette.open) {
      event.preventDefault();
      palette.close();
      return;
    }
    if (event.target.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])') ||
        document.querySelector('dialog[open]')) return;

    event.preventDefault();
    form.reset();
    refresh();
    palette.showModal();
  });

  input.addEventListener('input', refresh);
  input.addEventListener('keydown', event => {
    if (!visible.length || event.isComposing || event.metaKey || event.ctrlKey || event.altKey) return;
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'ArrowDown' ? selected + 1
      : selected < 0 ? visible.length - 1 : selected - 1;
    select((next + visible.length) % visible.length, true);
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    visible[selected]?.click();
  });

  results.addEventListener('click', async event => {
    const control = event.target.closest('.command-result');
    if (!control) return;
    if (control.matches('a')) {
      palette.close();
    } else if (control.dataset.commandAction === 'top') {
      palette.close();
      scrollTo({ top: 0, behavior: 'instant' });
    } else if (control.dataset.commandAction === 'copy') {
      const url = new URL(location.href);
      url.search = '';
      url.hash = '';
      try {
        await navigator.clipboard.writeText(url.href);
        feedback.textContent = 'Page link copied.';
      } catch {
        if (!palette.open) return;
        feedback.textContent = 'Copy this page link.';
        copyField.value = url.href;
        copyField.hidden = false;
        copyField.focus();
        copyField.select();
      }
    }
  });
  editor?.addEventListener('click', () => palette.close());
  palette.querySelector('[data-close-commands]').addEventListener('click', () => palette.close());
}
