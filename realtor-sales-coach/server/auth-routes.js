/**
 * Realtor Agent Sales Coach — auth API + session middleware.
 * Cookie: asc_session (httpOnly, signed HMAC). Default 30-day remember.
 */
'use strict';

const crypto = require('crypto');
const store = require('./auth-store');
const mail = require('./mail');

const COOKIE_NAME = 'asc_session';
const SESSION_DAYS_REMEMBER = Number(process.env.AUTH_SESSION_DAYS || 30);
const SESSION_HOURS_SHORT = Number(process.env.AUTH_SESSION_HOURS_SHORT || 12);
const LOGIN_MAX_ATTEMPTS = 12;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

/** @type {Map<string, { n: number, reset: number }>} */
const loginAttempts = new Map();

function sessionSecret() {
  return String(
    process.env.AUTH_SESSION_SECRET ||
      process.env.SESSION_SECRET ||
      process.env.PARTNER_CARD_SECRET ||
      process.env.XAI_API_KEY ||
      process.env.GROK_API_KEY ||
      'dev-only-auth-session-secret-change-me'
  );
}

function isProdHttps(req) {
  if (process.env.FORCE_SECURE_COOKIE === '1') return true;
  if (process.env.NODE_ENV === 'production') return true;
  const xf = String(req.headers['x-forwarded-proto'] || '');
  return xf.split(',')[0].trim() === 'https';
}

