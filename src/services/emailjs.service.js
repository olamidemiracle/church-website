/**
 * services/emailjs.service.js
 * -----------------------------------------------------------------------
 * Thin wrapper around the EmailJS browser SDK (loaded via CDN script tag
 * — see each form page's <head>), used to notify the church office when a
 * public form is submitted. This is a "nice to have" on top of the real
 * source of truth, which is always the Firestore write (see
 * firestore.service.js) — if EmailJS fails or is unavailable, the form
 * submission itself must still succeed.
 * -----------------------------------------------------------------------
 */

import { getEnv } from '../utils/env.js';

/**
 * Sends a notification email via EmailJS. Never throws — a failure here
 * is logged but does not block the calling form's success state, since
 * the Firestore record is already saved by the time this runs.
 */
export async function sendFormNotification(templateParams) {
  if (typeof window === 'undefined' || !window.emailjs) {
    console.error('[emailjs] SDK not loaded — skipping notification email.');
    return false;
  }

  const serviceId = getEnv('EMAILJS_SERVICE_ID');
  const templateId = getEnv('EMAILJS_TEMPLATE_ID');
  const publicKey = getEnv('EMAILJS_PUBLIC_KEY');

  if (!serviceId || !templateId || !publicKey) {
    console.error('[emailjs] Missing configuration — skipping notification email.');
    return false;
  }

  try {
    window.emailjs.init({ publicKey });
    await window.emailjs.send(serviceId, templateId, templateParams);
    return true;
  } catch (error) {
    console.error('[emailjs] Failed to send notification email:', error);
    return false;
  }
}
