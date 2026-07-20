/**
 * js/api.js
 * Centralized Grok / xAI API client for the Loan Officer Sales Coach.
 *
 * - Single place for all API calls (via local or hosted proxy)
 * - Optional user key in localStorage for local dev
 * - Hosted mode uses server-side XAI_API_KEY (no user prompt)
 * - 429 retries, timeouts, and friendly error messages
 *
 * Usage:
 *   const content = await callGrokAPI('Your prompt', { temperature: 0.7, max_tokens: 1200 });
 *   const chat = await callGrokAPI(null, { messages: [...] });
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'grokApiKey';
  const DEFAULT_MODEL = 'grok-4-1-fast-reasoning';
  // Underwriting may override model for factual accuracy; other tools use DEFAULT_MODEL.
  const DEBUG = !!(typeof window !== 'undefined' && window.GROK_API_DEBUG);

  function log() {
    if (!DEBUG) return;
    // eslint-disable-next-line prefer-rest-params
    console.log.apply(console, ['[Grok API]'].concat([].slice.call(arguments)));
  }

  function warn() {
    // eslint-disable-next-line prefer-rest-params
    console.warn.apply(console, ['[Grok API]'].concat([].slice.call(arguments)));
  }

  function safeStorageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function safeStorageSet(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      return false;
    }
  }

  function safeStorageRemove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) { /* private mode / quota */ }
  }

  /**
   * Detect local / self-hosted dev hosts where a user may paste their own key.
   */
  function isLocalDevHost() {
    if (typeof window === 'undefined') return false;
    const host = (window.location && window.location.hostname) || '';
    if (!host) return false;
    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host.endsWith('.local')
    );
  }

  /**
   * Hosted production (Render, custom domain, etc.): proxy owns the key.
   */
  function isProductionHosted() {
    if (typeof window !== 'undefined' && window.FORCE_HOSTED_MODE === true) return true;
    if (typeof window === 'undefined') return false;
    if (isLocalDevHost()) return false;
    const host = (window.location && window.location.hostname) || '';
    return !!host;
  }

  /**
   * Dynamic proxy URL. Prefer CUSTOM_PROXY_URL; hosted uses same-origin relative path.
   */
  function getProxyUrl() {
    if (typeof window !== 'undefined' && window.CUSTOM_PROXY_URL) {
      return window.CUSTOM_PROXY_URL;
    }
    if (typeof window !== 'undefined' && isProductionHosted()) {
      return '/api/v1/chat/completions';
    }
    const hn =
      typeof window !== 'undefined'
        ? window.location.hostname || 'localhost'
        : 'localhost';
    return `http://${hn}:3000/api/v1/chat/completions`;
  }

  function isValidGrokApiKey(key) {
    if (!key || typeof key !== 'string') return false;
    const k = key.trim();
    if (!k.startsWith('xai-')) return false;
    if (/yourkey|placeholder|example|xxx/i.test(k)) return false;
    if (k.length < 24) return false;
    return true;
  }

  function getGrokApiKey() {
    const key = safeStorageGet(STORAGE_KEY);
    return key && key.trim() ? key.trim() : null;
  }

  function setGrokApiKey(key) {
    if (!isValidGrokApiKey(key)) return false;
    return safeStorageSet(STORAGE_KEY, key.trim());
  }

  function promptForApiKey() {
    const msg = [
      'Grok API Key Required',
      '',
      'This tool uses the xAI Grok API for AI features (scripts, blogs, newsletters, etc.).',
      'Please paste your API key below.',
      '',
      'You can get one at https://console.x.ai (keys start with xai-).',
      'The key is saved in this browser only and is sent only to the local proxy.',
      '',
      'Note: Hosted deployments use a server-side key and should not show this prompt.'
    ].join('\n');

    const key = prompt(msg);
    if (!key) return null;

    if (isValidGrokApiKey(key)) {
      setGrokApiKey(key);
      if (window.showToast) {
        window.showToast('API key saved. You can change it anytime via API Key in the header.', 'success');
      } else {
        alert('API key saved successfully.');
      }
      return getGrokApiKey();
    }

    if (window.showToast) {
      window.showToast('Invalid key format. It should start with "xai-" and be a real key from console.x.ai.', 'error');
    } else {
      alert('Key must start with "xai-". Please try again.');
    }
    return null;
  }

  /**
   * Ensure we have a client-side key when needed.
   * Hosted mode returns null (proxy uses env key). Invalid stored keys are cleared.
   */
  function ensureApiKey() {
    let key = getGrokApiKey();
    if (key && !isValidGrokApiKey(key)) {
      safeStorageRemove(STORAGE_KEY);
      key = null;
    }
    if (!key) {
      if (isProductionHosted()) return null;
      key = promptForApiKey();
    }
    return key;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function parseRetryAfterMs(response) {
    const header = response.headers.get('Retry-After');
    if (!header) return null;
    const seconds = parseInt(header, 10);
    if (!Number.isNaN(seconds) && seconds > 0) return seconds * 1000;
    const dateMs = Date.parse(header);
    if (!Number.isNaN(dateMs)) return Math.max(0, dateMs - Date.now());
    return null;
  }

  function normalizeMessages(promptOrMessages, messagesOverride) {
    if (messagesOverride && Array.isArray(messagesOverride)) {
      return messagesOverride;
    }
    if (typeof promptOrMessages === 'string') {
      return [{ role: 'user', content: promptOrMessages }];
    }
    if (Array.isArray(promptOrMessages)) {
      return promptOrMessages;
    }
    throw new Error('callGrokAPI expects a prompt string or messages array');
  }

  /**
   * Call Grok via the proxy.
   * @param {string|Array|null} promptOrMessages
   * @param {object} [options]
   * @returns {Promise<string>} assistant message content
   */
  async function callGrokAPI(promptOrMessages, options = {}) {
    const {
      temperature = 0.8,
      max_tokens = 1400,
      model = DEFAULT_MODEL,
      messages: messagesOverride,
      timeoutMs = 180000,
      skipKeyPrompt = false,
      signal: externalSignal = null,
      maxRetries = 3,
      retryOn429 = true,
      onRetry = null
    } = options;

    log('Request →', getProxyUrl(), { model, max_tokens, timeoutMs });

    const apiKey = skipKeyPrompt ? getGrokApiKey() : ensureApiKey();

    // Hosted / local proxy with server env key: apiKey may be null.
    if (!apiKey && !isProductionHosted() && !isLocalDevHost()) {
      throw new Error(
        'No Grok API key available. AI features are disabled until a valid key is provided.'
      );
    }

    const messages = normalizeMessages(promptOrMessages, messagesOverride);
    const payload = { model, messages, temperature, max_tokens };
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

    const maxAttempts = retryOn429 ? maxRetries + 1 : 1;

    try {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (externalSignal && externalSignal.aborted) {
          throw new DOMException('Aborted', 'AbortError');
        }

        const controller = new AbortController();
        const onExternalAbort = () => controller.abort();
        if (externalSignal) {
          if (externalSignal.aborted) controller.abort();
          else externalSignal.addEventListener('abort', onExternalAbort, { once: true });
        }

        const timeoutId = setTimeout(() => {
          warn('Aborting — timeout', timeoutMs, 'ms');
          controller.abort();
        }, timeoutMs);

        let response;
        try {
          response = await fetch(getProxyUrl(), {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            signal: controller.signal
          });
        } finally {
          clearTimeout(timeoutId);
          if (externalSignal) {
            externalSignal.removeEventListener('abort', onExternalAbort);
          }
        }

        if (response.status === 429 && attempt < maxAttempts) {
          const errorText = await response.text().catch(() => '');
          const retryAfterMs = parseRetryAfterMs(response);
          const delayMs = Math.min(retryAfterMs || 2000 * Math.pow(2, attempt - 1), 30000);
          warn('429 rate limit — retry', attempt, 'of', maxRetries, 'in', delayMs, 'ms', errorText);
          if (typeof onRetry === 'function') {
            onRetry({ attempt, maxRetries, delayMs });
          }
          await sleep(delayMs);
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text().catch(() => '(no response body)');
          console.error('[Grok API] HTTP error', response.status, errorText);

          const isBadKey =
            response.status === 401 ||
            response.status === 403 ||
            (response.status === 400 && /api key|incorrect api key|invalid.*key/i.test(errorText));

          if (isBadKey) {
            if (isProductionHosted()) {
              throw new Error(
                'The hosted API service is not configured with a valid key. Please contact the site owner.'
              );
            }
            safeStorageRemove(STORAGE_KEY);
            throw new Error(
              'Invalid Grok API key. Click API Key in the header and paste a valid xai- key from console.x.ai.'
            );
          }

          if (response.status === 429) {
            throw new Error(
              'xAI is temporarily at capacity (rate limit). Wait 30–60 seconds, then try again.'
            );
          }

          throw new Error(`API request failed (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        const content =
          data &&
          data.choices &&
          data.choices[0] &&
          data.choices[0].message &&
          data.choices[0].message.content
            ? String(data.choices[0].message.content).trim()
            : '';

        if (!content) {
          throw new Error('Empty response from Grok API');
        }

        return content;
      }

      // Should only reach here if the retry loop exhausted without throwing.
      throw new Error('xAI is temporarily at capacity (rate limit). Wait 30–60 seconds, then try again.');
    } catch (err) {
      console.error('[Grok API] callGrokAPI failed to ' + getProxyUrl() + ':', err);
      if (err && err.name === 'AbortError') {
        throw new Error(
          'The AI request timed out. Please try again — for newsletter edits, try a shorter, more specific change.'
        );
      }
      const msg = (err && err.message) || '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        if (isProductionHosted()) {
          throw new Error(
            `Could not reach the API service at ${getProxyUrl()}. The hosted service may be starting up or temporarily unavailable. Please try again in a moment.`
          );
        }
        throw new Error(
          `Failed to fetch from proxy at ${getProxyUrl()}. Ensure the proxy is running (bash start-proxy.sh or start-proxy.bat). You can serve the HTML from port 8080 (or any), but the proxy/API must be reachable at 3000 (or set window.CUSTOM_PROXY_URL if you changed the proxy port). Check proxy terminal for errors. Use console: window.testProxyConnection()`
        );
      }
      throw err;
    }
  }

  // Public API (classic script globals used by feature modules)
  window.getGrokApiKey = getGrokApiKey;
  window.setGrokApiKey = setGrokApiKey;
  window.callGrokAPI = callGrokAPI;
  window.ensureGrokApiKey = ensureApiKey;
  window.isValidGrokApiKey = isValidGrokApiKey;
  window.isProductionHosted = isProductionHosted;
  window.isLocalDevHost = isLocalDevHost;
  window.getProxyUrl = getProxyUrl;

  /** Base origin of the coach proxy for embeds (empty string = same-origin relative). */
  window.getProxyBaseUrl = function getProxyBaseUrl() {
    try {
      const u = getProxyUrl();
      if (!u || u.startsWith('/')) return '';
      return u.replace(/\/api\/v1\/chat\/completions\/?$/, '');
    } catch (e) {
      return '';
    }
  };

  window.clearGrokApiKey = function clearGrokApiKey() {
    safeStorageRemove(STORAGE_KEY);
    if (window.showToast) window.showToast('API key cleared.', 'info');
    else console.log('Grok API key cleared from localStorage');
  };

  /** Console helper: window.testProxyConnection() */
  window.testProxyConnection = async function testProxyConnection() {
    const url = getProxyUrl();
    console.log('[Proxy Test] Testing connection to', url);
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-key'
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          messages: [{ role: 'user', content: 'test' }]
        })
      });
      console.log('[Proxy Test] Response status:', resp.status);
      const text = await resp.text().catch(() => '');
      console.log('[Proxy Test] Response (first 200 chars):', text.substring(0, 200));
      return { status: resp.status, ok: resp.ok };
    } catch (e) {
      console.error('[Proxy Test] Failed to connect:', e.message);
      alert(
        'Proxy test failed: ' +
          e.message +
          '\n\nMake sure proxy is running on the expected port (default 3000). If serving HTML on 8080, API still needs proxy on 3000 (or set window.CUSTOM_PROXY_URL).'
      );
      return { error: e.message };
    }
  };

  if (DEBUG) {
    console.log(
      '%c[api.js] Debug mode on (window.GROK_API_DEBUG). Test proxy: window.testProxyConnection()',
      'color:#00A89D'
    );
  }
})();
