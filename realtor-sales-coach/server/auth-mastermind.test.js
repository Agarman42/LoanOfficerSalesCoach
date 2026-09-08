#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const express = require('express');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'asc-auth-'));
process.env.AUTH_FORCE_FILE = '1';
process.env.AUTH_STORE_PATH = path.join(tmp, 'agent.json');
process.env.LO_AUTH_STORE_PATH = path.join(tmp, 'lo.json');
process.env.ADMIN_EMAIL = 'adam@test.com';
process.env.ADMIN_PASSWORD = 'adminpass1';
process.env.AUTH_SESSION_SECRET = 'test-secret-mastermind';
process.env.NODE_ENV = 'test';
delete process.env.RESEND_API_KEY;
delete process.env.SMTP_URL;
delete process.env.SMTP_HOST;

const store = require('./auth-store');
const { mountAuthRoutes } = require('./auth-routes');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function request(app, { method, path: pth, body, cookie }) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const payload = body != null ? JSON.stringify(body) : null;
      const req = http.request(
        {
          host: '127.0.0.1',
          port,
          path: pth,
          method,
          headers: Object.assign(
            { Accept: 'application/json' },
            payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {},
            cookie ? { Cookie: cookie } : {}
          )
        },
        (res) => {
          let raw = '';
          res.on('data', (c) => {
            raw += c;
          });
          res.on('end', () => {
            server.close();
            let data = null;
            try {
              data = raw ? JSON.parse(raw) : null;
            } catch (e) {
              data = { _raw: raw };
            }
            const setCookie = res.headers['set-cookie'] || [];
            resolve({ status: res.statusCode, data, setCookie });
          });
        }
      );
      req.on('error', (err) => {
        server.close();
        reject(err);
      });
      if (payload) req.write(payload);
      req.end();
    });
  });
}

function cookieFrom(setCookie) {
  const line = (setCookie || [])[0] || '';
  return line.split(';')[0] || '';
}

