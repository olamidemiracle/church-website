/**
 * services/cloud-functions.service.js
 * -----------------------------------------------------------------------
 * Thin wrapper for invoking the project's Vercel serverless functions
 * (under /api) from the browser — replaces the original Firebase
 * callable-function wrapper (Cloud Functions v2 requires the Blaze
 * billing plan; Vercel Functions don't). Keeps the same `callFunction(
 * name, data)` signature the old version had, so every call site
 * (pages/give/give.js, services/storage.service.js) needed zero changes.
 *
 * Automatically attaches the signed-in admin's Firebase ID token as a
 * Bearer token when one is available, so server routes that need to
 * verify who's calling (set-user-role, delete-media) can do so — routes
 * that don't need auth (verify-donation, called by anonymous donors)
 * simply ignore the header.
 * -----------------------------------------------------------------------
 */

import { auth } from './firebase.js';

/** Maps a logical function name to its Vercel API route. */
const FUNCTION_ROUTES = {
  verifyDonation: '/api/verify-donation',
  setUserRole: '/api/set-user-role',
  deleteMedia: '/api/delete-media',
};

/** Calls a named serverless function and returns its response data. Throws on failure (caller shows the message). */
export async function callFunction(name, data) {
  const route = FUNCTION_ROUTES[name];
  if (!route) {
    throw new Error(`Unknown function: ${name}`);
  }

  const headers = { 'Content-Type': 'application/json' };
  const currentUser = auth.currentUser;
  if (currentUser) {
    headers.Authorization = `Bearer ${await currentUser.getIdToken()}`;
  }

  const response = await fetch(route, {
    method: 'POST',
    headers,
    body: JSON.stringify(data || {}),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result?.error || 'Request failed.');
  }

  return result;
}
