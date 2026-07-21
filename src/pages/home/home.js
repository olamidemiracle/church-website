/**
 * pages/home/home.js
 * -----------------------------------------------------------------------
 * Home page logic: mounts the shared header/footer, then renders two
 * dynamic sections — a service-times snapshot (from settings/general) and
 * a preview of the first 3 ministries (from the `ministries` collection).
 * -----------------------------------------------------------------------
 */

import { mountPublicLayout } from '../../layouts/public-layout.js';
import { getCollectionList } from '../../services/firestore.service.js';
import { setPageMeta } from '../../utils/seo.js';
import { escapeHTML, qs } from '../../utils/dom-helpers.js';

setPageMeta({
  title: 'Home | Church',
  description: 'Welcome home. Join us for worship, community, and growth.',
});

async function init() {
  const settings = await mountPublicLayout();
  renderServiceSnapshot(settings);
  await renderMinistriesPreview();
}

/** Renders up to 4 upcoming service times from settings/general.serviceTimes[]. */
function renderServiceSnapshot(settings) {
  const target = qs('#service-times-snapshot');
  if (!target) {
    return;
  }

  const serviceTimes = Array.isArray(settings?.serviceTimes) ? settings.serviceTimes : [];

  if (serviceTimes.length === 0) {
    target.innerHTML = `
      <p class="state-message">
        Service time details are coming soon. In the meantime,
        <a href="/contact">contact us</a> for this week's schedule.
      </p>`;
    return;
  }

  target.innerHTML = serviceTimes
    .slice(0, 4)
    .map(
      (service) => `
        <div class="card service-snapshot__item">
          <p class="service-snapshot__day">${escapeHTML(service.day || '')}</p>
          <p class="service-snapshot__time">${escapeHTML(service.time || '')}</p>
          <p class="text-sm">${escapeHTML(service.label || '')}</p>
        </div>`
    )
    .join('');
}

/** Renders the first 3 ministries (by `order` field) as preview cards. */
async function renderMinistriesPreview() {
  const target = qs('#ministries-preview');
  if (!target) {
    return;
  }

  try {
    const ministries = await getCollectionList('ministries', {
      orderByField: 'order',
      limit: 3,
    });

    if (ministries.length === 0) {
      target.innerHTML = `<p class="state-message">Ministries will be listed here soon.</p>`;
      return;
    }

    target.innerHTML = ministries.map(renderMinistryCard).join('');
  } catch (error) {
    target.innerHTML = `
      <p class="state-message state-message--error">
        We couldn't load ministries right now. Please refresh the page.
      </p>`;
  }
}

function renderMinistryCard(ministry) {
  const image = ministry.imageUrl || '';
  const name = escapeHTML(ministry.name || 'Ministry');
  const description = escapeHTML(ministry.description || '');
  const slug = escapeHTML(ministry.slug || ministry.id);

  return `
    <a href="/ministries/detail?slug=${encodeURIComponent(slug)}" class="card entity-card">
      ${image ? `<img class="entity-card__image" src="${image}" alt="${name}" loading="lazy" />` : ''}
      <div class="entity-card__body">
        <h3 class="entity-card__title">${name}</h3>
        <p class="entity-card__desc">${description}</p>
        <span class="entity-card__link">Learn more →</span>
      </div>
    </a>`;
}

init();
