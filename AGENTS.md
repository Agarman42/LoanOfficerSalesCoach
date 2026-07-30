# Agent notes — Loan Officer / Realtor coaches

## Deploy map (MANDATORY — this is why Render can show v3.01 forever)

Render does **not** deploy the monorepo `realtor-sales-coach/` folder by itself.
Each live app has its **own GitHub repo**. Pushing only `LoanOfficerSalesCoach` does **not** update production Realtor.

| App | Source of truth (monorepo) | GitHub repo Render deploys | Branch | Live URL |
|-----|----------------------------|----------------------------|--------|----------|
| **LO Sales Coach** | repo root (`index.html`, `js/`, `proxy.js`, `smart-savings/`) | `Agarman42/LoanOfficerSalesCoach` | **`master`** | loanofficersalescoach.onrender.com |
| **Realtor / Agent Sales Coach** | `realtor-sales-coach/` | **`Agarman42/RuoffAgentSalesCoach`** (flat root) | **`main`** | ruoffagentsalescoach.onrender.com |
| **Recruiter Sales Coach** | `recruiter-sales-coach/` | `Agarman42/recruitersalescoach` | **`main`** | (recruiter Render service) |

### After changing Realtor (or Recruiter)

1. Commit monorepo changes (usually on `master` in `LoanOfficerSalesCoach`).
2. **Sync deploy repo** so Render sees them:

```bash
bash scripts/sync-deploy-repos.sh realtor    # → RuoffAgentSalesCoach main
# bash scripts/sync-deploy-repos.sh recruiter
# bash scripts/sync-deploy-repos.sh both
```

3. Confirm Render **RuoffAgentSalesCoach** builds a commit whose message includes the **current** monorepo `realtor-sales-coach` version (not a stale “v3.01” sync).

### Monorepo branches (secondary)

| Branch on `LoanOfficerSalesCoach` | Role |
|-----------------------------------|------|
| **`master`** | LO production + monorepo source of truth |
| **`main`** | May hold ported Realtor tree for convenience; **Render Agent service does not use this for deploy** — it uses `RuoffAgentSalesCoach` |

### Rules

1. **LO only** → commit + push monorepo **`master`**.
2. **Realtor only** → update `realtor-sales-coach/` in monorepo, commit, then **`bash scripts/sync-deploy-repos.sh realtor`**.
3. **Both** → monorepo `master` push **and** realtor sync script (two steps).
4. **Never** assume `git push origin main` on the monorepo updates the live Agent tool.
5. Bump versions: LO `js/app-version.js`; Realtor `realtor-sales-coach/js/app-version.js`.

### Versions

- LO: `js/app-version.js` → `window.APP_VERSION`
- Realtor: `realtor-sales-coach/js/app-version.js` → `window.APP_VERSION`

After push/sync, state: monorepo commit, deploy-repo commit (if any), and versions.

---

## Commits when user says “commit” / “push”

1. Commit **all tool changes** since last commit for apps in scope (LO root, `realtor-sales-coach/`, `smart-savings/`, shared scripts).
2. **Do not omit** related tool work (e.g. Smart Savings) to keep a commit small.
3. **Do not** commit: unrelated projects, Word docs, screenshots, dump HTML, generated reports.
4. Push monorepo correctly, then **run deploy-repo sync** when Realtor/Recruiter production must update.
5. Report what landed where.

**Last reinforced:** 2026-07-30 — Render Agent = `RuoffAgentSalesCoach` main, not monorepo main alone.
