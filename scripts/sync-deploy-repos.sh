#!/usr/bin/env bash
# Sync monorepo app folders to the GitHub repos Render actually deploys from.
#
# Render does NOT deploy monorepo LoanOfficerSalesCoach/main for the Agent app.
# It deploys flat repos:
#   Realtor  → Agarman42/RuoffAgentSalesCoach  (branch main)
#   Recruiter → Agarman42/recruitersalescoach  (branch main)
#
# Usage:
#   bash scripts/sync-deploy-repos.sh realtor
#   bash scripts/sync-deploy-repos.sh recruiter
#   bash scripts/sync-deploy-repos.sh both
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:-both}"

read_app_version() {
  local f="$1"
  if [[ -f "$f" ]]; then
    grep -E "window\.APP_VERSION\s*=" "$f" | head -1 | sed -E "s/.*['\"]([0-9.]+)['\"].*/\1/" || echo "unknown"
  else
    echo "unknown"
  fi
}

sync_one() {
  local name="$1"
  local src="$2"
  local repo="$3"
  local ver
  ver="$(read_app_version "$src/js/app-version.js")"
  local msg="Ship ${name} Sales Coach from monorepo (v${ver}).

Sync LoanOfficerSalesCoach source for Render deploy."

  echo "=== Syncing $name v${ver} → $repo ==="
  local tmp
  tmp="$(mktemp -d)"
  # shellcheck disable=SC2064
  trap "rm -rf '$tmp'" RETURN

  git clone --depth 1 "https://github.com/${repo}.git" "$tmp/repo"
  cd "$tmp/repo"
  find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +
  rsync -a --exclude node_modules --exclude '.git' --exclude '.env' "$src/" .
  rm -f .env .env.* 2>/dev/null || true

  echo "Version file after copy:"
  grep -E "APP_VERSION|APP_BUILD" js/app-version.js || true

  git add -A
  if git diff --cached --quiet; then
    echo "No changes for $name — remote already matches."
    return 0
  fi

  git commit -m "$msg"
  git push origin HEAD:main
  echo "Pushed $name → $(git rev-parse --short HEAD) on $repo main (v${ver})"
}

if [[ "$TARGET" == "realtor" || "$TARGET" == "both" ]]; then
  sync_one "Realtor" \
    "$ROOT/realtor-sales-coach" \
    "Agarman42/RuoffAgentSalesCoach"
fi

if [[ "$TARGET" == "recruiter" || "$TARGET" == "both" ]]; then
  sync_one "Recruiter" \
    "$ROOT/recruiter-sales-coach" \
    "Agarman42/recruitersalescoach"
fi

echo "Done."
