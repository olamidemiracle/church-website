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
import { renderLogin } from './login/login.js';
import { renderForgotPassword } from './login/forgot-password.js';
import { renderDashboard } from './dashboard/dashboard.js';

registerRoute('/admin', { render: renderDashboard, requireAuth: true });
registerRoute('/admin/login', { render: renderLogin, requireAuth: false });
registerRoute('/admin/forgot-password', { render: renderForgotPassword, requireAuth: false });
registerRoute('/admin/dashboard', { render: renderDashboard, requireAuth: true });

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
setGuard((route, authState) => {
  const isSignedIn = Boolean(authState.user);

  if (route.requireAuth && !isSignedIn) {
    return '/admin/login';
  }
  if (!route.requireAuth && isSignedIn && route.path !== '/admin/forgot-password') {
    return '/admin/dashboard';
  }
  return true;
});

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
