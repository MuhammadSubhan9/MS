import { action, arrow, escape, safeLink } from './components.mjs';

function field(name, label, { type = 'text', autocomplete, limit, error } = {}) {
  const id = `contact-${name}`;
  const inputOptions = `id="${id}" name="${name}"${autocomplete ? ` autocomplete="${autocomplete}"` : ''}${limit ? ` maxlength="${limit}"` : ''}${error ? ` required data-required-error="${escape(error)}"` : ''}`;
  return `<div class="contact-field">
    <label for="${id}">${label}${error ? ' <span aria-hidden="true">*</span>' : ''}</label>
    ${type === 'textarea' ? `<textarea ${inputOptions} rows="5"></textarea>` : `<input ${inputOptions} type="${type}">`}
    ${error ? `<div class="contact-field-error" aria-hidden="true"><p id="${id}-error"></p></div>` : ''}
  </div>`;
}

function messageForm(endpoint, topics) {
  const destination = endpoint ? safeLink(endpoint) : '/contact/';
  return `<section class="contact-form-panel" aria-labelledby="contact-form-title">
    <h2 id="contact-form-title">Send a <em>message.</em></h2>
    <p class="contact-form-intro">SilentForms delivers your message by email. Fields marked with an asterisk (*) are required.</p>
    <form class="contact-form" action="${destination}" method="post" data-clarity-mask="true"${endpoint ? '' : ' data-delivery-unavailable'}>
      ${endpoint ? '<div class="visually-hidden" aria-hidden="true"><input type="text" name="_gotcha" tabindex="-1" autocomplete="off"></div>' : ''}
      <div class="contact-form-row">
        ${field('name', 'Name', { autocomplete: 'name', limit: 120, error: 'Enter your name.' })}
        ${field('email', 'Email', { type: 'email', autocomplete: 'email', limit: 254, error: 'Enter your email address.' })}
      </div>
      ${field('subject', 'Subject', { limit: 150, error: 'Enter a subject.' })}
      <div class="contact-field">
        <label for="contact-reason">Reason <span>(optional)</span></label>
        <select id="contact-reason" name="reason">
          <option value="">Choose a reason</option>
          ${topics.map(({ title }) => `<option>${escape(title)}</option>`).join('')}
          <option>Other</option>
        </select>
      </div>
      ${field('message', 'Message', { type: 'textarea', limit: 2000, error: 'Write a message.' })}
      <details class="contact-form-details">
        <summary>Add occupation or company <span>(optional)</span></summary>
        <div class="contact-form-row">
          ${field('occupation', 'Occupation', { autocomplete: 'organization-title', limit: 120 })}
          ${field('company', 'Company', { autocomplete: 'organization', limit: 120 })}
        </div>
      </details>
      <button class="button-link contact-send" type="submit"><span>Send message</span>${arrow}</button>
      <p class="contact-form-status" role="status">
        <span class="contact-confirm-mark" aria-hidden="true"></span>
        <span class="contact-status-text"></span>
      </p>
    </form>
  </section>`;
}

export function contactPage(contact, name) {
  const { email, links, cv, phone, vcard, topics = [], formEndpoint } = contact;
  if (email && !/^[^\s@<>"?&#]+@[^\s@<>"?&#]+\.[^\s@<>"?&#]+$/.test(email)) throw new Error('Invalid email');
  const telephone = phone?.replace(/[\s()-]/g, '');
  if (phone && !/^\+?[0-9]{5,15}$/.test(telephone)) throw new Error('Invalid telephone number');
  if (cv && (!cv.startsWith('/') || !/\.pdf$/i.test(cv))) throw new Error('CV requires a local PDF path');
  if (vcard && (!vcard.startsWith('/') || !/\.vcf$/i.test(vcard))) throw new Error('vCard requires a local VCF path');
  const mail = email ? `mailto:${escape(email)}` : '';
  const methods = [
    phone ? ['Telephone', `<a href="tel:${telephone}">${escape(phone)}</a>`] : null,
    ...links.map(link => [link.label, action(link.url, link.display || link.label)]),
    cv ? ['Curriculum vitae', `<a href="${safeLink(cv)}" download>Download CV (PDF)</a>`] : null,
  ].filter(Boolean);
  const form = email || formEndpoint ? messageForm(formEndpoint, topics) : '';
  return `<div class="contact-layout${form ? '' : ' contact-without-form'}">
    <header class="contact-intro">
        <p class="eyebrow">Contact</p>
        <h1>Let’s get in <em>touch.</em></h1>
        ${contact.introduction ? `<p class="lead">${escape(contact.introduction)}</p>` : ''}
        ${contact.location ? `<p class="contact-location"><strong>${escape(name)}</strong><span>${escape(contact.location)}</span></p>` : ''}
    </header>
    <div class="contact-channels" role="group" aria-label="Contact methods">
        ${email ? `<section class="contact-feature" aria-labelledby="contact-email-title">
          <h2 class="eyebrow" id="contact-email-title">Email</h2>
          <a class="contact-address" href="${mail}">${escape(email)}</a>
          <div class="contact-actions">
            ${vcard ? `<a class="contact-save" href="${safeLink(vcard)}" download>Save contact card <span aria-hidden="true">↓</span></a>` : ''}
            <button class="contact-copy" type="button" aria-label="Copy address" data-copy-email="${escape(email)}" hidden>
              <span class="contact-copy-icon" aria-hidden="true"><span class="contact-copy-sheets"></span><span class="contact-copy-check"></span></span>
              <span class="contact-copy-labels" aria-hidden="true"><span>Copy address</span><span>Copied!</span></span>
            </button>
          </div>
          <p class="contact-copy-status" role="status"><span class="visually-hidden" data-copy-feedback></span></p>
        </section>` : ''}
        ${methods.length ? `<dl class="contact-list">${methods.map(([label, link]) =>
          `<div><dt class="eyebrow">${escape(label)}</dt><dd>${link}</dd></div>`).join('')}</dl>` : ''}
    </div>
    ${form}
  </div>`;
}
