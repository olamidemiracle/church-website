/**
 * router/router.js
 * -----------------------------------------------------------------------
 * A small, dependency-free History-API router used only by the admin
 * dashboard (the public site is plain multi-page HTML — see Section 11
 * of the project plan). Vercel rewrites every /admin/:path* request to
 * src/admin/index.html (see vercel.json), which loads this router.
 *
 * Usage (see src/admin/admin.js):
 *   import { registerRoute, setGuard, start } from '/src/router/router.js';
 *   registerRoute('/admin/login', { render: renderLogin });
 *   registerRoute('/admin/dashboard', { render: renderDashboard, requireAuth: true });
 *   setGuard((route, authState) => { ... return true | '/admin/login'; });
 *   start('#admin-root');
 * -----------------------------------------------------------------------
 */

const routes = [];
let notFoundRoute = null;
let guardFn = null;
let rootSelector = '#admin-root';
let currentAuthState = { user: null, role: null };

/** Registers a route. `path` must match exactly (no dynamic segments needed for the admin phase built so far). */
export function registerRoute(path, { render, requireAuth = false, requireRoles = null }) {
  routes.push({ path, render, requireAuth, requireRoles });
}

/** Registers the fallback route shown when no path matches. */
export function registerNotFound(render) {
  notFoundRoute = { render };
}

/**
 * Registers a guard function, called before every render:
 *   guardFn(route, authState) => true (allow) | a redirect path string (deny)
 */
export function setGuard(fn) {
  guardFn = fn;
}

/** Updates the router's cached view of the current auth state (called by admin.js's onAuthChange subscriber). */
export function setAuthState(user, role) {
  currentAuthState = { user, role };
}

function findRoute(path) {
  return routes.find((r) => r.path === path) || null;
}

async function renderRoute(path) {
  const root = document.querySelector(rootSelector);
  if (!root) {
    return;
  }

  const route = findRoute(path);

  if (!route) {
    if (notFoundRoute) {
      root.innerHTML = '';
      await notFoundRoute.render(root, currentAuthState);
    }
    return;
  }

  if (guardFn) {
    const result = guardFn(route, currentAuthState);
    if (result !== true) {
      navigate(result, { replace: true });
      return;
    }
  }

  root.innerHTML = '';
  await route.render(root, currentAuthState);
}

/** Navigates programmatically (pushState by default, or replaceState). */
export function navigate(path, { replace = false } = {}) {
  if (replace) {
    window.history.replaceState({}, '', path);
  } else {
    window.history.pushState({}, '', path);
  }
  renderRoute(path);
}

/** Re-renders the current path — used after auth state changes (e.g. login/logout). */
export function reRender() {
  renderRoute(window.location.pathname);
}

/** Starts the router: renders the current path, and wires up back/forward + internal link clicks. */
export function start(root = '#admin-root') {
  rootSelector = root;

  window.addEventListener('popstate', () => renderRoute(window.location.pathname));

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link) {
      return;
    }
    const href = link.getAttribute('href');
    if (!href || !href.startsWith('/admin')) {
      return;
    }
    if (link.hasAttribute('data-external') || link.target === '_blank') {
      return;
    }

    event.preventDefault();
    navigate(href);
  });

  renderRoute(window.location.pathname);
}
