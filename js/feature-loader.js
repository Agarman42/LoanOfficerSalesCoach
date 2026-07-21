/**
 * Loads non-critical feature scripts AFTER DOM ready so the address bar can finish
 * and early-boot navigation stays responsive.
 *
 * Home Coach Setup (user-profile, home-favorites, onboarding-coach) loads via
 * <script defer> in <head> — NOT here — so setup paints right after main.js
 * instead of waiting on this sequential queue.
 */
(function () {
  'use strict';
  var SCRIPTS = [
  'js/features/bio-creator.js?v=20260715-lo-v14',
  'js/features/bio-wizard.js?v=20260720-polish2',
  'js/features/saved-items-library.js?v=20260715-lo-v290',
  'js/features/global-search-deep-index.js?v=20260721-ux-polish',
  'js/features/global-search-dynamic-index.js?v=20260709-lo-v292',
  'js/features/global-search-config.js?v=20260721-ux-polish',
  'js/features/global-search.js?v=20260719-content-hub',
  'js/features/section-bottom-banners.js?v=20260720-review',
  'js/features/coach-polish.js?v=20260721-ux-polish',
  'js/app-version.js?v=20260721-v335',
  'js/features/generation-rules.js?v=20260720-hobby-restraint',
  'js/features/save-ribbon.js',
  'js/features/wizard-a11y.js?v=20260720-polish2',
  'js/features/coach-mode-switch.js?v=20260720-polish',
  'js/data/popby-library.js?v=20260623-lo-v222',
  'js/data/lo-fact-vault.js?v=20260623-lo-v222',
  'js/features/social-modals.js?v=20260623-lo-v222',
  'js/features/process-rich-modals.js?v=20260623-lo-v222',
  'js/features/nurture-rich-modals.js?v=20260623-lo-v222',
  'js/features/database-rich-modals.js?v=20260623-lo-v222',
  'js/features/event-rich-modals.js?v=20260623-lo-v222',
  'js/features/popby-seasonal.js?v=20260623-lo-v222',
  'js/features/equity-scanner.js?v=20260623-lo-v222',
  'js/features/sales-scripts.js?v=20260715-lo-v225',
  'js/features/social-post.js?v=20260720-empty-posts',
  'js/features/mindset-lab.js',
  'js/data/weekend-plan-policy.js',
  'js/features/weekly-win-plan.js?v=20260720-hobby-restraint',
  'js/features/tool-bridges.js',
  'js/features/prospecting-time-blocks.js',
  'js/features/publish-kit.js?v=20260711-lo-v273',
  'js/features/blog-creator.js?v=20260720-p2-hashtag',
  'js/features/referral-rich-modals.js?v=20260623-lo-v222',
  'js/features/legacy-helpers.js?v=20260623-lo-v222',
  'js/data/newsletter-dad-jokes.js?v=20260625-lo-v231',
  'js/data/newsletter-brain-teasers.js?v=20260625-lo-v233',
  'js/features/newsletter-entertainment.js?v=20260710-lo-engagement-polish-v6',
  'js/features/newsletter-color-bundles.js?v=20260710-lo-v286',
  'js/features/newsletter-generator.js?v=20260721-ux-polish',
  'js/features/newsletter-setup-form.js?v=20260720-last-issue-chip',
  'js/features/newsletter-wizard.js?v=20260721-ux-polish',
  'js/features/business-plan-wizard.js?v=20260720-polish2',
  'js/features/ai-chat.js?v=20260720-polish',
  'js/features/underwriting.js?v=20260715-lo-v1',
  'js/features/translation-tool.js?v=20260715-tr-v265',
  'js/features/value-vault.js?v=20260623-lo-v222',
  'js/features/fact-vault-ui.js?v=20260623-lo-v222',
  'js/features/vault-rich-modals.js?v=20260623-lo-v222',
  'js/features/referral-event-modals.js?v=20260623-lo-v222',
  'js/features/app-bulk.js?v=20260709-lo-v290',
  'smart-savings/js/calculator-core.js?v=20260721-v334',
  'smart-savings/js/app.js?v=20260721-v334',
  'js/features/smart-savings-scope-css.js?v=20260721-v334',
  'js/features/smart-savings-host.js?v=20260721-v334',
  'js/features/smart-savings-polish.js?v=20260721-v334',
  'js/features/calculator.js?v=20260721-v334'
  ];
  var i = 0;
  function next() {
    if (i >= SCRIPTS.length) {
      try {
        if (typeof window.__hardHideGlobalLoading === 'function') window.__hardHideGlobalLoading();
      } catch (e) {}
      document.documentElement.classList.remove('coach-boot-stuck');
      document.dispatchEvent(new CustomEvent('coach-features-loaded'));
      return;
    }
    var src = SCRIPTS[i++];
    var s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.onload = function () { setTimeout(next, 0); }; // yield between scripts so UI can paint
    s.onerror = function () {
      console.warn('[feature-loader] failed', src);
      setTimeout(next, 0);
    };
    document.body.appendChild(s);
  }
  function start() {
    if (window.__featureLoaderStarted) return;
    window.__featureLoaderStarted = true;
    setTimeout(next, 0);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
  window.addEventListener('load', function () {
    if (!window.__featureLoaderStarted) start();
  });
})();
