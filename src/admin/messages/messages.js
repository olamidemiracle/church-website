/**
 * admin/messages/messages.js
 * -----------------------------------------------------------------------
 * View Contact Messages — inbox-style list of submissions from the
 * public Contact form. Clicking a message expands it and marks it read;
 * staff can then mark it replied, archive it, or delete it.
 * -----------------------------------------------------------------------
 */

import { renderAdminLayout } from '../../layouts/admin-layout.js';
import {
  getCollectionList,
  updateDocument,
  deleteDocument,
  logActivity,
} from '../../services/firestore.service.js';
import { escapeHTML, qs, qsa } from '../../utils/dom-helpers.js';
import { formatDate } from '../../utils/formatters.js';

const STATUS_LABELS = {
  unread: 'Unread',
  read: 'Read',
  replied: 'Replied',
  archived: 'Archived',
};

let currentAuthState = null;
let currentMessages = [];

export function renderMessagesAdmin(root, authState) {
  currentAuthState = authState;

  const contentHTML = `
    <h1>Contact Messages</h1>
    <p class="admin-content__subtitle">Messages submitted through the public Contact form.</p>
    <div id="messages-list-wrap" aria-live="polite">
      <div class="state-message">
        <div class="state-spinner" role="status" aria-label="Loading"></div>
        Loading…
      </div>
    </div>`;

  renderAdminLayout(root, {
    activePath: '/admin/messages',
    user: authState.user,
    role: authState.role,
    contentHTML,
  });

  loadMessages(qs('#admin-page-content', root));
}

async function loadMessages(pageRoot) {
  const listWrap = qs('#messages-list-wrap', pageRoot);

  try {
    currentMessages = await getCollectionList('contactMessages', {
      orderByField: 'submittedAt',
      orderDirection: 'desc',
    });

    if (currentMessages.length === 0) {
      listWrap.innerHTML = `<p class="state-message">No contact messages yet.</p>`;
      return;
    }

    listWrap.innerHTML = currentMessages.map(renderInboxRow).join('');

    qsa('.message-summary', listWrap).forEach((row) => {
      row.addEventListener('click', () => toggleMessage(pageRoot, row.dataset.id));
    });
    qsa('.message-reply-btn', listWrap).forEach((btn) => {
      btn.addEventListener('click', (event) => {
        event.stopPropagation();
        updateStatus(pageRoot, btn.dataset.id, 'replied');
      });
    });
    qsa('.message-archive-btn', listWrap).forEach((btn) => {
      btn.addEventListener('click', (event) => {
        event.stopPropagation();
        updateStatus(pageRoot, btn.dataset.id, 'archived');
      });
    });
    qsa('.message-delete-btn', listWrap).forEach((btn) => {
      btn.addEventListener('click', (event) => {
        event.stopPropagation();
        handleDelete(pageRoot, btn.dataset.id);
      });
    });
  } catch (error) {
    listWrap.innerHTML = `
      <p class="state-message state-message--error">
        Couldn't load contact messages right now. Please refresh the page.
      </p>`;
  }
}

function renderInboxRow(message) {
  const status = message.status || 'unread';
  const isUnread = status === 'unread';

  return `
    <div class="card" style="margin-bottom: var(--space-3); padding: 0;">
      <div
        class="message-summary"
        data-id="${message.id}"
        style="display: flex; justify-content: space-between; align-items: center; gap: var(--space-4); padding: var(--space-4); cursor: pointer; ${isUnread ? 'font-weight: 600;' : ''}"
      >
        <div style="min-width: 0;">
          <p style="margin: 0;">${escapeHTML(message.name || '')} — ${escapeHTML(message.subject || '(no subject)')}</p>
          <p class="text-sm" style="margin: 0;">${escapeHTML(message.email || '')} · ${formatDate(message.submittedAt)}</p>
        </div>
        <span class="pill${isUnread ? ' pill--accent' : ''}">${STATUS_LABELS[status] || status}</span>
      </div>
      <div class="message-detail" data-id="${message.id}" hidden style="padding: 0 var(--space-4) var(--space-4);">
        <p style="margin-bottom: var(--space-4);">${escapeHTML(message.message || '')}</p>
        <div class="admin-table__actions">
          <button type="button" class="btn btn-outline message-reply-btn" data-id="${message.id}">Mark Replied</button>
          <button type="button" class="btn btn-outline message-archive-btn" data-id="${message.id}">Archive</button>
          <button type="button" class="btn btn-outline message-delete-btn" data-id="${message.id}">Delete</button>
        </div>
      </div>
    </div>`;
}

function toggleMessage(pageRoot, id) {
  const detail = pageRoot.querySelector(`.message-detail[data-id="${id}"]`);
  if (!detail) {
    return;
  }

  const wasHidden = detail.hidden;
  detail.hidden = !wasHidden;

  // Mark read the first time it's opened, if currently unread.
  const message = currentMessages.find((m) => m.id === id);
  if (wasHidden && message && (message.status || 'unread') === 'unread') {
    updateStatus(pageRoot, id, 'read', { skipReload: true });
    message.status = 'read';
  }
}

async function updateStatus(pageRoot, id, status, { skipReload = false } = {}) {
  try {
    await updateDocument('contactMessages', id, { status });
    logActivity({
      adminId: currentAuthState.user?.uid,
      adminEmail: currentAuthState.user?.email,
      action: `status:${status}`,
      targetCollection: 'contactMessages',
      targetId: id,
    });
    if (!skipReload) {
      await loadMessages(pageRoot);
    }
  } catch (error) {
    // eslint-disable-next-line no-alert
    window.alert("Couldn't update this message. Please try again.");
  }
}

async function handleDelete(pageRoot, id) {
  // eslint-disable-next-line no-alert
  const confirmed = window.confirm('Delete this message permanently?');
  if (!confirmed) {
    return;
  }

  try {
    await deleteDocument('contactMessages', id);
    logActivity({
      adminId: currentAuthState.user?.uid,
      adminEmail: currentAuthState.user?.email,
      action: 'delete',
      targetCollection: 'contactMessages',
      targetId: id,
    });
    await loadMessages(pageRoot);
  } catch (error) {
    // eslint-disable-next-line no-alert
    window.alert("Couldn't delete this message. Please try again.");
  }
}
