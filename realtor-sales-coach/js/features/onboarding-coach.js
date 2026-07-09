/**
 * js/features/onboarding-coach.js (Agent Sales Coach)
 * Profile nudge, section micro-guides, profile-aware Start Here,
 * Weekly Win Plan ↔ Value Vault cross-links.
 */
(function () {
  'use strict';

  const DISMISS_PREFIX = 'coachGuideDismissed_';
  const PROFILE_NUDGE_KEY = 'coachProfileNudgeDismissed';

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

    const banner = document.createElement('div');
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
              <div class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Add ${missingLabel || 'your basics'} so AI answers, weekly plans, and scripts sound like <em>you</em> — not generic filler.</div>
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

    if (focus === 'database' || focus.includes('database') || focus.includes('past client') || focus.includes('sphere') || challenges.includes('database') || challenges.includes('sphere') || challenges.includes('past client')) {
      return 'nurture';
    }
    if (focus.includes('social') || focus.includes('content') || challenges.includes('content') || challenges.includes('social')) {
      return 'content';
    }
    if (focus === 'listings' || focus.includes('listing') || focus.includes('seller') || challenges.includes('listing')) {
      return 'opportunity';
    }
    if (focus === 'buyers' || focus.includes('buyer') || challenges.includes('buyer')) {
      return 'opportunity';
    }
    if (focus === 'agent-network' || partners.includes('agent') || focus.includes('co-broke') || focus.includes('referral') || focus.includes('partner') || challenges.includes('referral') || challenges.includes('co-broke')) {
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
      opportunity: 'listing-description'
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
      body: 'Generate your plan, block 2–3 power hours on your calendar, then execute one sphere or partner touch from Value Vault the same day.',
      action: { label: 'Pick a Pop-By →', section: 'value-vault' }
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
      body: 'Open your referral partner playbook, pick one co-broke touch from Value Vault, then run agent onboarding on your next new partner.',
      action: { label: 'Partner playbooks →', section: 'referrals' }
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
    'listing-description': {
      icon: 'fa-pen-fancy',
      title: 'Listing opportunity',
      body: 'Generate scroll-stopping listing copy, then weave highlights into Social posts and your next newsletter.',
      action: { label: 'Social Post Creator →', section: 'social' }
    }
  };

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
          <span><strong>Sphere touch this week?</strong> Grab a Pop-By idea from Value Vault and drop it into a prospecting block.</span>
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
    applyProfileAwareStartHere();
  }

  window.onCoachSectionShown = function onCoachSectionShown(sectionId) {
    renderProfileNudge();
    renderSectionGuide(sectionId);
    if (sectionId === 'value-vault') injectVaultWeeklyBridge();
    if (sectionId === 'weekly-win-plan') injectWeeklyVaultBridge();
    if (sectionId === 'ai-chat') applyProfileAwareStartHere();
  };

  function init() {
    if (localStorage.getItem(PROFILE_NUDGE_KEY) === '1') {
      localStorage.removeItem(PROFILE_NUDGE_KEY);
    }

    renderProfileNudge();
    applyProfileAwareStartHere();
    injectVaultWeeklyBridge();
    injectWeeklyVaultBridge();

    const visible = document.querySelector('main section:not(.hidden)');
    if (visible?.id) window.onCoachSectionShown(visible.id);

    window.addEventListener('storage', (e) => {
      if (e.key === 'userProfile') refreshOnProfileChange();
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

    window.refreshCoachOnboarding = refreshOnProfileChange;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('%c[onboarding-coach.js] Profile nudge, section guides & vault bridges ready', 'color:#00A89D');
})();