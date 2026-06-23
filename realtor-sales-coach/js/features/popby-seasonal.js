/**
 * Pop-By seasonal enhancements — pins current-month picks in the Value Vault grid.
 * Patches renderValueVault after app-bulk defines it.
 */
(function () {
  'use strict';

  const MONTH_TAGS = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const MONTH_THEMES = {
    january: 'Fresh start',
    february: 'Warmth',
    march: 'Spring growth',
    april: 'Practical',
    may: 'Outdoor',
    june: 'Summer BBQ',
    july: 'Fun',
    august: 'Back to busy',
    september: 'Fall planning',
    october: 'Festive',
    november: 'Gratitude',
    december: 'Holiday warmth'
  };

  function getCurrentMonthInfo() {
    const idx = new Date().getMonth();
    return {
      index: idx,
      tag: MONTH_TAGS[idx],
      name: MONTH_NAMES[idx],
      theme: MONTH_THEMES[MONTH_TAGS[idx]] || 'Seasonal'
    };
  }

  function getMonthPopByItems() {
    const items = window.VALUE_VAULT_ITEMS || [];
    const { tag } = getCurrentMonthInfo();
    return items.filter(function (i) {
      return i.type === 'pop-by' && (i.tags || []).indexOf(tag) !== -1;
    });
  }

  function itemHasMonthTag(item, tag) {
    return item && (item.tags || []).indexOf(tag) !== -1;
  }

  function removeExistingBanner(container) {
    const existing = container.querySelector('#popby-month-picks-banner');
    if (existing) existing.remove();
  }

  function buildMonthBanner(monthInfo, picks) {
    const banner = document.createElement('div');
    banner.id = 'popby-month-picks-banner';
    banner.className = 'mb-4 rounded-2xl border border-[#F15A29]/30 bg-gradient-to-r from-[#F15A29]/8 to-[#00A89D]/8 p-4';
    const pickTitles = picks.slice(0, 3).map(function (p) { return p.title; }).join(' · ');
    banner.innerHTML = `
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="flex-1 min-w-[200px]">
          <div class="flex flex-wrap items-center gap-2 mb-1">
            <span class="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-[#F15A29] text-white">This Month</span>
            <span class="text-sm font-bold text-[#002B5C] dark:text-white">${monthInfo.name}</span>
            <span class="text-xs text-gray-500">· ${monthInfo.theme}</span>
          </div>
          <p class="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            ${picks.length} timed pop-by${picks.length === 1 ? '' : 's'} pinned below${pickTitles ? ' — ' + pickTitles : ''}.
            Rotate low / mid / wow gifts through the month.
          </p>
        </div>
        <button type="button" id="popby-open-seasonal-calendar"
                class="text-xs px-3 py-2 rounded-xl border border-[#00A89D] text-[#00A89D] font-semibold hover:bg-[#00A89D]/5 transition whitespace-nowrap">
          <i class="fas fa-calendar-alt mr-1"></i> 12-Month Calendar
        </button>
      </div>
    `;
    const calBtn = banner.querySelector('#popby-open-seasonal-calendar');
    if (calBtn) {
      calBtn.addEventListener('click', function () {
        if (typeof window.showVaultItemModal === 'function') {
          window.showVaultItemModal('popby-seasonal-calendar');
        }
      });
    }
    return banner;
  }

  function enhanceSeasonalGrid() {
    const container = document.getElementById('value-vault-grid');
    if (!container) return;

    const cardsArea = container.querySelector('#popby-cards');
    if (!cardsArea) return;

    const monthInfo = getCurrentMonthInfo();
    const monthPicks = getMonthPopByItems();
    const items = window.VALUE_VAULT_ITEMS || [];

    removeExistingBanner(container);

    cardsArea.querySelectorAll('.popby-card').forEach(function (card) {
      card.classList.remove('ring-2', 'ring-[#F15A29]', 'ring-offset-1', 'shadow-md');
      const badge = card.querySelector('.popby-month-badge');
      if (badge) badge.remove();
    });

    if (!monthPicks.length) return;

    const monthCards = [];
    cardsArea.querySelectorAll('.popby-card').forEach(function (card) {
      const item = items.find(function (i) { return i.id === card.dataset.id; });
      if (!itemHasMonthTag(item, monthInfo.tag)) return;

      card.classList.add('ring-2', 'ring-[#F15A29]', 'ring-offset-1', 'shadow-md');
      const titleRow = card.querySelector('.font-semibold.leading-tight');
      if (titleRow && !card.querySelector('.popby-month-badge')) {
        const badge = document.createElement('span');
        badge.className = 'popby-month-badge ml-1 inline-block px-1.5 py-0.5 text-[8px] font-bold uppercase rounded bg-[#F15A29] text-white align-middle';
        badge.textContent = monthInfo.name.slice(0, 3);
        titleRow.appendChild(badge);
      }
      monthCards.push(card);
    });

    monthCards.reverse().forEach(function (card) {
      cardsArea.prepend(card);
    });

    let activeCat = 'All';
    container.querySelectorAll('#popby-category-chips button').forEach(function (btn) {
      if (btn.classList.contains('text-white')) activeCat = btn.dataset.filter || 'All';
    });
    if (activeCat === 'All' || activeCat === 'Seasonal & Holiday') {
      const banner = buildMonthBanner(monthInfo, monthPicks);
      cardsArea.parentNode.insertBefore(banner, cardsArea);
    }
  }

  function patchRenderValueVault() {
    const orig = window.renderValueVault;
    if (!orig || orig.__popbySeasonalPatched) return false;

    window.renderValueVault = function () {
      orig.apply(window, arguments);
      enhanceSeasonalGrid();
    };
    window.renderValueVault.__popbySeasonalPatched = true;
    return true;
  }

  function tryPatch() {
    if (patchRenderValueVault()) {
      if (typeof window.renderValueVault === 'function') {
        window.renderValueVault();
      }
      return true;
    }
    return false;
  }

  window.getPopByMonthInfo = getCurrentMonthInfo;
  window.getPopByMonthPicks = getMonthPopByItems;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      if (!tryPatch()) {
        var attempts = 0;
        var timer = setInterval(function () {
          attempts += 1;
          if (tryPatch() || attempts > 40) clearInterval(timer);
        }, 250);
      }
    });
  } else {
    if (!tryPatch()) {
      var attempts = 0;
      var timer = setInterval(function () {
        attempts += 1;
        if (tryPatch() || attempts > 40) clearInterval(timer);
      }, 250);
    }
  }
})();