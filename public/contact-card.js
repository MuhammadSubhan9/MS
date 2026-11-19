import { contactCardWithNote } from './vcard.js';

const opener = document.querySelector('.contact-save');
const dialog = document.querySelector('.contact-card-dialog');

if (opener && typeof dialog?.showModal === 'function') {
  const form = dialog.querySelector('form');
  const note = dialog.querySelector('textarea');
  const save = form.querySelector('[type="submit"]');
  const status = dialog.querySelector('[role="status"]');
  const plain = dialog.querySelector('.contact-card-plain');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let closeTimer;
  let saving = false;
  let request;
  opener.setAttribute('aria-haspopup', 'dialog');

  opener.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    status.textContent = '';
    delete opener.dataset.cardState;
    delete save.dataset.cardState;
    delete plain.dataset.cardState;
    save.disabled = saving || !note.value.trim();
    dialog.showModal();
  });
  function openFromCommand() {
    if (location.hash !== '#save-contact' || document.querySelector('dialog[open]')) return;
    opener.click();
    history.replaceState(history.state, '', location.pathname + location.search + '#contact-email-title');
  }
  addEventListener('hashchange', openFromCommand);
  openFromCommand();

  dialog.querySelector('[data-close-contact-card]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    clearTimeout(closeTimer);
    request?.abort('dialog-closed');
    opener.focus({ preventScroll: true });
  });
  plain.addEventListener('click', event => {
    if (saving || plain.dataset.cardState === 'saved') {
      event.preventDefault();
      return;
    }
    plain.dataset.cardState = 'saved';
    save.disabled = true;
    opener.dataset.cardState = 'saved';
    closeTimer = setTimeout(() => dialog.close(), reduce.matches ? 0 : 240);
  });
  note.addEventListener('input', () => {
    save.disabled = saving || !note.value.trim();
    status.textContent = '';
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (saving || plain.dataset.cardState === 'saved' || !note.value.trim()) return;
    const savedNote = note.value;
    saving = true;
    save.disabled = true;
    status.textContent = 'Preparing your contact card…';
    request = new AbortController();
    const timeout = setTimeout(() => request.abort(), 10000);
    try {
      const response = await fetch(opener.href, { signal: request.signal });
      if (!response.ok) throw new Error('Contact card unavailable');
      const card = contactCardWithNote(await response.text(), savedNote);
      const url = URL.createObjectURL(new Blob([card], { type: 'text/vcard;charset=utf-8' }));
      const download = document.createElement('a');
      download.href = url;
      download.download = 'muhammad-subhan.vcf';
      document.body.append(download);
      download.click();
      download.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      save.dataset.cardState = 'saved';
      opener.dataset.cardState = 'saved';
      await new Promise(resolve => setTimeout(resolve, reduce.matches ? 0 : 240));
      if (dialog.open) dialog.close();
    } catch {
      if (dialog.open && request.signal.reason !== 'dialog-closed') {
        status.textContent = 'Couldn’t prepare the card. Your note is still here. Please try again.';
      }
    } finally {
      clearTimeout(timeout);
      saving = false;
      save.disabled = !note.value.trim();
    }
  });
}
