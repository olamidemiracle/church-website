/**
 * pages/contact/contact.js
 * -----------------------------------------------------------------------
 * Renders church contact details from settings/general, and handles the
 * contact form: client-side validation → honeypot spam check → Firestore
 * write (contactMessages, allowed by firestore.rules as create-only) →
 * best-effort EmailJS staff notification → success/error UI state.
 * -----------------------------------------------------------------------
 */

import { mountPublicLayout } from '../../layouts/public-layout.js';
import { createDocument } from '../../services/firestore.service.js';
import { sendFormNotification } from '../../services/emailjs.service.js';
import {
  validateForm,
  isRequired,
  isValidEmail,
  isWithinLength,
  isHoneypotTripped,
} from '../../utils/validators.js';
import { escapeHTML, qs } from '../../utils/dom-helpers.js';
import { setPageMeta } from '../../utils/seo.js';

setPageMeta({
  title: 'Contact Us',
  description: "Get in touch — we'd love to hear from you.",
});

const FORM_SCHEMA = {
  name: [[isRequired, 'Please enter your name.']],
  email: [[isValidEmail, 'Please enter a valid email address.']],
  subject: [
    [isRequired, 'Please enter a subject.'],
    [(v) => isWithinLength(v, 150), 'Subject must be under 150 characters.'],
  ],
  message: [
    [isRequired, 'Please enter a message.'],
    [(v) => isWithinLength(v, 2000), 'Message must be under 2000 characters.'],
  ],
};

async function init() {
  const settings = await mountPublicLayout();
  renderContactInfo(settings);
  initContactForm();
}

function renderContactInfo(settings) {
  const target = qs('#contact-info');
  if (!target) {
    return;
  }

  const address = escapeHTML(settings?.address || 'Address coming soon');
  const phone = escapeHTML(settings?.phone || '');
  const email = escapeHTML(settings?.email || '');

  target.innerHTML = `
    <h2>Get in Touch</h2>
    <div class="contact-info__item">
      <span class="contact-info__label">Address</span>
      <p>${address}</p>
    </div>
    ${
      phone
        ? `<div class="contact-info__item">
            <span class="contact-info__label">Phone</span>
            <p><a href="tel:${phone.replace(/\s/g, '')}">${phone}</a></p>
          </div>`
        : ''
    }
    ${
      email
        ? `<div class="contact-info__item">
            <span class="contact-info__label">Email</span>
            <p><a href="mailto:${email}">${email}</a></p>
          </div>`
        : ''
    }
    <div class="contact-info__item">
      <span class="contact-info__label">Directions</span>
      <p><a href="/location">View our location &amp; map →</a></p>
    </div>`;
}

function initContactForm() {
  const form = qs('#contact-form');
  const statusEl = qs('#contact-form-status');
  const submitBtn = qs('#contact-submit-btn');
  if (!form) {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearFieldErrors(form);
    statusEl.innerHTML = '';

    const values = {
      name: form.name.value,
      email: form.email.value,
      subject: form.subject.value,
      message: form.message.value,
    };

    // Silently drop obvious bot submissions without revealing the
    // honeypot mechanism to the (bot) submitter.
    if (isHoneypotTripped(form.website.value)) {
      showStatus(statusEl, 'success', "Thanks! We'll be in touch soon.");
      form.reset();
      return;
    }

    const { valid, errors } = validateForm(values, FORM_SCHEMA);
    if (!valid) {
      showFieldErrors(errors);
      return;
    }

    setSubmitting(submitBtn, true);

    try {
      await createDocument('contactMessages', {
        ...values,
        status: 'unread',
      });

      // Best-effort only — never blocks the success state below.
      sendFormNotification({
        form_name: 'Contact Form',
        submitter_name: values.name,
        submitter_email: values.email,
        subject: values.subject,
        message: values.message,
      });

      showStatus(
        statusEl,
        'success',
        "Thank you! Your message has been sent — we'll respond soon."
      );
      form.reset();
    } catch (error) {
      showStatus(
        statusEl,
        'error',
        'Something went wrong sending your message. Please try again in a moment.'
      );
    } finally {
      setSubmitting(submitBtn, false);
    }
  });
}

function setSubmitting(button, isSubmitting) {
  if (!button) {
    return;
  }
  button.disabled = isSubmitting;
  button.textContent = isSubmitting ? 'Sending…' : 'Send Message';
}

function showStatus(target, type, message) {
  target.innerHTML = `<div class="form-status form-status--${type}">${message}</div>`;
}

function showFieldErrors(errors) {
  Object.entries(errors).forEach(([field, message]) => {
    const input = qs(`#contact-${field}`);
    const errorEl = qs(`#contact-${field}-error`);
    if (input) {
      input.classList.add('has-error');
    }
    if (errorEl) {
      errorEl.textContent = message;
    }
  });
}

function clearFieldErrors(form) {
  form.querySelectorAll('.has-error').forEach((el) => el.classList.remove('has-error'));
  form.querySelectorAll('.form-error-text').forEach((el) => (el.textContent = ''));
}

init();
