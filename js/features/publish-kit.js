/**
 * js/features/publish-kit.js
 *
 * Next Steps checklist — optional, user-opened guide after reviewing content.
 * No auto-popup, no duplicate copy buttons. Newsletter Next Steps may link to Ruoff Marketing Portal.
 */
(function () {
  'use strict';

  const MODAL_ID = 'next-steps-modal';
  const CHECKLIST_PREFIX = 'nextStepsChecklist_';

  const MARKETING_PORTAL_URL = 'https://ruoffplus.ruoff.com/marketing/library/461?productId=1256';

  const LEVERAGE_TIPS = {
    newsletter: [
      'Pull your <strong>Personal Update</strong> or a market blurb into <strong>Social Post Creator</strong> — copy the text from the preview above.',
      'Tap <strong>Save to Vault</strong> above to store the <em>full newsletter</em> in <strong>My Saved Items</strong> (handy for archives or resending a past edition).',
      'Feature a recent blog in your next issue using the <strong>Blog Link</strong> checkbox when you generate again.',
      'Need branded flyers or social graphics? Use the <strong>Ruoff Marketing Portal</strong> link below to upload or order materials.',
    ],
    blog: [
      'Drop the <strong>social caption</strong> and <strong>Google post</strong> from this bundle the same day you publish.',
      'Add the post URL to your next <strong>Newsletter</strong> (Blog Link section).',
      'Film the <strong>Reel script</strong> this week — or save it for your content calendar.',
    ],
    social: [
      'Expand a winning post into a <strong>Blog Creator</strong> article for long-term SEO.',
      'Weave the same idea into your next <strong>Newsletter</strong> personal or local section.',
      'Save runner-up options to <strong>My Saved Items</strong> for busy weeks.',
    ],
  };

  const CHECKLISTS = {
    newsletter: [
      { id: 'proofread', label: 'Proofread the full newsletter — names, links, personal note, and tone' },
      { id: 'edits', label: 'Made any tweaks using Feedback / Regenerate (if needed)' },
      { id: 'test', label: 'Sent a test email to myself' },
      { id: 'send', label: 'Pasted into Outlook or my email platform and sent/scheduled to my database' },
      { id: 'repurpose', label: 'Repurposed content for social (copied from preview) or saved the full edition with Save to Vault' },
      { id: 'marketing', label: 'Uploaded or ordered branded materials via Ruoff Marketing Portal (optional)' },
    ],
    blog: [
      { id: 'proofread', label: 'Read the blog aloud — adjusted anything that doesn\'t sound like me' },
      { id: 'edits', label: 'Used Refine with Edits for any last changes (if needed)' },
      { id: 'publish', label: 'Published on my site using the Publish on Site button above' },
      { id: 'social', label: 'Posted the matching social caption' },
      { id: 'google', label: 'Posted the Google Business update' },
      { id: 'reel', label: 'Filmed or scheduled the Reel script (or saved for later)' },
      { id: 'newsletter', label: 'Queued this post for my next newsletter Blog Link feature' },
    ],
    social: [
      { id: 'pick', label: 'Picked my favorite of the 3 options' },
      { id: 'proofread', label: 'Quick proofread — tone, emojis, hashtags, local details' },
      { id: 'post', label: 'Posted to my primary platform' },
      { id: 'engage', label: 'Replied to early comments or DMs' },
      { id: 'save', label: 'Saved a backup option to My Saved Items' },
    ],
  };

  const SUBTITLES = {
    newsletter: 'Review first, then work through these when you\'re ready to send.',
    blog: 'Your blog + caption + Google post + Reel are ready — here\'s how to get the most from them.',
    social: 'Three options are ready — pick one and follow these steps when you\'re happy with it.',
  };

  function ensureModal() {
    let modal = document.getElementById(MODAL_ID);
    if (modal) {
      const content = modal.querySelector('.modal-content');
      if (content) {
        content.classList.remove('max-w-lg', 'max-w-md', 'max-w-xl');
        content.classList.add('max-w-3xl');
      }
      if (typeof window.ensureModalBackdropClose === 'function') {
        window.ensureModalBackdropClose(modal);
      }
      return modal;
    }

    modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.setAttribute('aria-hidden', 'true');
    modal.className = 'modal app-modal-overlay hidden fixed inset-0 bg-black/60 z-[100000] items-center justify-center p-4';
    modal.innerHTML = `
      <div class="modal-content bg-white dark:bg-gray-900 rounded-3xl max-w-3xl w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[92vh] flex flex-col" role="dialog" aria-labelledby="ns-modal-title">
        <div class="px-6 md:px-8 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <span class="inline-block text-[10px] font-bold tracking-[2px] text-[#00A89D] bg-[#00A89D]/10 px-2.5 py-1 rounded-full mb-2">WHEN YOU\'RE READY</span>
              <h3 id="ns-modal-title" class="text-2xl md:text-3xl font-bold text-[#002B5C] dark:text-white m-0 leading-tight">Next Steps</h3>
              <p id="ns-modal-subtitle" class="text-sm text-gray-500 dark:text-gray-400 mt-1.5 m-0 leading-relaxed"></p>
            </div>
            <button type="button" data-ns-close class="text-3xl leading-none text-gray-400 hover:text-red-500 transition flex-shrink-0" aria-label="Close">&times;</button>
          </div>
        </div>
        <div id="ns-modal-body" class="p-6 md:p-8 overflow-y-auto flex-1 space-y-5 custom-modal-scroll"></div>
        <div class="px-6 md:px-8 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/50 flex-shrink-0">
          <button type="button" data-ns-close class="w-full px-5 py-3 rounded-2xl bg-[#002B5C] text-white font-semibold text-sm hover:bg-[#001429] transition">Close</button>
        </div>
      </div>`;

    modal.querySelectorAll('[data-ns-close]').forEach((btn) => {
      btn.addEventListener('click', closeNextSteps);
    });
    document.body.appendChild(modal);
    if (typeof window.ensureModalBackdropClose === 'function') {
      window.ensureModalBackdropClose(modal);
    }
    return modal;
  }

  function closeNextSteps() {
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

  function renderChecklist(contentId, items) {
    if (!items?.length) return '';
    const saved = loadChecklist(contentId);
    const done = items.filter((i) => saved[i.id]).length;

    return `
      <div class="rounded-2xl border border-[#00A89D]/25 bg-[#00A89D]/5 p-5">
        <div class="flex items-center justify-between gap-2 mb-3">
          <h4 class="text-sm font-bold text-[#002B5C] dark:text-white m-0">Your checklist</h4>
          <span class="ns-checklist-progress text-[11px] font-bold text-[#00A89D]">${done}/${items.length}</span>
        </div>
        <ul class="space-y-3 m-0 p-0 list-none">
          ${items.map((item) => {
            const checked = !!saved[item.id];
            return `
              <li>
                <label class="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" class="ns-checklist-item mt-0.5 w-5 h-5 rounded-lg border-2 border-[#00A89D] text-[#00A89D] focus:ring-[#00A89D]/30 flex-shrink-0" data-ns-check="${item.id}" ${checked ? 'checked' : ''}>
                  <span class="text-sm text-gray-700 dark:text-gray-300 leading-snug ${checked ? 'line-through opacity-55' : ''}">${item.label}</span>
                </label>
              </li>`;
          }).join('')}
        </ul>
        <p class="text-[11px] text-gray-400 mt-3 mb-0">Use the buttons above this checklist to copy, download, or publish — this list is just your workflow guide.</p>
      </div>`;
  }

  function renderMarketingPortalCard(toolKey) {
    if (toolKey !== 'newsletter') return '';
    return `
      <div class="rounded-2xl border border-[#002B5C]/20 bg-[#002B5C]/5 dark:bg-[#002B5C]/15 p-5">
        <h4 class="text-sm font-bold text-[#002B5C] dark:text-white mb-2 flex items-center gap-2 m-0">
          <i class="fas fa-cloud-upload-alt text-[#00A89D]"></i> Ruoff Marketing Portal
        </h4>
        <p class="text-sm text-gray-600 dark:text-gray-400 m-0 mb-3 leading-relaxed">
          Upload files or order ready-made flyers, social graphics, and videos for your database and partners.
        </p>
        <a href="${MARKETING_PORTAL_URL}" target="_blank" rel="noopener noreferrer"
           class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00A89D] text-white text-sm font-semibold hover:bg-[#008F85] transition">
          <i class="fas fa-external-link-alt"></i> Open Marketing Upload
        </a>
      </div>`;
  }

  function renderLeverageTips(toolKey) {
    const tips = LEVERAGE_TIPS[toolKey];
    if (!tips?.length) return '';
    return `
      <div>
        <h4 class="text-sm font-bold text-[#002B5C] dark:text-white mb-2 flex items-center gap-2">
          <i class="fas fa-recycle text-[#F15A29]"></i> Get more mileage
        </h4>
        <ul class="space-y-2 m-0 pl-0 list-none text-sm text-gray-600 dark:text-gray-400">
          ${tips.map((t) => `<li class="flex gap-2"><span class="text-[#00A89D] font-bold">•</span><span>${t}</span></li>`).join('')}
        </ul>
      </div>`;
  }

  function wireChecklist(modal, contentId, items) {
    const body = modal.querySelector('#ns-modal-body');
    if (!body) return;

    body.querySelectorAll('.ns-checklist-item').forEach((cb) => {
      cb.addEventListener('change', () => {
        const itemId = cb.getAttribute('data-ns-check');
        saveChecklistItem(contentId, itemId, cb.checked);
        const label = cb.closest('label')?.querySelector('span');
        if (label) {
          label.classList.toggle('line-through', cb.checked);
          label.classList.toggle('opacity-55', cb.checked);
        }
        const saved = loadChecklist(contentId);
        const done = items.filter((i) => saved[i.id]).length;
        const prog = body.querySelector('.ns-checklist-progress');
        if (prog) prog.textContent = `${done}/${items.length}`;
      });
    });
  }

  function openNextSteps(toolKey, title, contentId) {
    const key = toolKey || 'newsletter';
    const modal = ensureModal();
    const titleEl = modal.querySelector('#ns-modal-title');
    const subEl = modal.querySelector('#ns-modal-subtitle');
    const body = modal.querySelector('#ns-modal-body');
    const checklist = CHECKLISTS[key] || CHECKLISTS.newsletter;
    const id = contentId || `${key}_${Date.now().toString(36)}`;

    if (titleEl) titleEl.textContent = title || 'Next Steps';
    if (subEl) subEl.textContent = SUBTITLES[key] || SUBTITLES.newsletter;

    if (body) {
      body.innerHTML = `
        <p class="text-sm text-gray-600 dark:text-gray-400 m-0 leading-relaxed">
          No rush — review your content above first. Open this checklist whenever you're ready to publish or repurpose.
        </p>
        ${renderChecklist(id, checklist)}
        ${renderMarketingPortalCard(key)}
        ${renderLeverageTips(key)}
      `;
      wireChecklist(modal, id, checklist);
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

  function openNewsletterNextSteps() {
    const title = (document.getElementById('nl-title')?.value || '').trim() || 'Newsletter';
    openNextSteps('newsletter', `${title} — Next Steps`, window._nlNextStepsId);
  }

  function openBlogNextSteps() {
    const title = (typeof window.getBlogNextStepsTitle === 'function')
      ? window.getBlogNextStepsTitle()
      : 'Blog Post';
    openNextSteps('blog', `${title} — Next Steps`, window._blogNextStepsId);
  }

  function openSocialNextSteps() {
    openNextSteps('social', 'Social Post — Next Steps', window._socialNextStepsId);
  }

  // Backward-compatible aliases
  window.openNextSteps = openNextSteps;
  window.closeNextSteps = closeNextSteps;
  window.openNewsletterNextSteps = openNewsletterNextSteps;
  window.openBlogNextSteps = openBlogNextSteps;
  window.openSocialNextSteps = openSocialNextSteps;
  window.openNewsletterPublishKit = openNewsletterNextSteps;
  window.openBlogPublishKit = openBlogNextSteps;
  window.openSocialPublishKit = () => openSocialNextSteps();
  window.closePublishKit = closeNextSteps;
})();