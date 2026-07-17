/**
 * Guided multi-step profile wizard + LO-style tabs — Recruiting Sales Coach
 */
(function () {
  'use strict';

  const WIZARD_DONE_KEY = 'recruitProfileWizardDone';
  const PROFILE_TABS = ['identity', 'business', 'personal', 'prospecting', 'content'];

  const STEPS = [
    {
      tab: 'identity',
      short: 'Identity',
      title: 'Who you are',
      hint: 'Name and market personalize every script, plan, and coaching answer.',
      essentials: ['profile-name', 'profile-location']
    },
    {
      tab: 'business',
      short: 'Goals',
      title: 'Goals & recruiting focus',
      hint: 'Hire targets and focus power Weekly Plan, scorecards, and AI coaching.',
      essentials: ['profile-focus']
    },
    {
      tab: 'personal',
      short: 'Personal',
      title: 'Personal flavor',
      hint: 'Hobbies and personality make outreach and social content sound like you.',
      essentials: []
    },
    {
      tab: 'prospecting',
      short: 'Prospecting',
      title: 'Who you recruit',
      hint: 'Ideal LO types, activities, and challenges shape scripts and weekly tasks.',
      essentials: []
    },
    {
      tab: 'content',
      short: 'Voice',
      title: 'Voice & content style',
      hint: 'Tone and formats for Social, Blog, and AI Coach.',
      essentials: ['profile-tone']
    }
  ];

  let step = 1;
  let wizardActive = false;
  let wired = false;

  const $ = (id) => document.getElementById(id);

  function modal() {
    return $('user-profile-modal');
  }

  function readProfile() {
    try {
      if (typeof window.getUserProfile === 'function') return window.getUserProfile() || {};
      return JSON.parse(localStorage.getItem('userProfile') || '{}');
    } catch (e) {
      return {};
    }
  }

  function profileScore(p) {
    p = p || readProfile();
    let n = 0;
    if (p.name) n += 22;
    if (p.location || p.localArea || p.market) n += 22;
    if (p.email) n += 8;
    if (p.focus) n += 12;
    if (p.monthlyUnits || p.monthlyGoal) n += 8;
    if (p.tone) n += 10;
    if (p.personality) n += 6;
    if ((p.hobbies || []).length || p.hobbiesOther) n += 6;
    if ((p.partnerTypes || p.targetPartners || []).length) n += 6;
    return Math.min(100, n);
  }

  function tabFill(tabId, p) {
    p = p || readProfile();
    if (tabId === 'identity') {
      const fields = [p.name, p.location || p.localArea, p.email, p.years, p.team];
      const done = fields.filter(Boolean).length;
      return { done, total: 5 };
    }
    if (tabId === 'business') {
      const fields = [p.focus, p.monthlyUnits, p.monthlyGoal, p.hours];
      const done = fields.filter(Boolean).length;
      return { done, total: 4 };
    }
    if (tabId === 'personal') {
      const done =
        ((p.hobbies || []).length ? 1 : 0) +
        (p.family ? 1 : 0) +
        (p.personality ? 1 : 0) +
        (p.hobbiesOther ? 1 : 0);
      return { done, total: 4 };
    }
    if (tabId === 'prospecting') {
      const done =
        ((p.activities || []).length ? 1 : 0) +
        ((p.partnerTypes || p.targetPartners || []).length ? 1 : 0) +
        ((p.challenges || []).length ? 1 : 0) +
        ((p.niches || []).length ? 1 : 0);
      return { done, total: 4 };
    }
    if (tabId === 'content') {
      const done =
        (p.tone ? 1 : 0) +
        ((p.voiceTraits || []).length ? 1 : 0) +
        ((p.formats || []).length ? 1 : 0) +
        (p.contentNotes ? 1 : 0);
      return { done, total: 4 };
    }
    return { done: 0, total: 1 };
  }

  function shouldAutoWizard() {
    if (localStorage.getItem(WIZARD_DONE_KEY) === '1') return false;
    return profileScore() < 70;
  }

  function flushSave() {
    if (typeof window.performUserProfileSave === 'function') {
      try {
        window.performUserProfileSave(false, false);
        return;
      } catch (e) {
        console.warn('[profile-wizard] save failed', e);
      }
    }
    try {
      modal()?.dispatchEvent(new Event('change', { bubbles: true }));
      $('profile-name')?.dispatchEvent(new Event('input', { bubbles: true }));
    } catch (e) {}
  }

  function fieldFilled(id) {
    const el = $(id);
    if (!el) return true;
    return !!(el.value && String(el.value).trim());
  }

  function validateStep(stepNum) {
    const meta = STEPS[stepNum - 1];
    if (!meta?.essentials?.length) return { ok: true };
    const missing = meta.essentials.filter((id) => !fieldFilled(id));
    return {
      ok: !missing.length,
      message: missing.length
        ? missing.includes('profile-name') || missing.includes('profile-location')
          ? 'Add your name and primary market to continue — tools need them.'
          : 'Fill the highlighted essentials before continuing.'
        : ''
    };
  }

  function highlightEssentials(stepNum) {
    document.querySelectorAll('.recruit-wiz-essential-miss').forEach((n) => {
      n.classList.remove('recruit-wiz-essential-miss');
    });
    (STEPS[stepNum - 1]?.essentials || []).forEach((id) => {
      if (!fieldFilled(id)) $(id)?.classList.add('recruit-wiz-essential-miss');
    });
  }

  function showStepError(msg) {
    const el = $('profile-wizard-step-error');
    if (!el) return;
    if (!msg) {
      el.classList.add('hidden');
      el.textContent = '';
      return;
    }
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  /**
   * Switch visible tab panel + update tab button styles (LO pattern).
   */
  function switchProfileTab(tabId) {
    if (!PROFILE_TABS.includes(tabId)) tabId = 'identity';
    PROFILE_TABS.forEach((tab) => {
      const panel = $(`profile-tab-panel-${tab}`);
      const btn = document.querySelector(`.profile-tab-btn[data-profile-tab="${tab}"]`);
      const active = tab === tabId;
      if (panel) {
        panel.classList.toggle('hidden', !active);
        if (active) panel.classList.add('wizard-step-active');
        else panel.classList.remove('wizard-step-active');
      }
      if (btn) {
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
        btn.classList.toggle('border-[#00A89D]', active);
        btn.classList.toggle('text-[#00A89D]', active);
        btn.classList.toggle('bg-white', active);
        btn.classList.toggle('dark:bg-gray-900', active);
        btn.classList.toggle('border-transparent', !active);
        btn.classList.toggle('text-gray-500', !active);
      }
    });
    const scroll = $('profile-form-scroll');
    if (scroll) scroll.scrollTop = 0;
    updateTabBadges();
  }

  function updateTabBadges() {
    const p = readProfile();
    // Live form merge
    const live = {
      ...p,
      name: $('profile-name')?.value?.trim() || p.name,
      location: $('profile-location')?.value?.trim() || p.location,
      focus: $('profile-focus')?.value || p.focus,
      tone: $('profile-tone')?.value || p.tone,
      email: $('profile-email')?.value?.trim() || p.email
    };
    PROFILE_TABS.forEach((tab) => {
      const btn = document.querySelector(`.profile-tab-btn[data-profile-tab="${tab}"]`);
      const badge = btn?.querySelector('.profile-tab-badge');
      if (!badge) return;
      const { done, total } = tabFill(tab, live);
      if (done >= total && total > 0) {
        badge.textContent = '✓';
        badge.className = 'profile-tab-badge text-[10px] font-bold text-[#00A89D]';
      } else if (done > 0) {
        badge.textContent = `${done}/${total}`;
        badge.className = 'profile-tab-badge text-[10px] font-normal opacity-70';
      } else {
        badge.textContent = '';
        badge.className = 'profile-tab-badge text-[10px] font-normal opacity-70';
      }
    });
  }

  function renderWizardDots() {
    const dots = $('profile-wizard-dots');
    if (!dots) return;
    // Non-clickable progress only (LO-style) — free navigation is tabs in full profile
    dots.innerHTML = STEPS.map((_, i) => {
      const n = i + 1;
      const cls =
        n === step
          ? 'bg-[#00A89D] scale-110'
          : n < step
            ? 'bg-[#00A89D]/45'
            : 'bg-gray-300 dark:bg-gray-600';
      return `<span class="inline-block w-2 h-2 rounded-full transition-transform ${cls}" title="Step ${n}"></span>`;
    }).join('');
  }

  function showView(mode) {
    wizardActive = mode === 'wizard';
    const m = modal();
    if (m) m.classList.toggle('profile-modal--wizard', wizardActive);

    $('profile-wizard-view')?.classList.toggle('hidden', !wizardActive);
    $('profile-wizard-footer')?.classList.toggle('hidden', !wizardActive);
    $('profile-full-chrome')?.classList.toggle('hidden', wizardActive);
    $('profile-full-footer')?.classList.toggle('hidden', wizardActive);
    $('profile-modal-subtitle')?.classList.toggle('hidden', wizardActive);

    // LO hybrid: tabs only in full profile; guided = linear Continue/Back only
    $('profile-tab-nav')?.classList.toggle('hidden', wizardActive);

    if (wizardActive) {
      switchProfileTab(STEPS[step - 1].tab);
    }

    refreshStrengthUI();
  }

  function renderStep() {
    const meta = STEPS[step - 1] || STEPS[0];
    const pct = Math.round((step / STEPS.length) * 100);

    if ($('profile-wizard-step-title')) $('profile-wizard-step-title').textContent = meta.title;
    if ($('profile-wizard-progress')) {
      $('profile-wizard-progress').textContent = `Step ${step} of ${STEPS.length} · ${meta.short}`;
    }
    if ($('profile-wizard-step-hint')) $('profile-wizard-step-hint').textContent = meta.hint;
    if ($('profile-wizard-progress-bar')) $('profile-wizard-progress-bar').style.width = `${pct}%`;

    renderWizardDots();

    const back = $('profile-wizard-back');
    const next = $('profile-wizard-next');
    if (back) back.classList.toggle('hidden', step === 1);
    if (next) {
      next.innerHTML =
        step === STEPS.length
          ? 'Save & finish <i class="fas fa-check ml-1 text-xs"></i>'
          : 'Continue <i class="fas fa-arrow-right ml-1 text-xs"></i>';
    }

    showStepError('');
    document.querySelectorAll('.recruit-wiz-essential-miss').forEach((n) => {
      n.classList.remove('recruit-wiz-essential-miss');
    });

    showView('wizard');
    switchProfileTab(meta.tab);
  }

  function refreshStrengthUI() {
    const p = readProfile();
    const live = {
      ...p,
      name: $('profile-name')?.value?.trim() || p.name,
      location: $('profile-location')?.value?.trim() || p.location,
      focus: $('profile-focus')?.value || p.focus,
      tone: $('profile-tone')?.value || p.tone,
      email: $('profile-email')?.value?.trim() || p.email
    };
    const score = profileScore(live);

    if ($('profile-strength-score')) $('profile-strength-score').textContent = `${score}%`;
    if ($('profile-strength-bar')) $('profile-strength-bar').style.width = `${score}%`;
    if ($('profile-wizard-strength')) $('profile-wizard-strength').textContent = `${score}% complete`;

    const hints = $('profile-strength-hints');
    if (hints) {
      const missing = [];
      if (!live.name) missing.push('name');
      if (!live.location) missing.push('market');
      if (!live.focus) missing.push('focus');
      if (!live.tone) missing.push('tone');
      if (missing.length) {
        hints.innerHTML = missing
          .map(
            (m) =>
              `<span class="inline-flex items-center gap-1 text-[11px] text-gray-600 dark:text-gray-400"><i class="fas fa-arrow-right text-[#00A89D] text-[9px]"></i> Add ${m}</span>`
          )
          .join('');
      } else {
        hints.innerHTML =
          '<span class="text-[11px] text-[#00A89D]"><i class="fas fa-check-circle"></i> Profile is strong — tools will personalize well.</span>';
      }
    }

    const preview = $('profile-live-preview-text');
    if (preview) {
      const bits = [live.name, live.location, live.focus, live.tone].filter(Boolean);
      preview.textContent = bits.length
        ? bits.join(' · ')
        : 'Complete your profile so every tool sounds like you.';
    }

    const tools = $('profile-live-preview-tools');
    if (tools) {
      tools.innerHTML = ['Scripts', 'Weekly Plan', 'AI Coach', 'Voice Roleplay', 'Call Review', 'Social']
        .map(
          (t) =>
            `<span class="text-[10px] px-2 py-0.5 rounded-full bg-[#00A89D]/10 text-[#00A89D] font-semibold">${t}</span>`
        )
        .join('');
    }

    updateTabBadges();
  }

  function startWizard(at) {
    step = Math.max(1, Math.min(STEPS.length, at || 1));
    renderStep();
  }

  function finishWizard() {
    flushSave();
    localStorage.setItem(WIZARD_DONE_KEY, '1');
    showView('full');
    switchProfileTab('identity');
    refreshStrengthUI();
    if (typeof window.showToast === 'function') {
      window.showToast('Profile setup complete — use the tabs anytime to edit.', 'success');
    }
    if (typeof window.refreshRecruitHome === 'function') {
      try {
        window.refreshRecruitHome();
      } catch (e) {}
    }
  }

  function goNext() {
    const v = validateStep(step);
    if (!v.ok) {
      showStepError(v.message);
      highlightEssentials(step);
      return;
    }
    flushSave();
    if (step < STEPS.length) {
      step += 1;
      renderStep();
    } else {
      finishWizard();
    }
  }

  function goBack() {
    flushSave();
    if (step > 1) {
      step -= 1;
      renderStep();
    }
  }

  function onTabClick(tabId) {
    // Tabs are full-profile only (hidden during guided setup)
    if (wizardActive) return;
    const idx = PROFILE_TABS.indexOf(tabId);
    if (idx < 0) return;
    flushSave();
    switchProfileTab(tabId);
    refreshStrengthUI();
  }

  function openProfile(forceFull) {
    if (typeof window.__openUserProfileCore === 'function') {
      window.__openUserProfileCore();
    } else {
      const m = modal();
      if (m) {
        m.classList.remove('hidden');
        m.classList.add('flex');
      }
    }

    setTimeout(() => {
      if (!forceFull && shouldAutoWizard()) {
        startWizard(1);
      } else {
        showView('full');
        switchProfileTab('identity');
        refreshStrengthUI();
      }
    }, 40);
  }

  function wire() {
    if (wired) return;
    wired = true;

    $('profile-open-wizard')?.addEventListener('click', () => startWizard(1));
    $('profile-wizard-skip')?.addEventListener('click', () => {
      flushSave();
      localStorage.setItem(WIZARD_DONE_KEY, '1');
      showView('full');
      switchProfileTab('identity');
      refreshStrengthUI();
    });
    $('profile-wizard-back')?.addEventListener('click', goBack);
    $('profile-wizard-next')?.addEventListener('click', goNext);
    $('profile-wizard-save-exit')?.addEventListener('click', () => {
      flushSave();
      localStorage.setItem(WIZARD_DONE_KEY, '1');
      if (typeof window.performUserProfileSave === 'function') {
        window.performUserProfileSave(true, true);
      } else {
        $('save-profile')?.click();
      }
    });

    // Tab clicks (wizard + full)
    document.querySelectorAll('.profile-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-profile-tab');
        if (tab) onTabClick(tab);
      });
    });

    modal()?.addEventListener('input', () => {
      if (modal() && !modal().classList.contains('hidden')) {
        refreshStrengthUI();
        showStepError('');
        document.querySelectorAll('.recruit-wiz-essential-miss').forEach((n) => {
          n.classList.remove('recruit-wiz-essential-miss');
        });
      }
    });
    modal()?.addEventListener('change', () => {
      if (modal() && !modal().classList.contains('hidden')) refreshStrengthUI();
    });

    const installGate = () => {
      if (typeof window.openUserProfile === 'function' && !window.openUserProfile._isWizardGate) {
        window.__openUserProfileCore = window.openUserProfile;
        const gate = function (forceFull) {
          openProfile(!!forceFull);
        };
        gate._isWizardGate = true;
        window.openUserProfile = gate;
      }
    };
    installGate();
    setTimeout(installGate, 300);
    setTimeout(installGate, 1200);

    window.startProfileWizard = startWizard;
    window.switchProfileTab = switchProfileTab;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }

  console.log('%c[recruit-profile-wizard] Tabs + guided setup ready', 'color:#00A89D');
})();
