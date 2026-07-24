/**
 * scripts/migrate-staging-to-prod.cjs
 * -----------------------------------------------------------------------
 * OPTIONAL, ADVANCED TOOL — most churches should skip this entirely and
 * just enter their real content directly into production through the
 * admin dashboard (see ADMIN_USER_GUIDE.md). Staging is meant for testing,
 * not real content authoring, so re-entering final content by hand in
 * production is usually the simpler and safer choice.
 *
 * This script exists for the specific case where you built out real
 * content (ministries, leadership, sermons, etc.) in staging while
 * testing, and genuinely want to copy it over rather than retype it.
 *
 * It ONLY copies "content" collections — never user-submitted data
 * (prayerRequests, contactMessages, membershipApplications,
 * visitorSubmissions, testimonies, donations, activityLogs, errorLogs,
 * users) — copying real people's private submissions from a test
 * environment into production would be inappropriate regardless.
 *
 * SAFETY: defaults to a DRY RUN that only prints what it would copy.
 * Nothing is written to production unless you pass --confirm.
 *
 * USAGE:
 *   node scripts/migrate-staging-to-prod.cjs \
 *     --staging-key /path/to/staging-service-account.json \
 *     --prod-key /path/to/prod-service-account.json
 *
 *   (add --confirm at the end once the dry-run output looks correct)
 *
 * This will OVERWRITE any existing documents in production that share
 * the same collection + document ID as one being copied from staging —
 * review the dry-run output carefully before adding --confirm.
 * -----------------------------------------------------------------------
 */

const path = require('path');
const admin = require('firebase-admin');

const CONTENT_COLLECTIONS = [
  'leadership',
  'ministries',
  'sermons',
  'events',
  'galleryAlbums',
  'news',
  'settings',
];

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag) => {
    const index = args.indexOf(flag);
    return index === -1 ? null : args[index + 1];
  };

  return {
    stagingKeyPath: get('--staging-key'),
    prodKeyPath: get('--prod-key'),
    confirm: args.includes('--confirm'),
  };
}

async function copyCollection(sourceDb, destDb, collectionName, confirm) {
  const snapshot = await sourceDb.collection(collectionName).get();

  if (snapshot.empty) {
    console.log(`  ${collectionName}: nothing to copy (empty in staging).`);
    return 0;
  }

  console.log(`  ${collectionName}: ${snapshot.size} document(s) found in staging.`);

  if (!confirm) {
    snapshot.forEach((doc) => console.log(`    - would copy: ${collectionName}/${doc.id}`));
    return snapshot.size;
  }

  const batch = destDb.batch();
  snapshot.forEach((doc) => {
    batch.set(destDb.collection(collectionName).doc(doc.id), doc.data());
  });
  await batch.commit();
  console.log(`    ✅ copied ${snapshot.size} document(s) to production.`);

  // galleryAlbums has a nested `images` subcollection — copy those too.
  if (collectionName === 'galleryAlbums') {
    for (const albumDoc of snapshot.docs) {
      // eslint-disable-next-line no-await-in-loop
      const imagesSnap = await sourceDb
        .collection('galleryAlbums')
        .doc(albumDoc.id)
        .collection('images')
        .get();
      if (imagesSnap.empty) continue;
      const imagesBatch = destDb.batch();
      imagesSnap.forEach((imgDoc) => {
        imagesBatch.set(
          destDb.collection('galleryAlbums').doc(albumDoc.id).collection('images').doc(imgDoc.id),
          imgDoc.data()
        );
      });
      // eslint-disable-next-line no-await-in-loop
      await imagesBatch.commit();
      console.log(`    ✅ copied ${imagesSnap.size} photo(s) for album ${albumDoc.id}.`);
    }
  }

  return snapshot.size;
}

async function main() {
  const { stagingKeyPath, prodKeyPath, confirm } = parseArgs();

  if (!stagingKeyPath || !prodKeyPath) {
    console.error(
      'Usage: node scripts/migrate-staging-to-prod.cjs --staging-key <path> --prod-key <path> [--confirm]'
    );
    process.exit(1);
  }

  const stagingApp = admin.initializeApp(
    { credential: admin.credential.cert(require(path.resolve(stagingKeyPath))) },
    'staging'
  );
  const prodApp = admin.initializeApp(
    { credential: admin.credential.cert(require(path.resolve(prodKeyPath))) },
    'production'
  );

  const stagingDb = stagingApp.firestore();
  const prodDb = prodApp.firestore();

  console.log(
    confirm ? '🚨 LIVE RUN — writing to production.' : '🔎 DRY RUN — nothing will be written.'
  );
  console.log('Content collections only. User-submitted data is never touched.\n');

  let total = 0;
  for (const collectionName of CONTENT_COLLECTIONS) {
    // eslint-disable-next-line no-await-in-loop
    total += await copyCollection(stagingDb, prodDb, collectionName, confirm);
  }

  console.log(`\nDone. ${total} document(s) ${confirm ? 'copied' : 'would be copied'}.`);
  if (!confirm) {
    console.log('Re-run with --confirm added to actually write to production.');
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
});
