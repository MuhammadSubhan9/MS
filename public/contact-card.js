import { contactCardWithNote } from './vcard.js';

const opener = document.querySelector('.contact-save');
const dialog = document.querySelector('.contact-card-dialog');

if (opener && typeof dialog?.showModal === 'function') {
  const form = dialog.querySelector('form');
  const note = dialog.querySelector('textarea');
  const save = form.querySelector('[type="submit"]');
  const status = dialog.querySelector('[role="status"]');
  let saving = false;
  let request;
  opener.setAttribute('aria-haspopup', 'dialog');

  opener.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    status.textContent = '';
    dialog.showModal();
  });
  dialog.querySelector('[data-close-contact-card]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    request?.abort('dialog-closed');
    opener.focus({ preventScroll: true });
  });
  dialog.querySelector('.contact-card-plain').addEventListener('click', () => dialog.close());
  note.addEventListener('input', () => {
    save.disabled = saving || !note.value.trim();
    status.textContent = '';
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (saving || !note.value.trim()) return;
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
