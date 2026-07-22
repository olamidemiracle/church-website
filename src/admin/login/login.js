/**
 * admin/login/login.js
 * -----------------------------------------------------------------------
 * Renders and wires up the admin Login page. Exported as a render
 * function registered with the router (see admin/admin.js) rather than
 * a standalone HTML file, since /admin is a single-page app.
 * -----------------------------------------------------------------------
 */

import { signIn } from '../../services/auth.service.js';
import { navigate } from '../../router/router.js';
import { qs } from '../../utils/dom-helpers.js';
import { isRequired, isValidEmail, validateForm } from '../../utils/validators.js';

const FORM_SCHEMA = {
  email: [[isValidEmail, 'Please enter a valid email address.']],
  password: [[isRequired, 'Please enter your password.']],
};

export function renderLogin(root) {
  root.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-card__brand"><span aria-hidden="true">✚</span> Admin Login</div>
        <h1>Sign In</h1>
        <p class="auth-card__subtitle">Enter your admin credentials to continue.</p>

        <div id="login-status"></div>

        <form id="login-form" novalidate>
          <div class="form-field">
            <label class="form-label" for="login-email">Email Address</label>
            <input class="form-input" type="email" id="login-email" name="email" autocomplete="username" required />
            <span class="form-error-text" id="login-email-error"></span>
          </div>

          <div class="form-field">
            <label class="form-label" for="login-password">Password</label>
            <input class="form-input" type="password" id="login-password" name="password" autocomplete="current-password" required />
            <span class="form-error-text" id="login-password-error"></span>
          </div>

          <button type="submit" class="btn btn-primary" id="login-submit-btn">Sign In</button>
        </form>

        <p class="auth-card__footer-link">
          <a href="/admin/forgot-password">Forgot your password?</a>
        </p>
      </div>
    </div>`;

  initForm(root);
}

function initForm(root) {
  const form = qs('#login-form', root);
  const statusEl = qs('#login-status', root);
  const submitBtn = qs('#login-submit-btn', root);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearFieldErrors(form);
    statusEl.innerHTML = '';

    const values = { email: form.email.value, password: form.password.value };
    const { valid, errors } = validateForm(values, FORM_SCHEMA);
    if (!valid) {
      showFieldErrors(root, errors);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in…';

    try {
      await signIn(values.email, values.password);
      // The router's guard re-renders once auth.service's onAuthChange
      // fires (see admin.js) — but we also navigate immediately for a
      // snappier transition instead of waiting on that callback.
      navigate('/admin/dashboard', { replace: true });
    } catch (error) {
      statusEl.innerHTML = `
        <div class="form-status form-status--error">
          ${getFriendlyAuthError(error)}
        </div>`;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
    }
  });
}

/** Converts common Firebase Auth error codes into plain-language messages. */
function getFriendlyAuthError(error) {
  const code = error?.code || '';
  if (
    code.includes('invalid-credential') ||
    code.includes('wrong-password') ||
    code.includes('user-not-found')
  ) {
    return 'Incorrect email or password. Please try again.';
  }
  if (code.includes('too-many-requests')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (code.includes('network-request-failed')) {
    return 'Network error — please check your connection and try again.';
  }
  return 'Something went wrong signing in. Please try again.';
}

function showFieldErrors(root, errors) {
  Object.entries(errors).forEach(([field, message]) => {
    const input = qs(`#login-${field}`, root);
    const errorEl = qs(`#login-${field}-error`, root);
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
