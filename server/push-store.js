/**
 * Simple durable push subscription store (JSON file on disk).
 * LO Sales Coach only — no external DB required.
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SUBS_FILE = path.join(DATA_DIR, 'push-subscriptions.json');
const VAPID_FILE = path.join(DATA_DIR, 'vapid-keys.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.warn('[push-store] read failed', file, e.message);
    return fallback;
  }
}

function writeJson(file, data) {
  ensureDataDir();
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}

function getVapidKeys(webpush) {
  ensureDataDir();
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return {
      publicKey: process.env.VAPID_PUBLIC_KEY.trim(),
      privateKey: process.env.VAPID_PRIVATE_KEY.trim(),
      subject: process.env.VAPID_SUBJECT || 'mailto:support@ruoff.com'
    };
  }
  const existing = readJson(VAPID_FILE, null);
  if (existing && existing.publicKey && existing.privateKey) {
    return {
      publicKey: existing.publicKey,
      privateKey: existing.privateKey,
      subject: existing.subject || 'mailto:support@ruoff.com'
    };
  }
  const generated = webpush.generateVAPIDKeys();
  const keys = {
    publicKey: generated.publicKey,
    privateKey: generated.privateKey,
    subject: process.env.VAPID_SUBJECT || 'mailto:support@ruoff.com',
    createdAt: new Date().toISOString()
  };
  writeJson(VAPID_FILE, keys);
  console.log('[push] Generated VAPID keys → data/vapid-keys.json (keep private key server-side)');
  return keys;
}

function listSubscriptions() {
  const data = readJson(SUBS_FILE, { subscriptions: [] });
  return Array.isArray(data.subscriptions) ? data.subscriptions : [];
}

function saveSubscriptions(list) {
  writeJson(SUBS_FILE, {
    updatedAt: new Date().toISOString(),
    subscriptions: list
  });
}

function endpointKey(sub) {
  return (sub && sub.endpoint) || '';
}

function upsertSubscription(subscription, meta) {
  if (!subscription || !subscription.endpoint) {
    throw new Error('Invalid subscription');
  }
  const list = listSubscriptions();
  const key = endpointKey(subscription);
  const now = new Date().toISOString();
  const idx = list.findIndex((s) => s.endpoint === key);
  const row = {
    endpoint: subscription.endpoint,
    keys: subscription.keys || {},
    expirationTime: subscription.expirationTime || null,
    userId: (meta && meta.userId) || null,
    deviceId: (meta && meta.deviceId) || null,
    prefs: (meta && meta.prefs) || { weeklyWinPlan: true, pitchPractice: true },
    createdAt: idx >= 0 ? list[idx].createdAt : now,
    updatedAt: now
  };
  if (idx >= 0) list[idx] = row;
  else list.push(row);
  saveSubscriptions(list);
  return row;
}

function removeSubscription(endpoint) {
  if (!endpoint) return false;
  const list = listSubscriptions();
  const next = list.filter((s) => s.endpoint !== endpoint);
  if (next.length === list.length) return false;
  saveSubscriptions(next);
  return true;
}

function updatePrefs(endpoint, prefs) {
  const list = listSubscriptions();
  const idx = list.findIndex((s) => s.endpoint === endpoint);
  if (idx < 0) return null;
  list[idx].prefs = Object.assign({}, list[idx].prefs || {}, prefs || {});
  list[idx].updatedAt = new Date().toISOString();
  saveSubscriptions(list);
  return list[idx];
}

module.exports = {
  getVapidKeys,
  listSubscriptions,
  upsertSubscription,
  removeSubscription,
  updatePrefs,
  SUBS_FILE,
  VAPID_FILE
};
