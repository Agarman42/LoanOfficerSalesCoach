/**
 * Scope smart-savings/css/app.css → css/smart-savings.css
 * Prefix selectors with .smart-savings-root for native LO coach embed.
 *
 *   node scripts/scope-smart-savings-css.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcPath = path.join(root, 'smart-savings/css/app.css');
const outPath = path.join(root, 'css/smart-savings.css');

export function scopeCss(src) {
  const fonts = [];
  src = src.replace(/@import\s+url\([^)]+\)\s*;?/g, (m) => {
    fonts.push(m.endsWith(';') ? m : m + ';');
    return '';
  });

  const holds = [];
  src = src.replace(
    /@(keyframes|font-face|property)[\s\S]*?\{[\s\S]*?\n\}/g,
    (m) => {
      holds.push(m);
      return `/*__HOLD_${holds.length - 1}__*/`;
    }
  );

  function prefixSel(raw) {
    const cleaned = raw.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleaned) return cleaned;
    return cleaned
      .split(',')
      .map((s) => {
        s = s.trim();
        if (!s) return s;
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
        if (s.startsWith('body.')) return '.smart-savings-root' + s.slice(4);
        if (s.startsWith('body ')) return '.smart-savings-root ' + s.slice(5);
        if (s.startsWith('html.dark ') || s.startsWith('html:not')) {
          return s.replace(
            /^html(\.dark|:not\([^)]+\))\s+/,
            (_, p) => 'html' + p + ' .smart-savings-root '
          );
        }
        if (s === 'html.dark' || s === 'html:not(.dark)') {
          return s + ' .smart-savings-root';
        }
        if (s.startsWith('.dark ')) {
          const rest = s.slice(6);
          return (
            'html.dark .smart-savings-root ' +
            rest +
            ', .smart-savings-root.dark ' +
            rest
          );
        }
        if (s === '.dark') {
          return 'html.dark .smart-savings-root, .smart-savings-root.dark';
        }
        if (s.includes('smart-savings-root')) return s;
        if (s === '*' || s.startsWith('*::') || s.startsWith('* ')) {
          return '.smart-savings-root ' + s;
        }
        // Avoid double-prefixing html/body leftovers
        if (s.startsWith('html ') || s.startsWith('html.')) {
          return s.replace(/^html(\S*)\s*/, 'html$1 .smart-savings-root ');
        }
        return '.smart-savings-root ' + s;
      })
      .join(', ');
  }

  function transformBlock(cssText) {
    let out = '';
    let i = 0;
    const n = cssText.length;
    while (i < n) {
      if (cssText[i] === '/' && cssText[i + 1] === '*') {
        const end = cssText.indexOf('*/', i + 2);
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
        const brace = cssText.indexOf('{', i);
        if (brace < 0) {
          out += cssText.slice(i);
          break;
        }
        const atRule = cssText.slice(i, brace).trim();
        let depth = 0;
        let j = brace;
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
          atRule.startsWith('@keyframes') ||
          atRule.startsWith('@font-face') ||
          atRule.startsWith('@property')
        ) {
          out += cssText.slice(i, j);
          i = j;
          continue;
        }
        const inner = cssText.slice(brace + 1, j - 1);
        out += atRule + ' {\n' + transformBlock(inner) + '\n}\n';
        i = j;
        continue;
      }
      const brace = cssText.indexOf('{', i);
      if (brace < 0) {
        out += cssText.slice(i);
        break;
      }
      const sel = cssText.slice(i, brace);
      let depth = 0;
      let j = brace;
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
      const body = cssText.slice(brace, j);
      out += prefixSel(sel) + body + '\n';
      i = j;
    }
    return out;
  }

  let transformed = transformBlock(src);
  holds.forEach((h, idx) => {
    transformed = transformed.replace(`/*__HOLD_${idx}__*/`, h);
  });

  const header =
    '/* Smart Savings · scoped for LO Sales Coach native embed (.smart-savings-root)\n' +
    '   Generated by scripts/scope-smart-savings-css.mjs from smart-savings/css/app.css */\n' +
    fonts.join('\n') +
    '\n\n' +
    '.smart-savings-root {\n' +
    '  position: relative;\n' +
    '  isolation: isolate;\n' +
    '  min-height: 12rem;\n' +
    '  overflow: hidden;\n' +
    '  border-radius: 1rem;\n' +
    '}\n' +
    '.smart-savings-root .atmosphere {\n' +
    '  position: absolute !important;\n' +
    '  inset: 0 !important;\n' +
    '  z-index: 0;\n' +
    '}\n' +
    '.smart-savings-root [id$="-modal"],\n' +
    '.smart-savings-root #loading-modal,\n' +
    '.smart-savings-root #email-loading-modal,\n' +
    '.smart-savings-root #toast {\n' +
    '  z-index: 9200 !important;\n' +
    '}\n' +
    '/* Keep page scroll lock light so coach chrome still works */\n' +
    'body.ss-smart-savings-modal-open { overflow: hidden; }\n\n';

  return header + transformed;
}

// Always run when executed as CLI: node scripts/scope-smart-savings-css.mjs
const isCli =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const css = fs.readFileSync(srcPath, 'utf8');
  const out = scopeCss(css);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, out);
  console.log('[scope-smart-savings-css] wrote', outPath, '(' + out.length + ' bytes)');
}
