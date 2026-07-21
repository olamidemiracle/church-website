/**
 * api/env.js
 * -----------------------------------------------------------------------
 * Vercel Serverless Function — bridges Vercel's environment variables
 * into the browser as `window.__ENV__`, since this project has no build
 * step (no bundler) to inject them at compile time.
 *
 * Every public page loads this BEFORE its own page.js:
 *   <script src="/api/env.js"></script>
 *
 * Only variables that are safe for a browser to see are exposed here —
 * these are all designed to be public (Firebase web config is not a
 * secret; it's scoped by Firestore/Storage Security Rules, not by
 * hiding the config). NEVER add PAYSTACK_SECRET_KEY or any other
 * server-only secret to this list.
 * -----------------------------------------------------------------------
 */

const PUBLIC_ENV_KEYS = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
  'FIREBASE_MEASUREMENT_ID',
  'APP_CHECK_RECAPTCHA_SITE_KEY',
  'EMAILJS_SERVICE_ID',
  'EMAILJS_TEMPLATE_ID',
  'EMAILJS_PUBLIC_KEY',
  'PAYSTACK_PUBLIC_KEY',
  'APP_ENV',
];

export default function handler(req, res) {
  const publicEnv = {};
  PUBLIC_ENV_KEYS.forEach((key) => {
    publicEnv[key] = process.env[key] || '';
  });

  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  // Not user-specific and safe to cache briefly at the edge; env vars only
  // change on redeploy.
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.status(200).send(`window.__ENV__ = ${JSON.stringify(publicEnv)};`);
}
