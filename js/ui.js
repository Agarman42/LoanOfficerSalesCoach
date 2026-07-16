/**
 * js/ui.js
 * Shared UI utilities for the Loan Officer Sales Coach.
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
    toast.className = `flex items-start gap-3 px-5 py-3.5 rounded-2xl shadow-2xl pointer-events-auto ${colors[type] || colors.info} max-w-md`;
    const icon = document.createElement('i');
    icon.className = `fas ${icons[type] || icons.info} text-xl opacity-90 mt-0.5 shrink-0`;
    const span = document.createElement('span');
    span.className = 'text-sm font-medium leading-snug whitespace-pre-wrap';
    span.textContent = String(message == null ? '' : message);
    toast.appendChild(icon);
    toast.appendChild(span);

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
   * Preferred user notification helper. Prefer this over alert().
   * Falls back to native alert if toasts are unavailable.
   */
  window.notifyUser = function notifyUser(message, type = 'info', duration) {
    const msg = String(message == null ? '' : message);
    const d = duration != null ? duration : Math.min(9000, Math.max(3200, 2200 + msg.length * 18));
    if (typeof window.showToast === 'function') {
      return window.showToast(msg, type, d);
    }
    window.__nativeAlert ? window.__nativeAlert(msg) : window.alert(msg);
  };

  /**
   * Map common API/proxy failures into short, actionable copy.
   */
  window.formatFriendlyApiError = function formatFriendlyApiError(err, fallback) {
    const msg = (err && err.message) || String(err || '') || '';
    if (/Failed to fetch|proxy|NetworkError/i.test(msg)) {
      return 'Could not reach the AI proxy. On local dev, run bash start-proxy.sh and open http://localhost:3000.';
    }
    if (/api key|Invalid Grok|401|400|Incorrect API/i.test(msg)) {
      return 'Invalid or missing API key. Click API Key in the header and paste a real xai- key from console.x.ai.';
    }
    if (/429|rate limit|temporarily at capacity|Too Many Requests/i.test(msg)) {
      return 'xAI is temporarily at capacity (rate limit). Wait 30–60 seconds, then try again.';
    }
    if (/timed out|AbortError/i.test(msg)) {
      return 'Request timed out. Try again in a moment, or shorten the request.';
    }
    return msg || fallback || 'Something went wrong. Please try again.';
  };

  // Soft-route most alert() calls through toasts (confirm() stays native).
  (function patchAlertToToast() {
    if (window.__alertPatchedToToast) return;
    window.__alertPatchedToToast = true;
    const nativeAlert = window.alert.bind(window);
    window.__nativeAlert = nativeAlert;
    window.alert = function (message) {
      const msg = String(message == null ? '' : message);
      const lineBreaks = (msg.match(/\n/g) || []).length;
      if (msg.length > 420 || lineBreaks >= 4) {
        return nativeAlert(msg);
      }
      if (typeof window.showToast !== 'function') {
        return nativeAlert(msg);
      }
      let type = 'info';
      if (/error|fail|invalid|could not|unable/i.test(msg)) type = 'error';
      else if (/please |select or type|enter |generate .*first|no .*to |clipboard is empty/i.test(msg)) type = 'warning';
      else if (/saved|copied|downloaded|✅|✓|great choice|success/i.test(msg)) type = 'success';
      const flat = msg.replace(/\n+/g, ' — ').replace(/\s+/g, ' ').trim();
      return window.showToast(flat, type, Math.min(8500, 3000 + flat.length * 14));
    };
  })();

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

    function searchVaultItems(query, limit = 8) {
      if (typeof window.searchValueVaultItems === 'function') {
        return window.searchValueVaultItems(query, limit);
      }
      const items = window.VALUE_VAULT_ITEMS || [];
      const q = (query || '').toLowerCase().trim();
      if (!q || q.length < 2) return [];
      return items.filter((item) => {
        const hay = [
          item.title,
          item.teaser,
          item.type,
          item.pillar,
          item.cost,
          item.copyText,
          ...(item.tags || [])
        ].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(q);
      }).slice(0, limit);
    }

    function openVaultSearchHit(itemId, query) {
      if (typeof window.showSection === 'function') {
        window.showSection('value-vault');
      } else {
        const vault = document.getElementById('value-vault');
        if (vault) vault.classList.remove('hidden');
      }
      setTimeout(() => {
        if (typeof window.applyVaultSearch === 'function') {
          window.applyVaultSearch(query);
        }
        if (itemId && typeof window.showVaultItemModal === 'function') {
          window.showVaultItemModal(itemId);
        }
      }, 120);
    }

    function highlightAndShowMatches(query) {
      const q = query.toLowerCase().trim();
      if (!q || q.length < 2) {
        restoreAllSections();
        return 0;
      }

      clearHighlights();
      cacheSectionStates();

      const vaultHits = searchVaultItems(q, 8);
      let matchCount = 0;
      const sections = document.querySelectorAll('main section');

      sections.forEach(section => {
        const text = section.innerText.toLowerCase();
        const isVaultSection = section.id === 'value-vault';
        const sectionMatches = text.includes(q) || (isVaultSection && vaultHits.length > 0);

        if (sectionMatches) {
          section.classList.remove('hidden');
          matchCount++;

          const candidates = section.querySelectorAll('h1, h2, h3, h4, p, li, .accordion-content');
          candidates.forEach(el => {
            if (el.innerText.toLowerCase().includes(q)) {
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
                  break;
                }
              }
            }
          });
        } else {
          section.classList.add('hidden');
        }
      });

      if (vaultHits.length) {
        const vaultSection = document.getElementById('value-vault');
        if (vaultSection && vaultSection.classList.contains('hidden')) {
          vaultSection.classList.remove('hidden');
          matchCount++;
        }
        setTimeout(() => {
          if (typeof window.applyVaultSearch === 'function') {
            window.applyVaultSearch(q);
          }
        }, 80);
      }

      showSearchBanner(query, matchCount, vaultHits);

      return matchCount + vaultHits.length;
    }

    function showSearchBanner(query, count, vaultHits = []) {
      const old = document.getElementById('search-banner');
      if (old) old.remove();

      const banner = document.createElement('div');
      banner.id = 'search-banner';
      banner.className = 'max-w-5xl mx-auto mb-4 px-6';

      const vaultHtml = vaultHits.length ? `
        <div class="mt-3 pt-3 border-t border-white/20">
          <div class="text-xs uppercase tracking-wider opacity-80 mb-2">
            <i class="fas fa-gem mr-1"></i> Value Vault library (${vaultHits.length})
          </div>
          <div class="flex flex-wrap gap-2">
            ${vaultHits.map((item) => `
              <button type="button"
                class="header-vault-hit px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-xs font-medium transition"
                data-vault-id="${item.id}">
                ${item.title}
              </button>
            `).join('')}
            <button type="button" id="search-open-vault-btn"
              class="px-3 py-1.5 rounded-full bg-[#00A89D] hover:bg-[#00A89D]/90 text-xs font-semibold transition">
              Open Value Vault
            </button>
          </div>
        </div>
      ` : '';

      banner.innerHTML = `
        <div class="bg-[#002B5C] text-white px-5 py-3 rounded-2xl text-sm shadow">
          <div class="flex items-center justify-between gap-3">
            <div>
              Found <strong>${count}</strong> result(s) for <strong>"${query}"</strong>
              ${vaultHits.length ? ` <span class="opacity-80">· includes ${vaultHits.length} vault item${vaultHits.length === 1 ? '' : 's'}</span>` : ''}
            </div>
            <button id="search-clear-btn" class="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-xs font-bold transition flex-shrink-0">Clear</button>
          </div>
          ${vaultHtml}
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

      banner.querySelectorAll('.header-vault-hit').forEach((btn) => {
        btn.addEventListener('click', () => {
          openVaultSearchHit(btn.dataset.vaultId, query);
        });
      });

      document.getElementById('search-open-vault-btn')?.addEventListener('click', () => {
        openVaultSearchHit(null, query);
      });
    }

    function restoreAllSections() {
      clearHighlights();

      const banner = document.getElementById('search-banner');
      if (banner) banner.remove();

      if (typeof window.applyVaultSearch === 'function') {
        window.applyVaultSearch('');
      }

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

    console.log('%c[ui.js] Header search initialized (sections + Value Vault library)', 'color:#00A89D');
  }

  // =====================================================
  // MODAL VIEWPORT HELPERS — keep overlays centered on screen
  // (fixes modals nested inside sections that break position:fixed)
  // =====================================================
  // Only portal true modal shells — never [id^="modal-"] (that matched equity inner fields like #modal-pmi-alert).
  const MODAL_ROOT_IDS = [
    'task-help-modal',
    'detail-modal',
    'equity-detail-modal',
    'nurture-template-modal',
    'process-template-modal',
    'process-stage-modal',
    'scaling-modal',
    'communication-modal',
    'client-appreciation-modal',
    'referral-modal',
    'uw-question-tips-modal',
    'blog-tips-modal',
    'newsletter-tips-modal',
    'api-key-modal',
    'content-modal',
    'newsletter-choice-modal',
    'idea-modal',
    'user-profile-modal',
    'next-steps-modal',
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
    'my-saved-items-library',
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

  /** Reset overlay + inner scroll areas so every open starts at the top */
  function resetModalScroll(modal) {
    if (!modal) return;

    const scrollables = new Set([modal]);
    modal.querySelectorAll('*').forEach((el) => {
      const style = window.getComputedStyle(el);
      const overflowY = style.overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll' || el.scrollTop > 0) {
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
    modal.classList.add('flex');
    modal.style.display = 'flex';
    modal.style.pointerEvents = 'auto';
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.zIndex = modal.style.zIndex || '9999';
    modal.setAttribute('aria-hidden', 'false');
    resetModalScroll(modal);
    document.body.classList.add('modal-open');
  };

  window.closeAppModal = function closeAppModal(modal) {
    if (!modal) return;
    resetModalScroll(modal);
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    modal.style.display = 'none';
    modal.style.pointerEvents = 'none';
    modal.setAttribute('aria-hidden', 'true');
    window.releaseModalScrollLock();
  };

  /** Emergency reset — clears stuck overlays / scroll lock (safe to call anytime) */
  window.unstickPage = function unstickPage() {
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';

    const forceHideIds = [
      'global-loading',
      'detail-modal',
      'equity-detail-modal',
      'referral-modal',
      'task-help-modal',
      'api-key-modal',
      'content-modal',
      'newsletter-choice-modal',
      'idea-modal',
      'user-profile-modal',
      'uw-question-tips-modal',
      'context-tips-modal',
      'my-saved-items-library',
    'blog-tips-modal',
    'newsletter-tips-modal',
      'nurture-template-modal',
      'process-template-modal',
      'process-stage-modal',
      'scaling-modal',
      'communication-modal',
      'client-appreciation-modal',
      'modal-client-appreciation',
      'modal-partner-mastermind',
      'modal-social-networking',
      'modal-community-charity',
      'modal-value-first',
      'modal-invite-plus-one',
      'modal-co-host-leverage',
      'modal-frequency-goal',
      'modal-post-event-followup'
    ];

    forceHideIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.add('hidden');
      el.classList.remove('flex');
      if (id === 'global-loading') {
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('pointer-events', 'none', 'important');
      } else {
        el.style.display = 'none';
        el.style.pointerEvents = 'none';
      }
      el.setAttribute('aria-hidden', 'true');
    });

    document.querySelectorAll('.app-modal-overlay').forEach((el) => {
      if (el.classList.contains('hidden')) return;
      if (!isModalVisible(el)) return;
      el.classList.add('hidden');
      el.classList.remove('flex');
      el.style.display = 'none';
      el.style.pointerEvents = 'none';
    });

    document.querySelectorAll('.fixed.inset-0, .app-modal-overlay').forEach((el) => {
      if (!el.id || el.id === 'sidebar' || el.id === 'confetti-canvas') return;
      if (forceHideIds.includes(el.id)) return;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return;
      const z = parseInt(style.zIndex, 10) || 0;
      const looksLikeOverlay = z >= 50 || el.classList.contains('app-modal-overlay');
      if (looksLikeOverlay) {
        el.classList.add('hidden');
        el.classList.remove('flex');
        el.style.display = 'none';
        el.style.pointerEvents = 'none';
      }
    });

    if (typeof window.hideLoading === 'function') window.hideLoading();
    if (typeof window.closeDynamicModals === 'function') window.closeDynamicModals();
  };

  /** Clear scroll lock if no modal overlays remain visible */
  window.releaseModalScrollLock = function releaseModalScrollLock() {
    if (countOpenAppModals() === 0) {
      document.body.classList.remove('modal-open');
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
      resetModalScroll(modal);
      document.body.classList.add('modal-open');
    }
  };

  /** Close shared detail shells (Value Vault, Life Events, Scaling, Equity) */
  window.closeDetailModal = function closeDetailModal() {
    const dbModal = document.getElementById('detail-modal');
    const equityModal = document.getElementById('equity-detail-modal');
    if (typeof window.closeAppModal === 'function') {
      if (dbModal) window.closeAppModal(dbModal);
      if (equityModal) window.closeAppModal(equityModal);
    } else {
      [dbModal, equityModal].forEach((modal) => {
        if (!modal) return;
        modal.classList.remove('flex');
        modal.classList.add('hidden');
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
      });
    }
    if (typeof window.releaseModalScrollLock === 'function') {
      window.releaseModalScrollLock();
    }
  };

  /** Tear down dynamically created overlays (saved items, context tips, event fallbacks) */
  window.closeDynamicModals = function closeDynamicModals() {
    const contextTips = document.getElementById('context-tips-modal');
    if (contextTips) {
      if (typeof window.closeAppModal === 'function') window.closeAppModal(contextTips);
      else contextTips.remove();
    }
    document.querySelectorAll('.saved-library-panel, .saved-viewer-modal, #my-saved-items-library').forEach((el) => {
      if (typeof window.closeAppModal === 'function') window.closeAppModal(el);
      else el.remove();
    });
    document.querySelectorAll('.fixed.inset-0[data-event-fallback-modal="true"]').forEach((el) => el.remove());
  };

  const EQUITY_MODAL_INNER_IDS = new Set([
    'modal-client-name', 'modal-address', 'modal-type-badge', 'modal-phone-link',
    'modal-phone-na', 'modal-email-link', 'modal-email-na', 'modal-buyers-agent-section',
    'modal-transaction-type', 'modal-buyers-agent', 'modal-program', 'modal-closing-date',
    'modal-current-rate', 'modal-term', 'modal-original-ltv', 'modal-balance',
    'modal-value', 'modal-original-pi', 'modal-original-mi', 'modal-original-insurance',
    'modal-original-taxes', 'modal-pmi-alert', 'modal-scripts',
    'social-modal-title', 'social-modal-body', 'social-modal-eyebrow', 'social-modal-badge', 'social-modal-back'
  ]);

  function portalModalRoot(el) {
    if (!el || EQUITY_MODAL_INNER_IDS.has(el.id)) return;
    if (el.parentElement && el.parentElement !== document.body) {
      document.body.appendChild(el);
    }
    el.classList.add('app-modal-overlay');
  }

  function repairMisportaledModalParts() {
    EQUITY_MODAL_INNER_IDS.forEach(id => {
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
      if (!el.id || seen.has(el.id) || EQUITY_MODAL_INNER_IDS.has(el.id)) return;
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

  function closeModalFromBackdrop(modal, id) {
    if (!modal) return;

    if (id === 'content-modal' && typeof window.closeSocialContentModal === 'function') {
      window.closeSocialContentModal();
    } else if ((id === 'detail-modal' || id === 'equity-detail-modal') && typeof window.closeDetailModal === 'function') {
      window.closeDetailModal();
    } else if (id === 'task-help-modal' && typeof window.closeTaskHelp === 'function') {
      window.closeTaskHelp();
    } else if (id === 'user-profile-modal' && typeof window.closeUserProfile === 'function') {
      window.closeUserProfile();
    } else if (id === 'referral-modal' && typeof window.closeReferralModal === 'function') {
      window.closeReferralModal();
    } else if (id === 'uw-question-tips-modal' && typeof window.closeUwQuestionTips === 'function') {
      window.closeUwQuestionTips();
    } else if (id === 'blog-tips-modal' && typeof window.closeBlogTips === 'function') {
      window.closeBlogTips();
    } else if (id === 'newsletter-tips-modal' && typeof window.closeNewsletterTips === 'function') {
      window.closeNewsletterTips();
    } else if (id === 'idea-modal' && typeof window.closeIdeaModal === 'function') {
      window.closeIdeaModal();
    } else if (id === 'newsletter-choice-modal' && typeof window.closeNewsletterChoiceModal === 'function') {
      window.closeNewsletterChoiceModal();
    } else if (id === 'next-steps-modal' && typeof window.closeNextSteps === 'function') {
      window.closeNextSteps();
    } else if (id === 'context-tips-modal' && typeof window.closeContextTipsModal === 'function') {
      window.closeContextTipsModal();
    } else if (id === 'api-key-modal' && typeof window.closeApiKeyModal === 'function') {
      window.closeApiKeyModal();
    } else if (id === 'my-saved-items-library' && typeof window.closeSavedItemsLibrary === 'function') {
      window.closeSavedItemsLibrary();
    } else if (id.startsWith('modal-') && typeof window.closeEventModal === 'function') {
      window.closeEventModal(id.replace('modal-', ''));
    } else if (modal.classList?.contains('saved-viewer-modal') || modal.classList?.contains('saved-library-panel')) {
      if (typeof window.closeSavedOverlay === 'function') window.closeSavedOverlay(modal);
      else window.closeNamedModal(modal);
    } else {
      window.closeNamedModal(modal);
    }
  }

  /**
   * Close on intentional backdrop click only — not when the user drags a text
   * selection from inside the panel and releases outside (mousedown ≠ mouseup target).
   */
  window.ensureModalBackdropClose = function ensureModalBackdropClose(modal) {
    if (!modal || modal._backdropHandlerAttached) return;
    const id = modal.id || '';
    let pressedOnBackdrop = false;

    modal.addEventListener('mousedown', (e) => {
      pressedOnBackdrop = (e.target === modal);
    });

    modal.addEventListener('mouseup', (e) => {
      if (!pressedOnBackdrop || e.target !== modal) {
        pressedOnBackdrop = false;
        return;
      }
      pressedOnBackdrop = false;

      const sel = window.getSelection && window.getSelection();
      if (sel && sel.toString().trim().length > 0) return;

      closeModalFromBackdrop(modal, id);
    });

    modal._backdropHandlerAttached = true;
  };

  function wireModalBackdropCloses() {
    const seen = new Set();
    MODAL_ROOT_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el || seen.has(id)) return;
      seen.add(id);
      window.ensureModalBackdropClose(el);
    });
    document.querySelectorAll('.app-modal-overlay').forEach((el) => {
      if (!el.id || seen.has(el.id) || EQUITY_MODAL_INNER_IDS.has(el.id)) return;
      seen.add(el.id);
      window.ensureModalBackdropClose(el);
    });
  }

  // Boot the UI helpers when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    // Legacy header search superseded by js/features/global-search.js (command palette)
    portalNestedFixedModals();
    wireModalBackdropCloses();
    if (typeof window.unstickPage === 'function') window.unstickPage();
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
