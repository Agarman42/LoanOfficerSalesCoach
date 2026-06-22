#!/usr/bin/env node
/**
 * Extracts large inline script blocks from index.html into external JS files
 * and replaces them with async script tags.
 * Run: node scripts/extract-perf-scripts.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const indexPath = join(root, 'index.html');
let html = readFileSync(indexPath, 'utf8');
const lines = html.split('\n');

// 1-based line numbers (post head/main.js moves)
const BULK_SCRIPT_OPEN = 6930;
const BULK_CONTENT_START = 6931;
const BULK_CONTENT_END = 14426;
const BULK_SCRIPT_CLOSE = 14427;

const REFERRAL_SCRIPT_OPEN = 14629;
const REFERRAL_CONTENT_START = 14630;
const REFERRAL_CONTENT_END = 16139;
const REFERRAL_SCRIPT_CLOSE = 16140;

function sliceLines(start, end) {
  return lines.slice(start - 1, end).join('\n');
}

const bulkJs = sliceLines(BULK_CONTENT_START, BULK_CONTENT_END) + '\n';
const referralJs = sliceLines(REFERRAL_CONTENT_START, REFERRAL_CONTENT_END) + '\n';

writeFileSync(join(root, 'js/features/app-bulk.js'), bulkJs);
writeFileSync(join(root, 'js/features/referral-event-modals.js'), referralJs);

// Replace bulk inline block
const bulkReplacement = '<script async src="js/features/app-bulk.js?v=20260618-perf"></script>';
lines.splice(BULK_SCRIPT_OPEN - 1, BULK_SCRIPT_CLOSE - BULK_SCRIPT_OPEN + 1, bulkReplacement);

// Re-find referral block after bulk removal (line numbers shifted)
html = lines.join('\n');
const referralOpenIdx = html.indexOf('<script>\n// =====================================================\n// EVENT PLANNING HELPERS');
if (referralOpenIdx === -1) {
  throw new Error('Could not find referral-event-modals script block');
}
const referralCloseIdx = html.indexOf('})();\n</script>\n\n<!-- =====================================================\n     CENTRAL USER PROFILE', referralOpenIdx);
if (referralCloseIdx === -1) {
  throw new Error('Could not find end of referral-event-modals script block');
}
const referralReplacement = '<script async src="js/features/referral-event-modals.js?v=20260618-perf"></script>';
html = html.slice(0, referralOpenIdx) + referralReplacement + html.slice(referralCloseIdx + '})();\n</script>\n\n'.length);

writeFileSync(indexPath, html);

for (const file of ['js/features/app-bulk.js', 'js/features/referral-event-modals.js']) {
  execSync(`node --check ${file}`, { cwd: root, stdio: 'inherit' });
}

console.log('Extracted app-bulk.js:', bulkJs.split('\n').length, 'lines');
console.log('Extracted referral-event-modals.js:', referralJs.split('\n').length, 'lines');
console.log('Updated index.html');
console.log('Syntax check passed.');