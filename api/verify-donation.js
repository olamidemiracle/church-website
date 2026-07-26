/**
 * api/verify-donation.js
 * -----------------------------------------------------------------------
 * Vercel Serverless Function invoked by the browser right after the
 * Paystack checkout popup reports success (see pages/give/give.js via
 * services/cloud-functions.service.js). Exists purely for fast,
 * definitive in-browser feedback - the donor's browser reporting
 * success is never trusted alone; this re-verifies directly with
 * Paystack's API using the secret key before recording anything.
 * api/paystack-webhook.js remains the durable, always-correct record -
 * this just tries to beat it to the punch for a better user experience,
 * writing to the same document either way.
 *
 * Deliberately allows anonymous callers - a donor completing checkout is
 * not necessarily signed in as an admin.
 * -----------------------------------------------------------------------
 */

import { upsertDonationFromTransaction } from './_lib/paystack-shared.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { reference } = req.body || {};

  if (!reference || typeof reference !== 'string') {
    res.status(400).json({ error: 'A transaction reference is required.' });
    return;
  }

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.error('[verify-donation] PAYSTACK_SECRET_KEY is not configured.');
    res.status(500).json({ error: 'Payment verification is not configured.' });
    return;
  }

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
    console.error('[verify-donation] Failed to reach Paystack:', error);
    res
      .status(503)
      .json({ error: "Couldn't reach the payment provider to verify this transaction." });
    return;
  }

  if (!result?.status || result.data?.status !== 'success') {
    res.status(412).json({ error: 'This transaction could not be verified as successful.' });
    return;
  }

  try {
    await upsertDonationFromTransaction(result.data, 'client-verify');
  } catch (error) {
    console.error('[verify-donation] Failed to record donation:', error);
    res
      .status(500)
      .json({ error: 'Payment verified, but recording it failed. Please contact us.' });
    return;
  }

  res.status(200).json({
    success: true,
    amount: result.data.amount / 100,
    currency: result.data.currency,
  });
}
