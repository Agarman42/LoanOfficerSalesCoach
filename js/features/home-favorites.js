/**
 * Home favorites — pin coach sections to a personalized Home strip.
 * Works across LO / Realtor / Recruiter via window.HOME_FAVORITES_CONFIG.
 *
 * Storage: localStorage key from config (default coach.homeFavorites.v1)
 * Favorites control the "Your favorites" panel on #home; Daily loop stays fixed.
 */
(function () {
  'use strict';

  const DEFAULT_KEY = 'coach.homeFavorites.v1';
  const MAX_FAVORITES = 12;

  /**
   * @typedef {{ sectionId: string, title: string, icon: string, sub?: string, accent?: string, openAction?: string }} FavItem
   * openAction: special openers that are not page sections (e.g. saved-items library modal)
   */
  /** @type {FavItem[]} */
  const LO_CATALOG = [
    { sectionId: 'weekly-win-plan', title: 'Weekly Win Plan', icon: 'fa-fire', sub: 'This week', accent: '#F15A29' },
    { sectionId: 'planning', title: '2026 Business Plan', icon: 'fa-chart-line', sub: 'Annual map', accent: '#00A89D' },
    { sectionId: 'content-hub', title: 'Content Studio', icon: 'fa-pen-nib', sub: 'Social · Blog · NL', accent: '#00A89D' },
    { sectionId: 'social', title: 'Social Media Strategy', icon: 'fa-share-alt', sub: 'Pillars & playbooks', accent: '#00A89D' },
    { sectionId: 'newsletter-generator', title: 'Newsletter', icon: 'fa-envelope', sub: 'Database touch', accent: '#00A89D' },
    { sectionId: 'social-post', title: 'Social Post & Calendar', icon: 'fa-calendar-plus', sub: 'This week’s posts', accent: '#F15A29' },
    { sectionId: 'blog', title: 'Blog Creator', icon: 'fa-pen-fancy', sub: 'Authority content', accent: '#00A89D' },
    { sectionId: 'smart-savings', title: 'Smart Savings', icon: 'fa-piggy-bank', sub: 'Client meeting', accent: '#002B5C' },
    { sectionId: 'equity-scanner', title: 'Equity Scanner', icon: 'fa-search-dollar', sub: 'Opportunities', accent: '#F15A29' },
    { sectionId: 'bio-creator', title: 'Bio Builder', icon: 'fa-id-card', sub: 'Company voice', accent: '#00A89D' },
    { sectionId: 'sales-script', title: 'Sales Scripts', icon: 'fa-comment-dots', sub: 'Live conversations', accent: '#F15A29' },
    { sectionId: 'ai-chat', title: 'AI Coach', icon: 'fa-robot', sub: 'Think with me', accent: '#00A89D' },
    { sectionId: 'value-vault', title: 'Value Vault', icon: 'fa-gem', sub: 'Gifts & pop-bys', accent: '#F15A29' },
    { sectionId: 'database', title: 'Database Nurturing', icon: 'fa-database', sub: 'Past clients', accent: '#002B5C' },
    { sectionId: 'referrals', title: 'Referral Partners', icon: 'fa-handshake', sub: 'Partner system', accent: '#00A89D' },
    { sectionId: 'eventplanning', title: 'Event Planning', icon: 'fa-calendar', sub: 'Host & follow up', accent: '#F15A29' },
    { sectionId: 'process', title: 'Loan Process', icon: 'fa-cogs', sub: 'White-glove stages', accent: '#002B5C' },
    { sectionId: 'mindset-motivation', title: 'Mindset Lab', icon: 'fa-brain', sub: 'Daily edge', accent: '#00A89D' },
    { sectionId: 'books', title: 'Book Vault', icon: 'fa-book', sub: 'Read & apply', accent: '#00A89D' },
    { sectionId: 'client-translation', title: 'Client Translation', icon: 'fa-language', sub: 'Multilingual', accent: '#002B5C' },
    { sectionId: 'underwriting-search', title: 'Underwriting Search', icon: 'fa-search-dollar', sub: 'Guidelines', accent: '#F15A29' },
    { sectionId: 'calculator', title: 'Calculator', icon: 'fa-calculator', sub: 'Quick math', accent: '#00A89D' },
    { sectionId: 'saved-items', title: 'My Saved Items', icon: 'fa-bookmark', sub: 'Your library', accent: '#F15A29', openAction: 'saved-items' }
  ];

  const REALTOR_CATALOG = [
    { sectionId: 'weekly-win-plan', title: 'Weekly Win Plan', icon: 'fa-fire', sub: 'This week', accent: '#F15A29' },
    { sectionId: 'planning', title: '2026 Business Plan', icon: 'fa-chart-line', sub: 'Annual map', accent: '#00A89D' },
    { sectionId: 'newsletter-generator', title: 'Newsletter', icon: 'fa-envelope', sub: 'Stay top of mind', accent: '#00A89D' },
    { sectionId: 'social-post', title: 'Social Post & Calendar', icon: 'fa-calendar-plus', sub: 'This week’s posts', accent: '#F15A29' },
    { sectionId: 'blog', title: 'Blog Creator', icon: 'fa-pen-fancy', sub: 'Authority content', accent: '#00A89D' },
    { sectionId: 'bio-creator', title: 'Bio Builder', icon: 'fa-id-card', sub: 'Zillow & brokerage', accent: '#00A89D' },
    { sectionId: 'listing-description', title: 'Listing Copy', icon: 'fa-pen-fancy', sub: 'MLS-ready', accent: '#F15A29' },
    { sectionId: 'open-house', title: 'Open House', icon: 'fa-door-open', sub: 'Scripts & strategy', accent: '#00A89D' },
    { sectionId: 'consultation', title: 'Consult Kit', icon: 'fa-handshake', sub: 'Buyer & seller', accent: '#F15A29' },
    { sectionId: 'ai-chat', title: 'AI Coach', icon: 'fa-robot', sub: 'Think with me', accent: '#00A89D' },
    { sectionId: 'value-vault', title: 'Value Vault', icon: 'fa-gem', sub: 'Gifts & pop-bys', accent: '#F15A29' },
    { sectionId: 'database', title: 'Database Nurturing', icon: 'fa-database', sub: 'Sphere', accent: '#002B5C' },
    { sectionId: 'referrals', title: 'Referral Partners', icon: 'fa-handshake', sub: 'Partner system', accent: '#00A89D' },
    { sectionId: 'eventplanning', title: 'Event Planning', icon: 'fa-calendar', sub: 'Host & follow up', accent: '#F15A29' },
    { sectionId: 'mindset-motivation', title: 'Mindset Lab', icon: 'fa-brain', sub: 'Daily edge', accent: '#00A89D' },
    { sectionId: 'sales-script', title: 'Sales Scripts', icon: 'fa-comment-dots', sub: 'Live conversations', accent: '#F15A29' }
  ];

  const RECRUITER_CATALOG = [
    { sectionId: 'weekly-win-plan', title: 'Weekly Win Plan', icon: 'fa-fire', sub: 'Protect hours', accent: '#F15A29' },
    { sectionId: 'planning', title: '2026 Recruiting Plan', icon: 'fa-chart-line', sub: 'Annual map', accent: '#00A89D' },
    { sectionId: 'voice-roleplay', title: 'Voice Roleplay', icon: 'fa-headset', sub: 'Live practice', accent: '#F15A29' },
    { sectionId: 'call-review', title: 'Call Review', icon: 'fa-file-audio', sub: 'Upload & coach', accent: '#F15A29' },
    { sectionId: 'recruiting-script', title: 'Recruiting Scripts', icon: 'fa-comment-dots', sub: 'Openers', accent: '#00A89D' },
    { sectionId: 'recruiting-playbook', title: 'Playbook', icon: 'fa-book-open', sub: 'Objections', accent: '#00A89D' },
    { sectionId: 'ruoff-fact-vault', title: 'Fact Vault', icon: 'fa-gem', sub: 'Ruoff truth', accent: '#F15A29' },
    { sectionId: 'database', title: 'Prospects', icon: 'fa-database', sub: 'Pipeline', accent: '#002B5C' },
    { sectionId: 'social-post', title: 'Social', icon: 'fa-share-alt', sub: 'Show up', accent: '#F15A29' },
    { sectionId: 'blog', title: 'Content', icon: 'fa-pen-fancy', sub: 'Authority', accent: '#00A89D' },
    { sectionId: 'ai-chat', title: 'AI Coach', icon: 'fa-robot', sub: 'Text chat', accent: '#00A89D' },
    { sectionId: 'recruiting-plan-ops', title: 'Plan Operations', icon: 'fa-clipboard-list', sub: 'Scorecard', accent: '#00A89D' }
  ];

  function detectVariant() {
    const v = (window.COACH_VARIANT || window.TRANSLATION_COACH_VARIANT || window.APP_VARIANT || '').toString().toLowerCase();
    if (v === 'realtor' || v === 'recruiter' || v === 'recruit') return v === 'recruit' ? 'recruiter' : v;
    if (document.body && document.body.dataset && document.body.dataset.coachVariant) {
      const d = String(document.body.dataset.coachVariant).toLowerCase();
      if (d === 'realtor' || d === 'recruiter') return d;
    }
    const title = (document.title || '').toLowerCase();
    if (title.includes('recruit')) return 'recruiter';
    if (
      title.includes('realtor') ||
      title.includes('real estate') ||
      title.includes('agent sales') ||
      title.includes('ultimate agent')
    ) {
      return 'realtor';
    }
    // Realtor apps often set listing/open-house globals
    if (typeof window.LISTING_DESCRIPTION_ENABLED !== 'undefined' || document.getElementById('listing-description')) {
      return 'realtor';
    }
    if (document.getElementById('voice-roleplay') || document.getElementById('recruiting-playbook')) {
      return 'recruiter';
    }
    return 'lo';
  }

  function catalogItemAvailable(c) {
    if (!c || !c.sectionId) return false;
    // Modal / library favorites (no #section card on the page)
    if (c.openAction) return true;
    return !!document.getElementById(c.sectionId);
  }

  function openFavorite(sectionId) {
    const item = catalogById(sectionId);
    if (!item) return;
    if (item.openAction === 'saved-items') {
      if (typeof window.showSavedItemsLibrary === 'function') window.showSavedItemsLibrary();
      return;
    }
    if (typeof window.showSection === 'function') window.showSection(sectionId);
  }

  function getConfig() {
    const user = window.HOME_FAVORITES_CONFIG || {};
    const variant = user.variant || detectVariant();
    const catalog =
      user.catalog ||
      (variant === 'realtor' ? REALTOR_CATALOG : variant === 'recruiter' ? RECRUITER_CATALOG : LO_CATALOG);
    return {
      storageKey: user.storageKey || DEFAULT_KEY + '.' + variant,
      catalog: catalog.filter(catalogItemAvailable),
      max: user.max || MAX_FAVORITES,
      variant
    };
  }

  function loadIds() {
    const { storageKey } = getConfig();
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.map(String) : [];
    } catch (e) {
      return [];
    }
  }

  function saveIds(ids) {
    const { storageKey, max } = getConfig();
    const clean = [...new Set(ids.map(String))].slice(0, max);
    try {
      localStorage.setItem(storageKey, JSON.stringify(clean));
    } catch (e) {}
    return clean;
  }

  function isFavorite(sectionId) {
    return loadIds().includes(sectionId);
  }

  function toggleFavorite(sectionId) {
    const cfg = getConfig();
    if (!cfg.catalog.some((c) => c.sectionId === sectionId)) return loadIds();
    let ids = loadIds();
    if (ids.includes(sectionId)) {
      ids = ids.filter((id) => id !== sectionId);
    } else {
      if (ids.length >= cfg.max) {
        if (typeof window.showToast === 'function') {
          window.showToast('Max ' + cfg.max + ' favorites — remove one first.', 'info');
        }
        return ids;
      }
      ids.push(sectionId);
    }
    saveIds(ids);
    render();
    paintSidebarStars();
    if (typeof window.trackCoachEvent === 'function') {
      window.trackCoachEvent({
        tool: 'home',
        action: isFavorite(sectionId) ? 'favorite_add' : 'favorite_remove',
        eventName: 'home_favorites',
        label: sectionId
      });
    }
    return loadIds();
  }

  function catalogById(id) {
    return getConfig().catalog.find((c) => c.sectionId === id) || null;
  }

  function ensurePanel() {
    const home = document.getElementById('home');
    if (!home) return null;
    let panel = document.getElementById('home-favorites-panel');
    if (panel) return panel;

    panel = document.createElement('div');
    panel.id = 'home-favorites-panel';
    panel.className = 'rounded-2xl border border-gray-200/90 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-md overflow-hidden';
    panel.setAttribute('aria-label', 'Your favorite tools');

    // Prefer after setup slot / before daily loop
    const setup = document.getElementById('home-setup-slot');
    const loop = home.querySelector('.home-loop-panel');
    if (setup && setup.parentNode === home) {
      setup.insertAdjacentElement('afterend', panel);
    } else if (loop) {
      loop.insertAdjacentElement('beforebegin', panel);
    } else {
      const hero = home.querySelector('.home-hero');
      if (hero) hero.insertAdjacentElement('afterend', panel);
      else home.prepend(panel);
    }
    return panel;
  }

  function renderEmpty(panel) {
    panel.innerHTML = `
      <div class="px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[11px] font-extrabold tracking-[0.14em] uppercase text-[#F15A29]">Your favorites</span>
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 font-semibold">Personalized home</span>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400 m-0">Pin the tools you open most — they show up here first. Star any section in the sidebar, or manage favorites below.</p>
        </div>
        <button type="button" id="home-favorites-manage" class="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-[#00A89D] text-[#00A89D] font-semibold text-sm hover:bg-[#00A89D] hover:text-white transition">
          <i class="fas fa-star"></i> Choose favorites
        </button>
      </div>`;
    panel.querySelector('#home-favorites-manage')?.addEventListener('click', openManager);
  }

  function renderFilled(panel, items) {
    panel.innerHTML = `
      <div class="px-4 sm:px-5 pt-4 pb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div class="flex items-baseline gap-2.5 min-w-0">
          <span class="text-[11px] font-extrabold tracking-[0.14em] uppercase text-[#F15A29]">Your favorites</span>
          <h3 class="text-lg sm:text-xl font-bold text-[#002B5C] dark:text-white m-0 tracking-tight">Pinned for you</h3>
        </div>
        <button type="button" id="home-favorites-manage" class="text-xs font-semibold text-[#00A89D] hover:underline">Edit favorites</button>
      </div>
      <div class="px-3 sm:px-4 pb-3 sm:pb-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2" id="home-favorites-grid">
        ${items
          .map(
            (item) => `
          <div class="relative group">
            <button type="button" data-home-fav-go="${item.sectionId}"
              class="w-full text-left rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/40 p-3 pr-9 hover:border-[#00A89D] hover:shadow-sm transition">
              <span class="inline-flex w-8 h-8 rounded-lg items-center justify-center mb-2" style="background:${item.accent || '#00A89D'}18;color:${item.accent || '#00A89D'}">
                <i class="fas ${item.icon}"></i>
              </span>
              <span class="block text-sm font-bold text-[#002B5C] dark:text-white leading-snug">${escapeHtml(item.title)}</span>
              ${item.sub ? `<span class="block text-[11px] text-gray-500 mt-0.5">${escapeHtml(item.sub)}</span>` : ''}
            </button>
            <button type="button" data-home-fav-toggle="${item.sectionId}" title="Remove from favorites"
              class="absolute top-2 right-2 w-7 h-7 rounded-full text-[#F15A29] hover:bg-[#F15A29]/10 transition" aria-label="Remove ${escapeHtml(item.title)} from favorites">
              <i class="fas fa-star text-xs"></i>
            </button>
          </div>`
          )
          .join('')}
      </div>`;

    panel.querySelector('#home-favorites-manage')?.addEventListener('click', openManager);
    panel.querySelectorAll('[data-home-fav-go]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-home-fav-go');
        if (id) openFavorite(id);
      });
    });
    panel.querySelectorAll('[data-home-fav-toggle]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-home-fav-toggle');
        if (id) toggleFavorite(id);
      });
    });
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function render() {
    const panel = ensurePanel();
    if (!panel) return;
    const ids = loadIds();
    const items = ids.map(catalogById).filter(Boolean);
    if (!items.length) renderEmpty(panel);
    else renderFilled(panel, items);
  }

  function ensureManager() {
    let el = document.getElementById('home-favorites-manager');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'home-favorites-manager';
    el.className = 'hidden fixed inset-0 z-[210] flex items-center justify-center p-3 sm:p-4 bg-black/55 backdrop-blur-sm';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'home-favorites-manager-title');
    el.innerHTML = `
      <div class="bg-white dark:bg-gray-900 w-full max-w-lg max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col">
        <div class="shrink-0 px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between gap-3">
          <div>
            <h3 id="home-favorites-manager-title" class="text-lg font-bold text-[#002B5C] dark:text-white m-0">Personalize your Home</h3>
            <p class="text-xs text-gray-500 m-0 mt-1">Star up to ${MAX_FAVORITES} tools. They appear in <strong>Your favorites</strong> on Home.</p>
          </div>
          <button type="button" id="home-favorites-manager-close" class="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800" aria-label="Close">&times;</button>
        </div>
        <div id="home-favorites-manager-list" class="flex-1 overflow-y-auto p-4 space-y-1.5"></div>
        <div class="shrink-0 px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button type="button" id="home-favorites-manager-done" class="px-5 py-2.5 rounded-full bg-[#00A89D] text-white font-semibold text-sm hover:bg-[#008f85] transition">Done</button>
        </div>
      </div>`;
    document.body.appendChild(el);
    el.querySelector('#home-favorites-manager-close')?.addEventListener('click', closeManager);
    el.querySelector('#home-favorites-manager-done')?.addEventListener('click', closeManager);
    el.addEventListener('click', (e) => {
      if (e.target === el) closeManager();
    });
    return el;
  }

  function openManager() {
    const el = ensureManager();
    const list = el.querySelector('#home-favorites-manager-list');
    const { catalog } = getConfig();
    const favs = new Set(loadIds());
    list.innerHTML = catalog
      .map((item) => {
        const on = favs.has(item.sectionId);
        return `
        <button type="button" data-fav-pick="${item.sectionId}"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition ${
            on
              ? 'border-[#F15A29]/40 bg-[#F15A29]/5'
              : 'border-gray-200 dark:border-gray-700 hover:border-[#00A89D]/40'
          }">
          <span class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style="background:${item.accent || '#00A89D'}18;color:${item.accent || '#00A89D'}">
            <i class="fas ${item.icon}"></i>
          </span>
          <span class="flex-1 min-w-0">
            <span class="block text-sm font-semibold text-[#002B5C] dark:text-white">${escapeHtml(item.title)}</span>
            ${item.sub ? `<span class="block text-[11px] text-gray-500">${escapeHtml(item.sub)}</span>` : ''}
          </span>
          <i class="${on ? 'fas' : 'far'} fa-star text-sm ${on ? 'text-[#F15A29]' : 'text-gray-300'}"></i>
        </button>`;
      })
      .join('');
    list.querySelectorAll('[data-fav-pick]').forEach((btn) => {
      btn.addEventListener('click', () => {
        toggleFavorite(btn.getAttribute('data-fav-pick'));
        openManager();
      });
    });
    el.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }

  function closeManager() {
    const el = document.getElementById('home-favorites-manager');
    if (el) el.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    render();
    paintSidebarStars();
  }

  function resolveSidebarSectionId(a) {
    if (!a) return '';
    const dataId = (a.getAttribute('data-home-fav') || '').trim();
    if (dataId) return dataId;
    const href = a.getAttribute('href') || '';
    if (href.startsWith('#') && href.length > 1) return href.slice(1);
    // My Saved Items historically used href="#" + onclick
    const onclick = a.getAttribute('onclick') || '';
    if (/showSavedItemsLibrary/i.test(onclick)) return 'saved-items';
    return '';
  }

  function paintSidebarStars() {
    const links = document.querySelectorAll('#sidebar a.sidebar-link, aside a.sidebar-link, a.sidebar-link[href^="#"]');
    links.forEach((a) => {
      const sectionId = resolveSidebarSectionId(a);
      if (!sectionId || !catalogById(sectionId)) return;

      let star = a.querySelector('.home-fav-star');
      if (!star) {
        star = document.createElement('button');
        star.type = 'button';
        star.className =
          'home-fav-star ml-auto shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] transition opacity-60 hover:opacity-100';
        star.title = 'Pin to Home favorites';
        star.setAttribute('aria-label', 'Pin to Home favorites');
        star.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleFavorite(sectionId);
        });
        // Ensure flex layout so star sits right
        if (!a.classList.contains('flex')) a.classList.add('flex', 'items-center');
        a.appendChild(star);
      }
      const on = isFavorite(sectionId);
      star.innerHTML = `<i class="${on ? 'fas' : 'far'} fa-star ${on ? 'text-[#F15A29]' : 'text-gray-400'}"></i>`;
      star.title = on ? 'Remove from Home favorites' : 'Pin to Home favorites';
    });
  }

  function init() {
    if (!document.getElementById('home')) return;
    // Paint favorites strip immediately (no idle delay — avoids late pop-in on Home)
    render();
    paintSidebarStars();
    // Sidebar may re-render after main.js / early-boot; light re-sync only
    setTimeout(paintSidebarStars, 300);
    setTimeout(paintSidebarStars, 1200);

    window.toggleHomeFavorite = toggleFavorite;
    window.isHomeFavorite = isFavorite;
    window.openHomeFavoritesManager = openManager;
    window.refreshHomeFavorites = render;
  }

  // Prefer immediate run when this script is placed right after #home
  // (parser has the home section already). Fall back to DOMContentLoaded.
  if (document.getElementById('home')) {
    init();
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
