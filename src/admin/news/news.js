/**
 * admin/news/news.js
 * -----------------------------------------------------------------------
 * Manage Announcements — configures the generic CRUD engine for the
 * `news` collection. `isPublished` gates public visibility (see the
 * firestore.rules fix from Phase 3) — leave it unchecked to save a draft.
 * -----------------------------------------------------------------------
 */

import { renderCrudPage } from '../shared/crud-page.js';
import { formatDate, toDateInputValue, fromDateInputValue } from '../../utils/formatters.js';

const CONFIG = {
  collectionName: 'news',
  title: 'Manage Announcements',
  subtitle: 'Add, edit, and remove news and announcements.',
  orderByField: 'publishDate',
  orderDirection: 'desc',
  columns: [
    { key: 'title', label: 'Title' },
    { key: 'author', label: 'Author' },
    { key: 'publishDate', label: 'Publish Date', format: formatDate },
    { key: 'isPublished', label: 'Published', format: (v) => (v ? 'Yes' : 'No (draft)') },
  ],
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'slug', label: 'Slug (e.g. building-fund-update)', type: 'text', required: true },
    { name: 'body', label: 'Body', type: 'textarea', required: true },
    { name: 'author', label: 'Author', type: 'text' },
    {
      name: 'publishDate',
      label: 'Publish Date',
      type: 'date',
      required: true,
      transformIn: toDateInputValue,
      transformOut: fromDateInputValue,
    },
    { name: 'isPublished', label: 'Published (visible on the public site)', type: 'checkbox' },
    {
      name: 'imageFile',
      label: 'Cover Image',
      type: 'file',
      accept: 'image/*',
      storageFileName: 'cover.jpg',
      urlField: 'imageUrl',
    },
  ],
};

export function renderNewsAdmin(root, authState) {
  renderCrudPage(root, authState, '/admin/news', CONFIG);
}
