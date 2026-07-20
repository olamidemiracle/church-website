# Church Website

Public church website + admin dashboard. Built with HTML5, CSS3, Vanilla JavaScript (ES6+), Firebase (Auth, Firestore, Storage), deployed on Vercel.

## Status

**Phase 1 — Foundation.** Repo scaffolding, design tokens, Firestore/Storage rules skeleton, and the Firebase service module are in place. Firebase project creation and Vercel linking are pending — see `SETUP_GUIDE.md` for the manual steps required (these need your personal accounts and can't be done for you).

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
firebase deploy --only firestore:rules,storage:rules
```
(after completing the Firebase CLI login step in `SETUP_GUIDE.md`).

## Next Steps

See `SETUP_GUIDE.md` for the manual, account-specific setup (Firebase projects, Vercel linking, GitHub remote) required before Phase 2 (core public pages) begins.
