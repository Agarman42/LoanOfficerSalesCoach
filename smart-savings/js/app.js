/**
 * Ruoff Smart Savings Calculator — shared UI application
 * Mode: window.APP_MODE = 'lo' | 'borrower'
 * Native LO embed: scopes DOM to #smart-savings-root when present.
 */
(function () {
  'use strict';

  const C = window.RuoffCalc;
  if (!C) {
    console.error('RuoffCalc core not loaded');
    return;
  }

  // Force LO when embedded in Sales Coach (native section)
  if (window.SMART_SAVINGS_EMBED || document.getElementById('smart-savings-root')) {
    window.APP_MODE = 'lo';
  }

  const MODE = window.APP_MODE === 'borrower' ? 'borrower' : 'lo';
  let __ssInited = false;
  let __ssListenersBound = false;
  const STORAGE_KEY = MODE === 'lo' ? 'ruoff.lo.calculator' : 'ruoff.borrower.calculator';
  const BRANDING_KEY = 'ruoff.lo.branding';
  const CLIENT_KEY = MODE === 'lo' ? 'ruoff.lo.client' : 'ruoff.borrower.client';
  const THEME_KEY = 'ruoffTheme';
  const WIZARD_STEP_KEY = 'ruoff.wizardStep.' + MODE;
  const MAX_WIZARD_REACHED_KEY = 'ruoff.wizardMax.' + MODE;
  const SCENARIOS_KEY = 'ruoff.scenarios.' + MODE;
  /** Parked full borrower meetings (client + numbers + compare + plan). Branding is never stored here. */
  const MEETINGS_KEY = MODE === 'lo' ? 'ruoff.lo.meetings' : 'ruoff.borrower.meetings';
  const MAX_SAVED_MEETINGS = 20;

  /**
   * Grok via LO Sales Coach proxy (same origin when embedded at /smart-savings/).
   * Accepts OpenAI-style body { model, messages, temperature, max_tokens }.
   * Optional Bearer from localStorage / parent LO window.
   *
   * Overrides:
   *   window.RUOFF_GROK_URL
   *   ?grokProxy=https://...
   *   window.parent.getProxyBaseUrl() / getGrokApiKey()
   */
  function getGrokEndpoint() {
    if (window.RUOFF_GROK_URL) return window.RUOFF_GROK_URL;
    try {
      if (typeof window.getProxyUrl === 'function') {
        const full = window.getProxyUrl();
        if (full) return full;
      }
    } catch (e) { /* ignore */ }
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('grokProxy');
      if (q) return q;
    } catch (e) { /* ignore */ }
    try {
      if (typeof window.getProxyBaseUrl === 'function') {
        const base = window.getProxyBaseUrl();
        if (base) return String(base).replace(/\/$/, '') + '/api/v1/chat/completions';
        if (base === '') return '/api/v1/chat/completions';
      }
    } catch (e) { /* ignore */ }
    try {
      if (window.parent && window.parent !== window && typeof window.parent.getProxyBaseUrl === 'function') {
        const base = window.parent.getProxyBaseUrl();
        if (base) return String(base).replace(/\/$/, '') + '/api/v1/chat/completions';
      }
    } catch (e) { /* ignore */ }
    return '/api/v1/chat/completions';
  }

  async function callGrokAPI(body) {
    const endpoint = getGrokEndpoint();
    const headers = { 'Content-Type': 'application/json' };
    try {
      const key = localStorage.getItem('grokApiKey') || localStorage.getItem('xaiApiKey');
      if (key) headers['Authorization'] = 'Bearer ' + key;
    } catch (e) { /* ignore */ }
    try {
      if (window.parent && window.parent !== window) {
        if (typeof window.parent.getGrokApiKey === 'function') {
          const k = window.parent.getGrokApiKey();
          if (k) headers['Authorization'] = 'Bearer ' + k;
        }
      }
    } catch (e) { /* ignore */ }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      let detail = '';
      try {
        const errJson = await res.json();
        detail = (errJson && (errJson.error || errJson.message)) || '';
        if (typeof detail === 'object') detail = detail.message || JSON.stringify(detail);
      } catch (e) {
        detail = await res.text().catch(function () { return ''; });
      }
      throw new Error('Grok proxy ' + res.status + (detail ? ': ' + String(detail).slice(0, 200) : ''));
    }
    return res.json();
  }

  // ─── State ───────────────────────────────────────────────
  let state = {
    homeValue: C.DEFAULTS.homeValue,
    currentBalance: C.DEFAULTS.currentBalance,
    currentRate: C.DEFAULTS.currentRate,
    yearsRemaining: C.DEFAULTS.yearsRemaining,
    closingDate: '',
    totalPayment: C.DEFAULTS.totalPayment,
    taxes: C.DEFAULTS.taxes,
    insurance: C.DEFAULTS.insurance,
    pmi: C.DEFAULTS.pmi,
    escrowIncluded: true,
    newLoanAmount: C.DEFAULTS.newLoanAmount,
    newRate: C.DEFAULTS.newRate,
    newTerm: C.DEFAULTS.newTerm,
    closingCosts: C.DEFAULTS.closingCosts,
    projectCash: 30000,
    newPmi: 0,
    newPmiManual: false,
    debts: [],
    client: { name: '', email: '', phone: '', notes: '' },
    branding: { name: '', nmls: '', email: '', cell: '', color: '#00A89D', accent: '#F15A29', photo: '' },
    loContact: { name: '', email: '', phone: '', nmls: '', color: '', accent: '', photo: '' }
  };

  let lastScenario = null;
  let mortgageModalSource = 'main';
  let editingDebtIndex = undefined;
  let expandedDebtIndex = null; // inline edit in debts list
  let generatingPlan = false;
  let openModalIds = [];
  let experienceMode = 'guided'; // 'guided' | 'expert'
  let wizardStep = 0;
  let wizardMaxReached = 0;
  let mortgageModalDirty = false;
  let loanSliderDragging = false;
  let lastLoanClampToastAt = 0;
  const animState = {}; // id -> last numeric value for count-up
  let prevCashFlowSign = null; // for confetti on flip to positive
  let confettiCooldownUntil = 0;
  let savedScenarios = []; // A/B compare slots
  let savedMeetings = []; // parked borrower meetings

  const WIZARD_STEPS = MODE === 'lo'
    ? [
        { key: 'setup', label: 'Client' },
        { key: 'home', label: 'Home' },
        { key: 'mortgage', label: 'Mortgage' },
        { key: 'debts', label: 'Debts' },
        { key: 'scenario', label: 'Options' },
        { key: 'plan', label: 'Plan' }
      ]
    : [
        { key: 'setup', label: 'You' },
        { key: 'home', label: 'Home' },
        { key: 'mortgage', label: 'Mortgage' },
        { key: 'debts', label: 'Debts' },
        { key: 'scenario', label: 'Options' },
        { key: 'plan', label: 'Plan' }
      ];

  /** Primary CTA labels — next step, not generic "Continue" */
  const WIZARD_NEXT_LABELS = {
    0: MODE === 'lo' ? 'Next: home value' : 'Next: home value',
    1: 'Next: mortgage',
    2: 'Next: debts',
    3: 'Next: refinance options',
    4: 'Review plan'
  };

  // ─── Helpers (scope follows shell: root OR guided portal scroll) ─
  function ROOT() {
    return document.getElementById('smart-savings-root');
  }
  function calculatorBodyAlive() {
    return !!document.getElementById('home-value');
  }
  /** When guided modal is open, .app-shell lives in #ss-guided-scroll */
  function guidedScrollEl() {
    return document.getElementById('ss-guided-scroll');
  }
  function calcScope() {
    const scroll = guidedScrollEl();
    if (scroll && scroll.querySelector('.app-shell')) return scroll;
    return ROOT() || document.body;
  }
  function hostEl() {
    return ROOT() || document.body;
  }
  function $(id) {
    if (!id) return null;
    // Prefer global id lookup — shell may be in the body-level portal
    const global = document.getElementById(id);
    if (global) return global;
    const r = calcScope();
    if (r && r !== document.body) {
      try {
        const found = r.querySelector('#' + CSS.escape(id));
        if (found) return found;
      } catch (e) {
        const found = r.querySelector('[id="' + String(id).replace(/"/g, '\\"') + '"]');
        if (found) return found;
      }
    }
    return null;
  }
  function rootQuery(sel) {
    const r = calcScope();
    if (r && r !== document.body) {
      const found = r.querySelector(sel);
      if (found) return found;
    }
    const root = ROOT();
    if (root) {
      const found = root.querySelector(sel);
      if (found) return found;
    }
    const scroll = guidedScrollEl();
    if (scroll) {
      const found = scroll.querySelector(sel);
      if (found) return found;
    }
    return document.querySelector(sel);
  }
  function rootQueryAll(sel) {
    const r = calcScope();
    if (r && r !== document.body) {
      const list = r.querySelectorAll(sel);
      if (list && list.length) return list;
    }
    const root = ROOT();
    if (root) {
      const list = root.querySelectorAll(sel);
      if (list && list.length) return list;
    }
    const scroll = guidedScrollEl();
    if (scroll) return scroll.querySelectorAll(sel);
    return document.querySelectorAll(sel);
  }
  const money = (n, signed) => C.formatMoney(n, { signed: !!signed });

  const CALC_MODAL_IDS = [
    'loading-modal',
    'email-loading-modal',
    'mortgage-modal',
    'debts-modal',
    'add-debt-modal',
    'debt-import-modal',
    'new-meeting-modal',
    'saved-meetings-modal',
    'detail-modal',
    'help-modal'
  ];

  /**
   * Calc modals live as siblings of .app-shell inside #smart-savings-root.
   * Guided tour portal is body-level at z-index 99980 — modals trapped in the
   * root stacking context open *behind* the wizard.
   *
   * Lift into #ss-modal-host (class smart-savings-root) so:
   *  1) they stack above the portal
   *  2) scoped .glass / .input-field / layout CSS still applies
   *     (raw body append left them unstyled → fields smeared over the wizard)
   */
  function getModalHost() {
    let host = document.getElementById('ss-modal-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'ss-modal-host';
      host.className = 'smart-savings-root ss-modal-host';
      host.setAttribute('data-ss-modal-host', '1');
      document.body.appendChild(host);
    }
    const dark =
      document.documentElement.classList.contains('dark') ||
      !!(ROOT() && ROOT().classList.contains('dark'));
    host.classList.toggle('dark', dark);
    return host;
  }

  function liftModalToHost(el) {
    if (!el) return;
    const host = getModalHost();
    if (el.parentNode !== host) {
      if (!el.__ssModalHome) {
        el.__ssModalHome = { parent: el.parentNode, next: el.nextSibling };
      }
      host.appendChild(el);
    }
    el.classList.add('ss-body-hosted-modal');
    if (host.classList.contains('dark')) el.classList.add('dark');
    else el.classList.remove('dark');
    // Kill any duplicate id= nodes left under the coach root (re-inject orphans).
    // getElementById would otherwise hit the hidden copy and leave the visible field stale.
    try {
      const id = el.id;
      if (id) {
        document.querySelectorAll('[id="' + id + '"]').forEach(function (node) {
          if (node !== el) node.remove();
        });
      }
    } catch (e) { /* ignore */ }
  }

  /** Prefer fields inside the open mortgage modal (host), never a hidden clone */
  function mortgageModalRoot() {
    const host = document.getElementById('ss-modal-host');
    if (host) {
      const m = host.querySelector('#mortgage-modal');
      if (m && !m.classList.contains('hidden')) return m;
    }
    const all = document.querySelectorAll('[id="mortgage-modal"]');
    for (let i = 0; i < all.length; i++) {
      if (!all[i].classList.contains('hidden') && all[i].style.display !== 'none') return all[i];
    }
    return document.getElementById('mortgage-modal');
  }

  function mortgageField(id) {
    const root = mortgageModalRoot();
    if (root) {
      const el = root.querySelector('#' + id);
      if (el) return el;
    }
    return document.getElementById(id);
  }

  function syncModalHostState() {
    const host = document.getElementById('ss-modal-host');
    if (!host) return;
    const anyOpen = openModalIds.length > 0;
    host.classList.toggle('ss-has-open-modal', anyOpen);
    host.setAttribute('aria-hidden', anyOpen ? 'false' : 'true');
    // Range sliders need the host to accept pointer events while open
    host.style.pointerEvents = anyOpen ? 'auto' : 'none';
  }

  function setModalOpen(id, open) {
    // Prefer document-level id — modals are not inside .app-shell / portal
    const el = document.getElementById(id) || $(id);
    if (!el) return;
    if (open) {
      liftModalToHost(el);
      el.classList.remove('hidden');
      el.removeAttribute('aria-hidden');
      // Explicit display — Tailwind `hidden` + `flex` on the same node is unreliable
      el.style.setProperty('display', 'flex', 'important');
      el.style.setProperty('align-items', 'center', 'important');
      el.style.setProperty('justify-content', 'center', 'important');
      el.style.setProperty('pointer-events', 'auto', 'important');
      el.style.setProperty('visibility', 'visible', 'important');
      el.style.setProperty('z-index', '1', 'important'); // host owns stacking vs portal
      el.style.setProperty('position', 'fixed', 'important');
      el.style.setProperty('inset', '0', 'important');
      el.style.setProperty('background', 'rgba(0, 0, 0, 0.78)', 'important');
      el.style.setProperty('padding', '1rem', 'important');
      el.style.setProperty('box-sizing', 'border-box', 'important');
      if (openModalIds.indexOf(id) === -1) openModalIds.push(id);
    } else {
      el.classList.add('hidden');
      el.setAttribute('aria-hidden', 'true');
      el.style.setProperty('display', 'none', 'important');
      el.style.setProperty('pointer-events', 'none', 'important');
      el.style.setProperty('visibility', 'hidden', 'important');
      openModalIds = openModalIds.filter(x => x !== id);
    }
    syncModalHostState();
    const openAny = openModalIds.length > 0;
    const host = hostEl();
    if (host && host.classList) host.classList.toggle('modal-open', openAny);
    document.body.classList.toggle('ss-smart-savings-modal-open', openAny);
    // Do not toggle body.modal-open when guided portal owns scroll lock
    if (!isGuidedPortalOpen()) {
      document.body.classList.toggle('modal-open', openAny && !ROOT());
    }
  }

  /** Force-close every calc modal so a stuck loader can never block the UI */
  function forceCloseAllCalcModals() {
    openModalIds = [];
    CALC_MODAL_IDS.forEach(function (id) {
      const el = document.getElementById(id) || $(id);
      if (!el) return;
      el.classList.add('hidden');
      el.style.setProperty('display', 'none', 'important');
      el.style.setProperty('pointer-events', 'none', 'important');
      el.style.setProperty('visibility', 'hidden', 'important');
      el.setAttribute('aria-hidden', 'true');
    });
    // Never strip ss-guided-modal-open here — that would unlock body under an open wizard
    document.body.classList.remove('ss-smart-savings-modal-open', 'modal-open');
    const root = ROOT();
    if (root) root.classList.remove('modal-open');
    const modalHost = document.getElementById('ss-modal-host');
    if (modalHost) {
      modalHost.classList.remove('modal-open', 'ss-has-open-modal');
      modalHost.setAttribute('aria-hidden', 'true');
      modalHost.style.pointerEvents = 'none';
      // Host has smart-savings-root class — clear any leftover paint that covers the page white
      modalHost.style.setProperty('background', 'transparent', 'important');
      modalHost.style.setProperty('min-height', '0', 'important');
    }
    generatingPlan = false;
    mortgageModalDirty = false;
  }

  function closeTopModal() {
    const stack = [
      'add-debt-modal',
      'debt-import-modal',
      'new-meeting-modal',
      'saved-meetings-modal',
      'detail-modal',
      'help-modal',
      'mortgage-modal',
      'debts-modal',
      'loading-modal',
      'email-loading-modal'
    ];
    for (let i = 0; i < stack.length; i++) {
      const el = document.getElementById(stack[i]) || $(stack[i]);
      if (el && !el.classList.contains('hidden') && el.style.display !== 'none') {
        if (stack[i] === 'mortgage-modal') { cancelMortgageModal(); return; }
        if (stack[i] === 'debts-modal') { closeDebtsModal(); return; }
        if (stack[i] === 'add-debt-modal') { closeAddDebtModal(); return; }
        if (stack[i] === 'debt-import-modal') { closeDebtImportModal(); return; }
        if (stack[i] === 'new-meeting-modal') { closeNewMeetingModal(); return; }
        if (stack[i] === 'saved-meetings-modal') { closeSavedMeetingsModal(); return; }
        if (stack[i] === 'detail-modal') { closeDetailModal(); return; }
        if (stack[i] === 'help-modal') { closeHelp(); return; }
        // Don't dismiss loading with Escape
        return;
      }
    }
  }

  /**
   * Calc modals do NOT close on backdrop click / drag-select release outside.
   * Only X, Cancel, Save/Done actions, or Escape dismiss them.
   * (Guided tour still allows its own full-screen backdrop to exit the tour.)
   */
  function swallowBackdropClick(id) {
    const el = document.getElementById(id) || $(id);
    if (!el || el.__ssBackdropLocked) return;
    el.__ssBackdropLocked = true;
    el.addEventListener('click', function (e) {
      // Clicks on the dim overlay itself — ignore (do not close)
      if (e.target === el) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
    // mousedown inside + mouseup outside can fire a click on the overlay;
    // prevent that from bubbling to anything else too
    el.addEventListener('mouseup', function (e) {
      if (e.target === el) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  }

  function lockCalcModalBackdrops() {
    [
      'mortgage-modal',
      'debts-modal',
      'add-debt-modal',
      'debt-import-modal',
      'new-meeting-modal',
      'saved-meetings-modal',
      'detail-modal',
      'help-modal',
      'loading-modal',
      'email-loading-modal'
    ].forEach(swallowBackdropClick);
  }

  function parseNum(val) {
    if (val == null || val === '') return 0;
    return parseFloat(String(val).replace(/[^0-9.\-]/g, '')) || 0;
  }

  function ensureMortgageDebt() {
    const pi = C.derivePi(state.totalPayment, state.taxes, state.insurance, state.pmi, state.escrowIncluded);
    let m = state.debts.find(d => d.name === 'Current Mortgage');
    if (!m) {
      m = { name: 'Current Mortgage', bal: state.currentBalance, pay: pi, rate: state.currentRate, months: state.yearsRemaining * 12, payOff: true };
      state.debts.unshift(m);
    } else {
      m.bal = state.currentBalance;
      m.pay = pi;
      m.rate = state.currentRate;
      m.months = state.yearsRemaining * 12;
      m.payOff = true;
    }
  }

  function readStateFromDom() {
    if ($('home-value')) state.homeValue = parseNum($('home-value').value) || state.homeValue;
    if ($('new-loan-amt')) state.newLoanAmount = parseNum($('new-loan-amt').value);
    if ($('new-rate')) state.newRate = parseNum($('new-rate').value);
    if ($('new-term')) state.newTerm = parseNum($('new-term').value) || 30;
    if ($('closing-costs')) state.closingCosts = parseNum($('closing-costs').value);
    if ($('project-cash')) state.projectCash = parseNum($('project-cash').value);
    const pmiManualEl = $('new-pmi-manual');
    if (pmiManualEl) state.newPmiManual = !!pmiManualEl.checked;
    if ($('new-pmi')) state.newPmi = parseNum($('new-pmi').value);
  }

  function collectClient() {
    return {
      clientName: ($('client-name') && $('client-name').value.trim()) || 'Valued Client',
      clientEmail: ($('client-email') && $('client-email').value.trim()) || '',
      clientPhone: ($('client-phone') && $('client-phone').value.trim()) || '',
      clientNotes: ($('client-notes') && $('client-notes').value.trim()) || ''
    };
  }

  function saveClient() {
    const c = {
      name: ($('client-name') && $('client-name').value) || '',
      email: ($('client-email') && $('client-email').value) || '',
      phone: ($('client-phone') && $('client-phone').value) || '',
      notes: ($('client-notes') && $('client-notes').value) || ''
    };
    state.client = c;
    try { localStorage.setItem(CLIENT_KEY, JSON.stringify(c)); } catch (e) {}
    // Soft gate + plan recap stay in sync as they type (do not call hasClientNameOrGoal — it saves again)
    if (String(c.name || '').trim() || String(c.notes || '').trim()) {
      try { clearStep0SoftHint(); } catch (e) { /* ignore */ }
    }
    try { updateWizardRecap(lastScenario); } catch (e) { /* ignore */ }
  }

  function loadClient() {
    try {
      const raw = localStorage.getItem(CLIENT_KEY);
      if (raw) {
        state.client = Object.assign(state.client, JSON.parse(raw));
      }
    } catch (e) {}
    if ($('client-name')) $('client-name').value = state.client.name || '';
    if ($('client-email')) $('client-email').value = state.client.email || '';
    if ($('client-phone')) $('client-phone').value = state.client.phone || '';
    if ($('client-notes')) $('client-notes').value = state.client.notes || '';
  }

  /**
   * Convert remote/blob headshot to a data URL so print windows can render it
   * (popup print docs cannot load many cross-origin or blob: URLs reliably).
   */
  function imageUrlToDataUrl(url, maxEdge) {
    return new Promise(function (resolve) {
      if (!url || typeof url !== 'string') {
        resolve('');
        return;
      }
      const trimmed = url.trim();
      if (!trimmed) {
        resolve('');
        return;
      }
      if (trimmed.indexOf('data:image/') === 0) {
        resolve(trimmed);
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const edge = maxEdge || 480;
      const timer = setTimeout(function () {
        resolve(trimmed);
      }, 4000);
      img.onload = function () {
        clearTimeout(timer);
        try {
          let w = img.naturalWidth || img.width || edge;
          let h = img.naturalHeight || img.height || edge;
          const scale = Math.min(1, edge / Math.max(w, h, 1));
          w = Math.max(1, Math.round(w * scale));
          h = Math.max(1, Math.round(h * scale));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.88));
        } catch (e) {
          resolve(trimmed);
        }
      };
      img.onerror = function () {
        clearTimeout(timer);
        resolve(trimmed);
      };
      img.src = trimmed;
    });
  }

  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        resolve(String(reader.result || ''));
      };
      reader.onerror = function () {
        reject(reader.error || new Error('read failed'));
      };
      reader.readAsDataURL(file);
    });
  }

  async function onBrandingPhotoFileChange(ev) {
    const input = ev && ev.target;
    const file = input && input.files && input.files[0];
    if (!file) return;
    if (!/^image\//.test(file.type || '')) {
      toast('Please choose an image file', 'warn');
      return;
    }
    try {
      const raw = await readFileAsDataUrl(file);
      const dataUrl = await imageUrlToDataUrl(raw, 480);
      if ($('branding-photo')) $('branding-photo').value = dataUrl;
      state.branding.photo = dataUrl;
      toast('Headshot ready for plans & PDF');
    } catch (e) {
      toast('Could not read that image', 'error');
    }
  }

  async function saveBranding() {
    const photoInput = ($('branding-photo') && $('branding-photo').value.trim()) || '';
    let photo = photoInput;
    if (photo && photo.indexOf('data:image/') !== 0) {
      toast('Preparing headshot for print…');
      photo = (await imageUrlToDataUrl(photo, 480)) || photo;
      if ($('branding-photo')) $('branding-photo').value = photo;
    }
    state.branding = {
      name: ($('branding-name') && $('branding-name').value.trim()) || '',
      nmls: ($('branding-nmls') && $('branding-nmls').value.trim()) || '',
      email: ($('branding-email') && $('branding-email').value.trim()) || '',
      cell: ($('branding-cell') && $('branding-cell').value.trim()) || '',
      color: ($('branding-color') && $('branding-color').value) || '#00A89D',
      accent: ($('branding-accent') && $('branding-accent').value) || '#F15A29',
      photo: photo
    };
    try {
      localStorage.setItem(BRANDING_KEY, JSON.stringify(state.branding));
    } catch (e) {
      // data URL may exceed quota — keep name fields, drop photo if needed
      if (state.branding.photo && state.branding.photo.indexOf('data:') === 0) {
        const without = Object.assign({}, state.branding, { photo: photoInput });
        try {
          localStorage.setItem(BRANDING_KEY, JSON.stringify(without));
          state.branding.photo = photoInput;
          toast('Branding saved (headshot kept for this session only — storage full)', 'warn');
        } catch (e2) {
          toast('Could not save branding to this browser', 'error');
        }
      }
    }
    updateBrandingChip();
    updateBrandingPhotoPreview();
    toggleAccordion('branding-content', 'branding-chevron', false);
    // After save in guided: collapse “edit branding” force-show and show ready chip
    const brandAcc = $('ss-branding-accordion');
    if (brandAcc) brandAcc.classList.remove('ss-force-show-branding');
    try { updateGuidedBrandingVisibility(); } catch (e) { /* ignore */ }
    toast('Branding saved — it will appear on plans, emails, borrower links, and PDFs.');
  }

  function updateBrandingPhotoPreview() {
    const prev = document.getElementById('branding-photo-preview');
    if (!prev) return;
    const src = (state.branding && state.branding.photo) || ($('branding-photo') && $('branding-photo').value) || '';
    if (src) {
      prev.innerHTML = '<img src="' + escapeHtml(src) + '" alt="Headshot preview">';
      prev.classList.remove('is-empty');
    } else {
      prev.innerHTML = '<span class="opacity-50 text-xs">No photo yet</span>';
      prev.classList.add('is-empty');
    }
  }

  function loadBranding() {
    try {
      const raw = localStorage.getItem(BRANDING_KEY);
      if (raw) state.branding = Object.assign(state.branding, JSON.parse(raw));
    } catch (e) {}
    // Coach My Profile → seed empty branding fields (embed only)
    prefillBrandingFromCoachProfile();
    if ($('branding-name')) $('branding-name').value = state.branding.name || '';
    if ($('branding-nmls')) $('branding-nmls').value = state.branding.nmls || '';
    if ($('branding-email')) $('branding-email').value = state.branding.email || '';
    if ($('branding-cell')) $('branding-cell').value = state.branding.cell || '';
    if ($('branding-color')) $('branding-color').value = state.branding.color || '#00A89D';
    if ($('branding-accent')) $('branding-accent').value = state.branding.accent || '#F15A29';
    if ($('branding-photo')) $('branding-photo').value = state.branding.photo || '';
    updateBrandingPhotoPreview();
    const fileIn = document.getElementById('branding-photo-file');
    if (fileIn && !fileIn.__ssWired) {
      fileIn.__ssWired = true;
      fileIn.addEventListener('change', onBrandingPhotoFileChange);
    }
    try { updateGuidedBrandingVisibility(); } catch (e) { /* ignore */ }
  }

  function prefillBrandingFromCoachProfile() {
    if (!isEmbed() || typeof window.getUserProfile !== 'function') return;
    let p = null;
    try { p = window.getUserProfile(); } catch (e) { return; }
    if (!p || typeof p !== 'object') return;
    let changed = false;
    if (!state.branding.name && p.name) {
      state.branding.name = String(p.name).trim();
      changed = true;
    }
    if (!state.branding.nmls && p.nmls) {
      state.branding.nmls = String(p.nmls).trim();
      changed = true;
    }
    if (!state.branding.email && p.email) {
      state.branding.email = String(p.email).trim();
      changed = true;
    }
    if (!state.branding.cell && p.phone) {
      state.branding.cell = String(p.phone).trim();
      changed = true;
    }
    if (changed) {
      try { localStorage.setItem(BRANDING_KEY, JSON.stringify(state.branding)); } catch (e) {}
    }
  }

  function saveToStorage() {
    readStateFromDom();
    const payload = {
      homeValue: state.homeValue,
      currentBalance: state.currentBalance,
      currentRate: state.currentRate,
      yearsRemaining: state.yearsRemaining,
      closingDate: state.closingDate,
      totalPayment: state.totalPayment,
      taxes: state.taxes,
      insurance: state.insurance,
      pmi: state.pmi,
      escrowIncluded: state.escrowIncluded,
      newLoanAmount: state.newLoanAmount,
      newRate: state.newRate,
      newTerm: state.newTerm,
      closingCosts: state.closingCosts,
      projectCash: state.projectCash,
      newPmi: state.newPmi,
      newPmiManual: state.newPmiManual,
      debts: state.debts
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch (e) {}
  }

  /**
   * Sanity-check persisted calculator values.
   * Catches common mistakes: annual taxes/insurance entered as monthly,
   * absurd payments, corrupted localStorage.
   */
  function sanitizeStateInPlace() {
    const d = C.DEFAULTS;
    const clamp = C.clamp;

    state.homeValue = clamp(Number(state.homeValue) || d.homeValue, 50000, 20000000);
    state.currentBalance = clamp(Number(state.currentBalance) || 0, 0, state.homeValue * 1.25);
    state.currentRate = clamp(Number(state.currentRate) || d.currentRate, 0.5, 20);
    state.yearsRemaining = clamp(Number(state.yearsRemaining) || d.yearsRemaining, 0.5, 40);
    state.totalPayment = clamp(Number(state.totalPayment) || d.totalPayment, 0, 50000);
    state.newLoanAmount = clamp(Number(state.newLoanAmount) || d.newLoanAmount, 0, 20000000);
    state.newRate = clamp(Number(state.newRate) || d.newRate, 0.5, 20);
    state.newTerm = clamp(Number(state.newTerm) || d.newTerm, 5, 40);
    state.closingCosts = clamp(Number(state.closingCosts) || 0, 0, 200000);
    state.projectCash = clamp(Number(state.projectCash) || 0, 0, 2000000);
    state.pmi = clamp(Number(state.pmi) || 0, 0, 5000);
    state.newPmi = clamp(Number(state.newPmi) || 0, 0, 5000);

    let taxes = Number(state.taxes);
    let ins = Number(state.insurance);
    if (!isFinite(taxes) || taxes < 0) taxes = d.taxes;
    if (!isFinite(ins) || ins < 0) ins = d.insurance;

    // Heuristic: annual values mistakenly stored as monthly
    // e.g. $4,200/yr taxes entered as 4200 "per month"
    let converted = false;
    if (taxes > 2500) {
      taxes = Math.round((taxes / 12) * 100) / 100;
      converted = true;
    }
    if (ins > 1200) {
      ins = Math.round((ins / 12) * 100) / 100;
      converted = true;
    }
    // Soft ceilings for monthly T&I (still allow high-tax markets)
    taxes = clamp(taxes, 0, 2500);
    ins = clamp(ins, 0, 1200);
    state.taxes = taxes;
    state.insurance = ins;

    // Total payment can't be less than T&I when escrow is included
    if (state.escrowIncluded && state.totalPayment > 0 && state.totalPayment < taxes + ins) {
      // Likely inverted fields — leave payment, clamp T&I to fit
      const share = state.totalPayment * 0.35;
      state.taxes = Math.min(taxes, share);
      state.insurance = Math.min(ins, state.totalPayment - state.taxes);
    }

    return converted;
  }

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      Object.keys(data).forEach(k => {
        if (k === 'debts') state.debts = data.debts || [];
        else if (data[k] !== undefined) state[k] = data[k];
      });
      const converted = sanitizeStateInPlace();
      if (converted) {
        try {
          saveToStorage();
        } catch (e) { /* ignore */ }
        console.info('[Ruoff] Converted annual-looking taxes/insurance to monthly amounts');
      } else {
        sanitizeStateInPlace();
      }
    } catch (e) {}
  }

  function parseLoFromUrl() {
    const params = new URLSearchParams(window.location.search);
    state.loContact = {
      name: params.get('loName') || params.get('lo') || '',
      email: params.get('loEmail') || params.get('email') || '',
      phone: params.get('loPhone') || params.get('phone') || '',
      nmls: params.get('loNmls') || params.get('nmls') || '',
      color: params.get('loColor') || params.get('color') || '',
      accent: params.get('loAccent') || params.get('accent') || '',
      photo: params.get('loPhoto') || params.get('photo') || ''
    };
    if (MODE === 'borrower') {
      applyLoBrandTheme(state.loContact);
      renderLoContactBanner();
    }
  }

  function safeHexColor(val, fallback) {
    const v = String(val || '').trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) return v;
    if (/^#[0-9A-Fa-f]{3}$/.test(v)) {
      return '#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
    }
    return fallback;
  }

  function applyLoBrandTheme(lo) {
    if (!lo) return;
    const primary = safeHexColor(lo.color, '');
    const accent = safeHexColor(lo.accent, '');
    const cssRoot = ROOT() || document.documentElement;
    const host = hostEl();
    if (primary) {
      cssRoot.style.setProperty('--ruoff-teal', primary);
      cssRoot.style.setProperty('--ruoff-teal-bright', primary);
      host.classList.add('lo-branded');
    }
    if (accent) {
      cssRoot.style.setProperty('--ruoff-orange', accent);
      host.classList.add('lo-branded');
    }
    // Header gradient follows brand colors
    const header = rootQuery('.app-header');
    if (header && (primary || accent)) {
      const c1 = primary || '#002B5C';
      const c2 = accent || primary || '#00A89D';
      header.style.background = 'linear-gradient(105deg, #002B5C 0%, ' + c1 + ' 48%, ' + c2 + ' 100%)';
    }
  }

  function initialsFromName(name) {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'LO';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function renderLoContactBanner() {
    const banner = $('lo-contact-banner');
    if (!banner || MODE !== 'borrower') return;
    const lo = state.loContact;
    if (!lo.name && !lo.email && !lo.photo) {
      banner.classList.add('hidden');
      return;
    }
    banner.classList.remove('hidden');
    const photo = lo.photo;
    const avatar = photo
      ? '<img class="lo-avatar-img" src="' + escapeHtml(photo) + '" alt="">'
      : '<span class="lo-avatar-initials">' + escapeHtml(initialsFromName(lo.name)) + '</span>';
    banner.innerHTML =
      '<div class="lo-avatar">' + avatar + '</div>' +
      '<div class="lo-banner-text min-w-0 flex-1">' +
        '<div class="font-bold truncate">' + escapeHtml(lo.name || 'Your loan officer') + '</div>' +
        '<div class="text-sm opacity-75 truncate">' +
          (lo.nmls ? 'NMLS ' + escapeHtml(lo.nmls) : '') +
          (lo.nmls && lo.phone ? ' · ' : '') +
          (lo.phone ? escapeHtml(lo.phone) : '') +
          ((lo.nmls || lo.phone) && lo.email ? ' · ' : '') +
          (lo.email ? escapeHtml(lo.email) : '') +
        '</div>' +
      '</div>' +
      (lo.email
        ? '<a class="lo-banner-cta" href="mailto:' + encodeURIComponent(lo.email) + '">Email</a>'
        : '');
  }

  function setResultsClientName(name) {
    const el = $('results-client-name');
    if (!el) return;
    const n = (name || '').trim();
    if (!n || n === 'Valued Client') {
      el.textContent = MODE === 'lo' ? 'Client' : '';
      return;
    }
    el.textContent = MODE === 'borrower' ? ' · ' + n : n;
  }

  function toast(msg, type) {
    const el = $('toast');
    if (!el) {
      alert(msg);
      return;
    }
    el.textContent = msg;
    el.classList.remove('hidden', 'toast-ok', 'toast-warn', 'toast-err');
    el.classList.add(type === 'error' ? 'toast-err' : type === 'warn' ? 'toast-warn' : 'toast-ok');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.add('hidden'), 3400);
  }

  function updateBrandingChip() {
    const chip = $('branding-chip');
    if (!chip) return;
    if (state.branding && state.branding.name) {
      chip.classList.remove('hidden');
      chip.textContent = state.branding.name + (state.branding.nmls ? ' · NMLS ' + state.branding.nmls : '');
    } else {
      chip.classList.add('hidden');
      chip.textContent = '';
    }
  }

  function updateValidationBanner(scenario) {
    const banner = $('validation-banner');
    if (!banner) return;
    const issues = [];
    if (state.homeValue > 0 && state.currentBalance > state.homeValue) {
      issues.push('Mortgage balance is higher than home value — check your numbers.');
    }
    if (state.currentRate <= 0) {
      issues.push('Add your current rate (Edit mortgage) for accurate interest comparisons.');
    }
    if (state.yearsRemaining <= 0) {
      issues.push('Add years remaining on your current loan for interest comparisons.');
    }
    if (state.newRate <= 0) {
      issues.push('Enter a proposed interest rate greater than 0.');
    }
    if (state.newLoanAmount < state.currentBalance && !scenario.isCashOutScenario) {
      // rate-and-term with smaller loan is OK (principal curtailment) — soft note only if much smaller
      if (state.newLoanAmount < state.currentBalance * 0.9) {
        issues.push('New loan is well below current balance — confirm you intend to bring cash to close.');
      }
    }
    if (scenario && scenario.overMaxLoan) {
      issues.push('Loan amount exceeds the ' + scenario.maxLtvPct + '% LTV guideline for this scenario.');
    }
    if (scenario && scenario.escrowDataWeak) {
      issues.push(
        'Taxes & insurance look missing while escrow is included — monthly savings may be overstated. Open Edit mortgage.'
      );
    }
    if (!issues.length) {
      banner.classList.add('hidden');
      banner.innerHTML = '';
      return;
    }
    banner.classList.remove('hidden');
    banner.innerHTML = '<i class="fas fa-triangle-exclamation flex-shrink-0 mt-0.5"></i><div><strong class="font-semibold">Double-check:</strong> ' +
      issues.map(escapeHtml).join(' ') + '</div>';
  }

  function appendGoalChip(text) {
    const ta = $('client-notes');
    if (!ta) return;
    const chip = String(text || '').trim();
    if (!chip) return;
    const cur = ta.value.trim();
    if (cur.toLowerCase().indexOf(chip.toLowerCase()) !== -1) {
      toast('Already in your goals', 'warn');
      return;
    }
    ta.value = cur ? (cur.replace(/[;\s]*$/, '') + '; ' + chip) : chip;
    saveClient();
    clearStep0SoftHint();
    toast('Added to goals');
  }

  function toggleAccordion(contentId, chevronId, forceOpen) {
    const content = $(contentId);
    const chevron = $(chevronId);
    if (!content) return;
    const open = forceOpen === true || (forceOpen !== false && (!content.style.maxHeight || content.style.maxHeight === '0px'));
    if (open) {
      content.style.maxHeight = content.scrollHeight + 'px';
      if (chevron) chevron.style.transform = 'rotate(180deg)';
    } else {
      content.style.maxHeight = '0px';
      if (chevron) chevron.style.transform = 'rotate(0deg)';
    }
  }

  // ─── Live update ─────────────────────────────────────────
  function computeMaxLoanForState(loanHint) {
    const hint = loanHint != null ? loanHint : state.newLoanAmount;
    return C.maxLoanAmount(state.homeValue, state.debts, {
      newLoan: hint,
      currentBalance: state.currentBalance,
      closingCosts: state.closingCosts
    });
  }

  function liveUpdate() {
    readStateFromDom();
    ensureMortgageDebt();

    // Soft clamp: while dragging, don't yank the value mid-gesture
    let maxLoan = computeMaxLoanForState(state.newLoanAmount);
    if (state.newLoanAmount > maxLoan) {
      if (!loanSliderDragging) {
        const prev = state.newLoanAmount;
        state.newLoanAmount = maxLoan;
        if ($('new-loan-amt')) $('new-loan-amt').value = maxLoan;
        if (prev - maxLoan > 500 && Date.now() - lastLoanClampToastAt > 4000) {
          lastLoanClampToastAt = Date.now();
          toast(
            'Loan amount capped at ' + money(maxLoan) +
              ' (' + (C.hasCashOutDebts(state.debts) || C.isCashOutRequest(prev, state.currentBalance, state.debts, state.closingCosts)
                ? '80% cash-out LTV'
                : 'max LTV') + ')',
            'warn'
          );
        }
      }
      maxLoan = computeMaxLoanForState(state.newLoanAmount);
    }

    const scenario = C.computeScenario({
      homeValue: state.homeValue,
      currentBalance: state.currentBalance,
      currentRate: state.currentRate,
      yearsRemaining: state.yearsRemaining,
      totalPayment: state.totalPayment,
      taxes: state.taxes,
      insurance: state.insurance,
      pmi: state.pmi,
      escrowIncluded: state.escrowIncluded,
      newLoanAmount: state.newLoanAmount,
      newRate: state.newRate,
      newTerm: state.newTerm,
      closingCosts: state.closingCosts,
      newPmi: state.newPmi,
      newPmiManual: state.newPmiManual,
      debts: state.debts
    });
    lastScenario = scenario;
    window.__lastScenario = scenario;

    // Keep proposed PMI field in sync with estimate unless user locked manual mode
    syncNewPmiField(scenario);

    // Sync sliders (don't fight active drag)
    if ($('home-slider') && !loanSliderDragging) {
      $('home-slider').max = Math.max(3000000, state.homeValue);
      $('home-slider').value = state.homeValue;
    }
    if ($('home-display')) $('home-display').textContent = money(state.homeValue);
    if ($('new-loan-slider')) {
      const sliderMax = Math.max(maxLoan, 50000);
      if (!loanSliderDragging) {
        $('new-loan-slider').max = sliderMax;
        $('new-loan-slider').min = Math.min(50000, sliderMax);
        $('new-loan-slider').value = Math.min(state.newLoanAmount, sliderMax);
      } else {
        // Keep range usable while dragging; value follows user
        if (Number($('new-loan-slider').max) < sliderMax) {
          $('new-loan-slider').max = sliderMax;
        }
      }
    }
    if ($('new-rate-slider') && state.newRate >= 2.5 && state.newRate <= 10) {
      $('new-rate-slider').value = state.newRate;
    }
    paintClosingCostsSlider(state.closingCosts);

    // Escrow integrity banner
    updateEscrowWarning(scenario);
    updateWizardRecap(scenario);

    // Current situation
    animateStat('equity', scenario.equity, { money: true });
    animateStat('ltv', scenario.ltv, { money: false, suffix: '%' });
    setText('summary-balance', money(scenario.currentBalance));
    setText('summary-total-pay', money(scenario.oldHousing));
    setText('summary-pi', money(scenario.oldPi));
    setText('summary-escrow', money(scenario.oldEscrow));

    // Before / after mirrors
    animateStat('before-housing-mirror', scenario.oldHousing, { money: true });
    setText('before-pi-mirror', money(scenario.oldPi));

    // New scenario KPIs
    setText('new-pi-display', money(scenario.newPi));
    animateStat('new-housing-display', scenario.newHousing, { money: true, className: 'text-3xl sm:text-4xl font-black pos number mt-1' });
    animateStat('new-equity', scenario.newEquity, { money: true });
    animateStat('new-ltv', scenario.newLtv, { money: false, suffix: '%' });

    // Cash flow
    const cf = scenario.monthlyCashFlowChange;
    animateStat('monthly-cashflow', cf, {
      money: true,
      signed: true,
      className: 'kpi-value number ' + (cf > 0 ? 'pos' : cf < 0 ? 'neg' : '')
    });
    setText('monthly-cashflow-hint',
      cf > 0
        ? 'More cash flow each month vs today'
        : cf < 0
          ? 'Higher combined payment than today'
          : 'About the same monthly cash flow as today');

    animateStat('total-debts-paid', scenario.totalDebtsPaidOff, { money: true, className: 'kpi-value number' });

    // Cash at closing
    const cashEl = $('cash-at-closing');
    const cashLabel = $('cash-at-closing-label');
    if (cashEl) {
      if (scenario.cashAtClosing === 0) {
        animateStat('cash-at-closing', 0, { money: true, className: 'kpi-value number', color: '' });
        if (cashLabel) cashLabel.textContent = 'Even at closing';
      } else if (scenario.isCashBack) {
        animateStat('cash-at-closing', Math.abs(scenario.cashAtClosing), {
          money: true,
          className: 'kpi-value number',
          color: '#F15A29'
        });
        if (cashLabel) cashLabel.textContent = 'Est. cash back at closing';
      } else {
        animateStat('cash-at-closing', Math.abs(scenario.cashAtClosing), {
          money: true,
          className: 'kpi-value number neg',
          color: ''
        });
        if (cashLabel) cashLabel.textContent = 'Est. cash to close';
      }
    }
    setText('closing-costs-note', 'After ' + money(scenario.closingCosts) + ' estimated closing costs');

    // Break-even (hide long / tiny-CF recoveries — not meaningful in a meeting)
    const beEl = $('break-even');
    if (beEl) {
      if (scenario.breakEvenMonths == null) {
        beEl.textContent = 'N/A';
        animState['break-even'] = null;
        if (scenario.breakEvenNotMeaningful) {
          setText(
            'break-even-hint',
            cf > 0
              ? 'Savings too small for a useful break-even'
              : 'Needs stronger monthly savings'
          );
        } else {
          setText('break-even-hint', cf <= 0 ? 'Needs positive monthly savings' : '');
        }
      } else if (scenario.breakEvenMonths === 0) {
        beEl.textContent = 'Immediate';
        animState['break-even'] = 0;
        setText('break-even-hint', 'No closing costs · tap for details');
      } else {
        animateStat('break-even', scenario.breakEvenMonths, {
          money: false,
          suffix: ' mo',
          className: 'kpi-value number'
        });
        // Short formula on the card so the number is never a black box
        const costs = Number(scenario.closingCosts) || 0;
        const cfMo = Number(scenario.monthlyCashFlowChange) || 0;
        setText(
          'break-even-hint',
          costs > 0 && cfMo > 0
            ? money(costs) + ' costs ÷ ' + money(cfMo) + '/mo · tap for math'
            : 'Closing costs recovered via monthly savings'
        );
      }
    }

    // Interest comparison strip — hide when debt consolidation makes mortgage-only interest misleading
    const mi = scenario.mortgageInterest || {};
    const intEl = $('interest-comparison');
    if (intEl) {
      if (isDebtConsolidationScenario(scenario)) {
        intEl.classList.add('hidden');
        intEl.innerHTML = '';
      } else {
        intEl.classList.remove('hidden');
        const basis =
          mi.keepMethod === 'actual_payment'
            ? ' using your current P&I'
            : '';
        if (mi.savings >= 0) {
          intEl.innerHTML =
            '<span class="pos">' +
            money(mi.savings) +
            '</span> less mortgage interest vs keeping current loan' +
            basis +
            ' <span class="opacity-50 text-xs">· tap for detail</span>';
        } else {
          intEl.innerHTML =
            '<span class="neg">' +
            money(Math.abs(mi.savings)) +
            '</span> more mortgage interest vs keeping current loan' +
            basis +
            ' <span class="opacity-50 text-xs">· tap for detail</span>';
        }
      }
    }

    // Shorter term card
    const shortEl = $('shorter-term-savings');
    if (shortEl) {
      if (scenario.shorterTermInterestSavings != null) {
        shortEl.innerHTML =
          '<div class="text-xs tracking-widest font-bold text-slate-600 dark:text-slate-300 mb-1">VS 30-YEAR AT THIS RATE</div>' +
          '<div class="text-3xl font-black pos number">' + money(scenario.shorterTermInterestSavings) + '</div>' +
          '<div class="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">lifetime interest saved with ' + scenario.newTerm + '-year term</div>';
      } else {
        shortEl.innerHTML =
          '<div class="text-xs tracking-widest font-bold text-slate-600 dark:text-slate-300 mb-1">TERM COMPARISON</div>' +
          '<div class="text-lg font-semibold text-slate-700 dark:text-slate-200">Choose a term under 30 years to compare lifetime interest</div>';
      }
    }

    // Half savings paydown
    const halfEl = $('half-savings-tip');
    if (halfEl) {
      if (scenario.halfSavingsPaydown) {
        const h = scenario.halfSavingsPaydown;
        halfEl.innerHTML =
          'If you apply <strong>' + money(h.extraMonthly) + '/mo</strong> (half of your savings) to principal, ' +
          'you could finish ~<strong>' + h.yearsSaved + ' years sooner</strong> and save about <strong>' +
          money(h.interestSavedVsBaseline) + '</strong> more in interest.';
        halfEl.classList.remove('hidden');
      } else {
        halfEl.classList.add('hidden');
      }
    }

    // Loan limit warning
    const warn = $('loan-limit-warning');
    if (warn) {
      if (scenario.isCashOutScenario || scenario.overMaxLoan) {
        warn.classList.remove('hidden');
        setText('warning-text',
          (scenario.isCashOutScenario ? 'Cash-out / debt consolidation limited to ' : 'Loan amount limited to ') +
          scenario.maxLtvPct + '% LTV (' + money(scenario.maxLoanAmount) + ')');
      } else {
        warn.classList.add('hidden');
      }
    }

    // Sticky bar + wizard dock live metrics
    updateDockMetrics(scenario, cf);

    updateValidationBanner(scenario);
    updateBrandingChip();
    updateDebtSummaryStrip();
    updateWizardPreviews(scenario);
    syncTermSegmented();
    updateStepTip(scenario);
    maybeCelebrateWin(scenario);
    renderScenarioCompare();
    updateAmortizationChart(scenario);
    saveToStorage();
  }

  // ─── Amortization / obligation chart ─────────────────────
  /** True when other consumer debts are rolled into the refi — mortgage-only interest is misleading. */
  function isDebtConsolidationScenario(scenario) {
    if (!scenario) return false;
    return (Number(scenario.otherDebtsPaidOff) || 0) > 0;
  }

  function formatCompactK(n) {
    const v = Math.abs(Number(n) || 0);
    if (v >= 1000000) return (v / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (v >= 1000) return Math.round(v / 1000) + 'k';
    return String(Math.round(v));
  }

  function buildBalancePolylineSvg(opts) {
    const seriesList = opts.series || [];
    const maxBal = opts.maxBal || 1;
    const maxYears = opts.maxYears || 1;
    const W = opts.W || 400;
    const H = opts.H || 168;
    const pad = opts.pad || { t: 16, r: 12, b: 28, l: 44 };
    const plotW = W - pad.l - pad.r;
    const plotH = H - pad.t - pad.b;

    function xOf(year) {
      return pad.l + (year / maxYears) * plotW;
    }
    function yOf(bal) {
      return pad.t + plotH - (bal / maxBal) * plotH;
    }
    function toPolyline(series) {
      return (series.points || []).map(function (pt) {
        return xOf(pt.year).toFixed(1) + ',' + yOf(pt.balance).toFixed(1);
      }).join(' ');
    }

    const ticks = [0, Math.round(maxYears / 2), Math.round(maxYears)];
    const grid = ticks.map(function (y) {
      const x = xOf(y);
      return '<line x1="' + x + '" y1="' + pad.t + '" x2="' + x + '" y2="' + (pad.t + plotH) +
        '" stroke="currentColor" stroke-opacity="0.08"/>' +
        '<text x="' + x + '" y="' + (H - 8) + '" text-anchor="middle" class="amort-axis">' + y + 'y</text>';
    }).join('');

    const yLabels = [0, 0.5, 1].map(function (f) {
      const bal = maxBal * (1 - f);
      const y = pad.t + plotH * f;
      return '<text x="' + (pad.l - 6) + '" y="' + (y + 4) + '" text-anchor="end" class="amort-axis">' +
        formatCompactK(bal) + '</text>';
    }).join('');

    const lines = seriesList.map(function (s) {
      return '<polyline fill="none" stroke="' + (s.stroke || 'var(--ruoff-teal)') +
        '" stroke-width="' + (s.width || 3) +
        '" stroke-linecap="round" stroke-linejoin="round" points="' + toPolyline(s.series) + '"/>';
    }).join('');

    return (
      '<svg class="amort-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' +
        escapeHtml(opts.aria || 'Balance chart') + '">' +
        '<rect x="' + pad.l + '" y="' + pad.t + '" width="' + plotW + '" height="' + plotH +
          '" fill="currentColor" fill-opacity="0.03" rx="8"/>' +
        grid + yLabels + lines +
      '</svg>'
    );
  }

  function buildObligationBarsHtml(scenario) {
    const mort = Number(scenario.currentBalance) || 0;
    const other = Number(scenario.otherDebtsPaidOff) || 0;
    const keepTotal = mort + other;
    const proposed = Number(scenario.newLoanAmount) || 0;
    const maxBar = Math.max(keepTotal, proposed, 1);
    const keepPct = Math.max(4, Math.round((keepTotal / maxBar) * 100));
    const propPct = Math.max(4, Math.round((proposed / maxBar) * 100));
    const mortPctOfKeep = keepTotal > 0 ? Math.round((mort / keepTotal) * 100) : 100;
    const otherPctOfKeep = 100 - mortPctOfKeep;

    return (
      '<div class="amort-bars" aria-label="Starting balances comparison">' +
        '<div class="amort-bar-row">' +
          '<div class="amort-bar-label">Still owe today<br><span class="amort-bar-sub">Mortgage + debts in refi</span></div>' +
          '<div class="amort-bar-track">' +
            '<div class="amort-bar-fill amort-bar-keep" style="width:' + keepPct + '%">' +
              (other > 0
                ? '<span class="amort-bar-seg amort-bar-seg-mort" style="width:' + mortPctOfKeep + '%"></span>' +
                  '<span class="amort-bar-seg amort-bar-seg-other" style="width:' + otherPctOfKeep + '%"></span>'
                : '') +
            '</div>' +
          '</div>' +
          '<div class="amort-bar-value number">' + money(keepTotal) + '</div>' +
        '</div>' +
        '<div class="amort-bar-row">' +
          '<div class="amort-bar-label">Proposed loan<br><span class="amort-bar-sub">One payment going forward</span></div>' +
          '<div class="amort-bar-track">' +
            '<div class="amort-bar-fill amort-bar-refi" style="width:' + propPct + '%"></div>' +
          '</div>' +
          '<div class="amort-bar-value number">' + money(proposed) + '</div>' +
        '</div>' +
        (other > 0
          ? '<div class="amort-bar-legend">' +
              '<span class="amort-leg amort-leg-mort">Mortgage ' + money(mort) + '</span>' +
              '<span class="amort-leg amort-leg-other">Other debts ' + money(other) + '</span>' +
              '<span class="amort-leg amort-leg-refi">New loan ' + money(proposed) + '</span>' +
            '</div>'
          : '') +
      '</div>'
    );
  }

  /**
   * Compact "why this path" decision card.
   * Replaces the tall payoff curve — that mostly restated the selected term
   * ("hits zero in N years") without adding coaching value.
   */
  function updateAmortizationChart(scenario) {
    const wrap = $('amort-chart');
    if (!wrap || !scenario) return;

    const consolidating = isDebtConsolidationScenario(scenario);
    const cf = Number(scenario.monthlyCashFlowChange) || 0;
    const oldHousing = Number(scenario.oldHousing) || 0;
    const newHousing = Number(scenario.newHousing) || 0;
    const otherPay = Number(scenario.otherDebtMonthly) || 0;
    const otherBal = Number(scenario.otherDebtsPaidOff) || 0;
    const oldStack = Number(scenario.oldMonthlyObligations) || oldHousing + otherPay;
    const newStack = Number(scenario.newMonthlyObligations) || newHousing;
    const maxStack = Math.max(oldStack, newStack, 1);
    const oldPct = Math.max(6, Math.round((oldStack / maxStack) * 100));
    const newPct = Math.max(6, Math.round((newStack / maxStack) * 100));
    const debtCount = (state.debts || []).filter(function (d) {
      return d && d.name !== 'Current Mortgage' && d.payOff;
    }).length;
    const be = scenario.breakEvenMonths;
    const mi = scenario.mortgageInterest || {};
    const mortSav = Number(mi.savings) || 0;
    const consumerAvoided = Number(scenario.consumerDebtInterestAvoided) || 0;
    const term = Number(scenario.newTerm) || 30;
    const mortBal = Number(scenario.currentBalance) || 0;
    const newLoan = Number(scenario.newLoanAmount) || 0;
    // What must be paid off if selected debts are in the refi (not "debt erased")
    const principalNeed = mortBal + otherBal;
    const principalGap = principalNeed - newLoan; // >0 = loan under-covers payoff

    // Headline = meeting story. Never imply total debt disappears.
    let title;
    let sub;
    if (consolidating && cf > 0) {
      title = 'Simplify the stack — and free cash each month';
      sub =
        'Selected debts are rolled into the new mortgage. You still owe the money — usually as one loan — but those separate payments drop off, which is where the monthly savings come from.';
    } else if (consolidating) {
      title = 'One payment instead of many';
      sub =
        'Debts marked for the refi leave the monthly stack. Total principal is not erased; cash flow is flat or tighter — check rate, term, loan amount, and which debts are included.';
    } else if (cf > 0 && mortSav > 500) {
      title = 'Lower monthly load and less mortgage interest';
      sub = 'Rate-and-term path only — no other debts are being rolled in.';
    } else if (cf > 0) {
      title = 'More room in the monthly budget';
      sub = 'The decision metric here is cash flow each month, not total debt disappearing.';
    } else if (mortSav > 1000) {
      title = 'Interest trade-off vs monthly payment';
      sub = 'Monthly cash flow is not better — weigh lifetime mortgage interest and term carefully.';
    } else {
      title = 'What changes with this scenario';
      sub = 'Focus on the monthly stack before and after.';
    }

    // Three decision chips (always meaningful)
    const chipCf =
      '<div class="ss-why-chip">' +
        '<div class="ss-why-chip-label">Monthly cash flow</div>' +
        '<div class="ss-why-chip-val number ' + (cf > 0 ? 'pos' : cf < 0 ? 'neg' : '') + '">' +
          (cf > 0 ? '+' : '') + money(cf) +
        '<span class="ss-why-chip-unit">/mo</span></div>' +
      '</div>';

    let chip2;
    if (consolidating) {
      chip2 =
        '<div class="ss-why-chip">' +
          '<div class="ss-why-chip-label">Debts rolled in</div>' +
          '<div class="ss-why-chip-val number">' + money(otherBal) + '</div>' +
          '<div class="ss-why-chip-meta">' +
            debtCount + ' account' + (debtCount === 1 ? '' : 's') +
            (otherPay > 0 ? ' · frees ' + money(otherPay) + '/mo' : '') +
          '</div>' +
        '</div>';
    } else {
      chip2 =
        '<div class="ss-why-chip">' +
          '<div class="ss-why-chip-label">Mortgage interest vs keep</div>' +
          '<div class="ss-why-chip-val number ' + (mortSav >= 0 ? 'pos' : 'neg') + '">' +
            (mortSav >= 0 ? '' : '−') + money(Math.abs(mortSav)) +
          '</div>' +
          '<div class="ss-why-chip-meta">Lifetime lifetime · tap interest for math</div>' +
        '</div>';
    }

    let chip3;
    if (be != null && be > 0) {
      chip3 =
        '<div class="ss-why-chip">' +
          '<div class="ss-why-chip-label">Closing-cost recovery</div>' +
          '<div class="ss-why-chip-val number">' + be + '<span class="ss-why-chip-unit"> mo</span></div>' +
          '<div class="ss-why-chip-meta">' + money(scenario.closingCosts) + ' ÷ monthly savings</div>' +
        '</div>';
    } else if (be === 0) {
      chip3 =
        '<div class="ss-why-chip">' +
          '<div class="ss-why-chip-label">Closing-cost recovery</div>' +
          '<div class="ss-why-chip-val">Immediate</div>' +
          '<div class="ss-why-chip-meta">No costs modeled</div>' +
        '</div>';
    } else if (consumerAvoided > 0) {
      chip3 =
        '<div class="ss-why-chip">' +
          '<div class="ss-why-chip-label">Consumer interest avoided</div>' +
          '<div class="ss-why-chip-val number pos">' + money(consumerAvoided) + '</div>' +
          '<div class="ss-why-chip-meta">Where debt rates were entered</div>' +
        '</div>';
    } else {
      chip3 =
        '<div class="ss-why-chip">' +
          '<div class="ss-why-chip-label">Proposed term</div>' +
          '<div class="ss-why-chip-val number">' + term + '<span class="ss-why-chip-unit"> yr</span></div>' +
          '<div class="ss-why-chip-meta">' +
            money(scenario.newLoanAmount) + ' @ ' +
            (Number(scenario.newRate) || 0) + '%' +
          '</div>' +
        '</div>';
    }

    // Compact monthly-stack bars (the real "before/after")
    const stackHtml =
      '<div class="ss-why-stack" aria-label="Monthly obligation comparison">' +
        '<div class="ss-why-stack-title">Monthly stack</div>' +
        '<div class="ss-why-stack-row">' +
          '<div class="ss-why-stack-label">Today' +
            (otherPay > 0 ? '<span class="ss-why-stack-hint">housing + debts in refi</span>' : '<span class="ss-why-stack-hint">total housing</span>') +
          '</div>' +
          '<div class="ss-why-stack-track"><div class="ss-why-stack-fill ss-why-stack-before" style="width:' + oldPct + '%"></div></div>' +
          '<div class="ss-why-stack-amt number">' + money(oldStack) + '</div>' +
        '</div>' +
        '<div class="ss-why-stack-row">' +
          '<div class="ss-why-stack-label">After refi<span class="ss-why-stack-hint">new total housing</span></div>' +
          '<div class="ss-why-stack-track"><div class="ss-why-stack-fill ss-why-stack-after" style="width:' + newPct + '%"></div></div>' +
          '<div class="ss-why-stack-amt number ' + (newStack <= oldStack ? 'pos' : '') + '">' + money(newStack) + '</div>' +
        '</div>' +
        '<div class="ss-why-stack-delta ' + (cf >= 0 ? 'pos' : 'neg') + '">' +
          (cf >= 0 ? 'You free ' : 'You add ') +
          '<strong class="number">' + money(Math.abs(cf)) + '</strong>/mo' +
          (consolidating && debtCount > 0
            ? ' · ' + (debtCount + 1) + ' payments → 1 housing payment'
            : '') +
        '</div>' +
      '</div>';

    // Principal note (honest): consolidation moves debt into the mortgage — it does not vanish.
    // Do NOT show "still owe today vs proposed loan" bars — they look like debt erasure when
    // the new loan is similar/smaller, and confuse when the loan is intentionally sized differently.
    let principalHtml = '';
    if (consolidating && otherBal > 0) {
      let gapNote = '';
      if (principalGap > 500) {
        gapNote =
          '<p class="ss-why-callout ss-why-callout-warn">' +
            'New loan (' + money(newLoan) + ') is about <strong class="number">' + money(principalGap) +
            '</strong> short of mortgage + selected debts (' + money(principalNeed) +
            '). That shortfall shows up as cash to close unless you size the loan up (or drop some debts from the refi).' +
          '</p>';
      } else if (principalGap < -500) {
        gapNote =
          '<p class="ss-why-callout">' +
            'New loan is about <strong class="number">' + money(Math.abs(principalGap)) +
            '</strong> above mortgage + selected debts — typically closing costs and/or cash-out.' +
          '</p>';
      } else {
        gapNote =
          '<p class="ss-why-callout">' +
            'New loan (~' + money(newLoan) + ') is in line with paying off the mortgage + the ' +
            money(otherBal) + ' in selected debts (plus normal costs).' +
          '</p>';
      }
      principalHtml =
        '<div class="ss-why-principal">' +
          '<div class="ss-why-stack-title">What “rolled in” means</div>' +
          '<p class="ss-why-explain">' +
            'You are not erasing <strong class="number">' + money(otherBal) +
            '</strong> of consumer debt. That balance is paid off at closing and typically financed inside the new loan. ' +
            'The meeting win is <em>monthly</em>: those accounts stop billing separately' +
            (otherPay > 0 ? ' (about <strong class="number pos">' + money(otherPay) + '/mo</strong> freed)' : '') +
            '. Card/loan interest savings only show when you enter APRs on those debts — otherwise we stick to cash flow.' +
          '</p>' +
          gapNote +
        '</div>';
    } else if (!consolidating && Math.abs(mortSav) >= 500) {
      principalHtml =
        '<p class="ss-why-explain ss-why-explain-tight">' +
          (mortSav >= 0
            ? 'About <strong class="number pos">' + money(mortSav) + '</strong> less mortgage interest over the proposed life vs keeping the current schedule.'
            : 'About <strong class="number neg">' + money(Math.abs(mortSav)) + '</strong> more mortgage interest vs keep-current — often a larger balance or longer term. Cash flow above is still the primary meeting metric.') +
          ' <button type="button" class="ss-why-link" onclick="RuoffApp.showInterestModal()">Interest detail</button>' +
        '</p>';
    }

    wrap.className = 'amort-chart ss-why-card glass glass-hero rounded-[1.75rem] p-5 mt-6';
    wrap.innerHTML =
      '<div class="ss-why-head">' +
        '<div>' +
          '<div class="label-caps">Why this path</div>' +
          '<h3 class="amort-title">' + escapeHtml(title) + '</h3>' +
          '<p class="amort-sub">' + escapeHtml(sub) + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="ss-why-chips">' + chipCf + chip2 + chip3 + '</div>' +
      stackHtml +
      principalHtml;
  }

  function maybeCelebrateWin(scenario) {
    const cf = scenario.monthlyCashFlowChange;
    const sign = cf > 25 ? 1 : cf < -25 ? -1 : 0;
    if (prevCashFlowSign === null) {
      prevCashFlowSign = sign;
      return;
    }
    // Fire once when flipping into meaningful positive cash flow
    if (sign === 1 && prevCashFlowSign !== 1 && Date.now() > confettiCooldownUntil) {
      confettiCooldownUntil = Date.now() + 8000;
      fireWinConfetti();
      toast('Nice — this scenario improves monthly cash flow');
    }
    prevCashFlowSign = sign;
  }

  function fireWinConfetti() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (typeof confetti !== 'function') return;
    const colors = ['#00A89D', '#F15A29', '#002B5C', '#34d399', '#ffffff'];
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.65 },
      colors: colors,
      disableForReducedMotion: true
    });
    setTimeout(function () {
      confetti({ particleCount: 40, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors: colors });
      confetti({ particleCount: 40, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors: colors });
    }, 180);
  }

  function updateDockMetrics(scenario, cf) {
    const cfText = (cf > 0 ? '+' : '') + money(cf);
    const cashText = scenario.cashAtClosing === 0
      ? 'Even'
      : ((scenario.isCashBack ? 'Back ' : 'Due ') + money(Math.abs(scenario.cashAtClosing)));
    const beText = scenario.breakEvenMonths != null ? scenario.breakEvenMonths + ' mo' : 'N/A';
    const housingText = money(scenario.oldHousing) + ' → ' + money(scenario.newHousing);

    ['sticky-cashflow', 'dock-cashflow', 'ms-cashflow'].forEach(function (id) {
      const el = $(id);
      if (!el) return;
      el.textContent = cfText;
      el.className = (el.className || '').replace(/\b(pos|neg)\b/g, '').trim() + ' ' + (cf > 0 ? 'pos' : cf < 0 ? 'neg' : '');
    });
    ['sticky-cash', 'dock-cash', 'ms-cash'].forEach(function (id) {
      setText(id, cashText);
    });
    ['sticky-breakeven', 'ms-breakeven'].forEach(function (id) {
      setText(id, beText);
    });
    setText('ms-housing', housingText);
  }

  function updateWizardPreviews(scenario) {
    if (!scenario) return;
    setText('wiz-preview-equity', money(scenario.equity));
    setText('wiz-preview-ltv', scenario.ltv + '%');
    setText('wiz-preview-housing', money(scenario.oldHousing));
    setText('wiz-preview-pi', money(scenario.oldPi));
    setText('plan-before-housing', money(scenario.oldHousing));
    setText('plan-after-housing', money(scenario.newHousing));
    const cf = scenario.monthlyCashFlowChange;
    setText('plan-cf', (cf > 0 ? '+' : '') + money(cf));
    setText('plan-cash', money(Math.abs(scenario.cashAtClosing)));
    setText('plan-be', scenario.breakEvenMonths != null ? scenario.breakEvenMonths + ' mo' : 'N/A');
  }

  /** Contextual tip under wizard footer / step */
  function updateStepTip(scenario) {
    const tip = $('wizard-step-tip');
    if (!tip) return;
    const name = (state.client && state.client.name) ? String(state.client.name).trim() : '';
    const who = name ? name.split(/\s+/)[0] : (MODE === 'lo' ? 'your client' : 'you');
    const tips = {
      0: MODE === 'lo'
        ? 'Start with goals — we’ll use them when we shape the refinance and the written plan.'
        : 'Tell us what matters most — lower payment, debt payoff, or cash-out.',
      1: 'A close estimate is fine. Next we lock in the current mortgage so comparisons are honest.',
      2: 'Rate + years remaining power true interest math — not just the new payment.',
      3: selectedOtherDebtsCount() > 0
        ? selectedOtherDebtsCount() + ' debt(s) ready. Next we’ll test refinance options that may wipe them out.'
        : 'No other debts? Skip ahead — you can always add them later from Full workspace.',
      4: scenario
        ? (scenario.monthlyCashFlowChange > 0
          ? 'Looking strong for ' + who + ': about ' + money(scenario.monthlyCashFlowChange) + ' more monthly cash flow on this path.'
          : scenario.monthlyCashFlowChange < 0
            ? 'Payment is higher than today — try rate, term, or which debts you roll in.'
            : 'Tune rate, term, or loan amount until the trade-offs match their goals.')
        : 'Dial the scenario until cash flow and cash at closing feel right for their goals.',
      5: 'Numbers stay locked. Generate to get a client-ready story plus calculated alternatives.'
    };
    tip.textContent = tips[wizardStep] || '';
  }

  // ─── Experience mode + wizard ────────────────────────────
  function isEmbed() {
    const r = ROOT();
    return !!(r && (r.getAttribute('data-ss-embed') === '1' || r.hasAttribute('data-ss-embed')));
  }

  /**
   * Embed guided tour = body-level modal wizard (#ss-guided-layer).
   * Moves .app-shell into #ss-guided-scroll so the coach page stays behind a dim
   * backdrop. Multi-monitor safety: layer is window-scoped fixed (not desktop-wide),
   * no transform/filter animations, no body overflow lock thrash, host never scrubs
   * while open.
   */
  function isGuidedPortalOpen() {
    const layer = document.getElementById('ss-guided-layer');
    return !!(layer && layer.classList.contains('is-open'));
  }

  function wireGuidedDockNav(scope) {
    const root = scope || document;
    const back = root.querySelector ? root.querySelector('#ss-guided-back') : document.getElementById('ss-guided-back');
    const next = root.querySelector ? root.querySelector('#ss-guided-next') : document.getElementById('ss-guided-next');
    const exit = root.querySelector ? root.querySelector('#ss-guided-exit') : document.getElementById('ss-guided-exit');
    const backdrop = root.querySelector ? root.querySelector('#ss-guided-backdrop') : document.getElementById('ss-guided-backdrop');
    if (back && !back.__ssWired) {
      back.__ssWired = true;
      back.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        wizardBack();
      });
    }
    if (next && !next.__ssWired) {
      next.__ssWired = true;
      next.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        wizardNext();
      });
    }
    if (exit && !exit.__ssWired) {
      exit.__ssWired = true;
      exit.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        setExperienceMode('expert');
      });
    }
    if (backdrop && !backdrop.__ssWired) {
      backdrop.__ssWired = true;
      backdrop.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        setExperienceMode('expert');
      });
    }
  }

  /**
   * Remove orphaned/broken overlays only. Never tears down an intentional open portal.
   */
  function scrubGlitchOverlays() {
    try {
      if (isGuidedPortalOpen()) return;

      // Orphaned inplace backdrops from older builds
      document.querySelectorAll('.ss-guided-backdrop-inplace').forEach(function (n) {
        n.remove();
      });

      // Closed layer leftover without is-open — safe to remove
      const layer = document.getElementById('ss-guided-layer');
      if (layer && !layer.classList.contains('is-open')) {
        // Only remove if shell is already back in root (or layer is empty)
        const shellInLayer = layer.querySelector('.app-shell');
        if (!shellInLayer) {
          layer.remove();
        }
      }

      // Clear body locks only when no guided portal and no calc modal
      if (!openModalIds.length) {
        document.body.classList.remove('ss-guided-modal-open', 'ss-smart-savings-modal-open', 'modal-open');
      }

      const root = ROOT();
      if (root) {
        root.classList.remove('ss-guided-inplace', 'ss-guided-inline');
        root.style.removeProperty('position');
        root.style.removeProperty('inset');
        root.style.removeProperty('z-index');
        root.style.removeProperty('max-height');
        root.style.removeProperty('overflow');
        root.style.removeProperty('transform');
      }
    } catch (e) { /* ignore */ }
  }

  function ensureGuidedLayer() {
    let layer = document.getElementById('ss-guided-layer');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'ss-guided-layer';
      layer.className = 'ss-guided-layer';
      layer.setAttribute('role', 'dialog');
      layer.setAttribute('aria-modal', 'true');
      layer.setAttribute('aria-label', 'Smart Savings guided tour');
      // Use div (not <header>/<footer>/<main>) so coach page chrome CSS
      // (body>header margin-left / gradient) never clips the modal.
      layer.innerHTML =
        '<div class="ss-guided-backdrop" id="ss-guided-backdrop" aria-hidden="true"></div>' +
        '<div class="ss-guided-dialog" role="document">' +
          '<div class="ss-guided-chrome" id="ss-guided-chrome" role="banner">' +
            '<div class="ss-guided-chrome-text">' +
              '<span class="ss-guided-kicker">Guided meeting</span>' +
              '<span class="ss-guided-step-label" id="ss-guided-step-label">Step 1 of 6</span>' +
            '</div>' +
            '<button type="button" class="ss-guided-exit" id="ss-guided-exit">' +
              '<i class="fas fa-times" aria-hidden="true"></i> Close' +
            '</button>' +
          '</div>' +
          '<div class="ss-guided-scroll" id="ss-guided-scroll" tabindex="-1"></div>' +
          '<div class="ss-guided-footer-dock" id="ss-guided-footer-dock" role="contentinfo">' +
            '<div class="ss-guided-nav-bar">' +
              '<button type="button" class="ss-guided-nav-back" id="ss-guided-back">Back</button>' +
              '<div class="ss-guided-nav-meta" id="ss-guided-nav-meta">Step 1 of 6</div>' +
              '<button type="button" class="ss-guided-nav-next" id="ss-guided-next">Continue</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      document.body.appendChild(layer);
    }
    wireGuidedDockNav(layer);
    return layer;
  }

  function openGuidedPortal() {
    if (!isEmbed()) return false;
    forceCloseAllCalcModals();

    const root = ROOT();
    if (!root) return false;

    // Shell may already be in portal (re-open) or still in root
    let shell =
      root.querySelector('.app-shell') ||
      document.querySelector('#ss-guided-scroll > .app-shell') ||
      document.querySelector('#ss-guided-layer .app-shell');
    if (!shell) return false;

    const layer = ensureGuidedLayer();
    const scroll = document.getElementById('ss-guided-scroll');
    if (!scroll) return false;

    // Undo hard-hide from a prior closeGuidedPortal
    layer.style.removeProperty('display');
    layer.removeAttribute('aria-hidden');

    // Leave a marker so we can put the shell back exactly where it was
    if (!document.getElementById('ss-guided-shell-marker') && shell.parentNode === root) {
      const marker = document.createElement('div');
      marker.id = 'ss-guided-shell-marker';
      marker.setAttribute('hidden', '');
      marker.setAttribute('aria-hidden', 'true');
      root.insertBefore(marker, shell);
    }

    if (shell.parentNode !== scroll) {
      scroll.appendChild(shell);
    }

    // Mode classes for scoped CSS (body.mode-guided → .root / #ss-guided-scroll dual)
    layer.classList.add('is-open', 'mode-guided');
    layer.classList.remove('mode-expert', 'ss-guided-exiting');
    scroll.classList.add('mode-guided', 'smart-savings-root');
    scroll.classList.remove('mode-expert');
    if (root.classList.contains('dark') || document.documentElement.classList.contains('dark')) {
      scroll.classList.add('dark');
      layer.classList.add('dark');
    }
    root.classList.add('mode-guided', 'ss-guided-portal-active');
    root.classList.remove('mode-expert', 'ss-guided-inline', 'ss-guided-inplace');
    shell.classList.add('mode-guided');
    shell.classList.remove('mode-expert');

    // Premium guided: hide nested app chrome (modal chrome + dock replace them)
    ['#wizard-footer', '.app-header', '.app-footer', '.mode-bar', '.mini-nav', '#meeting-strip', '.meeting-strip'].forEach(function (sel) {
      try {
        shell.querySelectorAll(sel).forEach(function (el) {
          el.setAttribute('data-ss-hidden-in-portal', '1');
          el.style.setProperty('display', 'none', 'important');
        });
      } catch (e) { /* ignore */ }
    });
    const shellFooter = shell.querySelector('#wizard-footer');
    if (shellFooter) {
      shellFooter.setAttribute('data-ss-hidden-in-guided', '1');
    }

    document.body.classList.add('ss-guided-modal-open');
    // Soft lock: hide overflow on the coach main without multi-monitor thrash
    document.documentElement.classList.add('ss-guided-modal-open');

    updateGuidedChromeLabel();
    activateGuidedFocusTrap(layer);

    // Focus scroll pane for keyboard (don't steal if already focused inside)
    try {
      const next = document.getElementById('ss-guided-next');
      if (next && typeof next.focus === 'function') next.focus({ preventScroll: true });
      else if (!scroll.contains(document.activeElement)) {
        scroll.focus({ preventScroll: true });
      }
    } catch (e) { /* ignore */ }

    return true;
  }

  let __ssGuidedFocusHandler = null;
  let __ssGuidedFocusRoot = null;

  function getFocusableIn(root) {
    if (!root) return [];
    const sel =
      'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]):not([type="hidden"]),' +
      'select:not([disabled]),[tabindex]:not([tabindex="-1"])';
    return Array.prototype.slice.call(root.querySelectorAll(sel)).filter(function (el) {
      return el.offsetParent !== null || el === document.activeElement;
    });
  }

  function activateGuidedFocusTrap(layer) {
    deactivateGuidedFocusTrap();
    const root = layer || document.getElementById('ss-guided-layer');
    if (!root) return;
    __ssGuidedFocusRoot = root;
    __ssGuidedFocusHandler = function (e) {
      if (e.key !== 'Tab' || !__ssGuidedFocusRoot || !__ssGuidedFocusRoot.classList.contains('is-open')) return;
      const nodes = getFocusableIn(__ssGuidedFocusRoot);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first || !__ssGuidedFocusRoot.contains(document.activeElement)) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last || !__ssGuidedFocusRoot.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', __ssGuidedFocusHandler, true);
  }

  function deactivateGuidedFocusTrap() {
    if (__ssGuidedFocusHandler) {
      document.removeEventListener('keydown', __ssGuidedFocusHandler, true);
      __ssGuidedFocusHandler = null;
    }
    __ssGuidedFocusRoot = null;
  }

  /** Smooth guided → full workspace handoff before showing plan results */
  function handoffGuidedToPlanWorkspace() {
    return new Promise(function (resolve) {
      const layer = document.getElementById('ss-guided-layer');
      const label = document.getElementById('ss-guided-step-label');
      const meta = document.getElementById('ss-guided-nav-meta');
      if (label) label.textContent = 'Opening your plan…';
      if (meta) meta.textContent = 'Switching to Full workspace';
      if (layer) layer.classList.add('ss-guided-exiting');
      setTimeout(function () {
        try {
          setExperienceMode('expert', { silent: true });
        } catch (e) { /* ignore */ }
        if (layer) layer.classList.remove('ss-guided-exiting');
        toast('Plan will open in Full workspace', 'info');
        resolve();
      }, 320);
    });
  }

  function closeGuidedPortal() {
    try {
      deactivateGuidedFocusTrap();
      const root = ROOT();
      const layer = document.getElementById('ss-guided-layer');
      const scroll = document.getElementById('ss-guided-scroll');
      // Prefer shell in portal; fall back to anywhere (never leave it stranded in a closed layer)
      let shell =
        (scroll && scroll.querySelector('.app-shell')) ||
        (layer && layer.querySelector('.app-shell')) ||
        (root && root.querySelector('.app-shell')) ||
        document.querySelector('.app-shell');

      if (shell) {
        // Restore any chrome we forced-hide while the portal was open
        try {
          shell.querySelectorAll('[data-ss-hidden-in-portal="1"], [data-ss-hidden-in-guided="1"]').forEach(function (el) {
            el.removeAttribute('data-ss-hidden-in-portal');
            el.removeAttribute('data-ss-hidden-in-guided');
            el.style.removeProperty('display');
          });
        } catch (e) { /* ignore */ }
        shell.classList.remove('mode-guided');
        shell.classList.add('mode-expert');
        shell.style.removeProperty('display');
        shell.style.removeProperty('height');
        shell.style.removeProperty('min-height');
        shell.style.removeProperty('overflow');

        const marker = document.getElementById('ss-guided-shell-marker');
        if (marker && marker.parentNode) {
          marker.parentNode.insertBefore(shell, marker);
          marker.remove();
        } else if (root && !root.contains(shell)) {
          root.appendChild(shell);
        }
      }

      if (layer) {
        layer.classList.remove('is-open', 'mode-guided', 'dark', 'ss-guided-exiting');
        // Hard-hide so a half-closed portal never paints a blank white sheet
        layer.style.setProperty('display', 'none', 'important');
        layer.setAttribute('aria-hidden', 'true');
      }
      if (scroll) {
        scroll.classList.remove('mode-guided', 'dark', 'smart-savings-root');
        // If anything is still parked in the scroll pane, yank it back
        try {
          const stranded = scroll.querySelector('.app-shell');
          if (stranded && root && !root.contains(stranded)) {
            root.appendChild(stranded);
          }
        } catch (e) { /* ignore */ }
      }
      if (root) {
        root.classList.remove(
          'ss-guided-inplace',
          'ss-guided-inline',
          'ss-guided-portal-active',
          'mode-guided'
        );
        root.classList.add('mode-expert');
        // Clear any leftover inline collapse from portal-active experiments
        root.style.removeProperty('height');
        root.style.removeProperty('min-height');
        root.style.removeProperty('overflow');
        root.style.removeProperty('padding');
        root.style.removeProperty('margin');
        root.style.removeProperty('background');
        root.style.removeProperty('border');
      }

      // Full workspace: every panel visible (no single-step guided hide)
      try {
        rootQueryAll('.wizard-panel').forEach(function (p) {
          p.classList.add('active-step');
          p.style.removeProperty('display');
        });
      } catch (e) { /* ignore */ }

      document.body.classList.remove(
        'ss-guided-modal-open',
        'ss-smart-savings-modal-open',
        'modal-open'
      );
      document.documentElement.classList.remove('ss-guided-modal-open');

      // Bring the calculator back into view (close used to leave a blank scroll position)
      try {
        const sec = document.getElementById('smart-savings');
        if (sec && typeof sec.scrollIntoView === 'function') {
          sec.scrollIntoView({ block: 'start', behavior: 'auto' });
        }
      } catch (e) { /* ignore */ }
    } catch (e) {
      console.warn('[Ruoff] closeGuidedPortal', e);
    }
    forceCloseAllCalcModals();
    // Soft live-update so KPIs repaint after shell reattach
    try {
      if (typeof liveUpdate === 'function') liveUpdate();
    } catch (e) { /* ignore */ }
  }

  /** Pull .app-shell back and drop portal (force). Used on full re-init. */
  function recoverShellFromLegacyPortal() {
    try {
      if (isGuidedPortalOpen()) {
        closeGuidedPortal();
        return;
      }
      const root = ROOT();
      const stuck = document.querySelector('#ss-guided-scroll > .app-shell')
        || document.querySelector('#ss-guided-layer .app-shell')
        || document.querySelector('body > .app-shell');
      if (stuck && root && !root.contains(stuck)) {
        root.appendChild(stuck);
      }
      const marker = document.getElementById('ss-guided-shell-marker');
      if (marker) marker.remove();
      const layer = document.getElementById('ss-guided-layer');
      if (layer && !layer.classList.contains('is-open')) layer.remove();
    } catch (e) { /* ignore */ }
  }

  function destroyLegacyGuidedPortal() {
    try {
      closeGuidedPortal();
      // Hard remove layer after close so force-init starts clean
      const layer = document.getElementById('ss-guided-layer');
      if (layer) layer.remove();
      const marker = document.getElementById('ss-guided-shell-marker');
      if (marker) marker.remove();
      document.body.classList.remove('ss-guided-modal-open');
      document.documentElement.classList.remove('ss-guided-modal-open');
      const root = ROOT();
      if (root) {
        root.classList.remove('ss-guided-inline', 'ss-guided-inplace', 'ss-guided-portal-active');
      }
    } catch (e) {
      console.warn('[Ruoff] guided cleanup', e);
    }
  }

  function updateGuidedChromeLabel() {
    const label = (WIZARD_STEPS[wizardStep] && WIZARD_STEPS[wizardStep].label) || '';
    const stepText = 'Step ' + (wizardStep + 1) + ' of ' + WIZARD_STEPS.length + (label ? ' · ' + label : '');
    const el = document.getElementById('ss-guided-step-label');
    if (el) el.textContent = stepText;
    const meta = document.getElementById('ss-guided-nav-meta');
    if (meta) meta.textContent = stepText;
    const kicker = document.querySelector('#ss-guided-chrome .ss-guided-kicker');
    if (kicker) kicker.textContent = MODE === 'lo' ? 'Guided meeting' : 'Guided tour';

    const back = document.getElementById('ss-guided-back');
    if (back) {
      back.style.visibility = wizardStep === 0 ? 'hidden' : 'visible';
      back.disabled = wizardStep === 0;
    }
    const next = document.getElementById('ss-guided-next');
    if (next) {
      if (wizardStep >= WIZARD_STEPS.length - 1) {
        next.textContent = MODE === 'borrower' ? 'Create my plan' : 'Generate plan';
      } else {
        next.textContent = WIZARD_NEXT_LABELS[wizardStep] || 'Continue';
      }
    }
  }

  function setExperienceMode(mode, opts) {
    const options = opts || {};
    const next = (mode === 'expert' || mode === 'full') ? 'expert' : 'guided';
    const prev = experienceMode;
    experienceMode = next;

    const host = hostEl();
    if (host && host.classList) {
      host.classList.remove('mode-guided', 'mode-expert', 'ss-guided-open');
      host.classList.add(experienceMode === 'expert' ? 'mode-expert' : 'mode-guided');
    }
    if (!isEmbed()) {
      document.body.classList.remove('mode-guided', 'mode-expert');
      document.body.classList.add(experienceMode === 'expert' ? 'mode-expert' : 'mode-guided');
    }

    // Embed: guided opens body-level wizard modal and moves .app-shell into it.
    // If the portal cannot open (missing shell), fall back to Full workspace so the
    // section never looks like "tips only + empty body".
    if (isEmbed() && experienceMode === 'guided') {
      const opened = openGuidedPortal();
      if (!opened) {
        experienceMode = 'expert';
        if (host && host.classList) {
          host.classList.remove('mode-guided', 'ss-guided-portal-active');
          host.classList.add('mode-expert');
        }
        try { closeGuidedPortal(); } catch (e) { /* ignore */ }
      } else {
        // Ensure layer is visible when re-opening after a hard-hide close
        const layer = document.getElementById('ss-guided-layer');
        if (layer) {
          layer.style.removeProperty('display');
          layer.removeAttribute('aria-hidden');
        }
      }
    } else if (isEmbed()) {
      closeGuidedPortal();
      // Belt-and-suspenders: never leave shell in a closed portal after Full workspace
      try { recoverShellFromLegacyPortal(); } catch (e) { /* ignore */ }
    }
    const shellEl = rootQuery('.app-shell');
    if (shellEl && shellEl.classList) {
      shellEl.classList.remove('mode-guided', 'mode-expert');
      shellEl.classList.add(experienceMode === 'expert' ? 'mode-expert' : 'mode-guided');
    }

    rootQueryAll('[data-mode], #mode-guided, #mode-expert').forEach(function (btn) {
      const btnMode = btn.getAttribute('data-mode')
        || (btn.id === 'mode-expert' ? 'expert' : btn.id === 'mode-guided' ? 'guided' : '');
      if (!btnMode) return;
      const active = (btnMode === 'expert' && experienceMode === 'expert')
        || (btnMode === 'guided' && experienceMode === 'guided');
      btn.classList.toggle('active', active);
      btn.classList.toggle('is-active', active); // coach-mode-bar parity
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    try { localStorage.setItem('ruoff.experienceMode.' + MODE, experienceMode); } catch (err) {}

    if (experienceMode === 'guided') {
      goToWizardStep(wizardStep, { silent: true });
      updateGuidedChromeLabel();
      if (!options.silent) {
        toast(isEmbed() ? 'Guided meeting — one step at a time' : 'Guided mode — one step at a time');
      }
    } else {
      rootQueryAll('.wizard-panel').forEach(function (p) {
        p.classList.add('active-step');
        p.style.removeProperty('display');
      });
      // Ensure shell is back in the section root (not stranded in a closed portal)
      if (isEmbed()) {
        try {
          const root = ROOT();
          if (root && !root.querySelector('.app-shell')) {
            recoverShellFromLegacyPortal();
          }
          if (root) {
            root.classList.add('mode-expert');
            root.classList.remove('mode-guided', 'ss-guided-portal-active');
          }
        } catch (e) { /* ignore */ }
      }
      // Restore branding accordion (may have been hidden while guided + profile ready)
      try { updateGuidedBrandingVisibility(); } catch (e) { /* ignore */ }
      if (!options.silent && prev === 'guided') {
        toast(isEmbed() ? 'Full workspace — best for client meetings' : 'Full workspace — all sections visible');
      }
    }
  }

  function wireModeToggle() {
    const bar = rootQuery('.mode-bar');
    if (!bar || bar.__ssModeWired) return;
    bar.__ssModeWired = true;
    // Capture-phase so nothing steals the click
    bar.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-mode], #mode-guided, #mode-expert');
      if (!btn || !bar.contains(btn)) return;
      e.preventDefault();
      e.stopPropagation();
      const mode = btn.getAttribute('data-mode')
        || (btn.id === 'mode-expert' ? 'expert' : 'guided');
      setExperienceMode(mode);
    }, true);
  }

  function polishModeBarForEmbed() {
    if (!isEmbed()) return;
    // Keep labels identical to coach-mode-bar (Newsletter / Bio / Plan):
    // "Guided setup" | "Full form" — do NOT rewrite to Guided tour / Full workspace.
    const guided = $('mode-guided');
    const expert = $('mode-expert');
    if (guided) {
      guided.innerHTML = '<i class="fas fa-wand-magic-sparkles" aria-hidden="true"></i> Guided setup';
      guided.title = 'Step-by-step meeting wizard (6 steps) — best for learning and first runs';
    }
    if (expert) {
      expert.innerHTML = 'Full form';
      expert.title = 'Recommended for live client meetings — all sections open in the page';
      // Remove legacy "Recommended for meetings" pill if an older inject left it
      expert.parentElement?.querySelector('.ss-mode-rec')?.remove();
    }
    const restart = rootQuery('.mode-restart');
    if (restart) {
      restart.innerHTML = '<i class="fas fa-rotate-left"></i> Restart tour';
      restart.title = 'Restart guided setup from step 1';
      restart.onclick = function (e) {
        e.preventDefault();
        restartWizard();
      };
    }
  }

  function restartWizard() {
    wizardStep = 0;
    wizardMaxReached = 0;
    try {
      localStorage.setItem(WIZARD_STEP_KEY, '0');
      localStorage.setItem(MAX_WIZARD_REACHED_KEY, '0');
    } catch (e) { /* ignore */ }
    dismissResumeBanner();
    setExperienceMode('guided');
    goToWizardStep(0);
    toast('Guided meeting — step 1 of ' + WIZARD_STEPS.length);
  }

  function renderWizardRail() {
    const rail = $('wizard-rail');
    if (!rail) return;
    rail.innerHTML = WIZARD_STEPS.map(function (s, i) {
      let cls = '';
      if (i === wizardStep) cls = 'active';
      else if (i <= wizardMaxReached) cls = 'done';
      const displayIcon = i === wizardStep
        ? String(i + 1)
        : (i <= wizardMaxReached ? '<i class="fas fa-check"></i>' : String(i + 1));
      return '<button type="button" class="wizard-rail-step ' + cls + '" data-wiz-goto="' + i + '" title="' + s.label + '">' +
        '<span class="wizard-dot">' + displayIcon + '</span>' +
        '<span class="wizard-rail-label">' + s.label + '</span></button>';
    }).join('');
    rail.querySelectorAll('[data-wiz-goto]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const i = parseInt(btn.getAttribute('data-wiz-goto'), 10);
        // Allow jump to any step already reached, or next step
        if (i <= wizardMaxReached || i <= wizardStep + 1) goToWizardStep(i);
        else toast('Finish the earlier steps first — or jump back to where you left off', 'warn');
      });
    });
  }

  function goToWizardStep(step, opts) {
    const options = opts || {};
    wizardStep = Math.max(0, Math.min(WIZARD_STEPS.length - 1, step));
    if (wizardStep > wizardMaxReached) wizardMaxReached = wizardStep;
    try {
      localStorage.setItem(WIZARD_STEP_KEY, String(wizardStep));
      localStorage.setItem(MAX_WIZARD_REACHED_KEY, String(wizardMaxReached));
    } catch (e) { /* ignore */ }

    rootQueryAll('.wizard-panel').forEach(function (panel) {
      const s = parseInt(panel.getAttribute('data-wizard-step'), 10);
      panel.classList.toggle('active-step', s === wizardStep);
    });
    renderWizardRail();
    const meta = $('wizard-footer-meta');
    if (meta) {
      meta.textContent = 'Step ' + (wizardStep + 1) + ' of ' + WIZARD_STEPS.length + ' · ' + WIZARD_STEPS[wizardStep].label;
    }
    const back = $('wizard-back');
    const next = $('wizard-next');
    if (back) back.style.visibility = wizardStep === 0 ? 'hidden' : 'visible';
    if (next) {
      if (wizardStep >= WIZARD_STEPS.length - 1) {
        next.textContent = MODE === 'borrower' ? 'Create my plan' : 'Generate plan';
        next.onclick = function () { generateSmartPlan(); };
      } else {
        next.textContent = WIZARD_NEXT_LABELS[wizardStep] || 'Continue';
        next.onclick = function () { wizardNext(); };
      }
    }
    // Guided step 0: open client/goals, keep branding collapsed so the welcome stays the hero
    if (experienceMode === 'guided' && wizardStep === 0) {
      try {
        toggleAccordion('client-info-content', 'client-chevron', true);
        toggleAccordion('branding-content', 'branding-chevron', false);
      } catch (e) { /* ignore */ }
      clearStep0SoftHint();
    }
    updateGuidedBrandingVisibility();
    updateStepTip(lastScenario);
    if (wizardStep === 5 || experienceMode === 'guided') updateWizardRecap(lastScenario);
    if (!options.silent) dismissResumeBanner();
    updateGuidedChromeLabel();
    if (!options.silent && experienceMode === 'guided') {
      scrollWizardStepIntoView();
    }
  }

  /** Scroll so the active wizard step is in view (portal scroll pane or page). */
  function scrollWizardStepIntoView() {
    if (experienceMode !== 'guided') return;
    const reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior = reduceMotion ? 'auto' : 'smooth';

    const active = rootQuery('.wizard-panel.active-step');
    const rail = $('wizard-rail');
    const target = (rail && rail.offsetParent !== null) ? rail : active;
    if (!target) return;

    // Modal portal: scroll the dialog pane, not the coach page
    const scroll = guidedScrollEl();
    if (isGuidedPortalOpen() && scroll) {
      requestAnimationFrame(function () {
        try {
          const top = Math.max(0, target.offsetTop - 12);
          if (typeof scroll.scrollTo === 'function') {
            scroll.scrollTo({ top: top, behavior: behavior });
          } else {
            scroll.scrollTop = top;
          }
        } catch (e) {
          if (typeof target.scrollIntoView === 'function') {
            target.scrollIntoView({ block: 'start', behavior: behavior });
          }
        }
      });
      return;
    }

    if (!target.scrollIntoView) return;
    requestAnimationFrame(function () {
      target.scrollIntoView({ behavior: behavior, block: 'start' });
    });
  }

  function hasClientNameOrGoal() {
    // Prefer live DOM; fall back to state (no nested saveClient — avoids recursion with saveClient hooks)
    const name = (($('client-name') && $('client-name').value) || (state.client && state.client.name) || '').trim();
    const notes = (($('client-notes') && $('client-notes').value) || (state.client && state.client.notes) || '').trim();
    return !!(name || notes);
  }

  function clearStep0SoftHint() {
    const hint = $('ss-step0-soft-hint');
    if (hint) {
      hint.classList.add('hidden');
      hint.textContent = '';
    }
  }

  /** Soft gate: need a client name or a goal before leaving step 0 in guided mode */
  function softValidateWizardStep(fromStep) {
    if (experienceMode !== 'guided') return true;
    if (fromStep === 0 && !hasClientNameOrGoal()) {
      try {
        toggleAccordion('client-info-content', 'client-chevron', true);
      } catch (e) { /* ignore */ }
      const hint = $('ss-step0-soft-hint');
      if (hint) {
        hint.classList.remove('hidden');
        hint.textContent = 'Add a client name or tap a goal chip first — takes 5 seconds and makes the plan personal.';
      }
      toast('Add a client name or goal to continue', 'warn');
      const focusEl = $('client-name') || $('client-notes');
      try { if (focusEl) focusEl.focus({ preventScroll: false }); } catch (e) { /* ignore */ }
      return false;
    }
    if (fromStep === 0) clearStep0SoftHint();

    if (fromStep === 1) {
      try { readStateFromDom(); } catch (e) { /* ignore */ }
      if (!(state.homeValue > 0)) {
        toast('Enter a home value estimate to continue', 'warn');
        try { $('home-value') && $('home-value').focus(); } catch (e) { /* ignore */ }
        return false;
      }
    }
    if (fromStep === 2) {
      try { readStateFromDom(); } catch (e) { /* ignore */ }
      if (!(state.currentBalance > 0)) {
        toast('Enter the current mortgage balance (Edit mortgage) to continue', 'warn');
        return false;
      }
    }
    return true;
  }

  function brandingLooksReady() {
    try { readStateFromDom(); } catch (e) { /* ignore */ }
    const name = (state.branding && state.branding.name) || ($('branding-name') && $('branding-name').value) || '';
    return !!String(name).trim();
  }

  function updateGuidedBrandingVisibility() {
    const chip = $('ss-branding-ready-chip');
    const acc = $('ss-branding-accordion');
    const text = $('ss-branding-ready-text');
    const guided = experienceMode === 'guided';
    const ready = brandingLooksReady();

    if (chip) {
      const showChip = guided && ready;
      chip.classList.toggle('hidden', !showChip);
      if (showChip && text) {
        const b = state.branding || {};
        const parts = [b.name, b.nmls ? 'NMLS ' + b.nmls : ''].filter(Boolean);
        text.textContent = parts.length ? '· ' + parts.join(' · ') : '';
      }
    }
    if (acc) {
      // In guided with branding ready: hide accordion noise. Always show in full form.
      acc.classList.toggle('hidden', guided && ready && !acc.classList.contains('ss-force-show-branding'));
      if (!(guided && ready)) acc.classList.remove('ss-force-show-branding');
    }
  }

  function showBrandingInGuided() {
    const acc = $('ss-branding-accordion');
    if (acc) {
      acc.classList.add('ss-force-show-branding');
      acc.classList.remove('hidden');
    }
    try {
      toggleAccordion('branding-content', 'branding-chevron', true);
    } catch (e) { /* ignore */ }
    const chip = $('ss-branding-ready-chip');
    if (chip) chip.classList.add('hidden');
  }

  function updateWizardRecap(scenario) {
    const line = $('ss-wizard-recap-line');
    if (!line) return;
    try { readStateFromDom(); } catch (e) { /* ignore */ }
    const sc = scenario || lastScenario;
    const name = ((state.client && state.client.name) || '').trim();
    const goals = ((state.client && state.client.notes) || '').trim();
    let goalShort = goals;
    if (goalShort.length > 48) goalShort = goalShort.slice(0, 45).trim() + '…';
    const debtN = typeof selectedOtherDebtsCount === 'function' ? selectedOtherDebtsCount() : 0;
    const parts = [];
    if (name) parts.push(name);
    if (goalShort) parts.push(goalShort);
    else if (!name) parts.push(MODE === 'lo' ? 'Client goals pending' : 'Your goals');
    if (sc && sc.equity != null) parts.push(money(sc.equity) + ' equity');
    else if (state.homeValue > 0 && state.currentBalance >= 0) {
      const eq = Math.max(0, state.homeValue - state.currentBalance);
      parts.push(money(eq) + ' equity');
    }
    if (debtN > 0) parts.push(debtN + (debtN === 1 ? ' other debt' : ' other debts'));
    else parts.push('no other debts');
    if (sc && sc.monthlyCashFlowChange != null) {
      const cf = sc.monthlyCashFlowChange;
      parts.push((cf > 0 ? '+' : '') + money(cf) + '/mo cash flow');
    }
    line.textContent = parts.join(' · ');
  }

  function wizardNext() {
    if (wizardStep >= WIZARD_STEPS.length - 1) {
      generateSmartPlan();
      return;
    }
    if (!softValidateWizardStep(wizardStep)) return;
    goToWizardStep(wizardStep + 1);
  }

  function wizardBack() {
    if (wizardStep <= 0) return;
    goToWizardStep(wizardStep - 1);
  }

  function restoreWizardProgress() {
    try {
      const saved = parseInt(localStorage.getItem(WIZARD_STEP_KEY), 10);
      const maxR = parseInt(localStorage.getItem(MAX_WIZARD_REACHED_KEY), 10);
      if (!isNaN(maxR)) wizardMaxReached = Math.max(0, Math.min(WIZARD_STEPS.length - 1, maxR));
      if (!isNaN(saved)) {
        wizardStep = Math.max(0, Math.min(WIZARD_STEPS.length - 1, saved));
        wizardMaxReached = Math.max(wizardMaxReached, wizardStep);
      }
    } catch (e) { /* ignore */ }
  }

  function setTerm(years) {
    state.newTerm = Number(years) || 30;
    if ($('new-term')) $('new-term').value = String(state.newTerm);
    syncTermSegmented();
    liveUpdate();
  }

  function syncTermSegmented() {
    const term = String(parseNum($('new-term') && $('new-term').value) || state.newTerm || 30);
    rootQueryAll('#term-segmented [data-term]').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-term') === term);
    });
  }

  function setText(id, text) {
    const el = $(id);
    if (el) el.textContent = text;
  }

  /**
   * Animate a numeric display toward a target value (money or plain).
   * @param {string} id
   * @param {number} target
   * @param {{ money?: boolean, signed?: boolean, suffix?: string, className?: string, color?: string }} opts
   */
  function animateStat(id, target, opts) {
    const el = $(id);
    if (!el) return;
    const options = opts || {};
    const to = Number(target) || 0;
    const from = animState[id] != null ? animState[id] : to;
    animState[id] = to;

    if (options.className) el.className = options.className;
    if (options.color !== undefined) el.style.color = options.color || '';

    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || Math.abs(to - from) < 0.5) {
      el.textContent = formatAnimValue(to, options);
      return;
    }

    const start = performance.now();
    const duration = Math.min(700, 280 + Math.abs(to - from) / 50);
    if (el._animFrame) cancelAnimationFrame(el._animFrame);

    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const cur = from + (to - from) * eased;
      el.textContent = formatAnimValue(cur, options);
      if (t < 1) {
        el._animFrame = requestAnimationFrame(frame);
      } else {
        el.textContent = formatAnimValue(to, options);
        el._animFrame = null;
      }
    }
    el._animFrame = requestAnimationFrame(frame);
  }

  function formatAnimValue(n, options) {
    const rounded = options.money !== false ? Math.round(n) : Math.round(n);
    if (options.suffix === '%') return rounded + '%';
    if (options.suffix === ' mo') {
      if (n == null || !isFinite(n)) return options.naText || 'N/A';
      return rounded + ' mo';
    }
    if (options.signed) {
      if (rounded > 0) return '+' + money(rounded);
      return money(rounded);
    }
    return money(Math.abs(rounded));
  }

  // ─── Inputs ──────────────────────────────────────────────
  function formatHomeValue() {
    // Live type: update math without fighting the caret via aggressive reformat
    const raw = parseNum($('home-value').value);
    if (raw > 0) state.homeValue = raw;
    liveUpdate();
  }

  function formatHomeValueBlur() {
    const raw = parseNum($('home-value').value);
    state.homeValue = raw || state.homeValue;
    if ($('home-value')) $('home-value').value = Number(state.homeValue).toLocaleString();
    liveUpdate();
  }

  function syncHomeSlider() {
    state.homeValue = parseNum($('home-slider').value);
    $('home-value').value = state.homeValue.toLocaleString();
    liveUpdate();
  }

  function onNewLoanInput() {
    liveUpdate();
  }

  function onNewRateInput() {
    readStateFromDom();
    if ($('new-rate-slider') && state.newRate >= 2.5 && state.newRate <= 10) {
      $('new-rate-slider').value = state.newRate;
    }
    liveUpdate();
  }

  /** Keep closing-cost slider max usable when LO types a higher quote. */
  function paintClosingCostsSlider(value) {
    const sl = $('closing-costs-slider');
    const readout = $('closing-costs-readout');
    const v = Math.max(0, Number(value) || 0);
    if (sl) {
      const baseMax = 30000;
      const nextMax = Math.max(baseMax, Math.ceil(v / 1000) * 1000);
      if (Number(sl.max) !== nextMax) sl.max = String(nextMax);
      sl.value = String(Math.min(v, nextMax));
    }
    if (readout) readout.textContent = money(Math.round(v));
  }

  function onClosingCostsInput() {
    readStateFromDom();
    state.closingCosts = C.clamp(Number(state.closingCosts) || 0, 0, 200000);
    paintClosingCostsSlider(state.closingCosts);
    liveUpdate();
  }

  function syncClosingCostsSlider() {
    const sl = $('closing-costs-slider');
    if (!sl) return;
    state.closingCosts = C.clamp(parseNum(sl.value), 0, 200000);
    if ($('closing-costs')) $('closing-costs').value = state.closingCosts;
    paintClosingCostsSlider(state.closingCosts);
    liveUpdate();
  }

  function syncNewPmiField(scenario) {
    const s = scenario || lastScenario;
    const input = $('new-pmi');
    const manual = $('new-pmi-manual');
    const hint = $('new-pmi-hint');
    if (manual) manual.checked = !!state.newPmiManual;
    if (input) {
      input.disabled = !state.newPmiManual;
      if (!state.newPmiManual && s) {
        const est = s.estimatedNewPmi != null ? s.estimatedNewPmi : s.newPmi;
        state.newPmi = est;
        input.value = String(Math.round((Number(est) || 0) * 100) / 100);
      } else if (state.newPmiManual) {
        input.value = String(state.newPmi || 0);
      }
    }
    if (hint && s) {
      if (state.newPmiManual) {
        hint.textContent = 'Using your quote. Uncheck to restore ~0.5%/yr estimate when LTV > 80%.';
      } else if ((s.newLtv || 0) > 80) {
        hint.textContent =
          'Auto: ~$'+ Math.round(s.estimatedNewPmi || s.newPmi || 0) +
          '/mo estimate (0.5%/yr) because new LTV is ' + s.newLtv + '%. Override with a quote if you have one.';
      } else {
        hint.textContent = 'Auto: $0 — new LTV is at or under 80% (no PMI estimated).';
      }
    }
  }

  function onNewPmiManualToggle() {
    const manual = $('new-pmi-manual');
    state.newPmiManual = !!(manual && manual.checked);
    if (!state.newPmiManual && lastScenario) {
      state.newPmi = lastScenario.estimatedNewPmi || 0;
    } else if ($('new-pmi')) {
      state.newPmi = parseNum($('new-pmi').value);
    }
    liveUpdate();
  }

  function onNewPmiInput() {
    if (!state.newPmiManual) return;
    state.newPmi = parseNum($('new-pmi') && $('new-pmi').value);
    liveUpdate();
  }

  function syncNewLoanSlider() {
    state.newLoanAmount = parseNum($('new-loan-slider').value);
    if ($('new-loan-amt')) $('new-loan-amt').value = state.newLoanAmount;
    liveUpdate();
  }

  function onLoanSliderPointerDown() {
    loanSliderDragging = true;
  }

  function onLoanSliderPointerUp() {
    loanSliderDragging = false;
    // Apply soft clamp after gesture ends
    liveUpdate();
  }

  function wireLoanSliderGesture() {
    const sl = $('new-loan-slider') || document.getElementById('new-loan-slider');
    if (!sl || sl.__ssDragWired) return;
    sl.__ssDragWired = true;
    ['pointerdown', 'mousedown', 'touchstart'].forEach(function (ev) {
      sl.addEventListener(ev, onLoanSliderPointerDown, { passive: true });
    });
    ['pointerup', 'mouseup', 'touchend', 'pointercancel', 'blur'].forEach(function (ev) {
      sl.addEventListener(ev, onLoanSliderPointerUp, { passive: true });
    });
    // Safety: if pointer leaves window mid-drag
    window.addEventListener('pointerup', function () {
      if (loanSliderDragging) onLoanSliderPointerUp();
    }, { passive: true });
  }

  /** Ensure home / rate / loan / closing-cost sliders always fire even if inline handlers fail after inject */
  function wireMainRangeSliders() {
    const map = [
      { id: 'home-slider', fn: syncHomeSlider },
      { id: 'new-loan-slider', fn: syncNewLoanSlider },
      { id: 'new-rate-slider', fn: syncNewRateSlider },
      { id: 'closing-costs-slider', fn: syncClosingCostsSlider }
    ];
    map.forEach(function (item) {
      const el = document.getElementById(item.id);
      if (!el || el.__ssRangeWired) return;
      el.__ssRangeWired = true;
      el.addEventListener('input', item.fn);
      el.addEventListener('change', item.fn);
      el.style.touchAction = 'none';
      el.classList.add('ss-range-slider');
    });
    wireLoanSliderGesture();
  }

  function syncNewRateSlider() {
    state.newRate = parseNum($('new-rate-slider').value);
    if ($('new-rate')) $('new-rate').value = state.newRate;
    liveUpdate();
  }

  function updateEscrowWarning(scenario) {
    const s = scenario || lastScenario;
    let banner = document.getElementById('ss-escrow-warning');
    const weak = !!(s && s.escrowDataWeak);
    if (!weak) {
      if (banner) banner.classList.add('hidden');
      return;
    }
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'ss-escrow-warning';
      banner.className = 'ss-escrow-warning';
      banner.setAttribute('role', 'status');
      const host =
        rootQuery('#section-mortgage') ||
        rootQuery('.wizard-panel[data-wizard-step="2"]') ||
        ROOT();
      if (host) host.insertBefore(banner, host.firstChild);
      else return;
    }
    banner.classList.remove('hidden');
    banner.innerHTML =
      '<i class="fas fa-triangle-exclamation" aria-hidden="true"></i>' +
      '<div><strong>Taxes &amp; insurance look missing.</strong> ' +
      'Your payment is marked as including escrow, but taxes/insurance are near zero. ' +
      'That inflates “monthly savings.” ' +
      '<button type="button" class="ss-escrow-fix-btn" onclick="RuoffApp.openMortgageModal()">' +
      'Edit mortgage details</button></div>';
  }

  function applyPreset(name) {
    readStateFromDom();
    if ($('project-cash')) state.projectCash = parseNum($('project-cash').value) || 30000;
    if (name === 'debt-wipeout') {
      state.debts.forEach(d => { d.payOff = true; });
    }
    const patch = C.applyPreset(name, state);
    if (patch.newLoanAmount != null) {
      state.newLoanAmount = patch.newLoanAmount;
      if ($('new-loan-amt')) $('new-loan-amt').value = patch.newLoanAmount;
    }
    if (patch.newTerm != null) {
      state.newTerm = patch.newTerm;
      if ($('new-term')) $('new-term').value = String(patch.newTerm);
    }
    if (patch.newRate != null) {
      state.newRate = patch.newRate;
      if ($('new-rate')) $('new-rate').value = patch.newRate;
    }
    rootQueryAll('.preset-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-preset') === name);
    });
    liveUpdate();
    toast('Applied “' + name.replace(/-/g, ' ') + '” preset — fine-tune as needed.');
  }

  // ─── Mortgage modal ──────────────────────────────────────
  function syncBalanceSliderRange() {
    const sl = mortgageField('balance-slider');
    if (!sl) return;
    const bal = Number(state.currentBalance) || 0;
    const home = Number(state.homeValue) || 450000;
    const max = Math.min(5000000, Math.max(500000, home * 1.2, bal + 50000, 100000));
    const min = 0;
    sl.min = String(min);
    sl.max = String(max);
    sl.step = '1000';
    const v = Math.min(max, Math.max(min, Math.round(bal / 1000) * 1000 || 0));
    sl.value = String(v);
    sl.removeAttribute('disabled');
    sl.style.pointerEvents = 'auto';
    sl.style.touchAction = 'none';
  }

  /**
   * Keep big display + middle $ input + bottom readout identical.
   * Always query inside the OPEN mortgage modal (avoids stale clones).
   */
  function paintBalanceFields(bal, opts) {
    const options = opts || {};
    const input = mortgageField('modal-balance');
    const display = mortgageField('modal-balance-display');
    const readOut = mortgageField('balance-slider-readout');
    const formatted = money(bal);
    const rawStr = String(Math.round(Number(bal) || 0));

    if (display) display.textContent = formatted;
    if (readOut) readOut.textContent = formatted;

    if (input) {
      // Never skip when driven by the slider — that was leaving the field stuck at the old amount
      if (options.fromSlider || document.activeElement !== input) {
        // type=number: set valueAsNumber when possible for reliable repaint
        try {
          input.valueAsNumber = Math.round(Number(bal) || 0);
        } catch (e) {
          input.value = rawStr;
        }
        if (String(input.value) !== rawStr && String(input.valueAsNumber) !== rawStr) {
          input.value = rawStr;
        }
        try {
          input.setAttribute('value', rawStr);
        } catch (e2) { /* ignore */ }
      }
    }
  }

  function applyBalanceFromControl(raw, opts) {
    const options = opts || {};
    let bal = parseNum(raw);
    if (!isFinite(bal)) bal = state.currentBalance || 0;
    bal = Math.max(0, Math.round(bal));
    state.currentBalance = bal;

    const sl = mortgageField('balance-slider');
    if (sl) {
      let max = parseNum(sl.max) || 2000000;
      const min = parseNum(sl.min) || 0;
      if (bal > max) {
        max = Math.min(5000000, Math.max(bal + 50000, max));
        sl.max = String(max);
      }
      const clamped = Math.min(max, Math.max(min, bal));
      if (options.fromSlider || document.activeElement !== sl) {
        sl.value = String(clamped);
      }
    }

    // Always paint after state change — slider, ±, and typing paths
    paintBalanceFields(bal, { fromSlider: !!options.fromSlider || options.forcePaint });
    ensureMortgageDebt();
    updateMortgageModal();

    if (options.fullLive) {
      try { liveUpdate(); } catch (e) { /* ignore */ }
      // liveUpdate must not leave the modal field behind
      paintBalanceFields(state.currentBalance, { fromSlider: true });
    } else {
      const sum = document.getElementById('summary-balance');
      if (sum) sum.textContent = money(bal);
      const eqEl = document.getElementById('equity');
      const ltvEl = document.getElementById('ltv');
      if (eqEl || ltvEl) {
        const eq = Math.max(0, (state.homeValue || 0) - bal);
        const ltvPct = state.homeValue > 0 ? Math.round((bal / state.homeValue) * 100) : 0;
        if (eqEl) eqEl.textContent = money(eq);
        if (ltvEl) ltvEl.textContent = ltvPct + '%';
      }
    }
  }

  function wireBalanceSlider() {
    const sl = mortgageField('balance-slider');
    const input = mortgageField('modal-balance');
    const wrap = mortgageField('balance-slider-wrap');

    if (sl && !sl.__ssBalWired) {
      sl.__ssBalWired = true;
      const onSlide = function (e) {
        if (e) e.stopPropagation();
        // Read from event target (the live node), not a stale closure
        const node = e && e.target ? e.target : mortgageField('balance-slider');
        applyBalanceFromControl(node ? node.value : state.currentBalance, {
          fromSlider: true,
          forcePaint: true
        });
      };
      sl.addEventListener('input', onSlide, true);
      sl.addEventListener('change', onSlide, true);
      sl.addEventListener(
        'pointerdown',
        function (e) {
          e.stopPropagation();
          try { sl.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        },
        true
      );
      sl.addEventListener(
        'pointerup',
        function (e) {
          try { sl.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
          const node = mortgageField('balance-slider');
          applyBalanceFromControl(node ? node.value : state.currentBalance, {
            fromSlider: true,
            forcePaint: true,
            fullLive: true
          });
        },
        true
      );
      sl.style.touchAction = 'none';
      sl.style.pointerEvents = 'auto';
      sl.style.cursor = 'pointer';
    }

    if (wrap && !wrap.__ssBalWired) {
      wrap.__ssBalWired = true;
      const setFromClientX = function (clientX) {
        const slider = mortgageField('balance-slider');
        if (!slider) return;
        const rect = slider.getBoundingClientRect();
        if (rect.width <= 0) return;
        const min = parseNum(slider.min) || 0;
        const max = parseNum(slider.max) || 2000000;
        const step = parseNum(slider.step) || 1000;
        let ratio = (clientX - rect.left) / rect.width;
        ratio = Math.max(0, Math.min(1, ratio));
        let val = min + ratio * (max - min);
        val = Math.round(val / step) * step;
        slider.value = String(val);
        applyBalanceFromControl(val, { fromSlider: true, forcePaint: true });
      };
      wrap.addEventListener('pointerdown', function (e) {
        if (e.button != null && e.button !== 0) return;
        // Don't steal clicks from the range thumb itself — still allow track clicks
        e.preventDefault();
        e.stopPropagation();
        try { wrap.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        setFromClientX(e.clientX);
        const move = function (ev) { setFromClientX(ev.clientX); };
        const up = function (ev) {
          setFromClientX(ev.clientX);
          applyBalanceFromControl(
            (mortgageField('balance-slider') || {}).value,
            { fromSlider: true, forcePaint: true, fullLive: true }
          );
          try { wrap.releasePointerCapture(ev.pointerId); } catch (err) { /* ignore */ }
          wrap.removeEventListener('pointermove', move);
          wrap.removeEventListener('pointerup', up);
        };
        wrap.addEventListener('pointermove', move);
        wrap.addEventListener('pointerup', up);
      });
    }

    if (input && !input.__ssBalWired) {
      input.__ssBalWired = true;
      input.addEventListener('input', function () {
        applyBalanceFromControl(input.value, { fromSlider: false });
      });
      input.addEventListener('change', function () {
        applyBalanceFromControl(input.value, { fromSlider: false, fullLive: true, forcePaint: true });
      });
    }

    const minus = mortgageField('balance-step-down');
    const plus = mortgageField('balance-step-up');
    if (minus && !minus.__ssBalWired) {
      minus.__ssBalWired = true;
      minus.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        applyBalanceFromControl((state.currentBalance || 0) - 5000, {
          fromSlider: true,
          forcePaint: true,
          fullLive: true
        });
        syncBalanceSliderRange();
        paintBalanceFields(state.currentBalance, { fromSlider: true });
      });
    }
    if (plus && !plus.__ssBalWired) {
      plus.__ssBalWired = true;
      plus.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        applyBalanceFromControl((state.currentBalance || 0) + 5000, {
          fromSlider: true,
          forcePaint: true,
          fullLive: true
        });
        syncBalanceSliderRange();
        paintBalanceFields(state.currentBalance, { fromSlider: true });
      });
    }
  }

  /**
   * Compact reactive sliders for rate / years / payment in the mortgage modal.
   * Always scoped via mortgageField() so we hit the visible host copy.
   */
  function paintMortgageMiniReadouts() {
    const rateR = mortgageField('current-rate-readout');
    const yrsR = mortgageField('years-remaining-readout');
    const payR = mortgageField('total-payment-readout');
    if (rateR) rateR.textContent = (Number(state.currentRate) || 0).toFixed(3).replace(/\.?0+$/, '') + '%';
    if (yrsR) {
      const y = Number(state.yearsRemaining) || 0;
      yrsR.textContent = y + (y === 1 ? ' yr' : ' yrs');
    }
    if (payR) payR.textContent = money(state.totalPayment || 0);
  }

  function syncMortgageMiniSlidersFromState() {
    const rateSl = mortgageField('current-rate-slider');
    const yrsSl = mortgageField('years-remaining-slider');
    const paySl = mortgageField('total-payment-slider');
    const rate = Number(state.currentRate) || 6.75;
    const yrs = Number(state.yearsRemaining) || 27;
    const pay = Number(state.totalPayment) || 2400;
    if (rateSl) {
      rateSl.min = '2.5';
      rateSl.max = '12';
      rateSl.step = '0.125';
      rateSl.value = String(C.clamp(rate, 2.5, 12));
    }
    if (yrsSl) {
      yrsSl.min = '1';
      yrsSl.max = '40';
      yrsSl.step = '0.5';
      yrsSl.value = String(C.clamp(yrs, 1, 40));
    }
    if (paySl) {
      const maxPay = Math.max(8000, Math.ceil(pay / 500) * 500 + 1000);
      paySl.min = '400';
      paySl.max = String(Math.min(25000, maxPay));
      paySl.step = '25';
      paySl.value = String(C.clamp(pay, 400, parseNum(paySl.max) || 8000));
    }
    paintMortgageMiniReadouts();
  }

  function wireMortgageMiniSliders() {
    function wirePair(opts) {
      const input = mortgageField(opts.inputId);
      const sl = mortgageField(opts.sliderId);
      if (sl && !sl.__ssMiniWired) {
        sl.__ssMiniWired = true;
        const onSlide = function (e) {
          if (e) e.stopPropagation();
          const node = e && e.target ? e.target : mortgageField(opts.sliderId);
          let v = parseNum(node && node.value);
          if (!isFinite(v)) return;
          if (opts.round) v = opts.round(v);
          opts.apply(v);
          if (input && document.activeElement !== input) {
            input.value = String(v);
            try { input.setAttribute('value', String(v)); } catch (err) { /* ignore */ }
          }
          paintMortgageMiniReadouts();
          updateMortgageModal();
        };
        sl.addEventListener('input', onSlide, true);
        sl.addEventListener('change', onSlide, true);
        sl.style.touchAction = 'none';
        sl.style.pointerEvents = 'auto';
      }
      if (input && !input.__ssMiniWired) {
        input.__ssMiniWired = true;
        const onType = function () {
          let v = parseNum(input.value);
          if (!isFinite(v)) return;
          if (opts.round) v = opts.round(v);
          opts.apply(v);
          const slider = mortgageField(opts.sliderId);
          if (slider) {
            const min = parseNum(slider.min);
            const max = parseNum(slider.max);
            if (v >= min && v <= max) slider.value = String(v);
            else if (v > max) {
              slider.max = String(Math.min(opts.maxCap || max * 2, Math.ceil(v * 1.1)));
              slider.value = String(v);
            }
          }
          paintMortgageMiniReadouts();
          updateMortgageModal();
        };
        input.addEventListener('input', onType);
        input.addEventListener('change', onType);
      }
    }

    wirePair({
      inputId: 'current-rate',
      sliderId: 'current-rate-slider',
      maxCap: 20,
      round: function (v) { return Math.round(v * 1000) / 1000; },
      apply: function (v) { state.currentRate = C.clamp(v, 0.5, 20); }
    });
    wirePair({
      inputId: 'years-remaining',
      sliderId: 'years-remaining-slider',
      maxCap: 40,
      round: function (v) { return Math.round(v * 2) / 2; },
      apply: function (v) { state.yearsRemaining = C.clamp(v, 0.5, 40); }
    });
    wirePair({
      inputId: 'total-payment',
      sliderId: 'total-payment-slider',
      maxCap: 25000,
      round: function (v) { return Math.round(v); },
      apply: function (v) { state.totalPayment = C.clamp(v, 0, 50000); }
    });
  }

  function openMortgageModal(fromDebts) {
    mortgageModalSource = fromDebts ? 'debts' : 'main';
    mortgageModalDirty = false;
    sanitizeStateInPlace();

    lockCalcModalBackdrops();
    // Lift first so all field queries hit the visible modal
    setModalOpen('mortgage-modal', true);
    if (fromDebts) setModalOpen('debts-modal', false);

    function fillAndWire() {
      const host = document.getElementById('ss-modal-host');
      if (host) {
        host.classList.add('ss-has-open-modal');
        host.style.pointerEvents = 'auto';
      }
      // Clear wire flags on the LIVE modal nodes only
      [
        'balance-slider', 'modal-balance', 'balance-slider-wrap', 'balance-step-down', 'balance-step-up',
        'current-rate', 'current-rate-slider', 'years-remaining', 'years-remaining-slider',
        'total-payment', 'total-payment-slider'
      ].forEach(function (id) {
        const n = mortgageField(id);
        if (n) {
          n.__ssBalWired = false;
          n.__ssMiniWired = false;
        }
      });

      const balInput = mortgageField('modal-balance');
      if (balInput) {
        balInput.value = String(Math.round(state.currentBalance || 0));
        balInput.setAttribute('value', String(Math.round(state.currentBalance || 0)));
      }
      const pay = mortgageField('total-payment');
      if (pay) pay.value = state.totalPayment;
      const taxes = mortgageField('taxes');
      if (taxes) {
        taxes.value = state.taxes;
        taxes.disabled = false;
      }
      const ins = mortgageField('insurance');
      if (ins) {
        ins.value = state.insurance;
        ins.disabled = false;
      }
      const pmi = mortgageField('pmi');
      if (pmi) pmi.value = state.pmi;
      const esc = mortgageField('escrow-included');
      if (esc) esc.checked = state.escrowIncluded;
      const rate = mortgageField('current-rate');
      if (rate) rate.value = state.currentRate;
      const yrs = mortgageField('years-remaining');
      if (yrs) yrs.value = state.yearsRemaining;
      const cd = mortgageField('closing-date');
      if (cd) cd.value = state.closingDate || '';

      syncBalanceSliderRange();
      wireBalanceSlider();
      syncMortgageMiniSlidersFromState();
      wireMortgageMiniSliders();
      paintBalanceFields(state.currentBalance, { fromSlider: true, forcePaint: true });
      updateMortgageModal();

      const sl = mortgageField('balance-slider');
      if (sl) {
        sl.style.pointerEvents = 'auto';
        sl.style.zIndex = '5';
        sl.style.position = 'relative';
        sl.style.width = '100%';
        sl.style.height = '28px';
      }
    }

    fillAndWire();
    setTimeout(fillAndWire, 50);
  }

  /** Persist mortgage fields from the modal into state */
  function readMortgageModalIntoState() {
    const balEl = mortgageField('modal-balance');
    if (balEl) {
      state.currentBalance = parseNum(balEl.value) || state.currentBalance;
    }
    // Prefer live state if slider moved further
    if (state.currentBalance > 0) {
      /* keep */
    }
    const pay = mortgageField('total-payment');
    if (pay) state.totalPayment = parseNum(pay.value) || state.totalPayment;
    const taxes = mortgageField('taxes');
    if (taxes) state.taxes = parseNum(taxes.value);
    const ins = mortgageField('insurance');
    if (ins) state.insurance = parseNum(ins.value);
    const pmi = mortgageField('pmi');
    if (pmi) state.pmi = parseNum(pmi.value);
    const esc = mortgageField('escrow-included');
    if (esc) state.escrowIncluded = esc.checked;
    const rate = mortgageField('current-rate');
    if (rate) state.currentRate = parseNum(rate.value) || state.currentRate;
    const yrs = mortgageField('years-remaining');
    if (yrs) state.yearsRemaining = parseNum(yrs.value) || state.yearsRemaining;
    const cd = mortgageField('closing-date');
    if (cd) state.closingDate = cd.value || '';
    ensureMortgageDebt();
  }

  function saveMortgageModal() {
    try {
      readMortgageModalIntoState();
      const converted = sanitizeStateInPlace();
      // Soft guard: escrow included but T&I empty
      if (state.escrowIncluded && state.taxes + state.insurance < 50 && state.totalPayment > 500) {
        toast('Add monthly taxes & insurance so P&I and cash-flow stay accurate', 'warn');
      } else if (converted) {
        toast('Taxes/insurance looked annual — converted to monthly (÷12)', 'warn');
        if ($('taxes')) $('taxes').value = state.taxes;
        if ($('insurance')) $('insurance').value = state.insurance;
      } else if (state.taxes > 1500 || state.insurance > 800) {
        toast('Double-check: taxes/insurance should be monthly amounts', 'warn');
      }
      // Reflect sanitized values back into fields before close
      paintBalanceFields(state.currentBalance, { fromSlider: true, forcePaint: true });
      const pay = mortgageField('total-payment');
      if (pay) pay.value = state.totalPayment;
      const taxes = mortgageField('taxes');
      if (taxes) taxes.value = state.taxes;
      const ins = mortgageField('insurance');
      if (ins) ins.value = state.insurance;
      saveToStorage();
      mortgageModalDirty = false;
      setModalOpen('mortgage-modal', false);
      liveUpdate();
      if (mortgageModalSource === 'debts') {
        setTimeout(openDebtsModal, 200);
      }
    } catch (e) {
      console.error(e);
      setModalOpen('mortgage-modal', false);
    }
  }

  /** Discard edits (Escape, ×, Cancel) — not backdrop */
  function cancelMortgageModal() {
    mortgageModalDirty = false;
    setModalOpen('mortgage-modal', false);
    if (mortgageModalSource === 'debts') {
      setTimeout(openDebtsModal, 200);
    }
  }

  /** @deprecated use saveMortgageModal / cancelMortgageModal — kept for any stale onclick */
  function closeMortgageModal() {
    saveMortgageModal();
  }

  function updateMortgageModal() {
    mortgageModalDirty = true;
    const esc = mortgageField('escrow-included');
    const isIncluded = esc ? esc.checked : true;
    const totalToLender = parseNum(mortgageField('total-payment') && mortgageField('total-payment').value);
    const taxesEl = mortgageField('taxes');
    const insEl = mortgageField('insurance');
    const pmiEl = mortgageField('pmi');
    const taxesVal = parseNum(taxesEl && taxesEl.value);
    const insuranceVal = parseNum(insEl && insEl.value);
    const pmiVal = parseNum(pmiEl && pmiEl.value);
    if (taxesEl) taxesEl.disabled = false;
    if (insEl) insEl.disabled = false;
    if (pmiEl) pmiEl.disabled = false;
    const pi = C.derivePi(totalToLender, taxesVal, insuranceVal, pmiVal, isIncluded);
    const housing = C.totalHousingCost(totalToLender, taxesVal, insuranceVal, pmiVal, isIncluded);
    const piEl = mortgageField('modal-pi');
    const housingEl = mortgageField('modal-total-housing');
    if (piEl) piEl.textContent = money(pi);
    if (housingEl) housingEl.textContent = money(housing);
    else {
      setText('modal-pi', money(pi));
      setText('modal-total-housing', money(housing));
    }
    let hint = mortgageField('ss-escrow-modal-hint') || document.getElementById('ss-escrow-modal-hint');
    if (!hint && esc && esc.parentElement) {
      hint = document.createElement('p');
      hint.id = 'ss-escrow-modal-hint';
      hint.className = 'ss-escrow-modal-hint';
      esc.parentElement.parentElement.appendChild(hint);
    }
    if (hint) {
      if (isIncluded) {
        hint.textContent =
          'Enter monthly taxes & insurance so we can split true P&I from your total payment.';
      } else {
        hint.textContent =
          'Taxes & insurance are added on top of the lender payment for total housing cost.';
      }
    }
  }

  function syncBalanceSlider() {
    const sl = mortgageField('balance-slider');
    if (!sl) return;
    applyBalanceFromControl(sl.value, { fromSlider: true, forcePaint: true, fullLive: false });
  }

  // ─── Debts ───────────────────────────────────────────────
  const DEBT_TYPES = [
    { key: 'Credit Card', icon: 'fa-credit-card', tip: 'Usually high interest — strong refi candidate' },
    { key: 'Auto Loan', icon: 'fa-car', tip: 'Balance + monthly payment from your statement' },
    { key: 'Student Loan', icon: 'fa-graduation-cap', tip: 'Include federal or private loans you may consolidate' },
    { key: 'Personal Loan', icon: 'fa-hand-holding-dollar', tip: 'Unsecured loans and installment debt' },
    { key: 'HELOC', icon: 'fa-house-chimney', tip: 'Home equity line — often paid off in cash-out' },
    { key: 'Other', icon: 'fa-file-invoice-dollar', tip: 'Any other monthly debt obligation' }
  ];

  function debtIconFor(name) {
    const n = String(name || '').toLowerCase();
    if (n.indexOf('mortgage') !== -1) return 'fa-house';
    if (n.indexOf('card') !== -1 || n.indexOf('visa') !== -1 || n.indexOf('master') !== -1) return 'fa-credit-card';
    if (n.indexOf('auto') !== -1 || n.indexOf('car') !== -1) return 'fa-car';
    if (n.indexOf('student') !== -1) return 'fa-graduation-cap';
    if (n.indexOf('heloc') !== -1 || n.indexOf('equity') !== -1) return 'fa-house-chimney';
    if (n.indexOf('personal') !== -1) return 'fa-hand-holding-dollar';
    return 'fa-file-invoice-dollar';
  }

  function otherDebtsCount() {
    return state.debts.filter(function (d) { return d.name !== 'Current Mortgage'; }).length;
  }

  function selectedOtherDebtsCount() {
    return state.debts.filter(function (d) {
      return d.name !== 'Current Mortgage' && d.payOff;
    }).length;
  }

  function updateDebtSummaryStrip() {
    const count = otherDebtsCount();
    const selected = selectedOtherDebtsCount();
    const badge = $('debts-count-badge');
    if (badge) {
      if (count > 0) {
        badge.classList.remove('hidden');
        badge.textContent = String(count);
      } else {
        badge.classList.add('hidden');
      }
    }
    const htmlEmpty =
      '<button type="button" class="debts-summary-cta" onclick="RuoffApp.openDebtsModal()">' +
      '<i class="fas fa-plus-circle"></i> Add credit cards, auto loans, or other debts to model payoff</button>';
    let htmlFilled = '';
    if (count > 0) {
      const otherBal = C.otherDebtsPaidOff(state.debts);
      const otherPay = C.otherDebtMonthlyPayments(state.debts);
      const sizeNeeded = computeSizeLoanTarget();
      htmlFilled =
        '<div class="debts-summary-row">' +
          '<div><span class="font-semibold">' + selected + ' of ' + count + '</span> other debt' + (count === 1 ? '' : 's') +
          ' selected to pay off</div>' +
          '<div class="text-sm opacity-80">' +
            '<span class="font-bold number pos">' + money(otherPay) + '/mo</span> · ' +
            '<span class="font-bold number" style="color:var(--ruoff-orange)">' + money(otherBal) + '</span> balances' +
          '</div>' +
          '<div class="flex flex-wrap gap-2">' +
            (selected > 0
              ? '<button type="button" class="size-loan-btn" onclick="RuoffApp.sizeLoanToCoverDebts()"><i class="fas fa-magic mr-1"></i> Size loan to cover (' + money(sizeNeeded.target) + ')</button>'
              : '') +
            '<button type="button" class="text-sm font-semibold text-[var(--ruoff-teal)] hover:underline" onclick="RuoffApp.openDebtsModal()">Edit debts →</button>' +
          '</div>' +
        '</div>';
    }
    ['debts-summary-strip', 'debts-summary-strip-wizard'].forEach(function (id) {
      const strip = $(id);
      if (!strip) return;
      strip.innerHTML = count === 0 ? htmlEmpty : htmlFilled;
    });
  }

  /**
   * Loan amount to cover mortgage + selected debts + closing costs (capped by LTV).
   * Closing costs come from the Scenario field; if blank/zero, engine uses a $6,000 floor
   * so sizing does not understate cash needed.
   */
  function computeSizeLoanTarget() {
    readStateFromDom();
    ensureMortgageDebt();
    return C.sizeLoanToCover(
      state.currentBalance,
      state.debts,
      state.closingCosts,
      state.homeValue
    );
  }

  function sizeLoanDisclosureHtml(r) {
    const floorNote = r.usedClosingFloor
      ? ' (default $' + (r.closingFloor || 6000).toLocaleString() + ' — none entered)'
      : '';
    return (
      '<p class="size-loan-disclosure">' +
        '<span class="size-loan-disclosure-line">' +
          'Includes <strong class="number">' + money(r.closingCostsUsed) + '</strong> est. closing costs' +
          floorNote +
        '</span>' +
        '<span class="size-loan-disclosure-break">' +
          money(r.mortgagePayoff) + ' mortgage + ' +
          money(r.otherDebts) + ' debts + ' +
          money(r.closingCostsUsed) + ' costs' +
          (r.capped ? ' → capped at ' + r.maxLtvPct + '% LTV' : '') +
        '</span>' +
      '</p>'
    );
  }

  function sizeLoanToCoverDebts() {
    const r = computeSizeLoanTarget();
    // Persist the closing-cost assumption so cash-at-closing math matches the sized loan
    if (r.usedClosingFloor) {
      state.closingCosts = r.closingCostsUsed;
      if ($('closing-costs')) $('closing-costs').value = r.closingCostsUsed;
      paintClosingCostsSlider(r.closingCostsUsed);
    }
    state.newLoanAmount = r.target;
    if ($('new-loan-amt')) $('new-loan-amt').value = r.target;
    liveUpdate();
    if (r.capped) {
      toast(
        'Loan sized to ' + money(r.target) + ' (max ' + r.maxLtvPct + '% LTV). ' +
        'Needed ' + money(r.needed) + ' including ' + money(r.closingCostsUsed) + ' est. closing costs.',
        'warn'
      );
    } else {
      toast(
        'New loan set to ' + money(r.target) +
        ' — mortgage + selected debts + ' + money(r.closingCostsUsed) + ' est. closing costs' +
        (r.usedClosingFloor ? ' (default applied)' : '')
      );
    }
    // Keep user in context: close debts modal so they see scenario update
    if ($('debts-modal') && !$('debts-modal').classList.contains('hidden')) {
      closeDebtsModal();
    }
    scrollToSection('scenario');
  }

  function openDebtsModal() {
    ensureMortgageDebt();
    expandedDebtIndex = null;
    renderDebts();
    lockCalcModalBackdrops();
    setModalOpen('debts-modal', true);
    setActiveNav('debts');
  }

  function closeDebtsModal() {
    // If inline edit open, discard unsaved expand (data already saved on Save)
    expandedDebtIndex = null;
    saveToStorage();
    setModalOpen('debts-modal', false);
    liveUpdate();
  }

  // ─── Debt screenshot import (vision) ─────────────────────
  let debtImport = {
    dataUrl: null,
    mime: 'image/png',
    items: [], // { id, selected, isMortgage, name, type, bal, pay, months, rate, payOff, excludeMonthly }
    scanning: false
  };

  function isTypingTarget(el) {
    if (!el || !el.tagName) return false;
    const tag = el.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    if (el.isContentEditable) return true;
    return false;
  }

  function isDebtImportModalOpen() {
    const el = document.getElementById('debt-import-modal');
    return !!(el && !el.classList.contains('hidden') && el.style.display !== 'none');
  }

  function isDebtsModalOpen() {
    const el = document.getElementById('debts-modal');
    return !!(el && !el.classList.contains('hidden') && el.style.display !== 'none');
  }

  function mapLiabilityType(rawType, name) {
    const t = String(rawType || '').toLowerCase();
    const n = String(name || '').toLowerCase();
    if (t.indexOf('mort') >= 0 || n.indexOf('mortgage') >= 0 || n.indexOf('home mtg') >= 0 || n.indexOf(' mtg') >= 0) {
      return { type: 'Mortgage', isMortgage: true, label: 'Mortgage' };
    }
    if (t.indexOf('revolv') >= 0 || t.indexOf('card') >= 0 || n.indexOf('card') >= 0 || n.indexOf('visa') >= 0 || n.indexOf('mastercard') >= 0) {
      return { type: 'Credit Card', isMortgage: false, label: 'Credit Card' };
    }
    if (t.indexOf('auto') >= 0 || n.indexOf('auto') >= 0 || n.indexOf('toyota') >= 0 || n.indexOf('honda') >= 0 || n.indexOf('ford') >= 0) {
      return { type: 'Auto Loan', isMortgage: false, label: 'Auto Loan' };
    }
    if (t.indexOf('student') >= 0 || n.indexOf('student') >= 0 || n.indexOf('navient') >= 0 || n.indexOf('nelnet') >= 0) {
      return { type: 'Student Loan', isMortgage: false, label: 'Student Loan' };
    }
    if (t.indexOf('heloc') >= 0 || n.indexOf('heloc') >= 0) {
      return { type: 'HELOC', isMortgage: false, label: 'HELOC' };
    }
    if (t.indexOf('install') >= 0 || t.indexOf('personal') >= 0 || n.indexOf('onemain') >= 0 || n.indexOf('lending') >= 0) {
      return { type: 'Personal Loan', isMortgage: false, label: 'Personal Loan' };
    }
    return { type: 'Other', isMortgage: false, label: 'Other' };
  }

  function normalizeImportedLiability(raw, idx) {
    const name = String((raw && (raw.creditor || raw.name || raw.label)) || 'Debt').trim() || 'Debt';
    const bal = Math.max(0, Number(raw && (raw.balance != null ? raw.balance : raw.bal)) || 0);
    const pay = Math.max(0, Number(raw && (raw.payment != null ? raw.payment : raw.pay)) || 0);
    let months = Number(raw && (raw.months != null ? raw.months : raw.monthsLeft));
    if (!isFinite(months) || months < 0) months = 0;
    months = Math.round(months);
    const rate = Math.max(0, Number(raw && raw.rate) || 0);
    const mapped = mapLiabilityType(raw && (raw.type || raw.accountType), name);
    const exclude =
      raw &&
      (raw.excludeMonthlyPay === true ||
        raw.excludeMonthlyPay === 'Y' ||
        raw.excludeMonthlyPay === 'y' ||
        raw.excludeMonPay === 'Y' ||
        String(raw.excludeMonPay || '').toUpperCase() === 'Y');
    const isMortgage = !!(mapped.isMortgage || (raw && raw.isMortgage));
    return {
      id: 'imp_' + idx + '_' + Math.random().toString(36).slice(2, 7),
      selected: bal > 0 || pay > 0,
      isMortgage: isMortgage,
      name: name,
      type: isMortgage ? 'Mortgage' : mapped.type,
      bal: bal,
      pay: pay,
      months: months,
      rate: rate,
      // Mortgage always in the deal; others default include unless exclude flag
      payOff: isMortgage ? true : !exclude,
      excludeMonthly: !!exclude,
      rawType: (raw && raw.type) || mapped.label
    };
  }

  function setDebtImportError(msg) {
    const el = document.getElementById('debt-import-error');
    if (!el) return;
    if (!msg) {
      el.classList.add('hidden');
      el.textContent = '';
      return;
    }
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  function setDebtImportScanning(on) {
    debtImport.scanning = !!on;
    const veil = document.getElementById('debt-import-veil');
    const status = document.getElementById('debt-import-status-text');
    const runBtn = document.getElementById('debt-import-run');
    if (veil) {
      if (on) veil.removeAttribute('hidden');
      else veil.setAttribute('hidden', '');
    }
    if (status) {
      status.textContent = on ? 'Reading liabilities…' : 'Ready';
    }
    if (runBtn) {
      runBtn.disabled = on || !debtImport.dataUrl;
      runBtn.innerHTML = on
        ? '<i class="fas fa-circle-notch fa-spin mr-1"></i> Scanning…'
        : '<i class="fas fa-eye mr-1"></i> Read screenshot';
    }
  }

  function paintDebtImportPreview() {
    const drop = document.getElementById('debt-import-drop');
    const empty = document.getElementById('debt-import-empty');
    const wrap = document.getElementById('debt-import-preview-wrap');
    const img = document.getElementById('debt-import-preview');
    const runBtn = document.getElementById('debt-import-run');
    const has = !!debtImport.dataUrl;
    if (drop) drop.classList.toggle('has-image', has);
    if (empty) empty.classList.toggle('hidden', has);
    if (wrap) wrap.classList.toggle('hidden', !has);
    if (img && has) img.src = debtImport.dataUrl;
    if (runBtn) runBtn.disabled = !has || debtImport.scanning;
  }

  function clearDebtImportImage() {
    debtImport.dataUrl = null;
    debtImport.items = [];
    debtImport.mime = 'image/png';
    paintDebtImportPreview();
    const results = document.getElementById('debt-import-results');
    const applyBtn = document.getElementById('debt-import-apply');
    if (results) results.classList.add('hidden');
    if (applyBtn) applyBtn.classList.add('hidden');
    setDebtImportError('');
    setDebtImportScanning(false);
  }

  function resetDebtImportUi() {
    clearDebtImportImage();
    const file = document.getElementById('debt-import-file');
    if (file) file.value = '';
  }

  function openDebtImportModal() {
    resetDebtImportUi();
    lockCalcModalBackdrops();
    setModalOpen('debt-import-modal', true);
    wireDebtImportUiOnce();
    // Focus drop zone so paste works immediately without clicking
    setTimeout(function () {
      const drop = document.getElementById('debt-import-drop');
      if (drop) drop.focus();
    }, 80);
  }

  function closeDebtImportModal() {
    if (debtImport.scanning) return; // don't close mid-scan
    setModalOpen('debt-import-modal', false);
    debtImport.scanning = false;
  }

  function fileToDataUrl(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !file.type || file.type.indexOf('image/') !== 0) {
        reject(new Error('Please use an image file (PNG, JPG, or WebP).'));
        return;
      }
      // Soft cap ~8MB raw; vision payloads prefer reasonable size
      if (file.size > 9 * 1024 * 1024) {
        reject(new Error('Image is too large (max ~9MB). Try a cropped screenshot.'));
        return;
      }
      const reader = new FileReader();
      reader.onload = function () {
        resolve(String(reader.result || ''));
      };
      reader.onerror = function () {
        reject(new Error('Could not read that image.'));
      };
      reader.readAsDataURL(file);
    });
  }

  /** Downscale large screenshots so the vision request stays snappy */
  function compressDataUrl(dataUrl, maxEdge, quality) {
    return new Promise(function (resolve) {
      const img = new Image();
      img.onload = function () {
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;
        const edge = maxEdge || 1600;
        const scale = Math.min(1, edge / Math.max(w, h, 1));
        w = Math.max(1, Math.round(w * scale));
        h = Math.max(1, Math.round(h * scale));
        try {
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const out = canvas.toDataURL('image/jpeg', quality != null ? quality : 0.82);
          resolve(out);
        } catch (e) {
          resolve(dataUrl);
        }
      };
      img.onerror = function () {
        resolve(dataUrl);
      };
      img.src = dataUrl;
    });
  }

  async function ingestDebtImportImage(dataUrl, mimeHint) {
    if (!dataUrl || dataUrl.indexOf('data:image/') !== 0) {
      setDebtImportError('That paste was not an image. Copy a screenshot, then try again.');
      return;
    }
    setDebtImportError('');
    debtImport.items = [];
    const results = document.getElementById('debt-import-results');
    const applyBtn = document.getElementById('debt-import-apply');
    if (results) results.classList.add('hidden');
    if (applyBtn) applyBtn.classList.add('hidden');

    const compressed = await compressDataUrl(dataUrl, 1600, 0.84);
    debtImport.dataUrl = compressed;
    debtImport.mime = mimeHint || (compressed.indexOf('image/png') >= 0 ? 'image/png' : 'image/jpeg');
    paintDebtImportPreview();
    // Auto-scan for wow UX after paste/drop
    runDebtImportScan();
  }

  async function ingestDebtImportFile(file) {
    try {
      const dataUrl = await fileToDataUrl(file);
      await ingestDebtImportImage(dataUrl, file.type);
    } catch (e) {
      setDebtImportError((e && e.message) || 'Could not load image');
      toast((e && e.message) || 'Could not load image', 'warn');
    }
  }

  function extractJsonObject(raw) {
    let text = String(raw || '').trim();
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    const brace = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (brace >= 0 && last > brace) text = text.slice(brace, last + 1);
    return JSON.parse(text);
  }

  function renderDebtImportReview() {
    const results = document.getElementById('debt-import-results');
    const list = document.getElementById('debt-import-list');
    const summary = document.getElementById('debt-import-summary');
    const applyBtn = document.getElementById('debt-import-apply');
    if (!results || !list) return;

    const items = debtImport.items || [];
    if (!items.length) {
      results.classList.add('hidden');
      if (applyBtn) applyBtn.classList.add('hidden');
      return;
    }
    results.classList.remove('hidden');
    if (applyBtn) applyBtn.classList.remove('hidden');

    const mort = items.filter(function (x) { return x.isMortgage; });
    const others = items.filter(function (x) { return !x.isMortgage; });
    const selected = items.filter(function (x) { return x.selected; });
    const selBal = selected.reduce(function (s, x) { return s + (Number(x.bal) || 0); }, 0);
    const selPay = selected.reduce(function (s, x) { return s + (Number(x.pay) || 0); }, 0);

    if (summary) {
      summary.innerHTML =
        '<span class="ss-debt-chip"><i class="fas fa-layer-group"></i> ' + items.length + ' found</span>' +
        (mort.length
          ? '<span class="ss-debt-chip ss-debt-chip-mort"><i class="fas fa-house"></i> ' + mort.length + ' mortgage</span>'
          : '') +
        '<span class="ss-debt-chip"><i class="fas fa-credit-card"></i> ' + others.length + ' other</span>' +
        '<span class="ss-debt-chip"><i class="fas fa-check"></i> ' + selected.length + ' selected · ' + money(selBal) + '</span>' +
        (selPay > 0
          ? '<span class="ss-debt-chip ss-debt-chip-warn"><i class="fas fa-calendar"></i> ' + money(selPay) + '/mo</span>'
          : '');
    }

    list.innerHTML = items
      .map(function (item) {
        const badge = item.isMortgage
          ? '<span class="ss-debt-import-badge ss-debt-import-badge-mort">→ Current mortgage</span>'
          : '<span class="ss-debt-import-badge">' + escapeHtml(item.type || 'Other') + '</span>';
        const includeHint = item.isMortgage
          ? 'Updates balance, payment & years remaining'
          : item.payOff
            ? 'Include in refi'
            : 'Leave as-is';
        const monthsTxt = item.months > 0 ? item.months + ' mo' : '— mo';
        return (
          '<label class="ss-debt-import-row' +
          (item.selected ? '' : ' is-off') +
          (item.isMortgage ? ' is-mortgage' : '') +
          '" data-import-id="' +
          escapeHtml(item.id) +
          '">' +
          '<input type="checkbox" class="w-4 h-4 accent-[#00A89D]" data-import-check="' +
          escapeHtml(item.id) +
          '" ' +
          (item.selected ? 'checked' : '') +
          '>' +
          '<div class="min-w-0">' +
          '<div class="ss-debt-import-row-name truncate">' +
          escapeHtml(item.name) +
          badge +
          '</div>' +
          '<div class="ss-debt-import-row-meta">' +
          escapeHtml(item.rawType || item.type) +
          ' · ' +
          monthsTxt +
          ' · ' +
          escapeHtml(includeHint) +
          '</div>' +
          (!item.isMortgage
            ? '<label class="inline-flex items-center gap-2 mt-2 text-xs font-semibold cursor-pointer">' +
              '<input type="checkbox" class="accent-[#00A89D]" data-import-payoff="' +
              escapeHtml(item.id) +
              '" ' +
              (item.payOff ? 'checked' : '') +
              '> Include in refi</label>'
            : '') +
          '</div>' +
          '<div class="ss-debt-import-row-nums">' +
          '<div class="ss-debt-import-row-bal number">' +
          money(item.bal) +
          '</div>' +
          '<div class="ss-debt-import-row-pay number">' +
          money(item.pay) +
          '/mo</div>' +
          '</div>' +
          '</label>'
        );
      })
      .join('');

    list.querySelectorAll('[data-import-check]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        const id = cb.getAttribute('data-import-check');
        const item = debtImport.items.find(function (x) { return x.id === id; });
        if (item) item.selected = !!cb.checked;
        renderDebtImportReview();
      });
    });
    list.querySelectorAll('[data-import-payoff]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        const id = cb.getAttribute('data-import-payoff');
        const item = debtImport.items.find(function (x) { return x.id === id; });
        if (item) item.payOff = !!cb.checked;
        renderDebtImportReview();
      });
    });
  }

  function debtImportSelectAll(on) {
    debtImport.items.forEach(function (x) {
      x.selected = !!on;
    });
    renderDebtImportReview();
  }

  async function runDebtImportScan() {
    if (!debtImport.dataUrl) {
      setDebtImportError('Add a screenshot first — paste with Ctrl+V or choose a file.');
      return;
    }
    if (debtImport.scanning) return;
    setDebtImportError('');
    setDebtImportScanning(true);

    const system =
      'You extract consumer liabilities from credit report / LOS screenshots for a mortgage refinance coach.\n' +
      'Return ONLY valid JSON (no markdown fences, no commentary).\n' +
      'Schema:\n' +
      '{\n' +
      '  "liabilities": [\n' +
      '    {\n' +
      '      "creditor": "string",\n' +
      '      "type": "Mortgage|Installment|Revolving|HELOC|Student|Auto|Other",\n' +
      '      "balance": number,\n' +
      '      "months": number,\n' +
      '      "payment": number,\n' +
      '      "rate": number|null,\n' +
      '      "excludeMonthlyPay": boolean,\n' +
      '      "isMortgage": boolean\n' +
      '    }\n' +
      '  ],\n' +
      '  "notes": "optional short string"\n' +
      '}\n' +
      'Rules:\n' +
      '- Read every visible liability row. Use exact creditor names from the image.\n' +
      '- balance, payment, months are numbers without $ or commas.\n' +
      '- months may be labeled Months, Term, or Remaining.\n' +
      '- excludeMonthlyPay true if column like "Exclude Mon. Pay" is Y/Yes/true.\n' +
      '- isMortgage true for first mortgage / home mortgage rows (not HELOC unless clearly 1st mtg).\n' +
      '- Skip totals, headers, blank rows, and collection summaries without a balance.\n' +
      '- If a field is unreadable, use 0 or null — do not invent balances.';

    const userText =
      'Extract all liabilities from this screenshot into the JSON schema. ' +
      'This is typically a Creditor / Type / Balance / Months / Payment table.';

    try {
      // Multimodal chat models (image input). Try fast first; fall back if model id drifts.
      const visionModels = [
        'grok-4-1-fast-reasoning',
        'grok-4',
        'grok-2-vision-latest'
      ];
      let data = null;
      let lastErr = null;
      for (let mi = 0; mi < visionModels.length; mi++) {
        try {
          data = await callGrokAPI({
            model: visionModels[mi],
            temperature: 0.1,
            max_tokens: 2500,
            messages: [
              { role: 'system', content: system },
              {
                role: 'user',
                content: [
                  { type: 'image_url', image_url: { url: debtImport.dataUrl, detail: 'high' } },
                  { type: 'text', text: userText }
                ]
              }
            ]
          });
          if (data && data.error) {
            const em =
              (data.error && (data.error.message || data.error)) || 'Vision API error';
            throw new Error(typeof em === 'string' ? em : JSON.stringify(em));
          }
          lastErr = null;
          break;
        } catch (err) {
          lastErr = err;
          const msg = String((err && err.message) || err || '');
          // Only cascade on model-not-found; auth / quota should surface immediately
          if (/model not found|does not exist|invalid model/i.test(msg) && mi < visionModels.length - 1) {
            continue;
          }
          throw err;
        }
      }
      if (!data) throw lastErr || new Error('Vision request failed');

      let raw =
        (data.choices &&
          data.choices[0] &&
          data.choices[0].message &&
          data.choices[0].message.content) ||
        '';
      const parsed = extractJsonObject(raw);
      const list = Array.isArray(parsed.liabilities)
        ? parsed.liabilities
        : Array.isArray(parsed.debts)
          ? parsed.debts
          : [];
      if (!list.length) {
        throw new Error('No liabilities found. Try a clearer crop of the debts table.');
      }
      debtImport.items = list
        .map(function (row, i) {
          return normalizeImportedLiability(row, i);
        })
        .filter(function (x) {
          return x.bal > 0 || x.pay > 0;
        });
      if (!debtImport.items.length) {
        throw new Error('Rows were found but balances/payments were empty. Try another screenshot.');
      }
      // Sort: mortgage first, then by balance desc
      debtImport.items.sort(function (a, b) {
        if (a.isMortgage !== b.isMortgage) return a.isMortgage ? -1 : 1;
        return (b.bal || 0) - (a.bal || 0);
      });
      renderDebtImportReview();
      toast('Found ' + debtImport.items.length + ' liabilities — review, then apply');
    } catch (e) {
      console.error('[debt-import]', e);
      const msg = String((e && e.message) || '');
      let friendly =
        msg ||
        'Could not read that screenshot. Check the proxy/API key, then try a sharper crop.';
      if (/incorrect api key|invalid.*api key|401|unauthorized/i.test(msg)) {
        friendly =
          'xAI rejected the API key. Put a real key from https://console.x.ai into the project .env as XAI_API_KEY=xai-… then restart proxy.js (stop and start node proxy.js). Health: /api/health should show keyLooksValid: true.';
      }
      setDebtImportError(friendly);
      toast(/incorrect api key|invalid.*api key/i.test(msg) ? 'Invalid xAI API key — update .env' : 'Could not read screenshot', 'warn');
    } finally {
      setDebtImportScanning(false);
      paintDebtImportPreview();
    }
  }

  function applyDebtImport() {
    const selected = (debtImport.items || []).filter(function (x) {
      return x.selected && (x.bal > 0 || x.pay > 0);
    });
    if (!selected.length) {
      toast('Select at least one liability to apply', 'warn');
      return;
    }

    const replaceEl = document.getElementById('debt-import-replace');
    const replaceOthers = !replaceEl || replaceEl.checked;

    const mortItem = selected.find(function (x) {
      return x.isMortgage;
    });
    const otherItems = selected.filter(function (x) {
      return !x.isMortgage;
    });

    // Mortgage → current mortgage fields
    if (mortItem) {
      state.currentBalance = mortItem.bal || state.currentBalance;
      if (mortItem.pay > 0) {
        // Credit-report payment is typically P&I; keep T&I fields, mark escrow not included
        // so total housing = payment + taxes + ins unless LO edits later
        state.totalPayment = mortItem.pay;
        state.escrowIncluded = false;
      }
      if (mortItem.months > 0) {
        state.yearsRemaining = Math.round((mortItem.months / 12) * 10) / 10;
        state.yearsRemaining = C.clamp(state.yearsRemaining, 0.5, 40);
      }
      // Optional: if rate present on mortgage row (rare)
      if (mortItem.rate > 0) {
        state.currentRate = C.clamp(mortItem.rate, 0.5, 20);
      }
    }

    const newOthers = otherItems.map(function (x) {
      return {
        name: x.name,
        bal: x.bal,
        pay: x.pay,
        rate: x.rate || 0,
        months: x.months || 0,
        payOff: x.payOff !== false,
        type: x.type || 'Other'
      };
    });

    const mortgageRow = (state.debts || []).find(function (d) {
      return d && d.name === 'Current Mortgage';
    });
    let keepOthers = [];
    if (!replaceOthers) {
      keepOthers = (state.debts || []).filter(function (d) {
        return d && d.name !== 'Current Mortgage';
      });
    }
    state.debts = [];
    if (mortgageRow || mortItem) {
      // ensureMortgageDebt will rebuild from state fields
    }
    state.debts = keepOthers.concat(newOthers);
    ensureMortgageDebt();
    sanitizeStateInPlace();
    saveToStorage();
    hydrateDomFromState();
    liveUpdate();
    renderDebts();

    closeDebtImportModal();
    // Ensure debts modal is open so LO sees the result
    if (!isDebtsModalOpen()) openDebtsModal();
    else renderDebts();

    const bits = [];
    if (mortItem) bits.push('mortgage updated');
    if (newOthers.length) bits.push(newOthers.length + ' other debt' + (newOthers.length === 1 ? '' : 's'));
    toast('Imported — ' + bits.join(', '));
  }

  function isMainDebtsSurfaceActive() {
    // Wizard debts step (step index 3)
    try {
      if (typeof wizardStep === 'number' && wizardStep === 3 && experienceMode === 'guided') {
        return true;
      }
    } catch (err) { /* ignore */ }
    // Expert / full workspace: scenario panel is where Manage debts + Scan live
    try {
      if (experienceMode === 'expert') return true;
    } catch (err2) { /* ignore */ }
    // DOM fallback — debts wizard panel currently active
    const wiz = document.getElementById('section-debts-wizard');
    if (wiz && (wiz.classList.contains('active-step') || wiz.classList.contains('active'))) return true;
    return false;
  }

  function handleDebtImportPaste(e) {
    // Only when debts surfaces or import modal is active, and not typing in a field
    if (isTypingTarget(e.target)) return;
    if (!isDebtImportModalOpen() && !isDebtsModalOpen() && !isMainDebtsSurfaceActive()) return;

    const cd = e.clipboardData || (e.originalEvent && e.originalEvent.clipboardData);
    if (!cd) return;

    let file = null;
    if (cd.files && cd.files.length) {
      for (let i = 0; i < cd.files.length; i++) {
        if (cd.files[i].type && cd.files[i].type.indexOf('image/') === 0) {
          file = cd.files[i];
          break;
        }
      }
    }
    if (!file && cd.items) {
      for (let j = 0; j < cd.items.length; j++) {
        if (cd.items[j].type && cd.items[j].type.indexOf('image/') === 0) {
          file = cd.items[j].getAsFile();
          break;
        }
      }
    }
    if (!file) return;

    e.preventDefault();
    e.stopPropagation();

    if (!isDebtImportModalOpen()) {
      openDebtImportModal();
    }
    // slight delay so modal DOM is ready
    setTimeout(function () {
      ingestDebtImportFile(file);
    }, 40);
    toast('Screenshot captured — scanning…');
  }

  function wireDebtImportUiOnce() {
    const drop = document.getElementById('debt-import-drop');
    const file = document.getElementById('debt-import-file');
    if (!drop || drop.__ssDebtImportWired) return;
    drop.__ssDebtImportWired = true;

    drop.addEventListener('click', function (e) {
      if (e.target && e.target.closest && e.target.closest('.ss-debt-preview-clear')) return;
      if (debtImport.dataUrl && e.target && e.target.closest && e.target.closest('.ss-debt-preview-wrap')) {
        return;
      }
      if (file) file.click();
    });
    drop.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (file) file.click();
      }
    });
    ['dragenter', 'dragover'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) {
        e.preventDefault();
        e.stopPropagation();
        drop.classList.add('is-dragover');
      });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) {
        e.preventDefault();
        e.stopPropagation();
        drop.classList.remove('is-dragover');
      });
    });
    drop.addEventListener('drop', function (e) {
      const f =
        e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]
          ? e.dataTransfer.files[0]
          : null;
      if (f) ingestDebtImportFile(f);
    });
    if (file) {
      file.addEventListener('change', function () {
        if (file.files && file.files[0]) ingestDebtImportFile(file.files[0]);
      });
    }
  }

  function wireDebtImportGlobal() {
    if (window.__ssDebtImportPasteWired) return;
    window.__ssDebtImportPasteWired = true;
    document.addEventListener('paste', handleDebtImportPaste, true);
  }

  function switchToMortgageModal() {
    closeDebtsModal();
    setTimeout(() => openMortgageModal(true), 250);
  }

  function renderDebts() {
    const container = $('debts-list');
    if (!container) return;
    container.innerHTML = '';
    let totalMonthly = 0;
    let totalPayoff = 0;
    let otherCount = 0;

    // Toolbar: size loan + quick add
    const toolbar = document.createElement('div');
    toolbar.className = 'debt-list-toolbar';
    const sizeInfo = computeSizeLoanTarget();
    toolbar.innerHTML =
      '<button type="button" class="size-loan-btn size-loan-btn-block" data-size-loan>' +
        '<i class="fas fa-magic"></i> Size new loan to cover selected debts' +
        '<span class="size-loan-amt">' + money(sizeInfo.target) + '</span>' +
      '</button>' +
      sizeLoanDisclosureHtml(sizeInfo) +
      (sizeInfo.capped
        ? '<p class="text-xs warn mt-1">Capped at ' + sizeInfo.maxLtvPct + '% LTV max (' + money(sizeInfo.maxLoan) + '). Full need ' + money(sizeInfo.needed) + '.</p>'
        : '');
    container.appendChild(toolbar);
    toolbar.querySelector('[data-size-loan]').addEventListener('click', sizeLoanToCoverDebts);

    // Quick-add row
    const quick = document.createElement('div');
    quick.className = 'debt-quick-add';
    quick.innerHTML =
      '<div class="text-xs font-semibold opacity-70 mb-2">Quick add</div>' +
      '<div class="flex flex-wrap gap-2">' +
      DEBT_TYPES.map(function (t) {
        return '<button type="button" class="debt-type-chip" data-quick-type="' + escapeHtml(t.key) + '">' +
          '<i class="fas ' + t.icon + '"></i> ' + escapeHtml(t.key) + '</button>';
      }).join('') +
      '</div>';
    container.appendChild(quick);
    quick.querySelectorAll('[data-quick-type]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openAddDebtModal(btn.getAttribute('data-quick-type'));
      });
    });

    state.debts.forEach((d, i) => {
      if (d.name === 'Current Mortgage') {
        d.payOff = true;
        d.bal = state.currentBalance;
        d.pay = C.derivePi(state.totalPayment, state.taxes, state.insurance, state.pmi, state.escrowIncluded);
      } else {
        otherCount++;
      }
      if (d.payOff) {
        totalMonthly += Number(d.pay) || 0;
        totalPayoff += Number(d.bal) || 0;
      }

      const isMortgage = d.name === 'Current Mortgage';
      const isExpanded = !isMortgage && expandedDebtIndex === i;
      const row = document.createElement('div');
      row.className = 'debt-row glass rounded-2xl p-4 sm:p-5 ' +
        (isMortgage ? 'debt-row-mortgage' : (d.payOff ? 'debt-row-active' : 'debt-row-off')) +
        (isExpanded ? ' debt-row-expanded' : '');
      row.setAttribute('data-debt-index', String(i));

      if (isExpanded) {
        row.innerHTML = buildInlineEditHtml(d, i);
        container.appendChild(row);
        wireInlineEdit(row, i);
        return;
      }

      const meta = [];
      if (d.rate) meta.push(d.rate + '% APR');
      if (d.months) meta.push(d.months + ' mo left');
      const metaHtml = meta.length
        ? '<div class="text-xs opacity-60 mt-1">' + escapeHtml(meta.join(' · ')) + '</div>'
        : (isMortgage ? '' : '<div class="text-xs opacity-50 mt-1">Tap Edit to update · optional rate improves interest math</div>');

      row.innerHTML =
        '<div class="flex gap-3 items-start">' +
          '<div class="debt-icon" aria-hidden="true"><i class="fas ' + debtIconFor(d.name) + '"></i></div>' +
          '<div class="flex-1 min-w-0">' +
            '<div class="flex flex-wrap items-center gap-2">' +
              '<div class="text-base sm:text-lg font-semibold truncate">' + escapeHtml(d.name) + '</div>' +
              (isMortgage ? '<span class="debt-pill debt-pill-lock"><i class="fas fa-lock"></i> Always paid off</span>' : '') +
            '</div>' +
            '<div class="grid grid-cols-2 gap-3 mt-2">' +
              '<div><div class="text-[10px] uppercase tracking-wide opacity-50">Balance</div>' +
                '<div class="text-lg sm:text-xl font-black number">' + money(d.bal) + '</div></div>' +
              '<div><div class="text-[10px] uppercase tracking-wide opacity-50">Monthly</div>' +
                '<div class="text-lg sm:text-xl font-black number">' + money(d.pay) + '</div></div>' +
            '</div>' +
            metaHtml +
          '</div>' +
        '</div>' +
        '<div class="debt-row-actions mt-3 pt-3 border-t border-black/5 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">' +
          (isMortgage
            ? '<button type="button" class="debt-action-btn" data-edit-mortgage><i class="fas fa-pencil-alt"></i> Edit mortgage</button>'
            : '<label class="debt-include-label">' +
                '<span class="debt-toggle"><input type="checkbox" data-debt-toggle="' + i + '" ' + (d.payOff ? 'checked' : '') + '>' +
                '<span class="debt-toggle-slider"></span></span>' +
                '<span class="text-sm font-medium">' + (d.payOff ? 'Include in refi' : 'Leave as-is') + '</span>' +
              '</label>') +
          (!isMortgage
            ? '<div class="flex items-center gap-1">' +
                '<button type="button" class="debt-action-btn" data-inline-edit="' + i + '"><i class="fas fa-pencil-alt"></i> Edit</button>' +
                '<button type="button" class="debt-action-btn debt-action-danger" data-remove-debt="' + i + '"><i class="fas fa-trash"></i></button>' +
              '</div>'
            : '') +
        '</div>';

      container.appendChild(row);
    });

    // Empty state for other debts
    if (otherCount === 0) {
      const empty = document.createElement('div');
      empty.className = 'debt-empty-state';
      empty.innerHTML =
        '<div class="debt-empty-icon"><i class="fas fa-layer-group"></i></div>' +
        '<h4 class="font-bold text-lg mb-1">No other debts yet</h4>' +
        '<p class="text-sm opacity-70 mb-4 max-w-sm mx-auto">Add credit cards, auto loans, or student loans to see how paying them off with a refinance changes your monthly cash flow.</p>' +
        '<button type="button" class="px-5 py-2.5 bg-gradient-to-r from-[#00A89D] to-[#F15A29] text-white rounded-xl text-sm font-bold" data-empty-add>' +
        '<i class="fas fa-plus mr-1"></i> Add your first debt</button>';
      container.appendChild(empty);
      empty.querySelector('[data-empty-add]').addEventListener('click', function () {
        openAddDebtModal('Credit Card');
      });
    }

    container.querySelectorAll('[data-debt-toggle]').forEach(el => {
      el.addEventListener('change', () => {
        const i = parseInt(el.getAttribute('data-debt-toggle'), 10);
        state.debts[i].payOff = el.checked;
        renderDebts();
        liveUpdate();
      });
    });
    container.querySelectorAll('[data-inline-edit]').forEach(el => {
      el.addEventListener('click', () => {
        expandDebtInline(parseInt(el.getAttribute('data-inline-edit'), 10));
      });
    });
    container.querySelectorAll('[data-remove-debt]').forEach(el => {
      el.addEventListener('click', () => {
        const i = parseInt(el.getAttribute('data-remove-debt'), 10);
        const name = state.debts[i] && state.debts[i].name;
        if (confirm('Remove “' + (name || 'this debt') + '”?')) removeDebt(i);
      });
    });
    container.querySelectorAll('[data-edit-mortgage]').forEach(el => {
      el.addEventListener('click', switchToMortgageModal);
    });

    setText('modal-total-monthly', money(totalMonthly));
    setText('modal-total-payoff', money(totalPayoff));
    setText('modal-other-count', String(otherCount));
    updateDebtSummaryStrip();
  }

  function buildInlineEditHtml(d, i) {
    return (
      '<div class="inline-edit-header flex items-center justify-between gap-2 mb-3">' +
        '<div class="font-bold text-base"><i class="fas fa-pencil-alt text-[var(--ruoff-teal)] mr-2"></i>Edit debt</div>' +
        '<button type="button" class="text-sm opacity-60 hover:opacity-100" data-inline-cancel="' + i + '">Cancel</button>' +
      '</div>' +
      '<div class="space-y-3">' +
        '<div>' +
          '<label class="block text-xs opacity-70 mb-1">Name</label>' +
          '<input type="text" class="input-field" data-ie-name value="' + escapeHtml(d.name || '') + '" autocomplete="off">' +
        '</div>' +
        '<div class="grid grid-cols-2 gap-3">' +
          '<div><label class="block text-xs opacity-70 mb-1">Balance</label>' +
            '<div class="dollar-wrap"><span class="prefix">$</span>' +
            '<input type="text" inputmode="decimal" class="input-field" data-ie-bal value="' + (d.bal || '') + '" placeholder="0"></div></div>' +
          '<div><label class="block text-xs opacity-70 mb-1">Monthly</label>' +
            '<div class="dollar-wrap"><span class="prefix">$</span>' +
            '<input type="text" inputmode="decimal" class="input-field" data-ie-pay value="' + (d.pay || '') + '" placeholder="0"></div></div>' +
        '</div>' +
        '<div class="grid grid-cols-2 gap-3">' +
          '<div><label class="block text-xs opacity-70 mb-1">Rate % <span class="opacity-50">(optional)</span></label>' +
            '<input type="number" step="0.1" class="input-field text-center" data-ie-rate value="' + (d.rate || '') + '" placeholder="e.g. 22.9"></div>' +
          '<div><label class="block text-xs opacity-70 mb-1">Months left</label>' +
            '<input type="number" class="input-field text-center" data-ie-months value="' + (d.months || '') + '" placeholder="e.g. 36"></div>' +
        '</div>' +
        '<div class="flex flex-wrap gap-2 pt-1">' +
          '<button type="button" class="flex-1 py-2.5 bg-gradient-to-r from-[#00A89D] to-[#F15A29] text-white rounded-xl font-bold text-sm" data-inline-save="' + i + '">Save</button>' +
          '<button type="button" class="py-2.5 px-4 border border-zinc-300 dark:border-white/20 rounded-xl text-sm font-medium" data-inline-cancel="' + i + '">Cancel</button>' +
          '<button type="button" class="py-2.5 px-4 text-red-500 text-sm font-medium" data-remove-debt="' + i + '"><i class="fas fa-trash mr-1"></i>Remove</button>' +
        '</div>' +
      '</div>'
    );
  }

  function wireInlineEdit(row, i) {
    const save = function () {
      const name = (row.querySelector('[data-ie-name]').value || '').trim() || 'Debt';
      const bal = parseNum(row.querySelector('[data-ie-bal]').value);
      const pay = parseNum(row.querySelector('[data-ie-pay]').value);
      const rate = parseNum(row.querySelector('[data-ie-rate]').value);
      const months = parseNum(row.querySelector('[data-ie-months]').value);
      if (bal <= 0 && pay <= 0) {
        toast('Enter a balance or monthly payment', 'warn');
        return;
      }
      const prev = state.debts[i];
      state.debts[i] = {
        name: name,
        bal: bal,
        pay: pay,
        rate: rate,
        months: months,
        payOff: prev.payOff !== false,
        type: prev.type || ''
      };
      expandedDebtIndex = null;
      renderDebts();
      liveUpdate();
      saveToStorage();
      toast('Debt updated');
    };
    row.querySelectorAll('[data-inline-save]').forEach(function (btn) {
      btn.addEventListener('click', save);
    });
    row.querySelectorAll('[data-inline-cancel]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        expandedDebtIndex = null;
        renderDebts();
      });
    });
    row.querySelectorAll('[data-remove-debt]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (confirm('Remove this debt?')) removeDebt(i);
      });
    });
    row.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        save();
      }
      if (e.key === 'Escape') {
        expandedDebtIndex = null;
        renderDebts();
      }
    });
    setTimeout(function () {
      const bal = row.querySelector('[data-ie-bal]');
      if (bal) bal.focus();
    }, 40);
  }

  function expandDebtInline(i) {
    const d = state.debts[i];
    if (!d || d.name === 'Current Mortgage') return;
    expandedDebtIndex = i;
    renderDebts();
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function setNewDebtPayoffChecked(on) {
    const el = $('new-debt-payoff');
    if (el) el.checked = !!on;
    syncNewDebtPayoffLabel();
  }

  function syncNewDebtPayoffLabel() {
    const el = $('new-debt-payoff');
    const label = $('new-debt-payoff-label');
    const hint = $('new-debt-payoff-hint');
    const on = !el || el.checked;
    if (label) label.textContent = on ? 'Include in refi' : 'Leave as-is';
    if (hint) {
      hint.textContent = on
        ? 'On by default — rolls this balance into the new loan and frees the monthly payment.'
        : 'Keep this debt outside the refinance; it won’t change cash-flow math.';
    }
    const wrap = el && el.closest ? el.closest('.debt-include-entry') : null;
    if (wrap) wrap.classList.toggle('is-off', !on);
  }

  function resetAddDebtForm(prefillType) {
    const type = prefillType || '';
    if ($('new-debt-type')) $('new-debt-type').value = type;
    if ($('new-debt-name')) $('new-debt-name').value = type || '';
    if ($('new-debt-balance')) $('new-debt-balance').value = '';
    if ($('new-debt-pay')) $('new-debt-pay').value = '';
    if ($('new-debt-rate')) $('new-debt-rate').value = '';
    if ($('new-debt-months')) $('new-debt-months').value = '';
    setNewDebtPayoffChecked(true); // default: include in refi
    syncDebtTypeChips(type);
    const tip = $('debt-type-tip');
    if (tip) {
      const found = DEBT_TYPES.find(function (t) { return t.key === type; });
      tip.textContent = found ? found.tip : 'Pick a type, then enter balance and monthly payment.';
    }
    const opt = $('debt-optional-fields');
    if (opt) opt.classList.add('hidden');
    const optToggle = $('debt-optional-toggle');
    if (optToggle) optToggle.setAttribute('aria-expanded', 'false');
  }

  function syncDebtTypeChips(activeType) {
    rootQueryAll('#add-debt-modal [data-debt-type-chip]').forEach(function (chip) {
      chip.classList.toggle('active', chip.getAttribute('data-debt-type-chip') === activeType);
    });
  }

  function selectDebtType(type) {
    if ($('new-debt-type')) $('new-debt-type').value = type;
    const nameEl = $('new-debt-name');
    if (nameEl) {
      // Only overwrite name if empty or still a known type label
      const cur = (nameEl.value || '').trim();
      const known = DEBT_TYPES.some(function (t) { return t.key === cur; });
      if (!cur || known) nameEl.value = type;
    }
    syncDebtTypeChips(type);
    const tip = $('debt-type-tip');
    if (tip) {
      const found = DEBT_TYPES.find(function (t) { return t.key === type; });
      tip.textContent = found ? found.tip : '';
    }
    if ($('new-debt-balance')) $('new-debt-balance').focus();
  }

  function toggleDebtOptional() {
    const opt = $('debt-optional-fields');
    const btn = $('debt-optional-toggle');
    if (!opt) return;
    const open = opt.classList.contains('hidden');
    opt.classList.toggle('hidden', !open);
    if (btn) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.innerHTML = open
        ? '<i class="fas fa-chevron-up mr-1"></i> Hide rate &amp; months'
        : '<i class="fas fa-chevron-down mr-1"></i> Optional: interest rate &amp; months left';
    }
  }

  function clearZeroOnFocus(el) {
    if (!el) return;
    el.addEventListener('focus', function () {
      if (el.value === '0' || el.value === '0.0' || el.value === '0.00') el.value = '';
    });
  }

  function setAddDebtSubmitLabel(text) {
    const label = $('add-debt-submit-label');
    if (label) label.textContent = text;
    else {
      const btn = $('add-debt-submit');
      if (btn) btn.textContent = text;
    }
  }

  function openAddDebtModal(prefillType) {
    const title = $('add-debt-title');
    if (editingDebtIndex === undefined) {
      resetAddDebtForm(prefillType || '');
      if (title) title.textContent = 'Add a debt';
      setAddDebtSubmitLabel('Save debt');
      const btn2 = $('add-debt-submit-another');
      if (btn2) {
        btn2.classList.remove('hidden');
        btn2.classList.remove('is-saved');
      }
    } else {
      if (title) title.textContent = 'Edit debt';
      setAddDebtSubmitLabel('Save changes');
      const btn2 = $('add-debt-submit-another');
      if (btn2) btn2.classList.add('hidden');
    }
    lockCalcModalBackdrops();
    setModalOpen('add-debt-modal', true);
    setTimeout(function () {
      const focusEl = $('new-debt-balance') || $('new-debt-name');
      if (focusEl) focusEl.focus();
    }, 80);
  }

  function closeAddDebtModal() {
    setModalOpen('add-debt-modal', false);
    editingDebtIndex = undefined;
    setAddDebtSubmitLabel('Save debt');
    const btn2 = $('add-debt-submit-another');
    if (btn2) btn2.classList.remove('is-saved');
  }

  function readDebtForm() {
    const type = $('new-debt-type') ? $('new-debt-type').value : '';
    let name = ($('new-debt-name') && $('new-debt-name').value || '').trim();
    if (!name) name = type || 'Debt';
    const payoffEl = $('new-debt-payoff');
    // Default ON when control missing (legacy inject / tests)
    const payOff = !payoffEl || !!payoffEl.checked;
    return {
      type: type,
      name: name,
      bal: parseNum($('new-debt-balance') && $('new-debt-balance').value),
      pay: parseNum($('new-debt-pay') && $('new-debt-pay').value),
      rate: parseNum($('new-debt-rate') && $('new-debt-rate').value),
      months: parseNum($('new-debt-months') && $('new-debt-months').value),
      payOff: payOff
    };
  }

  function addNewDebt(andAnother) {
    const form = readDebtForm();
    if (form.bal <= 0 && form.pay <= 0) {
      toast('Enter a balance or monthly payment', 'warn');
      if ($('new-debt-balance')) $('new-debt-balance').focus();
      return false;
    }

    if (editingDebtIndex !== undefined) {
      const prev = state.debts[editingDebtIndex];
      state.debts[editingDebtIndex] = {
        name: form.name,
        bal: form.bal,
        pay: form.pay,
        rate: form.rate,
        months: form.months,
        payOff: form.payOff,
        type: form.type || (prev && prev.type) || ''
      };
      editingDebtIndex = undefined;
      toast('Debt updated');
      closeAddDebtModal();
    } else {
      state.debts.push({
        name: form.name,
        bal: form.bal,
        pay: form.pay,
        rate: form.rate,
        months: form.months,
        payOff: form.payOff,
        type: form.type || ''
      });
      toast(
        andAnother
          ? (form.payOff ? 'Saved (in refi) — add the next one' : 'Saved (left as-is) — add the next one')
          : (form.payOff ? 'Debt added — included in refi' : 'Debt added — left as-is')
      );
      if (andAnother) {
        resetAddDebtForm(form.type || '');
        const btn2 = $('add-debt-submit-another');
        if (btn2) {
          const icon = btn2.querySelector('.btn-debt-another-icon i');
          btn2.classList.remove('is-saved');
          void btn2.offsetWidth; // reflow so pulse restarts
          btn2.classList.add('is-saved');
          if (icon) {
            icon.classList.remove('fa-plus');
            icon.classList.add('fa-check');
          }
          clearTimeout(btn2._savedTimer);
          btn2._savedTimer = setTimeout(function () {
            btn2.classList.remove('is-saved');
            if (icon) {
              icon.classList.remove('fa-check');
              icon.classList.add('fa-plus');
            }
          }, 700);
        }
        setTimeout(function () {
          if ($('new-debt-balance')) $('new-debt-balance').focus();
        }, 50);
      } else {
        closeAddDebtModal();
      }
    }
    renderDebts();
    liveUpdate();
    saveToStorage();
    return true;
  }

  function editDebt(i) {
    // Prefer inline expand when debts list is open; fallback to modal
    if ($('debts-modal') && !$('debts-modal').classList.contains('hidden')) {
      expandDebtInline(i);
      return;
    }
    const d = state.debts[i];
    if (!d || d.name === 'Current Mortgage') return;
    editingDebtIndex = i;
    const typeGuess = d.type || (DEBT_TYPES.find(function (t) {
      return d.name && d.name.indexOf(t.key) === 0;
    }) || {}).key || '';
    if ($('new-debt-type')) $('new-debt-type').value = typeGuess;
    if ($('new-debt-name')) $('new-debt-name').value = d.name || '';
    if ($('new-debt-balance')) $('new-debt-balance').value = d.bal ? String(d.bal) : '';
    if ($('new-debt-pay')) $('new-debt-pay').value = d.pay ? String(d.pay) : '';
    if ($('new-debt-rate')) $('new-debt-rate').value = d.rate ? String(d.rate) : '';
    if ($('new-debt-months')) $('new-debt-months').value = d.months ? String(d.months) : '';
    setNewDebtPayoffChecked(d.payOff !== false);
    syncDebtTypeChips(typeGuess);
    if ((d.rate || d.months) && $('debt-optional-fields')) {
      $('debt-optional-fields').classList.remove('hidden');
    }
    openAddDebtModal();
  }

  // ─── Mini-nav ────────────────────────────────────────────
  function scrollToSection(key) {
    const map = {
      home: 'section-home',
      mortgage: 'section-mortgage',
      scenario: 'section-scenario',
      debts: 'section-scenario',
      plan: 'section-plan'
    };
    if (key === 'debts') {
      openDebtsModal();
      return;
    }
    if (key === 'mortgage') {
      const el = $(map.mortgage);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveNav('mortgage');
      return;
    }
    const id = map[key];
    const el = id ? $(id) : null;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveNav(key);
    }
    if (key === 'plan') {
      const results = $('results-area');
      if (results && !results.classList.contains('hidden')) {
        results.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  function setActiveNav(key) {
    rootQueryAll('.mini-nav-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-nav') === key);
    });
  }

  function initMiniNav() {
    rootQueryAll('.mini-nav-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        scrollToSection(btn.getAttribute('data-nav'));
      });
    });
    // Highlight section in view
    const sections = [
      { key: 'home', id: 'section-home' },
      { key: 'mortgage', id: 'section-mortgage' },
      { key: 'scenario', id: 'section-scenario' },
      { key: 'plan', id: 'section-plan' }
    ];
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          const found = sections.find(function (s) { return s.id === entry.target.id; });
          if (found) setActiveNav(found.key);
        });
      }, { rootMargin: '-30% 0px -50% 0px', threshold: 0.01 });
      sections.forEach(function (s) {
        const el = $(s.id);
        if (el) obs.observe(el);
      });
    }
  }

  function removeDebt(i) {
    if (state.debts[i] && state.debts[i].name === 'Current Mortgage') return;
    state.debts.splice(i, 1);
    if (expandedDebtIndex === i) expandedDebtIndex = null;
    else if (expandedDebtIndex != null && expandedDebtIndex > i) expandedDebtIndex -= 1;
    renderDebts();
    liveUpdate();
    toast('Debt removed');
  }

  // ─── Saved meetings library (park a borrower, work another) ───
  function loadSavedMeetings() {
    try {
      const raw = localStorage.getItem(MEETINGS_KEY);
      savedMeetings = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(savedMeetings)) savedMeetings = [];
    } catch (e) {
      savedMeetings = [];
    }
  }

  function persistSavedMeetings() {
    try {
      localStorage.setItem(MEETINGS_KEY, JSON.stringify(savedMeetings.slice(0, MAX_SAVED_MEETINGS)));
    } catch (e) { /* ignore quota */ }
  }

  function formatMeetingWhen(iso) {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch (e) {
      return '';
    }
  }

  function defaultMeetingLabel() {
    saveClient();
    readStateFromDom();
    const name = (state.client && state.client.name && String(state.client.name).trim()) || '';
    if (name) return name;
    const when = formatMeetingWhen(new Date().toISOString()) || 'today';
    return 'Meeting · ' + when;
  }

  function captureMeetingSnapshot(label) {
    saveClient();
    readStateFromDom();
    if (!lastScenario) {
      try { liveUpdate(); } catch (e) { /* ignore */ }
    }
    const plan =
      window.currentPlan && Array.isArray(window.currentPlan.tabs)
        ? { tabs: window.currentPlan.tabs.slice() }
        : null;
    const otherDebts = (state.debts || []).filter(function (d) {
      return d && d.name !== 'Current Mortgage';
    });
    return {
      id: 'm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      label: String(label || defaultMeetingLabel()).trim() || defaultMeetingLabel(),
      savedAt: new Date().toISOString(),
      client: {
        name: (state.client && state.client.name) || '',
        email: (state.client && state.client.email) || '',
        phone: (state.client && state.client.phone) || '',
        notes: (state.client && state.client.notes) || ''
      },
      calc: {
        homeValue: state.homeValue,
        currentBalance: state.currentBalance,
        currentRate: state.currentRate,
        yearsRemaining: state.yearsRemaining,
        closingDate: state.closingDate || '',
        totalPayment: state.totalPayment,
        taxes: state.taxes,
        insurance: state.insurance,
        pmi: state.pmi,
        escrowIncluded: !!state.escrowIncluded,
        newLoanAmount: state.newLoanAmount,
        newRate: state.newRate,
        newTerm: state.newTerm,
        closingCosts: state.closingCosts,
        projectCash: state.projectCash,
        newPmi: state.newPmi,
        newPmiManual: !!state.newPmiManual,
        debts: JSON.parse(JSON.stringify(state.debts || []))
      },
      scenarios: JSON.parse(JSON.stringify(savedScenarios || [])),
      plan: plan,
      wizardStep: wizardStep,
      wizardMaxReached: wizardMaxReached,
      experienceMode: experienceMode,
      metrics: lastScenario
        ? {
            monthlyCashFlowChange: lastScenario.monthlyCashFlowChange,
            cashAtClosing: lastScenario.cashAtClosing,
            isCashBack: lastScenario.isCashBack,
            newHousing: lastScenario.newHousing,
            breakEvenMonths: lastScenario.breakEvenMonths,
            otherDebts: otherDebts.length
          }
        : { otherDebts: otherDebts.length }
    };
  }

  /**
   * Park the active borrower. Does not clear the screen.
   * @param {string} [label]
   * @param {{ silent?: boolean }} [opts]
   * @returns {object|null} saved meeting
   */
  function saveMeetingToLibrary(label, opts) {
    const options = opts || {};
    loadSavedMeetings();
    // Ignore accidental Event from onclick wiring
    let useLabel = typeof label === 'string' ? label : '';
    if (!useLabel) {
      const field = document.getElementById('new-meeting-label');
      if (field && field.value.trim()) useLabel = field.value.trim();
    }
    const snap = captureMeetingSnapshot(useLabel);
    // Upsert by label (case-insensitive) so re-saving same client updates the card
    const key = String(snap.label).toLowerCase();
    savedMeetings = savedMeetings.filter(function (m) {
      return String(m.label || '').toLowerCase() !== key;
    });
    savedMeetings.unshift(snap);
    savedMeetings = savedMeetings.slice(0, MAX_SAVED_MEETINGS);
    persistSavedMeetings();
    if (!options.silent) {
      toast('Saved “' + snap.label + '” — open anytime under Saved meetings');
      renderSavedMeetingsList();
    }
    return snap;
  }

  function clearClientFields() {
    state.client = { name: '', email: '', phone: '', notes: '' };
    try { localStorage.removeItem(CLIENT_KEY); } catch (e) { /* ignore */ }
    if ($('client-name')) $('client-name').value = '';
    if ($('client-email')) $('client-email').value = '';
    if ($('client-phone')) $('client-phone').value = '';
    if ($('client-notes')) $('client-notes').value = '';
  }

  function clearSmartPlanUi() {
    window.currentPlan = null;
    window.clientCalcData = null;
    window.__canonicalNumbers = null;
    window.__strategicBrief = null;
    const results = $('results-area');
    if (results) results.classList.add('hidden');
    if ($('tab-content')) $('tab-content').innerHTML = '';
    if ($('results-client-name')) $('results-client-name').textContent = '';
  }

  /**
   * Full session reset for a new borrower.
   * Keeps LO branding + theme. Clears client, debts, scenario, compare, plan, wizard.
   */
  function resetActiveMeetingToDefaults(opts) {
    const options = opts || {};
    const d = C.DEFAULTS;

    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    try { localStorage.removeItem(SCENARIOS_KEY); } catch (e) { /* ignore */ }
    try {
      localStorage.setItem(WIZARD_STEP_KEY, '0');
      localStorage.setItem(MAX_WIZARD_REACHED_KEY, '0');
    } catch (e) { /* ignore */ }

    // Branding intentionally untouched
    state.homeValue = d.homeValue;
    state.currentBalance = d.currentBalance;
    state.currentRate = d.currentRate;
    state.yearsRemaining = d.yearsRemaining;
    state.closingDate = '';
    state.totalPayment = d.totalPayment;
    state.taxes = d.taxes;
    state.insurance = d.insurance;
    state.pmi = d.pmi;
    state.escrowIncluded = true;
    state.newLoanAmount = d.newLoanAmount;
    state.newRate = d.newRate;
    state.newTerm = d.newTerm;
    state.closingCosts = d.closingCosts;
    state.projectCash = 30000;
    state.newPmi = 0;
    state.newPmiManual = false;
    state.debts = [];

    clearClientFields();
    savedScenarios = [];
    persistScenarios();
    clearSmartPlanUi();
    lastScenario = null;
    expandedDebtIndex = null;
    editingDebtIndex = undefined;
    mortgageModalDirty = false;

    wizardStep = 0;
    wizardMaxReached = 0;
    dismissResumeBanner();

    hydrateDomFromState();
    syncTermSegmented();
    ensureMortgageDebt();
    paintClosingCostsSlider(state.closingCosts);
    try { liveUpdate(); } catch (e) { /* ignore */ }
    renderScenarioCompare();

    // Close calc modals that might hold stale form values
    try {
      if ($('debts-modal') && !$('debts-modal').classList.contains('hidden')) closeDebtsModal();
      if ($('mortgage-modal') && !$('mortgage-modal').classList.contains('hidden')) cancelMortgageModal();
      if ($('add-debt-modal') && !$('add-debt-modal').classList.contains('hidden')) closeAddDebtModal();
    } catch (e) { /* ignore */ }

    if (options.goToStart !== false) {
      setExperienceMode('guided');
      goToWizardStep(0, { silent: true });
    }

    if (!options.silent) {
      toast('Fresh start — enter the next client. Branding kept.');
    }
  }

  function openNewMeetingModal() {
    saveClient();
    const label = document.getElementById('new-meeting-label');
    if (label) label.value = (state.client && state.client.name) || '';
    const saveFirst = document.getElementById('new-meeting-save-first');
    if (saveFirst) saveFirst.checked = true;
    setModalOpen('new-meeting-modal', true);
  }

  function closeNewMeetingModal() {
    setModalOpen('new-meeting-modal', false);
  }

  /**
   * @param {boolean} [forceSave] if true always save; if false never; if undefined use checkbox
   */
  function confirmNewMeeting(forceSave) {
    let shouldSave = !!forceSave;
    if (forceSave === undefined) {
      const cb = document.getElementById('new-meeting-save-first');
      shouldSave = !!(cb && cb.checked);
    }
    // Explicit Discard button passes false
    if (forceSave === false) shouldSave = false;
    if (forceSave === true) shouldSave = true;

    if (shouldSave) {
      const labelEl = document.getElementById('new-meeting-label');
      const label = labelEl && labelEl.value.trim() ? labelEl.value.trim() : '';
      saveMeetingToLibrary(label, { silent: true });
    }
    closeNewMeetingModal();
    resetActiveMeetingToDefaults({
      silent: true,
      goToStart: true
    });
    toast(
      shouldSave
        ? 'Meeting saved. Fresh start — next client ready.'
        : 'Meeting discarded. Fresh start — next client ready.'
    );
    // Focus client name for the next appointment
    try {
      const name = $('client-name');
      if (name) {
        toggleAccordion('client-info-content', 'client-chevron', true);
        setTimeout(function () { name.focus(); }, 120);
      }
    } catch (e) { /* ignore */ }
  }

  function openSavedMeetingsModal() {
    loadSavedMeetings();
    renderSavedMeetingsList();
    setModalOpen('saved-meetings-modal', true);
  }

  function closeSavedMeetingsModal() {
    setModalOpen('saved-meetings-modal', false);
  }

  function renderSavedMeetingsList() {
    const el = document.getElementById('saved-meetings-list') || $('saved-meetings-list');
    if (!el) return;
    loadSavedMeetings();
    if (!savedMeetings.length) {
      el.innerHTML =
        '<div class="ss-meeting-empty">' +
        '<p class="text-sm font-semibold">No saved meetings yet</p>' +
        '<p class="text-xs opacity-65 mt-1">Use <strong>Save meeting</strong> or choose <strong>Save &amp; start new</strong> when switching borrowers.</p>' +
        '</div>';
      return;
    }
    el.innerHTML = savedMeetings
      .map(function (m) {
        const when = formatMeetingWhen(m.savedAt);
        const cf = m.metrics && m.metrics.monthlyCashFlowChange != null
          ? money(m.metrics.monthlyCashFlowChange)
          : '—';
        const debtN = (m.metrics && m.metrics.otherDebts != null)
          ? m.metrics.otherDebts
          : ((m.calc && m.calc.debts) || []).filter(function (d) {
              return d && d.name !== 'Current Mortgage';
            }).length;
        const email = (m.client && m.client.email) || '';
        return (
          '<div class="ss-meeting-card" data-meeting-id="' + escapeHtml(m.id) + '">' +
            '<div class="ss-meeting-card-main">' +
              '<div class="ss-meeting-card-title">' + escapeHtml(m.label || 'Meeting') + '</div>' +
              '<div class="ss-meeting-card-meta">' +
                (when ? escapeHtml(when) : '') +
                (email ? ' · ' + escapeHtml(email) : '') +
                ' · CF ' + escapeHtml(String(cf)) +
                ' · ' + debtN + ' other debt' + (debtN === 1 ? '' : 's') +
              '</div>' +
            '</div>' +
            '<div class="ss-meeting-card-actions">' +
              '<button type="button" class="btn-ghost text-sm py-2 px-3" data-open-meeting="' +
                escapeHtml(m.id) +
                '">Open</button>' +
              '<button type="button" class="text-red-500 text-sm font-medium py-2 px-2" data-delete-meeting="' +
                escapeHtml(m.id) +
                '" aria-label="Delete saved meeting">Delete</button>' +
            '</div>' +
          '</div>'
        );
      })
      .join('');

    el.querySelectorAll('[data-open-meeting]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        loadMeetingById(btn.getAttribute('data-open-meeting'));
      });
    });
    el.querySelectorAll('[data-delete-meeting]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        deleteMeetingById(btn.getAttribute('data-delete-meeting'));
      });
    });
  }

  function loadMeetingById(id) {
    loadSavedMeetings();
    const m = savedMeetings.find(function (x) { return x.id === id; });
    if (!m) {
      toast('Meeting not found', 'warn');
      return;
    }

    // If screen has a named client different from this one, offer to park first
    saveClient();
    const activeName = (state.client && state.client.name && String(state.client.name).trim()) || '';
    const targetName = (m.client && m.client.name && String(m.client.name).trim()) || m.label;
    if (activeName && activeName.toLowerCase() !== String(targetName || '').toLowerCase()) {
      const park = window.confirm(
        'You have “' + activeName + '” on screen.\n\n' +
          'OK = save them first, then open “' + (targetName || 'meeting') + '”.\n' +
          'Cancel = open without saving the current screen.'
      );
      if (park) saveMeetingToLibrary(activeName, { silent: true });
    }

    const c = m.calc || {};
    state.homeValue = c.homeValue != null ? c.homeValue : C.DEFAULTS.homeValue;
    state.currentBalance = c.currentBalance != null ? c.currentBalance : C.DEFAULTS.currentBalance;
    state.currentRate = c.currentRate != null ? c.currentRate : C.DEFAULTS.currentRate;
    state.yearsRemaining = c.yearsRemaining != null ? c.yearsRemaining : C.DEFAULTS.yearsRemaining;
    state.closingDate = c.closingDate || '';
    state.totalPayment = c.totalPayment != null ? c.totalPayment : C.DEFAULTS.totalPayment;
    state.taxes = c.taxes != null ? c.taxes : C.DEFAULTS.taxes;
    state.insurance = c.insurance != null ? c.insurance : C.DEFAULTS.insurance;
    state.pmi = c.pmi != null ? c.pmi : C.DEFAULTS.pmi;
    state.escrowIncluded = c.escrowIncluded !== false;
    state.newLoanAmount = c.newLoanAmount != null ? c.newLoanAmount : C.DEFAULTS.newLoanAmount;
    state.newRate = c.newRate != null ? c.newRate : C.DEFAULTS.newRate;
    state.newTerm = c.newTerm != null ? c.newTerm : C.DEFAULTS.newTerm;
    state.closingCosts = c.closingCosts != null ? c.closingCosts : C.DEFAULTS.closingCosts;
    state.projectCash = c.projectCash != null ? c.projectCash : 30000;
    state.newPmi = c.newPmi != null ? c.newPmi : 0;
    state.newPmiManual = !!c.newPmiManual;
    state.debts = Array.isArray(c.debts) ? JSON.parse(JSON.stringify(c.debts)) : [];

    state.client = {
      name: (m.client && m.client.name) || '',
      email: (m.client && m.client.email) || '',
      phone: (m.client && m.client.phone) || '',
      notes: (m.client && m.client.notes) || ''
    };
    try { localStorage.setItem(CLIENT_KEY, JSON.stringify(state.client)); } catch (e) { /* ignore */ }
    if ($('client-name')) $('client-name').value = state.client.name || '';
    if ($('client-email')) $('client-email').value = state.client.email || '';
    if ($('client-phone')) $('client-phone').value = state.client.phone || '';
    if ($('client-notes')) $('client-notes').value = state.client.notes || '';

    savedScenarios = Array.isArray(m.scenarios) ? JSON.parse(JSON.stringify(m.scenarios)) : [];
    persistScenarios();

    if (m.plan && Array.isArray(m.plan.tabs) && m.plan.tabs.length) {
      window.currentPlan = { tabs: m.plan.tabs.slice() };
    } else {
      clearSmartPlanUi();
    }

    sanitizeStateInPlace();
    hydrateDomFromState();
    syncTermSegmented();
    ensureMortgageDebt();
    saveToStorage();
    liveUpdate();
    renderScenarioCompare();

    if (window.currentPlan && window.currentPlan.tabs && window.currentPlan.tabs.length) {
      setResultsClientName(state.client.name || m.label || 'Client');
      showTab(0);
      if ($('results-area')) $('results-area').classList.remove('hidden');
    }

    wizardStep = typeof m.wizardStep === 'number' ? m.wizardStep : 0;
    wizardMaxReached = typeof m.wizardMaxReached === 'number'
      ? Math.max(m.wizardMaxReached, wizardStep)
      : wizardStep;
    try {
      localStorage.setItem(WIZARD_STEP_KEY, String(wizardStep));
      localStorage.setItem(MAX_WIZARD_REACHED_KEY, String(wizardMaxReached));
    } catch (e) { /* ignore */ }

    if (m.experienceMode === 'expert' || m.experienceMode === 'guided') {
      setExperienceMode(m.experienceMode);
    }
    if (experienceMode === 'guided') {
      goToWizardStep(wizardStep, { silent: true });
    }

    closeSavedMeetingsModal();
    dismissResumeBanner();
    toast('Opened “' + (m.label || 'meeting') + '”');
  }

  function deleteMeetingById(id) {
    loadSavedMeetings();
    const m = savedMeetings.find(function (x) { return x.id === id; });
    if (!m) return;
    if (!window.confirm('Delete saved meeting “' + (m.label || 'Meeting') + '”? This cannot be undone.')) {
      return;
    }
    savedMeetings = savedMeetings.filter(function (x) { return x.id !== id; });
    persistSavedMeetings();
    renderSavedMeetingsList();
    toast('Deleted saved meeting');
  }

  /** Debts modal: remove consumer debts only — not a full meeting reset */
  function clearOtherDebts() {
    const others = (state.debts || []).filter(function (d) {
      return d && d.name !== 'Current Mortgage';
    });
    if (!others.length) {
      toast('No other debts to clear');
      return;
    }
    if (!window.confirm('Remove all other debts (credit cards, auto, student, etc.)? Current mortgage stays.')) {
      return;
    }
    state.debts = (state.debts || []).filter(function (d) {
      return d && d.name === 'Current Mortgage';
    });
    ensureMortgageDebt();
    expandedDebtIndex = null;
    saveToStorage();
    liveUpdate();
    try { renderDebts(); } catch (e) { /* ignore */ }
    toast('Other debts cleared');
  }

  /** Legacy name → full new-meeting flow (with confirm modal) */
  function clearAllData() {
    openNewMeetingModal();
  }

  // ─── Detail modals ───────────────────────────────────────
  function showCashFlowModal() {
    if (!lastScenario) liveUpdate();
    const s = lastScenario;
    const html =
      '<div class="space-y-4 text-base">' +
      row('Current total housing', money(s.oldHousing)) +
      row('Other debts being paid off (monthly)', money(s.otherDebtMonthly)) +
      row('Old combined obligations', money(s.oldMonthlyObligations), true) +
      row('New P&I', money(s.newPi)) +
      row('New taxes + ins + est. PMI', money(s.newEscrow)) +
      row('New total housing', money(s.newHousing), true) +
      '<div class="pt-4 border-t border-white/20 flex justify-between text-2xl font-black">' +
        '<span>Monthly cash-flow change</span><span class="' + (s.monthlyCashFlowChange >= 0 ? 'pos' : 'neg') + '">' +
        (s.monthlyCashFlowChange >= 0 ? '+' : '') + money(s.monthlyCashFlowChange) + '</span></div>' +
      '<p class="text-sm opacity-70 mt-2">Includes estimated housing costs on both sides. Consumer debt payments stop only for debts marked “pay off with refi.”</p>' +
      '</div>';
    showDetailModal('Monthly cash-flow change', html);
  }

  function showDebtsPaidModal() {
    if (!lastScenario) liveUpdate();
    let items = '';
    let total = 0;
    state.debts.forEach(d => {
      if (!d.payOff) return;
      total += Number(d.bal) || 0;
      items += '<div class="flex justify-between py-2 border-b border-white/10"><span>' + escapeHtml(d.name) +
        '</span><span class="font-bold number">' + money(d.bal) + '</span></div>';
    });
    if (!items) items = '<p class="opacity-60">No debts selected.</p>';
    showDetailModal('Debts paid off in this scenario', items +
      '<div class="flex justify-between text-2xl font-black mt-4"><span>Total</span><span>' + money(total) + '</span></div>');
  }

  function showCashClosingModal() {
    if (!lastScenario) liveUpdate();
    const s = lastScenario;
    const html =
      row('New loan amount', money(s.newLoanAmount)) +
      row('Current mortgage payoff', '−' + money(s.currentBalance)) +
      row('Other debts paid off', '−' + money(s.otherDebtsPaidOff)) +
      row('Estimated closing costs', '−' + money(s.closingCosts)) +
      '<div class="pt-4 border-t border-white/20 flex justify-between text-2xl font-black">' +
        '<span>' + (s.isCashBack ? 'Cash you receive' : 'Cash to close') + '</span>' +
        '<span class="' + (s.isCashBack ? '' : 'neg') + '" style="' + (s.isCashBack ? 'color:#F15A29' : '') + '">' +
        money(Math.abs(s.cashAtClosing)) + '</span></div>' +
      '<p class="text-sm opacity-70 mt-3">Closing costs are an estimate and can be edited on the main screen. Prepaid interest and escrow deposits may change cash to close.</p>';
    showDetailModal('Cash at closing', html);
  }

  /**
   * Break-even = how long monthly cash-flow savings take to recover est. closing costs.
   * Formula: ceil(closingCosts / monthlyCashFlowChange) when CF is meaningful.
   */
  function showBreakEvenModal() {
    if (!lastScenario) liveUpdate();
    const s = lastScenario;
    const costs = Number(s.closingCosts) || 0;
    const cf = Number(s.monthlyCashFlowChange) || 0;
    const be = s.breakEvenMonths;
    const MIN_CF = 50;
    const MAX_MO = 120;

    let rawExact = null;
    let rawCeil = null;
    if (cf > 0 && costs > 0) {
      rawExact = costs / cf;
      rawCeil = Math.ceil(rawExact);
    }

    let headline;
    if (be === 0) {
      headline = 'Immediate — no closing costs are modeled.';
    } else if (be != null && be > 0) {
      headline =
        'About <strong class="number">' +
        be +
        ' months</strong> to recover estimated closing costs from monthly cash-flow savings.';
    } else if (s.breakEvenNotMeaningful && cf > 0 && cf < MIN_CF) {
      headline =
        'Break-even is hidden because monthly savings are under $' +
        MIN_CF +
        '/mo — recovery would be too slow to coach confidently in a meeting.';
    } else if (s.breakEvenNotMeaningful && rawCeil != null && rawCeil > MAX_MO) {
      headline =
        'Break-even would be about <strong class="number">' +
        rawCeil +
        ' months</strong> (over ' +
        MAX_MO +
        ' mo / ~10 years), so we treat it as not meaningful for this meeting.';
    } else if (cf <= 0) {
      headline =
        'No break-even while monthly cash-flow change is zero or negative — costs are not being recovered month to month.';
    } else {
      headline = 'Break-even is not available for this scenario.';
    }

    let formulaBlock = '';
    if (costs > 0 && cf > 0) {
      const exactStr =
        rawExact != null
          ? (Math.round(rawExact * 10) / 10).toFixed(1).replace(/\.0$/, '')
          : '—';
      formulaBlock =
        '<div class="mt-4 p-4 rounded-xl glass border border-[#00A89D]/25 space-y-2">' +
        '<div class="label-caps">How we calculate it</div>' +
        '<p class="text-base font-semibold m-0 leading-snug">' +
        'Break-even (months) = ' +
        '<span class="number">Estimated closing costs</span> ÷ ' +
        '<span class="number">Monthly cash-flow savings</span>' +
        '</p>' +
        '<p class="text-lg font-black number m-0 pt-1">' +
        money(costs) +
        ' ÷ ' +
        money(cf) +
        ' = ' +
        exactStr +
        ' mo' +
        (rawCeil != null && rawCeil !== Number(exactStr)
          ? ' → rounded up to <span class="pos">' + rawCeil + ' mo</span>'
          : rawCeil != null
            ? ' → <span class="pos">' + rawCeil + ' mo</span>'
            : '') +
        '</p>' +
        '<p class="text-xs opacity-65 m-0 pt-1">We round up to whole months (partial months still count as a full payment cycle).</p>' +
        '</div>';
    } else if (costs <= 0 && cf > 0) {
      formulaBlock =
        '<div class="mt-4 p-4 rounded-xl glass border border-[#00A89D]/25">' +
        '<div class="label-caps">How we calculate it</div>' +
        '<p class="text-sm m-0 mt-1">With <strong>$0</strong> estimated closing costs and positive monthly savings, recovery is immediate — there is nothing to “earn back.”</p>' +
        '</div>';
    } else {
      formulaBlock =
        '<div class="mt-4 p-4 rounded-xl glass border border-white/10">' +
        '<div class="label-caps">How we calculate it</div>' +
        '<p class="text-sm m-0 mt-1">When monthly cash-flow savings are positive and closing costs are greater than zero:</p>' +
        '<p class="text-base font-semibold m-0 mt-2">Months = Closing costs ÷ Monthly cash-flow change</p>' +
        '</div>';
    }

    const html =
      '<div class="space-y-1 text-base">' +
      '<p class="text-sm opacity-80 leading-relaxed m-0">' +
      headline +
      '</p>' +
      formulaBlock +
      '<div class="mt-4 space-y-0">' +
      row('Estimated closing costs', money(costs)) +
      row(
        'Monthly cash-flow change',
        (cf >= 0 ? '+' : '') + money(cf),
        true
      ) +
      (rawCeil != null
        ? row('Exact months (before round-up)', (Math.round(rawExact * 10) / 10).toFixed(1).replace(/\.0$/, '') + ' mo')
        : '') +
      (be != null
        ? row('Break-even shown on card', be === 0 ? 'Immediate' : be + ' mo', true)
        : row('Break-even shown on card', 'N/A', true)) +
      '</div>' +
      '<div class="mt-4 text-sm opacity-70 space-y-2">' +
      '<p class="m-0"><strong class="opacity-90">What “cash-flow savings” means:</strong> old total housing + other debts marked pay-off with refi, minus new total housing (P&amp;I + taxes + insurance + est. PMI). Same figure as the Cash-flow change card.</p>' +
      '<p class="m-0"><strong class="opacity-90">What it is not:</strong> not equity, not tax effects, not prepaid interest/escrow at closing beyond the estimated costs you entered. Edit closing costs on Scenario to see this number move.</p>' +
      (cf > 0
        ? '<p class="m-0">After month ' +
          (be != null && be > 0 ? be : rawCeil || 'N') +
          ', the monthly savings have covered those closing costs — every month after is “in the green” on that simple recovery test.</p>'
        : '') +
      '</div>' +
      '<p class="text-xs opacity-55 mt-4 m-0">Tip: open <button type="button" class="underline font-semibold opacity-90" onclick="RuoffApp.showCashFlowModal()">Cash-flow change</button> for the full monthly stack that feeds this math.</p>' +
      '</div>';

    showDetailModal('Break-even explained', html);
  }

  function showInterestModal() {
    if (!lastScenario) liveUpdate();
    const s = lastScenario;
    const mi = s.mortgageInterest || {};
    const consolidating = isDebtConsolidationScenario(s);
    const methodNote =
      mi.keepMethod === 'actual_payment'
        ? 'Keep-path interest uses your current P&I of ' +
          money(mi.keepMonthlyPiUsed) +
          '/mo (same basis as cash-flow).'
        : mi.keepMethod === 'amortizing_fallback'
          ? 'Current payment does not cover interest at the entered rate — using a standard amortizing schedule instead.'
          : 'Keep-path interest assumes a standard amortizing payment of ' +
            money(mi.contractualMonthlyPi || mi.keepMonthlyPiUsed) +
            '/mo.';
    let html = '';
    if (consolidating) {
      html +=
        '<div class="mb-4 p-3 rounded-xl text-sm" style="background:rgba(241,90,41,0.1);border:1px solid rgba(241,90,41,0.25)">' +
        '<strong>Debt consolidation in play.</strong> The new loan is larger because it rolls in other debts. ' +
        'Mortgage-only “interest vs keep current” can look worse even when cash flow improves and high-rate balances are retired. ' +
        'We only estimate consumer interest avoided when you enter a rate on that debt.' +
        '</div>';
    }
    html +=
      '<p class="text-sm opacity-75 mb-2">Mortgage interest only (current loan vs proposed loan schedule).</p>' +
      '<p class="text-xs opacity-60 mb-4">' +
      methodNote +
      '</p>' +
      row('Interest left on current mortgage', money(mi.keepInterest)) +
      row('Interest on new loan (full principal)', money(mi.refiInterest)) +
      row('Mortgage interest difference', money(mi.savings), true) +
      row('Other debts rolled in', money(s.otherDebtsPaidOff)) +
      row('Monthly payments freed', money(s.otherDebtMonthly)) +
      row('Consumer debt interest avoided (est.)', money(s.consumerDebtInterestAvoided));

    html += '<div class="mt-6 space-y-3">';
    [25, 20, 15, 10].forEach(function (term) {
      const pi = C.calculateMonthlyPayment(s.newLoanAmount, s.newRate, term);
      const pi30 = C.calculateMonthlyPayment(s.newLoanAmount, s.newRate, 30);
      const saved = Math.round(pi30 * 360 - pi * term * 12);
      const increase = Math.round(pi - pi30);
      html +=
        '<div class="flex justify-between glass p-4 rounded-xl">' +
        '<div><div class="font-bold">' +
        term +
        '-year term</div><div class="text-sm opacity-70">' +
        money(pi) +
        ' /mo P&I</div></div>' +
        '<div class="text-right"><div class="font-black pos">Save ' +
        money(saved) +
        '</div>' +
        '<div class="text-xs opacity-60">+' +
        money(increase) +
        '/mo vs 30yr</div></div></div>';
    });
    html += '</div>';
    showDetailModal('Interest comparison', html);
  }

  function row(label, value, strong) {
    return '<div class="flex justify-between py-2 ' + (strong ? 'font-bold text-lg' : '') + '"><span class="opacity-80">' +
      label + '</span><span class="number">' + value + '</span></div>';
  }

  function showDetailModal(title, bodyHtml) {
    if ($('detail-title')) $('detail-title').textContent = title;
    if ($('detail-body')) $('detail-body').innerHTML = bodyHtml;
    lockCalcModalBackdrops();
    setModalOpen('detail-modal', true);
  }

  function closeDetailModal() {
    setModalOpen('detail-modal', false);
  }

  function showHelp(title, content) {
    if ($('help-title')) $('help-title').textContent = title;
    if ($('help-content')) $('help-content').innerHTML = content;
    lockCalcModalBackdrops();
    setModalOpen('help-modal', true);
  }

  function closeHelp() {
    setModalOpen('help-modal', false);
  }

  // ─── Smart Plan loading modal ────────────────────────────
  let planLoadingTimer = null;
  let planLoadingStep = 0;

  const PLAN_LOADING_STATUSES = MODE === 'borrower'
    ? [
        'Locking in your scenario numbers…',
        'Comparing rate-and-term vs debt payoff options…',
        'Writing a clear plan in plain language…',
        'Almost done — assembling your summary…'
      ]
    : [
        'Locking in your scenario numbers…',
        'Comparing rate-and-term vs debt payoff alternatives…',
        'Writing client narrative, scripts, and follow-up…',
        'Assembling tabs for the meeting…'
      ];

  function fillPlanLoadingKpis(scenario) {
    const s = scenario || lastScenario;
    if (!s) return;
    const cf = s.monthlyCashFlowChange;
    const cfEl = $('plan-loading-cf');
    if (cfEl) {
      cfEl.textContent = (cf > 0 ? '+' : '') + money(cf);
      cfEl.className = 'plan-kpi-value number ' + (cf > 0 ? 'pos' : cf < 0 ? 'neg' : '');
    }
    setText('plan-loading-loan', money(s.newLoanAmount));
    const cashEl = $('plan-loading-cash');
    if (cashEl) {
      cashEl.textContent = s.cashAtClosing === 0
        ? 'Even'
        : ((s.isCashBack ? 'Back ' : 'Due ') + money(Math.abs(s.cashAtClosing)));
    }
  }

  function setPlanLoadingStep(step) {
    planLoadingStep = Math.max(0, Math.min(PLAN_LOADING_STATUSES.length - 1, step));
    const bar = $('plan-loading-bar');
    if (bar) {
      const pct = 12 + (planLoadingStep / (PLAN_LOADING_STATUSES.length - 1)) * 78;
      bar.style.width = pct + '%';
    }
    const status = $('plan-loading-status');
    if (status) {
      status.classList.add('is-fading');
      setTimeout(function () {
        status.textContent = PLAN_LOADING_STATUSES[planLoadingStep] || PLAN_LOADING_STATUSES[0];
        status.classList.remove('is-fading');
      }, 160);
    }
    rootQueryAll('#plan-loading-steps [data-plan-step]').forEach(function (li) {
      const i = parseInt(li.getAttribute('data-plan-step'), 10);
      li.classList.toggle('active', i === planLoadingStep);
      li.classList.toggle('done', i < planLoadingStep);
      const dot = li.querySelector('.pls-dot');
      if (dot) {
        if (i < planLoadingStep) {
          dot.innerHTML = '<i class="fas fa-check" style="font-size:0.6rem"></i>';
        } else {
          dot.textContent = String(i + 1);
        }
      }
    });
  }

  function startPlanLoadingUI(scenario) {
    fillPlanLoadingKpis(scenario);
    setPlanLoadingStep(0);
    const bar = $('plan-loading-bar');
    if (bar) bar.style.width = '10%';
    clearInterval(planLoadingTimer);
    let step = 0;
    planLoadingTimer = setInterval(function () {
      step = Math.min(step + 1, PLAN_LOADING_STATUSES.length - 1);
      setPlanLoadingStep(step);
      if (step >= PLAN_LOADING_STATUSES.length - 1) {
        clearInterval(planLoadingTimer);
        planLoadingTimer = null;
      }
    }, 2200);
  }

  function stopPlanLoadingUI(complete) {
    clearInterval(planLoadingTimer);
    planLoadingTimer = null;
    if (complete) {
      const bar = $('plan-loading-bar');
      if (bar) bar.style.width = '100%';
      setPlanLoadingStep(PLAN_LOADING_STATUSES.length - 1);
      const status = $('plan-loading-status');
      if (status) status.textContent = MODE === 'borrower' ? 'Plan ready' : 'Smart Plan ready';
    }
  }

  // ─── AI plan generation ──────────────────────────────────

  /**
   * Engine-built strategic brief for the model — not just raw inputs.
   * Numbers stay locked; this gives the AI analysis hooks (goals, ST/LT benefits, risks).
   */
  function buildStrategicBrief(numbers, scenario, client) {
    const n = numbers || {};
    const s = scenario || lastScenario || {};
    const c = client || {};
    const goalsRaw = String(c.clientNotes || n.clientNotes || '').trim();
    const goals =
      goalsRaw ||
      'No goals entered — infer priorities from the numbers (cash flow, debt, term, equity) and name assumptions clearly.';

    const cf = Number(n.monthlyCashFlowChange) || 0;
    const cash = Number(n.cashAtClosing) || 0;
    const isCashBack = !!n.isCashBack || cash > 0;
    const mortSav = Number(n.mortgageInterestSavings) || 0;
    const consSav = Number(n.consumerDebtInterestAvoided) || 0;
    const half = n.halfSavingsPaydown || null;
    const shorter = n.shorterTermInterestSavings;
    const debts = Array.isArray(n.debts) ? n.debts : [];
    const payoff = debts.filter(function (d) {
      return d.payOff && !d.isMortgage;
    });
    const highApr = payoff.filter(function (d) {
      return (Number(d.interestRate) || 0) >= 12;
    });

    const situationDiagnosis = [];
    if (cf > 50) {
      situationDiagnosis.push(
        'Primary path improves monthly cash flow by about ' + money(cf) + ' vs today.'
      );
    } else if (cf > 0) {
      situationDiagnosis.push(
        'Primary path only slightly improves cash flow (~' + money(cf) + '/mo) — lean on debt payoff, interest, or term story if present.'
      );
    } else if (cf < 0) {
      situationDiagnosis.push(
        'Primary path increases total monthly housing obligations by about ' +
          money(Math.abs(cf)) +
          ' — justify with debt consolidation, term, cash-out purpose, or interest trade-offs; do not oversell “savings.”'
      );
    } else {
      situationDiagnosis.push('Primary path is roughly cash-flow neutral month to month.');
    }

    if (isCashBack && Math.abs(cash) > 0) {
      situationDiagnosis.push(
        'Scenario produces estimated cash back of ' + money(Math.abs(cash)) + ' at closing (after modeled costs).'
      );
    } else if (!isCashBack && Math.abs(cash) > 0) {
      situationDiagnosis.push(
        'Scenario requires about ' + money(Math.abs(cash)) + ' cash to close (includes ' + money(n.closingCosts) + ' est. costs).'
      );
    }

    if (payoff.length) {
      const otherPayMo =
        Number(n.otherDebtMonthly != null ? n.otherDebtMonthly : s.otherDebtMonthly) || 0;
      situationDiagnosis.push(
        payoff.length +
          ' consumer debt(s) marked for payoff totaling ' +
          money(n.otherDebtsPaidOff || 0) +
          ' balance / ' +
          money(otherPayMo) +
          '/mo selected payments.'
      );
    } else {
      situationDiagnosis.push('Rate-and-term style path — no consumer debts marked for payoff in primary.');
    }

    if (highApr.length) {
      situationDiagnosis.push(
        'High-APR focus: ' +
          highApr
            .map(function (d) {
              return d.name + ' @ ' + d.interestRate + '%';
            })
            .join('; ') +
          '.'
      );
    }

    if ((Number(n.currentRate) || 0) > (Number(n.newRate) || 0) + 0.125) {
      situationDiagnosis.push(
        'Rate drop: ' + n.currentRate + '% → ' + n.newRate + '% on the modeled loan.'
      );
    }

    if ((Number(n.newTerm) || 0) > (Number(n.yearsRemaining) || 0) + 0.5) {
      situationDiagnosis.push(
        'Term extends vs years remaining (' +
          n.yearsRemaining +
          ' yrs left → ' +
          n.newTerm +
          ' yr new term) — call out total interest trade-off honestly.'
      );
    } else if ((Number(n.newTerm) || 0) + 0.5 < (Number(n.yearsRemaining) || 0)) {
      situationDiagnosis.push(
        'Shorter modeled term vs remaining term — stronger payoff / interest angle.'
      );
    }

    const shortTermBenefits = [];
    if (cf > 0) {
      shortTermBenefits.push('More monthly cash flow (~' + money(cf) + ') for budget flexibility.');
    }
    if (payoff.length) {
      shortTermBenefits.push(
        'Simplifies monthly bills by rolling selected debts into one housing payment.'
      );
    }
    if (isCashBack && Math.abs(cash) >= 1000) {
      shortTermBenefits.push(
        'Access to estimated cash at closing (~' + money(Math.abs(cash)) + ') for approved purposes.'
      );
    }
    if (n.breakEvenMonths != null && n.breakEvenMonths > 0 && n.breakEvenMonths <= 60) {
      shortTermBenefits.push(
        'Closing costs may be recovered via monthly savings in about ' + n.breakEvenMonths + ' months (model only).'
      );
    }
    if (!shortTermBenefits.length) {
      shortTermBenefits.push(
        'Near-term value may be structural (debt structure, rate, term) rather than large monthly savings — explain clearly.'
      );
    }

    const longTermBenefits = [];
    if (mortSav > 0) {
      longTermBenefits.push(
        'Modeled mortgage interest difference vs keeping current loan: ~' +
          money(mortSav) +
          ' (engine estimate; uses current P&I when available).'
      );
    } else if (mortSav < 0) {
      longTermBenefits.push(
        'Modeled path may cost ~' +
          money(Math.abs(mortSav)) +
          ' more mortgage interest vs keeping current — be transparent; balance with cash flow / debt goals.'
      );
    }
    if (consSav > 0) {
      longTermBenefits.push(
        'Estimated consumer interest avoided by paying off selected debts: ~' + money(consSav) + '.'
      );
    }
    if (shorter != null && shorter > 0) {
      longTermBenefits.push(
        'Vs a 30-year at the same new rate, this term may save ~' + money(shorter) + ' lifetime interest (educational).'
      );
    }
    if (half && half.yearsSaved > 0) {
      longTermBenefits.push(
        'Optional discipline: applying ~' +
          money(half.extraMonthly) +
          '/mo (half of modeled savings) to principal could finish ~' +
          half.yearsSaved +
          ' years sooner and save ~' +
          money(half.interestSavedVsBaseline) +
          ' more interest.'
      );
    }
    if ((Number(n.newLtv) || 0) <= 80 && (Number(n.currentLtv) || 0) > 80) {
      longTermBenefits.push('New LTV at or under 80% supports a PMI-removal narrative if applicable.');
    }
    if (!longTermBenefits.length) {
      longTermBenefits.push(
        'Long-term story should still cover interest path, equity position, and debt freedom timeline using only provided figures.'
      );
    }

    const risksAndWatchouts = [];
    if (cf < 0) {
      risksAndWatchouts.push('Higher monthly housing cost vs today — confirm affordability and goal fit.');
    }
    if (n.overMaxLoan) {
      risksAndWatchouts.push('Loan amount exceeds modeled max LTV guideline for this scenario.');
    }
    if (n.escrowDataWeak) {
      risksAndWatchouts.push('Taxes/insurance may be incomplete — cash-flow figures could be overstated.');
    }
    if ((Number(n.newTerm) || 0) > (Number(n.yearsRemaining) || 0) + 1 && mortSav < 0) {
      risksAndWatchouts.push('Longer term + more interest is a common client objection — address head-on.');
    }
    if (!isCashBack && Math.abs(cash) > 5000) {
      risksAndWatchouts.push('Material cash-to-close — confirm reserves and prepaid/escrow reality with LO.');
    }
    risksAndWatchouts.push(
      'All figures are calculator estimates, not a lock, underwriting decision, or commitment to lend.'
    );

    const coachingQuestions = [
      'What would you do with an extra ' +
        money(Math.max(cf, 0)) +
        ' per month if this path holds after underwriting?',
      goalsRaw
        ? 'How does this path specifically advance: “' + goalsRaw.slice(0, 160) + '”?'
        : 'What is the #1 outcome you want — lower payment, debt freedom, cash for a project, or payoff speed?',
      highApr.length
        ? 'Are you open to prioritizing high-APR balances even if the loan amount is a bit higher?'
        : 'Would you rather keep non-housing debts separate or simplify into one payment?',
      'How long do you plan to keep this home and this loan? That drives break-even and term choices.'
    ];

    const alts = Array.isArray(n.scenarioAlternatives) ? n.scenarioAlternatives : [];
    const hints = n.comparisonHints || {};

    return {
      clientGoalsAndNotes: goals,
      goalsWereProvidedByUser: !!goalsRaw,
      situationDiagnosis: situationDiagnosis,
      shortTermBenefits: shortTermBenefits,
      longTermBenefits: longTermBenefits,
      risksAndWatchouts: risksAndWatchouts,
      coachingQuestions: coachingQuestions,
      analysisDirectives: {
        mustReferenceGoals: true,
        mustSeparateShortVsLongTerm: true,
        mustRecommendWhenAltIsStronger: true,
        bestMonthlyCashFlowAltId: hints.bestMonthlyCashFlowId || null,
        bestConsumerInterestAvoidedAltId: hints.bestConsumerInterestAvoidedId || null,
        alternativeCount: alts.length,
        primaryCashFlow: cf,
        primaryCashAtClosing: cash,
        primaryIsCashBack: isCashBack
      }
    };
  }

  function collectPlanReadinessIssues() {
    readStateFromDom();
    if (!lastScenario) liveUpdate();
    const issues = [];
    if (state.homeValue <= 0) issues.push('Enter a valid home value');
    if (state.currentBalance < 0) issues.push('Mortgage balance can’t be negative');
    if (state.currentBalance === 0 && state.homeValue > 0) {
      /* free and clear is ok */
    }
    if (state.currentRate <= 0) issues.push('Add current interest rate (Edit mortgage)');
    if (state.yearsRemaining <= 0) issues.push('Add years remaining on the current loan');
    if (state.newRate <= 0) issues.push('Enter a proposed new rate greater than 0');
    if (state.newLoanAmount <= 0) issues.push('Enter a proposed loan amount');
    if (state.newTerm <= 0) issues.push('Choose a proposed term');
    return issues;
  }

  function showPlanReadinessChecklist(issues) {
    const banner = $('validation-banner');
    if (banner) {
      banner.classList.remove('hidden');
      banner.innerHTML =
        '<i class="fas fa-list-check flex-shrink-0 mt-0.5"></i><div>' +
        '<strong class="font-semibold">Fix these before generating a plan:</strong>' +
        '<ul class="mt-1 mb-0 pl-4 list-disc">' +
        issues.map(function (i) { return '<li>' + escapeHtml(i) + '</li>'; }).join('') +
        '</ul></div>';
      banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    toast(issues[0] || 'Complete required fields first', 'warn');
  }

  async function generateSmartPlan() {
    if (generatingPlan) return;
    if (!lastScenario) liveUpdate();

    const readiness = collectPlanReadinessIssues();
    if (readiness.length) {
      showPlanReadinessChecklist(readiness);
      return;
    }

    // Soft block only for hard math problems
    if (state.homeValue <= 0 || state.currentBalance < 0) {
      toast('Enter a valid home value and mortgage balance first', 'warn');
      return;
    }

    // Guided → plan handoff: announce, soft-exit portal, then show results in workspace
    if (experienceMode === 'guided' || isGuidedPortalOpen()) {
      await handoffGuidedToPlanWorkspace();
    }

    generatingPlan = true;
    rootQueryAll('[data-generate-btn]').forEach(function (btn) {
      btn.disabled = true;
      btn.classList.add('opacity-70', 'pointer-events-none');
    });
    const modal = $('loading-modal');
    startPlanLoadingUI(lastScenario);
    if (modal) setModalOpen('loading-modal', true);

    const client = collectClient();
    saveClient();
    readStateFromDom();
    ensureMortgageDebt();
    const numbers = C.buildCanonicalNumbers(lastScenario, client);
    // Precomputed alternate paths (same engine) so AI can recommend debt payoff vs rate-and-term safely
    const altPack = C.buildScenarioAlternatives({
      homeValue: state.homeValue,
      currentBalance: state.currentBalance,
      currentRate: state.currentRate,
      yearsRemaining: state.yearsRemaining,
      totalPayment: state.totalPayment,
      taxes: state.taxes,
      insurance: state.insurance,
      pmi: state.pmi,
      escrowIncluded: state.escrowIncluded,
      newLoanAmount: state.newLoanAmount,
      newRate: state.newRate,
      newTerm: state.newTerm,
      closingCosts: state.closingCosts,
      newPmi: state.newPmi,
      newPmiManual: state.newPmiManual,
      debts: state.debts
    });
    numbers.scenarioAlternatives = altPack.alternatives;
    numbers.comparisonHints = altPack.comparisonHints;
    const strategicBrief = buildStrategicBrief(numbers, lastScenario, client);
    numbers.strategicBrief = strategicBrief;
    window.clientCalcData = numbers;
    window.__canonicalNumbers = numbers;
    window.__strategicBrief = strategicBrief;

    const branding = state.branding;
    const isLo = MODE === 'lo';

    const systemRules =
      'You are a senior Refinance Strategist and client coach for Ruoff Mortgage.\n' +
      'Your job is NOT to restate the form. Your job is to ANALYZE the full situation, connect it to the client’s goals, ' +
      'and coach clear short-term and long-term recommendations — using only engine-provided figures.\n\n' +
      'NUMBER HARD RULES (non-negotiable):\n' +
      '- CANONICAL NUMBERS, STRATEGIC_BRIEF, DEBT INSIGHTS, and SCENARIO ALTERNATIVES are the only allowed sources for figures.\n' +
      '- Never invent or recalculate payments, interest, LTV, cash at closing, break-even, or debt totals.\n' +
      '- If a value is null/missing, say it is not available — do not invent.\n' +
      '- MONEY FORMATTING (required): every dollar amount in HTML MUST use a $ sign and thousands separators ' +
      '(e.g. $188,800, +$733/mo, $1,474). Never write bare amounts like 188800 or 733 for money. ' +
      'Rates use % (e.g. 5.875%). LTV uses % (e.g. 58%). Terms use years/months words, not $.\n' +
      '- Never use emojis. Return ONLY valid JSON (no markdown fences).\n\n' +
      'ANALYSIS HARD RULES (also non-negotiable):\n' +
      '- Lead with diagnosis of the client’s situation, not a dump of inputs.\n' +
      '- Explicitly weave CLIENT GOALS / notes from STRATEGIC_BRIEF.clientGoalsAndNotes through every major section.\n' +
      '  If goalsWereProvidedByUser is false, state reasonable assumptions and still give advice.\n' +
      '- Always separate SHORT-TERM benefits (next 1–12 months: cash flow, payment simplicity, cash at close) from ' +
      'LONG-TERM benefits (interest over time, debt freedom, equity/LTV, optional principal discipline).\n' +
      '- Use STRATEGIC_BRIEF.shortTermBenefits and longTermBenefits as a starting checklist — expand in natural coaching language; ' +
      'do not paste them robotically if you can improve clarity.\n' +
      '- Give a clear recommendation: keep PRIMARY, or seriously consider a named alternative when comparisonHints / metrics say it is stronger.\n' +
      '- Include trade-offs and risks (STRATEGIC_BRIEF.risksAndWatchouts) so advice is balanced.\n' +
      '- Include 2–4 discovery / coaching questions the LO can ask (you may adapt STRATEGIC_BRIEF.coachingQuestions).\n' +
      '- Sound like an expert advisor in a client meeting — specific, warm, decisive — not a spreadsheet reader.\n\n' +
      'HTML FORMATTING:\n' +
      '- Semantic HTML only: h2, h3, p, ul, ol, li, table, thead, tbody, tr, th, td, strong, em, blockquote.\n' +
      '- Start each top-level section with one h2.\n' +
      '- Short paragraphs (2–4 sentences). Prefer bullets for takeaways.\n' +
      '- Comparison MUST include an HTML table with header row (Metric | Current | Proposed).\n' +
      '- Required subsections in recommendedPlan use h3 titles exactly as specified below.\n' +
      '- No inline styles, class attributes, markdown, or code fences.\n\n' +
      'PRIMARY vs ALTERNATIVES:\n' +
      '- PRIMARY = id "primary" in scenarioAlternatives (matches top-level canonical numbers).\n' +
      '- Always narrate PRIMARY first, then compare at least one non-primary alternative when present.\n' +
      '- If an alternative wins on monthlyCashFlowChange and/or consumerDebtInterestAvoided (esp. high-APR payoff), ' +
      'say so and recommend discussing it — still using only that alternative’s figures.\n' +
      '- If PRIMARY is best, say why with metrics, and still note what rate-and-term-only would look like when present.\n\n' +
      'DEBT RULES:\n' +
      '- Cite interestRate / remainingMonths / interestAvoidedIfPaidOff when provided.\n' +
      '- Prioritize high_apr_priority debts in the story when present.\n' +
      '- If hasRateOrTermDetail is false, do not invent APR or term.';

    let outputSchema;
    let sectionInstructions;

    if (isLo) {
      outputSchema =
        '{ "executiveSummary": "HTML", "scenarioComparison": "HTML", "recommendedPlan": "HTML", "salesScripts": "HTML", "followUpSequence": "HTML" }';
      sectionInstructions =
        'executiveSummary (client-facing coaching brief):\n' +
        '- h2 title. Open with the client’s goal (or stated assumption).\n' +
        '- 1 short paragraph diagnosing the full situation (rate, term, debts, cash flow, cash at close).\n' +
        '- h3 "Short-term benefits" with 3–5 bullets.\n' +
        '- h3 "Long-term benefits" with 3–5 bullets.\n' +
        '- One clear “bottom line” sentence: stay with primary OR explore a named alternative.\n' +
        '- Mention LO by name/NMLS when provided. No number invention.\n\n' +
        'scenarioComparison:\n' +
        '- h2 + HTML table Current vs PRIMARY Proposed (housing, P&I, rate, term, LTV, equity as available).\n' +
        '- Optional second small table or bullet list comparing PRIMARY vs best alternative (cash flow, debts paid, interest avoided) using scenarioAlternatives only.\n' +
        '- 2–3 sentences interpreting what the table means for the client’s goals.\n\n' +
        'recommendedPlan:\n' +
        '- h2 Recommended plan.\n' +
        '- h3 "How this fits your goals" — map PRIMARY numbers to clientGoalsAndNotes.\n' +
        '- h3 "Primary path details" — loan amount/rate/term, debts marked payOff, cash flow, cash at close, break-even if meaningful.\n' +
        '- h3 "Short-term vs long-term" — two short subsections or two bullet groups.\n' +
        '- h3 "Alternative recommendation" — required when any non-primary alternative exists; pick a winner/loser with metrics.\n' +
        '- h3 "Risks and watch-outs" — honest trade-offs.\n' +
        '- h3 "Questions to ask in the meeting" — 2–4 coaching questions.\n' +
        '- h3 "Suggested next steps" — timeline through application / lock / appraisal (process, not invented numbers).\n\n' +
        'salesScripts: 5 scripts as <p><strong>Label:</strong> copy</p> — Opener, Goal check, Objection, Voicemail, Text. ' +
        'Each should reference a real metric and (when present) the client goal. At least one opens an alternative-path conversation when alts exist.\n\n' +
        'followUpSequence: ul with Day 1, 3, 7, 14, 30 — full copy, goal-aware, metric-specific.\n\n' +
        'LO Profile: ' +
        (branding.name || 'Loan Officer') +
        ', NMLS ' +
        (branding.nmls || '—') +
        ', ' +
        (branding.cell || '') +
        ', ' +
        (branding.email || '');
    } else {
      outputSchema = '{ "summary": "HTML", "scenarioComparison": "HTML", "recommendedPlan": "HTML" }';
      sectionInstructions =
        'summary: Warm borrower-facing analysis. Open with their goal/assumption. Include short-term and long-term benefit bullets. Soft CTA to contact LO.\n' +
        'scenarioComparison: HTML table Current vs Primary + brief interpretation tied to goals.\n' +
        'recommendedPlan: Clear recommendation; h3 "How this fits your goals"; h3 "Short-term vs long-term"; ' +
        'h3 "Another option to discuss" using scenarioAlternatives; respect years remaining (' +
        numbers.yearsRemaining +
        '). Do not invent numbers.';
    }

    const systemPrompt = systemRules + '\n\nOUTPUT JSON SHAPE:\n' + outputSchema;

    const userPrompt =
      'Write the Smart Plan JSON now.\n\n' +
      'SECTION RULES:\n' +
      sectionInstructions +
      '\n\n=== CLIENT GOALS (highest priority for narrative) ===\n' +
      JSON.stringify(
        {
          clientName: client.clientName,
          clientGoalsAndNotes: strategicBrief.clientGoalsAndNotes,
          goalsWereProvidedByUser: strategicBrief.goalsWereProvidedByUser
        },
        null,
        2
      ) +
      '\n\n=== STRATEGIC BRIEF (engine analysis hooks — expand into coaching prose) ===\n' +
      JSON.stringify(strategicBrief, null, 2) +
      '\n\n=== DEBT INSIGHTS (precomputed) ===\n' +
      JSON.stringify(numbers.debtInsights || {}, null, 2) +
      '\n\n=== SCENARIO ALTERNATIVES (precomputed — use for alternative recommendation) ===\n' +
      JSON.stringify(
        {
          alternatives: numbers.scenarioAlternatives,
          comparisonHints: numbers.comparisonHints
        },
        null,
        2
      ) +
      '\n\n=== CANONICAL NUMBERS — PRIMARY PATH (source of truth for all figures) ===\n' +
      JSON.stringify(numbers, null, 2);

    try {
      $('results-area').classList.remove('hidden');
      // Keep results area calm while the modal carries the progress UI
      $('tab-content').innerHTML =
        '<div class="text-center py-16 opacity-70">' +
        '<p class="text-sm font-semibold">Generating Smart Plan…</p>' +
        '<p class="text-xs mt-2 opacity-70">Analyzing goals, short-term and long-term trade-offs, and alternatives…</p></div>';

      const data = await callGrokAPI({
        model: 'grok-4-1-fast-reasoning',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.55,
        max_tokens: isLo ? 7000 : 5500
      });
      if (data.error) throw new Error(data.error.message || data.error || 'API error');

      let raw = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
      raw = raw.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      // Try to extract JSON object if model added prose
      const brace = raw.indexOf('{');
      const lastBrace = raw.lastIndexOf('}');
      if (brace >= 0 && lastBrace > brace) raw = raw.slice(brace, lastBrace + 1);

      const planData = JSON.parse(raw);

      if (isLo) {
        window.currentPlan = {
          tabs: [
            planData.executiveSummary || '<p>Error loading Executive Summary</p>',
            planData.scenarioComparison || '<p>Error loading Scenario Comparison</p>',
            planData.recommendedPlan || '<p>Error loading Recommended Plan</p>',
            planData.salesScripts || '<p>Error loading Sales Scripts</p>',
            planData.followUpSequence || '<p>Error loading Follow-Up Sequence</p>'
          ]
        };
      } else {
        window.currentPlan = {
          tabs: [
            planData.summary || '<p>Error loading Summary</p>',
            planData.scenarioComparison || '<p>Error loading Scenario Comparison</p>',
            planData.recommendedPlan || '<p>Error loading Recommended Plan</p>'
          ]
        };
      }

      setResultsClientName(client.clientName);
      showTab(0);
      $('results-area').classList.remove('hidden');
      setActiveNav('plan');
      stopPlanLoadingUI(true);
      // Brief beat so the full progress bar is visible before close
      await new Promise(function (r) { setTimeout(r, 280); });
      const resultsEl = $('results-area');
      if (resultsEl) {
        resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Second pass after layout (tabs paint)
        setTimeout(function () {
          resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 400);
      }
      toast('Smart Plan ready');
      celebrateGenerateSuccess();
    } catch (e) {
      console.error(e);
      // Offline / API-down fallback: deterministic plan from numbers
      window.currentPlan = { tabs: buildFallbackPlan(numbers, isLo) };
      setResultsClientName(numbers.clientName);
      showTab(0);
      $('results-area').classList.remove('hidden');
      setActiveNav('plan');
      stopPlanLoadingUI(true);
      await new Promise(function (r) { setTimeout(r, 200); });
      const resultsEl2 = $('results-area');
      if (resultsEl2) resultsEl2.scrollIntoView({ behavior: 'smooth', block: 'start' });
      toast('AI unavailable — showing calculated plan instead', 'warn');
      celebrateGenerateSuccess();
    } finally {
      generatingPlan = false;
      stopPlanLoadingUI(false);
      if (modal) setModalOpen('loading-modal', false);
      rootQueryAll('[data-generate-btn]').forEach(function (btn) {
        btn.disabled = false;
        btn.classList.remove('opacity-70', 'pointer-events-none');
      });
    }
  }

  function buildFallbackPlan(n, isLo) {
    const cashLabel = n.cashAtClosingLabel === 'cash_back' ? 'Estimated cash back' : 'Estimated cash to close';
    const consumerDebts = (n.debts || []).filter(function (d) {
      return d.payOff && d.name !== 'Current Mortgage' && !d.isMortgage;
    });
    const debtListHtml = consumerDebts.length
      ? '<ul>' + consumerDebts.map(function (d) {
          const bits = [money(d.balance) + ' balance', money(d.monthlyPayment) + '/mo'];
          if (d.interestRate > 0) bits.push(d.interestRate + '% APR');
          if (d.remainingMonths > 0) bits.push(d.remainingMonths + ' mo left');
          if (d.interestAvoidedIfPaidOff > 0) bits.push('~' + money(d.interestAvoidedIfPaidOff) + ' interest avoided');
          return '<li><strong>' + escapeHtml(d.name) + '</strong> — ' + bits.join(' · ') + '</li>';
        }).join('') + '</ul>'
      : '<p>No other consumer debts marked for payoff.</p>';

    const brief =
      n.strategicBrief ||
      buildStrategicBrief(n, lastScenario, {
        clientName: n.clientName,
        clientNotes: n.clientNotes
      });
    const goalsHtml = escapeHtml(brief.clientGoalsAndNotes || 'Not provided');
    const stHtml = (brief.shortTermBenefits || [])
      .map(function (b) {
        return '<li>' + escapeHtml(b) + '</li>';
      })
      .join('');
    const ltHtml = (brief.longTermBenefits || [])
      .map(function (b) {
        return '<li>' + escapeHtml(b) + '</li>';
      })
      .join('');
    const riskHtml = (brief.risksAndWatchouts || [])
      .map(function (b) {
        return '<li>' + escapeHtml(b) + '</li>';
      })
      .join('');
    const qHtml = (brief.coachingQuestions || [])
      .map(function (b) {
        return '<li>' + escapeHtml(b) + '</li>';
      })
      .join('');
    const diagHtml = (brief.situationDiagnosis || [])
      .map(function (b) {
        return '<li>' + escapeHtml(b) + '</li>';
      })
      .join('');

    const cf = n.monthlyCashFlowChange;
    const summary =
      '<h2>Situation analysis for ' + escapeHtml((n.clientName || 'you').split(' ')[0]) + '</h2>' +
      '<p><strong>Goals:</strong> ' + goalsHtml + '</p>' +
      '<p>Based on the calculator path (not a loan offer), here is a coaching snapshot of the full situation.</p>' +
      '<div class="plan-kpi-strip">' +
        '<div class="plan-kpi-chip"><span class="lbl">Cash flow</span><span class="val">' + (cf > 0 ? '+' : '') + money(cf) + '</span></div>' +
        '<div class="plan-kpi-chip"><span class="lbl">New housing</span><span class="val">' + money(n.newTotalHousing) + '</span></div>' +
        '<div class="plan-kpi-chip"><span class="lbl">' + cashLabel + '</span><span class="val">' + money(Math.abs(n.cashAtClosing)) + '</span></div>' +
        '<div class="plan-kpi-chip"><span class="lbl">Break-even</span><span class="val">' + (n.breakEvenMonths != null ? n.breakEvenMonths + ' mo' : 'N/A') + '</span></div>' +
      '</div>' +
      '<h3>What the numbers say</h3><ul>' + diagHtml + '</ul>' +
      '<h3>Short-term benefits</h3><ul>' + stHtml + '</ul>' +
      '<h3>Long-term benefits</h3><ul>' + ltHtml + '</ul>' +
      '<ul>' +
      '<li><strong>Debts paid off:</strong> ' + money(n.totalDebtsPaidOff) + '</li>' +
      (n.consumerDebtInterestAvoided > 0
        ? '<li><strong>Est. consumer interest avoided:</strong> ' + money(n.consumerDebtInterestAvoided) + '</li>'
        : '') +
      '<li><strong>Mortgage interest vs keep current:</strong> ' + money(n.mortgageInterestSavings) + '</li>' +
      '<li><strong>Closing costs (est.):</strong> ' + money(n.closingCosts) + '</li>' +
      '</ul>' +
      '<p><em>Estimates only — not a commitment to lend. AI narrative unavailable — this is the engine coaching brief.</em></p>';

    const table =
      '<h2>Scenario comparison</h2>' +
      '<table><thead><tr><th>Metric</th><th>Current</th><th>Proposed</th></tr></thead><tbody>' +
      '<tr><td>Loan / balance</td><td>' + money(n.currentBalance) + '</td><td>' + money(n.newLoanAmount) + '</td></tr>' +
      '<tr><td>Rate</td><td>' + n.currentRate + '%</td><td>' + n.newRate + '%</td></tr>' +
      '<tr><td>Term remaining / new</td><td>' + n.yearsRemaining + ' yrs</td><td>' + n.newTerm + ' yrs</td></tr>' +
      '<tr><td>P&amp;I</td><td>' + money(n.currentPi) + '</td><td>' + money(n.newPi) + '</td></tr>' +
      '<tr><td>Total housing (est.)</td><td>' + money(n.currentTotalHousing) + '</td><td>' + money(n.newTotalHousing) + '</td></tr>' +
      '<tr><td>LTV</td><td>' + n.currentLtv + '%</td><td>' + n.newLtv + '%</td></tr>' +
      '<tr><td>Equity</td><td>' + money(n.currentEquity) + '</td><td>' + money(n.newEquity) + '</td></tr>' +
      '</tbody></table>' +
      '<h3>Debts marked for payoff</h3>' + debtListHtml;

    let altHtml = '';
    const alts = n.scenarioAlternatives || [];
    if (alts.length > 1) {
      altHtml =
        '<h3>Alternative recommendation</h3>' +
        '<p>Same engine as the primary path — compare before choosing.</p><ul>' +
        alts.filter(function (a) { return a.id !== 'primary'; }).map(function (a) {
          return '<li><strong>' + escapeHtml(a.label) + '</strong>: loan ' + money(a.newLoanAmount) +
            ', cash-flow ' + money(a.monthlyCashFlowChange) +
            ', consumer interest avoided ' + money(a.consumerDebtInterestAvoided || 0) +
            (a.debtsPaidOffNames && a.debtsPaidOffNames.length
              ? ' · pays off ' + escapeHtml(a.debtsPaidOffNames.join(', '))
              : ' · mortgage only') +
            '</li>';
        }).join('') +
        '</ul>';
    }

    const plan =
      '<h2>Recommended plan</h2>' +
      '<h3>How this fits your goals</h3>' +
      '<p>' + goalsHtml + '</p>' +
      '<h3>Primary path details</h3>' +
      '<ul>' +
      '<li><strong>Proposed loan:</strong> ' + money(n.newLoanAmount) + ' at ' + n.newRate + '% for ' + n.newTerm + ' years</li>' +
      '<li><strong>Monthly cash-flow change:</strong> ' + money(n.monthlyCashFlowChange) + '</li>' +
      '<li><strong>' + cashLabel + ':</strong> ' + money(Math.abs(n.cashAtClosing)) + ' (includes ' + money(n.closingCosts) + ' est. closing costs)</li>' +
      (n.consumerDebtInterestAvoided > 0
        ? '<li><strong>Consumer debt interest avoided (est.):</strong> ' + money(n.consumerDebtInterestAvoided) + '</li>'
        : '<li>Add optional rate &amp; months on high-APR debts for stronger interest-avoided estimates</li>') +
      '<li>Review each debt marked for payoff with your loan officer</li>' +
      '</ul>' +
      '<h3>Short-term vs long-term</h3>' +
      '<p><strong>Short-term</strong></p><ul>' + stHtml + '</ul>' +
      '<p><strong>Long-term</strong></p><ul>' + ltHtml + '</ul>' +
      '<h3>Debts included</h3>' +
      debtListHtml +
      altHtml +
      '<h3>Risks and watch-outs</h3><ul>' + riskHtml + '</ul>' +
      '<h3>Questions to ask in the meeting</h3><ul>' + qHtml + '</ul>' +
      '<p>Next step: talk with your Ruoff loan officer to verify pricing, closing costs, and eligibility.</p>';

    if (!isLo) return [summary, table, plan];

    const scripts =
      '<h2>Sales scripts</h2>' +
      '<p><strong>Opener:</strong> I ran a smart savings scenario for you — it shows about ' +
      money(n.monthlyCashFlowChange) + ' in monthly cash-flow change and ' +
      money(Math.abs(n.cashAtClosing)) + ' ' + (n.cashAtClosingLabel === 'cash_back' ? 'cash back' : 'cash to close') +
      ' after estimated costs. Want to walk through it for 10 minutes?</p>' +
      '<p><strong>Value check:</strong> The calculator shows ' + money(n.totalDebtsPaidOff) +
      ' in debts paid off in this scenario. Shall we prioritize high-rate balances first?</p>' +
      '<p><strong>Close:</strong> If the numbers still look good after underwriting, we can lock pricing and order the appraisal. Are you free for a quick call tomorrow?</p>';

    const follow =
      '<h2>30-day follow-up</h2>' +
      '<ul>' +
      '<li><strong>Day 1:</strong> Send visual summary + executive summary with the ' + money(n.monthlyCashFlowChange) + ' cash-flow figure.</li>' +
      '<li><strong>Day 3:</strong> Short text: “Any questions on the refinance snapshot I sent?”</li>' +
      '<li><strong>Day 7:</strong> Voicemail + email with break-even of ' +
      (n.breakEvenMonths != null ? n.breakEvenMonths + ' months' : 'N/A') + '.</li>' +
      '<li><strong>Day 14:</strong> Value check-in; update rate if the market moved.</li>' +
      '<li><strong>Day 30:</strong> Final nudge with clear next step (application / appraisal).</li>' +
      '</ul>';

    return [summary, table, plan, scripts, follow];
  }

  /** Dollar amounts we know from the engine — used to polish bare numbers in AI HTML */
  function collectKnownMoneyAmounts() {
    const s = lastScenario || {};
    const n = window.__canonicalNumbers || window.clientCalcData || {};
    const raw = [
      s.monthlyCashFlowChange, s.newLoanAmount, s.currentBalance, s.homeValue,
      s.oldHousing, s.newHousing, s.oldPi, s.newPi, s.oldEscrow, s.newEscrow,
      s.cashAtClosing, s.otherDebtsPaidOff, s.totalDebtsPaidOff, s.otherDebtMonthly,
      s.closingCosts, s.equity, s.newEquity, s.consumerDebtInterestAvoided,
      s.taxes, s.insurance, s.pmi, s.newPmi,
      n.monthlyCashFlowChange, n.newLoanAmount, n.currentBalance, n.homeValue,
      n.oldTotalHousing, n.newTotalHousing, n.oldPi, n.newPi,
      n.cashAtClosing, n.otherDebtsPaidOff, n.totalDebtsPaidOff, n.otherDebtMonthly,
      n.closingCosts, n.equity, n.newEquity, n.consumerDebtInterestAvoided,
      n.mortgageInterestSavings, n.keepMortgageInterest, n.refiMortgageInterest
    ];
    if (s.mortgageInterest) {
      raw.push(s.mortgageInterest.keepInterest, s.mortgageInterest.refiInterest, s.mortgageInterest.savings);
    }
    if (Array.isArray(s.debts)) {
      s.debts.forEach(function (d) {
        if (!d) return;
        raw.push(d.bal, d.pay);
      });
    }
    if (Array.isArray(n.debts)) {
      n.debts.forEach(function (d) {
        if (!d) return;
        raw.push(d.balance, d.monthlyPayment, d.bal, d.pay);
      });
    }
    const set = {};
    raw.forEach(function (v) {
      const num = Number(v);
      if (!isFinite(num)) return;
      const abs = Math.abs(Math.round(num));
      if (abs >= 1) set[abs] = true;
      // also store unrounded for 733.5 etc.
      const abs2 = Math.abs(Math.round(num * 100) / 100);
      if (abs2 >= 1) set[String(abs2)] = true;
    });
    // Prefer longer/larger matches first when replacing as strings
    return Object.keys(set)
      .map(function (k) { return Number(k); })
      .filter(function (n) { return isFinite(n) && n >= 1; })
      .sort(function (a, b) { return b - a; });
  }

  function formatPlanMoneyValue(num, signed) {
    const n = Number(num);
    if (!isFinite(n)) return String(num);
    if (n < 0) return '−' + money(Math.abs(n));
    if (signed && n > 0) return '+' + money(n);
    return money(n);
  }

  /**
   * Rewrite a single table cell based on the metric label in column 0.
   */
  function polishPlanTableCell(cell, metricLabel) {
    if (!cell) return;
    let t = (cell.textContent || '').trim();
    if (!t || t === '—' || t === '-' || t === 'N/A' || t === 'NA') return;
    // Already has currency
    if (/\$/.test(t)) {
      // still normalize bare "188800" style if mixed — leave mostly alone
      return;
    }
    const label = String(metricLabel || '');
    const isRate = /rate|apr/i.test(label) && !/interest\s*rate\s*sav/i.test(label);
    const isLtv = /\bltv\b/i.test(label);
    const isTerm = /term|years?\s*remain|months?\s*remain|break.?even/i.test(label);
    const isMoney = /loan|balance|amount|payment|p\s*&\s*i|p&i|housing|equity|cash|debt|cost|closing|interest|saving|payoff|principal|income|escrow|pmi|tax/i.test(label);

    if (isRate || isLtv) {
      const num = parseNum(t.replace(/%/g, ''));
      if (!isFinite(num) || num <= 0) return;
      // Keep existing "years" words; only polish pure numbers
      if (/year|mo|month|%|remain/i.test(t) && !/^\d+(\.\d+)?%?$/.test(t)) return;
      cell.textContent = (Math.round(num * 1000) / 1000) + '%';
      return;
    }
    if (isTerm) {
      // leave "10 years", "28.3 years remaining", "5 mo"
      return;
    }
    if (isMoney || (!isRate && !isLtv && !isTerm && /^[\d,]+(\.\d+)?$/.test(t))) {
      // Pure numeric money-looking cell
      if (!/^[\+\-−]?\s*[\d,]+(\.\d+)?$/.test(t)) {
        // Mixed text — handled by prose pass
        return;
      }
      const signed = /^[\+\-−]/.test(t);
      const num = parseNum(t);
      if (!isFinite(num)) return;
      if (Math.abs(num) < 0.005) {
        cell.textContent = '$0';
        return;
      }
      cell.textContent = formatPlanMoneyValue(num, signed || num < 0);
      cell.classList.add('number');
    }
  }

  function polishPlanProseText(text, knownAmounts) {
    if (!text || text.indexOf('$') === 0 && text.indexOf('$') === text.lastIndexOf('$') && !/\d{4,}/.test(text.replace(/\$/g, ''))) {
      // still may have bare numbers later
    }
    let out = String(text);
    // Skip if no digits
    if (!/\d/.test(out)) return out;

    // 1) Replace known engine amounts (largest first) when not already $-prefixed
    (knownAmounts || []).forEach(function (amt) {
      const abs = Math.abs(Number(amt));
      if (!isFinite(abs) || abs < 1) return;
      const variants = [];
      // 188800 and 188,800
      variants.push(String(Math.round(abs)));
      if (abs >= 1000) {
        variants.push(Math.round(abs).toLocaleString('en-US'));
      }
      // one decimal for payments like 1474.5 rare
      const oneDec = Math.round(abs * 10) / 10;
      if (oneDec !== Math.round(abs)) variants.push(String(oneDec));

      variants.forEach(function (v) {
        if (!v) return;
        const escaped = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Not already preceded by $ ; not followed by % or year/mo unit glued
        const re = new RegExp(
          '(^|[^$\\d])([+\\-−]?)' + escaped + '(?!\\d|\\s*%|\\s*years?\\b|\\s*yrs?\\b|\\s*months?\\b|\\s*mo\\b)',
          'g'
        );
        out = out.replace(re, function (match, pre, sign) {
          const signed = sign === '+' || sign === '-' || sign === '−';
          const n = (sign === '-' || sign === '−' ? -1 : 1) * abs;
          const formatted = formatPlanMoneyValue(n, signed || sign === '+');
          return pre + formatted;
        });
      });
    });

    // 2) Generic large bare integers (4+ digits) still without $
    out = out.replace(
      /(^|[^$\d])([+\-−]?)(\d{4,})(?!\d|\s*%|\s*years?\b|\s*yrs?\b|\s*months?\b|\s*mo\b)/g,
      function (match, pre, sign, digits) {
        const n = parseInt(digits, 10);
        if (!isFinite(n) || n < 1000) return match;
        // Avoid years like 2026
        if (n >= 1900 && n <= 2100) return match;
        const signed = sign === '+' || sign === '-' || sign === '−';
        const val = (sign === '-' || sign === '−' ? -1 : 1) * n;
        return pre + formatPlanMoneyValue(val, signed || sign === '+');
      }
    );

    // 3) 3-digit money in cash-flow context: "delivers 733 monthly", "by 963", "pays off 57116" already caught
    out = out.replace(
      /\b(cash\s*flow|payment|saves?|saving|delivers?|improvement|reduces?|costs?|debts?|balance|housing|equity|loan|closing|interest|pay\s*off|pays\s*off|back|due|of|by)\s+([+\-−]?)(\d{2,3})(?!\d|\s*%|\s*years?\b|\s*yrs?\b|\.\d)/gi,
      function (match, word, sign, digits) {
        const n = parseInt(digits, 10);
        if (!isFinite(n) || n < 25) return match;
        const signed = sign === '+' || sign === '-' || sign === '−';
        const val = (sign === '-' || sign === '−' ? -1 : 1) * n;
        return word + ' ' + formatPlanMoneyValue(val, signed || sign === '+');
      }
    );

    return out;
  }

  function polishPlanCurrencyInHost(host) {
    if (!host) return;
    const known = collectKnownMoneyAmounts();

    // Tables first — use metric labels
    host.querySelectorAll('table tr').forEach(function (tr) {
      const cells = tr.querySelectorAll('th, td');
      if (cells.length < 2) return;
      const label = (cells[0].textContent || '').trim();
      for (let i = 1; i < cells.length; i++) {
        polishPlanTableCell(cells[i], label);
      }
    });

    // Text nodes in prose (skip tables already handled — still polish mixed prose)
    const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) {
      if (!node.parentElement) continue;
      const tag = node.parentElement.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE') continue;
      // Skip pure table numeric cells we already polished (optional — re-run is ok if $ present)
      if (!node.nodeValue || !/\d/.test(node.nodeValue)) continue;
      nodes.push(node);
    }
    nodes.forEach(function (tn) {
      const next = polishPlanProseText(tn.nodeValue, known);
      if (next !== tn.nodeValue) tn.nodeValue = next;
    });
  }

  /**
   * Enhance AI/fallback HTML for scannable Smart Plan tabs.
   */
  function formatPlanHtml(raw, tabIndex) {
    if (!raw || !String(raw).trim()) {
      return '<div class="plan-doc plan-doc-tab-' + tabIndex + '"><p class="plan-empty">Content not loaded.</p></div>';
    }
    const host = document.createElement('div');
    host.innerHTML = String(raw).trim();

    // Tables → scroll wrap + class
    host.querySelectorAll('table').forEach(function (table) {
      table.classList.add('plan-table');
      if (!table.parentElement || !table.parentElement.classList.contains('plan-table-wrap')) {
        const wrap = document.createElement('div');
        wrap.className = 'plan-table-wrap';
        table.parentNode.insertBefore(wrap, table);
        wrap.appendChild(table);
      }
    });

    // Currency polish — $ and commas on money; leave rates/LTV/terms alone
    polishPlanCurrencyInHost(host);

    // Day N list items → timeline chips
    host.querySelectorAll('li').forEach(function (li) {
      const strong = li.querySelector('strong, b');
      const head = ((strong && strong.textContent) || li.textContent || '').trim();
      if (/^day\s*\d+/i.test(head) || /^day\s*\d+\s*\/\s*\d+/i.test(head)) {
        li.classList.add('plan-day-item');
      }
    });

    // Script-style paragraphs
    host.querySelectorAll('p').forEach(function (p) {
      const strong = p.querySelector(':scope > strong, :scope > b');
      const label = ((strong && strong.textContent) || '').trim();
      const full = (p.textContent || '').trim();
      if (
        /^(opener|script|email|text|voicemail|call|close|objection|value check|follow.?up)/i.test(label) ||
        /^(opener|script\s*\d*|email|text|voicemail)\s*:/i.test(full)
      ) {
        p.classList.add('plan-script-card');
      }
    });

    // Wrap "Alternative recommendation" blocks in a callout
    const headings = host.querySelectorAll('h2, h3');
    headings.forEach(function (h) {
      if (!/alternative/i.test(h.textContent || '')) return;
      if (h.closest('.plan-callout')) return;
      const box = document.createElement('div');
      box.className = 'plan-callout';
      h.parentNode.insertBefore(box, h);
      box.appendChild(h);
      let next = box.nextSibling;
      while (next) {
        if (next.nodeType === 1 && /^H[12]$/i.test(next.tagName) && !/alternative/i.test(next.textContent || '')) break;
        const move = next;
        next = next.nextSibling;
        if (move.nodeType === 1 || (move.nodeType === 3 && String(move.textContent).trim())) {
          box.appendChild(move);
        } else if (move.nodeType === 3) {
          box.appendChild(move);
        }
      }
    });

    return '<div class="plan-doc plan-doc-tab-' + tabIndex + '">' + host.innerHTML + '</div>';
  }

  function showTab(n) {
    const tabs = rootQueryAll('#results-area .tab-btn, .results-tabs .tab-btn');
    tabs.forEach(function (btn, i) {
      const idx = btn.hasAttribute('data-tab')
        ? parseInt(btn.getAttribute('data-tab'), 10)
        : i;
      const on = idx === n;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    const contentArea = $('tab-content');
    if (!contentArea) return;
    if (!window.currentPlan) {
      contentArea.innerHTML = '<div class="plan-doc"><p class="plan-empty">Generate a plan first</p></div>';
      return;
    }
    contentArea.innerHTML = formatPlanHtml(window.currentPlan.tabs[n], n);
    const activeBtn = rootQuery('#results-area .tab-btn.active');
    if (activeBtn && activeBtn.scrollIntoView) {
      try {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      } catch (e) { /* ignore */ }
    }
  }

  function downloadAsWordDoc() {
    if (!window.currentPlan || !window.currentPlan.tabs || !window.currentPlan.tabs.length) {
      toast('Generate a plan first', 'warn');
      return;
    }
    const name = (($('client-name') && $('client-name').value) || 'Client').trim() || 'Client';
    const tabTitles = MODE === 'lo'
      ? ['Executive Summary', 'Scenario Comparison', 'Recommended Plan', 'Sales Scripts', 'Follow-Up']
      : ['Summary', 'Comparison', 'Recommended Plan'];
    // Full plan (all tabs) so Word isn't empty when viewing a thin tab
    let body = '<h1>Ruoff Smart Plan — ' + escapeHtml(name) + '</h1>' +
      '<p><em>Estimates only. Not a commitment to lend. Generated ' +
      new Date().toLocaleDateString() + '.</em></p>';
    window.currentPlan.tabs.forEach(function (html, i) {
      if (!html) return;
      // Re-use display polish (currency $ formatting + structure) for Word export
      body += '<h2>' + escapeHtml(tabTitles[i] || ('Section ' + (i + 1))) + '</h2>' +
        formatPlanHtml(html, i) + '<hr>';
    });
    const docHtml =
      '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
      'xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
      '<head><meta charset="UTF-8"><title>Ruoff Smart Plan</title>' +
      '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->' +
      '<style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#111}' +
      'h1{font-size:18pt;color:#002B5C}h2{font-size:14pt;color:#00A89D;margin-top:18pt}' +
      'table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:6px;text-align:left}' +
      'hr{border:none;border-top:1px solid #ddd;margin:18pt 0}</style></head><body>' +
      body + '</body></html>';

    try {
      const blob = new Blob(['\ufeff', docHtml], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Ruoff_Smart_Plan_' + name.replace(/[^\w\-]+/g, '_').replace(/_+/g, '_') + '.doc';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(function () {
        URL.revokeObjectURL(url);
        if (link.parentNode) link.parentNode.removeChild(link);
      }, 400);
      toast('Word document downloaded — open in Word or Google Docs');
    } catch (err) {
      console.error(err);
      toast('Could not download Word file — try Copy instead', 'error');
    }
  }

  function copyFormattedPlan() {
    const element = $('tab-content');
    if (!element || !window.currentPlan) {
      toast('Generate a plan first');
      return;
    }
    const htmlContent = element.innerHTML;
    const plainText = element.innerText;
    try {
      const item = new ClipboardItem({
        'text/html': new Blob([htmlContent], { type: 'text/html' }),
        'text/plain': new Blob([plainText], { type: 'text/plain' })
      });
      navigator.clipboard.write([item]).then(() => toast('Formatted plan copied — paste into Word or email.'));
    } catch (err) {
      navigator.clipboard.writeText(plainText).then(() => toast('Copied as plain text.'));
    }
  }

  // ─── Visual summary (LO) ─────────────────────────────────
  function showVisualSummary() {
    if (!window.clientCalcData && lastScenario) {
      window.clientCalcData = C.buildCanonicalNumbers(lastScenario, collectClient());
    }
    if (!window.clientCalcData) {
      toast('Update the calculator or generate a plan first');
      return;
    }
    const d = window.clientCalcData;
    const s = lastScenario || C.computeScenario(state);

    let debtsHTML = '';
    (state.debts || []).filter(x => x.payOff).forEach(debt => {
      debtsHTML +=
        '<div class="flex justify-between items-center glass p-4 rounded-xl mb-2">' +
        '<div class="font-medium">' + escapeHtml(debt.name) + '</div>' +
        '<div class="text-right"><div class="font-bold number">' + money(debt.bal) + '</div>' +
        '<div class="text-xs opacity-60">' + money(debt.pay) + ' monthly</div></div></div>';
    });

    const cashLabel = s.isCashBack ? 'Est. cash back' : 'Est. cash to close';

    $('tab-content').innerHTML =
      '<div class="max-w-4xl mx-auto animate-fadeIn" id="visual-summary-root">' +
      '<div class="text-center mb-8">' +
      '<h1 class="text-3xl md:text-4xl font-black text-[var(--ruoff-teal)]">Smart Savings Summary</h1>' +
      '<p class="text-xl mt-2 opacity-75">for ' + escapeHtml(d.clientName || 'Client') + '</p></div>' +

      '<div class="glass rounded-2xl p-6 mb-4 text-center">' +
      '<div class="text-sm opacity-70">Home value</div>' +
      '<div class="text-4xl font-black number">' + money(s.homeValue) + '</div>' +
      '<div class="grid grid-cols-2 gap-6 mt-6">' +
      '<div><div class="text-sm opacity-70">Current equity</div><div class="text-2xl font-bold pos number">' + money(s.equity) + '</div></div>' +
      '<div><div class="text-sm opacity-70">Current LTV</div><div class="text-2xl font-bold number">' + s.ltv + '%</div></div>' +
      '</div></div>' +

      '<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">' +
      '<div class="glass rounded-2xl p-6"><h3 class="font-bold mb-3">Before</h3>' +
      '<div class="space-y-2 text-sm">' +
      '<div class="flex justify-between"><span>Balance</span><span class="font-bold number">' + money(s.currentBalance) + '</span></div>' +
      '<div class="flex justify-between"><span>Total housing</span><span class="font-bold number">' + money(s.oldHousing) + '</span></div>' +
      '<div class="flex justify-between"><span>P&I</span><span class="number">' + money(s.oldPi) + '</span></div>' +
      '</div></div>' +
      '<div class="glass rounded-2xl p-6 border-2 border-[var(--ruoff-teal)]/30"><h3 class="font-bold mb-3">After (proposed)</h3>' +
      '<div class="space-y-2 text-sm">' +
      '<div class="flex justify-between"><span>New loan</span><span class="font-bold number">' + money(s.newLoanAmount) + '</span></div>' +
      '<div class="flex justify-between"><span>Total housing</span><span class="font-bold pos number">' + money(s.newHousing) + '</span></div>' +
      '<div class="flex justify-between"><span>P&I</span><span class="number">' + money(s.newPi) + '</span></div>' +
      '<div class="flex justify-between"><span>Rate / term</span><span>' + s.newRate + '% · ' + s.newTerm + ' yr</span></div>' +
      '</div></div></div>' +

      '<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">' +
      '<div class="glass rounded-2xl p-5 text-center"><div class="text-xs opacity-70">Monthly cash-flow change</div>' +
      '<div class="text-3xl font-black number ' + (s.monthlyCashFlowChange >= 0 ? 'pos' : 'neg') + '">' +
      (s.monthlyCashFlowChange >= 0 ? '+' : '') + money(s.monthlyCashFlowChange) + '</div></div>' +
      '<div class="glass rounded-2xl p-5 text-center"><div class="text-xs opacity-70">Debts paid off</div>' +
      '<div class="text-3xl font-black number">' + money(s.totalDebtsPaidOff) + '</div></div>' +
      '<div class="glass rounded-2xl p-5 text-center"><div class="text-xs opacity-70">' + cashLabel + '</div>' +
      '<div class="text-3xl font-black number" style="color:#F15A29">' + money(Math.abs(s.cashAtClosing)) + '</div></div>' +
      '</div>' +

      '<div class="glass rounded-2xl p-6 mb-4"><h3 class="font-bold mb-3">Debts included</h3>' + (debtsHTML || '<p class="opacity-60">Mortgage only</p>') + '</div>' +

      '<div class="glass rounded-2xl p-6 mb-4 text-sm">' +
      '<div class="flex justify-between"><span>Break-even</span><span class="font-bold">' +
      (s.breakEvenMonths != null ? s.breakEvenMonths + ' months' : 'N/A') + '</span></div>' +
      '<div class="flex justify-between mt-2"><span>Interest vs keep current loan</span><span class="font-bold number">' +
      money(s.mortgageInterest.savings) + '</span></div>' +
      '<div class="flex justify-between mt-2"><span>New LTV / equity</span><span class="font-bold">' +
      s.newLtv + '% · ' + money(s.newEquity) + '</span></div>' +
      '</div>' +

      '<p class="text-xs opacity-60 text-center mb-6">Estimates only. Not a commitment to lend. Closing costs and pricing subject to change.</p>' +
      '<div class="text-center no-print">' +
      '<button type="button" class="px-8 py-4 bg-gradient-to-r from-[var(--ruoff-teal)] to-[var(--ruoff-orange)] text-white rounded-2xl font-bold" onclick="RuoffApp.copyVisualAsHTML()">Copy summary</button> ' +
      '<button type="button" class="px-6 py-4 opacity-80 hover:underline" onclick="RuoffApp.showTab(0)">← Back to plan tabs</button>' +
      '</div></div>';

    // Mark results visible
    $('results-area').classList.remove('hidden');
  }

  function copyVisualAsHTML() {
    const root = $('visual-summary-root') || $('tab-content');
    if (!root) return;
    const html = root.innerHTML;
    try {
      const item = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([root.innerText], { type: 'text/plain' })
      });
      navigator.clipboard.write([item]).then(() => toast('Visual summary copied.'));
    } catch (e) {
      navigator.clipboard.writeText(root.innerText);
      toast('Copied as plain text.');
    }
  }

  // ─── Email / contact ─────────────────────────────────────
  async function draftInitialEmail() {
    if (!lastScenario) liveUpdate();
    const numbers = window.clientCalcData || C.buildCanonicalNumbers(lastScenario, collectClient());
    const emailModal = $('email-loading-modal');
    if (emailModal) setModalOpen('email-loading-modal', true);

    const branding = state.branding;
    const firstName = (numbers.clientName || 'there').split(' ')[0];
    const cf = numbers.monthlyCashFlowChange;
    const cash = Math.abs(numbers.cashAtClosing);
    const cashPhrase = numbers.cashAtClosingLabel === 'cash_back' ? 'cash back' : 'cash to close';

    try {
      const prompt =
        'Write a short, warm, non-salesy first outreach email (200-280 words) from ' +
        (branding.name || 'a Ruoff loan officer') + ' (NMLS ' + (branding.nmls || '') + ') to ' + firstName + '.\n' +
        'Use ONLY these figures — do not invent others:\n' +
        '- Monthly cash-flow change: ' + money(cf) + '\n' +
        '- ' + cashPhrase + ': ' + money(cash) + '\n' +
        '- Debts paid off: ' + money(numbers.totalDebtsPaidOff) + '\n' +
        '- New payment housing est: ' + money(numbers.newTotalHousing) + '\n' +
        '- Break-even: ' + (numbers.breakEvenMonths != null ? numbers.breakEvenMonths + ' months' : 'N/A') + '\n' +
        '- Notes: ' + (numbers.clientNotes || 'None') + '\n' +
        'Lead with monthly cash-flow change. No hype or false urgency. Soft CTA.\n' +
        'Return ONLY:\nSubject: ...\nBody: ...';

      let subject = 'Your refinance snapshot – ' + money(cf) + ' monthly cash-flow change';
      let body =
        'Hi ' + firstName + ',\n\nI put together a refinance scenario for you. It shows about ' +
        money(cf) + ' in monthly cash-flow change and ' + money(cash) + ' ' + cashPhrase +
        ' after estimated closing costs.\n\nHappy to walk through the details on a quick call.\n\nBest,\n' +
        (branding.name || 'Your Loan Officer') + '\n' + (branding.cell || '') +
        (branding.nmls ? '\nNMLS ' + branding.nmls : '');

      try {
        const data = await callGrokAPI({
          model: 'grok-4-1-fast-reasoning',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.6,
          max_tokens: 1200
        });
        const emailText = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
        const subjectMatch = emailText.match(/Subject:\s*(.+)/i);
        if (subjectMatch) subject = subjectMatch[1].trim();
        const bodyPart = emailText.replace(/Subject:?.+\n/i, '').replace(/^Body:\s*/i, '').trim();
        if (bodyPart) body = bodyPart;
      } catch (apiErr) {
        console.warn('Email AI draft unavailable, using template:', apiErr);
      }

      window.location.href =
        'mailto:' + encodeURIComponent(numbers.clientEmail || '') +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);
    } catch (e) {
      console.error(e);
      const subject = 'Your refinance snapshot';
      const body =
        'Hi ' + firstName + ',\n\nI ran a refinance scenario showing about ' + money(cf) +
        ' monthly cash-flow change. Happy to review together.\n\n' +
        (branding.name || '') + '\n' + (branding.cell || '');
      window.location.href =
        'mailto:' + encodeURIComponent(numbers.clientEmail || '') +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);
    } finally {
      if (emailModal) setModalOpen('email-loading-modal', false);
    }
  }

  function buildBorrowerSnapshotBody(client, s, loName) {
    const cf = s.monthlyCashFlowChange;
    const debts = (state.debts || []).filter(function (d) {
      return d.payOff && d.name !== 'Current Mortgage';
    });
    const debtLines = debts.length
      ? debts.map(function (d) {
          return '  · ' + d.name + ': ' + money(d.bal) + ' balance · ' + money(d.pay) + '/mo';
        }).join('\n')
      : '  · Mortgage only (no extra debts selected)';
    const interestLine = s.mortgageInterest
      ? (s.mortgageInterest.savings >= 0
          ? money(s.mortgageInterest.savings) + ' less interest vs keep current (est.)'
          : money(Math.abs(s.mortgageInterest.savings)) + ' more interest vs keep current (est.)')
      : 'N/A';

    return (
      'Hi ' + loName + ',\n\n' +
      'I used the Ruoff Smart Savings Calculator and would like to talk through this scenario.\n\n' +
      '── My contact ──\n' +
      'Name: ' + (client.clientName || '') + '\n' +
      'Phone: ' + (client.clientPhone || '(not provided)') + '\n' +
      'Email: ' + (client.clientEmail || '(not provided)') + '\n\n' +
      '── Snapshot (estimates only — not a loan offer) ──\n' +
      'Today housing: ' + money(s.oldHousing) + ' (P&I ' + money(s.oldPi) + ')\n' +
      'Proposed housing: ' + money(s.newHousing) + ' (P&I ' + money(s.newPi) + ')\n' +
      'Cash-flow change: ' + (cf > 0 ? '+' : '') + money(cf) + ' / month\n' +
      (s.cashAtClosing === 0
        ? 'At closing: even\n'
        : (s.isCashBack ? 'Est. cash back: ' : 'Est. cash to close: ') + money(Math.abs(s.cashAtClosing)) + '\n') +
      'Break-even: ' + (s.breakEvenMonths != null ? s.breakEvenMonths + ' months' : 'N/A') + '\n' +
      'Home value: ' + money(s.homeValue) + ' · Equity: ' + money(s.equity) + ' · LTV: ' + s.ltv + '%\n' +
      'Proposed loan: ' + money(s.newLoanAmount) + ' @ ' + s.newRate + '% / ' + s.newTerm + ' years\n' +
      'New LTV: ' + s.newLtv + '% · Closing costs (est.): ' + money(s.closingCosts) + '\n' +
      'Interest: ' + interestLine + '\n' +
      'Debts included in payoff:\n' + debtLines + '\n\n' +
      'Goals / notes:\n' + (client.clientNotes || 'None entered') + '\n\n' +
      'Thank you!\n' + (client.clientName || '')
    );
  }

  function contactMyLO() {
    const client = collectClient();
    saveClient();
    if (!lastScenario) liveUpdate();
    const s = lastScenario;
    const loEmail = (state.loContact && state.loContact.email) || '';
    const loName = (state.loContact && state.loContact.name) || 'there';

    const subject = 'Refinance snapshot – ' + (client.clientName || 'borrower') +
      ' · ' + (s.monthlyCashFlowChange > 0 ? '+' : '') + money(s.monthlyCashFlowChange) + ' cash flow';
    const body = buildBorrowerSnapshotBody(client, s, loName);

    if (!loEmail) {
      toast('Tip: ask your LO for a personal link so their email is pre-filled. Opening your mail app…');
    } else {
      toast('Opening email to ' + (state.loContact.name || 'your loan officer') + '…');
    }
    window.location.href =
      'mailto:' + encodeURIComponent(loEmail) +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);
  }

  /** Alias used by borrower CTAs */
  function sendToMyLO() {
    contactMyLO();
  }

  function copyBorrowerLink() {
    // Pull latest branding fields even if not re-saved
    if ($('branding-name')) {
      state.branding.name = $('branding-name').value.trim() || state.branding.name;
      state.branding.nmls = $('branding-nmls') ? $('branding-nmls').value.trim() : state.branding.nmls;
      state.branding.email = $('branding-email') ? $('branding-email').value.trim() : state.branding.email;
      state.branding.cell = $('branding-cell') ? $('branding-cell').value.trim() : state.branding.cell;
      state.branding.color = $('branding-color') ? $('branding-color').value : state.branding.color;
      state.branding.accent = $('branding-accent') ? $('branding-accent').value : state.branding.accent;
      state.branding.photo = $('branding-photo') ? $('branding-photo').value.trim() : state.branding.photo;
    }
    if (!state.branding.email && !state.branding.name) {
      toast('Save your branding first so the link includes your contact info', 'warn');
    }
    let base = window.location.origin + '/borrower.html';
    if (/index\.html$/i.test(window.location.pathname)) {
      base = window.location.origin + window.location.pathname.replace(/index\.html$/i, 'borrower.html');
    } else if (window.location.pathname && window.location.pathname !== '/') {
      const dir = window.location.pathname.replace(/\/[^/]*$/, '/');
      base = window.location.origin + dir + 'borrower.html';
    }
    const params = new URLSearchParams();
    if (state.branding.name) params.set('loName', state.branding.name);
    if (state.branding.email) params.set('loEmail', state.branding.email);
    if (state.branding.cell) params.set('loPhone', state.branding.cell);
    if (state.branding.nmls) params.set('loNmls', state.branding.nmls);
    if (state.branding.color) params.set('loColor', state.branding.color);
    if (state.branding.accent) params.set('loAccent', state.branding.accent);
    if (state.branding.photo) params.set('loPhoto', state.branding.photo);
    const url = base + (params.toString() ? '?' + params.toString() : '');
    navigator.clipboard.writeText(url).then(function () {
      toast('Branded borrower link copied');
    }).catch(function () {
      prompt('Copy this borrower link:', url);
    });
  }

  // ─── Theme ───────────────────────────────────────────────
  function initTheme() {
    const toggle = $('theme-toggle');
    const embedRoot = ROOT();
    // When embedded in LO coach: follow coach theme only (hide in-tool Light/Dark).
    if (embedRoot) {
      const themeCtl = $('ss-theme-controls') || rootQuery('#ss-theme-controls');
      if (themeCtl) {
        themeCtl.classList.add('hidden');
        themeCtl.setAttribute('hidden', '');
        themeCtl.style.setProperty('display', 'none', 'important');
      }
      const syncFromCoach = () => {
        const coachDark = document.documentElement.classList.contains('dark');
        embedRoot.classList.toggle('dark', coachDark);
        // Keep portal/modal hosts in sync too
        try {
          const scroll = document.getElementById('ss-guided-scroll');
          if (scroll) scroll.classList.toggle('dark', coachDark);
          const modalHost = document.getElementById('ss-modal-host');
          if (modalHost) modalHost.classList.toggle('dark', coachDark);
        } catch (e) { /* ignore */ }
      };
      syncFromCoach();
      if (!embedRoot.__ssThemeObserver) {
        embedRoot.__ssThemeObserver = true;
        try {
          const obs = new MutationObserver(syncFromCoach);
          obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        } catch (e) { /* ignore */ }
      }
      return;
    }
    // Standalone /smart-savings/app.html keeps its own toggle
    const saved = localStorage.getItem(THEME_KEY);
    const dark = saved ? saved === 'dark' : true;
    document.documentElement.classList.toggle('dark', dark);
    if (toggle) {
      toggle.checked = dark;
      toggle.addEventListener('change', () => {
        document.documentElement.classList.toggle('dark', toggle.checked);
        localStorage.setItem(THEME_KEY, toggle.checked ? 'dark' : 'light');
      });
    }
  }

  // ─── Hydrate DOM ─────────────────────────────────────────
  function hydrateDomFromState() {
    if ($('home-value')) $('home-value').value = Number(state.homeValue).toLocaleString();
    if ($('home-slider')) $('home-slider').value = state.homeValue;
    if ($('new-loan-amt')) $('new-loan-amt').value = state.newLoanAmount;
    if ($('new-loan-slider')) $('new-loan-slider').value = state.newLoanAmount;
    if ($('new-rate')) $('new-rate').value = state.newRate;
    if ($('new-rate-slider')) $('new-rate-slider').value = state.newRate;
    if ($('new-term')) $('new-term').value = String(state.newTerm);
    if ($('closing-costs')) $('closing-costs').value = state.closingCosts;
    paintClosingCostsSlider(state.closingCosts);
    if ($('project-cash')) $('project-cash').value = state.projectCash || 30000;
    if ($('new-pmi-manual')) $('new-pmi-manual').checked = !!state.newPmiManual;
    if ($('new-pmi')) {
      $('new-pmi').value = state.newPmi != null ? state.newPmi : 0;
      $('new-pmi').disabled = !state.newPmiManual;
    }
  }

  // ─── Init ────────────────────────────────────────────────
  function init(force) {
    // When embedded, wait for root + injected calculator markup
    const embed = !!document.getElementById('smart-savings-root') || !!window.SMART_SAVINGS_EMBED;
    if (embed && !ROOT()) {
      console.warn('[Ruoff] smart-savings-root not in DOM yet');
      return false;
    }
    // Soft re-entry: keep an open guided modal; do not destroy/restore
    if (__ssInited && !force) {
      forceCloseAllCalcModals();
      if (!calculatorBodyAlive()) {
        console.warn('[Ruoff] calculator body missing on re-entry');
        return false;
      }
      if (experienceMode === 'guided' && isEmbed() && !isGuidedPortalOpen()) {
        openGuidedPortal();
        goToWizardStep(wizardStep, { silent: true });
      }
      return true;
    }

    // Full init / force: restore any stranded shell, then rebuild
    destroyLegacyGuidedPortal();
    if (embed && !calculatorBodyAlive()) {
      // Body not injected yet — host will retry after inject
      console.warn('[Ruoff] calculator body not injected yet');
      return false;
    }
    __ssInited = true;

    // CRITICAL: hide loaders before any other work (hidden+flex Tailwind conflict)
    forceCloseAllCalcModals();

    initTheme();
    loadFromStorage();
    loadClient();
    if (MODE === 'lo') loadBranding();
    parseLoFromUrl();
    ensureMortgageDebt();
    hydrateDomFromState();
    liveUpdate();
    forceCloseAllCalcModals(); // again after hydrate in case something re-opened
    console.info('[Ruoff] Grok proxy:', getGrokEndpoint(), '(LO coach /api/v1/chat/completions)');

    if (!__ssListenersBound) {
      __ssListenersBound = true;
      // Accordion maxHeight fix on resize
      window.addEventListener('resize', () => {
        ['client-info-content', 'branding-content'].forEach(id => {
          const el = $(id);
          if (el && el.style.maxHeight && el.style.maxHeight !== '0px') {
            el.style.maxHeight = el.scrollHeight + 'px';
          }
        });
      });

      // Escape closes topmost modal (not loading) — once globally
      document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (isGuidedPortalOpen() && !openModalIds.length) {
          setExperienceMode('expert');
          return;
        }
        closeTopModal();
      });

      // Arrow keys for wizard (when not typing in an input)
      document.addEventListener('keydown', function (e) {
        if (experienceMode !== 'guided') return;
        if (openModalIds.length) return;
        // Only when Smart Savings section is visible (or standalone)
        const sec = document.getElementById('smart-savings');
        if (sec && sec.classList.contains('hidden')) return;
        const tag = (e.target && e.target.tagName) || '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target && e.target.isContentEditable)) return;
        if (e.key === 'ArrowRight' || e.key === 'Enter') {
          if (e.key === 'Enter' && tag === 'BUTTON') return;
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            wizardNext();
          }
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          wizardBack();
        }
      });
    }

    updateBrandingChip();
    updateDebtSummaryStrip();
    initMiniNav();
    syncTermSegmented();
    loadSavedScenarios();
    loadSavedMeetings();
    renderScenarioCompare();
    wireLoanSliderGesture();
    wireMainRangeSliders();
    lockCalcModalBackdrops();
    wireDebtImportGlobal();
    sanitizeStateInPlace();
    hydrateDomFromState();

    // LO embed: respect saved preference. Default Full workspace for meetings;
    // Guided tour opens a true modal wizard when selected.
    wireModeToggle();
    polishModeBarForEmbed();
    let savedMode = null;
    try { savedMode = localStorage.getItem('ruoff.experienceMode.' + MODE); } catch (e) {}
    if (!savedMode) {
      savedMode = MODE === 'lo' ? 'expert' : 'guided';
    }
    restoreWizardProgress();
    setExperienceMode(savedMode, { silent: true });
    if (experienceMode === 'guided') {
      goToWizardStep(wizardStep, { silent: true });
    }

    // Sticky KPIs for live meetings (embed, expert only)
    if (isEmbed()) {
      const strip = $('meeting-strip');
      if (strip) strip.classList.add('ss-meeting-sticky');
    }
    wireExpertWorkspaceChrome();

    // Resume banner if returning mid-flow
    if (wizardStep > 0 && experienceMode === 'guided') {
      const banner = $('resume-banner');
      if (banner) {
        banner.classList.remove('hidden');
        setText('resume-banner-text',
          'Welcome back — resuming at “' + WIZARD_STEPS[wizardStep].label + '” (step ' + (wizardStep + 1) + ' of ' + WIZARD_STEPS.length + ').');
      }
    }

    // Debt form: clear placeholder zeros, Enter to save
    ['new-debt-balance', 'new-debt-pay', 'new-debt-rate', 'new-debt-months'].forEach(function (id) {
      clearZeroOnFocus($(id));
    });
    const addDebtModal = $('add-debt-modal');
    if (addDebtModal && !addDebtModal.__ssDebtKeyBound) {
      addDebtModal.__ssDebtKeyBound = true;
      addDebtModal.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && e.target && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          addNewDebt(false);
        }
      });
    }

    return true;
  }

  window.initSmartSavings = function (force) {
    window.APP_MODE = 'lo';
    window.SMART_SAVINGS_EMBED = true;
    return init(!!force);
  };

  function dismissResumeBanner() {
    const banner = $('resume-banner');
    if (banner) banner.classList.add('hidden');
  }

  /**
   * Full workspace polish: sticky mini-nav + collapsible major sections.
   * Collapse state stored per mode in localStorage.
   */
  function wireExpertWorkspaceChrome() {
    const nav = rootQuery('.mini-nav');
    if (nav) nav.classList.add('ss-mini-nav-sticky');

    const COLLAPSE_KEY = 'ruoff.ss.collapsedSections.' + MODE;
    let collapsed = {};
    try {
      collapsed = JSON.parse(localStorage.getItem(COLLAPSE_KEY) || '{}') || {};
    } catch (e) {
      collapsed = {};
    }

    const targets = [
      { sel: '#section-home', title: 'Home value' },
      { sel: '#section-mortgage', title: 'Current mortgage' },
      { sel: '#section-scenario', title: 'New refinance scenario' },
      { sel: '#section-plan', title: 'Review & generate' }
    ];

    targets.forEach(function (t) {
      const section = rootQuery(t.sel);
      if (!section || section.__ssCollapseWired) return;
      section.__ssCollapseWired = true;
      section.classList.add('ss-collapsible-section');

      let head = section.querySelector('.ss-section-collapse-toggle');
      if (!head) {
        head = document.createElement('button');
        head.type = 'button';
        head.className = 'ss-section-collapse-toggle no-print';
        head.innerHTML =
          '<span class="ss-collapse-label">' +
          escapeHtml(t.title) +
          '</span><span class="ss-collapse-chevron" aria-hidden="true"><i class="fas fa-chevron-down"></i></span>';
        section.insertBefore(head, section.firstChild);
      }

      const id = t.sel;
      const apply = function () {
        const isCollapsed = !!collapsed[id];
        section.classList.toggle('ss-section-collapsed', isCollapsed);
        head.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
      };
      apply();

      head.addEventListener('click', function (e) {
        e.preventDefault();
        collapsed[id] = !collapsed[id];
        try {
          localStorage.setItem(COLLAPSE_KEY, JSON.stringify(collapsed));
        } catch (err) { /* ignore */ }
        apply();
      });
    });
  }

  // ─── Multi-scenario A/B compare ──────────────────────────
  function loadSavedScenarios() {
    try {
      const raw = localStorage.getItem(SCENARIOS_KEY);
      savedScenarios = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(savedScenarios)) savedScenarios = [];
    } catch (e) {
      savedScenarios = [];
    }
  }

  function persistScenarios() {
    try { localStorage.setItem(SCENARIOS_KEY, JSON.stringify(savedScenarios.slice(0, 4))); } catch (e) {}
  }

  function captureScenarioSnapshot(label) {
    if (!lastScenario) liveUpdate();
    readStateFromDom();
    return {
      id: 's_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      label: label || ('Scenario ' + (savedScenarios.length + 1)),
      savedAt: new Date().toISOString(),
      inputs: {
        homeValue: state.homeValue,
        currentBalance: state.currentBalance,
        currentRate: state.currentRate,
        yearsRemaining: state.yearsRemaining,
        totalPayment: state.totalPayment,
        taxes: state.taxes,
        insurance: state.insurance,
        pmi: state.pmi,
        escrowIncluded: state.escrowIncluded,
        newLoanAmount: state.newLoanAmount,
        newRate: state.newRate,
        newTerm: state.newTerm,
        closingCosts: state.closingCosts,
        newPmi: state.newPmi,
        newPmiManual: state.newPmiManual,
        debts: JSON.parse(JSON.stringify(state.debts || []))
      },
      metrics: {
        monthlyCashFlowChange: lastScenario.monthlyCashFlowChange,
        newHousing: lastScenario.newHousing,
        oldHousing: lastScenario.oldHousing,
        cashAtClosing: lastScenario.cashAtClosing,
        isCashBack: lastScenario.isCashBack,
        breakEvenMonths: lastScenario.breakEvenMonths,
        totalDebtsPaidOff: lastScenario.totalDebtsPaidOff,
        newPi: lastScenario.newPi,
        mortgageInterestSavings: lastScenario.mortgageInterest && lastScenario.mortgageInterest.savings,
        newLtv: lastScenario.newLtv
      }
    };
  }

  function saveScenarioSlot(slot) {
    // slot: 'A' | 'B' | 'C' | null (auto-named)
    const isNamedSlot = slot === 'A' || slot === 'B' || slot === 'C';
    const label = isNamedSlot
      ? slot
      : prompt('Name this scenario', 'Scenario ' + (savedScenarios.length + 1));
    if (label === null) return;
    const snap = captureScenarioSnapshot(String(label).trim() || 'Scenario');
    // Replace existing same letter slot (A/B/C)
    if (snap.label === 'A' || snap.label === 'B' || snap.label === 'C') {
      savedScenarios = savedScenarios.filter(function (s) { return s.label !== snap.label; });
    }
    savedScenarios.unshift(snap);
    // Keep A/B/C + one custom name max in storage
    savedScenarios = savedScenarios.slice(0, 4);
    persistScenarios();
    renderScenarioCompare();
    toast('Saved “' + snap.label + '”');
  }

  function loadScenarioById(id) {
    const snap = savedScenarios.find(function (s) { return s.id === id; });
    if (!snap) return;
    const i = snap.inputs;
    state.homeValue = i.homeValue;
    state.currentBalance = i.currentBalance;
    state.currentRate = i.currentRate;
    state.yearsRemaining = i.yearsRemaining;
    state.totalPayment = i.totalPayment;
    state.taxes = i.taxes;
    state.insurance = i.insurance;
    state.pmi = i.pmi;
    state.escrowIncluded = i.escrowIncluded;
    state.newLoanAmount = i.newLoanAmount;
    state.newRate = i.newRate;
    state.newTerm = i.newTerm;
    state.closingCosts = i.closingCosts;
    if (i.newPmi != null) state.newPmi = i.newPmi;
    if (i.newPmiManual != null) state.newPmiManual = !!i.newPmiManual;
    state.debts = i.debts || [];
    hydrateDomFromState();
    if ($('new-pmi-manual')) $('new-pmi-manual').checked = !!state.newPmiManual;
    if ($('new-pmi')) $('new-pmi').value = state.newPmi != null ? state.newPmi : 0;
    ensureMortgageDebt();
    liveUpdate();
    toast('Loaded “' + snap.label + '”');
    // Land on Scenario so inputs are visible; compare panel stays on Review (step 6)
    if (experienceMode === 'guided') goToWizardStep(4);
  }

  function deleteScenario(id) {
    savedScenarios = savedScenarios.filter(function (s) { return s.id !== id; });
    persistScenarios();
    renderScenarioCompare();
  }

  function clearScenarios() {
    if (!savedScenarios.length) return;
    if (!confirm('Clear all saved scenarios?')) return;
    savedScenarios = [];
    persistScenarios();
    renderScenarioCompare();
    toast('Scenarios cleared');
  }

  function getScenarioSlot(letter) {
    return savedScenarios.find(function (s) {
      return s && s.label === letter;
    }) || null;
  }

  function buildCurrentCompareCol() {
    if (!lastScenario) return null;
    return {
      id: null,
      label: 'Now',
      isCurrent: true,
      metrics: {
        monthlyCashFlowChange: lastScenario.monthlyCashFlowChange,
        newHousing: lastScenario.newHousing,
        cashAtClosing: lastScenario.cashAtClosing,
        isCashBack: lastScenario.isCashBack,
        breakEvenMonths: lastScenario.breakEvenMonths,
        totalDebtsPaidOff: lastScenario.totalDebtsPaidOff,
        newPi: lastScenario.newPi,
        newLtv: lastScenario.newLtv
      },
      inputs: {
        newLoanAmount: state.newLoanAmount,
        newRate: state.newRate,
        newTerm: state.newTerm
      }
    };
  }

  function scMetricVal(c, key) {
    if (!c || !c.metrics) return null;
    if (key === 'cf') return Number(c.metrics.monthlyCashFlowChange);
    if (key === 'housing') return Number(c.metrics.newHousing);
    if (key === 'be') return c.metrics.breakEvenMonths == null ? null : Number(c.metrics.breakEvenMonths);
    if (key === 'debts') return Number(c.metrics.totalDebtsPaidOff);
    if (key === 'ltv') return c.metrics.newLtv == null ? null : Number(c.metrics.newLtv);
    if (key === 'close') {
      // Prefer cash back (positive score); due is negative magnitude
      const v = Number(c.metrics.cashAtClosing) || 0;
      if (Math.abs(v) < 0.5) return 0;
      return c.metrics.isCashBack ? Math.abs(v) : -Math.abs(v);
    }
    return null;
  }

  /** Index of best column for a metric; null if tie or all empty */
  function scBestIndex(cols, key, preferHigh) {
    let best = null;
    let bestVal = null;
    let tie = false;
    cols.forEach(function (c, i) {
      const v = scMetricVal(c, key);
      if (v == null || !isFinite(v)) return;
      if (bestVal == null) {
        bestVal = v;
        best = i;
        tie = false;
        return;
      }
      const better = preferHigh ? v > bestVal + 0.5 : v < bestVal - 0.5;
      const equal = Math.abs(v - bestVal) <= 0.5;
      if (better) {
        bestVal = v;
        best = i;
        tie = false;
      } else if (equal && best !== i) {
        tie = true;
      }
    });
    return tie ? null : best;
  }

  function renderScenarioCompare() {
    const el = $('scenario-compare');
    if (!el) return;

    const current = buildCurrentCompareCol();
    const slots = ['A', 'B', 'C'].map(function (letter) {
      const snap = getScenarioSlot(letter);
      return snap
        ? Object.assign({}, snap, { isCurrent: false, letter: letter })
        : { letter: letter, empty: true, label: letter };
    });
    const filled = slots.filter(function (s) { return !s.empty; });
    const cols = (current ? [current] : []).concat(filled);

    // ── Slot rail (always show A/B/C) ──
    const rail =
      '<div class="sc-slot-rail" role="group" aria-label="Scenario slots">' +
      slots
        .map(function (s) {
          if (s.empty) {
            return (
              '<button type="button" class="sc-slot sc-slot-empty" data-save-slot="' +
              s.letter +
              '" title="Save what’s on screen as ' +
              s.letter +
              '">' +
              '<span class="sc-slot-letter">' +
              s.letter +
              '</span>' +
              '<span class="sc-slot-meta">Empty</span>' +
              '<span class="sc-slot-cta">Save now →</span>' +
              '</button>'
            );
          }
          const cf = Number(s.metrics && s.metrics.monthlyCashFlowChange) || 0;
          const cfCls = cf > 0 ? 'pos' : cf < 0 ? 'neg' : '';
          return (
            '<div class="sc-slot sc-slot-filled" data-slot-id="' +
            escapeHtml(s.id) +
            '">' +
            '<div class="sc-slot-top">' +
            '<span class="sc-slot-letter">' +
            escapeHtml(s.letter || s.label) +
            '</span>' +
            '<span class="sc-slot-cf number ' +
            cfCls +
            '">' +
            (cf > 0 ? '+' : '') +
            money(cf) +
            '<span class="sc-slot-cf-unit">/mo</span></span>' +
            '</div>' +
            '<div class="sc-slot-loan number">' +
            money(s.inputs && s.inputs.newLoanAmount) +
            ' · ' +
            (s.inputs && s.inputs.newRate) +
            '% · ' +
            (s.inputs && s.inputs.newTerm) +
            'yr</div>' +
            '<div class="sc-slot-actions">' +
            '<button type="button" class="sc-action-btn" data-load-sc="' +
            escapeHtml(s.id) +
            '">Load</button>' +
            '<button type="button" class="sc-action-btn sc-action-danger" data-del-sc="' +
            escapeHtml(s.id) +
            '">Delete</button>' +
            '<button type="button" class="sc-action-btn sc-action-mute" data-save-slot="' +
            escapeHtml(s.letter || s.label) +
            '" title="Overwrite with current screen">Update</button>' +
            '</div>' +
            '</div>'
          );
        })
        .join('') +
      '</div>';

    if (!filled.length) {
      el.innerHTML =
        rail +
        '<div class="scenario-compare-empty mt-3">' +
        '<p class="text-sm font-semibold m-0 mb-1">Park a path to compare</p>' +
        '<p class="text-xs opacity-65 m-0">Tap an empty slot (or use the buttons above once you have A). Then change rate, term, or debts and park another — the table appears when two or more paths exist (including what’s live on screen).</p>' +
        '</div>';
      wireScenarioCompareActions(el);
      return;
    }

    // Winner = best cash flow among cols
    const winnerIdx = scBestIndex(cols, 'cf', true);
    const winner = winnerIdx != null ? cols[winnerIdx] : null;
    const curCf = current ? Number(current.metrics.monthlyCashFlowChange) || 0 : null;

    let insight = '';
    if (winner && !winner.isCurrent && curCf != null) {
      const wCf = Number(winner.metrics.monthlyCashFlowChange) || 0;
      const delta = wCf - curCf;
      if (Math.abs(delta) >= 1) {
        insight =
          '<div class="sc-insight' +
          (delta > 0 ? ' sc-insight-win' : ' sc-insight-loss') +
          '">' +
          '<span class="sc-insight-badge">Slot ' +
          escapeHtml(winner.label) +
          '</span> ' +
          (delta > 0 ? 'beats live screen by ' : 'trails live screen by ') +
          '<strong class="number">' +
          (delta > 0 ? '+' : '−') +
          money(Math.abs(delta)) +
          '/mo</strong> cash flow' +
          (winner.metrics.breakEvenMonths != null
            ? ' · break-even ' + winner.metrics.breakEvenMonths + ' mo'
            : '') +
          '.' +
          '</div>';
      } else {
        insight =
          '<div class="sc-insight">Slot <strong>' +
          escapeHtml(winner.label) +
          '</strong> and the live screen are essentially tied on cash flow — compare housing and cash at close.</div>';
      }
    } else if (winner && winner.isCurrent && filled.length) {
      insight =
        '<div class="sc-insight sc-insight-win">' +
        '<span class="sc-insight-badge">Live screen</span> currently leads saved slots on monthly cash flow.' +
        '</div>';
    }

    const bestCf = scBestIndex(cols, 'cf', true);
    const bestHousing = scBestIndex(cols, 'housing', false);
    const bestBe = scBestIndex(cols, 'be', false);
    const bestLtv = scBestIndex(cols, 'ltv', false);
    const bestClose = scBestIndex(cols, 'close', true);

    function deltaVsCurrent(c, key, preferHigh) {
      if (!current || c.isCurrent) return '';
      const a = scMetricVal(c, key);
      const b = scMetricVal(current, key);
      if (a == null || b == null || !isFinite(a) || !isFinite(b)) return '';
      const d = a - b;
      if (Math.abs(d) < 0.75) return '<div class="sc-delta sc-delta-flat">≈ Now</div>';
      const better = preferHigh ? d > 0 : d < 0;
      if (key === 'cf' || key === 'housing' || key === 'close' || key === 'debts') {
        return (
          '<div class="sc-delta ' +
          (better ? 'sc-delta-better' : 'sc-delta-worse') +
          '">' +
          (d > 0 ? '+' : '−') +
          money(Math.abs(d)) +
          (key === 'cf' ? '/mo' : '') +
          ' vs Now</div>'
        );
      }
      if (key === 'be') {
        return (
          '<div class="sc-delta ' +
          (better ? 'sc-delta-better' : 'sc-delta-worse') +
          '">' +
          (d > 0 ? '+' : '') +
          Math.round(d) +
          ' mo vs Now</div>'
        );
      }
      if (key === 'ltv') {
        return (
          '<div class="sc-delta ' +
          (better ? 'sc-delta-better' : 'sc-delta-worse') +
          '">' +
          (d > 0 ? '+' : '') +
          (Math.round(d * 10) / 10) +
          ' pts vs Now</div>'
        );
      }
      return '';
    }

    function loanCell(c) {
      if (!c.inputs) return '—';
      return (
        '<span class="sc-main number">' +
        money(c.inputs.newLoanAmount) +
        '</span><div class="sc-sub">' +
        c.inputs.newRate +
        '% · ' +
        c.inputs.newTerm +
        ' yr</div>'
      );
    }
    function cashCell(c, i) {
      const m = c.metrics || {};
      if (m.cashAtClosing == null) return '—';
      let main;
      if (Math.abs(Number(m.cashAtClosing) || 0) < 0.5) main = 'Even';
      else if (m.isCashBack) main = '<span class="sc-cash-back">Back ' + money(Math.abs(m.cashAtClosing)) + '</span>';
      else main = '<span class="sc-cash-due">Due ' + money(Math.abs(m.cashAtClosing)) + '</span>';
      return main + deltaVsCurrent(c, 'close', true);
    }
    function cfCell(c) {
      const v = Number(c.metrics && c.metrics.monthlyCashFlowChange) || 0;
      const cls = v > 0 ? 'pos' : v < 0 ? 'neg' : '';
      return (
        '<span class="sc-main ' +
        cls +
        ' number">' +
        (v > 0 ? '+' : '') +
        money(v) +
        '</span>' +
        deltaVsCurrent(c, 'cf', true)
      );
    }

    function cellClass(colIndex, bestIdx) {
      return bestIdx != null && bestIdx === colIndex ? ' sc-cell-best' : '';
    }

    function row(label, renderFn, bestIdx, opts) {
      const o = opts || {};
      return (
        '<tr' +
        (o.highlight ? ' class="sc-row-highlight"' : '') +
        '><th scope="row" class="sc-metric">' +
        label +
        '</th>' +
        cols
          .map(function (c, i) {
            return (
              '<td class="number' +
              cellClass(i, bestIdx) +
              (c.isCurrent ? ' sc-cell-now' : '') +
              (winnerIdx === i ? ' sc-cell-winner-col' : '') +
              '">' +
              renderFn(c, i) +
              '</td>'
            );
          })
          .join('') +
        '</tr>'
      );
    }

    const head =
      '<th class="sc-metric-col sc-sticky-col" scope="col"><span class="sr-only">Metric</span></th>' +
      cols
        .map(function (c, i) {
          const win = winnerIdx === i;
          if (c.isCurrent) {
            return (
              '<th scope="col" class="sc-col-head sc-col-current' +
              (win ? ' sc-col-winner' : '') +
              '">' +
              '<span class="sc-col-label">Now</span>' +
              '<span class="sc-col-tag">Live screen</span>' +
              (win ? '<span class="sc-win-pill">Best CF</span>' : '') +
              '</th>'
            );
          }
          return (
            '<th scope="col" class="sc-col-head' +
            (win ? ' sc-col-winner' : '') +
            '">' +
            '<span class="sc-col-label">Slot ' +
            escapeHtml(c.label) +
            '</span>' +
            (win ? '<span class="sc-win-pill">Best CF</span>' : '<span class="sc-col-tag">Saved</span>') +
            '<span class="sc-col-actions">' +
            '<button type="button" class="sc-action-btn" data-load-sc="' +
            escapeHtml(c.id || '') +
            '">Load</button>' +
            '<button type="button" class="sc-action-btn sc-action-danger" data-del-sc="' +
            escapeHtml(c.id || '') +
            '">Delete</button>' +
            '</span>' +
            '</th>'
          );
        })
        .join('');

    el.innerHTML =
      rail +
      insight +
      '<div class="scenario-compare-toolbar">' +
      '<span class="text-xs opacity-55 font-semibold">Green cells = best in row · deltas vs live screen</span>' +
      (filled.length
        ? '<button type="button" class="btn-ghost text-sm py-1.5 px-3" onclick="RuoffApp.clearScenarios()">Clear saved</button>'
        : '') +
      '</div>' +
      '<div class="scenario-table-wrap">' +
      '<table class="scenario-table">' +
      '<thead><tr>' +
      head +
      '</tr></thead><tbody>' +
      row('Loan', loanCell, null) +
      row(
        'New housing',
        function (c) {
          return (
            '<span class="sc-main number">' +
            money(c.metrics && c.metrics.newHousing) +
            '</span>' +
            deltaVsCurrent(c, 'housing', false)
          );
        },
        bestHousing
      ) +
      row('Cash flow', cfCell, bestCf, { highlight: true }) +
      row('Cash at close', cashCell, bestClose) +
      row(
        'Break-even',
        function (c) {
          const be = c.metrics && c.metrics.breakEvenMonths;
          const main = be != null ? be + ' mo' : 'N/A';
          return '<span class="sc-main number">' + main + '</span>' + deltaVsCurrent(c, 'be', false);
        },
        bestBe
      ) +
      row(
        'Debts paid',
        function (c) {
          return (
            '<span class="sc-main number">' +
            money(c.metrics && c.metrics.totalDebtsPaidOff) +
            '</span>' +
            deltaVsCurrent(c, 'debts', true)
          );
        },
        scBestIndex(cols, 'debts', true)
      ) +
      row(
        'New LTV',
        function (c) {
          const v = c.metrics && c.metrics.newLtv;
          return (
            '<span class="sc-main number">' +
            (v != null ? v + '%' : '—') +
            '</span>' +
            deltaVsCurrent(c, 'ltv', false)
          );
        },
        bestLtv
      ) +
      '</tbody></table></div>';

    wireScenarioCompareActions(el);
  }

  function wireScenarioCompareActions(root) {
    if (!root) return;
    root.querySelectorAll('[data-load-sc]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        loadScenarioById(btn.getAttribute('data-load-sc'));
      });
    });
    root.querySelectorAll('[data-del-sc]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        deleteScenario(btn.getAttribute('data-del-sc'));
      });
    });
    root.querySelectorAll('[data-save-slot]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        saveScenarioSlot(btn.getAttribute('data-save-slot'));
      });
    });
  }

  // ─── Print / PDF one-pager + share ───────────────────────
  function buildMiniAmortSvg(s) {
    if (!C.amortizationBalanceSeries || !s) return '';
    const consolidating = isDebtConsolidationScenario(s);
    const refi = C.amortizationBalanceSeries(s.newLoanAmount, s.newRate, s.newTerm, 12);
    const keep = consolidating
      ? null
      : C.amortizationBalanceSeries(s.currentBalance, s.currentRate, s.yearsRemaining, 12);
    const maxBal = consolidating
      ? Math.max(s.newLoanAmount || 0, 1)
      : Math.max(s.currentBalance || 0, s.newLoanAmount || 0, 1);
    const maxYears = consolidating
      ? Math.max(s.newTerm || 0, 1)
      : Math.max(s.yearsRemaining || 0, s.newTerm || 0, 1);
    const W = 520;
    const H = 120;
    const pad = { t: 10, r: 10, b: 22, l: 36 };
    const plotW = W - pad.l - pad.r;
    const plotH = H - pad.t - pad.b;
    function xOf(year) { return pad.l + (year / maxYears) * plotW; }
    function yOf(bal) { return pad.t + plotH - (bal / maxBal) * plotH; }
    function toPolyline(series) {
      return series.points.map(function (pt) {
        return xOf(pt.year).toFixed(1) + ',' + yOf(pt.balance).toFixed(1);
      }).join(' ');
    }
    const ticks = [0, Math.round(maxYears / 2), Math.round(maxYears)];
    const grid = ticks.map(function (y) {
      const x = xOf(y);
      return '<line x1="' + x + '" y1="' + pad.t + '" x2="' + x + '" y2="' + (pad.t + plotH) +
        '" stroke="#cbd5e1" stroke-width="1"/>' +
        '<text x="' + x + '" y="' + (H - 6) + '" text-anchor="middle" class="op-amort-axis">' + y + 'y</text>';
    }).join('');
    const keepLine = keep
      ? '<polyline fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="' +
        toPolyline(keep) + '"/>'
      : '';
    const legend = consolidating
      ? '<div class="op-amort-legend"><span class="op-leg-refi">Proposed loan payoff</span></div>'
      : '<div class="op-amort-legend"><span class="op-leg-keep">Keep current</span><span class="op-leg-refi">Proposed refi</span></div>';
    return (
      '<svg class="op-amort-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Balance over time">' +
      '<rect x="' + pad.l + '" y="' + pad.t + '" width="' + plotW + '" height="' + plotH +
        '" fill="#f8fafc" rx="6"/>' +
      grid +
      keepLine +
      '<polyline fill="none" stroke="#00A89D" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="' +
        toPolyline(refi) + '"/>' +
      '</svg>' +
      legend
    );
  }

  function buildLoCardHtml(lo) {
    const hasIdentity = !!(lo && (lo.name || lo.email || lo.cell || lo.nmls || lo.phone || lo.photo));
    if (!hasIdentity) {
      return (
        '<aside class="op-lo-card op-lo-card-empty">' +
        '<div class="op-lo-meta">' +
        '<div class="op-label">Your loan officer</div>' +
        '<div class="op-lo-name">Add your branding in Setup</div>' +
        '<div class="op-lo-line">Name, NMLS, phone, email, and optional headshot appear here on client PDFs.</div>' +
        '</div></aside>'
      );
    }
    const phone = lo.cell || lo.phone || '';
    const initials = (lo.name || 'LO').split(/\s+/).filter(Boolean).slice(0, 2)
      .map(function (p) { return p.charAt(0).toUpperCase(); }).join('') || 'LO';
    // Prefer data URLs for print reliability; remote URLs still work in browser preview
    const photoSrc = lo.photo || '';
    const photo = photoSrc
      ? '<img class="op-lo-photo" src="' + escapeHtml(photoSrc) + '" alt="">'
      : '<div class="op-lo-initials">' + escapeHtml(initials) + '</div>';
    return (
      '<aside class="op-lo-card">' +
      photo +
      '<div class="op-lo-meta">' +
      '<div class="op-label">Your loan officer</div>' +
      (lo.name ? '<div class="op-lo-name">' + escapeHtml(lo.name) + '</div>' : '') +
      (lo.nmls ? '<div class="op-lo-line">NMLS ' + escapeHtml(lo.nmls) + '</div>' : '') +
      (phone ? '<div class="op-lo-line">' + escapeHtml(phone) + '</div>' : '') +
      (lo.email ? '<div class="op-lo-line">' + escapeHtml(lo.email) + '</div>' : '') +
      '</div></aside>'
    );
  }

  /** Ensure branding photo is a data URL before printing (best effort). */
  async function ensurePrintableBrandingPhoto() {
    const brand = state.branding || {};
    if (!brand.photo || String(brand.photo).indexOf('data:image/') === 0) return brand;
    try {
      const dataUrl = await imageUrlToDataUrl(brand.photo, 480);
      if (dataUrl && dataUrl.indexOf('data:image/') === 0) {
        brand.photo = dataUrl;
        state.branding.photo = dataUrl;
        if ($('branding-photo')) $('branding-photo').value = dataUrl;
      }
    } catch (e) { /* keep original */ }
    return brand;
  }

  function buildOnePagerHtml() {
    if (!lastScenario) liveUpdate();
    const s = lastScenario;
    const client = collectClient();
    const brand = state.branding || {};
    // Always include LO card (empty state prompts branding setup when missing)
    const lo = MODE === 'borrower' ? state.loContact : brand;
    // Normalize phone field for LO branding (cell) vs borrower link (phone)
    const loNorm = lo ? {
      name: lo.name || '',
      nmls: lo.nmls || '',
      email: lo.email || '',
      cell: lo.cell || lo.phone || '',
      phone: lo.phone || lo.cell || '',
      photo: lo.photo || ''
    } : {};
    const brandColor = safeHexColor(
      (MODE === 'borrower' ? (state.loContact && state.loContact.color) : brand.color) || '',
      '#00A89D'
    );
    const cf = s.monthlyCashFlowChange;
    const cashLabel = s.cashAtClosing === 0 ? 'Even at closing' : (s.isCashBack ? 'Est. cash back' : 'Est. cash to close');
    const debts = (state.debts || []).filter(function (d) { return d.payOff; });
    const debtRows = debts.map(function (d) {
      return '<tr><td>' + escapeHtml(d.name) + '</td><td class="num">' + money(d.bal) + '</td><td class="num">' + money(d.pay) + '/mo</td></tr>';
    }).join('') || '<tr><td colspan="3">Mortgage only</td></tr>';

    const beLabel =
      s.breakEvenMonths != null
        ? s.breakEvenMonths + (s.breakEvenMonths === 1 ? ' month' : ' months')
        : s.breakEvenNotMeaningful
          ? 'Not meaningful'
          : 'N/A';

    return (
      '<div class="onepager" style="--op-brand:' + brandColor + '">' +
      '<header class="op-header">' +
      '<div><div class="op-brand">Ruoff Mortgage</div>' +
      '<h1>Smart Savings Snapshot</h1>' +
      '<p class="op-sub">Prepared for ' + escapeHtml(client.clientName || 'Client') +
      (loNorm.name ? ' · ' + escapeHtml(loNorm.name) : '') +
      (loNorm.nmls ? ' · NMLS ' + escapeHtml(loNorm.nmls) : '') +
      '</p></div>' +
      '<div class="op-date">' + new Date().toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
      }) + '</div>' +
      '</header>' +
      buildLoCardHtml(loNorm) +
      '<section class="op-hero">' +
      '<div class="op-before"><div class="op-label">Today</div><div class="op-big">' + money(s.oldHousing) + '</div><div class="op-muted">Total housing · P&amp;I ' + money(s.oldPi) + '</div></div>' +
      '<div class="op-arrow" aria-hidden="true">→</div>' +
      '<div class="op-after"><div class="op-label">Proposed</div><div class="op-big teal">' + money(s.newHousing) + '</div><div class="op-muted">Est. housing · P&amp;I ' + money(s.newPi) + '</div></div>' +
      '</section>' +
      '<section class="op-kpis">' +
      '<div><div class="op-label">Cash-flow change</div><div class="op-kpi ' + (cf > 0 ? 'teal' : cf < 0 ? 'red' : '') + '">' + (cf > 0 ? '+' : '') + money(cf) + '</div></div>' +
      '<div><div class="op-label">' + cashLabel + '</div><div class="op-kpi orange">' + money(Math.abs(s.cashAtClosing)) + '</div></div>' +
      '<div><div class="op-label">Break-even</div><div class="op-kpi">' + beLabel + '</div></div>' +
      '<div><div class="op-label">Debts paid off</div><div class="op-kpi">' + money(s.totalDebtsPaidOff) + '</div></div>' +
      '</section>' +
      '<section class="op-grid">' +
      '<div><h3>Home</h3><p>Value ' + money(s.homeValue) + '<br>Equity ' + money(s.equity) + ' · LTV ' + s.ltv + '%<br>New LTV ' + s.newLtv + '% · Equity ' + money(s.newEquity) + '</p></div>' +
      '<div><h3>Proposed loan</h3><p>' + money(s.newLoanAmount) + ' at ' + s.newRate + '% for ' + s.newTerm + ' years<br>Closing costs (est.) ' + money(s.closingCosts) + '</p></div>' +
      '</section>' +
      '<section class="op-amort"><h3>Why this path</h3>' +
      '<p class="op-amort-note">Monthly stack today ' +
        money((Number(s.oldMonthlyObligations) || (Number(s.oldHousing) || 0) + (Number(s.otherDebtMonthly) || 0))) +
        ' → after ' + money(Number(s.newHousing) || 0) +
        ' · cash-flow ' +
        ((Number(s.monthlyCashFlowChange) || 0) >= 0 ? '+' : '') +
        money(s.monthlyCashFlowChange) + '/mo' +
        (isDebtConsolidationScenario(s)
          ? ' · debts rolled in ' + money(s.otherDebtsPaidOff) +
            ' (frees ' + money(s.otherDebtMonthly) + '/mo)'
          : s.mortgageInterest
            ? ' · mortgage interest vs keep ' +
              ((Number(s.mortgageInterest.savings) || 0) >= 0 ? '' : '−') +
              money(Math.abs(s.mortgageInterest.savings || 0))
            : '') +
        (s.breakEvenMonths != null && s.breakEvenMonths > 0
          ? ' · break-even ~' + s.breakEvenMonths + ' mo'
          : '') +
        '.</p>' +
      '<p class="op-amort-note" style="font-weight:500;opacity:.75">Payoff timing is the selected ' +
        (s.newTerm || 30) +
        '-year term — we do not print a multi-year balance graph that only restates that.</p>' +
      '</section>' +
      '<section><h3>Debts included in payoff</h3>' +
      '<table class="op-table"><thead><tr><th>Debt</th><th>Balance</th><th>Payment</th></tr></thead><tbody>' + debtRows + '</tbody></table></section>' +
      (s.halfSavingsPaydown
        ? '<section><h3>Optional: apply half of savings to principal</h3><p>About ' + money(s.halfSavingsPaydown.extraMonthly) +
          '/mo could finish ~' + s.halfSavingsPaydown.yearsSaved + ' years sooner and save ~' +
          money(s.halfSavingsPaydown.interestSavedVsBaseline) + ' more interest.</p></section>'
        : '') +
      '<footer class="op-foot">Estimates only. Not a commitment to lend. Rates, costs, and eligibility subject to underwriting and change. ' +
      'Ruoff Mortgage · NMLS#141868' +
      (loNorm.cell ? ' · ' + escapeHtml(loNorm.cell) : '') +
      (loNorm.email ? ' · ' + escapeHtml(loNorm.email) : '') +
      '</footer></div>'
    );
  }

  /**
   * Self-contained print CSS for the one-pager (standalone window / fallback portal).
   * Must NOT depend on coach layout or scoped embed CSS — that was printing sidebars.
   */
  function getOnePagerPrintStyles() {
    return [
      '*{box-sizing:border-box;}',
      'html,body{margin:0;padding:0;background:#fff;color:#0f172a;',
      "font-family:'Plus Jakarta Sans',system-ui,-apple-system,Segoe UI,Roboto,sans-serif;}",
      'body{padding:0;}',
      '@page{size:letter;margin:0.55in;}',
      '.onepager{padding:0.15in 0.1in;max-width:7.5in;margin:0 auto;color:#0f172a;}',
      '.op-header{display:flex;justify-content:space-between;align-items:flex-start;',
      'border-bottom:3px solid var(--op-brand,#00A89D);padding-bottom:0.85rem;margin-bottom:0.95rem;}',
      '.op-brand{font-size:0.68rem;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;',
      'color:var(--op-brand,#00A89D);}',
      '.onepager h1{font-size:1.55rem;font-weight:800;letter-spacing:-0.03em;margin:0.15rem 0 0.2rem;color:#002B5C;}',
      '.op-sub{font-size:0.88rem;color:#64748b;margin:0;line-height:1.4;}',
      '.op-date{font-size:0.78rem;color:#64748b;font-weight:700;white-space:nowrap;}',
      '.op-lo-card{display:flex;align-items:center;gap:0.85rem;padding:0.7rem 0.85rem;margin-bottom:1rem;',
      '.op-lo-card-empty{border-style:dashed!important;background:#f8fafc!important;}',
      'border-radius:0.85rem;border:1px solid #e2e8f0;background:#f8fafc;}',
      '.op-lo-photo{width:3.1rem;height:3.75rem;border-radius:50%;object-fit:cover;object-position:center 18%;',
      'flex-shrink:0;border:2px solid var(--op-brand,#00A89D);background:#e2e8f0;}',
      '.op-lo-initials{width:3.1rem;height:3.75rem;border-radius:50%;flex-shrink:0;display:flex;align-items:center;',
      'justify-content:center;font-weight:800;font-size:0.95rem;color:#fff;',
      'background:linear-gradient(135deg,var(--op-brand,#00A89D),#F15A29);}',
      '.op-lo-name{font-weight:800;font-size:1rem;color:#0f172a;letter-spacing:-0.02em;}',
      '.op-lo-line{font-size:0.78rem;color:#64748b;line-height:1.35;}',
      '.op-label{font-size:0.62rem;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#64748b;}',
      '.op-hero{display:grid;grid-template-columns:1fr auto 1fr;gap:0.7rem;align-items:center;margin-bottom:1.05rem;}',
      '.op-before,.op-after{border:1px solid #e2e8f0;border-radius:0.9rem;padding:0.9rem 1rem;}',
      '.op-after{border-color:#00A89D;background:#f0fdfa;}',
      '.op-arrow{font-size:1.35rem;font-weight:800;color:#00A89D;}',
      '.op-big{font-size:1.65rem;font-weight:800;letter-spacing:-0.03em;margin:0.2rem 0;}',
      '.op-muted{font-size:0.78rem;color:#64748b;}',
      '.op-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:0.55rem;margin-bottom:1.05rem;}',
      '.op-kpis>div{border:1px solid #e2e8f0;border-radius:0.8rem;padding:0.65rem 0.7rem;background:#fff;}',
      '.op-kpi{font-size:1.12rem;font-weight:800;margin-top:0.2rem;font-variant-numeric:tabular-nums;}',
      '.op-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.9rem;margin-bottom:0.95rem;}',
      '.onepager h3{font-size:0.82rem;font-weight:800;margin:0 0 0.35rem;color:#002B5C;}',
      '.onepager p{font-size:0.86rem;line-height:1.45;margin:0 0 0.65rem;}',
      '.op-amort{margin-bottom:0.95rem;padding:0.75rem 0.9rem;border:1px solid #e2e8f0;border-radius:0.85rem;background:#fff;}',
      '.op-amort-svg{width:100%;height:auto;display:block;}',
      '.op-amort-axis{font-size:9px;fill:#94a3b8;font-weight:600;}',
      '.op-amort-legend{display:flex;gap:1rem;margin-top:0.35rem;font-size:0.7rem;font-weight:700;color:#64748b;}',
      '.op-leg-keep::before,.op-leg-refi::before{content:"";display:inline-block;width:0.85rem;height:3px;',
      'border-radius:2px;margin-right:0.3rem;vertical-align:middle;}',
      '.op-leg-keep::before{background:#94a3b8;}',
      '.op-leg-refi::before{background:#00A89D;}',
      '.op-amort-note{margin:0.45rem 0 0!important;font-size:0.8rem!important;font-weight:700;}',
      '.op-table{width:100%;border-collapse:collapse;font-size:0.84rem;margin-bottom:0.85rem;}',
      '.op-table th,.op-table td{border-bottom:1px solid #e2e8f0;padding:0.4rem 0.3rem;text-align:left;}',
      '.op-table th{font-size:0.7rem;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;}',
      '.op-table .num{text-align:right;font-variant-numeric:tabular-nums;}',
      '.op-foot{margin-top:1rem;padding-top:0.7rem;border-top:1px solid #e2e8f0;font-size:0.68rem;',
      'color:#64748b;line-height:1.4;}',
      '.teal{color:#0d9488!important;}',
      '.orange{color:#F15A29!important;}',
      '.red{color:#dc2626!important;}',
      '@media print{',
      '  body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}',
      '  .onepager{padding:0;max-width:none;}',
      '  .op-kpis{grid-template-columns:repeat(4,1fr);}',
      '}',
      '@media (max-width:640px){',
      '  .op-kpis{grid-template-columns:1fr 1fr;}',
      '  .op-grid{grid-template-columns:1fr;}',
      '}'
    ].join('');
  }

  function buildPrintDocumentHtml(onePagerInner) {
    const title = 'Smart Savings Snapshot';
    return (
      '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>' +
      title +
      '</title>' +
      '<link rel="preconnect" href="https://fonts.googleapis.com">' +
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
      '<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">' +
      '<style>' +
      getOnePagerPrintStyles() +
      '</style></head><body class="ss-print-doc">' +
      onePagerInner +
      '<script>(function(){function go(){try{window.focus();window.print();}catch(e){}}' +
      'if(document.readyState==="complete")setTimeout(go,200);' +
      'else window.addEventListener("load",function(){setTimeout(go,200);});' +
      'window.addEventListener("afterprint",function(){try{window.close();}catch(e){}});' +
      '})();<\/script></body></html>'
    );
  }

  function ensurePrintFallbackBar() {
    let bar = document.getElementById('ss-print-fallback-bar');
    if (bar) return bar;
    bar = document.createElement('div');
    bar.id = 'ss-print-fallback-bar';
    bar.className = 'ss-print-fallback-bar hidden no-print';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Print one-pager');
    bar.innerHTML =
      '<div class="ss-print-fallback-inner">' +
        '<div class="ss-print-fallback-text">' +
          '<strong>Print preview ready</strong>' +
          '<span>Coach chrome is hidden. Print now, or cancel to return.</span>' +
        '</div>' +
        '<div class="ss-print-fallback-actions">' +
          '<button type="button" class="ss-print-fallback-print" id="ss-print-fallback-print">' +
            '<i class="fas fa-print" aria-hidden="true"></i> Print / Save PDF' +
          '</button>' +
          '<button type="button" class="ss-print-fallback-cancel" id="ss-print-fallback-cancel">Cancel</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(bar);
    const printBtn = document.getElementById('ss-print-fallback-print');
    const cancelBtn = document.getElementById('ss-print-fallback-cancel');
    if (printBtn) {
      printBtn.addEventListener('click', function () {
        try {
          window.print();
        } catch (e) { /* ignore */ }
      });
    }
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        exitPrintFallbackMode();
      });
    }
    return bar;
  }

  function exitPrintFallbackMode() {
    document.documentElement.classList.remove('ss-print-mode');
    document.body.classList.remove('ss-print-mode', 'printing-onepager');
    const portal = document.getElementById('ss-print-root');
    if (portal) {
      portal.innerHTML = '';
      portal.classList.add('hidden');
    }
    const bar = document.getElementById('ss-print-fallback-bar');
    if (bar) bar.classList.add('hidden');
  }

  /** Fallback when popups blocked: hide coach UI, show one-pager + action bar */
  function printOnePagerInPageFallback(onePagerInner) {
    let portal = document.getElementById('ss-print-root');
    if (!portal) {
      portal = document.createElement('div');
      portal.id = 'ss-print-root';
      portal.setAttribute('data-ss-print-root', '1');
      document.body.appendChild(portal);
    }
    portal.innerHTML = onePagerInner;
    portal.classList.remove('hidden');
    document.documentElement.classList.add('ss-print-mode');
    document.body.classList.add('ss-print-mode', 'printing-onepager');
    const bar = ensurePrintFallbackBar();
    bar.classList.remove('hidden');

    const cleanup = function () {
      exitPrintFallbackMode();
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    // Auto-open print after paint so user sees the clean sheet + bar
    setTimeout(function () {
      try {
        window.print();
      } catch (e) {
        /* keep bar visible so user can retry */
      }
    }, 180);
  }

  /**
   * Print / Save as PDF — isolated print document (no coach sidebar).
   * Converts headshot to data URL first when possible.
   */
  async function printOnePager() {
    if (!lastScenario) liveUpdate();
    try {
      await ensurePrintableBrandingPhoto();
    } catch (e) { /* continue */ }
    const onePagerInner = buildOnePagerHtml();
    if (!onePagerInner) {
      toast('Print view unavailable', 'error');
      return;
    }

    const docHtml = buildPrintDocumentHtml(onePagerInner);
    let popup = null;
    try {
      popup = window.open('', '_blank', 'width=920,height=1180');
    } catch (e) {
      popup = null;
    }

    if (popup && !popup.closed) {
      try {
        popup.document.open();
        popup.document.write(docHtml);
        popup.document.close();
        try {
          popup.opener = null;
        } catch (e) { /* ignore */ }
        toast('Opening print dialog — choose “Save as PDF” if you want a file');
        return;
      } catch (e) {
        try {
          popup.close();
        } catch (err) { /* ignore */ }
      }
    }

    toast('Popup blocked — use the print bar, then Print / Save PDF', 'warn');
    printOnePagerInPageFallback(onePagerInner);
  }

  function shareSnapshot() {
    if (!lastScenario) liveUpdate();
    const s = lastScenario;
    const client = collectClient();
    const cf = s.monthlyCashFlowChange;
    const text =
      'Ruoff Smart Savings Snapshot' + (client.clientName ? ' — ' + client.clientName : '') + '\n' +
      'Today housing: ' + money(s.oldHousing) + '\n' +
      'Proposed housing: ' + money(s.newHousing) + '\n' +
      'Cash-flow change: ' + (cf > 0 ? '+' : '') + money(cf) + '\n' +
      (s.isCashBack ? 'Cash back: ' : 'Cash to close: ') + money(Math.abs(s.cashAtClosing)) + '\n' +
      'Break-even: ' + (s.breakEvenMonths != null ? s.breakEvenMonths + ' months' : 'N/A') + '\n' +
      'Loan: ' + money(s.newLoanAmount) + ' @ ' + s.newRate + '% / ' + s.newTerm + ' years\n' +
      '(Estimates only — not a commitment to lend)';

    if (navigator.share) {
      navigator.share({ title: 'Ruoff Smart Savings Snapshot', text: text }).catch(function () {
        copyText(text);
      });
    } else {
      copyText(text);
    }
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        toast('Snapshot copied — paste into email or text');
      }).catch(function () {
        prompt('Copy this snapshot:', text);
      });
    } else {
      prompt('Copy this snapshot:', text);
    }
  }

  function celebrateGenerateSuccess() {
    if (lastScenario && lastScenario.monthlyCashFlowChange > 0) {
      confettiCooldownUntil = 0;
      fireWinConfetti();
    }
  }

  // Public API for onclick handlers
  window.RuoffApp = {
    getGrokEndpoint,
    callGrokAPI,
    liveUpdate,
    formatHomeValue,
    formatHomeValueBlur,
    syncHomeSlider,
    syncNewLoanSlider,
    syncNewRateSlider,
    syncClosingCostsSlider,
    onClosingCostsInput,
    onNewLoanInput,
    onNewRateInput,
    onNewPmiManualToggle,
    onNewPmiInput,
    syncNewPmiField,
    onBrandingPhotoFileChange,
    updateBrandingPhotoPreview,
    applyPreset,
    appendGoalChip,
    selectDebtType,
    toggleDebtOptional,
    openMortgageModal,
    closeMortgageModal,
    saveMortgageModal,
    cancelMortgageModal,
    updateMortgageModal,
    syncBalanceSlider,
    onLoanSliderPointerDown,
    onLoanSliderPointerUp,
    openDebtsModal,
    closeDebtsModal,
    switchToMortgageModal,
    openDebtImportModal,
    closeDebtImportModal,
    clearDebtImportImage,
    runDebtImportScan,
    applyDebtImport,
    debtImportSelectAll,
    openAddDebtModal,
    closeAddDebtModal,
    addNewDebt,
    syncNewDebtPayoffLabel,
    expandDebtInline,
    sizeLoanToCoverDebts,
    scrollToSection,
    setExperienceMode,
    wizardNext,
    wizardBack,
    goToWizardStep,
    restartWizard,
    dismissResumeBanner,
    showBrandingInGuided,
    setTerm,
    syncTermSegmented,
    clearAllData,
    clearOtherDebts,
    openNewMeetingModal,
    closeNewMeetingModal,
    confirmNewMeeting,
    openSavedMeetingsModal,
    closeSavedMeetingsModal,
    saveMeetingToLibrary,
    loadMeetingById,
    deleteMeetingById,
    showCashFlowModal,
    showDebtsPaidModal,
    showCashClosingModal,
    showBreakEvenModal,
    showInterestModal,
    closeDetailModal,
    showHelp,
    closeHelp,
    generateSmartPlan,
    showTab,
    downloadAsWordDoc,
    copyFormattedPlan,
    showVisualSummary,
    copyVisualAsHTML,
    printOnePager,
    shareSnapshot,
    saveScenarioSlot,
    loadScenarioById,
    clearScenarios,
    draftInitialEmail,
    contactMyLO,
    sendToMyLO,
    copyBorrowerLink,
    saveBranding,
    saveClient,
    toggleAccordion: function (which) {
      if (which === 'client') toggleAccordion('client-info-content', 'client-chevron');
      if (which === 'branding') toggleAccordion('branding-content', 'branding-chevron');
    },
    getScenario: () => lastScenario,
    MODE
  };

  // Standalone app.html: auto-init. Embedded coach: wait for initSmartSavings / host.
  function bootStandalone() {
    if (document.getElementById('smart-savings-root') || window.SMART_SAVINGS_EMBED) {
      // Host will call initSmartSavings on first section show
      return;
    }
    init(false);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootStandalone);
  } else {
    bootStandalone();
  }
})();

