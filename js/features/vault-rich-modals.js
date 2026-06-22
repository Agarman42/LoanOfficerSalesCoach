/**
 * js/features/vault-rich-modals.js
 * Bespoke premium modals for high-value Value Vault items.
 * Each renderer is hand-crafted — not a generic template.
 */
(function () {
  'use strict';

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function setKicker(modal, text) {
    const kicker = document.getElementById('detail-modal-kicker');
    if (kicker) kicker.textContent = text;
  }

  function footerActions(copyLabel) {
    return `
      <div class="mt-6 flex flex-wrap gap-3 vault-rich-actions">
        <button data-vault-copy-btn type="button"
          class="px-5 py-2 bg-[#00A89D] text-white rounded-2xl text-sm font-semibold flex items-center gap-2 hover:opacity-90">
          <i class="fas fa-copy"></i> ${copyLabel || 'Copy to Clipboard'}
        </button>
        <button data-vault-save-btn type="button"
          class="px-5 py-2 border border-[#00A89D] text-[#00A89D] rounded-2xl text-sm font-semibold flex items-center gap-2 hover:bg-[#00A89D]/5">
          <i class="fas fa-bookmark"></i> Save to My Resources
        </button>
      </div>`;
  }

  function scriptCard(title, script, tip) {
    return `
      <div class="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <div class="font-semibold text-sm text-[#002B5C] dark:text-white mb-2">${esc(title)}</div>
        <div class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">“${esc(script)}”</div>
        ${tip ? `<div class="mt-2 text-[10px] text-gray-500">${esc(tip)}</div>` : ''}
        <button type="button" data-copy-snippet="${esc(script)}"
          class="mt-3 text-[10px] px-3 py-1.5 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold transition">
          <i class="fas fa-copy mr-1"></i>Copy this response
        </button>
      </div>`;
  }

  function attachSnippetCopy(contentEl) {
    contentEl.querySelectorAll('[data-copy-snippet]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-copy-snippet') || '';
        navigator.clipboard.writeText(text).then(() => {
          const orig = btn.innerHTML;
          btn.innerHTML = '<i class="fas fa-check mr-1"></i>Copied!';
          setTimeout(() => { btn.innerHTML = orig; }, 1600);
        }).catch(() => {});
      });
    });
  }

  function attachBridges(contentEl) {
    contentEl.querySelectorAll('[data-vault-bridge]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-vault-bridge');
        if (typeof closeDetailModal === 'function') closeDetailModal();
        setTimeout(() => {
          if (action === 'weekly' && typeof window.showSection === 'function') {
            window.showSection('weekly-win-plan');
          } else if (action === 'equity' && typeof window.showSection === 'function') {
            window.showSection('equity-scanner');
          } else if (action === 'social' && typeof window.showSection === 'function') {
            window.showSection('social');
          } else if (action === 'scripts' && typeof window.showSection === 'function') {
            window.showSection('sales-scripts');
          } else if (action?.startsWith('pillar:') && typeof window.openVaultPillar === 'function') {
            if (typeof window.showSection === 'function') window.showSection('value-vault');
            setTimeout(() => window.openVaultPillar(parseInt(action.split(':')[1], 10)), 200);
          } else if (action?.startsWith('modal:') && typeof window.openVaultItemWhenReady === 'function') {
            window.openVaultItemWhenReady(action.split(':')[1]);
          } else if (action?.startsWith('play:') && typeof window.openHighImpactPlay === 'function') {
            window.openHighImpactPlay(action.split(':')[1]);
          }
        }, 220);
      });
    });
  }

  window.attachRichVaultModalHandlers = function attachRichVaultModalHandlers(contentEl, item) {
    attachSnippetCopy(contentEl);
    attachBridges(contentEl);
  };

  // ─── 7-DAY POST-CLOSING CALL ─────────────────────────────────────────
  function renderPostClosing7Day(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Post-Closing Retention System');
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#F15A29]/10 text-[#F15A29]">HIGHEST-ROI TOUCH</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">PILLAR 3</span>
      </div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-2">The call most LOs skip — and the one that builds reviews, referrals, and lifetime value.</p>
      <div class="mb-6 p-4 rounded-2xl bg-[#F15A29]/5 border border-[#F15A29]/20 text-sm">
        <strong>The math:</strong> One nurtured first-time buyer can be <strong>$20k+ lifetime value</strong> (refis, move-ups, family deals, referrals). This 7-day call installs that asset.
      </div>

      <div class="mb-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm">
        <div class="font-semibold text-[#002B5C] dark:text-white mb-1"><i class="fas fa-calendar-check text-[#00A89D] mr-1"></i> Execution rule</div>
        Call on or around <strong>day 7</strong> (Thursday Power Hour works best). Block 60 minutes weekly for 7-day calls + upcoming anniversaries/birthdays.
      </div>

      <div class="text-xs font-bold tracking-wider text-gray-500 uppercase mb-3">The 5-part call framework</div>
      <div class="space-y-4 mb-6">
        ${scriptCard('1. Opening — enthusiastic & permission-based',
          'Hi [Name]! It’s [Your Name]. Am I catching you at a good time for 2–3 minutes? I’m calling to congratulate you on your new home and thank you for trusting us with your mortgage.',
          'Pause. Let them feel the energy before you educate.')}
        ${scriptCard('2. Permission-based education',
          'Now that you’ve officially closed, I want to share a few important things. Would you mind if I shared them with you?',
          'Then cover: first payment/escrows, tax exemptions, junk mail/refi solicitations, myHomeIQ/HomeBot.')}
        ${scriptCard('3. Feedback — active listening',
          'Thinking back, how do you feel we did for you overall? What’s one thing we could have done better?',
          'This is gold. Dig deeper if they hesitate.')}
        ${scriptCard('4. The asks (soft)',
          'Before we wrap — two quick favors? If I send a link, would you leave a quick Google review? And when mortgages come up with friends or coworkers, would you mention us?',
          'Never stack both asks without permission.')}
        ${scriptCard('5. Sales anchor — Annual Mortgage Review',
          'I’d like to reach back out once a year around your home anniversary for a 15–30 minute mortgage efficiency check-up. Everyone loves these.',
          'Plants the annual review without pressure.')}
      </div>

      <div class="rounded-2xl border border-[#00A89D]/30 bg-[#00A89D]/5 p-5 mb-6">
        <div class="text-sm font-bold text-[#002B5C] dark:text-white mb-3"><i class="fas fa-list-check text-[#00A89D] mr-1"></i> Power Hour checklist</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-gray-700 dark:text-gray-300">
          <div>☐ Block weekly Power Hour (Thu recommended)</div>
          <div>☐ Pull clients who closed 7 days ago</div>
          <div>☐ Run full 5-part framework on each call</div>
          <div>☐ Log notes + send same-day thank-you text</div>
          <div>☐ Send Google review link if they agreed</div>
          <div>☐ Calendar Annual Review for ~11 months out</div>
          <div>☐ Pivot to anniversary/birthday calls in same block</div>
          <div>☐ Follow up with recap text within 2 hours</div>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="weekly" class="text-xs px-3 py-2 rounded-xl bg-[#002B5C] text-white font-semibold hover:bg-black transition"><i class="fas fa-calendar-week mr-1"></i>Block in Weekly Win Plan</button>
        <button type="button" data-vault-bridge="modal:annual-mortgage-review" class="text-xs px-3 py-2 rounded-xl border border-[#00A89D] text-[#00A89D] font-semibold hover:bg-[#00A89D] hover:text-white transition">Annual Review framework →</button>
        <button type="button" data-vault-bridge="modal:post-closing-texts" class="text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition">Follow-up texts →</button>
        <button type="button" data-vault-bridge="modal:client-anniversary-system" class="text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition">Anniversary system →</button>
        <button type="button" data-vault-bridge="pillar:3" class="text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition">All Pillar 3 →</button>
      </div>
      ${footerActions('Copy Full 7-Day Framework')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  // ─── ANNUAL MORTGAGE REVIEW ──────────────────────────────────────────
  function renderAnnualMortgageReview(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Annual Client Review');
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">RETENTION ANCHOR</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#002B5C]/10 text-[#002B5C] dark:text-gray-300">15–30 MIN CALL</span>
      </div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-4">The follow-on you plant in the 7-day call. Feels like a free annual service — surfaces refi, equity, and life-change opportunities.</p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <div class="font-semibold text-sm mb-2"><i class="fas fa-list-ol text-[#00A89D] mr-1"></i> 5-part agenda</div>
          <ol class="text-sm space-y-2 text-gray-700 dark:text-gray-300 list-decimal pl-4">
            <li><strong>Rate & market check</strong> — their rate vs today (no specific quotes; general language only)</li>
            <li><strong>Equity position</strong> — value + equity built since closing</li>
            <li><strong>Life/goals check-in</strong> — job, family, renovations, investment property</li>
            <li><strong>Optimization</strong> — term, cash-out, second home, helping family buy</li>
            <li><strong>Relationship + soft ask</strong> — how are we doing? referrals? see you next year</li>
          </ol>
        </div>
        <div class="rounded-2xl border border-[#00A89D]/30 bg-[#00A89D]/5 p-4 text-sm">
          <div class="font-semibold mb-2">Why this converts</div>
          <ul class="space-y-1 text-gray-700 dark:text-gray-300">
            <li>• Positions you as ongoing expert, not one-time closer</li>
            <li>• Life changes = natural mortgage conversations</li>
            <li>• Equity talk opens move-up and cash-out paths</li>
            <li>• One nurtured client = $8k–$25k+ lifetime value</li>
          </ul>
        </div>
      </div>

      ${scriptCard('Opening script (home anniversary)',
        'Hi [Name], it’s [Your Name]. I’m circling back around your home anniversary for the quick mortgage efficiency check-up we talked about. It’s only 15–20 minutes — basically a financial physical for your mortgage. Got a few minutes this week or next?',
        'Send a prep email 48 hrs before listing what you’ll cover.')}

      <div class="mt-4 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div class="font-semibold text-sm mb-2">Questions that surface real business</div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300">
          <div>• How has the house been treating you?</div>
          <div>• Any big life changes since we closed?</div>
          <div>• If rates dropped meaningfully, would you want to look?</div>
          <div>• More equity than you expected?</div>
          <div>• Second home, investment, or helping family buy?</div>
          <div>• How’s the payment feeling today?</div>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="equity" class="text-xs px-3 py-2 rounded-xl bg-[#F15A29] text-white font-semibold hover:bg-orange-600 transition"><i class="fas fa-chart-line mr-1"></i>Run Equity Scanner</button>
        <button type="button" data-vault-bridge="modal:post-closing-7day" class="text-xs px-3 py-2 rounded-xl border border-[#00A89D] text-[#00A89D] font-semibold hover:bg-[#00A89D] hover:text-white transition">7-Day call framework →</button>
        <button type="button" data-vault-bridge="weekly" class="text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition">Weekly Win Plan →</button>
      </div>
      ${footerActions('Copy Full Review Framework')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  // ─── ANNIVERSARY & BIRTHDAY SYSTEM ─────────────────────────────────
  function renderClientAnniversarySystem(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Long-Term Retention Engine');
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">RUNS AFTER 7-DAY CALLS</span></div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-4">The weekly habit that turns one great closing into decades of referrals — most LOs never build this system.</p>

      <div class="space-y-4 mb-6">
        <div class="rounded-2xl border border-[#00A89D]/30 bg-[#00A89D]/5 p-5">
          <div class="text-[10px] font-bold tracking-wider text-[#00A89D] uppercase mb-1">Every Monday (or your day)</div>
          <div class="font-bold text-[#002B5C] dark:text-white mb-2">Pull the next-7-days list</div>
          <ul class="text-sm space-y-1 text-gray-700 dark:text-gray-300">
            <li>☐ Home loan anniversaries in the next 7 days</li>
            <li>☐ Client birthdays in the next 7 days</li>
            <li>☐ Add to same Power Hour block as 7-day calls</li>
          </ul>
        </div>
        <div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <div class="font-bold text-sm mb-2">Anniversary calls (valuable)</div>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Congratulate them. Ask how the home is treating them. Mention general market context if relevant. Re-offer Annual Review.</p>
          ${scriptCard('Anniversary opener',
            'Happy home anniversary [Name]! Can you believe it’s been a year already? How’s the house treating you? I still have you on my calendar for that quick mortgage check-up we talked about — want to find 15 minutes in the next couple weeks?',
            null)}
        </div>
        <div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <div class="font-bold text-sm mb-2">Birthday touches (relationship)</div>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">60-second call or thoughtful text. Reference something specific if you can.</p>
          ${scriptCard('Birthday text',
            'Happy birthday [Name]! Hope you have an amazing day. Grateful we got to help you into the home — let me know if you ever need anything mortgage-related.',
            null)}
        </div>
      </div>

      <div class="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm mb-6">
        <strong>Pro move:</strong> This single weekly habit often generates more referrals than almost anything else you do post-closing.
      </div>

      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="weekly" class="text-xs px-3 py-2 rounded-xl bg-[#002B5C] text-white font-semibold hover:bg-black transition">Block in Weekly Win Plan</button>
        <button type="button" data-vault-bridge="modal:post-closing-7day" class="text-xs px-3 py-2 rounded-xl border border-[#00A89D] text-[#00A89D] font-semibold hover:bg-[#00A89D] hover:text-white transition">Start with 7-Day calls →</button>
      </div>
      ${footerActions('Copy Anniversary & Birthday System')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  // ─── GIFT CADENCE SYSTEM ───────────────────────────────────────────
  function renderGiftCadenceSystem(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Client Gift Operating System');
    const phases = [
      { when: 'Closing day', label: 'Peak emotion', gift: 'Custom map art, photo frame, premium blanket', tip: 'Pair with handwritten note referencing their home/family', color: 'border-[#F15A29]' },
      { when: '30-day mark', label: 'Practical welcome', gift: 'Doormat, toolkit, quality candle', tip: '“Hope you’re settling in” text 3–5 days later', color: 'border-[#00A89D]' },
      { when: '6-month mark', label: 'Ongoing utility', gift: 'Water bottle, plant, market update + small item', tip: 'Light touch — stay useful, not salesy', color: 'border-[#002B5C]/30' },
      { when: '1-year anniversary', label: 'Keep forever', gift: 'Throw blanket, custom art, premium keepsake', tip: 'This is your big retention moment — go personal', color: 'border-purple-400' },
      { when: 'Return clients', label: 'Welcome home again', gift: 'Acknowledge history — “great to work together again”', tip: 'They already trust you; deepen the relationship', color: 'border-amber-400' }
    ];
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#F15A29]/10 text-[#F15A29]">PILLAR 2</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs">SEQUENCE, NOT ONE-OFFS</span>
      </div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Gifts compound when they’re timed to emotional milestones — not random thank-yous.</p>
      <div class="space-y-3 mb-6">
        ${phases.map((p) => `
          <div class="rounded-2xl border-l-4 ${p.color} border border-gray-200 dark:border-gray-700 p-4">
            <div class="flex flex-wrap justify-between gap-2 mb-1">
              <div class="font-bold text-sm text-[#002B5C] dark:text-white">${esc(p.when)}</div>
              <div class="text-[10px] font-semibold uppercase tracking-wider text-gray-500">${esc(p.label)}</div>
            </div>
            <div class="text-sm text-gray-700 dark:text-gray-300"><strong>Gift ideas:</strong> ${esc(p.gift)}</div>
            <div class="text-xs text-gray-500 mt-1">${esc(p.tip)}</div>
          </div>`).join('')}
      </div>
      <div class="p-4 rounded-2xl bg-[#F15A29]/5 border border-[#F15A29]/20 text-sm mb-6">
        <strong>Retention linking rule:</strong> Every gift includes one soft future anchor — Annual Review invite, “call me anytime,” or “I’m here for life” language.
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="pillar:2" class="text-xs px-3 py-2 rounded-xl border border-[#F15A29] text-[#F15A29] font-semibold hover:bg-[#F15A29] hover:text-white transition">Browse gift ideas →</button>
        <button type="button" data-vault-bridge="modal:giftology-mindset" class="text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition">Giftology mindset →</button>
      </div>
      ${footerActions('Copy Gift Cadence System')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  // ─── 30-DAY CONTENT SPRINT ─────────────────────────────────────────
  function renderContent30DaySprint(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Content Operating System');
    const weeks = [
      { w: 'Week 1', focus: 'Foundation', pillars: '5 + 6', color: 'purple', tasks: ['Film 3 First-Time Buyer Reels', 'Film 1 Rate Reality Check Reel', 'Turn into 2 carousels + 4 text posts', 'Set up basic nurture email rhythm'] },
      { w: 'Week 2', focus: 'Authority', pillars: '1 + 6', color: 'teal', tasks: ['2 Local Market Data videos', '2 “Did You Know” myth busters', 'One longer YouTube combining Week 1 hits'] },
      { w: 'Week 3', focus: 'Human', pillars: '5 + 4', color: 'amber', tasks: ['Behind-the-scenes content', '2 client win stories (with permission)', 'Heavy Stories usage this week'] },
      { w: 'Week 4', focus: 'Systems', pillars: '3 + repurpose', color: 'slate', tasks: ['Cadence Reel + “how I plan content” post', 'Repurpose best performer into 5 new formats', 'Review analytics — double down on winner'] }
    ];
    const colorMap = { purple: 'border-purple-300 bg-purple-50/50 dark:bg-purple-900/20', teal: 'border-[#00A89D]/30 bg-[#00A89D]/5', amber: 'border-amber-300 bg-amber-50/60 dark:bg-amber-900/20', slate: 'border-gray-300 bg-gray-50 dark:bg-gray-800' };
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-600">30-DAY LAUNCH SPRINT</span></div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-2">Stop overthinking. Film 8–10 “mother” videos and you’re covered for a month.</p>
      <p class="text-sm text-gray-500 mb-6">Batch film Sunday/Monday in one 90-minute session. Use CapCut templates. Protect one off-day per week.</p>
      <div class="space-y-4 mb-6">
        ${weeks.map((wk) => `
          <div class="rounded-2xl border p-5 ${colorMap[wk.color]}">
            <div class="flex flex-wrap justify-between gap-2 mb-2">
              <div><span class="text-[10px] font-bold tracking-wider uppercase text-gray-500">${wk.w}</span>
              <div class="font-bold text-[#002B5C] dark:text-white">${wk.focus}</div></div>
              <div class="text-xs text-gray-500">Pillars ${wk.pillars}</div>
            </div>
            <ul class="text-sm space-y-1 text-gray-700 dark:text-gray-300">${wk.tasks.map((t) => `<li class="flex gap-2"><span class="text-[#00A89D]">☐</span>${esc(t)}</li>`).join('')}</ul>
          </div>`).join('')}
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="social" class="text-xs px-3 py-2 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition"><i class="fas fa-share-alt mr-1"></i>Open Social Strategy</button>
        <button type="button" data-vault-bridge="pillar:5" class="text-xs px-3 py-2 rounded-xl border border-purple-400 text-purple-700 font-semibold hover:bg-purple-100 transition">Content pillar →</button>
        <button type="button" data-vault-bridge="weekly" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Weekly Win Plan →</button>
      </div>
      ${footerActions('Copy 30-Day Content Sprint')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  // ─── OBJECTION PSYCHOLOGY SYSTEM ───────────────────────────────────
  function renderObjectionPsychology(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Objection Mastery');
    const steps = [
      { n: '1', title: 'Acknowledge (3–5 sec)', script: 'I completely understand why that feels like the right move right now.', tip: 'Never argue first. Mirror their concern.' },
      { n: '2', title: 'Validate + Reframe (15–20 sec)', script: 'That makes total sense given what you\'ve been hearing. A lot of people feel the same way — and there\'s usually one piece of the picture missing.', tip: 'Give legitimacy, then introduce reality gently.' },
      { n: '3', title: 'Story or Data (25–35 sec)', script: 'I had a client last month in almost this exact situation… [one specific outcome]. Want me to run your numbers the same way?', tip: 'One example beats three statistics.' },
      { n: '4', title: 'Question back (15 sec)', script: 'How are you thinking about that? What would need to be true for you to feel good moving forward?', tip: 'Silence after the question. Let them talk.' },
      { n: '5', title: 'Permission + next step (10 sec)', script: 'No pressure at all — I just want you to have the full picture. Can I send you a quick comparison to look at on your own time?', tip: 'Take pressure off while keeping the door open.' }
    ];
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-600">90-SECOND SYSTEM</span></div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Stop memorizing 50 scripts. Master this flow and you sound calm on <em>any</em> objection.</p>
      <div class="space-y-4 mb-6">
        ${steps.map((s) => `
          <div class="rounded-2xl border-l-4 border-amber-500 bg-white dark:bg-gray-900 p-4">
            <div class="font-bold text-sm mb-1">${s.n}. ${esc(s.title)}</div>
            <div class="text-sm italic text-gray-700 dark:text-gray-300 mb-1">“${esc(s.script)}”</div>
            <div class="text-[10px] text-gray-500">${esc(s.tip)}</div>
            <button type="button" data-copy-snippet="${esc(s.script)}" class="mt-2 text-[10px] px-3 py-1 rounded-xl border border-amber-500 text-amber-700 hover:bg-amber-500 hover:text-white font-semibold"><i class="fas fa-copy mr-1"></i>Copy step</button>
          </div>`).join('')}
      </div>
      <div class="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-sm mb-6">
        <strong>Practice drill:</strong> Pick your top 3 objections. Run this 5-step flow out loud twice this week with a colleague or spouse.
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:objection-rates" class="text-xs px-3 py-2 rounded-xl border border-amber-500 text-amber-700 font-semibold hover:bg-amber-500 hover:text-white transition">Rate objections →</button>
        <button type="button" data-vault-bridge="scripts" class="text-xs px-3 py-2 rounded-xl bg-[#002B5C] text-white font-semibold hover:bg-black transition">Sales Script Generator →</button>
        <button type="button" data-vault-bridge="pillar:4" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">All objections →</button>
      </div>
      ${footerActions('Copy 90-Second System')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  // ─── MULTI-RESPONSE OBJECTION MODALS ───────────────────────────────
  function renderObjectionMulti(item, contentEl, modal, responses, intro, color) {
    setKicker(modal, 'Value Vault • Objection Script Library');
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-600">PILLAR 4</span></div>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">${esc(intro)}</p>
      <div class="space-y-4 mb-6">
        ${responses.map((r, i) => scriptCard(r.title || `Response ${i + 1}`, r.text, r.tip)).join('')}
      </div>
      <div class="text-xs text-gray-500 mb-4 italic">Deliver calmly. Never argue. Always offer to run their specific numbers.</div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="scripts" class="text-xs px-3 py-2 rounded-xl bg-[#002B5C] text-white font-semibold hover:bg-black transition">Practice in Sales Scripts →</button>
        <button type="button" data-vault-bridge="modal:objection-psychology-system" class="text-xs px-3 py-2 rounded-xl border border-amber-500 text-amber-700 font-semibold hover:bg-amber-500 hover:text-white transition">90-Second system →</button>
      </div>
      ${footerActions('Copy All Responses')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  function renderObjectionRates(item, contentEl, modal) {
    renderObjectionMulti(item, contentEl, modal, [
      { title: '1. Equity Reality Play', text: 'I hear that every day. Here\'s what most people miss: if rates drop 1%, home prices often rise 8–12% from increased competition. Waiting has already cost many buyers $40–70k in equity. Want me to show you the math on your situation?', tip: 'Lead with data, not defense.' },
      { title: '2. Buydown + Future Refi', text: 'Totally fair. We have 2-1 and 3-2-1 buydown options that lower your rate 1–3% for the first few years. When rates drop, we refinance at zero cost. You get in now and protect yourself both ways.', tip: 'Offer a concrete path forward.' },
      { title: '3. Marry the House, Date the Rate', text: 'The house you want today at today\'s rate will likely cost more in 18 months even at a lower rate. Marry the house you love. Date the rate — we\'ll adjust when it makes sense.', tip: 'Classic frame — use when they love the home.' },
      { title: '4. Total Cost of Ownership', text: 'Let\'s look at the full picture. Your total monthly cost is often still lower than rent — and you\'re building equity instead of making your landlord rich. Want to run the real numbers?', tip: 'Great for renters and first-time buyers.' },
      { title: '5. Psychological Permission', text: 'I get it — today\'s rate feels high compared to 2020. But people who bought in 2021 at higher rates are still sitting on $80–120k in equity. The rate is one variable. Do you want to own or keep renting while prices climb?', tip: 'End with a life question, not a rate debate.' }
    ], 'Five battle-tested responses for the #1 objection in today\'s market.', 'amber');
  }

  function renderObjectionWaiting(item, contentEl, modal) {
    renderObjectionMulti(item, contentEl, modal, [
      { title: 'Price Increase Math', text: 'Let\'s say rates drop to 5.5% in 12–18 months. In that same period, average home prices often rise 9–14%. On a $420k home that\'s $42–58k extra — to save maybe $180–220/month. Break-even is often 7–9 years.', tip: 'Most effective response — use their price range.' },
      { title: 'The Two-Moves Trap', text: 'A lot of people wait, then still buy in 18 months. That\'s two moves — renting longer plus buying at higher prices. One move now is almost always cheaper than two moves later.', tip: 'Reframe waiting as an active choice with cost.' },
      { title: 'Life Cost Question', text: 'I respect wanting to wait. The real question: what\'s the cost in your actual life? Paying $2,100 rent that could be $1,850 owning? Kids in a school district you love? One more year of building equity? Sometimes the lifestyle cost beats the rate difference.', tip: 'Shift from financial to personal.' }
    ], 'The cost of waiting is one of the most expensive decisions buyers make — they just don\'t see it until it\'s too late.', 'amber');
  }

  function renderObjectionCredit(item, contentEl, modal) {
    renderObjectionMulti(item, contentEl, modal, [
      { title: 'Path, not perfection', text: 'Credit doesn\'t have to be perfect — it has to be on a path. Let\'s pull your report together and build a 60–90 day plan. I\'ve helped plenty of people buy sooner than they thought.', tip: 'Offer partnership, not judgment.' },
      { title: 'FHA / alternative programs', text: 'There are programs designed exactly for this situation. Before you assume you can\'t buy for two years, let me run a quick scenario — you might be closer than you think.', tip: 'Never promise approval — offer to investigate.' },
      { title: 'Rent vs build equity', text: 'Every month you rent while waiting to fix credit, you\'re not building equity. Sometimes a small down payment program plus credit coaching gets you in faster than waiting for a perfect score.', tip: 'Compare timelines honestly.' }
    ], 'Credit objections are often fear disguised as facts. Your job is to offer a clear path forward.', 'amber');
  }

  function renderObjectionDownpayment(item, contentEl, modal) {
    renderObjectionMulti(item, contentEl, modal, [
      { title: 'Programs exist', text: 'Down payment is the #1 myth I hear. There are FHA, VA, USDA, and state programs that get people in with far less than 20% — sometimes 0–3.5%. Have you seen what you actually qualify for?', tip: 'Education beats assumption.' },
      { title: 'Gift funds frame', text: 'A lot of my clients use gift funds from family — it\'s more common than people admit. If that\'s an option, we can structure it cleanly and compliantly.', tip: 'Normalize help from family.' },
      { title: 'Monthly payment reframe', text: 'Let\'s compare: saving $500/month for 3 years vs getting in now with a smaller down payment and building equity. The math often surprises people.', tip: 'Run side-by-side scenarios.' }
    ], 'Down payment concerns usually mean they haven\'t seen their real options yet.', 'amber');
  }

  function renderObjectionPartnerBusiness(item, contentEl, modal) {
    renderObjectionMulti(item, contentEl, modal, [
      { title: '“I\'m too busy right now”', text: 'I completely get it — this market is wild. I\'m not here to take more of your time. I wanted to drop off something small that might save you time on your next few deals. No meeting required.', tip: 'Value-first, zero pressure.' },
      { title: '“I already have a lender”', text: 'Totally respect loyalty. I\'m not asking you to switch anyone. I\'m offering to be a no-pressure second set of eyes on tricky files or rate questions. A lot of agents keep me in their back pocket for creative solutions.', tip: 'Position as backup expert.' },
      { title: '“I don\'t send clients to lenders they don\'t know”', text: 'Fair — that\'s how I want to work with you too. I\'m happy to prove value first: run scenarios, show up at an open house, or co-brand something useful. No expectation until you\'ve seen the difference.', tip: 'Earn trust before asking.' },
      { title: '“Your rates aren\'t the lowest”', text: 'Rates matter — but in this market the difference between winning and losing is often 24–48 hours of certainty. I focus on making your buyer\'s offer the strongest on the table.', tip: 'Shift from price to certainty.' }
    ], 'Value-first partner responses — never pushy, never sleazy. Match the Giftology philosophy throughout the vault.', 'teal');
  }

  // ─── POST-CLOSING TEXT TEMPLATES ─────────────────────────────────────
  function renderPostClosingTexts(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Post-Closing Follow-Up');
    const templates = [
      { title: 'Same-Day Thank You + Review Ask', when: 'Within 2 hours of the 7-day call', script: 'Hi [Name], thanks again for the time on the call today. Really appreciate you trusting us with your mortgage. If you have a quick second, would you mind leaving us a Google review? Here\'s the link: [link]', tip: 'Send only if they agreed to review on the call.' },
      { title: 'After Positive Feedback on Call', when: 'Same day or next morning', script: 'Thank you for the kind words [Name]! It means a lot. When you talk to friends or coworkers about mortgages, I\'d love it if you mentioned us.', tip: 'Pairs perfectly with a handwritten thank-you note.' },
      { title: '30-Day Value Check-In', when: 'Day 30 after closing', script: 'Hi [Name] — just checking in at the 30-day mark. How is everything feeling in the new house? Any questions on the payment, taxes, or insurance side? Happy to hop on a quick call or just text back and forth.', tip: 'Reference one detail from the 7-day call for 10x impact.' },
      { title: '90-Day + Annual Review Seed', when: 'Day 90', script: '[Name], you\'re coming up on 90 days in the new home — time flies! Everything still going smoothly? Around your one-year anniversary I like to do a quick 15-20 min "mortgage check-up" to make sure your loan is still working for you. I\'ll put a note to reach out then.', tip: 'Plants the Annual Review without pressure.' }
    ];
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">PILLAR 3</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs">SEND AFTER 7-DAY CALL</span>
      </div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-2">Turn a great phone conversation into reviews, referrals, and a year-long relationship.</p>
      <p class="text-sm text-gray-500 mb-6">Personalize every message with one specific detail from the call — it makes these feel human, not automated.</p>
      <div class="space-y-4 mb-6">
        ${templates.map((t) => `
          <div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
            <div class="flex flex-wrap justify-between gap-2 mb-1">
              <div class="font-semibold text-sm text-[#002B5C] dark:text-white">${esc(t.title)}</div>
              <div class="text-[10px] font-semibold uppercase tracking-wider text-[#00A89D]">${esc(t.when)}</div>
            </div>
            <div class="text-sm italic text-gray-700 dark:text-gray-300">"${esc(t.script)}"</div>
            ${t.tip ? `<div class="mt-2 text-[10px] text-gray-500">${esc(t.tip)}</div>` : ''}
            <button type="button" data-copy-snippet="${esc(t.script)}" class="mt-3 text-[10px] px-3 py-1.5 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold"><i class="fas fa-copy mr-1"></i>Copy text</button>
          </div>`).join('')}
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:post-closing-7day" class="text-xs px-3 py-2 rounded-xl bg-[#002B5C] text-white font-semibold hover:bg-black transition">7-Day call framework →</button>
        <button type="button" data-vault-bridge="modal:annual-mortgage-review" class="text-xs px-3 py-2 rounded-xl border border-[#00A89D] text-[#00A89D] font-semibold hover:bg-[#00A89D] hover:text-white transition">Annual Review →</button>
        <button type="button" data-vault-bridge="modal:nurture-12month-calendar" class="text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition">12-month calendar →</button>
      </div>
      ${footerActions('Copy All Follow-Up Texts')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  // ─── 7-DAY CALL OBJECTIONS ─────────────────────────────────────────
  function render7DayObjections(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • 7-Day Call Defense');
    const objections = [
      { pushback: '"I\'m really busy right now."', script: 'I completely understand — this will only take 2–3 minutes. I just want to make sure you\'re not running into any surprises with the new payment or paperwork.', tip: 'Acknowledge + name the tiny time commitment.' },
      { pushback: '"Everything is fine, I don\'t really have any questions."', script: 'That\'s great to hear! Before I let you go, can I quickly cover two things that catch most people off guard in the first month?', tip: 'Validate + create curiosity.' },
      { pushback: '"I already have a guy for that."', script: 'Totally fair. I\'m not trying to sell you anything — this is literally just a quick check-in to make sure your first month goes smoothly. Most people appreciate the heads-up on the tax bills and refinance mail.', tip: 'Remove sales pressure. Position as free insurance.' },
      { pushback: '"Can you just email it to me?"', script: 'Happy to — the reason I called is these first-month gotchas are easy to miss in an email. It\'s literally two minutes and most people say they\'re glad we talked live.', tip: 'Honor the request while explaining why live is better.' },
      { pushback: '"I don\'t want to think about my mortgage right now."', script: 'Totally get that — you just moved in! The only reason I\'m calling is to make sure the boring stuff (tax bills, insurance, junk mail) doesn\'t surprise you in the next 30 days. After this you\'re good for the year.', tip: 'Empathize with honeymoon phase + limit scope.' }
    ];
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-600">ON THE 7-DAY CALL</span></div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-2">Graceful responses when clients push back — helpful, never pushy.</p>
      <p class="text-sm text-gray-500 mb-6">Flow: Pause → Acknowledge → Reframe to client benefit → Micro-commitment → Value or ask.</p>
      <div class="space-y-4 mb-6">
        ${objections.map((o) => scriptCard(o.pushback, o.script, o.tip)).join('')}
      </div>
      <div class="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm mb-6">
        <strong>Practice drill:</strong> Read these out loud twice before your next Power Hour. Calm delivery beats perfect wording.
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:post-closing-7day" class="text-xs px-3 py-2 rounded-xl bg-[#00A89D] text-white font-semibold hover:opacity-90 transition">Full 7-Day framework →</button>
        <button type="button" data-vault-bridge="modal:objection-psychology-system" class="text-xs px-3 py-2 rounded-xl border border-amber-500 text-amber-700 font-semibold hover:bg-amber-500 hover:text-white transition">90-Second system →</button>
      </div>
      ${footerActions('Copy All 7-Day Objection Responses')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  // ─── 12-MONTH NURTURE CALENDAR ───────────────────────────────────────
  function renderNurture12Month(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Client Nurture System');
    const months = [
      { m: 'Month 1', touch: 'Post-closing thank you + review ask', type: 'text', bridge: 'modal:post-closing-texts' },
      { m: 'Month 2', touch: '30-day check-in text', type: 'text', bridge: null },
      { m: 'Month 3', touch: '"How\'s the house treating you?" email', type: 'email', bridge: null },
      { m: 'Month 4', touch: 'Market update or helpful article', type: 'value', bridge: 'social' },
      { m: 'Month 5', touch: 'Birthday or random value touch', type: 'relationship', bridge: 'modal:client-anniversary-system' },
      { m: 'Month 6', touch: '6-month anniversary note + small gift option', type: 'gift', bridge: 'modal:gift-cadence-system' },
      { m: 'Month 7–8', touch: 'Seasonal value (tax tips, spring maintenance)', type: 'value', bridge: null },
      { m: 'Month 9', touch: 'Light referral ask + "I\'m taking new clients"', type: 'referral', bridge: null },
      { m: 'Month 10', touch: 'Home anniversary email — most powerful of the year', type: 'call', bridge: 'modal:client-anniversary-system' },
      { m: 'Month 11', touch: 'Thinking of you + branded gift or resource', type: 'gift', bridge: 'pillar:2' },
      { m: 'Month 12', touch: 'Annual Mortgage Review invitation', type: 'call', bridge: 'modal:annual-mortgage-review' }
    ];
    const typeColors = { text: 'border-blue-300 bg-blue-50/50 dark:bg-blue-900/20', email: 'border-indigo-300 bg-indigo-50/50', value: 'border-purple-300 bg-purple-50/50', relationship: 'border-pink-300 bg-pink-50/50', gift: 'border-[#F15A29]/40 bg-[#F15A29]/5', referral: 'border-teal-300 bg-teal-50/50', call: 'border-[#00A89D]/40 bg-[#00A89D]/5' };
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-600">PILLAR 6</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs">SET IT AND RUN IT</span>
      </div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-2">Never wonder what to send again — your default rhythm for every client.</p>
      <p class="text-sm text-gray-500 mb-6">This cadence alone puts you in the top 5% for retention. Mix in personal notes when you have real news.</p>
      <div class="space-y-2 mb-6">
        ${months.map((mo) => `
          <div class="rounded-xl border p-3 flex flex-wrap items-start justify-between gap-2 ${typeColors[mo.type] || 'border-gray-200'}">
            <div>
              <div class="text-[10px] font-bold tracking-wider text-gray-500 uppercase">${esc(mo.m)}</div>
              <div class="text-sm font-medium text-[#002B5C] dark:text-white">${esc(mo.touch)}</div>
            </div>
            ${mo.bridge ? `<button type="button" data-vault-bridge="${mo.bridge}" class="text-[10px] px-2 py-1 rounded-lg border font-semibold shrink-0">Open →</button>` : ''}
          </div>`).join('')}
      </div>
      <div class="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm mb-6">
        <strong>Pro move:</strong> Load this into your CRM as automated reminders. Block one nurture hour per week in Weekly Win Plan.
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="weekly" class="text-xs px-3 py-2 rounded-xl bg-[#002B5C] text-white font-semibold hover:bg-black transition">Weekly Win Plan →</button>
        <button type="button" data-vault-bridge="modal:nurture-text-swipe-file" class="text-xs px-3 py-2 rounded-xl border border-blue-400 text-blue-700 font-semibold hover:bg-blue-100 transition">40-message swipe file →</button>
        <button type="button" data-vault-bridge="pillar:6" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">All nurture →</button>
      </div>
      ${footerActions('Copy 12-Month Calendar')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  // ─── REFERRAL FLYWHEEL ───────────────────────────────────────────────
  function renderReferralFlywheel(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Meta-System');
    const stages = [
      { n: '1', title: 'Attraction', desc: 'Content & personal brand (Pillar 5) + email/text nurture (Pillar 6) bring partners and clients in the door.', pillar: 5, color: 'border-purple-400' },
      { n: '2', title: 'Wow During Process', desc: 'Exceptional service + strategic client gifts (Pillar 2) create emotional peaks.', pillar: 2, color: 'border-[#F15A29]' },
      { n: '3', title: 'Installation', desc: '7-Day Post-Closing System + ongoing retention (Pillar 3) locks in lifetime value.', pillar: 3, color: 'border-[#00A89D]' },
      { n: '4', title: 'Relationship Fuel', desc: 'Regular pop-bys for partners (Pillar 1) + thoughtful ongoing touches (Pillar 6).', pillar: 1, color: 'border-teal-400' },
      { n: '5', title: 'Defense', desc: 'World-class objection handling (Pillar 4) when rates or life create hesitation.', pillar: 4, color: 'border-amber-400' }
    ];
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-gray-800 text-white dark:bg-gray-700">ALL 6 PILLARS</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">PREDICTABLE REFERRALS</span>
      </div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">The meta-system top producers run. When all six pillars spin together, you stop chasing referrals — they chase you.</p>
      <div class="space-y-3 mb-6">
        ${stages.map((s) => `
          <div class="rounded-2xl border-l-4 ${s.color} border border-gray-200 dark:border-gray-700 p-4 flex flex-wrap justify-between gap-3">
            <div class="flex-1 min-w-0">
              <div class="text-[10px] font-bold tracking-wider text-gray-500 uppercase">Stage ${s.n}</div>
              <div class="font-bold text-[#002B5C] dark:text-white">${esc(s.title)}</div>
              <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">${esc(s.desc)}</div>
            </div>
            <button type="button" data-vault-bridge="pillar:${s.pillar}" class="text-xs px-3 py-2 rounded-xl border font-semibold shrink-0 self-center hover:bg-gray-100 dark:hover:bg-gray-800 transition">Pillar ${s.pillar} →</button>
          </div>`).join('')}
      </div>
      <div class="p-5 rounded-2xl bg-gradient-to-r from-gray-900 to-black text-white text-sm mb-6">
        <strong>Start here if overwhelmed:</strong> Week 1 = Pillar 3 (7-day calls). Week 2 = Pillar 1 (5 pop-bys). Week 3 = Pillar 5 (4 Reels). The flywheel starts spinning with just those three.
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:value-vault-30day-activation" class="text-xs px-3 py-2 rounded-xl bg-[#F15A29] text-white font-semibold hover:bg-orange-600 transition"><i class="fas fa-rocket mr-1"></i>30-Day Activation Plan</button>
        <button type="button" data-vault-bridge="weekly" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Weekly Win Plan →</button>
      </div>
      ${footerActions('Copy Flywheel System')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  function renderObjectionInvestor(item, contentEl, modal) {
    renderObjectionMulti(item, contentEl, modal, [
      { title: '"I\'ll just pay cash"', text: 'I love working with cash buyers — they\'re usually the strongest. But even cash buyers are using leverage right now because money is still relatively cheap compared to real estate returns. Would you be open to running the numbers on keeping some cash liquid and financing 50–70% LTV? A lot of my investors love the flexibility.', tip: 'Never argue against cash — show the leverage math.' },
      { title: '"Rates don\'t matter to me as an investor"', text: 'Completely understand. The two things that usually matter more are cash flow and appreciation. What most people miss is that higher rates are creating better buying opportunities because there\'s less competition. Want to look at actual cash-on-cash returns on a couple deals?', tip: 'Shift from rate to cap rate and cash flow.' }
    ], 'Investor and cash buyer objections — stay in the conversation without sounding retail.', 'amber');
  }

  function renderObjectionCompetitor(item, contentEl, modal) {
    renderObjectionMulti(item, contentEl, modal, [
      { title: 'The Respectful Approach', text: 'Totally understand — loyalty matters. I\'m not here to badmouth anyone. The only reason I\'m asking for 10 minutes is because the mortgage world has changed dramatically in the last 18 months. If after 10 minutes you feel your guy is still the best fit, I\'ll respect that completely. Fair?', tip: 'Ask for a micro-commitment, not a switch.' },
      { title: 'Second Opinion Frame', text: 'I\'m happy to be your second opinion at no obligation. I do this for a lot of people who already have a relationship — just to confirm they\'re getting the best structure.', tip: 'Position as verification, not replacement.' },
      { title: 'Referral Leverage', text: 'The person who referred you to me specifically asked me to reach out because they felt you might be missing some current options. Would it hurt to compare?', tip: 'Use only when there\'s a real mutual connection.' }
    ], 'Non-sleazy ways to earn the right to compete when they already have a lender.', 'amber');
  }

  function renderObjectionModern(item, contentEl, modal) {
    renderObjectionMulti(item, contentEl, modal, [
      { title: '"I ran my numbers on ChatGPT…"', text: 'Those tools are great for ballpark math. The problem is they don\'t know your specific credit profile, your state\'s programs, or the 12–15 loan products we have access to. I\'ve had clients come in with a ChatGPT quote $340/month higher than what we actually got them approved for. Want me to run the real numbers?', tip: 'Never trash AI — position yourself as the precision layer.' },
      { title: '"Zillow says rates are 6.1%"', text: 'Those advertised rates are usually best-case — 780+ credit, 25% down, perfect file. Most people don\'t qualify for that rate. I\'ll show you what you actually qualify for in 5 minutes with your real numbers.', tip: 'Educate on advertised vs actual.' },
      { title: '"Rates are about to crash / Fed is cutting hard"', text: 'The Fed has started cutting, but mortgage rates follow the 10-year Treasury and inflation expectations more than the Fed funds rate. Even with cuts, many economists project 5.75–6.5% for most of 2026. People waiting for 4% again may wait a very long time.', tip: 'Ground in economics, not opinion.' }
    ], '2026 objections — ChatGPT, Zillow, and "rates are crashing" claims.', 'amber');
  }

  // ─── LTV & REFERRAL FLYWHEEL MINDSET ─────────────────────────────────
  function renderPostClosingLtv(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Lifetime Value Math');
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-teal-500/10 text-teal-600">WHY PILLAR 3 MATTERS</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#F15A29]/10 text-[#F15A29]">$8K–$25K+ PER CLIENT</span>
      </div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">The 7-day call isn't a nice-to-have — it's the installation of a lifetime asset.</p>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="rounded-2xl border border-[#00A89D]/30 bg-[#00A89D]/5 p-4">
          <div class="font-bold text-sm text-[#002B5C] dark:text-white mb-1">Direct Value</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Future refis, second homes, kids buying, parents downsizing — one nurtured client generates multiple files.</div>
        </div>
        <div class="rounded-2xl border border-purple-300 bg-purple-50/50 dark:bg-purple-900/20 p-4">
          <div class="font-bold text-sm mb-1">Indirect Value</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Google reviews, social proof, word-of-mouth that compounds for years without ad spend.</div>
        </div>
        <div class="rounded-2xl border border-[#F15A29]/30 bg-[#F15A29]/5 p-4">
          <div class="font-bold text-sm mb-1">Flywheel Effect</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Great experience → review → 2–3 referrals → those clients get great experiences → more referrals.</div>
        </div>
      </div>
      <div class="p-5 rounded-2xl bg-gradient-to-r from-teal-600 to-[#00A89D] text-white mb-6">
        <div class="font-bold mb-2">Simple math most LOs ignore</div>
        <div class="text-sm opacity-95">40 closings/year × 3 referrals per nurtured client over 5 years = <strong>600+ lifetime opportunities</strong>. The 7-day system is the cheapest, highest-ROI marketing you will ever run.</div>
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:post-closing-7day" class="text-xs px-3 py-2 rounded-xl bg-[#002B5C] text-white font-semibold hover:bg-black transition">Start 7-Day framework →</button>
        <button type="button" data-vault-bridge="modal:referral-flywheel-system" class="text-xs px-3 py-2 rounded-xl border border-teal-500 text-teal-700 font-semibold hover:bg-teal-100 transition">Full flywheel →</button>
        <button type="button" data-vault-bridge="weekly" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Block Power Hour →</button>
      </div>
      ${footerActions('Copy LTV Framework')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  // ─── FULL 7-DAY SCRIPTS ──────────────────────────────────────────────
  function renderPostClosingFullScripts(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Word-for-Word Scripts');
    const sections = [
      { title: 'Opening — Build Rapport + Permission', script: 'Hi [Name], it\'s [Your Name] from [Company]. I\'m just calling to check in on how the first week in the new house is going. Do you have 3-4 minutes? I promise I won\'t keep you long.', tip: 'Smile while you talk. Energy matters more than perfection.' },
      { title: 'Education Section — The Value', script: 'A couple quick things most people run into in the first month… 1. Your first mortgage payment is due [date] for [amount]. 2. You\'ll get separate bills for taxes and insurance — don\'t pay them twice. 3. You might start getting refinance offers in the mail — forward them to me and I\'ll tell you if they\'re worth looking at. 4. I\'ll send monthly home value updates through myHomeIQ/HomeBot so you can see your equity growing.', tip: 'Pause after each point. Ask "make sense?" before moving on.' },
      { title: 'Feedback Section', script: 'Before I let you go — how did we do overall? Is there anything we could have done better? Your honest feedback helps me improve for the next family.', tip: 'Silence after the question. Let them talk.' },
      { title: 'The Ask — Reviews + Referrals + Anchor', script: 'If you\'re happy with how everything went, I\'d be incredibly grateful for a quick Google review — I\'ll text you the link after we hang up. And when friends or coworkers mention buying or refinancing, would you be comfortable mentioning my name? Last thing — I\'d love to do a quick 15-minute mortgage efficiency check-up around your one-year anniversary. I\'ll reach out then. Sound good?', tip: 'Send review link within 2 hours. Calendar the annual review.' }
    ];
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">COMPLETE CONVERSATION</span></div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Word-for-word scripts for every section of the 7-day call. Read naturally — don't sound scripted.</p>
      <div class="space-y-4 mb-6">
        ${sections.map((s) => scriptCard(s.title, s.script, s.tip)).join('')}
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:post-closing-7day" class="text-xs px-3 py-2 rounded-xl bg-[#00A89D] text-white font-semibold hover:opacity-90 transition">5-part framework overview →</button>
        <button type="button" data-vault-bridge="modal:7day-objections" class="text-xs px-3 py-2 rounded-xl border border-amber-500 text-amber-700 font-semibold hover:bg-amber-500 hover:text-white transition">Pushback responses →</button>
        <button type="button" data-vault-bridge="modal:post-closing-texts" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Follow-up texts →</button>
      </div>
      ${footerActions('Copy Full 7-Day Scripts')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  // ─── POST-CLOSING RETENTION CHECKLIST ────────────────────────────────
  function renderPostClosingChecklist(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Retention Operating Checklist');
    const blocks = [
      { title: 'Weekly Power Hour (Thursdays)', color: 'border-[#00A89D]', items: ['Pull list of clients who closed 7 days ago', 'Block 60–90 minutes — non-negotiable', 'Complete full 7-day calls using script + checklist', 'Log everything in CRM with notes', 'Send follow-up text same day', 'Send Google review link if they agreed'] },
      { title: '30 / 60 / 90 Day Follow-Ups', color: 'border-purple-400', items: ['Day 30: Call or detailed check-in text', 'Day 60: Light value touch + soft referral ask', 'Day 90: Email + small gift or resource + Annual Review seed'] },
      { title: 'Ongoing Engine', color: 'border-[#002B5C]/40', items: ['Every Monday: Pull birthday + anniversary list for the week', 'Call or text every client on that list', 'Quarterly: Review top 10 referrers — personal note + small gift', 'Annually: Send Annual Mortgage Review invitation at closing anniversary'] }
    ];
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">PILLAR 3</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 text-xs">PRINT &amp; RUN WEEKLY</span>
      </div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">The complete system checklist — follow every week until it's automatic.</p>
      <div class="space-y-4 mb-6">
        ${blocks.map((b) => `
          <div class="rounded-2xl border-l-4 ${b.color} border border-gray-200 dark:border-gray-700 p-5">
            <div class="font-bold text-sm text-[#002B5C] dark:text-white mb-3">${esc(b.title)}</div>
            <ul class="text-sm space-y-1.5 text-gray-700 dark:text-gray-300">
              ${b.items.map((i) => `<li class="flex gap-2"><span class="text-[#00A89D]">☐</span>${esc(i)}</li>`).join('')}
            </ul>
          </div>`).join('')}
      </div>
      <div class="p-4 rounded-2xl bg-[#F15A29]/5 border border-[#F15A29]/20 text-sm mb-6">
        <strong>Accountability:</strong> If you miss a Power Hour, reschedule within 48 hours. Consistency beats volume.
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="weekly" class="text-xs px-3 py-2 rounded-xl bg-[#002B5C] text-white font-semibold hover:bg-black transition">Weekly Win Plan →</button>
        <button type="button" data-vault-bridge="modal:post-closing-7day" class="text-xs px-3 py-2 rounded-xl border border-[#00A89D] text-[#00A89D] font-semibold hover:bg-[#00A89D] hover:text-white transition">7-Day framework →</button>
        <button type="button" data-vault-bridge="modal:nurture-12month-calendar" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">12-month calendar →</button>
      </div>
      ${footerActions('Copy Full Retention Checklist')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  // ─── OBJECTION SCRIPT LIBRARY (INDEX) ────────────────────────────────
  function renderObjectionFullLibrary(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Master Objection Index');
    const categories = [
      { label: 'Rates Too High', count: 6, bridge: 'modal:objection-rates', sample: 'Rates feel high compared to 2021, but people who waited often paid 15–25% more for the same house. Want me to show you the math on your price range?' },
      { label: 'Waiting for Rates to Drop', count: 5, bridge: 'modal:objection-waiting', sample: 'Let\'s say rates drop to 5.5% in 12 months. Homes often rise 9–14% in that time. On a $420k home that\'s $42–58k extra to save ~$200/month.' },
      { label: 'Credit Score Too Low', count: 4, bridge: 'modal:objection-credit', sample: 'Credit doesn\'t have to be perfect — it has to be on a path. I\'ve helped plenty of people buy sooner than they thought with a 60–90 day plan.' },
      { label: 'Down Payment Concerns', count: 4, bridge: 'modal:objection-downpayment', sample: 'You may not need as much as you think. Between DPA programs, gift funds, and seller concessions, I\'ve helped people get in with under $5k out of pocket.' },
      { label: '"I Have a Guy"', count: 4, bridge: 'modal:objection-competitor', sample: 'I respect loyalty. Happy to be a no-pressure second opinion — if after one conversation your guy is still the best fit, I\'ll respect that completely.' },
      { label: 'AI / Zillow / Modern', count: 3, bridge: 'modal:objection-modern', sample: 'Those tools are great for ballpark math. They don\'t know your credit profile, state programs, or the 12–15 products we have. Want real numbers?' },
      { label: 'Investor / Cash Buyer', count: 2, bridge: 'modal:objection-investor', sample: 'Even cash buyers use leverage right now. Want to run numbers on keeping cash liquid with 50–70% LTV?' },
      { label: 'Partner / Realtor Pushback', count: 4, bridge: 'modal:objection-gain-partner-business', sample: 'I\'m not here to take more of your time. I wanted to drop off something small that might save you time on your next few deals.' }
    ];
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-600">25+ RESPONSES</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#002B5C]/10 text-[#002B5C] dark:text-gray-300">BOOKMARK THIS</span>
      </div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-2">Your master index — drill into any category for full response sets.</p>
      <p class="text-sm text-gray-500 mb-6">Start with the <strong>90-Second Psychology System</strong> for flow, then grab category-specific scripts below.</p>
      <div class="space-y-3 mb-6">
        ${categories.map((c) => `
          <div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
            <div class="flex flex-wrap justify-between gap-2 mb-2">
              <div class="font-bold text-sm text-[#002B5C] dark:text-white">${esc(c.label)} <span class="text-gray-400 font-normal">(${c.count})</span></div>
              <button type="button" data-vault-bridge="${c.bridge}" class="text-[10px] px-3 py-1 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 transition">Open full set →</button>
            </div>
            <div class="text-sm italic text-gray-600 dark:text-gray-400">"${esc(c.sample)}"</div>
            <button type="button" data-copy-snippet="${esc(c.sample)}" class="mt-2 text-[10px] px-3 py-1 rounded-xl border border-amber-500 text-amber-700 hover:bg-amber-500 hover:text-white font-semibold"><i class="fas fa-copy mr-1"></i>Quick copy</button>
          </div>`).join('')}
      </div>
      <div class="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 text-sm mb-6">
        <strong>Practice plan:</strong> Pick your top 3 categories. Run each response out loud twice this week. Pair with Sales Script Generator for role-play.
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:objection-psychology-system" class="text-xs px-3 py-2 rounded-xl bg-[#002B5C] text-white font-semibold hover:bg-black transition">90-Second system →</button>
        <button type="button" data-vault-bridge="scripts" class="text-xs px-3 py-2 rounded-xl border border-amber-500 text-amber-700 font-semibold hover:bg-amber-100 transition">Sales Script Generator →</button>
        <button type="button" data-vault-bridge="pillar:4" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">All objections →</button>
      </div>
      ${footerActions('Copy Objection Library Index')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  // ─── NURTURE TEXT SWIPE FILE ─────────────────────────────────────────
  function renderNurtureSwipeFile(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Text Swipe File');
    const categories = [
      { name: 'Relationship Maintenance', msgs: [
        'Hey [Name], saw your post about the new job — huge congrats! Hope everything is going great at the new house.',
        'Just thinking about you guys. Any fun plans for the house this summer?',
        'Hope you had a great weekend! The new kitchen looks amazing from the photos you posted.',
        'Random check-in — how\'s the puppy adjusting to the new backyard?',
        'Hey [Name], just wanted to say thanks for the partnership. You make my job easy.'
      ]},
      { name: 'Value Touches / Market Updates', msgs: [
        'Quick note — property taxes for [County] are due next month. Let me know if you want the exact amount for your home.',
        'Rates moved a little this week. Not saying it\'s time to do anything, but happy to run a quick scenario if you\'re curious.',
        'Inventory in [neighborhood] is up 12% this month. Might be good for some of your buyers.',
        'New first-time buyer program just launched in [state] — up to $10k assistance. Happy to send details.',
        'Rates are at a 3-month low this week. Want a simple flyer you can forward to past clients?'
      ]},
      { name: 'Light Referral Asks', msgs: [
        'If any friends or coworkers mention buying or refinancing, I\'d love to help them the same way I helped you.',
        'When mortgages come up with your clients, feel free to mention my name. I\'ll take great care of them.',
        'No pressure — if you know anyone thinking about moving in the next 6 months, I\'d be honored to help.',
        'Your referrals mean the world. I treat every one like family.',
        'Just a reminder I\'m always here — even for a quick question.'
      ]},
      { name: 'Post-Closing & Anniversary', msgs: [
        'First payment went out smoothly on my end. Let me know if you have any questions about what you\'re seeing.',
        'Hope the first month in the new house has been smooth. Any surprises pop up?',
        'One year ago today we closed! Hope you\'re loving the home as much as day one.',
        'Your home value update just came in — equity is up nicely. Want the details?',
        'If you ever want to chat about future goals (move-up, investment, etc.), I\'m here.'
      ]}
    ];
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-600">40+ MESSAGES</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 text-xs">10-SECOND TOUCHES</span>
      </div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-2">Copy, paste, personalize. High response rate — send sparingly and genuinely.</p>
      <p class="text-sm text-gray-500 mb-6">Pair with the <strong>12-Month Nurture Calendar</strong> for timing.</p>
      <div class="space-y-6 mb-6">
        ${categories.map((cat) => `
          <div>
            <div class="text-xs font-bold tracking-wider text-blue-600 uppercase mb-3">${esc(cat.name)}</div>
            <div class="space-y-2">
              ${cat.msgs.map((m, i) => `
                <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-3 flex flex-wrap justify-between gap-2 items-start">
                  <div class="text-sm text-gray-700 dark:text-gray-300 flex-1 min-w-0">"${esc(m)}"</div>
                  <button type="button" data-copy-snippet="${esc(m)}" class="text-[10px] px-2 py-1 rounded-lg border border-blue-400 text-blue-700 hover:bg-blue-500 hover:text-white font-semibold shrink-0"><i class="fas fa-copy"></i></button>
                </div>`).join('')}
            </div>
          </div>`).join('')}
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:nurture-12month-calendar" class="text-xs px-3 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">12-month calendar →</button>
        <button type="button" data-vault-bridge="weekly" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Weekly Win Plan →</button>
      </div>
      ${footerActions('Copy Swipe File Summary')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  // ─── GIFTOLOGY MINDSET ───────────────────────────────────────────────
  function renderGiftologyMindset(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Giftology Foundation');
    const rules = [
      { n: '1', rule: 'Know them first', detail: 'Listen during the process — hobbies, kids, home projects, coffee preferences. That intel is gold.' },
      { n: '2', rule: 'Quality > Quantity', detail: 'One $60–80 knife they use daily beats ten $8 branded items that get hidden.' },
      { n: '3', rule: 'Subtle branding only', detail: 'Your name on the back, bottom, or inside the box — never dominating the front.' },
      { n: '4', rule: 'Unexpected timing wins', detail: '6–12 months post-close feels magical. Everyone else has forgotten them.' },
      { n: '5', rule: 'Usable in the new home', detail: 'Kitchen, door, desk, car — constant visual reminders of you.' }
    ];
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#F15A29]/10 text-[#F15A29]">GIFTOLOGY</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">PILLAR 2 FOUNDATION</span>
      </div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-4">Stop giving logo junk. Give gifts that make people feel <strong>seen</strong>.</p>
      <div class="p-4 rounded-2xl bg-[#F15A29]/5 border border-[#F15A29]/20 text-sm mb-6">
        <strong class="text-[#F15A29]">John Ruhlin's core truth:</strong> "The best gifts are the ones they would have bought for themselves… but didn't." Personal, high-quality, used often.
      </div>
      <div class="space-y-3 mb-6">
        ${rules.map((r) => `
          <div class="rounded-2xl border-l-4 border-[#00A89D] border border-gray-200 dark:border-gray-700 p-4">
            <div class="font-bold text-sm text-[#002B5C] dark:text-white">${r.n}. ${esc(r.rule)}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">${esc(r.detail)}</div>
          </div>`).join('')}
      </div>
      <div class="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border text-sm mb-6">
        <strong>Pro move:</strong> Log every gift in CRM: date + item + one personal detail used. Builds your "know them" muscle over time.
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:gift-cadence-system" class="text-xs px-3 py-2 rounded-xl bg-[#F15A29] text-white font-semibold hover:bg-orange-600 transition">Gift cadence system →</button>
        <button type="button" data-vault-bridge="pillar:2" class="text-xs px-3 py-2 rounded-xl border border-[#F15A29] text-[#F15A29] font-semibold hover:bg-[#F15A29] hover:text-white transition">Browse gift ideas →</button>
        <button type="button" data-vault-bridge="modal:gift-chef-knife" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Chef knife classic →</button>
      </div>
      ${footerActions('Copy Giftology Principles')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  // ─── POP-BY BEST PRACTICES ───────────────────────────────────────────
  function renderPopbyBestPractices(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Pop-By Operating System');
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">PILLAR 1</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 text-xs">RELATIONSHIP > GIFT</span>
      </div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Pop-bys are about the <strong>relationship and story</strong> — not the price tag. Make them feel known.</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="rounded-2xl border border-[#00A89D]/30 bg-[#00A89D]/5 p-4">
          <div class="font-bold text-sm mb-2"><i class="fas fa-clock text-[#00A89D] mr-1"></i> Timing That Wins</div>
          <ul class="text-sm space-y-1 text-gray-700 dark:text-gray-300">
            <li>• Within 48 hrs of referral/closing</li>
            <li>• After a tough week for the agent</li>
            <li>• Seasonally (holidays, spring market)</li>
            <li>• "Just because" — lands hardest</li>
          </ul>
        </div>
        <div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <div class="font-bold text-sm mb-2"><i class="fas fa-hand-holding-heart text-[#F15A29] mr-1"></i> Delivery Rules</div>
          <ul class="text-sm space-y-1 text-gray-700 dark:text-gray-300">
            <li>• In-person drop under 60 seconds</li>
            <li>• Handwritten note — something specific</li>
            <li>• Same-day follow-up text</li>
            <li>• Log in CRM with item + follow-up date</li>
          </ul>
        </div>
      </div>
      ${scriptCard('Same-day follow-up text',
        'Hope the [gift] brings a smile. Let me know if I can support any of your buyers this week.',
        'Reference the specific gift and keep it under 2 sentences.')}
      <div class="mt-4 p-4 rounded-2xl bg-[#F15A29]/5 border border-[#F15A29]/20 text-sm mb-6">
        <strong>80/20 Rule:</strong> Spend $6–12 on 80% of pop-bys. Save $18–30 "wow" items for top 10–15 partners. Consistency beats extravagance.
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:popby-sourcing-budget" class="text-xs px-3 py-2 rounded-xl border border-[#00A89D] text-[#00A89D] font-semibold hover:bg-[#00A89D] hover:text-white transition">Sourcing & budget →</button>
        <button type="button" data-vault-bridge="modal:popby-what-to-say" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">What to say →</button>
        <button type="button" data-vault-bridge="pillar:1" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">All pop-by ideas →</button>
      </div>
      ${footerActions('Copy Pop-By Best Practices')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  // ─── POP-BY SOURCING & BUDGET ──────────────────────────────────────────
  function renderPopbySourcing(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Pop-By Logistics');
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">SOURCING & ROI</span></div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Where to buy, how much to spend, and how to measure what works.</p>
      <div class="rounded-2xl border border-[#00A89D]/30 bg-[#00A89D]/5 p-5 mb-4">
        <div class="font-bold text-sm mb-2">Recommended monthly budget</div>
        <div class="text-sm text-gray-700 dark:text-gray-300 mb-3">$150–300/month · 8–12 thoughtful touches</div>
        <div class="grid grid-cols-3 gap-2 text-xs text-center">
          <div class="p-2 rounded-xl bg-white dark:bg-gray-900 border"><strong>70%</strong><br>$5–12 everyday</div>
          <div class="p-2 rounded-xl bg-white dark:bg-gray-900 border"><strong>20%</strong><br>$12–20 mid-tier</div>
          <div class="p-2 rounded-xl bg-white dark:bg-gray-900 border"><strong>10%</strong><br>$25–40 wow</div>
        </div>
      </div>
      <div class="space-y-3 mb-6 text-sm">
        <div class="rounded-xl border p-3"><strong class="text-[#00A89D]">Ultra low ($3–8):</strong> Dollar Tree, Five Below, Walmart clearance, Amazon/Temu bulk</div>
        <div class="rounded-xl border p-3"><strong class="text-[#00A89D]">Good quality ($8–20):</strong> HomeGoods, TJ Maxx, Costco, Target clearance, Etsy</div>
        <div class="rounded-xl border p-3"><strong class="text-[#00A89D]">Premium ($20+):</strong> Etsy custom, 4imprint bulk, local engraving shops</div>
        <div class="rounded-xl border p-3"><strong class="text-[#F15A29]">Bulk strategy:</strong> Find a winner → buy 24–50 → store in trunk → rotate so it feels fresh</div>
      </div>
      <div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div class="font-bold text-sm mb-2">Simple tracking columns</div>
        <div class="text-sm text-gray-600 dark:text-gray-400">Date · Partner · Item + Cost · Reason · Follow-up · Result (referral / positive / none)</div>
        <div class="text-xs text-gray-500 mt-2">Review every 90 days. Double down on winners. Cut what doesn't work.</div>
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:popby-best-practices" class="text-xs px-3 py-2 rounded-xl bg-[#00A89D] text-white font-semibold hover:opacity-90 transition">Best practices →</button>
        <button type="button" data-vault-bridge="pillar:1" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Pop-by library →</button>
      </div>
      ${footerActions('Copy Sourcing System')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  // ─── 30-DAY ACTIVATION ───────────────────────────────────────────────
  function renderActivationPlan(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • 30-Day Operating System');
    contentEl.innerHTML = `
      <div class="mb-6">
        <span class="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-[#F15A29]/10 text-[#F15A29]">30-DAY ACTIVATION</span>
        <span class="inline-block ml-2 px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">ALL 6 PILLARS</span>
      </div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-2">${item.teaser || 'Install the full Value Vault system in one month.'}</p>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">Your operating system — not a reading assignment. Work one week at a time, use pillar jumps, and block time in <strong>Weekly Win Plan</strong>.</p>
      <div class="space-y-4">
        <div class="rounded-2xl border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/20 p-5">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <div class="text-[10px] font-bold tracking-wider text-purple-600 uppercase">Week 1 · Days 1–7</div>
              <div class="font-bold text-[#002B5C] dark:text-white">Foundation — Content &amp; Nurture</div>
              <div class="text-xs text-gray-500">Pillars 5 + 6</div>
            </div>
            <div class="flex gap-2">
              <button type="button" data-vault-bridge="pillar:5" class="text-xs px-3 py-1.5 rounded-xl border border-purple-300 text-purple-700 font-semibold hover:bg-purple-100 transition">Pillar 5 →</button>
              <button type="button" data-vault-bridge="pillar:6" class="text-xs px-3 py-1.5 rounded-xl border border-purple-300 text-purple-700 font-semibold hover:bg-purple-100 transition">Pillar 6 →</button>
            </div>
          </div>
          <ul class="text-sm space-y-2 text-gray-700 dark:text-gray-300 list-none">
            <li class="flex gap-2"><span class="text-[#00A89D]">☐</span> Film and post 4 Reels using pillar hook formulas</li>
            <li class="flex gap-2"><span class="text-[#00A89D]">☐</span> Set up post-closing + partner weekly nurture sequences</li>
            <li class="flex gap-2"><span class="text-[#00A89D]">☐</span> Send your first 5 partner value emails</li>
          </ul>
        </div>
        <div class="rounded-2xl border border-[#00A89D]/30 bg-[#00A89D]/5 p-5">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <div class="text-[10px] font-bold tracking-wider text-[#00A89D] uppercase">Week 2 · Days 8–14</div>
              <div class="font-bold text-[#002B5C] dark:text-white">Relationship Fuel — Pop-Bys &amp; Gifts</div>
              <div class="text-xs text-gray-500">Pillars 1 + 2</div>
            </div>
            <div class="flex gap-2">
              <button type="button" data-vault-bridge="pillar:1" class="text-xs px-3 py-1.5 rounded-xl border border-[#00A89D] text-[#00A89D] font-semibold hover:bg-[#00A89D] hover:text-white transition">Pillar 1 →</button>
              <button type="button" data-vault-bridge="pillar:2" class="text-xs px-3 py-1.5 rounded-xl border border-[#00A89D] text-[#00A89D] font-semibold hover:bg-[#00A89D] hover:text-white transition">Pillar 2 →</button>
            </div>
          </div>
          <ul class="text-sm space-y-2 text-gray-700 dark:text-gray-300 list-none">
            <li class="flex gap-2"><span class="text-[#00A89D]">☐</span> Identify your top 10 referral partners</li>
            <li class="flex gap-2"><span class="text-[#00A89D]">☐</span> Complete 5 strategic pop-bys with handwritten notes</li>
            <li class="flex gap-2"><span class="text-[#00A89D]">☐</span> Send 3 high-quality client gifts (use the cadence system)</li>
          </ul>
        </div>
        <div class="rounded-2xl border border-[#002B5C]/20 bg-[#002B5C]/5 p-5">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <div class="text-[10px] font-bold tracking-wider uppercase">Week 3 · Days 15–21</div>
              <div class="font-bold text-[#002B5C] dark:text-white">Installation — Post-Closing Systems</div>
              <div class="text-xs text-gray-500">Pillar 3</div>
            </div>
            <button type="button" data-vault-bridge="pillar:3" class="text-xs px-3 py-1.5 rounded-xl border font-semibold hover:bg-[#002B5C] hover:text-white transition">Pillar 3 →</button>
          </div>
          <ul class="text-sm space-y-2 text-gray-700 dark:text-gray-300 list-none">
            <li class="flex gap-2"><span class="text-[#00A89D]">☐</span> Run your first full 7-Day Power Hour on recent closings</li>
            <li class="flex gap-2"><span class="text-[#00A89D]">☐</span> Start birthday/anniversary touch system</li>
            <li class="flex gap-2"><span class="text-[#00A89D]">☐</span> Book 3 Annual Mortgage Review calls with past clients</li>
          </ul>
          <button type="button" data-vault-bridge="modal:post-closing-7day" class="mt-3 text-xs px-2 py-1 rounded-lg border border-[#00A89D] text-[#00A89D] font-semibold">7-Day framework →</button>
        </div>
        <div class="rounded-2xl border border-amber-300 bg-amber-50/60 dark:bg-amber-900/20 p-5">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <div class="text-[10px] font-bold tracking-wider text-amber-600 uppercase">Week 4 · Days 22–30</div>
              <div class="font-bold text-[#002B5C] dark:text-white">Defense + Scale — Objections &amp; Review</div>
              <div class="text-xs text-gray-500">Pillar 4 + habits review</div>
            </div>
            <button type="button" data-vault-bridge="pillar:4" class="text-xs px-3 py-1.5 rounded-xl border border-amber-500 text-amber-700 font-semibold hover:bg-amber-500 hover:text-white transition">Pillar 4 →</button>
          </div>
          <ul class="text-sm space-y-2 text-gray-700 dark:text-gray-300 list-none">
            <li class="flex gap-2"><span class="text-[#00A89D]">☐</span> Practice your top 5 objections out loud (twice)</li>
            <li class="flex gap-2"><span class="text-[#00A89D]">☐</span> Review what content performed — double down on winners</li>
            <li class="flex gap-2"><span class="text-[#00A89D]">☐</span> Build your personal 90-day habits plan</li>
          </ul>
        </div>
      </div>
      <div class="mt-6 p-5 rounded-2xl bg-gradient-to-r from-[#00A89D] to-teal-600 text-white text-sm">
        <strong>Pro move:</strong> Do this cycle once, then repeat every <strong>90 days</strong>. Pair each week with power hours in Weekly Win Plan.
      </div>
      <div class="mt-4 flex flex-wrap gap-2 mb-2">
        <button type="button" data-vault-bridge="weekly" class="text-xs px-3 py-2 rounded-xl bg-[#002B5C] text-white font-semibold"><i class="fas fa-calendar-week mr-1"></i>Weekly Win Plan</button>
        <button type="button" data-vault-bridge="modal:referral-flywheel-system" class="text-xs px-3 py-2 rounded-xl border border-white/30 text-[#002B5C] dark:text-gray-200 font-semibold hover:bg-gray-100 transition">See full flywheel →</button>
      </div>
      ${footerActions('Copy Full Activation Checklist')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  // ─── PREMIUM GIFT GUIDE SHELL ────────────────────────────────────────
  function renderPremiumGift(item, contentEl, modal, cfg) {
    setKicker(modal, 'Value Vault • Giftology Guide');
    const costBadge = item.cost ? `<span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#F15A29]/10 text-[#F15A29]">${esc(item.cost)}</span>` : '';
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2 items-center">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#F15A29]/10 text-[#F15A29]">CLIENT GIFT</span>
        ${costBadge}
        ${cfg.badge ? `<span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">${esc(cfg.badge)}</span>` : ''}
      </div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-4">${esc(item.teaser || cfg.subtitle || '')}</p>
      <div class="p-4 rounded-2xl bg-[#F15A29]/5 border border-[#F15A29]/20 text-sm mb-6">
        <strong class="text-[#F15A29]">Why this gift works:</strong>
        <ul class="mt-2 space-y-1">${(cfg.whyWorks || []).map((w) => `<li>• ${esc(w)}</li>`).join('')}</ul>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
        <div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <div class="font-semibold text-[#00A89D] mb-1"><i class="fas fa-calendar mr-1"></i> Best timing</div>
          <div class="text-gray-700 dark:text-gray-300">${esc(cfg.timing)}</div>
        </div>
        <div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <div class="font-semibold text-[#00A89D] mb-1"><i class="fas fa-star mr-1"></i> Pro upgrade</div>
          <div class="text-gray-700 dark:text-gray-300">${esc(cfg.proUpgrade)}</div>
        </div>
      </div>
      ${cfg.noteScript ? scriptCard('Handwritten note to pair', cfg.noteScript, cfg.noteTip || 'Write by hand on a quality card — never typed.') : ''}
      <div class="flex flex-wrap gap-2 mb-6 mt-4">
        <button type="button" data-vault-bridge="modal:giftology-mindset" class="text-xs px-3 py-2 rounded-xl border border-[#F15A29] text-[#F15A29] font-semibold hover:bg-[#F15A29] hover:text-white transition">Giftology mindset →</button>
        <button type="button" data-vault-bridge="modal:gift-cadence-system" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Gift cadence →</button>
        ${cfg.extraBridge ? `<button type="button" data-vault-bridge="${cfg.extraBridge}" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">${esc(cfg.extraBridgeLabel || 'Related →')}</button>` : ''}
      </div>
      ${footerActions(cfg.copyLabel || 'Copy Gift Guide')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  function renderGiftChefKnife(item, contentEl, modal) {
    renderPremiumGift(item, contentEl, modal, {
      badge: 'GIFTOLOGY CLASSIC',
      whyWorks: ['Highest daily usage of almost any kitchen tool', 'Emotional tie to home and feeding family', 'Feels premium without being ostentatious', 'Works for every demographic'],
      timing: 'Closing gift (peak impact) or 6-month anniversary for top clients.',
      proUpgrade: 'Engrave new address or "The [Last Name] Home" on blade spine. Subtle branding on box only.',
      noteScript: 'May your new kitchen create as many great memories as it does meals. Welcome home!',
      copyLabel: 'Copy Chef Knife Gift Guide'
    });
  }

  function renderGiftCustomMap(item, contentEl, modal) {
    renderPremiumGift(item, contentEl, modal, {
      badge: 'HYPER-PERSONAL',
      whyWorks: ['Extremely high emotional resonance', 'Most people never get this from a lender', 'Hangs in the home — daily visual reminder', 'Tells their "new chapter" story'],
      timing: 'Closing gift or 30–60 day "settled in" surprise. Ship to new address with handwritten card.',
      proUpgrade: 'Include small framing gift card if budget is tight post-move. Source from Etsy or local print shop.',
      noteScript: 'Every home has a story — glad we got to be part of yours. Hope this reminds you of the neighborhood you chose.',
      copyLabel: 'Copy Custom Map Gift Guide'
    });
  }

  function renderGiftWelcomeMat(item, contentEl, modal) {
    renderPremiumGift(item, contentEl, modal, {
      badge: 'DAILY VISIBILITY',
      whyWorks: ['Used multiple times daily by whole family', 'Impossible to ignore at the front door', 'Under $60 with highest visibility ROI', 'Kids and guests see your thoughtfulness too'],
      timing: 'Closing day or first-week delivery while they\'re still settling in.',
      proUpgrade: 'Neutral high-quality mat, elegant font. Avoid thin cheap mats.',
      noteScript: 'May every person who crosses this threshold feel as welcome as you made us feel during your loan process.',
      copyLabel: 'Copy Welcome Mat Gift Guide'
    });
  }

  function renderGiftRelationshipBook(item, contentEl, modal) {
    renderPremiumGift(item, contentEl, modal, {
      badge: 'LOW COST · HIGH ROI',
      whyWorks: ['Ultimate proof you were listening as a human', 'Almost no one does this consistently', '$15–30 with outsized emotional impact', 'Perfect for 6–12 month surprise timing'],
      timing: '6–12 month anniversary or birthday. Note inside cover, not on a sticky.',
      proUpgrade: 'Reference their specific hobby from the 7-day call or loan process notes in CRM.',
      noteScript: 'Saw this and immediately thought of you. Hope it gives you as much joy as you gave us during your home purchase.',
      noteTip: 'Write inside the cover — permanent and personal.',
      copyLabel: 'Copy Hobby Book Gift Guide'
    });
  }

  function renderGiftYetiTumbler(item, contentEl, modal) {
    renderPremiumGift(item, contentEl, modal, {
      badge: 'PARTNER + CLIENT FAVORITE',
      whyWorks: ['Used daily — commute, gym, open houses', 'High perceived value at mid price point', 'Works for realtors and clients equally', 'Engraving makes it feel custom'],
      timing: 'Pop-by for partners or 6-month client touch. Great for busy-season appreciation.',
      proUpgrade: 'Engrave first name or brokerage — never big logo on front.',
      noteScript: 'Hope your coffee stays hot and your week stays smooth. Appreciate everything you do.',
      extraBridge: 'modal:popby-best-practices',
      extraBridgeLabel: 'Pop-by best practices →',
      copyLabel: 'Copy Yeti Tumbler Gift Guide'
    });
  }

  function renderGiftThrowBlanket(item, contentEl, modal) {
    renderPremiumGift(item, contentEl, modal, {
      badge: '1-YEAR KEEPSAKE',
      whyWorks: ['Big retention moment at home anniversary', '"Keep forever" emotional weight', 'Cozy association with their home', 'Premium feel at $50–90 price point'],
      timing: '1-year home anniversary — your biggest retention gift moment.',
      proUpgrade: 'Custom embroidery with family name or new address. Pair with anniversary call.',
      noteScript: 'One year in the books — hope this keeps you cozy for many more chapters in the home.',
      extraBridge: 'modal:annual-mortgage-review',
      extraBridgeLabel: 'Annual review →',
      copyLabel: 'Copy Throw Blanket Gift Guide'
    });
  }

  // ─── CONTENT PILLARS ───────────────────────────────────────────────────
  function renderContentPillars(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Content Operating Menu');
    const pillars = [
      { n: '1', title: 'Local Market Expertise & Data', color: 'border-[#00A89D]', why: 'People buy in specific neighborhoods — you become the local authority.', ideas: ['"What $X buys in [neighborhood]" carousels', 'Hottest listings under $400k with commentary', '3 things changing in [zip] buyers need to know', '2024 vs 2026 median price comparisons'], pro: 'End with "DM me for the full neighborhood report."' },
      { n: '2', title: 'First-Time Buyer Education', color: 'border-[#F15A29]', why: 'Most scared buyers — make them feel safe, earn referrals for life.', ideas: ['7 fees nobody tells you until closing', 'Credit score reality in 2026 (not 740)', 'How much house can you really afford?', 'Documents needed — organized by stage'], pro: null },
      { n: '3', title: 'Rate & Market Reality Checks', color: 'border-amber-500', why: 'You become the calm trusted voice vs fear-mongering media.', ideas: ['What 6.8% actually means on a $380k home', '3 scenarios where waiting costs money', 'Why 7% today can beat 4% in 2021 (with math)', 'Weekly 45-sec Rate Reality Check Reels'], pro: null },
      { n: '4', title: 'Client Wins & Stories', color: 'border-blue-500', why: 'Social proof beats any script. Real stories convert.', ideas: ['618 credit score + $8k down — how we did it', 'Refi saved $417/mo — kitchen remodel story', 'Family of 5 into "impossible" school district'], pro: 'Always get permission. Change names if needed.' },
      { n: '5', title: 'Behind the Scenes & Personality', color: 'border-emerald-500', why: 'People do business with people they know, like, trust.', ideas: ['Day in the life (phone filmed)', '3 questions before we pull credit', 'What I\'m telling buyers this week vs 6 months ago', 'Funny/relatable closing moments'], pro: null },
      { n: '6', title: 'Quick Tips & Myth Busters', color: 'border-rose-500', why: 'Snackable, high shareability — perfect for Reels/Stories.', ideas: ['Gift funds from employer for down payment', 'VA loans — no PMI at 0% down', 'Equity access — tax-free in many cases', 'Myth-busting series (20% down, credit myths)'], pro: null }
    ];
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-600">PILLAR 5</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 text-xs">PERMANENT MENU</span>
      </div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Stop guessing what to post. These six pillars are your forever content menu.</p>
      <div class="space-y-4 mb-6">
        ${pillars.map((p) => `
          <div class="rounded-2xl border-l-4 ${p.color} border border-gray-200 dark:border-gray-700 p-4">
            <div class="font-bold text-sm text-[#002B5C] dark:text-white mb-1">${p.n}. ${esc(p.title)}</div>
            <div class="text-xs text-gray-500 mb-2">${esc(p.why)}</div>
            <ul class="text-sm space-y-0.5 text-gray-700 dark:text-gray-300">${p.ideas.map((i) => `<li>• ${esc(i)}</li>`).join('')}</ul>
            ${p.pro ? `<div class="mt-2 text-[10px] text-purple-600 font-semibold">Pro: ${esc(p.pro)}</div>` : ''}
          </div>`).join('')}
      </div>
      <div class="p-4 rounded-2xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 text-sm mb-6">
        <strong>Weekly mix rule:</strong> 1× Local (Pillar 1) + 1× Education/Rate (2 or 3) + 1× Story/Personality/Tip (4, 5, or 6). Authoritative + human.
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:content-30day-sprint" class="text-xs px-3 py-2 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition">30-day sprint →</button>
        <button type="button" data-vault-bridge="modal:reel-hook-formula" class="text-xs px-3 py-2 rounded-xl border border-purple-400 text-purple-700 font-semibold hover:bg-purple-100 transition">Reel hooks →</button>
        <button type="button" data-vault-bridge="social" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Social Strategy →</button>
      </div>
      ${footerActions('Copy 6 Content Pillars')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  function renderContentRepurposing(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Content Multiplier');
    const steps = [
      { title: 'Record the Mother Video', desc: '60–90 sec Reel answering one real question. Trending audio. Direct to camera.', outputs: null },
      { title: 'Same-Day Repurposes', desc: 'Immediate leverage while energy is high.', outputs: ['Post to IG + TikTok + YouTube Shorts', 'Story series — 3–4 frames from raw cut', '3–5 carousel graphics (Canva/CapCut)', '3–4 quote posts for LinkedIn + Facebook'] },
      { title: 'Next 1–2 Days', desc: 'Deeper formats from same transcript.', outputs: ['400–600 word LinkedIn/Facebook article', 'Email to database: "This week\'s 90-sec insight"', '5–7 slide carousel (different framing)', '45-sec polished square feed version'] },
      { title: 'Weekly Long-Form', desc: 'Combine 3–4 best Reels into one 8–12 min YouTube video.', outputs: ['Title: "Mortgage Questions I\'m Answering This Week"', 'SEO gold + lead magnet potential'] }
    ];
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-600">1 → 7 SYSTEM</span></div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-2">Record once. Publish everywhere. 15–20 pieces/week without burnout.</p>
      <p class="text-sm text-gray-500 mb-6">One strong 60–90 second video becomes the source for everything else.</p>
      <div class="space-y-4 mb-6">
        ${steps.map((s, i) => `
          <div class="rounded-2xl border border-purple-200 dark:border-purple-800 p-4">
            <div class="text-[10px] font-bold text-purple-600 uppercase mb-1">Step ${i + 1}</div>
            <div class="font-bold text-sm text-[#002B5C] dark:text-white">${esc(s.title)}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">${esc(s.desc)}</div>
            ${s.outputs ? `<ul class="mt-2 text-sm space-y-1">${s.outputs.map((o) => `<li class="flex gap-2"><span class="text-purple-500">•</span>${esc(o)}</li>`).join('')}</ul>` : ''}
          </div>`).join('')}
      </div>
      <div class="p-4 rounded-2xl bg-[#F15A29]/5 border border-[#F15A29]/20 text-sm mb-6">
        <strong>Realistic output:</strong> 4–5 mother videos/week → 18–25 total pieces (Reels, carousels, emails, LinkedIn, Stories, 1 YouTube).
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:content-cadence" class="text-xs px-3 py-2 rounded-xl border border-purple-400 text-purple-700 font-semibold hover:bg-purple-100 transition">Posting cadence →</button>
        <button type="button" data-vault-bridge="modal:content-pillars" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Content pillars →</button>
        <button type="button" data-vault-bridge="weekly" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Weekly Win Plan →</button>
      </div>
      ${footerActions('Copy Repurposing System')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  function renderContentCadence(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • 2026 Posting Rhythm');
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-600">CADENCE & ALGORITHM</span></div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Sustainable cadence that produces results — not burnout posting.</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="rounded-2xl border border-[#00A89D]/30 bg-[#00A89D]/5 p-4">
          <div class="font-bold text-sm text-[#00A89D] mb-2">Weekly cadence (sustainable)</div>
          <ul class="text-sm space-y-1.5 text-gray-700 dark:text-gray-300">
            <li>• <strong>4–5 Reels/Shorts</strong> (Mon, Tue, Thu, Fri/Sat)</li>
            <li>• <strong>2–3 Carousels</strong> (LinkedIn + IG)</li>
            <li>• <strong>1 YouTube</strong> every 10–14 days</li>
            <li>• <strong>3–4 Stories/day</strong> (BTS, tips, market)</li>
            <li>• <strong>1–2 emails/week</strong> to database</li>
          </ul>
        </div>
        <div class="rounded-2xl border border-[#F15A29]/30 bg-[#F15A29]/5 p-4">
          <div class="font-bold text-sm text-[#F15A29] mb-2">What algorithms love in 2026</div>
          <ul class="text-sm space-y-1.5 text-gray-700 dark:text-gray-300">
            <li>• Watch time in first 3 seconds > everything</li>
            <li>• Comments & saves > likes</li>
            <li>• Original trending audio still wins</li>
            <li>• Best times: 6:45–7:30am or 7–8pm local</li>
            <li>• 6+ weeks consistency beats sporadic perfection</li>
          </ul>
        </div>
      </div>
      <div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div class="font-bold text-sm mb-2">70 / 20 / 10 content mix</div>
        <div class="text-sm space-y-1 text-gray-700 dark:text-gray-300">
          <div><strong class="text-[#00A89D]">70%</strong> Educational / valuable (6 pillars)</div>
          <div><strong class="text-purple-600">20%</strong> Personal / behind the scenes</div>
          <div><strong class="text-amber-600">10%</strong> Soft business asks (reviews, referrals)</div>
        </div>
      </div>
      <div class="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 text-sm mb-6">
        <strong>Burnout prevention:</strong> Batch film 4–6 Reels Sunday/Monday (90 min). CapCut templates. One off-day/week. Never double-post to "catch up."
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:content-30day-sprint" class="text-xs px-3 py-2 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition">30-day sprint →</button>
        <button type="button" data-vault-bridge="modal:content-repurposing" class="text-xs px-3 py-2 rounded-xl border border-purple-400 font-semibold hover:bg-purple-100 transition">1-to-7 repurposing →</button>
      </div>
      ${footerActions('Copy Content Cadence Guide')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  function renderReelHookFormula(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Scroll-Stopping Hooks');
    const hooks = [
      { name: 'The "I Was Wrong" Hook', script: 'I used to tell every buyer to wait for lower rates… I was dead wrong.', why: 'Vulnerability + authority. They want to know what changed your mind.' },
      { name: 'Contrarian / Counter-Intuitive', script: '6.75% is actually one of the best times in 15 years to buy. Here\'s the math nobody shows you.', why: 'Challenges belief — brain keeps watching to resolve dissonance.' },
      { name: '"Most People Don\'t Know"', script: 'Most people don\'t realize veterans can put 0% down with no PMI. Watch this before you listen to your uncle.', why: 'Curiosity gap + social proof against bad advice.' },
      { name: 'Specific Number Hook', script: 'This couple just saved $2,847 per year using a strategy most loan officers never mention.', why: 'Specific numbers feel researched. Vague claims get scrolled.' },
      { name: 'Story Hook (best for Reels)', script: 'A 29-year-old nurse walked in crying. Three months later she closed on her first home. Here\'s what we did differently.', why: 'Human + emotional + repeatable method promise.' },
      { name: 'Direct Question Hook', script: 'If rates dropped to 5.5% tomorrow, would you actually be ready to buy? Most of my clients wouldn\'t. Here\'s why that\'s dangerous.', why: 'Forces self-reflection — am I one of "most clients"?' },
      { name: '"2026 Reality" Hook', script: 'The game changed in 2025. If you\'re still using 2021 buying advice, you\'re leaving money on the table.', why: 'Recency + authority — works extremely well right now.' }
    ];
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-600">1.5 SECONDS TO WIN</span></div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Seven hook patterns working for loan officers in 2026. First 3 words must be crystal clear.</p>
      <div class="space-y-3 mb-6">
        ${hooks.map((h) => `
          <div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
            <div class="font-bold text-sm text-[#00A89D] mb-1">${esc(h.name)}</div>
            <div class="text-sm italic text-gray-700 dark:text-gray-300 mb-1">"${esc(h.script)}"</div>
            <div class="text-[10px] text-gray-500 mb-2">${esc(h.why)}</div>
            <button type="button" data-copy-snippet="${esc(h.script)}" class="text-[10px] px-3 py-1 rounded-xl border border-purple-500 text-purple-700 hover:bg-purple-500 hover:text-white font-semibold"><i class="fas fa-copy mr-1"></i>Copy hook</button>
          </div>`).join('')}
      </div>
      <div class="p-4 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-sm mb-6">
        <strong>Delivery:</strong> Slight pause after hook. Eye contact entire time. First 3 sec = hook. Next 3 sec = value promise.
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:content-pillars" class="text-xs px-3 py-2 rounded-xl border border-purple-400 font-semibold hover:bg-purple-100 transition">Content pillars →</button>
        <button type="button" data-vault-bridge="social" class="text-xs px-3 py-2 rounded-xl bg-[#002B5C] text-white font-semibold hover:bg-black transition">Social Strategy →</button>
      </div>
      ${footerActions('Copy All Hook Formulas')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  // ─── POP-BY SCRIPTS & PSYCHOLOGY ───────────────────────────────────────
  function renderPopbyWhatToSay(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Pop-By Delivery Scripts');
    const scripts = [
      { situation: 'Standard drop (no prior relationship)', script: 'Hey [Name], I\'m [Your Name] with [Company]. I know you\'re busy — I just wanted to drop this off and say thanks for everything you do for the community. No strings attached. Hope it makes your week a little better. My card\'s inside if you ever need anything.', tip: 'Under 30 seconds. Smile. Leave before awkward.' },
      { situation: 'After they referred you', script: 'I just wanted to personally thank you for sending [Client Name] my way. That meant a lot. I dropped off a little something to show my appreciation — no big deal, just wanted you to know I noticed.', tip: 'Reference the specific client name always.' },
      { situation: 'Busy season / high stress', script: 'I know it\'s crazy right now with listings. I won\'t keep you — just wanted to leave this for you and your team. You guys are killing it. Let me know if there\'s any way I can make your life easier on the financing side.', tip: 'Best timing for reciprocity trigger.' },
      { situation: 'Long-term partner (keep light)', script: 'Just swinging by to say hi and drop this off. How\'s your summer going? Any fun trips planned? I\'m around if you need anything at all.', tip: 'No business talk unless they bring it up.' }
    ];
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">20–45 SECONDS</span></div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Exact scripts for every pop-by situation. The gift does the heavy lifting — your words just open the door.</p>
      <div class="space-y-4 mb-6">
        ${scripts.map((s) => scriptCard(s.situation, s.script, s.tip)).join('')}
      </div>
      <div class="p-4 rounded-2xl bg-[#00A89D]/5 border border-[#00A89D]/20 text-sm mb-6">
        <strong>Golden rule:</strong> Under 45 seconds. Eye contact. Leave before it gets awkward.
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:popby-note-templates" class="text-xs px-3 py-2 rounded-xl border border-[#00A89D] text-[#00A89D] font-semibold hover:bg-[#00A89D] hover:text-white transition">Note templates →</button>
        <button type="button" data-vault-bridge="modal:popby-best-practices" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Best practices →</button>
      </div>
      ${footerActions('Copy All Pop-By Scripts')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  function renderPopbyNoteTemplates(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Handwritten Note Library');
    const notes = [
      { label: 'Standard thank you', text: '[Name],\n\nJust wanted to drop this off and say thank you for all the great work you do. You make buying and selling homes look easy. Hope this brightens your day.\n\nGrateful to know you,\n[Your Name]' },
      { label: 'After a referral', text: '[Name],\n\nThank you for trusting me with [Client]. It means the world. I wanted you to know I took great care of them. Here\'s a little something for you — enjoy!\n\nTalk soon,\n[Your Name]' },
      { label: 'Busy season support', text: '[Name],\n\nI know it\'s insane right now. Just dropping this off as a small "you\'re crushing it" gift. You\'re doing amazing work. Let me know if I can ever help lighten the load on the financing side.\n\n[Your Name]' },
      { label: 'Long-term partner', text: '[Name],\n\nJust swinging by to say hi. Hope this small gift makes your week better. Appreciate the partnership more than you know.\n\n[Your Name]' },
      { label: 'Client win celebration', text: '[Name],\n\nCongrats on helping [Client] close! I wanted to celebrate your win with this. You\'re the best.\n\n[Your Name]' },
      { label: 'Just because', text: '[Name],\n\nNo reason — just thinking about how lucky I am to work with agents like you. Enjoy this!\n\n[Your Name]' },
      { label: 'Market update drop', text: '[Name],\n\nDropped off a quick local market snapshot + this small treat. Thought it might be useful for your sphere.\n\n[Your Name]' },
      { label: 'After tough week', text: '[Name],\n\nI know this week was crazy. Just a small pick-me-up to say you\'re appreciated.\n\n[Your Name]' },
      { label: 'Seasonal / holiday', text: '[Name],\n\nHappy [holiday]! Hope this small gift adds a little joy to your season.\n\n[Your Name]' },
      { label: 'New agent support', text: '[Name],\n\nCongrats on the new chapter. Dropped off a few things to help you crush your first 100 days.\n\n[Your Name]' },
      { label: 'Referral thank you', text: '[Name],\n\nJust closed on [Client] thanks to you. Here\'s a small token of my appreciation — you\'re the best.\n\n[Your Name]' },
      { label: 'Quarterly touch', text: '[Name],\n\nJust a quarterly thank you for the partnership. Hope this helps make your week a little brighter.\n\n[Your Name]' }
    ];
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">12 TEMPLATES</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 text-xs">WRITE BY HAND</span>
      </div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Short, warm, memorable. Nice cards. The personal touch is everything.</p>
      <div class="space-y-3 mb-6 max-h-[50vh] overflow-y-auto pr-1">
        ${notes.map((n) => `
          <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
            <div class="font-semibold text-xs text-[#00A89D] mb-1">${esc(n.label)}</div>
            <pre class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">${esc(n.text)}</pre>
            <button type="button" data-copy-snippet="${esc(n.text)}" class="mt-2 text-[10px] px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold"><i class="fas fa-copy mr-1"></i>Copy note</button>
          </div>`).join('')}
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:popby-what-to-say" class="text-xs px-3 py-2 rounded-xl bg-[#002B5C] text-white font-semibold hover:bg-black transition">What to say aloud →</button>
        <button type="button" data-vault-bridge="modal:popby-psychology-timing" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Psychology & timing →</button>
      </div>
      ${footerActions('Copy Note Template Summary')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  function renderPopbyPsychology(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Pop-By Science');
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">WHY POP-BYS WORK</span></div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">The most effective pop-bys trigger specific psychological principles — not random generosity.</p>
      <div class="space-y-4 mb-6">
        <div class="rounded-2xl border-l-4 border-[#00A89D] bg-white dark:bg-gray-900 p-4">
          <div class="font-bold text-sm mb-1">Reciprocity Trigger</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Humans return favors. Thoughtful unexpected gifts create pleasant obligation. Give first — ask never (or very softly later).</div>
        </div>
        <div class="rounded-2xl border-l-4 border-[#F15A29] bg-white dark:bg-gray-900 p-4">
          <div class="font-bold text-sm mb-1">Peak-End Rule</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">People remember peak and end of experiences. Pop-bys during stressful times (listing launch, busy season) create disproportionately positive memories.</div>
        </div>
        <div class="rounded-2xl border-l-4 border-purple-500 bg-white dark:bg-gray-900 p-4">
          <div class="font-bold text-sm mb-1">Status & Thoughtfulness</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">High-quality useful gifts signal respect for their profession. Cheap logo junk does the opposite.</div>
        </div>
      </div>
      <div class="p-4 rounded-2xl bg-[#00A89D]/5 border border-[#00A89D]/20 mb-6">
        <div class="font-bold text-sm mb-2">Perfect timing windows</div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-gray-700 dark:text-gray-300">
          <div>• Monday mornings (fresh week energy)</div>
          <div>• Thursday afternoons (end-of-week appreciation)</div>
          <div>• Right after new listing</div>
          <div>• Day after big closing they referred</div>
          <div>• Random "just because" 2–3×/year</div>
        </div>
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:popby-seasonal-calendar" class="text-xs px-3 py-2 rounded-xl border border-[#00A89D] text-[#00A89D] font-semibold hover:bg-[#00A89D]/5 transition">Seasonal calendar →</button>
        <button type="button" data-vault-bridge="modal:popby-best-practices" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Best practices →</button>
      </div>
      ${footerActions('Copy Psychology Framework')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  // ─── 90-DAY NURTURE DRIP ───────────────────────────────────────────────
  function renderNurture90Day(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • New Client Drip Sequence');
    const touches = [
      { day: 'Day 3', channel: 'Text', script: 'Hey [Name], just checking in — how\'s the new place feeling? Any questions about the first payment or anything else? I\'m here.', tip: 'Send 2–3 days after closing — not same day as 7-day call.' },
      { day: 'Day 10', channel: 'Email', script: 'Hi [First Name],\n\nHope the first couple weeks in the new home have been smooth. If any questions about taxes, insurance, or maintenance pop up, I\'m still your person — no expiration date on that.\n\nWarmly,\n[Your Name]', tip: 'Soft review ask if experience was great.' },
      { day: 'Day 30', channel: 'Text', script: 'Hi [Name] — just checking in at the 30-day mark. How is everything feeling in the new house? Any questions on payment, taxes, or insurance?', tip: 'Use post-closing texts template for variations.' },
      { day: 'Day 60', channel: 'Text', script: 'Quick one — if you ever talk to friends or family about mortgages, I\'d love to help them the same way I helped you.', tip: 'Light referral ask — no pressure language.' },
      { day: 'Day 90', channel: 'Email + gift', script: 'Hi [First Name],\n\nThree months in — hope the house is starting to feel like home. I\'d love to do a quick 15-minute mortgage efficiency check-up around your one-year anniversary. I\'ll reach out then.\n\nWarmly,\n[Your Name]', tip: 'Include small useful resource or gift. Plants Annual Review.' }
    ];
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-600">PILLAR 6</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 text-xs">PLUG INTO CRM</span>
      </div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Structured touches in the first 90 days turn one-time clients into raving fans who refer for life.</p>
      <div class="space-y-4 mb-6">
        ${touches.map((t) => `
          <div class="rounded-2xl border border-blue-200 dark:border-blue-800 p-4">
            <div class="flex flex-wrap justify-between gap-2 mb-1">
              <div class="font-bold text-sm text-[#002B5C] dark:text-white">${esc(t.day)} <span class="text-blue-600 font-normal">· ${esc(t.channel)}</span></div>
            </div>
            <div class="text-sm italic text-gray-700 dark:text-gray-300 whitespace-pre-wrap">"${esc(t.script)}"</div>
            <div class="text-[10px] text-gray-500 mt-1">${esc(t.tip)}</div>
            <button type="button" data-copy-snippet="${esc(t.script)}" class="mt-2 text-[10px] px-3 py-1 rounded-xl border border-blue-500 text-blue-700 hover:bg-blue-500 hover:text-white font-semibold"><i class="fas fa-copy mr-1"></i>Copy</button>
          </div>`).join('')}
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:nurture-12month-calendar" class="text-xs px-3 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">Full 12-month calendar →</button>
        <button type="button" data-vault-bridge="modal:post-closing-texts" class="text-xs px-3 py-2 rounded-xl border border-blue-400 font-semibold hover:bg-blue-100 transition">Follow-up texts →</button>
      </div>
      ${footerActions('Copy 90-Day Drip Sequence')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  // ─── SEASONAL POP-BY CALENDAR ────────────────────────────────────────
  function renderPopbySeasonalCalendar(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Year-Round Pop-By Ideas');
    const months = [
      { m: 'January', theme: 'Fresh start', ideas: ['Goal notepad + nice pen ($5–10)', '2026 planner ($8–14)', '"Pop into the new year" treat ($8–15)'] },
      { m: 'February', theme: 'Warmth', ideas: ['Heart chocolate or small plant ($6–12)', '"Key to my success" keychain ($7–13)', 'Candle — "You light up the market" ($8–15)'] },
      { m: 'March', theme: 'Spring growth', ideas: ['Herb garden kit ($6–12)', 'Spring cleaning microfiber kit ($7–13)', '"Putting down roots" plant ($8–14)'] },
      { m: 'April', theme: 'Practical', ideas: ['Compact umbrella ($6–12)', '"Covered rain or shine" kit ($8–14)', 'Car freshener + fresh start note ($5–10)'] },
      { m: 'May', theme: 'Outdoor', ideas: ['Small bouquet or seeds ($6–12)', '"Watching your business grow" plant ($7–13)', 'Sunscreen / outdoor kit ($8–15)'] },
      { m: 'June', theme: 'Summer BBQ', ideas: ['Cold brew kit or tumbler ($8–14)', 'BBQ spatula — "Ready to flip" ($8–15)', 'Portable fan ($7–13)'] },
      { m: 'July', theme: 'Fun', ideas: ['Patriotic treat pack ($6–12)', '"You light the way" flashlight ($6–12)', 'Red/white/blue fun pack ($7–13)'] },
      { m: 'August', theme: 'Back to busy', ideas: ['Notebook/pen set ($6–12)', 'Team "first 100 days" kit ($8–15)', 'Water bottle ($8–14)'] },
      { m: 'September', theme: 'Fall planning', ideas: ['Fall planning notebook ($6–12)', 'Pumpkin spice candle ($7–14)', 'Pumpkin spice treat ($7–13)'] },
      { m: 'October', theme: 'Festive', ideas: ['Small pumpkin decor ($6–12)', 'Ice scraper + hand warmers ($7–13)', 'Halloween candy + clever note ($5–10)'] },
      { m: 'November', theme: 'Gratitude', ideas: ['Gratitude journal ($8–15)', 'Local honey — "You\'re the sweetest" ($8–15)', 'Thank-you plant ($7–14)'] },
      { m: 'December', theme: 'Holiday warmth', ideas: ['Premium hot cocoa kit ($10–18)', 'Ornament or small decor ($8–15)', 'Premium candle ($12–20 wow)'] }
    ];
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">12-MONTH PLANNER</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 text-xs">ROTATE LOW / MID / WOW</span>
      </div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Three strong options per month. Source in bulk on Amazon, Temu, or locally.</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 max-h-[55vh] overflow-y-auto pr-1">
        ${months.map((mo) => `
          <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
            <div class="font-bold text-sm text-[#002B5C] dark:text-white">${esc(mo.m)} <span class="text-gray-400 font-normal text-xs">· ${esc(mo.theme)}</span></div>
            <ul class="mt-1 text-xs space-y-0.5 text-gray-600 dark:text-gray-400">${mo.ideas.map((i) => `<li>• ${esc(i)}</li>`).join('')}</ul>
          </div>`).join('')}
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:popby-sourcing-budget" class="text-xs px-3 py-2 rounded-xl border border-[#00A89D] text-[#00A89D] font-semibold hover:bg-[#00A89D]/5 transition">Sourcing & budget →</button>
        <button type="button" data-vault-bridge="pillar:1" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Pop-by library →</button>
      </div>
      ${footerActions('Copy Seasonal Calendar')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  // ─── TOP PRODUCER HABITS ─────────────────────────────────────────────
  function renderTopProducerHabits(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Top 1% Operating System');
    const blocks = [
      { when: 'Every Monday', items: ['Pull birthday/anniversary list for next 7 days', 'Film 2–3 Reels for the week (batch)', 'Send 3–5 value touches to top partners'], color: 'border-[#00A89D]' },
      { when: 'Every Thursday', items: ['Run 7-day post-closing calls (Power Hour)', 'Drop 2–3 strategic pop-bys', 'Review referral sources from last 30 days'], color: 'border-[#F15A29]' },
      { when: 'Monthly', items: ['Send one high-quality client gift', 'Run 4–6 Annual Mortgage Review calls', 'Review content performance — double down on winners'], color: 'border-purple-400' },
      { when: 'Quarterly', items: ['Deep review of top 20 referral partners', 'Plan next quarter content themes', 'Handwritten notes to biggest referrers'], color: 'border-[#002B5C]/40' }
    ];
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-gray-800 text-white dark:bg-gray-700">ALL 6 PILLARS</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">REAL WEEKLY OS</span>
      </div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">What highest producers actually do — not talent, consistent execution of simple systems.</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        ${blocks.map((b) => `
          <div class="rounded-2xl border-l-4 ${b.color} border border-gray-200 dark:border-gray-700 p-4">
            <div class="font-bold text-sm text-[#002B5C] dark:text-white mb-2">${esc(b.when)}</div>
            <ul class="text-sm space-y-1">${b.items.map((i) => `<li class="flex gap-2"><span class="text-[#00A89D]">☐</span>${esc(i)}</li>`).join('')}</ul>
          </div>`).join('')}
      </div>
      <div class="p-5 rounded-2xl bg-gradient-to-r from-gray-900 to-black text-white text-sm mb-6">
        The difference between good and great is rarely talent. It's consistent execution across all six pillars.
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:value-vault-30day-activation" class="text-xs px-3 py-2 rounded-xl bg-[#F15A29] text-white font-semibold hover:bg-orange-600 transition">30-day activation →</button>
        <button type="button" data-vault-bridge="weekly" class="text-xs px-3 py-2 rounded-xl bg-[#002B5C] text-white font-semibold hover:bg-black transition">Weekly Win Plan →</button>
        <button type="button" data-vault-bridge="modal:referral-flywheel-system" class="text-xs px-3 py-2 rounded-xl border border-gray-400 font-semibold hover:bg-gray-100 transition">Flywheel →</button>
      </div>
      ${footerActions('Copy Top Producer Habits')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  // ─── BRAND POSITIONING ───────────────────────────────────────────────
  function renderContentBrandPositioning(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Personal Brand Strategy');
    const positions = [
      'The Local Market Expert', 'The First-Time Buyer Champion', 'The Rate & Strategy Educator',
      'The No-BS Truth Teller', 'The Client-For-Life Relationship Builder', 'The Tech-Savvy Modern Mortgage Pro'
    ];
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-600">BRAND STRATEGY</span></div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Become unmistakably you — the one people remember and recommend.</p>
      <div class="rounded-2xl border border-purple-200 p-5 mb-6">
        <div class="font-bold text-sm text-[#00A89D] mb-3">Step 1 — Pick ONE signature positioning</div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          ${positions.map((p) => `<div class="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">${esc(p)}</div>`).join('')}
        </div>
      </div>
      <div class="rounded-2xl border border-[#F15A29]/30 bg-[#F15A29]/5 p-5 mb-6">
        <div class="font-bold text-sm text-[#F15A29] mb-2">Step 2 — Your "Only I" statement</div>
        <div class="text-sm italic text-gray-700 dark:text-gray-300 mb-2">"I am the only loan officer in [your area] who _______________ while also _______________."</div>
        ${scriptCard('Example',
          'I am the only loan officer in the greater metro who explains every fee like I\'m talking to my mom, while also being brutally honest about when waiting makes sense.',
          'Fill in yours. Be specific — vague positioning is forgettable.')}
      </div>
      <div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
        <div class="font-bold text-sm mb-2">Step 3 — Visual + verbal signature</div>
        <ul class="text-sm space-y-1.5 text-gray-700 dark:text-gray-300">
          <li>• Consistent color palette and photo style across platforms</li>
          <li>• 2–3 signature phrases in almost every piece of content</li>
          <li>• One recurring format (e.g. "Myth vs Reality" every Tuesday)</li>
        </ul>
      </div>
      <div class="p-4 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-sm mb-6">
        <strong>Brutal truth:</strong> If someone can't describe what makes you different in one sentence after 5 pieces of content, your brand isn't working yet.
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:content-pillars" class="text-xs px-3 py-2 rounded-xl border border-purple-400 font-semibold hover:bg-purple-100 transition">Content pillars →</button>
        <button type="button" data-vault-bridge="social" class="text-xs px-3 py-2 rounded-xl bg-[#002B5C] text-white font-semibold hover:bg-black transition">Social Strategy →</button>
      </div>
      ${footerActions('Copy Brand Positioning Framework')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  function renderContentScriptExamples(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Ready-to-Film Scripts');
    const scripts = [
      { pillar: 'Pillar 1 · Local Market', script: 'In [neighborhood] right now, the average home is spending only 11 days on market — down from 19 last month. If you\'ve been thinking about selling, well-priced homes are moving fast. Want the full breakdown for your street? DM me.', color: 'text-[#00A89D]' },
      { pillar: 'Pillar 2 · First-Time Buyer', script: 'You do NOT need 20% down. I\'m helping buyers get in with as little as 3% — sometimes 0% with the right programs. The biggest myth keeping people renting is the huge down payment idea. Let\'s break the math on a $350k home.', color: 'text-[#F15A29]' },
      { pillar: 'Pillar 3 · Rate Reality', script: '6.8% feels scary until you realize waiting for 5% could cost you $50,000+ in higher home prices. I\'m not saying buy today no matter what — let\'s run your actual numbers both ways before you decide based on headlines.', color: 'text-amber-600' },
      { pillar: 'Pillar 4 · Client Wins', script: 'This couple came to me with a 612 credit score and thought they had no shot. 47 days later they closed on their first home with a 2-1 buydown. Stories like this are why I do what I do. If you\'re on the fence, reach out.', color: 'text-blue-600' },
      { pillar: 'Pillar 5 · Behind the Scenes', script: 'People ask what I actually do all day as a loan officer. Spoiler: it\'s not just pushing papers. Today I spent 3 hours on scenarios, 2 hours on partner calls, and 1 hour making sure a first-time buyer understood every fee before they signed. This is the job.', color: 'text-emerald-600' },
      { pillar: 'Pillar 6 · Myth Buster', script: 'Myth: you need perfect credit to buy a home. Reality: I closed someone with a 580 FHA last month. Myth: you need 20% down. Reality: 3.5% FHA, 0% VA. Stop letting myths keep you renting while prices climb.', color: 'text-rose-600' }
    ];
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-600">60-SEC REELS</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 text-xs">FILM TODAY</span>
      </div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Actual scripts by pillar — personalize with your market data and film on your phone.</p>
      <div class="space-y-4 mb-6">
        ${scripts.map((s) => `
          <div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
            <div class="font-bold text-xs ${s.color} mb-1">${esc(s.pillar)}</div>
            <div class="text-sm italic text-gray-700 dark:text-gray-300">"${esc(s.script)}"</div>
            <button type="button" data-copy-snippet="${esc(s.script)}" class="mt-2 text-[10px] px-3 py-1 rounded-xl border border-purple-500 text-purple-700 hover:bg-purple-500 hover:text-white font-semibold"><i class="fas fa-copy mr-1"></i>Copy script</button>
          </div>`).join('')}
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:reel-hook-formula" class="text-xs px-3 py-2 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition">Hook formulas →</button>
        <button type="button" data-vault-bridge="modal:content-repurposing" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">1-to-7 repurposing →</button>
      </div>
      ${footerActions('Copy All Script Examples')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  // ─── POP-BY FULL SCRIPT PACK + PARTNER FOLLOW-UPS ────────────────────
  function renderPopbyFullScriptPack(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Complete Pop-By Sequence');
    const steps = [
      { phase: '1. Drop-off (15–30 sec)', script: 'Hey [Name], I\'m [Your Name] with [Company]. I know you\'re busy — just wanted to drop this off and say thanks. No strings attached. Hope it makes your week better. My card\'s inside.', tip: 'Use situation-specific scripts from What to Say modal.' },
      { phase: '2. Same-day text (2–4 hrs later)', script: 'Hey [Name], just wanted to say thanks again for the quick chat earlier. Hope you enjoyed the [gift]. No need to reply — just wanted you to know I appreciate you.', tip: 'Reference the specific gift. No ask.' },
      { phase: '3. 1-week value follow-up', script: 'Hey [Name] — hope your week is going well. I put together a quick one-pager on rates and inventory in [their neighborhood]. Happy to email it over if useful. No strings.', tip: 'Attach real market data — this is value, not a pitch.' },
      { phase: '4. 30-day light touch', script: 'Random thought — if you ever have a client nervous about financing or wanting a second opinion, I\'m always happy to be a resource. Appreciate the partnership!', tip: 'Soft positioning as backup expert.' }
    ];
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">DROP → TEXT → VALUE → TOUCH</span></div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">The complete pop-by sequence — most LOs only do step 1 and wonder why it doesn't compound.</p>
      <div class="space-y-4 mb-6">
        ${steps.map((s) => scriptCard(s.phase, s.script, s.tip)).join('')}
      </div>
      <div class="p-4 rounded-2xl bg-[#00A89D]/5 border text-sm mb-6">
        <strong>CRM rule:</strong> Log every pop-by with date, gift, script used, and schedule steps 2–4 as tasks.
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:popby-what-to-say" class="text-xs px-3 py-2 rounded-xl bg-[#002B5C] text-white font-semibold hover:bg-black transition">Drop-off scripts →</button>
        <button type="button" data-vault-bridge="modal:popby-note-templates" class="text-xs px-3 py-2 rounded-xl border border-[#00A89D] text-[#00A89D] font-semibold hover:bg-[#00A89D]/5 transition">Note templates →</button>
      </div>
      ${footerActions('Copy Full Pop-By Sequence')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  function renderFollowupPopby(item, contentEl, modal) {
    renderPopbyFullScriptPack(item, contentEl, modal);
  }

  function renderFollowupQuickText(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Partner Quick Touch');
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-teal-500/10 text-teal-600">WITHIN 24–48 HRS</span></div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Fast, grateful, low-pressure — send after every successful closing or referral.</p>
      ${scriptCard('Quick text after closing/referral',
        'Hey [Name], just helped [Mutual Client] close smoothly — they loved working with you! Any buyers I can pre-approve this week?',
        'Short. Grateful. Ends with easy ask — not a demand.')}
      ${scriptCard('Video version (15 sec)',
        'Hey [Name] — quick update: [Client] just closed and had great things to say about you. Let me know if any of your buyers need scenarios this week. Appreciate you!',
        'Film in car after closing. Personal > polished.')}
      <div class="flex flex-wrap gap-2 mb-6 mt-4">
        <button type="button" data-vault-bridge="modal:popby-full-script-pack" class="text-xs px-3 py-2 rounded-xl border border-teal-500 font-semibold hover:bg-teal-100 transition">Full pop-by sequence →</button>
      </div>
      ${footerActions('Copy Quick Follow-Up')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  function renderFollowupValueEmail(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Partner Value Email');
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-600">WEEKLY VALUE DROP</span></div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Market update + soft ask — positions you as their financing intel source.</p>
      ${scriptCard('Subject line options',
        'This week\'s rate watch + new buyer checklist (co-brand ready)\n— OR —\nQuick market pulse for [their zip codes]',
        'Rotate subjects so it doesn\'t feel automated.')}
      ${scriptCard('Email body',
        'Hi [Name],\n\nSharing this week\'s rate watch + a new buyer checklist I put together. Happy to co-brand with your logo if you want to forward to your sphere.\n\nLet me know if any of your buyers need quick scenarios — I turn those around same day.\n\n[Your Name]',
        'Attach 1-page PDF. Co-brand option is the unlock.')}
      <div class="flex flex-wrap gap-2 mb-6 mt-4">
        <button type="button" data-vault-bridge="play:weekly-value-cadence" class="text-xs px-3 py-2 rounded-xl border border-indigo-400 font-semibold hover:bg-indigo-100 transition">Weekly cadence play →</button>
      </div>
      ${footerActions('Copy Value Email Template')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  function renderFollowupPhoneCheckin(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Quarterly Partner Call');
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-600">TOP 10–15 PARTNERS · QUARTERLY</span></div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Relationship maintenance — ask about their challenges, not just your business.</p>
      ${scriptCard('Opening',
        'How\'s business treating you? Anything I can do to support your listings this month?',
        'Listen 80%. Take notes. Reference something specific next touch.')}
      ${scriptCard('Deepening question',
        'What\'s the biggest friction you\'re seeing with buyers right now — rates, inventory, or something else?',
        'Their answer tells you what content and scenarios to prepare.')}
      ${scriptCard('Closing',
        'Really appreciate the partnership. I\'ll send over [specific resource] this week that might help with what you mentioned.',
        'Always end with a value promise you actually deliver within 48 hours.')}
      <div class="flex flex-wrap gap-2 mb-6 mt-4">
        <button type="button" data-vault-bridge="play:relationship-management" class="text-xs px-3 py-2 rounded-xl border border-[#00A89D] text-[#00A89D] font-semibold hover:bg-[#00A89D]/5 transition">Relationship habits →</button>
      </div>
      ${footerActions('Copy Phone Check-In Script')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  function renderRealtorOpenHouseKit(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Open House Support Kit');
    const items = ['Pre-approval station signage', 'Financing one-pagers (rate buydown, FHA, VA)', 'Sign-in sheets with subtle branding', 'Snacks + water + mints', 'Scenario cheat sheet for on-site questions', 'Business cards in a nice holder'];
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#F15A29]/10 text-[#F15A29]">PARTNER TOOL</span></div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Show up early, set up the table, stay 20–30 min, then leave. You become the helpful expert — not a salesperson.</p>
      <div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
        <div class="font-bold text-sm mb-3">Bring this kit</div>
        <ul class="text-sm space-y-1.5">${items.map((i) => `<li class="flex gap-2"><span class="text-[#00A89D]">☐</span>${esc(i)}</li>`).join('')}</ul>
      </div>
      ${scriptCard('Agent offer text (before open house)',
        'Happy to set up a pre-approval station at your open house Saturday — I\'ll bring materials and run quick scenarios for serious buyers. No cost, no catch. Want me there?',
        'Send 3–5 days before. Most agents say yes.')}
      <div class="flex flex-wrap gap-2 mb-6 mt-4">
        <button type="button" data-vault-bridge="play:open-house-domination" class="text-xs px-3 py-2 rounded-xl bg-[#F15A29] text-white font-semibold hover:bg-orange-600 transition">Open house play →</button>
        <button type="button" data-vault-bridge="modal:popby-open-house-kit" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Pop-by kit idea →</button>
      </div>
      ${footerActions('Copy Open House Kit Checklist')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  function renderRealtorWeeklySnapshots(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Weekly Market Touch');
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-600">EVERY MONDAY</span></div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Low-effort, high-value — 3 bullets + one chart. Becomes their go-to financing intel.</p>
      <div class="rounded-2xl border border-blue-200 bg-blue-50/50 dark:bg-blue-900/20 p-5 mb-6 text-sm">
        <div class="font-bold mb-2">Email structure</div>
        <div><strong>Subject:</strong> This week in [area] — quick read (2 min)</div>
        <ul class="mt-2 space-y-1">
          <li>• Bullet 1: Rate movement + what it means for buyers</li>
          <li>• Bullet 2: Inventory / days on market in their zip</li>
          <li>• Bullet 3: One program or tip they can forward</li>
          <li>• Chart: simple rate trend or median price graphic</li>
        </ul>
        <div class="mt-2 italic">Close: "Happy to hop on a 5-min call if any of your buyers need scenarios."</div>
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="play:weekly-value-cadence" class="text-xs px-3 py-2 rounded-xl border border-blue-400 font-semibold hover:bg-blue-100 transition">Weekly cadence →</button>
        <button type="button" data-vault-bridge="modal:followup-value-email" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Email template →</button>
      </div>
      ${footerActions('Copy Snapshot Format')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  // ─── GIFT FRAMEWORKS ───────────────────────────────────────────────────
  function renderClientGiftBudget(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Gift Budget System');
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#F15A29]/10 text-[#F15A29]">PILLAR 2</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">4-TOUCH CADENCE</span>
      </div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Spend wisely, stay top-of-mind for years — not one big gift then silence.</p>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 text-sm">
        <div class="p-4 rounded-xl border bg-gray-50 dark:bg-gray-800"><strong>Standard</strong><br>$35–60 total across 2 years</div>
        <div class="p-4 rounded-xl border bg-gray-50 dark:bg-gray-800"><strong>Top 20%</strong><br>$80–120 (extra at 6 & 12 mo)</div>
        <div class="p-4 rounded-xl border bg-gray-50 dark:bg-gray-800"><strong>VIP referrers</strong><br>$150–200 + experiences</div>
      </div>
      <div class="space-y-3 mb-6">
        ${[
          { t: 'Touch 1 — Closing (Day 0–3)', d: '$25–50 premium item: knife, map, mat, tumbler. Your wow moment.', c: 'border-[#F15A29]' },
          { t: 'Touch 2 — 6 Months', d: '$10–20 living/daily item: plant, book, hand cream, coffee card.', c: 'border-[#00A89D]' },
          { t: 'Touch 3 — 12-Month Anniversary', d: '$20–40: experience card, upgraded item, premium keepsake.', c: 'border-[#F15A29]' },
          { t: 'Touch 4 — 18–24 Months (optional)', d: 'Small surprise or experience — best clients and referral machines only.', c: 'border-[#00A89D]' }
        ].map((x) => `
          <div class="rounded-xl border-l-4 ${x.c} border border-gray-200 p-4">
            <div class="font-bold text-sm">${esc(x.t)}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">${esc(x.d)}</div>
          </div>`).join('')}
      </div>
      <div class="p-4 rounded-2xl bg-[#00A89D]/5 text-sm mb-6">
        <strong>Sourcing:</strong> Amazon for staples · Etsy for engraved · Local for chocolate/honey/experiences · Keep a 5–6 item gift closet
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:gift-cadence-system" class="text-xs px-3 py-2 rounded-xl bg-[#F15A29] text-white font-semibold hover:bg-orange-600 transition">Gift cadence →</button>
        <button type="button" data-vault-bridge="modal:gift-sourcing-system" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Sourcing system →</button>
      </div>
      ${footerActions('Copy Gift Budget Framework')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  function renderClientGiftRetentionLink(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Gifts + Retention Engine');
    const touches = [
      { when: 'Day 7 Post-Closing Call', action: 'Mention a small thank-you gift is coming in the mail — builds anticipation', bridge: 'modal:post-closing-7day' },
      { when: '30–60 Days', action: 'Small useful gift (coffee card, plant, tote) + handwritten note', bridge: 'modal:gift-coffee-card' },
      { when: '6-Month Anniversary', action: 'Living/daily item (book, water bottle, hand cream) + reference their home', bridge: 'modal:gift-plant' },
      { when: '12-Month Anniversary', action: 'Premium item (Yeti, journal, experience) — big emotional moment', bridge: 'modal:gift-yeti-tumbler' },
      { when: 'Birthdays + Future Anniversaries', action: 'Rotate low-cost thoughtful items so you\'re never silent', bridge: 'modal:client-anniversary-system' }
    ];
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#F15A29]/10 text-[#F15A29]">INTEGRATED SYSTEM</span></div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Sophisticated LOs tie gifts deliberately into 7-Day, Anniversary, and Birthday systems.</p>
      <div class="space-y-3 mb-6">
        ${touches.map((t) => `
          <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-wrap justify-between gap-2">
            <div>
              <div class="font-bold text-sm text-[#002B5C] dark:text-white">${esc(t.when)}</div>
              <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">${esc(t.action)}</div>
            </div>
            <button type="button" data-vault-bridge="${t.bridge}" class="text-[10px] px-2 py-1 rounded-lg border font-semibold shrink-0 self-center">Open →</button>
          </div>`).join('')}
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:client-gift-budget-timing" class="text-xs px-3 py-2 rounded-xl border border-[#F15A29] font-semibold hover:bg-[#F15A29]/5 transition">Budget framework →</button>
        <button type="button" data-vault-bridge="modal:gift-note-examples" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Gift notes →</button>
      </div>
      ${footerActions('Copy Retention + Gift System')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  function renderGiftSourcingSystem(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Gift Closet System');
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">REMOVE FRICTION</span></div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Always have the right gift ready — no last-minute Amazon panic.</p>
      <div class="space-y-4 mb-6">
        <div class="rounded-2xl border border-[#00A89D]/30 bg-[#00A89D]/5 p-4">
          <div class="font-bold text-sm mb-2"><i class="fas fa-box mr-1"></i> Gift closet (6–8 go-to items)</div>
          <div class="text-sm text-gray-700 dark:text-gray-300">Totes, coffee cards, plants, journals, tumblers, chocolate — send same-day or next-day without ordering.</div>
        </div>
        <div class="rounded-2xl border border-gray-200 p-4">
          <div class="font-bold text-sm mb-2"><i class="fas fa-bookmark mr-1"></i> Trusted vendors bookmarked</div>
          <div class="text-sm text-gray-700 dark:text-gray-300">Etsy for engraved (boards, journals, coasters) · Local for experiences · Amazon for bulk staples</div>
        </div>
        <div class="rounded-2xl border border-gray-200 p-4">
          <div class="font-bold text-sm mb-2"><i class="fas fa-sync mr-1"></i> Quarterly batch order</div>
          <div class="text-sm text-gray-700 dark:text-gray-300">Every 3 months reorder your top 3–4 items. Never caught empty-handed during busy closing weeks.</div>
        </div>
        <div class="rounded-2xl border border-gray-200 p-4">
          <div class="font-bold text-sm mb-2"><i class="fas fa-database mr-1"></i> CRM log every gift</div>
          <div class="text-sm text-gray-700 dark:text-gray-300">Date + item + why + personal detail used. Never repeat too closely.</div>
        </div>
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:client-gift-budget-timing" class="text-xs px-3 py-2 rounded-xl border border-[#F15A29] font-semibold hover:bg-[#F15A29]/5 transition">Budget cadence →</button>
        <button type="button" data-vault-bridge="pillar:2" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Gift library →</button>
      </div>
      ${footerActions('Copy Sourcing System')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  function renderGiftNoteExamples(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Gift Note Mastery');
    const notes = [
      { label: 'Closing day gift', text: '[First Name],\n\nI still remember you saying how much you loved the big windows in the living room. I hope this [gift] helps you enjoy that view for years. Thank you for letting me be part of this chapter. You\'ve got a beautiful home — and an even better story.\n\nWelcome home,\n[Your Name]' },
      { label: '1-year anniversary gift', text: '[First Name],\n\nOne year ago today we made this house yours. I hope it\'s been everything you dreamed and more. Here\'s a little something to celebrate the memories you\'ve already made — and the ones still to come. You know where I am if you ever need anything.\n\nWith gratitude,\n[Your Name]' },
      { label: '6-month surprise', text: '[First Name],\n\nCan\'t believe it\'s been 6 months already. Saw this and thought of your new kitchen setup. Hope it makes life in the home even better.\n\n[Your Name]' },
      { label: 'Hobby-specific (from 7-day notes)', text: '[First Name],\n\nYou mentioned [hobby/kids\' activity/new project] during our call — this felt perfect for you. Grateful we got to help you into the home.\n\n[Your Name]' }
    ];
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#F15A29]/10 text-[#F15A29]">50% GIFT · 50% NOTE</span>
      </div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">The note makes the gift 10× more powerful. Reference something they said during the process.</p>
      <div class="space-y-4 mb-6">
        ${notes.map((n) => `
          <div class="rounded-xl border-l-4 border-[#F15A29] border border-gray-200 p-4">
            <div class="font-semibold text-xs text-[#F15A29] mb-1">${esc(n.label)}</div>
            <pre class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">${esc(n.text)}</pre>
            <button type="button" data-copy-snippet="${esc(n.text)}" class="mt-2 text-[10px] px-3 py-1 rounded-xl border border-[#F15A29] text-[#F15A29] hover:bg-[#F15A29] hover:text-white font-semibold"><i class="fas fa-copy mr-1"></i>Copy note</button>
          </div>`).join('')}
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:giftology-mindset" class="text-xs px-3 py-2 rounded-xl border border-[#F15A29] font-semibold hover:bg-[#F15A29]/5 transition">Giftology →</button>
      </div>
      ${footerActions('Copy Gift Note Examples')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  // ─── ADDITIONAL PREMIUM GIFT GUIDES ────────────────────────────────────
  function renderGiftLeatherJournal(item, contentEl, modal) {
    renderPremiumGift(item, contentEl, modal, { badge: 'TIMELESS', whyWorks: ['Feels substantial and personal', 'Engraving makes it irreplaceable', 'Used for years — notes, schedules, journaling', 'Pairs beautifully with a nice pen'], timing: 'Closing gift or 6-month touch for clients who journal or write.', proUpgrade: 'Engrave new address or "The [Last Name] Home" on cover.', noteScript: 'For all the plans, memories, and lists that come with a new chapter. Welcome home.', copyLabel: 'Copy Journal Gift Guide' });
  }
  function renderGiftCuttingBoard(item, contentEl, modal) {
    renderPremiumGift(item, contentEl, modal, { badge: 'LUXURY DAILY USE', whyWorks: ['Substantial, beautiful, extremely personal', 'Most people would never buy for themselves', 'Lives on counter — used every day', 'Giftology-aligned premium kitchen item'], timing: 'Closing gift for clients who love cooking/entertaining.', proUpgrade: 'Thick wood, engraved address or family name. Etsy or local woodworker.', noteScript: 'May your kitchen be the heart of the home — and this board see many great meals.', copyLabel: 'Copy Cutting Board Guide' });
  }
  function renderGiftExperience(item, contentEl, modal) {
    renderPremiumGift(item, contentEl, modal, { badge: 'MEMORY > OBJECT', whyWorks: ['Creates emotional memories lasting years', 'Every retelling = they think of you', 'Highest wow factor without huge spend', 'Perfect for couples and VIP clients'], timing: '6–12 month touch for best clients, or closing gift for first-time buyer couples.', proUpgrade: 'Dinner for two, golf round, spa day, cooking class — match their interests from loan notes.', noteScript: 'Instead of another thing for the house — an experience to celebrate this chapter. Enjoy!', copyLabel: 'Copy Experience Gift Guide' });
  }
  function renderGiftSubscription(item, contentEl, modal) {
    renderPremiumGift(item, contentEl, modal, { badge: 'MONTHLY PRESENCE', whyWorks: ['Something from you every month', 'Stays top-of-mind long after closing', 'Low effort after setup', 'Coffee, wine, books, or snack boxes all work'], timing: 'Pay for first 3–6 months. Best as 6-month or anniversary surprise.', proUpgrade: 'Match their habit — coffee lovers get coffee club, readers get book box.', noteScript: 'A little something arriving each month to remind you we\'re still here for anything mortgage-related.', copyLabel: 'Copy Subscription Gift Guide' });
  }
  function renderGiftCoasterSet(item, contentEl, modal) {
    renderPremiumGift(item, contentEl, modal, { badge: 'DAILY LIVING ROOM', whyWorks: ['Used multiple times daily', 'Visible in main living areas', 'Feels expensive under $50', 'Engraving adds personal permanence'], timing: 'Closing or 6-month touch. Marble, wood, or leather sets.', proUpgrade: '4–6 coasters engraved with address or family name.', noteScript: 'For all the coffees, dinners, and conversations that make a house a home.', copyLabel: 'Copy Coaster Set Guide' });
  }
  function renderGiftHousePortrait(item, contentEl, modal) {
    renderPremiumGift(item, contentEl, modal, { badge: 'MAX EMOTIONAL IMPACT', whyWorks: ['Not something they\'d buy themselves', 'Captures "we bought our home" emotion', 'Usually framed in prominent place', 'Extremely high perceived value'], timing: 'Closing gift or 1-year anniversary. Commission from listing/closing photo.', proUpgrade: 'Watercolor or illustrated style from Etsy artist. Allow 2–3 week lead time.', noteScript: 'Your home has a story — glad we got to be part of it. Hope this hangs somewhere special.', copyLabel: 'Copy House Portrait Guide' });
  }
  function renderGiftPlant(item, contentEl, modal) {
    renderPremiumGift(item, contentEl, modal, { badge: 'LIVING REMINDER', whyWorks: ['Grows with them — literal living reminder', 'Perfect 6–12 month touch', 'Low cost, high warmth', 'Succulents need almost no maintenance'], timing: '6-month anniversary or housewarming follow-up.', proUpgrade: 'Nice pot + "Putting down roots" note. Avoid high-maintenance plants.', noteScript: 'Like your new home — may this keep growing with you. Thinking of you!', copyLabel: 'Copy Plant Gift Guide' });
  }
  function renderGiftChocolate(item, contentEl, modal) {
    renderPremiumGift(item, contentEl, modal, { badge: 'UNIVERSAL WOW', whyWorks: ['Universally appreciated', 'High perceived value at $12–25', 'Great for partners AND clients', 'Local/gourmet beats drugstore'], timing: 'Pop-by add-on, closing gift supplement, or seasonal touch.', proUpgrade: 'Local chocolatier or gourmet brand — never generic bulk.', noteScript: 'A small sweet to celebrate — you deserve it.', copyLabel: 'Copy Chocolate Gift Guide' });
  }
  function renderGiftCoffeeCard(item, contentEl, modal) {
    renderPremiumGift(item, contentEl, modal, { badge: 'SAFE · HIGH ROI', whyWorks: ['Universal — almost every adult drinks coffee', 'Feels personal when you name their favorite spot', 'Low cost, zero risk', 'Perfect 30–60 day or 6-month touch'], timing: '30–60 days post-close or pop-by add-on. Reference their specific café if known.', proUpgrade: '$15–20 to their actual favorite local spot — not just Starbucks unless that\'s their place.', noteScript: 'Hope your next [coffee/drink] is on us — and the home is treating you well!', copyLabel: 'Copy Coffee Card Guide' });
  }

  function renderGiftToteBag(item, contentEl, modal) {
    renderPremiumGift(item, contentEl, modal, { badge: 'VISIBLE DAILY', whyWorks: ['Used for groceries, moving boxes, and errands', 'Whole family sees it — constant subtle reminder', 'Eco-friendly feels thoughtful, not cheap', 'Great for 30–60 day or 6-month touch'], timing: '30–60 days post-close or housewarming follow-up. Pairs well with a plant or coffee card.', proUpgrade: 'Heavy canvas, neutral color, subtle engraving of new address on strap tag.', noteScript: 'For all the errands, adventures, and everyday moments that make a house a home.', copyLabel: 'Copy Tote Bag Guide' });
  }
  function renderGiftWaterBottle(item, contentEl, modal) {
    renderPremiumGift(item, contentEl, modal, { badge: 'DAILY DRIVER', whyWorks: ['Commute, gym, kids\' sports — used constantly', 'High perceived value at mid price point', 'Works for active families and busy professionals', 'Engraving makes it feel custom'], timing: '6-month touch or closing supplement for active clients.', proUpgrade: 'Insulated 20–32oz, engrave first name only — never big logo on front.', noteScript: 'Hope you stay hydrated and the new routine is treating you well!', extraBridge: 'modal:gift-yeti-tumbler', extraBridgeLabel: 'Premium tumbler option →', copyLabel: 'Copy Water Bottle Guide' });
  }
  function renderGiftHandCream(item, contentEl, modal) {
    renderPremiumGift(item, contentEl, modal, { badge: 'LUXURY SURPRISE', whyWorks: ['Feels slightly indulgent without being flashy', 'Perfect "just because" 6+ month touch', 'Low cost, high warmth — especially for women clients', 'Shows you think about them as a person'], timing: '6–12 month anniversary or birthday. Not a closing gift — save for surprise timing.', proUpgrade: 'Premium brand in a nice set (hand cream + lip balm). Local boutique beats drugstore.', noteScript: 'A small luxury for you — you deserve it after everything that went into this move.', copyLabel: 'Copy Hand Cream Guide' });
  }
  function renderGiftDeskFan(item, contentEl, modal) {
    renderPremiumGift(item, contentEl, modal, { badge: 'FUN + PRACTICAL', whyWorks: ['Makes people smile immediately', 'Genuinely useful for home offices and summer', 'Memorable without being expensive', 'Great for clients with WFH setups'], timing: '6-month touch or summer seasonal surprise.', proUpgrade: 'Quiet USB desk fan — quality matters. Pair with a light handwritten pun if you want.', noteScript: 'Hope this keeps you cool — in every sense — in the new home!', copyLabel: 'Copy Desk Fan Guide' });
  }
  function renderGiftPenSet(item, contentEl, modal) {
    renderPremiumGift(item, contentEl, modal, { badge: 'PROFESSIONAL DAILY', whyWorks: ['Used for signing, notes, and planning', 'Feels substantial vs cheap promo pens', 'Pairs beautifully with a leather journal', 'Works for business-owner clients too'], timing: 'Closing gift supplement or 6-month touch for clients who journal or run a business from home.', proUpgrade: 'Metal or gel pen set in a small gift box. Engrave initials if budget allows.', noteScript: 'For all the signatures, lists, and plans that come with this new chapter.', copyLabel: 'Copy Pen Set Guide' });
  }
  function renderGiftDeskOrganizer(item, contentEl, modal) {
    renderPremiumGift(item, contentEl, modal, { badge: 'HIGHEST ROI PRACTICAL', whyWorks: ['Solves real chaos in cars, garages, and desks', 'Used weekly — not forgotten in a drawer', 'Especially powerful for busy families and realtors', 'Feels like you understand their actual life'], timing: '6-month touch or closing gift for clients with kids, long commutes, or home offices.', proUpgrade: 'Collapsible trunk organizer or premium desk caddy. Avoid flimsy plastic.', noteScript: 'A little organization for the beautiful chaos of life in your new home.', copyLabel: 'Copy Organizer Gift Guide' });
  }

  // ─── PARTNER TOOLS ───────────────────────────────────────────────────
  function renderFrameworkPopbySourcing(item, contentEl, modal) {
    renderPopbySourcing(item, contentEl, modal);
  }

  function renderRealtorCobrandedFlyers(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Co-Marketing Toolkit');
    const assets = [
      { name: 'Open house financing station', desc: 'Pre-approval signage + rate snapshot one-pager + QR to your application', tip: 'Agent\'s brand dominates the front. Your logo on back or footer only.' },
      { name: '2-1 buydown explainer', desc: 'Visual one-pager showing payment savings — agents forward to nervous buyers', tip: 'Update monthly with current buydown math for your market.' },
      { name: 'First-time buyer checklist', desc: 'Documents, timeline, programs — co-brand ready PDF', tip: 'Offer to customize with agent headshot. They will use this constantly.' },
      { name: 'Weekly rate watch flyer', desc: '3 bullets + simple chart — designed to be forwarded', tip: 'Pair with Monday email cadence. Same content, print + digital.' }
    ];
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#F15A29]/10 text-[#F15A29]">PARTNER TOOL</span></div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Ready-made assets agents actually use — you do the heavy lifting, they get the credit on the front.</p>
      <div class="space-y-3 mb-6">
        ${assets.map((a) => `
          <div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
            <div class="font-bold text-sm text-[#002B5C] dark:text-white">${esc(a.name)}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">${esc(a.desc)}</div>
            <div class="text-[10px] text-[#00A89D] mt-1">${esc(a.tip)}</div>
          </div>`).join('')}
      </div>
      <div class="p-4 rounded-2xl bg-[#F15A29]/5 border text-sm mb-6">
        <strong>Golden rule:</strong> Ruoff Marketing Portal or Canva templates. Agent logo/name on front. Your contact on back. Never dominate their brand.
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="play:co-marketing-assets" class="text-xs px-3 py-2 rounded-xl bg-[#F15A29] text-white font-semibold hover:bg-orange-600 transition">Co-marketing play →</button>
        <button type="button" data-vault-bridge="modal:realtor-open-house-kit" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Open house kit →</button>
        <button type="button" data-vault-bridge="modal:email-weekly-partner" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Weekly email →</button>
      </div>
      ${footerActions('Copy Co-Branded Flyer Ideas')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  function renderRealtorJointValueAdds(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Joint Events Playbook');
    const events = [
      { title: 'First-Time Buyer Seminar', format: 'In-person or Zoom · 45 min', you: 'Present rates, programs, affordability myths', them: 'Invite sphere + provide venue', script: 'Happy to run the content if you invite your database — I\'ll make it zero sales pitch, pure education.' },
      { title: 'Lunch & Learn (Brokerage)', format: '30 min during office meeting', you: 'Market update + 2 buyer scenarios', them: 'Books the room and introduces you', script: 'I can do a tight 20-minute market reality check for your agents — no pitch, just useful intel they can use today.' },
      { title: 'Co-Hosted Webinar', format: 'Virtual · 30–40 min', you: 'Slides, Q&A, follow-up scenarios', them: 'Promotes to email list + social', script: 'Let\'s co-host a "What $X buys right now" session — I\'ll build the deck, you invite, we both win.' },
      { title: 'Open House Financing Table', format: 'On-site · 2 hours', you: 'Pre-approval station + scenario cheat sheet', them: 'Hosts the open house', script: 'Happy to set up a financing table at your Saturday open house — materials, scenarios, zero cost to you.' }
    ];
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-600">HIGH-IMPACT PARTNERSHIP</span></div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">You do the heavy lifting on content; they invite their sphere. Everyone wins — and you become indispensable.</p>
      <div class="space-y-4 mb-6">
        ${events.map((e) => `
          <div class="rounded-2xl border-l-4 border-indigo-400 border border-gray-200 dark:border-gray-700 p-4">
            <div class="flex flex-wrap justify-between gap-2 mb-1">
              <div class="font-bold text-sm text-[#002B5C] dark:text-white">${esc(e.title)}</div>
              <div class="text-[10px] text-indigo-600 font-semibold">${esc(e.format)}</div>
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400"><strong>You:</strong> ${esc(e.you)}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-0.5"><strong>Them:</strong> ${esc(e.them)}</div>
            <div class="mt-2 text-sm italic">"${esc(e.script)}"</div>
            <button type="button" data-copy-snippet="${esc(e.script)}" class="mt-2 text-[10px] px-3 py-1 rounded-xl border border-indigo-400 text-indigo-700 hover:bg-indigo-500 hover:text-white font-semibold"><i class="fas fa-copy mr-1"></i>Copy pitch</button>
          </div>`).join('')}
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="play:open-house-domination" class="text-xs px-3 py-2 rounded-xl border border-[#F15A29] font-semibold hover:bg-[#F15A29]/5 transition">Open house play →</button>
        <button type="button" data-vault-bridge="modal:realtor-cobranded-flyers" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Co-branded assets →</button>
      </div>
      ${footerActions('Copy Joint Event Ideas')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  // ─── EMAIL & NURTURE TEMPLATES ─────────────────────────────────────────
  function emailCard(label, subject, body, tip) {
    return `
      <div class="rounded-2xl border border-blue-200 dark:border-blue-800 p-4 mb-4">
        <div class="font-semibold text-sm text-[#002B5C] dark:text-white mb-1">${esc(label)}</div>
        ${subject ? `<div class="text-xs text-gray-500 mb-2"><strong>Subject:</strong> ${esc(subject)}</div>` : ''}
        <pre class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">${esc(body)}</pre>
        ${tip ? `<div class="mt-2 text-[10px] text-gray-500">${esc(tip)}</div>` : ''}
        <button type="button" data-copy-snippet="${esc(body)}" class="mt-2 text-[10px] px-3 py-1 rounded-xl border border-blue-500 text-blue-700 hover:bg-blue-500 hover:text-white font-semibold"><i class="fas fa-copy mr-1"></i>Copy email</button>
      </div>`;
  }

  function renderEmailWeeklyPartner(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Weekly Partner Email');
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-600">EVERY MONDAY</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 text-xs">UNDER 80 WORDS</span>
      </div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-4">Short, useful, zero pressure — the email realtors actually forward.</p>
      <ul class="text-sm space-y-1 mb-6 text-gray-700 dark:text-gray-300">
        <li>• Send Monday/Tuesday — consistency builds trust</li>
        <li>• Hyper-local bullets beat generic rate talk</li>
        <li>• Always offer co-brand — removes sales feel</li>
        <li>• End with "No strings" — never a hard CTA</li>
      </ul>
      ${emailCard('Market snapshot + tool offer',
        'Quick read for your buyers this week',
        'Hi [Realtor First Name],\n\nQuick one for you this week:\n• Median days on market in [neighborhood] just dropped to 11.\n• 3 new listings under $425k hit the market yesterday that actually show well.\n• I put together a simple one-page "What $X Buys Right Now" for your first-time buyers — happy to co-brand it for you.\n\nLet me know if you want it. No strings.\n\nBest,\n[Your Name]',
        'Most forwarded format — pair with pop-by every 4–6 weeks.')}
      ${emailCard('Inventory update + buyer resource', null,
        'Hi [Realtor First Name],\n\nQuick update:\n• Inventory in our primary zip codes is still under 2 months.\n• I created a simple 1-page "First-Time Buyer Checklist" (rates, programs, timeline) — happy to co-brand with your logo and drop it by or email it.\n\nLet me know if it would be useful for your sphere. No strings.\n\nBest,\n[Your Name]')}
      ${emailCard('Rate watch + soft offer', null,
        'Hi [Realtor First Name],\n\nRates moved a bit this week (currently 6.65% on a 30-yr conventional for strong files). I put together a super simple "Rate Watch" one-pager with current buydown options and when a refi might make sense.\n\nHappy to email or drop it off — no strings at all.\n\nBest,\n[Your Name]')}
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:realtor-weekly-snapshots" class="text-xs px-3 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">Snapshot format →</button>
        <button type="button" data-vault-bridge="play:weekly-value-cadence" class="text-xs px-3 py-2 rounded-xl border border-blue-400 font-semibold hover:bg-blue-100 transition">Weekly cadence play →</button>
      </div>
      ${footerActions('Copy Weekly Partner Email')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  function renderEmailMonthlyPartner(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Monthly Market Email');
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-600">FORWARDABLE</span></div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Clean, no-hype — designed for agents to forward to their entire sphere.</p>
      ${emailCard('Monthly snapshot (main template)',
        '[Your City] Market Update – [Month] [Year] (Great for Your Clients)',
        'Hi [Name],\n\nHere\'s the clean, no-hype version of what\'s actually happening in our market this month. Feel free to forward this directly to your sphere or use any piece of it.\n\nKey Numbers This Month:\n• Median price: $412,500 (up 3.2% YoY)\n• Days on market: 14 (down from 19 last month)\n• Inventory: 2.1 months (still very low)\n\nWhat I\'m Telling Buyers Right Now:\n• [Bullet 1 — local reality]\n• [Bullet 2 — program or strategy]\n• [Bullet 3 — when waiting costs money]\n\nIf any of your clients want the full neighborhood-by-neighborhood breakdown, just have them text me. Happy to help.\n\nThanks for everything you do.\n[Your Name]',
        'Update numbers monthly. Agents love sharing these — you become their market expert.')}
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:email-weekly-partner" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Weekly version →</button>
      </div>
      ${footerActions('Copy Monthly Snapshot Email')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  function renderEmailPostClosing(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Post-Closing Thank You');
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-600">WITHIN 48 HRS</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">REVIEW ASK</span>
      </div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-4">Highest-response post-close email — pair with a same-day review link text.</p>
      ${emailCard('Warm + review ask',
        'Congratulations Again on Your New Home, [First Name]!',
        'Hi [First Name],\n\nI just wanted to say congratulations again on getting into your new home. It was genuinely a pleasure working with you.\n\nIf anything comes up — questions about taxes, insurance, maintenance, whatever — I\'m still your person. You don\'t need a "reason" to reach out.\n\nAlso, if you have 20 seconds, I would be incredibly grateful if you left a quick Google review. It helps me help more families like yours. Here\'s the link: [your link]\n\nNo pressure at all. Just know I\'m rooting for you in the new house.\n\nWarmly,\n[Your Name]',
        'Personalize with one detail from the loan process. Send review link via text same day.')}
      ${emailCard('Personalized detail version', null,
        'Hi [First Name],\n\nCongratulations again! I still remember how excited you were about [specific detail — kitchen, yard, school district]. Hope you\'re already making great memories there.\n\nI\'m still your person for anything mortgage-related — no expiration date.\n\nIf you have 20 seconds, a Google review would mean the world: [your link]\n\nRooting for you,\n[Your Name]')}
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:post-closing-texts" class="text-xs px-3 py-2 rounded-xl border border-blue-400 font-semibold hover:bg-blue-100 transition">Follow-up texts →</button>
        <button type="button" data-vault-bridge="modal:post-closing-7day" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">7-day call →</button>
      </div>
      ${footerActions('Copy Post-Closing Email')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  function renderEmail306090(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • 30/60/90 Nurture Sequence');
    const touches = [
      { day: 'Day 30', channel: 'Email', subject: 'How\'s the new place treating you?', body: 'Hi [First Name],\n\nJust checking in at the 30-day mark — how is everything feeling in the new house? Any questions about the first payment, taxes, or insurance?\n\nI\'m still here if anything pops up.\n\n[Your Name]', tip: 'Ask one specific question from the 7-day call notes.' },
      { day: 'Day 60', channel: 'Text', subject: null, body: 'Hey [Name] — quick one. Any chance you\'ve told anyone you know about the experience of working with me? I\'m trying to help a few more families this month and your referral would mean a lot.', tip: 'Light ask — no pressure language.' },
      { day: 'Day 90', channel: 'Email + gift', subject: 'One quick favor + a small thank-you', body: 'Hi [First Name],\n\nThree months in — hope the house is starting to feel like home. I\'d love to do a quick 15-minute mortgage efficiency check-up around your one-year anniversary. I\'ll reach out then.\n\nWarmly,\n[Your Name]', tip: 'Include small useful gift. Plants Annual Review invite.' }
    ];
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-600">FIRST 90 DAYS</span></div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Turn one-time clients into lifelong advocates — plug into your CRM automation.</p>
      <div class="space-y-4 mb-6">
        ${touches.map((t) => `
          <div class="rounded-2xl border border-blue-200 dark:border-blue-800 p-4">
            <div class="font-bold text-sm text-[#002B5C] dark:text-white">${esc(t.day)} <span class="text-blue-600 font-normal">· ${esc(t.channel)}</span></div>
            ${t.subject ? `<div class="text-xs text-gray-500 mt-1">Subject: ${esc(t.subject)}</div>` : ''}
            <pre class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans mt-2">${esc(t.body)}</pre>
            <div class="text-[10px] text-gray-500 mt-1">${esc(t.tip)}</div>
            <button type="button" data-copy-snippet="${esc(t.body)}" class="mt-2 text-[10px] px-3 py-1 rounded-xl border border-blue-500 text-blue-700 hover:bg-blue-500 hover:text-white font-semibold"><i class="fas fa-copy mr-1"></i>Copy</button>
          </div>`).join('')}
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:nurture-90day-drip" class="text-xs px-3 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">Full 90-day drip →</button>
        <button type="button" data-vault-bridge="modal:post-closing-texts" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">More texts →</button>
      </div>
      ${footerActions('Copy 30/60/90 Sequence')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  function renderEmailAnnualReviewInvite(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Annual Review Invite');
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">HIGHEST ROI EMAIL</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 text-xs">HOME ANNIVERSARY</span>
      </div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">The money email — positions you as ongoing advisor, not one-time closer.</p>
      ${emailCard('Annual review invite',
        'Your Free "Mortgage Efficiency Check-Up" (15 minutes)',
        'Hi [First Name],\n\nIt\'s been about a year since we closed on your home. I\'m reaching out to offer something I do for all my past clients — a free 15–20 minute "Annual Mortgage Review."\n\nIt\'s basically a mortgage efficiency check-up. I\'ll look at current rates vs your rate, your equity position, and any life changes that might make refinancing, cash-out, or a different structure make sense for you right now.\n\nNo pressure, no sales pitch. Just data. Most people find it surprisingly useful.\n\nWant to book a quick time? Just reply with a couple days that work.',
        'Send on exact anniversary. Follow up with text 3 days later if no reply.')}
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:annual-mortgage-review" class="text-xs px-3 py-2 rounded-xl bg-[#002B5C] text-white font-semibold hover:bg-black transition">Review framework →</button>
        <button type="button" data-vault-bridge="equity" class="text-xs px-3 py-2 rounded-xl border border-[#00A89D] font-semibold hover:bg-[#00A89D]/5 transition">Equity Scanner →</button>
      </div>
      ${footerActions('Copy Annual Review Invite')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  function renderEmailRefiCheckin(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Refi Check-In');
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-600">RATE REACTIVATION</span></div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Non-pushy outreach when rates move — data-first, zero pressure.</p>
      ${emailCard('Rate improvement check-in',
        'Rates have moved — worth a 3-minute look for you?',
        'Hi [First Name],\n\nRates have improved a bit over the last few weeks. I\'m not promising anything dramatic, but for some of my clients it\'s now making sense to run the numbers.\n\nIf you\'re even slightly curious, I can run a quick no-obligation scenario for you in about 3 minutes. No pressure — just data.\n\nWant me to take a look?',
        'Only send when rates actually moved meaningfully. Batch to past 24-month clients.')}
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:annual-mortgage-review" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Annual review →</button>
      </div>
      ${footerActions('Copy Refi Check-In Email')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  function renderEmailPurchaseAnniversary(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Home Anniversary Email');
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#F15A29]/10 text-[#F15A29]">HIGHEST OPEN RATE</span></div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">The most emotionally powerful nurture email — pair with a gift for VIP clients.</p>
      ${emailCard('One year ago today…',
        'One year ago today…',
        'Hi [First Name],\n\nOne year ago today we closed on your home. I still remember how excited you were about [specific detail they mentioned — the kitchen, the yard, the school district, etc.].\n\nI hope the house is treating you well and that you\'re making incredible memories there.\n\nAs always, I\'m here if anything mortgage-related comes up. No expiration date on that.\n\nHappy home anniversary.\n\n[Your Name]',
        'Send morning of anniversary. Reference something specific from CRM notes. Pair with throw blanket for top clients.')}
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:client-anniversary-system" class="text-xs px-3 py-2 rounded-xl border border-[#F15A29] font-semibold hover:bg-[#F15A29]/5 transition">Anniversary system →</button>
        <button type="button" data-vault-bridge="modal:gift-throw-blanket" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">1-year gift idea →</button>
      </div>
      ${footerActions('Copy Anniversary Email')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  function renderTextPartnerPopbyFollowup(item, contentEl, modal) {
    setKicker(modal, 'Value Vault • Pop-By Follow-Up Texts');
    const texts = [
      { label: 'Simple & professional', script: 'Hey [Name], just dropped off a little something at your office. Hope it makes your week a tiny bit better. No need to reply — just wanted you to know I\'m thinking about you.', tip: 'Send 2–4 hours after drop. Reference the specific gift if possible.' },
      { label: 'Soft CTA version', script: 'Dropped off a small gift at the front desk for you. If you end up with any clients who need a second opinion on financing in the next few weeks, I\'d love to help. Enjoy the [item]!', tip: 'Use sparingly — not every pop-by needs an ask.' },
      { label: 'Relationship-first', script: 'Hey [Name] — left a little surprise for you. You\'ve been crushing it lately and I wanted to say thank you for the referrals and the partnership. Let\'s grab coffee soon if you have time.', tip: 'Best for top-tier partners after a big win.' }
    ];
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">SAME DAY / NEXT MORNING</span></div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">The text that turns a nice gesture into a relationship touch — most LOs skip this step.</p>
      <div class="space-y-4 mb-6">
        ${texts.map((t) => scriptCard(t.label, t.script, t.tip)).join('')}
      </div>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:popby-full-script-pack" class="text-xs px-3 py-2 rounded-xl bg-[#002B5C] text-white font-semibold hover:bg-black transition">Full pop-by sequence →</button>
        <button type="button" data-vault-bridge="modal:popby-what-to-say" class="text-xs px-3 py-2 rounded-xl border border-[#00A89D] font-semibold hover:bg-[#00A89D]/5 transition">Drop-off scripts →</button>
      </div>
      ${footerActions('Copy Pop-By Follow-Up Texts')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  // ─── POP-BY LIBRARY (RICH DATA-DRIVEN + PREMIUM OVERRIDES) ───────────
  const POPBY_PREMIUM = {
    'popby-tote': { badge: 'WALKING BILLBOARD', whyWorks: ['High frequency of use every day', 'Agents carry files, signs, marketing materials', 'Subtle branding opportunity on quality totes', 'Perfect low-cost rotation item'], timing: 'After a referral or new listing. Pair with handwritten note naming the specific win.', dropScript: 'Hey [Name], just dropping this off — thought it might be useful for open houses and errands. No strings. Hope your week is great!', followUp: 'Hey [Name], hope the tote is useful! Let me know if any of your buyers need pre-approvals this week.' },
    'popby-coffee': { badge: 'UNIVERSAL WIN', whyWorks: ['Used daily — high frequency reminder', 'Low risk, works with almost any partner', 'Pun lands + feels personal with amount written on note', 'Perfect after a referral or tough week'], timing: 'After a referral, post-closing celebration with agent, or random Tuesday morale boost.', dropScript: 'Hey [Name], just dropping this off — figured you could use a pick-me-up after the week you\'ve had. No strings!', followUp: 'Hope you enjoyed the coffee! Let me know if any buyers need scenarios this week.' },
    'popby-yeti': { badge: 'PREMIUM DAILY USE', whyWorks: ['Used every single day for years', 'Highest perceived value under $30', 'Every sip is a reminder of you', 'Works for top 10 partners and VIP agents'], timing: 'Top-tier partners, busy season appreciation, or after a major referral. Engrave first name only.', dropScript: 'Hey [Name], I know you\'re busy — just wanted to drop this off and say thanks for everything. Hope it keeps your coffee hot during crazy weeks!', followUp: 'Hope the tumbler is getting a workout! Appreciate the partnership — here if any buyers need scenarios.' },
    'popby-open-house-kit': { badge: 'MOST USEFUL GIFT', whyWorks: ['Solves real pain during long open houses', 'Shows you understand their job deeply', 'Water, snacks, sign-in = instant hero status', 'Pairs perfectly with open house play'], timing: '3–5 days before their next open house. Offer via text first — most agents say yes.', dropScript: 'Brought a little open house survival kit — figured it might help Saturday. I\'ll let you get back to it. Good luck this weekend!', followUp: 'Hope the open house kit came in handy Saturday! Let me know if you want me at the next one for quick pre-approvals.' },
    'popby-laser-measure': { badge: 'PRO TOOL UPGRADE', whyWorks: ['Listing agents use this constantly', 'Serious upgrade over cheap free tools', 'Positions you as a craft-respecting partner', 'High wow at $20–30 price point'], timing: 'For experienced listing agents or after helping on a complex property.', dropScript: 'Hey [Name], picked this up thinking it might save you time on listings. No pitch — just appreciate the partnership.', followUp: 'Hope the laser measure is saving you steps out there! Any buyers need scenarios this week?' },
    'popby-tape': { badge: 'PRO TOOL', whyWorks: ['Realtors use tape measures constantly', 'Upgrade over flimsy freebies they carry', 'Shows you understand listing presentations', 'Pun + utility = memorable'], timing: 'After helping on a listing-heavy month or new listing win.', dropScript: 'Hey [Name], thought this might come in handy on your next listing appointment. Appreciate you!', followUp: 'Hope the tape measure is getting use! Here if any buyers need pre-approvals.' },
    'popby-new-agent-kit': { badge: 'LOYALTY FROM DAY ONE', whyWorks: ['New agents remember early supporters forever', 'Emotional + practical combination', 'Notebook, pen, coffee = perfect starter kit', 'Builds pipeline of future top producers'], timing: 'Within first 30 days of agent joining brokerage. Ask broker who\'s new.', dropScript: 'Congrats on the new chapter! Dropped off a few things to help you crush your first 100 days. Rooting for you!', followUp: 'Hope the first few weeks are going well! I\'m always here if any of your buyers need financing help.' },
    'popby-client-win': { badge: 'RELATIONSHIP GOLD', whyWorks: ['You\'re celebrating THEIR win, not yours', 'Naming the client creates deep loyalty', 'Often leads to best referrals', 'Feels generous and memorable'], timing: 'Within 24–48 hours of their client closing with you. Champagne or gourmet chocolate.', dropScript: 'Just wanted to celebrate [Client Name]\'s closing with you — you did an amazing job. Enjoy this!', followUp: 'So glad we got [Client] closed smoothly for you. Let me know if any other buyers need help this month!' },
    'popby-market-update': { badge: 'VALUE DROP', whyWorks: ['Low effort for you, high value for them', 'Positions you as market intel source', 'Printed snapshot + treat = memorable', 'Repeat every 4–6 weeks for top partners'], timing: 'Every 4–6 weeks for top 15–20 partners. Monday mornings work best.', dropScript: 'Dropped off a quick local market snapshot + a small treat. Thought it might be useful for your sphere. No strings!', followUp: 'Hope the market snapshot was useful — happy to customize for your zip codes anytime.' },
    'popby-hand-cream': { badge: 'THOUGHTFUL DAILY USE', whyWorks: ['Realtors shake hundreds of hands', 'Feels luxurious at low cost', 'Solves a real daily annoyance', 'Works year-round'], timing: 'Winter dry-skin season or after a busy open house weekend.', dropScript: 'Hey [Name], know your hands take a beating showing homes — thought this might help. Appreciate you!', followUp: 'Hope the hand cream is useful! Here when any buyers need help.' },
    'popby-candle': { badge: 'HOME + OFFICE', whyWorks: ['Used in personal space daily', 'Pleasant sensory reminder', 'Feels thoughtful not promotional', 'Great for agents who work late'], timing: 'After a smooth closing month or holiday season appreciation.', dropScript: 'Hey [Name], just a small thank-you for everything this quarter. Hope this makes your space a little nicer.', followUp: 'Hope you\'re enjoying the candle! Let me know if any buyers need scenarios.' },
    'popby-honey': { badge: 'LOCAL PREMIUM', whyWorks: ['Supports local + feels artisanal', 'Conversation starter with a story', 'Higher perceived value than cost', 'Shareable with family'], timing: 'Fall farmers market season or local business appreciation week.', dropScript: 'Hey [Name], grabbed this from a local spot I love — thought of you. Thanks for being such a great partner.', followUp: 'Hope you enjoyed the honey! Here if any buyers need help this month.' },
    'popby-lottery': { badge: 'INSTANT SMILE', whyWorks: ['Ultra low cost, high delight', 'Fun after a tough negotiation week', 'Memorable pun every time', 'Great filler between bigger gifts'], timing: 'After a stressful deal or random "just because" touch.', dropScript: 'Hey [Name], figured we could both use a little luck this week. Enjoy!', followUp: 'Hope you enjoyed the tickets! Let me know if any buyers need pre-approvals.' },
    'popby-mints': { badge: 'MICRO-TOUCH', whyWorks: ['Tiny but thoughtful', 'Perfect between bigger gifts', 'Pun lands instantly', 'Bulk-friendly for top 20 partners'], timing: 'Monthly rotation filler — pair with a handwritten note.', dropScript: 'Hey [Name], just popping by with a tiny thank-you. Appreciate you!', followUp: 'Hope your week is going great! Here when you need scenarios.' },
    'popby-ice-scraper': { badge: 'WINTER HERO', whyWorks: ['Solves painful seasonal problem', 'Shows you understand cold-climate grind', 'Used every snowy morning', 'Highly memorable in Midwest markets'], timing: 'First cold snap of the season (Oct–Nov).', dropScript: 'Hey [Name], winter\'s coming — thought this might save you a frozen morning. Appreciate you!', followUp: 'Hope the scraper is getting use! Here if any buyers need help.' },
    'popby-cocoa': { badge: 'HOLIDAY CLASSIC', whyWorks: ['Warm, family-friendly, emotional', 'Perfect December office drop', 'Shareable with team/family', 'Strong seasonal timing'], timing: 'First two weeks of December for top partners.', dropScript: 'Hey [Name], warm wishes for the season — hope you and the family enjoy this!', followUp: 'Happy holidays! Here when you need scenarios in the new year.' },
    'popby-smores': { badge: 'MEMORY MAKER', whyWorks: ['Ties to new home / family memories', 'Fun and shareable', 'Great for family-focused agents', 'Emotional without being cheesy'], timing: 'Summer closings or agents with young families.', dropScript: 'Hey [Name], thought this might be fun for a backyard night with the kids. Enjoy!', followUp: 'Hope the s\'mores kit was a hit! Here if any buyers need help.' },
    'popby-champagne': { badge: 'NEW YEAR ENERGY', whyWorks: ['Forward-looking and celebratory', 'Perfect first-week-of-January touch', 'Sets tone for goal-oriented year', 'Pairs with goal-setting conversation'], timing: 'First week of January for top 10–15 partners.', dropScript: 'Hey [Name], here\'s to a big year ahead — thanks for an amazing partnership last year!', followUp: 'Cheers to a great year! Let me know how I can support your goals.' },
    'popby-valentine': { badge: 'SEASONAL WARMTH', whyWorks: ['Light, professional, relationship-focused', 'Timely without being awkward', 'Easy to source in bulk', 'Differentiates from rate-shoppers'], timing: 'Week before Valentine\'s Day — keep it professional and brief.', dropScript: 'Hey [Name], just a small thank-you during a busy season. Appreciate the partnership!', followUp: 'Hope you had a great week! Here when buyers need scenarios.' }
  };

  function defaultPopbyWhyWorks(item) {
    const tags = item.tags || [];
    if (tags.includes('premium') || tags.includes('wow')) return ['High perceived value at reasonable cost', 'Daily or weekly usage keeps you top-of-mind', 'Shows respect for their profession', 'Memorable vs generic logo items'];
    if (tags.includes('realtor') || tags.includes('professional')) return ['Solves a real daily problem on the job', 'Professional tool they actually use', 'Shows you understand their craft', 'Upgrade over cheap free alternatives'];
    if (tags.includes('seasonal')) return ['Timely emotional connection', 'Cultural moment agents appreciate', 'Easy to source in bulk ahead of season', 'Pairs naturally with seasonal note templates'];
    if (tags.includes('punny') || tags.includes('fun')) return ['Instant smile factor', 'Memorable pun lands every time', 'Low cost, high delight', 'Great filler between bigger gifts'];
    return ['Thoughtful unexpected gesture', 'Triggers reciprocity without asking', 'Pairs perfectly with handwritten note', 'Under 45-second drop-off delivery'];
  }

  function renderPopbyLibraryItem(item, contentEl, modal) {
    const prem = POPBY_PREMIUM[item.id] || {};
    setKicker(modal, 'Value Vault • Pop-By Playbook');
    const tagsHtml = (item.tags || []).map((t) =>
      `<span class="px-2 py-0.5 text-[10px] rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">${esc(t)}</span>`
    ).join(' ');
    const noteScript = (item.copyText || item.teaser || '').replace(/^[^—]+—\s*/, '').trim() || item.teaser || 'Thank you for everything you do — hope this brightens your week.';
    const dropScript = prem.dropScript || 'Hey [Name], I\'m [Your Name] with [Company]. I know you\'re busy — just wanted to drop this off and say thanks. No strings attached. Hope it makes your week better. My card\'s inside.';
    const followUp = prem.followUp || 'Hey [Name], just wanted to say thanks again for the quick chat earlier. Hope you enjoyed the gift. No need to reply — just wanted you to know I appreciate you.';
    const whyWorks = prem.whyWorks || defaultPopbyWhyWorks(item);

    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2 items-center">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">POP-BY</span>
        ${item.cost ? `<span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#F15A29]/10 text-[#F15A29]">${esc(item.cost)}</span>` : ''}
        ${prem.badge ? `<span class="px-3 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-600">${esc(prem.badge)}</span>` : ''}
        ${item.libraryCategory ? `<span class="px-3 py-1 text-xs font-semibold rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 text-xs">${esc(item.libraryCategory)}</span>` : ''}
      </div>
      ${item.teaser ? `<p class="text-lg italic text-gray-700 dark:text-gray-300 mb-3">"${esc(item.teaser)}"</p>` : ''}
      ${tagsHtml ? `<div class="flex flex-wrap gap-1.5 mb-4">${tagsHtml}</div>` : ''}

      <div class="p-4 rounded-2xl bg-[#00A89D]/5 border border-[#00A89D]/20 text-sm mb-6">
        <strong class="text-[#00A89D]">Why this works:</strong>
        <ul class="mt-2 space-y-1">${whyWorks.map((w) => `<li>• ${esc(w)}</li>`).join('')}</ul>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
        <div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <div class="font-semibold text-[#00A89D] mb-1"><i class="fas fa-calendar mr-1"></i> Best timing</div>
          <div class="text-gray-700 dark:text-gray-300">${esc(prem.timing || 'Monday morning, Thursday afternoon, after new listing, or day after a referred closing. Random "just because" 2–3×/year.')}</div>
        </div>
        <div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <div class="font-semibold text-[#00A89D] mb-1"><i class="fas fa-hand-holding-heart mr-1"></i> Delivery rule</div>
          <div class="text-gray-700 dark:text-gray-300">Under 45 seconds. Eye contact. Handwritten note. Leave before awkward. Log in CRM + schedule follow-up text.</div>
        </div>
      </div>

      ${scriptCard('Handwritten note (customize)', noteScript, 'Write by hand on a quality card. Reference a recent referral or listing if possible.')}
      ${scriptCard('What to say at drop-off (20–30 sec)', dropScript, 'Smile. Leave. Do not pitch unless they ask.')}
      ${scriptCard('Same-day follow-up text', followUp, 'Send 2–4 hours after drop. No ask on every touch — rotate relationship-first versions.')}

      <div class="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 text-sm mb-6">
        <strong>CRM rule:</strong> Log date, gift, partner name, script used. Schedule step 2 (text) and step 3 (1-week value touch) from the full pop-by sequence.
      </div>

      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:popby-what-to-say" class="text-xs px-3 py-2 rounded-xl bg-[#002B5C] text-white font-semibold hover:bg-black transition">More drop scripts →</button>
        <button type="button" data-vault-bridge="modal:popby-note-templates" class="text-xs px-3 py-2 rounded-xl border border-[#00A89D] text-[#00A89D] font-semibold hover:bg-[#00A89D]/5 transition">Note templates →</button>
        <button type="button" data-vault-bridge="modal:popby-full-script-pack" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Full sequence →</button>
        <button type="button" data-vault-bridge="modal:text-partner-popby-followup" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Follow-up texts →</button>
      </div>
      ${footerActions('Copy Pop-By Playbook')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  // ─── RUOFF FACT VAULT (PLATFORM DIFFERENTIATORS) ─────────────────────
  const FACT_CATEGORY_META = {
    Technology: { when: 'Agent asks about speed, tech, or “can you keep up?”', angle: 'Show the tool — don’t feature-dump. One proof point per conversation.' },
    Support: { when: 'Complex file, timeline pressure, or “will this close on time?”', angle: 'Cite the desk or metric — agents trust operations proof over promises.' },
    Programs: { when: 'Buyer needs DPA, builder deal, aggressive pricing, or niche product', angle: 'Match program to their buyer scenario — not a product laundry list.' },
    Culture: { when: 'New partner trust-building, recruiting conversations, or “why Ruoff?”', angle: 'Human proof + institutional backing — you are not a solo operator.' }
  };

  const FACT_PREMIUM = {
    'fact-ruoff-plus': {
      partnerScript: 'Everything I need lives in one platform — pipeline, PAs, rate checks, training, marketing. That’s why I can respond faster and never drop a ball on your files.',
      agentObjection: '“Can you keep up with my volume?” → Ruoff+ means one mission control — I’m not juggling five systems.'
    },
    'fact-lo-app': {
      partnerScript: 'I can issue updates, share referral links, and run scenarios from my phone between showings — your buyers and you never wait because I’m at a desk.',
      agentObjection: '“Are you hard to reach?” → Ruoff LO App — full pipeline power on mobile.'
    },
    'fact-loai': {
      partnerScript: 'When your buyer applies, LOAi can run soft credit, program select, tax/insurance estimates, and DU/LP in about a minute. Saves 15–30 minutes per file — your pre-approval turnaround gets noticeably faster.',
      agentObjection: '“How fast can you turn a pre-approval?” → LOAi automates the first pass so I focus on structure and communication.'
    },
    'fact-step-ahead': {
      partnerScript: 'On your next competitive offer — we can have the file fully underwritten before your buyer even finds the house. Step Ahead means the PA letter is backed by real UW, not guesswork. Want me to run one for your active shopper?',
      agentObjection: '“Other lenders issue PAs faster.” → Faster letters that fall apart at UW hurt your reputation. We underwrite first so your offer actually holds.'
    },
    'fact-agent-advantage': {
      partnerScript: 'Every Monday you get an automated pipeline snapshot from me — pre-approved buyers, active deals, recent closings — plus my personal notes. You never have to chase me for “who’s ready.”',
      agentObjection: '“I don’t know who you have in pipeline.” → Agent Advantage sends it every Monday automatically.'
    },
    'fact-loan-butler': {
      partnerScript: 'Your buyers get a secure portal with a clear to-do list, doc upload, and real-time status — so you’re not playing middleman on every question.',
      agentObjection: '“My client doesn’t know what’s happening.” → Loan Butler gives borrowers and agents live status without chasing me.'
    },
    'fact-milestone-updates': {
      partnerScript: 'You and your client get automated milestone texts and emails throughout the file — appraisal ordered, UW submitted, CTC, etc. Predictable communication without me manually chasing updates.',
      agentObjection: '“I hate lenders who go dark.” → Automated milestone updates to you and the borrower on every file.'
    },
    'fact-scenario-builder': {
      partnerScript: 'I can run side-by-side rate, product, and down payment comparisons in under two minutes at an open house or buyer consult — your client chooses confidently on the spot.',
      agentObjection: '“Can you show options quickly?” → Scenario Builder — real comparisons in under 2 minutes.'
    },
    'fact-preapproval-advantage': {
      partnerScript: 'For serious shoppers, I set guardrails and they can generate updated PA scenarios within my limits — empowers your buyer without me being a bottleneck.',
      agentObjection: '“My buyer needs an updated letter tonight.” → Pre-Approval Advantage lets qualified shoppers self-serve within my parameters.'
    },
    'fact-digital-closing': {
      partnerScript: 'Most docs are e-signed before closing day — less stress at the table for your client and a cleaner experience for you on the big day.',
      agentObjection: '“Closing day is always chaotic.” → Majority of docs signed digitally before the table.'
    },
    'fact-mi-comparison': {
      partnerScript: 'We quote every MI provider in minutes — I make sure your buyer isn’t overpaying on mortgage insurance vs. what competitors quote.',
      agentObjection: '“PMI killed the payment.” → MI Comparison Tool shops every provider in minutes.'
    },
    'fact-quick-qualify': {
      partnerScript: 'When income is the question, Quick Qualify gets verification answers in about two hours — we move forward with confidence instead of guessing.',
      agentObjection: '“Income is complicated.” → Quick Qualify — income answers in ~2 hours.'
    },
    'fact-income-desk': {
      partnerScript: 'Self-employed, variable, or rental income? We have a dedicated Income Desk for calcs that stall files elsewhere — I’m not winging it in front of your client.',
      agentObjection: '“They’re self-employed — this will be hard.” → Income Desk handles the scenarios other lenders pass on.'
    },
    'fact-scenario-desk': {
      partnerScript: 'Unique credit, income, or collateral question? Scenario Desk gets real UW guidance — I bring answers, not “we’ll see.”',
      agentObjection: '“This file is weird.” → Scenario Desk for real UW answers on edge cases.'
    },
    'fact-marketing-team': {
      partnerScript: 'Happy to co-brand open house flyers, buyer guides, or social content — we have a full marketing team and hundreds of ready-made assets. Tell me what you need for your next listing and I’ll get it turned around.',
      agentObjection: '“I need co-marketing help.” → Full marketing team + instant co-brand downloads.'
    },
    'fact-dedicated-processor': {
      partnerScript: 'Every file gets a dedicated processor — not a rotating call center. Same person knows your deal start to finish.',
      agentObjection: '“I never know who to call on your files.” → Dedicated processor on every loan.'
    },
    'fact-ctc-speed': {
      partnerScript: 'Our average clear-to-close is about 15.7 days with ~1 day UW turn — in-house, not outsourced. When contract dates are tight, that’s the number I want you thinking about.',
      agentObjection: '“Will we make the closing date?” → Cite CTC average + dedicated processor on every file.'
    },
    'fact-closing-excellence': {
      partnerScript: '75% of our loans close on or before the CD date — and clients aren’t waiting at the table for funding authorization. Your buyer’s celebration stays a celebration.',
      agentObjection: '“Last lender had closing day surprises.” → 75% on/before CD date, no funding wait at the table.'
    },
    'fact-pinchi-hitter': {
      partnerScript: 'When I’m on vacation, a peer pinch hitter has full file access — your deal doesn’t pause because I’m away.',
      agentObjection: '“What if you’re out of town?” → Pinch Hitter coverage with full file access.'
    },
    'fact-homenow-ratedrop': {
      partnerScript: 'Between conventional, FHA, VA, USDA, HomeNow, RateDrop, and equity leverage options — we usually find a path when other lenders say no. Tell me your buyer’s scenario.',
      agentObjection: '“Programs won’t work for this buyer.” → HomeNow, RateDrop, DPA, bank statement, HELOC, and more.'
    },
    'fact-builder-pricing': {
      partnerScript: 'On builder deals we can offer aggressive pricing — 80bps comp plus borrower credits that help buyers afford new construction. Let me run numbers on your next spec.',
      agentObjection: '“New construction payment is too high.” → Builder pricing + credits on new builds.'
    },
    'fact-branch-pricing': {
      partnerScript: 'For rate-sensitive buyers you bring directly, we have branch-generated pricing at 50bps comp — competitive without me sacrificing service.',
      agentObjection: '“Your rate isn’t competitive.” → Branch pricing for aggressive branch-sourced deals.'
    },
    'fact-leadership-culture': {
      partnerScript: 'You’re not betting on a solo operator — Ruoff has accessible leadership, 98.5% customer satisfaction, and Top 100 / Inc 500 recognition. I have institutional backing behind my personal service.',
      agentObjection: '“Why Ruoff vs. a big bank?” → Leadership access + culture + national recognition with local relationship.'
    },
    'fact-lo-testimonials': {
      partnerScript: 'Producers who’ve been here 10–26 years consistently say ops go the extra mile and leadership makes things right — that’s the machine behind your files.',
      agentObjection: '“Is your company stable?” → Real LO testimonials — culture and ops that scale without losing service.'
    }
  };

  function stripHtml(html) {
    return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function renderFactVaultItem(item, contentEl, modal) {
    const prem = FACT_PREMIUM[item.id] || {};
    const cat = item.libraryCategory || 'Platform';
    const meta = FACT_CATEGORY_META[cat] || FACT_CATEGORY_META.Technology;
    const bodyText = stripHtml(item.content).replace(/Use with partners:.*$/i, '').trim();
    const partnerScript = prem.partnerScript || `Quick Ruoff differentiator for agents: ${item.teaser || bodyText.slice(0, 120)}. Use when they ask why work with you — keep it to one proof point, then offer to demonstrate on their next file.`;
    const tagsHtml = (item.tags || []).map((t) =>
      `<span class="px-2 py-0.5 text-[10px] rounded-full bg-[#002B5C]/10 text-[#002B5C] dark:text-gray-300">${esc(t)}</span>`
    ).join(' ');

    setKicker(modal, 'Value Vault • Ruoff Fact Vault');
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2 items-center">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#002B5C]/10 text-[#002B5C] dark:text-white">RUOFF EDGE</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">${esc(cat)}</span>
      </div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-3">${esc(item.teaser || '')}</p>
      ${tagsHtml ? `<div class="flex flex-wrap gap-1.5 mb-4">${tagsHtml}</div>` : ''}

      <div class="p-4 rounded-2xl bg-[#002B5C]/5 border border-[#002B5C]/20 text-sm mb-6">
        <strong class="text-[#002B5C] dark:text-white">What it is:</strong>
        <div class="mt-2 text-gray-700 dark:text-gray-300">${esc(bodyText.slice(0, 500))}${bodyText.length > 500 ? '…' : ''}</div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
        <div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <div class="font-semibold text-[#00A89D] mb-1"><i class="fas fa-bullseye mr-1"></i> When to use</div>
          <div class="text-gray-700 dark:text-gray-300">${esc(meta.when)}</div>
        </div>
        <div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <div class="font-semibold text-[#00A89D] mb-1"><i class="fas fa-comment mr-1"></i> Delivery angle</div>
          <div class="text-gray-700 dark:text-gray-300">${esc(meta.angle)}</div>
        </div>
      </div>

      ${scriptCard('Say this to a partner', partnerScript, 'One proof point per conversation — then offer to show it on their next buyer.')}
      ${prem.agentObjection ? scriptCard('If they push back', prem.agentObjection, 'Stay calm — data beats defensiveness.') : ''}

      <div class="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 text-sm mb-6">
        <strong>Golden rule:</strong> Never feature-dump. Pick the one fact that solves <em>their</em> concern right now. Log which facts get the best agent reactions in your CRM.
      </div>

      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" data-vault-bridge="modal:objection-gain-partner-business" class="text-xs px-3 py-2 rounded-xl bg-[#002B5C] text-white font-semibold hover:bg-black transition">Partner objections →</button>
        <button type="button" data-vault-bridge="modal:followup-value-email" class="text-xs px-3 py-2 rounded-xl border border-[#00A89D] text-[#00A89D] font-semibold hover:bg-[#00A89D]/5 transition">Value email →</button>
        <button type="button" data-vault-bridge="play:co-marketing-assets" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Co-marketing play →</button>
        <button type="button" data-vault-bridge="pillar:1" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Pop-by library →</button>
      </div>
      ${footerActions('Copy Partner Talking Point')}
    `;
    window.attachRichVaultModalHandlers(contentEl, item);
  }

  const RENDERERS = {
    'post-closing-7day': renderPostClosing7Day,
    'post-closing-texts': renderPostClosingTexts,
    'post-closing-full-scripts': renderPostClosingFullScripts,
    'post-closing-checklist': renderPostClosingChecklist,
    'post-closing-ltv-framework': renderPostClosingLtv,
    '7day-objections': render7DayObjections,
    'annual-mortgage-review': renderAnnualMortgageReview,
    'client-anniversary-system': renderClientAnniversarySystem,
    'gift-cadence-system': renderGiftCadenceSystem,
    'giftology-mindset': renderGiftologyMindset,
    'gift-chef-knife': renderGiftChefKnife,
    'gift-custom-map': renderGiftCustomMap,
    'gift-welcome-mat': renderGiftWelcomeMat,
    'gift-relationship-book': renderGiftRelationshipBook,
    'gift-yeti-tumbler': renderGiftYetiTumbler,
    'gift-throw-blanket': renderGiftThrowBlanket,
    'gift-leather-journal': renderGiftLeatherJournal,
    'gift-cutting-board': renderGiftCuttingBoard,
    'gift-experience': renderGiftExperience,
    'gift-subscription': renderGiftSubscription,
    'gift-coaster-set': renderGiftCoasterSet,
    'gift-house-portrait': renderGiftHousePortrait,
    'gift-plant': renderGiftPlant,
    'gift-chocolate': renderGiftChocolate,
    'gift-coffee-card': renderGiftCoffeeCard,
    'gift-tote-bag': renderGiftToteBag,
    'gift-water-bottle': renderGiftWaterBottle,
    'gift-hand-cream': renderGiftHandCream,
    'gift-desk-fan': renderGiftDeskFan,
    'gift-pen-set': renderGiftPenSet,
    'gift-desk-organizer': renderGiftDeskOrganizer,
    'client-gift-budget-timing': renderClientGiftBudget,
    'client-gift-retention-link': renderClientGiftRetentionLink,
    'gift-sourcing-system': renderGiftSourcingSystem,
    'gift-note-examples': renderGiftNoteExamples,
    'content-pillars': renderContentPillars,
    'content-repurposing': renderContentRepurposing,
    'content-cadence': renderContentCadence,
    'content-brand-positioning': renderContentBrandPositioning,
    'content-script-examples': renderContentScriptExamples,
    'reel-hook-formula': renderReelHookFormula,
    'content-30day-sprint': renderContent30DaySprint,
    'nurture-12month-calendar': renderNurture12Month,
    'nurture-text-swipe-file': renderNurtureSwipeFile,
    'nurture-90day-drip': renderNurture90Day,
    'referral-flywheel-system': renderReferralFlywheel,
    'top-producer-habits': renderTopProducerHabits,
    'popby-best-practices': renderPopbyBestPractices,
    'popby-sourcing-budget': renderPopbySourcing,
    'popby-what-to-say': renderPopbyWhatToSay,
    'popby-note-templates': renderPopbyNoteTemplates,
    'popby-psychology-timing': renderPopbyPsychology,
    'popby-seasonal-calendar': renderPopbySeasonalCalendar,
    'popby-full-script-pack': renderPopbyFullScriptPack,
    'followup-popby': renderFollowupPopby,
    'followup-quick-text': renderFollowupQuickText,
    'followup-value-email': renderFollowupValueEmail,
    'followup-phone-checkin': renderFollowupPhoneCheckin,
    'realtor-open-house-kit': renderRealtorOpenHouseKit,
    'realtor-weekly-snapshots': renderRealtorWeeklySnapshots,
    'realtor-cobranded-flyers': renderRealtorCobrandedFlyers,
    'realtor-joint-value-adds': renderRealtorJointValueAdds,
    'framework-popby-sourcing': renderFrameworkPopbySourcing,
    'email-weekly-partner': renderEmailWeeklyPartner,
    'email-monthly-partner': renderEmailMonthlyPartner,
    'email-post-closing': renderEmailPostClosing,
    'email-30-60-90': renderEmail306090,
    'email-annual-review-invite': renderEmailAnnualReviewInvite,
    'email-refi-checkin': renderEmailRefiCheckin,
    'email-purchase-anniversary': renderEmailPurchaseAnniversary,
    'text-partner-popby-followup': renderTextPartnerPopbyFollowup,
    'objection-psychology-system': renderObjectionPsychology,
    'objection-full-script-library': renderObjectionFullLibrary,
    'objection-rates': renderObjectionRates,
    'objection-waiting': renderObjectionWaiting,
    'objection-credit': renderObjectionCredit,
    'objection-downpayment': renderObjectionDownpayment,
    'objection-investor': renderObjectionInvestor,
    'objection-competitor': renderObjectionCompetitor,
    'objection-modern': renderObjectionModern,
    'objection-gain-partner-business': renderObjectionPartnerBusiness,
    'value-vault-30day-activation': renderActivationPlan
  };

  window.renderRichVaultModal = function renderRichVaultModal(item, contentEl, modal) {
    if (!item || !contentEl) return false;
    const fn = RENDERERS[item.id];
    if (fn) {
      fn(item, contentEl, modal);
      return true;
    }
    if (item.type === 'pop-by' || (item.id && item.id.startsWith('popby-'))) {
      renderPopbyLibraryItem(item, contentEl, modal);
      return true;
    }
    if (item.type === 'fact' || (item.id && item.id.startsWith('fact-'))) {
      renderFactVaultItem(item, contentEl, modal);
      return true;
    }
    return false;
  };

  console.log('%c[vault-rich-modals] Premium modals ready (' + Object.keys(RENDERERS).length + ' bespoke + pop-by + fact vault)', 'color:#00A89D');
})();