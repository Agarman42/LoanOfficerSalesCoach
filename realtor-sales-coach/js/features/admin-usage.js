/**
 * js/features/admin-usage.js
 * Invite partners + admin accounts for Agent Sales Coach.
 * - Admin: full users, invites, usage, deactivate
 * - Ruoff LO (@ruoff.com or role=lo): create invites, email invite, reset realtor passwords
 */
(function () {
  'use strict';

  const ROOT_ID = 'admin-usage-root';

  function api(path, opts) {
    if (window.ascAuth && typeof window.ascAuth.api === 'function') {
      return window.ascAuth.api(path, opts);
    }
    opts = opts || {};
    return fetch(path, {
      method: opts.method || 'GET',
      credentials: 'include',
      headers: Object.assign(
        { Accept: 'application/json' },
        opts.body ? { 'Content-Type': 'application/json' } : {}
      ),
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(async function (res) {
      let data = null;
      try {
        data = await res.json();
      } catch (e) {
        data = null;
      }
      return { res, data, ok: res.ok };
    });
  }

  function currentUser() {
    return (
      window.__ascUser ||
      (window.ascAuth && window.ascAuth.getUser && window.ascAuth.getUser()) ||
      null
    );
  }

  function canInvite(u) {
    u = u || currentUser();
    if (!u) return false;
    if (u.can_invite === true || u.is_admin === true) return true;
    if (u.role === 'admin' || u.role === 'lo') return true;
    return /@ruoff\.com$/i.test(String(u.email || ''));
  }

  function isAdmin(u) {
    u = u || currentUser();
    return !!(u && (u.role === 'admin' || u.is_admin === true));
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch (e) {
      return iso;
    }
  }

  function toast(msg, type) {
    if (typeof window.showToast === 'function') window.showToast(msg, type || 'info');
    else alert(msg);
  }

  function buildMailtoClient(link, code, toEmail, fromName) {
    const subject = "You're invited to the Ruoff Agent Sales Coach";
    const who = fromName || 'your Ruoff loan officer';
    const body =
      'Hi,\n\n' +
      "You've been invited to the Ruoff Agent Sales Coach — practical tools for realtors who partner with Ruoff Mortgage.\n\n" +
      'Create your free account here (one-time link):\n' +
      link +
      '\n\n' +
      'Or open the app and enter invite code: ' +
      code +
      '\n\n' +
      'It only takes a minute — set your password and you are in.\n\n' +
      'Questions? Just reply to this email.\n\n' +
      'Thanks,\n' +
      who +
      '\n';
    return (
      'mailto:' +
      (toEmail ? encodeURIComponent(toEmail) : '') +
      '?subject=' +
      encodeURIComponent(subject) +
      '&body=' +
      encodeURIComponent(body)
    );
  }

  function showInviteSuccess(el, data) {
    const box = el.querySelector('#adm-inv-success');
    if (!box || !data) return;
    const link = data.link || '';
    const code = (data.invite && data.invite.code) || '';
    const email = (data.invite && data.invite.email_optional) || '';
    const mailto =
      data.mailto ||
      buildMailtoClient(link, code, email, (currentUser() || {}).name);

    box.classList.remove('hidden');
    box.innerHTML =
      '<div class="rounded-2xl border-2 border-[#00A89D]/40 bg-[#00A89D]/10 p-4 space-y-3">' +
      '<div class="flex items-center gap-2 text-[#0f766e] font-bold text-sm">' +
      '<i class="fas fa-check-circle"></i> Invite ready — send it now</div>' +
      '<div class="text-xs text-gray-600 dark:text-gray-300">' +
      '<div class="mb-1"><span class="font-bold">Code:</span> <code class="bg-white/80 dark:bg-gray-800 px-2 py-0.5 rounded">' +
      esc(code) +
      '</code></div>' +
      '<div class="break-all"><span class="font-bold">Link:</span> ' +
      esc(link) +
      '</div>' +
      (email
        ? '<div class="mt-1"><span class="font-bold">Locked to:</span> ' + esc(email) + '</div>'
        : '') +
      '<div class="mt-1 text-gray-500">Expires: ' +
      esc(fmtDate(data.invite && data.invite.expires_at)) +
      ' · single-use</div></div>' +
      '<div class="flex flex-wrap gap-2">' +
      '<a href="' +
      esc(mailto) +
      '" id="adm-inv-mailto" class="inline-flex items-center justify-center gap-2 flex-1 min-w-[180px] rounded-full bg-[#00A89D] text-white font-bold py-2.5 px-4 text-sm hover:opacity-95">' +
      '<i class="fas fa-envelope"></i> Send Invite via Email</a>' +
      '<button type="button" id="adm-inv-copy-link" class="rounded-full border-2 border-[#00A89D] text-[#0f766e] font-bold py-2.5 px-4 text-sm">Copy link</button>' +
      '<button type="button" id="adm-inv-copy-code" class="rounded-full border border-gray-300 dark:border-gray-600 font-bold py-2.5 px-4 text-sm">Copy code</button>' +
      '</div></div>';

    box.querySelector('#adm-inv-copy-link')?.addEventListener('click', async function () {
      try {
        await navigator.clipboard.writeText(link);
        toast('Invite link copied');
      } catch (e) {
        toast(link);
      }
    });
    box.querySelector('#adm-inv-copy-code')?.addEventListener('click', async function () {
      try {
        await navigator.clipboard.writeText(code);
        toast('Invite code copied');
      } catch (e) {
        toast(code);
      }
    });
  }

  async function render() {
    const el = document.getElementById(ROOT_ID);
    if (!el) return;
    const u = currentUser();
    if (!canInvite(u)) {
      el.innerHTML =
        '<div class="p-8 text-center text-gray-500"><p class="font-bold text-lg text-[#002B5C] dark:text-white">Invites for Ruoff LOs</p><p class="text-sm mt-2">Only Ruoff loan officers and admins can invite realtor partners.</p></div>';
      return;
    }

    const admin = isAdmin(u);
    const badge = admin ? 'ADMIN' : 'RUOFF LO';
    const title = admin ? 'Admin · Accounts & usage' : 'Invite realtor partners';
    const sub = admin
      ? 'Invite realtors, activate/deactivate, reset passwords, and see who is using the Agent Sales Coach.'
      : 'Create a one-time invite link, email it to your realtor, or reset their password if they get locked out.';

    el.innerHTML =
      '<div class="text-center mb-6">' +
      '<span class="inline-block text-[10px] font-bold tracking-[2px] text-[#00A89D] bg-[#00A89D]/10 px-3 py-1 rounded-full mb-3">' +
      badge +
      '</span>' +
      '<h2 class="text-3xl font-bold mb-2 text-[#F15A29]">' +
      title +
      '</h2>' +
      '<p class="text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">' +
      sub +
      '</p></div>' +
      (admin ? '<div id="adm-stats" class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"></div>' : '') +
      '<div class="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">' +
      '<div class="lg:col-span-1 space-y-4">' +
      '<div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">' +
      '<h3 class="font-bold text-[#002B5C] dark:text-white mb-1">Create invite</h3>' +
      '<p class="text-xs text-gray-500 mb-3">Optional: lock the invite to one email so only that agent can use it.</p>' +
      '<label class="text-xs font-bold block mb-1">Realtor email (optional lock)</label>' +
      '<input id="adm-inv-email" type="email" class="w-full mb-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 px-3 py-2 text-sm bg-transparent" placeholder="agent@brokerage.com">' +
      '<label class="text-xs font-bold block mb-1">Expires (days)</label>' +
      '<input id="adm-inv-days" type="number" min="1" max="90" value="14" class="w-full mb-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 px-3 py-2 text-sm bg-transparent">' +
      '<button type="button" id="adm-inv-btn" class="w-full rounded-full bg-[#00A89D] text-white font-bold py-2.5 text-sm shadow-md">' +
      '<i class="fas fa-user-plus mr-1"></i> Generate invite</button>' +
      '<div id="adm-inv-success" class="mt-3 hidden"></div>' +
      '</div>' +
      (admin
        ? '<div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">' +
          '<h3 class="font-bold text-[#002B5C] dark:text-white mb-3">Create user directly</h3>' +
          '<input id="adm-u-name" type="text" placeholder="Name" class="w-full mb-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 px-3 py-2 text-sm bg-transparent">' +
          '<input id="adm-u-email" type="email" placeholder="Email" class="w-full mb-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 px-3 py-2 text-sm bg-transparent">' +
          '<input id="adm-u-co" type="text" placeholder="Company" class="w-full mb-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 px-3 py-2 text-sm bg-transparent">' +
          '<button type="button" id="adm-u-btn" class="w-full rounded-full bg-[#002B5C] text-white font-bold py-2.5 text-sm">Create + temp password</button>' +
          '<pre id="adm-u-out" class="mt-3 text-xs whitespace-pre-wrap break-all text-gray-600 dark:text-gray-300 hidden"></pre>' +
          '</div>'
        : '<div class="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 p-4 text-xs text-gray-500">' +
          '<strong class="text-[#002B5C] dark:text-white">Tip:</strong> Prefer invites over temp passwords when you can. After they join, use <em>Reset pw</em> only if they get stuck.' +
          '</div>') +
      '</div>' +
      '<div class="lg:col-span-2">' +
      '<div class="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">' +
      '<div class="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">' +
      '<h3 class="font-bold text-[#002B5C] dark:text-white m-0">' +
      (admin ? 'All users' : 'Realtor partners') +
      '</h3>' +
      '<button type="button" id="adm-refresh" class="text-xs font-bold text-[#00A89D]">Refresh</button>' +
      '</div>' +
      '<div class="overflow-x-auto"><table class="w-full text-sm">' +
      '<thead class="text-left text-xs uppercase tracking-wide text-gray-500 bg-gray-50 dark:bg-gray-800/50"><tr>' +
      '<th class="px-3 py-2">Name</th><th class="px-3 py-2">Email</th><th class="px-3 py-2">Status</th>' +
      '<th class="px-3 py-2">Last login</th><th class="px-3 py-2">Logins</th><th class="px-3 py-2">Actions</th>' +
      '</tr></thead><tbody id="adm-users-body"></tbody></table></div></div>' +
      (admin
        ? '<div class="rounded-2xl border border-gray-200 dark:border-gray-700 mt-4 p-4 bg-white dark:bg-gray-900">' +
          '<h3 class="font-bold text-[#002B5C] dark:text-white mb-2">Recent usage events</h3>' +
          '<div id="adm-usage" class="text-xs space-y-1 max-h-48 overflow-y-auto text-gray-600 dark:text-gray-300"></div></div>'
        : '') +
      '<div class="rounded-2xl border border-gray-200 dark:border-gray-700 mt-4 p-4 bg-white dark:bg-gray-900">' +
      '<h3 class="font-bold text-[#002B5C] dark:text-white mb-2">' +
      (admin ? 'All invites' : 'Your recent invites') +
      '</h3>' +
      '<div id="adm-invites-list" class="text-xs space-y-2 max-h-40 overflow-y-auto text-gray-600 dark:text-gray-300"></div></div>' +
      '</div></div>';

    bind(el, admin);
    await loadAll(admin);
  }

  function bind(el, admin) {
    el.querySelector('#adm-refresh')?.addEventListener('click', function () {
      loadAll(admin);
    });

    el.querySelector('#adm-inv-btn')?.addEventListener('click', async function () {
      const btn = el.querySelector('#adm-inv-btn');
      const email = el.querySelector('#adm-inv-email').value;
      const days = el.querySelector('#adm-inv-days').value;
      if (btn) btn.disabled = true;
      try {
        const { res, data } = await api('/api/admin/invites', {
          method: 'POST',
          body: { email: email || undefined, expires_days: Number(days) || 14 }
        });
        if (!res.ok) {
          toast((data && data.error) || 'Invite failed', 'error');
          return;
        }
        showInviteSuccess(el, data);
        toast('Invite created — send via email or copy the link');
        loadAll(admin);
      } finally {
        if (btn) btn.disabled = false;
      }
    });

    if (admin) {
      el.querySelector('#adm-u-btn')?.addEventListener('click', async function () {
        const name = el.querySelector('#adm-u-name').value;
        const email = el.querySelector('#adm-u-email').value;
        const company = el.querySelector('#adm-u-co').value;
        const { res, data } = await api('/api/admin/users', {
          method: 'POST',
          body: { name, email, company }
        });
        const out = el.querySelector('#adm-u-out');
        if (!res.ok) {
          toast((data && data.error) || 'Create failed', 'error');
          return;
        }
        out.classList.remove('hidden');
        out.textContent =
          'Created ' + data.user.email + '\nTemp password: ' + data.tempPassword + '\n(copy now)';
        toast('User created');
        loadAll(admin);
      });
    }
  }

  async function loadAll(admin) {
    const body = document.getElementById('adm-users-body');
    if (!body) return;

    const tasks = [api('/api/admin/users'), api('/api/admin/invites')];
    if (admin) {
      tasks.unshift(api('/api/admin/stats'));
      tasks.push(api('/api/admin/usage?limit=40'));
    }

    const results = await Promise.all(tasks);
    let st = null;
    let us;
    let inv;
    let ug = null;
    if (admin) {
      st = results[0];
      us = results[1];
      inv = results[2];
      ug = results[3];
    } else {
      us = results[0];
      inv = results[1];
    }

    if (us.res.status === 403) {
      body.innerHTML =
        '<tr><td colspan="6" class="px-3 py-6 text-center text-red-600">403 — not allowed</td></tr>';
      return;
    }

    const statsEl = document.getElementById('adm-stats');
    if (admin && statsEl && st && st.data) {
      const t = st.data.totals || {};
      const l = st.data.logins || {};
      statsEl.innerHTML = [
        ['Active', t.active],
        ['Pending', t.pending],
        ['Deactivated', t.deactivated],
        ['Logins 7d', l.last7d]
      ]
        .map(function (row) {
          return (
            '<div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900 text-center">' +
            '<div class="text-2xl font-black text-[#002B5C] dark:text-white">' +
            esc(row[1] == null ? '—' : row[1]) +
            '</div><div class="text-[10px] font-bold tracking-wider text-gray-500 uppercase mt-1">' +
            esc(row[0]) +
            '</div></div>'
          );
        })
        .join('');
    }

    const users = (us.data && us.data.users) || [];
    body.innerHTML = users.length
      ? users
          .map(function (u) {
            const statusCls =
              u.status === 'active'
                ? 'text-emerald-700 bg-emerald-50'
                : u.status === 'pending'
                  ? 'text-amber-700 bg-amber-50'
                  : 'text-red-700 bg-red-50';
            const roleBadge =
              u.role === 'admin'
                ? ' <span class="text-[10px] text-[#00A89D]">ADMIN</span>'
                : u.role === 'lo'
                  ? ' <span class="text-[10px] text-[#F15A29]">LO</span>'
                  : '';
            let actions = '';
            if (admin) {
              if (u.status !== 'active') {
                actions +=
                  '<button type="button" data-act="activate" data-id="' +
                  esc(u.id) +
                  '" class="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-600 text-white">Activate</button>';
              }
              if (u.status !== 'deactivated') {
                actions +=
                  '<button type="button" data-act="deactivate" data-id="' +
                  esc(u.id) +
                  '" class="text-[10px] font-bold px-2 py-1 rounded-full bg-red-600 text-white">Deactivate</button>';
              }
            }
            // Reset: admin any; LO only realtors (server enforces)
            const canShowReset = admin || u.role === 'realtor' || u.status === 'pending';
            if (canShowReset) {
              actions +=
                '<button type="button" data-act="reset" data-id="' +
                esc(u.id) +
                '" data-email="' +
                esc(u.email) +
                '" class="text-[10px] font-bold px-2 py-1 rounded-full border border-gray-300 dark:border-gray-600">Reset pw</button>';
            }
            return (
              '<tr class="border-t border-gray-100 dark:border-gray-800 align-top">' +
              '<td class="px-3 py-2 font-semibold">' +
              esc(u.name) +
              roleBadge +
              '<div class="text-[11px] text-gray-500 font-normal">' +
              esc(u.company || '') +
              '</div></td>' +
              '<td class="px-3 py-2 text-xs break-all">' +
              esc(u.email) +
              '</td>' +
              '<td class="px-3 py-2"><span class="text-[10px] font-bold px-2 py-0.5 rounded-full ' +
              statusCls +
              '">' +
              esc(u.status) +
              '</span></td>' +
              '<td class="px-3 py-2 text-xs whitespace-nowrap">' +
              esc(fmtDate(u.last_login_at)) +
              '</td>' +
              '<td class="px-3 py-2 text-center">' +
              esc(u.login_count || 0) +
              '</td>' +
              '<td class="px-3 py-2"><div class="flex flex-wrap gap-1">' +
              actions +
              '</div></td></tr>'
            );
          })
          .join('')
      : '<tr><td colspan="6" class="px-3 py-6 text-center text-gray-400">No users yet — create an invite above.</td></tr>';

    body.querySelectorAll('button[data-act]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        const id = btn.getAttribute('data-id');
        const act = btn.getAttribute('data-act');
        if (act === 'activate' || act === 'deactivate') {
          const status = act === 'activate' ? 'active' : 'deactivated';
          const { res, data } = await api('/api/admin/users/' + encodeURIComponent(id), {
            method: 'PATCH',
            body: { status }
          });
          if (!res.ok) toast((data && data.error) || 'Update failed', 'error');
          else toast('Updated to ' + status);
          loadAll(admin);
        } else if (act === 'reset') {
          const { res, data } = await api(
            '/api/admin/users/' + encodeURIComponent(id) + '/reset-password',
            { method: 'POST', body: {} }
          );
          if (!res.ok) {
            toast((data && data.error) || 'Reset failed', 'error');
            return;
          }
          const pw = data.tempPassword;
          const email = btn.getAttribute('data-email') || (data.user && data.user.email) || '';
          try {
            await navigator.clipboard.writeText(pw);
            toast('Temp password copied: ' + pw);
          } catch (e) {
            toast('Temp password: ' + pw);
          }
          // Offer mailto with temp password
          if (email && confirm('Open email to send the temporary password to ' + email + '?')) {
            const subject = 'Your Agent Sales Coach temporary password';
            const bodyTxt =
              'Hi,\n\n' +
              'Here is a temporary password for the Ruoff Agent Sales Coach:\n\n' +
              pw +
              '\n\n' +
              'Sign in at: ' +
              (location.origin || '') +
              '\n\nPlease change your password after signing in if prompted, or ask me for a new reset anytime.\n\nThanks,\n' +
              ((currentUser() || {}).name || 'Your Ruoff loan officer');
            window.location.href =
              'mailto:' +
              encodeURIComponent(email) +
              '?subject=' +
              encodeURIComponent(subject) +
              '&body=' +
              encodeURIComponent(bodyTxt);
          }
        }
      });
    });

    const invEl = document.getElementById('adm-invites-list');
    if (invEl) {
      const invites = (inv.data && inv.data.invites) || [];
      invEl.innerHTML = invites.length
        ? invites
            .slice(0, 25)
            .map(function (i) {
              const used = i.used_at ? 'used' : 'open';
              return (
                '<div class="flex flex-wrap gap-2 items-baseline border-b border-gray-100 dark:border-gray-800 py-1">' +
                '<code class="font-bold">' +
                esc(i.code) +
                '</code>' +
                '<span class="text-[10px] uppercase font-bold ' +
                (used === 'open' ? 'text-emerald-600' : 'text-gray-400') +
                '">' +
                used +
                '</span>' +
                (i.email_optional ? '<span>' + esc(i.email_optional) + '</span>' : '') +
                '<span class="text-gray-400">exp ' +
                esc(fmtDate(i.expires_at)) +
                '</span></div>'
              );
            })
            .join('')
        : '<p class="text-gray-400">No invites yet.</p>';
    }

    const usageEl = document.getElementById('adm-usage');
    if (admin && usageEl && ug) {
      const events = (ug.data && ug.data.events) || [];
      usageEl.innerHTML = events.length
        ? events
            .map(function (ev) {
              return (
                '<div><span class="text-gray-400">' +
                esc(fmtDate(ev.created_at)) +
                '</span> · <strong>' +
                esc(ev.event_type) +
                '</strong> · ' +
                esc(ev.path || '') +
                '</div>'
              );
            })
            .join('')
        : '<p class="text-gray-400">No events yet.</p>';
    }
  }

  function init() {
    const section = document.getElementById('admin-usage');
    if (!section) return;

    const prev = window.onCoachSectionShown;
    window.onCoachSectionShown = function (id) {
      if (typeof prev === 'function') {
        try {
          prev(id);
        } catch (e) {
          /* ignore */
        }
      }
      if (id === 'admin-usage') render();
    };

    if ((location.hash || '').replace(/^#/, '') === 'admin-usage') {
      render();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  document.addEventListener('asc-auth-ready', function () {
    if ((location.hash || '').replace(/^#/, '') === 'admin-usage') render();
  });
})();
