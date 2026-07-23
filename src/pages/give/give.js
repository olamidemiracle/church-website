/**
 * pages/give/give.js
 * -----------------------------------------------------------------------
 * Give / Donate page — collects amount + donor info, then opens
 * Paystack's Inline checkout popup. On success, calls the verifyDonation
 * Cloud Function (never trusts the client-side "success" callback alone)
 * before showing a confirmed thank-you message. The Paystack webhook
 * (functions/paystackWebhook.js) remains the durable source of truth
 * regardless of whether this verification call completes.
 * -----------------------------------------------------------------------
 */

import { mountPublicLayout } from '../../layouts/public-layout.js';
import { callFunction } from '../../services/cloud-functions.service.js';
import { getEnv } from '../../utils/env.js';
import { qs, qsa } from '../../utils/dom-helpers.js';
import { isRequired, isValidEmail, validateForm } from '../../utils/validators.js';
import { setPageMeta } from '../../utils/seo.js';

setPageMeta({
  title: 'Give',
  description: 'Support the ministry of our church through online giving.',
});

const CURRENCY = 'NGN';

const FORM_SCHEMA = {
  name: [[isRequired, 'Please enter your name.']],
  email: [[isValidEmail, 'Please enter a valid email address.']],
  amount: [[(v) => Number(v) >= 100, 'Please enter an amount of at least ₦100.']],
};

async function init() {
  await mountPublicLayout();
  initPresetButtons();
  initForm();
}

function initPresetButtons() {
  const amountInput = qs('#give-amount');

  qsa('.amount-preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      qsa('.amount-preset-btn').forEach((b) => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      amountInput.value = btn.dataset.amount;
    });
  });

  // Typing a custom amount deselects any preset.
  amountInput.addEventListener('input', () => {
    const matchingPreset = qsa('.amount-preset-btn').find(
      (b) => b.dataset.amount === amountInput.value
    );
    qsa('.amount-preset-btn').forEach((b) =>
      b.classList.toggle('is-selected', b === matchingPreset)
    );
  });
}

function initForm() {
  const form = qs('#give-form');
  const statusEl = qs('#give-status');
  const submitBtn = qs('#give-submit-btn');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearFieldErrors(form);
    statusEl.innerHTML = '';

    const values = {
      name: form.name.value,
      email: form.email.value,
      amount: form.amount.value,
    };

    const { valid, errors } = validateForm(values, FORM_SCHEMA);
    if (!valid) {
      showFieldErrors(errors);
      return;
    }

    const publicKey = getEnv('PAYSTACK_PUBLIC_KEY');
    if (!publicKey || typeof window.PaystackPop === 'undefined') {
      statusEl.innerHTML = `
        <div class="form-status form-status--error">
          Online giving isn't fully configured yet. Please contact us to give another way.
        </div>`;
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Opening secure checkout…';

    const handler = window.PaystackPop.setup({
      key: publicKey,
      email: values.email,
      amount: Math.round(Number(values.amount) * 100), // Paystack expects the smallest currency unit (kobo)
      currency: CURRENCY,
      metadata: { donorName: values.name },
      callback(response) {
        handlePaymentSuccess(statusEl, submitBtn, response.reference);
      },
      onClose() {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Give Now';
      },
    });

    handler.openIframe();
  });
}

async function handlePaymentSuccess(statusEl, submitBtn, reference) {
  statusEl.innerHTML = `
    <div class="form-status form-status--success">
      Payment received — confirming your gift…
    </div>`;

  try {
    const result = await callFunction('verifyDonation', { reference });
    statusEl.innerHTML = `
      <div class="form-status form-status--success">
        Thank you for your gift of ${result.currency} ${Number(result.amount).toLocaleString()}!
        A record of your donation has been saved.
      </div>`;
  } catch (error) {
    statusEl.innerHTML = `
      <div class="form-status form-status--success">
        Thank you — your payment was received. It may take a few minutes to finish confirming;
        if you have any questions, please <a href="/contact">contact us</a> with your reference:
        ${reference}.
      </div>`;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Give Now';
  }
}

function showFieldErrors(errors) {
  Object.entries(errors).forEach(([field, message]) => {
    const input = qs(`#give-${field}`);
    const errorEl = qs(`#give-${field}-error`);
    if (input) {
      input.classList.add('has-error');
    }
    if (errorEl) {
      errorEl.textContent = message;
    }
  });
}

function clearFieldErrors(form) {
  form.querySelectorAll('.has-error').forEach((el) => el.classList.remove('has-error'));
  form.querySelectorAll('.form-error-text').forEach((el) => (el.textContent = ''));
}

init();
