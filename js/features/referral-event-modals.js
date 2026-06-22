// Extracted referral / event / profile modal helpers (loaded async)
// Run `node scripts/finish-extract.mjs` to fully externalize the text/plain holder.

(function () {
  'use strict';

  const holder = document.getElementById('referral-event-modals-src');
  if (!holder) {
    console.warn('[referral-event-modals] inline source holder #referral-event-modals-src not found');
    return;
  }

  const code = holder.textContent;
  holder.remove();

  try {
    // eslint-disable-next-line no-new-func
    new Function(code)();
  } catch (err) {
    console.error('[referral-event-modals] failed to execute extracted script', err);
  }
})();