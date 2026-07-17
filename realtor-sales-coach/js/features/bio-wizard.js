/**
 * Bio Builder guided wizard — writes to the same #bio-creator form fields.
 * LO Sales Coach only.
 */
(function () {
  'use strict';

  const TOTAL_STEPS = 5;
  const STORAGE_KEY = 'bioWizardLastStep';
  const WIZARD_DOM_VERSION = '5';
  const LOVES_MIN_CHARS = 40;

  const STEP_META = [
    { title: 'Profile', subtitle: 'Quick check from My Profile' },
    { title: 'Your why', subtitle: 'The emotional hook' },
    { title: 'How you work', subtitle: 'Service, clients & edge' },
    { title: 'Life outside work', subtitle: 'Family, hobbies, pets — optional' },
    { title: 'Platform', subtitle: 'Pick destination & generate' }
  ];

  const FIELD_MAP = [
    ['bio-wizard-years', 'bio-years'],
    ['bio-wizard-loves', 'bio-loves-most'],
    ['bio-wizard-service', 'bio-service-notes'],
    ['bio-wizard-who', 'bio-who-notes'],
    ['bio-wizard-diff', 'bio-diff-notes'],
    ['bio-wizard-family', 'bio-family'],
    ['bio-wizard-hobbies', 'bio-hobbies'],
    ['bio-wizard-pets', 'bio-pets'],
    ['bio-wizard-community', 'bio-community']
  ];

  const DEST_OPTIONS = [
    { value: 'website-about', label: 'Company Website', hint: '750 characters · team page standard' },
    { value: 'google-gbp', label: 'Google Business Profile', hint: '750 characters · local SEO' },
    { value: 'company-page', label: 'Company / Team Page', hint: '250 words' },
    { value: 'experience-com', label: 'Experience.com', hint: '200 words · reviews ecosystem' },
    { value: 'zillow', label: 'Zillow', hint: '2,000 characters · consumer-facing' },
    { value: 'linkedin', label: 'LinkedIn', hint: '2,600 characters · professional' }
  ];

  let currentStep = 1;
  let wizardEl = null;

  function $(id) {
    return document.getElementById(id);
  }

  function getProfile() {
    try {
      if (typeof window.getUserProfile === 'function') return window.getUserProfile();
      const raw = JSON.parse(localStorage.getItem('userProfile') || '{}');
      if (typeof window.normalizeUserProfile === 'function') return window.normalizeUserProfile(raw);
      return raw;
    } catch (e) {
      return {};
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatProfileText(val) {
    if (!val || (Array.isArray(val) && !val.length)) return '—';
    const text = Array.isArray(val) ? val.filter(Boolean).join(', ') : String(val).trim();
    return text || '—';
  }

  function formatProfileLink(val) {
    const v = (val || '').trim();
    if (!v) return '<span class="text-gray-400">—</span>';
    const href = /^https?:\/\//i.test(v) ? v : `https://${v}`;
    const display = v.length > 48 ? `${v.slice(0, 46)}…` : v;
    return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="text-[#00A89D] hover:underline break-all">${escapeHtml(display)}</a>`;
  }

  function hobbiesTextFromProfile(p) {
    return [...(p.hobbies || []), p.hobbiesOther].filter(Boolean).join(', ');
  }

  function seedWizardFieldsFromProfile() {
    if (typeof window.seedBioFieldsFromProfile === 'function') {
      window.seedBioFieldsFromProfile(getProfile());
    }
  }

  function copyField(wizId, formId) {
    const wiz = $(wizId);
    const form = $(formId);
    if (!wiz || !form) return;
    if (form.type === 'checkbox') form.checked = wiz.checked;
    else form.value = wiz.value ?? '';
  }

  function readField(formId, wizId) {
    const form = $(formId);
    const wiz = $(wizId);
    if (!form || !wiz) return;
    if (form.type === 'checkbox') wiz.checked = form.checked;
    else wiz.value = form.value ?? '';
  }

  function writeWizardIntoForm(options = {}) {
    FIELD_MAP.forEach(([wizId, formId]) => copyField(wizId, formId));
    const dest = document.querySelector('input[name="bio-wizard-dest"]:checked')?.value;
    if (dest) {
      const sel = $('bio-destination');
      if (sel) {
        sel.value = dest;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (typeof window.syncBioDestinationCards === 'function') window.syncBioDestinationCards(dest);
    }
    FIELD_MAP.forEach(([wizId, formId]) => {
      const form = $(formId);
      if (form) form.dispatchEvent(new Event('input', { bubbles: true }));
    });
    if (!options.silent && typeof window.showToast === 'function') {
      window.showToast('Bio answers saved to the full form.');
    }
  }

  function readFormIntoWizard() {
    FIELD_MAP.forEach(([wizId, formId]) => readField(formId, wizId));
    const dest = $('bio-destination')?.value || 'website-about';
    const radio = document.querySelector(`input[name="bio-wizard-dest"][value="${dest}"]`);
    if (radio) radio.checked = true;
    updateDestSummary();
  }

  function updateProfileCard() {
    const p = getProfile();
    const setText = (id, val) => {
      const el = $(id);
      if (el) el.textContent = formatProfileText(val);
    };
    const setHtml = (id, html) => {
      const el = $(id);
      if (el) el.innerHTML = html;
    };

    setText('bio-wizard-profile-name', p.name);
    setText('bio-wizard-profile-email', p.email);
    setText('bio-wizard-profile-phone', p.phone);
    setText('bio-wizard-profile-nmls', p.licenseNumber || p.nmls || p.license || '');
    setText('bio-wizard-profile-market', p.location);
    setText(
      'bio-wizard-profile-years',
      typeof window.formatExperienceYearsDisplay === 'function'
        ? window.formatExperienceYearsDisplay(p.years)
        : p.years
    );
    setText('bio-wizard-profile-team', p.team);
    setText('bio-wizard-profile-tone', p.tone);
    setText('bio-wizard-profile-hobbies', hobbiesTextFromProfile(p));
    setText('bio-wizard-profile-family', p.family);
    setText('bio-wizard-profile-intro', p.intro);
    setHtml('bio-wizard-profile-blog', formatProfileLink(p.blogPageUrl));
    setHtml('bio-wizard-profile-linkedin', formatProfileLink(p.linkedInUrl));
    setHtml('bio-wizard-profile-website', formatProfileLink(p.companyWebsite));

    const warn = $('bio-wizard-profile-warn');
    if (warn) warn.classList.toggle('hidden', !!(p.name && p.location));
  }

  function updateWizardYearsHint() {
    const input = $('bio-wizard-years');
    const hint = $('bio-wizard-years-hint');
    if (!input || !hint || typeof window.resolveExperienceYears !== 'function') return;
    const r = window.resolveExperienceYears(input.value);
    if (r.hint) {
      hint.textContent = r.hint;
      hint.classList.remove('hidden');
    } else {
      hint.textContent = '';
      hint.classList.add('hidden');
    }
  }

  function updatePersonalStepHints() {
    const p = getProfile();
    const hobbiesHint = $('bio-wizard-hobbies-hint');
    const hobbies = hobbiesTextFromProfile(p);
    const hobbiesEl = $('bio-wizard-hobbies');
    if (hobbiesHint && hobbiesEl) {
      const fromProfile = hobbies && hobbiesEl.value.trim() === hobbies.trim();
      hobbiesHint.classList.toggle('hidden', !fromProfile);
    }
    const familyHint = $('bio-wizard-family-hint');
    const familyEl = $('bio-wizard-family');
    if (familyHint && familyEl) {
      const fromProfile = p.family && familyEl.value.trim() === p.family.trim();
      familyHint.classList.toggle('hidden', !fromProfile);
    }
  }

  function updateDestSummary() {
    const dest = document.querySelector('input[name="bio-wizard-dest"]:checked')?.value || 'website-about';
    const opt = DEST_OPTIONS.find((d) => d.value === dest);
    const el = $('bio-wizard-dest-summary');
    if (el && opt) {
      el.innerHTML = `<strong class="text-[#002B5C] dark:text-white">${opt.label}</strong> — <span class="text-gray-600 dark:text-gray-400">${opt.hint}</span>`;
    }
  }

  function showStepError(msg) {
    const el = $('bio-wizard-step-error');
    if (!el) return;
    if (msg) {
      el.textContent = msg;
      el.classList.remove('hidden');
    } else {
      el.textContent = '';
      el.classList.add('hidden');
    }
  }

  function validateCurrentStep() {
    showStepError('');
    if (currentStep === 2) {
      const who = ($('bio-wizard-who')?.value || '').trim();
      if (who.length < 15) {
        showStepError('Add who you help most — client type + situation (e.g. first-time buyers in your market).');
        return false;
      }
      const loves = ($('bio-wizard-loves')?.value || '').trim();
      if (loves.length < LOVES_MIN_CHARS) {
        showStepError(`Share a bit more about your "why" — at least ${LOVES_MIN_CHARS} characters helps the AI sound like you (not generic boilerplate).`);
        return false;
      }
    }
    if (currentStep === 3) {
      const service = ($('bio-wizard-service')?.value || '').trim();
      const diff = ($('bio-wizard-diff')?.value || '').trim();
      if (!service && !diff) {
        showStepError('Add at least one note about your service style or what makes you different.');
        return false;
      }
    }
    return true;
  }

  function renderStepNav() {
    const nav = $('bio-wizard-step-nav');
    if (!nav) return;
    nav.innerHTML = STEP_META.map((meta, i) => {
      const step = i + 1;
      const active = step === currentStep;
      const visited = step < currentStep;
      const cls = [
        'bio-wizard-nav-pill flex-1 min-w-[4.25rem] text-center py-2 px-1 rounded-xl transition text-[10px] sm:text-xs font-semibold leading-tight',
        active ? 'bg-[#00A89D] text-white shadow-sm ring-2 ring-[#00A89D]/35' : '',
        !active && visited ? 'bg-[#00A89D]/15 text-[#00A89D] cursor-pointer hover:bg-[#00A89D]/25 hover:ring-2 hover:ring-[#00A89D]/30' : '',
        !active && !visited ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 hover:ring-2 hover:ring-[#00A89D]/20' : '',
        active ? 'cursor-default' : 'cursor-pointer'
      ].filter(Boolean).join(' ');
      return `<button type="button" class="${cls}" data-bio-wizard-goto="${step}" aria-label="Go to step ${step}: ${meta.title}" title="${meta.title} — ${meta.subtitle}" ${active ? 'aria-current="step"' : ''}>
        <span class="block text-[9px] opacity-80 leading-none mb-0.5">${step}</span>
        <span class="block truncate">${meta.title}</span>
      </button>`;
    }).join('');
  }

  function renderStep() {
    if (!wizardEl) return;
    wizardEl.querySelectorAll('[data-bio-wizard-step]').forEach((panel) => {
      const step = parseInt(panel.getAttribute('data-bio-wizard-step'), 10);
      panel.classList.toggle('hidden', step !== currentStep);
    });

    const meta = STEP_META[currentStep - 1];
    const progress = $('bio-wizard-progress');
    const label = $('bio-wizard-step-label');
    const sub = $('bio-wizard-step-sub');
    const backBtn = $('bio-wizard-back');
    const nextBtn = $('bio-wizard-next');
    const skipBtn = $('bio-wizard-skip');
    const generateBtn = $('bio-wizard-generate');

    if (progress) progress.style.width = `${(currentStep / TOTAL_STEPS) * 100}%`;
    if (label) label.textContent = `Step ${currentStep} of ${TOTAL_STEPS} — ${meta?.title || ''}`;
    if (sub) sub.textContent = meta?.subtitle || '';

    if (backBtn) backBtn.classList.toggle('invisible', currentStep <= 1);
    if (nextBtn) nextBtn.classList.toggle('hidden', currentStep >= TOTAL_STEPS);
    if (skipBtn) skipBtn.classList.toggle('hidden', currentStep !== 4);
    if (generateBtn) generateBtn.classList.toggle('hidden', currentStep !== TOTAL_STEPS);

    renderStepNav();
    if (currentStep === 1) updateProfileCard();
    if (currentStep === 2) updateWizardYearsHint();
    if (currentStep === 4) updatePersonalStepHints();
    if (currentStep === 5) updateDestSummary();

    try { localStorage.setItem(STORAGE_KEY, String(currentStep)); } catch (e) {}
    $('bio-wizard-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goStep(delta) {
    if (delta > 0 && !validateCurrentStep()) return;
    const next = Math.max(1, Math.min(TOTAL_STEPS, currentStep + delta));
    if (next === currentStep) return;
    writeWizardIntoForm({ silent: true });
    currentStep = next;
    if (delta < 0) readFormIntoWizard();
    renderStep();
  }

  function goToStep(step) {
    const target = Math.max(1, Math.min(TOTAL_STEPS, step));
    if (target === currentStep) return;
    writeWizardIntoForm({ silent: true });
    currentStep = target;
    readFormIntoWizard();
    showStepError('');
    renderStep();
  }

  function skipPersonalStep() {
    ['bio-wizard-family', 'bio-wizard-hobbies', 'bio-wizard-pets', 'bio-wizard-community'].forEach((id) => {
      const el = $(id);
      if (el) el.value = '';
    });
    goStep(1);
  }

  async function finishWizard() {
    if (!validateCurrentStep()) return;
    writeWizardIntoForm({ silent: true });
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    closeBioWizard();
    if (typeof window.syncBioFromProfile === 'function') window.syncBioFromProfile();
    document.getElementById('bio-destination')?.dispatchEvent(new Event('change', { bubbles: true }));
    if (typeof window.generateBio === 'function') {
      await window.generateBio();
    } else {
      $('generate-bio-btn')?.click();
    }
  }

  function ensureWizardDom() {
    const existing = $('bio-wizard-overlay');
    if (existing && existing.dataset.bioWizardVersion !== WIZARD_DOM_VERSION) {
      existing.remove();
      wizardEl = null;
    }
    if ($('bio-wizard-overlay')) {
      wizardEl = $('bio-wizard-overlay');
      return;
    }

    const destRadios = DEST_OPTIONS.map(
      (d, i) => `
      <label class="flex items-start gap-3 p-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 cursor-pointer hover:border-[#00A89D]/40 has-[:checked]:border-[#00A89D] has-[:checked]:bg-[#00A89D]/8 transition">
        <input type="radio" name="bio-wizard-dest" value="${d.value}" class="mt-1 text-[#00A89D]" ${i === 0 ? 'checked' : ''}>
        <span><span class="font-semibold text-sm text-[#002B5C] dark:text-white">${d.label}</span><br><span class="text-xs text-gray-500">${d.hint}</span></span>
      </label>`
    ).join('');

    const overlay = document.createElement('div');
    overlay.id = 'bio-wizard-overlay';
    overlay.className = 'hidden fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/55 backdrop-blur-sm';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'bio-wizard-heading');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.dataset.bioWizardVersion = WIZARD_DOM_VERSION;

    overlay.innerHTML = `
      <div class="bg-white dark:bg-gray-900 w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col">
        <div class="shrink-0 border-b border-gray-200 dark:border-gray-700 px-5 sm:px-6 py-4">
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="min-w-0">
              <h3 id="bio-wizard-heading" class="text-lg sm:text-xl font-bold text-[#002B5C] dark:text-white m-0">Bio Builder — Guided Setup</h3>
              <p id="bio-wizard-step-label" class="text-sm text-gray-500 mt-1 m-0"></p>
              <p id="bio-wizard-step-sub" class="text-xs text-gray-400 mt-0.5 m-0"></p>
            </div>
            <button type="button" id="bio-wizard-close" class="shrink-0 w-9 h-9 rounded-full border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800" aria-label="Close">&times;</button>
          </div>
          <div id="bio-wizard-step-nav" class="flex gap-1 mb-3 overflow-x-auto"></div>
          <div class="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div id="bio-wizard-progress" class="h-full bg-gradient-to-r from-[#00A89D] to-[#F15A29] transition-all" style="width:20%"></div>
          </div>
        </div>

        <div id="bio-wizard-scroll" class="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4">
          <div id="bio-wizard-step-error" class="hidden text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 rounded-xl px-4 py-3" role="alert"></div>

          <div data-bio-wizard-step="1">
            <div class="rounded-2xl bg-gradient-to-br from-[#00A89D]/10 to-[#002B5C]/5 border border-[#00A89D]/25 p-5 mb-4">
              <p class="text-sm text-gray-700 dark:text-gray-300 m-0"><strong>~5 minutes</strong> — one question at a time. Your answers sync to the full form so you can tweak chips and extras later.</p>
            </div>
            <div id="bio-wizard-profile-card" class="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
              <span class="text-xs font-bold uppercase tracking-wider text-[#00A89D]">From My Profile</span>
              <p class="text-[11px] text-gray-500 dark:text-gray-400 m-0 mt-1">Pulled automatically — updates when you open the wizard or edit My Profile.</p>
              <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm mt-3 m-0">
                <div><dt class="text-gray-400 text-xs mb-0.5">Name</dt><dd id="bio-wizard-profile-name" class="font-semibold text-[#002B5C] dark:text-white m-0">—</dd></div>
                <div><dt class="text-gray-400 text-xs mb-0.5">Market</dt><dd id="bio-wizard-profile-market" class="font-semibold text-[#002B5C] dark:text-white m-0">—</dd></div>
                <div><dt class="text-gray-400 text-xs mb-0.5">Email</dt><dd id="bio-wizard-profile-email" class="m-0 break-all">—</dd></div>
                <div><dt class="text-gray-400 text-xs mb-0.5">Phone</dt><dd id="bio-wizard-profile-phone" class="m-0">—</dd></div>
                <div><dt class="text-gray-400 text-xs mb-0.5">License</dt><dd id="bio-wizard-profile-nmls" class="m-0">—</dd></div>
                <div><dt class="text-gray-400 text-xs mb-0.5">Years / experience</dt><dd id="bio-wizard-profile-years" class="m-0">—</dd></div>
                <div><dt class="text-gray-400 text-xs mb-0.5">Team</dt><dd id="bio-wizard-profile-team" class="m-0">—</dd></div>
                <div><dt class="text-gray-400 text-xs mb-0.5">Tone</dt><dd id="bio-wizard-profile-tone" class="m-0">—</dd></div>
                <div class="sm:col-span-2"><dt class="text-gray-400 text-xs mb-0.5">Intro</dt><dd id="bio-wizard-profile-intro" class="m-0 text-gray-700 dark:text-gray-300">—</dd></div>
                <div class="sm:col-span-2"><dt class="text-gray-400 text-xs mb-0.5">Hobbies & passions</dt><dd id="bio-wizard-profile-hobbies" class="m-0 text-gray-700 dark:text-gray-300">—</dd></div>
                <div class="sm:col-span-2"><dt class="text-gray-400 text-xs mb-0.5">Family</dt><dd id="bio-wizard-profile-family" class="m-0 text-gray-700 dark:text-gray-300">—</dd></div>
              </dl>
              <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div><dt class="text-gray-400 text-xs mb-0.5">Blog page</dt><dd id="bio-wizard-profile-blog" class="m-0 text-xs">—</dd></div>
                <div><dt class="text-gray-400 text-xs mb-0.5">LinkedIn</dt><dd id="bio-wizard-profile-linkedin" class="m-0 text-xs">—</dd></div>
                <div><dt class="text-gray-400 text-xs mb-0.5">Company website</dt><dd id="bio-wizard-profile-website" class="m-0 text-xs">—</dd></div>
              </div>
              <p id="bio-wizard-profile-warn" class="hidden text-xs text-amber-700 dark:text-amber-300 mt-3 mb-0">Add <strong>name + market</strong> in My Profile for stronger bios.</p>
            </div>
            <button type="button" id="bio-wizard-edit-profile" class="text-sm font-semibold text-[#00A89D] underline">Open My Profile</button>
          </div>

          <div data-bio-wizard-step="2" class="hidden">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Credibility, who you serve, then your emotional hook — the combo that separates you from generic agent bios.</p>
            <label class="block text-sm font-semibold text-[#00A89D] mb-1" for="bio-wizard-years">Years in the business</label>
            <p class="text-xs text-gray-500 mb-2 m-0">Type <strong>12</strong>, <strong>since 2004</strong>, or <strong>licensed since 2010</strong> — start years auto-update each year.</p>
            <input type="text" id="bio-wizard-years" inputmode="text" autocomplete="off" class="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 mb-1" placeholder="e.g. 12, since 2004">
            <p id="bio-wizard-years-hint" class="hidden text-xs text-[#00A89D] mb-4 m-0"></p>
            <label class="block text-sm font-semibold text-[#00A89D] mb-1" for="bio-wizard-who">Who you help most <span class="text-[#F15A29]">*</span></label>
            <p class="text-xs text-gray-500 mb-2 m-0">Client type + situation — first-time buyers, move-up, downsizers, investors, etc.</p>
            <textarea id="bio-wizard-who" rows="2" class="w-full p-3 rounded-xl border-2 border-[#F15A29]/35 bg-white dark:bg-gray-800 mb-4" placeholder="First-time buyers in [your market] who want a patient guide, not pressure…"></textarea>
            <label class="block text-sm font-semibold text-[#00A89D] mb-1" for="bio-wizard-loves">What do you love most about helping clients buy and sell? <span class="text-[#F15A29]">*</span></label>
            <textarea id="bio-wizard-loves" rows="4" class="w-full p-4 rounded-xl border-2 border-[#00A89D]/50 bg-white dark:bg-gray-800" placeholder="A client moment, a feeling, or feedback you hear often…"></textarea>
          </div>

          <div data-bio-wizard-step="3" class="hidden">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">How clients and agents <em>experience</em> you. Fill at least one — more is better.</p>
            <label class="block text-sm font-semibold mb-1" for="bio-wizard-service">Customer service approach</label>
            <textarea id="bio-wizard-service" rows="2" class="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 mb-4" placeholder="How you communicate, educate, and show up under pressure…"></textarea>
            <label class="block text-sm font-semibold mb-1" for="bio-wizard-diff">What makes you different</label>
            <textarea id="bio-wizard-diff" rows="2" class="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" placeholder="What would your best past client or co-broke partner say about you?"></textarea>
          </div>

          <div data-bio-wizard-step="4" class="hidden">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4"><strong>Optional but powerful.</strong> One human detail — family, hobby, pet, or community tie — makes people choose <em>you</em>. Only share what you'd put on a public profile.</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold mb-1" for="bio-wizard-family">Family</label>
                <p id="bio-wizard-family-hint" class="hidden text-[11px] text-[#00A89D] mb-1 m-0"><i class="fas fa-user-check mr-1"></i>Pre-filled from My Profile — edit or add detail.</p>
                <textarea id="bio-wizard-family" rows="2" class="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" placeholder="Spouse, kids, grandkids…"></textarea>
              </div>
              <div>
                <label class="block text-sm font-semibold mb-1" for="bio-wizard-hobbies">Hobbies & passions</label>
                <p id="bio-wizard-hobbies-hint" class="hidden text-[11px] text-[#00A89D] mb-1 m-0"><i class="fas fa-user-check mr-1"></i>Pre-filled from My Profile — edit or add detail.</p>
                <textarea id="bio-wizard-hobbies" rows="2" class="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" placeholder="Golf, cooking, sports, faith community…"></textarea>
              </div>
              <div>
                <label class="block text-sm font-semibold mb-1" for="bio-wizard-pets">Pets</label>
                <input type="text" id="bio-wizard-pets" class="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" placeholder="Dog, cat, horse…">
              </div>
              <div>
                <label class="block text-sm font-semibold mb-1" for="bio-wizard-community">Community & giving back</label>
                <textarea id="bio-wizard-community" rows="2" class="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" placeholder="Volunteering, coaching, local roots…"></textarea>
              </div>
            </div>
          </div>

          <div data-bio-wizard-step="5" class="hidden">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Where will you paste this today? We'll match length and structure.</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">${destRadios}</div>
            <div id="bio-wizard-dest-summary" class="p-4 rounded-2xl bg-[#F15A29]/5 border border-[#F15A29]/20 text-sm"></div>
            <p class="text-xs text-gray-500 mt-4 m-0">After generate, use the full form to add chips, refine, or try another platform.</p>
          </div>
        </div>

        <div class="shrink-0 px-5 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-wrap items-center justify-between gap-3">
          <button type="button" id="bio-wizard-skip" class="hidden text-xs text-gray-500 hover:text-[#00A89D]">Skip personal details</button>
          <div class="flex gap-2 ml-auto">
            <button type="button" id="bio-wizard-back" class="px-4 py-2 text-sm rounded-2xl border border-gray-300 dark:border-gray-600">Back</button>
            <button type="button" id="bio-wizard-next" class="px-6 py-2 text-sm rounded-2xl bg-[#00A89D] text-white font-semibold hover:bg-[#008f85]">Continue</button>
            <button type="button" id="bio-wizard-generate" class="hidden px-6 py-2 text-sm rounded-2xl bg-gradient-to-r from-[#00A89D] to-[#F15A29] text-white font-semibold shadow-md">Generate My Bio</button>
          </div>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    wizardEl = overlay;

    $('bio-wizard-close')?.addEventListener('click', closeBioWizard);
    $('bio-wizard-back')?.addEventListener('click', () => goStep(-1));
    $('bio-wizard-next')?.addEventListener('click', () => goStep(1));
    $('bio-wizard-skip')?.addEventListener('click', skipPersonalStep);
    $('bio-wizard-generate')?.addEventListener('click', finishWizard);
    $('bio-wizard-edit-profile')?.addEventListener('click', () => {
      if (typeof window.openUserProfile === 'function') window.openUserProfile(true);
    });

    $('bio-wizard-years')?.addEventListener('input', updateWizardYearsHint);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeBioWizard();
    });

    $('bio-wizard-step-nav')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-bio-wizard-goto]');
      if (!btn) return;
      const step = parseInt(btn.getAttribute('data-bio-wizard-goto'), 10);
      if (!Number.isFinite(step) || step === currentStep) return;
      goToStep(step);
    });

    overlay.querySelectorAll('input[name="bio-wizard-dest"]').forEach((radio) => {
      radio.addEventListener('change', updateDestSummary);
    });
  }

  function openBioWizard() {
    ensureWizardDom();
    if (typeof window.syncBioFromProfile === 'function') window.syncBioFromProfile();
    seedWizardFieldsFromProfile();
    readFormIntoWizard();
    currentStep = 1;
    wizardEl.classList.remove('hidden');
    wizardEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    renderStep();
  }

  function closeBioWizard() {
    if (!wizardEl) return;
    writeWizardIntoForm({ silent: true });
    wizardEl.classList.add('hidden');
    wizardEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  window.openBioWizard = openBioWizard;
  window.closeBioWizard = closeBioWizard;

  console.log('%c[bio-wizard.js] Guided Bio Builder wizard ready', 'color:#00A89D');
})();