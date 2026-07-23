/**
 * admin/donations/donations.js
 * -----------------------------------------------------------------------
 * Manage Donations — a read-only report of the `donations` collection.
 * There's no create/edit form here on purpose: per Section 8 of the
 * project plan, donation records are written only by a Cloud Function
 * (the Paystack webhook handler, Phase 8's Give/Donate integration) —
 * never directly by the client SDK (firestore.rules already enforces
 * `allow write: if false` on this collection). Until Phase 8 ships, this
 * page will simply show an empty state.
 * -----------------------------------------------------------------------
 */

import { renderAdminLayout } from '../../layouts/admin-layout.js';
import { getCollectionList } from '../../services/firestore.service.js';
import { escapeHTML, qs } from '../../utils/dom-helpers.js';
import { formatDate } from '../../utils/formatters.js';

export function renderDonationsAdmin(root, authState) {
  const contentHTML = `
    <h1>Donations</h1>
    <p class="admin-content__subtitle">A read-only record of donations received through the website.</p>
    <div id="donations-list-wrap" aria-live="polite">
      <div class="state-message">
        <div class="state-spinner" role="status" aria-label="Loading"></div>
        Loading…
      </div>
    </div>`;

  renderAdminLayout(root, {
    activePath: '/admin/donations',
    user: authState.user,
    role: authState.role,
    contentHTML,
  });

  loadDonations(qs('#admin-page-content', root));
}

async function loadDonations(pageRoot) {
  const listWrap = qs('#donations-list-wrap', pageRoot);

  try {
    const donations = await getCollectionList('donations', {
      orderByField: 'date',
      orderDirection: 'desc',
    });

    if (donations.length === 0) {
      listWrap.innerHTML = `
        <p class="state-message">
          No donations recorded yet. Once online giving is connected, donation records will
          appear here automatically.
        </p>`;
      return;
    }

    const total = donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

    listWrap.innerHTML = `
      <div class="admin-stats-grid" style="margin-bottom: var(--space-5);">
        <div class="admin-stat-card">
          <p class="admin-stat-card__value">${donations.length}</p>
          <p class="admin-stat-card__label">Total Donations</p>
        </div>
        <div class="admin-stat-card">
          <p class="admin-stat-card__value">${escapeHTML(donations[0]?.currency || '')} ${total.toLocaleString()}</p>
          <p class="admin-stat-card__label">Total Amount</p>
        </div>
      </div>
      <div class="admin-table-wrap card">
        <table class="admin-table">
          <thead>
            <tr><th>Donor</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr>
          </thead>
          <tbody>
            ${donations
              .map(
                (d) => `
                <tr>
                  <td>${escapeHTML(d.donorName || 'Anonymous')}</td>
                  <td>${escapeHTML(d.currency || '')} ${escapeHTML(d.amount ?? '')}</td>
                  <td>${escapeHTML(d.method || '')}</td>
                  <td>${escapeHTML(d.status || '')}</td>
                  <td>${formatDate(d.date)}</td>
                </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>`;
  } catch (error) {
    listWrap.innerHTML = `
      <p class="state-message state-message--error">
        Couldn't load donations right now. Please refresh the page.
      </p>`;
  }
}
