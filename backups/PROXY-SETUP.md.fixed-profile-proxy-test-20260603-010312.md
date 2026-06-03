# Grok Proxy Setup (for AI features like 2026 Plan, Weekly Win, Newsletter, etc.)

The app requires a local proxy (proxy.js) to call the Grok/xAI API securely (handles keys, CORS, serves files without file:// or cache issues).

## Quick Start (Linux/macOS/WSL)
1. In terminal, cd to this folder.
2. Run: `bash start-proxy.sh` (or `PORT=8080 bash start-proxy.sh` to change port)
   - Keeps window open.
3. Open in browser: http://localhost:3000 (or your PORT)
   - Or, run your own static server on e.g. 8080 (live-server, python -m http.server 8080, etc.) and open http://localhost:8080/
   - API calls always go to the proxy (default localhost:3000, or your PORT). The HTML serving port can differ.

## For custom ports (your case: HTML on 8080)
- Run proxy (defaults to 3000 for API + serve).
- Open your HTML from http://localhost:8080/
- If proxy on different port (e.g. you did PORT=8080 ...), in browser console before generating: 
  `window.CUSTOM_PROXY_URL = 'http://localhost:8080/api/v1/chat/completions';`
- Then generate plan etc. (or reload page after setting).

See start-proxy.sh for full instructions printed on launch.

## API Key
- Enter via "API Key" button or auto-prompt on first AI use.
- Or put in .env: `XAI_API_KEY=xai-...`

## Troubleshooting API errors mentioning 3000
- The error UI reminds you to run the proxy.
- As long as proxy is running (on whatever PORT you chose), and you set CUSTOM_PROXY_URL if not default, it works even if HTML is served from 8080.
- If fetch fails: ensure proxy terminal shows "Grok Proxy running", check no firewall, use same machine (localhost), hard refresh.
- To diagnose from browser: open console on your page (e.g. http://localhost:8080), run `window.testProxyConnection()` . It will log and alert the result of reaching the proxy (and the exact PROXY_URL in use).

## Saving versions for fallback
Good working snapshots are in backups/ (e.g. index.html.good-current-*, main.js etc). Copy back as needed.

Backups of good versions are in the backups/ folder (e.g. index.html.good-current-...).
