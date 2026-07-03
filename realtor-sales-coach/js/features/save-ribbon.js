/**
 * save-ribbon.js — shared Copy + Save action helpers for My Saved Items
 */
(function () {
  'use strict';

  const BTN_CLASS =
    'save-ribbon-btn text-xs px-3 py-1 rounded-lg border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white transition-all flex items-center gap-1 shadow-sm';

  function getContent(value) {
    return typeof value === 'function' ? value() : (value || '');
  }

  function feedback() {
    if (typeof window.showSavedFeedback === 'function') {
      window.showSavedFeedback('Saved to My Saved Items');
    } else if (typeof window.showToast === 'function') {
      window.showToast('Saved to My Saved Items', 'success');
    }
  }

  function save(title, content, btn, type) {
    if (typeof window.toggleSaveIdea !== 'function') {
      window.saveNotReady();
      return false;
    }
    const body = getContent(content);
    window.toggleSaveIdea(title, body, btn || null, type || 'social');
    feedback();
    return true;
  }

  function createButton(opts) {
    const { title, content, type = 'social', label = 'Save', extraClass = '' } = opts || {};
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `${BTN_CLASS} ${extraClass}`.trim();
    btn.title = 'Save to My Saved Items';
    btn.innerHTML = `<i class="far fa-bookmark"></i><span>${label}</span>`;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      save(title, content, btn, type);
    });
    return btn;
  }

  function attachNextTo(anchorEl, opts) {
    if (!anchorEl || !anchorEl.parentElement) return null;
    const parent = anchorEl.parentElement;
    if (parent.querySelector('.save-ribbon-btn')) return parent.querySelector('.save-ribbon-btn');

    let bar = parent.querySelector('.save-ribbon-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'save-ribbon-bar flex items-center gap-1.5';
      if (anchorEl.classList.contains('absolute')) {
        bar.className += ' absolute top-0 right-0';
        parent.style.position = parent.style.position || 'relative';
      }
      parent.insertBefore(bar, anchorEl);
      bar.appendChild(anchorEl);
    }

    const saveBtn = createButton(opts);
    bar.appendChild(saveBtn);
    return saveBtn;
  }

  window.SaveRibbon = {
    save,
    createButton,
    attachNextTo,
    buttonClass: BTN_CLASS
  };

  window.saveToMyItems = save;
})();