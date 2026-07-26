/**
 * api/_lib/firebase-admin.js
 * -----------------------------------------------------------------------
 * Shared Firebase Admin SDK initializer for every Vercel serverless
 * function under /api that needs to read/write Firestore or verify/
 * manage Firebase Auth users. Unlike Firebase Cloud Functions (which get
 * ambient credentials for free), a Vercel function needs an explicit
 * service account — provided via the FIREBASE_SERVICE_ACCOUNT_BASE64
 * environment variable (the same service account JSON used by
 * scripts/bootstrap-admin.cjs, base64-encoded so it survives being
 * pasted into a single-line env var value — see SETUP_GUIDE.md).
 *
 * The module-level `app` variable persists across invocations on a warm
 * serverless instance, so this only actually initializes once per
 * instance rather than on every request.
 * -----------------------------------------------------------------------
 */

import pkg from 'firebase-admin';

let app;

function getFirebaseAdmin() {
  if (!app) {
    const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (!encoded) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 is not configured.');
    }

    const serviceAccount = JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'));

    app = pkg.apps.length
      ? pkg.app()
      : pkg.initializeApp({ credential: pkg.credential.cert(serviceAccount) });
  }
  return app;
}

export function getDb() {
  return getFirebaseAdmin().firestore();
}

export function getAuthAdmin() {
  return getFirebaseAdmin().auth();
}

export function getFieldValue() {
  return pkg.firestore.FieldValue;
}

/**
 * Verifies the Firebase ID token in a request's Authorization header
 * (`Bearer <token>`, attached automatically by
 * services/cloud-functions.service.js for signed-in users). Returns the
 * decoded token (with custom claims like `.role` accessible) or null if
 * missing/invalid — callers decide whether that's acceptable for the
 * specific route (verify-donation allows anonymous callers; set-user-role
 * and delete-media do not).
 */
export async function verifyIdTokenFromRequest(req) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer (.+)$/);
  if (!match) {
    return null;
  }

  try {
    return await getAuthAdmin().verifyIdToken(match[1]);
  } catch {
    return null;
  }
}
