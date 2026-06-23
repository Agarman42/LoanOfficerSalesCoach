#!/usr/bin/env node
/**
 * Static smoke audit — section bridges + modal key wiring for Agent Sales Coach.
 * Run from repo root: node realtor-sales-coach/scripts/modal-smoke-audit.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const indexPath = path.join(ROOT, 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

const featureDir = path.join(ROOT, 'js/features');
const jsFiles = fs
  .readdirSync(featureDir)
  .filter((f) => f.endsWith('.js'))
  .map((f) => path.join(featureDir, f));
jsFiles.push(path.join(ROOT, 'js/main.js'));

const allSource = [indexHtml, ...jsFiles.map((f) => fs.readFileSync(f, 'utf8'))].join('\n');

const issues = [];
const notes = [];

function extractConstBlock(source, constName) {
  const marker = `const ${constName} = {`;
  const start = source.indexOf(marker);
  if (start < 0) return null;
  let depth = 0;
  let i = start + marker.length - 1;
  for (; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  return null;
}

function extractObjectKeys(block) {
  const keys = new Set();
  if (!block) return keys;
  const re = /(?:['"]([^'"]+)['"]|([A-Za-z_$][\w$-]*))\s*:/g;
  let m;
  while ((m = re.exec(block)) !== null) keys.add(m[1] || m[2]);
  return keys;
}

function extractNestedBlock(source, key) {
  const patterns = [`'${key}': {`, `"${key}": {`, `${key}: {`];
  let start = -1;
  let openBrace = -1;
  for (const pat of patterns) {
    const idx = source.indexOf(pat);
    if (idx >= 0) {
      start = idx;
      openBrace = idx + pat.length - 1;
      break;
    }
  }
  if (start < 0) return null;
  let depth = 0;
  for (let i = openBrace; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  return null;
}

function extractCalls(pattern, source, groupCount = 1) {
  const results = [];
  const re = new RegExp(pattern, 'g');
  let m;
  while ((m = re.exec(source)) !== null) {
    if (groupCount === 1) results.push(m[1]);
    else results.push([m[1], m[2]]);
  }
  return results;
}

// --- Sections ---
const sectionIds = new Set(
  [...indexHtml.matchAll(/<section\s+id="([^"]+)"/g)].map((m) => m[1])
);

const aliasBlock = extractConstBlock(fs.readFileSync(path.join(ROOT, 'js/main.js'), 'utf8'), 'aliases');
const sectionAliases = {};
if (aliasBlock) {
  [...aliasBlock.matchAll(/'([^']+)':\s*'([^']+)'/g)].forEach((m) => {
    sectionAliases[m[1]] = m[2];
  });
}

const showSectionTargets = new Set(extractCalls("showSection\\s*\\(\\s*['\"]([^'\"]+)['\"]", allSource));
for (const target of showSectionTargets) {
  const resolved = sectionAliases[target] || target;
  if (!sectionIds.has(resolved)) {
    issues.push(`showSection('${target}') → missing section #${resolved}`);
  }
}

// --- DETAIL_CONTENT (life-event, scaling, client-tier) ---
const detailBlock = extractConstBlock(indexHtml, 'DETAIL_CONTENT');
const detailCategories = extractObjectKeys(detailBlock);
const showDetailCalls = extractCalls(
  "showDetailModal\\s*\\(\\s*['\"]([^'\"]+)['\"]\\s*,\\s*['\"]([^'\"]+)['\"]",
  allSource,
  2
);
for (const [cat, key] of showDetailCalls) {
  if (!detailCategories.has(cat)) {
    issues.push(`showDetailModal('${cat}','${key}') → unknown category in DETAIL_CONTENT`);
    continue;
  }
  const catBlock = extractNestedBlock(detailBlock, cat);
  const catKeys = extractObjectKeys(catBlock);
  if (!catKeys.has(key)) {
    issues.push(`showDetailModal('${cat}','${key}') → key missing in DETAIL_CONTENT`);
  }
}

// --- Rich-modal key maps (from *-rich-modals.js) ---
function readConstKeys(file, constName) {
  const src = fs.readFileSync(file, 'utf8');
  return extractObjectKeys(extractConstBlock(src, constName));
}

const keyMaps = {
  nurture: readConstKeys(path.join(featureDir, 'nurture-rich-modals.js'), 'NURTURE_TITLES'),
  process: readConstKeys(path.join(featureDir, 'process-rich-modals.js'), 'TITLES'),
  event: readConstKeys(path.join(featureDir, 'event-rich-modals.js'), 'EVENT_TITLES'),
  appreciation: readConstKeys(path.join(featureDir, 'event-rich-modals.js'), 'APPRECIATION_TITLES'),
  scaling: readConstKeys(path.join(featureDir, 'database-rich-modals.js'), 'SCALING_TITLES'),
  pillar: readConstKeys(path.join(featureDir, 'database-rich-modals.js'), 'PILLAR_TITLES'),
  referralPlay: readConstKeys(path.join(featureDir, 'referral-rich-modals.js'), 'RENDERERS'),
};

for (const key of extractCalls("showNurtureTemplateModal\\s*\\(\\s*['\"]([^'\"]+)['\"]", allSource)) {
  if (!keyMaps.nurture.has(key)) issues.push(`showNurtureTemplateModal('${key}') → no NURTURE_TITLES entry`);
}

for (const key of extractCalls("showProcessTemplateModal\\s*\\(\\s*['\"]([^'\"]+)['\"]", allSource)) {
  if (!keyMaps.process.has(key)) issues.push(`showProcessTemplateModal('${key}') → no process TITLES entry`);
}

for (const key of extractCalls("openEventModal\\s*\\(\\s*['\"]([^'\"]+)['\"]", allSource)) {
  if (!keyMaps.event.has(key)) {
    notes.push(`openEventModal('${key}') — no EVENT_TITLES entry (may use inline fallback)`);
  }
}

for (const key of extractCalls("openDatabaseModal\\s*\\(\\s*['\"]([^'\"]+)['\"]", allSource)) {
  if (!keyMaps.pillar.has(key)) issues.push(`openDatabaseModal('${key}') → no PILLAR_TITLES entry`);
}

for (const key of extractCalls("openHighImpactPlay\\s*\\(\\s*['\"]([^'\"]+)['\"]", allSource)) {
  const hiBlock = extractConstBlock(indexHtml, 'HIGH_IMPACT_PLAYS');
  const hiKeys = extractObjectKeys(hiBlock);
  const hasRich = keyMaps.referralPlay.has(key);
  if (!hiKeys.has(key) && !hasRich) {
    issues.push(`openHighImpactPlay('${key}') → missing HIGH_IMPACT_PLAYS + referral RENDERERS`);
  } else if (!hasRich) {
    notes.push(`openHighImpactPlay('${key}') — inline fallback only (no rich renderer)`);
  }
}

// Referral partner types — normalizePartnerType handles display names
const referralPartnerCalls = extractCalls("openReferralModal\\s*\\(\\s*['\"]([^'\"]+)['\"]", allSource);
const refBlock = extractConstBlock(indexHtml, 'REFERRAL_PLAYBOOKS');
const refKeys = extractObjectKeys(refBlock);
const normalizedPartnerKeys = new Set([
  'fellow-agents', 'lenders', 'title', 'builders', 'financial-planners', 'attorneys', 'insurance-agents', 'other'
]);
for (const raw of referralPartnerCalls) {
  const lower = raw.toLowerCase();
  const mapsToNormalized =
    ['fellowagents', 'fellow agents', 'realtors', 'realtor'].includes(lower) ? 'fellow-agents' :
    ['lenders', 'lender', 'mortgage'].includes(lower) ? 'lenders' :
    ['title', 'escrow'].includes(lower) ? 'title' :
    ['builders', 'builder'].includes(lower) ? 'builders' :
    ['financial planners', 'financial-planners', 'cpa', 'cpas'].includes(lower) ? 'financial-planners' :
    ['attorneys', 'attorney'].includes(lower) ? 'attorneys' :
    ['insurance agents', 'insurance-agents', 'insurance'].includes(lower) ? 'insurance-agents' :
    lower === 'other' ? 'other' : null;

  if (refKeys.has(raw)) continue;
  if (mapsToNormalized && normalizedPartnerKeys.has(mapsToNormalized)) {
    notes.push(`openReferralModal('${raw}') — normalized via renderRichReferralPartner`);
    continue;
  }
  issues.push(`openReferralModal('${raw}') → unmapped partner type`);
}

// Appreciation modes
for (const key of extractCalls("showClientAppreciationModal\\s*\\(\\s*['\"]([^'\"]+)['\"]", allSource)) {
  if (!keyMaps.appreciation.has(key)) issues.push(`showClientAppreciationModal('${key}') → no APPRECIATION_TITLES entry`);
}
if (allSource.includes('showClientAppreciationModal()')) {
  if (!keyMaps.appreciation.has('events')) issues.push('showClientAppreciationModal() default → missing events mode');
}

// Communication modal types
for (const key of extractCalls("showCommunicationModal\\s*\\(\\s*['\"]([^'\"]+)['\"]", allSource)) {
  if (!['client', 'realtor'].includes(key)) {
    issues.push(`showCommunicationModal('${key}') → expected 'client' or 'realtor'`);
  }
}

// Modal DOM roots
const expectedModalRoots = [
  'detail-modal',
  'process-template-modal',
  'nurture-template-modal',
  'client-appreciation-modal',
  'communication-modal',
  'referral-modal',
  'content-modal',
  'modal-drive-attendance',
  'modal-client-appreciation',
  'modal-partner-mastermind',
  'modal-social-networking',
  'modal-community-charity',
  'modal-post-event-followup'
];
for (const id of expectedModalRoots) {
  if (!indexHtml.includes(`id="${id}"`)) issues.push(`Missing modal DOM root #${id}`);
}

// Dead-code sentinels (should stay absent)
const deadSentinels = [
  'BLOG_ENABLE_RUOFF',
  'getRuoffPublishButtonHtml',
  'sales.ruoff.com',
  'equity-scanner',
  'openEquityScanner',
  'payment-calculator',
  'Buyer Payment Calculator'
];
for (const sentinel of deadSentinels) {
  if (allSource.includes(sentinel)) {
    issues.push(`Dead-code sentinel still present: ${sentinel}`);
  }
}

// --- Report ---
console.log('Agent Sales Coach — modal smoke audit\n');
console.log(`Sections in index.html: ${sectionIds.size}`);
console.log(`showSection targets checked: ${showSectionTargets.size}`);
console.log(`Modal DOM roots checked: ${expectedModalRoots.length}`);
console.log(`showDetailModal calls: ${showDetailCalls.length}`);
console.log(`openEventModal calls: ${new Set(extractCalls("openEventModal\\s*\\(\\s*['\"]([^'\"]+)['\"]", allSource)).size}`);
console.log(`openReferralModal calls: ${referralPartnerCalls.length}`);
console.log(`openHighImpactPlay calls: ${new Set(extractCalls("openHighImpactPlay\\s*\\(\\s*['\"]([^'\"]+)['\"]", allSource)).size}`);

if (notes.length) {
  console.log(`\nNotes (${notes.length}):`);
  notes.forEach((n) => console.log(`  • ${n}`));
}

if (issues.length) {
  console.log(`\nISSUES (${issues.length}):`);
  issues.forEach((i) => console.log(`  ✗ ${i}`));
  process.exit(1);
}

console.log('\n✓ All checks passed (0 issues)');
process.exit(0);