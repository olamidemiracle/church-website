/**
 * api/scheduled-backup.js
 * -----------------------------------------------------------------------
 * Triggered automatically once a day by Vercel Cron (see the `crons`
 * entry in vercel.json) and backs up every content collection to a JSON
 * file stored in Cloudinary.
 *
 * This intentionally does NOT use Firestore's bulk "Export" API (what
 * the original Firebase Cloud Functions version used) - that API
 * requires a billing-enabled Google Cloud project regardless of which
 * server triggers it. Plain Firestore document reads, used here, stay
 * within Firestore's free Spark-plan quota. The tradeoff: this is a
 * logical JSON snapshot, not Firestore's native binary export format, so
 * restoring from it means writing a small script to read the JSON back
 * in - not a one-command `firestore:import` - but it costs nothing and
 * needs no special IAM permissions.
 *
 * Only backs up "content" collections (matching
 * scripts/migrate-staging-to-prod.cjs's scope) - not user-submitted
 * data. Add a collection name below if you want it included.
 *
 * SECURITY: Vercel automatically attaches an
 * `Authorization: Bearer <CRON_SECRET>` header to cron-triggered
 * requests when a CRON_SECRET environment variable is set - this route
 * checks for that so random requests to this public URL can't trigger a
 * backup or waste your Cloudinary quota.
 * -----------------------------------------------------------------------
 */

import crypto from 'crypto';
import { getDb } from './_lib/firebase-admin.js';

const CONTENT_COLLECTIONS = [
  'leadership',
  'ministries',
  'sermons',
  'events',
  'galleryAlbums',
  'news',
  'settings',
];

/** Converts Firestore Timestamp values to ISO strings so the result is valid, restorable JSON. */
function serializeValue(value) {
  if (value && typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }
  return value;
}

function serializeDoc(data) {
  const out = {};
  Object.entries(data).forEach(([key, value]) => {
    out[key] = serializeValue(value);
  });
  return out;
}

async function backupCollection(db, collectionName) {
  const snapshot = await db.collection(collectionName).get();
  const docs = {};

  for (const doc of snapshot.docs) {
    docs[doc.id] = serializeDoc(doc.data());

    if (collectionName === 'galleryAlbums') {
      // eslint-disable-next-line no-await-in-loop
      const imagesSnap = await db
        .collection('galleryAlbums')
        .doc(doc.id)
        .collection('images')
        .get();
      docs[doc.id]._images = imagesSnap.docs.map((img) => ({
        id: img.id,
        ...serializeDoc(img.data()),
      }));
    }
  }

  return docs;
}

function buildSignature(params, apiSecret) {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return crypto
    .createHash('sha1')
    .update(toSign + apiSecret)
    .digest('hex');
}

async function uploadBackupToCloudinary(jsonString, timestamp) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary is not fully configured for backups.');
  }

  const publicId = `firestore-backups/backup-${timestamp}`;
  const signParams = { public_id: publicId, timestamp: Math.floor(Date.now() / 1000) };
  const signature = buildSignature(signParams, apiSecret);

  const formData = new FormData();
  const blob = new Blob([jsonString], { type: 'application/json' });
  formData.append('file', blob, `${publicId}.json`);
  formData.append('public_id', publicId);
  formData.append('timestamp', String(signParams.timestamp));
  formData.append('api_key', apiKey);
  formData.append('signature', signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`, {
    method: 'POST',
    body: formData,
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result?.error?.message || 'Backup upload failed.');
  }

  return result.secure_url;
}

export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization || '';

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const db = getDb();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backup = { timestamp, collections: {} };

    for (const collectionName of CONTENT_COLLECTIONS) {
      // eslint-disable-next-line no-await-in-loop
      backup.collections[collectionName] = await backupCollection(db, collectionName);
    }

    const url = await uploadBackupToCloudinary(JSON.stringify(backup, null, 2), timestamp);

    // eslint-disable-next-line no-console
    console.log(`[scheduled-backup] Backup complete: ${url}`);
    res.status(200).json({ success: true, url, timestamp });
  } catch (error) {
    console.error('[scheduled-backup] Backup failed:', error);
    res.status(500).json({ error: 'Backup failed.' });
  }
}
