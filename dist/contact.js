const copyEmail = document.querySelector('[data-copy-email]');
if (copyEmail && typeof navigator.clipboard?.writeText === 'function') {
  const feedback = document.querySelector('[data-copy-feedback]');
  let clearFeedback;
  let copying = false;
  copyEmail.hidden = false;
  copyEmail.addEventListener('click', async () => {
    if (copying) return;
    copying = true;
    clearTimeout(clearFeedback);
    delete copyEmail.dataset.copyState;
    feedback.textContent = '';
    try {
      await navigator.clipboard.writeText(copyEmail.dataset.copyEmail);
      copyEmail.dataset.copyState = 'copied';
      feedback.classList.add('visually-hidden');
      feedback.textContent = 'Email address copied.';
      clearFeedback = setTimeout(() => {
        delete copyEmail.dataset.copyState;
        feedback.textContent = '';
      }, 2800);
    } catch {
      feedback.classList.remove('visually-hidden');
      feedback.textContent = 'Couldn’t copy the address. You can select it above.';
    } finally {
      copying = false;
    }
  });
}

const contactForm = document.querySelector('.contact-form');
if (contactForm) {
  const requiredFields = [...contactForm.querySelectorAll('[required]')];
  const submitButton = contactForm.querySelector('button[type="submit"]');
  const status = contactForm.querySelector('.contact-form-status');
  const statusText = status.querySelector('.contact-status-text');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function updateError(field) {
    const error = document.getElementById(`${field.id}-error`);
    const empty = !field.value.trim();
    const invalid = empty || !field.validity.valid;
    if (invalid) {
      error.textContent = empty ? field.dataset.requiredError : field.validity.typeMismatch
        ? 'Enter an email address like name@example.com.' : field.validationMessage;
      field.setAttribute('aria-invalid', 'true');
      field.setAttribute('aria-describedby', error.id);
    } else {
      field.removeAttribute('aria-invalid');
      field.removeAttribute('aria-describedby');
    }
    error.parentElement.setAttribute('aria-hidden', String(!invalid));
    return invalid;
  }

  function report(message, state) {
    if (state) status.dataset.state = state;
    else delete status.dataset.state;
    statusText.textContent = message;
    submitButton.hidden = state === 'sent';
  }

  contactForm.addEventListener('input', event => {
    if (event.target.hasAttribute('aria-invalid')) updateError(event.target);
    if (status.dataset.state === 'sent' || (status.dataset.state === 'validation' && !contactForm.querySelector('[aria-invalid]'))) {
      report('', '');
    }
  });

  contactForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitButton.disabled) return;
    const invalidFields = requiredFields.filter(updateError);
    if (invalidFields.length) {
      invalidFields[0].focus();
      if (!reducedMotion.matches && typeof invalidFields[0].animate === 'function') {
        for (const field of invalidFields) {
          field.animate([
            { translate: '0' }, { translate: '-5px' }, { translate: '4px' },
            { translate: '-3px' }, { translate: '2px' }, { translate: '0' },
          ], { duration: 350, easing: 'ease-out' });
        }
      }
      report('Check the highlighted fields and try again.', 'validation');
      return;
    }

    if (contactForm.hasAttribute('data-delivery-unavailable')) {
      report('Message delivery is being set up. Your message is still here.', 'failure');
      return;
    }

    const data = new FormData(contactForm);
    for (const [name, value] of data) data.set(name, value.trim());
    submitButton.disabled = true;
    report('Sending your message…', 'sending');
    try {
      const response = await fetch(contactForm.action, {
        method: 'POST', headers: { Accept: 'application/json' }, body: data,
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json().catch(() => null);
      const accepted = result?.ok === true || result?.status === 'success' || result?.success === true || result?.success === 'true';
      if (response.ok && accepted) {
        const unchanged = [...new FormData(contactForm)].every(([name, value]) => value.trim() === data.get(name));
        if (unchanged) contactForm.reset();
        const button = submitButton.getBoundingClientRect();
        report('Message sent.', 'sent');
        if (!reducedMotion.matches && button.width && button.bottom > 0 && button.top < innerHeight) {
          const destination = status.getBoundingClientRect();
          status.animate([
            { transform: 'translate(' + (button.left - destination.left) + 'px,' + (button.top - destination.top) + 'px) scale(' + (button.width / destination.width) + ',' + (button.height / destination.height) + ')', transformOrigin: 'top left', borderRadius: '.55rem' },
            { transform: 'none', transformOrigin: 'top left' },
          ], { duration: 380, easing: 'cubic-bezier(.2,.7,.2,1)' });
        }
        const focus = document.activeElement;
        if (button.bottom > 0 && button.top < innerHeight
          && (focus === document.body || focus === submitButton)
          && status.getBoundingClientRect().bottom > innerHeight) {
          status.scrollIntoView({ block: 'nearest', behavior: reducedMotion.matches ? 'instant' : 'smooth' });
        }
      } else {
        report(response.status === 429 ? 'Please wait a moment before trying again.' : 'Your message could not be sent. Please try again.', 'failure');
      }
    } catch {
      report('Could not connect. Your message is still here. Please try again.', 'failure');
    } finally {
      submitButton.disabled = false;
    }
  });

  contactForm.noValidate = true;
}
