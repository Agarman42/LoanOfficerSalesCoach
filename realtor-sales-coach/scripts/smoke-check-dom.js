#!/usr/bin/env node
/**
 * Lightweight DOM smoke check for Agent Sales Coach.
 * Usage: node scripts/smoke-check-dom.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const htmlPath = path.join(root, 'index.html');

const REQUIRED_IDS = [
  'sidebar',
  'global-loading',
  'user-profile-modal',
  'profile-export-data',
  'profile-import-data',
  'home',
  'home-setup-slot',
  'home-start-here',
  'home-greeting',
  'ai-chat',
  'chat-input',
  'planning',
  'plan-output',
  'weekly-win-plan',
  'bio-creator',
  'generate-bio-btn',
  'bio-output-panel',
  'newsletter-generator',
  'blog',
  'social-post',
  'sales-script',
  'listing-description',
  'open-house',
  'consultation',
  'open-profile-btn'
];

const REQUIRED_HREFS = [
  'home',
  'ai-chat',
  'bio-creator',
  'weekly-win-plan',
  'planning',
  'listing-description',
  'open-house',
  'consultation',
  'social-post',
  'blog',
  'newsletter-generator',
  'sales-script',
  'referrals',
  'database',
  'value-vault'
];

// LO-only tools must NOT appear as primary sections
const FORBIDDEN_SECTION_IDS = [
  'equity-scanner',
  'underwriting-search',
  'calculator'
];

function main() {
  if (!fs.existsSync(htmlPath)) {
    console.error('FAIL: index.html not found');
    process.exit(1);
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  let failed = false;

  const missingIds = REQUIRED_IDS.filter((id) => !html.includes(`id="${id}"`));
  const missingHrefs = REQUIRED_HREFS.filter((id) => !html.includes(`href="#${id}"`));
  const forbidden = FORBIDDEN_SECTION_IDS.filter((id) => html.includes(`id="${id}"`));

  if (missingIds.length) {
    failed = true;
    console.error('FAIL: missing ids:', missingIds.join(', '));
  }
  if (missingHrefs.length) {
    failed = true;
    console.error('FAIL: missing hrefs:', missingHrefs.join(', '));
  }
  if (forbidden.length) {
    failed = true;
    console.error('FAIL: LO-only sections present:', forbidden.join(', '));
  }
  if (!html.includes('bio-creator.js')) {
    failed = true;
    console.error('FAIL: bio-creator.js not loaded');
  }
  if (html.includes('id="coach-start-here"')) {
    failed = true;
    console.error('FAIL: coach-start-here still on AI chat (should live on Home)');
  }

  if (failed) process.exit(1);
  console.log('Smoke check PASSED');
  console.log(`  Checked ${REQUIRED_IDS.length} ids, ${REQUIRED_HREFS.length} hrefs`);
  console.log('  No LO-only tools; Home + Bio Builder present');
}

main();
