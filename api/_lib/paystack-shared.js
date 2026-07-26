/**
 * api/_lib/paystack-shared.js
 * -----------------------------------------------------------------------
 * Shared logic between api/paystack-webhook.js (Paystack calling us) and
 * api/verify-donation.js (our client calling us right after checkout).
 * Ported from the original functions/paystack-shared.js with no logic
 * changes — both paths still write to the same `donations/{reference}`
 * document, keyed by the Paystack transaction reference, which is what
 * makes this naturally idempotent regardless of which path arrives
 * first or whether Paystack retries a webhook delivery.
 * -----------------------------------------------------------------------
 */

import crypto from 'crypto';
import { getDb, getFieldValue } from './firebase-admin.js';

/** Verifies a Paystack webhook's `x-paystack-signature` header against the raw request body. */
export function isValidPaystackSignature(rawBody, signatureHeader, secretKey) {
  if (!signatureHeader) {
    return false;
  }

  const expected = crypto.createHmac('sha512', secretKey).update(rawBody).digest('hex');

  const signatureBuffer = Buffer.from(signatureHeader, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}

/** Upserts a donations/{reference} document from a Paystack transaction object. */
export async function upsertDonationFromTransaction(transaction, source) {
  const donorName =
    transaction.metadata?.donorName ||
    (transaction.customer?.first_name
      ? `${transaction.customer.first_name} ${transaction.customer.last_name || ''}`.trim()
      : null);

  await getDb()
    .collection('donations')
    .doc(String(transaction.reference))
    .set(
      {
        donorName: donorName || null,
        email: transaction.customer?.email || null,
        amount: transaction.amount / 100, // Paystack amounts are in the smallest currency unit (kobo for NGN)
        currency: transaction.currency || 'NGN',
        method: 'paystack',
        status: 'success',
        reference: transaction.reference,
        date: transaction.paid_at
          ? new Date(transaction.paid_at)
          : getFieldValue().serverTimestamp(),
        source, // 'webhook' | 'client-verify'
      },
      { merge: true }
    );
}
