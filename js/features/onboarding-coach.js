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
  const CHECKLIST_MINIMIZED_KEY = 'coachFirstRunChecklistMinimized';
  const CHECKLIST_VERSION = '6'; // home-only setup mount + launchpad

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

  /**
   * Profile personalization lives on Home via Getting Started — never as a
   * banner above every tool page.
   */
  function renderProfileNudge() {
    document.getElementById('coach-profile-nudge')?.remove();
    const global = document.getElementById('global-profile-nudge');
    if (global) {
      global.innerHTML = '';
      global.classList.add('hidden');
      global.setAttribute('aria-hidden', 'true');
    }
  }

  function firstNameFromProfile() {
    const p = getProfile();
    const raw = (p.name || p.fullName || '').trim();
    if (!raw) return '';
    return raw.split(/\s+/)[0];
  }

  function timeOfDayGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  function ensureHomeStyles() {
    const existing = document.getElementById('coach-home-styles');
    if (existing) existing.remove(); // always refresh so layout iterations apply
    const el = document.createElement('style');
    el.id = 'coach-home-styles';
    el.textContent = `
      /* Home launchpad — denser Daily loop + Jump in */
      #home.space-y-6 { gap: 1rem; }
      #home > .home-hero { margin-bottom: 0; }

      .home-loop-rail {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.45rem;
      }
      @media (min-width: 640px) {
        .home-loop-rail { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      }
      @media (min-width: 1100px) {
        .home-loop-rail { grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 0.4rem; }
      }

      #home-start-here .home-day-card {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        width: 100%;
        text-align: left;
        font-family: inherit;
        padding: 0.65rem 0.7rem;
        border-radius: 0.85rem;
        border: 1px solid rgba(0, 43, 92, 0.1);
        background: #f8fafc;
        cursor: pointer;
        transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease, transform 0.12s ease;
      }
      .dark #home-start-here .home-day-card {
        background: rgba(15, 23, 42, 0.65);
        border-color: rgba(148, 163, 184, 0.18);
      }
      #home-start-here .home-day-card:hover {
        border-color: #00A89D;
        background: #fff;
        box-shadow: 0 8px 18px -12px rgba(0, 43, 92, 0.35);
        transform: translateY(-1px);
      }
      .dark #home-start-here .home-day-card:hover {
        background: rgba(15, 23, 42, 0.95);
      }
      #home-start-here .home-day-num {
        flex-shrink: 0;
        width: 1.35rem;
        height: 1.35rem;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        font-weight: 900;
        color: #fff;
        background: var(--step, #00A89D);
      }
      #home-start-here .home-day-icon {
        flex-shrink: 0;
        width: 2.15rem;
        height: 2.15rem;
        border-radius: 0.65rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.95rem;
        color: var(--step, #00A89D);
        background: color-mix(in srgb, var(--step, #00A89D) 12%, transparent);
        transition: background 0.15s ease, color 0.15s ease;
      }
      #home-start-here .home-day-card:hover .home-day-icon {
        background: var(--step, #00A89D);
        color: #fff;
      }
      #home-start-here .home-day-copy {
        display: flex;
        flex-direction: column;
        gap: 0.05rem;
        min-width: 0;
      }
      #home-start-here .home-day-label {
        font-size: 0.65rem;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--step, #00A89D);
        line-height: 1.2;
      }
      #home-start-here .home-day-title {
        font-size: 0.95rem;
        font-weight: 800;
        color: #002B5C;
        line-height: 1.2;
        letter-spacing: -0.02em;
      }
      .dark #home-start-here .home-day-title { color: #f8fafc; }

      #home-start-here .home-day-card.is-recommended {
        border-color: #F15A29 !important;
        box-shadow: 0 10px 22px -14px rgba(241,90,41,0.5), 0 0 0 1px rgba(241,90,41,0.25);
        background: linear-gradient(165deg, rgba(241,90,41,0.08), #fff 50%);
      }
      .dark #home-start-here .home-day-card.is-recommended {
        background: linear-gradient(165deg, rgba(241,90,41,0.14), rgba(17,24,39,0.95) 50%);
      }
      #home-start-here .home-day-card .start-here-badge {
        position: absolute;
        top: 0.2rem;
        right: 0.35rem;
        display: inline-flex;
        font-size: 8px;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #F15A29;
      }
      #home-start-here .home-day-card {
        position: relative;
      }

      /* Jump-in tools — compact list tiles */
      .home-tool-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 0.35rem;
      }
      @media (min-width: 520px) {
        .home-tool-grid { grid-template-columns: 1fr 1fr; }
      }
      #home .home-tool {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        width: 100%;
        text-align: left;
        font-family: inherit;
        padding: 0.55rem 0.7rem;
        border-radius: 0.75rem;
        border: 1px solid rgba(0, 43, 92, 0.1);
        background: #f8fafc;
        cursor: pointer;
        transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
      }
      .dark #home .home-tool {
        background: rgba(15, 23, 42, 0.55);
        border-color: rgba(148, 163, 184, 0.16);
      }
      #home .home-tool:hover {
        border-color: #00A89D;
        background: #fff;
        box-shadow: 0 6px 14px -10px rgba(0, 43, 92, 0.3);
      }
      .dark #home .home-tool:hover { background: rgba(15, 23, 42, 0.95); }
      #home .home-tool > i:first-child {
        width: 1.15rem;
        text-align: center;
        font-size: 1rem;
        flex-shrink: 0;
      }
      #home .home-tool-text {
        display: flex;
        flex-direction: column;
        gap: 0.05rem;
        min-width: 0;
        flex: 1;
      }
      #home .home-tool-title {
        font-size: 0.95rem;
        font-weight: 800;
        color: #002B5C;
        letter-spacing: -0.015em;
        line-height: 1.2;
      }
      .dark #home .home-tool-title { color: #f8fafc; }
      #home .home-tool-sub {
        font-size: 0.75rem;
        font-weight: 600;
        color: #64748b;
        line-height: 1.2;
      }
      #home .home-tool-chevron {
        font-size: 0.65rem;
        color: #94a3b8;
        opacity: 0.7;
        flex-shrink: 0;
      }
      #home .home-tool:hover .home-tool-chevron { color: #00A89D; opacity: 1; }

      #home-hero-stats .home-stat-pill {
        display: inline-flex; align-items: center; gap: 0.4rem;
        padding: 0.35rem 0.75rem; border-radius: 999px;
        font-size: 11px; font-weight: 600;
        border: 1px solid rgba(255,255,255,0.14);
        background: rgba(255,255,255,0.06);
        color: rgba(255,255,255,0.78);
        cursor: pointer;
        font-family: inherit;
        line-height: 1.2;
        transition: border-color 0.15s ease, background 0.15s ease, transform 0.12s ease, color 0.15s ease;
      }
      #home-hero-stats .home-stat-pill:hover {
        border-color: rgba(255,255,255,0.35);
        background: rgba(255,255,255,0.12);
        color: #fff;
        transform: translateY(-1px);
      }
      #home-hero-stats .home-stat-pill:focus-visible {
        outline: 2px solid #00A89D;
        outline-offset: 2px;
      }
      #home-hero-stats .home-stat-pill.is-ready {
        border-color: rgba(0,168,157,0.45);
        background: rgba(0,168,157,0.15);
        color: #5eead4;
      }
      #home-hero-stats .home-stat-pill.is-ready:hover {
        border-color: rgba(0,168,157,0.7);
        background: rgba(0,168,157,0.28);
        color: #99f6e4;
      }
      #home-hero-stats .home-stat-pill.is-warn {
        border-color: rgba(241,90,41,0.4);
        background: rgba(241,90,41,0.12);
        color: #fdba74;
      }
      #home-hero-stats .home-stat-pill.is-warn:hover {
        border-color: rgba(241,90,41,0.65);
        background: rgba(241,90,41,0.22);
        color: #fed7aa;
      }
      #home-setup-ready {
        animation: gs-enter 0.45s cubic-bezier(0.22,1,0.36,1) both;
      }
    `;
    document.head.appendChild(el);
  }

  function updateHomeHero() {
    ensureHomeStyles();
    const greeting = document.getElementById('home-greeting');
    const subline = document.getElementById('home-subline');
    const name = firstNameFromProfile();
    const tod = timeOfDayGreeting();
    if (greeting) {
      greeting.textContent = name ? `${tod}, ${name}.` : `${tod}. Welcome back.`;
    }
    if (subline) {
      const { score, isComplete } = getProfileCompleteness();
      if (!isComplete && score < 40) {
        subline.textContent = 'Start with setup below — then run your daily loop. AI Coach gets sharper once your profile and bio are in.';
      } else if (!isComplete) {
        subline.textContent = 'You’re underway. Finish setup, then run the daily loop. Open AI Coach when you need to think something through.';
      } else {
        subline.textContent = 'Your launchpad — run the day, jump into tools, or open AI Coach when you need to think.';
      }
    }

    const stats = document.getElementById('home-hero-stats');
    if (stats) {
      const { score, isComplete } = getProfileCompleteness();
      const planOk = hasBusinessPlan();
      const weekOk = hasWeeklyPlan();
      const bioOk = !!getProfile().professionalBio;
      // Clickable chips → profile modal / bio / annual plan / weekly plan
      stats.innerHTML = `
        <button type="button" class="home-stat-pill ${isComplete ? 'is-ready' : 'is-warn'}" data-home-stat="profile"
          title="Open your profile setup (${score}% complete)">
          <i class="fas fa-user text-[10px] opacity-80" aria-hidden="true"></i> Profile ${score}%
        </button>
        <button type="button" class="home-stat-pill ${bioOk ? 'is-ready' : 'is-warn'}" data-home-stat="bio"
          title="${bioOk ? 'Open Bio Builder' : 'Build your bio — opens Bio Builder'}">
          <i class="fas fa-id-card text-[10px] opacity-80" aria-hidden="true"></i> ${bioOk ? 'Bio ready' : 'Bio needed'}
        </button>
        <button type="button" class="home-stat-pill ${planOk ? 'is-ready' : 'is-warn'}" data-home-stat="annual"
          title="${planOk ? 'Open 2026 Business Plan' : 'Create your annual plan — opens 2026 Business Plan'}">
          <i class="fas fa-chart-line text-[10px] opacity-80" aria-hidden="true"></i> ${planOk ? '2026 plan' : 'No annual plan'}
        </button>
        <button type="button" class="home-stat-pill ${weekOk ? 'is-ready' : 'is-warn'}" data-home-stat="weekly"
          title="${weekOk ? 'Open Weekly Win Plan' : 'Plan this week — opens Weekly Win Plan'}">
          <i class="fas fa-fire text-[10px] opacity-80" aria-hidden="true"></i> ${weekOk ? 'Week planned' : 'Plan this week'}
        </button>
      `;
      if (!stats.__homeStatNavWired) {
        stats.__homeStatNavWired = true;
        stats.addEventListener('click', function (e) {
          const btn = e.target && e.target.closest ? e.target.closest('[data-home-stat]') : null;
          if (!btn) return;
          const key = btn.getAttribute('data-home-stat');
          navigateHomeStatChip(key);
        });
      }
    }
  }

  /** Home hero status chips → destination tools / profile */
  function navigateHomeStatChip(key) {
    if (key === 'profile') {
      if (typeof window.openUserProfile === 'function') {
        try {
          window.openUserProfile(true);
          return;
        } catch (err) { /* fall through */ }
      }
      // Fallback: scroll setup / focus edit profile if present
      const editBtn = document.getElementById('edit-setup-btn') || document.getElementById('open-profile-btn');
      if (editBtn) {
        editBtn.click();
        return;
      }
      if (typeof window.showSection === 'function') window.showSection('home');
      return;
    }
    if (key === 'bio') {
      if (typeof window.showSection === 'function') window.showSection('bio-creator');
      return;
    }
    if (key === 'annual') {
      if (typeof window.showSection === 'function') window.showSection('planning');
      return;
    }
    if (key === 'weekly') {
      if (typeof window.showSection === 'function') window.showSection('weekly-win-plan');
    }
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
    ensureHomeStyles();
    const root = document.getElementById('home-start-here');
    if (!root) return;

    const recommended = getRecommendedStartStep();

    root.querySelectorAll('button[data-start-step]').forEach((btn) => {
      btn.classList.remove('is-recommended', 'ring-2', 'ring-[#F15A29]', 'border-[#F15A29]');
      btn.querySelector('.start-here-badge')?.remove();
      // Ensure Content always opens the studio hub (never jump straight to social-post)
      if (btn.getAttribute('data-start-step') === 'content') {
        btn.setAttribute('onclick', "window.showSection('content-hub')");
        btn.setAttribute('data-section', 'content-hub');
      }
    });

    // Delegated safety net if inline handlers are stripped by host code
    if (!root.__contentHubNavWired) {
      root.__contentHubNavWired = true;
      root.addEventListener('click', function (e) {
        const btn = e.target && e.target.closest ? e.target.closest('button[data-start-step="content"]') : null;
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        if (typeof window.showSection === 'function') window.showSection('content-hub');
      }, true);
    }

    const target = root.querySelector(`button[data-start-step="${recommended}"]`);
    if (!target) return;

    target.classList.add('is-recommended');
    const badge = document.createElement('div');
    badge.className = 'start-here-badge';
    badge.textContent = 'Recommended for you';
    target.insertBefore(badge, target.firstChild);
  }

  // Section guides: tip chrome only. Primary action stays on *this* tool and
  // scrolls to the *form start* (not Generate) so users fill inputs first.
  // Cross-tool handoffs live in bottom banners — not the hero strip.
  const SECTION_GUIDES = {
    'weekly-win-plan': {
      icon: 'fa-fire',
      title: 'Start here this week',
      body: 'Set hours and focus below, then generate. Block 2–3 power hours and execute one partner touch the same day. Cross-tool ideas (Pop-Bys, scripts) live in the bottom banner.',
      action: { label: 'Jump to form →', scroll: 'wwp-hours' },
      needsProfile: ['name', 'location']
    },
    'value-vault': {
      icon: 'fa-gift',
      title: 'Turn ideas into touches',
      body: 'Search or filter the Pop-By library, copy a note, deliver within 48 hours — then log the touch in your Weekly Win Plan (bottom banner).',
      action: { label: 'Browse library ↓', scroll: 'idea-of-the-day-btn' }
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
      body: 'Rank A/B/C clients, pick one life-event touch, and schedule it in a Weekly Win time block. Templates and gifts live in Value Vault (bottom banner).',
      needsProfile: ['name', 'location']
    },
    'content-hub': {
      icon: 'fa-pen-nib',
      title: 'Pick the right content tool',
      body: 'Strategy for what to post, Social Post & Calendar for this week, Blog for authority, Newsletter for sphere, Bio for your profile — choose what you need now.',
      action: { label: 'Create this week’s posts →', section: 'social-post' }
    },
    'social': {
      icon: 'fa-share-alt',
      title: 'Content that compounds',
      body: 'Open one expanded pillar for copy-ready posts, save 2 winners to My Saved Items, then generate a calendar in Social Post Creator.',
      needsProfile: ['name', 'tone']
    },
    'social-post': {
      icon: 'fa-magic',
      title: 'Batch content in minutes',
      body: 'Pick an idea (or type your own), generate 3 options or a 30-day calendar, save winners, then protect posting time in Weekly Win Plan (bottom banner).',
      action: { label: 'Jump to form →', scroll: 'post-type' },
      needsProfile: ['name', 'location', 'tone']
    },
    'equity-scanner': {
      icon: 'fa-chart-line',
      title: 'Opportunity hunting',
      body: 'Upload or load demo data, generate the equity report, prioritize PMI-drop and move-up candidates. Pair with Sales Scripts from the bottom banner.',
      action: { label: 'Jump to form →', scroll: 'upload-area' }
    },
    'bio-creator': {
      icon: 'fa-id-card',
      title: 'Your voice starts with one bio',
      body: 'Use Guided setup or Full form below. Save a Primary Bio so Newsletter, Blog, Social, and AI Coach speak like you.',
      // Land on Guided | Full toggle (not below it into the full form only)
      action: { label: 'Jump to form →', scroll: 'bio-wizard-entry' },
      needsProfile: ['name', 'location']
    },
    'blog': {
      icon: 'fa-newspaper',
      title: 'Authority content, full package',
      body: 'Set length, tone, and topic below — one generate = blog + social caption + Google post + Reel. Market from the form auto-saves to profile.',
      action: { label: 'Jump to form →', scroll: 'blog-length' },
      needsProfile: ['location']
    },
    'newsletter-generator': {
      icon: 'fa-envelope-open-text',
      title: 'Stay top of mind monthly',
      body: 'Write a real Personal Update first, then generate. Review the preview before copy/download — compliance-safe by design. Use Guided setup or Full form below when you’re ready.',
      // Land on Guided | Full toggle so the mode switch stays in view
      action: { label: 'Jump to form →', scroll: 'nl-wizard-entry' },
      needsProfile: ['name', 'location']
    },
    'sales-script': {
      icon: 'fa-comments',
      title: 'Sound human under pressure',
      body: 'Pick a category and scenario, add context, then generate 4 scripts. Save keepers to My Saved Items before your next call block.',
      action: { label: 'Jump to form →', scroll: 'sales-category-cards' },
      needsProfile: ['name', 'tone']
    },
    'planning': {
      icon: 'fa-chart-line',
      title: 'Build your year around you',
      body: 'Use the Guided setup | Full form switch below — same fields either way. Profile loads automatically.',
      // No action button: avoids a second guided CTA next to the shared mode switch
      needsProfile: ['name', 'location']
    },
    'ai-chat': {
      icon: 'fa-robot',
      title: 'Conversation first',
      body: 'Ask anything — voice, market, and bio from My Profile shape the answers. Setup and your daily loop live on Home.',
      action: { label: 'Jump to form →', scroll: 'chat-input' },
      needsProfile: ['name', 'location']
    },
    'underwriting-search': {
      icon: 'fa-balance-scale',
      title: 'Guideline clarity, not guesswork',
      body: 'Describe the messy scenario, upload overlays if you have them, then search. Follow-ups stay on the same file.',
      action: { label: 'Jump to form →', scroll: 'uw-question' }
    },
    'smart-savings': {
      icon: 'fa-piggy-bank',
      title: 'Meeting-ready savings story',
      body: 'Use Guided setup for a client walkthrough, or Full form for power users. How-it-works tips sit above the calculator.',
      needsProfile: ['name']
    },
    'client-translation': {
      icon: 'fa-language',
      title: 'Mortgage-aware translation',
      body: 'Paste email or upload a file, pick languages, then Translate. Check meaning before you send.',
      action: { label: 'Jump to form →', scroll: 'tr-source-text' }
    },
    home: {
      icon: 'fa-home',
      title: 'Your launchpad',
      body: 'Finish setup once, run the daily loop every day, jump into tools when you need them, open AI Coach when you need to think.',
      action: { label: 'Open AI Coach →', section: 'ai-chat' }
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
        short: 'Profile',
        label: 'Lock in your identity',
        blurb: 'Name + market so every tool sounds like you — not a generic LO.',
        icon: 'fa-user',
        done: !!(p.name && (p.location || p.market || p.localArea)),
        run: () => { if (typeof window.openUserProfile === 'function') window.openUserProfile(true); }
      },
      {
        id: 'bio',
        short: 'Bio',
        label: 'Save a Primary Bio',
        blurb: 'One authentic voice for Newsletter, Blog, Social, and AI Coach.',
        icon: 'fa-id-card',
        done: !!p.professionalBio,
        run: () => { if (typeof window.showSection === 'function') window.showSection('bio-creator'); }
      },
      {
        id: 'annual',
        short: '2026 Plan',
        label: 'Build your 2026 Business Plan',
        blurb: 'Your annual map — vision, numbers, and strategy before the weekly grind.',
        icon: 'fa-chart-line',
        done: hasBusinessPlan(),
        run: () => { if (typeof window.showSection === 'function') window.showSection('planning'); }
      },
      {
        id: 'weekly',
        short: 'Weekly',
        label: 'Build this week’s Win Plan',
        blurb: 'Turn the map into protected blocks and tasks you actually run.',
        icon: 'fa-fire',
        done: hasWeeklyPlan(),
        run: () => { if (typeof window.showSection === 'function') window.showSection('weekly-win-plan'); }
      },
      {
        id: 'content',
        short: 'Content',
        label: 'Open Content Studio',
        blurb: 'Strategy, posts, blog, newsletter, or bio — pick the right tool for this moment.',
        icon: 'fa-sparkles',
        done: (() => {
          try {
            const items = JSON.parse(localStorage.getItem('socialSavedIdeas') || '[]');
            return items.some((i) => ['social', 'blog', 'newsletter'].includes(i.type));
          } catch (e) {
            return false;
          }
        })() || !!localStorage.getItem('lastBlogOutput') || !!localStorage.getItem('lastNewsletterHTML') || !!localStorage.getItem('lastSocialPlanHTML'),
        run: () => { if (typeof window.showSection === 'function') window.showSection('content-hub'); }
      },
      {
        id: 'saved',
        short: 'Library',
        label: 'Save a keeper',
        blurb: 'Bookmark one script or post so your best work is one click away.',
        icon: 'fa-bookmark',
        done: savedItemsCount() > 0,
        run: () => {
          if (typeof window.showSavedItemsLibrary === 'function') window.showSavedItemsLibrary();
          else if (typeof window.showSection === 'function') window.showSection('social-post');
        }
      }
    ];
  }

  function ensureGettingStartedStyles() {
    const style = document.getElementById('coach-getting-started-styles');
    if (style) style.remove(); // always refresh so design iterations apply
    const el = document.createElement('style');
    el.id = 'coach-getting-started-styles';
    el.textContent = `
      @keyframes gs-enter {
        from { opacity: 0; transform: translateY(10px) scale(0.985); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes gs-shimmer {
        0% { background-position: 0% 50%; }
        100% { background-position: 200% 50%; }
      }
      @keyframes gs-pulse-ring {
        0%, 100% { box-shadow: 0 0 0 0 rgba(0,168,157,0.35); }
        50% { box-shadow: 0 0 0 6px rgba(0,168,157,0); }
      }
      #coach-first-run-checklist { animation: gs-enter 0.45s cubic-bezier(0.22,1,0.36,1) both; }
      #coach-first-run-checklist {
        width: 100%;
        max-width: none;
        margin-top: 0.35rem; /* hair of white between quote bar and setup card */
      }
      #coach-first-run-checklist .gs-shell {
        position: relative;
        overflow: hidden;
        width: 100%;
        border-radius: 1.75rem;
        border: 1px solid rgba(255,255,255,0.08);
        background:
          radial-gradient(1100px 260px at 6% -25%, rgba(0,168,157,0.28), transparent 55%),
          radial-gradient(900px 240px at 96% 0%, rgba(241,90,41,0.18), transparent 50%),
          linear-gradient(155deg, #001429 0%, #002B5C 42%, #063a42 100%);
        box-shadow:
          0 28px 60px -28px rgba(0,20,40,0.75),
          0 0 0 1px rgba(0,168,157,0.12) inset,
          0 1px 0 rgba(255,255,255,0.06) inset;
        color: #fff;
      }
      .dark #coach-first-run-checklist .gs-shell {
        background:
          radial-gradient(900px 220px at 8% -20%, rgba(0,168,157,0.22), transparent 55%),
          radial-gradient(700px 200px at 92% 0%, rgba(241,90,41,0.14), transparent 50%),
          linear-gradient(155deg, #050b12 0%, #0a1624 50%, #0a1f24 100%);
      }
      #coach-first-run-checklist .gs-shell::after {
        content: '';
        position: absolute;
        inset: -40% auto auto 40%;
        width: 50%;
        height: 120%;
        background: linear-gradient(115deg, transparent, rgba(255,255,255,0.04), transparent);
        transform: rotate(12deg);
        pointer-events: none;
      }
      #coach-first-run-checklist .gs-inner { position: relative; z-index: 1; }
      #coach-first-run-checklist .gs-kicker {
        display: inline-flex; align-items: center; gap: 0.4rem;
        font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase;
        color: #5eead4;
      }
      #coach-first-run-checklist .gs-kicker-dot {
        width: 6px; height: 6px; border-radius: 999px;
        background: #00A89D;
        box-shadow: 0 0 10px rgba(0,168,157,0.8);
      }
      #coach-first-run-checklist .gs-progress-track {
        height: 3px; border-radius: 999px; background: rgba(255,255,255,0.1); overflow: hidden;
      }
      #coach-first-run-checklist .gs-progress-fill {
        height: 100%; border-radius: 999px;
        background: linear-gradient(90deg, #00A89D, #2dd4bf, #F15A29, #00A89D);
        background-size: 200% 100%;
        animation: gs-shimmer 3.2s linear infinite;
        transition: width 0.55s cubic-bezier(0.22, 1, 0.36, 1);
      }
      #coach-first-run-checklist .gs-next {
        border-radius: 1.25rem;
        background: linear-gradient(160deg, rgba(255,255,255,0.1), rgba(255,255,255,0.04));
        border: 1px solid rgba(255,255,255,0.14);
        box-shadow: 0 12px 32px -18px rgba(0,0,0,0.5);
        transition: border-color 0.2s ease, transform 0.2s ease, background 0.2s ease;
      }
      #coach-first-run-checklist .gs-next:hover {
        border-color: rgba(0,168,157,0.5);
        background: linear-gradient(160deg, rgba(255,255,255,0.13), rgba(0,168,157,0.08));
      }
      #coach-first-run-checklist .gs-icon-tile {
        width: 3rem; height: 3rem; border-radius: 1rem; flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
        background: linear-gradient(145deg, #00A89D, #F15A29);
        box-shadow: 0 10px 22px -8px rgba(241,90,41,0.55);
        animation: gs-pulse-ring 2.8s ease-in-out infinite;
      }
      #coach-first-run-checklist .gs-cta {
        display: inline-flex; align-items: center; justify-content: center; gap: 0.55rem;
        padding: 0.8rem 1.35rem; border-radius: 999px; font-weight: 700; font-size: 0.8125rem;
        color: #fff; border: 0; cursor: pointer; white-space: nowrap;
        background: linear-gradient(105deg, #00A89D 0%, #14b8a6 35%, #F15A29 100%);
        background-size: 140% 100%;
        box-shadow: 0 12px 28px -12px rgba(0,168,157,0.75);
        transition: transform 0.18s ease, box-shadow 0.18s ease, background-position 0.25s ease;
      }
      #coach-first-run-checklist .gs-cta:hover {
        transform: translateY(-2px);
        background-position: 100% 0;
        box-shadow: 0 16px 32px -12px rgba(241,90,41,0.5);
      }
      #coach-first-run-checklist .gs-cta:active { transform: translateY(0); }
      #coach-first-run-checklist .gs-cta i { transition: transform 0.18s ease; }
      #coach-first-run-checklist .gs-cta:hover i { transform: translateX(3px); }
      #coach-first-run-checklist .gs-path {
        display: flex; align-items: flex-start; width: 100%;
      }
      #coach-first-run-checklist .gs-path-item {
        flex: 1; display: flex; flex-direction: column; align-items: center; min-width: 0;
        position: relative;
      }
      #coach-first-run-checklist .gs-path-line {
        position: absolute; top: 1rem; left: calc(-50% + 1.1rem); right: calc(50% + 1.1rem);
        height: 2px; border-radius: 999px;
        background: rgba(255,255,255,0.1);
        z-index: 0;
      }
      #coach-first-run-checklist .gs-path-item.is-done .gs-path-line,
      #coach-first-run-checklist .gs-path-item.is-current .gs-path-line {
        background: linear-gradient(90deg, rgba(0,168,157,0.75), rgba(0,168,157,0.35));
      }
      #coach-first-run-checklist .gs-path-item:first-child .gs-path-line { display: none; }
      #coach-first-run-checklist .gs-step {
        position: relative; z-index: 1;
        display: flex; flex-direction: column; align-items: center; gap: 0.4rem;
        width: 100%; padding: 0.25rem 0.15rem; border: 0; background: transparent;
        color: rgba(255,255,255,0.42); cursor: pointer;
        transition: color 0.15s ease, transform 0.15s ease;
      }
      #coach-first-run-checklist .gs-step:hover:not(:disabled) {
        color: rgba(255,255,255,0.92); transform: translateY(-1px);
      }
      #coach-first-run-checklist .gs-step.is-done { color: #5eead4; cursor: pointer; }
      #coach-first-run-checklist .gs-step.is-done:hover {
        color: #99f6e4; transform: translateY(-1px);
      }
      #coach-first-run-checklist .gs-step.is-done:hover .gs-dot {
        transform: scale(1.06);
        box-shadow: 0 0 0 3px rgba(0,168,157,0.2);
      }
      #coach-first-run-checklist .gs-step.is-current { color: #fff; }
      #coach-first-run-checklist .gs-dot {
        width: 2rem; height: 2rem; border-radius: 999px;
        display: inline-flex; align-items: center; justify-content: center;
        font-size: 0.72rem; font-weight: 700;
        border: 1px solid rgba(255,255,255,0.16);
        background: rgba(0,0,0,0.2);
        transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
      }
      #coach-first-run-checklist .gs-step.is-done .gs-dot {
        border-color: rgba(0,168,157,0.55);
        background: rgba(0,168,157,0.22);
        color: #5eead4;
      }
      #coach-first-run-checklist .gs-step.is-current .gs-dot {
        border-color: transparent;
        background: linear-gradient(145deg, #00A89D, #F15A29);
        color: #fff;
        box-shadow: 0 6px 16px -4px rgba(241,90,41,0.55);
        transform: scale(1.08);
      }
      #coach-first-run-checklist .gs-step-label {
        font-size: 0.7rem; font-weight: 600; letter-spacing: 0.03em;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;
        text-align: center;
      }
      #coach-first-run-checklist .gs-step-hint {
        font-size: 0.58rem; font-weight: 500; letter-spacing: 0.02em;
        color: rgba(255,255,255,0.28); text-transform: uppercase;
      }
      #coach-first-run-checklist .gs-step.is-done .gs-step-hint { color: rgba(94,234,212,0.55); }
      #coach-first-run-checklist .gs-step.is-current .gs-step-hint { color: rgba(255,255,255,0.45); }
      #coach-first-run-checklist .gs-ghost {
        color: rgba(255,255,255,0.4); background: transparent;
        border: 1px solid rgba(255,255,255,0.12);
        font-size: 0.68rem; font-weight: 600; letter-spacing: 0.03em;
        padding: 0.35rem 0.65rem; border-radius: 999px; cursor: pointer;
        transition: color 0.15s, border-color 0.15s, background 0.15s;
      }
      #coach-first-run-checklist .gs-ghost:hover {
        color: rgba(255,255,255,0.9); border-color: rgba(255,255,255,0.28);
        background: rgba(255,255,255,0.06);
      }
      #coach-first-run-checklist .gs-mini {
        display: flex; align-items: center; gap: 0.75rem;
        padding: 0.7rem 0.85rem 0.7rem 0.95rem;
        border-radius: 999px;
        border: 1px solid rgba(0,168,157,0.28);
        background: linear-gradient(105deg, #002B5C 0%, #0a3d4a 100%);
        box-shadow: 0 12px 28px -16px rgba(0,43,92,0.65);
        color: #fff; cursor: pointer; width: 100%;
        transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
        text-align: left;
      }
      #coach-first-run-checklist .gs-mini:hover {
        transform: translateY(-1px);
        border-color: rgba(0,168,157,0.5);
        box-shadow: 0 16px 32px -14px rgba(0,168,157,0.35);
      }
      #coach-first-run-checklist .gs-mini-bar {
        width: 2.5rem; height: 3px; border-radius: 999px;
        background: rgba(255,255,255,0.12); overflow: hidden; flex-shrink: 0;
      }
      #coach-first-run-checklist .gs-mini-bar > span {
        display: block; height: 100%; border-radius: 999px;
        background: linear-gradient(90deg, #00A89D, #F15A29);
      }
      @media (max-width: 640px) {
        #coach-first-run-checklist .gs-step-label { font-size: 0.58rem; }
        #coach-first-run-checklist .gs-dot { width: 1.65rem; height: 1.65rem; font-size: 0.62rem; }
      }
    `;
    document.head.appendChild(el);
  }

  function ctaLabelFor(item) {
    const map = {
      profile: 'Open profile',
      bio: 'Build my bio',
      annual: 'Build 2026 plan',
      weekly: 'Plan this week',
      content: 'Open Content Studio',
      saved: 'Open library'
    };
    return map[item.id] || 'Continue';
  }

  function renderHomeReadyBanner(slot) {
    if (!slot) return;
    document.getElementById('coach-first-run-checklist')?.remove();
    if (sessionStorage.getItem('coachHomeReadyDismissed') === '1') {
      document.getElementById('home-setup-ready')?.remove();
      return;
    }
    let banner = document.getElementById('home-setup-ready');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'home-setup-ready';
      banner.className = 'w-full';
      slot.appendChild(banner);
    }
    banner.innerHTML = `
      <div class="rounded-2xl border border-[#00A89D]/30 bg-gradient-to-r from-[#00A89D]/10 to-[#002B5C]/5 dark:from-[#00A89D]/15 dark:to-transparent px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-start gap-3 min-w-0">
          <div class="w-10 h-10 rounded-xl bg-[#00A89D]/15 text-[#00A89D] flex items-center justify-center shrink-0">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="min-w-0">
            <div class="text-sm font-bold text-[#002B5C] dark:text-white">You’re set up. Run the day.</div>
            <p class="text-xs text-gray-600 dark:text-gray-400 m-0 mt-0.5 leading-relaxed">Daily loop below · tools anytime · AI Coach when you need to think.</p>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button type="button" id="home-ready-coach" class="text-xs px-4 py-2 rounded-full bg-[#002B5C] text-white font-semibold hover:bg-black transition">Open AI Coach</button>
          <button type="button" id="home-ready-dismiss" class="text-xs px-3 py-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition">Got it</button>
        </div>
      </div>`;
    document.getElementById('home-ready-coach')?.addEventListener('click', () => {
      if (typeof window.showSection === 'function') window.showSection('ai-chat');
    });
    document.getElementById('home-ready-dismiss')?.addEventListener('click', () => {
      sessionStorage.setItem('coachHomeReadyDismissed', '1');
      banner.remove();
    });
  }

  function renderFirstRunChecklist() {
    // Getting Started lives only on Home — never stacked above Blog/Social/etc.
    const slot = document.getElementById('home-setup-slot');
    if (!slot) return;

    // Clean up any legacy mount under global nudge / main
    const legacy = document.getElementById('coach-first-run-checklist');
    if (legacy && legacy.parentElement !== slot) {
      legacy.remove();
    }

    if (localStorage.getItem(CHECKLIST_DISMISS_KEY) === '1') {
      document.getElementById('coach-first-run-checklist')?.remove();
      document.getElementById('home-setup-ready')?.remove();
      return;
    }

    const items = getFirstRunItems();
    const doneCount = items.filter((i) => i.done).length;
    if (doneCount >= items.length) {
      renderHomeReadyBanner(slot);
      return;
    }

    document.getElementById('home-setup-ready')?.remove();
    ensureGettingStartedStyles();
    ensureHomeStyles();

    let card = document.getElementById('coach-first-run-checklist');
    if (!card) {
      card = document.createElement('div');
      card.id = 'coach-first-run-checklist';
      card.className = 'mb-1 w-full';
      slot.appendChild(card);
    } else if (card.parentElement !== slot) {
      slot.appendChild(card);
    }

    const pct = Math.round((doneCount / items.length) * 100);
    const next = items.find((i) => !i.done) || items[0];
    const nextIndex = items.findIndex((i) => i.id === next.id) + 1;
    const minimized = localStorage.getItem(CHECKLIST_MINIMIZED_KEY) === '1';

    if (minimized) {
      card.innerHTML = `
        <button type="button" class="gs-mini" id="coach-checklist-expand" aria-expanded="false" aria-label="Expand coach setup, ${doneCount} of ${items.length} complete">
          <span class="gs-mini-bar" aria-hidden="true"><span style="width:${pct}%"></span></span>
          <span class="min-w-0 flex-1">
            <span class="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#5eead4]">Setup · ${doneCount}/${items.length}</span>
            <span class="block text-sm font-semibold text-white truncate">Next: ${next.label}</span>
          </span>
          <span class="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-white/90">
            Expand
            <i class="fas fa-chevron-down text-[10px] opacity-70" aria-hidden="true"></i>
          </span>
        </button>`;
      document.getElementById('coach-checklist-expand')?.addEventListener('click', () => {
        localStorage.setItem(CHECKLIST_MINIMIZED_KEY, '0');
        renderFirstRunChecklist();
      });
      return;
    }

    card.innerHTML = `
      <div class="gs-shell" role="region" aria-label="Coach setup progress">
        <div class="gs-inner px-5 py-5 sm:px-8 sm:py-7 md:px-10 md:py-8">
          <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 lg:gap-8 mb-5">
            <div class="min-w-0 flex-1">
              <div class="gs-kicker mb-2"><span class="gs-kicker-dot" aria-hidden="true"></span> Coach setup</div>
              <h3 class="text-xl sm:text-2xl font-bold tracking-tight m-0 text-white leading-snug">One focused path. Zero guesswork.</h3>
              <p class="text-sm text-white/50 m-0 mt-2 max-w-2xl leading-relaxed">
                Identity → <span class="text-white/85 font-medium">annual map</span> → weekly execution → content that compounds.
                Completed steps stay clickable — jump back anytime.
              </p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-[11px] font-semibold tabular-nums text-white/60 px-2.5 py-1 rounded-full border border-white/10 bg-white/5">${doneCount} of ${items.length} complete</span>
              <button type="button" id="coach-checklist-minimize" class="gs-ghost" title="Minimize to a slim bar">Minimize</button>
              <button type="button" id="coach-checklist-dismiss" class="gs-ghost" aria-label="Dismiss setup card">Dismiss</button>
            </div>
          </div>

          <div class="gs-progress-track mb-6" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Setup progress">
            <div class="gs-progress-fill" style="width:${pct}%"></div>
          </div>

          <div class="gs-next p-5 sm:p-6 mb-7 flex flex-col md:flex-row md:items-center gap-5">
            <div class="flex items-start gap-4 min-w-0 flex-1">
              <div class="gs-icon-tile" aria-hidden="true">
                <i class="fas ${next.icon} text-white text-[1.1rem]"></i>
              </div>
              <div class="min-w-0">
                <div class="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5eead4] mb-1.5">Next · Step ${nextIndex} of ${items.length}</div>
                <div class="text-lg sm:text-xl font-bold text-white leading-snug tracking-tight">${next.label}</div>
                <p class="text-sm text-white/50 m-0 mt-1.5 leading-relaxed max-w-xl">${next.blurb}</p>
              </div>
            </div>
            <button type="button" id="coach-checklist-primary" class="gs-cta shrink-0 self-stretch md:self-center">
              ${ctaLabelFor(next)}
              <i class="fas fa-arrow-right text-[11px] opacity-90" aria-hidden="true"></i>
            </button>
          </div>

          <div class="gs-path" role="list" aria-label="Setup steps — completed steps open that tool">
            ${items.map((item, idx) => {
              const state = item.done ? 'is-done' : (item.id === next.id ? 'is-current' : '');
              const num = item.done
                ? '<i class="fas fa-check text-[10px]" aria-hidden="true"></i>'
                : String(idx + 1);
              const hint = item.done ? 'Open' : (item.id === next.id ? 'Now' : '');
              return `
              <div class="gs-path-item ${state}" role="listitem">
                <div class="gs-path-line" aria-hidden="true"></div>
                <button type="button" class="gs-step ${state}" data-checklist-id="${item.id}"
                  aria-current="${item.id === next.id ? 'step' : 'false'}"
                  title="${item.done ? 'Open: ' : ''}${item.label}">
                  <span class="gs-dot">${num}</span>
                  <span class="gs-step-label">${item.short}</span>
                  ${hint ? `<span class="gs-step-hint">${hint}</span>` : '<span class="gs-step-hint">&nbsp;</span>'}
                </button>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>`;

    document.getElementById('coach-checklist-dismiss')?.addEventListener('click', () => {
      localStorage.setItem(CHECKLIST_DISMISS_KEY, '1');
      card.remove();
    });
    document.getElementById('coach-checklist-minimize')?.addEventListener('click', () => {
      localStorage.setItem(CHECKLIST_MINIMIZED_KEY, '1');
      renderFirstRunChecklist();
    });

    // Done steps still navigate (view / revisit the tool)
    const openItem = (id) => {
      const item = items.find((i) => i.id === id);
      if (item && typeof item.run === 'function') item.run();
    };

    document.getElementById('coach-checklist-primary')?.addEventListener('click', () => openItem(next.id));
    card.querySelectorAll('.gs-step').forEach((btn) => {
      btn.addEventListener('click', () => openItem(btn.getAttribute('data-checklist-id')));
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
      if (guide.action.openPlanWizard && typeof window.openBusinessPlanWizard === 'function') {
        window.openBusinessPlanWizard();
        return;
      }
      // Prefer same-page scroll first (in-tool CTAs). Only change sections when explicit.
      const scrollTarget = guide.action.scroll;
      const needsSection = guide.action.section && guide.action.section !== sectionId;
      if (needsSection && typeof window.showSection === 'function') {
        window.showSection(guide.action.section);
      }
      setTimeout(() => {
        if (scrollTarget) {
          const node = document.getElementById(scrollTarget);
          if (node) {
            // Form jumps: pin near top so inputs aren't buried under the fold
            node.scrollIntoView({ behavior: 'smooth', block: 'start' });
            try {
              if (typeof node.focus === 'function' && !/^(DIV|SECTION|SPAN)$/i.test(node.tagName)) {
                node.focus({ preventScroll: true });
              } else {
                const focusable = node.querySelector('input, select, textarea, button, [tabindex]:not([tabindex="-1"])');
                focusable?.focus({ preventScroll: true });
              }
            } catch (e) { /* ignore */ }
          }
        }
        if (guide.action.pillar && typeof window.openVaultPillar === 'function') {
          window.openVaultPillar(guide.action.pillar);
        } else if (guide.action.search && typeof window.applyVaultSearch === 'function') {
          window.applyVaultSearch(guide.action.search);
        }
      }, needsSection ? 200 : 50);
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
    // Cross-tool handoffs belong in the bottom banner — not under How-it-works.
    // Remove any legacy top bridge from older sessions/DOM.
    document.getElementById('weekly-vault-bridge')?.remove();
  }

  function refreshOnProfileChange() {
    renderProfileNudge();
    updateHomeHero();
    renderFirstRunChecklist();
    applyProfileAwareStartHere();
    const visible = document.querySelector('main section:not(.hidden)');
    if (visible?.id && visible.id !== 'home') renderToolProfileTip(visible.id);
  }

  window.onCoachSectionShown = function onCoachSectionShown(sectionId) {
    // Keep setup card in #home-setup-slot only (never re-inject at top of every tool)
    renderProfileNudge();
    renderFirstRunChecklist();

    if (sectionId === 'home') {
      updateHomeHero();
      applyProfileAwareStartHere();
      return;
    }

    // Chat stays chat-first — no heavy section guide chrome
    if (sectionId !== 'ai-chat') {
      renderSectionGuide(sectionId);
    }
    renderToolProfileTip(sectionId);
    if (sectionId === 'value-vault') injectVaultWeeklyBridge();
    if (sectionId === 'weekly-win-plan') injectWeeklyVaultBridge();
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

    // Paint home chrome immediately — idle delay (up to 2.5s) made Coach Setup
    // and related hero bits pop in after the static home shell, which felt broken.
    // Keep this light: do NOT call onCoachSectionShown here (avoids double work +
    // section-guide work while the rest of the huge HTML is still parsing).
    const paint = () => {
      try {
        if (typeof window.__hardHideGlobalLoading === 'function') {
          window.__hardHideGlobalLoading();
        }
        renderProfileNudge();
        updateHomeHero();
        renderFirstRunChecklist();
        applyProfileAwareStartHere();
      } catch (e) {
        console.warn('[onboarding-coach] paint failed', e);
      }
    };
    // Double rAF: after layout of the home section we just finished parsing
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(function () {
        requestAnimationFrame(paint);
      });
    } else {
      paint();
    }
    // After full DOM is ready, run section hooks once (safe)
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        try {
          if (typeof window.__hardHideGlobalLoading === 'function') window.__hardHideGlobalLoading();
          const visible = document.querySelector('main section:not(.hidden)');
          if (visible?.id && typeof window.onCoachSectionShown === 'function') {
            window.onCoachSectionShown(visible.id);
          }
        } catch (e) { /* ignore */ }
      });
    }

    // Cross-tool bridges can wait — not needed for first Home paint
    const injectBridges = () => {
      try {
        injectVaultWeeklyBridge();
        injectWeeklyVaultBridge();
      } catch (e) { /* ignore */ }
    };
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(injectBridges, { timeout: 2000 });
    } else {
      setTimeout(injectBridges, 400);
    }

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

  // Prefer immediate run when placed right after #home (parser already has the section).
  if (document.getElementById('home')) {
    init();
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('%c[onboarding-coach.js] Home launchpad, setup path & section guides ready', 'color:#00A89D');
})();