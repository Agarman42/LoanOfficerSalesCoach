/**
 * Realtor Agent Sales Coach — auth persistence.
 * Primary: Postgres (DATABASE_URL) via sc_auth_* tables (app = 'agent').
 * Fallback: local JSON file only when DATABASE_URL is unset (local dev).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const authPg = require('./auth-pg');

const STORE_PATH =
  process.env.AUTH_STORE_PATH ||
  path.join(__dirname, '..', 'data', 'auth-store.json');

const APP = 'agent';
const SHAPE = {
  users: true,
  invites: true,
  agent_invites: false,
  usage_events: true,
  password_resets: true,
  access_requests: true
};

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;

const USE_PG = authPg.isPgEnabled();

function ensureDir() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function emptyStore() {
  return {
    version: 1,
    users: {},
    invites: {},
    usage_events: [],
    password_resets: {},
    access_requests: {}
  };
}

function readStoreFile() {
  try {
    ensureDir();
    if (!fs.existsSync(STORE_PATH)) return emptyStore();
    const parsed = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8') || '{}');
    if (!parsed || typeof parsed !== 'object') return emptyStore();
    return {
      version: 1,
      users: parsed.users && typeof parsed.users === 'object' ? parsed.users : {},
      invites: parsed.invites && typeof parsed.invites === 'object' ? parsed.invites : {},
      usage_events: Array.isArray(parsed.usage_events) ? parsed.usage_events : [],
      password_resets:
        parsed.password_resets && typeof parsed.password_resets === 'object'
          ? parsed.password_resets
          : {},
      access_requests:
        parsed.access_requests && typeof parsed.access_requests === 'object'
          ? parsed.access_requests
          : {}
    };
  } catch (e) {
    console.warn('[auth-store] read failed', e.message);
    return emptyStore();
  }
}

function writeStoreFile(store) {
  ensureDir();
  const tmp = STORE_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(tmp, STORE_PATH);
}

let fileChain = Promise.resolve();
function withStoreFile(mutator) {
  const run = fileChain.then(() => {
    const store = readStoreFile();
    const result = mutator(store);
    writeStoreFile(store);
    return result;
  });
  fileChain = run.catch(() => {});
  return run;
}

const withStorePg = USE_PG ? authPg.createWithStore(APP, SHAPE) : null;

/** @param {function} mutator @param {{ readOnly?: boolean }} [opts] */
function withStore(mutator, opts) {
  if (USE_PG && withStorePg) return withStorePg(mutator, opts);
  return withStoreFile(mutator);
}

function newId(prefix) {
  return (prefix || 'id') + '_' + crypto.randomBytes(12).toString('base64url');
}

function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(password), salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P
  });
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

function verifyPassword(password, stored) {
  try {
    const parts = String(stored || '').split('$');
    if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
    const salt = Buffer.from(parts[1], 'base64');
    const expected = Buffer.from(parts[2], 'base64');
    const hash = crypto.scryptSync(String(password), salt, expected.length, {
      N: SCRYPT_N,
      r: SCRYPT_R,
      p: SCRYPT_P
    });
    return crypto.timingSafeEqual(hash, expected);
  } catch (e) {
    return false;
  }
}

function isRuoffEmail(email) {
  return /@ruoff\.com$/i.test(String(email || '').trim());
}

function resolveRole(email, requestedRole) {
  if (requestedRole === 'admin') return 'admin';
  if (requestedRole === 'lo') return 'lo';
  if (requestedRole === 'realtor') {
    return isRuoffEmail(email) ? 'lo' : 'realtor';
  }
  if (isRuoffEmail(email)) return 'lo';
  return 'realtor';
}

function canInvite(userOrPublic) {
  if (!userOrPublic) return false;
  if (userOrPublic.role === 'admin' || userOrPublic.role === 'lo') return true;
  return isRuoffEmail(userOrPublic.email);
}

function isAdmin(userOrPublic) {
  return !!(userOrPublic && userOrPublic.role === 'admin');
}

function publicUser(u) {
  if (!u) return null;
  const role = u.role || 'realtor';
  const email = u.email || '';
  const inviter = role === 'admin' || role === 'lo' || isRuoffEmail(email);
  const brand = u.linked_lo_brand && typeof u.linked_lo_brand === 'object' ? u.linked_lo_brand : null;
  return {
    id: u.id,
    email: email,
    name: u.name || '',
    company: u.company || '',
    phone: u.phone || '',
    role: role,
    status: u.status,
    referred_by_lo_name: u.referred_by_lo_name || (brand && brand.name) || '',
    invited_by: u.invited_by || null,
    linked_lo_brand: brand,
    created_at: u.created_at,
    last_login_at: u.last_login_at || null,
    login_count: u.login_count || 0,
    can_invite: inviter,
    is_admin: role === 'admin'
  };
}

