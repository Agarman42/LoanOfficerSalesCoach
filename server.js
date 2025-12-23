const express = require('express');
const fetch = require('node-fetch');
const path = require('path');  // Add this for serving static files
const app = express();

app.use(express.json({ limit: '10mb' }));

// Serve static files (HTML, CSS, JS, manifest, icons, service worker) from the current directory
app.use(express.static(path.join(__dirname, '.')));

const GROK_API_KEY = process.env.GROK_API_KEY;

if (!GROK_API_KEY) {
    console.error('GROK_API_KEY not set! Add it in environment variables.');
}

app.post('/api/chat', async (req, res) => {
    try {
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROK_API_KEY}`
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Proxy failed' });
    }
});

// Catch-all route to serve index.html for any unmatched paths (enables client-side routing if needed)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/', (req, res) => res.send('Grok proxy running!'));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Running on port ${port}`));
