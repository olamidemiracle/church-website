/**
 * utils/env.js
 * -----------------------------------------------------------------------
 * Centralized environment-variable resolution, used by every service that
 * needs a config value (Firebase, EmailJS, Paystack, etc.). Isolating this
 * in one place means the *source* of env vars (bundler `import.meta.env`,
 * or a `window.__ENV__` global for plain static HTML) can change later
 * without touching every service file that reads a key.
 * -----------------------------------------------------------------------
 */

export function getEnv(key) {
  const fromImportMeta =
    typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env[key] : undefined;
  const fromWindow =
    typeof window !== 'undefined' && window.__ENV__ ? window.__ENV__[key] : undefined;

  const value = fromImportMeta ?? fromWindow;

  if (!value) {
    // eslint-disable-next-line no-console
    console.error(`[env] Missing expected env var: ${key}`);
  }

  return value;
}
