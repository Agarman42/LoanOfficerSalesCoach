/**
 * Guided newsletter setup wizard — writes to the same #newsletter-generator fields
 * as the full form. LO app first; mirror to realtor-sales-coach when stable.
 */
(function () {
  'use strict';

  const TOTAL_STEPS = 5;
  const STORAGE_KEY = 'nlWizardLastStep';
  const WIZARD_DOM_VERSION = '24';
  const PERSONAL_MIN_CHARS = 40;

  const STEP_META = [
    { title: 'Welcome', subtitle: 'Quick profile check' },
    { title: 'Audience & style', subtitle: 'Who + how it reads' },
    { title: 'Your story', subtitle: 'Personal update' },
    { title: 'Sections', subtitle: 'Pick, direct & extras' },
    { title: 'Review', subtitle: 'Confirm & generate' }
  ];

  const WIZARD_FIELD_MAP = [
    ['nl-wizard-audience', 'nl-audience'],
    ['nl-wizard-location', 'nl-location'],
    ['nl-wizard-tone', 'nl-tone'],
    ['nl-wizard-length', 'nl-length'],
    ['nl-wizard-newsletter-title', 'nl-title'],
    ['nl-wizard-color-bundle', 'nl-color-bundle'],
    ['nl-wizard-personal-text', 'nl-personal-text'],
    ['nl-wizard-photo', 'nl-personal-photo'],
    ['nl-wizard-video', 'nl-personal-video'],
    ['nl-wizard-blog-url', 'nl-blog-url'],
    ['nl-wizard-blog-title', 'nl-blog-title'],
    ['nl-wizard-specific', 'nl-specific']
  ];

  const SECTION_GROUPS = [
    {
      label: 'Core content',
      desc: 'AI-written from credible sources — steer topics on the next step.',
      items: [
        { id: 'nl-market', label: 'Market Updates', emoji: '📈', hint: 'Housing trends & market context for your area' },
        { id: 'nl-industry', label: 'Industry News', emoji: '📰', hint: 'Mortgage industry headlines & timely updates' },
        { id: 'nl-local', label: 'Local Update', emoji: '🎉', hint: 'Events, openings & neighborhood highlights' },
        { id: 'nl-recipes', label: 'Recipes', emoji: '🍳', hint: 'Seasonal favorite or cozy dish for the month' }
      ]
    },
    {
      label: 'Engagement',
      desc: 'Short, scannable value — picked from our curated library.',
      items: [
        { id: 'nl-fun', label: 'Fun Facts', emoji: '🤓', hint: 'Light break readers love to skim' },
        { id: 'nl-tip', label: 'Homeownership Tip', emoji: '🏡', hint: 'Practical tip for buyers & homeowners' },
        { id: 'nl-quote', label: 'Motivational Quote', emoji: '💪', hint: 'Quick inspiration to close the scroll' }
      ]
    },
    {
      label: 'Entertainment',
      desc: 'Optional personality — great for standing out in the inbox.',
      items: [
        { id: 'nl-dadjoke', label: 'Dad Joke', emoji: '😄', hint: 'Corny humor that gets forwarded' },
        { id: 'nl-puzzle', label: 'Brain Teaser', emoji: '🧩', hint: 'Trivia, word scramble, or riddle' }
      ]
    }
  ];

  const NL_CARD_CONTENT_WIDTH = 540;
  const NL_CARD_SIDE_PADDING = 30;
  const NL_MEDIA_SIZE_DEFAULT = 100;
  const NL_MEDIA_SIZE_MIN = 30;
  const NL_MEDIA_SIZE_MAX = 100;

  /** Curated library sections — shuffle / browse modals on step 4. */
  const CURATED_SECTIONS = [
    { key: 'fun', checkboxId: 'nl-fun', label: 'Fun Facts', emoji: '🤓', choiceCat: 'funFact', previewId: 'fun-fact-preview' },
    { key: 'tip', checkboxId: 'nl-tip', label: 'Homeownership Tip', emoji: '🏡', choiceCat: 'proTip', previewId: 'pro-tip-preview' },
    { key: 'quote', checkboxId: 'nl-quote', label: 'Motivational Quote', emoji: '💪', choiceCat: 'quote', previewId: 'quote-preview' },
    { key: 'dadjoke', checkboxId: 'nl-dadjoke', label: 'Dad Joke', emoji: '😄', choiceCat: 'dadJoke', previewId: 'dad-joke-preview' },
    { key: 'puzzle', checkboxId: 'nl-puzzle', label: 'Brain Teaser', emoji: '🧩', choiceCat: 'puzzle', previewId: 'brain-teaser-preview' }
  ];

  const CORE_DIRECTIONS = [
    { key: 'market', checkboxId: 'nl-market', inputId: 'nl-direction-market', wizardId: 'nl-wizard-direction-market', label: 'Market Updates' },
    { key: 'industry', checkboxId: 'nl-industry', inputId: 'nl-direction-industry', wizardId: 'nl-wizard-direction-industry', label: 'Industry News' },
    { key: 'local', checkboxId: 'nl-local', inputId: 'nl-direction-local', wizardId: 'nl-wizard-direction-local', label: 'Local Update' },
    { key: 'recipes', checkboxId: 'nl-recipes', inputId: 'nl-direction-recipes', wizardId: 'nl-wizard-direction-recipes', label: 'Recipes' }
  ];

  const STORY_PROMPTS = [
    { label: 'Recent closing', text: 'Just wrapped an amazing closing for the ___ family — their first home after years of saving. The kids were thrilled to pick their bedrooms! (Photo: us at the front door with their new keys.)' },
    { label: 'Community moment', text: 'Spent Saturday volunteering at our local food bank — grateful for this community we get to serve every day. (Photo: quick shot from our shift.)' },
    { label: 'Family / personal', text: 'This month has been full — between work and family we finally got to ___. Grateful for the little wins that keep us grounded.' },
    { label: 'Partner shout-out', text: 'Huge thanks to ___ at ___ Realty for another smooth partnership this month. Referral partners like this make our clients\' experience so much better.' }
  ];

  const PERSONAL_HISTORY_KEY = 'nl-personal-text-last';

  let currentStep = 1;
  let step4SubTab = 'content';
  let wizardEl = null;

  function $(id) {
    return document.getElementById(id);
  }

  function isPersistedField(formId) {
    const list = window.NL_PERSISTENT_FIELD_IDS;
    return Array.isArray(list) && list.includes(formId);
  }

  function persistFormValue(formId, value, options = {}) {
    const { silent = false } = options;
    const el = $(formId);
    if (!el) return;
    if (el.type === 'checkbox') {
      el.checked = !!value;
      try { localStorage.setItem(formId, el.checked ? '1' : '0'); } catch (e) {}
    } else {
      el.value = value ?? '';
      if (isPersistedField(formId)) {
        try { localStorage.setItem(formId, el.value); } catch (e) {}
      }
    }
    if (!silent) {
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function persistWizardSettings(options = {}) {
    const silent = options.silent !== false;
    WIZARD_FIELD_MAP.forEach(([wizId, formId]) => {
      if (!formId) return;
      const w = $(wizId);
      if (w) persistFormValue(formId, w.value, { silent });
    });
    CORE_DIRECTIONS.forEach((cfg) => {
      const w = $(cfg.wizardId);
      if (w) persistFormValue(cfg.inputId, w.value, { silent });
    });
    syncMediaSizeToForm();
  }

  function track(action, extra) {
    if (typeof window.trackCoachEvent === 'function') {
      window.trackCoachEvent({
        tool: 'newsletter-generator',
        action,
        eventName: 'newsletter_wizard',
        label: extra || action
      });
    }
  }

  function refreshNewsletterUi() {
    if (typeof window.updateNewsletterPreflightSummary === 'function') {
      window.updateNewsletterPreflightSummary();
    }
    const root = $('newsletter-generator');
    if (!root) return;
    root.querySelectorAll('input, select, textarea').forEach((el) => {
      if (el.id === 'nl-feedback' || el.id === 'nl-html-raw') return;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  function setCheckbox(id, checked) {
    const el = $(id);
    if (!el || el.type !== 'checkbox') return;
    el.checked = !!checked;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    syncWizardSectionToggle(id);
  }

  function syncWizardSectionToggle(formId) {
    const wiz = wizardEl?.querySelector(`[data-nl-wizard-section="${formId}"]`);
    const form = $(formId);
    if (wiz && form) wiz.checked = form.checked;
  }

  function syncAllWizardSectionToggles() {
    SECTION_GROUPS.forEach((g) => g.items.forEach((item) => syncWizardSectionToggle(item.id)));
    updateSectionCardVisuals();
    updateSectionMixStats();
    updateSelectedSectionsPreview();
    updateDirectionFieldsVisibility();
  }

  function updateSectionCardVisuals() {
    wizardEl?.querySelectorAll('[data-nl-wizard-section-card]').forEach((card) => {
      const id = card.getAttribute('data-nl-wizard-section-card');
      const checked = !!$(id)?.checked;
      card.classList.toggle('border-[#00A89D]', checked);
      card.classList.toggle('bg-[#00A89D]/8', checked);
      card.classList.toggle('shadow-sm', checked);
      card.classList.toggle('border-gray-200', !checked);
      card.classList.toggle('dark:border-gray-700', !checked);
      card.classList.toggle('bg-white', !checked);
      card.classList.toggle('dark:bg-gray-800/40', !checked);
    });
  }

  function buildSectionChipsHtml(items) {
    const chips = items
      .filter((item) => $(item.id)?.checked)
      .map((item) => `<span class="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-[#00A89D]/12 text-[#002B5C] dark:text-white border border-[#00A89D]/25">${item.emoji} ${item.label}</span>`);
    return chips;
  }

  function updateSelectedSectionsPreview() {
    const coreEl = $('nl-wizard-core-sections-preview');
    const engageEl = $('nl-wizard-engagement-sections-preview');
    if (coreEl) {
      const chips = buildSectionChipsHtml(SECTION_GROUPS[0].items);
      coreEl.innerHTML = chips.length
        ? chips.join('')
        : '<span class="text-xs text-gray-400 italic">No content sections yet — pick at least one below.</span>';
    }
    if (engageEl) {
      const engageItems = SECTION_GROUPS.slice(1).flatMap((g) => g.items);
      const chips = buildSectionChipsHtml(engageItems);
      engageEl.innerHTML = chips.length
        ? chips.join('')
        : '<span class="text-xs text-gray-400 italic">Optional — add fun facts, tips, or personality below.</span>';
    }
  }

  function setGroupSections(groupIndex, checked) {
    const group = SECTION_GROUPS[groupIndex];
    if (!group) return;
    group.items.forEach((item) => setCheckbox(item.id, checked));
    updateSectionCardVisuals();
    updateSectionMixStats();
    updateSelectedSectionsPreview();
    updateDirectionFieldsVisibility();
    updateWizardCuratedPanel();
  }

  function getCentralProfile() {
    try {
      if (typeof window.getUserProfile === 'function') return window.getUserProfile();
      return JSON.parse(localStorage.getItem('userProfile') || '{}');
    } catch (e) {
      return {};
    }
  }

  function getWizardColorBundleId() {
    const wizSelect = $('nl-wizard-color-bundle');
    const override = wizSelect ? String(wizSelect.value || '').trim() : '';
    if (override && window.NlColorBundles) return override;
    if (window.NlColorBundles && typeof window.NlColorBundles.readProfileBundleId === 'function') {
      return window.NlColorBundles.readProfileBundleId();
    }
    return 'coastal-teal';
  }

  function updateWizardColorPreview() {
    const preview = $('nl-wizard-color-bundle-preview');
    if (!preview || !window.NlColorBundles) return;
    const bundleId = getWizardColorBundleId();
    if (typeof window.NlColorBundles.renderBundleMiniPreview === 'function') {
      window.NlColorBundles.renderBundleMiniPreview(preview, bundleId, { showDescription: true });
    } else if (typeof window.NlColorBundles.renderBundlePreview === 'function') {
      window.NlColorBundles.renderBundlePreview(preview, bundleId);
    }
  }

  function updateStep2ProfileHint() {
    const hint = $('nl-wizard-step2-profile-hint');
    if (!hint) return;
    const p = getCentralProfile();
    const hasProfile = !!(p.name || p.email || p.location || p.localArea || p.tone || p.newsletterColorBundle);
    hint.classList.toggle('hidden', !hasProfile);
  }

  function syncWizardColorBundleOptions() {
    const wizSelect = $('nl-wizard-color-bundle');
    if (!wizSelect || !window.NlColorBundles || typeof window.NlColorBundles.populateBundleSelect !== 'function') return;
    let saved = '';
    try { saved = localStorage.getItem('nl-color-bundle') || ''; } catch (e) {}
    const formSelect = $('nl-color-bundle');
    if (formSelect && formSelect.value != null) saved = formSelect.value;
    window.NlColorBundles.populateBundleSelect(wizSelect, saved, { includeProfileDefault: true });
    wizSelect.value = saved;
    updateWizardColorPreview();
  }

  function onWizardColorBundleChange() {
    const wizSelect = $('nl-wizard-color-bundle');
    if (!wizSelect) return;
    const val = wizSelect.value;
    const formSelect = $('nl-color-bundle');
    if (formSelect) formSelect.value = val;
    try { localStorage.setItem('nl-color-bundle', val); } catch (e) {}
    updateWizardColorPreview();
    if (typeof window.refreshNewsletterColorScheme === 'function') {
      try { window.refreshNewsletterColorScheme(); } catch (e) {}
    }
  }

  function updateProfileCard() {
    const profile = getCentralProfile();
    const name = profile.name?.trim()
      || $('nl-name')?.value?.trim()
      || '—';
    const email = (profile.email || profile.workEmail || '').trim()
      || $('nl-email')?.value?.trim()
      || '—';
    const market = (profile.localArea || profile.market || profile.location || '').trim()
      || $('nl-location')?.value?.trim()
      || $('nl-wizard-location')?.value?.trim()
      || '—';
    const nameEl = $('nl-wizard-profile-name');
    const emailEl = $('nl-wizard-profile-email');
    const marketEl = $('nl-wizard-profile-market');
    if (nameEl) nameEl.textContent = name;
    if (emailEl) emailEl.textContent = email;
    if (marketEl) marketEl.textContent = market;

    const warn = $('nl-wizard-profile-warn');
    if (warn) {
      const missingMarket = !market || market === '—';
      warn.classList.toggle('hidden', !missingMarket);
    }
  }

  function updatePersonalCharMeter() {
    const enabled = $('nl-wizard-personal')?.checked;
    const text = ($('nl-wizard-personal-text')?.value || '').trim();
    const len = text.length;
    const wrap = $('nl-wizard-personal-meter');
    const count = $('nl-wizard-personal-count');
    const bar = $('nl-wizard-personal-bar');
    const hint = $('nl-wizard-personal-hint');
    if (!wrap) return;

    wrap.classList.toggle('hidden', !enabled);
    if (!enabled) return;

    const pct = Math.min(100, Math.round((len / PERSONAL_MIN_CHARS) * 100));
    if (count) count.textContent = `${len} / ${PERSONAL_MIN_CHARS} min`;
    if (bar) {
      bar.style.width = `${pct}%`;
      bar.className = `h-full rounded-full transition-all duration-300 ${len >= PERSONAL_MIN_CHARS ? 'bg-[#00A89D]' : 'bg-amber-400'}`;
    }
    if (hint) {
      hint.textContent = len >= PERSONAL_MIN_CHARS
        ? 'Looks good — specific details help readers connect.'
        : `Add ${PERSONAL_MIN_CHARS - len} more character${PERSONAL_MIN_CHARS - len === 1 ? '' : 's'} for a solid personal update.`;
      hint.className = `text-xs mt-1.5 m-0 ${len >= PERSONAL_MIN_CHARS ? 'text-[#00A89D]' : 'text-gray-500'}`;
    }
  }

  function togglePersonalFields() {
    const on = $('nl-wizard-personal')?.checked;
    $('nl-wizard-personal-fields')?.classList.toggle('hidden', !on);
    $('nl-wizard-personal-skip-note')?.classList.toggle('hidden', !!on);
    updatePersonalCharMeter();
    updateWizardMediaPreview();
  }

  function toggleBlogFields() {
    const on = $('nl-wizard-include-blog')?.checked;
    $('nl-wizard-blog-fields')?.classList.toggle('hidden', !on);
  }

  function looksLikeImageUrl(url) {
    const u = String(url || '').trim();
    if (!u) return false;
    if (/^data:image\//i.test(u)) return true;
    if (/\.(jpe?g|png|gif|webp|avif|bmp|svg)(\?|#|$)/i.test(u)) return true;
    return /\/(image|img|photo|media|upload|assets)\//i.test(u) || /[?&](format|fm)=(jpe?g|png|webp|gif)/i.test(u);
  }

  function extractYouTubeVideoId(url) {
    const s = String(url || '').trim();
    const m = s.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|live\/))([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  }

  function getWizardPhotoSizePercent() {
    const raw = parseInt($('nl-wizard-photo-size')?.value, 10);
    if (Number.isNaN(raw)) return NL_MEDIA_SIZE_DEFAULT;
    return Math.min(NL_MEDIA_SIZE_MAX, Math.max(NL_MEDIA_SIZE_MIN, raw));
  }

  function getWizardVideoSizePercent() {
    const raw = parseInt($('nl-wizard-video-size')?.value, 10);
    if (Number.isNaN(raw)) return NL_MEDIA_SIZE_DEFAULT;
    return Math.min(NL_MEDIA_SIZE_MAX, Math.max(NL_MEDIA_SIZE_MIN, raw));
  }

  function formatMediaSizeLabel(pct) {
    const px = Math.round(NL_CARD_CONTENT_WIDTH * pct / 100);
    return pct >= 100 ? `Full width (${px}px)` : `${pct}% (${px}px)`;
  }

  function syncMediaSizeToForm() {
    const photoSize = $('nl-wizard-photo-size');
    const videoSize = $('nl-wizard-video-size');
    const formPhoto = $('nl-personal-photo-size');
    const formVideo = $('nl-personal-video-size');
    if (photoSize && formPhoto) {
      formPhoto.value = photoSize.value;
      formPhoto.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (videoSize && formVideo) {
      formVideo.value = videoSize.value;
      formVideo.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (typeof window.updatePersonalMediaPreviews === 'function') {
      try { window.updatePersonalMediaPreviews(); } catch (e) {}
    }
  }

  function syncPersonalMediaToForm() {
    const pairs = [
      ['nl-wizard-photo', 'nl-personal-photo'],
      ['nl-wizard-video', 'nl-personal-video']
    ];
    pairs.forEach(([wizId, formId]) => {
      const w = $(wizId);
      const f = $(formId);
      if (w && f) {
        f.value = w.value || '';
        f.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    setCheckbox('nl-personal', $('nl-wizard-personal')?.checked);
    setCheckbox('nl-include-photo', $('nl-wizard-include-photo')?.checked);
    setCheckbox('nl-include-video', $('nl-wizard-include-video')?.checked);
    syncMediaSizeToForm();
  }

  function applyWizardPhotoPreviewSizing() {
    const img = $('nl-wizard-photo-preview-img');
    const stage = $('nl-wizard-photo-preview-stage');
    if (!img) return;
    const px = Math.round(NL_CARD_CONTENT_WIDTH * getWizardPhotoSizePercent() / 100);
    if (stage) {
      stage.style.maxWidth = `${NL_CARD_CONTENT_WIDTH}px`;
      stage.style.width = '100%';
      stage.style.boxSizing = 'border-box';
      stage.style.padding = `${NL_CARD_SIDE_PADDING}px`;
    }
    img.style.width = `${px}px`;
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
  }

  function applyWizardVideoPreviewSizing() {
    const thumb = $('nl-wizard-video-preview-thumb');
    const stage = $('nl-wizard-video-preview-stage');
    if (!thumb) return;
    const px = Math.round(NL_CARD_CONTENT_WIDTH * getWizardVideoSizePercent() / 100);
    if (stage) {
      stage.style.maxWidth = `${NL_CARD_CONTENT_WIDTH}px`;
      stage.style.width = '100%';
      stage.style.boxSizing = 'border-box';
      stage.style.padding = `${NL_CARD_SIDE_PADDING}px`;
    }
    thumb.style.width = `${px}px`;
    thumb.style.maxWidth = '100%';
    thumb.style.height = 'auto';
  }

  function updateWizardMediaPreview() {
    const personalOn = $('nl-wizard-personal')?.checked;
    const photoOn = $('nl-wizard-include-photo')?.checked;
    const videoOn = $('nl-wizard-include-video')?.checked;
    const photoUrl = ($('nl-wizard-photo')?.value || '').trim();
    const videoUrl = ($('nl-wizard-video')?.value || '').trim();

    const photoSizeWrap = $('nl-wizard-photo-size-wrap');
    const videoSizeWrap = $('nl-wizard-video-size-wrap');
    const photoSizeLabel = $('nl-wizard-photo-size-label');
    const videoSizeLabel = $('nl-wizard-video-size-label');
    const showPhotoControls = personalOn && photoOn;
    if (photoSizeWrap) photoSizeWrap.classList.toggle('hidden', !showPhotoControls);
    if (videoSizeWrap) videoSizeWrap.classList.toggle('hidden', !videoOn);
    if (photoSizeLabel) photoSizeLabel.textContent = formatMediaSizeLabel(getWizardPhotoSizePercent());
    if (videoSizeLabel) videoSizeLabel.textContent = formatMediaSizeLabel(getWizardVideoSizePercent());

    const photoWrap = $('nl-wizard-photo-preview-wrap');
    const photoImg = $('nl-wizard-photo-preview-img');
    const photoStatus = $('nl-wizard-photo-preview-status');
    if (photoWrap && photoImg && photoStatus) {
      if (!showPhotoControls || !photoUrl) {
        photoWrap.classList.add('hidden');
        photoImg.removeAttribute('src');
        delete photoImg.dataset.nlPreviewUrl;
      } else if (!looksLikeImageUrl(photoUrl) && !/^https?:\/\//i.test(photoUrl)) {
        photoWrap.classList.remove('hidden');
        photoImg.removeAttribute('src');
        photoStatus.innerHTML = '<span class="text-amber-700 dark:text-amber-300">⚠ Paste a full image URL (https://…)</span>';
      } else {
        photoWrap.classList.remove('hidden');
        const markLoaded = () => {
          photoStatus.innerHTML = '<span class="text-[#00A89D] font-medium">✓ Preview at newsletter width</span>';
        };
        const markFailed = () => {
          photoStatus.innerHTML = '<span class="text-amber-700 dark:text-amber-300">⚠ Could not load — check the URL is public &amp; direct</span>';
        };
        photoImg.onload = () => { applyWizardPhotoPreviewSizing(); markLoaded(); };
        photoImg.onerror = markFailed;
        applyWizardPhotoPreviewSizing();
        const cached = photoImg.dataset.nlPreviewUrl || '';
        if (cached === photoUrl && photoImg.complete) {
          if (photoImg.naturalWidth > 0) markLoaded();
          else markFailed();
        } else {
          photoImg.dataset.nlPreviewUrl = photoUrl;
          photoStatus.textContent = 'Loading preview…';
          photoImg.src = photoUrl;
        }
      }
    }

    const videoWrap = $('nl-wizard-video-preview-wrap');
    const videoThumb = $('nl-wizard-video-preview-thumb');
    const videoLink = $('nl-wizard-video-preview-link');
    const videoStatus = $('nl-wizard-video-preview-status');
    if (videoWrap && videoThumb && videoLink && videoStatus) {
      if (!videoOn || !videoUrl) {
        videoWrap.classList.add('hidden');
        videoThumb.removeAttribute('src');
        videoLink.removeAttribute('href');
      } else {
        const href = videoUrl.startsWith('http') ? videoUrl : `https://${videoUrl}`;
        const videoId = extractYouTubeVideoId(href);
        videoWrap.classList.remove('hidden');
        videoLink.href = href;
        if (videoId) {
          videoThumb.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          videoThumb.alt = 'YouTube thumbnail';
          videoThumb.onload = () => applyWizardVideoPreviewSizing();
          videoStatus.innerHTML = '<span class="text-[#00A89D] font-medium">✓ YouTube recognized — sized as in newsletter</span>';
        } else {
          videoThumb.removeAttribute('src');
          videoStatus.innerHTML = '<span class="text-amber-700 dark:text-amber-300">⚠ Use a YouTube or Shorts URL</span>';
        }
        applyWizardVideoPreviewSizing();
      }
    }
  }

  function getCuratedPreviewSnippet(previewId) {
    if (previewId === 'brain-teaser-preview'
      && window.NlEntertainment
      && typeof window.NlEntertainment.getSetupPreviewPlainText === 'function') {
      const text = window.NlEntertainment.getSetupPreviewPlainText().trim();
      if (text) return text;
    }
    const el = $(previewId);
    if (!el) return 'Shuffle or browse the library to pick one.';
    const text = (el.innerText || el.textContent || '').trim();
    return text || 'Shuffle or browse the library to pick one.';
  }

  function openCuratedChoiceModal(category) {
    if (typeof window.ensureNewsletterChoiceModal === 'function') {
      try { window.ensureNewsletterChoiceModal(); } catch (e) {}
    }
    if (typeof window.restoreNewsletterModals === 'function') {
      try { window.restoreNewsletterModals(); } catch (e) {}
    }
    if (typeof window.openNewsletterChoiceModal === 'function') {
      window.openNewsletterChoiceModal(category);
    } else if (typeof window._nlOpenChoice === 'function') {
      window._nlOpenChoice(category);
    }
  }

  function shuffleCuratedPick(category) {
    if (typeof window.regenerateRandom === 'function') {
      window.regenerateRandom(category);
    }
    updateWizardCuratedPanel();
  }

  function getActivePuzzleType() {
    if (window.NlEntertainment && typeof window.NlEntertainment.getActivePuzzleType === 'function') {
      return window.NlEntertainment.getActivePuzzleType();
    }
    const checked = document.querySelector('input[name="nl-puzzle-type"]:checked');
    return (checked && checked.value) || localStorage.getItem('nl-puzzle-type') || 'trivia';
  }

  function setWizardPuzzleType(type) {
    if (window.NlEntertainment && typeof window.NlEntertainment.setPuzzleType === 'function') {
      window.NlEntertainment.setPuzzleType(type);
    } else {
      document.querySelectorAll('input[name="nl-puzzle-type"]').forEach((r) => { r.checked = r.value === type; });
      try { localStorage.setItem('nl-puzzle-type', type); } catch (e) {}
    }
    refreshWizardCuratedPreviewText();
  }

  function updateWizardCuratedPanel() {
    const panel = $('nl-wizard-curated-panel');
    const rows = $('nl-wizard-curated-rows');
    if (!panel || !rows) return;

    const active = CURATED_SECTIONS.filter((c) => $(c.checkboxId)?.checked);
    panel.classList.toggle('hidden', active.length === 0);
    if (!active.length) {
      rows.innerHTML = '';
      return;
    }

    const puzzleType = getActivePuzzleType();
    rows.innerHTML = active.map((c) => {
      const snippet = getCuratedPreviewSnippet(c.previewId);
      const puzzleTypeBar = c.key === 'puzzle' ? `
        <div class="flex flex-wrap gap-1.5 mb-2">
          ${[
            { id: 'trivia', label: '🧠 Trivia' },
            { id: 'scramble', label: '🔤 Scramble' },
            { id: 'riddle', label: '❓ Riddle' }
          ].map((t) => `
            <button type="button" data-nl-wizard-puzzle-type="${t.id}" class="text-[11px] px-2.5 py-1 rounded-full border-2 font-semibold transition ${puzzleType === t.id ? 'border-[#00A89D] bg-[#00A89D]/10 text-[#002B5C]' : 'border-gray-200 text-gray-500 hover:border-[#00A89D]/40'}">${t.label}</button>
          `).join('')}
        </div>
      ` : '';
      return `
        <div class="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 p-4" data-nl-wizard-curated-key="${c.key}">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span class="text-sm font-semibold text-[#002B5C] dark:text-white">${c.label} ${c.emoji}</span>
            <div class="flex gap-1.5">
              <button type="button" data-nl-wizard-shuffle="${c.choiceCat}" class="text-xs px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-semibold hover:border-[#00A89D] hover:text-[#00A89D] transition" title="Pick random"><i class="fas fa-dice mr-1"></i>Shuffle</button>
              <button type="button" data-nl-wizard-choose="${c.choiceCat}" class="text-xs px-3 py-1.5 rounded-full bg-[#002B5C] text-white font-semibold hover:bg-[#001F44] transition">Browse library</button>
            </div>
          </div>
          ${puzzleTypeBar}
          <p class="text-sm text-gray-600 dark:text-gray-400 italic m-0 leading-snug line-clamp-4" data-nl-wizard-curated-preview="${c.previewId}">${snippet.replace(/</g, '&lt;')}</p>
        </div>
      `;
    }).join('');
  }

  function refreshWizardCuratedPreviewText() {
    CURATED_SECTIONS.forEach((c) => {
      const el = wizardEl?.querySelector(`[data-nl-wizard-curated-preview="${c.previewId}"]`);
      if (el) el.textContent = getCuratedPreviewSnippet(c.previewId);
    });
  }

  function hookNewsletterPreviewRefresh() {
    window.__nlRefreshWizardCuratedPreviews = refreshWizardCuratedPreviewText;
    if (window.__nlWizardPreviewHooked) return;
    const orig = window.updatePreviews;
    if (typeof orig !== 'function') return;
    window.updatePreviews = function () {
      orig.apply(this, arguments);
      refreshWizardCuratedPreviewText();
      updateWizardMediaPreview();
    };
    window.__nlWizardPreviewHooked = true;
  }

  function countSectionsInGroup(groupIndex) {
    const group = SECTION_GROUPS[groupIndex];
    if (!group) return 0;
    return group.items.filter((item) => $(item.id)?.checked).length;
  }

  function countCoreSections() {
    return countSectionsInGroup(0);
  }

  function countEngagementSections() {
    return countSectionsInGroup(1) + countSectionsInGroup(2);
  }

  function countSelectedContentSections() {
    return countCoreSections() + countEngagementSections();
  }

  function countSelectedSections() {
    let n = countSelectedContentSections();
    if ($('nl-personal')?.checked || $('nl-wizard-personal')?.checked) n += 1;
    return n;
  }

  function updateSectionMixStats() {
    const coreCountEl = $('nl-wizard-core-section-count');
    const engageCountEl = $('nl-wizard-engagement-section-count');
    const coreHintEl = $('nl-wizard-core-section-hint');
    const engageHintEl = $('nl-wizard-engagement-section-hint');
    const coreN = countCoreSections();
    const engageN = countEngagementSections();
    const totalN = coreN + engageN;
    const personalOn = $('nl-wizard-personal')?.checked || $('nl-personal')?.checked;
    const len = $('nl-wizard-length')?.value || $('nl-length')?.value || 'medium';

    if (coreCountEl) coreCountEl.textContent = String(coreN);
    if (engageCountEl) engageCountEl.textContent = String(engageN);

    if (coreHintEl) {
      coreHintEl.textContent = coreN === 0
        ? 'Pick at least one content section for the body of your newsletter.'
        : coreN === 1 ? '1 core section — add more for a fuller issue.' : `${coreN} core sections selected.`;
      coreHintEl.className = `text-xs m-0 ${coreN === 0 ? 'text-amber-600 dark:text-amber-400' : 'text-[#00A89D]'}`;
    }
    if (engageHintEl) {
      engageHintEl.textContent = engageN === 0
        ? 'All optional — great for personality and skim value.'
        : `${engageN} engagement block${engageN === 1 ? '' : 's'} selected.`;
      engageHintEl.className = 'text-xs text-gray-500 m-0';
    }

    const totalWeight = totalN + (personalOn ? 1 : 0);
    const mixHints = {
      short: totalWeight <= 4 ? 'Lean mix for Short length.' : 'Quite full for Short — consider trimming.',
      medium: totalWeight >= 4 && totalWeight <= 8 ? 'Balanced for Standard length.' : totalWeight < 4 ? 'Light edition — room to add more.' : 'Rich mix — may run long on Standard.',
      long: totalWeight >= 6 ? 'Great depth for Long length.' : 'Room for more sections on a Long edition.'
    };
    const mixEl = $('nl-wizard-section-mix-hint');
    if (mixEl) mixEl.textContent = mixHints[len] || mixHints.medium;
  }

  function updateStep2ValidationHints() {
    const loc = ($('nl-wizard-location')?.value || '').trim();
    const hint = $('nl-wizard-location-hint');
    if (hint) hint.classList.toggle('hidden', !loc);
  }

  function savePersonalStoryHistory() {
    const text = ($('nl-wizard-personal-text')?.value || '').trim();
    if (!text) return;
    try { localStorage.setItem(PERSONAL_HISTORY_KEY, text); } catch (e) {}
    updatePersonalHistoryUI();
  }

  function loadPersonalStoryHistory() {
    try { return localStorage.getItem(PERSONAL_HISTORY_KEY) || ''; } catch (e) { return ''; }
  }

  function updatePersonalHistoryUI() {
    const last = (loadPersonalStoryHistory() || '').trim();
    const trigger = $('nl-wizard-personal-history-trigger');
    const snippet = $('nl-wizard-personal-history-snippet');
    if (snippet) snippet.textContent = last || '';
    // Compact "Last issue" chip inside the free-type box — only when history exists
    if (trigger) trigger.classList.toggle('hidden', !last);
    if (!last) $('nl-wizard-personal-history-popover')?.classList.add('hidden');
  }

  function applyPersonalStoryHistory() {
    const last = loadPersonalStoryHistory();
    const ta = $('nl-wizard-personal-text');
    if (!ta || !last) return;
    const personalCb = $('nl-wizard-personal');
    if (personalCb && !personalCb.checked) {
      personalCb.checked = true;
      personalCb.dispatchEvent(new Event('change', { bubbles: true }));
    }
    $('nl-wizard-personal-fields')?.classList.remove('hidden');
    ta.value = last;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    updatePersonalCharMeter();
    $('nl-wizard-personal-history-popover')?.classList.add('hidden');
    if (window.showToast) window.showToast('Loaded your last personal update.', 'success');
  }

  function setStep4SubTab(tab) {
    step4SubTab = tab === 'engagement' ? 'engagement' : 'content';
    renderStep4SubTab();
    updateWizardNavButtons();
    scrollWizardToTop();
  }

  function renderStep4SubTab() {
    wizardEl?.querySelectorAll('[data-nl-wizard-step4-panel]').forEach((panel) => {
      const tab = panel.getAttribute('data-nl-wizard-step4-panel');
      panel.classList.toggle('hidden', tab !== step4SubTab);
    });
    wizardEl?.querySelectorAll('[data-nl-wizard-step4-tab]').forEach((btn) => {
      const tab = btn.getAttribute('data-nl-wizard-step4-tab');
      const active = tab === step4SubTab;
      btn.className = [
        'flex-1 text-xs sm:text-sm font-semibold py-2.5 px-3 rounded-lg transition',
        active ? 'bg-white dark:bg-gray-800 text-[#002B5C] dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
      ].join(' ');
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
      btn.setAttribute('tabindex', active ? '0' : '-1');
    });
    wizardEl?.querySelectorAll('[data-nl-wizard-step4-panel]').forEach((panel) => {
      const tab = panel.getAttribute('data-nl-wizard-step4-panel');
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab === 'engagement' ? 'nl-wizard-step4-tab-engagement' : 'nl-wizard-step4-tab-content');
    });
    if (step4SubTab === 'engagement') {
      updateWizardCuratedPanel();
    }
    updateSectionMixStats();
    updateSelectedSectionsPreview();
  }

  function setContinueBusy(busy) {
    const nextBtn = $('nl-wizard-next');
    if (!nextBtn) return;
    if (busy) {
      nextBtn.disabled = true;
      nextBtn.textContent = 'Saving…';
      nextBtn.classList.add('opacity-70');
    } else {
      nextBtn.disabled = false;
      nextBtn.textContent = getContinueButtonLabel();
      nextBtn.classList.remove('opacity-70');
    }
  }

  function getContinueButtonLabel() {
    if (currentStep === 4 && step4SubTab === 'content') return 'Continue to engagement';
    if (currentStep === 4 && step4SubTab === 'engagement') return 'Continue to review';
    return 'Continue';
  }

  function updateWizardNavButtons() {
    const nextBtn = $('nl-wizard-next');
    if (nextBtn && nextBtn.textContent !== 'Saving…') {
      nextBtn.textContent = getContinueButtonLabel();
    }
  }

  function updateWizardCoreDirectionUI() {
    CORE_DIRECTIONS.forEach((cfg) => {
      const card = wizardEl?.querySelector(`[data-nl-wizard-section-card="${cfg.checkboxId}"]`);
      const wrap = card?.querySelector(`[data-nl-wizard-core-direction="${cfg.key}"]`);
      const checked = $(cfg.checkboxId)?.checked;
      const val = ($(cfg.wizardId)?.value || $(cfg.inputId)?.value || '').trim();
      const toggleLabel = wrap?.querySelector('.nl-wizard-dir-toggle-label');
      const badge = card?.querySelector('.nl-wizard-dir-badge');
      if (wrap) wrap.classList.toggle('hidden', !checked);
      if (toggleLabel) {
        toggleLabel.textContent = val ? 'Edit direction ✓' : 'Add direction or URL (optional)';
      }
      if (badge) badge.classList.toggle('hidden', !val || !checked);
    });
  }

  function updateDirectionFieldsVisibility() {
    updateWizardCoreDirectionUI();
  }

  function readFormIntoWizard() {
    WIZARD_FIELD_MAP.forEach(([wizId, formId]) => {
      const w = $(wizId);
      const f = formId ? $(formId) : null;
      if (!w) return;
      if (formId === null) {
        w.value = '';
        return;
      }
      if (f) w.value = f.value || '';
    });

    CORE_DIRECTIONS.forEach((cfg) => {
      const w = $(cfg.wizardId);
      const f = $(cfg.inputId);
      if (w && f) w.value = f.value || '';
    });

    const wizPersonal = $('nl-wizard-personal');
    if (wizPersonal) wizPersonal.checked = $('nl-personal')?.checked !== false;
    const wizBlog = $('nl-wizard-include-blog');
    if (wizBlog) wizBlog.checked = !!$('nl-include-blog')?.checked;
    const wizRef = $('nl-wizard-include-referral');
    if (wizRef) wizRef.checked = $('nl-include-referral')?.checked !== false;
    const wizPhoto = $('nl-wizard-include-photo');
    if (wizPhoto) wizPhoto.checked = $('nl-include-photo')?.checked !== false;
    const wizVideo = $('nl-wizard-include-video');
    if (wizVideo) wizVideo.checked = !!$('nl-include-video')?.checked;

    const wizPhotoSize = $('nl-wizard-photo-size');
    const formPhotoSize = $('nl-personal-photo-size');
    if (wizPhotoSize && formPhotoSize) wizPhotoSize.value = formPhotoSize.value || String(NL_MEDIA_SIZE_DEFAULT);
    const wizVideoSize = $('nl-wizard-video-size');
    const formVideoSize = $('nl-personal-video-size');
    if (wizVideoSize && formVideoSize) wizVideoSize.value = formVideoSize.value || String(NL_MEDIA_SIZE_DEFAULT);

    syncAllWizardSectionToggles();
    togglePersonalFields();
    toggleBlogFields();
    updateProfileCard();
    updateWizardColorPreview();
    updatePersonalCharMeter();
    updateWizardMediaPreview();
  }

  function writeWizardIntoForm(options = {}) {
    const silent = options.silent !== false;
    const syncUi = options.syncUi === true;

    WIZARD_FIELD_MAP.forEach(([wizId, formId]) => {
      if (!formId) return;
      const w = $(wizId);
      if (w) persistFormValue(formId, w.value, { silent });
    });

    setCheckbox('nl-personal', $('nl-wizard-personal')?.checked);
    setCheckbox('nl-include-photo', $('nl-wizard-include-photo')?.checked);
    setCheckbox('nl-include-video', $('nl-wizard-include-video')?.checked);
    setCheckbox('nl-include-blog', $('nl-wizard-include-blog')?.checked);
    setCheckbox('nl-include-referral', $('nl-wizard-include-referral')?.checked);

    syncMediaSizeToForm();

    CORE_DIRECTIONS.forEach((cfg) => {
      const wiz = $(cfg.wizardId);
      const wizVal = (wiz?.value || '').trim();
      persistFormValue(cfg.inputId, wizVal, { silent });
    });

    if (syncUi) refreshNewsletterUi();
  }

  function buildReviewPanel() {
    writeWizardIntoForm({ syncUi: true });
    if (typeof window.updateNewsletterPreflightSummary === 'function') {
      window.updateNewsletterPreflightSummary();
    }

    const chips = $('nl-preflight-chips')?.innerHTML || '';
    const warnings = $('nl-preflight-warnings');
    const badge = $('nl-preflight-ready-badge');
    const reviewChips = $('nl-wizard-review-chips');
    const reviewWarnings = $('nl-wizard-review-warnings');
    const reviewBadge = $('nl-wizard-review-badge');
    const generateBtn = $('nl-wizard-generate');

    if (reviewChips) reviewChips.innerHTML = chips || '<span class="text-xs text-gray-500">No sections selected yet.</span>';

    if (reviewWarnings && warnings) {
      const hasWarn = !warnings.classList.contains('hidden') && warnings.innerHTML.trim();
      reviewWarnings.classList.toggle('hidden', !hasWarn);
      reviewWarnings.innerHTML = hasWarn ? warnings.innerHTML : '';
    }

    if (reviewBadge && badge) {
      reviewBadge.textContent = badge.textContent;
      reviewBadge.className = badge.className.replace('mb-2', '');
    }

    const personalOn = $('nl-wizard-personal')?.checked;
    const personalLen = ($('nl-wizard-personal-text')?.value || '').trim().length;
    const anySection = countSelectedSections() > 0;
    const blockers = [];
    if (personalOn && personalLen < PERSONAL_MIN_CHARS) {
      blockers.push(`Personal update needs ${PERSONAL_MIN_CHARS - personalLen} more characters.`);
    }
    if (!anySection && !personalOn) {
      blockers.push('Select at least one content section or include a personal update.');
    }

    const blockerEl = $('nl-wizard-review-blockers');
    if (blockerEl) {
      if (blockers.length) {
        blockerEl.classList.remove('hidden');
        blockerEl.innerHTML = blockers.map((b) => `<li>${b}</li>`).join('');
      } else {
        blockerEl.classList.add('hidden');
        blockerEl.innerHTML = '';
      }
    }

    if (generateBtn) {
      generateBtn.disabled = blockers.length > 0;
      generateBtn.classList.toggle('opacity-50', blockers.length > 0);
      generateBtn.classList.toggle('cursor-not-allowed', blockers.length > 0);
    }

    updateReviewOutline();
  }

  function buildIssueOutlineItems() {
    const items = [];
    items.push({ emoji: '📰', label: 'Header & hero image', note: 'Title, branding, hero' });

    SECTION_GROUPS[0].items.forEach((item) => {
      if ($(item.id)?.checked) {
        const dir = CORE_DIRECTIONS.find((c) => c.checkboxId === item.id);
        const directed = dir && ($(dir.inputId)?.value || '').trim();
        items.push({ emoji: item.emoji, label: item.label, note: directed ? 'Directed' : '' });
      }
    });
    SECTION_GROUPS.slice(1).forEach((group) => {
      group.items.forEach((item) => {
        if ($(item.id)?.checked) items.push({ emoji: item.emoji, label: item.label });
      });
    });

    if ($('nl-wizard-include-blog')?.checked) {
      const blogTitle = ($('nl-wizard-blog-title')?.value || '').trim();
      items.push({ emoji: '📝', label: 'Blog feature', note: blogTitle || 'Before personal note' });
    }

    const personalOn = $('nl-wizard-personal')?.checked;
    if (personalOn) {
      const len = ($('nl-wizard-personal-text')?.value || '').trim().length;
      items.push({
        emoji: '❤️',
        label: 'Personal Update',
        note: len >= PERSONAL_MIN_CHARS ? 'A Note From [you]' : 'Needs more detail'
      });
    }
    if ($('nl-wizard-include-video')?.checked) {
      items.push({ emoji: '▶️', label: 'Personal video', note: 'After personal note' });
    }
    if ($('nl-wizard-include-referral')?.checked) {
      items.push({ emoji: '🤝', label: 'Referral ask', note: 'Before footer' });
    }
    items.push({ emoji: '✉️', label: 'Disclaimer', note: 'Compliance footer only' });
    if ($('nl-puzzle')?.checked) {
      items.push({ emoji: '🔍', label: 'Brain teaser answer', note: 'Fine print at very bottom' });
    }
    return items;
  }

  function updateReviewOutline() {
    const list = $('nl-wizard-review-outline');
    const wrap = $('nl-wizard-review-outline-wrap');
    if (!list) return;
    const items = buildIssueOutlineItems();
    if (wrap) wrap.classList.toggle('hidden', !items.length);
    list.innerHTML = items.map((item, i) => {
      const note = item.note ? `<span class="text-xs text-gray-400 font-normal"> — ${item.note}</span>` : '';
      return `<li class="leading-snug"><span aria-hidden="true">${item.emoji}</span> <span class="font-medium">${item.label}</span>${note}</li>`;
    }).join('');
  }

  function showStepError(msg) {
    const el = $('nl-wizard-step-error');
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
      const loc = ($('nl-wizard-location')?.value || '').trim();
      if (!loc) {
        showStepError('Add your local market so we can write relevant content.');
        $('nl-wizard-location')?.focus();
        return false;
      }
    }

    if (currentStep === 3) {
      const personalOn = $('nl-wizard-personal')?.checked;
      const len = ($('nl-wizard-personal-text')?.value || '').trim().length;
      if (personalOn && len < PERSONAL_MIN_CHARS) {
        showStepError(`Personal update is short — add ${PERSONAL_MIN_CHARS - len} more characters, or uncheck "Include Personal Update" to skip.`);
        return false;
      }
    }

    if (currentStep === 4 && step4SubTab === 'engagement') {
      const contentN = countSelectedContentSections();
      const personalOn = $('nl-wizard-personal')?.checked;
      if (contentN === 0 && !personalOn) {
        showStepError('Select at least one section, or go back and include a personal update.');
        return false;
      }
      if (contentN === 0 && personalOn) {
        showStepError('Add at least one content or engagement section — personal update alone makes a very thin newsletter.');
        return false;
      }
    }

    return true;
  }

  function scrollWizardToTop() {
    const scrollEl = $('nl-wizard-scroll');
    if (scrollEl) scrollEl.scrollTop = 0;
  }

  function renderStepNav() {
    const nav = $('nl-wizard-step-nav');
    if (!nav) return;
    nav.innerHTML = STEP_META.map((meta, i) => {
      const step = i + 1;
      const active = step === currentStep;
      const done = step < currentStep;
      const cls = [
        'nl-wizard-nav-pill flex-1 min-w-0 text-center py-2 px-1 rounded-xl transition text-[10px] sm:text-xs font-semibold leading-tight',
        active ? 'bg-[#00A89D] text-white shadow-sm' : '',
        !active && done ? 'bg-[#00A89D]/15 text-[#00A89D] hover:bg-[#00A89D]/25 cursor-pointer' : '',
        !active && !done ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer' : ''
      ].filter(Boolean).join(' ');
      return `<button type="button" class="${cls}" data-nl-wizard-goto="${step}" ${active ? 'disabled' : ''} aria-current="${active ? 'step' : 'false'}"><span class="block truncate">${meta.title}</span></button>`;
    }).join('');
  }

  function renderStep() {
    if (!wizardEl) return;

    wizardEl.querySelectorAll('[data-nl-wizard-step]').forEach((panel) => {
      const step = parseInt(panel.getAttribute('data-nl-wizard-step'), 10);
      panel.classList.toggle('hidden', step !== currentStep);
    });

    const progress = $('nl-wizard-progress');
    const label = $('nl-wizard-step-label');
    const backBtn = $('nl-wizard-back');
    const nextBtn = $('nl-wizard-next');
    const skipBtn = $('nl-wizard-skip');
    const generateBtn = $('nl-wizard-generate');

    const meta = STEP_META[currentStep - 1];
    if (progress) progress.style.width = `${(currentStep / TOTAL_STEPS) * 100}%`;
    if (label) {
      label.textContent = `Step ${currentStep} of ${TOTAL_STEPS} — ${meta?.title || ''}`;
    }
    const sub = $('nl-wizard-step-sub');
    if (sub) sub.textContent = meta?.subtitle || '';

    if (backBtn) backBtn.classList.toggle('invisible', currentStep <= 1);
    if (nextBtn) nextBtn.classList.toggle('hidden', currentStep >= TOTAL_STEPS);
    if (skipBtn) {
      skipBtn.classList.toggle('hidden', currentStep !== 3);
      skipBtn.textContent = 'Skip personal story';
    }
    if (generateBtn) generateBtn.classList.toggle('hidden', currentStep !== TOTAL_STEPS);
    updateWizardNavButtons();

    renderStepNav();
    showStepError('');

    if (currentStep === 1) updateProfileCard();
    if (currentStep === 2) {
      updateWizardColorPreview();
      updateStep2ValidationHints();
      updateStep2ProfileHint();
      focusWizardStepEntry();
    }
    if (currentStep === 3) {
      updatePersonalCharMeter();
      updateWizardMediaPreview();
      updatePersonalHistoryUI();
    }
    if (currentStep === 4) {
      syncAllWizardSectionToggles();
      renderStep4SubTab();
      updateWizardCoreDirectionUI();
      updateSectionMixStats();
    }
    if (currentStep === TOTAL_STEPS) buildReviewPanel();

    try { localStorage.setItem(STORAGE_KEY, String(currentStep)); } catch (e) {}

    scrollWizardToTop();
    requestAnimationFrame(scrollWizardToTop);

    if (currentStep !== 2) focusWizardStepEntry();
  }

  function isWizardTypingTarget(el) {
    if (!el) return false;
    const tag = el.tagName;
    if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (tag === 'INPUT') {
      const type = (el.getAttribute('type') || 'text').toLowerCase();
      return !['button', 'submit', 'checkbox', 'radio', 'range', 'file'].includes(type);
    }
    return !!el.isContentEditable;
  }

  function getWizardFocusableElements(root) {
    if (!root) return [];
    return Array.from(root.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter((el) => el.offsetParent !== null || el === document.activeElement);
  }

  function focusWizardStepEntry() {
    if (!wizardEl || wizardEl.classList.contains('hidden')) return;
    const panel = wizardEl.querySelector(`[data-nl-wizard-step="${currentStep}"]:not(.hidden)`);
    if (!panel) return;
    const preferred = panel.querySelector('[data-nl-wizard-initial-focus]')
      || panel.querySelector('input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])');
    if (preferred && typeof preferred.focus === 'function') {
      try { preferred.focus({ preventScroll: true }); } catch (e) { preferred.focus(); }
    }
  }

  function handleWizardFocusTrap(e) {
    if (!wizardEl || wizardEl.classList.contains('hidden') || e.key !== 'Tab') return;
    const dialog = wizardEl.querySelector('[role="dialog"]');
    const scope = dialog || wizardEl;
    const focusable = getWizardFocusableElements(scope);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function goToStep(step, options = {}) {
    const target = Math.max(1, Math.min(TOTAL_STEPS, step));
    if (target === currentStep && !(target === 4 && options.step4Tab)) return;
    if (currentStep === 3) savePersonalStoryHistory();
    writeWizardIntoForm({ silent: true });
    currentStep = target;
    if (target === 4) {
      step4SubTab = options.step4Tab === 'engagement' ? 'engagement' : 'content';
    }
    readFormIntoWizard();
    renderStep();
  }

  function goStep(delta) {
    if (delta < 0 && currentStep === 4 && step4SubTab === 'engagement') {
      setStep4SubTab('content');
      showStepError('');
      return;
    }

    if (delta > 0 && !validateCurrentStep()) return;

    if (delta > 0 && currentStep === 4 && step4SubTab === 'content') {
      setContinueBusy(true);
      writeWizardIntoForm({ silent: true });
      requestAnimationFrame(() => {
        setStep4SubTab('engagement');
        setContinueBusy(false);
      });
      return;
    }

    const nextStep = Math.max(1, Math.min(TOTAL_STEPS, currentStep + delta));
    if (nextStep === currentStep) return;

    if (delta > 0) {
      setContinueBusy(true);
      if (currentStep === 3) savePersonalStoryHistory();
      writeWizardIntoForm({ silent: true });
    }

    const prevStep = currentStep;
    currentStep = nextStep;
    if (nextStep === 4 && delta > 0) step4SubTab = 'content';
    if (nextStep === 4 && delta < 0 && prevStep === TOTAL_STEPS) step4SubTab = 'engagement';
    if (delta < 0) readFormIntoWizard();

    requestAnimationFrame(() => {
      renderStep();
      setContinueBusy(false);
    });
  }

  function handleSkip() {
    if (currentStep === 3) {
      const wizPersonal = $('nl-wizard-personal');
      if (wizPersonal) wizPersonal.checked = false;
      togglePersonalFields();
      setCheckbox('nl-personal', false);
    }
    goStep(1);
  }

  function buildCoreSectionCard(item) {
    const cfg = CORE_DIRECTIONS.find((c) => c.checkboxId === item.id);
    if (!cfg) return '';
    return `
      <div data-nl-wizard-section-card="${item.id}" class="sm:col-span-2 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 transition">
        <label class="flex items-start gap-3 p-3.5 cursor-pointer hover:border-[#00A89D]/40 rounded-2xl">
          <input type="checkbox" data-nl-wizard-section="${item.id}" class="mt-0.5 w-5 h-5 text-[#00A89D] flex-shrink-0 rounded">
          <span class="flex-1 min-w-0">
            <span class="block text-sm font-semibold text-[#002B5C] dark:text-white leading-snug">${item.label} <span aria-hidden="true">${item.emoji}</span></span>
            <span class="block text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">${item.hint || ''}</span>
          </span>
          <span class="nl-wizard-dir-badge hidden shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#00A89D]/15 text-[#00A89D]">Directed</span>
        </label>
        <div data-nl-wizard-core-direction="${cfg.key}" class="nl-wizard-core-direction hidden px-3 pb-3">
          <button type="button" class="nl-wizard-dir-toggle w-full flex items-center justify-between gap-2 text-left text-xs font-semibold text-[#00A89D] hover:text-[#008F85] py-2 px-3 rounded-xl border border-dashed border-[#00A89D]/40 hover:border-[#00A89D] hover:bg-[#00A89D]/5 transition">
            <span class="nl-wizard-dir-toggle-label">Add direction or URL (optional)</span>
            <i class="fas fa-chevron-down nl-wizard-dir-chevron text-[10px] transition-transform duration-200"></i>
          </button>
          <div class="nl-wizard-dir-panel hidden mt-2 space-y-1">
            <p class="text-[11px] text-gray-500 m-0">Topic, stat, or article URL — we'll cite sources in this section.</p>
            <textarea id="${cfg.wizardId}" rows="2" maxlength="500" class="nl-wizard-direction-input w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm resize-y" placeholder="e.g., inventory up 12% locally — or paste an article link"></textarea>
          </div>
        </div>
      </div>
    `;
  }

  function buildSectionGroupHtml(group, gi) {
    return `
      <div class="mb-6 last:mb-0">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-1">
          <p class="text-xs font-bold uppercase tracking-wider text-[#002B5C]/80 dark:text-gray-400 m-0">${group.label}</p>
          <div class="flex gap-2 text-[11px] font-semibold">
            <button type="button" data-nl-wizard-group-all="${gi}" class="text-[#00A89D] hover:underline">Select all</button>
            <span class="text-gray-300">|</span>
            <button type="button" data-nl-wizard-group-none="${gi}" class="text-gray-500 hover:underline">Clear</button>
          </div>
        </div>
        ${group.desc ? `<p class="text-[11px] text-gray-500 mb-3 m-0">${group.desc}</p>` : ''}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          ${group.items.map((item) => {
            if (group.label === 'Core content') return buildCoreSectionCard(item);
            return `
              <label data-nl-wizard-section-card="${item.id}" class="flex items-start gap-3 p-3.5 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 hover:border-[#00A89D]/40 cursor-pointer transition">
                <input type="checkbox" data-nl-wizard-section="${item.id}" class="mt-0.5 w-5 h-5 text-[#00A89D] flex-shrink-0 rounded">
                <span class="flex-1 min-w-0">
                  <span class="block text-sm font-semibold text-[#002B5C] dark:text-white leading-snug">${item.label} <span aria-hidden="true">${item.emoji}</span></span>
                  <span class="block text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">${item.hint || ''}</span>
                </span>
              </label>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function buildCoreSectionPickerHtml() {
    return buildSectionGroupHtml(SECTION_GROUPS[0], 0);
  }

  function buildEngagementSectionPickerHtml() {
    return SECTION_GROUPS.slice(1).map((group, i) => buildSectionGroupHtml(group, i + 1)).join('');
  }

  function ensureWizardDom() {
    const existing = $('nl-wizard-overlay');
    if (existing && (existing.dataset.nlWizardVersion !== WIZARD_DOM_VERSION || !$('nl-wizard-step4-tabs') || !$('nl-wizard-paste-video') || !existing.querySelector('a[href="https://8upload.com/"]'))) {
      existing.remove();
      wizardEl = null;
    }
    if ($('nl-wizard-overlay')) {
      wizardEl = $('nl-wizard-overlay');
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'nl-wizard-overlay';
    overlay.className = 'hidden fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/55 backdrop-blur-sm';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'nl-wizard-heading');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.dataset.nlWizardVersion = WIZARD_DOM_VERSION;

    overlay.innerHTML = `
      <div class="bg-white dark:bg-gray-900 w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col">
        <div class="shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-5 sm:px-6 py-4">
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="min-w-0">
              <h3 id="nl-wizard-heading" class="text-lg sm:text-xl font-bold text-[#002B5C] dark:text-white m-0">Guided Newsletter Setup</h3>
              <p id="nl-wizard-step-label" class="text-sm text-gray-500 dark:text-gray-400 mt-1 m-0"></p>
              <p id="nl-wizard-step-sub" class="text-xs text-gray-400 mt-0.5 m-0"></p>
            </div>
            <button type="button" id="nl-wizard-close" class="shrink-0 w-9 h-9 rounded-full border border-gray-200 dark:border-gray-600 text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition" aria-label="Close wizard">&times;</button>
          </div>
          <div id="nl-wizard-step-nav" class="flex gap-1 mb-3 overflow-x-auto pb-0.5"></div>
          <div class="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div id="nl-wizard-progress" class="h-full bg-gradient-to-r from-[#00A89D] to-[#F15A29] transition-all duration-300" style="width:16%"></div>
          </div>
        </div>

        <div id="nl-wizard-scroll" class="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4">
          <div id="nl-wizard-step-error" class="hidden text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3" role="alert"></div>

          <!-- Step 1: Welcome -->
          <div data-nl-wizard-step="1">
            <div class="rounded-2xl bg-gradient-to-br from-[#00A89D]/10 to-[#002B5C]/5 border border-[#00A89D]/25 p-5 mb-4">
              <p class="text-sm text-gray-700 dark:text-gray-300 m-0 leading-relaxed">
                <strong class="text-[#002B5C] dark:text-white">About 3 minutes</strong> — we'll walk you through audience, your personal story, section mix, and optional direction. The full setup page stays available if you want to fine-tune later.
              </p>
            </div>
            <div id="nl-wizard-profile-card" class="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
              <div class="mb-3">
                <span class="text-xs font-bold uppercase tracking-wider text-[#00A89D]">From your profile</span>
                <p class="text-[11px] text-gray-500 dark:text-gray-400 m-0 mt-1">Pulled automatically — updates when you open this wizard or visit the newsletter tool.</p>
              </div>
              <dl class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm m-0">
                <div><dt class="text-gray-400 text-xs mb-0.5">Name</dt><dd id="nl-wizard-profile-name" class="font-semibold text-[#002B5C] dark:text-white m-0 truncate">—</dd></div>
                <div><dt class="text-gray-400 text-xs mb-0.5">Email</dt><dd id="nl-wizard-profile-email" class="font-semibold text-[#002B5C] dark:text-white m-0 truncate">—</dd></div>
                <div><dt class="text-gray-400 text-xs mb-0.5">Market</dt><dd id="nl-wizard-profile-market" class="font-semibold text-[#002B5C] dark:text-white m-0 truncate">—</dd></div>
              </dl>
              <p id="nl-wizard-profile-warn" class="hidden text-xs text-amber-700 dark:text-amber-300 mt-3 mb-0">Tip: Open <strong>My Profile</strong> to set your local market — local sections pull from there. Your company signature adds when you send in Outlook.</p>
            </div>
            <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-2 m-0 pl-0 list-none">
              <li class="flex gap-2"><span class="text-[#00A89D]">✓</span> Confirm who you're writing for</li>
              <li class="flex gap-2"><span class="text-[#00A89D]">✓</span> Add your personal story (highest-open section)</li>
              <li class="flex gap-2"><span class="text-[#00A89D]">✓</span> Choose sections + curated library picks</li>
              <li class="flex gap-2"><span class="text-[#00A89D]">✓</span> Review everything, then generate</li>
            </ul>
            <p id="nl-wizard-resume-offer" class="hidden mt-4 text-xs text-gray-500 m-0"></p>
          </div>

          <!-- Step 2: Audience -->
          <div data-nl-wizard-step="2" class="hidden">
            <p id="nl-wizard-step2-profile-hint" class="hidden text-xs text-[#00A89D] bg-[#00A89D]/8 border border-[#00A89D]/20 rounded-xl px-3 py-2 mb-3 m-0">
              <i class="fas fa-user-check mr-1" aria-hidden="true"></i> Empty fields are filled from <strong>My Profile</strong> when you open the wizard — change anything for this issue.
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Who you're writing for and how this issue should read.</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1" for="nl-wizard-audience">Audience</label>
                <select id="nl-wizard-audience" class="w-full p-3 rounded-xl border-2 border-[#00A89D] bg-white dark:bg-gray-800 text-sm"></select>
                <p class="text-[11px] text-gray-400 mt-1 m-0">Shapes tone and examples in the AI draft.</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1" for="nl-wizard-location">Local market <span class="text-[#F15A29]">*</span></label>
                <input type="text" id="nl-wizard-location" class="w-full p-3 rounded-xl border-2 border-[#00A89D] bg-white dark:bg-gray-800 text-sm" placeholder="City, State" required>
                <p id="nl-wizard-location-hint" class="hidden text-[11px] text-[#00A89D] mt-1 m-0"><i class="fas fa-check-circle"></i> Market set</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1" for="nl-wizard-tone">Tone</label>
                <select id="nl-wizard-tone" class="w-full p-3 rounded-xl border-2 border-[#00A89D] bg-white dark:bg-gray-800 text-sm"></select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1" for="nl-wizard-length">Length</label>
                <select id="nl-wizard-length" class="w-full p-3 rounded-xl border-2 border-[#00A89D] bg-white dark:bg-gray-800 text-sm"></select>
              </div>
            </div>
            <div class="mt-4">
              <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1" for="nl-wizard-newsletter-title">Newsletter title <span class="font-normal text-gray-400">(optional)</span></label>
              <input type="text" id="nl-wizard-newsletter-title" class="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" placeholder="e.g., The Lending Edge | March 2026 — leave blank for auto">
            </div>
            <div class="mt-4 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/50">
              <label for="nl-wizard-color-bundle" class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                <i class="fas fa-palette text-[#00A89D] mr-1" aria-hidden="true"></i> Color scheme
              </label>
              <select id="nl-wizard-color-bundle" class="w-full p-3 rounded-xl border-2 border-[#00A89D]/40 bg-white dark:bg-gray-800 text-sm" aria-describedby="nl-wizard-color-bundle-help"></select>
              <p id="nl-wizard-color-bundle-help" class="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 mb-0">Live preview updates as you pick. Uses your profile default unless you choose another bundle.</p>
              <div class="flex justify-center w-full mt-3">
                <div id="nl-wizard-color-bundle-preview" class="flex flex-col items-center w-full max-w-[220px]" aria-live="polite" aria-label="Live color preview"></div>
              </div>
            </div>
          </div>

          <!-- Step 3: Personal -->
          <div data-nl-wizard-step="3" class="hidden">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3"><strong class="text-[#002B5C] dark:text-white">This is the section people open first.</strong> Share a real win, family moment, or community story — specific beats generic.</p>
            <label class="flex items-center gap-2 mb-3 cursor-pointer">
              <input type="checkbox" id="nl-wizard-personal" class="w-4 h-4 text-[#00A89D]" checked>
              <span class="text-sm font-semibold text-[#00A89D]">Include Personal Update</span>
            </label>
            <p id="nl-wizard-personal-skip-note" class="hidden text-xs text-gray-500 mb-3">Personal update skipped — you can still generate; opens may be lower without a human story.</p>
            <div id="nl-wizard-personal-fields">
              <div class="flex flex-wrap gap-2 mb-3" id="nl-wizard-story-prompts"></div>
              <div class="relative" id="nl-wizard-personal-text-wrap">
                <textarea id="nl-wizard-personal-text" rows="5" class="w-full p-4 pr-24 rounded-2xl border-2 border-[#00A89D] bg-white dark:bg-gray-800 text-sm resize-y" placeholder="e.g., Just wrapped an amazing closing for the Martinez family…"></textarea>
                <div id="nl-wizard-personal-history-trigger" class="hidden absolute right-3 top-3 z-10">
                  <button type="button" id="nl-wizard-personal-history-load-btn"
                          class="nl-wizard-history-pill text-[10px] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-full px-2.5 py-0.5 bg-white/95 dark:bg-gray-800/95 hover:border-[#00A89D] hover:text-[#00A89D] transition shadow-sm font-medium"
                          title="Load the personal update from your last issue">
                    Last issue
                  </button>
                  <div id="nl-wizard-personal-history-popover" class="hidden absolute right-0 top-full mt-1.5 w-72 max-w-[calc(100vw-3rem)] p-3 rounded-xl border border-gray-200 dark:border-gray-600 shadow-lg bg-white dark:bg-gray-800 text-left z-20">
                    <p class="text-[10px] font-bold uppercase tracking-wide text-gray-400 m-0 mb-1.5">What you wrote last issue</p>
                    <p id="nl-wizard-personal-history-snippet" class="text-xs text-gray-700 dark:text-gray-200 m-0 mb-2 max-h-28 overflow-y-auto leading-relaxed"></p>
                    <button type="button" id="nl-wizard-personal-history-use" class="text-xs px-3 py-1.5 rounded-full bg-[#00A89D] text-white font-semibold hover:bg-[#008F85] transition">Use this text</button>
                  </div>
                </div>
              </div>
              <div id="nl-wizard-personal-meter" class="mt-2 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/50">
                <div class="flex items-center justify-between gap-2 mb-1.5">
                  <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Personal update length</span>
                  <span id="nl-wizard-personal-count" class="text-xs font-semibold text-gray-500">0 / 40 min</span>
                </div>
                <div class="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div id="nl-wizard-personal-bar" class="h-full rounded-full bg-amber-400 transition-all duration-300" style="width:0%"></div>
                </div>
                <p id="nl-wizard-personal-hint" class="text-xs mt-1.5 text-gray-500 m-0">Write at least 40 characters with real details.</p>
              </div>
              <div class="space-y-4 mt-4">
                <div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50/50 dark:bg-gray-800/30">
                  <label class="flex items-center gap-2 mb-3 cursor-pointer">
                    <input type="checkbox" id="nl-wizard-include-photo" class="w-4 h-4 text-[#00A89D]" checked>
                    <span class="text-sm font-semibold text-[#002B5C] dark:text-white">Personal photo</span>
                  </label>
                  <div class="flex gap-2 mb-2">
                    <input type="text" id="nl-wizard-photo" class="flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" placeholder="Paste direct image URL">
                    <button type="button" id="nl-wizard-paste-photo" class="shrink-0 text-xs px-3 py-2 rounded-full border border-[#002B5C]/20 font-semibold text-[#002B5C] dark:text-gray-200 hover:bg-[#002B5C]/5" title="Paste from clipboard">Paste</button>
                  </div>
                  <div id="nl-wizard-photo-size-wrap" class="hidden mt-3">
                    <div class="flex items-center justify-between gap-2 mb-1">
                      <label for="nl-wizard-photo-size" class="text-xs font-medium text-gray-600 dark:text-gray-400">Size in newsletter</label>
                      <span id="nl-wizard-photo-size-label" class="text-xs font-semibold text-[#00A89D]">Full width (540px)</span>
                    </div>
                    <input type="range" id="nl-wizard-photo-size" min="30" max="100" step="5" value="100" class="w-full h-2 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-[#00A89D] cursor-pointer">
                    <div class="flex justify-between text-[10px] text-gray-400 mt-0.5"><span>Smaller</span><span>Full width</span></div>
                  </div>
                  <div id="nl-wizard-photo-preview-wrap" class="hidden mt-3 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900/50">
                    <div class="p-3 bg-gray-100/80 dark:bg-gray-900/80 overflow-x-auto">
                      <div id="nl-wizard-photo-preview-stage" class="w-full mx-auto min-h-[80px] flex items-center justify-center rounded-lg border border-dashed border-gray-300/80 dark:border-gray-600 bg-white/60 dark:bg-gray-800/40">
                        <img id="nl-wizard-photo-preview-img" alt="Photo preview" class="block h-auto rounded-lg shadow-sm">
                      </div>
                    </div>
                    <p id="nl-wizard-photo-preview-status" class="text-xs px-3 py-2 m-0 text-gray-500 border-t border-gray-200 dark:border-gray-700"></p>
                  </div>
                  <div class="mt-3 p-3 rounded-xl border border-[#00A89D]/25 bg-[#00A89D]/5 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    <p class="m-0 mb-1"><i class="fas fa-lightbulb text-[#00A89D] mr-1" aria-hidden="true"></i><strong class="text-[#002B5C] dark:text-white">Free image host — no account required</strong></p>
                    <p class="m-0">Upload at <a href="https://8upload.com/" target="_blank" rel="noopener noreferrer" class="text-[#00A89D] font-semibold underline hover:text-[#F15A29]">8upload.com</a>, then copy the <strong>Hotlink / Direct link</strong> (not the page URL) and paste it above — that works best. Same tip for <strong>headshots</strong> and <strong>company logos</strong>.</p>
                  </div>
                </div>
                <div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50/50 dark:bg-gray-800/30">
                  <label class="flex items-center gap-2 mb-3 cursor-pointer">
                    <input type="checkbox" id="nl-wizard-include-video" class="w-4 h-4 text-[#00A89D]">
                    <span class="text-sm font-semibold text-[#002B5C] dark:text-white">YouTube video</span>
                  </label>
                  <div class="flex gap-2 mb-2">
                    <input type="text" id="nl-wizard-video" class="flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" placeholder="YouTube or Shorts URL">
                    <button type="button" id="nl-wizard-paste-video" class="shrink-0 text-xs px-3 py-2 rounded-full border border-[#002B5C]/20 font-semibold text-[#002B5C] dark:text-gray-200 hover:bg-[#002B5C]/5" title="Paste from clipboard">Paste</button>
                  </div>
                  <div id="nl-wizard-video-size-wrap" class="hidden mt-3">
                    <div class="flex items-center justify-between gap-2 mb-1">
                      <label for="nl-wizard-video-size" class="text-xs font-medium text-gray-600 dark:text-gray-400">Size in newsletter</label>
                      <span id="nl-wizard-video-size-label" class="text-xs font-semibold text-[#00A89D]">Full width (540px)</span>
                    </div>
                    <input type="range" id="nl-wizard-video-size" min="30" max="100" step="5" value="100" class="w-full h-2 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-[#00A89D] cursor-pointer">
                    <div class="flex justify-between text-[10px] text-gray-400 mt-0.5"><span>Smaller</span><span>Full width</span></div>
                  </div>
                  <div id="nl-wizard-video-preview-wrap" class="hidden mt-3 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900/50">
                    <div class="p-3 bg-gray-100/80 dark:bg-gray-900/80 overflow-x-auto">
                      <div id="nl-wizard-video-preview-stage" class="w-full mx-auto min-h-[80px] flex items-center justify-center rounded-lg border border-dashed border-gray-300/80 dark:border-gray-600 bg-white/60 dark:bg-gray-800/40">
                        <a id="nl-wizard-video-preview-link" href="#" target="_blank" rel="noopener" class="block rounded-lg shadow-sm">
                          <img id="nl-wizard-video-preview-thumb" alt="Video thumbnail" class="block h-auto rounded-lg">
                        </a>
                      </div>
                    </div>
                    <p id="nl-wizard-video-preview-status" class="text-xs px-3 py-2 m-0 text-gray-500 border-t border-gray-200 dark:border-gray-700"></p>
                  </div>
                  <div class="mt-3 p-3 rounded-xl border border-[#00A89D]/25 bg-[#00A89D]/5 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    <p class="m-0 mb-1"><i class="fas fa-video text-[#00A89D] mr-1" aria-hidden="true"></i><strong class="text-[#002B5C] dark:text-white">Free video link</strong></p>
                    <p class="m-0">Use a free <a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer" class="text-[#00A89D] font-semibold underline hover:text-[#F15A29]">YouTube</a> account — <a href="https://www.youtube.com/upload" target="_blank" rel="noopener noreferrer" class="text-[#00A89D] font-semibold underline hover:text-[#F15A29]">upload your video or Short</a>, set it to <strong>Unlisted</strong> or <strong>Public</strong>, then paste the share URL above.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 4: Sections -->
          <div data-nl-wizard-step="4" class="hidden">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Choose your content sections first, then pick engagement extras. Your personal story from the previous step always leads the email.</p>
            <div id="nl-wizard-step4-tabs" class="flex gap-1 mb-4 p-1 rounded-xl bg-gray-100 dark:bg-gray-800" role="tablist" aria-label="Section setup tabs">
              <button type="button" role="tab" id="nl-wizard-step4-tab-content" data-nl-wizard-step4-tab="content" aria-controls="nl-wizard-step4-panel-content" aria-selected="true" class="flex-1 text-xs sm:text-sm font-semibold py-2.5 px-3 rounded-lg transition">Content sections</button>
              <button type="button" role="tab" id="nl-wizard-step4-tab-engagement" data-nl-wizard-step4-tab="engagement" aria-controls="nl-wizard-step4-panel-engagement" aria-selected="false" class="flex-1 text-xs sm:text-sm font-semibold py-2.5 px-3 rounded-lg transition">Engagement</button>
            </div>
            <p id="nl-wizard-section-mix-hint" class="text-[11px] text-gray-400 mb-4 m-0 text-center"></p>

            <div data-nl-wizard-step4-panel="content" id="nl-wizard-step4-panel-content">
              <div class="rounded-2xl border border-[#00A89D]/25 bg-[#00A89D]/5 p-4 mb-4">
                <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2">
                  <span class="text-sm text-gray-700 dark:text-gray-300"><strong id="nl-wizard-core-section-count" class="text-[#002B5C] dark:text-white">0</strong> content sections</span>
                  <span id="nl-wizard-core-section-hint" class="text-xs text-gray-500 m-0"></span>
                </div>
                <div id="nl-wizard-core-sections-preview" class="flex flex-wrap gap-1.5 min-h-[24px]"></div>
              </div>
              <div id="nl-wizard-section-grid-core">${buildCoreSectionPickerHtml()}</div>
              <div class="mt-5 space-y-4 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50/50 dark:bg-gray-800/30">
                <label class="flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer bg-white dark:bg-gray-800/50">
                  <input type="checkbox" id="nl-wizard-include-blog" class="mt-1 w-4 h-4 text-[#00A89D]">
                  <span class="text-sm"><span class="font-semibold text-[#002B5C] dark:text-white">Feature a blog post</span><br><span class="text-gray-500">Recycle content you've already created.</span></span>
                </label>
                <div id="nl-wizard-blog-fields" class="hidden ml-7 space-y-2">
                  <input type="url" id="nl-wizard-blog-url" class="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" placeholder="Blog post URL">
                  <input type="text" id="nl-wizard-blog-title" class="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" placeholder="Blog title (optional)">
                </div>
                <label class="flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer bg-white dark:bg-gray-800/50">
                  <input type="checkbox" id="nl-wizard-include-referral" class="mt-1 w-4 h-4 text-[#00A89D]" checked>
                  <span class="text-sm"><span class="font-semibold text-[#002B5C] dark:text-white">Include referral ask</span><br><span class="text-gray-500">Soft line before the footer.</span></span>
                </label>
                <div>
                  <label class="block text-sm font-semibold text-[#002B5C] dark:text-white mb-1" for="nl-wizard-specific">Extra instructions <span class="font-normal text-gray-400">(optional)</span></label>
                  <textarea id="nl-wizard-specific" rows="2" class="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm resize-y" placeholder="e.g., Emphasize first-time buyers · Prepare in Spanish"></textarea>
                </div>
              </div>
            </div>

            <div data-nl-wizard-step4-panel="engagement" id="nl-wizard-step4-panel-engagement" class="hidden">
              <div class="rounded-2xl border border-[#F15A29]/25 bg-[#F15A29]/5 p-4 mb-4">
                <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2">
                  <span class="text-sm text-gray-700 dark:text-gray-300"><strong id="nl-wizard-engagement-section-count" class="text-[#002B5C] dark:text-white">0</strong> engagement blocks</span>
                  <span id="nl-wizard-engagement-section-hint" class="text-xs text-gray-500 m-0"></span>
                </div>
                <div id="nl-wizard-engagement-sections-preview" class="flex flex-wrap gap-1.5 min-h-[24px]"></div>
              </div>
              <div id="nl-wizard-section-grid-engagement">${buildEngagementSectionPickerHtml()}</div>
              <div id="nl-wizard-curated-panel" class="hidden mt-5 rounded-2xl border border-[#F15A29]/25 bg-gradient-to-br from-[#F15A29]/6 to-transparent p-4 sm:p-5">
                <div class="mb-3">
                  <p class="text-[10px] font-bold uppercase tracking-wider text-[#F15A29] m-0 mb-1">Curated library picks</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 m-0">Shuffle for a random pick, or browse the full library. These inject into your newsletter after generation.</p>
                </div>
                <div id="nl-wizard-curated-rows" class="space-y-3"></div>
              </div>
            </div>
            <p class="text-[10px] text-gray-400 mt-4 m-0 text-center">Audience, title, sections &amp; directions are saved automatically for next time.</p>
          </div>

          <!-- Step 5: Review -->
          <div data-nl-wizard-step="5" class="hidden">
            <div class="flex flex-wrap items-center gap-2 mb-4">
              <span id="nl-wizard-review-badge" class="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[2px] text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-2.5 py-1 rounded-full">REVIEW SETUP</span>
              <span class="text-sm text-gray-500">Matches the summary on the full setup page.</span>
            </div>
            <div id="nl-wizard-review-outline-wrap" class="mb-4 rounded-2xl border border-[#00A89D]/25 bg-[#00A89D]/5 p-4">
              <p class="text-[10px] font-bold uppercase tracking-wider text-[#00A89D] m-0 mb-2">Issue outline</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 m-0 mb-3">Typical layout — matches how we build and inject your newsletter. Content blocks in the middle may shift slightly; blog, personal note, referral, and footer stay in these positions.</p>
              <ol id="nl-wizard-review-outline" class="m-0 pl-5 space-y-1.5 text-sm text-[#002B5C] dark:text-white list-decimal"></ol>
            </div>
            <div id="nl-wizard-review-chips" class="flex flex-wrap gap-2 min-h-[28px] mb-4"></div>
            <ul id="nl-wizard-review-warnings" class="hidden mb-4 space-y-1.5 text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl px-4 py-3 list-disc pl-8 m-0"></ul>
            <ul id="nl-wizard-review-blockers" class="hidden mb-4 space-y-1.5 text-xs text-red-800 dark:text-red-200 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl px-4 py-3 list-disc pl-8 m-0"></ul>
            <div class="flex flex-wrap gap-2 text-xs">
              <button type="button" data-nl-wizard-edit="2" class="px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-[#00A89D] transition">Edit audience</button>
              <button type="button" data-nl-wizard-edit="3" class="px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-[#00A89D] transition">Edit story</button>
              <button type="button" data-nl-wizard-edit="4" class="px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-[#00A89D] transition">Edit sections</button>
              <button type="button" data-nl-wizard-edit="4-engagement" class="px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-[#00A89D] transition">Edit engagement</button>
            </div>
            <p class="text-xs text-gray-400 mt-4 m-0">Generation usually takes 30–60 seconds. You can tweak anything on the full setup page after.</p>
          </div>
        </div>

        <div class="shrink-0 px-5 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-wrap items-center justify-between gap-3">
          <button type="button" id="nl-wizard-full-form" class="text-xs text-[#00A89D] hover:underline font-semibold">Open full setup page</button>
          <div class="flex items-center gap-2 ml-auto">
            <button type="button" id="nl-wizard-back" class="px-4 py-2.5 rounded-full border border-gray-300 dark:border-gray-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">Back</button>
            <button type="button" id="nl-wizard-skip" class="hidden px-4 py-2.5 rounded-full text-sm font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition">Skip</button>
            <button type="button" id="nl-wizard-next" class="px-5 py-2.5 rounded-full bg-[#00A89D] hover:bg-[#008F85] text-white text-sm font-semibold transition">Continue</button>
            <button type="button" id="nl-wizard-generate" class="hidden px-5 py-2.5 rounded-full bg-gradient-to-r from-[#00A89D] to-[#F15A29] text-white text-sm font-bold shadow-md hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed">Generate newsletter</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    wizardEl = overlay;

    cloneSelectOptions('nl-audience', 'nl-wizard-audience');
    cloneSelectOptions('nl-tone', 'nl-wizard-tone');
    cloneSelectOptions('nl-length', 'nl-wizard-length');
    syncWizardColorBundleOptions();

    const promptsEl = $('nl-wizard-story-prompts');
    if (promptsEl) {
      promptsEl.innerHTML = STORY_PROMPTS.map((p, i) => `
        <button type="button" data-nl-wizard-prompt="${i}" class="text-xs px-3 py-1.5 rounded-full border border-[#00A89D]/40 text-[#00A89D] font-semibold hover:bg-[#00A89D]/10 transition">${p.label}</button>
      `).join('');
    }

    wireWizardEvents();
  }

  function wireWizardEvents() {
    if (!wizardEl || wizardEl.dataset.wired === '1') return;
    wizardEl.dataset.wired = '1';

    $('nl-wizard-close')?.addEventListener('click', closeNewsletterWizard);
    $('nl-wizard-back')?.addEventListener('click', () => goStep(-1));
    $('nl-wizard-next')?.addEventListener('click', () => goStep(1));
    $('nl-wizard-skip')?.addEventListener('click', handleSkip);
    $('nl-wizard-generate')?.addEventListener('click', finishAndGenerate);
    $('nl-wizard-full-form')?.addEventListener('click', openFullForm);


    wizardEl.querySelectorAll('[data-nl-wizard-step4-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-nl-wizard-step4-tab');
        if (tab) setStep4SubTab(tab);
      });
    });

    const historyTrigger = $('nl-wizard-personal-history-trigger');
    const historyPopover = $('nl-wizard-personal-history-popover');
    const historyLoadBtn = $('nl-wizard-personal-history-load-btn');
    historyLoadBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!loadPersonalStoryHistory()) return;
      if (historyPopover && historyPopover.classList.contains('hidden')) {
        updatePersonalHistoryUI();
        historyPopover.classList.remove('hidden');
      } else {
        applyPersonalStoryHistory();
      }
    });
    $('nl-wizard-personal-history-use')?.addEventListener('click', (e) => {
      e.preventDefault();
      applyPersonalStoryHistory();
    });
    // Save on blur so full-form + wizard share history even before Generate
    const wizPersonalTa = $('nl-wizard-personal-text');
    if (wizPersonalTa && !wizPersonalTa.dataset.nlHistoryBlurWired) {
      wizPersonalTa.dataset.nlHistoryBlurWired = '1';
      wizPersonalTa.addEventListener('blur', () => {
        const text = (wizPersonalTa.value || '').trim();
        if (text.length >= 20) savePersonalStoryHistory();
      });
    }
    updatePersonalHistoryUI();

    wizardEl.querySelectorAll('[data-nl-wizard-group-all]').forEach((btn) => {
      btn.addEventListener('click', () => {
        setGroupSections(parseInt(btn.getAttribute('data-nl-wizard-group-all'), 10), true);
      });
    });
    wizardEl.querySelectorAll('[data-nl-wizard-group-none]').forEach((btn) => {
      btn.addEventListener('click', () => {
        setGroupSections(parseInt(btn.getAttribute('data-nl-wizard-group-none'), 10), false);
      });
    });

    wizardEl.querySelectorAll('[data-nl-wizard-section]').forEach((cb) => {
      cb.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-nl-wizard-section');
        if (id) {
          setCheckbox(id, e.target.checked);
          updateSectionCardVisuals();
          updateSectionMixStats();
          updateSelectedSectionsPreview();
          updateDirectionFieldsVisibility();
          updateWizardCuratedPanel();
        }
      });
    });

    $('nl-wizard-curated-rows')?.addEventListener('click', (e) => {
      const shuffleBtn = e.target.closest('[data-nl-wizard-shuffle]');
      const chooseBtn = e.target.closest('[data-nl-wizard-choose]');
      const puzzleTypeBtn = e.target.closest('[data-nl-wizard-puzzle-type]');
      if (puzzleTypeBtn) {
        e.preventDefault();
        setWizardPuzzleType(puzzleTypeBtn.getAttribute('data-nl-wizard-puzzle-type'));
        updateWizardCuratedPanel();
        return;
      }
      if (shuffleBtn) {
        e.preventDefault();
        shuffleCuratedPick(shuffleBtn.getAttribute('data-nl-wizard-shuffle'));
      } else if (chooseBtn) {
        e.preventDefault();
        openCuratedChoiceModal(chooseBtn.getAttribute('data-nl-wizard-choose'));
      }
    });

    wizardEl.addEventListener('click', (e) => {
      const toggle = e.target.closest('.nl-wizard-dir-toggle');
      if (!toggle) return;
      const wrap = toggle.closest('[data-nl-wizard-core-direction]');
      const panel = wrap?.querySelector('.nl-wizard-dir-panel');
      const chevron = toggle.querySelector('.nl-wizard-dir-chevron');
      if (!panel) return;
      const open = panel.classList.toggle('hidden');
      if (chevron) chevron.classList.toggle('rotate-180', !open);
    });

    const onPersistInput = () => persistWizardSettings();
    [
      'nl-wizard-audience', 'nl-wizard-location', 'nl-wizard-tone', 'nl-wizard-length', 'nl-wizard-newsletter-title',
      'nl-wizard-blog-url', 'nl-wizard-blog-title', 'nl-wizard-specific'
    ].forEach((id) => {
      const el = $(id);
      if (!el) return;
      el.addEventListener('input', () => {
        onPersistInput();
        if (id === 'nl-wizard-location') updateStep2ValidationHints();
      });
    });
    $('nl-wizard-color-bundle')?.addEventListener('change', () => {
      onWizardColorBundleChange();
      persistWizardSettings();
    });
    wizardEl.querySelectorAll('.nl-wizard-direction-input').forEach((ta) => {
      ta.addEventListener('input', () => {
        updateWizardCoreDirectionUI();
        onPersistInput();
      });
    });

    $('nl-wizard-include-blog')?.addEventListener('change', toggleBlogFields);
    $('nl-wizard-personal')?.addEventListener('change', () => {
      togglePersonalFields();
      if ($('nl-wizard-personal')?.checked) setCheckbox('nl-personal', true);
      else setCheckbox('nl-personal', false);
      syncPersonalMediaToForm();
    });

    $('nl-wizard-personal-text')?.addEventListener('input', updatePersonalCharMeter);
    $('nl-wizard-length')?.addEventListener('change', updateSectionMixStats);

    const onMediaInput = () => {
      syncPersonalMediaToForm();
      updateWizardMediaPreview();
    };
    $('nl-wizard-photo')?.addEventListener('input', onMediaInput);
    $('nl-wizard-video')?.addEventListener('input', onMediaInput);
    $('nl-wizard-include-photo')?.addEventListener('change', onMediaInput);
    $('nl-wizard-include-video')?.addEventListener('change', onMediaInput);
    $('nl-wizard-photo-size')?.addEventListener('input', () => {
      syncMediaSizeToForm();
      updateWizardMediaPreview();
    });
    $('nl-wizard-video-size')?.addEventListener('input', () => {
      syncMediaSizeToForm();
      updateWizardMediaPreview();
    });

    async function pasteIntoWizardMediaField(inputId, label) {
      try {
        const text = await navigator.clipboard.readText();
        const input = $(inputId);
        if (input && text) {
          input.value = text.trim();
          onMediaInput();
        }
      } catch (e) {
        showStepError(`Could not paste — use Ctrl+V in the ${label} field.`);
      }
    }

    $('nl-wizard-paste-photo')?.addEventListener('click', () => pasteIntoWizardMediaField('nl-wizard-photo', 'photo'));
    $('nl-wizard-paste-video')?.addEventListener('click', () => pasteIntoWizardMediaField('nl-wizard-video', 'video'));

    wizardEl.querySelectorAll('[data-nl-wizard-prompt]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-nl-wizard-prompt'), 10);
        const prompt = STORY_PROMPTS[idx];
        const ta = $('nl-wizard-personal-text');
        if (ta && prompt) {
          ta.value = prompt.text;
          ta.dispatchEvent(new Event('input', { bubbles: true }));
          updatePersonalCharMeter();
        }
      });
    });

    $('nl-wizard-step-nav')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-nl-wizard-goto]');
      if (!btn || btn.disabled) return;
      const step = parseInt(btn.getAttribute('data-nl-wizard-goto'), 10);
      if (step && step !== currentStep) goToStep(step);
    });

    wizardEl.querySelectorAll('[data-nl-wizard-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const raw = btn.getAttribute('data-nl-wizard-edit');
        if (raw === '4-engagement') {
          goToStep(4, { step4Tab: 'engagement' });
          return;
        }
        const step = parseInt(raw, 10);
        if (step) goToStep(step);
      });
    });

    document.addEventListener('keydown', (e) => {
      if (wizardEl?.classList.contains('hidden')) return;
      const choiceModal = document.getElementById('newsletter-choice-modal');
      const choiceOpen = choiceModal && choiceModal.classList.contains('flex') && !choiceModal.classList.contains('hidden');

      if (e.key === 'Escape') {
        if (choiceOpen) return;
        closeNewsletterWizard();
        return;
      }

      if (choiceOpen || isWizardTypingTarget(e.target)) return;

      if (e.key === 'ArrowRight' && currentStep < TOTAL_STEPS) {
        e.preventDefault();
        goStep(1);
      } else if (e.key === 'ArrowLeft' && currentStep > 1) {
        e.preventDefault();
        goStep(-1);
      }
    });

    document.addEventListener('keydown', handleWizardFocusTrap);
  }

  function cloneSelectOptions(fromId, toId) {
    const from = $(fromId);
    const to = $(toId);
    if (!from || !to) return;
    to.innerHTML = from.innerHTML;
  }

  function syncProfileAndRefresh() {
    if (typeof window.syncNewsletterFromProfile === 'function') {
      try { window.syncNewsletterFromProfile(); } catch (e) {}
    }
    readFormIntoWizard();
    updateProfileCard();
  }

  function scrollToNewsletterFormStart() {
    $('nl-form-start')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function openFullForm() {
    writeWizardIntoForm({ syncUi: true });
    closeNewsletterWizard();
    scrollToNewsletterFormStart();
  }

  async function finishAndGenerate() {
    savePersonalStoryHistory();
    writeWizardIntoForm({ syncUi: true });
    buildReviewPanel();
    const blockers = $('nl-wizard-review-blockers');
    if (blockers && !blockers.classList.contains('hidden')) return;

    track('complete');
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    closeNewsletterWizard();

    if (typeof window.generateNewsletter === 'function') {
      await window.generateNewsletter('');
    } else {
      $('generate-newsletter-btn')?.click();
    }
  }

  function openNewsletterWizard() {
    ensureWizardDom();
    hookNewsletterPreviewRefresh();
    if (typeof window.reloadNewsletterPersistedValues === 'function') {
      try { window.reloadNewsletterPersistedValues(); } catch (e) {}
    }
    if (typeof window.updatePreviews === 'function') {
      try { window.updatePreviews(); } catch (e) {}
    }
    syncProfileAndRefresh();
    readFormIntoWizard();

    currentStep = 1;

    let savedStep = 1;
    try {
      savedStep = parseInt(localStorage.getItem(STORAGE_KEY) || '1', 10);
    } catch (e) {}

    const resumeEl = $('nl-wizard-resume-offer');
    savedStep = Math.min(savedStep, TOTAL_STEPS);
    if (resumeEl && savedStep > 1 && savedStep <= TOTAL_STEPS) {
      resumeEl.classList.remove('hidden');
      resumeEl.innerHTML = `You left off at step ${savedStep}. <button type="button" id="nl-wizard-resume-btn" class="text-[#00A89D] font-semibold underline">Resume there</button> or continue from the start.`;
      $('nl-wizard-resume-btn')?.addEventListener('click', () => {
        currentStep = savedStep;
        maxVisitedStep = savedStep;
        readFormIntoWizard();
        renderStep();
        resumeEl.classList.add('hidden');
      });
    } else if (resumeEl) {
      resumeEl.classList.add('hidden');
    }

    wizardEl.classList.remove('hidden');
    wizardEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    renderStep();
    focusWizardStepEntry();
    if (typeof window.setCoachModeSwitch === 'function') window.setCoachModeSwitch('newsletter', 'guided');
    track('start');
  }

  function closeNewsletterWizard() {
    if (!wizardEl) return;
    savePersonalStoryHistory();
    writeWizardIntoForm({ silent: true });
    wizardEl.classList.add('hidden');
    wizardEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (typeof window.setCoachModeSwitch === 'function') window.setCoachModeSwitch('newsletter', 'full');
  }

  function scrollToNewsletterForm() {
    scrollToNewsletterFormStart();
  }

  window.openNewsletterWizard = openNewsletterWizard;
  window.closeNewsletterWizard = closeNewsletterWizard;
  window.scrollToNewsletterForm = scrollToNewsletterForm;

  console.log('%c[newsletter-wizard.js] Guided wizard v5 ready', 'color:#00A89D');
})();