/**
 * Shared Postgres backend for LO + Agent Sales Coach auth.
 *
 * Uses DATABASE_URL (CRM Postgres is fine). Tables are sc_auth_* only —
 * never touch CRM product tables.
 *
 * Storage model (durable + simple):
 *   sc_auth_store(app PRIMARY KEY, payload JSONB) — full in-memory store shape
 *   per app ('lo' | 'agent'), mutated via withStore() under an advisory lock.
 *
 * Also maintains sc_auth_users as a denormalized projection for SQL admin queries.
 */
'use strict';

const crypto = require('crypto');

let Pool;
try {
  Pool = require('pg').Pool;
} catch (e) {
  Pool = null;
}

let pool = null;
let migratePromise = null;

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS sc_auth_store (
    app TEXT PRIMARY KEY,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS sc_auth_users (
    app TEXT NOT NULL,
    id TEXT NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL DEFAULT '',
    name TEXT NOT NULL DEFAULT '',
    company TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'realtor',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    login_count INTEGER NOT NULL DEFAULT 0,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    PRIMARY KEY (app, id)
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS sc_auth_users_app_email_uidx
     ON sc_auth_users (app, email)`,
  `CREATE TABLE IF NOT EXISTS sc_auth_meta (
    app TEXT PRIMARY KEY,
    migrated_file_at TIMESTAMPTZ,
    notes TEXT
  )`,
  // Append-only usage — never requires rewriting sc_auth_store payload
  `CREATE TABLE IF NOT EXISTS sc_auth_usage_events (
    app TEXT NOT NULL,
    id TEXT NOT NULL,
    user_id TEXT,
    event_type TEXT,
    path TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (app, id)
  )`,
  `CREATE INDEX IF NOT EXISTS sc_auth_usage_app_created_idx
     ON sc_auth_usage_events (app, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS sc_auth_usage_app_user_idx
     ON sc_auth_usage_events (app, user_id, created_at DESC)`
];

/**
 * Prefer public/external URLs when present. Internal Render hostnames
 * (e.g. dpg-xxx-a with no domain) only resolve inside the same private network.
 */
function rawDatabaseUrlCandidates() {
  return [
    process.env.DATABASE_URL_EXTERNAL,
    process.env.DATABASE_PUBLIC_URL,
    process.env.POSTGRES_URL,
    process.env.DATABASE_URL
  ]
    .map((v) => String(v || '').trim())
    .filter(Boolean);
}

function extractHost(url) {
  try {
    // postgres://user:pass@host:5432/db
    const m = String(url).match(/@([^/?]+)/);
    if (!m) return '';
    return m[1].split(':')[0];
  } catch (e) {
    return '';
  }
}

function isShortRenderInternalHost(host) {
  // e.g. dpg-d9p48iqjnfac73c2ode0-a  (no dots)
  return /^dpg-[a-z0-9-]+$/i.test(host || '') && !String(host).includes('.');
}

/**
 * Expand bare Render internal hosts to a public hostname when needed.
 * Region can be set via RENDER_DB_REGION (default oregon).
 */
function expandRenderHost(url) {
  const host = extractHost(url);
  if (!isShortRenderInternalHost(host)) return url;
  const region = String(process.env.RENDER_DB_REGION || process.env.POSTGRES_REGION || 'oregon')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '') || 'oregon';
  const fullHost = host + '.' + region + '-postgres.render.com';
  const expanded = url.replace('@' + host, '@' + fullHost);
  console.warn(
    '[auth-pg] DATABASE_URL host "' +
      host +
      '" looks like a Render internal hostname. Expanding to "' +
      fullHost +
      '". Prefer setting DATABASE_URL to the External Database URL from the Render Postgres dashboard.'
  );
  return expanded;
}

function databaseUrl() {
  const candidates = rawDatabaseUrlCandidates();
  if (!candidates.length) return '';
  // Prefer a URL that already has a public/full hostname
  for (const c of candidates) {
    const h = extractHost(c);
    if (h && h.includes('.')) return c;
  }
  return expandRenderHost(candidates[0]);
}

function isPgEnabled() {
  if (process.env.AUTH_FORCE_FILE === '1' || process.env.AUTH_FORCE_FILE === 'true') {
    return false;
  }
  return !!databaseUrl() && !!Pool;
}

function shouldUseSsl(url) {
  if (process.env.PGSSL === '0' || process.env.PGSSL === 'false') return false;
  if (process.env.PGSSL === '1' || process.env.PGSSL === 'true') return true;
  if (/sslmode=require/i.test(url)) return true;
  if (/sslmode=disable/i.test(url)) return false;
  // External hosts need TLS
  if (/\.render\.com/i.test(url)) return true;
  if (/neon\.tech|supabase\.co|amazonaws\.com/i.test(url)) return true;
  // Bare internal dpg- host over expanded public name will use SSL above
  const host = extractHost(url);
  if (isShortRenderInternalHost(host)) return false;
  return false;
}

function getPool() {
  if (!isPgEnabled()) return null;
  if (!pool) {
    const url = databaseUrl();
    const ssl = shouldUseSsl(url) ? { rejectUnauthorized: false } : undefined;
    pool = new Pool({
      connectionString: url,
      ssl,
      max: Number(process.env.AUTH_PG_POOL_MAX || 8),
      connectionTimeoutMillis: Number(process.env.AUTH_PG_CONNECT_TIMEOUT_MS || 15000)
    });
    pool.on('error', (err) => {
      console.error('[auth-pg] pool error', err.message);
    });
    console.log(
      '[auth-pg] pool created',
      'ssl=' + !!ssl,
      'host=' + (extractHost(url) || '(unknown)')
    );
  }
  return pool;
}

function appLockKey(app) {
  let h = 0;
  const s = 'sc_auth_' + String(app || '');
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  // pg advisory lock wants signed 32-bit; keep non-zero
  return h || 1;
}

async function migrate() {
  const p = getPool();
  if (!p) return { ok: false, reason: 'no-pool' };
  if (!migratePromise) {
    migratePromise = (async () => {
      const client = await p.connect();
      try {
        for (const sql of SCHEMA_STATEMENTS) {
          await client.query(sql);
        }
        console.log('[auth-pg] schema ready (sc_auth_store + sc_auth_users)');
        return { ok: true };
      } finally {
        client.release();
      }
    })().catch((e) => {
      migratePromise = null;
      console.error('[auth-pg] migrate failed', e.message);
      throw e;
    });
  }
  return migratePromise;
}

function emptyPayload(app) {
  if (app === 'lo') {
    return {
      version: 1,
      app: 'lo-sales-coach',
      users: {},
      agent_invites: {},
      usage_events: [],
      password_resets: {}
    };
  }
  return {
    version: 1,
    app: 'agent-sales-coach',
    users: {},
    invites: {},
    usage_events: [],
    password_resets: {},
    access_requests: {}
  };
}

function ensureShape(app, raw) {
  const base = emptyPayload(app);
  if (!raw || typeof raw !== 'object') return base;
  const out = Object.assign({}, base, raw);
  out.users = raw.users && typeof raw.users === 'object' ? raw.users : {};
  out.usage_events = Array.isArray(raw.usage_events) ? raw.usage_events : [];
  out.password_resets =
    raw.password_resets && typeof raw.password_resets === 'object' ? raw.password_resets : {};
  if (app === 'lo') {
    out.agent_invites =
      raw.agent_invites && typeof raw.agent_invites === 'object' ? raw.agent_invites : {};
  } else {
    out.invites = raw.invites && typeof raw.invites === 'object' ? raw.invites : {};
    out.access_requests =
      raw.access_requests && typeof raw.access_requests === 'object' ? raw.access_requests : {};
  }
  return out;
}

/** Project users into sc_auth_users for admin SQL / debugging (best-effort). */
async function projectUsers(client, app, users) {
  try {
    await client.query('DELETE FROM sc_auth_users WHERE app = $1', [app]);
    const list = Object.values(users || {});
    for (const u of list) {
      if (!u || !u.id || !u.email) continue;
      const skip = new Set([
        'id',
        'email',
        'password_hash',
        'name',
        'company',
        'phone',
        'role',
        'status',
        'created_at',
        'last_login_at',
        'login_count'
      ]);
      const data = {};
      Object.keys(u).forEach((k) => {
        if (!skip.has(k)) data[k] = u[k];
      });
      await client.query(
        `INSERT INTO sc_auth_users
          (app, id, email, password_hash, name, company, phone, role, status,
           created_at, last_login_at, login_count, data)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb)
         ON CONFLICT (app, id) DO UPDATE SET
           email = EXCLUDED.email,
           password_hash = EXCLUDED.password_hash,
           name = EXCLUDED.name,
           company = EXCLUDED.company,
           phone = EXCLUDED.phone,
           role = EXCLUDED.role,
           status = EXCLUDED.status,
           created_at = EXCLUDED.created_at,
           last_login_at = EXCLUDED.last_login_at,
           login_count = EXCLUDED.login_count,
           data = EXCLUDED.data`,
        [
          app,
          String(u.id),
          String(u.email || '').toLowerCase(),
          String(u.password_hash || ''),
          String(u.name || ''),
          String(u.company || ''),
          String(u.phone || ''),
          String(u.role || (app === 'lo' ? 'loan_officer' : 'realtor')),
          String(u.status || 'active'),
          u.created_at || null,
          u.last_login_at || null,
          Number(u.login_count) || 0,
          JSON.stringify(data)
        ]
      );
    }
  } catch (e) {
    // Non-fatal — payload store is source of truth
    console.warn('[auth-pg] projectUsers skipped', e.message);
  }
}

function parsePayload(rowPayload) {
  let payload = rowPayload;
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch (e) {
      payload = null;
    }
  }
  return payload;
}

function normalizeUsageEvent(ev) {
  return {
    id: String((ev && ev.id) || 'evt_' + crypto.randomBytes(10).toString('base64url')),
    user_id: ev && ev.user_id ? String(ev.user_id) : null,
    event_type: String((ev && ev.event_type) || 'unknown').slice(0, 64),
    path: ev && ev.path != null ? String(ev.path).slice(0, 200) : null,
    metadata: ev && ev.metadata && typeof ev.metadata === 'object' ? ev.metadata : null,
    created_at: (ev && ev.created_at) || new Date().toISOString()
  };
}

async function insertUsageRow(client, app, ev) {
  const e = normalizeUsageEvent(ev);
  await client.query(
    `INSERT INTO sc_auth_usage_events (app, id, user_id, event_type, path, metadata, created_at)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,COALESCE($7::timestamptz, NOW()))
     ON CONFLICT (app, id) DO NOTHING`,
    [
      app,
      e.id,
      e.user_id,
      e.event_type,
      e.path,
      JSON.stringify(e.metadata),
      e.created_at
    ]
  );
  return e;
}

/**
 * Lightweight append-only usage write — no auth blob load/rewrite.
 */
async function appendUsageEvent(app, ev) {
  const p = getPool();
  if (!p) throw new Error('DATABASE_URL not configured for auth');
  await migrate();
  const client = await p.connect();
  try {
    return await insertUsageRow(client, app, ev);
  } finally {
    client.release();
  }
}

/**
 * List usage events newest-first for admin APIs.
 */
async function listUsageEvents(app, opts) {
  opts = opts || {};
  const limit = Math.min(5000, Math.max(1, Number(opts.limit) || 500));
  const userId = opts.userId ? String(opts.userId) : null;
  const p = getPool();
  if (!p) return [];
  await migrate();
  const client = await p.connect();
  try {
    let res;
    if (userId) {
      res = await client.query(
        `SELECT id, user_id, event_type, path, metadata, created_at
         FROM sc_auth_usage_events
         WHERE app = $1 AND user_id = $2
         ORDER BY created_at DESC
         LIMIT $3`,
        [app, userId, limit]
      );
    } else {
      res = await client.query(
        `SELECT id, user_id, event_type, path, metadata, created_at
         FROM sc_auth_usage_events
         WHERE app = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [app, limit]
      );
    }
    return res.rows.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      event_type: r.event_type,
      path: r.path,
      metadata: r.metadata,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : null
    }));
  } finally {
    client.release();
  }
}

