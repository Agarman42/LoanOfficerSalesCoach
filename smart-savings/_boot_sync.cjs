/**
 * Copy LO Smart Savings assets from the refinance calculator worktree and
 * patch callGrokAPI for LO Sales Coach /api/v1/chat/completions.
 *
 * Runs from proxy.js on boot (and can be run directly: node smart-savings/_boot_sync.cjs).
 *
 * Layout after sync:
 *   index.html     — embed shell (iframe host for coach #smart-savings)
 *   app.html       — full LO calculator UI (patched header + APP_MODE=lo)
 *   js/app.js      — UI app with LO /api/v1/chat/completions Grok proxy
 *   js/calculator-core.js (+ .test.js)
 *   css/app.css
 */
'use strict';

const fs = require('fs');
const path = require('path');

const DEST = __dirname;
const SRC =
  process.env.SMART_SAVINGS_SRC ||
  '/home/adam/.grok/worktrees/refinance calculators/2026-07-16-baa3a2de';

const COPIES = [
  ['js/calculator-core.js', 'js/calculator-core.js'],
  ['js/calculator-core.test.js', 'js/calculator-core.test.js'],
  ['js/app.js', 'js/app.js'],
  ['css/app.css', 'css/app.css'],
  ['index.html', 'app.html'] // full LO UI → app.html (embed shell stays index.html)
];

const NEW_GROK_BLOCK = `
  /**
   * Grok via LO Sales Coach proxy (same origin when embedded at /smart-savings/).
   * Accepts OpenAI-style body { model, messages, temperature, max_tokens }.
   * Optional Bearer from localStorage / parent LO window.
   *
   * Overrides:
   *   window.RUOFF_GROK_URL
   *   ?grokProxy=https://...
   *   window.parent.getProxyBaseUrl() / getGrokApiKey()
   */
  function getGrokEndpoint() {
    if (window.RUOFF_GROK_URL) return window.RUOFF_GROK_URL;
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('grokProxy');
      if (q) return q;
    } catch (e) { /* ignore */ }
    try {
      if (window.parent && window.parent !== window && typeof window.parent.getProxyBaseUrl === 'function') {
        const base = window.parent.getProxyBaseUrl();
        if (base) return String(base).replace(/\\/$/, '') + '/api/v1/chat/completions';
      }
    } catch (e) { /* ignore */ }
    return '/api/v1/chat/completions';
  }

  async function callGrokAPI(body) {
    const endpoint = getGrokEndpoint();
    const headers = { 'Content-Type': 'application/json' };
    try {
      const key = localStorage.getItem('grokApiKey') || localStorage.getItem('xaiApiKey');
      if (key) headers['Authorization'] = 'Bearer ' + key;
    } catch (e) { /* ignore */ }
    try {
      if (window.parent && window.parent !== window) {
        if (typeof window.parent.getGrokApiKey === 'function') {
          const k = window.parent.getGrokApiKey();
          if (k) headers['Authorization'] = 'Bearer ' + k;
        }
      }
    } catch (e) { /* ignore */ }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: headers,
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
`;

function lineCount(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8').split(/\n/).length;
  } catch (e) {
    return 0;
  }
}

function patchAppJs(appPath) {
  let src = fs.readFileSync(appPath, 'utf8');

  const startRe =
    /\/\*\*\s*\n\s*\* Grok proxy[\s\S]*?async function callGrokAPI\(body\) \{[\s\S]*?return res\.json\(\);\s*\n\s*\}/;
  if (startRe.test(src)) {
    src = src.replace(startRe, NEW_GROK_BLOCK.trim());
  } else {
    const alt =
      /const RENDER_GROK_PROXY[\s\S]*?async function callGrokAPI\(body\) \{[\s\S]*?return res\.json\(\);\s*\n\s*\}/;
    if (alt.test(src)) {
      src = src.replace(alt, NEW_GROK_BLOCK.trim());
    } else {
      console.warn('[smart-savings] could not locate Grok proxy block in app.js');
    }
  }

  src = src.replace(
    /\s*\/\/ Resolve Grok proxy[\s\S]*?\.catch\(function \(\) \{ \/\* ignore \*\/ \}\);\s*/,
    `\n    console.info('[Ruoff] Grok proxy:', getGrokEndpoint(), '(LO coach /api/v1/chat/completions)');\n`
  );

  src = src.replace(/^\s*resolveGrokEndpoint,\s*\n/m, '');

  fs.writeFileSync(appPath, src, 'utf8');
}

