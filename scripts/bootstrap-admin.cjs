/**
 * scripts/bootstrap-admin.js
 * -----------------------------------------------------------------------
 * ONE-TIME SETUP SCRIPT — run this locally, once, to create your very
 * first superadmin account. After that, all future admin/editor accounts
 * should be created through the (future) Manage Users page, which calls
 * the setUserRole Cloud Function instead.
 *
 * Why this script exists: setUserRole requires the CALLER to already be
 * a superadmin (see functions/setUserRole.js) — so there's no way to
 * create the first one through the app itself. This script uses the
 * Firebase Admin SDK directly with a service account key, which is only
 * ever run on your own machine, never deployed.
 *
 * USAGE:
 *   1. In the Firebase Console: Project Settings → Service Accounts →
 *      "Generate new private key". Save the downloaded JSON file
 *      somewhere OUTSIDE this repo (e.g. your home folder) — never
 *      commit a service account key to git.
 *   2. Create the user first, either in the Firebase Console
 *      (Authentication → Add user) or by having them sign up once your
 *      login page is live.
 *   3. Run:
 *        node scripts/bootstrap-admin.cjs /path/to/serviceAccountKey.json admin@yourchurch.org
 *   4. The script sets that user's role to "superadmin" and mirrors it
 *      into the `users` Firestore collection, then exits.
 * -----------------------------------------------------------------------
 */

const admin = require('firebase-admin');

async function main() {
  const [serviceAccountPath, email] = process.argv.slice(2);

  if (!serviceAccountPath || !email) {
    console.error('Usage: node scripts/bootstrap-admin.cjs <path-to-service-account.json> <email>');
    process.exit(1);
  }

  const serviceAccount = require(require('path').resolve(serviceAccountPath));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  const user = await admin.auth().getUserByEmail(email);

  await admin.auth().setCustomUserClaims(user.uid, { role: 'superadmin' });

  await admin.firestore().collection('users').doc(user.uid).set(
    {
      uid: user.uid,
      email: user.email,
      role: 'superadmin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log(`✅ ${email} is now a superadmin.`);
  console.log('They may need to sign out and back in for the new permissions to take effect.');
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Failed to bootstrap admin:', error.message);
  process.exit(1);
});
