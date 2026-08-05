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
  'js/features/bio-creator.js?v=20260717-realtor-home',
  'js/features/bio-wizard.js?v=20260720-polish2',
  'js/features/saved-items-library.js?v=20260806-vault-ui',
  'js/features/global-search-deep-index.js?v=20260719-content-hub',
  'js/features/global-search-dynamic-index.js?v=20260717-realtor-search',
  'js/features/global-search-config.js?v=20260719-content-hub',
  'js/features/global-search.js?v=20260719-content-hub',
  'js/features/section-bottom-banners.js?v=20260720-p2-content-hub',
  'js/features/coach-polish.js?v=20260728-realtor-parity',
  'js/app-version.js?v=20260730-v340',
  'js/features/generation-rules.js?v=20260720-hobby-restraint',
  'js/features/feature-checkboxes.js?v=20260706-realtor-v277',
  'js/features/save-ribbon.js?v=20260706-realtor-v273',
  'js/features/wizard-a11y.js?v=20260720-polish2',
  'js/features/coach-mode-switch.js?v=20260719-mode1',
  'js/features/social-modals.js?v=20260706-realtor-v273',
  'js/features/process-rich-modals.js?v=20260706-realtor-v273',
  'js/features/nurture-rich-modals.js?v=20260706-realtor-v273',
  'js/features/database-rich-modals.js?v=20260706-realtor-v273',
  'js/features/event-rich-modals.js?v=20260706-realtor-v273',
  'js/features/referral-rich-modals.js?v=20260706-realtor-v273',
  'js/features/rich-modals-restore.js?v=20260706-realtor-v273',
  'js/features/popby-seasonal.js?v=20260706-realtor-v273',
  'js/features/sales-scripts.js?v=20260706-realtor-v273',
  'js/features/listing-description.js?v=20260706-realtor-v279',
  'js/features/open-house.js?v=20260706-realtor-v278',
  'js/features/consultation-kit.js?v=20260706-realtor-v280',
  'js/features/publish-kit.js?v=20260708-realtor-v276',
  'js/features/social-post.js?v=20260729-profile-ux',
  'js/features/mindset-lab.js?v=20260706-realtor-v273',
  'js/data/weekend-plan-policy.js?v=20260706-realtor-v273',
  'js/features/weekly-win-plan.js?v=20260720-hobby-restraint',
  'js/features/business-plan-wizard.js?v=20260720-polish2',
  'js/features/tool-bridges.js?v=20260706-realtor-v273',
  'js/features/prospecting-time-blocks.js?v=20260706-realtor-v273',
  'js/features/blog-creator.js?v=20260720-p2-hashtag',
  'js/features/legacy-helpers.js?v=20260706-realtor-v273',
  'js/data/newsletter-dad-jokes.js?v=20260706-realtor-v273',
  'js/data/newsletter-brain-teasers.js?v=20260706-realtor-v273',
  'js/features/newsletter-entertainment.js?v=20260729-blank-preview-fix',
  'js/features/newsletter-color-bundles.js?v=20260707-realtor-v303',
  'js/features/newsletter-generator.js?v=20260804-nl-ig-dirs',
  'js/features/newsletter-setup-form.js?v=20260720-last-issue-chip',
  'js/features/newsletter-wizard.js?v=20260720-last-issue-chip',
  'js/features/ai-chat.js?v=20260720-ai-chat',
  'js/features/calculator.js?v=20260806-compare-ux',
  'js/features/translation-tool.js?v=20260804-tr-custom-lang',
  'js/features/value-vault.js?v=20260706-realtor-v273',
  'js/features/vault-rich-modals.js?v=20260706-realtor-v273',
  'js/inline-extracted/re-block-1.js?v=20260721-static-tw',
  'js/inline-extracted/re-block-2.js?v=20260721-static-tw'
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
