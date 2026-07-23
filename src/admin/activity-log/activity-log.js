/**
 * admin/activity-log/activity-log.js
 * -----------------------------------------------------------------------
 * Activity Log — read-only audit trail of admin actions, written by
 * logActivity() calls sprinkled through every admin module (see
 * services/firestore.service.js), plus the setUserRole Cloud Function.
 * Superadmin-only, enforced both by the router's requireRoles guard
 * (admin/admin.js) and firestore.rules (`allow read: if isAdmin();`).
 * -----------------------------------------------------------------------
 */

import { renderAdminLayout } from '../../layouts/admin-layout.js';
import { getCollectionPage } from '../../services/firestore.service.js';
import { escapeHTML, qs } from '../../utils/dom-helpers.js';
import { formatDate } from '../../utils/formatters.js';

const PAGE_SIZE = 30;
let lastDoc = null;
let hasMore = true;
let isLoading = false;

export function renderActivityLogAdmin(root, authState) {
  lastDoc = null;
  hasMore = true;
  isLoading = false;

  const contentHTML = `
    <h1>Activity Log</h1>
    <p class="admin-content__subtitle">An audit trail of admin actions across the dashboard.</p>
    <div id="activity-list-wrap" aria-live="polite">
      <div class="state-message">
        <div class="state-spinner" role="status" aria-label="Loading"></div>
        Loading…
      </div>
    </div>
    <div class="load-more-wrap" id="activity-load-more-wrap" hidden>
      <button type="button" class="btn btn-outline" id="activity-load-more-btn">Load More</button>
    </div>`;

  renderAdminLayout(root, {
    activePath: '/admin/activity-log',
    user: authState.user,
    role: authState.role,
    contentHTML,
  });

  const pageRoot = qs('#admin-page-content', root);
  qs('#activity-load-more-btn', pageRoot).addEventListener('click', () => loadNextPage(pageRoot));

  loadNextPage(pageRoot);
}

async function loadNextPage(pageRoot) {
  if (isLoading || !hasMore) {
    return;
  }
  isLoading = true;

  const listWrap = qs('#activity-list-wrap', pageRoot);
  const loadMoreBtn = qs('#activity-load-more-btn', pageRoot);
  if (loadMoreBtn) {
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = 'Loading…';
  }

  try {
    const page = await getCollectionPage('activityLogs', {
      orderByField: 'timestamp',
      orderDirection: 'desc',
      pageSize: PAGE_SIZE,
      startAfterDoc: lastDoc,
    });

    lastDoc = page.lastDoc;
    hasMore = page.hasMore;

    appendEntries(listWrap, page.items);
    updateLoadMoreVisibility(pageRoot);
  } catch (error) {
    listWrap.innerHTML = `
      <p class="state-message state-message--error">
        Couldn't load the activity log right now. Please refresh the page.
      </p>`;
  } finally {
    isLoading = false;
    if (loadMoreBtn) {
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = 'Load More';
    }
  }
}

function appendEntries(listWrap, entries) {
  const isFirstPage = listWrap.querySelector('.state-message') !== null;

  if (entries.length === 0 && isFirstPage) {
    listWrap.innerHTML = `<p class="state-message">No admin activity has been recorded yet.</p>`;
    return;
  }

  if (isFirstPage) {
    listWrap.innerHTML = `
      <div class="admin-table-wrap card">
        <table class="admin-table">
          <thead><tr><th>When</th><th>Admin</th><th>Action</th><th>Collection</th><th>Item ID</th></tr></thead>
          <tbody id="activity-table-body"></tbody>
        </table>
      </div>`;
  }

  const tbody = qs('#activity-table-body', listWrap);
  tbody.insertAdjacentHTML('beforeend', entries.map(renderRow).join(''));
}

function renderRow(entry) {
  return `
    <tr>
      <td>${formatDate(entry.timestamp)}</td>
      <td>${escapeHTML(entry.adminEmail || entry.adminId || 'Unknown')}</td>
      <td>${escapeHTML(entry.action || '')}</td>
      <td>${escapeHTML(entry.targetCollection || '')}</td>
      <td>${escapeHTML(entry.targetId || '')}</td>
    </tr>`;
}

function updateLoadMoreVisibility(pageRoot) {
  const wrap = qs('#activity-load-more-wrap', pageRoot);
  if (wrap) {
    wrap.hidden = !hasMore;
  }
}
