/**
 * pages/about/vision-mission/vision-mission.js
 * -----------------------------------------------------------------------
 * Static content page — mounts shared layout + About subnav only.
 * -----------------------------------------------------------------------
 */

import { mountPublicLayout } from '../../../layouts/public-layout.js';
import { renderAboutSubnav } from '../../../components/about-subnav.js';
import { renderInto } from '../../../utils/dom-helpers.js';
import { setPageMeta } from '../../../utils/seo.js';

setPageMeta({
  title: 'Vision & Mission | About',
  description: "What we're working toward, and why we exist as a church family.",
});

async function init() {
  await mountPublicLayout();
  renderInto('#about-subnav', renderAboutSubnav());
}

init();
