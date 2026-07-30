# Agent notes — Loan Officer / Realtor coaches

> **Adam 2026-07-30:** “Every other time I’ve asked you to deploy you do it correctly… make note of this so you update it correctly in the future.”  
> Live Agent Render = **`RuoffAgentSalesCoach`**, **not** monorepo `main` alone.

---

## Deploy map (MANDATORY — read before any push/deploy)

### What Render actually watches

| Live app | Render service | **GitHub repo that must receive the code** | Branch | Source in monorepo |
|----------|----------------|--------------------------------------------|--------|--------------------|
| **LO Sales Coach** | loan-officer-sales-coach | `Agarman42/LoanOfficerSalesCoach` | **`master`** | Repo root |
| **Realtor / Agent Sales Coach** | **RuoffAgentSalesCoach** | **`Agarman42/RuoffAgentSalesCoach`** (flat app — `index.html` at root) | **`main`** | `realtor-sales-coach/` |
| **Recruiter** | (recruiter service) | `Agarman42/recruitersalescoach` | **`main`** | `recruiter-sales-coach/` |

### ❌ Wrong (causes “stuck on v3.01” / old production)

- Pushing monorepo **`LoanOfficerSalesCoach` `main`** only and calling it a “Realtor deploy”
- Porting `realtor-sales-coach/` onto monorepo `main` and **skipping** the deploy-repo sync
- Assuming monorepo `master` + `realtor-sales-coach/` folder auto-deploys the Agent tool

### ✅ Correct Realtor production deploy

```bash
# 1) Commit monorepo (source of truth) on master as usual
git push origin master

# 2) REQUIRED for live Agent app — copies realtor-sales-coach/ → RuoffAgentSalesCoach main
bash scripts/sync-deploy-repos.sh realtor
```

Render then builds **`Agarman42/RuoffAgentSalesCoach`** (e.g. commit message  
`Ship Realtor Sales Coach from monorepo (v3.23)`).

Recruiter:

```bash
bash scripts/sync-deploy-repos.sh recruiter
# or both:
bash scripts/sync-deploy-repos.sh both
```

### When user says “deploy” / “push both” / “push Realtor”

| Ask | Do this |
|-----|---------|
| Deploy / push **LO** | `git push origin master` (monorepo) |
| Deploy / push **Realtor** | monorepo commit if needed + **`bash scripts/sync-deploy-repos.sh realtor`** |
| Deploy / push **both** | monorepo `master` push **and** `sync-deploy-repos.sh realtor` (and recruiter only if in scope) |

Always report:

1. Monorepo commit SHA (if any)  
2. **Deploy-repo** SHA on `RuoffAgentSalesCoach` (Realtor)  
3. Version from `realtor-sales-coach/js/app-version.js` / LO `js/app-version.js`

### Versions

- LO: `js/app-version.js` → `window.APP_VERSION`  
- Realtor: `realtor-sales-coach/js/app-version.js` → `window.APP_VERSION` (sync script reads this into the deploy commit message)

---

## Commits when user says “commit” / “push”

1. Commit **all tool changes** since last commit for apps in scope (LO root, `realtor-sales-coach/`, `smart-savings/`, related scripts).  
2. Do **not** omit related tool work (e.g. Smart Savings).  
3. Do **not** commit: unrelated projects, Word docs, screenshots, dump HTML, generated reports.  
4. For production: monorepo push **plus** deploy-repo sync when Realtor/Recruiter must go live.  
5. State clearly what landed where.

### Monorepo branches (secondary only)

| Branch | Role |
|--------|------|
| **`master`** | LO production + monorepo source of truth |
| **`main`** | Optional/legacy monorepo branch — **does not replace** `RuoffAgentSalesCoach` for Render |

---

## Related docs

- `docs/ACCESS-AND-BRANDING-NOTES.md` — deploy remotes table  
- `docs/PORT-NOTES-REALTOR-RECRUITER.md` — port LO → Realtor  
- `scripts/sync-deploy-repos.sh` — **the** Render sync for Realtor/Recruiter  

**Last reinforced:** 2026-07-30 (Render Agent = `RuoffAgentSalesCoach` main via sync script).
