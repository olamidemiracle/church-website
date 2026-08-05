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
import { installGlobalErrorLogging } from '../utils/error-logger.js';

/**
 * Mounts header + footer. Returns the fetched settings document (or null
 * if it couldn't be loaded) in case the calling page wants to reuse the
 * same church-info fields (e.g. Home page's hero, Service Times page).
 */
export async function mountPublicLayout() {
  installGlobalErrorLogging();

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

  // The logo image itself always shows "Petals Global Church" (baked into
  // the graphic), but keep its alt text in sync with settings/general in
  // case the church name is ever updated there - a screen reader user
  // should hear the current name even if the image asset lags behind.
  const logoImage = document.getElementById('site-logo-image');
  if (logoImage && settings?.churchName) {
    logoImage.alt = settings.churchName;
  }

  return settings;
}
