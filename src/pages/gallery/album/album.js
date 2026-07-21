/**
 * pages/gallery/album/album.js
 * -----------------------------------------------------------------------
 * Fetches one galleryAlbums document (by ?id=) plus its images
 * subcollection, and renders a thumbnail grid that opens the shared
 * Lightbox component (components/lightbox.js) on click.
 * -----------------------------------------------------------------------
 */

import { mountPublicLayout } from '../../../layouts/public-layout.js';
import { getDocument, getSubcollectionList } from '../../../services/firestore.service.js';
import { createLightbox } from '../../../components/lightbox.js';
import { escapeHTML, getQueryParam, qs } from '../../../utils/dom-helpers.js';
import { setPageMeta } from '../../../utils/seo.js';

async function init() {
  await mountPublicLayout();

  const albumId = getQueryParam('id');
  const target = qs('#album-content');
  if (!target) {
    return;
  }

  if (!albumId) {
    renderNotFound(target);
    return;
  }

  try {
    const album = await getDocument('galleryAlbums', albumId);
    if (!album) {
      renderNotFound(target);
      return;
    }

    const images = await getSubcollectionList('galleryAlbums', albumId, 'images', {
      orderByField: 'order',
    });

    renderAlbum(target, album, images);
  } catch (error) {
    target.innerHTML = `
      <section class="section">
        <div class="container">
          <p class="state-message state-message--error">
            We couldn't load this album right now. Please refresh the page.
          </p>
        </div>
      </section>`;
  }
}

function renderAlbum(target, album, images) {
  const title = escapeHTML(album.title || 'Album');
  const description = escapeHTML(album.description || '');

  setPageMeta({
    title: `${title} | Gallery`,
    description: description || `Browse the ${title} photo album.`,
  });

  const thumbsHTML = images.length
    ? images
        .map(
          (image, index) => `
            <div class="gallery-thumb" data-index="${index}" role="button" tabindex="0" aria-label="Open image ${index + 1}">
              <img src="${image.imageUrl}" alt="${escapeHTML(image.caption || '')}" loading="lazy" />
            </div>`
        )
        .join('')
    : `<p class="state-message">No photos have been added to this album yet.</p>`;

  target.innerHTML = `
    <section class="page-header">
      <div class="container">
        <h1 class="page-header__title">${title}</h1>
        ${description ? `<p>${description}</p>` : ''}
      </div>
    </section>

    <section class="section">
      <div class="container">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <a href="/gallery">Gallery</a>
          <span class="breadcrumbs__sep">/</span>
          <span aria-current="page">${title}</span>
        </nav>

        <div class="gallery-grid">${thumbsHTML}</div>
      </div>
    </section>`;

  if (images.length > 0) {
    initLightboxHandlers(images);
  }
}

function initLightboxHandlers(images) {
  const lightbox = createLightbox();

  document.querySelectorAll('.gallery-thumb').forEach((thumb) => {
    const index = Number(thumb.dataset.index);

    thumb.addEventListener('click', () => lightbox.open(images, index));
    thumb.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        lightbox.open(images, index);
      }
    });
  });
}

function renderNotFound(target) {
  setPageMeta({ title: 'Album Not Found' });
  target.innerHTML = `
    <section class="section">
      <div class="container" style="text-align: center;">
        <h1>Album Not Found</h1>
        <p>We couldn't find the album you're looking for.</p>
        <a href="/gallery" class="btn btn-primary" style="margin-top: var(--space-4);">
          View All Albums
        </a>
      </div>
    </section>`;
}

init();
