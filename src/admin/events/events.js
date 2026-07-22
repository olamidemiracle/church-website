/**
 * admin/events/events.js
 * -----------------------------------------------------------------------
 * Manage Events — configures the generic CRUD engine for the `events`
 * collection. (RSVPs, the events/{id}/rsvps subcollection, are viewed
 * from the public Event Detail page's data — a dedicated "view RSVPs"
 * admin view is Phase 7 work, not part of this CRUD module.)
 * -----------------------------------------------------------------------
 */

import { renderCrudPage } from '../shared/crud-page.js';
import {
  formatDate,
  toDateTimeLocalInputValue,
  fromDateInputValue,
} from '../../utils/formatters.js';

const CONFIG = {
  collectionName: 'events',
  title: 'Manage Events',
  subtitle: 'Add, edit, and remove upcoming and past events.',
  orderByField: 'startDate',
  orderDirection: 'desc',
  columns: [
    { key: 'title', label: 'Title' },
    { key: 'category', label: 'Category' },
    { key: 'location', label: 'Location' },
    { key: 'startDate', label: 'Start Date', format: formatDate },
  ],
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'slug', label: 'Slug (e.g. fall-festival)', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    {
      name: 'startDate',
      label: 'Start Date & Time',
      type: 'datetime-local',
      required: true,
      transformIn: toDateTimeLocalInputValue,
      transformOut: fromDateInputValue,
    },
    {
      name: 'endDate',
      label: 'End Date & Time',
      type: 'datetime-local',
      transformIn: toDateTimeLocalInputValue,
      transformOut: fromDateInputValue,
    },
    { name: 'location', label: 'Location', type: 'text' },
    { name: 'category', label: 'Category', type: 'text' },
    { name: 'isFeatured', label: 'Feature this event on the homepage', type: 'checkbox' },
    {
      name: 'imageFile',
      label: 'Event Image',
      type: 'file',
      accept: 'image/*',
      storageFileName: 'cover.jpg',
      urlField: 'imageUrl',
    },
  ],
};

export function renderEventsAdmin(root, authState) {
  renderCrudPage(root, authState, '/admin/events', CONFIG);
}
