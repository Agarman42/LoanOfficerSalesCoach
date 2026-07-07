/**
 * js/features/user-profile.js
 * Central profile for Agent Sales Coach — tabs, wizard, completeness meter, tool wiring.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'userProfile';
  const WIZARD_DONE_KEY = 'coachProfileWizardDone';

  const FOCUS_OPTIONS = {
    'balanced-growth': 'Balanced Growth',
    'agent-network': 'Heavy Agent Network & Co-Broke Focus',
    database: 'Past Client / Sphere / Database Focus',
    listings: 'Listing Dominance & Seller Focus',
    buyers: 'Buyer Specialist & Relocation'
  };

  const FOCUS_LEGACY = {
    'Balanced Growth': 'balanced-growth',
    'Heavy Agent Network & Co-Broke Focus': 'agent-network',
    'Past Client / Sphere / Database Focus': 'database',
    'Listing Dominance & Seller Focus': 'listings',
    'Buyer Specialist & Relocation': 'buyers'
  };

  const DATABASE_LABELS = {
    'under-50': 'Under 50 past clients',
    '50-200': '50–200 past clients',
    '200-plus': '200+ past clients'
  };

  const COMPLETENESS_CHECKS = [
    { key: 'name', weight: 12, hint: 'Add your name', tools: 'Scripts, AI Coach' },
    { key: 'email', weight: 10, hint: 'Add your email', tools: 'Newsletter signature' },
    { key: 'phone', weight: 8, hint: 'Add your phone', tools: 'Scripts, Newsletter' },
    { key: 'location', weight: 12, hint: 'Add your market', tools: 'Social, Newsletter' },
    { key: 'blogPageUrl', weight: 8, hint: 'Add your blog page URL', tools: 'Newsletter, Blog' },
    { key: 'focus', weight: 10, hint: 'Pick your business focus', tools: 'Weekly Plan' },
    { key: 'monthlyUnits', weight: 10, hint: 'Set a monthly closing goal', tools: 'Weekly Plan' },
    { key: 'hobbies', weight: 10, hint: 'Add 1–2 hobbies', tools: 'Social, Content' },
    { key: 'tone', weight: 10, hint: 'Choose your tone', tools: 'AI, Scripts' },
    { key: 'partnerTypes', weight: 10, hint: 'Select referral partner types', tools: 'Referrals' },
    { key: 'challenges', weight: 8, hint: 'Pick your top challenge', tools: 'Weekly Plan' },
    { key: 'activities', weight: 8, hint: 'Preferred prospecting activities', tools: 'Weekly Plan' },
    { key: 'contentNotes', weight: 10, hint: 'Content guardrails', tools: 'All AI tools' }
  ];

  const PROFILE_TABS = ['identity', 'business', 'content', 'prospecting', 'personal'];

  const WIZARD_STEP_LABELS = {
    identity: 'Identity & Branding',
    business: 'Business Goals',
    content: 'Voice & Links',
    prospecting: 'Prospecting',
    personal: 'Personal'
  };

  const WIZARD_STEP_HINTS = {
    identity: 'Name, contact, market, and branding — used in Newsletter, Scripts, and AI Coach.',
    business: 'Focus, goals, and challenges — powers Weekly Win Plan and business planning.',
    content: 'Tone, guardrails, and links — shapes how every AI post and email sounds.',
    prospecting: 'Activities and partner types — tailors referral plays and outreach.',
    personal: 'Hobbies and personality — makes social content authentically you.'
  };

  function asArray(val) {
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'string' && val.trim()) return val.split(',').map((s) => s.trim()).filter(Boolean);
    return [];
  }

  function normalizeFocus(raw) {
    if (!raw) return { value: '', label: '' };
    if (FOCUS_OPTIONS[raw]) return { value: raw, label: FOCUS_OPTIONS[raw] };
    if (FOCUS_LEGACY[raw]) return { value: FOCUS_LEGACY[raw], label: raw };
    const lower = String(raw).toLowerCase();
    if (lower.includes('agent network') || lower.includes('co-broke') || lower.includes('co broke')) {
      return { value: 'agent-network', label: FOCUS_OPTIONS['agent-network'] };
    }
    if (lower.includes('database') || lower.includes('past client') || lower.includes('sphere')) {
      return { value: 'database', label: FOCUS_OPTIONS.database };
    }
    if (lower.includes('listing') || lower.includes('seller')) {
      return { value: 'listings', label: FOCUS_OPTIONS.listings };
    }
    if (lower.includes('buyer') || lower.includes('relocation')) {
      return { value: 'buyers', label: FOCUS_OPTIONS.buyers };
    }
    return { value: raw, label: raw };
  }

  function readRawProfile() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const legacy = JSON.parse(localStorage.getItem('winPlanSetup') || '{}');
      if (raw && Object.keys(raw).length) {
        return { ...legacy, ...raw };
      }
      if (legacy && (legacy.name || legacy.location || legacy.focus)) return legacy;
      return raw;
    } catch (e) {
      return {};
    }
  }

  function setSelectValue(el, storedValue, labelFallback) {
    if (!el || el.tagName !== 'SELECT') return;
    const val = storedValue || '';
    if (!val) {
      el.value = '';
      return;
    }
    const options = Array.from(el.options);
    if (options.some((o) => o.value === val)) {
      el.value = val;
      return;
    }
    const byLabel = options.find(
      (o) => o.textContent.trim() === val || (labelFallback && o.textContent.trim() === labelFallback)
    );
    if (byLabel) {
      el.value = byLabel.value;
      return;
    }
    el.value = val;
  }

  function checkComplete(p, key) {
    switch (key) {
      case 'name':
        return !!(p.name && String(p.name).trim());
      case 'location':
        return !!(p.location && String(p.location).trim());
      case 'focus':
        return !!(p.focus && String(p.focus).trim());
      case 'monthlyUnits':
        return !!(p.monthlyUnits || p.monthlyGoal);
      case 'hobbies':
        return asArray(p.hobbies).length > 0 || !!(p.hobbiesOther && p.hobbiesOther.trim());
      case 'tone':
        return !!(p.tone || p.personality);
      case 'partnerTypes':
        return asArray(p.partnerTypes).length > 0;
      case 'challenges':
        return asArray(p.challenges).length > 0;
      case 'intro':
        return !!(p.intro && String(p.intro).trim());
      case 'activities':
        return asArray(p.activities).length > 0;
      case 'databaseSize':
        return !!(p.databaseSize && String(p.databaseSize).trim());
      case 'contentNotes':
        return !!(p.contentNotes && String(p.contentNotes).trim());
      case 'email':
        return !!(p.email && String(p.email).trim());
      case 'phone':
        return !!(p.phone && String(p.phone).trim());
      case 'blogPageUrl':
        return !!(p.blogPageUrl && String(p.blogPageUrl).trim());
      default:
        return false;
    }
  }

  function normalizeProfile(raw) {
    const p = raw || {};
    const focus = normalizeFocus(p.focus);
    const hobbies = asArray(p.hobbies);
    const activities = asArray(p.activities);
    const partnerTypes = asArray(p.partnerTypes).length
      ? asArray(p.partnerTypes)
      : asArray(p.targetPartners);
    const challenges = asArray(p.challenges);
    const niches = asArray(p.niches);
    const voiceTraits = asArray(p.voiceTraits);
    const formats = asArray(p.formats);
    const location = (p.location || p.localArea || p.market || '').trim();

    const goals = [
      p.monthlyUnits ? `${p.monthlyUnits} transactions/mo` : '',
      p.monthlyGoal ? `Volume: ${p.monthlyGoal}` : ''
    ].filter(Boolean).join('; ');

    return {
      ...p,
      name: (p.name || '').trim(),
      email: (p.email || '').trim(),
      phone: (p.phone || '').trim(),
      licenseNumber: (p.licenseNumber || p.nmls || '').trim(),
      intro: (p.intro || '').trim(),
      location,
      localArea: location,
      market: location,
      focus: focus.value,
      focusLabel: focus.label,
      years: p.years || '',
      team: p.team || '',
      monthlyUnits: p.monthlyUnits || '',
      monthlyGoal: p.monthlyGoal || '',
      income: p.income || '',
      hours: p.hours || '',
      databaseSize: p.databaseSize || '',
      databaseSizeLabel: DATABASE_LABELS[p.databaseSize] || '',
      partnerFocus: (p.partnerFocus || '').trim(),
      family: (p.family || '').trim(),
      personality: (p.personality || '').trim(),
      tone: p.tone || '',
      contentNotes: (p.contentNotes || '').trim(),
      hobbiesOther: (p.hobbiesOther || '').trim(),
      hobbies,
      activities,
      partnerTypes,
      targetPartners: partnerTypes,
      partnerTypesOther: (p.partnerTypesOther || '').trim(),
      niches,
      nichesOther: (p.nichesOther || '').trim(),
      challenges,
      challengesOther: (p.challengesOther || '').trim(),
      formats,
      voiceTraits,
      goals,
      companyName: (p.companyName || p['company-name'] || '').trim(),
      tagline: (p.tagline || '').trim(),
      logoUrl: (p.logoUrl || p['logo-url'] || '').trim(),
      headshotUrl: (p.headshotUrl || p['headshot-url'] || '').trim(),
      newsletterColorBundle: (p.newsletterColorBundle || 'coastal-teal').trim(),
      socialLinks: p.socialLinks || {},
      blogPageUrl: (p.blogPageUrl || p.blogUrl || '').trim(),
      linkedInUrl: (p.linkedInUrl || p.linkedin || p.socialLinks?.linkedin || '').trim(),
      companyWebsite: (p.companyWebsite || p.website || '').trim(),
      translationDefaultTarget: p.translationDefaultTarget || 'es',
      translationFavoriteLanguages: asArray(p.translationFavoriteLanguages).length
        ? asArray(p.translationFavoriteLanguages)
        : ['es', 'vi', 'zh'],
      lastUpdated: p.lastUpdated || ''
    };
  }

  function getProfileCompleteness(profile) {
    const p = profile || normalizeProfile(readRawProfile());
    let score = 0;
    const missing = [];

    COMPLETENESS_CHECKS.forEach((c) => {
      if (checkComplete(p, c.key)) {
        score += c.weight;
      } else {
        missing.push(c);
      }
    });

    return {
      score: Math.min(100, score),
      missing: missing.slice(0, 4),
      isComplete: score >= 70
    };
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function previewRow(label, value) {
    if (!value || (Array.isArray(value) && !value.length)) return '';
    const text = Array.isArray(value) ? value.join(', ') : String(value);
    if (!text.trim()) return '';
    return `<div class="flex gap-2 py-0.5"><span class="font-semibold text-[#002B5C] dark:text-[#00A89D] min-w-[6.5rem] flex-shrink-0">${escapeHtml(label)}</span><span class="text-gray-700 dark:text-gray-300">${escapeHtml(text)}</span></div>`;
  }

  function buildPreviewHtml(profile) {
    const p = profile || normalizeProfile(readRawProfile());
    const rows = [
      previewRow('Name', p.name),
      previewRow('Email', p.email),
      previewRow('Phone', p.phone),
      previewRow('Company', p.companyName),
      previewRow('Market', p.location),
      previewRow('Intro', p.intro),
      previewRow('Focus', p.focusLabel || p.focus),
      previewRow('Goals', [p.monthlyUnits, p.monthlyGoal].filter(Boolean).join(' · ')),
      previewRow('Hours/wk', p.hours),
      previewRow('Database', p.databaseSizeLabel || p.databaseSize),
      previewRow('Partners', [...p.partnerTypes, p.partnerTypesOther].filter(Boolean).join(', ')),
      previewRow('Partner focus', p.partnerFocus),
      previewRow('Hobbies', [...p.hobbies, p.hobbiesOther].filter(Boolean).join(', ')),
      previewRow('Activities', p.activities),
      previewRow('Challenges', [...p.challenges, p.challengesOther].filter(Boolean).join(', ')),
      previewRow('Niches', [...p.niches, p.nichesOther].filter(Boolean).join(', ')),
      previewRow('Tone', p.tone),
      previewRow('Voice', p.voiceTraits),
      previewRow('Personality', p.personality),
      previewRow('Formats', p.formats),
      previewRow('Guardrails', p.contentNotes),
      previewRow('Blog', p.blogPageUrl),
      previewRow('Website', p.companyWebsite),
      previewRow('Headshot', p.headshotUrl ? 'Set' : ''),
      previewRow('Family', p.family)
    ].filter(Boolean);

    if (!rows.length) {
      return '<p class="text-gray-500 italic">No fields filled yet — complete the form below and every tool will personalize from it.</p>';
    }
    return rows.join('');
  }

  function buildPreviewText(profile) {
    const p = profile || normalizeProfile(readRawProfile());
    if (p.intro) return p.intro;
    const bits = [p.name, p.location, p.focusLabel, p.tone].filter(Boolean);
    return bits.length ? bits.join(' · ') : 'Complete your profile so every tool sounds like you.';
  }

  function buildAiContext(profile) {
    const p = profile || normalizeProfile(readRawProfile());
    const lines = [];
    if (p.name) lines.push(`Name: ${p.name}`);
    if (p.email) lines.push(`Email: ${p.email}`);
    if (p.phone) lines.push(`Phone: ${p.phone}`);
    if (p.companyName) lines.push(`Company/team: ${p.companyName}`);
    if (p.tagline) lines.push(`Tagline: ${p.tagline}`);
    if (p.location) lines.push(`Primary market: ${p.location}`);
    if (p.intro) lines.push(`One-line intro: ${p.intro}`);
    if (p.focusLabel) lines.push(`Business focus: ${p.focusLabel}`);
    if (p.monthlyUnits || p.monthlyGoal) {
      lines.push(`Goals: ${[p.monthlyUnits, p.monthlyGoal].filter(Boolean).join(', ')}`);
    }
    if (p.databaseSizeLabel) lines.push(`Past client database: ${p.databaseSizeLabel}`);
    if (p.partnerFocus) lines.push(`Partner focus: ${p.partnerFocus}`);
    if (p.personality) lines.push(`Personality: ${p.personality}`);
    if (p.hobbies.length) lines.push(`Hobbies: ${p.hobbies.join(', ')}`);
    if (p.activities.length) lines.push(`Preferred activities: ${p.activities.join(', ')}`);
    if (p.partnerTypes.length) lines.push(`Target partners: ${p.partnerTypes.join(', ')}`);
    if (p.challenges.length) lines.push(`Challenges: ${p.challenges.join(', ')}`);
    if (p.niches.length) lines.push(`Ideal clients: ${p.niches.join(', ')}`);
    if (p.tone) lines.push(`Tone: ${p.tone}`);
    if (p.voiceTraits.length) lines.push(`Voice traits: ${p.voiceTraits.join(', ')}`);
    if (p.contentNotes) lines.push(`Content guardrails: ${p.contentNotes}`);
    if (p.blogPageUrl) lines.push(`Blog page: ${p.blogPageUrl}`);
    if (p.companyWebsite) lines.push(`Company website: ${p.companyWebsite}`);
    if (p.headshotUrl) lines.push(`Headshot on file for newsletters`);
    return lines.length
      ? lines.join('. ') + '.'
      : 'Limited profile details set yet — personalize generally but ask for more if helpful.';
  }

  // --- Modal state ---
  let modal;
  let autoSaveTimer = null;
  let wizardStep = 1;
  let wizardActive = false;

  function collectProfileFromForm() {
    const get = (id) => document.getElementById(id);
    const getVal = (id) => (get(id)?.value || '').trim();
    const getRaw = (id) => get(id)?.value || '';

    const socialLinks = {
      linkedin: getVal('profile-social-linkedin'),
      facebook: getVal('profile-social-facebook'),
      instagram: getVal('profile-social-instagram'),
      tiktok: getVal('profile-social-tiktok'),
      youtube: getVal('profile-social-youtube'),
      x: getVal('profile-social-x')
    };

    return {
      name: getVal('profile-name'),
      email: getVal('profile-email'),
      phone: getVal('profile-phone'),
      licenseNumber: getVal('profile-license'),
      intro: getVal('profile-intro'),
      location: getVal('profile-location'),
      years: getRaw('profile-years'),
      team: getRaw('profile-team'),
      companyName: getVal('profile-company-name'),
      tagline: getVal('profile-tagline'),
      logoUrl: getVal('profile-logo-url'),
      headshotUrl: getVal('profile-headshot-url'),
      newsletterColorBundle: getRaw('profile-newsletter-color-bundle') || 'coastal-teal',
      socialLinks,
      monthlyUnits: getRaw('profile-monthly-units'),
      monthlyGoal: getRaw('profile-monthly-goal'),
      income: getRaw('profile-income'),
      focus: getRaw('profile-focus'),
      hours: getRaw('profile-hours'),
      databaseSize: getRaw('profile-database-size'),
      partnerFocus: getVal('profile-partner-focus'),
      family: getVal('profile-family'),
      personality: getVal('profile-personality'),
      tone: getRaw('profile-tone'),
      contentNotes: getVal('profile-content-notes'),
      hobbiesOther: getVal('profile-hobbies-other'),
      hobbies: Array.from(document.querySelectorAll('.profile-hobby:checked')).map((c) => c.value),
      activities: Array.from(document.querySelectorAll('.profile-activity:checked')).map((c) => c.value),
      niches: Array.from(document.querySelectorAll('.profile-niche:checked')).map((c) => c.value),
      nichesOther: getVal('profile-niche-other'),
      challenges: Array.from(document.querySelectorAll('.profile-challenge:checked')).map((c) => c.value),
      challengesOther: getVal('profile-challenge-other'),
      formats: Array.from(document.querySelectorAll('.profile-format:checked')).map((c) => c.value),
      voiceTraits: Array.from(document.querySelectorAll('.profile-voice:checked')).map((c) => c.value),
      partnerTypes: Array.from(document.querySelectorAll('.profile-partner:checked')).map((c) => c.value),
      partnerTypesOther: getVal('profile-partner-other'),
      companyWebsite: getVal('profile-company-website'),
      blogPageUrl: getVal('profile-blog-url'),
      linkedInUrl: socialLinks.linkedin,
      translationDefaultTarget: getRaw('profile-translation-default') || 'es',
      translationFavoriteLanguages: Array.from(document.querySelectorAll('.profile-translation-fav:checked')).map((c) => c.value),
      lastUpdated: new Date().toISOString()
    };
  }

  function persistProfile(profile, showFeedback, closeAfter) {
    const normalized = normalizeProfile(profile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));

    const oldSetup = JSON.parse(localStorage.getItem('winPlanSetup') || '{}');
    localStorage.setItem('winPlanSetup', JSON.stringify({ ...oldSetup, ...normalized }));

    refreshProfileUI();
    if (typeof window.refreshCoachOnboarding === 'function') window.refreshCoachOnboarding();
    if (typeof window.syncNewsletterFromProfile === 'function') {
      try { window.syncNewsletterFromProfile(true); } catch (e) {}
    }

    if (closeAfter) closeModal();

    if (showFeedback) {
      if (typeof window.showToast === 'function') {
        window.showToast('Profile saved! All tools will now use your updated preferences.');
      } else {
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#00A89D] text-white px-6 py-3 rounded-2xl shadow-xl z-[9999]';
        toast.textContent = 'Profile saved! All tools will now use your updated preferences.';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3500);
      }
    }
  }

  function performSave(showFeedback, closeAfter) {
    persistProfile(collectProfileFromForm(), showFeedback, closeAfter);
  }

  function loadProfileIntoForm() {
    const profile = normalizeProfile(readRawProfile());

    const fields = [
      'name', 'email', 'phone', 'license', 'intro', 'location', 'years', 'team',
      'company-name', 'tagline', 'newsletter-color-bundle', 'logo-url', 'headshot-url',
      'monthly-units', 'monthly-goal', 'income', 'focus', 'hours',
      'database-size', 'partner-focus', 'family', 'personality', 'tone',
      'content-notes', 'hobbies-other', 'niche-other', 'challenge-other', 'partner-other',
      'company-website', 'blog-url'
    ];

    const fieldKeyMap = {
      license: 'licenseNumber',
      'company-name': 'companyName',
      'newsletter-color-bundle': 'newsletterColorBundle',
      'logo-url': 'logoUrl',
      'headshot-url': 'headshotUrl',
      'company-website': 'companyWebsite',
      'blog-url': 'blogPageUrl'
    };

    fields.forEach((field) => {
      const el = document.getElementById('profile-' + field);
      if (!el) return;
      const key = fieldKeyMap[field] || field.replace(/-([a-z])/g, (_, l) => l.toUpperCase());
      const val = profile[key] || profile[field] || '';
      if (field === 'focus') {
        setSelectValue(el, val, profile.focusLabel);
      } else {
        el.value = val;
      }
    });

    const yearsEl = document.getElementById('profile-years');
    if (yearsEl?.type === 'number') {
      const num = parseInt(yearsEl.value, 10);
      yearsEl.value = isNaN(num) ? '' : String(num);
    }

    const sets = [
      ['.profile-hobby', 'hobbies'],
      ['.profile-activity', 'activities'],
      ['.profile-niche', 'niches'],
      ['.profile-challenge', 'challenges'],
      ['.profile-format', 'formats'],
      ['.profile-voice', 'voiceTraits'],
      ['.profile-partner', 'partnerTypes']
    ];

    sets.forEach(([sel, key]) => {
      document.querySelectorAll(sel).forEach((cb) => {
        cb.checked = profile[key] && profile[key].includes(cb.value);
      });
    });

    const translationDefault = document.getElementById('profile-translation-default');
    if (translationDefault) {
      translationDefault.value = profile.translationDefaultTarget || 'es';
    }
    document.querySelectorAll('.profile-translation-fav').forEach((cb) => {
      cb.checked = profile.translationFavoriteLanguages && profile.translationFavoriteLanguages.includes(cb.value);
    });

    const social = profile.socialLinks || {};
    ['linkedin', 'facebook', 'instagram', 'tiktok', 'youtube', 'x'].forEach((s) => {
      const el = document.getElementById('profile-social-' + s);
      if (el) el.value = social[s] || '';
    });

    if (window.NlColorBundles?.wireProfileBundlePicker) {
      window.NlColorBundles.wireProfileBundlePicker();
      const bundleSel = document.getElementById('profile-newsletter-color-bundle');
      if (bundleSel) {
        bundleSel.value = profile.newsletterColorBundle || 'coastal-teal';
        if (window.NlColorBundles.renderBundlePreview) {
          window.NlColorBundles.renderBundlePreview(
            document.getElementById('profile-newsletter-color-preview'),
            bundleSel.value
          );
        }
        const desc = document.getElementById('profile-newsletter-color-desc');
        if (desc && window.NlColorBundles.getBundle) {
          desc.textContent = window.NlColorBundles.getBundle(bundleSel.value).description || '';
        }
      }
    }

    syncSelectAllStates();
    refreshProfileUI();
  }

  function isProfileModalOpen() {
    const m = modal || document.getElementById('user-profile-modal');
    return !!(m && !m.classList.contains('hidden'));
  }

  function refreshProfileUI() {
    // Score from localStorage when modal is closed — form fields are empty until loadProfileIntoForm runs
    const profile = isProfileModalOpen()
      ? normalizeProfile(collectProfileFromForm())
      : normalizeProfile(readRawProfile());
    const { score, missing } = getProfileCompleteness(profile);

    const scoreEl = document.getElementById('profile-strength-score');
    const barEl = document.getElementById('profile-strength-bar');
    const hintsEl = document.getElementById('profile-strength-hints');

    if (scoreEl) scoreEl.textContent = `${score}%`;
    if (barEl) barEl.style.width = `${score}%`;

    if (hintsEl) {
      if (missing.length) {
        hintsEl.innerHTML = missing.map((m) =>
          `<span class="inline-flex items-center gap-1 text-[11px] text-gray-600 dark:text-gray-400"><i class="fas fa-arrow-right text-[#00A89D] text-[9px]"></i> ${m.hint} <span class="text-gray-400">(${m.tools})</span></span>`
        ).join('');
      } else {
        hintsEl.innerHTML = '<span class="text-[11px] text-[#00A89D]"><i class="fas fa-check-circle"></i> Profile is strong — tools will personalize well.</span>';
      }
    }

    updateProfileTabBadges(profile);
    updateLivePreview(profile);
    updateProfileLastUpdated(profile);

    updateHeaderProfileBadge(score);

    if (typeof window.refreshCoachOnboarding === 'function') {
      window.refreshCoachOnboarding();
    }
  }

  function updateHeaderProfileBadge(score) {
    const openBtn = document.getElementById('open-profile-btn');
    if (!openBtn) return;

    let badge = document.getElementById('header-profile-strength');
    if (!badge) {
      badge = document.createElement('span');
      badge.id = 'header-profile-strength';
      badge.className = 'text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-0.5';
      openBtn.appendChild(badge);
    }

    badge.textContent = `${score}%`;
    badge.classList.remove('bg-green-500/30', 'text-green-100', 'bg-amber-400/30', 'text-amber-100', 'bg-red-400/30', 'text-red-100');
    if (score >= 70) {
      badge.classList.add('bg-green-500/30', 'text-green-100');
    } else if (score >= 40) {
      badge.classList.add('bg-amber-400/30', 'text-amber-100');
    } else {
      badge.classList.add('bg-red-400/30', 'text-red-100');
    }
    openBtn.title = `My Profile — ${score}% complete`;
  }

  function getSectionFillCount(section, profile) {
    const p = profile || normalizeProfile(readRawProfile());
    const maps = {
      identity: [
        () => p.name,
        () => p.email,
        () => p.location,
        () => p.companyName,
        () => p.headshotUrl || p.logoUrl
      ],
      business: [
        () => p.focus,
        () => p.monthlyUnits || p.monthlyGoal,
        () => p.databaseSize,
        () => p.hours,
        () => p.challenges.length || p.challengesOther,
        () => p.niches.length || p.nichesOther
      ],
      content: [
        () => p.tone,
        () => p.contentNotes,
        () => p.voiceTraits.length,
        () => p.formats.length,
        () => p.companyWebsite,
        () => p.blogPageUrl
      ],
      prospecting: [
        () => p.activities.length,
        () => p.partnerTypes.length || p.partnerTypesOther,
        () => p.partnerFocus
      ],
      personal: [
        () => p.hobbies.length || p.hobbiesOther,
        () => p.family,
        () => p.personality
      ]
    };
    const checks = maps[section] || [];
    const done = checks.filter((fn) => fn()).length;
    const total = checks.length;
    return { done, total, label: total ? `${done}/${total}` : '' };
  }

  function updateProfileTabBadges(profile) {
    const p = profile || normalizeProfile(readRawProfile());
    PROFILE_TABS.forEach((tab) => {
      const { done, total, label } = getSectionFillCount(tab, p);
      const btn = document.querySelector(`.profile-tab-btn[data-profile-tab="${tab}"]`);
      const badge = btn?.querySelector('.profile-tab-badge');
      if (badge) badge.textContent = total ? ` ${label}` : '';
      if (btn) {
        btn.classList.toggle('opacity-60', total > 0 && done === 0);
      }
    });
  }

  function updateLivePreview(profile) {
    const p = profile || normalizeProfile(collectProfileFromForm());
    const textEl = document.getElementById('profile-live-preview-text');
    const toolsEl = document.getElementById('profile-live-preview-tools');
    if (!textEl) return;

    const bits = [
      p.name,
      p.companyName,
      p.location,
      p.focusLabel || p.focus,
      p.tone ? p.tone.replace(/\s*\(.*\)\s*/, '').trim() : ''
    ].filter(Boolean);

    textEl.textContent = bits.length
      ? bits.join(' · ')
      : 'Complete your profile so every tool sounds like you.';

    if (toolsEl) {
      const toolChips = [];
      if (p.name && p.location) toolChips.push('Newsletter');
      if (p.blogPageUrl) toolChips.push('Blog link');
      if (p.companyName || p.headshotUrl) toolChips.push('Branding');
      if (p.tone) toolChips.push('Social');
      if (p.focus) toolChips.push('Weekly Plan');
      if (p.activities.length) toolChips.push('Prospecting');
      toolsEl.innerHTML = [...new Set(toolChips)].map((t) =>
        `<span class="text-[10px] px-2 py-0.5 rounded-full bg-[#00A89D]/15 text-[#00A89D] font-semibold">${escapeHtml(t)}</span>`
      ).join('');
    }
  }

  function updateProfileLastUpdated(profile) {
    const el = document.getElementById('profile-last-updated');
    if (!el) return;
    const raw = (profile || normalizeProfile(readRawProfile())).lastUpdated;
    if (!raw) {
      el.classList.add('hidden');
      return;
    }
    try {
      const d = new Date(raw);
      el.textContent = `Updated ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
      el.classList.remove('hidden');
    } catch (e) {
      el.classList.add('hidden');
    }
  }

  function switchProfileTab(tabId) {
    if (!PROFILE_TABS.includes(tabId)) tabId = 'identity';
    PROFILE_TABS.forEach((tab) => {
      const panel = document.getElementById(`profile-tab-panel-${tab}`);
      const btn = document.querySelector(`.profile-tab-btn[data-profile-tab="${tab}"]`);
      const active = tab === tabId;
      if (panel) panel.classList.toggle('hidden', !active);
      if (btn) {
        btn.classList.toggle('active', active);
        btn.classList.toggle('border-[#00A89D]', active);
        btn.classList.toggle('text-[#00A89D]', active);
        btn.classList.toggle('bg-white', active);
        btn.classList.toggle('dark:bg-gray-900', active);
        btn.classList.toggle('border-transparent', !active);
        btn.classList.toggle('text-gray-500', !active);
      }
    });
    const scroll = document.getElementById('profile-form-scroll');
    if (scroll) scroll.scrollTop = 0;
  }

  function getFirstIncompleteTab(profile) {
    const p = profile || normalizeProfile(readRawProfile());
    for (const tab of PROFILE_TABS) {
      const { done, total } = getSectionFillCount(tab, p);
      if (total && done < total) return tab;
    }
    return 'identity';
  }

  function slugifyBlogName(name) {
    return String(name || '')
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .map((part) => part.replace(/[^a-z0-9]/g, ''))
      .filter(Boolean)
      .join('');
  }

  function applyBlogFromWebsite() {
    const website = document.getElementById('profile-company-website')?.value.trim() || '';
    const el = document.getElementById('profile-blog-url');
    if (!el) return;
    if (!website) {
      if (typeof window.showToast === 'function') window.showToast('Add your company website first — we will append /blog.', 'info');
      return;
    }
    const base = website.replace(/\/+$/, '');
    el.value = `${base}/blog`;
    autoSaveProfile();
    if (typeof window.showToast === 'function') window.showToast('Blog URL set from your website — adjust if your blog lives elsewhere.', 'success');
  }

  function flushWizardSave() {
    clearTimeout(autoSaveTimer);
    if (isProfileModalOpen()) performSave(false, false);
  }

  function showView(view) {
    const wizardHeader = document.getElementById('profile-wizard-view');
    const wizardFooter = document.getElementById('profile-wizard-footer');
    const fullChrome = document.getElementById('profile-full-chrome');
    const fullFooter = document.getElementById('profile-full-footer');
    const full = document.getElementById('profile-full-view');
    const modalEl = modal || document.getElementById('user-profile-modal');

    wizardActive = view === 'wizard';
    if (modalEl) modalEl.classList.toggle('profile-modal--wizard', wizardActive);

    if (wizardHeader) wizardHeader.classList.toggle('hidden', !wizardActive);
    if (wizardFooter) wizardFooter.classList.toggle('hidden', !wizardActive);
    if (fullChrome) fullChrome.classList.toggle('hidden', wizardActive);
    if (fullFooter) fullFooter.classList.toggle('hidden', wizardActive);
    if (full) full.classList.remove('hidden');

    const scroll = document.getElementById('profile-form-scroll');
    if (scroll) scroll.scrollTop = 0;
  }

  function shouldShowWizard() {
    if (localStorage.getItem(WIZARD_DONE_KEY) === '1') return false;
    return getProfileCompleteness().score < 70;
  }

  function renderWizardStep() {
    const total = PROFILE_TABS.length;
    const tabId = PROFILE_TABS[wizardStep - 1] || 'identity';
    switchProfileTab(tabId);

    const progress = document.getElementById('profile-wizard-progress');
    if (progress) progress.textContent = `Step ${wizardStep} of ${total}`;

    const title = document.getElementById('profile-wizard-step-title');
    if (title) title.textContent = WIZARD_STEP_LABELS[tabId] || tabId;

    const hint = document.getElementById('profile-wizard-step-hint');
    if (hint) hint.textContent = WIZARD_STEP_HINTS[tabId] || '';

    const dots = document.getElementById('profile-wizard-dots');
    if (dots) {
      dots.innerHTML = PROFILE_TABS.map((tab, idx) => {
        const stepNum = idx + 1;
        const cls = stepNum === wizardStep
          ? 'bg-[#00A89D]'
          : stepNum < wizardStep
            ? 'bg-[#00A89D]/40'
            : 'bg-gray-300 dark:bg-gray-600';
        return `<span class="w-2 h-2 rounded-full ${cls}"></span>`;
      }).join('');
    }

    const back = document.getElementById('profile-wizard-back');
    const next = document.getElementById('profile-wizard-next');
    if (back) back.classList.toggle('hidden', wizardStep === 1);
    if (next) next.textContent = wizardStep === total ? 'Save & finish' : 'Continue';

    refreshProfileUI();
  }

  function finishWizard() {
    flushWizardSave();
    localStorage.setItem(WIZARD_DONE_KEY, '1');
    const merged = normalizeProfile(collectProfileFromForm());
    const oldSetup = JSON.parse(localStorage.getItem('winPlanSetup') || '{}');
    localStorage.setItem('winPlanSetup', JSON.stringify({ ...oldSetup, ...merged }));
    loadProfileIntoForm();
    showView('full');
    switchProfileTab(getFirstIncompleteTab(merged));
    if (typeof window.refreshCoachOnboarding === 'function') window.refreshCoachOnboarding();
    if (typeof window.syncNewsletterFromProfile === 'function') {
      try { window.syncNewsletterFromProfile(true); } catch (e) {}
    }
    if (typeof window.showToast === 'function') {
      window.showToast('Profile setup complete — edit anytime from My Profile.', 'success');
    }
  }

  function startProfileWizard(step) {
    loadProfileIntoForm();
    wizardStep = step || 1;
    renderWizardStep();
    showView('wizard');
  }

  function openModal(forceFull) {
    modal = document.getElementById('user-profile-modal');
    if (!modal) return;

    if (typeof window.openAppModal === 'function') {
      window.openAppModal(modal);
    } else {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      modal.style.display = 'flex';
      if (typeof window.resetModalScroll === 'function') window.resetModalScroll(modal);
    }

    if (!forceFull && shouldShowWizard()) {
      startProfileWizard(1);
    } else {
      loadProfileIntoForm();
      showView('full');
      const p = normalizeProfile(readRawProfile());
      switchProfileTab(getFirstIncompleteTab(p));
    }
  }

  function closeModal() {
    if (!modal) modal = document.getElementById('user-profile-modal');
    if (!modal) return;
    flushWizardSave();
    if (typeof window.closeAppModal === 'function') {
      window.closeAppModal(modal);
    } else {
      if (typeof window.resetModalScroll === 'function') window.resetModalScroll(modal);
      modal.classList.remove('flex');
      modal.classList.add('hidden');
    }

    if (typeof window.renderWeeklyProfileSummary === 'function') window.renderWeeklyProfileSummary();
    if (typeof window.renderExtendedProfileInfo === 'function') window.renderExtendedProfileInfo();
    if (typeof window.updatePTBProfileDisplay === 'function') window.updatePTBProfileDisplay();
  }

  function autoSaveProfile() {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      if (!isProfileModalOpen()) return;
      performSave(false, false);
      const statusEl = document.getElementById('profile-save-status');
      if (statusEl) {
        statusEl.innerHTML = '<i class="fas fa-check text-[#00A89D]"></i> <span>Saved just now</span>';
        setTimeout(() => {
          if (statusEl) statusEl.innerHTML = '<i class="fas fa-check text-[#00A89D]"></i> <span>All changes saved automatically</span>';
        }, 2400);
      }
    }, 450);
  }

  function syncSelectAllStates() {
    if (!modal) modal = document.getElementById('user-profile-modal');
    if (!modal) return;
    modal.querySelectorAll('.profile-select-all').forEach((master) => {
      const sel = master.getAttribute('data-target');
      if (!sel) return;
      const boxes = modal.querySelectorAll(sel);
      if (!boxes.length) return;
      master.checked = Array.prototype.every.call(boxes, (b) => b.checked);
    });
  }

  function setupSelectAllToggles() {
    if (!modal) return;
    modal.addEventListener('change', (e) => {
      const master = e.target.closest('.profile-select-all');
      if (master) {
        const targetSelector = master.getAttribute('data-target');
        if (targetSelector) {
          modal.querySelectorAll(targetSelector).forEach((cb) => { cb.checked = master.checked; });
          autoSaveProfile();
        }
      }
      const t = e.target;
      if (t.matches('input[type="checkbox"].profile-hobby, input[type="checkbox"].profile-activity, input[type="checkbox"].profile-partner, input[type="checkbox"].profile-niche, input[type="checkbox"].profile-challenge, input[type="checkbox"].profile-voice, input[type="checkbox"].profile-format')) {
        syncSelectAllStates();
      }
    });
  }

  function setupProfileTabHandlers() {
    document.querySelectorAll('.profile-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-profile-tab');
        if (tab) switchProfileTab(tab);
      });
    });
  }

  function setupWizardHandlers() {
    document.getElementById('profile-wizard-skip')?.addEventListener('click', () => {
      flushWizardSave();
      localStorage.setItem(WIZARD_DONE_KEY, '1');
      loadProfileIntoForm();
      showView('full');
      switchProfileTab(getFirstIncompleteTab());
    });

    document.getElementById('profile-wizard-back')?.addEventListener('click', () => {
      flushWizardSave();
      if (wizardStep > 1) {
        wizardStep -= 1;
        renderWizardStep();
      }
    });

    document.getElementById('profile-wizard-next')?.addEventListener('click', () => {
      flushWizardSave();
      if (wizardStep < PROFILE_TABS.length) {
        wizardStep += 1;
        renderWizardStep();
      } else {
        finishWizard();
      }
    });

    document.getElementById('profile-wizard-save-exit')?.addEventListener('click', () => {
      performSave(true, true);
    });

    document.getElementById('profile-open-wizard')?.addEventListener('click', () => {
      startProfileWizard(1);
    });
  }

  function paintHeaderProfileBadge() {
    const profile = normalizeProfile(readRawProfile());
    const { score } = getProfileCompleteness(profile);
    updateHeaderProfileBadge(score);
  }

  function initProfileModal() {
    const openBtn = document.getElementById('open-profile-btn');
    if (!openBtn) {
      console.warn('[user-profile] open-profile-btn not found');
      return;
    }

    if (!openBtn.dataset.profileBound) {
      openBtn.addEventListener('click', () => openModal(false));
      openBtn.dataset.profileBound = '1';
    }

    modal = document.getElementById('user-profile-modal');
    if (!modal) {
      paintHeaderProfileBadge();
      return;
    }
    document.getElementById('close-profile-modal')?.addEventListener('click', closeModal);
    document.getElementById('cancel-profile')?.addEventListener('click', closeModal);

    if (typeof window.ensureModalBackdropClose === 'function') {
      window.ensureModalBackdropClose(modal);
    }
    document.getElementById('save-profile')?.addEventListener('click', () => performSave(true, true));
    document.getElementById('profile-blog-from-website')?.addEventListener('click', applyBlogFromWebsite);

    modal.addEventListener('input', autoSaveProfile);
    modal.addEventListener('change', autoSaveProfile);
    setupSelectAllToggles();
    setupWizardHandlers();
    setupProfileTabHandlers();

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) e.preventDefault();
    });

    loadProfileIntoForm();
    refreshProfileUI();

    console.log('%c[user-profile] Initialized — wizard, meter, normalized schema', 'color:#00A89D');
  }

  window.getUserProfile = function getUserProfile() {
    return normalizeProfile(readRawProfile());
  };

  window.getProfileCompleteness = getProfileCompleteness;
  window.buildProfileAiContext = buildAiContext;
  window.buildProfilePreviewText = buildPreviewText;
  window.buildProfilePreviewHtml = buildPreviewHtml;
  window.normalizeUserProfile = normalizeProfile;

  window.openUserProfile = function openUserProfile(forceFull) {
    openModal(!!forceFull);
  };

  window.closeUserProfile = function closeUserProfile() {
    closeModal();
  };

  window.switchProfileTab = switchProfileTab;
  window.refreshProfileUI = refreshProfileUI;
  window.startProfileWizard = startProfileWizard;

  // Paint header badge immediately from localStorage (no modal DOM required)
  paintHeaderProfileBadge();

  function bootProfileModal() {
    initProfileModal();
    if (!document.getElementById('user-profile-modal')) {
      paintHeaderProfileBadge();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootProfileModal);
  } else {
    bootProfileModal();
  }
})();