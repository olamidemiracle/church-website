/**
 * pages/ministries/detail/detail.js
 * -----------------------------------------------------------------------
 * A single reusable template for every ministry's detail view. The
 * specific ministry to display is chosen by a `?slug=` query parameter
 * (e.g. /ministries/detail?slug=youth-ministry), then fetched from the
 * `ministries` collection by matching its `slug` field.
 * -----------------------------------------------------------------------
 */

import { mountPublicLayout } from '../../../layouts/public-layout.js';
import { getDocumentByField } from '../../../services/firestore.service.js';
import { escapeHTML, getQueryParam, qs } from '../../../utils/dom-helpers.js';
import { setPageMeta } from '../../../utils/seo.js';

async function init() {
  await mountPublicLayout();

  const slug = getQueryParam('slug');
  const target = qs('#ministry-detail-content');
  if (!target) {
    return;
  }

  if (!slug) {
    renderNotFound(target);
    return;
  }

  try {
    const ministry = await getDocumentByField('ministries', 'slug', slug);
    if (!ministry) {
      renderNotFound(target);
      return;
    }
    renderMinistry(target, ministry);
  } catch (error) {
    target.innerHTML = `
      <section class="section">
        <div class="container">
          <p class="state-message state-message--error">
            We couldn't load this ministry right now. Please refresh the page.
          </p>
        </div>
      </section>`;
  }
}

function renderMinistry(target, ministry) {
  const name = escapeHTML(ministry.name || 'Ministry');
  const description = escapeHTML(ministry.description || '');
  const meetingTime = escapeHTML(ministry.meetingTime || '');
  const leaderName = escapeHTML(ministry.leaderName || ministry.leaderId || '');
  const image = ministry.imageUrl || '';

  setPageMeta({
    title: `${name} | Ministries`,
    description: description || `Learn more about ${name}.`,
  });

  target.innerHTML = `
    <section class="page-header">
      <div class="container">
        <h1 class="page-header__title">${name}</h1>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <a href="/ministries">Ministries</a>
          <span class="breadcrumbs__sep">/</span>
          <span aria-current="page">${name}</span>
        </nav>

        <div class="ministry-detail__body">
          ${image ? `<img class="ministry-detail__image" src="${image}" alt="${name}" />` : ''}

          <div class="ministry-detail__meta">
            ${meetingTime ? `<span class="ministry-detail__meta-item">🗓 ${meetingTime}</span>` : ''}
            ${leaderName ? `<span class="ministry-detail__meta-item">Led by ${leaderName}</span>` : ''}
          </div>

          <p>${description}</p>

          <a href="/contact" class="btn btn-primary" style="margin-top: var(--space-6);">
            Get Involved
          </a>
        </div>
      </div>
    </section>`;
}

function renderNotFound(target) {
  setPageMeta({ title: 'Ministry Not Found' });
  target.innerHTML = `
    <section class="section">
      <div class="container" style="text-align: center;">
        <h1>Ministry Not Found</h1>
        <p>We couldn't find the ministry you're looking for.</p>
        <a href="/ministries" class="btn btn-primary" style="margin-top: var(--space-4);">
          View All Ministries
        </a>
      </div>
    </section>`;
}

init();
