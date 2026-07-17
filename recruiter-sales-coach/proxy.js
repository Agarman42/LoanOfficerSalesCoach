// proxy.js — Recruiting Sales Coach static host + Grok API proxy (local + Render)
try {
  require('dotenv').config();
} catch (e) {
  // dotenv optional on hosted (env vars come from the platform)
}

const path = require('path');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');

const app = express();
const PORT = Number(process.env.PORT) || 3002;
const ROOT = path.resolve(__dirname);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB — recruiter calls are typically 4–5 MB
});

function getServerApiKey(req) {
  let apiKey = req.headers.authorization?.replace(/^Bearer\s+/i, '').trim();
  if (!apiKey) {
    apiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
  }
  return apiKey || null;
}

/**
 * CORS: never pass Error to the cors callback — that becomes Express 500.
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
        return callback(null, true);
      }
    },
    methods: ['GET', 'POST', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204
  };
}

app.use(cors(buildCorsOptions()));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    service: 'recruiting-sales-coach-proxy',
    hasServerKey: !!(process.env.XAI_API_KEY || process.env.GROK_API_KEY),
    voiceAgentId: process.env.XAI_VOICE_AGENT_ID || 'agent_dPytnYBuJKo5KrKQ',
    node: process.version,
    time: new Date().toISOString()
  });
});

// Static app files
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

// Chat completions (existing tools)
app.post('/api/v1/chat/completions', async (req, res) => {
  try {
    const apiKey = getServerApiKey(req);
    if (!apiKey) {
      return res.status(401).json({
        error:
          'No Grok API key provided. Set XAI_API_KEY on the host, or enter an xai- key in the app (local dev).'
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
    console.error('Proxy chat error:', status || '', error.message);
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({ error: 'Proxy error', message: error.message });
  }
});

/**
 * Ephemeral client secret for browser Voice Agent WebSocket.
 * Never expose the long-lived API key to the client.
 * POST https://api.x.ai/v1/realtime/client_secrets
 */
app.post('/api/voice/client-secret', async (req, res) => {
  try {
    const apiKey = getServerApiKey(req);
    if (!apiKey) {
      return res.status(401).json({
        error: 'No server API key. Set XAI_API_KEY (or GROK_API_KEY) for voice sessions.'
      });
    }

    const seconds = Math.min(
      3600,
      Math.max(60, Number(req.body?.expires_after?.seconds) || 300)
    );

    const response = await axios.post(
      'https://api.x.ai/v1/realtime/client_secrets',
      { expires_after: { seconds } },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const data = response.data || {};
    // Normalize common response shapes for the browser client
    const value =
      data.value ||
      data.client_secret ||
      data.secret ||
      (typeof data.client_secret === 'object' ? data.client_secret?.value : null) ||
      data.token;

    return res.json({
      ...data,
      value: value || null,
      agent_id: process.env.XAI_VOICE_AGENT_ID || 'agent_dPytnYBuJKo5KrKQ',
      expires_in: seconds
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const body = error.response?.data || { error: error.message };
    console.error('[voice] client-secret error:', status, typeof body === 'object' ? JSON.stringify(body).slice(0, 300) : body);
    return res.status(status).json(body);
  }
});

/**
 * Speech-to-text for Call Review uploads.
 * POST multipart field "file" → xAI /v1/stt
 */
app.post('/api/v1/stt', upload.single('file'), async (req, res) => {
  try {
    const apiKey = getServerApiKey(req);
    if (!apiKey) {
      return res.status(401).json({
        error: 'No server API key. Set XAI_API_KEY (or GROK_API_KEY) for transcription.'
      });
    }
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'Missing audio file. Upload field name must be "file".' });
    }

    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname || 'recording.mp3',
      contentType: req.file.mimetype || 'application/octet-stream'
    });

    const response = await axios.post('https://api.x.ai/v1/stt', form, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...form.getHeaders()
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 180000
    });

    return res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const body = error.response?.data || { error: error.message };
    console.error('[stt] error:', status, typeof body === 'object' ? JSON.stringify(body).slice(0, 300) : body);
    return res.status(status).json(body);
  }
});

// SPA fallback — Express 5 safe
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

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('[server] unhandled error:', err && err.message ? err.message : err);
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Max upload is 25 MB.' });
  }
  if (req.path && req.path.startsWith('/api/')) {
    return res.status(500).json({ error: 'Internal server error', message: err.message || 'Unknown' });
  }
  return res.status(500).type('text').send('Internal Server Error');
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Recruiting Grok Proxy on http://0.0.0.0:${PORT}`);
  console.log(`✅ Health: /api/health`);
  console.log(`✅ Voice: POST /api/voice/client-secret`);
  console.log(`✅ STT: POST /api/v1/stt`);
  if (!process.env.XAI_API_KEY && !process.env.GROK_API_KEY) {
    console.log('⚠️  XAI_API_KEY / GROK_API_KEY not set — AI/voice need env or browser key');
  }
});

server.on('error', (err) => {
  console.error('[server] listen failed:', err.message);
  process.exit(1);
});
