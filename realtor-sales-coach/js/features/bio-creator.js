/**
 * js/features/bio-creator.js — Bio Builder (LO Sales Coach)
 * Profile-powered bios with guided coaching, platform limits, and profile persistence.
 */
(function () {
  'use strict';

  const HISTORY_MAX = 8;
  const MIN_ESSENTIALS = 4;

  const SERVICE_CHIPS = [
    'Always responsive — same-day replies',
    'Patient educator — explains every step',
    'Calm under pressure',
    'Proactive communicator',
    'Detail-oriented & thorough',
    'Creative problem solver',
    'Relationship-first (not transactional)',
    'White-glove, high-touch experience'
  ];

  const WHO_HELP_CHIPS = [
    'First-time homebuyers',
    'Move-up buyers',
    'Refinance & equity',
    'Veterans (VA)',
    'Self-employed / 1099',
    'Investors',
    'Down payment assistance',
    'Credit-challenged buyers'
  ];

  const PERSONAL_LIFE_CHIPS = [
    'Family-oriented',
    'Pet parent',
    'Sports fan',
    'Outdoors / fitness',
    'Faith & community',
    'Foodie / cooking',
    'Travel lover',
    'Volunteer / giving back',
    'Local roots — born & raised'
  ];

  const DIFF_CHIPS = [
    'Fast, clear showings and negotiations',
    'Deep local market knowledge',
    'Exceptional communication',
    'Creative financing solutions',
    'Smooth closings for agents',
    'Educational, low-pressure style',
    'Available when clients need me',
    'Strong post-close support'
  ];

  const REFINE_CHIPS = [
    'Fill to the character limit — use nearly every allowed character',
    'Make it warmer and more personal',
    'Make it shorter — cut filler',
    'Sound more professional',
    'Add more local market flavor',
    'Emphasize communication & responsiveness',
    'Lead with what agents love about me'
  ];

  const FIELD_CHECKS = [
    { key: 'lovesMost', field: 'loves-most', label: 'Your why', essential: true,
      test: (d) => (d.lovesMost || '').length >= 40 },
    { key: 'service', field: 'service', label: 'Service style', essential: true,
      test: (d) => d.serviceApproach.length > 0 || (d.serviceApproachNotes || '').length >= 20 },
    { key: 'who', field: 'who', label: 'Who you help', essential: true,
      test: (d) => d.whoYouHelp.length > 0 || (d.whoYouHelpNotes || '').length >= 15 },
    { key: 'diff', field: 'diff', label: 'Differentiator', essential: true,
      test: (d) => d.differentiators.length > 0 || (d.differentiatorsNotes || '').length >= 15 },
    { key: 'years', field: 'years', label: 'Experience', essential: true,
      test: (d) => !!(d.yearsConfirm || '').trim() },
    { key: 'personal', field: 'personal', label: 'Life outside work', essential: false,
      test: (d) => (d.personalLifeChips || []).length > 0 || !!(d.familyLife || d.hobbies || d.pets || d.communityPersonal || '').trim() },
    { key: 'family', field: 'family', label: 'Family', essential: false,
      test: (d) => !!(d.familyLife || '').trim() },
    { key: 'hobbies', field: 'hobbies', label: 'Hobbies', essential: false,
      test: (d) => !!(d.hobbies || '').trim() },
    { key: 'pets', field: 'pets', label: 'Pets', essential: false,
      test: (d) => !!(d.pets || '').trim() },
    { key: 'community', field: 'community', label: 'Community', essential: false,
      test: (d) => !!(d.communityPersonal || '').trim() },
    { key: 'additional', field: 'additional', label: 'Extras', essential: false,
      test: (d) => !!(d.additionalNotes || '').trim() }
  ];

  const STARTERS = {
    'loves-most': [
      { label: 'First-time buyer win', text: 'I love the moment a nervous first-time buyer realizes buyers and sellership is actually possible — especially when we map out a clear path instead of overwhelming them with jargon.' },
      { label: 'Clarity & education', text: 'What I love most is turning a confusing process into calm, step-by-step clarity — so families feel confident instead of anxious about the biggest purchase of their lives.' },
      { label: 'Life-changing milestone', text: 'Helping someone go from "I didn\'t think we could afford this" to holding their keys at closing never gets old. That transformation is why I do this work.' }
    ],
    service: [
      { label: 'Family-first', text: 'I treat every file like my own family is buying the house — proactive updates, no surprises, and someone who actually answers the phone.' },
      { label: 'Educator style', text: 'My clients describe me as patient and thorough. I explain the why behind every step so they never feel left in the dark.' }
    ],
    who: [
      { label: 'First-time focus', text: 'First-time buyers and young families in [your market] who want a guide, not a salesperson — especially when timelines feel tight.' },
      { label: 'Move-up families', text: 'Busy move-up families juggling kids, work, and a tight closing window — they need speed and clarity without chaos.' }
    ],
    diff: [
      { label: 'Agent favorite', text: 'Other agents and lenders refer me because I communicate early and often, protect their reputation at the closing table, and never go silent when things get complicated.' },
      { label: 'Speed + clarity', text: 'Fast, accurate showings and negotiations paired with plain-English explanations — clients know exactly where they stand and what happens next.' }
    ],
    family: [
      { label: 'Proud parent', text: "Proud parent of two — most weekends you'll find us at youth sports or exploring [your market] together." },
      { label: 'Family-first', text: "Family-first at home and at work — I understand the stakes when you're buying the place where your kids will grow up." }
    ],
    hobbies: [
      { label: 'Golf & outdoors', text: "When I'm not closing homes, I'm usually on the golf course or hiking trails around [your market]." },
      { label: 'Food & community', text: 'Passionate home cook and loyal supporter of local restaurants — I know this community plate by plate.' }
    ],
    pets: [
      { label: 'Dog parent', text: 'Golden retriever named Cooper — unofficial office morale officer.' },
      { label: 'Cat person', text: 'Proud cat dad to Luna, who supervises my email responses from the home office.' }
    ],
    community: [
      { label: 'Local roots', text: 'Born and raised in [your city], active in local schools/churches, and deeply invested in this community beyond just transactions.' },
      { label: 'Volunteer', text: 'Regular volunteer at our local food bank and youth mentoring programs — this community gave me my start.' }
    ],
    additional: [
      { label: 'License line', text: 'License #______ | [Languages spoken] | [Designations, e.g. CMB, CPA partner network]' }
    ]
  };

  const DESTINATIONS = {
    'google-gbp': {
      label: 'Google Business Profile',
      short: 'Google',
      icon: 'fa-google',
      limitType: 'chars',
      limit: 750,
      targetMinPct: 92,
      hint: 'High-impact local SEO. Use 93–98% of the full 750 characters — empty space wastes ranking opportunity. Lead with who you help + market, then depth on your approach, differentiator, and a soft CTA.',
      structure: 'First-person throughout. Two short paragraphs, 6–8 substantive sentences (~700–730 characters). First ~160 characters = hook with market + who you help (critical for Google snippets). Second paragraph: experience, service style, a concrete human detail from story inputs, local/community tie-in, soft CTA. No bullets. Do not stop until you are within ~15 characters of the limit.',
      pasteTip: 'Google Business Profile → Edit profile → Business description'
    },
    'experience-com': {
      label: 'Experience.com',
      short: 'Experience.com',
      icon: 'fa-star',
      limitType: 'words',
      limit: 200,
      hint: 'Credibility + reviews ecosystem. Professional, trustworthy, specific — built for search and AI discovery.',
      structure: 'First-person throughout. 2–3 short paragraphs. Open with expertise + market. Middle = client experience promise. Close with invitation to connect.',
      pasteTip: 'Experience.com dashboard → Profile → About / Bio section'
    },
    'company-page': {
      label: 'Company / Team Page',
      short: 'Team Page',
      icon: 'fa-building',
      limitType: 'words',
      limit: 250,
      hint: 'Polished but human. Visitors should feel they know you before the first call.',
      structure: 'Warm first-person only. Experience, specialty, service philosophy, local connection.',
      pasteTip: 'Your company team page admin or marketing contact'
    },
    'zillow': {
      label: 'Zillow Agent Profile',
      short: 'Zillow',
      icon: 'fa-home',
      limitType: 'chars',
      limit: 2000,
      hint: 'Consumer-facing. Explain how you make buying less stressful and why local buyers trust you.',
      structure: 'Friendly first-person. Who you help, how you communicate, local expertise, what clients can expect.',
      pasteTip: 'Zillow Premier Agent → Profile → About Me'
    },
    'linkedin': {
      label: 'LinkedIn About',
      short: 'LinkedIn',
      icon: 'fa-linkedin',
      limitType: 'chars',
      limit: 2600,
      hint: 'Scannable paragraphs. First-person. Mix professional credibility with approachable personality.',
      structure: 'Hook line → who you serve → how you work → proof/credibility → soft CTA. Use line breaks between ideas.',
      pasteTip: 'LinkedIn → Profile → About → Edit'
    },
    'website-about': {
      label: 'Company Website',
      short: 'Website',
      icon: 'fa-globe',
      limitType: 'chars',
      limit: 750,
      targetMinPct: 92,
      hint: 'Company team page standard — uniform 750-character bios across the site. Use 93–98% of the limit. Lead with who you help + market, then approach and differentiator.',
      structure: 'First-person throughout. Two tight paragraphs (~700–730 characters). Hook with who you help + market → experience + service style → one human detail → soft CTA. Match company tone: professional, warm, consistent. Stop only when within ~15 characters of the 750 limit.',
      pasteTip: 'Company website team page bio field'
    },
    'realtor-partner': {
      label: 'Co-broke / Partner Intro',
      short: 'Realtor Intro',
      icon: 'fa-handshake',
      limitType: 'words',
      limit: 150,
      hint: 'Written for agents. Emphasize communication, clean files, on-time closings, and protecting their reputation.',
      structure: 'First-person, partner-first tone. What other agents and lenders experience working with you. Specific reliability promises.',
      pasteTip: 'Partner emails, referral one-pagers, or agent onboarding packets'
    },
    custom: {
      label: 'Custom Length',
      short: 'Custom',
      icon: 'fa-sliders-h',
      limitType: 'custom',
      limit: null,
      hint: 'Set your own limit for any platform not listed.',
      structure: 'Match the platform you have in mind — concise for directories, warmer for websites.',
      pasteTip: 'Any profile field with a character or word cap'
    }
  };

  const DESTINATION_ORDER = [
    'website-about',
    'google-gbp',
    'company-page',
    'experience-com',
    'zillow',
    'linkedin',
    'realtor-partner',
    'custom'
  ];

  const FIRST_PERSON_RULE = `FIRST-PERSON VOICE (mandatory — never violate):
- Write ENTIRELY in first person as the real estate agent speaking directly to the reader.
- Use I, me, my, mine — NEVER he, she, him, her, his, hers, or "[Name] is/has/specializes..."
- When rewriting an existing third-person bio, convert every sentence to first person.
- Referring to clients as they/their/them is fine; only the real estate agent must never be described in third person.`;

  const REGENERATE_PROMPT =
    'Write a fresh alternative version of this bio in first person (I/me/my — never he/she). Use different wording and sentence structure while keeping the same facts and destination. Hit the TARGET length range — use nearly the full character/word limit, not a short stub. Do not reuse phrases from the previous version.';

  let lastGeneratedText = '';
  let autoSaveTimer = null;
  let bioGenerating = false;
  let bioSessionReady = false;
  let bioTipInterval = null;
  let bioStepInterval = null;
  let bioElapsedInterval = null;
  let bioWatchdogTimer = null;
  let bioAbortController = null;
  let bioUserCancelled = false;
  let bioLoadingStartedAt = 0;
  const BIO_API_TIMEOUT_MS = 65000;
  const BIO_WATCHDOG_MS = 70000;

  const BIO_LOADING_TIPS = [
    { icon: 'fa-search', color: '#00A89D', title: 'SEO + AI visibility', text: 'Bios with your city, client specialty, and a specific "why" help Google and AI assistants recommend you over generic competitors.' },
    { icon: 'fa-heart', color: '#F15A29', title: 'Specific beats generic', text: 'One real detail — a client moment, agent feedback, or community tie-in — is worth more than ten adjectives like "passionate" or "dedicated."' },
    { icon: 'fa-paste', color: '#002B5C', title: 'Paste once, use everywhere', text: 'After you save a Primary Bio, Newsletter, Blog, Social, and AI Coach all speak in the same authentic voice.' },
    { icon: 'fa-star', color: '#F15A29', title: 'Experience.com angle', text: 'Review ecosystems reward bios that sound credible and human — not like they were copied from a template.' },
    { icon: 'fa-handshake', color: '#00A89D', title: 'Realtor magnet', text: 'Agents skim for communication and reliability. If your bio answers "Will this LO go silent at the worst moment?" — you win.' },
    { icon: 'fa-lightbulb', color: '#002B5C', title: 'Company standard', text: 'Paste your long bio at the top — we\'ll tighten it to 750 characters for the company website. Then adapt for Google, Zillow, or LinkedIn.' }
  ];

  const BIO_LOADING_STEPS = [
    'Reading your profile & story inputs',
    'Matching platform structure & limits',
    'Weaving in local market keywords',
    'Shaping your voice — not corporate fluff',
    'Final polish & length check'
  ];

  function getCentralProfile() {
    try {
      if (window.getUserProfile) return window.getUserProfile();
      return JSON.parse(localStorage.getItem('userProfile') || '{}');
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

  function countWords(text) {
    return (text || '').trim().split(/\s+/).filter(Boolean).length;
  }

  function countChars(text) {
    return (text || '').length;
  }

  function getSelectedDestination() {
    const sel = document.getElementById('bio-destination');
    const key = sel?.value || 'website-about';
    const base = DESTINATIONS[key] || DESTINATIONS['website-about'];
    if (key !== 'custom') return { key, ...base };

    const typeEl = document.getElementById('bio-custom-limit-type');
    const valEl = document.getElementById('bio-custom-limit-value');
    const limitType = typeEl?.value === 'words' ? 'words' : 'chars';
    const limit = Math.max(50, parseInt(valEl?.value, 10) || 750);
    return { key, label: 'Custom', short: 'Custom', limitType, limit, hint: base.hint, structure: base.structure, pasteTip: base.pasteTip };
  }

  function getLimitLabel(dest) {
    if (dest.limitType === 'words') return `${dest.limit} words`;
    return `${dest.limit} characters`;
  }

  function getLengthTargets(dest) {
    const max = dest.limit;
    const unit = dest.limitType === 'words' ? 'words' : 'characters';
    const minPct = dest.targetMinPct ?? (dest.limitType === 'chars' ? 90 : 85);
    const targetMin = Math.round(max * (minPct / 100));
    const targetIdeal = Math.round(max * 0.96);
    const targetMax = dest.limitType === 'chars' ? Math.max(targetMin, max - 5) : Math.max(targetMin, max - 2);
    return { unit, max, targetMin, targetIdeal, targetMax };
  }

  function bioNeedsLengthBoost(measure, targets, dest) {
    if (measure.over) return false;
    if (measure.current < targets.targetIdeal) return true;
    if (dest.limitType === 'chars') {
      return measure.current < targets.targetMax;
    }
    return measure.current < targets.targetMax;
  }

  function buildLengthBoostPrompt(dest, measure, goal) {
    const targets = getLengthTargets(dest);
    const gap = Math.max(0, goal - measure.current);
    return `CRITICAL LENGTH: Bio is only ${measure.current} ${targets.unit} — ${gap} ${targets.unit} below goal. Expand to ${goal} ${targets.unit} (hard max ${targets.max}). Use nearly the FULL limit — unused space hurts SEO and looks incomplete. Add substantive detail from story inputs: who you help, service approach, differentiator, local market, community. Stay in first person (I/me/my). No filler or repetition.`;
  }

  function buildLengthInstruction(dest) {
    const { unit, max, targetMin, targetIdeal, targetMax } = getLengthTargets(dest);
    return `LENGTH (critical — follow exactly):
- HARD MAXIMUM: ${max} ${unit} including spaces. Never exceed.
- TARGET RANGE: ${targetIdeal}–${targetMax} ${unit}. Ideal landing spot: ~${targetMax} ${unit} (use nearly every allowed ${unit.slice(0, -1)}).
- MINIMUM ACCEPTABLE: ${targetMin} ${unit}. Bios shorter than ${targetIdeal} ${unit} waste valuable platform space and hurt SEO/discoverability.
- Expand with specific story-input details (who you help, service style, differentiator, local market) — not generic filler.
- Before returning, mentally count ${unit}. If under ${targetIdeal}, add another concrete detail until you are within ~5 ${unit} of the max.`;
  }

  function parseBioResponse(raw) {
    if (!raw?.trim()) return '';
    let text = raw.trim().replace(/^```[\w]*\n?/gm, '').replace(/```$/gm, '').trim();
    text = text.replace(/^(Bio:|Professional Bio:|About:)\s*/i, '').trim();
    return text.replace(/\n*[\[(]?\d+\s*\/\s*\d+\s*(words|characters)[\])]?\s*$/i, '').trim();
  }

  function bioUsesThirdPersonLoVoice(text, profileName) {
    const t = text || '';
    if (/\b(He|She)\s+(is|has|was|helps?|specializes?|brings?|offers?|provides?|works?|serves?|loves?|believes?|knows?|focuses?)\b/.test(t)) {
      return true;
    }
    if (/\b(His|Her)\s+(approach|passion|focus|experience|background|commitment|goal|mission|dedication|expertise)\b/i.test(t)) {
      return true;
    }
    const firstName = (profileName || '').trim().split(/\s+/)[0];
    if (firstName && firstName.length > 2) {
      const esc = firstName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(`\\b${esc}\\s+(is|has|was|helps?|specializes?|brings?|offers?|provides?|works?|serves?|loves?)\\b`, 'i').test(t)) {
        return true;
      }
    }
    return false;
  }

  function measureBio(text, dest) {
    if (dest.limitType === 'words') {
      const w = countWords(text);
      return { current: w, max: dest.limit, type: 'words', over: w > dest.limit, pct: Math.min(100, Math.round((w / dest.limit) * 100)) };
    }
    const c = countChars(text);
    return { current: c, max: dest.limit, type: 'chars', over: c > dest.limit, pct: Math.min(100, Math.round((c / dest.limit) * 100)) };
  }

  function collectDraftFromForm() {
    const chipVals = (name) =>
      Array.from(document.querySelectorAll(`input[data-bio-chip="${name}"]:checked`)).map((c) => c.value);

    return {
      serviceApproach: chipVals('service'),
      serviceApproachNotes: (document.getElementById('bio-service-notes')?.value || '').trim(),
      yearsConfirm: (document.getElementById('bio-years')?.value || '').trim(),
      lovesMost: (document.getElementById('bio-loves-most')?.value || '').trim(),
      whoYouHelp: chipVals('who'),
      whoYouHelpNotes: (document.getElementById('bio-who-notes')?.value || '').trim(),
      differentiators: chipVals('diff'),
      differentiatorsNotes: (document.getElementById('bio-diff-notes')?.value || '').trim(),
      personalLifeChips: chipVals('personal'),
      familyLife: (document.getElementById('bio-family')?.value || '').trim(),
      hobbies: (document.getElementById('bio-hobbies')?.value || '').trim(),
      pets: (document.getElementById('bio-pets')?.value || '').trim(),
      communityPersonal: (document.getElementById('bio-community')?.value || '').trim(),
      additionalNotes: (document.getElementById('bio-additional')?.value || '').trim(),
      mentionCompany: !!document.getElementById('bio-mention-company')?.checked,
      toneOverride: document.getElementById('bio-tone')?.value || '',
      existingBioPaste: (document.getElementById('bio-existing-paste')?.value || '').trim(),
      destination: document.getElementById('bio-destination')?.value || 'website-about',
      customLimitType: document.getElementById('bio-custom-limit-type')?.value || 'chars',
      customLimitValue: document.getElementById('bio-custom-limit-value')?.value || '750'
    };
  }

  function applyDraftToForm(draft) {
    if (!draft) return;
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el && val != null) el.value = val;
    };
    const setChips = (name, vals) => {
      const set = new Set(vals || []);
      document.querySelectorAll(`input[data-bio-chip="${name}"]`).forEach((cb) => {
        cb.checked = set.has(cb.value);
      });
    };

    setChips('service', draft.serviceApproach);
    setVal('bio-service-notes', draft.serviceApproachNotes);
    setVal('bio-existing-paste', draft.existingBioPaste);
    setVal('bio-years', draft.yearsConfirm);
    setVal('bio-loves-most', draft.lovesMost);
    setChips('who', draft.whoYouHelp);
    setVal('bio-who-notes', draft.whoYouHelpNotes);
    setChips('diff', draft.differentiators);
    setVal('bio-diff-notes', draft.differentiatorsNotes);
    setChips('personal', draft.personalLifeChips);
    setVal('bio-family', draft.familyLife);
    setVal('bio-hobbies', draft.hobbies);
    setVal('bio-pets', draft.pets);
    setVal('bio-community', draft.communityPersonal);
    setVal('bio-additional', draft.additionalNotes);
    const mentionEl = document.getElementById('bio-mention-company');
    if (mentionEl) mentionEl.checked = !!draft.mentionCompany;
    setVal('bio-tone', draft.toneOverride || '');
    if (draft.destination) {
      setVal('bio-destination', draft.destination);
      syncDestinationCards(draft.destination);
    }
    setVal('bio-custom-limit-type', draft.customLimitType || 'chars');
    setVal('bio-custom-limit-value', draft.customLimitValue || '750');
    toggleCustomLimitRow();
    refreshAllUI();
  }

  function scheduleDraftSave() {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      if (typeof window.patchUserProfile === 'function') {
        window.patchUserProfile({ bioBuilderDraft: collectDraftFromForm() }, { silent: true });
      }
    }, 600);
  }

  function renderChipGroup(containerId, chipName, options) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = options
      .map(
        (opt) => `
      <label class="bio-chip-label inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 cursor-pointer text-sm transition hover:border-[#00A89D]/50 has-[:checked]:border-[#00A89D] has-[:checked]:bg-[#00A89D]/10 has-[:checked]:shadow-sm">
        <input type="checkbox" data-bio-chip="${chipName}" value="${escapeHtml(opt)}" class="rounded text-[#00A89D] focus:ring-[#00A89D]">
        <span>${escapeHtml(opt)}</span>
      </label>`
      )
      .join('');
  }

  function renderStarterButtons() {
    Object.keys(STARTERS).forEach((fieldKey) => {
      const wrap = document.getElementById('bio-starters-' + fieldKey);
      if (!wrap) return;
      const starters = STARTERS[fieldKey];
      wrap.innerHTML = starters
        .map(
          (s, i) =>
            `<button type="button" class="bio-starter-btn text-xs px-3 py-1.5 rounded-full border border-[#00A89D]/35 text-[#00A89D] font-semibold hover:bg-[#00A89D]/10 transition" data-field="${fieldKey}" data-idx="${i}">${escapeHtml(s.label)}</button>`
        )
        .join('');
    });
  }

  function renderDestinationCards() {
    const wrap = document.getElementById('bio-destination-cards');
    if (!wrap) return;
    const current = document.getElementById('bio-destination')?.value || 'website-about';

    wrap.innerHTML = DESTINATION_ORDER
      .filter((key) => key !== 'custom' && DESTINATIONS[key])
      .map((key) => {
        const d = DESTINATIONS[key];
        const limit = d.limitType === 'words' ? `~${d.limit} words` : `${d.limit} chars`;
        const active = key === current;
        const iconCls = d.icon === 'fa-google' || d.icon === 'fa-linkedin' ? `fab ${d.icon}` : `fas ${d.icon}`;
        return `
        <button type="button" class="bio-dest-card text-left p-4 rounded-2xl border-2 transition ${active ? 'border-[#00A89D] bg-[#00A89D]/10 shadow-md ring-2 ring-[#00A89D]/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-[#00A89D]/40'}" data-dest="${key}">
          <div class="flex items-center gap-2 mb-1">
            <i class="${iconCls} text-[#00A89D]"></i>
            <span class="font-bold text-sm text-[#002B5C] dark:text-white">${escapeHtml(d.short)}</span>
          </div>
          <div class="text-[11px] text-gray-500">${escapeHtml(limit)}</div>
        </button>`;
      })
      .join('') + `
      <button type="button" class="bio-dest-card text-left p-4 rounded-2xl border-2 transition ${current === 'custom' ? 'border-[#00A89D] bg-[#00A89D]/10' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-[#00A89D]/40'}" data-dest="custom">
        <div class="flex items-center gap-2 mb-1"><i class="fas fa-sliders-h text-[#F15A29]"></i><span class="font-bold text-sm">Custom</span></div>
        <div class="text-[11px] text-gray-500">Your limit</div>
      </button>`;

    wrap.querySelectorAll('.bio-dest-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.dest;
        const sel = document.getElementById('bio-destination');
        if (sel) {
          sel.value = key;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
        }
        syncDestinationCards(key);
        toggleCustomLimitRow();
        updateDestinationPanel();
        scheduleDraftSave();
      });
    });
  }

  function syncDestinationCards(key) {
    document.querySelectorAll('.bio-dest-card').forEach((card) => {
      const active = card.dataset.dest === key;
      card.classList.toggle('border-[#00A89D]', active);
      card.classList.toggle('bg-[#00A89D]/10', active);
      card.classList.toggle('shadow-md', active);
      card.classList.toggle('ring-2', active);
      card.classList.toggle('ring-[#00A89D]/20', active);
      card.classList.toggle('border-gray-200', !active);
      card.classList.toggle('dark:border-gray-700', !active);
      card.classList.toggle('bg-white', !active);
      card.classList.toggle('dark:bg-gray-900', !active);
    });
  }

  function renderRefineChips() {
    const wrap = document.getElementById('bio-refine-chips');
    if (!wrap) return;
    wrap.innerHTML = REFINE_CHIPS.map(
      (t) =>
        `<button type="button" class="bio-refine-chip text-xs px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-[#00A89D] hover:text-[#00A89D] transition">${escapeHtml(t)}</button>`
    ).join('');
    wrap.querySelectorAll('.bio-refine-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        const ta = document.getElementById('bio-feedback');
        if (ta) ta.value = btn.textContent.trim();
        generateBio(btn.textContent.trim());
      });
    });
  }

  function renderProfileSummary() {
    const el = document.getElementById('bio-profile-summary');
    if (!el) return;
    const p = getCentralProfile();
    const chips = [
      { k: 'Name', v: p.name, ok: !!p.name },
      { k: 'Market', v: p.location, ok: !!p.location },
      { k: 'License', v: p.nmls, ok: !!p.nmls },
      { k: 'Intro', v: p.intro, ok: !!p.intro },
      { k: 'Tone', v: p.tone, ok: !!p.tone }
    ];

    const filled = chips.filter((c) => c.ok).length;
    el.innerHTML = `
      <div class="flex flex-wrap items-center gap-2 mb-3">
        <span class="text-xs font-bold text-[#00A89D]">${filled} of ${chips.length} profile essentials loaded</span>
        ${filled < 3 ? '<span class="text-xs text-[#F15A29]">— add market + intro in Profile for stronger bios</span>' : ''}
      </div>
      <div class="flex flex-wrap gap-2">
        ${chips
          .map(
            (c) =>
              `<span class="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${c.ok ? 'border-[#00A89D]/30 bg-[#00A89D]/5 text-gray-700 dark:text-gray-300' : 'border-gray-200 dark:border-gray-700 text-gray-400'}">
            <i class="fas ${c.ok ? 'fa-check-circle text-[#00A89D]' : 'fa-circle text-gray-300'} text-[10px]"></i>
            <span class="font-semibold">${escapeHtml(c.k)}:</span> ${c.ok ? escapeHtml(String(c.v).slice(0, 40)) : '—'}
          </span>`
          )
          .join('')}
      </div>`;
  }

  function updatePrimaryBioStrip() {
    const el = document.getElementById('bio-primary-status');
    if (!el) return;
    const p = getCentralProfile();
    if (p.professionalBio) {
      const meta = p.professionalBioMeta || {};
      el.className = 'mb-6 flex items-start gap-3 rounded-2xl border border-[#00A89D]/40 bg-[#00A89D]/8 px-5 py-4 text-sm';
      el.innerHTML = `
        <i class="fas fa-check-circle text-[#00A89D] mt-0.5"></i>
        <div class="min-w-0">
          <strong class="text-[#002B5C] dark:text-white">Primary bio saved</strong>
          <span class="text-gray-600 dark:text-gray-400"> — ${escapeHtml(meta.destinationLabel || 'profile')}. Newsletter, Blog, Social &amp; AI Coach will use this voice.</span>
          <div class="flex flex-wrap gap-2 mt-2">
            <button type="button" class="text-[11px] px-3 py-1 rounded-full border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white transition" onclick="if(typeof window.showSection==='function')window.showSection('newsletter-generator')">Newsletter →</button>
            <button type="button" class="text-[11px] px-3 py-1 rounded-full border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white transition" onclick="if(typeof window.showSection==='function')window.showSection('ai-chat')">AI Coach →</button>
            <button type="button" class="text-[11px] px-3 py-1 rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-[#00A89D] hover:text-[#00A89D] transition" onclick="if(typeof window.showSection==='function')window.showSection('planning')">2026 Plan →</button>
          </div>
        </div>`;
      el.classList.remove('hidden');
    } else {
      el.className = 'mb-6 flex items-start gap-3 rounded-2xl border border-[#F15A29]/25 bg-[#F15A29]/5 px-5 py-4 text-sm hidden';
      el.innerHTML = '';
    }
  }

  function evaluateChecks() {
    const draft = collectDraftFromForm();
    return FIELD_CHECKS.map((c) => ({ ...c, done: c.test(draft) }));
  }

  function updateQualityChecklist() {
    const checks = evaluateChecks();
    const essential = checks.filter((c) => c.essential);
    const doneEssential = essential.filter((c) => c.done).length;
    const doneAll = checks.filter((c) => c.done).length;

    const meter = document.getElementById('bio-readiness-meter');
    const bar = document.getElementById('bio-readiness-bar');
    const pct = Math.round((essential.length ? (doneEssential / essential.length) * 100 : 0));

    if (meter) {
      meter.textContent =
        doneEssential >= essential.length
          ? 'Ready to generate — great story detail!'
          : `${doneEssential} of ${essential.length} essentials · ${doneAll} of ${checks.length} total`;
      meter.className =
        doneEssential >= essential.length
          ? 'text-xs font-bold text-[#00A89D]'
          : doneEssential >= 3
            ? 'text-xs font-bold text-[#F15A29]'
            : 'text-xs font-bold text-gray-500';
    }
    if (bar) bar.style.width = `${pct}%`;

    checks.forEach((c) => {
      const status = document.querySelector(`[data-bio-status="${c.field}"]`);
      if (status) {
        status.innerHTML = c.done
          ? '<i class="fas fa-check-circle text-[#00A89D]"></i>'
          : c.essential
            ? '<i class="fas fa-circle text-[#F15A29]/50 text-[10px]"></i>'
            : '<i class="fas fa-circle text-gray-300 text-[10px]"></i>';
      }
      const block = document.querySelector(`[data-bio-field="${c.field}"]`);
      if (block) {
        block.classList.toggle('bio-field-complete', c.done);
        block.classList.toggle('bio-field-essential-missing', c.essential && !c.done);
      }
    });

    const genBtn = document.getElementById('generate-bio-btn');
    if (genBtn) {
      genBtn.disabled = doneEssential < MIN_ESSENTIALS;
      genBtn.classList.toggle('opacity-60', doneEssential < MIN_ESSENTIALS);
      genBtn.classList.toggle('cursor-not-allowed', doneEssential < MIN_ESSENTIALS);
    }

    const hint = document.getElementById('bio-generate-hint');
    if (hint) {
      hint.textContent =
        doneEssential >= essential.length
          ? 'You have strong inputs — expect a specific, paste-ready bio.'
          : doneEssential < MIN_ESSENTIALS
            ? `Complete at least ${MIN_ESSENTIALS} essentials (highlighted in orange) for best results.`
            : 'Good start — add one more essential field for a richer bio.';
    }

    updateStepProgress(doneEssential >= essential.length);
  }

  function updateStepProgress(storyComplete) {
    const p = getCentralProfile();
    const profileOk = !!(p.name && p.location);
    const dest = document.getElementById('bio-destination')?.value;

    const steps = [
      { id: 'bio-step-1', done: profileOk },
      { id: 'bio-step-2', done: storyComplete },
      { id: 'bio-step-3', done: !!dest }
    ];
    steps.forEach((s, i) => {
      const el = document.getElementById(s.id);
      if (!el) return;
      el.classList.toggle('bio-step-done', s.done);
      el.classList.toggle('bio-step-active', !s.done && (i === 0 || steps[i - 1].done));
    });
  }

  function updateDestinationPanel() {
    const dest = getSelectedDestination();
    const hintEl = document.getElementById('bio-destination-hint');
    const limitEl = document.getElementById('bio-destination-limit-label');
    const structEl = document.getElementById('bio-destination-structure');
    if (hintEl) hintEl.textContent = dest.hint || '';
    if (limitEl) {
      limitEl.textContent = dest.key === 'custom' ? 'Set your limit below' : `Target: ${getLimitLabel(dest)}`;
    }
    if (structEl) structEl.textContent = dest.structure || '';
  }

  function refreshAllUI() {
    renderProfileSummary();
    updatePrimaryBioStrip();
    updateQualityChecklist();
    updateDestinationPanel();
    updateBioYearsHint();
    updateExistingPasteMeta();
  }

  function hobbiesTextFromProfile(p) {
    return [...(p.hobbies || []), p.hobbiesOther].filter(Boolean).join(', ');
  }

  function seedBioFieldsFromProfile(profile) {
    const p = profile || getCentralProfile();
    const setIfEmpty = (id, val) => {
      const el = document.getElementById(id);
      if (el && !String(el.value || '').trim() && val) {
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    };

    setIfEmpty('bio-years', p.years);
    setIfEmpty('bio-tone', p.tone);
    setIfEmpty('bio-family', p.family);
    setIfEmpty('bio-hobbies', hobbiesTextFromProfile(p));
  }

  function syncBioFromProfile() {
    const p = getCentralProfile();

    if (p.bioBuilderDraft && typeof p.bioBuilderDraft === 'object') {
      applyDraftToForm(p.bioBuilderDraft);
    } else {
      refreshAllUI();
    }

    seedBioFieldsFromProfile(p);
    updateBioYearsHint();
    if (!document.getElementById('bio-existing-paste')?.value?.trim()) {
      const seedBio = p.professionalBio || p.bioBuilderDraft?.existingBioPaste;
      if (seedBio) {
        const pasteEl = document.getElementById('bio-existing-paste');
        if (pasteEl) {
          pasteEl.value = seedBio;
          pasteEl.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    }
    updateExistingPasteMeta();

    restoreSavedBioOutput();
    renderDestinationCards();
    syncDestinationCards(document.getElementById('bio-destination')?.value || 'website-about');
    toggleCustomLimitRow();
    refreshAllUI();
  }

  function toggleCustomLimitRow() {
    const dest = document.getElementById('bio-destination')?.value;
    const row = document.getElementById('bio-custom-limit-row');
    if (row) row.classList.toggle('hidden', dest !== 'custom');
  }

  function insertStarter(fieldKey, idx) {
    const starter = STARTERS[fieldKey]?.[idx];
    if (!starter) return;
    const idMap = {
      'loves-most': 'bio-loves-most',
      service: 'bio-service-notes',
      who: 'bio-who-notes',
      diff: 'bio-diff-notes',
      family: 'bio-family',
      hobbies: 'bio-hobbies',
      pets: 'bio-pets',
      community: 'bio-community',
      additional: 'bio-additional'
    };
    const el = document.getElementById(idMap[fieldKey]);
    if (!el) return;
    const p = getCentralProfile();
    let text = starter.text.replace('[your market]', p.location || 'your market').replace('[your city]', p.location || 'your city');
    if (el.value.trim()) {
      el.value = el.value.trim() + '\n\n' + text;
    } else {
      el.value = text;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.focus();
  }

  function scrollToFirstMissing() {
    const checks = evaluateChecks().filter((c) => c.essential && !c.done);
    if (!checks.length) return;
    const block = document.querySelector(`[data-bio-field="${checks[0].field}"]`);
    if (block) {
      block.scrollIntoView({ behavior: 'smooth', block: 'center' });
      block.classList.add('bio-field-highlight');
      setTimeout(() => block.classList.remove('bio-field-highlight'), 2000);
    }
  }

  function experienceYearsForPrompt(raw) {
    const text = String(raw || '').trim();
    if (!text) return 'not specified';
    if (typeof window.resolveExperienceYears === 'function') {
      const r = window.resolveExperienceYears(text);
      return r.phrase || text;
    }
    return text;
  }

  function updateBioYearsHint() {
    const input = document.getElementById('bio-years');
    const hint = document.getElementById('bio-years-hint');
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

  function ensureWebsiteDestination() {
    const sel = document.getElementById('bio-destination');
    if (!sel) return;
    sel.value = 'website-about';
    syncDestinationCards('website-about');
    toggleCustomLimitRow();
    updateDestinationPanel();
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function updateExistingPasteMeta() {
    const ta = document.getElementById('bio-existing-paste');
    const meta = document.getElementById('bio-existing-paste-meta');
    if (!ta || !meta) return;
    const len = (ta.value || '').length;
    if (!len) {
      meta.textContent = 'Paste your current team-page or website bio above.';
      return;
    }
    meta.textContent =
      len > 750
        ? `${len} characters — we'll rewrite down to the 750-character company standard.`
        : `${len} characters — already under 750; we'll still polish for the company format.`;
  }

  function buildRewritePrompt(existingText) {
    const p = getCentralProfile();
    const draft = collectDraftFromForm();
    const dest = getSelectedDestination();
    const whoLine =
      [...(draft.whoYouHelp || []), draft.whoYouHelpNotes].filter(Boolean).join('; ') || 'not specified';
    const profileCtx =
      typeof window.buildProfileAiContext === 'function'
        ? window.buildProfileAiContext(p)
        : `Name: ${p.name || 'Real Estate Agent'}. Market: ${p.location || 'local area'}.`;
    const lengthInstruction = buildLengthInstruction(dest);

    return `You are tightening a real estate agent bio to the company website standard.

DESTINATION: ${dest.label}
${lengthInstruction}

${FIRST_PERSON_RULE}

TASK: Rewrite the EXISTING BIO below to fit the character limit. This is a shorten + polish job, not a from-scratch write.
- Preserve real facts, credentials, License, market, and voice from the original.
- Convert any third-person phrasing (he/she/[Name]) to first person (I/me/my).
- Remove filler, redundancy, and overly long phrasing.
- Prioritize who you help, local market, and one differentiator.
- If WHO YOU HELP is provided below and missing from the bio, weave it in naturally.
- Do NOT invent awards, numbers, or personal details not in the original or profile.

WHO YOU HELP (use if space allows): ${whoLine}

PROFILE CONTEXT:
${profileCtx}

EXISTING BIO TO REWRITE (${countChars(existingText)} characters):
${existingText}

OUTPUT: Return ONLY the rewritten bio text. No title, labels, or markdown.`;
  }

  function buildPrompt(feedback, previousBio) {
    const p = getCentralProfile();
    const draft = collectDraftFromForm();
    const yearsLine = experienceYearsForPrompt(draft.yearsConfirm || p.years);
    const dest = getSelectedDestination();
    const tone = draft.toneOverride || p.tone || 'Warm, professional, and authentic';
    const profileCtx =
      typeof window.buildProfileAiContext === 'function'
        ? window.buildProfileAiContext(p)
        : `Name: ${p.name || 'Real Estate Agent'}. Market: ${p.location || 'local area'}.`;

    const lengthInstruction = buildLengthInstruction(dest);

    const companyNote = draft.mentionCompany
      ? 'You may mention the brokerage/company by name if it fits naturally.'
      : 'Do NOT name a specific brokerage unless the user explicitly asked in additional notes.';

    const missing = evaluateChecks().filter((c) => c.essential && !c.done).map((c) => c.label);
    const inferNote = missing.length
      ? `Note: User did not fully complete: ${missing.join(', ')}. Infer carefully from profile — do not fabricate specific awards, numbers, or credentials.`
      : '';

    return `You are an elite real-estate marketing copywriter creating a platform-specific agent bio optimized for human trust AND search/AI discoverability.

DESTINATION: ${dest.label}
${lengthInstruction}
Platform goal: ${dest.hint}
Required structure: ${dest.structure}

LOAN OFFICER PROFILE:
${profileCtx}

STORY INPUTS (use these specifics — this is what makes the bio authentic):
- Years in business: ${yearsLine}
- What they love most about helping buyers and sellers: ${draft.lovesMost || 'not specified'}
- Customer service approach: ${[...(draft.serviceApproach || []), draft.serviceApproachNotes].filter(Boolean).join('; ') || 'not specified'}
- Who they help most: ${[...(draft.whoYouHelp || []), draft.whoYouHelpNotes].filter(Boolean).join('; ') || 'not specified'}
- What makes them different: ${[...(draft.differentiators || []), draft.differentiatorsNotes].filter(Boolean).join('; ') || 'not specified'}
- Life outside work (weave in 1–2 brief human details if provided — builds enormous trust):
  - Personal themes: ${(draft.personalLifeChips || []).join(', ') || 'none selected'}
  - Family: ${draft.familyLife || 'not provided'}
  - Hobbies & passions: ${draft.hobbies || 'not provided'}
  - Pets: ${draft.pets || 'not provided'}
  - Community / volunteering: ${draft.communityPersonal || 'not provided'}
- Additional (awards, languages, designations): ${draft.additionalNotes || 'none'}

VOICE: ${tone}
${companyNote}
${inferNote}

${FIRST_PERSON_RULE}

QUALITY RULES:
- NEVER sound like generic corporate boilerplate ("passionate professional dedicated to excellence").
- Use at least ONE concrete, human detail from the story inputs (feeling, client type, or agent feedback).
- Weave in the local market naturally if provided — good for SEO/GEO.
- No rate promises, guaranteed approval, or superlatives like "best" or "#1" unless user provided proof.
- No License/EHO boilerplate unless user included it in additional notes.
- If life-outside-work details were provided, include at least one naturally — it separates memorable bios from generic ones. Never invent personal facts.

${feedback ? `REFINEMENT (keep destination + limit):\n${feedback}\n\nPREVIOUS BIO:\n${previousBio || lastGeneratedText}` : ''}

OUTPUT: Return ONLY the final bio text. No title, labels, word count, or markdown.`;
  }

  function clearBioLoadingTimers() {
    [bioTipInterval, bioStepInterval, bioElapsedInterval].forEach((id) => {
      if (id) clearInterval(id);
    });
    bioTipInterval = bioStepInterval = bioElapsedInterval = null;
    if (bioWatchdogTimer) {
      clearTimeout(bioWatchdogTimer);
      bioWatchdogTimer = null;
    }
  }

  async function autoExpandBioLength(text, dest, controller) {
    let measure = measureBio(text, dest);
    const targets = getLengthTargets(dest);
    if (!bioNeedsLengthBoost(measure, targets, dest)) return text;

    const goals = [targets.targetIdeal, targets.targetMax];
    for (const goal of goals) {
      measure = measureBio(text, dest);
      if (!bioNeedsLengthBoost(measure, targets, dest) || measure.current >= goal) break;

      console.warn('[bio-creator] Expanding bio length…', { current: measure.current, goal });
      const elapsedEl = document.getElementById('bio-loading-elapsed');
      if (elapsedEl) {
        elapsedEl.textContent = `Filling to target length (${goal} ${targets.unit})…`;
      }

      const expandPrompt = buildPrompt(buildLengthBoostPrompt(dest, measure, goal), text);
      const expandedRaw = await window.callGrokAPI(expandPrompt, {
        temperature: 0.62,
        max_tokens: 900,
        timeoutMs: BIO_API_TIMEOUT_MS,
        skipKeyPrompt: true,
        signal: controller?.signal,
        maxRetries: 3,
        onRetry: ({ attempt, maxRetries, delayMs }) => {
          const el = document.getElementById('bio-loading-elapsed');
          if (el) el.textContent = `xAI is busy — auto-retry ${attempt}/${maxRetries} in ${Math.ceil(delayMs / 1000)}s…`;
        }
      });
      if (expandedRaw?.trim()) {
        text = parseBioResponse(expandedRaw);
      }
    }

    return text;
  }

  function failBioGeneration(message) {
    console.warn('[bio-creator] Fail:', message);
    const output = document.getElementById('bio-output');
    const panel = document.getElementById('bio-output-panel');
    if (output && panel) {
      output.innerHTML = `
        <div class="text-center py-8 px-4">
          <p class="text-red-600 dark:text-red-400 text-lg font-bold mb-3"><i class="fas fa-exclamation-triangle mr-2"></i>Could not generate bio</p>
          <p class="text-gray-700 dark:text-gray-300 max-w-md mx-auto mb-4">${escapeHtml(message)}</p>
          <button type="button" id="bio-retry-btn" class="text-sm font-semibold text-[#00A89D] underline">Try again</button>
        </div>`;
      panel.classList.remove('hidden');
      document.getElementById('bio-retry-btn')?.addEventListener('click', () => {
        if (lastGeneratedText?.trim()) regenerateBio();
        else generateBio();
      });
    }
    if (typeof window.showToast === 'function') window.showToast(message);
  }

  function cancelBioGeneration() {
    if (!bioGenerating) return;
    bioUserCancelled = true;
    console.warn('[bio-creator] Cancelled by user');
    bioAbortController?.abort();
    clearBioLoadingTimers();
    hideBioLoading();
    bioGenerating = false;
    const genBtn = document.getElementById('generate-bio-btn');
    const rewriteBtn = document.getElementById('bio-rewrite-existing-btn');
    if (genBtn) genBtn.disabled = false;
    if (rewriteBtn) rewriteBtn.disabled = false;
    updateQualityChecklist();
    if (typeof window.showToast === 'function') window.showToast('Bio generation cancelled.');
  }

  function hideBioLoading() {
    clearBioLoadingTimers();
    const loadingEl = document.getElementById('global-loading');
    if (loadingEl?.dataset.bioOriginalContent) {
      loadingEl.innerHTML = loadingEl.dataset.bioOriginalContent;
      delete loadingEl.dataset.bioOriginalContent;
    }
    if (typeof window.hideLoading === 'function') {
      window.hideLoading();
    } else if (loadingEl) {
      loadingEl.classList.add('hidden');
      loadingEl.style.setProperty('display', 'none', 'important');
      loadingEl.style.setProperty('visibility', 'hidden', 'important');
      loadingEl.style.setProperty('pointer-events', 'none', 'important');
    }
  }

  function isBioLocalDev() {
    return typeof window.isLocalDevHost === 'function' && window.isLocalDevHost();
  }

  function resolveBioApiKey(options = {}) {
    const { allowProxyFallback = false, skipPrompt = false } = options;
    const hosted = typeof window.isProductionHosted === 'function' && window.isProductionHosted();
    let key = typeof window.getGrokApiKey === 'function' ? window.getGrokApiKey() : null;

    if (key && typeof window.isValidGrokApiKey === 'function' && !window.isValidGrokApiKey(key)) {
      console.warn('[bio-creator] Removing invalid/placeholder API key from storage');
      localStorage.removeItem('grokApiKey');
      key = null;
    }

    if (!key && !hosted && !skipPrompt && typeof window.ensureGrokApiKey === 'function') {
      key = window.ensureGrokApiKey();
    }

    if (!key && !hosted) {
      if (allowProxyFallback && isBioLocalDev()) {
        return null;
      }
      throw new Error('Grok API key required. Click API Key in the header and paste your xai- key from console.x.ai.');
    }

    if (key && typeof window.isValidGrokApiKey === 'function' && !window.isValidGrokApiKey(key)) {
      throw new Error('That API key does not look valid. Paste a real xai- key from console.x.ai (not the .env placeholder).');
    }

    return key;
  }

  function preflightBioApi(options = {}) {
    if (typeof window.callGrokAPI !== 'function') {
      throw new Error('AI client not loaded — hard-refresh the page (Ctrl+Shift+R).');
    }
    if (options.forRegenerate && bioSessionReady) {
      return;
    }
    resolveBioApiKey({ allowProxyFallback: true, skipPrompt: !!options.forRegenerate });
  }

  function showBioLoading(isRefine) {
    const loadingEl = document.getElementById('global-loading');
    if (!loadingEl) return;

    clearBioLoadingTimers();
    bioLoadingStartedAt = Date.now();

    if (!loadingEl.dataset.bioOriginalContent) {
      loadingEl.dataset.bioOriginalContent = loadingEl.innerHTML;
    }

    const dest = getSelectedDestination();
    const title = isRefine ? 'Refining your bio…' : 'Crafting your professional bio…';
    const limitLabel = dest.key === 'custom' ? 'custom limit' : getLimitLabel(dest);

    if (typeof window.forceShowGlobalLoading === 'function') {
      window.forceShowGlobalLoading(title);
    }

    const stepsHtml = BIO_LOADING_STEPS.map(
      (label, i) =>
        `<div class="bio-load-step flex items-center gap-3 text-sm transition-opacity duration-500 ${i === 0 ? 'opacity-100' : 'opacity-40'}" data-step="${i}">
          <span class="bio-load-step-dot w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${i === 0 ? 'border-[#00A89D] bg-[#00A89D] text-white' : 'border-gray-300 text-gray-400'}">${i + 1}</span>
          <span class="text-gray-700 dark:text-gray-300">${escapeHtml(label)}</span>
        </div>`
    ).join('');

    loadingEl.innerHTML = `
      <div class="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6" id="bio-loading-root">
        <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 md:p-10 w-full max-w-2xl border border-gray-200 dark:border-gray-700">
          <div class="text-center mb-6">
            <div class="relative inline-flex items-center justify-center w-20 h-20 mb-4">
              <div class="absolute inset-0 rounded-full border-4 border-[#00A89D]/20"></div>
              <div class="absolute inset-0 rounded-full border-4 border-transparent border-t-[#00A89D] border-r-[#F15A29] animate-spin"></div>
              <i class="fas fa-id-card text-2xl text-[#002B5C] dark:text-white"></i>
            </div>
            <span class="inline-block text-[10px] font-bold tracking-[2px] text-[#00A89D] bg-[#00A89D]/10 px-3 py-1 rounded-full mb-2">${escapeHtml(dest.label)}</span>
            <h3 class="text-2xl md:text-3xl font-bold text-[#002B5C] dark:text-white mb-1">${escapeHtml(title)}</h3>
            <p class="text-sm text-gray-500">Targeting <strong>${escapeHtml(limitLabel)}</strong> · usually 20–45 seconds</p>
            <p id="bio-loading-elapsed" class="text-xs text-gray-400 mt-2"></p>
          </div>

          <div class="mb-6 space-y-2.5 pl-1" id="bio-loading-steps">${stepsHtml}</div>

          <div class="rounded-2xl bg-gradient-to-br from-[#00A89D]/8 to-[#F15A29]/8 border border-[#00A89D]/20 p-5 mb-4 min-h-[5.5rem] transition-all duration-300" id="bio-loading-tip-card">
            <div class="flex gap-3">
              <span class="w-9 h-9 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center flex-shrink-0 shadow-sm" id="bio-tip-icon-wrap">
                <i class="fas fa-search text-[#00A89D]" id="bio-tip-icon"></i>
              </span>
              <div>
                <div class="text-xs font-bold tracking-wider text-[#F15A29] uppercase mb-1" id="bio-tip-title">SEO + AI visibility</div>
                <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed m-0" id="bio-tip-text">${escapeHtml(BIO_LOADING_TIPS[0].text)}</p>
              </div>
            </div>
          </div>

          <p class="text-center text-[11px] text-gray-400 m-0">While you wait: think of one client win or agent compliment we can weave into future versions.</p>
          <div class="text-center mt-5">
            <button type="button" id="bio-cancel-btn" class="text-sm font-semibold text-gray-500 hover:text-[#F15A29] underline">Cancel</button>
          </div>
        </div>
      </div>`;

    loadingEl.classList.remove('hidden');
    loadingEl.style.setProperty('display', 'flex', 'important');
    loadingEl.style.setProperty('visibility', 'visible', 'important');
    loadingEl.style.setProperty('pointer-events', 'auto', 'important');

    let tipIdx = 0;
    let stepIdx = 0;

    const renderTip = (idx) => {
      const tip = BIO_LOADING_TIPS[idx % BIO_LOADING_TIPS.length];
      const icon = document.getElementById('bio-tip-icon');
      const titleEl = document.getElementById('bio-tip-title');
      const textEl = document.getElementById('bio-tip-text');
      const card = document.getElementById('bio-loading-tip-card');
      if (!tip || !icon || !titleEl || !textEl) return;
      card?.classList.add('opacity-80');
      setTimeout(() => {
        icon.className = `fas ${tip.icon}`;
        icon.style.color = tip.color;
        titleEl.textContent = tip.title;
        textEl.textContent = tip.text;
        card?.classList.remove('opacity-80');
      }, 180);
    };

    bioTipInterval = setInterval(() => {
      tipIdx = (tipIdx + 1) % BIO_LOADING_TIPS.length;
      renderTip(tipIdx);
    }, 4500);

    bioStepInterval = setInterval(() => {
      if (stepIdx < BIO_LOADING_STEPS.length - 1) {
        const prev = document.querySelector(`.bio-load-step[data-step="${stepIdx}"]`);
        stepIdx += 1;
        const next = document.querySelector(`.bio-load-step[data-step="${stepIdx}"]`);
        if (prev) {
          prev.classList.add('opacity-60');
          const dot = prev.querySelector('.bio-load-step-dot');
          if (dot) {
            dot.className = 'bio-load-step-dot w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-[#00A89D] bg-[#00A89D]/20 text-[#00A89D]';
            dot.innerHTML = '<i class="fas fa-check text-[9px]"></i>';
          }
        }
        if (next) {
          next.classList.remove('opacity-40');
          next.classList.add('opacity-100');
          const dot = next.querySelector('.bio-load-step-dot');
          if (dot) {
            dot.className = 'bio-load-step-dot w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-[#00A89D] bg-[#00A89D] text-white';
            dot.textContent = String(stepIdx + 1);
          }
        }
      }
    }, 3200);

    bioElapsedInterval = setInterval(() => {
      const el = document.getElementById('bio-loading-elapsed');
      if (!el) return;
      const sec = Math.floor((Date.now() - bioLoadingStartedAt) / 1000);
      if (sec < 8) {
        el.textContent = '';
      } else if (sec < 50) {
        el.textContent = `Still working… ${sec}s`;
      } else {
        el.textContent = `Over ${sec}s — if this continues, cancel and verify API key + proxy on port 3000.`;
      }
    }, 1000);

    document.getElementById('bio-cancel-btn')?.addEventListener('click', cancelBioGeneration);
  }

  function renderOutput(text, dest, isPrimary) {
    const output = document.getElementById('bio-output');
    const panel = document.getElementById('bio-output-panel');
    if (!output || !panel) return;

    const savedFeedback = document.getElementById('bio-feedback')?.value || '';
    const measure = measureBio(text, dest);
    const targets = getLengthTargets(dest);
    const hasRoom = bioNeedsLengthBoost(measure, targets, dest);
    const unused =
      measure.type === 'chars' ? measure.max - measure.current : measure.max - measure.current;
    const countLabel =
      measure.type === 'words'
        ? `${measure.current} / ${measure.max} words`
        : `${measure.current} / ${measure.max} characters`;
    const countLabelFull =
      hasRoom && measure.type === 'chars' && unused > 0
        ? `${countLabel} · ${unused} unused`
        : countLabel;
    const countClass = measure.over
      ? 'bg-red-100 text-red-700'
      : hasRoom
        ? 'bg-amber-100 text-amber-800'
        : 'bg-[#00A89D]/10 text-[#00A89D]';
    const barClass = measure.over ? 'bg-red-500' : hasRoom ? 'bg-amber-500' : 'bg-[#00A89D]';

    output.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <span class="text-xs font-bold tracking-wider text-[#F15A29] uppercase">${escapeHtml(dest.label)}</span>
          ${isPrimary ? '<span class="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-[#002B5C] text-white font-semibold">Primary · Profile</span>' : ''}
        </div>
        <span class="text-sm font-bold px-3 py-1 rounded-full ${countClass}">${countLabelFull}</span>
      </div>
      ${hasRoom ? `<div class="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-900 dark:text-amber-200"><i class="fas fa-ruler-horizontal mr-2"></i>This bio has unused space for ${escapeHtml(dest.label)}. Aim for <strong>${targets.targetIdeal}–${targets.targetMax} ${targets.unit}</strong> (nearly the full ${measure.max}). Click <strong>Fill to Limit</strong> or describe edits below.</div>` : ''}
      <div class="w-full h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 mb-4 overflow-hidden">
        <div class="h-full rounded-full transition-all ${barClass}" style="width:${Math.min(100, measure.pct)}%"></div>
      </div>
      <div id="bio-output-text" class="text-base leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">${escapeHtml(text)}</div>
      <div class="mt-4 p-4 rounded-2xl bg-[#002B5C]/5 border border-[#002B5C]/10 text-sm text-gray-600 dark:text-gray-400">
        <i class="fas fa-paste text-[#00A89D] mr-2"></i><strong>Paste location:</strong> ${escapeHtml(dest.pasteTip || 'Your platform profile editor')}
      </div>
      <div class="mt-6 p-5 rounded-2xl border-2 border-[#00A89D]/25 bg-[#00A89D]/5">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
          <label class="text-base font-semibold text-[#00A89D] m-0" for="bio-feedback"><i class="fas fa-edit mr-2"></i>Edit or refine this bio</label>
          <span class="text-xs text-gray-500">Quick chips or your own notes</span>
        </div>
        <div id="bio-refine-chips" class="flex flex-wrap gap-2 mb-3"></div>
        <textarea id="bio-feedback" rows="3" class="w-full p-4 rounded-2xl border-2 border-[#00A89D] bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200" placeholder="e.g., Fill to 750 characters, mention VA loans, warmer tone…">${escapeHtml(savedFeedback)}</textarea>
        <button type="button" id="bio-refine-btn" class="mt-3 bg-[#002B5C] text-white py-3 px-8 rounded-full font-bold inline-flex items-center gap-2 hover:bg-black transition">
          <i class="fas fa-magic"></i> Apply Edit
        </button>
      </div>
      <div class="flex flex-wrap gap-3 mt-6">
        <button type="button" id="bio-copy-btn" class="bg-gradient-to-r from-[#00A89D] to-[#F15A29] text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 hover:opacity-90">
          <i class="fas fa-copy"></i> Copy Bio
        </button>
        <button type="button" id="bio-save-primary-btn" class="border-2 border-[#002B5C] text-[#002B5C] dark:text-white dark:border-white px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-[#002B5C] hover:text-white transition">
          <i class="fas fa-user-check"></i> Save as Primary Bio
        </button>
        <button type="button" id="bio-regenerate-btn" class="border-2 border-[#00A89D] text-[#00A89D] px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-[#00A89D]/10 transition">
          <i class="fas fa-sync-alt"></i> Another Version
        </button>
        ${hasRoom ? `<button type="button" id="bio-fill-limit-btn" class="border-2 border-amber-500 text-amber-700 dark:text-amber-300 px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-amber-500 hover:text-white transition"><i class="fas fa-expand-alt"></i> Fill to Limit</button>` : ''}
        ${measure.over ? `<button type="button" id="bio-trim-btn" class="border-2 border-[#F15A29] text-[#F15A29] px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-[#F15A29] hover:text-white transition"><i class="fas fa-compress-alt"></i> Trim to Fit</button>` : ''}
      </div>`;

    panel.classList.remove('hidden');
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    renderRefineChips();
    document.getElementById('bio-copy-btn')?.addEventListener('click', copyBio);
    document.getElementById('bio-save-primary-btn')?.addEventListener('click', saveAsPrimaryBio);
    document.getElementById('bio-regenerate-btn')?.addEventListener('click', () => regenerateBio());
    document.getElementById('bio-fill-limit-btn')?.addEventListener('click', () => fillBioToLimit(dest));
    document.getElementById('bio-trim-btn')?.addEventListener('click', () => trimBioToFit(dest));
    document.getElementById('bio-refine-btn')?.addEventListener('click', () => {
      const fb = (document.getElementById('bio-feedback')?.value || '').trim();
      if (!fb) {
        if (typeof window.showToast === 'function') window.showToast('Type a refinement or tap a quick edit chip.');
        return;
      }
      generateBio(fb);
    });
  }

  function copyBio() {
    const text = document.getElementById('bio-output-text')?.textContent || lastGeneratedText;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      if (typeof window.showToast === 'function') window.showToast('Bio copied — ready to paste!');
    });
  }

  function saveAsPrimaryBio() {
    const text = document.getElementById('bio-output-text')?.textContent || lastGeneratedText;
    if (!text.trim()) return;
    const dest = getSelectedDestination();
    const p = getCentralProfile();
    const history = Array.isArray(p.bioHistory) ? [...p.bioHistory] : [];

    const entry = {
      id: 'bio_' + Date.now(),
      text: text.trim(),
      destination: dest.key,
      destinationLabel: dest.label,
      createdAt: new Date().toISOString(),
      isPrimary: true
    };

    history.forEach((h) => { h.isPrimary = false; });
    history.unshift(entry);
    if (history.length > HISTORY_MAX) history.length = HISTORY_MAX;

    if (typeof window.patchUserProfile === 'function') {
      window.patchUserProfile(
        {
          professionalBio: text.trim(),
          professionalBioMeta: {
            destination: dest.key,
            destinationLabel: dest.label,
            limitType: dest.limitType,
            limit: dest.limit,
            updatedAt: new Date().toISOString()
          },
          bioHistory: history,
          bioBuilderDraft: collectDraftFromForm()
        },
        { showFeedback: true, feedbackMessage: 'Primary bio saved! Newsletter, Blog, Social & AI Coach will use it.' }
      );
    }

    renderOutput(text.trim(), dest, true);
    renderBioHistory();
    updatePrimaryBioStrip();
  }

  async function rewriteExistingBio() {
    const existing = (document.getElementById('bio-existing-paste')?.value || '').trim();
    if (!existing) {
      if (typeof window.showToast === 'function') {
        window.showToast('Paste your current bio in the box at the top first.');
      }
      return;
    }
    ensureWebsiteDestination();
    await generateBio(null, { rewriteExisting: true, existingBio: existing });
  }

  async function regenerateBio() {
    const existing = (document.getElementById('bio-output-text')?.textContent || lastGeneratedText || '').trim();
    if (!existing) {
      if (typeof window.showToast === 'function') {
        window.showToast('Generate a bio first, then try Another Version.');
      }
      return;
    }
    lastGeneratedText = existing;
    await generateBio(REGENERATE_PROMPT, { regenerate: true });
  }

  async function generateBio(feedback, options = {}) {
    const { regenerate = false, rewriteExisting = false, existingBio = '' } = options;

    if (bioGenerating) {
      console.warn('[bio-creator] Generation already in progress');
      return;
    }

    const checks = evaluateChecks();
    const essentialDone = checks.filter((c) => c.essential && c.done).length;
    const skipEssentials = regenerate || rewriteExisting || !!feedback || !!lastGeneratedText?.trim();
    if (!skipEssentials && essentialDone < MIN_ESSENTIALS) {
      scrollToFirstMissing();
      if (typeof window.showToast === 'function') {
        window.showToast(`Add ${MIN_ESSENTIALS - essentialDone} more essential field(s) for a strong bio.`);
      }
      return;
    }

    bioGenerating = true;
    bioUserCancelled = false;
    const genBtn = document.getElementById('generate-bio-btn');
    const rewriteBtn = document.getElementById('bio-rewrite-existing-btn');
    if (genBtn) genBtn.disabled = true;
    if (rewriteBtn) rewriteBtn.disabled = true;

    try {
      preflightBioApi({ forRegenerate: regenerate || !!lastGeneratedText?.trim() });
    } catch (preErr) {
      bioGenerating = false;
      if (genBtn) genBtn.disabled = false;
      if (rewriteBtn) rewriteBtn.disabled = false;
      if (typeof window.showToast === 'function') window.showToast(preErr.message);
      else alert(preErr.message);
      return;
    }

    bioAbortController = new AbortController();
    bioWatchdogTimer = setTimeout(() => {
      if (!bioGenerating) return;
      console.warn('[bio-creator] Watchdog timeout — aborting');
      bioAbortController?.abort();
    }, BIO_WATCHDOG_MS);

    showBioLoading(!!feedback || regenerate || rewriteExisting);
    const dest = getSelectedDestination();
    const prompt = rewriteExisting
      ? buildRewritePrompt(existingBio)
      : buildPrompt(feedback, lastGeneratedText);
    console.warn('[bio-creator] Starting API call…', {
      refine: !!feedback,
      regenerate,
      rewriteExisting,
      dest: dest.key,
      promptChars: prompt.length,
      timeoutMs: BIO_API_TIMEOUT_MS
    });

    try {
      const raw = await window.callGrokAPI(prompt, {
        temperature: rewriteExisting ? 0.55 : regenerate ? 0.85 : feedback ? 0.6 : 0.72,
        max_tokens: 950,
        timeoutMs: BIO_API_TIMEOUT_MS,
        skipKeyPrompt: true,
        signal: bioAbortController.signal,
        maxRetries: 3,
        onRetry: ({ attempt, maxRetries, delayMs }) => {
          const el = document.getElementById('bio-loading-elapsed');
          if (el) {
            el.textContent = `xAI is busy — auto-retry ${attempt}/${maxRetries} in ${Math.ceil(delayMs / 1000)}s…`;
          }
        }
      });

      if (!raw?.trim()) throw new Error('Empty response from AI');

      let text = parseBioResponse(raw);
      const skipLengthBoost = feedback && /shorter|shorten|trim|cut filler|compress/i.test(feedback);

      if (!skipLengthBoost) {
        text = await autoExpandBioLength(text, dest, bioAbortController);
      }

      const profileName = getCentralProfile().name || '';
      if (bioUsesThirdPersonLoVoice(text, profileName)) {
        console.warn('[bio-creator] Third-person LO voice detected — auto-correcting to first person…');
        const elapsedEl = document.getElementById('bio-loading-elapsed');
        if (elapsedEl) elapsedEl.textContent = 'Converting to first person (I/me/my)…';
        const fixPrompt = buildPrompt(
          `CRITICAL: This bio describes the real estate agent in third person (he/she/${profileName.split(/\s+/)[0] || 'name'}). Rewrite EVERY sentence in first person as the real estate agent speaking (I, me, my). Keep the same facts, destination, and length targets. Do not change client references (they/their is fine).`,
          text
        );
        const fixedRaw = await window.callGrokAPI(fixPrompt, {
          temperature: 0.5,
          max_tokens: 900,
          timeoutMs: BIO_API_TIMEOUT_MS,
          skipKeyPrompt: true,
          signal: bioAbortController.signal,
          maxRetries: 3,
          onRetry: ({ attempt, maxRetries, delayMs }) => {
            const el = document.getElementById('bio-loading-elapsed');
            if (el) el.textContent = `xAI is busy — auto-retry ${attempt}/${maxRetries} in ${Math.ceil(delayMs / 1000)}s…`;
          }
        });
        if (fixedRaw?.trim()) {
          text = parseBioResponse(fixedRaw);
        }
      }

      if (!skipLengthBoost) {
        text = await autoExpandBioLength(text, dest, bioAbortController);
      }

      lastGeneratedText = text;
      bioSessionReady = true;
      console.warn('[bio-creator] Generation complete ✓', { chars: text.length });
      renderOutput(text, dest, false);

      if (typeof window.patchUserProfile === 'function') {
        window.patchUserProfile({ bioBuilderDraft: collectDraftFromForm() }, { silent: true });
      }
    } catch (err) {
      if (bioUserCancelled) return;
      console.error('[bio-creator] Generation failed:', err);
      let msg = err.message || 'Generation failed.';
      if (msg.includes('Failed to fetch') || msg.includes('proxy')) {
        msg = 'Could not reach the API proxy. Run bash start-proxy.sh and keep it open on port 3000.';
      } else if (/api key|Invalid Grok|401|400|Incorrect API/i.test(msg)) {
        msg = 'Invalid API key. Click API Key in the header → paste a real xai- key from console.x.ai. The .env placeholder (xai-yourkeyhere) will not work.';
      } else if (msg.includes('timed out') || err.name === 'AbortError') {
        msg = 'Request timed out (~65s). The reasoning model can be slow — try again, or verify your API key and proxy are working.';
      } else if (/429|rate limit|temporarily at capacity|Too Many Requests/i.test(msg)) {
        msg = 'xAI is temporarily at capacity (rate limit). Wait 30–60 seconds, then click Try again or Another Version.';
      }
      failBioGeneration(msg);
    } finally {
      clearBioLoadingTimers();
      hideBioLoading();
      bioAbortController = null;
      bioGenerating = false;
      if (genBtn) genBtn.disabled = false;
      if (rewriteBtn) rewriteBtn.disabled = false;
      updateQualityChecklist();
    }
  }

  async function trimBioToFit(dest) {
    await generateBio(
      `Bio exceeds ${getLimitLabel(dest)}. Shorten aggressively while keeping the strongest human details and local market reference. Stay in first person (I/me/my — never he/she). Remove filler and redundancy.`
    );
  }

  async function fillBioToLimit(dest) {
    const text = document.getElementById('bio-output-text')?.textContent || lastGeneratedText || '';
    const measure = measureBio(text, dest);
    const targets = getLengthTargets(dest);
    await generateBio(buildLengthBoostPrompt(dest, measure, targets.targetMax));
  }

  async function expandBioToTarget(dest) {
    return fillBioToLimit(dest);
  }

  function restoreSavedBioOutput() {
    const p = getCentralProfile();
    if (p.professionalBio && p.professionalBioMeta) {
      const meta = p.professionalBioMeta;
      const dest = DESTINATIONS[meta.destination] || {
        key: meta.destination,
        label: meta.destinationLabel || 'Saved Bio',
        limitType: meta.limitType || 'chars',
        limit: meta.limit || 750,
        pasteTip: ''
      };
      lastGeneratedText = p.professionalBio;
      bioSessionReady = true;
      renderOutput(p.professionalBio, { ...dest, key: meta.destination }, true);
    }
    renderBioHistory();
    updatePrimaryBioStrip();
  }

  function renderBioHistory() {
    const el = document.getElementById('bio-history-list');
    if (!el) return;
    const p = getCentralProfile();
    const history = Array.isArray(p.bioHistory) ? p.bioHistory : [];
    if (!history.length) {
      el.innerHTML = '<p class="text-sm text-gray-500 italic m-0">Versions appear here after you <strong>Save as Primary Bio</strong>. Tip: save your best Google bio as primary, then generate separate versions for Zillow or LinkedIn.</p>';
      return;
    }

    el.innerHTML = history
      .map(
        (h) => `
      <div class="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-[#00A89D]/30 transition">
        <div class="min-w-0 flex-1">
          <div class="text-sm font-semibold text-[#002B5C] dark:text-white">${escapeHtml(h.destinationLabel || h.destination)} ${h.isPrimary ? '<span class="text-[10px] ml-1 px-1.5 py-0.5 rounded bg-[#00A89D]/15 text-[#00A89D]">Primary</span>' : ''}</div>
          <div class="text-xs text-gray-500 truncate mt-0.5">${escapeHtml((h.text || '').slice(0, 100))}…</div>
        </div>
        <div class="flex gap-2">
          <button type="button" class="bio-history-load text-xs font-semibold text-[#00A89D] hover:underline" data-id="${escapeHtml(h.id)}">Load</button>
          <button type="button" class="bio-history-copy text-xs font-semibold text-gray-600 hover:underline" data-id="${escapeHtml(h.id)}">Copy</button>
        </div>
      </div>`
      )
      .join('');

    el.querySelectorAll('.bio-history-load').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = history.find((h) => h.id === btn.dataset.id);
        if (!item) return;
        const dest = DESTINATIONS[item.destination] || { label: item.destinationLabel, limitType: 'chars', limit: 750, pasteTip: '' };
        lastGeneratedText = item.text;
        bioSessionReady = true;
        renderOutput(item.text, { ...dest, key: item.destination }, !!item.isPrimary);
      });
    });

    el.querySelectorAll('.bio-history-copy').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = history.find((h) => h.id === btn.dataset.id);
        if (item?.text) navigator.clipboard.writeText(item.text);
        if (typeof window.showToast === 'function') window.showToast('Copied!');
      });
    });
  }

  window.openBioTips = function openBioTips() {
    const modal = document.getElementById('bio-tips-modal');
    if (!modal) return;
    if (typeof window.openAppModal === 'function') window.openAppModal(modal);
    else {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  };

  window.closeBioTips = function closeBioTips() {
    const modal = document.getElementById('bio-tips-modal');
    if (!modal) return;
    if (typeof window.closeAppModal === 'function') window.closeAppModal(modal);
    else {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  };

  function wireBioCreator() {
    renderChipGroup('bio-service-chips', 'service', SERVICE_CHIPS);
    renderChipGroup('bio-who-chips', 'who', WHO_HELP_CHIPS);
    renderChipGroup('bio-diff-chips', 'diff', DIFF_CHIPS);
    renderChipGroup('bio-personal-chips', 'personal', PERSONAL_LIFE_CHIPS);
    renderStarterButtons();
    renderDestinationCards();

    const root = document.getElementById('bio-creator');
    if (!root) return;

    root.addEventListener('input', (e) => {
      if (e.target?.id === 'bio-years') updateBioYearsHint();
      if (e.target?.id === 'bio-existing-paste') updateExistingPasteMeta();
      updateQualityChecklist();
      scheduleDraftSave();
    });
    root.addEventListener('change', () => {
      updateQualityChecklist();
      scheduleDraftSave();
    });

    root.addEventListener('click', (e) => {
      const starter = e.target.closest('.bio-starter-btn');
      if (starter) {
        insertStarter(starter.dataset.field, parseInt(starter.dataset.idx, 10));
      }
    });

    document.getElementById('bio-sync-profile-btn')?.addEventListener('click', syncBioFromProfile);
    document.getElementById('bio-edit-profile-btn')?.addEventListener('click', () => {
      if (typeof window.openUserProfile === 'function') window.openUserProfile(true);
    });

    document.getElementById('bio-destination')?.addEventListener('change', () => {
      syncDestinationCards(document.getElementById('bio-destination')?.value);
      toggleCustomLimitRow();
      updateDestinationPanel();
    });

    document.getElementById('bio-rewrite-existing-btn')?.addEventListener('click', () => rewriteExistingBio());
    document.getElementById('generate-bio-btn')?.addEventListener('click', () => generateBio());

    syncBioFromProfile();
  }

  window.syncBioFromProfile = syncBioFromProfile;
  window.seedBioFieldsFromProfile = seedBioFieldsFromProfile;
  window.syncBioDestinationCards = syncDestinationCards;
  window.generateBio = generateBio;
  window.regenerateBio = regenerateBio;
  window.rewriteExistingBio = rewriteExistingBio;
  window.cancelBioGeneration = cancelBioGeneration;
  window.scrollToBioForm = function scrollToBioForm() {
    document.getElementById('bio-full-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  window.restoreSavedBioOutput = restoreSavedBioOutput;

  /** Console diagnostic: window.testBioConnection() */
  window.testBioConnection = async function testBioConnection() {
    try {
      resolveBioApiKey();
      const t0 = Date.now();
      const raw = await window.callGrokAPI('Reply with exactly: BIO TEST OK', {
        max_tokens: 20,
        timeoutMs: 30000,
        skipKeyPrompt: true
      });
      console.warn('[bio-creator] testBioConnection OK in', Date.now() - t0, 'ms →', raw);
      return { ok: true, ms: Date.now() - t0, raw };
    } catch (e) {
      console.error('[bio-creator] testBioConnection FAILED:', e.message);
      return { ok: false, error: e.message };
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireBioCreator);
  } else {
    wireBioCreator();
  }

  console.log('%c[bio-creator] Bio Builder v2 — coaching + platform cards', 'color:#00A89D');
})();