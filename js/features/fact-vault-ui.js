/**
 * js/features/fact-vault-ui.js — Ruoff Fact Vault browser in Referrals section
 */
(function () {
  'use strict';

  const CATEGORIES = ['All', 'Technology', 'Support', 'Programs', 'Culture'];

  function getFacts() {
    return Array.isArray(window.LO_FACT_VAULT_ITEMS) ? window.LO_FACT_VAULT_ITEMS : [];
  }

  function renderFactVault() {
    const grid = document.getElementById('ruoff-fact-vault-grid');
    if (!grid) return;

    const activeCat = grid.dataset.activeCategory || 'All';
    const term = (grid.dataset.searchTerm || '').toLowerCase();
    let items = getFacts();

    if (activeCat !== 'All') {
      items = items.filter((i) => i.libraryCategory === activeCat);
    }
    if (term) {
      items = items.filter((i) => {
        const hay = [i.title, i.teaser, i.libraryCategory, ...(i.tags || [])].join(' ').toLowerCase();
        return hay.includes(term);
      });
    }

    const chips = document.getElementById('ruoff-fact-category-chips');
    if (chips && !chips.dataset.wired) {
      chips.dataset.wired = '1';
      chips.innerHTML = CATEGORIES.map((cat) => `
        <button type="button" data-fact-cat="${cat}"
          class="px-3 py-1.5 text-xs font-medium rounded-full border transition whitespace-nowrap ${cat === activeCat ? 'bg-[#002B5C] text-white border-[#002B5C]' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}">
          ${cat}
        </button>
      `).join('');
      chips.querySelectorAll('[data-fact-cat]').forEach((btn) => {
        btn.addEventListener('click', () => {
          grid.dataset.activeCategory = btn.dataset.factCat;
          renderFactVault();
        });
      });
    } else if (chips) {
      chips.querySelectorAll('[data-fact-cat]').forEach((btn) => {
        const on = btn.dataset.factCat === activeCat;
        btn.className = `px-3 py-1.5 text-xs font-medium rounded-full border transition whitespace-nowrap ${on ? 'bg-[#002B5C] text-white border-[#002B5C]' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`;
      });
    }

    const searchEl = document.getElementById('ruoff-fact-search');
    if (searchEl && !searchEl.dataset.wired) {
      searchEl.dataset.wired = '1';
      searchEl.addEventListener('input', () => {
        grid.dataset.searchTerm = searchEl.value;
        renderFactVault();
      });
    }

    if (!items.length) {
      grid.innerHTML = `<p class="text-sm text-gray-500 col-span-full py-6 text-center">No facts match your search.</p>`;
      return;
    }

    grid.innerHTML = items.map((item) => `
      <button type="button" data-fact-id="${item.id}"
        class="group text-left bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-[#002B5C] rounded-2xl p-4 transition-all hover:shadow-md">
        <div class="text-[9px] uppercase tracking-wider text-[#002B5C] dark:text-[#00A89D] font-semibold mb-1">${item.libraryCategory}</div>
        <div class="font-semibold text-sm leading-tight group-hover:text-[#00A89D]">${item.title}</div>
        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">${item.teaser}</div>
      </button>
    `).join('');

    grid.querySelectorAll('[data-fact-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.factId;
        if (id && typeof window.showVaultItemModal === 'function') {
          window.showVaultItemModal(id);
        }
      });
    });

    const countEl = document.getElementById('ruoff-fact-count');
    if (countEl) countEl.textContent = String(getFacts().length);
  }

  window.renderRuoffFactVault = renderFactVault;

  function init() {
    renderFactVault();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();