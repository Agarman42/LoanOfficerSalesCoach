/**
 * Global command-palette search — unified index across tools, vault, and saved items.
 */
(function () {
  'use strict';

  const RECENT_KEY = 'globalSearchRecents_v1';
  const MAX_RESULTS = 14;
  const MAX_RECENT = 6;
  const SAVED_STORAGE_KEY = 'socialSavedIdeas';
  const STOPWORDS = new Set([
    'a', 'an', 'and', 'as', 'at', 'be', 'by', 'for', 'in', 'is', 'it',
    'of', 'on', 'or', 'the', 'to', 'with',
  ]);
  const INTENT_TYPES = new Set(['guide', 'script', 'tool', 'action', 'fact', 'book', 'social']);

  const TYPE_LABELS = {
    guide: 'Guides & Playbooks',
    script: 'Script Scenarios',
    fact: 'Ruoff Facts',
    book: 'Book Vault',
    social: 'Social Pillars',
    mindset: 'Mindset Lab',
    tool: 'Tools',
    action: 'Quick Actions',
    vault: 'Value Vault',
    saved: 'Saved Items',
  };

  let overlay = null;
  let inputEl = null;
  let resultsEl = null;
  let staticIndex = [];
  let activeIndex = -1;
  let visibleResults = [];
  let isOpen = false;
  let searchTimer = null;
  let lastPaletteQuery = '';

  function getConfig() {
    return window.GLOBAL_SEARCH_CONFIG || { synonyms: {}, quickActions: [], groupOrder: [] };
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function expandTokens(query) {
    const raw = (query || '').toLowerCase().trim();
    if (!raw) return [];
    const tokens = raw.split(/\s+/).filter(Boolean);
    const expanded = new Set(tokens);
    const synonyms = getConfig().synonyms || {};
    tokens.forEach((token) => {
      if (synonyms[token]) {
        expanded.add(token);
        synonyms[token].forEach((s) => expanded.add(s.toLowerCase()));
      }
    });
    return Array.from(expanded);
  }

  function parseSavedQuery(raw) {
    const q = (raw || '').trim();
    if (/^saved$/i.test(q)) return '';
    const m = q.match(/^saved\s+(.+)$/i);
    return m ? m[1].trim() : null;
  }

  function haystackForEntry(entry) {
    return [
      entry.title,
      entry.subtitle,
      entry.sectionId,
      ...(entry.keywords || []),
    ].filter(Boolean).join(' ').toLowerCase();
  }

  function tokenMatchesHay(hay, token) {
    if (!token) return false;
    if (hay.includes(token)) return true;
    const synonyms = getConfig().synonyms || {};
    const list = synonyms[token];
    if (list) {
      return list.some((s) => hay.includes(s.toLowerCase()));
    }
    return false;
  }

  function isNoiseQuery(rawQuery) {
    const words = (rawQuery || '').toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!words.length) return false;
    return words.every((word) => word.length < 2 || STOPWORDS.has(word));
  }

  function scoreEntry(entry, tokens, rawQuery) {
    if (!tokens.length) return entry._baseScore || 1;
    const hay = haystackForEntry(entry);
    const title = (entry.title || '').toLowerCase();
    const q = rawQuery.toLowerCase().trim();
    const queryWords = q.split(/\s+/).filter(Boolean);

    if (queryWords.length > 1) {
      const allMatch = queryWords.every((word) => tokenMatchesHay(hay, word));
      if (!allMatch) return 0;
    } else if (queryWords.length === 1) {
      const word = queryWords[0];
      const tokenHit = tokens.some((token) => tokenMatchesHay(hay, token));
      if (!tokenHit) return 0;
      if (STOPWORDS.has(word)) return 0;
    }

    let score = 0;

    if (hay.includes(q)) score += 100;
    if (title === q) score += 120;
    else if (title.startsWith(q)) score += 90;
    else if (title.includes(q)) score += 70;

    tokens.forEach((token) => {
      if (!token) return;
      if (title === token) score += 50;
      else if (title.startsWith(token)) score += 35;
      else if (title.includes(token)) score += 25;
      else if (hay.includes(token)) score += 12;
    });

    (entry.keywords || []).forEach((kw) => {
      const k = String(kw).toLowerCase();
      if (k === q || k.includes(q) || q.includes(k)) score += 45;
    });

    if ((entry.type === 'guide' || entry.type === 'script') && queryWords.length > 1) score += 18;
    if (entry.type === 'saved' && /^saved(\s|$)/i.test(rawQuery)) score += 25;

    if (queryWords.length === 1) {
      const word = queryWords[0];
      if (INTENT_TYPES.has(entry.type)) score += 22;
      if (entry.type === 'script' && (title === word || title.includes(word))) score += 40;
      if (entry.type === 'mindset' && !title.includes(word)) score -= 28;
      if (entry.type === 'book' && !title.includes(word)) score -= 12;
    }

    score += entry._baseScore || 0;
    return score;
  }

  function sidebarLabelFromLink(link) {
    const clone = link.cloneNode(true);
    clone.querySelectorAll('span').forEach((s) => s.remove());
    return clone.textContent.replace(/\s+/g, ' ').trim();
  }

  function sidebarIconFromLink(link) {
    const icon = link.querySelector('i');
    if (!icon) return 'fas fa-compass';
    return Array.from(icon.classList)
      .filter((c) => c.startsWith('fa-') && c !== 'fa-fw' && c !== 'w-5')
      .map((c) => (c.startsWith('fas') || c.startsWith('far') || c.startsWith('fab') ? c : `fas ${c}`))
      .join(' ') || icon.className;
  }

  function buildStaticIndex() {
    const entries = [];
    const seen = new Set();

    document.querySelectorAll('#sidebar a.sidebar-link[href^="#"]').forEach((link) => {
      const href = link.getAttribute('href') || '';
      const sectionId = href.replace(/^#/, '').trim();
      if (!sectionId || sectionId === '#') return;
      const id = `tool-${sectionId}`;
      if (seen.has(id)) return;
      seen.add(id);
      entries.push({
        type: 'tool',
        id,
        title: sidebarLabelFromLink(link),
        subtitle: 'Open tool section',
        sectionId,
        icon: sidebarIconFromLink(link),
        keywords: [sectionId.replace(/-/g, ' ')],
        group: 'Tools',
        _baseScore: 8,
      });
    });

    (getConfig().quickActions || []).forEach((action) => {
      entries.push({
        type: action.sectionId ? 'tool' : 'action',
        id: action.id,
        title: action.title,
        subtitle: action.subtitle,
        sectionId: action.sectionId,
        action: action.action,
        icon: action.icon || 'fas fa-bolt',
        keywords: action.keywords || [],
        group: action.group || 'Quick Actions',
        _baseScore: 10,
      });
    });

    const vaultItems = Array.isArray(window.VALUE_VAULT_ITEMS) ? window.VALUE_VAULT_ITEMS : [];
    vaultItems.forEach((item) => {
      if (!item || !item.id) return;
      if (item.type === 'fact') return;
      entries.push({
        type: 'vault',
        id: `vault-${item.id}`,
        title: item.title || 'Vault item',
        subtitle: [item.type, item.pillar, item.cost].filter(Boolean).join(' · ') || 'Value Vault idea',
        vaultId: item.id,
        icon: 'fas fa-gem',
        keywords: [item.teaser, item.type, item.pillar, item.cost, ...(item.tags || [])].filter(Boolean),
        group: 'Value Vault',
        _baseScore: 4,
      });
    });

    if (typeof window.buildGlobalSearchDeepIndex === 'function') {
      window.buildGlobalSearchDeepIndex().forEach((entry) => {
        if (!entry?.id || seen.has(entry.id)) return;
        seen.add(entry.id);
        entries.push(entry);
      });
    }

    if (typeof window.buildGlobalSearchDynamicIndex === 'function') {
      window.buildGlobalSearchDynamicIndex().forEach((entry) => {
        if (!entry?.id || seen.has(entry.id)) return;
        seen.add(entry.id);
        entries.push(entry);
      });
    }

    return entries;
  }

  function getMatchSnippet(entry, query) {
    const q = (query || '').trim().toLowerCase();
    if (!q) return entry.subtitle || '';
    const fields = [entry.title, ...(entry.keywords || []), entry.subtitle].filter(Boolean);
    for (const field of fields) {
      const text = String(field);
      const idx = text.toLowerCase().indexOf(q);
      if (idx !== -1) {
        const start = Math.max(0, idx - 18);
        const end = Math.min(text.length, idx + q.length + 42);
        const slice = text.slice(start, end).trim();
        return (start > 0 ? '…' : '') + slice + (end < text.length ? '…' : '');
      }
    }
    const words = q.split(/\s+/).filter(Boolean);
    for (const field of fields) {
      const text = String(field);
      const lower = text.toLowerCase();
      if (words.every((w) => lower.includes(w))) {
        return text.slice(0, 88) + (text.length > 88 ? '…' : '');
      }
    }
    return entry.subtitle || '';
  }

  function getSavedEntries() {
    try {
      const items = JSON.parse(localStorage.getItem(SAVED_STORAGE_KEY) || '[]');
      return items.map((item, idx) => {
        const plain = (item.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        return {
          type: 'saved',
          id: `saved-${idx}`,
          title: item.title || 'Saved item',
          subtitle: (item.type || 'saved').replace(/-/g, ' '),
          vaultIndex: idx,
          icon: 'fas fa-bookmark',
          keywords: [item.type, plain.slice(0, 240)],
          group: 'Saved Items',
          _baseScore: 6,
        };
      });
    } catch (e) {
      return [];
    }
  }

  function getRecents() {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function pushRecent(entry) {
    if (!entry || !entry.id) return;
    const recents = getRecents().filter((r) => r.id !== entry.id);
    recents.unshift({
      id: entry.id,
      title: entry.title,
      subtitle: entry.subtitle,
      type: entry.type,
      sectionId: entry.sectionId,
      vaultId: entry.vaultId,
      vaultIndex: entry.vaultIndex,
      action: entry.action,
      icon: entry.icon,
      group: entry.group,
    });
    localStorage.setItem(RECENT_KEY, JSON.stringify(recents.slice(0, MAX_RECENT)));
  }

  function findEntryById(id) {
    const saved = getSavedEntries();
    return [...staticIndex, ...saved].find((e) => e.id === id);
  }

  function getSavedLibraryAction() {
    return {
      type: 'action',
      id: 'action-saved-search',
      title: 'My Saved Items',
      subtitle: 'Open your saved library',
      action: 'saved',
      icon: 'fas fa-bookmark',
      keywords: ['saved', 'library', 'bookmark'],
      group: 'Quick Actions',
      _baseScore: 16,
    };
  }

  function runSearch(query) {
    const raw = (query || '').trim();
    const savedInner = parseSavedQuery(raw);
    const tokens = expandTokens(savedInner !== null && savedInner !== '' ? savedInner : raw);
    const pool = [...staticIndex, ...getSavedEntries()];

    if (isNoiseQuery(raw)) return [];

    if (!raw) {
      const recentIds = getRecents().map((r) => r.id);
      const recentEntries = recentIds.map((id) => findEntryById(id)).filter(Boolean);
      const picks = staticIndex
        .filter((e) => e.type === 'tool')
        .slice(0, 6);
      const merged = [];
      const seen = new Set();
      [...recentEntries, ...picks].forEach((e) => {
        if (!e || seen.has(e.id)) return;
        seen.add(e.id);
        merged.push(e);
      });
      return merged.slice(0, MAX_RESULTS);
    }

    const searchRaw = savedInner !== null ? (savedInner || raw) : raw;
    const searchTokens = savedInner !== null ? expandTokens(searchRaw) : tokens;

    let results = pool
      .map((entry) => ({ entry, score: scoreEntry(entry, searchTokens, savedInner !== null ? raw : searchRaw) }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((row) => row.entry);

    if (savedInner !== null) {
      const savedHits = results.filter((e) => e.type === 'saved');
      const other = results.filter((e) => e.type !== 'saved');
      const merged = [getSavedLibraryAction(), ...savedHits, ...other];
      const seen = new Set();
      results = merged.filter((e) => {
        if (seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      });
    }

    return dedupeResults(results).slice(0, MAX_RESULTS);
  }

  const DEDUPE_PRIORITY = { guide: 5, script: 4, fact: 4, book: 3, social: 3, mindset: 3, saved: 3, action: 2, vault: 2, tool: 1 };

  function dedupeResults(results) {
    const bestByKey = new Map();
    results.forEach((entry, idx) => {
      const key = entry.sectionId && entry.type !== 'saved' && entry.action !== 'saved'
        ? `section:${entry.sectionId}`
        : (entry.action === 'saved' ? 'action:saved' : entry.id);
      const priority = DEDUPE_PRIORITY[entry.type] || 1;
      const prev = bestByKey.get(key);
      if (!prev || priority > prev.priority || (priority === prev.priority && idx < prev.idx)) {
        bestByKey.set(key, { entry, priority, idx });
      }
    });
    return results.filter((entry, idx) => {
      const key = entry.sectionId && entry.type !== 'saved' && entry.action !== 'saved'
        ? `section:${entry.sectionId}`
        : (entry.action === 'saved' ? 'action:saved' : entry.id);
      return bestByKey.get(key)?.idx === idx;
    });
  }

  function highlightMatch(text, query) {
    const raw = String(text || '');
    const q = (query || '').trim();
    if (!q) return escapeHtml(raw);
    const idx = raw.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return escapeHtml(raw);
    return `${escapeHtml(raw.slice(0, idx))}<mark class="bg-[#F15A29]/20 text-inherit rounded px-0.5">${escapeHtml(raw.slice(idx, idx + q.length))}</mark>${escapeHtml(raw.slice(idx + q.length))}`;
  }

  function groupResults(results) {
    const order = getConfig().groupOrder || Object.values(TYPE_LABELS);
    const groups = new Map();
    results.forEach((entry) => {
      const key = entry.group || TYPE_LABELS[entry.type] || 'Results';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(entry);
    });
    return order
      .filter((g) => groups.has(g))
      .map((g) => ({ label: g, items: groups.get(g) }));
  }

  function renderResults(query) {
    if (!resultsEl) return;
    lastPaletteQuery = query || '';
    visibleResults = runSearch(query);
    activeIndex = visibleResults.length ? 0 : -1;

    if (!visibleResults.length) {
      resultsEl.innerHTML = `
        <div class="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
          <i class="fas fa-search text-2xl mb-3 opacity-40"></i>
          <p>No matches for <strong class="text-gray-700 dark:text-gray-200">"${escapeHtml(query)}"</strong></p>
          <p class="mt-2 text-xs opacity-80">Try a guide name, script scenario, tool, or saved item</p>
        </div>`;
      return;
    }

    const grouped = groupResults(visibleResults);
    let flatIdx = 0;
    const sections = grouped.map((group) => {
      const itemsHtml = group.items.map((entry) => {
        const idx = flatIdx++;
        const isActive = idx === activeIndex;
        return `
          <button type="button"
            class="global-search-result w-full text-left px-3 py-2.5 rounded-xl flex items-start gap-3 transition ${isActive ? 'bg-[#00A89D]/15 ring-1 ring-[#00A89D]/40' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}"
            data-result-index="${idx}">
            <span class="mt-0.5 w-8 h-8 rounded-lg bg-[#002B5C]/10 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
              <i class="${escapeHtml(entry.icon || 'fas fa-arrow-right')} text-[#00A89D] text-sm"></i>
            </span>
            <span class="min-w-0 flex-1">
              <span class="block text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">${highlightMatch(entry.title, query)}</span>
              <span class="block text-xs text-gray-500 dark:text-gray-400 truncate">${escapeHtml(getMatchSnippet(entry, query))}</span>
            </span>
            <span class="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 flex-shrink-0 mt-1">${escapeHtml(group.label)}</span>
          </button>`;
      }).join('');
      return `
        <div class="py-2">
          <div class="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">${escapeHtml(group.label)}</div>
          <div class="space-y-0.5">${itemsHtml}</div>
        </div>`;
    }).join('');

    const heading = query
      ? `${visibleResults.length} result${visibleResults.length === 1 ? '' : 's'}`
      : (getRecents().length ? 'Recent & popular' : 'Popular tools');

    const suggestions = !query ? (getConfig().suggestedQueries || []) : [];
    const chipsHtml = suggestions.length ? `
      <div class="px-3 pb-2 flex flex-wrap gap-2">
        ${suggestions.map((s) => `
          <button type="button" class="global-search-chip text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-[#00A89D] hover:text-[#00A89D] transition" data-query="${escapeHtml(s)}">${escapeHtml(s)}</button>
        `).join('')}
      </div>` : '';

    resultsEl.innerHTML = `
      <div class="px-3 pt-2 pb-1 text-[11px] text-gray-500 dark:text-gray-400">${heading}</div>
      ${chipsHtml}
      ${sections}`;
  }

  function updateActiveRow() {
    if (!resultsEl) return;
    resultsEl.querySelectorAll('.global-search-result').forEach((btn) => {
      const idx = Number(btn.dataset.resultIndex);
      const active = idx === activeIndex;
      btn.classList.toggle('bg-[#00A89D]/15', active);
      btn.classList.toggle('ring-1', active);
      btn.classList.toggle('ring-[#00A89D]/40', active);
      btn.classList.toggle('hover:bg-gray-100', !active);
      btn.classList.toggle('dark:hover:bg-gray-800', !active);
      if (active) btn.scrollIntoView({ block: 'nearest' });
    });
  }

  function runAction(action) {
    switch (action) {
      case 'saved':
        if (typeof window.showSavedItemsLibrary === 'function') window.showSavedItemsLibrary();
        break;
      case 'profile':
        if (typeof window.openUserProfile === 'function') window.openUserProfile(true);
        else document.getElementById('open-profile-btn')?.click();
        break;
      case 'api-key':
        if (typeof window.openApiKeyModal === 'function') window.openApiKeyModal();
        else document.getElementById('api-key-btn')?.click();
        break;
      case 'feedback':
        if (typeof window.openAppFeedbackEmail === 'function') window.openAppFeedbackEmail();
        else document.getElementById('app-feedback-btn')?.click();
        break;
      default:
        break;
    }
  }

  function runDeepLink(entry) {
    let handler = entry.handler ? { ...entry.handler } : null;
    if (handler?.kind === 'underwriting' && !handler.question && lastPaletteQuery) {
      handler.question = lastPaletteQuery;
    }
    if (!handler) {
      if (entry.sectionId && typeof window.showSection === 'function') window.showSection(entry.sectionId);
      return;
    }

    const afterSection = (sectionId, fn, delay = 160) => {
      if (sectionId && typeof window.showSection === 'function') window.showSection(sectionId);
      setTimeout(fn, delay);
    };

    switch (handler.kind) {
      case 'section':
        if (typeof window.showSection === 'function') window.showSection(handler.sectionId || entry.sectionId);
        break;
      case 'event':
        afterSection('eventplanning', () => {
          if (typeof window.openEventModal === 'function') window.openEventModal(handler.key);
        });
        break;
      case 'appreciation':
        afterSection('eventplanning', () => {
          if (typeof window.showClientAppreciationModal === 'function') {
            window.showClientAppreciationModal(handler.mode || 'events');
          }
        });
        break;
      case 'detail':
        afterSection('database', () => {
          if (typeof window.showDetailModal === 'function') window.showDetailModal(handler.category, handler.key);
        });
        break;
      case 'process':
        afterSection('process', () => {
          if (typeof window.showProcessTemplateModal === 'function') window.showProcessTemplateModal(handler.key);
        });
        break;
      case 'nurture':
        afterSection('database', () => {
          if (typeof window.showNurtureTemplateModal === 'function') window.showNurtureTemplateModal(handler.key);
        });
        break;
      case 'referral-play':
        afterSection('referrals', () => {
          if (typeof window.openHighImpactPlay === 'function') window.openHighImpactPlay(handler.key);
        });
        break;
      case 'referral-tier':
        afterSection('referrals', () => {
          if (typeof window.openTierModal === 'function') window.openTierModal(handler.tier);
        });
        break;
      case 'script':
        if (typeof window.bridgeToScriptGenerator === 'function') {
          window.bridgeToScriptGenerator({
            categoryKey: handler.categoryKey,
            scenarioValue: handler.scenarioValue,
          });
        } else if (typeof window.showSection === 'function') {
          window.showSection('sales-script');
        }
        break;
      case 'vault':
        afterSection(entry.sectionId || 'referrals', () => {
          if (typeof window.showVaultItemModal === 'function') window.showVaultItemModal(handler.vaultId);
        });
        break;
      case 'book':
        afterSection('books', () => {
          if (typeof window.filterToBook === 'function') window.filterToBook(handler.bookId);
        });
        break;
      case 'social-pillar':
        afterSection('social', () => {
          if (typeof window.openSocialPillarModal === 'function') {
            window.openSocialPillarModal(handler.pillar);
          } else if (typeof window.openSocialModal === 'function') {
            window.openSocialModal(handler.pillar);
          }
        });
        break;
      case 'mindset':
        afterSection('mindset-motivation', () => {
          if (typeof window.filterToMindset === 'function') window.filterToMindset(handler.itemId);
        });
        break;
      case 'underwriting':
        afterSection('underwriting-search', () => {
          const q = document.getElementById('uw-question');
          const lt = document.getElementById('uw-loan-type');
          if (q && handler.question) q.value = handler.question;
          if (lt && handler.loanType) lt.value = handler.loanType;
          q?.focus();
        });
        break;
      case 'action':
        if (handler.action) runAction(handler.action);
        break;
      default:
        if (entry.sectionId && typeof window.showSection === 'function') window.showSection(entry.sectionId);
        break;
    }
  }

  function executeEntry(entry) {
    if (!entry) return;
    pushRecent(entry);
    closePalette();

    if (['guide', 'script', 'fact', 'book', 'social', 'mindset'].includes(entry.type)) {
      runDeepLink(entry);
      return;
    }

    if (entry.action) {
      runAction(entry.action);
      return;
    }

    if (entry.type === 'vault') {
      if (typeof window.showSection === 'function') window.showSection('value-vault');
      setTimeout(() => {
        if (typeof window.applyVaultSearch === 'function') window.applyVaultSearch(entry.title);
        if (entry.vaultId && typeof window.showVaultItemModal === 'function') {
          window.showVaultItemModal(entry.vaultId);
        }
      }, 140);
      return;
    }

    if (entry.type === 'saved') {
      if (typeof window.showSavedItemsLibrary === 'function') window.showSavedItemsLibrary();
      setTimeout(() => {
        if (typeof window.viewSavedItem === 'function') window.viewSavedItem(entry.vaultIndex);
      }, 200);
      return;
    }

    if (entry.sectionId && typeof window.showSection === 'function') {
      window.showSection(entry.sectionId);
    }
  }

  function ensurePalette() {
    if (overlay) return;

    overlay = document.createElement('div');
    overlay.id = 'global-search-overlay';
    overlay.className = 'hidden fixed inset-0 z-[100010] items-start justify-center pt-[10vh] px-4';
    overlay.innerHTML = `
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" data-global-search-backdrop></div>
      <div class="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" role="dialog" aria-modal="true" aria-label="Search">
        <div class="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <i class="fas fa-search text-[#00A89D]"></i>
          <input id="global-search-input" type="text" autocomplete="off" spellcheck="false"
            placeholder="Search guides, scripts, tools, vault, saved items…"
            class="flex-1 bg-transparent text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none" />
          <kbd class="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md border border-gray-200 dark:border-gray-600 text-[10px] text-gray-400">ESC</kbd>
        </div>
        <div id="global-search-results" class="max-h-[min(52vh,420px)] overflow-y-auto"></div>
        <div class="px-4 py-2.5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-[10px] text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-4 gap-y-1">
          <span><kbd class="font-semibold">↑↓</kbd> navigate</span>
          <span><kbd class="font-semibold">Enter</kbd> open</span>
          <span><kbd class="font-semibold">⇧Enter</kbd> copy saved</span>
          <span><kbd class="font-semibold">${navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+K</kbd> toggle</span>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    inputEl = overlay.querySelector('#global-search-input');
    resultsEl = overlay.querySelector('#global-search-results');

    overlay.querySelector('[data-global-search-backdrop]')?.addEventListener('click', closePalette);

    inputEl.addEventListener('input', () => {
      clearTimeout(searchTimer);
      const q = inputEl.value;
      searchTimer = setTimeout(() => renderResults(q), 80);
    });

    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!visibleResults.length) return;
        activeIndex = (activeIndex + 1) % visibleResults.length;
        updateActiveRow();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!visibleResults.length) return;
        activeIndex = (activeIndex - 1 + visibleResults.length) % visibleResults.length;
        updateActiveRow();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const pick = activeIndex >= 0 ? visibleResults[activeIndex] : null;
        if (!pick) return;
        if (e.shiftKey && pick.type === 'saved' && typeof window.copySavedItemFromList === 'function') {
          closePalette();
          window.copySavedItemFromList(pick.vaultIndex);
          if (typeof window.showToast === 'function') window.showToast('Copied saved item', 'success', 1400);
          return;
        }
        executeEntry(pick);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closePalette();
      }
    });

    resultsEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.global-search-result');
      if (!btn) return;
      const idx = Number(btn.dataset.resultIndex);
      if (visibleResults[idx]) executeEntry(visibleResults[idx]);
    });

    resultsEl.addEventListener('mouseover', (e) => {
      const btn = e.target.closest('.global-search-result');
      if (!btn) return;
      activeIndex = Number(btn.dataset.resultIndex);
      updateActiveRow();
    });

    resultsEl.addEventListener('click', (e) => {
      const chip = e.target.closest('.global-search-chip');
      if (!chip || !inputEl) return;
      inputEl.value = chip.dataset.query || '';
      renderResults(inputEl.value);
      inputEl.focus();
    });
  }

  function openPalette(prefill) {
    ensurePalette();
    staticIndex = buildStaticIndex();
    isOpen = true;
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    document.body.classList.add('modal-open');
    inputEl.value = prefill || '';
    renderResults(inputEl.value);
    requestAnimationFrame(() => {
      inputEl.focus();
      inputEl.select();
    });
  }

  function closePalette() {
    if (!overlay || !isOpen) return;
    isOpen = false;
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
    if (typeof window.releaseModalScrollLock === 'function') {
      window.releaseModalScrollLock();
    } else {
      document.body.classList.remove('modal-open');
    }
  }

  function shouldIgnoreShortcut(e) {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return !e.target.id?.includes('global-search');
    return e.target?.isContentEditable;
  }

  function bindShortcuts() {
    document.addEventListener('keydown', (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) closePalette();
        else openPalette();
        return;
      }
      if (e.key === '/' && !shouldIgnoreShortcut(e) && !isOpen) {
        e.preventDefault();
        openPalette();
        return;
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        closePalette();
      }
    });
  }

  function bindTriggers() {
    document.querySelectorAll('[data-global-search-trigger]').forEach((btn) => {
      btn.addEventListener('click', () => openPalette());
    });
    const legacy = document.getElementById('search');
    if (legacy) {
      legacy.addEventListener('focus', (e) => {
        e.preventDefault();
        legacy.blur();
        openPalette(legacy.value);
      });
      legacy.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key.length === 1) {
          e.preventDefault();
          openPalette(legacy.value);
        }
      });
    }
  }

  function validateHandler(entry) {
    const h = entry?.handler;
    if (!h) return entry?.sectionId ? { ok: true, note: 'section only' } : { ok: false, note: 'no handler' };
    const fnMap = {
      section: () => !!h.sectionId,
      event: () => typeof window.openEventModal === 'function',
      appreciation: () => typeof window.showClientAppreciationModal === 'function',
      detail: () => typeof window.showDetailModal === 'function' && h.category && h.key,
      process: () => typeof window.showProcessTemplateModal === 'function' && h.key,
      nurture: () => typeof window.showNurtureTemplateModal === 'function' && h.key,
      'referral-play': () => typeof window.openHighImpactPlay === 'function' && h.key,
      'referral-tier': () => typeof window.openTierModal === 'function' && h.tier,
      script: () => typeof window.bridgeToScriptGenerator === 'function' && h.categoryKey && h.scenarioValue,
      vault: () => typeof window.showVaultItemModal === 'function' && h.vaultId,
      book: () => typeof window.filterToBook === 'function' && h.bookId,
      'social-pillar': () => typeof window.openSocialPillarModal === 'function' && h.pillar,
      mindset: () => typeof window.filterToMindset === 'function' && h.itemId,
      underwriting: () => document.getElementById('underwriting-search') && document.getElementById('uw-question'),
      action: () => !!h.action,
    };
    const check = fnMap[h.kind];
    return check && check() ? { ok: true, note: h.kind } : { ok: false, note: `${h.kind} wiring` };
  }

  window.auditGlobalSearchDeepLinks = function auditGlobalSearchDeepLinks(queries) {
    staticIndex = buildStaticIndex();
    const list = queries || (window.GLOBAL_SEARCH_TEST_QUERIES
      ? [...(window.GLOBAL_SEARCH_TEST_QUERIES.lo || []), ...(window.GLOBAL_SEARCH_TEST_QUERIES.realtor || [])]
      : []);
    const rows = [];
    list.forEach((q) => {
      const top = runSearch(q)[0];
      if (!top) {
        rows.push({ query: q, ok: false, title: '(no result)', note: 'miss' });
        return;
      }
      const v = validateHandler(top);
      rows.push({ query: q, ok: v.ok, title: top.title, type: top.type, note: v.note, handler: top.handler || null });
    });
    console.table(rows);
    const bad = rows.filter((r) => !r.ok);
    if (bad.length) console.warn(`[global-search] ${bad.length} deep-link issue(s)`, bad);
    else console.log('%c[global-search] All audited queries have valid deep-link wiring', 'color:#00A89D');
    return rows;
  };

  function initGlobalSearch() {
    bindShortcuts();
    bindTriggers();
    staticIndex = buildStaticIndex();
    window.openGlobalSearch = openPalette;
    window.closeGlobalSearch = closePalette;
    console.log('%c[global-search] Command palette ready', 'color:#00A89D');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlobalSearch);
  } else {
    initGlobalSearch();
  }
})();