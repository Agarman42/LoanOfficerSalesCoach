/**
 * js/features/auth-gate.js
 * Invite-gated sign-in for Realtor / Agent Sales Coach.
 * Blocks tool chrome until session is valid; paints login / invite / request UI.
 */
(function () {
  'use strict';

  const GATE_ID = 'asc-auth-gate';
  const STYLE_ID = 'asc-auth-gate-style';

  let currentUser = null;
  let booted = false;

  function apiBase() {
    // Same origin (proxy serves app + API)
    return '';
  }

  async function api(path, opts) {
    opts = opts || {};
    const res = await fetch(apiBase() + path, {
      method: opts.method || 'GET',
      credentials: 'include',
      headers: Object.assign(
        { Accept: 'application/json' },
        opts.body ? { 'Content-Type': 'application/json' } : {},
        opts.headers || {}
      ),
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    let data = null;
    try {
      data = await res.json();
    } catch (e) {
      data = null;
    }
    return { res, data, ok: res.ok };
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
#${GATE_ID}{
  position:fixed;inset:0;z-index:99990;
  display:flex;align-items:center;justify-content:center;
  padding:1.25rem;
  background:linear-gradient(145deg,#001429 0%,#002B5C 45%,#0f766e 100%);
  font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
  color:#0f172a;
}
#${GATE_ID} .asc-card{
  width:100%;max-width:420px;background:#fff;border-radius:1.35rem;
  box-shadow:0 25px 60px -20px rgba(0,0,0,.45);
  padding:1.6rem 1.5rem 1.4rem;position:relative;
}
#${GATE_ID} .asc-brand{
  display:flex;align-items:center;gap:.65rem;margin-bottom:1rem;
}
#${GATE_ID} .asc-brand-mark{
  width:2.5rem;height:2.5rem;border-radius:.85rem;
  background:linear-gradient(135deg,#00A89D,#0d9488);
  color:#fff;display:flex;align-items:center;justify-content:center;
  font-weight:900;font-size:.95rem;
}
#${GATE_ID} h1{margin:0;font-size:1.25rem;font-weight:900;color:#002B5C;letter-spacing:-.02em}
#${GATE_ID} .asc-sub{margin:.2rem 0 0;font-size:.82rem;color:#64748b;line-height:1.4}
#${GATE_ID} .asc-tabs{display:flex;gap:.35rem;margin:1rem 0 .85rem;flex-wrap:wrap}
#${GATE_ID} .asc-tab{
  border:1px solid #e2e8f0;background:#f8fafc;color:#334155;
  border-radius:999px;padding:.35rem .75rem;font-size:.75rem;font-weight:700;cursor:pointer;
}
#${GATE_ID} .asc-tab.is-on{background:#00A89D;border-color:#00A89D;color:#fff}
#${GATE_ID} label{display:block;font-size:.72rem;font-weight:800;color:#002B5C;margin:.55rem 0 .25rem}
#${GATE_ID} input[type=text],#${GATE_ID} input[type=email],#${GATE_ID} input[type=password]{
  width:100%;box-sizing:border-box;border:2px solid #e2e8f0;border-radius:.75rem;
  padding:.6rem .75rem;font-size:.9rem;font-family:inherit;
}
#${GATE_ID} input:focus{outline:none;border-color:#00A89D;box-shadow:0 0 0 3px rgba(0,168,157,.15)}
#${GATE_ID} .asc-row{display:flex;align-items:center;gap:.45rem;margin:.65rem 0;font-size:.8rem;color:#475569}
#${GATE_ID} .asc-row input{width:auto}
#${GATE_ID} .asc-btn{
  width:100%;margin-top:.75rem;border:0;border-radius:999px;padding:.7rem 1rem;
  font-weight:800;font-size:.9rem;cursor:pointer;
  background:linear-gradient(135deg,#00A89D,#0d9488);color:#fff;
  box-shadow:0 10px 22px -10px rgba(0,168,157,.7);
}
#${GATE_ID} .asc-btn:disabled{opacity:.55;cursor:not-allowed}
#${GATE_ID} .asc-btn-ghost{
  background:#fff;color:#0f766e;border:1px solid rgba(0,168,157,.4);
  box-shadow:none;margin-top:.45rem;
}
#${GATE_ID} .asc-err{
  display:none;margin-top:.65rem;padding:.55rem .7rem;border-radius:.7rem;
  background:#fef2f2;color:#b91c1c;font-size:.8rem;font-weight:600;
}
#${GATE_ID} .asc-err.is-on{display:block}
#${GATE_ID} .asc-ok{
  display:none;margin-top:.65rem;padding:.55rem .7rem;border-radius:.7rem;
  background:#ecfdf5;color:#047857;font-size:.8rem;font-weight:600;
}
#${GATE_ID} .asc-ok.is-on{display:block}
#${GATE_ID} .asc-hint{margin-top:.85rem;font-size:.72rem;color:#94a3b8;line-height:1.4;text-align:center}
body.asc-auth-locked > :not(#${GATE_ID}){visibility:hidden!important;pointer-events:none!important}
body.asc-auth-locked{overflow:hidden}
.asc-account-menu{position:relative;display:inline-flex;align-items:center}
.asc-account-btn{
  display:inline-flex;align-items:center;gap:.4rem;
  border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.1);
  color:#fff;border-radius:999px;padding:.35rem .7rem;font-size:.75rem;font-weight:700;cursor:pointer;
}
.asc-account-btn:hover{background:rgba(255,255,255,.18)}
.asc-account-drop{
  display:none;position:absolute;right:0;top:calc(100% + .35rem);min-width:200px;
  background:#fff;color:#0f172a;border-radius:.85rem;box-shadow:0 12px 30px -12px rgba(0,0,0,.35);
  padding:.45rem;z-index:80;border:1px solid #e2e8f0;
}
.asc-account-drop.is-open{display:block}
.asc-account-drop .asc-who{padding:.45rem .55rem;font-size:.78rem;border-bottom:1px solid #f1f5f9;margin-bottom:.25rem}
.asc-account-drop .asc-who strong{display:block;color:#002B5C}
.asc-account-drop .asc-who span{color:#64748b;font-size:.72rem;word-break:break-all}
.asc-account-drop button{
  width:100%;text-align:left;border:0;background:transparent;padding:.45rem .55rem;
  border-radius:.55rem;font-size:.8rem;font-weight:700;color:#0f172a;cursor:pointer;
}
.asc-account-drop button:hover{background:#f1f5f9}
.asc-account-drop button.danger{color:#b91c1c}
#sidebar a[href="#admin-usage"]{display:none}
body.asc-is-admin #sidebar a[href="#admin-usage"]{display:flex}
`;
    document.head.appendChild(s);
  }

  function setBodyLocked(locked) {
    document.body.classList.toggle('asc-auth-locked', !!locked);
  }

  function showError(el, msg) {
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('is-on', !!msg);
  }

  function showOk(el, msg) {
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('is-on', !!msg);
  }

  function parseHashInvite() {
    const h = location.hash || '';
    const m = h.match(/invite=([^&]+)/i);
    if (m) return decodeURIComponent(m[1]);
    const q = new URLSearchParams(location.search || '');
    return q.get('invite') || '';
  }

  function renderGate(mode) {
    injectStyles();
    document.documentElement.classList.remove('asc-awaiting-auth');
    let root = document.getElementById(GATE_ID);
    if (!root) {
      root = document.createElement('div');
      root.id = GATE_ID;
      root.setAttribute('role', 'dialog');
      root.setAttribute('aria-modal', 'true');
      root.setAttribute('aria-label', 'Sign in');
      document.body.appendChild(root);
    }
    setBodyLocked(true);
    mode = mode || 'login';
    const invitePrefill = parseHashInvite();

    root.innerHTML =
      '<div class="asc-card">' +
      '<div class="asc-brand"><div class="asc-brand-mark">AG</div>' +
      '<div><h1>Agent Sales Coach</h1>' +
      '<p class="asc-sub">Sign in with your invite to use the tools. Remember this device for 30 days.</p></div></div>' +
      '<div class="asc-tabs" role="tablist">' +
      '<button type="button" class="asc-tab' +
      (mode === 'login' ? ' is-on' : '') +
      '" data-mode="login">Sign in</button>' +
      '<button type="button" class="asc-tab' +
      (mode === 'invite' ? ' is-on' : '') +
      '" data-mode="invite">Accept invite</button>' +
      '<button type="button" class="asc-tab' +
      (mode === 'request' ? ' is-on' : '') +
      '" data-mode="request">Request access</button>' +
      '</div>' +
      '<div id="asc-gate-panel"></div>' +
      '<div class="asc-err" id="asc-gate-err"></div>' +
      '<div class="asc-ok" id="asc-gate-ok"></div>' +
      '<p class="asc-hint">Access is invite-only for Ruoff referral partners. Questions? Ask your loan officer.</p>' +
      '</div>';

    root.querySelectorAll('.asc-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        renderGate(btn.getAttribute('data-mode'));
      });
    });

    const panel = root.querySelector('#asc-gate-panel');
    const errEl = root.querySelector('#asc-gate-err');
    const okEl = root.querySelector('#asc-gate-ok');

    if (mode === 'login') {
      panel.innerHTML =
        '<form id="asc-login-form">' +
        '<label for="asc-email">Email</label>' +
        '<input id="asc-email" name="email" type="email" autocomplete="username" required placeholder="you@example.com">' +
        '<label for="asc-pass">Password</label>' +
        '<input id="asc-pass" name="password" type="password" autocomplete="current-password" required placeholder="••••••••">' +
        '<div class="asc-row"><input type="checkbox" id="asc-remember" checked> <label for="asc-remember" style="margin:0;font-weight:600">Remember this device (30 days)</label></div>' +
        '<button type="submit" class="asc-btn" id="asc-login-btn">Sign in</button>' +
        '<button type="button" class="asc-btn asc-btn-ghost" id="asc-forgot-btn">Forgot password?</button>' +
        '</form>';
      panel.querySelector('#asc-login-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        showError(errEl, '');
        showOk(okEl, '');
        const btn = panel.querySelector('#asc-login-btn');
        btn.disabled = true;
        try {
          const { res, data } = await api('/api/auth/login', {
            method: 'POST',
            body: {
              email: panel.querySelector('#asc-email').value,
              password: panel.querySelector('#asc-pass').value,
              remember: panel.querySelector('#asc-remember').checked
            }
          });
          if (!res.ok) {
            showError(errEl, (data && data.error) || 'Sign in failed');
            return;
          }
          currentUser = data.user;
          onAuthenticated();
        } catch (err) {
          showError(errEl, 'Network error — is the server running?');
        } finally {
          btn.disabled = false;
        }
      });
      panel.querySelector('#asc-forgot-btn').addEventListener('click', async function () {
        showError(errEl, '');
        showOk(okEl, '');
        const email = panel.querySelector('#asc-email').value;
        if (!email) {
          showError(errEl, 'Enter your email first');
          return;
        }
        const { data } = await api('/api/auth/forgot-password', {
          method: 'POST',
          body: { email }
        });
        showOk(
          okEl,
          (data && data.message) ||
            'If that account exists, your admin can issue a temporary password from /admin.'
        );
      });
    } else if (mode === 'invite') {
      panel.innerHTML =
        '<form id="asc-invite-form">' +
        '<label for="asc-code">Invite code</label>' +
        '<input id="asc-code" type="text" required placeholder="e.g. AB12CD" value="' +
        escapeAttr(invitePrefill) +
        '">' +
        '<label for="asc-iname">Your name</label>' +
        '<input id="asc-iname" type="text" required autocomplete="name" placeholder="Full name">' +
        '<label for="asc-iemail">Email</label>' +
        '<input id="asc-iemail" type="email" required autocomplete="email" placeholder="you@example.com">' +
        '<label for="asc-icompany">Company (optional)</label>' +
        '<input id="asc-icompany" type="text" placeholder="Brokerage">' +
        '<label for="asc-ilo">Ruoff LO you work with (optional)</label>' +
        '<input id="asc-ilo" type="text" placeholder="LO name">' +
        '<label for="asc-ipass">Create password (min 8)</label>' +
        '<input id="asc-ipass" type="password" required minlength="8" autocomplete="new-password">' +
        '<div class="asc-row"><input type="checkbox" id="asc-iremember" checked> <label for="asc-iremember" style="margin:0;font-weight:600">Remember this device</label></div>' +
        '<button type="submit" class="asc-btn">Create account &amp; enter</button>' +
        '</form>';
      panel.querySelector('#asc-invite-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        showError(errEl, '');
        const btn = e.target.querySelector('.asc-btn');
        btn.disabled = true;
        try {
          const { res, data } = await api('/api/auth/accept-invite', {
            method: 'POST',
            body: {
              code: panel.querySelector('#asc-code').value,
              name: panel.querySelector('#asc-iname').value,
              email: panel.querySelector('#asc-iemail').value,
              company: panel.querySelector('#asc-icompany').value,
              referred_by_lo_name: panel.querySelector('#asc-ilo').value,
              password: panel.querySelector('#asc-ipass').value,
              remember: panel.querySelector('#asc-iremember').checked
            }
          });
          if (!res.ok) {
            showError(errEl, (data && data.error) || 'Invite failed');
            return;
          }
          currentUser = data.user;
          // Clean invite from hash
          if (location.hash && /invite=/i.test(location.hash)) {
            history.replaceState(null, '', location.pathname + location.search);
          }
          onAuthenticated();
        } catch (err) {
          showError(errEl, 'Network error');
        } finally {
          btn.disabled = false;
        }
      });
    } else {
      panel.innerHTML =
        '<form id="asc-req-form">' +
        '<label for="asc-rname">Your name</label>' +
        '<input id="asc-rname" type="text" required>' +
        '<label for="asc-remail">Email</label>' +
        '<input id="asc-remail" type="email" required>' +
        '<label for="asc-rco">Company</label>' +
        '<input id="asc-rco" type="text">' +
        '<label for="asc-rlo">Ruoff LO you work with</label>' +
        '<input id="asc-rlo" type="text" placeholder="Helps us approve faster">' +
        '<label for="asc-rnote">Note (optional)</label>' +
        '<input id="asc-rnote" type="text" placeholder="Who invited you?" maxLength="500">' +
        '<button type="submit" class="asc-btn">Submit request</button>' +
        '</form>';
      panel.querySelector('#asc-req-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        showError(errEl, '');
        showOk(okEl, '');
        const btn = e.target.querySelector('.asc-btn');
        btn.disabled = true;
        try {
          const { res, data } = await api('/api/auth/request-access', {
            method: 'POST',
            body: {
              name: panel.querySelector('#asc-rname').value,
              email: panel.querySelector('#asc-remail').value,
              company: panel.querySelector('#asc-rco').value,
              referred_by_lo_name: panel.querySelector('#asc-rlo').value,
              note: panel.querySelector('#asc-rnote').value
            }
          });
          if (!res.ok) {
            showError(errEl, (data && data.error) || 'Request failed');
            return;
          }
          showOk(okEl, (data && data.message) || 'Request submitted.');
          e.target.reset();
        } catch (err) {
          showError(errEl, 'Network error');
        } finally {
          btn.disabled = false;
        }
      });
    }
  }

  function escapeAttr(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
  }

  function removeGate() {
    const root = document.getElementById(GATE_ID);
    if (root) root.remove();
    setBodyLocked(false);
  }

  function onAuthenticated() {
    removeGate();
    document.documentElement.classList.remove('asc-awaiting-auth');
    document.body.classList.toggle('asc-is-admin', currentUser && currentUser.role === 'admin');
    // Show admin sidebar link (inline style was display:none for realtors)
    try {
      document.querySelectorAll('#sidebar a[href="#admin-usage"]').forEach(function (a) {
        a.style.display = currentUser && currentUser.role === 'admin' ? '' : 'none';
      });
    } catch (e) {
      /* ignore */
    }
    paintAccountMenu();
    window.__ascUser = currentUser;
    window.dispatchEvent(
      new CustomEvent('asc-auth-ready', { detail: { user: currentUser } })
    );
    // Soft track home open
    api('/api/auth/track', {
      method: 'POST',
      body: { event_type: 'tool_open', feature: 'app' }
    }).catch(function () {});
  }

  function paintAccountMenu() {
    injectStyles();
    const cluster = document.querySelector('.header-quote-actions');
    if (!cluster || !currentUser) return;
    let wrap = document.getElementById('asc-account-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'asc-account-wrap';
      wrap.className = 'asc-account-menu';
      cluster.insertBefore(wrap, cluster.firstChild);
    }
    const shortName = (currentUser.name || currentUser.email || 'Account').split(' ')[0];
    wrap.innerHTML =
      '<button type="button" class="asc-account-btn" id="asc-account-btn" aria-haspopup="true" aria-expanded="false">' +
      '<i class="fas fa-user-circle" aria-hidden="true"></i> ' +
      '<span class="hidden sm:inline">' +
      escapeAttr(shortName) +
      '</span></button>' +
      '<div class="asc-account-drop" id="asc-account-drop" role="menu">' +
      '<div class="asc-who"><strong>' +
      escapeAttr(currentUser.name || 'Account') +
      '</strong><span>' +
      escapeAttr(currentUser.email) +
      '</span></div>' +
      (currentUser.role === 'admin'
        ? '<button type="button" data-asc-admin>Admin · usage</button>'
        : '') +
      '<button type="button" class="danger" data-asc-logout>Sign out</button>' +
      '</div>';

    const btn = wrap.querySelector('#asc-account-btn');
    const drop = wrap.querySelector('#asc-account-drop');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      const open = !drop.classList.contains('is-open');
      drop.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener(
      'click',
      function () {
        drop.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      },
      { once: false }
    );
    const logoutBtn = wrap.querySelector('[data-asc-logout]');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async function () {
        await api('/api/auth/logout', { method: 'POST' });
        currentUser = null;
        window.__ascUser = null;
        document.body.classList.remove('asc-is-admin');
        wrap.remove();
        renderGate('login');
      });
    }
    const adminBtn = wrap.querySelector('[data-asc-admin]');
    if (adminBtn) {
      adminBtn.addEventListener('click', function () {
        if (typeof window.showSection === 'function') {
          window.showSection('admin-usage');
        } else {
          location.hash = 'admin-usage';
        }
      });
    }
  }

  async function bootstrap() {
    if (booted) return;
    booted = true;
    injectStyles();
    // Lock immediately while we check session (avoids flash of full app)
    setBodyLocked(true);
    try {
      const { res, data } = await api('/api/auth/me');
      if (res.ok && data && data.authenticated && data.user) {
        currentUser = data.user;
        onAuthenticated();
        return;
      }
    } catch (e) {
      /* offline / server down — still show login */
    }
    const invite = parseHashInvite();
    renderGate(invite ? 'invite' : 'login');
  }

  // Public helpers
  window.ascAuth = {
    getUser: function () {
      return currentUser;
    },
    api: api,
    logout: async function () {
      await api('/api/auth/logout', { method: 'POST' });
      currentUser = null;
      renderGate('login');
    },
    refresh: bootstrap
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
