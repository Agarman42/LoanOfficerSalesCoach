/**
 * Recruiting Sales Coach — app configuration
 * Redirects legacy LO nav IDs, renders playbook & fact vault.
 * (LO-only sections stripped from DOM — redirects handle stale links.)
 */
(function () {
  'use strict';

  const HIDDEN_SECTIONS = [
    'equity-scanner',
    'newsletter-generator',
    'eventplanning',
    'referrals',
    'calculator',
    'underwriting-search',
    'social',
    'value-vault',
    'process',
    'prospecting'
  ];

  /** Map legacy/hidden LO section IDs → visible recruiter tools */
  const SECTION_REDIRECTS = {
    social: 'social-post',
    referrals: 'recruiting-playbook',
    'value-vault': 'database',
    eventplanning: 'social-post',
    'database-nurturing': 'database',
    prospecting: 'weekly-win-plan',
    calculator: 'recruiting-playbook',
    process: 'recruiting-playbook',
    'equity-scanner': 'recruiting-playbook',
    'newsletter-generator': 'blog',
    'underwriting-search': 'recruiting-script'
  };

  const TITLE_UPDATES = {
    planning: '2026 Recruiting Plan',
    'recruiting-plan-ops': '2026 Plan Operations',
    database: 'Prospect Nurturing',
    'recruiting-script': 'Recruiting Script Generator',
    blog: 'Recruiting Content Creator',
    'weekly-win-plan': 'Weekly Recruiting Plan',
    'social-post': 'Social Media Post/Plan Creator'
  };

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function copyText(text, btn) {
    const content = (text || '').trim();
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
      if (!btn) return;
      const original = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i> Copied';
      setTimeout(() => { btn.innerHTML = original; }, 1400);
    }).catch(() => alert('Copy failed — try selecting text manually.'));
  }

  function saveItem(title, content, btn, category) {
    if (typeof window.toggleSaveIdea === 'function') {
      window.toggleSaveIdea(title, content, btn, category || 'recruiting');
    } else {
      alert('Save ready after refresh.');
    }
  }

  function renderActionButtons(title, content, category) {
    const safeTitle = escapeHtml(title);
    const safeContent = escapeHtml(content);
    return `
      <div class="flex gap-2 shrink-0">
        <button type="button" class="recruiting-copy-btn text-xs px-3 py-2 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold transition"
                data-copy="${safeContent}">Copy</button>
        <button type="button" class="recruiting-save-btn text-xs px-3 py-2 rounded-xl border border-[#F15A29] text-[#F15A29] hover:bg-[#F15A29] hover:text-white font-semibold transition"
                data-title="${safeTitle}" data-content="${safeContent}" data-category="${escapeHtml(category)}">Save</button>
      </div>`;
  }

  function bindCardActions(container) {
    if (!container) return;
    container.querySelectorAll('.recruiting-copy-btn').forEach(btn => {
      btn.addEventListener('click', () => copyText(btn.getAttribute('data-copy'), btn));
    });
    container.querySelectorAll('.recruiting-save-btn').forEach(btn => {
      btn.addEventListener('click', () => saveItem(
        btn.getAttribute('data-title'),
        btn.getAttribute('data-content'),
        btn,
        btn.getAttribute('data-category')
      ));
    });
  }

  function renderListCard(title, items, category) {
    const body = (items || []).map(item => `<li class="text-sm text-gray-700 dark:text-gray-300">${escapeHtml(item)}</li>`).join('');
    const fullText = (items || []).join('\n');
    return `
      <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-5 bg-white dark:bg-gray-900">
        <div class="flex justify-between gap-4 items-start mb-3">
          <h4 class="font-semibold text-[#002B5C] dark:text-white">${escapeHtml(title)}</h4>
          ${renderActionButtons(title, fullText, category)}
        </div>
        <ul class="list-disc list-inside space-y-1">${body}</ul>
      </div>`;
  }

  function renderTextCard(title, text, category) {
    return `
      <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-5 bg-white dark:bg-gray-900">
        <div class="flex justify-between gap-4 items-start">
          <div class="flex-1 min-w-0">
            <h4 class="font-semibold text-[#002B5C] dark:text-white mb-2">${escapeHtml(title)}</h4>
            <p class="text-sm text-gray-700 dark:text-gray-300">${escapeHtml(text)}</p>
          </div>
          ${renderActionButtons(title, text, category)}
        </div>
      </div>`;
  }

  function formatObjectionLabel(key) {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, s => s.toUpperCase())
      .trim();
  }

  function renderMetricsStrip(metrics) {
    if (!metrics) return '';
    const w = metrics.weekly || {};
    const qc = w.qualityConversations || {};
    const sched = w.executiveCallsScheduled || {};
    const done = w.executiveCallsCompleted || {};
    const days = (w.bestOutreachDays || []).join(' · ');

    return `
      <div class="mb-8 rounded-3xl border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 p-6 shadow-xl">
        <div class="text-center mb-4">
          <span class="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#F15A29]/10 text-[#F15A29] text-xs font-bold tracking-[1px]">WEEKLY EXECUTION TARGETS</span>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">Reference metrics for coaching — Shape is your system of record.</p>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div class="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 text-center">
            <div class="text-2xl font-black text-[#002B5C] dark:text-white">${w.outreachAttempts || '—'}</div>
            <div class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mt-1">Outreach / wk</div>
          </div>
          <div class="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 text-center">
            <div class="text-2xl font-black text-[#00A89D]">${qc.min || '—'}–${qc.max || '—'}</div>
            <div class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mt-1">Quality convos</div>
          </div>
          <div class="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 text-center">
            <div class="text-2xl font-black text-[#F15A29]">${sched.min || '—'}–${sched.max || '—'}</div>
            <div class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mt-1">Exec calls sched.</div>
          </div>
          <div class="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 text-center">
            <div class="text-2xl font-black text-[#002B5C] dark:text-white">${done.min || '—'}–${done.max || '—'}</div>
            <div class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mt-1">Exec calls done</div>
          </div>
        </div>
        <div class="flex flex-wrap justify-center gap-2 text-xs">
          <span class="px-3 py-1.5 rounded-full bg-[#00A89D]/10 text-[#00A89D] font-semibold">Best days: ${escapeHtml(days)}</span>
          <span class="px-3 py-1.5 rounded-full bg-[#002B5C]/10 text-[#002B5C] dark:text-white font-semibold">Goal: ${metrics.annualGoal?.netHires || 60} net hires</span>
        </div>
      </div>`;
  }

  function renderBulletList(items, category) {
    if (!items || !items.length) return '';
    return (items || []).map(item => `
      <div class="flex gap-3 items-start py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
        <span class="w-6 h-6 rounded-full bg-[#00A89D]/10 text-[#00A89D] flex items-center justify-center shrink-0 text-xs mt-0.5"><i class="fas fa-check"></i></span>
        <p class="text-sm text-gray-700 dark:text-gray-300 flex-1">${escapeHtml(item)}</p>
        <button type="button" class="recruiting-copy-btn text-[10px] px-2 py-1 rounded-lg border border-gray-200 text-gray-500 hover:border-[#00A89D] hover:text-[#00A89D] shrink-0"
                data-copy="${escapeHtml(item)}">Copy</button>
      </div>`).join('');
  }

  function renderPlaybookPanel(id, label, innerHtml, active) {
    return `
      <div id="playbook-panel-${id}" class="playbook-panel ${active ? '' : 'hidden'}">
        <div class="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <h3 class="text-lg font-bold text-[#002B5C] dark:text-white mb-4 flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-[#00A89D]/10 flex items-center justify-center"><i class="fas fa-bookmark text-[#00A89D] text-sm"></i></span>
            ${escapeHtml(label)}
          </h3>
          ${innerHtml}
        </div>
      </div>`;
  }

  function initRecruitingPlaybook() {
    const container = document.getElementById('recruiting-playbook-content');
    const playbook = window.RECRUITING_PLAYBOOK;
    const metrics = window.RECRUITING_METRICS;
    if (!container || !playbook) return;

    const tabs = [
      { id: 'philosophy', label: 'Philosophy', icon: 'fa-compass' },
      { id: 'openers', label: 'Openers', icon: 'fa-phone' },
      { id: 'discovery', label: 'Discovery', icon: 'fa-search' },
      { id: 'objections', label: 'Objections', icon: 'fa-shield-alt' },
      { id: 'leadership', label: 'Leadership', icon: 'fa-users' },
      { id: 'linkedin', label: 'LinkedIn', icon: 'fa-linkedin' },
      { id: 'execprep', label: 'Exec Prep', icon: 'fa-clipboard-check' },
      { id: 'nurture', label: 'Nurture', icon: 'fa-heart' },
      { id: 'coaching', label: 'Coaching', icon: 'fa-chalkboard-teacher' }
    ];

    const objections = playbook.objectionResponses || {};
    const objectionEntries = Object.keys(objections).map(key => ({
      key,
      label: formatObjectionLabel(key),
      responses: objections[key] || []
    }));

    const objectionCardsHtml = objectionEntries.map(entry => `
      <div class="objection-card border border-gray-200 dark:border-gray-700 rounded-2xl p-5" data-search="${escapeHtml((entry.label + ' ' + entry.responses.join(' ')).toLowerCase())}">
        <h4 class="font-semibold text-[#F15A29] mb-3">${escapeHtml(entry.label)}</h4>
        <div class="space-y-3">
          ${entry.responses.map((resp, i) => renderTextCard(`${entry.label} — Response ${i + 1}`, resp, 'playbook')).join('')}
        </div>
      </div>`).join('');

    const panelsHtml = [
      renderPlaybookPanel('philosophy', 'Core Philosophy', `
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Lead with curiosity. Quality conversations beat raw volume. Help candidates weigh platform and long-term support — not just the sign-on bonus.</p>
        ${renderBulletList(playbook.philosophy, 'playbook')}
        <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 class="font-semibold text-[#002B5C] dark:text-white mb-3">Keys to Success</h4>
          ${renderBulletList(playbook.keysToSuccess, 'playbook')}
        </div>`, true),
      renderPlaybookPanel('openers', 'Neutral Openers & Primary Opener', `
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Drop the guard with a short human opener before your main pitch on most calls.</p>
        ${renderBulletList(playbook.neutralOpeners, 'playbook')}
        <div class="mt-6 p-5 rounded-2xl bg-[#002B5C]/5 border border-[#002B5C]/20">
          <div class="text-[10px] font-bold tracking-wider text-[#002B5C] uppercase mb-2">Primary Recruiting Opener</div>
          <p class="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">${escapeHtml(playbook.primaryOpener)}</p>
          <div class="mt-3 flex justify-end">
            ${renderActionButtons('Primary Recruiting Opener', playbook.primaryOpener, 'playbook')}
          </div>
        </div>`, false),
      renderPlaybookPanel('discovery', 'Discovery & Power Questions', `
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Let the candidate speak more than you do. These questions uncover real motivations.</p>
        ${renderBulletList(playbook.discoveryQuestions, 'playbook')}`, false),
      renderPlaybookPanel('objections', 'Objection Handling', `
        <div class="mb-4 p-4 rounded-2xl bg-[#F15A29]/5 border border-[#F15A29]/20">
          <div class="font-semibold text-[#002B5C] dark:text-white mb-2">Objection Mindset</div>
          ${renderBulletList(playbook.objectionMindset, 'playbook')}
        </div>
        <div class="relative mb-4">
          <input type="text" id="playbook-objection-search" placeholder="Search objections..."
                 class="w-full p-3 pr-10 rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00A89D] text-sm">
          <i class="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
        </div>
        <div id="playbook-objection-results" class="space-y-4">${objectionCardsHtml}</div>`, false),
      renderPlaybookPanel('leadership', 'Leadership Meeting Scripts', `
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Position senior leadership conversations as high-value and low-risk — not a hard pitch.</p>
        ${(playbook.leadershipMeetingScripts || []).map((s, i) => renderTextCard(`Leadership Script ${i + 1}`, s, 'playbook')).join('')}
        <div class="mt-6 text-center">
          <button type="button" onclick="if(typeof window.openExecCallPrep==='function')window.openExecCallPrep()"
                  class="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#002B5C] text-white text-sm font-semibold hover:bg-black transition">
            <i class="fas fa-clipboard-check"></i> Open Executive Call Prep &amp; Debrief
          </button>
        </div>`, false),
      renderPlaybookPanel('linkedin', 'LinkedIn Connection & DM Snippets', `
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Copy-ready language for connection requests, follow-ups, and soft exec-call invites. Personalize [Name] and [market] before sending.</p>
        <div class="space-y-4">
          ${(playbook.linkedinSnippets || []).map(s => renderTextCard(s.title, s.text, 'linkedin')).join('')}
        </div>`, false),
      renderPlaybookPanel('execprep', 'Executive Call Prep & Debrief', `
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Use before and after every executive leadership conversation. Log everything in Shape.</p>
        <div class="grid md:grid-cols-3 gap-4">
          <div class="p-5 rounded-2xl border border-[#00A89D]/30 bg-[#00A89D]/5">
            <h4 class="font-semibold text-[#00A89D] mb-3">Pre-Call Checklist</h4>
            ${renderBulletList(playbook.execCallPrep?.preCallChecklist || [], 'execprep')}
          </div>
          <div class="p-5 rounded-2xl border border-[#F15A29]/30 bg-[#F15A29]/5">
            <h4 class="font-semibold text-[#F15A29] mb-3">During the Call</h4>
            ${renderBulletList(playbook.execCallPrep?.duringCallReminders || [], 'execprep')}
          </div>
          <div class="p-5 rounded-2xl border border-[#002B5C]/30 bg-[#002B5C]/5">
            <h4 class="font-semibold text-[#002B5C] dark:text-white mb-3">Post-Call Debrief</h4>
            ${renderBulletList(playbook.execCallPrep?.postCallDebrief || [], 'execprep')}
          </div>
        </div>
        <div class="mt-6 text-center">
          <button type="button" onclick="if(typeof window.openExecCallPrep==='function')window.openExecCallPrep()"
                  class="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#F15A29] text-white text-sm font-semibold hover:opacity-90 transition">
            <i class="fas fa-user-edit"></i> Prep a Specific Candidate
          </button>
        </div>`, false),
      renderPlaybookPanel('nurture', 'Ending Calls & Long-Term Nurturing', `
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Even when they're not ready, keep the relationship alive. Log every touch in Shape.</p>
        ${renderBulletList(playbook.nurtureClose, 'playbook')}`, false),
      renderPlaybookPanel('coaching', 'Coaching Points & Conversions', `
        <div class="mb-6">${renderBulletList(playbook.coachingPoints, 'playbook')}</div>
        ${metrics?.conversions ? `
          <h4 class="font-semibold text-[#002B5C] dark:text-white mb-3">Conversion Benchmarks</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            ${metrics.conversions.map(c => `
              <div class="p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm">
                <div class="text-gray-500 text-xs">${escapeHtml(c.from)} → ${escapeHtml(c.to)}</div>
                <div class="font-bold text-[#00A89D] mt-1">${escapeHtml(c.rate)}</div>
              </div>`).join('')}
          </div>` : ''}`, false)
    ].join('');

    const tabButtons = tabs.map((t, i) => `
      <button type="button" data-playbook-tab="${t.id}" data-tab-index="${i}"
              class="playbook-tab px-4 py-2.5 rounded-2xl text-sm font-semibold transition flex items-center gap-2 whitespace-nowrap shrink-0
                     ${i === 0 ? 'bg-[#002B5C] text-white shadow-md' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-[#00A89D]'}">
        <i class="fas ${t.icon}"></i> ${escapeHtml(t.label)}
      </button>`).join('');

    const dotIndicators = tabs.map((t, i) => `
      <button type="button" data-playbook-dot="${t.id}" aria-label="${escapeHtml(t.label)}"
              class="playbook-dot w-2.5 h-2.5 rounded-full transition ${i === 0 ? 'bg-[#00A89D] scale-110' : 'bg-gray-300 dark:bg-gray-600 hover:bg-[#00A89D]/60'}"></button>`).join('');

    container.innerHTML = `
      ${renderMetricsStrip(metrics)}
      <div class="mb-2 flex items-center justify-between gap-3">
        <div>
          <span class="text-[10px] font-bold tracking-[2px] text-[#F15A29] uppercase">9 Topics — tap or scroll</span>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Philosophy through Coaching — each tab has copy-ready scripts and language.</p>
        </div>
        <div class="hidden sm:flex items-center gap-1 text-xs text-gray-500">
          <i class="fas fa-arrows-alt-h text-[#00A89D]"></i> scroll
        </div>
      </div>
      <div class="relative mb-2">
        <div class="pointer-events-none absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-white dark:from-gray-800 to-transparent z-10 rounded-l-2xl" id="playbook-tab-fade-left"></div>
        <div class="pointer-events-none absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-white dark:from-gray-800 to-transparent z-10 rounded-r-2xl" id="playbook-tab-fade-right"></div>
        <button type="button" id="playbook-tab-scroll-left" class="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 shadow text-gray-500 hover:text-[#00A89D] hidden sm:flex items-center justify-center" aria-label="Scroll tabs left"><i class="fas fa-chevron-left text-xs"></i></button>
        <button type="button" id="playbook-tab-scroll-right" class="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 shadow text-gray-500 hover:text-[#00A89D] hidden sm:flex items-center justify-center" aria-label="Scroll tabs right"><i class="fas fa-chevron-right text-xs"></i></button>
        <div class="flex gap-2 overflow-x-auto pb-2 px-1 scroll-smooth snap-x snap-mandatory" id="playbook-tabs">${tabButtons}</div>
      </div>
      <div class="flex justify-center gap-2 mb-6" id="playbook-dots">${dotIndicators}</div>
      <div id="playbook-panels" class="space-y-4">${panelsHtml}</div>
      <div class="mt-8 text-center">
        <button type="button" onclick="if(typeof window.showSection==='function')window.showSection('recruiting-script')"
                class="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#002B5C] hover:bg-black text-white text-sm font-semibold transition">
          <i class="fas fa-comment-dots"></i> Generate scripts for any scenario
        </button>
      </div>`;

    bindCardActions(container);

    function activatePlaybookTab(tabId, btnEl) {
      container.querySelectorAll('.playbook-tab').forEach(b => {
        b.classList.remove('bg-[#002B5C]', 'text-white', 'shadow-md');
        b.classList.add('bg-white', 'dark:bg-gray-900', 'border', 'border-gray-200', 'dark:border-gray-700', 'text-gray-700', 'dark:text-gray-300');
      });
      const activeBtn = btnEl || container.querySelector(`[data-playbook-tab="${tabId}"]`);
      if (activeBtn) {
        activeBtn.classList.add('bg-[#002B5C]', 'text-white', 'shadow-md');
        activeBtn.classList.remove('bg-white', 'dark:bg-gray-900', 'border', 'border-gray-200', 'dark:border-gray-700', 'text-gray-700', 'dark:text-gray-300');
        activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
      container.querySelectorAll('.playbook-dot').forEach(d => {
        d.classList.remove('bg-[#00A89D]', 'scale-110');
        d.classList.add('bg-gray-300', 'dark:bg-gray-600');
      });
      const dot = container.querySelector(`[data-playbook-dot="${tabId}"]`);
      if (dot) {
        dot.classList.add('bg-[#00A89D]', 'scale-110');
        dot.classList.remove('bg-gray-300', 'dark:bg-gray-600');
      }
      container.querySelectorAll('.playbook-panel').forEach(p => p.classList.add('hidden'));
      const panel = document.getElementById(`playbook-panel-${tabId}`);
      if (panel) panel.classList.remove('hidden');
    }

    container.querySelectorAll('.playbook-tab').forEach(btn => {
      btn.addEventListener('click', () => activatePlaybookTab(btn.getAttribute('data-playbook-tab'), btn));
    });
    container.querySelectorAll('.playbook-dot').forEach(dot => {
      dot.addEventListener('click', () => activatePlaybookTab(dot.getAttribute('data-playbook-dot')));
    });

    const tabStrip = document.getElementById('playbook-tabs');
    document.getElementById('playbook-tab-scroll-left')?.addEventListener('click', () => {
      if (tabStrip) tabStrip.scrollBy({ left: -200, behavior: 'smooth' });
    });
    document.getElementById('playbook-tab-scroll-right')?.addEventListener('click', () => {
      if (tabStrip) tabStrip.scrollBy({ left: 200, behavior: 'smooth' });
    });

    const objectionSearch = document.getElementById('playbook-objection-search');
    const objectionResults = document.getElementById('playbook-objection-results');
    if (objectionSearch && objectionResults) {
      objectionSearch.addEventListener('input', () => {
        const q = objectionSearch.value.toLowerCase().trim();
        objectionResults.querySelectorAll('.objection-card').forEach(card => {
          const hay = card.getAttribute('data-search') || '';
          const words = q.split(/\s+/).filter(w => w.length > 1);
          const match = !q || words.every(w => hay.includes(w));
          card.classList.toggle('hidden', !match);
        });
      });
    }
  }

  function initRuoffFactVault() {
    const resultsEl = document.getElementById('ruoff-fact-results');
    const searchEl = document.getElementById('ruoff-fact-search');
    const categoryEl = document.getElementById('ruoff-fact-category');
    const emptyEl = document.getElementById('ruoff-fact-empty');
    if (!resultsEl || !searchEl || !categoryEl) return;

    function getFacts() {
      return typeof window.getActiveRuoffFactVault === 'function'
        ? window.getActiveRuoffFactVault()
        : (window.RUOFF_FACT_VAULT || []);
    }

    function rebuildCategories() {
      const facts = getFacts();
      categoryEl.innerHTML = '<option value="">All Categories</option>';
      [...new Set(facts.map(f => f.category).filter(Boolean))].sort().forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        categoryEl.appendChild(opt);
      });
    }

    function renderFacts() {
      const facts = getFacts();
      const q = (searchEl.value || '').toLowerCase().trim();
      const cat = categoryEl.value;
      const filtered = facts.filter(f => {
        if (cat && f.category !== cat) return false;
        if (!q) return true;
        const hay = `${f.category} ${f.title} ${f.content}`.toLowerCase();
        return q.split(/\s+/).some(w => w.length > 1 && hay.includes(w));
      });

      if (filtered.length === 0) {
        resultsEl.innerHTML = '';
        emptyEl?.classList.remove('hidden');
        return;
      }
      emptyEl?.classList.add('hidden');

      resultsEl.innerHTML = filtered.map(f => {
        const title = `${f.category}: ${f.title}`;
        const preview = f.content.length > 320 ? f.content.slice(0, 320) + '…' : f.content;
        return `
          <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-5 bg-white dark:bg-gray-900 flex flex-col">
            <div class="flex justify-between gap-3 items-start mb-2">
              <div class="min-w-0 flex-1">
                <span class="text-[10px] font-bold tracking-wider text-[#00A89D] uppercase">${escapeHtml(f.category)}</span>
                <h4 class="font-semibold text-[#002B5C] dark:text-white mt-1">${escapeHtml(f.title)}</h4>
              </div>
              ${renderActionButtons(title, f.content, 'ruoff-fact')}
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 flex-1">${escapeHtml(preview)}</p>
          </div>`;
      }).join('');

      bindCardActions(resultsEl);
    }

    searchEl.addEventListener('input', renderFacts);
    categoryEl.addEventListener('change', renderFacts);
    rebuildCategories();
    renderFacts();

    window.__refreshRuoffFactVaultUI = function () {
      rebuildCategories();
      renderFacts();
    };
    window.addEventListener('ruoffFactVaultUpdated', () => {
      rebuildCategories();
      renderFacts();
    });
  }

  function hideRecruiterSections() {
    /* LO sections removed from index.html; keep for any dynamically injected legacy nodes */
    HIDDEN_SECTIONS.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
  }

  function updateSectionTitles() {
    Object.entries(TITLE_UPDATES).forEach(([id, title]) => {
      const section = document.getElementById(id);
      if (!section) return;
      const h2 = section.querySelector('h2');
      if (h2) h2.textContent = title;
    });

    document.querySelectorAll('main section h2').forEach(h2 => {
      if (h2.textContent && h2.textContent.includes('Loan Officer')) {
        h2.textContent = h2.textContent.replace(/Loan Officer/gi, 'Recruiter');
      }
    });
  }

  function patchShowSection() {
    const original = window.showSection;
    if (typeof original !== 'function') return;

    window.showSection = function (id) {
      if (!id) return;
      const redirect = SECTION_REDIRECTS[id];
      if (redirect) {
        if (typeof window.showToast === 'function') {
          window.showToast(`Opened ${TITLE_UPDATES[redirect] || redirect.replace(/-/g, ' ')} (recruiting view)`);
        }
        return original(redirect);
      }
      if (HIDDEN_SECTIONS.includes(id)) {
        console.warn('[recruiting-config] Section hidden, opening Recruiting Playbook:', id);
        if (typeof window.showToast === 'function') {
          window.showToast('That LO-only tool is hidden — opened Recruiting Playbook instead.');
        }
        return original('recruiting-playbook');
      }
      return original(id);
    };

    window.RECRUITER_SECTION_REDIRECTS = SECTION_REDIRECTS;
  }

  function openExecCallPrep() {
    const existing = document.getElementById('exec-call-prep-modal');
    if (existing) {
      existing.classList.remove('hidden');
      existing.classList.add('flex');
      return;
    }

    const prep = window.RECRUITING_PLAYBOOK?.execCallPrep || {};
    const modal = document.createElement('div');
    modal.id = 'exec-call-prep-modal';
    modal.className = 'fixed inset-0 bg-black/70 z-[999] flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[92vh] flex flex-col" onclick="event.stopPropagation()">
        <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-[#002B5C] to-[#00A89D] rounded-t-3xl">
          <div>
            <h3 class="text-xl font-bold text-white">Executive Call Prep &amp; Debrief</h3>
            <p class="text-sm text-white/80 mt-0.5">Candidate-specific prep → log in Shape → bridge to Script Generator</p>
          </div>
          <button type="button" data-close class="text-white/80 hover:text-white text-3xl leading-none">&times;</button>
        </div>
        <div class="p-6 overflow-y-auto flex-1 space-y-5 text-sm">
          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="block font-semibold text-[#002B5C] dark:text-white mb-1">Candidate name</label>
              <input type="text" id="exec-prep-name" class="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" placeholder="e.g. Jamie Smith">
            </div>
            <div>
              <label class="block font-semibold text-[#002B5C] dark:text-white mb-1">Current company</label>
              <input type="text" id="exec-prep-company" class="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" placeholder="e.g. ABC Mortgage">
            </div>
            <div>
              <label class="block font-semibold text-[#002B5C] dark:text-white mb-1">Production (units / yr)</label>
              <input type="text" id="exec-prep-units" class="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" placeholder="e.g. 45 units, 60% purchase">
            </div>
            <div>
              <label class="block font-semibold text-[#002B5C] dark:text-white mb-1">Shape tier</label>
              <select id="exec-prep-tier" class="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                <option value="A — Hot">A — Hot</option>
                <option value="B — Warm">B — Warm</option>
                <option value="C — Long game">C — Long game</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block font-semibold text-[#002B5C] dark:text-white mb-1">What they said / objections / notes</label>
            <textarea id="exec-prep-notes" rows="3" class="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" placeholder="Happy but curious about ops support. Mentioned frustration with turn times..."></textarea>
          </div>
          <div>
            <label class="block font-semibold text-[#00A89D] mb-2">Pre-call checklist</label>
            <div class="space-y-2">
              ${(prep.preCallChecklist || []).map((item, i) => `
                <label class="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <input type="checkbox" class="exec-prep-check mt-1 accent-[#00A89D]" data-phase="pre">
                  <span>${escapeHtml(item)}</span>
                </label>`).join('')}
            </div>
          </div>
          <div>
            <label class="block font-semibold text-[#F15A29] mb-2">Post-call debrief</label>
            <div class="space-y-2">
              ${(prep.postCallDebrief || []).map(item => `
                <label class="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <input type="checkbox" class="exec-prep-check mt-1 accent-[#F15A29]" data-phase="post">
                  <span>${escapeHtml(item)}</span>
                </label>`).join('')}
            </div>
          </div>
          <div>
            <label class="block font-semibold text-[#002B5C] dark:text-white mb-1">Outcome / next step</label>
            <textarea id="exec-prep-outcome" rows="2" class="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" placeholder="Exec call booked for Thu 2pm / Nurture — revisit in 90 days / Declined leadership call"></textarea>
          </div>
        </div>
        <div class="p-6 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-3 justify-end bg-gray-50 dark:bg-gray-900 rounded-b-3xl">
          <button type="button" id="exec-prep-to-script" class="px-5 py-2.5 rounded-xl bg-[#00A89D] text-white font-semibold hover:bg-[#008F85] transition">
            <i class="fas fa-comment-dots"></i> Send to Script Generator
          </button>
          <button type="button" id="exec-prep-copy" class="px-5 py-2.5 rounded-xl border border-[#002B5C] text-[#002B5C] dark:text-white font-semibold hover:bg-[#002B5C] hover:text-white transition">Copy summary</button>
          <button type="button" data-close class="px-5 py-2.5 rounded-xl bg-gray-200 dark:bg-gray-700 font-semibold">Close</button>
        </div>
      </div>`;

    function closeModal() {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }

    modal.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', closeModal));
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

    modal.querySelector('#exec-prep-copy')?.addEventListener('click', () => {
      const summary = buildExecPrepSummary();
      navigator.clipboard.writeText(summary).then(() => {
        if (typeof window.showToast === 'function') window.showToast('Prep summary copied', 'success');
      }).catch(() => alert(summary));
    });

    modal.querySelector('#exec-prep-to-script')?.addEventListener('click', () => {
      const ctx = buildExecPrepSummary();
      if (typeof window.showSection === 'function') window.showSection('recruiting-script');
      setTimeout(() => {
        const ta = document.getElementById('script-context');
        if (ta) {
          ta.value = ctx;
          ta.focus();
        }
        closeModal();
        if (typeof window.showToast === 'function') window.showToast('Context sent to Script Generator', 'success');
      }, 350);
    });

    function buildExecPrepSummary() {
      const name = document.getElementById('exec-prep-name')?.value?.trim() || '[Candidate]';
      const company = document.getElementById('exec-prep-company')?.value?.trim() || '';
      const units = document.getElementById('exec-prep-units')?.value?.trim() || '';
      const tier = document.getElementById('exec-prep-tier')?.value || '';
      const notes = document.getElementById('exec-prep-notes')?.value?.trim() || '';
      const outcome = document.getElementById('exec-prep-outcome')?.value?.trim() || '';
      return [
        `Executive call prep — ${name}`,
        company ? `Company: ${company}` : '',
        units ? `Production: ${units}` : '',
        tier ? `Shape tier: ${tier}` : '',
        notes ? `Notes: ${notes}` : '',
        outcome ? `Outcome/next: ${outcome}` : ''
      ].filter(Boolean).join('\n');
    }

    document.body.appendChild(modal);
  }

  window.openExecCallPrep = openExecCallPrep;

  function init() {
    hideRecruiterSections();
    updateSectionTitles();
    initRecruitingPlaybook();
    if (typeof window.initRecruitingPlanOps === 'function') window.initRecruitingPlanOps();
    initRuoffFactVault();
    console.log('[recruiting-config] Recruiting Sales Coach initialized');
  }

  patchShowSection();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();