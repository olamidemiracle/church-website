/**
 * pages/testimonies/testimonies.js
 * -----------------------------------------------------------------------
 * Two independent pieces on one page:
 *  1. Fetches and renders testimonies where status == "approved" (public
 *     read is scoped to this by firestore.rules regardless of what we
 *     query for, but the query itself also filters so we don't render
 *     pending/rejected ones even if rules changed later).
 *  2. A submission form that writes a new testimony with status:
 *     "pending" — it will only appear publicly once an admin approves it
 *     via the (future) admin dashboard.
 * -----------------------------------------------------------------------
 */

import { mountPublicLayout } from '../../layouts/public-layout.js';
import { getCollectionList, createDocument } from '../../services/firestore.service.js';
import { sendFormNotification } from '../../services/emailjs.service.js';
import {
  validateForm,
  isRequired,
  isWithinLength,
  isHoneypotTripped,
} from '../../utils/validators.js';
import { escapeHTML, qs } from '../../utils/dom-helpers.js';
import { setPageMeta } from '../../utils/seo.js';

setPageMeta({
  title: 'Testimonies',
  description: 'Real stories of what God is doing in the lives of our church family.',
});

const FORM_SCHEMA = {
  name: [[isRequired, 'Please enter your name.']],
  title: [[isRequired, 'Please give your story a short title.']],
  body: [
    [isRequired, 'Please share your story.'],
    [(v) => isWithinLength(v, 3000), 'Please keep your story under 3000 characters.'],
  ],
};

async function init() {
  await mountPublicLayout();
  await renderApprovedTestimonies();
  initSubmissionForm();
}

async function renderApprovedTestimonies() {
  const target = qs('#testimonies-list');
  if (!target) {
    return;
  }

  try {
    const testimonies = await getCollectionList('testimonies', {
      where: [['status', '==', 'approved']],
      orderByField: 'submittedAt',
      orderDirection: 'desc',
    });

    if (testimonies.length === 0) {
      target.innerHTML = `<p class="state-message">Testimonies will be shared here soon.</p>`;
      return;
    }

    target.innerHTML = testimonies.map(renderTestimonyCard).join('');
  } catch (error) {
    target.innerHTML = `
      <p class="state-message state-message--error">
        We couldn't load testimonies right now. Please refresh the page.
      </p>`;
  }
}

function renderTestimonyCard(testimony) {
  const title = escapeHTML(testimony.title || '');
  const body = escapeHTML(testimony.body || '');
  const name = escapeHTML(testimony.name || '');

  return `
    <article class="card">
      <span class="testimony-card__quote-mark" aria-hidden="true">&ldquo;</span>
      ${title ? `<h3 class="entity-card__title">${title}</h3>` : ''}
      <p class="entity-card__desc">${body}</p>
      ${name ? `<p class="testimony-card__name">— ${name}</p>` : ''}
    </article>`;
}

function initSubmissionForm() {
  const form = qs('#testimony-form');
  const statusEl = qs('#testimony-form-status');
  const submitBtn = qs('#testimony-submit-btn');
  if (!form) {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearFieldErrors(form);
    statusEl.innerHTML = '';

    const values = {
      name: form.name.value,
      title: form.title.value,
      body: form.body.value,
    };

    if (isHoneypotTripped(form.website.value)) {
      showStatus(statusEl, 'success', 'Thank you for sharing your story!');
      form.reset();
      return;
    }

    const { valid, errors } = validateForm(values, FORM_SCHEMA);
    const consentGiven = form.consent.checked;

    if (!consentGiven) {
      const consentError = qs('#testimony-consent-error');
      if (consentError) {
        consentError.textContent = 'Please check the box to give permission before submitting.';
      }
    }

    if (!valid || !consentGiven) {
      showFieldErrors(errors);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';

    try {
      await createDocument('testimonies', {
        ...values,
        consent: true,
        status: 'pending',
      });

      sendFormNotification({
        form_name: 'Testimony Submission',
        submitter_name: values.name,
        subject: `New Testimony: ${values.title}`,
        message: values.body,
      });

      showStatus(
        statusEl,
        'success',
        'Thank you for sharing your story! It will appear on this page once reviewed.'
      );
      form.reset();
    } catch (error) {
      showStatus(
        statusEl,
        'error',
        'Something went wrong submitting your story. Please try again.'
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Your Testimony';
    }
  });
}

function showStatus(target, type, message) {
  target.innerHTML = `<div class="form-status form-status--${type}">${message}</div>`;
}

function showFieldErrors(errors) {
  Object.entries(errors).forEach(([field, message]) => {
    const input = qs(`#testimony-${field}`);
    const errorEl = qs(`#testimony-${field}-error`);
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
