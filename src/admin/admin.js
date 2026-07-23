/**
 * admin/admin.js
 * -----------------------------------------------------------------------
 * Entry point for the admin SPA (loaded by admin/index.html). Registers
 * every known admin route with the router, wires the auth guard so
 * protected routes redirect to /admin/login when signed out (and
 * /admin/login itself redirects away when already signed in), and keeps
 * the router's cached auth state in sync via onAuthChange.
 * -----------------------------------------------------------------------
 */

import { onAuthChange } from '../services/auth.service.js';
import {
  registerRoute,
  registerNotFound,
  setGuard,
  setAuthState,
  reRender,
  start,
} from '../router/router.js';
import { installGlobalErrorLogging } from '../utils/error-logger.js';
import { renderLogin } from './login/login.js';
import { renderForgotPassword } from './login/forgot-password.js';
import { renderDashboard } from './dashboard/dashboard.js';
import { renderSermonsAdmin } from './sermons/sermons.js';
import { renderEventsAdmin } from './events/events.js';
import { renderMinistriesAdmin } from './ministries/ministries.js';
import { renderGalleryAdmin } from './gallery/gallery.js';
import { renderLeadershipAdmin } from './leadership/leadership.js';
import { renderNewsAdmin } from './news/news.js';
import { renderTestimoniesAdmin } from './testimonies/testimonies.js';
import { renderSettingsAdmin } from './settings/settings.js';
import { renderPrayerRequestsAdmin } from './prayer-requests/prayer-requests.js';
import { renderMembershipApplicationsAdmin } from './membership/membership-applications.js';
import { renderVisitorsAdmin } from './visitors/visitors.js';
import { renderMessagesAdmin } from './messages/messages.js';
import { renderDonationsAdmin } from './donations/donations.js';
import { renderActivityLogAdmin } from './activity-log/activity-log.js';

registerRoute('/admin', { render: renderDashboard, requireAuth: true });
registerRoute('/admin/login', { render: renderLogin, requireAuth: false });
registerRoute('/admin/forgot-password', { render: renderForgotPassword, requireAuth: false });
registerRoute('/admin/dashboard', { render: renderDashboard, requireAuth: true });
registerRoute('/admin/sermons', { render: renderSermonsAdmin, requireAuth: true });
registerRoute('/admin/events', { render: renderEventsAdmin, requireAuth: true });
registerRoute('/admin/ministries', { render: renderMinistriesAdmin, requireAuth: true });
registerRoute('/admin/gallery', { render: renderGalleryAdmin, requireAuth: true });
registerRoute('/admin/leadership', { render: renderLeadershipAdmin, requireAuth: true });
registerRoute('/admin/news', { render: renderNewsAdmin, requireAuth: true });
registerRoute('/admin/testimonies', { render: renderTestimoniesAdmin, requireAuth: true });
registerRoute('/admin/settings', {
  render: renderSettingsAdmin,
  requireAuth: true,
  requireRoles: ['superadmin'],
});
registerRoute('/admin/prayer-requests', { render: renderPrayerRequestsAdmin, requireAuth: true });
registerRoute('/admin/membership', {
  render: renderMembershipApplicationsAdmin,
  requireAuth: true,
});
registerRoute('/admin/visitors', { render: renderVisitorsAdmin, requireAuth: true });
registerRoute('/admin/messages', { render: renderMessagesAdmin, requireAuth: true });
registerRoute('/admin/donations', {
  render: renderDonationsAdmin,
  requireAuth: true,
  requireRoles: ['superadmin'],
});
registerRoute('/admin/activity-log', {
  render: renderActivityLogAdmin,
  requireAuth: true,
  requireRoles: ['superadmin'],
});

registerNotFound((root) => {
  root.innerHTML = `
    <div class="auth-page">
      <div class="auth-card" style="text-align: center;">
        <h1>Page Not Found</h1>
        <p class="auth-card__subtitle">This admin page doesn't exist yet.</p>
        <a href="/admin/dashboard" class="btn btn-primary">Back to Dashboard</a>
      </div>
    </div>`;
});

// The guard runs before every render. Routes flagged requireAuth: true
// redirect to /admin/login when signed out; the login/forgot-password
// routes redirect away to the dashboard when already signed in, so a
// logged-in admin can't land back on the login form via browser history.
// Routes flagged requireRoles additionally check the signed-in user's
// custom claim role (Website Settings is superadmin-only) — this is a
// UX convenience only, not the real security boundary, which is
// firestore.rules (a non-superadmin's write would be rejected there
// regardless of what this guard does).
setGuard((route, authState) => {
  const isSignedIn = Boolean(authState.user);

  if (route.requireAuth && !isSignedIn) {
    return '/admin/login';
  }
  if (!route.requireAuth && isSignedIn && route.path !== '/admin/forgot-password') {
    return '/admin/dashboard';
  }
  if (route.requireRoles && !route.requireRoles.includes(authState.role)) {
    return '/admin/dashboard';
  }
  return true;
});

installGlobalErrorLogging();

let hasStartedRouter = false;

onAuthChange((user, role) => {
  setAuthState(user, role);

  if (!hasStartedRouter) {
    hasStartedRouter = true;
    start('#admin-root');
  } else {
    // Auth state changed after the router already started (login/logout
    // while the SPA is open) — re-render so the guard re-evaluates.
    reRender();
  }
});
