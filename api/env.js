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
 * secret; it's scoped by Firestore Security Rules, not by hiding the
 * config, and CLOUDINARY_UPLOAD_PRESET is an unsigned preset meant for
 * client-side use). NEVER add PAYSTACK_SECRET_KEY, CLOUDINARY_API_KEY,
 * CLOUDINARY_API_SECRET, FIREBASE_SERVICE_ACCOUNT_BASE64, or CRON_SECRET
 * to this list — those stay server-only, read directly via
 * process.env inside /api routes.
 * -----------------------------------------------------------------------
 */

const PUBLIC_ENV_KEYS = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
  'FIREBASE_MEASUREMENT_ID',
  'APP_CHECK_RECAPTCHA_SITE_KEY',
  'EMAILJS_SERVICE_ID',
  'EMAILJS_TEMPLATE_ID',
  'EMAILJS_PUBLIC_KEY',
  'PAYSTACK_PUBLIC_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_UPLOAD_PRESET',
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
