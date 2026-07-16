/**
 * js/features/onboarding-coach.js
 * Profile nudge, first-run checklist, section micro-guides, profile-aware Start Here,
 * tool-specific profile tips, Weekly Win Plan ↔ Value Vault cross-links.
 */
(function () {
  'use strict';

  const DISMISS_PREFIX = 'coachGuideDismissed_';
  const PROFILE_NUDGE_KEY = 'coachProfileNudgeDismissed';
  const CHECKLIST_DISMISS_KEY = 'coachFirstRunChecklistDismissed';
  const CHECKLIST_VERSION = '2'; // bump when step order/copy changes so hide resets

  function getProfile() {
    if (typeof window.getUserProfile === 'function') return window.getUserProfile();
    try {
      return JSON.parse(localStorage.getItem('userProfile') || '{}');
    } catch (e) {
      return {};
    }
  }

  function getProfileCompleteness() {
    if (typeof window.getProfileCompleteness === 'function') {
      return window.getProfileCompleteness(getProfile());
    }
    const p = getProfile();
    return { score: 0, missing: ['profile'], isComplete: false };
  }

  function renderProfileNudge() {
    const slot = document.getElementById('global-profile-nudge')
      || document.querySelector('main');
    if (!slot) return;

    if (sessionStorage.getItem(PROFILE_NUDGE_KEY) === '1') {
      document.getElementById('coach-profile-nudge')?.remove();
      if (slot.id === 'global-profile-nudge') slot.innerHTML = '';
      return;
    }

    const { score, missing, isComplete } = getProfileCompleteness();
    if (isComplete) {
      document.getElementById('coach-profile-nudge')?.remove();
      if (slot.id === 'global-profile-nudge') slot.innerHTML = '';
      return;
    }

    document.getElementById('coach-profile-nudge')?.remove();

    let banner = document.createElement('div');
    banner.id = 'coach-profile-nudge';
    if (slot.id === 'global-profile-nudge') {
      slot.innerHTML = '';
      slot.appendChild(banner);
    } else {
      slot.insertBefore(banner, slot.firstChild);
    }

    const missingLabel = missing.slice(0, 3).map((m) => (typeof m === 'string' ? m : m.hint)).join(', ');
    banner.className = 'mb-6';
    banner.innerHTML = `
      <div class="rounded-2xl border border-[#F15A29]/40 bg-gradient-to-r from-[#F15A29]/8 to-[#00A89D]/8 p-4 md:p-5">
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-[#F15A29]/15 flex items-center justify-center flex-shrink-0">
              <i class="fas fa-user-edit text-[#F15A29]"></i>
            </div>
            <div>
              <div class="font-semibold text-[#002B5C] dark:text-white text-sm">Personalize your coach (${score}% complete)</div>
              <div class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Add ${missingLabel} so AI answers, weekly plans, and scripts sound like <em>you</em> — not generic filler.</div>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <button type="button" id="coach-profile-nudge-open" class="text-xs px-4 py-2 rounded-xl bg-[#00A89D] text-white font-semibold hover:bg-[#008F85] transition">Complete Profile</button>
            <button type="button" id="coach-profile-nudge-dismiss" class="text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition">Later</button>
          </div>
        </div>
        <div class="mt-2 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div class="h-full rounded-full bg-gradient-to-r from-[#F15A29] to-[#00A89D] transition-all" style="width:${score}%"></div>
        </div>
      </div>
    `;

    document.getElementById('coach-profile-nudge-open')?.addEventListener('click', () => {
      if (typeof window.openUserProfile === 'function') window.openUserProfile(true);
    });
    document.getElementById('coach-profile-nudge-dismiss')?.addEventListener('click', () => {
      sessionStorage.setItem(PROFILE_NUDGE_KEY, '1');
      banner.remove();
      document.getElementById('global-profile-nudge')?.replaceChildren();
    });
  }

  function getRecommendedStartStep() {
    const p = getProfile();
    const focus = (p.focus || p.focusLabel || '').toLowerCase();
    const challenges = (Array.isArray(p.challenges) ? p.challenges : []).join(' ').toLowerCase();
    const partners = (p.partnerTypes || p.targetPartners || []).join(' ').toLowerCase();

    if (focus === 'database' || focus.includes('database') || focus.includes('past client') || challenges.includes('database') || challenges.includes('sphere') || challenges.includes('past client')) {
      return 'nurture';
    }
    if (focus.includes('social') || focus.includes('content') || challenges.includes('content') || challenges.includes('social')) {
      return 'content';
    }
    if (focus === 'equity-refi' || focus.includes('equity') || focus.includes('refi') || challenges.includes('pipeline')) {
      return 'opportunity';
    }
    if (focus === 'referral-partners' || partners.includes('realtor') || focus.includes('referral') || focus.includes('partner') || challenges.includes('referral') || challenges.includes('realtor')) {
      return 'gift';
    }
    return 'plan';
  }

  function applyProfileAwareStartHere() {
    const grid = document.querySelector('#coach-start-here .grid');
    if (!grid) return;

    const stepMap = {
      plan: 'weekly-win-plan',
      gift: 'value-vault',
      nurture: 'database',
      content: 'social',
      opportunity: 'equity-scanner'
    };

    const recommended = getRecommendedStartStep();
    const recommendedSection = stepMap[recommended];

    grid.querySelectorAll('button[data-start-step]').forEach((btn) => {
      btn.classList.remove('ring-2', 'ring-[#F15A29]', 'border-[#F15A29]');
      const badge = btn.querySelector('.start-here-badge');
      if (badge) badge.remove();
    });

    grid.querySelectorAll('button[data-start-step]').forEach((btn) => {
      const onclick = btn.getAttribute('onclick') || '';
      if (!onclick.includes(`'${recommendedSection}'`)) return;
      btn.classList.add('ring-2', 'ring-[#F15A29]', 'border-[#F15A29]');
      const badge = document.createElement('div');
      badge.className = 'start-here-badge text-[9px] font-bold uppercase tracking-wider text-[#F15A29] mb-1';
      badge.textContent = 'Recommended for you';
      btn.insertBefore(badge, btn.firstChild);
    });
  }

  const SECTION_GUIDES = {
    'weekly-win-plan': {
      icon: 'fa-fire',
      title: 'Start here this week',
      body: 'Generate your plan, block 2–3 power hours on your calendar, then execute one partner touch from Value Vault the same day.',
      action: { label: 'Pick a Pop-By →', section: 'value-vault' },
      needsProfile: ['name', 'location']
    },
    'value-vault': {
      icon: 'fa-gift',
      title: 'Turn ideas into touches',
      body: 'Search or filter the Pop-By library, copy a note, deliver within 48 hours, then log the touch in your Weekly Win Plan.',
      action: { label: 'Back to Weekly Plan →', section: 'weekly-win-plan' }
    },
    'referrals': {
      icon: 'fa-handshake',
      title: 'Partner growth mode',
      body: 'Open your partner playbook, scan the Ruoff Fact Vault for differentiators, then run the 60-day onboarding on your next new realtor.',
      action: { label: 'Ruoff facts ↓', section: 'referrals', scroll: 'ruoff-fact-vault-section' }
    },
    'database': {
      icon: 'fa-database',
      title: 'Nurture with intention',
      body: 'Rank A/B/C clients, pick one nurture template from Value Vault Pillar 5, and schedule it in a Weekly Win time block.',
      action: { label: 'Nurture templates →', section: 'value-vault', pillar: 5 }
    },
    'social': {
      icon: 'fa-share-alt',
      title: 'Content that compounds',
      body: 'Open one expanded pillar for copy-ready posts, save 2 winners to My Saved Items, and schedule them in Social Post Creator.',
      action: { label: 'Weekly Win Plan →', section: 'weekly-win-plan' }
    },
    'social-post': {
      icon: 'fa-magic',
      title: 'Batch content in minutes',
      body: 'Generate 3 post options or a full 30-day calendar. Save winners to My Saved Items, then protect posting time in Weekly Win Plan.',
      action: { label: 'Weekly Win Plan →', section: 'weekly-win-plan' },
      needsProfile: ['name', 'location', 'tone']
    },
    'equity-scanner': {
      icon: 'fa-chart-line',
      title: 'Opportunity hunting',
      body: 'Upload or review your pipeline, prioritize PMI-drop and move-up candidates, and use the outreach scripts with your voice.',
      action: { label: 'Sales scripts →', section: 'sales-script' }
    },
    'bio-creator': {
      icon: 'fa-id-card',
      title: 'Your voice starts with one bio',
      body: 'Save a Primary Bio so Newsletter, Blog, Social, and AI Coach speak like you. Company website = 750 characters is the default standard.',
      action: { label: 'Open My Profile →', openProfile: true },
      needsProfile: ['name', 'location']
    },
    'blog': {
      icon: 'fa-newspaper',
      title: 'Authority content, full package',
      body: 'One generate = blog + social caption + Google post + Reel. Add your market in the form (auto-saves to profile) for stronger GEO.',
      action: { label: 'Newsletter next →', section: 'newsletter-generator' },
      needsProfile: ['location']
    },
    'newsletter-generator': {
      icon: 'fa-envelope-open-text',
      title: 'Stay top of mind monthly',
      body: 'Write a real Personal Update first, then generate. Review the preview before copy/download — compliance-safe by design.',
      action: { label: 'Primary bio →', section: 'bio-creator' },
      needsProfile: ['name', 'location']
    },
    'sales-script': {
      icon: 'fa-comments',
      title: 'Sound human under pressure',
      body: 'Pick a scenario, add context, generate 4 scripts. Save keepers to My Saved Items before your next call block.',
      action: { label: 'Equity opportunities →', section: 'equity-scanner' },
      needsProfile: ['name', 'tone']
    },
    'planning': {
      icon: 'fa-chart-line',
      title: 'Annual map → weekly execution',
      body: 'Build your 2026 plan once, then open Weekly Win Plan to turn pillars into this week’s protected blocks.',
      action: { label: 'Weekly Win Plan →', section: 'weekly-win-plan' },
      needsProfile: ['name', 'location']
    },
    'ai-chat': {
      icon: 'fa-robot',
      title: 'Profile-aware coaching',
      body: 'Ask anything — voice, market, and bio from My Profile shape the answers. Complete name + market if replies feel generic.',
      action: { label: 'Complete Profile →', openProfile: true },
      needsProfile: ['name', 'location']
    }
  };

  function profileFieldMissing(field) {
    const p = getProfile();
    if (field === 'name') return !p.name;
    if (field === 'location') return !(p.location || p.market || p.localArea);
    if (field === 'tone') return !p.tone;
    if (field === 'bio') return !p.professionalBio;
    return false;
  }

  function renderToolProfileTip(sectionId) {
    const guide = SECTION_GUIDES[sectionId];
    const section = document.getElementById(sectionId);
    if (!guide?.needsProfile || !section) return;
    const missing = guide.needsProfile.filter(profileFieldMissing);
    const existing = section.querySelector('.coach-tool-profile-tip');
    if (!missing.length) {
      existing?.remove();
      return;
    }
    const labels = { name: 'name', location: 'market', tone: 'tone', bio: 'primary bio' };
    const list = missing.map((m) => labels[m] || m).join(', ');
    let el = existing;
    if (!el) {
      el = document.createElement('div');
      el.className = 'coach-tool-profile-tip mb-4';
      const anchor = section.querySelector('.coach-section-guide') || section.querySelector('h2')?.closest('.text-center') || section.firstElementChild;
      if (anchor) anchor.insertAdjacentElement('afterend', el);
      else section.insertBefore(el, section.firstChild);
    }
    el.innerHTML = `
      <div class="rounded-xl border border-amber-300/60 bg-amber-50 dark:bg-amber-900/20 px-3 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
        <span class="text-amber-900 dark:text-amber-100"><i class="fas fa-user-edit mr-1.5 text-amber-600"></i>Add <strong>${list}</strong> in My Profile so this tool personalizes better.</span>
        <button type="button" class="coach-tool-profile-open text-xs px-3 py-1.5 rounded-lg bg-[#002B5C] text-white font-semibold hover:bg-black shrink-0">Open Profile</button>
      </div>`;
    el.querySelector('.coach-tool-profile-open')?.addEventListener('click', () => {
      if (typeof window.openUserProfile === 'function') window.openUserProfile(true);
    });
  }

  function savedItemsCount() {
    try {
      return JSON.parse(localStorage.getItem('socialSavedIdeas') || '[]').length;
    } catch (e) {
      return 0;
    }
  }

  function hasWeeklyPlan() {
    try {
      const raw = localStorage.getItem('savedWeeklyPlan');
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return !!(parsed && (parsed.days || parsed.length));
    } catch (e) {
      return !!localStorage.getItem('savedWeeklyPlan');
    }
  }

  function hasBusinessPlan() {
    try {
      const html = localStorage.getItem('savedBusinessPlan');
      if (html && String(html).trim().length > 100) return true;
      const md = localStorage.getItem('lo_savedBusinessPlanMarkdown');
      if (md && String(md).trim().length > 80) return true;
      const ctx = localStorage.getItem('lo_savedBusinessPlanContext');
      if (ctx && String(ctx).trim().length > 40) return true;
      return false;
    } catch (e) {
      return false;
    }
  }

  function getFirstRunItems() {
    const p = getProfile();
    return [
      {
        id: 'profile',
        label: 'Add name + market in My Profile',
        done: !!(p.name && (p.location || p.market || p.localArea)),
        run: () => { if (typeof window.openUserProfile === 'function') window.openUserProfile(true); }
      },
      {
        id: 'bio',
        label: 'Save a Primary Bio (your voice for all tools)',
        done: !!p.professionalBio,
        run: () => { if (typeof window.showSection === 'function') window.showSection('bio-creator'); }
      },
      {
        id: 'annual',
        label: 'Build your 2026 Business Plan (annual map)',
        done: hasBusinessPlan(),
        run: () => { if (typeof window.showSection === 'function') window.showSection('planning'); }
      },
      {
        id: 'weekly',
        label: 'Build a Weekly Win Plan (execute the map)',
        done: hasWeeklyPlan(),
        run: () => { if (typeof window.showSection === 'function') window.showSection('weekly-win-plan'); }
      },
      {
        id: 'content',
        label: 'Generate social, blog, or newsletter content',
        done: (() => {
          try {
            const items = JSON.parse(localStorage.getItem('socialSavedIdeas') || '[]');
            return items.some((i) => ['social', 'blog', 'newsletter'].includes(i.type));
          } catch (e) {
            return false;
          }
        })() || !!localStorage.getItem('lastBlogOutput') || !!localStorage.getItem('lastNewsletterHTML') || !!localStorage.getItem('lastSocialPlanHTML'),
        run: () => { if (typeof window.showSection === 'function') window.showSection('social-post'); }
      },
      {
        id: 'saved',
        label: 'Save something to My Saved Items',
        done: savedItemsCount() > 0,
        run: () => {
          if (typeof window.showSavedItemsLibrary === 'function') window.showSavedItemsLibrary();
          else if (typeof window.showSection === 'function') window.showSection('social-post');
        }
      }
    ];
  }

  function renderFirstRunChecklist() {
    if (localStorage.getItem(CHECKLIST_DISMISS_KEY) === '1') {
      document.getElementById('coach-first-run-checklist')?.remove();
      return;
    }
    const items = getFirstRunItems();
    const doneCount = items.filter((i) => i.done).length;
    if (doneCount >= items.length) {
      document.getElementById('coach-first-run-checklist')?.remove();
      return;
    }

    const slot = document.getElementById('global-profile-nudge') || document.querySelector('main');
    if (!slot) return;

    let card = document.getElementById('coach-first-run-checklist');
    if (!card) {
      card = document.createElement('div');
      card.id = 'coach-first-run-checklist';
      card.className = 'mb-6';
      // Place after profile nudge if present
      const nudge = document.getElementById('coach-profile-nudge');
      if (nudge && nudge.parentNode) {
        nudge.insertAdjacentElement('afterend', card);
      } else if (slot.id === 'global-profile-nudge') {
        slot.appendChild(card);
      } else {
        slot.insertBefore(card, slot.firstChild);
      }
    }

    const pct = Math.round((doneCount / items.length) * 100);
    card.innerHTML = `
      <div class="rounded-2xl border border-[#00A89D]/35 bg-white dark:bg-gray-900 p-4 md:p-5 shadow-sm" role="region" aria-label="Getting started checklist">
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
          <div>
            <div class="text-[10px] font-bold uppercase tracking-wider text-[#00A89D]">Getting started</div>
            <div class="font-semibold text-[#002B5C] dark:text-white text-sm mt-0.5">Set up your coach (${doneCount}/${items.length})</div>
            <p class="text-xs text-gray-500 m-0 mt-1">Profile &amp; bio first → <strong>2026 Business Plan</strong> (the map) → <strong>Weekly Win Plan</strong> (this week’s execution) → content you can reuse.</p>
          </div>
          <button type="button" id="coach-checklist-dismiss" class="text-xs px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 shrink-0">Hide</button>
        </div>
        <div class="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mb-3">
          <div class="h-full rounded-full bg-gradient-to-r from-[#00A89D] to-[#F15A29] transition-all" style="width:${pct}%"></div>
        </div>
        <ul class="m-0 p-0 space-y-2 list-none">
          ${items.map((item) => `
            <li class="flex items-center justify-between gap-3 text-sm">
              <span class="flex items-center gap-2 min-w-0 ${item.done ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-200'}">
                <i class="fas ${item.done ? 'fa-check-circle text-[#00A89D]' : 'fa-circle text-gray-300'} shrink-0" aria-hidden="true"></i>
                <span class="truncate">${item.label}</span>
              </span>
              ${item.done ? '' : `<button type="button" data-checklist-id="${item.id}" class="coach-checklist-go text-xs px-3 py-1 rounded-full border border-[#00A89D] text-[#00A89D] font-semibold hover:bg-[#00A89D] hover:text-white shrink-0">Go</button>`}
            </li>
          `).join('')}
        </ul>
      </div>`;

    document.getElementById('coach-checklist-dismiss')?.addEventListener('click', () => {
      localStorage.setItem(CHECKLIST_DISMISS_KEY, '1');
      card.remove();
    });
    card.querySelectorAll('.coach-checklist-go').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = items.find((i) => i.id === btn.getAttribute('data-checklist-id'));
        if (item && typeof item.run === 'function') item.run();
      });
    });
  }

  function renderSectionGuide(sectionId) {
    const guide = SECTION_GUIDES[sectionId];
    const section = document.getElementById(sectionId);
    if (!guide || !section || localStorage.getItem(DISMISS_PREFIX + sectionId) === '1') return;

    let el = section.querySelector('.coach-section-guide');
    if (!el) {
      el = document.createElement('div');
      el.className = 'coach-section-guide mb-6';
      const anchor = section.querySelector('h2')?.closest('.text-center') || section.querySelector('h2') || section.firstElementChild;
      if (anchor) anchor.insertAdjacentElement('afterend', el);
      else section.insertBefore(el, section.firstChild);
    }

    el.innerHTML = `
      <div class="rounded-2xl border border-[#00A89D]/25 bg-[#00A89D]/5 dark:bg-[#00A89D]/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div class="flex items-start gap-3">
          <i class="fas ${guide.icon} text-[#00A89D] mt-0.5"></i>
          <div>
            <div class="text-sm font-semibold text-[#002B5C] dark:text-white">${guide.title}</div>
            <div class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">${guide.body}</div>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          ${guide.action ? `<button type="button" class="coach-guide-action text-xs px-3 py-1.5 rounded-xl bg-white dark:bg-gray-900 border border-[#00A89D] text-[#00A89D] font-semibold hover:bg-[#00A89D] hover:text-white transition">${guide.action.label}</button>` : ''}
          <button type="button" class="coach-guide-dismiss text-xs px-2 py-1.5 rounded-xl text-gray-400 hover:text-gray-600 transition" title="Dismiss">✕</button>
        </div>
      </div>
    `;

    el.querySelector('.coach-guide-dismiss')?.addEventListener('click', () => {
      localStorage.setItem(DISMISS_PREFIX + sectionId, '1');
      el.remove();
    });

    el.querySelector('.coach-guide-action')?.addEventListener('click', () => {
      if (guide.action.openProfile && typeof window.openUserProfile === 'function') {
        window.openUserProfile(true);
        return;
      }
      if (guide.action.section && typeof window.showSection === 'function') {
        window.showSection(guide.action.section);
      }
      setTimeout(() => {
        if (guide.action.scroll) {
          document.getElementById(guide.action.scroll)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        if (guide.action.pillar && typeof window.openVaultPillar === 'function') {
          window.openVaultPillar(guide.action.pillar);
        } else if (guide.action.search && typeof window.applyVaultSearch === 'function') {
          window.applyVaultSearch(guide.action.search);
        }
      }, 150);
    });
  }

  function injectVaultWeeklyBridge() {
    const vault = document.getElementById('value-vault');
    const btnGroup = vault?.querySelector('#idea-of-the-day-btn')?.parentElement;
    if (!btnGroup || document.getElementById('vault-popby-of-week')) return;

    const popbyBtn = document.createElement('button');
    popbyBtn.type = 'button';
    popbyBtn.id = 'vault-popby-of-week';
    popbyBtn.className = 'px-4 py-2.5 text-sm font-semibold rounded-xl bg-[#F15A29] text-white hover:bg-orange-600 transition flex items-center gap-2 shadow';
    popbyBtn.innerHTML = '<i class="fas fa-dice"></i><span class="hidden sm:inline">Pop-By of the Week</span>';

    const weeklyBtn = document.createElement('button');
    weeklyBtn.type = 'button';
    weeklyBtn.id = 'vault-to-weekly-plan';
    weeklyBtn.className = 'px-4 py-2.5 text-sm font-semibold rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white transition flex items-center gap-2';
    weeklyBtn.innerHTML = '<i class="fas fa-calendar-week"></i><span class="hidden sm:inline">Weekly Plan</span>';

    btnGroup.insertBefore(popbyBtn, btnGroup.firstChild);
    btnGroup.insertBefore(weeklyBtn, popbyBtn.nextSibling);

    document.getElementById('vault-popby-of-week')?.addEventListener('click', () => {
      if (typeof window.surprisePopBy === 'function') {
        window.surprisePopBy();
      } else if (typeof window.showVaultItemModal === 'function' && Array.isArray(window.VALUE_VAULT_ITEMS)) {
        const popbys = window.VALUE_VAULT_ITEMS.filter((i) => i.type === 'pop-by');
        if (popbys.length) window.showVaultItemModal(popbys[Math.floor(Math.random() * popbys.length)].id);
      }
    });

    document.getElementById('vault-to-weekly-plan')?.addEventListener('click', () => {
      if (typeof window.showSection === 'function') window.showSection('weekly-win-plan');
    });
  }

  function injectWeeklyVaultBridge() {
    const section = document.getElementById('weekly-win-plan');
    const guidance = document.getElementById('weekly-pregen-guidance');
    if (!section || !guidance || document.getElementById('weekly-vault-bridge')) return;

    const bridge = document.createElement('div');
    bridge.id = 'weekly-vault-bridge';
    bridge.className = 'mb-6';
    bridge.innerHTML = `
      <div class="rounded-2xl border border-[#F15A29]/30 bg-[#F15A29]/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-2 text-sm">
          <i class="fas fa-gift text-[#F15A29]"></i>
          <span><strong>Partner touch this week?</strong> Grab a Pop-By idea from Value Vault and drop it into a prospecting block.</span>
        </div>
        <button type="button" id="weekly-to-vault-btn" class="text-xs px-4 py-2 rounded-xl bg-[#00A89D] text-white font-semibold hover:bg-[#008F85] transition whitespace-nowrap">
          Open Value Vault
        </button>
      </div>
    `;
    guidance.insertAdjacentElement('afterend', bridge);

    document.getElementById('weekly-to-vault-btn')?.addEventListener('click', () => {
      if (typeof window.showSection === 'function') window.showSection('value-vault');
      setTimeout(() => {
        if (typeof window.surprisePopBy === 'function') window.surprisePopBy();
      }, 200);
    });
  }

  function refreshOnProfileChange() {
    renderProfileNudge();
    renderFirstRunChecklist();
    applyProfileAwareStartHere();
    const visible = document.querySelector('main section:not(.hidden)');
    if (visible?.id) renderToolProfileTip(visible.id);
  }

  window.onCoachSectionShown = function onCoachSectionShown(sectionId) {
    renderProfileNudge();
    renderFirstRunChecklist();
    renderSectionGuide(sectionId);
    renderToolProfileTip(sectionId);
    if (sectionId === 'value-vault') injectVaultWeeklyBridge();
    if (sectionId === 'weekly-win-plan') injectWeeklyVaultBridge();
    if (sectionId === 'ai-chat') applyProfileAwareStartHere();
  };

  function init() {
    // Older builds stored "Later" in localStorage (permanent). Use session-only dismiss now.
    if (localStorage.getItem(PROFILE_NUDGE_KEY) === '1') {
      localStorage.removeItem(PROFILE_NUDGE_KEY);
    }
    // Show checklist again when we change the recommended path (e.g. annual before weekly)
    if (localStorage.getItem('coachFirstRunChecklistVersion') !== CHECKLIST_VERSION) {
      localStorage.removeItem(CHECKLIST_DISMISS_KEY);
      localStorage.setItem('coachFirstRunChecklistVersion', CHECKLIST_VERSION);
    }

    // Stagger heavy UI chrome so first paint isn't blocked
    const paint = () => {
      try {
        renderProfileNudge();
        renderFirstRunChecklist();
        applyProfileAwareStartHere();
        const visible = document.querySelector('main section:not(.hidden)');
        if (visible?.id) window.onCoachSectionShown(visible.id);
      } catch (e) {
        console.warn('[onboarding-coach] paint failed', e);
      }
    };
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(paint, { timeout: 2500 });
    } else {
      setTimeout(paint, 50);
    }

    // Bridges only when those sections matter
    setTimeout(() => {
      try {
        injectVaultWeeklyBridge();
        injectWeeklyVaultBridge();
      } catch (e) {}
    }, 800);

    window.addEventListener('storage', (e) => {
      if (
        e.key === 'userProfile' ||
        e.key === 'socialSavedIdeas' ||
        e.key === 'savedWeeklyPlan' ||
        e.key === 'savedBusinessPlan' ||
        e.key === 'lo_savedBusinessPlanMarkdown' ||
        e.key === 'lo_savedBusinessPlanContext'
      ) {
        refreshOnProfileChange();
      }
    });

    document.getElementById('save-profile')?.addEventListener('click', () => {
      setTimeout(refreshOnProfileChange, 400);
    });

    const profileModal = document.getElementById('user-profile-modal');
    if (profileModal) {
      let profileRefreshTimer = null;
      profileModal.addEventListener('change', () => {
        clearTimeout(profileRefreshTimer);
        profileRefreshTimer = setTimeout(refreshOnProfileChange, 800);
      });
    }

    // Refresh checklist when saved items / plans likely changed
    window.addEventListener('focus', () => {
      setTimeout(renderFirstRunChecklist, 200);
    });

    window.refreshCoachOnboarding = refreshOnProfileChange;
    window.renderCoachFirstRunChecklist = renderFirstRunChecklist;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('%c[onboarding-coach.js] Profile nudge, section guides & vault bridges ready', 'color:#00A89D');
})();