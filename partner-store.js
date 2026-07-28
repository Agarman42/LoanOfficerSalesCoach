/**
 * Public LO partner cards — token → public card for Realtor chrome.
 *
 * DURABILITY (free, survives Render redeploys):
 *   Primary tokens are signed payloads (HMAC). The card lives *in the link*,
 *   so wiping the free disk does not lose partner cards. Cost: $0.
 *
 * OPTIONAL file store (data/partner-cards.json):
 *   Still written when possible for short hex tokens / local debugging.
 *   Not required for production durability.
 *
 * Env:
 *   PARTNER_CARD_SECRET — signing secret (set on Render LO service; any long random string)
 *   REALTOR_APP_URL     — e.g. https://your-realtor.onrender.com (share links)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STORE_PATH =
  process.env.PARTNER_CARDS_PATH ||
  path.join(__dirname, 'data', 'partner-cards.json');

function signingSecret() {
  const s =
    process.env.PARTNER_CARD_SECRET ||
    process.env.PARTNER_SHARE_SECRET ||
    process.env.XAI_API_KEY ||
    process.env.GROK_API_KEY ||
    'dev-only-partner-card-secret-change-me';
  return String(s);
}

function b64url(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function b64urlJson(obj) {
  return b64url(JSON.stringify(obj));
}

function fromB64url(str) {
  const s = String(str || '').replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Buffer.from(s + pad, 'base64').toString('utf8');
}

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

function newShortToken() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Normalize and validate a public LO card from publish body.
 * Returns { ok, card, error }.
 */
function sanitizePublicCard(input) {
  const src = input && typeof input === 'object' ? input : {};
  const name = String(src.name || '').trim().slice(0, 120);
  let phone = String(src.phone || '').trim().slice(0, 40);
  {
    let d = phone.replace(/\D/g, '');
    if (d.length === 11 && d.startsWith('1')) d = d.slice(1);
    if (d.length === 10) phone = `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  }
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

function publicView(card, updatedAt) {
  if (!card) return null;
  return {
    name: card.name || '',
    phone: card.phone || '',
    email: card.email || '',
    nmls: card.nmls || '',
    headshotUrl: card.headshotUrl || '',
    title: card.title || '',
    location: card.location || '',
    company: card.company || '',
    updatedAt: updatedAt || null
  };
}

/** Durable token: s1.<payload_b64url>.<sig_b64url> — card is in the token. */
function signCardToken(card) {
  const payload = {
    v: 1,
    iat: Math.floor(Date.now() / 1000),
    card
  };
  const body = b64urlJson(payload);
  const sig = b64url(
    crypto.createHmac('sha256', signingSecret()).update('s1.' + body).digest()
  );
  return `s1.${body}.${sig}`;
}

function verifySignedToken(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3 || parts[0] !== 's1') return null;
  const [, body, sig] = parts;
  const expected = b64url(
    crypto.createHmac('sha256', signingSecret()).update('s1.' + body).digest()
  );
  // timing-safe compare
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  } catch (e) {
    return null;
  }
  try {
    const payload = JSON.parse(fromB64url(body));
    if (!payload || payload.v !== 1 || !payload.card) return null;
    const cleaned = sanitizePublicCard(payload.card);
    if (!cleaned.ok) return null;
    const updatedAt = payload.iat
      ? new Date(payload.iat * 1000).toISOString()
      : null;
    return publicView(cleaned.card, updatedAt);
  } catch (e) {
    return null;
  }
}

function isSignedToken(token) {
  return /^s1\./.test(String(token || ''));
}

function isShortHexToken(token) {
  return /^[a-f0-9]{16,64}$/i.test(String(token || ''));
}

function publishCard(body) {
  const cleaned = sanitizePublicCard(body && body.card != null ? body.card : body);
  if (!cleaned.ok) return { ok: false, status: 400, error: cleaned.error };

  const now = new Date().toISOString();
  // Always mint a durable signed token (survives redeploys)
  const signedToken = signCardToken(cleaned.card);

  // Optional: also keep a short file token when disk works (local convenience)
  let shortToken = null;
  try {
    const store = readStore();
    let prev = String((body && body.token) || '').trim();
    if (prev && isShortHexToken(prev) && store.cards[prev]) {
      shortToken = prev;
      store.cards[shortToken] = {
        card: cleaned.card,
        createdAt: store.cards[shortToken].createdAt || now,
        updatedAt: now,
        signedToken
      };
    } else {
      shortToken = newShortToken();
      store.cards[shortToken] = {
        card: cleaned.card,
        createdAt: now,
        updatedAt: now,
        signedToken
      };
    }
    writeStore(store);
  } catch (e) {
    console.warn('[partner-store] file write skipped (ok — signed token is durable)', e.message);
    shortToken = null;
  }

  return {
    ok: true,
    token: signedToken,
    shortToken,
    durable: true,
    card: publicView(cleaned.card, now),
    updatedAt: now
  };
}

function getCard(token) {
  const t = String(token || '').trim();
  if (!t) {
    return { ok: false, status: 400, error: 'Invalid token.' };
  }

  // 1) Durable signed token (primary — works after redeploy)
  if (isSignedToken(t)) {
    const card = verifySignedToken(t);
    if (!card) {
      return {
        ok: false,
        status: 404,
        error: 'Partner card signature invalid. Re-publish from LO Coach if the signing secret changed.'
      };
    }
    return { ok: true, token: t, card, durable: true };
  }

  // 2) Legacy short hex token from file store (may be wiped on free Render redeploy)
  if (isShortHexToken(t)) {
    const store = readStore();
    const record = store.cards[t];
    if (!record) {
      return {
        ok: false,
        status: 404,
        error:
          'Partner card not found (short tokens can be wiped on free Render redeploys). Ask the LO to re-publish — new links are durable.'
      };
    }
    return {
      ok: true,
      token: t,
      card: publicView(record.card, record.updatedAt),
      durable: false
    };
  }

  return { ok: false, status: 400, error: 'Invalid token.' };
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
      shortToken: result.shortToken || null,
      durable: true,
      shareUrl: buildShareUrl(result.token),
      card: result.card,
      updatedAt: result.updatedAt,
      storage:
        'Signed token (free, survives redeploys). Optional file cache for short tokens when disk available.'
    });
  });

  // :token is one path segment — dots inside signed tokens (s1.payload.sig) are fine
  app.get('/api/partner/:token', (req, res) => {
    let raw = req.params.token || '';
    try {
      raw = decodeURIComponent(raw);
    } catch (e) { /* keep raw */ }
    const result = getCard(raw);
    if (!result.ok) {
      return res.status(result.status || 404).json({ error: result.error });
    }
    res.setHeader('Cache-Control', 'public, max-age=120');
    return res.status(200).json({
      ok: true,
      token: result.token,
      card: result.card,
      durable: !!result.durable
    });
  });

  console.info(
    '[partner-store] routes mounted — durable signed tokens ON; file cache:',
    STORE_PATH,
    '| secret:',
    process.env.PARTNER_CARD_SECRET ? 'PARTNER_CARD_SECRET set' : 'fallback (set PARTNER_CARD_SECRET on Render)'
  );
}

module.exports = {
  mountPartnerRoutes,
  publishCard,
  getCard,
  buildShareUrl,
  sanitizePublicCard,
  signCardToken,
  verifySignedToken
};
