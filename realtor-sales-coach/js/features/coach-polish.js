/**
 * Coach polish — empty states, generate-button a11y, and post-output coaching handoffs.
 * Realtor / Agent Sales Coach. Safe no-ops if DOM pieces are missing.
 *
 * IMPORTANT: avoid MutationObserver feedback loops (setting attributes / rewriting
 * handoff HTML must not re-enter the same observer).
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
        'Personal + local posts outperform listing-only posts.',
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
      body: 'Select a real situation (buyer consult, listing pitch, post-close thank you), add optional context, and generate natural scripts.',
      tips: [
        'The more context you give, the more “you” it sounds.',
        'Save winners to My Saved Items for quick reuse.',
        'Practice once out loud before the real call.'
      ],
      links: [
        { id: 'consultation', label: 'Consultation kit →' },
        { id: 'database', label: 'Database nurture →' }
      ]
    },
    'nl-empty-state': {
      icon: 'fa-envelope-open-text',
      title: 'Newsletter preview appears here',
      body: 'Write a Personal Update (required, 40+ characters), pick sections, then generate. Review before you copy or download.',
      tips: [
        'Lead with a real personal note — not a generic market dump.',
        'Guided setup helps if you’re starting from zero.',
        'After you send, pull one section into social.'
      ],
      links: [
        { id: 'bio-creator', label: 'Primary bio →' },
        { id: 'social-post', label: 'Social posts →' }
      ]
    },
    'listing-empty-state': {
      icon: 'fa-pen-fancy',
      title: 'Listing copy appears here',
      body: 'Add features and highlights, then generate long + short MLS descriptions you can paste today.',
      tips: [
        'Lead with lifestyle and standouts — not only room counts.',
        'Custom highlights capture the details photos miss.',
        'Pair with an Open House kit the same day.'
      ],
      links: [
        { id: 'open-house', label: 'Open House kit →' },
        { id: 'social-post', label: 'Social posts →' }
      ]
    },
    'oh-empty-state': {
      icon: 'fa-door-open',
      title: 'Open House kit appears here',
      body: 'Pick a goal and property type, add highlights, then generate scripts, lead capture, and follow-up.',
      tips: [
        'Name the weekend goal (buyer leads vs. impress sellers).',
        'Custom notes help with quirks (pets, first OH, price cut).',
        'Practice the greeting + CTA once before doors open.'
      ],
      links: [
        { id: 'listing-description', label: 'Listing Copy →' },
        { id: 'weekly-win-plan', label: 'Block follow-up →' }
      ]
    },
    'bio-empty-state': {
      icon: 'fa-id-card',
      title: 'Your bio appears here',
      body: 'Fill essentials (or Quick Setup), pick a destination length, then generate a paste-ready bio.',
      tips: [
        'Save the best version as Primary — Newsletter & Coach use it.',
        'Match the destination character limit before pasting.',
        'Keep one memorable personal detail.'
      ],
      links: [
        { id: 'newsletter-generator', label: 'Newsletter →' },
        { id: 'weekly-win-plan', label: 'Weekly Win Plan →' }
      ]
    },
    'weekly-empty-state': {
      icon: 'fa-fire',
      title: 'Your 7-day plan appears here',
      body: 'Set hours and focus above, then Build This Week’s Plan for protected blocks and daily tasks.',
      tips: [
        'Protect 2–3 power hours before adding more tasks.',
        'Pair one Value Vault touch with one content block.',
        'Rebuild anytime — the plan stays on this device until replaced.'
      ],
      links: [
        { id: 'value-vault', label: 'Value Vault →' },
        { id: 'planning', label: '2026 Business Plan →' }
      ]
    },
    'vault-empty-state': {
      icon: 'fa-gift',
      title: 'Start with one pillar — then deliver',
      body: 'Open Pop-Bys first for a fast win. Copy a script, deliver within 48 hours, then log it in Weekly Win Plan.',
      tips: [
        'Search by situation (“open house,” “past client”).',
        'Surprise Me is perfect when you need one idea quickly.',
        'One excellent pop-by beats five average emails.'
      ],
      links: [
        { id: 'weekly-win-plan', label: 'Weekly Win Plan →' },
        { id: 'database', label: 'Database nurture →' }
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
      message: 'Pair scripts with real conversations — open houses, consultations, and database A+ VIPs.',
      links: [
        { id: 'open-house', label: 'Open house' },
        { id: 'database', label: 'Database nurturing' },
        { id: 'weekly-win-plan', label: 'Block call time' }
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
    },
    listing: {
      eyebrow: 'Turn copy into opportunity',
      message: 'Listing copy is ready — pair it with an Open House kit and a social teaser.',
      links: [
        { id: 'open-house', label: 'Open House kit' },
        { id: 'social-post', label: 'Social posts' },
        { id: 'weekly-win-plan', label: 'Block follow-up' }
      ]
    },
    'open-house': {
      eyebrow: 'Protect the follow-up',
      message: 'Great open houses win on day-after touches. Block follow-up time and save your best scripts.',
      links: [
        { id: 'weekly-win-plan', label: 'Weekly Win Plan' },
        { id: 'listing-description', label: 'Listing Copy' },
        { id: 'database', label: 'Database nurture' }
      ]
    },
    bio: {
      eyebrow: 'Use this bio everywhere',
      message: 'Save as Primary, then paste into Zillow / brokerage and let Newsletter pull from it.',
      links: [
        { id: 'newsletter-generator', label: 'Newsletter' },
        { id: 'social-post', label: 'Social posts' },
        { id: 'weekly-win-plan', label: 'Weekly Win Plan' }
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
    // Already mounted — do not rewrite (prevents MutationObserver loops)
    if (bar && bar.dataset.coachHandoffReady === '1') return;
    if (!bar) {
      bar = document.createElement('div');
      bar.dataset.coachHandoff = key;
      container.appendChild(bar);
    }
    bar.innerHTML = handoffBar(HANDOFF_SPECS[key]);
    bar.dataset.coachHandoffReady = '1';
    bindGoButtons(bar);
  }

  /** Public API used by generators (optional). */
  window.CoachPolish = {
    hideEmpty,
    showEmpty,
    mountHandoff,
    go,
    refreshOutput: refreshOneOutput
  };

  // --- Generate button a11y (no MutationObserver — attribute writes re-enter observers) ---
  function syncBusy(btn) {
    if (!btn) return;
    const busy = btn.disabled || btn.dataset.generating === '1';
    const next = busy ? 'true' : 'false';
    if (btn.getAttribute('aria-busy') !== next) {
      btn.setAttribute('aria-busy', next);
    }
  }

  function wireGenerateA11y() {
    const selectors = [
      '#generate-bio-btn',
      '#generate-blog-btn',
      '#generate-newsletter-btn',
      '#generate-plan-btn',
      '#generate-win-plan-btn',
      '#generate-script-btn',
      '#generate-social-btn',
      '#generate-listing-btn',
      '#generate-oh-btn',
      '.coach-generate-btn',
      'button[onclick*="generateSalesScript"]',
      'button[onclick*="generateSocialPost"]',
      'button[onclick*="generateListing"]',
      'button[onclick*="generateOpenHouse"]',
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
        syncBusy(btn);
        // Lightweight attribute watchers only — never set the same attr that re-fires forever
        btn.addEventListener('click', () => {
          // Generators set disabled shortly after click; sync next frames
          requestAnimationFrame(() => syncBusy(btn));
          setTimeout(() => syncBusy(btn), 50);
          setTimeout(() => syncBusy(btn), 500);
        });
      });
    });
  }

  function measureHasContent(out) {
    if (!out) return false;
    // Newsletter / iframe previews: iframe text is not in parent textContent
    if (out.id === 'nl-preview') {
      const iframe = out.querySelector('iframe');
      if (iframe && (iframe.getAttribute('srcdoc') || iframe.srcdoc || iframe.src)) return true;
      try {
        if (typeof window.lastGeneratedHTML === 'string' && window.lastGeneratedHTML.trim().length > 80) {
          return true;
        }
      } catch (e) { /* ignore */ }
      const raw = document.getElementById('nl-html-raw');
      if (raw && (raw.value || '').trim().length > 80) return true;
    }
    let textLen = 0;
    let meaningfulChildren = 0;
    Array.from(out.childNodes).forEach((node) => {
      if (node.nodeType === 1 && node.dataset && node.dataset.coachHandoff) return;
      if (node.nodeType === 1 && node.id === 'nl-empty-state') return;
      if (node.nodeType === 3) textLen += (node.textContent || '').trim().length;
      if (node.nodeType === 1) {
        if (node.tagName === 'IFRAME') {
          meaningfulChildren += 1;
          textLen += 100;
          return;
        }
        const t = (node.textContent || '').trim().length;
        // Ignore shell-only wrappers with almost no text
        if (t > 20) {
          textLen += t;
          meaningfulChildren += 1;
        }
      }
    });
    return textLen > 60 || meaningfulChildren > 0;
  }

  const outputPairs = [
    ['blog-output', 'blog-empty-state', 'blog'],
    ['social-output', 'social-empty-state', 'social'],
    ['script-output', 'script-empty-state', 'scripts'],
    ['nl-preview', 'nl-empty-state', 'newsletter'],
    ['listing-output', 'listing-empty-state', 'listing'],
    ['oh-output', 'oh-empty-state', 'open-house'],
    ['bio-output-panel', 'bio-empty-state', 'bio']
  ];

  function refreshOneOutput(outputId, emptyId, handoffKey) {
    const out = document.getElementById(outputId);
    if (!out) return;
    const hidden = out.classList.contains('hidden');
    const hasContent = measureHasContent(out);
    if (!hidden && hasContent) {
      if (emptyId) hideEmpty(emptyId);
      if (handoffKey) mountHandoff(out, handoffKey);
    } else if (emptyId && (hidden || !hasContent)) {
      showEmpty(emptyId);
    }
  }

  function refreshAllOutputs() {
    outputPairs.forEach(([out, empty, handoff]) => refreshOneOutput(out, empty, handoff));
  }

  // --- Hook generators with debounced observers + re-entry guard ---
  function observeOutput(outputId, emptyId, handoffKey) {
    const out = document.getElementById(outputId);
    if (!out || out._coachObs) return;
    let scheduled = false;
    let applying = false;
    const apply = () => {
      if (applying) return;
      applying = true;
      try {
        refreshOneOutput(outputId, emptyId, handoffKey);
      } finally {
        applying = false;
        scheduled = false;
      }
    };
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(apply);
    };
    out._coachObs = true;
    apply();
    const obs = new MutationObserver(schedule);
    // childList only on direct children — not subtree (avoids handoff rewrites thrashing)
    obs.observe(out, { childList: true, attributes: true, attributeFilter: ['class', 'style'] });
  }

  function ensureWeeklyHandoff() {
    const results = document.getElementById('weekly-plan-results');
    if (!results || results.classList.contains('hidden')) return;
    let host = document.getElementById('weekly-coach-handoff');
    if (host && host.dataset.coachHandoffReady === '1') return;
    if (!host) {
      host = document.createElement('div');
      host.id = 'weekly-coach-handoff';
      results.appendChild(host);
    }
    host.innerHTML = handoffBar(HANDOFF_SPECS.weekly);
    host.dataset.coachHandoffReady = '1';
    bindGoButtons(host);
  }

  function syncWeeklyEmpty() {
    const results = document.getElementById('weekly-plan-results');
    if (!results) return;
    if (results.classList.contains('hidden')) showEmpty('weekly-empty-state');
    else hideEmpty('weekly-empty-state');
  }

  function syncVaultEmpty() {
    const anyPillarOpen = Array.from({ length: 6 }, (_, i) =>
      document.getElementById(`value-vault-pillar-${i + 1}`)
    ).some((el) => el && !el.classList.contains('hidden'));
    if (anyPillarOpen) hideEmpty('vault-empty-state');
    else showEmpty('vault-empty-state');
  }

  function init() {
    Object.keys(EMPTY_SPECS).forEach(ensureEmptyState);
    outputPairs.forEach(([out, empty, handoff]) => {
      const o = document.getElementById(out);
      if (o && o.classList.contains('hidden')) showEmpty(empty);
      else if (o && !measureHasContent(o)) showEmpty(empty);
      else if (o) hideEmpty(empty);
      observeOutput(out, empty, handoff);
    });

    wireGenerateA11y();
    syncWeeklyEmpty();
    syncVaultEmpty();

    const weeklyResults = document.getElementById('weekly-plan-results');
    if (weeklyResults && !weeklyResults._coachObs) {
      weeklyResults._coachObs = true;
      // attributes only — do not watch childList (handoff injection would loop)
      const wObs = new MutationObserver(() => {
        syncWeeklyEmpty();
        if (!weeklyResults.classList.contains('hidden')) ensureWeeklyHandoff();
      });
      wObs.observe(weeklyResults, { attributes: true, attributeFilter: ['class'] });
      if (!weeklyResults.classList.contains('hidden')) ensureWeeklyHandoff();
    }

    // Hide vault tip once a pillar panel opens
    for (let i = 1; i <= 6; i += 1) {
      const pillar = document.getElementById(`value-vault-pillar-${i}`);
      if (!pillar || pillar._coachVaultObs) continue;
      pillar._coachVaultObs = true;
      const pObs = new MutationObserver(syncVaultEmpty);
      pObs.observe(pillar, { attributes: true, attributeFilter: ['class'] });
    }
    document.getElementById('value-vault-pillars-grid')?.addEventListener('click', () => {
      setTimeout(syncVaultEmpty, 50);
    });

    document.addEventListener('click', (e) => {
      const link = e.target.closest('#sidebar a[href^="#"]');
      if (!link) return;
      setTimeout(() => {
        wireGenerateA11y();
        ensureWeeklyHandoff();
        syncWeeklyEmpty();
        syncVaultEmpty();
        refreshAllOutputs();
      }, 400);
    });
  }

  function scheduleInit() {
    // Yield so the giant HTML + Tailwind can settle before we touch the DOM
    const run = () => {
      try {
        init();
      } catch (e) {
        console.warn('[coach-polish] init failed', e);
      }
    };
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(run, { timeout: 2500 });
    } else {
      setTimeout(run, 0);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleInit);
  } else {
    scheduleInit();
  }

  console.log('%c[coach-polish] Empty states, a11y, and handoffs ready', 'color:#00A89D');
})();
