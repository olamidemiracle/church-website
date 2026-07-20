/**
 * services/firebase.js
 * -----------------------------------------------------------------------
 * Single source of truth for Firebase initialization. Every other service
 * (auth.service.js, firestore.service.js, storage.service.js) imports its
 * instance from HERE — nowhere else should call initializeApp().
 *
 * Config values come from environment variables (see .env.example). This
 * file assumes a build/dev step injects them (e.g. via Vercel env vars or
 * a small script that writes them onto `window.__ENV__` for static HTML
 * pages without a bundler). Adjust the `getEnv()` helper below once the
 * build tooling is decided in a later phase — the rest of the app only
 * ever imports { app, auth, db, storage } from this file, so that swap
 * is isolated to one place.
 * -----------------------------------------------------------------------
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

/**
 * Reads a config value from the environment. Centralized so the *source*
 * of env vars (bundler define, window global, etc.) can change later
 * without touching every call site.
 */
function getEnv(key) {
  // Placeholder resolution order — finalize once the build tool is chosen:
  // 1) import.meta.env (Vite-style)  2) window.__ENV__ (static HTML fallback)
  const fromImportMeta =
    typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env[key] : undefined;
  const fromWindow =
    typeof window !== 'undefined' && window.__ENV__ ? window.__ENV__[key] : undefined;

  const value = fromImportMeta ?? fromWindow;

  if (!value) {
    // Fail loudly in development rather than silently connecting to nothing.
    // eslint-disable-next-line no-console
    console.error(`[firebase] Missing required env var: ${key}`);
  }

  return value;
}

const firebaseConfig = {
  apiKey: getEnv('FIREBASE_API_KEY'),
  authDomain: getEnv('FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('FIREBASE_APP_ID'),
  measurementId: getEnv('FIREBASE_MEASUREMENT_ID'),
};

// Guard against re-initialization (relevant on hot-reload in dev, and if
// multiple entry points accidentally import this module more than once).
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// App Check — helps prevent abusive traffic from hitting Firestore/Storage
// quotas (see Section 8, Security Rules). Only initialize in the browser.
let appCheck;
if (typeof window !== 'undefined') {
  const siteKey = getEnv('APP_CHECK_RECAPTCHA_SITE_KEY');
  if (siteKey) {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  }
}

export { app, auth, db, storage, appCheck };
