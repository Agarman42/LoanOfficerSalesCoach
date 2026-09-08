# Agent Sales Coach — Invite-gated auth (v3.58)

**Scope:** Realtor / Agent Sales Coach only (`realtor-sales-coach/` → RuoffAgentSalesCoach).  
**Not in this pass:** Loan Officer Sales Coach, CRM SSO, `@ruoff.com` restriction.

## Access model

| Path | Who |
|------|-----|
| **Accept invite** | Realtor gets one-time code or link from Adam; sets password; active immediately |
| **Admin create user** | Adam creates email + temp password in Admin · usage |
| **Request access** | Public form creates a pending request + pending user; Admin · usage shows the queue. Emails Adam only if mail is configured — otherwise the queue is the notification. |
| **Event access code** | Admin / LO creates a multi-use code (e.g. mastermind, ~120 uses, event day + 14 days). Realtor: Sign in → Have an access code? |
| **Bulk invite** | Admin / LO pastes emails; pending single-use invites; copy-all + open in email client. Skips active Agent accounts. |
| **Shared LO login** | An `@ruoff.com` user on LO Sales Coach signs into Agent with the same email/password (`role=lo`). No second register. |
| **No public open signup** | Unauthenticated visitors only see login / invite / access code / request |

Roles: `realtor` | `lo` | `admin`. Status: `active` | `pending` | `deactivated`.

### Who can invite

| Actor | Create invites | Reset realtor password | Deactivate / stats / create user |
|-------|----------------|------------------------|----------------------------------|
| **Admin** | Yes | Yes (any user) | Yes |
| **Ruoff LO** (`role=lo` or `@ruoff.com` email) | Yes | Yes (realtor partners only) | No |
| **Realtor** | No | No | No |

LOs get **Invite partners** in the sidebar / account menu. After creating an invite, use **Send Invite via Email** (`mailto:`) with a pre-filled message + link.

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
| `RESEND_API_KEY` or `SMTP_*` | Optional | Forgot-password email via Resend or SMTP (nodemailer). Also set `MAIL_FROM` + `APP_PUBLIC_URL`. Without mail config → **admin temp password** |

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

## Event code for a mastermind (Admin or Ruoff LO)

1. Sign in to Agent Sales Coach → **Admin · usage** (or Invite partners).
2. **Event access code**: label `Realtor mastermind`, code e.g. `MASTERMIND26` (or leave blank), max uses `120`, days open `14`.
3. Create event code — remaining uses show on that card.
4. In the room: realtors open the app → **Have an access code?** → code + name + email + password → they are in.

Invalid, expired, or maxed codes show a clear error. Realtors stay gated; this is not public signup.

## Bulk invite from an email list

1. **Bulk invite** → paste emails (comma, space, or newline).
2. Create invites. Already-active Agent accounts are skipped.
3. **Copy all links** or **Open in email client**.

## Shared login for Ruoff LOs

Use the same `@ruoff.com` email and password as LO Sales Coach on the Agent sign-in screen. Agent creates/links an Agent profile with `role=lo` (not full admin unless the Agent account is already admin). Realtors still need an invite or event code.

## Invite realtors (any Ruoff LO)

1. Sign in with a **@ruoff.com** account (or admin).
2. Open **Invite partners** (sidebar Resources, or account menu).
3. **Generate invite** (optional email lock, default 14 days).
4. Click **Send Invite via Email** (opens Outlook/Mail with link + instructions) — or Copy link/code.
5. Realtor opens link → Accept invite → set password → in the app.

Admin can still **Create user directly** with a temp password.

## Admin / LO actions

**LO + Admin**

- Create invite + **Send Invite via Email**
- Reset password for realtor partners → temp password (copy / email)

**Admin only**

- Activate / deactivate
- Create user with temp password
- Stats + usage events
- Full user list (includes LOs and admins)

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

Without mail config: realtor asks admin/LO → Admin · usage → **Reset pw** → share temp password.  
With `RESEND_API_KEY` or SMTP: Sign in → **Forgot password?** → email with `#reset=TOKEN` link → set new password on the gate.

## Confirm LO Coach untouched

This feature lives only under `realtor-sales-coach/`. Root LO `proxy.js` / LO `js/` were not modified for auth.

## Bridge from LO Sales Coach

`POST /api/auth/bridge/invite` and `POST /api/auth/bridge/invite/revoke` with header `X-Auth-Bridge-Secret` (same `AUTH_BRIDGE_SECRET` as LO app). Used when LOs create realtor invites from LO Sales Coach.
