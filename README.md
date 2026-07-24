# Church Website

Public church website + admin dashboard. Built with HTML5, CSS3, Vanilla JavaScript (ES6+), Firebase (Auth, Firestore, Storage), deployed on Vercel.

## Status

**🎉 Phase 10 — Launch Prep. The project is complete.** All ten phases are built:
public site, admin dashboard (auth, CRUD modules, submission views, audit
logging), Paystack-based online giving, SEO/accessibility/performance polish, and
now launch preparation — backups, monitoring, an admin user guide, and a full
launch checklist.

**For day-to-day dashboard use**, see `ADMIN_USER_GUIDE.md`.
**For all technical setup, deployment, and launch steps**, see `SETUP_GUIDE.md`
(Part H is the final launch checklist).

## Launch Prep (Phase 10)

- **Backups**: `functions/scheduledFirestoreBackup` exports the entire Firestore
  database to Cloud Storage every night at 3:00 AM automatically, under
  `firestore-backups/` in your default Storage bucket. Requires one manual IAM
  permission grant — see `SETUP_GUIDE.md` Part H.7.
- **Monitoring**: Firebase Analytics now initializes automatically whenever
  `FIREBASE_MEASUREMENT_ID` is set (optional — the site works identically without
  it). Client-side runtime errors are both console-logged and persisted to a new
  `errorLogs` Firestore collection (admin-readable only) via
  `utils/error-logger.js`, so problems are visible without needing a separate
  monitoring service.
- **Admin User Guide**: `ADMIN_USER_GUIDE.md` — a complete, non-technical guide
  for church staff covering login, every content module, every submission review
  workflow, roles, and settings.
- **Staging → production migration**: `scripts/migrate-staging-to-prod.cjs` — an
  optional, safety-first tool (defaults to a dry run) for copying real content
  from staging into production, for churches that built out real content while
  testing rather than starting fresh in production.
- **DNS/domain, going live**: fully covered in `SETUP_GUIDE.md` Part H, including
  switching Paystack to Live mode, updating reCAPTCHA's allowed domains, and a
  final go-live checklist.

## Polish (Phase 9)

- **SEO**: `robots.txt` and `sitemap.xml` (update the placeholder
  domain in both once your real domain is connected — see Part C.6 and Part H.2),
  JSON-LD structured data (Schema.org `Church` on Home, `Event` on Event Detail,
  `NewsArticle` on News Detail).
- **Accessibility**: a skip-to-content link (visible on keyboard focus) on every
  public page, verified every page has the `#main-content` target it jumps to.
- **Favicon & theme color**: `favicon.svg` linked site-wide, plus a
  `theme-color` meta tag matching the design tokens' ink-blue primary.
- **Custom 404 page**: `404.html` at the repository root (not nested — this exact
  name/location is a Vercel convention that serves it automatically, with a
  correct HTTP 404 status, for any unmatched route).
- **⚠️ `favicon.svg`, `robots.txt`, and `sitemap.xml` live at the repository
  ROOT, not inside a `public/` folder.** This is deliberate, not an oversight:
  Vercel's zero-config static builder treats a `public/` directory as the site's
  Output Directory *if one exists* — meaning every route (including `/` itself
  and even the custom `404.html` above) would silently resolve relative to
  `public/` instead of the repo root, breaking every `vercel.json` rewrite with
  no error message at all. **Never create a `public/` folder in this project** —
  add any future static passthrough assets directly at the repository root
  instead.
- **Known follow-up**: `sitemap.xml` currently lists static routes only — dynamic
  detail pages (sermon/event/news `?slug=` URLs) aren't included, since they'd need
  a server-generated sitemap to stay accurate as content is added. Worth revisiting
  if per-item SEO indexing becomes a priority.

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
