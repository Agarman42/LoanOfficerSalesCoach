/**
 * LO brand chrome on Realtor coach.
 * Reads ?lo=TOKEN (kept in the address bar so favorites/bookmarks stay branded),
 * falls back to localStorage/sessionStorage for in-app navigation, fetches card, paints plate + footer.
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

  /**
   * Keep short ?lo= in the address bar so "Add to favorites / bookmark" preserves branding.
   * Only used to *restore* the param if something stripped it (SPA nav edge cases).
   */
  function ensureTokenInUrl(token) {
    if (!token) return;
    try {
      const u = new URL(location.href);
      const current = (u.searchParams.get('lo') || '').trim();
      if (current === token) return;
      // Don't force a huge legacy s1.* blob back into the bar if user already cleaned it
      if (/^s1\./.test(token) && !current) return;
      u.searchParams.set('lo', token);
      u.searchParams.delete('partner');
      history.replaceState({}, '', u.pathname + u.search + u.hash);
    } catch (e) { /* ignore */ }
  }

  function persistToken(token) {
    if (!token) return;
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
    } catch (e) { /* ignore */ }
    try {
      // Survives new tabs / reopen favorite on this browser even if URL was cleaned somehow
      localStorage.setItem(TOKEN_KEY, token);
    } catch (e) { /* ignore */ }
  }

  function loadStoredToken() {
    try {
      return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || '';
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

  /** Digits only for tel: href (keeps leading + for international). */
  function telHref(phone) {
    const raw = String(phone || '').trim();
    if (!raw) return '';
    if (raw.startsWith('+')) {
      const rest = raw.slice(1).replace(/\D/g, '');
      return rest ? `tel:+${rest}` : '';
    }
    const digits = raw.replace(/\D/g, '');
    return digits ? `tel:${digits}` : '';
  }

  /**
   * Display phone with hyphens: 317-555-0100
   * Handles 10-digit US, 11-digit leading 1, otherwise returns cleaned input.
   */
  function formatPhoneDisplay(phone) {
    const raw = String(phone || '').trim();
    if (!raw) return '';
    let digits = raw.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('1')) {
      digits = digits.slice(1);
    }
    if (digits.length === 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    // Already well-formed with separators — normalize common (xxx) xxx-xxxx
    const m = raw.match(/^\(?(\d{3})\)?[\s.-]*(\d{3})[\s.-]*(\d{4})$/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    return raw;
  }

  function ensureBrandFooter() {
    let el = document.getElementById('lo-brand-footer');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'lo-brand-footer';
    el.className = 'lo-brand-footer';
    el.setAttribute('role', 'contentinfo');
    el.hidden = true;
    // Sit above the floating AI coach button
    document.body.appendChild(el);
    return el;
  }

  function paintBrandFooter(card) {
    const footer = ensureBrandFooter();
    if (!card || !card.name) {
      footer.hidden = true;
      footer.innerHTML = '';
      document.body.classList.remove('has-lo-brand-footer');
      return;
    }

    const phoneDisplay = formatPhoneDisplay(card.phone);
    const phoneHref = telHref(card.phone);
    const phoneLink =
      phoneDisplay && phoneHref
        ? `<a class="lo-brand-footer-link" href="${escapeHtml(phoneHref)}">${escapeHtml(phoneDisplay)}</a>`
        : '';
    const email = (card.email || '').trim();
    const emailLink = email
      ? `<a class="lo-brand-footer-link" href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>`
      : '';
    const bits = [phoneLink, emailLink, card.nmls ? `NMLS ${escapeHtml(card.nmls)}` : '']
      .filter(Boolean)
      .join(' <span class="lo-brand-footer-sep" aria-hidden="true">·</span> ');

    footer.hidden = false;
    document.body.classList.add('has-lo-brand-footer');
    footer.innerHTML = `
      <div class="lo-brand-footer-inner">
        <span class="lo-brand-footer-label">Provided by your Loan Officer</span>
        <strong class="lo-brand-footer-name">${escapeHtml(card.name)}</strong>
        ${bits ? `<span class="lo-brand-footer-meta">${bits}</span>` : ''}
      </div>
    `;
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
      paintBrandFooter(null);
      return;
    }

    const photo = card.headshotUrl
      ? `<img class="lo-brand-photo" src="${escapeHtml(card.headshotUrl)}" alt="${escapeHtml(card.name)}" width="56" height="70" onerror="this.remove()">`
      : `<span class="lo-brand-initial" aria-hidden="true">${escapeHtml(card.name.charAt(0))}</span>`;

    const phoneDisplay = formatPhoneDisplay(card.phone);
    const phoneHref = telHref(card.phone);
    const phoneLink =
      phoneDisplay && phoneHref
        ? `<a class="lo-brand-contact lo-brand-phone" href="${escapeHtml(phoneHref)}" title="Call ${escapeHtml(phoneDisplay)}">${escapeHtml(phoneDisplay)}</a>`
        : phoneDisplay
          ? `<span class="lo-brand-phone">${escapeHtml(phoneDisplay)}</span>`
          : '';

    const email = (card.email || '').trim();
    const emailLink = email
      ? `<a class="lo-brand-contact lo-brand-email" href="mailto:${escapeHtml(email)}" title="Email ${escapeHtml(email)}">${escapeHtml(email)}</a>`
      : '';

    const nmls = card.nmls ? `<span class="lo-brand-nmls">NMLS ${escapeHtml(card.nmls)}</span>` : '';

    plate.hidden = false;
    plate.setAttribute('aria-hidden', 'false');
    plate.classList.add('is-populated');
    plate.innerHTML = `
      <div class="lo-brand-inner">
        <div class="lo-brand-photo-wrap">${photo}</div>
        <div class="lo-brand-text">
          <div class="lo-brand-kicker">${escapeHtml(card.title || 'Your Loan Officer')}</div>
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
    paintBrandFooter(card);
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
    // Prefer URL so bookmarks/favorites with ?lo= always win
    let token = readTokenFromUrl();
    if (token) {
      persistToken(token);
      // Keep ?lo= in the bar — do NOT strip it (favorites need it)
    } else {
      token = loadStoredToken();
      // If we only have storage (e.g. SPA nav lost the query), put short code back in the URL
      if (token) ensureTokenInUrl(token);
    }

    if (!token) {
      paintBrandPlate(null);
      return;
    }

    try {
      const cached = sessionStorage.getItem(CARD_KEY) || localStorage.getItem(CARD_KEY);
      if (cached) paintBrandPlate(JSON.parse(cached));
    } catch (e) { /* ignore */ }

    try {
      const card = await fetchCard(token);
      try {
        sessionStorage.setItem(CARD_KEY, JSON.stringify(card));
        localStorage.setItem(CARD_KEY, JSON.stringify(card));
      } catch (e) { /* ignore */ }
      paintBrandPlate(card);
      // After success, ensure short code remains bookmarkable
      ensureTokenInUrl(token);
    } catch (e) {
      console.warn('[lo-brand] fetch failed', e.message || e);
      try {
        const cached = sessionStorage.getItem(CARD_KEY) || localStorage.getItem(CARD_KEY);
        if (!cached) paintBrandPlate(null);
      } catch (e2) {
        paintBrandPlate(null);
      }
    }
  }

  window.refreshLoBrandChrome = resolveAndPaint;
  window.getLoPartnerCard = function () {
    return window.__loPartnerCard || null;
  };
  window.getLoPartnerToken = loadStoredToken;
  window.formatPartnerPhoneDisplay = formatPhoneDisplay;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', resolveAndPaint);
  } else {
    resolveAndPaint();
  }

  // If in-app nav changes the URL without ?lo=, re-attach short code from storage
  window.addEventListener('hashchange', () => {
    const t = readTokenFromUrl() || loadStoredToken();
    if (t) ensureTokenInUrl(t);
  });
})();
