const palette = document.querySelector('#command-title')?.closest('dialog');

if (typeof palette?.showModal === 'function') {
  const form = palette.querySelector('form');
  const input = palette.querySelector('input');
  const result = palette.querySelector('.command-result');
  const feedback = palette.querySelector('.command-feedback');
  const editCommands = new Set(['edit now', 'clg upd']);

  function matchesEditCommand() {
    return editCommands.has(input.value.trim().toLowerCase().replace(/\s+/g, ' '));
  }

  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.repeat || event.isComposing ||
        event.ctrlKey === event.metaKey || event.altKey || event.shiftKey ||
        event.key.toLowerCase() !== 'k' ||
        event.target.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])') ||
        document.querySelector('dialog[open]')) return;

    event.preventDefault();
    form.reset();
    result.hidden = true;
    feedback.textContent = '';
    palette.showModal();
  });

  input.addEventListener('input', () => {
    result.hidden = !matchesEditCommand();
    feedback.textContent = '';
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (matchesEditCommand()) {
      result.click();
    } else {
      feedback.textContent = 'No command found.';
    }
  });

  result.addEventListener('click', () => palette.close());
  palette.querySelector('[data-close-commands]').addEventListener('click', () => palette.close());
}
