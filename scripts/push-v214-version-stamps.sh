#!/usr/bin/env bash
# Push v2.14 version stamps to all three deploy repos.
# Usage: GITHUB_TOKEN=ghp_xxx bash scripts/push-v214-version-stamps.sh
set -euo pipefail

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "Set GITHUB_TOKEN first." >&2
  exit 1
fi

WORK="$(cd "$(dirname "$0")/.." && pwd)"
ASKPASS="$(mktemp)"
printf '#!/bin/sh\necho "%s"\n' "$GITHUB_TOKEN" > "$ASKPASS"
chmod 700 "$ASKPASS"
export GIT_ASKPASS="$ASKPASS" GIT_TERMINAL_PROMPT=0
trap 'rm -f "$ASKPASS"' EXIT

MSG="Add v2.14 release version stamp in footer"

echo "==> Realtor (RuoffAgentSalesCoach)"
cd "$WORK/realtor-push-repo"
git add js/app-version.js index.html
git commit -m "$MSG" || true
git push origin main
echo "REALTOR: $(git rev-parse --short HEAD)"

echo "==> Loan Officer (LoanOfficerSalesCoach)"
cd "$WORK"
git add js/app-version.js index.html \
  realtor-sales-coach/js/app-version.js realtor-sales-coach/index.html \
  recruiter-sales-coach/js/app-version.js recruiter-sales-coach/index.html \
  realtor-push-repo
git commit -m "$MSG" || true
git push origin master
echo "LO: $(git rev-parse --short HEAD)"

echo "==> Recruiter (recruitersalescoach)"
RECRUIT_TMP="$(mktemp -d)"
git clone --depth 1 https://github.com/Agarman42/recruitersalescoach.git "$RECRUIT_TMP/recruiter"
cp "$WORK/recruiter-sales-coach/js/app-version.js" "$RECRUIT_TMP/recruiter/js/app-version.js"
cp "$WORK/recruiter-sales-coach/index.html" "$RECRUIT_TMP/recruiter/index.html"
cd "$RECRUIT_TMP/recruiter"
git add js/app-version.js index.html
git commit -m "$MSG"
git push origin main
echo "RECRUITER: $(git rev-parse --short HEAD)"
rm -rf "$RECRUIT_TMP"

echo "Done."