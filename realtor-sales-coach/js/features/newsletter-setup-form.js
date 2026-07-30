/**
 * Full newsletter setup page enhancements (wizard learnings — realtor app).
 */
(function () {
  'use strict';

  const PERSONAL_HISTORY_KEY = 'nl-personal-text-last';

  const STORY_PROMPTS = [
    { label: 'Recent closing', text: 'Just wrapped an amazing closing for the ___ family — their first home after years of saving. The kids were thrilled to pick their bedrooms! (Photo: us at the front door with their new keys.)' },
    { label: 'Community moment', text: 'Spent Saturday volunteering at our local food bank — grateful for this community we get to serve every day. (Photo: quick shot from our shift.)' },
    { label: 'Family / personal', text: 'This month has been full — between work and family we finally got to ___. Grateful for the little wins that keep us grounded.' },
    { label: 'Lender shout-out', text: 'Huge thanks to ___ at ___ for another smooth closing this month. Lender partners like this make our clients\' experience so much better.' }
  ];

  function $(id) {
    return document.getElementById(id);
  }

  function getCentralProfile() {
    try {
      if (typeof window.getUserProfile === 'function') return window.getUserProfile();
      return JSON.parse(localStorage.getItem('userProfile') || '{}');
    } catch (e) {
      return {};
    }
  }

  function openChoiceModal(category) {
    if (typeof window.openNewsletterChoiceModal === 'function') {
      window.openNewsletterChoiceModal(category, { hub: true });
    } else if (typeof window.openModal === 'function') {
      window.openModal(category, { hub: true });
    }
  }

  function updateSetupProfileHint() {
    const hint = $('nl-setup-profile-hint');
    if (!hint) return;
    const p = getCentralProfile();
    const hasProfile = !!(p.name || p.email || p.localArea || p.market || p.location || p.tone || p.newsletterColorBundle);
    hint.classList.toggle('hidden', !hasProfile);
  }

  function updateSetupColorPreview() {
    const preview = $('nl-color-bundle-setup-preview');
    const select = $('nl-color-bundle');
    if (!preview || !window.NlColorBundles || typeof window.NlColorBundles.renderBundleMiniPreview !== 'function') return;
    const bundleId = select?.value || '';
    const activeId = bundleId || (typeof window.NlColorBundles.readProfileBundleId === 'function'
      ? window.NlColorBundles.readProfileBundleId()
      : 'coastal-teal');
    window.NlColorBundles.renderBundleMiniPreview(preview, activeId, { showDescription: true });
  }

  function wireSetupColorBundle() {
    const select = $('nl-color-bundle');
    if (!select || select.dataset.nlSetupColorWired === '1') return;
    if (!window.NlColorBundles || typeof window.NlColorBundles.populateBundleSelect !== 'function') return;
    select.dataset.nlSetupColorWired = '1';

    let saved = '';
    try { saved = localStorage.getItem('nl-color-bundle') || ''; } catch (e) {}

    window.NlColorBundles.populateBundleSelect(select, saved, { includeProfileDefault: true });

    const syncOutputPicker = () => {
      const out = $('nl-color-bundle-output');
      if (out && out.value !== select.value) {
        out.value = select.value;
        out.dispatchEvent(new Event('change', { bubbles: true }));
      }
      updateSetupColorPreview();
    };

    select.addEventListener('change', () => {
      try { localStorage.setItem('nl-color-bundle', select.value); } catch (e) {}
      syncOutputPicker();
      if (typeof window.refreshNewsletterColorScheme === 'function') {
        window.refreshNewsletterColorScheme();
      }
    });

    syncOutputPicker();
    updateSetupColorPreview();
  }

  function wireStoryPrompts() {
    const wrap = $('nl-story-prompts');
    const ta = $('nl-personal-text');
    if (!wrap || wrap.dataset.wired === '1') return;
    wrap.dataset.wired = '1';
    wrap.innerHTML = STORY_PROMPTS.map((p, i) => `
      <button type="button" data-nl-story-prompt="${i}" class="text-xs px-3 py-1.5 rounded-full border border-[#00A89D]/40 text-[#00A89D] font-semibold hover:bg-[#00A89D]/10 transition">${p.label}</button>
    `).join('');
    wrap.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-nl-story-prompt]');
      if (!btn || !ta) return;
      const idx = parseInt(btn.getAttribute('data-nl-story-prompt'), 10);
      const prompt = STORY_PROMPTS[idx];
      if (!prompt) return;
      ta.value = prompt.text;
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      ta.focus();
    });
  }

  function loadPersonalStoryHistory() {
    try { return (localStorage.getItem(PERSONAL_HISTORY_KEY) || '').trim(); } catch (e) { return ''; }
  }

  /** Best-effort recover previous personal note from last generated HTML (legacy users). */
  function extractPersonalFromLastNewsletter() {
    let html = '';
    try { html = localStorage.getItem('lastNewsletterHTML') || ''; } catch (e) { return ''; }
    if (!html || html.length < 40) return '';
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      // Prefer labeled personal modules, then common card patterns
      const candidates = [
        doc.querySelector('[data-nl-personal-update]'),
        doc.querySelector('[data-nl-personal-note]'),
        ...Array.from(doc.querySelectorAll('td, div, p')).filter((el) => {
          const t = (el.textContent || '').trim();
          const label = (el.previousElementSibling?.textContent || el.parentElement?.textContent || '').toLowerCase();
          return t.length >= 40 && t.length < 1200 && /personal|from my desk|a note from/i.test(label + ' ' + (el.getAttribute('class') || ''));
        })
      ].filter(Boolean);
      for (const el of candidates) {
        const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (text.length >= 40) return text.slice(0, 1500);
      }
    } catch (e) { /* ignore */ }
    return '';
  }

  /** Seed history key so returning users see Load last even if they never hit the new blur hook. */
  function seedPersonalStoryHistory() {
    if (loadPersonalStoryHistory()) return loadPersonalStoryHistory();
    const fromField = ($('nl-personal-text')?.value || '').trim();
    if (fromField.length >= 20) {
      try { localStorage.setItem(PERSONAL_HISTORY_KEY, fromField); } catch (e) {}
      return fromField;
    }
    const fromHtml = extractPersonalFromLastNewsletter();
    if (fromHtml) {
      try { localStorage.setItem(PERSONAL_HISTORY_KEY, fromHtml); } catch (e) {}
      return fromHtml;
    }
    return '';
  }

  function updatePersonalHistoryUI() {
    const last = seedPersonalStoryHistory() || loadPersonalStoryHistory();
    const trigger = $('nl-personal-history-trigger');
    const snippet = $('nl-personal-history-snippet');
    if (snippet) snippet.textContent = last || '';
    // Compact "Last issue" chip only appears when we have prior text
    if (trigger) trigger.classList.toggle('hidden', !last);
    if (!last) $('nl-personal-history-popover')?.classList.add('hidden');
  }

  function applyPersonalStoryHistory() {
    const last = loadPersonalStoryHistory();
    const ta = $('nl-personal-text');
    if (!last || !ta) return;
    // Ensure personal section is open so the user sees the load
    const personalCb = $('nl-personal');
    if (personalCb && !personalCb.checked) {
      personalCb.checked = true;
      personalCb.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const fields = $('personal-fields');
    if (fields) fields.classList.remove('hidden');
    ta.value = last;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    $('nl-personal-history-popover')?.classList.add('hidden');
    if (window.showToast) window.showToast('Loaded your last personal update.', 'success');
    try { ta.focus({ preventScroll: false }); } catch (e) { ta.focus(); }
  }

  function wirePersonalHistory() {
    const trigger = $('nl-personal-history-trigger');
    const loadBtn = $('nl-personal-history-load-btn');
    const popover = $('nl-personal-history-popover');
    if (!loadBtn || loadBtn.dataset.wired === '1') return;
    loadBtn.dataset.wired = '1';

    // Compact chip: click → preview; second click or "Use this text" applies
    loadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!loadPersonalStoryHistory()) return;
      if (popover) {
        const open = !popover.classList.contains('hidden');
        if (open) applyPersonalStoryHistory();
        else {
          updatePersonalHistoryUI();
          popover.classList.remove('hidden');
        }
      } else {
        applyPersonalStoryHistory();
      }
    });

    $('nl-personal-history-use')?.addEventListener('click', (e) => {
      e.preventDefault();
      applyPersonalStoryHistory();
    });
    $('nl-personal-history-dismiss')?.addEventListener('click', (e) => {
      e.preventDefault();
      popover?.classList.add('hidden');
    });

    // Click outside closes preview
    if (trigger && !trigger.dataset.nlOutsideWired) {
      trigger.dataset.nlOutsideWired = '1';
      document.addEventListener('click', (e) => {
        if (!popover || popover.classList.contains('hidden')) return;
        if (trigger.contains(e.target)) return;
        popover.classList.add('hidden');
      });
    }

    // Save on blur so history exists even before Generate
    const ta = $('nl-personal-text');
    if (ta && !ta.dataset.nlHistoryBlurWired) {
      ta.dataset.nlHistoryBlurWired = '1';
      ta.addEventListener('blur', () => {
        const text = (ta.value || '').trim();
        if (text.length >= 20) saveNewsletterPersonalHistory();
      });
    }

    updatePersonalHistoryUI();
  }

  function saveNewsletterPersonalHistory() {
    const text = ($('nl-personal-text')?.value || '').trim();
    if (!text || text.length < 20) return;
    try { localStorage.setItem(PERSONAL_HISTORY_KEY, text); } catch (e) {}
    updatePersonalHistoryUI();
  }

  async function pasteIntoField(inputId, label) {
    const input = $(inputId);
    if (!input) return;
    try {
      const text = await navigator.clipboard.readText();
      if (!text?.trim()) {
        if (window.showToast) window.showToast(`Clipboard is empty — copy a ${label} URL first.`, 'warning');
        return;
      }
      input.value = text.trim();
      input.dispatchEvent(new Event('input', { bubbles: true }));
      if (window.showToast) window.showToast(`${label} URL pasted.`, 'success');
    } catch (e) {
      if (window.showToast) window.showToast('Paste failed — use Ctrl+V in the field.', 'warning');
      input.focus();
    }
  }

  function wireMediaPasteButtons() {
    const photoBtn = $('nl-paste-photo');
    const videoBtn = $('nl-paste-video');
    if (photoBtn && !photoBtn.dataset.nlPasteWired) {
      photoBtn.dataset.nlPasteWired = '1';
      photoBtn.addEventListener('click', () => pasteIntoField('nl-personal-photo', 'photo'));
    }
    if (videoBtn && !videoBtn.dataset.nlPasteWired) {
      videoBtn.dataset.nlPasteWired = '1';
      videoBtn.addEventListener('click', () => pasteIntoField('nl-personal-video', 'video'));
    }
  }

  function setPuzzleTypeAndOpen(type) {
    if (window.NlEntertainment && typeof window.NlEntertainment.setPuzzleType === 'function') {
      window.NlEntertainment.setPuzzleType(type);
    } else {
      document.querySelectorAll('input[name="nl-puzzle-type"]').forEach((r) => {
        r.checked = r.value === type;
      });
      try { localStorage.setItem('nl-puzzle-type', type); } catch (e) {}
    }
    syncPuzzleTypeCardStyles(type);
    openChoiceModal('puzzle');
  }

  function syncPuzzleTypeCardStyles(activeType) {
    const type = activeType
      || (window.NlEntertainment && typeof window.NlEntertainment.getActivePuzzleType === 'function'
        ? window.NlEntertainment.getActivePuzzleType()
        : document.querySelector('input[name="nl-puzzle-type"]:checked')?.value || 'trivia');
    document.querySelectorAll('[data-nl-puzzle-open]').forEach((btn) => {
      const on = btn.getAttribute('data-nl-puzzle-open') === type;
      btn.classList.toggle('border-[#00A89D]', on);
      btn.classList.toggle('bg-[#00A89D]/10', on);
      btn.classList.toggle('ring-2', on);
      btn.classList.toggle('ring-[#00A89D]/30', on);
      btn.classList.toggle('border-gray-200', !on);
      btn.classList.toggle('dark:border-gray-700', !on);
    });
    const radio = document.querySelector(`input[name="nl-puzzle-type"][value="${type}"]`);
    if (radio) radio.checked = true;
  }

  function wirePuzzleTypeCards() {
    document.querySelectorAll('[data-nl-puzzle-open]').forEach((btn) => {
      if (btn.dataset.nlPuzzleOpenWired === '1') return;
      btn.dataset.nlPuzzleOpenWired = '1';
      btn.addEventListener('click', () => {
        setPuzzleTypeAndOpen(btn.getAttribute('data-nl-puzzle-open'));
      });
    });
    syncPuzzleTypeCardStyles();
    document.querySelectorAll('input[name="nl-puzzle-type"]').forEach((radio) => {
      if (radio.dataset.nlPuzzleOpenWired === '1') return;
      radio.dataset.nlPuzzleOpenWired = '1';
      radio.addEventListener('change', () => syncPuzzleTypeCardStyles(radio.value));
    });
  }

  function wireCustomPreviewClicks() {
    document.querySelectorAll('.nl-custom-preview-open[data-nl-choice]').forEach((el) => {
      if (el.dataset.nlPreviewOpenWired === '1') return;
      el.dataset.nlPreviewOpenWired = '1';
      el.addEventListener('click', () => {
        const cat = el.getAttribute('data-nl-choice');
        if (cat) openChoiceModal(cat);
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const cat = el.getAttribute('data-nl-choice');
          if (cat) openChoiceModal(cat);
        }
      });
    });
  }

  function wireEngagementShuffleButtons() {
    document.querySelectorAll('[data-nl-shuffle]').forEach((btn) => {
      if (btn.dataset.nlShuffleWired === '1') return;
      btn.dataset.nlShuffleWired = '1';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const cat = btn.getAttribute('data-nl-shuffle');
        if (cat && typeof window.regenerateRandom === 'function') window.regenerateRandom(cat);
      });
    });
  }

  function initNewsletterSetupForm() {
    if (!document.getElementById('newsletter-generator')) return;
    updateSetupProfileHint();
    wireSetupColorBundle();
    wireStoryPrompts();
    wirePersonalHistory();
    wireMediaPasteButtons();
    wirePuzzleTypeCards();
    wireCustomPreviewClicks();
    wireEngagementShuffleButtons();
    // Refresh Load last when Personal is toggled
    const personalCb = $('nl-personal');
    if (personalCb && !personalCb.dataset.nlHistoryToggleWired) {
      personalCb.dataset.nlHistoryToggleWired = '1';
      personalCb.addEventListener('change', () => updatePersonalHistoryUI());
    }
    // When user opens Newsletter section later, refresh the control
    document.addEventListener('click', (e) => {
      const link = e.target.closest?.('[href="#newsletter-generator"], [onclick*="newsletter-generator"]');
      if (link) setTimeout(updatePersonalHistoryUI, 200);
    });
    // Hash / showSection navigation
    window.addEventListener('hashchange', () => {
      if ((location.hash || '').replace(/^#/, '') === 'newsletter-generator') {
        setTimeout(updatePersonalHistoryUI, 150);
      }
    });
  }

  window.saveNewsletterPersonalHistory = saveNewsletterPersonalHistory;
  window.updateNewsletterPersonalHistoryUI = updatePersonalHistoryUI;
  window.initNewsletterSetupForm = initNewsletterSetupForm;
  window.__nlSyncSetupPuzzleTypeCards = syncPuzzleTypeCardStyles;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNewsletterSetupForm);
  } else {
    initNewsletterSetupForm();
  }
})();