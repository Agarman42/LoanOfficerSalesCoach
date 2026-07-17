// proxy.js — Agent Sales Coach static host + Grok API proxy (local + Render)
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
 * Use callback(null, false) to deny, callback(null, true) to allow.
 */
function buildCorsOptions() {
  const envList = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    origin(origin, callback) {
      try {
        // Same-origin, curl, health checks, server-to-server
        if (!origin) return callback(null, true);

        if (envList.length) {
          if (envList.includes('*') || envList.includes(origin)) {
            return callback(null, true);
          }
          // Deny without throwing (avoids Internal Server Error pages)
          console.warn('[cors] blocked origin:', origin);
          return callback(null, false);
        }

        // Default: allow (local dev + Render same-origin + custom domains)
        return callback(null, true);
      } catch (e) {
        console.warn('[cors] handler error — allowing request', e.message);
        return callback(null, true);
      }
    },
    methods: ['GET', 'POST', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204
  };
}

app.use(cors(buildCorsOptions()));

// Parse JSON bodies — Blog Creator can send large prompts + documents
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health first (Render / monitors) — never blocked by static
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    service: 'agent-sales-coach-proxy',
    hasServerKey: !!(process.env.XAI_API_KEY || process.env.GROK_API_KEY),
    node: process.version,
    time: new Date().toISOString()
  });
});

// Static app files — do not expose node_modules / .git / env
app.use(
  express.static(ROOT, {
    index: 'index.html',
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
    }
  })
);

// Grok / xAI chat completions proxy
app.post('/api/v1/chat/completions', async (req, res) => {
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

// Final error handler — always JSON for API, plain text otherwise (never uncaught crash)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('[server] unhandled error:', err && err.message ? err.message : err);
  if (req.path && req.path.startsWith('/api/')) {
    return res.status(500).json({ error: 'Internal server error', message: err.message || 'Unknown' });
  }
  return res.status(500).type('text').send('Internal Server Error');
});

// Bind 0.0.0.0 so Render / Docker can reach the process
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Grok Proxy running on http://0.0.0.0:${PORT}`);
  console.log(`✅ Health: /api/health`);
  console.log(`✅ Static root: ${ROOT}`);
  if (!process.env.XAI_API_KEY && !process.env.GROK_API_KEY) {
    console.log('⚠️  XAI_API_KEY / GROK_API_KEY not set — AI calls need a browser key or env var');
  }
});

server.on('error', (err) => {
  console.error('[server] listen failed:', err.message);
  process.exit(1);
});
