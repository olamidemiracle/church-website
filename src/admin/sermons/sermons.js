/**
 * admin/sermons/sermons.js
 * -----------------------------------------------------------------------
 * Manage Sermons — configures the generic CRUD engine (see
 * admin/shared/crud-page.js) for the `sermons` collection.
 * -----------------------------------------------------------------------
 */

import { renderCrudPage } from '../shared/crud-page.js';
import { formatDateShort, toDateInputValue, fromDateInputValue } from '../../utils/formatters.js';

const CONFIG = {
  collectionName: 'sermons',
  title: 'Manage Sermons',
  subtitle: 'Add, edit, and remove sermon videos, audio, and notes.',
  orderByField: 'date',
  orderDirection: 'desc',
  columns: [
    { key: 'title', label: 'Title' },
    { key: 'speaker', label: 'Speaker' },
    { key: 'series', label: 'Series' },
    { key: 'date', label: 'Date', format: formatDateShort },
  ],
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'slug', label: 'Slug (e.g. finding-peace)', type: 'text', required: true },
    { name: 'speaker', label: 'Speaker', type: 'text' },
    { name: 'series', label: 'Series', type: 'text' },
    {
      name: 'date',
      label: 'Date',
      type: 'date',
      required: true,
      transformIn: toDateInputValue,
      transformOut: fromDateInputValue,
    },
    { name: 'videoUrl', label: 'YouTube Video URL', type: 'url' },
    {
      name: 'audioFile',
      label: 'Audio File (MP3)',
      type: 'file',
      accept: 'audio/*',
      storageFileName: 'audio.mp3',
      urlField: 'audioUrl',
    },
    {
      name: 'pdfFile',
      label: 'Sermon Notes (PDF)',
      type: 'file',
      accept: 'application/pdf',
      storageFileName: 'notes.pdf',
      urlField: 'pdfUrl',
    },
    {
      name: 'thumbnailFile',
      label: 'Thumbnail Image',
      type: 'file',
      accept: 'image/*',
      storageFileName: 'thumbnail.jpg',
      urlField: 'thumbnailUrl',
    },
    { name: 'description', label: 'Description', type: 'textarea' },
    {
      name: 'tags',
      label: 'Tags (comma separated)',
      type: 'text',
      transformIn: (arr) => (Array.isArray(arr) ? arr.join(', ') : ''),
      transformOut: (str) =>
        str
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
    },
  ],
};

export function renderSermonsAdmin(root, authState) {
  renderCrudPage(root, authState, '/admin/sermons', CONFIG);
}
