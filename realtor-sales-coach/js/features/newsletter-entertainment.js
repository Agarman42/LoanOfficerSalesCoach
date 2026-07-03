/**
 * Newsletter entertainment: Dad Jokes + Brain Teaser (trivia / scramble / riddle).
 * Loaded before newsletter-generator.js; exposes window.NlEntertainment.
 */
(function () {
  'use strict';

  const PUZZLE_TYPES = {
    trivia: { label: 'Trivia', heading: 'Trivia Time', storageKey: 'usedNlTrivia', selectedKey: 'selectedNlTrivia' },
    scramble: { label: 'Word Scramble', heading: 'Word Scramble', storageKey: 'usedNlScrambles', selectedKey: 'selectedNlScramble' },
    riddle: { label: 'Riddle', heading: 'Riddle of the Week', storageKey: 'usedNlRiddles', selectedKey: 'selectedNlRiddle' }
  };

  const dadJokes = window.NEWSLETTER_DAD_JOKES || [];
  const triviaItems = window.NEWSLETTER_TRIVIA || [];
  const scrambleItems = window.NEWSLETTER_SCRAMBLES || [];
  const riddleItems = window.NEWSLETTER_RIDDLES || [];

  let usedDadJokes = [];
  let usedTrivia = [];
  let usedScrambles = [];
  let usedRiddles = [];

  let selectedDadJoke = '';
  let selectedTrivia = null;
  let selectedScramble = null;
  let selectedRiddle = null;
  let nlPuzzleType = 'trivia';
  let nlPuzzleTopicFilter = 'all';
  let nlPuzzleCategoryFilter = 'all';
  let dadJokeIsCustom = false;

  const CUSTOM_PUZZLE_IDS = {
    trivia: 'custom-trivia',
    scramble: 'custom-scramble',
    riddle: 'custom-riddle'
  };

  const MORTGAGE_TAG_HINTS = ['mortgage', 'home', 'homeownership', 'realestate', 'realtor', 'lending', 'homebuying'];
  const MORTGAGE_CATEGORY_HINTS = ['mortgage', 'home', 'real estate', 'homeownership', 'lending'];

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getPuzzleList(type) {
    if (type === 'trivia') return triviaItems;
    if (type === 'scramble') return scrambleItems;
    if (type === 'riddle') return riddleItems;
    return [];
  }

  function isMortgageRelated(item) {
    if (!item) return false;
    if (item.topic === 'mortgage') return true;
    const tags = (item.tags || []).map((t) => String(t).toLowerCase());
    if (tags.some((t) => MORTGAGE_TAG_HINTS.includes(t))) return true;
    const cat = String(item.category || '').toLowerCase();
    if (MORTGAGE_CATEGORY_HINTS.some((hint) => cat.includes(hint))) return true;
    return false;
  }

  function itemMatchesTopicFilter(item, topicFilter) {
    if (!topicFilter || topicFilter === 'all') return true;
    if (topicFilter === 'mortgage') return isMortgageRelated(item);
    return true;
  }

  function itemMatchesCategoryFilter(item, categoryFilter, type) {
    if (type !== 'trivia' || !categoryFilter || categoryFilter === 'all') return true;
    return String(item.category || '') === categoryFilter;
  }

  function filterPuzzleItems(list, type, topicFilter, categoryFilter) {
    const topic = topicFilter || nlPuzzleTopicFilter;
    const category = categoryFilter != null ? categoryFilter : nlPuzzleCategoryFilter;
    return (list || []).filter(
      (item) => itemMatchesTopicFilter(item, topic) && itemMatchesCategoryFilter(item, category, type)
    );
  }

  /** Topic/category filters apply to trivia & scrambles only — not riddles or dad jokes. */
  function puzzleTypeSupportsFilters(type) {
    return type === 'trivia' || type === 'scramble';
  }

  function getFilteredPuzzleList(type, topicFilter, categoryFilter) {
    if (!puzzleTypeSupportsFilters(type)) return getPuzzleList(type);
    return filterPuzzleItems(getPuzzleList(type), type, topicFilter, categoryFilter);
  }

  function getTriviaCategories() {
    const cats = new Set();
    triviaItems.forEach((item) => {
      if (item.category) cats.add(item.category);
    });
    return Array.from(cats).sort((a, b) => a.localeCompare(b));
  }

  function getTopicFilterLabel(topic) {
    if (topic === 'mortgage') return 'Real Estate & Home';
    return 'All topics';
  }

  function isCustomPuzzleItem(item) {
    return !!(item && (item.custom === true || String(item.id || '').startsWith('custom')));
  }

  function isCustomDadJokeActive() {
    return dadJokeIsCustom || (selectedDadJoke && !dadJokes.includes(selectedDadJoke));
  }

  function customPreviewBadge() {
    return '<span class="inline-block text-[10px] px-2 py-0.5 mb-2 rounded-full bg-[#F15A29]/10 text-[#F15A29] font-semibold">Your custom</span>';
  }

  function scrambleLetters(word) {
    const letters = String(word || '').toUpperCase().replace(/[^A-Z]/g, '').split('');
    if (letters.length < 2) return letters.join('');
    const orig = letters.join('');
    for (let i = 0; i < 24; i += 1) {
      for (let j = letters.length - 1; j > 0; j -= 1) {
        const k = Math.floor(Math.random() * (j + 1));
        [letters[j], letters[k]] = [letters[k], letters[j]];
      }
      const out = letters.join('');
      if (out !== orig) return out;
    }
    return orig.split('').reverse().join('');
  }

  function persistCustomDrafts() {
    const dadInput = document.getElementById('nl-custom-dadjoke-input');
    if (dadInput) localStorage.setItem('nl-custom-dadjoke-draft', dadInput.value);
    const fields = [
      ['nl-custom-trivia-question', 'nl-custom-trivia-question-draft'],
      ['nl-custom-trivia-answer', 'nl-custom-trivia-answer-draft'],
      ['nl-custom-scramble-prompt', 'nl-custom-scramble-prompt-draft'],
      ['nl-custom-scramble-answer', 'nl-custom-scramble-answer-draft'],
      ['nl-custom-scramble-letters', 'nl-custom-scramble-letters-draft'],
      ['nl-custom-scramble-hint', 'nl-custom-scramble-hint-draft'],
      ['nl-custom-riddle-text', 'nl-custom-riddle-text-draft'],
      ['nl-custom-riddle-answer', 'nl-custom-riddle-answer-draft']
    ];
    fields.forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (el) localStorage.setItem(key, el.value);
    });
    localStorage.setItem('nl-dadjoke-custom', dadJokeIsCustom ? '1' : '0');
  }

  function loadCustomDrafts() {
    const setVal = (id, key) => {
      const el = document.getElementById(id);
      if (el) el.value = localStorage.getItem(key) || '';
    };
    setVal('nl-custom-dadjoke-input', 'nl-custom-dadjoke-draft');
    setVal('nl-custom-trivia-question', 'nl-custom-trivia-question-draft');
    setVal('nl-custom-trivia-answer', 'nl-custom-trivia-answer-draft');
    setVal('nl-custom-scramble-prompt', 'nl-custom-scramble-prompt-draft');
    setVal('nl-custom-scramble-answer', 'nl-custom-scramble-answer-draft');
    setVal('nl-custom-scramble-letters', 'nl-custom-scramble-letters-draft');
    setVal('nl-custom-scramble-hint', 'nl-custom-scramble-hint-draft');
    setVal('nl-custom-riddle-text', 'nl-custom-riddle-text-draft');
    setVal('nl-custom-riddle-answer', 'nl-custom-riddle-answer-draft');
    dadJokeIsCustom = localStorage.getItem('nl-dadjoke-custom') === '1';
  }

  function syncCustomPuzzleFieldsUI() {
    const type = getActivePuzzleType();
    const label = document.getElementById('nl-custom-puzzle-type-label');
    if (label) label.textContent = (PUZZLE_TYPES[type]?.label || type).toLowerCase();
    ['trivia', 'scramble', 'riddle'].forEach((t) => {
      const block = document.getElementById(`nl-custom-fields-${t}`);
      if (block) block.classList.toggle('hidden', t !== type);
    });
  }

  function syncCustomFormsFromSelection() {
    if (isCustomDadJokeActive() && selectedDadJoke) {
      const dadInput = document.getElementById('nl-custom-dadjoke-input');
      if (dadInput && !dadInput.value.trim()) dadInput.value = selectedDadJoke;
    }
    const type = getActivePuzzleType();
    const item = getSelectedPuzzle(type);
    if (!isCustomPuzzleItem(item)) return;
    if (type === 'trivia') {
      const q = document.getElementById('nl-custom-trivia-question');
      const a = document.getElementById('nl-custom-trivia-answer');
      if (q) q.value = item.question || '';
      if (a) a.value = item.answer || '';
    } else if (type === 'scramble') {
      const p = document.getElementById('nl-custom-scramble-prompt');
      const l = document.getElementById('nl-custom-scramble-letters');
      const a = document.getElementById('nl-custom-scramble-answer');
      const h = document.getElementById('nl-custom-scramble-hint');
      if (p) p.value = item.prompt || '';
      if (l) l.value = item.scrambled || '';
      if (a) a.value = item.answer || '';
      if (h) h.value = item.hint || '';
    } else if (type === 'riddle') {
      const r = document.getElementById('nl-custom-riddle-text');
      const a = document.getElementById('nl-custom-riddle-answer');
      if (r) r.value = item.riddle || '';
      if (a) a.value = item.answer || '';
    }
    persistCustomDrafts();
  }

  function applyCustomDadJoke() {
    const input = document.getElementById('nl-custom-dadjoke-input');
    const text = (input?.value || '').trim();
    if (!text) {
      window.notifyUser('Please type a joke first.', 'warning', 3200);
      return;
    }
    selectedDadJoke = text;
    dadJokeIsCustom = true;
    persistCustomDrafts();
    persistUsed();
    updatePreviews();
  }

  function applyCustomPuzzle() {
    const type = getActivePuzzleType();
    let item = null;
    if (type === 'trivia') {
      const question = (document.getElementById('nl-custom-trivia-question')?.value || '').trim();
      const answer = (document.getElementById('nl-custom-trivia-answer')?.value || '').trim();
      if (!question || !answer) {
        window.notifyUser('Please enter both a trivia question and answer.', 'warning', 3200);
        return;
      }
      item = {
        id: CUSTOM_PUZZLE_IDS.trivia,
        custom: true,
        question,
        answer,
        category: 'Custom',
        tags: ['custom']
      };
    } else if (type === 'scramble') {
      const prompt = (document.getElementById('nl-custom-scramble-prompt')?.value || '').trim();
      const answer = (document.getElementById('nl-custom-scramble-answer')?.value || '').trim();
      let scrambled = (document.getElementById('nl-custom-scramble-letters')?.value || '').trim().toUpperCase();
      const hint = (document.getElementById('nl-custom-scramble-hint')?.value || '').trim();
      if (!prompt || !answer) {
        window.notifyUser('Please enter a prompt and the unscrambled answer.', 'warning', 3200);
        return;
      }
      if (!scrambled) scrambled = scrambleLetters(answer);
      const lettersEl = document.getElementById('nl-custom-scramble-letters');
      if (lettersEl) lettersEl.value = scrambled;
      item = {
        id: CUSTOM_PUZZLE_IDS.scramble,
        custom: true,
        prompt,
        scrambled,
        answer,
        hint,
        category: 'Custom',
        tags: ['custom']
      };
    } else {
      const riddle = (document.getElementById('nl-custom-riddle-text')?.value || '').trim();
      const answer = (document.getElementById('nl-custom-riddle-answer')?.value || '').trim();
      if (!riddle || !answer) {
        window.notifyUser('Please enter both the riddle and its answer.', 'warning', 3200);
        return;
      }
      item = {
        id: CUSTOM_PUZZLE_IDS.riddle,
        custom: true,
        riddle,
        answer,
        category: 'Custom',
        tags: ['custom']
      };
    }
    setSelectedPuzzle(type, item);
    persistCustomDrafts();
    persistUsed();
    updatePreviews();
  }

  function restoreSelectedPuzzle(type, saved) {
    if (!saved) return;
    if (isCustomPuzzleItem(saved)) {
      setSelectedPuzzle(type, saved);
      return;
    }
    const list = getPuzzleList(type);
    if (list.some((entry) => entry.id === saved.id)) setSelectedPuzzle(type, saved);
  }

  function getUsedIds(type) {
    if (type === 'trivia') return usedTrivia;
    if (type === 'scramble') return usedScrambles;
    if (type === 'riddle') return usedRiddles;
    return [];
  }

  function setUsedIds(type, ids) {
    if (type === 'trivia') usedTrivia = ids;
    else if (type === 'scramble') usedScrambles = ids;
    else if (type === 'riddle') usedRiddles = ids;
  }

  function getSelectedPuzzle(type) {
    if (type === 'trivia') return selectedTrivia;
    if (type === 'scramble') return selectedScramble;
    if (type === 'riddle') return selectedRiddle;
    return null;
  }

  function setSelectedPuzzle(type, item) {
    if (type === 'trivia') selectedTrivia = item;
    else if (type === 'scramble') selectedScramble = item;
    else if (type === 'riddle') selectedRiddle = item;
  }

  function getRandomString(list, used) {
    if (!list.length) return '';
    if (used.length >= list.length) used.length = 0;
    let item;
    let guard = 0;
    do {
      item = list[Math.floor(Math.random() * list.length)];
      guard += 1;
    } while (used.includes(item) && guard < list.length * 3);
    if (!used.includes(item)) used.push(item);
    return item;
  }

  function getRandomObject(list, usedIds) {
    if (!list.length) return null;
    if (usedIds.length >= list.length) usedIds.length = 0;
    const available = list.filter((item) => !usedIds.includes(item.id));
    const pool = available.length ? available : list;
    const item = pool[Math.floor(Math.random() * pool.length)];
    if (item && !usedIds.includes(item.id)) usedIds.push(item.id);
    return item;
  }

  function persistUsed() {
    localStorage.setItem('usedDadJokes', JSON.stringify(usedDadJokes));
    localStorage.setItem('usedNlTrivia', JSON.stringify(usedTrivia));
    localStorage.setItem('usedNlScrambles', JSON.stringify(usedScrambles));
    localStorage.setItem('usedNlRiddles', JSON.stringify(usedRiddles));
    localStorage.setItem('nl-puzzle-type', nlPuzzleType);
    localStorage.setItem('nl-puzzle-topic-filter', nlPuzzleTopicFilter);
    localStorage.setItem('nl-puzzle-category-filter', nlPuzzleCategoryFilter);
    if (selectedDadJoke) localStorage.setItem('selectedDadJoke', selectedDadJoke);
    if (selectedTrivia) localStorage.setItem('selectedNlTrivia', JSON.stringify(selectedTrivia));
    if (selectedScramble) localStorage.setItem('selectedNlScramble', JSON.stringify(selectedScramble));
    if (selectedRiddle) localStorage.setItem('selectedNlRiddle', JSON.stringify(selectedRiddle));
    persistCustomDrafts();
  }

  function loadState() {
    usedDadJokes = JSON.parse(localStorage.getItem('usedDadJokes') || '[]');
    usedTrivia = JSON.parse(localStorage.getItem('usedNlTrivia') || '[]');
    usedScrambles = JSON.parse(localStorage.getItem('usedNlScrambles') || '[]');
    usedRiddles = JSON.parse(localStorage.getItem('usedNlRiddles') || '[]');
    nlPuzzleType = localStorage.getItem('nl-puzzle-type') || 'trivia';
    if (!PUZZLE_TYPES[nlPuzzleType]) nlPuzzleType = 'trivia';
    nlPuzzleTopicFilter = localStorage.getItem('nl-puzzle-topic-filter') || 'all';
    if (!['all', 'mortgage'].includes(nlPuzzleTopicFilter)) nlPuzzleTopicFilter = 'all';
    nlPuzzleCategoryFilter = localStorage.getItem('nl-puzzle-category-filter') || 'all';

    dadJokeIsCustom = localStorage.getItem('nl-dadjoke-custom') === '1';

    try {
      const savedJoke = localStorage.getItem('selectedDadJoke');
      if (savedJoke && (dadJokeIsCustom || dadJokes.includes(savedJoke))) selectedDadJoke = savedJoke;
    } catch (e) { /* ignore */ }

    try {
      restoreSelectedPuzzle('trivia', JSON.parse(localStorage.getItem('selectedNlTrivia') || 'null'));
    } catch (e) { /* ignore */ }
    try {
      restoreSelectedPuzzle('scramble', JSON.parse(localStorage.getItem('selectedNlScramble') || 'null'));
    } catch (e) { /* ignore */ }
    try {
      restoreSelectedPuzzle('riddle', JSON.parse(localStorage.getItem('selectedNlRiddle') || 'null'));
    } catch (e) { /* ignore */ }

    if (!selectedDadJoke && dadJokes.length) selectedDadJoke = getRandomString(dadJokes, usedDadJokes);
    if (!selectedTrivia && triviaItems.length) selectedTrivia = getRandomObject(triviaItems, usedTrivia);
    if (!selectedScramble && scrambleItems.length) selectedScramble = getRandomObject(scrambleItems, usedScrambles);
    if (!selectedRiddle && riddleItems.length) selectedRiddle = getRandomObject(riddleItems, usedRiddles);

    persistUsed();
  }

  function getActivePuzzleType() {
    const checked = document.querySelector('input[name="nl-puzzle-type"]:checked');
    return (checked && checked.value) || nlPuzzleType || 'trivia';
  }

  function syncPuzzleTypeFromUI() {
    nlPuzzleType = getActivePuzzleType();
    localStorage.setItem('nl-puzzle-type', nlPuzzleType);
  }

  function formatSetupAnswerBlock(type, item) {
    const answerText = buildAnswerLine(type, item);
    if (!answerText) return '';
    const answerOnly = answerText.replace(/^Answer:\s*/i, '');
    return `<div class="mt-3 pt-3 border-t border-dashed border-gray-300 dark:border-gray-600">
      <p class="text-sm m-0"><strong>Answer:</strong> <span class="text-[#002B5C] dark:text-white font-semibold">${escapeHtml(answerOnly)}</span></p>
      <p class="text-xs text-gray-500 mt-1 mb-0">Shown here so you can review before generating. Subscribers only see it in fine print at the bottom of the newsletter.</p>
    </div>`;
  }

  function formatPuzzlePreview(type, item) {
    if (!item) return 'No item matches your filters — try <strong>All topics</strong> or a different category.';
    const meta = [];
    if (isCustomPuzzleItem(item)) meta.push('Your custom');
    else if (item.category && item.category !== 'General') meta.push(escapeHtml(item.category));
    if (!isCustomPuzzleItem(item) && puzzleTypeSupportsFilters(type) && isMortgageRelated(item)) meta.push('Real Estate & Home');
    const metaLine = meta.length
      ? `<p class="text-xs text-[#00A89D] font-medium mb-2">${meta.join(' · ')}</p>`
      : '';
    const answerBlock = formatSetupAnswerBlock(type, item);
    if (type === 'trivia') {
      return `${metaLine}<strong>Type:</strong> Trivia<br><strong>Q:</strong> ${escapeHtml(item.question)}${answerBlock}`;
    }
    if (type === 'scramble') {
      const hint = item.hint ? `<br><strong>Hint:</strong> ${escapeHtml(item.hint)}` : '';
      return `${metaLine}<strong>Type:</strong> Word Scramble<br>${escapeHtml(item.prompt)}<br><strong>Letters:</strong> <span style="letter-spacing:0.15em;font-weight:700;">${escapeHtml(item.scrambled)}</span>${hint}${answerBlock}`;
    }
    return `${metaLine}<strong>Type:</strong> Riddle<br>${escapeHtml(item.riddle)}${answerBlock}`;
  }

  function updateFilterCountUI() {
    const countEl = document.getElementById('nl-puzzle-filter-count');
    const categoryWrap = document.getElementById('nl-puzzle-category-wrap');
    const filterPanel = document.getElementById('nl-puzzle-filter-panel');
    const riddleHint = document.getElementById('nl-puzzle-riddle-hint');
    const type = getActivePuzzleType();
    const supportsFilters = puzzleTypeSupportsFilters(type);
    const filtered = getFilteredPuzzleList(type);
    const total = getPuzzleList(type).length;
    const mortgageCount = supportsFilters
      ? filterPuzzleItems(getPuzzleList(type), type, 'mortgage', 'all').length
      : 0;

    if (filterPanel) filterPanel.classList.toggle('hidden', !supportsFilters);
    if (riddleHint) riddleHint.classList.toggle('hidden', type !== 'riddle');

    if (countEl && supportsFilters) {
      const parts = [`${filtered.length} of ${total} ${PUZZLE_TYPES[type].label.toLowerCase()} items`];
      if (nlPuzzleTopicFilter === 'mortgage') parts.push('mortgage/home only');
      if (type === 'trivia' && nlPuzzleCategoryFilter !== 'all') parts.push(nlPuzzleCategoryFilter);
      countEl.textContent = parts.join(' · ');
    }

    if (categoryWrap) {
      categoryWrap.classList.toggle('hidden', type !== 'trivia');
    }

    document.querySelectorAll('[data-nl-topic]').forEach((btn) => {
      const active = btn.getAttribute('data-nl-topic') === nlPuzzleTopicFilter;
      btn.classList.toggle('border-[#00A89D]', active);
      btn.classList.toggle('bg-[#00A89D]/10', active);
      btn.classList.toggle('text-[#002B5C]', active);
      btn.classList.toggle('border-gray-200', !active);
      btn.classList.toggle('dark:border-gray-700', !active);
      btn.classList.toggle('text-gray-600', !active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    const mortgageBtn = document.querySelector('[data-nl-topic="mortgage"]');
    if (mortgageBtn) {
      mortgageBtn.title = `${mortgageCount} mortgage/home item${mortgageCount === 1 ? '' : 's'} available for ${PUZZLE_TYPES[type].label.toLowerCase()}`;
    }
  }

  function syncCategorySelectOptions() {
    const select = document.getElementById('nl-puzzle-category-select');
    if (!select) return;
    const current = nlPuzzleCategoryFilter || 'all';
    const categories = getTriviaCategories();
    select.innerHTML = '<option value="all">All categories</option>';
    categories.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      select.appendChild(opt);
    });
    select.value = categories.includes(current) || current === 'all' ? current : 'all';
    if (select.value !== current) {
      nlPuzzleCategoryFilter = select.value;
      persistUsed();
    }
  }

  function ensureSelectionMatchesFilters() {
    const type = getActivePuzzleType();
    const filtered = getFilteredPuzzleList(type);
    const current = getSelectedPuzzle(type);
    if (!filtered.length) {
      setSelectedPuzzle(type, null);
      return;
    }
    if (current && isCustomPuzzleItem(current)) return;
    if (!current || !filtered.some((item) => item.id === current.id)) {
      setSelectedPuzzle(type, getRandomObject(filtered, getUsedIds(type)));
      persistUsed();
    }
  }

  function setTopicFilter(topic) {
    nlPuzzleTopicFilter = topic || 'all';
    persistUsed();
    ensureSelectionMatchesFilters();
    updateFilterCountUI();
    updatePreviews();
  }

  function setCategoryFilter(category) {
    nlPuzzleCategoryFilter = category || 'all';
    persistUsed();
    ensureSelectionMatchesFilters();
    updateFilterCountUI();
    updatePreviews();
  }

  function updatePreviews() {
    const dadEl = document.getElementById('dad-joke-preview');
    const puzzleEl = document.getElementById('brain-teaser-preview');
    if (dadEl) {
      const badge = isCustomDadJokeActive() ? customPreviewBadge() : '';
      dadEl.innerHTML = selectedDadJoke
        ? `${badge}${escapeHtml(selectedDadJoke)}`
        : '<span class="text-gray-500">No dad joke selected</span>';
    }
    if (puzzleEl) {
      const type = getActivePuzzleType();
      const item = getSelectedPuzzle(type);
      puzzleEl.innerHTML = formatPuzzlePreview(type, item);
    }
    syncPuzzleTypeRadiosUI();
    syncCustomPuzzleFieldsUI();
    updateFilterCountUI();
  }

  function syncPuzzleTypeRadiosUI() {
    document.querySelectorAll('input[name="nl-puzzle-type"]').forEach((radio) => {
      const label = radio.closest('.nl-puzzle-type-card');
      if (!label) return;
      const active = radio.value === getActivePuzzleType();
      label.classList.toggle('border-[#00A89D]', active);
      label.classList.toggle('ring-2', active);
      label.classList.toggle('ring-[#00A89D]/30', active);
      label.classList.toggle('bg-[#00A89D]/5', active);
      label.classList.toggle('border-gray-200', !active);
      label.classList.toggle('dark:border-gray-700', !active);
    });
  }

  function regenerateRandom(category) {
    if (category === 'dadJoke') {
      selectedDadJoke = getRandomString(dadJokes, usedDadJokes);
      dadJokeIsCustom = false;
    } else if (category === 'puzzle') {
      const type = getActivePuzzleType();
      const pool = getFilteredPuzzleList(type);
      if (!pool.length) {
        window.notifyUser('No items match your current filters. Try All topics or a different category.', 'warning', 3200);
        return;
      }
      setSelectedPuzzle(type, getRandomObject(pool, getUsedIds(type)));
    } else if (PUZZLE_TYPES[category]) {
      const pool = getFilteredPuzzleList(category);
      if (!pool.length) {
        window.notifyUser('No items match your current filters. Try All topics or a different category.', 'warning', 3200);
        return;
      }
      setSelectedPuzzle(category, getRandomObject(pool, getUsedIds(category)));
    }
    persistUsed();
    updatePreviews();
  }

  function resetUsed(category) {
    if (category === 'dadJokes') {
      usedDadJokes = [];
      dadJokeIsCustom = false;
      selectedDadJoke = getRandomString(dadJokes, usedDadJokes);
    } else if (category === 'puzzleTrivia') {
      usedTrivia = [];
      selectedTrivia = getRandomObject(triviaItems, usedTrivia);
    } else if (category === 'puzzleScramble') {
      usedScrambles = [];
      selectedScramble = getRandomObject(scrambleItems, usedScrambles);
    } else if (category === 'puzzleRiddle') {
      usedRiddles = [];
      selectedRiddle = getRandomObject(riddleItems, usedRiddles);
    } else if (category === 'puzzleAll') {
      usedTrivia = [];
      usedScrambles = [];
      usedRiddles = [];
      selectedTrivia = getRandomObject(triviaItems, usedTrivia);
      selectedScramble = getRandomObject(scrambleItems, usedScrambles);
      selectedRiddle = getRandomObject(riddleItems, usedRiddles);
    }
    persistUsed();
    updatePreviews();
    const labels = {
      dadJokes: 'Dad Jokes',
      puzzleTrivia: 'Trivia',
      puzzleScramble: 'Word Scrambles',
      puzzleRiddle: 'Riddles',
      puzzleAll: 'All Brain Teasers'
    };
    window.notifyUser(`"${labels[category] || category}" tracking reset! Random selections refreshed.`, 'success', 3200);
  }

  function getChoiceModalMeta(category) {
    if (category === 'dadJoke') {
      return { title: 'Choose a Dad Joke', data: dadJokes, mode: 'string', current: selectedDadJoke };
    }
    if (category === 'puzzle') {
      const type = getActivePuzzleType();
      const cfg = PUZZLE_TYPES[type];
      const data = getFilteredPuzzleList(type);
      let title = `Choose ${cfg.label}`;
      if (puzzleTypeSupportsFilters(type) && nlPuzzleTopicFilter === 'mortgage') title += ' — Real Estate & Home';
      if (type === 'trivia' && nlPuzzleCategoryFilter !== 'all') title += ` — ${nlPuzzleCategoryFilter}`;
      return {
        title,
        data,
        mode: 'puzzle',
        puzzleType: type,
        current: getSelectedPuzzle(type)
      };
    }
    return null;
  }

  function openChoiceModal(category, modalApi) {
    const meta = getChoiceModalMeta(category);
    if (!meta || !modalApi) return;

    const { ensureModal, getTitleEl, getListEl, showModal, hideModal } = modalApi;
    const modal = ensureModal();
    if (!modal) return;

    const title = getTitleEl(modal);
    const list = getListEl(modal);
    const data = meta.data || [];

    showModal(modal);
    if (title) {
      title.textContent = meta.title;
      title.style.color = '#fff';
    }

    let search = modal.querySelector('#modal-search');
    const contentBody = list ? list.parentElement : null;
    if (!search && contentBody) {
      search = document.createElement('input');
      search.id = 'modal-search';
      search.type = 'text';
      search.className = 'w-full px-4 py-2.5 mb-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm placeholder-gray-400 focus:border-[#00A89D] focus:ring-2 focus:ring-[#00A89D]/30';
      contentBody.insertBefore(search, list);
    }

    let filterBar = modal.querySelector('#modal-puzzle-filter-bar');
    const puzzleType = meta.puzzleType;
    const showPuzzleFilters = category === 'puzzle' && puzzleTypeSupportsFilters(puzzleType);
    if (showPuzzleFilters && contentBody) {
      if (!filterBar) {
        filterBar = document.createElement('div');
        filterBar.id = 'modal-puzzle-filter-bar';
        filterBar.className = 'mb-4 p-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80';
        contentBody.insertBefore(filterBar, list);
      }
      const filteredCount = data.length;
      const totalCount = getPuzzleList(puzzleType).length;
      const categories = puzzleType === 'trivia' ? getTriviaCategories() : [];
      const categoryOptions = ['<option value="all">All categories</option>']
        .concat(categories.map((cat) => `<option value="${escapeHtml(cat)}"${nlPuzzleCategoryFilter === cat ? ' selected' : ''}>${escapeHtml(cat)}</option>`))
        .join('');
      const categoryInline = puzzleType === 'trivia'
        ? `<div class="flex items-center gap-2 border-l border-gray-200 dark:border-gray-600 pl-3">
            <label for="modal-puzzle-category" class="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">Category</label>
            <select id="modal-puzzle-category" class="min-w-[160px] max-w-[220px] px-3 py-1.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">${categoryOptions}</select>
          </div>`
        : '';
      filterBar.innerHTML = `
        <p class="text-xs text-gray-500 mb-2">${filteredCount} of ${totalCount} items match · Topic: <strong>${escapeHtml(getTopicFilterLabel(nlPuzzleTopicFilter))}</strong></p>
        <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div class="flex flex-wrap gap-2">
            <button type="button" data-modal-topic="all" class="text-xs px-3 py-1.5 rounded-full border-2 font-semibold ${nlPuzzleTopicFilter === 'all' ? 'border-[#00A89D] bg-[#00A89D]/10 text-[#002B5C]' : 'border-gray-200 text-gray-600'}">All topics</button>
            <button type="button" data-modal-topic="mortgage" class="text-xs px-3 py-1.5 rounded-full border-2 font-semibold ${nlPuzzleTopicFilter === 'mortgage' ? 'border-[#00A89D] bg-[#00A89D]/10 text-[#002B5C]' : 'border-gray-200 text-gray-600'}">🏠 Real Estate &amp; Home</button>
          </div>
          ${categoryInline}
        </div>`;
      filterBar.querySelectorAll('[data-modal-topic]').forEach((btn) => {
        btn.addEventListener('click', () => {
          setTopicFilter(btn.getAttribute('data-modal-topic'));
          openChoiceModal(category, modalApi);
        });
      });
      const modalCat = filterBar.querySelector('#modal-puzzle-category');
      if (modalCat) {
        modalCat.addEventListener('change', () => {
          setCategoryFilter(modalCat.value);
          openChoiceModal(category, modalApi);
        });
      }
      filterBar.classList.remove('hidden');
    } else if (filterBar) {
      filterBar.classList.add('hidden');
    }

    if (list) {
      list.innerHTML = '';

      if (category === 'puzzle' && !data.length) {
        const emptyLi = document.createElement('li');
        emptyLi.className = 'nl-modal-empty-state p-4 rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 text-sm';
        emptyLi.textContent = 'No items match these filters. Switch to All topics or pick a different category.';
        list.appendChild(emptyLi);
      }

      const randomLi = document.createElement('li');
      randomLi.className = 'p-4 mb-2 bg-[#F15A29]/10 border border-[#F15A29]/30 rounded-2xl cursor-pointer hover:bg-[#F15A29]/20 transition-all text-[#F15A29] font-semibold flex items-center gap-3';
      randomLi.innerHTML = `<i class="fas fa-dice"></i> <span>Pick a random one for me</span>`;
      randomLi.addEventListener('click', () => {
        regenerateRandom(category);
        hideModal(modal);
        if (search) search.value = '';
      });
      list.appendChild(randomLi);

      if (meta.mode === 'string') {
        data.forEach((item) => {
          const li = document.createElement('li');
          const isCurrent = item === meta.current;
          li.className = `p-4 bg-white dark:bg-gray-800 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-gray-900 dark:text-gray-100 text-base border ${isCurrent ? 'border-[#00A89D] ring-1 ring-[#00A89D]/30' : 'border-gray-200 dark:border-gray-700 hover:border-[#00A89D]'} flex items-start gap-3`;
          li.innerHTML = `<i class="fas fa-laugh-beam text-[#00A89D] mt-0.5 flex-shrink-0"></i> <span class="flex-1">${escapeHtml(item)}</span> ${isCurrent ? '<span class="text-[10px] px-2 py-0.5 bg-[#00A89D]/10 text-[#00A89D] rounded-full self-start">current</span>' : ''}`;
          li.addEventListener('click', () => {
            selectedDadJoke = item;
            dadJokeIsCustom = false;
            persistUsed();
            updatePreviews();
            hideModal(modal);
            if (search) search.value = '';
          });
          list.appendChild(li);
        });
      } else {
        data.forEach((item) => {
          const li = document.createElement('li');
          const isCurrent = meta.current && meta.current.id === item.id;
          let display = '';
          if (meta.puzzleType === 'trivia') display = item.question;
          else if (meta.puzzleType === 'scramble') display = `${item.prompt} → ${item.scrambled}`;
          else display = item.riddle;
          const badges = [];
          if (item.category) badges.push(`<span class="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">${escapeHtml(item.category)}</span>`);
          if (puzzleTypeSupportsFilters(meta.puzzleType) && isMortgageRelated(item)) {
            badges.push('<span class="text-[10px] px-2 py-0.5 rounded-full bg-[#00A89D]/10 text-[#00A89D]">Real Estate & Home</span>');
          }
          li.className = `p-4 bg-white dark:bg-gray-800 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-gray-900 dark:text-gray-100 text-base border ${isCurrent ? 'border-[#00A89D] ring-1 ring-[#00A89D]/30' : 'border-gray-200 dark:border-gray-700 hover:border-[#00A89D]'} flex items-start gap-3`;
          const answerLine = item.answer ? `<span class="block text-sm font-medium text-[#002B5C] dark:text-white mt-1.5">Answer: ${escapeHtml(item.answer)}</span>` : '';
          li.innerHTML = `<i class="fas fa-puzzle-piece text-[#00A89D] mt-0.5 flex-shrink-0"></i> <span class="flex-1"><span class="block">${escapeHtml(display)}</span>${answerLine}${badges.length ? `<span class="flex flex-wrap gap-1.5 mt-2">${badges.join('')}</span>` : ''}</span> ${isCurrent ? '<span class="text-[10px] px-2 py-0.5 bg-[#00A89D]/10 text-[#00A89D] rounded-full self-start">current</span>' : ''}`;
          li.dataset.searchText = `${display} ${item.answer || ''} ${item.category || ''} ${(item.tags || []).join(' ')}`.toLowerCase();
          li.addEventListener('click', () => {
            setSelectedPuzzle(meta.puzzleType, item);
            persistUsed();
            updatePreviews();
            hideModal(modal);
            if (search) search.value = '';
          });
          list.appendChild(li);
        });
      }
    }

    if (search) {
      search.placeholder = `Search ${meta.title.toLowerCase()}...`;
      search.oninput = () => {
        const filter = search.value.toLowerCase().trim();
        Array.from(list.children).forEach((li, idx) => {
          if (idx === 0 || li.classList.contains('nl-modal-empty-state')) return;
          const haystack = li.dataset.searchText || li.innerText.toLowerCase();
          li.style.display = !filter || haystack.includes(filter) ? '' : 'none';
        });
      };
      search.focus();
    }
  }

  function buildPromptLines(selections) {
    const lines = [];
    if (selections.contentSections.dadjoke) {
      lines.push('- Dad Joke (INCLUDE): output ONLY <h2>Dad Joke of the Week</h2> and empty <p id="dad-joke-placeholder"></p> — we inject the joke later. Keep tone light and family-friendly.');
    } else {
      lines.push('- Dad Joke (EXCLUDE): do not include Dad Joke heading, text, or dad-joke-placeholder.');
    }
    if (selections.contentSections.puzzle) {
      const type = selections.puzzleType || 'trivia';
      const heading = PUZZLE_TYPES[type]?.heading || 'Weekly Brain Teaser';
      lines.push(`- Weekly Brain Teaser (INCLUDE): output ONLY <h2>${heading}</h2>, empty <div id="brain-teaser-placeholder"></div>, and a line <p style="font-size:12px;color:#888;font-style:italic;">No peeking — scroll to the very bottom for the answer.</p> — we inject puzzle content later. Do NOT reveal the answer in this section.`);
      lines.push('- Leave <!-- BRAIN_TEASER_ANSWER_PLACEHOLDER --> after the footer/disclaimer row — we inject the answer in fine print at the very bottom.');
    } else {
      lines.push('- Weekly Brain Teaser (EXCLUDE): do not include trivia, scramble, riddle, brain-teaser-placeholder, or BRAIN_TEASER_ANSWER_PLACEHOLDER.');
    }
    return lines;
  }

  function buildTeaserBodyHtml(type, item) {
    if (!item) return '';
    if (type === 'trivia') {
      return `<p style="margin:0 0 12px;font-size:18px;line-height:1.6;color:#002B5C;">${escapeHtml(item.question)}</p>`;
    }
    if (type === 'scramble') {
      const hint = item.hint ? `<p style="margin:12px 0 0;font-size:15px;color:#666;font-style:italic;">Hint: ${escapeHtml(item.hint)}</p>` : '';
      return `<p style="margin:0 0 8px;font-size:18px;line-height:1.6;color:#002B5C;">${escapeHtml(item.prompt)}</p><p style="margin:0;font-size:28px;font-weight:700;letter-spacing:0.2em;color:#00A89D;">${escapeHtml(item.scrambled)}</p>${hint}`;
    }
    return `<p style="margin:0;font-size:18px;line-height:1.6;color:#002B5C;font-style:italic;">${escapeHtml(item.riddle)}</p>`;
  }

  function buildAnswerLine(type, item) {
    if (!item) return '';
    if (type === 'trivia') return `Answer: ${item.answer}`;
    if (type === 'scramble') return `Answer: ${item.answer}`;
    return `Answer: ${item.riddle ? item.answer : ''}`;
  }

  function stripBrainTeaserAnswerRows(html) {
    return String(html || '')
      .replace(/<tr>\s*<td[^>]*>\s*<p[^>]*font-size:\s*10px[^>]*>\s*Answer:[\s\S]*?<\/td>\s*<\/tr>/gi, '')
      .replace(/<!--\s*BRAIN_TEASER_ANSWER_PLACEHOLDER\s*-->/gi, '');
  }

  function injectIntoHtml(html, selections) {
    if (!html || !selections) return html;
    let out = html;

    if (selections.contentSections.dadjoke && selectedDadJoke) {
      out = out.replace(/<p[^>]*id=["']?dad-joke-placeholder["']?[^>]*>[\s\S]*?<\/p>/gi, `<p style="margin:0;font-size:18px;line-height:1.6;">${escapeHtml(selectedDadJoke)}</p>`);
    }

    if (selections.contentSections.puzzle) {
      const type = selections.puzzleType || getActivePuzzleType();
      const item = getSelectedPuzzle(type);
      const body = buildTeaserBodyHtml(type, item);
      out = out.replace(/<div[^>]*id=["']?brain-teaser-placeholder["']?[^>]*>[\s\S]*?<\/div>/gi, `<div id="brain-teaser-placeholder">${body}</div>`);
    }

    return stripBrainTeaserAnswerRows(out);
  }

  function injectTeaserAnswerAtEnd(html, selections) {
    if (!html || !selections?.contentSections?.puzzle) return stripBrainTeaserAnswerRows(html);

    const type = selections.puzzleType || getActivePuzzleType();
    const item = getSelectedPuzzle(type);
    const answerText = buildAnswerLine(type, item);
    if (!answerText) return stripBrainTeaserAnswerRows(html);

    let out = stripBrainTeaserAnswerRows(html);
    const answerRow = `<tr><td align="center" style="padding:10px 20px 20px;text-align:center;"><p style="margin:0;font-size:10px;color:#999;line-height:1.4;">${escapeHtml(answerText)}</p></td></tr>`;

    if (out.includes('<!-- BRAIN_TEASER_ANSWER_PLACEHOLDER -->')) {
      return out.replace('<!-- BRAIN_TEASER_ANSWER_PLACEHOLDER -->', answerRow);
    }

    const afterFooter = /(<tr>\s*<td[^>]*background:\s*#002B5C[^>]*>[\s\S]*?<\/td>\s*<\/tr>)/i;
    if (afterFooter.test(out)) {
      return out.replace(afterFooter, '$1\n' + answerRow);
    }

    const beforeMainClose = /<\/table>\s*<\/body>/i;
    if (beforeMainClose.test(out)) {
      return out.replace(beforeMainClose, answerRow + '\n</table></body>');
    }

    return out.replace(/<\/body>/i, answerRow + '\n</body>');
  }

  function stripSections(html) {
    let out = html || '';
    out = out.replace(/<p[^>]*id=["']?dad-joke-placeholder["']?[^>]*>[\s\S]*?<\/p>/gi, '');
    out = out.replace(/<div[^>]*id=["']?brain-teaser-placeholder["']?[^>]*>[\s\S]*?<\/div>/gi, '');
    out = out.replace(/<!--\s*BRAIN_TEASER_ANSWER_PLACEHOLDER\s*-->/gi, '');
    const headings = ['Dad Joke', 'Dad Joke of the Week', 'Trivia Time', 'Word Scramble', 'Riddle of the Week', 'Weekly Brain Teaser', 'Brain Teaser', 'Groaner of the Week'];
    const headingPattern = headings.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const tealCardRe = new RegExp(
      `<tr>\\s*<td[^>]*>\\s*<table[^>]*border-left:\\s*8px[^>]*>[\\s\\S]*?<h2[^>]*>\\s*(?:${headingPattern})\\s*</h2>[\\s\\S]*?</table>\\s*</td>\\s*</tr>\\s*(?:<tr>\\s*<td[^>]*height=["']?20["']?[^>]*>\\s*</td>\\s*</tr>\\s*)?`,
      'gi'
    );
    return out.replace(tealCardRe, '');
  }

  function wireUI() {
    document.querySelectorAll('input[name="nl-puzzle-type"]').forEach((radio) => {
      if (radio._nlPuzzleWired) return;
      radio._nlPuzzleWired = true;
      radio.addEventListener('change', () => {
        syncPuzzleTypeFromUI();
        const nextType = getActivePuzzleType();
        if (!puzzleTypeSupportsFilters(nextType)) nlPuzzleTopicFilter = 'all';
        if (nextType !== 'trivia') nlPuzzleCategoryFilter = 'all';
        persistUsed();
        syncCategorySelectOptions();
        syncCustomPuzzleFieldsUI();
        syncCustomFormsFromSelection();
        ensureSelectionMatchesFilters();
        updatePreviews();
      });
    });

    document.querySelectorAll('[data-nl-topic]').forEach((btn) => {
      if (btn._nlTopicWired) return;
      btn._nlTopicWired = true;
      btn.addEventListener('click', () => setTopicFilter(btn.getAttribute('data-nl-topic')));
    });

    const categorySelect = document.getElementById('nl-puzzle-category-select');
    if (categorySelect && !categorySelect._nlCategoryWired) {
      categorySelect._nlCategoryWired = true;
      categorySelect.addEventListener('change', () => setCategoryFilter(categorySelect.value));
    }

    if (typeof window.updateCustomContentChoicesVisibility === 'function') {
      window.updateCustomContentChoicesVisibility();
    }

    const savedType = localStorage.getItem('nl-puzzle-type') || 'trivia';
    const radio = document.querySelector(`input[name="nl-puzzle-type"][value="${savedType}"]`);
    if (radio) radio.checked = true;
    syncPuzzleTypeFromUI();
    loadCustomDrafts();
    syncCategorySelectOptions();
    syncCustomPuzzleFieldsUI();
    syncCustomFormsFromSelection();

    const dadApply = document.getElementById('nl-custom-dadjoke-apply');
    if (dadApply && !dadApply._nlCustomWired) {
      dadApply._nlCustomWired = true;
      dadApply.addEventListener('click', applyCustomDadJoke);
    }
    const puzzleApply = document.getElementById('nl-custom-puzzle-apply');
    if (puzzleApply && !puzzleApply._nlCustomWired) {
      puzzleApply._nlCustomWired = true;
      puzzleApply.addEventListener('click', applyCustomPuzzle);
    }
    const scrambleShuffle = document.getElementById('nl-custom-scramble-shuffle');
    if (scrambleShuffle && !scrambleShuffle._nlCustomWired) {
      scrambleShuffle._nlCustomWired = true;
      scrambleShuffle.addEventListener('click', () => {
        const answer = (document.getElementById('nl-custom-scramble-answer')?.value || '').trim();
        if (!answer) {
          window.notifyUser('Enter the unscrambled answer first, then scramble.', 'warning', 3200);
          return;
        }
        const lettersEl = document.getElementById('nl-custom-scramble-letters');
        if (lettersEl) lettersEl.value = scrambleLetters(answer);
        persistCustomDrafts();
      });
    }
    ['nl-custom-dadjoke-input', 'nl-custom-trivia-question', 'nl-custom-trivia-answer',
      'nl-custom-scramble-prompt', 'nl-custom-scramble-answer', 'nl-custom-scramble-letters',
      'nl-custom-scramble-hint', 'nl-custom-riddle-text', 'nl-custom-riddle-answer'].forEach((id) => {
      const el = document.getElementById(id);
      if (!el || el._nlDraftWired) return;
      el._nlDraftWired = true;
      el.addEventListener('input', persistCustomDrafts);
    });

    ensureSelectionMatchesFilters();
    updatePreviews();
  }

  loadState();

  window.NlEntertainment = {
    PUZZLE_TYPES,
    getActivePuzzleType,
    updatePreviews,
    regenerateRandom,
    resetUsed,
    openChoiceModal,
    buildPromptLines,
    injectIntoHtml,
    injectTeaserAnswerAtEnd,
    stripSections,
    wireUI,
    getSelectionsExtra() {
      return {
        puzzleType: getActivePuzzleType(),
        puzzleTopicFilter: nlPuzzleTopicFilter,
        puzzleCategoryFilter: nlPuzzleCategoryFilter
      };
    },
    isMortgageRelated,
    getFilteredPuzzleList,
    getSectionConfigs() {
      return {
        dadjoke: {
          id: 'nl-dadjoke',
          label: 'Dad Joke',
          headings: ['Dad Joke', 'Dad Joke of the Week', 'Groaner of the Week'],
          placeholderId: 'dad-joke-placeholder'
        },
        puzzle: {
          id: 'nl-puzzle',
          label: 'Weekly Brain Teaser',
          headings: ['Trivia Time', 'Word Scramble', 'Riddle of the Week', 'Weekly Brain Teaser', 'Brain Teaser'],
          placeholderId: 'brain-teaser-placeholder'
        }
      };
    }
  };

  window.regenerateDadJoke = () => regenerateRandom('dadJoke');
  window.regenerateBrainTeaser = () => regenerateRandom('puzzle');

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireUI);
  } else {
    wireUI();
  }
})();