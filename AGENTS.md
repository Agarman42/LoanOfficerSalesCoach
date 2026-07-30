# Agent notes — Loan Officer / Realtor coaches

## Git branches (MANDATORY for pushes)

This monorepo deploys **two different apps from two different branches**. Never assume one push updates both.

| App | Branch | Remote | Typical Render root / notes |
|-----|--------|--------|-----------------------------|
| **Loan Officer Sales Coach** | **`master`** | `origin` → `LoanOfficerSalesCoach` | Repo root (`index.html`, `js/`, `proxy.js`) |
| **Realtor / Agent Sales Coach** | **`main`** | same `origin` | Usually `realtor-sales-coach/` (confirm Render root) |

### Rules

1. **LO only** → commit + push **`master`** only.
2. **Realtor only** → commit + push **`main`** only (do not dump full LO history onto `main`).
3. **Both** → two explicit steps:
   - Push LO changes to **`master`**
   - Update **`main`** with Realtor files (`realtor-sales-coach/…` and any shared deps Realtor needs) and push **`main`**
4. **Never** treat “push both” as a single `git push origin master`.
5. `master` and `main` have **diverged** — prefer porting `realtor-sales-coach/` (and required files) onto `main` over a blind full merge.

### Versions

Bump and report from:

- LO: `js/app-version.js` → `window.APP_VERSION`
- Realtor: `realtor-sales-coach/js/app-version.js` → `window.APP_VERSION`

After push, state clearly: **which branch(es)** and **which version(s)** landed.

---

## Related docs

- `docs/PORT-NOTES-REALTOR-RECRUITER.md` — what to port LO → Realtor/Recruiter
- `docs/ACCESS-AND-BRANDING-NOTES.md` — branding / partner hosts

**Last reinforced:** 2026-07-30 (user: LO = master, Realtor = main — agents must not forget).
