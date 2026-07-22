/**
 * admin/dashboard/dashboard.js
 * -----------------------------------------------------------------------
 * Dashboard Home — the first authenticated admin page. Shows quick counts
 * pulled from the same collections the public forms write to. Full
 * management views (View Prayer Requests, etc.) are Phase 7 work; this
 * page only needs read access to summarize what's waiting for review.
 * -----------------------------------------------------------------------
 */

import { renderAdminLayout } from '../../layouts/admin-layout.js';
import { getCollectionList } from '../../services/firestore.service.js';
import { qs } from '../../utils/dom-helpers.js';

const STAT_SOURCES = [
  {
    label: 'New Prayer Requests',
    collection: 'prayerRequests',
    filterField: 'status',
    filterValue: 'new',
  },
  {
    label: 'Pending Membership Applications',
    collection: 'membershipApplications',
    filterField: 'status',
    filterValue: 'pending',
  },
  {
    label: 'Unread Contact Messages',
    collection: 'contactMessages',
    filterField: 'status',
    filterValue: 'unread',
  },
  {
    label: 'Testimonies Awaiting Review',
    collection: 'testimonies',
    filterField: 'status',
    filterValue: 'pending',
  },
];

export function renderDashboard(root, { user, role }) {
  const contentHTML = `
    <h1>Dashboard</h1>
    <p class="admin-content__subtitle">Welcome back — here's what needs your attention.</p>
    <div class="admin-stats-grid" id="dashboard-stats" aria-live="polite">
      ${STAT_SOURCES.map(
        () => `
        <div class="admin-stat-card">
          <p class="admin-stat-card__value">—</p>
          <p class="admin-stat-card__label">Loading…</p>
        </div>`
      ).join('')}
    </div>`;

  renderAdminLayout(root, { activePath: '/admin/dashboard', user, role, contentHTML });
  loadStats(root);
}

async function loadStats(root) {
  const target = qs('#dashboard-stats', root);
  if (!target) {
    return;
  }

  try {
    const counts = await Promise.all(
      STAT_SOURCES.map((source) =>
        getCollectionList(source.collection, {
          where: [[source.filterField, '==', source.filterValue]],
        })
      )
    );

    target.innerHTML = STAT_SOURCES.map(
      (source, index) => `
        <div class="admin-stat-card">
          <p class="admin-stat-card__value">${counts[index].length}</p>
          <p class="admin-stat-card__label">${source.label}</p>
        </div>`
    ).join('');
  } catch (error) {
    target.innerHTML = `
      <p class="state-message state-message--error">
        Couldn't load dashboard stats right now. Please refresh the page.
      </p>`;
  }
}
