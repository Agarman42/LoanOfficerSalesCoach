// proxy.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS so your frontend can call this proxy
app.use(cors());

// Parse JSON bodies — increased limit because Blog Creator can send large prompts + documents
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check route (optional but useful)
app.get('/', (req, res) => {
    // Redirect root to the main app HTML so http://localhost:3000 just works
    res.redirect('/index.html');
});

// Serve static files (the giant index.html etc.) so we can use http:// instead of file://
// This avoids brutal browser caching on the massive single-file HTML
app.use(express.static('.', {
    setHeaders: (res, path) => {
        if (path.endsWith('index.html')) {
            // Force no caching for the main file so edits to rich modals etc. are always fresh
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }
}));

// Main proxy route for Grok API
app.post('/api/v1/chat/completions', async (req, res) => {
    try {
        // Prefer key sent from the browser (localStorage via api.js)
        // Fall back to server .env file if no key was sent in header
        let apiKey = req.headers['authorization']?.replace('Bearer ', '').trim();

        if (!apiKey) {
            apiKey = process.env.XAI_API_KEY;
        }

        if (!apiKey) {
            return res.status(401).json({ 
                error: 'No Grok API key provided. Please enter your xai-... key in the app (API Key button) or set XAI_API_KEY in a .env file.'
            });
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
        console.error('Proxy Error:', error.response?.data || error.message);

        if (error.response) {
            // Forward the error from xAI
            res.status(error.response.status).json(error.response.data);
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
    
    if (!process.env.XAI_API_KEY) {
        console.log('⚠️  Warning: XAI_API_KEY is not set in .env file');
    }
});