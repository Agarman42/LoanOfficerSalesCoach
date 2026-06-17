/**
 * 2026 Plan Operations — execute Ruoff Recruiting Plan pillars in-app.
 */
(function () {
  'use strict';

  const PLAN = () => window.RECRUITING_PLAN_2026 || {};
  const METRICS = () => window.RECRUITING_METRICS || {};
  const AM_STORAGE = 'recruitingAmMeetingNotes';
  const OUTREACH_STORAGE = 'recruitingOutreachDrafts';

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function copyText(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
      if (!btn) return;
      const orig = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = orig; }, 1200);
    }).catch(() => alert('Copy failed'));
  }

  function loadJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; }
    catch { return fallback; }
  }

  function saveJson(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function renderList(items, className) {
    if (!items?.length) return '';
    return `<ul class="${className || 'text-sm space-y-2 list-disc pl-5 text-gray-700 dark:text-gray-300'}">${items.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`;
  }

  function renderPillarsOverview() {
    const pillars = PLAN().pillars || [];
    const keys = PLAN().keysToSuccess || [];
    return `
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Click any pillar for the full playbook — rhythm, checklist, examples, pitfalls, and one-click links into tools.</p>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6" id="recruiting-pillar-grid">
        ${pillars.map(p => `
          <button type="button" data-pillar-num="${p.num}" class="recruiting-pillar-card group text-left p-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-[#00A89D] hover:shadow-md transition-all cursor-pointer">
            <div class="text-[10px] font-bold tracking-wider text-[#F15A29]">PILLAR ${p.num}</div>
            <h4 class="font-bold text-[#002B5C] dark:text-white mt-1 group-hover:text-[#00A89D] transition">${escapeHtml(p.title)}</h4>
            <div class="text-xs text-[#00A89D] font-semibold mt-2">${escapeHtml(p.frequency)}</div>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">${escapeHtml(p.goal)}</p>
            <div class="mt-3 text-xs text-[#00A89D] font-semibold flex items-center gap-1">Explore pillar <i class="fas fa-arrow-right text-[10px] group-hover:translate-x-0.5 transition-transform"></i></div>
          </button>`).join('')}
      </div>
      <div class="p-5 rounded-2xl border border-dashed border-[#002B5C]/30 bg-[#002B5C]/5">
        <h4 class="font-bold text-[#002B5C] dark:text-white mb-3">Keys to Success (2026 Plan)</h4>
        ${renderList(keys)}
        <p class="text-xs text-gray-500 mt-3 italic">New recruiters: the first 30 days go sideways when outreach volume drops and rejection isn&apos;t reframed. Protect Tue–Thu phones — everything else supports that.</p>
      </div>`;
  }

  function renderPillarModalBody(num) {
    const pillar = (PLAN().pillars || []).find(p => p.num === num);
    const d = PLAN().pillarDetails?.[num];
    if (!pillar || !d) return '<p class="text-sm text-gray-500">Pillar details loading…</p>';

    const examplesHtml = (d.examples || []).map(ex => `
      <div class="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-sm space-y-2">
        ${ex.situation ? `<div><span class="font-semibold text-[#002B5C] dark:text-white">Situation:</span> ${escapeHtml(ex.situation)}</div>` : ''}
        ${ex.angle ? `<div><span class="font-semibold text-[#00A89D]">Angle:</span> ${escapeHtml(ex.angle)}</div>` : ''}
        ${ex.action ? `<div><span class="font-semibold text-[#F15A29]">Action:</span> ${escapeHtml(ex.action)}</div>` : ''}
        ${ex.good ? `<div><span class="font-semibold text-green-700 dark:text-green-400">Works:</span> <span class="italic">${escapeHtml(ex.good)}</span></div>` : ''}
        ${ex.bad ? `<div><span class="font-semibold text-red-600 dark:text-red-400">Avoid:</span> <span class="italic">${escapeHtml(ex.bad)}</span></div>` : ''}
      </div>`).join('');

    const channelHtml = (d.channelGuide || []).map(c => `
      <div class="text-sm"><strong class="text-[#002B5C] dark:text-white">${escapeHtml(c.channel)}</strong> — <span class="text-gray-600 dark:text-gray-400">${escapeHtml(c.use)}</span></div>`).join('');

    const tierHtml = d.tierGuide ? `
      <div class="grid sm:grid-cols-3 gap-2 text-sm">
        ${Object.entries(d.tierGuide).map(([k, v]) => `
          <div class="p-3 rounded-xl border border-[#00A89D]/30 bg-[#00A89D]/5">
            <div class="font-bold text-[#00A89D]">${escapeHtml(k)}-tier</div>
            <div class="text-gray-700 dark:text-gray-300 mt-1">${escapeHtml(v)}</div>
          </div>`).join('')}
      </div>` : '';

    const actionsHtml = (d.actions || []).map((a, i) => `
      <button type="button" class="pillar-modal-action px-4 py-2 rounded-xl text-sm font-semibold transition ${i === 0 ? 'bg-[#002B5C] text-white hover:bg-black' : 'border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white'}"
        data-action-tab="${escapeHtml(a.tab || '')}" data-action-section="${escapeHtml(a.section || '')}">${escapeHtml(a.label)}</button>`).join('');

    return `
      <div class="text-[10px] font-bold tracking-wider text-[#F15A29] mb-1">PILLAR ${pillar.num}</div>
      <h3 class="text-2xl font-bold text-[#002B5C] dark:text-white mb-4">${escapeHtml(pillar.title)}</h3>

      <section class="mb-5">
        <h4 class="text-sm font-bold text-[#00A89D] uppercase tracking-wide mb-2">North star</h4>
        <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">${escapeHtml(d.northStar)}</p>
      </section>

      <section class="mb-5">
        <h4 class="text-sm font-bold text-[#00A89D] uppercase tracking-wide mb-2">Rhythm</h4>
        <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">${escapeHtml(d.rhythm)}</p>
      </section>

      <section class="mb-5">
        <h4 class="text-sm font-bold text-[#002B5C] dark:text-white mb-2">This week&apos;s checklist</h4>
        <div class="space-y-2">
          ${(d.checklist || []).map(item => `
            <div class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
              <i class="fas fa-check-circle text-[#00A89D] mt-0.5 shrink-0"></i><span>${escapeHtml(item)}</span>
            </div>`).join('')}
        </div>
      </section>

      ${tierHtml ? `<section class="mb-5"><h4 class="text-sm font-bold text-[#002B5C] dark:text-white mb-2">A / B / C tiering</h4>${tierHtml}</section>` : ''}
      ${d.hunterNote ? `<section class="mb-5 p-4 rounded-2xl border border-[#F15A29]/30 bg-[#F15A29]/5"><h4 class="text-sm font-bold text-[#F15A29] mb-1">Hunter sourcing agent</h4><p class="text-sm text-gray-700 dark:text-gray-300">${escapeHtml(d.hunterNote)}</p></section>` : ''}
      ${channelHtml ? `<section class="mb-5"><h4 class="text-sm font-bold text-[#002B5C] dark:text-white mb-2">Channel guide</h4><div class="space-y-2">${channelHtml}</div></section>` : ''}
      ${d.pitchFreeFails?.length ? `<section class="mb-5"><h4 class="text-sm font-bold text-[#002B5C] dark:text-white mb-2">Pitch-free test failures</h4>${renderList(d.pitchFreeFails)}</section>` : ''}
      ${d.qualityConversation ? `<section class="mb-5 grid sm:grid-cols-2 gap-3"><div class="p-4 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"><div class="font-bold text-green-800 dark:text-green-300 text-sm mb-1">Quality conversation</div><p class="text-sm text-gray-700 dark:text-gray-300">${escapeHtml(d.qualityConversation.yes)}</p></div><div class="p-4 rounded-xl border border-gray-200 dark:border-gray-700"><div class="font-bold text-gray-600 text-sm mb-1">Polite brush-off</div><p class="text-sm text-gray-700 dark:text-gray-300">${escapeHtml(d.qualityConversation.no)}</p></div></section>` : ''}
      ${d.funnelExplain ? `<section class="mb-5 p-4 rounded-2xl border border-[#002B5C]/30 bg-[#002B5C]/5"><h4 class="text-sm font-bold text-[#002B5C] dark:text-white mb-1">85 gross → 60 net</h4><p class="text-sm text-gray-700 dark:text-gray-300">${escapeHtml(d.funnelExplain)}</p></section>` : ''}
      ${d.coachingThreshold ? `<section class="mb-5"><h4 class="text-sm font-bold text-[#002B5C] dark:text-white mb-2">On pace vs coaching</h4><p class="text-sm text-gray-700 dark:text-gray-300">${escapeHtml(d.coachingThreshold)}</p></section>` : ''}
      ${d.monthlyReview ? `<section class="mb-5"><h4 class="text-sm font-bold text-[#002B5C] dark:text-white mb-2">Monthly dashboard review</h4><p class="text-sm text-gray-700 dark:text-gray-300">${escapeHtml(d.monthlyReview)}</p></section>` : ''}
      ${d.adamCoaching ? `<section class="mb-5"><h4 class="text-sm font-bold text-[#002B5C] dark:text-white mb-2">Adam&apos;s Monday / Wednesday rhythm</h4><p class="text-sm text-gray-700 dark:text-gray-300">${escapeHtml(d.adamCoaching)}</p></section>` : ''}
      ${d.territoryNote ? `<section class="mb-5 p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20"><h4 class="text-sm font-bold text-amber-800 dark:text-amber-300 mb-1">Territory focus</h4><p class="text-sm text-gray-700 dark:text-gray-300">${escapeHtml(d.territoryNote)}</p></section>` : ''}

      ${examplesHtml ? `<section class="mb-5"><h4 class="text-sm font-bold text-[#002B5C] dark:text-white mb-2">Real-world examples</h4><div class="space-y-3">${examplesHtml}</div></section>` : ''}

      <section class="mb-5">
        <h4 class="text-sm font-bold text-red-600 dark:text-red-400 mb-2">Common pitfalls</h4>
        ${renderList(d.pitfalls)}
      </section>

      ${d.redFlags?.length ? `<section class="mb-5"><h4 class="text-sm font-bold text-[#002B5C] dark:text-white mb-2">Red flags — don&apos;t waste time</h4>${renderList(d.redFlags)}</section>` : ''}

      ${d.ruoffAngles?.length ? `<section class="mb-5"><h4 class="text-sm font-bold text-[#002B5C] dark:text-white mb-2">Ruoff angles (see Fact Vault)</h4><p class="text-sm text-gray-600 dark:text-gray-400">${d.ruoffAngles.map(a => escapeHtml(a)).join(' • ')}</p></section>` : ''}

      <section class="mb-6 p-4 rounded-2xl border border-[#00A89D]/40 bg-[#00A89D]/5">
        <h4 class="text-sm font-bold text-[#00A89D] mb-1">Metrics</h4>
        <p class="text-sm font-semibold text-[#002B5C] dark:text-white">${escapeHtml(d.metrics)}</p>
      </section>

      <div class="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        ${actionsHtml}
      </div>`;
  }

  function ensurePillarModal() {
    let modal = document.getElementById('recruiting-pillar-modal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'recruiting-pillar-modal';
    modal.className = 'fixed inset-0 z-[200] hidden items-center justify-center p-4';
    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" data-pillar-modal-close></div>
      <div class="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 md:p-8 animate-fade-in">
        <button type="button" data-pillar-modal-close class="absolute top-4 right-4 w-10 h-10 rounded-full border border-gray-200 dark:border-gray-600 text-gray-400 hover:text-red-500 hover:border-red-300 text-xl leading-none" aria-label="Close">&times;</button>
        <div id="recruiting-pillar-modal-body"></div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelectorAll('[data-pillar-modal-close]').forEach(el => {
      el.addEventListener('click', closeRecruitingPillarModal);
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeRecruitingPillarModal();
    });
    return modal;
  }

  function closeRecruitingPillarModal() {
    const modal = document.getElementById('recruiting-pillar-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }

  function openRecruitingPillarModal(num) {
    const modal = ensurePillarModal();
    const body = document.getElementById('recruiting-pillar-modal-body');
    if (body) body.innerHTML = renderPillarModalBody(num);
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    body?.querySelectorAll('.pillar-modal-action').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.actionTab;
        const section = btn.dataset.actionSection;
        closeRecruitingPillarModal();
        if (tab) switchTab(tab);
        if (section && typeof window.showSection === 'function') {
          setTimeout(() => window.showSection(section), tab ? 50 : 0);
        }
      });
    });
  }

  window.openRecruitingPillarModal = openRecruitingPillarModal;
  window.closeRecruitingPillarModal = closeRecruitingPillarModal;

  function renderMondaySourcing() {
    const tools = PLAN().sourcingTools || [];
    const checklist = PLAN().mondaySourcingChecklist || [];
    const criteria = METRICS().candidateCriteria || {};
    return `
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Monday sourcing ritual — run before Tue–Thu outreach blocks. Log everything in Shape.</p>
      <div class="grid md:grid-cols-2 gap-4 mb-6">
        <div class="p-5 rounded-2xl border border-[#00A89D]/30 bg-[#00A89D]/5">
          <h4 class="font-bold text-[#00A89D] mb-2">Candidate Criteria</h4>
          <ul class="text-sm space-y-1 text-gray-700 dark:text-gray-300">
            <li>• ${escapeHtml(criteria.productionVolume || '30–70 units')}</li>
            <li>• ${escapeHtml(criteria.purchaseFocus || '50%+ purchase')}</li>
            <li>• ${escapeHtml(criteria.sourcingFrequency || 'Weekly review')}</li>
          </ul>
        </div>
        <div class="p-5 rounded-2xl border border-gray-200 dark:border-gray-700">
          <h4 class="font-bold text-[#002B5C] dark:text-white mb-2">Weekly Sourcing Tools</h4>
          <ul class="text-sm space-y-2">
            ${tools.map(t => `<li><strong>${escapeHtml(t.name)}</strong> — <span class="text-gray-500">${escapeHtml(t.note)}</span></li>`).join('')}
          </ul>
        </div>
      </div>
      <h4 class="font-bold text-[#002B5C] dark:text-white mb-3">Monday Checklist</h4>
      <div class="space-y-2" id="monday-sourcing-checklist">
        ${checklist.map((item, i) => `
          <label class="flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-[#00A89D]">
            <input type="checkbox" class="mt-1 accent-[#00A89D]" data-sourcing-idx="${i}">
            <span class="text-sm text-gray-700 dark:text-gray-300">${escapeHtml(item)}</span>
          </label>`).join('')}
      </div>
      <button type="button" id="goto-weekly-from-sourcing" class="mt-4 px-5 py-2.5 rounded-2xl bg-[#002B5C] text-white text-sm font-semibold hover:bg-black transition">
        Open Weekly Recruiting Plan →
      </button>`;
  }

  function renderOutreachContent() {
    const types = PLAN().outreachContentTypes || [];
    return `
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">One value message per week — rotate Sales Tips, Friday Funny, and Value-Add. AI polishes; you add the human touch. Optional survey snippet below.</p>
      <div class="grid md:grid-cols-3 gap-4 mb-6">
        ${types.map(t => `
          <div class="p-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <h4 class="font-bold text-[#F15A29]">${escapeHtml(t.label)}</h4>
            <div class="text-xs text-gray-500 mt-1">${escapeHtml(t.cadence)}</div>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">${escapeHtml(t.description)}</p>
            <button type="button" class="outreach-gen-btn mt-4 w-full py-2 rounded-xl bg-[#00A89D] text-white text-sm font-semibold hover:bg-[#008F85] transition" data-type="${t.id}">
              Generate draft
            </button>
          </div>`).join('')}
      </div>
      <div class="mb-4">
        <label class="text-xs font-semibold text-gray-500">Optional context (prospect name, market, angle)</label>
        <input type="text" id="outreach-context" class="w-full mt-1 p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm" placeholder="e.g. Top producer in Columbus, purchase-focused, warm on LinkedIn">
      </div>
      <label class="flex items-center gap-2 text-sm mb-4 cursor-pointer">
        <input type="checkbox" id="outreach-use-survey" class="accent-[#00A89D]"> Include a "What's It Really Like at Ruoff" survey snippet when relevant
      </label>
      <div id="outreach-output" class="hidden p-5 rounded-2xl border border-[#00A89D]/40 bg-[#00A89D]/5 text-sm whitespace-pre-wrap"></div>`;
  }

  function renderAmMeeting() {
    const agenda = PLAN().amMeetingAgenda || [];
    const territories = PLAN().territories || [];
    const saved = loadJson(AM_STORAGE, {});
    return `
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Monthly Area Manager collaboration — 5 core topics. Prep notes here, copy for the meeting.</p>
      <div class="grid md:grid-cols-2 gap-3 mb-6 text-sm">
        ${territories.map(t => `
          <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <strong>${escapeHtml(t.recruiter)}</strong> — ${escapeHtml(t.region)}<br>
            <span class="text-gray-500 text-xs">AMs: ${escapeHtml(t.areaManagers)}</span>
          </div>`).join('')}
      </div>
      <div class="space-y-4" id="am-agenda-fields">
        ${agenda.map(a => `
          <div class="p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
            <div class="font-semibold text-[#002B5C] dark:text-white mb-1">Topic ${a.topic}: ${escapeHtml(a.title)}</div>
            <p class="text-xs text-gray-500 mb-2">${escapeHtml(a.question)}</p>
            <textarea data-am-topic="${a.topic}" rows="2" class="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
              placeholder="Your notes, intel, and follow-ups...">${escapeHtml(saved[a.topic] || '')}</textarea>
          </div>`).join('')}
      </div>
      <button type="button" id="am-copy-notes" class="mt-4 px-5 py-2.5 rounded-2xl border border-[#00A89D] text-[#00A89D] text-sm font-semibold hover:bg-[#00A89D] hover:text-white transition">Copy all AM notes</button>`;
  }

  function renderAdamWeekly() {
    const { monday, wednesday } = PLAN().adamMeetings || {};
    const rolePlays = PLAN().rolePlayScenarios || [];
    return `
      <div class="grid md:grid-cols-2 gap-6 mb-6">
        <div class="p-5 rounded-2xl border border-[#F15A29]/30 bg-[#F15A29]/5">
          <h4 class="font-bold text-[#F15A29] mb-3">${escapeHtml(monday?.title || 'Monday Meeting')}</h4>
          <ul class="text-sm space-y-2 list-disc pl-5 text-gray-700 dark:text-gray-300">
            ${(monday?.items || []).map(i => `<li>${escapeHtml(i)}</li>`).join('')}
          </ul>
          <button type="button" id="adam-open-scorecard" class="mt-4 text-xs text-[#00A89D] font-semibold hover:underline">Open weekly scorecard →</button>
        </div>
        <div class="p-5 rounded-2xl border border-[#002B5C]/30 bg-[#002B5C]/5">
          <h4 class="font-bold text-[#002B5C] dark:text-white mb-3">${escapeHtml(wednesday?.title || 'Wednesday Meeting')}</h4>
          <ul class="text-sm space-y-2 list-disc pl-5 text-gray-700 dark:text-gray-300">
            ${(wednesday?.items || []).map(i => `<li>${escapeHtml(i)}</li>`).join('')}
          </ul>
          <button type="button" id="adam-open-scripts" class="mt-4 text-xs text-[#00A89D] font-semibold hover:underline">Open Script Generator for role-play →</button>
        </div>
      </div>
      <h4 class="font-bold text-[#002B5C] dark:text-white mb-3">Wednesday Role-Play Starters</h4>
      <div class="space-y-2">
        ${rolePlays.map((s, i) => `
          <div class="flex justify-between gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm">
            <span class="text-gray-700 dark:text-gray-300">${escapeHtml(s)}</span>
            <button type="button" class="roleplay-btn shrink-0 text-xs px-3 py-1 rounded-lg border border-[#00A89D] text-[#00A89D] font-semibold" data-scenario="${escapeHtml(s)}">Practice</button>
          </div>`).join('')}
      </div>`;
  }

  function renderSurveyProof() {
    const snippets = PLAN().surveySnippets || [];
    return `
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">"What's It Really Like at Ruoff" — peer social proof for outreach, social posts, and recruiting calls.</p>
      <div class="space-y-4">
        ${snippets.map((s, i) => `
          <div class="p-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <p class="text-sm italic text-gray-800 dark:text-gray-200">"${escapeHtml(s.quote)}"</p>
            <p class="text-xs text-[#00A89D] font-semibold mt-2">— ${escapeHtml(s.attribution)}</p>
            <div class="flex flex-wrap gap-2 mt-3">
              <button type="button" class="survey-copy text-xs px-3 py-1.5 rounded-xl border border-[#00A89D] text-[#00A89D] font-semibold" data-text="${escapeHtml(s.quote)}">Copy quote</button>
              <button type="button" class="survey-to-script text-xs px-3 py-1.5 rounded-xl border border-[#002B5C] text-[#002B5C] font-semibold" data-text="${escapeHtml(s.quote)}">→ Script context</button>
              <button type="button" class="survey-to-social text-xs px-3 py-1.5 rounded-xl border border-[#F15A29] text-[#F15A29] font-semibold" data-text="${escapeHtml(s.quote)}">→ Social seed</button>
            </div>
          </div>`).join('')}
      </div>`;
  }

  function renderMonthlyMetrics() {
    const m = METRICS().monthly || {};
    const saved = loadJson('recruitingMonthlyTracker', {});
    const monthKey = new Date().toISOString().slice(0, 7);
    const cur = saved[monthKey] || { hires: 0, netChange: 0, notes: '' };
    return `
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Monthly dashboard review — discuss in Monday meetings with Adam. Shape is system of record.</p>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div class="p-4 rounded-2xl border text-center bg-white dark:bg-gray-900">
          <div class="text-2xl font-black text-[#F15A29]">${m.netHires || 7}</div>
          <div class="text-[10px] font-semibold text-gray-500 uppercase">Monthly hire target</div>
        </div>
        <div class="p-4 rounded-2xl border text-center bg-white dark:bg-gray-900">
          <div class="text-2xl font-black text-[#002B5C] dark:text-white">${METRICS().annualGoal?.netHires || 60}</div>
          <div class="text-[10px] font-semibold text-gray-500 uppercase">Annual goal</div>
        </div>
        <div class="p-4 rounded-2xl border text-center bg-white dark:bg-gray-900">
          <div class="text-lg font-bold text-[#00A89D]">${m.outreachAttempts?.min || '—'}–${m.outreachAttempts?.max || '—'}</div>
          <div class="text-[10px] font-semibold text-gray-500 uppercase">Outreach / mo</div>
        </div>
        <div class="p-4 rounded-2xl border text-center bg-white dark:bg-gray-900">
          <div class="text-lg font-bold text-[#00A89D]">${m.qualityConversations?.min || '—'}–${m.qualityConversations?.max || '—'}</div>
          <div class="text-[10px] font-semibold text-gray-500 uppercase">Quality convos / mo</div>
        </div>
      </div>
      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <label class="text-xs font-semibold text-gray-500">Hires secured this month</label>
          <input type="number" min="0" id="monthly-hires" value="${cur.hires}" class="w-full mt-1 p-3 rounded-xl border text-2xl font-bold">
        </div>
        <div>
          <label class="text-xs font-semibold text-gray-500">Net headcount change</label>
          <input type="number" id="monthly-net" value="${cur.netChange}" class="w-full mt-1 p-3 rounded-xl border text-2xl font-bold">
        </div>
      </div>
      <div class="mt-4">
        <label class="text-xs font-semibold text-gray-500">Monthly notes (wins, gaps, adjustments)</label>
        <textarea id="monthly-notes" rows="3" class="w-full mt-1 p-3 rounded-xl border text-sm">${escapeHtml(cur.notes)}</textarea>
      </div>
      <button type="button" id="monthly-save" class="mt-4 px-5 py-2.5 rounded-2xl bg-[#00A89D] text-white text-sm font-semibold">Save monthly snapshot</button>`;
  }

  const PANELS = {
    overview: { label: '6 Pillars', icon: 'fa-th-large', render: renderPillarsOverview },
    sourcing: { label: 'Monday Sourcing', icon: 'fa-search', render: renderMondaySourcing },
    outreach: { label: 'Outreach Content', icon: 'fa-envelope', render: renderOutreachContent },
    am: { label: 'AM Meeting', icon: 'fa-users', render: renderAmMeeting },
    adam: { label: 'Adam Weekly', icon: 'fa-calendar-check', render: renderAdamWeekly },
    survey: { label: 'Survey Proof', icon: 'fa-quote-left', render: renderSurveyProof },
    monthly: { label: 'Monthly Metrics', icon: 'fa-chart-bar', render: renderMonthlyMetrics }
  };

  function switchTab(tabId) {
    const root = document.getElementById('recruiting-plan-ops-content');
    if (!root) return;
    root.querySelectorAll('.plan-ops-tab').forEach(btn => {
      const active = btn.dataset.tab === tabId;
      btn.className = `plan-ops-tab px-4 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap shrink-0 transition flex items-center gap-2 ${
        active ? 'bg-[#002B5C] text-white shadow-md' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-[#00A89D]'
      }`;
    });
    const panel = root.querySelector('#plan-ops-panel');
    if (panel && PANELS[tabId]) {
      panel.innerHTML = PANELS[tabId].render();
      wirePanel(tabId, panel);
    }
  }

  async function generateOutreach(typeId) {
    const types = PLAN().outreachContentTypes || [];
    const type = types.find(t => t.id === typeId);
    if (!type || typeof window.callGrokAPI !== 'function') {
      alert('AI not ready — check proxy connection.');
      return;
    }
    const ctx = document.getElementById('outreach-context')?.value?.trim() || '';
    const useSurvey = document.getElementById('outreach-use-survey')?.checked;
    let surveyBit = '';
    if (useSurvey) {
      const snip = (PLAN().surveySnippets || [])[0];
      if (snip) surveyBit = `\nOptional survey social proof to weave in (paraphrase, don't copy verbatim): "${snip.quote}" — ${snip.attribution}`;
    }
    const out = document.getElementById('outreach-output');
    if (out) {
      out.classList.remove('hidden');
      out.textContent = 'Generating…';
    }
    const prompt = `You are a Ruoff Mortgage loan officer recruiter writing outreach.

${type.promptHint}

${ctx ? `Context: ${ctx}` : ''}
${surveyBit}

Also provide:
1) PITCH-FREE CHECK: one sentence confirming this reads as helpful, not salesy (8-10 word max)
2) ENGAGEMENT SCORE: rate 1-10 with one-line reason

Output the message first, then "---", then the pitch-free check, then engagement score.`;
    try {
      const text = await window.callGrokAPI(prompt, { temperature: 0.75, max_tokens: 600 });
      if (out) out.textContent = text;
      const drafts = loadJson(OUTREACH_STORAGE, {});
      drafts[typeId] = { text, at: new Date().toISOString() };
      saveJson(OUTREACH_STORAGE, drafts);
    } catch (e) {
      if (out) out.textContent = 'Generation failed — check proxy.';
    }
  }

  function wirePanel(tabId, panel) {
    panel.querySelectorAll('.recruiting-pillar-card').forEach(card => {
      card.addEventListener('click', () => {
        const num = parseInt(card.dataset.pillarNum, 10);
        if (num) openRecruitingPillarModal(num);
      });
    });
    panel.querySelector('#goto-weekly-from-sourcing')?.addEventListener('click', () => {
      if (typeof window.showSection === 'function') window.showSection('weekly-win-plan');
    });
    panel.querySelectorAll('.outreach-gen-btn').forEach(btn => {
      btn.addEventListener('click', () => generateOutreach(btn.dataset.type));
    });
    panel.querySelector('#am-copy-notes')?.addEventListener('click', () => {
      const lines = (PLAN().amMeetingAgenda || []).map(a => {
        const notes = panel.querySelector(`[data-am-topic="${a.topic}"]`)?.value || '';
        return `Topic ${a.topic} — ${a.title}\nQ: ${a.question}\nNotes: ${notes || '(none)'}`;
      });
      copyText(lines.join('\n\n'), panel.querySelector('#am-copy-notes'));
    });
    panel.querySelectorAll('[data-am-topic]').forEach(ta => {
      ta.addEventListener('change', () => {
        const saved = loadJson(AM_STORAGE, {});
        saved[ta.dataset.amTopic] = ta.value;
        saveJson(AM_STORAGE, saved);
      });
    });
    panel.querySelector('#adam-open-scorecard')?.addEventListener('click', () => {
      if (typeof window.showSection === 'function') window.showSection('weekly-win-plan');
    });
    panel.querySelector('#adam-open-scripts')?.addEventListener('click', () => {
      if (typeof window.showSection === 'function') window.showSection('recruiting-script');
    });
    panel.querySelectorAll('.roleplay-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const scenario = btn.dataset.scenario || '';
        if (typeof window.showSection === 'function') window.showSection('recruiting-script');
        setTimeout(() => {
          const ta = document.getElementById('script-context');
          if (ta) ta.value = `Wednesday role-play practice:\n${scenario}`;
        }, 400);
      });
    });
    panel.querySelectorAll('.survey-copy').forEach(btn => {
      btn.addEventListener('click', () => copyText(btn.dataset.text, btn));
    });
    panel.querySelectorAll('.survey-to-script').forEach(btn => {
      btn.addEventListener('click', () => {
        const q = btn.dataset.text || '';
        if (typeof window.showSection === 'function') window.showSection('recruiting-script');
        setTimeout(() => {
          const ta = document.getElementById('script-context');
          if (ta) ta.value = `Survey social proof reference (paraphrase naturally): "${q}"`;
        }, 400);
      });
    });
    panel.querySelectorAll('.survey-to-social').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.ToolBridges?.sendIdeaToSocial) {
          window.ToolBridges.sendIdeaToSocial(`Ruoff culture spotlight — ${btn.dataset.text}`, 'survey proof');
        } else if (typeof window.showSection === 'function') {
          window.showSection('social-post');
        }
      });
    });
    panel.querySelector('#monthly-save')?.addEventListener('click', () => {
      const monthKey = new Date().toISOString().slice(0, 7);
      const store = loadJson('recruitingMonthlyTracker', {});
      store[monthKey] = {
        hires: parseInt(panel.querySelector('#monthly-hires')?.value, 10) || 0,
        netChange: parseInt(panel.querySelector('#monthly-net')?.value, 10) || 0,
        notes: panel.querySelector('#monthly-notes')?.value || ''
      };
      saveJson('recruitingMonthlyTracker', store);
      if (typeof window.showToast === 'function') window.showToast('Monthly snapshot saved', 'success');
    });
  }

  function initRecruitingPlanOps() {
    const container = document.getElementById('recruiting-plan-ops-content');
    if (!container || container.dataset.ready) return;
    container.dataset.ready = '1';

    const tabKeys = Object.keys(PANELS);
    container.innerHTML = `
      <div class="flex gap-2 overflow-x-auto pb-2 mb-6 plan-ops-tabs">${tabKeys.map((id, i) => `
        <button type="button" data-tab="${id}" class="plan-ops-tab px-4 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap shrink-0 transition flex items-center gap-2 ${
          i === 0 ? 'bg-[#002B5C] text-white shadow-md' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-[#00A89D]'
        }"><i class="fas ${PANELS[id].icon}"></i> ${PANELS[id].label}</button>`).join('')}
      </div>
      <div id="plan-ops-panel"></div>`;

    container.querySelectorAll('.plan-ops-tab').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    switchTab('overview');
  }

  window.initRecruitingPlanOps = initRecruitingPlanOps;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initRecruitingPlanOps, 300));
  } else {
    setTimeout(initRecruitingPlanOps, 300);
  }
})();