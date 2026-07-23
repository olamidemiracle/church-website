/**
 * pages/404/404.js
 * -----------------------------------------------------------------------
 * The 404 page lives at the repository ROOT as /404.html (not nested
 * under src/pages/404/index.html like every other page) — this exact
 * filename and location is a Vercel convention: a literal 404.html file
 * in the deployed output is automatically served, with a correct HTTP
 * 404 status, for any request that doesn't match a real file or a
 * vercel.json rewrite. This script file just holds its logic, matching
 * the pattern every other page follows.
 * -----------------------------------------------------------------------
 */

import { mountPublicLayout } from '../../layouts/public-layout.js';
import { setPageMeta } from '../../utils/seo.js';

setPageMeta({
  title: 'Page Not Found',
  description: "Sorry, we couldn't find that page.",
});

mountPublicLayout();
