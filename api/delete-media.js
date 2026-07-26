/**
 * api/delete-media.js
 * -----------------------------------------------------------------------
 * Vercel Serverless Function: deletes a Cloudinary asset by its
 * public_id. Deletion requires Cloudinary's API secret, which must never
 * reach the browser - unsigned uploads (used for the actual upload flow,
 * see services/storage.service.js) can't delete, only create/overwrite.
 *
 * Requires the caller to be a signed-in admin (any role) - verified
 * server-side via the Authorization: Bearer <idToken> header that
 * services/cloud-functions.service.js attaches automatically.
 *
 * Cloudinary requires knowing an asset's resource_type (image/video/raw)
 * to delete it, which the browser doesn't track after upload (uploads
 * use 'auto' detection - see storage.service.js). This tries each
 * resource_type in turn since a wrong guess just returns "not found"
 * rather than an error.
 * -----------------------------------------------------------------------
 */

import crypto from 'crypto';
import { verifyIdTokenFromRequest } from './_lib/firebase-admin.js';

const RESOURCE_TYPES = ['image', 'video', 'raw'];

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

  const { publicId } = req.body || {};
  if (!publicId || typeof publicId !== 'string') {
    res.status(400).json({ error: 'publicId is required.' });
    return;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.error('[delete-media] Cloudinary is not fully configured.');
    res.status(500).json({ error: 'Media deletion is not configured.' });
    return;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = buildSignature({ public_id: publicId, timestamp }, apiSecret);

  for (const resourceType of RESOURCE_TYPES) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            public_id: publicId,
            timestamp,
            api_key: apiKey,
            signature,
          }),
        }
      );
      // eslint-disable-next-line no-await-in-loop
      const result = await response.json();

      if (result.result === 'ok') {
        res.status(200).json({ success: true, resourceType });
        return;
      }
    } catch (error) {
      console.error(`[delete-media] Error trying resource_type=${resourceType}:`, error);
    }
  }

  res.status(404).json({ error: 'Asset not found under any resource type.' });
}
