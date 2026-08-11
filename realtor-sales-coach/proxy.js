// proxy.js — Agent Sales Coach static host + Grok API proxy + invite-gated auth
try {
  require('dotenv').config();
} catch (e) {
  // dotenv optional on hosted (env vars come from the platform)
}

const path = require('path');
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const ROOT = path.resolve(__dirname);

/**
 * CORS: never pass Error to the cors callback — that becomes Express 500.
 * Credentials: true so session cookie works when CORS_ORIGINS is set.
 */
function buildCorsOptions() {
  const envList = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    origin(origin, callback) {
      try {
        if (!origin) return callback(null, true);

        if (envList.length) {
          if (envList.includes('*') || envList.includes(origin)) {
            return callback(null, true);
          }
          console.warn('[cors] blocked origin:', origin);
          return callback(null, false);
        }

        return callback(null, true);
      } catch (e) {
        console.warn('[cors] handler error — allowing request', e.message);
        return callback(null, true);
      }
    },
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204
  };
}

app.use(cors(buildCorsOptions()));

// Parse JSON bodies — Blog Creator can send large prompts + documents
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ── Auth (Realtor / Agent) — Postgres when DATABASE_URL is set ──
let authApi = null;
let agentAuthBackend = 'unknown';
try {
  const { mountAuthRoutes } = require('./server/auth-routes');
  const {
    seedAdminIfNeeded,
    STORE_PATH,
    initBackend,
    USE_PG,
    authPgHealth
  } = require('./server/auth-store');
  authApi = mountAuthRoutes(app);
  initBackend()
    .then((info) => {
      agentAuthBackend = (info && info.backend) || (USE_PG ? 'postgres' : 'file');
      if (agentAuthBackend === 'file' && (process.env.RENDER || process.env.NODE_ENV === 'production')) {
        console.error(
          '[auth] CRITICAL: auth is file-backed on a production host — set DATABASE_URL or accounts will wipe on redeploy'
        );
      }
      return seedAdminIfNeeded();
    })
    .then((r) => {
      if (r && r.seeded) {
        console.log('[auth] Seeded admin account:', r.email);
        if (r.generated && r.password) {
          console.log(
            '[auth] Generated ADMIN password (copy now — not shown again):',
            r.password
          );
        } else {
          console.log('[auth] Admin password from ADMIN_PASSWORD env');
        }
      } else {
        console.log(
          '[auth] Admin already present — backend:',
          agentAuthBackend,
          agentAuthBackend === 'file' ? STORE_PATH : 'sc_auth_users app=agent'
        );
      }
      return typeof authPgHealth === 'function' ? authPgHealth() : null;
    })
    .then((h) => {
      if (h) console.log('[auth] health', JSON.stringify(h));
    })
    .catch((e) => {
      agentAuthBackend = 'postgres-error';
      console.error('[auth] init/seed failed', e.message, e.stack);
    });
  console.log('[auth] Invite-gated auth enabled for Agent Sales Coach');
} catch (e) {
  agentAuthBackend = 'mount-error';
  console.warn('[auth] failed to mount', e && e.message ? e.message : e);
}

// Health first (Render / monitors) — never blocked by auth
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    service: 'agent-sales-coach-proxy',
    hasServerKey: !!(process.env.XAI_API_KEY || process.env.GROK_API_KEY),
    auth: process.env.AUTH_DISABLED === '1' ? 'disabled' : 'enabled',
    authBackend: agentAuthBackend || (process.env.DATABASE_URL ? 'postgres' : 'file'),
    authDurable: !!(agentAuthBackend === 'postgres' || process.env.DATABASE_URL),
    node: process.version,
    time: new Date().toISOString()
  });
});

// Static app files — do not expose node_modules / .git / env / data store
app.use(
  express.static(ROOT, {
    index: false, // auth gate handles index; SPA fallback below
    dotfiles: 'ignore',
    setHeaders(res, filePath) {
      if (
        filePath.endsWith('index.html') ||
        filePath.includes(`${path.sep}js${path.sep}`) ||
        filePath.includes(`${path.sep}css${path.sep}`)
      ) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
      // Never serve auth data via static
      if (filePath.includes(`${path.sep}data${path.sep}`)) {
        res.statusCode = 404;
      }
    }
  })
);

// Block direct data path
app.use('/data', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Grok / xAI chat completions proxy — requires signed-in active user
app.post('/api/v1/chat/completions', (req, res, next) => {
  if (authApi && typeof authApi.requireAuthForApi === 'function') {
    return authApi.requireAuthForApi(req, res, next);
  }
  next();
}, async (req, res) => {
  try {
    let apiKey = req.headers.authorization?.replace(/^Bearer\s+/i, '').trim();

    if (!apiKey) {
      apiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
    }

    if (!apiKey) {
      return res.status(401).json({
        error:
          'No Grok API key provided. Set XAI_API_KEY (or GROK_API_KEY) on the host, or enter an xai- key in the app (local dev).'
      });
    }

    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const response = await axios.post('https://api.x.ai/v1/chat/completions', req.body, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 180000
    });

    return res.json(response.data);
  } catch (error) {
    const status = error.response?.status;
    const short =
      (error.response?.data && (error.response.data.error || error.response.data.message)) ||
      error.message;
    console.error('Proxy Error:', status || '', typeof short === 'string' ? short.slice(0, 200) : short);

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({
      error: 'Proxy error',
      message: error.message || 'Unknown proxy failure'
    });
  }
});

// SPA-style fallback: unknown non-API GETs → index.html
// Express 5: bare "*" crashes boot; absolute sendFile paths need { root }.
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found', path: req.path });
  }
  if (res.headersSent) return next();
  return res.sendFile('index.html', { root: ROOT }, (err) => {
    if (err) next(err);
  });
});

// Final error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('[server] unhandled error:', err && err.message ? err.message : err);
  if (req.path && req.path.startsWith('/api/')) {
    return res.status(500).json({ error: 'Internal server error', message: err.message || 'Unknown' });
  }
  return res.status(500).type('text').send('Internal Server Error');
});

// Dual-stack: browsers often resolve "localhost" to IPv6 ::1 first.
const server = app.listen({ port: PORT, host: '::', ipv6Only: false }, () => {
  console.log(`✅ Agent Sales Coach on http://localhost:${PORT} (IPv4+IPv6)`);
  console.log(`✅ Health: /api/health`);
  console.log(`✅ Auth: /api/auth/*  Admin: /api/admin/*`);
  console.log(`✅ Static root: ${ROOT}`);
  if (!process.env.XAI_API_KEY && !process.env.GROK_API_KEY) {
    console.log('⚠️  XAI_API_KEY / GROK_API_KEY not set — AI calls need a browser key or env var');
  }
  if (!process.env.AUTH_SESSION_SECRET && !process.env.SESSION_SECRET) {
    console.log(
      '⚠️  AUTH_SESSION_SECRET not set — using fallback. Set a long random secret on Render.'
    );
  }
});

server.on('error', (err) => {
  console.error('[server] listen failed:', err.message);
  process.exit(1);
});
