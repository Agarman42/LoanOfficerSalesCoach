/**
 * Pass 3 persist-wrap proof for newsletter color bundles.
 * Run: node js/features/newsletter-color-bundles.persist-wrap.test.js
 *
 * collectProfileFromForm / persistProfile are IIFE-private. The real gate is
 * wrapCollectPersistAgainstEmptySelect intercepting localStorage.setItem.
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

function loadBundles(selectEl) {
  const Storage = makeStorage();
  const localStorage = new Storage();
  const elements = Object.create(null);
  const document = {
    readyState: 'complete',
    getElementById(id) {
      return Object.prototype.hasOwnProperty.call(elements, id) ? elements[id] : null;
    },
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
  if (selectEl) elements['profile-newsletter-color-bundle'] = selectEl;
  const wrap = ctx.window.NlColorBundles
    && ctx.window.NlColorBundles.wrapCollectPersistAgainstEmptySelect;
  if (typeof wrap === 'function') wrap();
  return { ctx, localStorage, window: ctx.window };
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

// Required: empty select + saved gold-luxury + setItem coastal-teal => still gold-luxury
{
  const { localStorage, window } = loadBundles(emptySelect());
  assert(typeof window.NlColorBundles.wrapCollectPersistAgainstEmptySelect === 'function',
    'wrapCollectPersistAgainstEmptySelect is exported on NlColorBundles');
  assert(window._nlBundlePersistWrapped === true, '_nlBundlePersistWrapped flag is set');
  localStorage.setItem('userProfile', JSON.stringify({ newsletterColorBundle: 'gold-luxury' }));
  localStorage.setItem('userProfile', JSON.stringify({ newsletterColorBundle: 'coastal-teal' }));
  const saved = JSON.parse(localStorage.getItem('userProfile'));
  assert(saved.newsletterColorBundle === 'gold-luxury',
    'empty select setItem keeps gold-luxury (does not write coastal-teal)');
}

// Required: select has options, real change to classic-navy is kept
{
  const { localStorage } = loadBundles(filledSelect('classic-navy'));
  localStorage.setItem('userProfile', JSON.stringify({ newsletterColorBundle: 'gold-luxury' }));
  localStorage.setItem('userProfile', JSON.stringify({ newsletterColorBundle: 'classic-navy' }));
  const saved = JSON.parse(localStorage.getItem('userProfile'));
  assert(saved.newsletterColorBundle === 'classic-navy',
    'filled select keeps a real change to classic-navy');
}

// Extra: missing select same restore
{
  const { localStorage } = loadBundles(null);
  localStorage.setItem('userProfile', JSON.stringify({ newsletterColorBundle: 'gold-luxury' }));
  localStorage.setItem('userProfile', JSON.stringify({ newsletterColorBundle: 'coastal-teal' }));
  const saved = JSON.parse(localStorage.getItem('userProfile'));
  assert(saved.newsletterColorBundle === 'gold-luxury',
    'missing select setItem keeps gold-luxury');
}

// Extra: nothing saved, coastal-teal is OK
{
  const { localStorage } = loadBundles(emptySelect());
  localStorage.setItem('userProfile', JSON.stringify({ newsletterColorBundle: 'coastal-teal' }));
  const saved = JSON.parse(localStorage.getItem('userProfile'));
  assert(saved.newsletterColorBundle === 'coastal-teal',
    'no prior save may persist coastal-teal');
}

if (failed) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log('\nAll persist-wrap tests passed.');
process.exit(0);
