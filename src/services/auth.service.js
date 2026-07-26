/**
 * services/auth.service.js
 * -----------------------------------------------------------------------
 * Thin wrapper over Firebase Authentication, used only by the admin
 * dashboard (the public site never requires sign-in). Centralizes:
 *  - sign in / sign out / password reset
 *  - reading the custom claim `role` ("superadmin" | "editor") off the
 *    user's ID token, which firestore.rules and storage.rules also key
 *    off of
 *  - a single onAuthChange subscription used by the router's route guard
 *
 * Custom claims are set server-side only (see api/set-user-role.js) —
 * this file never attempts to set them from the client.
 * -----------------------------------------------------------------------
 */

import { auth } from './firebase.js';

const FIREBASE_SDK_VERSION = '10.12.5';

const {
  signInWithEmailAndPassword,
  signOut: firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} = await import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-auth.js`);

/** Signs in with email + password. Throws on failure (caller shows the message). */
export async function signIn(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

/** Signs the current admin out. */
export async function signOutUser() {
  await firebaseSignOut(auth);
}

/** Sends a password reset email. Throws on failure. */
export async function requestPasswordReset(email) {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Reads the current user's role from their ID token's custom claims.
 * Pass `forceRefresh: true` right after a role change (e.g. a superadmin
 * just promoted this user) since the cached token won't reflect it yet.
 * Returns null if signed out, or a role string ("superadmin" | "editor")
 * if signed in but the claim is somehow missing.
 */
export async function getCurrentUserRole(forceRefresh = false) {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }
  const tokenResult = await user.getIdTokenResult(forceRefresh);
  return tokenResult.claims.role || null;
}

/**
 * Subscribes to auth state changes. Calls `callback(user, role)` once
 * immediately with the current state, then again on every change.
 * Returns the unsubscribe function.
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, async (user) => {
    const role = user ? await getCurrentUserRole() : null;
    callback(user, role);
  });
}

export { auth };
