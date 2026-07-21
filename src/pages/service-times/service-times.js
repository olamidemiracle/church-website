/**
 * pages/service-times/service-times.js
 * -----------------------------------------------------------------------
 * Renders the full weekly service schedule from settings/general
 * .serviceTimes[] — the same field used by the Home page's snapshot, but
 * shown here in full with descriptions.
 * -----------------------------------------------------------------------
 */

import { mountPublicLayout } from '../../layouts/public-layout.js';
import { escapeHTML, qs } from '../../utils/dom-helpers.js';
import { setPageMeta } from '../../utils/seo.js';

setPageMeta({
  title: 'Service Times',
  description: 'Join us for worship — see our full weekly service schedule.',
});

async function init() {
  const settings = await mountPublicLayout();
  renderServiceTimes(settings);
}

function renderServiceTimes(settings) {
  const target = qs('#service-times-list');
  if (!target) {
    return;
  }

  const serviceTimes = Array.isArray(settings?.serviceTimes) ? settings.serviceTimes : [];

  if (serviceTimes.length === 0) {
    target.innerHTML = `
      <p class="state-message">
        Our service schedule is being updated. Please
        <a href="/contact">contact us</a> for this week's times.
      </p>`;
    return;
  }

  target.innerHTML = serviceTimes.map(renderServiceItem).join('');
}

function renderServiceItem(service) {
  const day = escapeHTML(service.day || '');
  const time = escapeHTML(service.time || '');
  const label = escapeHTML(service.label || '');
  const description = escapeHTML(service.description || '');

  return `
    <div class="card service-list__item">
      <span class="service-list__day">${day}</span>
      <div class="service-list__details">
        <p class="service-list__time">${time}${label ? ` — ${label}` : ''}</p>
        ${description ? `<p class="text-sm">${description}</p>` : ''}
      </div>
    </div>`;
}

init();
