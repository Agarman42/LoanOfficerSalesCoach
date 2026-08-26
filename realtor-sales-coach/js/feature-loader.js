/**
 * Feature script loader — performance/reliability only, no features removed.
 *
 * CORE: loaded after DOM ready (Home, nav, search, shared helpers).
 * LAZY: loaded on first open of a section (deep links / search / sidebar).
 *
 * window.ensureFeatureScripts(sectionId) → Promise | null
 *   null  = scripts already ready (showSection continues synchronously)
 *   Promise = wait (shows overlay), then re-enter showSection
 *
 * Home Coach Setup (user-profile, home-favorites, onboarding-coach, auth-gate,
 * admin-usage, lo-brand-chrome) loads via <script defer> in <head> — NOT here.
 */
(function () {
  'use strict';

  var V = '20260818-agent-v369';

  /** Always loaded early — keep Home + chrome snappy. */
  var CORE_SCRIPTS = [
    'js/features/saved-items-library.js?v=20260806-vault-ui',
    'js/features/global-search-deep-index.js?v=20260719-content-hub',
    'js/features/global-search-dynamic-index.js?v=20260717-realtor-search',
    'js/features/global-search-config.js?v=20260818-hide-calc',
    'js/features/global-search.js?v=20260719-content-hub',
    'js/features/section-bottom-banners.js?v=20260720-p2-content-hub',
    'js/features/coach-polish.js?v=20260728-realtor-parity',
    'js/app-version.js?v=' + V,
    'js/features/generation-rules.js?v=20260720-hobby-restraint',
    'js/features/feature-checkboxes.js?v=20260706-realtor-v277',
    'js/features/save-ribbon.js?v=20260706-realtor-v273',
    'js/features/wizard-a11y.js?v=20260720-polish2',
    'js/features/coach-mode-switch.js?v=20260719-mode1',
    'js/features/tool-bridges.js?v=20260706-realtor-v273',
    'js/features/legacy-helpers.js?v=20260825-syntax-fix',
    'js/features/rich-modals-restore.js?v=20260706-realtor-v273',
    'js/features/ai-chat.js?v=20260720-ai-chat'
  ];

  /**
   * sectionId → ordered script list (deps first).
   * All realtor tools remain available; scripts are not deleted or disabled.
   * LO-only tools (Smart Savings, Equity, Underwriting) are intentionally absent.
   */
  var LAZY_BUNDLES = {
    'weekly-win-plan': [
      'js/data/weekend-plan-policy.js?v=20260706-realtor-v273',
      'js/features/weekly-win-plan.js?v=20260819-closings-copy',
      'js/features/prospecting-time-blocks.js?v=20260706-realtor-v273'
    ],
    // Business Plan generate/style/profile sync lives in weekly-win-plan.js
    'planning': [
      'js/data/weekend-plan-policy.js?v=20260706-realtor-v273',
      'js/features/weekly-win-plan.js?v=20260819-closings-copy',
      'js/features/prospecting-time-blocks.js?v=20260706-realtor-v273',
      'js/features/business-plan-wizard.js?v=20260818-plan-profile'
    ],
    'newsletter-generator': [
      'js/data/newsletter-dad-jokes.js?v=20260706-realtor-v273',
      'js/data/newsletter-brain-teasers.js?v=20260706-realtor-v273',
      'js/features/newsletter-entertainment.js?v=20260729-blank-preview-fix',
      'js/features/newsletter-color-bundles.js?v=20260707-realtor-v303',
      'js/features/publish-kit.js?v=20260820-next-steps-direct',
      'js/features/newsletter-generator.js?v=20260826-demo-audit-v390',
      'js/features/newsletter-setup-form.js?v=20260720-last-issue-chip',
      'js/features/newsletter-wizard.js?v=20260720-last-issue-chip'
    ],
    'value-vault': [
      'js/features/popby-seasonal.js?v=20260706-realtor-v273',
      'js/features/value-vault.js?v=20260706-realtor-v273',
      'js/features/vault-rich-modals.js?v=20260706-realtor-v273',
      'js/inline-extracted/re-block-1.js?v=20260818-demo-safe'
    ],
    'listing-description': [
      'js/features/listing-description.js?v=20260706-realtor-v279'
    ],
    'open-house': [
      'js/features/open-house.js?v=20260706-realtor-v278'
    ],
    'consultation': [
      'js/features/consultation-kit.js?v=20260706-realtor-v280'
    ],
    'bio-creator': [
      'js/features/bio-creator.js?v=20260818-realtor-bio',
      'js/features/bio-wizard.js?v=20260818-realtor-bio'
    ],
    'blog': [
      'js/features/publish-kit.js?v=20260820-next-steps-direct',
      'js/features/blog-creator.js?v=20260826-demo-audit-v390'
    ],
    'social': [
      'js/features/social-modals.js?v=20260818-demo-safe',
      'js/inline-extracted/re-block-1.js?v=20260818-demo-safe'
    ],
    'social-post': [
      'js/features/social-post.js?v=20260729-profile-ux',
      'js/features/publish-kit.js?v=20260820-next-steps-direct'
    ],
    'sales-script': [
      'js/features/sales-scripts.js?v=20260706-realtor-v273'
    ],
    'process': [
      'js/features/process-rich-modals.js?v=20260706-realtor-v273',
      'js/inline-extracted/re-block-1.js?v=20260818-demo-safe'
    ],
    'database': [
      'js/features/nurture-rich-modals.js?v=20260706-realtor-v273',
      'js/features/database-rich-modals.js?v=20260706-realtor-v273',
      'js/inline-extracted/re-block-2.js?v=20260818-demo-safe'
    ],
    'eventplanning': [
      'js/features/event-rich-modals.js?v=20260706-realtor-v273',
      'js/inline-extracted/re-block-2.js?v=20260818-demo-safe'
    ],
    'referrals': [
      'js/features/referral-rich-modals.js?v=20260706-realtor-v273',
      'js/inline-extracted/re-block-2.js?v=20260818-demo-safe'
    ],
    'calculator': [
      'js/features/calculator.js?v=20260806-biweekly-fix'
    ],
    'client-translation': [
      'js/features/translation-tool.js?v=20260804-tr-custom-lang'
    ],
    'mindset-motivation': [
      'js/features/mindset-lab.js?v=20260706-realtor-v273'
    ],
    'content-hub': [
      // Hub tiles deep-link into blog / newsletter / social — warm those bundles
      'js/features/blog-creator.js?v=20260826-demo-audit-v390',
      'js/features/social-modals.js?v=20260818-demo-safe',
      'js/data/newsletter-dad-jokes.js?v=20260706-realtor-v273',
      'js/data/newsletter-brain-teasers.js?v=20260706-realtor-v273',
      'js/features/newsletter-entertainment.js?v=20260729-blank-preview-fix',
      'js/features/newsletter-color-bundles.js?v=20260707-realtor-v303',
      'js/features/publish-kit.js?v=20260820-next-steps-direct',
      'js/features/newsletter-generator.js?v=20260826-demo-audit-v390',
      'js/features/newsletter-setup-form.js?v=20260720-last-issue-chip',
      'js/features/newsletter-wizard.js?v=20260720-last-issue-chip'
    ]
  };

  // Aliases → same bundles
  LAZY_BUNDLES['prospecting'] = LAZY_BUNDLES['weekly-win-plan'];
  LAZY_BUNDLES['books'] = []; // static HTML content
  LAZY_BUNDLES['ai-chat'] = []; // in CORE
  LAZY_BUNDLES['home'] = [];
  LAZY_BUNDLES['saved-items'] = [];
  LAZY_BUNDLES['admin-usage'] = []; // already defer-loaded in <head>

  var loaded = Object.create(null);
  var inflight = Object.create(null);
  var coreReady = false;
  var corePromise = null;

  var NEVER_BLOCK_SECTIONS = {
    home: true,
    books: true,
    'saved-items': true
  };

  var SECTION_LABELS = {
    'weekly-win-plan': 'Loading Weekly Win Plan…',
    planning: 'Loading Business Plan…',
    'newsletter-generator': 'Loading Newsletter…',
    'value-vault': 'Loading Value Vault…',
    'listing-description': 'Loading Listing Copy…',
    'open-house': 'Loading Open House…',
    consultation: 'Loading Consultation Kit…',
    'bio-creator': 'Loading Bio Builder…',
    blog: 'Loading Blog Creator…',
    social: 'Loading Social Strategy…',
    'social-post': 'Loading Posts & Calendar…',
    'sales-script': 'Loading Sales Scripts…',
    'content-hub': 'Loading Content Studio…',
    calculator: 'Loading Calculator…',
    referrals: 'Loading Referral Partners…',
    database: 'Loading Database Nurturing…',
    process: 'Loading Buy & Sell Process…',
    eventplanning: 'Loading Event Planning…',
    'mindset-motivation': 'Loading Mindset Lab…',
    'client-translation': 'Loading Translation…'
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
        resolve(); // do not permanently block navigation
      };
      (document.body || document.documentElement).appendChild(s);
    });
    return inflight[src];
  }

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
    return [];
  }

  function ensureFeatureScripts(sectionId) {
    var id = String(sectionId || '').replace(/^#/, '');
    var lazy = scriptsForSection(id);
    var needsLazy = lazy.some(function (src) {
      return !loaded[src];
    });

    if (NEVER_BLOCK_SECTIONS[id]) {
      if (!coreReady) ensureCore();
      return null;
    }

    if (coreReady && !needsLazy) return null;

    var p = ensureCore();
    if (!needsLazy) return p;

    return p.then(function () {
      var stillNeed = lazy.some(function (src) {
        return !loaded[src];
      });
      if (!stillNeed) return;
      showLazyOverlay(SECTION_LABELS[id] || 'Loading tool…');
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
    ensureCore();
  }

  window.ensureFeatureScripts = ensureFeatureScripts;
  window.ensureCoachCoreScripts = ensureCore;
  window.__featureLazyBundles = LAZY_BUNDLES;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
  window.addEventListener('load', function () {
    if (!window.__featureLoaderStarted) start();
  });
})();
