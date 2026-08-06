/**
 * js/features/pwa-push.js
 * PWA install + Web Push opt-in / preferences for LO Sales Coach.
 */
(function () {
  'use strict';

  const PREFS_KEY = 'loPushPrefs_v1';
  const INSTALL_DISMISS_KEY = 'loPwaInstallDismissed_v1';
  const DEVICE_KEY = 'loPushDeviceId_v1';
  const ENGAGE_KEY = 'loPwaEngageCount_v1';
  const PITCH_PRACTICE_META = 'loPitchPracticeMeta_v1';

  const DEFAULT_PREFS = {
    masterEnabled: false,
    weeklyWinPlan: true,
    pitchPractice: true,
    softAskSeen: false,
    permission: 'default'
  };

  let deferredInstallPrompt = null;
  let vapidPublicKey = null;
  let swReg = null;

  function loadPrefs() {
    try {
      return Object.assign({}, DEFAULT_PREFS, JSON.parse(localStorage.getItem(PREFS_KEY) || '{}'));
    } catch (e) {
      return Object.assign({}, DEFAULT_PREFS);
    }
  }

  function savePrefs(p) {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(p));
    } catch (e) {
      /* ignore */
    }
  }

  function deviceId() {
    try {
      let id = localStorage.getItem(DEVICE_KEY);
      if (!id) {
        id = 'd_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem(DEVICE_KEY, id);
      }
      return id;
    } catch (e) {
      return 'd_anon';
    }
  }

  function userId() {
    try {
      if (typeof window.getUserProfile === 'function') {
        const p = window.getUserProfile() || {};
        if (p.email) return String(p.email).toLowerCase();
        if (p.name) return 'name:' + String(p.name).toLowerCase();
      }
    } catch (e) {
      /* ignore */
    }
    return null;
  }

  function isStandalone() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
  }

  function isIos() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr;
  }

  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('[pwa] service workers not supported');
      return null;
    }
    try {
      swReg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('[pwa] SW registered', swReg.scope);
      return swReg;
    } catch (e) {
      console.warn('[pwa] SW register failed', e);
      return null;
    }
  }

  async function fetchVapidPublicKey() {
    if (vapidPublicKey) return vapidPublicKey;
    const res = await fetch('/api/push/vapid-public-key');
    if (!res.ok) throw new Error('VAPID public key unavailable');
    const data = await res.json();
    vapidPublicKey = data.publicKey;
    return vapidPublicKey;
  }

  async function getSubscription() {
    const reg = swReg || (await navigator.serviceWorker.ready);
    return reg.pushManager.getSubscription();
  }

  async function subscribePush() {
    const reg = swReg || (await navigator.serviceWorker.ready);
    const key = await fetchVapidPublicKey();
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key)
      });
    }
    const prefs = loadPrefs();
    const body = {
      subscription: sub.toJSON(),
      userId: userId(),
      deviceId: deviceId(),
      prefs: {
        weeklyWinPlan: prefs.weeklyWinPlan !== false,
        pitchPractice: prefs.pitchPractice !== false
      }
    };
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Subscribe failed');
    }
    prefs.masterEnabled = true;
    prefs.permission = Notification.permission;
    savePrefs(prefs);
    console.log('[pwa] push subscribed');
    return sub;
  }

  async function unsubscribePush() {
    try {
      const sub = await getSubscription();
      if (sub) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint })
        });
        await sub.unsubscribe();
      }
    } catch (e) {
      console.warn('[pwa] unsubscribe', e);
    }
    const prefs = loadPrefs();
    prefs.masterEnabled = false;
    savePrefs(prefs);
  }

  async function syncPrefsToServer() {
    try {
      const sub = await getSubscription();
      if (!sub) return;
      const prefs = loadPrefs();
      await fetch('/api/push/prefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          prefs: {
            weeklyWinPlan: !!prefs.weeklyWinPlan,
            pitchPractice: !!prefs.pitchPractice
          }
        })
      });
    } catch (e) {
      console.warn('[pwa] prefs sync', e);
    }
  }

  /**
   * Ask the backend to send a push of the given type to this device (and others with prefs).
   * Only if master enabled + browser permission granted + type toggle on.
   */
  async function requestPush(type, payload) {
    const prefs = loadPrefs();
    if (!prefs.masterEnabled) return { skipped: true, reason: 'master off' };
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      return { skipped: true, reason: 'permission' };
    }
    if (type === 'weekly-win-plan' && prefs.weeklyWinPlan === false) {
      return { skipped: true, reason: 'pref' };
    }
    if (type === 'pitch-practice' && prefs.pitchPractice === false) {
      return { skipped: true, reason: 'pref' };
    }
    try {
      const sub = await getSubscription();
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          Object.assign({ type: type, endpoint: sub ? sub.endpoint : undefined }, payload || {})
        )
      });
      const data = await res.json().catch(() => ({}));
      console.log('[pwa] push send', type, data);
      return data;
    } catch (e) {
      console.warn('[pwa] push send failed', e);
      return { ok: false, error: e.message };
    }
  }

  // ─── Install banner ────────────────────────────────────────

  function shouldShowInstallBanner() {
    if (isStandalone()) return false;
    try {
      if (localStorage.getItem(INSTALL_DISMISS_KEY) === '1') return false;
    } catch (e) {
      /* ignore */
    }
    // Need either beforeinstallprompt (Chromium) or iOS guidance
    if (!deferredInstallPrompt && !isIos()) return false;
    let engage = 0;
    try {
      engage = parseInt(localStorage.getItem(ENGAGE_KEY) || '0', 10) || 0;
    } catch (e) {
      /* ignore */
    }
    return engage >= 3;
  }

  function bumpEngage() {
    try {
      const n = (parseInt(localStorage.getItem(ENGAGE_KEY) || '0', 10) || 0) + 1;
      localStorage.setItem(ENGAGE_KEY, String(n));
      if (n === 3 || n === 6) maybeShowInstallBanner();
      if (n === 4 || n === 8) maybeSoftAskPush();
    } catch (e) {
      /* ignore */
    }
  }

  function ensureInstallBanner() {
    let el = document.getElementById('lo-pwa-install-banner');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'lo-pwa-install-banner';
    el.className = 'lo-pwa-banner hidden';
    el.innerHTML =
      '<div class="lo-pwa-banner-inner">' +
      '<div class="lo-pwa-banner-copy">' +
      '<strong>Install LO Sales Coach</strong>' +
      '<span class="lo-pwa-banner-sub" id="lo-pwa-install-sub">Add to your home screen for faster access.</span>' +
      '</div>' +
      '<div class="lo-pwa-banner-actions">' +
      '<button type="button" class="lo-pwa-btn lo-pwa-btn-primary" id="lo-pwa-install-go">Install</button>' +
      '<button type="button" class="lo-pwa-btn lo-pwa-btn-ghost" id="lo-pwa-install-dismiss">Not now</button>' +
      '</div></div>';
    document.body.appendChild(el);
    document.getElementById('lo-pwa-install-dismiss').addEventListener('click', function () {
      try {
        localStorage.setItem(INSTALL_DISMISS_KEY, '1');
      } catch (e) {
        /* ignore */
      }
      el.classList.add('hidden');
    });
    document.getElementById('lo-pwa-install-go').addEventListener('click', async function () {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        try {
          await deferredInstallPrompt.userChoice;
        } catch (e) {
          /* ignore */
        }
        deferredInstallPrompt = null;
        el.classList.add('hidden');
      } else if (isIos()) {
        // instructions already shown in sub
      }
    });
    return el;
  }

  function maybeShowInstallBanner() {
    if (!shouldShowInstallBanner()) return;
    const el = ensureInstallBanner();
    const sub = document.getElementById('lo-pwa-install-sub');
    if (isIos() && !deferredInstallPrompt) {
      if (sub) {
        sub.textContent =
          'On iPhone: Share → Add to Home Screen. Then open from the icon for the best experience.';
      }
      const go = document.getElementById('lo-pwa-install-go');
      if (go) go.textContent = 'Got it';
    }
    el.classList.remove('hidden');
  }

  // ─── Soft ask for push ─────────────────────────────────────

  function ensureSoftAsk() {
    let el = document.getElementById('lo-push-soft-ask');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'lo-push-soft-ask';
    el.className = 'lo-pwa-modal hidden';
    el.innerHTML =
      '<div class="lo-pwa-modal-card" role="dialog" aria-labelledby="lo-push-soft-title">' +
      '<h3 id="lo-push-soft-title">Helpful reminders from your coach</h3>' +
      '<p>Get a gentle nudge when your <strong>Weekly Win Plan</strong> is ready or when it’s a good time to <strong>practice your pitch</strong>. No spam — just the moments that matter.</p>' +
      '<ul class="lo-pwa-soft-list">' +
      '<li>Weekly Win Plan ready</li>' +
      '<li>Pitch practice reminder</li>' +
      '</ul>' +
      '<div id="lo-push-ios-hint" class="lo-pwa-ios-hint hidden">' +
      'On iPhone, install to your <strong>Home Screen</strong> first (Share → Add to Home Screen), open the app from that icon, then enable notifications.' +
      '</div>' +
      '<div class="lo-pwa-modal-actions">' +
      '<button type="button" class="lo-pwa-btn lo-pwa-btn-primary" id="lo-push-soft-yes">Yes, keep me on track</button>' +
      '<button type="button" class="lo-pwa-btn lo-pwa-btn-ghost" id="lo-push-soft-no">Not now</button>' +
      '</div></div>';
    document.body.appendChild(el);
    document.getElementById('lo-push-soft-no').addEventListener('click', function () {
      const p = loadPrefs();
      p.softAskSeen = true;
      savePrefs(p);
      el.classList.add('hidden');
    });
    document.getElementById('lo-push-soft-yes').addEventListener('click', async function () {
      el.classList.add('hidden');
      const p = loadPrefs();
      p.softAskSeen = true;
      savePrefs(p);
      await enableNotificationsFromUser();
      refreshPrefsUi();
    });
    return el;
  }

  function maybeSoftAskPush() {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'granted' || Notification.permission === 'denied') return;
    const prefs = loadPrefs();
    if (prefs.softAskSeen || prefs.masterEnabled) return;
    if (isIos() && !isStandalone()) {
      const el = ensureSoftAsk();
      const hint = document.getElementById('lo-push-ios-hint');
      if (hint) hint.classList.remove('hidden');
      el.classList.remove('hidden');
      return;
    }
    ensureSoftAsk().classList.remove('hidden');
  }

  async function enableNotificationsFromUser() {
    if (typeof Notification === 'undefined') {
      toast('Notifications are not supported in this browser.');
      return false;
    }
    if (isIos() && !isStandalone()) {
      toast('Install to Home Screen first, then open from the icon to enable notifications.');
      maybeShowInstallBanner();
      return false;
    }
    try {
      const perm = await Notification.requestPermission();
      const prefs = loadPrefs();
      prefs.permission = perm;
      savePrefs(prefs);
      if (perm !== 'granted') {
        if (perm === 'denied') {
          toast('Notifications blocked. You can re-enable them in browser settings.');
        }
        return false;
      }
      await subscribePush();
      toast('Notifications on — we’ll keep it high-signal.');
      return true;
    } catch (e) {
      console.warn('[pwa] enable failed', e);
      toast('Could not enable notifications: ' + (e.message || 'error'));
      return false;
    }
  }

  function toast(msg) {
    if (typeof window.showToast === 'function') window.showToast(msg);
    else console.log('[pwa]', msg);
  }

  // ─── Preference center UI ──────────────────────────────────

  function ensurePrefsPanel() {
    // Standalone panel host (also injects into profile if present)
    let host = document.getElementById('lo-push-prefs-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'lo-push-prefs-host';
      host.className = 'lo-push-prefs-host';
      // Prefer profile personal panel
      const personal = document.getElementById('profile-tab-panel-personal');
      if (personal) {
        const wrap = document.createElement('div');
        wrap.className = 'mt-6 pt-4 border-t border-gray-200 dark:border-gray-700';
        wrap.appendChild(host);
        personal.appendChild(wrap);
      } else {
        document.body.appendChild(host);
        host.classList.add('lo-push-prefs-host--floating');
      }
    }
    renderPrefsPanel(host);
    return host;
  }

  function renderPrefsPanel(host) {
    const prefs = loadPrefs();
    const perm =
      typeof Notification !== 'undefined' ? Notification.permission : 'unsupported';
    host.innerHTML =
      '<div class="lo-push-prefs">' +
      '<h4 class="lo-push-prefs-title"><i class="fas fa-bell text-[#00A89D]"></i> Notifications</h4>' +
      '<p class="lo-push-prefs-lead">Gentle coach reminders only — Weekly Win Plan and pitch practice. Never spam.</p>' +
      '<div class="lo-push-prefs-status">Browser permission: <strong>' +
      escapeHtml(perm) +
      '</strong>' +
      (isStandalone() ? ' · Installed app' : ' · Browser tab') +
      '</div>' +
      (perm === 'denied'
        ? '<p class="lo-push-prefs-denied">Notifications are blocked. In your browser settings, allow notifications for this site, then come back and enable below.</p>'
        : '') +
      '<label class="lo-push-toggle"><input type="checkbox" id="lo-push-master" ' +
      (prefs.masterEnabled && perm === 'granted' ? 'checked' : '') +
      '> Enable push notifications</label>' +
      '<label class="lo-push-toggle"><input type="checkbox" id="lo-push-wwp" ' +
      (prefs.weeklyWinPlan !== false ? 'checked' : '') +
      '> Weekly Win Plan reminders</label>' +
      '<label class="lo-push-toggle"><input type="checkbox" id="lo-push-pitch" ' +
      (prefs.pitchPractice !== false ? 'checked' : '') +
      '> My Pitch practice reminders</label>' +
      '<div class="lo-push-prefs-actions">' +
      '<button type="button" class="lo-pwa-btn lo-pwa-btn-ghost" id="lo-push-test">Send test notification</button>' +
      '</div></div>';

    const master = host.querySelector('#lo-push-master');
    master.addEventListener('change', async function () {
      if (master.checked) {
        const ok = await enableNotificationsFromUser();
        if (!ok) master.checked = false;
      } else {
        await unsubscribePush();
        toast('Notifications off');
      }
      refreshPrefsUi();
    });
    host.querySelector('#lo-push-wwp').addEventListener('change', function (e) {
      const p = loadPrefs();
      p.weeklyWinPlan = e.target.checked;
      savePrefs(p);
      syncPrefsToServer();
    });
    host.querySelector('#lo-push-pitch').addEventListener('change', function (e) {
      const p = loadPrefs();
      p.pitchPractice = e.target.checked;
      savePrefs(p);
      syncPrefsToServer();
    });
    host.querySelector('#lo-push-test').addEventListener('click', async function () {
      const p = loadPrefs();
      if (!p.masterEnabled || Notification.permission !== 'granted') {
        toast('Enable notifications first');
        return;
      }
      await requestPush('test', {
        title: 'LO Sales Coach',
        body: 'Test notification — you’re all set.',
        url: '/'
      });
      toast('Test sent');
    });
  }

  function refreshPrefsUi() {
    const host = document.getElementById('lo-push-prefs-host');
    if (host) renderPrefsPanel(host);
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ─── High-value triggers ───────────────────────────────────

  function onWeeklyWinPlanGenerated() {
    requestPush('weekly-win-plan', {
      title: 'Weekly Win Plan ready',
      body: 'Your Weekly Win Plan is ready — 3 clear actions for this week.',
      url: '/#weekly-win-plan'
    });
  }

  function onPitchSaved(meta) {
    meta = meta || {};
    const type = meta.type || 'consumer';
    const pitchId = meta.id || '';
    // Track update time; only nudge if not practiced recently
    let store = {};
    try {
      store = JSON.parse(localStorage.getItem(PITCH_PRACTICE_META) || '{}');
    } catch (e) {
      store = {};
    }
    const now = Date.now();
    const lastPractice = store[pitchId] && store[pitchId].lastPracticeAt
      ? Date.parse(store[pitchId].lastPracticeAt)
      : 0;
    const days = lastPractice ? (now - lastPractice) / (86400000) : 999;
    store[pitchId] = Object.assign({}, store[pitchId] || {}, {
      lastUpdatedAt: new Date().toISOString(),
      type: type
    });
    try {
      localStorage.setItem(PITCH_PRACTICE_META, JSON.stringify(store));
    } catch (e) {
      /* ignore */
    }
    if (days < 2) {
      console.log('[pwa] skip pitch practice push — practiced recently');
      return;
    }
    const label =
      type === 'realtor' ? 'Realtor partner' : type === 'short' ? '30-sec' : 'Consumer';
    requestPush('pitch-practice', {
      title: 'Practice your pitch',
      body: 'Ready to practice your ' + label + ' pitch? Takes about 60 seconds.',
      url: pitchId ? '/#my-pitch?pitch=' + encodeURIComponent(pitchId) : '/#my-pitch'
    });
  }

  function markPitchPracticed(pitchId) {
    if (!pitchId) return;
    let store = {};
    try {
      store = JSON.parse(localStorage.getItem(PITCH_PRACTICE_META) || '{}');
    } catch (e) {
      store = {};
    }
    store[pitchId] = Object.assign({}, store[pitchId] || {}, {
      lastPracticeAt: new Date().toISOString()
    });
    try {
      localStorage.setItem(PITCH_PRACTICE_META, JSON.stringify(store));
    } catch (e) {
      /* ignore */
    }
  }

  // ─── Navigate from notification ────────────────────────────

  function handleNavigateMessage(url) {
    try {
      const u = new URL(url, window.location.origin);
      const hash = (u.hash || '').replace(/^#/, '') || u.pathname.replace(/^\//, '');
      const section = (hash.split('?')[0] || 'home').trim();
      if (section && typeof window.showSection === 'function') {
        window.showSection(section);
      }
      // pitch deep link
      const q = u.hash.indexOf('?') >= 0 ? u.hash.split('?')[1] : u.search.replace(/^\?/, '');
      if (q) {
        const params = new URLSearchParams(q);
        const pitchId = params.get('pitch');
        if (pitchId && typeof window.openMyPitch === 'function') {
          setTimeout(function () {
            if (typeof window.showSection === 'function') window.showSection('my-pitch');
            // open detail if my-pitch exposes it later; hash is enough for now
          }, 200);
        }
      }
    } catch (e) {
      console.warn('[pwa] navigate', e);
    }
  }

  // ─── Init ──────────────────────────────────────────────────

  function init() {
    registerServiceWorker().then(function (reg) {
      if (reg) swReg = reg;
    });

    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredInstallPrompt = e;
      console.log('[pwa] beforeinstallprompt captured');
    });

    window.addEventListener('appinstalled', function () {
      deferredInstallPrompt = null;
      try {
        localStorage.setItem(INSTALL_DISMISS_KEY, '1');
      } catch (e) {
        /* ignore */
      }
      const b = document.getElementById('lo-pwa-install-banner');
      if (b) b.classList.add('hidden');
      toast('Installed — open from your home screen anytime.');
    });

    // Engagement via section navigation
    const prevHook = window.onCoachSectionShown;
    window.onCoachSectionShown = function (id) {
      if (typeof prevHook === 'function') {
        try {
          prevHook(id);
        } catch (e) {
          /* ignore */
        }
      }
      bumpEngage();
    };

    navigator.serviceWorker &&
      navigator.serviceWorker.addEventListener('message', function (ev) {
        if (ev.data && ev.data.type === 'lo-push-navigate') {
          handleNavigateMessage(ev.data.url || '/');
        }
      });

    // Delayed install + soft ask after some dwell time
    setTimeout(function () {
      bumpEngage();
      maybeShowInstallBanner();
    }, 45000);

    // Prefs panel when profile UI is ready
    setTimeout(ensurePrefsPanel, 1500);
    document.addEventListener('coach-features-loaded', function () {
      setTimeout(ensurePrefsPanel, 400);
    });

    // Public API
    window.CoachPwa = {
      enableNotifications: enableNotificationsFromUser,
      disableNotifications: unsubscribePush,
      requestPush: requestPush,
      onWeeklyWinPlanGenerated: onWeeklyWinPlanGenerated,
      onPitchSaved: onPitchSaved,
      markPitchPracticed: markPitchPracticed,
      openPrefs: function () {
        ensurePrefsPanel();
        if (typeof window.openUserProfile === 'function') window.openUserProfile(true);
        // switch to personal tab if possible
        if (typeof window.switchProfileTab === 'function') {
          try {
            window.switchProfileTab('personal');
          } catch (e) {
            /* ignore */
          }
        }
        const host = document.getElementById('lo-push-prefs-host');
        if (host) host.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      },
      loadPrefs: loadPrefs,
      isStandalone: isStandalone
    };

    console.log('%c[pwa-push] ready', 'color:#00A89D');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
