/**
 * pages/sermons/sermons.js
 * -----------------------------------------------------------------------
 * Fetches sermons (newest first) with cursor-based "Load More" pagination,
 * and supports client-side filtering by search text, speaker, and series.
 *
 * NOTE: speaker/series filter options are built from sermons loaded so
 * far, not the entire collection — they grow as more pages are loaded.
 * For a typical church's sermon archive size this keeps things simple and
 * fast; if the archive grows very large, a dedicated "distinct speakers"
 * lookup (e.g. a small denormalized collection) would be a good upgrade.
 * -----------------------------------------------------------------------
 */

import { mountPublicLayout } from '../../layouts/public-layout.js';
import { getCollectionPage } from '../../services/firestore.service.js';
import { escapeHTML, qs } from '../../utils/dom-helpers.js';
import { formatDate } from '../../utils/formatters.js';
import { setPageMeta } from '../../utils/seo.js';

setPageMeta({
  title: 'Sermons',
  description: 'Watch, listen, or read our latest sermons and messages.',
});

const PAGE_SIZE = 12;

let allSermons = [];
let lastDoc = null;
let hasMore = true;
let isLoading = false;

async function init() {
  await mountPublicLayout();
  initFilterListeners();
  await loadNextPage();
}

async function loadNextPage() {
  if (isLoading || !hasMore) {
    return;
  }
  isLoading = true;

  const listTarget = qs('#sermons-list');
  const loadMoreBtn = qs('#load-more-btn');
  if (loadMoreBtn) {
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = 'Loading…';
  }

  try {
    const page = await getCollectionPage('sermons', {
      orderByField: 'date',
      orderDirection: 'desc',
      pageSize: PAGE_SIZE,
      startAfterDoc: lastDoc,
    });

    allSermons = allSermons.concat(page.items);
    lastDoc = page.lastDoc;
    hasMore = page.hasMore;

    updateFilterOptions();
    renderFilteredList();
    updateLoadMoreVisibility();
  } catch (error) {
    if (listTarget) {
      listTarget.innerHTML = `
        <p class="state-message state-message--error">
          We couldn't load sermons right now. Please refresh the page.
        </p>`;
    }
  } finally {
    isLoading = false;
    if (loadMoreBtn) {
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = 'Load More Sermons';
    }
  }
}

function updateFilterOptions() {
  populateSelectOptions('#filter-speaker', uniqueValues(allSermons, 'speaker'));
  populateSelectOptions('#filter-series', uniqueValues(allSermons, 'series'));
}

function uniqueValues(items, field) {
  return [...new Set(items.map((item) => item[field]).filter(Boolean))].sort();
}

function populateSelectOptions(selector, values) {
  const select = qs(selector);
  if (!select) {
    return;
  }
  const currentValue = select.value;
  const placeholder = select.querySelector('option[value=""]');

  select.innerHTML = '';
  if (placeholder) {
    select.appendChild(placeholder);
  }

  values.forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });

  select.value = currentValue;
}

function initFilterListeners() {
  const form = qs('#sermons-filter-bar');
  const loadMoreBtn = qs('#load-more-btn');

  if (form) {
    form.addEventListener('input', renderFilteredList);
    form.addEventListener('submit', (event) => event.preventDefault());
  }
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', loadNextPage);
  }
}

function renderFilteredList() {
  const target = qs('#sermons-list');
  if (!target) {
    return;
  }

  const searchTerm = (qs('#filter-search')?.value || '').trim().toLowerCase();
  const speaker = qs('#filter-speaker')?.value || '';
  const series = qs('#filter-series')?.value || '';

  const filtered = allSermons.filter((sermon) => {
    const matchesSearch = !searchTerm || (sermon.title || '').toLowerCase().includes(searchTerm);
    const matchesSpeaker = !speaker || sermon.speaker === speaker;
    const matchesSeries = !series || sermon.series === series;
    return matchesSearch && matchesSpeaker && matchesSeries;
  });

  if (filtered.length === 0) {
    target.innerHTML = `<p class="state-message">No sermons match your filters yet.</p>`;
    return;
  }

  target.innerHTML = filtered.map(renderSermonCard).join('');
}

function renderSermonCard(sermon) {
  const title = escapeHTML(sermon.title || 'Untitled Sermon');
  const speaker = escapeHTML(sermon.speaker || '');
  const date = formatDate(sermon.date);
  const thumbnail = sermon.thumbnailUrl || '';
  const slug = escapeHTML(sermon.slug || sermon.id);

  return `
    <a href="/sermons/detail?slug=${encodeURIComponent(slug)}" class="card entity-card">
      ${
        thumbnail
          ? `<img class="entity-card__image" src="${thumbnail}" alt="${title}" loading="lazy" />`
          : `<div class="entity-card__image" aria-hidden="true"></div>`
      }
      <div class="entity-card__body">
        <h3 class="entity-card__title">${title}</h3>
        <p class="sermon-card__date">${speaker ? `${speaker} · ` : ''}${date}</p>
        <span class="entity-card__link">Watch / Listen →</span>
      </div>
    </a>`;
}

function updateLoadMoreVisibility() {
  const wrap = qs('#load-more-wrap');
  if (wrap) {
    wrap.hidden = !hasMore;
  }
}

init();
