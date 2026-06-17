/**
 * js/ui.js
 * Shared UI utilities for the Ultimate Realtor Sales Coach.
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

  // Boot the UI helpers when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    initHeaderSearch();
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
