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
#${GATE_ID} .lo-pass-wrap{position:relative;display:block}
#${GATE_ID} .lo-pass-wrap input{padding-right:2.75rem}
#${GATE_ID} .lo-pass-toggle{position:absolute;right:.35rem;top:50%;transform:translateY(-50%);border:0;background:transparent;color:#64748b;width:2.25rem;height:2.25rem;border-radius:.55rem;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-size:.95rem;padding:0}
#${GATE_ID} .lo-pass-toggle:hover{color:#0f766e;background:rgba(0,168,157,.08)}
#${GATE_ID} .lo-pass-toggle:focus-visible{outline:2px solid #00A89D;outline-offset:1px}
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
#sidebar a[href="#lo-admin"]{display:none}
#sidebar a[href="#invite-realtors"]{display:none}
body.lo-is-admin #sidebar a[href="#lo-admin"]{display:flex}
body.lo-can-invite #sidebar a[href="#invite-realtors"],
body.lo-can-invite #sidebar-invite-realtor{display:flex!important}
#sidebar-invite-realtor{display:none}
html.lo-awaiting-auth body > :not(#lo-auth-gate):not(script):not(style){visibility:hidden!important}
.lo-profile-account-bar{border-top:1px solid #e5e7eb;margin-top:.5rem;padding-top:.75rem;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:.5rem}
.dark .lo-profile-account-bar{border-top-color:#374151}
.lo-profile-account-meta{font-size:.75rem;color:#64748b;min-width:0}
.lo-profile-account-meta strong{display:block;color:#002B5C;font-size:.8rem}
.dark .lo-profile-account-meta strong{color:#e2e8f0}
.lo-profile-signout{border:1px solid #fecaca;color:#b91c1c;background:#fef2f2;border-radius:999px;padding:.45rem .9rem;font-size:.75rem;font-weight:800;cursor:pointer}
.lo-profile-signout:hover{background:#fee2e2}
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

  function passwordFieldHtml(id, opts) {
    opts = opts || {};
    return (
      '<div class="lo-pass-wrap">' +
      '<input id="' +
      id +
      '" type="password" required' +
      (opts.minlength ? ' minlength="' + opts.minlength + '"' : '') +
      (opts.autocomplete ? ' autocomplete="' + opts.autocomplete + '"' : '') +
      (opts.placeholder ? ' placeholder="' + escapeAttr(opts.placeholder) + '"' : '') +
      '>' +
      '<button type="button" class="lo-pass-toggle" data-pass-toggle="' +
      id +
      '" aria-label="Show password" title="Show password">' +
      '<i class="fas fa-eye" aria-hidden="true"></i></button></div>'
    );
  }

  function bindPasswordToggles(rootEl) {
    if (!rootEl) return;
    rootEl.querySelectorAll('[data-pass-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const id = btn.getAttribute('data-pass-toggle');
        const input = document.getElementById(id);
        if (!input) return;
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
        btn.setAttribute('title', show ? 'Hide password' : 'Show password');
        const icon = btn.querySelector('i');
        if (icon) {
          icon.classList.toggle('fa-eye', !show);
          icon.classList.toggle('fa-eye-slash', show);
        }
      });
    });
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
        passwordFieldHtml('lo-pass', { autocomplete: 'current-password' }) +
        '<div class="lo-row"><input type="checkbox" id="lo-remember" checked> <label for="lo-remember" style="margin:0;font-weight:600">Remember this device (30 days)</label></div>' +
        '<button type="submit" class="lo-btn" id="lo-login-btn">Sign in</button>' +
        '<button type="button" class="lo-btn lo-btn-ghost" id="lo-forgot">Forgot password?</button></form>';
      bindPasswordToggles(panel);
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
        passwordFieldHtml('lo-rpass', { minlength: 8, autocomplete: 'new-password' }) +
        '<div class="lo-row"><input type="checkbox" id="lo-rremember" checked> <label for="lo-rremember" style="margin:0;font-weight:600">Remember this device</label></div>' +
        '<button type="submit" class="lo-btn">Create account &amp; enter</button></form>';
      bindPasswordToggles(panel);
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
    // Top chip: open My Profile only (invite lives on Home / sidebar; Sign out is in Profile)
    const profileBtn = document.getElementById('open-profile-btn');
    if (profileBtn && currentUser) {
      const shortName = (currentUser.name || currentUser.email || 'My Profile').split(' ')[0];
      const label = profileBtn.querySelector('span.hidden, span.sm\\:inline, span');
      // Prefer existing "My Profile" span — update to first name when known
      const spans = profileBtn.querySelectorAll('span');
      spans.forEach(function (sp) {
        if (sp.classList.contains('hidden') || /My Profile|Profile/i.test(sp.textContent || '')) {
          sp.textContent = shortName || 'My Profile';
        }
      });
      profileBtn.title = (currentUser.name || 'My Profile') + ' · open to edit or sign out';
      profileBtn.setAttribute(
        'aria-label',
        'My Profile' + (currentUser.email ? ' (' + currentUser.email + ')' : '')
      );
      profileBtn.onclick = function (e) {
        e.preventDefault();
        if (typeof window.openUserProfile === 'function') window.openUserProfile(true);
      };
    }
    // Remove legacy dropdown if present
    const old = document.getElementById('lo-account-wrap');
    if (old) old.remove();
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
