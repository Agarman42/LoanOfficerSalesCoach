/**
 * Minimal sidebar navigation — runs before heavy feature scripts load.
 * Full showSection() from main.js replaces this when window.__mainNavReady is set.
 *
 * CRITICAL: Do NOT wait only for DOMContentLoaded. Deferred feature scripts delay
 * DOMContentLoaded for seconds on these multi-MB apps. Bind navigation as soon as
 * #sidebar appears (MutationObserver) so clicks work while scripts still download.
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

  let navReady = false;

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
      if (isSmartSavingsNested(sec)) return;
      sec.classList.add('hidden');
    });

    if (target) {
      target.classList.remove('hidden');
      try {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (e) { /* ignore */ }
      if (id === 'smart-savings') {
        try {
          if (typeof window.initSmartSavingsSection === 'function') {
            window.initSmartSavingsSection();
          } else if (typeof window.loadSmartSavingsFrame === 'function') {
            window.loadSmartSavingsFrame();
          }
        } catch (e) { /* host may load later */ }
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
    if (window.__mainNavReady) return;
    const link = e.target.closest && e.target.closest('a[href^="#"]');
    if (!link) return;
    // Only handle in-sidebar links (or explicit section jumps)
    const sidebar = document.getElementById('sidebar');
    if (sidebar && !sidebar.contains(link) && !link.hasAttribute('data-early-nav')) return;

    const href = link.getAttribute('href') || '';
    if (link.target === '_blank' || !href.startsWith('#')) return;

    e.preventDefault();
    showSectionEarly(href.replace(/^#/, ''));
  }

  function onDocClick(e) {
    if (window.__mainNavReady) return;
    hardHideGlobalLoading();

    // Profile button works once user-profile.js loads; until then open shell if present
    const profileBtn = e.target.closest && e.target.closest('#open-profile-btn');
    if (profileBtn) {
      if (typeof window.openUserProfile === 'function') {
        try {
          window.openUserProfile();
        } catch (err) { /* ignore */ }
        return;
      }
      const modal = document.getElementById('user-profile-modal') || document.getElementById('profile-modal');
      if (modal) {
        e.preventDefault();
        modal.classList.remove('hidden');
        modal.style.setProperty('display', 'flex', 'important');
      }
    }
  }

  function onHashChange() {
    if (window.__mainNavReady) return;
    const hashId = location.hash.replace(/^#/, '');
    if (hashId) showSectionEarly(hashId);
  }

  function initEarlyNav() {
    if (navReady) return;
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    navReady = true;

    sidebar.addEventListener('click', onSidebarClick);
    window.addEventListener('hashchange', onHashChange);
    window.__earlyNavSidebarClick = onSidebarClick;
    window.__earlyNavHashChange = onHashChange;

    if (location.hash) {
      showSectionEarly(location.hash.replace(/^#/, ''));
    } else {
      showSectionEarly(DEFAULT_SECTION);
    }
    hardHideGlobalLoading();
  }

  /** Nuke stuck full-screen loaders that block every click. */
  function hardHideGlobalLoading() {
    try {
      document.querySelectorAll('#global-loading').forEach((gl) => {
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

  // Document-level capture so we stay interactive even while deferred scripts run
  document.addEventListener('click', onDocClick, true);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hardHideGlobalLoading();
  });

  hardHideGlobalLoading();

  // As soon as #sidebar is in the DOM (may be before DOMContentLoaded)
  if (document.getElementById('sidebar')) {
    initEarlyNav();
  } else if (typeof MutationObserver !== 'undefined') {
    const mo = new MutationObserver(() => {
      if (document.getElementById('sidebar')) {
        mo.disconnect();
        initEarlyNav();
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
    // Safety stop
    setTimeout(() => {
      try { mo.disconnect(); } catch (e) { /* ignore */ }
      initEarlyNav();
    }, 15000);
  }

  // Also on DOMContentLoaded / complete (covers edge cases)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      hardHideGlobalLoading();
      initEarlyNav();
    });
  } else {
    initEarlyNav();
  }

  // Keep clearing stuck overlay during long deferred-script windows
  let ticks = 0;
  const pulse = setInterval(() => {
    hardHideGlobalLoading();
    ticks += 1;
    if (ticks >= 40 || window.__mainNavReady) clearInterval(pulse);
  }, 250);

  setTimeout(hardHideGlobalLoading, 90000);
  window.addEventListener('pageshow', hardHideGlobalLoading);
  window.addEventListener('load', hardHideGlobalLoading);
  window.__hardHideGlobalLoading = hardHideGlobalLoading;
})();
