/**
 * admin/leadership/leadership.js
 * -----------------------------------------------------------------------
 * Manage Leadership — configures the generic CRUD engine for the
 * `leadership` collection.
 * -----------------------------------------------------------------------
 */

import { renderCrudPage } from '../shared/crud-page.js';

const CONFIG = {
  collectionName: 'leadership',
  title: 'Manage Leadership',
  subtitle: 'Add, edit, and remove pastors, ministers, and elders.',
  orderByField: 'order',
  orderDirection: 'asc',
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'title', label: 'Title' },
    { key: 'order', label: 'Order' },
  ],
  fields: [
    { name: 'name', label: 'Full Name', type: 'text', required: true },
    { name: 'title', label: 'Title / Role', type: 'text', required: true },
    { name: 'bio', label: 'Bio', type: 'textarea' },
    {
      name: 'order',
      label: 'Display Order (lower shows first)',
      type: 'number',
      transformOut: (v) => (v === '' ? 0 : Number(v)),
    },
    {
      name: 'photoFile',
      label: 'Photo',
      type: 'file',
      accept: 'image/*',
      storageFileName: 'photo.jpg',
      urlField: 'photoUrl',
    },
  ],
};

export function renderLeadershipAdmin(root, authState) {
  renderCrudPage(root, authState, '/admin/leadership', CONFIG);
}
