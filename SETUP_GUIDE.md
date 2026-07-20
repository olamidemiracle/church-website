# Setup Guide — Steps That Require Your Personal Accounts

Everything else in Phase 1 is already built (see the zip). These steps need your own
GitHub, Firebase, Vercel, EmailJS, and Paystack accounts, so I'll walk you through each one.

---

## A. Push the repo to GitHub

1. Unzip `church-website-phase1.zip` and `cd church-website` — it's already a git repo
   with `main` and `develop` branches and one commit.
2. Go to https://github.com/new and create a new **empty** repository (don't initialize
   with a README/gitignore — you already have those).
3. In your terminal:
   ```
   git remote add origin https://github.com/YOUR_USERNAME/church-website.git
   git push -u origin main
   git push -u origin develop
   ```
4. On GitHub: **Settings → Branches → Add branch ruleset** for `main` — require a pull
   request before merging, and (optional) require status checks to pass.

---

## B. Create the Firebase projects

Repeat this twice — once for `church-website-staging`, once for `church-website-prod`.

1. Go to https://console.firebase.google.com → **Add project**.
2. Name it (e.g. `church-website-staging`), disable Google Analytics for staging if you
   don't need it (fine to enable for prod).
3. Once created, click the **web icon (`</>`)** to register a web app — name it e.g.
   "Church Website Web". Skip Firebase Hosting setup (you're using Vercel).
4. Firebase shows you a `firebaseConfig` object — copy each value into your `.env`
   (staging values → a `.env.staging`-style file locally / staging env vars in Vercel;
   prod values → prod env vars in Vercel). The keys map directly to `.env.example`:
   - `apiKey` → `FIREBASE_API_KEY`
   - `authDomain` → `FIREBASE_AUTH_DOMAIN`
   - `projectId` → `FIREBASE_PROJECT_ID`
   - `storageBucket` → `FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `FIREBASE_APP_ID`
   - `measurementId` → `FIREBASE_MEASUREMENT_ID`
5. Enable **Authentication**: left sidebar → Build → Authentication → Get Started →
   enable the **Email/Password** provider.
6. Enable **Firestore**: Build → Firestore Database → Create database → start in
   **production mode** (not test mode) → choose a region close to your congregation.
7. Enable **Storage**: Build → Storage → Get Started → production mode, same region.
8. Enable **App Check**: Build → App Check → Apps → register your web app → choose
   **reCAPTCHA v3** → follow the prompt to create a reCAPTCHA v3 site key at
   https://www.google.com/recaptcha/admin (register your future domain, and
   `localhost` for local dev) → paste that site key into `APP_CHECK_RECAPTCHA_SITE_KEY`.
9. Deploy the rules already written for you: install the Firebase CLI if you haven't
   (`npm install -g firebase-tools`), then:
   ```
   firebase login
   firebase use --add        # pick the staging project, alias it "staging"
   firebase use --add        # pick the prod project, alias it "production"
   firebase deploy --only firestore:rules,storage:rules
   ```
   Update `.firebaserc` in the repo with your real project IDs first (replace the
   `REPLACE_WITH_...` placeholders).
10. Manually create the first settings document: Firestore → Start collection →
    collection ID `settings` → document ID `general` → add fields like `churchName`,
    `address`, `phone`, `email`, `serviceTimes` (array), `socialLinks` (map) — whatever
    matches the schema in the project plan. Do this in **both** staging and prod.

---

## C. Link the project to Vercel

1. Go to https://vercel.com → **Add New → Project** → import the GitHub repo you just pushed.
2. Vercel will detect it as a static project (no framework) — that's fine for now.
3. Under **Settings → Environment Variables**, add every key from `.env.example`:
   - Add them under **Production** using your `church-website-prod` Firebase values.
   - Add them again under **Preview** (and optionally **Development**) using your
     `church-website-staging` Firebase values — this way every PR preview deploy talks
     to staging data, never production.
4. Under **Settings → Git**, confirm `main` is the Production branch. Every other
   branch/PR automatically gets a preview deployment pointed at staging env vars.
5. (Optional, do this once you own a domain) **Settings → Domains** → add your domain
   and follow Vercel's DNS instructions (usually an `A` record or `CNAME`).

---

## D. EmailJS (form notifications)

1. Create an account at https://www.emailjs.com.
2. **Email Services** → connect the inbox you want notifications sent to (Gmail,
   Outlook, or SMTP).
3. **Email Templates** → create a template for form submissions (e.g. variables like
   `{{form_name}}`, `{{submitter_name}}`, `{{message}}`).
4. **Account → General** → copy your **Public Key**.
5. Fill into your Vercel env vars (and local `.env`):
   - `EMAILJS_SERVICE_ID`
   - `EMAILJS_TEMPLATE_ID`
   - `EMAILJS_PUBLIC_KEY`

---

## E. Paystack (Give / Donate)

1. Create an account at https://dashboard.paystack.com/#/signup and complete business
   verification (required before you can accept live payments — test mode works
   immediately for development).
2. **Settings → API Keys & Webhooks** → copy the **Public Key** (safe for client-side)
   and **Secret Key** (server-side only — this goes in a Cloud Function environment
   variable later, never in `src/` or any file that reaches the browser).
3. Fill into env vars:
   - `PAYSTACK_PUBLIC_KEY`
   - `PAYSTACK_SECRET_KEY` (store this in Firebase Functions config / Vercel serverless
     env only — not in the public `.env` used by the front end)
4. Once we build the Cloud Function webhook handler (later phase), you'll add the
   webhook URL Paystack gives you back into **Settings → API Keys & Webhooks → Webhook URL**.

---

## Checklist

- [ ] GitHub repo created, `main` + `develop` pushed, branch protection on `main`
- [ ] `church-website-staging` Firebase project created (Auth, Firestore, Storage, App Check enabled)
- [ ] `church-website-prod` Firebase project created (same services enabled)
- [ ] `.firebaserc` updated with real project IDs
- [ ] Firestore/Storage rules deployed to both projects
- [ ] `settings/general` document created in both projects
- [ ] Vercel project linked, env vars set for Production and Preview separately
- [ ] EmailJS account + service + template created
- [ ] Paystack account created, API keys retrieved

Once these are done, tell me and we'll move into **Phase 2 — Core Public Pages**.
