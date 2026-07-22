/**
 * admin/shared/crud-page.js
 * -----------------------------------------------------------------------
 * A generic, config-driven "list + form" page builder shared by every
 * admin content module (Manage Sermons, Manage Events, Manage Ministries,
 * Manage Leadership, Manage Announcements). Each module just describes
 * its collection's columns/fields — this file handles the actual list
 * rendering, create/edit form, Storage file uploads, and delete
 * confirmation, so that logic isn't duplicated eight times over.
 *
 * Gallery (nested album/image structure) and Testimonies (approval
 * workflow) and Settings (single document) don't fit this generic list
 * shape and have their own dedicated render files instead.
 *
 * ---------------------------------------------------------------------
 * CONFIG SHAPE
 * ---------------------------------------------------------------------
 * {
 *   collectionName: 'sermons',
 *   title: 'Manage Sermons',
 *   subtitle: 'Add, edit, and remove sermons.',
 *   orderByField: 'date',
 *   orderDirection: 'desc',
 *   columns: [{ key: 'title', label: 'Title' }, { key: 'speaker', label: 'Speaker' }],
 *   fields: [
 *     { name: 'title', label: 'Title', type: 'text', required: true },
 *     { name: 'date', label: 'Date', type: 'date', required: true },
 *     { name: 'description', label: 'Description', type: 'textarea' },
 *     { name: 'isFeatured', label: 'Featured', type: 'checkbox' },
 *     {
 *       name: 'thumbnailFile', label: 'Thumbnail Image', type: 'file',
 *       accept: 'image/*', storageFileName: 'thumbnail.jpg', urlField: 'thumbnailUrl',
 *     },
 *   ],
 * }
 *
 * Field types: 'text' | 'textarea' | 'date' | 'number' | 'url' | 'checkbox' | 'file'
 * A 'file' field uploads to storage path `{collectionName}/{docId}/{storageFileName}`
 * and stores the resulting download URL on `urlField`.
 * -----------------------------------------------------------------------
 */

import {
  getCollectionList,
  createAdminDocument,
  updateDocument,
  deleteDocument,
} from '../../services/firestore.service.js';
import { uploadFile, buildStoragePath } from '../../services/storage.service.js';
import { renderAdminLayout } from '../../layouts/admin-layout.js';
import { escapeHTML, qs, qsa } from '../../utils/dom-helpers.js';
import { isRequired, validateForm } from '../../utils/validators.js';

export function renderCrudPage(root, authState, activePath, config) {
  const contentHTML = `
    <div class="admin-page-header">
      <div>
        <h1>${config.title}</h1>
        <p class="admin-content__subtitle">${config.subtitle || ''}</p>
      </div>
      <button type="button" class="btn btn-primary" id="crud-add-btn">+ Add New</button>
    </div>

    <div id="crud-form-wrap" class="card" hidden></div>

    <div id="crud-list-wrap" aria-live="polite">
      <div class="state-message">
        <div class="state-spinner" role="status" aria-label="Loading"></div>
        Loading…
      </div>
    </div>`;

  renderAdminLayout(root, { activePath, user: authState.user, role: authState.role, contentHTML });

  const pageRoot = qs('#admin-page-content', root);
  qs('#crud-add-btn', pageRoot).addEventListener('click', () => showForm(pageRoot, config, null));

  loadList(pageRoot, config);
}

async function loadList(pageRoot, config) {
  const listWrap = qs('#crud-list-wrap', pageRoot);

  try {
    const items = await getCollectionList(config.collectionName, {
      orderByField: config.orderByField,
      orderDirection: config.orderDirection || 'asc',
    });

    if (items.length === 0) {
      listWrap.innerHTML = `<p class="state-message">No items yet — click "Add New" to create the first one.</p>`;
      return;
    }

    renderTable(pageRoot, config, items);
  } catch (error) {
    listWrap.innerHTML = `
      <p class="state-message state-message--error">
        Couldn't load this list right now. Please refresh the page.
      </p>`;
  }
}

