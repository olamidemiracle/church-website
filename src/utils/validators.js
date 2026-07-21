/**
 * utils/validators.js
 * -----------------------------------------------------------------------
 * Shared client-side validation rules for all public forms (Contact now;
 * Prayer Request, Membership, etc. in later phases). Keeping these in one
 * place means every form validates "required," "email," and "phone" the
 * same way instead of drifting apart page by page.
 *
 * NOTE: client-side validation improves UX but is never the only line of
 * defense — Firestore Security Rules (firestore.rules) are the real
 * enforcement boundary.
 * -----------------------------------------------------------------------
 */

export function isRequired(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isValidEmail(value) {
  if (!isRequired(value)) {
    return false;
  }
  // Reasonably strict without being pedantic about edge-case RFC 5322 rules.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidPhone(value) {
  if (!isRequired(value)) {
    return false;
  }
  // Allows +, spaces, dashes, parentheses; requires at least 7 digits.
  const digitCount = (value.match(/\d/g) || []).length;
  return digitCount >= 7 && /^[\d+\-()\s]+$/.test(value.trim());
}

export function isWithinLength(value, max) {
  return typeof value === 'string' && value.trim().length <= max;
}

/**
 * Validates a plain object of form values against a schema of rules.
 * Returns { valid: boolean, errors: { fieldName: message } }.
 *
 * Example schema:
 *   { name: [[isRequired, 'Name is required']],
 *     email: [[isValidEmail, 'Enter a valid email address']] }
 */
export function validateForm(values, schema) {
  const errors = {};

  Object.entries(schema).forEach(([field, rules]) => {
    for (const [check, message] of rules) {
      if (!check(values[field])) {
        errors[field] = message;
        break; // stop at first failing rule per field
      }
    }
  });

  return { valid: Object.keys(errors).length === 0, errors };
}

/** Honeypot check — a hidden field real users never fill in, bots often do. */
export function isHoneypotTripped(value) {
  return isRequired(value);
}
