#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/adam/.grok/worktrees/adam-loan-officer-coach/2026-06-15-8460fdeb"

install_if_needed() {
  local dir="$1"
  if [[ ! -d "$dir/node_modules" ]]; then
    echo "Installing dependencies in $dir..."
    (cd "$dir" && npm install --silent)
  fi
}

install_if_needed "$ROOT"
install_if_needed "$ROOT/realtor-sales-coach"
install_if_needed "$ROOT/recruiter-sales-coach"

echo "Starting LO Coach proxy on port 3000..."
(cd "$ROOT" && PORT=3000 node proxy.js) &
PID1=$!

echo "Starting Agent Sales Coach proxy on port 3001..."
(cd "$ROOT/realtor-sales-coach" && PORT=3001 node proxy.js) &
PID2=$!

echo "Starting Recruiter Sales Coach proxy on port 3002..."
(cd "$ROOT/recruiter-sales-coach" && PORT=3002 node proxy.js) &
PID3=$!

sleep 2

echo ""
echo "=== Proxy status ==="
for port in 3000 3001 3002; do
  if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port/" 2>/dev/null | grep -qE '^[0-9]+$'; then
    echo "Port $port: UP"
  else
    echo "Port $port: checking process..."
    if ss -tlnp 2>/dev/null | grep -q ":$port " || netstat -tlnp 2>/dev/null | grep -q ":$port "; then
      echo "Port $port: UP (listening)"
    else
      echo "Port $port: DOWN or not ready"
    fi
  fi
done

echo ""
echo "PIDs: LO=$PID1 Realtor=$PID2 Recruiter=$PID3"
wait