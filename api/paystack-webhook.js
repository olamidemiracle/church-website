/**
 * api/paystack-webhook.js
 * -----------------------------------------------------------------------
 * Vercel Serverless Function that Paystack calls directly whenever a
 * transaction event happens. This is the authoritative, durable path for
 * recording donations - it doesn't depend on the donor's browser staying
 * open or api/verify-donation.js succeeding (that one exists purely for
 * fast in-browser feedback and writes to the exact same document, so
 * there's no duplication either way).
 *
 * SETUP: after deploying, your webhook URL is:
 *   https://your-domain/api/paystack-webhook
 * Paste that into Paystack Dashboard, Settings, API Keys and Webhooks,
 * Webhook URL (see SETUP_GUIDE.md Part E).
 *
 * PAYSTACK_SECRET_KEY is a normal Vercel environment variable here, never
 * exposed to the browser via api/env.js's allow-list.
 *
 * Body parsing is disabled (see `config` below) because verifying
 * Paystack's signature requires the exact raw request bytes, not a
 * re-serialized JSON object.
 * -----------------------------------------------------------------------
 */

import { isValidPaystackSignature, upsertDonationFromTransaction } from './_lib/paystack-shared.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const rawBody = await readRawBody(req);
    const signature = req.headers['x-paystack-signature'];
    const secret = process.env.PAYSTACK_SECRET_KEY;

    if (!secret || !isValidPaystackSignature(rawBody, signature, secret)) {
      console.error('[paystack-webhook] Invalid or missing signature - rejecting request.');
      res.status(401).send('Invalid signature');
      return;
    }

    const event = JSON.parse(rawBody.toString('utf8'));

    if (event.event === 'charge.success') {
      await upsertDonationFromTransaction(event.data, 'webhook');
      // eslint-disable-next-line no-console
      console.log(`[paystack-webhook] Recorded donation for reference ${event.data.reference}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`[paystack-webhook] Ignoring unhandled event type: ${event.event}`);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('[paystack-webhook] Error handling webhook:', error);
    res.status(500).send('Internal error');
  }
}
