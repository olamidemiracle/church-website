/**
 * admin/visitors/visitors.js
 * -----------------------------------------------------------------------
 * View Visitor Submissions — lists everyone who filled in the public
 * "Plan Your Visit" form, with a follow-up status the welcome team can
 * update as they reach out.
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
  contacted: 'Contacted',
  completed: 'Completed',
};

let currentAuthState = null;

export function renderVisitorsAdmin(root, authState) {
  currentAuthState = authState;

  const contentHTML = `
    <h1>Visitor Submissions</h1>
    <p class="admin-content__subtitle">Everyone who let us know they're planning to visit.</p>
    <div id="visitors-list-wrap" aria-live="polite">
      <div class="state-message">
        <div class="state-spinner" role="status" aria-label="Loading"></div>
        Loading…
      </div>
    </div>`;

  renderAdminLayout(root, {
    activePath: '/admin/visitors',
    user: authState.user,
    role: authState.role,
    contentHTML,
  });

  loadVisitors(qs('#admin-page-content', root));
}

async function loadVisitors(pageRoot) {
  const listWrap = qs('#visitors-list-wrap', pageRoot);

  try {
    const visitors = await getCollectionList('visitorSubmissions', {
      orderByField: 'submittedAt',
      orderDirection: 'desc',
    });

    if (visitors.length === 0) {
      listWrap.innerHTML = `<p class="state-message">No visitor submissions yet.</p>`;
      return;
    }

    listWrap.innerHTML = `
      <div class="admin-table-wrap card">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Phone</th><th>Visit Date</th><th>Submitted</th>
              <th>Follow-up</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${visitors.map(renderRow).join('')}
          </tbody>
        </table>
      </div>`;

    qsa('.visitor-status-select', listWrap).forEach((select) => {
      select.addEventListener('change', () =>
        updateStatus(pageRoot, select.dataset.id, select.value)
      );
    });
    qsa('.visitor-delete-btn', listWrap).forEach((btn) => {
      btn.addEventListener('click', () => handleDelete(pageRoot, btn.dataset.id));
    });
  } catch (error) {
    listWrap.innerHTML = `
      <p class="state-message state-message--error">
        Couldn't load visitor submissions right now. Please refresh the page.
      </p>`;
  }
}

function renderRow(visitor) {
  const status = visitor.followUpStatus || 'new';

  return `
    <tr>
      <td>${escapeHTML(visitor.name || '')}</td>
      <td>${escapeHTML(visitor.email || '')}</td>
      <td>${escapeHTML(visitor.phone || '')}</td>
      <td>${escapeHTML(visitor.visitDate || '')}</td>
      <td>${formatDate(visitor.submittedAt)}</td>
      <td>
        <select class="form-input visitor-status-select" data-id="${visitor.id}" style="width: auto; min-height: 40px;">
          ${Object.entries(STATUS_LABELS)
            .map(
              ([value, label]) =>
                `<option value="${value}" ${status === value ? 'selected' : ''}>${label}</option>`
            )
            .join('')}
        </select>
      </td>
      <td class="admin-table__actions">
        <button type="button" class="btn btn-outline visitor-delete-btn" data-id="${visitor.id}">Delete</button>
      </td>
    </tr>`;
}

async function updateStatus(pageRoot, id, status) {
  try {
    await updateDocument('visitorSubmissions', id, { followUpStatus: status });
    logActivity({
      adminId: currentAuthState.user?.uid,
      adminEmail: currentAuthState.user?.email,
      action: `followUpStatus:${status}`,
      targetCollection: 'visitorSubmissions',
      targetId: id,
    });
  } catch (error) {
    // eslint-disable-next-line no-alert
    window.alert("Couldn't update this submission. Please try again.");
    await loadVisitors(pageRoot);
  }
}

async function handleDelete(pageRoot, id) {
  // eslint-disable-next-line no-alert
  const confirmed = window.confirm('Delete this visitor submission permanently?');
  if (!confirmed) {
    return;
  }

  try {
    await deleteDocument('visitorSubmissions', id);
    logActivity({
      adminId: currentAuthState.user?.uid,
      adminEmail: currentAuthState.user?.email,
      action: 'delete',
      targetCollection: 'visitorSubmissions',
      targetId: id,
    });
    await loadVisitors(pageRoot);
  } catch (error) {
    // eslint-disable-next-line no-alert
    window.alert("Couldn't delete this submission. Please try again.");
  }
}
