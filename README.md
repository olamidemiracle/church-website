# Church Website

Public church website + admin dashboard. Built with HTML5, CSS3, Vanilla
JavaScript (ES6+), Firebase (Auth + Firestore), Cloudinary (file storage),
Vercel (hosting + serverless functions).

## Status

**🎉 Phase 10 — Launch Prep. The project is complete.** All ten phases are
built: public site, admin dashboard (auth, CRUD modules, submission views,
audit logging), Paystack-based online giving, SEO/accessibility/performance
polish, and launch preparation — backups, monitoring, an admin user guide, and
a full launch checklist.

**For day-to-day dashboard use**, see `ADMIN_USER_GUIDE.md`.
**For all technical setup, deployment, and launch steps**, see
`SETUP_GUIDE.md` (Part H is the final launch checklist).

## Architecture note: Cloudinary + Vercel Functions, not Firebase Storage/Functions

This project originally used Firebase Storage and Firebase Cloud Functions.
Both were replaced:

- **Firebase Storage → Cloudinary.** Firebase Storage now requires the Blaze
  (pay-as-you-go) billing plan for any usage at all, even within its free
  tier. Cloudinary's free tier requires no billing information at all, and
  as a bonus, auto-optimizes uploaded images.
- **Firebase Cloud Functions → Vercel Serverless Functions.** Cloud Functions
  v2 also requires the Blaze plan. Since the site is already hosted on
  Vercel, moving server-side logic under `/api` needed no new account and no
  new billing requirement — Vercel's free Hobby plan covers it.

**Firestore and Firebase Authentication are unaffected** — both stay on
Firebase's free Spark plan; only file storage and backend logic moved.

|                   | Before                                  | Now                                      |
| ----------------- | --------------------------------------- | ---------------------------------------- |
| File storage      | Firebase Storage                        | **Cloudinary**                           |
| Server-side logic | Firebase Cloud Functions (`functions/`) | **Vercel Serverless Functions (`api/`)** |
| Database          | Firestore                               | _(unchanged)_                            |
| Admin login       | Firebase Authentication                 | _(unchanged)_                            |
| Hosting           | Vercel                                  | _(unchanged)_                            |

This means **the project no longer requires the Blaze plan at all** — every
piece of infrastructure it depends on (Firebase Spark, Vercel Hobby,
Cloudinary free tier) is billing-free.

## Launch Prep (Phase 10)

