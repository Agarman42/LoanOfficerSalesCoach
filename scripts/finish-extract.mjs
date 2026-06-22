#!/usr/bin/env node
/**
 * Fully externalizes text/plain script holders into standalone JS files.
 * Run: node scripts/finish-extract.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const indexPath = join(root, 'index.html');
let html = readFileSync(indexPath, 'utf8');

function extractHolder(htmlStr, id, outFile, loaderPrefix) {
  const open = `<script type="text/plain" id="${id}"`;
  const start = htmlStr.indexOf(open);
  if (start === -1) return htmlStr;

  const contentStart = htmlStr.indexOf('>', start) + 1;
  const close = htmlStr.indexOf('</script>', contentStart);
  if (close === -1) throw new Error(`Missing closing tag for #${id}`);

  let code = htmlStr.slice(contentStart, close);
  code = code.replace(/^\/\/ PLACEHOLDER_START\n/, '');

  const outPath = join(root, outFile);
  writeFileSync(outPath, loaderPrefix + code.trimStart() + '\n');

  const commentStart = htmlStr.lastIndexOf('<!-- extracted-to-app-bulk.js -->', start);
  const removeFrom = commentStart !== -1 && commentStart > start - 200 ? commentStart : start;
  return htmlStr.slice(0, removeFrom) + htmlStr.slice(close + '</script>'.length);
}

const appBulkPrefix = `// Fully extracted from index.html — app bulk features
// Early defensive stub for Social Strategy rich modals (ensures clicks work even if main IIFE is delayed by cache/load)
(function() {
  if (typeof window.openSocialModal !== 'function') {
    window.openSocialModal = function(pillar) {
      const modal = document.getElementById('content-modal');
      const titleEl = document.getElementById('modal-title');
      const listEl = document.getElementById('modal-list');
      if (modal && titleEl && listEl) {
        titleEl.textContent = (pillar || 'Social Strategy') + ' — loading rich content...';
        listEl.innerHTML = \`
          <div class="p-6 text-center">
            <p class="mb-4">Loading the refreshed Social Media Strategy content...</p>
            <button onclick="location.reload()" class="px-5 py-2 bg-[#00A89D] text-white rounded-2xl text-sm font-semibold">Force Reload Now</button>
          </div>
        \`;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      } else {
        console.warn('[Social] openSocialModal called before full init. Try hard refresh (Ctrl+Shift+R).');
        alert('Social Strategy content is loading. Please hard refresh the page (Ctrl + Shift + R or Cmd + Shift + R) to see the latest rich modals.');
      }
    };
  }
})();

`;
html = extractHolder(html, 'app-bulk-src', 'js/features/app-bulk.js', appBulkPrefix);

const referralPrefix = `// Fully extracted from index.html — referral / event / profile modal helpers\n`;
html = extractHolder(html, 'referral-event-modals-src', 'js/features/referral-event-modals.js', referralPrefix);

// Clean up stray end comment if present
html = html.replace('</script><!-- referral-event-modals-src end -->', '');

writeFileSync(indexPath, html);

for (const file of ['js/features/app-bulk.js', 'js/features/referral-event-modals.js']) {
  execSync(`node --check ${file}`, { cwd: root, stdio: 'inherit' });
}

console.log('Fully externalized app-bulk.js and referral-event-modals.js');
console.log('Removed text/plain holders from index.html');
console.log('Syntax check passed.');