/**
 * pages/about/about.js
 * -----------------------------------------------------------------------
 * About hub page: mounts the shared layout and the About-section subnav.
 * This page is a static content hub — no Firestore data required beyond
 * what mountPublicLayout() already fetches for the footer.
 * -----------------------------------------------------------------------
 */

import { mountPublicLayout } from '../../layouts/public-layout.js';
import { renderAboutSubnav } from '../../components/about-subnav.js';
import { renderInto } from '../../utils/dom-helpers.js';
import { setPageMeta } from '../../utils/seo.js';

setPageMeta({
  title: 'About Petals Global Church',
  description: 'Learn who we are, what we believe, and who leads our church family.',
});

async function init() {
  await mountPublicLayout();
  renderInto('#about-subnav', renderAboutSubnav());
}

init();