function renderTable(pageRoot, config, items) {
  const listWrap = qs('#crud-list-wrap', pageRoot);

  const headerCells = config.columns.map((col) => `<th>${escapeHTML(col.label)}</th>`).join('');
  const rows = items
    .map((item) => {
      const cells = config.columns
        .map((col) => {
          const raw = item[col.key];
          const value = col.format ? col.format(raw, item) : raw;
          return `<td>${escapeHTML(value ?? '')}</td>`;
        })
        .join('');
      return `
        <tr data-id="${item.id}">
          ${cells}
          <td class="admin-table__actions">
            <button type="button" class="btn btn-outline admin-edit-btn" data-id="${item.id}">Edit</button>
            <button type="button" class="btn btn-outline admin-delete-btn" data-id="${item.id}">Delete</button>
          </td>
        </tr>`;
    })
    .join('');

  listWrap.innerHTML = `
    <div class="admin-table-wrap card">
      <table class="admin-table">
        <thead><tr>${headerCells}<th>Actions</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;

  qsa('.admin-edit-btn', listWrap).forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = items.find((i) => i.id === btn.dataset.id);
      showForm(pageRoot, config, item);
    });
  });

  qsa('.admin-delete-btn', listWrap).forEach((btn) => {
    btn.addEventListener('click', () => handleDelete(pageRoot, config, btn.dataset.id));
  });
}

async function handleDelete(pageRoot, config, id) {
  // eslint-disable-next-line no-alert
  const confirmed = window.confirm('Delete this item? This cannot be undone.');
  if (!confirmed) {
    return;
  }

  try {
    await deleteDocument(config.collectionName, id);
    await loadList(pageRoot, config);
  } catch (error) {
    // eslint-disable-next-line no-alert
    window.alert("Couldn't delete this item. Please try again.");
  }
}

function showForm(pageRoot, config, existingItem) {
  const formWrap = qs('#crud-form-wrap', pageRoot);
  const isEdit = Boolean(existingItem);

  formWrap.hidden = false;
  formWrap.innerHTML = `
    <h2>${isEdit ? 'Edit' : 'Add New'}</h2>
    <div id="crud-form-status"></div>
    <form id="crud-form" novalidate>
      ${config.fields.map((field) => renderField(field, existingItem)).join('')}
      <div class="admin-form-actions">
        <button type="submit" class="btn btn-primary" id="crud-submit-btn">Save</button>
        <button type="button" class="btn btn-outline" id="crud-cancel-btn">Cancel</button>
      </div>
    </form>`;

  qs('#crud-cancel-btn', formWrap).addEventListener('click', () => {
    formWrap.hidden = true;
    formWrap.innerHTML = '';
  });

  initFormSubmit(pageRoot, config, existingItem);
  formWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderField(field, existingItem) {
  const value = existingItem?.[field.name] ?? '';
  const id = `crud-field-${field.name}`;

  if (field.type === 'textarea') {
    return `
      <div class="form-field">
        <label class="form-label" for="${id}">${escapeHTML(field.label)}</label>
        <textarea class="form-textarea" id="${id}" name="${field.name}" ${field.required ? 'required' : ''}>${escapeHTML(value)}</textarea>
        <span class="form-error-text" id="${id}-error"></span>
      </div>`;
  }

  if (field.type === 'checkbox') {
    return `
      <div class="form-field">
        <label class="form-checkbox">
          <input type="checkbox" id="${id}" name="${field.name}" ${value ? 'checked' : ''} />
          ${escapeHTML(field.label)}
        </label>
      </div>`;
  }

  if (field.type === 'file') {
    const currentUrl = existingItem?.[field.urlField];
    return `
      <div class="form-field">
        <label class="form-label" for="${id}">${escapeHTML(field.label)}</label>
        ${currentUrl ? `<p class="text-sm"><a href="${currentUrl}" target="_blank" rel="noopener noreferrer">View current file</a></p>` : ''}
        <input class="form-input" type="file" id="${id}" name="${field.name}" accept="${field.accept || ''}" />
        <span class="form-error-text" id="${id}-error"></span>
      </div>`;
  }

  // text | date | number | url
  return `
    <div class="form-field">
      <label class="form-label" for="${id}">${escapeHTML(field.label)}</label>
      <input
        class="form-input"
        type="${field.type === 'url' ? 'text' : field.type}"
        id="${id}"
        name="${field.name}"
        value="${escapeHTML(field.transformIn ? field.transformIn(value) : value)}"
        ${field.required ? 'required' : ''}
      />
      <span class="form-error-text" id="${id}-error"></span>
    </div>`;
}

function initFormSubmit(pageRoot, config, existingItem) {
  const form = qs('#crud-form', pageRoot);
  const statusEl = qs('#crud-form-status', pageRoot);
  const submitBtn = qs('#crud-submit-btn', pageRoot);
  const isEdit = Boolean(existingItem);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearFieldErrors(form, config);
    statusEl.innerHTML = '';

    const { values, errors } = collectAndValidate(form, config);
    if (Object.keys(errors).length > 0) {
      showFieldErrors(errors);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving…';

    try {
      const docId = isEdit
        ? existingItem.id
        : await createAdminDocument(config.collectionName, values.data);

      // Now that we have a docId (existing or freshly created), upload any
      // newly selected files and merge their resulting URLs in.
      const fileUpdates = await uploadSelectedFiles(config, docId, values.files);

      if (isEdit) {
        await updateDocument(config.collectionName, docId, { ...values.data, ...fileUpdates });
      } else if (Object.keys(fileUpdates).length > 0) {
        await updateDocument(config.collectionName, docId, fileUpdates);
      }

      qs('#crud-form-wrap', pageRoot).hidden = true;
      qs('#crud-form-wrap', pageRoot).innerHTML = '';
      await loadList(pageRoot, config);
    } catch (error) {
      statusEl.innerHTML = `
        <div class="form-status form-status--error">
          Something went wrong saving this item. Please try again.
        </div>`;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save';
    }
  });
}

/** Reads form values per field config, separating plain data from file inputs, and validates required fields. */
function collectAndValidate(form, config) {
  const data = {};
  const files = {};
  const schema = {};
  const rawValues = {};

  config.fields.forEach((field) => {
    const id = `crud-field-${field.name}`;

    if (field.type === 'file') {
      const input = form.querySelector(`#${id}`);
      if (input?.files?.[0]) {
        files[field.name] = input.files[0];
      }
      return;
    }

    if (field.type === 'checkbox') {
      data[field.name] = form.querySelector(`#${id}`).checked;
      return;
    }

    let value = form.querySelector(`#${id}`).value;
    if (field.transformOut) {
      value = field.transformOut(value);
    }
    data[field.name] = value;
    rawValues[field.name] = value;

    if (field.required) {
      schema[field.name] = [[isRequired, `${field.label} is required.`]];
    }
  });

  const { errors } = validateForm(rawValues, schema);
  return { values: { data, files }, errors };
}

