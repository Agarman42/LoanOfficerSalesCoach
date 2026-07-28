/**
 * LO brand chrome on Realtor coach.
 * Reads ?lo=TOKEN (or sessionStorage), fetches public card from LO partner API, paints #lo-brand-plate.
 */
(function () {
  'use strict';

  const TOKEN_KEY = 'loPartnerToken';
  const CARD_KEY = 'loPartnerCard';

  function isLocalHost() {
    const h = location.hostname;
    return h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
  }

  /**
   * Base URL of LO app that hosts GET /api/partner/:token
   * Local default: http://localhost:3000
   * Production: set window.LO_PARTNER_API_BASE or meta[name=lo-partner-api]
   */
  function getLoPartnerApiBase() {
    if (window.LO_PARTNER_API_BASE) return String(window.LO_PARTNER_API_BASE).replace(/\/+$/, '');
    const meta = document.querySelector('meta[name="lo-partner-api"]');
    if (meta && meta.content) return String(meta.content).replace(/\/+$/, '');
    try {
      const saved = localStorage.getItem('loPartnerApiBase');
      if (saved) return saved.replace(/\/+$/, '');
    } catch (e) { /* ignore */ }
    if (isLocalHost()) return 'http://localhost:3000';
    // Same origin only if LO API were mounted on this host (not default)
    return '';
  }

  function readTokenFromUrl() {
    try {
      const u = new URL(location.href);
      return (u.searchParams.get('lo') || u.searchParams.get('partner') || '').trim();
    } catch (e) {
      return '';
    }
  }

  function persistToken(token) {
    try {
      if (token) sessionStorage.setItem(TOKEN_KEY, token);
    } catch (e) { /* ignore */ }
  }

  function loadStoredToken() {
    try {
      return sessionStorage.getItem(TOKEN_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function telHref(phone) {
    const digits = String(phone || '').replace(/[^\d+]/g, '');
    return digits ? `tel:${digits}` : '';
  }

  function paintBrandPlate(card) {
    const plate = document.getElementById('lo-brand-plate');
    if (!plate) return;

    if (!card || !card.name) {
      plate.hidden = true;
      plate.setAttribute('aria-hidden', 'true');
      plate.innerHTML = '';
      plate.classList.remove('is-populated');
      document.body.classList.remove('has-lo-brand');
      return;
    }

    const photo = card.headshotUrl
      ? `<img class="lo-brand-photo" src="${escapeHtml(card.headshotUrl)}" alt="" width="40" height="40" onerror="this.remove()">`
      : `<span class="lo-brand-initial" aria-hidden="true">${escapeHtml(card.name.charAt(0))}</span>`;

    const phoneLink = card.phone
      ? `<a class="lo-brand-contact" href="${escapeHtml(telHref(card.phone))}">${escapeHtml(card.phone)}</a>`
      : '';
    const emailLink = card.email
      ? `<a class="lo-brand-contact" href="mailto:${escapeHtml(card.email)}">${escapeHtml(card.email)}</a>`
      : '';
    const nmls = card.nmls ? `<span class="lo-brand-nmls">NMLS ${escapeHtml(card.nmls)}</span>` : '';

    plate.hidden = false;
    plate.setAttribute('aria-hidden', 'false');
    plate.classList.add('is-populated');
    plate.innerHTML = `
      <div class="lo-brand-inner">
        <div class="lo-brand-photo-wrap">${photo}</div>
        <div class="lo-brand-text">
          <div class="lo-brand-kicker">${escapeHtml(card.title || 'Your loan officer')}</div>
          <div class="lo-brand-name">${escapeHtml(card.name)}</div>
          <div class="lo-brand-meta">
            ${phoneLink}
            ${emailLink}
            ${nmls}
          </div>
        </div>
      </div>
    `;
    document.body.classList.add('has-lo-brand');
    window.__loPartnerCard = card;
  }

  async function fetchCard(token) {
    const base = getLoPartnerApiBase();
    if (!base) {
      console.warn('[lo-brand] LO_PARTNER_API_BASE not configured');
      return null;
    }
    const url = `${base}/api/partner/${encodeURIComponent(token)}`;
    const res = await fetch(url, { method: 'GET', mode: 'cors', credentials: 'omit' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Partner card ${res.status}`);
    }
    const data = await res.json();
    if (!data.ok || !data.card) throw new Error('Invalid partner response');
    return data.card;
  }

  async function resolveAndPaint() {
    let token = readTokenFromUrl();
    if (token) {
      persistToken(token);
      // Clean URL so token isn’t left in shared screenshots forever (keep session)
      try {
        const u = new URL(location.href);
        if (u.searchParams.has('lo') || u.searchParams.has('partner')) {
          u.searchParams.delete('lo');
          u.searchParams.delete('partner');
          history.replaceState({}, '', u.pathname + u.search + u.hash);
        }
      } catch (e) { /* ignore */ }
    } else {
      token = loadStoredToken();
    }

    if (!token) {
      paintBrandPlate(null);
      return;
    }

    // Optimistic paint from session cache
    try {
      const cached = sessionStorage.getItem(CARD_KEY);
      if (cached) paintBrandPlate(JSON.parse(cached));
    } catch (e) { /* ignore */ }

    try {
      const card = await fetchCard(token);
      try {
        sessionStorage.setItem(CARD_KEY, JSON.stringify(card));
      } catch (e) { /* ignore */ }
      paintBrandPlate(card);
    } catch (e) {
      console.warn('[lo-brand] fetch failed', e.message || e);
      // Keep cached paint if any; otherwise clear
      try {
        if (!sessionStorage.getItem(CARD_KEY)) paintBrandPlate(null);
      } catch (e2) {
        paintBrandPlate(null);
      }
    }
  }

  window.refreshLoBrandChrome = resolveAndPaint;
  window.getLoPartnerCard = function () {
    return window.__loPartnerCard || null;
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', resolveAndPaint);
  } else {
    resolveAndPaint();
  }
})();
