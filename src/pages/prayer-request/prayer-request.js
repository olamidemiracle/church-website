/**
 * pages/prayer-request/prayer-request.js
 * -----------------------------------------------------------------------
 * Prayer Request form: toggling "Submit anonymously" hides/disables the
 * name and contact fields (and drops the name requirement). Otherwise
 * follows the same pattern as the Contact form: validate → honeypot
 * check → Firestore write (prayerRequests, create-only per
 * firestore.rules) → best-effort EmailJS staff notification → success/
 * error state.
 * -----------------------------------------------------------------------
 */

import { mountPublicLayout } from '../../layouts/public-layout.js';
import { createDocument } from '../../services/firestore.service.js';
import { sendFormNotification } from '../../services/emailjs.service.js';
import {
  validateForm,
  isRequired,
  isWithinLength,
  isHoneypotTripped,
} from '../../utils/validators.js';
import { qs } from '../../utils/dom-helpers.js';
import { setPageMeta } from '../../utils/seo.js';

setPageMeta({
  title: 'Prayer Request',
  description: 'Share a prayer request — our team would be honored to pray with you.',
});

async function init() {
  await mountPublicLayout();
  initAnonymousToggle();
  initForm();
}

function initAnonymousToggle() {
  const checkbox = qs('#prayer-anonymous');
  const nameField = qs('#prayer-name-field');
  const contactField = qs('#prayer-contact-field');
  if (!checkbox) {
    return;
  }

  const applyState = () => {
    const isAnonymous = checkbox.checked;
    nameField.hidden = isAnonymous;
    contactField.hidden = isAnonymous;
    qs('#prayer-name').disabled = isAnonymous;
    qs('#prayer-contact').disabled = isAnonymous;
  };

  checkbox.addEventListener('change', applyState);
  applyState();
}

function buildSchema(isAnonymous) {
  const schema = {
    requestText: [
      [isRequired, 'Please share your prayer request.'],
      [(v) => isWithinLength(v, 3000), 'Please keep your request under 3000 characters.'],
    ],
  };

  if (!isAnonymous) {
    schema.name = [[isRequired, 'Please enter your name, or check "Submit anonymously".']];
  }

  return schema;
}

function initForm() {
  const form = qs('#prayer-form');
  const statusEl = qs('#prayer-form-status');
  const submitBtn = qs('#prayer-submit-btn');
  if (!form) {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearFieldErrors(form);
    statusEl.innerHTML = '';

    const isAnonymous = form.isAnonymous.checked;
    const values = {
      name: isAnonymous ? '' : form.name.value,
      contact: isAnonymous ? '' : form.contact.value,
      requestText: form.requestText.value,
      isAnonymous,
      isConfidential: form.isConfidential.checked,
    };

    if (isHoneypotTripped(form.website.value)) {
      showStatus(statusEl, 'success', 'Thank you — your request has been received.');
      form.reset();
      return;
    }

    const { valid, errors } = validateForm(values, buildSchema(isAnonymous));
    if (!valid) {
      showFieldErrors(errors);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    try {
      await createDocument('prayerRequests', { ...values, status: 'new' });

      sendFormNotification({
        form_name: 'Prayer Request',
        submitter_name: isAnonymous ? 'Anonymous' : values.name,
        submitter_email: values.contact,
        subject: 'New Prayer Request',
        message: values.requestText,
      });

      showStatus(
        statusEl,
        'success',
        'Thank you — your prayer request has been received. Our team will be praying with you.'
      );
      form.reset();
      initAnonymousToggle(); // reset field visibility after form.reset()
    } catch (error) {
      showStatus(statusEl, 'error', 'Something went wrong sending your request. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Prayer Request';
    }
  });
}

function showStatus(target, type, message) {
  target.innerHTML = `<div class="form-status form-status--${type}">${message}</div>`;
}

function showFieldErrors(errors) {
  Object.entries(errors).forEach(([field, message]) => {
    const input = qs(`#prayer-${field === 'requestText' ? 'request' : field}`);
    const errorEl = qs(`#prayer-${field === 'requestText' ? 'request' : field}-error`);
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
