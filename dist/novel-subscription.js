const releaseForm = document.querySelector('.novel-release-form');

if (releaseForm) {
  const button = releaseForm.querySelector('button[type="submit"]');
  const status = releaseForm.querySelector('.release-status');
  const message = status.querySelector('[data-release-message]') || status;

  function report(text, kind) {
    message.textContent = text;
    status.dataset.kind = kind;
  }

  releaseForm.addEventListener('input', () => report('', ''));
  releaseForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (button.disabled) return;
    const fields = Object.fromEntries(new FormData(releaseForm));
    button.disabled = true;
    releaseForm.setAttribute('aria-busy', 'true');
    report('Saving your signup…', 'pending');
    try {
      const response = await fetch(releaseForm.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(fields),
        signal: AbortSignal.timeout(15000),
      });
      const result = await response.json().catch(() => null);
      if (response.ok && result?.ok === true) {

        const current = Object.fromEntries(new FormData(releaseForm));
        if (Object.keys({...fields, ...current}).every(key => fields[key] === current[key])) {
          releaseForm.reset();
          report(result.message, 'success');
        } else {
          report('Your earlier signup was saved. Submit again to save your changes.', 'success');
        }
      } else {
        report(result?.error || 'Your signup could not be confirmed. Please try again.', 'error');
      }
    } catch {
      report('Couldn’t connect. Your email is still here, so you can try again.', 'error');
    } finally {
      button.disabled = false;
      releaseForm.removeAttribute('aria-busy');
    }
  });
}
