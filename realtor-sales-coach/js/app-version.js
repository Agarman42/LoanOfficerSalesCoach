/**
 * App release version — bump APP_VERSION before each Git push + Render deploy.
 * Shown in the page footer so you can confirm which build is live.
 */
(function () {
  'use strict';

  window.APP_VERSION = '2.80';
  window.APP_BUILD_DATE = '2026-07-08';

  function applyAppVersionFooter() {
    const el = document.getElementById('app-version-line');
    if (!el) return;
    const name = el.getAttribute('data-app-name') || 'Sales Coach';
    el.textContent = `${name} • v${window.APP_VERSION} • ${window.APP_BUILD_DATE} • Render`;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyAppVersionFooter);
  } else {
    applyAppVersionFooter();
  }
})();