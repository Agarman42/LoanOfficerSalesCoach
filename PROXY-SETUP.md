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

---

## Production Deployment (Users Do NOT Enter API Keys)

The goal for public v2: End users should **never** have to get or paste an xAI API key. You (the owner) provide the key server-side.

### Recommended: Deploy on Render.com (similar to v1 experience)

1. Make sure your repo on GitHub contains the current structure:
   - `index.html`
   - `js/` (api.js, main.js, features/, ui.js, ...)
   - `css/main.css`
   - `proxy.js`
   - `package.json` + `package-lock.json`
   - `start-proxy.sh` (and .bat if wanted)
   - `.gitignore` (important — do not commit .env or node_modules)

2. On Render.com:
   - New → Web Service
   - Connect your GitHub repo (or use "Deploy from existing" if already connected)
   - Name it something like `loan-officer-coach-v2`
   - **Root Directory**: leave as `/` (or the subfolder if you have one)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node proxy.js`
   - **Plan**: Free (or paid if you want no sleep)

3. In the Render service settings → **Environment** tab:
   - Add environment variable:
     - Key: `XAI_API_KEY`
     - Value: `xai-` + **your real production key** (create a dedicated one at https://x.ai if you want to keep dev keys separate)
   - Save.

4. Deploy. Render will build and give you a public URL like `https://loan-officer-coach-v2.onrender.com`.

5. Users visit that single URL. 
   - The proxy serves the entire app.
   - Because `XAI_API_KEY` is set in Render's environment, the proxy uses it automatically.
   - The frontend detects it is not running on localhost and **skips all API key prompts and localStorage key requirements**.
   - The "API Key" button in the header changes to "API Managed" (informational).

### Updates / Bug fixes / Small deploys

- Make your change locally.
- `git add .`
- `git commit -m "fix: whatever the change is"`
- `git push`
- Render will auto-deploy (or click "Manual Deploy" in the dashboard).

You do **not** upload single files anymore. The multi-file structure is handled by git + the Node service.

### Alternative: Split hosting (static + separate proxy)

- Host `index.html` + `js/` + `css/` on Netlify, Vercel, Cloudflare Pages, or GitHub Pages (very fast CDN).
- Host only the proxy on Render/Railway (tiny resource usage).
- In the hosted static frontend, the `getProxyUrl()` logic (or `CUSTOM_PROXY_URL`) must point at your public proxy URL (e.g. `https://your-proxy.onrender.com/api/v1/chat/completions`).
- The proxy on the server still uses its `XAI_API_KEY` env var.
- This is slightly more work but can be cheaper/faster for the UI.

### How the code supports "no key for users"

- `js/api.js` has `isProductionHosted()` which returns true when the page is not on localhost/127.0.0.1.
- `ensureApiKey()` skips the prompt in hosted mode.
- `callGrokAPI` only sends an `Authorization` header if a local key exists. Otherwise the proxy falls back to `process.env.XAI_API_KEY`.
- The API Key modal (js/main.js) detects hosted mode and shows a friendly "server managed" message instead of input fields.

This means the same codebase works for:
- Local development (you run `bash start-proxy.sh`, enter your dev key via the button).
- Public hosted version (users see zero key UI, you pay for / manage the key on the server).

### .env and secrets

- Never commit `.env` or real keys.
- The `.gitignore` now covers `.env`, `node_modules`, etc.
- On Render (or any host) you set secrets via the dashboard environment variables.

### Custom domain

Once happy on the Render URL, you can add a custom domain in Render settings (or point a domain at Netlify + proxy separately).

Let me know when you're ready to test the hosted-mode behavior locally (we can simulate by changing the hostname check or setting a flag).
