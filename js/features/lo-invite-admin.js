/**
 * LO Sales Coach — Invite realtors (Agent tool) + Admin LO users.
 */
(function () {
  'use strict';

  function api(path, opts) {
    if (window.loAuth && typeof window.loAuth.api === 'function') return window.loAuth.api(path, opts);
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

  function user() {
    return window.__loUser || (window.loAuth && window.loAuth.getUser && window.loAuth.getUser()) || null;
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

  // ── Invite realtors ────────────────────────────────────────

  async function renderInvite() {
    const el = document.getElementById('invite-realtors-root');
    if (!el) return;
    const u = user();
    if (!u || (u.role !== 'admin' && u.role !== 'loan_officer' && !u.can_invite_realtors)) {
      el.innerHTML =
        '<div class="p-8 text-center text-gray-500"><p class="font-bold text-lg text-[#002B5C] dark:text-white">Loan officers only</p></div>';
      return;
    }

    el.innerHTML =
      '<div class="text-center mb-6">' +
      '<span class="inline-block text-[10px] font-bold tracking-[2px] text-[#00A89D] bg-[#00A89D]/10 px-3 py-1 rounded-full mb-3">AGENT TOOL ACCESS</span>' +
      '<h2 class="text-3xl font-bold mb-2 text-[#F15A29]">Invite a realtor</h2>' +
      '<p class="text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Create a one-time invite for the <strong>Agent Sales Coach</strong>. They get realtor access there — not this LO tool.</p></div>' +
      '<div class="grid grid-cols-1 lg:grid-cols-5 gap-5 max-w-5xl mx-auto">' +
      '<div class="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 bg-white dark:bg-gray-900">' +
      '<h3 class="font-bold text-[#002B5C] dark:text-white mb-1">New invite</h3>' +
      '<p class="text-xs text-gray-500 mb-3">Optional: lock to one email so only that agent can redeem it.</p>' +
      '<label class="text-xs font-bold block mb-1">Realtor email (optional)</label>' +
      '<input id="lo-inv-email" type="email" class="w-full mb-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 px-3 py-2 text-sm bg-transparent" placeholder="agent@brokerage.com">' +
      '<label class="text-xs font-bold block mb-1">Expires (days)</label>' +
      '<input id="lo-inv-days" type="number" min="1" max="90" value="14" class="w-full mb-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 px-3 py-2 text-sm bg-transparent">' +
      '<button type="button" id="lo-inv-btn" class="w-full rounded-full bg-[#00A89D] text-white font-bold py-2.5 text-sm shadow-md"><i class="fas fa-user-plus mr-1"></i> Generate invite</button>' +
      '<div id="lo-inv-success" class="mt-3 hidden"></div></div>' +
      '<div class="lg:col-span-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">' +
      '<div class="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">' +
      '<h3 class="font-bold text-[#002B5C] dark:text-white m-0">Your invites</h3>' +
      '<button type="button" id="lo-inv-refresh" class="text-xs font-bold text-[#00A89D]">Refresh</button></div>' +
      '<div id="lo-inv-list" class="p-3 text-sm max-h-96 overflow-y-auto"></div></div></div>';

    el.querySelector('#lo-inv-btn').addEventListener('click', createInvite);
    el.querySelector('#lo-inv-refresh').addEventListener('click', loadInvites);
    await loadInvites();
  }

  function showInviteSuccess(data) {
    const box = document.getElementById('lo-inv-success');
    if (!box || !data) return;
    const link = data.link || '';
    const code = (data.invite && data.invite.code) || '';
    const email = (data.invite && data.invite.email_optional) || '';
    const mailto = data.mailto || '#';
    const bridgeOk = !data.bridge || data.bridge.ok !== false;

    box.classList.remove('hidden');
    box.innerHTML =
      '<div class="rounded-2xl border-2 ' +
      (bridgeOk ? 'border-[#00A89D]/40 bg-[#00A89D]/10' : 'border-amber-400/50 bg-amber-50 dark:bg-amber-900/20') +
      ' p-4 space-y-3">' +
      '<div class="flex items-center gap-2 font-bold text-sm ' +
      (bridgeOk ? 'text-[#0f766e]' : 'text-amber-800 dark:text-amber-200') +
      '"><i class="fas ' +
      (bridgeOk ? 'fa-check-circle' : 'fa-exclamation-triangle') +
      '"></i> ' +
      (bridgeOk ? 'Invite ready — send it now' : 'Invite saved — Agent sync failed') +
      '</div>' +
      (!bridgeOk
        ? '<p class="text-xs text-amber-800 dark:text-amber-200 m-0">' +
          esc((data.bridge && data.bridge.error) || data.message || '') +
          '</p>'
        : '') +
      '<div class="text-xs text-gray-600 dark:text-gray-300">' +
      '<div class="mb-1"><span class="font-bold">Code:</span> <code class="bg-white/80 dark:bg-gray-800 px-2 py-0.5 rounded">' +
      esc(code) +
      '</code></div>' +
      '<div class="break-all"><span class="font-bold">Link:</span> ' +
      esc(link) +
      '</div>' +
      (email ? '<div class="mt-1"><span class="font-bold">Locked to:</span> ' + esc(email) + '</div>' : '') +
      '</div>' +
      '<div class="flex flex-wrap gap-2">' +
      '<a href="' +
      esc(mailto) +
      '" class="inline-flex items-center justify-center gap-2 flex-1 min-w-[160px] rounded-full bg-[#00A89D] text-white font-bold py-2.5 px-4 text-sm"><i class="fas fa-envelope"></i> Send Invite via Email</a>' +
      '<button type="button" id="lo-inv-copy" class="rounded-full border-2 border-[#00A89D] text-[#0f766e] font-bold py-2.5 px-4 text-sm">Copy link</button></div></div>';

    box.querySelector('#lo-inv-copy')?.addEventListener('click', async function () {
      try {
        await navigator.clipboard.writeText(link);
        toast('Invite link copied');
      } catch (e) {
        toast(link);
      }
    });
  }

  async function createInvite() {
    const btn = document.getElementById('lo-inv-btn');
    const email = document.getElementById('lo-inv-email')?.value;
    const days = document.getElementById('lo-inv-days')?.value;
    if (btn) btn.disabled = true;
    try {
      const { res, data } = await api('/api/lo/agent-invites', {
        method: 'POST',
        body: { email: email || undefined, expires_days: Number(days) || 14 }
      });
      if (!res.ok) {
        toast((data && data.error) || 'Invite failed', 'error');
        return;
      }
      showInviteSuccess(data);
      toast(data.bridge && data.bridge.ok === false ? 'Created — fix Agent bridge to redeem' : 'Invite created');
      loadInvites();
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async function loadInvites() {
    const list = document.getElementById('lo-inv-list');
    if (!list) return;
    const { res, data } = await api('/api/lo/agent-invites');
    if (!res.ok) {
      list.innerHTML = '<p class="text-red-600 text-sm p-2">Could not load invites</p>';
      return;
    }
    const invites = data.invites || [];
    list.innerHTML = invites.length
      ? invites
          .map(function (i) {
            const open = !i.used_at && !i.revoked_at;
            return (
              '<div class="flex flex-wrap gap-2 items-center border-b border-gray-100 dark:border-gray-800 py-2 text-xs">' +
              '<code class="font-bold text-sm">' +
              esc(i.code) +
              '</code>' +
              '<span class="text-[10px] font-bold uppercase ' +
              (open ? 'text-emerald-600' : 'text-gray-400') +
              '">' +
              (i.revoked_at ? 'revoked' : i.used_at ? 'used' : 'open') +
              '</span>' +
              (i.email_optional ? '<span>' + esc(i.email_optional) + '</span>' : '') +
              '<span class="text-gray-400">exp ' +
              esc(fmtDate(i.expires_at)) +
              '</span>' +
              (i.bridge_synced === false
                ? '<span class="text-amber-600 font-bold">not synced</span>'
                : '') +
              (open
                ? '<button type="button" data-revoke="' +
                  esc(i.code) +
                  '" class="ml-auto text-[10px] font-bold px-2 py-1 rounded-full border border-red-300 text-red-600">Revoke</button>'
                : '') +
              '</div>'
            );
          })
          .join('')
      : '<p class="text-gray-400 p-2">No invites yet.</p>';

    list.querySelectorAll('[data-revoke]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        const code = btn.getAttribute('data-revoke');
        if (!confirm('Revoke invite ' + code + '?')) return;
        const { res, data } = await api('/api/lo/agent-invites/' + encodeURIComponent(code) + '/revoke', {
          method: 'POST',
          body: {}
        });
        if (!res.ok) toast((data && data.error) || 'Revoke failed', 'error');
        else toast('Invite revoked');
        loadInvites();
      });
    });
  }

  // ── Admin LO users ─────────────────────────────────────────

  async function renderAdmin() {
    const el = document.getElementById('lo-admin-root');
    if (!el) return;
    const u = user();
    if (!u || u.role !== 'admin') {
      el.innerHTML =
        '<div class="p-8 text-center text-gray-500"><p class="font-bold text-lg">Admin only</p></div>';
      return;
    }

    el.innerHTML =
      '<div class="text-center mb-6">' +
      '<span class="inline-block text-[10px] font-bold tracking-[2px] text-[#00A89D] bg-[#00A89D]/10 px-3 py-1 rounded-full mb-3">ADAM ONLY</span>' +
      '<h2 class="text-3xl font-bold mb-2 text-[#F15A29]">Admin · LO users</h2>' +
      '<p class="text-sm text-gray-600 dark:text-gray-400">Who is using Loan Officer Sales Coach.</p></div>' +
      '<div id="lo-adm-stats" class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 max-w-4xl mx-auto"></div>' +
      '<div class="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900 max-w-5xl mx-auto">' +
      '<div class="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex justify-between"><h3 class="font-bold m-0 text-[#002B5C] dark:text-white">Users</h3>' +
      '<button type="button" id="lo-adm-refresh" class="text-xs font-bold text-[#00A89D]">Refresh</button></div>' +
      '<div class="overflow-x-auto"><table class="w-full text-sm"><thead class="text-left text-xs uppercase text-gray-500 bg-gray-50 dark:bg-gray-800/50"><tr>' +
      '<th class="px-3 py-2">Name</th><th class="px-3 py-2">Email</th><th class="px-3 py-2">Status</th>' +
      '<th class="px-3 py-2">Last login</th><th class="px-3 py-2">Logins</th><th class="px-3 py-2">Actions</th></tr></thead>' +
      '<tbody id="lo-adm-users"></tbody></table></div></div>' +
      '<div class="rounded-2xl border border-gray-200 dark:border-gray-700 mt-4 p-4 bg-white dark:bg-gray-900 max-w-5xl mx-auto">' +
      '<h3 class="font-bold text-[#002B5C] dark:text-white mb-2">Recent usage</h3>' +
      '<div id="lo-adm-usage" class="text-xs space-y-1 max-h-40 overflow-y-auto text-gray-600"></div></div>';

    el.querySelector('#lo-adm-refresh').addEventListener('click', loadAdmin);
    await loadAdmin();
  }

  async function loadAdmin() {
    const [st, us, ug] = await Promise.all([
      api('/api/admin/stats'),
      api('/api/admin/users'),
      api('/api/admin/usage?limit=40')
    ]);
    const statsEl = document.getElementById('lo-adm-stats');
    if (statsEl && st.data) {
      const t = st.data.totals || {};
      const l = st.data.logins || {};
      statsEl.innerHTML = [
        ['Active', t.active],
        ['Deactivated', t.deactivated],
        ['Users', t.users],
        ['Logins 7d', l.last7d]
      ]
        .map(function (row) {
          return (
            '<div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 text-center bg-white dark:bg-gray-900">' +
            '<div class="text-2xl font-black text-[#002B5C] dark:text-white">' +
            esc(row[1] == null ? '—' : row[1]) +
            '</div><div class="text-[10px] font-bold tracking-wider text-gray-500 uppercase mt-1">' +
            esc(row[0]) +
            '</div></div>'
          );
        })
        .join('');
    }

    const body = document.getElementById('lo-adm-users');
    if (body) {
      const users = (us.data && us.data.users) || [];
      body.innerHTML = users
        .map(function (u) {
          return (
            '<tr class="border-t border-gray-100 dark:border-gray-800">' +
            '<td class="px-3 py-2 font-semibold">' +
            esc(u.name) +
            (u.role === 'admin' ? ' <span class="text-[10px] text-[#00A89D]">ADMIN</span>' : '') +
            '</td>' +
            '<td class="px-3 py-2 text-xs break-all">' +
            esc(u.email) +
            '</td>' +
            '<td class="px-3 py-2 text-xs">' +
            esc(u.status) +
            '</td>' +
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
            '" class="text-[10px] font-bold px-2 py-1 rounded-full border border-gray-300">Reset pw</button></div></td></tr>'
          );
        })
        .join('');

      body.querySelectorAll('button[data-act]').forEach(function (btn) {
        btn.addEventListener('click', async function () {
          const id = btn.getAttribute('data-id');
          const act = btn.getAttribute('data-act');
          if (act === 'activate' || act === 'deactivate') {
            const { res, data } = await api('/api/admin/users/' + encodeURIComponent(id), {
              method: 'PATCH',
              body: { status: act === 'activate' ? 'active' : 'deactivated' }
            });
            if (!res.ok) toast((data && data.error) || 'Failed', 'error');
            else toast('Updated');
            loadAdmin();
          } else if (act === 'reset') {
            const { res, data } = await api(
              '/api/admin/users/' + encodeURIComponent(id) + '/reset-password',
              { method: 'POST', body: {} }
            );
            if (!res.ok) {
              toast((data && data.error) || 'Failed', 'error');
              return;
            }
            try {
              await navigator.clipboard.writeText(data.tempPassword);
              toast('Temp password copied: ' + data.tempPassword);
            } catch (e) {
              toast('Temp password: ' + data.tempPassword);
            }
          }
        });
      });
    }

    const usageEl = document.getElementById('lo-adm-usage');
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
                '</div>'
              );
            })
            .join('')
        : '<p class="text-gray-400">No events yet.</p>';
    }
  }

  function init() {
    const prev = window.onCoachSectionShown;
    window.onCoachSectionShown = function (id) {
      if (typeof prev === 'function') {
        try {
          prev(id);
        } catch (e) {
          /* ignore */
        }
      }
      if (id === 'invite-realtors') renderInvite();
      if (id === 'lo-admin') renderAdmin();
    };
    const hash = (location.hash || '').replace(/^#/, '');
    if (hash === 'invite-realtors') renderInvite();
    if (hash === 'lo-admin') renderAdmin();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  document.addEventListener('lo-auth-ready', function () {
    const hash = (location.hash || '').replace(/^#/, '');
    if (hash === 'invite-realtors') renderInvite();
    if (hash === 'lo-admin') renderAdmin();
  });
})();
