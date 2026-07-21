/**
 * Minimal sidebar navigation — runs before heavy feature scripts load.
 * Full showSection() from main.js replaces this when ready.
 *
 * CRITICAL: Do NOT wait only for DOMContentLoaded. Deferred feature scripts delay
 * DOMContentLoaded for seconds. Bind nav as soon as #sidebar appears.
 */
(function () {
  'use strict';

  var DEFAULT_SECTION = 'home';
  var ALIASES = {
    'social-media-strategy': 'social',
    'referral-partners': 'referrals',
    'prospecting': 'weekly-win-plan',
    'content': 'content-hub',
    'content-studio': 'content-hub'
  };

  var navReady = false;

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
      try {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (e) { /* ignore */ }
    } else if (id !== DEFAULT_SECTION) {
      showSectionEarly(DEFAULT_SECTION);
      return;
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
    if (window.__mainNavReady) return;
    var link = e.target.closest && e.target.closest('a[href^="#"]');
    if (!link) return;
    var sidebar = document.getElementById('sidebar');
    if (sidebar && !sidebar.contains(link) && !link.hasAttribute('data-early-nav')) return;

    var href = link.getAttribute('href') || '';
    if (link.target === '_blank' || !href.startsWith('#')) return;

    e.preventDefault();
    showSectionEarly(href.replace('#', ''));
  }

  function onDocClick(e) {
    if (window.__mainNavReady) return;
    hardHideGlobalLoading();

    var profileBtn = e.target.closest && e.target.closest('#open-profile-btn');
    if (profileBtn) {
      if (typeof window.openUserProfile === 'function') {
        try { window.openUserProfile(); } catch (err) { /* ignore */ }
        return;
      }
      var modal = document.getElementById('user-profile-modal') || document.getElementById('profile-modal');
      if (modal) {
        e.preventDefault();
        modal.classList.remove('hidden');
        modal.style.setProperty('display', 'flex', 'important');
      }
    }
  }

  function initEarlyNav() {
    if (navReady) return;
    var sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    navReady = true;

    sidebar.addEventListener('click', onSidebarClick);
    window.addEventListener('hashchange', function () {
      if (window.__mainNavReady) return;
      var hashId = location.hash.replace('#', '');
      if (hashId) showSectionEarly(hashId);
    });

    if (location.hash) {
      showSectionEarly(location.hash.replace('#', ''));
    } else {
      showSectionEarly(DEFAULT_SECTION);
    }
    hardHideGlobalLoading();
  }

  function hardHideGlobalLoading() {
    try {
      document.querySelectorAll('#global-loading').forEach(function (gl) {
        gl.classList.add('hidden');
        gl.classList.remove('flex', 'is-visible');
        gl.setAttribute('hidden', '');
        gl.setAttribute('aria-hidden', 'true');
        gl.style.cssText =
          'display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;';
      });
      document.documentElement.classList.remove('coach-boot-stuck');
      if (document.body) {
        document.body.classList.remove(
          'ss-smart-savings-modal-open',
          'modal-open',
          'ss-guided-modal-open',
          'overflow-hidden'
        );
      }
      document.documentElement.classList.remove('ss-guided-modal-open');
    } catch (e) { /* ignore */ }
  }

  document.addEventListener('click', onDocClick, true);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') hardHideGlobalLoading();
  });

  hardHideGlobalLoading();

  if (document.getElementById('sidebar')) {
    initEarlyNav();
  } else if (typeof MutationObserver !== 'undefined') {
    var mo = new MutationObserver(function () {
      if (document.getElementById('sidebar')) {
        mo.disconnect();
        initEarlyNav();
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(function () {
      try { mo.disconnect(); } catch (e) { /* ignore */ }
      initEarlyNav();
    }, 15000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      hardHideGlobalLoading();
      initEarlyNav();
    });
  } else {
    initEarlyNav();
  }

  var ticks = 0;
  var pulse = setInterval(function () {
    hardHideGlobalLoading();
    ticks += 1;
    if (ticks >= 40 || window.__mainNavReady) clearInterval(pulse);
  }, 250);

  setTimeout(hardHideGlobalLoading, 90000);
  window.addEventListener('pageshow', hardHideGlobalLoading);
  window.addEventListener('load', hardHideGlobalLoading);
  window.__hardHideGlobalLoading = hardHideGlobalLoading;
})();
