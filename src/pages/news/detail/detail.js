/**
 * pages/news/detail/detail.js
 * -----------------------------------------------------------------------
 * Single reusable template for every news/announcement's detail view,
 * chosen via ?slug=. Treats an unpublished article the same as "not
 * found" for public visitors (firestore.rules already enforces this at
 * the data layer; this is a defense-in-depth UI check).
 * -----------------------------------------------------------------------
 */

import { mountPublicLayout } from '../../../layouts/public-layout.js';
import { getDocumentByField } from '../../../services/firestore.service.js';
import { escapeHTML, getQueryParam, qs } from '../../../utils/dom-helpers.js';
import { formatDate } from '../../../utils/formatters.js';
import { setPageMeta } from '../../../utils/seo.js';

async function init() {
  await mountPublicLayout();

  const slug = getQueryParam('slug');
  const target = qs('#news-detail-content');
  if (!target) {
    return;
  }

  if (!slug) {
    renderNotFound(target);
    return;
  }

  try {
    const article = await getDocumentByField('news', 'slug', slug);
    if (!article || !article.isPublished) {
      renderNotFound(target);
      return;
    }
    renderArticle(target, article);
  } catch (error) {
    target.innerHTML = `
      <section class="section">
        <div class="container">
          <p class="state-message state-message--error">
            We couldn't load this article right now. Please refresh the page.
          </p>
        </div>
      </section>`;
  }
}

function renderArticle(target, article) {
  const title = escapeHTML(article.title || 'Announcement');
  const author = escapeHTML(article.author || '');
  const date = formatDate(article.publishDate);
  const image = article.imageUrl || '';
  // `body` may contain simple paragraph breaks — convert double newlines to
  // paragraphs. Content is escaped first, so this stays XSS-safe.
  const bodyHTML = escapeHTML(article.body || '')
    .split(/\n{2,}/)
    .map((para) => `<p>${para}</p>`)
    .join('');

  setPageMeta({
    title: `${title} | News`,
    description: (article.body || '').slice(0, 160),
  });

  target.innerHTML = `
    <section class="page-header">
      <div class="container">
        <h1 class="page-header__title">${title}</h1>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <a href="/news">News</a>
          <span class="breadcrumbs__sep">/</span>
          <span aria-current="page">${title}</span>
        </nav>

        <div class="news-detail__body">
          ${image ? `<img class="news-detail__image" src="${image}" alt="${title}" />` : ''}
          <p class="news-detail__meta">${date}${author ? ` · By ${author}` : ''}</p>
          ${bodyHTML}
        </div>
      </div>
    </section>`;
}

function renderNotFound(target) {
  setPageMeta({ title: 'Article Not Found' });
  target.innerHTML = `
    <section class="section">
      <div class="container" style="text-align: center;">
        <h1>Article Not Found</h1>
        <p>We couldn't find the article you're looking for.</p>
        <a href="/news" class="btn btn-primary" style="margin-top: var(--space-4);">
          View All News
        </a>
      </div>
    </section>`;
}

init();
