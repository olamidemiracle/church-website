/**
 * pages/about/beliefs/beliefs.js
 * -----------------------------------------------------------------------
 * Static content page — mounts shared layout + About subnav only.
 * -----------------------------------------------------------------------
 */

import { mountPublicLayout } from '../../../layouts/public-layout.js';
import { renderAboutSubnav } from '../../../components/about-subnav.js';
import { renderInto } from '../../../utils/dom-helpers.js';
import { setPageMeta } from '../../../utils/seo.js';

setPageMeta({
  title: 'Statement of Faith | About',
  description: 'The core convictions of Scripture that shape everything we teach and do.',
});

async function init() {
  await mountPublicLayout();
  renderInto('#about-subnav', renderAboutSubnav());
}

init();
