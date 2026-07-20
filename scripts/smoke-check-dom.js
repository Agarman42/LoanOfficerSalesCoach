#!/usr/bin/env node
/**
 * Lightweight DOM smoke check for LO Sales Coach.
 * Verifies critical section IDs and generator targets exist in index.html.
 *
 * Usage: node scripts/smoke-check-dom.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const htmlPath = path.join(root, 'index.html');

const REQUIRED_IDS = [
  // Shell
  'sidebar',
  'global-loading',
  'user-profile-modal',
  'profile-export-data',
  'profile-import-data',
  // Home launchpad + AI tools / sections
  'home',
  'home-setup-slot',
  'home-start-here',
  'home-greeting',
  'ai-chat',
  'chat-input',
  'planning',
  'plan-output',
  'generate-plan-btn',
  'weekly-win-plan',
  'generate-win-plan-btn',
  'weekly-tasks-container',
  'bio-creator',
  'generate-bio-btn',
  'bio-output-panel',
  'newsletter-generator',
  'blog',
  'social-post',
  'sales-script',
  'equity-scanner',
  'smart-savings',
  'smart-savings-root',
  'underwriting-search',
  'client-translation',
  // Empty states + polish
  'blog-empty-state',
  'social-empty-state',
  'script-empty-state',
  'equity-empty-state',
  'nl-empty-state',
  'generate-script-btn',
  'generate-social-btn',
  // Profile / backup
  'open-profile-btn'
];

const REQUIRED_HREF_TARGETS = [
  'equity-scanner',
  'smart-savings',
  'social',
  'social-post',
  'blog',
  'newsletter-generator',
  'home',
  'weekly-win-plan',
  'planning',
  'ai-chat',
  'bio-creator',
  'sales-script',
  'referrals',
  'database',
  'value-vault',
  'eventplanning',
  'process',
  'underwriting-search',
  'calculator',
  'mindset-motivation',
  'books',
  'client-translation'
];

function main() {
  if (!fs.existsSync(htmlPath)) {
    console.error('FAIL: index.html not found at', htmlPath);
    process.exit(1);
  }

  const html = fs.readFileSync(htmlPath, 'utf8');
  const missingIds = REQUIRED_IDS.filter((id) => !html.includes(`id="${id}"`));
  const missingHrefs = REQUIRED_HREF_TARGETS.filter((id) => !html.includes(`href="#${id}"`));

  // Structural: plan-output must live inside planning section
  const planStart = html.indexOf('id="planning"');
  const planOutput = html.indexOf('id="plan-output"');
  const planSectionEnd = planOutput > -1 ? html.indexOf('</section>', planOutput) : -1;
  const planOutputInSection =
    planStart > -1 && planOutput > planStart && planSectionEnd > planOutput;

  let failed = false;

  if (missingIds.length) {
    failed = true;
    console.error('FAIL: missing required element ids:');
    missingIds.forEach((id) => console.error('  -', id));
  }

  if (missingHrefs.length) {
    failed = true;
    console.error('FAIL: missing sidebar href targets:');
    missingHrefs.forEach((id) => console.error('  -', id));
  }

  if (!planOutputInSection) {
    failed = true;
    console.error('FAIL: #plan-output is missing or not inside #planning section');
  }

  // Legacy bulk should stay stub-sized
  const legacyMatch = html.match(/id="prospecting-legacy-removed"[\s\S]{0,500}?<\/section>/);
  if (legacyMatch && legacyMatch[0].length > 400) {
    failed = true;
    console.error('FAIL: prospecting-legacy-removed still looks bloated (' + legacyMatch[0].length + ' chars)');
  }

  if (failed) {
    console.error('\nSmoke check FAILED');
    process.exit(1);
  }

  console.log('Smoke check PASSED');
  console.log(`  Checked ${REQUIRED_IDS.length} ids, ${REQUIRED_HREF_TARGETS.length} sidebar targets`);
  console.log('  #plan-output is inside #planning');
  process.exit(0);
}

main();
