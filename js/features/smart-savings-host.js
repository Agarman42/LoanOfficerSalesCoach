/**
 * Smart Savings Calculator — native LO Sales Coach host (no iframe).
 * 1) Ensures shell + scoped CSS
 * 2) Injects calculator markup from /smart-savings/app.html into #smart-savings-root
 * 3) Calls window.initSmartSavings on first section show
 *
 * Guided tour opens a body-level modal (#ss-guided-layer) and moves .app-shell
 * into #ss-guided-scroll. This host MUST NOT scrub/restore while that portal
 * is open — that was the main reason the wizard fell back to in-page mode.
 */
(function () {
  'use strict';

  var SECTION_ID = 'smart-savings';
  var ROOT_ID = 'smart-savings-root';
  var CSS_LINK_ID = 'smart-savings-css-link';
  // Bump when scoped/portal CSS changes so inject isn't sticky forever
  var CSS_INJECT_ID = 'smart-savings-scoped-css-v20260720-review';
  var APP_HTML_SRC = '/smart-savings/app.html';
  var APP_CSS_SRC = '/smart-savings/css/app.css';
  var ASSET_V = '20260720-review';
  var cssReady = null;
  var bodyReady = null;
  var initStarted = false;

  function setStatus(msg, isError) {
    var el = document.getElementById('smart-savings-status');
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('text-red-600', !!isError);
    el.classList.toggle('text-gray-500', !isError);
  }

  function isSectionVisible() {
    var sec = document.getElementById(SECTION_ID);
    return !!(sec && !sec.classList.contains('hidden'));
  }

  function isGuidedPortalOpen() {
    var layer = document.getElementById('ss-guided-layer');
    if (layer && layer.classList.contains('is-open')) return true;
    var root = document.getElementById(ROOT_ID);
    return !!(root && root.classList.contains('ss-guided-portal-active'));
  }

  function ensureCssLink() {
    if (document.getElementById(CSS_LINK_ID)) return;
    var link = document.createElement('link');
    link.id = CSS_LINK_ID;
    link.rel = 'stylesheet';
    link.href = 'css/smart-savings.css?v=' + ASSET_V;
    document.head.appendChild(link);
  }

  function injectScopedAppCss() {
    if (document.getElementById(CSS_INJECT_ID)) return Promise.resolve();
    if (cssReady) return cssReady;

    try {
      // Drop any prior inject ids so portal/contrast CSS refreshes after deploys
      document.querySelectorAll('style[data-ss-scoped]').forEach(function (el) {
        el.remove();
      });
    } catch (e) { /* ignore */ }

    cssReady = fetch(APP_CSS_SRC + '?v=' + ASSET_V, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('app.css ' + r.status);
        return r.text();
      })
      .then(function (raw) {
        if (document.getElementById(CSS_INJECT_ID)) return;
        var scoped =
          typeof window.scopeSmartSavingsCss === 'function'
            ? window.scopeSmartSavingsCss(raw)
            : raw;
        var style = document.createElement('style');
        style.id = CSS_INJECT_ID;
        style.setAttribute('data-ss-scoped', '1');
        style.setAttribute('data-ss-portal-dual', '1');
        style.textContent = scoped;
        document.head.appendChild(style);
      })
      .catch(function (err) {
        console.warn('[smart-savings] scoped CSS inject failed — shell CSS only', err);
      });

    return cssReady;
  }

  /**
   * Extract calculator body markup from app.html (everything except scripts).
   */
  function extractBodyMarkup(html) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(html, 'text/html');
    var body = doc.body;
    if (!body) return '';
    body.querySelectorAll('script').forEach(function (s) {
      s.remove();
    });
    return body.innerHTML;
  }

  /**
   * Safe scrub of orphaned overlays only. Never destroys an open guided modal.
   */
  function scrubOrphanOverlays() {
    if (isGuidedPortalOpen()) return;
    try {
      document.querySelectorAll('.ss-guided-backdrop-inplace').forEach(function (n) {
        n.remove();
      });
      // Closed empty layer can go
      var layer = document.getElementById('ss-guided-layer');
      if (layer && !layer.classList.contains('is-open') && !layer.querySelector('.app-shell')) {
        layer.remove();
      }
    } catch (e) { /* ignore */ }
  }

  /**
   * Restore shell from portal only when portal is closed/orphaned.
   * force=true still refuses while is-open (prevents host race after init).
   */
  function restoreShellFromPortal(force) {
    try {
      if (isGuidedPortalOpen()) return false;
      if (!force) {
        // Soft path: only recover orphaned shells
      }

      var root = document.getElementById(ROOT_ID);
      var shell =
        document.querySelector('#ss-guided-scroll > .app-shell') ||
        document.querySelector('#ss-guided-layer .app-shell') ||
        document.querySelector('body > .app-shell');
      if (!shell || !root) return !!root && !!root.querySelector('.app-shell');

      // If shell already in root, nothing to do
      if (root.contains(shell)) return true;

      var marker = document.getElementById('ss-guided-shell-marker');
      if (marker && marker.parentNode) {
        marker.parentNode.insertBefore(shell, marker);
        marker.remove();
      } else {
        root.appendChild(shell);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function calculatorBodyPresent() {
    // Works even when shell lives inside the open guided portal
    return !!document.getElementById('home-value');
  }

  /** True when the calculator is visible where the LO expects it */
  function shellInUsablePlace() {
    var root = document.getElementById(ROOT_ID);
    if (root && root.querySelector('.app-shell')) return true;
    if (isGuidedPortalOpen() && document.querySelector('#ss-guided-scroll > .app-shell')) return true;
    return false;
  }

  function ensureBodyInjected() {
    var root = document.getElementById(ROOT_ID);
    if (!root) return Promise.reject(new Error('missing #' + ROOT_ID));

    // Only pull shell back from a CLOSED/orphaned portal
    restoreShellFromPortal(false);

    // Healthy: shell in root, or shell in an OPEN guided portal
    if (root.getAttribute('data-ss-body') === '1' && shellInUsablePlace()) {
      return Promise.resolve(root);
    }

    // Do not wipe root while guided modal is open with the live shell
    if (isGuidedPortalOpen() && calculatorBodyPresent()) {
      root.setAttribute('data-ss-body', '1');
      return Promise.resolve(root);
    }

    // Shell stranded (e.g. closed portal) — try one more restore before re-fetch
    restoreShellFromPortal(true);
    if (shellInUsablePlace()) {
      root.setAttribute('data-ss-body', '1');
      return Promise.resolve(root);
    }

    // Stale flag / shell destroyed — force re-inject
    root.removeAttribute('data-ss-body');
    bodyReady = null;

    bodyReady = fetch(APP_HTML_SRC + '?v=' + (window.__ssBust || (window.__ssBust = String(Date.now()))), {
      cache: 'no-store'
    })
      .then(function (r) {
        if (!r.ok) throw new Error('app.html ' + r.status);
        // Guard Content-Type when present
        var ct = (r.headers && r.headers.get && r.headers.get('content-type')) || '';
        if (ct && ct.indexOf('text/html') === -1 && ct.indexOf('text/plain') === -1) {
          throw new Error('app.html unexpected type ' + ct);
        }
        return r.text();
      })
      .then(function (html) {
        // SPA fallback (Render) often returns coach index.html for missing files.
        // Injecting that clones #sidebar → dual sidebars. Never inject coach chrome.
        if (
          !html ||
          html.indexOf('id="home-value"') === -1 ||
          html.indexOf('id="sidebar"') !== -1 ||
          html.indexOf('Ultimate Loan Officer Sales Coach') !== -1 ||
          html.indexOf('COACH_APP_ID') !== -1
        ) {
          throw new Error(
            'smart-savings/app.html missing or SPA-fallback (got coach shell). Deploy smart-savings/ assets.'
          );
        }
        var markup = extractBodyMarkup(html);
        if (!markup || markup.length < 200 || markup.indexOf('home-value') === -1) {
          throw new Error('empty calculator body');
        }
        // Never clobber an open portal
        if (isGuidedPortalOpen() && calculatorBodyPresent()) {
          root.setAttribute('data-ss-body', '1');
          return root;
        }
        root.innerHTML = markup;
        root.setAttribute('data-ss-body', '1');
        root.classList.add('mode-expert');
        if (document.documentElement.classList.contains('dark')) {
          root.classList.add('dark');
        }
        // Force-hide every modal shell (Tailwind hidden+flex often leaves loaders visible)
        root.querySelectorAll('[id$="-modal"]').forEach(function (el) {
          el.classList.add('hidden');
          el.style.setProperty('display', 'none', 'important');
          el.style.setProperty('pointer-events', 'none', 'important');
          el.setAttribute('aria-hidden', 'true');
        });
        root.querySelectorAll('base').forEach(function (b) {
          b.remove();
        });
        return root;
      });

    return bodyReady;
  }

  function scrubLegacyOverlays(opts) {
    var options = opts || {};
    try {
      // Coach global loader must never block Smart Savings
      var gl = document.getElementById('global-loading');
      if (gl) {
        gl.classList.add('hidden');
        gl.style.setProperty('display', 'none', 'important');
        gl.style.setProperty('pointer-events', 'none', 'important');
        gl.style.setProperty('visibility', 'hidden', 'important');
      }

      // NEVER destroy an open guided modal
      if (isGuidedPortalOpen() && !options.forceCloseGuided) {
        return;
      }

      scrubOrphanOverlays();

      if (options.forceCloseGuided) {
        // App owns close; only clear leftover inline classes if portal not open
        if (!isGuidedPortalOpen()) {
          restoreShellFromPortal(true);
          var root = document.getElementById(ROOT_ID);
          if (root) {
            root.classList.remove('ss-guided-inline', 'ss-guided-inplace', 'mode-guided', 'ss-guided-portal-active');
            root.classList.add('mode-expert');
          }
          document.body.classList.remove('ss-smart-savings-modal-open', 'modal-open', 'ss-guided-modal-open');
          document.documentElement.classList.remove('ss-guided-modal-open');
        }
      }
    } catch (e) { /* ignore */ }
  }

  function callInit(force) {
    window.APP_MODE = 'lo';
    window.SMART_SAVINGS_EMBED = true;
    if (typeof window.getProxyUrl === 'function') {
      try {
        window.RUOFF_GROK_URL = window.getProxyUrl();
      } catch (e) {
        window.RUOFF_GROK_URL = '/api/v1/chat/completions';
      }
    } else {
      window.RUOFF_GROK_URL = '/api/v1/chat/completions';
    }

    // Before first paint: only scrub orphans — never force-close guided
    scrubLegacyOverlays({ forceCloseGuided: false });

    if (typeof window.initSmartSavings === 'function') {
      var ok = window.initSmartSavings(!!force);
      if (ok === false) return false;
      setStatus('');
      // CRITICAL: do NOT scrub/restore after init — guided portal may just have opened
      return true;
    }
    return false;
  }

  function initSmartSavingsNative(force) {
    ensureCssLink();
    // Do not yank shell out of an open guided modal
    if (!isGuidedPortalOpen()) {
      restoreShellFromPortal(false);
      // If shell was stranded in a closed portal, root was empty — also force expert
      // so the LO never sees "tips only" with mode-guided hiding every panel.
      try {
        var rootFix = document.getElementById(ROOT_ID);
        if (rootFix && rootFix.querySelector('.app-shell') && rootFix.classList.contains('mode-guided') && !rootFix.classList.contains('ss-guided-portal-active')) {
          rootFix.classList.remove('mode-guided');
          rootFix.classList.add('mode-expert');
          rootFix.querySelectorAll('.wizard-panel').forEach(function (p) {
            p.classList.add('active-step');
            p.style.removeProperty('display');
          });
        }
      } catch (e) { /* ignore */ }
    }

    // Re-run full inject if a prior scrub left the root empty / shell unusable
    var bodyMissing = !calculatorBodyPresent() || !shellInUsablePlace();
    if (initStarted && !force && !bodyMissing) {
      // Already ran; still ensure init if app script was late
      if (typeof window.initSmartSavings === 'function') {
        try { window.initSmartSavings(false); } catch (e) { /* ignore */ }
      }
      setStatus('');
      return Promise.resolve();
    }

    if (bodyMissing && !isGuidedPortalOpen()) {
      initStarted = false;
      bodyReady = null;
      var rootReset = document.getElementById(ROOT_ID);
      if (rootReset) rootReset.removeAttribute('data-ss-body');
    }

    initStarted = true;
    setStatus('Loading Smart Savings Calculator…');

    return injectScopedAppCss()
      .then(function () {
        return ensureBodyInjected();
      })
      .then(function () {
        if (!calculatorBodyPresent()) {
          throw new Error('inject completed but #home-value missing');
        }
        if (callInit(force || bodyMissing)) return;
        // App script may still be parsing
        return new Promise(function (resolve) {
          var tries = 0;
          var t = setInterval(function () {
            tries++;
            if (callInit(force || bodyMissing) || tries > 25) {
              clearInterval(t);
              if (tries > 25 && typeof window.initSmartSavings !== 'function') {
                setStatus('Calculator script not loaded. Hard-refresh and check console.', true);
              } else if (!calculatorBodyPresent()) {
                setStatus('Calculator body missing after load. Hard-refresh (Ctrl+Shift+R).', true);
                initStarted = false;
              }
              resolve();
            }
          }, 100);
        });
      })
      .catch(function (err) {
        console.warn('[smart-savings] init failed', err);
        setStatus(
          'Could not load calculator. Hard-refresh, or run: npm run sync:smart-savings',
          true
        );
        initStarted = false;
        bodyReady = null;
      });
  }

  function maybeInitFromHash() {
    var hash = (window.location.hash || '').replace(/^#/, '');
    if (hash === SECTION_ID || isSectionVisible()) {
      initSmartSavingsNative();
    }
  }

  function wrapShowSection() {
    var prev = window.showSection;
    if (typeof prev !== 'function') return;
    if (prev.__ssHostId === 'v3-modal') return;

    function clearSmartSavingsBodyModes() {
      try {
        // Never leave SS mode classes on document — they break other coach tools
        document.body.classList.remove(
          'mode-guided',
          'mode-expert',
          'ss-guided-modal-open',
          'ss-smart-savings-modal-open',
          'modal-open'
        );
        document.documentElement.classList.remove(
          'ss-guided-modal-open',
          'mode-guided',
          'mode-expert'
        );
      } catch (e) { /* ignore */ }
    }

    function wrapped(id) {
      var nextId = id != null ? String(id) : '';
      // Leaving Smart Savings → close guided portal + strip body mode classes
      if (nextId && nextId !== SECTION_ID) {
        try {
          if (isGuidedPortalOpen() && window.RuoffApp && typeof window.RuoffApp.setExperienceMode === 'function') {
            window.RuoffApp.setExperienceMode('expert', { silent: true });
          }
        } catch (e) { /* ignore */ }
        try {
          var layer = document.getElementById('ss-guided-layer');
          if (layer) {
            layer.classList.remove('is-open', 'mode-guided', 'mode-expert');
            layer.setAttribute('aria-hidden', 'true');
          }
          if (typeof restoreShellFromPortal === 'function') restoreShellFromPortal(true);
          var root = document.getElementById(ROOT_ID);
          if (root) {
            root.classList.remove('mode-guided', 'ss-guided-portal-active', 'ss-guided-inline', 'ss-guided-inplace');
            root.classList.add('mode-expert');
          }
        } catch (e2) { /* ignore */ }
        clearSmartSavingsBodyModes();
      }
      var result = prev.apply(this, arguments);
      if (nextId === SECTION_ID) {
        initSmartSavingsNative();
      } else {
        clearSmartSavingsBodyModes();
      }
      return result;
    }
    wrapped.__ssHostId = 'v3-modal';
    window.showSection = wrapped;
  }

  function boot() {
    scrubOrphanOverlays();
    ensureCssLink();
    wrapShowSection();
    [0, 100, 400, 1000, 2500].forEach(function (ms) {
      setTimeout(wrapShowSection, ms);
    });
    // Light orphan cleanup only — never after guided can be open
    [200, 800].forEach(function (ms) {
      setTimeout(scrubOrphanOverlays, ms);
    });

    maybeInitFromHash();
    window.addEventListener('hashchange', maybeInitFromHash);

    var sec = document.getElementById(SECTION_ID);
    if (sec && typeof MutationObserver !== 'undefined') {
      var obs = new MutationObserver(function () {
        if (isSectionVisible()) initSmartSavingsNative();
      });
      obs.observe(sec, { attributes: true, attributeFilter: ['class'] });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Back-compat for main.js / early-boot
  window.loadSmartSavingsFrame = function () {
    return initSmartSavingsNative();
  };
  window.initSmartSavingsSection = initSmartSavingsNative;
})();
