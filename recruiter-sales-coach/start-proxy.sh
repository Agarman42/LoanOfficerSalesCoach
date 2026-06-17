#!/bin/bash

echo "================================================"
echo "  Starting Grok API Proxy for Recruiting Sales Coach"
echo "================================================"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed."
    exit 1
fi

if [ ! -f "proxy.js" ]; then
    echo "[ERROR] proxy.js was not found in this folder."
    exit 1
fi

if [ ! -d "node_modules" ] || [ ! -f "node_modules/express/package.json" ]; then
    echo "[INFO] Installing npm packages..."
    npm install
fi

PORT=${PORT:-3002}
export PORT
echo "[OK] Starting Recruiting proxy on http://localhost:${PORT}"
echo "     LO coach: http://localhost:3000  |  Realtor: http://localhost:3001"
echo ""
PORT=$PORT node proxy.js