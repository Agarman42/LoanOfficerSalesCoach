/**
 * js/features/generation-rules.js
 *
 * Shared Generation Rules panel — compliance, citations, local-first, AI-search-friendly.
 * Persists per browser; injects into newsletter, blog, and social prompts.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'loGenerationRules';

  const RULE_DEFS = [
    {
      id: 'strictCompliance',
      label: 'Strict compliance',
      shortLabel: 'Compliance',
      icon: 'fa-shield-alt',
      accent: '#002B5C',
      defaultOn: true,
      description: 'Never quote specific rates or APRs. Safe, educational mortgage language only.',
      promptLines: [
        'COMPLIANCE MODE (ON): NEVER quote, mention, suggest, or imply ANY specific mortgage interest rates, APRs, or numeric rate figures anywhere.',
        'Use only general language like "rates have shifted recently" without numbers. Include appropriate disclaimers where relevant.',
        'Avoid trigger terms and lender comparisons beyond Ruoff Mortgage when applicable.',
      ],
    },
    {
      id: 'citeSources',
      label: 'Cite credible sources',
      shortLabel: 'Sources',
      icon: 'fa-link',
      accent: '#00A89D',
      defaultOn: true,
      description: 'Hyperlink trusted industry and local sources — builds trust and authority.',
      promptLines: [
        'SOURCE CITATION MODE (ON): When stating facts, trends, statistics, or news, cite credible sources by name.',
        'Include clickable hyperlinks (target="_blank" rel="noopener") to real, reputable URLs when referencing data or articles.',
        'Never invent source URLs — use only verifiable links or name sources without a link if uncertain.',
      ],
    },
    {
      id: 'localFirst',
      label: 'Local-first context',
      shortLabel: 'Local-first',
      icon: 'fa-map-marker-alt',
      accent: '#F15A29',
      defaultOn: true,
      description: 'Weave in the user\'s market, neighborhoods, and relatable local flavor.',
      promptLines: [
        'LOCAL-FIRST MODE (ON): Prioritize the user\'s stated local market and area in examples, headlines, and context.',
        'Reference neighborhoods, regional programs, and community touchpoints where natural — not generic national filler.',
        'When local specifics are unknown, use safe evergreen local framing without inventing statistics.',
      ],
    },
    {
      id: 'aiSearchFriendly',
      label: 'AI-search friendly',
      shortLabel: 'AI visibility',
      icon: 'fa-robot',
      accent: '#00A89D',
      defaultOn: true,
      description: 'Clear structure, direct answers, and entity context for Google + AI search visibility.',
      promptLines: [
        'AI-SEARCH / GEO MODE (ON): Structure content so AI assistants and search engines can extract clear answers.',
        'Use descriptive headings, short scannable paragraphs, and explicit Q&A where appropriate.',
        'Naturally mention the loan officer name, company (Ruoff Mortgage), and local market as entities — never keyword-stuff.',
        'Lead with direct answers to common borrower questions; support with context and examples.',
      ],
    },
  ];

  const TOOL_INTROS = {
    newsletter: 'These rules shape how your newsletter is researched, written, and structured.',
    blog: 'These rules shape SEO, compliance, and how your blog ranks in search and AI answers.',
    social: 'These rules keep posts compliant, local, and optimized for engagement + discoverability.',
  };

  function loadState() {
    const defaults = {};
    RULE_DEFS.forEach((r) => { defaults[r.id] = r.defaultOn; });
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return { ...defaults, ...saved };
    } catch (e) {
      return defaults;
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* ignore */ }
  }

  let state = loadState();
  const changeListeners = new Set();

  function notifyChange() {
    changeListeners.forEach((fn) => {
      try { fn(state); } catch (e) { /* ignore */ }
    });
    document.dispatchEvent(new CustomEvent('generation-rules-change', { detail: { state: { ...state } } }));
  }

  function getState() {
    return { ...state };
  }

  function setRule(id, enabled) {
    if (!RULE_DEFS.some((r) => r.id === id)) return;
    state[id] = !!enabled;
    saveState(state);
    notifyChange();
  }

  function getActiveRules() {
    return RULE_DEFS.filter((r) => state[r.id]);
  }

  function getActiveLabels() {
    return getActiveRules().map((r) => r.shortLabel);
  }

  function buildPromptBlock(toolKey) {
    const active = getActiveRules();
    if (!active.length) {
      return [
        '',
        'GENERATION RULES: User disabled all optional rules — still follow baseline mortgage compliance (no specific rate quotes).',
      ];
    }
    const lines = [
      '',
      `GENERATION RULES (user-enabled — apply to this ${toolKey || 'content'}):`,
    ];
    active.forEach((rule) => {
      rule.promptLines.forEach((line) => lines.push(`- ${line}`));
    });
    return lines;
  }

  function renderToggle(rule, checked) {
    return `
      <label class="gr-rule-row group flex items-start gap-4 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/60 hover:border-[#00A89D]/40 transition-all cursor-pointer" data-gr-rule="${rule.id}">
        <div class="flex-shrink-0 mt-0.5">
          <span class="w-10 h-10 rounded-2xl flex items-center justify-center" style="background:${rule.accent}14">
            <i class="fas ${rule.icon} text-lg" style="color:${rule.accent}"></i>
          </span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-3">
            <span class="font-semibold text-[#002B5C] dark:text-white">${rule.label}</span>
            <span class="gr-switch relative inline-flex h-7 w-12 flex-shrink-0 rounded-full transition-colors ${checked ? 'bg-[#00A89D]' : 'bg-gray-300 dark:bg-gray-600'}" role="switch" aria-checked="${checked ? 'true' : 'false'}">
              <input type="checkbox" class="sr-only gr-rule-input" data-gr-rule-input="${rule.id}" ${checked ? 'checked' : ''}>
              <span class="gr-switch-knob pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition translate-x-1 ${checked ? 'translate-x-6' : 'translate-x-1'} mt-1"></span>
            </span>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1.5 m-0 leading-relaxed">${rule.description}</p>
        </div>
      </label>`;
  }

  function mount(mountId, toolKey) {
    const el = typeof mountId === 'string' ? document.getElementById(mountId) : mountId;
    if (!el || el.dataset.grMounted === '1') return el;
    el.dataset.grMounted = '1';

    const intro = TOOL_INTROS[toolKey] || TOOL_INTROS.newsletter;
    const activeCount = getActiveRules().length;

    el.innerHTML = `
      <div class="gr-panel rounded-3xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white via-white to-[#00A89D]/5 dark:from-gray-900 dark:via-gray-900 dark:to-[#00A89D]/10 p-6 shadow-sm" data-gr-tool="${toolKey || 'newsletter'}">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div class="flex items-start gap-3">
            <span class="w-10 h-10 rounded-2xl bg-[#002B5C]/10 flex items-center justify-center flex-shrink-0">
              <i class="fas fa-sliders-h text-[#002B5C] dark:text-[#00A89D]"></i>
            </span>
            <div>
              <div class="flex flex-wrap items-center gap-2 mb-1">
                <h4 class="text-lg font-bold text-[#002B5C] dark:text-white m-0">Generation Rules</h4>
                <span class="gr-active-badge text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-[#00A89D]/15 text-[#00A89D]">${activeCount} active</span>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 m-0 max-w-xl">${intro}</p>
            </div>
          </div>
          <button type="button" class="gr-reset-btn text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-600 text-gray-500 hover:text-[#00A89D] hover:border-[#00A89D]/40 transition whitespace-nowrap self-start" title="Restore recommended defaults">
            <i class="fas fa-undo mr-1"></i> Reset defaults
          </button>
        </div>
        <div class="gr-rules-grid grid grid-cols-1 lg:grid-cols-2 gap-3">
          ${RULE_DEFS.map((r) => renderToggle(r, !!state[r.id])).join('')}
        </div>
        <p class="text-[11px] text-gray-400 dark:text-gray-500 mt-4 mb-0 flex items-center gap-1.5">
          <i class="fas fa-info-circle"></i>
          Rules apply to every generation until you change them. Saved in this browser.
        </p>
      </div>`;

    function refreshPanelUI() {
      const badge = el.querySelector('.gr-active-badge');
      if (badge) badge.textContent = `${getActiveRules().length} active`;
      RULE_DEFS.forEach((rule) => {
        const input = el.querySelector(`[data-gr-rule-input="${rule.id}"]`);
        const row = el.querySelector(`[data-gr-rule="${rule.id}"]`);
        if (!input || !row) return;
        const on = !!state[rule.id];
        input.checked = on;
        const sw = row.querySelector('.gr-switch');
        const knob = row.querySelector('.gr-switch-knob');
        if (sw) {
          sw.classList.toggle('bg-[#00A89D]', on);
          sw.classList.toggle('bg-gray-300', !on);
          sw.classList.toggle('dark:bg-gray-600', !on);
          sw.setAttribute('aria-checked', on ? 'true' : 'false');
        }
        if (knob) {
          knob.classList.toggle('translate-x-6', on);
          knob.classList.toggle('translate-x-1', !on);
        }
      });
    }

    el.addEventListener('change', (e) => {
      const input = e.target.closest('[data-gr-rule-input]');
      if (!input) return;
      setRule(input.getAttribute('data-gr-rule-input'), input.checked);
      refreshPanelUI();
    });

    el.addEventListener('click', (e) => {
      const row = e.target.closest('[data-gr-rule]');
      if (!row || e.target.closest('[data-gr-rule-input]') || e.target.closest('.gr-reset-btn')) return;
      const id = row.getAttribute('data-gr-rule');
      setRule(id, !state[id]);
      refreshPanelUI();
    });

    el.querySelector('.gr-reset-btn')?.addEventListener('click', () => {
      RULE_DEFS.forEach((r) => { state[r.id] = r.defaultOn; });
      saveState(state);
      notifyChange();
      refreshPanelUI();
    });

    changeListeners.add(refreshPanelUI);
    return el;
  }

  function initAllMounts() {
    mount('nl-generation-rules-mount', 'newsletter');
    mount('blog-generation-rules-mount', 'blog');
    mount('social-generation-rules-mount', 'social');
  }

  window.GenerationRules = {
    getState,
    setRule,
    getActiveRules,
    getActiveLabels,
    buildPromptBlock,
    mount,
    onChange(fn) {
      if (typeof fn === 'function') changeListeners.add(fn);
      return () => changeListeners.delete(fn);
    },
  };

  window.buildGenerationRulesPromptBlock = buildPromptBlock;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllMounts);
  } else {
    initAllMounts();
  }
})();