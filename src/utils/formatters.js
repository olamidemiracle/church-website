/**
 * utils/formatters.js
 * -----------------------------------------------------------------------
 * Shared display-formatting helpers for dates and durations, used by
 * Sermons, Events, and News pages so date formatting stays consistent
 * site-wide instead of each page rolling its own.
 * -----------------------------------------------------------------------
 */

/**
 * Converts a Firestore Timestamp, JS Date, or date string into a JS Date.
 * Returns null if the value can't be parsed.
 */
export function toDate(value) {
  if (!value) {
    return null;
  }
  if (typeof value.toDate === 'function') {
    return value.toDate();
  } // Firestore Timestamp
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Formats a date as e.g. "July 21, 2026". Returns '' if unparseable. */
export function formatDate(value) {
  const d = toDate(value);
  if (!d) {
    return '';
  }
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

/** Formats a date as e.g. "Jul 21, 2026". Returns '' if unparseable. */
export function formatDateShort(value) {
  const d = toDate(value);
  if (!d) {
    return '';
  }
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Formats a time as e.g. "9:00 AM". Returns '' if unparseable. */
export function formatTime(value) {
  const d = toDate(value);
  if (!d) {
    return '';
  }
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** True if the given date value is in the past relative to now. */
export function isPast(value) {
  const d = toDate(value);
  if (!d) {
    return false;
  }
  return d.getTime() < Date.now();
}

/** Converts a Firestore Timestamp/Date/string into a 'YYYY-MM-DD' string for an <input type="date"> value. */
export function toDateInputValue(value) {
  const d = toDate(value);
  if (!d) {
    return '';
  }
  return d.toISOString().slice(0, 10);
}

/** Converts a Firestore Timestamp/Date/string into a 'YYYY-MM-DDTHH:mm' string for an <input type="datetime-local"> value. */
export function toDateTimeLocalInputValue(value) {
  const d = toDate(value);
  if (!d) {
    return '';
  }
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Converts an <input type="date"|"datetime-local"> string value back into a JS Date for saving to Firestore. Returns null for an empty string. */
export function fromDateInputValue(value) {
  if (!value) {
    return null;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}
