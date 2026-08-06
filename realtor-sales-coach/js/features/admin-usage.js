/**
 * js/features/admin-usage.js
 * Adam-only admin: users, invites, usage for Agent Sales Coach.
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

  async function ensureAdmin() {
    const u = window.__ascUser || (window.ascAuth && window.ascAuth.getUser && window.ascAuth.getUser());
    if (!u || u.role !== 'admin') {
      return false;
    }
    return true;
  }

  async function render() {
    const el = document.getElementById(ROOT_ID);
    if (!el) return;
    if (!(await ensureAdmin())) {
      el.innerHTML =
        '<div class="p-8 text-center text-gray-500"><p class="font-bold text-lg text-[#002B5C] dark:text-white">Admin only</p><p class="text-sm mt-2">You do not have access to this page.</p></div>';
      return;
    }

    el.innerHTML =
      '<div class="text-center mb-6">' +
      '<span class="inline-block text-[10px] font-bold tracking-[2px] text-[#00A89D] bg-[#00A89D]/10 px-3 py-1 rounded-full mb-3">ADAM ONLY</span>' +
      '<h2 class="text-3xl font-bold mb-2 text-[#F15A29]">Admin · Accounts &amp; usage</h2>' +
      '<p class="text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Invite realtors, activate/deactivate, reset passwords, and see who is using the Agent Sales Coach.</p>' +
      '</div>' +
      '<div id="adm-stats" class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"></div>' +
      '<div class="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">' +
      '<div class="lg:col-span-1 space-y-4">' +
      '<div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">' +
      '<h3 class="font-bold text-[#002B5C] dark:text-white mb-3">Create invite</h3>' +
      '<label class="text-xs font-bold block mb-1">Email lock (optional)</label>' +
      '<input id="adm-inv-email" type="email" class="w-full mb-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 px-3 py-2 text-sm bg-transparent" placeholder="agent@brokerage.com">' +
      '<label class="text-xs font-bold block mb-1">Expires (days)</label>' +
      '<input id="adm-inv-days" type="number" min="1" max="90" value="14" class="w-full mb-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 px-3 py-2 text-sm bg-transparent">' +
      '<button type="button" id="adm-inv-btn" class="w-full rounded-full bg-[#00A89D] text-white font-bold py-2.5 text-sm">Generate invite</button>' +
      '<pre id="adm-inv-out" class="mt-3 text-xs whitespace-pre-wrap break-all text-gray-600 dark:text-gray-300 hidden"></pre>' +
      '</div>' +
      '<div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">' +
      '<h3 class="font-bold text-[#002B5C] dark:text-white mb-3">Create user directly</h3>' +
      '<input id="adm-u-name" type="text" placeholder="Name" class="w-full mb-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 px-3 py-2 text-sm bg-transparent">' +
      '<input id="adm-u-email" type="email" placeholder="Email" class="w-full mb-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 px-3 py-2 text-sm bg-transparent">' +
      '<input id="adm-u-co" type="text" placeholder="Company" class="w-full mb-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 px-3 py-2 text-sm bg-transparent">' +
      '<button type="button" id="adm-u-btn" class="w-full rounded-full bg-[#002B5C] text-white font-bold py-2.5 text-sm">Create + temp password</button>' +
      '<pre id="adm-u-out" class="mt-3 text-xs whitespace-pre-wrap break-all text-gray-600 dark:text-gray-300 hidden"></pre>' +
      '</div></div>' +
      '<div class="lg:col-span-2">' +
      '<div class="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">' +
      '<div class="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">' +
      '<h3 class="font-bold text-[#002B5C] dark:text-white m-0">Users</h3>' +
      '<button type="button" id="adm-refresh" class="text-xs font-bold text-[#00A89D]">Refresh</button>' +
      '</div>' +
      '<div class="overflow-x-auto"><table class="w-full text-sm">' +
      '<thead class="text-left text-xs uppercase tracking-wide text-gray-500 bg-gray-50 dark:bg-gray-800/50"><tr>' +
      '<th class="px-3 py-2">Name</th><th class="px-3 py-2">Email</th><th class="px-3 py-2">Status</th>' +
      '<th class="px-3 py-2">Last login</th><th class="px-3 py-2">Logins</th><th class="px-3 py-2">Actions</th>' +
      '</tr></thead><tbody id="adm-users-body"></tbody></table></div></div>' +
      '<div class="rounded-2xl border border-gray-200 dark:border-gray-700 mt-4 p-4 bg-white dark:bg-gray-900">' +
      '<h3 class="font-bold text-[#002B5C] dark:text-white mb-2">Recent usage events</h3>' +
      '<div id="adm-usage" class="text-xs space-y-1 max-h-48 overflow-y-auto text-gray-600 dark:text-gray-300"></div>' +
      '</div></div></div>';

    bind(el);
    await loadAll();
  }

  function bind(el) {
    el.querySelector('#adm-refresh')?.addEventListener('click', loadAll);
    el.querySelector('#adm-inv-btn')?.addEventListener('click', async function () {
      const email = el.querySelector('#adm-inv-email').value;
      const days = el.querySelector('#adm-inv-days').value;
      const { res, data } = await api('/api/admin/invites', {
        method: 'POST',
        body: { email: email || undefined, expires_days: Number(days) || 14 }
      });
      const out = el.querySelector('#adm-inv-out');
      if (!res.ok) {
        toast((data && data.error) || 'Invite failed', 'error');
        return;
      }
      out.classList.remove('hidden');
      out.textContent =
        'Code: ' +
        data.invite.code +
        '\nLink: ' +
        data.link +
        '\nExpires: ' +
        fmtDate(data.invite.expires_at);
      toast('Invite created — copy the code/link');
      loadAll();
    });
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
        'Created ' +
        data.user.email +
        '\nTemp password: ' +
        data.tempPassword +
        '\n(copy now)';
      toast('User created');
      loadAll();
    });
  }

  async function loadAll() {
    const statsEl = document.getElementById('adm-stats');
    const body = document.getElementById('adm-users-body');
    const usageEl = document.getElementById('adm-usage');
    if (!body) return;

    const [st, us, ug] = await Promise.all([
      api('/api/admin/stats'),
      api('/api/admin/users'),
      api('/api/admin/usage?limit=40')
    ]);

    if (st.res.status === 403 || us.res.status === 403) {
      body.innerHTML =
        '<tr><td colspan="6" class="px-3 py-6 text-center text-red-600">403 — admin only</td></tr>';
      return;
    }

    if (statsEl && st.data) {
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
    body.innerHTML = users
      .map(function (u) {
        const statusCls =
          u.status === 'active'
            ? 'text-emerald-700 bg-emerald-50'
            : u.status === 'pending'
              ? 'text-amber-700 bg-amber-50'
              : 'text-red-700 bg-red-50';
        return (
          '<tr class="border-t border-gray-100 dark:border-gray-800 align-top">' +
          '<td class="px-3 py-2 font-semibold">' +
          esc(u.name) +
          (u.role === 'admin' ? ' <span class="text-[10px] text-[#00A89D]">ADMIN</span>' : '') +
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
          (u.status !== 'active'
            ? '<button type="button" data-act="activate" data-id="' +
              esc(u.id) +
              '" class="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-600 text-white">Activate</button>'
            : '') +
          (u.status !== 'deactivated'
            ? '<button type="button" data-act="deactivate" data-id="' +
              esc(u.id) +
              '" class="text-[10px] font-bold px-2 py-1 rounded-full bg-red-600 text-white">Deactivate</button>'
            : '') +
          '<button type="button" data-act="reset" data-id="' +
          esc(u.id) +
          '" class="text-[10px] font-bold px-2 py-1 rounded-full border border-gray-300 dark:border-gray-600">Reset pw</button>' +
          '</div></td></tr>'
        );
      })
      .join('');

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
          loadAll();
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
          try {
            await navigator.clipboard.writeText(pw);
            toast('Temp password copied: ' + pw);
          } catch (e) {
            toast('Temp password: ' + pw);
          }
        }
      });
    });

    if (usageEl) {
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
                ' · <span class="opacity-60">' +
                esc((ev.user_id || '').slice(0, 12)) +
                '</span></div>'
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
