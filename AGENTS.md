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

---

## Commits when user says “commit” / “push”

When Adam asks to **commit** (or commit + push):

1. Commit **all tool changes since the last commit** for apps we have been working on in this monorepo (LO root, `realtor-sales-coach/`, `smart-savings/`, and any shared host/scripts those need).
2. **Do not omit** related tool work (e.g. Smart Savings under LO) just to keep a commit “small.”
3. **Do not** commit: unrelated projects (e.g. recruiter if not in scope), Word docs, screenshots/PNGs, dump HTML copies (`index REALTOR.html`), generated reports (`_sync_report.txt`), or random personal files.
4. Push with the branch rules above (LO/`smart-savings` → **`master`**, Realtor → **`main`**).
5. After push, state clearly what was committed, what was left out, and which branch(es) / version(s).
