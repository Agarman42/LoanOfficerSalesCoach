/**
 * Public LO partner cards — token → public card for Realtor chrome.
 * File-backed JSON for local/dev; on free Render disk may reset on redeploy
 * (migrate to DB when partners rely on it in production).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STORE_PATH =
  process.env.PARTNER_CARDS_PATH ||
  path.join(__dirname, 'data', 'partner-cards.json');

function ensureDir() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readStore() {
  try {
    ensureDir();
    if (!fs.existsSync(STORE_PATH)) return { cards: {} };
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw || '{}');
    if (!parsed || typeof parsed !== 'object') return { cards: {} };
    if (!parsed.cards || typeof parsed.cards !== 'object') return { cards: {} };
    return parsed;
  } catch (e) {
    console.warn('[partner-store] read failed', e.message);
    return { cards: {} };
  }
}

function writeStore(store) {
  ensureDir();
  const tmp = STORE_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(tmp, STORE_PATH);
}

function newToken() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Normalize and validate a public LO card from publish body.
 * Returns { ok, card, error }.
 */
function sanitizePublicCard(input) {
  const src = input && typeof input === 'object' ? input : {};
  const name = String(src.name || '').trim().slice(0, 120);
  const phone = String(src.phone || '').trim().slice(0, 40);
  const email = String(src.email || '').trim().slice(0, 120);
  const nmls = String(src.nmls || '').trim().slice(0, 40);
  const headshotUrl = String(src.headshotUrl || src.headshot || '').trim().slice(0, 500);
  const title = String(src.title || 'Your Ruoff Loan Officer').trim().slice(0, 80);
  const location = String(src.location || src.market || '').trim().slice(0, 120);
  const company = String(src.company || 'Ruoff Mortgage').trim().slice(0, 80);

  if (!name) {
    return { ok: false, error: 'Name is required for a partner card.' };
  }
  if (!phone && !email) {
    return { ok: false, error: 'Add a phone or email so partners can reach you.' };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Email does not look valid.' };
  }
  if (headshotUrl && !/^https?:\/\//i.test(headshotUrl)) {
    return { ok: false, error: 'Headshot must be an http(s) URL.' };
  }

  return {
    ok: true,
    card: {
      name,
      phone,
      email,
      nmls,
      headshotUrl,
      title,
      location,
      company
    }
  };
}

function publicView(record) {
  if (!record || !record.card) return null;
  return {
    name: record.card.name || '',
    phone: record.card.phone || '',
    email: record.card.email || '',
    nmls: record.card.nmls || '',
    headshotUrl: record.card.headshotUrl || '',
    title: record.card.title || '',
    location: record.card.location || '',
    company: record.card.company || '',
    updatedAt: record.updatedAt || null
  };
}

function publishCard(body) {
  const cleaned = sanitizePublicCard(body && body.card != null ? body.card : body);
  if (!cleaned.ok) return { ok: false, status: 400, error: cleaned.error };

  const store = readStore();
  let token = String((body && body.token) || '').trim();
  if (token && !/^[a-f0-9]{16,64}$/i.test(token)) {
    return { ok: false, status: 400, error: 'Invalid token format.' };
  }

  const now = new Date().toISOString();
  if (token && store.cards[token]) {
    store.cards[token] = {
      card: cleaned.card,
      createdAt: store.cards[token].createdAt || now,
      updatedAt: now
    };
  } else {
    token = newToken();
    store.cards[token] = {
      card: cleaned.card,
      createdAt: now,
      updatedAt: now
    };
  }

  try {
    writeStore(store);
  } catch (e) {
    console.error('[partner-store] write failed', e.message);
    return { ok: false, status: 500, error: 'Could not save partner card on server.' };
  }

  return {
    ok: true,
    token,
    card: publicView(store.cards[token]),
    updatedAt: now
  };
}

function getCard(token) {
  const t = String(token || '').trim();
  if (!t || !/^[a-f0-9]{16,64}$/i.test(t)) {
    return { ok: false, status: 400, error: 'Invalid token.' };
  }
  const store = readStore();
  const record = store.cards[t];
  if (!record) {
    return { ok: false, status: 404, error: 'Partner card not found.' };
  }
  return { ok: true, token: t, card: publicView(record) };
}

function buildShareUrl(token) {
  const base = String(
    process.env.REALTOR_APP_URL ||
      process.env.PARTNER_REALTOR_URL ||
      'http://localhost:3001'
  )
    .trim()
    .replace(/\/+$/, '');
  return `${base}/?lo=${encodeURIComponent(token)}`;
}

function mountPartnerRoutes(app) {
  app.post('/api/partner/publish', (req, res) => {
    const result = publishCard(req.body || {});
    if (!result.ok) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    return res.status(200).json({
      ok: true,
      token: result.token,
      shareUrl: buildShareUrl(result.token),
      card: result.card,
      updatedAt: result.updatedAt
    });
  });

  app.get('/api/partner/:token', (req, res) => {
    const result = getCard(req.params.token);
    if (!result.ok) {
      return res.status(result.status || 404).json({ error: result.error });
    }
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.status(200).json({
      ok: true,
      token: result.token,
      card: result.card
    });
  });

  console.info('[partner-store] routes mounted — store:', STORE_PATH);
}

module.exports = {
  mountPartnerRoutes,
  publishCard,
  getCard,
  buildShareUrl,
  sanitizePublicCard
};
