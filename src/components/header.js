/**
 * components/header.js
 * -----------------------------------------------------------------------
 * Renders the site header/navigation and wires up its interactive
 * behavior (mobile menu toggle, "About" submenu, active-link highlight,
 * scroll shadow). Every public page mounts this the same way:
 *
 *   import { renderHeader, initHeader } from '/src/components/header.js';
 *   renderInto('#site-header', renderHeader());
 *   initHeader();
 *
 * Nav scope is intentionally limited to Phase 2 pages that exist today.
 * Sermons, Events, Give, etc. will be added here once those phases ship.
 * -----------------------------------------------------------------------
 */

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  {
    label: 'About',
    href: '/about',
    children: [
      { label: 'About Church', href: '/about' },
      { label: 'Our History', href: '/about/history' },
      { label: 'Vision & Mission', href: '/about/vision-mission' },
      { label: 'Statement of Faith', href: '/about/beliefs' },
      { label: 'Leadership', href: '/about/leadership' },
    ],
  },
  { label: 'Ministries', href: '/ministries' },
  { label: 'Service Times', href: '/service-times' },
  { label: 'Contact', href: '/contact' },
];

export function renderHeader() {
  const navHTML = NAV_ITEMS.map((item) => {
    if (item.children) {
      const childrenHTML = item.children
        .map(
          (child) => `
            <li>
              <a href="${child.href}" class="nav-submenu-link" data-nav-link="${child.href}">
                ${child.label}
              </a>
            </li>`
        )
        .join('');

      return `
        <li class="nav-item nav-item--has-submenu">
          <button
            type="button"
            class="nav-link nav-submenu-toggle"
            aria-expanded="false"
            aria-haspopup="true"
          >
            ${item.label}
            <svg class="nav-caret" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
              <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none" />
            </svg>
          </button>
          <ul class="nav-submenu">${childrenHTML}</ul>
        </li>`;
    }

    return `
      <li class="nav-item">
        <a href="${item.href}" class="nav-link" data-nav-link="${item.href}">${item.label}</a>
      </li>`;
  }).join('');

  return `
    <header class="site-header" id="site-header-el">
      <div class="container site-header__inner">
        <a href="/" class="site-logo" aria-label="Go to homepage">
          <span class="site-logo__mark" aria-hidden="true">✚</span>
          <span class="site-logo__text" id="site-logo-text">Church</span>
        </a>

        <nav class="site-nav" aria-label="Primary">
          <ul class="nav-list">${navHTML}</ul>
        </nav>

        <a href="/visit" class="btn btn-accent site-header__cta">Plan Your Visit</a>

        <button
          type="button"
          class="mobile-nav-toggle"
          aria-expanded="false"
          aria-controls="mobile-nav"
          aria-label="Open menu"
        >
          <span class="mobile-nav-toggle__bar"></span>
          <span class="mobile-nav-toggle__bar"></span>
          <span class="mobile-nav-toggle__bar"></span>
        </button>
      </div>

      <div class="mobile-nav" id="mobile-nav" hidden>
        <ul class="mobile-nav-list">${navHTML}</ul>
        <a href="/visit" class="btn btn-accent mobile-nav__cta">Plan Your Visit</a>
      </div>
    </header>`;
}

export function initHeader() {
  const header = document.getElementById('site-header-el');
  if (!header) {
    return;
  }

  highlightActiveLink(header);
  initMobileToggle(header);
  initSubmenus(header);
  initScrollShadow(header);
}

/** Adds an `is-active` class to whichever nav link matches the current path. */
function highlightActiveLink(header) {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  header.querySelectorAll('[data-nav-link]').forEach((link) => {
    const linkPath = link.getAttribute('data-nav-link').replace(/\/$/, '') || '/';
    if (linkPath === path) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    }
  });
}

/** Hamburger menu open/close for small screens. */
function initMobileToggle(header) {
  const toggle = header.querySelector('.mobile-nav-toggle');
  const menu = header.querySelector('#mobile-nav');
  if (!toggle || !menu) {
    return;
  }

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
    toggle.classList.toggle('is-open', !isOpen);
    menu.hidden = isOpen;
    document.body.classList.toggle('nav-open', !isOpen);
  });
}

/** Click-to-toggle "About" submenu (works for touch and mouse alike). */
function initSubmenus(header) {
  header.querySelectorAll('.nav-submenu-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      // Close any other open submenu first.
      header.querySelectorAll('.nav-submenu-toggle').forEach((otherBtn) => {
        otherBtn.setAttribute('aria-expanded', 'false');
      });
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  // Close submenu when clicking outside the nav entirely.
  document.addEventListener('click', (event) => {
    if (!header.contains(event.target)) {
      header.querySelectorAll('.nav-submenu-toggle').forEach((btn) => {
        btn.setAttribute('aria-expanded', 'false');
      });
    }
  });
}

/** Adds a subtle shadow/background once the page is scrolled. */
function initScrollShadow(header) {
  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}
