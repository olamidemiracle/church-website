/**
 * admin/ministries/ministries.js
 * -----------------------------------------------------------------------
 * Manage Ministries — configures the generic CRUD engine for the
 * `ministries` collection.
 * -----------------------------------------------------------------------
 */

import { renderCrudPage } from '../shared/crud-page.js';

const CONFIG = {
  collectionName: 'ministries',
  title: 'Manage Ministries',
  subtitle: 'Add, edit, and remove ministries.',
  orderByField: 'order',
  orderDirection: 'asc',
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'leaderName', label: 'Leader' },
    { key: 'meetingTime', label: 'Meeting Time' },
    { key: 'order', label: 'Order' },
  ],
  fields: [
    { name: 'name', label: 'Ministry Name', type: 'text', required: true },
    { name: 'slug', label: 'Slug (e.g. youth-ministry)', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'leaderName', label: 'Leader Name', type: 'text' },
    { name: 'meetingTime', label: 'Meeting Time', type: 'text' },
    {
      name: 'order',
      label: 'Display Order (lower shows first)',
      type: 'number',
      transformOut: (v) => (v === '' ? 0 : Number(v)),
    },
    {
      name: 'imageFile',
      label: 'Ministry Image',
      type: 'file',
      accept: 'image/*',
      storageFileName: 'cover.jpg',
      urlField: 'imageUrl',
    },
  ],
};

export function renderMinistriesAdmin(root, authState) {
  renderCrudPage(root, authState, '/admin/ministries', CONFIG);
}
