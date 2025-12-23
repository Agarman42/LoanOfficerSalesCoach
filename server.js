const express = require('express');
const fetch = require('node-fetch');
const app = express();

// Allow JSON body parsing
app.use(express.json({ limit: '10mb' }));

// Your real Grok API key — keep it secret!
const GROK_API_KEY = 'gsk_YOUR_REAL_GROK_API_KEY_HERE';  // ← Replace with your actual key

// Proxy endpoint
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
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check (optional)
app.get('/', (req, res) => {
    res.send('Grok proxy is running!');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Proxy server running on port ${port}`);
});