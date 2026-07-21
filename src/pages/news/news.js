/**
 * pages/news/news.js
 * -----------------------------------------------------------------------
 * Fetches published news/announcements (newest first) with cursor-based
 * "Load More" pagination. Only documents with isPublished == true are
 * shown, matching firestore.rules' public-read scope for this collection
 * (rules allow reading the whole collection, but the query itself filters
 * to published items so drafts never render on the public site).
 * -----------------------------------------------------------------------
 */

import { mountPublicLayout } from '../../layouts/public-layout.js';
import { getCollectionPage } from '../../services/firestore.service.js';
import { escapeHTML, qs } from '../../utils/dom-helpers.js';
import { formatDate } from '../../utils/formatters.js';
import { setPageMeta } from '../../utils/seo.js';

setPageMeta({
  title: 'News & Announcements',
  description: 'Stay up to date with the latest news and announcements from our church.',
});

const PAGE_SIZE = 9;
let lastDoc = null;
let hasMore = true;
let isLoading = false;

async function init() {
  await mountPublicLayout();
  const loadMoreBtn = qs('#load-more-btn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', loadNextPage);
  }
  await loadNextPage();
}

async function loadNextPage() {
  if (isLoading || !hasMore) {
    return;
  }
  isLoading = true;

  const target = qs('#news-list');
  const loadMoreBtn = qs('#load-more-btn');
  if (loadMoreBtn) {
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = 'Loading…';
  }

  try {
    const page = await getCollectionPage('news', {
      where: [['isPublished', '==', true]],
      orderByField: 'publishDate',
      orderDirection: 'desc',
      pageSize: PAGE_SIZE,
      startAfterDoc: lastDoc,
    });

    lastDoc = page.lastDoc;
    hasMore = page.hasMore;

    appendItems(target, page.items);
    updateLoadMoreVisibility();
  } catch (error) {
    if (target) {
      target.innerHTML = `
        <p class="state-message state-message--error">
          We couldn't load news right now. Please refresh the page.
        </p>`;
    }
  } finally {
    isLoading = false;
    if (loadMoreBtn) {
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = 'Load More';
    }
  }
}

function appendItems(target, items) {
  if (!target) {
    return;
  }

  const isFirstPage = target.querySelector('.state-message') !== null;
  if (isFirstPage) {
    target.innerHTML = '';
  }

  if (items.length === 0 && isFirstPage) {
    target.innerHTML = `<p class="state-message">No news or announcements yet — check back soon.</p>`;
    return;
  }

  target.insertAdjacentHTML('beforeend', items.map(renderNewsCard).join(''));
}

function renderNewsCard(item) {
  const title = escapeHTML(item.title || 'Announcement');
  const author = escapeHTML(item.author || '');
  const date = formatDate(item.publishDate);
  const image = item.imageUrl || '';
  const slug = escapeHTML(item.slug || item.id);

  return `
    <a href="/news/detail?slug=${encodeURIComponent(slug)}" class="card entity-card">
      ${image ? `<img class="entity-card__image" src="${image}" alt="${title}" loading="lazy" />` : ''}
      <div class="entity-card__body">
        <p class="entity-card__meta">${date}${author ? ` · ${author}` : ''}</p>
        <h3 class="entity-card__title">${title}</h3>
        <span class="entity-card__link">Read More →</span>
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
