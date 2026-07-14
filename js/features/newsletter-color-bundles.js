/**
 * Curated newsletter color bundles — Loan Officer Sales Coach.
 * Canonical tokens in generated HTML: primary #00A89D, secondary/footer #002B5C
 */
(function () {
  'use strict';

  const CANONICAL_PRIMARY = '#00A89D';
  const CANONICAL_SECONDARY = '#002B5C';
  const CANONICAL_BRAND_HEADING = '#1A1A2E';
  const CANONICAL_BRAND_MUTED = '#636363';
  const BRAND_HEADER_LIGHT_BG = '#F9F9F9';
  const DEFAULT_BUNDLE_ID = 'coastal-teal';

  const NL_COLOR_BUNDLES = {
    'coastal-teal': {
      id: 'coastal-teal',
      label: 'Coastal Teal',
      description: 'Teal accents with navy headings — Ruoff default for loan officer newsletters.',
      primary: '#00A89D',
      secondary: '#002B5C',
      footer: '#002B5C',
      headingOnLight: '#002B5C',
      mutedOnLight: '#4A4A4A'
    },
    'classic-navy': {
      id: 'classic-navy',
      label: 'Classic Navy',
      description: 'All-navy professional look — subdued and email-safe.',
      primary: '#1E4D7B',
      secondary: '#0F2744',
      footer: '#0F2744',
      headingOnLight: '#0F2744',
      mutedOnLight: '#4A4A4A'
    },
    'warm-agent': {
      id: 'warm-agent',
      label: 'Warm Agent',
      description: 'Coral accents with charcoal headings — friendly and approachable.',
      primary: '#E07A5F',
      secondary: '#3D405B',
      footer: '#3D405B',
      headingOnLight: '#3D405B',
      mutedOnLight: '#4A4A4A'
    },
    'forest-estate': {
      id: 'forest-estate',
      label: 'Forest Estate',
      description: 'Deep green with forest tones — earthy luxury.',
      primary: '#2D6A4F',
      secondary: '#1B4332',
      footer: '#1B4332',
      headingOnLight: '#1B4332',
      mutedOnLight: '#4A4A4A'
    },
    'royal-burgundy': {
      id: 'royal-burgundy',
      label: 'Royal Burgundy',
      description: 'Burgundy accent with plum headings — boutique brokerage feel.',
      primary: '#9D174D',
      secondary: '#581C87',
      footer: '#4C1D95',
      headingOnLight: '#581C87',
      mutedOnLight: '#4A4A4A'
    },
    'slate-modern': {
      id: 'slate-modern',
      label: 'Slate Modern',
      description: 'Cool blue accent with slate headings — modern team branding.',
      primary: '#2563EB',
      secondary: '#1E293B',
      footer: '#1E293B',
      headingOnLight: '#1E293B',
      mutedOnLight: '#4A4A4A'
    },
    'gold-luxury': {
      id: 'gold-luxury',
      label: 'Gold Luxury',
      description: 'Gold accents with rich brown — high-end listing focus.',
      primary: '#B8860B',
      secondary: '#3E2723',
      footer: '#3E2723',
      headingOnLight: '#2C1810',
      mutedOnLight: '#4A4A4A'
    },
    'berry-bold': {
      id: 'berry-bold',
      label: 'Berry Bold',
      description: 'Berry accent with deep indigo — stands out in the inbox.',
      primary: '#BE185D',
      secondary: '#312E81',
      footer: '#312E81',
      headingOnLight: '#312E81',
      mutedOnLight: '#4A4A4A'
    }
  };

  function getBundle(bundleId) {
    const id = String(bundleId || '').trim();
    return NL_COLOR_BUNDLES[id] || NL_COLOR_BUNDLES[DEFAULT_BUNDLE_ID];
  }

  function readProfileBundleId() {
    try {
      if (typeof window.getUserProfile === 'function') {
        const p = window.getUserProfile();
        if (p?.newsletterColorBundle) return p.newsletterColorBundle;
      }
      const p = JSON.parse(localStorage.getItem('userProfile') || '{}');
      return p.newsletterColorBundle || DEFAULT_BUNDLE_ID;
    } catch (e) {
      return DEFAULT_BUNDLE_ID;
    }
  }

  function getActiveBundleId() {
    const el = document.getElementById('nl-color-bundle');
    const override = el ? String(el.value || '').trim() : '';
    if (override) return override;
    return readProfileBundleId();
  }

  function getActiveBundle() {
    return getBundle(getActiveBundleId());
  }

  function replaceColorToken(html, fromColor, toColor) {
    if (!html || !fromColor || !toColor) return html;
    if (fromColor.toLowerCase() === toColor.toLowerCase()) return html;
    const fromBare = fromColor.replace('#', '');
    const toBare = toColor.replace('#', '');
    const fromEsc = fromBare.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`#?${fromEsc}`, 'gi');
    return String(html).replace(re, (match) => (match.charAt(0) === '#' ? toColor : toBare));
  }

  function normalizeToCanonicalColors(html) {
    let out = String(html || '');
    Object.values(NL_COLOR_BUNDLES).forEach((bundle) => {
      if (bundle.primary.toLowerCase() !== CANONICAL_PRIMARY.toLowerCase()) {
        out = replaceColorToken(out, bundle.primary, CANONICAL_PRIMARY);
      }
      if (bundle.secondary.toLowerCase() !== CANONICAL_SECONDARY.toLowerCase()) {
        out = replaceColorToken(out, bundle.secondary, CANONICAL_SECONDARY);
      }
      if (bundle.footer.toLowerCase() !== CANONICAL_SECONDARY.toLowerCase()
          && bundle.footer.toLowerCase() !== bundle.secondary.toLowerCase()) {
        out = replaceColorToken(out, bundle.footer, CANONICAL_SECONDARY);
      }
      if (bundle.headingOnLight) {
        out = replaceColorToken(out, bundle.headingOnLight, CANONICAL_BRAND_HEADING);
      }
      if (bundle.mutedOnLight) {
        out = replaceColorToken(out, bundle.mutedOnLight, CANONICAL_BRAND_MUTED);
      }
    });
    return out;
  }

  const SECTION_LEFT_BORDER_RE = /border-left:\s*(?:4|8)px\s+solid\s+#?[0-9a-fA-F]{3,6}/i;

  function repairBrokenCssHexColors(html) {
    return String(html || '');
  }

  /** Token swap only — safe for live preview refresh without touching layout. */
  function applyColorSchemeTokensOnly(html, bundle) {
    const b = bundle || getActiveBundle();
    let out = repairBrokenCssHexColors(html);
    out = normalizeToCanonicalColors(out);
    out = replaceColorToken(out, CANONICAL_PRIMARY, b.primary);
    out = replaceColorToken(out, CANONICAL_SECONDARY, b.secondary);
    if (b.footer && b.footer.toLowerCase() !== b.secondary.toLowerCase()) {
      out = replaceColorToken(out, CANONICAL_SECONDARY, b.footer);
    }
    if (b.headingOnLight) {
      out = replaceColorToken(out, CANONICAL_BRAND_HEADING, b.headingOnLight);
    }
    if (b.mutedOnLight) {
      out = replaceColorToken(out, CANONICAL_BRAND_MUTED, b.mutedOnLight);
    }
    return out;
  }

  function applyColorScheme(html, bundle) {
    return applyColorSchemeTokensOnly(html, bundle);
  }

  function ensureSectionLeftBorders(html) {
    return String(html || '');
  }

  function ensureBrandHeaderReadable(html) {
    return String(html || '');
  }

  function ensureSectionCardsReadable(html) {
    return String(html || '');
  }

  function ensureCtaButtonTextWhite(html) {
    return String(html || '');
  }

  function ensureDisclaimerReadable(html) {
    return String(html || '');
  }

  function renderBundlePreview(container, bundleId) {
    if (!container) return;
    const bundle = getBundle(bundleId || getActiveBundleId());
    container.innerHTML = `
      <div class="flex items-center gap-2 mt-1">
        <span class="inline-block w-5 h-5 rounded-full border border-gray-200 dark:border-gray-600" style="background:${bundle.primary}" title="Accent"></span>
        <span class="inline-block w-5 h-5 rounded-full border border-gray-200 dark:border-gray-600" style="background:${bundle.secondary}" title="Headings"></span>
        <span class="text-[10px] text-gray-500 dark:text-gray-400">${bundle.label}</span>
      </div>`;
  }

  /** Mini newsletter card mockup — used on wizard step 2 for live color preview. */
  function renderBundleMiniPreview(container, bundleId, options) {
    if (!container) return;
    const opts = options || {};
    const bundle = getBundle(bundleId || getActiveBundleId());
    const showLabel = opts.showLabel !== false;
    const desc = bundle.description || '';
    container.innerHTML = `
      <div class="flex flex-col items-center w-full">
      <div class="nl-color-mini-preview w-full max-w-[200px] mx-auto rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden shadow-sm bg-white dark:bg-gray-900" title="${bundle.label}">
        <div class="h-2.5" style="background: linear-gradient(90deg, ${bundle.primary}, ${bundle.secondary})"></div>
        <div class="p-2.5">
          <div class="text-[9px] font-bold uppercase tracking-wide mb-1.5 truncate" style="color:${bundle.secondary}">Your Newsletter</div>
          <div class="space-y-1 mb-2">
            <div class="h-1 rounded-full bg-gray-200 dark:bg-gray-700" style="width:92%"></div>
            <div class="h-1 rounded-full bg-gray-200 dark:bg-gray-700" style="width:76%"></div>
            <div class="h-1 rounded-full" style="width:58%;background:${bundle.primary}33"></div>
          </div>
          <div class="pl-1.5 py-1 rounded-r" style="border-left:3px solid ${bundle.primary};background:${bundle.primary}12">
            <div class="text-[8px] font-semibold truncate" style="color:${bundle.secondary}">Section accent</div>
            <div class="h-0.5 rounded-full bg-gray-200 dark:bg-gray-700 mt-1" style="width:70%"></div>
          </div>
          <div class="mt-2 inline-block text-[8px] font-semibold px-2 py-0.5 rounded-full text-white" style="background:${bundle.primary}">CTA button</div>
          ${showLabel ? `<p class="text-[9px] text-gray-500 dark:text-gray-400 mt-2 mb-0 truncate">${bundle.label}</p>` : ''}
        </div>
      </div>
      ${desc && opts.showDescription ? `<p class="text-[10px] text-gray-500 dark:text-gray-400 mt-1.5 mb-0 max-w-[200px] text-center leading-snug">${String(desc).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')}</p>` : ''}
      </div>`;
  }

  function populateBundleSelect(selectEl, selectedId, options) {
    if (!selectEl) return;
    const opts = options || {};
    const includeProfileDefault = opts.includeProfileDefault !== false;
    const profileBundle = getBundle(readProfileBundleId());
    selectEl.innerHTML = '';
    if (includeProfileDefault) {
      const profileOpt = document.createElement('option');
      profileOpt.value = '';
      profileOpt.textContent = `Profile default (${profileBundle.label})`;
      selectEl.appendChild(profileOpt);
    }
    Object.values(NL_COLOR_BUNDLES).forEach((bundle) => {
      const opt = document.createElement('option');
      opt.value = bundle.id;
      opt.textContent = bundle.label;
      selectEl.appendChild(opt);
    });
    if (selectedId) selectEl.value = selectedId;
  }

  function wireProfileBundlePicker() {
    const select = document.getElementById('profile-newsletter-color-bundle');
    const preview = document.getElementById('profile-newsletter-color-preview');
    const desc = document.getElementById('profile-newsletter-color-desc');
    if (!select || select.dataset.nlBundleWired === '1') return;
    select.dataset.nlBundleWired = '1';
    populateBundleSelect(select, readProfileBundleId(), { includeProfileDefault: false });
    select.value = readProfileBundleId();
    const refresh = () => {
      const bundle = getBundle(select.value);
      renderBundlePreview(preview, bundle.id);
      if (desc) desc.textContent = bundle.description;
    };
    select.addEventListener('change', refresh);
    refresh();
  }

  function wireNewsletterBundlePicker() {
    const select = document.getElementById('nl-color-bundle-output');
    const preview = document.getElementById('nl-color-bundle-preview');
    if (!select || select.dataset.nlBundleWired === '1') return;
    select.dataset.nlBundleWired = '1';
    const saved = localStorage.getItem('nl-color-bundle') || '';
    populateBundleSelect(select, saved, { includeProfileDefault: true });
    const refresh = () => {
      if (preview && typeof renderBundleMiniPreview === 'function') {
        renderBundleMiniPreview(preview, getActiveBundleId(), { showDescription: false, showLabel: true });
      } else {
        renderBundlePreview(preview, getActiveBundleId());
      }
    };
    select.addEventListener('change', () => {
      try { localStorage.setItem('nl-color-bundle', select.value); } catch (e) {}
      const setup = document.getElementById('nl-color-bundle');
      if (setup && setup.value !== select.value) {
        setup.value = select.value;
        setup.dispatchEvent(new Event('change', { bubbles: true }));
      }
      refresh();
      if (typeof window.refreshNewsletterColorScheme === 'function') {
        window.refreshNewsletterColorScheme();
      }
    });
    refresh();
  }

  function initNlColorBundlePickers() {
    wireProfileBundlePicker();
    wireNewsletterBundlePicker();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNlColorBundlePickers);
  } else {
    initNlColorBundlePickers();
  }

  window.NlColorBundles = {
    BUNDLES: NL_COLOR_BUNDLES,
    DEFAULT_BUNDLE_ID,
    CANONICAL_PRIMARY,
    CANONICAL_SECONDARY,
    CANONICAL_BRAND_HEADING,
    CANONICAL_BRAND_MUTED,
    getBundle,
    readProfileBundleId,
    getActiveBundleId,
    getActiveBundle,
    normalizeToCanonicalColors,
    applyColorScheme,
    applyColorSchemeTokensOnly,
    SECTION_LEFT_BORDER_RE,
    repairBrokenCssHexColors,
    ensureSectionLeftBorders,
    ensureBrandHeaderReadable,
    ensureSectionCardsReadable,
    ensureCtaButtonTextWhite,
    ensureDisclaimerReadable,
    renderBundlePreview,
    renderBundleMiniPreview,
    populateBundleSelect,
    wireProfileBundlePicker,
    wireNewsletterBundlePicker,
    initNlColorBundlePickers
  };
})();