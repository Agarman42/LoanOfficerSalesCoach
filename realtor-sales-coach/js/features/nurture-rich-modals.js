/**
 * js/features/nurture-rich-modals.js
 * Bespoke premium modals for Database Nurturing templates + Life Event playbooks.
 */
(function () {
  'use strict';

  const NURTURE_TITLES = {
    anniversary: 'Home Anniversary Touch Script',
    'birthday-video': 'Birthday Video Message Template',
    'referral-ask': 'Natural Referral Ask Script',
    'scalable-touches': '21 Scalable Touches – Full List + How to Use Them'
  };

  const LIFE_EVENT_TITLES = {
    marriage: 'Marriage / New Relationship',
    baby: 'New Baby',
    job: 'Job Change / Promotion',
    'empty-nest': 'Empty Nest',
    retirement: 'Retirement',
    divorce: 'Divorce or Inheritance'
  };

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function whyBox(label, text, accent) {
    if (accent === 'orange') {
      return `
        <div class="bg-[#F15A29]/10 border border-[#F15A29]/30 rounded-3xl p-6 mb-6">
          <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#F15A29]"></i><span class="font-bold text-[#F15A29] uppercase tracking-wider text-sm">${esc(label)}</span></div>
          <p class="text-[15px] leading-relaxed">${text}</p>
        </div>`;
    }
    return `
      <div class="bg-[#00A89D]/10 border border-[#00A89D]/30 rounded-3xl p-6 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[#00A89D]"></i><span class="font-bold text-[#00A89D] uppercase tracking-wider text-sm">${esc(label)}</span></div>
        <p class="text-[15px] leading-relaxed">${text}</p>
      </div>`;
  }

  function scriptCard(title, script, tip, saveKey) {
    return `
      <div class="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <div class="font-semibold text-sm text-[#002B5C] dark:text-white mb-2">${esc(title)}</div>
        <div class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">"${esc(script)}"</div>
        ${tip ? `<div class="mt-2 text-[10px] text-gray-500">${esc(tip)}</div>` : ''}
        <button type="button" data-nurture-copy="${esc(script)}"
          class="mt-3 text-[10px] px-3 py-1.5 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold transition">
          <i class="fas fa-copy mr-1"></i>Copy script
        </button>
        ${saveKey ? `<button type="button" data-nurture-save="${esc(saveKey)}" data-nurture-save-text="${esc(script)}"
          class="mt-2 ml-2 text-[10px] px-3 py-1.5 rounded-xl border border-[#F15A29] text-[#F15A29] hover:bg-[#F15A29] hover:text-white font-semibold transition">
          <i class="fas fa-bookmark mr-1"></i>Save
        </button>` : ''}
      </div>`;
  }

  function cadenceList(items) {
    return `<ul class="text-sm space-y-1.5 mb-6 list-disc pl-5 text-gray-700 dark:text-gray-300">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
  }

  function proTip(text) {
    return `<div class="p-4 bg-[#F15A29]/5 border border-[#F15A29]/20 rounded-2xl text-sm mb-6"><strong>Pro Tip:</strong> ${text}</div>`;
  }

  function bridgeRow(buttons) {
    return `
      <div class="flex flex-wrap gap-2 mb-2">
        ${buttons.map((b) => `
          <button type="button" data-nurture-bridge="${esc(b.action)}"
            class="text-xs px-3 py-2 rounded-xl ${b.primary ? 'bg-[#002B5C] text-white font-semibold hover:bg-black' : 'border border-[#00A89D] text-[#00A89D] font-semibold hover:bg-[#00A89D]/5'} transition">
            ${esc(b.label)} →
          </button>`).join('')}
      </div>`;
  }

  function nextStepsHtml(links) {
    if (typeof window.renderModalNextSteps === 'function') {
      return window.renderModalNextSteps(links, 'Put This to Work');
    }
    return '';
  }

  function attachHandlers(contentEl) {
    contentEl.querySelectorAll('[data-nurture-copy]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-nurture-copy') || '';
        navigator.clipboard.writeText(text).then(() => {
          const orig = btn.innerHTML;
          btn.innerHTML = '<i class="fas fa-check mr-1"></i>Copied!';
          setTimeout(() => { btn.innerHTML = orig; }, 1600);
        }).catch(() => {});
      });
    });

    contentEl.querySelectorAll('[data-nurture-save]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-nurture-save');
        const text = btn.getAttribute('data-nurture-save-text') || '';
        if (typeof window.toggleSaveIdea === 'function') {
          window.toggleSaveIdea(key, text, btn, 'nurture');
        }
      });
    });

    contentEl.querySelectorAll('[data-nurture-bridge]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-nurture-bridge');
        if (typeof closeNamedModal === 'function') closeNamedModal('nurture-template-modal');
        if (typeof closeDetailModal === 'function') closeDetailModal();
        setTimeout(() => {
          if (action === 'weekly' && typeof window.showSection === 'function') {
            window.showSection('weekly-win-plan');
          } else if (action === 'equity' && typeof window.showSection === 'function') {
            if (typeof window.showSection === 'function') window.showSection('value-vault');
            if (typeof window.openVaultItemWhenReady === 'function') window.openVaultItemWhenReady('annual-home-equity-review');
          } else if (action === 'social' && typeof window.showSection === 'function') {
            window.showSection('social');
          } else if (action === 'referrals' && typeof window.showSection === 'function') {
            window.showSection('referrals');
          } else if (action === 'vault' && typeof window.showSection === 'function') {
            window.showSection('value-vault');
          } else if (action === 'scripts' && typeof window.showSection === 'function') {
            window.showSection('sales-script');
          } else if (action === 'touches' && typeof showClientAppreciationModal === 'function') {
            showClientAppreciationModal('touches');
          } else if (action === 'events' && typeof showClientAppreciationModal === 'function') {
            showClientAppreciationModal('events');
          } else if (action?.startsWith('vault:') && typeof window.openVaultItemWhenReady === 'function') {
            if (typeof window.showSection === 'function') window.showSection('value-vault');
            setTimeout(() => window.openVaultItemWhenReady(action.split(':')[1]), 200);
          } else if (action?.startsWith('nurture:') && typeof window.showNurtureTemplateModal === 'function') {
            window.showNurtureTemplateModal(action.split(':')[1]);
          } else if (action?.startsWith('process:') && typeof window.showProcessTemplateModal === 'function') {
            window.showProcessTemplateModal(action.split(':')[1]);
          }
        }, 220);
      });
    });
  }

  // ─── NURTURE TEMPLATES ───────────────────────────────────────────────
  function renderAnniversary(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">ANNUAL TOUCH</span></div>
      ${whyBox('Why This Touch Works So Well', 'The home purchase anniversary is one of the most powerful touches in your database. It feels personal, relevant, and positions you as someone who cares about their life — not just the transaction.')}
      <h4 class="font-bold text-lg mb-2 text-[#002B5C] dark:text-white">Recommended approach</h4>
      ${cadenceList([
        '<strong>Format:</strong> Handwritten card + small gift OR 30–60 second personal video',
        '<strong>Include:</strong> Quick equity snapshot or neighborhood value trend',
        '<strong>Timing:</strong> Send 7–10 days before the actual anniversary',
        '<strong>Soft ask:</strong> Referral mention only if relationship is warm'
      ])}
      <div class="space-y-4 mb-6">
        ${scriptCard('Anniversary card or video',
          '[Name], it\'s hard to believe it\'s already been [X] years since you closed on your home! I hope it\'s still treating you well and that the neighborhood feels like home. I pulled a quick update on values in your area — happy to hop on a quick call if you\'re ever curious what your equity position looks like these days. No pressure at all.',
          'Add a P.S. with one specific memory from closing day.', 'Nurture: Anniversary Touch')}
        ${scriptCard('10–14 day follow-up text',
          'Hope the [gift] is getting some use! Let me know if I can ever be a resource.',
          'Send after gift/card lands — keeps the thread warm.', 'Nurture: Anniversary Follow-Up')}
      </div>
      <div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 text-sm mb-6">
        <strong>Gift ideas:</strong> Cutting board, doormat, plant, local treat, wine with custom label. Photo the gift before sending — great social content with permission.
      </div>
      ${bridgeRow([
        { label: 'Home anniversary check-in framework', action: 'vault:annual-home-equity-review', primary: true },
        { label: 'Client anniversary system', action: 'vault:client-anniversary-system' },
        { label: 'Annual equity review', action: 'equity' }
      ])}
      ${nextStepsHtml([
        { label: 'High-ROI Personal Touches', onclick: "closeNamedModal('nurture-template-modal'); if(typeof showClientAppreciationModal==='function')showClientAppreciationModal('touches');", style: 'primary' },
        { label: 'Annual Home Review', onclick: "closeNamedModal('nurture-template-modal'); if(typeof window.showSection==='function')window.showSection('value-vault'); if(typeof window.openVaultItemWhenReady==='function')window.openVaultItemWhenReady('annual-home-equity-review');", style: 'accent' }
      ])}
    `;
    attachHandlers(contentEl);
  }

  function renderBirthdayVideo(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-600">2-MIN RECORD</span></div>
      ${whyBox('Why Birthday Videos Crush It', 'A 30–60 second personal video feels incredibly thoughtful in 2026. Almost no one does it. It takes 2 minutes to record and creates a huge emotional deposit.')}
      <div class="space-y-4 mb-6">
        ${scriptCard('45-second birthday video',
          'Hey [First Name], it\'s [Your Name] — I just wanted to wish you a happy birthday! Hope you\'re doing something fun today with the people you love. I\'ve been thinking about you and your family and how much I enjoyed helping you get into your home. If there\'s ever anything I can do for you or anyone you know, just let me know. Have an amazing day!',
          'Mention one specific detail: deck, kids, neighborhood.', 'Nurture: Birthday Video')}
        ${scriptCard('Same-day follow-up text',
          'Just sent you a quick birthday video — hope you liked it!',
          'Send 2–3 hours after the video.', 'Nurture: Birthday Text Follow-Up')}
      </div>
      <div class="rounded-2xl border border-[#00A89D]/30 bg-[#00A89D]/5 p-4 text-sm mb-6">
        <strong>Batch tip:</strong> Pull this week\'s birthdays every Monday during Power Hour (same block as 7-day calls). Record all videos in one 20-minute sitting.
      </div>
      ${bridgeRow([
        { label: 'Client anniversary system', action: 'vault:client-anniversary-system', primary: true },
        { label: 'Weekly Win Plan', action: 'weekly' },
        { label: '7-day call framework', action: 'vault:post-closing-7day' }
      ])}
      ${nextStepsHtml([
        { label: 'Weekly Win Plan (Batch Videos)', onclick: "closeNamedModal('nurture-template-modal'); if(typeof window.showSection==='function')window.showSection('weekly-win-plan');", style: 'accent' }
      ])}
    `;
    attachHandlers(contentEl);
  }

  function renderReferralAsk(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#F15A29]/10 text-[#F15A29]">AFTER VALUE DELIVERED</span></div>
      ${whyBox('Best Timing & Mindset', 'Only after consistent value — especially after a strong anniversary touch, life event response, or when they\'ve raved about you. The ask should feel like a natural extension, never transactional.')}
      <div class="space-y-4 mb-6">
        ${scriptCard('Low-pressure ask (after positive touch)',
          '[Name], I\'m really glad I was able to help you with your home. If you ever come across anyone who\'s thinking about buying or selling, I\'d be honored if you\'d think of me. I promise I\'ll take great care of them the same way I took care of you.',
          'Make it about helping their people, not your pipeline.', 'Nurture: Referral Ask')}
        ${scriptCard('After they\'ve raved or referred',
          'That means a lot — thank you. If you know anyone else who might be in a similar situation, I\'d love the opportunity to help them too. No pressure at all — only if it feels natural for you.',
          'Send thank-you gift within 48 hours of any referral.', 'Nurture: Referral Ask (Rave)')}
        ${scriptCard('Easy referral path',
          'Just text me their name and number and I\'ll reach out gently — no awkward pressure on your end.',
          'Lower the friction — most people want to help but don\'t know how.', 'Nurture: Referral Easy Path')}
      </div>
      ${proTip('The best referral sources are clients you helped solve a real problem for. Remind them how you made their life easier — then ask.')}
      ${bridgeRow([
        { label: 'Referral partner playbooks', action: 'referrals', primary: true },
        { label: '7-day call scripts', action: 'vault:post-closing-7day' },
        { label: 'Referral flywheel system', action: 'vault:referral-flywheel-system' }
      ])}
    `;
    attachHandlers(contentEl);
  }

  function renderScalableTouches(contentEl) {
    const categories = [
      { label: 'Social & Visibility', color: 'border-[#00A89D]', items: ['Like/comment on 10+ client/partner posts per week', 'Post photos from client events or local happenings', 'Share local business spotlights (tag them)', 'Post fun polls or "this or that" questions'] },
      { label: 'Value & Content', color: 'border-purple-400', items: ['Monthly value-first newsletter', 'Quarterly market update video', 'Share one useful article/tool per week', 'Forward local market news with personal note', '"Just sold in your neighborhood" touch'] },
      { label: 'Light Personal', color: 'border-[#002B5C]/30', items: ['Quarterly "just checking in" text to B-tier', 'Quick voice note instead of text occasionally', 'Tag people in relevant local posts', 'Quarterly equity snapshot email (1-pager)'] },
      { label: 'Higher-Impact (1–2/month)', color: 'border-[#F15A29]/40', items: ['Co-host quarterly lunch & learn or buyer workshop', 'Seasonal value emails (recipes, maintenance tips)', 'End-of-year thank-you video to top 100', 'Thoughtful comments on partner and sphere posts'] }
    ];
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">SCALE WITHOUT BURNOUT</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 text-xs">4–6 TOUCHES / MONTH</span>
      </div>
      ${whyBox('Why Scalable Touches Matter', 'The 80% of your database that doesn\'t need quarterly personal calls still needs to hear from you. Low-effort touches create visibility and goodwill without burning you out — and they convert into referrals at scale.')}
      <div class="space-y-3 mb-6">
        ${categories.map((c) => `
          <div class="rounded-2xl border-l-4 ${c.color} border border-gray-200 dark:border-gray-700 p-4">
            <div class="font-bold text-sm text-[#002B5C] dark:text-white mb-2">${esc(c.label)}</div>
            <ul class="text-sm space-y-1 text-gray-700 dark:text-gray-300">${c.items.map((i) => `<li class="flex gap-2"><span class="text-[#00A89D]">•</span>${esc(i)}</li>`).join('')}</ul>
          </div>`).join('')}
      </div>
      <div class="space-y-4 mb-6">
        ${scriptCard('"Just sold in your neighborhood"',
          'Just closed on a great 3-bed in the [Neighborhood] area — happy to share what the market is actually doing right now if you or anyone in your world is curious. No pitch, just data.',
          'Works as text, email, or social caption.', 'Scalable Touch: Just Sold')}
        ${scriptCard('Quarterly market update',
          'Quick market note for [Neighborhood] — inventory is up about 12% from last month. If you\'ve been watching the market, this is actually creating some opportunity for buyers who\'ve been waiting. Happy to run real numbers if anyone in your world is curious.',
          'Pair with a simple chart or 30-sec video.', 'Scalable Touch: Market Update')}
      </div>
      <div class="grid md:grid-cols-2 gap-4 mb-6 text-sm">
        <div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-4"><strong>Simple monthly mix</strong><br>2–3 social posts · 1 value email · 1–2 light texts · 1 higher-impact item</div>
        <div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-4"><strong>90-minute monthly batch</strong><br>Record 8–10 videos · Write 10–15 check-in texts · Schedule newsletter + social</div>
      </div>
      ${bridgeRow([
        { label: 'Weekly Win Plan', action: 'weekly', primary: true },
        { label: 'Social strategy pillars', action: 'social' },
        { label: '12-month nurture calendar', action: 'vault:nurture-12month-calendar' }
      ])}
    `;
    attachHandlers(contentEl);
  }

  // ─── LIFE EVENTS ─────────────────────────────────────────────────────
  const BADGE_STYLES = {
    teal: 'bg-[#00A89D]/10 text-[#00A89D]',
    orange: 'bg-[#F15A29]/10 text-[#F15A29]',
    purple: 'bg-purple-500/10 text-purple-600'
  };

  function lifeEventShell(badge, badgeStyle, whyLabel, whyText, whyAccent, bodyHtml, bridges, nextLinks) {
    return `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full ${BADGE_STYLES[badgeStyle] || BADGE_STYLES.teal}">${esc(badge)}</span></div>
      ${whyBox(whyLabel, whyText, whyAccent)}
      ${bodyHtml}
      ${bridges ? bridgeRow(bridges) : ''}
      ${nextLinks ? nextStepsHtml(nextLinks) : ''}`;
  }

  function renderLifeMarriage(contentEl) {
    contentEl.innerHTML = lifeEventShell('CELEBRATE FIRST', 'teal', 'Why This Life Event Is High-Leverage',
      'Engagements and marriages are natural inflection points for combining households, upgrading, or investing together. Celebrate first — quietly position yourself as the calm expert when those conversations surface.',
      'teal',
      `${cadenceList(['<strong>1–2 weeks:</strong> Congratulations note or gift (no business talk)', '<strong>30–60 days:</strong> Light check-in — "how\'s wedding planning?"', '<strong>90+ days:</strong> Optional housing conversation if they\'ve hinted at moving'])}
      <div class="space-y-4 mb-6">
        ${scriptCard('Initial congratulations', 'Congratulations on your engagement! That\'s such exciting news. Wishing you both all the best in this next chapter — can\'t wait to see what you two build together.', 'Card, text, or small gift — no real estate talk.', 'Life Event: Marriage Congrats')}
        ${scriptCard('Soft housing door-opener (60–90 days later)', 'I know a lot of couples start thinking about their housing situation around this time — whether that means upgrading, combining households, or even investing together. I\'d love to be a calm, no-pressure resource if any of those conversations come up.', 'Only if timing feels natural.', 'Life Event: Marriage Housing')}
      </div>
      <p class="text-sm mb-4"><strong>Gift ideas:</strong> Monogram cutting board, local wine, "home together" cookbook, plant — celebratory, not sales-themed.</p>
      ${proTip('Ask about wedding plans and reference something specific next time. Couples remember who showed up early with genuine joy.')}`,
      [
        { label: 'Sales scripts (couples)', action: 'scripts', primary: true },
        { label: 'Gift ideas vault', action: 'vault' }
      ]);
    attachHandlers(contentEl);
  }

  function renderLifeBaby(contentEl) {
    contentEl.innerHTML = lifeEventShell('SUPPORT FIRST', 'teal', 'Why New Parents Become Great Referral Sources',
      'A thoughtful baby touch creates loyalty for years. Lead with support, not square footage. The equity conversation can wait 6–9 months unless they bring it up.',
      'teal',
      `${cadenceList(['<strong>2–4 weeks after birth:</strong> Gift + congratulations (keep it short)', '<strong>6–9 months:</strong> Growing family equity check-in if relevant', '<strong>Annually:</strong> Birthday video — reference baby by name'])}
      <div class="space-y-4 mb-6">
        ${scriptCard('Initial congratulations', 'Huge congratulations on the new baby! I hope everyone is doing well and you\'re getting a little sleep here and there. Wishing your family all the best — so happy for you.', 'They\'re exhausted — keep it brief and warm.', 'Life Event: New Baby Congrats')}
        ${scriptCard('6–9 month follow-up (if relevant)', 'I know space needs can change quickly with a new little one. If you ever want to look at what your current equity could do for a move-up or even a small renovation, I\'m always happy to run some quick numbers — no pressure at all.', 'Only when space seems tight.', 'Life Event: New Baby Equity')}
      </div>
      <p class="text-sm mb-4"><strong>Gift ideas:</strong> Board books, onesie, meal delivery card, soft blanket — never salesy.</p>
      ${proTip('Note the baby\'s name in CRM. Reference it in every future touch — parents feel genuinely known.')}`,
      [
        { label: 'Annual equity review', action: 'equity', primary: true },
        { label: 'Personal touches', action: 'touches' }
      ]);
    attachHandlers(contentEl);
  }

  function renderLifeJob(contentEl) {
    contentEl.innerHTML = lifeEventShell('INCOME CHANGE', 'orange', 'Income Changes Unlock Housing Options',
      'Promotions and job changes often trigger move-up, relocation, or investment curiosity. Congratulate first — offer no-pressure "what if" scenarios. Never ask for exact salary on the first touch.',
      'orange',
      `<div class="space-y-4 mb-6">
        ${scriptCard('Congratulations first', 'Congratulations on the new role! That\'s awesome — you\'ve earned it. Wishing you tons of success in this next chapter.', 'Send within 1–2 weeks of the news.', 'Life Event: Job Congrats')}
        ${scriptCard('Soft value follow-up (2–4 weeks later)', 'Big life changes like this often make people curious about their housing options or what increased income plus current home equity could unlock. Happy to walk through a few what-if scenarios whenever it feels right — totally no pressure.', 'Relocation? Offer a trusted agent referral in the new market as goodwill.', 'Life Event: Job Housing')}
      </div>
      ${proTip('Relocation job changes deserve a separate playbook — ask about timeline and whether they need an agent referral in the new market.')}`,
      [
        { label: 'Annual equity review', action: 'equity', primary: true },
        { label: 'Sales scripts', action: 'scripts' }
      ]);
    attachHandlers(contentEl);
  }

  function renderLifeEmptyNest(contentEl) {
    contentEl.innerHTML = lifeEventShell('NEXT CHAPTER', 'teal', 'The "Next Chapter" Conversation',
      'Empty nesters decide between downsizing, traveling, helping kids, or turning the home into an investment. Help them explore options without rushing a decision.',
      'teal',
      `${cadenceList(['Downsize to lower maintenance + cash out equity', 'Stay put and access equity for travel or investments', 'Convert current home to rental / investment property'])}
      <div class="mb-6">${scriptCard('Empty nest door-opener', 'Now that the kids are out on their own, a lot of my clients start thinking about what they really want their next chapter to look like. Some downsize, some travel more, and some turn their current home into an income-producing asset. Would you ever want to explore what options look like for your situation — totally no pressure?', 'Listen more than you talk.', 'Life Event: Empty Nest')}</div>`,
      [
        { label: 'Annual equity review', action: 'equity', primary: true },
        { label: 'Sales scripts', action: 'scripts' }
      ]);
    attachHandlers(contentEl);
  }

  function renderLifeRetirement(contentEl) {
    contentEl.innerHTML = lifeEventShell('SENSITIVE + HIGH TRUST', 'teal', 'Sensitive, High-Trust Conversations',
      'Retirement housing decisions are emotional and financial. Lead with congratulations and clarity — never fear-based selling.',
      'teal',
      `${cadenceList(['Downsizing + reducing housing costs', 'Accessing equity while staying in the home', 'Relocating closer to family', 'Helping adult children with down payments using equity'])}
      <div class="mb-6">${scriptCard('Retirement door-opener', 'Congratulations on this next chapter! Retirement often brings up questions around housing costs, accessing equity, or even relocating. I\'m happy to walk through some of the newer options available if any of that is on your mind — even if it\'s just to understand what\'s possible.', 'Offer to collaborate with their financial advisor — never compete.', 'Life Event: Retirement')}</div>
      <div class="p-4 bg-[#F15A29]/5 border border-[#F15A29]/20 rounded-2xl text-sm mb-6"><strong>Key rule:</strong> If they have a financial advisor involved, offer to collaborate — never compete. That builds enormous trust.</div>`,
      [
        { label: 'Sales scripts', action: 'scripts', primary: true },
        { label: 'Value vault', action: 'vault' }
      ]);
    attachHandlers(contentEl);
  }

  function renderLifeDivorce(contentEl) {
    contentEl.innerHTML = lifeEventShell('SUPPORT ONLY', 'orange', 'Lead With Support — Never Opportunity',
      'Among the most sensitive touches in your database. Your only job in the short term is to be a calm, helpful professional they can trust. No agenda. No urgency. Just presence.',
      'orange',
      `<h4 class="font-bold text-lg mb-2 text-[#002B5C] dark:text-white">Do / Don't</h4>
      <ul class="text-sm space-y-1 mb-6">
        <li class="text-green-700 dark:text-green-400">✓ Send a brief, supportive note</li>
        <li class="text-green-700 dark:text-green-400">✓ Offer to answer questions if their attorney involves you</li>
        <li class="text-green-700 dark:text-green-400">✓ Wait for them to raise timing</li>
        <li class="text-red-600 dark:text-red-400">✗ Don't pitch listings or pressure a decision</li>
        <li class="text-red-600 dark:text-red-400">✗ Don't ask which spouse to call</li>
        <li class="text-red-600 dark:text-red-400">✗ Don't share their situation with anyone</li>
      </ul>
      <div class="mb-6">${scriptCard('Support-first message', 'I was sorry to hear about everything going on. I know this can be an overwhelming time financially and emotionally. If you ever want a completely no-pressure conversation about your housing options or what the numbers look like, I\'m here as a resource — even if it\'s just to answer questions.', 'Silence is okay. Let them lead.', 'Life Event: Divorce Support')}</div>`,
      [
        { label: 'Sales scripts (special situations)', action: 'scripts', primary: true },
        { label: 'Personal touches', action: 'touches' }
      ]);
    attachHandlers(contentEl);
  }

  const NURTURE_RENDERERS = {
    anniversary: renderAnniversary,
    'birthday-video': renderBirthdayVideo,
    'referral-ask': renderReferralAsk,
    'scalable-touches': renderScalableTouches
  };

  const LIFE_EVENT_RENDERERS = {
    marriage: renderLifeMarriage,
    baby: renderLifeBaby,
    job: renderLifeJob,
    'empty-nest': renderLifeEmptyNest,
    retirement: renderLifeRetirement,
    divorce: renderLifeDivorce
  };

  window.renderRichNurtureModal = function renderRichNurtureModal(key, contentEl) {
    if (!key || !contentEl) return false;
    const fn = NURTURE_RENDERERS[key];
    if (!fn) return false;
    fn(contentEl);
    return true;
  };

  window.renderRichLifeEventModal = function renderRichLifeEventModal(key, contentEl) {
    if (!key || !contentEl) return false;
    const fn = LIFE_EVENT_RENDERERS[key];
    if (!fn) return false;
    fn(contentEl);
    return true;
  };

  window.getNurtureModalTitle = function getNurtureModalTitle(key) {
    return NURTURE_TITLES[key] || null;
  };

  window.getLifeEventModalTitle = function getLifeEventModalTitle(key) {
    return LIFE_EVENT_TITLES[key] || null;
  };

  window.__NURTURE_MODALS_EXPORTS = {
    renderRichNurtureModal: window.renderRichNurtureModal,
    renderRichLifeEventModal: window.renderRichLifeEventModal,
    getNurtureModalTitle: window.getNurtureModalTitle,
    getLifeEventModalTitle: window.getLifeEventModalTitle
  };

  window.restoreNurtureModals = function restoreNurtureModals() {
    const exp = window.__NURTURE_MODALS_EXPORTS;
    if (!exp) return;
    Object.keys(exp).forEach(function (key) {
      window[key] = exp[key];
    });
  };

  console.log('%c[nurture-rich-modals] Premium nurture + life events ready (' + Object.keys(NURTURE_RENDERERS).length + ' templates, ' + Object.keys(LIFE_EVENT_RENDERERS).length + ' life events)', 'color:#00A89D');
})();