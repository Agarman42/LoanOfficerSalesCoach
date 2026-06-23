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
          } else if ((action === 'referral:fellow-agents' || action === 'referral:realtors') && typeof window.openReferralModal === 'function') {
            window.openReferralModal('FellowAgents');
          } else if (action?.startsWith('referral:') && typeof window.openReferralModal === 'function') {
            const partnerKey = action.split(':').slice(1).join(':');
            const partnerMap = {
              lenders: 'Lenders',
              title: 'Title',
              builders: 'Builders',
              'financial-planners': 'Financial Planners',
              attorneys: 'Attorneys',
              'insurance-agents': 'Insurance Agents',
              other: 'Other'
            };
            window.openReferralModal(partnerMap[partnerKey] || partnerKey);
          }
        }, 220);
      });
    });
  }

  // ─── 60-DAY AGENT PARTNERSHIP ONBOARDING ─────────────────────────────
  function render60DayOnboarding(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">FLAGSHIP SEQUENCE</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#F15A29]/10 text-[#F15A29]">60 DAYS → CONSISTENT REFERRALS</span>
      </div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-2">Turn a brand-new partner relationship — fellow agent, lender, title rep, or builder contact — into a consistent referral source in 60 days.</p>
      <p class="text-sm text-gray-500 mb-6">Value-first every touch. No asks until Day 30. Earn trust before you ask for referrals.</p>
      <div class="space-y-3 mb-6">
        ${dayCard('Days 1–2', 'Foundation', 'Personal intro call or text. Offer a quick market pulse for their farm area or a useful buyer resource — no pitch.', 'Hey [Name], I\'m [Your Name] — excited to connect. I work a lot in [area] and put together quick market notes for partners I collaborate with. Happy to share anytime — no strings.')}
        ${dayCard('Day 7', 'First Value Drop', 'Send a high-value co-brandable neighborhood market snapshot (1 page, their zip codes or farm areas).', 'Put together a quick market snapshot for [area] — thought it might be useful for your clients and sphere. Happy to co-brand with your logo.')}
        ${dayCard('Day 14', 'Relationship Deepening', 'Coffee or lunch — learn their business, pain points, and ideal client profile. Listen 80%, talk 20%.', null)}
        ${dayCard('Day 21', 'Co-Branded Asset + Offer', 'Deliver one co-branded buyer or seller guide. Offer to co-host an open house, lunch & learn, or intro to your lender network.', 'Created a co-branded first-time buyer guide — want me to send the PDF? Also happy to co-host your next open house or intro you to my go-to lender if that\'s useful.')}
        ${dayCard('Day 30', 'Relationship Review', 'The only early ask: "How can I make working with me easier for you?"', 'We\'ve been connected about a month — genuinely curious: what can I do to make your life easier when you have buyers or sellers who need a great agent in my areas?')}
        ${dayCard('Day 45', 'Public Win', 'Tag them in a social shoutout celebrating a smooth closing, great referral, or partnership moment.', null)}
        ${dayCard('Day 60', 'Formal Feedback + Introduction', 'Ask for feedback on the relationship. Request one warm introduction to a professional they respect.', 'Really value our partnership so far. Two quick things: (1) honest feedback on how I can improve, and (2) is there one professional you respect — agent, lender, or title — that I should meet?')}
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
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">The critical first month with any new referral partner — fellow agents, lenders, title, builders, attorneys — practical and actionable.</p>
      <div class="space-y-4 mb-6">
        ${weekCard('Week 1', 'Foundation', [
          'Send personalized welcome email + your direct contact info',
          'Add to CRM with Partner Type + Tier tags',
          'Add to newsletter or market-update list (if appropriate)',
          'Send first value touch — neighborhood market update or useful buyer/seller resource'
        ], 'teal')}
        ${weekCard('Week 2', 'Relationship Building', [
          'Personal text or call — learn their business, referral style, and goals',
          'Offer listing insights, buyer support, or a warm intro to your trusted vendors',
          'Send second value touch — co-branded asset or strategic introduction'
        ], 'navy')}
        ${weekCard('Week 3–4', 'Momentum', [
          'Public social shoutout (tag them)',
          'Offer to co-host something — open house, client event, or lunch & learn',
          'Send third value touch',
          'Light ask: "What can I do to support you and your clients right now?"'
        ], 'orange')}
      </div>
      <div class="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 text-sm mb-6">
        <strong>Pair with:</strong> The 60-Day Agent Partnership Onboarding Sequence for partners you want to turn into top-tier referral sources.
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
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Strong, natural responses when partners hesitate to send you referrals — value-first, never pushy. Match the Giftology philosophy.</p>
      <div class="space-y-4 mb-6">
        ${scriptCard('"I already have an agent I use."',
          'Totally fair. Most of the partners I work best with keep a short list of agents for different situations — relocation, luxury, investor deals. I\'d love to be the one you call when local market expertise, communication, or deal strategy is the difference between closing and losing the client.',
          'Position as specialist backup, not replacement.')}
        ${scriptCard('"I don\'t send clients to agents I don\'t know."',
          'Makes sense — your reputation is on the line. I\'m not asking for a blind referral. Let\'s do one coffee, I\'ll send you a one-pager on how I work, and you decide after you\'ve seen how I treat your people.',
          'Lower the risk with a low-commitment first step.')}
        ${scriptCard('"My clients expect me to pick the agent."',
          'That\'s exactly why I want to earn a spot on your bench. Let me prove it on one client — white-glove updates, no drama, and I\'ll make you look brilliant to your client.',
          'Respect their gatekeeper role completely.')}
        ${scriptCard('"I only refer when I get something back."',
          'Fair. The best relationships are reciprocal. I\'m happy to send you sellers or buyers in my sphere whenever it makes sense — and I\'ll always make your introduction easy.',
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
      { w: 'Week 1', touch: 'Short neighborhood market video or text update tailored to their farm area' },
      { w: 'Week 2', touch: 'Co-branded buyer guide, seller checklist, or open house flyer' },
      { w: 'Week 3', touch: 'Personal text about something relevant in their life/business' },
      { w: 'Week 4', touch: 'Valuable introduction or resource they can pass to clients (no ask)' },
      { w: 'Week 5–6', touch: 'Repeat your highest-performing digital touch' },
      { w: 'Week 7', touch: 'Light personal outreach — coffee invite, listing congrats, or deal win' },
      { w: 'Week 8', touch: 'Public shoutout or co-branded social content' }
    ];
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-teal-500/10 text-teal-600">REPEATABLE SYSTEM</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 text-xs">MAX 20% ASK-ORIENTED</span>
      </div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-2">Stay top-of-mind with agents, lenders, title, builders, and other partners without feeling salesy.</p>
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
      { phase: 'Before', items: ['Prep listing — staging check, signage, flyers, and lead-capture plan', 'Invite lender or title partner to add value (optional pre-qual station)', 'Post co-branded open house story 24 hrs prior', 'Confirm showing route, parking, and partner roles'] },
      { phase: 'During', items: ['Warm greet every visitor — qualify buyers and capture contact info', 'Run the property tour with confidence; answer neighborhood questions', 'Introduce lender partner for serious buyers when appropriate', 'Take notes on buyer profiles, timelines, and objections for follow-up'] },
      { phase: 'After (48 hrs)', items: ['Thank lender/title partners who showed up + summarize leads captured', 'Follow up every qualified buyer with next steps', 'Post recap for sphere and tag partners who helped', 'Log all contacts in CRM with open house source tag'] },
      { phase: 'Follow-up (Week 2)', items: ['Joint buyer event or neighborhood tour offer with partners', 'Share which leads are actively touring or writing offers', 'Ask partners: "What would make the next open house even better?"', 'Send listing agent or seller a professional recap if applicable'] }
    ];
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#F15A29]/10 text-[#F15A29]">DUAL WIN PLAY</span></div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Turn every open house you run into buyer leads, sphere growth, and stronger partner relationships.</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        ${phases.map((p) => `
          <div class="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
            <div class="font-bold text-sm text-[#002B5C] dark:text-white mb-2"><i class="fas fa-flag text-[#F15A29] mr-1"></i>${esc(p.phase)}</div>
            <ul class="text-sm space-y-1 text-gray-700 dark:text-gray-300">
              ${p.items.map((i) => `<li class="flex gap-2"><span class="text-[#00A89D]">☐</span>${esc(i)}</li>`).join('')}
            </ul>
          </div>`).join('')}
      </div>
      ${scriptCard('Post-open-house partner text',
        'Great open house today! Met [X] serious buyers — already following up. Thanks for [bringing the pre-qual station / spreading the word / co-hosting]. Let\'s do the next one together — what would help most?',
        'Send within 48 hours while energy is high.')}
      <div class="flex flex-wrap gap-2 mb-2 mt-4">
        <button type="button" data-referral-bridge="vault:popby-open-house-kit" class="text-xs px-3 py-2 rounded-xl border border-[#00A89D] text-[#00A89D] font-semibold hover:bg-[#00A89D] hover:text-white transition">Open house pop-by kit →</button>
      </div>
      ${footerSave('HighImpact-OpenHouse', 'Save Open House Play')}
    `;
    attachHandlers(contentEl);
  }

  // ─── PARTNER TO 5 MORE ───────────────────────────────────────────────
  function renderRealtorTo5(contentEl) {
    const steps = [
      { n: '1', title: 'Earn the ask', desc: 'After 3+ successful referrals exchanged, you\'ve earned the right to ask for introductions.', script: null },
      { n: '2', title: 'The question', desc: 'Ask for one specific introduction — not "anyone you know."', script: 'We\'ve had a great run sending business each other\'s way. Who\'s one agent, lender, or title pro you respect that I should meet? I\'d love a warm intro if you\'re comfortable.' },
      { n: '3', title: 'Act fast', desc: 'Reach out within 48 hours referencing the mutual connection.', script: 'Hey [Name], [Mutual Partner] suggested I reach out — they spoke highly of your work in [area]. Would love to grab coffee and learn how I can support your clients.' },
      { n: '4', title: 'Repeat the loop', desc: 'Once the new partner sends one referral, repeat the process with them.', script: null },
      { n: '5', title: 'Close the loop', desc: 'Publicly thank the original partner for the introduction (social proof).', script: 'Huge thanks to [Partner] for the introduction to [New Partner] — already collaborating on a client together. Grateful for great partners.' }
    ];
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-600">NETWORK EFFECT</span></div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Leverage your best partner relationships to grow your referral base exponentially — one strong agent, lender, or title contact becomes five.</p>
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
        <strong>Math:</strong> 3 top partners × 1 intro each × 60-day onboarding = 3 new consistent referral sources per quarter. Compounds fast.
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
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Maintain strong partnerships with agents, lenders, title, and builders — and earn more referrals without being pushy.</p>
      ${scriptCard('Best question to ask for more referrals',
        'What can I do to earn more of your referrals?',
        'Puts focus on them and what they need — not on you asking for favors.')}
      <div class="mt-4 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
        <div class="font-semibold text-sm mb-3">Healthy relationship habits</div>
        <ul class="text-sm space-y-2 text-gray-700 dark:text-gray-300">
          <li class="flex gap-2"><span class="text-[#00A89D]">☐</span>Regularly ask "How can I make working with me easier for you and your clients?"</li>
          <li class="flex gap-2"><span class="text-[#00A89D]">☐</span>Celebrate their wins publicly (closings, listings, social, events)</li>
          <li class="flex gap-2"><span class="text-[#00A89D]">☐</span>Be the first to call when something goes wrong on a transaction</li>
          <li class="flex gap-2"><span class="text-[#00A89D]">☐</span>Send value even when you don't need a referral</li>
          <li class="flex gap-2"><span class="text-[#00A89D]">☐</span>Remember personal details and reference them in outreach</li>
        </ul>
      </div>
      ${footerSave('RelationshipManagement', 'Save Relationship Guidance')}
    `;
    attachHandlers(contentEl);
  }

  // ─── CO-MARKETING ASSETS ─────────────────────────────────────────────
  function renderCoMarketing(contentEl) {
    const assets = [
      { title: 'Buyer Guides & Checklists', desc: 'Co-branded First-Time Buyer Guide, Seller Prep Checklist, or Neighborhood Insider Guide they pass to clients.', effort: '2–3 hrs to create once', tip: 'Offer to customize with their logo and headshot.' },
      { title: 'Monthly Market Snapshot', desc: 'One-page PDF: inventory, pricing trends, and days-on-market for their main zip codes. Easy to co-brand.', effort: '30 min/month', tip: 'Batch for top 10 partners — personalize zip codes only.' },
      { title: 'Open House Toolkit', desc: 'Co-branded flyers, directional signs, lead-capture sheets, and partner thank-you cards.', effort: 'Half day setup', tip: 'Pair with Open House Domination play.' },
      { title: 'Social Content Packs', desc: '4–5 carousel posts or Reels partners can repost — market updates, buyer tips, listing wins.', effort: '1 hr/week batch', tip: 'Use your best-performing content from Pillar 5.' },
      { title: 'Joint Event Ideas', desc: 'Lunch & Learn, happy hours, first-time buyer seminars, and neighborhood tours with clear roles and formats.', effort: 'Plan quarterly', tip: 'You handle market education and buyer support — they bring the audience or vendor expertise.' }
    ];
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-600">VALUE-FIRST ASSETS</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 text-xs">CREATE ONCE · REUSE</span>
      </div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Ready-to-create co-marketing assets you offer partners — buyer guides, open house flyers, joint events — that make them look good and keep you top of mind.</p>
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
        <strong>Delivery rule:</strong> Never send an asset cold. Text first: "Put together something for your clients — want me to send it over?"
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
      { n: '1', title: 'Lunch & Learn at Model Home', desc: 'Offer 20–30 min "Local Market & Buyer Journey" session for the entire sales team. Bring lunch — they bring traffic.', script: 'I\'d love to do a quick lunch & learn for your sales team on what buyers are asking right now — neighborhood trends, negotiation tips, and how to set realistic expectations. I\'ll bring food, you bring the room.' },
      { n: '2', title: 'One-Pager for Every Visitor', desc: 'Create a simple neighborhood guide or buyer roadmap they hand every walk-in. Co-branded with builder logo.', script: null },
      { n: '3', title: 'Same-Day Buyer Support', desc: 'Be available for active traffic — answer buyer questions, schedule showings, and connect serious buyers with your lender partner.', script: 'I\'m happy to be on-call during your busy weekends. Text me a buyer question and I\'ll respond same day — or connect them with my go-to lender for pre-qual.' },
      { n: '4', title: 'Quarterly Refresher', desc: 'Market update + Q&A. Keeps you the go-to agent as inventory and buyer behavior shifts.', script: 'The market shifted again in [area] — want me to do a 20-min refresher for the team before spring traffic picks up?' }
    ];
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#002B5C]/10 text-[#002B5C] dark:text-gray-300">BUILDER PARTNERSHIPS</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#F15A29]/10 text-[#F15A29]">GO-TO AGENT PLAY</span>
      </div>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Become the go-to agent for builder sales teams through market education, buyer support, and reliable follow-through.</p>
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
        <strong>Why this wins:</strong> Builders don't want another business card — they want an agent who educates buyers, communicates clearly, and makes their sales team look competent.
      </div>
      <div class="flex flex-wrap gap-2 mb-2">
        <button type="button" data-referral-bridge="vault:objection-gain-partner-business" class="text-xs px-3 py-2 rounded-xl border border-amber-500 text-amber-700 font-semibold hover:bg-amber-100 transition">Partner objection scripts →</button>
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
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Professional language for attorneys, planners, insurance, lenders, and title partners who send you referrals — respectful, reciprocal, never salesy.</p>
      <div class="space-y-4 mb-6">
        ${scriptCard('After a successful closing',
          'Thank you for the referral. The transaction went smoothly and your client was a pleasure to work with. If you have other clients who would benefit from the same level of communication and advocacy, I\'d be grateful for the opportunity.',
          'Send within 48 hours of closing. Reference something specific about the transaction.')}
        ${scriptCard('Quarterly check-in',
          'I was thinking about the referral you sent earlier this year. Is there anything I can do to support your clients or your practice right now?',
          'No ask embedded — pure value and support.')}
        ${scriptCard('Introduction request (after 2+ referrals)',
          'We\'ve had a great experience working together. If there\'s a colleague in your network who works with similar clients, I\'d welcome an introduction — happy to return the favor anytime.',
          'Only after you\'ve proven value on multiple referrals.')}
        ${scriptCard('Reciprocal offer',
          'I have a client who needs [estate planning / insurance review / legal guidance / lending support]. Would you be open to an introduction? I always want to send my clients to people I trust.',
          'Reciprocity builds the relationship before you ask.')}
      </div>
      <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/20 border text-sm mb-6">
        <strong>Professional partner rule:</strong> These relationships move slower than agent-to-agent referrals. Expect 6–12 months before consistent referrals. Patience + value wins.
      </div>
      <div class="flex flex-wrap gap-2 mb-2">
        <button type="button" data-referral-bridge="play:relationship-management" class="text-xs px-3 py-2 rounded-xl border border-[#00A89D] text-[#00A89D] font-semibold hover:bg-[#00A89D]/5 transition">Relationship habits →</button>
        <button type="button" data-referral-bridge="play:weekly-value-cadence" class="text-xs px-3 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition">Value cadence →</button>
      </div>
      ${footerSave('HighImpact-ProfessionalAsk', 'Save Professional Scripts')}
    `;
    attachHandlers(contentEl);
  }

  // ─── PARTNER TYPE PLAYBOOKS (Fellow Agents, Lenders, Title, etc.) ───
  const PARTNER_TITLES = {
    'fellow-agents': 'Fellow Agents & Co-Broke Partners — Playbook',
    lenders: 'Lenders & Mortgage Partners — Playbook',
    title: 'Title & Escrow Partners — Playbook',
    builders: 'Builders — New Construction Playbook',
    'financial-planners': 'Financial Planners & CPAs — HNW Playbook',
    attorneys: 'Attorneys — Trust & Referral Protocol Playbook',
    'insurance-agents': 'Insurance Agents — Bundling & Joint Touches Playbook',
    other: 'Other Professionals — Adaptable Outreach Playbook'
  };

  function normalizePartnerType(type) {
    const raw = String(type || '').trim();
    const lower = raw.toLowerCase();
    if (lower === 'fellowagents' || lower === 'fellow agents' || lower === 'realtors' || lower === 'realtor') return 'fellow-agents';
    if (lower === 'lenders' || lower === 'lender' || lower === 'mortgage') return 'lenders';
    if (lower === 'title' || lower === 'escrow') return 'title';
    if (lower === 'builders' || lower === 'builder') return 'builders';
    if (lower === 'financial planners' || lower === 'financial-planners' || lower === 'cpa' || lower === 'cpas') return 'financial-planners';
    if (lower === 'attorneys' || lower === 'attorney') return 'attorneys';
    if (lower === 'insurance agents' || lower === 'insurance-agents' || lower === 'insurance') return 'insurance-agents';
    if (lower === 'other') return 'other';
    return null;
  }

  function renderPartnerPlaybook(contentEl, cfg) {
    contentEl.innerHTML = `
      ${cfg.badges ? `<div class="mb-4 flex flex-wrap gap-2">${cfg.badges}</div>` : ''}
      ${whyBox(cfg.whyLabel, cfg.whyText, cfg.accent || 'teal')}
      ${cfg.sectionTitle ? sectionTitle(cfg.sectionTitle) : ''}
      ${cfg.bullets ? bulletList(cfg.bullets) : ''}
      ${cfg.scripts ? `<div class="space-y-4 mb-6">${cfg.scripts.map((s) => scriptCard(s.title, s.script, s.tip, s.saveKey)).join('')}</div>` : ''}
      ${cfg.proTip ? proTip(cfg.proTip) : ''}
      ${cfg.bridges ? bridgeRow(cfg.bridges) : ''}
      ${footerSave(cfg.saveKey, cfg.saveLabel || 'Save Playbook')}
    `;
    attachHandlers(contentEl);
  }

  function renderPartnerFellowAgents(contentEl) {
    renderPartnerPlaybook(contentEl, {
      badges: '<span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">CO-BROKE ENGINE</span>',
      whyLabel: 'Why Co-Broke Relationships Compound',
      whyText: 'Your fellow agents are both competitors and collaborators. The agents who show up reliably on co-broke files, communicate proactively, and make the other side look good earn referrals that no marketing spend can buy. One great co-broke experience often turns into years of mutual business.',
      sectionTitle: 'Core Plays & Scripts',
      scripts: [
        { title: 'Co-Broke Kickoff Text', script: 'Hey [Agent Name] — excited to co-broke this one with you on [address]. I\'ll keep you copied on every milestone from my side and loop in our lender partner as needed. What\'s the best way for us to stay in sync — text, email, or a quick call at offer acceptance?', tip: 'Send within hours of offer acceptance.', saveKey: 'Partner: Co-Broke Kickoff' },
        { title: 'Post-Close Co-Broke Thank You', script: 'Great working with you on [address] — [Client] is thrilled and I hope the closing felt smooth on your end too. If you ever have buyers or sellers in [area] who need the same white-glove experience, I\'d love to return the favor.', tip: 'Follow with a handwritten note within 48 hours.', saveKey: 'Partner: Co-Broke Thank You' },
        { title: 'Open House Co-Broke Offer', script: 'I\'m holding an open house at [address] Saturday — would love to have you stop by if you have buyers in the area. Happy to co-broke any serious interest and keep communication tight from day one.', tip: 'Builds goodwill before you need a referral.', saveKey: 'Partner: Open House Co-Broke' }
      ],
      proTip: 'After every smooth co-broke, send a handwritten note within 48 hours. Agents remember who made them look good — and they refer accordingly.',
      bridges: [
        { label: '60-Day Partner Onboarding', action: 'play:60-day-realtor-onboarding', primary: true },
        { label: 'Partner Objections', action: 'play:referral-objections' },
        { label: 'Open House Domination', action: 'play:open-house-domination' }
      ],
      saveKey: 'Partner-FellowAgents',
      saveLabel: 'Save Co-Broke Playbook'
    });
  }

  function renderPartnerLenders(contentEl) {
    renderPartnerPlaybook(contentEl, {
      badges: '<span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#002B5C]/10 text-[#002B5C] dark:text-gray-300">TRANSACTION POWER</span>',
      whyLabel: 'Your Lender Bench Wins Deals',
      whyText: 'Top agents don\'t have one lender — they have a bench of 2–3 loan officers who communicate fast, pre-qualify thoroughly, and protect your contracts. Build these relationships with value-first touches and flawless co-marketing on shared files.',
      sectionTitle: 'Core Scripts',
      scripts: [
        { title: 'Day 0 Lender Handoff', script: 'Hey [Lender Name] — I just put [Buyer Name] under contract on [address]. I\'ve already welcomed them and sent a simple roadmap. I\'ll keep you in the loop on every step from my side — inspection, appraisal, repairs, and closing prep. What\'s the best way for us to stay in sync on this one?', tip: 'Copy buyer agent + client on first intro when appropriate.', saveKey: 'Partner: Lender Handoff' },
        { title: 'Monthly Value Touch', script: 'Quick market note for your buyers — inventory in [Area] shifted this month and we\'re seeing more negotiation room. Happy to co-host a buyer Q&A or open house if that would help your pipeline. No pitch, just partnership.', tip: 'Batch for top 5 lenders — personalize area only.', saveKey: 'Partner: Lender Value Touch' },
        { title: 'Post-Close Lender Thank You', script: 'Smooth close on [address] — appreciate how you kept [Buyer] calm and the listing side informed. If you have buyers who need an agent who communicates like this, I\'d love to return the favor.', tip: 'Send within 48 hours while energy is high.', saveKey: 'Partner: Lender Thank You' }
      ],
      proTip: 'Run the 60-Day Partnership Onboarding sequence on your first shared file with any new lender. Over-communication on file one earns you the go-to spot.',
      bridges: [
        { label: '60-Day Onboarding', action: 'play:60-day-realtor-onboarding', primary: true },
        { label: 'Open House Domination', action: 'play:open-house-domination' },
        { label: 'Weekly Value Cadence', action: 'play:weekly-value-cadence' }
      ],
      saveKey: 'Partner-Lenders',
      saveLabel: 'Save Lender Playbook'
    });
  }

  function renderPartnerTitle(contentEl) {
    renderPartnerPlaybook(contentEl, {
      badges: '<span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">CLEAN CLOSINGS</span>',
      whyLabel: 'Clean Closings Start with Title Relationships',
      whyText: 'Responsive escrow officers and title reps who pick up the phone keep your deals on track — and send you referrals when agents in their network need someone reliable. Treat them like VIP partners, not vendors.',
      sectionTitle: 'High-Value Plays',
      scripts: [
        { title: 'Opening Escrow Handoff', script: 'Hey [Name] — putting [address] into escrow with you on [date]. Buyer and seller agents are both copied. Please flag anything you need from my side early — I\'d rather over-communicate than surprise anyone at the table.', tip: 'Set the tone before problems arise.', saveKey: 'Partner: Title Handoff' },
        { title: 'Proactive Status Check', script: 'Quick check on [address] — anything you need from my side before we hit [milestone]? Happy to chase docs or loop in the lender if that helps keep us on track.', tip: 'Agents who prevent surprises earn title referrals.', saveKey: 'Partner: Title Status Check' },
        { title: 'Post-Close Title Thank You', script: 'Thanks for keeping [address] smooth to the finish line. If any agents in your network need someone who communicates and protects the closing timeline, I\'d be honored to help.', tip: 'Title reps remember who made their job easier.', saveKey: 'Partner: Title Thank You' }
      ],
      proTip: 'Invite your top title rep to one client appreciation event per year. They meet your sphere and remember you when agents ask for referrals.',
      bridges: [
        { label: 'Client Appreciation Events', action: 'event:client-appreciation', primary: true },
        { label: 'Relationship Management', action: 'play:relationship-management' }
      ],
      saveKey: 'Partner-Title',
      saveLabel: 'Save Title Playbook'
    });
  }

  function renderPartnerBuilders(contentEl) {
    renderPartnerPlaybook(contentEl, {
      badges: '<span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#002B5C]/10 text-[#002B5C]">NEW CONSTRUCTION</span>',
      whyLabel: 'Why Builders Deliver Predictable Volume',
      whyText: 'Getting on the preferred agent list with even one active builder can give you 10–30+ transactions per year with relatively low relationship maintenance. The key is making their sales team look like heroes and moving buyers from model-home visit to keys faster than any competitor.',
      scripts: [
        { title: 'Sales Team Training Offer', script: 'I\'d love to become a go-to agent for your community. I can offer your sales team a 30-minute lunch-and-learn on how buyers win in today\'s market (with my lender partner covering financing basics), plus a simple one-pager they can keep at their desk. Would next Tuesday or Thursday work for a quick session?', tip: 'Bring lunch — they bring the room.', saveKey: 'Builder: Sales Training Offer' },
        { title: 'Builder Sales Rep Update', script: 'Quick update on [Buyer Name] — they\'re fully pre-approved and we\'re targeting clear to close by [date]. I\'ll keep you posted the moment anything moves so your team can keep the buyer excited and on track.', tip: 'Same-day updates win preferred-agent status.', saveKey: 'Builder: Sales Rep Update' }
      ],
      proTip: 'Be the fastest agent to return calls on builder deals. Offer joint buyer consultations at the model home with your lender partner.',
      bridges: [
        { label: 'Builder Training Play', action: 'play:builder-training', primary: true },
        { label: '60-Day Onboarding', action: 'play:60-day-realtor-onboarding' }
      ],
      saveKey: 'Partner-Builders',
      saveLabel: 'Save Builder Playbook'
    });
  }

  function renderPartnerFinancialPlanners(contentEl) {
    renderPartnerPlaybook(contentEl, {
      whyLabel: 'Why These Partners Send High-Quality Business',
      whyText: 'Financial planners and CPAs work with clients who have real equity and complex needs (investment properties, retirement moves, divorce-related listings, etc.). They refer when they trust you to protect their client\'s wealth and make them look smart.',
      scripts: [
        { title: 'Educational Coffee/Zoom Invite', script: 'I\'d love to be a resource for your clients who are thinking about buying, selling, or using home equity strategically. Would you be open to a 20-minute coffee or Zoom where I can share the current real estate strategies that actually make sense for high-net-worth families right now?', tip: 'No pitch — education only.', saveKey: 'HNW: Educational Invite' }
      ],
      proTip: 'Offer a joint client workshop titled “Downsizing & Equity Strategies for Pre-Retirees.” Co-branded value builds massive trust.',
      bridges: [
        { label: 'Professional Referral Scripts', action: 'play:professional-referral-request', primary: true },
        { label: 'Relationship Management', action: 'play:relationship-management' }
      ],
      saveKey: 'Partner-FinancialPlanners',
      saveLabel: 'Save HNW Playbook'
    });
  }

  function renderPartnerAttorneys(contentEl) {
    renderPartnerPlaybook(contentEl, {
      whyLabel: 'Why Attorneys Are Extremely Loyal When Treated Right',
      whyText: 'Divorce, probate, estate planning, and real estate attorneys send very high-quality referrals. They value protecting their client\'s timeline and looking like the competent professional who chose the right agent.',
      scripts: [
        { title: 'Attorney Handoff + Trust Builder', script: 'I\'ll treat your client like family and keep you copied on every major update so you can focus on the legal side. Here\'s my direct cell if anything comes up on their file — I\'m usually the fastest one to answer on the approved list.', tip: 'Discretion and speed are everything.', saveKey: 'Attorney: Handoff Script' }
      ],
      proTip: 'Create a simple one-page “Agent Handoff Packet” for their office (what you need to list or consult, typical timelines, your direct contact).',
      bridges: [
        { label: 'Professional Referral Scripts', action: 'play:professional-referral-request', primary: true }
      ],
      saveKey: 'Partner-Attorneys',
      saveLabel: 'Save Attorney Playbook'
    });
  }

  function renderPartnerInsurance(contentEl) {
    renderPartnerPlaybook(contentEl, {
      whyLabel: 'Why Insurance Agents Are Natural Partners',
      whyText: 'They already have the home + auto relationship. When you help their clients with a smooth real estate or equity strategy, you become the obvious person they recommend for the next life event.',
      scripts: [
        { title: 'Joint Client Event Invite', script: 'Would you be open to co-hosting a small “Home Protection Night” for some of our mutual clients? I\'ll handle the buying/selling/homeownership side, you cover insurance gaps. Low pressure, good food, and we both look like the helpful team.', tip: 'Pairs with Co-Host for Leverage event play.', saveKey: 'Insurance: Joint Event' }
      ],
      proTip: 'After every smooth closing with their client, send a short text thanking them and offering to loop them in on future home conversations.',
      bridges: [
        { label: 'Co-Host for Leverage', action: 'event:co-host-leverage', primary: true }
      ],
      saveKey: 'Partner-Insurance',
      saveLabel: 'Save Insurance Playbook'
    });
  }

  function renderPartnerOther(contentEl) {
    renderPartnerPlaybook(contentEl, {
      whyLabel: 'The Universal Framework That Works for Any Professional',
      whyText: 'HR directors, relocation companies, wealth managers, etc. The relationship math is the same: deliver exceptional experiences, make them look good, and give them an easy, low-pressure way to refer you when the moment is right.',
      scripts: [
        { title: 'Professional Soft Referral Ask', script: 'If you ever have someone who needs a smooth, low-stress real estate experience, I\'d be honored to help them the way I helped the people you\'ve already sent my way. No pressure at all — just wanted you to know I\'m here.', tip: 'Send after you\'ve delivered value at least once.', saveKey: 'Partner: Soft Referral Ask' },
        { title: 'Discovery Coffee Invite', script: 'I\'ve been working with several [their profession] professionals in [area] and would love 15 minutes to understand the challenges you see most often — and see if there are ways I can support the people you work with. No pitch, just curiosity.', tip: 'Listen 80%, talk 20%.', saveKey: 'Partner: Discovery Invite' }
      ],
      proTip: 'Identify what keeps them up at night, then become the person who removes that friction for their clients. Give before you ask — always.',
      bridges: [
        { label: '60-Day Onboarding', action: 'play:60-day-realtor-onboarding', primary: true },
        { label: 'Weekly Value Cadence', action: 'play:weekly-value-cadence' }
      ],
      saveKey: 'Partner-Other',
      saveLabel: 'Save Outreach Playbook'
    });
  }

  const PARTNER_RENDERERS = {
    'fellow-agents': renderPartnerFellowAgents,
    lenders: renderPartnerLenders,
    title: renderPartnerTitle,
    builders: renderPartnerBuilders,
    'financial-planners': renderPartnerFinancialPlanners,
    attorneys: renderPartnerAttorneys,
    'insurance-agents': renderPartnerInsurance,
    other: renderPartnerOther
  };

  window.renderRichReferralPartner = function renderRichReferralPartner(partnerType, contentEl) {
    const key = normalizePartnerType(partnerType);
    if (!key || !contentEl) return false;
    const fn = PARTNER_RENDERERS[key];
    if (!fn) return false;
    fn(contentEl);
    return true;
  };

  window.getReferralPartnerModalTitle = function getReferralPartnerModalTitle(partnerType) {
    const key = normalizePartnerType(partnerType);
    return key ? PARTNER_TITLES[key] : null;
  };

  // ─── PARTNER TIERS (A+ / B / C) ──────────────────────────────────────
  function renderPartnerTierAPlus(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#002B5C]/10 text-[#002B5C]">TOP 10–20 PARTNERS</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">WHITE-GLOVE CADENCE</span>
      </div>
      ${whyBox('These 10–20 People Fund Your Business',
        'Your true A+ partners send 5+ referrals per year or represent outsized strategic value. They deserve concierge treatment — not because you are desperate, but because protecting this tier is how top-producing agents stay at the top.',
        'navy')}
      ${sectionTitle('How to Identify A+ Partners')}
      ${bulletList([
        '<strong>5+ referrals</strong> to you in the last 12 months (or 3+ with very high-value clients)',
        'They call you <strong>first</strong> — not second or third — when they have a buyer or seller',
        'They introduce you to other top professionals in their network',
        'They invite you to client-facing moments (open houses, closings, builder events)',
        'Losing them would materially hurt your annual business goal'
      ])}
      ${sectionTitle('White-Glove Cadence (Protect at All Costs)')}
      <div class="mb-6">
        ${cadenceCard('Personal call or coffee every 3–4 weeks — not just when you need a referral')}
        ${cadenceCard('Handwritten note or meaningful local gift 3–4 times per year (not generic swag)')}
        ${cadenceCard('Birthday + work anniversary personal video')}
        ${cadenceCard('Same-day updates on every active transaction + proactive check-in when quiet 2+ weeks')}
        ${cadenceCard('First invite to every client appreciation or mastermind event')}
        ${cadenceCard('Year-end personalized video + small gift thanking them for the year')}
      </div>
      ${sectionTitle('Ready-to-Use Scripts (Copy + Save)')}
      <div class="space-y-4 mb-6">
        ${scriptCard('Quarterly Personal Check-In', 'Hey [Partner Name] — just wanted to check in. How is business treating you? Anything coming up I can help with — even if it is just a second opinion on a listing strategy or buyer situation.', 'No ask embedded — pure relationship maintenance.', 'A+ Partner Check-In')}
        ${scriptCard('Proactive Quiet-Period Check-In', 'Hey [Name] — no transaction update today, just checking in. Want to make sure you always know I am here even when things are quiet. Any clients on the horizon I can get ahead of for you?', 'Send when you have not heard from them in 2+ weeks.', 'A+ Partner Proactive Check-In')}
        ${scriptCard('Birthday / Anniversary Video Script', 'Hey [Name] — happy [birthday / work anniversary]! Grateful for our partnership this year. You have sent some amazing clients my way and I do not take that for granted. Hope you get to celebrate properly today.', 'Record 15–20 in one batch for your A+ list.', 'A+ Partner Birthday Video')}
        ${scriptCard('Year-End Thank You', 'As the year wraps up — thank you for trusting me with [X] referrals in [year]. You made every transaction easier and your clients were a pleasure. Excited for what we build together next year.', 'Send first week of December to every A+ partner.', 'A+ Partner Year-End Thank You')}
        ${scriptCard('VIP Event Invite', 'I am hosting a small [event name] next month and you are at the top of my invite list. Would love to have you there — bring a colleague if you want. Low-key, great people, no pitches.', 'Invite 7–10 days before the wider list.', 'A+ Partner VIP Event Invite')}
      </div>
      ${proTip('These partners should feel like you only have five clients total. If you are too busy to nurture A+ relationships, something else on your calendar needs to go — not these touches.')}
      ${bridgeRow([
        { label: 'Partner Mastermind Events', action: 'event:partner-mastermind', primary: true },
        { label: 'Fellow Agent Playbook', action: 'referral:fellow-agents' },
        { label: 'Turn 1 Partner Into 5 More', action: 'play:realtor-to-5-more' }
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
        'B partners send 1–4 referrals per year and show growth potential. Your job is to deliver A+ level service on their referrals while using scalable touches to earn the next one — and eventually promote them to A+.',
        'teal')}
      ${sectionTitle('Promotion Signals (When to Move B → A+)')}
      ${bulletList([
        'They referred you <strong>twice in 6 months</strong> without being asked',
        'They respond to your value touches and engage in conversation',
        'They start calling you before other agents on time-sensitive clients',
        'They attended your event and brought a colleague'
      ])}
      ${sectionTitle('Scalable Growth Cadence')}
      <div class="mb-6">
        ${cadenceCard('Monthly value touch (30-sec market video, useful article, or co-branded asset they can pass along)')}
        ${cadenceCard('Quarterly personal note or small gift')}
        ${cadenceCard('Invite to 1–2 client appreciation or partner events per year')}
        ${cadenceCard('White-glove execution on every referral — treat B partners like A+ on active transactions')}
        ${cadenceCard('Light, natural referral ask after a particularly smooth closing')}
      </div>
      ${sectionTitle('Ready-to-Use Scripts (Copy + Save)')}
      <div class="space-y-4 mb-6">
        ${scriptCard('Monthly Value Touch', 'Quick market note for your clients — inventory in [Area] is up and we are seeing more negotiation room than 90 days ago. Happy to share real comps or tour notes on any active search. No pitch, just data you can use.', 'Batch the body — personalize area only.', 'B Partner Value Touch')}
        ${scriptCard('Post-Smooth-Close Ask', 'Really enjoyed working with you on [Client]. If you have anyone else on the horizon who needs the same experience, I would love to help. Either way — thanks for the referral.', 'Send within 48 hours of closing.', 'B Partner Post-Close Ask')}
        ${scriptCard('Event Invitation', 'Hosting a small client appreciation event next month — would love to have you there. Good food, good people, no business talk. Let me know if you are in and feel free to bring a colleague.', 'Pair with Getting People to Show Up playbook for invites.', 'B Partner Event Invite')}
        ${scriptCard('Quarterly Personal Note', 'Hey [Name] — just a quick note to say I appreciate our partnership. You sent some great referrals my way and I do not take it lightly. Hope Q[X] is treating you well.', 'Handwritten version hits harder for rising B partners.', 'B Partner Quarterly Note')}
      </div>
      ${goalBox('Move 3–5 B partners into A+ every year. The lever is over-delivery on referrals + consistent value between transactions.')}
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
        'New or low-volume sources. You cannot afford heavy one-on-one time on everyone here — but you CAN afford a full audition on the first referral. That single investment separates partners who promote themselves from one-and-done referrals.',
        'orange')}
      ${sectionTitle('Who Belongs in C (For Now)')}
      ${bulletList([
        'Met once at an event — no referral yet',
        'Sent exactly one referral ever',
        'Responsive to email but not yet engaged personally',
        'High potential on paper but unproven in practice'
      ])}
      ${sectionTitle('Efficient Conversion System')}
      <div class="mb-6">
        ${cadenceCard('<strong>Day 0:</strong> Add to CRM + tag as C-tier + add to value newsletter')}
        ${cadenceCard('<strong>First referral:</strong> Run the full 60-day onboarding sequence — treat this like an A+ audition')}
        ${cadenceCard('<strong>Post-close:</strong> If they respond positively → promote to B. If silent → stay on automated touches only')}
        ${cadenceCard('<strong>Quarterly:</strong> One light personal touch to entire C list (batched, 30 min)')}
      </div>
      ${sectionTitle('Ready-to-Use Scripts (Copy + Save)')}
      <div class="space-y-4 mb-6">
        ${scriptCard('Day 0 Welcome (Text or Video)', 'Hey [Partner Name] — [Your Name] here. Thanks for trusting me with [Client Name]. Quick overview of how I work: same-day updates on milestones, proactive check-ins even when quiet, and I will make you look brilliant to your client. Here is my one-pager on my process — reach out anytime.', 'Send same day the referral arrives.', 'C Partner Welcome')}
        ${scriptCard('Post-Close Promotion Check', 'Hope [Client]\'s closing went smoothly on your end too. How did the process feel from your side? If you have anyone else coming up, I would love to deliver the same experience.', 'Their answer tells you B vs stay-C.', 'C Partner Post-Close Check')}
        ${scriptCard('Quarterly Light Touch (Batchable)', 'Hey [Name] — quick quarterly note. Still here if any of your clients need a great agent in [area]. Hope business is good.', 'Personalize name only — send to full C list in one sitting.', 'C Partner Quarterly Batch')}
      </div>
      ${proTip('Do not promote to B based on potential alone — promote based on response. A C partner who engages after a great first referral is your next B partner.')}
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
    renderRichReferralPartner: window.renderRichReferralPartner,
    renderRichPartnerTierModal: window.renderRichPartnerTierModal,
    getReferralPartnerModalTitle: window.getReferralPartnerModalTitle,
    getPartnerTierModalTitle: window.getPartnerTierModalTitle
  };

  window.restoreReferralModals = function restoreReferralModals() {
    const exp = window.__REFERRAL_MODALS_EXPORTS;
    if (!exp) return;
    Object.keys(exp).forEach(function (k) {
      window[k] = exp[k];
    });
  };

  console.log('%c[referral-rich-modals] Premium plays + partner playbooks + tiers ready (' +
    Object.keys(RENDERERS).length + ' plays, ' +
    Object.keys(PARTNER_RENDERERS).length + ' partner types, ' +
    Object.keys(TIER_RENDERERS).length + ' tiers)', 'color:#00A89D');
})();