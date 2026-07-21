/**
 * pages/gallery/gallery.js
 * -----------------------------------------------------------------------
 * Fetches all `galleryAlbums` documents and renders one card per album,
 * linking to the album detail page by document id (galleryAlbums has no
 * `slug` field in the schema, so albums are addressed by id).
 * -----------------------------------------------------------------------
 */

import { mountPublicLayout } from '../../layouts/public-layout.js';
import { getCollectionList } from '../../services/firestore.service.js';
import { escapeHTML, qs } from '../../utils/dom-helpers.js';
import { setPageMeta } from '../../utils/seo.js';

setPageMeta({
  title: 'Gallery',
  description: 'Photos from church life — services, events, and community moments.',
});

async function init() {
  await mountPublicLayout();
  await renderAlbums();
}

async function renderAlbums() {
  const target = qs('#albums-list');
  if (!target) {
    return;
  }

  try {
    const albums = await getCollectionList('galleryAlbums', {
      orderByField: 'createdAt',
      orderDirection: 'desc',
    });

    if (albums.length === 0) {
      target.innerHTML = `<p class="state-message">Photo albums will be added here soon.</p>`;
      return;
    }

    target.innerHTML = albums.map(renderAlbumCard).join('');
  } catch (error) {
    target.innerHTML = `
      <p class="state-message state-message--error">
        We couldn't load the gallery right now. Please refresh the page.
      </p>`;
  }
}

function renderAlbumCard(album) {
  const title = escapeHTML(album.title || 'Album');
  const description = escapeHTML(album.description || '');
  const cover = album.coverImageUrl || '';

  return `
    <a href="/gallery/album?id=${encodeURIComponent(album.id)}" class="card entity-card">
      ${
        cover
          ? `<img class="entity-card__image" src="${cover}" alt="${title}" loading="lazy" />`
          : `<div class="entity-card__image" aria-hidden="true"></div>`
      }
      <div class="entity-card__body">
        <h3 class="entity-card__title">${title}</h3>
        ${description ? `<p class="entity-card__desc">${description}</p>` : ''}
        <span class="entity-card__link">View Album →</span>
      </div>
    </a>`;
}

init();
