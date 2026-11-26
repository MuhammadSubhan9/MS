const editor = document.querySelector('.now-editor');
const snapshot = document.querySelector('[data-now-revision]');
const form = editor.querySelector('[data-now-form]');
const text = form.querySelector('#now-editor-text');
const code = form.querySelector('#now-editor-code');
const message = form.querySelector('[data-editor-status]');
const publish = form.querySelector('[type="submit"]');
const unlock = form.querySelector('.command-unlock');
const heading = form.querySelector('#now-editor-title');
const preview = form.querySelector('.now-draft-preview');
const copy = snapshot?.querySelector('.now-copy');
const date = snapshot?.querySelector('time');
const heroPreview = document.querySelector('[data-now-preview]');
const draftKey = () => 'portfolio-now-draft-' + snapshot.dataset.nowRevision;

function openEditor() {
  const previewing = location.hash === '#preview-now';
  if (location.hash !== '#edit' && !previewing) return;
  if (new URLSearchParams(location.search).get('owner') !== '1') {
    location.replace('/?owner=1' + location.hash);
    return;
  }
  if (!snapshot || editor.open || typeof editor.showModal !== 'function') return;
  if (previewing && !(readCommandExpiry() > Date.now())) return;
  if (!text.value) {
    try { text.value = sessionStorage.getItem(draftKey()) || ''; } catch { /* Storage is optional. */ }
    if (!text.value) text.value = [...copy.querySelectorAll('p')].map(p => p.textContent).join('\n\n');
  }
  editor.toggleAttribute('data-preview', previewing);
  heading.textContent = previewing ? 'Preview Now draft' : 'Edit Now';
  if (previewing) {
    preview.hidden = false;
    const current = [...copy.querySelectorAll('p')].map(p => p.textContent).join('\n\n');
    const paragraphs = text.value.trim() === current
      ? ['There is no unpublished Now draft in this tab.']
      : text.value.trim().split(/\n[^\S\n]*\n/).map(part => part.trim()).filter(Boolean);
    preview.replaceChildren(...(paragraphs.length ? paragraphs : ['Your draft is empty.']).map(part => {
      const paragraph = document.createElement('p');
      paragraph.textContent = part;
      return paragraph;
    }));
  }
  editor.showModal();
}

function guardDraft(event) {
  if (copy && text.value && text.value.trim() !== [...copy.querySelectorAll('p')].map(p => p.textContent).join('\n\n')) {
    event.preventDefault();
    event.returnValue = '';
  }
}
function rememberDraft() {
  try { sessionStorage.setItem(draftKey(), text.value); }
  catch { window.addEventListener('beforeunload', guardDraft); }
}
text.addEventListener('input', rememberDraft);
window.addEventListener('hashchange', openEditor);
openEditor();
editor.querySelector('[data-close-editor]').addEventListener('click', () => editor.close());
editor.addEventListener('close', () => {
  code.value = '';
  preview.hidden = true;
  preview.replaceChildren();
  if (location.hash === '#edit' || location.hash === '#preview-now') {
    history.replaceState(history.state, '', location.pathname + location.search + '#now');
    snapshot.focus();
    snapshot.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
});

unlock.addEventListener('click', async () => {
  if (!code.reportValidity() || publish.disabled) return;
  unlock.disabled = true;
  publish.disabled = true;
  message.textContent = 'Unlocking…';
  try {
    const response = await fetch('/api/now', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + code.value.trim() },
      body: JSON.stringify({ command: 'unlock' }),
      signal: AbortSignal.timeout(10000),
    });
    const result = await response.json();
    if (!response.ok || !Number.isFinite(result.expiresAt)) {
      message.textContent = result.error || 'Ctrl+K could not be unlocked.';
      return;
    }
    rememberCommandExpiry(result.expiresAt);
    code.value = '';
    message.textContent = 'Ctrl+K unlocked for 30 minutes in this browser. Close the editor to use it.';
  } catch {
    message.textContent = 'Ctrl+K could not be unlocked. Try again in a moment.';
  } finally {
    unlock.disabled = false;
    publish.disabled = false;
  }
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (publish.disabled || editor.hasAttribute('data-preview')) return;
  publish.disabled = true;
  const draft = text.value;
  message.textContent = 'Publishing…';
  try {
    const response = await fetch('/api/now', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${code.value.trim()}` },
      body: JSON.stringify({ text: draft, revision: Number(snapshot.dataset.nowRevision) }),
      signal: AbortSignal.timeout(15000),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.paragraphs) {
      message.textContent = result?.error || 'Publishing is unavailable. Your draft is still here.';
      return;
    }
    try { sessionStorage.removeItem(draftKey()); } catch { /* Storage is optional. */ }
    window.removeEventListener('beforeunload', guardDraft);
    snapshot.dataset.nowRevision = result.revision;
    date.dateTime = result.date;
    date.textContent = result.dateLabel;
    if (heroPreview) heroPreview.textContent = result.preview ?? result.paragraphs[0];
    copy.replaceChildren(...result.paragraphs.map(value => {
      const paragraph = document.createElement('p');
      paragraph.textContent = value;
      return paragraph;
    }));
    if (text.value === draft) text.value = result.paragraphs.join('\n\n');
    if (text.value !== result.paragraphs.join('\n\n')) rememberDraft();
    code.value = '';
    message.textContent = 'Published. Visitors can see your update now.';
  } catch {
    message.textContent = 'Couldn’t confirm publishing. Check the homepage before trying again.';
  } finally {
    publish.disabled = false;
  }
});
