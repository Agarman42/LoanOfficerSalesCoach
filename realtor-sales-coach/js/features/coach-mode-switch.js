/**
 * Shared Guided setup | Full form switch for coach tools.
 * Matches Smart Savings mode-bar UX: one toggle, same fields either path.
 *
 * Markup:
 * <div class="coach-mode-bar" data-coach-mode-tool="planning">
 *   <div class="coach-mode-toggle" role="group" aria-label="...">
 *     <button type="button" class="coach-mode-btn is-active" data-coach-mode="guided"
 *       data-open-fn="openBusinessPlanWizard">…</button>
 *     <button type="button" class="coach-mode-btn" data-coach-mode="full"
 *       data-scroll-to="plan-full-form">…</button>
 *   </div>
 *   <p class="coach-mode-hint">…</p>
 * </div>
 */
(function () {
  'use strict';

  function setActive(bar, mode) {
    if (!bar) return;
    bar.querySelectorAll('.coach-mode-btn').forEach(function (btn) {
      var on = btn.getAttribute('data-coach-mode') === mode;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    try {
      var tool = bar.getAttribute('data-coach-mode-tool') || 'tool';
      localStorage.setItem('coach.mode.' + tool, mode);
    } catch (e) { /* ignore */ }
  }

  function openFn(name) {
    if (!name) return null;
    var fn = window[name];
    return typeof fn === 'function' ? fn : null;
  }

  function scrollToId(id) {
    if (!id) return;
    var el = document.getElementById(id);
    if (!el) return;
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      el.scrollIntoView(true);
    }
    // brief focus ring for orientation
    el.classList.add('coach-mode-target-flash');
    setTimeout(function () {
      el.classList.remove('coach-mode-target-flash');
    }, 1200);
  }

  function wireBar(bar) {
    if (!bar || bar.__coachModeWired) return;
    bar.__coachModeWired = true;

    bar.querySelectorAll('.coach-mode-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var mode = btn.getAttribute('data-coach-mode') || 'full';
        setActive(bar, mode);

        if (mode === 'guided') {
          var name = btn.getAttribute('data-open-fn');
          var fn = openFn(name);
          if (fn) {
            try { fn(); } catch (e) { console.warn('[coach-mode]', e); }
          }
          return;
        }

        // full form
        var scrollId = btn.getAttribute('data-scroll-to');
        if (scrollId) scrollToId(scrollId);
        // close modal wizards if open
        if (typeof window.closeBusinessPlanWizard === 'function') {
          try { window.closeBusinessPlanWizard(); } catch (e) { /* ignore */ }
        }
        if (typeof window.closeNewsletterWizard === 'function') {
          try { window.closeNewsletterWizard(); } catch (e) { /* ignore */ }
        }
        if (typeof window.closeBioWizard === 'function') {
          try { window.closeBioWizard(); } catch (e) { /* ignore */ }
        }
      });
    });

    // restore last choice (UI only — don't auto-open wizard)
    try {
      var tool = bar.getAttribute('data-coach-mode-tool') || 'tool';
      var saved = localStorage.getItem('coach.mode.' + tool);
      if (saved === 'guided' || saved === 'full') setActive(bar, saved);
      else setActive(bar, 'full'); // default full form visible; guided is opt-in
    } catch (e) {
      setActive(bar, 'full');
    }
  }

  function init() {
    document.querySelectorAll('.coach-mode-bar').forEach(wireBar);
  }

  // Public: wizards can mark guided active while open
  window.setCoachModeSwitch = function (tool, mode) {
    var bar = document.querySelector('.coach-mode-bar[data-coach-mode-tool="' + tool + '"]');
    if (bar) setActive(bar, mode);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  setTimeout(init, 400);
})();
