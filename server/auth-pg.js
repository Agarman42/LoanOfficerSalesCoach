/**
 * Shared Postgres backend for LO + Agent Sales Coach auth.
 * Tables live in the existing CRM database (DATABASE_URL) under sc_auth_* prefix
 * so they never collide with CRM product tables.
 *
 * Apps: 'lo' | 'agent'
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

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS sc_auth_users (
  app TEXT NOT NULL,
  id TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  login_count INTEGER NOT NULL DEFAULT 0,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (app, id)
);
CREATE UNIQUE INDEX IF NOT EXISTS sc_auth_users_app_email_uidx ON sc_auth_users (app, lower(email));

CREATE TABLE IF NOT EXISTS sc_auth_invites (
  app TEXT NOT NULL,
  code TEXT NOT NULL,
  email_optional TEXT,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (app, code)
);

CREATE TABLE IF NOT EXISTS sc_auth_usage_events (
  app TEXT NOT NULL,
  id TEXT NOT NULL,
  user_id TEXT,
  event_type TEXT,
  path TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (app, id)
);
CREATE INDEX IF NOT EXISTS sc_auth_usage_app_created_idx ON sc_auth_usage_events (app, created_at DESC);

CREATE TABLE IF NOT EXISTS sc_auth_password_resets (
  app TEXT NOT NULL,
  token TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (app, token)
);

CREATE TABLE IF NOT EXISTS sc_auth_access_requests (
  app TEXT NOT NULL,
  id TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (app, id)
);

CREATE TABLE IF NOT EXISTS sc_auth_meta (
  app TEXT NOT NULL PRIMARY KEY,
  migrated_file_at TIMESTAMPTZ,
  notes TEXT
);
`;

function databaseUrl() {
  return String(process.env.DATABASE_URL || process.env.POSTGRES_URL || '').trim();
}

function isPgEnabled() {
  if (process.env.AUTH_FORCE_FILE === '1' || process.env.AUTH_FORCE_FILE === 'true') {
    return false;
  }
  return !!databaseUrl() && !!Pool;
}

function getPool() {
  if (!isPgEnabled()) return null;
  if (!pool) {
    const url = databaseUrl();
    const needsSsl =
      /sslmode=require/i.test(url) ||
      process.env.PGSSL === '1' ||
      process.env.NODE_ENV === 'production' ||
      !!process.env.RENDER;
    pool = new Pool({
      connectionString: url,
      ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
      max: Number(process.env.AUTH_PG_POOL_MAX || 8)
    });
    pool.on('error', (err) => {
      console.error('[auth-pg] pool error', err.message);
    });
  }
  return pool;
}

function appLockKey(app) {
  // Stable 32-bit advisory lock from app name
  let h = 0;
  const s = 'sc_auth_' + String(app || '');
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

async function migrate() {
  const p = getPool();
  if (!p) return { ok: false, reason: 'no-pool' };
  if (!migratePromise) {
    migratePromise = p
      .query(SCHEMA_SQL)
      .then(() => {
        console.log('[auth-pg] schema ready (sc_auth_*)');
        return { ok: true };
      })
      .catch((e) => {
        migratePromise = null;
        console.error('[auth-pg] migrate failed', e.message);
        throw e;
      });
  }
  return migratePromise;
}

function userDataExtras(u) {
  const data = {};
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
  Object.keys(u || {}).forEach((k) => {
    if (!skip.has(k)) data[k] = u[k];
  });
  return data;
}

function rowToUser(row) {
  const data = row.data && typeof row.data === 'object' ? row.data : {};
  return Object.assign({}, data, {
    id: row.id,
    email: row.email,
    password_hash: row.password_hash,
    name: row.name || '',
    company: row.company || '',
    phone: row.phone || '',
    role: row.role,
    status: row.status,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
    last_login_at: row.last_login_at ? new Date(row.last_login_at).toISOString() : null,
    login_count: row.login_count || 0
  });
}

function inviteFromRow(row) {
  const data = row.data && typeof row.data === 'object' ? row.data : {};
  return Object.assign({}, data, {
    code: row.code,
    email_optional: row.email_optional || data.email_optional || null,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : data.created_at || null,
    expires_at: row.expires_at ? new Date(row.expires_at).toISOString() : data.expires_at || null,
    used_at: row.used_at ? new Date(row.used_at).toISOString() : data.used_at || null,
    revoked_at: row.revoked_at ? new Date(row.revoked_at).toISOString() : data.revoked_at || null
  });
}

/**
 * @param {'lo'|'agent'} app
 * @param {{ users?: boolean, invites?: boolean, agent_invites?: boolean, usage_events?: boolean, password_resets?: boolean, access_requests?: boolean }} shape
 */
