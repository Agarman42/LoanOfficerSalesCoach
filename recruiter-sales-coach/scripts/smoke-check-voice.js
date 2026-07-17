#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const proxy = fs.readFileSync(path.join(root, 'proxy.js'), 'utf8');

const checks = [
  ['voice-roleplay section', html.includes('id="voice-roleplay"')],
  ['call-review section', html.includes('id="call-review"')],
  ['sidebar voice', html.includes('href="#voice-roleplay"')],
  ['sidebar call review', html.includes('href="#call-review"')],
  ['voice script', html.includes('voice-roleplay.js')],
  ['call-review script', html.includes('call-review.js')],
  ['proxy client-secret', proxy.includes('/api/voice/client-secret')],
  ['proxy stt', proxy.includes('/api/v1/stt')],
  ['agent id', proxy.includes('agent_dPytnYBuJKo5KrKQ') || html.includes('agent_dPytnYBuJKo5KrKQ')],
];

let fail = false;
checks.forEach(([n, ok]) => {
  console.log(ok ? 'OK' : 'FAIL', n);
  if (!ok) fail = true;
});
process.exit(fail ? 1 : 0);
