/**
 * admin/login/forgot-password.js
 * -----------------------------------------------------------------------
 * Renders the admin Forgot Password page — sends a Firebase Auth
 * password reset email. Lives alongside login.js since both are
 * pre-authentication screens sharing the same .auth-card styling.
 * -----------------------------------------------------------------------
 */

import { requestPasswordReset } from '../../services/auth.service.js';
import { qs } from '../../utils/dom-helpers.js';
import { isValidEmail, validateForm } from '../../utils/validators.js';

const FORM_SCHEMA = {
  email: [[isValidEmail, 'Please enter a valid email address.']],
};

export function renderForgotPassword(root) {
  root.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-card__brand"><span aria-hidden="true">✚</span> Admin</div>
        <h1>Reset Your Password</h1>
        <p class="auth-card__subtitle">
          Enter your admin email and we'll send you a link to reset your password.
        </p>

        <div id="reset-status"></div>

        <form id="reset-form" novalidate>
          <div class="form-field">
            <label class="form-label" for="reset-email">Email Address</label>
            <input class="form-input" type="email" id="reset-email" name="email" autocomplete="username" required />
            <span class="form-error-text" id="reset-email-error"></span>
          </div>

          <button type="submit" class="btn btn-primary" id="reset-submit-btn">Send Reset Link</button>
        </form>

        <p class="auth-card__footer-link">
          <a href="/admin/login">Back to Sign In</a>
        </p>
      </div>
    </div>`;

  initForm(root);
}

function initForm(root) {
  const form = qs('#reset-form', root);
  const statusEl = qs('#reset-status', root);
  const submitBtn = qs('#reset-submit-btn', root);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearFieldErrors(form);
    statusEl.innerHTML = '';

    const values = { email: form.email.value };
    const { valid, errors } = validateForm(values, FORM_SCHEMA);
    if (!valid) {
      showFieldErrors(root, errors);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    try {
      await requestPasswordReset(values.email);
      // Always show the same success message regardless of whether the
      // email exists, so this can't be used to probe for valid admin
      // accounts.
      statusEl.innerHTML = `
        <div class="form-status form-status--success">
          If that email is registered, a password reset link is on its way.
        </div>`;
      form.reset();
    } catch {
      statusEl.innerHTML = `
        <div class="form-status form-status--success">
          If that email is registered, a password reset link is on its way.
        </div>`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Reset Link';
    }
  });
}

function showFieldErrors(root, errors) {
  Object.entries(errors).forEach(([field, message]) => {
    const input = qs(`#reset-${field}`, root);
    const errorEl = qs(`#reset-${field}-error`, root);
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
