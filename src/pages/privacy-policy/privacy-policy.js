/**
 * pages/privacy-policy/privacy-policy.js
 * -----------------------------------------------------------------------
 * Static legal content page — mounts shared layout and fills in the
 * "last updated" date. Update LAST_UPDATED whenever the policy text
 * above changes.
 * -----------------------------------------------------------------------
 */

import { mountPublicLayout } from '../../layouts/public-layout.js';
import { qs } from '../../utils/dom-helpers.js';
import { setPageMeta } from '../../utils/seo.js';

const LAST_UPDATED = 'July 21, 2026';

setPageMeta({
  title: 'Privacy Policy',
  description: 'How we collect, use, and protect your information.',
});

async function init() {
  await mountPublicLayout();
  const dateEl = qs('#legal-updated-date');
  if (dateEl) {
    dateEl.textContent = `Last updated: ${LAST_UPDATED}`;
  }
}

init();
