/**
 * Persist-guard smoke for newsletter color bundles (pass 3).
 * Run: node js/features/newsletter-color-bundles.test.js
 *
 * collectProfileFromForm / persistProfile are IIFE-closed in user-profile.js.
 * This checks wrapCollectPersistNewsletterColorBundle: missing/empty select
 * leaves a saved Gold Luxury / Classic Navy untouched.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const src = fs.readFileSync(path.join(__dirname, 'newsletter-color-bundles.js'), 'utf8');

function makeStorage() {
  function Storage() { this._data = Object.create(null); }
  Storage.prototype.getItem = function (k) {
    return Object.prototype.hasOwnProperty.call(this._data, k) ? this._data[k] : null;
  };
  Storage.prototype.setItem = function (k, v) { this._data[k] = String(v); };
  Storage.prototype.removeItem = function (k) { delete this._data[k]; };
  return Storage;
}

function loadBundles(opts) {
  const Storage = makeStorage();
  const localStorage = new Storage();
  const elements = Object.create(null);
  const document = {
    readyState: 'complete',
    getElementById(id) { return Object.prototype.hasOwnProperty.call(elements, id) ? elements[id] : null; },
    addEventListener() {},
    createElement() {
      return { style: {}, setAttribute() {}, appendChild() {}, className: '', dataset: {} };
    }
  };
  const window = {
    document,
    localStorage,
    addEventListener() {},
    dispatchEvent() { return true; }
  };
  const ctx = {
    window,
    document,
    localStorage,
    Storage,
    setInterval,
    clearInterval,
    setTimeout,
    clearTimeout,
    console
  };
  ctx.global = ctx;
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  if (ctx.window.NlColorBundles && ctx.window.NlColorBundles.stopCollectPersistWrapRetry) {
    ctx.window.NlColorBundles.stopCollectPersistWrapRetry();
  }
  // Attach the Profile select after init so picker paint does not mutate the fixture.
  Object.assign(elements, opts.elements || {});
  return { ctx, elements, localStorage, window: ctx.window };
}

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('FAIL:', msg);
  } else {
    console.log('OK:', msg);
  }
}

function emptySelect() {
  return {
    id: 'profile-newsletter-color-bundle',
    options: { length: 0 },
    value: '',
    dataset: {},
    appendChild() {},
    addEventListener() {},
    closest() { return null; },
    dispatchEvent() { return true; }
  };
}
function filledSelect(value) {
  const opts = [
    { value: 'coastal-teal' }, { value: 'classic-navy' }, { value: 'gold-luxury' },
    { value: 'warm-agent' }, { value: 'forest-estate' }, { value: 'royal-burgundy' },
    { value: 'slate-modern' }, { value: 'berry-bold' }
  ];
  opts.length = 8;
  return {
    id: 'profile-newsletter-color-bundle',
    options: opts,
    value: value,
    dataset: {},
    appendChild() {},
    addEventListener() {},
    closest() { return null; },
    dispatchEvent() { return true; }
  };
}

// 1) missing select + saved Gold Luxury -> restore gold-luxury
{
  const { window, localStorage } = loadBundles({ elements: {} });
  localStorage.setItem('userProfile', JSON.stringify({ newsletterColorBundle: 'gold-luxury' }));
  const collected = { newsletterColorBundle: 'coastal-teal' };
  const out = window.NlColorBundles.restoreSavedNewsletterColorBundle(collected);
  assert(out.newsletterColorBundle === 'gold-luxury', 'missing select restores saved gold-luxury (not coastal-teal)');
}

// 2) empty options + saved Classic Navy -> restore classic-navy
{
  const { window, localStorage } = loadBundles({
    elements: { 'profile-newsletter-color-bundle': emptySelect() }
  });
  localStorage.setItem('userProfile', JSON.stringify({ newsletterColorBundle: 'classic-navy' }));
  const collected = { newsletterColorBundle: 'coastal-teal' };
  const out = window.NlColorBundles.restoreSavedNewsletterColorBundle(collected);
  assert(out.newsletterColorBundle === 'classic-navy', 'zero-option select restores saved classic-navy');
}

// 3) select has options + real value -> use that value
{
  const { window, localStorage } = loadBundles({
    elements: { 'profile-newsletter-color-bundle': filledSelect('gold-luxury') }
  });
  localStorage.setItem('userProfile', JSON.stringify({ newsletterColorBundle: 'classic-navy' }));
  const collected = { newsletterColorBundle: 'gold-luxury' };
  const out = window.NlColorBundles.restoreSavedNewsletterColorBundle(collected);
  assert(out.newsletterColorBundle === 'gold-luxury', 'filled select keeps the chosen gold-luxury');
}

// 4) missing select + no saved value -> coastal-teal OK
{
  const { window } = loadBundles({ elements: {} });
  const collected = { newsletterColorBundle: 'coastal-teal' };
  const out = window.NlColorBundles.restoreSavedNewsletterColorBundle(collected);
  assert(out.newsletterColorBundle === 'coastal-teal', 'no saved value may stay coastal-teal');
}

// 5) storage wrap: persist while select empty does not clobber Gold Luxury
{
  const { localStorage, window } = loadBundles({
    elements: { 'profile-newsletter-color-bundle': emptySelect() }
  });
  localStorage.setItem('userProfile', JSON.stringify({ name: 'Ada', newsletterColorBundle: 'gold-luxury' }));
  // Simulate collectProfileFromForm defaulting empty select to coastal-teal, then persist
  localStorage.setItem('userProfile', JSON.stringify({ name: 'Ada', newsletterColorBundle: 'coastal-teal' }));
  const saved = JSON.parse(localStorage.getItem('userProfile'));
  assert(saved.newsletterColorBundle === 'gold-luxury', 'setItem wrap keeps gold-luxury when select is optionless');
  assert(typeof window.NlColorBundles.wrapCollectPersistNewsletterColorBundle === 'function', 'wrap function is exported');
}

// 6) storage wrap: missing select same restore
{
  const { localStorage } = loadBundles({ elements: {} });
  localStorage.setItem('userProfile', JSON.stringify({ newsletterColorBundle: 'classic-navy' }));
  localStorage.setItem('userProfile', JSON.stringify({ newsletterColorBundle: 'coastal-teal' }));
  const saved = JSON.parse(localStorage.getItem('userProfile'));
  assert(saved.newsletterColorBundle === 'classic-navy', 'setItem wrap keeps classic-navy when select is missing');
}

// 7) storage wrap: filled select writes the new value
{
  const { localStorage } = loadBundles({
    elements: { 'profile-newsletter-color-bundle': filledSelect('berry-bold') }
  });
  localStorage.setItem('userProfile', JSON.stringify({ newsletterColorBundle: 'gold-luxury' }));
  localStorage.setItem('userProfile', JSON.stringify({ newsletterColorBundle: 'berry-bold' }));
  const saved = JSON.parse(localStorage.getItem('userProfile'));
  assert(saved.newsletterColorBundle === 'berry-bold', 'filled select persist uses the real selected value');
}

if (failed) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log('\nAll newsletter-color-bundles persist-guard tests passed.');
process.exit(0);
