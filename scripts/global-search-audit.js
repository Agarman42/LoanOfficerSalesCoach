#!/usr/bin/env node
/**
 * Broader search quality audit — single-word queries, noise checks, top-3 review.
 * Run: node scripts/global-search-audit.js
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
  const sandbox = { window: {}, document: { title: extra.title || 'Ultimate Loan Officer Sales Coach' } };
  sandbox.window = sandbox;
  files.forEach((file) => {
    vm.runInNewContext(fs.readFileSync(path.join(root, file), 'utf8'), sandbox);
  });
  return sandbox.window;
}

function loadPool(isRealtor) {
  const title = isRealtor ? 'Ultimate Agent Sales Coach' : 'Ultimate Loan Officer Sales Coach';
  const files = ['js/features/global-search-deep-index.js'];
  if (!isRealtor) files.unshift('js/data/lo-fact-vault.js');
  const win = runInSandbox(files, { title });

  const booksJs = fs.readFileSync(path.join(root, 'js/features/legacy-helpers.js'), 'utf8');
  win.getBookSearchEntries = function () {
    const entries = [];
    const re = /id: "(book-[^"]+)", title: "([^"]+)", author: "([^"]+)", category: "([^"]+)"[^}]+whyUseful: "([^"]+)"[^}]+keyTakeaway: "([^"]+)"/g;
    let m;
    while ((m = re.exec(booksJs))) {
      entries.push({ id: m[1], title: m[2], author: m[3], category: m[4], keywords: [m[3], m[4], m[5], m[6]] });
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
    Personal: { title: 'Personal Content Pillar', badge: '50%', examples: [{ title: 'Sunday Reset' }], proTips: [] },
    Local: { title: 'Local & Community Pillar', badge: '10%', examples: [], proTips: [] },
  };

  vm.runInNewContext(fs.readFileSync(path.join(root, 'js/features/global-search-dynamic-index.js'), 'utf8'), win);

  const salesJs = fs.readFileSync(path.join(root, 'js/features/sales-scripts.js'), 'utf8');
  const scriptEntries = [];
  const labelRe = /\{\s*value:\s*"([^"]+)"\s*,\s*label:\s*"([^"]+)"/g;
  let m;
  while ((m = labelRe.exec(salesJs))) {
    scriptEntries.push({ type: 'script', id: m[2], title: m[2], keywords: [], _baseScore: 13, group: 'Script Scenarios' });
  }

  const loTools = [
    { type: 'tool', id: 'tool-newsletter', title: 'Newsletter Generator', sectionId: 'newsletter-generator', keywords: ['newsletter'], _baseScore: 8 },
    { type: 'tool', id: 'tool-books', title: 'Book Vault', sectionId: 'books', keywords: ['books'], _baseScore: 8 },
    { type: 'tool', id: 'tool-underwriting', title: 'Underwriting Search', sectionId: 'underwriting-search', keywords: ['underwriting'], _baseScore: 8 },
    { type: 'tool', id: 'tool-equity', title: 'Equity Scanner', sectionId: 'equity-scanner', keywords: ['equity'], _baseScore: 8 },
    { type: 'tool', id: 'tool-coach', title: 'AI Coach', sectionId: 'ai-chat', keywords: ['coach', 'ai'], _baseScore: 8 },
    { type: 'tool', id: 'tool-event', title: 'Event Planning', sectionId: 'eventplanning', keywords: ['event'], _baseScore: 8 },
    { type: 'tool', id: 'tool-referrals', title: 'Referral Partners', sectionId: 'referrals', keywords: ['referral'], _baseScore: 8 },
    { type: 'tool', id: 'tool-database', title: 'Database Nurture', sectionId: 'database', keywords: ['database', 'nurture'], _baseScore: 8 },
    { type: 'tool', id: 'tool-social', title: 'Social Content', sectionId: 'social', keywords: ['social'], _baseScore: 8 },
    { type: 'tool', id: 'tool-scripts', title: 'Sales Script Generator', sectionId: 'sales-script', keywords: ['script'], _baseScore: 8 },
    { type: 'tool', id: 'tool-vault', title: 'Value Vault', sectionId: 'value-vault', keywords: ['vault'], _baseScore: 8 },
    { type: 'tool', id: 'tool-process', title: 'Loan Process', sectionId: 'process', keywords: ['process'], _baseScore: 8 },
  ];
  const realtorTools = [
    ...loTools.filter((t) => !['tool-underwriting', 'tool-equity', 'tool-process'].includes(t.id)),
    { type: 'tool', id: 'tool-listing', title: 'Listing Description Generator', sectionId: 'listing-description', keywords: ['listing'], _baseScore: 8 },
    { type: 'tool', id: 'tool-oh', title: 'Open House Script & Strategy', sectionId: 'open-house', keywords: ['open house'], _baseScore: 8 },
    { type: 'tool', id: 'tool-consult', title: 'Buyer/Seller Consultation Kit', sectionId: 'consultation', keywords: ['consultation'], _baseScore: 8 },
  ];

  const quickActions = isRealtor
    ? [{ type: 'action', id: 'action-coach', title: 'AI Coach', keywords: ['ai', 'coach'], sectionId: 'ai-chat', _baseScore: 10 }]
    : [
        { type: 'action', id: 'action-coach', title: 'AI Coach', keywords: ['ai', 'coach'], sectionId: 'ai-chat', _baseScore: 10 },
        { type: 'action', id: 'action-uw', title: 'Underwriting Guideline Search', keywords: ['underwriting', 'uw', 'fha'], sectionId: 'underwriting-search', _baseScore: 10 },
      ];

  return [...win.buildGlobalSearchDeepIndex(), ...win.buildGlobalSearchDynamicIndex(), ...scriptEntries, ...(isRealtor ? realtorTools : loTools), ...quickActions];
}

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
const STOPWORDS = new Set(['a', 'an', 'and', 'as', 'at', 'be', 'by', 'for', 'in', 'is', 'it', 'of', 'on', 'or', 'the', 'to', 'with']);
const INTENT_TYPES = new Set(['guide', 'script', 'tool', 'action', 'fact', 'book', 'social']);

function isNoiseQuery(rawQuery) {
  const words = (rawQuery || '').toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!words.length) return false;
  return words.every((word) => word.length < 2 || STOPWORDS.has(word));
}

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
function searchTop(pool, query, config, n = 3) {
  const raw = query.trim();
  if (isNoiseQuery(raw)) return [];
  const tokens = expandTokens(raw, config);
  return pool
    .map((e) => ({ entry: e, score: scoreEntry(e, tokens, raw, config) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

const LO_SINGLE = ['fha', 'va', 'refi', 'equity', 'coach', 'event', 'nurture', 'referral', 'script', 'newsletter', 'vault', 'underwriting', 'rates', 'objection', 'onboarding', 'closing', 'partner'];
const REALTOR_SINGLE = ['listing', 'open house', 'consultation', 'event', 'referral', 'script', 'coach', 'nurture', 'objection', 'onboarding', 'closing', 'buyer', 'seller'];

const LO_EXPECTED = {
  fha: /FHA Underwriting/i,
  va: /VA Underwriting/i,
  refi: /Equity|refi|refinance/i,
  equity: /Equity/i,
  coach: /AI Coach/i,
  event: /Event|Post-Event|Client Appreciation/i,
  nurture: /Nurture|Scalable|Database/i,
  referral: /Referral|Partner|A\+ Partner/i,
  script: /Script/i,
  newsletter: /Newsletter/i,
  vault: /Value Vault|Pop-By/i,
  underwriting: /Underwriting/i,
  rates: /Rates are too high|rate news|equity\/rate/i,
  objection: /Objection/i,
  onboarding: /Onboarding|30 Days|60-Day/i,
  closing: /Closing|Post-Closing/i,
  partner: /Partner|Referral/i,
};

const REALTOR_EXPECTED = {
  listing: /Listing Description/i,
  'open house': /Open House/i,
  consultation: /Consultation/i,
  event: /Event|Appreciation/i,
  referral: /Referral|Partner|A\+ Partner/i,
  script: /Script/i,
  coach: /AI Coach/i,
  nurture: /Nurture|Scalable|Database/i,
  objection: /Objection/i,
  onboarding: /Onboarding|30 Days/i,
  closing: /Closing|Post-Closing/i,
  buyer: /Buyer/i,
  seller: /Seller|Consultation/i,
};

let issues = 0;

for (const app of ['lo', 'realtor']) {
  const isRealtor = app === 'realtor';
  const config = loadConfig(isRealtor);
  const pool = loadPool(isRealtor);
  const singles = isRealtor ? REALTOR_SINGLE : LO_SINGLE;
  const expected = isRealtor ? REALTOR_EXPECTED : LO_EXPECTED;

  console.log(`\n=== ${app.toUpperCase()} single-word audit (${pool.length} items) ===`);
  for (const q of singles) {
    const top = searchTop(pool, q, config, 3);
    if (!top.length) {
      issues++;
      console.log(`  MISS  "${q}" — no results`);
      continue;
    }
    const top1 = top[0].entry.title;
    const exp = expected[q];
    const ok = exp ? exp.test(top1) : true;
    const flag = ok ? 'OK   ' : 'WARN ';
    if (!ok) issues++;
    const more = top.slice(1).map((r) => r.entry.title).join(' | ');
    console.log(`  ${flag} "${q}" → ${top1}${more ? `  (also: ${more})` : ''}`);
  }
}

// Noise: single words that should NOT flood with unrelated hits
const NOISE = ['the', 'and', 'for', 'with'];
console.log('\n=== Noise check (should have 0 results) ===');
for (const q of NOISE) {
  for (const app of ['lo']) {
    const top = searchTop(loadPool(app === 'realtor'), q, loadConfig(app === 'realtor'), 1);
    if (top.length) {
      issues++;
      console.log(`  NOISE ${app} "${q}" → ${top[0].entry.title}`);
    }
  }
}
if (!issues) console.log('  (no noise hits)');

// Extra multi-word probes
const PROBES = {
  lo: [
    ['du findings', /underwriting|DU/i],
    ['pmi removal', /equity|pmi/i],
    ['birthday video', /birthday/i],
    ['weekly pipeline', /pipeline/i],
    ['cash out refi', /refi|equity/i],
    ['gift basket', /vault|gift|pop/i],
    ['voicemail script', /voicemail|script/i],
    ['market update email', /newsletter/i],
    ['tier a partner', /A\+|tier/i],
    ['life event divorce', /divorce/i],
  ],
  realtor: [
    ['showing script', /open house|script/i],
    ['mls copy', /listing/i],
    ['seller presentation', /consultation|seller/i],
    ['charity event', /charity|community/i],
    ['partner mastermind', /mastermind/i],
  ],
};

console.log('\n=== Multi-word probe audit ===');
for (const [app, probes] of Object.entries(PROBES)) {
  const pool = loadPool(app === 'realtor');
  const config = loadConfig(app === 'realtor');
  for (const [q, exp] of probes) {
    const top = searchTop(pool, q, config, 1);
    if (!top.length) {
      issues++;
      console.log(`  MISS  ${app} "${q}"`);
    } else if (!exp.test(top[0].entry.title)) {
      issues++;
      console.log(`  WARN  ${app} "${q}" → ${top[0].entry.title} (expected ${exp})`);
    } else {
      console.log(`  OK    ${app} "${q}" → ${top[0].entry.title}`);
    }
  }
}

console.log(`\n${issues ? issues + ' issue(s) found' : 'Audit clean — no issues'}`);
process.exit(issues ? 1 : 0);