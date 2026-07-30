/**
 * Guided 2026 Business Plan wizard — writes to the same #planning form fields
 * as the full form (target-income, plan-style, hobbies, activities, plan-notes, etc.).
 * LO first; same file ports to realtor / recruiter when planning section exists.
 */
(function () {
  'use strict';

  const TOTAL_STEPS = 6;
  const STORAGE_KEY = 'bizPlanWizardLastStep';
  const WIZARD_DOM_VERSION = '4';

  const STEP_META = [
    { title: 'Welcome', subtitle: 'Profile foundation' },
    { title: 'Vision', subtitle: 'Style + big numbers' },
    { title: 'The math', subtitle: 'Optional targets' },
    { title: 'Fuel', subtitle: 'Hobbies & reality' },
    { title: 'Activities', subtitle: 'How you build relationships' },
    { title: 'Review', subtitle: 'Notes & generate' }
  ];

  const PRESETS = [
    { id: 'conservative', label: 'Conservative', desc: 'Sustainable pace' },
    { id: 'realistic', label: 'Realistic', desc: 'Recommended growth' },
    { id: 'stretch', label: 'Stretch', desc: 'Ambitious year' },
    { id: 'moonshot', label: 'Moonshot', desc: 'Go big' },
    { id: 'hobby-first', label: 'Hobby-First', desc: 'Make it fun' }
  ];

  let currentStep = 1;
  let wizardEl = null;

  function $(id) {
    return document.getElementById(id);
  }

  function getProfile() {
    try {
      if (typeof window.getUserProfile === 'function') return window.getUserProfile() || {};
    } catch (e) {}
    return {};
  }

  function track(action, extra) {
    if (typeof window.trackCoachEvent === 'function') {
      window.trackCoachEvent({
        tool: 'planning',
        action,
        eventName: 'business_plan_wizard',
        label: extra || action
      });
    }
  }

  function setFormVal(id, val) {
    const el = $(id);
    if (!el || val === undefined || val === null) return;
    el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function setPlanStyle(value) {
    const radios = document.querySelectorAll('input[name="plan-style"]');
    let matched = false;
    radios.forEach((r) => {
      if (r.value === value) {
        r.checked = true;
        matched = true;
        r.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    if (!matched && radios.length) {
      const bal = Array.from(radios).find((r) => r.value === 'Balanced Growth') || radios[0];
      bal.checked = true;
      bal.dispatchEvent(new Event('change', { bubbles: true }));
    }
    // Highlight style cards if present
    document.querySelectorAll('.plan-style-card').forEach((card) => {
      const input = card.querySelector('input[name="plan-style"]');
      if (!input) return;
      if (input.checked) {
        card.classList.add('border-[#00A89D]', 'bg-[#00A89D]/5');
        card.classList.remove('border-gray-200', 'dark:border-gray-700');
      } else {
        card.classList.remove('border-[#00A89D]', 'bg-[#00A89D]/5');
        card.classList.add('border-gray-200', 'dark:border-gray-700');
      }
    });
  }

  function getPlanStyle() {
    return document.querySelector('input[name="plan-style"]:checked')?.value || 'Balanced Growth';
  }

  function syncHobbiesFromWizard() {
    const selected = Array.from(document.querySelectorAll('#bp-wizard-hobbies [data-hobby-val]:checked')).map(
      (c) => c.getAttribute('data-hobby-val')
    );
    document.querySelectorAll('#planning .hobby-checkbox').forEach((cb) => {
      cb.checked = selected.includes(cb.value);
    });
    const other = ($('bp-wizard-hobby-other')?.value || '').trim();
    if ($('hobby-other')) setFormVal('hobby-other', other);
    try {
      localStorage.setItem('winPlan_hobbies', JSON.stringify(selected));
    } catch (e) {}
  }

  function syncActivitiesFromWizard() {
    const selected = Array.from(document.querySelectorAll('#bp-wizard-activities [data-activity-val]:checked')).map(
      (c) => c.getAttribute('data-activity-val')
    );
    document.querySelectorAll('#planning .activity-checkbox').forEach((cb) => {
      cb.checked = selected.includes(cb.value);
    });
    try {
      localStorage.setItem('winPlan_activities', JSON.stringify(selected));
    } catch (e) {}
  }

  function pullFormIntoWizard() {
    $('bp-wizard-income') && ($('bp-wizard-income').value = $('target-income')?.value || '');
    $('bp-wizard-closings') && ($('bp-wizard-closings').value = $('target-closings')?.value || '');
    $('bp-wizard-avg-commission') && ($('bp-wizard-avg-commission').value = $('avg-commission')?.value || '');
    $('bp-wizard-avg-loan') && ($('bp-wizard-avg-loan').value = $('avg-loan')?.value || '');
    $('bp-wizard-closing-ratio') && ($('bp-wizard-closing-ratio').value = $('closing-ratio')?.value || '');
    $('bp-wizard-new-partners') && ($('bp-wizard-new-partners').value = $('new-partners')?.value || '');
    $('bp-wizard-current-partners') && ($('bp-wizard-current-partners').value = $('current-partners')?.value || '');
    $('bp-wizard-database-size') && ($('bp-wizard-database-size').value = $('database-size')?.value || '');
    $('bp-wizard-notes') && ($('bp-wizard-notes').value = $('plan-notes')?.value || '');
    $('bp-wizard-hobby-other') && ($('bp-wizard-hobby-other').value = $('hobby-other')?.value || '');

    const style = getPlanStyle();
    document.querySelectorAll('#bp-wizard-style-grid [data-plan-style]').forEach((btn) => {
      const on = btn.getAttribute('data-plan-style') === style;
      btn.classList.toggle('ring-2', on);
      btn.classList.toggle('ring-[#00A89D]', on);
      btn.classList.toggle('border-[#00A89D]', on);
      btn.classList.toggle('bg-[#00A89D]/10', on);
    });

    const hobbyChecked = new Set(
      Array.from(document.querySelectorAll('#planning .hobby-checkbox:checked')).map((c) => c.value)
    );
    document.querySelectorAll('#bp-wizard-hobbies [data-hobby-val]').forEach((cb) => {
      cb.checked = hobbyChecked.has(cb.getAttribute('data-hobby-val'));
    });
    const actChecked = new Set(
      Array.from(document.querySelectorAll('#planning .activity-checkbox:checked')).map((c) => c.value)
    );
    document.querySelectorAll('#bp-wizard-activities [data-activity-val]').forEach((cb) => {
      cb.checked = actChecked.has(cb.getAttribute('data-activity-val'));
    });
  }

  function pushWizardToForm() {
    setFormVal('target-income', $('bp-wizard-income')?.value);
    setFormVal('target-closings', $('bp-wizard-closings')?.value);
    setFormVal('avg-commission', $('bp-wizard-avg-commission')?.value);
    setFormVal('avg-loan', $('bp-wizard-avg-loan')?.value);
    setFormVal('closing-ratio', $('bp-wizard-closing-ratio')?.value);
    setFormVal('new-partners', $('bp-wizard-new-partners')?.value);
    setFormVal('current-partners', $('bp-wizard-current-partners')?.value);
    setFormVal('database-size', $('bp-wizard-database-size')?.value);
    setFormVal('plan-notes', $('bp-wizard-notes')?.value);
    syncHobbiesFromWizard();
    syncActivitiesFromWizard();
    try {
      localStorage.setItem('winPlan_target-closings', $('target-closings')?.value || '');
      localStorage.setItem('winPlan_target-income', $('target-income')?.value || '');
    } catch (e) {}
    if (typeof window.updatePlanLiveInsight === 'function') window.updatePlanLiveInsight();
    if (typeof window.updatePlanCompleteness === 'function') window.updatePlanCompleteness();
    if (typeof window.updateHobbyTactics === 'function') window.updateHobbyTactics();
  }

  function refreshProfileCard() {
    const p = getProfile();
    const name = p.name || '—';
    const market = p.location || p.localArea || p.market || '—';
    const focus = p.focusLabel || p.focus || '—';
    if ($('bp-wizard-profile-name')) $('bp-wizard-profile-name').textContent = name;
    if ($('bp-wizard-profile-market')) $('bp-wizard-profile-market').textContent = market;
    if ($('bp-wizard-profile-focus')) $('bp-wizard-profile-focus').textContent = String(focus);
    const weak = !p.name || !(p.location || p.localArea || p.market);
    $('bp-wizard-profile-warn')?.classList.toggle('hidden', !weak);
  }

  function updateStrengthHint() {
    const el = $('bp-wizard-strength-hint');
    if (!el) return;
    let score = 20;
    if ($('bp-wizard-income')?.value) score += 20;
    if ($('bp-wizard-closings')?.value) score += 15;
    if (document.querySelector('#bp-wizard-hobbies [data-hobby-val]:checked')) score += 15;
    if (document.querySelector('#bp-wizard-activities [data-activity-val]:checked')) score += 15;
    if (($('bp-wizard-notes')?.value || '').trim().length > 20) score += 15;
    score = Math.min(100, score);
    el.textContent = score + '% plan strength (estimate)';
    const bar = $('bp-wizard-strength-bar');
    if (bar) bar.style.width = score + '%';
  }

  function renderStepNav() {
    const nav = $('bp-wizard-step-nav');
    if (!nav) return;
    nav.innerHTML = STEP_META.map(
      (s, i) => {
        const n = i + 1;
        const active = n === currentStep;
        const done = n < currentStep;
        return `<button type="button" data-bp-step-jump="${n}" class="flex-1 min-w-0 text-center py-2 px-1 rounded-xl transition text-[10px] sm:text-xs font-semibold leading-tight ${
          active
            ? 'bg-[#00A89D] text-white shadow-sm'
            : done
              ? 'bg-[#00A89D]/15 text-[#00A89D]'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        }"><span class="block truncate">${s.title}</span></button>`;
      }
    ).join('');
    nav.querySelectorAll('[data-bp-step-jump]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const n = parseInt(btn.getAttribute('data-bp-step-jump'), 10);
        if (n >= 1 && n <= TOTAL_STEPS) goStep(n);
      });
    });
  }

  function renderStep() {
    if (!wizardEl) return;
    wizardEl.querySelectorAll('[data-bp-wizard-step]').forEach((panel) => {
      const n = parseInt(panel.getAttribute('data-bp-wizard-step'), 10);
      panel.classList.toggle('hidden', n !== currentStep);
    });
    const meta = STEP_META[currentStep - 1];
    if ($('bp-wizard-step-label')) $('bp-wizard-step-label').textContent = `Step ${currentStep} of ${TOTAL_STEPS} — ${meta.title}`;
    if ($('bp-wizard-step-sub')) $('bp-wizard-step-sub').textContent = meta.subtitle;
    const pct = Math.round((currentStep / TOTAL_STEPS) * 100);
    if ($('bp-wizard-progress')) $('bp-wizard-progress').style.width = pct + '%';

    $('bp-wizard-back')?.classList.toggle('invisible', currentStep === 1);
    const next = $('bp-wizard-next');
    const gen = $('bp-wizard-generate');
    const isLast = currentStep === TOTAL_STEPS;
    if (next) next.classList.toggle('hidden', isLast);
    if (gen) gen.classList.toggle('hidden', !isLast);
    renderStepNav();
    refreshProfileCard();
    updateStrengthHint();
    renderReviewSummary();
    try {
      localStorage.setItem(STORAGE_KEY, String(currentStep));
    } catch (e) {}
  }

  function renderReviewSummary() {
    const box = $('bp-wizard-review-summary');
    if (!box || currentStep !== TOTAL_STEPS) return;
    const style = getPlanStyle();
    const income = $('bp-wizard-income')?.value || '—';
    const closings = $('bp-wizard-closings')?.value || '—';
    const hobbies = Array.from(document.querySelectorAll('#bp-wizard-hobbies [data-hobby-val]:checked'))
      .map((c) => c.getAttribute('data-hobby-val'))
      .join(', ') || 'None selected';
    const acts = Array.from(document.querySelectorAll('#bp-wizard-activities [data-activity-val]:checked'))
      .map((c) => c.closest('label')?.querySelector('span')?.textContent?.trim() || c.getAttribute('data-activity-val'))
      .join(', ') || 'None selected';
    box.innerHTML = `
      <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm m-0">
        <div><dt class="text-xs text-gray-400 m-0">Vision style</dt><dd class="font-semibold text-[#002B5C] dark:text-white m-0">${escapeHtml(style)}</dd></div>
        <div><dt class="text-xs text-gray-400 m-0">Income / closings</dt><dd class="font-semibold text-[#002B5C] dark:text-white m-0">${escapeHtml(income)} / ${escapeHtml(closings)}</dd></div>
        <div class="sm:col-span-2"><dt class="text-xs text-gray-400 m-0">Hobbies</dt><dd class="m-0 text-gray-700 dark:text-gray-300">${escapeHtml(hobbies)}</dd></div>
        <div class="sm:col-span-2"><dt class="text-xs text-gray-400 m-0">Activities</dt><dd class="m-0 text-gray-700 dark:text-gray-300">${escapeHtml(acts)}</dd></div>
      </dl>`;
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function goStep(n) {
    currentStep = Math.max(1, Math.min(TOTAL_STEPS, n));
    renderStep();
    $('bp-wizard-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function nextStep() {
    if (currentStep < TOTAL_STEPS) {
      pushWizardToForm();
      goStep(currentStep + 1);
      track('step_' + currentStep);
      return;
    }
    // Final: generate
    pushWizardToForm();
    closeWizard();
    track('generate');
    if (typeof window.generatePlan === 'function') {
      window.generatePlan('plan-output');
    } else {
      $('generate-plan-btn')?.click();
    }
    if (typeof window.showToast === 'function') {
      window.showToast('Building your 2026 plan…', 'info');
    }
  }

  function backStep() {
    if (currentStep > 1) goStep(currentStep - 1);
  }

  function applyPreset(id) {
    if (typeof window.applyPlanPreset === 'function') {
      window.applyPlanPreset(id);
    }
    pullFormIntoWizard();
    updateStrengthHint();
    track('preset', id);
    if (typeof window.showToast === 'function') {
      window.showToast('Preset applied — tweak numbers anytime.', 'success');
    }
  }

  function ensureWizardDom() {
    const existing = $('bp-wizard-overlay');
    if (existing && existing.dataset.bpWizardVersion !== WIZARD_DOM_VERSION) {
      existing.remove();
      wizardEl = null;
    }
    if ($('bp-wizard-overlay')) {
      wizardEl = $('bp-wizard-overlay');
      return;
    }

    const hobbiesFromForm = Array.from(document.querySelectorAll('#planning .hobby-checkbox')).map((cb) => ({
      value: cb.value,
      label: cb.closest('label')?.querySelector('span')?.textContent?.trim() || cb.value
    }));
    const activitiesFromForm = Array.from(document.querySelectorAll('#planning .activity-checkbox')).map((cb) => ({
      value: cb.value,
      label: cb.closest('label')?.querySelector('span')?.textContent?.trim() || cb.value
    }));

    const hobbyFallback = [
      { value: 'Golf', label: 'Golf' },
      { value: 'Sports', label: 'Sports' },
      { value: 'Family Time', label: 'Family Time' },
      { value: 'Outdoors', label: 'Outdoors' },
      { value: 'Fitness', label: 'Fitness' },
      { value: 'Cooking', label: 'Cooking' }
    ];
    const actFallback = [
      { value: 'Coffee/Drink Appointments', label: 'Coffee / Drinks' },
      { value: 'Lunch Appointments', label: 'Lunch appointments' },
      { value: 'Personal Notes/Cards', label: 'Handwritten notes' },
      { value: 'Phone Calls', label: 'Phone calls' },
      { value: 'Deliveries', label: 'Pop-by gifts' },
      { value: 'Value Emails', label: 'Value emails' }
    ];
    const hobbies = hobbiesFromForm.length ? hobbiesFromForm : hobbyFallback;
    const activities = activitiesFromForm.length ? activitiesFromForm : actFallback;

    const styles = Array.from(document.querySelectorAll('input[name="plan-style"]')).map((r) => ({
      value: r.value,
      label: r.closest('label')?.querySelector('.font-bold')?.textContent?.trim() || r.value,
      desc: r.closest('label')?.querySelector('.text-sm')?.textContent?.trim() || ''
    }));
    const styleList =
      styles.length > 0
        ? styles
        : [
            { value: 'Referral Mastery', label: 'Referral Mastery', desc: 'Partners first' },
            { value: 'Database Reactor', label: 'Database Reactor', desc: 'Past clients & sphere' },
            { value: 'Balanced Growth', label: 'Balanced Growth', desc: 'Flexible mix' }
          ];

    const overlay = document.createElement('div');
    overlay.id = 'bp-wizard-overlay';
    overlay.className = 'hidden fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/55 backdrop-blur-sm';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'bp-wizard-heading');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.dataset.bpWizardVersion = WIZARD_DOM_VERSION;

    overlay.innerHTML = `
      <div class="bg-white dark:bg-gray-900 w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col">
        <div class="shrink-0 border-b border-gray-200 dark:border-gray-700 px-5 sm:px-6 py-4">
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="min-w-0">
              <h3 id="bp-wizard-heading" class="text-lg sm:text-xl font-bold text-[#002B5C] dark:text-white m-0">2026 Business Plan Wizard</h3>
              <p id="bp-wizard-step-label" class="text-sm text-gray-500 mt-1 m-0"></p>
              <p id="bp-wizard-step-sub" class="text-xs text-gray-400 mt-0.5 m-0"></p>
            </div>
            <button type="button" id="bp-wizard-close" class="shrink-0 w-9 h-9 rounded-full border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800" aria-label="Close">&times;</button>
          </div>
          <div id="bp-wizard-step-nav" class="flex gap-1 mb-3 overflow-x-auto pb-0.5"></div>
          <div class="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div id="bp-wizard-progress" class="h-full bg-gradient-to-r from-[#00A89D] to-[#F15A29] transition-all duration-300" style="width:16%"></div>
          </div>
        </div>

        <div id="bp-wizard-scroll" class="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4">
          <!-- Step 1 -->
          <div data-bp-wizard-step="1">
            <div class="rounded-2xl bg-gradient-to-br from-[#00A89D]/10 to-[#002B5C]/5 border border-[#00A89D]/25 p-5 mb-4">
              <p class="text-sm text-gray-700 dark:text-gray-300 m-0 leading-relaxed">
                <strong class="text-[#002B5C] dark:text-white">About 3–4 minutes</strong> — we’ll set vision, numbers, hobbies, and how you like to work. Everything writes into the full plan form so you can fine-tune anytime.
              </p>
            </div>
            <div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
              <span class="text-xs font-bold uppercase tracking-wider text-[#00A89D]">From your profile</span>
              <dl class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm m-0 mt-3">
                <div><dt class="text-gray-400 text-xs mb-0.5">Name</dt><dd id="bp-wizard-profile-name" class="font-semibold m-0 truncate">—</dd></div>
                <div><dt class="text-gray-400 text-xs mb-0.5">Market</dt><dd id="bp-wizard-profile-market" class="font-semibold m-0 truncate">—</dd></div>
                <div><dt class="text-gray-400 text-xs mb-0.5">Focus</dt><dd id="bp-wizard-profile-focus" class="font-semibold m-0 truncate">—</dd></div>
              </dl>
              <p id="bp-wizard-profile-warn" class="hidden text-xs text-amber-700 dark:text-amber-300 mt-3 mb-0">Tip: Open <strong>My Profile</strong> for richer personalization (goals, hobbies, challenges all feed this plan).</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button type="button" id="bp-wizard-sync-profile" class="text-sm px-4 py-2 rounded-full border-2 border-[#00A89D] text-[#00A89D] font-semibold hover:bg-[#00A89D] hover:text-white transition">
                <i class="fas fa-sync mr-1"></i> Sync form from profile
              </button>
              <button type="button" id="bp-wizard-skip-full" class="text-sm px-4 py-2 rounded-full border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                Skip to full form
              </button>
            </div>
          </div>

          <!-- Step 2 -->
          <div data-bp-wizard-step="2" class="hidden">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Pick the path that feels most like you, then set the big numbers.</p>
            <div id="bp-wizard-style-grid" class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              ${styleList
                .map(
                  (s) => `
                <button type="button" data-plan-style="${escapeHtml(s.value)}"
                  class="text-left rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-4 hover:border-[#00A89D]/50 transition">
                  <div class="font-bold text-[#002B5C] dark:text-white text-sm">${escapeHtml(s.label)}</div>
                  <div class="text-xs text-gray-500 mt-1">${escapeHtml(s.desc)}</div>
                </button>`
                )
                .join('')}
            </div>
            <div class="mb-4">
              <div class="text-xs font-bold tracking-wider text-[#00A89D] mb-2">QUICK START PRESETS</div>
              <div class="flex flex-wrap gap-2">
                ${PRESETS.map(
                  (p) =>
                    `<button type="button" data-bp-preset="${p.id}" class="text-xs px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 hover:border-[#00A89D] hover:text-[#00A89D] font-medium transition" title="${escapeHtml(p.desc)}">${escapeHtml(p.label)}</button>`
                ).join('')}
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-[#00A89D] mb-1" for="bp-wizard-income">Target annual income</label>
                <input type="number" id="bp-wizard-income" placeholder="e.g. 275000" class="w-full p-3 rounded-xl border-2 border-[#00A89D] bg-white dark:bg-gray-800">
              </div>
              <div>
                <label class="block text-sm font-semibold text-[#00A89D] mb-1" for="bp-wizard-closings">Target funded loans / closings</label>
                <input type="number" id="bp-wizard-closings" placeholder="e.g. 65" class="w-full p-3 rounded-xl border-2 border-[#00A89D] bg-white dark:bg-gray-800">
              </div>
            </div>
          </div>

          <!-- Step 3 -->
          <div data-bp-wizard-step="3" class="hidden">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Optional but helpful — makes milestones realistic. Leave blank to skip.</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label class="text-xs font-medium block mb-1">Avg commission per loan</label><input type="number" id="bp-wizard-avg-commission" placeholder="6500" class="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"></div>
              <div><label class="text-xs font-medium block mb-1">Avg loan amount</label><input type="number" id="bp-wizard-avg-loan" placeholder="400000" class="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"></div>
              <div><label class="text-xs font-medium block mb-1">Closing ratio %</label><input type="number" id="bp-wizard-closing-ratio" placeholder="30" class="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"></div>
              <div><label class="text-xs font-medium block mb-1">New partners target</label><input type="number" id="bp-wizard-new-partners" placeholder="15" class="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"></div>
            </div>
          </div>

          <!-- Step 4 -->
          <div data-bp-wizard-step="4" class="hidden">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">What fuels you outside work? Optional flavor for content and rapport — never the whole plan.</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div><label class="text-xs font-medium block mb-1">Current referral partners</label><input type="number" id="bp-wizard-current-partners" placeholder="18" class="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"></div>
              <div><label class="text-xs font-medium block mb-1">Database size (sphere + past)</label><input type="number" id="bp-wizard-database-size" placeholder="650" class="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"></div>
            </div>
            <div id="bp-wizard-hobbies" class="flex flex-wrap gap-2 mb-3">
              ${hobbies
                .map(
                  (h) => `
                <label class="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-2xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-[#00A89D] has-[:checked]:bg-[#00A89D] has-[:checked]:text-white has-[:checked]:border-[#00A89D] transition">
                  <input type="checkbox" data-hobby-val="${escapeHtml(h.value)}" class="hidden">
                  <span>${escapeHtml(h.label)}</span>
                </label>`
                )
                .join('')}
            </div>
            <input type="text" id="bp-wizard-hobby-other" placeholder="Other passions…" class="w-full p-3 text-sm rounded-xl border-2 border-[#00A89D] bg-white dark:bg-gray-800">
          </div>

          <!-- Step 5 -->
          <div data-bp-wizard-step="5" class="hidden">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">How do you actually like building relationships? We’ll lean into these.</p>
            <div id="bp-wizard-activities" class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              ${activities
                .map(
                  (a) => `
                <label class="flex items-center gap-2 px-3 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-[#00A89D] has-[:checked]:bg-[#00A89D]/10 transition">
                  <input type="checkbox" data-activity-val="${escapeHtml(a.value)}" class="accent-[#00A89D]">
                  <span class="text-sm">${escapeHtml(a.label)}</span>
                </label>`
                )
                .join('')}
            </div>
          </div>

          <!-- Step 6 -->
          <div data-bp-wizard-step="6" class="hidden">
            <div class="mb-4">
              <div class="flex items-center justify-between text-xs font-semibold mb-1">
                <span class="text-[#00A89D]">PLAN STRENGTH</span>
                <span id="bp-wizard-strength-hint" class="font-mono text-[#F15A29]">—</span>
              </div>
              <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div id="bp-wizard-strength-bar" class="h-full bg-gradient-to-r from-[#00A89D] to-[#F15A29] transition-all" style="width:35%"></div>
              </div>
            </div>
            <div id="bp-wizard-review-summary" class="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 mb-4 bg-gray-50/80 dark:bg-gray-800/40"></div>
            <label class="block text-sm font-semibold text-[#00A89D] mb-2" for="bp-wizard-notes">Anything else on your mind?</label>
            <textarea id="bp-wizard-notes" rows="4" placeholder="I want this year to feel lighter… database is gold but I never touch it…" class="w-full p-4 rounded-2xl border-2 border-[#00A89D] bg-white dark:bg-gray-800 text-sm"></textarea>
            <p class="text-xs text-gray-500 mt-3 m-0">Hit <strong>Build my plan</strong> to generate. You can always open the full form afterward to refine.</p>
          </div>
        </div>

        <div class="shrink-0 border-t border-gray-200 dark:border-gray-700 px-5 sm:px-6 py-4 flex items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800">
          <button type="button" id="bp-wizard-open-full" class="text-xs font-semibold text-[#00A89D] hover:underline">Open full form</button>
          <div class="flex gap-2 ml-auto">
            <button type="button" id="bp-wizard-back" class="px-4 py-2.5 rounded-full border border-gray-300 dark:border-gray-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">Back</button>
            <button type="button" id="bp-wizard-next" class="px-5 py-2.5 rounded-full bg-[#00A89D] hover:bg-[#008F85] text-white text-sm font-semibold transition">Continue</button>
            <button type="button" id="bp-wizard-generate" class="hidden px-5 py-2.5 rounded-full bg-gradient-to-r from-[#00A89D] to-[#F15A29] text-white text-sm font-bold shadow-md hover:opacity-95 transition"><i class="fas fa-magic mr-2"></i>Build my plan</button>
          </div>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    wizardEl = overlay;

    overlay.querySelector('#bp-wizard-close')?.addEventListener('click', closeWizard);
    overlay.querySelector('#bp-wizard-back')?.addEventListener('click', backStep);
    overlay.querySelector('#bp-wizard-next')?.addEventListener('click', nextStep);
    overlay.querySelector('#bp-wizard-generate')?.addEventListener('click', nextStep);
    overlay.querySelector('#bp-wizard-open-full')?.addEventListener('click', () => {
      closeWizard();
      setTimeout(() => document.getElementById('plan-full-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    });
    if (window.CoachWizardA11y && typeof window.CoachWizardA11y.wireWizardA11y === 'function') {
      window.CoachWizardA11y.wireWizardA11y(
        () => wizardEl,
        () => closeWizard(),
        () => wizardEl && !wizardEl.classList.contains('hidden')
      );
    } else {
      document.addEventListener('keydown', (e) => {
        if (!wizardEl || wizardEl.classList.contains('hidden')) return;
        if (e.key === 'Escape') {
          e.preventDefault();
          closeWizard();
        }
      });
    }
    overlay.querySelector('#bp-wizard-sync-profile')?.addEventListener('click', () => {
      if (typeof window.syncPlanningFormFromProfile === 'function') {
        window.syncPlanningFormFromProfile({ force: true });
      }
      pullFormIntoWizard();
      refreshProfileCard();
      updateStrengthHint();
    });
    overlay.querySelector('#bp-wizard-skip-full')?.addEventListener('click', () => {
      pushWizardToForm();
      closeWizard();
      track('skip_full_form');
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeWizard();
    });

    overlay.querySelectorAll('[data-plan-style]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const v = btn.getAttribute('data-plan-style');
        setPlanStyle(v);
        pullFormIntoWizard();
      });
    });
    overlay.querySelectorAll('[data-bp-preset]').forEach((btn) => {
      btn.addEventListener('click', () => applyPreset(btn.getAttribute('data-bp-preset')));
    });

    ['bp-wizard-income', 'bp-wizard-closings', 'bp-wizard-notes'].forEach((id) => {
      $(id)?.addEventListener('input', updateStrengthHint);
    });
    overlay.querySelector('#bp-wizard-hobbies')?.addEventListener('change', updateStrengthHint);
    overlay.querySelector('#bp-wizard-activities')?.addEventListener('change', updateStrengthHint);
  }

  function openWizard(opts) {
    if (!$('planning') && !$('target-income')) {
      if (typeof window.showToast === 'function') {
        window.showToast('Business plan form not found on this page.', 'error');
      }
      return;
    }
    ensureWizardDom();
    if (typeof window.syncPlanningFormFromProfile === 'function') {
      try {
        window.syncPlanningFormFromProfile();
      } catch (e) {}
    }
    pullFormIntoWizard();
    const start = opts && opts.step ? parseInt(opts.step, 10) : 1;
    currentStep = Number.isFinite(start) && start >= 1 && start <= TOTAL_STEPS ? start : 1;
    wizardEl.classList.remove('hidden');
    wizardEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    renderStep();
    if (typeof window.setCoachModeSwitch === 'function') window.setCoachModeSwitch('planning', 'guided');
    track('open');
  }

  function closeWizard() {
    if (wizardEl) {
      pushWizardToForm();
      wizardEl.classList.add('hidden');
      wizardEl.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
    if (typeof window.setCoachModeSwitch === 'function') window.setCoachModeSwitch('planning', 'full');
    track('close');
  }

  function wireEntryButtons() {
    // Mode switch is wired by coach-mode-switch.js (data-open-fn / data-scroll-to).
    // Keep resume hint only.
    try {
      const last = parseInt(localStorage.getItem(STORAGE_KEY), 10);
      const hint = $('bp-wizard-resume-hint');
      if (hint && last > 1 && last < TOTAL_STEPS) {
        hint.classList.remove('hidden');
        hint.innerHTML = `You left off at step ${last}. <button type="button" id="bp-wizard-resume" class="font-semibold underline">Resume there</button>`;
        $('bp-wizard-resume')?.addEventListener('click', () => openWizard({ step: last }));
      } else if (hint) {
        hint.classList.add('hidden');
        hint.innerHTML = '';
      }
    } catch (e) {}
  }

  window.scrollToPlanForm = function scrollToPlanForm() {
    const form = $('plan-full-form') || $('generate-plan-btn') || $('planning');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  function init() {
    if (!$('planning') && !$('generate-plan-btn')) return;
    wireEntryButtons();
    window.openBusinessPlanWizard = openWizard;
    window.closeBusinessPlanWizard = closeWizard;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  setTimeout(init, 500);
})();
