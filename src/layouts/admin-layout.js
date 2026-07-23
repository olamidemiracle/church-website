/**
 * layouts/admin-layout.js
 * -----------------------------------------------------------------------
 * Renders the authenticated admin shell (sidebar + topbar) around a
 * page's own content. Only routes with `requireAuth: true` in the router
 * use this — Login and Forgot Password render their own centered forms
 * without a sidebar.
 *
 * Sidebar links reflect the full Admin Dashboard page list from the
 * project plan (Section 4), but only Dashboard Home is wired up so far —
 * everything else is Phase 6/7 work and is intentionally rendered as
 * "Coming soon" rather than a dead link, so the navigation structure is
 * visible without pretending unfinished pages work.
 * -----------------------------------------------------------------------
 */

import { signOutUser } from '../services/auth.service.js';
import { navigate } from '../router/router.js';
import { escapeHTML, qs } from '../utils/dom-helpers.js';

const NAV_SECTIONS = [
  {
    heading: 'Overview',
    items: [{ label: 'Dashboard Home', path: '/admin/dashboard', enabled: true }],
  },
  {
    heading: 'Content',
    items: [
      { label: 'Manage Sermons', path: '/admin/sermons', enabled: true },
      { label: 'Manage Events', path: '/admin/events', enabled: true },
      { label: 'Manage Ministries', path: '/admin/ministries', enabled: true },
      { label: 'Manage Gallery', path: '/admin/gallery', enabled: true },
      { label: 'Manage Leadership', path: '/admin/leadership', enabled: true },
      { label: 'Manage Announcements', path: '/admin/news', enabled: true },
      { label: 'Manage Devotionals', path: '/admin/devotionals', enabled: false },
    ],
  },
  {
    heading: 'Submissions',
    items: [
      { label: 'Prayer Requests', path: '/admin/prayer-requests', enabled: true },
      { label: 'Membership Applications', path: '/admin/membership', enabled: true },
      { label: 'Visitor Submissions', path: '/admin/visitors', enabled: true },
      { label: 'Testimonies', path: '/admin/testimonies', enabled: true },
      { label: 'Contact Messages', path: '/admin/messages', enabled: true },
      { label: 'Donations', path: '/admin/donations', enabled: true, superadminOnly: true },
    ],
  },
  {
    heading: 'System',
    items: [
      { label: 'Manage Users', path: '/admin/users', enabled: false, superadminOnly: true },
      { label: 'Website Settings', path: '/admin/settings', enabled: true, superadminOnly: true },
      { label: 'Activity Log', path: '/admin/activity-log', enabled: true, superadminOnly: true },
    ],
  },
];

/**
 * Renders the full admin shell into `root`, with `contentHTML` placed in
 * the main content area. Call this once per route render; it replaces
 * root's entire innerHTML.
 */
export function renderAdminLayout(root, { activePath, user, role, contentHTML }) {
  const email = escapeHTML(user?.email || '');
  const roleLabel = escapeHTML(role || 'unknown role');

  root.innerHTML = `
    <div class="admin-shell">
      <button type="button" class="admin-sidebar-toggle" id="admin-sidebar-toggle" aria-label="Toggle menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>

      <aside class="admin-sidebar" id="admin-sidebar">
        <div class="admin-sidebar__brand">
          <span aria-hidden="true">✚</span> Admin
        </div>
        <nav class="admin-nav">
          ${NAV_SECTIONS.map((section) => renderNavSection(section, activePath, role)).join('')}
        </nav>
      </aside>

      <div class="admin-main">
        <header class="admin-topbar">
          <div class="admin-topbar__user">
            <span class="admin-topbar__email">${email}</span>
            <span class="pill">${roleLabel}</span>
          </div>
          <button type="button" class="btn btn-outline" id="admin-logout-btn">Log Out</button>
        </header>

        <main class="admin-content" id="admin-page-content">
          ${contentHTML}
        </main>
      </div>
    </div>`;

  initLayoutBehavior(root);
}

function renderNavSection(section, activePath, role) {
  const items = section.items
    .filter((item) => !item.superadminOnly || role === 'superadmin')
    .map((item) => {
      const isActive = item.path === activePath;
      if (!item.enabled) {
        return `
          <span class="admin-nav__link admin-nav__link--disabled" title="Coming soon">
            ${item.label} <span class="admin-nav__badge">Soon</span>
          </span>`;
      }
      return `
        <a href="${item.path}" class="admin-nav__link${isActive ? ' is-active' : ''}">
          ${item.label}
        </a>`;
    })
    .join('');

  if (!items) {
    return '';
  }

  return `
    <div class="admin-nav__section">
      <p class="admin-nav__heading">${section.heading}</p>
      ${items}
    </div>`;
}

function initLayoutBehavior(root) {
  const logoutBtn = qs('#admin-logout-btn', root);
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      logoutBtn.disabled = true;
      logoutBtn.textContent = 'Logging out…';
      try {
        await signOutUser();
        navigate('/admin/login', { replace: true });
      } catch (error) {
        console.error('[admin-layout] Sign out failed:', error);
        logoutBtn.disabled = false;
        logoutBtn.textContent = 'Log Out';
      }
    });
  }

  const sidebarToggle = qs('#admin-sidebar-toggle', root);
  const sidebar = qs('#admin-sidebar', root);
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      const isOpen = sidebarToggle.getAttribute('aria-expanded') === 'true';
      sidebarToggle.setAttribute('aria-expanded', String(!isOpen));
      sidebar.classList.toggle('is-open', !isOpen);
    });
  }
}
