/**
 * utils/structured-data.js
 * -----------------------------------------------------------------------
 * Injects a JSON-LD <script type="application/ld+json"> tag into the
 * document head, for Schema.org structured data (helps search engines
 * understand church info, events, and articles — can produce rich
 * results like event dates/locations directly in search listings).
 * -----------------------------------------------------------------------
 */

export function injectStructuredData(data) {
  const existing = document.getElementById('structured-data');
  if (existing) {
    existing.remove();
  }

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'structured-data';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}
