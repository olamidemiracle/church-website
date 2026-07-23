/**
 * functions/paystack-shared.js
 * -----------------------------------------------------------------------
 * Shared logic between paystackWebhook.js (Paystack calling us) and
 * verifyDonation.js (our client calling us right after checkout). Both
 * paths write to the same `donations/{reference}` document — using the
 * Paystack transaction reference as the Firestore document ID makes this
 * naturally idempotent, so it doesn't matter which path arrives first,
 * or if Paystack retries the same webhook delivery multiple times.
 * -----------------------------------------------------------------------
 */

const crypto = require('crypto');
const admin = require('firebase-admin');

/** Verifies a Paystack webhook's `x-paystack-signature` header against the raw request body. */
function isValidPaystackSignature(rawBody, signatureHeader, secretKey) {
  if (!signatureHeader) {
    return false;
  }

  const expected = crypto.createHmac('sha512', secretKey).update(rawBody).digest('hex');

  const signatureBuffer = Buffer.from(signatureHeader, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');

  // Buffers of different lengths would throw inside timingSafeEqual, so
  // check length first rather than let that surface as a 500 error.
  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}

/** Upserts a donations/{reference} document from a Paystack transaction object (webhook payload's `data`, or a verify response's `data`). */
async function upsertDonationFromTransaction(transaction, source) {
  const donorName =
    transaction.metadata?.donorName ||
    (transaction.customer?.first_name
      ? `${transaction.customer.first_name} ${transaction.customer.last_name || ''}`.trim()
      : null);

  await admin
    .firestore()
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
          : admin.firestore.FieldValue.serverTimestamp(),
        source, // 'webhook' | 'client-verify' — useful for debugging which path recorded it
      },
      { merge: true }
    );
}

module.exports = { isValidPaystackSignature, upsertDonationFromTransaction };
