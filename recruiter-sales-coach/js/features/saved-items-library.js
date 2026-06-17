/**
 * Unified "My Saved Items" library — restored after recruiter HTML prune.
 * Storage key: socialSavedIdeas (shared across all tools)
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'socialSavedIdeas';

  function getSavedIdeas() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function typeLabel(item) {
    const t = item.type || 'social';
    const title = (item.title || '').toLowerCase();
    const map = {
      script: 'Sales Script',
      custom: 'Custom Situation',
      mindset: 'Mindset',
      partner: 'Partner Strategy',
      book: 'Book',
      process: 'Loan Process',
      nurture: 'Nurturing Strategy',
      postclosing: 'Post-Closing Retention',
      popby: 'Pop-By Idea',
      plan: title.includes('weekly') ? 'Weekly Win Plan' : '2026 Business Plan',
      'equity-opportunity': 'Equity Opportunity',
      'equity-scan': 'Full Equity Scan',
      underwriting: 'Underwriting Scenario',
      newsletter: 'Newsletter (Outlook)',
      blog: 'Blog Bundle',
      coach: 'AI Coach Response',
      recruiting: 'Recruiting',
      social: 'Social'
    };
    return map[t] || 'Saved Item';
  }

  function typeColor(item) {
    const t = item.type || 'social';
    const colors = {
      script: 'bg-orange-100 text-orange-700',
      custom: 'bg-blue-100 text-blue-700',
      mindset: 'bg-[#00A89D]/10 text-[#00A89D]',
      partner: 'bg-purple-100 text-purple-700',
      book: 'bg-amber-100 text-amber-700',
      process: 'bg-emerald-100 text-emerald-700',
      nurture: 'bg-violet-100 text-violet-700',
      postclosing: 'bg-[#00A89D]/10 text-[#00A89D]',
      popby: 'bg-[#F15A29]/10 text-[#F15A29]',
      plan: 'bg-[#F15A29]/10 text-[#F15A29]',
      'equity-opportunity': 'bg-green-100 text-green-700',
      'equity-scan': 'bg-emerald-100 text-emerald-700',
      underwriting: 'bg-violet-100 text-violet-700',
      newsletter: 'bg-[#00A89D]/10 text-[#00A89D]',
      blog: 'bg-[#F15A29]/10 text-[#F15A29]',
      coach: 'bg-[#00A89D]/10 text-[#00A89D]',
      recruiting: 'bg-[#F15A29]/10 text-[#F15A29]',
      social: 'bg-teal-100 text-teal-700'
    };
    return colors[t] || 'bg-teal-100 text-teal-700';
  }

  function previewText(item) {
    let text = item.content || '';
    if (['newsletter', 'equity-opportunity', 'equity-scan', 'plan', 'script', 'social', 'underwriting', 'coach', 'postclosing', 'blog'].includes(item.type)) {
      text = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    return text.substring(0, 180) + (text.length > 180 ? '...' : '');
  }

  window.toggleSaveIdea = function toggleSaveIdea(title, content, element, customType) {
    const saved = getSavedIdeas();
    const index = saved.findIndex(item => item.title === title);

    if (index !== -1) {
      saved.splice(index, 1);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      window.updateSavedCount();
      if (element) element.innerHTML = '<i class="far fa-bookmark"></i>';
    } else {
      saved.push({
        title,
        content: content || title,
        savedAt: new Date().toISOString(),
        type: customType || 'social'
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      window.updateSavedCount();
      if (element) element.innerHTML = '<i class="fas fa-bookmark"></i>';
    }

    if (typeof window.refreshGeneratorSavedIdeas === 'function') {
      window.refreshGeneratorSavedIdeas();
    }
  };

  window.updateSavedCount = function updateSavedCount() {
    const savedLength = getSavedIdeas().length;
    const socialCount = document.getElementById('social-saved-count');
    if (socialCount) socialCount.textContent = savedLength;
    const globalCount = document.getElementById('global-saved-count');
    if (globalCount) globalCount.textContent = savedLength;
  };

  window.showSavedFeedback = function showSavedFeedback(message) {
    if (typeof window.showToast === 'function') {
      window.showToast(message || 'Saved to My Saved Items');
    }
    window.updateSavedCount();
  };

  window.clearAllSavedItems = function clearAllSavedItems(btn) {
    if (!confirm('Clear ALL saved items from your vault? This cannot be undone.')) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('savedBusinessPlan');
      localStorage.removeItem('savedWeeklyPlan');
    } catch (e) {}

    const modal = btn
      ? btn.closest('.fixed') || btn.closest('#my-saved-items-library')
      : document.getElementById('my-saved-items-library');
    if (modal) modal.remove();

    window.updateSavedCount();
    if (typeof window.showToast === 'function') {
      window.showToast('All saved items cleared.');
    }
  };

  window.deleteSavedItemFromLibrary = function deleteSavedItemFromLibrary(index, btn) {
    if (!confirm('Delete this saved item?')) return;
    const saved = getSavedIdeas();
    saved.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    const libraryModal = btn.closest('.fixed');
    if (libraryModal) libraryModal.remove();
    window.showSavedItemsLibrary();
    window.updateSavedCount();
  };

  window.copySavedItemText = function copySavedItemText(btn) {
    const text = (btn.getAttribute('data-saved-copy-text') || '').replace(/&quot;/g, '"').replace(/\\`/g, '`');
    const done = () => {
      const original = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
      setTimeout(() => { if (btn.isConnected) btn.innerHTML = original; }, 1600);
    };
    navigator.clipboard.writeText(text).then(done).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      done();
    });
  };

  window.viewSavedItem = function viewSavedItem(index) {
    const allItems = getSavedIdeas().map(item => ({ ...item, type: item.type || 'social' }));
    const item = allItems[index];
    if (!item) return;

    document.querySelectorAll('.saved-viewer-modal').forEach(m => m.remove());

    let contentHTML = item.content || '';
    let contentWrapperClass = 'p-6 overflow-y-auto flex-1 prose prose-lg dark:prose-invert';

    if (item.type === 'newsletter') {
      contentWrapperClass = 'p-4 overflow-hidden flex-1 bg-gray-100 dark:bg-gray-800';
      const safeSrcdoc = (item.content || '').replace(/"/g, '&quot;');
      contentHTML = `<iframe style="width:100%;height:100%;min-height:500px;border:1px solid #ccc;border-radius:8px;background:white;" srcdoc="${safeSrcdoc}"></iframe>`;
    } else if (['equity-opportunity', 'equity-scan', 'underwriting', 'coach', 'social', 'script', 'plan', 'blog', 'postclosing'].includes(item.type)) {
      contentWrapperClass = 'p-6 overflow-y-auto flex-1 text-sm bg-gray-50 dark:bg-gray-900';
    }

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 z-[1000] flex items-center justify-center p-4 saved-viewer-modal';
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col">
        <div class="sticky top-0 z-10 flex justify-between items-center p-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur rounded-t-3xl border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-3 min-w-0">
            <span class="text-xs px-2.5 py-1 rounded-full ${typeColor(item)}">${typeLabel(item)}</span>
            <h3 class="text-2xl font-bold text-[#002B5C] dark:text-white truncate">${item.title}</h3>
          </div>
          <button class="text-3xl leading-none text-gray-400 hover:text-red-500 transition w-9 h-9 flex items-center justify-center" onclick="this.closest('.fixed').remove()">&times;</button>
        </div>
        <div class="${contentWrapperClass} custom-modal-scroll">${contentHTML}</div>
        <div class="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0 bg-gray-50 dark:bg-gray-800/50">
          <button data-saved-copy-text="${(item.content || '').replace(/"/g, '&quot;').replace(/`/g, '\\`')}"
                  onclick="copySavedItemText(this)"
                  class="px-4 py-2 text-sm rounded-2xl border border-gray-300 hover:bg-white dark:hover:bg-gray-700 flex items-center gap-2">
            <i class="fas fa-copy"></i> Copy
          </button>
          <button class="px-5 py-2 text-sm rounded-2xl bg-[#002B5C] text-white hover:bg-[#001f3f]" onclick="this.closest('.fixed').remove()">Close</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
  };

  window.showSavedItemsLibrary = function showSavedItemsLibrary(initialFilter) {
    initialFilter = initialFilter || 'all';

    document.querySelectorAll('.saved-library-panel, .saved-viewer-modal, #my-saved-items-library').forEach(el => el.remove());

    const allItems = getSavedIdeas().map(item => ({ ...item, type: item.type || 'social' }));

    function renderItems(filter, searchTerm) {
      let filtered = allItems;
      if (filter && filter !== 'all') {
        filtered = filtered.filter(item => item.type === filter);
      }
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        filtered = filtered.filter(item =>
          (item.title || '').toLowerCase().includes(q) ||
          (item.content || '').toLowerCase().includes(q)
        );
      }
      if (filtered.length === 0) {
        return `<div class="flex flex-col items-center justify-center py-16 text-center">
          <i class="fas fa-bookmark text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
          <p class="text-lg font-medium text-gray-600 dark:text-gray-300">Your library is empty</p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm">Save scripts, posts, mindset principles, plans, and coach replies from anywhere in the app.</p>
        </div>`;
      }
      return filtered.map((item, index) => `
        <div class="group border border-gray-200 dark:border-gray-700 rounded-3xl p-5 bg-white dark:bg-gray-800 hover:border-[#00A89D]/40 hover:shadow-md transition-all">
          <div class="flex justify-between items-start gap-4">
            <div class="flex-1 min-w-0">
              <div class="mb-1"><span class="inline-block px-2 py-0.5 text-[10px] font-medium rounded-2xl ${typeColor(item)}">${typeLabel(item)}</span></div>
              <strong class="text-base font-semibold leading-tight truncate block">${item.title}</strong>
              <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">${previewText(item)}</p>
            </div>
            <div class="flex flex-col gap-1.5 flex-shrink-0">
              <button onclick="viewSavedItem(${index})" class="text-xs px-3.5 py-1.5 rounded-2xl border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition">View</button>
              <button onclick="deleteSavedItemFromLibrary(${index}, this)" class="text-xs px-3.5 py-1.5 rounded-2xl border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition">Delete</button>
            </div>
          </div>
        </div>`).join('');
    }

    const panel = document.createElement('div');
    panel.id = 'my-saved-items-library';
    panel.className = 'fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4 saved-library-panel';
    panel.addEventListener('click', function (e) {
      if (e.target === panel) panel.remove();
    });

    const filters = [
      ['all', 'fa-layer-group', 'All'],
      ['social', 'fa-share-alt', 'Social'],
      ['script', 'fa-comment-dots', 'Scripts'],
      ['recruiting', 'fa-user-plus', 'Recruiting'],
      ['mindset', 'fa-brain', 'Mindset'],
      ['book', 'fa-book', 'Books'],
      ['plan', 'fa-chart-line', 'Plans'],
      ['blog', 'fa-pen-fancy', 'Blogs'],
      ['coach', 'fa-robot', 'Coach'],
      ['custom', 'fa-edit', 'Custom']
    ];

    panel.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col">
        <div class="sticky top-0 z-10 flex justify-between items-center p-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur rounded-t-3xl border-b border-gray-200 dark:border-gray-700">
          <div>
            <div class="text-[10px] font-bold tracking-[1.5px] text-[#00A89D] uppercase">Vault</div>
            <h3 class="text-2xl md:text-3xl font-bold text-[#002B5C] dark:text-white">My Saved Items <span class="text-sm font-normal text-gray-500">(${allItems.length})</span></h3>
          </div>
          <button class="text-3xl leading-none text-gray-400 hover:text-red-500 transition w-10 h-10 flex items-center justify-center" onclick="this.closest('.fixed').remove()">&times;</button>
        </div>
        <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-2 items-center bg-gray-50 dark:bg-gray-800/50">
          <div class="flex gap-1.5 overflow-x-auto flex-nowrap pb-1">
            ${filters.map(([id, icon, label], i) => `
              <button data-filter="${id}" class="filter-btn ${id === initialFilter ? 'bg-[#00A89D] text-white' : 'border hover:bg-white dark:hover:bg-gray-800'} px-3 py-1 text-xs rounded-full font-medium flex items-center gap-1.5 whitespace-nowrap flex-shrink-0">
                <i class="fas ${icon}"></i> <span>${label}</span>
              </button>`).join('')}
          </div>
          <div class="flex-1"></div>
          <div class="relative w-64">
            <i class="fas fa-search absolute left-3.5 top-3 text-gray-400 text-sm"></i>
            <input type="text" id="saved-items-search" placeholder="Search saved items..."
                   class="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-[#00A89D]">
          </div>
        </div>
        <div class="p-6 overflow-y-auto flex-1" id="saved-items-content">
          <div class="flex flex-col gap-4">${renderItems(initialFilter)}</div>
        </div>
        <div class="p-3 border-t border-gray-200 dark:border-gray-700 flex justify-end bg-white dark:bg-gray-800">
          <button onclick="clearAllSavedItems(this)" class="text-xs px-4 py-2 rounded-full border border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition font-medium">Clear All</button>
        </div>
      </div>`;

    document.body.appendChild(panel);

    panel.querySelectorAll('.filter-btn').forEach(btn => {
      btn.onclick = () => {
        panel.querySelectorAll('.filter-btn').forEach(b => {
          b.classList.remove('bg-[#00A89D]', 'text-white');
          b.classList.add('border');
        });
        btn.classList.add('bg-[#00A89D]', 'text-white');
        btn.classList.remove('border');
        const search = panel.querySelector('#saved-items-search').value;
        panel.querySelector('#saved-items-content').innerHTML = `<div class="flex flex-col gap-4">${renderItems(btn.dataset.filter, search)}</div>`;
      };
    });

    const searchInput = panel.querySelector('#saved-items-search');
    searchInput.oninput = () => {
      const active = panel.querySelector('.filter-btn.bg-\\[\\#00A89D\\]')?.dataset.filter || initialFilter;
      panel.querySelector('#saved-items-content').innerHTML = `<div class="flex flex-col gap-4">${renderItems(active, searchInput.value)}</div>`;
    };
  };

  window.getSavedIdeas = getSavedIdeas;

  function init() {
    window.updateSavedCount();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('[saved-items-library] Initialized');
})();