async function main() {
  await store.seedAdminIfNeeded();
  const loHash = store.hashPassword('lo-secret-99');
  fs.writeFileSync(
    process.env.LO_AUTH_STORE_PATH,
    JSON.stringify({
      version: 1,
      app: 'lo-sales-coach',
      users: {
        usr_lo1: {
          id: 'usr_lo1',
          email: 'jane.lo@ruoff.com',
          password_hash: loHash,
          name: 'Jane LO',
          company: 'Ruoff Mortgage',
          phone: '',
          role: 'loan_officer',
          status: 'active',
          created_at: new Date().toISOString(),
          login_count: 3
        }
      }
    }),
    'utf8'
  );

  const app = express();
  app.use(express.json());
  mountAuthRoutes(app);

  const loginAdmin = await request(app, {
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'adam@test.com', password: 'adminpass1' }
  });
  assert(loginAdmin.status === 200, 'admin login failed ' + loginAdmin.status + ' ' + JSON.stringify(loginAdmin.data));
  const adminCookie = cookieFrom(loginAdmin.setCookie);
  assert(adminCookie, 'no admin session cookie');

  // D: request access persists; no mail → notified false; admin queue shows it
  const reqAccess = await request(app, {
    method: 'POST',
    path: '/api/auth/request-access',
    body: {
      name: 'Pat Realtor',
      email: 'pat.agent@broker.com',
      company: 'ABC Realty',
      referred_by_lo_name: 'Jane LO',
      note: 'Met at lunch'
    }
  });
  assert(reqAccess.status === 200, 'request-access failed ' + JSON.stringify(reqAccess.data));
  assert(reqAccess.data.ok === true, 'request-access not ok');
  assert(reqAccess.data.notified === false, 'should not pretend email sent');
  assert(/not configured|waiting in Admin/i.test(reqAccess.data.message), 'honest no-mail message missing');

  const pending = await request(app, {
    method: 'GET',
    path: '/api/admin/access-requests',
    cookie: adminCookie
  });
  assert(pending.status === 200, 'access-requests list failed');
  const found = (pending.data.pending || []).find((r) => r.email === 'pat.agent@broker.com');
  assert(found, 'pending request not in Admin queue');
  assert(found.name === 'Pat Realtor', 'request name mismatch');

  const approve = await request(app, {
    method: 'POST',
    path: '/api/admin/access-requests/' + encodeURIComponent(found.id) + '/approve',
    cookie: adminCookie,
    body: {}
  });
  assert(approve.status === 200, 'approve failed ' + JSON.stringify(approve.data));
  assert(approve.data.user && approve.data.user.status === 'active', 'approve did not activate');
  assert(approve.data.tempPassword, 'no temp password when mail off');

  // A: event code signup
  const ec = await request(app, {
    method: 'POST',
    path: '/api/admin/event-codes',
    cookie: adminCookie,
    body: { label: 'Realtor mastermind', code: 'MASTERMIND26', max_uses: 120, expires_days: 14 }
  });
  assert(ec.status === 200, 'create event code failed ' + JSON.stringify(ec.data));
  assert(ec.data.event_code.code === 'MASTERMIND26', 'code mismatch');
  assert(ec.data.event_code.remaining === 120, 'remaining should start at 120');

  const signup = await request(app, {
    method: 'POST',
    path: '/api/auth/signup-access-code',
    body: {
      code: 'mastermind26',
      name: 'Alex Agent',
      email: 'alex@broker.com',
      password: 'password12'
    }
  });
  assert(signup.status === 200, 'event signup failed ' + JSON.stringify(signup.data));
  assert(signup.data.user && signup.data.user.email === 'alex@broker.com', 'signup user missing');
  assert(signup.data.user.role === 'realtor', 'event signup should be realtor');
  assert(signup.data.remaining === 119, 'remaining uses not decremented');

  const badCode = await request(app, {
    method: 'POST',
    path: '/api/auth/signup-access-code',
    body: { code: 'NOPE', name: 'X', email: 'x@y.com', password: 'password12' }
  });
  assert(badCode.status === 400, 'invalid code should 400');
  assert(/invalid access code/i.test(badCode.data.error), 'invalid error text: ' + badCode.data.error);

  const listed = await request(app, {
    method: 'GET',
    path: '/api/admin/event-codes',
    cookie: adminCookie
  });
  const mm = (listed.data.event_codes || []).find((c) => c.code === 'MASTERMIND26');
  assert(mm && mm.remaining === 119, 'admin remaining uses wrong');

  // B: bulk invite
  const bulk = await request(app, {
    method: 'POST',
    path: '/api/admin/invites/bulk',
    cookie: adminCookie,
    body: {
      emails: 'a1@broker.com, a2@broker.com\na3@broker.com a4@broker.com;a5@broker.com\nalex@broker.com',
      expires_days: 14
    }
  });
  assert(bulk.status === 200, 'bulk failed ' + JSON.stringify(bulk.data));
  assert(bulk.data.created.length === 5, 'expected 5 invites, got ' + bulk.data.created.length);
  assert(
    (bulk.data.skipped || []).some((s) => s.email === 'alex@broker.com' && s.reason === 'already_active'),
    'should skip existing active account'
  );
  assert(bulk.data.copy_all && bulk.data.copy_all.split('\n').length === 5, 'copy_all missing');
  assert(bulk.data.mailto && bulk.data.mailto.indexOf('mailto:') === 0, 'mailto missing');

  // C: LO shared login
  const loLogin = await request(app, {
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'jane.lo@ruoff.com', password: 'lo-secret-99' }
  });
  assert(loLogin.status === 200, 'LO shared login failed ' + JSON.stringify(loLogin.data));
  assert(loLogin.data.user.role === 'lo', 'LO should get role=lo, got ' + (loLogin.data.user && loLogin.data.user.role));
  assert(loLogin.data.user.email === 'jane.lo@ruoff.com', 'LO email mismatch');

  const loAgain = await request(app, {
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'jane.lo@ruoff.com', password: 'lo-secret-99' }
  });
  assert(loAgain.status === 200, 'second LO login failed');
  assert(loAgain.data.user.role === 'lo', 'second login lost lo role');

  const realtorPublic = await request(app, {
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'stranger@gmail.com', password: 'whatever12' }
  });
  assert(realtorPublic.status === 401, 'public realtor must stay gated');

  console.log('AUTH MASTERMIND TESTS PASS');
  console.log('tmp store', tmp);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
