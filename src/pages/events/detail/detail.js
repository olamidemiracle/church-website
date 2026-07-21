/**
 * pages/events/detail/detail.js
 * -----------------------------------------------------------------------
 * Single reusable template for every event's detail view, chosen via
 * ?slug= (e.g. /events/detail?slug=fall-festival). Renders event details,
 * an embedded map of the location, and an optional RSVP form that writes
 * to the events/{id}/rsvps subcollection (allowed by firestore.rules as
 * create-only, matching Section 5 of the project plan).
 * -----------------------------------------------------------------------
 */

import { mountPublicLayout } from '../../../layouts/public-layout.js';
import {
  getDocumentByField,
  createSubcollectionDocument,
} from '../../../services/firestore.service.js';
import { escapeHTML, getQueryParam, qs } from '../../../utils/dom-helpers.js';
import { formatDate, formatTime, isPast } from '../../../utils/formatters.js';
import { setPageMeta } from '../../../utils/seo.js';
import {
  validateForm,
  isRequired,
  isValidEmail,
  isValidPhone,
  isHoneypotTripped,
} from '../../../utils/validators.js';

const RSVP_SCHEMA = {
  name: [[isRequired, 'Please enter your name.']],
  email: [[isValidEmail, 'Please enter a valid email address.']],
  phone: [[isValidPhone, 'Please enter a valid phone number.']],
};

async function init() {
  await mountPublicLayout();

  const slug = getQueryParam('slug');
  const target = qs('#event-detail-content');
  if (!target) {
    return;
  }

  if (!slug) {
    renderNotFound(target);
    return;
  }

  try {
    const event = await getDocumentByField('events', 'slug', slug);
    if (!event) {
      renderNotFound(target);
      return;
    }
    renderEvent(target, event);
    initRsvpForm(event);
  } catch (error) {
    target.innerHTML = `
      <section class="section">
        <div class="container">
          <p class="state-message state-message--error">
            We couldn't load this event right now. Please refresh the page.
          </p>
        </div>
      </section>`;
  }
}

function renderEvent(target, event) {
  const title = escapeHTML(event.title || 'Event');
  const description = escapeHTML(event.description || '');
  const location = escapeHTML(event.location || '');
  const category = escapeHTML(event.category || '');
  const image = event.imageUrl || '';
  const date = formatDate(event.startDate);
  const time = formatTime(event.startDate);
  const eventIsPast = isPast(event.endDate || event.startDate);

  setPageMeta({
    title: `${title} | Events`,
    description: description || `Join us for ${title}.`,
  });

  target.innerHTML = `
    <section class="page-header">
      <div class="container">
        <h1 class="page-header__title">${title}</h1>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <a href="/events">Events</a>
          <span class="breadcrumbs__sep">/</span>
          <span aria-current="page">${title}</span>
        </nav>

        ${image ? `<img class="event-detail__image" src="${image}" alt="${title}" />` : ''}

        <div class="event-detail__layout">
          <div>
            <div class="event-detail__meta-list">
              ${date ? `<div class="event-detail__meta-item">🗓 <span>${date}${time ? ` at ${time}` : ''}</span></div>` : ''}
              ${location ? `<div class="event-detail__meta-item">📍 <span>${location}</span></div>` : ''}
              ${category ? `<div class="event-detail__meta-item">🏷 <span>${category}</span></div>` : ''}
            </div>

            <div id="event-map" class="event-detail__map">
              ${
                location
                  ? `<iframe
                      src="https://www.google.com/maps?q=${encodeURIComponent(location)}&output=embed"
                      title="Event location map"
                      loading="lazy"
                      referrerpolicy="no-referrer-when-downgrade"
                    ></iframe>`
                  : ''
              }
            </div>

            ${description ? `<p>${description}</p>` : ''}
          </div>

          <div class="card rsvp-card">
            ${
              eventIsPast
                ? `<p class="state-message">This event has already taken place.</p>`
                : `
                <h2>RSVP</h2>
                <p class="text-sm" style="margin-bottom: var(--space-4);">
                  Let us know you're coming — it helps us prepare.
                </p>
                <div id="rsvp-status"></div>
                <form id="rsvp-form" novalidate>
                  <div class="form-field">
                    <label class="form-label" for="rsvp-name">Full Name</label>
                    <input class="form-input" type="text" id="rsvp-name" name="name" autocomplete="name" required />
                    <span class="form-error-text" id="rsvp-name-error"></span>
                  </div>
                  <div class="form-field">
                    <label class="form-label" for="rsvp-email">Email Address</label>
                    <input class="form-input" type="email" id="rsvp-email" name="email" autocomplete="email" required />
                    <span class="form-error-text" id="rsvp-email-error"></span>
                  </div>
                  <div class="form-field">
                    <label class="form-label" for="rsvp-phone">Phone Number</label>
                    <input class="form-input" type="tel" id="rsvp-phone" name="phone" autocomplete="tel" required />
                    <span class="form-error-text" id="rsvp-phone-error"></span>
                  </div>
                  <div class="form-field">
                    <label class="form-label" for="rsvp-guests">Number of Guests</label>
                    <input class="form-input" type="number" id="rsvp-guests" name="guestCount" min="0" value="0" />
                  </div>
                  <div class="form-honeypot" aria-hidden="true">
                    <label for="rsvp-website">Leave this field empty</label>
                    <input type="text" id="rsvp-website" name="website" tabindex="-1" autocomplete="off" />
                  </div>
                  <button type="submit" class="btn btn-primary" id="rsvp-submit-btn">Send RSVP</button>
                </form>`
            }
          </div>
        </div>
      </div>
    </section>`;
}

function initRsvpForm(event) {
  const form = qs('#rsvp-form');
  const statusEl = qs('#rsvp-status');
  const submitBtn = qs('#rsvp-submit-btn');
  if (!form) {
    return;
  } // event is in the past — no form was rendered

  form.addEventListener('submit', async (submitEvent) => {
    submitEvent.preventDefault();
    clearFieldErrors(form);
    statusEl.innerHTML = '';

    const values = {
      name: form.name.value,
      email: form.email.value,
      phone: form.phone.value,
      guestCount: Number(form.guestCount.value) || 0,
    };

    if (isHoneypotTripped(form.website.value)) {
      showStatus(statusEl, 'success', 'RSVP received — we look forward to seeing you!');
      form.reset();
      return;
    }

    const { valid, errors } = validateForm(values, RSVP_SCHEMA);
    if (!valid) {
      showFieldErrors(errors);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    try {
      await createSubcollectionDocument('events', event.id, 'rsvps', values);
      showStatus(statusEl, 'success', 'RSVP received — we look forward to seeing you!');
      form.reset();
    } catch (error) {
      showStatus(statusEl, 'error', 'Something went wrong sending your RSVP. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send RSVP';
    }
  });
}

function showStatus(target, type, message) {
  target.innerHTML = `<div class="form-status form-status--${type}">${message}</div>`;
}

function showFieldErrors(errors) {
  Object.entries(errors).forEach(([field, message]) => {
    const input = qs(`#rsvp-${field}`);
    const errorEl = qs(`#rsvp-${field}-error`);
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

function renderNotFound(target) {
  setPageMeta({ title: 'Event Not Found' });
  target.innerHTML = `
    <section class="section">
      <div class="container" style="text-align: center;">
        <h1>Event Not Found</h1>
        <p>We couldn't find the event you're looking for.</p>
        <a href="/events" class="btn btn-primary" style="margin-top: var(--space-4);">
          View All Events
        </a>
      </div>
    </section>`;
}

init();