/** One-time: copy blob.usage_events into SQL table if table empty for app. */
async function migrateBlobUsageIfNeeded(client, app, blobEvents) {
  const chk = await client.query(
    'SELECT EXISTS(SELECT 1 FROM sc_auth_usage_events WHERE app = $1) AS e',
    [app]
  );
  if (chk.rows[0] && chk.rows[0].e) return { migrated: false };
  const list = Array.isArray(blobEvents) ? blobEvents.slice(-5000) : [];
  if (!list.length) return { migrated: false };
  for (const ev of list) {
    await insertUsageRow(client, app, ev);
  }
  console.log('[auth-pg] migrated', list.length, 'blob usage events → SQL app=' + app);
  return { migrated: true, count: list.length };
}

/**
 * Hydrate store.usage_events from append-only SQL (for admin/stats read paths).
 * Falls back to blob events if SQL empty.
 */
async function hydrateUsageEvents(client, app, store, limit) {
  limit = limit || 5000;
  try {
    await migrateBlobUsageIfNeeded(client, app, store.usage_events);
    const res = await client.query(
      `SELECT id, user_id, event_type, path, metadata, created_at
       FROM sc_auth_usage_events
       WHERE app = $1
       ORDER BY created_at ASC
       LIMIT $2`,
      [app, limit]
    );
    if (res.rows.length) {
      store.usage_events = res.rows.map((r) => ({
        id: r.id,
        user_id: r.user_id,
        event_type: r.event_type,
        path: r.path,
        metadata: r.metadata,
        created_at: r.created_at ? new Date(r.created_at).toISOString() : null
      }));
    }
  } catch (e) {
    console.warn('[auth-pg] hydrateUsageEvents', e.message);
  }
  return store;
}

