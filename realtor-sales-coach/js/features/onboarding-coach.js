/**
 * js/features/onboarding-coach.js
 * Profile completion nudge — Agent Sales Coach (mirrors LO tool pattern).
 */
(function () {
  'use strict';

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
    return { score: 0, missing: [], isComplete: false };
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

    const missingLabel = (missing || []).slice(0, 3).map((m) => (typeof m === 'string' ? m : m.hint)).join(', ');
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
      if (typeof window.openUserProfile === 'function') window.openUserProfile();
    });
    document.getElementById('coach-profile-nudge-dismiss')?.addEventListener('click', () => {
      sessionStorage.setItem(PROFILE_NUDGE_KEY, '1');
      banner.remove();
      document.getElementById('global-profile-nudge')?.replaceChildren();
    });
  }

  function refreshOnProfileChange() {
    renderProfileNudge();
  }

  window.onCoachSectionShown = function onCoachSectionShown() {
    renderProfileNudge();
  };

  function init() {
    if (localStorage.getItem(PROFILE_NUDGE_KEY) === '1') {
      localStorage.removeItem(PROFILE_NUDGE_KEY);
    }

    renderProfileNudge();

    const visible = document.querySelector('main section:not(.hidden)');
    if (visible?.id && typeof window.onCoachSectionShown === 'function') {
      window.onCoachSectionShown(visible.id);
    }

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
      profileModal.addEventListener('input', () => {
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

  console.log('%c[onboarding-coach.js] Profile nudge ready', 'color:#00A89D');
})();