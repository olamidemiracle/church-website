/**
 * pages/membership/membership.js
 * -----------------------------------------------------------------------
 * Membership Registration form — validate → honeypot check → Firestore
 * write (membershipApplications, create-only per firestore.rules,
 * defaults to status: "pending") → best-effort EmailJS staff notification
 * → success/error state. Field set matches Section 3 of the project plan.
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
  title: 'Membership Registration',
  description: 'Take the next step and register for membership with our church family.',
});

const FORM_SCHEMA = {
  fullName: [[isRequired, 'Please enter your full name.']],
  dob: [[isRequired, 'Please enter your date of birth.']],
  gender: [[isRequired, 'Please select your gender.']],
  address: [[isRequired, 'Please enter your home address.']],
  phone: [[isValidPhone, 'Please enter a valid phone number.']],
  email: [[isValidEmail, 'Please enter a valid email address.']],
  emergencyContact: [[isRequired, 'Please provide an emergency contact name and phone number.']],
};

async function init() {
  await mountPublicLayout();
  initForm();
}

function initForm() {
  const form = qs('#membership-form');
  const statusEl = qs('#membership-form-status');
  const submitBtn = qs('#membership-submit-btn');
  if (!form) {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearFieldErrors(form);
    statusEl.innerHTML = '';

    const values = {
      fullName: form.fullName.value,
      dob: form.dob.value,
      gender: form.gender.value,
      maritalStatus: form.maritalStatus.value,
      address: form.address.value,
      phone: form.phone.value,
      email: form.email.value,
      occupation: form.occupation.value,
      howHeard: form.howHeard.value,
      ministryInterest: form.ministryInterest.value,
      emergencyContact: form.emergencyContact.value,
    };

    if (isHoneypotTripped(form.website.value)) {
      showStatus(statusEl, 'success', 'Thank you! Your registration has been received.');
      form.reset();
      return;
    }

    const { valid, errors } = validateForm(values, FORM_SCHEMA);
    if (!valid) {
      showFieldErrors(errors);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';

    try {
      await createDocument('membershipApplications', { ...values, status: 'pending' });

      sendFormNotification({
        form_name: 'Membership Registration',
        submitter_name: values.fullName,
        submitter_email: values.email,
        subject: 'New Membership Application',
        message: `${values.fullName} has submitted a membership application.`,
      });

      showStatus(
        statusEl,
        'success',
        'Thank you! Your membership registration has been received. Our team will follow up with you soon.'
      );
      form.reset();
    } catch (error) {
      showStatus(
        statusEl,
        'error',
        'Something went wrong submitting your registration. Please try again.'
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Registration';
    }
  });
}

function showStatus(target, type, message) {
  target.innerHTML = `<div class="form-status form-status--${type}">${message}</div>`;
}

function showFieldErrors(errors) {
  Object.entries(errors).forEach(([field, message]) => {
    const input = qs(`#member-${kebabCase(field)}`);
    const errorEl = qs(`#member-${field}-error`);
    if (input) {
      input.classList.add('has-error');
    }
    if (errorEl) {
      errorEl.textContent = message;
    }
  });
}

/** Converts a camelCase field name to the kebab-case id used in the HTML (e.g. maritalStatus -> marital-status). */
function kebabCase(value) {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function clearFieldErrors(form) {
  form.querySelectorAll('.has-error').forEach((el) => el.classList.remove('has-error'));
  form.querySelectorAll('.form-error-text').forEach((el) => (el.textContent = ''));
}

init();