async function loadStore(client, app, shape) {
  shape = shape || {};
  const store = {
    version: 1,
    app: app === 'lo' ? 'lo-sales-coach' : 'agent-sales-coach',
    users: {},
    invites: {},
    agent_invites: {},
    usage_events: [],
    password_resets: {},
    access_requests: {}
  };

  if (shape.users !== false) {
    const users = await client.query('SELECT * FROM sc_auth_users WHERE app = $1', [app]);
    users.rows.forEach((r) => {
      store.users[r.id] = rowToUser(r);
    });
  }

  if (shape.invites || shape.agent_invites) {
    const inv = await client.query('SELECT * FROM sc_auth_invites WHERE app = $1', [app]);
    inv.rows.forEach((r) => {
      const obj = inviteFromRow(r);
      if (app === 'lo') store.agent_invites[r.code] = obj;
      else store.invites[r.code] = obj;
    });
  }

  if (shape.usage_events !== false) {
    const events = await client.query(
      `SELECT * FROM sc_auth_usage_events WHERE app = $1 ORDER BY created_at ASC LIMIT 5000`,
      [app]
    );
    store.usage_events = events.rows.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      event_type: r.event_type,
      path: r.path,
      metadata: r.metadata,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : null
    }));
  }

  if (shape.password_resets !== false) {
    const resets = await client.query('SELECT * FROM sc_auth_password_resets WHERE app = $1', [app]);
    resets.rows.forEach((r) => {
      store.password_resets[r.token] = r.data || {};
    });
  }

  if (shape.access_requests) {
    const ar = await client.query('SELECT * FROM sc_auth_access_requests WHERE app = $1', [app]);
    ar.rows.forEach((r) => {
      store.access_requests[r.id] = r.data || {};
    });
  }

  return store;
}

