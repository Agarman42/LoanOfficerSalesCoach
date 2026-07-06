#!/usr/bin/env node
/**
 * One-shot migration: alert() → window.notifyUser() / window.saveNotReady()
 * Run: node scripts/migrate-alerts-to-toast.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const FILES = [
  'index.html',
  'js/main.js',
  'js/api.js',
  'js/features/ai-chat.js',
  'js/features/save-ribbon.js',
  'js/features/weekly-win-plan.js',
  'js/features/newsletter-entertainment.js',
  'js/features/value-vault.js',
  'js/features/newsletter-generator.js',
  'js/features/social-post.js',
  'js/features/sales-scripts.js',
  'js/features/blog-creator.js',
  'js/features/legacy-helpers.js',
  'js/features/listing-description.js',
];

const SAVE_NOT_READY = new Set([
  "'Save ready after refresh'",
  "'Save system ready after refresh.'",
  "'Saved (system will be ready after refresh).'",
  "'Save system not ready — please refresh.'",
]);

function inferType(arg) {
  const plain = arg.replace(/^['"`]|['"`]$/g, '').toLowerCase();
  if (/saved|copied|downloaded|great choice|reset!|baseline|✅|formatted plan copied/.test(plain)) return 'success';
  if (/failed|could not|not found|issue|invalid|error|creation failed/.test(plain)) return 'error';
  if (/please|generate|enter|first|not ready|refresh|no |wait|write your|check fun|type a|match your/.test(plain)) return 'warning';
  return 'info';
}

function findAlertCalls(code) {
  const results = [];
  let i = 0;
  while (i < code.length) {
    const idx = code.indexOf('alert(', i);
    if (idx === -1) break;
    if (idx > 0 && /\w/.test(code[idx - 1])) {
      i = idx + 5;
      continue;
    }

    let depth = 1;
    let j = idx + 6;
    let inString = null;
    let escape = false;
    while (j < code.length && depth > 0) {
      const c = code[j];
      if (inString) {
        if (escape) escape = false;
        else if (c === '\\') escape = true;
        else if (c === inString) inString = null;
      } else {
        if (c === "'" || c === '"' || c === '`') inString = c;
        else if (c === '(') depth++;
        else if (c === ')') depth--;
      }
      j++;
    }
    const arg = code.slice(idx + 6, j - 1).trim();
    results.push({ start: idx, end: j, arg });
    i = j;
  }
  return results;
}

function buildReplacement(code, start, end, arg) {
  const trimmed = arg.trim();

  if (SAVE_NOT_READY.has(trimmed)) {
    return 'window.saveNotReady()';
  }

  // Clipboard fallback — show content in toast
  if (trimmed === 'text') {
    return "window.notifyUser(text, 'info', 6000)";
  }

  const before = code.slice(Math.max(0, start - 30), start);
  const isReturn = /\breturn\s*$/.test(before);
  const type = inferType(trimmed);
  const duration = type === 'error' ? 5000 : 3200;
  const call = `window.notifyUser(${arg}, '${type}', ${duration})`;

  if (isReturn) {
    return `{ ${call}; return; }`;
  }
  return call;
}

function migrateFile(relPath) {
  const full = path.join(ROOT, relPath);
  let code = fs.readFileSync(full, 'utf8');
  const calls = findAlertCalls(code);
  if (!calls.length) {
    console.log(`  ${relPath}: 0 alerts`);
    return 0;
  }

  let out = '';
  let last = 0;
  for (const c of calls) {
    out += code.slice(last, c.start);
    out += buildReplacement(code, c.start, c.end, c.arg);
    last = c.end;
  }
  out += code.slice(last);
  fs.writeFileSync(full, out, 'utf8');
  console.log(`  ${relPath}: ${calls.length} alerts migrated`);
  return calls.length;
}

let total = 0;
console.log('Migrating alert() → toast helpers...\n');
for (const f of FILES) {
  total += migrateFile(f);
}
console.log(`\nDone — ${total} alert() calls migrated.`);