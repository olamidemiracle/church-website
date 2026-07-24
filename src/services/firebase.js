/**
 * services/firebase.js
 * -----------------------------------------------------------------------
 * Single source of truth for Firebase initialization. Every other service
 * (firestore.service.js, emailjs.service.js's siblings, etc.) imports its
 * instance from HERE — nowhere else should call initializeApp().
 *
 * IMPORTANT — no bundler yet: this project currently ships plain
 * `<script type="module">` pages with no build step (per the Phase 2
 * architecture). Bare specifiers like `firebase/app` only resolve with a
 * bundler (Vite/Webpack/etc.), so we import the Firebase SDK directly
 * from Google's official CDN as ES modules instead. If a bundler is
 * introduced later, swap these three import lines for the npm package
 * equivalents ('firebase/app', 'firebase/auth', ...) — every other file
 * that imports { app, auth, db, storage } from this module is unaffected.
 *
 * Config values come from environment variables (see .env.example),
 * resolved via utils/env.js (import.meta.env or window.__ENV__).
 * -----------------------------------------------------------------------
 */

import { getEnv } from '../utils/env.js';

const FIREBASE_SDK_VERSION = '10.12.5';

const { initializeApp, getApps, getApp } = await import(
  `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app.js`
);
const { getAuth } = await import(
  `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-auth.js`
);
const { getFirestore } = await import(
  `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-firestore.js`
);
const { getStorage } = await import(
  `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-storage.js`
);
const { initializeAppCheck, ReCaptchaV3Provider } = await import(
  `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app-check.js`
);
const { getAnalytics, isSupported: isAnalyticsSupported } = await import(
  `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-analytics.js`
);

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

// Analytics (Phase 9/10 monitoring) — only initialized when a
// measurementId is configured AND the current environment actually
// supports it (isSupported() returns false in some browsers/contexts,
// e.g. private browsing modes without IndexedDB — calling getAnalytics()
// anyway would throw). Optional by design: the site works identically
// whether or not FIREBASE_MEASUREMENT_ID is set.
let analytics;
if (typeof window !== 'undefined' && getEnv('FIREBASE_MEASUREMENT_ID')) {
  isAnalyticsSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      // Analytics is a nice-to-have — never let its absence break the app.
    });
}

export { app, auth, db, storage, appCheck, analytics };
