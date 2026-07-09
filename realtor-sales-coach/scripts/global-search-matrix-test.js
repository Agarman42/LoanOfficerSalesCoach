#!/usr/bin/env node
/**
 * Run: node scripts/global-search-matrix-test.js
 * Validates GLOBAL_SEARCH_TEST_QUERIES resolve to at least one result.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');

function loadConfig(isRealtor) {
  const sharedSynonyms = {
    social: ['instagram', 'facebook', 'linkedin', 'post', 'content', 'reel', 'story'],
    nurture: ['database', 'nurture', 'cadence', 'touch', 'sphere', 'crm'],
    newsletter: ['email', 'newsletter', 'market update', 'monthly'],
    script: ['call', 'phone', 'voicemail', 'conversation', 'sales script'],
    vault: ['gift', 'pop-by', 'popby', 'touch', 'value'],
    plan: ['weekly', 'win plan', 'business plan', '2026', 'goals'],
    coach: ['ai', 'chat', 'assistant', 'grok'],
    saved: ['bookmark', 'library', 'favorites', 'saved'],
    event: ['client appreciation', 'open house party', 'pop-in'],
    referral: ['partner', 'realtor', 'agent', 'sphere'],
    objection: ['partner objection', 'referral objection', 'pushback', 'rebuttal'],
    rates: ['rate', 'interest rate', 'too high', 'high rates'],
    blog: ['article', 'seo', 'content creator'],
    onboarding: ['onboard', 'new partner', 'new realtor', '60 day', '30 day'],
  };
  const loSynonyms = {
    ...sharedSynonyms,
    refi: ['refinance', 'refi', 'cash out', 'rate and term'],
    equity: ['opportunity', 'scanner', 'heloc', 'equity', 'pmi'],
    uw: ['underwriting', 'fha', 'va', 'conventional', 'guidelines', 'du', 'lp'],
    loan: ['mortgage', 'process', 'closing', 'pipeline'],
  };
  const realtorSynonyms = {
    ...sharedSynonyms,
    listing: ['description', 'mls', 'property', 'copy'],
    openhouse: ['open house', 'oh', 'showing'],
    consult: ['buyer', 'seller', 'consultation', 'listing appointment'],
    transaction: ['process', 'closing', 'contract', 'inspection'],
  };
  return { synonyms: isRealtor ? realtorSynonyms : loSynonyms };
}

function runInSandbox(files, extra = {}) {
  const sandbox = {
    window: {},
    document: { title: extra.title || 'Ultimate Loan Officer Sales Coach' },
  };
  sandbox.window = sandbox;
  files.forEach((file) => {
    vm.runInNewContext(fs.readFileSync(path.join(root, file), 'utf8'), sandbox);
  });
  return sandbox.window;
}

function loadIndexes(isRealtor) {
  const title = isRealtor ? 'Ultimate Agent Sales Coach' : 'Ultimate Loan Officer Sales Coach';
  const files = ['js/features/global-search-deep-index.js'];
  if (!isRealtor) files.unshift('js/data/lo-fact-vault.js');

  const win = runInSandbox(files, { title });

  const booksJs = fs.readFileSync(path.join(root, 'js/features/legacy-helpers.js'), 'utf8');
  const bookCount = (booksJs.match(/id: "book-/g) || []).length;
  win.getBookSearchEntries = function () {
    const entries = [];
    const re = /id: "(book-[^"]+)", title: "([^"]+)", author: "([^"]+)", category: "([^"]+)"[^}]+whyUseful: "([^"]+)"[^}]+keyTakeaway: "([^"]+)"/g;
    let m;
    while ((m = re.exec(booksJs))) {
      entries.push({
        id: m[1], title: m[2], author: m[3], category: m[4],
        keywords: [m[3], m[4], m[5], m[6]],
      });
    }
    return entries;
  };

  const mindsetJs = fs.readFileSync(path.join(root, 'js/features/mindset-lab.js'), 'utf8');
  win.getMindsetSearchEntries = function () {
    const items = [];
    const re = /\{\s*id:\s*"([^"]+)"\s*,\s*category:\s*"([^"]+)"\s*,\s*content:\s*"([^"]+)"\s*,\s*source:\s*"([^"]+)"/g;
    let m;
    while ((m = re.exec(mindsetJs))) {
      items.push({ id: m[1], category: m[2], content: m[3], source: m[4], action: '' });
    }
    return items;
  };

  win.SOCIAL_PILLAR_CONTENT = {
    Personal: { title: 'Personal Content Pillar', badge: '50% of your feed', examples: [{ title: 'Sunday Reset Routine' }], proTips: [] },
    Local: { title: 'Local & Community Pillar', badge: '10-15%', examples: [], proTips: [] },
  };

  vm.runInNewContext(fs.readFileSync(path.join(root, 'js/features/global-search-dynamic-index.js'), 'utf8'), win);

  const deep = win.buildGlobalSearchDeepIndex();
  const dynamic = win.buildGlobalSearchDynamicIndex();
  return { pool: [...deep, ...dynamic], tests: win.GLOBAL_SEARCH_TEST_QUERIES };
}

const salesJs = fs.readFileSync(path.join(root, 'js/features/sales-scripts.js'), 'utf8');
const scriptEntries = [];
const labelRe = /\{\s*value:\s*"([^"]+)"\s*,\s*label:\s*"([^"]+)"/g;
let m;
while ((m = labelRe.exec(salesJs))) {
  scriptEntries.push({
    type: 'script', id: m[2], title: m[2], keywords: [], _baseScore: 13, group: 'Script Scenarios',
  });
}

const loTools = [
  { type: 'tool', id: 'tool-newsletter', title: 'Newsletter Generator', sectionId: 'newsletter-generator', keywords: ['newsletter generator'], _baseScore: 8 },
  { type: 'tool', id: 'tool-books', title: 'Book Vault', sectionId: 'books', keywords: ['book vault'], _baseScore: 8 },
];
const realtorTools = [
  ...loTools,
  { type: 'tool', id: 'tool-listing', title: 'Listing Description Generator', sectionId: 'listing-description', keywords: ['listing description'], _baseScore: 8 },
  { type: 'tool', id: 'tool-oh', title: 'Open House Script & Strategy', sectionId: 'open-house', keywords: ['open house'], _baseScore: 8 },
];

function haystack(entry) {
  return [entry.title, entry.subtitle, entry.sectionId, ...(entry.keywords || [])].filter(Boolean).join(' ').toLowerCase();
}
function expandTokens(query, config) {
  const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const expanded = new Set(tokens);
  tokens.forEach((token) => {
    if (config.synonyms[token]) {
      expanded.add(token);
      config.synonyms[token].forEach((s) => expanded.add(s.toLowerCase()));
    }
  });
  return Array.from(expanded);
}
function tokenMatchesHay(hay, token, config) {
  if (!token) return false;
  if (hay.includes(token)) return true;
  const list = config.synonyms[token];
  return list ? list.some((s) => hay.includes(s.toLowerCase())) : false;
}
function parseSavedQuery(raw) {
  const q = (raw || '').trim();
  if (/^saved$/i.test(q)) return '';
  const match = q.match(/^saved\s+(.+)$/i);
  return match ? match[1].trim() : null;
}
const STOPWORDS = new Set(['a', 'an', 'and', 'as', 'at', 'be', 'by', 'for', 'in', 'is', 'it', 'of', 'on', 'or', 'the', 'to', 'with']);
const INTENT_TYPES = new Set(['guide', 'script', 'tool', 'action', 'fact', 'book', 'social']);

function scoreEntry(entry, tokens, rawQuery, config) {
  if (!tokens.length) return entry._baseScore || 1;
  const hay = haystack(entry);
  const title = (entry.title || '').toLowerCase();
  const q = rawQuery.toLowerCase().trim();
  const queryWords = q.split(/\s+/).filter(Boolean);
  if (queryWords.length > 1 && !queryWords.every((word) => tokenMatchesHay(hay, word, config))) return 0;
  if (queryWords.length === 1) {
    const word = queryWords[0];
    if (!tokens.some((token) => tokenMatchesHay(hay, token, config))) return 0;
    if (STOPWORDS.has(word)) return 0;
  }
  let score = 0;
  if (hay.includes(q)) score += 100;
  if (title === q) score += 120;
  else if (title.startsWith(q)) score += 90;
  else if (title.includes(q)) score += 70;
  tokens.forEach((token) => {
    if (title === token) score += 50;
    else if (title.startsWith(token)) score += 35;
    else if (title.includes(token)) score += 25;
    else if (hay.includes(token)) score += 12;
  });
  (entry.keywords || []).forEach((kw) => {
    const k = String(kw).toLowerCase();
    if (k === q || k.includes(q) || q.includes(k)) score += 45;
  });
  if ((entry.type === 'guide' || entry.type === 'script') && queryWords.length > 1) score += 18;
  if (queryWords.length === 1) {
    const word = queryWords[0];
    if (INTENT_TYPES.has(entry.type)) score += 22;
    if (entry.type === 'script' && (title === word || title.includes(word))) score += 40;
    if (entry.type === 'mindset' && !title.includes(word)) score -= 28;
    if (entry.type === 'book' && !title.includes(word)) score -= 12;
  }
  score += entry._baseScore || 0;
  return score;
}
function search(pool, query, config) {
  const raw = query.trim();
  const savedInner = parseSavedQuery(raw);
  const searchRaw = savedInner !== null ? (savedInner || raw) : raw;
  const searchTokens = expandTokens(searchRaw, config);
  const results = pool
    .map((e) => ({ entry: e, score: scoreEntry(e, searchTokens, savedInner !== null ? raw : searchRaw, config) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
  if (savedInner !== null && results.length) {
    return [{ entry: { title: 'My Saved Items Library', type: 'action' } }, results[0]];
  }
  return results.slice(0, 1);
}

let misses = 0;
for (const app of ['lo', 'realtor']) {
  const config = loadConfig(app === 'realtor');
  const { pool: indexed, tests } = loadIndexes(app === 'realtor');
  const pool = [...indexed, ...scriptEntries, ...(app === 'realtor' ? realtorTools : loTools)];
  console.log(`\n${app.toUpperCase()} (${tests[app].length} queries, ${pool.length} indexed items)`);
  for (const q of tests[app]) {
    const top = search(pool, q, config)[0];
    if (!top) {
      misses += 1;
      console.log(`  MISS  ${q}`);
    } else {
      console.log(`  OK    ${q} → ${top.entry.title}`);
    }
  }
}

if (misses) {
  console.error(`\n${misses} queries failed.`);
  process.exit(1);
}
console.log('\nAll matrix queries passed.');