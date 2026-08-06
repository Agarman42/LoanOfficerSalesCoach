/**
 * Web Push routes for LO Sales Coach proxy.
 */
const webpush = require('web-push');
const store = require('./push-store');

function mountPushRoutes(app) {
  const vapid = store.getVapidKeys(webpush);
  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

  app.get('/api/push/vapid-public-key', (_req, res) => {
    res.json({ publicKey: vapid.publicKey });
  });

  app.post('/api/push/subscribe', (req, res) => {
    try {
      const body = req.body || {};
      const subscription = body.subscription || body;
      const meta = {
        userId: body.userId || null,
        deviceId: body.deviceId || null,
        prefs: body.prefs || undefined
      };
      const row = store.upsertSubscription(subscription, meta);
      console.log('[push] subscribed', row.endpoint.slice(0, 48) + '…');
      res.json({ ok: true, endpoint: row.endpoint });
    } catch (e) {
      console.warn('[push] subscribe failed', e.message);
      res.status(400).json({ ok: false, error: e.message || 'Subscribe failed' });
    }
  });

  app.post('/api/push/unsubscribe', (req, res) => {
    try {
      const endpoint =
        (req.body && (req.body.endpoint || (req.body.subscription && req.body.subscription.endpoint))) ||
        '';
      const removed = store.removeSubscription(endpoint);
      console.log('[push] unsubscribe', removed ? 'ok' : 'miss');
      res.json({ ok: true, removed });
    } catch (e) {
      res.status(400).json({ ok: false, error: e.message });
    }
  });

  app.post('/api/push/prefs', (req, res) => {
    try {
      const endpoint = req.body && req.body.endpoint;
      const prefs = req.body && req.body.prefs;
      const row = store.updatePrefs(endpoint, prefs);
      if (!row) return res.status(404).json({ ok: false, error: 'Subscription not found' });
      res.json({ ok: true, prefs: row.prefs });
    } catch (e) {
      res.status(400).json({ ok: false, error: e.message });
    }
  });

  /**
   * Send a push notification.
   * Body: { type?: 'weekly-win-plan'|'pitch-practice'|'test', title?, body?, url?, tag?, endpoint? }
   * If endpoint omitted → send to all matching prefs.
   */
  app.post('/api/push/send', async (req, res) => {
    try {
      const body = req.body || {};
      const type = body.type || 'test';
      const payload = buildPayload(type, body);
      const list = store.listSubscriptions();
      let targets = list;
      if (body.endpoint) {
        targets = list.filter((s) => s.endpoint === body.endpoint);
      } else {
        targets = list.filter((s) => prefersType(s, type));
      }

      const results = [];
      for (const sub of targets) {
        const pushSub = {
          endpoint: sub.endpoint,
          keys: sub.keys,
          expirationTime: sub.expirationTime
        };
        try {
          await webpush.sendNotification(pushSub, JSON.stringify(payload));
          results.push({ endpoint: sub.endpoint.slice(0, 40), ok: true });
        } catch (err) {
          const status = err.statusCode || err.status;
          console.warn('[push] send fail', status, err.message);
          if (status === 404 || status === 410) {
            store.removeSubscription(sub.endpoint);
            results.push({ endpoint: sub.endpoint.slice(0, 40), ok: false, removed: true, status });
          } else {
            results.push({
              endpoint: sub.endpoint.slice(0, 40),
              ok: false,
              status,
              error: err.message
            });
          }
        }
      }
      res.json({ ok: true, type, sent: results.filter((r) => r.ok).length, results });
    } catch (e) {
      console.error('[push] send error', e);
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  console.log('[push] routes mounted; public VAPID ready');
  return { publicKey: vapid.publicKey };
}

function prefersType(sub, type) {
  const prefs = sub.prefs || {};
  if (type === 'weekly-win-plan') return prefs.weeklyWinPlan !== false;
  if (type === 'pitch-practice') return prefs.pitchPractice !== false;
  return true;
}

function buildPayload(type, body) {
  if (type === 'weekly-win-plan') {
    return {
      title: body.title || 'Weekly Win Plan ready',
      body: body.body || 'Your Weekly Win Plan is ready — 3 clear actions for this week.',
      url: body.url || '/#weekly-win-plan',
      tag: 'weekly-win-plan',
      renotify: true
    };
  }
  if (type === 'pitch-practice') {
    return {
      title: body.title || 'Practice your pitch',
      body:
        body.body ||
        'Ready to practice your pitch? Takes about 60 seconds.',
      url: body.url || '/#my-pitch',
      tag: 'pitch-practice',
      renotify: true
    };
  }
  return {
    title: body.title || 'LO Sales Coach',
    body: body.body || 'Test notification from Sales Coach.',
    url: body.url || '/',
    tag: body.tag || 'lo-test'
  };
}

module.exports = { mountPushRoutes };
