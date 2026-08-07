# LO Sales Coach auth (v3.118)

## Architecture

| App | Store | Cookie | Roles |
|-----|--------|--------|--------|
| **LO Sales Coach** | `data/lo-auth-store.json` | `lo_asc_session` (httpOnly, 30d remember) | `loan_officer`, `admin` |
| **Agent Sales Coach** | `realtor-sales-coach/data/auth-store.json` | `asc_session` | `realtor`, `lo`, `admin` |

Separate stores (separate Render services). **Same email = same person long-term**, but accounts are not unified yet.

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
- Admin seed may use any `ADMIN_EMAIL` (e.g. Adam personal).

## UI entry points

| Action | Where |
|--------|--------|
| Sign in / create account | Full-screen gate when logged out |
| Invite realtor | Sidebar **Invite realtor** · account menu |
| Admin LO users | Sidebar **Admin · LO users** (admin only) |

## Env (LO Render)

```
AUTH_SESSION_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD=
AUTH_BRIDGE_SECRET=   # same as Agent
REALTOR_APP_URL=https://ruoffagentsalescoach.onrender.com
```

## Env (Agent Render)

```
AUTH_SESSION_SECRET=
AUTH_BRIDGE_SECRET=   # same as LO
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

## Verify checklist

1. LO tool blocked when logged out  
2. Create `@ruoff.com` account → tools work; `gmail.com` rejected  
3. Remember device cookie `lo_asc_session`  
4. Invite from LO → link works on Agent accept  
5. Realtor cannot open LO tools with Agent session  
6. Admin sees LO users + last login  
7. Existing Agent realtor logins still work  
