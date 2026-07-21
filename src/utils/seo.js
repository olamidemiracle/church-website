/**
 * utils/seo.js
 * -----------------------------------------------------------------------
 * Sets per-page <title> and meta description/Open Graph tags at runtime.
 * Each page.js calls setPageMeta() once, near the top, with its own
 * values. Falls back sensibly if a tag is missing from the base HTML.
 * -----------------------------------------------------------------------
 */

export function setPageMeta({ title, description, url }) {
  if (title) {
    document.title = title;
    setMetaTag('property', 'og:title', title);
  }

  if (description) {
    setMetaTag('name', 'description', description);
    setMetaTag('property', 'og:description', description);
  }

  if (url) {
    setMetaTag('property', 'og:url', url);
  }
}

function setMetaTag(attr, value, content) {
  let tag = document.querySelector(`meta[${attr}="${value}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, value);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}
