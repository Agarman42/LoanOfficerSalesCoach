/**
 * Loan Officer Sales Coach — auth API + session middleware.
 * Cookie: lo_asc_session (httpOnly). Remember device default 30 days.
 * @ruoff.com required for loan_officer signup/login (admin exempt).
 * Realtor invites → Agent Sales Coach via bridge API.
 */
'use strict';

const crypto = require('crypto');
const axios = require('axios');
const store = require('./lo-auth-store');

const COOKIE_NAME = 'lo_asc_session';
const SESSION_DAYS = Number(process.env.AUTH_SESSION_DAYS || 30);
const SESSION_HOURS_SHORT = Number(process.env.AUTH_SESSION_HOURS_SHORT || 12);
const LOGIN_MAX = 12;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

/** @type {Map<string, { n: number, reset: number }>} */
const loginAttempts = new Map();

function sessionSecret() {
  return String(
    process.env.AUTH_SESSION_SECRET ||
      process.env.LO_AUTH_SESSION_SECRET ||
      process.env.SESSION_SECRET ||
      process.env.PARTNER_CARD_SECRET ||
      process.env.XAI_API_KEY ||
      'dev-only-lo-auth-session-secret-change-me'
  );
}

function bridgeSecret() {
  return String(
    process.env.AUTH_BRIDGE_SECRET ||
      process.env.INVITE_BRIDGE_SECRET ||
      process.env.PARTNER_CARD_SECRET ||
      process.env.AUTH_SESSION_SECRET ||
      sessionSecret()
  );
}

