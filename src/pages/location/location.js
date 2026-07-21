/**
 * pages/location/location.js
 * -----------------------------------------------------------------------
 * Renders an embedded Google Map and address details using the church's
 * address from settings/general. Uses Google's no-API-key "search" embed
 * format, which is sufficient for a simple pin-on-a-map view.
 * -----------------------------------------------------------------------
 */

import { mountPublicLayout } from '../../layouts/public-layout.js';
import { escapeHTML, qs } from '../../utils/dom-helpers.js';
import { setPageMeta } from '../../utils/seo.js';

setPageMeta({
  title: 'Location & Directions',
  description: 'Find us — directions, parking, and what to expect when you arrive.',
});

async function init() {
  const settings = await mountPublicLayout();
  renderMap(settings);
  renderDetails(settings);
}

function renderMap(settings) {
  const target = qs('#location-map');
  if (!target) {
    return;
  }

  const address = settings?.address;

  if (!address) {
    target.innerHTML = `
      <p class="state-message">
        Map will appear here once an address is added in Website Settings.
      </p>`;
    return;
  }

  const query = encodeURIComponent(address);
  target.innerHTML = `
    <iframe
      src="https://www.google.com/maps?q=${query}&output=embed"
      title="Map to our church"
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
      allowfullscreen
    ></iframe>`;
}

function renderDetails(settings) {
  const target = qs('#location-details');
  if (!target) {
    return;
  }

  const address = escapeHTML(settings?.address || 'Address coming soon');
  const phone = escapeHTML(settings?.phone || '');

  target.innerHTML = `
    <h2>Our Address</h2>
    <p>${address}</p>
    ${phone ? `<p><a href="tel:${phone.replace(/\s/g, '')}">${phone}</a></p>` : ''}
    <a
      href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(settings?.address || '')}"
      class="btn btn-primary"
      target="_blank"
      rel="noopener noreferrer"
    >
      Get Directions
    </a>`;
}

init();
