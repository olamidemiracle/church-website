/**
 * pages/home/home.js
 * -----------------------------------------------------------------------
 * Home page logic: mounts the shared header/footer, then renders two
 * dynamic sections — a service-times snapshot (from settings/general) and
 * a preview of the first 3 ministries (from the `ministries` collection).
 * -----------------------------------------------------------------------
 */

import { mountPublicLayout } from '../../layouts/public-layout.js';
import { getCollectionList } from '../../services/firestore.service.js';
import { setPageMeta } from '../../utils/seo.js';
import { injectStructuredData } from '../../utils/structured-data.js';
import { escapeHTML, qs } from '../../utils/dom-helpers.js';

setPageMeta({
  title: 'Home | Petals Global Church',
  description: 'Welcome home. Join us for worship, community, and growth.',
});

/**
 * Placeholder content shown ONLY when Firestore has no real data yet
 * (empty serviceTimes[] / empty `ministries` collection). The moment real
 * entries are added via the admin panel, this is bypassed automatically —
 * see the `.length === 0` checks below. Safe to leave in; it just makes
 * demos/client walkthroughs look finished instead of empty before real
 * content is entered.
 */
const PLACEHOLDER_SERVICE_TIMES = [
  { day: 'Sunday', time: '9:00 AM', label: 'First Service' },
  { day: 'Sunday', time: '11:00 AM', label: 'Second Service' },
  { day: 'Wednesday', time: '6:00 PM', label: 'Bible Study' },
  { day: 'Friday', time: '6:30 PM', label: 'Prayer Meeting' },
];

const PLACEHOLDER_MINISTRIES = [
  {
    name: 'Worship & Music',
    description:
      'Leading the congregation into God\u2019s presence through song, sound, and heartfelt praise every service.',
    slug: 'worship-music',
  },
  {
    name: 'Youth Ministry',
    description:
      'A vibrant space for teens and young adults to grow in faith, friendship, and purpose together.',
    slug: 'youth-ministry',
  },
  {
    name: 'Outreach & Missions',
    description:
      'Serving our community and beyond with practical love, food drives, and mission partnerships.',
    slug: 'outreach-missions',
  },
];

async function init() {
  const settings = await mountPublicLayout();
  renderStructuredData(settings);
  renderServiceSnapshot(settings);
  await renderMinistriesPreview();
}

/** Emits Schema.org Church/Organization structured data from settings/general. */
function renderStructuredData(settings) {
  if (!settings) {
    return;
  }

  injectStructuredData({
    '@context': 'https://schema.org',
    '@type': 'Church',
    name: settings.churchName || 'Petals Global Church',
    address: settings.address || undefined,
    telephone: settings.phone || undefined,
    email: settings.email || undefined,
    url: window.location.origin,
  });
}

/** Renders up to 4 upcoming service times from settings/general.serviceTimes[]. */
function renderServiceSnapshot(settings) {
  const target = qs('#service-times-snapshot');
  if (!target) {
    return;
  }

  const serviceTimes = Array.isArray(settings?.serviceTimes) ? settings.serviceTimes : [];
  const isPlaceholder = serviceTimes.length === 0;
  const items = isPlaceholder ? PLACEHOLDER_SERVICE_TIMES : serviceTimes;

  target.innerHTML = items
    .slice(0, 4)
    .map(
      (service) => `
        <div class="card service-snapshot__item">
          <p class="service-snapshot__day">${escapeHTML(service.day || '')}</p>
          <p class="service-snapshot__time">${escapeHTML(service.time || '')}</p>
          <p class="text-sm">${escapeHTML(service.label || '')}</p>
        </div>`
    )
    .join('');

  if (isPlaceholder) {
    // eslint-disable-next-line no-console
    console.info(
      '[home] Showing placeholder service times — add real ones in Admin \u2192 Settings \u2192 Service Times.'
    );
  }
}

/** Renders the first 3 ministries (by `order` field) as preview cards. */
async function renderMinistriesPreview() {
  const target = qs('#ministries-preview');
  if (!target) {
    return;
  }

  try {
    const ministries = await getCollectionList('ministries', {
      orderByField: 'order',
      limit: 3,
    });

    if (ministries.length === 0) {
      target.innerHTML = PLACEHOLDER_MINISTRIES.map(renderMinistryCard).join('');
      // eslint-disable-next-line no-console
      console.info(
        '[home] Showing placeholder ministries — add real ones in Admin \u2192 Ministries.'
      );
      return;
    }

    target.innerHTML = ministries.map(renderMinistryCard).join('');
  } catch (error) {
    target.innerHTML = `
      <p class="state-message state-message--error">
        We couldn't load ministries right now. Please refresh the page.
      </p>`;
  }
}

function renderMinistryCard(ministry) {
  const image = ministry.imageUrl || '';
  const name = escapeHTML(ministry.name || 'Ministry');
  const description = escapeHTML(ministry.description || '');
  const slug = escapeHTML(ministry.slug || ministry.id);

  return `
    <a href="/ministries/detail?slug=${encodeURIComponent(slug)}" class="card entity-card">
      ${image ? `<img class="entity-card__image" src="${image}" alt="${name}" loading="lazy" />` : ''}
      <div class="entity-card__body">
        <h3 class="entity-card__title">${name}</h3>
        <p class="entity-card__desc">${description}</p>
        <span class="entity-card__link">Learn more →</span>
      </div>
    </a>`;
}

init();
