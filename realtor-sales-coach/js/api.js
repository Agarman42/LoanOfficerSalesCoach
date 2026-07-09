/**
 * js/api.js
 * Centralized Grok / xAI API client for the Agent Sales Coach.
 *
 * Phase 0 refactor goals:
 * - Single place for all API calls
 * - No more hardcoded keys in index.html (or anywhere else)
 * - Key stored safely in localStorage (user pastes once)
 * - Clean error handling + user-friendly prompts
 *
 * Usage in other scripts:
 *   const content = await callGrokAPI("Your prompt here", { temperature: 0.7, max_tokens: 1200 });
 */

(function () {
  const STORAGE_KEY = 'grokApiKey';
  // Dynamic proxy URL: respects window.CUSTOM_PROXY_URL (set anytime before call, or at load), and uses current page's hostname (so works if not 'localhost')
  // Default always :3000 for the API proxy (even if you serve HTML from 8080).
  const getProxyUrl = () => {
    if (typeof window !== 'undefined' && window.CUSTOM_PROXY_URL) return window.CUSTOM_PROXY_URL;

    if (typeof window !== 'undefined' && isProductionHosted()) {
      // In production hosted mode (Render, etc.), the proxy and static files
      // are served from the exact same origin. Use a relative URL so it
      // automatically uses the correct protocol (HTTPS) and port.
      return '/api/v1/chat/completions';
    }

    // Local development: use same host:port as this page (realtor proxy defaults to :3001; LO uses :3000)
    const hn = (typeof window !== 'undefined' ? (window.location.hostname || 'localhost') : 'localhost');
    const port = (typeof window !== 'undefined' && window.location && window.location.port)
      ? window.location.port
      : '3001';
    return `http://${hn}:${port}/api/v1/chat/completions`;
  };

  /**
   * Detect if we are running against a hosted/production proxy (not localhost).
   * In this mode we can rely on a server-side XAI_API_KEY in the proxy and
   * should NOT prompt the end user for their own key.
   */
  function isProductionHosted() {
    if (typeof window !== 'undefined' && window.FORCE_HOSTED_MODE === true) return true;
    if (typeof window === 'undefined') return false;
    const host = (window.location && window.location.hostname) || '';
    if (!host) return false;
    // Local dev / self-hosted dev cases
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host.endsWith('.local')) return false;
    // Anything else (your Render URL, custom domain, Netlify, etc.) = hosted production
    return true;
  }
  const DEFAULT_MODEL = 'grok-4-1-fast-reasoning';  // Only underwriting overrides this for better factual accuracy on guideline questions (all other tools must use this model)

  /**
   * Get the current API key from localStorage.
   * Returns null if not set.
   */
  function getGrokApiKey() {
    return localStorage.getItem(STORAGE_KEY);
  }

  /**
   * Save the API key to localStorage.
   */
  function setGrokApiKey(key) {
    if (key && key.trim()) {
      localStorage.setItem(STORAGE_KEY, key.trim());
      return true;
    }
    return false;
  }

  /**
   * Prompt the user for their xAI/Grok API key (one-time).
   * Stores it automatically on success.
   */
  function promptForApiKey() {
    const msg = [
      '🔑 Enable Smart AI Tools',
      '',
      'This agent coach uses advanced AI to power the listing descriptions, scripts, blogs, and other generators.',
      'Paste your access key below to unlock them.',
      '',
      'Keys are stored only in your browser and used exclusively for this tool. In hosted versions the key is provided automatically.',
      '',
      'The key format starts with xai-.'
    ].join('\n');

    const key = prompt(msg);

    if (key && key.trim().startsWith('xai-')) {
      setGrokApiKey(key.trim());
      window.notifyUser('✅ API key saved! You can change it anytime in the future.', 'success');
      return getGrokApiKey();
    } else if (key) {
      window.notifyUser('Invalid key format. It should start with "xai-".', 'error');
      return null;
    }
    return null;
  }

  /**
   * Ensure we have a valid API key. Prompts the user if missing.
   * In production hosted mode (non-localhost proxy), we skip prompting
   * and let the server-side proxy use its own XAI_API_KEY env var.
   */
  function ensureApiKey() {
    let key = getGrokApiKey();
    if (!key) {
      if (isProductionHosted()) {
        // Hosted production build: the proxy server has the key in its environment.
        // Do not prompt users. We will send the request without a client key.
        return null;
      }
      key = promptForApiKey();
    }
    return key;
  }

  /**
   * Central function to call the Grok API via the local proxy.
   *
   * Accepts either:
   *   - A string prompt (most tools)
   *   - options.messages = [...] array for full chat history or system+user (AI Chat, advanced cases)
   *
   * @param {string|object} promptOrMessages
   * @param {object} [options]
   */
  async function callGrokAPI(promptOrMessages, options = {}) {
    console.log('[Grok API] Using PROXY_URL:', getProxyUrl());
    const apiKey = ensureApiKey();

    // In hosted mode we intentionally allow apiKey to be null here.
    // The proxy will use its own server-side key (XAI_API_KEY or GROK_API_KEY).
    // We only error early for non-hosted cases.
    if (!apiKey && !isProductionHosted()) {
      throw new Error('AI features require a valid access key. Please configure it to enable the smart generators.');
    }

    const {
      temperature = 0.8,
      max_tokens = 1400,
      model = DEFAULT_MODEL,
      messages: messagesOverride,
      timeoutMs = 180000
    } = options;

    let messages;
    if (messagesOverride && Array.isArray(messagesOverride)) {
      messages = messagesOverride;
    } else if (typeof promptOrMessages === 'string') {
      messages = [{ role: 'user', content: promptOrMessages }];
    } else if (Array.isArray(promptOrMessages)) {
      messages = promptOrMessages;
    } else {
      throw new Error('callGrokAPI expects a prompt string or messages array');
    }

    const payload = {
      model,
      messages,
      temperature,
      max_tokens
    };

    try {
      const headers = {
        'Content-Type': 'application/json'
      };

      // Only send the client key if we actually have one.
      // In hosted production mode the proxy falls back to its own server env key.
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

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
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => '(no response body)');
        console.error('[Grok API] HTTP error', response.status, errorText);

        if (response.status === 401 || response.status === 403) {
          if (isProductionHosted()) {
            // Server-side key is missing or invalid on the hosted proxy
            throw new Error('The hosted API service is not configured with a key. Please contact the site owner.');
          }
          // Bad client key in local/dev mode
          localStorage.removeItem(STORAGE_KEY);
          throw new Error('Invalid or expired Grok API key. Please refresh and re-enter your key.');
        }

        throw new Error(`API request failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();

      if (!content) {
        throw new Error('Empty response from Grok API');
      }

      return content;
    } catch (err) {
      console.error('[Grok API] callGrokAPI failed to ' + getProxyUrl() + ':', err);
      if (err && err.name === 'AbortError') {
        throw new Error('The AI request timed out. Please try again — for newsletter edits, try a shorter, more specific change.');
      }
      if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        const hosted = isProductionHosted();
        if (hosted) {
          throw new Error(`Could not reach the API service at ${getProxyUrl()}. The hosted service may be starting up or temporarily unavailable. Please try again in a moment.`);
        }
        throw new Error(`Failed to fetch from proxy at ${getProxyUrl()}. Ensure the proxy is running (bash start-proxy.sh or start-proxy.bat). You can serve the HTML from port 8080 (or any), but the proxy/API must be reachable at 3000 (or set window.CUSTOM_PROXY_URL if you changed the proxy port). Check proxy terminal for errors. Use console: window.testProxyConnection()`);
      }
      // Re-throw so each caller can show nice UI error
      throw err;
    }
  }

  // Expose to global scope (classic script style used by the rest of the app)
  window.getGrokApiKey = getGrokApiKey;
  window.setGrokApiKey = setGrokApiKey;
  window.callGrokAPI = callGrokAPI;
  window.ensureGrokApiKey = ensureApiKey;
  window.isProductionHosted = isProductionHosted;

  // Optional helper for debugging / settings UI later
  window.clearGrokApiKey = () => {
    localStorage.removeItem(STORAGE_KEY);
    if (window.showToast) window.showToast('API key cleared.', 'info');
    else console.log('Grok API key cleared from localStorage');
  };

  // Helper to test if proxy is reachable (use from console: window.testProxyConnection() )
  window.testProxyConnection = async function() {
    const url = getProxyUrl();
    console.log('[Proxy Test] Testing connection to', url);
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-key'
        },
        body: JSON.stringify({
          model: 'grok-4-1-fast-reasoning',
          messages: [{role: 'user', content: 'test'}]
        })
      });
      console.log('[Proxy Test] Response status:', resp.status);
      const text = await resp.text().catch(() => '');
      console.log('[Proxy Test] Response (first 200 chars):', text.substring(0,200));
      return {status: resp.status, ok: resp.ok};
    } catch (e) {
      console.error('[Proxy Test] Failed to connect:', e.message);
      window.notifyUser('Proxy test failed: ' + e.message + '\n\nMake sure proxy is running on the expected port (default 3000). If serving HTML on 8080, API still needs proxy on 3000 (or set window.CUSTOM_PROXY_URL).', 'error', 5000);
      return {error: e.message};
    }
  };
  console.log('%c[api.js] To test proxy connectivity from browser console (works from 8080 etc), run: window.testProxyConnection()', 'color:#00A89D');
  console.log('%c[api.js] Centralized Grok API client loaded. Keys are no longer hardcoded.', 'color:#00A89D');
})();
