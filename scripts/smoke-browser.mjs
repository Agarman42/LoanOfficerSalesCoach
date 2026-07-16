#!/usr/bin/env node
/**
 * Optional browser smoke (Playwright).
 * Install once: npm i -D playwright && npx playwright install chromium
 * Run: npm run smoke:browser
 *
 * If Playwright is not installed, exits 0 with a skip message
 * so CI without browsers still passes npm test.
 */
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { extname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { pathToFileURL } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(__dirname, '..');

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch {
    return null;
  }
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function startStaticServer() {
  return new Promise((resolveServer) => {
    const server = createServer((req, res) => {
      let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      if (urlPath === '/') urlPath = '/index.html';
      const filePath = join(root, urlPath.replace(/^\//, ''));
      if (!filePath.startsWith(root) || !existsSync(filePath) || statSync(filePath).isDirectory()) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const ext = extname(filePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(readFileSync(filePath));
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolveServer({ server, port });
    });
  });
}

async function main() {
  const pw = await loadPlaywright();
  if (!pw) {
    console.log('Browser smoke SKIPPED (playwright not installed). Run: npm i -D playwright && npx playwright install chromium');
    process.exit(0);
  }

  const { server, port } = await startStaticServer();
  const base = `http://127.0.0.1:${port}`;
  let browser;
  try {
    browser = await pw.chromium.launch({ headless: true });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (err) => errors.push(String(err)));

    await page.goto(`${base}/index.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Core shell
    await page.waitForSelector('#sidebar', { timeout: 10000 });
    await page.waitForSelector('#generate-bio-btn, #ai-chat', { timeout: 10000 });

    // Navigate a few tools via hash + showSection
    for (const id of ['planning', 'bio-creator', 'weekly-win-plan', 'blog', 'sales-script']) {
      await page.evaluate((sectionId) => {
        if (typeof window.showSection === 'function') window.showSection(sectionId);
      }, id);
      await page.waitForTimeout(200);
      const visible = await page.evaluate((sectionId) => {
        const el = document.getElementById(sectionId);
        return el && !el.classList.contains('hidden');
      }, id);
      if (!visible) throw new Error(`Section ${id} not visible after showSection`);
    }

    // plan-output exists inside planning
    const planOk = await page.evaluate(() => {
      const planning = document.getElementById('planning');
      const out = document.getElementById('plan-output');
      return !!(planning && out && planning.contains(out));
    });
    if (!planOk) throw new Error('#plan-output missing inside #planning');

    // Empty states present
    for (const id of ['blog-empty-state', 'script-empty-state', 'social-empty-state']) {
      const exists = await page.$(`#${id}`);
      if (!exists) throw new Error(`Missing #${id}`);
    }

    // Checklist or profile nudge slot exists
    const coachSlot = await page.$('#global-profile-nudge');
    if (!coachSlot) throw new Error('Missing #global-profile-nudge');

    if (errors.length) {
      console.warn('Page errors (non-fatal for smoke):', errors.slice(0, 3));
    }

    console.log('Browser smoke PASSED');
    console.log(`  Served from ${base}`);
    console.log('  Navigated planning, bio-creator, weekly-win-plan, blog, sales-script');
    process.exitCode = 0;
  } catch (e) {
    console.error('Browser smoke FAILED:', e.message || e);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

main();
