/**
 * Public LO partner cards — short share codes for clean emails.
 *
 * Share URL shape (short):
 *   https://ruoffagentsalescoach.onrender.com/?lo=xK9m2pQ4
 *
 * Storage (short code → full public card):
 *   1) In-memory map (current process)
 *   2) File data/partner-cards.json (local / until free disk wipes)
 *   3) Optional free Upstash Redis REST (survives redeploys) if
 *        UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set
 *
 * Legacy: long signed s1.* tokens still resolve (old emails keep working).
 *
 * Env:
 *   REALTOR_APP_URL, PARTNER_CARD_SECRET (optional)
 *   UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN (optional free durability)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STORE_PATH =
  process.env.PARTNER_CARDS_PATH ||
  path.join(__dirname, 'data', 'partner-cards.json');

const PROD_REALTOR_APP_URL = 'https://ruoffagentsalescoach.onrender.com';
const PROD_LO_APP_URL = 'https://loanofficersalescoach.onrender.com';

/** @type {Map<string, { card: object, createdAt: string, updatedAt: string }>} */
const mem = new Map();

function signingSecret() {
  return String(
    process.env.PARTNER_CARD_SECRET ||
      process.env.PARTNER_SHARE_SECRET ||
      process.env.XAI_API_KEY ||
      process.env.GROK_API_KEY ||
      'dev-only-partner-card-secret-change-me'
  );
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
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readStore() {
  try {
    ensureDir();
    if (!fs.existsSync(STORE_PATH)) return { cards: {} };
    const parsed = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8') || '{}');
    if (!parsed || typeof parsed !== 'object' || !parsed.cards) return { cards: {} };
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

function hydrateMemFromFile() {
  try {
    const store = readStore();
    Object.entries(store.cards || {}).forEach(([k, rec]) => {
      if (rec && rec.card) mem.set(k, rec);
    });
  } catch (e) { /* ignore */ }
}
hydrateMemFromFile();

/** Short code for emails: ~8 chars, URL-safe (e.g. xK9m2pQ4) */
function newShortToken() {
  return crypto.randomBytes(6).toString('base64url'); // 8 chars
}

function isSignedToken(token) {
  return /^s1\./.test(String(token || ''));
}

function isShortToken(token) {
  const t = String(token || '');
  // New short codes + legacy 32-char hex
  return /^[A-Za-z0-9_-]{6,64}$/.test(t) && !isSignedToken(t);
}

function upstashConfigured() {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

async function upstashSet(key, value) {
  if (!upstashConfigured()) return false;
  const base = process.env.UPSTASH_REDIS_REST_URL.replace(/\/+$/, '');
  const res = await fetch(`${base}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(value)
  });
  return res.ok;
}

async function upstashGet(key) {
  if (!upstashConfigured()) return null;
  const base = process.env.UPSTASH_REDIS_REST_URL.replace(/\/+$/, '');
  const res = await fetch(`${base}/get/${encodeURIComponent(key)}`, {
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`
    }
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  // Upstash returns { result: "..." } stringified JSON sometimes
  if (!data || data.result == null) return null;
  try {
    return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
  } catch (e) {
    return data.result;
  }
}

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
  // Pre-signed S3/avatar URLs can be long; keep room for a full signature.
  const headshotUrl = String(src.headshotUrl || src.headshot || '').trim().slice(0, 2000);
  const title = String(src.title || 'Your Ruoff Loan Officer').trim().slice(0, 80);
  const location = String(src.location || src.market || '').trim().slice(0, 120);
  const company = String(src.company || 'Ruoff Mortgage').trim().slice(0, 80);

  if (!name) return { ok: false, error: 'Name is required for a partner card.' };
  if (!phone && !email) {
    return { ok: false, error: 'Add a phone or email so partners can reach you.' };
  }
  if (!headshotUrl) {
    return {
      ok: false,
      error: 'Add a Professional Headshot URL so partners see your photo on the brand plate.'
    };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Email does not look valid.' };
  }
  if (headshotUrl && !/^https?:\/\//i.test(headshotUrl)) {
    return { ok: false, error: 'Headshot must be an http(s) URL.' };
  }
  // Ruoff avatar S3 links are often pre-signed with X-Amz-Expires=300 (5 min).
  // LO tool may still show a cached image; Realtor loads the stored URL later → 403 → gray circle.
  if (isEphemeralHeadshotUrl(headshotUrl)) {
    return {
      ok: false,
      error:
        'That headshot link expires in a few minutes (temporary S3/signed URL). Use a permanent public image URL — e.g. HubSpot, company site, or a direct link from 8upload — then re-publish your partner link.'
    };
  }

  return {
    ok: true,
    card: { name, phone, email, nmls, headshotUrl, title, location, company }
  };
}

/** Detect short-lived pre-signed object URLs that will break partner branding after expiry. */
function isEphemeralHeadshotUrl(url) {
  const u = String(url || '');
  if (!u) return false;
  // AWS SigV4 pre-signed GET (common on ruoff-avatar-images-prod.s3…)
  if (/[?&]X-Amz-Algorithm=/i.test(u) || /[?&]X-Amz-Signature=/i.test(u) || /[?&]X-Amz-Credential=/i.test(u)) {
    return true;
  }
  // Explicit short TTL in query
  const exp = u.match(/[?&]X-Amz-Expires=(\d+)/i);
  if (exp && parseInt(exp[1], 10) > 0 && parseInt(exp[1], 10) < 86400) {
    return true; // less than 24h
  }
  // Azure / GCS style signed URLs
  if (/[?&]X-Goog-Signature=/i.test(u) || /[?&]sig=/i.test(u) && /[?&]se=/i.test(u)) {
    return true;
  }
  return false;
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

/** Legacy long tokens (still accepted for old emails). */
function signCardToken(card) {
  const payload = { v: 1, iat: Math.floor(Date.now() / 1000), card };
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
    const updatedAt = payload.iat ? new Date(payload.iat * 1000).toISOString() : null;
    return publicView(cleaned.card, updatedAt);
  } catch (e) {
    return null;
  }
}

function saveLocal(shortToken, record) {
  mem.set(shortToken, record);
  try {
    const store = readStore();
    store.cards[shortToken] = record;
    writeStore(store);
  } catch (e) {
    console.warn('[partner-store] file write failed', e.message);
  }
}

function loadLocal(shortToken) {
  if (mem.has(shortToken)) return mem.get(shortToken);
  try {
    const store = readStore();
    const rec = store.cards[shortToken];
    if (rec && rec.card) {
      mem.set(shortToken, rec);
      return rec;
    }
  } catch (e) { /* ignore */ }
  return null;
}

async function publishCard(body) {
  const cleaned = sanitizePublicCard(body && body.card != null ? body.card : body);
  if (!cleaned.ok) return { ok: false, status: 400, error: cleaned.error };

  const now = new Date().toISOString();
  let shortToken = String((body && body.token) || '').trim();

  // Reuse prior short code when re-publishing (ignore legacy long signed tokens).
  // IMPORTANT: after a free Render redeploy the in-memory/file store is empty — still
  // re-bind the client's saved short code so bookmarks/emails keep working.
  if (!shortToken || isSignedToken(shortToken) || !isShortToken(shortToken)) {
    shortToken = newShortToken();
  }
  // else: keep shortToken even if loadLocal/upstash miss (redeploy recovery)

  const record = {
    card: cleaned.card,
    createdAt: (loadLocal(shortToken) || {}).createdAt || now,
    updatedAt: now
  };

  saveLocal(shortToken, record);

  let durableRemote = false;
  try {
    durableRemote = await upstashSet(`partner:${shortToken}`, record);
  } catch (e) {
    console.warn('[partner-store] upstash set failed', e.message);
  }

  return {
    ok: true,
    token: shortToken,
    shortToken,
    durable: durableRemote || true, // short codes work while LO server is up; Upstash survives redeploys
    durableRemote,
    card: publicView(cleaned.card, now),
    updatedAt: now
  };
}

async function getCard(token) {
  const t = String(token || '').trim();
  if (!t) return { ok: false, status: 400, error: 'Invalid token.' };

  // Legacy long signed links still work (no server lookup)
  if (isSignedToken(t)) {
    const card = verifySignedToken(t);
    if (!card) {
      return {
        ok: false,
        status: 404,
        error: 'Partner card signature invalid. Ask the LO to re-publish for a new short link.'
      };
    }
    return { ok: true, token: t, card, durable: true };
  }

  if (!isShortToken(t)) {
    return { ok: false, status: 400, error: 'Invalid token.' };
  }

  let rec = loadLocal(t);
  if (!rec) {
    try {
      rec = await upstashGet(`partner:${t}`);
      if (rec && rec.card) saveLocal(t, rec);
    } catch (e) {
      console.warn('[partner-store] upstash get failed', e.message);
    }
  }

  if (!rec || !rec.card) {
    return {
      ok: false,
      status: 404,
      error:
        'Partner card not found. The LO may need to re-publish after a server redeploy (or enable free Upstash for permanent short links).'
    };
  }

  return {
    ok: true,
    token: t,
    card: publicView(rec.card, rec.updatedAt),
    durable: upstashConfigured()
  };
}

function resolveRealtorAppUrl(req) {
  const fromEnv = String(
    process.env.REALTOR_APP_URL || process.env.PARTNER_REALTOR_URL || ''
  )
    .trim()
    .replace(/\/+$/, '');
  if (fromEnv) return fromEnv;

  try {
    const host = String(
      (req && (req.headers['x-forwarded-host'] || req.headers.host)) || ''
    )
      .split(',')[0]
      .trim()
      .toLowerCase();
    if (host && !/localhost|127\.0\.0\.1/.test(host)) {
      return PROD_REALTOR_APP_URL;
    }
  } catch (e) { /* ignore */ }

  if (String(process.env.NODE_ENV || '').toLowerCase() === 'production') {
    return PROD_REALTOR_APP_URL;
  }
  return 'http://localhost:3001';
}

function buildShareUrl(token, req) {
  const base = resolveRealtorAppUrl(req);
  // Short codes are URL-safe; still encode for safety. Always use ?lo= (never /lo=)
  return `${base}/?lo=${encodeURIComponent(token)}`;
}

function mountPartnerRoutes(app) {
  app.post('/api/partner/publish', async (req, res) => {
    try {
      const result = await publishCard(req.body || {});
      if (!result.ok) {
        return res.status(result.status || 400).json({ error: result.error });
      }
      const shareUrl = buildShareUrl(result.token, req);
      return res.status(200).json({
        ok: true,
        token: result.token,
        shortToken: result.token,
        durable: true,
        durableRemote: !!result.durableRemote,
        shareUrl,
        card: result.card,
        updatedAt: result.updatedAt,
        realtorAppUrl: resolveRealtorAppUrl(req),
        storage: result.durableRemote
          ? 'Short code + Upstash (survives redeploys)'
          : 'Short code + server memory/file (re-publish after rare free-tier redeploy, or add free Upstash)'
      });
    } catch (e) {
      console.error('[partner-store] publish error', e);
      return res.status(500).json({ error: 'Publish failed' });
    }
  });

  app.get('/api/partner/:token', async (req, res) => {
    try {
      let raw = req.params.token || '';
      try {
        raw = decodeURIComponent(raw);
      } catch (e) { /* keep */ }
      const result = await getCard(raw);
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
    } catch (e) {
      console.error('[partner-store] get error', e);
      return res.status(500).json({ error: 'Lookup failed' });
    }
  });

  console.info(
    '[partner-store] short share codes ON | upstash:',
    upstashConfigured() ? 'yes' : 'no (optional free durability)',
    '| realtor default:',
    PROD_REALTOR_APP_URL
  );
}

module.exports = {
  mountPartnerRoutes,
  publishCard,
  getCard,
  buildShareUrl,
  resolveRealtorAppUrl,
  sanitizePublicCard,
  signCardToken,
  verifySignedToken,
  PROD_REALTOR_APP_URL,
  PROD_LO_APP_URL
};
