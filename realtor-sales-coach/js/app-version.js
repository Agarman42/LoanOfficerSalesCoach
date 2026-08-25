/**
 * App release version — bump APP_VERSION before each Git push + Render deploy.
 * Shown in the page footer so you can confirm which build is live.
 * When LO partner chrome is active, also stamped into the sticky brand bar
 * (that bar would otherwise cover #app-version-line at the bottom).
 */
(function () {
  'use strict';

  window.APP_VERSION = '3.85';
  window.APP_BUILD_DATE = '2026-08-25';

  function applyAppVersionFooter() {
    const el = document.getElementById('app-version-line');
    if (el) {
      const name = el.getAttribute('data-app-name') || 'Sales Coach';
      el.textContent = `${name} • v${window.APP_VERSION} • ${window.APP_BUILD_DATE} • Render`;
    }
    // Partner sticky footer may already be painted — refresh its version chip
    if (typeof window.refreshLoBrandFooterVersion === 'function') {
      try { window.refreshLoBrandFooterVersion(); } catch (e) { /* ignore */ }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyAppVersionFooter);
  } else {
    applyAppVersionFooter();
  }
})();
