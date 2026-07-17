/**
 * Home launchpad personalization for Recruiting Sales Coach.
 * Greeting, setup checklist (profile-first), profile-aware daily loop highlight.
 */
(function () {
  'use strict';

  const CHECKLIST_KEY = 'recruitHomeSetupDismissed';
  const CHECKLIST_MIN_KEY = 'recruitHomeSetupMinimized';

  function getProfile() {
    try {
      if (typeof window.getUserProfile === 'function') return window.getUserProfile();
      return JSON.parse(localStorage.getItem('userProfile') || '{}');
    } catch (e) {
      return {};
    }
  }

  function firstName() {
    const n = (getProfile().name || '').trim();
    return n ? n.split(/\s+/)[0] : '';
  }

  function tod() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  function hasWeeklyPlan() {
    try {
      const raw = localStorage.getItem('savedWeeklyPlan');
      if (!raw) return false;
      const p = JSON.parse(raw);
      return !!(p && (p.days || p.length));
    } catch (e) {
      return !!localStorage.getItem('savedWeeklyPlan');
    }
  }

  function hasBusinessPlan() {
    try {
      const html = localStorage.getItem('savedBusinessPlan');
      if (html && String(html).trim().length > 80) return true;
      return false;
    } catch (e) {
      return false;
    }
  }

  function hasFactVaultUpload() {
    try {
      return !!localStorage.getItem('ruoffFactVaultCustom') || !!localStorage.getItem('ruoffFactVaultOverride');
    } catch (e) {
      return false;
    }
  }

  function profileScore() {
    const p = getProfile();
    let n = 0;
    if (p.name) n += 30;
    if (p.location || p.localArea || p.market) n += 30;
    if (p.tone || p.personality) n += 20;
    if ((p.partnerTypes || p.targetPartners || []).length || p.focus) n += 20;
    return n;
  }

  function getVision() {
    return (window.RECRUITING_PLAN_2026 && window.RECRUITING_PLAN_2026.vision) || null;
  }

  function updateHero() {
    const g = document.getElementById('home-greeting');
    const s = document.getElementById('home-subline');
    const name = firstName();
    if (g) g.textContent = name ? `${tod()}, ${name}.` : `${tod()}. Welcome back.`;
    if (s) {
      const score = profileScore();
      if (score < 40) {
        s.textContent = 'Start with your profile so scripts, voice roleplay context, and weekly plans sound like you. Then run the daily recruiting loop.';
      } else {
        s.textContent = 'Your recruiting launchpad — practice live, review real calls, ship outreach, and keep Ruoff facts close.';
      }
    }

    const visionEl = document.getElementById('home-vision-strip');
    const vision = getVision();
    if (visionEl && vision) {
      visionEl.innerHTML = `
        <div class="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5eead4] mb-1.5">Our vision</div>
        <p class="text-sm sm:text-base text-white/90 m-0 leading-relaxed font-medium">${escapeHtml(vision.statement)}</p>
        ${vision.shortLine ? `<p class="text-xs text-white/50 m-0 mt-2">${escapeHtml(vision.shortLine)}</p>` : ''}
        <button type="button" onclick="window.showSection && window.showSection('recruiting-plan-ops')" class="mt-3 text-xs font-bold text-[#5eead4] hover:text-white transition">
          Open 2026 Plan Operations →
        </button>`;
      visionEl.classList.remove('hidden');
    }

    const stats = document.getElementById('home-hero-stats');
    if (!stats) return;
    const score = profileScore();
    const week = hasWeeklyPlan();
    const plan = hasBusinessPlan();
    const vault = hasFactVaultUpload();
    const goal = (window.RECRUITING_PLAN_2026 && window.RECRUITING_PLAN_2026.annualGoal) || 60;
    const pill = (ok, label) =>
      `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
        ok
          ? 'border-[#00A89D]/45 bg-[#00A89D]/15 text-[#5eead4]'
          : 'border-white/15 bg-white/5 text-white/70'
      }">${label}</span>`;
    stats.innerHTML = [
      pill(true, `${goal} net hires · 2026`),
      pill(score >= 70, `Profile ${score}%`),
      pill(week, week ? 'Week planned' : 'Plan this week'),
      pill(plan, plan ? '2026 plan' : 'No annual plan'),
      pill(vault, vault ? 'Fact vault set' : 'Default vault')
    ].join('');
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getItems() {
    const p = getProfile();
    return [
      {
        id: 'profile',
        short: 'Profile',
        label: 'Complete your recruiter profile',
        blurb: 'Name + market so every tool personalizes.',
        done: !!(p.name && (p.location || p.localArea || p.market)),
        run: () => {
          if (typeof window.openUserProfile === 'function') window.openUserProfile();
        }
      },
      {
        id: 'vault',
        short: 'Facts',
        label: 'Confirm Ruoff Fact Vault',
        blurb: 'Upload the latest vault so scripts stay accurate.',
        done: hasFactVaultUpload(),
        run: () => window.showSection && window.showSection('ruoff-fact-vault')
      },
      {
        id: 'weekly',
        short: 'Weekly',
        label: 'Build this week’s recruiting plan',
        blurb: 'Protected blocks and daily outreach tasks.',
        done: hasWeeklyPlan(),
        run: () => window.showSection && window.showSection('weekly-win-plan')
      },
      {
        id: 'practice',
        short: 'Practice',
        label: 'Run one voice roleplay',
        blurb: 'Live LO prospect practice with your Grok agent.',
        done: (() => {
          try {
            return JSON.parse(localStorage.getItem('recruitingVoiceRoleplayHistory') || '[]').length > 0;
          } catch (e) {
            return false;
          }
        })(),
        run: () => window.showSection && window.showSection('voice-roleplay')
      },
      {
        id: 'review',
        short: 'Review',
        label: 'Review one real call (optional)',
        blurb: 'Upload a recording for STT + coaching scorecard.',
        done: (() => {
          try {
            return JSON.parse(localStorage.getItem('recruitingCallReviews') || '[]').length > 0;
          } catch (e) {
            return false;
          }
        })(),
        run: () => window.showSection && window.showSection('call-review')
      }
    ];
  }

  function highlightDailyLoop() {
    const root = document.getElementById('home-start-here');
    if (!root) return;
    const p = getProfile();
    const focus = String(p.focus || '').toLowerCase();
    let rec = 'plan';
    if (focus.includes('social') || focus.includes('content')) rec = 'content';
    else if (focus.includes('script') || focus.includes('call')) rec = 'script';
    else if (focus.includes('practice') || focus.includes('role')) rec = 'practice';

    root.querySelectorAll('[data-start-step]').forEach((btn) => {
      btn.classList.remove('ring-2', 'ring-[#F15A29]', 'border-[#F15A29]');
      btn.querySelector('.home-rec-badge')?.remove();
    });
    const target = root.querySelector(`[data-start-step="${rec}"]`);
    if (!target) return;
    target.classList.add('ring-2', 'ring-[#F15A29]', 'border-[#F15A29]');
    const b = document.createElement('div');
    b.className = 'home-rec-badge text-[9px] font-bold uppercase tracking-wider text-[#F15A29] mb-1';
    b.textContent = 'Recommended';
    target.insertBefore(b, target.firstChild);
  }

  function renderSetup() {
    const slot = document.getElementById('home-setup-slot');
    if (!slot) return;
    if (localStorage.getItem(CHECKLIST_KEY) === '1') {
      slot.innerHTML = '';
      return;
    }
    const items = getItems();
    const done = items.filter((i) => i.done).length;
    if (done >= items.length) {
      slot.innerHTML = `
        <div class="rounded-2xl border border-[#00A89D]/30 bg-[#00A89D]/10 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="text-sm font-semibold text-[#002B5C] dark:text-white">You’re set up. Run the recruiting day.</div>
          <button type="button" class="text-xs px-3 py-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" id="home-setup-dismiss-ready">Got it</button>
        </div>`;
      document.getElementById('home-setup-dismiss-ready')?.addEventListener('click', () => {
        localStorage.setItem(CHECKLIST_KEY, '1');
        slot.innerHTML = '';
      });
      return;
    }

    const next = items.find((i) => !i.done) || items[0];
    const pct = Math.round((done / items.length) * 100);
    const minimized = localStorage.getItem(CHECKLIST_MIN_KEY) === '1';

    if (minimized) {
      slot.innerHTML = `
        <button type="button" id="home-setup-expand" class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#002B5C] text-white text-left shadow-lg">
          <span class="text-[10px] font-bold uppercase tracking-wider text-[#5eead4]">Setup · ${done}/${items.length}</span>
          <span class="flex-1 text-sm font-semibold truncate">Next: ${next.label}</span>
          <span class="text-xs opacity-80">Expand</span>
        </button>`;
      document.getElementById('home-setup-expand')?.addEventListener('click', () => {
        localStorage.setItem(CHECKLIST_MIN_KEY, '0');
        renderSetup();
      });
      return;
    }

    slot.innerHTML = `
      <div class="rounded-[1.5rem] overflow-hidden border border-white/10 shadow-xl text-white"
           style="background:linear-gradient(155deg,#001429 0%,#002B5C 45%,#063a42 100%)">
        <div class="p-5 sm:p-7">
          <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
            <div>
              <div class="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5eead4] mb-1">Recruiter setup</div>
              <h3 class="text-xl font-bold m-0 tracking-tight">One path. Zero guesswork.</h3>
              <p class="text-sm text-white/50 m-0 mt-1">Profile → facts → weekly plan → practice → real call review.</p>
            </div>
            <div class="flex gap-2">
              <button type="button" id="home-setup-min" class="text-[11px] px-3 py-1.5 rounded-full border border-white/20 text-white/70 hover:bg-white/10">Minimize</button>
              <button type="button" id="home-setup-dismiss" class="text-[11px] px-3 py-1.5 rounded-full border border-white/20 text-white/70 hover:bg-white/10">Dismiss</button>
            </div>
          </div>
          <div class="h-1 rounded-full bg-white/10 mb-5 overflow-hidden"><div class="h-full bg-gradient-to-r from-[#00A89D] to-[#F15A29]" style="width:${pct}%"></div></div>
          <div class="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 mb-5">
            <div class="flex-1 min-w-0">
              <div class="text-[10px] font-bold uppercase tracking-wider text-[#5eead4] mb-1">Next · ${done + 1} of ${items.length}</div>
              <div class="font-bold text-lg">${next.label}</div>
              <p class="text-sm text-white/50 m-0 mt-1">${next.blurb}</p>
            </div>
            <button type="button" id="home-setup-go" class="shrink-0 px-5 py-3 rounded-full font-bold text-sm bg-gradient-to-r from-[#00A89D] to-[#F15A29]">Continue →</button>
          </div>
          <div class="flex flex-wrap gap-2">
            ${items
              .map(
                (it) =>
                  `<button type="button" data-setup-id="${it.id}" class="text-xs px-3 py-1.5 rounded-full border ${
                    it.done ? 'border-[#00A89D]/50 text-[#5eead4]' : it.id === next.id ? 'border-white/40 text-white' : 'border-white/15 text-white/45'
                  }">${it.done ? '✓ ' : ''}${it.short}</button>`
              )
              .join('')}
          </div>
        </div>
      </div>`;

    document.getElementById('home-setup-go')?.addEventListener('click', () => next.run());
    document.getElementById('home-setup-min')?.addEventListener('click', () => {
      localStorage.setItem(CHECKLIST_MIN_KEY, '1');
      renderSetup();
    });
    document.getElementById('home-setup-dismiss')?.addEventListener('click', () => {
      localStorage.setItem(CHECKLIST_KEY, '1');
      slot.innerHTML = '';
    });
    slot.querySelectorAll('[data-setup-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = items.find((i) => i.id === btn.getAttribute('data-setup-id'));
        if (item) item.run();
      });
    });
  }

  function refresh() {
    updateHero();
    renderSetup();
    highlightDailyLoop();
  }

  window.onCoachSectionShown = function (id) {
    if (id === 'home') refresh();
  };

  window.refreshRecruitHome = refresh;

  function init() {
    refresh();
    window.addEventListener('focus', () => setTimeout(refresh, 200));
    document.getElementById('save-profile')?.addEventListener('click', () => setTimeout(refresh, 400));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
