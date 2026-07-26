/**
 * api/set-user-role.js
 * -----------------------------------------------------------------------
 * Vercel Serverless Function: lets an existing superadmin set another
 * user's `role` custom claim ("superadmin" | "editor"). Not called from
 * anywhere in the app yet (the Manage Users page isn't built) - kept in
 * place, migrated for consistency, and ready for whenever that page is
 * built. See scripts/bootstrap-admin.cjs for how the very first
 * superadmin is created (a different, one-time local process, unrelated
 * to this route).
 *
 * Requires the CALLER to already have a valid superadmin role claim,
 * verified server-side via the Authorization: Bearer <idToken> header
 * that services/cloud-functions.service.js attaches automatically.
 * -----------------------------------------------------------------------
 */

import {
  getAuthAdmin,
  getDb,
  getFieldValue,
  verifyIdTokenFromRequest,
} from './_lib/firebase-admin.js';

const ALLOWED_ROLES = ['superadmin', 'editor'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const callerToken = await verifyIdTokenFromRequest(req);
  if (!callerToken) {
    res.status(401).json({ error: 'You must be signed in to perform this action.' });
    return;
  }
  if (callerToken.role !== 'superadmin') {
    res.status(403).json({ error: 'Only a superadmin can change user roles.' });
    return;
  }

  const { targetUid, role } = req.body || {};

  if (!targetUid || typeof targetUid !== 'string') {
    res.status(400).json({ error: 'targetUid is required.' });
    return;
  }
  if (!ALLOWED_ROLES.includes(role)) {
    res.status(400).json({ error: `role must be one of: ${ALLOWED_ROLES.join(', ')}` });
    return;
  }
  if (targetUid === callerToken.uid && role !== 'superadmin') {
    res.status(412).json({ error: 'You cannot demote your own account.' });
    return;
  }

  try {
    const authAdmin = getAuthAdmin();
    await authAdmin.setCustomUserClaims(targetUid, { role });
    const targetUser = await authAdmin.getUser(targetUid);

    await getDb()
      .collection('users')
      .doc(targetUid)
      .set(
        {
          uid: targetUid,
          email: targetUser.email || null,
          role,
          updatedAt: getFieldValue().serverTimestamp(),
        },
        { merge: true }
      );

    await getDb()
      .collection('activityLogs')
      .add({
        adminId: callerToken.uid,
        adminEmail: callerToken.email || null,
        action: 'setUserRole',
        targetCollection: 'users',
        targetId: targetUid,
        details: { role },
        timestamp: getFieldValue().serverTimestamp(),
      });

    res.status(200).json({ success: true, uid: targetUid, role });
  } catch (error) {
    console.error('[set-user-role] Failed:', error);
    res.status(500).json({ error: 'Something went wrong setting the user role.' });
  }
}
