const palette = document.querySelector('#command-title')?.closest('dialog');
const commandSessionKey = 'portfolio-tools-expires';
let tabCommandExpiry = 0;

function readCommandExpiry() {
  try {
    const saved = localStorage.getItem(commandSessionKey);
    if (saved !== null) return Number(saved);
    const previous = sessionStorage.getItem(commandSessionKey);
    if (previous !== null) localStorage.setItem(commandSessionKey, previous);
    return Number(previous);
  } catch {
    try { return Number(sessionStorage.getItem(commandSessionKey) ?? tabCommandExpiry); }
    catch { return tabCommandExpiry; }
  }
}

function rememberCommandExpiry(expiresAt) {
  tabCommandExpiry = expiresAt;
  try { localStorage.setItem(commandSessionKey, String(expiresAt)); }
  catch {
    try { sessionStorage.setItem(commandSessionKey, String(expiresAt)); }
    catch { /* Keep the shortcut usable for this document. */ }
  }
}

if (typeof palette?.showModal === 'function') {
  const form = palette.querySelector('form');
  const input = palette.querySelector('input');
  const feedback = palette.querySelector('.command-feedback');
  const destinations = new Map([
    ['edit now', '/?owner=1#edit'],
    ['clg upd', '/?owner=1#edit'],
    ['preview now', '/?owner=1#preview-now'],
  ]);

  function openUnlock() {
    palette.close();
    location.assign('/?owner=1#edit');
  }

  function lock() {
    rememberCommandExpiry(0);
    palette.close();
  }

  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.repeat || event.isComposing ||
        event.ctrlKey === event.metaKey || event.altKey || event.shiftKey ||
        (event.code !== 'KeyK' && event.key.toLowerCase() !== 'k') ||
        document.querySelector('dialog[open]')) return;
    if (!palette.contains(event.target) &&
        event.target.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return;

    const expiry = readCommandExpiry();
    if (!expiry) return;
    event.preventDefault();
    if (expiry <= Date.now()) {
      openUnlock();
      return;
    }
    form.reset();
    feedback.textContent = '';
    palette.showModal();
  });

  input.addEventListener('input', () => { feedback.textContent = ''; });

  let running = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (running) return;
    const expiry = readCommandExpiry();
    if (!expiry || expiry <= Date.now()) {
      if (expiry) openUnlock();
      else palette.close();
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
      const response = await fetch('/api/now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: command === 'lock tools' ? 'lock' : command }),
        signal: AbortSignal.timeout(10000),
      });
      const result = await response.json();
      if (command === 'lock tools' && response.ok && result.locked === true) {
        lock();
        return;
      }
      if (!palette.open) return;
      if (response.status === 401 && readCommandExpiry() === expiry) rememberCommandExpiry(Date.now());
      if (!response.ok) {
        feedback.textContent = result.error || 'The command could not run.';
      } else if (command === 'lock tools') {
        feedback.textContent = 'Locking could not be confirmed. Try again.';
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
