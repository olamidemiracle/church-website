/**
 * admin/gallery/gallery.js
 * -----------------------------------------------------------------------
 * Manage Gallery — doesn't fit the generic CRUD engine (admin/shared/
 * crud-page.js) because it has two levels: albums, and each album's
 * images subcollection. This file implements both: an album list/form
 * (similar shape to the generic engine, but bespoke), and a "Manage
 * Photos" view per album for adding/removing individual images.
 * -----------------------------------------------------------------------
 */

import { renderAdminLayout } from '../../layouts/admin-layout.js';
import {
  getCollectionList,
  getDocument,
  getSubcollectionList,
  createAdminDocument,
  updateDocument,
  deleteDocument,
  createSubcollectionDocument,
  deleteSubcollectionDocument,
  logActivity,
} from '../../services/firestore.service.js';
import { uploadFile, buildStoragePath } from '../../services/storage.service.js';
import { escapeHTML, qs, qsa } from '../../utils/dom-helpers.js';

// Module-level, not component state: only one admin page renders at a time
// in this SPA, so stashing the signed-in admin here (for activity logging)
// avoids threading authState through every nested function call.
let currentAuthState = null;

export function renderGalleryAdmin(root, authState) {
  currentAuthState = authState;

  const contentHTML = `
    <div class="admin-page-header">
      <div>
        <h1>Manage Gallery</h1>
        <p class="admin-content__subtitle">Add, edit, and remove photo albums.</p>
      </div>
      <button type="button" class="btn btn-primary" id="album-add-btn">+ Add Album</button>
    </div>

    <div id="album-form-wrap" class="card" hidden></div>
    <div id="photos-view-wrap"></div>
    <div id="album-list-wrap" aria-live="polite">
      <div class="state-message">
        <div class="state-spinner" role="status" aria-label="Loading"></div>
        Loading…
      </div>
    </div>`;

  renderAdminLayout(root, {
    activePath: '/admin/gallery',
    user: authState.user,
    role: authState.role,
    contentHTML,
  });

  const pageRoot = qs('#admin-page-content', root);
  qs('#album-add-btn', pageRoot).addEventListener('click', () => showAlbumForm(pageRoot, null));

  loadAlbumList(pageRoot);
}

// ---------------------------------------------------------------------
// ALBUM LIST
// ---------------------------------------------------------------------