- **Backups**: `api/scheduled-backup.js`, triggered daily by a Vercel Cron
  job (see `vercel.json`'s `crons` entry), reads every content collection and
  uploads a JSON snapshot to Cloudinary under `firestore-backups/`. This
  intentionally uses plain Firestore reads rather than Firestore's bulk
  "Export" API — that API requires a billing-enabled Google Cloud project
  regardless of which server triggers it; plain reads stay on Firestore's
  free tier. The tradeoff is a logical JSON snapshot rather than Firestore's
  native binary export format — restoring means reading the JSON back in via
  a small script, not a one-command import, but it costs nothing and needs
  no special IAM permissions (unlike the original Cloud Functions version).
- **Monitoring**: Firebase Analytics initializes automatically whenever
  `FIREBASE_MEASUREMENT_ID` is set (optional — the site works identically
  without it). Client-side runtime errors are both console-logged and
  persisted to an `errorLogs` Firestore collection (admin-readable only) via
  `utils/error-logger.js`.
- **Admin User Guide**: `ADMIN_USER_GUIDE.md` — a complete, non-technical
  guide for church staff covering login, every content module, every
  submission review workflow, roles, and settings.
- **Staging → production migration**: `scripts/migrate-staging-to-prod.cjs` —
  an optional, safety-first tool (defaults to a dry run) for copying real
  content from staging into production.
- **DNS/domain, going live**: fully covered in `SETUP_GUIDE.md` Part H.

## Polish (Phase 9)

- **SEO**: `robots.txt` and `sitemap.xml` (update the placeholder domain in
  both once your real domain is connected — see Part C.6 and Part H.2),
  JSON-LD structured data (Schema.org `Church` on Home, `Event` on Event
  Detail, `NewsArticle` on News Detail).
- **Accessibility**: a skip-to-content link (visible on keyboard focus) on
  every public page.
- **Favicon & theme color**: `favicon.png` linked site-wide, plus a
  `theme-color` meta tag matching the design tokens' ink-blue primary.
- **Custom 404 page**: `404.html` at the repository root (not nested — this
  exact name/location is a Vercel convention that serves it automatically,
  with a correct HTTP 404 status, for any unmatched route).
- **⚠️ `favicon.png`, `robots.txt`, and `sitemap.xml` live at the repository
  ROOT, not inside a `public/` folder.** This is deliberate: Vercel's
  zero-config static builder treats a `public/` directory as the site's
  Output Directory _if one exists_ — meaning every route (including `/`
  itself and even `404.html`) would silently resolve relative to `public/`
  instead of the repo root, breaking every `vercel.json` rewrite with no
  error message at all. **Never create a `public/` folder in this project.**
- **Known follow-up**: `sitemap.xml` currently lists static routes only —
  dynamic detail pages (sermon/event/news `?slug=` URLs) aren't included.

## Admin Dashboard Architecture

Unlike the public site (plain multi-page HTML), `/admin` is a small
single-page app:

- `src/admin/index.html` is the one real HTML file; Vercel rewrites every
  `/admin/:path*` request to it (see `vercel.json`).
- `src/router/router.js` is a small History-API router: routes are
  registered with `requireAuth`/`requireRoles`, and a guard function
  redirects signed-out visitors to `/admin/login` and signed-in visitors
  away from the login page.
- `src/services/auth.service.js` wraps Firebase Auth (sign in/out, password
  reset, reading the `role` custom claim off the ID token).
- `src/layouts/admin-layout.js` renders the sidebar/topbar shell around
  every authenticated page's content.
- Custom claims (`role: "superadmin" | "editor"`) can only be set
  server-side — see `api/set-user-role.js` (a Vercel Function, usable only
  by an existing superadmin, verified via a Firebase ID token) and
  `scripts/bootstrap-admin.cjs` (a one-time local script that creates the
  very first superadmin, since `set-user-role` needs an existing one to call
  it).

## Server-Side Functions (`/api`)

Every route here is a plain Vercel Serverless Function (not Firebase Cloud
Functions) — they deploy automatically with the rest of the site, no
separate deploy step:

| Route                     | Purpose                                                         | Auth                                |
| ------------------------- | --------------------------------------------------------------- | ----------------------------------- |
| `api/env.js`              | Bridges public env vars to the browser                          | none (public data only)             |
| `api/verify-donation.js`  | Re-verifies a Paystack transaction before confirming a donation | none (anonymous donors)             |
| `api/paystack-webhook.js` | Authoritative donation record, called directly by Paystack      | Paystack signature (HMAC)           |
| `api/set-user-role.js`    | Sets a user's admin role custom claim                           | superadmin (Firebase ID token)      |
| `api/delete-media.js`     | Signed Cloudinary asset deletion                                | signed-in admin (Firebase ID token) |
| `api/scheduled-backup.js` | Daily Firestore → Cloudinary backup                             | Vercel Cron secret                  |

Routes that need Firestore/Auth Admin access share `api/_lib/firebase-admin.js`,
which initializes the Admin SDK from `FIREBASE_SERVICE_ACCOUNT_BASE64` (a
Vercel-only environment variable — see `.env.example`). Vercel functions
don't get Firebase's ambient credentials the way Cloud Functions did, so this
explicit service account is required.

## Project Structure

```
src/
  pages/       — one folder per public route (multi-page HTML)
  admin/       — one folder per admin dashboard route (SPA-style)
  components/  — shared UI pieces (header, footer, cards, modals, etc.)
  layouts/      — public-layout.js, admin-layout.js
  services/     — firebase.js (Auth + Firestore init), auth/firestore/storage/cloud-functions services
  models/       — JSDoc shape definitions for each Firestore document
  utils/        — validators, formatters, slugify, debounce, dom helpers
  router/       — lightweight router for the /admin SPA
  styles/       — global.css, variables.css (design tokens), reset.css, typography.css
  assets/       — local images/icons used before upload to Cloudinary
api/
  _lib/         — shared helpers (Firebase Admin SDK init, Paystack signature/upsert logic)
  *.js          — Vercel Serverless Functions (see table above)
```

Full page/collection/folder inventory lives in the project plan document
(`church-website-project-plan.md`).

## Environment Variables in the Browser

This project has no bundler/build step yet, so environment variables can't be
injected at compile time. Instead, `api/env.js` (a Vercel Serverless
Function) reads Vercel's environment variables at request time and returns a
small script that sets `window.__ENV__` — every public page loads this in
its `<head>` _before_ its own page script:

```html
<script src="/api/env.js"></script>
```

`src/utils/env.js`'s `getEnv()` reads from `window.__ENV__` (or
`import.meta.env`, if a bundler is introduced later). Only variables safe for
the browser are exposed this way — see the `PUBLIC_ENV_KEYS` allow-list
inside `api/env.js`. **`PAYSTACK_SECRET_KEY`, `CLOUDINARY_API_KEY`,
`CLOUDINARY_API_SECRET`, `FIREBASE_SERVICE_ACCOUNT_BASE64`, and `CRON_SECRET`
must never be added to that list** — see `.env.example` for the full picture
of which variables are public vs. server-only.

For local development without Vercel's dev server, you can stub this by
adding a plain `<script>window.__ENV__ = { FIREBASE_API_KEY: '...', ... };</script>`
tag temporarily, or run `vercel dev` (which serves `/api/env.js` for real).

## Local Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Copy the environment template and fill in real values (see
   `SETUP_GUIDE.md` for where each value comes from):
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

All color, type, spacing, breakpoint, radius, and shadow values are defined
once in `src/styles/variables.css` and consumed by `src/styles/typography.css`
and `src/styles/global.css`. Never hardcode a raw color or px value in
page-level CSS — add or reuse a token instead.

## Security Rules

`firestore.rules` default-denies everything, then explicitly opens:

- Public read on content collections (sermons, events, ministries, etc.)
- Public create-only on submission collections (prayer requests, membership
  applications, contact messages, etc.)
- Editor/superadmin-only write access elsewhere, enforced via Firebase Auth
  custom claims (`role`)

Deploy rules with:

```
firebase deploy --only firestore:rules,firestore:indexes
```

(after completing the Firebase CLI login step in `SETUP_GUIDE.md`). There is
no `storage.rules` — Cloudinary handles file access on its own side (unsigned
upload presets, configured in the Cloudinary dashboard — see
`SETUP_GUIDE.md`).

## Next Steps

See `SETUP_GUIDE.md` for the manual, account-specific setup (Firebase
projects, Cloudinary account, Vercel linking, GitHub remote) required before
development begins.
