/**
 * layouts/public-layout.js
 * -----------------------------------------------------------------------
 * Mounts the shared header and footer into every public page and wires up
 * their behavior. Each page's page.js should call this once, near the top:
 *
 *   import { mountPublicLayout } from '/src/layouts/public-layout.js';
 *   mountPublicLayout();
 *
 * Every public page's HTML must include two empty containers for this to
 * target:
 *   <div id="site-header"></div>
 *   ... page content ...
 *   <div id="site-footer"></div>
 * -----------------------------------------------------------------------
 */

import { renderHeader, initHeader } from '../components/header.js';
import { renderFooter } from '../components/footer.js';
import { getDocument } from '../services/firestore.service.js';
import { renderInto } from '../utils/dom-helpers.js';

/**
 * Mounts header + footer. Returns the fetched settings document (or null
 * if it couldn't be loaded) in case the calling page wants to reuse the
 * same church-info fields (e.g. Home page's hero, Service Times page).
 */
export async function mountPublicLayout() {
  renderInto('#site-header', renderHeader());
  initHeader();

  let settings = null;
  try {
    settings = await getDocument('settings', 'general');
  } catch (error) {
    // Footer still renders with sensible fallback text if settings can't
    // be fetched (e.g. offline, or the doc hasn't been created yet).
    console.error('[public-layout] Failed to load settings/general:', error);
  }

  renderInto('#site-footer', renderFooter(settings || {}));

  // Update the header's logo text once we know the real church name.
  const logoText = document.getElementById('site-logo-text');
  if (logoText && settings?.churchName) {
    logoText.textContent = settings.churchName;
  }

  return settings;
}
