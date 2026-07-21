#!/usr/bin/env node
/**
 * One-shot asset sync — delegates to CommonJS boot sync (copy + LO Grok patch).
 * Run: node smart-savings/_sync_assets.mjs
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);
const { sync } = require('./_boot_sync.cjs');
const result = sync();
process.exit(result.ok ? 0 : 1);
