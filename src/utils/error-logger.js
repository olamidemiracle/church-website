/**
 * utils/error-logger.js
 * -----------------------------------------------------------------------
 * Catches otherwise-silent runtime errors (uncaught exceptions, rejected
 * promises with no .catch()) that would otherwise only show up as a
 * blank/broken UI with no trace. Logs to the console immediately, and
 * also persists a best-effort record to the `errorLogs` Firestore
 * collection (see services/firestore.service.js's logClientError) so an
 * admin can review what went wrong via the Firebase Console, without
 * needing a separate monitoring service.
 * -----------------------------------------------------------------------
 */

import { logClientError } from '../services/firestore.service.js';

let isInstalled = false;

export function installGlobalErrorLogging() {
  if (isInstalled) {
    return; // avoid double-registering listeners if called more than once
  }
  isInstalled = true;

  window.addEventListener('error', (event) => {
    console.error('[global-error]', event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    });

    logClientError({
      message: event.message,
      source: 'window.onerror',
      stack: event.error?.stack,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[unhandled-rejection]', event.reason);

    logClientError({
      message: event.reason?.message || String(event.reason),
      source: 'unhandledrejection',
      stack: event.reason?.stack,
    });
  });
}
