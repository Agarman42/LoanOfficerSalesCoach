/**
 * Smart Savings embed polish — collapsible “maximize tips” body inside pregen.
 * (Guided modal, branding prefill, plan checks live in smart-savings/js/app.js)
 */
(function () {
  'use strict';

  var KEY = 'ss.guidanceCollapsed';

  function ensureTipsCss() {
    if (document.getElementById('ss-guidance-collapse-css')) return;
    var style = document.createElement('style');
    style.id = 'ss-guidance-collapse-css';
    style.textContent =
      '#smart-savings-pregen-guidance.ss-guidance-collapsed #ss-guidance-body{display:none!important;}' +
      '#smart-savings-pregen-guidance.ss-guidance-collapsed .ss-guidance-foot{display:none!important;}' +
      'body.ss-guided-modal-open #smart-savings-pregen-guidance{opacity:0.45;pointer-events:none;}';
    document.head.appendChild(style);
  }

  function applyGuidanceState(collapsed) {
    var wrap = document.getElementById('smart-savings-pregen-guidance');
    var btn = document.getElementById('ss-toggle-guidance');
    if (!wrap) return;
    ensureTipsCss();
    wrap.classList.toggle('ss-guidance-collapsed', !!collapsed);
    if (btn) btn.textContent = collapsed ? 'Show tips' : 'Hide tips';
  }

  function boot() {
    var btn = document.getElementById('ss-toggle-guidance');
    if (!btn || btn.__ssWired) return;
    btn.__ssWired = true;

    // Default expanded so the How-it-works section matches other tools on first visit
    var collapsed = false;
    try {
      var stored = localStorage.getItem(KEY);
      if (stored === '1') collapsed = true;
      else if (stored === '0') collapsed = false;
    } catch (e) { /* ignore */ }
    applyGuidanceState(collapsed);

    btn.addEventListener('click', function () {
      var wrap = document.getElementById('smart-savings-pregen-guidance');
      if (!wrap) return;
      var willCollapse = !wrap.classList.contains('ss-guidance-collapsed');
      applyGuidanceState(willCollapse);
      try {
        localStorage.setItem(KEY, willCollapse ? '1' : '0');
      } catch (e) { /* ignore */ }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
