/**
 * js/ui.js
 * Shared UI utilities for the Ultimate Agent Sales Coach.
 *
 * Phase 0:
 * - Toast notification system (replaces alert() calls over time)
 * - Working header search bar
 */

(function () {
  // =====================================================
  // TOAST NOTIFICATION SYSTEM
  // =====================================================
  let toastContainer = null;

  function ensureToastContainer() {
    if (toastContainer) return toastContainer;

    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
    return toastContainer;
  }

  /**
   * Show a toast notification.
   * @param {string} message
   * @param {'success'|'error'|'info'|'warning'} [type='info']
   * @param {number} [duration=3200]
   */
  window.showToast = function showToast(message, type = 'info', duration = 3200) {
    const container = ensureToastContainer();

    const colors = {
      success: 'bg-emerald-600 text-white',
      error: 'bg-red-600 text-white',
      warning: 'bg-amber-500 text-white',
      info: 'bg-[#002B5C] text-white'
    };

    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = `flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl pointer-events-auto ${colors[type] || colors.info} max-w-sm`;
    toast.innerHTML = `
      <i class="fas ${icons[type] || icons.info} text-xl opacity-90"></i>
      <span class="text-sm font-medium leading-snug">${message}</span>
    `;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.style.transition = 'all 0.2s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
      });
    });

    const remove = () => {
      toast.style.transition = 'all 0.18s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      setTimeout(() => toast.remove(), 180);
    };

    toast.addEventListener('click', remove);

    if (duration > 0) {
      setTimeout(remove, duration);
    }

    return toast;
  };

  /**
   * Unified user notification — prefers toast, falls back to console.
   * @param {string} message
   * @param {'success'|'error'|'info'|'warning'} [type='info']
   * @param {number} [duration=3200]
   */
  window.notifyUser = function notifyUser(message, type = 'info', duration = 3200) {
    if (typeof window.showToast === 'function') {
      return window.showToast(message, type, duration);
    }
    console.warn('[notify]', type + ':', message);
    return null;
  };

  /** Shown when toggleSaveIdea / vault save isn't loaded yet. */
  window.saveNotReady = function saveNotReady(message) {
    window.notifyUser(
      message || 'Save ready after refresh — try again in a moment.',
      'warning',
      4000
    );
  };

  // =====================================================
  // HEADER SEARCH BAR (fully functional)
  // =====================================================
  function initHeaderSearch() {
    const searchInput = document.getElementById('search');
    if (!searchInput) {
      console.warn('[ui] #search input not found');
      return;
    }

    let searchTimeout = null;
    let originalDisplayStates = new Map(); // sectionId -> was hidden?

    // Store initial hidden state of all main sections
    function cacheSectionStates() {
      document.querySelectorAll('main section').forEach(sec => {
        if (!originalDisplayStates.has(sec.id)) {
          originalDisplayStates.set(sec.id, sec.classList.contains('hidden'));
        }
      });
    }

    function clearHighlights() {
      document.querySelectorAll('mark.search-hit').forEach(mark => {
        const parent = mark.parentNode;
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
        parent.normalize();
      });
    }

    function highlightAndShowMatches(query) {
      const q = query.toLowerCase().trim();
      if (!q || q.length < 2) {
        restoreAllSections();
        return 0;
      }

      clearHighlights();
      cacheSectionStates();

      let matchCount = 0;
      const sections = document.querySelectorAll('main section');

      sections.forEach(section => {
        const text = section.innerText.toLowerCase();
        if (text.includes(q)) {
          // Show the section
          section.classList.remove('hidden');
          matchCount++;

          // Simple highlight on headings and list items
          const candidates = section.querySelectorAll('h1, h2, h3, h4, p, li, .accordion-content');
          candidates.forEach(el => {
            if (el.innerText.toLowerCase().includes(q)) {
              // Wrap first match occurrence
              const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
              let node;
              while ((node = walker.nextNode())) {
                const idx = node.nodeValue.toLowerCase().indexOf(q);
                if (idx !== -1) {
                  const before = node.nodeValue.slice(0, idx);
                  const match = node.nodeValue.slice(idx, idx + q.length);
                  const after = node.nodeValue.slice(idx + q.length);

                  const mark = document.createElement('mark');
                  mark.className = 'search-hit';
                  mark.style.cssText = 'background:#fef08c; color:#111827; padding:1px 3px; border-radius:3px;';
                  mark.textContent = match;

                  const frag = document.createDocumentFragment();
                  if (before) frag.appendChild(document.createTextNode(before));
                  frag.appendChild(mark);
                  if (after) frag.appendChild(document.createTextNode(after));

                  node.parentNode.replaceChild(frag, node);
                  break; // only first hit per element for performance
                }
              }
            }
          });
        } else {
          section.classList.add('hidden');
        }
      });

      // Show a helpful banner if we have matches
      showSearchBanner(query, matchCount);

      return matchCount;
    }

    function showSearchBanner(query, count) {
      // Remove old banner
      const old = document.getElementById('search-banner');
      if (old) old.remove();

      const banner = document.createElement('div');
      banner.id = 'search-banner';
      banner.className = 'max-w-5xl mx-auto mb-4 px-6';
      banner.innerHTML = `
        <div class="flex items-center justify-between bg-[#002B5C] text-white px-5 py-2.5 rounded-2xl text-sm shadow">
          <div>
            Found <strong>${count}</strong> section(s) matching <strong>"${query}"</strong>
          </div>
          <button id="search-clear-btn" class="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-xs font-bold transition">Clear Search</button>
        </div>
      `;

      const main = document.querySelector('main');
      if (main) {
        main.insertBefore(banner, main.firstElementChild);
      }

      document.getElementById('search-clear-btn')?.addEventListener('click', () => {
        searchInput.value = '';
        clearSearch();
      });
    }

    function restoreAllSections() {
      clearHighlights();

      const banner = document.getElementById('search-banner');
      if (banner) banner.remove();

      // Restore previous visibility (most were hidden)
      document.querySelectorAll('main section').forEach(sec => {
        const wasHidden = originalDisplayStates.get(sec.id);
        if (wasHidden) {
          sec.classList.add('hidden');
        } else {
          sec.classList.remove('hidden');
        }
      });
    }

    function clearSearch() {
      searchInput.value = '';
      restoreAllSections();
    }

    // Attach listeners
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      const query = searchInput.value;

      searchTimeout = setTimeout(() => {
        const count = highlightAndShowMatches(query);
        if (query.length > 1 && count === 0) {
          if (window.showToast) {
            window.showToast(`No matches for "${query}"`, 'info', 1400);
          }
        }
      }, 220);
    });

    // Keyboard niceties
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        clearSearch();
        searchInput.blur();
      }
    });

    // Optional: focus search with "/"
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement.tagName === 'BODY') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
    });

    console.log('%c[ui.js] Header search initialized (type in the top bar to filter sections)', 'color:#00A89D');
  }

  // =====================================================
  // MODAL VIEWPORT HELPERS — keep overlays centered + reliable close
  // (mirrors LO tool; fixes modals nested inside <main> sections)
  // =====================================================
  const MODAL_ROOT_IDS = [
    'global-loading',
    'task-help-modal',
    'detail-modal',
    'nurture-template-modal',
    'process-template-modal',
    'process-stage-modal',
    'scaling-modal',
    'communication-modal',
    'client-appreciation-modal',
    'referral-modal',
    'blog-tips-modal',
    'newsletter-tips-modal',
    'api-key-modal',
    'content-modal',
    'newsletter-choice-modal',
    'idea-modal',
    'user-profile-modal',
    'modal-drive-attendance',
    'modal-client-appreciation',
    'modal-partner-mastermind',
    'modal-social-networking',
    'modal-community-charity',
    'modal-value-first',
    'modal-invite-plus-one',
    'modal-co-host-leverage',
    'modal-frequency-goal',
    'modal-post-event-followup',
    'context-tips-modal',
    'my-saved-items-library'
  ];

  function isModalVisible(el) {
    if (!el) return false;
    if (el.classList.contains('hidden')) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    return el.classList.contains('flex') || style.display === 'flex';
  }

  function countOpenAppModals() {
    let count = 0;
    const seen = new Set();
    document.querySelectorAll('.app-modal-overlay').forEach(el => {
      if (!el.id || seen.has(el.id)) return;
      seen.add(el.id);
      if (isModalVisible(el)) count++;
    });
    MODAL_ROOT_IDS.forEach(id => {
      if (seen.has(id)) return;
      const el = document.getElementById(id);
      if (el && isModalVisible(el)) count++;
    });
    return count;
  }

  window.ensureModalInViewport = function ensureModalInViewport(modal) {
    if (!modal) return null;
    if (modal.parentElement !== document.body) {
      document.body.appendChild(modal);
    }
    modal.classList.add('app-modal-overlay');
    return modal;
  };

  function clearModalForceHide(modal) {
    if (!modal) return;
    modal.style.removeProperty('display');
    modal.style.removeProperty('pointer-events');
    modal.style.removeProperty('visibility');
    modal.style.removeProperty('opacity');
  }
  window.clearModalForceHide = clearModalForceHide;

  function resetModalScroll(modal) {
    if (!modal) return;
    const scrollables = new Set([modal]);
    modal.querySelectorAll('*').forEach((el) => {
      const style = window.getComputedStyle(el);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll' || el.scrollTop > 0) {
        scrollables.add(el);
      }
    });
    const resetAll = () => {
      scrollables.forEach((el) => {
        el.scrollTop = 0;
        el.scrollLeft = 0;
      });
    };
    resetAll();
    requestAnimationFrame(() => {
      resetAll();
      requestAnimationFrame(resetAll);
    });
  }
  window.resetModalScroll = resetModalScroll;

  window.openAppModal = function openAppModal(modal) {
    if (!modal) return;
    window.ensureModalInViewport(modal);
    clearModalForceHide(modal);
    resetModalScroll(modal);
    modal.classList.remove('hidden');
    modal.classList.add('flex', 'items-center', 'justify-center');
    modal.style.display = 'flex';
    modal.style.pointerEvents = 'auto';
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.zIndex = modal.style.zIndex || '9999';
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  };

  window.closeAppModal = function closeAppModal(modal) {
    if (!modal) return;
    resetModalScroll(modal);
    modal.classList.add('hidden');
    modal.classList.remove('flex', 'items-center', 'justify-center');
    modal.style.display = 'none';
    modal.style.pointerEvents = 'none';
    modal.setAttribute('aria-hidden', 'true');
    window.releaseModalScrollLock();
  };

  window.releaseModalScrollLock = function releaseModalScrollLock() {
    if (countOpenAppModals() === 0) {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
    }
  };

  window.closeNamedModal = function closeNamedModal(idOrEl) {
    const modal = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
    if (!modal) return;
    if (typeof window.closeAppModal === 'function') {
      window.closeAppModal(modal);
    } else {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
      window.releaseModalScrollLock();
    }
  };

  window.openNamedModal = function openNamedModal(idOrEl) {
    const modal = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
    if (!modal) return;
    if (typeof window.openAppModal === 'function') {
      window.openAppModal(modal);
    } else {
      window.ensureModalInViewport(modal);
      resetModalScroll(modal);
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      modal.style.display = 'flex';
      modal.style.pointerEvents = 'auto';
      document.body.classList.add('modal-open');
    }
  };

  window.closeDetailModal = function closeDetailModal() {
    const dbModal = document.getElementById('detail-modal');
    if (typeof window.closeAppModal === 'function') {
      if (dbModal) window.closeAppModal(dbModal);
    } else if (dbModal) {
      dbModal.classList.remove('flex');
      dbModal.classList.add('hidden');
      dbModal.style.display = 'none';
    }
    window.releaseModalScrollLock();
  };

  window.closeDynamicModals = function closeDynamicModals() {
    document.querySelectorAll('.fixed.inset-0[data-event-fallback-modal="true"]').forEach((el) => el.remove());
  };

  const MODAL_INNER_IDS = new Set([
    'social-modal-title', 'social-modal-body', 'social-modal-eyebrow', 'social-modal-badge', 'social-modal-back'
  ]);

  function portalModalRoot(el) {
    if (!el || MODAL_INNER_IDS.has(el.id)) return;
    if (el.parentElement && el.parentElement !== document.body) {
      document.body.appendChild(el);
    }
    el.classList.add('app-modal-overlay');
  }

  function repairMisportaledModalParts() {
    MODAL_INNER_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove('app-modal-overlay');
      if (el.parentElement === document.body) {
        el.style.display = 'none';
      }
    });
  }

  function portalNestedFixedModals() {
    const seen = new Set();
    document.querySelectorAll('.app-modal-overlay').forEach(el => {
      if (!el.id || seen.has(el.id) || MODAL_INNER_IDS.has(el.id)) return;
      seen.add(el.id);
      portalModalRoot(el);
    });
    MODAL_ROOT_IDS.forEach(id => {
      if (seen.has(id)) return;
      const el = document.getElementById(id);
      if (!el) return;
      seen.add(id);
      portalModalRoot(el);
    });
    repairMisportaledModalParts();
  }

  window.ensureModalBackdropClose = function ensureModalBackdropClose(modal) {
    if (!modal || modal._backdropHandlerAttached) return;
    const id = modal.id || '';
    modal.addEventListener('click', (e) => {
      if (e.target !== modal) return;
      if (id === 'content-modal' && typeof window.closeSocialContentModal === 'function') {
        window.closeSocialContentModal();
      } else if (id === 'detail-modal' && typeof window.closeDetailModal === 'function') {
        window.closeDetailModal();
      } else if (id === 'task-help-modal' && typeof window.closeTaskHelp === 'function') {
        window.closeTaskHelp();
      } else if (id.startsWith('modal-') && typeof window.closeEventModal === 'function') {
        window.closeEventModal(id.replace('modal-', ''));
      } else {
        window.closeNamedModal(modal);
      }
    });
    modal._backdropHandlerAttached = true;
  };

  function wireModalBackdropCloses() {
    MODAL_ROOT_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      window.ensureModalBackdropClose(el);
    });
  }

  window.unstickPage = function unstickPage() {
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    MODAL_ROOT_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.add('hidden');
      el.classList.remove('flex');
      el.style.display = 'none';
      el.style.pointerEvents = 'none';
      el.setAttribute('aria-hidden', 'true');
    });
    window.releaseModalScrollLock();
    if (typeof window.hideLoading === 'function') window.hideLoading();
    if (typeof window.closeDynamicModals === 'function') window.closeDynamicModals();
  };

  // Boot the UI helpers when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    initHeaderSearch();
    portalNestedFixedModals();
    wireModalBackdropCloses();
  });

  // Also expose a manual clear if needed
  window.clearSearch = () => {
    const input = document.getElementById('search');
    if (input) {
      input.value = '';
      // trigger the logic
      input.dispatchEvent(new Event('input'));
    }
  };
})();
