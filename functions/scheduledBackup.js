/**
 * functions/scheduledBackup.js
 * -----------------------------------------------------------------------
 * Runs automatically every day at 3:00 AM (project's default timezone)
 * and exports the entire Firestore database to a Cloud Storage bucket —
 * a full, restorable snapshot, distinct from (and in addition to) the
 * project's own git history / Firestore's built-in durability.
 *
 * Uses the same default Storage bucket the rest of the app already uses
 * (read dynamically from the Admin SDK, not hardcoded — Firebase's
 * default bucket naming convention has changed over time, so hardcoding
 * a suffix like ".appspot.com" would silently break on newer projects),
 * under a dedicated `firestore-backups/` prefix so it never mixes with
 * user-uploaded content (sermon audio, gallery photos, etc.).
 *
 * REQUIRES a one-time manual setup step — see SETUP_GUIDE.md Part H —
 * granting the Cloud Functions service account the "Cloud Datastore
 * Import Export Admin" IAM role in Google Cloud Console. Without that
 * role, this function will run but fail with a permission error.
 * -----------------------------------------------------------------------
 */

const { onSchedule } = require('firebase-functions/v2/scheduler');
const logger = require('firebase-functions/logger');
const admin = require('firebase-admin');
const { v1 } = require('@google-cloud/firestore');

const firestoreAdminClient = new v1.FirestoreAdminClient();

exports.scheduledFirestoreBackup = onSchedule('every day 03:00', async () => {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
  const bucketName = admin.app().options.storageBucket;

  if (!bucketName) {
    logger.error('[scheduledFirestoreBackup] No default Storage bucket configured — aborting.');
    return;
  }

  const databaseName = firestoreAdminClient.databasePath(projectId, '(default)');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputUriPrefix = `gs://${bucketName}/firestore-backups/${timestamp}`;

  try {
    const [operation] = await firestoreAdminClient.exportDocuments({
      name: databaseName,
      outputUriPrefix,
      collectionIds: [], // empty = export every collection
    });
    logger.info(
      `[scheduledFirestoreBackup] Export started: ${operation.name} -> ${outputUriPrefix}`
    );
  } catch (error) {
    logger.error('[scheduledFirestoreBackup] Export failed:', error);
    throw error;
  }
});
