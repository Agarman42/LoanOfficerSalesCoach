// proxy.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * CORS policy:
 * - Local dev: allow common localhost ports + any request with no Origin (same-origin static serve)
 * - Production: allow same-origin by default; set CORS_ORIGINS=https://a.com,https://b.com to allowlist
 */
function buildCorsOptions() {
  const envList = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const localOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
  ];

  return {
    origin(origin, callback) {
      // Same-origin / curl / server-to-server (no Origin header)
      if (!origin) return callback(null, true);

      if (envList.length) {
        if (envList.includes(origin) || envList.includes('*')) {
          return callback(null, true);
        }
        return callback(new Error(`CORS blocked for origin: ${origin}`));
      }

      // No allowlist configured: permissive for local + typical dev, still works hosted same-origin
      if (localOrigins.includes(origin)) return callback(null, true);
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);

      // Hosted: allow any https origin when no CORS_ORIGINS set (Render + custom domains)
      // Operators should set CORS_ORIGINS for tighter lock-down.
      if (/^https:\/\//i.test(origin)) return callback(null, true);

      return callback(null, true);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  };
}

app.use(cors(buildCorsOptions()));

// Parse JSON bodies — increased limit because Blog Creator can send large prompts + documents
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static files (the giant index.html etc.) so we can use http:// instead of file://
// This avoids brutal browser caching on the massive single-file HTML.
// Visiting the root URL (/) will automatically serve index.html cleanly
// without appending /index.html to the browser address bar.
app.use(express.static('.', {
    setHeaders: (res, filePath) => {
        // Force no caching for HTML + feature JS so Render deploys are visible immediately
        if (filePath.endsWith('index.html') || filePath.includes('/js/features/') || filePath.includes('/js/')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }
}));

// Health check for deploy / smoke tests
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'lo-sales-coach-proxy',
    hasServerKey: !!(process.env.XAI_API_KEY || process.env.GROK_API_KEY),
    time: new Date().toISOString()
  });
});

// Main proxy route for Grok API
app.post('/api/v1/chat/completions', async (req, res) => {
    try {
        // Prefer key sent from the browser (localStorage via api.js)
        // Fall back to server .env file if no key was sent in header
        let apiKey = req.headers['authorization']?.replace('Bearer ', '').trim();

        if (!apiKey) {
            apiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
        }

        if (!apiKey) {
            return res.status(401).json({
                error: 'No Grok API key provided. Please enter your xai-... key in the app (API Key button) or set XAI_API_KEY (or GROK_API_KEY) in a .env file.'
            });
        }

        // Light request shape validation — avoid empty proxy spam
        if (!req.body || (typeof req.body !== 'object')) {
            return res.status(400).json({ error: 'Invalid request body' });
        }

        const response = await axios.post(
            'https://api.x.ai/v1/chat/completions',
            req.body,
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 180000 // 3 minute timeout for long generations
            }
        );

        res.json(response.data);

    } catch (error) {
        // Do not log full prompts / API keys — status + short message only
        const status = error.response?.status;
        const short =
          (error.response?.data && (error.response.data.error || error.response.data.message)) ||
          error.message;
        console.error('Proxy Error:', status || '', typeof short === 'string' ? short.slice(0, 200) : short);

        if (error.response) {
            // Forward the error from xAI
            res.status(error.response.status).json(error.response.data);
        } else if (error.message && error.message.startsWith('CORS blocked')) {
            res.status(403).json({ error: error.message });
        } else {
            res.status(500).json({
                error: 'Proxy error',
                message: error.message
            });
        }
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`✅ Grok Proxy running on http://localhost:${PORT}`);
    console.log(`✅ Ready to receive requests from your frontend (you can serve the HTML from other ports like 8080 if desired; API calls go to this proxy)`);
    console.log(`✅ Health: http://localhost:${PORT}/api/health`);

    if (!process.env.XAI_API_KEY && !process.env.GROK_API_KEY) {
        console.log('⚠️  Warning: XAI_API_KEY (or GROK_API_KEY) is not set in .env file');
    }
    if (process.env.CORS_ORIGINS) {
        console.log(`✅ CORS allowlist: ${process.env.CORS_ORIGINS}`);
    }
});