function patchAppHtml(htmlPath) {
  let html = fs.readFileSync(htmlPath, 'utf8');

  if (!html.includes('Part of Loan Officer Sales Coach')) {
    html = html.replace(
      /<p class="eyebrow">Loan Officer workspace<\/p>\s*<h1>Smart Savings Calculator<\/h1>/,
      '<p class="eyebrow">Loan Officer workspace</p>\n' +
        '      <h1>Smart Savings Calculator</h1>\n' +
        '      <p class="text-xs text-white/70 mt-1">Part of Loan Officer Sales Coach</p>'
    );
  }

  // Absolute asset paths so iframe embed always resolves under /smart-savings/
  if (!html.includes('<base href="/smart-savings/"')) {
    html = html.replace(
      /<link rel="stylesheet" href="css\/app\.css">/,
      '<link rel="stylesheet" href="/smart-savings/css/app.css">\n  <base href="/smart-savings/">'
    );
  }
  html = html.replace(/href="css\/app\.css"/g, 'href="/smart-savings/css/app.css"');
  html = html.replace(
    /src="js\/calculator-core\.js"/g,
    'src="/smart-savings/js/calculator-core.js"'
  );
  html = html.replace(/src="js\/app\.js"/g, 'src="/smart-savings/js/app.js"');

  // Ensure theme controls have an id so embed CSS can hide them
  if (!html.includes('id="ss-theme-controls"')) {
    html = html.replace(
      /<div class="flex items-center gap-2 text-white\/90 text-xs">\s*<span class="opacity-75">Light<\/span>/,
      '<div id="ss-theme-controls" class="flex items-center gap-2 text-white/90 text-xs">\n        <span class="opacity-75">Light</span>'
    );
  }

  html = html.replace(/window\.APP_MODE\s*=\s*['"][^'"]*['"]/, "window.APP_MODE = 'lo'");
  if (!html.includes('SMART_SAVINGS_EMBED')) {
    html = html.replace(
      "window.APP_MODE = 'lo'",
      "window.APP_MODE = 'lo'; window.SMART_SAVINGS_EMBED = true"
    );
  }

  if (!html.includes('calculator-core.js')) {
    html = html.replace(
      /<\/body>/i,
      '<script>window.APP_MODE = \'lo\'; window.SMART_SAVINGS_EMBED = true;</script>\n' +
        '<script src="/smart-savings/js/calculator-core.js"></script>\n' +
        '<script src="/smart-savings/js/app.js"></script>\n</body>'
    );
  }

  fs.writeFileSync(htmlPath, html, 'utf8');
}

function ensureDirs() {
  fs.mkdirSync(path.join(DEST, 'js'), { recursive: true });
  fs.mkdirSync(path.join(DEST, 'css'), { recursive: true });
}

