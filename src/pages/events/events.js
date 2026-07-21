/**
 * pages/events/events.js
 * -----------------------------------------------------------------------
 * Fetches all events, then splits/filters them client-side by timeframe
 * (upcoming/past/all) and category. Events collections are typically small
 * enough for a church site that a single fetch + client-side filtering is
 * simpler and faster than paginating — revisit with getCollectionPage()
 * (see firestore.service.js) if the collection grows very large.
 * -----------------------------------------------------------------------
 */

import { mountPublicLayout } from '../../layouts/public-layout.js';
import { getCollectionList } from '../../services/firestore.service.js';
import { escapeHTML, qs } from '../../utils/dom-helpers.js';
import { formatTime, isPast, toDate } from '../../utils/formatters.js';
import { setPageMeta } from '../../utils/seo.js';

setPageMeta({
  title: 'Events',
  description: "See what's happening — upcoming events at our church.",
});

let allEvents = [];

async function init() {
  await mountPublicLayout();
  initFilterListeners();
  await loadEvents();
}

async function loadEvents() {
  const target = qs('#events-list');
  if (!target) {
    return;
  }

  try {
    allEvents = await getCollectionList('events', {
      orderByField: 'startDate',
      orderDirection: 'asc',
    });
    populateCategoryOptions();
    renderFilteredList();
  } catch (error) {
    target.innerHTML = `
      <p class="state-message state-message--error">
        We couldn't load events right now. Please refresh the page.
      </p>`;
  }
}

function populateCategoryOptions() {
  const select = qs('#filter-category');
  if (!select) {
    return;
  }

  const categories = [...new Set(allEvents.map((e) => e.category).filter(Boolean))].sort();
  categories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    select.appendChild(option);
  });
}

function initFilterListeners() {
  const form = qs('#events-filter-bar');
  if (form) {
    form.addEventListener('change', renderFilteredList);
  }
}

function renderFilteredList() {
  const target = qs('#events-list');
  if (!target) {
    return;
  }

  const timeframe = qs('#filter-timeframe')?.value || 'upcoming';
  const category = qs('#filter-category')?.value || '';

  let filtered = allEvents.filter((event) => !category || event.category === category);

  if (timeframe === 'upcoming') {
    filtered = filtered.filter((event) => !isPast(event.endDate || event.startDate));
  } else if (timeframe === 'past') {
    filtered = filtered
      .filter((event) => isPast(event.endDate || event.startDate))
      .sort(
        (a, b) => (toDate(b.startDate)?.getTime() || 0) - (toDate(a.startDate)?.getTime() || 0)
      );
  }

  if (filtered.length === 0) {
    target.innerHTML = `<p class="state-message">No events to show right now.</p>`;
    return;
  }

  target.innerHTML = filtered.map(renderEventCard).join('');
}

function renderEventCard(event) {
  const title = escapeHTML(event.title || 'Untitled Event');
  const location = escapeHTML(event.location || '');
  const category = escapeHTML(event.category || '');
  const image = event.imageUrl || '';
  const slug = escapeHTML(event.slug || event.id);

  const startDate = toDate(event.startDate);
  const month = startDate ? startDate.toLocaleDateString(undefined, { month: 'short' }) : '';
  const day = startDate ? startDate.getDate() : '';
  const time = formatTime(event.startDate);

  return `
    <a href="/events/detail?slug=${encodeURIComponent(slug)}" class="card entity-card entity-card--event">
      <div class="event-card__date-badge">
        <span class="month">${month}</span>
        <span class="day">${day}</span>
      </div>
      ${image ? `<img class="entity-card__image" src="${image}" alt="${title}" loading="lazy" />` : ''}
      <div class="entity-card__body">
        ${category ? `<p class="entity-card__meta">${category}</p>` : ''}
        <h3 class="entity-card__title">${title}</h3>
        <p class="entity-card__desc">${time ? `${time} · ` : ''}${location}</p>
        <span class="entity-card__link">Details →</span>
      </div>
    </a>`;
}

init();
