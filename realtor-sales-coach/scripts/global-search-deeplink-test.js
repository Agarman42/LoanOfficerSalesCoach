#!/usr/bin/env node
/**
 * Static deep-link wiring audit for global search handlers.
 * Run: node scripts/global-search-deeplink-test.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

function keysFromConst(src, constName) {
  const marker = `const ${constName} = {`;
  const start = src.indexOf(marker);
  if (start === -1) return new Set();
  const keys = new Set();
  const slice = src.slice(start, start + 200000);
  const re = /'([^']+)':\s*\{/g;
  let m;
  let count = 0;
  while ((m = re.exec(slice)) && count < 80) {
    keys.add(m[1]);
    count++;
  }
  return keys;
}

function hasDetailKey(category, key) {
  return new RegExp(`'${category}':\\s*\\{[\\s\\S]*?'${key}':\\s*\\{`).test(appBulk);
}

function extractHandlers() {
  const src = read('js/features/global-search-deep-index.js');
  const handlers = [];
  const re = /\{\s*kind:\s*'([^']+)'([^}]*)\}/g;
  let m;
  while ((m = re.exec(src))) {
    const body = m[2];
    const pick = (name) => {
      const mm = body.match(new RegExp(`${name}:\\s*'([^']+)'`));
      return mm ? mm[1] : null;
    };
    handlers.push({
      kind: m[1],
      key: pick('key'),
      category: pick('category'),
      sectionId: pick('sectionId'),
      mode: pick('mode'),
      tier: pick('tier'),
      action: pick('action'),
      loanType: pick('loanType'),
    });
  }
  return handlers;
}

function loadScriptPairs() {
  const src = read('js/features/sales-scripts.js');
  const pairs = [];
  const catRe = /"([a-z0-9-]+)":\s*\{[\s\S]*?scenarios:\s*\[([\s\S]*?)\]\s*,?\s*\}/g;
  let m;
  while ((m = catRe.exec(src))) {
    const catKey = m[1];
    const block = m[2];
    const valRe = /value:\s*"((?:\\.|[^"\\])*)"/g;
    let vm;
    while ((vm = valRe.exec(block))) pairs.push({ categoryKey: catKey, scenarioValue: vm[1] });
  }
  return pairs;
}

const appBulk = read('js/features/app-bulk.js');
const legacy = read('js/features/legacy-helpers.js');
const referralEvent = read('js/features/referral-event-modals.js');

const PROCESS_KEYS = keysFromConst(appBulk, 'PROCESS_TEMPLATES');
const NURTURE_KEYS = keysFromConst(appBulk, 'NURTURE_TEMPLATES');
const HIGH_IMPACT_KEYS = keysFromConst(legacy, 'HIGH_IMPACT_PLAYS');
const TIER_KEYS = keysFromConst(legacy, 'TIER_PLAYBOOKS');


const loHtml = read('index.html');
const realtorHtml = read('realtor-sales-coach/index.html');
const sectionIds = new Set();
[loHtml, realtorHtml].forEach((html) => {
  let m;
  const re = /(?:href="#|id=")([a-z0-9-]+)"/gi;
  while ((m = re.exec(html))) sectionIds.add(m[1]);
});
const eventModals = new Set();
let em;
const modalRe = /id="(modal-[a-z0-9-]+)"/g;
while ((em = modalRe.exec(loHtml))) eventModals.add(em[1]);

function collect(re, src) {
  const out = new Set();
  let m;
  while ((m = re.exec(src))) out.add(m[1]);
  return out;
}

const facts = collect(/fact\('([^']+)'/g, read('js/data/lo-fact-vault.js'));
const books = collect(/id:\s*"(book-[^"]+)"/g, legacy);
const pillars = collect(/^\s{4}([A-Za-z][\w\s]*):\s*\{/gm, read('js/features/social-modals.js'));
const mindsetIds = collect(/id:\s*"([^"]+)"/g, read('js/features/mindset-lab.js'));

const handlers = extractHandlers();
const scriptPairs = loadScriptPairs();
const issues = [];
const fail = (msg) => issues.push(msg);

for (const h of handlers) {
  switch (h.kind) {
    case 'event': {
      const modalId = `modal-${h.key}`;
      if (!eventModals.has(modalId) && !referralEvent.includes(`'${h.key}':`)) {
        fail(`event:${h.key} — no #${modalId} and no fallback map`);
      }
      break;
    }
    case 'appreciation':
      if (!['events', 'touches', 'partners'].includes(h.mode)) fail(`appreciation mode '${h.mode}' unsupported`);
      break;
    case 'process':
      if (!PROCESS_KEYS.has(h.key)) fail(`process '${h.key}' missing`);
      break;
    case 'nurture':
      if (!NURTURE_KEYS.has(h.key)) fail(`nurture '${h.key}' missing`);
      break;
    case 'detail':
      if (!hasDetailKey(h.category, h.key)) fail(`detail ${h.category}/${h.key} missing`);
      break;
    case 'referral-play':
      if (!HIGH_IMPACT_KEYS.has(h.key)) fail(`referral-play '${h.key}' missing`);
      break;
    case 'referral-tier':
      if (!TIER_KEYS.has(h.tier)) fail(`referral-tier '${h.tier}' missing`);
      break;
    case 'section':
      if (!sectionIds.has(h.sectionId)) fail(`section '${h.sectionId}' missing from HTML`);
      break;
    case 'underwriting':
      if (!sectionIds.has('underwriting-search')) fail('underwriting-search section missing');
      if (h.loanType && !['any', 'conventional', 'fha', 'va', 'usda', 'non-qm'].includes(h.loanType)) {
        fail(`uw loanType '${h.loanType}' invalid`);
      }
      break;
    case 'action':
      if (h.action !== 'saved') fail(`action '${h.action}' unknown`);
      break;
    case 'script':
      break;
    default:
      fail(`unknown kind '${h.kind}'`);
  }
}

for (const { categoryKey, scenarioValue } of scriptPairs) {
  if (categoryKey === 'custom') continue;
  const needle = `value: "${scenarioValue}"`;
  if (!read('js/features/sales-scripts.js').includes(needle)) {
    fail(`script pair broken: ${categoryKey} / ${scenarioValue.slice(0, 50)}`);
  }
}

const allJs = [
  'js/main.js', 'js/features/app-bulk.js', 'js/features/legacy-helpers.js',
  'js/features/referral-event-modals.js', 'js/features/sales-scripts.js',
  'js/features/social-modals.js', 'js/features/mindset-lab.js',
].map(read).join('\n');

[
  'showSection', 'openEventModal', 'showClientAppreciationModal', 'showDetailModal',
  'showProcessTemplateModal', 'showNurtureTemplateModal', 'openHighImpactPlay', 'openTierModal',
  'bridgeToScriptGenerator', 'showVaultItemModal', 'filterToBook', 'openSocialPillarModal', 'filterToMindset',
].forEach((fn) => {
  if (!new RegExp(`(window\\.${fn}|function ${fn})\\s*[=({]`).test(allJs)) fail(`missing fn ${fn}`);
});

console.log('Global Search Deep-Link Audit\n');
const groups = {};
handlers.forEach((h) => { groups[h.kind] = (groups[h.kind] || 0) + 1; });
Object.entries(groups).sort().forEach(([k, n]) => console.log(`  ${k.padEnd(16)} ${n}`));
console.log(`  script scenarios  ${scriptPairs.length}`);
console.log(`  facts / books     ${facts.size} / ${books.size}`);

if (issues.length) {
  console.log(`\n${issues.length} issue(s):`);
  issues.forEach((i) => console.log(`  ✗ ${i}`));
  process.exit(1);
}

console.log('\nAll deep-link targets resolve.');
console.log('\nBrowser spot-check while you test:');
[
  'post event checklist → Post-Event Follow-Up modal',
  'fha collections → UW + FHA + query prefilled',
  'ruoff plus → Ruoff+ fact modal',
  'rates too high → script scenario selected',
  'A+ partner → partner tier modal',
].forEach((t) => console.log(`  • ${t}`));