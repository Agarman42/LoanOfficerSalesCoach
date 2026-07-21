/**
 * LO Sales Coach Grok bridge for Smart Savings.
 * Loaded before app.js so callGrokAPI always hits the coach proxy.
 * Also rewrites legacy Render /grok fetch URLs if app.js still resolves them.
 */
(function () {
  'use strict';

  function resolveEndpoint() {
    if (window.RUOFF_GROK_URL) return window.RUOFF_GROK_URL;
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('grokProxy');
      if (q) return q;
    } catch (e) { /* ignore */ }
    try {
      if (window.parent && window.parent !== window && typeof window.parent.getProxyBaseUrl === 'function') {
        const base = window.parent.getProxyBaseUrl();
        if (base) {
          return String(base).replace(/\/$/, '') + '/api/v1/chat/completions';
        }
      }
    } catch (e) { /* ignore */ }
    return '/api/v1/chat/completions';
  }

  function buildHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    try {
      const key = localStorage.getItem('grokApiKey') || localStorage.getItem('xaiApiKey');
      if (key) headers['Authorization'] = 'Bearer ' + key;
    } catch (e) { /* ignore */ }
    try {
      if (window.parent && window.parent !== window && typeof window.parent.getGrokApiKey === 'function') {
        const k = window.parent.getGrokApiKey();
        if (k) headers['Authorization'] = 'Bearer ' + k;
      }
    } catch (e) { /* ignore */ }
    return headers;
  }

  async function callGrokAPI(body) {
    const endpoint = resolveEndpoint();
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      let detail = '';
      try {
        const errJson = await res.json();
        detail = (errJson && (errJson.error || errJson.message)) || '';
        if (typeof detail === 'object') detail = detail.message || JSON.stringify(detail);
      } catch (e) {
        detail = await res.text().catch(function () { return ''; });
      }
      throw new Error('Grok proxy ' + res.status + (detail ? ': ' + String(detail).slice(0, 200) : ''));
    }
    return res.json();
  }

  window.SMART_SAVINGS_EMBED = true;
  window.callGrokAPI = callGrokAPI;
  window.RUOFF_GROK_URL = window.RUOFF_GROK_URL || resolveEndpoint();

  // Rewrite legacy Render / same-origin /grok posts to LO coach API
  const originalFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    let url = typeof input === 'string' ? input : (input && input.url) || '';
    const isLegacyGrok =
      /ruofflorefinancecalculator\.onrender\.com\/grok/i.test(url) ||
      /(?:^|\/)grok\/?(\?|$)/i.test(url);
    if (isLegacyGrok) {
      const headers = Object.assign({}, (init && init.headers) || {}, buildHeaders());
      return originalFetch(resolveEndpoint(), Object.assign({}, init || {}, {
        method: (init && init.method) || 'POST',
        headers: headers,
        body: init && init.body
      }));
    }
    return originalFetch(input, init);
  };
})();
