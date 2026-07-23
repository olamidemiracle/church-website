# Church Website

Public church website + admin dashboard. Built with HTML5, CSS3, Vanilla JavaScript (ES6+), Firebase (Auth, Firestore, Storage), deployed on Vercel.

## Status

**Phase 5 — Admin Auth + Shell.** The public site (Phases 1-4) is fully built:
Home, About + subpages, Ministries, Sermons, Events, Gallery, News, Service Times,
Contact, Location, Legal pages, and every public form (Prayer Request, Membership,
Visit, Testimonies). The admin dashboard now has a working Login, Forgot Password,
route guard, sidebar/topbar shell, and Dashboard Home with live stats. Admin CRUD
modules (Manage Sermons, Manage Events, etc.) are Phase 6 — see `SETUP_GUIDE.md`
Part F for how to create your first admin login.

## Admin Dashboard Architecture

Unlike the public site (plain multi-page HTML), `/admin` is a small single-page app:

- `src/admin/index.html` is the one real HTML file; Vercel rewrites every
  `/admin/:path*` request to it (see `vercel.json`).
- `src/router/router.js` is a small History-API router: routes are registered with
  `requireAuth`/`requireRoles`, and a guard function redirects signed-out visitors to
  `/admin/login` and signed-in visitors away from the login page.
- `src/services/auth.service.js` wraps Firebase Auth (sign in/out, password reset,
  reading the `role` custom claim off the ID token).
- `src/layouts/admin-layout.js` renders the sidebar/topbar shell around every
  authenticated page's content.
- Custom claims (`role: "superadmin" | "editor"`) can only be set server-side — see
  `functions/setUserRole.js` (a callable Cloud Function, usable only by an existing
  superadmin) and `scripts/bootstrap-admin.cjs` (a one-time local script that creates
  the very first superadmin, since `setUserRole` needs an existing one to call it).

## Project Structure

```
src/
  pages/       — one folder per public route (multi-page HTML)
  admin/       — one folder per admin dashboard route (SPA-style)
  components/  — shared UI pieces (header, footer, cards, modals, etc.)
  layouts/      — public-layout.js, admin-layout.js
  services/     — firebase.js (single init point), auth/firestore/storage services
  models/       — JSDoc shape definitions for each Firestore document
  utils/        — validators, formatters, slugify, debounce, dom helpers
  router/       — lightweight router for the /admin SPA
  styles/       — global.css, variables.css (design tokens), reset.css, typography.css
  assets/       — local images/icons used before upload to Storage
functions/       — Firebase Cloud Functions (role assignment, donation webhook, email)
```

Full page/collection/folder inventory lives in the project plan document (`church-website-project-plan.md`).

## Environment Variables in the Browser

This project has no bundler/build step yet, so environment variables can't be
injected at compile time. Instead, `api/env.js` (a Vercel Serverless Function)
reads Vercel's environment variables at request time and returns a small script
that sets `window.__ENV__` — every public page loads this in its `<head>`
_before_ its own page script:

```html
<script src="/api/env.js"></script>
```

`src/utils/env.js`'s `getEnv()` reads from `window.__ENV__` (or `import.meta.env`,
if a bundler is introduced later). Only variables safe for the browser are
exposed this way — see the `PUBLIC_ENV_KEYS` allow-list inside `api/env.js`.
**`PAYSTACK_SECRET_KEY` must never be added to that list.**

For local development without Vercel's dev server, you can stub this by adding a
plain `<script>window.__ENV__ = { FIREBASE_API_KEY: '...', ... };</script>`
tag temporarily, or run `vercel dev` (which serves `/api/env.js` for real).

## Local Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Copy the environment template and fill in real values (see `SETUP_GUIDE.md` for where each value comes from):
   ```
   cp .env.example .env
   ```
3. Lint and format checks:
   ```
   npm run lint
   npm run format:check
   ```

## Branching Model

- `main` — production, protected, deploys to the prod Vercel project.
- `develop` — staging/integration branch, deploys to preview/staging.
- Feature branches off `develop`, merged via PR.

## Design Tokens

All color, type, spacing, breakpoint, radius, and shadow values are defined once in `src/styles/variables.css` and consumed by `src/styles/typography.css` and `src/styles/global.css`. Never hardcode a raw color or px value in page-level CSS — add or reuse a token instead.

## Security Rules

`firestore.rules` and `storage.rules` default-deny everything, then explicitly open:

- Public read on content collections (sermons, events, ministries, etc.)
- Public create-only on submission collections (prayer requests, membership applications, contact messages, etc.)
- Editor/superadmin-only write access elsewhere, enforced via Firebase Auth custom claims (`role`)

Deploy rules with:

```
firebase deploy --only firestore:rules,storage
```

(after completing the Firebase CLI login step in `SETUP_GUIDE.md`).

## Next Steps

See `SETUP_GUIDE.md` for the manual, account-specific setup (Firebase projects, Vercel linking, GitHub remote) required before Phase 2 (core public pages) begins.
