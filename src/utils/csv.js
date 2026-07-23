/**
 * utils/csv.js
 * -----------------------------------------------------------------------
 * Client-side CSV generation + download — no server round-trip needed
 * since the admin already has the data loaded in the browser. Used by
 * Manage Membership Applications' "Export CSV" button, and reusable by
 * any future admin list that needs the same.
 * -----------------------------------------------------------------------
 */

/** Escapes a single CSV field: wraps in quotes if it contains a comma, quote, or newline. */
function escapeCsvField(value) {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts an array of plain objects into a CSV string.
 * `columns` is an array of { key, label } — controls column order and headers.
 */
export function toCSV(rows, columns) {
  const header = columns.map((col) => escapeCsvField(col.label)).join(',');
  const lines = rows.map((row) =>
    columns
      .map((col) => escapeCsvField(col.format ? col.format(row[col.key], row) : row[col.key]))
      .join(',')
  );
  return [header, ...lines].join('\r\n');
}

/** Triggers a browser download of the given CSV string as a file. */
export function downloadCSV(filename, rows, columns) {
  const csvContent = toCSV(rows, columns);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