/**
 * Drop-in withStore(mutator) for existing auth routes.
 * @param {'lo'|'agent'} app
 * @param {object} [_shape] ignored (kept for call-site compatibility)
 *
 * withStore(fn) — read-modify-write under advisory lock
 * withStore(fn, { readOnly: true }) — fast snapshot read (no write)
 * withStore(fn, { readOnly: true, includeUsage: true }) — also load usage events from SQL
 */
function createWithStore(app, _shape) {
  let chain = Promise.resolve();

  function withStore(mutator, opts) {
    opts = opts || {};
    const readOnly = !!opts.readOnly;
    // includeUsage defaults false — session checks must stay cheap; admin passes true
    const includeUsage = !!opts.includeUsage;
    const p = getPool();
    if (!p) {
      return Promise.reject(new Error('DATABASE_URL not configured for auth'));
    }

    // Read-only: concurrent, no lock write, no projectUsers
    if (readOnly) {
      return (async () => {
        await migrate();
        const client = await p.connect();
        try {
          const res = await client.query('SELECT payload FROM sc_auth_store WHERE app = $1', [app]);
          const store = ensureShape(app, parsePayload(res.rows[0] && res.rows[0].payload));
          if (includeUsage) {
            await hydrateUsageEvents(client, app, store, 5000);
          } else {
            // Session/user lookups: ignore blob usage (lives in sc_auth_usage_events)
            store.usage_events = Array.isArray(store.usage_events) ? store.usage_events : [];
          }
          const result = mutator(store);
          return result && typeof result.then === 'function' ? await result : result;
        } finally {
          client.release();
        }
      })();
    }

    const run = chain.then(async () => {
      await migrate();
      const client = await p.connect();
      try {
        await client.query('BEGIN');
        await client.query('SELECT pg_advisory_xact_lock($1)', [appLockKey(app)]);

        const res = await client.query(
          'SELECT payload FROM sc_auth_store WHERE app = $1 FOR UPDATE',
          [app]
        );
        const store = ensureShape(app, parsePayload(res.rows[0] && res.rows[0].payload));
        // One-time migrate any legacy blob usage into SQL
        await migrateBlobUsageIfNeeded(client, app, store.usage_events);

        const result = mutator(store);
        const out = result && typeof result.then === 'function' ? await result : result;

        // Flush usage events added during mutator to append-only table (not blob)
        const pendingUsage = Array.isArray(store.usage_events) ? store.usage_events.slice() : [];
        for (const ev of pendingUsage) {
          await insertUsageRow(client, app, ev);
        }
        // Keep blob small — usage lives in sc_auth_usage_events
        store.usage_events = [];

        await client.query(
          `INSERT INTO sc_auth_store (app, payload, updated_at)
           VALUES ($1, $2::jsonb, NOW())
           ON CONFLICT (app) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
          [app, JSON.stringify(store)]
        );

        if (
          process.env.AUTH_PROJECT_USERS === '1' ||
          process.env.AUTH_PROJECT_USERS === 'true'
        ) {
          await projectUsers(client, app, store.users);
        }

        await client.query('COMMIT');
        return out;
      } catch (e) {
        try {
          await client.query('ROLLBACK');
        } catch (e2) {
          /* ignore */
        }
        console.error('[auth-pg] withStore failed app=' + app, e.message);
        throw e;
      } finally {
        client.release();
      }
    });
    chain = run.catch(() => {});
    return run;
  }

  return withStore;
}

/**
 * One-time import from legacy file JSON if PG payload empty for this app.
 */
async function importFileIfEmpty(app, readFileStore, _shape) {
  const p = getPool();
  if (!p || typeof readFileStore !== 'function') return { imported: false };
  await migrate();

  const existing = await p.query('SELECT payload FROM sc_auth_store WHERE app = $1', [app]);
  if (existing.rows[0] && existing.rows[0].payload) {
    const pl = existing.rows[0].payload;
    const users =
      (typeof pl === 'object' && pl.users) ||
      (typeof pl === 'string'
        ? (() => {
            try {
              return JSON.parse(pl).users;
            } catch (e) {
              return null;
            }
          })()
        : null);
    if (users && Object.keys(users).length) {
      return { imported: false, reason: 'already-has-users' };
    }
  }

  let fileStore;
  try {
    fileStore = readFileStore();
  } catch (e) {
    return { imported: false, reason: 'no-file' };
  }
  if (!fileStore || !fileStore.users || !Object.keys(fileStore.users).length) {
    return { imported: false, reason: 'empty-file' };
  }

  const store = ensureShape(app, fileStore);
  const client = await p.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [appLockKey(app)]);
    await client.query(
      `INSERT INTO sc_auth_store (app, payload, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (app) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
      [app, JSON.stringify(store)]
    );
    await projectUsers(client, app, store.users);
    await client.query(
      `INSERT INTO sc_auth_meta (app, migrated_file_at, notes)
       VALUES ($1, NOW(), $2)
       ON CONFLICT (app) DO UPDATE SET migrated_file_at = NOW(), notes = EXCLUDED.notes`,
      [app, 'imported from local auth-store file']
    );
    await client.query('COMMIT');
    console.log(
      '[auth-pg] imported',
      Object.keys(store.users).length,
      'users for app=',
      app,
      'from file store'
    );
    return { imported: true, users: Object.keys(store.users).length };
  } catch (e) {
    try {
      await client.query('ROLLBACK');
    } catch (e2) {
      /* ignore */
    }
    console.error('[auth-pg] file import failed', e.message);
    return { imported: false, error: e.message };
  } finally {
    client.release();
  }
}

async function health() {
  if (!isPgEnabled()) {
    return { ok: false, backend: 'file-or-none', reason: 'DATABASE_URL missing' };
  }
  try {
    await migrate();
    const p = getPool();
    const r = await p.query('SELECT 1 AS ok');
    const apps = await p.query('SELECT app, updated_at FROM sc_auth_store');
    return {
      ok: r.rows[0].ok === 1,
      backend: 'postgres',
      apps: apps.rows.map((row) => row.app)
    };
  } catch (e) {
    return { ok: false, backend: 'postgres', error: e.message };
  }
}

module.exports = {
  isPgEnabled,
  databaseUrl,
  migrate,
  createWithStore,
  importFileIfEmpty,
  appendUsageEvent,
  listUsageEvents,
  health,
  getPool
};
