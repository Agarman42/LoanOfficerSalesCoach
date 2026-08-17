/**
 * js/features/user-profile.js
 * Central profile: normalized schema, quick wizard, completeness meter, tool wiring.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'userProfile';
  const WIZARD_DONE_KEY = 'coachProfileWizardDone';

  /** Ruoff company logo — hardcoded for LO coach (not user-editable). Same asset as app header. */
  const RUOFF_COMPANY_LOGO_URL =
    'https://2759433.fs1.hubspotusercontent-na1.net/hubfs/2759433/Ruoff_Mortgage_FC-Jan-18-2026-05-19-19-8281-AM.png';

  const FOCUS_OPTIONS = {
    'balanced-growth': 'Balanced Growth',
    'referral-partners': 'Heavy Realtor Partnerships',
    database: 'Past Client / Database Focus',
    'equity-refi': 'Equity & Refinance Opportunities'
  };

  const FOCUS_LEGACY = {
    'Balanced Growth': 'balanced-growth',
    'Heavy Realtor Partnerships': 'referral-partners',
    'Past Client / Database Focus': 'database',
    'Equity & Refinance Opportunities': 'equity-refi'
  };

  const DATABASE_LABELS = {
    'under-50': 'Under 50 past clients',
    '50-200': '50–200 past clients',
    '200-500': '200–500 past clients',
    '500-1000': '500–1,000 past clients',
    '1000-plus': '1,000+ past clients',
    '200-plus': '200+ past clients'
  };

  const COMPLETENESS_CHECKS = [
    { key: 'name', weight: 12, hint: 'Add your name', tools: 'Scripts, AI Coach', tab: 'identity', focusId: 'profile-name' },
    { key: 'location', weight: 10, hint: 'Add your market', tools: 'Social, Newsletter', tab: 'identity', focusId: 'profile-location' },
    { key: 'focus', weight: 10, hint: 'Pick a focus style', tools: 'Weekly Plan, Start Here', tab: 'business', focusId: 'profile-focus' },
    { key: 'blogPageUrl', weight: 8, hint: 'Add your blog page URL', tools: 'Newsletter, Blog', tab: 'links', focusId: 'profile-blog-url' },
    { key: 'monthlyUnits', weight: 8, hint: 'Set a monthly unit goal', tools: 'Weekly Plan', tab: 'business', focusId: 'profile-monthly-units' },
    { key: 'hobbies', weight: 8, hint: 'Add 1–2 hobbies', tools: 'Social, Content', tab: 'personal', focusId: 'profile-hobbies-other' },
    { key: 'tone', weight: 8, hint: 'Choose your tone', tools: 'AI, Scripts', tab: 'voice', focusId: 'profile-tone' },
    { key: 'partnerTypes', weight: 8, hint: 'Select partner types', tools: 'Referrals, Scripts', tab: 'prospecting', focusId: 'profile-partner-other' },
    { key: 'challenges', weight: 8, hint: 'Pick your top challenge', tools: 'Weekly Plan', tab: 'business', focusId: 'profile-challenge-other' },
    { key: 'intro', weight: 8, hint: 'Add a one-line intro', tools: 'Scripts, Social', tab: 'identity', focusId: 'profile-intro' },
    { key: 'activities', weight: 6, hint: 'Preferred prospecting activities', tools: 'Weekly Plan', tab: 'prospecting', focusId: null },
    { key: 'databaseSize', weight: 4, hint: 'Database size tier', tools: 'Nurture, Weekly Plan', tab: 'business', focusId: 'profile-database-size' },
    { key: 'contentNotes', weight: 4, hint: 'Content guardrails', tools: 'All AI tools', tab: 'voice', focusId: 'profile-content-notes' }
  ];

  /** First empty field to focus when landing on a tab (guided + full). */
  const TAB_FOCUS_FIELDS = {
    identity: ['profile-name', 'profile-location', 'profile-intro', 'profile-email', 'profile-phone', 'profile-nmls'],
    business: ['profile-focus', 'profile-income', 'profile-monthly-units', 'profile-database-size'],
    voice: ['profile-tone', 'profile-content-notes'],
    links: ['profile-blog-url', 'profile-company-website'],
    prospecting: ['profile-partner-focus'],
    personal: ['profile-hobbies-other', 'profile-family', 'profile-personality']
  };

  const PROFILE_TABS = ['identity', 'business', 'voice', 'links', 'prospecting', 'personal'];

  const WIZARD_STEP_LABELS = {
    identity: 'Identity & Branding',
    business: 'Business Goals',
    voice: 'Voice & Style',
    links: 'Links & Branding',
    prospecting: 'Prospecting',
    personal: 'Personal'
  };

  const WIZARD_STEP_HINTS = {
    identity: '~45 sec · Name, market, intro, and headshot power Newsletter, Scripts, and partner share.',
    business: '~60 sec · Focus + goals feed Weekly Win Plan and your 2026 Business Plan.',
    voice: '~40 sec · Tone and guardrails — how every AI tool should sound like you.',
    links: '~30 sec · Blog URL and branding defaults for Newsletter and Blog Creator.',
    prospecting: '~40 sec · How you hunt — activities and partner types for outreach plans.',
    personal: '~30 sec · Optional flavor for Social and AI Coach (never forced into every post).'
  };

  function asArray(val) {
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'string' && val.trim()) return val.split(',').map((s) => s.trim()).filter(Boolean);
    return [];
  }

  function normalizeFocus(raw) {
    if (!raw || !String(raw).trim()) {
      return { value: 'balanced-growth', label: FOCUS_OPTIONS['balanced-growth'] };
    }
    if (FOCUS_OPTIONS[raw]) return { value: raw, label: FOCUS_OPTIONS[raw] };
    if (FOCUS_LEGACY[raw]) return { value: FOCUS_LEGACY[raw], label: raw };
    const lower = String(raw).toLowerCase();
    if (lower.includes('referral') || lower.includes('realtor') || lower.includes('partner')) {
      return { value: 'referral-partners', label: FOCUS_OPTIONS['referral-partners'] };
    }
    if (lower.includes('database') || lower.includes('past client') || lower.includes('sphere')) {
      return { value: 'database', label: FOCUS_OPTIONS.database };
    }
    if (lower.includes('equity') || lower.includes('refi')) {
      return { value: 'equity-refi', label: FOCUS_OPTIONS['equity-refi'] };
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
      p.monthlyUnits ? `${p.monthlyUnits} loans/mo` : '',
      p.monthlyGoal ? `Volume: ${p.monthlyGoal}` : ''
    ].filter(Boolean).join('; ');

    return {
      ...p,
      name: (p.name || '').trim(),
      email: (p.email || '').trim(),
      phone: (p.phone || '').trim(),
      nmls: (p.nmls || '').trim(),
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
      newsletterColorBundle: (p.newsletterColorBundle || 'coastal-teal').trim(),
      logoUrl: RUOFF_COMPANY_LOGO_URL,
      headshotUrl: (p.headshotUrl || p['headshot-url'] || '').trim(),
      blogPageUrl: (p.blogPageUrl || p.blogUrl || '').trim(),
      linkedInUrl: (p.linkedInUrl || p.linkedin || '').trim(),
      companyWebsite: (p.companyWebsite || p.website || '').trim(),
      translationDefaultTarget: p.translationDefaultTarget || 'es',
      translationFavoriteLanguages: asArray(p.translationFavoriteLanguages).length
        ? asArray(p.translationFavoriteLanguages)
        : ['es', 'vi', 'zh'],
      bioBuilderDraft: p.bioBuilderDraft && typeof p.bioBuilderDraft === 'object' ? p.bioBuilderDraft : {},
      professionalBio: (p.professionalBio || '').trim(),
      professionalBioMeta: p.professionalBioMeta && typeof p.professionalBioMeta === 'object' ? p.professionalBioMeta : null,
      bioHistory: Array.isArray(p.bioHistory) ? p.bioHistory.slice(0, 8) : [],
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
      missing,
      missingCount: missing.length,
      isComplete: score >= 70
    };
  }

  const PROFILE_TAB_HINT_LABELS = {
    identity: 'ID',
    business: 'Biz',
    voice: 'Voice',
    links: 'Link',
    prospecting: 'Pros',
    personal: 'Pers'
  };

  const PROFILE_TAB_SHORT_LABELS = {
    identity: 'Identity',
    business: 'Business',
    voice: 'Voice',
    links: 'Links',
    content: 'Voice', // legacy
    prospecting: 'Prospecting',
    personal: 'Personal'
  };

  /** Map old voice trait labels → current fine-tune chips (tools still accept free strings). */
  const VOICE_TRAIT_LEGACY = {
    'Uses humor / light-hearted': 'Uses humor lightly',
    'Witty and clever': 'Uses humor lightly',
    'Very professional & polished': 'Partner-first language',
    'Conversational (like a trusted friend)': 'Warm and encouraging',
    'Straightforward / no fluff': 'Short & direct'
  };

  const VOICE_TRAIT_MAX = 3;

  const INTRO_FOCUS_SNIPPETS = {
    'balanced-growth': 'balanced growth across partners and past clients',
    'referral-partners': 'strong realtor partnerships and clear communication',
    database: 'staying useful to past clients long after closing',
    'equity-refi': 'helping homeowners unlock equity with confidence'
  };

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
      previewRow('NMLS', p.nmls),
      previewRow('Market', p.location),
      previewRow('Years', p.years ? formatExperienceYearsDisplay(p.years) : ''),
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
      previewRow('Logo', 'Ruoff Mortgage (built-in)'),
      previewRow('Headshot', p.headshotUrl ? 'Set' : ''),
      previewRow('Personality', p.personality),
      previewRow('Guardrails', p.contentNotes),
      previewRow('Blog', p.blogPageUrl),
      previewRow('Website', p.companyWebsite),
      previewRow('Family', p.family)
    ].filter(Boolean);

    if (!rows.length) {
      return '<p class="text-gray-500 italic">No fields filled yet — complete the form below and every tool will personalize from it.</p>';
    }
    return rows.join('');
  }

  /**
   * Parse free-text experience: "12", "12 years", "since 2004", "licensed since 2010".
   * When a start year is found, computed tenure updates automatically each calendar year.
   */
  function resolveExperienceYears(raw, options = {}) {
    const nowYear = options.asOfYear || new Date().getFullYear();
    const text = String(raw || '').trim();
    if (!text) {
      return { raw: '', startYear: null, computedYears: null, phrase: '', hint: '' };
    }

    let startYear = null;
    let computedYears = null;

    if (/^\d{1,2}$/.test(text)) {
      computedYears = parseInt(text, 10);
    }

    const yearsWord = text.match(/^(\d{1,2})\s*\+?\s*years?\b/i);
    if (yearsWord) computedYears = parseInt(yearsWord[1], 10);

    if (computedYears == null) {
      const sincePatterns = [
        /\b(?:since|from|started(?:\s+in)?|licensed\s+since|in\s+(?:the\s+)?business\s+since)\s*['']?(\d{4})\b/i,
        /^since\s+['']?(\d{4})\b/i,
        /^(\d{4})$/
      ];
      for (const re of sincePatterns) {
        const m = text.match(re);
        if (m) {
          startYear = parseInt(m[1], 10);
          break;
        }
      }
      if (startYear == null) {
        const embedded = text.match(/\b(19[89]\d|20[0-3]\d)\b/);
        if (embedded) startYear = parseInt(embedded[1], 10);
      }
      if (startYear != null && startYear >= 1950 && startYear <= nowYear) {
        computedYears = Math.max(0, nowYear - startYear);
      }
    }

    let hint = '';
    let phrase = text;
    if (startYear != null && computedYears != null) {
      hint = `≈ ${computedYears} years in business (since ${startYear}, through ${nowYear})`;
      phrase = `${text} — approximately ${computedYears} years in business as of ${nowYear} (career start ${startYear})`;
    } else if (computedYears != null) {
      hint = `${computedYears} year${computedYears === 1 ? '' : 's'} in business`;
      phrase = /\byears?\b/i.test(text) ? text : `${computedYears} years in business`;
    }

    return { raw: text, startYear, computedYears, phrase, hint };
  }

  function formatExperienceYearsDisplay(raw) {
    const r = resolveExperienceYears(raw);
    if (!r.raw) return '—';
    return r.hint ? r.hint.replace(/^≈\s*/, '') : r.raw;
  }

  function updateExperienceYearsHint(inputEl, hintEl) {
    if (!inputEl || !hintEl) return;
    const r = resolveExperienceYears(inputEl.value);
    if (r.hint) {
      hintEl.textContent = r.hint;
      hintEl.classList.remove('hidden');
    } else {
      hintEl.textContent = '';
      hintEl.classList.add('hidden');
    }
  }

  /** First integer in monthly unit goal string (e.g. "6-8 loans" → 6). */
  function parseMonthlyUnitsValue(raw) {
    const m = String(raw || '').match(/(\d{1,3})/);
    if (!m) return null;
    const n = parseInt(m[1], 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  function updateAnnualUnitsHint(inputEl) {
    const hintEl = document.getElementById('profile-annual-units-hint');
    if (!hintEl) return;
    const n = parseMonthlyUnitsValue(inputEl?.value);
    if (n) {
      hintEl.textContent = `≈ ${n * 12} funded loans / year for the 2026 Business Plan target`;
      hintEl.classList.remove('hidden');
    } else {
      hintEl.textContent = '';
      hintEl.classList.add('hidden');
    }
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
    if (p.nmls) lines.push(`NMLS: ${p.nmls}`);
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
    if (p.years) {
      const y = resolveExperienceYears(p.years);
      lines.push(`Years in business: ${y.phrase || p.years}`);
    }
    if (p.professionalBio) lines.push(`Professional bio: ${p.professionalBio}`);
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
    // Preserve removed UI fields from storage so we don't wipe legacy data on save
    const existing = readRawProfile();

    return {
      name: getVal('profile-name'),
      email: getVal('profile-email'),
      phone: getVal('profile-phone'),
      nmls: getVal('profile-nmls'),
      intro: getVal('profile-intro'),
      location: getVal('profile-location'),
      years: getRaw('profile-years'),
      team: getRaw('profile-team'),
      monthlyUnits: getRaw('profile-monthly-units'),
      monthlyGoal: getRaw('profile-monthly-goal'),
      income: getRaw('profile-income'),
      focus: getRaw('profile-focus') || 'balanced-growth',
      newsletterColorBundle: getRaw('profile-newsletter-color-bundle') || 'coastal-teal',
      logoUrl: RUOFF_COMPANY_LOGO_URL,
      headshotUrl: getVal('profile-headshot-url'),
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
      // Removed from UI (unused by tools) — preserve existing values
      formats: asArray(existing.formats),
      voiceTraits: Array.from(document.querySelectorAll('.profile-voice:checked')).map((c) => c.value),
      partnerTypes: Array.from(document.querySelectorAll('.profile-partner:checked')).map((c) => c.value),
      partnerTypesOther: getVal('profile-partner-other'),
      blogPageUrl: getVal('profile-blog-url'),
      linkedInUrl: (existing.linkedInUrl || existing.linkedin || '').trim(),
      companyWebsite: getVal('profile-company-website'),
      translationDefaultTarget: getRaw('profile-translation-default') || 'es',
      translationFavoriteLanguages: Array.from(document.querySelectorAll('.profile-translation-fav:checked')).map((c) => c.value),
      // Preserve bio builder store — collectProfileFromForm rebuilds a new object
      // and must not drop these or normalizeProfile will reset bioBuilderDraft to {}.
      bioBuilderDraft: existing.bioBuilderDraft && typeof existing.bioBuilderDraft === 'object' ? existing.bioBuilderDraft : {},
      professionalBio: existing.professionalBio || '',
      professionalBioMeta: existing.professionalBioMeta && typeof existing.professionalBioMeta === 'object' ? existing.professionalBioMeta : null,
      bioHistory: Array.isArray(existing.bioHistory) ? existing.bioHistory : [],
      lastUpdated: new Date().toISOString()
    };
  }

  function patchUserProfile(partial, opts) {
    const options = opts || {};
    const merged = normalizeProfile({ ...readRawProfile(), ...partial, lastUpdated: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    const oldSetup = JSON.parse(localStorage.getItem('winPlanSetup') || '{}');
    localStorage.setItem('winPlanSetup', JSON.stringify({ ...oldSetup, ...merged }));
    if (!options.silent) {
      refreshProfileUI();
      notifyProfileConsumers(merged);
    }
    if (options.showFeedback) {
      const msg = options.feedbackMessage || 'Profile updated.';
      if (typeof window.showToast === 'function') {
        window.showToast(msg);
      }
    }
    return merged;
  }

  /** Push profile into tools that cache or display LO details. */
  function notifyProfileConsumers(profile) {
    const p = profile || normalizeProfile(readRawProfile());
    try {
      window.dispatchEvent(new CustomEvent('profile-updated', { detail: { profile: p } }));
    } catch (e) { /* ignore */ }

    if (typeof window.refreshCoachOnboarding === 'function') {
      try { window.refreshCoachOnboarding(); } catch (e) { /* ignore */ }
    }
    if (typeof window.syncNewsletterFromProfile === 'function') {
      try { window.syncNewsletterFromProfile(); } catch (e) { /* ignore */ }
    }
    if (typeof window.syncNewsletterContactFromProfile === 'function') {
      try { window.syncNewsletterContactFromProfile(); } catch (e) { /* ignore */ }
    }
    if (typeof window.renderWeeklyProfileSummary === 'function') {
      try { window.renderWeeklyProfileSummary(); } catch (e) { /* ignore */ }
    }
    if (typeof window.renderExtendedProfileInfo === 'function') {
      try { window.renderExtendedProfileInfo(); } catch (e) { /* ignore */ }
    }
    if (typeof window.updatePTBProfileDisplay === 'function') {
      try { window.updatePTBProfileDisplay(); } catch (e) { /* ignore */ }
    }
    if (typeof window.prefillCalendarFromProfile === 'function') {
      try { window.prefillCalendarFromProfile(false); } catch (e) { /* ignore */ }
    }
    if (typeof window.refreshPartnerSharePreview === 'function') {
      try { window.refreshPartnerSharePreview(); } catch (e) { /* ignore */ }
    }
    // Pull business goals into 2026 plan form (non-destructive unless force)
    if (typeof window.syncPlanningFormFromProfile === 'function') {
      try { window.syncPlanningFormFromProfile({ force: false }); } catch (e) { /* ignore */ }
    }
  }

  function persistProfile(profile, showFeedback, closeAfter) {
    const normalized = normalizeProfile(profile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));

    const oldSetup = JSON.parse(localStorage.getItem('winPlanSetup') || '{}');
    localStorage.setItem('winPlanSetup', JSON.stringify({ ...oldSetup, ...normalized }));

    refreshProfileUI();
    notifyProfileConsumers(normalized);

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
      'name', 'email', 'phone', 'nmls', 'intro', 'location', 'years', 'team',
      'monthly-units', 'monthly-goal', 'income', 'focus', 'hours',
      'database-size', 'partner-focus', 'family', 'personality', 'tone',
      'content-notes', 'hobbies-other', 'niche-other', 'challenge-other', 'partner-other',
      'newsletter-color-bundle', 'headshot-url', 'blog-url', 'company-website'
    ];

    const fieldKeyMap = {
      'newsletter-color-bundle': 'newsletterColorBundle',
      'headshot-url': 'headshotUrl',
      'blog-url': 'blogPageUrl',
      'company-website': 'companyWebsite'
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

    updateExperienceYearsHint(
      document.getElementById('profile-years'),
      document.getElementById('profile-years-hint')
    );
    updateAnnualUnitsHint(document.getElementById('profile-monthly-units'));

    const sets = [
      ['.profile-hobby', 'hobbies'],
      ['.profile-activity', 'activities'],
      ['.profile-niche', 'niches'],
      ['.profile-challenge', 'challenges'],
      ['.profile-partner', 'partnerTypes']
    ];

    sets.forEach(([sel, key]) => {
      document.querySelectorAll(sel).forEach((cb) => {
        cb.checked = profile[key] && profile[key].includes(cb.value);
      });
    });

    // Voice fine-tunes: map legacy labels onto current chips
    const mappedVoice = asArray(profile.voiceTraits).map((v) => VOICE_TRAIT_LEGACY[v] || v);
    document.querySelectorAll('.profile-voice').forEach((cb) => {
      cb.checked = mappedVoice.includes(cb.value);
    });
    enforceVoiceTraitCap(false);

    const translationDefault = document.getElementById('profile-translation-default');
    if (translationDefault) {
      translationDefault.value = profile.translationDefaultTarget || 'es';
    }
    document.querySelectorAll('.profile-translation-fav').forEach((cb) => {
      cb.checked = profile.translationFavoriteLanguages && profile.translationFavoriteLanguages.includes(cb.value);
    });

    const bundleSel = document.getElementById('profile-newsletter-color-bundle');
    if (bundleSel) {
      bundleSel.value = profile.newsletterColorBundle || 'coastal-teal';
      if (window.NlColorBundles?.wireProfileBundlePicker) {
        window.NlColorBundles.wireProfileBundlePicker();
      }
    }

    syncSelectAllStates();
    updateHeadshotPreview(profile.headshotUrl);
    refreshIntroHelpers(profile);
    refreshProfileUI();
  }

  function firstNameFrom(name) {
    const n = String(name || '').trim();
    if (!n) return '';
    return n.split(/\s+/)[0];
  }

  function yearsSnippet(yearsRaw) {
    const display = formatExperienceYearsDisplay(yearsRaw);
    if (!display) return '';
    // "22 years in business" → "22 years of mortgage experience"
    const m = String(display).match(/(\d+)\s*years?/i);
    if (m) return `${m[1]} years of mortgage experience`;
    return display;
  }

  function buildIntroSuggestions(profile) {
    const p = profile || normalizeProfile(isProfileModalOpen() ? collectProfileFromForm() : readRawProfile());
    const first = firstNameFrom(p.name);
    const market = (p.location || '').trim();
    const years = yearsSnippet(p.years);
    const focusKey = p.focus || '';
    const focusBit = INTRO_FOCUS_SNIPPETS[focusKey] || (p.focusLabel || '').trim();
    const niches = asArray(p.niches).slice(0, 2);
    const nicheBit = niches.length ? niches.join(' & ').toLowerCase() : '';
    const tone = String(p.tone || '').toLowerCase();
    const bio = String(p.professionalBio || '').trim();

    const list = [];
    const push = (text, source) => {
      const t = String(text || '').trim().replace(/\s+/g, ' ');
      if (!t || t.length < 20) return;
      if (list.some((x) => x.text === t)) return;
      list.push({ text: t.length > 160 ? `${t.slice(0, 157)}…` : t, source: source || 'template' });
    };

    // Ready-to-use (no profile / bio required) — partner-facing service language first
    push("I'm committed to delivering world-class service through clear, proactive communication and continuing to bring value to you and your clients long after closing.", 'template');
    push('Clear communication and proactive updates so partners and clients always know what’s next.', 'template');
    push('Realtor-friendly LO: proactive updates, clean files, and no surprises at closing.', 'template');
    push("I'm the LO who makes pre-approvals feel fast, clear, and human.", 'template');
    push('I help first-time and move-up buyers feel confident — not confused — about their options.', 'template');
    push('Local mortgage guidance that puts education first and pressure last.', 'template');

    // Bio-powered (once professional bio is completed)
    if (bio) {
      const sentMatch = bio.match(/^(.{28,160}?[.!?])(?:\s|$)/);
      const firstSentence = (sentMatch ? sentMatch[1] : '').trim().replace(/^["']|["']$/g, '');
      if (firstSentence) {
        push(firstSentence, 'bio');
      } else if (bio.length <= 160) {
        push(bio, 'bio');
      }
      if (first && market) {
        push(`${first} — ${market} mortgage help rooted in the same promise as my bio: clear guidance and follow-through.`, 'bio');
      }
    }

    // Profile-powered (fills in as identity / market complete)
    if (first && market && years) {
      push(
        `I'm ${first}, a loan officer in ${market} with ${years} — clear, proactive communication so clients always know what's next.`,
        'profile'
      );
    }
    if (first && market) {
      push(
        `${first} — ${market} mortgage help that feels fast, clear, and human.`,
        'profile'
      );
    }
    if (market && years) {
      push(
        `${market} loan officer with ${years}, focused on making pre-approvals simple and stress-free.`,
        'profile'
      );
    }
    if (focusBit && market) {
      push(`${market} LO known for ${focusBit}.`, 'profile');
    } else if (focusBit) {
      push(`Known for ${focusBit} — clear communication every step of the way.`, 'profile');
    }
    if (nicheBit && market) {
      push(
        `Helping ${nicheBit} in ${market} get confident, well-prepared for closing day.`,
        'profile'
      );
    } else if (nicheBit) {
      push(`Helping ${nicheBit} get confident, well-prepared for closing day.`, 'profile');
    }
    if (tone.includes('warm') || tone.includes('casual')) {
      push(
        market
          ? `Your approachable ${market} mortgage guide — no jargon, just a clear path home.`
          : 'Your approachable mortgage guide — no jargon, just a clear path home.',
        'tone'
      );
    }
    if (tone.includes('straightforward') || tone.includes('helpful')) {
      push(
        market
          ? `Straightforward ${market} lending help — options explained clearly, next steps always obvious.`
          : 'Straightforward lending help — options explained clearly, next steps always obvious.',
        'tone'
      );
    }
    if (tone.includes('professional')) {
      push(
        market
          ? `Professional, responsive mortgage guidance for ${market} buyers and homeowners.`
          : 'Professional, responsive mortgage guidance for buyers and homeowners.',
        'tone'
      );
    }
    if (tone.includes('witty') || tone.includes('fun')) {
      push(
        market
          ? `${market} mortgages without the stiff suit vibe — smart guidance, human delivery.`
          : 'Mortgages without the stiff suit vibe — smart guidance, human delivery.',
        'tone'
      );
    }

    // Prefer tailored (bio → profile → tone), but always keep 2 ready templates
    const bioOnes = list.filter((x) => x.source === 'bio');
    const personalized = list.filter((x) => x.source === 'profile' || x.source === 'tone');
    const templates = list.filter((x) => x.source === 'template');
    const tailored = [...bioOnes, ...personalized].slice(0, 4);
    const ready = templates.slice(0, Math.max(2, 6 - tailored.length));
    return [...tailored, ...ready].slice(0, 6);
  }

  function refreshIntroHelpers(profile) {
    const p = profile || normalizeProfile(isProfileModalOpen() ? collectProfileFromForm() : readRawProfile());
    const input = document.getElementById('profile-intro');
    const charEl = document.getElementById('profile-intro-char');
    const row = document.getElementById('profile-intro-chip-row');
    const label = document.querySelector('#profile-intro-suggestions .profile-intro-suggestions-label');
    if (charEl && input) {
      const len = String(input.value || '').length;
      charEl.textContent = `${len} / 160`;
      charEl.classList.toggle('text-[#F15A29]', len > 140);
    }
    if (!row) return;

    const suggestions = buildIntroSuggestions(p);
    const hasTailored = suggestions.some((s) => s.source === 'profile' || s.source === 'tone' || s.source === 'bio');
    if (label) {
      label.textContent = hasTailored
        ? 'Tailored from your profile · ready options too'
        : 'Ready-to-use intros — no full profile needed';
    }
    const current = String(input?.value || '').trim();
    row.innerHTML = suggestions.map((s) => {
      const active = current && current === s.text ? ' is-active' : '';
      return `<button type="button" class="profile-intro-chip${active}" data-intro-text="${escapeHtml(s.text)}" title="Use this intro">
        <i class="fas fa-magic" aria-hidden="true"></i>
        <span>${escapeHtml(s.text)}</span>
      </button>`;
    }).join('');
  }

  function applyIntroSuggestion(text) {
    const input = document.getElementById('profile-intro');
    if (!input || !text) return;
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    try { input.focus({ preventScroll: true }); } catch (e) { try { input.focus(); } catch (e2) {} }
    refreshIntroHelpers();
    autoSaveProfile();
  }

  function enforceVoiceTraitCap(showHint) {
    const boxes = Array.from(document.querySelectorAll('.profile-voice'));
    const checked = boxes.filter((b) => b.checked);
    const hint = document.getElementById('profile-voice-cap-hint');
    if (checked.length > VOICE_TRAIT_MAX) {
      // Uncheck newest extras (keep first VOICE_TRAIT_MAX in DOM order that are checked)
      checked.slice(VOICE_TRAIT_MAX).forEach((b) => { b.checked = false; });
    }
    const over = boxes.filter((b) => b.checked).length >= VOICE_TRAIT_MAX;
    boxes.forEach((b) => {
      if (!b.checked) b.disabled = over;
    });
    if (hint) {
      hint.classList.toggle('hidden', !(showHint && over));
    }
  }

  function updateHeadshotPreview(url) {
    const img = document.getElementById('profile-headshot-preview');
    const placeholder = document.getElementById('profile-headshot-placeholder');
    if (!img) return;
    const src = String(url || '').trim();
    if (src && /^https?:\/\//i.test(src)) {
      img.src = src;
      img.classList.remove('hidden');
      if (placeholder) placeholder.classList.add('hidden');
      img.onerror = () => {
        img.classList.add('hidden');
        if (placeholder) placeholder.classList.remove('hidden');
      };
    } else {
      img.removeAttribute('src');
      img.classList.add('hidden');
      if (placeholder) placeholder.classList.remove('hidden');
    }
  }

  function backfillBlankProfileFields() {
    try {
      const raw = readRawProfile();
      const needsFocus = !raw.focus || !String(raw.focus).trim();
      if (!needsFocus) return;
      const normalized = normalizeProfile({ ...raw, focus: 'balanced-growth' });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      const oldSetup = JSON.parse(localStorage.getItem('winPlanSetup') || '{}');
      localStorage.setItem('winPlanSetup', JSON.stringify({ ...oldSetup, ...normalized }));
    } catch (e) { /* ignore */ }
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
    const strengthLabel = document.getElementById('profile-strength-label');

    if (scoreEl) scoreEl.textContent = `${score}%`;
    if (barEl) {
      barEl.style.width = `${score}%`;
      barEl.classList.toggle('profile-strength-bar--strong', score >= 70);
      barEl.classList.toggle('profile-strength-bar--mid', score >= 40 && score < 70);
      barEl.classList.toggle('profile-strength-bar--low', score < 40);
    }
    if (strengthLabel) {
      strengthLabel.textContent =
        score >= 90 ? 'Excellent' : score >= 70 ? 'Strong' : score >= 40 ? 'Getting there' : 'Just starting';
    }

    if (hintsEl) {
      if (missing.length) {
        // Top 4 tips always shown; remaining count is informational only (no collapse of sections)
        const shown = missing.slice(0, 4);
        const extra = missing.length - shown.length;
        hintsEl.innerHTML = shown.map((m) => {
          const tab = m.tab || 'identity';
          const focusId = m.focusId || '';
          const tabCue = PROFILE_TAB_HINT_LABELS[tab] || tab.slice(0, 3);
          return `<button type="button" class="profile-strength-hint-btn" data-profile-jump-tab="${escapeHtml(tab)}" data-profile-jump-focus="${escapeHtml(focusId)}" title="Jump to ${escapeHtml(PROFILE_TAB_SHORT_LABELS[tab] || tab)} · ${escapeHtml(m.tools || '')}">
            <span class="profile-strength-hint-tab">${escapeHtml(tabCue)}</span>
            <span>${escapeHtml(m.hint)}</span>
            <span class="profile-strength-hint-tools">${escapeHtml(m.tools)}</span>
          </button>`;
        }).join('') + (extra > 0
          ? `<span class="text-[10px] text-gray-400 self-center pl-0.5">+${extra} more</span>`
          : '');
      } else {
        hintsEl.innerHTML = '<span class="profile-strength-done"><i class="fas fa-check-circle" aria-hidden="true"></i> Profile is strong — every tool can personalize well.</span>';
      }
    }

    updateProfileTabBadges(profile);
    updateLivePreview(profile);
    updateProfileLastUpdated(profile);
    updateHeaderAvatar(profile);
    updateEmptyWelcome(score);
    updateWizardMiniScore(score);
    // Keep intro chips in sync when name/market/years/focus change
    if (isProfileModalOpen()) refreshIntroHelpers(profile);

    updateHeaderProfileBadge(score);

    if (typeof window.refreshCoachOnboarding === 'function') {
      window.refreshCoachOnboarding();
    }
  }

  function updateWizardMiniScore(score) {
    const el = document.getElementById('profile-wizard-mini-score');
    if (!el) return;
    el.textContent = `${score}% complete`;
    el.classList.toggle('text-[#00A89D]', score >= 70);
    el.classList.toggle('text-amber-600', score >= 40 && score < 70);
    el.classList.toggle('text-gray-500', score < 40);
  }

  function jumpToProfileField(tab, focusId) {
    if (wizardActive) {
      // Exit guided mode so full tabs work, then jump
      flushWizardSave();
      localStorage.setItem(WIZARD_DONE_KEY, '1');
      showView('full');
    }
    if (tab) switchProfileTab(tab);
    setTimeout(() => {
      focusFirstEmptyInTab(tab, focusId);
    }, 80);
  }

  function pulseAndFocusField(el) {
    if (!el) return;
    try { el.focus({ preventScroll: true }); } catch (e) { try { el.focus(); } catch (e2) {} }
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    } catch (e) { /* ignore */ }
    // Extra padding so sticky chrome / labels aren't clipped
    try {
      const scroll = document.getElementById('profile-form-scroll');
      if (scroll) {
        const elRect = el.getBoundingClientRect();
        const scRect = scroll.getBoundingClientRect();
        const pad = 28;
        if (elRect.top < scRect.top + pad) {
          scroll.scrollBy({ top: elRect.top - scRect.top - pad, behavior: 'smooth' });
        } else if (elRect.bottom > scRect.bottom - pad) {
          scroll.scrollBy({ top: elRect.bottom - scRect.bottom + pad, behavior: 'smooth' });
        }
      }
    } catch (e) { /* ignore */ }
    el.classList.add('profile-field-pulse');
    setTimeout(() => el.classList.remove('profile-field-pulse'), 1200);
  }

  function focusFirstEmptyInTab(tabId, preferredId) {
    const tryFocus = (id) => {
      if (!id) return false;
      const el = document.getElementById(id);
      if (!el) return false;
      const isEmpty =
        el.type === 'checkbox'
          ? !el.checked
          : !String(el.value || '').trim();
      if (!isEmpty && preferredId && id === preferredId) {
        pulseAndFocusField(el);
        return true;
      }
      if (!isEmpty && id !== preferredId) return false;
      pulseAndFocusField(el);
      return true;
    };

    if (preferredId && tryFocus(preferredId)) return;
    const list = TAB_FOCUS_FIELDS[tabId] || [];
    for (let i = 0; i < list.length; i++) {
      if (tryFocus(list[i])) return;
    }
  }

  /** Format US phone as (xxx) xxx-xxxx while typing */
  function formatPhoneInput(raw) {
    const digits = String(raw || '').replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
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
        () => p.intro,
        () => p.headshotUrl
      ],
      business: [
        () => p.focus,
        () => p.monthlyUnits || p.monthlyGoal,
        () => p.income,
        () => p.databaseSize,
        () => p.hours,
        () => p.challenges.length || p.challengesOther,
        () => p.niches.length || p.nichesOther
      ],
      voice: [
        () => p.tone,
        () => p.contentNotes,
        () => p.voiceTraits.length
      ],
      links: [
        () => p.blogPageUrl,
        () => p.companyWebsite,
        () => p.newsletterColorBundle
      ],
      // legacy key for any old code paths
      content: [
        () => p.tone,
        () => p.blogPageUrl,
        () => p.contentNotes,
        () => p.voiceTraits.length
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
      if (!btn) return;

      const state =
        total > 0 && done >= total ? 'complete'
          : done > 0 ? 'partial'
            : 'empty';

      btn.classList.remove('is-tab-empty', 'is-tab-partial', 'is-tab-complete', 'opacity-60');
      btn.classList.add(`is-tab-${state}`);

      if (badge) {
        if (state === 'complete') {
          badge.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i>';
          badge.title = `${label} complete`;
        } else if (state === 'partial') {
          badge.textContent = label;
          badge.title = `${label} filled`;
        } else {
          badge.textContent = total ? '·' : '';
          badge.title = total ? 'Not started' : '';
        }
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
      if (p.tone) toolChips.push('AI voice');
      if (p.blogPageUrl) toolChips.push('Blog');
      if (p.focus) toolChips.push('Weekly Plan');
      if (p.activities && p.activities.length) toolChips.push('Prospecting');
      toolsEl.innerHTML = [...new Set(toolChips)].slice(0, 4).map((t) =>
        `<span class="text-[10px] px-2 py-0.5 rounded-full bg-[#00A89D]/15 text-[#00A89D] font-semibold">${escapeHtml(t)}</span>`
      ).join('');
    }
  }

  function updateHeaderAvatar(profile) {
    const wrap = document.getElementById('profile-header-avatar');
    const initialsEl = document.getElementById('profile-header-initials');
    const photoEl = document.getElementById('profile-header-photo');
    if (!wrap || !initialsEl) return;
    const p = profile || normalizeProfile(isProfileModalOpen() ? collectProfileFromForm() : readRawProfile());
    const name = String(p.name || '').trim();
    const headshot = String(p.headshotUrl || '').trim();
    const parts = name.split(/\s+/).filter(Boolean);
    const initials = !name
      ? '?'
      : parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.slice(0, 2).toUpperCase();
    initialsEl.textContent = initials;
    wrap.title = name || '';

    const applyPhoto = headshot && /^https?:\/\//i.test(headshot);
    if (photoEl && applyPhoto) {
      photoEl.src = headshot;
      photoEl.alt = name ? `${name} headshot` : 'Headshot';
      wrap.classList.add('has-photo');
      wrap.classList.remove('is-empty');
      photoEl.onerror = () => {
        wrap.classList.remove('has-photo');
        photoEl.removeAttribute('src');
        wrap.classList.toggle('is-empty', !name);
      };
    } else {
      if (photoEl) {
        photoEl.removeAttribute('src');
        photoEl.alt = '';
      }
      wrap.classList.remove('has-photo');
      wrap.classList.toggle('is-empty', !name);
    }
  }

  function updateEmptyWelcome(score) {
    const el = document.getElementById('profile-empty-welcome');
    if (!el) return;
    // Welcome only when essentially blank (intro first open)
    const show = !wizardActive && score < 15;
    el.classList.toggle('is-visible', show);
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

  let currentProfileTab = 'identity';

  function switchProfileTab(tabId) {
    // Migrate old deep-links / partner jumps
    if (tabId === 'content') tabId = 'voice';
    if (!PROFILE_TABS.includes(tabId)) tabId = 'identity';
    currentProfileTab = tabId;
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
        if (active) {
          try { btn.setAttribute('aria-current', 'page'); } catch (e) { /* ignore */ }
        } else {
          btn.removeAttribute('aria-current');
        }
      }
    });
    const scroll = document.getElementById('profile-form-scroll');
    if (scroll) scroll.scrollTop = 0;
    updateProfileSectionNav();
    // Gentle focus for full mode (wizard does its own focus after render)
    if (!wizardActive) {
      setTimeout(() => focusFirstEmptyInTab(tabId), 100);
    }
  }

  /** Footer Back / Next for full-profile mode (tabs alone are easy to miss). */
  function updateProfileSectionNav() {
    const back = document.getElementById('profile-section-back');
    const next = document.getElementById('profile-section-next');
    const hint = document.getElementById('profile-section-nav-hint');
    if (!back && !next) return;

    // Only relevant when full profile chrome is showing (not guided wizard)
    const fullFooter = document.getElementById('profile-full-footer');
    const fullMode = fullFooter && !fullFooter.classList.contains('hidden');
    if (!fullMode) return;

    const idx = Math.max(0, PROFILE_TABS.indexOf(currentProfileTab));
    const isFirst = idx <= 0;
    const isLast = idx >= PROFILE_TABS.length - 1;
    const nextTab = !isLast ? PROFILE_TABS[idx + 1] : null;
    const nextLabel = nextTab ? (PROFILE_TAB_SHORT_LABELS[nextTab] || nextTab) : '';

    if (back) {
      back.classList.toggle('hidden', isFirst);
      back.disabled = isFirst;
    }
    if (next) {
      if (isLast) {
        next.classList.add('hidden');
      } else {
        next.classList.remove('hidden');
        next.innerHTML = `Next: ${nextLabel} <i class="fas fa-arrow-right ml-1 text-xs opacity-90" aria-hidden="true"></i>`;
      }
    }
    if (hint) {
      if (isLast) {
        hint.innerHTML = `Last section — <strong>Save</strong> or <strong>Close</strong> when you’re done, or jump tabs above.`;
      } else {
        hint.innerHTML = `<strong>${idx + 1}/${PROFILE_TABS.length}</strong> · Next is <strong>${nextLabel}</strong>, or jump with the tabs above.`;
      }
    }
  }

  function goProfileSection(delta) {
    const idx = Math.max(0, PROFILE_TABS.indexOf(currentProfileTab));
    const nextIdx = Math.min(PROFILE_TABS.length - 1, Math.max(0, idx + delta));
    if (nextIdx === idx) return;
    // Autosave before leaving a section
    if (typeof autoSaveProfile === 'function') autoSaveProfile();
    else if (typeof performSave === 'function') {
      try { performSave(false, false); } catch (e) { /* ignore */ }
    }
    switchProfileTab(PROFILE_TABS[nextIdx]);
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

  function applyRuoffBlogPreset() {
    const name = document.getElementById('profile-name')?.value.trim() || '';
    const slug = slugifyBlogName(name);
    const el = document.getElementById('profile-blog-url');
    if (!el) return;
    if (!slug) {
      if (typeof window.showToast === 'function') window.showToast('Add your name first — we use it for your column URL.', 'info');
      return;
    }
    el.value = `https://mortgage-column.ruoff.com/${slug}`;
    autoSaveProfile();
    if (typeof window.showToast === 'function') window.showToast('Ruoff Mortgage Column URL applied — adjust if your slug differs.', 'success');
  }

  /** https://www.ruoff.com/adamgarman from Full Name */
  function applyRuoffWebsitePreset() {
    const name = document.getElementById('profile-name')?.value.trim() || '';
    const slug = slugifyBlogName(name);
    const el = document.getElementById('profile-company-website');
    if (!el) return;
    if (!slug) {
      if (typeof window.showToast === 'function') {
        window.showToast('Add your full name on Identity first — we use it for www.ruoff.com/yourname.', 'info');
      }
      return;
    }
    el.value = `https://www.ruoff.com/${slug}`;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    autoSaveProfile();
    if (typeof window.showToast === 'function') {
      window.showToast(`Website set to www.ruoff.com/${slug} — edit if your slug differs.`, 'success');
    }
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
    const tabNav = document.getElementById('profile-tab-nav');
    const modalEl = modal || document.getElementById('user-profile-modal');
    const modalTitle = document.getElementById('profile-modal-title');

    wizardActive = view === 'wizard';
    if (modalEl) modalEl.classList.toggle('profile-modal--wizard', wizardActive);

    if (wizardHeader) wizardHeader.classList.toggle('hidden', !wizardActive);
    if (wizardFooter) {
      wizardFooter.classList.toggle('hidden', !wizardActive);
      // Belt-and-suspenders: inline style wins if a utility class is overridden
      wizardFooter.style.display = wizardActive ? '' : 'none';
    }
    // Guided mode: hide strength meter, live preview, tab strip, AND full footer
    // (full footer must not show under wizard nav — was duplicating buttons).
    if (fullChrome) fullChrome.classList.toggle('hidden', wizardActive);
    if (tabNav) tabNav.classList.toggle('hidden', wizardActive);
    if (fullFooter) {
      fullFooter.classList.toggle('hidden', wizardActive);
      fullFooter.style.display = wizardActive ? 'none' : '';
    }
    if (full) full.classList.remove('hidden');

    if (modalTitle) {
      modalTitle.textContent = wizardActive
        ? 'Guided setup'
        : 'My Profile';
    }
    const modalSubtitle = document.getElementById('profile-modal-subtitle');
    if (modalSubtitle) {
      modalSubtitle.textContent = wizardActive
        ? 'Six short steps — skip anytime and finish later in full profile.'
        : 'One profile powers every tool — fill it once, sound like you everywhere.';
    }

    const scroll = document.getElementById('profile-form-scroll');
    if (scroll) scroll.scrollTop = 0;

    if (!wizardActive) updateProfileSectionNav();
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

    const pct = Math.round((wizardStep / total) * 100);
    const bar = document.getElementById('profile-wizard-progress-bar');
    if (bar) bar.style.width = `${pct}%`;

    const dots = document.getElementById('profile-wizard-dots');
    if (dots) {
      dots.innerHTML = PROFILE_TABS.map((tab, idx) => {
        const stepNum = idx + 1;
        const state =
          stepNum === wizardStep ? 'is-current' : stepNum < wizardStep ? 'is-done' : 'is-todo';
        const label = PROFILE_TAB_SHORT_LABELS[tab] || tab;
        return `<button type="button" class="profile-wizard-step-dot ${state}" data-wizard-goto="${stepNum}" title="${escapeHtml(label)}" aria-label="Go to ${escapeHtml(label)}" aria-current="${stepNum === wizardStep ? 'step' : 'false'}">
          <span class="profile-wizard-step-num">${stepNum < wizardStep ? '<i class="fas fa-check" aria-hidden="true"></i>' : stepNum}</span>
          <span class="profile-wizard-step-label">${escapeHtml(label)}</span>
        </button>`;
      }).join('');
      dots.querySelectorAll('[data-wizard-goto]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const n = parseInt(btn.getAttribute('data-wizard-goto'), 10);
          if (!Number.isFinite(n) || n < 1 || n > total) return;
          flushWizardSave();
          wizardStep = n;
          renderWizardStep();
        });
      });
    }

    const back = document.getElementById('profile-wizard-back');
    const next = document.getElementById('profile-wizard-next');
    if (back) back.classList.toggle('hidden', wizardStep === 1);
    if (next) {
      if (wizardStep === total) {
        next.innerHTML = '<i class="fas fa-check mr-1.5" aria-hidden="true"></i> Save &amp; finish';
      } else {
        const nextTab = PROFILE_TABS[wizardStep];
        const nextLabel = PROFILE_TAB_SHORT_LABELS[nextTab] || WIZARD_STEP_LABELS[nextTab] || 'next section';
        next.innerHTML = `Continue to ${nextLabel} <i class="fas fa-arrow-right ml-1.5 text-xs opacity-90" aria-hidden="true"></i>`;
      }
    }

    refreshProfileUI();
    setTimeout(() => focusFirstEmptyInTab(tabId), 120);
  }

  function finishWizard() {
    // Complete guided setup → save and close (don't dump them into full profile editor)
    flushWizardSave();
    localStorage.setItem(WIZARD_DONE_KEY, '1');
    const merged = normalizeProfile(collectProfileFromForm());
    const oldSetup = JSON.parse(localStorage.getItem('winPlanSetup') || '{}');
    localStorage.setItem('winPlanSetup', JSON.stringify({ ...oldSetup, ...merged }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    notifyProfileConsumers(merged);
    refreshProfileUI();
    wizardActive = false;
    const modalEl = modal || document.getElementById('user-profile-modal');
    if (modalEl) modalEl.classList.remove('profile-modal--wizard');
    closeModal();
    if (typeof window.showToast === 'function') {
      window.showToast('Profile setup complete — open My Profile anytime to edit or re-run Guided setup.', 'success');
    }
  }

  function startProfileWizard(step) {
    loadProfileIntoForm();
    wizardStep = step || 1;
    showView('wizard');
    renderWizardStep();
  }

  function openModal(forceFull) {
    modal = document.getElementById('user-profile-modal');
    if (!modal) return;

    startProfileKeyboardInset();

    if (typeof window.openAppModal === 'function') {
      window.openAppModal(modal);
    } else {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      modal.style.display = 'flex';
      if (typeof window.resetModalScroll === 'function') window.resetModalScroll(modal);
    }

    loadProfileIntoForm();
    refreshProfileAccountBar();
    bindProfileSignOut();

    // Incomplete profiles open Guided setup (distinct step-by-step UI).
    // forceFull (partner share, deep links, explicit full edit) always uses tabs.
    if (!forceFull && shouldShowWizard()) {
      startProfileWizard(1);
      return;
    }

    showView('full');
    // Always open on Identity (first tab) — not the first incomplete section
    // (which was sending people straight to Voice/Links when earlier tabs were done).
    switchProfileTab('identity');
    updateProfileSectionNav();
  }

  function closeModal() {
    if (!modal) modal = document.getElementById('user-profile-modal');
    if (!modal) return;
    flushWizardSave();
    stopProfileKeyboardInset();
    if (typeof window.closeAppModal === 'function') {
      window.closeAppModal(modal);
    } else {
      if (typeof window.resetModalScroll === 'function') window.resetModalScroll(modal);
      modal.classList.remove('flex');
      modal.classList.add('hidden');
    }

    notifyProfileConsumers();
  }

  /**
   * iOS/Android soft keyboard: lift sticky profile footers so Save/Next stay visible.
   * Uses visualViewport when available; no-op on desktop. Does not change desktop layout.
   */
  let profileKeyboardBound = false;
  function updateProfileKeyboardInset() {
    const m = document.getElementById('user-profile-modal');
    if (!m || m.classList.contains('hidden')) return;
    const vv = window.visualViewport;
    if (!vv) {
      m.style.setProperty('--profile-keyboard-inset', '0px');
      return;
    }
    // Amount of layout viewport covered by keyboard (or browser chrome shrink)
    const covered = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    // Ignore tiny noise; only apply meaningful keyboard inset
    const inset = covered > 48 ? Math.round(covered) : 0;
    m.style.setProperty('--profile-keyboard-inset', inset + 'px');
  }
  function startProfileKeyboardInset() {
    if (profileKeyboardBound) {
      updateProfileKeyboardInset();
      return;
    }
    profileKeyboardBound = true;
    const onChange = () => updateProfileKeyboardInset();
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', onChange);
      window.visualViewport.addEventListener('scroll', onChange);
    }
    window.addEventListener('resize', onChange);
    // Focused fields often open the keyboard a beat later
    document.getElementById('user-profile-modal')?.addEventListener('focusin', onChange);
    updateProfileKeyboardInset();
  }
  function stopProfileKeyboardInset() {
    const m = document.getElementById('user-profile-modal');
    if (m) m.style.setProperty('--profile-keyboard-inset', '0px');
  }

  let saveStatusResetTimer = null;

  function flashSaveStatus(mode) {
    const statusEl = document.getElementById('profile-save-status');
    if (!statusEl) return;
    clearTimeout(saveStatusResetTimer);
    if (mode === 'saving') {
      statusEl.classList.remove('is-flash');
      statusEl.innerHTML = '<i class="fas fa-circle-notch fa-spin text-[#00A89D]" aria-hidden="true"></i> <span>Saving…</span>';
      return;
    }
    statusEl.classList.add('is-flash');
    statusEl.innerHTML = '<i class="fas fa-check text-[#00A89D]" aria-hidden="true"></i> <span>Saved · just now</span>';
    saveStatusResetTimer = setTimeout(() => {
      statusEl.classList.remove('is-flash');
      statusEl.innerHTML = '<i class="fas fa-check text-[#00A89D]" aria-hidden="true"></i> <span>Auto-saved</span>';
    }, 2200);
  }

  function autoSaveProfile() {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      if (!isProfileModalOpen()) return;
      flashSaveStatus('saving');
      performSave(false, false);
      flashSaveStatus('saved');
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
        // Voice fine-tunes: no "select all" (cap is 3)
        if (targetSelector === '.profile-voice') return;
        if (targetSelector) {
          modal.querySelectorAll(targetSelector).forEach((cb) => { cb.checked = master.checked; });
          autoSaveProfile();
        }
      }
      const t = e.target;
      if (t.matches && t.matches('input[type="checkbox"].profile-voice')) {
        // Cap at VOICE_TRAIT_MAX — if user just checked a 4th, undo it
        const checked = Array.from(document.querySelectorAll('.profile-voice:checked'));
        if (t.checked && checked.length > VOICE_TRAIT_MAX) {
          t.checked = false;
          const hint = document.getElementById('profile-voice-cap-hint');
          if (hint) {
            hint.classList.remove('hidden');
            setTimeout(() => hint.classList.add('hidden'), 2800);
          }
        }
        enforceVoiceTraitCap(true);
        autoSaveProfile();
        return;
      }
      if (t.matches('input[type="checkbox"].profile-hobby, input[type="checkbox"].profile-activity, input[type="checkbox"].profile-partner, input[type="checkbox"].profile-niche, input[type="checkbox"].profile-challenge')) {
        syncSelectAllStates();
      }
    });
  }

  function setupProfileTabHandlers() {
    document.querySelectorAll('.profile-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-profile-tab');
        if (!tab) return;
        if (wizardActive) {
          const idx = PROFILE_TABS.indexOf(tab);
          if (idx >= 0) {
            wizardStep = idx + 1;
            flushWizardSave();
            renderWizardStep();
            return;
          }
        }
        switchProfileTab(tab);
      });
    });

    document.getElementById('profile-section-next')?.addEventListener('click', () => {
      goProfileSection(1);
    });
    document.getElementById('profile-section-back')?.addEventListener('click', () => {
      goProfileSection(-1);
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
      // Soft-complete guided setup so reopen goes to full profile (user chose to exit)
      try { localStorage.setItem(WIZARD_DONE_KEY, '1'); } catch (e) { /* ignore */ }
      wizardActive = false;
      const modalEl = modal || document.getElementById('user-profile-modal');
      if (modalEl) modalEl.classList.remove('profile-modal--wizard');
      performSave(true, true);
    });

    document.getElementById('profile-open-wizard')?.addEventListener('click', () => {
      startProfileWizard(1);
    });

    document.getElementById('profile-export-data')?.addEventListener('click', () => {
      if (typeof window.exportCoachDataPack === 'function') window.exportCoachDataPack();
    });
    document.getElementById('profile-import-data')?.addEventListener('click', () => {
      document.getElementById('profile-import-file')?.click();
    });
    document.getElementById('profile-import-file')?.addEventListener('change', (e) => {
      const file = e.target?.files?.[0];
      if (file && typeof window.importCoachDataPack === 'function') {
        window.importCoachDataPack(file).finally(() => {
          e.target.value = '';
        });
      }
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
    // Close button intentionally saves+closes like Save — no accidental dismiss via backdrop
    document.getElementById('cancel-profile')?.addEventListener('click', () => {
      performSave(false, true);
    });

    // Profile must NOT close on outside click — only × / Save / Close.
    // Mark + skip ensureModalBackdropClose (ui.js also respects data-no-backdrop-close).
    try {
      modal.setAttribute('data-no-backdrop-close', '1');
      modal._backdropHandlerAttached = true;
    } catch (e) { /* ignore */ }

    document.getElementById('save-profile')?.addEventListener('click', () => performSave(true, true));

    modal.addEventListener('input', (e) => {
      if (e.target?.id === 'profile-years') {
        updateExperienceYearsHint(e.target, document.getElementById('profile-years-hint'));
      }
      if (e.target?.id === 'profile-monthly-units') {
        updateAnnualUnitsHint(e.target);
      }
      if (e.target?.id === 'profile-headshot-url') {
        updateHeadshotPreview(e.target.value);
      }
      if (e.target?.id === 'profile-intro' || e.target?.id === 'profile-name' || e.target?.id === 'profile-location') {
        refreshIntroHelpers();
      }
      if (e.target?.id === 'profile-phone') {
        const formatted = formatPhoneInput(e.target.value);
        if (formatted !== e.target.value) {
          const pos = e.target.selectionStart;
          e.target.value = formatted;
          try {
            // Keep cursor near end for natural typing
            e.target.setSelectionRange(formatted.length, formatted.length);
          } catch (err) { /* ignore */ }
          void pos;
        }
      }
      autoSaveProfile();
    });
    modal.addEventListener('change', (e) => {
      if (e.target?.id === 'profile-focus' || e.target?.id === 'profile-tone' || e.target?.id === 'profile-years') {
        refreshIntroHelpers();
      }
      autoSaveProfile();
    });
    setupSelectAllToggles();
    setupWizardHandlers();
    setupProfileTabHandlers();

    // Clickable strength hints → jump to field
    document.getElementById('profile-strength-hints')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-profile-jump-tab]');
      if (!btn) return;
      jumpToProfileField(
        btn.getAttribute('data-profile-jump-tab'),
        btn.getAttribute('data-profile-jump-focus') || ''
      );
    });

    // Intro suggestion chips
    document.getElementById('profile-intro-chip-row')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-intro-text]');
      if (!btn) return;
      applyIntroSuggestion(btn.getAttribute('data-intro-text') || '');
    });

    document.getElementById('profile-ruoff-blog-preset')?.addEventListener('click', applyRuoffBlogPreset);
    document.getElementById('profile-ruoff-website-preset')?.addEventListener('click', applyRuoffWebsitePreset);

    document.addEventListener('keydown', (e) => {
      // Escape does not close profile (prevents accidental loss while editing)
      if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) e.preventDefault();
    });

    loadProfileIntoForm();
    refreshProfileUI();

    console.log('%c[user-profile] Initialized — polished guided setup + jump hints', 'color:#00A89D');
  }

  window.getUserProfile = function getUserProfile() {
    return normalizeProfile(readRawProfile());
  };

  window.patchUserProfile = patchUserProfile;

  window.getProfileCompleteness = getProfileCompleteness;
  window.buildProfileAiContext = buildAiContext;
  window.buildProfilePreviewText = buildPreviewText;
  window.buildProfilePreviewHtml = buildPreviewHtml;
  window.normalizeUserProfile = normalizeProfile;
  window.resolveExperienceYears = resolveExperienceYears;
  window.formatExperienceYearsDisplay = formatExperienceYearsDisplay;

  function refreshProfileAccountBar() {
    const bar = document.getElementById('profile-account-bar');
    if (!bar) return;
    const authUser =
      (typeof window.loAuth === 'object' && window.loAuth.getUser && window.loAuth.getUser()) ||
      window.__loUser ||
      null;
    if (!authUser || !authUser.email) {
      bar.classList.add('hidden');
      return;
    }
    bar.classList.remove('hidden');
    const nameEl = document.getElementById('profile-account-name');
    const emailEl = document.getElementById('profile-account-email');
    if (nameEl) nameEl.textContent = authUser.name || 'Signed in';
    if (emailEl) emailEl.textContent = authUser.email || '';
  }

  function bindProfileSignOut() {
    const btn = document.getElementById('profile-sign-out-btn');
    if (!btn || btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', async () => {
      if (!confirm('Sign out of Loan Officer Sales Coach on this device?')) return;
      try {
        if (window.loAuth && typeof window.loAuth.logout === 'function') {
          await window.loAuth.logout();
        } else {
          await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
          location.reload();
        }
      } catch (e) {
        location.reload();
      }
      closeModal();
    });
  }

  window.openUserProfile = function openUserProfile(forceFull) {
    openModal(!!forceFull);
    refreshProfileAccountBar();
    bindProfileSignOut();
  };

  window.closeUserProfile = function closeUserProfile() {
    closeModal();
  };

  window.refreshProfileAccountBar = refreshProfileAccountBar;

  document.addEventListener('lo-auth-ready', () => {
    refreshProfileAccountBar();
    bindProfileSignOut();
  });

  window.applyRuoffBlogPreset = applyRuoffBlogPreset;
  window.applyRuoffWebsitePreset = applyRuoffWebsitePreset;
  window.switchProfileTab = switchProfileTab;
  window.refreshProfileUI = refreshProfileUI;
  window.startProfileWizard = startProfileWizard;

  // --- Export / import coach data pack (profile + plans + key content drafts) ---
  const EXPORT_KEYS = [
    'userProfile',
    'winPlanSetup',
    'savedBusinessPlan',
    'lo_savedBusinessPlanContext',
    'lo_savedBusinessPlanMarkdown',
    'savedWeeklyPlan',
    'weeklyCheckedTasks',
    'winPlanStreak',
    'aiChatHistory',
    'lastNewsletterHTML',
    'lastBlogOutput',
    'lastSocialPlanHTML',
    'lastSocialPlanMonth',
    'lastSocialPlanYear',
    'socialSavedIdeas'
  ];

  function exportCoachDataPack() {
    const pack = {
      app: 'LoanOfficerSalesCoach',
      version: window.APP_VERSION || 'unknown',
      exportedAt: new Date().toISOString(),
      data: {}
    };
    EXPORT_KEYS.forEach((key) => {
      try {
        const val = localStorage.getItem(key);
        if (val != null && val !== '') pack.data[key] = val;
      } catch (e) {}
    });
    const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lo-sales-coach-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    if (typeof window.showToast === 'function') {
      window.showToast('Backup downloaded — profile, plans, and key drafts included.');
    }
  }

  async function importCoachDataPack(file) {
    if (!file) return;
    const text = await file.text();
    let pack;
    try {
      pack = JSON.parse(text);
    } catch (e) {
      if (typeof window.showToast === 'function') window.showToast('Invalid backup file (not JSON).');
      else alert('Invalid backup file (not JSON).');
      return;
    }
    const data = pack && pack.data && typeof pack.data === 'object' ? pack.data : pack;
    if (!data || typeof data !== 'object') {
      if (typeof window.showToast === 'function') window.showToast('Backup file has no data.');
      return;
    }
    let count = 0;
    EXPORT_KEYS.forEach((key) => {
      if (data[key] != null && data[key] !== '') {
        try {
          localStorage.setItem(key, typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]));
          count += 1;
        } catch (e) {}
      }
    });
    // Prefer normalized profile if present
    try {
      if (data.userProfile) {
        const raw = typeof data.userProfile === 'string' ? JSON.parse(data.userProfile) : data.userProfile;
        persistProfile(raw, false, false);
      }
    } catch (e) {}
    refreshProfileUI();
    if (typeof window.restoreSavedBusinessPlan === 'function') {
      try { window.restoreSavedBusinessPlan(); } catch (e) {}
    }
    if (typeof window.showToast === 'function') {
      window.showToast(`Imported ${count} data key(s). Refresh if a tool looks stale.`);
    } else {
      alert(`Imported ${count} data key(s).`);
    }
  }

  window.exportCoachDataPack = exportCoachDataPack;
  window.importCoachDataPack = importCoachDataPack;

  // Paint header badge immediately from localStorage (no modal DOM required)
  paintHeaderProfileBadge();

  function bootProfileModal() {
    backfillBlankProfileFields();
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