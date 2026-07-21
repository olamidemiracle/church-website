/**
 * pages/about/history/history.js
 * -----------------------------------------------------------------------
 * Static content page — mounts shared layout + About subnav only.
 * -----------------------------------------------------------------------
 */

import { mountPublicLayout } from '../../../layouts/public-layout.js';
import { renderAboutSubnav } from '../../../components/about-subnav.js';
import { renderInto } from '../../../utils/dom-helpers.js';
import { setPageMeta } from '../../../utils/seo.js';

setPageMeta({
  title: 'Our History | About',
  description: 'The story of how our church began and the milestones along the way.',
});

async function init() {
  await mountPublicLayout();
  renderInto('#about-subnav', renderAboutSubnav());
}

init();
