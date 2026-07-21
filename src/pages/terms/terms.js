/**
 * pages/terms/terms.js
 * -----------------------------------------------------------------------
 * Static legal content page — mounts shared layout and fills in the
 * "last updated" date. Update LAST_UPDATED whenever the terms text above
 * changes.
 * -----------------------------------------------------------------------
 */

import { mountPublicLayout } from '../../layouts/public-layout.js';
import { qs } from '../../utils/dom-helpers.js';
import { setPageMeta } from '../../utils/seo.js';

const LAST_UPDATED = 'July 21, 2026';

setPageMeta({
  title: 'Terms & Conditions',
  description: 'The terms that govern your use of this website.',
});

async function init() {
  await mountPublicLayout();
  const dateEl = qs('#legal-updated-date');
  if (dateEl) {
    dateEl.textContent = `Last updated: ${LAST_UPDATED}`;
  }
}

init();
