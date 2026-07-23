/**
 * admin/membership/membership-applications.js
 * -----------------------------------------------------------------------
 * View Membership Applications — lists every application submitted
 * through the public Membership Registration form, lets staff update its
 * review status, delete it, or export the full list as CSV.
 *
 * Named membership-applications.js (not membership.js) to avoid confusion
 * with the future Manage Membership content module, if one is ever added.
 * -----------------------------------------------------------------------
 */

import { renderAdminLayout } from '../../layouts/admin-layout.js';
import {
  getCollectionList,
  updateDocument,
  deleteDocument,
  logActivity,
} from '../../services/firestore.service.js';
import { downloadCSV } from '../../utils/csv.js';
import { escapeHTML, qs, qsa } from '../../utils/dom-helpers.js';
import { formatDate } from '../../utils/formatters.js';

const STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
};

const CSV_COLUMNS = [
  { key: 'fullName', label: 'Full Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'dob', label: 'Date of Birth' },
  { key: 'gender', label: 'Gender' },
  { key: 'maritalStatus', label: 'Marital Status' },
  { key: 'address', label: 'Address' },
  { key: 'occupation', label: 'Occupation' },
  { key: 'howHeard', label: 'How They Heard' },
  { key: 'ministryInterest', label: 'Ministry Interest' },
  { key: 'emergencyContact', label: 'Emergency Contact' },
  { key: 'status', label: 'Status' },
  { key: 'submittedAt', label: 'Submitted', format: formatDate },
];

let currentAuthState = null;
let currentApplications = [];

export function renderMembershipApplicationsAdmin(root, authState) {
  currentAuthState = authState;

  const contentHTML = `
    <div class="admin-page-header">
      <div>
        <h1>Membership Applications</h1>
        <p class="admin-content__subtitle">Applications submitted through the public Membership Registration form.</p>
      </div>
      <button type="button" class="btn btn-outline" id="export-csv-btn">Export CSV</button>
    </div>
    <div id="membership-list-wrap" aria-live="polite">
      <div class="state-message">
        <div class="state-spinner" role="status" aria-label="Loading"></div>
        Loading…
      </div>
    </div>`;

  renderAdminLayout(root, {
    activePath: '/admin/membership',
    user: authState.user,
    role: authState.role,
    contentHTML,
  });

  const pageRoot = qs('#admin-page-content', root);
  qs('#export-csv-btn', pageRoot).addEventListener('click', () => {
    if (currentApplications.length === 0) {
      // eslint-disable-next-line no-alert
      window.alert('There are no applications to export yet.');
      return;
    }
    downloadCSV('membership-applications.csv', currentApplications, CSV_COLUMNS);
  });

  loadApplications(pageRoot);
}

async function loadApplications(pageRoot) {
  const listWrap = qs('#membership-list-wrap', pageRoot);

  try {
    currentApplications = await getCollectionList('membershipApplications', {
      orderByField: 'submittedAt',
      orderDirection: 'desc',
    });

    if (currentApplications.length === 0) {
      listWrap.innerHTML = `<p class="state-message">No membership applications have been submitted yet.</p>`;
      return;
    }

    listWrap.innerHTML = `
      <div class="admin-table-wrap card">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Phone</th><th>Submitted</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${currentApplications.map(renderRow).join('')}
          </tbody>
        </table>
      </div>`;

    qsa('.membership-status-select', listWrap).forEach((select) => {
      select.addEventListener('change', () =>
        updateStatus(pageRoot, select.dataset.id, select.value)
      );
    });
    qsa('.membership-delete-btn', listWrap).forEach((btn) => {
      btn.addEventListener('click', () => handleDelete(pageRoot, btn.dataset.id));
    });
  } catch (error) {
    listWrap.innerHTML = `
      <p class="state-message state-message--error">
        Couldn't load membership applications right now. Please refresh the page.
      </p>`;
  }
}

function renderRow(application) {
  const status = application.status || 'pending';

  return `
    <tr>
      <td>${escapeHTML(application.fullName || '')}</td>
      <td>${escapeHTML(application.email || '')}</td>
      <td>${escapeHTML(application.phone || '')}</td>
      <td>${formatDate(application.submittedAt)}</td>
      <td>
        <select class="form-input membership-status-select" data-id="${application.id}" style="width: auto; min-height: 40px;">
          ${Object.entries(STATUS_LABELS)
            .map(
              ([value, label]) =>
                `<option value="${value}" ${status === value ? 'selected' : ''}>${label}</option>`
            )
            .join('')}
        </select>
      </td>
      <td class="admin-table__actions">
        <button type="button" class="btn btn-outline membership-delete-btn" data-id="${application.id}">Delete</button>
      </td>
    </tr>`;
}

async function updateStatus(pageRoot, id, status) {
  try {
    await updateDocument('membershipApplications', id, { status });
    logActivity({
      adminId: currentAuthState.user?.uid,
      adminEmail: currentAuthState.user?.email,
      action: `status:${status}`,
      targetCollection: 'membershipApplications',
      targetId: id,
    });
  } catch (error) {
    // eslint-disable-next-line no-alert
    window.alert("Couldn't update this application. Please try again.");
    await loadApplications(pageRoot);
  }
}

async function handleDelete(pageRoot, id) {
  // eslint-disable-next-line no-alert
  const confirmed = window.confirm('Delete this membership application permanently?');
  if (!confirmed) {
    return;
  }

  try {
    await deleteDocument('membershipApplications', id);
    logActivity({
      adminId: currentAuthState.user?.uid,
      adminEmail: currentAuthState.user?.email,
      action: 'delete',
      targetCollection: 'membershipApplications',
      targetId: id,
    });
    await loadApplications(pageRoot);
  } catch (error) {
    // eslint-disable-next-line no-alert
    window.alert("Couldn't delete this application. Please try again.");
  }
}
