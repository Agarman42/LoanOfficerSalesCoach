/**
 * Shared accessibility helpers for coach modal wizards (Bio, Business Plan, Newsletter).
 */
(function () {
  'use strict';

  function getFocusable(scope) {
    if (!scope) return [];
    var sel =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.prototype.slice.call(scope.querySelectorAll(sel)).filter(function (el) {
      return !el.hasAttribute('disabled') && el.offsetParent !== null && el.getAttribute('aria-hidden') !== 'true';
    });
  }

  function lockBodyScroll() {
    document.body.style.overflow = 'hidden';
  }

  function unlockBodyScroll() {
    document.body.style.overflow = '';
  }

  /**
   * Wire Escape-to-close + Tab focus trap for a modal overlay.
   * @param {() => HTMLElement|null} getOverlay
   * @param {() => void} onClose
   * @param {() => boolean} [isOpen]
   */
  function wireWizardA11y(getOverlay, onClose, isOpen) {
    function openCheck() {
      if (typeof isOpen === 'function') return !!isOpen();
      var el = getOverlay();
      return !!(el && !el.classList.contains('hidden'));
    }

    document.addEventListener('keydown', function (e) {
      if (!openCheck()) return;
      var overlay = getOverlay();
      if (!overlay) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        try {
          onClose();
        } catch (err) {
          console.warn('[wizard-a11y] close failed', err);
        }
        return;
      }

      if (e.key !== 'Tab') return;
      var dialog = overlay.querySelector('[role="dialog"]') || overlay.firstElementChild || overlay;
      var focusable = getFocusable(dialog);
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  window.CoachWizardA11y = {
    getFocusable: getFocusable,
    lockBodyScroll: lockBodyScroll,
    unlockBodyScroll: unlockBodyScroll,
    wireWizardA11y: wireWizardA11y,
  };
})();
