/**
 * functions/paystackWebhook.js
 * -----------------------------------------------------------------------
 * HTTP Cloud Function that Paystack calls directly whenever a transaction
 * event happens. This is the authoritative, durable path for recording
 * donations — it doesn't depend on the donor's browser staying open or
 * the client-side verify call succeeding (see verifyDonation.js, which
 * exists purely for fast in-browser feedback and writes to the exact
 * same document, so there's no duplication either way).
 *
 * SETUP: after deploying, copy this function's URL from the `firebase
 * deploy` output and paste it into Paystack Dashboard → Settings → API
 * Keys & Webhooks → Webhook URL (see SETUP_GUIDE.md Part E).
 *
 * The PAYSTACK_SECRET_KEY used here is stored in Google Cloud Secret
 * Manager (via `firebase functions:secrets:set PAYSTACK_SECRET_KEY`) —
 * never in a plain .env file or in Vercel's environment variables, since
 * it must never reach the browser.
 * -----------------------------------------------------------------------
 */

const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const { isValidPaystackSignature, upsertDonationFromTransaction } = require('./paystack-shared');

const paystackSecretKey = defineSecret('PAYSTACK_SECRET_KEY');

exports.paystackWebhook = onRequest({ secrets: [paystackSecretKey] }, async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    const secret = paystackSecretKey.value();

    if (!isValidPaystackSignature(req.rawBody, signature, secret)) {
      logger.error('[paystackWebhook] Invalid or missing signature — rejecting request.');
      res.status(401).send('Invalid signature');
      return;
    }

    const event = req.body;

    if (event.event === 'charge.success') {
      await upsertDonationFromTransaction(event.data, 'webhook');
      logger.info(`[paystackWebhook] Recorded donation for reference ${event.data.reference}`);
    } else {
      logger.info(`[paystackWebhook] Ignoring unhandled event type: ${event.event}`);
    }

    // Paystack expects a fast 200 response regardless of which event type
    // was received — anything else causes Paystack to retry repeatedly.
    res.status(200).send('OK');
  } catch (error) {
    logger.error('[paystackWebhook] Error handling webhook:', error);
    res.status(500).send('Internal error');
  }
});
