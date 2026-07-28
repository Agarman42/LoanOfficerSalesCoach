/**
 * LO → partner share: publish public LO card to server, copy Realtor link.
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

  /** Prefer live form values when the profile modal is open. */
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

  function buildPublicCardFromProfile(p) {
    if (p && typeof p === 'object' && (p.name != null || p.phone != null)) {
      return {
        name: (p.name || '').trim(),
        phone: (p.phone || '').trim(),
        email: (p.email || '').trim(),
        nmls: (p.nmls || '').trim(),
        headshotUrl: (p.headshotUrl || p['headshot-url'] || '').trim(),
        title: (p.title || DEFAULT_TITLE).trim() || DEFAULT_TITLE,
        location: (p.location || p.localArea || p.market || '').trim(),
        company: (p.company || 'Ruoff Mortgage').trim()
      };
    }
    return readLiveOrProfile();
  }

  /**
   * Required for publish: name + (phone or email).
   * Headshot recommended for brand plate quality.
   */
  function getPartnerFieldGaps(card) {
    card = card || buildPublicCardFromProfile();
    const required = [];
    const recommended = [];

    if (!card.name) {
      required.push({
        id: 'profile-name',
        tab: 'identity',
        label: 'Full Name'
      });
    }
    if (!card.phone && !card.email) {
      required.push({
        id: 'profile-phone',
        tab: 'identity',
        label: 'Phone or Email',
        alsoIds: ['profile-email']
      });
    }
    if (!card.headshotUrl) {
      recommended.push({
        id: 'profile-headshot-url',
        tab: 'content',
        label: 'Professional Headshot URL'
      });
    }
    return { required, recommended, card };
  }

  function validateCard(card) {
    const { required } = getPartnerFieldGaps(card);
    if (!required.length) return '';
    return (
      'Complete in My Profile: ' +
      required.map((r) => r.label).join(', ') +
      '.'
    );
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
      el.classList.remove(
        'partner-share-need-field',
        'ring-2',
        'ring-[#F15A29]',
        'ring-offset-2'
      );
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
        if (el) {
          el.classList.add('partner-share-need-field', 'ring-2', 'ring-[#F15A29]', 'ring-offset-2');
        }
      });
    }, 120);
  }

  function renderPreview(card) {
    const box = document.getElementById('partner-share-preview');
    if (!box) return;
    card = card || buildPublicCardFromProfile();
    // Portrait oval — taller than wide so faces aren’t cropped like a circle
    const photo = card.headshotUrl
      ? `<img src="${escapeAttr(card.headshotUrl)}" alt="" class="partner-share-avatar object-cover border border-gray-200 bg-white" onerror="this.style.display='none'">`
      : `<div class="partner-share-avatar partner-share-avatar--placeholder bg-[#00A89D]/15 text-[#00A89D] flex items-center justify-center text-lg font-bold">${escapeHtml((card.name || '?').charAt(0))}</div>`;
    const bits = [card.phone, card.email, card.nmls ? `NMLS ${card.nmls}` : ''].filter(Boolean);
    box.innerHTML = `
      <div class="flex items-center gap-3">
        ${photo}
        <div class="min-w-0">
          <div class="text-sm font-bold text-[#002B5C] dark:text-white truncate">${escapeHtml(card.name || 'Your name')}</div>
          <div class="text-[11px] text-gray-500 truncate">${escapeHtml(card.title || DEFAULT_TITLE)}${card.location ? ' · ' + escapeHtml(card.location) : ''}</div>
          <div class="text-[11px] text-gray-600 dark:text-gray-300 truncate">${escapeHtml(bits.join(' · ') || 'Add phone or email')}</div>
        </div>
      </div>`;
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

  async function publishPartnerCard() {
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
      let okMsg = 'Partner card published. Copy the link and send it to your agents.';
      if (gaps.recommended.length) {
        okMsg +=
          ' Tip: add a Professional Headshot URL (Voice & Links) so partners see your photo.';
      }
      setStatus(statusEl, okMsg, true);
      notify('Partner link ready', 'success');
      return data;
    } catch (e) {
      const msg =
        'Could not reach the LO server. Start the LO proxy (e.g. port 3000) and try again.';
      setStatus(statusEl, msg, false);
      notify(msg, 'error');
      return null;
    }
  }

  async function copyPartnerLink() {
    const urlEl = document.getElementById('partner-share-url');
    let url = (urlEl && urlEl.value) || localStorage.getItem(LAST_URL_KEY) || '';
    if (!url) {
      const data = await publishPartnerCard();
      url = (data && data.shareUrl) || '';
    }
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      notify('Partner link copied', 'success');
      setStatus(document.getElementById('partner-share-status'), 'Link copied to clipboard.', true);
    } catch (e) {
      if (urlEl) {
        urlEl.focus();
        urlEl.select();
      }
      notify('Select the link and copy manually (Ctrl/Cmd+C)', 'info');
    }
  }

  function ensurePartnerSharePanel() {
    if (document.getElementById('partner-share-panel')) return;

    const host =
      document.getElementById('profile-tab-panel-identity') ||
      document.getElementById('profile-form-scroll');
    if (!host) return;

    // Inject avatar styles once
    if (!document.getElementById('partner-share-avatar-styles')) {
      const style = document.createElement('style');
      style.id = 'partner-share-avatar-styles';
      style.textContent = `
        .partner-share-avatar {
          width: 3rem;
          height: 3.65rem;
          border-radius: 50%;
          object-fit: cover;
          object-position: center 18%;
          flex-shrink: 0;
        }
        .partner-share-avatar--placeholder {
          object-fit: unset;
        }
      `;
      document.head.appendChild(style);
    }

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
          <h3 class="text-base font-bold text-[#002B5C] dark:text-white m-0">Share with Partners</h3>
          <p class="text-xs text-gray-600 dark:text-gray-400 m-0 mt-1 leading-relaxed">
            Publish a <strong>public</strong> partner card (name, photo, phone, email, NMLS) to the LO server,
            then copy a link. Agents open it in the Realtor coach and see you as their <strong>Loan Officer</strong> in the header.
            Your full profile stays private on this device.
          </p>
        </div>
      </div>
      <div id="partner-share-preview" class="mb-3 p-3 rounded-xl bg-white/80 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700"></div>
      <label class="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Partner link</label>
      <input type="text" id="partner-share-url" readonly
        class="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs text-gray-800 dark:text-gray-100 mb-3"
        placeholder="Publish to generate a link…">
      <div class="flex flex-wrap gap-2">
        <button type="button" id="partner-share-publish"
          class="px-4 py-2 rounded-full bg-[#00A89D] text-white text-sm font-semibold hover:bg-[#008F85] transition">
          <i class="fas fa-cloud-upload-alt mr-1"></i> Publish / update card
        </button>
        <button type="button" id="partner-share-copy"
          class="px-4 py-2 rounded-full border-2 border-[#002B5C] text-[#002B5C] dark:text-gray-100 dark:border-gray-400 text-sm font-semibold hover:bg-[#002B5C]/5 transition">
          <i class="fas fa-copy mr-1"></i> Copy link
        </button>
      </div>
      <p id="partner-share-status" class="text-xs text-gray-500 m-0 mt-3"></p>
      <p class="text-[11px] text-gray-400 m-0 mt-2">Required: Full Name + Phone or Email. Recommended: Headshot (Voice &amp; Links tab).</p>
    `;
    host.appendChild(panel);

    document.getElementById('partner-share-publish')?.addEventListener('click', () => {
      publishPartnerCard();
    });
    document.getElementById('partner-share-copy')?.addEventListener('click', () => {
      copyPartnerLink();
    });

    const saved = localStorage.getItem(LAST_URL_KEY) || '';
    const urlEl = document.getElementById('partner-share-url');
    if (urlEl && saved) urlEl.value = saved;
    renderPreview(buildPublicCardFromProfile());
  }

  function scrollToPartnerPanel() {
    const panel = document.getElementById('partner-share-panel');
    if (!panel) return;
    try {
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) { /* ignore */ }
  }

  /**
   * Sidebar / header entry: open profile, validate fields, focus gaps or share panel.
   */
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
          '. We’ve opened those fields for you.';
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
        if (gaps.recommended.length) {
          setStatus(
            statusEl,
            'Ready to publish. Optional: add a Professional Headshot URL under Voice & Links for a better partner plate.',
            true
          );
        } else {
          setStatus(
            statusEl,
            'Ready — publish your card, then copy the partner link.',
            true
          );
        }
      }, 80);
    }, 150);
  }

  function refreshOnProfileOpen() {
    ensurePartnerSharePanel();
    renderPreview(buildPublicCardFromProfile());
  }

  function init() {
    ensurePartnerSharePanel();
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

    ['profile-name', 'profile-phone', 'profile-email', 'profile-nmls', 'profile-headshot-url', 'profile-location'].forEach(
      (id) => {
        const el = document.getElementById(id);
        if (!el || el.dataset.partnerShareWired) return;
        el.dataset.partnerShareWired = '1';
        el.addEventListener('input', () => {
          el.classList.remove('partner-share-need-field', 'ring-2', 'ring-[#F15A29]', 'ring-offset-2');
          renderPreview(readLiveOrProfile());
        });
      }
    );
  }

  window.publishPartnerCard = publishPartnerCard;
  window.copyPartnerShareLink = copyPartnerLink;
  window.buildPublicLoCard = buildPublicCardFromProfile;
  window.openShareWithPartners = openShareWithPartners;
  window.getPartnerFieldGaps = getPartnerFieldGaps;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  setTimeout(init, 400);
})();
