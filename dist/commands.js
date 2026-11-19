const palette = document.querySelector('#command-title')?.closest('dialog');

if (typeof palette?.showModal === 'function') {
  const form = palette.querySelector('form');
  const input = palette.querySelector('input');
  const feedback = palette.querySelector('.command-feedback');
  const sessionKey = 'portfolio-tools-expires';
  const destinations = new Map([
    ['edit now', '/#edit'],
    ['clg upd', '/#edit'],
    ['preview now', '/#preview-now'],
  ]);

  function unlocked() {
    try { return Number(sessionStorage.getItem(sessionKey)) > Date.now(); }
    catch { return false; }
  }

  function lock() {
    sessionStorage.removeItem(sessionKey);
    palette.close();
  }

  document.addEventListener('keydown', event => {
    if (!unlocked() || event.defaultPrevented || event.repeat || event.isComposing ||
        event.ctrlKey === event.metaKey || event.altKey || event.shiftKey ||
        event.key.toLowerCase() !== 'k' ||
        event.target.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])') ||
        document.querySelector('dialog[open]')) return;

    event.preventDefault();
    form.reset();
    feedback.textContent = '';
    palette.showModal();
  });

  input.addEventListener('input', () => { feedback.textContent = ''; });

  let running = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (running) return;
    if (!unlocked()) {
      palette.close();
      return;
    }
    const command = input.value.trim().toLowerCase().replace(/\s+/g, ' ');
    if (destinations.has(command)) {
      palette.close();
      location.assign(destinations.get(command));
      return;
    }
    if (!['novel signups', 'now status', 'lock tools'].includes(command)) {
      feedback.textContent = 'No command found.';
      return;
    }
    running = true;
    input.readOnly = true;
    feedback.textContent = 'Checking…';
    try {
      if (command === 'lock tools') lock();
      const response = await fetch('/api/now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: command === 'lock tools' ? 'lock' : command }),
        signal: AbortSignal.timeout(10000),
      });
      const result = await response.json();
      if (!palette.open) return;
      if (response.status === 401) sessionStorage.removeItem(sessionKey);
      if (!response.ok) {
        feedback.textContent = result.error || 'The command could not run.';
      } else if (command === 'novel signups') {
        feedback.textContent = result.pending + ' awaiting confirmation · ' + result.confirmed +
          ' confirmed · ' + result.notified + ' notified';
      } else {
        feedback.textContent = result.revision
          ? 'Live revision ' + result.revision + ' · Published ' + result.date
          : 'The homepage is showing the default Now entry.';
      }
    } catch {
      if (palette.open) feedback.textContent = 'The command could not run. Try again in a moment.';
    } finally {
      input.readOnly = false;
      running = false;
    }
  });

  palette.querySelector('[data-close-commands]').addEventListener('click', () => palette.close());
}
