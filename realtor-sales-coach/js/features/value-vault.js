/**
 * js/features/value-vault.js
 *
 * Value Vault enhancements:
 * - Live search/filter across all accordions
 * - Expand All / Collapse All controls
 * - One-click Copy buttons on scripts, objections, emails, and video ideas
 */

(function () {
  'use strict';

  // =====================================================
  // COPY TO CLIPBOARD
  // =====================================================
  function copyToClipboard(text, buttonEl) {
    const originalText = buttonEl.innerHTML;

    navigator.clipboard.writeText(text).then(() => {
      buttonEl.innerHTML = '<i class="fas fa-check mr-1"></i>Copied!';
      buttonEl.classList.add('!bg-green-500', '!text-white', 'border-green-500');

      setTimeout(() => {
        buttonEl.innerHTML = originalText;
        buttonEl.classList.remove('!bg-green-500', '!text-white', 'border-green-500');
      }, 1800);
    }).catch(() => {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);

      buttonEl.innerHTML = '<i class="fas fa-check mr-1"></i>Copied!';
      setTimeout(() => {
        buttonEl.innerHTML = originalText;
      }, 1800);
    });
  }

  // =====================================================
  // ATTACH COPY BUTTONS TO CONTENT
  // =====================================================
  function attachCopyButtons() {
    const vault = document.getElementById('value-vault');
    if (!vault) return;

    // 1. Follow-up scripts in Referral Partners (first big ul.space-y-4)
    const followUpContainer = vault.querySelector('.accordion-content ul.space-y-4');
    if (followUpContainer) {
      followUpContainer.querySelectorAll('li').forEach(li => {
        if (li.querySelector('.vault-copy-btn')) return;
        const text = li.textContent.trim();
        if (!text) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'relative group';
        li.parentNode.insertBefore(wrapper, li);
        wrapper.appendChild(li);

        const btn = createCopyButton('Copy Script');
        btn.onclick = () => copyToClipboard(text, btn);
        appendCopySaveActions(wrapper, btn, 'Value Vault Script', text, 'value-vault');
      });
    }

    // 2. Objection responses (using the dedicated class we added)
    const objectionsContainer = vault.querySelector('.vault-objections');
    if (objectionsContainer) {
      objectionsContainer.querySelectorAll('ol.list-decimal li').forEach(li => {
        if (li.querySelector('.vault-copy-btn')) return;
        const text = li.textContent.trim();
        if (!text) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'relative group';
        li.parentNode.insertBefore(wrapper, li);
        wrapper.appendChild(li);

        const btn = createCopyButton('Copy Response');
        btn.onclick = () => copyToClipboard(text, btn);
        appendCopySaveActions(wrapper, btn, 'Value Vault Objection Response', text, 'value-vault');
      });
    }

    // 3. Email Templates (using dedicated class)
    const emailsContainer = vault.querySelector('.vault-emails');
    if (emailsContainer) {
      emailsContainer.querySelectorAll('h4 + p').forEach(p => {
        if (p.querySelector('.vault-copy-btn') || p.textContent.length < 50) return;

        const prev = p.previousElementSibling;
        let fullText = p.textContent.trim();
        if (prev && prev.tagName === 'P' && prev.textContent.includes('Subject:')) {
          fullText = prev.textContent.trim() + '\n\n' + fullText;
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'relative group mt-1';
        p.parentNode.insertBefore(wrapper, p);
        wrapper.appendChild(p);

        const heading = p.previousElementSibling;
        const subject = heading && heading.tagName === 'H4' ? heading.textContent.trim() : 'Email Template';
        const btn = createCopyButton('Copy Full Email');
        btn.onclick = () => copyToClipboard(fullText, btn);
        appendCopySaveActions(wrapper, btn, `Value Vault: ${subject}`, fullText, 'value-vault');
      });
    }

    // 4. Video Scripts (using dedicated class)
    const videosContainer = vault.querySelector('.vault-videos');
    if (videosContainer) {
      videosContainer.querySelectorAll('h4 + p').forEach(p => {
        if (p.textContent.includes('Script:') && !p.querySelector('.vault-copy-btn')) {
          const text = p.textContent.replace(/^Script:\s*/i, '').trim();

          const wrapper = document.createElement('div');
          wrapper.className = 'relative group';
          p.parentNode.insertBefore(wrapper, p);
          wrapper.appendChild(p);

          const btn = createCopyButton('Copy Script');
          btn.onclick = () => copyToClipboard(text, btn);
          appendCopySaveActions(wrapper, btn, 'Value Vault Video Script', text, 'value-vault');
        }
      });
    }

    // Note: We intentionally do NOT attach copy buttons to plain instructional lists
    // (e.g. "Pro Follow-Up Cadence & Tips" or "Down Payment Assistance").
    // Only true copy-paste scripts, responses, emails, and video scripts get buttons.
  }

  function createCopyButton(label = 'Copy') {
    const btn = document.createElement('button');
    btn.className = 'vault-copy-btn text-xs px-3 py-1 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-[#00A89D] hover:text-white hover:border-[#00A89D] transition-all opacity-80 group-hover:opacity-100 flex items-center gap-1 shadow-sm';
    btn.innerHTML = `<i class="fas fa-copy mr-1"></i>${label}`;
    btn.type = 'button';
    return btn;
  }

  function appendCopySaveActions(wrapper, copyBtn, saveTitle, saveContent, saveType) {
    const bar = document.createElement('div');
    bar.className = 'absolute top-0 right-0 flex items-center gap-1.5 vault-action-bar';
    bar.appendChild(copyBtn);
    if (window.SaveRibbon && typeof window.SaveRibbon.createButton === 'function') {
      bar.appendChild(window.SaveRibbon.createButton({
        title: saveTitle,
        content: saveContent,
        type: saveType || 'value-vault',
        label: 'Save'
      }));
    } else if (typeof window.toggleSaveIdea === 'function') {
      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.className = 'text-xs px-3 py-1 rounded-lg border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white transition-all flex items-center gap-1 shadow-sm';
      saveBtn.innerHTML = '<i class="far fa-bookmark"></i><span>Save</span>';
      saveBtn.title = 'Save to My Saved Items';
      saveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.toggleSaveIdea(saveTitle, saveContent, saveBtn, saveType || 'value-vault');
      });
      bar.appendChild(saveBtn);
    }
    wrapper.appendChild(bar);
  }

  // =====================================================
  // SEARCH / FILTER
  // =====================================================
  function initSearch() {
    const searchInput = document.getElementById('value-vault-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', () => {
      const term = searchInput.value.toLowerCase().trim();

      // 1. Legacy accordions (if any remain)
      const accordions = document.querySelectorAll('#value-vault .accordion');
      accordions.forEach(acc => {
        const titleEl = acc.querySelector('button');
        const contentEl = acc.querySelector('.accordion-content');
        if (!titleEl || !contentEl) return;
        const titleText = titleEl.textContent.toLowerCase();
        const contentText = contentEl.textContent.toLowerCase();
        const match = !term || titleText.includes(term) || contentText.includes(term);
        acc.style.display = match ? '' : 'none';
        if (match && term && !contentEl.classList.contains('open')) {
          contentEl.classList.add('open');
        }
      });

      // 2. Filter all modern Value Vault cards reliably
      // Target the actual clickable cards used in the pillars + Pop-By grid
      const allVaultCards = document.querySelectorAll('#value-vault .cursor-pointer.group, #value-vault .popby-card');
      allVaultCards.forEach(card => {
        // Skip the big pillar header cards themselves
        if (card.getAttribute('onclick') && card.getAttribute('onclick').includes('toggleValueVaultPillar')) {
          return;
        }
        const text = card.textContent.toLowerCase();
        const match = !term || text.includes(term);
        card.style.display = match ? '' : 'none';
      });

      // 3. Auto-expand pillars when search matches content inside them
      if (term) {
        document.querySelectorAll('[id^="value-vault-pillar-"]').forEach((pillar) => {
          const pillarText = pillar.textContent.toLowerCase();
          if (pillarText.includes(term) && !isVaultPillarOpen(pillar)) {
            setVaultPillarOpen(pillar, true);
          }
        });
      }

      // 4. Handle the Pop-By grid + live result count
      const popbyGrid = document.getElementById('popby-cards');
      if (popbyGrid) {
        const cards = popbyGrid.querySelectorAll('.popby-card');
        let visibleCount = 0;
        cards.forEach(c => {
          const text = c.textContent.toLowerCase();
          const match = !term || text.includes(term);
          c.style.display = match ? '' : 'none';
          if (match) visibleCount++;
        });

        let status = popbyGrid.parentNode.querySelector('.search-status');
        if (term) {
          if (!status) {
            status = document.createElement('div');
            status.className = 'search-status text-[10px] text-gray-500 mt-2';
            popbyGrid.parentNode.appendChild(status);
          }
          status.textContent = `Showing ${visibleCount} results for “${term}”`;
        } else if (status) {
          status.remove();
        }
      }

      // 5. If search is cleared, make sure everything is visible again
      if (!term) {
        document.querySelectorAll('#value-vault .cursor-pointer.group, #value-vault .popby-card').forEach(el => {
          el.style.display = '';
        });
      }
    });

    // Clear search on Escape
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input'));
        searchInput.blur();
      }
    });
  }

  // =====================================================
  // PILLAR OPEN / CLOSE (single source of truth — fixes double-click collapse)
  // Inline display:block was beating Tailwind .hidden; use computed style + clear inline display.
  // =====================================================
  function isVaultPillarOpen(el) {
    if (!el) return false;
    return window.getComputedStyle(el).display !== 'none';
  }

  function setVaultPillarOpen(el, open) {
    if (!el) return;
    el.style.removeProperty('display');
    el.classList.toggle('hidden', !open);
  }

  function getVaultPillarContent(pillarNumber) {
    const vault = document.getElementById('value-vault');
    if (!vault) return null;
    return vault.querySelector('#value-vault-pillar-' + pillarNumber);
  }

  function clearVaultPillarCardHighlights() {
    const grid = document.getElementById('value-vault-pillars-grid');
    if (!grid) return;
    grid.querySelectorAll('.pillar-card').forEach((c) => {
      c.classList.remove('!border-[#00A89D]', 'ring-1', 'ring-[#00A89D]');
    });
  }

  function highlightVaultPillarCard(clickedElement) {
    const grid = document.getElementById('value-vault-pillars-grid');
    if (!grid) return;
    clearVaultPillarCardHighlights();
    const card = clickedElement?.classList?.contains('pillar-card')
      ? clickedElement
      : clickedElement?.closest?.('.pillar-card[data-pillar]');
    if (card) {
      card.classList.add('!border-[#00A89D]', 'ring-1', 'ring-[#00A89D]');
    }
  }

  function collapseAllVaultPillars() {
    for (let i = 1; i <= 6; i++) {
      const content = getVaultPillarContent(i);
      if (content) setVaultPillarOpen(content, false);
    }
    clearVaultPillarCardHighlights();
  }

  window.closeValueVaultPillar = function closeValueVaultPillar(pillarNumber) {
    const content = getVaultPillarContent(pillarNumber);
    if (!content) return;
    setVaultPillarOpen(content, false);
    clearVaultPillarCardHighlights();
  };

  window.openValueVaultPillar = function openValueVaultPillar(pillarNumber, clickedElement, scrollMode) {
    const vault = document.getElementById('value-vault');
    if (!vault) return;

    const contentId = 'value-vault-pillar-' + pillarNumber;
    const content = vault.querySelector('#' + contentId);
    if (!content) {
      console.error('Could not find expanded content for pillar', pillarNumber);
      return;
    }

    vault.querySelectorAll('[id^="value-vault-pillar-"]').forEach((el) => {
      if (el.id !== contentId) setVaultPillarOpen(el, false);
    });
    setVaultPillarOpen(content, true);
    highlightVaultPillarCard(clickedElement);

    const scrollTarget = scrollMode || 'pillar';
    if (scrollTarget !== 'none') {
      setTimeout(() => {
        if (scrollTarget === 'toolbar' && typeof window.scrollVaultToToolbar === 'function') {
          window.scrollVaultToToolbar();
        } else {
          content.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    }

    if (pillarNumber === 1) {
      setTimeout(() => {
        if (typeof window.renderValueVault === 'function') window.renderValueVault();
      }, 80);
    }
  };

  window.toggleValueVaultPillar = function toggleValueVaultPillar(pillarNumber, clickedElement, scrollMode) {
    const content = getVaultPillarContent(pillarNumber);
    if (!content) {
      console.error('Value Vault pillar not found:', pillarNumber);
      return;
    }
    if (isVaultPillarOpen(content)) {
      window.closeValueVaultPillar(pillarNumber);
    } else {
      window.openValueVaultPillar(pillarNumber, clickedElement, scrollMode);
    }
  };

  window.scrollVaultToToolbar = function scrollVaultToToolbar() {
    const toolbar = document.getElementById('value-vault-toolbar');
    const vault = document.getElementById('value-vault');
    const target = toolbar || vault;
    if (!target) return;
    const headerOffset = 130;
    const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  };

  window.openVaultItemWhenReady = function openVaultItemWhenReady(id, attempt = 0) {
    const items = window.VALUE_VAULT_ITEMS;
    const item = Array.isArray(items) ? items.find((i) => i.id === id) : null;
    if (item && typeof window.showVaultItemModal === 'function') {
      if (typeof window.showSection === 'function') window.showSection('value-vault');
      window.showVaultItemModal(id);
      return;
    }
    if (attempt < 40) {
      setTimeout(() => window.openVaultItemWhenReady(id, attempt + 1), 120);
      return;
    }
    if (typeof window.showToast === 'function') {
      window.showToast('Value Vault is still loading — try again in a moment.', 'info');
    }
  };

  window.openVaultPillar = function openVaultPillar(pillarNumber, options) {
    const opts = options || {};
    const searchInput = document.getElementById('value-vault-search');
    if (searchInput) searchInput.value = '';
    searchInput?.dispatchEvent(new Event('input'));

    const num = parseInt(pillarNumber, 10);
    if (!num) return;

    const grid = document.getElementById('value-vault-pillars-grid');
    const card = grid?.querySelector('.pillar-card[data-pillar="' + num + '"]');
    const scrollMode = opts.scrollTo === 'pillar' ? 'pillar' : 'toolbar';

    setTimeout(() => {
      const content = getVaultPillarContent(num);
      if (content && !isVaultPillarOpen(content)) {
        window.openValueVaultPillar(num, card || null, scrollMode);
      } else if (content && scrollMode !== 'none') {
        window.openValueVaultPillar(num, card || null, scrollMode);
      }
    }, 80);
  };

  function handlePillarCardClick(e) {
    const card = e.target.closest('.pillar-card[data-pillar]');
    if (!card) return;
    const num = parseInt(card.dataset.pillar, 10);
    if (!num) return;
    e.preventDefault();
    window.toggleValueVaultPillar(num, card);
  }

  function wirePillarCards() {
    const grid = document.getElementById('value-vault-pillars-grid');
    if (!grid || grid._vaultPillarWired) return;
    grid.addEventListener('click', handlePillarCardClick);
    grid._vaultPillarWired = true;
    grid.querySelectorAll('.pillar-card[data-pillar]').forEach((card) => {
      if (!card.style.cursor) card.style.cursor = 'pointer';
    });
  }

  // =====================================================
  // EXPAND / COLLAPSE ALL
  // =====================================================
  function initExpandCollapse() {
    const expandBtn = document.getElementById('expand-all-btn');
    const collapseBtn = document.getElementById('collapse-all-btn');
    const vault = document.getElementById('value-vault');
    if (!vault || !expandBtn || !collapseBtn) return;
    if (expandBtn._vaultExpandWired) return;
    expandBtn._vaultExpandWired = true;
    collapseBtn._vaultExpandWired = true;

    expandBtn.addEventListener('click', () => {
      vault.querySelectorAll('.accordion').forEach((acc) => {
        const content = acc.querySelector('.accordion-content');
        const button = acc.querySelector('button');
        if (content && !content.classList.contains('open')) content.classList.add('open');
        const icon = button?.querySelector('i.fa-chevron-down, i.fa-chevron-up');
        if (icon) {
          icon.classList.remove('fa-chevron-down');
          icon.classList.add('fa-chevron-up');
        }
      });
      vault.querySelectorAll('[id^="value-vault-pillar-"]').forEach((el) => setVaultPillarOpen(el, true));
    });

    collapseBtn.addEventListener('click', () => {
      vault.querySelectorAll('.accordion').forEach((acc) => {
        const content = acc.querySelector('.accordion-content');
        const button = acc.querySelector('button');
        if (content) content.classList.remove('open');
        const icon = button?.querySelector('i.fa-chevron-up, i.fa-chevron-down');
        if (icon) {
          icon.classList.remove('fa-chevron-up');
          icon.classList.add('fa-chevron-down');
        }
      });
      collapseAllVaultPillars();
    });
  }

  // =====================================================
  // FAVORITES / SAVED RESOURCES SYSTEM
  // =====================================================
  const STORAGE_KEY = 'valueVaultFavorites';

  function loadFavorites() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function saveFavorites(favorites) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }

  function addToFavorites(item) {
    const favorites = loadFavorites();
    // Avoid duplicates
    if (!favorites.some(f => f.id === item.id)) {
      favorites.push(item);
      saveFavorites(favorites);
      renderSavedResources();
    }
  }

  function removeFromFavorites(id) {
    let favorites = loadFavorites();
    favorites = favorites.filter(f => f.id !== id);
    saveFavorites(favorites);
    renderSavedResources();
  }

  function clearAllFavorites() {
    localStorage.removeItem(STORAGE_KEY);
    renderSavedResources();
  }

  function renderSavedResources() {
    const panel = document.getElementById('saved-resources-panel');
    const grid = document.getElementById('saved-resources-grid');
    const countEl = document.getElementById('saved-count');
    if (!panel || !grid) return;

    const favorites = loadFavorites();

    if (favorites.length === 0) {
      panel.classList.add('hidden');
      return;
    }

    panel.classList.remove('hidden');
    countEl.textContent = `${favorites.length} saved`;

    grid.innerHTML = '';

    favorites.forEach(item => {
      const card = document.createElement('div');
      card.className = 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-4 text-sm relative group';

      card.innerHTML = `
        <div class="flex justify-between items-start gap-2">
          <div>
            <div class="text-[10px] uppercase tracking-wider text-[#F15A29] font-semibold mb-0.5">${item.category || 'Resource'}</div>
            <div class="font-semibold text-gray-800 dark:text-gray-100 pr-6">${item.title}</div>
          </div>
          <button class="text-gray-400 hover:text-red-500 transition" title="Remove">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="text-gray-600 dark:text-gray-300 mt-2 text-xs line-clamp-3">${item.content}</div>
      `;

      // Remove button
      const removeBtn = card.querySelector('button');
      removeBtn.addEventListener('click', () => {
        removeFromFavorites(item.id);
      });

      grid.appendChild(card);
    });
  }

  // =====================================================
  // ATTACH SAVE HEARTS TO ITEMS
  // =====================================================
  function attachSaveButtons() {
    const vault = document.getElementById('value-vault');
    if (!vault) return;

    // Helper to create a heart button
    function createHeartButton(itemData) {
      const btn = document.createElement('button');
      btn.className = 'absolute top-2 right-2 text-gray-300 hover:text-[#F15A29] transition z-10';
      btn.innerHTML = '<i class="far fa-heart text-lg"></i>';

      btn.addEventListener('click', (e) => {
        e.stopImmediatePropagation();
        const favorites = loadFavorites();
        const alreadySaved = favorites.some(f => f.id === itemData.id);

        if (alreadySaved) {
          removeFromFavorites(itemData.id);
          btn.innerHTML = '<i class="far fa-heart text-lg"></i>';
        } else {
          addToFavorites(itemData);
          btn.innerHTML = '<i class="fas fa-heart text-lg text-[#F15A29]"></i>';
          // Also save to central My Saved Items
          if (typeof window.toggleSaveIdea === 'function') {
            window.toggleSaveIdea(`${itemData.category}: ${itemData.title}`, itemData.content, btn, 'value-vault');
          }
        }
      });

      return btn;
    }

    // 1. Pop-by cards (the nice grid cards)
    vault.querySelectorAll('.accordion-content .grid > div').forEach(card => {
      if (card.querySelector('.fa-heart')) return; // already has one

      const text = card.textContent.trim();
      if (text.length < 20) return;

      const title = text.split('→')[0]?.trim() || text.substring(0, 50);
      const itemData = {
        id: 'popby-' + text.replace(/\s+/g, '-').toLowerCase().substring(0, 60),
        category: 'Pop-By Idea',
        title: title,
        content: text
      };

      const heart = createHeartButton(itemData);
      card.style.position = 'relative';
      card.appendChild(heart);
    });

    // 2. Gift cards in the Gifts section
    vault.querySelectorAll('#value-vault .accordion-content .grid > div').forEach(card => {
      if (card.closest('#saved-resources-panel')) return;
      if (card.querySelector('.fa-heart')) return;

      const text = card.textContent.trim();
      if (text.length < 15) return;

      const titleMatch = text.match(/<strong>(.*?)<\/strong>/);
      const title = titleMatch ? titleMatch[1] : text.substring(0, 45);

      const itemData = {
        id: 'gift-' + text.replace(/\s+/g, '-').toLowerCase().substring(0, 60),
        category: 'Client Gift',
        title: title,
        content: text.replace(/<[^>]+>/g, ' ').trim()
      };

      const heart = createHeartButton(itemData);
      card.style.position = 'relative';
      card.appendChild(heart);
    });
  }

  // =====================================================
  // IDEA OF THE DAY
  // =====================================================
  let currentIdea = null;

  function collectAllIdeas() {
    const ideas = [];

    // New data-driven source (preferred)
    if (window.VALUE_VAULT_ITEMS && Array.isArray(window.VALUE_VAULT_ITEMS)) {
      window.VALUE_VAULT_ITEMS.forEach(item => {
        if (item.title && item.content) {
          ideas.push({
            category: item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'Value Vault',
            title: item.title,
            content: item.content.replace(/<[^>]+>/g, ' ').trim() // strip HTML for the idea modal
          });
        }
      });
      return ideas;
    }

    // Fallback: try to collect from old DOM structure (for transition period)
    const vault = document.getElementById('value-vault');
    if (!vault) return ideas;

    vault.querySelectorAll('.accordion-content .grid > div').forEach(el => {
      const text = el.textContent.trim();
      if (text.length > 25) {
        ideas.push({
          category: 'Pop-By Idea',
          title: text.split('→')[0]?.trim() || 'Pop-By Idea',
          content: text
        });
      }
    });

    return ideas;
  }

  function showRandomIdea() {
    const ideas = collectAllIdeas();
    if (ideas.length === 0) {
      window.notifyUser('No ideas available yet. Please try again after the page fully loads, or add more content to the Value Vault.', 'warning', 3200);
      return;
    }

    const randomIndex = Math.floor(Math.random() * ideas.length);
    currentIdea = ideas[randomIndex];

    let modal = document.getElementById('idea-modal');
    let contentDiv = document.getElementById('idea-content');
    let saveBtn = document.getElementById('save-idea-btn');

    // Defensive recreation if the modal was removed or never existed
    if (!modal || !contentDiv || !saveBtn) {
      console.warn('[Idea of the Day] Modal elements missing — recreating dynamically');

      // Remove any stale version
      if (modal) modal.remove();

      modal = document.createElement('div');
      modal.id = 'idea-modal';
      modal.className = 'fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4';
      modal.innerHTML = `
        <div onclick="event.stopImmediatePropagation()" 
             class="bg-white dark:bg-gray-800 rounded-3xl max-w-2xl w-full p-7 md:p-8 shadow-2xl relative">
          
          <button class="absolute top-5 right-5 text-3xl leading-none text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 close-idea-btn">&times;</button>

          <div class="flex items-center gap-3 mb-5">
            <div class="w-9 h-9 rounded-xl bg-[#F15A29]/10 flex items-center justify-center">
              <i class="fas fa-lightbulb text-[#F15A29] text-xl"></i>
            </div>
            <h3 class="text-2xl font-bold text-[#002B5C] dark:text-white">Idea of the Day</h3>
          </div>

          <div id="idea-content" class="prose prose-base dark:prose-invert max-w-none mb-7 text-[15px] leading-relaxed">
            <!-- Populated by JS -->
          </div>

          <div class="flex flex-col sm:flex-row gap-3">
            <button id="save-idea-btn" 
                    class="flex-1 bg-[#00A89D] hover:bg-[#008f85] text-white font-semibold py-3.5 px-6 rounded-2xl transition flex items-center justify-center gap-2 text-base">
              <i class="fas fa-heart"></i> 
              <span>Save This Idea</span>
            </button>
            <button class="get-another-idea-btn flex-1 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold py-3.5 px-6 rounded-2xl transition text-base">
              Get Another Idea
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      // Re-query after creation
      contentDiv = modal.querySelector('#idea-content');
      saveBtn = modal.querySelector('#save-idea-btn');

      // Wire close buttons
      modal.querySelector('.close-idea-btn')?.addEventListener('click', () => {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
        modal.style.display = 'none';
      });

      // Wire "Get Another Idea"
      modal.querySelector('.get-another-idea-btn')?.addEventListener('click', () => {
        if (typeof window.showRandomIdea === 'function') window.showRandomIdea();
      });

      // Backdrop close
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('flex');
          modal.classList.add('hidden');
          modal.style.display = 'none';
        }
      });
    }

    contentDiv.innerHTML = `
      <div class="mb-2">
        <span class="inline-block px-3 py-0.5 text-xs font-semibold rounded-full bg-[#F15A29]/10 text-[#F15A29]">
          ${currentIdea.category}
        </span>
      </div>
      <div class="font-semibold text-lg mb-3">${currentIdea.title}</div>
      <div class="text-gray-700 dark:text-gray-300">${currentIdea.content}</div>
    `;

    // Update save button
    if (saveBtn) {
      saveBtn.onclick = () => {
        const title = `${currentIdea.category}: ${currentIdea.title}`;
        const content = currentIdea.content;
        if (typeof window.toggleSaveIdea === 'function') {
          window.toggleSaveIdea(title, content, saveBtn, 'value-vault');
        } else if (typeof addToFavorites === 'function') {
          const itemData = { id: 'idea-' + Date.now(), category: currentIdea.category, title: currentIdea.title, content: currentIdea.content };
          addToFavorites(itemData);
        }
        saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved to My Saved Items!';
        setTimeout(() => {
          if (saveBtn && saveBtn.isConnected) saveBtn.innerHTML = '<i class="fas fa-heart"></i> Save This Idea';
        }, 1500);
      };
    }

    if (typeof window.openNamedModal === 'function') {
      window.openNamedModal(modal);
    } else {
      modal.style.display = 'flex';
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      modal.style.pointerEvents = 'auto';
      document.body.classList.add('modal-open');
    }
    if (typeof window.ensureModalBackdropClose === 'function') {
      window.ensureModalBackdropClose(modal);
    }
  }

  // Immediate exposure so any early clicks or other scripts can find it
  window.showRandomIdea = showRandomIdea;

  function closeIdeaModal() {
    const modal = document.getElementById('idea-modal');
    if (modal) {
      modal.classList.remove('flex');
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  }

  // Expose globally for the "Get Another Idea" button and toolbar robustness
  window.closeIdeaModal = closeIdeaModal;

  // Robust delegated close for Idea modal (handles dynamic recreation)
  document.addEventListener('click', function(e) {
    const modal = document.getElementById('idea-modal');
    if (!modal) return;

    // Close button
    if (e.target.closest('.close-idea-btn')) {
      e.preventDefault();
      closeIdeaModal();
    }

    // Backdrop click
    if (e.target === modal) {
      closeIdeaModal();
    }
  });

  // =====================================================
  // INITIALIZE PHASE 3 FEATURES
  // =====================================================
  function initPhase3Features() {
    const vault = document.getElementById('value-vault');
    if (!vault) return;

    // Note: The main Idea of the Day button attachment is now handled globally
    // outside this function for reliability (see attachIdeaOfTheDayButton at bottom of file).
    // We still ensure the function is exposed here as a backup.
    if (typeof showRandomIdea === 'function') {
      window.showRandomIdea = showRandomIdea;
    }

    // Clear saved button
    const clearBtn = document.getElementById('clear-saved-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Clear all saved resources?')) {
          clearAllFavorites();
        }
      });
    }

    // Attach save hearts (with retry for collapsed accordions)
    attachSaveButtons();
    setTimeout(() => attachSaveButtons(), 800);

    // Re-attach when user opens accordions (for cards inside closed sections)
    vault.querySelectorAll('.accordion button').forEach(btn => {
      btn.addEventListener('click', () => {
        setTimeout(() => attachSaveButtons(), 300);
      });
    });

    // Render any previously saved items
    renderSavedResources();

    // NEW modern card grid (2026 refresh)
    if (typeof window.renderValueVault === 'function') {
      window.renderValueVault();
    }

    console.log('%c[value-vault.js] Phase 3 features (Favorites + Idea of the Day) initialized', 'color:#00A89D');
  }

  // =====================================================
  // POST-CLOSING CHECKLIST COPY FUNCTION
  // =====================================================
  function copyPostClosingChecklist() {
    const checklistText = `7-Day Post-Closing Call Checklist

PRE-CALL
- Block time for your weekly “Power Hour” (Thursday recommended)
- Pull list of clients who closed 7 days ago
- Have their transaction notes and closing details ready

OPENING THE CALL
- Greet enthusiastically and ask if they have 2–3 minutes
- Congratulate them on the new home
- Thank them for trusting you with their purchase
- Ask permission to share a few important things

EDUCATION TOPICS
- Walk through utility setup, HOA portal, and trash/recycling schedule if applicable
- Remind them about homestead / owner-occupied property tax exemptions (and filing deadlines)
- Explain they may get separate tax or insurance bills — coordinate with their lender so they don't double-pay
- Warn about investor mail, home warranty pitches, and "we'll buy your house" postcards
- Tell them to forward questionable offers to you before responding
- Mention you'll send periodic home value / equity updates (HomeBot or your CMA touch)

FEEDBACK & RELATIONSHIP
- Ask: “How do you feel we did overall?”
- Ask: “What’s one thing we could have done better?”
- Request Google/online testimonial
- Ask for referral: “When buying or selling comes up, would you mention my name?”

SALES ANCHOR (FUTURE BUSINESS)
- Set expectation for Annual Home Review call (around home anniversary)
- Position it as a “home equity and market check-in”
- Leave the door open: “Please reach out anytime you need anything”

AFTER THE CALL
- Log the call and notes in your CRM
- Send the Google review link if they agreed
- Add them to your annual review calendar`;

    navigator.clipboard.writeText(checklistText).then(() => {
      const originalText = event.target.innerHTML;
      const btn = event.currentTarget || event.target.closest('button');
      if (btn) {
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
          btn.innerHTML = '<i class="fas fa-copy"></i> <span>Copy Checklist</span>';
        }, 1800);
      }
    }).catch(() => {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = checklistText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      window.notifyUser('Checklist copied to clipboard!', 'success', 3200);
    });
  }

  function savePostClosingChecklist(btnEl) {
    const checklistText = `7-Day Post-Closing Call Checklist

PRE-CALL
- Block time for your weekly "Power Hour" (Thursday recommended)
- Pull list of clients who closed 7 days ago
- Have their transaction notes and closing details ready

OPENING THE CALL
- Greet enthusiastically and ask if they have 2–3 minutes
- Congratulate them on the new home
- Thank them for trusting you with their purchase
- Ask permission to share a few important things

EDUCATION TOPICS
- Walk through utility setup, HOA portal, and trash/recycling schedule if applicable
- Remind them about homestead / owner-occupied property tax exemptions (and filing deadlines)
- Explain they may get separate tax or insurance bills — coordinate with their lender so they don't double-pay
- Warn about investor mail, home warranty pitches, and "we'll buy your house" postcards
- Tell them to forward questionable offers to you before responding
- Mention you'll send periodic home value / equity updates (HomeBot or your CMA touch)

FEEDBACK & RELATIONSHIP
- Ask: "How do you feel we did overall?"
- Ask: "What's one thing we could have done better?"
- Request Google/online testimonial
- Ask for referral: "When buying or selling comes up, would you mention my name?"

SALES ANCHOR (FUTURE BUSINESS)
- Set expectation for Annual Home Review call (around home anniversary)
- Position it as a "home equity and market check-in"
- Leave the door open: "Please reach out anytime you need anything"

AFTER THE CALL
- Log the call and notes in your CRM
- Send the Google review link if they agreed
- Add them to your annual review calendar`;

    if (typeof window.toggleSaveIdea === 'function') {
      window.toggleSaveIdea('7-Day Post-Closing Call Checklist', checklistText, btnEl, 'postclosing');
      if (typeof window.showSavedFeedback === 'function') window.showSavedFeedback('Saved to My Saved Items');
    }
  }

  // Make it globally available
  window.copyPostClosingChecklist = copyPostClosingChecklist;
  window.savePostClosingChecklist = savePostClosingChecklist;

  // =====================================================
  // EVENT PLANNING CHECKLIST COPY FUNCTION
  // =====================================================
  function copyEventChecklist() {
    const checklistText = `Event Planning Checklist

8–12 WEEKS OUT
- Choose event type and date (align with season or holiday)
- Decide on co-host or venue

6–8 WEEKS OUT
- Secure venue and lock in partners/co-hosts
- Set budget and begin planning food, gifts, and signage

4–6 WEEKS OUT
- Build invite list (past clients + partners + their guests)
- Create invitations and save-the-date

3–4 WEEKS OUT
- Send invitations (email + text follow-up)
- Track RSVPs and send reminders

1–2 WEEKS OUT
- Confirm all vendors, food, and venue details in writing
- Double-check RSVPs and send final reminder (email + text)
- Order gifts, name tags, signage, and printed materials
- Create day-of run-of-show / timeline
- Test photo backdrop, lighting, and AV equipment
- Assign roles (greeter, photographer, registration)

DAY BEFORE
- Confirm final headcount with venue/caterer
- Send last-minute reminder to all attendees
- Pack all supplies (signage, gifts, name tags, chargers, extension cords)
- Review your run-of-show and talking points
- Charge all devices and back up materials

DAY OF
- Arrive 60–90 minutes early to set up
- Set up registration table, photo backdrop, and signage
- Greet guests personally as they arrive
- Take photos and videos throughout (or assign someone)
- Thank key partners and guests before they leave
- Do a quick breakdown and leave the venue clean

1–3 DAYS AFTER
- Send thank-you email with event photos to all attendees
- Post 3–5 highlight photos on social (tag attendees and partners)
- Personally call or text your top 5–10 guests/partners
- Log all feedback and new contacts in your CRM
- Send small thank-you gifts to key partners (optional but powerful)`;

    navigator.clipboard.writeText(checklistText).then(() => {
      const btns = document.querySelectorAll('button');
      btns.forEach(btn => {
        if (btn.textContent.includes('Copy Full Checklist')) {
          const original = btn.innerHTML;
          btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
          setTimeout(() => {
            btn.innerHTML = original;
          }, 1800);
        }
      });
    }).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = checklistText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      window.notifyUser('Checklist copied to clipboard!', 'success', 3200);
    });
  }

  window.copyEventChecklist = copyEventChecklist;

  // =====================================================
  // EVENT BUDGET + IDEA SUGGESTER
  // =====================================================
  // Data for the Event Idea Suggester
  const eventIdeaPool = {
    low_client: [
      { title: "Pie Day Delivery", desc: "Deliver pies to 30–50 past clients with a short handwritten note.", cost: "$250–350" },
      { title: "Pumpkin Porch Drop", desc: "Simple porch drop-off of pumpkins with a branded tag.", cost: "$200–300" },
      { title: "Holiday Cookie Drop", desc: "Small boxes of cookies delivered to past clients.", cost: "$250–400" },
      { title: "Client Appreciation Breakfast", desc: "Small breakfast at a local diner for 15–20 clients.", cost: "$300–400" },
      { title: "Valentine’s Day Flower Drop", desc: "Small bouquet drop-off with a thank you card.", cost: "$200–350" },
      { title: "Summer Lemonade Stand Thank You", desc: "Drop off lemonade and cookies with a branded note.", cost: "$200–300" },
      { title: "National Donut Day Drop", desc: "Deliver donuts to past clients in the spring.", cost: "$250–350" },
      { title: "Client Thank You Coffee Run", desc: "Surprise past clients with their favorite coffee order.", cost: "$200–300" },
      { title: "Spring Flower Drop", desc: "Deliver small potted flowers or bouquets with a note.", cost: "$250–350" },
      { title: "National Ice Cream Day Drop", desc: "Drop off ice cream gift cards or small cups to past clients.", cost: "$200–350" }
    ],
    low_partner: [
      { title: "Lender Lunch & Learn", desc: "Bring lunch to your go-to lender partner's office for a 25–30 min co-marketing market update.", cost: "$300–400" },
      { title: "Co-Broke Breakfast Roundtable", desc: "Early morning coffee + neighborhood market update for 6–10 fellow agents.", cost: "$200–350" },
      { title: "Lender Office Coffee Drop", desc: "Surprise your preferred lender with coffee, muffins, and co-branded buyer guides.", cost: "$200–300" },
      { title: "Joint Open House Support", desc: "Co-host with a lender partner — bring snacks and buyer guide one-pagers to your listing open houses.", cost: "$250–350" },
      { title: "Title Partner Desk Drop", desc: "Drop off branded notepads and local market stats at your title company's office.", cost: "$200–300" },
      { title: "Partner Thank You Gift Drop", desc: "Drop off small branded gifts (pens, notepads) to top referring agents, lenders, or title reps.", cost: "$250–350" },
      { title: "Co-Broke Coffee Chat Series", desc: "Invite 3–4 fellow agents for informal coffee and off-market talk.", cost: "$200–300" },
      { title: "Builder Sales Team Pop-By", desc: "Surprise a builder's sales office with bagels, coffee, and your buyer guide one-pager.", cost: "$200–350" },
      { title: "Small Joint Client Event", desc: "Co-host a tiny client appreciation with your lender or title partner.", cost: "$300–400" },
      { title: "Partner Holiday Card Drop", desc: "Hand-deliver personalized holiday cards to your top referral partners.", cost: "$150–250" }
    ],
    low_community: [
      { title: "Food or Clothing Drive", desc: "Place collection boxes at your office and a few partner offices.", cost: "$200–300" },
      { title: "Back-to-School Supply Drive", desc: "Collect supplies and drop them off at a local school.", cost: "$250–350" },
      { title: "Holiday Toy Drive Box", desc: "Set up a toy collection box at your office and promote it.", cost: "$200–300" },
      { title: "Community Shred Day", desc: "Partner with a shred company for a free community event.", cost: "$150–250" },
      { title: "Local 5K Water Station", desc: "Sponsor water and hand out branded items at a race.", cost: "$200–300" },
      { title: "Neighborhood Clean-Up", desc: "Organize a small clean-up day with coffee and donuts.", cost: "$200–350" },
      { title: "Food Drive with Lender Partner", desc: "Co-host a food collection with your preferred lender or title partner.", cost: "$200–300" },
      { title: "Senior Center Visit", desc: "Bring treats and downsizing / rightsizing resource sheets to seniors.", cost: "$150–250" },
      { title: "Library Resource Table", desc: "Set up a table at the local library with homebuyer info.", cost: "$100–200" },
      { title: "School Supply Pop-Up", desc: "Quick drive-thru supply giveaway in your parking lot.", cost: "$200–300" }
    ],
    low_leads: [
      { title: "Shredding Day", desc: "Partner with a shred company (often free) and offer coffee/donuts.", cost: "$200–350" },
      { title: "Community Event Booth", desc: "Set up a table at a local festival or 5K.", cost: "$250–400" },
      { title: "First-Time Homebuyer Info Night", desc: "Small casual evening at a coffee shop.", cost: "$200–350" },
      { title: "Listing Open House Upgrade", desc: "Elevate your own open house with snacks, buyer guides, and a lender partner on-site.", cost: "$150–250" },
      { title: "Partner Office Market Drop", desc: "Drop off market stats and co-branded one-pagers at lender or title offices.", cost: "$100–200" },
      { title: "Community Resource Table", desc: "Set up at a farmer’s market or community day.", cost: "$200–300" },
      { title: "First-Time Buyer Coffee Chat", desc: "Casual 30-min Q&A at a local café.", cost: "$150–250" },
      { title: "New Neighbor Welcome", desc: "Drop welcome packets in new neighborhoods.", cost: "$200–300" },
      { title: "Lender Co-Marketing Lunch", desc: "Bring lunch to your lender partner's team and preview an upcoming buyer event.", cost: "$200–300" },
      { title: "Homebuyer Info Table", desc: "Set up at a community event or church fair.", cost: "$150–250" }
    ],

    medium_client: [
      { title: "Ice Cream Social", desc: "Food truck or ice cream cart in a park or at your office.", cost: "$600–900" },
      { title: "Holiday Cookie Exchange", desc: "Clients bring cookies, you provide drinks, music & photos.", cost: "$550–850" },
      { title: "Small Movie Night", desc: "Rent a local theater or use an outdoor screen for clients + guests.", cost: "$700–1,000" },
      { title: "Client Appreciation Wine & Cheese", desc: "Evening gathering at a local venue with light appetizers.", cost: "$650–950" },
      { title: "Summer BBQ for Past Clients", desc: "Casual cookout with families invited.", cost: "$700–1,000" },
      { title: "Client Appreciation Happy Hour", desc: "Relaxed evening at a local bar or restaurant.", cost: "$600–850" },
      { title: "Fall Harvest Party", desc: "Pumpkin-themed event with food and games.", cost: "$650–900" },
      { title: "Client Appreciation Golf Outing", desc: "Small group golf outing for top clients.", cost: "$800–1,000" },
      { title: "Valentine’s Client Dinner", desc: "Nice dinner for couples who are past clients.", cost: "$700–950" },
      { title: "Client Appreciation Concert Night", desc: "Private box or small group at a local show.", cost: "$750–1,000" }
    ],
    medium_partner: [
      { title: "Happy Hour Education", desc: "Casual venue + 20-min talk on “Winning Offers in 2026” for fellow agents and lender partners.", cost: "$600–900" },
      { title: "Quarterly Partner Mastermind", desc: "Dinner + roundtable for your top 12–18 referral partners (agents, lenders, title).", cost: "$700–1,000" },
      { title: "Co-Broke Appreciation Lunch", desc: "Nice lunch for 15–20 fellow agents with neighborhood market updates.", cost: "$650–950" },
      { title: "Partner Golf Outing", desc: "Private golf day for top referring agents, lenders, and builders.", cost: "$800–1,000" },
      { title: "Lender Co-Marketing Wine Tasting", desc: "Private tasting with your lender partner — market discussion for agents and clients.", cost: "$650–900" },
      { title: "Partner Appreciation Dinner", desc: "Nice dinner for your top 10–15 referral sources.", cost: "$700–950" },
      { title: "Market Update Breakfast", desc: "Early morning neighborhood update with breakfast for partners and sphere.", cost: "$550–800" },
      { title: "Joint Client Appreciation Event", desc: "Co-host a small client event with your lender and 1–2 co-broke agents.", cost: "$700–950" },
      { title: "Partner Appreciation Cruise", desc: "Short evening cruise for top referral partners.", cost: "$800–1,000" },
      { title: "Partner Appreciation Happy Hour", desc: "Relaxed evening recognizing top referral partners.", cost: "$600–850" }
    ],
    medium_community: [
      { title: "Charity 5K Team + Pasta Dinner", desc: "Sponsor a team and host a pre-race dinner.", cost: "$650–950" },
      { title: "Big Back-to-School Drive", desc: "Partner with lender/title partners and a local school for a big drop-off event.", cost: "$550–850" },
      { title: "Community Shred + Resource Day", desc: "Combine shredding with homebuyer resources.", cost: "$600–900" },
      { title: "Charity Golf Outing Team", desc: "Sponsor a team at a local charity golf event.", cost: "$700–950" },
      { title: "Community Food Drive with Partners", desc: "Large collection with multiple partner offices (lender, title, co-broke).", cost: "$500–800" },
      { title: "Holiday Toy Drive Event", desc: "Big toy collection with a small celebration.", cost: "$600–850" },
      { title: "Community 5K Water Station", desc: "Big presence with branded items and water.", cost: "$550–800" },
      { title: "School Supply Drive Event", desc: "Large supply collection with school partnership.", cost: "$500–750" },
      { title: "Community Resource Fair Table", desc: "Large booth at a community fair with giveaways.", cost: "$600–850" },
      { title: "Charity 5K Title Sponsor", desc: "Bigger sponsorship with logo on shirts and banner.", cost: "$800–1,000" }
    ],
    medium_leads: [
      { title: "First-Time Buyer Seminar", desc: "Evening seminar (in-person or virtual) with light refreshments.", cost: "$600–900" },
      { title: "Open House Support Event", desc: "Host a mega open house on your listing with lender partner, food & buyer education.", cost: "$550–850" },
      { title: "Homebuyer Happy Hour", desc: "Casual evening event focused on first-time buyers.", cost: "$650–950" },
      { title: "First-Time Buyer Breakfast", desc: "Early morning seminar with coffee and education.", cost: "$550–800" },
      { title: "New Construction Tour", desc: "Bus or carpool tour of new construction communities.", cost: "$700–950" },
      { title: "Homebuyer Resource Night", desc: "Evening with lenders, inspectors, and title companies.", cost: "$600–850" },
      { title: "First-Time Buyer Workshop Series", desc: "Two-part series (credit + process).", cost: "$650–900" },
      { title: "Joint Buyer Event with Partners", desc: "Co-hosted buyer event with your lender partner and 1–2 co-broke agents.", cost: "$600–850" },
      { title: "First-Time Buyer Pizza Night", desc: "Casual evening seminar with pizza and Q&A.", cost: "$550–800" },
      { title: "Homebuyer Expo Table", desc: "Large presence at a local home show or expo.", cost: "$600–850" }
    ],

    premium_client: [
      { title: "Family Movie Night", desc: "Rent a local theater for past clients and their families.", cost: "$1,200–2,000" },
      { title: "Wine Tasting Night", desc: "Private wine tasting for clients + one guest.", cost: "$1,000–1,800" },
      { title: "Big Holiday Party", desc: "Nice venue with food, drinks, and a photographer.", cost: "$1,500+" },
      { title: "Client Appreciation Cruise or Bus Trip", desc: "Day trip or evening cruise for top clients.", cost: "$1,500+" },
      { title: "Client Appreciation Golf Outing", desc: "Private golf day for top 20–30 clients.", cost: "$1,800+" },
      { title: "Private Wine Dinner", desc: "Upscale multi-course dinner with wine pairings.", cost: "$1,500–2,500" },
      { title: "Client Appreciation Concert Night", desc: "Private box or small group at a concert.", cost: "$1,500+" },
      { title: "Luxury Client Appreciation Cruise", desc: "Short sunset cruise with dinner.", cost: "$1,800+" },
      { title: "Client Appreciation Sporting Event", desc: "Private suite at a game for top clients.", cost: "$2,000+" },
      { title: "Big Client Appreciation Gala", desc: "Large formal event with entertainment.", cost: "$2,500+" }
    ],
    premium_partner: [
      { title: "Premium Partner Mastermind Dinner", desc: "Nice dinner + high-value strategy session for top referral partners.", cost: "$1,200–2,000" },
      { title: "Sporting Event Suite", desc: "Private suite at a game for your best lender, title, and co-broke partners.", cost: "$1,500+" },
      { title: "High-End Partner Golf Outing", desc: "Private golf day for top referring agents, lenders, and builders.", cost: "$1,500+" },
      { title: "Partner Appreciation Cruise", desc: "Private sunset cruise for top referral partners.", cost: "$1,800+" },
      { title: "Luxury Mastermind Retreat", desc: "Half-day or full-day high-end experience with your A+ partner circle.", cost: "$2,000+" },
      { title: "Private Wine Tasting for Partners", desc: "Upscale tasting with market discussion for agents, lenders, and clients.", cost: "$1,200–1,800" },
      { title: "Partner Appreciation Concert", desc: "Private box or small group at a show for top referral sources.", cost: "$1,500+" },
      { title: "Premium Partner Dinner Series", desc: "Quarterly high-end dinners for top partners.", cost: "$1,800+" },
      { title: "Sporting Event Suite + Dinner", desc: "Game + private dinner for top referral partners.", cost: "$2,000+" },
      { title: "Luxury Partner Golf Scramble", desc: "Private tournament for top co-broke agents and lender partners.", cost: "$2,000+" }
    ],
    premium_community: [
      { title: "Major Charity 5K Activation", desc: "Big sponsorship + booth, shirts, and team dinner.", cost: "$1,200–2,000" },
      { title: "Large Community Give-Back Event", desc: "Big supply or toy drive with multiple partners and media.", cost: "$1,200–2,000" },
      { title: "Title Sponsor of Local Charity Event", desc: "Large sponsorship with speaking opportunity.", cost: "$2,000+" },
      { title: "Community 5K Title Sponsor", desc: "Big presence with shirts, banner, and booth.", cost: "$1,500–2,500" },
      { title: "Large Holiday Give-Back Event", desc: "Big toy or food drive with partners and media.", cost: "$1,500–2,000" },
      { title: "Charity Golf Tournament Title Sponsor", desc: "Large sponsorship with team and dinner.", cost: "$2,000+" },
      { title: "Community Resource Fair Title Sponsor", desc: "Large booth and speaking slot at a big fair.", cost: "$1,500+" },
      { title: "Major Back-to-School Event", desc: "Large supply giveaway with school partnership.", cost: "$1,500–2,000" },
      { title: "Charity Gala Table + Sponsorship", desc: "Table + sponsorship at a big local gala.", cost: "$1,800+" },
      { title: "Large Community Festival Booth", desc: "Big interactive booth at a major local event.", cost: "$1,200–1,800" }
    ],
    premium_leads: [
      { title: "Large Buyer Seminar Series", desc: "2–3 part series (in-person or virtual) with strong follow-up.", cost: "$1,000–1,800" },
      { title: "Big Multi-Partner Networking Night", desc: "Joint happy hour or dinner with lender, title, builder, and co-broke partners.", cost: "$1,200+" },
      { title: "First-Time Buyer Conference Style Event", desc: "Half-day event with multiple speakers and vendors.", cost: "$1,500+" },
      { title: "Large New Construction Tour", desc: "Bus tour of multiple new communities with lunch.", cost: "$1,500–2,500" },
      { title: "Premium Buyer Seminar with Partners", desc: "High-end evening seminar co-hosted with your lender partner.", cost: "$1,200–1,800" },
      { title: "Large Homebuyer Resource Night", desc: "Big evening with lenders, inspectors, title, etc.", cost: "$1,000–1,600" },
      { title: "Multi-Partner First-Time Buyer Expo", desc: "Large event with lender, inspector, title, and co-broke partners.", cost: "$1,500+" },
      { title: "Premium Buyer Breakfast Series", desc: "Quarterly high-end breakfast seminars.", cost: "$1,200–1,800" },
      { title: "Large New Home Tour Event", desc: "Private tour of new construction with partners.", cost: "$1,500–2,000" },
      { title: "Big Buyer Appreciation Night", desc: "Large networking night for potential buyers.", cost: "$1,200–1,800" }
    ]
  };

  function suggestEvents() {
    const budget = document.getElementById('event-budget').value;
    const goal = document.getElementById('event-goal').value;
    const container = document.getElementById('event-suggestions');
    const button = document.getElementById('event-idea-btn');

    const key = `${budget}_${goal}`;
    const pool = eventIdeaPool[key] || [];

    if (pool.length === 0) {
      container.innerHTML = `<p class="text-red-500">No ideas found for this combination.</p>`;
      container.classList.remove('hidden');
      return;
    }

    // Shuffle and pick 2-3 different ideas
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);

    let html = `<div class="mt-4 grid gap-4">`;
    selected.forEach((idea, idx) => {
      const safeTitle = idea.title.replace(/'/g, "\\'");
      const safeDesc = (idea.desc + ' | Suggested budget: ' + idea.cost).replace(/'/g, "\\'");
      html += `
        <div class="border border-gray-200 dark:border-gray-600 rounded-2xl p-5 bg-white dark:bg-gray-800">
          <div class="flex justify-between items-start">
            <h5 class="font-semibold text-lg">${idea.title}</h5>
            <span class="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">${idea.cost}</span>
          </div>
          <p class="text-sm mt-2 text-gray-600 dark:text-gray-300">${idea.desc}</p>
          
          <div class="mt-4 flex gap-2">
            <button onclick="if (typeof window.toggleSaveIdea === 'function') { window.toggleSaveIdea('${safeTitle}', '${safeDesc}', this, 'event'); } else { window.saveNotReady(); }" 
                    class="flex-1 text-sm px-4 py-2 bg-[#00A89D] hover:bg-[#008f85] text-white rounded-xl font-medium flex items-center justify-center gap-2 transition">
              <i class="fas fa-bookmark"></i> 
              <span>Save Idea</span>
            </button>
            <button onclick="navigator.clipboard.writeText('${safeTitle} — ${idea.desc} (Budget: ${idea.cost}').then(() => { this.innerHTML = 'Copied!'; setTimeout(() => { if(this) this.innerHTML = 'Copy'; }, 1400); })" 
                    class="text-sm px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-medium">
              Copy
            </button>
          </div>
        </div>`;
    });
    html += `</div>`;
    html += `<p class="text-xs text-gray-500 mt-2">Showing 3 of 10 ideas. Click "Get Different Ideas" for more options. Saved ideas appear in your global Saved library.</p>`;

    container.innerHTML = html;
    container.classList.remove('hidden');

    // Change button text so user knows they can generate again
    if (button) {
      button.innerHTML = "Get Different Ideas";
    }
  }

  window.suggestEvents = suggestEvents;

  // =====================================================
  // EVENT TEMPLATES COPY FUNCTION
  // =====================================================
  function copyTemplate(button) {
    const templateDiv = button.closest('div');
    const textElement = templateDiv.querySelector('p');
    if (!textElement) return;

    const textToCopy = textElement.textContent.trim();

    navigator.clipboard.writeText(textToCopy).then(() => {
      const originalText = button.innerHTML;
      button.innerHTML = 'Copied!';
      button.disabled = true;

      setTimeout(() => {
        button.innerHTML = originalText;
        button.disabled = false;
      }, 1600);
    }).catch(() => {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);

      const originalText = button.innerHTML;
      button.innerHTML = 'Copied!';
      setTimeout(() => {
        button.innerHTML = originalText;
      }, 1600);
    });
  }

  window.copyTemplate = copyTemplate;

  // =====================================================
  // EVENT TYPE MODALS
  // =====================================================
  function openEventModal(type) {
    try {
      let modal = document.getElementById('modal-' + type);
      if (!modal) modal = document.querySelector('#modal-' + type);
      if (!modal) modal = document.querySelector('[id*="modal-' + type + '"]');

      if (modal) {
        if (typeof window.openNamedModal === 'function') {
          window.openNamedModal(modal);
        } else {
          modal.classList.remove('hidden');
          modal.classList.add('flex');
          modal.style.display = 'flex';
          modal.style.zIndex = '9999';
          modal.style.pointerEvents = 'auto';
          document.body.classList.add('modal-open');
        }
        if (typeof window.ensureModalBackdropClose === 'function') {
          window.ensureModalBackdropClose(modal);
        }
        return;
      }

      // Rich fallback with actual content (matching static modals)
      const contentMap = {
        'client-appreciation': `
          <div class="mb-3"><span class="inline-block px-3 py-1 text-xs font-bold rounded-full bg-[#F15A29]/10 text-[#F15A29]">CLIENT APPRECIATION</span></div>
          <h3 class="text-2xl font-bold mb-2">Client Appreciation Events</h3>
          <p class="text-base text-gray-600 dark:text-gray-300">Turn past clients into lifelong raving fans who actively send you referrals.</p>
          <div class="mt-4 p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl">
            <div class="font-semibold text-[#00A89D] text-sm mb-1">Why This Works So Well</div>
            <p class="text-sm">These events feel like a genuine thank-you. Clients bring guests (+1), creating natural lead flow while you stay top-of-mind positively.</p>
          </div>
          <div class="mt-4 p-4 bg-[#F15A29]/5 border-l-4 border-[#F15A29] rounded-r-2xl">
            <div class="font-semibold text-sm mb-1 text-[#F15A29]">Pro Tips</div>
            <ul class="text-sm space-y-1 mt-1">
              <li>Always allow +1 guests</li>
              <li>Take lots of photos for social proof</li>
              <li>Send personal thank-you within 48 hours</li>
            </ul>
          </div>`,
        'partner-mastermind': `
          <div class="mb-3"><span class="inline-block px-3 py-1 text-xs font-bold rounded-full bg-[#00A89D]/10 text-[#00A89D]">PARTNER MASTERMIND</span></div>
          <h3 class="text-2xl font-bold mb-2">Partner Mastermind Events</h3>
          <p class="text-base text-gray-600 dark:text-gray-300">Host small-group sessions that deepen lender and fellow-agent relationships while positioning you as the go-to agent in your market.</p>
          <div class="mt-4 p-4 bg-[#F15A29]/5 border border-[#F15A29]/20 rounded-2xl">
            <div class="font-semibold text-[#F15A29] text-sm mb-1">Why This Format Wins</div>
            <p class="text-sm">Partners crave education and peer connection. When you host the room, you become the connector they remember when clients need an agent.</p>
          </div>
          <div class="mt-4 p-4 bg-[#00A89D]/5 border-l-4 border-[#00A89D] rounded-r-2xl">
            <div class="font-semibold text-sm mb-1 text-[#00A89D]">Execution Tips</div>
            <ul class="text-sm space-y-1 mt-1">
              <li>Keep sessions 60–90 min</li>
              <li>End with a soft ask</li>
              <li>Send recap with market stats</li>
            </ul>
          </div>`,
        'social-networking': `
          <div class="mb-3"><span class="inline-block px-3 py-1 text-xs font-bold rounded-full bg-[#002B5C]/10 text-[#002B5C]">NETWORKING & COMMUNITY</span></div>
          <h3 class="text-2xl font-bold mb-2">Social & Community Events</h3>
          <p class="text-base text-gray-600 dark:text-gray-300">Meet new people, stay visible, and generate authentic content without feeling salesy.</p>
          <div class="mt-4 p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl">
            <div class="font-semibold text-[#00A89D] text-sm mb-1">Why These Events Work</div>
            <p class="text-sm">People remember who consistently shows up for the community. Low-pressure visibility builds real trust and referrals over time.</p>
          </div>
          <div class="mt-4">
            <div class="text-sm font-semibold mb-2">Great Formats</div>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div class="bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded">Happy Hour</div>
              <div class="bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded">Charity 5K / Golf Team</div>
              <div class="bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded">Trivia or Pickleball Night</div>
              <div class="bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded">Drives & Local Events</div>
            </div>
          </div>
          <div class="mt-4 p-4 bg-[#F15A29]/5 border-l-4 border-[#F15A29] rounded-r-2xl">
            <div class="font-semibold text-sm mb-1 text-[#F15A29]">Pro Tips</div>
            <ul class="text-sm space-y-1 mt-1">
              <li>Be genuinely helpful — don’t lead with business</li>
              <li>Take photos (with permission) for social proof</li>
              <li>Follow up personally within 48 hours</li>
            </ul>
          </div>`,
        'community-charity': `
          <div class="mb-3"><span class="inline-block px-3 py-1 text-xs font-bold rounded-full bg-[#00A89D]/10 text-[#00A89D]">COMMUNITY IMPACT</span></div>
          <h3 class="text-2xl font-bold mb-2">Community & Charity Events</h3>
          <p class="text-base text-gray-600 dark:text-gray-300">Build real local reputation while creating excellent, authentic content and goodwill.</p>
          <div class="mt-4 p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl">
            <div class="font-semibold text-[#00A89D] text-sm mb-1">Why These Events Work</div>
            <p class="text-sm">People remember who shows up for the community. These give you real content and position you as someone who cares about the area.</p>
          </div>
          <div class="mt-4">
            <div class="text-sm font-semibold mb-2">Strong Plays</div>
            <div class="grid grid-cols-1 gap-2 text-sm">
              <div class="bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded">Youth sports sponsorship</div>
              <div class="bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded">Food/clothing drives</div>
              <div class="bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded">5K or golf outing title sponsor</div>
              <div class="bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded">Back-to-school drives with schools</div>
            </div>
          </div>
          <div class="mt-4 p-4 bg-[#F15A29]/5 border-l-4 border-[#F15A29] rounded-r-2xl">
            <div class="font-semibold text-sm mb-1 text-[#F15A29]">Pro Tips</div>
            <ul class="text-sm space-y-1 mt-1">
              <li>Partner with fellow agents, local businesses, or lender partners — share cost & spotlight</li>
              <li>Take lots of photos and post them</li>
              <li>Use the event as content for weeks afterward</li>
            </ul>
          </div>`
      };
      const guideContent = contentMap[type] || `<p>Guide content for this event type.</p>`;
      const fb = document.createElement('div');
      fb.className = 'fixed inset-0 bg-black/60 flex items-center justify-center p-4';
      fb.style.zIndex = '9999';
      fb.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-3xl max-w-2xl w-full p-8 shadow-2xl" onclick="event.stopImmediatePropagation()">
          <button onclick="this.closest('.fixed').remove()" class="float-right text-3xl text-gray-400 hover:text-gray-600 leading-none">&times;</button>
          ${guideContent}
          <div class="mt-6 text-right"><button onclick="this.closest('.fixed').remove()" class="px-5 py-2 bg-[#00A89D] text-white rounded-2xl text-sm">Close</button></div>
        </div>`;
      document.body.appendChild(fb);
    } catch (e) { console.error('[Event] openEventModal (value-vault.js) error', e); }
  }

  function closeEventModal(type) {
    try {
      let modal = document.getElementById('modal-' + type);
      if (!modal) modal = document.querySelector('#modal-' + type);
      if (modal) {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
        modal.style.display = 'none';
      }
    } catch (e) {}
  }

  window.openEventModal = openEventModal;
  window.closeEventModal = closeEventModal;

  // =====================================================
  // MAIN INIT
  // =====================================================
  function initValueVault() {
    const vault = document.getElementById('value-vault');
    if (!vault) {
      console.log('%c[value-vault.js] Value Vault section not found', 'color:#666');
      return;
    }

    // Only run enhancements once
    if (vault.dataset.vaultEnhanced === 'true') return;
    vault.dataset.vaultEnhanced = 'true';

    attachCopyButtons();
    initSearch();
    wirePillarCards();
    initExpandCollapse();
    initPhase3Features();   // Favorites + Idea of the Day

    console.log('%c[value-vault.js] Value Vault enhancements initialized (search, copy, expand/collapse, favorites, idea of the day)', 'color:#00A89D');
  }

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initValueVault);
  } else {
    initValueVault();
  }

  // Re-init when the Value Vault section is shown via navigation (handles SPA-style section switching)
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href="#value-vault"]');
    if (link) {
      setTimeout(() => {
        const vault = document.getElementById('value-vault');
        if (vault && !vault.classList.contains('hidden')) {
          initValueVault();
        }
      }, 50);
    }
  });

  // Expose for manual re-init if needed
  window.initValueVault = initValueVault;
  window.showRandomIdea = showRandomIdea;
  window.closeIdeaModal = closeIdeaModal;

  // Robust global attachment for the Idea of the Day toolbar button
  // (This runs regardless of whether the #value-vault section is present at load time)
  function attachIdeaOfTheDayButton() {
    const ideaBtn = document.getElementById('idea-of-the-day-btn');
    if (ideaBtn && !ideaBtn.dataset.ideaListenerAttached) {
      ideaBtn.dataset.ideaListenerAttached = 'true';
      ideaBtn.addEventListener('click', () => {
        if (typeof window.showRandomIdea === 'function') {
          window.showRandomIdea();
        } else if (typeof showRandomIdea === 'function') {
          showRandomIdea();
        }
      });
    }
  }

  // Attach immediately if DOM is ready, otherwise on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachIdeaOfTheDayButton);
  } else {
    attachIdeaOfTheDayButton();
  }

  // Also try again after a short delay (in case of late rendering or SPA navigation)
  setTimeout(attachIdeaOfTheDayButton, 1200);

})();
