/**
 * js/api.js
 * Centralized Grok / xAI API client for the Loan Officer Sales Coach.
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
  const PROXY_URL = 'http://localhost:3000/api/v1/chat/completions';
  const DEFAULT_MODEL = 'grok-4-1-fast-reasoning';

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
      '🔑 Grok API Key Required',
      '',
      'This tool uses the xAI Grok API for AI features (scripts, blogs, newsletters, etc.).',
      'Please paste your API key below.',
      '',
      'You can get one at https://x.ai (or use your existing xai-... key).',
      'The key will be saved in your browser (localStorage) and never sent anywhere except the local proxy.'
    ].join('\n');

    const key = prompt(msg);

    if (key && key.trim().startsWith('xai-')) {
      setGrokApiKey(key.trim());
      // Use the new toast if available, otherwise native alert for first-time setup
      if (window.showToast) {
        window.showToast('✅ API key saved! You can change it anytime in the future.', 'success');
      } else {
        alert('✅ API key saved successfully. You can change it later via the browser console if needed.');
      }
      return getGrokApiKey();
    } else if (key) {
      if (window.showToast) {
        window.showToast('Invalid key format. It should start with "xai-".', 'error');
      } else {
        alert('Key must start with "xai-". Please try again.');
      }
      return null;
    }
    return null;
  }

  /**
   * Ensure we have a valid API key. Prompts the user if missing.
   */
  function ensureApiKey() {
    let key = getGrokApiKey();
    if (!key) {
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
    const apiKey = ensureApiKey();

    if (!apiKey) {
      throw new Error('No Grok API key available. AI features are disabled until a valid key is provided.');
    }

    const {
      temperature = 0.8,
      max_tokens = 1400,
      model = DEFAULT_MODEL,
      messages: messagesOverride
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
      const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '(no response body)');
        console.error('[Grok API] HTTP error', response.status, errorText);

        if (response.status === 401 || response.status === 403) {
          // Bad key – clear it so user is prompted again next time
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
      console.error('[Grok API] callGrokAPI failed:', err);
      // Re-throw so each caller can show nice UI error
      throw err;
    }
  }

  // Expose to global scope (classic script style used by the rest of the app)
  window.getGrokApiKey = getGrokApiKey;
  window.setGrokApiKey = setGrokApiKey;
  window.callGrokAPI = callGrokAPI;
  window.ensureGrokApiKey = ensureApiKey;

  // Optional helper for debugging / settings UI later
  window.clearGrokApiKey = () => {
    localStorage.removeItem(STORAGE_KEY);
    if (window.showToast) window.showToast('API key cleared.', 'info');
    else console.log('Grok API key cleared from localStorage');
  };

  console.log('%c[api.js] Centralized Grok API client loaded. Keys are no longer hardcoded.', 'color:#00A89D');
})();