function findUserByEmail(store, email) {
  const e = normalizeEmail(email);
  return Object.values(store.users).find((u) => u.email === e) || null;
}

function findUserById(store, id) {
  return store.users[id] || null;
}

function recordUsage(store, userId, eventType, pathOrFeature, metadata) {
  const ev = {
    id: newId('evt'),
    user_id: userId || null,
    event_type: String(eventType || 'unknown'),
    path: pathOrFeature ? String(pathOrFeature).slice(0, 200) : null,
    metadata: metadata && typeof metadata === 'object' ? metadata : null,
    created_at: new Date().toISOString()
  };
  if (!Array.isArray(store.usage_events)) store.usage_events = [];
  store.usage_events.push(ev);
  if (store.usage_events.length > 5000) {
    store.usage_events = store.usage_events.slice(-5000);
  }
  return ev;
}

/** Append-only usage (track/heartbeat) — no full auth blob rewrite on Postgres. */
function appendUsage(userId, eventType, pathOrFeature, metadata) {
  const ev = {
    id: newId('evt'),
    user_id: userId || null,
    event_type: String(eventType || 'unknown').slice(0, 64),
    path: pathOrFeature ? String(pathOrFeature).slice(0, 200) : null,
    metadata: metadata && typeof metadata === 'object' ? metadata : null,
    created_at: new Date().toISOString()
  };
  if (USE_PG && authPg.appendUsageEvent) {
    return authPg.appendUsageEvent(APP, ev);
  }
  return withStore((s) => {
    if (!Array.isArray(s.usage_events)) s.usage_events = [];
    s.usage_events.push(ev);
    if (s.usage_events.length > 5000) s.usage_events = s.usage_events.slice(-5000);
    return ev;
  });
}

function seedAdminIfNeeded() {
  return withStore((store) => {
    const hasAdmin = Object.values(store.users).some((u) => u.role === 'admin');
    if (hasAdmin) {
      return { seeded: false };
    }
    const email = normalizeEmail(process.env.ADMIN_EMAIL || 'agarman42@hotmail.com');
    let password = process.env.ADMIN_PASSWORD || '';
    let generated = false;
    if (!password || password.length < 8) {
      password = crypto.randomBytes(9).toString('base64url');
      generated = true;
    }
    const id = newId('usr');
    const now = new Date().toISOString();
    store.users[id] = {
      id,
      email,
      password_hash: hashPassword(password),
      name: process.env.ADMIN_NAME || 'Adam Garman',
      company: process.env.ADMIN_COMPANY || 'Ruoff Mortgage',
      phone: '',
      role: 'admin',
      status: 'active',
      invite_code: null,
      invited_by: null,
      referred_by_lo_name: '',
      created_at: now,
      last_login_at: null,
      login_count: 0
    };
    return {
      seeded: true,
      email,
      password: generated ? password : null,
      generated
    };
  });
}

async function initBackend() {
  if (!USE_PG) {
    console.warn(
      '[auth-store] DATABASE_URL not set — using local file store (ephemeral on Render). Set DATABASE_URL for durable auth.'
    );
    return { backend: 'file', path: STORE_PATH };
  }
  try {
    await authPg.migrate();
    const imp = await authPg.importFileIfEmpty(APP, readStoreFile, SHAPE);
    if (imp.imported) {
      console.log('[auth-store] migrated file users → Postgres:', imp.users);
    }
    console.log('[auth-store] backend=postgres (sc_auth_* app=agent)');
    return { backend: 'postgres', imported: !!imp.imported };
  } catch (e) {
    console.error('[auth-store] Postgres init failed:', e.message);
    throw e;
  }
}

module.exports = {
  STORE_PATH,
  USE_PG,
  withStore,
  readStore: readStoreFile,
  writeStore: writeStoreFile,
  newId,
  normalizeEmail,
  hashPassword,
  verifyPassword,
  publicUser,
  findUserByEmail,
  findUserById,
  recordUsage,
  appendUsage,
  seedAdminIfNeeded,
  isRuoffEmail,
  resolveRole,
  canInvite,
  isAdmin,
  initBackend,
  authPgHealth: () => authPg.health()
};