async function loadAlbumList(pageRoot) {
  const listWrap = qs('#album-list-wrap', pageRoot);

  try {
    const albums = await getCollectionList('galleryAlbums', {
      orderByField: 'createdAt',
      orderDirection: 'desc',
    });

    if (albums.length === 0) {
      listWrap.innerHTML = `<p class="state-message">No albums yet — click "Add Album" to create the first one.</p>`;
      return;
    }

    listWrap.innerHTML = `
      <div class="admin-table-wrap card">
        <table class="admin-table">
          <thead><tr><th>Title</th><th>Description</th><th>Actions</th></tr></thead>
          <tbody>
            ${albums
              .map(
                (album) => `
                <tr>
                  <td>${escapeHTML(album.title || '')}</td>
                  <td>${escapeHTML(album.description || '')}</td>
                  <td class="admin-table__actions">
                    <button type="button" class="btn btn-outline album-photos-btn" data-id="${album.id}">Manage Photos</button>
                    <button type="button" class="btn btn-outline album-edit-btn" data-id="${album.id}">Edit</button>
                    <button type="button" class="btn btn-outline album-delete-btn" data-id="${album.id}">Delete</button>
                  </td>
                </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>`;

    qsa('.album-photos-btn', listWrap).forEach((btn) =>
      btn.addEventListener('click', () => showPhotosView(pageRoot, btn.dataset.id))
    );
    qsa('.album-edit-btn', listWrap).forEach((btn) => {
      const album = albums.find((a) => a.id === btn.dataset.id);
      btn.addEventListener('click', () => showAlbumForm(pageRoot, album));
    });
    qsa('.album-delete-btn', listWrap).forEach((btn) =>
      btn.addEventListener('click', () => handleAlbumDelete(pageRoot, btn.dataset.id))
    );
  } catch (error) {
    listWrap.innerHTML = `
      <p class="state-message state-message--error">
        Couldn't load albums right now. Please refresh the page.
      </p>`;
  }
}

async function handleAlbumDelete(pageRoot, albumId) {
  // eslint-disable-next-line no-alert
  const confirmed = window.confirm(
    'Delete this album? Its photos will remain in Storage but will no longer be listed. This cannot be undone.'
  );
  if (!confirmed) {
    return;
  }

  try {
    await deleteDocument('galleryAlbums', albumId);
    logActivity({
      adminId: currentAuthState.user?.uid,
      adminEmail: currentAuthState.user?.email,
      action: 'delete',
      targetCollection: 'galleryAlbums',
      targetId: albumId,
    });
    await loadAlbumList(pageRoot);
  } catch (error) {
    // eslint-disable-next-line no-alert
    window.alert("Couldn't delete this album. Please try again.");
  }
}

// ---------------------------------------------------------------------
// ALBUM ADD/EDIT FORM
// ---------------------------------------------------------------------

function showAlbumForm(pageRoot, existingAlbum) {
  const formWrap = qs('#album-form-wrap', pageRoot);
  qs('#photos-view-wrap', pageRoot).innerHTML = '';
  const isEdit = Boolean(existingAlbum);

  formWrap.hidden = false;
  formWrap.innerHTML = `
    <h2>${isEdit ? 'Edit Album' : 'Add Album'}</h2>
    <div id="album-form-status"></div>
    <form id="album-form" novalidate>
      <div class="form-field">
        <label class="form-label" for="album-title">Title</label>
        <input class="form-input" type="text" id="album-title" name="title" value="${escapeHTML(existingAlbum?.title || '')}" required />
        <span class="form-error-text" id="album-title-error"></span>
      </div>
      <div class="form-field">
        <label class="form-label" for="album-description">Description</label>
        <textarea class="form-textarea" id="album-description" name="description">${escapeHTML(existingAlbum?.description || '')}</textarea>
      </div>
      <div class="form-field">
        <label class="form-label" for="album-cover">Cover Image</label>
        ${existingAlbum?.coverImageUrl ? `<p class="text-sm"><a href="${existingAlbum.coverImageUrl}" target="_blank" rel="noopener noreferrer">View current cover</a></p>` : ''}
        <input class="form-input" type="file" id="album-cover" name="coverFile" accept="image/*" />
      </div>
      <div class="admin-form-actions">
        <button type="submit" class="btn btn-primary" id="album-submit-btn">Save</button>
        <button type="button" class="btn btn-outline" id="album-cancel-btn">Cancel</button>
      </div>
    </form>`;

  qs('#album-cancel-btn', formWrap).addEventListener('click', () => {
    formWrap.hidden = true;
    formWrap.innerHTML = '';
  });

  qs('#album-form', formWrap).addEventListener('submit', async (event) => {
    event.preventDefault();
    const statusEl = qs('#album-form-status', formWrap);
    const submitBtn = qs('#album-submit-btn', formWrap);
    const titleInput = qs('#album-title', formWrap);

    if (!titleInput.value.trim()) {
      titleInput.classList.add('has-error');
      qs('#album-title-error', formWrap).textContent = 'Title is required.';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving…';

    const values = {
      title: titleInput.value,
      description: qs('#album-description', formWrap).value,
    };
    const coverFile = qs('#album-cover', formWrap).files[0];

    try {
      const albumId = isEdit
        ? existingAlbum.id
        : await createAdminDocument('galleryAlbums', values);

      if (coverFile) {
        const url = await uploadFile(buildStoragePath('gallery', albumId, 'cover.jpg'), coverFile);
        await updateDocument('galleryAlbums', albumId, { ...values, coverImageUrl: url });
      } else if (isEdit) {
        await updateDocument('galleryAlbums', albumId, values);
      }

      logActivity({
        adminId: currentAuthState.user?.uid,
        adminEmail: currentAuthState.user?.email,
        action: isEdit ? 'update' : 'create',
        targetCollection: 'galleryAlbums',
        targetId: albumId,
      });

      formWrap.hidden = true;
      formWrap.innerHTML = '';
      await loadAlbumList(pageRoot);
    } catch (error) {
      statusEl.innerHTML = `<div class="form-status form-status--error">Something went wrong saving this album. Please try again.</div>`;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save';
    }
  });

  formWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---------------------------------------------------------------------
// MANAGE PHOTOS (album's images subcollection)
// ---------------------------------------------------------------------

async function showPhotosView(pageRoot, albumId) {
  qs('#album-form-wrap', pageRoot).hidden = true;
  const wrap = qs('#photos-view-wrap', pageRoot);
  wrap.innerHTML = `
    <div class="card" style="margin-bottom: var(--space-5);">
      <div class="state-message"><div class="state-spinner" role="status" aria-label="Loading"></div></div>
    </div>`;

  try {
    const album = await getDocument('galleryAlbums', albumId);
    const images = await getSubcollectionList('galleryAlbums', albumId, 'images', {
      orderByField: 'order',
    });

    wrap.innerHTML = `
      <div class="card" style="margin-bottom: var(--space-5);">
        <div class="admin-page-header">
          <h2>Photos — ${escapeHTML(album?.title || '')}</h2>
          <button type="button" class="btn btn-outline" id="photos-close-btn">Back to Albums</button>
        </div>

        <div id="add-photo-status"></div>
        <form id="add-photo-form" novalidate>
          <div class="form-row">
            <div class="form-field">
              <label class="form-label" for="photo-file">Photo</label>
              <input class="form-input" type="file" id="photo-file" name="photoFile" accept="image/*" required />
            </div>
            <div class="form-field">
              <label class="form-label" for="photo-caption">Caption (optional)</label>
              <input class="form-input" type="text" id="photo-caption" name="caption" />
            </div>
          </div>
          <button type="submit" class="btn btn-primary" id="add-photo-btn">Add Photo</button>
        </form>
      </div>

      <div id="photo-grid-wrap"></div>`;

    qs('#photos-close-btn', wrap).addEventListener('click', () => {
      wrap.innerHTML = '';
      loadAlbumList(pageRoot);
    });

    renderPhotoGrid(pageRoot, wrap, albumId, images);
    initAddPhotoForm(pageRoot, wrap, albumId, images);
  } catch (error) {
    wrap.innerHTML = `
      <p class="state-message state-message--error">
        Couldn't load this album's photos right now. Please refresh the page.
      </p>`;
  }
}

function renderPhotoGrid(pageRoot, wrap, albumId, images) {
  const gridWrap = qs('#photo-grid-wrap', wrap);

  if (images.length === 0) {
    gridWrap.innerHTML = `<p class="state-message">No photos in this album yet.</p>`;
    return;
  }

  gridWrap.innerHTML = `
    <div class="gallery-grid">
      ${images
        .map(
          (image) => `
          <div class="card" style="padding: var(--space-2);">
            <img src="${image.imageUrl}" alt="${escapeHTML(image.caption || '')}" style="width: 100%; aspect-ratio: 1/1; object-fit: cover; border-radius: var(--radius-sm);" />
            <p class="text-sm" style="margin-top: var(--space-2);">${escapeHTML(image.caption || '')}</p>
            <button type="button" class="btn btn-outline photo-delete-btn" data-id="${image.id}" style="width: 100%; margin-top: var(--space-2);">
              Delete
            </button>
          </div>`
        )
        .join('')}
    </div>`;

  qsa('.photo-delete-btn', gridWrap).forEach((btn) => {
    btn.addEventListener('click', async () => {
      // eslint-disable-next-line no-alert
      if (!window.confirm('Delete this photo?')) {
        return;
      }
      try {
        await deleteSubcollectionDocument('galleryAlbums', albumId, 'images', btn.dataset.id);
        logActivity({
          adminId: currentAuthState.user?.uid,
          adminEmail: currentAuthState.user?.email,
          action: 'delete',
          targetCollection: 'galleryAlbums/images',
          targetId: btn.dataset.id,
        });
        await showPhotosView(pageRoot, albumId);
      } catch (error) {
        // eslint-disable-next-line no-alert
        window.alert("Couldn't delete this photo. Please try again.");
      }
    });
  });
}

function initAddPhotoForm(pageRoot, wrap, albumId, existingImages) {
  const form = qs('#add-photo-form', wrap);
  const statusEl = qs('#add-photo-status', wrap);
  const submitBtn = qs('#add-photo-btn', wrap);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    statusEl.innerHTML = '';

    const file = qs('#photo-file', wrap).files[0];
    if (!file) {
      statusEl.innerHTML = `<div class="form-status form-status--error">Please choose a photo to upload.</div>`;
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Uploading…';

    try {
      const nextOrder = existingImages.length;
      const fileName = `${Date.now()}-${file.name}`;
      const url = await uploadFile(`gallery/${albumId}/${fileName}`, file);

      await createSubcollectionDocument('galleryAlbums', albumId, 'images', {
        imageUrl: url,
        caption: qs('#photo-caption', wrap).value,
        order: nextOrder,
      });

      logActivity({
        adminId: currentAuthState.user?.uid,
        adminEmail: currentAuthState.user?.email,
        action: 'create',
        targetCollection: 'galleryAlbums/images',
        targetId: albumId,
      });

      await showPhotosView(pageRoot, albumId);
    } catch (error) {
      statusEl.innerHTML = `<div class="form-status form-status--error">Something went wrong uploading this photo. Please try again.</div>`;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Add Photo';
    }
  });
}
