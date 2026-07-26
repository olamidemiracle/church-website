/**
 * services/storage.service.js
 * -----------------------------------------------------------------------
 * Thin wrapper over Cloudinary, used by admin CRUD modules to upload
 * images/audio/PDFs and get back a public URL to store on the Firestore
 * document. Replaces the original Firebase Storage-based implementation
 * (Firebase Storage now requires the Blaze billing plan for any usage at
 * all — see README.md's "Why Cloudinary, not Firebase Storage" note).
 *
 * Uploads happen directly from the browser to Cloudinary using an
 * UNSIGNED upload preset — no API secret ever touches the client, and no
 * server round-trip is needed for the common case. This keeps the
 * function signatures below (`uploadFile`, `deleteFile`,
 * `buildStoragePath`) identical to the old Firebase-backed version, so
 * every call site (admin/shared/crud-page.js, admin/gallery/gallery.js)
 * needed zero changes.
 *
 * Path conventions still match Section 6 of the project plan (e.g.
 * sermons/{id}/thumbnail.jpg) — Cloudinary supports "/" in a public_id to
 * organize assets into folders in its Media Library, the same way
 * Firebase Storage used real folder paths.
 * -----------------------------------------------------------------------
 */

import { getEnv } from '../utils/env.js';
import { callFunction } from './cloud-functions.service.js';

/**
 * Uploads a File/Blob to Cloudinary under the given path (used as its
 * public_id, so re-uploading to the same path replaces the existing
 * asset). Returns the resulting public HTTPS URL.
 */
export async function uploadFile(path, file) {
  const cloudName = getEnv('CLOUDINARY_CLOUD_NAME');
  const uploadPreset = getEnv('CLOUDINARY_UPLOAD_PRESET');

  if (!cloudName || !uploadPreset) {
    throw new Error(
      'Cloudinary is not configured — CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET must be set.'
    );
  }

  // Cloudinary infers the delivered file's extension itself, so a trailing
  // extension in `path` (e.g. "thumbnail.jpg") would otherwise be doubled
  // up in the final URL — strip it before using the path as a public_id.
  const publicId = path.replace(/\.[^/.]+$/, '');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('public_id', publicId);
  // 'auto' lets Cloudinary route images/audio/video/PDFs correctly without
  // the caller needing to know or declare the resource type up front.
  formData.append('resource_type', 'auto');

  let response;
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST',
      body: formData,
    });
  } catch (error) {
    console.error(`[storage] uploadFile(${path}) network error:`, error);
    throw error;
  }

  const result = await response.json();

  if (!response.ok) {
    console.error(`[storage] uploadFile(${path}) failed:`, result);
    throw new Error(result?.error?.message || 'Upload failed.');
  }

  return result.secure_url;
}

/**
 * Deletes a previously uploaded file by its path/public_id. Unsigned
 * uploads can't be deleted directly from the browser (deletion requires
 * Cloudinary's API secret, which must never reach the client) — this
 * calls the server route `/api/delete-media`, which performs the actual
 * signed deletion. Not currently called anywhere in the app (kept for
 * interface parity and future use, e.g. if a "replace this file" flow is
 * later taught to clean up the old one).
 */
export async function deleteFile(path) {
  const publicId = path.replace(/\.[^/.]+$/, '');
  try {
    await callFunction('deleteMedia', { publicId });
  } catch (error) {
    console.error(`[storage] deleteFile(${path}) failed:`, error);
    throw error;
  }
}

/**
 * Builds the conventional path for a given collection/document/field,
 * matching Section 6 of the project plan (e.g. sermons/{id}/thumbnail.jpg).
 * Keeps a consistent, predictable folder structure across every CRUD module.
 */
export function buildStoragePath(collectionName, docId, fileName) {
  return `${collectionName}/${docId}/${fileName}`;
}
