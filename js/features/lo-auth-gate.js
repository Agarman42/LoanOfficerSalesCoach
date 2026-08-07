/**
 * LO Sales Coach — invite-gated auth for Ruoff loan officers.
 * One-time setup with @ruoff.com; remember device 30 days.
 */
(function () {
  'use strict';

  const GATE_ID = 'lo-auth-gate';
  const STYLE_ID = 'lo-auth-gate-style';
  let currentUser = null;
  let booted = false;

  async function api(path, opts) {
    opts = opts || {};
    const res = await fetch(path, {
      method: opts.method || 'GET',
      credentials: 'include',
      headers: Object.assign(
        { Accept: 'application/json' },
        opts.body ? { 'Content-Type': 'application/json' } : {}
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
#${GATE_ID}{position:fixed;inset:0;z-index:99990;display:flex;align-items:center;justify-content:center;padding:1.25rem;
background:linear-gradient(145deg,#001429 0%,#002B5C 48%,#0f766e 100%);font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a}
#${GATE_ID} .lo-card{width:100%;max-width:420px;background:#fff;border-radius:1.35rem;box-shadow:0 25px 60px -20px rgba(0,0,0,.45);padding:1.55rem 1.45rem 1.35rem}
#${GATE_ID} .lo-brand{display:flex;align-items:center;gap:.65rem;margin-bottom:1rem}
#${GATE_ID} .lo-mark{width:2.5rem;height:2.5rem;border-radius:.85rem;background:linear-gradient(135deg,#00A89D,#0d9488);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:.85rem}
#${GATE_ID} h1{margin:0;font-size:1.2rem;font-weight:900;color:#002B5C;letter-spacing:-.02em}
#${GATE_ID} .lo-sub{margin:.25rem 0 0;font-size:.82rem;color:#64748b;line-height:1.4}
#${GATE_ID} .lo-tabs{display:flex;gap:.35rem;margin:1rem 0 .85rem;flex-wrap:wrap}
#${GATE_ID} .lo-tab{border:1px solid #e2e8f0;background:#f8fafc;color:#334155;border-radius:999px;padding:.35rem .75rem;font-size:.75rem;font-weight:700;cursor:pointer}
#${GATE_ID} .lo-tab.is-on{background:#00A89D;border-color:#00A89D;color:#fff}
#${GATE_ID} label{display:block;font-size:.72rem;font-weight:800;color:#002B5C;margin:.55rem 0 .25rem}
#${GATE_ID} input[type=text],#${GATE_ID} input[type=email],#${GATE_ID} input[type=password]{width:100%;box-sizing:border-box;border:2px solid #e2e8f0;border-radius:.75rem;padding:.6rem .75rem;font-size:.9rem;font-family:inherit}
#${GATE_ID} input:focus{outline:none;border-color:#00A89D;box-shadow:0 0 0 3px rgba(0,168,157,.15)}
#${GATE_ID} .lo-row{display:flex;align-items:center;gap:.45rem;margin:.65rem 0;font-size:.8rem;color:#475569}
#${GATE_ID} .lo-row input{width:auto}
#${GATE_ID} .lo-btn{width:100%;margin-top:.75rem;border:0;border-radius:999px;padding:.7rem 1rem;font-weight:800;font-size:.9rem;cursor:pointer;background:linear-gradient(135deg,#00A89D,#0d9488);color:#fff}
#${GATE_ID} .lo-btn:disabled{opacity:.55;cursor:not-allowed}
#${GATE_ID} .lo-btn-ghost{background:#fff;color:#0f766e;border:1px solid rgba(0,168,157,.4);margin-top:.45rem}
#${GATE_ID} .lo-err{display:none;margin-top:.65rem;padding:.55rem .7rem;border-radius:.7rem;background:#fef2f2;color:#b91c1c;font-size:.8rem;font-weight:600}
#${GATE_ID} .lo-err.is-on{display:block}
#${GATE_ID} .lo-ok{display:none;margin-top:.65rem;padding:.55rem .7rem;border-radius:.7rem;background:#ecfdf5;color:#047857;font-size:.8rem;font-weight:600}
#${GATE_ID} .lo-ok.is-on{display:block}
#${GATE_ID} .lo-hint{margin-top:.85rem;font-size:.72rem;color:#94a3b8;line-height:1.4;text-align:center}
body.lo-auth-locked > :not(#${GATE_ID}){visibility:hidden!important;pointer-events:none!important}
body.lo-auth-locked{overflow:hidden}
.lo-account-menu{position:relative;display:inline-flex;align-items:center}
.lo-account-btn{display:inline-flex;align-items:center;gap:.4rem;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.1);color:#fff;border-radius:999px;padding:.35rem .7rem;font-size:.75rem;font-weight:700;cursor:pointer}
.lo-account-drop{display:none;position:absolute;right:0;top:calc(100% + .35rem);min-width:210px;background:#fff;color:#0f172a;border-radius:.85rem;box-shadow:0 12px 30px -12px rgba(0,0,0,.35);padding:.45rem;z-index:80;border:1px solid #e2e8f0}
.lo-account-drop.is-open{display:block}
.lo-account-drop .lo-who{padding:.45rem .55rem;font-size:.78rem;border-bottom:1px solid #f1f5f9;margin-bottom:.25rem}
.lo-account-drop .lo-who strong{display:block;color:#002B5C}
.lo-account-drop .lo-who span{color:#64748b;font-size:.72rem;word-break:break-all}
.lo-account-drop button{width:100%;text-align:left;border:0;background:transparent;padding:.45rem .55rem;border-radius:.55rem;font-size:.8rem;font-weight:700;color:#0f172a;cursor:pointer}
.lo-account-drop button:hover{background:#f1f5f9}
.lo-account-drop button.danger{color:#b91c1c}
#sidebar a[href="#lo-admin"],#sidebar a[href="#invite-realtors"]{display:none}
body.lo-is-admin #sidebar a[href="#lo-admin"]{display:flex}
body.lo-can-invite #sidebar a[href="#invite-realtors"]{display:flex}
html.lo-awaiting-auth body > :not(#lo-auth-gate):not(script):not(style){visibility:hidden!important}
`;
    document.head.appendChild(s);
  }

  function setLocked(on) {
    document.body.classList.toggle('lo-auth-locked', !!on);
  }

  function showErr(el, msg) {
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('is-on', !!msg);
  }

  function showOk(el, msg) {
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('is-on', !!msg);
  }

  function escapeAttr(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
  }

  function renderGate(mode) {
    injectStyles();
    document.documentElement.classList.remove('lo-awaiting-auth');
    let root = document.getElementById(GATE_ID);
    if (!root) {
      root = document.createElement('div');
      root.id = GATE_ID;
      root.setAttribute('role', 'dialog');
      root.setAttribute('aria-modal', 'true');
      document.body.appendChild(root);
    }
    setLocked(true);
    mode = mode || 'login';

    root.innerHTML =
      '<div class="lo-card"><div class="lo-brand"><div class="lo-mark">LO</div><div>' +
      '<h1>Loan Officer Sales Coach</h1>' +
      '<p class="lo-sub">One-time setup with your Ruoff email. You\'ll stay signed in on this device.</p></div></div>' +
      '<div class="lo-tabs">' +
      '<button type="button" class="lo-tab' +
      (mode === 'login' ? ' is-on' : '') +
      '" data-mode="login">Sign in</button>' +
      '<button type="button" class="lo-tab' +
      (mode === 'register' ? ' is-on' : '') +
      '" data-mode="register">Create account</button></div>' +
      '<div id="lo-gate-panel"></div>' +
      '<div class="lo-err" id="lo-gate-err"></div>' +
      '<div class="lo-ok" id="lo-gate-ok"></div>' +
      '<p class="lo-hint">Ruoff LOs only (@ruoff.com). Invite your realtors to the Agent Sales Coach from inside the app.</p></div>';

    root.querySelectorAll('.lo-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        renderGate(btn.getAttribute('data-mode'));
      });
    });

    const panel = root.querySelector('#lo-gate-panel');
    const errEl = root.querySelector('#lo-gate-err');
    const okEl = root.querySelector('#lo-gate-ok');

    if (mode === 'login') {
      panel.innerHTML =
        '<form id="lo-login-form">' +
        '<label for="lo-email">Ruoff email</label>' +
        '<input id="lo-email" type="email" required autocomplete="username" placeholder="you@ruoff.com">' +
        '<label for="lo-pass">Password</label>' +
        '<input id="lo-pass" type="password" required autocomplete="current-password">' +
        '<div class="lo-row"><input type="checkbox" id="lo-remember" checked> <label for="lo-remember" style="margin:0;font-weight:600">Remember this device (30 days)</label></div>' +
        '<button type="submit" class="lo-btn" id="lo-login-btn">Sign in</button>' +
        '<button type="button" class="lo-btn lo-btn-ghost" id="lo-forgot">Forgot password?</button></form>';
      panel.querySelector('#lo-login-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        showErr(errEl, '');
        const btn = panel.querySelector('#lo-login-btn');
        btn.disabled = true;
        try {
          const { res, data } = await api('/api/auth/login', {
            method: 'POST',
            body: {
              email: panel.querySelector('#lo-email').value,
              password: panel.querySelector('#lo-pass').value,
              remember: panel.querySelector('#lo-remember').checked
            }
          });
          if (!res.ok) {
            showErr(errEl, (data && data.error) || 'Sign in failed');
            return;
          }
          currentUser = data.user;
          onAuthenticated();
        } catch (err) {
          showErr(errEl, 'Network error — is the server running?');
        } finally {
          btn.disabled = false;
        }
      });
      panel.querySelector('#lo-forgot').addEventListener('click', async function () {
        showErr(errEl, '');
        showOk(okEl, '');
        const email = panel.querySelector('#lo-email').value;
        if (!email) {
          showErr(errEl, 'Enter your email first');
          return;
        }
        const { data } = await api('/api/auth/forgot-password', {
          method: 'POST',
          body: { email }
        });
        showOk(okEl, (data && data.message) || 'Ask an admin for a temp password if needed.');
      });
    } else {
      panel.innerHTML =
        '<form id="lo-reg-form">' +
        '<label for="lo-rname">Full name</label>' +
        '<input id="lo-rname" type="text" required autocomplete="name">' +
        '<label for="lo-remail">Ruoff email</label>' +
        '<input id="lo-remail" type="email" required autocomplete="email" placeholder="you@ruoff.com">' +
        '<label for="lo-rpass">Password (min 8)</label>' +
        '<input id="lo-rpass" type="password" required minlength="8" autocomplete="new-password">' +
        '<div class="lo-row"><input type="checkbox" id="lo-rremember" checked> <label for="lo-rremember" style="margin:0;font-weight:600">Remember this device</label></div>' +
        '<button type="submit" class="lo-btn">Create account &amp; enter</button></form>';
      panel.querySelector('#lo-reg-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        showErr(errEl, '');
        const btn = e.target.querySelector('.lo-btn');
        btn.disabled = true;
        try {
          const { res, data } = await api('/api/auth/register', {
            method: 'POST',
            body: {
              name: panel.querySelector('#lo-rname').value,
              email: panel.querySelector('#lo-remail').value,
              password: panel.querySelector('#lo-rpass').value,
              remember: panel.querySelector('#lo-rremember').checked
            }
          });
          if (!res.ok) {
            showErr(errEl, (data && data.error) || 'Could not create account');
            return;
          }
          currentUser = data.user;
          onAuthenticated();
        } catch (err) {
          showErr(errEl, 'Network error');
        } finally {
          btn.disabled = false;
        }
      });
    }
  }

  function removeGate() {
    const root = document.getElementById(GATE_ID);
    if (root) root.remove();
    setLocked(false);
  }

  function onAuthenticated() {
    removeGate();
    document.documentElement.classList.remove('lo-awaiting-auth');
    const isAdm = currentUser && currentUser.role === 'admin';
    const canInvite = currentUser && (currentUser.can_invite_realtors || isAdm || currentUser.role === 'loan_officer');
    document.body.classList.toggle('lo-is-admin', !!isAdm);
    document.body.classList.toggle('lo-can-invite', !!canInvite);
    try {
      document.querySelectorAll('#sidebar a[href="#lo-admin"]').forEach(function (a) {
        a.style.display = isAdm ? '' : 'none';
      });
      document.querySelectorAll('#sidebar a[href="#invite-realtors"]').forEach(function (a) {
        a.style.display = canInvite ? '' : 'none';
      });
    } catch (e) {
      /* ignore */
    }
    paintAccountMenu();
    window.__loUser = currentUser;
    window.dispatchEvent(new CustomEvent('lo-auth-ready', { detail: { user: currentUser } }));
    api('/api/auth/track', { method: 'POST', body: { event_type: 'tool_open', feature: 'app' } }).catch(
      function () {}
    );
  }

  function paintAccountMenu() {
    injectStyles();
    const cluster = document.querySelector('.header-quote-actions');
    if (!cluster || !currentUser) return;
    let wrap = document.getElementById('lo-account-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'lo-account-wrap';
      wrap.className = 'lo-account-menu';
      cluster.insertBefore(wrap, cluster.firstChild);
    }
    const shortName = (currentUser.name || currentUser.email || 'Account').split(' ')[0];
    const canInvite =
      currentUser.can_invite_realtors || currentUser.role === 'admin' || currentUser.role === 'loan_officer';
    wrap.innerHTML =
      '<button type="button" class="lo-account-btn" id="lo-account-btn">' +
      '<i class="fas fa-user-circle"></i> <span class="hidden sm:inline">' +
      escapeAttr(shortName) +
      '</span></button>' +
      '<div class="lo-account-drop" id="lo-account-drop">' +
      '<div class="lo-who"><strong>' +
      escapeAttr(currentUser.name || 'Account') +
      '</strong><span>' +
      escapeAttr(currentUser.email) +
      '</span></div>' +
      (canInvite
        ? '<button type="button" data-lo-invite>Invite realtor</button>'
        : '') +
      (currentUser.role === 'admin'
        ? '<button type="button" data-lo-admin>Admin · LO users</button>'
        : '') +
      '<button type="button" class="danger" data-lo-logout>Sign out</button></div>';

    const btn = wrap.querySelector('#lo-account-btn');
    const drop = wrap.querySelector('#lo-account-drop');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      drop.classList.toggle('is-open');
    });
    document.addEventListener('click', function () {
      drop.classList.remove('is-open');
    });
    wrap.querySelector('[data-lo-logout]')?.addEventListener('click', async function () {
      await api('/api/auth/logout', { method: 'POST' });
      currentUser = null;
      window.__loUser = null;
      document.body.classList.remove('lo-is-admin', 'lo-can-invite');
      wrap.remove();
      renderGate('login');
    });
    wrap.querySelector('[data-lo-invite]')?.addEventListener('click', function () {
      if (typeof window.showSection === 'function') window.showSection('invite-realtors');
      else location.hash = 'invite-realtors';
    });
    wrap.querySelector('[data-lo-admin]')?.addEventListener('click', function () {
      if (typeof window.showSection === 'function') window.showSection('lo-admin');
      else location.hash = 'lo-admin';
    });
  }

  async function bootstrap() {
    if (booted) return;
    booted = true;
    injectStyles();
    setLocked(true);
    try {
      const { res, data } = await api('/api/auth/me');
      if (res.ok && data && data.authenticated && data.user) {
        currentUser = data.user;
        onAuthenticated();
        return;
      }
    } catch (e) {
      /* show login */
    }
    renderGate('login');
  }

  window.loAuth = {
    getUser: function () {
      return currentUser;
    },
    api: api,
    logout: async function () {
      await api('/api/auth/logout', { method: 'POST' });
      currentUser = null;
      renderGate('login');
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
