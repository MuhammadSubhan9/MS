const editor = document.querySelector('.now-editor');
const snapshot = document.querySelector('[data-now-revision]');
const form = editor.querySelector('[data-now-form]');
const text = form.querySelector('#now-editor-text');
const code = form.querySelector('#now-editor-code');
const message = form.querySelector('[data-editor-status]');
const publish = form.querySelector('[type="submit"]');
const copy = snapshot?.querySelector('.now-copy');
const date = snapshot?.querySelector('time');

function openEditor() {
  if (!snapshot) return;
  if (location.hash !== '#edit' || editor.open || typeof editor.showModal !== 'function') return;
  if (!text.value) {
    try { text.value = sessionStorage.getItem(draftKey()) || ''; } catch { /* Storage is optional. */ }
    if (!text.value) text.value = [...copy.querySelectorAll('p')].map(p => p.textContent).join('\n\n');
  }
  editor.showModal();
}

function guardDraft(event) {
  if (copy && text.value && text.value.trim() !== [...copy.querySelectorAll('p')].map(p => p.textContent).join('\n\n')) {
    event.preventDefault();
    event.returnValue = '';
  }
}
const draftKey = () => 'portfolio-now-draft-' + snapshot.dataset.nowRevision;
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
  if (location.hash === '#edit') {
    history.replaceState(history.state, '', location.pathname + location.search + '#now');
    snapshot.focus();
    snapshot.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (publish.disabled) return;
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
