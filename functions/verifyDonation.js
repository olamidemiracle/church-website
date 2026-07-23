/**
 * functions/verifyDonation.js
 * -----------------------------------------------------------------------
 * Callable Cloud Function invoked by the browser immediately after the
 * Paystack checkout popup reports success (see pages/give/give.js). This
 * exists purely for fast, definitive in-browser feedback ("thank you,
 * your gift of ₦X was received") — the donor's browser reporting success
 * is never trusted on its own; this function re-verifies the transaction
 * directly with Paystack's API using the secret key before recording
 * anything. The webhook (paystackWebhook.js) remains the durable,
 * always-correct record — this just tries to beat it to the punch for
 * a better user experience, writing to the same document either way.
 * -----------------------------------------------------------------------
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const { upsertDonationFromTransaction } = require('./paystack-shared');

const paystackSecretKey = defineSecret('PAYSTACK_SECRET_KEY');

exports.verifyDonation = onCall({ secrets: [paystackSecretKey] }, async (request) => {
  const { reference } = request.data || {};

  if (!reference || typeof reference !== 'string') {
    throw new HttpsError('invalid-argument', 'A transaction reference is required.');
  }

  const secret = paystackSecretKey.value();

  let result;
  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${secret}` },
      }
    );
    result = await response.json();
  } catch (error) {
    logger.error('[verifyDonation] Failed to reach Paystack:', error);
    throw new HttpsError(
      'unavailable',
      "Couldn't reach the payment provider to verify this transaction."
    );
  }

  if (!result?.status || result.data?.status !== 'success') {
    throw new HttpsError(
      'failed-precondition',
      'This transaction could not be verified as successful.'
    );
  }

  await upsertDonationFromTransaction(result.data, 'client-verify');

  return {
    success: true,
    amount: result.data.amount / 100,
    currency: result.data.currency,
  };
});
