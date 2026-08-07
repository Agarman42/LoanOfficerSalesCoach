/**
 * LO → partner share: publish public LO card, auto-copy link, open Outlook/email draft.
 * Private full profile stays in localStorage; only public fields are posted.
 */
(function () {
  'use strict';

  const TOKEN_KEY = 'loPartnerShareToken';
  const LAST_URL_KEY = 'loPartnerShareUrl';
  const DEFAULT_TITLE = 'Your Ruoff Loan Officer';

  function getProfile() {
    if (typeof window.getUserProfile === 'function') {
      try {
        return window.getUserProfile() || {};
      } catch (e) { /* fall through */ }
    }
    try {
      const raw = localStorage.getItem('userProfile');
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function readLiveOrProfile() {
    const p = getProfile();
    const val = (id) => {
      const el = document.getElementById(id);
      if (el && typeof el.value === 'string' && el.value.trim()) return el.value.trim();
      return '';
    };
    return {
      name: val('profile-name') || (p.name || '').trim(),
      phone: val('profile-phone') || (p.phone || '').trim(),
      email: val('profile-email') || (p.email || '').trim(),
      nmls: val('profile-nmls') || (p.nmls || '').trim(),
      headshotUrl:
        val('profile-headshot-url') ||
        (p.headshotUrl || p['headshot-url'] || '').trim(),
      title: DEFAULT_TITLE,
      location:
        val('profile-location') ||
        (p.location || p.localArea || p.market || '').trim(),
      company: 'Ruoff Mortgage'
    };
  }

  function formatPhoneHyphens(phone) {
    let d = String(phone || '').replace(/\D/g, '');
    if (d.length === 11 && d.startsWith('1')) d = d.slice(1);
    if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
    return String(phone || '').trim();
  }

  function buildPublicCardFromProfile(p) {
    if (p && typeof p === 'object' && (p.name != null || p.phone != null)) {
      return {
        name: (p.name || '').trim(),
        phone: formatPhoneHyphens(p.phone),
        email: (p.email || '').trim(),
        nmls: (p.nmls || '').trim(),
        headshotUrl: (p.headshotUrl || p['headshot-url'] || '').trim(),
        title: (p.title || DEFAULT_TITLE).trim() || DEFAULT_TITLE,
        location: (p.location || p.localArea || p.market || '').trim(),
        company: (p.company || 'Ruoff Mortgage').trim()
      };
    }
    const live = readLiveOrProfile();
    live.phone = formatPhoneHyphens(live.phone);
    return live;
  }

  function getPartnerFieldGaps(card) {
    card = card || buildPublicCardFromProfile();
    const required = [];

    if (!card.name) {
      required.push({ id: 'profile-name', tab: 'identity', label: 'Full Name' });
    }
    if (!card.phone && !card.email) {
      required.push({
        id: 'profile-phone',
        tab: 'identity',
        label: 'Phone or Email',
        alsoIds: ['profile-email']
      });
    }
    // Headshot required so partners always see a professional plate (Identity tab)
    if (!card.headshotUrl) {
      required.push({
        id: 'profile-headshot-url',
        tab: 'identity',
        label: 'Professional Headshot URL'
      });
    } else if (isEphemeralHeadshotUrl(card.headshotUrl)) {
      required.push({
        id: 'profile-headshot-url',
        tab: 'identity',
        label: 'Permanent Headshot URL (not a temporary S3/signed link)'
      });
    }
    return { required, recommended: [], card };
  }

  /** Temporary avatar/S3 signed links die in minutes → gray circle on Realtor. */
  function isEphemeralHeadshotUrl(url) {
    const u = String(url || '');
    if (!u) return false;
    if (/[?&]X-Amz-Algorithm=/i.test(u) || /[?&]X-Amz-Signature=/i.test(u) || /[?&]X-Amz-Credential=/i.test(u)) {
      return true;
    }
    const exp = u.match(/[?&]X-Amz-Expires=(\d+)/i);
    if (exp && parseInt(exp[1], 10) > 0 && parseInt(exp[1], 10) < 86400) return true;
    if (/[?&]X-Goog-Signature=/i.test(u) || (/[?&]sig=/i.test(u) && /[?&]se=/i.test(u))) return true;
    return false;
  }

  function validateCard(card) {
    const { required } = getPartnerFieldGaps(card);
    if (!required.length) return '';
    if (required.some((r) => /Permanent Headshot/i.test(r.label))) {
      return (
        'That headshot link expires in a few minutes (temporary S3/signed URL). ' +
        'Use a permanent public image URL (HubSpot, company site, or 8upload direct link), then publish again.'
      );
    }
    return 'Before you can share, complete: ' + required.map((r) => r.label).join(', ') + '.';
  }

  function notify(msg, type) {
    if (typeof window.showToast === 'function') window.showToast(msg, type || 'info');
    else if (typeof window.notifyUser === 'function') window.notifyUser(msg, type || 'info');
    else console.log('[partner-share]', msg);
  }

  function setStatus(el, text, ok) {
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('text-red-600', ok === false);
    el.classList.toggle('text-[#00A89D]', ok === true);
    el.classList.toggle('text-gray-500', ok == null);
  }

  function clearFieldHighlights() {
    document.querySelectorAll('.partner-share-need-field').forEach((el) => {
      el.classList.remove('partner-share-need-field', 'ring-2', 'ring-[#F15A29]', 'ring-offset-2');
    });
  }

  function highlightField(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('partner-share-need-field', 'ring-2', 'ring-[#F15A29]', 'ring-offset-2');
    try {
      el.focus({ preventScroll: true });
    } catch (e) {
      try {
        el.focus();
      } catch (e2) { /* ignore */ }
    }
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (e) { /* ignore */ }
  }

  function goToProfileField(field) {
    if (!field) return;
    if (typeof window.switchProfileTab === 'function') {
      window.switchProfileTab(field.tab || 'identity');
    }
    setTimeout(() => {
      highlightField(field.id);
      (field.alsoIds || []).forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.classList.add('partner-share-need-field', 'ring-2', 'ring-[#F15A29]', 'ring-offset-2');
      });
    }, 120);
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, '&#39;');
  }

  function renderPreview(card) {
    const box = document.getElementById('partner-share-preview');
    if (!box) return;
    card = card || buildPublicCardFromProfile();
    const photo = card.headshotUrl
      ? `<img src="${escapeAttr(card.headshotUrl)}" alt="" class="partner-share-avatar object-cover border border-gray-200 bg-white" onerror="this.style.display='none'">`
      : `<div class="partner-share-avatar partner-share-avatar--placeholder bg-[#00A89D]/15 text-[#00A89D] flex items-center justify-center text-lg font-bold">${escapeHtml((card.name || '?').charAt(0))}</div>`;
    const bits = [card.phone, card.email, card.nmls ? `NMLS ${card.nmls}` : ''].filter(Boolean);
    const gaps = getPartnerFieldGaps(card);
    const checklist = gaps.required.length
      ? `<ul class="text-[11px] text-[#F15A29] m-0 mt-2 pl-4 list-disc space-y-0.5">
          ${gaps.required
            .map(
              (r) =>
                `<li><button type="button" class="underline font-semibold partner-gap-jump" data-gap-id="${escapeAttr(r.id)}" data-gap-tab="${escapeAttr(r.tab)}">${escapeHtml(r.label)}</button> — required</li>`
            )
            .join('')}
        </ul>`
      : `<p class="text-[11px] text-[#00A89D] m-0 mt-2"><i class="fas fa-check-circle mr-1"></i>Ready to publish — partners will see this plate.</p>`;
    box.innerHTML = `
      <p class="text-[10px] font-bold uppercase tracking-wider text-[#00A89D] m-0 mb-2">What partners see</p>
      <div class="flex items-center gap-3">
        ${photo}
        <div class="min-w-0">
          <div class="text-sm font-bold text-[#002B5C] dark:text-white truncate">${escapeHtml(card.name || 'Your name')}</div>
          <div class="text-[11px] text-gray-500 truncate">${escapeHtml(card.title || DEFAULT_TITLE)}${card.location ? ' · ' + escapeHtml(card.location) : ''}</div>
          <div class="text-[11px] text-gray-600 dark:text-gray-300 truncate">${escapeHtml(bits.join(' · ') || 'Add phone or email')}</div>
        </div>
      </div>
      ${checklist}`;
    box.querySelectorAll('.partner-gap-jump').forEach((btn) => {
      btn.addEventListener('click', () => {
        goToProfileField({
          id: btn.getAttribute('data-gap-id'),
          tab: btn.getAttribute('data-gap-tab')
        });
      });
    });
  }

  async function copyText(text) {
    if (!text) return false;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
      } catch (e2) {
        return false;
      }
    }
  }

  function firstName(full) {
    const n = String(full || '').trim();
    if (!n) return '';
    return n.split(/\s+/)[0];
  }

  function buildPartnerEmailDraft(shareUrl, card) {
    card = card || buildPublicCardFromProfile();
    const loFirst = firstName(card.name) || 'I';
    const subject = `${loFirst} shared a free sales tool to help grow your business`;
    // No signature block in the body — Outlook/Exchange attaches the LO’s official signature.
    const body = [
      'Hi,',
      '',
      `I wanted to share a free resource I think you'll get a lot out of — the Ultimate Agent Sales Coach.`,
      '',
      `It's a practical toolkit built for real estate agents: listing descriptions, open house scripts, buyer/seller consults, social & newsletter content, weekly planning, and more — so you spend less time staring at a blank page and more time winning business.`,
      '',
      `I've personalized a link so when you open it, you'll see my contact info right in the header. Use it anytime — and please reach out if I can help with financing, pre-approvals, or partnering on your next file.`,
      '',
      'Open your personalized coach here:',
      shareUrl,
      '',
      `I'm grateful for our partnership and want to be a resource for your business in every way I can. If something would make this more useful for you, just tell me.`,
      '',
      'Looking forward to working together,'
    ].join('\n');

    return { subject, body };
  }

  function openPartnerEmailDraft(shareUrl, card) {
    const url = shareUrl || localStorage.getItem(LAST_URL_KEY) || '';
    if (!url) {
      notify('Publish your partner card first so we can include your link.', 'warning');
      return;
    }
    const draft = buildPartnerEmailDraft(url, card || buildPublicCardFromProfile());
    // Leave "to" blank — LO types the realtor's address (signature comes from Outlook)
    const mailto =
      'mailto:?' +
      'subject=' +
      encodeURIComponent(draft.subject) +
      '&body=' +
      encodeURIComponent(draft.body);
    // Prefer window.open for Outlook desktop protocol handlers; fallback location
    try {
      const w = window.open(mailto, '_self');
      if (!w) window.location.href = mailto;
    } catch (e) {
      window.location.href = mailto;
    }
    notify('Email draft opened — add the realtor’s address and send. Your Outlook signature will attach as usual.', 'success');
  }

  async function publishPartnerCard(opts) {
    opts = opts || {};
    const statusEl = document.getElementById('partner-share-status');
    const urlEl = document.getElementById('partner-share-url');
    const card = buildPublicCardFromProfile();
    renderPreview(card);

    const gaps = getPartnerFieldGaps(card);
    if (gaps.required.length) {
      const msg = validateCard(card);
      setStatus(statusEl, msg, false);
      notify(msg, 'warning');
      goToProfileField(gaps.required[0]);
      return null;
    }

    setStatus(statusEl, 'Publishing partner card…', null);
    // Prefer last durable signed token when re-publishing (server always mints new signed)
    const prevToken = localStorage.getItem(TOKEN_KEY) || '';

    try {
      const res = await fetch('/api/partner/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card, token: prevToken || undefined })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        const msg = data.error || `Publish failed (${res.status})`;
        setStatus(statusEl, msg, false);
        notify(msg, 'error');
        return null;
      }
      try {
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(LAST_URL_KEY, data.shareUrl || '');
      } catch (e) { /* private mode */ }
      if (urlEl) urlEl.value = data.shareUrl || '';
      clearFieldHighlights();

      const copied = opts.skipAutoCopy ? false : await copyText(data.shareUrl || '');
      let okMsg = copied
        ? 'Published — short link copied. Next: Email to realtor (or paste anywhere).'
        : 'Published. Copy the short link below, then Email to realtor.';
      // Free Render redeploys wipe the LO server store — re-publish re-binds the same short code.
      okMsg +=
        ' Tip: after any LO app redeploy, tap Publish once so partner links keep working.';
      setStatus(statusEl, okMsg, true);
      notify(copied ? 'Link copied — ready to email' : 'Partner link ready', 'success');
      updateHomeShareCard();
      // One-click path: publish then open email draft
      if (opts.openEmailAfter) {
        openPartnerEmailDraft(data.shareUrl || '', card);
      }
      return data;
    } catch (e) {
      const msg =
        'Could not reach the LO server. On production, confirm the LO app is deployed; locally start the proxy on port 3000.';
      setStatus(statusEl, msg, false);
      notify(msg, 'error');
      return null;
    }
  }

  async function copyPartnerLink() {
    const urlEl = document.getElementById('partner-share-url');
    let url = (urlEl && urlEl.value) || localStorage.getItem(LAST_URL_KEY) || '';
    if (!url) {
      const data = await publishPartnerCard({ skipAutoCopy: true });
      url = (data && data.shareUrl) || '';
    }
    if (!url) return;
    const ok = await copyText(url);
    if (ok) {
      notify('Partner link copied', 'success');
      setStatus(document.getElementById('partner-share-status'), 'Link copied to clipboard.', true);
    } else {
      if (urlEl) {
        urlEl.focus();
        urlEl.select();
      }
      notify('Select the link and copy manually (Ctrl/Cmd+C)', 'info');
    }
  }

  async function emailPartnerLink() {
    // Always refresh card if profile is complete so plate stays current
    const gaps = getPartnerFieldGaps();
    if (gaps.required.length) {
      notify(validateCard(gaps.card), 'warning');
      openShareWithPartners();
      return;
    }
    let url = localStorage.getItem(LAST_URL_KEY) || document.getElementById('partner-share-url')?.value || '';
    if (!url) {
      const data = await publishPartnerCard({ skipAutoCopy: false, openEmailAfter: false });
      url = (data && data.shareUrl) || '';
      if (!url) return;
      openPartnerEmailDraft(url, buildPublicCardFromProfile());
      return;
    }
    // Re-publish quietly so contact/photo updates ship with the same short code when possible
    await publishPartnerCard({ skipAutoCopy: true, openEmailAfter: true });
  }

  function ensurePartnerShareStyles() {
    if (document.getElementById('partner-share-avatar-styles')) return;
    const style = document.createElement('style');
    style.id = 'partner-share-avatar-styles';
    style.textContent = `
      .partner-share-avatar {
        width: 3.25rem;
        height: 4rem;
        border-radius: 50%;
        object-fit: cover;
        object-position: center 18%;
        flex-shrink: 0;
      }
      .partner-share-avatar--placeholder { object-fit: unset; }
      #partner-share-home-card .partner-share-avatar {
        width: 2.75rem;
        height: 3.35rem;
      }
    `;
    document.head.appendChild(style);
  }

  function ensurePartnerSharePanel() {
    if (document.getElementById('partner-share-panel')) return;

    const host =
      document.getElementById('profile-tab-panel-identity') ||
      document.getElementById('profile-form-scroll');
    if (!host) return;

    ensurePartnerShareStyles();

    const panel = document.createElement('div');
    panel.id = 'partner-share-panel';
    panel.className =
      'mt-6 p-4 sm:p-5 rounded-2xl border-2 border-[#00A89D]/30 bg-gradient-to-br from-[#00A89D]/8 to-transparent';
    panel.innerHTML = `
      <div class="flex items-start gap-3 mb-3">
        <span class="shrink-0 w-10 h-10 rounded-2xl bg-[#00A89D]/15 flex items-center justify-center">
          <i class="fas fa-handshake text-[#00A89D]"></i>
        </span>
        <div class="min-w-0">
          <h3 class="text-base font-bold text-[#002B5C] dark:text-white m-0">Branded link (after they join)</h3>
          <p class="text-xs text-gray-600 dark:text-gray-400 m-0 mt-1 leading-relaxed">
            Short link so partners who <strong>already have</strong> Agent Sales Coach see you as their LO
            (photo, phone, email). This does <strong>not</strong> create their account —
            use <strong>Invite a realtor partner</strong> on Home first for new partners.
          </p>
        </div>
      </div>
      <div id="partner-share-preview" class="mb-3 p-3 rounded-xl bg-white/80 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700"></div>
      <label class="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Your short partner link</label>
      <input type="text" id="partner-share-url" readonly
        class="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs text-gray-800 dark:text-gray-100 mb-3"
        placeholder="Publish to generate a short link…">
      <div class="flex flex-wrap gap-2">
        <button type="button" id="partner-share-publish"
          class="px-4 py-2 rounded-full bg-[#00A89D] text-white text-sm font-semibold hover:bg-[#008F85] transition"
          title="Saves your public card and copies the short link">
          <i class="fas fa-cloud-upload-alt mr-1"></i> Publish &amp; copy link
        </button>
        <button type="button" id="partner-share-email"
          class="px-4 py-2 rounded-full border-2 border-[#F15A29]/50 text-[#F15A29] text-sm font-semibold hover:bg-[#F15A29]/10 transition"
          title="For partners who already have Agent access">
          <i class="fas fa-envelope mr-1"></i> Email branded link
        </button>
      </div>
      <p id="partner-share-status" class="text-xs text-gray-500 m-0 mt-3"></p>
      <p class="text-[11px] text-gray-400 m-0 mt-2">
        <strong>Required:</strong> Full Name, Phone or Email, Headshot URL.
        New partners need an <strong>invite link</strong> (Home → Partners → Invite) so their account is tied to you.
        Publish once so invites can include your partner token for branding.
      </p>
    `;
    host.appendChild(panel);

    document.getElementById('partner-share-publish')?.addEventListener('click', () => {
      publishPartnerCard();
    });
    document.getElementById('partner-share-email')?.addEventListener('click', () => {
      emailPartnerLink();
    });

    const saved = localStorage.getItem(LAST_URL_KEY) || '';
    const urlEl = document.getElementById('partner-share-url');
    if (urlEl && saved) urlEl.value = saved;
    renderPreview(buildPublicCardFromProfile());
  }

  function updateHomeShareCard() {
    const slot = document.getElementById('partner-share-home-card');
    if (!slot) return;
    const card = buildPublicCardFromProfile();
    const link = localStorage.getItem(LAST_URL_KEY) || '';
    const hasLink = !!link;
    const gaps = getPartnerFieldGaps(card);
    const ready = gaps.required.length === 0;
    const missingLabels = gaps.required.map((r) => r.label).join(', ');
    // Only signed-in LOs get invite (body.lo-can-invite from auth gate)
    const canInvite =
      (typeof document !== 'undefined' &&
        document.body &&
        document.body.classList.contains('lo-can-invite')) ||
      (window.__loUser &&
        (window.__loUser.can_invite_realtors ||
          window.__loUser.role === 'loan_officer' ||
          window.__loUser.role === 'admin'));

    // Step 2 secondary actions — branded link for partners who already have accounts
    let step2Hint;
    if (!ready) {
      step2Hint = `Finish My Profile (${missingLabels}) so your branded plate is ready after they join.`;
    } else if (hasLink) {
      step2Hint = 'They already have an account? Send your short branded Agent link (photo + contact in the header).';
    } else {
      step2Hint = 'After they join, publish your LO card once, then share the branded link with partners who already have access.';
    }

    slot.innerHTML = `
      <div class="rounded-2xl border border-[#00A89D]/30 bg-gradient-to-br from-[#00A89D]/10 via-white to-white dark:from-[#00A89D]/15 dark:via-gray-900 dark:to-gray-900 shadow-md overflow-hidden">
        <div class="px-4 sm:px-5 pt-4 pb-3 border-b border-[#00A89D]/15 dark:border-gray-700">
          <div class="flex items-start gap-3">
            <span class="shrink-0 w-11 h-11 rounded-2xl bg-[#00A89D]/15 text-[#00A89D] flex items-center justify-center text-lg">
              <i class="fas fa-handshake"></i>
            </span>
            <div class="min-w-0">
              <div class="text-[10px] font-bold uppercase tracking-wider text-[#00A89D]">Partners</div>
              <h3 class="text-base sm:text-lg font-bold text-[#002B5C] dark:text-white m-0">Grow realtor partners</h3>
              <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 m-0 mt-1 leading-relaxed">
                First get them into <strong>Agent Sales Coach</strong> with a personal invite (their account links to you). Then share tools and your branded link.
              </p>
            </div>
          </div>
        </div>

        <div class="px-4 sm:px-5 py-4 space-y-3">
          <!-- Step 1: Invite (account creation) -->
          <div class="rounded-xl border-2 border-[#00A89D]/40 bg-white dark:bg-gray-900/80 p-3.5 sm:p-4">
            <div class="flex flex-col sm:flex-row sm:items-center gap-3">
              <div class="flex items-start gap-2.5 flex-1 min-w-0">
                <span class="shrink-0 w-7 h-7 rounded-full bg-[#00A89D] text-white text-xs font-black flex items-center justify-center">1</span>
                <div class="min-w-0">
                  <div class="text-sm font-bold text-[#002B5C] dark:text-white">Invite partner</div>
                  <p class="text-xs text-gray-600 dark:text-gray-400 m-0 mt-0.5 leading-relaxed">
                    Personal invite link/code · they create their account · your branding rides along on accept.
                    <span class="text-gray-500">This is how you get them into the product — not a generic email.</span>
                  </p>
                </div>
              </div>
              <button type="button" data-partner-home="invite"
                class="shrink-0 px-4 py-2.5 rounded-full bg-[#00A89D] text-white text-sm font-bold hover:bg-[#008F85] transition shadow-sm ${canInvite ? '' : 'opacity-50'}"
                ${canInvite ? '' : 'disabled title="Sign in as a Ruoff LO to invite"'}>
                <i class="fas fa-user-plus mr-1"></i> Invite a realtor partner
              </button>
            </div>
          </div>

          <!-- Step 2: Share / email (existing partners) -->
          <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/40 p-3.5 sm:p-4">
            <div class="flex flex-col sm:flex-row sm:items-center gap-3">
              <div class="flex items-start gap-2.5 flex-1 min-w-0">
                <span class="shrink-0 w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-600 text-[#002B5C] dark:text-white text-xs font-black flex items-center justify-center">2</span>
                <div class="min-w-0">
                  <div class="text-sm font-bold text-[#002B5C] dark:text-white">After they join — share tools</div>
                  <p class="text-xs text-gray-600 dark:text-gray-400 m-0 mt-0.5 leading-relaxed">${escapeHtml(step2Hint)}</p>
                  ${
                    hasLink
                      ? `<p class="text-[11px] font-mono text-gray-500 m-0 mt-1.5 truncate" title="${escapeAttr(link)}">${escapeHtml(link)}</p>`
                      : ''
                  }
                  <p class="text-[11px] text-gray-500 m-0 mt-1.5">
                    <i class="fas fa-info-circle text-[#00A89D] mr-1"></i>
                    Email / branded link does <strong>not</strong> create an account — use <strong>Invite</strong> first for new partners.
                  </p>
                </div>
              </div>
              <div class="flex flex-wrap gap-2 shrink-0">
                ${
                  hasLink
                    ? `<button type="button" data-partner-home="email"
                        class="px-3.5 py-2 rounded-full border-2 border-[#F15A29]/50 text-[#F15A29] text-xs font-bold hover:bg-[#F15A29]/10 transition"
                        title="For partners who already have Agent access">
                        <i class="fas fa-envelope mr-1"></i>Email branded link
                      </button>
                      <button type="button" data-partner-home="copy"
                        class="px-3.5 py-2 rounded-full border border-gray-300 dark:border-gray-600 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                        <i class="fas fa-copy mr-1"></i>Copy
                      </button>`
                    : ready
                      ? `<button type="button" data-partner-home="open"
                          class="px-3.5 py-2 rounded-full border border-gray-300 dark:border-gray-600 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                          Publish branded link
                        </button>`
                      : `<button type="button" data-partner-home="open"
                          class="px-3.5 py-2 rounded-full border border-gray-300 dark:border-gray-600 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                          Complete profile
                        </button>`
                }
              </div>
            </div>
          </div>
        </div>
      </div>`;

    slot.querySelectorAll('[data-partner-home]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const act = btn.getAttribute('data-partner-home');
        if (act === 'invite') {
          if (typeof window.showSection === 'function') window.showSection('invite-realtors');
          else location.hash = 'invite-realtors';
          return;
        }
        if (act === 'email') return emailPartnerLink();
        if (act === 'copy') return copyPartnerLink();
        if (act === 'publish-email') {
          await publishPartnerCard({ openEmailAfter: true });
          return;
        }
        openShareWithPartners();
      });
    });
  }

  function ensureHomeShareCard() {
    if (document.getElementById('partner-share-home-card')) {
      updateHomeShareCard();
      return;
    }
    const setup = document.getElementById('home-setup-slot');
    const home = document.getElementById('home');
    const host = setup || home;
    if (!host) return;
    const wrap = document.createElement('div');
    wrap.id = 'partner-share-home-card';
    wrap.className = 'w-full';
    // After setup slot (not in hero) so Partners sits in the home body
    if (setup && setup.parentNode) {
      setup.parentNode.insertBefore(wrap, setup.nextSibling);
    } else if (home) {
      home.insertBefore(wrap, home.firstChild?.nextSibling || null);
    }
    updateHomeShareCard();
  }

  // Re-paint Partners card when LO signs in (invite CTA visibility)
  document.addEventListener('lo-auth-ready', () => {
    try {
      updateHomeShareCard();
    } catch (e) {
      /* ignore */
    }
  });

  function scrollToPartnerPanel() {
    const panel = document.getElementById('partner-share-panel');
    if (!panel) return;
    try {
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) { /* ignore */ }
  }

  function openShareWithPartners() {
    clearFieldHighlights();
    ensurePartnerSharePanel();

    if (typeof window.openUserProfile === 'function') {
      window.openUserProfile(true);
    } else {
      notify('My Profile is not ready yet — try again in a moment.', 'warning');
      return;
    }

    setTimeout(() => {
      ensurePartnerSharePanel();
      const gaps = getPartnerFieldGaps();
      const statusEl = document.getElementById('partner-share-status');
      renderPreview(gaps.card);

      if (gaps.required.length) {
        const labels = gaps.required.map((r) => r.label).join(', ');
        const msg =
          'Before you can share with partners, complete: ' +
          labels +
          '. We’ve opened the first missing field for you.';
        setStatus(statusEl, msg, false);
        notify(msg, 'warning');
        goToProfileField(gaps.required[0]);
        return;
      }

      if (typeof window.switchProfileTab === 'function') {
        window.switchProfileTab('identity');
      }
      setTimeout(() => {
        scrollToPartnerPanel();
        const hasLink = !!(localStorage.getItem(LAST_URL_KEY) || '');
        setStatus(
          statusEl,
          hasLink
            ? 'Ready — Publish & copy updates your plate, or Email to realtor in one click.'
            : 'Ready — click Publish & copy link, then Email to realtor.',
          true
        );
      }, 80);
    }, 150);
  }

  function refreshOnProfileOpen() {
    ensurePartnerSharePanel();
    renderPreview(buildPublicCardFromProfile());
    updateHomeShareCard();
  }

  function refreshPartnerSharePreview() {
    renderPreview(buildPublicCardFromProfile());
    updateHomeShareCard();
  }

  function init() {
    ensurePartnerSharePanel();
    ensureHomeShareCard();
    renderPreview(buildPublicCardFromProfile());

    const openBtn = document.getElementById('open-profile-btn');
    if (openBtn && !openBtn.dataset.partnerShareWired) {
      openBtn.dataset.partnerShareWired = '1';
      openBtn.addEventListener('click', () => setTimeout(refreshOnProfileOpen, 80));
    }

    const side = document.getElementById('sidebar-share-partners');
    if (side && !side.dataset.partnerShareWired) {
      side.dataset.partnerShareWired = '1';
      side.addEventListener('click', (e) => {
        e.preventDefault();
        openShareWithPartners();
      });
    }

    [
      'profile-name',
      'profile-phone',
      'profile-email',
      'profile-nmls',
      'profile-headshot-url',
      'profile-location'
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (!el || el.dataset.partnerShareWired) return;
      el.dataset.partnerShareWired = '1';
      el.addEventListener('input', () => {
        el.classList.remove('partner-share-need-field', 'ring-2', 'ring-[#F15A29]', 'ring-offset-2');
        renderPreview(buildPublicCardFromProfile());
        updateHomeShareCard();
      });
    });
  }

  window.publishPartnerCard = publishPartnerCard;
  window.copyPartnerShareLink = copyPartnerLink;
  window.emailPartnerShareLink = emailPartnerLink;
  window.buildPublicLoCard = buildPublicCardFromProfile;
  window.openShareWithPartners = openShareWithPartners;
  window.getPartnerFieldGaps = getPartnerFieldGaps;
  window.refreshPartnerSharePreview = refreshPartnerSharePreview;

  window.addEventListener('profile-updated', () => {
    try { refreshPartnerSharePreview(); } catch (e) { /* ignore */ }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  setTimeout(init, 400);
  setTimeout(ensureHomeShareCard, 800);
})();
