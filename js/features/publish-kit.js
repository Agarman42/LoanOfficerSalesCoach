/**
 * js/features/publish-kit.js
 *
 * Post-generation Publish Kit — platform copy, open-in links, posted checklist.
 */
(function () {
  'use strict';

  const MODAL_ID = 'publish-kit-modal';
  const CHECKLIST_PREFIX = 'publishKitChecklist_';

  const PLATFORM_LINKS = {
    mailchimp: { label: 'Mailchimp', url: 'https://login.mailchimp.com/', icon: 'fa-envelope-open-text', color: '#FFE01B' },
    constantcontact: { label: 'Constant Contact', url: 'https://app.constantcontact.com/', icon: 'fa-mail-bulk', color: '#1856a5' },
    outlook: { label: 'Outlook Web', url: 'https://outlook.office.com/mail/', icon: 'fa-envelope', color: '#0078D4' },
    linkedin: { label: 'LinkedIn', url: 'https://www.linkedin.com/feed/', icon: 'fab fa-linkedin', color: '#0A66C2' },
    facebook: { label: 'Facebook', url: 'https://www.facebook.com/', icon: 'fab fa-facebook', color: '#1877F2' },
    instagram: { label: 'Instagram', url: 'https://www.instagram.com/', icon: 'fab fa-instagram', color: '#E4405F' },
    googlebusiness: { label: 'Google Business', url: 'https://business.google.com/', icon: 'fab fa-google', color: '#4285F4' },
    ruoffpublish: { label: 'Ruoff Blog Publisher', url: 'https://sales.ruoff.com/', icon: 'fa-external-link-alt', color: '#00A89D' },
  };

  let currentKit = null;

  function ensureModal() {
    let modal = document.getElementById(MODAL_ID);
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.setAttribute('aria-hidden', 'true');
    modal.className = 'modal app-modal-overlay hidden fixed inset-0 bg-black/60 z-[100000] items-center justify-center p-4';
    modal.innerHTML = `
      <div class="modal-content bg-white dark:bg-gray-900 rounded-3xl max-w-2xl w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[92vh] flex flex-col" role="dialog" aria-labelledby="pk-modal-title">
        <div class="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-[#00A89D]/8 via-white to-[#F15A29]/5 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 flex-shrink-0">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <span class="inline-block text-[10px] font-bold tracking-[2px] text-[#00A89D] bg-[#00A89D]/10 px-2.5 py-1 rounded-full mb-2">PUBLISH KIT</span>
              <h3 id="pk-modal-title" class="text-2xl md:text-3xl font-bold text-[#002B5C] dark:text-white m-0 leading-tight truncate">Ready to publish</h3>
              <p id="pk-modal-subtitle" class="text-sm text-gray-500 dark:text-gray-400 mt-1 m-0"></p>
            </div>
            <button type="button" data-pk-close class="text-4xl leading-none text-gray-400 hover:text-red-500 transition flex-shrink-0" aria-label="Close">&times;</button>
          </div>
        </div>
        <div id="pk-modal-body" class="p-6 overflow-y-auto flex-1 space-y-6 custom-modal-scroll"></div>
        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/50 flex-shrink-0 flex flex-wrap gap-3 justify-end">
          <button type="button" data-pk-close class="px-5 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-semibold text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition">Done for now</button>
          <button type="button" id="pk-open-later" class="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#00A89D] to-[#F15A29] text-white font-semibold text-sm shadow-md hover:opacity-90 transition">Got it — let's publish</button>
        </div>
      </div>`;

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closePublishKit();
    });
    modal.querySelectorAll('[data-pk-close]').forEach((btn) => {
      btn.addEventListener('click', closePublishKit);
    });
    document.body.appendChild(modal);
    return modal;
  }

  function closePublishKit() {
    const modal = document.getElementById(MODAL_ID);
    if (!modal) return;
    if (typeof window.closeAppModal === 'function') {
      window.closeAppModal(modal);
    } else {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      modal.style.display = 'none';
    }
    modal.setAttribute('aria-hidden', 'true');
    currentKit = null;
  }

  function loadChecklist(contentId) {
    try {
      return JSON.parse(localStorage.getItem(CHECKLIST_PREFIX + contentId) || '{}');
    } catch (e) {
      return {};
    }
  }

  function saveChecklistItem(contentId, itemId, checked) {
    const data = loadChecklist(contentId);
    data[itemId] = !!checked;
    try {
      localStorage.setItem(CHECKLIST_PREFIX + contentId, JSON.stringify(data));
    } catch (e) { /* ignore */ }
  }

  function copyText(text, format) {
    if (!text) return Promise.reject(new Error('empty'));

    if (format === 'html' && navigator.clipboard && window.ClipboardItem) {
      const blob = new Blob([text], { type: 'text/html' });
      return navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]);
    }

    const plain = format === 'html'
      ? text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      : text;

    return navigator.clipboard.writeText(plain);
  }

  function flashButton(btn, successHtml) {
    if (!btn) return;
    const orig = btn.innerHTML;
    btn.innerHTML = successHtml || '<i class="fas fa-check"></i> Copied!';
    btn.disabled = true;
    setTimeout(() => {
      btn.innerHTML = orig;
      btn.disabled = false;
    }, 1800);
  }

  function renderAssetButtons(assets) {
    if (!assets?.length) return '';
    return `
      <div>
        <h4 class="text-sm font-bold text-[#002B5C] dark:text-white mb-3 flex items-center gap-2">
          <i class="fas fa-copy text-[#00A89D]"></i> Copy for publishing
        </h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${assets.map((a) => `
            <button type="button" class="pk-copy-btn flex items-center gap-3 p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-[#00A89D] bg-white dark:bg-gray-900 text-left transition group" data-pk-copy="${a.id}" data-pk-format="${a.format || 'text'}">
              <span class="w-10 h-10 rounded-xl bg-[#00A89D]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#00A89D]/20 transition">
                <i class="fas ${a.icon || 'fa-file-alt'} text-[#00A89D]"></i>
              </span>
              <span class="min-w-0">
                <span class="block font-semibold text-[#002B5C] dark:text-white text-sm">${a.label}</span>
                <span class="block text-[11px] text-gray-400 truncate">${a.hint || 'Tap to copy'}</span>
              </span>
            </button>
          `).join('')}
        </div>
      </div>`;
  }

  function renderPlatformLinks(platformKeys) {
    if (!platformKeys?.length) return '';
    const links = platformKeys.map((k) => PLATFORM_LINKS[k]).filter(Boolean);
    if (!links.length) return '';

    return `
      <div>
        <h4 class="text-sm font-bold text-[#002B5C] dark:text-white mb-3 flex items-center gap-2">
          <i class="fas fa-external-link-alt text-[#F15A29]"></i> Open in…
        </h4>
        <div class="flex flex-wrap gap-2">
          ${links.map((p) => `
            <a href="${p.url}" target="_blank" rel="noopener" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-semibold text-[#002B5C] dark:text-white hover:border-[#00A89D]/50 hover:shadow-sm transition">
              <i class="${p.icon}" style="color:${p.color}"></i>
              ${p.label}
            </a>
          `).join('')}
        </div>
        <p class="text-[11px] text-gray-400 mt-2 m-0">Opens in a new tab — paste your copied content there.</p>
      </div>`;
  }

  function renderChecklist(contentId, items) {
    if (!items?.length) return '';
    const saved = loadChecklist(contentId);
    const done = items.filter((i) => saved[i.id]).length;

    return `
      <div class="rounded-2xl border border-[#00A89D]/25 bg-[#00A89D]/5 p-5">
        <div class="flex items-center justify-between gap-2 mb-3">
          <h4 class="text-sm font-bold text-[#002B5C] dark:text-white m-0 flex items-center gap-2">
            <i class="fas fa-tasks text-[#00A89D]"></i> Posted checklist
          </h4>
          <span class="pk-checklist-progress text-[11px] font-bold text-[#00A89D]">${done}/${items.length}</span>
        </div>
        <ul class="space-y-2 m-0 p-0 list-none">
          ${items.map((item) => {
            const checked = !!saved[item.id];
            return `
              <li>
                <label class="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" class="pk-checklist-item mt-1 w-5 h-5 rounded-lg border-2 border-[#00A89D] text-[#00A89D] focus:ring-[#00A89D]/30" data-pk-check="${item.id}" ${checked ? 'checked' : ''}>
                  <span class="text-sm text-gray-700 dark:text-gray-300 group-hover:text-[#002B5C] dark:group-hover:text-white transition ${checked ? 'line-through opacity-60' : ''}">${item.label}</span>
                </label>
              </li>`;
          }).join('')}
        </ul>
      </div>`;
  }

  function wireModalInteractions(modal, kit) {
    const body = modal.querySelector('#pk-modal-body');
    if (!body) return;

    body.querySelectorAll('[data-pk-copy]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-pk-copy');
        const format = btn.getAttribute('data-pk-format') || 'text';
        const asset = kit.assets?.find((a) => a.id === id);
        if (!asset) return;

        let payload = asset.text;
        if (typeof asset.getText === 'function') {
          try { payload = asset.getText(); } catch (e) { /* ignore */ }
        }

        try {
          if (asset.action && typeof asset.action === 'function') {
            await asset.action();
          } else {
            await copyText(payload, format);
          }
          flashButton(btn, '<span class="text-[#00A89D] font-semibold text-sm"><i class="fas fa-check"></i> Copied!</span>');
          if (window.showToast) window.showToast(`${asset.label} copied`, 'success');
        } catch (e) {
          if (asset.fallbackAction) {
            asset.fallbackAction();
          } else {
            alert('Copy failed — try the button in the output area.');
          }
        }
      });
    });

    body.querySelectorAll('.pk-checklist-item').forEach((cb) => {
      cb.addEventListener('change', () => {
        const itemId = cb.getAttribute('data-pk-check');
        saveChecklistItem(kit.contentId, itemId, cb.checked);
        const label = cb.closest('label')?.querySelector('span');
        if (label) {
          label.classList.toggle('line-through', cb.checked);
          label.classList.toggle('opacity-60', cb.checked);
        }
        const items = kit.checklist || [];
        const saved = loadChecklist(kit.contentId);
        const done = items.filter((i) => saved[i.id]).length;
        const prog = body.querySelector('.pk-checklist-progress');
        if (prog) prog.textContent = `${done}/${items.length}`;
      });
    });
  }

  function openPublishKit(kit) {
    if (!kit) return;
    currentKit = kit;
    const modal = ensureModal();
    const titleEl = modal.querySelector('#pk-modal-title');
    const subEl = modal.querySelector('#pk-modal-subtitle');
    const body = modal.querySelector('#pk-modal-body');

    if (titleEl) titleEl.textContent = kit.title || 'Ready to publish';
    if (subEl) subEl.textContent = kit.subtitle || 'Copy, paste, and check off — your content is ready for the world.';

    if (body) {
      body.innerHTML = `
        ${kit.tip ? `<p class="text-sm text-gray-600 dark:text-gray-400 m-0 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">${kit.tip}</p>` : ''}
        ${renderAssetButtons(kit.assets)}
        ${renderPlatformLinks(kit.platforms)}
        ${renderChecklist(kit.contentId, kit.checklist)}
      `;
      wireModalInteractions(modal, kit);
    }

    modal.setAttribute('aria-hidden', 'false');
    if (typeof window.openAppModal === 'function') {
      window.openAppModal(modal);
    } else {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      modal.style.display = 'flex';
    }
  }

  function openNewsletterPublishKit() {
    const title = (document.getElementById('nl-title')?.value || '').trim() || 'Your Newsletter';
    const contentId = `nl_${Date.now().toString(36)}`;

    openPublishKit({
      contentType: 'newsletter',
      title,
      subtitle: 'Email-ready HTML — optimized for Outlook paste.',
      contentId,
      tip: '<strong>Pro tip:</strong> Paste into a <em>new</em> Outlook email (not a reply). Send a test to yourself first, then your database.',
      assets: [
        {
          id: 'outlook',
          label: 'Outlook / Email HTML',
          hint: 'Formatted for paste into Outlook',
          icon: 'fa-envelope',
          format: 'html',
          getText: () => (typeof window.getCleanOutlookHTML === 'function' ? window.getCleanOutlookHTML() : ''),
          fallbackAction: () => { if (typeof window.copyForOutlook === 'function') window.copyForOutlook(); },
        },
        {
          id: 'download',
          label: 'Download .html file',
          hint: 'Save and open locally',
          icon: 'fa-download',
          action: async () => {
            if (typeof window.downloadNewsletterHTML === 'function') window.downloadNewsletterHTML();
          },
        },
      ],
      platforms: ['outlook', 'mailchimp', 'constantcontact'],
      checklist: [
        { id: 'test', label: 'Sent a test email to myself' },
        { id: 'paste', label: 'Pasted into email client or ESP' },
        { id: 'database', label: 'Scheduled or sent to my database' },
        { id: 'social', label: 'Shared a teaser on social media' },
        { id: 'vault', label: 'Saved a copy to My Saved Items' },
      ],
    });
  }

  function openBlogPublishKit() {
    if (typeof window.getBlogPublishKitConfig === 'function') {
      openPublishKit(window.getBlogPublishKitConfig());
      return;
    }
    openPublishKit({
      contentType: 'blog',
      title: 'Your Blog Bundle',
      subtitle: 'Blog + social caption + Google post ready to go.',
      contentId: `blog_${Date.now().toString(36)}`,
      assets: [],
      platforms: ['ruoffpublish', 'linkedin', 'facebook', 'googlebusiness'],
      checklist: [
        { id: 'site', label: 'Published on my blog / Ruoff site' },
        { id: 'social', label: 'Posted social caption' },
        { id: 'google', label: 'Posted Google Business update' },
        { id: 'reel', label: 'Filmed or scheduled Reel content' },
      ],
    });
  }

  function openSocialPublishKit(posts, selectedIndex) {
    const idx = selectedIndex ?? 0;
    const post = posts?.[idx] || '';
    const contentId = `social_${Date.now().toString(36)}`;

    openPublishKit({
      contentType: 'social',
      title: 'Social Post Options',
      subtitle: `Option ${idx + 1} selected — copy and post where your audience lives.`,
      contentId,
      assets: (posts || []).map((text, i) => ({
        id: `opt${i}`,
        label: `Option ${i + 1}`,
        hint: i === idx ? 'Selected · tap to copy' : 'Tap to copy this version',
        icon: 'fa-share-alt',
        text,
        format: 'text',
      })),
      platforms: ['linkedin', 'facebook', 'instagram'],
      checklist: [
        { id: 'posted', label: 'Posted my chosen caption' },
        { id: 'engaged', label: 'Replied to early comments' },
        { id: 'saved', label: 'Saved backup options to My Saved Items' },
      ],
    });
  }

  window.openPublishKit = openPublishKit;
  window.closePublishKit = closePublishKit;
  window.openNewsletterPublishKit = openNewsletterPublishKit;
  window.openBlogPublishKit = openBlogPublishKit;
  window.openSocialPublishKit = openSocialPublishKit;
})();