/** Uploads every selected file to its conventional Storage path and returns { [urlField]: downloadUrl } for each. */
async function uploadSelectedFiles(config, docId, files) {
  const updates = {};

  for (const field of config.fields) {
    if (field.type !== 'file') {
      continue;
    }
    const file = files[field.name];
    if (!file) {
      continue;
    }

    const path = buildStoragePath(config.collectionName, docId, field.storageFileName);
    // eslint-disable-next-line no-await-in-loop
    const url = await uploadFile(path, file);
    updates[field.urlField] = url;
  }

  return updates;
}

function showFieldErrors(errors) {
  Object.entries(errors).forEach(([field, message]) => {
    const input = document.querySelector(`#crud-field-${field}`);
    const errorEl = document.querySelector(`#crud-field-${field}-error`);
    if (input) {
      input.classList.add('has-error');
    }
    if (errorEl) {
      errorEl.textContent = message;
    }
  });
}

function clearFieldErrors(form, config) {
  config.fields.forEach((field) => {
    const input = form.querySelector(`#crud-field-${field.name}`);
    const errorEl = form.querySelector(`#crud-field-${field.name}-error`);
    if (input) {
      input.classList.remove('has-error');
    }
    if (errorEl) {
      errorEl.textContent = '';
    }
  });
}
