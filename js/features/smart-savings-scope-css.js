/**
 * Browser CSS scoper for Smart Savings native embed.
 * Prefixes selectors with .smart-savings-root AND (usually) #ss-guided-scroll
 * so styles still apply when the guided modal moves .app-shell into the portal.
 *
 * IMPORTANT: bare `body` / `html` / `:root` rules must NOT dual-target the portal.
 * Mapping `body { min-height:100vh }` → `#ss-guided-scroll { min-height:100vh }`
 * prevents the flex child from shrinking, so the modal clips content with no scroll.
 */
(function (global) {
  'use strict';

  var PORTAL = '#ss-guided-scroll';

  function portalize(sel) {
    if (!sel || sel.indexOf(PORTAL) !== -1) return sel;
    return String(sel)
      .replace(/\.smart-savings-root\.dark/g, PORTAL + '.dark')
      .replace(/\.smart-savings-root/g, PORTAL);
  }

  /** Selectors that break portal flex/scroll if dual-applied to #ss-guided-scroll */
  function skipPortalDual(originalSel, rootSel) {
    var s = String(originalSel || '').trim();
    if (!s) return true;
    if (s === 'body' || s === 'html' || s === ':root') return true;
    if (s === 'html.dark' || s === 'html:not(.dark)') return true;
    if (s === '.dark body' || s === 'body.dark' || s === 'html.dark body') return true;
    // Page chrome / full-viewport rules only
    if (/^html(\.|$|\s)/.test(s) && s.indexOf('mode-') === -1) return true;
    // Dual-scoped * { box-sizing } is fine; * alone becomes .root * which is OK
    return false;
  }

  function scopeCss(src) {
    var fonts = [];
    src = String(src || '').replace(/@import\s+url\([^)]+\)\s*;?/g, function (m) {
      fonts.push(m.charAt(m.length - 1) === ';' ? m : m + ';');
      return '';
    });

    var holds = [];
    src = src.replace(/@(keyframes|font-face|property)[\s\S]*?\{[\s\S]*?\n\}/g, function (m) {
      holds.push(m);
      return '/*__HOLD_' + (holds.length - 1) + '__*/';
    });

    /** Body-level guided modal chrome — never nest under .smart-savings-root */
    function isPortalChromeSel(s) {
      var t = String(s || '').trim();
      if (!t) return false;
      // #ss-guided-layer…, .ss-guided-layer…, #ss-guided-scroll…, #ss-modal-host…
      if (/^#ss-guided-/.test(t)) return true;
      if (/^\.ss-guided-layer(\.|:|\s|$)/.test(t)) return true;
      if (/^\.ss-guided-(backdrop|dialog|chrome|kicker|step-label|exit|scroll|footer|nav)/.test(t)) return true;
      if (/^#ss-modal-host/.test(t) || /^\.ss-modal-host(\.|:|\s|$)/.test(t)) return true;
      // html/body locks for the portal
      if (t === 'html.ss-guided-modal-open' || t === 'body.ss-guided-modal-open') return true;
      if (t === 'html.ss-guided-modal-open,body.ss-guided-modal-open') return true;
      if (/^html\.ss-guided-modal-open/.test(t) || /^body\.ss-guided-modal-open/.test(t)) return true;
      if (t === 'body.ss-smart-savings-modal-open') return true;
      return false;
    }

    function toRoot(s) {
      s = s.trim();
      if (!s) return s;
      // Keep portal chrome global (layer lives on document.body)
      if (isPortalChromeSel(s)) return s;
      if (s === ':root') return '.smart-savings-root';
      if (s === 'html') return '.smart-savings-root';
      if (s === 'body') return '.smart-savings-root';
      if (
        s === '.dark body' ||
        s === 'body.dark' ||
        s === 'html.dark body' ||
        /^html\.dark\s+body$/.test(s)
      ) {
        return 'html.dark .smart-savings-root';
      }
      if (s.indexOf('body.') === 0) return '.smart-savings-root' + s.slice(4);
      if (s.indexOf('body ') === 0) return '.smart-savings-root ' + s.slice(5);
      if (s.indexOf('html.dark ') === 0 || s.indexOf('html:not') === 0) {
        // html.dark .ss-guided-* stays global; other html.dark rules scope to root
        var afterDark = s.replace(/^html\.dark\s+/, '');
        if (isPortalChromeSel(afterDark) || isPortalChromeSel(s.replace(/^html\.dark\s+/, ''))) {
          return s;
        }
        return s.replace(/^html(\.dark|:not\([^)]+\))\s+/, function (_, p) {
          return 'html' + p + ' .smart-savings-root ';
        });
      }
      if (s === 'html.dark' || s === 'html:not(.dark)') return s + ' .smart-savings-root';
      if (s.indexOf('.dark ') === 0) {
        var rest = s.slice(6);
        if (isPortalChromeSel(rest) || isPortalChromeSel('.ss-guided-layer') && rest.indexOf('ss-guided') === 0) {
          return 'html.dark ' + rest + ', .ss-guided-layer.dark ' + rest;
        }
        return 'html.dark .smart-savings-root ' + rest + ', .smart-savings-root.dark ' + rest;
      }
      if (s === '.dark') return 'html.dark .smart-savings-root, .smart-savings-root.dark';
      if (s.indexOf('smart-savings-root') !== -1) return s;
      if (s === '*' || s.indexOf('*::') === 0 || s.indexOf('* ') === 0) {
        return '.smart-savings-root ' + s;
      }
      return '.smart-savings-root ' + s;
    }

    function prefixSel(raw) {
      var cleaned = raw.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\s+/g, ' ').trim();
      if (!cleaned) return cleaned;
      return cleaned
        .split(',')
        .map(function (s) {
          s = s.trim();
          if (!s) return s;
          // Portal chrome: leave exactly as authored (no root prefix, no portal dual)
          if (isPortalChromeSel(s)) return s;
          var root = toRoot(s);
          if (skipPortalDual(s, root)) return root;
          // Dual-target: in-page root AND guided portal (shell may live outside root)
          var parts = String(root)
            .split(',')
            .map(function (part) {
              part = part.trim();
              if (!part) return part;
              if (isPortalChromeSel(part)) return part;
              var portal = portalize(part);
              if (!portal || portal === part) return part;
              return part + ', ' + portal;
            })
            .filter(Boolean);
          return parts.join(', ');
        })
        .join(', ');
    }

    function transformBlock(cssText) {
      var out = '';
      var i = 0;
      var n = cssText.length;
      while (i < n) {
        if (cssText[i] === '/' && cssText[i + 1] === '*') {
          var end = cssText.indexOf('*/', i + 2);
          out += cssText.slice(i, end < 0 ? n : end + 2);
          i = end < 0 ? n : end + 2;
          continue;
        }
        if (/\s/.test(cssText[i])) {
          out += cssText[i];
          i++;
          continue;
        }
        if (cssText[i] === '@') {
          var braceAt = cssText.indexOf('{', i);
          if (braceAt < 0) {
            out += cssText.slice(i);
            break;
          }
          var atRule = cssText.slice(i, braceAt).trim();
          var depth = 0;
          var j = braceAt;
          for (; j < n; j++) {
            if (cssText[j] === '{') depth++;
            else if (cssText[j] === '}') {
              depth--;
              if (depth === 0) {
                j++;
                break;
              }
            }
          }
          if (
            atRule.indexOf('@keyframes') === 0 ||
            atRule.indexOf('@font-face') === 0 ||
            atRule.indexOf('@property') === 0
          ) {
            out += cssText.slice(i, j);
            i = j;
            continue;
          }
          var inner = cssText.slice(braceAt + 1, j - 1);
          out += atRule + ' {\n' + transformBlock(inner) + '\n}\n';
          i = j;
          continue;
        }
        var brace = cssText.indexOf('{', i);
        if (brace < 0) {
          out += cssText.slice(i);
          break;
        }
        var sel = cssText.slice(i, brace);
        depth = 0;
        j = brace;
        for (; j < n; j++) {
          if (cssText[j] === '{') depth++;
          else if (cssText[j] === '}') {
            depth--;
            if (depth === 0) {
              j++;
              break;
            }
          }
        }
        var body = cssText.slice(brace, j);
        out += prefixSel(sel) + body + '\n';
        i = j;
      }
      return out;
    }

    var transformed = transformBlock(src);
    for (var h = 0; h < holds.length; h++) {
      transformed = transformed.replace('/*__HOLD_' + h + '__*/', holds[h]);
    }

    // NOTE: never write `/* comment */ + 'string'` — unary + coerces the string to NaN.
    var header =
      '/* Smart Savings scoped · .smart-savings-root + #ss-guided-scroll + body portal chrome */\n' +
      fonts.join('\n') +
      '\n\n' +
      '.smart-savings-root{position:relative;isolation:isolate;min-height:12rem;overflow:visible;border-radius:1rem;}\n' +
      '#ss-guided-scroll{' +
        'position:relative!important;' +
        'isolation:isolate;' +
        'flex:1 1 0%!important;' +
        'min-height:0!important;' +
        'max-height:none!important;' +
        'height:auto!important;' +
        'overflow-x:hidden!important;' +
        'overflow-y:auto!important;' +
        'border-radius:0!important;' +
        'overscroll-behavior:contain;' +
        '-webkit-overflow-scrolling:touch;' +
        'touch-action:pan-y;' +
      '}\n' +
      '#ss-guided-scroll .app-shell,#ss-guided-scroll main.app-main,#ss-guided-scroll .app-main{' +
        'min-height:0!important;height:auto!important;max-height:none!important;overflow:visible!important;' +
      '}\n' +
      '.smart-savings-root .atmosphere,' + PORTAL + ' .atmosphere{position:absolute!important;inset:0!important;z-index:0;pointer-events:none!important;}\n' +
      'body.ss-smart-savings-modal-open{overflow:hidden;}\n' +
      'html.ss-guided-modal-open,body.ss-guided-modal-open{overflow:hidden!important;}\n' +
      '.ss-guided-layer{display:none;position:fixed;inset:0;z-index:99980;width:100vw;height:100vh;max-width:100%;max-height:100%;box-sizing:border-box;pointer-events:none;}\n' +
      '.ss-guided-layer.is-open{display:flex;align-items:stretch;justify-content:center;pointer-events:auto;}\n' +
      '.ss-guided-backdrop{position:absolute;inset:0;background:rgba(2,12,28,0.62);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);}\n' +
      '.ss-guided-dialog{position:relative;z-index:1;display:flex;flex-direction:column;width:min(52rem,calc(100vw - 1.5rem));max-height:min(92vh,920px);margin:auto;background:#f4f7fb;border-radius:1.35rem;box-shadow:0 28px 80px -20px rgba(0,0,0,0.55);overflow:hidden;color:#0f172a;}\n' +
      'html.dark .ss-guided-dialog,.ss-guided-layer.dark .ss-guided-dialog{background:#0b1628;color:#f1f5f9;}\n' +
      '.ss-guided-chrome{flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;gap:0.75rem;padding:0.85rem 1.1rem;background:linear-gradient(105deg,#002B5C 0%,#014a6e 50%,#00A89D 100%);color:#fff;}\n' +
      '.ss-guided-kicker{font-size:0.62rem;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.72);}\n' +
      '.ss-guided-step-label{font-size:1rem;font-weight:800;color:#fff;}\n' +
      '.ss-guided-exit{flex-shrink:0;display:inline-flex;align-items:center;gap:0.4rem;padding:0.45rem 0.85rem;border-radius:9999px;border:1px solid rgba(255,255,255,0.28);background:rgba(255,255,255,0.12);color:#fff;font-size:0.8rem;font-weight:700;cursor:pointer;}\n' +
      '.ss-guided-footer-dock{flex:0 0 auto;padding:0.75rem 1rem;background:rgba(255,255,255,0.92);border-top:1px solid rgba(15,23,42,0.08);}\n' +
      'html.dark .ss-guided-footer-dock,.ss-guided-layer.dark .ss-guided-footer-dock{background:rgba(8,16,30,0.94);border-top-color:rgba(255,255,255,0.08);}\n' +
      '.ss-guided-nav-bar{display:flex;align-items:center;justify-content:space-between;gap:0.75rem;}\n' +
      '.ss-guided-nav-back,.ss-guided-nav-next{min-width:6.5rem;padding:0.65rem 1.15rem;border-radius:9999px;font-size:0.9rem;font-weight:800;cursor:pointer;border:none;}\n' +
      '.ss-guided-nav-back{background:#fff;color:#0f172a;border:1.5px solid rgba(15,23,42,0.12);}\n' +
      'html.dark .ss-guided-nav-back,.ss-guided-layer.dark .ss-guided-nav-back{background:rgba(255,255,255,0.08);color:#f8fafc;border-color:rgba(255,255,255,0.14);}\n' +
      '.ss-guided-nav-next{background:linear-gradient(105deg,#00A89D,#0d9488);color:#fff;}\n' +
      '.ss-guided-nav-meta{flex:1 1 auto;text-align:center;font-size:0.8rem;font-weight:700;color:#64748b;}\n' +
      'html.dark .ss-guided-nav-meta,.ss-guided-layer.dark .ss-guided-nav-meta{color:#94a3b8;}\n\n';

    return header + transformed;
  }

  global.scopeSmartSavingsCss = scopeCss;
})(typeof window !== 'undefined' ? window : globalThis);
