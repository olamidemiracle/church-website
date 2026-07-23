/**
 * admin/testimonies/testimonies.js
 * -----------------------------------------------------------------------
 * Manage Testimonies — doesn't fit the generic CRUD engine because the
 * primary workflow is reviewing public submissions (approve/reject),
 * not free-form field editing. Shows every testimony regardless of
 * status, with action buttons appropriate to its current state.
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
  pending: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

// Module-level, not component state: only one admin page renders at a time
// in this SPA, so stashing the signed-in admin here (for activity logging)
// avoids threading authState through every nested function call.
let currentAuthState = null;

export function renderTestimoniesAdmin(root, authState) {
  currentAuthState = authState;

  const contentHTML = `
    <h1>Manage Testimonies</h1>
    <p class="admin-content__subtitle">Review, approve, or reject testimonies submitted by visitors.</p>
    <div id="testimonies-list-wrap" aria-live="polite">
      <div class="state-message">
        <div class="state-spinner" role="status" aria-label="Loading"></div>
        Loading…
      </div>
    </div>`;

  renderAdminLayout(root, {
    activePath: '/admin/testimonies',
    user: authState.user,
    role: authState.role,
    contentHTML,
  });

  loadTestimonies(qs('#admin-page-content', root));
}

async function loadTestimonies(pageRoot) {
  const listWrap = qs('#testimonies-list-wrap', pageRoot);

  try {
    const testimonies = await getCollectionList('testimonies', {
      orderByField: 'submittedAt',
      orderDirection: 'desc',
    });

    if (testimonies.length === 0) {
      listWrap.innerHTML = `<p class="state-message">No testimonies have been submitted yet.</p>`;
      return;
    }

    listWrap.innerHTML = testimonies.map(renderTestimonyCard).join('');

    qsa('.testimony-approve-btn', listWrap).forEach((btn) =>
      btn.addEventListener('click', () => updateStatus(pageRoot, btn.dataset.id, 'approved'))
    );
    qsa('.testimony-reject-btn', listWrap).forEach((btn) =>
      btn.addEventListener('click', () => updateStatus(pageRoot, btn.dataset.id, 'rejected'))
    );
    qsa('.testimony-delete-btn', listWrap).forEach((btn) =>
      btn.addEventListener('click', () => handleDelete(pageRoot, btn.dataset.id))
    );
  } catch (error) {
    listWrap.innerHTML = `
      <p class="state-message state-message--error">
        Couldn't load testimonies right now. Please refresh the page.
      </p>`;
  }
}

function renderTestimonyCard(testimony) {
  const name = escapeHTML(testimony.name || 'Anonymous');
  const title = escapeHTML(testimony.title || '');
  const body = escapeHTML(testimony.body || '');
  const status = testimony.status || 'pending';
  const date = formatDate(testimony.submittedAt);

  return `
    <div class="card" style="margin-bottom: var(--space-4);">
      <div class="admin-page-header" style="margin-bottom: var(--space-3);">
        <div>
          <h3 style="margin-bottom: var(--space-1);">${title || '(untitled)'}</h3>
          <p class="text-sm">By ${name} · ${date}</p>
        </div>
        <span class="pill${status === 'approved' ? ' pill--accent' : ''}">${STATUS_LABELS[status] || status}</span>
      </div>
      <p style="margin-bottom: var(--space-4);">${body}</p>
      <div class="admin-table__actions">
        ${status !== 'approved' ? `<button type="button" class="btn btn-primary testimony-approve-btn" data-id="${testimony.id}">Approve</button>` : ''}
        ${status !== 'rejected' ? `<button type="button" class="btn btn-outline testimony-reject-btn" data-id="${testimony.id}">Reject</button>` : ''}
        <button type="button" class="btn btn-outline testimony-delete-btn" data-id="${testimony.id}">Delete</button>
      </div>
    </div>`;
}

async function updateStatus(pageRoot, id, status) {
  try {
    await updateDocument('testimonies', id, { status });
    logActivity({
      adminId: currentAuthState.user?.uid,
      adminEmail: currentAuthState.user?.email,
      action: `status:${status}`,
      targetCollection: 'testimonies',
      targetId: id,
    });
    await loadTestimonies(pageRoot);
  } catch (error) {
    // eslint-disable-next-line no-alert
    window.alert("Couldn't update this testimony. Please try again.");
  }
}

async function handleDelete(pageRoot, id) {
  // eslint-disable-next-line no-alert
  const confirmed = window.confirm('Delete this testimony permanently?');
  if (!confirmed) {
    return;
  }

  try {
    await deleteDocument('testimonies', id);
    logActivity({
      adminId: currentAuthState.user?.uid,
      adminEmail: currentAuthState.user?.email,
      action: 'delete',
      targetCollection: 'testimonies',
      targetId: id,
    });
    await loadTestimonies(pageRoot);
  } catch (error) {
    // eslint-disable-next-line no-alert
    window.alert("Couldn't delete this testimony. Please try again.");
  }
}
