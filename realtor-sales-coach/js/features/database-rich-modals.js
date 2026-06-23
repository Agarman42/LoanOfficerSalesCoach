/**
 * js/features/database-rich-modals.js
 * Premium modals for Scaling playbooks, A+/B/C client tiers, and 6 Database pillars.
 */
(function () {
  'use strict';

  const SCALING_TITLES = {
    segment: 'Segment Ruthlessly – The 80/20 Database System for 1,000+ Contacts',
    batch: 'Batch & Automate – Systems That Scale Without Losing Heart',
    track: 'Track What Works – Measurement That Actually Drives Decisions'
  };

  const CLIENT_TIER_TITLES = {
    'a-plus': 'A+ Clients — Platinum Tier (Top 30–50)',
    b: 'B Clients — High-Touch Scalable (Next 150–250)',
    c: 'C Clients — Automated + Social (The Rest)'
  };

  const PILLAR_TITLES = {
    'a-plus-vips': 'A+ VIPs — Your Platinum Tier (The 50 Who Fuel Your Business)',
    'past-clients': 'Past Clients — Your Highest-ROI Goldmine',
    'sphere-of-influence': 'Sphere of Influence — Warm & Authentic',
    'referral-partners': 'Referral Partners — Make Them Indispensable',
    'community-connections': 'Community Connections — Become the Local Expert',
    prospects: 'Prospects — Stay Helpful Until They\'re Ready'
  };

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function whyBox(label, text, accent) {
    const color = accent === 'orange' ? '#F15A29' : '#00A89D';
    return `
      <div class="bg-[${color}]/10 border border-[${color}]/30 rounded-3xl p-6 mb-6">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-lightbulb text-[${color}]"></i><span class="font-bold text-[${color}] uppercase tracking-wider text-sm">${esc(label)}</span></div>
        <p class="text-[15px] leading-relaxed">${text}</p>
      </div>`;
  }

  function sectionTitle(text) {
    return `<h4 class="font-bold text-lg mb-3 text-[#002B5C] dark:text-white">${text}</h4>`;
  }

  function bulletList(items, ordered) {
    const tag = ordered ? 'ol' : 'ul';
    const cls = ordered ? 'list-decimal' : 'list-disc';
    return `<${tag} class="text-sm space-y-1.5 mb-6 pl-5 ${cls} text-gray-700 dark:text-gray-300">${items.map((i) => `<li>${i}</li>`).join('')}</${tag}>`;
  }

  function tierCard(title, body, accent) {
    const color = accent === 'orange' ? '#F15A29' : accent === 'teal' ? '#00A89D' : '#002B5C';
    return `
      <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
        <div class="flex items-center gap-2 mb-1"><span class="font-bold text-[${color}]">${esc(title)}</span></div>
        <p class="text-[15px]">${body}</p>
      </div>`;
  }

  function scriptCard(title, script, tip, saveKey) {
    return `
      <div class="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <div class="font-semibold text-sm text-[#002B5C] dark:text-white mb-2">${esc(title)}</div>
        <div class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">"${esc(script)}"</div>
        ${tip ? `<div class="mt-2 text-[10px] text-gray-500">${esc(tip)}</div>` : ''}
        <button type="button" data-db-copy="${esc(script)}"
          class="mt-3 text-[10px] px-3 py-1.5 rounded-xl border border-[#00A89D] text-[#00A89D] hover:bg-[#00A89D] hover:text-white font-semibold transition">
          <i class="fas fa-copy mr-1"></i>Copy script
        </button>
        ${saveKey ? `<button type="button" data-db-save="${esc(saveKey)}" data-db-save-text="${esc(script)}"
          class="mt-2 ml-2 text-[10px] px-3 py-1.5 rounded-xl border border-[#F15A29] text-[#F15A29] hover:bg-[#F15A29] hover:text-white font-semibold transition">
          <i class="fas fa-bookmark mr-1"></i>Save
        </button>` : ''}
      </div>`;
  }

  function proTip(text, accent) {
    const color = accent === 'orange' ? '#F15A29' : '#00A89D';
    return `<div class="p-4 bg-[${color}]/5 border border-[${color}]/20 rounded-2xl text-sm mb-6"><strong>Pro Tip:</strong> ${text}</div>`;
  }

  function calloutBox(title, body) {
    return `
      <div class="p-4 bg-white dark:bg-gray-900 border border-[#00A89D]/40 rounded-2xl text-sm mb-6">
        <strong class="block mb-1 text-[#00A89D]">${esc(title)}</strong>${body}
      </div>`;
  }

  function bridgeRow(buttons) {
    return `
      <div class="flex flex-wrap gap-2 mb-6">
        ${buttons.map((b) => `
          <button type="button" data-db-bridge="${esc(b.action)}"
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
    contentEl.querySelectorAll('[data-db-copy]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-db-copy') || '';
        navigator.clipboard.writeText(text).then(() => {
          const orig = btn.innerHTML;
          btn.innerHTML = '<i class="fas fa-check mr-1"></i>Copied!';
          setTimeout(() => { btn.innerHTML = orig; }, 1600);
        }).catch(() => {});
      });
    });

    contentEl.querySelectorAll('[data-db-save]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-db-save');
        const text = btn.getAttribute('data-db-save-text') || '';
        if (typeof window.toggleSaveIdea === 'function') {
          window.toggleSaveIdea(key, text, btn, 'database-nurture');
        }
      });
    });

    contentEl.querySelectorAll('[data-db-bridge]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-db-bridge');
        if (typeof closeDetailModal === 'function') closeDetailModal();
        if (typeof closeNamedModal === 'function') closeNamedModal('nurture-template-modal');
        setTimeout(() => {
          if (action === 'weekly' && typeof window.showSection === 'function') {
            window.showSection('weekly-win-plan');
          } else if (action === 'referrals' && typeof window.openReferralPartnersTool === 'function') {
            window.openReferralPartnersTool();
          } else if (action === 'referrals' && typeof window.showSection === 'function') {
            window.showSection('referrals');
          } else if (action === 'scripts' && typeof window.showSection === 'function') {
            window.showSection('sales-script');
          } else if (action === 'equity' && typeof window.showSection === 'function') {
            if (typeof window.showSection === 'function') window.showSection('value-vault');
            if (typeof window.openVaultItemWhenReady === 'function') window.openVaultItemWhenReady('annual-home-equity-review');
          } else if (action === 'social' && typeof window.showSection === 'function') {
            window.showSection('social');
          } else if (action === 'segment' && typeof window.showDetailModal === 'function') {
            window.showDetailModal('scaling', 'segment');
          } else if (action === 'batch' && typeof window.showDetailModal === 'function') {
            window.showDetailModal('scaling', 'batch');
          } else if (action === 'track' && typeof window.showDetailModal === 'function') {
            window.showDetailModal('scaling', 'track');
          } else if (action === 'tier-a' && typeof window.openClientTierModal === 'function') {
            window.openClientTierModal('A+');
          } else if (action === 'tier-b' && typeof window.openClientTierModal === 'function') {
            window.openClientTierModal('B');
          } else if (action === 'tier-c' && typeof window.openClientTierModal === 'function') {
            window.openClientTierModal('C');
          } else if (action?.startsWith('pillar:') && typeof window.openDatabaseModal === 'function') {
            window.openDatabaseModal(action.split(':')[1]);
          } else if (action?.startsWith('nurture:') && typeof window.showNurtureTemplateModal === 'function') {
            window.showNurtureTemplateModal(action.split(':')[1]);
          } else if (action?.startsWith('vault:') && typeof window.openVaultItemWhenReady === 'function') {
            if (typeof window.showSection === 'function') window.showSection('value-vault');
            setTimeout(() => window.openVaultItemWhenReady(action.split(':')[1]), 200);
          }
        }, 220);
      });
    });
  }

  // ─── SCALING ─────────────────────────────────────────────────────────
  function renderScalingSegment(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">80/20 DATABASE SYSTEM</span></div>
      ${whyBox('Why Ruthless Segmentation Protects Your Time & Your Results',
        'When your database crosses 500–1,000 contacts, giving everyone "the same amount of love" is the fastest way to burn out. Top producers who scale to 100+ units while keeping sane hours all say the same thing: <strong>you must prioritize finite time on relationships that generate the most referrals, repeat business, and goodwill.</strong> This is strategic generosity — not cold transactionality.',
        'teal')}
      <p class="text-sm mb-4">Assume ~$10,000+ per closed side (commission on a typical transaction). A strong A+ VIP sends 2–5 referrals per year ($20k–$50k+ from one relationship). A C-tier contact might send one referral every 2–3 years. Spending equal time across 1,000 people means your top 50 get ~5% of nurturing attention when they should get 50%+.</p>
      ${sectionTitle('The Three-Tier System (With Recommended Time Allocation)')}
      <div class="space-y-4 mb-6">
        ${tierCard('A+ VIPs — Top 40–60 people (≈50% of personal nurturing time)',
          'Quarterly personal calls or coffees. Handwritten notes + meaningful gifts on anniversaries + birthdays. Immediate life-event response. First access to events. These people send you business because they feel known.', 'teal')}
        ${tierCard('B Tier — Next 150–250 (≈30% of time + high-touch scalable)',
          'Personalized video messages 2–4x/year. Event invites + follow-up. Quarterly value touches. Occasional handwritten note when they engage or refer. Your "rising" relationships.', 'orange')}
        ${tierCard('C Tier — The Rest (20% of time, fully automated + social)',
          'Newsletter monthly or quarterly. Social engagement. Automated birthday/anniversary reminders. They still feel remembered — you protect one-on-one hours for A+ and rising B.', 'navy')}
      </div>
      ${sectionTitle('30-Minute Quarterly Segmentation Ritual')}
      ${bulletList([
        'Export or filter your full database by last close date + referral history + last touch date.',
        'Tag everyone: A+ / B / C. Be ruthless the first time — you can always move people up.',
        'Review: referral in last 18 months? Real personal relationship? Would losing touch hurt business or heart?',
        'Block 30 minutes first week of each quarter. Move 5–10 people up or down based on real behavior.',
        'Document the "why" in a private CRM note.'
      ], true)}
      ${calloutBox('Sample Weekly Time Allocation (1,000+ Database Owner)',
        '4–6 A+ personal calls • 8–12 handwritten notes • 15–20 short personalized videos • 1 client appreciation event focused on A+/top B • Everything else automated or social.')}
      ${proTip('Track referrals by tier for 90 days. The numbers will silence any remaining doubt about where your time belongs.', 'orange')}
      ${bridgeRow([
        { label: 'A+ Client tier playbook', action: 'tier-a', primary: true },
        { label: 'Batch & automate', action: 'batch' },
        { label: 'Weekly Win Plan', action: 'weekly' }
      ])}
      ${nextStepsHtml([
        { label: 'Weekly Win Plan', onclick: "closeDetailModal(); if(typeof window.showSection==='function')window.showSection('weekly-win-plan');", style: 'primary' },
        { label: 'Referral Partners Tool', onclick: "closeDetailModal(); if(typeof window.openReferralPartnersTool==='function')window.openReferralPartnersTool();", style: 'accent' }
      ])}
    `;
    attachHandlers(contentEl);
  }

  function renderScalingBatch(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">MAX IMPACT PER HOUR</span></div>
      ${whyBox('Why Batching Feels Hard at First But Frees You',
        'The highest-ROI nurturing touches (personal videos, handwritten notes, thoughtful gifts) are also the most time-consuming one at a time. Batching protects deep work for A+ relationships while delivering volume touches that keep the rest warm. Goal: maximum impact per hour invested — never zero effort.',
        'teal')}
      ${sectionTitle('The Weekly & Monthly Batch Rituals')}
      <div class="grid md:grid-cols-2 gap-4 text-sm mb-6">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
          <strong class="block mb-1">Sunday 45–90 min "Content + Video Batch"</strong>
          <ul class="mt-1 space-y-1">
            <li>Record 12–20 birthday/anniversary videos (25–45 sec each)</li>
            <li>Write 8–15 handwritten notes while videos render</li>
            <li>Queue value newsletter or market update</li>
          </ul>
        </div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
          <strong class="block mb-1">Monthly Gift & Logistics Batch</strong>
          <ul class="mt-1 space-y-1">
            <li>Order 20–30 meaningful items at once</li>
            <li>Pre-address and label envelopes or boxes</li>
            <li>Outsource mailing if volume justifies a VA 4 hrs/month</li>
          </ul>
        </div>
      </div>
      ${sectionTitle('Tools That Make This Sustainable')}
      ${bulletList([
        '<strong>CRM automation</strong> for birthdays/anniversaries (remind 7 days early so you can batch)',
        '<strong>Loom + phone notes app</strong> for fast personal videos',
        '<strong>Canva + scheduler</strong> for value content to B/C tiers',
        '<strong>Simple VA or spouse help</strong> for physical mailing once a month',
        '<strong>Recurring calendar blocks</strong> labeled "Nurture Batch — Fuel Your Business"'
      ])}
      <div class="space-y-4 mb-6">
        ${scriptCard('25-second batch video template',
          'Hey [Name] — it\'s [Your Name]. Just wanted to wish you a happy [birthday/anniversary]! Hope you and the family are doing great. Thinking of you today.',
          'Pull 10 names from CRM, record all in one sitting. Reference one real detail per person.', 'Scaling: Batch Video')}
        ${scriptCard('Quarterly B-tier check-in (batch text)',
          'Hey [Name] — quick check-in from me. Hope [season/holiday] is treating you well. If you or anyone in your world has real estate questions, I\'m always here — no pitch, just a resource.',
          'Personalize the bracketed part only — body stays the same.', 'Scaling: Batch Check-In')}
      </div>
      ${proTip('Create a "Nurture Batch" playlist with 10–15 favorite 30-second voice memo scripts. Record name + one CRM detail + 25 seconds of heart. Finish 20 in under an hour.', 'orange')}
      ${bridgeRow([
        { label: '21 scalable touches', action: 'nurture:scalable-touches', primary: true },
        { label: 'Track what works', action: 'track' },
        { label: 'Weekly Win Plan', action: 'weekly' }
      ])}
    `;
    attachHandlers(contentEl);
  }

  function renderScalingTrack(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">90-DAY FEEDBACK LOOP</span></div>
      ${whyBox('Why Tracking Turns Good Intentions Into a Real System',
        'Most agents nurture randomly and wonder why results are inconsistent. Scalers run a simple loop: touch → log → review response/referral → double down or cut. You need 3–4 numbers you actually look at every 90 days — not fancy dashboards.',
        'teal')}
      ${sectionTitle('The Only Metrics That Matter')}
      <div class="grid md:grid-cols-2 gap-4 text-sm mb-6">
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
          <strong>Referral Source Quality by Tier</strong><br>
          <span class="text-xs">A+ sent X referrals (avg commission $Y). B sent Z. C sent almost none. Makes segmentation decisions obvious and guilt-free.</span>
        </div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
          <strong>Response & Engagement Rate</strong><br>
          <span class="text-xs">Personal call/video vs mass email. Event attendance by tier. Who replies to handwritten notes? Reveals what actually feels human.</span>
        </div>
      </div>
      ${sectionTitle('Dead-Simple Tracking System')}
      <p class="text-sm mb-4">One Google Sheet or CRM custom fields: <strong>Name | Tier | Last Personal Touch | Last Response | Referrals (12 mo) | Notes</strong>. Spend 10 minutes every Sunday updating the 5–10 people you touched. At quarter start, sort by referrals and response rate. Winners get more of you. Losers get automated.</p>
      ${sectionTitle('Rule of Thumb That Has Saved Hundreds of Hours')}
      <p class="text-[15px] mb-6">Double down on anything that generated a referral or warm conversation in the last 90 days. Ruthlessly reduce or automate anything with zero engagement after 3–4 touches.</p>
      <div class="mt-4 text-xs text-gray-500 mb-6">Producers who review this data quarterly consistently report 2–3x better referral rates from the same size database while working fewer total hours on random nurturing.</div>
      ${bridgeRow([
        { label: 'Segment ruthlessly', action: 'segment', primary: true },
        { label: 'A+ tier playbook', action: 'tier-a' },
        { label: 'Referral flywheel', action: 'vault:referral-flywheel-system' }
      ])}
    `;
    attachHandlers(contentEl);
  }

  // ─── CLIENT TIERS ────────────────────────────────────────────────────
  function renderClientTierAPlus(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#002B5C]/10 text-[#002B5C]">PLATINUM TIER</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">50%+ OF PERSONAL TIME</span>
      </div>
      ${whyBox('Why A+ Clients Are Your Real Business',
        'Strong current relationship + high potential + history of referrals. These 30–50 people generate more closed business than the other 950 combined when nurtured at platinum level. Equal treatment of everyone is malpractice at scale.',
        'teal')}
      ${sectionTitle('Identification Criteria (Be Ruthless)')}
      ${bulletList([
        'Referred you at least once in 24 months OR sent multiple clients historically',
        'Real influence: busy business owners, natural connectors, active sphere members',
        'Genuine personal relationship beyond the transaction (kids\' names, hobbies, challenges)',
        'Losing regular contact would cost meaningful business or relationships you care about'
      ])}
      ${sectionTitle('Platinum Touch Cadence (Minimum)')}
      ${bulletList([
        '<strong>Quarterly personal call or coffee</strong> — zero agenda, listen 80%',
        '<strong>Handwritten note + meaningful gift</strong> on home anniversary',
        '<strong>Birthday video or card</strong> — 30–60 sec, one specific personal detail',
        '<strong>Annual home value check-in</strong> — often triggers move-up, downsizing, or referrals',
        '<strong>1–2 client appreciation events/year</strong> — always allow +1',
        '<strong>Same-day life event response</strong> — be first to show up'
      ])}
      <div class="space-y-4 mb-6">
        ${scriptCard('Platinum call opener',
          'Hey [Name], it\'s [Your Name]. I was thinking about you this morning and realized it\'s been way too long since we caught up. No real estate talk — I just wanted to hear how you and the family are doing. Got 10–12 minutes this week?',
          'End with: "If anything real estate related ever comes up, I\'m always here. No pressure ever."', 'A+ Client: Call Opener')}
        ${scriptCard('Life event text (same day)',
          'Hey [Name] — saw the post about [specific thing]. That\'s awesome / I\'m so sorry / that\'s huge. No agenda, just wanted you to know I\'m thinking about you. If there\'s ever anything I can do to make life easier, just say the word.',
          'Reference something specific from their social post.', 'A+ Client: Life Event')}
        ${scriptCard('Birthday video (30–45 sec)',
          'Happy Birthday [Name]! Hope this year treats you and the family even better than the last. I\'m grateful to have you in my world — not just as a client, but as someone I genuinely enjoy. Here\'s to more [inside reference].',
          'Mention golf, coffee catch-ups, kid sports — whatever is real.', 'A+ Client: Birthday Video')}
      </div>
      ${proTip('Keep a private "human notes" field in CRM: kids\' names, favorite teams, last vacation, biggest challenge. Reference before every touch. After any referral, send high-end thank-you + handwritten note within 48 hours.', 'orange')}
      ${bridgeRow([
        { label: 'A+ VIPs pillar', action: 'pillar:a-plus-vips', primary: true },
        { label: 'Segment ruthlessly', action: 'segment' },
        { label: 'Weekly Win Plan', action: 'weekly' }
      ])}
    `;
    attachHandlers(contentEl);
  }

  function renderClientTierB(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">RISING RELATIONSHIPS</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600">30–35% OF PERSONAL TIME</span>
      </div>
      ${whyBox('Why B Clients Are Your Growth Pipeline',
        'Good relationship or clear potential + some past business or referrals. These 150–250 contacts are where tomorrow\'s A+ list comes from. High-touch but scalable — the goal is moving the best ones up every quarter.',
        'teal')}
      ${sectionTitle('B-Tier Touch Strategy')}
      ${bulletList([
        'Personalized video messages 2–4x per year',
        'Monthly or quarterly value touches (market snapshot for their neighborhood)',
        'Event invites + personal follow-up after attendance',
        'Occasional handwritten note when they engage, refer, or hit a life event',
        'Fast but not concierge-level service on real estate questions'
      ])}
      <div class="space-y-4 mb-6">
        ${scriptCard('Quarterly value video',
          'Hey [Name] — quick market note for [Neighborhood]. Inventory shifted a bit this quarter and I thought of you. Happy to run real numbers on your equity if you\'re curious — no pitch, just data. Hope you\'re doing great!',
          'Pair with a simple chart or 30-sec Loom.', 'B Client: Quarterly Value')}
        ${scriptCard('Event invite follow-up',
          'Great seeing you at [event]! Really enjoyed catching up. If anything comes up for you or anyone in your world, I\'m always here.',
          'Send within 48 hours of any event they attended.', 'B Client: Event Follow-Up')}
        ${scriptCard('Rising-to-A+ notification',
          'Hey [Name] — you\'ve been such a great part of my world this year. I wanted you to know you\'re officially on my inner-circle list now. That just means more personal attention from me, not more sales calls. Grateful for you.',
          'Use when moving someone from B to A+. Deepens loyalty instantly.', 'B Client: Tier Promotion')}
      </div>
      ${proTip('Review B tier every quarter. Anyone who referred, engaged deeply, or showed rising influence gets promoted. Tell them personally when they move up.', 'orange')}
      ${bridgeRow([
        { label: 'Past clients pillar', action: 'pillar:past-clients', primary: true },
        { label: 'Batch & automate', action: 'batch' },
        { label: '21 scalable touches', action: 'nurture:scalable-touches' }
      ])}
    `;
    attachHandlers(contentEl);
  }

  function renderClientTierC(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#F15A29]/10 text-[#F15A29]">MAINTENANCE AT SCALE</span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600">10–15% PERSONAL TIME</span>
      </div>
      ${whyBox('Why C Tier Still Matters (Without Burning You Out)',
        'Low current engagement + low demonstrated potential today — but people move up when life happens. Consistent automated value + social presence is more than 95% of agents ever give anyone. You protect energy for A+ and rising B while C still feels remembered.',
        'orange')}
      ${sectionTitle('C-Tier Touch Strategy')}
      ${bulletList([
        'Newsletter or value email monthly or quarterly',
        'Automated birthday/anniversary reminders → low-effort personal video or text',
        'Social engagement: comments, likes, shares on their posts',
        'Invite to broad events (not inner-circle appreciation dinners)',
        'No one-on-one hours unless they engage or refer'
      ])}
      ${sectionTitle('How to Rank (Simple Quarterly Exercise)')}
      <p class="text-sm mb-3">Score every contact 1–5 on three factors:</p>
      ${bulletList([
        '<strong>Current Relationship Strength</strong> — How warm is the relationship today?',
        '<strong>Relationship Potential</strong> — Life stage, influence, or future needs?',
        '<strong>Past Referrals / Business Sent</strong> — Historical proof they send real business?'
      ])}
      <p class="text-sm mb-6 font-semibold">Total score determines tier. Re-rank every 90 days — people move up and down.</p>
      <div class="space-y-4 mb-6">
        ${scriptCard('Automated birthday text (batch-friendly)',
          'Happy Birthday [Name]! Hope you have a great day. Thinking of you — [Your Name].',
          'Record 15–20 in one Sunday batch. Add one personal detail when possible.', 'C Client: Birthday Text')}
        ${scriptCard('Quarterly newsletter opener',
          'Quick market note for folks in [Area] — here\'s what actually changed this quarter and what it might mean if you\'re watching the market. No pitch — just useful info.',
          'Same body for most C tier; personalize neighborhood name only.', 'C Client: Newsletter Opener')}
      </div>
      ${proTip('Feeling guilty about "neglecting" C tier is normal at first. Remind yourself: consistent automated value is a gift most people never receive. C tier today becomes B or A+ when life happens.', 'orange')}
      ${bridgeRow([
        { label: 'Segment ruthlessly', action: 'segment', primary: true },
        { label: '21 scalable touches', action: 'nurture:scalable-touches' },
        { label: 'Social strategy', action: 'social' }
      ])}
      ${nextStepsHtml([
        { label: 'Weekly Win Plan', onclick: "closeDetailModal(); if(typeof window.showSection==='function')window.showSection('weekly-win-plan');", style: 'accent' }
      ])}
    `;
    attachHandlers(contentEl);
  }

  // ─── DATABASE PILLARS ────────────────────────────────────────────────
  function renderPillarAPlusVips(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#002B5C]/10 text-[#002B5C]">PILLAR 1 • PLATINUM</span></div>
      ${whyBox('Why This Segment Is Everything',
        'Your top 50 people — influential past clients, sphere connectors, referral partners, family, and community leaders — generate more closed business than the other 950 combined when nurtured at platinum level. These relationships send 2–5 referrals per year without you asking.',
        'teal')}
      ${sectionTitle('Identification Criteria')}
      ${bulletList([
        'Referred at least once in 24 months OR multiple clients historically',
        'Real influence in your market',
        'Genuine personal relationship beyond the transaction',
        'Losing contact would cost meaningful business or relationships you care about'
      ])}
      ${sectionTitle('Platinum Touch Cadence')}
      ${bulletList([
        'Quarterly personal call or coffee (15–25 min, listen 80%)',
        'Handwritten note + meaningful gift on home anniversary',
        'Birthday video or handwritten card',
        'Annual home value check-in offer',
        '1–2 client appreciation events per year (+1 always welcome)',
        'Same-day or next-day life event response'
      ])}
      <div class="space-y-4 mb-6">
        ${scriptCard('Platinum call opener', 'Hey [Name], it\'s [Your Name]. I was thinking about you this morning and realized it\'s been way too long since we caught up. No real estate talk — I just wanted to hear how you and the family are doing. Got 10–12 minutes this week?', 'Then listen. End with no-pressure availability.', 'A+ VIP: Call Opener')}
        ${scriptCard('Life event text', 'Hey [Name] — saw the post about [specific thing]. That\'s awesome / I\'m so sorry / that\'s huge. No agenda, just wanted you to know I\'m thinking about you and rooting for you.', 'Same day response.', 'A+ VIP: Life Event Text')}
        ${scriptCard('Birthday video', 'Happy Birthday [Name]! Hope this year treats you and the family even better than the last. I\'m grateful to have you in my world — not just as a client, but as someone I genuinely enjoy.', '30–45 seconds. One inside reference.', 'A+ VIP: Birthday Video')}
      </div>
      ${proTip('Give A+ first access to any new tool, report, or opportunity 48–72 hours before the rest of the database. Once a year ask: "Who are the three people in your world I should know?"', 'orange')}
      ${bridgeRow([
        { label: 'A+ client tier guide', action: 'tier-a', primary: true },
        { label: 'Referral partners', action: 'pillar:referral-partners' }
      ])}
    `;
    attachHandlers(contentEl);
  }

  function renderPillarPastClients(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">PILLAR 2 • HIGHEST ROI</span></div>
      ${whyBox('Why Past Clients Convert So Well',
        'They already trust you. They\'ve seen you deliver under pressure. Systematic, relevant, human touches here beat almost any other lead source on ROI — often 5–10x.',
        'teal')}
      ${sectionTitle('Non-Negotiable Annual Touches')}
      ${bulletList([
        '<strong>Home Anniversary</strong> — Handwritten card + gift + neighborhood market snapshot. Often triggers move-up, downsizing, or referrals.',
        '<strong>Birthday</strong> — Short personal video or nice card with one specific reference.',
        '<strong>2–3 additional personal touches</strong> — life events, holiday gift, market value check-in when inventory shifts.',
        '<strong>Annual Home Value Check-In</strong> — Many clients explore selling, move-up, or investing when they see updated numbers.'
      ])}
      <div class="space-y-4 mb-6">
        ${scriptCard('Anniversary card / video', '[Name], I can\'t believe it\'s already [X] years since you got the keys! Hope the house is still treating you well. I pulled a quick update on values in your neighborhood — happy to hop on a 10-minute call if you\'re curious what your equity looks like. No strings attached.', 'The single most powerful touch.', 'Past Client: Anniversary')}
        ${scriptCard('Market value check-in (inventory shifted)', 'Hey [Name], the market in your neighborhood has shifted a bit since we closed. If you\'ve thought about selling, moving up, or just want to know what your home is worth today — I\'m happy to run real numbers. No pitch, just information. Takes 8 minutes.', 'Send when local inventory or values move meaningfully.', 'Past Client: Market Value Text')}
      </div>
      ${proTip('Segment by years since close + move-up potential + investor vs primary. Never send the same generic anniversary card — reference something specific from their file.', 'orange')}
      ${bridgeRow([
        { label: 'Anniversary nurture template', action: 'nurture:anniversary', primary: true },
        { label: 'Annual equity review', action: 'equity' }
      ])}
    `;
    attachHandlers(contentEl);
  }

  function renderPillarSphere(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">PILLAR 3 • WARM & AUTHENTIC</span></div>
      ${whyBox('Why Your Sphere Still Matters',
        'Friends, family, old coworkers, neighbors, parents from kids\' sports — they already like and trust you. Your job is keeping the association top-of-mind without being salesy. Perfect for personal + social nurturing that costs very little time per person.',
        'teal')}
      ${sectionTitle('Touch Strategy')}
      ${bulletList([
        '2–3 personal touches per year (notes, short videos, meaningful social comments)',
        'Share personal + local content on social they actually see',
        'Occasional useful value shares (market snapshot, contractor referral)',
        'Invite to one client appreciation event per year',
        'Immediate warm response to any life event'
      ])}
      <div class="space-y-4 mb-6">
        ${scriptCard('Life event / big news congrats', 'Hey [Name]! Saw your post about the new job / grandbaby / move / big win — huge congrats! If housing or real estate questions ever come up, I\'m always happy to be a resource (no pitch, just here if you need me or anyone in your world does).', 'Low pressure. High authenticity.', 'Sphere: Life Event Congrats')}
      </div>
      ${proTip('Post consistently on social with personal + local content — free, high-leverage nurturing for your entire sphere at once. Use social comments as your main touch for most of sphere.', 'orange')}
      ${bridgeRow([
        { label: 'Social strategy', action: 'social', primary: true },
        { label: '21 scalable touches', action: 'nurture:scalable-touches' }
      ])}
    `;
    attachHandlers(contentEl);
  }

  function renderPillarReferralPartners(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">PILLAR 4 • GROWTH ENGINE</span></div>
      ${whyBox('Why This Is Your Real Growth Engine',
        'Fellow agents, lenders, builders, financial planners, and attorneys who regularly send you referrals are the A+ VIPs of your actual business. Value-first, ridiculously consistent, always making their life easier. Focus 80% of partner energy on the 10–15 who actually send business.',
        'teal')}
      ${sectionTitle('Core System (Quarterly + Trigger-Based)')}
      ${bulletList([
        'Quarterly high-value touch (gift, co-marketing, lunch, mastermind invite)',
        'Immediate thank-you + status update every time they send a client (within 24 hours)',
        'Regular value they can forward (market reports, buyer/seller one-pagers)',
        'Real personal relationship (kids, goals, challenges, wins)'
      ])}
      <div class="space-y-4 mb-6">
        ${scriptCard('Just-because note to top lender partner', '[Name] — saw we just closed that tricky one on Maple together. You handled your side like a pro. Dropping off a little something to celebrate. Let me know how I can make the next one even smoother for you and our mutual clients.', 'Handwritten or text + small gift.', 'Partner: Just Because Note')}
      </div>
      ${proTip('Never ask for referrals in the first 3–6 months of a new partner relationship. When they send a file, treat the client like gold and over-communicate back to the partner.', 'orange')}
      ${bridgeRow([
        { label: 'Referral Partners Tool', action: 'referrals', primary: true },
        { label: 'Lender partner onboarding process', action: 'nurture:referral-ask' }
      ])}
      ${nextStepsHtml([
        { label: 'Open Referral Partners Tool', onclick: "closeDetailModal(); if(typeof window.openReferralPartnersTool==='function')window.openReferralPartnersTool();", style: 'primary' }
      ])}
    `;
    attachHandlers(contentEl);
  }

  function renderPillarCommunity(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#00A89D]/10 text-[#00A89D]">PILLAR 5 • LOCAL EXPERT</span></div>
      ${whyBox('Why Local Network Pays Off at Scale',
        'Small business owners, school parents, HOA leaders, charity organizers, local real estate-adjacent pros. When you become known as the helpful, generous, never-pushy agent in your town, business flows without chasing.',
        'teal')}
      ${sectionTitle('How to Nurture (High Visibility, Low Time)')}
      ${bulletList([
        'Local business spotlights on social (tag them — they repost)',
        'Attend and support 2–3 community events per quarter',
        'Offer simple value (first-time buyer workshop, HOA lunch & learn, contractor list)',
        'Occasional notes or gifts to 5–10 key connectors who cross your path repeatedly'
      ])}
      ${proTip('Pick 3–5 organizations or neighborhoods and go deep instead of spreading thin. Always give more than you take at events. Tag every local business you spotlight — reciprocity compounds.', 'orange')}
      ${bridgeRow([
        { label: 'Social strategy', action: 'social', primary: true },
        { label: 'Event planning', action: 'weekly' }
      ])}
    `;
    attachHandlers(contentEl);
  }

  function renderPillarProspects(contentEl) {
    contentEl.innerHTML = `
      <div class="mb-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-[#F15A29]/10 text-[#F15A29]">PILLAR 6 • SILENT REVENUE</span></div>
      ${whyBox('Why You Must Nurture Prospects',
        'People who inquired, got pre-qualified, or were actively looking but didn\'t move forward. If you disappear, they use whoever is in front of them when ready — often 6–24 months later. Stay the helpful expert and you win the business and their referrals.',
        'orange')}
      ${sectionTitle('Light, Valuable Cadence (Never Salesy)')}
      ${bulletList([
        'Monthly or quarterly value email (market update for their price range)',
        'Occasional personal check-in only if you had a real conversation',
        'Invite to first-time buyer or educational events',
        'Warm response to life events through social or mutual connections'
      ])}
      <div class="space-y-4 mb-6">
        ${scriptCard('Market-timing check-in', 'Hey, just thinking about you — inventory shifted a bit in your price range. Happy to share what\'s actually out there if the timing feels better now. No pressure at all.', '20-sec video or short text. Only if you had a real conversation.', 'Prospect: Market Check-In')}
      </div>
      ${proTip('Segment by buyer readiness stage (pre-qualified, actively looking, paused/searching, timing-sensitive). Track last touch so no one falls through for 9+ months.', 'orange')}
      ${bridgeRow([
        { label: 'Sales scripts', action: 'scripts', primary: true },
        { label: '21 scalable touches', action: 'nurture:scalable-touches' }
      ])}
    `;
    attachHandlers(contentEl);
  }

  const SCALING_RENDERERS = {
    segment: renderScalingSegment,
    batch: renderScalingBatch,
    track: renderScalingTrack
  };

  const CLIENT_TIER_RENDERERS = {
    'a-plus': renderClientTierAPlus,
    b: renderClientTierB,
    c: renderClientTierC
  };

  const PILLAR_RENDERERS = {
    'a-plus-vips': renderPillarAPlusVips,
    'past-clients': renderPillarPastClients,
    'sphere-of-influence': renderPillarSphere,
    'referral-partners': renderPillarReferralPartners,
    'community-connections': renderPillarCommunity,
    prospects: renderPillarProspects
  };

  function normalizeClientTierKey(tier) {
    const t = String(tier || '').trim().toLowerCase();
    if (t === 'a+' || t === 'a plus' || t === 'a-plus' || t === 'aplus') return 'a-plus';
    if (t === 'b') return 'b';
    if (t === 'c') return 'c';
    return null;
  }

  window.renderRichScalingModal = function renderRichScalingModal(key, contentEl) {
    if (!key || !contentEl) return false;
    const fn = SCALING_RENDERERS[key];
    if (!fn) return false;
    fn(contentEl);
    return true;
  };

  window.renderRichClientTierModal = function renderRichClientTierModal(tier, contentEl) {
    const key = normalizeClientTierKey(tier);
    if (!key || !contentEl) return false;
    const fn = CLIENT_TIER_RENDERERS[key];
    if (!fn) return false;
    fn(contentEl);
    return true;
  };

  window.renderRichDatabasePillarModal = function renderRichDatabasePillarModal(key, contentEl) {
    if (!key || !contentEl) return false;
    const fn = PILLAR_RENDERERS[key];
    if (!fn) return false;
    fn(contentEl);
    return true;
  };

  window.getScalingModalTitle = function getScalingModalTitle(key) {
    return SCALING_TITLES[key] || null;
  };

  window.getClientTierModalTitle = function getClientTierModalTitle(tier) {
    const key = normalizeClientTierKey(tier);
    return key ? CLIENT_TIER_TITLES[key] : null;
  };

  window.getDatabasePillarModalTitle = function getDatabasePillarModalTitle(key) {
    return PILLAR_TITLES[key] || null;
  };

  window.openClientTierModal = function openClientTierModal(tier) {
    const key = normalizeClientTierKey(tier);
    if (!key) return;
    if (typeof window.showDetailModal === 'function') {
      window.showDetailModal('client-tier', key);
      return;
    }
    console.warn('[database-rich-modals] showDetailModal not ready for client tier');
  };

  window.__DATABASE_MODALS_EXPORTS = {
    renderRichScalingModal: window.renderRichScalingModal,
    renderRichClientTierModal: window.renderRichClientTierModal,
    renderRichDatabasePillarModal: window.renderRichDatabasePillarModal,
    getScalingModalTitle: window.getScalingModalTitle,
    getClientTierModalTitle: window.getClientTierModalTitle,
    getDatabasePillarModalTitle: window.getDatabasePillarModalTitle,
    openClientTierModal: window.openClientTierModal
  };

  window.restoreDatabaseModals = function restoreDatabaseModals() {
    const exp = window.__DATABASE_MODALS_EXPORTS;
    if (!exp) return;
    Object.keys(exp).forEach(function (k) {
      window[k] = exp[k];
    });
  };

  console.log('%c[database-rich-modals] Premium scaling + tiers + pillars ready (' +
    Object.keys(SCALING_RENDERERS).length + ' scaling, ' +
    Object.keys(CLIENT_TIER_RENDERERS).length + ' tiers, ' +
    Object.keys(PILLAR_RENDERERS).length + ' pillars)', 'color:#00A89D');
})();