/**
 * pages/sermons/detail/detail.js
 * -----------------------------------------------------------------------
 * Single reusable template for every sermon's detail view, chosen via
 * ?slug= (e.g. /sermons/detail?slug=finding-peace). Renders whichever
 * media is available: YouTube video embed, native audio player, and/or
 * a PDF notes download link — matching the "Sermons (Video, Audio, PDF
 * Notes)" requirement.
 * -----------------------------------------------------------------------
 */

import { mountPublicLayout } from '../../../layouts/public-layout.js';
import { getDocumentByField } from '../../../services/firestore.service.js';
import { escapeHTML, getQueryParam, qs } from '../../../utils/dom-helpers.js';
import { formatDate } from '../../../utils/formatters.js';
import { setPageMeta } from '../../../utils/seo.js';

async function init() {
  await mountPublicLayout();

  const slug = getQueryParam('slug');
  const target = qs('#sermon-detail-content');
  if (!target) {
    return;
  }

  if (!slug) {
    renderNotFound(target);
    return;
  }

  try {
    const sermon = await getDocumentByField('sermons', 'slug', slug);
    if (!sermon) {
      renderNotFound(target);
      return;
    }
    renderSermon(target, sermon);
  } catch (error) {
    target.innerHTML = `
      <section class="section">
        <div class="container">
          <p class="state-message state-message--error">
            We couldn't load this sermon right now. Please refresh the page.
          </p>
        </div>
      </section>`;
  }
}

/** Converts a YouTube watch/short URL into an embeddable iframe URL. Returns null if not recognized. */
function toYouTubeEmbedUrl(url) {
  if (!url) {
    return null;
  }
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      return `https://www.youtube.com/embed${parsed.pathname}`;
    }
    if (parsed.hostname.includes('youtube.com')) {
      const videoId = parsed.searchParams.get('v');
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
      if (parsed.pathname.startsWith('/embed/')) {
        return url;
      } // already an embed URL
    }
  } catch {
    return null;
  }
  return null;
}

function renderSermon(target, sermon) {
  const title = escapeHTML(sermon.title || 'Sermon');
  const speaker = escapeHTML(sermon.speaker || '');
  const series = escapeHTML(sermon.series || '');
  const date = formatDate(sermon.date);
  const description = escapeHTML(sermon.description || '');
  const tags = Array.isArray(sermon.tags) ? sermon.tags : [];

  setPageMeta({
    title: `${title} | Sermons`,
    description: description || `${title} — a sermon${speaker ? ` by ${speaker}` : ''}.`,
  });

  const embedUrl = toYouTubeEmbedUrl(sermon.videoUrl);

  target.innerHTML = `
    <section class="page-header">
      <div class="container">
        <h1 class="page-header__title">${title}</h1>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <a href="/sermons">Sermons</a>
          <span class="breadcrumbs__sep">/</span>
          <span aria-current="page">${title}</span>
        </nav>

        <div class="sermon-detail__body">
          <div class="sermon-detail__meta">
            ${date ? `<span>🗓 ${date}</span>` : ''}
            ${speaker ? `<span>🎙 ${speaker}</span>` : ''}
            ${series ? `<span>📚 ${series}</span>` : ''}
          </div>

          ${
            embedUrl
              ? `<div class="media-embed">
                  <iframe
                    src="${embedUrl}"
                    title="${title}"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                  ></iframe>
                </div>`
              : ''
          }

          ${
            sermon.audioUrl
              ? `<audio class="audio-player" controls preload="none" src="${sermon.audioUrl}">
                  Your browser does not support the audio element.
                </audio>`
              : ''
          }

          ${description ? `<p>${description}</p>` : ''}

          ${tags.length ? `<div class="pill-group">${tags.map((t) => `<span class="pill">${escapeHTML(t)}</span>`).join('')}</div>` : ''}

          <div class="sermon-detail__downloads">
            ${
              sermon.pdfUrl
                ? `<a href="${sermon.pdfUrl}" class="btn btn-outline" target="_blank" rel="noopener noreferrer">
                    📄 Download Sermon Notes (PDF)
                  </a>`
                : ''
            }
          </div>
        </div>
      </div>
    </section>`;
}

function renderNotFound(target) {
  setPageMeta({ title: 'Sermon Not Found' });
  target.innerHTML = `
    <section class="section">
      <div class="container" style="text-align: center;">
        <h1>Sermon Not Found</h1>
        <p>We couldn't find the sermon you're looking for.</p>
        <a href="/sermons" class="btn btn-primary" style="margin-top: var(--space-4);">
          View All Sermons
        </a>
      </div>
    </section>`;
}

init();