function realtorAppUrl() {
  return String(
    process.env.REALTOR_APP_URL ||
      process.env.PARTNER_REALTOR_URL ||
      (String(process.env.NODE_ENV || '').toLowerCase() === 'production'
        ? 'https://ruoffagentsalescoach.onrender.com'
        : 'http://127.0.0.1:3001')
  ).replace(/\/$/, '');
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
  const sig = crypto.createHmac('sha256', sessionSecret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token) {
  try {
    const parts = String(token || '').split('.');
    if (parts.length !== 2) return null;
    const [body, sig] = parts;
    const expect = crypto.createHmac('sha256', sessionSecret()).update(body).digest('base64url');
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
  const out = {};
  String(req.headers.cookie || '')
    .split(';')
    .forEach((part) => {
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
  const parts = [`${COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
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
  return row.n <= LOGIN_MAX;
}

function createSessionToken(userId, remember) {
  const ms = remember
    ? SESSION_DAYS * 24 * 60 * 60 * 1000
    : SESSION_HOURS_SHORT * 60 * 60 * 1000;
  const exp = Date.now() + ms;
  return {
    token: signPayload({ uid: userId, exp, r: remember ? 1 : 0, app: 'lo' }),
    maxAgeSec: Math.floor(ms / 1000),
    exp
  };
}

async function loadActiveUser(userId) {
  return store.withStore((s) => {
    const u = store.findUserById(s, userId);
    if (!u) return null;
    if (u.status !== 'active') return { blocked: true, user: u };
    return { blocked: false, user: u };
  });
}

function sessionMiddleware(req, res, next) {
  req.authUser = null;
  try {
    const raw = parseCookies(req)[COOKIE_NAME];
    if (!raw) return next();
    const payload = verifyToken(raw);
    if (!payload) return next();
    loadActiveUser(payload.uid)
      .then((row) => {
        if (!row || row.blocked) {
          if (row && row.blocked) clearSessionCookie(res, req);
          return next();
        }
        req.authUser = store.publicUser(row.user);
        next();
      })
      .catch(() => next());
  } catch (e) {
    next();
  }
}

function requireAuth(req, res, next) {
  if (!req.authUser) return res.status(401).json({ error: 'Authentication required' });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.authUser) return res.status(401).json({ error: 'Authentication required' });
  if (req.authUser.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

function requireLo(req, res, next) {
  if (!req.authUser) return res.status(401).json({ error: 'Authentication required' });
  if (req.authUser.role !== 'admin' && req.authUser.role !== 'loan_officer') {
    return res.status(403).json({ error: 'Loan officers only' });
  }
  next();
}

function genInviteCode() {
  return crypto.randomBytes(5).toString('base64url').toUpperCase();
}

function genTempPassword() {
  return crypto.randomBytes(8).toString('base64url');
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
  return (
    'mailto:' +
    (toEmail ? encodeURIComponent(toEmail) : '') +
    '?subject=' +
    encodeURIComponent(subject) +
    '&body=' +
    encodeURIComponent(body)
  );
}

async function pushInviteToAgent(inv) {
  const url = realtorAppUrl() + '/api/auth/bridge/invite';
  try {
    const res = await axios.post(
      url,
      {
        code: inv.code,
        email_optional: inv.email_optional,
        expires_at: inv.expires_at,
        created_by_name: inv.created_by_name,
        created_by_email: inv.created_by_email,
        created_by: inv.created_by,
        source: 'lo_sales_coach',
        inviter_brand: inv.inviter_brand || null
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Bridge-Secret': bridgeSecret()
        },
        timeout: 15000,
        validateStatus: () => true
      }
    );
    if (res.status < 200 || res.status >= 300) {
      return {
        ok: false,
        status: res.status,
        error: (res.data && res.data.error) || 'Agent bridge rejected invite'
      };
    }
    return { ok: true, data: res.data };
  } catch (e) {
    return { ok: false, error: e.message || 'Could not reach Agent Sales Coach' };
  }
}

async function revokeInviteOnAgent(code) {
  try {
    const res = await axios.post(
      realtorAppUrl() + '/api/auth/bridge/invite/revoke',
      { code },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Bridge-Secret': bridgeSecret()
        },
        timeout: 10000,
        validateStatus: () => true
      }
    );
    return res.status >= 200 && res.status < 300;
  } catch (e) {
    return false;
  }
}

function mountLoAuthRoutes(app) {
  app.use(sessionMiddleware);

  app.get('/api/auth/config', (_req, res) => {
    res.json({
      ok: true,
      app: 'lo-sales-coach',
      rememberDays: SESSION_DAYS,
      shortHours: SESSION_HOURS_SHORT,
      ruoffEmailRequired: true,
      realtorAppUrl: realtorAppUrl()
    });
  });

  app.get('/api/auth/me', async (req, res) => {
    if (!req.authUser) return res.status(401).json({ authenticated: false });
    try {
      await store.withStore((s) => {
        const u = store.findUserById(s, req.authUser.id);
        if (!u) return;
        const today = new Date().toISOString().slice(0, 10);
        if (u._last_resume_day !== today) {
          u._last_resume_day = today;
          store.recordUsage(s, u.id, 'session_resume', '/');
        }
      });
    } catch (e) {
      /* ignore */
    }
    return res.json({
      authenticated: true,
      user: req.authUser,
      capabilities: {
        admin: req.authUser.role === 'admin',
        invite_realtors: !!req.authUser.can_invite_realtors
      },
      realtorAppUrl: realtorAppUrl()
    });
  });

  app.post('/api/auth/register', async (req, res) => {
    const email = store.normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');
    const name = String(req.body?.name || '').trim();
    const remember = req.body?.remember !== false;

    if (!email || !password || password.length < 8) {
      return res.status(400).json({ error: 'Name, Ruoff email, and password (min 8) required' });
    }
    if (!name) return res.status(400).json({ error: 'Name is required' });
    if (!store.isRuoffEmail(email)) {
      return res.status(400).json({ error: 'Use your Ruoff email (@ruoff.com).' });
    }

    try {
      const result = await store.withStore((s) => {
        if (store.findUserByEmail(s, email)) {
          return { ok: false, code: 409, error: 'An account with this email already exists — sign in' };
        }
        const id = store.newId('usr');
        const now = new Date().toISOString();
        s.users[id] = {
          id,
          email,
          password_hash: store.hashPassword(password),
          name,
          company: 'Ruoff Mortgage',
          phone: String(req.body?.phone || '').trim(),
          role: 'loan_officer',
          status: 'active',
          created_at: now,
          last_login_at: now,
          login_count: 1
        };
        store.recordUsage(s, id, 'login', '/register');
        return { ok: true, user: store.publicUser(s.users[id]) };
      });
      if (!result.ok) return res.status(result.code).json({ error: result.error });
      const sess = createSessionToken(result.user.id, remember);
      setSessionCookie(res, req, sess.token, sess.maxAgeSec);
      return res.json({
        ok: true,
        user: result.user,
        session: { expiresAt: new Date(sess.exp).toISOString(), remember }
      });
    } catch (e) {
      console.error('[lo-auth] register', e.message);
      return res.status(500).json({ error: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const ip = clientIp(req);
    if (!rateLimitLogin(ip)) {
      return res.status(429).json({ error: 'Too many login attempts. Try again in 15 minutes.' });
    }
    const email = store.normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');
    const remember = req.body?.remember !== false;

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
          return { ok: false, code: 403, error: 'Account deactivated. Contact your admin.' };
        }
        if (u.status !== 'active') {
          return { ok: false, code: 403, error: 'Account not active.' };
        }
        // Non-admin must be @ruoff.com
        if (u.role !== 'admin' && !store.isRuoffEmail(u.email)) {
          return { ok: false, code: 403, error: 'Use your Ruoff email (@ruoff.com).' };
        }
        u.last_login_at = new Date().toISOString();
        u.login_count = (u.login_count || 0) + 1;
        store.recordUsage(s, u.id, 'login', '/login', { remember: !!remember });
        return { ok: true, user: store.publicUser(u) };
      });
      if (!result.ok) return res.status(result.code).json({ error: result.error });
      loginAttempts.delete(ip);
      const sess = createSessionToken(result.user.id, remember);
      setSessionCookie(res, req, sess.token, sess.maxAgeSec);
      return res.json({
        ok: true,
        user: result.user,
        session: { expiresAt: new Date(sess.exp).toISOString(), remember }
      });
    } catch (e) {
      console.error('[lo-auth] login', e.message);
      return res.status(500).json({ error: 'Login failed' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    clearSessionCookie(res, req);
    res.json({ ok: true });
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    const generic = {
      ok: true,
      message:
        'If that account exists, ask an admin for a temporary password from Admin · usage (SMTP reset comes later).'
    };
    const email = store.normalizeEmail(req.body?.email);
    if (!email) return res.json(generic);
    try {
      const token = crypto.randomBytes(24).toString('base64url');
      await store.withStore((s) => {
        const u = store.findUserByEmail(s, email);
        if (!u || u.status === 'deactivated') return;
        s.password_resets[token] = {
          user_id: u.id,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 3600000).toISOString()
        };
        if (process.env.NODE_ENV !== 'production' || process.env.AUTH_LOG_RESET_TOKENS === '1') {
          console.log(`[lo-auth] reset token for ${email}: ${token}`);
        }
      });
    } catch (e) {
      /* ignore */
    }
    return res.json(generic);
  });

  app.post('/api/auth/track', requireAuth, async (req, res) => {
    try {
      await store.withStore((s) => {
        store.recordUsage(
          s,
          req.authUser.id,
          String(req.body?.event_type || 'tool_open').slice(0, 64),
          String(req.body?.feature || req.body?.path || '').slice(0, 200)
        );
      });
    } catch (e) {
      /* ignore */
    }
    res.json({ ok: true });
  });

  // ── Invite realtors → Agent tool ───────────────────────────

  app.get('/api/lo/agent-invites', requireLo, async (req, res) => {
    try {
      const isAdm = req.authUser.role === 'admin';
      const list = await store.withStore((s) => {
        let inv = Object.values(s.agent_invites);
        if (!isAdm) inv = inv.filter((i) => i.created_by === req.authUser.id);
        return inv.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
      });
      res.json({ ok: true, invites: list, realtorAppUrl: realtorAppUrl() });
    } catch (e) {
      res.status(500).json({ error: 'List failed' });
    }
  });

  function sanitizeInviterBrand(raw, authUser) {
    const b = raw && typeof raw === 'object' ? raw : {};
    const str = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
    return {
      invited_by_user_id: str(b.invited_by_user_id || (authUser && authUser.id), 80) || null,
      email: str(b.email || (authUser && authUser.email), 200),
      name: str(b.name || (authUser && authUser.name), 120),
      phone: str(b.phone, 40),
      nmls: str(b.nmls, 40),
      title: str(b.title || 'Your Ruoff Loan Officer', 80) || 'Your Ruoff Loan Officer',
      company: str(b.company || 'Ruoff Mortgage', 80) || 'Ruoff Mortgage',
      location: str(b.location, 120),
      headshotUrl: str(b.headshotUrl, 2000),
      blogUrl: str(b.blogUrl, 500),
      companyWebsite: str(b.companyWebsite, 500),
      newsletterColorBundle: str(b.newsletterColorBundle, 80),
      partner_token: str(b.partner_token, 120) || null,
      partner_share_url: str(b.partner_share_url, 500) || null
    };
  }

  app.post('/api/lo/agent-invites', requireLo, async (req, res) => {
    const emailOptional = req.body?.email ? store.normalizeEmail(req.body.email) : null;
    const days = Math.min(90, Math.max(1, Number(req.body?.expires_days) || 14));
    let code = String(req.body?.code || '')
      .trim()
      .toUpperCase();
    if (!code) code = genInviteCode();
    const inviterBrand = sanitizeInviterBrand(req.body?.inviter_brand, req.authUser);

    const inv = {
      code,
      email_optional: emailOptional,
      created_by: req.authUser.id,
      created_by_name: inviterBrand.name || req.authUser.name || '',
      created_by_email: inviterBrand.email || req.authUser.email || '',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + days * 864e5).toISOString(),
      used_at: null,
      used_by_user_id: null,
      revoked_at: null,
      bridge_synced: false,
      source: 'lo_sales_coach',
      inviter_brand: inviterBrand
    };

    try {
      const local = await store.withStore((s) => {
        if (s.agent_invites[code]) {
          return { ok: false, code: 409, error: 'Invite code already exists' };
        }
        s.agent_invites[code] = inv;
        store.recordUsage(s, req.authUser.id, 'agent_invite_create', code, {
          email_lock: emailOptional
        });
        return { ok: true };
      });
      if (!local.ok) return res.status(local.code).json({ error: local.error });

      const bridge = await pushInviteToAgent(inv);
      await store.withStore((s) => {
        if (s.agent_invites[code]) {
          s.agent_invites[code].bridge_synced = !!bridge.ok;
          s.agent_invites[code].bridge_error = bridge.ok ? null : bridge.error || null;
        }
      });

      if (!bridge.ok) {
        // Keep local record but warn — Agent cannot accept until bridge succeeds
        console.warn('[lo-auth] Agent invite bridge failed:', bridge.error || bridge.status);
      }

      const link = `${realtorAppUrl()}/#invite=${encodeURIComponent(code)}`;
      const mailto = buildInviteMailto({
        link,
        code,
        toEmail: emailOptional,
        fromName: req.authUser.name || 'Your Ruoff loan officer'
      });

      return res.json({
        ok: true,
        invite: { ...inv, bridge_synced: !!bridge.ok },
        link,
        mailto,
        bridge: bridge.ok
          ? { ok: true }
          : {
              ok: false,
              error:
                bridge.error ||
                'Could not sync invite to Agent Sales Coach. Set AUTH_BRIDGE_SECRET on both apps and ensure Agent is running.'
            },
        message: bridge.ok
          ? 'Invite ready — send via email or copy the link. Single-use on Agent Sales Coach.'
          : 'Invite saved locally but Agent sync failed — fix bridge secret / Agent URL, then recreate invite.'
      });
    } catch (e) {
      console.error('[lo-auth] agent invite', e.message);
      return res.status(500).json({ error: 'Create invite failed' });
    }
  });

  app.post('/api/lo/agent-invites/:code/revoke', requireLo, async (req, res) => {
    const code = String(req.params.code || '')
      .trim()
      .toUpperCase();
    try {
      const result = await store.withStore((s) => {
        const inv = s.agent_invites[code];
        if (!inv) return { ok: false, code: 404, error: 'Invite not found' };
        if (req.authUser.role !== 'admin' && inv.created_by !== req.authUser.id) {
          return { ok: false, code: 403, error: 'Not your invite' };
        }
        if (inv.used_at) return { ok: false, code: 400, error: 'Invite already used' };
        inv.revoked_at = new Date().toISOString();
        return { ok: true, invite: inv };
      });
      if (!result.ok) return res.status(result.code).json({ error: result.error });
      await revokeInviteOnAgent(code);
      res.json({ ok: true, invite: result.invite });
    } catch (e) {
      res.status(500).json({ error: 'Revoke failed' });
    }
  });

  // ── Admin (LO tool users) ──────────────────────────────────

  app.get('/api/admin/stats', requireAdmin, async (req, res) => {
    try {
      const data = await store.withStore((s) => {
        const users = Object.values(s.users);
        const now = Date.now();
        const d7 = now - 7 * 864e5;
        return {
          totals: {
            users: users.length,
            active: users.filter((u) => u.status === 'active').length,
            deactivated: users.filter((u) => u.status === 'deactivated').length,
            openAgentInvites: Object.values(s.agent_invites).filter(
              (i) => !i.used_at && !i.revoked_at
            ).length
          },
          logins: {
            last7d: users.filter(
              (u) => u.last_login_at && new Date(u.last_login_at).getTime() >= d7
            ).length
          }
        };
      });
      res.json({ ok: true, ...data });
    } catch (e) {
      res.status(500).json({ error: 'Stats failed' });
    }
  });

  app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
      const list = await store.withStore((s) =>
        Object.values(s.users)
          .map((u) => store.publicUser(u))
          .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
      );
      res.json({ ok: true, users: list });
    } catch (e) {
      res.status(500).json({ error: 'List failed' });
    }
  });

  app.patch('/api/admin/users/:id', requireAdmin, async (req, res) => {
    const id = req.params.id;
    try {
      const result = await store.withStore((s) => {
        const u = store.findUserById(s, id);
        if (!u) return { ok: false, code: 404, error: 'User not found' };
        if (req.body?.status === 'active' || req.body?.status === 'deactivated') {
          if (u.id === req.authUser.id && req.body.status === 'deactivated') {
            return { ok: false, code: 400, error: 'Cannot deactivate yourself' };
          }
          u.status = req.body.status;
        }
        if (typeof req.body?.name === 'string') u.name = req.body.name.trim();
        return { ok: true, user: store.publicUser(u) };
      });
      if (!result.ok) return res.status(result.code).json({ error: result.error });
      res.json({ ok: true, user: result.user });
    } catch (e) {
      res.status(500).json({ error: 'Update failed' });
    }
  });

  app.post('/api/admin/users/:id/reset-password', requireAdmin, async (req, res) => {
    const id = req.params.id;
    let tempPassword = String(req.body?.password || '').trim();
    if (!tempPassword || tempPassword.length < 8) tempPassword = genTempPassword();
    try {
      const result = await store.withStore((s) => {
        const u = store.findUserById(s, id);
        if (!u) return { ok: false, code: 404, error: 'User not found' };
        u.password_hash = store.hashPassword(tempPassword);
        return { ok: true, user: store.publicUser(u), tempPassword };
      });
      if (!result.ok) return res.status(result.code).json({ error: result.error });
      res.json({
        ok: true,
        user: result.user,
        tempPassword: result.tempPassword,
        note: 'Copy now — will not be shown again.'
      });
    } catch (e) {
      res.status(500).json({ error: 'Reset failed' });
    }
  });

  app.get('/api/admin/usage', requireAdmin, async (req, res) => {
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    try {
      const events = await store.withStore((s) => s.usage_events.slice(-limit).reverse());
      res.json({ ok: true, events });
    } catch (e) {
      res.status(500).json({ error: 'Usage failed' });
    }
  });

  function requireAuthForApi(req, res, next) {
    if (process.env.AUTH_DISABLED === '1' || process.env.AUTH_DISABLED === 'true') {
      return next();
    }
    if (!req.authUser) {
      return res.status(401).json({ error: 'Sign in required', code: 'AUTH_REQUIRED' });
    }
    next();
  }

  return { requireAuth, requireAdmin, requireLo, requireAuthForApi, sessionMiddleware };
}

module.exports = {
  mountLoAuthRoutes,
  COOKIE_NAME,
  sessionSecret,
  bridgeSecret,
  realtorAppUrl
};
