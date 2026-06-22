// Extracted app bulk features (loaded async — was inline in index.html)
// Run `node scripts/finish-extract.mjs` to fully externalize the text/plain holder.

(function () {
  'use strict';

  // Early defensive stub for Social Strategy rich modals
  if (typeof window.openSocialModal !== 'function') {
    window.openSocialModal = function (pillar) {
      const modal = document.getElementById('content-modal');
      const titleEl = document.getElementById('modal-title');
      const listEl = document.getElementById('modal-list');
      if (modal && titleEl && listEl) {
        titleEl.textContent = (pillar || 'Social Strategy') + ' — loading rich content...';
        listEl.innerHTML = `
          <div class="p-6 text-center">
            <p class="mb-4">Loading the refreshed Social Media Strategy content...</p>
            <button onclick="location.reload()" class="px-5 py-2 bg-[#00A89D] text-white rounded-2xl text-sm font-semibold">Force Reload Now</button>
          </div>
        `;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      } else {
        console.warn('[Social] openSocialModal called before full init. Try hard refresh (Ctrl+Shift+R).');
        alert('Social Strategy content is loading. Please hard refresh the page (Ctrl + Shift + R or Cmd + Shift + R) to see the latest rich modals.');
      }
    };
  }

  const holder = document.getElementById('app-bulk-src');
  if (!holder) {
    console.warn('[app-bulk] inline source holder #app-bulk-src not found');
    return;
  }

  const code = holder.textContent.replace(/^\/\/ PLACEHOLDER_START\n/, '');
  holder.remove();

  try {
    // eslint-disable-next-line no-new-func
    new Function(code)();
  } catch (err) {
    console.error('[app-bulk] failed to execute extracted bulk script', err);
  }

  // Legacy app-bulk-src may still define stale social helpers — always restore canonical module
  if (typeof window.restoreSocialModals === 'function') {
    window.restoreSocialModals();
    console.log('[app-bulk] Social modals restored from social-modals.js');
  }

  if (typeof window.restoreProcessModals === 'function') {
    window.restoreProcessModals();
    console.log('[app-bulk] Process modals restored from process-rich-modals.js');
  }

  if (typeof window.restoreNurtureModals === 'function') {
    window.restoreNurtureModals();
    console.log('[app-bulk] Nurture modals restored from nurture-rich-modals.js');
  }
})();