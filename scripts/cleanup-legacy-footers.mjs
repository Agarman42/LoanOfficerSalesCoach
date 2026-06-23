#!/usr/bin/env node
/** Remove legacy-section-footer and section-next-level-banner placeholders from index.html */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const indexPath = join(root, 'index.html');
let html = readFileSync(indexPath, 'utf8');

function removeDivWithClass(htmlStr, classFragment) {
  let result = htmlStr;
  let safety = 0;
  while (safety++ < 50) {
    const idx = result.indexOf(classFragment);
    if (idx === -1) break;
    const start = result.lastIndexOf('<div', idx);
    if (start === -1) break;

    let removeStart = start;
    const before = result.slice(Math.max(0, start - 300), start);
    const comment = before.match(/<!--[\s\S]*?-->\s*$/);
    if (comment) removeStart = start - comment[0].length;

    let pos = start;
    let depth = 0;
    let end = -1;
    while (pos < result.length) {
      const open = result.indexOf('<div', pos);
      const close = result.indexOf('</div>', pos);
      if (close === -1) break;
      if (open !== -1 && open < close) {
        depth += 1;
        pos = open + 4;
      } else {
        depth -= 1;
        pos = close + 6;
        if (depth === 0) {
          end = pos;
          break;
        }
      }
    }
    if (end === -1) break;
    result = result.slice(0, removeStart) + result.slice(end);
  }
  return result;
}

const before = html.length;
html = removeDivWithClass(html, 'legacy-section-footer');
html = removeDivWithClass(html, 'section-next-level-banner');
writeFileSync(indexPath, html);
console.log(`Removed legacy footers. HTML size: ${before} → ${html.length} (${before - html.length} chars removed)`);