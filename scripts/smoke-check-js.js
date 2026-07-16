#!/usr/bin/env node
/**
 * Syntax-check all LO app JS modules (no browser required).
 * Usage: node scripts/smoke-check-js.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const dirs = [path.join(root, 'js'), path.join(root, 'js/features'), path.join(root, 'scripts')];

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === 'data') continue;
      // Skip nested app trees
      walk(full, acc);
    } else if (name.endsWith('.js') || name.endsWith('.mjs')) {
      acc.push(full);
    }
  }
  return acc;
}

const files = [];
dirs.forEach((d) => walk(d, files));
// Always include proxy
const proxy = path.join(root, 'proxy.js');
if (fs.existsSync(proxy)) files.push(proxy);

const unique = [...new Set(files)].filter((f) => !f.includes(`${path.sep}data${path.sep}`));
let failed = 0;

unique.forEach((file) => {
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  } catch (e) {
    failed += 1;
    console.error('SYNTAX FAIL:', path.relative(root, file));
    const err = (e.stderr && e.stderr.toString()) || e.message;
    console.error(err.slice(0, 400));
  }
});

if (failed) {
  console.error(`\nJS smoke FAILED (${failed}/${unique.length} files)`);
  process.exit(1);
}

console.log(`JS smoke PASSED (${unique.length} files syntax-ok)`);
process.exit(0);
