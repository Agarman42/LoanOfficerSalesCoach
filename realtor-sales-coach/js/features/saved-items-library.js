/**
 * Unified "My Saved Items" library — extracted from app-bulk for polish + reliability.
 * Storage key: socialSavedIdeas (shared across all tools)
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'socialSavedIdeas';

  function closeSavedOverlay(el) {
    if (!el) return;
    if (typeof window.closeAppModal === 'function') window.closeAppModal(el);
    else el.remove();
    if (typeof window.releaseModalScrollLock === 'function') window.releaseModalScrollLock();
  }

  function openSavedOverlay(el) {
    if (!el) return;
    if (typeof window.ensureModalInViewport === 'function') window.ensureModalInViewport(el);
    el.classList.add('app-modal-overlay');
    if (typeof window.openAppModal === 'function') window.openAppModal(el);
    else {
      el.classList.remove('hidden');
      el.classList.add('flex');
      el.style.display = 'flex';
      el.style.pointerEvents = 'auto';
      document.body.classList.add('modal-open');
    }
  }

  function getSavedIdeas() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function prepareItems() {
    return getSavedIdeas().map((item, idx) => ({
      ...item,
      type: item.type || 'social',
      _vaultIndex: idx
    }));
  }

  function sortItems(items, sortBy) {
    const list = items.slice();
    if (sortBy === 'oldest') {
      return list.sort((a, b) => new Date(a.savedAt || 0) - new Date(b.savedAt || 0));
    }
    if (sortBy === 'title-asc') {
      return list.sort((a, b) => (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' }));
    }
    if (sortBy === 'title-desc') {
      return list.sort((a, b) => (b.title || '').localeCompare(a.title || '', undefined, { sensitivity: 'base' }));
    }
    return list.sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0));
  }

  function countByType(items) {
    const counts = { all: items.length };
    items.forEach((item) => {
      const t = item.type || 'social';
      counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
  }

  function filterItems(items, filter, searchTerm) {
    let filtered = items;
    if (filter && filter !== 'all') {
      if (filter === 'equity-opportunity') {
        filtered = filtered.filter((item) => item.type === 'equity-opportunity' || item.type === 'equity-scan');
      } else {
        filtered = filtered.filter((item) => item.type === filter);
      }
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        (item.title || '').toLowerCase().includes(q) ||
        (item.content || '').toLowerCase().includes(q) ||
        typeLabel(item).toLowerCase().includes(q)
      );
    }
    return filtered;
  }

  const RICH_HTML_TYPES = ['listings', 'open-house', 'consultation', 'blog', 'plan', 'newsletter', 'translation'];

  function plainTextContent(item) {
    let text = (typeof item === 'string' ? item : item?.content) || '';
    const type = typeof item === 'string' ? '' : (item?.type || '');
    if (['newsletter', 'plan', 'script', 'social', 'underwriting', 'coach', 'translation', 'postclosing', 'blog', 'listings', 'open-house', 'consultation', 'book'].includes(type) || /<[a-z][\s\S]*>/i.test(text)) {
      text = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    return text;
  }

  function isRichHtmlItem(item) {
    if (!item) return false;
    if (item.format === 'html') return true;
    return RICH_HTML_TYPES.includes(item.type) && /<[a-z][\s\S]*>/i.test(item.content || '');
  }

  function getSavedViewerContent(item) {
    if (item.type === 'newsletter') {
      const safeSrcdoc = (item.content || '').replace(/"/g, '&quot;');
      return {
        wrapperClass: 'p-4 overflow-hidden flex-1 bg-gray-100 dark:bg-gray-800',
        html: `<iframe style="width:100%;height:100%;min-height:500px;border:1px solid #ccc;border-radius:8px;background:white;" srcdoc="${safeSrcdoc}"></iframe>`,
        copyText: plainTextContent(item)
      };
    }

    if (isRichHtmlItem(item)) {
      return {
        wrapperClass: 'p-5 overflow-y-auto flex-1 bg-gray-50 dark:bg-gray-900 saved-rich-viewer custom-modal-scroll',
        html: `<div class="saved-rich-content space-y-4 max-w-none">${item.content}</div>`,
        copyText: plainTextContent(item)
      };
    }

    if (['equity-opportunity', 'equity-scan', 'underwriting', 'coach', 'social', 'script', 'plan', 'blog', 'postclosing', 'nurture', 'process', 'translation', 'listings', 'open-house', 'consultation'].includes(item.type)) {
      const escaped = (item.content || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return {
        wrapperClass: 'p-6 overflow-y-auto flex-1 text-sm bg-gray-50 dark:bg-gray-900 whitespace-pre-wrap leading-relaxed',
        html: escaped,
        copyText: item.content || ''
      };
    }

    return {
      wrapperClass: 'p-6 overflow-y-auto flex-1 prose prose-lg dark:prose-invert',
      html: item.content || '',
      copyText: plainTextContent(item)
    };
  }

  window.extractSaveableHtml = function extractSaveableHtml(rootEl) {
    if (!rootEl) return '';
    const clone = rootEl.cloneNode(true);
    clone.querySelectorAll('button').forEach((btn) => btn.remove());
    return clone.innerHTML.trim();
  };

  window.buildSaveableSectionHtml = function buildSaveableSectionHtml(cardEl) {
    if (!cardEl) return '';
    const clone = cardEl.cloneNode(true);
    clone.querySelectorAll('button').forEach((btn) => btn.remove());
    return clone.outerHTML;
  };

  function typeLabel(item) {
    const t = item.type || 'social';
    const title = (item.title || '').toLowerCase();
    const map = {
      script: 'Sales Script',
      custom: 'Custom Situation',
      mindset: 'Mindset',
      partner: 'Partner Strategy',
      book: 'Book',
      process: 'Transaction Process',
      nurture: 'Nurturing Strategy',
      postclosing: 'Post-Closing Retention',
      popby: 'Pop-By Idea',
      plan: title.includes('weekly') ? 'Weekly Win Plan' : '2026 Business Plan',
      listings: 'Listing Content',
      'open-house': 'Open House Kit',
      consultation: 'Consultation Kit',
      'equity-opportunity': 'Market Insight',
      'equity-scan': 'Market Scan',
      underwriting: 'Underwriting Scenario',
      newsletter: 'Newsletter (Outlook)',
      blog: 'Blog Bundle',
      coach: 'AI Coach Response',
      translation: 'Client Translation',
      recruiting: 'Recruiting',
      social: 'Social',
      'value-vault': 'Value Vault Idea',
      event: 'Event Planning'
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
      listings: 'bg-[#002B5C]/10 text-[#002B5C]',
      'open-house': 'bg-[#002B5C]/10 text-[#002B5C]',
      consultation: 'bg-[#002B5C]/10 text-[#002B5C]',
      'equity-opportunity': 'bg-green-100 text-green-700',
      'equity-scan': 'bg-emerald-100 text-emerald-700',
      underwriting: 'bg-violet-100 text-violet-700',
      newsletter: 'bg-[#00A89D]/10 text-[#00A89D]',
      blog: 'bg-[#F15A29]/10 text-[#F15A29]',
      coach: 'bg-[#00A89D]/10 text-[#00A89D]',
      translation: 'bg-indigo-100 text-indigo-700',
      recruiting: 'bg-[#F15A29]/10 text-[#F15A29]',
      social: 'bg-teal-100 text-teal-700',
      'value-vault': 'bg-amber-100 text-amber-700',
      event: 'bg-purple-100 text-purple-700'
    };
    return colors[t] || 'bg-teal-100 text-teal-700';
  }

  function previewText(item) {
    const text = plainTextContent(item);
    const preview = text.substring(0, 180);
    return preview + (text.length > 180 ? '...' : '');
  }

  function formatSavedDate(item) {
    if (!item.savedAt) return '';
    try {
      const d = new Date(item.savedAt);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return '';
    }
  }

  function getUseNextLinks(item) {
    const t = item.type || 'social';
    const closeViewer = "document.querySelectorAll('.saved-viewer-modal').forEach(m=>m.remove());";
    const links = [];

    if (t === 'script' || t === 'custom') {
      links.push({ label: 'Sales Script Generator', onclick: closeViewer + "if(typeof window.showSection==='function')window.showSection('sales-script');", style: 'primary' });
    }
    if (t === 'social' || t === 'blog') {
      links.push({ label: 'Social Post Creator', onclick: closeViewer + "if(typeof window.showSection==='function')window.showSection('social-post');", style: 'accent' });
    }
    if (t === 'newsletter' || t === 'blog') {
      links.push({ label: 'Newsletter Generator', onclick: closeViewer + "if(typeof window.showSection==='function')window.showSection('newsletter-generator');", style: 'primary' });
    }
    if (t === 'listings') {
      links.push({ label: 'Listing Description Generator', onclick: closeViewer + "if(typeof window.showSection==='function')window.showSection('listing-description');", style: 'primary' });
    }
    if (t === 'open-house') {
      links.push({ label: 'Open House Script & Strategy', onclick: closeViewer + "if(typeof window.showSection==='function')window.showSection('open-house');", style: 'primary' });
    }
    if (t === 'consultation') {
      links.push({ label: 'Buyer/Seller Consultation Kit', onclick: closeViewer + "if(typeof window.showSection==='function')window.showSection('consultation');", style: 'primary' });
    }
    if (t === 'book') {
      links.push({ label: 'Book Vault', onclick: closeViewer + "if(typeof window.showSection==='function')window.showSection('books');", style: 'accent' });
    }
    if (t === 'underwriting') {
      links.push({ label: 'Buyer Financing Reference', onclick: closeViewer + "if(typeof window.showSection==='function')window.showSection('underwriting-search');", style: 'primary' });
    }
    if (t === 'translation') {
      links.push({ label: 'Client Translation', onclick: closeViewer + "if(typeof window.showSection==='function')window.showSection('client-translation');", style: 'primary' });
    }
    if (t === 'mindset') {
      links.push({ label: 'Mindset Lab', onclick: closeViewer + "if(typeof window.showSection==='function')window.showSection('mindset-motivation');", style: 'accent' });
    }
    if (t === 'plan') {
      links.push({ label: 'Weekly Win Plan', onclick: closeViewer + "if(typeof window.showSection==='function')window.showSection('weekly-win-plan');", style: 'accent' });
    }
    if (t === 'nurture') {
      links.push({ label: 'Database Nurturing', onclick: closeViewer + "if(typeof window.showSection==='function')window.showSection('database');", style: 'primary' });
    }
    if (t === 'process' || t === 'postclosing') {
      links.push({ label: 'Home Buying & Selling Process', onclick: closeViewer + "if(typeof window.showSection==='function')window.showSection('process');", style: 'primary' });
      if (t === 'postclosing') {
        links.push({ label: 'Post-Closing Vault', onclick: closeViewer + "if(typeof window.openVaultItemWhenReady==='function')window.openVaultItemWhenReady('post-closing-7day');", style: 'accent' });
      }
    }
    if (t === 'value-vault' || t === 'popby' || t === 'partner') {
      links.push({ label: 'Value Vault', onclick: closeViewer + "if(typeof window.showSection==='function')window.showSection('value-vault');", style: 'accent' });
    }
    if (t === 'event') {
      links.push({ label: 'Referral Events', onclick: closeViewer + "if(typeof window.showSection==='function')window.showSection('referrals');", style: 'accent' });
    }
    if (t === 'popby') {
      links.push({ label: 'Pop-By Library', onclick: closeViewer + "if(typeof window.showSection==='function')window.showSection('value-vault');", style: 'primary' });
    }
    links.push({ label: 'My Saved Items', onclick: closeViewer + "if(typeof window.showSavedItemsLibrary==='function')window.showSavedItemsLibrary('" + t + "');", style: 'primary' });

    return links.slice(0, 4);
  }

  function renderUseNextFooter(item) {
    const links = getUseNextLinks(item);
    if (typeof window.renderModalNextSteps === 'function') {
      return window.renderModalNextSteps(links, 'Use This Next');
    }
    return '';
  }

  window.toggleSaveIdea = function toggleSaveIdea(title, content, element, customType, opts) {
    opts = opts || {};
    const saved = getSavedIdeas();
    const index = saved.findIndex(item => item.title === title);
    const format = opts.format || (typeof content === 'string' && /<[a-z][\s\S]*>/i.test(content) ? 'html' : 'text');

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
        type: customType || 'social',
        format
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

  window.deleteSavedItemFromLibrary = function deleteSavedItemFromLibrary(vaultIndex, btn) {
    if (!confirm('Delete this saved item?')) return;
    const saved = getSavedIdeas();
    if (vaultIndex < 0 || vaultIndex >= saved.length) return;
    saved.splice(vaultIndex, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

    const libraryModal = btn && btn.closest('.fixed');
    if (libraryModal) libraryModal.remove();
    window.showSavedItemsLibrary();
    window.updateSavedCount();
  };

  window.exportSavedItemsJSON = function exportSavedItemsJSON(filter, searchTerm, sortBy) {
    const items = sortItems(
      filterItems(prepareItems(), filter || 'all', searchTerm || ''),
      sortBy || 'newest'
    ).map(({ title, content, savedAt, type }) => ({ title, content, savedAt, type }));

    const payload = {
      exportedAt: new Date().toISOString(),
      app: 'Ultimate Agent Sales Coach',
      count: items.length,
      items
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saved-items-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (typeof window.showToast === 'function') {
      window.showToast(`Exported ${items.length} item${items.length === 1 ? '' : 's'} as JSON`);
    }
  };

  window.copyFilteredSavedItems = function copyFilteredSavedItems(filter, searchTerm, sortBy, btn) {
    const items = sortItems(
      filterItems(prepareItems(), filter || 'all', searchTerm || ''),
      sortBy || 'newest'
    );

    if (!items.length) {
      if (typeof window.showToast === 'function') window.showToast('Nothing to copy in this view');
      return;
    }

    const text = items.map((item, i) => {
      const date = formatSavedDate(item);
      const header = `${i + 1}. ${item.title}${date ? ` (${date})` : ''} — ${typeLabel(item)}`;
      return `${header}\n${plainTextContent(item)}`;
    }).join('\n\n---\n\n');

    const done = () => {
      if (!btn) return;
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

    if (typeof window.showToast === 'function') {
      window.showToast(`Copied ${items.length} item${items.length === 1 ? '' : 's'} to clipboard`);
    }
  };

  window.copySavedItemFromList = function copySavedItemFromList(vaultIndex, btn) {
    const item = prepareItems().find((i) => i._vaultIndex === vaultIndex);
    if (!item) return;
    const text = `${item.title}\n\n${plainTextContent(item)}`;
    const done = () => {
      if (!btn) return;
      const original = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i>';
      setTimeout(() => { if (btn.isConnected) btn.innerHTML = original; }, 1400);
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
    if (typeof window.showToast === 'function') {
      window.showToast('Copied to clipboard');
    }
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

  window.viewSavedItem = function viewSavedItem(vaultIndex) {
    const allItems = prepareItems();
    const item = allItems.find(i => i._vaultIndex === vaultIndex);
    if (!item) return;

    document.querySelectorAll('.saved-viewer-modal').forEach(m => m.remove());

    const viewerContent = getSavedViewerContent(item);
    const contentHTML = viewerContent.html;
    const contentWrapperClass = viewerContent.wrapperClass;
    const copyText = (viewerContent.copyText || plainTextContent(item)).replace(/"/g, '&quot;').replace(/`/g, '\\`');

    const savedDate = formatSavedDate(item);
    const useNext = renderUseNextFooter(item);
    const viewerWidth = isRichHtmlItem(item) ? 'max-w-5xl' : 'max-w-4xl';

    const modal = document.createElement('div');
    modal.className = 'app-modal-overlay fixed inset-0 bg-black/70 z-[1000] flex items-center justify-center p-4 saved-viewer-modal';
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-3xl w-full ${viewerWidth} max-h-[85vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col" onclick="event.stopPropagation()">
        <div class="sticky top-0 z-10 flex justify-between items-center p-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur rounded-t-3xl border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-3 min-w-0">
            <span class="text-xs px-2.5 py-1 rounded-full flex-shrink-0 ${typeColor(item)}">${typeLabel(item)}</span>
            <div class="min-w-0">
              <h3 class="text-xl md:text-2xl font-bold text-[#002B5C] dark:text-white truncate">${item.title}</h3>
              ${savedDate ? `<p class="text-[10px] text-gray-500 mt-0.5">Saved ${savedDate}</p>` : ''}
            </div>
          </div>
          <button type="button" class="saved-viewer-close text-3xl leading-none text-gray-400 hover:text-red-500 transition w-9 h-9 flex items-center justify-center flex-shrink-0">&times;</button>
        </div>
        <div class="${contentWrapperClass} custom-modal-scroll">${contentHTML}</div>
        ${useNext ? `<div class="px-6 pb-2 flex-shrink-0">${useNext}</div>` : ''}
        <div class="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0 bg-gray-50 dark:bg-gray-800/50">
          <button data-saved-copy-text="${copyText}"
                  onclick="copySavedItemText(this)"
                  class="px-4 py-2 text-sm rounded-2xl border border-gray-300 hover:bg-white dark:hover:bg-gray-700 flex items-center gap-2">
            <i class="fas fa-copy"></i> Copy
          </button>
          <button type="button" class="saved-viewer-close px-5 py-2 text-sm rounded-2xl bg-[#002B5C] text-white hover:bg-[#001f3f]">Close</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelectorAll('.saved-viewer-close').forEach((btn) => {
      btn.addEventListener('click', () => closeSavedOverlay(modal));
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeSavedOverlay(modal);
    });
    openSavedOverlay(modal);
  };

  window.showSavedItemsLibrary = function showSavedItemsLibrary(initialFilter) {
    initialFilter = initialFilter || window._savedItemsLastFilter || 'all';
    window._savedItemsLastFilter = initialFilter;

    document.querySelectorAll('.saved-library-panel, .saved-viewer-modal, #my-saved-items-library').forEach(el => el.remove());

    const allItems = prepareItems();
    let activeFilter = initialFilter;
    let activeSort = 'newest';

    const typeCounts = countByType(allItems);

    function renderEmptyState(filter, searchTerm) {
      const hasAny = allItems.length > 0;
      const searching = !!(searchTerm || '').trim();
      const title = hasAny
        ? (searching ? 'No matches for that search' : 'No items in this category')
        : 'Your personal playbook starts here';
      const subtitle = hasAny
        ? 'Try a different filter, clear your search, or switch the sort order.'
        : 'Save scripts, social posts, listing copy, newsletters, consult kits, and coach replies — then reuse them all week.';

      const ctas = hasAny ? '' : `
        <div class="mt-6 flex flex-wrap justify-center gap-2">
          <button type="button" class="saved-empty-cta text-xs px-4 py-2 rounded-2xl bg-[#00A89D] text-white font-semibold hover:bg-[#008F85] transition" data-section="social-post">Social Post Creator</button>
          <button type="button" class="saved-empty-cta text-xs px-4 py-2 rounded-2xl border border-[#00A89D] text-[#00A89D] font-semibold hover:bg-[#00A89D]/10 transition" data-section="sales-script">Sales Scripts</button>
          <button type="button" class="saved-empty-cta text-xs px-4 py-2 rounded-2xl border border-gray-300 dark:border-gray-600 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition" data-section="blog">Blog Creator</button>
        </div>`;

      return `<div class="flex flex-col items-center justify-center py-14 text-center col-span-full">
          <div class="w-16 h-16 rounded-3xl bg-[#00A89D]/10 flex items-center justify-center mb-4">
            <i class="fas fa-bookmark text-3xl text-[#00A89D]"></i>
          </div>
          <p class="text-lg font-semibold text-gray-700 dark:text-gray-200">${title}</p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md">${subtitle}</p>
          ${ctas}
        </div>`;
    }

    function renderItems(filter, searchTerm, sortBy) {
      const filtered = sortItems(filterItems(allItems, filter, searchTerm), sortBy || activeSort);
      if (filtered.length === 0) {
        return renderEmptyState(filter, searchTerm);
      }
      return filtered.map((item) => {
        const dateStr = formatSavedDate(item);
        return `
        <div class="group border border-gray-200 dark:border-gray-700 rounded-3xl p-5 bg-white dark:bg-gray-800 hover:border-[#00A89D]/40 hover:shadow-md transition-all">
          <div class="flex justify-between items-start gap-3">
            <div class="flex-1 min-w-0 cursor-pointer" onclick="viewSavedItem(${item._vaultIndex})" role="button" tabindex="0">
              <div class="mb-1.5 flex items-center gap-2 flex-wrap">
                <span class="inline-block px-2 py-0.5 text-[10px] font-semibold rounded-2xl ${typeColor(item)}">${typeLabel(item)}</span>
                ${dateStr ? `<span class="text-[10px] text-gray-400">${dateStr}</span>` : ''}
              </div>
              <strong class="text-base font-semibold leading-snug text-[#002B5C] dark:text-white line-clamp-2">${item.title}</strong>
              <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mt-1.5 leading-relaxed">${previewText(item)}</p>
            </div>
            <div class="flex flex-col gap-1.5 flex-shrink-0">
              <button type="button" onclick="viewSavedItem(${item._vaultIndex})" class="text-xs px-3 py-1.5 rounded-2xl bg-[#002B5C] text-white hover:bg-black transition font-medium">View</button>
              <button type="button" onclick="copySavedItemFromList(${item._vaultIndex}, this)" class="text-xs px-3 py-1.5 rounded-2xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white transition" title="Copy text"><i class="fas fa-copy"></i></button>
              <button type="button" onclick="deleteSavedItemFromLibrary(${item._vaultIndex}, this)" class="text-xs px-3 py-1.5 rounded-2xl border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition" title="Delete"><i class="fas fa-trash-alt"></i></button>
            </div>
          </div>
        </div>`;
      }).join('');
    }

    function renderFilterChip(id, icon, label, activeId) {
      const count = typeCounts[id] || 0;
      const isActive = id === activeId;
      const showCount = id !== 'all' && count > 0;
      return `<button type="button" data-filter="${id}" class="filter-btn ${isActive ? 'bg-[#00A89D] text-white shadow-sm' : 'border border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-800'} px-3 py-1.5 text-xs rounded-full font-medium flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 transition">
        <i class="fas ${icon}"></i>
        <span>${label}</span>
        ${showCount ? `<span class="px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}">${count}</span>` : ''}
      </button>`;
    }

    function renderFilterGroups(activeId) {
      const groups = [
        { label: null, filters: [['all', 'fa-layer-group', 'All']] },
        { label: 'Content', filters: [
          ['social', 'fa-share-alt', 'Social'],
          ['blog', 'fa-pen-fancy', 'Blogs'],
          ['newsletter', 'fa-envelope', 'Newsletters'],
          ['script', 'fa-comment-dots', 'Scripts'],
          ['mindset', 'fa-brain', 'Mindset']
        ]},
        { label: 'Client tools', filters: [
          ['listings', 'fa-home', 'Listings'],
          ['open-house', 'fa-door-open', 'Open House'],
          ['consultation', 'fa-handshake', 'Consult'],
          ['translation', 'fa-language', 'Translate']
        ]},
        { label: 'Strategy', filters: [
          ['partner', 'fa-handshake', 'Partners'],
          ['nurture', 'fa-heart', 'Nurture'],
          ['process', 'fa-route', 'Process'],
          ['postclosing', 'fa-phone', 'Post-Close'],
          ['popby', 'fa-gift', 'Pop-Bys'],
          ['event', 'fa-calendar-alt', 'Events'],
          ['plan', 'fa-chart-line', 'Plans']
        ]},
        { label: 'Reference', filters: [
          ['value-vault', 'fa-gem', 'Vault'],
          ['book', 'fa-book', 'Books'],
          ['underwriting', 'fa-file-alt', 'Financing'],
          ['coach', 'fa-robot', 'Coach'],
          ['custom', 'fa-edit', 'Custom']
        ]}
      ];

      return groups.map((group) => {
        const chips = group.filters.map(([id, icon, label]) => renderFilterChip(id, icon, label, activeId)).join('');
        if (!group.label) {
          return `<div class="flex gap-1.5 flex-shrink-0">${chips}</div>`;
        }
        return `<div class="flex flex-col gap-1.5 flex-shrink-0">
          <div class="text-[10px] font-bold tracking-wider text-gray-400 uppercase px-0.5">${group.label}</div>
          <div class="flex gap-1.5 flex-wrap">${chips}</div>
        </div>`;
      }).join('<div class="w-px h-8 bg-gray-200 dark:bg-gray-600 flex-shrink-0 self-end mb-1 hidden sm:block"></div>');
    }

    const panel = document.createElement('div');
    panel.id = 'my-saved-items-library';
    panel.className = 'app-modal-overlay fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4 saved-library-panel';

    panel.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-5xl max-h-[88vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col">
        <div class="sticky top-0 z-10 flex justify-between items-start gap-4 p-5 bg-white/95 dark:bg-gray-800/95 backdrop-blur rounded-t-3xl border-b border-gray-200 dark:border-gray-700">
          <div class="min-w-0">
            <div class="text-[10px] font-bold tracking-[1.5px] text-[#00A89D] uppercase">Your Playbook</div>
            <h3 class="text-2xl md:text-3xl font-bold text-[#002B5C] dark:text-white">My Saved Items <span class="text-sm font-normal text-gray-500">(${allItems.length})</span></h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xl">Scripts, posts, listing copy, newsletters, and coach replies you actually use — filter, search, copy, or jump back to the source tool.</p>
          </div>
          <button type="button" class="saved-library-close text-3xl leading-none text-gray-400 hover:text-red-500 transition w-10 h-10 flex items-center justify-center flex-shrink-0">&times;</button>
        </div>
        <div class="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/50 space-y-3">
          <div class="flex gap-3 overflow-x-auto pb-1 custom-modal-scroll items-end">
            ${renderFilterGroups(initialFilter)}
          </div>
          <div class="flex flex-wrap gap-2 items-center">
            <div class="relative flex-1 min-w-[12rem] sm:max-w-xs">
              <i class="fas fa-search absolute left-3.5 top-3 text-gray-400 text-sm"></i>
              <input type="text" id="saved-items-search" placeholder="Search titles and content..."
                     class="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-[#00A89D]">
            </div>
            <select id="saved-items-sort" class="text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-[#00A89D]">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="title-asc">Title A–Z</option>
              <option value="title-desc">Title Z–A</option>
            </select>
            <p id="saved-items-summary" class="text-xs text-gray-500 dark:text-gray-400 sm:ml-auto"></p>
          </div>
        </div>
        <div class="p-5 overflow-y-auto flex-1 custom-modal-scroll" id="saved-items-content">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">${renderItems(initialFilter, '', activeSort)}</div>
        </div>
        <div class="p-3 border-t border-gray-200 dark:border-gray-700 flex flex-wrap justify-between items-center gap-2 bg-white dark:bg-gray-800">
          <div class="flex flex-wrap gap-2">
            <button type="button" id="saved-items-export-json" class="text-xs px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium flex items-center gap-1.5">
              <i class="fas fa-download"></i> Export JSON
            </button>
            <button type="button" id="saved-items-bulk-copy" class="text-xs px-4 py-2 rounded-full border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white transition font-medium flex items-center gap-1.5">
              <i class="fas fa-copy"></i> Copy filtered
            </button>
          </div>
          <button onclick="clearAllSavedItems(this)" class="text-xs px-4 py-2 rounded-full border border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition font-medium">Clear All</button>
        </div>
      </div>`;

    document.body.appendChild(panel);
    panel.querySelectorAll('.saved-library-close').forEach((btn) => {
      btn.addEventListener('click', () => closeSavedOverlay(panel));
    });
    panel.addEventListener('click', (e) => {
      if (e.target === panel) closeSavedOverlay(panel);
    });
    openSavedOverlay(panel);

    function updateSummary(filter, searchTerm) {
      const summaryEl = panel.querySelector('#saved-items-summary');
      if (!summaryEl) return;
      const shown = filterItems(allItems, filter, searchTerm).length;
      const total = allItems.length;
      if (!total) {
        summaryEl.textContent = '';
        return;
      }
      summaryEl.textContent = shown === total
        ? `Showing all ${total} item${total === 1 ? '' : 's'}`
        : `Showing ${shown} of ${total}`;
    }

    function refreshList() {
      const search = panel.querySelector('#saved-items-search').value;
      panel.querySelector('#saved-items-content').innerHTML =
        `<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">${renderItems(activeFilter, search, activeSort)}</div>`;
      updateSummary(activeFilter, search);

      panel.querySelectorAll('.saved-empty-cta').forEach((btn) => {
        btn.addEventListener('click', () => {
          const section = btn.getAttribute('data-section');
          closeSavedOverlay(panel);
          if (section && typeof window.showSection === 'function') window.showSection(section);
        });
      });
    }

    function setActiveFilter(btn) {
      activeFilter = btn.dataset.filter || 'all';
      window._savedItemsLastFilter = activeFilter;
      panel.querySelectorAll('.filter-btn').forEach((b) => {
        b.classList.remove('bg-[#00A89D]', 'text-white', 'shadow-sm');
        b.classList.add('border', 'border-gray-200', 'dark:border-gray-600');
      });
      btn.classList.add('bg-[#00A89D]', 'text-white', 'shadow-sm');
      btn.classList.remove('border', 'border-gray-200', 'dark:border-gray-600');
      refreshList();
    }

    panel.querySelectorAll('.filter-btn').forEach(btn => {
      btn.onclick = () => setActiveFilter(btn);
    });

    updateSummary(initialFilter, '');

    const searchInput = panel.querySelector('#saved-items-search');
    searchInput.oninput = refreshList;

    const sortSelect = panel.querySelector('#saved-items-sort');
    sortSelect.onchange = () => {
      activeSort = sortSelect.value || 'newest';
      refreshList();
    };

    panel.querySelector('#saved-items-export-json')?.addEventListener('click', () => {
      window.exportSavedItemsJSON(activeFilter, searchInput.value, activeSort);
    });

    panel.querySelector('#saved-items-bulk-copy')?.addEventListener('click', (e) => {
      window.copyFilteredSavedItems(activeFilter, searchInput.value, activeSort, e.currentTarget);
    });
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