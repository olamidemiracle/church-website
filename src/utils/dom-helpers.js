/**
 * utils/dom-helpers.js
 * -----------------------------------------------------------------------
 * Small, dependency-free DOM utilities shared by every page and component.
 * Keeping these in one place avoids each page re-inventing "querySelector
 * shorthand" or "safe text insertion" slightly differently.
 * -----------------------------------------------------------------------
 */

/** querySelector shorthand */
export function qs(selector, scope = document) {
  return scope.querySelector(selector);
}

/** querySelectorAll shorthand, returned as a real array (not a NodeList) */
export function qsa(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

/**
 * Escapes text before it's inserted via innerHTML, to prevent XSS when
 * rendering user-influenced or database-sourced strings (names, bios,
 * form values, etc.). Always pass dynamic text through this before
 * interpolating it into an HTML template string.
 */
export function escapeHTML(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Injects an HTML string into a target element's innerHTML.
 * Just a named wrapper for readability at call sites.
 */
export function renderInto(target, html) {
  const el = typeof target === 'string' ? qs(target) : target;
  if (!el) {
    return null;
  }
  el.innerHTML = html;
  return el;
}

/** Creates an element with optional attributes and children in one call. */
export function createEl(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'class') {
      el.className = value;
    } else if (key === 'text') {
      el.textContent = value;
    } else {
      el.setAttribute(key, value);
    }
  });
  (Array.isArray(children) ? children : [children]).forEach((child) => {
    if (child === null || child === undefined) {
      return;
    }
    el.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  });
  return el;
}

/** Reads a query-string parameter, e.g. getQueryParam('slug') for ?slug=youth-ministry */
export function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/** Simple debounce, used for scroll/resize/input listeners. */
export function debounce(fn, delay = 200) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
