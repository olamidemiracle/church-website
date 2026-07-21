/**
 * components/footer.js
 * -----------------------------------------------------------------------
 * Renders the site-wide footer. Contact details are passed in dynamically
 * (from the `settings/general` Firestore document) so the footer never
 * goes stale if the church's address/phone changes — pages fetch settings
 * once and pass the values here rather than this file reading Firestore
 * itself, keeping data-fetching centralized on the page layer.
 * -----------------------------------------------------------------------
 */

import { escapeHTML } from '../utils/dom-helpers.js';

const CURRENT_YEAR = new Date().getFullYear();

export function renderFooter(settings = {}) {
  const churchName = escapeHTML(settings.churchName || 'Church Name');
  const address = escapeHTML(settings.address || '');
  const phone = escapeHTML(settings.phone || '');
  const email = escapeHTML(settings.email || '');

  return `
    <footer class="site-footer">
      <div class="container site-footer__grid">
        <div class="site-footer__about">
          <a href="/" class="site-logo site-logo--footer" aria-label="Go to homepage">
            <span class="site-logo__mark" aria-hidden="true">✚</span>
            <span class="site-logo__text">${churchName}</span>
          </a>
          <p class="text-sm site-footer__tagline">
            A community built on faith, hope, and love — for every generation.
          </p>
        </div>

        <div class="site-footer__col">
          <h4 class="site-footer__heading">Explore</h4>
          <ul class="site-footer__links">
            <li><a href="/about">About Church</a></li>
            <li><a href="/ministries">Ministries</a></li>
            <li><a href="/service-times">Service Times</a></li>
            <li><a href="/visit">First-Time Visitor</a></li>
          </ul>
        </div>

        <div class="site-footer__col">
          <h4 class="site-footer__heading">Connect</h4>
          <ul class="site-footer__links">
            <li><a href="/contact">Contact Us</a></li>
            <li><a href="/location">Location &amp; Directions</a></li>
            <li><a href="/prayer-request">Prayer Request</a></li>
          </ul>
        </div>

        <div class="site-footer__col">
          <h4 class="site-footer__heading">Get in Touch</h4>
          <ul class="site-footer__contact">
            ${address ? `<li>${address}</li>` : ''}
            ${phone ? `<li><a href="tel:${phone.replace(/\s/g, '')}">${phone}</a></li>` : ''}
            ${email ? `<li><a href="mailto:${email}">${email}</a></li>` : ''}
          </ul>
        </div>
      </div>

      <div class="container site-footer__bottom">
        <p class="text-sm">&copy; ${CURRENT_YEAR} ${churchName}. All rights reserved.</p>
        <ul class="site-footer__legal">
          <li><a href="/privacy-policy">Privacy Policy</a></li>
          <li><a href="/terms">Terms &amp; Conditions</a></li>
        </ul>
      </div>
    </footer>`;
}
