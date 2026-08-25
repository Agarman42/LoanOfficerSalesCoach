/**
 * Feature script loader — performance-only, no features removed.
 *
 * CORE: loaded after DOM ready (Home, nav, search, shared helpers).
 * LAZY: loaded on first open of a section (and for deep links / search).
 *
 * window.ensureFeatureScripts(sectionId) → Promise | null
 *   null  = scripts already ready (showSection continues synchronously)
 *   Promise = wait, then re-enter showSection
 */
(function () {
  'use strict';

  /**
   * Always loaded early — Home + chrome + shared helpers only.
   * Heavy tools that are not needed on Home live in LAZY_BUNDLES.
   */
  var CORE_SCRIPTS = [
    'js/features/saved-items-library.js?v=20260806-vault-ui',
    'js/features/global-search-deep-index.js?v=20260721-ux-polish',
    'js/features/global-search-dynamic-index.js?v=20260709-lo-v292',
    'js/features/global-search-config.js?v=20260721-ux-polish',
    'js/features/global-search.js?v=20260719-content-hub',
    'js/features/section-bottom-banners.js?v=20260720-review',
    'js/features/coach-polish.js?v=20260721-ux-polish',
    'js/features/partner-share.js?v=20260807-one-invite-branded',
    'js/app-version.js?v=20260818-v3140',
    'js/features/newsletter-color-bundles.js?v=20260818-v3140',
    'js/features/generation-rules.js?v=20260720-hobby-restraint',
    'js/features/save-ribbon.js',
    'js/features/wizard-a11y.js?v=20260720-polish2',
    'js/features/coach-mode-switch.js?v=20260720-polish',
    'js/features/tool-bridges.js',
    'js/features/legacy-helpers.js?v=20260623-lo-v222',
    'js/features/app-bulk.js?v=20260709-lo-v290',
    'js/features/ai-chat.js?v=20260720-polish',
    'js/features/pwa-push.js?v=20260806-pwa'
  ];

  /**
   * sectionId → ordered script list (deps first).
   * Opening a section loads only its bundle (plus CORE if not yet ready).
   * All tools remain available; scripts are not deleted or disabled.
   */
  var LAZY_BUNDLES = {
    'newsletter-generator': [
      'js/data/newsletter-dad-jokes.js?v=20260625-lo-v231',
      'js/data/newsletter-brain-teasers.js?v=20260625-lo-v233',
      'js/features/newsletter-entertainment.js?v=20260729-blank-preview-fix',
      'js/features/newsletter-color-bundles.js?v=20260818-v3140',
      'js/features/publish-kit.js?v=20260820-next-steps-direct',
      'js/features/newsletter-generator.js?v=20260825-nl-preview-fix-v3150',
      'js/features/newsletter-setup-form.js?v=20260720-last-issue-chip',
      'js/features/newsletter-wizard.js?v=20260817-v3139'
    ],
    'smart-savings': [
      'smart-savings/js/calculator-core.js?v=20260721-v334',
      'smart-savings/js/app.js?v=20260804-debt-recap',
      'js/features/smart-savings-scope-css.js?v=20260721-v334',
      'js/features/smart-savings-host.js?v=20260729-profile-stack',
      'js/features/smart-savings-polish.js?v=20260721-v334'
    ],
    'letter-of-explanation': [
      'js/features/lox-generator.js?v=20260810-lox-export'
    ],
    'value-vault': [
      'js/data/popby-library.js?v=20260623-lo-v222',
      'js/data/lo-fact-vault.js?v=20260623-lo-v222',
      'js/features/popby-seasonal.js?v=20260623-lo-v222',
      'js/features/value-vault.js?v=20260623-lo-v222',
      'js/features/fact-vault-ui.js?v=20260623-lo-v222',
      'js/features/vault-rich-modals.js?v=20260623-lo-v222'
    ],
    'weekly-win-plan': [
      'js/data/weekend-plan-policy.js',
      'js/features/weekly-win-plan.js?v=20260812-plan-fix',
      'js/features/prospecting-time-blocks.js'
    ],
    'calculator': [
      'js/features/calculator.js?v=20260810-calc-hash-fix'
    ],
    'my-pitch': [
      'js/features/my-pitch.js?v=20260806-pitch-vcf2'
    ],
    'blog': [
      'js/features/publish-kit.js?v=20260820-next-steps-direct',
      'js/features/blog-creator.js?v=20260825-content-model-v3149'
    ],
    // Business Plan generate/style/profile sync live in weekly-win-plan.js (shared file)
    'planning': [
      'js/data/weekend-plan-policy.js',
      'js/features/weekly-win-plan.js?v=20260812-plan-fix',
      'js/features/business-plan-wizard.js?v=20260812-plan-fix'
    ],
    'process': [
      'js/features/process-rich-modals.js?v=20260623-lo-v222'
    ],
    'database': [
      'js/features/nurture-rich-modals.js?v=20260623-lo-v222',
      'js/features/database-rich-modals.js?v=20260623-lo-v222'
    ],
    'eventplanning': [
      'js/features/event-rich-modals.js?v=20260623-lo-v222',
      'js/features/referral-event-modals.js?v=20260623-lo-v222'
    ],
    'referrals': [
      'js/features/referral-rich-modals.js?v=20260623-lo-v222',
      'js/features/referral-event-modals.js?v=20260623-lo-v222'
    ],
    'equity-scanner': [
      'js/features/equity-scanner.js?v=20260623-lo-v222'
    ],
    'sales-script': [
      'js/features/sales-scripts.js?v=20260817-v3139'
    ],
    'bio-creator': [
      'js/features/bio-creator.js?v=20260817-v3139',
      'js/features/bio-wizard.js?v=20260817-v3139'
    ],
    'social': [
      'js/features/social-modals.js?v=20260623-lo-v222'
    ],
    'social-post': [
      'js/features/social-post.js?v=20260817-v3139'
    ],
    'mindset-motivation': [
      'js/features/mindset-lab.js'
    ],
    'underwriting-search': [
      'js/features/underwriting.js?v=20260728-lo-bugs'
    ],
    'client-translation': [
      'js/features/translation-tool.js?v=20260804-tr-custom-lang'
    ],
    'invite-realtors': [
      'js/features/lo-invite-admin.js?v=20260807-admin-usage'
    ],
    'lo-admin': [
      'js/features/lo-invite-admin.js?v=20260807-admin-usage'
    ],
    'content-hub': [
      // Hub tiles deep-link into blog / newsletter / social — warm those bundles
      'js/features/blog-creator.js?v=20260825-content-model-v3149',
      'js/features/social-modals.js?v=20260623-lo-v222',
      'js/data/newsletter-dad-jokes.js?v=20260625-lo-v231',
      'js/data/newsletter-brain-teasers.js?v=20260625-lo-v233',
      'js/features/newsletter-entertainment.js?v=20260729-blank-preview-fix',
      'js/features/newsletter-color-bundles.js?v=20260818-v3140',
      'js/features/publish-kit.js?v=20260820-next-steps-direct',
      'js/features/newsletter-generator.js?v=20260825-nl-preview-fix-v3150',
      'js/features/newsletter-setup-form.js?v=20260720-last-issue-chip',
      'js/features/newsletter-wizard.js?v=20260817-v3139'
    ]
  };

  // Aliases → same bundles (must match SECTION_ALIASES parents where relevant)
  LAZY_BUNDLES['prospecting'] = LAZY_BUNDLES['weekly-win-plan'];
  LAZY_BUNDLES['books'] = []; // static content in HTML
  LAZY_BUNDLES['ai-chat'] = []; // in CORE
  LAZY_BUNDLES['home'] = [];
  LAZY_BUNDLES['saved-items'] = [];

  var loaded = Object.create(null);
  var inflight = Object.create(null);
  var coreReady = false;
  var corePromise = null;

  /** Sections that only need the HTML shell — never block navigation on CORE. */
  var NEVER_BLOCK_SECTIONS = {
    home: true,
    books: true,
    'saved-items': true
  };

  function showLazyOverlay(label) {
    var el = document.getElementById('feature-lazy-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'feature-lazy-overlay';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      el.style.cssText =
        'position:fixed;inset:0;z-index:99980;display:flex;align-items:center;justify-content:center;' +
        'background:rgba(15,23,42,0.28);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);';
      el.innerHTML =
        '<div style="background:#fff;color:#0f172a;border-radius:1rem;padding:1.1rem 1.35rem;box-shadow:0 20px 50px rgba(0,0,0,.2);' +
        'font:600 14px/1.4 system-ui,sans-serif;display:flex;align-items:center;gap:.65rem;max-width:90vw">' +
        '<span class="feature-lazy-spin" style="width:1.1rem;height:1.1rem;border:2.5px solid #00A89D;border-top-color:transparent;' +
        'border-radius:50%;display:inline-block;animation:feature-lazy-spin .7s linear infinite"></span>' +
        '<span id="feature-lazy-overlay-text">Loading tool…</span></div>';
      if (!document.getElementById('feature-lazy-spin-style')) {
        var st = document.createElement('style');
        st.id = 'feature-lazy-spin-style';
        st.textContent =
          '@keyframes feature-lazy-spin{to{transform:rotate(360deg)}}' +
          'html.dark #feature-lazy-overlay>div{background:#0f172a;color:#f8fafc}';
        document.head.appendChild(st);
      }
      document.body.appendChild(el);
    }
    var t = document.getElementById('feature-lazy-overlay-text');
    if (t) t.textContent = label || 'Loading tool…';
    el.style.display = 'flex';
  }

  function hideLazyOverlay() {
    var el = document.getElementById('feature-lazy-overlay');
    if (el) el.style.display = 'none';
  }

  function loadScript(src) {
    if (loaded[src]) return Promise.resolve();
    if (inflight[src]) return inflight[src];
    inflight[src] = new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = function () {
        loaded[src] = true;
        delete inflight[src];
        resolve();
      };
      s.onerror = function () {
        console.warn('[feature-loader] failed', src);
        delete inflight[src];
        // Resolve anyway so navigation is not permanently blocked
        resolve();
      };
      (document.body || document.documentElement).appendChild(s);
    });
    return inflight[src];
  }

  /** Sequential inject preserves dependency order within a list. */
  function loadScriptList(list) {
    var chain = Promise.resolve();
    (list || []).forEach(function (src) {
      chain = chain.then(function () {
        return loadScript(src);
      });
    });
    return chain;
  }

  function scriptsForSection(sectionId) {
    var id = String(sectionId || '').replace(/^#/, '');
    var bundle = LAZY_BUNDLES[id];
    if (bundle && bundle.length) return bundle.slice();
    // Unknown section or empty alias: no extra lazy pack
    return [];
  }

  function sectionNeedsLazy(sectionId) {
    return scriptsForSection(sectionId).some(function (src) {
      return !loaded[src];
    });
  }

  /**
   * Ensure scripts for a section are loaded.
   * @returns {Promise|null} null when already ready (caller continues sync);
   *   Promise when scripts still need to load.
   */
  function ensureFeatureScripts(sectionId) {
    var id = String(sectionId || '').replace(/^#/, '');
    var lazy = scriptsForSection(id);
    var needsLazy = lazy.some(function (src) {
      return !loaded[src];
    });

    // Home / static shells: never block paint; CORE keeps loading in background
    if (NEVER_BLOCK_SECTIONS[id]) {
      if (!coreReady) ensureCore();
      return null;
    }

    // Already fully ready — sync path (critical: avoids infinite showSection re-entry)
    if (coreReady && !needsLazy) return null;

    var p = ensureCore();
    if (!needsLazy) {
      // Core-only section still booting shared scripts
      return p;
    }

    return p.then(function () {
      // Re-check after core (another tab navigation may have loaded the pack)
      var stillNeed = lazy.some(function (src) {
        return !loaded[src];
      });
      if (!stillNeed) return;
      showLazyOverlay('Loading tool…');
      return loadScriptList(lazy).then(
        function () {
          hideLazyOverlay();
        },
        function (err) {
          hideLazyOverlay();
          throw err;
        }
      );
    });
  }

  function ensureCore() {
    if (coreReady) return Promise.resolve();
    if (corePromise) return corePromise;
    corePromise = loadScriptList(CORE_SCRIPTS).then(function () {
      coreReady = true;
      try {
        if (typeof window.__hardHideGlobalLoading === 'function') window.__hardHideGlobalLoading();
      } catch (e) {}
      document.documentElement.classList.remove('coach-boot-stuck');
      document.dispatchEvent(new CustomEvent('coach-features-loaded'));
    });
    return corePromise;
  }

  function start() {
    if (window.__featureLoaderStarted) return;
    window.__featureLoaderStarted = true;
    // Kick CORE immediately (no full-app preload of heavy tools)
    ensureCore();
  }

  window.ensureFeatureScripts = ensureFeatureScripts;
  window.ensureCoachCoreScripts = ensureCore;
  window.__featureLazyBundles = LAZY_BUNDLES;
  window.__featureSectionNeedsLazy = sectionNeedsLazy;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
  window.addEventListener('load', function () {
    if (!window.__featureLoaderStarted) start();
  });
})();
