/**
 * admin/prayer-requests/prayer-requests.js
 * -----------------------------------------------------------------------
 * View Prayer Requests — lists every submission (confidential ones
 * included, since "confidential" means hidden from the public site and
 * congregation, not from admin staff — see firestore.rules and the
 * Privacy Policy). Lets staff mark a request as being prayed for or
 * answered, and delete old ones.
 * -----------------------------------------------------------------------
 */

import { renderAdminLayout } from '../../layouts/admin-layout.js';
import {
  getCollectionList,
  updateDocument,
  deleteDocument,
  logActivity,
} from '../../services/firestore.service.js';
import { escapeHTML, qs, qsa } from '../../utils/dom-helpers.js';
import { formatDate } from '../../utils/formatters.js';

const STATUS_LABELS = {
  new: 'New',
  praying: 'Praying',
  answered: 'Answered',
};

let currentAuthState = null;

export function renderPrayerRequestsAdmin(root, authState) {
  currentAuthState = authState;

  const contentHTML = `
    <h1>Prayer Requests</h1>
    <p class="admin-content__subtitle">Requests submitted through the public Prayer Request form.</p>
    <div id="prayer-list-wrap" aria-live="polite">
      <div class="state-message">
        <div class="state-spinner" role="status" aria-label="Loading"></div>
        Loading…
      </div>
    </div>`;

  renderAdminLayout(root, {
    activePath: '/admin/prayer-requests',
    user: authState.user,
    role: authState.role,
    contentHTML,
  });

  loadRequests(qs('#admin-page-content', root));
}

async function loadRequests(pageRoot) {
  const listWrap = qs('#prayer-list-wrap', pageRoot);

  try {
    const requests = await getCollectionList('prayerRequests', {
      orderByField: 'submittedAt',
      orderDirection: 'desc',
    });

    if (requests.length === 0) {
      listWrap.innerHTML = `<p class="state-message">No prayer requests have been submitted yet.</p>`;
      return;
    }

    listWrap.innerHTML = requests.map(renderCard).join('');

    qsa('.prayer-status-select', listWrap).forEach((select) => {
      select.addEventListener('change', () =>
        updateStatus(pageRoot, select.dataset.id, select.value)
      );
    });
    qsa('.prayer-delete-btn', listWrap).forEach((btn) => {
      btn.addEventListener('click', () => handleDelete(pageRoot, btn.dataset.id));
    });
  } catch (error) {
    listWrap.innerHTML = `
      <p class="state-message state-message--error">
        Couldn't load prayer requests right now. Please refresh the page.
      </p>`;
  }
}

function renderCard(request) {
  const name = escapeHTML(request.isAnonymous ? 'Anonymous' : request.name || 'Anonymous');
  const contact = escapeHTML(request.contact || '');
  const text = escapeHTML(request.requestText || '');
  const status = request.status || 'new';
  const date = formatDate(request.submittedAt);
  const isConfidential = Boolean(request.isConfidential);

  return `
    <div class="card" style="margin-bottom: var(--space-4);">
      <div class="admin-page-header" style="margin-bottom: var(--space-3);">
        <div>
          <h3 style="margin-bottom: var(--space-1);">${name}</h3>
          <p class="text-sm">${date}${contact ? ` · ${contact}` : ''}</p>
        </div>
        <div style="display: flex; gap: var(--space-2); align-items: center;">
          ${isConfidential ? `<span class="pill pill--accent">Confidential</span>` : ''}
          <select class="form-input prayer-status-select" data-id="${request.id}" style="width: auto; min-height: 40px;">
            ${Object.entries(STATUS_LABELS)
              .map(
                ([value, label]) =>
                  `<option value="${value}" ${status === value ? 'selected' : ''}>${label}</option>`
              )
              .join('')}
          </select>
        </div>
      </div>
      <p style="margin-bottom: var(--space-4);">${text}</p>
      <div class="admin-table__actions">
        <button type="button" class="btn btn-outline prayer-delete-btn" data-id="${request.id}">Delete</button>
      </div>
    </div>`;
}

async function updateStatus(pageRoot, id, status) {
  try {
    await updateDocument('prayerRequests', id, { status });
    logActivity({
      adminId: currentAuthState.user?.uid,
      adminEmail: currentAuthState.user?.email,
      action: `status:${status}`,
      targetCollection: 'prayerRequests',
      targetId: id,
    });
  } catch (error) {
    // eslint-disable-next-line no-alert
    window.alert("Couldn't update this request. Please try again.");
    await loadRequests(pageRoot);
  }
}

async function handleDelete(pageRoot, id) {
  // eslint-disable-next-line no-alert
  const confirmed = window.confirm('Delete this prayer request permanently?');
  if (!confirmed) {
    return;
  }

  try {
    await deleteDocument('prayerRequests', id);
    logActivity({
      adminId: currentAuthState.user?.uid,
      adminEmail: currentAuthState.user?.email,
      action: 'delete',
      targetCollection: 'prayerRequests',
      targetId: id,
    });
    await loadRequests(pageRoot);
  } catch (error) {
    // eslint-disable-next-line no-alert
    window.alert("Couldn't delete this request. Please try again.");
  }
}
