/**
 * Minimal sidebar navigation — runs before heavy feature scripts load.
 * Full showSection() from main.js replaces this when ready.
 */
(function () {
  'use strict';

  var DEFAULT_SECTION = 'ai-chat';
  var ALIASES = {
    'social-media-strategy': 'social',
    'referral-partners': 'referrals',
    'prospecting': 'weekly-win-plan'
  };

  function resolveId(id) {
    if (!id) return DEFAULT_SECTION;
    return ALIASES[id] || id;
  }

  function showSectionEarly(id) {
    id = resolveId(id);
    var sections = document.querySelectorAll('main section');
    var target = document.getElementById(id);

    sections.forEach(function (sec) {
      sec.classList.add('hidden');
    });

    if (target) {
      target.classList.remove('hidden');
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (id !== DEFAULT_SECTION) {
      showSectionEarly(DEFAULT_SECTION);
    }

    document.querySelectorAll('#sidebar a[href^="#"]').forEach(function (link) {
      var linkId = (link.getAttribute('href') || '').replace('#', '');
      if (linkId === id) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    if (window.innerWidth < 768) {
      var sidebar = document.getElementById('sidebar');
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
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;

    var href = link.getAttribute('href') || '';
    if (link.target === '_blank' || !href.startsWith('#')) return;

    e.preventDefault();
    showSectionEarly(href.replace('#', ''));
  }

  function onHashChange() {
    if (window.__mainNavReady) return;
    var hashId = location.hash.replace('#', '');
    if (hashId) showSectionEarly(hashId);
  }

  function initEarlyNav() {
    var sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    sidebar.addEventListener('click', onSidebarClick);
    window.addEventListener('hashchange', onHashChange);
    window.__earlyNavSidebarClick = onSidebarClick;
    window.__earlyNavHashChange = onHashChange;

    if (location.hash) {
      showSectionEarly(location.hash.replace('#', ''));
    } else {
      showSectionEarly(DEFAULT_SECTION);
    }
  }

  function onReady() {
    initEarlyNav();
    var gl = document.getElementById('global-loading');
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