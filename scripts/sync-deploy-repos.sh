#!/usr/bin/env bash
# Sync monorepo app folders to the GitHub repos Render actually deploys from.
# Usage:
#   bash scripts/sync-deploy-repos.sh realtor
#   bash scripts/sync-deploy-repos.sh recruiter
#   bash scripts/sync-deploy-repos.sh both
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:-both}"

sync_one() {
  local name="$1"
  local src="$2"
  local repo="$3"
  local msg="$4"

  echo "=== Syncing $name → $repo ==="
  local tmp
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' RETURN

  git clone --depth 1 "https://github.com/${repo}.git" "$tmp/repo"
  cd "$tmp/repo"
  find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +
  rsync -a --exclude node_modules --exclude '.git' --exclude '.env' "$src/" .
  rm -f .env .env.* 2>/dev/null || true

  echo "Version file:"
  grep -E "APP_VERSION|APP_BUILD" js/app-version.js || true

  git add -A
  if git diff --cached --quiet; then
    echo "No changes for $name — remote already matches."
    return 0
  fi

  git commit -m "$msg"
  git push origin HEAD:main
  echo "Pushed $name → $(git rev-parse --short HEAD) on $repo main"
}

if [[ "$TARGET" == "realtor" || "$TARGET" == "both" ]]; then
  sync_one "realtor" \
    "$ROOT/realtor-sales-coach" \
    "Agarman42/RuoffAgentSalesCoach" \
    "Ship Realtor Sales Coach from monorepo (v3.01).

Sync LoanOfficerSalesCoach/realtor-sales-coach for Render deploy."
fi

if [[ "$TARGET" == "recruiter" || "$TARGET" == "both" ]]; then
  sync_one "recruiter" \
    "$ROOT/recruiter-sales-coach" \
    "Agarman42/recruitersalescoach" \
    "Ship Recruiter Sales Coach from monorepo (v2.38).

Sync LoanOfficerSalesCoach/recruiter-sales-coach for Render deploy."
fi

echo "Done."
