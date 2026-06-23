/**
 * js/features/referral-rich-modals.js
 * Bespoke premium modals for high-traffic Referral Partner plays.
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

  const PARTNER_TIER_TITLES = {
    'a-plus': 'A+ Partners — White-Glove Playbook',
    b: 'B Partners — Growth Playbook',
    c: 'C Partners — Efficient Conversion Playbook'
  };

  function whyBox(label, text, accent) {
    const color = accent === 'orange' ? '#F15A29' : accent === 'navy' ? '#002B5C' : '#00A89D';
    return `
      <div class="bg-[${color}]/10 border border-[${color}]/30 rounded-3xl p-5 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[${color}]"></i><span class="font-bold text-[${color}] uppercase tracking-wider text-sm">${esc(label)}</span></div>
        <p class="text-[15px] leading-relaxed">${text}</p>
      </div>`;
  }

  function sectionTitle(text) {
    return `<h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">${text}</h4>`;
  }

  function bulletList(items) {
    return `<ul class="text-sm space-y-1.5 mb-6 pl-5 list-disc text-gray-700 dark:text-gray-300">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
  }

  function cadenceCard(text) {
    return `<div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-3 text-[15px] mb-2">${text}</div>`;
  }

  function proTip(text) {
    return `<div class="p-4 bg-[#F15A29]/5 border border-[#F15A29]/20 rounded-2xl text-sm mb-6"><strong>Pro Tip:</strong> ${text}</div>`;
  }

  function goalBox(text) {
    return `<div class="p-4 bg-[#00A89D]/5 border border-[#00A89D]/20 rounded-2xl text-sm mb-6"><strong>Goal:</strong> ${text}</div>`;
  }

  function bridgeRow(buttons) {
    return `
      <div class="flex flex-wrap gap-2 mb-6">
        ${buttons.map((b) => `
          <button type="button" data-referral-bridge="${esc(b.action)}"
            class="text-xs px-3 py-2 rounded-xl ${b.primary ? 'bg-[#002B5C] text-white font-semibold hover:bg-black' : 'border border-[#00A89D] text-[#00A89D] font-semibold hover:bg-[#00A89D]/5'} transition">
            ${esc(b.label)} →
          </button>`).join('')}
      </div>`;
  }

  function scriptCard(title, script, tip, saveKey) {
    return `
      <div class="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <div class="font-semibold text-sm text-[#002B5C] dark:text-white mb-2">${esc(title)}</div>
        <div class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">"${esc(script)}"</div>
        ${tip ? `<div class="mt-2 text-[10px] text-gray-500">${esc(tip)}</div>` : ''}
        <button type="button" data-referral-copy="${esc(script)}"
          class="mt-3 text-[10px] px-3 py-1.5 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold transition">
          <i class="fas fa-copy mr-1"></i>Copy script
        </button>
        ${saveKey ? `<button type="button" data-referral-save="${esc(saveKey)}" data-referral-save-text="${esc(script)}"
          class="mt-2 ml-2 text-[10px] px-3 py-1.5 rounded-xl border border-[#F15A29] text-[#F15A29] hover:bg-[#F15A29] hover:text-white font-semibold transition">
          <i class="fas fa-bookmark mr-1"></i>Save
        </button>` : ''}
      </div>`;
  }

  function normalizePartnerTier(tier) {
    const t = String(tier || '').trim().toLowerCase();
    if (t === 'a+' || t === 'a plus' || t === 'a-plus' || t === 'aplus') return 'a-plus';
    if (t === 'b') return 'b';
    if (t === 'c') return 'c';
    return null;
  }

  function weekCard(label, title, tasks, color) {
    const colors = {
      teal: 'border-[#00A89D]/40 bg-[#00A89D]/5',
      navy: 'border-[#002B5C]/30 bg-[#002B5C]/5',
      orange: 'border-[#F15A29]/40 bg-[#F15A29]/5'
    };
    return `
      <div class="rounded-2xl border p-5 ${colors[color] || colors.teal}">
        <div class="text-[10px] font-bold tracking-wider text-gray-500 uppercase mb-1">${esc(label)}</div>
        <div class="font-bold text-[#002B5C] dark:text-white mb-2">${esc(title)}</div>
        <ul class="text-sm space-y-1.5 text-gray-700 dark:text-gray-300">
          ${tasks.map((t) => `<li class="flex gap-2"><span class="text-[#00A89D]">☐</span>${esc(t)}</li>`).join('')}
        </ul>
      </div>`;
  }

  function dayCard(day, title, action, script) {
    return `
      <div class="rounded-2xl border-l-4 border-[#00A89D] border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex flex-wrap justify-between gap-2 mb-1">
          <div class="font-bold text-sm text-[#002B5C] dark:text-white">${esc(day)}</div>
          <div class="text-xs text-[#00A89D] font-semibold">${esc(title)}</div>
        </div>
        <div class="text-sm text-gray-700 dark:text-gray-300">${esc(action)}</div>
        ${script ? `<div class="mt-2 text-sm italic text-gray-600 dark:text-gray-400">"${esc(script)}"</div>
          <button type="button" data-referral-copy="${esc(script)}" class="mt-2 text-[10px] px-3 py-1 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold"><i class="fas fa-copy mr-1"></i>Copy</button>` : ''}
      </div>`;
  }

  function footerSave(saveKey, label) {
    return `
      <div class="mt-6 flex flex-wrap gap-3 referral-rich-actions">
        <button type="button" data-referral-save="${esc(saveKey)}"
          class="px-5 py-2 bg-[#00A89D] text-white rounded-2xl text-sm font-semibold flex items-center gap-2 hover:opacity-90">
          <i class="fas fa-bookmark"></i> ${label || 'Save to My Resources'}
        </button>
        <button type="button" data-referral-bridge="weekly"
          class="px-5 py-2 border border-[#002B5C] text-[#002B5C] dark:text-gray-200 rounded-2xl text-sm font-semibold flex items-center gap-2 hover:bg-[#002B5C]/5">
          <i class="fas fa-calendar-week"></i> Weekly Win Plan
        </button>
      </div>`;
  }

  function attachHandlers(contentEl, play) {
    contentEl.querySelectorAll('[data-referral-copy]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-referral-copy') || '';
        navigator.clipboard.writeText(text).then(() => {
          const orig = btn.innerHTML;
          btn.innerHTML = '<i class="fas fa-check mr-1"></i>Copied!';
          setTimeout(() => { btn.innerHTML = orig; }, 1600);
        }).catch(() => {});
      });
    });

    contentEl.querySelectorAll('[data-referral-save]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-referral-save');
        const text = btn.getAttribute('data-referral-save-text') || '';
        if (text && typeof window.toggleSaveIdea === 'function') {
          window.toggleSaveIdea(key, text, btn, 'partner');
        } else if (typeof window.savePartnerStrategy === 'function') {
          window.savePartnerStrategy(key, 0, btn);
        }
      });
    });

    contentEl.querySelectorAll('[data-referral-bridge]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-referral-bridge');
        const modal = document.getElementById('referral-modal');
        if (modal) {
          if (typeof window.closeReferralModal === 'function') window.closeReferralModal();
          else {
            modal.classList.add('hidden');
            modal.style.display = 'none';
          }
        }
        setTimeout(() => {
          if (action === 'weekly' && typeof window.showSection === 'function') {
            window.showSection('weekly-win-plan');
          } else if (action === 'vault' && typeof window.showSection === 'function') {
            window.showSection('value-vault');
          } else if (action === 'popby' && typeof window.showSection === 'function') {
            window.showSection('value-vault');
            setTimeout(() => {
              if (typeof window.openVaultPillar === 'function') window.openVaultPillar(1);
            }, 200);
          } else if (action?.startsWith('vault:') && typeof window.openVaultItemWhenReady === 'function') {
            if (typeof window.showSection === 'function') window.showSection('value-vault');
            setTimeout(() => window.openVaultItemWhenReady(action.split(':')[1]), 200);
          } else if (action?.startsWith('play:') && typeof window.openHighImpactPlay === 'function') {
            window.openHighImpactPlay(action.split(':').slice(1).join(':'));
          } else if (action?.startsWith('tier:') && typeof window.openTierModal === 'function') {
            window.openTierModal(action.split(':')[1]);
          } else if (action?.startsWith('event:') && typeof window.openEventModal === 'function') {
            window.openEventModal(action.split(':')[1]);
          } else if (action?.startsWith('section:') && typeof window.showSection === 'function') {
            window.showSection(action.split(':')[1]);
          } else if (action === 'referral:realtors' && typeof window.openReferralModal === 'function') {
            window.openReferralModal('Realtors');
          }
        }, 220);
      });
    });
  }

  // ─── 60-DAY REALTOR ONBOARDING ───────────────────────────────────────
  function render60DayOnboarding(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">FLAGSHIP SEQUENCE</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#F15A29]/10 text-[#F15A29]">60 DAYS → CONSISTENT REFERRALS</span>
      </div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-2">Turn a brand-new realtor relationship into a consistent referral source in 60 days.</p>
      <p class="text-sm text-gray-500 mb-6">Value-first every touch. No asks until Day 30. Earn trust before you ask for business.</p>
      <div class="space-y-3 mb-6">
        ${dayCard('Days 1–2', 'Foundation', 'Personal intro call or text. Offer to run scenarios on their current listings — no pitch.', 'Hey [Name], I\'m [Your Name] — excited to connect. I saw your listing at [address] and had a few financing angles that might help your buyers. Happy to run quick scenarios anytime — no strings.')}
        ${dayCard('Day 7', 'First Value Drop', 'Send a high-value co-brandable neighborhood market snapshot (1 page, their zip codes).', 'Put together a quick market snapshot for [area] — thought it might be useful for your buyers and sphere. Happy to co-brand with your logo.')}
        ${dayCard('Day 14', 'Relationship Deepening', 'Coffee or lunch — learn their business, pain points, and ideal buyer profile. Listen 80%, talk 20%.', null)}
        ${dayCard('Day 21', 'Co-Branded Asset + Offer', 'Deliver one co-branded buyer guide. Offer to co-host an open house or lunch & learn.', 'Created a co-branded first-time buyer guide — want me to send the PDF? Also happy to set up a pre-approval station at your next open house.')}
        ${dayCard('Day 30', 'Relationship Review', 'The only early ask: "How can I make working with me easier for you?"', 'We\'ve been connected about a month — genuinely curious: what can I do to make your life easier on the financing side?')}
        ${dayCard('Day 45', 'Public Win', 'Tag them in a social shoutout celebrating a smooth closing or great partnership moment.', null)}
        ${dayCard('Day 60', 'Formal Feedback + Introduction', 'Ask for feedback on the relationship. Request one warm introduction to an agent they respect.', 'Really value our partnership so far. Two quick things: (1) honest feedback on how I can improve, and (2) is there one agent you respect that I should meet?')}
      </div>
      <div class="p-4 rounded-2xl bg-[#00A89D]/5 border border-[#00A89D]/20 text-sm mb-6">
        <strong>Execution rule:</strong> Log every touch in your CRM. Block 30 min every Monday to advance all active 60-day sequences.
      </div>
      <div class="flex flex-wrap gap-2 mb-2">
        <button type="button" data-referral-bridge="vault:objection-gain-partner-business" class="text-xs px-3 py-2 rounded-xl border border-[#00A89D] text-[#00A89D] font-semibold hover:bg-[#00A89D] hover:text-white transition">Partner objections →</button>
        <button type="button" data-referral-bridge="popby" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition">Pop-by ideas →</button>
        <button type="button" data-referral-bridge="play:weekly-value-cadence" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Weekly cadence →</button>
      </div>
      ${footerSave('HighImpact-60Day', 'Save 60-Day Sequence')}
    `;
    attachHandlers(contentEl);
  }

  // ─── FIRST 30 DAYS CHECKLIST ─────────────────────────────────────────
  function renderFirst30Days(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#002B5C]/10 text-[#002B5C] dark:text-gray-300">NEW PARTNER ONBOARDING</span></div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">The critical first month with any new referral partner — practical and actionable.</p>
      <div class="space-y-4 mb-6">
        ${weekCard('Week 1', 'Foundation', [
          'Send personalized welcome email + your direct contact info',
          'Add to CRM with Partner Type + Tier tags',
          'Add to newsletter list (if appropriate)',
          'Send first value touch — market update or useful resource'
        ], 'teal')}
        ${weekCard('Week 2', 'Relationship Building', [
          'Personal text or call — learn their business and goals',
          'Offer to run scenarios on current listings/opportunities',
          'Send second value touch — co-branded asset or introduction'
        ], 'navy')}
        ${weekCard('Week 3–4', 'Momentum', [
          'Public social shoutout (tag them)',
          'Offer to co-host something — open house, lunch & learn',
          'Send third value touch',
          'Light ask: "What can I do to support you right now?"'
        ], 'orange')}
      </div>
      <div class="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 text-sm mb-6">
        <strong>Pair with:</strong> The 60-Day Onboarding Sequence for partners you want to turn into top-tier referral sources.
      </div>
      <div class="flex flex-wrap gap-2 mb-2">
        <button type="button" data-referral-bridge="play:60-day-realtor-onboarding" class="text-xs px-3 py-2 rounded-xl bg-[#00A89D] text-white font-semibold hover:opacity-90 transition">Upgrade to 60-Day Sequence →</button>
      </div>
      ${footerSave('First30Days', 'Save 30-Day Checklist')}
    `;
    attachHandlers(contentEl);
  }

  // ─── REFERRAL OBJECTIONS ─────────────────────────────────────────────
  function renderReferralObjections(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-600">PARTNER OBJECTION PLAYBOOK</span></div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Strong, natural responses — value-first, never pushy. Match the Giftology philosophy.</p>
      <div class="space-y-4 mb-6">
        ${scriptCard('"I already have a lender I like."',
          'Totally fair. Most of the agents I work best with have 2–3 lenders they trust for different situations. I\'d love to be the one you call when speed, communication, or creative financing is the difference between winning and losing the deal.',
          'Position as specialist backup, not replacement.')}
        ${scriptCard('"Your rates aren\'t the lowest."',
          'Rates matter, but in this market the difference between an accepted offer and a lost deal is often 24–48 hours of certainty. I focus on making your buyer\'s offer the strongest on the table.',
          'Shift from price to certainty and speed.')}
        ${scriptCard('"I don\'t want to change mid-transaction."',
          'Smart. I\'m not asking you to switch anyone mid-deal. I\'m asking for the next buyer who is still shopping. Let me prove the difference on one file.',
          'Respect their current deal completely.')}
        ${scriptCard('"I only refer when I get something back."',
          'Fair. I believe the best relationships are reciprocal. I\'m happy to send you buyers who need a great realtor whenever it makes sense.',
          'Offer reciprocity without bribery.')}
      </div>
      <div class="flex flex-wrap gap-2 mb-2">
        <button type="button" data-referral-bridge="vault:objection-gain-partner-business" class="text-xs px-3 py-2 rounded-xl border border-amber-500 text-amber-700 font-semibold hover:bg-amber-500 hover:text-white transition">Full partner objection library →</button>
        <button type="button" data-referral-bridge="play:relationship-management" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Relationship management →</button>
      </div>
      ${footerSave('Objections', 'Save Objection Playbook')}
    `;
    attachHandlers(contentEl);
  }

  // ─── WEEKLY VALUE CADENCE ────────────────────────────────────────────
  function renderWeeklyCadence(contentEl) {
    const weeks = [
      { w: 'Week 1', touch: 'Short market video or text update tailored to their area' },
      { w: 'Week 2', touch: 'Co-branded buyer guide or checklist' },
      { w: 'Week 3', touch: 'Personal text about something relevant in their life/business' },
      { w: 'Week 4', touch: 'Valuable introduction or resource (no ask)' },
      { w: 'Week 5–6', touch: 'Repeat your highest-performing digital touch' },
      { w: 'Week 7', touch: 'Light personal outreach — coffee invite or congrats' },
      { w: 'Week 8', touch: 'Public shoutout or co-branded content' }
    ];
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-teal-500/10 text-teal-600">REPEATABLE SYSTEM</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 text-xs">MAX 20% ASK-ORIENTED</span>
      </div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-2">Stay top-of-mind with any partner type without feeling salesy.</p>
      <p class="text-sm text-gray-500 mb-6">Rotate and personalize. Never more than 20% of touches should include an ask.</p>
      <div class="space-y-2 mb-6">
        ${weeks.map((wk) => `
          <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-3 flex gap-3">
            <div class="text-[10px] font-bold tracking-wider text-[#00A89D] uppercase w-16 shrink-0 pt-0.5">${esc(wk.w)}</div>
            <div class="text-sm text-gray-700 dark:text-gray-300">${esc(wk.touch)}</div>
          </div>`).join('')}
      </div>
      <div class="p-4 rounded-2xl bg-teal-50 dark:bg-teal-900/20 border border-teal-200 text-sm mb-6">
        <strong>Pro move:</strong> Batch-create Week 1 and Week 2 assets once per month. Reuse across your top 20 partners with light personalization.
      </div>
      <div class="flex flex-wrap gap-2 mb-2">
        <button type="button" data-referral-bridge="vault:nurture-12month-calendar" class="text-xs px-3 py-2 rounded-xl border border-teal-500 text-teal-700 font-semibold hover:bg-teal-100 transition">Client nurture calendar →</button>
        <button type="button" data-referral-bridge="play:co-marketing-assets" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Co-marketing ideas →</button>
      </div>
      ${footerSave('HighImpact-Cadence', 'Save Weekly Cadence')}
    `;
    attachHandlers(contentEl);
  }

  // ─── OPEN HOUSE DOMINATION ─────────────────────────────────────────────
  function renderOpenHouse(contentEl) {
    const phases = [
      { phase: 'Before', items: ['Offer on-site pre-approval support', 'Bring branded materials + scenario cheat sheet', 'Confirm agent knows your 15-min pre-approval process', 'Post co-branded open house story 24 hrs prior'] },
      { phase: 'During', items: ['Run quick scenarios for serious buyers (compliant)', 'Collect contact info with agent\'s permission', 'Be the calm expert — not a salesperson', 'Take notes on buyer profiles for follow-up'] },
      { phase: 'After (48 hrs)', items: ['Send agent thank-you + summary of buyers met', 'Offer next steps for each qualified lead', 'Propose co-hosting their next open house', 'Log all contacts in CRM with source tag'] },
      { phase: 'Follow-up (Week 2)', items: ['Joint buyer event or lunch & learn offer', 'Share which buyers you\'re actively working', 'Ask: "What would make the next one even better?"'] }
    ];
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#F15A29]/10 text-[#F15A29]">DUAL WIN PLAY</span></div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Turn every open house into buyer leads + deeper realtor relationships.</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        ${phases.map((p) => `
          <div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
            <div class="font-bold text-sm text-[#002B5C] dark:text-white mb-2"><i class="fas fa-flag text-[#F15A29] mr-1"></i>${esc(p.phase)}</div>
            <ul class="text-sm space-y-1 text-gray-700 dark:text-gray-300">
              ${p.items.map((i) => `<li class="flex gap-2"><span class="text-[#00A89D]">☐</span>${esc(i)}</li>`).join('')}
            </ul>
          </div>`).join('')}
      </div>
      ${scriptCard('Post-open-house agent text',
        'Great open house today [Name]! Met [X] serious buyers — already following up with [names if appropriate]. Happy to co-host the next one or set up a pre-approval station. Let me know what would help most.',
        'Send within 48 hours while energy is high.')}
      <div class="flex flex-wrap gap-2 mb-2 mt-4">
        <button type="button" data-referral-bridge="vault:popby-open-house-kit" class="text-xs px-3 py-2 rounded-xl border border-[#00A89D] text-[#00A89D] font-semibold hover:bg-[#00A89D] hover:text-white transition">Open house pop-by kit →</button>
      </div>
      ${footerSave('HighImpact-OpenHouse', 'Save Open House Play')}
    `;
    attachHandlers(contentEl);
  }

  // ─── REALTOR TO 5 MORE ───────────────────────────────────────────────
  function renderRealtorTo5(contentEl) {
    const steps = [
      { n: '1', title: 'Earn the ask', desc: 'After 3+ successful files together, you\'ve earned the right to ask for introductions.', script: null },
      { n: '2', title: 'The question', desc: 'Ask for one specific introduction — not "any agents you know."', script: 'We\'ve had a great run on the last few deals. Who\'s one agent you respect that I should meet? I\'d love a warm intro if you\'re comfortable.' },
      { n: '3', title: 'Act fast', desc: 'Reach out within 48 hours referencing the mutual connection.', script: 'Hey [Name], [Mutual Agent] suggested I reach out — they spoke highly of your work in [area]. Would love to grab coffee and learn how I can support your buyers.' },
      { n: '4', title: 'Repeat the loop', desc: 'Once the new agent sends one file, repeat the process with them.', script: null },
      { n: '5', title: 'Close the loop', desc: 'Publicly thank the original agent for the introduction (social proof).', script: 'Huge thanks to [Agent] for the introduction to [New Agent] — already working on a scenario together. Grateful for great partners.' }
    ];
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-600">NETWORK EFFECT</span></div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Leverage your best relationships to grow your referral base exponentially — one strong realtor becomes five.</p>
      <div class="space-y-4 mb-6">
        ${steps.map((s) => `
          <div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
            <div class="flex gap-3">
              <div class="w-8 h-8 rounded-full bg-[#002B5C] text-white flex items-center justify-center text-sm font-bold shrink-0">${s.n}</div>
              <div class="flex-1">
                <div class="font-bold text-sm text-[#002B5C] dark:text-white">${esc(s.title)}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">${esc(s.desc)}</div>
                ${s.script ? `<div class="mt-2 text-sm italic">"${esc(s.script)}"</div>
                  <button type="button" data-referral-copy="${esc(s.script)}" class="mt-2 text-[10px] px-3 py-1 rounded-xl border border-purple-500 text-purple-700 hover:bg-purple-500 hover:text-white font-semibold"><i class="fas fa-copy mr-1"></i>Copy</button>` : ''}
              </div>
            </div>
          </div>`).join('')}
      </div>
      <div class="p-4 rounded-2xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 text-sm mb-6">
        <strong>Math:</strong> 3 top realtors × 1 intro each × 60-day onboarding = 3 new consistent sources per quarter. Compounds fast.
      </div>
      <div class="flex flex-wrap gap-2 mb-2">
        <button type="button" data-referral-bridge="play:60-day-realtor-onboarding" class="text-xs px-3 py-2 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition">60-Day onboarding for new intros →</button>
      </div>
      ${footerSave('HighImpact-NetworkEffect', 'Save Network Effect Strategy')}
    `;
    attachHandlers(contentEl);
  }

  // ─── RELATIONSHIP MANAGEMENT ───────────────────────────────────────────
  function renderRelationshipManagement(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#002B5C]/10 text-[#002B5C] dark:text-gray-300">LONG-TERM PARTNERSHIPS</span></div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Maintain strong partnerships and ask for more business without being pushy.</p>
      ${scriptCard('Best question to ask for more business',
        'What can I do to earn more of your business?',
        'Puts focus on them and what they need — not on you asking for favors.')}
      <div class="mt-4 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
        <div class="font-semibold text-sm mb-3">Healthy relationship habits</div>
        <ul class="text-sm space-y-2 text-gray-700 dark:text-gray-300">
          <li class="flex gap-2"><span class="text-[#00A89D]">☐</span>Regularly ask "How can I make working with me easier for you?"</li>
          <li class="flex gap-2"><span class="text-[#00A89D]">☐</span>Celebrate their wins publicly (social, events)</li>
          <li class="flex gap-2"><span class="text-[#00A89D]">☐</span>Be the first to call when something goes wrong on a file</li>
          <li class="flex gap-2"><span class="text-[#00A89D]">☐</span>Send value even when you don't need anything</li>
          <li class="flex gap-2"><span class="text-[#00A89D]">☐</span>Remember personal details and reference them</li>
        </ul>
      </div>
      ${footerSave('RelationshipManagement', 'Save Relationship Guidance')}
    `;
    attachHandlers(contentEl);
  }

  // ─── CO-MARKETING ASSETS ─────────────────────────────────────────────
  function renderCoMarketing(contentEl) {
    const assets = [
      { title: 'Buyer Guides & Checklists', desc: 'Co-branded First-Time Buyer Guide or Rate Buydown Explainer they send to their sphere.', effort: '2–3 hrs to create once', tip: 'Offer to customize with their logo and headshot.' },
      { title: 'Monthly Market Snapshot', desc: 'One-page PDF: rates + inventory for their main zip codes. Easy to brand.', effort: '30 min/month', tip: 'Batch for top 10 partners — personalize zip codes only.' },
      { title: 'Open House Toolkit', desc: 'Branded signage, flyers, and a Pre-Approval Station one-pager.', effort: 'Half day setup', tip: 'Pair with Open House Domination play.' },
      { title: 'Social Content Packs', desc: '4–5 carousel posts or Reels they repost with minimal editing.', effort: '1 hr/week batch', tip: 'Use your best-performing content from Pillar 5.' },
      { title: 'Joint Event Ideas', desc: 'Lunch & Learn, happy hours, first-time buyer seminars with titles and formats.', effort: 'Plan quarterly', tip: 'You handle financing content — they bring the audience.' }
    ];
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-600">VALUE-FIRST ASSETS</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 text-xs">CREATE ONCE · REUSE</span>
      </div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Ready-to-create co-marketing ideas that make partners look good — and keep you top of mind.</p>
      <div class="space-y-4 mb-6">
        ${assets.map((a) => `
          <div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
            <div class="flex flex-wrap justify-between gap-2 mb-1">
              <div class="font-bold text-sm text-[#002B5C] dark:text-white">${esc(a.title)}</div>
              <div class="text-[10px] font-semibold text-purple-600 uppercase">${esc(a.effort)}</div>
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">${esc(a.desc)}</div>
            <div class="text-[10px] text-gray-500 mt-1">${esc(a.tip)}</div>
          </div>`).join('')}
      </div>
      <div class="p-4 rounded-2xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 text-sm mb-6">
        <strong>Delivery rule:</strong> Never send an asset cold. Text first: "Put together something for your buyers — want me to send it over?"
      </div>
      <div class="flex flex-wrap gap-2 mb-2">
        <button type="button" data-referral-bridge="play:60-day-realtor-onboarding" class="text-xs px-3 py-2 rounded-xl border border-purple-500 text-purple-700 font-semibold hover:bg-purple-100 transition">60-day onboarding →</button>
        <button type="button" data-referral-bridge="play:open-house-domination" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Open house play →</button>
        <button type="button" data-referral-bridge="vault:content-30day-sprint" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Content sprint →</button>
      </div>
      ${footerSave('CoMarketingAssets', 'Save Asset Ideas')}
    `;
    attachHandlers(contentEl);
  }

  // ─── BUILDER TRAINING ──────────────────────────────────────────────────
  function renderBuilderTraining(contentEl) {
    const steps = [
      { n: '1', title: 'Lunch & Learn at Model Home', desc: 'Offer 20–30 min "Current Financing Options" session for the entire sales team. Bring lunch — they bring traffic.', script: 'I\'d love to do a quick lunch & learn for your sales team on current financing options — buydowns, new programs, and how to answer buyer rate questions confidently. I\'ll bring food, you bring the room.' },
      { n: '2', title: 'One-Pager for Every Visitor', desc: 'Create a simple financing options sheet they hand every walk-in. Co-branded with builder logo.', script: null },
      { n: '3', title: 'Same-Day Scenario Support', desc: 'Be available for active traffic — run scenarios on the spot for serious buyers.', script: 'I\'m happy to be on-call during your busy weekends. Text me a buyer scenario and I\'ll turn around numbers same day.' },
      { n: '4', title: 'Quarterly Refresher', desc: 'New program updates + Q&A. Keeps you the preferred lender as programs change.', script: 'Rates and programs shifted again — want me to do a 20-min refresher for the team before spring traffic picks up?' }
    ];
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#002B5C]/10 text-[#002B5C] dark:text-gray-300">BUILDER PARTNERSHIPS</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#F15A29]/10 text-[#F15A29]">PREFERRED LENDER PLAY</span>
      </div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Become the preferred lender by making the entire sales team smarter and more confident.</p>
      <div class="space-y-4 mb-6">
        ${steps.map((s) => `
          <div class="rounded-2xl border-l-4 border-[#002B5C] border border-gray-200 dark:border-gray-700 p-4">
            <div class="font-bold text-sm text-[#002B5C] dark:text-white mb-1">Step ${s.n}: ${esc(s.title)}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">${esc(s.desc)}</div>
            ${s.script ? `<div class="mt-2 text-sm italic">"${esc(s.script)}"</div>
              <button type="button" data-referral-copy="${esc(s.script)}" class="mt-2 text-[10px] px-3 py-1 rounded-xl border border-[#002B5C] text-[#002B5C] hover:bg-[#002B5C] hover:text-white font-semibold"><i class="fas fa-copy mr-1"></i>Copy pitch</button>` : ''}
          </div>`).join('')}
      </div>
      <div class="p-4 rounded-2xl bg-[#002B5C]/5 border border-[#002B5C]/20 text-sm mb-6">
        <strong>Why this wins:</strong> Builders don't want the lowest rate — they want certainty, speed, and a lender who makes their sales team look competent.
      </div>
      <div class="flex flex-wrap gap-2 mb-2">
        <button type="button" data-referral-bridge="vault:objection-rates" class="text-xs px-3 py-2 rounded-xl border border-amber-500 text-amber-700 font-semibold hover:bg-amber-100 transition">Rate objection scripts →</button>
        <button type="button" data-referral-bridge="weekly" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Weekly Win Plan →</button>
      </div>
      ${footerSave('HighImpact-BuilderTraining', 'Save Builder Sequence')}
    `;
    attachHandlers(contentEl);
  }

  // ─── PROFESSIONAL REFERRAL REQUEST ───────────────────────────────────
  function renderProfessionalReferral(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-600">ATTORNEYS · PLANNERS · INSURANCE</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 text-xs">LOW PRESSURE</span>
      </div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Professional language for non-realtor referral partners — respectful, reciprocal, never salesy.</p>
      <div class="space-y-4 mb-6">
        ${scriptCard('After a successful closing',
          'Thank you for the introduction. The closing went smoothly. If you have other clients who would benefit from the same level of communication and speed, I\'d be grateful for the opportunity.',
          'Send within 48 hours of closing. Reference something specific about the file.')}
        ${scriptCard('Quarterly check-in',
          'I was thinking about the work we did together earlier this year. Is there anything I can do to support your clients or your practice right now?',
          'No ask embedded — pure value and support.')}
        ${scriptCard('Introduction request (after 2+ files)',
          'We\'ve had a great experience working together. If there\'s a colleague in your network who works with similar clients, I\'d welcome an introduction — happy to return the favor anytime.',
          'Only after you\'ve proven value on multiple files.')}
        ${scriptCard('Reciprocal offer',
          'I have a client who needs [estate planning / insurance review / legal guidance]. Would you be open to an introduction? I always want to send my clients to people I trust.',
          'Reciprocity builds the relationship before you ask.')}
      </div>
      <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/20 border text-sm mb-6">
        <strong>Professional partner rule:</strong> These relationships move slower than realtors. Expect 6–12 months before consistent referrals. Patience + value wins.
      </div>
      <div class="flex flex-wrap gap-2 mb-2">
        <button type="button" data-referral-bridge="play:relationship-management" class="text-xs px-3 py-2 rounded-xl border border-[#00A89D] text-[#00A89D] font-semibold hover:bg-[#00A89D]/5 transition">Relationship habits →</button>
        <button type="button" data-referral-bridge="play:weekly-value-cadence" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Value cadence →</button>
      </div>
      ${footerSave('HighImpact-ProfessionalAsk', 'Save Professional Scripts')}
    `;
    attachHandlers(contentEl);
  }

  // ─── PARTNER TIERS (A+ / B / C) ──────────────────────────────────────
  function renderPartnerTierAPlus(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#002B5C]/10 text-[#002B5C]">TOP 10–20 PARTNERS</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">WHITE-GLOVE CADENCE</span>
      </div>
      ${whyBox('These 10–20 People Pay Your Mortgage',
        'Your true A+ partners send 5+ referrals per year or represent outsized strategic value. They deserve concierge treatment — not because you are desperate, but because protecting this tier is how top producers stay at the top.',
        'navy')}
      ${sectionTitle('How to Identify A+ Partners')}
      ${bulletList([
        '<strong>5+ referrals</strong> in the last 12 months (or 3+ with very high average loan size)',
        'They call you <strong>first</strong> — not second or third — on new deals',
        'They introduce you to other top producers in their network',
        'They invite you to client-facing moments (listings, open houses, closings)',
        'Losing them would materially hurt your annual production goal'
      ])}
      ${sectionTitle('White-Glove Cadence (Protect at All Costs)')}
      <div class="mb-6">
        ${cadenceCard('Personal call or coffee every 3–4 weeks — not just when you need something')}
        ${cadenceCard('Handwritten note or meaningful local gift 3–4 times per year (not generic swag)')}
        ${cadenceCard('Birthday + work anniversary personal video')}
        ${cadenceCard('Same-hour updates on every active file + proactive check-in when quiet 2+ weeks')}
        ${cadenceCard('First invite to every client appreciation or mastermind event')}
        ${cadenceCard('Year-end personalized video + small gift thanking them for the year')}
      </div>
      ${sectionTitle('Ready-to-Use Scripts (Copy + Save)')}
      <div class="space-y-4 mb-6">
        ${scriptCard('Quarterly Personal Check-In', 'Hey [Agent Name] — just wanted to check in. How is business treating you? Anything coming up I can help with — even if it is just a second opinion on a tricky scenario.', 'No ask embedded — pure relationship maintenance.', 'A+ Partner Check-In')}
        ${scriptCard('Proactive Quiet-File Check-In', 'Hey [Name] — no file update today, just checking in. Want to make sure you always know I am here even when things are quiet. Anything on the horizon I can get ahead of for you?', 'Send when you have not heard from them in 2+ weeks.', 'A+ Partner Proactive Check-In')}
        ${scriptCard('Birthday / Anniversary Video Script', 'Hey [Name] — happy [birthday / work anniversary]! Grateful for our partnership this year. You have sent some amazing clients my way and I do not take that for granted. Hope you get to celebrate properly today.', 'Record 15–20 in one batch for your A+ list.', 'A+ Partner Birthday Video')}
        ${scriptCard('Year-End Thank You', 'As the year wraps up — thank you for trusting me with [X] clients in [year]. You made my job easy and your clients were a pleasure. Excited for what we build together next year.', 'Send first week of December to every A+ partner.', 'A+ Partner Year-End Thank You')}
        ${scriptCard('VIP Event Invite', 'I am hosting a small [event name] next month and you are at the top of my invite list. Would love to have you there — bring a colleague if you want. Low-key, great people, no pitches.', 'Invite 7–10 days before the wider list.', 'A+ Partner VIP Event Invite')}
      </div>
      ${proTip('These partners should feel like you only have five clients total. If you are too busy to nurture A+ relationships, something else on your calendar needs to go — not these touches.')}
      ${bridgeRow([
        { label: 'Partner Mastermind Events', action: 'event:partner-mastermind', primary: true },
        { label: 'Realtor Primary Playbook', action: 'referral:realtors' },
        { label: 'Turn 1 Realtor Into 5 More', action: 'play:realtor-to-5-more' }
      ])}
      ${footerSave('Tier-A+', 'Save A+ Tier Playbook')}
    `;
    attachHandlers(contentEl);
  }

  function renderPartnerTierB(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">GROWTH TIER</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600">1–4 REFERRALS / YEAR</span>
      </div>
      ${whyBox('The Partners You Are Actively Trying to Promote',
        'B partners send 1–4 referrals per year and show growth potential. Your job is to deliver A+ level service on their files while using scalable touches to earn the next referral — and eventually promote them to A+.',
        'teal')}
      ${sectionTitle('Promotion Signals (When to Move B → A+)')}
      ${bulletList([
        'They referred you <strong>twice in 6 months</strong> without being asked',
        'They respond to your value touches and engage in conversation',
        'They start calling you before other lenders on time-sensitive deals',
        'They attended your event and brought a colleague'
      ])}
      ${sectionTitle('Scalable Growth Cadence')}
      <div class="mb-6">
        ${cadenceCard('Monthly value touch (30-sec market video, useful article, or quick win they can use)')}
        ${cadenceCard('Quarterly personal note or small gift')}
        ${cadenceCard('Invite to 1–2 client appreciation or partner events per year')}
        ${cadenceCard('White-glove execution on every file — treat B partners like A+ on active deals')}
        ${cadenceCard('Light, natural referral ask after a particularly smooth closing')}
      </div>
      ${sectionTitle('Ready-to-Use Scripts (Copy + Save)')}
      <div class="space-y-4 mb-6">
        ${scriptCard('Monthly Value Touch', 'Quick market note for your buyers — inventory in [Area] is up and we are seeing more negotiation room than 90 days ago. Happy to run real numbers on any active deal. No pitch, just data you can use with clients.', 'Batch the body — personalize area only.', 'B Partner Value Touch')}
        ${scriptCard('Post-Smooth-Close Ask', 'Really enjoyed working with you on [Client]. If you have anyone else on the horizon who needs the same experience, I would love to help. Either way — thanks for trusting me.', 'Send within 48 hours of closing.', 'B Partner Post-Close Ask')}
        ${scriptCard('Event Invitation', 'Hosting a small client appreciation event next month — would love to have you there. Good food, good people, no business talk. Let me know if you are in and feel free to bring a colleague.', 'Pair with Getting People to Show Up playbook for invites.', 'B Partner Event Invite')}
        ${scriptCard('Quarterly Personal Note', 'Hey [Name] — just a quick note to say I appreciate our partnership. You sent some great clients my way and I do not take it lightly. Hope Q[X] is treating you well.', 'Handwritten version hits harder for rising B partners.', 'B Partner Quarterly Note')}
      </div>
      ${goalBox('Move 3–5 B partners into A+ every year. The lever is over-delivery on files + consistent value between files.')}
      ${bridgeRow([
        { label: 'Client Appreciation Events', action: 'event:client-appreciation', primary: true },
        { label: 'Weekly Value Cadence', action: 'play:weekly-value-cadence' },
        { label: 'A+ Playbook (Promotion Target)', action: 'tier:A+' }
      ])}
      ${footerSave('Tier-B', 'Save B Tier Playbook')}
    `;
    attachHandlers(contentEl);
  }

  function renderPartnerTierC(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#F15A29]/10 text-[#F15A29]">PROSPECTS / NEW</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600">LOW TIME · HIGH IMPACT</span>
      </div>
      ${whyBox('Low Time, High-Impact Prospecting',
        'New or low-volume sources. You cannot afford heavy one-on-one time on everyone here — but you CAN afford a full audition on the first file. That single investment separates partners who promote themselves from one-and-done referrals.',
        'orange')}
      ${sectionTitle('Who Belongs in C (For Now)')}
      ${bulletList([
        'Met once at an event — no file yet',
        'Sent exactly one referral ever',
        'Responsive to email but not yet engaged personally',
        'High potential on paper but unproven in practice'
      ])}
      ${sectionTitle('Efficient Conversion System')}
      <div class="mb-6">
        ${cadenceCard('<strong>Day 0:</strong> Add to CRM + tag as C-tier + add to value newsletter')}
        ${cadenceCard('<strong>First file:</strong> Run the full 60-day onboarding sequence — treat this like an A+ audition')}
        ${cadenceCard('<strong>Post-close:</strong> If they respond positively → promote to B. If silent → stay on automated touches only')}
        ${cadenceCard('<strong>Quarterly:</strong> One light personal touch to entire C list (batched, 30 min)')}
      </div>
      ${sectionTitle('Ready-to-Use Scripts (Copy + Save)')}
      <div class="space-y-4 mb-6">
        ${scriptCard('Day 0 Welcome (Text or Video)', 'Hey [Agent Name] — [Your Name] here. Thanks for trusting me with [Client Name]. Quick overview of how I work: same-hour updates on milestones, Thursday check-ins even when quiet, and I will make you look brilliant to your client. Here is my one-pager on my process — reach out anytime.', 'Send same day the file arrives.', 'C Partner Welcome')}
        ${scriptCard('Post-Close Promotion Check', 'Hope [Client] closing went smoothly on your end too. How did the process feel from your side? If you have anyone else coming up, I would love to deliver the same experience.', 'Their answer tells you B vs stay-C.', 'C Partner Post-Close Check')}
        ${scriptCard('Quarterly Light Touch (Batchable)', 'Hey [Name] — quick quarterly note. Still here if any of your clients need help on the mortgage side. Hope business is good.', 'Personalize name only — send to full C list in one sitting.', 'C Partner Quarterly Batch')}
      </div>
      ${proTip('Do not promote to B based on potential alone — promote based on response. A C partner who engages after a great first file is your next B partner.')}
      ${bridgeRow([
        { label: '60-Day Onboarding Sequence', action: 'play:60-day-realtor-onboarding', primary: true },
        { label: 'First 30 Days Checklist', action: 'play:first-30-days-checklist' },
        { label: 'B Playbook (Promotion Target)', action: 'tier:B' }
      ])}
      ${footerSave('Tier-C', 'Save C Tier Playbook')}
    `;
    attachHandlers(contentEl);
  }

  const TIER_RENDERERS = {
    'a-plus': renderPartnerTierAPlus,
    b: renderPartnerTierB,
    c: renderPartnerTierC
  };

  const RENDERERS = {
    '60-day-realtor-onboarding': render60DayOnboarding,
    'first-30-days-checklist': renderFirst30Days,
    'referral-objections': renderReferralObjections,
    'weekly-value-cadence': renderWeeklyCadence,
    'open-house-domination': renderOpenHouse,
    'realtor-to-5-more': renderRealtorTo5,
    'relationship-management': renderRelationshipManagement,
    'co-marketing-assets': renderCoMarketing,
    'builder-training': renderBuilderTraining,
    'professional-referral-request': renderProfessionalReferral
  };

  window.renderRichReferralPlay = function renderRichReferralPlay(key, contentEl) {
    if (!key || !contentEl) return false;
    const fn = RENDERERS[key];
    if (!fn) return false;
    fn(contentEl);
    return true;
  };

  window.renderRichPartnerTierModal = function renderRichPartnerTierModal(tier, contentEl) {
    const key = normalizePartnerTier(tier);
    if (!key || !contentEl) return false;
    const fn = TIER_RENDERERS[key];
    if (!fn) return false;
    fn(contentEl);
    return true;
  };

  window.getPartnerTierModalTitle = function getPartnerTierModalTitle(tier) {
    const key = normalizePartnerTier(tier);
    return key ? PARTNER_TIER_TITLES[key] : null;
  };

  window.__REFERRAL_MODALS_EXPORTS = {
    renderRichReferralPlay: window.renderRichReferralPlay,
    renderRichPartnerTierModal: window.renderRichPartnerTierModal,
    getPartnerTierModalTitle: window.getPartnerTierModalTitle
  };

  window.restoreReferralModals = function restoreReferralModals() {
    const exp = window.__REFERRAL_MODALS_EXPORTS;
    if (!exp) return;
    Object.keys(exp).forEach(function (k) {
      window[k] = exp[k];
    });
  };

  console.log('%c[referral-rich-modals] Premium plays + partner tiers ready (' +
    Object.keys(RENDERERS).length + ' plays, ' +
    Object.keys(TIER_RENDERERS).length + ' tiers)', 'color:#00A89D');
})();