function sync() {
  if (!fs.existsSync(SRC)) {
    console.warn('[smart-savings] source missing:', SRC);
    return { ok: false, reason: 'source_missing' };
  }
  ensureDirs();

  // Preserve embed shell (index.html with ss-frame)
  const indexPath = path.join(DEST, 'index.html');
  let embedShell = null;
  if (fs.existsSync(indexPath)) {
    const cur = fs.readFileSync(indexPath, 'utf8');
    if (cur.includes('ss-frame') || cur.includes('SMART_SAVINGS_EMBED')) {
      embedShell = cur;
    }
  }

  const report = [];
  const forceAll = process.env.SMART_SAVINGS_FORCE_SYNC === '1';

  /**
   * Coach-native files we must not clobber on proxy boot (upstream is standalone).
   *
   * CRITICAL: css/app.css MUST be preserved once coach polish lands.
   * Upstream standalone CSS does NOT include embed/portal styles
   * (ss-guided-layer, ss-balance-display, ss-debt-drop, collapse headers, etc.).
   * Overwriting it left HTML/JS class names with no rules → "premium UI vanished"
   * after every `npm start` / proxy restart. That was a major silent regression source.
   */
  function shouldPreserveCoachNative(to, existing) {
    if (!existing) return false;
    if (to === 'js/app.js') {
      return existing.includes('initSmartSavings') && existing.includes('openGuidedPortal');
    }
    if (to === 'js/calculator-core.js') {
      return existing.includes('newPmiManual') || existing.includes('isCashOutRequest');
    }
    if (to === 'js/calculator-core.test.js') {
      return existing.includes('Manual new PMI') || existing.includes('newPmiManual');
    }
    if (to === 'app.html') {
      // index.html is copied to app.html in COPIES — preserve polished LO embed markup
      return (
        existing.includes('modal-balance-display') ||
        existing.includes('current-rate-slider') ||
        existing.includes('ss-balance-display')
      );
    }
    if (to === 'css/app.css') {
      // Any coach-only polish marker → never replace with thinner standalone CSS
      return (
        existing.includes('ss-balance-display') ||
        existing.includes('ss-guided-layer') ||
        existing.includes('ss-debt-drop') ||
        existing.includes('ss-section-collapse') ||
        existing.includes('ss-theme-controls') ||
        existing.includes('ss-wizard-recap') ||
        existing.includes('#ss-modal-host')
      );
    }
    return false;
  }

  /** Fail soft if coach CSS lost critical rules (detect bad force-sync). */
  function assertCoachCssIntegrity(cssPath) {
    if (!fs.existsSync(cssPath)) return;
    const css = fs.readFileSync(cssPath, 'utf8');
    const required = [
      'ss-balance-display',
      'ss-guided-layer',
      'ss-debt-drop',
      'ss-theme-controls'
    ];
    const missing = required.filter(function (m) {
      return css.indexOf(m) === -1;
    });
    if (missing.length) {
      console.warn(
        '[smart-savings] WARNING: css/app.css is missing coach polish:',
        missing.join(', '),
        '— UI will look broken. Restore from coach tree or avoid SMART_SAVINGS_FORCE_SYNC=1.'
      );
    }
  }

  for (const [from, to] of COPIES) {
    const a = path.join(SRC, from);
    const b = path.join(DEST, to);
    if (!fs.existsSync(a)) {
      console.warn('[smart-savings] skip missing', a);
      continue;
    }
    if (!forceAll && fs.existsSync(b)) {
      try {
        const existing = fs.readFileSync(b, 'utf8');
        if (shouldPreserveCoachNative(to, existing)) {
          console.info(
            '[smart-savings] keep coach-native',
            to,
            '(skip overwrite; set SMART_SAVINGS_FORCE_SYNC=1 to replace)'
          );
          report.push({
            file: to,
            lines: lineCount(b),
            bytes: fs.statSync(b).size,
            preserved: true
          });
          continue;
        }
      } catch (e) { /* fall through to copy */ }
    }
    fs.copyFileSync(a, b);
    report.push({ file: to, lines: lineCount(b), bytes: fs.statSync(b).size });
  }

  const appJs = path.join(DEST, 'js/app.js');
  // Only patch Grok block on non-native (fresh upstream) copies
  if (fs.existsSync(appJs)) {
    const cur = fs.readFileSync(appJs, 'utf8');
    if (!cur.includes('initSmartSavings') || forceAll) {
      patchAppJs(appJs);
    }
  }

  const appHtml = path.join(DEST, 'app.html');
  // Do not strip coach-native markup with standalone patchAppHtml
  if (fs.existsSync(appHtml)) {
    const curHtml = fs.readFileSync(appHtml, 'utf8');
    if (!shouldPreserveCoachNative('app.html', curHtml) || forceAll) {
      patchAppHtml(appHtml);
    } else {
      console.info('[smart-savings] keep coach-native app.html (skip patchAppHtml)');
    }
  }

  // Restore embed shell so /smart-savings/ stays the iframe host
  if (embedShell) {
    fs.writeFileSync(indexPath, embedShell, 'utf8');
  }

  const summary = report
    .map((r) => r.file + '\t' + r.lines + '\t' + r.bytes)
    .join('\n');
  const extra = [
    'app.html\t' + lineCount(appHtml) + '\t' + (fs.existsSync(appHtml) ? fs.statSync(appHtml).size : 0),
    'index.html\t' + lineCount(indexPath) + '\t' + (fs.existsSync(indexPath) ? fs.statSync(indexPath).size : 0)
  ].join('\n');
  fs.writeFileSync(path.join(DEST, '_sync_report.txt'), summary + '\n' + extra + '\n', 'utf8');
  assertCoachCssIntegrity(path.join(DEST, 'css/app.css'));
  console.info('[smart-savings] synced', report.length, 'files from', SRC);
  report.forEach((r) =>
    console.info(' ', r.file, r.lines, 'lines', r.preserved ? '(preserved coach-native)' : '')
  );
  return { ok: true, report };
}

if (require.main === module) {
  const result = sync();
  process.exit(result.ok ? 0 : 1);
}

module.exports = { sync };
