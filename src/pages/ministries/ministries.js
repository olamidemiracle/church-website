/**
 * pages/ministries/ministries.js
 * -----------------------------------------------------------------------
 * Fetches all `ministries` documents (ordered by the `order` field) and
 * renders one card per ministry, linking to the ministry detail page.
 * -----------------------------------------------------------------------
 */

import { mountPublicLayout } from '../../layouts/public-layout.js';
import { getCollectionList } from '../../services/firestore.service.js';
import { escapeHTML, qs } from '../../utils/dom-helpers.js';
import { setPageMeta } from '../../utils/seo.js';

setPageMeta({
  title: 'Ministries',
  description: 'Find your place — ministries for every age and season of life.',
});

async function init() {
  await mountPublicLayout();
  await renderMinistriesList();
}

async function renderMinistriesList() {
  const target = qs('#ministries-list');
  if (!target) {
    return;
  }

  try {
    const ministries = await getCollectionList('ministries', { orderByField: 'order' });

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
  const meetingTime = escapeHTML(ministry.meetingTime || '');
  const slug = escapeHTML(ministry.slug || ministry.id);

  return `
    <a href="/ministries/detail?slug=${encodeURIComponent(slug)}" class="card entity-card">
      ${image ? `<img class="entity-card__image" src="${image}" alt="${name}" loading="lazy" />` : ''}
      <div class="entity-card__body">
        <h3 class="entity-card__title">${name}</h3>
        ${meetingTime ? `<p class="entity-card__meta">${meetingTime}</p>` : ''}
        <p class="entity-card__desc">${description}</p>
        <span class="entity-card__link">Learn more →</span>
      </div>
    </a>`;
}

init();
