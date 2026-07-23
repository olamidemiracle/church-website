/**
 * admin/settings/settings.js
 * -----------------------------------------------------------------------
 * Website Settings — edits the single settings/general document that the
 * public site reads for church name, address, contact info, and service
 * times (see layouts/public-layout.js and pages/service-times).
 *
 * This is a single-document form rather than a list, so it doesn't use
 * the generic CRUD engine. Service times are a dynamic list of rows
 * (day/time/label/description) that can be added or removed inline.
 * -----------------------------------------------------------------------
 */

import { renderAdminLayout } from '../../layouts/admin-layout.js';
import { getDocument, updateDocument, logActivity } from '../../services/firestore.service.js';
import { escapeHTML, qs, qsa } from '../../utils/dom-helpers.js';

let serviceTimeRowCount = 0;
// Module-level, not component state: only one admin page renders at a time
// in this SPA, so stashing the signed-in admin here (for activity logging)
// avoids threading authState through every nested function call.
let currentAuthState = null;

export function renderSettingsAdmin(root, authState) {
  currentAuthState = authState;
  const contentHTML = `
    <h1>Website Settings</h1>
    <p class="admin-content__subtitle">Church info, contact details, and service times shown across the public site.</p>
    <div id="settings-content-wrap" aria-live="polite">
      <div class="state-message">
        <div class="state-spinner" role="status" aria-label="Loading"></div>
        Loading…
      </div>
    </div>`;

  renderAdminLayout(root, {
    activePath: '/admin/settings',
    user: authState.user,
    role: authState.role,
    contentHTML,
  });

  loadSettings(qs('#admin-page-content', root));
}

async function loadSettings(pageRoot) {
  const wrap = qs('#settings-content-wrap', pageRoot);

  try {
    const settings = (await getDocument('settings', 'general')) || {};
    renderForm(pageRoot, wrap, settings);
  } catch (error) {
    wrap.innerHTML = `
      <p class="state-message state-message--error">
        Couldn't load settings right now. Please refresh the page.
      </p>`;
  }
}

function renderForm(pageRoot, wrap, settings) {
  const serviceTimes = Array.isArray(settings.serviceTimes) ? settings.serviceTimes : [];
  serviceTimeRowCount = 0;

  wrap.innerHTML = `
    <div class="card">
      <div id="settings-form-status"></div>
      <form id="settings-form" novalidate>
        <h2>Church Info</h2>
        <div class="form-row">
          <div class="form-field">
            <label class="form-label" for="settings-church-name">Church Name</label>
            <input class="form-input" type="text" id="settings-church-name" name="churchName" value="${escapeHTML(settings.churchName || '')}" required />
          </div>
          <div class="form-field">
            <label class="form-label" for="settings-phone">Phone</label>
            <input class="form-input" type="tel" id="settings-phone" name="phone" value="${escapeHTML(settings.phone || '')}" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label class="form-label" for="settings-email">Email</label>
            <input class="form-input" type="email" id="settings-email" name="email" value="${escapeHTML(settings.email || '')}" />
          </div>
          <div class="form-field">
            <label class="form-label" for="settings-address">Address</label>
            <input class="form-input" type="text" id="settings-address" name="address" value="${escapeHTML(settings.address || '')}" />
          </div>
        </div>

        <h2 style="margin-top: var(--space-6);">Service Times</h2>
        <div id="service-times-rows">
          ${serviceTimes.map((service) => renderServiceTimeRow(service)).join('')}
        </div>
        <button type="button" class="btn btn-outline" id="add-service-time-btn" style="margin-bottom: var(--space-5);">
          + Add Service Time
        </button>

        <h2>Livestream</h2>
        <div class="form-field">
          <label class="form-label" for="settings-livestream-url">Livestream Embed URL</label>
          <input class="form-input" type="text" id="settings-livestream-url" name="livestreamEmbedUrl" value="${escapeHTML(settings.livestreamEmbedUrl || '')}" />
        </div>

        <h2>Footer</h2>
        <div class="form-field">
          <label class="form-label" for="settings-footer-text">Footer Text</label>
          <textarea class="form-textarea" id="settings-footer-text" name="footerText">${escapeHTML(settings.footerText || '')}</textarea>
        </div>

        <div class="admin-form-actions">
          <button type="submit" class="btn btn-primary" id="settings-submit-btn">Save Settings</button>
        </div>
      </form>
    </div>`;

  qs('#add-service-time-btn', wrap).addEventListener('click', () => {
    qs('#service-times-rows', wrap).insertAdjacentHTML('beforeend', renderServiceTimeRow());
    wireRemoveButtons(wrap);
  });

  wireRemoveButtons(wrap);
  initFormSubmit(wrap);
}

function renderServiceTimeRow(service = {}) {
  const rowIndex = serviceTimeRowCount++;
  return `
    <div class="form-row service-time-row" data-row="${rowIndex}" style="align-items: end; margin-bottom: var(--space-3);">
      <div class="form-field">
        <label class="form-label">Day</label>
        <input class="form-input service-time-day" type="text" value="${escapeHTML(service.day || '')}" placeholder="Sunday" />
      </div>
      <div class="form-field">
        <label class="form-label">Time</label>
        <input class="form-input service-time-time" type="text" value="${escapeHTML(service.time || '')}" placeholder="9:00 AM" />
      </div>
      <div class="form-field">
        <label class="form-label">Label</label>
        <input class="form-input service-time-label" type="text" value="${escapeHTML(service.label || '')}" placeholder="Sunday Worship" />
      </div>
      <button type="button" class="btn btn-outline remove-service-time-btn">Remove</button>
    </div>`;
}

function wireRemoveButtons(wrap) {
  qsa('.remove-service-time-btn', wrap).forEach((btn) => {
    btn.onclick = () => btn.closest('.service-time-row').remove();
  });
}

function initFormSubmit(wrap) {
  const form = qs('#settings-form', wrap);
  const statusEl = qs('#settings-form-status', wrap);
  const submitBtn = qs('#settings-submit-btn', wrap);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    statusEl.innerHTML = '';

    const churchName = qs('#settings-church-name', wrap).value.trim();
    if (!churchName) {
      statusEl.innerHTML = `<div class="form-status form-status--error">Church Name is required.</div>`;
      return;
    }

    const serviceTimes = qsa('.service-time-row', wrap).map((row) => ({
      day: qs('.service-time-day', row).value,
      time: qs('.service-time-time', row).value,
      label: qs('.service-time-label', row).value,
    }));

    const values = {
      churchName,
      phone: qs('#settings-phone', wrap).value,
      email: qs('#settings-email', wrap).value,
      address: qs('#settings-address', wrap).value,
      serviceTimes,
      livestreamEmbedUrl: qs('#settings-livestream-url', wrap).value,
      footerText: qs('#settings-footer-text', wrap).value,
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving…';

    try {
      await updateDocument('settings', 'general', values);
      logActivity({
        adminId: currentAuthState.user?.uid,
        adminEmail: currentAuthState.user?.email,
        action: 'update',
        targetCollection: 'settings',
        targetId: 'general',
      });
      statusEl.innerHTML = `<div class="form-status form-status--success">Settings saved successfully.</div>`;
    } catch (error) {
      statusEl.innerHTML = `<div class="form-status form-status--error">Something went wrong saving settings. Please try again.</div>`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Settings';
    }
  });
}