function b64url(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromB64url(str) {
  const s = String(str || '').replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Buffer.from(s + pad, 'base64').toString('utf8');
}

function signPayload(payloadObj) {
  const body = b64url(JSON.stringify(payloadObj));
  const sig = crypto
    .createHmac('sha256', sessionSecret())
    .update(body)
    .digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token) {
  try {
    const parts = String(token || '').split('.');
    if (parts.length !== 2) return null;
    const [body, sig] = parts;
    const expect = crypto
      .createHmac('sha256', sessionSecret())
      .update(body)
      .digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expect);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(fromB64url(body));
    if (!payload || !payload.uid || !payload.exp) return null;
    if (Date.now() > Number(payload.exp)) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  header.split(';').forEach((part) => {
    const i = part.indexOf('=');
    if (i === -1) return;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

function setSessionCookie(res, req, token, maxAgeSec) {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.max(60, maxAgeSec)}`
  ];
  if (isProdHttps(req)) parts.push('Secure');
  res.append('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(res, req) {
  const parts = [
    `${COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0'
  ];
  if (isProdHttps(req)) parts.push('Secure');
  res.append('Set-Cookie', parts.join('; '));
}

function clientIp(req) {
  const xf = String(req.headers['x-forwarded-for'] || '')
    .split(',')[0]
    .trim();
  return xf || req.socket?.remoteAddress || 'unknown';
}

function rateLimitLogin(ip) {
  const now = Date.now();
  let row = loginAttempts.get(ip);
  if (!row || now > row.reset) {
    row = { n: 0, reset: now + LOGIN_WINDOW_MS };
    loginAttempts.set(ip, row);
  }
  row.n += 1;
  if (row.n > LOGIN_MAX_ATTEMPTS) {
    return false;
  }
  return true;
}

function clearLoginAttempts(ip) {
  loginAttempts.delete(ip);
}

function createSessionToken(userId, remember) {
  const days = remember ? SESSION_DAYS_REMEMBER : SESSION_HOURS_SHORT / 24;
  const ms = remember
    ? SESSION_DAYS_REMEMBER * 24 * 60 * 60 * 1000
    : SESSION_HOURS_SHORT * 60 * 60 * 1000;
  const exp = Date.now() + ms;
  const token = signPayload({ uid: userId, exp, r: remember ? 1 : 0 });
  return { token, maxAgeSec: Math.floor(ms / 1000), exp };
}

async function loadActiveUser(userId) {
  // Read-only: session checks must not rewrite the full auth blob on every API call
  return store.withStore((s) => {
    const u = store.findUserById(s, userId);
    if (!u) return null;
    if (u.status !== 'active') return { blocked: true, user: u };
    return { blocked: false, user: u };
  }, { readOnly: true });
}

/**
 * Attach req.authUser (public) when session valid + active.
 */
function sessionMiddleware(req, res, next) {
  req.authUser = null;
  req.authSession = null;
  try {
    const cookies = parseCookies(req);
    const raw = cookies[COOKIE_NAME];
    if (!raw) return next();
    const payload = verifyToken(raw);
    if (!payload) return next();
    loadActiveUser(payload.uid)
      .then((row) => {
        if (!row || row.blocked) {
          // Deactivated or missing — clear cookie so client re-auths
          if (row && row.blocked) clearSessionCookie(res, req);
          return next();
        }
        req.authUser = store.publicUser(row.user);
        req.authSession = payload;
        next();
      })
      .catch(() => next());
  } catch (e) {
    next();
  }
}

function requireAuth(req, res, next) {
  if (!req.authUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.authUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (!store.isAdmin(req.authUser)) {
    return res.status(403).json({ error: 'Admin only' });
  }
  next();
}

/** Admin, role=lo, or any @ruoff.com account — create invites + reset realtor passwords */
function requireInviteManager(req, res, next) {
  if (!req.authUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (!store.canInvite(req.authUser)) {
    return res.status(403).json({
      error: 'Only Ruoff loan officers and admins can manage invites'
    });
  }
  next();
}

function genInviteCode() {
  return crypto.randomBytes(5).toString('base64url').toUpperCase();
}

function genTempPassword() {
  return crypto.randomBytes(8).toString('base64url');
}

function appBaseUrl(req) {
  return String(
    process.env.REALTOR_APP_URL ||
      process.env.PUBLIC_APP_URL ||
      `${req.protocol}://${req.get('host')}`
  ).replace(/\/$/, '');
}

function inviteLinkFor(req, code) {
  return `${appBaseUrl(req)}/#invite=${encodeURIComponent(code)}`;
}

function buildInviteMailto({ link, code, toEmail, fromName }) {
  const subject = "You're invited to the Ruoff Agent Sales Coach";
  const who = fromName || 'your Ruoff loan officer';
  const body =
    'Hi,\n\n' +
    "You've been invited to the Ruoff Agent Sales Coach — practical tools for realtors who partner with Ruoff Mortgage.\n\n" +
    'Create your free account here (one-time link):\n' +
    link +
    '\n\n' +
    'Or open the app and enter invite code: ' +
    code +
    '\n\n' +
    'It only takes a minute — set your password and you are in.\n\n' +
    'Questions? Just reply to this email.\n\n' +
    'Thanks,\n' +
    who +
    '\n';
  const addr = toEmail ? encodeURIComponent(toEmail) : '';
  return (
    'mailto:' +
    addr +
    '?subject=' +
    encodeURIComponent(subject) +
    '&body=' +
    encodeURIComponent(body)
  );
}

/** LOs may only reset active/pending realtor (partner) accounts — not admin/LO. */
function loMayResetTarget(actor, target) {
  if (!target) return false;
  if (store.isAdmin(actor)) return true;
  if (target.role === 'admin' || target.role === 'lo') return false;
  if (store.isRuoffEmail(target.email)) return false;
  return target.role === 'realtor' || target.role === 'pending' || !target.role;
}

function mountAuthRoutes(app) {
  // CORS: allow credentials when origins restricted
  app.use((req, res, next) => {
    // Ensure Set-Cookie works cross-subdomain only if needed — same-origin default
    next();
  });

  app.use(sessionMiddleware);

  // ── Public auth endpoints ──────────────────────────────────

  app.get('/api/auth/config', (_req, res) => {
    res.json({
      ok: true,
      rememberDays: SESSION_DAYS_REMEMBER,
      shortHours: SESSION_HOURS_SHORT,
      inviteRequired: true,
      requestAccessEnabled: true,
      smtpConfigured: mail.isConfigured(),
      mailConfigured: mail.isConfigured(),
      app: 'realtor-agent-sales-coach'
    });
  });

  app.get('/api/auth/me', async (req, res) => {
    if (!req.authUser) {
      return res.status(401).json({ authenticated: false });
    }
    // Daily session_resume (once per UTC day) — write only when needed
    try {
      const today = new Date().toISOString().slice(0, 10);
      const needsResume = await store.withStore((s) => {
        const u = store.findUserById(s, req.authUser.id);
        if (!u) return false;
        return u._last_resume_day !== today;
      }, { readOnly: true });
      if (needsResume) {
        await store.withStore((s) => {
          const u = store.findUserById(s, req.authUser.id);
          if (!u) return;
          if (u._last_resume_day !== today) {
            u._last_resume_day = today;
            store.recordUsage(s, u.id, 'session_resume', req.path || '/');
          }
        });
      }
    } catch (e) {
      /* ignore */
    }
    return res.json({
      authenticated: true,
      user: req.authUser,
      capabilities: {
        invite: store.canInvite(req.authUser),
        admin: store.isAdmin(req.authUser)
      }
    });
  });

  app.post('/api/auth/login', async (req, res) => {
    const ip = clientIp(req);
    if (!rateLimitLogin(ip)) {
      return res.status(429).json({ error: 'Too many login attempts. Try again in 15 minutes.' });
    }
    const email = store.normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');
    const remember = req.body?.remember !== false && req.body?.remember !== 'false';

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    try {
      const result = await store.withStore((s) => {
        const u = store.findUserByEmail(s, email);
        if (!u || !store.verifyPassword(password, u.password_hash)) {
          return { ok: false, code: 401, error: 'Invalid email or password' };
        }
        if (u.status === 'deactivated') {
          return { ok: false, code: 403, error: 'Account deactivated. Contact your Ruoff partner.' };
        }
        if (u.status === 'pending') {
          return { ok: false, code: 403, error: 'Account pending approval.' };
        }
        if (u.status !== 'active') {
          return { ok: false, code: 403, error: 'Account not active.' };
        }
        // Promote legacy @ruoff.com accounts to LO role so invites work
        if (store.isRuoffEmail(u.email) && u.role === 'realtor') {
          u.role = 'lo';
        }
        u.last_login_at = new Date().toISOString();
        u.login_count = (u.login_count || 0) + 1;
        store.recordUsage(s, u.id, 'login', '/login', { remember: !!remember });
        return { ok: true, user: store.publicUser(u) };
      });

      if (!result.ok) {
        return res.status(result.code).json({ error: result.error });
      }

      clearLoginAttempts(ip);
      const sess = createSessionToken(result.user.id, remember);
      setSessionCookie(res, req, sess.token, sess.maxAgeSec);
      return res.json({
        ok: true,
        user: result.user,
        session: {
          expiresAt: new Date(sess.exp).toISOString(),
          remember
        }
      });
    } catch (e) {
      console.error('[auth] login error', e.message, e.stack);
      return res.status(500).json({
        error: 'Login failed',
        detail: String(e.message || 'database error').slice(0, 240)
      });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    clearSessionCookie(res, req);
    res.json({ ok: true });
  });

  app.post('/api/auth/accept-invite', async (req, res) => {
    const code = String(req.body?.code || req.body?.invite_code || '')
      .trim()
      .toUpperCase();
    const email = store.normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');
    const name = String(req.body?.name || '').trim();
    const company = String(req.body?.company || '').trim();
    const phone = String(req.body?.phone || '').trim();
    const referred = String(req.body?.referred_by_lo_name || '').trim();
    const remember = req.body?.remember !== false;

    if (!code || !password || password.length < 8) {
      return res.status(400).json({
        error: 'Invite code and password (min 8 characters) required'
      });
    }
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    try {
      const result = await store.withStore((s) => {
        const inv = s.invites[code];
        if (!inv) return { ok: false, code: 400, error: 'Invalid invite code' };
        if (inv.used_at) return { ok: false, code: 400, error: 'Invite already used' };
        if (inv.revoked_at) return { ok: false, code: 400, error: 'Invite was revoked' };
        if (inv.expires_at && new Date(inv.expires_at).getTime() < Date.now()) {
          return { ok: false, code: 400, error: 'Invite expired' };
        }
        if (inv.email_optional && email && inv.email_optional !== email) {
          return {
            ok: false,
            code: 400,
            error: 'This invite is locked to a different email'
          };
        }
        const finalEmail = inv.email_optional || email;
        if (!finalEmail) {
          return { ok: false, code: 400, error: 'Email is required' };
        }
        if (store.findUserByEmail(s, finalEmail)) {
          return { ok: false, code: 409, error: 'An account with this email already exists — sign in instead' };
        }
        const id = store.newId('usr');
        const now = new Date().toISOString();
        const emailNorm = store.normalizeEmail(finalEmail);
        const brand = inv.inviter_brand && typeof inv.inviter_brand === 'object' ? inv.inviter_brand : null;
        const loName =
          referred ||
          (brand && brand.name) ||
          inv.created_by_name ||
          '';
        s.users[id] = {
          id,
          email: emailNorm,
          password_hash: store.hashPassword(password),
          name,
          company,
          phone,
          role: store.resolveRole(emailNorm, null),
          status: 'active',
          invite_code: code,
          invited_by: inv.created_by || null,
          referred_by_lo_name: loName,
          linked_lo_brand: brand,
          created_at: now,
          last_login_at: now,
          login_count: 1
        };
        inv.used_at = now;
        inv.used_by_user_id = id;
        store.recordUsage(s, id, 'login', '/accept-invite', { invite: code });
        return { ok: true, user: store.publicUser(s.users[id]), brand: brand };
      });

      if (!result.ok) {
        return res.status(result.code).json({ error: result.error });
      }
      const sess = createSessionToken(result.user.id, remember);
      setSessionCookie(res, req, sess.token, sess.maxAgeSec);
      return res.json({
        ok: true,
        user: result.user,
        linked_lo_brand: result.brand || (result.user && result.user.linked_lo_brand) || null
      });
    } catch (e) {
      console.error('[auth] accept-invite', e.message, e.stack);
      return res.status(500).json({
        error: 'Could not accept invite',
        detail: String(e.message || 'database error').slice(0, 240)
      });
    }
  });

  app.post('/api/auth/request-access', async (req, res) => {
    const email = store.normalizeEmail(req.body?.email);
    const name = String(req.body?.name || '').trim();
    const company = String(req.body?.company || '').trim();
    const phone = String(req.body?.phone || '').trim();
    const referred = String(req.body?.referred_by_lo_name || '').trim();
    const note = String(req.body?.note || '').trim().slice(0, 500);

    if (!email || !name) {
      return res.status(400).json({ error: 'Name and email required' });
    }

    try {
      await store.withStore((s) => {
        if (store.findUserByEmail(s, email)) {
          return;
        }
        const id = store.newId('req');
        s.access_requests[id] = {
          id,
          email,
          name,
          company,
          phone,
          referred_by_lo_name: referred,
          note,
          status: 'pending',
          created_at: new Date().toISOString()
        };
        // Also create pending user so admin can activate
        const uid = store.newId('usr');
        s.users[uid] = {
          id: uid,
          email,
          password_hash: store.hashPassword(genTempPassword()),
          name,
          company,
          phone,
          role: 'realtor',
          status: 'pending',
          invite_code: null,
          invited_by: null,
          referred_by_lo_name: referred,
          created_at: new Date().toISOString(),
          last_login_at: null,
          login_count: 0,
          access_request_id: id,
          access_note: note
        };
      });
      return res.json({
        ok: true,
        message:
          'Request submitted. An admin will review and invite you shortly.'
      });
    } catch (e) {
      return res.status(500).json({ error: 'Could not submit request' });
    }
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    const email = store.normalizeEmail(req.body?.email);
    // Always generic response (no email enumeration)
    const mailReady = mail.isConfigured();
    const generic = {
      ok: true,
      message: mailReady
        ? 'If that email has an account, we sent a reset link. Check your inbox (and spam) within the hour.'
        : 'If that email has an account, ask your admin (or Ruoff LO) to issue a temporary password from Admin · usage.'
    };
    if (!email) return res.json(generic);

    try {
      const token = crypto.randomBytes(24).toString('base64url');
      let userFound = false;
      await store.withStore((s) => {
        const u = store.findUserByEmail(s, email);
        if (!u || u.status === 'deactivated') return;
        userFound = true;
        s.password_resets[token] = {
          user_id: u.id,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
        };
        // Log token only in non-production for admin recovery
        if (process.env.NODE_ENV !== 'production' || process.env.AUTH_LOG_RESET_TOKENS === '1') {
          console.log(
            `[auth] password reset token for ${email}: ${token} (1h)`
          );
        }
      });

      if (userFound && mailReady) {
        const base = mail.publicAppUrl(req);
        const resetUrl = base + '/#reset=' + encodeURIComponent(token);
        const sendResult = await mail.sendMail({
          to: email,
          subject: 'Reset your Agent Sales Coach password',
          text:
            'Reset your Agent Sales Coach password using this link (expires in 1 hour):\n\n' +
            resetUrl +
            '\n\nIf you did not request this, you can ignore this email.',
          html:
            '<p>Reset your <strong>Agent Sales Coach</strong> password using the link below (expires in 1 hour):</p>' +
            '<p><a href="' +
            resetUrl +
            '">' +
            resetUrl +
            '</a></p>' +
            '<p>If you did not request this, you can ignore this email.</p>'
        });
        if (!sendResult.ok) {
          console.warn('[auth] password reset email not sent:', sendResult.reason);
        }
      }
      return res.json(generic);
    } catch (e) {
      return res.json(generic);
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    const token = String(req.body?.token || '').trim();
    const password = String(req.body?.password || '');
    if (!token || password.length < 8) {
      return res.status(400).json({ error: 'Valid token and new password (min 8) required' });
    }
    try {
      const result = await store.withStore((s) => {
        const row = s.password_resets[token];
        if (!row) return { ok: false, error: 'Invalid or expired reset link' };
        if (new Date(row.expires_at).getTime() < Date.now()) {
          delete s.password_resets[token];
          return { ok: false, error: 'Invalid or expired reset link' };
        }
        const u = store.findUserById(s, row.user_id);
        if (!u || u.status === 'deactivated') {
          return { ok: false, error: 'Account not available' };
        }
        u.password_hash = store.hashPassword(password);
        delete s.password_resets[token];
        return { ok: true };
      });
      if (!result.ok) return res.status(400).json({ error: result.error });
      return res.json({ ok: true, message: 'Password updated. You can sign in.' });
    } catch (e) {
      return res.status(500).json({ error: 'Reset failed' });
    }
  });

  app.post('/api/auth/heartbeat', requireAuth, async (req, res) => {
    try {
      // Append-only — no full auth blob rewrite
      await store.appendUsage(req.authUser.id, 'heartbeat', req.body?.path || '/');
    } catch (e) {
      /* ignore */
    }
    res.json({ ok: true });
  });

  app.post('/api/auth/track', requireAuth, async (req, res) => {
    const eventType = String(req.body?.event_type || 'tool_open').slice(0, 64);
    const feature = String(req.body?.feature || req.body?.path || '').slice(0, 200);
    try {
      await store.appendUsage(req.authUser.id, eventType, feature, { source: 'client' });
    } catch (e) {
      /* ignore */
    }
    res.json({ ok: true });
  });

  // ── Admin + LO invite managers ─────────────────────────────

  app.get('/api/admin/stats', requireAdmin, async (req, res) => {
    try {
      const data = await store.withStore((s) => {
        const users = Object.values(s.users);
        const now = Date.now();
        const d7 = now - 7 * 864e5;
        const d30 = now - 30 * 864e5;
        const active = users.filter((u) => u.status === 'active').length;
        const pending = users.filter((u) => u.status === 'pending').length;
        const deactivated = users.filter((u) => u.status === 'deactivated').length;
        const logins7 = users.filter(
          (u) => u.last_login_at && new Date(u.last_login_at).getTime() >= d7
        ).length;
        const logins30 = users.filter(
          (u) => u.last_login_at && new Date(u.last_login_at).getTime() >= d30
        ).length;
        const openInvites = Object.values(s.invites).filter(
          (i) => !i.used_at && (!i.expires_at || new Date(i.expires_at).getTime() > now)
        ).length;
        return {
          totals: {
            users: users.length,
            active,
            pending,
            deactivated,
            openInvites
          },
          logins: { last7d: logins7, last30d: logins30 }
        };
      }, { readOnly: true, includeUsage: true });
      res.json({ ok: true, ...data });
    } catch (e) {
      res.status(500).json({ error: 'Stats failed' });
    }
  });

  app.get('/api/admin/users', requireInviteManager, async (req, res) => {
    try {
      const isAdm = store.isAdmin(req.authUser);
      const list = await store.withStore((s) => {
        let users = Object.values(s.users).map((u) => store.publicUser(u));
        if (!isAdm) {
          // LOs: realtor partners only (for password reset)
          users = users.filter(
            (u) =>
              u.role === 'realtor' ||
              (u.status === 'pending' && !store.isRuoffEmail(u.email) && u.role !== 'lo' && u.role !== 'admin')
          );
        }
        return users.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
      }, { readOnly: true });
      res.json({ ok: true, users: list, scope: isAdm ? 'all' : 'realtors' });
    } catch (e) {
      res.status(500).json({ error: 'List failed' });
    }
  });

  app.post('/api/admin/users', requireAdmin, async (req, res) => {
    const email = store.normalizeEmail(req.body?.email);
    const name = String(req.body?.name || '').trim();
    const company = String(req.body?.company || '').trim();
    const phone = String(req.body?.phone || '').trim();
    let roleReq = req.body?.role;
    if (roleReq !== 'admin' && roleReq !== 'lo' && roleReq !== 'realtor') roleReq = null;
    const role = store.resolveRole(email, roleReq === 'admin' ? 'admin' : roleReq);
    let tempPassword = String(req.body?.password || '').trim();

    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name required' });
    }
    if (!tempPassword || tempPassword.length < 8) {
      tempPassword = genTempPassword();
    }

    try {
      const result = await store.withStore((s) => {
        if (store.findUserByEmail(s, email)) {
          return { ok: false, code: 409, error: 'Email already registered' };
        }
        const id = store.newId('usr');
        const now = new Date().toISOString();
        s.users[id] = {
          id,
          email,
          password_hash: store.hashPassword(tempPassword),
          name,
          company,
          phone,
          role,
          status: 'active',
          invite_code: null,
          invited_by: req.authUser.id,
          referred_by_lo_name: String(req.body?.referred_by_lo_name || '').trim(),
          created_at: now,
          last_login_at: null,
          login_count: 0
        };
        return { ok: true, user: store.publicUser(s.users[id]), tempPassword };
      });
      if (!result.ok) return res.status(result.code).json({ error: result.error });
      res.json({
        ok: true,
        user: result.user,
        tempPassword: result.tempPassword,
        note: 'Share the temp password securely. User can change it later via reset.'
      });
    } catch (e) {
      res.status(500).json({ error: 'Create failed' });
    }
  });

  app.patch('/api/admin/users/:id', requireAdmin, async (req, res) => {
    const id = req.params.id;
    const status = req.body?.status;
    const allowed = ['active', 'pending', 'deactivated'];
    try {
      const result = await store.withStore((s) => {
        const u = store.findUserById(s, id);
        if (!u) return { ok: false, code: 404, error: 'User not found' };
        if (status && allowed.includes(status)) {
          // Prevent self-deactivate lockout
          if (u.id === req.authUser.id && status === 'deactivated') {
            return { ok: false, code: 400, error: 'Cannot deactivate your own admin account' };
          }
          u.status = status;
        }
        if (typeof req.body?.name === 'string') u.name = req.body.name.trim();
        if (typeof req.body?.company === 'string') u.company = req.body.company.trim();
        if (typeof req.body?.phone === 'string') u.phone = req.body.phone.trim();
        if (req.body?.role === 'admin' || req.body?.role === 'realtor' || req.body?.role === 'lo') {
          if (u.id === req.authUser.id && req.body.role !== 'admin') {
            return { ok: false, code: 400, error: 'Cannot demote yourself' };
          }
          u.role = req.body.role;
        }
        return { ok: true, user: store.publicUser(u) };
      });
      if (!result.ok) return res.status(result.code).json({ error: result.error });
      res.json({ ok: true, user: result.user });
    } catch (e) {
      res.status(500).json({ error: 'Update failed' });
    }
  });

  app.post('/api/admin/users/:id/reset-password', requireInviteManager, async (req, res) => {
    const id = req.params.id;
    let tempPassword = String(req.body?.password || '').trim();
    if (!tempPassword || tempPassword.length < 8) tempPassword = genTempPassword();
    try {
      const result = await store.withStore((s) => {
        const u = store.findUserById(s, id);
        if (!u) return { ok: false, code: 404, error: 'User not found' };
        if (!loMayResetTarget(req.authUser, u)) {
          return {
            ok: false,
            code: 403,
            error: 'You can only reset passwords for realtor partner accounts'
          };
        }
        u.password_hash = store.hashPassword(tempPassword);
        return { ok: true, user: store.publicUser(u), tempPassword };
      });
      if (!result.ok) return res.status(result.code).json({ error: result.error });
      res.json({
        ok: true,
        user: result.user,
        tempPassword: result.tempPassword,
        note: 'Copy now — it will not be shown again. Send to the realtor securely.'
      });
    } catch (e) {
      res.status(500).json({ error: 'Reset failed' });
    }
  });

  app.get('/api/admin/invites', requireInviteManager, async (req, res) => {
    try {
      const isAdm = store.isAdmin(req.authUser);
      const list = await store.withStore((s) => {
        let inv = Object.values(s.invites);
        if (!isAdm) {
          inv = inv.filter((i) => i.created_by === req.authUser.id);
        }
        return inv.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
      }, { readOnly: true });
      res.json({ ok: true, invites: list, scope: isAdm ? 'all' : 'mine' });
    } catch (e) {
      res.status(500).json({ error: 'List failed' });
    }
  });

  app.post('/api/admin/invites', requireInviteManager, async (req, res) => {
    const emailOptional = req.body?.email
      ? store.normalizeEmail(req.body.email)
      : null;
    const days = Math.min(90, Math.max(1, Number(req.body?.expires_days) || 14));
    let code = String(req.body?.code || '')
      .trim()
      .toUpperCase();
    if (!code) code = genInviteCode();

    try {
      const result = await store.withStore((s) => {
        if (s.invites[code]) {
          return { ok: false, code: 409, error: 'Invite code already exists' };
        }
        const inv = {
          code,
          email_optional: emailOptional,
          created_by: req.authUser.id,
          created_by_name: req.authUser.name || '',
          created_by_email: req.authUser.email || '',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + days * 864e5).toISOString(),
          used_at: null,
          used_by_user_id: null
        };
        s.invites[code] = inv;
        store.recordUsage(s, req.authUser.id, 'invite_create', code, {
          email_lock: emailOptional || null
        });
        return { ok: true, invite: inv };
      });
      if (!result.ok) return res.status(result.code).json({ error: result.error });
      const link = inviteLinkFor(req, code);
      const mailto = buildInviteMailto({
        link,
        code,
        toEmail: emailOptional,
        fromName: req.authUser.name || 'Your Ruoff loan officer'
      });
      res.json({
        ok: true,
        invite: result.invite,
        link,
        mailto,
        message: 'Invite ready — send the email or share the link. Single-use.'
      });
    } catch (e) {
      res.status(500).json({ error: 'Create invite failed' });
    }
  });

  app.get('/api/admin/usage', requireAdmin, async (req, res) => {
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    try {
      const events = await store.withStore(
        (s) => s.usage_events.slice(-limit).reverse(),
        { readOnly: true, includeUsage: true }
      );
      res.json({ ok: true, events });
    } catch (e) {
      res.status(500).json({ error: 'Usage failed' });
    }
  });

  // ── Bridge: LO Sales Coach pushes realtor invites here ─────
  function bridgeSecretOk(req) {
    const expected = String(
      process.env.AUTH_BRIDGE_SECRET ||
        process.env.INVITE_BRIDGE_SECRET ||
        process.env.PARTNER_CARD_SECRET ||
        process.env.AUTH_SESSION_SECRET ||
        sessionSecret()
    );
    const got = String(req.headers['x-auth-bridge-secret'] || req.body?.bridge_secret || '');
    if (!expected || !got) return false;
    try {
      const a = Buffer.from(got);
      const b = Buffer.from(expected);
      if (a.length !== b.length) return false;
      return crypto.timingSafeEqual(a, b);
    } catch (e) {
      return false;
    }
  }

  app.post('/api/auth/bridge/invite', async (req, res) => {
    if (!bridgeSecretOk(req)) {
      return res.status(401).json({ error: 'Invalid bridge secret' });
    }
    let code = String(req.body?.code || '')
      .trim()
      .toUpperCase();
    if (!code) code = genInviteCode();
    const emailOptional = req.body?.email_optional
      ? store.normalizeEmail(req.body.email_optional)
      : null;
    const expiresAt =
      req.body?.expires_at ||
      new Date(Date.now() + 14 * 864e5).toISOString();

    try {
      const result = await store.withStore((s) => {
        const existing = s.invites[code];
        if (existing && existing.used_at) {
          return { ok: false, code: 409, error: 'Invite code already used' };
        }
        if (existing && existing.revoked_at) {
          // allow re-issue by overwriting revoked
        } else if (existing && !existing.used_at) {
          // update metadata / extend
          existing.email_optional = emailOptional || existing.email_optional;
          existing.expires_at = expiresAt;
          existing.created_by_name = req.body?.created_by_name || existing.created_by_name;
          existing.created_by_email = req.body?.created_by_email || existing.created_by_email;
          existing.source = req.body?.source || existing.source || 'lo_sales_coach';
          existing.revoked_at = null;
          if (req.body?.inviter_brand && typeof req.body.inviter_brand === 'object') {
            existing.inviter_brand = req.body.inviter_brand;
            if (req.body.inviter_brand.name) existing.created_by_name = req.body.inviter_brand.name;
            if (req.body.inviter_brand.email) existing.created_by_email = req.body.inviter_brand.email;
          }
          return { ok: true, invite: existing, updated: true };
        }
        const brandRaw = req.body?.inviter_brand && typeof req.body.inviter_brand === 'object'
          ? req.body.inviter_brand
          : null;
        const inviterBrand = brandRaw
          ? {
              invited_by_user_id: String(brandRaw.invited_by_user_id || req.body?.created_by || '').slice(0, 80) || null,
              email: String(brandRaw.email || req.body?.created_by_email || '').trim().slice(0, 200),
              name: String(brandRaw.name || req.body?.created_by_name || '').trim().slice(0, 120),
              phone: String(brandRaw.phone || '').trim().slice(0, 40),
              nmls: String(brandRaw.nmls || '').trim().slice(0, 40),
              title: String(brandRaw.title || 'Your Ruoff Loan Officer').trim().slice(0, 80),
              company: String(brandRaw.company || 'Ruoff Mortgage').trim().slice(0, 80),
              location: String(brandRaw.location || '').trim().slice(0, 120),
              headshotUrl: String(brandRaw.headshotUrl || '').trim().slice(0, 2000),
              blogUrl: String(brandRaw.blogUrl || '').trim().slice(0, 500),
              companyWebsite: String(brandRaw.companyWebsite || '').trim().slice(0, 500),
              newsletterColorBundle: String(brandRaw.newsletterColorBundle || '').trim().slice(0, 80),
              partner_token: brandRaw.partner_token ? String(brandRaw.partner_token).slice(0, 120) : null,
              partner_share_url: brandRaw.partner_share_url
                ? String(brandRaw.partner_share_url).slice(0, 500)
                : null
            }
          : null;
        const inv = {
          code,
          email_optional: emailOptional,
          created_by: req.body?.created_by || 'lo_bridge',
          created_by_name: (inviterBrand && inviterBrand.name) || req.body?.created_by_name || '',
          created_by_email: (inviterBrand && inviterBrand.email) || req.body?.created_by_email || '',
          created_at: new Date().toISOString(),
          expires_at: expiresAt,
          used_at: null,
          used_by_user_id: null,
          revoked_at: null,
          source: req.body?.source || 'lo_sales_coach',
          inviter_brand: inviterBrand
        };
        s.invites[code] = inv;
        return { ok: true, invite: inv, updated: false };
      });
      if (!result.ok) return res.status(result.code).json({ error: result.error });
      res.json({ ok: true, invite: result.invite, updated: !!result.updated });
    } catch (e) {
      console.error('[auth] bridge invite', e.message);
      res.status(500).json({ error: 'Bridge invite failed' });
    }
  });

  app.post('/api/auth/bridge/invite/revoke', async (req, res) => {
    if (!bridgeSecretOk(req)) {
      return res.status(401).json({ error: 'Invalid bridge secret' });
    }
    const code = String(req.body?.code || '')
      .trim()
      .toUpperCase();
    if (!code) return res.status(400).json({ error: 'code required' });
    try {
      const result = await store.withStore((s) => {
        const inv = s.invites[code];
        if (!inv) return { ok: false, code: 404, error: 'Not found' };
        if (inv.used_at) return { ok: false, code: 400, error: 'Already used' };
        inv.revoked_at = new Date().toISOString();
        return { ok: true };
      });
      if (!result.ok) return res.status(result.code).json({ error: result.error });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: 'Revoke failed' });
    }
  });

  // Reject revoked invites on accept (belt + suspenders)
  // (accept-invite already checks used/expires; add revoked check via wrap)

  /**
   * Protect Grok proxy — must be authenticated + active.
   * Call after mountAuthRoutes and before/around chat route.
   */
  function requireAuthForApi(req, res, next) {
    if (process.env.AUTH_DISABLED === '1' || process.env.AUTH_DISABLED === 'true') {
      return next();
    }
    if (!req.authUser) {
      return res.status(401).json({
        error: 'Sign in required',
        code: 'AUTH_REQUIRED'
      });
    }
    next();
  }

  return {
    requireAuth,
    requireAdmin,
    requireInviteManager,
    requireAuthForApi,
    sessionMiddleware
  };
}

module.exports = {
  mountAuthRoutes,
  sessionMiddleware,
  COOKIE_NAME,
  sessionSecret
};
