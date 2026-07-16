/**
 * Coach polish — empty states, generate-button a11y, and post-output coaching handoffs.
 * LO Sales Coach only. Safe no-ops if DOM pieces are missing.
 */
(function () {
  'use strict';

  function go(id) {
    if (typeof window.showSection === 'function') window.showSection(id);
  }

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function emptyCard(opts) {
    const tips = (opts.tips || [])
      .map((t) => `<li class="text-sm text-gray-600 dark:text-gray-400">${esc(t)}</li>`)
      .join('');
    const links = (opts.links || [])
      .map(
        (l) =>
          `<button type="button" data-coach-go="${esc(l.id)}" class="text-xs px-3 py-1.5 rounded-full border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white transition font-semibold">${esc(l.label)}</button>`
      )
      .join('');
    return `
      <div class="text-center py-12 px-6 max-w-lg mx-auto">
        <div class="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00A89D]/12 to-[#F15A29]/12">
          <i class="fas ${esc(opts.icon || 'fa-sparkles')} text-2xl text-[#00A89D]"></i>
        </div>
        <h3 class="text-xl font-bold text-[#002B5C] dark:text-white mb-2">${esc(opts.title)}</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">${esc(opts.body)}</p>
        ${tips ? `<ul class="text-left space-y-1.5 list-disc pl-5 mb-5 inline-block">${tips}</ul>` : ''}
        ${links ? `<div class="flex flex-wrap justify-center gap-2">${links}</div>` : ''}
      </div>`;
  }

  function handoffBar(opts) {
    const pills = (opts.links || [])
      .map(
        (l) =>
          `<button type="button" data-coach-go="${esc(l.id)}" class="text-xs px-3 py-1.5 rounded-full border border-[#00A89D]/50 text-[#00A89D] hover:bg-[#00A89D] hover:text-white transition font-semibold">${esc(l.label)}</button>`
      )
      .join('');
    return `
      <div class="coach-handoff-bar mt-6 p-4 rounded-2xl border border-[#00A89D]/25 bg-[#00A89D]/5" role="navigation" aria-label="Next coaching steps">
        <div class="text-[10px] font-bold uppercase tracking-wider text-[#00A89D] mb-1">${esc(opts.eyebrow || 'Next step')}</div>
        <p class="text-sm text-gray-700 dark:text-gray-300 m-0 mb-3">${esc(opts.message)}</p>
        <div class="flex flex-wrap gap-2">${pills}</div>
      </div>`;
  }

  const EMPTY_SPECS = {
    'blog-empty-state': {
      icon: 'fa-newspaper',
      title: 'Your authority blog starts here',
      body: 'Pick a topic, add your market, and generate a full package — SEO blog, social caption, Google post, and Reel script.',
      tips: [
        'Use a specific local angle (neighborhood, first-time buyers, VA).',
        'Upload a short guideline PDF if you want facts grounded in a source.',
        'After generate, repurpose into Newsletter + Social Calendar.'
      ],
      links: [
        { id: 'newsletter-generator', label: 'Newsletter →' },
        { id: 'social-post', label: 'Social posts →' }
      ]
    },
    'social-empty-state': {
      icon: 'fa-share-alt',
      title: 'No posts yet — let’s create 3 options',
      body: 'Choose a post type, add a detail or two from your week, and generate three ready-to-post variations in your voice.',
      tips: [
        'Personal + local posts outperform pure rate posts.',
        'Batch once, then schedule across the week.',
        'Use the 30-day calendar below for a full month plan.'
      ],
      links: [
        { id: 'blog', label: 'Turn a blog into posts →' },
        { id: 'weekly-win-plan', label: 'Block posting time →' }
      ]
    },
    'script-empty-state': {
      icon: 'fa-comments',
      title: 'Pick a scenario to unlock scripts',
      body: 'Select a real situation (rate shop, realtor intro, post-close thank you), add optional context, and generate four natural scripts.',
      tips: [
        'The more context you give, the more “you” it sounds.',
        'Save winners to My Saved Items for quick reuse.',
        'Practice once out loud before the real call.'
      ],
      links: [
        { id: 'equity-scanner', label: 'Equity opportunities →' },
        { id: 'database', label: 'Database nurture →' }
      ]
    },
    'equity-empty-state': {
      icon: 'fa-search-dollar',
      title: 'Upload a list — or try demo data',
      body: 'Drop a client/export spreadsheet, generate the equity report, then prioritize outreach. No file? Load demo data to explore the dashboard.',
      tips: [
        'Focus on high-equity, high-payment-gap opportunities first.',
        'Pair each lead with a Sales Script for the conversation.',
        'Log follow-ups in your Weekly Win Plan.'
      ],
      links: [
        { id: 'sales-script', label: 'Sales scripts →' },
        { id: 'weekly-win-plan', label: 'Weekly Win Plan →' }
      ]
    },
    'nl-empty-state': {
      icon: 'fa-envelope-open-text',
      title: 'Your newsletter preview will appear here',
      body: 'Complete Personal Update (required), pick sections, then generate. Review the full preview before copy/download.',
      tips: [
        'Lead with a real personal update — not a rate blast.',
        'Use Guided Setup if you’re starting from zero.',
        'After send day, repurpose the best section into social.'
      ],
      links: [
        { id: 'bio-creator', label: 'Primary bio →' },
        { id: 'social-post', label: 'Social posts →' }
      ]
    }
  };

  const HANDOFF_SPECS = {
    blog: {
      eyebrow: 'Repurpose this content',
      message: 'One blog should fuel a week of reach. Drop the hook into Social or Newsletter next.',
      links: [
        { id: 'social-post', label: 'Social posts' },
        { id: 'newsletter-generator', label: 'Newsletter' },
        { id: 'weekly-win-plan', label: 'Schedule the week' }
      ]
    },
    social: {
      eyebrow: 'Keep the momentum',
      message: 'Batch your calendar, then protect posting time in your Weekly Win Plan.',
      links: [
        { id: 'weekly-win-plan', label: 'Weekly Win Plan' },
        { id: 'blog', label: 'Expand a winner into a blog' },
        { id: 'newsletter-generator', label: 'Newsletter' }
      ]
    },
    scripts: {
      eyebrow: 'Use these scripts',
      message: 'Pair scripts with real opportunities — equity list or database A+ VIPs.',
      links: [
        { id: 'equity-scanner', label: 'Equity Scanner' },
        { id: 'database', label: 'Database nurturing' },
        { id: 'weekly-win-plan', label: 'Block call time' }
      ]
    },
    equity: {
      eyebrow: 'Turn equity into conversations',
      message: 'Pick your top 5 opportunities and generate a script before you dial.',
      links: [
        { id: 'sales-script', label: 'Sales scripts' },
        { id: 'weekly-win-plan', label: 'Weekly outreach blocks' },
        { id: 'database', label: 'Database tiers' }
      ]
    },
    weekly: {
      eyebrow: 'Execute the content half of the week',
      message: 'You have the calendar. Fill social + newsletter so prospecting isn’t your only touch.',
      links: [
        { id: 'social-post', label: 'Social posts / calendar' },
        { id: 'newsletter-generator', label: 'Newsletter' },
        { id: 'bio-creator', label: 'Bio Builder' }
      ]
    },
    newsletter: {
      eyebrow: 'After you send',
      message: 'Pull one story into social and protect next month’s send day on your Weekly Win Plan.',
      links: [
        { id: 'social-post', label: 'Social posts' },
        { id: 'weekly-win-plan', label: 'Weekly Win Plan' },
        { id: 'blog', label: 'Blog Creator' }
      ]
    }
  };

  function bindGoButtons(root) {
    if (!root) return;
    root.querySelectorAll('[data-coach-go]').forEach((btn) => {
      if (btn._coachGoBound) return;
      btn._coachGoBound = true;
      btn.addEventListener('click', () => go(btn.getAttribute('data-coach-go')));
    });
  }

  function ensureEmptyState(id) {
    const el = document.getElementById(id);
    const spec = EMPTY_SPECS[id];
    if (!el || !spec) return;
    if (!el.dataset.coachFilled) {
      el.innerHTML = emptyCard(spec);
      el.dataset.coachFilled = '1';
      bindGoButtons(el);
    }
  }

  function showEmpty(id) {
    const el = document.getElementById(id);
    if (!el) return;
    ensureEmptyState(id);
    el.classList.remove('hidden');
  }

  function hideEmpty(id) {
    document.getElementById(id)?.classList.add('hidden');
  }

  function mountHandoff(container, key) {
    if (!container || !HANDOFF_SPECS[key]) return;
    let bar = container.querySelector(`[data-coach-handoff="${key}"]`);
    if (!bar) {
      bar = document.createElement('div');
      bar.dataset.coachHandoff = key;
      container.appendChild(bar);
    }
    bar.innerHTML = handoffBar(HANDOFF_SPECS[key]);
    bindGoButtons(bar);
  }

  /** Public API used by generators (optional). */
  window.CoachPolish = {
    showEmpty,
    hideEmpty,
    mountHandoff,
    go
  };

  // --- Generate button a11y (aria-busy while disabled) ---
  function wireGenerateA11y() {
    const selectors = [
      '#generate-bio-btn',
      '#generate-blog-btn',
      '#generate-newsletter-btn',
      '#generate-plan-btn',
      '#generate-win-plan-btn',
      '#generate-script-btn',
      '#generate-social-btn',
      'button[onclick*="generateSalesScript"]',
      'button[onclick*="generateSocialPost"]',
      'button[onclick*="generateEquityReport"]',
      'button[onclick*="generateMonthlyPlan"]'
    ];
    selectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((btn) => {
        if (btn.dataset.coachA11y) return;
        btn.dataset.coachA11y = '1';
        if (!btn.getAttribute('type')) btn.setAttribute('type', 'button');
        const label =
          btn.getAttribute('aria-label') ||
          (btn.textContent || '').replace(/\s+/g, ' ').trim() ||
          'Generate';
        if (!btn.getAttribute('aria-label')) btn.setAttribute('aria-label', label);
        const obs = new MutationObserver(() => {
          const busy = btn.disabled || btn.getAttribute('aria-busy') === 'true' || btn.dataset.generating === '1';
          btn.setAttribute('aria-busy', busy ? 'true' : 'false');
        });
        obs.observe(btn, { attributes: true, attributeFilter: ['disabled', 'aria-busy', 'data-generating', 'class'] });
      });
    });
  }

  // --- Hook generators: hide empty + show handoff when outputs appear ---
  function observeOutput(outputId, emptyId, handoffKey) {
    const out = document.getElementById(outputId);
    if (!out) return;
    const apply = () => {
      const hidden = out.classList.contains('hidden');
      // Ignore coach handoff nodes when measuring "real" content
      let textLen = 0;
      let meaningfulChildren = 0;
      Array.from(out.childNodes).forEach((node) => {
        if (node.nodeType === 1 && node.dataset && node.dataset.coachHandoff) return;
        if (node.nodeType === 1 && node.id === 'nl-empty-state') return;
        if (node.nodeType === 3) textLen += (node.textContent || '').trim().length;
        if (node.nodeType === 1) {
          textLen += (node.textContent || '').trim().length;
          meaningfulChildren += 1;
        }
      });
      const hasContent = textLen > 40 || meaningfulChildren > 0;
      if (!hidden && hasContent) {
        if (emptyId) hideEmpty(emptyId);
        if (handoffKey) mountHandoff(out, handoffKey);
      } else if (emptyId && (hidden || !hasContent)) {
        showEmpty(emptyId);
      }
    };
    apply();
    const obs = new MutationObserver(apply);
    obs.observe(out, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
  }

  function ensureWeeklyHandoff() {
    const results = document.getElementById('weekly-plan-results');
    if (!results || results.classList.contains('hidden')) return;
    let host = document.getElementById('weekly-coach-handoff');
    if (!host) {
      host = document.createElement('div');
      host.id = 'weekly-coach-handoff';
      results.appendChild(host);
    }
    host.innerHTML = handoffBar(HANDOFF_SPECS.weekly);
    bindGoButtons(host);
  }

  function init() {
    Object.keys(EMPTY_SPECS).forEach(ensureEmptyState);
    // Initial visibility: show empty when paired output is hidden
    [
      ['blog-output', 'blog-empty-state', 'blog'],
      ['social-output', 'social-empty-state', 'social'],
      ['script-output', 'script-empty-state', 'scripts'],
      ['equity-output', 'equity-empty-state', 'equity'],
      ['nl-preview', 'nl-empty-state', 'newsletter']
    ].forEach(([out, empty, handoff]) => {
      const o = document.getElementById(out);
      if (o && o.classList.contains('hidden')) showEmpty(empty);
      else if (o) hideEmpty(empty);
      observeOutput(out, empty, handoff);
    });

    // Newsletter preview is often empty but visible — treat empty content as empty state
    const nl = document.getElementById('nl-preview');
    if (nl && !(nl.textContent || '').trim()) showEmpty('nl-empty-state');

    wireGenerateA11y();

    // Weekly results handoff when shown
    const weeklyResults = document.getElementById('weekly-plan-results');
    if (weeklyResults) {
      const wObs = new MutationObserver(() => {
        if (!weeklyResults.classList.contains('hidden')) ensureWeeklyHandoff();
      });
      wObs.observe(weeklyResults, { attributes: true, attributeFilter: ['class'] });
      if (!weeklyResults.classList.contains('hidden')) ensureWeeklyHandoff();
    }

    // Also re-check after section navigation (content injects later)
    document.addEventListener('click', (e) => {
      const link = e.target.closest('#sidebar a[href^="#"]');
      if (!link) return;
      setTimeout(() => {
        wireGenerateA11y();
        ensureWeeklyHandoff();
      }, 400);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('%c[coach-polish] Empty states, a11y, and handoffs ready', 'color:#00A89D');
})();
