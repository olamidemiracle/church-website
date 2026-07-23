/**
 * services/cloud-functions.service.js
 * -----------------------------------------------------------------------
 * Thin wrapper for invoking Firebase callable Cloud Functions from the
 * browser (currently: verifyDonation, called by the Give page right
 * after checkout — see functions/verifyDonation.js). Reusable by any
 * future page that needs to call a callable function (e.g. a future
 * Manage Users page calling setUserRole).
 * -----------------------------------------------------------------------
 */

import { app } from './firebase.js';

const FIREBASE_SDK_VERSION = '10.12.5';

const { getFunctions, httpsCallable } = await import(
  `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-functions.js`
);

const functionsInstance = getFunctions(app);

/** Calls a callable Cloud Function by name and returns its response data. Throws on failure (caller shows the message). */
export async function callFunction(name, data) {
  const callable = httpsCallable(functionsInstance, name);
  const result = await callable(data);
  return result.data;
}
