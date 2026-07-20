/**
 * Minimal sidebar navigation — runs before heavy feature scripts load.
 * Full showSection() from main.js replaces this when window.__mainNavReady is set.
 * Keep ALIASES in sync with SECTION_ALIASES in js/main.js.
 */
(function () {
  'use strict';

  const DEFAULT_SECTION = 'home';
  /** @type {Record<string, string>} */
  const ALIASES = {
    'social-media-strategy': 'social',
    'referral-partners': 'referrals',
    prospecting: 'weekly-win-plan',
    content: 'content-hub',
    'content-studio': 'content-hub',
    'content-suite': 'content-hub',
    'database-nurturing': 'database',
    'loan-process': 'process',
    events: 'eventplanning',
    'event-planning': 'eventplanning',
    event: 'eventplanning'
  };

  function resolveId(id) {
    if (!id) return DEFAULT_SECTION;
    return ALIASES[id] || id;
  }

  function isSmartSavingsNested(sec) {
    if (!sec || !sec.closest) return false;
    return !!(
      sec.closest('#smart-savings-root') ||
      sec.closest('#ss-guided-layer') ||
      sec.closest('#ss-guided-scroll')
    );
  }

  function showSectionEarly(id) {
    id = resolveId(id);
    const target = document.getElementById(id);

    document.querySelectorAll('main section').forEach((sec) => {
      // Nested Smart Savings wizard <section>s must stay visible independently
      if (isSmartSavingsNested(sec)) return;
      sec.classList.add('hidden');
    });

    if (target) {
      target.classList.remove('hidden');
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (id === 'smart-savings') {
        try {
          if (typeof window.initSmartSavingsSection === 'function') {
            window.initSmartSavingsSection();
          } else if (typeof window.loadSmartSavingsFrame === 'function') {
            window.loadSmartSavingsFrame();
          }
        } catch (e) {
          /* host may load later */
        }
      }
    } else if (id !== DEFAULT_SECTION) {
      showSectionEarly(DEFAULT_SECTION);
      return;
    }

    document.querySelectorAll('#sidebar a[href^="#"]').forEach((link) => {
      const linkId = (link.getAttribute('href') || '').replace(/^#/, '');
      link.classList.toggle('active', linkId === id);
    });

    if (window.innerWidth < 768) {
      const sidebar = document.getElementById('sidebar');
      if (sidebar) {
        sidebar.classList.remove('left-0', 'open');
        sidebar.classList.add('left-[-300px]');
      }
    }
  }

  window.showSection = showSectionEarly;

  function onSidebarClick(e) {
    // Skip once main.js owns navigation (avoids double showSection / analytics).
    if (window.__mainNavReady) return;
    const link = e.target.closest && e.target.closest('a[href^="#"]');
    if (!link) return;

    const href = link.getAttribute('href') || '';
    if (link.target === '_blank' || !href.startsWith('#')) return;

    e.preventDefault();
    showSectionEarly(href.replace(/^#/, ''));
  }

  function onHashChange() {
    if (window.__mainNavReady) return;
    const hashId = location.hash.replace(/^#/, '');
    if (hashId) showSectionEarly(hashId);
  }

  function initEarlyNav() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    sidebar.addEventListener('click', onSidebarClick);
    window.addEventListener('hashchange', onHashChange);
    window.__earlyNavSidebarClick = onSidebarClick;
    window.__earlyNavHashChange = onHashChange;

    if (location.hash) {
      showSectionEarly(location.hash.replace(/^#/, ''));
    } else {
      showSectionEarly(DEFAULT_SECTION);
    }
  }

  function onReady() {
    initEarlyNav();
    const gl = document.getElementById('global-loading');
    if (gl) {
      gl.classList.add('hidden');
      gl.classList.remove('flex');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();