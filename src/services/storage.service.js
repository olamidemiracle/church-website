/**
 * services/storage.service.js
 * -----------------------------------------------------------------------
 * Thin wrapper over Firebase Storage, used by admin CRUD modules to
 * upload images/audio/PDFs and get back a public download URL to store
 * on the Firestore document. Path conventions match Section 6 of the
 * project plan (e.g. /sermons/{id}/thumbnail.jpg).
 * -----------------------------------------------------------------------
 */

import { storage } from './firebase.js';

const { ref, uploadBytes, getDownloadURL, deleteObject } =
  await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js');

/**
 * Uploads a File/Blob to the given Storage path and returns its public
 * download URL. Overwrites whatever was previously at that exact path.
 */
export async function uploadFile(path, file) {
  try {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error(`[storage] uploadFile(${path}) failed:`, error);
    throw error;
  }
}

/** Deletes a file at the given Storage path. Silently ignores "not found" errors. */
export async function deleteFile(path) {
  try {
    await deleteObject(ref(storage, path));
  } catch (error) {
    if (error?.code === 'storage/object-not-found') {
      return; // already gone — not an error worth surfacing
    }
    console.error(`[storage] deleteFile(${path}) failed:`, error);
    throw error;
  }
}

/**
 * Builds the conventional Storage path for a given collection/document/
 * field, matching Section 6 of the project plan (e.g. sermons/{id}/thumbnail.jpg).
 * Keeps a consistent, predictable folder structure across every CRUD module.
 */
export function buildStoragePath(collectionName, docId, fileName) {
  return `${collectionName}/${docId}/${fileName}`;
}
