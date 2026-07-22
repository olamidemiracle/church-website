/**
 * pages/visit/visit.js
 * -----------------------------------------------------------------------
 * First-Time Visitor form — validate → honeypot check → Firestore write
 * (visitorSubmissions, create-only per firestore.rules) → best-effort
 * EmailJS staff notification → success/error state.
 * -----------------------------------------------------------------------
 */

import { mountPublicLayout } from '../../layouts/public-layout.js';
import { createDocument } from '../../services/firestore.service.js';
import { sendFormNotification } from '../../services/emailjs.service.js';
import {
  validateForm,
  isRequired,
  isValidEmail,
  isValidPhone,
  isHoneypotTripped,
} from '../../utils/validators.js';
import { qs } from '../../utils/dom-helpers.js';
import { setPageMeta } from '../../utils/seo.js';

setPageMeta({
  title: 'Plan Your Visit',
  description: "New here? Here's everything you need to know before your first visit.",
});

const FORM_SCHEMA = {
  name: [[isRequired, 'Please enter your name.']],
  email: [[isValidEmail, 'Please enter a valid email address.']],
  phone: [[isValidPhone, 'Please enter a valid phone number.']],
};

async function init() {
  await mountPublicLayout();
  initForm();
}

function initForm() {
  const form = qs('#visit-form');
  const statusEl = qs('#visit-form-status');
  const submitBtn = qs('#visit-submit-btn');
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
      phone: form.phone.value,
      visitDate: form.visitDate.value,
      howHeard: form.howHeard.value,
      prayerNeeds: form.prayerNeeds.value,
    };

    if (isHoneypotTripped(form.website.value)) {
      showStatus(statusEl, 'success', "Thanks! We can't wait to meet you.");
      form.reset();
      return;
    }

    const { valid, errors } = validateForm(values, FORM_SCHEMA);
    if (!valid) {
      showFieldErrors(errors);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    try {
      await createDocument('visitorSubmissions', { ...values, followUpStatus: 'new' });

      sendFormNotification({
        form_name: 'First-Time Visitor',
        submitter_name: values.name,
        submitter_email: values.email,
        subject: 'New First-Time Visitor Submission',
        message: `${values.name} is planning to visit${values.visitDate ? ` on ${values.visitDate}` : ''}.`,
      });

      showStatus(statusEl, 'success', "Thanks! We can't wait to meet you — see you soon.");
      form.reset();
    } catch (error) {
      showStatus(statusEl, 'error', 'Something went wrong sending your details. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Let Us Know You're Coming";
    }
  });
}

function showStatus(target, type, message) {
  target.innerHTML = `<div class="form-status form-status--${type}">${message}</div>`;
}

function showFieldErrors(errors) {
  Object.entries(errors).forEach(([field, message]) => {
    const input = qs(`#visit-${field}`);
    const errorEl = qs(`#visit-${field}-error`);
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
