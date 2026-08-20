/**
 * Optional outbound email for Loan Officer Sales Coach (password reset, etc.).
 *
 * Configure ONE of:
 *   RESEND_API_KEY=re_...          (+ optional MAIL_FROM)
 *   SMTP_URL=smtps://user:pass@host:465
 *   or SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_SECURE
 *
 * Optional:
 *   MAIL_FROM="Loan Officer Sales Coach <noreply@yourdomain.com>"
 *   APP_PUBLIC_URL=https://loanofficersalescoach.onrender.com
 */
'use strict';

function mailFrom() {
  return (
    process.env.MAIL_FROM ||
    process.env.SMTP_FROM ||
    'Loan Officer Sales Coach <onboarding@resend.dev>'
  );
}

function isConfigured() {
  return !!(
    process.env.RESEND_API_KEY ||
    process.env.SMTP_URL ||
    process.env.SMTP_HOST
  );
}

async function sendViaResend({ to, subject, text, html }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, reason: 'no_resend' };
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: mailFrom(),
      to: [to],
      subject,
      text,
      html: html || undefined
    })
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.warn('[mail] Resend failed:', res.status, body.slice(0, 200));
    return { ok: false, reason: 'resend_' + res.status };
  }
  return { ok: true, provider: 'resend' };
}

async function sendViaSmtp({ to, subject, text, html }) {
  let nodemailer;
  try {
    nodemailer = require('nodemailer');
  } catch (e) {
    console.warn('[mail] nodemailer not installed — npm i nodemailer for SMTP support');
    return { ok: false, reason: 'nodemailer_missing' };
  }

  let transporter;
  if (process.env.SMTP_URL) {
    transporter = nodemailer.createTransport(process.env.SMTP_URL);
  } else if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' ||
        String(process.env.SMTP_PORT || '') === '465',
      auth:
        process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' }
          : undefined
    });
  } else {
    return { ok: false, reason: 'no_smtp' };
  }

  await transporter.sendMail({
    from: mailFrom(),
    to,
    subject,
    text,
    html: html || undefined
  });
  return { ok: true, provider: 'smtp' };
}

/**
 * @param {{ to: string, subject: string, text: string, html?: string }} opts
 */
async function sendMail(opts) {
  if (!opts || !opts.to || !opts.subject || !opts.text) {
    return { ok: false, reason: 'invalid_args' };
  }
  if (!isConfigured()) {
    return { ok: false, reason: 'not_configured' };
  }
  try {
    if (process.env.RESEND_API_KEY) {
      return await sendViaResend(opts);
    }
    return await sendViaSmtp(opts);
  } catch (e) {
    console.warn('[mail] send failed:', e && e.message ? e.message : e);
    return { ok: false, reason: 'send_error' };
  }
}

function publicAppUrl(req) {
  const env = (process.env.APP_PUBLIC_URL || process.env.LO_APP_URL || '').replace(/\/$/, '');
  if (env) return env;
  if (req && req.get) {
    const host = req.get('x-forwarded-host') || req.get('host');
    const proto = (req.get('x-forwarded-proto') || req.protocol || 'https').split(',')[0].trim();
    if (host) return proto + '://' + host;
  }
  return 'https://loanofficersalescoach.onrender.com';
}

module.exports = {
  isConfigured,
  sendMail,
  publicAppUrl
};
