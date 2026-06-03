#!/bin/bash

echo "================================================"
echo "  Starting Grok API Proxy for Loan Officer Coach"
echo "================================================"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Change to the project directory
cd "$SCRIPT_DIR"

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed."
    echo "Please install it with: sudo apt update && sudo apt install -y nodejs npm"
    read -p "Press Enter to exit..."
    exit 1
fi

# Check if proxy.js exists
if [ ! -f "proxy.js" ]; then
    echo "[ERROR] proxy.js was not found in this folder."
    echo "Please run this script from inside the loan-officer-coach folder."
    read -p "Press Enter to exit..."
    exit 1
fi

# Auto-install dependencies if node_modules or key packages are missing
if [ ! -d "node_modules" ] || [ ! -f "node_modules/express/package.json" ] || [ ! -f "node_modules/cors/package.json" ] || [ ! -f "node_modules/axios/package.json" ] || [ ! -f "node_modules/dotenv/package.json" ]; then
    echo "[INFO] Installing required npm packages (express, cors, axios, dotenv)..."
    echo "This only needs to happen once (or after npm clean)."
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERROR] npm install failed."
        echo "Try manually: npm install"
        read -p "Press Enter to exit..."
        exit 1
    fi
    echo "[OK] Packages installed."
    echo ""
fi

echo "[OK] Starting proxy server on http://localhost:3000"
echo ""
echo "=================================================================="
echo "  CRITICAL: OPEN THE APP VIA THE PROXY (NOT FILE://)"
echo "=================================================================="
echo ""
echo "1. Keep THIS terminal window OPEN while using AI features."
echo "2. In your browser, go to:   http://localhost:3000"
echo "   (Do NOT double-click index.html or use file:/// path!)"
echo ""
echo "   Why? The proxy serves the files + bypasses file:// restrictions"
echo "   and aggressive browser caching on this huge single-file app."
echo ""
echo "3. For development: After edits, in DevTools (F12) > Network tab,"
echo "   check 'Disable cache', then hard-refresh (Ctrl/Cmd + Shift + R)."
echo ""
echo "4. The first time you use any AI tool (Newsletter, Blog, Plans, etc.)"
echo "   the app will prompt for your Grok/xAI API key (starts with xai-)."
echo "   Or use the 'API Key' button at the top."
echo ""
echo "   The key is stored only in your browser's localStorage."
echo "   It is sent ONLY to YOUR local proxy (never to any other server)."
echo ""
echo "   Alternative: Put your key in a .env file in this folder:"
echo "     XAI_API_KEY=xai-yourkeyhere"
echo "   (the proxy will fall back to it if no key is sent from the app)."
echo ""
echo "Press Ctrl+C in this window to stop the proxy when done."
echo "=================================================================="
echo ""

# Start the proxy (it will also serve http://localhost:3000/index.html)
node proxy.js