async function saveStore(client, app, store, shape) {
  shape = shape || {};

  if (shape.users !== false) {
    const users = store.users || {};
    const ids = Object.keys(users);
    const existing = await client.query('SELECT id FROM sc_auth_users WHERE app = $1', [app]);
    const existingIds = new Set(existing.rows.map((r) => r.id));

    for (const id of ids) {
      const u = users[id];
      const data = userDataExtras(u);
      await client.query(
        `INSERT INTO sc_auth_users
          (app, id, email, password_hash, name, company, phone, role, status, created_at, last_login_at, login_count, data)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,COALESCE($10::timestamptz, NOW()),$11,$12,$13::jsonb)
         ON CONFLICT (app, id) DO UPDATE SET
           email = EXCLUDED.email,
           password_hash = EXCLUDED.password_hash,
           name = EXCLUDED.name,
           company = EXCLUDED.company,
           phone = EXCLUDED.phone,
           role = EXCLUDED.role,
           status = EXCLUDED.status,
           last_login_at = EXCLUDED.last_login_at,
           login_count = EXCLUDED.login_count,
           data = EXCLUDED.data`,
        [
          app,
          u.id,
          String(u.email || '').toLowerCase(),
          u.password_hash || '',
          u.name || '',
          u.company || '',
          u.phone || '',
          u.role || 'loan_officer',
          u.status || 'active',
          u.created_at || null,
          u.last_login_at || null,
          u.login_count || 0,
          JSON.stringify(data)
        ]
      );
      existingIds.delete(id);
    }
    for (const dead of existingIds) {
      await client.query('DELETE FROM sc_auth_users WHERE app = $1 AND id = $2', [app, dead]);
    }
  }

  if (shape.invites || shape.agent_invites) {
    const map = app === 'lo' ? store.agent_invites || {} : store.invites || {};
    const codes = Object.keys(map);
    const existing = await client.query('SELECT code FROM sc_auth_invites WHERE app = $1', [app]);
    const existingCodes = new Set(existing.rows.map((r) => r.code));

    for (const code of codes) {
      const inv = map[code] || {};
      const base = {
        code: inv.code || code,
        email_optional: inv.email_optional || null,
        created_at: inv.created_at || null,
        expires_at: inv.expires_at || null,
        used_at: inv.used_at || null,
        revoked_at: inv.revoked_at || null
      };
      const data = Object.assign({}, inv);
      // keep full invite in data for bridge fields (inviter_brand, etc.)
      await client.query(
        `INSERT INTO sc_auth_invites
          (app, code, email_optional, created_at, expires_at, used_at, revoked_at, data)
         VALUES ($1,$2,$3,$4::timestamptz,$5::timestamptz,$6::timestamptz,$7::timestamptz,$8::jsonb)
         ON CONFLICT (app, code) DO UPDATE SET
           email_optional = EXCLUDED.email_optional,
           created_at = EXCLUDED.created_at,
           expires_at = EXCLUDED.expires_at,
           used_at = EXCLUDED.used_at,
           revoked_at = EXCLUDED.revoked_at,
           data = EXCLUDED.data`,
        [
          app,
          base.code,
          base.email_optional,
          base.created_at,
          base.expires_at,
          base.used_at,
          base.revoked_at,
          JSON.stringify(data)
        ]
      );
      existingCodes.delete(code);
    }
    for (const dead of existingCodes) {
      await client.query('DELETE FROM sc_auth_invites WHERE app = $1 AND code = $2', [app, dead]);
    }
  }

  if (shape.password_resets !== false) {
    const map = store.password_resets || {};
    const tokens = Object.keys(map);
    const existing = await client.query('SELECT token FROM sc_auth_password_resets WHERE app = $1', [app]);
    const existingTokens = new Set(existing.rows.map((r) => r.token));
    for (const token of tokens) {
      await client.query(
        `INSERT INTO sc_auth_password_resets (app, token, data, created_at)
         VALUES ($1,$2,$3::jsonb,NOW())
         ON CONFLICT (app, token) DO UPDATE SET data = EXCLUDED.data`,
        [app, token, JSON.stringify(map[token] || {})]
      );
      existingTokens.delete(token);
    }
    for (const dead of existingTokens) {
      await client.query('DELETE FROM sc_auth_password_resets WHERE app = $1 AND token = $2', [
        app,
        dead
      ]);
    }
  }

  if (shape.access_requests) {
    const map = store.access_requests || {};
    const ids = Object.keys(map);
    const existing = await client.query('SELECT id FROM sc_auth_access_requests WHERE app = $1', [app]);
    const existingIds = new Set(existing.rows.map((r) => r.id));
    for (const id of ids) {
      await client.query(
        `INSERT INTO sc_auth_access_requests (app, id, data, created_at)
         VALUES ($1,$2,$3::jsonb,NOW())
         ON CONFLICT (app, id) DO UPDATE SET data = EXCLUDED.data`,
        [app, id, JSON.stringify(map[id] || {})]
      );
      existingIds.delete(id);
    }
    for (const dead of existingIds) {
      await client.query('DELETE FROM sc_auth_access_requests WHERE app = $1 AND id = $2', [
        app,
        dead
      ]);
    }
  }

  if (shape.usage_events !== false) {
    const events = Array.isArray(store.usage_events) ? store.usage_events.slice(-5000) : [];
    const keepIds = events.map((ev) => ev.id).filter(Boolean);
    if (keepIds.length) {
      await client.query(
        `DELETE FROM sc_auth_usage_events WHERE app = $1 AND NOT (id = ANY($2::text[]))`,
        [app, keepIds]
      );
    } else {
      await client.query('DELETE FROM sc_auth_usage_events WHERE app = $1', [app]);
    }
    for (const ev of events) {
      const id = ev.id || 'evt_' + crypto.randomBytes(8).toString('base64url');
      await client.query(
        `INSERT INTO sc_auth_usage_events (app, id, user_id, event_type, path, metadata, created_at)
         VALUES ($1,$2,$3,$4,$5,$6::jsonb,COALESCE($7::timestamptz, NOW()))
         ON CONFLICT (app, id) DO NOTHING`,
        [
          app,
          id,
          ev.user_id || null,
          ev.event_type || null,
          ev.path || null,
          JSON.stringify(ev.metadata != null ? ev.metadata : null),
          ev.created_at || null
        ]
      );
    }
  }
}

