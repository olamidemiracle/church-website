/**
 * components/about-subnav.js
 * -----------------------------------------------------------------------
 * Small shared sub-navigation strip used across every About-family page
 * (About, Our History, Vision & Mission, Statement of Faith, Leadership)
 * so visitors can hop between them without going back to the main menu.
 * -----------------------------------------------------------------------
 */

const LINKS = [
  { label: 'Overview', href: '/about' },
  { label: 'Our History', href: '/about/history' },
  { label: 'Vision & Mission', href: '/about/vision-mission' },
  { label: 'Statement of Faith', href: '/about/beliefs' },
  { label: 'Leadership', href: '/about/leadership' },
];

export function renderAboutSubnav() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';

  const linksHTML = LINKS.map((link) => {
    const isActive = link.href === path;
    return `<a href="${link.href}" class="subnav__link${isActive ? ' is-active' : ''}">${link.label}</a>`;
  }).join('');

  return `<nav class="subnav container" aria-label="About section">${linksHTML}</nav>`;
}
