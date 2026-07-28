# Access control & LO-branded Realtor coach — product notes

Last updated: 2026-07-27 (conversation capture for future implementation)

## 1. Access control options (summary)

### Goals
- Stop competitors from using a forwarded public link.
- Low friction for internal LOs.
- External realtors are not company employees (no VPN / not necessarily @ruoff.com).

### LO Coach — recommended Phase 1
**Email one-time code, only for `@ruoff.com` (and any other confirmed company domains).**
- User enters email → server sends code **only** if domain is allowed → user enters code → session.
- No pre-collected list of every LO required.
- Public knowledge of `name@ruoff.com` is not enough without inbox access.
- Protect **UI and `/api` (Grok proxy)** with the same session.
- Effort: ~2–4 days if email provider ready; up to ~1 week with DNS/IT.

### Realtor Coach — not the same domain rule
Partners use personal/brokerage email. Options:
- **Invite / allowlist + email code or Google sign-in** (any domain, but must be invited).
- **LO invites realtor** (distributes admin load).
- **Request access** after Google/email proof; admin or LO approves.
- Shared company password: weak long-term (one leak = everyone).

### Shared architecture
Same stack for both apps:
- Session cookies + middleware on Express proxy.
- Different **policy** per app: LO = domain gate; Realtor = invite list.
- Do **not** use company-SSO-only or VPN-only as the sole solution for both products.

### Auth providers vs DIY
- DIY on `proxy.js` + Resend/SendGrid is fine for Ruoff OTP.
- Clerk/Auth0/Supabase speed up Google + allowlist later.
- Avoid storing passwords yourself if possible (magic link / Google / OTP).

### What “knowing an email” does **not** grant
Correct designs require **proof of control** (code in inbox or real Google login) **and** policy (domain or invite). Typing a public email alone must never open the app.

## 2. LO-personalized Realtor coach (shell branding)

**Not** branding of generated content — branding of the **tool chrome** the realtor sees: LO name, contact, optional headshot.

### Options (easiest → richest)

| Approach | How it works | Pros | Cons |
|----------|--------------|------|------|
| **A. Query / path link** | LO shares `realtor-coach?lo=adam` or `/r/adam` | Simple; one deploy | Guessable slugs; need allowlist of LO ids |
| **B. Invite token** | Unique link `?t=xyz` maps to LO profile server-side | Harder to forge; revocable | Needs small DB |
| **C. LO “share portal” UI** | LO copies branded link from LO Coach after profile complete | Best UX for sales team | Build share screen |
| **D. Subdomain / white-label host** | `adam.partners.example.com` | Premium feel | DNS + multi-tenant ops |

### Data source
- LO profile already in LO Coach (name, phone, email, photo URL, NMLS, markets).
- On Realtor app load: resolve LO id/token → load public LO card → render header/footer “Provided by [LO] · contact · photo”.
- Realtor’s own profile (for their content) stays separate from LO brand chrome.

### Recommended path
1. LO completes profile (name, phone, email, headshot URL).
2. LO Coach generates **share link** with opaque token or short code.
3. Realtor opens link → Realtor Coach loads with **LO brand bar** (photo, name, phone, email, optional “Book with me”).
4. Later: same link only works if LO is active + realtor is invited (ties to auth).

### Privacy
- Only fields LO marks public for partner tools.
- No internal LO notes or company-only data on the realtor shell.

## 3. Implementation sequencing (suggested)
1. LO `@ruoff.com` OTP + session + API lock.
2. Header/UX polish (ongoing).
3. Realtor invite/OTP or Google + allowlist.
4. LO share link + branded Realtor chrome from LO public profile.
5. Admin revoke + basic audit (who logged in).


## Realtor parity backlog (2026-07-28)

### Shipped in Realtor v3.06 (2026-07-28)

1. ✅ Sidebar default closed (`main.js` prefersCollapsed + body class + early script)
2. ✅ Header layout (true-centered title/search/quote; far-right theme/profile; `#lo-brand-plate` hook for LO branding phase)
3. ✅ Head defer for user-profile / home-favorites / onboarding-coach
4. ✅ Onboarding paint (single rAF + re-paint at 0/120ms)
5. ✅ Newsletter empty hide + review handoff + scroll-to-ready
6. ✅ coach-polish.js (Realtor-adapted: no equity scanner)
7. ✅ Version → 3.06

### Intentionally not ported (LO-only)

Smart Savings package, Mortgage Calculator, Equity Scanner, Underwriting, app-bulk.

### Deploy remotes (do not mix up)

| App | GitHub repo | Branch to push |
|-----|-------------|----------------|
| **LO Sales Coach** | `Agarman42/LoanOfficerSalesCoach` monorepo | **`master`** |
| **Realtor / Agent Sales Coach** | `Agarman42/RuoffAgentSalesCoach` (flat app root) | **`main`** |

Monorepo path for Realtor source of truth: `realtor-sales-coach/`. After LO monorepo commits, **also sync** that folder to `RuoffAgentSalesCoach` `main` or production stays on an old version.

### Personally branded Realtor tool (MVP 2026-07-28+)

#### Durable cards cost: **$0**

Links use **signed tokens** (HMAC). The public card lives in the `?lo=` value and is verified with `PARTNER_CARD_SECRET`.  
Free Render redeploys **do not wipe** these links. No paid database required.

| Approach | Cost | Survives redeploy? |
|----------|------|--------------------|
| **Signed token (primary)** | Free | Yes |
| File JSON on free disk | Free | No (optional cache only) |
| Paid Postgres / disk | Paid | Yes (not needed now) |

#### Production wiring (Render)

**LO service env**
- `REALTOR_APP_URL=https://<realtor-on-render>` — share/email links point at production  
- `PARTNER_CARD_SECRET=<long random string>` — keep stable (changing it invalidates old links)  
- `XAI_API_KEY` as today  

**Realtor**
- Set `<meta name="lo-partner-api" content="https://<lo-on-render>">` in `index.html` so plates can fetch the LO API.

#### API (LO host)
- `POST /api/partner/publish` → `{ token, shareUrl, card, durable: true }`  
- `GET /api/partner/:token` → public card  

#### LO UI
Sidebar + Home **Share with Partners**; publish **auto-copies** link; **Email to realtor** opens mail app with subject/body/link (LO only types To: address; Outlook signature attaches).

#### Realtor UI
Header brand plate + sticky footer **Provided by your Loan Officer** with clickable phone/email.

**Later:** revoke UI, OTP, invite-only access.