/**
 * Create withStore(mutator) compatible with existing route code.
 * @param {'lo'|'agent'} app
 * @param {object} shape
 */
function createWithStore(app, shape) {
  let chain = Promise.resolve();

  function withStore(mutator) {
    const p = getPool();
    if (!p) {
      return Promise.reject(new Error('DATABASE_URL not configured for auth'));
    }

    const run = chain.then(async () => {
      await migrate();
      const client = await p.connect();
      try {
        await client.query('BEGIN');
        await client.query('SELECT pg_advisory_xact_lock($1)', [appLockKey(app)]);
        const store = await loadStore(client, app, shape);
        const result = mutator(store);
        // Support async mutators just in case
        const out = result && typeof result.then === 'function' ? await result : result;
        await saveStore(client, app, store, shape);
        await client.query('COMMIT');
        return out;
      } catch (e) {
        try {
          await client.query('ROLLBACK');
        } catch (e2) {
          /* ignore */
        }
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
 * One-time import from legacy file JSON if PG has no users for this app.
 */
async function importFileIfEmpty(app, readFileStore, shape) {
  const p = getPool();
  if (!p || typeof readFileStore !== 'function') return { imported: false };
  await migrate();
  const count = await p.query('SELECT COUNT(*)::int AS n FROM sc_auth_users WHERE app = $1', [app]);
  if (count.rows[0].n > 0) return { imported: false, reason: 'already-has-users' };

  let fileStore;
  try {
    fileStore = readFileStore();
  } catch (e) {
    return { imported: false, reason: 'no-file' };
  }
  if (!fileStore || !fileStore.users || !Object.keys(fileStore.users).length) {
    return { imported: false, reason: 'empty-file' };
  }

  const client = await p.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [appLockKey(app)]);
    await saveStore(client, app, fileStore, shape);
    await client.query(
      `INSERT INTO sc_auth_meta (app, migrated_file_at, notes)
       VALUES ($1, NOW(), $2)
       ON CONFLICT (app) DO UPDATE SET migrated_file_at = NOW(), notes = EXCLUDED.notes`,
      [app, 'imported from local auth-store file']
    );
    await client.query('COMMIT');
    console.log(
      '[auth-pg] imported',
      Object.keys(fileStore.users).length,
      'users for app=',
      app,
      'from file store'
    );
    return { imported: true, users: Object.keys(fileStore.users).length };
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
  if (!isPgEnabled()) return { ok: false, backend: 'file-or-none', reason: 'DATABASE_URL missing' };
  try {
    await migrate();
    const p = getPool();
    const r = await p.query('SELECT 1 AS ok');
    return { ok: r.rows[0].ok === 1, backend: 'postgres' };
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
  health,
  getPool
};
