# Agent Sales Coach — Invite-gated auth (v3.58)

**Scope:** Realtor / Agent Sales Coach only (`realtor-sales-coach/` → RuoffAgentSalesCoach).  
**Not in this pass:** Loan Officer Sales Coach, CRM SSO, `@ruoff.com` restriction.

## Access model

| Path | Who |
|------|-----|
| **Accept invite** | Realtor gets one-time code or link from Adam; sets password; active immediately |
| **Admin create user** | Adam creates email + temp password in Admin · usage |
| **Request access** | Public form creates `pending` user; Adam activates + resets password |
| **No public open signup** | Unauthenticated visitors only see login / invite / request |

Roles: `realtor` | `admin` (Adam). Status: `active` | `pending` | `deactivated`.

## Session

- Cookie: `asc_session` (httpOnly, SameSite=Lax, Secure on HTTPS)
- **Remember this device** (default ON): **30 days**
- Short session (remember off): **12 hours**
- Deactivated users lose access on next request (cookie cleared when status ≠ active)
- Password hashing: Node `scrypt` (no bcrypt native deps)

## Env vars (Render)

| Variable | Required | Notes |
|----------|----------|--------|
| `AUTH_SESSION_SECRET` | **Yes in prod** | Long random string for signing cookies |
| `ADMIN_EMAIL` | Recommended | Default seed: `agarman42@hotmail.com` |
| `ADMIN_PASSWORD` | Recommended | If unset on first boot, a random password is printed once in logs |
| `ADMIN_NAME` | Optional | Default `Adam Garman` |
| `AUTH_SESSION_DAYS` | Optional | Default `30` |
| `AUTH_STORE_PATH` | Optional | Default `data/auth-store.json` |
| `AUTH_DISABLED` | Optional | `1` disables API auth (dev only — never prod) |
| `XAI_API_KEY` | For AI | Unchanged |
| `SMTP_*` | Optional | Forgot-password email not wired yet → use **admin temp password** |

## First boot (local)

```bash
cd realtor-sales-coach
# optional .env
echo "AUTH_SESSION_SECRET=$(openssl rand -hex 32)" >> .env
echo "ADMIN_EMAIL=agarman42@hotmail.com" >> .env
echo "ADMIN_PASSWORD=your-strong-password" >> .env
PORT=3001 node proxy.js
```

Open `http://localhost:3001` → sign in with admin email/password from env (or generated password in server log).

## Invite first 3 test realtors

1. Sign in as admin.
2. Open **Admin · usage** (sidebar Resources, or account menu).
3. **Create invite** (optional email lock, expires 14 days).
4. Copy **code** or **link** (`https://…/#invite=CODE`).
5. Realtor opens link → Accept invite → name + password → in the app.
6. Repeat for realtor 2 and 3.

**Or** use **Create user directly** → share email + temp password securely.

## Admin actions

- Activate / deactivate (blocks login + clears session on next hit)
- Reset password → temp password (clipboard)
- Stats: active / pending / deactivated, logins last 7d
- Recent usage events (`login`, `session_resume`, `tool_open`)

## API (server-enforced)

| Route | Auth |
|-------|------|
| `POST /api/auth/login` | Public (rate-limited) |
| `POST /api/auth/accept-invite` | Public |
| `POST /api/auth/request-access` | Public |
| `GET /api/auth/me` | Cookie session |
| `POST /api/v1/chat/completions` | **Requires active session** |
| `GET/POST /api/admin/*` | **role=admin** |

## Deploy

```bash
# monorepo
git push origin master
# live Agent app
bash scripts/sync-deploy-repos.sh realtor
```

On Render (RuoffAgentSalesCoach), set `AUTH_SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` before first deploy if you want a known admin password.

**Note:** Free Render disk is ephemeral — `data/auth-store.json` resets on redeploy unless you add a persistent disk or Redis later. Re-seed admin via env after wipe.

## Forgot password

Without SMTP: realtor asks Adam → Admin · usage → **Reset pw** → share temp password.  
With SMTP (future): `POST /api/auth/forgot-password` + email link.

## Confirm LO Coach untouched

This feature lives only under `realtor-sales-coach/`. Root LO `proxy.js` / LO `js/` were not modified for auth.
