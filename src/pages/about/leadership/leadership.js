/**
 * pages/about/leadership/leadership.js
 * -----------------------------------------------------------------------
 * Fetches the `leadership` collection (ordered by the `order` field) and
 * renders one card per staff member. Handles loading, empty, and error
 * states explicitly rather than leaving a blank screen.
 * -----------------------------------------------------------------------
 */

import { mountPublicLayout } from '../../../layouts/public-layout.js';
import { renderAboutSubnav } from '../../../components/about-subnav.js';
import { getCollectionList } from '../../../services/firestore.service.js';
import { escapeHTML, qs, renderInto } from '../../../utils/dom-helpers.js';
import { setPageMeta } from '../../../utils/seo.js';

setPageMeta({
  title: 'Leadership | About',
  description: 'Meet the pastors, ministers, and elders who shepherd our congregation.',
});

async function init() {
  await mountPublicLayout();
  renderInto('#about-subnav', renderAboutSubnav());
  await renderLeadershipList();
}

async function renderLeadershipList() {
  const target = qs('#leadership-list');
  if (!target) {
    return;
  }

  try {
    const leaders = await getCollectionList('leadership', { orderByField: 'order' });

    if (leaders.length === 0) {
      target.innerHTML = `
        <p class="state-message">
          Our leadership team profiles will be published here soon.
        </p>`;
      return;
    }

    target.innerHTML = leaders.map(renderLeaderCard).join('');
  } catch (error) {
    target.innerHTML = `
      <p class="state-message state-message--error">
        We couldn't load the leadership team right now. Please refresh the page.
      </p>`;
  }
}

function renderLeaderCard(leader) {
  const name = escapeHTML(leader.name || 'Team Member');
  const title = escapeHTML(leader.title || '');
  const bio = escapeHTML(leader.bio || '');
  const photo = leader.photoUrl || '';

  return `
    <article class="card entity-card">
      ${
        photo
          ? `<img class="entity-card__image staff-card__image" src="${photo}" alt="${name}" loading="lazy" />`
          : `<div class="entity-card__image staff-card__image" aria-hidden="true"></div>`
      }
      <div class="entity-card__body">
        <h3 class="entity-card__title">${name}</h3>
        ${title ? `<p class="staff-card__title">${title}</p>` : ''}
        ${bio ? `<p class="entity-card__desc">${bio}</p>` : ''}
      </div>
    </article>`;
}

init();
