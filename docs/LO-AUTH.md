# LO Sales Coach auth (v3.132+)

## Architecture

| App | Durable store | Cookie | Roles |
|-----|----------------|--------|--------|
| **LO Sales Coach** | Postgres `sc_auth_*` rows with `app='lo'` | `lo_asc_session` (httpOnly, 30d remember) | `loan_officer`, `admin` |
| **Agent Sales Coach** | Postgres `sc_auth_*` rows with `app='agent'` | `asc_session` | `realtor`, `lo`, `admin` |

**Primary backend is Postgres** via `DATABASE_URL` (same DB as CRM: `sales_coach_crm_db`). Auth tables use the `sc_auth_` prefix so they never touch CRM tables.

Local file JSON (`data/lo-auth-store.json` / `data/auth-store.json`) is **fallback only** when `DATABASE_URL` is unset (local dev). On Render, file storage is ephemeral — do not rely on it.

Separate apps share one DB but **are not merged**: `app` column distinguishes LO vs Agent. Same email = same person long-term conceptually, but accounts remain separate rows per app.

### Realtor invites from LO tool

1. LO signs into LO Sales Coach (`@ruoff.com` or admin).
2. **Invite realtor** → create code (optional email lock).
3. LO server POSTs to Agent: `POST {REALTOR_APP_URL}/api/auth/bridge/invite` with header `X-Auth-Bridge-Secret: {AUTH_BRIDGE_SECRET}`.
4. Agent stores invite in **its** invite table (same model as LO-created invites on Agent).
5. Link: `https://ruoffagentsalescoach.onrender.com/#invite=CODE`
6. Realtor accepts on Agent → **Agent access only**.

Must set the **same** `AUTH_BRIDGE_SECRET` on both Render services.

## @ruoff.com

- Register / non-admin login: **must** end with `@ruoff.com` (server-side).
- Error copy: `Use your Ruoff email (@ruoff.com).`
- Admin seed may use any `ADMIN_EMAIL` (e.g. Adam personal). Additional admins: **Admin · Usage → Make admin** on a LO user (or set `role: admin` in the auth store).

## Forgot password (email)

Self-serve reset mirrors Agent:

1. Sign in screen → **Forgot password?** (enter `@ruoff.com` email first).
2. If mail is configured, user gets `#reset=TOKEN` link (1 hour).
3. They set a new password on the gate and sign in.

**Render env (LO service):**

```
RESEND_API_KEY=re_...
MAIL_FROM=Loan Officer Sales Coach <noreply@yourverifieddomain.com>
APP_PUBLIC_URL=https://loanofficersalescoach.onrender.com
```

Or SMTP (`SMTP_URL` / `SMTP_HOST`…). Without mail config, use **Admin · Usage → Reset password** and share a temp password.

## UI entry points

| Action | Where |
|--------|--------|
| Sign in / create account | Full-screen gate when logged out |
| Invite a realtor partner | **Home → Partners card (primary)**, sidebar “Invite a realtor partner”, `#invite-realtors` page. One invite = account + LO branding on accept; short partner link is optional for people already on Agent. |
| My Profile / Sign out | Header **My Profile** opens profile modal — Sign out is in the profile account bar |
| Admin usage & LO users | Sidebar **Admin · Usage** (admin only) — who signed up, last login, login counts, tools opened (7d), agent invites across LOs, activate/deactivate, reset password, promote admin |

### Branding on invite (bridge)

Invite payload includes `inviter_brand`: name, email, phone, NMLS, headshotUrl, title, company, location, optional partner_token / partner_share_url (from LO partner publish).  
Agent stores it on the invite and copies to `user.linked_lo_brand` on accept.  
Agent UI applies it via header LO plate + sticky footer (`lo-brand-chrome.js` / `applyLinkedLoBrand`).

## Env (LO Render)

```
DATABASE_URL=             # required — prefer Render **External** Database URL
# DATABASE_URL_EXTERNAL=  # optional override if DATABASE_URL is internal-only
# RENDER_DB_REGION=oregon # used only if host is bare dpg-xxx-a (no domain)
AUTH_SESSION_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD=
AUTH_BRIDGE_SECRET=       # same as Agent
REALTOR_APP_URL=https://ruoffagentsalescoach.onrender.com
# AUTH_FORCE_FILE=1       # local only — force file store even if DATABASE_URL set
```

## Env (Agent Render)

```
DATABASE_URL=             # prefer External URL (same CRM Postgres OK)
# DATABASE_URL_EXTERNAL=
# RENDER_DB_REGION=oregon
AUTH_SESSION_SECRET=
AUTH_BRIDGE_SECRET=       # same as LO
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

### Render `DATABASE_URL` gotcha

If login fails with `getaddrinfo ENOTFOUND dpg-…-a`, the URL is using a **private internal hostname** that this web service cannot resolve.

**Fix:** In Render → Postgres → **Connections** → copy the **External Database URL** into each web service’s `DATABASE_URL` (or `DATABASE_URL_EXTERNAL`).

## Auth tables (auto-created on startup)

- `sc_auth_store` — durable auth document per app (users, invites, resets)
- `sc_auth_users` — optional denormalized projection (debug; not on hot path)
- `sc_auth_usage_events` — **append-only** usage/track rows (not rewritten with the blob)
- `sc_auth_meta` — one-time file→PG migration markers

### Performance (P0)

| Path | Behavior |
|------|----------|
| Session / `loadActiveUser` | **Read-only** snapshot (no store rewrite) |
| `/api/auth/me` | Write only when daily `session_resume` is new |
| `/api/auth/track` (+ Agent heartbeat) | **INSERT** one usage row only |
| Admin GETs needing activity | Read-only + hydrate usage from SQL |

Login, invites, password reset still use full withStore RMW (required to mutate users/invites).

On first boot with empty PG tables, existing local JSON auth files (if present) are imported once.

## Verify checklist

1. LO tool blocked when logged out  
2. Create `@ruoff.com` account → tools work; `gmail.com` rejected  
3. Remember device cookie `lo_asc_session`  
4. Invite from LO → link works on Agent accept  
5. Realtor cannot open LO tools with Agent session  
6. Admin sees LO users + last login  
7. Existing Agent realtor logins still work  
8. `/api/health` shows `authBackend: "postgres"` and `authDurable: true` on Render  
9. After redeploy, users and admin list still present (no wipe)  
