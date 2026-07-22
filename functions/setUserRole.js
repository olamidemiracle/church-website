/**
 * functions/setUserRole.js
 * -----------------------------------------------------------------------
 * Callable Cloud Function: lets an existing superadmin set another user's
 * `role` custom claim ("superadmin" | "editor"). Custom claims can only
 * be set with the Admin SDK (server-side) — this is the one place in the
 * whole project that's allowed to do it.
 *
 * This function assumes the CALLER already has a valid role claim (i.e.
 * is not the very first admin account — see scripts/bootstrap-admin.js
 * for how the first superadmin is created).
 *
 * Wired up from the future admin/users (Manage Users) page — not called
 * by anything yet in Phase 5, but included now since it's part of the
 * Authentication Plan (Section 7 of the project plan) and the Manage
 * Users page will need it as soon as it's built.
 * -----------------------------------------------------------------------
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

const ALLOWED_ROLES = ['superadmin', 'editor'];

exports.setUserRole = onCall(async (request) => {
  const callerToken = request.auth;

  if (!callerToken) {
    throw new HttpsError('unauthenticated', 'You must be signed in to perform this action.');
  }
  if (callerToken.token.role !== 'superadmin') {
    throw new HttpsError('permission-denied', 'Only a superadmin can change user roles.');
  }

  const { targetUid, role } = request.data || {};

  if (!targetUid || typeof targetUid !== 'string') {
    throw new HttpsError('invalid-argument', 'targetUid is required.');
  }
  if (!ALLOWED_ROLES.includes(role)) {
    throw new HttpsError('invalid-argument', `role must be one of: ${ALLOWED_ROLES.join(', ')}`);
  }

  // Prevent a superadmin from locking themselves out by accident.
  if (targetUid === callerToken.uid && role !== 'superadmin') {
    throw new HttpsError('failed-precondition', 'You cannot demote your own account.');
  }

  await admin.auth().setCustomUserClaims(targetUid, { role });

  const targetUser = await admin.auth().getUser(targetUid);

  // Mirror the role into Firestore so the Manage Users page can list
  // admins without needing the Admin SDK's listUsers() on every load.
  await admin
    .firestore()
    .collection('users')
    .doc(targetUid)
    .set(
      {
        uid: targetUid,
        email: targetUser.email || null,
        role,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

  await admin
    .firestore()
    .collection('activityLogs')
    .add({
      adminId: callerToken.uid,
      adminEmail: callerToken.token.email || null,
      action: 'setUserRole',
      targetCollection: 'users',
      targetId: targetUid,
      details: { role },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

  return { success: true, uid: targetUid, role };
});
