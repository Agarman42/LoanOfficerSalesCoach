/**
 * Shared checkbox grid helpers — custom feature add, select all, clear.
 * Used by listing description, open house, consultation, social, and blog tools.
 */
(function () {
  'use strict';

  function escapeAttr(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function getLabelStyles(container) {
    const sample = container.querySelector('label:not(.custom-feature-added)');
    const checkbox = sample?.querySelector('input[type="checkbox"]');
    const span = sample?.querySelector('span');
    const baseClass = sample?.className
      || 'flex items-center space-x-2 cursor-pointer p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-[#002B5C]/60 has-[:checked]:border-[#002B5C] has-[:checked]:bg-[#002B5C]/5 transition';

    return {
      labelClass: baseClass + ' custom-feature-added',
      checkboxClass: checkbox?.className || 'form-checkbox h-4 w-4 text-[#00A89D]',
      spanClass: span?.className || 'text-sm'
    };
  }

  window.addCustomFeature = function addCustomFeature(containerId, inputId) {
    const container = document.getElementById(containerId);
    const input = document.getElementById(inputId);
    if (!container || !input) {
      console.warn('[feature-checkboxes] Missing container or input:', containerId, inputId);
      return;
    }

    const text = (input.value || '').trim();
    if (!text) {
      if (typeof window.notifyUser === 'function') {
        window.notifyUser('Enter a highlight first, then click Add.', 'warning', 2800);
      } else if (typeof window.showToast === 'function') {
        window.showToast('Enter a highlight first, then click Add.', 'warning');
      }
      input.focus();
      return;
    }

    const duplicate = Array.from(container.querySelectorAll('input[type="checkbox"]')).some(
      (cb) => (cb.value || '').trim().toLowerCase() === text.toLowerCase()
    );
    if (duplicate) {
      if (typeof window.showToast === 'function') {
        window.showToast('That highlight is already in your list.', 'info');
      }
      input.value = '';
      input.focus();
      return;
    }

    const styles = getLabelStyles(container);
    const displayLabel = text.length > 52 ? text.slice(0, 49) + '…' : text;

    const label = document.createElement('label');
    label.className = styles.labelClass;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = text;
    checkbox.className = styles.checkboxClass;
    checkbox.checked = true;

    const span = document.createElement('span');
    span.className = styles.spanClass;
    span.textContent = displayLabel;
    span.title = text;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'ml-auto text-xs text-gray-400 hover:text-red-500 px-1 custom-feature-remove';
    removeBtn.setAttribute('aria-label', 'Remove custom highlight');
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      label.remove();
    });

    label.appendChild(checkbox);
    label.appendChild(span);
    label.appendChild(removeBtn);
    container.appendChild(label);

    input.value = '';
    input.focus();

    if (typeof window.showToast === 'function') {
      window.showToast('Custom highlight added.', 'success');
    }
  };

  window.selectAllFeatures = function selectAllFeatures(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.checked = true;
    });
  };

  window.clearAllFeatures = function clearAllFeatures(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.checked = false;
    });
  };
})();