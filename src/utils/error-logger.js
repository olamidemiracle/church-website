/**
 * utils/error-logger.js
 * -----------------------------------------------------------------------
 * Catches otherwise-silent runtime errors (uncaught exceptions, rejected
 * promises with no .catch()) that would otherwise only show up as a
 * blank/broken UI with no trace. Currently logs to the browser console
 * with context; the single call site here makes it easy to extend later
 * (e.g. writing to a Firestore `errorLogs` collection, or forwarding to
 * an external monitoring service) without touching every page.
 * -----------------------------------------------------------------------
 */

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
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[unhandled-rejection]', event.reason);
  });
}
