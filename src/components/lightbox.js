/**
 * components/lightbox.js
 * -----------------------------------------------------------------------
 * A small, dependency-free image lightbox. Renders its own overlay markup
 * once into the page, then `open(images, startIndex)` displays it.
 * Supports click-to-close, prev/next buttons, and keyboard navigation
 * (Escape, ArrowLeft, ArrowRight).
 *
 * Usage:
 *   import { createLightbox } from '/src/components/lightbox.js';
 *   const lightbox = createLightbox();
 *   thumbnailEl.addEventListener('click', () => lightbox.open(images, index));
 * -----------------------------------------------------------------------
 */

import { escapeHTML } from '../utils/dom-helpers.js';

export function createLightbox() {
  let images = [];
  let currentIndex = 0;

  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.hidden = true;
  overlay.innerHTML = `
    <button type="button" class="lightbox-close" aria-label="Close">&times;</button>
    <button type="button" class="lightbox-nav lightbox-nav--prev" aria-label="Previous image">&#8249;</button>
    <div>
      <img class="lightbox-image" src="" alt="" />
      <p class="lightbox-caption"></p>
    </div>
    <button type="button" class="lightbox-nav lightbox-nav--next" aria-label="Next image">&#8250;</button>
  `;
  document.body.appendChild(overlay);

  const imgEl = overlay.querySelector('.lightbox-image');
  const captionEl = overlay.querySelector('.lightbox-caption');
  const closeBtn = overlay.querySelector('.lightbox-close');
  const prevBtn = overlay.querySelector('.lightbox-nav--prev');
  const nextBtn = overlay.querySelector('.lightbox-nav--next');

  function render() {
    const image = images[currentIndex];
    if (!image) {
      return;
    }
    imgEl.src = image.imageUrl;
    imgEl.alt = escapeHTML(image.caption || '');
    captionEl.textContent = image.caption || '';
  }

  function open(imageList, startIndex = 0) {
    images = imageList;
    currentIndex = startIndex;
    overlay.hidden = false;
    document.body.classList.add('nav-open'); // reuse the same scroll-lock class as mobile nav
    render();
  }

  function close() {
    overlay.hidden = true;
    document.body.classList.remove('nav-open');
  }

  function showPrev() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    render();
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % images.length;
    render();
  }

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', showPrev);
  nextBtn.addEventListener('click', showNext);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      close();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (overlay.hidden) {
      return;
    }
    if (event.key === 'Escape') {
      close();
    }
    if (event.key === 'ArrowLeft') {
      showPrev();
    }
    if (event.key === 'ArrowRight') {
      showNext();
    }
  });

  return { open, close };
}
